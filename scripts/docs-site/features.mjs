#!/usr/bin/env node
// Feature-screenshot capture for the Diorama documentation GUIDE.
//
//   node scripts/docs-site/features.mjs [--only <name>] [--force] [--build] [--keep]
//
// Sibling of floorplans.mjs, reusing its exact recipe: an ephemeral static
// server over dist/, headless Chrome driven through a hand-rolled CDP client,
// localStorage pre-seeded via Page.addScriptToEvaluateOnNewDocument so the
// offline Planner boots straight into a hand-authored configuration, then the
// UI mode / view / camera driven through window.__dioramaPlanner.
//
// Where floorplans.mjs screenshots WHOLE PLANS, this script screenshots single
// FEATURES: each shot authors a compact scene that puts one capability on
// screen (yard terrain, compass, rulers, night sky, live flights, …) and lands
// a committed PNG under scripts/docs-site/guide/img/<name>.png for the guide
// markdown to reference.
//
// Store bodies are authored inline (or start from a committed
// docs/floorplans/*.json envelope's store and get mutated); everything is
// normalized by the app's own repairFloor on load, so a floor only has to carry
// the arrays the shot actually uses.
//
// No runtime deps: static server + CDP client use Node built-ins (global fetch +
// WebSocket, Node >= 22).

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const DIST = path.join(REPO, 'dist');
const OUT = path.join(__dirname, 'guide', 'img');
const PLANS_DIR = path.join(REPO, 'docs', 'floorplans');

// ── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const val = (n, d) => { const i = argv.indexOf(n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const OPTS = {
  build: flag('--build'),          // dist/ is normally already fresh; opt IN to rebuilding
  only: val('--only', null),
  force: flag('--force'),
  keep: flag('--keep'),
};

const log = (...a) => console.log('[docs-features]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── capture geometry ─────────────────────────────────────────────────────────
const VIEW_W = 1280, VIEW_H = 960;
const CLIP_TOP = 50;                 // hidden topbar's reserved layout band
const MAX_BYTES = 420 * 1024;        // committed images stay small
const DOWNSCALE_WIDTHS = [1000, 860];

// ── camera helpers (SCENE coords; _w(wx,wy,h) = (fw/2 − wx, h, wy − fd/2)) ────
const DEG = Math.PI / 180;

// Generic orbital pose: `az` is the compass-ish azimuth the camera sits at
// relative to the target (0 = camera on −Z, 45 = the classic dimetric iso pose
// floorplans.mjs uses), `el` the elevation above the target plane.
function orbitCam({ az = 45, el = 35.264, dist, target = [0, 600, 0] }) {
  const a = az * DEG, e = el * DEG;
  const r = dist * Math.cos(e), h = dist * Math.sin(e);
  const [tx, ty, tz] = target;
  return [tx - r * Math.sin(a), ty + h, tz - r * Math.cos(a), tx, ty, tz].map((v) => Math.round(v));
}
// World-mm point → scene x/z for the active floor, for working out where a
// feature actually lands before pointing a camera at it:
//   sceneX = fw/2 − worldX   (mirrored)      sceneZ = worldY − fd/2
// With the geo fit at θ = 0, scene +Z is true north and scene −X is east.

// ── pure geometry mirrored from src/geometry.ts ──────────────────────────────
// bufferPolyline: a GroundArea.path's `points` is a CACHE the app regenerates
// only on an EDIT, so an authored path has to ship its buffered polygon. This
// is a faithful mirror of geometry.ts bufferPolyline (same miter clamp, same
// left-forward / right-backward winding, same rounding).
const PATH_MIN_WIDTH = 100, PATH_MITER_LIMIT = 4;
function bufferPolyline(centerline, width) {
  if (!centerline || centerline.length < 2) return [];
  const n = centerline.length;
  const halfW = Math.max(PATH_MIN_WIDTH, width) / 2;
  const segDir = (i) => {
    const a = centerline[i], b = centerline[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  };
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    let mx, my, scale = 1;
    if (i === 0) { const d = segDir(0); mx = -d.y; my = d.x; }
    else if (i === n - 1) { const d = segDir(n - 2); mx = -d.y; my = d.x; }
    else {
      const d0 = segDir(i - 1), d1 = segDir(i);
      const n0x = -d0.y, n0y = d0.x, n1x = -d1.y, n1y = d1.x;
      const sxx = n0x + n1x, syy = n0y + n1y, slen = Math.hypot(sxx, syy);
      if (slen < 1e-6) { mx = n0x; my = n0y; }
      else {
        mx = sxx / slen; my = syy / slen;
        const cos = mx * n0x + my * n0y;
        scale = cos > 1e-3 ? Math.min(PATH_MITER_LIMIT, 1 / cos) : PATH_MITER_LIMIT;
      }
    }
    const off = halfW * scale;
    left.push({ x: centerline[i].x + mx * off, y: centerline[i].y + my * off });
    right.push({ x: centerline[i].x - mx * off, y: centerline[i].y - my * off });
  }
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: Math.round(left[i].x), y: Math.round(left[i].y) });
  for (let i = n - 1; i >= 0; i--) out.push({ x: Math.round(right[i].x), y: Math.round(right[i].y) });
  return out;
}

// geo.ts projectLatLon inverse, for authoring a geometrically CONSISTENT pair of
// calibrated landmarks: given landmark A's real lat/lon and both landmarks' plan
// positions (mm), return B's lat/lon so the Procrustes fit solves to θ = 0 and
// scale 1 (i.e. plan +Y really is true north at this location).
const EARTH_R = 6371000;
function landmarkLatLon(lat0, lon0, aPlan, bPlan) {
  const east = (bPlan.x - aPlan.x) / 1000;    // mm → m
  const north = (bPlan.y - aPlan.y) / 1000;
  return {
    lat: lat0 + (north / EARTH_R) / DEG,
    lon: lon0 + (east / (EARTH_R * Math.cos(lat0 * DEG))) / DEG,
  };
}

// ── store helpers ────────────────────────────────────────────────────────────
function planStore(id) {
  const env = JSON.parse(fs.readFileSync(path.join(PLANS_DIR, id + '.json'), 'utf8'));
  return JSON.parse(JSON.stringify(env.store));
}

// A floor only needs id/name/w/d plus whatever it uses — repairFloor backfills
// every other array on load (src/storage.ts).
function floor(f) { return { walls: [], furniture: [], lights: [], doors: [], windows: [], rooms: [], ...f }; }

// Footprints (mm) copied from FURNITURE_KINDS in src/geometry.ts. A Furniture
// item's OWN w/h are authoritative in both renderers — a piece authored with
// w:0/h:0 builds a zero-footprint (invisible) mesh, so every authored piece has
// to carry its kind's real default size.
const KIND_SIZE = {
  tree: [900, 900], pine_tree: [800, 800], bush: [700, 700], flower_bed: [900, 450],
  bird_bath: [450, 450], fountain: [1200, 1200], lawn_chair: [700, 1200],
  picnic_table: [1800, 1500], rock_cluster: [800, 600],
  sofa: [2000, 900], rug: [2000, 1400], coffee_table: [1100, 600], plant: [400, 400],
  bookshelf: [800, 350], chair: [500, 500],
};
function fu(id, kind, x, y, extra = {}) {
  const [w, h] = KIND_SIZE[kind] ?? [800, 800];
  return { id, kind, x, y, w, h, rotation: 0, entity_id: null, ...extra };
}
function store(s) {
  return {
    v: 2, activeSensorId: null, coverage: false, imperial: false,
    showDetails: false, useRawTargets: false, showMotionZones: true,
    customObjects: [], people: [], bleShowUnknown: true,
    showFloorStats: false,
    ...s,
  };
}

// DISPLAY-CLEAN body: canvas-render draws blue vertex / corner handles for every
// UNLOCKED placeable regardless of UI mode, and a persisted active selection
// draws an outline — neither wanted in a docs screenshot. `locked` is never read
// by the 3D renderer or nav, so locking is purely visual. (bg images are NOT
// locked — canvas-render skips a locked bg entirely.)
const PLACEABLE_ARRAYS = [
  'walls', 'furniture', 'lights', 'switches', 'doors', 'windows', 'sensors',
  'motionSensors', 'envSensors', 'bleProxies', 'cameras', 'robots',
  'safetySensors', 'alarmPanels', 'groundAreas', 'pools', 'sprinklerZones',
  'flagpoles', 'voidAreas', 'infoCards', 'actionButtons', 'valves', 'plugs',
];
function displayBody(s) {
  const body = JSON.parse(JSON.stringify(s));
  body.activeSensorId = null;
  for (const fl of body.floors) {
    for (const key of PLACEABLE_ARRAYS) {
      if (Array.isArray(fl[key])) for (const item of fl[key]) item.locked = true;
    }
  }
  return body;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOT SCENES
// ═══════════════════════════════════════════════════════════════════════════

// ── 2. terrain-yard: the whole outdoor toolkit on one lot ────────────────────
// Starts from the committed bungalow-cottage-yard plan (house + front yard),
// deepens the lot 15.5 m → 21 m and fills the new back yard with the yard arc:
// terraced patio, buffered path ribbon, pool basin, a RUNNING sprinkler zone
// (unbound + localState 'on' → effectiveState 'on' → sprinklerRunning true),
// flagpole, plantings, and a picket fence with a gate.
function yardStore() {
  const s = planStore('bungalow-cottage-yard');
  const f = s.floors[0];
  f.d = 21000;
  const W = f.w;   // 15750

  const rect = (x0, y0, x1, y1) => [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];

  // The back lawn is carved AROUND the pool bbox: a GroundArea patch builds at
  // y = +4 while a pool's water surface sits at −100, so grass laid over the
  // basin would simply hide the water.
  const P = { x0: 10400, y0: 15100, x1: 14800, y1: 19900 };
  f.groundAreas = [
    { id: 'ga-front', kind: 'grass', points: rect(0, 0, W, 3000) },
    { id: 'ga-left', kind: 'grass', points: rect(0, 3000, 3000, 12500) },
    { id: 'ga-right', kind: 'grass', points: rect(12750, 3000, W, 12500) },
    { id: 'ga-back-a', kind: 'grass', points: rect(0, 12500, P.x0, 21000) },
    { id: 'ga-back-b', kind: 'grass', points: rect(P.x0, 12500, W, P.y0) },
    { id: 'ga-back-c', kind: 'grass', points: rect(P.x0, P.y1, W, 21000) },
    { id: 'ga-back-d', kind: 'grass', points: rect(P.x1, P.y0, W, P.y1) },
    // driveway + planting bed carried over from the committed plan
    { id: 'ga-drive', kind: 'concrete', points: rect(5400, 0, 6400, 3000) },
    { id: 'ga-bed', kind: 'mulch', points: rect(6600, 2450, 9500, 3000) },
    // raised terrace (elevationMm → flat top + skirt ring down to grade)
    { id: 'ga-terrace', kind: 'concrete', elevationMm: 350, points: rect(4000, 12600, 9600, 15300) },
    // second, higher tier nested inside it (hand-nested = multi-tier hill)
    { id: 'ga-terrace2', kind: 'rock', elevationMm: 700, points: rect(4400, 12700, 6200, 14200) },
    // path/driveway ribbon: `points` is the buffered cache of `path.centerline`
    (() => {
      const centerline = [
        { x: 6900, y: 15300 }, { x: 6900, y: 17200 },
        { x: 9400, y: 18400 }, { x: 12600, y: 18900 },
      ];
      return {
        id: 'ga-path', kind: 'concrete',
        path: { centerline, width: 1300 },
        points: bufferPolyline(centerline, 1300),
      };
    })(),
  ];

  f.pools = [{
    id: 'pool-1', name: 'Pool', kind: 'pool', depthMm: 1500,
    points: [
      { x: 10900, y: 15400 }, { x: 13400, y: 15200 }, { x: 14700, y: 16200 },
      { x: 14700, y: 19000 }, { x: 13300, y: 19900 }, { x: 11000, y: 19700 },
      { x: 10500, y: 18000 },
    ],
  }];

  // Unbound + localState 'on' → effectiveState 'on' → sprinklerRunning true, so
  // the heads actually spray without any HA entity behind them.
  f.sprinklerZones = [
    { id: 'spr-1', x: 3100, y: 17400, entity_id: null, localState: 'on', headKind: 'spray', arcDeg: 210, rotation: 90, radius: 3400, zoneNumber: 1 },
    { id: 'spr-2', x: 3100, y: 19700, entity_id: null, localState: 'on', headKind: 'rotor', arcDeg: 150, rotation: 60, radius: 3000, zoneNumber: 2 },
    { id: 'spr-3', x: 9200, y: 20000, entity_id: null, localState: 'on', headKind: 'spray', arcDeg: 180, rotation: 300, radius: 3200, zoneNumber: 3 },
  ];

  f.flagpoles = [{ id: 'flag-1', x: 1200, y: 15600, flag: 'usa', height: 6500 }];

  // Plantings + yard furniture in the new back yard (the committed plan's own
  // front-yard trees/bushes stay put).
  f.furniture.push(
    fu('yf-tree1', 'tree', 2400, 19700),
    fu('yf-tree2', 'pine_tree', 14400, 13400),
    fu('yf-tree3', 'tree', 4200, 17300),
    fu('yf-bush1', 'bush', 3900, 15900),
    fu('yf-bush2', 'bush', 9900, 14200),
    fu('yf-bush3', 'bush', 12000, 13400),
    fu('yf-bed1', 'flower_bed', 8400, 16100),
    fu('yf-bed2', 'flower_bed', 5400, 19400),
    fu('yf-rock', 'rock_cluster', 8000, 19700),
    fu('yf-chair1', 'lawn_chair', 10000, 16400, { rotation: 90 }),
    fu('yf-chair2', 'lawn_chair', 10000, 18100, { rotation: 90 }),
    fu('yf-fount', 'fountain', 5100, 13500),
    fu('yf-bath', 'bird_bath', 3200, 12000),
  );

  // Picket fence: an OPEN "U" (never welded closed) so closedWallLoops can't
  // trace it into a spurious interior floor patch over the yard.
  f.walls.push({
    id: 'fence-back', kind: 'fence_picket',
    points: [{ x: 200, y: 14200 }, { x: 200, y: 20700 }, { x: 15550, y: 20700 }, { x: 15550, y: 14200 }],
  });
  // Gate on the back fence run. A Door's x/y is its HINGE.
  f.doors.push({
    id: 'gate-1', kind: 'gate', x: 7000, y: 20700, w: 1300, rotation: 0,
    entity_id: null, localState: 'on',   // swung open so the gate panel reads
  });

  s.scene3d = { ...(s.scene3d || {}), preset: 'day', wallCutaway: true };
  s.layers2d = { ...(s.layers2d || {}), grid: false };   // drop the 3D backdrop grid
  s.currentFloorId = f.id;
  return s;
}

// ── 4. rulers-dimensions ─────────────────────────────────────────────────────
function rulerStore() {
  const s = planStore('small-bungalow');
  const f = s.floors[0];
  f.dimensionMode = 'outside';
  f.rulers = [
    // point ↔ point: a free measurement across the living room
    { id: 'ruler-diag', a: { kind: 'point', x: 400, y: 700 }, b: { kind: 'point', x: 5300, y: 3900 } },
    // wall ↔ wall: the primary bedroom's INSIDE (clear) dimension, re-resolved
    // from live wall geometry every frame
    { id: 'ruler-room', a: { kind: 'wall', wallId: 'small-bungalow-w6' }, b: { kind: 'wall', wallId: 'small-bungalow-w13' } },
  ];
  s.currentFloorId = f.id;
  return s;
}

// ── 5. floor-peek ────────────────────────────────────────────────────────────
// A townhouse: every story shares one footprint, so the TOP floor's dense
// bedroom partitions read unmistakably as a ghost underlay over the open-plan
// ground floor (a same-footprint pair makes the registration obvious).
function peekStore() {
  const s = planStore('townhouse-3level');
  s.floors[2].peek2d = true;          // top floor draws as a 2D onion-skin…
  s.currentFloorId = s.floors[0].id;  // …while the ground floor is active
  return s;
}

// ── 3. compass-north ─────────────────────────────────────────────────────────
function compassStore() {
  const s = planStore('small-bungalow');
  s.compass = {
    show: true, source: 'manual', manualNorthDeg: 30,
    showNorthMarker: true, markerScale: 2, anchor: 'tr',
  };
  s.scene3d = { ...(s.scene3d || {}), preset: 'dusk' };
  s.currentFloorId = s.floors[0].id;
  return s;
}

// ── 6. night-sky ─────────────────────────────────────────────────────────────
// The astronomically-correct night sky needs an OBSERVER; three-view resolves it
// from the geo fit, else weather.lat/lon (src/ui/three-view.ts _weatherFxState).
function nightStore() {
  const s = planStore('studio-apartment');
  s.scene3d = {
    ...(s.scene3d || {}), preset: 'night', skyBackdrop: true,
    belowHorizon: true,   // lets the camera pitch UP past the ~88° polar cap
    fovV: 75,             // wide vertical FOV: horizon AND a high constellation in one frame
  };
  s.weather = {
    source: 'openmeteo', lat: 34.05, lon: -118.24, placeLabel: 'Los Angeles', chip: false,
    // Distance fog is scene-level FogExp2: at the sky dome's 30 m radius it
    // swallows the star catalog and the gradient dome entirely (the sky renders
    // as flat black). Clear skies want it off.
    effects: { fog: false },
  };
  // Room-name labels + the backdrop grid both read as noise against the sky.
  s.layers2d = { ...(s.layers2d || {}), labels: false, grid: false };
  s.currentFloorId = s.floors[0].id;
  return s;
}

// ── 7. neighborhood ──────────────────────────────────────────────────────────
// Two calibrated landmarks whose lat/lon are derived FROM their plan offsets, so
// the fit solves at scale 1 / θ 0 — i.e. the plan really is oriented north-up at
// this address. Origin: the garden of the Place des Vosges, Paris. Three
// constraints pin the choice: OpenFreeMap's z14 `building` layer is generalized
// (a sparse suburb comes back nearly empty), the 3D camera's far plane is 150 m,
// and a dense district's continuous blocks would BURY a 10 m house — an open
// square inside one gives the plan somewhere to stand with real facades behind.
function neighborhoodStore() {
  const s = planStore('small-bungalow');
  const f = s.floors[0];
  const LAT0 = 48.85628, LON0 = 2.36560;
  const a = { x: Math.round(f.w / 2), y: Math.round(f.d / 2) };
  const b = { x: f.w - 900, y: f.d - 900 };
  const bll = landmarkLatLon(LAT0, LON0, a, b);
  s.geo = {
    landmarks: [
      { id: 'lm-a', name: 'Front door', x: a.x, y: a.y, lat: LAT0, lon: LON0, accuracy: 4, sampleCount: 42, sampledAt: '2026-05-01T10:00:00.000Z' },
      { id: 'lm-b', name: 'Back corner', x: b.x, y: b.y, lat: bll.lat, lon: bll.lon, accuracy: 5, sampleCount: 38, sampledAt: '2026-05-01T10:12:00.000Z' },
    ],
    boundaryM: 30, accuracyGateM: 30, showEvents: false,
  };
  s.neighborhood = {
    enabled: true, source: 'openfreemap', radiusM: 200,
    // landuse ON: without a ground fill the gaps between OSM footprints read as
    // sky, and the road ribbons lose their context.
    layers: { buildings: true, roads: true, water: true, landuse: true },
    verticalScale: 1, defaultLevelHeightM: 3.2, opacity: 1,
  };
  s.scene3d = { ...(s.scene3d || {}), preset: 'day' };
  s.layers2d = { ...(s.layers2d || {}), grid: false, labels: false };
  s.currentFloorId = f.id;
  return s;
}

// ── 8. flights ───────────────────────────────────────────────────────────────
const FLIGHT_LAT = 33.9425, FLIGHT_LON = -118.408;   // LAX — busy airspace
function flightsStore() {
  const s = planStore('small-bungalow');
  s.flights = { enabled: true, source: 'cloud', radiusNm: 40, iss: true, showLabels: true, pollSeconds: 8 };
  s.weather = { source: 'openmeteo', lat: FLIGHT_LAT, lon: FLIGHT_LON, placeLabel: 'LAX', chip: false };
  s.scene3d = { ...(s.scene3d || {}), preset: 'day', skyBackdrop: true, belowHorizon: true };
  s.currentFloorId = s.floors[0].id;
  return s;
}

// ── 9. curtains-windows ──────────────────────────────────────────────────────
// One wall, five glazing kinds, four curtain treatments at four openness values
// (curtainPos: 100 = OPEN/gathered, 0 = CLOSED/covering).
function curtainStore() {
  const FW = 6400, FD = 9000;   // deep enough to stand the camera well back inside
  const win = (id, x, kind, curtain, curtainPos, extra = {}) => ({
    id, x, y: FD, w: 950, rotation: 0, entity_id: null,
    kind, sill: 800, height: 1300, curtain, curtainPos, ...extra,
  });
  return store({
    floors: [floor({
      id: 'cf1', name: 'Sun Room', w: FW, d: FD,
      walls: [{
        id: 'cw1', kind: 'full',
        points: [{ x: 0, y: 0 }, { x: FW, y: 0 }, { x: FW, y: FD }, { x: 0, y: FD }, { x: 0, y: 0 }],
      }],
      windows: [
        win('cwin1', 700, 'double_hung', { style: 'horizontal', color: '#c9b79a' }, 0),    // roman shade, CLOSED
        win('cwin2', 1930, 'casement_pair', { style: 'split', color: '#8fa9c4' }, 100),    // split pair, fully open
        win('cwin3', 3200, 'sliding', { style: 'vertical', side: 'right', color: '#c98f7a' }, 45),  // half drape
        win('cwin4', 4470, 'picture', { style: 'split', color: '#9db98f' }, 25),           // split, mostly drawn
        win('cwin5', 5700, 'single', undefined, undefined, { localState: 'on' }),          // bare, tilted open
      ],
      furniture: [
        fu('cfu1', 'sofa', 2600, 5200, { rotation: 180 }),   // front (local −Z) faces the glazed wall
        fu('cfu2', 'rug', 2900, 6300, { w: 2800, h: 1900 }),
        fu('cfu3', 'coffee_table', 2900, 6300),
        fu('cfu4', 'plant', 5900, 8100),
        fu('cfu5', 'bookshelf', 400, 5600, { rotation: 90 }),
        fu('cfu6', 'chair', 5100, 5600, { rotation: 200 }),
      ],
      // Floor lamp tucked into the right-hand corner: light without a ceiling
      // fixture hanging through the middle of the shot.
      lights: [{ id: 'cl1', x: 5900, y: 6800, entity_id: null, localState: 'on', iconKind: 'lamp', height: 1500, radius: 1400 }],
      rooms: [{ id: 'crm1', name: 'Sun Room', anchor: { x: 3200, y: 4200 } }],
    })],
    currentFloorId: 'cf1',
    scene3d: {
      preset: 'day', floorTex: 'wood', floorColor: '#c89a63',
      wallColor: '#f3e9d8', wallCutaway: false, plumbobs: false,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOT LIST
// ═══════════════════════════════════════════════════════════════════════════
// Each shot: { name, store, floorId?, view, uiMode, cam?, postCam?, postEval?,
//              waitFor?, waitMs?, seedExtra?, keep? }
//   cam       — applied via planner.urlTemplate before the 3D view mounts
//   postCam   — [pos, target] re-applied through the renderer AFTER settle
//               (also flips belowHorizon), for poses past the polar clamp
//   preEval   — JS run BEFORE waitFor (kick off data the shot then waits for)
//   waitFor   — JS predicate polled (up to waitMs) before the shot settles
//   postEval  — JS run AFTER waitFor (runtime-only injections on top of live data)
//   settleMs  — extra settle before the screenshot (eased sky/fog glides)
//   keep      — chrome selectors to NOT hide (the chrome IS the subject)
//   seedExtra — extra localStorage key/value pairs
const HIDE = {
  topbar: 'diorama-topbar',
  weather: 'diorama-weather-chip',
  threeBar: 'diorama-three-view > div:not(#three-area)',
  reset2d: 'diorama-canvas-2d .btn-sm',
  floorStats: 'div[style*="bottom:10px;right:10px"]',
};
const DEFAULT_HIDE = ['topbar', 'weather', 'threeBar', 'reset2d', 'floorStats'];

const SHOTS = [
  // 1 ── the visual placement toolbar (edit chrome IS the subject) ────────────
  {
    name: 'toolbar',
    desc: 'Edit mode, 2D: the bottom placement toolbar expanded over a furnished plan.',
    store: () => { const s = planStore('small-bungalow'); s.currentFloorId = s.floors[0].id; return s; },
    view: '2d', uiMode: 'edit',
    // sidebar closed so the dock + canvas get the full width; the dock itself
    // must NOT be collapsed
    seedExtra: { 'diorama:sidebarOpen': '0', 'diorama:toolbar:collapsed': '0' },
  },

  // 2 ── yard / terrain toolkit ───────────────────────────────────────────────
  {
    name: 'terrain-yard',
    desc: '3D: ground coverings, terraces, a path ribbon, pool, running sprinklers, flagpole and a picket fence with a gate.',
    store: yardStore,
    view: '3d',
    // Looking back over the yard toward the house (camera on the far fence side).
    cam: orbitCam({ az: 200, el: 25, dist: 17500, target: [-625, 500, 6100] }),
  },

  // 3 ── compass + north marker ───────────────────────────────────────────────
  {
    name: 'compass-north',
    desc: '3D at dusk: the compass rose widget plus the in-plan north chevron.',
    store: compassStore,
    view: '3d',
    // manualNorthDeg 30 puts the north marker off the plan's +Y edge; orbit to
    // the mirrored iso azimuth so that edge (scene +Z) faces the camera and the
    // chevron lands in the FOREGROUND rather than behind the house.
    cam: orbitCam({ az: 225, el: 32, dist: 9750 * 1.7, target: [0, 300, 900] }),
  },

  // 4 ── rulers + wall dimensions ─────────────────────────────────────────────
  {
    name: 'rulers-dimensions',
    desc: '2D: CAD dimension lines on every exterior wall plus two rulers (free point-to-point and a wall-to-wall clear dimension).',
    store: rulerStore,
    view: '2d',
  },

  // 5 ── floor peek (onion-skin underlay) ─────────────────────────────────────
  {
    name: 'floor-peek',
    desc: '2D: the upper floor set to "peek" draws as a dashed onion-skin underlay beneath the active ground floor.',
    store: peekStore,
    view: '2d',
  },

  // 6 ── real night sky ───────────────────────────────────────────────────────
  {
    name: 'night-sky',
    desc: '3D at night: the gradient sky dome with the astronomically-correct star catalog, constellation lines and moon.',
    store: nightStore,
    view: '3d',
    cam: orbitCam({ az: 40, el: 12, dist: 20000, target: [0, 3000, 0] }),
    // The catalog only carries stars to mag 3.71, so which stars are up depends
    // entirely on the wall clock — an unpinned capture is a coin flip. Pin the
    // epoch through the renderer's own test hook (setSkyEpochOverride, which
    // recomputes immediately) to a January evening over Los Angeles, when Orion
    // is high in the south, and aim the camera there. `north = scene +Z`
    // (θ = 0), so "look south" = look toward scene −Z.
    postEval: `(function(){
      var tv=document.querySelector('diorama-three-view'); var r=tv&&tv._renderer;
      if(!r) return 'no-renderer';
      r.setSkyEpochOverride(Date.parse('2026-01-25T05:00:00Z'));
      return 'epoch-pinned';})()`,
    // The moon's scene position EASES (~2 s) toward its computed alt/az, so a
    // fast capture catches it mid-glide, still near the wall-clock position.
    settleMs: 6000,
    // Aimed due east (scene −X is east when θ = 0) at ~20° elevation: the full
    // moon sits at alt 27° / az 89° at the pinned epoch, the eastern winter
    // constellations fill the frame, and the horizon + apartment stay in shot.
    postCam: { pos: [8998, 900, -157], target: [-5096, 6030, 89], belowHorizon: true },
    waitMs: 4000,
  },

  // 7 ── neighborhood overlay (live OpenFreeMap tiles) ────────────────────────
  {
    name: 'neighborhood',
    desc: '3D: real surrounding buildings, roads and water from OpenFreeMap vector tiles, positioned by the landmark geo fit.',
    store: neighborhoodStore,
    view: '3d',
    cam: orbitCam({ az: 45, el: 30, dist: 40000, target: [0, 2000, 0] }),
    // ~62 m out / ~33 m up at 30°, looking roughly north (scene +Z when θ = 0):
    // the plan in the near third with the real Place des Vosges facades and the
    // streets behind it, at a scale where both still read.
    postCam: {
      pos: [-18364, 33000, -50457], target: [0, 2000, 0],
      belowHorizon: false, maxDistance: 400000,
    },
    settleMs: 1500,
    // The overlay is deliberately inert in offline mode (Planner._reconfigureNeighborhood
    // gates on isOffline). "Offline" here means "no HA backend", not "no
    // internet" — flip the flag the getter reads and re-run the resolve so the
    // capture fetches real tiles.
    preEval: `(function(){var p=window.__dioramaPlanner;
      try{ if(p.hass) p.hass.offline=false; }catch(e){}
      p._reconfigureNeighborhood();
      return 'nbhd-kicked';})()`,
    waitFor: `!!(window.__dioramaPlanner && window.__dioramaPlanner.neighborhoodData
                 && (window.__dioramaPlanner.neighborhoodData.buildings||[]).length > 0)`,
    waitMs: 25000,
    retry: true,
  },

  // 8 ── live flights + ISS ───────────────────────────────────────────────────
  {
    name: 'flights',
    desc: '3D: live ADS-B aircraft on the compressed sky shell with callsign labels/banners, plus the ISS.',
    store: flightsStore,
    view: '3d',
    cam: orbitCam({ az: 45, el: 14, dist: 24000, target: [0, 7000, 0] }),
    // Stand OUTSIDE the 24 m display shell (compressRadiusMm's asymptote) — from
    // inside it, an aircraft between the camera and the target looms across the
    // frame instead of reading as traffic.
    postCam: { pos: [22600, 6000, 22600], target: [0, 9000, 0], belowHorizon: true },
    // Real traffic first (poll is ~8 s); then guarantee one CLOSE prop plane
    // (banner-towing: prop + callsign) and the ISS regardless of what the live
    // feed happened to hold at capture time.
    waitFor: `!!(window.__dioramaPlanner && (window.__dioramaPlanner.flightsNow||[]).length > 0)`,
    waitMs: 25000,
    postEval: `(function(){var p=window.__dioramaPlanner;
      var extra=[
        {hex:'d0c5a1',callsign:'DIORAMA',lat:${(FLIGHT_LAT + 0.12982).toFixed(5)},lon:${(FLIGHT_LON - 0.09033).toFixed(5)},
         altFt:3200,gsKt:115,trackDeg:120,vertRateFpm:0,category:'A1',seenPosS:0,military:false,distNm:9},
        {hex:'d0c5a2',callsign:'N472DL',lat:${(FLIGHT_LAT - 0.10096).toFixed(5)},lon:${(FLIGHT_LON - 0.07026).toFixed(5)},
         altFt:2400,gsKt:105,trackDeg:20,vertRateFpm:-200,category:'A1',seenPosS:1,military:false,distNm:7}
      ];
      var keep=(p.flightsNow||[]).filter(function(f){return f.hex!=='d0c5a1'&&f.hex!=='d0c5a2';});
      p.flightsNow=extra.concat(keep);
      p.issNow={lat:${FLIGHT_LAT + 0.5},lon:${FLIGHT_LON},altKm:420,velKmS:7.66,tsMs:Date.now()};
      p.flightsRev++;
      return (p.flightsNow||[]).length;})()`,
    retry: true,
  },

  // 9 ── window kinds + curtains ──────────────────────────────────────────────
  {
    name: 'curtains-windows',
    desc: '3D interior: five window kinds along one wall with roman, drape and split curtains at different openness.',
    store: curtainStore,
    view: '3d',
    // Interior eye-level pose, looking at the glazed wall (scene +Z) from well
    // back inside the room. postCam re-applies it after settle so the framing
    // survives whatever the mount-time template did.
    postCam: { pos: [0, 2100, -1150], target: [0, 1550, 4500], belowHorizon: false },
    cam: orbitCam({ az: 0, el: 5, dist: 6100, target: [0, 1500, 4500] }),
  },
];

// ── minimal static file server (dist/) ───────────────────────────────────────
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.map': 'application/json', '.json': 'application/json', '.css': 'text/css',
  '.gif': 'image/gif', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm', '.ico': 'image/x-icon',
};
function startServer(root) {
  const server = http.createServer((req, res) => {
    try {
      const url = decodeURIComponent(req.url.split('?')[0]);   // strip ?v= chunk-pin queries
      const file = path.join(root, url === '/' ? '/index.html' : url);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

// ── minimal CDP client ───────────────────────────────────────────────────────
function findChrome() {
  for (const c of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']) {
    const r = spawnSync('which', [c], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  throw new Error('no chromium/google-chrome found on PATH');
}
async function launchChrome() {
  const bin = findChrome();
  const port = 9300 + Math.floor(Math.random() * 600);
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dfe-chrome-'));
  const args = [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`,
    '--no-sandbox', '--disable-gpu-sandbox', '--hide-scrollbars', '--mute-audio',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--window-size=1300,1000', 'about:blank',
  ];
  const proc = spawn(bin, args, { stdio: 'ignore' });
  let ws = null;
  for (let i = 0; i < 100; i++) {
    try {
      const j = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      if (j.webSocketDebuggerUrl) { ws = j.webSocketDebuggerUrl; break; }
    } catch { /* not up yet */ }
    await sleep(100);
  }
  if (!ws) { proc.kill('SIGKILL'); throw new Error('chrome devtools endpoint never came up'); }
  return { proc, ws, userDir };
}

class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); this.sessionId = null; }
  async connect() {
    this.sock = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => { this.sock.onopen = res; this.sock.onerror = rej; });
    this.sock.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.consoleAPICalled' && this.onConsole) this.onConsole(msg.params);
      if (msg.id != null && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
      }
    };
  }
  send(method, params = {}, useSession = true) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (useSession && this.sessionId) payload.sessionId = this.sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.sock.send(JSON.stringify(payload));
    });
  }
  async openTarget() {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' }, false);
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true }, false);
    this.sessionId = sessionId;
    await this.send('Runtime.enable');
    await this.send('Page.enable');
    return targetId;
  }
  async closeTarget(targetId) {
    this.sessionId = null;
    try { await this.send('Target.closeTarget', { targetId }, false); } catch { /* ignore */ }
  }
  async eval(expression, awaitPromise = false) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error(d.exception?.description || d.text || 'eval error');
    }
    return r.result?.value;
  }
  close() { try { this.sock.close(); } catch { /* ignore */ } }
}

// ── seed script ──────────────────────────────────────────────────────────────
// Wipe stale diorama:* keys (localStorage is shared across a profile's tabs),
// then seed the offline config registry + this shot's body. The page always
// boots 2D (offline standalone never runs _applyUrlParams), so a later switch to
// 3D mounts <diorama-three-view> FRESH and its _applyUrlTemplate picks up the
// cam we set on planner.urlTemplate — the one window in which cam is applied.
function seedScript(id, name, body, extra = {}) {
  const index = { version: 1, activeId: id, configs: [{ id, name, updatedAt: 0 }] };
  const extras = Object.entries(extra)
    .map(([k, v]) => `ls.setItem(${JSON.stringify(k)},${JSON.stringify(String(v))});`).join('');
  return `(function(){try{
    var ls=window.localStorage;
    Object.keys(ls).forEach(function(k){ if(k.indexOf('diorama')===0) ls.removeItem(k); });
    ls.setItem('diorama:offline','1');
    ls.setItem('diorama:local:diorama-configs', ${JSON.stringify(JSON.stringify(index))});
    ls.setItem('diorama:local:diorama-cfg-'+${JSON.stringify(id)}, ${JSON.stringify(JSON.stringify(body))});
    ls.setItem('diorama:view','2d');
    ls.removeItem('diorama:store:v1');
    ${extras}
  }catch(e){}})();`;
}

const rafPair = (delayMs) =>
  `new Promise(function(r){setTimeout(function(){
     requestAnimationFrame(function(){requestAnimationFrame(function(){r(true);});});
   },${delayMs});})`;

// ── one shot ─────────────────────────────────────────────────────────────────
async function shoot(cdp, origin, shot) {
  const body = displayBody(shot.store());
  const floorId = shot.floorId ?? body.currentFloorId;
  const is3d = shot.view === '3d';
  const targetId = await cdp.openTarget();
  const consoleMsgs = [];
  cdp.onConsole = (p) => consoleMsgs.push(p);
  try {
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: VIEW_W, height: VIEW_H, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.addScriptToEvaluateOnNewDocument',
      { source: seedScript(shot.name, shot.name, body, shot.seedExtra) });
    await cdp.send('Page.navigate', { url: origin + '/index.html' });

    // Readiness: planner exists, the config loaded, and the shot's floor is active.
    let ready = false;
    for (let i = 0; i < 300; i++) {
      try {
        ready = await cdp.eval(
          `!!(window.__dioramaPlanner && window.__dioramaPlanner.store &&
             Array.isArray(window.__dioramaPlanner.store.floors) &&
             window.__dioramaPlanner.store.floors.length > 0 &&
             window.__dioramaPlanner.store.currentFloorId === ${JSON.stringify(floorId)})`);
      } catch { ready = false; }
      if (ready) break;
      await sleep(100);
    }
    if (!ready) throw new Error(`config/floor never became active (${shot.name} @ ${floorId})`);

    const mode = shot.uiMode ?? 'view';
    const drive = is3d
      ? `p.uiModeLocked=true; p.setUiMode(${JSON.stringify(mode)}); p.urlTemplate={cam:${JSON.stringify(shot.cam ?? null)}}; p.setView('3d');`
      : `p.uiModeLocked=true; p.setUiMode(${JSON.stringify(mode)}); p.setView('2d');`;
    await cdp.eval(`(function(){var p=window.__dioramaPlanner; ${drive} })()`);

    if (is3d) {
      let canvas = false;
      for (let i = 0; i < 200; i++) {
        try {
          canvas = await cdp.eval(
            `!!(document.querySelector('#three-area canvas') &&
               document.querySelector('#three-area canvas').width > 0)`);
        } catch { canvas = false; }
        if (canvas) break;
        await sleep(100);
      }
      if (!canvas) throw new Error(`three canvas never mounted (${shot.name})`);
      await cdp.eval(rafPair(600), true);
    } else {
      await cdp.eval(rafPair(350), true);
    }

    // preEval runs BEFORE the waitFor poll — for shots whose data only starts
    // resolving once the capture kicks it off (the neighborhood overlay is inert
    // in offline mode until the flag is flipped and the resolve re-run).
    if (shot.preEval) {
      const v = await cdp.eval(shot.preEval, true);
      log(`  preEval(${shot.name}) \u2192 ${JSON.stringify(v)}`);
    }

    // Network-backed data (neighborhood tiles / ADS-B poll): poll a predicate.
    let waitOk = true;
    if (shot.waitFor) {
      waitOk = false;
      const deadline = Date.now() + (shot.waitMs ?? 15000);
      while (Date.now() < deadline) {
        try { waitOk = !!(await cdp.eval(shot.waitFor)); } catch { waitOk = false; }
        if (waitOk) break;
        await sleep(500);
      }
    }

    if (shot.postEval) {
      const v = await cdp.eval(shot.postEval, true);
      log(`  postEval(${shot.name}) → ${JSON.stringify(v)}`);
      await cdp.eval(rafPair(400), true);
    }

    // Re-apply the camera through the renderer AFTER settle — the only way to
    // reach a pose past the OrbitControls polar clamp, since setBelowHorizon and
    // the urlTemplate cam are both applied inside the same tick.
    if (shot.postCam && is3d) {
      const { pos, target, belowHorizon, maxDistance } = shot.postCam;
      // OrbitControls clamps to maxDistance (45 m) inside setCameraView's
      // update(), so a shot that has to stand back further than the house-scale
      // default (the 400 m neighborhood overlay) raises the cap first.
      const r = await cdp.eval(`(function(){
        var tv=document.querySelector('diorama-three-view');
        var r=tv&&tv._renderer; if(!r) return 'no-renderer';
        try{ r.setBelowHorizon(${belowHorizon ? 'true' : 'false'}); }catch(e){}
        ${maxDistance ? `try{ r._controls.maxDistance = ${maxDistance}; }catch(e){}` : ''}
        r.setCameraView(${JSON.stringify(pos)},${JSON.stringify(target)});
        return 'ok';})()`);
      if (r !== 'ok') log(`  postCam(${shot.name}) → ${r}`);
      await cdp.eval(rafPair(400), true);
    }

    // Extra settle for scenes with eased/animated content (the sky's sun/moon
    // positions and the fog density glide over seconds, not frames).
    await cdp.eval(rafPair(shot.settleMs ?? (is3d ? 700 : 200)), true);

    // Hide chrome (visibility:hidden keeps layout so the canvas backing store
    // is untouched), one more frame, then clip below the topbar's reserved band.
    const hideKeys = DEFAULT_HIDE.filter((k) => !(shot.keep ?? []).includes(k));
    const css = hideKeys.map((k) => HIDE[k]).join(',\n') + ' { visibility: hidden !important; }';
    await cdp.eval(
      `(function(){var s=document.getElementById('dfe-hide')||document.createElement('style');
         s.id='dfe-hide';s.textContent=${JSON.stringify(css)};document.head.appendChild(s);})()`);
    await cdp.eval(rafPair(0), true);

    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: CLIP_TOP, width: VIEW_W, height: VIEW_H - CLIP_TOP, scale: 1 },
    });
    let buf = Buffer.from(data, 'base64');

    // Keep committed images small: progressively downscale in-page (canvas) and
    // take the first result under the budget.
    for (const w of DOWNSCALE_WIDTHS) {
      if (buf.length <= MAX_BYTES) break;
      const smaller = await downscale(cdp, buf, w);
      if (smaller && smaller.length < buf.length) buf = smaller;
    }
    // A tiny PNG almost always means the canvas painted nothing — surface the
    // page's console errors rather than silently committing a blank image.
    if (buf.length < 20 * 1024) {
      const errs = consoleMsgs.filter((m) => m.type === 'error').slice(0, 6)
        .map((m) => (m.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
      if (errs.length) log('  page console errors:', errs.join(' | '));
    }
    return { buf, waitOk };
  } catch (e) {
    const errs = consoleMsgs.filter((m) => m.type === 'error').slice(0, 4)
      .map((m) => (m.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
    if (errs.length) log('  page console errors:', errs.join(' | '));
    throw e;
  } finally {
    cdp.onConsole = null;
    await cdp.closeTarget(targetId);
  }
}

// Re-encode a PNG at a smaller width using the page's own canvas (no deps).
async function downscale(cdp, buf, width) {
  try {
    const b64 = buf.toString('base64');
    const out = await cdp.eval(`(function(){return new Promise(function(res){
      var img=new Image();
      img.onload=function(){
        var w=${width}, h=Math.round(img.height*w/img.width);
        var c=document.createElement('canvas'); c.width=w; c.height=h;
        var g=c.getContext('2d'); g.imageSmoothingQuality='high';
        g.drawImage(img,0,0,w,h);
        res(c.toDataURL('image/png').split(',')[1]);
      };
      img.onerror=function(){res(null);};
      img.src='data:image/png;base64,${b64}';
    });})()`, true);
    return out ? Buffer.from(out, 'base64') : null;
  } catch { return null; }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  const shots = OPTS.only ? SHOTS.filter((s) => s.name === OPTS.only) : SHOTS;
  if (!shots.length) { console.error(`[docs-features] --only ${OPTS.only} matched no shot`); process.exit(2); }

  if (OPTS.build) {
    log('building app (npm run build)…');
    const r = spawnSync('npm', ['run', 'build'], { cwd: REPO, stdio: 'inherit' });
    if (r.status !== 0) throw new Error('npm run build failed');
  }
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('dist/index.html missing — run with --build');
  }
  fs.mkdirSync(OUT, { recursive: true });

  const { server, port } = await startServer(DIST);
  const origin = `http://127.0.0.1:${port}`;
  log('serving dist/ →', origin);

  const chrome = await launchChrome();
  const cdp = new CDP(chrome.ws);
  await cdp.connect();

  const results = { captured: [], skipped: [], failed: [] };
  let i = 0;
  for (const shot of shots) {
    i++;
    const dest = path.join(OUT, shot.name + '.png');
    if (!OPTS.force && fs.existsSync(dest)) { results.skipped.push(shot.name); continue; }
    const tag = `[${i}/${shots.length}] ${shot.name}.png`;
    let attempt = 0;
    const maxAttempts = shot.retry ? 2 : 1;
    for (;;) {
      attempt++;
      try {
        const { buf, waitOk } = await shoot(cdp, origin, shot);
        if (!waitOk && attempt < maxAttempts) {
          log(`${tag} waitFor timed out — retrying (${attempt}/${maxAttempts})`);
          continue;
        }
        fs.writeFileSync(dest, buf);
        results.captured.push({ name: shot.name, bytes: buf.length, waitOk });
        log(`${tag} → ${(buf.length / 1024).toFixed(0)} KB${waitOk ? '' : '  (waitFor TIMED OUT — fallback content)'}`);
        break;
      } catch (e) {
        if (attempt < maxAttempts) { log(`${tag} attempt ${attempt} failed (${e.message}) — retrying`); continue; }
        results.failed.push({ name: shot.name, error: String(e.message || e) });
        log(`${tag} FAILED: ${e.message || e}`);
        break;
      }
    }
  }

  cdp.close();
  chrome.proc.kill('SIGKILL');
  server.close();
  if (!OPTS.keep) { try { fs.rmSync(chrome.userDir, { recursive: true, force: true }); } catch { /* ignore */ } }

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n──────── docs-features summary ────────');
  console.log(`captured: ${results.captured.length}   skipped(existing): ${results.skipped.length}   failed: ${results.failed.length}   of ${shots.length}  (${secs}s)`);
  for (const c of results.captured) console.log(`  ${c.name}.png  ${(c.bytes / 1024).toFixed(0)} KB${c.waitOk ? '' : '  [waitFor timed out]'}`);
  const small = results.captured.filter((c) => c.bytes < 20 * 1024);
  if (small.length) {
    console.log('WARNING — under 20 KB (possibly blank):');
    for (const c of small) console.log(`  - ${c.name}.png = ${(c.bytes / 1024).toFixed(1)} KB`);
  }
  if (results.failed.length) {
    console.log('failures:');
    for (const f of results.failed) console.log(`  - ${f.name}  ${f.error}`);
  }
  console.log(`→ ${path.relative(REPO, OUT)}/`);
  process.exit(results.failed.length ? 1 : 0);
}

main().catch((e) => { console.error('[docs-features] FATAL', e); process.exit(2); });
