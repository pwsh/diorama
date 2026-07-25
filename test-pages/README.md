# Deterministic 3D test pages

Headless-verification harness for `ThreeDRenderer`. Each page imports the
built renderer chunk directly, constructs a scene from inline fixtures, and
(usually) drives `updateTargets` with a **synthesized `performance.now`
clock** so animation states (walking, sitting, activities, bed covers,
bubbles, despawn fades) are deterministic. Results are exposed two ways:
`document.title` carries machine-checkable assertions; the canvas carries
the visual.

## Running

```bash
npm run build
mkdir -p /tmp/diorama-harness && cp -r dist/* test-pages/* /tmp/diorama-harness/
cd /tmp/diorama-harness && python3 -m http.server 8931 &

# assertion dump
google-chrome --headless=new --window-size=1280,880 --virtual-time-budget=9000 \
  --disk-cache-size=1 --dump-dom "http://localhost:8931/mega-test.html?b=$RANDOM" \
  | grep -o "<title>[^<]*</title>"

# screenshot
google-chrome --headless=new --window-size=1280,880 --hide-scrollbars \
  --virtual-time-budget=9000 --disk-cache-size=1 \
  --screenshot=out.png "http://localhost:8931/mega-test.html?b=$RANDOM"
```

Gotchas: always pass a cache-busting query (`?b=$RANDOM`) AND, when
iterating on the renderer, bust the module import too
(`import('./assets/three-renderer.js?v=' + Date.now())`) — Chrome caches
module subresources aggressively. `--virtual-time-budget` is required or
the screenshot fires before first render.

## Key pages / baselines

| Page | Asserts (title) |
|---|---|
| mega-test.html | seating: `sit=1.00 dwell=7.0 spot=true spots=6` (seating v2: the 2000 mm sofa registers 3 spots, + toilet/ottoman/stool) |
| seating-test.html | `SEATING PASS` — v2 claims/multi-seat/approach: two rigs on one chair → exactly one sits (roots ≥ 300 mm apart); 2400 mm sofa → 4 spots, three rigs sit at distinct spots ≥ 500 mm apart; approach-from-behind never captures until the raw pos is in front; 1500 mm bed → 2 lie-lanes, third occupant stands |
| pathfind-test.html | `PATH PASS cross=true[door-x] sofa=true(0) arrive=true` + nav samples |
| phase4-test.html | all solo activities engage, shower `priv=1.00` |
| phase5-test.html | `?scene=a` eat/work/tv seated; `?scene=b` bed covers hide rigs |
| phase6-test.html | `PHASE6 PASS` — committed bubble is drawn FROM the expected weighted POOL per scene/tb (kitchen-night/morning, seated-evening, bed), or suppressed (`-`) when an activity engages |
| event-bubble-test.html | `EVENTBUBBLE PASS n/n` — event-focused bubbles (Phase 2a). Drives BOTH the real `Planner` (bundled `planner.mod.js`, faked `Date.now`) — appliance ≥5 min run→finished fires once / short run + fast blip do NOT fire / pause keeps the run alive / rain-start fires once / cloudy→lightning = severe / alert empty→warning = severe_alert — AND the renderer event tier (`three-renderer.mod.js`, faked `performance.now`) — event beats seated-evening, expires after `EVENT_TTL_S`=40 s, per-rig stagger (idleOffset) means two rigs don't adopt the same frame, far appliance event is distance-gated. Bundle both via esbuild like config-test/rooms-test (see the page's build comment) |
| avatar-bubble.html | `BUBBLE PASS` — walk: committed chatter glyphs ∈ the kind's `AVATAR_BUBBLES` pool; wash: an engaged activity suppresses the bubble |
| fidget-test.html | `FIDGET PASS` — wave-on-spawn fires + ≥3 distinct idle one-shots, all from the known 8-fidget set (`?test=stretch\|phone\|wave` freeze a pose) |
| avatar-anim-test.html | `AVATARANIM PASS n/n` — Phase 4b animated appendages (`AvatarPrimitive.animate` sway/flap/orbit/spin: sinusoidal + phase independence, flap 2× speed while walking, orbit constant radius, spin monotonic), gait cycles (`gait` hop = phase-locked legs + bigger bob; knuckle = torso pitched + arm>leg amplitude), quad `earAnimate: 'swivel'`, and a defaults-byte-match guard (adult walk joints == the classic formulas) |
| ai-test.html | AI avatar wanders in-region, engages, presence-off slow fade |
| avatar-lineup.html / newkinds-test.html | all avatar kinds render |
| tabletest.html | table clearances: `rootEdge=190`, hands AND elbows above `top − 10` across adult+child × eat/work/tall (`dHand*`/`dElb*` all ≥ 0) |
| glass-test.html | `ghosts=1 wallOps=[0.06,0.06,0.22,0.22]` (cutaway) |
| step-test.html / stepneg-test.html | step-light pools front-only; sunken wash down |
| layers-test.html | `?nofurn=1` hides furniture+lights in 3D |
| rooms-test.html | `ROOMS PASS n/n` — real export: ≥4 loops, 4 anchors in 4 distinct loops (25 mm weld heal). Uses `geometry.mod.js` (`npx esbuild src/geometry.ts --bundle --format=esm --outfile=<harness>/geometry.mod.js`) |
| wallsnap-test.html | `WALLSNAP PASS n/n` — pure `snapToWallEdge` (both sides, h/v/diag), fireplace flush offset 275, switch wall-lock + `gangSlot` ganging, `nearestAlign` smart-guide selection. Uses `geometry.mod.js` (same esbuild transpile as rooms-test) |
| sliver-test.html | `SLIVER PASS n/n` — region-size-aware `_nearestFreeCell`: AI spawns in the open room, not the sliver behind furniture |
| window-test.html | `WINDOW PASS n/n` — per-kind pane counts (single/double_hung/casement_pair/sliding/picture), open behaviour per kind, custom sill/height moves the glass + wall sub-sill/header cut boxes (asserts mesh Y bounds) |
| bubble-anchor-test.html | `BUBBLE PASS n/n` — thought bubble anchored per-rig off the plumbob (child < supermodel, above head top, adult ≈ 2462) + stays 460 mm above the plumbob and drops in world space when seated |
| fireplace-wall-test.html | `FIREPLACE PASS` — mantel back flush with the firebox back plane (D2/2 = 225), never proud (skips inverted-hull outline shells via `userData.outline`) so a wall-snapped fireplace doesn't poke through |
| flights-test.html | `FLIGHTS PASS n/n` — roadmap P4 flights & ISS. Pure `flights.ts` (normalizer over a REAL 94-aircraft airplanes.live capture + hand-authored readsb/garbage fixtures in `fixtures/adsb/`: `alt_baro:"ground"` filtered, no-position/string-lat rejected, `{ac}`/`{aircraft}`/bare-array envelopes equivalent, dbFlags bit-1 military, alt_geom fallback; compression curves monotonic + bounded; bearing/distance goldens + a great-circle cross-check) + `sky-astro.satAltAz` goldens (overhead ≈ π/2, antipodal < 0, cardinal azimuths) + the REAL `Planner` over a fake HaApi with `globalThis.fetch` stubbed (poll → status/rev, disabled/no-origin are inert with ZERO fetches, geo-fit origin beats `weather.lat/lon`, radius+altitude filters, nearest-first `MAX_AIRCRAFT` cap, failed poll keeps last data, `entity` source reads attributes with no timer, `setFlights` round-trips through `_normalizeStore`). Bundle: `flights.ts` plain (zero-import), `sky-astro.ts` `--bundle`, planner per the config-test recipe |
| flights-render-test.html | `FLIGHTSRENDER PASS n/n` — roadmap P4 wave 2 (renderer + 2D). Drives `updateFlights` / `updateIss` / `_advanceFlights(dt)` directly with synthetic `FlightPoint`s: rig lifecycle (diff-by-hex, dying fade over `FLIGHT_FADE_S`, disposal detaches the asm + frees the per-rig label CanvasTexture, mid-fade re-acquire revives the SAME rig), model kinds (A1→prop w/ Z-spinning prop, A3/absent→jet w/ 2 engine-pod cylinders + no prop, A7→heli w/ Y main rotor + X tail rotor, military tint ≠ civil), label policy (prop+callsign → towed banner; everything else → camera-facing sprite; `showLabels:false` tears both down), placement (fresh rig snaps to `flightDisplayPos`, anchor moves `_flightsGroup` not the rig offsets, `_flightScenePos` == the pure `flightDisplayPos` to 1e-3 mm), heading (north-bound at θ=0 → nose at scene **+Z**, θ=π/2 → +X, a 90° track change EASES), dead reckoning (lon advances at ground speed, radius grows flying away, no gs/track → holds), pitch sign (climb = +rotation.x = nose above horizon), ISS (overhead → zenith at the 26 m shell, below-horizon/no-observer/no-fix hidden, ~1° altitude ramps opacity < 0.5, `_issGroup` camera-recentered, ground-track rates from the fix PAIR), layer gating both ways, and poll-correction ease (strictly between old and new). Bundle: `flights.ts` plain (zero-import), `sky-astro.ts` `--bundle` |
| flights-ui-test.html | `FLIGHTSUI PASS n/n` — roadmap P4 wave 3 (settings/alerts UI layer). Pure `alerts.ts`: the new back-compatible `buildAlertFeed(..., extra?)` channel (client-local alerts appended verbatim, sorted with the rest, and NOT subject to the per-source toggles or the Repairs severity floor; omitting the arg reproduces the old feed exactly). Then the REAL `Planner` over a fake HaApi with `globalThis.fetch` stubbed and a frozen/advanceable `Date.now`, driving `_computeFlightAlerts()` directly: low-overflight (fires below the threshold within the 3 nm overhead gate, hex-keyed 10 min cooldown, second hex is its own alert, 8 nm out and blank-threshold are both inert, no-callsign falls back to the uppercase hex), watch list (callsign PREFIX + exact hex, lowercase config entries re-uppered at match time, 30 min cooldown then a replace-not-stack re-fire), ISS pass as a below→above 10° EDGE detector (fires once, staying up never re-fires, `issPass:false` never fires, altitude in the title), dismissal (local mute with no service call, gone from `alertFeed`, other sources untouched, view mode refuses), the 15 min retention prune, the house-wide `flyover` household event (`furnitureId: null`, only on a real low overflight), `setFlights` watch normalization (trim/uppercase/drop-blanks, all-blank → undefined), and feed integration (warning outranks an info notification; a disabled Alert Center or disabled flights empties everything). Bundle: `alerts.ts` `--bundle`, planner per the config-test recipe |
| landmark-csv-test.html | `LANDMARKCSV PASS n/n` — GPS-landmark CSV import. Pure `parseLandmarkCsv` (header in any order + extra columns, headerless numeric first row, unrecognized header skipped with a note, quoted labels w/ commas + `""` escapes + embedded newlines, CRLF, blank lines, trimmed cells, one error per bad row while good rows still import, 200-row cap, garbage never throws) + the REAL `Planner` over a fake HaApi (config-test bundle recipe): **with a live fit** rows project via `latLonToPlan` onto exact plan mm and the refit is neutral (pair count grows, θ/tx/ty/fittedScale unchanged, rms stays sub-mm; the fit is snapshotted ONCE so later rows don't drift) — the fixture's calibration pair is derived from its own plan coords via `unprojectMeters`, so the baseline fit is exact; **with no fit** rows import `pendingPlace` in a spaced row at the floor centre and `geoFit()` EXCLUDES them (no poisoning) until placement clears the flag; label-keyed update path (case-insensitive/trimmed, keeps x/y, sets `sampledAt`, clears accuracy+sampleCount, a pending landmark stays pending, in-file duplicates collapse); edit-only (kiosk/view refuse); one import = ONE undo step. Bundle: `geo.ts` plain (zero-import), planner per the config-test recipe |
| neighborhood-test.html | `NEIGHBORHOOD PASS 95/95` — OpenFreeMap overlay data layer: MVT decode over real z14 tile fixtures, tile math, height/exclusion/align/cap helpers, and the REAL `Planner` fetch/cache/re-extract paths over a fake HaApi + fake tile store. Includes the **radius-scaled render caps** (`buildingCapForRadius` / `roadCapForRadius`: base caps at `CAP_REF_RADIUS_M` 500 m, never below them, 2× at 1000 m, clamped at the 1600/1800 ceilings, monotonic, NaN-safe; `capBuildings` honors a passed cap above the default and defaults to `MAX_BUILDINGS` when omitted) and `tilesForRadius` at the 3 km ceiling (16 z14 tiles at Brooklyn's latitude, ⊇ the 350 m set). Bundles: `mvt-decode.ts` plain, `neighborhood.ts` + `geo.ts`, planner per the config-test recipe (with `fake-neighborhood-store.ts`) |
| neighborhood-render-test.html | `NBHDRENDER PASS 61/61` — the overlay's renderer half: building prisms in the active-floor frame (incl. the asymmetric-footprint front-to-back **mirror catch**), podium `baseMm`, one shared material, `outlineSkip` + no outline shells, self-intersecting rings pre-rejected, flat road/water/landuse patches at y=3/2/1, per-layer color overrides, the road-ribbon cap (default 600, raised/lowered via `cfg.maxRoads`), layer gating, and the **dynamic camera frustum** (`_applyFrustumForRange`): stock triple 10 / 150000 / 45000 at rest and with near content; a 100 m-distant building grows `far` to `1.25·req + 30000` with `near = far/15000` and `maxDistance = req·1.15`; 2.5 km content clamps at 600000 / 550000 (near 40, minDistance still clears it); `far/near ≤ 15000` in every state; `resize()` preserves the widened values; null/empty data restores the stock triple EXACTLY |
| localstate-test.html | `LOCALSTATE PASS n/n` — local control of UNBOUND objects (`entity_id: null` + `localState`): door/window open via localState (green sash emissive), unbound bulb lit + off dim + fireplace lit, and a locally-`'on'` TV gating `watch_tv` (off ≠ watch_tv). Exercises `itemState()` + the `hasEntity` (entity-or-local) flag; the same `stateProvider` closures carry it through |

These were written incrementally by coding agents; fixtures reference the
entity-shape the renderer expects (`stateProvider`-style closures), not a
live HA connection.
