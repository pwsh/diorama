# Project status & pick-up guide

Last updated: 2026-07-16, at **v0.14.0 + the avatar-packs arc** (unreleased).
This is the single document to read (alongside `CLAUDE.md`) to resume work
with full context.

## Where things stand

Diorama is feature-complete through TWO arcs — the Sims-2000 arc
(`docs/DESIGN-sims.md`, 7 phases) and the World Outside arc
(`docs/DESIGN-world.md`, 8 phases: BLE identity/trilateration/fusion, pet
rigs, GPS geo-calibration + pins, weather core + 3D effects) — plus the
post-arc batches listed below. Everything is merged to `main`, pushed to
**both remotes**, released through **v0.14.0**, and deployed to the live HA
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
  3D grid layer toggle).

### Shipped since the DESIGN-sims arc (reverse order)

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
