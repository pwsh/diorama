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
| mega-test.html | seating: `sit=1.00 dwell=7.0 spot=true spots=4` |
| pathfind-test.html | `PATH PASS cross=true[door-x] sofa=true(0) arrive=true` + nav samples |
| phase4-test.html | all solo activities engage, shower `priv=1.00` |
| phase5-test.html | `?scene=a` eat/work/tv seated; `?scene=b` bed covers hide rigs |
| phase6-test.html / avatar-bubble.html | bubble rules + role bubbles |
| ai-test.html | AI avatar wanders in-region, engages, presence-off slow fade |
| avatar-lineup.html / newkinds-test.html | all avatar kinds render |
| tabletest.html | table clearances: `rootEdge=190`, hands on top |
| glass-test.html | `ghosts=1 wallOps=[0.06,0.06,0.45,0.45]` (cutaway) |
| step-test.html / stepneg-test.html | step-light pools front-only; sunken wash down |
| layers-test.html | `?nofurn=1` hides furniture+lights in 3D |
| rooms-test.html | `ROOMS PASS n/n` — real export: ≥4 loops, 4 anchors in 4 distinct loops (25 mm weld heal). Uses `geometry.mod.js` (`npx esbuild src/geometry.ts --bundle --format=esm --outfile=<harness>/geometry.mod.js`) |
| wallsnap-test.html | `WALLSNAP PASS n/n` — pure `snapToWallEdge` (both sides, h/v/diag), fireplace flush offset 275, switch wall-lock + `gangSlot` ganging, `nearestAlign` smart-guide selection. Uses `geometry.mod.js` (same esbuild transpile as rooms-test) |
| sliver-test.html | `SLIVER PASS n/n` — region-size-aware `_nearestFreeCell`: AI spawns in the open room, not the sliver behind furniture |
| window-test.html | `WINDOW PASS n/n` — per-kind pane counts (single/double_hung/casement_pair/sliding/picture), open behaviour per kind, custom sill/height moves the glass + wall sub-sill/header cut boxes (asserts mesh Y bounds) |
| bubble-anchor-test.html | `BUBBLE PASS n/n` — thought bubble anchored per-rig off the plumbob (child < supermodel, above head top, adult ≈ 2462) + stays 460 mm above the plumbob and drops in world space when seated |
| fireplace-wall-test.html | `FIREPLACE PASS` — mantel back flush with the firebox back plane (D2/2 = 225), never proud (skips inverted-hull outline shells via `userData.outline`) so a wall-snapped fireplace doesn't poke through |

These were written incrementally by coding agents; fixtures reference the
entity-shape the renderer expects (`stateProvider`-style closures), not a
live HA connection.
