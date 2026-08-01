# Project status & pick-up guide

Last updated: 2026-07-31, at **v0.51.0**. This is the single document to
read (alongside `CLAUDE.md`) to resume work with full context.

## Where things stand

Diorama is feature-complete through TWO arcs — the Sims-2000 arc
(`docs/DESIGN-sims.md`, 7 phases) and the World Outside arc
(`docs/DESIGN-world.md`, 8 phases: BLE identity/trilateration/fusion, pet
rigs, GPS geo-calibration + pins, weather core + 3D effects) — plus the
post-arc batches listed below. Everything is merged to `main`, pushed to
**both remotes**, released through **v0.20.0**, and deployed to the live HA
instance.

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
  refresh) → v0.12.0 the living house (avatar faces + pants + fidgets +
  bubble pools, seating claims/multi-seat/front-entry, respawn re-roll,
  motion demo mode, local control of unbound objects, sidebar mmWave
  fixes + zone input gating, floor-size lock, glass-house transparency)
  → v0.13.0 the connected house (floor ordering/disable, thought-bubble
  weather/social/trigger tiers + forecast, device bindings: appliance
  in-use / fridge door / door lock / alarm keypad, smoke-CO-gas-leak
  safety sensors, appliance door animation, robot vacuum + mower with
  GPS and Roborock live position, weather W3 per-effect visuals +
  true sun, presence zones, geo event pins, camera fixtures, battery +
  power + occupancy layers, garage doors + blinds + doorbell pulses,
  now-playing, plumbob colors, nav wall-LOS fix, cinematic orbit)
  → v0.14.0 curb appeal (continuous single-mesh walls — translucent
  seam fix, interactive two-sided door locks, oven temp binding +
  click-open door, background-image bug fixes, curbside trash/recycle
  bins, floodlight kind, camera alert snapshot popups, yard arc:
  ground coverings + nine outdoor objects + sittable lawn chair +
  3D grid layer toggle)
  → v0.15.0 packs & portals (the avatar-packs arc: loadable/unloadable
  avatar packs with a declarative spec + registry, core default avatar,
  tabbed settings drawer with pack manager + JSON import/export, sidebar
  scene3d/weather/data sections relocated; 57 built-in packs / 471
  avatars incl. 9 base groups + 24 franchise packs + Avatar (Pandora);
  AUTHORING.md pack-authoring reference; rig extensions: new anchors,
  cylinder/oval heads, masked faces, opacity, hover, per-limb colors,
  posture, parameterized quadruped; avatar-nav-stairs complete:
  descending-stairs walking below floor level with nav rails +
  descend/emerge behaviors, floor-void polygons blocked in nav with
  stairs bridging, linked stairs + BLE cross-floor transits + glass-house
  transit puppet)
  → v0.16.0 roam free (persistent roaming AI avatars with motion-sensor
  avatar-pool selection + interior-activity bias; multiple configurations
  — registry with save/save-as/rename/import-adds/delete + last-active
  restore; self-contained export envelope incl. user avatar packs;
  offline standalone mode — LocalApi over localStorage, auth-screen
  offline path, index.html runs fully outside Home Assistant)
  → v0.17.0 picture day (docs-gallery pipeline: scripted per-model GIF
  documentation site, 592 GIFs across 14 pages + avatar sections per
  pack, hosted at pwsh.github.io/diorama via gh-pages; two visual QA
  rounds: neck-fastened cape primitive, humanoid posture flattening, size
  clamps + two animal reduction passes, dryer door/rocking chair/swingset/
  bin-lid fixes, princess hair, capture facings + speeds; DC Batman pack
  + LEGO Batman — 58 packs / 482 avatars; plumbob defaults to the source
  identity color for sensor attribution)
  → v0.18.0 open house (unified docs site: home + 8-page guide + models
  gallery + floor-plan library of 12 importable demo homes with a
  scripted screenshot pipeline; per-config notes; deferral list cleared
  — table-chair group moves, live mount parenting, 2D recipe
  projections, privacy mosaic, toon-converted OBJ imports, fireplace/
  dance/window-gaze idle activities; Display & Controls arc — InfoCards,
  action buttons, logical-state lights, weather forecast strips +
  alerts; HVAC thermostat fixture w/ vent airflow, display-only locks;
  home theater — projector + bias light + speakers/recliners/riser;
  staged phases 1–4 — sirens, UV, garage car + EV charging, mailbox,
  event thought bubbles, water valves + smart plugs, sky dome w/ sun/
  moon/stars, avatar rig gaps incl. animate channels + hop/knuckle
  gaits; equine mane fix)
  → v0.19.0 ground truth (phase 5 — direct-MQTT bridge with Frigate
  camera-calibrated ground-truth targets + identity fusion and Valetudo
  room-map overlay w/ tap-to-clean; per-room temperature heat-map; alert
  center + beacons; wall calendar + news/weather TV surfaces; avatar
  decals/prints/text + two-handed props; fan spin/direction refinements;
  plant droop; background text (skywriting/banner/grass); "New…" fresh
  configuration; Sweet Home 3D structural import — auto floors/walls/
  rooms/openings from .sh3d)
  → v0.20.0 a mind of their own (undo/redo history + Delete-key
  selection deletion incl. polygon vertices; avatars interact with
  unbound devices — session-only flips with cooldowns + time-of-day
  sense — and contemplate bound-device status in thought bubbles).
  → v0.21.0 dressed for the occasion (avatar costume swaps — overlay
  look variants auto-triggered by sleep/exercise/kitchen-work with a
  sparkle; sky fixes — skywriting at plane altitude, dome recenters on
  camera so zoom-out never shows the globe; docs-site guide refreshed
  current through v0.21).
  → v0.22.0 creature comforts (terrain program T1–T4 — terraces, yard
  fill, fences/gates, sprinklers, water life, path ribbons, pool/spa;
  Fallout/Sesame Street/WALL-E franchise packs; sinks v2 with basins +
  running water; shared avatar props (13, chores/snacks/umbrella/fetch)
  + iconic-prop audit (wands→minigun, 62 capes sway); climate
  appliances (AC/floor fans/heaters/exhaust); multi background-text
  with message train + news chopper; HA menu button far-left).
  → v0.23.0 curb appeal (visual placement toolbar — bottom dock w/ real
  3D thumbnails + variant chips; grey translucent windows + curtains
  (roman/drape/split, entity-bound); inground uplight + aimable ground
  spot; yard flagpole w/ 16-flag library + FLAGS.md; tank-style mower +
  robot progress lights; swingable swingset, bathtub/toilet water,
  appliance interiors, speaker contrast, mailbox flag semantics,
  bird-bath water; aircraft fixes — tow wire, true propeller,
  both-sides banners).
  → v0.24.0 true north (camera far-plane fix — zoom-out disappearances;
  chopper leading-corner tow, ×1.8 train, multi-line fit-to-area grass
  text, lighter skywriting; on-screen 3D compass — landmark/manual
  north, chip-style anchoring, sizable two-tone north icon; floor-stats
  readout toggle; plan rotation 15°/1° to set a new top; ruler tool w/
  live object-locked inside dimensions; wall/structure dimension modes;
  GPS readouts follow imperial; landmark coords visible).
  → v0.25.0 night sky (astronomically-correct constellations + planets
  + real moon position from your location; horizon star-ring cleanup;
  floor list highest-story-first; move-plan nudges; show/peek/hide
  floor tri-state w/ 2D onion-skin underlay; glass-house registers
  ghosts by shared world origin + sees through ground/void/water;
  zoom-independent weather fog; entity text no longer truncated at
  colons/dashes + bgtext format UI; backspace-in-name-field no longer
  deletes the sensor).
  → v0.26.0 open house (live editable demo on GitHub Pages — the full
  app runs client-side in offline mode, zero-install, seeded with all
  12 demo homes; camera below-horizon orbit + independent H/V field of
  view).
  → v0.27.0 cards on the table (Lovelace card — Diorama addable to any
  dashboard, shared kiosk-locked planner, per-card view/mode/compact;
  record-a-position boundary pins w/ convert-to-ground-area; docs tiles
  deep-link into the live demo incl. the `?model=` Model viewer; legacy
  avatar migration — all 24 base kinds declarative, imperative path
  deleted, zero visual drift; fix batch — 45 invisible neck accessories
  + necktie/cone bugs, 11/13 props re-oriented (no-wrist root cause) +
  broom/shovel handle attachment, all 12 demo floorplans re-validated
  for doorway clearance/wall overlap/nav reachability/chair facing).
  → v0.28.0 meet the neighbors (roadmap P5 — OpenFreeMap/OSM
  neighborhood overlay: zero-dep hand-rolled MVT vector-tile decoder,
  toon-extruded surrounding buildings + roads/water/landuse positioned
  by the GPS landmark fit, sidebar alignment nudges + vertical scaling
  + user-drawn exclusion polygons, 30-day IndexedDB tile cache w/
  fetch/extract separation, OSM attribution chip, Settings ▸
  Integrations enablement).
  → v0.29.0 cleared for takeoff (roadmap P4 — live ADS-B aircraft in
  the 3D sky via airplanes.live / local receiver / HA-entity proxy,
  compressed distance+altitude display shell, prop/jet/heli models w/
  callsign tow banners + cel-shaded labels showing real altitude,
  dead reckoning between polls, ISS tracking via wheretheiss.at,
  low-overflight/watch-list/ISS-rise alerts in the alert bell +
  flyover thought bubbles, airplanes.live attribution; GPS landmark
  CSV import — label/lat/lon columns, fit-poisoning guard via
  pendingPlace pins excluded from the calibration until placed).
  → v0.29.1 steady skies (fix: routine flight/ISS polls no longer bump
  configRev — an 8 s poll was rebuilding every configRev-keyed 3D
  group, visibly resetting weather particles + the decorative
  plane/train; polls are live-path now, regression-pinned).
  → v0.30.0 around the block (neighborhood draw distance to 3 km —
  dynamic camera frustum w/ exact stock restore, radius-scaled
  building/road caps; 6 showcase floorplans: appliance showroom,
  garden center, interior design studio, pocket zoo w/ confined
  animal avatars, underground hangout, starship deck — 18-plan
  library 399/399; docs overhaul: guide refreshed v0.22→v0.29 w/ 2
  new pages + 9 scripted feature screenshots (features.mjs), model
  gallery recaptured at current designs incl. 6 never-captured light
  kinds + siren + gate, floorplan captures refreshed, per-plan demo
  links verified).
  → v0.31.0 traffic in sight (the flight arc matured across 6 user
  batches: extended ADS-B fields + 184-designator archetype table w/
  8 aircraft silhouettes, status beacons (emergency/interesting/
  military/LADD), privacy dimming, label-field customization,
  elevation-true altitude cap + 6500 mm property-clearance floor +
  shell rescale ×5 (7 nm ⇒ 76 m out), livery text (operator flanks +
  spine identification), optional tow banners, clickable aircraft
  detail card, fog-exempt flight materials; default radius 15 nm;
  camera-distance-tracking frustum (horizon no longer clips on
  zoom-out) w/ per-source nbhd/flights requirement union; GPS
  landmark alignment tools: per-pin exclusion + residual readout +
  suggested-position ghost/apply; floor-switch view retention (2D
  pan/zoom + 3D camera compensation); 10 mechanical appliance kinds
  (water heater, air handler, radiators, boiler, condenser, heat
  pump, pumps w/ flowing water, 3D printer w/ live print progress)).
  → v0.32.0 down to earth (sky/weather honesty fixes: cloud shadows
  darken instead of rendering white (colorSpace lift), sun disc reads
  as warm additive glare instead of a flat ball, constellations fully
  gated to darkness via live sun elevation (overcast-day dusk-preset
  leak); sun-disc per-effect toggle; adjustable ground level —
  Scene3D.groundLevelMm shifts grid + neighborhood + yardFill vs the
  slab, yard avatars settle onto the lowered grade).
  → v0.33.0 groundskeeping (ground level part 2: every free-standing
  outdoor thing follows the grade — grass writing, furniture w/
  correct outdoor seating, yard lights, areas/terraces/pools,
  flagpoles, robot docks, cameras, GPS pins, train rails, aircraft
  AGL; chopper banner hangs from its leading corner; bg-text rigs no
  longer reset on config churn (consumption-hashed key + persistent
  phase); message-plane aircraft picker (8 archetypes tow the banner)
  + independent model-size knobs for message rigs (0.5–5×) and ADS-B
  traffic (0.5–4×)).
  → v0.34.0 signal lights (configurable aircraft glow rules — ordered
  first-match-wins list, 7 aviation-grounded patterns (solid/flash/
  strobe twin-pop/rotating-beacon never-dark/fade/alternate/mute) ×
  ≤2 colors, wildcard + range + flag criteria, regex-injection-safe,
  emergency always wins; radius-anchored distance mapping — d=radius
  renders AT the rim near the horizon, ⅔ radius at the midpoint,
  P = ln2/ln1.5 derived from the user's anchors, radius-invariant;
  rim aircraft read small (scale gain 2.2→0.8)).
  → v0.35.0 within reach (user-definable flight draw radius —
  FlightsConfig.shellRadiusM 60–1000 m default 300 = 2.5× the old
  fixed 120 m shell, whole display a similarity transform so apparent
  sizes/angles hold, clearMm floor stays absolute, frustum tracks;
  phone taps on planes fixed — touch-aware 3D tap gate 12 px/600 ms +
  screen-space nearest-aircraft fallback pick 28 px, fixtures always
  win; Settings ▸ Connection "About Diorama" footer w/ purpose
  summary + docs/repo/changelog links, all UI modes).
  → v0.36.0 down the street (card visual-editor "No type provided"
  fix — type survives the round-trip; card designer controls —
  layers preset dropdown + Custom… multi-select grid, card-local
  Scene (3D) overrides (glass house/cutaway/auto-follow/cinematic/
  sims cam/plumbobs/sky backdrop/FOV); new Background text layer;
  attribution chip follows the neighborhood/flights layers;
  piecewise-linear flight distance mapping — near field proportional
  (6.5 nm → 97 m not the backyard, 2 nm → 30 m not over the house),
  anchors bit-exact, draw-radius knob made genuinely perceptible).
  → v0.37.0 lay of the land (fixed world ground plane — per-floor
  Floor.elevationMm w/ auto story stacking, one effGroundMm injection
  site, elevation-driven ghost stack, camera dy compensation on floor
  switches, flight shell anchored to grade; yard walls/fences/gates
  follow the grade via wallSegmentInLoops loop-membership; terrace-
  first _itemGroundY — free-standing items settle onto sunken/raised
  yard areas, enclosure-based groundAreaSkirtBase; central camera
  pivot + pivot-lock × free-movement matrix w/ custom rigid rotate
  gesture; focusin cooling — renaming can't delete the selection;
  camera-facing grass bg-text).
  → v0.38.0 set in stone (stairs rise + fit-between-levels — per-piece
  Rise (mm), stairsTreadCount(depth, rise) one-rule 1–2-step short
  flights, ⇅ autofit via resolveItemGroundMm w/ auto-180°, new ramp
  FurnitureKind w/ linear _groundYAt slope; ground writing — area-bound
  bg-text truly clipped to the area's polygon, transparent texture over
  the area's own material, groundTextInk per-kind palette, camera-facing
  via texture rotation, "Ground writing" label).
  → v0.39.0 open air (stairs/ramp sides removed — curbs + sunken shaft
  walls gone; Furniture.stairsOpen "Open underneath" floating slabs
  w/ bit-identical top surfaces; ground-writing faceCamera toggle +
  static rotationDeg via pure bgGroundFixedYaw).
  → v0.40.0 measure twice (live drag dimension chips via
  liveDimChips; five tree species + Furniture.ht tree height; door
  swing-arc side/seam fix; five new door kinds + open-door
  closed-span hint + closed-span hitDoor; wall editing prefs —
  angle/grid/weld toggles + Alt free placement).
  → v0.41.0 fresh bearings (vite 8.1.5 + three 0.185.1 gated bump —
  nine renderer pages verified; docs/TECH-DEBT.md audit + execution
  plan; TS held at 5.9 pending the 6.x bridge evaluation).
  → v0.42.0 bridge line (TypeScript 6.0.3 — the last JS-based
  compiler release, staged for the Go-native 7.0; one-line mqtt-ws
  send-typing fix; explicit types/rootDir keys).
  → v0.43.0 house in order (tech-debt DO-ACTION list complete —
  bundles hygiene, hitDoor one-resolver, README refresh, localstate
  16/16, flight-resolver hoist, tree model docs, nav-parity guard
  catching two real validator divergences; HA floor/area → room
  binding + area-filtered occupancy/env/thermostat pickers).
  → v0.44.0 need to know (labels layer covers area/pool names; NEW
  objectLabels/openings/peekFloors keys; 6-category layer panel from
  one catalog; 2D floor finally paints look3d/scene3d color+texture
  — a day-one gap, not a regression).
  → v0.45.0 open house (TypeScript 7.0.2 Go-native — zero changes,
  typecheck ~6×; docs campaign: 11 guide pages refreshed, showroom
  rebuilt 20×14 m, 96/96 · 26/26 · 8/8 catalog coverage across 18
  plans, gallery 675/675 GIFs + 512/512 avatars, 70/70 screenshots,
  gh-pages published).
  → v0.46.0 status report (openingStatus layer switch — door/window
  OPEN/closed/% badges under Labels, fixtureCaption showBadge
  4-way matrix, empty-pill fix).
  → v0.47.0 spit and polish (plan wall-intersection sweep + validator
  check 13 + showroom 17/43 lights; orientation-gated avatar
  interactions + tend_plant pose; glass-break sensor, spreading leak
  puddle, gate fence gaps, bay/bay_bench windows; mower bicycle
  model, mailbox flag spec, bathroom water set + gallery twins;
  sidebar reorg (Floor tools, collapse-all, grouped Tools, hotkey
  master switch) + polish wave 2 (Floor Plan settings tab, glass
  emboss/deboss headers, armed-variant tool hints)).
  → v0.48.0 vapor trails (five-band flight speed visualization +
  independent height scale; trail tail-exit anchoring w/ aftZ;
  ground writing true overlay everywhere w/ surface-derived ink;
  left-anchored 40px toolbar handle, one-line mmWave title,
  6px collapsed-pill rhythm).
  → v0.49.0 steady on (flight feed-latency guard — stale fixes
  absorbed by speed trim, plane never slides backwards; forward-only
  ease backstop; contrail min-segment gate + arc-length ramp — no
  more fold-back or flag-flap).
  → v0.50.0 home position (3D boot-framing fix — the camera was
  never framed to the real floor, a fixed ~10.8 m pose served every
  load; resolveBootPose ladder + 20 s reframe latch; device-local
  view persistence for 2D pan/zoom + 3D camera, config+floor keyed,
  kiosk tablets restore).
  → v0.51.0 docking maneuvers (robots get their own view layer, a
  position-info overlay with a reported-position crosshair, manual
  calibration nudges + a mower GPS trim, a one-click mower
  calibrate-to-dock, dock rotation with a front indicator in both
  views, and a heading-rotated rectangular 2D mower body matching
  the 3D box).

### Shipped since the DESIGN-sims arc (reverse order)

- **Config-channel churn reduction** (2026-08-01, the follow-up flagged
  by the wall-flash investigation; unreleased — on main past v0.51.0).
  The blanket "`number.*`/`switch.*` always slow-path" rule in
  `_isSlowEntity` is replaced by a membership set: `_slowIdSet` (every
  bound entity id swept from the whole store, all floors + store-level
  configs, rebuilt lazily on configRev + forced in save()) plus
  `_slowIdPrefixes` (`number./switch.<deviceSlug>_` per bound mmWave
  sensor — a discBy sweep would have broken zoneCache sync since
  discovery synthesizes zone ids from slugs on demand). Unrelated
  house entities no longer bump configRev → no more idle full-floor
  3D rebuilds. Also: printProgressEntity bucketed to 2% in the
  appliance hash. Audit finding left for follow-up: `_keyPool` folds
  waterTempEntity's RAW state (0.1° chatter re-keys the pool rebuild;
  the temp may not even render in 3D — drop or bucket to 0.5°). New
  churn-test 48/48; config 60/60, undo 44/44, robot 168/168, flights
  686/686, weather 200/200 unchanged.
- **Sidebar header no-jump fix** (2026-08-01, user-reported "expanding
  a section restores the space above/below and the header jumps";
  unreleased — on main past v0.51.0). The 3 px vertical padding moved
  to the BASE .section rule (both states, no divider in either) so a
  toggled header stays put; expanded adds only padding-bottom 8px
  below the body. sidebar-org 152/152 (+2: L10/L11 pin toggle
  Δ ≤ 1 px both directions; L5–L9 rhythm assertions unchanged).
- **Wall-cutaway flash fix** (2026-07-31, user-reported "foreground
  walls flash translucent→opaque→translucent at irregular 1–12 s
  intervals, layers irrelevant, several releases old"; unreleased —
  on main past v0.51.0). CONFIRMED with an instrumented repro: any
  idle `_keyFloor` change (configRev via the blanket number.*/
  switch.* slow-path rule, 50 W power buckets, applianceJustFinished
  time flips, preset changes…) rebuilt walls at base opacity; the
  per-frame cutaway lerp (τ≈0.16 s) then decayed back — a ~0.2–0.5 s
  pulse (stairs worst: reborn 1.0 vs cutFloor 0.12; the static-camera
  predicate itself never flips, 0/150 frames). Fix: cutaway fade
  state persists across rebuilds (_wallFade/_wallFadeGhost, stable
  wall/stairs/ghost keys on userData.cutKey; birth at min(carried,
  base); both fade directions continuous; swap-and-restart self-
  pruning; cleared on floor switch/destroy). Post-fix: rebuild peak
  == pre-rebuild exactly. New cutaway-persist-test 32/32; glass-see
  26/26, ghost-align 22/22, terrain 103/103, camera 66/66, nav-parity
  54/54, window 53/53, fence-gate 58/58, stairs-fit 78/78 unchanged.
  Noted follow-up (not done, high blast radius): de-chattify the
  blanket number.*/switch.* config-path rule + bucket
  printProgressEntity.
- **Mower dock calibrate/rotate/front + 2D rect body** (2026-07-31,
  user-requested; released in v0.51.0). "Calibrate to
  dock" button (mower GPS block): Planner.calibrateMowerToDock solves
  the position trim from the untrimmed latLonToPlan projection so the
  parked mower's reported fix lands at the placed dock; refuses on no
  fit/fix. RobotFixture.rotation (screen-CW deg, both dock kinds,
  rotation-0 byte-identical — opening faces world −Y): 3D yaw via the
  furniture idiom + emissive entry strip on the base front edge; 2D
  rotated dock rect + always-drawn front chevron; rotation-aware hit
  tests layered over the legacy circles (strict superset); rides
  rotateFloorContent via bump(). dockParkedHeading (pure): mower
  spawns parked + docked branch eases yaw onto the dock facing under
  the bicycle yaw ceiling. 2D mower body is now a heading-rotated
  600×450 rounded rect matching the 3D box (bodyD along travel, nose
  bar, half-diagonal anchoring); vacuum stays round. Tests: robot
  168/168 (+39); plan-rotate 70/70, layers2d 67/67, sidebar-org
  150/150 unchanged.
- **Robots layer + position info + calibration nudges** (2026-07-31,
  user-requested; released in v0.51.0). Vacuum/mower
  fixtures get their OWN "Robots" view layer (devices cat, absent =
  on; split off `sensors`; `robots: false` in SIMPLE_LAYERS; hidden =
  untappable in both views). Per-robot "Show position info" overlay
  (`RobotFixture.showPosInfo` + `Planner.robotPosInfo` — live-map /
  gps / sim ladder): 2D crosshair at the PROJECTED reported point +
  dashed connector when >50 mm from the drawn body + a 3-line
  monospace plate (raw / → world mm / mode · Δ); 3D skipped v1.
  "Align position" sidebar nudges (←↑↓→ on posOffsetX/Y via the
  shared diorama:moveStep, vacuum ↺/↻ 0.5°/5° on posRotDeg, Reset,
  one undo step per click); the MOWER now honours posOffsetX/Y as a
  world-mm GPS trim applied before the yard clamp. Follow-up fix:
  rotateFloorContent rotates the mower trim as a VECTOR about the
  origin (posRotDeg untouched) — the vacuum world-point path was
  provably wrong for a delta trim. Tests: robot 129/129 (+33),
  plan-rotate 70/70 (+2); layers2d 67/67, card 92/92, sidebar-org
  150/150, valetudo 32/32 unchanged.
- **View persistence + boot-framing fix** (2026-07-31, user-reported
  "after a hard refresh the scene is zoomed in a lot"; released in v0.50.0). Root cause: the 3D camera was NEVER framed
  — a hard-coded ~10.8 m constructor pose served every load
  (_applyUrlTemplate returns with no cam/view3d; iso was only the
  named-view fallback); bigger plans read more zoomed-in. New pure
  src/view-persist.ts (resolveBootPose ladder: URL > posed latch
  via new cameraGestures() > saved pose > iso/sims; 20 s reframe
  latch on floor-dims change). Device-local diorama:view2d/cam3d
  (config+floor keyed, throttled, bounds-validated, opt-in
  Planner.viewPersist — cards stay false; kiosk tablets restore).
  resetView clears 2D entry. New view-persist-test 82/82; camera
  60→66; floors-view 86/86, card 92/92, sensor-focus 14/14 held.
- **Flight feed-latency guard + contrail conditioning** (2026-07-31,
  user-reported "flapping like a flag… tail coming back and
  bisecting the fuselage… the plane body also moves backwards";
  released in v0.49.0). Reproduced with numbers:
  6 s-stale cloud fixes dragged the display −29 mm/frame backwards
  (hairpin dot −1.0, 198 folded samples/run); separately the
  newest spine segment was structurally zero every 0.15 s push →
  degenerate perpendicular snapped to world-X 6.7×/s = the flap.
  Fixes: _applyFlightFix latency guard (behind-us fix = stale —
  cross-track/altitude verbatim, along-track absorbed by a
  reckoning-speed trim, never a backward slide); forward-only
  along-track ease backstop; 6 mm min-segment spine gate;
  arc-length ribbon ramp + previous-rib degenerate fallback.
  After: 0 backward steps, 0 folds, vertex jitter 95→3.4 mm.
  flights-render 501→513 (§26n); flights 686/686, ui 295/295,
  nbhd-render 95/95, terrain 103/103 held.
- **Flight trail tail-exit anchoring** (2026-07-31, user-reported
  "bisecting the plane 2/3 of the way back"; released in v0.48.0). All trailing effects anchor at the tail exit:
  `_flightTailAnchor` (aftZ + 140 mm gap, × rigScale, along the
  eased yaw/pitch) applied to ring-buffer writes AND the live head
  (pushed-offset — live-head-only leaves old samples inside the
  model at sub-airframe sample travel); new `aftZ` per archetype =
  rear-most drawn extent (heli tail rotor ≫ fusLen/2); motion
  lines, burner nozzle standoff (pod-aware) and ghost lags rebased;
  2D dashes verified already clear. flights-render 475→501 w/
  negative controls; flights 686/686, ui 295/295, bgtext-multi
  246/246 held.
- **Ground writing: true overlay everywhere** (2026-07-31,
  user-reported "still rendering as a box with text inside it";
  released in v0.48.0). The AUTO margin-strip path
  (the last opaque painter) is now letters-only transparent — the
  surface beneath is the backdrop in every mode; ink resolves from
  the ground beneath (containing area kind → yardFill → grass) via
  updateBgTexts' optional ground arg; all 7 ink pairs audited
  boxless — blacktop chalk-inverted (near-black on near-black
  failed); pure bgGroundInkKey folded into the grass entry hash so
  yard-paint edits re-ink without configRev; no drop shadow (reads
  as smudge; two-tone relief is the contrast). bgtext-multi
  229→246, bgtext 29→30; terrain 103/103, flights-render 475/475
  held.
- **UI polish: toolbar handle + heading + spacing** (2026-07-31,
  user-directed ×3; released in v0.48.0). Bottom
  toolbar collapse handle left-anchored + 40×40 touch target
  (outside the new tabstrip scroller — can't scroll away on
  mobile); "mmWave Sensors" title (the only wrapping header,
  measured); collapsed glass-pill rhythm 25→6 px
  (.section.collapsed rule, emboss shadow cleared). toolbar-test
  42→53, sidebar-org 141→150; layers2d 67/67, sensor-focus 14/14
  held.
- **Flight speed visualization + independent height scale**
  (2026-07-31, user-requested ×2, Sonnet-researched then
  Opus-implemented; released in v0.48.0). Five
  research-backed speed bands (<60 hover: no trail + rotor blur +
  hunt jitter; 60–200 short comet; 200–450 longer comet + motion
  lines; 450–700 white contrail ribbon; 700+ afterburner + ghosts +
  band-entry vapor flash) behind FlightsConfig.speedViz;
  display-path ring-buffer trails (kink-free under poll
  corrections); scene-level _flightVizGroup; 2D dash/tail echo via
  the shared flightSpeedBand resolver (hysteresis + archetype
  fallback). FlightsConfig.verticalScale (0.2–2) scales dispY only
  — clearance floor absolute post-scale, horizontal untouched,
  reach gains max(1, vs). flights 602→686, render 393→475, ui
  271→295; terrain + neighborhood-render held.
- **Sidebar polish wave 2** (2026-07-30, user-directed ×8; released in v0.47.0). Floor lifecycle (add/rename/resize/delete
  w/ named confirm, last-floor guarded) moved to Settings ▸ "Floor
  Plan" (data tab renamed, slug unchanged); size-lock UI removed
  (boundsLocked now gates nothing — commented); imperial → Settings
  ▸ Display; collapse-all row directly under the floor picker; peek
  button one-line fix (block-level SVG was the wrap); tool hints
  name the armed variant (5 tools + switch); glass emboss/deboss
  section headers replacing the ▸ arrow (aria-expanded + keyboard
  toggle; captions flat; room-groups keep ▸);
  <diorama-floor-modal> orphaned (inert, noted follow-up).
  sidebar-org-test 103→141; layers2d/sensor-focus/wall-edit/
  area-binding held.
- **Sidebar reorganization + hotkey master switch** (2026-07-30,
  user-directed ×8; released in v0.47.0). Pinned
  non-collapsible compact floor picker (no row buttons) → NEW
  collapsible "Floor tools" section (all per-floor controls incl.
  relocated reorder ▲▼ + visibility cycle) → Collapse all/Expand
  all row (SECTION_SLUGS, top-level only, picker exempt) → Layers →
  Dimensions → Rulers → Tools grouped into 5 captioned categories
  (TOOL_GROUPS + "Other" safety net). Hotkey leak root-caused as
  STRUCTURAL (focus drops to body after clicking non-focusable UI —
  plain keys legitimately live); device-local
  Planner.hotkeysEnabled master switch (Settings ▸ Display Input
  block) kills tool letters/Delete/arrows, keeps Ctrl+Z/Y/0, Esc,
  Enter, Space. New sidebar-org-test 103/103; layers2d 67/67,
  sensor-focus 14/14, wall-edit 55/55, area-binding 71/71 held.
- **Mower car kinematics + mailbox flag + bathroom water**
  (2026-07-30, user-reported ×3; released in v0.47.0).
  Mower: pure stepBicycle bicycle model (turn radius 500, cruise
  420, strict along-heading motion, U-turn rows at MOWER_ROW_MM
  1200, inside-circle wheel-straight rule); vacuum byte-identical
  (LCG-pinned probes). Mailbox flag rebuilt per user spec: side-face
  pivot rotating about X only — paddle parallel to the side by
  construction, up→rear, down→down. Bathroom: isWetBathKind unifies
  sinks+tub+shower+toilet (click tags, binder, appliance hash);
  shower spray + splash ring, tub faucet stream, toilet 4 s
  edge-triggered flush one-shot (save-free self-clearing
  localState); gallery bathwater twins (<kind>-running) for all 8.
  New bath-water-test 62/62; robot 71→96, vehicle-mail 26→39;
  sink 48/48, furniture-polish 28/28 held.
- **Glass-break sensor + leak puddle curve + gate fence gaps + bay
  windows** (2026-07-30, user-requested ×4; released in v0.47.0). SafetyKind + glass_break (square mic plate, shatter-star
  alarm; capture guard extended to Door/Window kinds too). Leak
  puddle: growth existed but was linear-from-zero + the gallery GIF
  captured a fixed size — now shared sqrt ease-out
  leakPuddleGrow/RadiusMm (18 % floor) + capSafety age ramp. Gates:
  picket/chainlink built full-segment IGNORING wallCutsForSegment
  and hedge's crown bridged its gap — all four fence kinds now build
  per solid sub-interval (real gate posts) + 2D marks respect cuts.
  WindowKind + bay/bay_bench: 3-pane outward projection
  (bayProjectSign loop-probe; splay ≤45°; kind-aware
  sill/height/width defaults; curtains gated off), bay_bench = a
  real window-seat SitSpot (win:<id>:0 — SitSpots no longer
  furniture-only). window-test 15→53, curtain 25→36, fence-gate
  37→58, livefeatures 19→33; nine baselines held.
- **Plan wall-intersection sweep + showroom lighting + orientation-gated
  interactions + tend_plant pose** (2026-07-30, user-reported ×4;
  released in v0.47.0). Zero-tolerance audit: 5 real
  intersections that PASSED check 10 (stacked dryers hiding behind
  the blanket elevation exemption — now depth-gated at
  WALL_MOUNT_MAX_DEPTH 300; fireplaces invisible to the check — new
  check 13 lights-vs-walls + settleLights() running the real snap
  fns; 399→425 checks). Showroom loads 17/43 lights ON (pairwise
  pool-overlap-free set proven; gallery products OFF) — the
  overlapping translucent pools were the reported flicker.
  Orientation gate: hasFunctionalFront/frontVectorPlan/
  inFrontHalfspace; anchor capture + stand point (old code computed
  the BACK — sign bug), appliance-door proximity, AI goals + fire
  gate all front-halfspace-gated; symmetric pieces stay radial.
  tend_plant rebuilt: static lean + one-arm tending, no pelvis
  motion. New orient-interact-test (ORIENT PASS 23/23); FLOORPLANS
  425/425; AVINTERACT 26/26, PROPS 99/99, terrain/stairs-fit/
  nav-parity/costume/climate/mechanical/sink baselines held.
- **Door & window status layer switch** (2026-07-30, user-requested:
  "a visibility switch for the open/closed status on doors and
  windows needs added under labels"; released in v0.46.0). `Layers2D.openingStatus` (Labels category, absent = ON):
  gates the OPEN/closed/% badges on all 8 door kinds + windows via
  `fixtureCaption`'s new `showBadge` param (one pure composition
  rule, 4-way matrix tested); both objectLabels + openingStatus off
  = no pill; other fixtures' badges deliberately unaffected; also
  fixed a degenerate empty pill on unbound openings. layers2d-test
  47→67 (LAYERS2D PASS 67/67); ruler-dims 107/107, door-kinds
  97/97 held.
- **Docs-site campaign: guide + coverage + full regen + publish**
  (2026-07-29, user-directed with Opus-orchestration/Sonnet-implementation
  routing; released in v0.45.0). Guide: 11 pages refreshed against the
  shipped feature set (10 major gaps closed, 6 stale claims fixed).
  Floorplans: showroom rebuilt 14×10→20×14 m (5 zones, lighting
  gallery, mechanical room), duplication halved; coverage now 96/96
  furniture, 26/26 lights, 8/8 doors across the 18 plans;
  ranch-smart-home gained the smart fixture tier; FLOORPLANS
  399/399 byte-deterministic. Gallery generator: doors 3→8, core
  adult avatar added (512/512), hand-list count guards vs types.ts
  (fail-loud), theater/vehicle page intros. Full regen: 675/675
  GIFs (~15 min), 70/70 plan screenshots (2 transient blanks
  auto-caught + retried), demo bundle 18 plans. Published to
  gh-pages.
- **TypeScript 7.0.2 (Go-native compiler)** (2026-07-29,
  user-directed "move to TS7"; released in v0.45.0).
  Zero code/config changes needed — the v0.42.0 6.x bridge absorbed
  the alignment as designed. Typecheck 5.5 s → 0.9 s (~6×). tsc
  remains typecheck-only (Vite/Rolldown produce the shipped bytes),
  so a checker issue can only ever cost a false error, never a
  broken build.
- **Layers overhaul + 2D floor paint** (2026-07-29, user-requested
  ×4; released in v0.44.0). `labels` → "Room & area
  labels" (now gates ground-area/pool names too); NEW `objectLabels`
  (fixture/door/window/furniture NAME text — value readouts stay
  with their fixture layers; fixtureCaption keeps state badges),
  `openings` (doors+windows, hit-testing follows visibility),
  `peekFloors`; layer panel grouped into 6 categories via
  LayerDef.cat/layerDefsByCat (sidebar + card editor from ONE
  catalog); all new keys opt-out — old presets byte-identical.
  Floor color/texture verdict: a GAP, never a regression — 2D
  drawFloor had a hard-coded fill since day one; now paints
  look3d/scene3d floorColor + deterministic 800 mm-scale
  wood/tile/concrete pattern tiles matching the 3D repeat scale.
  New layers2d-test.html (LAYERS2D PASS 67/67); ruler-dims 107/107,
  sensor-focus 14/14, area-binding 71/71, toolbar 42/42, card
  92/92, door-kinds 97/97, flights-ui 271/271 held.
- **HA floor/area → room binding + area-filtered pickers** (2026-07-29,
  user-requested: "bind floors to defined parent areas in home
  assistant and then the areas on that floor to defined rooms on the
  plan instead of manually naming… filter to that area by default
  when selecting temperature and occupancy sensors… allow the user
  to remove the filter"; released in v0.43.0).
  Floor.haFloorId + Room.haAreaId; getFloorRegistry/getAreaRegistry
  + additive area_id on devices/entities (all three clients);
  roomLabel naming ladder (typed → area name → placeholder), 3D
  threading at the three-view call site; "HA area" dropdowns +
  "⇄ Match all by name"; EntityPicker areaFilter chip (occupancy /
  env / thermostat binds, removable + re-appliable). New
  area-binding-test.html (AREABIND PASS 71/71); config 60/60, undo
  44/44, rooms 10/10, sensor-focus 14/14 held.
- **Nav parity guard (tech-debt #10 — list complete)** (2026-07-29;
  released in v0.43.0). Differential golden test
  `nav-parity-test.html` (NAVPARITY 54/54): renderer `_nav` vs the
  floorplans validator replica, 7 fixtures, cell-for-cell blocked +
  region-label agreement, analytic PERSON_R/WALL_HALF probes,
  mutation-tested. First run caught two REAL divergences, fixed
  validator-side: missing sunken-stairs nav rails; custom-recipe
  defs unresolved (resolveFurnitureDef threaded through
  physical.mjs/validate.mjs). FLOORPLANS 399/399 byte-identical;
  terrain 103/103, stairs-fit 78/78 held.
- **Tech-debt batch A** (2026-07-29, per docs/TECH-DEBT.md; released in v0.43.0). Committed test bundles untracked +
  gitignored (the void-test clean-checkout flake mechanism);
  hitDoor/hitDoorEnd through effectiveState (DOORKINDS 97/97 w/
  restored-bug negative proof); README factual fix (migration DOES
  exist) + full feature refresh (24-row entity table, 32 tools,
  machine-checked counts); localstate-test window heuristic fixed
  (LOCALSTATE 16/16, was 9/10 known-red since the window-glass
  rework); flight label resolvers hoisted into flights.ts (FLIGHTS
  602/602, render 393/393, ui 271/271); docs/models tree species.
  engines field + CLAUDE.md count fix landed separately (825f4ce).
- **TypeScript 6.0.3 (the 5.9→7.0 bridge line)** (2026-07-28,
  user-requested evaluation; released in v0.42.0).
  Research + empirical trial both green: 6.0 is the LAST JS-based
  compiler release, aligned with the Go-native 7.0's defaults;
  every 6.0 breaking change was already satisfied by our tsconfig
  (Bundler resolution, ESNext module, strict, Lit's
  experimentalDecorators + useDefineForClassFields:false untouched
  by 6.0). ONE code fix repo-wide: mqtt-ws `_send` restates
  `Uint8Array<ArrayBuffer>` for TS 6's narrowed WebSocket.send
  (MQTTCODEC 45/45 held). Explicit `types: []` + `rootDir: "src"`
  added as 7.0-forward documentation of the new defaults. 7.x held
  until the native port matures (`ignoreDeprecations` dies there —
  6.x is the sanctioned staging ground). Details in the TS section
  of docs/TECH-DEBT.md execution log.
- **Dependency bump + tech-debt audit** (2026-07-28, user-requested;
  released in v0.41.0). vite 8.0.16→8.1.5 + three/
  @types/three 0.184→0.185.1 as one gated batch — typecheck/build/
  chunk-split grep clean and NINE renderer-heavy pages at their
  counts (terrain 103, stairs-fit 78, tree 74, door-kinds 87,
  bgtext-multi 229, flights-render 393, camera 60, ghost-align 22,
  neighborhood-render 95). TypeScript held at 5.9 (7.x native-port
  churn; 6.x bridge under evaluation). Full audit + actioned/
  not-actioned classification + execution plan: `docs/TECH-DEBT.md`.
- **Wall editing prefs: snap toggles + Alt free placement**
  (2026-07-28, user-requested: "an on/off method to disable the 15
  degree lock and the automatic linking of walls at corners or some
  other method to make fine adjustments"; released in v0.40.0). Device-local `diorama:wall:*` prefs (angle snap / 10 mm
  wall grid / weld, absent = ON, never in the store or undo);
  centralized `resolveWallPoint` so the live-dims chip and the
  commit agree by construction; holding Alt suspends all three for
  a gesture (incl. release-time weld); "Wall editing" checkbox row
  in Tools. New wall-edit-test.html (WALLEDIT PASS 55/55);
  sensor-focus 14/14, ruler-dims 107/107, undo 44/44, rooms 10/10,
  wallsnap 36/36 held.
- **Five new door kinds + open-door closed-span hint** (2026-07-28,
  user-requested: "create more door types. Sliding, pocket, double
  swing, french, sliding glass" + "open doors need a dashed line
  showing the closed door position… so users know where to click to
  close them"; released in v0.40.0). Door.kind grows to
  eight; hinge doubles as slide side on sliding kinds;
  doorDefaultWidth kind-switch bump; shared addLockBolts; toolbar
  variant row lists all eight; every open door draws a dashed
  closed-position line and hitDoor tests the closed span first
  (kiosk click inherits); unknown kinds fall through to swing
  (stale-chunk tested). New door-kinds-test.html (DOORKINDS PASS
  87/87); covers 22/22, fence-gate 37/37, window 15/15, curtain
  25/25, ruler-dims 107/107, lockoven 31/31 held.
- **Door swing dashed arc fixed** (2026-07-28, user-reported: "the
  door opening dashed line… is not always correctly representing the
  direction the door opens"; released in v0.40.0). Two
  bugs in one: the canvas delta negated `openDelta` (mirrored hint —
  doorEndpoint offsets land at +rotation in canvas space through the
  y-flip), and min→max arc endpoints drew the 270° complement across
  the atan2 ±π seam. Now a signed 90° sweep from the closed panel
  with the anticlockwise flag. 3D swing + 2D open panel were always
  correct. ruler-dims-test 104→107 (§12 pixel-classification pins:
  right/left hinge + seam case).
- **Tree species + adjustable height** (2026-07-28, user-requested:
  "add more tree species models and allow adjusting the height of the
  trees"; released in v0.40.0). Five new outdoor kinds
  (oak/birch/palm/willow/spruce, parametric in W/D/HT, toon +
  outlines + blob shadows, 2D glyphs); `TREE_KINDS`/`isTreeKind` +
  `treeHeightMm` — `Furniture.ht` now shared by two disjoint
  consumers (stairs rise / tree height); "Height (mm)" sidebar row
  (clamp 1000–15000); legacy tree/pine golden-pinned byte-identical.
  New tree-test.html (TREE PASS 74/74); yard 4/4, terrain 103/103,
  toolbar 42/42, stairs-fit 78/78, floorplans 399/399 held.
- **Live drag dimension readouts** (2026-07-28, user-requested: "when
  resizing objects or drawing walls or other areas, show the
  dimensions… in real time until releasing the anchor"; released in v0.40.0). Pure `liveDimChips(p)` + `drawLiveDims`
  (last in drawAll, edit-only): fmtLen imperial/metric chips during
  wall draw (rubber band + dimmed committed), wall/polygon/LD2450
  vertex drags, floor-edge + furniture-corner + bg-corner resizes
  (W × D), all draw latches; ruler/env/move drags deliberately
  skipped; two old ad-hoc readouts consolidated in. ruler-dims-test
  63→104 (RULERDIMS PASS 104/104); sensor-focus 14/14,
  action-button 32/32 held.
- **Stairs family "open underneath" option** (2026-07-28,
  user-requested: "add a stair option to be open underneath and not
  closed off"; released in v0.39.0).
  `Furniture.stairsOpen` + sidebar checkbox: floating 60 mm tread
  slabs / 80 mm sloped ramp slab (parallelogram extrude, foot clipped
  at y=0) / 60 mm landing platform — 3D-build-only, top surfaces
  bit-identical so ground truth, nav, 2D and autofit are untouched;
  solid builds byte-identical. STAIRSFIT 62→78 (PASS 78/78);
  stairs-descend 23/23, stair-link 25/25, terrain 103/103 held.
- **Ground writing: follow-camera toggle + static rotation**
  (2026-07-28, user-requested: "an option to retain the autofollow and
  also to have a static rotation"; released in v0.39.0).
  `BgTextEntry.faceCamera?`/`rotationDeg?` (absent = follow, pristine
  hash byte-identical); pure `bgGroundFixedYaw` (ψ = π − deg·π/180,
  world-space-pinned at 0/90/180/−90°); same ease machinery, snap on
  rebuild; both mesh-yaw and texture-rotation paths; "Follow camera"
  checkbox + "Rotation (°)" in Settings ▸ Display. bgtext-multi
  193→229 (BGTEXTMULTI PASS 229/229), bgtext 29/29 held.
- **Stairs/ramp sides removed** (2026-07-28, user-requested: "remove
  the sides from the stairs and the ramps"; released in v0.39.0). The ramp's raised side curbs and the sunken-flight dark
  shaft side walls (stairs/ramp/landing + the faceOpen adjacency
  probe) are gone — outdoor flights fitted between yard levels grew
  ugly flanking walls. Stairwell hole + dark void plane still mark
  indoor wells. STAIRSFIT 62/62 (D3 flipped to pin the bare wedge);
  stairs-descend 23/23, stair-link 25/25, terrain 103/103 held.

- **Ground writing: true polygon constraint + area material** (2026-07-28,
  user-requested: "it should truly constrain to the geometry of that
  area and not just draw a box… It should also use the material of
  the area being chosen" + label rename to "Ground writing";
  released in v0.38.0). Area-bound bg-text decals are
  now the area's real polygon (ShapeGeometry, index-matched to the
  `updateGroundAreas` patch mapping) with a TRANSPARENT texture so
  the area's own material shows through; text ink from the pure
  `groundTextInk(kind)` palette (mowed green / etched concrete /
  sand / water…); camera-facing preserved by rotating the TEXTURE
  (square UV window, side = full bbox diagonal, θ = ψ exactly)
  while the mesh stays put; `scale` scales the painted text
  (mesh pinned — polygon never grows past the area). Auto
  margin-strip placement byte-identical; stale-chunk safe both
  directions. bgtext-multi 146→193 (later 229/229),
  bgtext 29/29, terrain 103/103 held.
- **Stairs rise + autofit + ramp kind** (2026-07-28, user-requested:
  "steps need a height adjustment or an autofit so they can fit
  between 2 levels even of short heights with one or 2 steps" + "the
  2 level fit also needs a ramp option"; released in v0.38.0). Per-piece "Rise (mm)" on stairs-family pieces
  (`Furniture.ht`, family-scoped via `stairsRiseMm`); tread count
  from the ONE pure `stairsTreadCount(depth, rise)` rule (min-3
  clamp capped by rise/130 — 200 mm → 1 step, 350 mm → 2, default
  flights byte-identical at 13/6) shared by the 3D builder,
  `_groundYAt` quantization and the 2D glyph; "⇅ Fit between levels"
  autofit (`Planner.autofitStairs` probing foot/head ground via the
  pure `resolveItemGroundMm` mirror of `_itemGroundY`, auto-180° on
  reversed placement, refuses level ends); new `ramp` FurnitureKind —
  toon wedge + curbs, LINEAR `_groundYAt` branch, full family
  contract via the now-canonical `isStairsKind` type guard. Test
  `stairs-fit-test.html` (STAIRSFIT PASS 62/62); terrain 103/103,
  stairs-descend 23/23, stair-link 25/25 held.
- **Items follow terrace surfaces + sunken-tier fixes** (2026-07-28,
  user-reported with a real floor plan; released in v0.37.0). `_itemGroundY`
  is now TERRACE-first: free-standing outdoor content (trees,
  furniture + SitSpot seatY, ground lights, flagpoles, docks,
  cameras, valves, projectors, leak pucks, geo sprites, fence
  segments) settles onto the highest containing terrace top instead
  of floating at grade over a sunken lawn (avatars already did).
  Stairs/risers stay excluded (manual-elevation convention).
  `groundAreaSkirtBase` picks the reference tier by ENCLOSURE
  (smallest strictly-larger containing polygon, any sign) — a
  raised pad inside a sunken backyard now skirts down to the lawn
  instead of clamping at 0 ("raising just increases thickness"
  report). Terrace registration moved to top of updateFloor.
  Zero-grade + no-terrace configs byte-identical. terrain 86→103;
  fence-gate 37/37, yard 4/4, path-pool 50/50 green. Same session:
  diagnosed user config where groundLevelMm 801 cancelled
  Floor.elevationMm 800 (effective grade +1 mm).

- **Yard walls follow the grade** (2026-07-27, user-reported;
  released in v0.37.0). With per-floor elevations, a newly drawn wall in the
  yard floated at the slab plane while the ground sat a story below.
  New per-segment base rule `_wallSegmentBaseY`: fence family
  (picket/privacy/chainlink/hedge) always bases at the grade
  (`_itemGroundY` at segment midpoint); solid kinds (full/half/
  railing) follow the grade only when free-standing — the pure
  `wallSegmentInLoops` (geometry.ts, 25 mm weld, exact
  adjacent-pair + sampled-union superset for tee-split perimeter
  walls) runs first so house walls stay slab-based. Doors/windows
  inherit the host segment's base via `_wallSegBases` +
  `_openingBaseY` (hinge/pane group offset — panels, slats, gate
  pickets, deadbolts, shades, curtains ride along); `_keyDoors`
  carries effGroundMm. Zero-grade configs byte-identical. terrain
  67→86, fence-gate 32→37, window 15/15 green.

- **Grass writing faces the camera** (2026-07-27, user request;
  released in v0.37.0). The grass bg-text decal stays flat on the lawn but
  yaws about its rect centre to track the camera — text-top away
  from the viewer (page-on-the-floor), never mirrored
  (`cross(right, up) = +Y` asserted at 4 azimuths), shortest-arc
  ease τ≈0.6 s, first-advance snap so rebuilds re-acquire
  instantly. Implemented via `rotation.order='YXZ'` on the mesh
  (no parent group — keeps terrain/bgtext harness reads intact);
  `BgRig.grassYaw` state; both margin-strip and grassAreaId
  placements. bgtext-multi 112→146; bgtext 29/29 + terrain 67/67
  re-verified.

- **Focusin cooling — renaming a yard area no longer deletes it**
  (2026-07-27, user-reported; released in v0.37.0). The in-input Delete was
  already guarded, but the selection stayed HOT through a typing
  session — after any blur, Backspace hit the body and
  deleteSelection removed the still-selected area. canvas-2d's new
  window `focusin` listener cools `selectionHot` whenever an
  editable target gains focus; re-selecting on canvas/sidebar row
  re-heats; delete tool + sidebar buttons unaffected. Placement
  autofocus now also cools (protective). sensor-focus 9→14 (the
  regression suite documents two fixture traps: setActiveGroundArea
  TOGGLES, and deleteSelection's priority list puts the always-set
  activeSensorId above ground areas).

- **Fixed world ground plane + per-floor elevations** (2026-07-27,
  user-reported: "the ground plane changes depending on which floor
  is selected; glass view has a different offset"; released in v0.37.0).
  `Floor.elevationMm` (repairFloor list; absent = AUTO = full-array
  index × STORY_H_MM 3000; negative = basement; ground may bisect a
  floor; sidebar "Elevation above ground (mm)" w/ auto placeholder)
  + pure `floorElevationMm` (geometry.ts). ONE injection site in
  three-view: `effGroundMm = resolveGroundLevelMm(user) − E_active`
  overwrites scMerged.groundLevelMm — every grade consumer inherits
  unchanged. `resolveGroundLevelMm` MOVED to geometry.ts (clamps the
  USER value only; renderer re-exports; effective value may exceed
  ±10000). Ghost stack + transit puppet elevation-driven (trailing
  elevMm map, stale-chunk safe); `floorSwitchCameraDelta` gains a dy
  term (camera keeps height above ground → floor switches leave the
  grade/neighborhood/stack visually fixed); flights shell anchors to
  the grade. Single-floor byte-identical. terrain 48→67, ghost-align
  16→22, floors-view 67→86, camera 60/60, stair-link 25/25.

- **Pivot lock × free movement as two independent options**
  (2026-07-27, follow-up to the bullet below; released in v0.37.0).
  `Scene3D.cameraPivot` is DEPRECATED (still read for back-compat)
  in favour of `pivotLocked` (absent = true) + `freeMovement`
  (absent = false), resolved by the pure `resolvePivotMode`
  (geometry.ts). New cell: **locked + free** — panning is enabled
  but OrbitControls' rotate is surrendered (`enableRotate = false`)
  and a custom pointer gesture rotates the {camera, target} pair
  RIGIDLY about the plan centre, so you can slide the view yet
  rotation always spins around the floor plan. ✋ now toggles free
  movement, new 📌 toggles the lock; Settings ▸ Display Camera is
  two checkboxes. camera-test 28→60, floors-view 67/67 green.
- **Central camera pivot (new default) + free-movement mode**
  (2026-07-27, user-reported: "pivot point doesn't stay at the
  property centre; sliding the map moves it and it's hard to
  recenter"; released in v0.37.0). `Scene3D.cameraPivot` ('center' default /
  'free'): center = pan disabled + per-frame ease of target x/z to
  the plan centre (camera translated by the identical delta so the
  pose is preserved; snap <1 mm; y untouched); pivot = current
  floor centre, or `floorsUnionCenter(enabledFloors)` under glass
  house (pure, geometry.ts) mapped through the active `_w()` frame;
  autoFollow/cinematicOrbit take precedence; free = today's
  behavior. ✋ 3D-bar toggle + Settings ▸ Display Camera select.
  camera-test 12→28, floors-view 67/67 green.

- **Near-field flight compression fix + real draw-radius knob**
  (2026-07-27, user-reported: "6.5 nm renders in the backyard, 2 nm
  over the house; draw distance changes nothing"; released in v0.37.0). Two
  reversals, both reasoning-pinned in CLAUDE.md: (1) the radial
  power law u^P collapsed the near field (6.5 of 15 nm → 24 % of
  shell, 2 nm → 3 %) — replaced by PIECEWISE-LINEAR through the same
  two anchors (f(u)=0.75u ≤2/3, 1.5u−0.5 above; anchors bit-exact;
  near field proportional: 6.5 nm → 97.5 m, 2 nm → 30 m at 300 m
  shell, regression-pinned ±1 mm; radialExponent GONE, radialMidU/F
  added; sub-midpoint dispY_elev exactly constant in d; floored
  parity-grid cells 110→77 = more true-angle traffic). (2) the
  similarity factor `s` on flightDisplayScale made the draw-radius
  knob a perceptual no-op (position+size scaling together preserves
  all apparent angles/sizes) — dropped; scale now shell-invariant at
  equal u, knob genuinely moves traffic, modelScale is the size
  lever. flights 561→577; render 393 + ui 271 green.

- **Card scene controls, layers multi-select, bgText layer,
  attribution gating** (2026-07-27, user request; released in v0.36.0). (1) Card visual editor: Layers = preset
  dropdown ((unchanged)/Full/Simple/saved presets/Custom…) with a
  Custom… checkbox grid emitting an explicit `{layer: bool}` object
  (config `layers` now string OR object; object applies immediately
  in applyCardConfig); Scene (3D) block (view:3d only) = tri-state
  inherit/On/Off for glassHouse/wallCutaway/autoFollow/
  cinematicOrbit/simsCam/plumbobs/skyBackdrop + fovV/fovH inputs.
  (2) `scene?: CardSceneConfig` = CARD-LOCAL overrides via
  three-view's new `scene3dOverride` (merged by `_sc3()`, all ~19
  scene3d reads routed; identity-return when no override) +
  `simsCamOverride` (snap always, 'sims' pose only without
  cam/view3d). (3) New `Layers2D.bgText` layer (absent = on) hides
  the decorative bg-text rigs; off in Simple preset; `_keyBgText`
  gains the flag, empty-list disposal, `_bgTextPhase` resumes.
  (4) `src/layer-defs.ts` extracted (LAYER_DEFS/SIMPLE_LAYERS/
  layerIsOn — sidebar + app + card-shared + editor share one
  catalog). (5) Attribution chip lines follow their layers
  (neighborhood OSM line + flights line hide when the layer is
  hidden). card-test 38→92, bgtext-multi 102→112, sensor-focus 9/9.

- **Card visual-editor "No type provided" fix** (2026-07-27,
  user-reported; released in v0.36.0).
  `validateCardConfig` rebuilt the config without `type`, so the
  editor's every config-changed emit was type-less and HA rejected
  it (YAML with an explicit type worked until the visual editor
  touched it). Fix in three layers: the validator carries `type`
  through, `STUB_CONFIG` includes it, and `_emit` spreads
  `{type:'custom:diorama-card', ...}` first so a pre-fix stored
  config still re-emits complete. card-test 32→38 (round-trip +
  legacy-typeless-emit + stub asserts).

- **Mobile flight tap fix + About block** (2026-07-27, user-reported:
  "tapping planes in the HA phone app doesn't show the info card";
  released in v0.37.0). Two compounding 3D-view causes: the manual
  pointerdown/up tap gate discarded finger taps (5 px slop; a finger
  wobbles more) and exact-geometry raycasting can't hit a few-px
  dart. Fix: pointer-type-aware gate (touch 12 px / 600 ms = the
  canvas-2d synthesis constants; mouse keeps 5 px / 500 ms) +
  `_raycastFlightNear` screen-space nearest-aircraft fallback
  (28 px touch / 12 px mouse, zero-alloc, after `_raycastFixture`,
  before vacseg — fixtures always win; proximity hit clears the
  dblclick timer). 2D path + three-view kiosk dispatch verified
  already correct. flights-render 367→393. Plus: Settings ▸
  Connection "About Diorama" footer (purpose summary + docs-site +
  GitHub repo links, shown in all UI modes incl. offline).

- **User-definable flight draw radius** (2026-07-27, user request:
  "max draw distance needs to be doubled or tripled; make a user
  definable draw radius aircraft scale into"; released in v0.35.0 — on main
  past v0.34.0). `FlightsConfig.shellRadiusM` (Settings ▸ Flight
  tracking "Draw radius (m)", clamp 60–1000, **default 300** = 2.5×
  the old fixed 120 m shell; exactly-default → undefined in
  setFlights, the modelScale idiom). The whole shell is now a
  SIMILARITY transform of the authored 120 m reference
  (`FLIGHT_SHELL_BASE_MM`): every shell fn takes a trailing
  `shellMm = flightShellMm()` and scales rMax/yMin/yMax by
  `s = shellMm/120000`; `flightDisplayScale` gains a leading `s`
  factor so apparent angular sizes are IDENTICAL at every scale (no
  "planes got tiny" regression); `clearMm` 6500 stays ABSOLUTE (a
  physical property-clearance floor — floored traffic reads
  shallower on a bigger shell, correct). Frustum requirement is now
  `flightShellReachMm(_flightShellMm)` (≈342 k default / ≈1.14 M max,
  far inside CAM_FAR_CEIL); flights still never raise
  controls.maxDistance. Renderer re-clamps `opts.shellMm/1000`
  through the one flightShellMm implementation. flights 518→561,
  render 350→367 (incl. non-default-shell parity + eased-glide
  pinning — a live rig glides, never snaps, on a shell change),
  ui 261→271; NBHDRENDER 95/95 re-verified (shared frustum recorder).

- **Radius-anchored flight distance mapping** (2026-07-27,
  user-reported: "10 mi flights still near the property line; 15 nm
  should render at the rim, 10 nm at the midpoint"). compressRadiusMm
  is now `rMax·clamp(d/R, 0, 1.05)^P`, P = ln2/ln1.5 ≈ 1.7095 —
  DERIVED from the user's two anchors (d=R → rim exactly, ⅔R →
  midpoint), radius-invariant in u so the shell is a scale model of
  whatever radius is entered; K is gone. Elevation-cap algebra sign
  FLIPPED (dispY_elev rises with distance at P>1) — honesty is now an
  ANGLE property, tests sweep display elevation angle. Near-field
  compression strong by construction (sub-1.5 nm rides clearMm —
  lever documented). FLIGHT_SCALE_GAIN 2.2→0.8 (rim 1.8×, "fairly
  small"). flights 498→518; render 350/350 unchanged (nothing was
  hardcoded to the old curve), ui 261/261, alert-center 67/67.

- **Flight glow rules** (2026-07-27, user request; Sonnet research →
  `docs/research/flight-glow-rules.md` → single Opus pass). Ordered
  first-match-wins rule list (cap 30) assigning colour + pattern to
  matching aircraft: 7 patterns (solid/flash 1.2 Hz/strobe twin-pop/
  rotate w/ 0.35 never-dark floor/fade 5 s/alternate/none-mute), ≤2
  colours each; criteria = 6 wildcard strings (hand-walked glob,
  substring-vs-anchored hybrid, regex-injection-safe) + speed/alt/
  dist min-max + 5 tri-state flags, AND semantics. Precedence:
  beacons master gate → emergency unconditional → first rule match
  REPLACES default → interesting/military/LADD ladder. Whole surface
  pure in flights.ts; resolveFlightGlow is the ONE ladder home (3D +
  2D — the mirrored-6-lines duplication retired); rig stores resolved
  colours at poll cadence, per-frame only samples the envelope.
  Settings ▸ Flight tracking "Glow rules" editor (reorderable rows).
  flights 358→498, flights-render 299→350, flights-ui 200→261;
  terrain/bgtext-multi/alert-center/nbhd-render green.

- **Bg-text aircraft picker + model-size knobs** (2026-07-26, two user
  requests; single Opus pass). `BgTextEntry.aircraft` (banner mode):
  any of the 8 flight archetypes builds the tow plane via the shared
  `_buildAircraftModel` (civil paint, no beacons/livery; heli flies
  the banner orbit w/ rotorY axis flip; chopper mode ignores it;
  absent = classic toy, byte-identical; standoff scales w/ fuselage).
  `BgTextEntry.scale` (0.5–5) group-scales the whole rig per entry
  (train spacing/wheelR scaled alongside; grass spills at >1 by
  design); `FlightsConfig.modelScale` (0.5–4) = third multiplicative
  term in `_flightRigScale`. Both fold into their keys; per-frame
  advances never write scale. bgtext-multi 74→102, flights-render
  288→299, flights-ui 172→200; flights/terrain/bgtext green.

- **Ground level part 2: free-standing content follows the grade +
  bg-text fixes** (2026-07-26, four user reports in one batch; single
  Opus pass w/ 4 addenda). Rule: `_itemGroundY` (outdoors → grade,
  routed through `_groundYAt`'s fallback so nav + visuals agree) +
  `_yardGroundY` (encircling content). Moved: outdoor furniture
  (+SitSpots — avatars sit ON the lowered lawn chair), ground areas/
  terraces/pools (gl + elevation composes; fixes the patch-over-
  lowered-yardFill inconsistency), ground-standing lights + pools,
  flagpoles, robot docks, cameras, valves, projectors, leak pucks,
  GPS/landmark/geo-event pins (indoor pins stay), grass bg-text
  decal, train loop, banner-plane/chopper/sky AGL. Stays: wall-plane
  furniture + stairs, wall/ceiling fixtures, room-bound overlays.
  Chopper banner now hangs from its leading TOP corner (originCorner
  was never passed — wire met the middle). Bg-text reset-every-30 s
  fixed: `_keyBgText` dropped configRev (chatty config-path entity
  churn) for a resolved-consumption hash + persistent `_bgTextPhase`
  (rebuilds resume mid-course). terrain 38→48, bgtext-multi 61→74;
  yard/path-pool/stairs/glass-see/nbhd-render/seating green.

- **Adjustable ground level** (2026-07-26, user request, clarified:
  surroundings move vs the house; single Opus pass).
  `Scene3D.groundLevelMm` (default 0, ±10 000, negative = below slab):
  offsets GridHelper + the whole neighborhood group + the yardFill
  underlay; slab/walls/furniture/authored terrain stay. `_groundYAt`
  returns the level outdoors (outside every wall loop) so yard rigs/
  blob shadows/robots settle onto the lowered grade (eased doorway
  step). Visual-driven fix: yardFill wall-loop holes punch only at
  level ≥ 0 (below, the grade runs under the raised pad — a low
  camera otherwise saw the grid through the holes). Settings ▸
  Display "Ground level (mm)". terrain-test 21→38; yard/nbhd-render/
  neighborhood/glass-see/stairs-descend/path-pool green. v1 limits:
  no foundation skirt, GPS pin sprites slab-relative.

- **Sun-disc toggle** (2026-07-26, user request; single Opus pass).
  `sunDisc` joins the W3 per-effect keys (default ON) — gated like
  sunPosition (own key + live source, never effects3d/weatherFx —
  sky prop, not a group member); zeroes the sprite's opacity TARGET
  so the τ≈2 s ease fades it (no pop); stale-chunk shows it
  (`!== false`). "Sun disc" checkbox in Settings ▸ Weather 3D
  effects. weather-test 197→200 (CLAUDE.md's 164 was stale),
  weather-fx sky 34→45; all other cases + sky-real green.

- **Sky/weather visual fixes** (2026-07-26, three user reports; single
  Opus pass, renderer-only). (a) Cloud shadows read as WHITE circles:
  `_cloudShadowTexture` painted dark-slate rgb that linear→sRGB output
  lifted to mid-grey — over dark ground the blend LIGHTENED. Now pure
  black + alpha ramp = exact multiply by (1−a), can only darken
  (_buildStormBank shares the map; its tint set white by design).
  (b) The "purposeless white ball" was the SUN disc — hard-edged
  gradient + NormalBlending + near-neutral tint. Now hot core + long
  soft warm tail, AdditiveBlending, 5000 mm mostly-halo, warm at every
  elevation, peak opacity eases back at midday (glare, not a ball).
  (c) Constellations in daylight: the star ramp keyed off the PRESET,
  and resolveScenePreset downgrades an overcast day to dusk → ramp
  pinned 0.6. Dayness now = max(preset, sun-up amount from live
  elevation, civil-twilight ramp 0°→−6°); STAR_RAMP_MIN 0.02 flips the
  group visible=false (the ease asymptotes); first target SNAPS (no
  8 s star fade on a daylight panel open). weather-fx w3 12→20, sky
  23→34, sky-real 22→32; sky-astro 36/36 + regression sweep green.

- **Flight display + inspection wave** (2026-07-26, user requests;
  single Opus pass on top of the rescale). Optional tow banners
  (`FlightsConfig.banners`, Settings checkbox); livery text layout —
  operator on both flanks + identification on a flat spine plane for
  big-fuselage archetypes (per-silhouette `topLen` clears fin/cockpit/
  high-wing; `fitTextPlane` aspect-preserving shrink), small airframes
  keep flanks-only, PIA withholds operator everywhere; every flight
  material `fog:false` (sky objects — outline shells use a per-model
  clone so the shared outline material keeps fogging ground geometry);
  clickable aircraft — assembly-tagged raycast (`FixtureClickKind`
  hoisted union) + 2D `flightHitPx`/`hitFlight` low-priority click →
  `<diorama-flight-modal>` read-only card (real alt/speed/vert-rate/
  squawk/distance/bearing/fix-age + status chips + PIA anonymization +
  signal-lost; live-channel repaint; edit+kiosk, view refuses) fed by
  `Planner.flightByHex`. flights-render 243→288, flights-ui 105→172.

- **Flight shell rescale ×5** (2026-07-26, user-reported: "bunched up
  in a much smaller area, 7 nm planes directly over the property").
  rMax 24k→120k mm (7 nm @ radius 15 ⇒ 76.4 m out, golden ≥60 m),
  yMax 22k→66k (elevation branch governs cruise from ≈7.4 nm;
  crossover swept 8–60 nm), clearMm/yMin/K unchanged — display ANGLES
  unchanged (elevation math is scale-invariant). Shell now exceeds the
  30k sky dome (harmless — depthWrite:false). flightDisplayScale
  (1+2.2·r/rMax) grows rig scale with distance, composed with fade.
  Frustum: per-source union `_recordFrustumReq('nbhd'|'flights')`,
  flights record FLIGHT_SHELL_REACH_MM ≈137k while drawn+visible;
  only nbhd raises maxDistance (orbit term split). flights 337→358,
  flights-render 220→243, nbhd-render 78→95. Noted: flight materials
  lacked fog:false (invisible under weather fog) — wave B fixes.

- **Flight property-clearance floor** (2026-07-25, user-reported
  follow-up to the elevation cap: aircraft <2000 ft rendered near
  ground level). The cap made the old 2500 mm yMinMm floor the COMMON
  case for distant low traffic (approach traffic skimmed the yard).
  New `FLIGHT_SHELL.clearMm` = 6500 hard render floor (clears a
  2-story house); yMinMm survives only as the altitude-curve 0-ft
  anchor. Aircraft ≲6600 ft can never clear the floor from the
  elevation branch (max elev term 3.24·altM) — they ride it by
  design. Orchestrator-direct fix; flights-test 335→337 (goldens
  reworked: 5000 ft@0.5 nm now floor-lifted to ~67.7°, mono sweep
  bounded at the ≈17.3 nm floor crossover).

- **Landmark suggested-position repair** (2026-07-25, user request;
  single Opus pass). 🎯 toggle per calibrated landmark row: projects
  the pin's lat/lon back through the FULL current fit (the exact
  endpoint the residual measures — ghost and readout can never
  disagree), draws a dashed ghost pin + connector + distance chip on
  the 2D geo layer (edit-only, runtime latch `landmarkSuggestId`,
  zero cost when idle), "Apply — move pin here" = one undo step via
  updateLandmark. Repair flow for a mis-sampled pin: exclude →
  inspect ghost → apply → re-include (θ unchanged, ~0 residual —
  asserted). Applying on a PARTICIPATING pin asserts strict rms
  reduction (scale-locked fit can't zero its own residual).
  landmark-csv 114→147; geo 80/80, gps 28/28, sensor-focus 9/9.

- **Mechanical & utility appliances** (2026-07-25, user request; single
  Opus pass + orchestrator three-view follow-ups). Ten bindable animated
  kinds, all cat 'appliance': water_heater (red burner glow; binds HA's
  water_heater domain), air_handler + heat_pump (blue/red/white via
  hvacAirflow, action beats mode), floor/wall_radiator + boiler (red;
  hvac_action 'idle' = honest dark), ac_condenser (blue + top fan spins
  only while cooling — rotor in a −90°/X holder so shared _floorFans
  spin code drives a horizontal fan), sump/recirc pumps (scrolling
  water via per-pump _flowTexture clones, _waterPatchTextures dispose
  discipline, frozen when off), printer_3d (mountable; oscillating
  gantry + growing print box from a numeric progress binding /
  printProgressEntity / deterministic loop). Pure helpers
  mechanicalRun/mechanicalBindDomains/printerProgress (geometry.ts);
  glow replaces the green in-use LED for these kinds. Orchestrator
  follow-ups in three-view: clim hash gate widened to
  isMechanicalApplianceKind, printProgressEntity folded into the hash,
  mechanical dblclick-binder branch. mechanical-test NEW 100/100;
  climate-appliance 64/64, sink 48/48 green. (localstate-test
  window_unbound_open was red here — FIXED 2026-07-29, tech-debt #6:
  the heuristic predated the window-glass rework; now LOCALSTATE 16/16.)

- **Floor-switch view retention** (2026-07-25, user request; single Opus
  pass). `switchFloor` keeps 2D `viewCenter`/`zoom` (stacked stories
  share one world-mm frame — the old "different coord space" reset
  rationale was stale), guarded by pure `viewCenterFitsFloor` (rect
  inflated 0.5·max(w,d) per side; far-outside centre → reset; null
  stays null; resetView/config-switch/load still reset). 3D: three-view
  translates camera pos+target by `floorSwitchCameraDelta` =
  {(Δfw)/2, −(Δfd)/2} (the scene frame is floor-dim-derived; equal
  dims = no-op), dims refreshed per tick so floor-edge resizes can't
  stale the delta. floors-view-test 32→67; undo 44/44. Known
  non-route: the `floor=` URL param sets currentFloorId directly
  (boot-time, unpanned) — retention not applicable.

- **Camera-distance-tracking frustum** (2026-07-25, user-reported: zooming
  out pulled the horizon IN, clipping distant OpenStreetMap content;
  zooming in restored it). The neighborhood frustum was STATIC
  (far = 1.25·req+30000 capped at 600 k mm — couldn't even cover a 600 m
  reach); the far plane is measured FROM THE CAMERA, so the invariant is
  `far ≥ camDist + 1.25·req + 30000`. `_applyFrustumForRange` is now a
  requirement recorder; new per-frame `_updateDynamicFrustum` (zero
  alloc, 5 % hysteresis) tracks camera distance; ceilings raised
  (far 13.5 M, maxDistance 8.5 M, maxDist factor 1.15→2.2 so a 3 km
  fetch is fully frameable); stock triple still restores strict-===.
  At the far ceiling near=900 vs minDistance 1000 — raising CAM_FAR_CEIL
  further requires raising minDistance (documented at the constant).
  neighborhood-render 61→78; camera 12/12, neighborhood 95/95,
  flights-render 220/220, ghost-align 16/16, glass-see 26/26 green.

- **Flight distance scaling + landmark alignment exclusion** (2026-07-25,
  user-reported pair, single Opus pass). (a) Planes bunched overhead:
  `dispY` was distance-blind (alt band 2.5–22 k mm vs radial shell 24 k
  mm → every cruise jet read 40–60° up at any range). New
  `flightDisplayAltitudeMm` caps the log curve at the TRUE elevation
  angle (`min(compressAlt, r·altM/distM)`, yMin floor) — far aircraft
  hug the horizon, overhead stays overhead; displayed angle == true
  angle where the cap is active (golden-asserted). Default radius
  30→15 nm via ONE exported `FLIGHTS_DEFAULT_RADIUS_NM` (six call
  sites carried their own `?? 30` — hoisted so the display knee K can
  never disagree with the fetched set). Renderer `_flightScenePos`
  (which MIRRORS flightDisplayPos) routes through the same helper.
  (b) `GeoLandmark.excluded?` — "Use in alignment" checkbox per
  calibrated row; geoFit's single filter site gains `!l.excluded`
  (CSV snapshot fit + all consumers inherit); per-landmark residual
  readout (`off by N m`, worst in red ⚠, `Sidebar._fitResiduals`
  single source) to FIND the pin poisoning the user's 25–30° north
  error; excluded pins draw dashed/dimmed cyan. Tests: flights
  310→335, landmark-csv 85→114 (incl. a numeric θ-recovery fixture:
  bad pin drags 25°→47°, excluding recovers 25.000000°), geo 80/80,
  gps 28/28, compass 54/54, record-pin 53/53, render/ui suites green.

- **Flight fields, archetype models, beacons & label customization**
  (2026-07-25, released in v0.34.0; research
  `docs/research/flight-fields-models.md` + 2 sequential Opus waves).
  Wave 1 data: `FlightPoint` gained reg/typeCode/typeDesc/operator/
  emergency/squawk + interesting/pia/ladd (dbFlags bits 2/4/8);
  `C*`/`B3` non-aircraft categories filtered (LAX ramp-vehicle bug);
  `isEmergency` (enum OR squawk 7500/7600/7700); NEW pure
  `src/aircraft-types.ts` — 8 archetypes, 184-designator
  `TYPE_ARCHETYPE` (CRJ/ERJ=bizjet geometry, PC-12/King Air low-wing),
  category fallback ladder; `FlightsConfig.labelFields/beacons/
  privacyDim`; emergency alert (severity error, no 3-nm gate, prune/cap
  exempt while active, refreshed in place — live-path emit discipline
  intact). Wave 2 renderer/UI: 8-way `_buildAircraftModel` at ~2× scale
  w/ the identifier painted un-mirrored on both fuselage flanks
  (`_buildFlightIdPlanes`), archetype resolved renderer-side w/
  in-place rebuild on change; status beacons (emergency red >
  interesting yellow > military green > LADD white, 1.2 Hz, zero-alloc
  in `_advanceFlights`) + matching 2D pulse ring; privacy dimming (PIA
  identity blanked to hex, LADD dimmed but named); labelFields-driven
  3D plates + 2D text (9 field keys, canonical order); Settings ▸
  Flight tracking grew the label-field grid + beacon/privacy toggles.
  Tests: flights 160→310, flights-render 80→220, flights-ui 55→105,
  alert-center 67/67 green; chunk split intact. Noted follow-up: hoist
  the mirrored beacon/label-field resolvers (renderer + canvas-render)
  into `flights.ts`.

- **Docs program + neighborhood draw distance** (2026-07-25; 6 parallel
  agents: guide/captures/2×plans/gallery/draw-distance). Guide 9→11
  pages current through v0.29.1 w/ config steps + 9 committed feature
  screenshots captured by the NEW scripts/docs-site/features.mjs (CDP
  recipe from floorplans.mjs; live Paris tiles + live LAX aircraft in
  the shots); build.mjs gained guide-image copying. 6 showcase plans
  (appliance-showroom, garden-center, interior-design-store, zoo,
  underground-hangout, starship) — lib.mjs additively passes
  customObjects + avatarPacks (starship loads star-trek-tng); zoo
  confines animals via demo sensors in fence-loop rooms; 18-plan
  build 399/399; full capture refresh (70 shots; zoo 2D re-shot after
  a first-run boot-race blank) + all 18 ?demo= links verified.
  Gallery capture-main.ts: +6 light kinds w/ per-kind framing table,
  +siren, +gate, exhaust_wall wall-mount, ceiling-detector close-ups;
  full 653-subject forced recapture at current designs. Neighborhood
  draw distance: radius 100–3000 m via Planner.neighborhoodRadiusM()
  (single clamp), buildingCapForRadius/roadCapForRadius (400→1600 /
  600→1800), renderer _applyFrustumForRange — stock triple
  10/150000/45000 restores EXACTLY when overlay off (load-bearing:
  banner orbits + 15000:1 depth ratio for outline shells); tests
  95/95 + 61/61. Site published to gh-pages 2026-07-25 and verified
  live (18 plans in the demo manifest, 653 gallery GIFs serving, both
  new guide chapters + images 200).

- **Flight-poll scene-churn fix** (2026-07-25, user-reported: sky items
  reset every ~5 s). Routine aircraft/ISS polls emitConfig'd → configRev
  bumped → every configRev-keyed 3D group rebuilt per poll (weather
  particles re-seeded, bg-text plane/train snapped to build angle).
  Polls are now LIVE-path (flightsRev only; `_keyFlights` recomputes per
  tick); emitConfig only on status/null transitions + alert changes.
  flights-test 144→160 incl. "two polls leave configRev unchanged",
  proven failing against the pre-fix planner.

- **GPS landmark CSV import** (2026-07-25; single Opus pass). Sidebar
  GPS/Geo "⤓ Import CSV" — columns label/latitude/longitude, header in
  any order or headerless, RFC-4180-ish quoting, per-row errors w/
  partial success. Fit-poisoning guard: with a live fit rows project
  onto correct plan spots (fit-neutral); without one they import as
  `pendingPlace` pins EXCLUDED from `geoFit()` until the user places
  them (placement latch clears the flag). Label-keyed updates follow
  the manual-entry sentinel. landmark-csv-test 85/85; geo 80/80 +
  flights 144/144 regression green.

- **Roadmap P4 — flight & satellite tracking** (2026-07-25; 3 sequential
  Opus waves per `docs/research/flight-tracking.md` — that doc pinned the
  source landscape with live-curl verification: airplanes.live is the ONLY
  CORS-open cloud ADS-B API (adsb.lol/adsb.fi send no CORS header; OpenSky
  is CORS-locked to its own origin AND its ToS forbids operational product
  use); local receivers (tar1090/readsb/dump1090-fa) need a user-added
  lighttpd CORS block; satellites v1 = ISS-only via wheretheiss.at (CORS
  open, 350 req/5 min) — NO SGP4, no npm dep, pass prediction deferred.
  Wave 1 data layer: pure zero-import `flights.ts` (normalizer over
  {aircraft}/{ac}/bare-array + fr24 aliases, 'ground' filtered; asymptotic
  radius + log altitude compression into the 24 000/2 500–22 000 mm display
  shell — deliberately not to scale; bearing math; MAX_AIRCRAFT 50),
  `adsb-sources.ts` fetch isolation, `satAltAz` ECEF/ENU in sky-astro,
  planner poll wiring (cloud/local/entity sources, ISS 10 s timer,
  flightsOrigin() = geo-fit origin → weather lat/lon, flightsStatus,
  stale-tolerant). Real 94-aircraft LAX capture as fixture; 144/144.
  Wave 2 renderer: home-anchored `_flightsGroup` (persists across floors),
  persistent per-hex rigs, prop/jet/heli models by ADS-B category +
  military olive tint, prop+callsign tows a real banner (reused
  `_buildBanner`), others get cel-shaded sprite labels w/ REAL altitude,
  zero-alloc dead reckoning (eased display pos τ1.5 s, shortest-arc yaw
  shared w/ the bg tow-plane convention, YXZ order, vert-rate pitch),
  camera-recentered ISS sprite via satAltAz + `_skyScenePos(rotRad)`,
  2D dart glyphs + `flights` layer; 80/80. Wave 3 UI/alerts: Settings ▸
  Integrations block (status line, source radios w/ privacy disclosure +
  CORS hint + live mixed-content warning, radius/poll/alt filters, labels
  + ISS toggles, watch-list), airplanes.live attribution chip (stacked w/
  OSM), alert-center `'flight'` source via buildAlertFeed's new optional
  extra channel (low overflight <N ft within 3 nm w/ 10 min/hex cooldown,
  watch-list, ISS-rise edge >10°; dismiss re-arms past cooldown),
  householdEvents `flyover` → ✈️ thought bubbles; 55/55 + alert-center
  67/67 regression green. sky-astro+catalog moved to the startup chunk
  (planner imports satAltAz) — net shipped bytes unchanged, split intact.

- **Roadmap P5 — OpenFreeMap neighborhood** (2026-07-20; 3 sequential
  Opus waves per `docs/research/neighborhood-openfreemap.md`; MapLibre
  rejected for a zero-dep in-house path). Wave 1 data layer:
  hand-rolled MVT decoder (never-throws, real-tile fixtures incl.
  8191-footprint Brooklyn), z14 tile math through the landmark fit,
  height resolution w/ extraction-time verticalScale, exclusion
  helpers, 400-building cap, IDB 30-day cache, fetch/extract
  SEPARATION (align/scale/exclusion edits never refetch). Wave 2:
  toon building prisms in the active-floor frame (mirror-catch test),
  `Layers2D.neighborhood`, OSM/OpenFreeMap attribution chip. Wave 3:
  road ribbons y=3 / water y=2 / landuse y=1 (under user paint), 2D
  ghost-context underlay, `nbhd_excl` exclusion draw latch, sidebar
  Neighborhood section (align nudges, scale honesty hint, refresh),
  Settings Integrations block, offline/demo inert. 84/84 + 41/41;
  ruler-dims/floors-view/toolbar/glass-see regressions green.

- **Roadmap P1–P3** (2026-07-20; 1 Sonnet research + 3 parallel Opus).
  **P1 Lovelace card**: `<diorama-card>` third Vite entry
  (`dist/diorama-card.js`; chunkVersionQuery covered it generically; ONE
  shared three-renderer chunk) — shared per-tab Planner+adapter forced
  kiosk (store never writable from dashboards), card-LOCAL view/mode
  (`interactive` prop on canvas-2d/three-view; mode:'edit' rejected),
  both sizing APIs, reconnect-safe `_setup()`, hand-rolled editor,
  README resource docs; card-test 32/32; research
  `docs/research/lovelace-card.md`. **P2 recorded pins**: lat/lon-truth
  boundary pins re-projected through the fit at read time, tracker
  capture w/ accuracy `warn` (never refuses), manual entry, ordered
  chain + segment lengths + close-loop, convert-to-ground-area (exact
  coords); geo-test 80/80 + record-pin-test 53/53. **P3 demo deep
  links**: floorplan pages "Open in live demo"; gallery cards for
  demo-renderable types "View in demo" via the new `?model=<kind>`
  Model-viewer boot (upserted single config, 3D sims framing);
  demo-boot-test 50/50. Toolbar/config/plan-rotate/compass regressions
  green.

- **Legacy avatar-accessory migration** (2026-07-20; Fable-orchestrated:
  1 Sonnet inventory + 4 Opus agents in 3 waves). ALL 24 legacy members
  (22 kind blocks, 66 meshes + 2 disney reuses = 72 fixture builds)
  ported from the imperative `_addAvatarAccessories` to declarative
  `AvatarPrimitive[]` data; the 384-line imperative path, the
  `legacyAccessories` field, and every kind-string rig branch DELETED.
  Schema grew: `'torus'` shape, per-prim `opacity` + `segments`,
  `limbColors` object form (prosthetic vs flat-recolor semantics),
  `earSkip` side values, `gown` field. Zero visual drift proven by an
  immutable pre-migration fixture (world-geometry signatures,
  `LEGACYMIG PASS 187/187` at ≤0.05 mm, before AND after deletion).
  Prop-swap gap CLOSED (magician wand / oracle staff now hide during
  prop sessions — props-test 96→99). Inventory:
  `docs/research/legacy-accessory-migration.md`. Suites: content
  637/637, build 117/117, necktie 155/155, costume 47/47, anim 32/32.

- **Fix batch: accessories, props, floorplans** (2026-07-20; 3 parallel
  Opus agents; user-reported). Each report started narrow and uncovered a
  systemic defect:
  - **Accessories** — the reported "upside-down neckties" were actually the
    legacy `professional`/`magician` V-neck: a 3-segment cone needs
    `rotation.y = π/3` (not π/4) to face a flat facet forward, and the tie
    sat INSIDE the cone's inradius so only the cone read (wide at collar,
    pointed at sternum = a tie tapering the wrong way). Pack ties are plain
    boxes and were fine; 2 had a wrong-end clip / transposed dims. The same
    world-vertex harness then exposed the **`neck` anchor asymmetry**
    (`chest` = torso FRONT face, `neck` = torso CENTRE): **45 prims across
    34 members in 17 packs never rendered** — fixed by one uniform
    `pos.z −= 70` rule — plus 8 neck rings authored smaller than the torso
    (sized to `TORSO_D/2 + 8`, not moved, to keep the wrap). Rules now in
    `docs/avatars/AUTHORING.md` + at `anchorOf`. necktie-test 155/155 with
    a negative control.
  - **Props** — the broom's detached brush was two-handed props re-aiming
    ONLY the handle prim while attachments stayed pinned to the hand
    (~800 mm adrift; snow shovel identical). Root cause of a wider defect:
    **the rig has no wrist**, so hand-prop orientation is pure
    `Rx(shoulder+elbow)` — 11 of 13 props were mis-oriented (umbrella
    canopy BELOW the hand, watering can inverted, book facing away, vacuum
    at chest height). Fixed structurally: `PropDef.handPitch` upright
    authoring frame + an `_attachToHandle` handle convention. Broom sweep
    re-done arm-driven (was yawing the whole avatar). props-test 63→96.
  - **Floorplans** — added 4 physical checks (doorway clearance, wall
    overlap, **nav reachability**, seat alignment) + a deterministic settle
    pass, then fixed all 12 plans: chairs were **universally backwards**
    (+Y-front authoring vs the renderer's −Z), ~150 pieces sunk in walls,
    and several spaces were sealed off entirely (garage with no interior
    door, fully-railed stairwells, a laundry dead end, mudroom+garage cut
    from the house). floorplans 209→**285/285**, byte-deterministic.

- **GitHub Pages live demo** (2026-07-20; 1 Opus agent). The full app
  runs client-side on the docs site (`/demo/`) — real production build,
  offline mode, zero-click auto-start via `?demo=<slug>`
  (`shouldStartOffline` honors `?demo`/`?offline=1`), seeds the 12
  committed floorplans as selectable configs (`src/demo-seed.ts`,
  idempotent, DOM-free, out of the 3D chunk), visitor edits persist in
  their own localStorage, "Reset demo" clears them. `docs:demo` build
  step + nav link + home CTA. demo-boot-test 28/28; verified booting
  under a gh-pages subpath (13 configs, ranch active).

- **Camera: below-horizon orbit + independent H/V FOV** (2026-07-20;
  1 Opus agent). `Scene3D.belowHorizon` raises maxPolarAngle to π−0.02;
  `fovV`/`fovH` decouple horizontal from vertical via effective-aspect
  override (`aspect = tan(fovH/2)/tan(fovV/2)`, no custom projection
  matrix; resize routes through the shared apply so custom H FOV
  survives). Settings ▸ Display "Camera" subsection. camera-test 12/12,
  sky regression 23/23.

- **Real night sky + horizon-ring cleanup** (2026-07-20; 1 Opus
  agent). Pure `sky-astro.ts` + `sky-catalog.ts` (145 stars, 19
  constellations, Schlyter planet/moon ephemerides). Observer from
  geoFit → weather.lat/lon → null; with a location, night shows the
  true catalog sky (constellation lines, 5 tinted planets, real moon
  position — phase still HA), recomputed on a 60 s tick, zero new
  config. Horizon ring was a clamped-sampling artifact — replaced with
  area-uniform cap sampling + low-alt fade in both real and decorative
  modes. (Agent caught a bad cited moon golden — it was the ascending
  node value; validated via eclipse-node geometry + a 4-dp Mercury
  golden instead.) sky-astro 36/36, sky-real 22/22, weather-fx sky
  23/23 + all cases green.

- **Ghost mirror + entity-text truncation fixes** (2026-07-20; 2 Opus
  agents). (a) Ghost loop-slab Z-mirror: ShapeGeometry −π/2 rotation
  needs shape-y NEGATED (`afd/2 − wy`); feeding `asz` directly
  mirrored every loop-clipped ghost slab (user saw a mirrored floor
  outline). Off-center-loop fixture added — ghost-align 16/16. (b)
  `formatEntityValue` numeric branch strict-gated (whole-state regex;
  parseFloat prefix-parse truncated "14:35"→14, dates→year, across
  info cards + bgTexts); Title Case restricted to enum tokens; bgtext
  format UI (prefix/suffix/unit) added on entity rows. value-rules
  65→74, bgtext-multi 58→61, infocard 26/26, calendar-tv 69/69.

- **Glass-house see-through + zoom-independent fog** (2026-07-20;
  2 parallel Opus agents). (a) The dark stairwell/void plane (opaque
  1.2×-rect sheet — the user's "opaque sheet") now builds transparent
  0.18/no-depthWrite under glassHouse; ground paint (yardFill/terrace
  patches+skirts) 0.45, water/pool min(·,0.45) via a stale-chunk-safe
  `glassHouse?` param; ghost meshes get story-delta renderOrder.
  glass-see-test 26/26 + 9-suite regression sweep. (b) Weather FogExp2
  applied density scales by `clamp(REF/camDist, 0.15, 1)` (REF =
  framing distance) — zoom-out no longer grey-washes the plan; ease/
  teardown gate on the eased value. weather-fx fog 6→12, all cases
  green.

- **Glass-house ghost registration fix** (2026-07-20; 1 Opus agent;
  user-reported via peek/landmark floor alignment). Ghost floors now
  map through the ACTIVE floor's world frame (shared origin) instead
  of centering on their own w/d — different-dims floor stacks
  misregistered by half the dim difference while 2D peek + landmarks
  (world-frame) said aligned; the transit puppet already used the
  active frame. Slab still sized per-ghost. ghost-align-test 12/12
  (new); stair-link 25/25, ghost-layers, glass baseline green; no
  existing expectations changed (all prior ghost tests used
  equal-dims floors, where center ≡ origin).

- **Floor ordering, move nudges, peek mode** (2026-07-20; 1 Opus
  agent). Floors list + kiosk select display highest-story-first via
  pure `floorsDisplayOrder` (canonical array order untouched; ▲ =
  moveFloor +1). "Move plan" ↑↓←→ nudges (10/100/500 mm/1 m fixed
  metric step, device-local; one undo step each). Show/peek/hide
  tri-state (`Floor.peek2d` + existing `disabled`;
  `cycleFloorVisibility`; authored SVG peeking-monkey glyph): peek =
  enabled + dashed 2D onion-skin wall underlay of other floors
  (`drawPeekFloors` + pure `peekFloors`). floors-view-test 32/32;
  plan-rotate 68/68 + ruler-dims 63/63 regressions green.

- **Backspace-deletes-new-sensor fix** (2026-07-19; 1 Opus agent;
  orchestrator repro pinned the root cause — typing into a
  never-focused name field falls through to body → the Delete hotkey).
  Placement autofocus: 18 named-fixture creation sites →
  `markNewlyPlaced` → sidebar focuses+selects the Label input
  (`data-label-for`, skipped <900 px). Hot-selection gate:
  Delete/Backspace hotkey requires a THIS-session interactive
  selection (`selectionHot`; persisted activeSensorId loads cold).
  sensor-focus-test 9/9 (real-sidebar bundle w/ tsconfig+lit aliases);
  ruler-dims 55→63; undo 44/44 + plan-rotate 68/68 regressions green.

- **Ruler tool + wall/structure dimensions** (2026-07-19; 1 Opus
  agent; 2D-only, `dimensions` layer). `Floor.rulers` with point /
  wall / furniture ends — object ends re-resolve live (locked rulers
  track moves); wall↔wall = INSIDE clear dimension (`wallClearance`,
  faces not centerlines); 2-click latch, endpoint drags, sidebar
  length input (point-b only), translate/rotate carry.
  `Floor.dimensionMode` off/all/outside/custom (+`Wall.dimension`
  pick-latch) draws CAD dim lines per segment + structure extents;
  exterior = midpoint-on-exactly-one-loop. ruler-dims-test 55/55;
  toolbar-test 41→42; plan-rotate regression 68/68.

- **GPS distances follow imperial setting** (2026-07-19; 1 Opus agent,
  parallel). Pure `fmtDistanceM`/`fmtAccuracyM` in geo.ts (ft <1000 m,
  mi above — symmetric with the m/km branch); converted every GPS/geo
  READOUT (2D+3D pins, event-pin labels planner-side, sidebar status/
  preview/landmark accuracy/fit RMS, calibration toast); config inputs
  stay metric. geo-test → 68/68.

- **Landmark rows show coordinates** (2026-07-19; 1 Opus agent).
  Dimmed monospace `lat, lon` (6 dp) line on every calibrated landmark
  row — manual AND sampled — beside the existing status caption;
  manual-entry sentinel semantics untouched.

- **Plan rotation — set a new default top** (2026-07-19; 1 Opus agent).
  `Planner.rotateFloorContent(phiDeg)` + pure `rotPointDeg` (exact
  quarter turns): rotates every placeable/polygon/bg/model about the
  floor centre, bumps owned angle fields +φ, vacuum cal −φ (CCW),
  geo/compass north −φ (compass invariant asserted both paths),
  single-floor landmarks rotate, floor rect grows-only (no ratchet),
  mmWave headings untouched (firmware). Sidebar Floors row
  `↺15/↺1/↻1/↻15`; one undo step per click. plan-rotate-test 68/68 +
  compass regression 54/54.

- **North marker: drop "N", dusk contrast** (2026-07-19; 1 Opus agent).
  Letter removed in both views; the arrow is now two-tone — near-white
  halo/backing under a saturated red glyph (2D halo stroke; 3D 1.25×
  white backing chevron under the red one, renderOrder 2/3) so it
  reads against the dusk/sunset palette. compass-test 56→54/54 (sprite
  assertions replaced with two-decal/no-sprite checks).

- **Compass marker size + floor-stats toggle** (2026-07-19; 1 Opus
  agent). `CompassConfig.markerScale` (0.5–4, `markerScaleOf`) sizes
  the north icon in 2D + 3D (renderer param defaulted for stale-chunk
  safety; folded into `_keyCompass`); `Store.showFloorStats` (absent =
  on) gates the bottom-right floor readout with a Settings ▸ Display
  checkbox. compass-test 46→56/56.

- **On-screen compass + north marker** (2026-07-19; 1 Opus agent).
  `Store.compass` (opt-in) + pure `src/compass.ts` (`resolveNorth`
  auto-from-landmarks / manual `northDeg`-convention fallback,
  `compassScreenAngle` 2D/3D, `northMarkerPos` rect-exit) +
  `<diorama-compass>` pseudo-3D rose overlay (chipAnchorStyle anchors,
  default `tr`; rAF redraw-guarded; rotates with 3D camera azimuth via
  `lastCam3d`, fixed plan-north in 2D) + optional in-plan north icon
  (2D arrowhead+N, 3D `_compassGroup` decal+sprite under `_keyCompass`)
  + Settings ▸ Display "Compass" block. `compass-test.html` 46/46;
  typecheck/build green; chunk split intact (MeshToonMaterial grep 0).

- **BgText/camera fix batch** (2026-07-19; 1 Opus agent, orchestrator
  diagnoses pinned). Camera far 60000→150000 — the zoom-out
  "disappearing behind an invisible barrier" was far-plane clipping of
  the banner-orbit/train-loop far arcs while the camera-centered sky
  dome still painted; the skywriting sprite (one depth) popped binary
  on/off, also `frustumCulled=false` now. Chopper banner re-pivoted to
  hang from its LEADING TOP CORNER with the tow wire attached there
  (rigid under sway). Train ×1.8 (spacing 1480, wheelR 162) so car text
  reads. Grass text is multi-line word-wrapped with fit-to-area
  (`BgTextEntry.grassAreaId` → current-floor GroundArea bbox inset
  10 %, soft-fail; per-mode caps grass 160 / others 40; 40 px font
  floor + ellipsis). Skywriting weight 400 + letter spacing + softer
  glow. bgtext-multi 41→58/58; bgtext 29/29, WFX sky 23/23, terrain
  21/21.

- **Visual placement toolbar** (2026-07-19; 1 Opus agent; design
  `docs/DESIGN-toolbar.md` — shipped with deltas noted there). Bottom
  dock in edit mode: 11 category tabs → item cards with REAL 3D
  thumbnails (one hidden ThreeDRenderer via the shared lazy chunk —
  bundle split verified 0 three refs in app.js; glyph tiles for
  sensor/control fixtures + fallback; version+recipe-hash cache) →
  variant chips for door/window/wall/ground kinds (four new
  runtime-only pending kinds arm real drops, defaults unchanged).
  Pure model/arming in `tool-arm.ts` sharing the sidebar's mutations;
  dock is a layout sibling so the chip/reset button clear it free;
  collapse persists device-local. `TOOLBAR PASS 41/41`; undo 44/44,
  config 60/60 intact.

- **Polish wave 2: window glass + curtains; ground lights + flagpole**
  (2026-07-19; 2 parallel Opus agents). **Windows**: grey translucent
  glass (0.16 closed / 0.08 open / 0.42 behind a closed curtain);
  per-window curtains (`Window.curtain` roman/drape/split, side pick,
  cover-entity binding or unbound slider, eased blends, fold-ridge
  fabric, 2D ticks). `CURTAIN PASS 25/25`; window 15/15 + covers 22/22
  untouched. **Lights**: `inground` recessed uplight (lens ring + up
  cone, no floor pool) and `ground_spot` aimable stake spot
  (`Light.tilt` 5..85 + rotation azimuth, beam cone + thrown pool
  ellipse). **Flagpole** (`Floor.flagpoles`, full fixture recipe,
  furniture layer): 16-flag pure library `src/flags.ts` (10 simplified
  country + jolly_roger/checkered/smiley/pride/ghost/open_sign),
  two-FrontSide shared-texture non-mirrored flag with zero-alloc cloth
  ripple + wind yaw from `_weatherFxState`, hoist = entity percent /
  cover position → fraction (half-mast checkbox fallback, eased),
  `docs/FLAGS.md` authoring guide. `FLAGPOLE PASS 54/54`; regressions
  climate 64/64, yardlife 36/36, undo 44/44, furniture-polish 28/28.

- **Polish wave 1: aircraft fixes, robot redesign, furniture behaviors**
  (2026-07-19; 3 parallel Opus agents). **Aircraft**: chopper tow wire
  now spans real endpoints in the rigid chopper frame (sway-invariant);
  plane propeller rebuilt as hub+blades spinning about the fuselage axis
  (the old disc precessed on compound Euler angles); BOTH banners are
  paired FrontSide planes (train-flank technique, shared-map dedupe in
  `_disposeSpriteMaps`) so text reads correctly from either side.
  bgtext-multi 29→41/41. **Robots**: mower is a modern tank-style body
  (chamfered wedge, lugged drive wheels, side skirts, hump beacon in the
  robotLedColor palette, antenna); NEW `RobotFixture.progressEntity`
  (config-path) or bound-entity percent attributes drive a 10-segment
  rear strip (mower) / a 12-segment ring wrapped around the vacuum puck
  + a 2D progress arc; pure `robotProgress` in geometry. robot-test
  48→71/71. **Furniture**: mailbox flag semantics reworked (flagEntity
  'on' = outgoing waiting → flag straight up; otherwise pole horizontal,
  flag hanging down; count>0 = badge only, lid stays closed) with eased
  blends; bird-bath water; swingset seats 450×250 @350 mm registering 2
  SitSpots with occupied-pendulum pivots the seated rig rides
  (`_swingOffset`, anti-feedback intact); dark interior cavities behind
  all appliance doors; speaker cone/cabinet contrast + dust caps;
  bathtub void + bindable fill/drain (sink idiom, slower); toilet open
  lid + bowl water. FURNPOLISH 28/28; vehicle-mail updated 25→26/26.
  Merged-HEAD regressions: sink 48/48, terrain 21/21.

- **Climate appliances + multi background-text (train & chopper)**
  (2026-07-18; 2 parallel Opus agents, surgical shared-file discipline).
  **Climate**: 11 FurnitureKinds (window/mini-split/portable AC with
  hvacAirflow-colored particles, 5 floor fans — bladed trio spins +
  `Furniture.oscillate` head sweep, tower shimmer, bladeless air disc —
  space/wall heaters + towel warmer with warm-up glow blends) + 4
  LightIconKinds (heatlamp forced-red, exhaust / exhaust_wall
  wall-snapped / exhaust_light with globe, blades on the fan-rotor
  machinery). `CLIMATEAPP PASS 64/64`. **BgText multi**:
  `Store.bgTexts[]` (cap 6, legacy single-field migration), per-entry
  entity/static resolution, stagger placement, plus two NEW modes —
  message TRAIN circling outside the floor rect (car count =
  ceil(len/6) clamped to maxCars 2..12; per-car ±X flank text planes
  with reversed chunk order on the +X side so BOTH sides read
  left-to-right; cars bend around corners; wheels spin) and NEWS
  CHOPPER (spinning main/tail rotors, banner slung below on a tow line,
  opposite-direction higher orbit + hover bob; storm-hidden like
  sky/banner while grass+train stay). `BGTEXT PASS 29/29` legacy page,
  bgtext 29/29 via wrapper. Merged-HEAD green set: sink 48/48, props
  63/63, WFX sky 23/23.

- **Sinks v2 + shared avatar props + iconic-prop audit pass**
  (2026-07-18; 3 Opus agents — sink overhaul solo, then audit-fix ∥
  props-system with surgical shared-file discipline; research
  `docs/research/shared-props.md` + `avatar-prop-audit.md`). **Sinks**:
  five kinds (sink/sink_vanity/pedestal_sink/kitchen_sink/utility_sink),
  visible recessed bowls + faucets, stream + fill/drain water
  (entity/localState/wash-hands-proximity triggers; fill blend survives
  rebuilds). `SINK PASS 48/48`. **Props**: 13-prop shared library with
  hands/hover/quad eligibility, chore goal-sessions, seated snacking,
  rain umbrella on ALL rigs (pinned delta — costume-like passive
  garment), quad fetch-toy carry, authored-hand-prop swap-out,
  `Store.avatarProps` gate. `PROPS PASS 63/63`. **Audit**: top-20 iconic
  props implemented (wands, cookie, rifles, whip, Genshin weapons,
  bowcaster, T-60 minigun…) + systemic animate pass — 62 capes sway,
  15 wings flap, antennae/tentacles/drones/amulet animate; cap-guarded
  trims where needed. Full green set at merged HEAD: content 637/637,
  build 117/117, anim 32/32, interact 26/26, costume 47/47, terrain
  21/21, yardlife 36/36. CLAUDE.md franchise-pack count corrected
  (52, was long-stale at 23).

- **Terrain T4: path ribbons + pool & spa** (2026-07-18; 1 Opus agent —
  completes the terrain program, `docs/DESIGN-terrain.md` now fully
  shipped). Pure `bufferPolyline` mitered-ribbon authoring
  (`GroundArea.path` centerline+width, points = derived cache;
  centerline-only handles, Detach converts to plain polygon); `Pool`
  per-floor fixture per `docs/research/pool-spa.md` — sunken basin via
  the T1 skirt generalization, shimmer water (dedicated clone list),
  heater/pump/light bindings (heater drives the water glow; pump = 2D
  ripple), nav-blocking, `_keyPool`. Trims documented in CLAUDE.md T4
  section (equipment-pad kinds, spa bubbles, per-light discs).
  `PATHPOOL PASS 50/50`; regressions terrain 21/21, yardlife 36/36,
  fence-gate 32/32, void 10/10.

- **Terrain T3: yard life — water shimmer, fountain spray, sprinkler
  zones, rock cluster** (2026-07-18; 1 Opus agent). Water-kind ground
  patches drift a per-patch texture-offset CLONE (shared cache never
  mutated; clones disposed on rebuild/clear/destroy); fountain kind
  gains a 40-pt ballistic `THREE.Points` plume (zero-alloc advance);
  full `SprinklerZone` fixture per `irrigation-sprinklers.md` (spray
  pulse/rotor sweep/drip while the bound switch/valve is on — LIVE-path
  ids per that doc, heads terrace-aware via `_groundYAt`); `rock_cluster`
  outdoor FurnitureKind (icosahedra, nav-blocking). `YARDLIFE PASS
  36/36`; regressions terrain 21/21, yard 4/4, robot 48/48.
  CLAUDE.md T3 section by the agent.

- **Terrain T1+T2: terraced elevation, yard fill, fences & gates**
  (2026-07-18; 2 parallel Opus agents on shared files, surgical-edit
  discipline; design `docs/DESIGN-terrain.md`). **T1**:
  `GroundArea.elevationMm` terraces (skirt rings via pure
  `groundAreaSkirtBase`, angled vs vertical by kind), `_terrain` kind
  `'terrace'` with real-polygon `_groundYAt` (avatars/blobs/ROBOTS ride
  terrace tops — the mower rig previously never re-grounded, fixed),
  `Floor.yardFill` opt-in rect-minus-loops underlay, 2D contours +
  captions, sidebar inputs. `TERRAIN PASS 21/21`. **T2**: `WallKind`
  fence_picket/fence_privacy/fence_chainlink/hedge (railing/solid-
  extrusion precedents; chain-link = flat MeshBasicMaterial diamond
  plane), `Door.kind 'gate'` on the shared swing/lock/cover machinery,
  silent gate default on fence snap. `FENCEGATE PASS 32/32`. Regressions
  yard 4/4, void 10/10, window 15/15, covers 22/22. NOTE: the T2 agent
  left its test page only in its harness dir — recovered into
  test-pages/ at integration (watch for this pattern).

- **Three franchise avatar packs: Fallout TV, Sesame Street, WALL-E**
  (2026-07-18; Sonnet research → `docs/avatars/sci-fi/fallout-tv.md` /
  `cartoons/sesame-street.md` / `sci-fi/wall-e.md`, Opus build). 29 new
  members across `fallout-tv` (11 — incl. quad pet Dogmeat, hover
  Mr. Handy, T-60 knight), `sesame-street` (11 — incl. sessile
  Oscar-in-can, quad Snuffleupagus), `wall-e` (7 — true-hover EVE,
  sessile AUTO, hover-approx WALL-E/M-O/BURN-E). First shipped uses of
  `sessile: true`. All lazy chunks, default unloaded.
  `avatar-content-test` 602→**637/637**; pack 43/43, build 117/117,
  costume 47/47 intact. Earlier same day: topbar 🏠 HA-menu button moved
  to the far left (`dc70e40`). Terrain research + pinned design landed
  (`docs/research/terrain-enhancements.md`, `docs/DESIGN-terrain.md` —
  batches T1–T4 queued).

- **Avatar costume swaps + docs-site guide refresh** (2026-07-18; 2
  parallel Opus agents; design `docs/DESIGN-costumes.md`). **Costumes**:
  overlay look variants (`resolveLook`, `AvatarDef.variants`,
  `UNIVERSAL_LOOKS` sleep/exercise/cooking, trousers-predicate
  eligibility), auto triggers w/ 2 s commit / 3 s clear hysteresis, swap
  rides the existing kind-rebuild path with `_carryLookState` pose
  continuity (fused kind swaps now keep pose too), sparkle one-shot,
  `Store.avatarCostumes` + `DioramaPerson.allowCostumes` gates.
  `COSTUME PASS 47/47`; regressions avatar-anim 32/32, avatar-build
  117/117, avatar-content 602/602, pet, bgtext 29/29. This cleared the
  LAST parked avatar rig gap. **Guide**: all 9 pages current through
  v0.21 (new `info-displays.md`; devices/outdoor-weather/avatars/editor/
  configurations/3d-view/getting-started refreshed). Earlier same day:
  skywriting lowered to the banner plane's 6 m altitude; the sky dome +
  starfield recenter on the camera per frame (uCenter uniform for the
  storm band) so zooming out past 30 m can no longer show the dome shell
  as an opaque globe (`45b1bd0`).

- **Undo/redo + Delete key + avatar device interactions** (2026-07-18;
  2 parallel Opus agents). **Undo/redo**: snapshot history hooked at
  the `save()` choke point (`_pushUndoSnapshot`, differs-from-baseline;
  drags save on release so one drag = one step — verified), caps 50
  entries/8 MB per stack, restore through the shared `_normalizeStore`
  (extracted from `_applyLoadedStore` so the field list lives once)
  preserving floor/tool/pan/zoom; stacks clear in `_applyLoadedStore`
  (every config transition); topbar ↶/↷ + Ctrl/Cmd+Z / Shift+Z / Y
  behind the new pure `isEditableTarget` input guard (`dom-utils.ts`).
  **Delete key**: `Planner.deleteSelection()` — priority selected
  VERTEX (new persistent `selectedVertex` set on pzone/ground/void/wall
  vertex drag-start; polygons refuse <3 points; 2-pt wall vertex →
  whole wall) → furniture → every active-id fixture type; locked top
  selection refuses without fall-through. UNDO 44/44. **Avatar device
  interactions**: synthetic rigs ONLY (`ai`/`roam` — never radar/BLE/
  cam) take ~1/8 goals to UNBOUND interactive items (home-loop
  confinement respected), reach one-shot on arrival then
  `Planner.avatarToggleItem` — SESSION-ONLY (in-memory localState +
  emitConfig, NEVER save() — no store dirtying, no undo pollution;
  hard-refuses bound + logic lights); per-item 90 s + per-rig 45 s
  cooldowns; time-of-day flavor (night → lights ON, day → OFF); flips
  feed entityOn/recentTriggers organically (appliance doors, activity
  gates, trigger bubbles). BOUND devices: a status-contemplation bubble
  tier (💡/🌙/📺/⚡/🔌 + appliance glyphs) — think, never touch.
  `Store.avatarInteractions` gate (Settings ▸ Display, default ON).
  AVINTERACT 26/26; ai/roamer/event-bubble/fidget/config regressions
  green.

- **Sweet Home 3D structural import** (2026-07-18): `src/sh3d.ts` —
  zero-dep ZIP reader (stored + deflate via native DecompressionStream;
  clear errors on ZIP64/encryption/pre-5.3 Java-serialized saves) +
  `Home.xml` → Diorama conversion: levels → stacked floors (lowest
  first, ONE shared cm→mm Y-flip transform so levels register), walls →
  2-point Wall runs, room polygons → named Room anchors (centroid,
  interior fallback), doorOrWindow → Door/Window snapped to the nearest
  wall (center→hinge round-trip verified), best-effort furniture via an
  ordered keyword table (unmatched SKIPPED, never mystery blocks;
  checkbox default ON). Imports as a NEW configuration via
  `Planner.importSh3dConfig` after a summary confirm, warnings
  dismissible (open-plan rooms flagged, imported anyway). Buttons in
  Settings ▸ Data + the 3D Model sidebar section (distinguished from
  the visual OBJ import, which is untouched). Lazy chunk. SH3D 48/48;
  CONFIG 60/60.

- **"New…" configuration** (2026-07-18): Settings ▸ Data ▸
  Configurations gained a New… button — `Planner.newConfig(name)`
  flushes the current config's pending save onto the OLD body, then
  creates a fresh `defaultStore()` body (the first-boot constructor —
  no hand-rolled field list) under a new id and switches to it.
  CONFIG 51→60, OFFLINE 27/27.

- **Alert center + wall calendar + TV surfaces** (2026-07-17; 2 parallel
  Opus agents; both former "research only" backlog items actioned).
  **Alert center** (`src/alerts.ts` pure normalization +
  `<diorama-alert-center>` topbar bell/badge/drawer): live
  `persistent_notification/subscribe` + Repairs `repairs/list_issues`
  3-min poll (admin-degrades silently) → one `PanelAlert` shape;
  dismiss (`persistent_notification.dismiss`) + ignore-issue +
  `alert.turn_off` acknowledge; severity floor + per-source toggles in
  Settings (opt-out; bell edit-only unless `showInKiosk` — sensitive-
  data guard); placeable **alert beacon** bound to an alert./
  binary_sensor entity via effectiveState (three-state alert-domain
  quirk handled) — ALERTCENTER 67/67; system_log/logbook + toast tray
  deferred per §4.3. **Wall calendar** (`Floor.calendarPanels`,
  alarm-panel recipe): binds calendar.* entities (repeated single-pick
  rows), events via NEW `HaApi.getCalendarEvents` (calendar.get_events
  w/ return_response, BOTH clients, LocalApi []), 10-min poll cached in
  `Planner.calendarEvents`, repaint-on-change agenda face + today
  highlight; never reads entity state for events. **TV surfaces**
  (`Furniture.screenContent 'news'|'weather'` + news-entity bind):
  screen plane over the TV face (flat unlit — documented exemption) —
  scrolling RSS-headline ticker (zero-alloc offset advance) or a mini
  weather card off `weatherNow`/forecast cache; now-playing ALWAYS wins
  (folded into `_keyNowPlaying`); 2D 📰/🌤 glyph — CALTV 69/69,
  NOWPLAYING 15/15, CONFIG/OFFLINE green.

- **Per-room temperature heat-map** (2026-07-17; 1 Opus agent; the
  deferred HVAC §4.5 piece): pure `heatmapColor`/`aggregateRoomTemps`
  in geometry.ts — mean of temperature EnvSensors fuzzy-resolved into
  each room's wall loop + bound thermostats' `current_temperature`
  (only when the fixture sits inside a loop — no whole-house bleed);
  5-band ramp (cold #1e5fd0 / cool #4dd0ff / faint comfort green /
  warm #ffb74d / hot #ef5350) around a configurable comfort band
  (`Store.heatmap {comfortLo, comfortHi}`, default 20–24 °C, °F-aware
  Settings ▸ Display inputs); 2D loop fills + centroid temp labels,
  3D translucent patches in `_heatmapGroup` under `_keyHeatmap`
  (0.5°-bucketed); NEW `Layers2D.heatmap` (default OFF); sample-less
  rooms render nothing (no interpolation). HEATMAP 41/41; ROOMS +
  THERMO regressions green.

- **Decals & props + fans + plant droop + background text** (2026-07-17;
  3 parallel Opus agents). **Avatar decals** (`HumanoidFields.decals`,
  cap 2; style decision PINNED: canvas-painted decal PLANES ~8 mm proud
  of the torso chest/back — text (jersey style) / glyph (emoji) / print
  (dots/stripes/check/heart-scatter, deterministic) — flat
  MeshBasicMaterial (documented exemption: toon banding muddies fine
  text), per-rig maps freed in `_disposeHumanoid`; NEVER body texture
  maps). **Two-handed props** (`AvatarPrimitive.twoHanded` on hand
  anchors): `_advanceTwoHandProps` re-aims the prop between both hands
  per frame (zero-alloc scratch); one centered prim only (offset prims
  can't ride — authoring rule in AUTHORING.md). base-careers v3:
  athlete '7' + ★, farmer flannel, movie_star 🎬, oracle two-hand staff
  — AVATAR-BUILD 99→117, content 602/602. **Fan refinements**: signed
  nominal rps from `percentage`/`direction` seeded at build (keyLights
  folds direction), NEW `_advanceFanSpin` integrates a per-fixture
  eased velocity (`_fanSpin` survives rebuilds → continuous phase;
  reverse glides through zero; off spins down smoothly); `rot.rps` name
  kept for the docs-gallery capture seam. **Plant droop**
  (`Furniture.moistureEntity`/`moistureThreshold` on plant kinds +
  `plantDemoThirsty` test toggle): leaf/stem pivot groups ease outward
  +down 0.35 rad + wilt-brown color lerp (τ 2.2 s, survives rebuilds),
  2D 💧 chip; thirsty folded into the appliance hash — FANPLANT 16/16.
  **Background text** (`Store.bgText {mode sky|banner|grass, text,
  entityId, format}`): skywriting cloud-letter billboard (wind drift),
  toon banner plane on a high orbit (broadside-readable), grass text
  auto-placed in the widest yard margin; entity state via
  formatEntityValue; sky/banner hidden in storms; own `_keyBgText` —
  BGTEXT 29/29, WFX sky regression 23/23. ROADMAP Tier-1 stale markers
  also corrected (all five rows shipped).

- **Phase 5 — direct-MQTT bridge: Frigate ground truth + Valetudo maps**
  (`docs/DESIGN-mqtt-bridge.md`, 2026-07-17; user-continued after the
  hard pause; 3 Opus batches M-A → M-B ∥ M-C). **Bridge core**:
  `src/mqtt-ws.ts` — hand-rolled pure MQTT 3.1.1 codec (QoS 0, golden-
  byte tested incl. multi-byte remaining-length boundaries + chunk-split
  incremental decode) + browser client; `src/mqtt-bridge.ts` transport
  abstraction — Path A rides HA's `mqtt/subscribe` WS command +
  `mqtt.publish` service in BOTH HaApi clients (admin gate surfaces as
  status 'unauthorized' with a hint), Path B = direct
  MQTT-over-WebSocket (lazy chunk, backoff 2→30 s, resubscribe; creds in
  localStorage `diorama:mqtt:*` ONLY — never the synced store);
  `Store.mqttBridge` config + Settings ▸ Integrations block with live
  status pill + Test button; `Planner.mqttSubscribe` queues until up —
  MQTTCODEC 45/45, MQTTBRIDGE 18/18. **Frigate** (`src/homography.ts`
  pure DLT — exact 4-pt Gaussian, N>4 normal equations, degenerate→null
  — HOMOGRAPHY 15/15): `CameraFixture.camCalib` snapshot-click ↔
  plan-click calibration UI (detect-resolution guard + residual
  readout), `frigateName`/`color`; `frigate/events` consumption —
  slot-keyed `cam_<cam>_<label>_<slot>` targets (≤3/camera/label,
  nearest-successor handoff, end/8 s release), bbox bottom-center
  projected to floor mm, `cam_` lerp slots + GOAL-mode rigs
  (person→humanoid, dog/cat→quad, car→2D dot only), camera-tinted dots
  + 📷 badge, and cam targets JOIN `_fuseIdentities` (outdoor→indoor
  identity continuity) — FRIGATE 30/30. **Valetudo**
  (`src/valetudo-map.ts`): MapData parse (JSON-first then
  DecompressionStream deflate/gzip/deflate-raw; compressedPixels
  [xStart,y,count] runs per Hypfer MapLayer.js), segment rasters
  transformed through the robot's EXISTING dock calibration
  (`vacMapAffine` proven byte-identical to `vacuumRawToWorld`),
  per-segment tinted patches + name labels 2D/3D under the NEW
  `vacuumMap` layer (default OFF), cleaning glow (commanded-segment
  history, else all-segment), tap-to-clean →
  `MapSegmentationCapability/clean/set` `{segment_ids,[…]}` with
  confirm; `RobotFixture.valetudoId` — VALETUDO 32/32. Regressions:
  fusion 11/11, config 51/51, offline 27/27.

- **Phase 4 of the staged plan — avatar rig gaps** (2026-07-17; 2
  parallel Opus agents; HARD GATE held: all 602 content-test builds
  byte-compatible, defaults unchanged). **Static schema** (avatars.ts +
  builders): eye styles `compound`/`t_visor`/`sleepy`/`luminous` +
  `eyeColor` (humanoid AND quad `eyes`/`eyeColor`); 8 new accessory
  anchors (`wristL/R`, `elbowL/R`, `kneeL/R`, `ankleL/R` — parented to
  the swinging limb pivots); quad `legColor` (8 segments, feet stay
  pawColor), `ears:'flap'`, `snoutShape:'broad'`; deterministic
  `AvatarPattern` generator (stripes/spots/dapples, mulberry32 seeded,
  capped counts — future packs stop hand-placing stripes);
  `AvatarDef.sessile` (humanoid = rooted legless, quads keep planted
  legs; nav/facing skipped) — AVATAR-BUILD 64→99. **Animation
  channels**: `AvatarPrimitive.animate {sway|flap|orbit|spin}` (base
  transforms captured once, `_advanceAnimPrims` zero-alloc; flap runs
  2× while walking via accumulated phase), `HumanoidFields.gait
  'hop'|'knuckle'` (hop = phase-locked legs + 2.1× squash bob; knuckle
  = 1.9× arm swing to floor + proportional forward pitch — classic walk
  formulas verified byte-identical when absent), `QuadrupedFields.
  earAnimate 'swivel'|'none'` — AVATARANIM 32/32. AUTHORING.md updated
  with every field. Remaining rig-gap items deliberately NOT built:
  true fabric prints/decals/text (against the no-texture style),
  pose-aware hand props / two-handed convention, situational costume
  swaps (needs a UX decision) — still parked in ROADMAP.

- **Phase 3 of the staged plan** (2026-07-17; 1 Opus agent — the sky):
  a living backdrop in `_skyGroup`: **gradient sky dome** (inverted
  30000-radius BackSide sphere, two-uniform vertex-lerp ShaderMaterial —
  a documented `_mat` exemption; `depthWrite:false`, renderOrder −10 so
  grid/scene draw over it) colored from preset + condition + cloud
  coverage + precip, eased τ≈2 s in `_advanceWeather`, with upwind
  horizon storm-darkening tied to the existing rainSoon signal;
  **sun disc** sprite riding the SAME sun.sun azimuth/elevation the W3
  sun light uses (elev>0 + preset≠night; opacity ramp over the first
  6°); **moon prop with real phases** — `WeatherConfig.moonEntity`
  (8-state moon sensor) → per-phase canvas texture via pure
  `moonPhaseFraction` (both limbs correct), anti-sun azimuth at night
  (honest approximation, no position data exists), default full moon
  unbound; **night starfield**. `Scene3D.skyBackdrop` toggle (Display
  tab) + moon bind row (Weather tab); folded into `_keyWeather`.
  WEATHER 197/197 (+16 moon matrix), WFX `?c=sky` 23/23, all prior fx
  scenes + mega/phase6 regressions green.

- **Phase 2 of the staged plan** (2026-07-17; 2 parallel Opus agents):
  **Event-focused thought bubbles** — a TOP-priority bubble tier fed by
  `Planner.householdEvents`: appliance-finished (pause-safe ≥5 min run
  state machine on `Furniture.jobStateEntity` or a job-capable
  appliance's own entity; kinds dishwasher/laundry/oven/appliance_done +
  a blue 2D/3D "done" badge on the piece), rain_start (dry→precip once),
  severe_weather (conditionIntensity crossing ≥0.6), severe_alert
  (weatherAlerts appearing/worsening); per-rig adoption staggered 0–4 s
  via idleOffset, TTL 40 s, supersedes the recent-trigger tier —
  EVENTBUBBLE 13/13, existing bubble pages green. **Water valves**
  (`Floor.valves`, tool 🚰, sensors layer): pipe+wheel fixture,
  `valveOpenness` state matrix (valve domain w/ position, switch,
  binary_sensor display-only, localState), open = animated flow dashes
  (2D) + pulsing blue flow segment (3D, `_valveFlows` zero-alloc);
  `toggleValve` picks `open_valve`/`close_valve` BY STATE (never blind
  toggle), allowControl per device. **Smart plugs** (`Floor.plugs`, tool
  🔌, switches layer): outlet plate wall-snapped at 300 mm, switch
  toggle semantics, optional LIVE `powerEntity` (glow + W chip) —
  VALVEPLUG 53/53.

- **Phase 1 of the staged plan** (2026-07-17; 2 parallel Opus agents):
  **Sirens** as a `SafetyKind 'siren'` (blue ceiling beacon: spinning
  twin-lobe light-bar sweep + square-wave strobe + expanding rings, the
  force-rebuild-while-alarming idiom; `Planner.triggerSiren` — bound
  siren./switch. toggles, binary_sensor display-only, unbound demo;
  section retitled "Safety & sirens") — SIREN 21/21. **UV index**:
  Open-Meteo `current=` now requests `uv_index` (verified live),
  pure `parseOpenMeteoCurrent` + `uvBand` WHO banding, `chipContent.uv`
  chip row + settings checkbox — WEATHER 181/181. **Garage vehicle**:
  `car` kind (new `vehicle` cat) bound to a presence binary_sensor —
  empty bay renders the car ghosted (0.15 + dashed 2D outline, no blob
  shadow). **EV charging**: `ev_charger` kind + `Furniture.evCharger
  {statusEntity, powerEntity}` — defensive common-shape status map
  (charging/full/error/idle), pulsing port glow via `_evPulses`,
  car-side charge bolt + SoC%/kW when the charger is bound or within
  1500 mm. **Mailbox**: `mailbox` kind + `mailCount {countEntity,
  flagEntity}` — count badge sprite + raised flag when >0, lid tilts on
  the flag sensor — VEHICLEMAIL 25/25. Theater/idle regressions green.

- **Home theater fill-in** (Stage 0 of the 2026-07-17 staged plan;
  `research/home-theater-diorama.md`; 2 parallel Opus agents):
  **ProjectorFixture** (`Floor.projectors`, camera-fixture recipe, tool
  📽, sensors layer, `_keyProjectors`) — ceiling body + lens, bindable
  (media_player/switch/light; unbound localState click-toggle), optional
  `screenId` targeting a tv/wall_tv piece: the translucent light-frustum
  cone aims lens→screen via pure `projectorAim` (heading-based throw
  fallback, real throw-ratio geometry), screen-glow overlay while
  projecting, 2D dashed throw wedge. **Screen bias lighting**
  (`Furniture.biasLight {entityId?, color?}` on tv/wall_tv): emissive
  halo plane behind the panel (auto mode = while the TV plays; folds
  into the `_keyFloor` appliance hash), 2D halo ring. **Seven theater
  FurnitureKinds** (new `theater` cat optgroup for the audio gear):
  speaker_tower / speaker_bookshelf (mountable) / subwoofer /
  center_channel (mountable) with per-frame emissive driver pulses
  while their bound media_player plays (`_speakerPulses` +
  `_advanceSpeakerPulses`, subwoofer breathes slower/deeper; now-playing
  cards work kind-agnostically), theater_recliner + recliner_row3
  (3 shared-arm SitSpots; watch_tv resolves), riser_platform (walkable:
  nav-exempt like beds/rugs + `_terrain` flat top at 220 mm so rigs
  stand on it). Tests THEATER 30/30 + THEATERFURN 16/16; idle-activity
  regression green.

- **HVAC wall controls + display-only locks + action-button polish**
  (2026-07-17; 2 parallel Opus agents): **`ThermostatFixture`**
  (`Floor.thermostats`, alarm-keypad recipe: tool 🌡, wall-snap flush,
  2D plate with mode band + hvac_action pulse + airflow arcs, 3D plate +
  slatted vent under `_keyThermo` on the sensors layer) +
  **`<diorama-thermostat-modal>`** (hvac_modes/fan_modes/preset_modes
  from the entity's own attrs; setpoint steppers debounced ~400 ms,
  clamped via `clampSetpoint` min/max/step, heat_cool low/high pair;
  bound+allowControl → climate.set_* dispatch; view refuses; unbound =
  session-local demo) + **vent airflow particles** (one ~26-pt
  `THREE.Points` cloud per ACTIVE vent — heat rises red, cool sinks
  blue, fan blows grey; zero per-frame allocation, `_advanceVents` from
  `_animate`, shared `_ventTex`) — THERMO 65/65. **Display-only locks**:
  `Door.lockControl 'display'` (padlock/deadbolt/badge become passive;
  `toggleDoorLock` single enforcement point; 2D hit falls through to the
  door body) + the full lock-state visual vocabulary in one shared
  geometry resolver (jammed amber ≠ locked red, locking/unlocking
  transitional dim, unavailable grey) — LOCKOVEN 8→31. **Action-button
  residuals**: sidebar "fired N ago" via `actionLastFired`
  (scene/button state timestamp, script/automation last_triggered),
  `BUBBLE_POOL_TRIGGER.action_button` (nearby avatars react to fired
  buttons via `actionPressFx` → `_recentTrigs`), and a per-button
  ~500 ms `fireAction` cooldown (proven necessary: 3D raycast/sidebar
  paths bypass the 700 ms canvas click de-dupe) — ACTIONBTN 32/32.
  Per-room temperature heat-map (research §4.5) deliberately deferred.

- **Display & Controls arc** (`docs/DESIGN-display-controls.md`,
  2026-07-17; 4 Opus batches A/C parallel → B/D): the shared pure rule
  engine `src/value-rules.ts` (`ValueRule`/`evalRules` first-match-wins +
  `formatEntityValue` precision/unit/prefix/suffix/mapping/relative-time
  + clock/date formatting — VALUERULES 65/65); **InfoCard** fixture
  (`Floor.infoCards`, tool 🔢, own `info` layer, bind ANY entity or
  clock/date mode, billboard sprite or wall-flat plane, value→color/
  flash rules, per-frame clock repaint + flash with no rebuilds under
  `_keyInfo` — INFOCARD 26/26); **ActionButton** fixture
  (`Floor.actionButtons`, tool 🔘, rides the switches layer, dispatch
  table script/scene/button/input_button/automation/toggle/custom via
  `Planner.fireAction` with confirm gating + unbound localState pulse;
  kiosk fires, view refuses — ACTIONBTN 31/31); **logical-state lights**
  (`Light.logic {entityId, rules, offColor}` resolved planner-side
  through the SAME rule engine; flash reuses the fireplace force-frame
  idiom; click no-ops — LOGICLIGHT 22/22; shared sidebar `_ruleRows`
  editor between InfoCard + lights); **weather chip upgrades**
  (`chipAnchor` 6-way + `chipCustom` px + `chipContent` apparent/
  humidity/wind + hourly/daily forecast strips; Planner runtime
  `forecastDaily/Hourly` cache normalized to °C from entity + Open-Meteo
  sources; pure `chipAnchorStyle` — WEATHER 121/121 at C); **weather
  alerts v1** (`parseWeatherAlerts` normalizing NWS array + legacy
  pipe-joined, MeteoAlarm awareness, DWD indexed, EnvCanada, generic CAP
  → 3-level severity; `WeatherConfig.alerts {entityId, beacon}`; chip
  severity badge + expandable panel; severity-scaled sky-pulse beacon in
  the weather pipeline under `_keyWeather` — WEATHER 164/164, WFX alert
  7/7). All suites re-verified green at HEAD post-merge.

- **Deferral-clearing batch** (2026-07-17; 4 Opus agents in two waves +
  a live Open-Meteo smoke test): table-drag carries tucked chairs
  (`seatBelongsToTable`, 450 mm capture, release-time re-tuck; locked
  chairs stay); mounted pieces live-parent (per-frame delta follow incl.
  align-snaps + release re-settle; locked mounted skip; furniture has no
  rotate-handle so no rotate branch); 2D custom recipes render top-down
  primitive projections (box→rotated rect, round→ellipse, sorted by
  vertical center; labeled-rect fallback when primitive-less); 3D front
  arrow on the SELECTED custom piece (flat chevron decal, selected-id
  folded into `_keyFloor` scoped to custom pieces); privacy mosaic — a
  shared 24×32 `WebGLRenderTarget` re-rendered ≤4 Hz per rig shown with
  NearestFilter (static silhouette = no-RT fallback; disposed in
  destroy); imported OBJ/MTL toon-conversion (`_toonConvertModel`: Kd→
  color, d→opacity, per-material cache, textured mats left alone —
  sample SH3D export: 1466 meshes / 106 mats fully converted); ghost
  floors gate furniture/appliances layers (flags folded into
  `_keyGhost`); three new ambient behaviors — warm-hands at a LIT
  fireplace light (anchors from `iconKind:'fireplace'` fixtures, ON
  state checked per frame via optional `ctx.fireplaceOn`), `dance`
  fidget (standing-only, gated on the rig's room having a bound ON TV —
  can't conflict with seated watch_tv), window gazing (6 largest
  windows/floor, interior-side anchors). Tests: idle-activity 12/12,
  privacy-mosaic / model-toon / ghost-layers / custom-arrow pages all
  PASS, roadmap-geom +8 asserts, regressions (blur/glass/phase4/layers/
  fidget/ai/mega/seating) green. Open-Meteo zip search live-verified.

- **Unified docs site + demo floorplan library + config notes + equine
  manes** (`docs/DESIGN-docs-site.md`; Fable shell/design + 8 Opus
  batches): the Pages site is now full product documentation — home page,
  8-page user guide (authored fresh from CLAUDE.md in user voice;
  `scripts/docs-site/guide/*.md` + `build.mjs`), the model gallery MOVED
  under `/models/` (592 GIF refs relocated intact), and a NEW
  `/floorplans/` library — all through one shared shell
  (`scripts/docs-site/shell.mjs`: topbar nav, theme, md→html).
  `Store.notes` (free-text per-config description; Settings ▸ Data
  textarea; rides export/import; config-test 42→51). TWELVE importable
  demo floorplans (`docs/floorplans/*.json`, generated by
  `scripts/floorplans/` builder modules + a real-geometry validator —
  209/209 checks: closed loops, room anchors, opening snap, kinds,
  stair-link pairs): the 8 demo-house specs + 4 variations
  (cottage-yard, smart-home ranch, entertainer, minimalist townhouse),
  each with notes (area/rooms/elements) + themed roamers. Capture
  pipeline `docs:floorplans` drives the REAL app offline over CDP
  (seeded localStorage registry keys, `window.__dioramaPlanner` handle,
  view-mode + locked-item handle suppression, sims-cam iso poses,
  glass-house overview, topbar band cropped): 50 shots (2D + iso per
  floor + glasshouse), per-plan pages with JSON download + index with
  large thumbnails. Equine mane fix (horse/donkey/zebra strips used to
  descend the neck FRONT — under the chin): strips now climb the REAR
  edge as a proud crest (the qneck cylinder hangs from its top at
  rot.x −0.5 with a 59 mm head-end radius — three iterations to clear
  both), GIFs re-captured.

- **Gallery QA round 2 + DC Batman + plumbob identity colors**: capes now
  hang from the neck collar (builder pins the top rim — zero data churn
  across all 60 capes); fireplace/sconce rotated to face the capture
  camera; ceiling-fan rotors driven during capture (they only spun in the
  RAF); animals second reduction pass + quad clamp cap 1.2; humanoid
  static posture lean REMOVED (no angled standing — quads keep it);
  princesses got real long hair. NEW `dc-batman` pack (10 members,
  ['Sci-Fi','DC','Batman']) + `lego/batman` from Sonnet research
  (docs/avatars/sci-fi/dc-batman.md). Plumbob default is now the SOURCE
  IDENTITY color (sensor palette / motion / roamer / person color;
  explicit plumbobColor wins; fused targets stamp person color) —
  plumbob-color-test 19/19 incl. persistence-across-rebuild proofs.
  Manifest: 58 packs / 482 members; content 590/590; full regen 592/592
  GIFs republished to Pages.

- **Gallery QA round** (user visual QA of the published GIFs; 3 agents:
  capture tuning ∥ renderer fixes → 57-pack data sweep): ½-speed rotations,
  wall-facing camera fixes (lighting/switch/alarm/lock), robot + sensor
  zoom/pacing, avatar framing derived from plumbob+bubble height; renderer:
  dryer porthole door animated, rocking chair grounded, swingset A-frame
  meets the crossbar, bin lids open OUTWARD, new `shape:'cape'` draped-sheet
  primitive, posture sign fixed (positive = forward stoop), hacker pants,
  `gown` leg-swing damper (oracle force-gowned), sk clamps (humanoid
  [0.45,1.2], quad [0.2,1.35]); data sweep: 16 reported fixes (hats,
  vampire/princess gowns + hair, genie hover 650, farm/zoo/MLP/battle-cat/
  TMNT/Hulk sizes, zebra flank stripes, TMNT shell rotation, Pandora single
  tails, Cap shield flat) + 44 cone/box capes converted, 36 packs
  version-bumped, ids untouched (content 589/589, build 62/62). Full regen
  581/581 (230 MB, 45-frame captures) republished to Pages (675/675 as of 2026-07-29).

- **Docs-gallery pipeline** (`npm run docs:gallery`, `docs/GALLERY.md`;
  scripts committed, `docs-site/` output gitignored by design; **hosted at
  https://pwsh.github.io/diorama/** via `npm run docs:publish` → orphan
  `gh-pages` branch on the github remote only): fully
  scripted documentation generator — headless Chrome + CDP over native
  WebSocket drives `scripts/docs-gallery/capture-main.ts` (real renderer
  chunk + in-page gifenc) to produce per-model animated GIFs and generate
  markdown pages per placeable category (furniture/appliances/bathroom/
  outdoor/lighting/switches-controls/sensors/doors-windows/robots, cats
  enumerated dynamically) + an avatars section split by parent group with
  a subsection per pack. Animation specs: avatars 360° orbit + motion +
  own bubble glyph; appliances no-spin door/LED animations; lighting in a
  wall+floor corner cycling off→on→RGB→dim (fireplace flickers); switches/
  alarm/locks shown working; sensors/safety/robots state cycles. Verified
  full run: **675/675 GIFs (as of the 2026-07-29 regen), 0 failures, ~7.3 min, 163 MB**. One renderer
  addition: opt-in `preserveDrawingBuffer` constructor option (default
  false).

- **Roamers, multi-configuration & offline standalone**
  (`docs/DESIGN-roamers-config.md`; three Opus batches, Fable-designed;
  roamer-test **20/20**, config-test **51/51**, offline-test **27/27**,
  regressions green): persistent **roaming AI avatars** (`Floor.roamers`,
  sensor-free, motion-sensor avatar-pool selection with adult fallback,
  interior-activity goal bias 50/35/15, all UI modes, sidebar section);
  **config registry** (`diorama-configs` index + `diorama-cfg-<id>` bodies,
  legacy-key migration, last-active restore, Settings ▸ Data Configurations
  block: switch/save/save-as/rename/import-adds/export/delete-with-warning)
  + **self-contained export envelope** (whole store + user avatar packs
  from IDB; legacy JSON accepted); **offline standalone mode** (`LocalApi`
  over localStorage, auth-screen "Use offline" + persistent flag + exit
  path, Offline topbar pill, README static-serve docs) — index.html now
  runs fully outside Home Assistant.

- **Avatar-nav-stairs v2: floor voids + cross-floor stair portals**
  (completes the backlog item; `void-test` **10/10**, `stair-link-test`
  **25/25**, stairs-descend 23/23 + fusion 11/11 + full nav set green):
  `Floor.voidAreas` user-drawn no-floor polygons (presence-zone recipe,
  `ground` layer, real floor-patch holes + void plane, NAV-BLOCKED with
  stairs-family footprints bridging); `Furniture.stairLinkId` two-sided
  linked stairs (sidebar picker, broken-link handling, ▲/▼ 2D chips);
  `Planner.floorTransits` BLE floor-change detection with fusion-style
  hysteresis (2 solves + 4 s) → renderer handoff via optional
  `TargetWorld.spawnAt`/`leaveVia` (arrive = fade-in at the linked stair
  walking away; leave = walk to the stair, fade there, 6 s cap); People
  rows show "on <floor>"; glass-house transit puppet climbs `STORY_H`
  between story offsets (~8 s, `_transitGroup`, pure theater).

- **Descending stairs v1** (backlog: avatar void→stairs; renderer-only,
  `stairs-descend-test.html` **23/23**, full nav regression set green):
  nav rails confine sunken flights (blocked band on long sides + deep end,
  top open, chained-abutment aware), `_nav.sunkenFlights` deepest-tread
  precompute, AI/demo descend goals (~1/6) with bottom dwell + fast-fade
  dispose ("went downstairs") and emerge spawns (~1/4) walking up/out;
  radar/BLE never redirected. Tier-2 cross-floor transits parked — design
  in docs/research/avatar-nav-stairs.md § "Shipped design v1".

- **Avatar (Pandora) pack** — first pack authored end-to-end through
  `docs/avatars/AUTHORING.md` (Sonnet research doc → Opus module → manifest →
  gate): `avatar-pandora`, `['Sci-Fi','Avatar']`, 7 primary members (4 Na'vi
  on a shared blue body base with inline ears/tail/queue accessories + 3 RDA
  humans). Doc surfaced one schema fact worth remembering: base-merge
  REPLACES member `accessories` (never concatenates). Manifest 57 packs /
  471 members; AVATAR-CONTENT PASS 589/589.

- **Franchise expansion + authoring reference** (Fable-orchestrated;
  3 Sonnet survey agents + 24 Sonnet researchers + 4 Opus builders + a
  content gate): `docs/avatars/AUTHORING.md` — the canonical pack-authoring
  reference (pipeline, categorization taxonomy + placement tiebreaks incl.
  games-always-under-Video-Games, base-vs-franchise semantics, primary-cast
  rule + 30-px silhouette test, full schema, conventions, member template,
  reviewer checklist). **24 new franchise packs** (~192 members) researched
  from popularity surveys (TV/movies/games) and built: Breaking Bad, Game of
  Thrones, Squid Game, Money Heist, The Office, Fresh Prince, Stranger
  Things, Power Rangers MM, Marvel Avengers, Star Wars Prequels, Harry
  Potter, Pirates of the Caribbean, Wizard of Oz, Despicable Me, Shrek,
  Toy Story, Minecraft, Sonic, League of Legends, Genshin Impact, Pac-Man,
  Street Fighter, Halo, Overwatch. Audit of shipped packs added 7 missing
  primaries (OT mentor, Mandalorian warlord, LOTR Merry+Pippin, Pokémon
  fire-dragon, Mario barrel-ape) with pack version bumps + research-doc
  sync. Manifest now 56 builtin packs / ~465 members, all lazy chunks.

- **The avatar-packs arc** (`docs/DESIGN-avatars.md`; four Opus batches
  A/B/C1/C2 + a 32-agent Sonnet research sweep + a content gate — all
  Fable-orchestrated): avatars are now **packs** that load/unload +
  activate/deactivate at runtime. `src/avatars.ts` (pure shared-chunk
  registry + declarative `AvatarDef`/`AvatarPrimitive` schema), core pack
  = locked `adult` default, 23 legacy kinds split into 9 `base-*` packs
  (out-of-the-box parity: same 24 avatars + 22-humanoid random pool),
  **23 franchise packs** (default-unloaded opt-in: Star Trek TNG/DS9,
  Star Wars OT/Mandalorian, Transformers, Firefly, BBT, Friends,
  I Love Lucy, Seinfeld, IT Crowd, LOTR, Zelda, Metroid, Animal
  Crossing, Pokémon, Mario, LEGO, Disney Princess, MLP, He-Man, TMNT,
  Disney Animals) — **266 members total**, all regeneration-documented
  in `docs/avatars/**` (32 reference docs). Rig extensions: shoulder/
  neck/tailbone anchors, cylinder/oval heads, `eyes:'none'`+`noFace`,
  opacity, hover (legless float), per-limb colors, posture pitch,
  parameterized quadruped (neck/ears/tail/snout/paw/tailTip; cat+dog
  now data). Settings drawer → **tabbed** (Connection/Display/Weather/
  Avatars/Integrations/Data): pack manager with Loaded/Active/member
  subsets + JSON import/export (user packs in IndexedDB
  `avatar-store.ts`); sidebar `scene3d`/`weather`/`data` sections moved
  into the drawer, per-floor `look3d` into Floors. `Store.avatarPacks`
  config (in `_loadFromHa`). Tests: avatar-pack **43/43**, avatar-build
  **47/47**, avatar-store **23/23**, **avatar-content 302/302** (builds
  every member of every pack + 6 live frames), fusion 11/11; full
  regression suite green. Parked rig gaps → ROADMAP.

- **Batch K: the yard arc** (11 files + new `yard-test.html` **4/4**;
  full green set intact): drawable `GroundArea` polygons (grass / rock /
  concrete / blacktop / mulch / sand / water) with procedural toon
  textures at y=4 under blob shadows, own `ground` layer + tool +
  vertex editing; `Layers2D.grid` toggle for the 3D GridHelper backdrop
  (still auto-suppressed by a visible bg image); nine outdoor
  FurnitureKinds — tree, pine, bush, flower bed, bird bath, fountain,
  swingset, sittable lawn_chair (real SitSpot), picnic_table
  (surface + eat activity) — and the previously-unreachable `outdoor`
  optgroup surfaced. The roadmap's "yard/terrain concept" prerequisite
  is now real. CLAUDE.md "Yard arc (batch K)".

- **Batch J: trash/recycle bins, floodlight, camera alert popups**
  (8 files + new `batchn-test.html` **13/13**; full green set intact):
  wheeled curbside `trash_bin`/`recycle_bin` kinds (new `outdoor` cat) —
  bound sensor 'on'/'full' props the lid + overflow hint, unbound
  click-toggles; `flood` light kind (twin angled heads, ×1.4 elliptical
  pool, 70 mm wall snap); `CameraFixture.alertEntity` — alerts pulse
  the FOV wedge and pop a live-refreshing (3 s) snapshot card beside
  the camera in 2D + a sprite card in 3D, 6 s linger, all UI modes.
  CLAUDE.md "Bins, floodlight, camera alerts (batch J)".

- **Batch I: continuous walls, interactive locks, oven, bg-image fixes**
  (9 files; window-test 14→**15/15** incl. `wall_single_mesh`, new
  `lockoven-test.html` **8/8**, glass `wallOps` unchanged, full sweep
  green): wall segments rebuilt as ONE watertight ExtrudeGeometry with
  door notches + window holes (windowed segment 4 boxes → 1 mesh; the
  translucent-seam "just boxes" bug is gone; JAMB_OVL retired).
  Door locks render on both faces and are INTERACTIVE (click →
  lock.lock/unlock bound, lockLocalState unbound; kiosk yes, view no).
  Oven: tempEntity binding (2D ° chip + 3D sprite) + click-to-open
  persisted oven door alongside avatar-proximity. Background-image bug
  root-caused: layer preset hid new images (auto re-enable + hint) +
  silent HA-push failure on huge dataURLs (auto-downscale >2.5 MB) +
  HEIC error naming + zero-size SVG guard.

- **Roadmap batch H: Roborock live position + media now-playing —
  TOP 12 COMPLETE** (8 files; robot-test extended 24→**48/48**, new
  `nowplaying-test.html` **15/15**; media-raycast expectation corrected
  to 3 (stale since the local-control batch); full green set intact):
  `RobotFixture.posEntity` + map calibration (scale/offset/flip/rot,
  one-click "Set dock as reference" solve) — a bound Roborock map
  entity's live `vacuum_position` drives the 3D/2D vacuum instead of
  the simulated roam, with seamless fallback. Media now-playing: any
  furniture bound to a media_player floats a title/artist card with
  best-effort CORS album art (dedicated `_nowPlayingGroup` +
  `_keyNowPlaying`) + a 2D ♪ line. All twelve docs/ROADMAP.md picks are
  now shipped (batches E–H); the roadmap's top-12 list is checked off.
  CLAUDE.md "Roborock live position & media now-playing (batch H)".

- **Roadmap batch G: presence zones, geo event pins, cameras, plumbob
  colors** (11 files + 3 new test pages: roadmap-geom 25/25, geoevents
  16/16, plumbob-color 12/12; full green set intact): FP2/Frigate-style
  `PresenceZone` polygons (draw latch, draggable vertex handles, bind an
  occupancy binary_sensor → glow in 2D + 3D on the zones layer);
  `Planner.geoEventPins` — `geo_location.*` entities (quakes/fires)
  projected through the geo calibration, clamped, capped 20,
  `geo.showEvents` toggle; `CameraFixture` (📷 tool) with FOV wedge in
  both views, recording tint, and a sidebar snapshot thumbnail via
  entity_picture (`Planner.haBaseUrl` resolves all three connection
  modes); per-sensor plumbob colors (mmWave + motion editors,
  `TargetWorld.plumbobColor`, in-place recolor, iconic green default).
  CLAUDE.md "Presence zones, geo events, cameras, plumbob colors".

- **Roadmap batch F: garage doors, window blinds, doorbell pulses**
  (9 files + new `covers-test.html` **22/22**; typecheck + build clean;
  window 14/14 / livefeatures 19/19 / robot 24/24 / bookcase-los 11/11 /
  weather 90/90 / mega unchanged): shared pure `doorOpenFraction`
  resolver (binary + cover states + current_position; swing doors now
  open proportionally); `Door.kind 'garage'` — 5-slat overhead door in a
  2100 mm opening rolling up along a ceiling track, 2D retracting dashes
  + % pill; `Window.coverEntity` roller shade descending per position;
  `Door.doorbellEntity` (event/binary_sensor/button) → planner-side ring
  detection with the new generic TransientPulse primitive (2D 🔔 rings,
  3D `_pulseGroup`, idle = zero cost) + a doorbell bubble trigger pool.
  Entity picker now accepts multi-domain filters. CLAUDE.md "Covers &
  doorbell (batch F)".

- **Roadmap batch E + nav wall fix** (12 files; typecheck + build clean;
  NEW `bookcase-los-test.html` **11/11**; livefeatures extended
  **19/19**; avatar-bubble + phase6 updated; mega/robot/weather/full
  sweep green): **nav wall-LOS filter** — `_nearestFreeCell` candidates
  filtered by solid-wall line-of-sight (`_nav.wallSolids`) before the
  largest-region tie-break, fixing avatars snapping through wall-backed
  bookcases and locking outside; door openings still pass. Roadmap top-12
  quick wins: EnvKinds radon/sound/NO₂/O₃/AQI; SafetySensor kinds gas
  (ceiling beacon) + leak (floor puck, growing blue puddle via the W3
  texture); battery badge layer (`scanBatteryRegistry` device-sibling
  resolution, 2D badges ≤20% + sidebar 🔋 rows); appliance
  `powerEntity` glow (sqrt ramp, live-path, 50 W-bucketed into
  `_keyFloor`); `Room.occupancyEntity` glow (2D loop fill on the
  activity layer + 3D warm loop patch — the Frigate-zone quick win).
  Plus the bubble tail now originates at head center (body floats
  up-right). CLAUDE.md sections "Nav snap wall-LOS filter" + "Roadmap
  quick wins (batch E)".

- **Weather W3 + layer split batch** (12 files; typecheck + build clean,
  code split intact; weather-test **90/90** (was 53), weather-fx-test
  gained `?c=w3` 12/12; mega / livefeatures 12/12 / robot 24/24
  unchanged): per-effect weather toggles
  (`WeatherConfig.effects` + pure `weatherEffectEnabled`; effects3d stays
  master, sunPosition gated only by its own key), new visuals — cloud
  shadows from `cloud_coverage`, continuous visibility-driven fog,
  TRUE sun position from `sun.sun` azimuth+elevation through the geo θ,
  gust bursts, frost/icicles (opt-in), lingering rain puddles
  (~10 min fade, survives rebuilds), forecast storm-brewing (opt-in).
  `WeatherNow` gained cloudCoverage/visibilityKm/uvIndex/windGustKmh/
  apparentC/humidity/rainSoon; Open-Meteo fetch extended; NEW
  `HaApi.getWeatherForecasts` (weather.get_forecasts via
  return_response, both clients) refreshed every 30 min for entity
  sources. Layers: `targets` relabeled "Avatars"; lights/switches SPLIT
  (`Layers2D.switches`, own 3D `_switchGroup`, raycast parity);
  NEW `appliances` layer (furniture = non-appliance pieces; hidden
  appliances drop anchors/doors/nav). CLAUDE.md "Weather visuals W3"
  + layers section updated.

- **Robot vacuum + lawn mower** (11 files; typecheck + build clean; new
  `robot-test.html` **ROBOT PASS 24/24** — 120 s roam with 0 wall
  crossings, doorway traversal, dock convergence <150 mm, mower sweep
  outside loops + ellipse fallback, GPS round-trip + boundary clamp;
  mega + livefeatures unchanged): `RobotFixture` (`Floor.robots`, 🤖
  tool) — dock at the placed x/y, persistent per-frame rig (vacuum puck /
  mower body). Planner-side movement controller (`stepRobots` from the 2D
  RAF; `robotStates` read by both views), straight-line LOS steering
  against `segCrossesSolidWall`. Binds `vacuum.*`/`lawn_mower.*`; mower
  GPS via device_tracker (Mammotion `<name>_gps` shape, `direction`
  heading) or separate lat/lon sensors, projected through the geo
  calibration with boundary clamp; simulated boustrophedon sweep outside
  the wall loops otherwise. Unbound robots run autonomous
  run/return/dock demo cycles (kiosk/view included). Click = start/dock
  service toggle (bound) or demo flip (unbound). LED state palette
  green/blue/amber/red. CLAUDE.md section "Robot vacuum & lawn mower
  fixtures".

- **Living-house batch 2: smoke/CO detectors, appliance door animation,
  glass-house stairs/floor, cinematic orbit** (10 files; typecheck + build
  clean; new `livefeatures-test.html` **12/12**; regressions green — mega /
  appliance / glass (`wallOps` unchanged) / localstate 10/10 / seating /
  pathfind / phase4): NEW `SafetySensor` fixture (`Floor.safetySensors`,
  ⚠️ tool, smoke=red / CO=amber, ceiling disc + LED) with expanding-ring
  beacon on alarm (2D pulse rings + 3D rings, per-frame forced update via
  the fireplace idiom) and manual Test/click trigger when unbound.
  Appliance doors are now CLOSED pivot groups (`_applianceDoors`: fridge /
  dishwasher / stove / microwave / washer) eased open per frame when a
  bound fridge door sensor is on, when an unbound appliance is clicked
  (localState), or when an avatar anchors to it / dwells within 1.1 m
  (raw positions). Glass-house mode: floor slab 0.45 translucent, stairs
  0.35 + enrolled in wall cutaway with a 0.12 fade floor (per-mesh
  `cutFloor`). `Scene3D.cinematicOrbit` (🎬 next to 🎥): ~78 s/rev azimuth
  drift at current zoom, composing with auto-follow (it keeps target +
  distance), pausing 6 s on manual orbit, suspending the Sims-cam snap.
  CLAUDE.md sections added for all four.

- **Device bindings batch: appliance in-use + fridge door + door lock +
  alarm keypad** (12 files; typecheck + build clean; mega / localstate /
  appliance / walltv harness green + a new 10/10 smoke page for the 3D
  paths): appliances with an ON `effectiveState` show a pulsing green LED +
  glow (2D) and emissive indicator (3D) — three-view now folds an
  appliance-state hash into `_keyFloor` and passes a stateProvider into
  `updateFloor` (bound appliance state changes finally rebuild in 3D).
  `Furniture.doorEntity` (fridge): binary_sensor swings the 3D fridge door
  open ~70° + 2D amber wedge. `Door.lockEntity` (display-only): 2D padlock /
  3D deadbolt red-locked/green-unlocked, folded into `_keyDoors`. NEW
  `AlarmPanel` fixture (`Floor.alarmPanels`, full canvas-fixture recipe,
  tool 🚨, wall-snap no-gang, sensors layer, `_keyAlarm`):
  state-colored keypad (disarmed green / home blue / away purple /
  arming-pending amber pulse / triggered red pulse), click →
  `<diorama-alarm-modal>` — Disarm/Arm Home/Arm Away services with optional
  code when "Allow arm/disarm" is on, read-only otherwise, local demo state
  when unbound. CLAUDE.md sections "Device-state bindings on structural
  items" + "Alarm keypad fixture".

- **Thought-bubble expansion + fixes batch** (`src/three-renderer.ts` +
  `src/ui/three-view.ts` + `src/weather.ts` + `src/planner.ts` +
  `src/ui/sidebar.ts`; typecheck + build clean; weather-test up 49→**53/53**
  with forecast assertions; renderer smoke green — mega / avatar-bubble /
  avatar-lineup / ai / fidget / phase6): Sonnet-researched glyph vocabulary
  (Sims 1/2 balloon conventions). NEW top-priority **recent-trigger** bubble
  tier (fixture flipped <45 s within 3.5 m → 💡/🌙/🔥/📺 pools; three-view
  tracks flips of lights/switches/TVs via a prev-on map, 45 s / 8-entry list,
  cleared on floor switch); extended kitchen/seated/bed pools; **generalized
  idle roll** (`_rollIdleBubble`): personality ×2 + 22-glyph general pool +
  `weatherBubblePool` (current condition, 🥵/🥶 temp extremes, ☔/⛄ forecast
  anticipation) + social pool when facing a nearby rig (±75°, 3 m; pet
  variant); O(n²) scan only at roll time. `WeatherNow.forecastCondition`
  (Open-Meteo daily code[1]; legacy entity forecast attr best-effort).
  `ActivityContext` gains OPTIONAL `weather`/`recentTriggers` (stale-chunk
  safe). **Pants contrast guard** `trouserTone()` (dark tints pick farthest
  neutral navy/charcoal/khaki/olive deterministically — no more unitard on
  dark identity colors). **Athlete headband** raised 0.32→0.45·HEAD_R (ring
  0.98→0.93) — no more monk tonsure. **People GPS status honesty**:
  `Planner.gpsFixFor` reads the raw fix independent of geo calibration;
  sidebar distinguishes entity-not-found / no-location / fix-but-uncalibrated
  ("calibrate a landmark to map it") / full zone line (now always with ±m +
  age); geo-section pin preview gains an empty-state hint. Stale sidebar
  "(3D effects arrive in the next phase)" note replaced with an accurate
  description of the shipped W2 effects.

- **Floor ordering + per-floor disable** (`src/types.ts` + `src/storage.ts` +
  `src/planner.ts` + `src/ui/sidebar.ts` + `src/ui/topbar.ts` + `src/ui/app.ts`
  + `src/ui/three-view.ts`; typecheck + build clean): `Store.floors` array
  order is canonical everywhere, so `Planner.moveFloor(id, ±1)` reorders the
  sidebar list, kiosk floor picker, and glass-house stack together.
  `Floor.disabled?` (repairFloor explicit list) keeps a floor editable but
  hides it from the kiosk/view picker (`enabledFloors()`, all-disabled
  fallback), the ghost stack, the `floor=` URL param outside edit, and the BLE
  paths (proxy-MAC claiming, `_solveBle` floor ranking, `_fuseIdentities`) —
  built for coexisting test iterations of a plan. Sidebar Floors section is
  now a row list (click to switch, ▲/▼, 👁/🚫; disabled rows dim). CLAUDE.md
  section "Floor ordering & per-floor disable".

- **Local control of unbound interactive objects** (`src/types.ts` +
  `src/planner.ts` + `src/canvas-render.ts` + `src/canvas-interact.ts` +
  `src/three-renderer.ts` + `src/ui/three-view.ts` + `src/ui/sidebar.ts`;
  typecheck + build clean; new `localstate-test.html` `LOCALSTATE PASS 10/10`;
  full regression green — fusion/ai/tabletest/window/fireplace-wall/mega/
  seating/pet + phase5a/b): doors, windows, lights, switches, fireplaces, TVs
  and appliances can be controlled from the panel **without** an HA binding.
  Item-level optional `localState?: string` (no Store schema, no repairFloor/
  loadFromHa change). ONE resolver `Planner.effectiveState(item)` (bound →
  live HA state, exactly as before; unbound → synthetic `{state: localState,
  attributes: {}}`) threaded through every 2D + 3D render/interaction consumer
  (renderer mirror `itemState(item, provider)` keeps the SAME stateProvider
  closures). `Planner.toggleItem(item)` flips `localState` on unbound items
  (`'on'`↔`'off'`, playing = on) + `emitConfig` (configRev already in the dirty
  keys); wired into 2D click paths (edit + kiosk), 3D raycast, and the sidebar
  dim `local: on/off` badge. Binding makes localState inert (resolver prefers
  the entity) but keeps it — unbinding returns to the last local state.
  **Kiosk local toggles are session-only** (save() no-ops outside edit; never
  written to HA/localStorage); view mode makes no changes. A locally-ON TV/
  appliance also gates the Sims `watch_tv` / entity-gated activities
  (furniture `hasEntity` = entity-or-local). See CLAUDE.md → Toggle dispatch.

- **Seating v2 + avatar lifecycle batch** (5 user requests; `src/three-renderer.ts`
  + `src/ui/three-view.ts` + `src/types.ts` + `src/ui/sidebar.ts`; one new Store
  field `MotionSensor.demo`; typecheck + build clean; new `seating-test.html`
  `SEATING PASS`, all existing pages green — mega now `spots=6`):
  1. *Seat claims (never sit on each other)*: `SitSpot` gained a stable `id`; each
     rig stores `sitSpotId`; a per-frame `seatClaims` map rebuilt from LIVE rigs
     (can't leak to a dead rig) makes claimed spots invisible to other rigs. Covers
     AI/BLE/demo avatars (same dwell path). `sitSpot` re-resolves from the live
     array by id each frame (survives furniture rebuilds).
  2. *Multi-seat pieces*: sofas register `floor(W/600)` spots across the arm-excluded
     usable width (~504 mm pitch); benches across full width; sectionals along the
     main run + one per return arm; beds get `floor(bedWidth/700)` lie-lanes (over-
     capacity occupants stand). NEAREST-FREE capture; shared-covers still hides
     in-capacity rigs.
  3. *Front-only entry + no pass-through*: each spot carries a front normal +
     approach point; capture is gated to the front halfspace (or approach zone, or a
     raw-on-cushion exception); the seat/lie x-z blend routes THROUGH the approach
     point (bed lie enters from the foot) so the root never crosses the backrest /
     headboard.
  4. *Seated leg clearance*: lounge seats forward-shift the hip toward the cushion
     front by `depth/2 − 140` (parametrized off the actual seat depth per anchor) so
     shins clear the cushion box; eat/work seats keep centered (verified chair +
     sofa + chaise + table via tabletest/seating-test).
  5. *Respawn re-roll + demo mode*: fresh pool/`'random'` rigs re-roll their kind via
     `Math.random` (`resolveAvatar` rng param + `avatarFromPool` gate; explicit
     kinds/identified people never re-roll; recolor keeps the rolled look).
     `MotionSensor.demo` projects an always-on AI avatar with no entity binding
     (sidebar "Demo avatar" checkbox; kiosk/view render it too).
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
identity are all in `main`.

The successor arc is scaffolded in **`docs/ROADMAP.md`** (2026-07): a
research-driven ranking of future HA entity integrations — Tier 1 =
real-spatial-coordinate sources (Frigate zone occupancy → room glow,
Roborock live position, geo_location event pins, Aqara FP2 zones), plus
covers, leak puddles, doorbell pulses, battery/power layers, EnvKind
extensions, and the architectural prerequisites (transient-pulse
rendering, opt-in direct-MQTT bridge, device-sibling resolution, a
yard/terrain concept). The "living house" batches (device bindings,
alarm keypad, smoke/CO, appliance animation, robots, weather W3, layer
splits) shipped ahead of it in July 2026 — see the ledger above.

## Open threads / known deferrals

**Next planned arc (2026-07-20)** — five user-ordered items now scoped in
`docs/ROADMAP.md` ("Planned arc — 2026-07-20"), none started:
P1 Lovelace card packaging · P2 record-a-position boundary pins ·
P3 docs tiles deep-link into the live demo · P4 flight & satellite tracking
(local + cloud ADS-B) · P5 neighborhood overlay from OpenFreeMap (design:
`docs/research/neighborhood-openfreemap.md`). P5 is the large one and is to
be phased; P1 has the highest reach-per-effort.

**Deferral-clearing batch (2026-07-17)** closed most of this list — see the
ledger entry. What remains (needs the user's hardware / a live walk):

- iOS 3D load failure unconfirmed — see hardening notes above.
- Live-HA smoke tests still outstanding for: Bermuda discovery + entity
  enable against a real instance, and a landmark calibration walk with a
  phone. (The Open-Meteo zip search WAS live-tested 2026-07-17: real
  geocode `53703` → Madison WI + full current-conditions fetch — PASS.)
- Docs refreshed in full 2026-07-12 (GUIDE.md/README.md/info.md rewritten to
  the current feature set; screenshots regenerated via
  `test-pages/docs-shots.html` — 12 new modes; keep the generator's modes in
  sync when features change their look).

Cleared 2026-07-17 (details in the ledger): table-drag now carries tucked
chairs; mounted pieces live-parent to their surface host; custom recipes
draw real top-down primitive projections in 2D + a 3D front arrow when
selected; privacy blur upgraded to a live 4 Hz render-to-texture mosaic
(static silhouette kept as the no-RT fallback); imported OBJ/MTL models
toon-convert; ghost floors gate furniture/appliances on the layer flags
(the old "Walls layer" premise was wrong — no such layer exists; ghost
walls always draw exactly like active-floor walls); the three
"consider next" idle activities shipped (fireplace hand-warming via
light-fixture anchors, dance-near-TV as a standing-only fidget, window
gazing).

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
