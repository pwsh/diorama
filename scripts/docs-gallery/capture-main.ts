// Docs-gallery capture harness (browser side).
//
// esbuild-bundled at run time by scripts/docs-gallery/generate.mjs into the temp
// serve dir (bundles gifenc + the avatar-pack manifest/data + geometry catalog).
// The BUILT dist renderer chunk (./assets/three-renderer.js) is loaded at RUNTIME
// via a variable-specifier dynamic import so esbuild leaves it external — exactly
// like the test-pages harness, so the two module graphs share ONE avatars/registry
// instance (the one registerAvatarPack populates). This file is NEVER part of the
// app startup graph (it lives under scripts/, and `npm run build` never sees it).
//
// It exposes two functions on window:
//   dgCatalog(): Promise<CatalogJSON>   — enumerate every documentable subject
//   dgCapture(subject, opts): Promise<{len}>  — build+animate+GIF one subject,
//       store base64 in window.__DG_B64 (chunk-read by the driver)
//
// See docs/GALLERY.md for the pipeline overview.

import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { AVATAR_PACK_MANIFEST } from '../../src/avatar-packs/manifest.js';
import {
  FURNITURE_KINDS, furnitureCat, isWetBathKind, ENV_KINDS, envValueText, robotLedColor,
} from '../../src/geometry.js';
import type { LightIconKind } from '../../src/types.js';

// ── Renderer handle (the dist chunk's ThreeDRenderer) ──────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRenderer = any;
let R: AnyRenderer = null;
let MOD: AnyRenderer = null;
let RENDER_PX = 480;

// The renderer chunk sits next to capture-main.js under ./assets/ in the serve
// dir. Variable specifier ⇒ esbuild does not bundle/resolve it.
const RENDERER_URL = './assets/three-renderer.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _packDefs: Record<string, any> = {};
let _initPromise: Promise<void> | null = null;
function ensureInit(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    RENDER_PX = (window as unknown as { __DG_RENDER_PX?: number }).__DG_RENDER_PX || 480;
    MOD = await import(/* @vite-ignore */ RENDERER_URL);
    const host = document.getElementById('stage')!;
    host.style.width = RENDER_PX + 'px';
    host.style.height = RENDER_PX + 'px';
    R = new MOD.ThreeDRenderer(host, { preserveDrawingBuffer: true });
    await R.load();
    // Deterministic capture: no orbit damping drift, and we drive the clock.
    if (R._controls) R._controls.enableDamping = false;

    // Register every builtin + franchise pack into the RENDERER's registry
    // (same module instance) and force them all loaded+active so any member id
    // resolves to its real rig instead of the adult fallback. Keep the loaded
    // pack defs so buildCatalog can enumerate members.
    const cfg: Record<string, { loaded: boolean; active: boolean }> = {};
    for (const row of AVATAR_PACK_MANIFEST) {
      try {
        const m = await row.load();
        const def = (m as { default?: unknown; pack?: unknown }).default
          ?? (m as { pack?: unknown }).pack;
        if (def) { MOD.ThreeDRenderer.registerAvatarPack(def); _packDefs[row.id] = def; }
        cfg[row.id] = { loaded: true, active: true };
      } catch (e) { console.warn('pack load failed', row.id, e); }
    }
    cfg['core'] = { loaded: true, active: true };
    MOD.ThreeDRenderer.setAvatarPacksConfig(cfg);
  })();
  return _initPromise;
}

// ── Scene scaffolding ──────────────────────────────────────────────────────────
const nullState = () => null;
const stateOf = (obj: Record<string, unknown>) => (id: string) => (obj[id] ?? null) as unknown;
const DAY = { preset: 'day', floorColor: '#8a7860', floorTex: 'none', wallColor: '#cfd2d6', wallCutaway: false };
const DUSK = { preset: 'dusk', floorColor: '#4a4640', floorTex: 'wood', wallColor: '#c2c8d0', wallCutaway: false };
const NIGHT = { preset: 'night', floorColor: '#2f333c', floorTex: 'none', wallColor: '#6c7686', wallCutaway: false };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function baseFloor(w = 6000, d = 6000): any {
  return {
    id: 'f1', name: 'S', w, d,
    walls: [], furniture: [], lights: [], switches: [], sensors: [], motionSensors: [],
    envSensors: [], doors: [], windows: [], rooms: [], groundAreas: [], presenceZones: [],
    cameras: [], robots: [], safetySensors: [], alarmPanels: [], bleProxies: [],
    voidAreas: [], bg: null, model3d: null, look3d: null,
  };
}

// Full reset of every renderer group between subjects — no leak accumulation over
// a long run (uses the shipped _clearGroup/clearTransientGroups disposal paths).
function resetScene(): void {
  R.clearTransientGroups();
  R.updateTargets([]);
  R.updateFloor(baseFloor(), DAY, undefined, undefined, nullState);
  R.updateLightsSwitches([], [], nullState);
  R.updateDoorsWindows([], [], nullState);
  R.updateSensors([], () => ({ height: 2000, tilt: 20 }), false);
  R.updateMotionSensors([], nullState, false);
  R.updateEnvSensors([], nullState);
  R.updateSafetySensors([], nullState);
  R.updateAlarmPanels([], nullState);
  R.updateCameras([], nullState);
  R.updateBleProxies([]);
  R.updateRobotDocks([]);
  R.updateRobotRigs([], {});
  R.updateGroundAreas([]);
  R.updateWeather({ condition: 'sunny', intensity01: 0, windKmh: 0, windBearingPlanRad: 0, isDay: true });
}

// ── Fake clock (deterministic frame stepping; the renderer's own RAF + our per-
// frame update*/render calls all read performance.now) ─────────────────────────
let _fakeNow = 0;
const _realNow = performance.now.bind(performance);
function clockOn(): void { _fakeNow = _realNow(); performance.now = () => _fakeNow; }
function clockOff(): void { performance.now = _realNow; }
function advance(ms: number): void { _fakeNow += ms; }

// ── Camera helpers (subjects sit at scene origin; _w maps floor-center→(0,·,0)) ─
function orbitCam(target: [number, number, number], radius: number, elevDeg: number, aziRad: number): void {
  const el = (elevDeg * Math.PI) / 180;
  const y = target[1] + radius * Math.sin(el);
  const hor = radius * Math.cos(el);
  R.setCameraView([target[0] + hor * Math.sin(aziRad), y, target[2] + hor * Math.cos(aziRad)], target);
}

// ── Frame snapshot → RGBA at gif size ───────────────────────────────────────────
let _snap: HTMLCanvasElement | null = null;
let _snapCtx: CanvasRenderingContext2D | null = null;
function snapshot(gifPx: number): Uint8ClampedArray {
  if (!_snap || _snap.width !== gifPx) {
    _snap = document.createElement('canvas');
    _snap.width = _snap.height = gifPx;
    _snapCtx = _snap.getContext('2d', { willReadFrequently: true });
  }
  const ctx = _snapCtx!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, gifPx, gifPx);
  ctx.drawImage(R._renderer.domElement, 0, 0, gifPx, gifPx);
  return ctx.getImageData(0, 0, gifPx, gifPx).data;
}

function render(): void { R._renderer.render(R._scene, R._camera); }

// Encode a list of RGBA frames into an animated GIF (base64).
function encodeGif(frames: Uint8ClampedArray[], gifPx: number, fps: number): string {
  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);
  for (const rgba of frames) {
    const u8 = new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength);
    const palette = quantize(u8, 256);
    const index = applyPalette(u8, palette);
    gif.writeFrame(index, gifPx, gifPx, { palette, delay });
  }
  gif.finish();
  const bytes = gif.bytes();
  // base64 in chunks (avoid apply-spread stack limits on large buffers)
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CH)) as unknown as number[]);
  }
  return btoa(bin);
}

// ── Capture options ─────────────────────────────────────────────────────────────
interface CapOpts { size?: number; frames?: number; fps?: number }

// Generic capture loop, all under the fake clock: run `warmSteps` warmup ticks
// (advancing sim without capturing so poses/bubbles/hover-bob settle), then
// `tick(i, N)` mutates + renders + snapshots frame i (0..N-1). `warmFn` defaults
// to `tick`.
function runCapture(
  N: number, gifPx: number, fps: number, dtMs: number,
  tick: (i: number, N: number) => void,
  warmSteps = 0, warmFn?: (i: number, N: number) => void,
): string {
  clockOn();
  try {
    const wf = warmFn ?? tick;
    for (let i = 0; i < warmSteps; i++) { advance(dtMs); wf(i, N); render(); }
    const frames: Uint8ClampedArray[] = [];
    for (let i = 0; i < N; i++) {
      advance(dtMs);
      tick(i, N);
      render();
      frames.push(snapshot(gifPx));
    }
    return encodeGif(frames, gifPx, fps);
  } finally {
    clockOff();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUBJECT BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Subject = { type: string; id: string; meta: any };

// Turntable-spin static piece (furniture / decor / bathroom / outdoor).
// Half angular velocity per QA feedback: 45 frames @ 9 fps ≈ 5 s for a full 360°
// (was 30 @ 12 ≈ 2.5 s). Frame count only 1.5× so GIF bytes stay bounded.
function capFurniture(sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 45, fps = o.fps ?? 9;
  const { w, h, ht } = sub.meta;
  const f = baseFloor(6000, 6000);
  f.furniture = [{ id: 'it', x: f.w / 2, y: f.d / 2, w, h, kind: sub.id, rotation: 0 }];
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  const maxdim = Math.max(w, h);
  const target: [number, number, number] = [0, Math.min(ht * 0.5, 850), 0];
  const radius = maxdim * 1.5 + ht * 0.9 + 1400;
  return runCapture(N, gifPx, fps, 33, (i) => {
    orbitCam(target, radius, 20, (i / N) * Math.PI * 2);
  });
}

// Wet bathroom piece, WATER RUNNING — the `-running` twin of the plain
// (idle) turntable subject every isWetBathKind piece also gets. The water lives
// in the per-frame advances inside updateTargets (_advanceSinks /
// _advanceBathtubs / _advanceShowers / _advanceToilets), all driven off the
// ActivityContext `entityOn` map, so the capture just holds `entityOn.it = true`
// each tick and lets the fake clock run.
//
// The TOILET is the odd one out: its flush is a ~4 s ONE-SHOT armed by a RISING
// edge of the run state (not a sustained level). It gets warm-up frames with the
// state OFF so the edge detector is primed low, then the capture frames turn it
// on — the capSafety precedent for driving a time-dependent effect explicitly.
// updateTargets clamps its own frame dt to 100 ms, so dtMs is 100 for the level/
// one-shot kinds: the whole 4 s flush / a good chunk of the tub fill fits inside
// a normal GIF frame budget without a sub-stepping loop.
function capBathWater(sub: Subject, o: CapOpts): string {
  const kind = String(sub.meta.kind);
  const isToilet = kind === 'toilet', isTub = kind === 'bathtub', isShower = kind === 'shower';
  const gifPx = o.size ?? 400;
  const N = o.frames ?? (isToilet ? 46 : isTub ? 45 : 34);
  const fps = o.fps ?? 12;
  const dtMs = isShower ? 60 : 100;
  const { w, h, ht } = sub.meta;
  const f = baseFloor(6000, 6000);
  // Unbound + localState 'on' seeds the BUILD-time state; the per-frame ctx below
  // is what actually drives the water (and, for the toilet, the rising edge).
  f.furniture = [{
    id: 'it', x: f.w / 2, y: f.d / 2, w, h, kind, rotation: 0,
    entity_id: null, localState: isToilet ? null : 'on',
  }];
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  const maxdim = Math.max(w, h);
  // Water sits INSIDE the piece, so frame it from a little above (toilet bowl /
  // tub basin / shower pan all read best looking down into them).
  const target: [number, number, number] = [0, Math.min(ht * 0.45, 750), 0];
  const radius = maxdim * 1.35 + ht * 0.8 + 1100;
  const elev = isShower ? 16 : 30;
  const ctxOn = { entityOn: { it: true }, roomNames: {}, timeBucket: 'day' };
  const ctxOff = { entityOn: { it: false }, roomNames: {}, timeBucket: 'day' };
  return runCapture(N, gifPx, fps, dtMs, (i) => {
    orbitCam(target, radius, elev, (i / N) * Math.PI * 2 * (isToilet ? 0.45 : 1));
    R.updateTargets([], ctxOn);
  }, isToilet ? 3 : 2, (i) => {
    orbitCam(target, radius, elev, 0);
    R.updateTargets([], isToilet ? ctxOff : ctxOn);
  });
}

// Appliance: fixed 3/4 camera, animate the door open→close + in-use LED/screen on.
function capAppliance(sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 30, fps = o.fps ?? 12;
  const { w, h, ht } = sub.meta;
  const kind = sub.id;
  const isFridge = kind === 'fridge';
  const f = baseFloor(6000, 6000);
  // Unbound + localState 'on' → in-use LED/emissive screen at build; the door is
  // registered in _applianceDoors and driven per-frame below (case a for fridge
  // via doorSensorOpen, case b otherwise via entityOn).
  f.furniture = [{
    id: 'ap', x: f.w / 2, y: f.d / 2, w, h, kind, rotation: 0,
    entity_id: null, localState: 'on',
    doorEntity: isFridge ? 'binary_sensor.fridge_door' : null,
  }];
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  const hasDoor = (R._applianceDoors || []).some((d: { fuId: string }) => d.fuId === 'ap');
  const target: [number, number, number] = [0, ht * 0.5, 0];
  const radius = Math.max(w, h) * 1.6 + ht * 0.7 + 1500;
  // Front (functional face, local −Z = world −Y = scene −Z) toward a 3/4 view.
  orbitCam(target, radius, 16, Math.PI - 0.7);
  return runCapture(N, gifPx, fps, 40, (i) => {
    // Door open for the first ~45%, then close.
    const open = i < N * 0.45;
    const ctx = {
      entityOn: { ap: !isFridge && open },
      doorSensorOpen: isFridge ? { ap: open } : undefined,
      roomNames: {}, timeBucket: 'day',
    };
    if (!hasDoor) orbitCam(target, radius, 16, Math.PI - 0.7 + Math.sin(i / N * Math.PI * 2) * 0.12);
    R.updateTargets([], ctx);
  });
}

// Lighting: a two-wall corner + floor; off → on → color sweep → dim → off
// (fireplace: off → flicker → off; wall kinds mount on the wall).
const WALL_LIGHT = new Set<LightIconKind>(['sconce', 'wall_sconce', 'step', 'flood', 'exhaust_wall']);
// Ground-level kinds (fixture body at grade, not the 2500 mm ceiling default):
// the standard room-wide framing renders them as a speck in the lower third, so
// they get their own tighter, lower orbit that fills the frame with the trim
// ring / stake head and still fits the upward beam (inground cone tops out at
// ~1600 mm, ground_spot's beam leaves frame by design).
const GROUND_LIGHT = new Set<LightIconKind>(['inground', 'ground_spot']);
// Per-kind camera framing overrides {targetY, radius, elevDeg}. The default
// room-scale orbit ([0,1200,0] r6800 e22) works for every kind that throws a
// floor pool — the pool is what makes a small ceiling fixture read. The exhaust
// family deliberately skips the floor disc (see the renderer's pool-skip list),
// so at room scale they render as an unreadable speck: they get a tight orbit
// on the fixture itself (negative elevation = camera BELOW the target, looking
// up at the ceiling grille's underside where the spinning blades live).
const LIGHT_FRAMING: Partial<Record<LightIconKind, [number, number, number]>> = {
  inground: [600, 3400, 14],
  ground_spot: [600, 3400, 14],
  exhaust: [2400, 1400, -45],
  exhaust_light: [2400, 1400, -45],
  exhaust_wall: [2000, 1100, 2],
};
function capLight(sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 34, fps = o.fps ?? 12;
  const kind = sub.id as LightIconKind;
  const f = baseFloor(5000, 5000);
  f.walls = [
    { id: 'wb', points: [{ x: 400, y: 600 }, { x: 4600, y: 600 }] },      // back wall
    { id: 'ws', points: [{ x: 400, y: 600 }, { x: 400, y: 4600 }] },      // side wall
  ];
  const onWall = WALL_LIGHT.has(kind);
  const lx = onWall ? 2400 : f.w / 2;
  const ly = onWall ? 600 : f.d / 2;
  // Fireplace front = local −Z and the sconce dome faces −Z (wall-mount convention);
  // at rotation 0 both point AWAY from the room-side camera. Rotate those 180°
  // so their fronts face the camera (the other kinds already read correctly).
  // exhaust_wall shares the sconce convention exactly (housing toward +Z into the
  // wall, blades + louver shutter on local −Z), so it joins them.
  const rotation = (kind === 'fireplace' || kind === 'sconce' || kind === 'exhaust_wall') ? 180 : 0;
  const light = {
    id: 'l', x: lx, y: ly, entity_id: 'light.demo', iconKind: kind, rotation,
    label: '', length: 1600,
  };
  f.lights = [light];
  const isFire = kind === 'fireplace';
  R.updateFloor(f, isFire ? NIGHT : DUSK, undefined, undefined, nullState);
  const [tgtY, radius, elevDeg] = LIGHT_FRAMING[kind] ?? [1200, 6800, 22];
  const target: [number, number, number] = [0, tgtY, 0];
  // Camera on the ROOM side (+z / -x): the back wall (scene z ≈ -1900) and side
  // wall (scene x ≈ +2100) sit BEHIND the fixture, not between it and the camera
  // (was Math.PI * 0.86, which put the camera inside the wall corner). +π = 180°.
  orbitCam(target, radius, elevDeg, Math.PI * 1.86);
  const lightState = (i: number): Record<string, unknown> => {
    const t = i / N;
    if (t < 0.12 || t > 0.94) return { 'light.demo': { state: 'off', attributes: {} } };
    if (isFire) return { 'light.demo': { state: 'on', attributes: { brightness: 255 } } };
    const attrs: Record<string, unknown> = { brightness: 255 };
    if (t >= 0.36 && t < 0.68) {
      // Color sweep red → green → blue.
      const p = (t - 0.36) / 0.32;
      const hue = p * 240;           // 0=red .. 240=blue
      attrs.rgb_color = hsvToRgb(hue, 1, 1);
    } else if (t >= 0.68) {
      attrs.brightness = Math.round(255 - (t - 0.68) / 0.26 * 215);   // dim ramp
    }
    return { 'light.demo': { state: 'on', attributes: attrs } };
  };
  return runCapture(N, gifPx, fps, 40, (i) => {
    R.updateLightsSwitches(f.lights, [], stateOf(lightState(i)));
    // Fan rotors spin in the renderer's _animate RAF, which does NOT run during
    // the synchronous capture loop (only render() is called). Advance them here
    // from the fake clock — same formula as _animate — so ceiling fans visibly
    // rotate across the GIF while ON. updateLightsSwitches repopulated _fanRotors.
    const fr = R._fanRotors as { obj: { rotation: { y: number } }; rps: number }[] | undefined;
    if (fr && fr.length) {
      const t = performance.now() / 1000;
      for (const rot of fr) rot.obj.rotation.y = (t * rot.rps * 2 * Math.PI) % (2 * Math.PI);
    }
  });
}

// Switch/control plate on a wall + a bound ceiling bulb; toggle on/off twice.
function capSwitch(_sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 28, fps = o.fps ?? 10;
  const f = baseFloor(5000, 5000);
  f.walls = [{ id: 'wb', points: [{ x: 400, y: 600 }, { x: 4600, y: 600 }] }];
  f.switches = [{ id: 'sw', x: 2500, y: 600, entity_id: 'switch.demo', rotation: 0, label: '' }];
  f.lights = [{ id: 'l', x: 2500, y: 2600, entity_id: 'switch.demo', iconKind: 'bulb', label: '' }];
  R.updateFloor(f, DUSK, undefined, undefined, nullState);
  // Camera on the ROOM side (+z) so the switch plate FACES it (plate front = +Y
  // world = scene +z) with the wall (scene z ≈ -1900) BEHIND (was Math.PI * 0.9,
  // behind the wall). +π = 180°.
  orbitCam([0, 1400, 0], 6200, 20, Math.PI * 1.9);
  return runCapture(N, gifPx, fps, 60, (i) => {
    const on = Math.floor(i / (N / 4)) % 2 === 0;
    const st = { 'switch.demo': { state: on ? 'on' : 'off', attributes: { brightness: 230 } } };
    R.updateLightsSwitches(f.lights, f.switches, stateOf(st));
  });
}

// Alarm keypad: disarmed → arming → armed_away → triggered cycle.
function capAlarm(_sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 32, fps = o.fps ?? 12;
  const f = baseFloor(5000, 5000);
  f.walls = [{ id: 'wb', points: [{ x: 400, y: 600 }, { x: 4600, y: 600 }] }];
  f.alarmPanels = [{ id: 'ap', x: 2500, y: 600, entity_id: 'alarm_control_panel.demo', rotation: 0, label: '' }];
  R.updateFloor(f, DUSK, undefined, undefined, nullState);
  // Camera on the ROOM side (+z) so the keypad FACES it (front = scene +z) with
  // the wall (scene z ≈ -1900) BEHIND (was Math.PI * 0.92). +π = 180°.
  orbitCam([0, 1300, 0], 4200, 12, Math.PI * 1.92);
  const seq = ['disarmed', 'arming', 'armed_away', 'triggered'];
  return runCapture(N, gifPx, fps, 60, (i) => {
    const s = seq[Math.min(seq.length - 1, Math.floor(i / (N / seq.length)))];
    R.updateAlarmPanels(f.alarmPanels, stateOf({ 'alarm_control_panel.demo': { state: s, attributes: {} } }));
  });
}

// Door lock: locked → unlocked → locked (deadbolt + padlock glyph).
function capDoorLock(_sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 26, fps = o.fps ?? 10;
  const f = baseFloor(5000, 4000);
  f.walls = [{ id: 'wb', points: [{ x: 400, y: 2000 }, { x: 4600, y: 2000 }] }];
  f.doors = [{ id: 'd', x: 2100, y: 2000, w: 900, rotation: 0, entity_id: null, lockEntity: 'lock.demo' }];
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  // Camera on the ROOM side so the near door face (with its deadbolt/lock) faces
  // the camera and isn't occluded by the wall/panel (was Math.PI * 0.78). +π = 180°.
  orbitCam([0, 1000, 0], 4600, 16, Math.PI * 1.78);
  return runCapture(N, gifPx, fps, 60, (i) => {
    const locked = Math.floor(i / (N / 3)) !== 1;
    const st = { 'lock.demo': { state: locked ? 'locked' : 'unlocked', attributes: {} } };
    R.updateDoorsWindows(f.doors, [], stateOf(st));
  });
}

// mmWave sensor: body + coverage wedge, a target walking through coverage.
function capMmwave(_sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 30, fps = o.fps ?? 12;
  // Smaller floor + tighter scenario → iso frames the sensor closer (zoomed in).
  const f = baseFloor(5600, 4200);
  f.sensors = [{ id: 's', x: 2800, y: 300, heading: 0, fov: 120, range: 3400, label: 'K', deviceSlug: null, color: '#4fc3f7' }];
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  R.updateSensors(f.sensors, () => ({ height: 2000, tilt: 18 }), true);
  R.applyViewPreset('iso');
  const tick = (i: number, n: number) => {
    const x = 1400 + 2800 * (i / n);
    R.updateTargets([{ key: 't', x, y: 2200, color: 0x4fc3f7 }]);
  };
  return runCapture(N, gifPx, fps, 33, tick, 20, () => R.updateTargets([{ key: 't', x: 1400, y: 2000, color: 0x4fc3f7 }]));
}

// Motion sensor: cone + on/off pulse + an AI-projected avatar wandering.
function capMotion(_sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 30, fps = o.fps ?? 12;
  // Smaller floor → iso frames the sensor closer (zoomed in).
  const f = baseFloor(5000, 4200);
  f.motionSensors = [{ id: 'm', x: 2500, y: 300, heading: 0, fov: 100, range: 3000, label: '', entity_id: 'binary_sensor.motion', color: '#ba68c8', intensity: 1.3 }];
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  R.applyViewPreset('iso');
  const tick = (i: number, n: number) => {
    const on = Math.floor(i / (n / 4)) % 2 === 0;
    R.updateMotionSensors(f.motionSensors, stateOf({ 'binary_sensor.motion': { state: on ? 'on' : 'off', attributes: {} } }), false);
    const x = 2500 + 700 * Math.sin(i / n * Math.PI * 2);
    R.updateTargets([{ key: 't', x, y: 2100 + 400 * Math.cos(i / n * Math.PI * 2), color: 0xba68c8 }]);
  };
  return runCapture(N, gifPx, fps, 33, tick, 20, () => R.updateTargets([{ key: 't', x: 2500, y: 2100, color: 0xba68c8 }]));
}

// Env sensor: chip value + color band cycle (ok → warn → danger where defined).
function capEnv(sub: Subject, o: CapOpts): string {
  // QA feedback: slower text + zoomed in. Value ramp at half rate (40 frames @
  // 8 fps ≈ 5 s, was 28 @ 10 ≈ 2.8 s) so the readout is legible; tighter orbit
  // (radius 4200 → 3200) enlarges the chip text.
  const gifPx = o.size ?? 400, N = o.frames ?? 40, fps = o.fps ?? 8;
  const kind = sub.id as keyof typeof ENV_KINDS;
  const def = ENV_KINDS[kind];
  const f = baseFloor(5000, 5000);
  f.envSensors = [{ id: 'e', x: f.w / 2, y: f.d / 2, entity_id: 'sensor.env', label: '', scale: 2.0, kind }];
  R.updateFloor(f, DUSK, undefined, undefined, nullState);
  orbitCam([0, 1500, 0], 3200, 14, Math.PI * 0.9);
  // Value ramp: cross warn/danger when defined, else a plain sweep.
  const lo = 0, hi = def.danger != null ? def.danger * 1.25 : (def.warn != null ? def.warn * 1.5 : 100);
  const unit = kind === 'temperature' ? '°C' : kind === 'co2' ? 'ppm' : '';
  return runCapture(N, gifPx, fps, 60, (i) => {
    const v = Math.round(lo + (hi - lo) * (i / (N - 1)));
    R.updateEnvSensors(f.envSensors, stateOf({ 'sensor.env': { state: String(v), attributes: { device_class: kind, unit_of_measurement: unit } } }));
  });
}

// Safety detector: smoke/co/gas idle → ALARM rings; leak idle → puddle grow.
function capSafety(sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 34, fps = o.fps ?? 12;
  const kind = sub.id;
  const isLeak = kind === 'leak';
  const f = baseFloor(3800, 3800);
  f.safetySensors = [{ id: 'sf', x: f.w / 2, y: f.d / 2, kind, entity_id: 'binary_sensor.safety', label: '' }];
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  // Leak is a FLOOR puck — a low tight orbit enlarges its spreading puddle.
  // The others hang from the ceiling (2743 mm): the 'iso' preset frames the
  // whole FLOOR, which left the detector a few pixels wide at the very top edge
  // of the frame. Orbit the detector itself instead, from just below (negative
  // elevation) so the puck's underside + its expanding alarm rings fill the
  // frame; the radius still admits the widest ring.
  if (isLeak) orbitCam([0, 300, 0], 3000, 22, Math.PI * 0.85);
  else orbitCam([0, 2500, 0], 2700, -14, Math.PI * 0.85);
  return runCapture(N, gifPx, fps, 40, (i) => {
    const alarm = i > N * 0.18;
    // The leak puddle grows over SAFETY_DEFAULTS.leakGrowSec (30 s) of WALL
    // CLOCK. A capture is a couple of seconds long, so the internal clock left
    // the GIF showing an essentially fixed-size patch ("doesn't spread"). Drive
    // the alarm AGE explicitly instead: ramp 0 → the full grow window across
    // the alarming frames so the GIF shows the whole spread.
    const t01 = alarm ? (i - N * 0.18) / Math.max(1, N - 1 - N * 0.18) : 0;
    const ageOf = isLeak ? () => t01 * 30 : undefined;
    R.updateSafetySensors(f.safetySensors, stateOf({ 'binary_sensor.safety': { state: alarm ? 'on' : 'off', attributes: {} } }), ageOf);
  });
}

// BLE proxy antenna + an identified person rig moving nearby.
function capBleProxy(_sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 30, fps = o.fps ?? 12;
  // Smaller floor → iso frames the proxy + person closer (zoomed in).
  const f = baseFloor(5000, 4200);
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  R.updateBleProxies([{ id: 'b', name: 'Proxy', x: 900, y: 900, height: 2400 }]);
  R.applyViewPreset('iso');
  const tgt = (x: number) => ([{ key: 'p', x, y: 2100, color: 0x26c6da, ble: true, person: { name: 'Alex', color: '#26c6da', avatarKind: 'adult', identified: true } }]);
  return runCapture(N, gifPx, fps, 33, (i, n) => R.updateTargets(tgt(1400 + 2200 * (i / n))), 20, () => R.updateTargets(tgt(2500)));
}

// Camera fixture FOV wedge + recording tint.
function capCamera(_sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 26, fps = o.fps ?? 10;
  // Smaller floor → iso frames the camera fixture + FOV wedge closer (zoomed in).
  const f = baseFloor(5000, 4200);
  f.cameras = [{ id: 'c', x: 600, y: 600, rotation: 45, fov: 90, range: 3400, height: 2200, entity_id: 'camera.demo' }];
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  R.applyViewPreset('iso');
  return runCapture(N, gifPx, fps, 60, (i) => {
    const rec = Math.floor(i / (N / 4)) % 2 === 1;
    R.updateCameras(f.cameras, stateOf({ 'camera.demo': { state: rec ? 'recording' : 'idle', attributes: {} } }));
  });
}

// Bin: lid flip empty ↔ full (fold state into the floor build each frame).
function capBin(sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 380, N = o.frames ?? 24, fps = o.fps ?? 10;
  const def = FURNITURE_KINDS[sub.id as keyof typeof FURNITURE_KINDS];
  const f = baseFloor(4000, 4000);
  f.furniture = [{ id: 'bin', x: f.w / 2, y: f.d / 2, w: def.w, h: def.h, kind: sub.id, rotation: 0, entity_id: 'binary_sensor.bin' }];
  const target: [number, number, number] = [0, def.ht * 0.5, 0];
  const radius = def.h * 1.6 + def.ht * 0.8 + 1400;
  orbitCam(target, radius, 16, Math.PI - 0.6);
  return runCapture(N, gifPx, fps, 60, (i) => {
    const full = Math.floor(i / (N / 3)) === 1;
    R.updateFloor(f, DAY, undefined, undefined, stateOf({ 'binary_sensor.bin': { state: full ? 'on' : 'off', attributes: {} } }));
  });
}

// Door / window: smooth open→close via a cover-shaped state (current_position ramp).
function capOpening(sub: Subject, o: CapOpts): string {
  const gifPx = o.size ?? 400, N = o.frames ?? 30, fps = o.fps ?? 12;
  const isWindow = sub.type === 'window';
  const f = baseFloor(6000, 4000);
  // A gate is a fence/hedge opening — host it on a picket fence run so the panel
  // reads in context (a gate cut into a full 2743 mm wall looks like a bug).
  const wallKind = (!isWindow && sub.id === 'gate') ? 'fence_picket' : 'full';
  f.walls = [{ id: 'wb', kind: wallKind, points: [{ x: 500, y: 2000 }, { x: 5500, y: 2000 }] }];
  if (isWindow) {
    // A bay needs its wider natural opening for the three-pane splay to read
    // (mirrors geometry.ts's windowDefaultWidth); every other kind keeps 1600.
    const ww = sub.id.startsWith('bay') ? 1800 : 1600;
    f.windows = [{ id: 'w', x: 3000, y: 2000, w: ww, rotation: 0, entity_id: 'cover.demo', kind: sub.id }];
  } else {
    // Per-kind natural span (mirrors geometry.ts's doorDefaultWidth): garage is
    // wide, double-leaf/glass-slider kinds are medium, everything else is a
    // standard single leaf. Centered on the 5000 mm wall span (500..5500) so
    // every kind — including the 5 added alongside sliding/pocket/double/
    // french/sliding_glass coverage — frames the same regardless of width.
    const kind = sub.id;
    const w = kind === 'garage' ? 2400
      : (kind === 'double' || kind === 'french' || kind === 'sliding_glass') ? 1500
        : 900;
    const x = 3000 - w / 2;
    f.doors = [{ id: 'd', x, y: 2000, w, rotation: 0, kind: sub.id, entity_id: 'cover.demo' }];
  }
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  orbitCam([0, 1100, 0], 6600, 16, Math.PI * 0.8);
  return runCapture(N, gifPx, fps, 40, (i) => {
    // 0→100→0 triangle: open then close.
    const t = i / (N - 1);
    const pos = Math.round((t < 0.5 ? t * 2 : (1 - t) * 2) * 100);
    const st = { 'cover.demo': { state: pos > 2 ? 'open' : 'closed', attributes: { current_position: pos } } };
    R.updateDoorsWindows(f.doors, f.windows, stateOf(st));
  });
}

// Robot vacuum/mower: dock + rig roaming loop, LED cycling through states.
function capRobot(sub: Subject, o: CapOpts): string {
  // QA feedback: go slower + zoom in. Smaller floor (4000 mm) → iso frames the
  // rig ~1.5× closer; more frames @ lower fps (44 @ 9 ≈ 4.9 s, was 32 @ 12 ≈
  // 2.7 s) + reduced roam amplitude → ~half the on-screen roam speed. Loop kept
  // centered on the floor so iso frames it symmetrically.
  const gifPx = o.size ?? 400, N = o.frames ?? 44, fps = o.fps ?? 9;
  const kind = sub.id as 'vacuum' | 'mower';
  const f = baseFloor(4000, 4000);
  const dock = { id: 'r', x: 1400, y: 1400, kind, entity_id: null };
  f.robots = [dock];
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  R.updateRobotDocks(f.robots);
  R.applyViewPreset('iso');
  const acts = ['docked', kind === 'vacuum' ? 'cleaning' : 'mowing', 'returning'];
  return runCapture(N, gifPx, fps, 40, (i) => {
    const p = i / N;
    const act = acts[Math.min(acts.length - 1, Math.floor(p * acts.length))];
    // Roam a (smaller, centered) loop out from the dock and back.
    const ang = p * Math.PI * 2;
    const x = 1400 + (act === 'docked' ? 0 : 1200) * (0.5 - 0.5 * Math.cos(ang));
    const y = 1400 + (act === 'docked' ? 0 : 1000) * Math.sin(ang) * 0.6 + (act === 'docked' ? 0 : 600);
    const st = { r: { x, y, heading: ang, phase: i * 0.4, activity: act, led: robotLedColor(act) } };
    R.updateRobotRigs(f.robots, st);
  });
}

// Avatar: idle rig with a gentle weight-shift oscillation, camera 360° orbit, and
// the member's own personality bubble forced visible (reuses _syncBubble).
function capAvatar(sub: Subject, o: CapOpts): string {
  // QA feedback: rotate slower (half angular velocity: 45 frames @ 9 fps ≈ 5 s,
  // was 30 @ 12) + pull back so the thought bubble is fully in frame.
  const gifPx = o.size ?? 320, N = o.frames ?? 45, fps = o.fps ?? 9;
  const id = sub.id;
  const def = MOD.ThreeDRenderer.resolveAvatarDef(id);
  const isQuad = def.rig === 'quadruped';
  const f = baseFloor(4000, 4000);
  R.updateFloor(f, DAY, undefined, undefined, nullState);
  const ctx = { entityOn: {}, roomNames: {}, timeBucket: 'day' };
  const bubble: string | null = (!isQuad && def.bubbles && def.bubbles.length) ? def.bubbles[0] : null;
  const key = 'av';
  const step = (i: number): void => {
    const x = f.w / 2 + Math.sin(i * 0.12) * 150;   // subtle weight shift / stepping
    R.updateTargets([{ key, x, y: f.d / 2, color: 0x9fb2c4, avatar: id }], ctx);
    const h = R._humanoids?.[key];
    if (h && bubble) { h.bubbleKind = bubble; R._syncBubble(h, 0.1); }
  };
  // Frame from the ACTUAL rig (no per-kind hardcode): the bubble anchors at the
  // live plumbob height + BUBBLE_ABOVE_PLUMBOB (460 mm) with the cloud extending
  // ~520 mm higher. Center the camera on the mid-height and pull the radius back
  // so the full 0→bubbleTop span fits the 50° vertical FOV (+ margin). Read the
  // plumbob per-frame so the pull-back tracks tall (astronaut) vs short (teddy)
  // rigs. Quadrupeds keep the tight framing — pets never show a bubble.
  const BUBBLE_ABOVE = 460, BUBBLE_CLOUD = 520;
  const orbit = (i: number, n: number): void => {
    let target: [number, number, number], radius: number, elevDeg: number;
    if (isQuad) {
      target = [0, 500, 0]; radius = 2200; elevDeg = 14;
    } else {
      const h = R._humanoids?.[key];
      const plumbobY = (h && h.plumbob) ? h.plumbob.position.y : 2000;
      const contentTop = plumbobY + BUBBLE_ABOVE + BUBBLE_CLOUD;
      target = [0, contentTop * 0.5, 0];
      radius = contentTop * 1.35;
      elevDeg = 10;
    }
    orbitCam(target, radius, elevDeg, (i / n) * Math.PI * 2);
  };
  // Warm (24 steps) so the rig builds + bubble pops in + hover rigs settle.
  return runCapture(N, gifPx, fps, 55, (i, n) => {
    step(i + 24);
    orbit(i, n);
  }, 24, (i) => step(i));
}

// ── Dispatch ────────────────────────────────────────────────────────────────────
function captureSubject(sub: Subject, o: CapOpts): string {
  resetScene();
  switch (sub.type) {
    case 'furniture': return capFurniture(sub, o);
    case 'appliance': return capAppliance(sub, o);
    case 'bathwater': return capBathWater(sub, o);
    case 'light': return capLight(sub, o);
    case 'switch': return capSwitch(sub, o);
    case 'alarm': return capAlarm(sub, o);
    case 'door_lock': return capDoorLock(sub, o);
    case 'mmwave': return capMmwave(sub, o);
    case 'motion': return capMotion(sub, o);
    case 'env': return capEnv(sub, o);
    case 'safety': return capSafety(sub, o);
    case 'ble_proxy': return capBleProxy(sub, o);
    case 'camera': return capCamera(sub, o);
    case 'bin': return capBin(sub, o);
    case 'door': case 'window': return capOpening(sub, o);
    case 'robot': return capRobot(sub, o);
    case 'avatar': return capAvatar(sub, o);
    default: throw new Error('unknown subject type ' + sub.type);
  }
}

// ── Catalog (single source of truth; enumerated dynamically) ─────────────────────
const LIGHT_KINDS: { id: LightIconKind; label: string; glyph: string }[] = [
  { id: 'bulb', label: 'Bulb', glyph: '💡' }, { id: 'spot', label: 'Spot', glyph: '🔦' },
  { id: 'pendant', label: 'Pendant', glyph: '⚪' }, { id: 'sconce', label: 'Sconce', glyph: '◐' },
  { id: 'strip', label: 'Strip', glyph: '▬' }, { id: 'fireplace', label: 'Fireplace', glyph: '🔥' },
  { id: 'lamp', label: 'Lamp', glyph: '🪔' }, { id: 'bowl', label: 'Bowl', glyph: '🥣' },
  { id: 'tiered', label: 'Tiered', glyph: '☰' }, { id: 'round', label: 'Round', glyph: '⭕' },
  { id: 'recessed', label: 'Recessed', glyph: '⊙' }, { id: 'jar', label: 'Jar', glyph: '🫙' },
  { id: 'oval', label: 'Oval', glyph: '🥚' }, { id: 'fan', label: 'Ceiling fan', glyph: '❋' },
  { id: 'fan_light', label: 'Fan + light', glyph: '✺' }, { id: 'string', label: 'LED string', glyph: '✨' },
  { id: 'under_cabinet', label: 'Under-cabinet strip', glyph: '▂' },
  { id: 'wall_sconce', label: 'Wall sconce', glyph: '◨' }, { id: 'step', label: 'Step light', glyph: '▤' },
  { id: 'flood', label: 'Floodlight', glyph: '🔆' },
  { id: 'inground', label: 'In-ground uplight', glyph: '⤒' },
  { id: 'ground_spot', label: 'Ground spot', glyph: '⟰' },
  { id: 'heatlamp', label: 'Heat lamp', glyph: '♨' },
  { id: 'exhaust', label: 'Exhaust fan', glyph: '❊' },
  { id: 'exhaust_wall', label: 'Wall exhaust fan', glyph: '⊛' },
  { id: 'exhaust_light', label: 'Exhaust + light', glyph: '❈' },
];
const CAT_PAGE: Record<string, string> = { furniture: 'furniture', appliance: 'appliances', bathroom: 'bathroom', outdoor: 'outdoor' };
const CAT_TITLE: Record<string, string> = {
  furniture: 'Furniture', appliance: 'Appliances', bathroom: 'Bathroom', outdoor: 'Outdoor & yard',
  // theater/vehicle fall through to their own page (CAT_PAGE has no entry, so
  // `page = CAT_PAGE[cat] ?? cat` already yields 'theater'/'vehicle') — these
  // just give the in-page group heading the same phrasing sidebar.ts's
  // furnitureCat optgroups use, instead of the raw lowercase cat id.
  theater: 'Home theater', vehicle: 'Vehicle / garage',
};

function slug(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function safeId(id: string): string { return id.replace(/[^a-zA-Z0-9_-]+/g, '_'); }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCatalog(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjects: any[] = [];
  const push = (s: Record<string, unknown>) => subjects.push(s);

  // Furniture, grouped by furnitureCat (bins excluded here — they live on the
  // sensors page with a state animation).
  for (const [kind, def] of Object.entries(FURNITURE_KINDS)) {
    if (kind === 'trash_bin' || kind === 'recycle_bin') continue;
    const cat = furnitureCat(def);
    const page = CAT_PAGE[cat] ?? cat;
    const isAppliance = cat === 'appliance';
    push({
      type: isAppliance ? 'appliance' : 'furniture', id: kind, page,
      group: CAT_TITLE[cat] ?? cat, label: def.label,
      notes: `${def.w}×${def.h}×${def.ht} mm` + (def.seat ? ' · sittable' : '') + (def.activity ? ` · ${def.activity}` : '') + (def.surface ? ' · surface' : ''),
      gif: `media/${page}/${safeId(kind)}.gif`,
      meta: { id: kind, w: def.w, h: def.h, ht: def.ht, cat, seat: def.seat ?? null, activity: def.activity ?? null },
    });
    // Wet bathroom pieces are documented as a PAIR: the plain subject above is
    // the idle piece, plus a `<kind>-running` twin showing the water animation
    // (fill / spray / flush). The predicate is imported from geometry.ts, so the
    // pair set can never drift from the renderer's. The twin keeps its base
    // subject's PAGE (kitchen_sink is an appliance, so it pairs on the
    // appliances page) and carries its own subject type, which the
    // hand-maintained-list guard in generate.mjs does not enumerate (it only
    // cross-checks light / safety / door / window against src/types.ts unions),
    // so the guard arithmetic is untouched.
    if (isWetBathKind(kind as never)) {
      const wnote = kind === 'toilet' ? 'flush one-shot (swirl → refill)'
        : kind === 'shower' ? 'running spray + splash ring'
          : kind === 'bathtub' ? 'filling (faucet stream + rising level)'
            : 'running faucet + filling basin';
      push({
        type: 'bathwater', id: `${kind}-running`, page,
        group: CAT_TITLE[cat] ?? cat, label: `${def.label} — running`,
        notes: wnote,
        gif: `media/${page}/${safeId(kind)}-running.gif`,
        meta: { id: kind, kind, w: def.w, h: def.h, ht: def.ht, cat },
      });
    }
  }

  // Lighting.
  for (const lk of LIGHT_KINDS) {
    push({
      type: 'light', id: lk.id, page: 'lighting', group: 'Light fixtures', label: lk.label,
      notes: `${lk.glyph} · ${WALL_LIGHT.has(lk.id) ? 'wall-mounted' : GROUND_LIGHT.has(lk.id) ? 'ground-level' : 'ceiling/floor'} · off → on → color → dim`,
      gif: `media/lighting/${safeId(lk.id)}.gif`, meta: { glyph: lk.glyph },
    });
  }

  // Switches & controls.
  push({ type: 'switch', id: 'switch', page: 'switches-controls', group: 'Controls', label: 'Wall switch', notes: 'plate + bound light; toggles on/off', gif: 'media/switches-controls/switch.gif', meta: {} });
  push({ type: 'alarm', id: 'alarm', page: 'switches-controls', group: 'Controls', label: 'Alarm keypad', notes: 'disarmed → arming → armed_away → triggered', gif: 'media/switches-controls/alarm.gif', meta: {} });
  push({ type: 'door_lock', id: 'door_lock', page: 'switches-controls', group: 'Controls', label: 'Door lock', notes: 'locked → unlocked → locked (deadbolt + padlock)', gif: 'media/switches-controls/door_lock.gif', meta: {} });

  // Sensors page.
  push({ type: 'mmwave', id: 'mmwave', page: 'sensors', group: 'Presence & radar', label: 'mmWave radar', notes: 'body + coverage wedge, live target', gif: 'media/sensors/mmwave.gif', meta: {} });
  push({ type: 'motion', id: 'motion', page: 'sensors', group: 'Presence & radar', label: 'Motion sensor', notes: 'cone + on/off pulse + AI avatar', gif: 'media/sensors/motion.gif', meta: {} });
  push({ type: 'ble_proxy', id: 'ble_proxy', page: 'sensors', group: 'Presence & radar', label: 'BLE proxy', notes: 'antenna puck + identified person', gif: 'media/sensors/ble_proxy.gif', meta: {} });
  push({ type: 'camera', id: 'camera', page: 'sensors', group: 'Presence & radar', label: 'Camera', notes: 'FOV wedge + recording tint', gif: 'media/sensors/camera.gif', meta: {} });
  for (const [kind, def] of Object.entries(ENV_KINDS)) {
    push({ type: 'env', id: kind, page: 'sensors', group: 'Environment', label: `${def.glyph} ${kind}`, notes: def.warn != null ? `warn ${def.warn} / danger ${def.danger}` : 'live reading', gif: `media/sensors/env_${safeId(kind)}.gif`, meta: { glyph: def.glyph } });
  }
  for (const sk of ['smoke', 'co', 'gas', 'leak', 'siren', 'glass_break']) {
    const label = sk === 'siren' ? 'Siren beacon'
      : sk === 'glass_break' ? 'Glass-break detector'
        : `${sk.toUpperCase()} detector`;
    const notes = sk === 'leak' ? 'floor puck → spreading puddle'
      : sk === 'siren' ? 'idle → rotating beacon + strobe'
        : sk === 'glass_break' ? 'mic plate → shatter burst'
          : 'idle → alarm rings';
    push({ type: 'safety', id: sk, page: 'sensors', group: 'Safety', label, notes, gif: `media/sensors/safety_${sk}.gif`, meta: {} });
  }
  for (const bk of ['trash_bin', 'recycle_bin']) {
    const def = FURNITURE_KINDS[bk as keyof typeof FURNITURE_KINDS];
    push({ type: 'bin', id: bk, page: 'sensors', group: 'Bins', label: def.label, notes: 'lid flip empty ↔ full', gif: `media/sensors/${bk}.gif`, meta: {} });
  }

  // Doors & windows. All 8 DoorKind values (types.ts) — swing/garage/gate plus
  // the sliding-family (sliding/pocket/sliding_glass) and double-leaf family
  // (double/french) added alongside home-theater/vehicle furniture coverage.
  const DOOR_LABEL: Record<string, string> = {
    swing: 'Swing door', garage: 'Garage door', gate: 'Gate',
    sliding: 'Sliding (barn)', pocket: 'Pocket', double: 'Double swing',
    french: 'French', sliding_glass: 'Sliding glass',
  };
  const DOOR_KINDS = ['swing', 'garage', 'gate', 'sliding', 'pocket', 'double', 'french', 'sliding_glass'];
  for (const dk of DOOR_KINDS) push({ type: 'door', id: dk, page: 'doors-windows', group: 'Doors', label: DOOR_LABEL[dk], notes: dk === 'gate' ? 'picket gate on a fence run · open → close' : 'open → close', gif: `media/doors-windows/door_${dk}.gif`, meta: {} });
  const WINDOW_KINDS_CAP = ['single', 'double_hung', 'casement_pair', 'sliding', 'picture', 'bay', 'bay_bench'];
  for (const wk of WINDOW_KINDS_CAP) push({ type: 'window', id: wk, page: 'doors-windows', group: 'Windows', label: wk.replace(/_/g, ' '), notes: wk.startsWith('bay') ? 'projecting bay · open → close' : 'open → close', gif: `media/doors-windows/window_${safeId(wk)}.gif`, meta: {} });

  // Robots.
  for (const rk of ['vacuum', 'mower']) push({ type: 'robot', id: rk, page: 'robots', group: 'Robots', label: rk === 'vacuum' ? 'Robot vacuum' : 'Lawn mower', notes: 'dock + roam + LED states', gif: `media/robots/${rk}.gif`, meta: {} });

  // Avatars — every pack, grouped by top-level path segment into pages. Members
  // come from the pack defs loaded (and registered) during ensureInit.
  for (const row of AVATAR_PACK_MANIFEST) {
    const top = row.path[0] || 'Other';
    const page = `avatars/${slug(top)}`;
    const def = _packDefs[row.id];
    const members: { id: string; label?: string }[] = def?.avatars ?? [];
    for (const m of members) {
      const ad = MOD.ThreeDRenderer.resolveAvatarDef(m.id);
      push({
        type: 'avatar', id: m.id, page, group: row.label, topLevel: top, packId: row.id,
        franchise: !!row.franchise, label: m.label ?? ad.label ?? m.id, rig: ad.rig,
        notes: `${row.label} · ${ad.rig}` + (row.franchise ? ' · franchise' : ''),
        gif: `media/${page}/${safeId(m.id)}.gif`, meta: { bubble: (ad.bubbles && ad.bubbles[0]) || null },
      });
    }
  }

  // Core pack's 'adult' lives in avatars.ts (CORE_PACK, registered directly in
  // ensureInit-independent module init — see avatars.ts's trailing
  // `registerPack(CORE_PACK, 'builtin')`) rather than in AVATAR_PACK_MANIFEST,
  // so the loop above never sees it. Push it explicitly onto the Base avatars
  // page so gallery coverage is every resolvable avatar id, not just the
  // manifest's members.
  {
    const ad = MOD.ThreeDRenderer.resolveAvatarDef('adult');
    push({
      type: 'avatar', id: 'adult', page: 'avatars/base', group: 'Core', topLevel: 'Base', packId: 'core',
      franchise: false, label: ad.label ?? 'Adult', rig: ad.rig,
      notes: `Core · ${ad.rig}`,
      gif: 'media/avatars/base/adult.gif', meta: { bubble: (ad.bubbles && ad.bubbles[0]) || null },
    });
  }

  return { subjects, generatedAt: new Date().toISOString() };
}

// ── window API ───────────────────────────────────────────────────────────────────
type Win = typeof window & {
  dgCatalog?: () => Promise<unknown>;
  dgCapture?: (sub: Subject, o: CapOpts) => Promise<{ len: number }>;
  __DG_B64?: string;
  __dgChunk?: (off: number, n: number) => string;
};
const W = window as Win;
W.dgCatalog = async () => { await ensureInit(); return buildCatalog(); };
W.dgCapture = async (sub: Subject, o: CapOpts) => {
  await ensureInit();
  const b64 = captureSubject(sub, o);
  W.__DG_B64 = b64;
  return { len: b64.length };
};
W.__dgChunk = (off: number, n: number) => (W.__DG_B64 || '').substr(off, n);

// ── tiny color helper ────────────────────────────────────────────────────────────
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
void envValueText;
