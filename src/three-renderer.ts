import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import type {
  Floor, Sensor, Light, SwitchFixture, MotionSensor, Vec2, HassState,
  Scene3D, ScenePreset, FloorTexKind, Model3D, Furniture,
} from './types.js';
import {
  lightHeight, lightRadius, lightIntensity, lightIconKind, lightRotation, lightLength,
  switchHeight, switchRotation, switchSize,
  motionColor, motionIntensity, hexToInt,
  furnitureDef, resolveFurnitureDef, doorOpenDeltaDeg,
  ENV_KINDS, envKindOf, envColor, envValueText, envHeight, envScale,
} from './geometry.js';
import type { Door, Window as WindowType, EnvSensor, ObjectRecipe, ActivityKind } from './types.js';
import { wallCutsForSegment, closedWallLoops, wallKind, WALL_KINDS, furnitureLocalToWorld, furnitureWorldToLocal, pointInPolygon as pip, centroid, loopContaining, resolveRoomForPoint } from './geometry.js';

export interface ZoneWorld { vertices: Vec2[]; color: number; occupied: boolean; }
export interface HaloWorld { x: number; y: number; radius: number; occupied: boolean; }
export interface TargetWorld { key: string; x: number; y: number; color: number; }

// Per-frame context for the Sims-style activity system. Built cheaply every
// tick in three-view._tickOnce and passed to updateTargets. Optional so a
// stale renderer chunk (older app.js pairing) still animates walking / sitting
// — a missing ctx is treated as empty entityOn/roomNames + a 'day' bucket.
export interface ActivityContext {
  entityOn: Record<string, boolean>;   // furnitureId → bound HA entity is on/playing
  roomNames: Record<string, string>;   // roomId → name
  timeBucket: import('./time-of-day.js').TimeBucket;
}

// A seat a humanoid can settle onto (scene coords). Collected from sittable
// furniture (any kind whose def has `seat`) during updateFloor. roomId /
// hostActivity tag the seat for later contextual-activity resolution.
interface SitSpot {
  x: number; z: number; seatY: number; facing: number; r: number;
  roomId?: string | null;         // named room the seat sits in (live loop resolve)
  hostActivity?: ActivityKind;    // the seat piece's own activity, if any
}

// A contextual-activity anchor collected from furniture whose def carries an
// `activity` (Sims-style behavior — dwell triggers fill in during later
// phases). Scene coords, mirroring SitSpot's frame.
interface ActivityAnchor {
  furnitureId: string;
  x: number; z: number;
  r: number;
  facing: number;
  kind: ActivityKind;
  roomId: string | null;
  hasEntity: boolean;   // furniture has a bound HA entity (gates entity-driven kinds)
}

interface Humanoid {
  group: THREE.Group;
  color: number;       // tint the rig was built with (rebuilt if it changes)
  torso: THREE.Mesh;   // breathing scale
  // Two-segment limb chains: shoulder/hip pivot drives the upper segment;
  // elbow/knee pivot is a child group at the joint that drives the lower
  // segment + hand / foot.
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  rightHip: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
  plumbob: THREE.Object3D;  // rotating Sims diamond above the head
  blob: THREE.Mesh;    // soft floor shadow decal; re-grounded every frame
  phase: number;       // walk-cycle radians
  facing: number;      // body yaw derived from smoothed velocity
  amp: number;         // eased limb-swing amplitude (rad) — smooths gait starts/stops
  sit: number;         // eased sitting blend 0 (standing) .. 1 (seated)
  groundY: number;     // eased terrain height under the figure (stairs/landings)
  dwell: number;       // seconds of near-zero speed (sitting trigger)
  sitSpot: SitSpot | null;  // anchor seat; retained while easing back up
  // Contextual-activity state (Sims solo activities). Mutually exclusive with
  // sitting: an anchor is only acquired while sit ≈ 0.
  activity: ActivityKind | null;       // engaged activity (drives poses + privacy)
  activityAnchor: ActivityAnchor | null;  // retained while easing back out (act > 0.05)
  activityDwell: number;               // reserved; the dwell trigger reuses `dwell`
  act: number;         // eased 0..1 activity-pose blend (mirrors `sit`)
  privacy: number;     // eased 0..1 privacy-blur blend (shower/bathe/toilet)
  blurSprite: THREE.Sprite | null;     // lazy censor sprite shown above ~0.5 privacy
  // Thought bubble (Phase 6): a context/time-aware glyph cloud above the head.
  // `bubbleWant` tracks the raw per-frame resolution; `bubbleDwell` accumulates
  // while it stays equal; `bubbleKind` commits (and rebuilds the sprite) only
  // after 2.5 s of stability so the canvas is (re)painted rarely.
  bubble: THREE.Sprite | null;
  bubbleKind: string | null;
  bubbleWant: string | null;
  bubbleDwell: number;
  scale: number;       // eased spawn/despawn scale (0..1)
  idleOffset: number;  // per-rig phase offset so idle sway / breathing desync
  vx: number;          // smoothed NAV velocity in 3D coords (mm/s) — drives gait/facing
  vz: number;
  lastX: number;       // previous NAV position (scene coords) for the vx/vz delta
  lastZ: number;
  lastUpdate: number;  // performance.now() / 1000, last seen
  initialized: boolean;
  // ── Collision-aware navigation (renderer-internal). The rig renders at the
  // nav position while walking (steered around furniture/walls); all TRIGGER
  // logic (sit/activity/dwell/bubbles) keeps reading the RAW radar position.
  navX: number;        // rendered walk position, scene coords (like p.x/p.z)
  navZ: number;
  rawVx: number;       // smoothed RAW-target velocity (mm/s) — drives triggers
  rawVz: number;
  rawLastX: number;    // previous RAW target position (scene coords)
  rawLastZ: number;
  path: { x: number; z: number }[] | null;  // scene-coord waypoints, walk order
  pathRev: number;     // _nav.rev the cached path was built against (-1 = none)
  goalCell: number;    // grid index the cached path targets (-1 = none)
}

type StateProvider = (id: string) => HassState | null;

// Shared empty entity map for the stale-chunk fallback (no per-frame alloc).
const EMPTY_ENTITY_ON: Record<string, boolean> = {};
// Thought-bubble geometry (Phase 6). World-mm sprite size + the local offset
// above the head (headY + HEAD_R + 700 ≈ 2462, clearing the plumbob at ~2002),
// nudged to the side Sims-comic style.
const BUBBLE_W = 620, BUBBLE_H = 580, BUBBLE_LOCAL_Y = 2462, BUBBLE_X = 180;
// Solo activities wired up this phase (Phase 4). watch_tv / eat_at_table /
// work_at_desk / sleep_shared are seated/contextual and land in Phase 5.
const PHASE4_ACTIVITIES: ReadonlySet<ActivityKind> = new Set<ActivityKind>([
  'shower', 'bathe', 'toilet', 'wash_hands', 'load_dishwasher',
  'make_coffee', 'forage_fridge', 'exercise',
]);
// Activities whose dwell trigger reads the bound appliance's on/off state:
// dishwasher loading / coffee brewing only look right while it's actually
// running. Other kinds don't gate on entity state.
const ENTITY_GATED_ACTIVITIES: ReadonlySet<ActivityKind> = new Set<ActivityKind>([
  'load_dishwasher', 'make_coffee',
]);

export class ThreeDRenderer {
  loaded = false;

  private _container: HTMLElement;
  private _scene: THREE.Scene | null = null;
  private _camera: THREE.PerspectiveCamera | null = null;
  private _renderer: THREE.WebGLRenderer | null = null;
  private _controls: OrbitControls | null = null;
  private _grid: THREE.GridHelper | null = null;
  private _floorGroup = new THREE.Group();
  private _doorGroup = new THREE.Group();
  private _modelGroup = new THREE.Group();
  private _zoneGroup = new THREE.Group();
  private _haloGroup = new THREE.Group();
  private _sensorGroup = new THREE.Group();
  private _motionGroup = new THREE.Group();
  private _envGroup = new THREE.Group();
  private _lightGroup = new THREE.Group();
  private _targetGroup = new THREE.Group();
  // Ghost (glass-house) floors: translucent shells of every OTHER story,
  // stacked at their story heights. Cleared with _clearGroup (no sprites).
  private _ghostGroup = new THREE.Group();
  private _bgTexCache: { dataUrl: string; tex: THREE.Texture } | null = null;
  private _rafId: number | null = null;
  private _fw = 8000;
  private _fd = 6000;
  // Sims cam: when on, the camera azimuth snaps to the nearest 45° after each
  // orbit gesture (an eased per-frame glide toward `_snapAzimuth`). Polar angle
  // is left wherever the user put it — only azimuth locks.
  private _simsCam = false;
  private _snapAzimuth: number | null = null;
  private _ZONE_H = 305;  // 1 ft — low outlines that don't wall off the room
  private _OBJ_H = 900;
  private _onFixtureClick: ((info: { kind: 'light' | 'switch'; entity_id: string | null; fixtureId: string }) => void) | null = null;
  private _onFixtureDblClick: ((info: { kind: 'light' | 'switch'; entity_id: string | null; fixtureId: string }) => void) | null = null;
  private _raycaster = new THREE.Raycaster();
  // Per-target humanoid rigs, persisted across frames so we can carry
  // walk-cycle phase + smoothed body facing.
  private _humanoids: Record<string, Humanoid> = {};
  // Seats collected from the current floor's sittable furniture.
  private _sitSpots: SitSpot[] = [];
  // Contextual-activity anchors collected from the current floor's furniture.
  private _activityAnchors: ActivityAnchor[] = [];
  // TVs grouped by the room they sit in — the watch_tv seated activity checks
  // whether a bound TV in the seated person's room is on. Rebuilt in updateFloor.
  private _tvsByRoom: Record<string, { furnitureId: string; hasEntity: boolean }[]> = {};
  // Beds captured in updateFloor for the two-in-bed covers effect (world coords
  // for footprint tests + scene coords + mattress-top height + def tint).
  private _beds: { id: string; x: number; y: number; w: number; h: number;
                   rotation?: number; color: number; matressTop: number;
                   cx: number; cz: number }[] = [];
  // Per-bed settle accumulator (seconds) and live cover meshes. Covers are
  // transient and parented under _targetGroup so no floor rebuild is needed to
  // clear them.
  private _bedDwell: Record<string, number> = {};
  private _bedCovers: Record<string, { mesh: THREE.Mesh; grp: THREE.Group; t: number }> = {};
  // Each named room paired with the wall loop that currently contains its
  // anchor, cached in updateFloor so updateTargets can cheaply resolve which
  // room each target stands in (a pip walk per target). Rooms whose anchor
  // falls outside every loop are skipped. Reset with the other per-floor caches.
  private _roomZones: { roomId: string; loop: Vec2[] }[] = [];
  // Bed occupancy summary produced by _updateBedCovers for NEXT frame's thought-
  // bubble resolution (one-frame lag is fine — bubble commit has 2.5 s
  // hysteresis). hiddenKeys: rigs currently hidden under the two-in-bed covers.
  // soloKeys: targets that are the sole occupant of a bed footprint.
  private _bedState: { hiddenKeys: Set<string>; soloKeys: Set<string> } =
    { hiddenKeys: new Set(), soloKeys: new Set() };
  // Wall-clock of the last updateTargets call — the bed pass derives its own dt.
  private _lastTargetsNow = 0;
  // Fan rotor groups spun in the render loop. rps ≤ 1 (100% = 1 rev/s).
  // Angle derives from the absolute clock, so rebuilds don't jump phase.
  private _fanRotors: { obj: THREE.Object3D; rps: number }[] = [];
  // Walkable terrain (stairs + landings): humanoids stand on the computed
  // surface height instead of the floor plane.
  private _terrain: { x: number; y: number; w: number; h: number; rotation?: number;
                      ht: number; elevation: number; kind: string }[] = [];
  // Navigation grid (world coords, mm), rebuilt by every updateFloor. cell =
  // 150 mm. `blocked` marks cells whose center is inside a furniture footprint
  // (inflated by PERSON_R) or a solid wall run (door/window openings stay
  // walkable). `rev` bumps every rebuild so cached per-humanoid paths
  // invalidate. `blockedCount` gives a zero-obstacle fast path (skip A*).
  private _nav: { cell: number; nx: number; ny: number;
                  blocked: Uint8Array; rev: number; blockedCount: number } | null = null;
  private _navRev = 0;

  // Foreground wall-cutaway (Sims dollhouse). Tagged wall meshes — active-floor
  // walls and ghost-floor walls kept in separate lists so each builder rebuilds
  // only its own portion. Each mesh carries userData.wallCut = { mx, mz, nx, nz }
  // (segment midpoint in scene coords + horizontal perpendicular unit vector)
  // and userData.baseOpacity. `_cutaway` (set from updateFloor's scene3d) gates
  // the effect; default ON (opt-out via scene3d.wallCutaway === false).
  private _cutawayWalls: THREE.Mesh[] = [];
  private _cutawayGhostWalls: THREE.Mesh[] = [];
  private _cutaway = true;

  // Lighting rig (preset-tunable).
  private _ambient: THREE.AmbientLight | null = null;
  private _hemi: THREE.HemisphereLight | null = null;
  private _sun: THREE.DirectionalLight | null = null;
  private _preset: ScenePreset = 'night';
  // Procedural texture cache (generated once per kind).
  private _texCache: Partial<Record<FloorTexKind, THREE.Texture>> = {};

  constructor(container: HTMLElement) { this._container = container; }

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      this._init();
      this.loaded = true;
    } catch (err) {
      console.error('3D renderer failed:', err);
      this._container.innerHTML =
        '<div style="padding:20px;color:#ef9a9a;font-size:13px;">' +
        '3D view unavailable.<br><pre style="font-size:11px;color:#aaa">' +
        ((err as Error).message || String(err)) + '</pre></div>';
    }
  }

  private _init(): void {
    const w = this._container.clientWidth || 600;
    const h = this._container.clientHeight || 400;
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x0d0d1a);
    // No fog: previously set to 12000–36000 mm range, which dimmed walls /
    // furniture / lights when the user zoomed out. Background tint is enough.
    this._camera = new THREE.PerspectiveCamera(50, w / h, 10, 60000);
    this._camera.position.set(0, 9000, -6000);
    this._camera.lookAt(0, 0, 0);
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setSize(w, h);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Sims-2000 rendering: every surface is a MeshToonMaterial with a shared
    // stepped gradient map (see _mat), lit only by the ambient/hemi/sun rig.
    // No tone mapping (toon bands want the raw curve), no PMREM environment
    // (IBL washes the bands out), and no shadow maps — soft blob-shadow
    // decals under furniture and people replace them (cheaper on tablets
    // and exactly what the original game did).
    this._renderer.toneMapping = THREE.NoToneMapping;
    this._renderer.shadowMap.enabled = false;
    this._container.appendChild(this._renderer.domElement);
    // Prevent touch from fighting page scroll on mobile.
    this._renderer.domElement.style.touchAction = 'none';
    // Keep touches out of HA frontend's reach — its drawer treats rightward
    // swipes as "open sidebar" and would hijack orbit / pan gestures.
    for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel'] as const) {
      this._renderer.domElement.addEventListener(ev, e => e.stopPropagation());
    }

    // Lighting rig: ambient + hemisphere (sky/ground bounce) + sun. Members
    // so applyScenePreset can retune without rebuilding the scene.
    this._ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this._hemi = new THREE.HemisphereLight(0xbcd2ff, 0x202018, 0.0);
    this._sun = new THREE.DirectionalLight(0xffffff, 1.0);
    this._sun.position.set(3000, 8000, 3000);
    this._scene.add(this._ambient, this._hemi, this._sun);
    this.applyScenePreset(this._preset);

    this._grid = new THREE.GridHelper(20000, 20, 0x334466, 0x1a2235);
    this._scene.add(this._grid);
    this._scene.add(this._floorGroup, this._doorGroup, this._modelGroup,
                    this._zoneGroup, this._haloGroup,
                    this._sensorGroup, this._motionGroup, this._envGroup,
                    this._lightGroup, this._targetGroup, this._ghostGroup);

    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.08;
    this._controls.target.set(0, 0, 0);
    this._controls.maxPolarAngle = Math.PI * 0.49;
    this._controls.minDistance = 1000;
    this._controls.maxDistance = 45000;
    this._controls.update();

    // Sims cam azimuth snap: after any orbit gesture ends, if the snap mode is
    // on, pick the nearest 45° azimuth about the target and let `_animate`
    // glide there. Registered once; gated on the runtime `_simsCam` flag.
    this._controls.addEventListener('end', () => {
      if (!this._simsCam || !this._camera || !this._controls) return;
      const t = this._controls.target;
      const az = Math.atan2(this._camera.position.x - t.x,
                            this._camera.position.z - t.z);
      const step = Math.PI / 4;
      this._snapAzimuth = Math.round(az / step) * step;
    });

    // Recover from iOS Safari context loss without a full reload.
    // preventDefault on `lost` is what allows the browser to fire
    // `restored` at all; on restore, force a frame so a backgrounded
    // HA-app WebView doesn't come back to a black canvas.
    this._renderer.domElement.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      console.warn('WebGL context lost — will restore on next event.');
    });
    this._renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.warn('WebGL context restored.');
      if (this._renderer && this._scene && this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    });

    // Fixture click / dblclick — manual pointerdown/pointerup pair instead of
    // the browser-synthesized `click`. OrbitControls' damping + capture means
    // the synthesized `click` was unreliable across browsers (sometimes
    // suppressed entirely after a small orbit drag). We track movement
    // ourselves: pointerup within 5 px and 500 ms of pointerdown counts as a
    // tap. Two taps within 350 ms count as a dblclick.
    const dom = this._renderer.domElement;
    let downX = 0, downY = 0, downT = 0, lastTapT = 0;
    dom.addEventListener('pointerdown', e => {
      downX = e.clientX; downY = e.clientY; downT = e.timeStamp;
    });
    dom.addEventListener('pointerup', e => {
      const dt = e.timeStamp - downT;
      const dx = Math.abs(e.clientX - downX), dy = Math.abs(e.clientY - downY);
      if (dt > 500 || dx > 5 || dy > 5) return;
      const hit = this._raycastFixture(e.clientX, e.clientY);
      if (!hit) { lastTapT = 0; return; }
      const now = e.timeStamp;
      if (now - lastTapT < 350) {
        this._onFixtureDblClick?.(hit);
        lastTapT = 0;
      } else {
        this._onFixtureClick?.(hit);
        lastTapT = now;
      }
    });

    this._animate();
  }

  onFixtureClick(fn: (info: { kind: 'light' | 'switch'; entity_id: string | null; fixtureId: string }) => void): void {
    this._onFixtureClick = fn;
  }
  onFixtureDblClick(fn: (info: { kind: 'light' | 'switch'; entity_id: string | null; fixtureId: string }) => void): void {
    this._onFixtureDblClick = fn;
  }

  private _raycastFixture(clientX: number, clientY: number):
      { kind: 'light' | 'switch'; entity_id: string | null; fixtureId: string } | null {
    if (!this._renderer || !this._camera) return null;
    const rect = this._renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this._raycaster.setFromCamera(ndc, this._camera);
    // Recurse from the lightGroup itself so all descendants are tested in one
    // call (avoids edge cases where iterating children misses deeply nested
    // meshes).
    // Layer-hidden lights are not click targets.
    if (!this._lightGroup.visible) return null;
    const hits = this._raycaster.intersectObject(this._lightGroup, true);
    for (const h of hits) {
      // Walk up to find the first ancestor that carries our userData tag.
      let obj: THREE.Object3D | null = h.object;
      while (obj) {
        const ud = obj.userData;
        if (ud && (ud.kind === 'light' || ud.kind === 'switch')) {
          return { kind: ud.kind, entity_id: ud.entity_id ?? null, fixtureId: String(ud.fixtureId) };
        }
        obj = obj.parent;
      }
    }
    return null;
  }

  // Dispose all GPU-side resources (geometries + materials + textures) for a
  // single object subtree. Three.js does NOT auto-dispose these when objects
  // are removed from the scene — without this helper, every per-frame scene
  // rebuild leaks WebGL buffers and the eventual GC stalls the main thread
  // (manifests as a long freeze when switching from 3D to 2D).
  private _disposeSubtree(obj: THREE.Object3D): void {
    obj.traverse(o => {
      // Meshes, lines, and points all carry geometry + material(s).
      const m = o as Partial<THREE.Mesh> & THREE.Object3D;
      m.geometry?.dispose();
      const mat = m.material;
      if (Array.isArray(mat)) mat.forEach(mm => mm.dispose());
      else if (mat) mat.dispose();
    });
  }

  // Empty a group AND dispose every child's resources. Use this everywhere
  // we used to do `while (g.children.length) g.remove(g.children[0])`.
  private _clearGroup(g: THREE.Group): void {
    for (let i = g.children.length - 1; i >= 0; i--) {
      const child = g.children[i];
      g.remove(child);
      this._disposeSubtree(child);
    }
  }

  // ── Sims-style material factory ─────────────────────────────────────────
  // The whole scene renders as MeshToonMaterial with one shared stepped
  // gradient map — flat, saturated color bands instead of PBR (the 2000-era
  // Sims look). The factory accepts MeshStandardMaterial-style params so the
  // ~50 legacy construction sites converted mechanically: PBR-only knobs
  // (roughness / metalness / envMapIntensity) are silently dropped, every
  // toon-valid param (color / map / emissive / transparent / opacity / side /
  // depthWrite) passes through. Colors get a gentle saturation push so the
  // palette reads game-y without clobbering user-picked hues.
  private _gradientMapTex: THREE.DataTexture | null = null;
  private _gradientMap(): THREE.DataTexture {
    if (this._gradientMapTex) return this._gradientMapTex;
    // 4 bands: enough steps to keep night scenes readable, few enough to
    // read as cel shading. Nearest filtering keeps the band edges hard.
    const steps = new Uint8Array([90, 150, 210, 255]);
    const tex = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    this._gradientMapTex = tex;
    return tex;
  }
  private _simsColor(c: THREE.ColorRepresentation): THREE.Color {
    const col = new THREE.Color(c);
    const hsl = { h: 0, s: 0, l: 0 };
    col.getHSL(hsl);
    col.setHSL(hsl.h, Math.min(1, hsl.s * 1.25 + 0.02), hsl.l);
    return col;
  }
  private _mat(p: THREE.MeshStandardMaterialParameters = {}): THREE.MeshToonMaterial {
    const { roughness: _r, metalness: _m, envMapIntensity: _e, color, ...rest } = p;
    const m = new THREE.MeshToonMaterial({
      ...(rest as THREE.MeshToonMaterialParameters),
      gradientMap: this._gradientMap(),
    });
    if (color !== undefined) m.color.copy(this._simsColor(color));
    return m;
  }

  // Soft radial blob shadow — one shared texture, an alpha quad per user.
  // Replaces shadow maps entirely (Sims-style, and a tablet perf win).
  private _blobTex: THREE.CanvasTexture | null = null;
  private _blobTexture(): THREE.CanvasTexture {
    if (this._blobTex) return this._blobTex;
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(10,12,18,0.42)');
    grad.addColorStop(0.7, 'rgba(10,12,18,0.28)');
    grad.addColorStop(1, 'rgba(10,12,18,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    this._blobTex = new THREE.CanvasTexture(c);
    return this._blobTex;
  }
  // Privacy-blur silhouette textures (shared, built once). A chunky
  // pixel-mosaic of a standing / seated body — NearestFilter for the censored
  // look. Shared like the blob/gradient maps: never disposed per-instance, only
  // in destroy(). The pattern is deterministic (hand-coded body mask + a hash
  // over gray/blue blocks).
  private _blurTexStand: THREE.CanvasTexture | null = null;
  private _blurTexSit: THREE.CanvasTexture | null = null;
  private _blurTexture(sit: boolean): THREE.CanvasTexture {
    const cached = sit ? this._blurTexSit : this._blurTexStand;
    if (cached) return cached;
    const W = 20, H = 30;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, W, H);
    const PAL = ['#6b7280', '#7c8794', '#8b95a5', '#5b6472', '#9aa4b2', '#4a5563'];
    // Body mask: returns true where a body block should be painted. Columns are
    // 0..19, rows 0 (top) .. 29 (bottom).
    const inMask = (x: number, y: number): boolean => {
      if (sit) {
        if (y >= 3 && y <= 8 && x >= 7 && x <= 12) return true;         // head
        if (y >= 9 && y <= 17 && x >= 5 && x <= 14) return true;        // torso
        if (y >= 18 && y <= 22 && x >= 4 && x <= 15) return true;       // lap / thighs
        if (y >= 23 && y <= 29 && ((x >= 5 && x <= 8) || (x >= 11 && x <= 14))) return true; // shins
        return false;
      }
      if (y >= 2 && y <= 7 && x >= 7 && x <= 12) return true;           // head
      if (y === 8 && x >= 9 && x <= 10) return true;                    // neck
      if (y >= 9 && y <= 18 && x >= 5 && x <= 14) return true;          // torso
      if (y >= 9 && y <= 16 && ((x >= 3 && x <= 4) || (x >= 15 && x <= 16))) return true; // arms
      if (y >= 19 && y <= 29 && ((x >= 6 && x <= 9) || (x >= 10 && x <= 13))) return true; // legs
      return false;
    };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!inMask(x, y)) continue;
        g.fillStyle = PAL[(x * 7 + y * 13) % PAL.length];
        g.fillRect(x, y, 1, 1);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    if (sit) this._blurTexSit = tex; else this._blurTexStand = tex;
    return tex;
  }

  // rx/rz are half-extents (mm) of the shadow ellipse in the parent's local
  // frame. The shared texture must never be disposed per-instance —
  // _disposeSubtree only disposes materials, not maps, so this is safe.
  private _blobShadow(rx: number, rz: number, y = 8): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(rx * 2, rz * 2),
      new THREE.MeshBasicMaterial({
        map: this._blobTexture(), transparent: true, depthWrite: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    // No renderOrder tweak: transparent materials draw after the opaque
    // floor anyway; forcing them earlier let the floor paint over them.
    m.userData.outlineSkip = true;
    return m;
  }

  // Cartoon outlines: inverted-hull shells. Each qualifying opaque mesh gets
  // a child mesh SHARING its geometry, rendered BackSide in flat dark, scaled
  // outward so ~`thick` mm of rim shows. Scaling is compensated about the
  // geometry's bounding-box center, so translated geometries (limb segments
  // hang below their origin) inflate symmetrically. Shells share one
  // material and the host's geometry — double-dispose is idempotent.
  private _outlineMaterial: THREE.MeshBasicMaterial | null = null;
  private _addOutlines(rootObj: THREE.Object3D, thick = 12, minDim = 90): void {
    if (!this._outlineMaterial) {
      // polygonOffset pushes shell fragments slightly deeper so a shell face
      // that lands nearly coplanar with a NEIGHBOR mesh face (abutting boxes
      // in composite furniture) loses the depth contest cleanly instead of
      // cross-hatch z-fighting. Silhouette rims stick out far enough that
      // the offset doesn't dent them.
      this._outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0x14161c, side: THREE.BackSide,
        polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2,
      });
    }
    const targets: THREE.Mesh[] = [];
    rootObj.traverse(o => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.outline || m.userData.outlineSkip) return;
      const mat = m.material as THREE.Material;
      if (Array.isArray(m.material) || !mat || mat.transparent) return;
      targets.push(m);
    });
    let idx = 0;
    for (const m of targets) {
      const geo = m.geometry;
      if (!geo.boundingBox) geo.computeBoundingBox();
      const bb = geo.boundingBox;
      if (!bb) continue;
      const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
      if (Math.min(sx, sy, sz) < 8) continue;          // thin sheets: shell z-fights
      if (Math.max(sx, sy, sz) < minDim) continue;     // tiny detail parts: noise
      // Stagger thickness per shell: two shells from ABUTTING boxes (sofa
      // seat vs armrest) can otherwise land coplanar and z-fight — the
      // shared polygonOffset can't break a shell-vs-shell tie.
      const th = thick + (idx++ % 3) * 3;
      const fx = (sx + th * 2) / sx, fy = (sy + th * 2) / sy, fz = (sz + th * 2) / sz;
      const cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2, cz = (bb.min.z + bb.max.z) / 2;
      const shell = new THREE.Mesh(geo, this._outlineMaterial);
      shell.userData.outline = true;
      shell.scale.set(fx, fy, fz);
      shell.position.set(cx * (1 - fx), cy * (1 - fy), cz * (1 - fz));
      m.add(shell);
    }
  }

  // Strip every per-floor mesh group. Called when the user switches floors so
  // a transient bug or render hiccup can't leave the previous floor's
  // sensors / fixtures / zones / halos / targets visible.
  clearTransientGroups(): void {
    for (const g of [
      this._floorGroup, this._doorGroup, this._modelGroup, this._zoneGroup, this._haloGroup,
      this._sensorGroup, this._motionGroup, this._lightGroup, this._targetGroup, this._ghostGroup,
    ]) {
      this._clearGroup(g);
    }
    // Drop cutaway-wall references (their meshes were just disposed) so the
    // per-frame fader can't touch stale geometry before the next rebuild.
    this._cutawayWalls = [];
    this._cutawayGhostWalls = [];
    // Drop persistent rigs so updateTargets rebuilds fresh on the next tick.
    for (const key of Object.keys(this._humanoids)) {
      this._disposeHumanoid(this._humanoids[key]);
    }
    this._humanoids = {};
    this._sitSpots = [];
    this._activityAnchors = [];
    this._tvsByRoom = {};
    this._beds = [];
    this._roomZones = [];
    this._disposeBedCovers();
    this._fanRotors = [];
    this._terrain = [];
    // updateFloor rebuilds this every call, but null it on floor switch so a
    // stale grid can't briefly route targets against the previous floor.
    this._nav = null;
  }

  // Remove + dispose every live bed cover and clear the dwell accumulators.
  // The cover meshes live under _targetGroup, so a _clearGroup on that group
  // already frees the GPU buffers — this just drops our tracking records and
  // covers the standalone (destroy) call.
  private _disposeBedCovers(): void {
    for (const id of Object.keys(this._bedCovers)) {
      const c = this._bedCovers[id];
      this._targetGroup.remove(c.grp);
      c.mesh.geometry.dispose();
      (c.mesh.material as THREE.Material).dispose();
    }
    this._bedCovers = {};
    this._bedDwell = {};
  }

  // ── Camera views ────────────────────────────────────────────────────────
  cameraView(): { pos: [number, number, number]; target: [number, number, number] } | null {
    if (!this._camera || !this._controls) return null;
    const p = this._camera.position, t = this._controls.target;
    return { pos: [p.x, p.y, p.z], target: [t.x, t.y, t.z] };
  }

  setCameraView(pos: [number, number, number], target: [number, number, number]): void {
    if (!this._camera || !this._controls) return;
    this._camera.position.set(pos[0], pos[1], pos[2]);
    this._controls.target.set(target[0], target[1], target[2]);
    this._controls.update();
  }

  // Built-in camera views framed to the current floor extents. 'front' is
  // the scene -Z side, which matches the bottom edge of the 2D plan. 'sims' is
  // a dimetric-feel pose (45° azimuth, ~35.26° elevation = atan(1/√2)) framed
  // on the floor center at eye height — pair with setSimsCam(true) for the snap.
  applyViewPreset(kind: 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sims'): void {
    const d = Math.max(this._fw, this._fd) * 1.35;
    if (kind === 'sims') {
      // Dimetric: azimuth 45°, elevation atan(1/√2). Horizontal radius r and
      // height h satisfy h/r = 1/√2, |(r,h)| = d.
      const el = Math.atan(1 / Math.SQRT2);
      const r = d * Math.cos(el), h = d * Math.sin(el);
      const a = Math.PI / 4;
      const target: [number, number, number] = [0, 600, 0];
      this.setCameraView(
        [target[0] - r * Math.sin(a), target[1] + h, target[2] - r * Math.cos(a)],
        target);
      return;
    }
    const views: Record<string, [number, number, number]> = {
      iso:   [-d * 0.75, d * 0.75, -d * 0.75],
      top:   [0, d * 1.6, -d * 0.02],
      front: [0, d * 0.45, -d * 1.15],
      back:  [0, d * 0.45, d * 1.15],
      left:  [d * 1.15, d * 0.45, 0],   // scene +X = 2D plan left (X mirrored)
      right: [-d * 1.15, d * 0.45, 0],
    };
    const v = views[kind] ?? views.iso;
    this.setCameraView(v, [0, 0, 0]);
  }

  // Toggle Sims-cam azimuth snapping. Turning it on snaps immediately from the
  // current pose; turning it off cancels any in-flight glide.
  setSimsCam(on: boolean): void {
    this._simsCam = on;
    if (!on) { this._snapAzimuth = null; return; }
    if (!this._camera || !this._controls) return;
    const t = this._controls.target;
    const az = Math.atan2(this._camera.position.x - t.x,
                          this._camera.position.z - t.z);
    const step = Math.PI / 4;
    this._snapAzimuth = Math.round(az / step) * step;
  }

  simsCamOn(): boolean { return this._simsCam; }

  // Surface height (mm) under a world point: the highest stair tread or
  // landing containing it, else the floor (0). Stair treads quantize to the
  // same step layout the builder renders, so figures stand ON treads.
  private _groundYAt(wx: number, wy: number): number {
    let g = 0, found = false;
    for (const t of this._terrain) {
      const l = furnitureWorldToLocal(t.rotation, wx - t.x, wy - t.y);
      if (Math.abs(l.x) > t.w / 2 || Math.abs(l.y) > t.h / 2) continue;
      let gy: number;
      if (t.kind === 'stair_landing') {
        gy = t.elevation + t.ht;
      } else {
        const n = Math.max(3, Math.round(t.h / 280));
        const frac = (l.y + t.h / 2) / t.h;  // 0 at the front → 1 at the top
        const step = Math.min(n - 1, Math.max(0, Math.floor(frac * n)));
        gy = t.elevation + (t.ht / n) * (step + 1);
      }
      if (!found || gy > g) { g = gy; found = true; }
    }
    return found ? g : 0;
  }

  // World→3D mapping: flip X so screen-right matches 2D world +X; world Y → 3D Z.
  private _w(wx: number, wy: number, h = 0): THREE.Vector3 {
    return new THREE.Vector3(this._fw / 2 - wx, h, wy - this._fd / 2);
  }

  // ── Scene appearance ────────────────────────────────────────────────────
  // Presets tune the ambient / hemisphere / sun rig + background tint.
  //   day   — bright neutral exterior daylight
  //   dusk  — low warm sun, stronger sky bounce
  //   night — dim blue ambient so bound HA lights dominate (default; the
  //           original look)
  // Tuned for the toon pipeline: no tone mapping, no environment map, no
  // shadow maps — light levels are what you see. Toon bands want a strong
  // directional component (the sun) so surfaces facing away drop a band.
  applyScenePreset(preset: ScenePreset): void {
    this._preset = preset;
    if (!this._scene || !this._ambient || !this._hemi || !this._sun) return;
    switch (preset) {
      case 'day':
        this._scene.background = new THREE.Color(0xa9c4e0);
        this._ambient.intensity = 0.85;
        this._hemi.color.set(0xcfe5ff); this._hemi.groundColor.set(0x8a7f6a);
        this._hemi.intensity = 0.55;
        this._sun.color.set(0xfff6e0); this._sun.intensity = 1.15;
        this._sun.position.set(4000, 10000, 2500);
        break;
      case 'dusk':
        this._scene.background = new THREE.Color(0x2a2030);
        this._ambient.intensity = 0.45;
        this._hemi.color.set(0xff9d6a); this._hemi.groundColor.set(0x202028);
        this._hemi.intensity = 0.4;
        this._sun.color.set(0xff8a4a); this._sun.intensity = 0.6;
        this._sun.position.set(-6000, 2500, 4000);
        break;
      default: // night
        this._scene.background = new THREE.Color(0x0d0d1a);
        this._ambient.intensity = 0.5;
        this._hemi.color.set(0x223048); this._hemi.groundColor.set(0x101018);
        this._hemi.intensity = 0.25;
        this._sun.color.set(0xdfe6ff); this._sun.intensity = 0.45;
        this._sun.position.set(3000, 8000, 3000);
    }
  }

  // Shadow maps are gone (blob decals instead) — kept as a no-op so the many
  // builder call sites didn't need touching and the signature stays stable.
  private _shadowFlags(_obj: THREE.Object3D, _cast = true, _receive = true): void {}

  // Cheap procedural floor textures drawn to a canvas once and cached.
  // Keeps the bundle free of binary assets and works offline.
  private _floorTexture(kind: FloorTexKind): THREE.Texture | null {
    if (kind === 'none') return null;
    const cached = this._texCache[kind];
    if (cached) return cached;
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d')!;
    if (kind === 'wood') {
      g.fillStyle = '#7a5a3c'; g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 32) {
        g.fillStyle = `rgba(0,0,0,${0.08 + (y / 32 % 2) * 0.05})`;
        g.fillRect(0, y, 256, 32);
        g.strokeStyle = 'rgba(40,24,12,0.55)'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
        // grain streaks
        for (let i = 0; i < 6; i++) {
          g.strokeStyle = `rgba(60,38,20,${0.12 + Math.random() * 0.12})`;
          g.lineWidth = 0.8;
          const yy = y + 4 + Math.random() * 24;
          g.beginPath(); g.moveTo(0, yy);
          g.bezierCurveTo(64, yy + Math.random() * 4 - 2, 192, yy + Math.random() * 4 - 2, 256, yy);
          g.stroke();
        }
      }
    } else if (kind === 'tile') {
      g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = 'rgba(40,44,48,0.7)'; g.lineWidth = 3;
      for (let i = 0; i <= 256; i += 64) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
        g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
      }
      // mild per-tile shade variance
      for (let x = 0; x < 256; x += 64) for (let y = 0; y < 256; y += 64) {
        g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
        g.fillRect(x, y, 64, 64);
      }
    } else { // concrete
      g.fillStyle = '#8d8d90'; g.fillRect(0, 0, 256, 256);
      const img = g.getImageData(0, 0, 256, 256);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 18;
        img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
      }
      g.putImageData(img, 0, 0);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this._texCache[kind] = tex;
    return tex;
  }

  // ── Imported 3D model (Sweet Home 3D OBJ) ───────────────────────────────
  // Loads parsed OBJ/MTL text into the model group. Caller gates on
  // model3d.rev / transform changes. SH3D exports cm with Y-up and plan-Y
  // along +Z; our scene mirrors X and plan-Y maps to +Z, so scaling X and Z
  // by -scale flips both axes (determinant stays positive — no inside-out
  // normals) and lines the model up with the 2D plan.
  updateModel3D(meta: Model3D | null | undefined, objText: string | null,
                mtlText: string | null): void {
    if (!this._scene) return;
    this._clearGroup(this._modelGroup);
    if (!meta || !meta.visible || !objText) return;
    try {
      const objLoader = new OBJLoader();
      if (mtlText) {
        const mtl = new MTLLoader().parse(mtlText, '');
        mtl.preload();
        objLoader.setMaterials(mtl);
      }
      const obj = objLoader.parse(objText);
      const s = meta.scale;
      const grp = new THREE.Group();
      obj.scale.set(-s, s, -s);
      grp.add(obj);
      const p = this._w(meta.x, meta.y, 0);
      grp.position.set(p.x, 0, p.z);
      grp.rotation.y = -((meta.rotation || 0) * Math.PI / 180);
      if (meta.opacity < 1) {
        grp.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            for (const mat of mats) {
              (mat as THREE.Material).transparent = true;
              (mat as THREE.Material).opacity = meta.opacity;
              (mat as THREE.Material).depthWrite = meta.opacity > 0.6;
            }
          }
        });
      }
      this._shadowFlags(grp);
      this._modelGroup.add(grp);
    } catch (err) {
      console.error('3D model load failed:', err);
    }
  }

  // Layer visibility (shared with the 2D layer flags): cheap per-tick
  // group.visible flips — no rebuilds. Furniture and the bg image live
  // inside _floorGroup and are gated at build time in updateFloor instead.
  setLayerVisibility(v: { lights?: boolean; sensors?: boolean; motion?: boolean;
                          env?: boolean; zones?: boolean; targets?: boolean }): void {
    this._lightGroup.visible = v.lights !== false;
    this._sensorGroup.visible = v.sensors !== false;
    this._motionGroup.visible = v.motion !== false;
    this._envGroup.visible = v.env !== false;
    const z = v.zones !== false;
    this._zoneGroup.visible = z;
    this._haloGroup.visible = z;
    this._targetGroup.visible = v.targets !== false;
  }

  updateFloor(f: Floor, scene3d?: Scene3D, layers?: import('./types.js').Layers2D,
              customObjects?: ObjectRecipe[]): void {
    if (!this._scene) return;
    this._fw = f.w; this._fd = f.d;
    // Foreground wall cutaway: default ON, opt out with wallCutaway === false.
    this._cutaway = scene3d?.wallCutaway !== false;
    this._cutawayWalls = [];
    // Room-name labels are Sprites whose CanvasTextures _clearGroup won't touch;
    // drop them explicitly (mirrors the _envGroup pairing in updateEnvSensors)
    // before wiping the group, or every rebuild leaks a GPU texture.
    this._disposeSpriteMaps(this._floorGroup);
    this._clearGroup(this._floorGroup);
    if (scene3d?.preset && scene3d.preset !== this._preset) {
      this.applyScenePreset(scene3d.preset);
    }

    const floorColor = scene3d?.floorColor ? hexToInt(scene3d.floorColor) : 0x101820;
    const floorTex = this._floorTexture(scene3d?.floorTex ?? 'none');
    if (floorTex) {
      // Repeat ~1 tile per 800 mm so texel density stays sane on any floor.
      floorTex.repeat.set(Math.max(1, f.w / 800), Math.max(1, f.d / 800));
    }
    // Floor: when the walls trace closed loop(s), the floor covers exactly
    // those footprints instead of the whole f.w × f.d rectangle. Invisible
    // walls count, so an open-plan boundary can close a region without
    // rendering a wall. No closed loop → classic full-rectangle floor.
    const loops = closedWallLoops(f.walls ?? []);
    const showFurniture = layers?.furniture !== false;
    const showBg = layers?.bg !== false;
    // Stairs sunk below the floor (negative elevation) cut a stairwell
    // opening so the descending flight is visible from above. No holes when
    // furniture (incl. stairs) is layer-hidden.
    const wellCuts = (showFurniture ? (f.furniture ?? []) : []).filter(fu =>
      (fu.kind === 'stairs' || fu.kind === 'stairs_half' || fu.kind === 'stair_landing') &&
      (fu.elevation ?? 0) < 0);
    const wellPath = (fu: Furniture): { path: THREE.Path; center: { x: number; y: number } } => {
      const path = new THREE.Path();
      const cs: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      cs.forEach(([sx, sy], i) => {
        const lw = furnitureLocalToWorld(fu.rotation, sx * fu.w / 2, sy * fu.h / 2);
        const px = f.w / 2 - (fu.x + lw.x), py = f.d / 2 - (fu.y + lw.y);
        if (i === 0) path.moveTo(px, py); else path.lineTo(px, py);
      });
      path.closePath();
      return { path, center: { x: fu.x, y: fu.y } };
    };
    const floorMat = this._mat({
      color: floorColor, map: floorTex ?? null,
      side: THREE.DoubleSide, roughness: 0.9, metalness: 0.0,
    });
    if (wellCuts.length) {
      // Dark void plane below the deepest well so stairwell openings show
      // depth instead of the sky behind the scene.
      const deepest = Math.min(...wellCuts.map(fu => fu.elevation ?? 0));
      const voidPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(f.w * 1.2, f.d * 1.2),
        new THREE.MeshBasicMaterial({ color: 0x101216, side: THREE.DoubleSide }));
      voidPlane.rotation.x = -Math.PI / 2;
      voidPlane.position.y = deepest - 120;
      this._floorGroup.add(voidPlane);
    }
    if (loops.length) {
      // ShapeGeometry UVs are raw shape coords (mm); one texture repeat per
      // 800 mm matches the plane path's repeat = size/800.
      if (floorTex) floorTex.repeat.set(1 / 800, 1 / 800);
      for (const loop of loops) {
        // Plane rotated -π/2 maps shape (sx, sy) → scene (sx, 0, -sy);
        // world (wx, wy) must land at (fw/2 − wx, 0, wy − fd/2).
        const shape = new THREE.Shape();
        loop.forEach((pt, i) => {
          const sx = f.w / 2 - pt.x, sy = f.d / 2 - pt.y;
          if (i === 0) shape.moveTo(sx, sy); else shape.lineTo(sx, sy);
        });
        shape.closePath();
        // Stairwell holes whose center falls inside this loop.
        for (const fu of wellCuts) {
          const { path, center } = wellPath(fu);
          if (pip(center.x, center.y, loop)) shape.holes.push(path);
        }
        const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), floorMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        this._floorGroup.add(mesh);
      }
    } else if (wellCuts.length) {
      // Full-rectangle floor as a Shape so stairwells can pierce it.
      if (floorTex) floorTex.repeat.set(1 / 800, 1 / 800);
      const shape = new THREE.Shape();
      shape.moveTo(f.w / 2, f.d / 2);
      shape.lineTo(-f.w / 2, f.d / 2);
      shape.lineTo(-f.w / 2, -f.d / 2);
      shape.lineTo(f.w / 2, -f.d / 2);
      shape.closePath();
      for (const fu of wellCuts) shape.holes.push(wellPath(fu).path);
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), floorMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      this._floorGroup.add(mesh);
    } else {
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(f.w, f.d), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;  // ground catches shadows, never casts
      this._floorGroup.add(floor);
    }

    // Background image (overlays grid when visible)
    const bg = f.bg;
    const bgVisible = !!(bg && bg.visible !== false && bg.dataUrl) && showBg;
    if (this._grid) this._grid.visible = !bgVisible;
    if (!bgVisible && this._bgTexCache) {
      this._bgTexCache.tex.dispose();
      this._bgTexCache = null;
    }
    if (bgVisible && bg) {
      if (!this._bgTexCache || this._bgTexCache.dataUrl !== bg.dataUrl) {
        if (this._bgTexCache) this._bgTexCache.tex.dispose();
        const tex = new THREE.TextureLoader().load(bg.dataUrl, () => {
          if (this._renderer && this._scene && this._camera) {
            this._renderer.render(this._scene, this._camera);
          }
        });
        tex.colorSpace = THREE.SRGBColorSpace;
        this._bgTexCache = { dataUrl: bg.dataUrl, tex };
      }
      const planeGeo = new THREE.PlaneGeometry(bg.w, bg.h);
      const planeMat = new THREE.MeshBasicMaterial({
        map: this._bgTexCache.tex, transparent: true, opacity: bg.opacity ?? 1,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const grp = new THREE.Group();
      const p = this._w(bg.x, bg.y, 2);
      grp.position.set(p.x, p.y, p.z);
      grp.rotation.y = -(bg.rotation || 0) * Math.PI / 180;
      const mesh = new THREE.Mesh(planeGeo, planeMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.x = -1; mesh.scale.y = -1;
      grp.add(mesh);
      this._floorGroup.add(grp);
    }

    // Walls. Door / window openings cut real gaps: solid runs are full-height
    // boxes; a window keeps a sill below (0–900) and a header above 1700;
    // a door (2000 panel) keeps a header/lintel above 2050 so the opening
    // sits inside the 9 ft wall. Open doors/windows reveal a real gap.
    const wallH = 2743 /* 9 ft */, wallThick = 100;
    const SILL_TOP = 900, HEADER_BOT = 1700, DOOR_HEAD = 2050;
    const wallMatFor = () => this._mat({
      color: scene3d?.wallColor ? hexToInt(scene3d.wallColor) : 0xbbbbbb,
      emissive: 0x444444, emissiveIntensity: 0.1,
      transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false,
    });
    for (const wall of f.walls) {
      if (wall.points.length < 2) continue;
      const kind = wallKind(wall);
      if (kind === 'invisible') continue;  // planning boundary only
      const kindH = WALL_KINDS[kind].h;
      const group = new THREE.Group();
      for (let i = 0; i < wall.points.length - 1; i++) {
        const a = wall.points[i], b = wall.points[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) continue;
        const ux = dx / len, uy = dy / len;
        const angle = Math.atan2(-dx, dy);
        if (kind === 'railing') {
          // Banister: end/interval posts + top rail + thin balusters.
          const railMat = this._mat({
            color: scene3d?.wallColor ? hexToInt(scene3d.wallColor) : 0x8d8d92,
            metalness: 0.3, roughness: 0.5,
          });
          const bar = (t: number, w2: number, y0: number, y1: number, d2 = 70) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(d2, y1 - y0, w2), railMat);
            const p = this._w(a.x + ux * t, a.y + uy * t, (y0 + y1) / 2);
            m.position.set(p.x, p.y, p.z);
            m.rotation.y = angle;
            group.add(m);
          };
          bar(len / 2, len, kindH - 60, kindH);          // top rail
          bar(len / 2, len, 60, 100, 50);                // bottom rail
          const nPosts = Math.max(1, Math.round(len / 1200));
          for (let k = 0; k <= nPosts; k++) bar((len * k) / nPosts, 90, 0, kindH - 60, 90);
          const nBal = Math.floor(len / 280);
          for (let k = 1; k < nBal; k++) bar((len * k) / nBal, 28, 100, kindH - 60, 28);
          continue;
        }
        const piece = (t0: number, t1: number, y0: number, y1: number) => {
          const yTop = Math.min(y1, kindH);
          if (t1 - t0 < 10 || yTop - y0 < 10) return;
          const geo = new THREE.BoxGeometry(wallThick, yTop - y0, t1 - t0);
          const mesh = new THREE.Mesh(geo, wallMatFor());
          const mid = (t0 + t1) / 2;
          const p = this._w(a.x + ux * mid, a.y + uy * mid, (y0 + yTop) / 2);
          mesh.position.set(p.x, p.y, p.z);
          mesh.rotation.y = angle;
          // Cutaway tag: scene-space midpoint + horizontal perpendicular (the
          // scene-space wall direction is (-ux, uy) after the X-mirror, so its
          // normal is (-uy, -ux)). Either sign is fine — the fader re-orients.
          this._tagCutawayWall(mesh, p.x, p.z, -uy, -ux, this._cutawayWalls);
          group.add(mesh);
        };
        const { solids, openings } = wallCutsForSegment(a, b, f.doors ?? [], f.windows ?? []);
        for (const sv of solids) piece(sv.t0, sv.t1, 0, kindH);
        for (const op of openings) {
          if (op.kind === 'window') {
            piece(op.t0, op.t1, 0, SILL_TOP);        // sill
            piece(op.t0, op.t1, HEADER_BOT, kindH);  // header (skipped on low walls)
          } else {
            piece(op.t0, op.t1, DOOR_HEAD, kindH);   // lintel (skipped on low walls)
          }
        }
      }
      this._shadowFlags(group);
      this._floorGroup.add(group);
    }

    // Furniture: kind-specific block shapes. Each piece becomes a Group
    // positioned at the world (fu.x, fu.y); +Y world (the "front" of chairs /
    // sofas / beds) maps to local -Z after the X-mirror in `_w`, so backrests
    // get placed at child.position.z = -depth/2.
    this._sitSpots = [];
    this._activityAnchors = [];
    this._tvsByRoom = {};
    this._beds = [];
    this._roomZones = [];
    this._terrain = [];
    const rooms = f.rooms ?? [];
    for (const fu of showFurniture ? f.furniture : []) {
      const grp = this._buildFurniture(fu, f.furniture, customObjects);
      this._shadowFlags(grp);
      this._floorGroup.add(grp);
      const def = resolveFurnitureDef(fu, customObjects);
      // Stairs and landings are walkable terrain for humanoid targets.
      if (fu.kind === 'stairs' || fu.kind === 'stairs_half' || fu.kind === 'stair_landing') {
        this._terrain.push({
          x: fu.x, y: fu.y, w: fu.w, h: fu.h, rotation: fu.rotation,
          ht: def.ht, elevation: fu.elevation ?? 0, kind: fu.kind,
        });
      }
      // Which named room this piece sits in (live loop resolution; null when
      // its center falls outside every closed loop).
      const roomId = resolveRoomForPoint(rooms, loops, fu.x, fu.y)?.id ?? null;
      // Sittable kinds (def.seat set) become seating anchors for humanoids.
      // Facing: person sits facing away from the backrest — body-local -Z,
      // which is the furniture group's yaw.
      if (def.seat) {
        // The seat's own activity (e.g. a desk/table authored as sittable)
        // wins; otherwise probe for an adjacent table/desk whose footprint
        // (expanded 400 mm) contains the seat center, so a plain chair pulled
        // up to a table/desk becomes an eat/work seat. Reads the HOST's
        // resolved def.activity so custom recipes with those activities work.
        let hostActivity = def.activity;
        if (!hostActivity) {
          for (const host of f.furniture) {
            if (host === fu) continue;
            const ha = resolveFurnitureDef(host, customObjects).activity;
            if (ha !== 'eat_at_table' && ha !== 'work_at_desk') continue;
            const l = furnitureWorldToLocal(host.rotation, fu.x - host.x, fu.y - host.y);
            if (Math.abs(l.x) <= host.w / 2 + 400 && Math.abs(l.y) <= host.h / 2 + 400) {
              hostActivity = ha; break;
            }
          }
        }
        const c = this._w(fu.x, fu.y, 0);
        this._sitSpots.push({
          x: c.x, z: c.z, seatY: def.seat + (fu.elevation ?? 0),
          facing: -((fu.rotation || 0) * Math.PI / 180),
          r: Math.max(fu.w, fu.h) / 2 + 350,
          roomId,
          hostActivity,
        });
      }
      // Pieces whose def carries an `activity` register a contextual anchor
      // (dwell triggers wire these up in a later phase).
      if (def.activity) {
        const a = this._w(fu.x, fu.y, 0);
        this._activityAnchors.push({
          furnitureId: fu.id, x: a.x, z: a.z,
          r: Math.max(fu.w, fu.h) / 2 + 350,
          facing: -((fu.rotation || 0) * Math.PI / 180),
          kind: def.activity,
          roomId,
          hasEntity: fu.entity_id != null,
        });
      }
      // TVs per room: a seated person in a room whose bound TV is on watches it.
      // Skip roomless TVs (can't scope them to a seat's room).
      if ((fu.kind === 'tv' || def.activity === 'watch_tv') && roomId) {
        (this._tvsByRoom[roomId] ??= []).push({
          furnitureId: fu.id, hasEntity: fu.entity_id != null,
        });
      }
      // Beds captured for the two-in-bed covers effect. Mattress top matches the
      // bed builder: frame HT*0.45 + mattress spanning to HT*1.05.
      if (fu.kind === 'bed') {
        const c = this._w(fu.x, fu.y, 0);
        this._beds.push({
          id: fu.id, x: fu.x, y: fu.y, w: fu.w, h: fu.h, rotation: fu.rotation,
          color: def.color, matressTop: def.ht * 1.05, cx: c.x, cz: c.z,
        });
      }
    }

    // Room-name labels: a dim billboard at the centroid of each room's
    // containing wall loop. The room IS whichever closed loop currently holds
    // its anchor, so labels track wall edits. Skip anchors outside all loops.
    for (const rm of rooms) {
      const loop = loopContaining(loops, rm.anchor.x, rm.anchor.y);
      if (!loop) continue;
      // Cache the room ↔ loop pairing for per-frame target-room resolution.
      this._roomZones.push({ roomId: rm.id, loop });
      const c = centroid(loop);
      const wp = this._w(c.x, c.y, 50);
      const sprite = this._makeRoomLabelSprite(rm.name);
      sprite.position.set(wp.x, wp.y, wp.z);
      this._floorGroup.add(sprite);
    }

    // Rebuild the humanoid navigation grid from the same walls + furniture.
    this._buildNav(f, showFurniture ? undefined : null, customObjects);
  }

  // Tag a wall mesh for the foreground-cutaway fader. Records the segment
  // midpoint (scene XZ) + a horizontal perpendicular unit vector + the build-
  // time opacity, and enrolls the mesh in `list` so _updateWallCutaway iterates
  // it without a per-frame scene traversal.
  private _tagCutawayWall(mesh: THREE.Mesh, mx: number, mz: number,
                          nx: number, nz: number, list: THREE.Mesh[]): void {
    const nlen = Math.hypot(nx, nz) || 1;
    const mat = mesh.material as THREE.Material & { opacity?: number; transparent?: boolean };
    mesh.userData.wallCut = { mx, mz, nx: nx / nlen, nz: nz / nlen };
    mesh.userData.baseOpacity = mat.opacity ?? 1;
    list.push(mesh);
  }

  // ── Glass-house multi-story view ─────────────────────────────────────────
  // Render every OTHER floor as a translucent shell stacked at its story
  // height (the ACTIVE floor is drawn live by the normal pipeline at y=0).
  // Lightweight: loop-clipped (or full-rect) floor slab, single-box wall runs
  // (no opening cuts), footprint furniture boxes — no outlines, blobs, shadows,
  // or raycast targets. Each ghost floor uses ITS OWN w/d for coordinate
  // mapping but is centered on the scene origin, so all stories line up.
  updateGhostFloors(floors: Floor[], currentId: string, scene3d?: Scene3D,
                    customObjects?: ObjectRecipe[]): void {
    if (!this._scene) return;
    this._clearGroup(this._ghostGroup);
    this._cutawayGhostWalls = [];
    if (!scene3d?.glassHouse) return;

    const STORY_H = 3000;   // 2743 mm wall + slab
    const curIdx = Math.max(0, floors.findIndex(fl => fl.id === currentId));

    for (let i = 0; i < floors.length; i++) {
      if (floors[i].id === currentId) continue;   // active floor is live
      const gf = floors[i];
      const yOff = (i - curIdx) * STORY_H;
      const gw = gf.w, gd = gf.d;
      // Ghost-floor world→scene map: same formula as _w but with THIS floor's
      // dimensions (both stories centered at the origin). Inline — _w reads
      // this._fw/_fd (the active floor's dims).
      const gsx = (wx: number) => gw / 2 - wx;
      const gsz = (wy: number) => wy - gd / 2;

      const gGrp = new THREE.Group();
      gGrp.position.y = yOff;

      const wallColor = gf.look3d?.wallColor ?? scene3d.wallColor;
      const floorColor = gf.look3d?.floorColor ?? scene3d.floorColor;

      // Floor slab — loop-clipped when the walls trace closed loops, else a
      // full rectangle. No stairwell cuts (ghosts stay cheap).
      const slabMat = this._mat({
        color: floorColor ? hexToInt(floorColor) : 0x101820,
        transparent: true, opacity: 0.30, side: THREE.DoubleSide, depthWrite: false,
      });
      const loops = closedWallLoops(gf.walls ?? []);
      if (loops.length) {
        for (const loop of loops) {
          const shape = new THREE.Shape();
          loop.forEach((pt, k) => {
            const sx = gsx(pt.x), sy = gsz(pt.y);
            if (k === 0) shape.moveTo(sx, sy); else shape.lineTo(sx, sy);
          });
          shape.closePath();
          const slab = new THREE.Mesh(new THREE.ShapeGeometry(shape), slabMat);
          slab.rotation.x = -Math.PI / 2;
          gGrp.add(slab);
        }
      } else {
        const slab = new THREE.Mesh(new THREE.PlaneGeometry(gw, gd), slabMat);
        slab.rotation.x = -Math.PI / 2;
        gGrp.add(slab);
      }

      // Walls — one box per polyline segment at full run length (no opening
      // cuts), height per wall kind. Railings/invisible skipped. Tagged for
      // cutaway (dollhouse applies to ghost stories too).
      const wallThick = 100;
      for (const wall of gf.walls ?? []) {
        if (wall.points.length < 2) continue;
        const kind = wallKind(wall);
        if (kind === 'invisible' || kind === 'railing') continue;
        const kindH = WALL_KINDS[kind].h;
        for (let s = 0; s < wall.points.length - 1; s++) {
          const a = wall.points[s], b = wall.points[s + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const len = Math.hypot(dx, dy);
          if (len < 10) continue;
          const ux = dx / len, uy = dy / len;
          const angle = Math.atan2(-dx, dy);
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(wallThick, kindH, len),
            this._mat({ color: wallColor ? hexToInt(wallColor) : 0xbbbbbb,
              transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false }));
          const mxw = a.x + ux * len / 2, myw = a.y + uy * len / 2;
          mesh.position.set(gsx(mxw), kindH / 2, gsz(myw));
          mesh.rotation.y = angle;
          this._tagCutawayWall(mesh, gsx(mxw), gsz(myw), -uy, -ux, this._cutawayGhostWalls);
          gGrp.add(mesh);
        }
      }

      // Furniture — simple footprint boxes (w × def.ht × h), no outlines/blobs.
      for (const fu of gf.furniture ?? []) {
        const def = resolveFurnitureDef(fu, customObjects);
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(fu.w, def.ht, fu.h),
          this._mat({ color: def.color, transparent: true, opacity: 0.18,
            side: THREE.DoubleSide, depthWrite: false }));
        mesh.position.set(gsx(fu.x), def.ht / 2 + (fu.elevation ?? 0), gsz(fu.y));
        mesh.rotation.y = -((fu.rotation || 0) * Math.PI / 180);
        gGrp.add(mesh);
      }

      this._ghostGroup.add(gGrp);
    }
  }

  // ── Foreground wall cutaway (Sims dollhouse) ──────────────────────────────
  // Fade walls that sit between the camera and the room center so an iso view
  // sees inside. Runs per-frame from _animate (camera damping moves the camera
  // between input events). Only dot products over the pre-collected tagged
  // meshes — no scene traversal.
  private _updateWallCutaway(): void {
    if (!this._camera) return;
    const cam = this._camera.position;
    const camHoriz = Math.hypot(cam.x, cam.z);
    const camLen = camHoriz || 1;
    // Camera nearly overhead (top view) → the horizontal direction is
    // undefined and no wall is "in front"; restore everything.
    const overhead = camHoriz < Math.max(this._fw, this._fd) * 1.35 * 0.12;
    const apply = (mesh: THREE.Mesh) => {
      const cut = mesh.userData.wallCut as
        { mx: number; mz: number; nx: number; nz: number } | undefined;
      if (!cut) return;
      const mat = mesh.material as THREE.Material & { opacity: number; transparent: boolean };
      const base = (mesh.userData.baseOpacity as number) ?? 1;
      let target = base;
      if (this._cutaway && !overhead) {
        // Outward normal = the perpendicular sign pointing away from origin.
        let onx = cut.nx, onz = cut.nz;
        if (onx * cut.mx + onz * cut.mz < 0) { onx = -onx; onz = -onz; }
        const midLen = Math.hypot(cut.mx, cut.mz) || 1;
        const foreground =
          // camera on the wall's outward side (between camera and interior)
          onx * (cam.x - cut.mx) + onz * (cam.z - cut.mz) > 0 &&
          // wall roughly between the camera and the scene center
          (cam.x * cut.mx + cam.z * cut.mz) / (camLen * midLen) > 0.3;
        if (foreground) target = 0.06;
      }
      // Ease toward the target so walls fade rather than pop.
      mat.opacity += (target - mat.opacity) * 0.1;
      mat.transparent = true;
    };
    for (const m of this._cutawayWalls) apply(m);
    for (const m of this._cutawayGhostWalls) apply(m);
  }

  // ── Humanoid navigation (collision-aware pathfinding) ────────────────────
  // Build the nav grid in world coords (mm). Furniture footprints (inflated by
  // PERSON_R) and solid wall runs block cells; door/window openings stay
  // walkable. Build cost is cells × pieces + segment tests — build-time only.
  // `furnitureOn` mirrors the layer gate: pass `null` to treat furniture as
  // layer-hidden (don't block on it), else `undefined`.
  private _buildNav(f: Floor, furnitureOn: null | undefined,
                    customObjects?: ObjectRecipe[]): void {
    const cell = 150;
    const PERSON_R = 170;
    const nx = Math.max(1, Math.ceil(f.w / cell));
    const ny = Math.max(1, Math.ceil(f.d / cell));
    const blocked = new Uint8Array(nx * ny);
    const clampX = (c: number) => Math.max(0, Math.min(nx - 1, c));
    const clampY = (c: number) => Math.max(0, Math.min(ny - 1, c));

    // Furniture: block cells whose center is inside the (rotated) footprint
    // inflated by PERSON_R. Skip rugs (they ARE floor), stairs/landings
    // (walkable terrain), and pieces lifted ≥ 300 mm off the floor (wall-hung /
    // counter-top items don't obstruct the body). A counter at elevation 0 with
    // a 900 mm top still blocks — the test is whether the PIECE is raised, not
    // its height.
    const furniture = furnitureOn === null ? [] : (f.furniture ?? []);
    for (const fu of furniture) {
      const def = resolveFurnitureDef(fu, customObjects);
      if (def.rug) continue;
      if (fu.kind === 'stairs' || fu.kind === 'stairs_half' || fu.kind === 'stair_landing') continue;
      if ((fu.elevation ?? 0) >= 300) continue;
      const halfW = fu.w / 2 + PERSON_R, halfH = fu.h / 2 + PERSON_R;
      // AABB of the inflated footprint (rotation-agnostic: the max extent is
      // the diagonal), used only to bound the cell scan.
      const reach = Math.hypot(halfW, halfH);
      const c0x = clampX(Math.floor((fu.x - reach) / cell));
      const c1x = clampX(Math.floor((fu.x + reach) / cell));
      const c0y = clampY(Math.floor((fu.y - reach) / cell));
      const c1y = clampY(Math.floor((fu.y + reach) / cell));
      for (let cy = c0y; cy <= c1y; cy++) {
        for (let cx = c0x; cx <= c1x; cx++) {
          const wx = (cx + 0.5) * cell, wy = (cy + 0.5) * cell;
          const l = furnitureWorldToLocal(fu.rotation, wx - fu.x, wy - fu.y);
          if (Math.abs(l.x) <= halfW && Math.abs(l.y) <= halfH) blocked[cy * nx + cx] = 1;
        }
      }
    }

    // Walls: rasterize each solid run of every non-invisible segment as a thick
    // capsule (half-thickness 50 mm + PERSON_R). Door / window OPENINGS stay
    // walkable — people walk through doorways, and radar can track a person
    // straight through a window, so blocking a ~900 mm window gap that sits
    // next to an open doorway would strand paths worse than letting it pass.
    // railing / half walls are full-height at body level → they block.
    const WALL_HALF = 100 / 2;
    const rad = WALL_HALF + PERSON_R;
    for (const wall of f.walls ?? []) {
      if (wall.points.length < 2) continue;
      if (wallKind(wall) === 'invisible') continue;
      for (let i = 0; i < wall.points.length - 1; i++) {
        const a = wall.points[i], b = wall.points[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) continue;
        const ux = dx / len, uy = dy / len;
        const { solids } = wallCutsForSegment(a, b, f.doors ?? [], f.windows ?? []);
        for (const s of solids) {
          const s0x = a.x + ux * s.t0, s0y = a.y + uy * s.t0;
          const s1x = a.x + ux * s.t1, s1y = a.y + uy * s.t1;
          const minx = Math.min(s0x, s1x) - rad, maxx = Math.max(s0x, s1x) + rad;
          const miny = Math.min(s0y, s1y) - rad, maxy = Math.max(s0y, s1y) + rad;
          const c0x = clampX(Math.floor(minx / cell)), c1x = clampX(Math.floor(maxx / cell));
          const c0y = clampY(Math.floor(miny / cell)), c1y = clampY(Math.floor(maxy / cell));
          for (let cy = c0y; cy <= c1y; cy++) {
            for (let cx = c0x; cx <= c1x; cx++) {
              const wx = (cx + 0.5) * cell, wy = (cy + 0.5) * cell;
              // Distance from cell center to the solid run segment.
              const t = Math.max(s.t0, Math.min(s.t1, (wx - a.x) * ux + (wy - a.y) * uy));
              const px = a.x + ux * t, py = a.y + uy * t;
              if (Math.hypot(wx - px, wy - py) <= rad) blocked[cy * nx + cx] = 1;
            }
          }
        }
      }
    }

    let blockedCount = 0;
    for (let i = 0; i < blocked.length; i++) if (blocked[i]) blockedCount++;
    this._nav = { cell, nx, ny, blocked, rev: ++this._navRev, blockedCount };
  }

  // World point → grid index (clamped into range).
  private _cellIdxOf(wx: number, wy: number): number {
    const n = this._nav!;
    const cx = Math.max(0, Math.min(n.nx - 1, Math.floor(wx / n.cell)));
    const cy = Math.max(0, Math.min(n.ny - 1, Math.floor(wy / n.cell)));
    return cy * n.nx + cx;
  }

  // Grid index → scene coords of the cell center (inverse of _w on the center).
  private _cellToScene(idx: number): { x: number; z: number } {
    const n = this._nav!;
    const cx = idx % n.nx, cy = (idx / n.nx) | 0;
    const wx = (cx + 0.5) * n.cell, wy = (cy + 0.5) * n.cell;
    return { x: this._fw / 2 - wx, z: wy - this._fd / 2 };
  }

  // Is the cell containing this world point blocked (out-of-range = blocked)?
  private _blockedWorld(wx: number, wy: number): boolean {
    const n = this._nav;
    if (!n) return false;
    const cx = Math.floor(wx / n.cell), cy = Math.floor(wy / n.cell);
    if (cx < 0 || cy < 0 || cx >= n.nx || cy >= n.ny) return true;
    return n.blocked[cy * n.nx + cx] === 1;
  }

  // Line-of-sight between two WORLD points: sample the segment at ≤ half-cell
  // steps and reject if any sample lands in a blocked cell. Half-cell (75 mm)
  // sampling can't tunnel — the thinnest blocked span is a wall run (≥ 340 mm)
  // or an inflated footprint (≥ 340 mm), both several samples wide.
  private _losClearWorld(ax: number, ay: number, bx: number, by: number): boolean {
    const n = this._nav;
    if (!n) return true;
    const dx = bx - ax, dy = by - ay;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / (n.cell * 0.5)));
    for (let i = 0; i <= steps; i++) {
      const wx = ax + dx * (i / steps), wy = ay + dy * (i / steps);
      if (this._blockedWorld(wx, wy)) return false;
    }
    return true;
  }

  // Nearest free cell to a blocked one via expanding ring search (≤ ~1.8 m).
  // Returns the input index if already free or nothing free is found nearby.
  private _nearestFreeCell(idx: number): number {
    const n = this._nav!;
    if (n.blocked[idx] === 0) return idx;
    const cx0 = idx % n.nx, cy0 = (idx / n.nx) | 0;
    for (let r = 1; r <= 12; r++) {
      let best = -1, bestD = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;  // ring only
          const cx = cx0 + dx, cy = cy0 + dy;
          if (cx < 0 || cy < 0 || cx >= n.nx || cy >= n.ny) continue;
          const i = cy * n.nx + cx;
          if (n.blocked[i]) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
      }
      if (best >= 0) return best;
    }
    return idx;
  }

  // 8-connected A* over the nav grid (no corner cutting: a diagonal step needs
  // both shared orthogonal cells free; octile heuristic). Returns the cell-index
  // path start→goal, or null if unreachable within the explored-node cap.
  private _aStar(start: number, goal: number): number[] | null {
    const n = this._nav!;
    const { nx, ny, blocked } = n;
    const N = nx * ny;
    if (start === goal) return [start];
    const g = new Float64Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const SQRT2 = Math.SQRT2, D2 = SQRT2 - 2;
    const gx = goal % nx, gy = (goal / nx) | 0;
    const heur = (idx: number) => {
      const cx = idx % nx, cy = (idx / nx) | 0;
      const ax = Math.abs(cx - gx), ay = Math.abs(cy - gy);
      return (ax + ay) + D2 * Math.min(ax, ay);
    };
    // Binary min-heap keyed on f = g + h.
    const heapIdx: number[] = [];
    const heapF: number[] = [];
    const push = (idx: number, f: number) => {
      heapIdx.push(idx); heapF.push(f);
      let c = heapIdx.length - 1;
      while (c > 0) {
        const par = (c - 1) >> 1;
        if (heapF[par] <= heapF[c]) break;
        [heapF[par], heapF[c]] = [heapF[c], heapF[par]];
        [heapIdx[par], heapIdx[c]] = [heapIdx[c], heapIdx[par]];
        c = par;
      }
    };
    const pop = (): number => {
      const top = heapIdx[0];
      const last = heapIdx.length - 1;
      heapIdx[0] = heapIdx[last]; heapF[0] = heapF[last];
      heapIdx.pop(); heapF.pop();
      let c = 0; const len = heapIdx.length;
      while (true) {
        const l = 2 * c + 1, r = 2 * c + 2; let s = c;
        if (l < len && heapF[l] < heapF[s]) s = l;
        if (r < len && heapF[r] < heapF[s]) s = r;
        if (s === c) break;
        [heapF[s], heapF[c]] = [heapF[c], heapF[s]];
        [heapIdx[s], heapIdx[c]] = [heapIdx[c], heapIdx[s]];
        c = s;
      }
      return top;
    };
    g[start] = 0;
    push(start, heur(start));
    let expanded = 0;
    while (heapIdx.length) {
      const cur = pop();
      if (cur === goal) {
        const path: number[] = [];
        for (let i = goal; i >= 0; i = came[i]) path.push(i);
        path.reverse();
        return path;
      }
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (++expanded > 4000) return null;
      const cx = cur % nx, cy = (cur / nx) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ncx = cx + dx, ncy = cy + dy;
          if (ncx < 0 || ncy < 0 || ncx >= nx || ncy >= ny) continue;
          const ni = ncy * nx + ncx;
          if (blocked[ni] || closed[ni]) continue;
          if (dx !== 0 && dy !== 0) {
            // No corner cutting: both shared orthogonals must be free.
            if (blocked[cy * nx + ncx] || blocked[ncy * nx + cx]) continue;
          }
          const step = (dx !== 0 && dy !== 0) ? SQRT2 : 1;
          const ng = g[cur] + step;
          if (ng < g[ni]) {
            g[ni] = ng; came[ni] = cur;
            push(ni, ng + heur(ni));
          }
        }
      }
    }
    return null;
  }

  // Greedy string-pull: collapse a cell-index path to the fewest scene-coord
  // waypoints whose consecutive legs each have world-space line of sight.
  // `goalScene` overrides the final waypoint with the exact target position so
  // the figure lands precisely rather than on the goal cell's center.
  private _stringPull(cells: number[], goalScene: { x: number; z: number }): { x: number; z: number }[] {
    const sceneOf = (i: number, isLast: boolean) => isLast ? goalScene : this._cellToScene(cells[i]);
    const worldOf = (s: { x: number; z: number }) => ({ x: this._fw / 2 - s.x, y: s.z + this._fd / 2 });
    const out: { x: number; z: number }[] = [];
    let anchorScene = sceneOf(0, cells.length === 1);
    for (let i = 2; i < cells.length; i++) {
      const isLast = i === cells.length - 1;
      const cand = sceneOf(i, isLast);
      const aw = worldOf(anchorScene), cw = worldOf(cand);
      if (!this._losClearWorld(aw.x, aw.y, cw.x, cw.y)) {
        // Previous cell becomes a committed waypoint; re-anchor there.
        const prevScene = sceneOf(i - 1, false);
        out.push(prevScene);
        anchorScene = prevScene;
      }
    }
    out.push(goalScene);  // exact target as the final waypoint
    return out;
  }

  // Steer a humanoid's nav position toward the raw target this frame, routing
  // around obstacles. Chooses among: straight seek (no obstacles / direct LOS),
  // a cached path (grid + goal cell unchanged, next waypoint still reachable),
  // or a fresh A* plan. On an unreachable goal it falls back to a straight seek
  // (clip through rather than freeze). Mutates h.nav*/h.path*.
  private _steerNav(h: Humanoid, t: TargetWorld, dt: number, rawSpeedMms: number): void {
    const nav = this._nav;
    const goalP = this._w(t.x, t.y, 0);
    let goalScene = { x: goalP.x, z: goalP.z };

    // No grid, or an entirely free floor → straight-line seek, no path.
    if (!nav || nav.blockedCount === 0) {
      h.path = null; h.pathRev = -1; h.goalCell = -1;
      this._seek(h, null, goalScene, dt, rawSpeedMms);
      return;
    }

    const navWx = this._fw / 2 - h.navX, navWy = h.navZ + this._fd / 2;
    // Effective goal: if the radar drops the person inside a footprint (seated /
    // leaning), retarget to the nearest free cell so we don't chase an
    // unreachable point.
    let goalCell = this._cellIdxOf(t.x, t.y);
    if (nav.blocked[goalCell]) {
      goalCell = this._nearestFreeCell(goalCell);
      goalScene = this._cellToScene(goalCell);
    }
    const goalWx = this._fw / 2 - goalScene.x, goalWy = goalScene.z + this._fd / 2;

    // Direct line of sight → steer straight, drop any cached path.
    if (this._losClearWorld(navWx, navWy, goalWx, goalWy)) {
      h.path = null; h.pathRev = -1; h.goalCell = goalCell;
      this._seek(h, null, goalScene, dt, rawSpeedMms);
      return;
    }

    // Reuse the cached path when the grid + goal cell are unchanged and the next
    // waypoint is still directly reachable; otherwise replan with A*.
    const reusable = h.path && h.path.length > 0 && h.pathRev === nav.rev &&
      h.goalCell === goalCell &&
      this._losClearWorld(navWx, navWy,
        this._fw / 2 - h.path[0].x, h.path[0].z + this._fd / 2);
    if (!reusable) {
      const navCell = this._nearestFreeCell(this._cellIdxOf(navWx, navWy));
      const cells = this._aStar(navCell, goalCell);
      if (cells && cells.length > 1) {
        h.path = this._stringPull(cells, goalScene);
        h.pathRev = nav.rev; h.goalCell = goalCell;
      } else {
        // Unreachable within the node cap → straight seek fallback.
        h.path = null; h.pathRev = -1; h.goalCell = goalCell;
        this._seek(h, null, goalScene, dt, rawSpeedMms);
        return;
      }
    }
    this._seek(h, h.path, goalScene, dt, rawSpeedMms);
  }

  // Advance h.nav* toward the next waypoint (or the goal when no path) at a
  // speed tracking the target's real motion, with a distance catch-up term so a
  // figure that detoured can close the gap. Consumes reached waypoints (≤ 120
  // mm) from the (mutated) path. Uses the CLAMPED dt.
  private _seek(h: Humanoid, path: { x: number; z: number }[] | null,
                goal: { x: number; z: number }, dt: number, rawSpeedMms: number): void {
    let seek = Math.max(300, Math.min(2200, 1.15 * rawSpeedMms));
    const far = Math.hypot(h.navX - goal.x, h.navZ - goal.z);
    if (far > 1200) seek += Math.min(800, far - 1200);
    let travel = seek * dt;
    for (let guard = 0; guard < 16 && travel > 1e-3; guard++) {
      while (path && path.length &&
             Math.hypot(path[0].x - h.navX, path[0].z - h.navZ) <= 120) path.shift();
      const wp = (path && path.length) ? path[0] : goal;
      const dxw = wp.x - h.navX, dzw = wp.z - h.navZ;
      const d = Math.hypot(dxw, dzw);
      if (d < 1e-3) break;
      if (d <= travel) {
        h.navX = wp.x; h.navZ = wp.z; travel -= d;
        if (path && path.length) path.shift(); else break;
      } else {
        h.navX += (dxw / d) * travel; h.navZ += (dzw / d) * travel; travel = 0;
      }
    }
  }

  // Dim floor-label sprite for a room name — quieter than the env-sensor chips
  // (no border, muted fill, smaller world size), billboarded toward the camera.
  private _makeRoomLabelSprite(text: string): THREE.Sprite {
    const label = text.toUpperCase();
    const font = '600 40px system-ui, sans-serif';
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d')!;
    ctx.font = font;
    const tw = ctx.measureText(label).width;
    const padX = 20, h = 64;
    cv.width = Math.max(4, Math.ceil(tw + padX * 2));
    cv.height = h;
    ctx.font = font;  // canvas resize resets ctx state
    ctx.fillStyle = 'rgba(205,216,230,0.72)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, cv.width / 2, h / 2 + 2);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false, opacity: 0.85,
    }));
    const H = 360;  // world-mm text height — reads at room scale without dominating
    sprite.scale.set(H * (cv.width / cv.height), H, 1);
    return sprite;
  }

  // Doors + windows live in their own group so floor geometry doesn't churn
  // when only a door/window entity state flips (and vice versa).
  updateDoorsWindows(doors: Door[], windows: WindowType[],
                     stateProvider: StateProvider): void {
    if (!this._scene) return;
    this._clearGroup(this._doorGroup);
    if (doors && doors.length) this._buildDoors(doors, stateProvider);
    if (windows && windows.length) this._buildWindows(windows, stateProvider);
  }

  private _buildWindows(windows: WindowType[], stateOf: (id: string) => HassState | null): void {
    const PANE_H = 800, PANE_T = 50, PANE_BOTTOM = 900;
    const closedMat = this._mat({
      color: 0x64b5f6, emissive: 0x1565c0, emissiveIntensity: 0.2,
      transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.1,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const openMat = this._mat({
      color: 0x66bb6a, emissive: 0x1b5e20, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.45, roughness: 0.3, metalness: 0.1,
      side: THREE.DoubleSide, depthWrite: false,
    });
    for (const w of windows) {
      const st = w.entity_id ? stateOf(w.entity_id) : null;
      const isOpen = st?.state === 'on';
      const mat = isOpen ? openMat : closedMat;
      // Pane center group at (w.x, w.y); rotation matches wall axis.
      const grp = new THREE.Group();
      const wp = this._w(w.x, w.y, 0);
      grp.position.set(wp.x, wp.y, wp.z);
      grp.rotation.y = -((w.rotation || 0) * Math.PI / 180);
      const pane = new THREE.Mesh(
        new THREE.BoxGeometry(w.w, PANE_H, PANE_T),
        mat,
      );
      pane.position.set(0, PANE_BOTTOM + PANE_H / 2, 0);
      grp.add(pane);
      // Open: tilt the pane outward (+Z scene-local = +Y world) so the
      // user can see at a glance that the window is ajar.
      if (isOpen) {
        pane.rotation.x = -Math.PI / 6;  // 30° tilt outward
        pane.position.z = PANE_T;
      }
      this._shadowFlags(grp);
      this._doorGroup.add(grp);
    }
  }

  private _buildDoors(doors: Door[], stateOf: (id: string) => HassState | null): void {
    const DOOR_H = 2000, DOOR_T = 60;
    const closedMat = this._mat({
      color: 0x90a4ae, roughness: 0.65, metalness: 0.1,
    });
    const openMat = this._mat({
      color: 0x66bb6a, emissive: 0x1b5e20, emissiveIntensity: 0.35,
      roughness: 0.5, metalness: 0.1,
    });
    for (const d of doors) {
      const st = d.entity_id ? stateOf(d.entity_id) : null;
      const isOpen = st?.state === 'on';
      const mat = isOpen ? openMat : closedMat;
      // Hinge Group at world (d.x, d.y). Closed panel runs along world +X at
      // rotation 0; world +X maps to scene -X via _w's mirror, so the panel
      // child is positioned at scene-local (-w/2, ...). Without this sign
      // flip the panel renders on the wrong side of the hinge and the open
      // swing animates in the opposite direction from the 2D plan.
      const hinge = new THREE.Group();
      const hp = this._w(d.x, d.y, 0);
      hinge.position.set(hp.x, hp.y, hp.z);
      // 2D rotation is screen-CW. In scene the X-mirror flips the sense, so
      // negate. Open swing direction depends on hinge side: right-hinge
      // swings screen-CCW (+π/2 around scene-Y); left-hinge swings screen-CW
      // (-π/2). doorOpenDeltaDeg returns degrees in world screen-CW; negate
      // for scene-Y rotation.
      const rotR = -((d.rotation || 0) * Math.PI / 180);
      const openR = isOpen ? -(doorOpenDeltaDeg(d) * Math.PI / 180) : 0;
      hinge.rotation.y = rotR + openR;

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(d.w, DOOR_H, DOOR_T),
        mat,
      );
      panel.position.set(-d.w / 2, DOOR_H / 2, 0);
      hinge.add(panel);
      this._addOutlines(hinge);
      this._doorGroup.add(hinge);
    }
  }

  // Build one furniture group at world (fu.x, fu.y). Local +Z = world +Y
  // (the "front" / backrest side for kinds that have one). `rotation` is
  // screen-CW degrees in the 2D plan; in scene space we negate it because
  // _w mirrors world +X.
  private _buildFurniture(fu: { x: number; y: number; w: number; h: number;
                                 kind?: import('./types.js').FurnitureKind;
                                 rotation?: number; elevation?: number;
                                 customKindId?: string },
                          neighbors?: Furniture[],
                          customObjects?: ObjectRecipe[]): THREE.Group {
    const recipe = fu.customKindId ? customObjects?.find(o => o.id === fu.customKindId) : undefined;
    const def = recipe ?? furnitureDef(fu);
    const W = fu.w, D = fu.h, HT = def.ht;
    const tint = def.color;
    // Opaque PBR materials. Furniture used to be ~55% transparent, which read
    // as ghostly and produced depth-sort artifacts; with the scene environment
    // map (see _init) opaque standard materials pick up soft reflections and
    // look far more physical for zero per-frame cost.
    const wood = this._mat({
      color: tint, metalness: 0.05, roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const dark = this._mat({
      color: 0x2b1d18, roughness: 0.8, metalness: 0.05,
    });
    const cushion = this._mat({
      color: tint, roughness: 0.95, metalness: 0.0,
    });
    const pillow = this._mat({
      color: 0xeceff1, roughness: 0.9, metalness: 0.0,
    });
    const steel = this._mat({
      color: tint, metalness: 0.75, roughness: 0.3,
    });
    const porcelain = this._mat({
      color: 0xf5f5f0, metalness: 0.0, roughness: 0.15,
    });
    const screen = this._mat({
      color: 0x0a0d12, metalness: 0.4, roughness: 0.12,
    });
    const glass = this._mat({
      color: 0xd7e5ea, metalness: 0.1, roughness: 0.05,
      transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide,
    });
    const leaf = this._mat({
      color: 0x4c8c2b, roughness: 0.9, metalness: 0.0,
    });

    const grp = new THREE.Group();
    const center = this._w(fu.x, fu.y, 0);
    grp.position.set(center.x, center.y + (fu.elevation ?? 0), center.z);
    grp.rotation.y = -((fu.rotation || 0) * Math.PI / 180);

    const addBox = (sx: number, sy: number, sz: number, mat: THREE.Material,
                    px: number, py: number, pz: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
      m.position.set(px, py, pz);
      grp.add(m);
      return m;
    };
    const addCyl = (rTop: number, rBot: number, hgt: number, mat: THREE.Material,
                    px: number, py: number, pz: number, radial = 16) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, hgt, radial), mat);
      m.position.set(px, py, pz);
      grp.add(m);
      return m;
    };

    // A well face is left OPEN when another sunken stair-family piece
    // adjoins it (flight → landing → flight compositions must connect, not
    // brick each other over). Probes a point just beyond the face center.
    const faceOpen = (lxOff: number, lyOff: number): boolean => {
      if (!neighbors) return false;
      const wpt = furnitureLocalToWorld(fu.rotation, lxOff, lyOff);
      const px = fu.x + wpt.x, py = fu.y + wpt.y;
      return neighbors.some(nb => {
        if (nb.x === fu.x && nb.y === fu.y && nb.w === fu.w && nb.h === fu.h &&
            nb.kind === fu.kind && nb.rotation === fu.rotation) return false;
        if (!(nb.kind === 'stairs' || nb.kind === 'stairs_half' || nb.kind === 'stair_landing')) return false;
        if ((nb.elevation ?? 0) >= 0) return false;
        const l = furnitureWorldToLocal(nb.rotation, px - nb.x, py - nb.y);
        return Math.abs(l.x) <= nb.w / 2 + 60 && Math.abs(l.y) <= nb.h / 2 + 60;
      });
    };

    const kind = fu.kind ?? 'block';
    // Custom object recipes build from their generic primitive list, then get
    // the SAME Sims dressing (outlines + blob) as built-in kinds below.
    if (recipe) this._buildFromRecipe(grp, recipe);
    else switch (kind) {
      case 'rug':
        addBox(W, HT, D, wood, 0, HT / 2, 0);
        break;
      case 'table':
      case 'desk': {
        const topT = 50;
        addBox(W, topT, D, wood, 0, HT - topT / 2, 0);
        // Apron rails under the top connect the legs — reads as real joinery.
        const apronH = 90, apronY = HT - topT - apronH / 2;
        addBox(W - 120, apronH, 24, dark, 0, apronY, D / 2 - 60);
        addBox(W - 120, apronH, 24, dark, 0, apronY, -(D / 2 - 60));
        addBox(24, apronH, D - 120, dark, W / 2 - 60, apronY, 0);
        addBox(24, apronH, D - 120, dark, -(W / 2 - 60), apronY, 0);
        // 4 slightly tapered legs
        const legT = 55, legH = HT - topT;
        const xo = W / 2 - legT / 2 - 15, zo = D / 2 - legT / 2 - 15;
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
          addBox(legT, legH, legT, dark, sx * xo, legH / 2, sz * zo);
        }
        break;
      }
      case 'chair':
      case 'rocking_chair': {
        const seatT = 60, seatY = (def.seat ?? 450) - seatT / 2;
        addBox(W, seatT, D, cushion, 0, seatY, 0);
        // Backrest on +Z side.
        const backT = 60, backH = HT - (def.seat ?? 450);
        addBox(W, backH, backT, cushion, 0, (def.seat ?? 450) + backH / 2, D / 2 - backT / 2);
        // Legs (or rockers).
        if (kind === 'rocking_chair') {
          // Curved rocker: 2 thin curved boxes along X.
          const rockY = 30, rockH = 60;
          addBox(W * 0.85, rockH, 40, dark, 0, rockY, -D / 2 + 30);
          addBox(W * 0.85, rockH, 40, dark, 0, rockY, D / 2 - 30);
        } else {
          const legT = 50, legH = (def.seat ?? 450) - seatT;
          const xo = W / 2 - legT / 2, zo = D / 2 - legT / 2;
          for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
            addBox(legT, legH, legT, dark, sx * xo, legH / 2, sz * zo);
          }
        }
        break;
      }
      case 'chaise': {
        const seatT = 80, seatY = (def.seat ?? 400) - seatT / 2;
        addBox(W, seatT, D, cushion, 0, seatY, 0);
        // Low back at one end (head end = -X side); backrest depth = D, height ~ HT - seat.
        const backH = HT - (def.seat ?? 400), backW = W * 0.30;
        addBox(backW, backH, D, cushion, -W / 2 + backW / 2, (def.seat ?? 400) + backH / 2, 0);
        // Legs hidden by skirt — single low base plate.
        addBox(W * 0.95, seatY, D * 0.95, dark, 0, seatY / 2, 0);
        break;
      }
      case 'bench': {
        const seatT = 70;
        addBox(W, seatT, D, cushion, 0, HT - seatT / 2, 0);
        const legT = 60, legH = HT - seatT;
        const xo = W / 2 - legT, zo = D / 2 - legT / 2;
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
          addBox(legT, legH, legT, dark, sx * xo, legH / 2, sz * zo);
        }
        break;
      }
      case 'sofa_l_left':
      case 'sofa_l_right':
      case 'sofa_u': {
        // Sectionals: back band + main seat along +Z (the back), return
        // arm(s) reaching toward the front (-Z). Plan-left = local -X.
        const seatH2 = def.seat ?? 450;
        const seatT = 100, seatY = seatH2 - seatT / 2;
        const backH = HT - seatH2, backT = 220;
        const mainD = Math.min(950, D * 0.5);
        const retW = Math.min(950, W * (kind === 'sofa_u' ? 0.3 : 0.35));
        const retD = D - mainD, retZ = -mainD / 2;
        addBox(W, backH, backT, cushion, 0, seatH2 + backH / 2, D / 2 - backT / 2);
        addBox(W, seatT, mainD, cushion, 0, seatY, D / 2 - mainD / 2);
        addBox(W, seatY - seatT / 2, mainD * 0.95, dark, 0, (seatY - seatT / 2) / 2, D / 2 - mainD / 2);
        const sides: number[] = kind === 'sofa_u' ? [-1, 1]
          : [kind === 'sofa_l_left' ? -1 : 1];
        for (const sx of sides) {
          addBox(retW, seatT, retD, cushion, sx * (W / 2 - retW / 2), seatY, retZ);
          addBox(retW, seatY - seatT / 2, retD * 0.95, dark, sx * (W / 2 - retW / 2), (seatY - seatT / 2) / 2, retZ);
          // Outer arm runs the FULL side — from the back band to the chaise
          // front — and rises well above the seat cushions so it reads as an
          // arm from every angle (0.62·HT barely cleared the 450 mm seat).
          addBox(180, HT * 0.78, D - backT, cushion, sx * (W / 2 - 90), HT * 0.78 / 2, -backT / 2);
        }
        // Armrest on any main-run end without a return.
        for (const sx of [-1, 1]) {
          if (sides.includes(sx)) continue;
          addBox(180, HT * 0.8, mainD, cushion, sx * (W / 2 - 90), HT * 0.8 / 2, D / 2 - mainD / 2);
        }
        break;
      }
      case 'sofa': {
        const seatH2 = def.seat ?? 450;
        const seatT = 110, seatY = seatH2 - seatT / 2;
        const armW = W * 0.08;
        // Plinth sits BETWEEN the armrests — a full-width plinth put its side
        // faces exactly coplanar with the armrest outer faces (dark vs
        // cushion z-fight, invisible under PBR, ugly hatching under toon).
        addBox(W - armW * 2, seatY - seatT / 2, D * 0.96, dark, 0, (seatY - seatT / 2) / 2, 0);
        addBox(W, seatT, D, cushion, 0, seatY, 0);
        // Seat cushion seams (one per ~700 mm of width).
        const seamMat = this._mat({ color: 0x1f262b, roughness: 0.95 });
        const nCush = Math.max(2, Math.round(W / 700));
        for (let k = 1; k < nCush; k++) {
          addBox(12, seatT * 0.5, D * 0.9, seamMat, -W / 2 + (W * k) / nCush, seatH2 - seatT * 0.2, -D * 0.02);
        }
        // Back band on +Z.
        const backH = HT - seatH2, backT = D * 0.25;
        addBox(W, backH, backT, cushion, 0, seatH2 + backH / 2, D / 2 - backT / 2);
        // Armrests on -X / +X sides.
        addBox(armW, HT * 0.85, D, cushion, -W / 2 + armW / 2, HT * 0.85 / 2, 0);
        addBox(armW, HT * 0.85, D, cushion,  W / 2 - armW / 2, HT * 0.85 / 2, 0);
        break;
      }
      case 'bed': {
        // Frame + mattress + blanket + pillows.
        addBox(W + 60, HT * 0.45, D + 60, dark, 0, HT * 0.45 / 2, 0);  // frame/box spring
        addBox(W, HT * 0.6, D, pillow, 0, HT * 0.45 + HT * 0.3, 0);   // mattress (white)
        // Blanket draped over the foot 2/3 of the bed, slightly wider AND
        // slightly proud of the mattress foot face — a shared front plane
        // z-fought (white vs tint) under flat toon shading.
        const blanket = this._mat({ color: tint, roughness: 0.95 });
        const blD = D * 0.62 + 30;
        const bl = new THREE.Mesh(new THREE.BoxGeometry(W + 20, 60, blD), blanket);
        bl.position.set(0, HT * 0.45 + HT * 0.6 - 10, -D / 2 - 30 + blD / 2);
        grp.add(bl);
        // Headboard on +Z side.
        const hbH = 800, hbT = 60;
        addBox(W, hbH, hbT, dark, 0, hbH / 2, D / 2 + hbT / 2);
        // Two pillows.
        const pw = W * 0.42, pd = D * 0.18, ph = 90;
        addBox(pw, ph, pd, pillow, -W * 0.22, HT * 1.05 + ph / 2, D / 2 - pd / 2 - 50);
        addBox(pw, ph, pd, pillow,  W * 0.22, HT * 1.05 + ph / 2, D / 2 - pd / 2 - 50);
        break;
      }
      case 'bookshelf': {
        // Open shelving: side panels + back + real shelf boards (not a
        // solid slab with painted lines).
        const panelT = 25;
        addBox(panelT, HT, D, wood, -W / 2 + panelT / 2, HT / 2, 0);
        addBox(panelT, HT, D, wood, W / 2 - panelT / 2, HT / 2, 0);
        addBox(W, HT, panelT, wood, 0, HT / 2, D / 2 - panelT / 2);  // back (+Z)
        addBox(W, panelT, D, wood, 0, HT - panelT / 2, 0);           // top
        const inner2 = W - panelT * 2;
        for (const t of [0.02, 0.25, 0.5, 0.75]) {
          addBox(inner2, 22, D * 0.94, wood, 0, Math.max(12, HT * t), 0);
        }
        break;
      }
      case 'stairs':
      case 'stairs_half': {
        // Solid stacked steps rising toward local +Z (the plan-top). Tread
        // count follows the run depth (~280 mm treads); riser = HT / n.
        const n = Math.max(3, Math.round(D / 280));
        const riser = HT / n, treadD = D / n;
        const treadMat = this._mat({ color: 0xa1887f, roughness: 0.6 });
        for (let i = 0; i < n; i++) {
          const hStep = riser * (i + 1);
          addBox(W, hStep, treadD, wood, 0, hStep / 2, -D / 2 + (i + 0.5) * treadD);
          // Tread cap for a visible nosing line.
          addBox(W, 22, treadD, treadMat, 0, hStep - 11, -D / 2 + (i + 0.5) * treadD);
        }
        // Sunk below the floor (descending flight): line the stairwell with
        // dark shaft walls up to floor level so the opening reads as a well.
        if ((fu.elevation ?? 0) < 0) {
          const shaftMat = this._mat({
            color: 0x2a2d31, roughness: 0.9, side: THREE.DoubleSide,
          });
          const wellH = -(fu.elevation ?? 0);
          // Skip any face that connects to an adjoining sunken stair piece
          // (e.g. this flight's top meeting a landing) — walling it over
          // blocked the staircase.
          if (!faceOpen(-W / 2 - 150, 0)) addBox(24, wellH, D, shaftMat, -W / 2 + 12, wellH / 2, 0);
          if (!faceOpen(W / 2 + 150, 0))  addBox(24, wellH, D, shaftMat, W / 2 - 12, wellH / 2, 0);
          if (!faceOpen(0, D / 2 + 150))  addBox(W, wellH, 24, shaftMat, 0, wellH / 2, D / 2 - 12);
        }
        break;
      }
      case 'stair_landing': {
        addBox(W, HT - 40, D, wood, 0, (HT - 40) / 2, 0);
        addBox(W * 1.02, 40, D * 1.02,
               this._mat({ color: 0xa1887f, roughness: 0.6 }),
               0, HT - 20, 0);
        // Sunk landings line their well with shaft walls from the landing
        // surface up to floor level (same treatment as sunken stairs).
        if ((fu.elevation ?? 0) < 0) {
          const shaftMat = this._mat({
            color: 0x2a2d31, roughness: 0.9, side: THREE.DoubleSide,
          });
          const floorLvl = -(fu.elevation ?? 0);  // local y of this floor's level
          const wallH2 = Math.max(0, floorLvl - HT);
          if (wallH2 > 10) {
            // Faces adjoining sunken flights stay open (that's the path).
            if (!faceOpen(-W / 2 - 150, 0)) addBox(24, wallH2, D, shaftMat, -W / 2 + 12, HT + wallH2 / 2, 0);
            if (!faceOpen(W / 2 + 150, 0))  addBox(24, wallH2, D, shaftMat, W / 2 - 12, HT + wallH2 / 2, 0);
            if (!faceOpen(0, D / 2 + 150))  addBox(W, wallH2, 24, shaftMat, 0, HT + wallH2 / 2, D / 2 - 12);
            if (!faceOpen(0, -D / 2 - 150)) addBox(W, wallH2, 24, shaftMat, 0, HT + wallH2 / 2, -D / 2 + 12);
          }
        }
        break;
      }
      // ── casework: box body + top slab + door/drawer seams on the front
      // (front = local -Z; local +Z is the back, same side as chair backrests)
      case 'tv_stand':
      case 'dresser':
      case 'nightstand':
      case 'wardrobe':
      case 'cabinet':
      case 'counter':
      case 'island': {
        addBox(W, HT - 30, D, wood, 0, (HT - 30) / 2, 0);
        const topMat = kind === 'counter' || kind === 'island'
          ? this._mat({ color: 0xcfd8dc, roughness: 0.25, metalness: 0.05 })
          : dark;
        addBox(W * 1.02, 30, D * 1.02, topMat, 0, HT - 15, 0);
        // Proud door / drawer fronts with metal pulls on the front face
        // (-Z). Panels float 8 mm off the carcass so the gaps read as real
        // joinery lines from any angle.
        const panelMat = this._mat({ color: tint, roughness: 0.55, metalness: 0.05 });
        const pull = this._mat({ color: 0x3a444d, metalness: 0.8, roughness: 0.35 });
        const door = (cx: number, w0: number, y0: number, h0: number, handleX: number) => {
          addBox(w0, h0, 16, panelMat, cx, y0 + h0 / 2, -D / 2 - 8);
          addBox(22, Math.min(260, h0 * 0.45), 20, pull, handleX, y0 + h0 * 0.55, -D / 2 - 28);
        };
        const drawer = (y0: number, h0: number, w0 = W - 60) => {
          addBox(w0, h0, 16, panelMat, 0, y0 + h0 / 2, -D / 2 - 8);
          addBox(Math.min(w0 * 0.4, 340), 20, 20, pull, 0, y0 + h0 / 2, -D / 2 - 28);
        };
        if (kind === 'dresser' || kind === 'nightstand') {
          const n = kind === 'dresser' ? 3 : 2;
          const gap = 16, yBot = 60, yTop = HT - 60;
          const dh = (yTop - yBot - (n - 1) * gap) / n;
          for (let i = 0; i < n; i++) drawer(yBot + i * (dh + gap), dh);
        } else if (kind === 'wardrobe' || kind === 'cabinet') {
          // Double doors, pulls flanking the center split.
          const dw = W / 2 - 26, dh = HT - 130;
          door(-W / 4 + 4, dw, 50, dh, -46);
          door(W / 4 - 4, dw, 50, dh, 46);
        } else {
          // tv_stand / counter / island: a run of doors sized to the width,
          // each pull toward its right edge.
          const nd = Math.max(2, Math.round(W / 600));
          const dw = W / nd - 18;
          const yBot = kind === 'tv_stand' ? 60 : 90;
          const dh = HT - yBot - 70;
          for (let i = 0; i < nd; i++) {
            const cx = -W / 2 + (i + 0.5) * (W / nd);
            door(cx, dw, yBot, dh, cx + dw * 0.32);
          }
        }
        break;
      }
      case 'ottoman':
        addBox(W, HT, D, cushion, 0, HT / 2, 0);
        break;
      case 'stool': {
        const seatT = 50;
        addCyl(W / 2, W / 2, seatT, cushion, 0, HT - seatT / 2, 0);
        addCyl(35, 35, HT - seatT, dark, 0, (HT - seatT) / 2, 0, 10);
        addCyl(W / 2.6, W / 2.6, 25, dark, 0, 14, 0);
        break;
      }
      case 'plant': {
        const potH = HT * 0.28;
        addCyl(W * 0.32, W * 0.24, potH, this._mat({ color: 0x8d5524, roughness: 0.8 }), 0, potH / 2, 0, 12);
        const s1 = new THREE.Mesh(new THREE.SphereGeometry(W * 0.42, 10, 8), leaf);
        s1.position.set(0, HT * 0.7, 0); grp.add(s1);
        const s2 = new THREE.Mesh(new THREE.SphereGeometry(W * 0.3, 10, 8), leaf);
        s2.position.set(W * 0.2, HT * 0.5, -W * 0.12); grp.add(s2);
        const s3 = new THREE.Mesh(new THREE.SphereGeometry(W * 0.26, 10, 8), leaf);
        s3.position.set(-W * 0.2, HT * 0.55, W * 0.1); grp.add(s3);
        break;
      }
      // ── appliances (front = -Z) ──
      case 'fridge': {
        addBox(W, HT, D, steel, 0, HT / 2, 0);
        const seam = this._mat({ color: 0x546069, roughness: 0.6 });
        addBox(W * 0.96, 10, 6, seam, 0, HT * 0.65, -D / 2 - 2);           // freezer split
        addBox(24, HT * 0.28, 20, seam, -W * 0.32, HT * 0.42, -D / 2 - 14); // handle
        addBox(24, HT * 0.2, 20, seam, -W * 0.32, HT * 0.82, -D / 2 - 14);  // freezer handle
        break;
      }
      case 'stove': {
        addBox(W, HT - 40, D, steel, 0, (HT - 40) / 2, 0);
        addBox(W, 40, D, screen, 0, HT - 20, 0);  // dark cooktop
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
          addCyl(W * 0.14, W * 0.14, 8, dark, sx * W * 0.22, HT + 4, sz * D * 0.2, 20);
        }
        const seam = this._mat({ color: 0x546069, roughness: 0.6 });
        addBox(W * 0.9, 12, 6, seam, 0, HT * 0.55, -D / 2 - 2);  // oven door
        break;
      }
      case 'dishwasher': {
        addBox(W, HT, D, steel, 0, HT / 2, 0);
        const seam = this._mat({ color: 0x546069, roughness: 0.6 });
        addBox(W * 0.94, 10, 6, seam, 0, HT * 0.86, -D / 2 - 2);  // control strip
        addBox(W * 0.7, 20, 14, seam, 0, HT * 0.74, -D / 2 - 8);  // handle bar
        break;
      }
      case 'washer':
      case 'dryer': {
        addBox(W, HT, D, porcelain, 0, HT / 2, 0);
        // Porthole door on the front face.
        const door = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.3, W * 0.3, 24, 24), screen);
        door.rotation.x = Math.PI / 2;
        door.position.set(0, HT * 0.45, -D / 2 - 10);
        grp.add(door);
        addBox(W * 0.9, HT * 0.1, 8, screen, 0, HT * 0.92, -D / 2 - 3);  // controls
        break;
      }
      case 'microwave': {
        addBox(W, HT, D, screen, 0, HT / 2, 0);
        addBox(W * 0.62, HT * 0.7, 6, glass, -W * 0.12, HT / 2, -D / 2 - 3);
        break;
      }
      case 'tv': {
        const standH = 300;
        const panel = addBox(W, HT - standH, 45, screen, 0, standH + (HT - standH) / 2, 0);
        panel.castShadow = true;
        addCyl(40, 60, standH, dark, 0, standH / 2, 0, 10);
        addBox(W * 0.4, 24, D, dark, 0, 12, 0);  // base plate
        break;
      }
      // ── bathroom (front = -Z; toilet tank sits at the back +Z) ──
      case 'toilet': {
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.42, W * 0.3, 380, 18), porcelain);
        bowl.scale.z = 1.25;
        bowl.position.set(0, 190, -D * 0.12);
        grp.add(bowl);
        addCyl(W * 0.46, W * 0.44, 50, porcelain, 0, 420, -D * 0.12, 18);  // seat
        addBox(W * 0.96, 360, D * 0.28, porcelain, 0, HT - 180, D / 2 - D * 0.14);  // tank
        break;
      }
      case 'sink': {
        addCyl(70, 90, HT - 120, porcelain, 0, (HT - 120) / 2, 0, 12);   // pedestal
        addCyl(W * 0.48, W * 0.34, 130, porcelain, 0, HT - 65, 0, 18);   // basin
        break;
      }
      case 'bathtub': {
        addBox(W, HT, D, porcelain, 0, HT / 2, 0);
        const water = this._mat({
          color: 0x9bc7cf, roughness: 0.2, metalness: 0.05,
        });
        addBox(W * 0.82, 20, D * 0.72, water, 0, HT - 60, 0);  // inner basin hint
        break;
      }
      case 'shower': {
        addBox(W, 80, D, porcelain, 0, 40, 0);  // base pan
        // Glass on the two front-facing sides (leave back corner walls open).
        addBox(W, HT - 80, 12, glass, 0, 80 + (HT - 80) / 2, -D / 2 + 6);
        addBox(12, HT - 80, D, glass, -W / 2 + 6, 80 + (HT - 80) / 2, 0);
        const headArm = this._mat({ color: 0xb9c2c9, metalness: 0.8, roughness: 0.3 });
        addCyl(12, 12, 250, headArm, W * 0.3, HT - 200, D * 0.3, 8);
        const head = new THREE.Mesh(new THREE.SphereGeometry(55, 12, 10), headArm);
        head.position.set(W * 0.3, HT - 320, D * 0.3);
        grp.add(head);
        break;
      }
      // ── extra appliances (front = -Z) ──
      case 'coffee_maker': {
        const bodyD = D * 0.55;
        addBox(W, 28, D, dark, 0, 14, 0);                                       // base slab
        addBox(W, HT - 28, bodyD, wood, 0, 28 + (HT - 28) / 2, D / 2 - bodyD / 2);  // upright body at back
        addBox(W * 0.9, 30, D * 0.42, wood, 0, HT - 15, -D * 0.04);             // brew head over the carafe
        addCyl(W * 0.26, W * 0.3, HT * 0.42, glass, 0, 28 + HT * 0.21, -D * 0.12, 12);  // glass carafe
        break;
      }
      case 'toaster': {
        addBox(W, HT, D, steel, 0, HT / 2, 0);                       // chrome body
        const slotW = W * 0.34, slotD = D * 0.5;
        addBox(slotW, 16, slotD, dark, -W * 0.18, HT + 2, 0);        // two bread slots on top
        addBox(slotW, 16, slotD, dark,  W * 0.18, HT + 2, 0);
        addBox(46, HT * 0.4, 28, dark, W / 2 - 4, HT * 0.42, D * 0.18);  // side lever
        break;
      }
      case 'exercise_equipment': {
        // Treadmill: raised running deck + side rails, uprights + console at
        // the front (-Z), matching the appliance front-faces-camera convention.
        const deckT = 80, deckD = D * 0.72, deckZ = D * 0.12;
        addBox(W, deckT, deckD, dark, 0, 30 + deckT / 2, deckZ);               // deck body
        addBox(W * 0.82, 22, deckD * 0.94, screen, 0, 30 + deckT - 5, deckZ);  // dark running belt
        const railT = 70, railH = 130;
        addBox(railT, railH, deckD, steel, -W / 2 + railT / 2, 30 + deckT + railH / 2 - 6, deckZ);
        addBox(railT, railH, deckD, steel,  W / 2 - railT / 2, 30 + deckT + railH / 2 - 6, deckZ);
        const upH = HT, upZ = -D / 2 + 90;
        addCyl(35, 35, upH, steel, -W / 2 + 70, upH / 2, upZ, 10);             // uprights
        addCyl(35, 35, upH, steel,  W / 2 - 70, upH / 2, upZ, 10);
        addBox(W - 90, 55, 70, steel, 0, upH - 40, upZ + 40);                  // handlebar
        addBox(W * 0.66, HT * 0.28, 55, screen, 0, upH, upZ + 70);            // console
        break;
      }
      default:
        addBox(W, HT, D, wood, 0, HT / 2, 0);
    }

    // Sims dressing: cartoon outline shells on the main body meshes, plus a
    // soft blob shadow under anything that actually sits on the floor.
    // Rugs / stairs read wrong with a blob (they ARE floor), and elevated
    // pieces (counter-top appliances, sunken stairs) don't touch it.
    this._addOutlines(grp);
    const onFloor = !def.rug &&
      kind !== 'stairs' && kind !== 'stairs_half' && kind !== 'stair_landing' &&
      Math.abs(fu.elevation ?? 0) < 100;
    if (onFloor) {
      const blob = this._blobShadow(W / 2 * 1.12 + 60, D / 2 * 1.12 + 60);
      blob.position.y = 8 - (fu.elevation ?? 0);
      grp.add(blob);
    }
    return grp;
  }

  // Generic recipe builder: each primitive → a toon-material mesh. Size units
  // are per-shape (box [w,ht,d]; cylinder [rTop,rBot,ht]; sphere [r,_,_];
  // cone [r,ht,_]); pos/rot are local mm / deg. The caller applies the shared
  // Sims dressing (outlines + blob) afterward, same as the built-in kinds.
  private _buildFromRecipe(grp: THREE.Group, recipe: ObjectRecipe): void {
    const d2r = (d: number) => d * Math.PI / 180;
    for (const prim of recipe.primitives) {
      const [a, b, c] = prim.size;
      let geo: THREE.BufferGeometry;
      switch (prim.shape) {
        case 'cylinder': geo = new THREE.CylinderGeometry(a, b, c, 14); break;
        case 'sphere':   geo = new THREE.SphereGeometry(a, 12, 10); break;
        case 'cone':     geo = new THREE.ConeGeometry(a, b, 14); break;
        case 'box':
        default:         geo = new THREE.BoxGeometry(a, b, c); break;
      }
      const m = new THREE.Mesh(geo, this._mat({ color: hexToInt(prim.color ?? '#8a8a8a') }));
      m.position.set(prim.pos[0], prim.pos[1], prim.pos[2]);
      if (prim.rot) m.rotation.set(d2r(prim.rot[0]), d2r(prim.rot[1]), d2r(prim.rot[2]));
      grp.add(m);
    }
  }

  // poseProvider gives per-sensor mount height (mm above floor) and mount
  // angle (tilt degrees, +ve = front tilts down) from HA. If null, falls
  // back to defaults (height = 40 mm above floor, tilt = 0).
  updateSensors(
    sensors: Sensor[],
    poseProvider?: (s: Sensor) => { height: number; tilt: number } | null,
    showCoverage = true,
  ): void {
    if (!this._scene) return;
    this._clearGroup(this._sensorGroup);
    for (const s of sensors) {
      const pose = poseProvider ? poseProvider(s) : null;
      const heightMm = pose?.height ?? 40;
      const tiltDeg = pose?.tilt ?? 0;

      // Group composes heading (around world Y) with tilt (around local X).
      // Mesh dimensions: 180×80×60 (X=width, Y=height, Z=depth/forward).
      const grp = new THREE.Group();
      const p = this._w(s.x, s.y, heightMm);
      grp.position.set(p.x, p.y, p.z);
      grp.rotation.y = -(s.heading || 0) * Math.PI / 180;

      // Tilt: positive `mountAngle` means the sensor points downward. After
      // `grp.rotation.y`, local +Z faces the heading direction. Rotating the
      // child about its X axis by `-tilt` pitches the front (Z) downward.
      const tiltGrp = new THREE.Group();
      tiltGrp.rotation.x = -tiltDeg * Math.PI / 180;
      grp.add(tiltGrp);

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(180, 80, 60),
        this._mat({ color: 0x42a5f5, emissive: 0x0a2340 }),
      );
      tiltGrp.add(mesh);

      // Small forward-pointing nub so heading + tilt are obvious in 3D.
      const nub = new THREE.Mesh(
        new THREE.ConeGeometry(20, 60, 8),
        this._mat({ color: 0xbbdefb, emissive: 0x0a2340 }),
      );
      nub.rotation.x = Math.PI / 2;  // cone tip → +Z
      nub.position.set(0, 0, 70);    // just in front of the box face
      tiltGrp.add(nub);

      this._sensorGroup.add(grp);

      if (!showCoverage) continue;
      // Coverage wedge — flat floor decal mirroring the 2D Cov toggle, with
      // a brighter rim for definition. Same 2D-canvas-angle → shape-space
      // mapping as the motion-sensor cone in updateMotionSensors: canvas
      // angle a gives world offset (cos a, −sin a); the shape is rotated
      // −π/2 about X and _w mirrors X, so shape coords are (−dx, dy).
      const fovRad = (s.fov * Math.PI) / 180;
      const base = -Math.PI / 2 + ((s.heading || 0) * Math.PI) / 180;
      const segs = Math.max(12, Math.round((s.fov / 360) * 64));
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      const rimPts: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
      for (let i = 0; i <= segs; i++) {
        const a = base - fovRad / 2 + fovRad * (i / segs);
        const dx = Math.cos(a) * s.range, dy = Math.sin(a) * s.range;
        shape.lineTo(-dx, dy);
        rimPts.push(new THREE.Vector3(-dx, dy, 0));
      }
      shape.lineTo(0, 0);
      const wedge = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        // Basic (unlit) material so the wedge stays visible in the night preset.
        new THREE.MeshBasicMaterial({
          color: 0x4fc3f7, transparent: true, opacity: 0.12,
          side: THREE.DoubleSide, depthWrite: false,
        }));
      const rim = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(rimPts),
        new THREE.LineBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.55 }));
      const fp = this._w(s.x, s.y, 0);
      for (const o of [wedge, rim]) {
        o.rotation.x = -Math.PI / 2;          // lay the XY shape flat on the floor
        o.position.set(fp.x, 12, fp.z);       // few mm up to avoid z-fighting the floor
        this._sensorGroup.add(o);
      }
    }
  }

  updateMotionSensors(motions: MotionSensor[], stateProvider: StateProvider, showZones = true): void {
    if (!this._scene) return;
    this._clearGroup(this._motionGroup);
    const CONE_H = 1500;  // cone reaches up from floor to ~ceiling
    for (const m of motions) {
      const st = m.entity_id ? stateProvider(m.entity_id) : null;
      const isOn = st?.state === 'on';
      const baseColor = hexToInt(motionColor(m));
      const intensity = motionIntensity(m);
      const color = baseColor;
      // Body marker
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(120, 16, 12),
        this._mat({
          color, emissive: color,
          emissiveIntensity: (isOn ? 0.6 : 0.15) * intensity,
          metalness: 0.2, roughness: 0.6,
        }));
      const bp = this._w(m.x, m.y, 1700);
      body.position.set(bp.x, bp.y, bp.z);
      this._motionGroup.add(body);

      if (!showZones) continue;
      // Coverage volume — circle arc extruded vertically
      const halfFov = (m.fov * Math.PI / 180) / 2;
      const fov360 = m.fov >= 359.99;
      const segs = Math.max(12, Math.round((m.fov / 360) * 64));
      const shape = new THREE.Shape();
      const baseAng = -Math.PI / 2 + (m.heading * Math.PI / 180);
      // Convert 2D world angle to 3D group-local angle (camera +X is mirrored)
      if (!fov360) shape.moveTo(0, 0);
      const start = fov360 ? 0 : baseAng - halfFov;
      const end = fov360 ? 2 * Math.PI : baseAng + halfFov;
      for (let i = 0; i <= segs; i++) {
        const a = start + (end - start) * (i / segs);
        // 2D world angle a → ray direction (cos a, -sin a) in canvas; in world
        // mm we want (cos a, sin a) since y is up. Convert to 3D via _w.
        const dx = Math.cos(a) * m.range, dy = Math.sin(a) * m.range;
        if (i === 0 && fov360) shape.moveTo(-dx, dy);
        else                    shape.lineTo(-dx, dy);
      }
      if (!fov360) shape.lineTo(0, 0);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: CONE_H, bevelEnabled: false });
      const mat = this._mat({
        color, emissive: color,
        emissiveIntensity: (isOn ? 0.4 : 0.05) * intensity,
        transparent: true,
        opacity: Math.min(1, (isOn ? 0.3 : 0.12) * intensity),
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const cone = new THREE.Mesh(geo, mat);
      // Lay extrude shape flat on floor: extrude pulls along +Z. Rotate -PI/2
      // about X so depth points up (+Y world).
      cone.rotation.x = -Math.PI / 2;
      const p = this._w(m.x, m.y, 0);
      cone.position.set(p.x, p.y, p.z);
      this._motionGroup.add(cone);
    }
  }

  // Environmental sensors: a small emissive puck at mount height plus a
  // camera-facing value sprite (canvas-rendered text) floating above it.
  // Rebuilt only when the _keyEnv dirty key changes (bound values update at
  // sensor cadence, so rebuild churn is negligible).
  updateEnvSensors(envs: EnvSensor[], stateProvider: StateProvider): void {
    if (!this._scene) return;
    // Sprite textures aren't covered by _clearGroup's material disposal —
    // drop them explicitly or every rebuild leaks a GPU texture.
    this._disposeSpriteMaps(this._envGroup);
    this._clearGroup(this._envGroup);
    for (const e of envs) {
      const st = e.entity_id ? stateProvider(e.entity_id) : null;
      const kind = envKindOf(e, st);
      const value = st ? parseFloat(st.state) : NaN;
      const colorHex = envColor(kind, value);
      const color = hexToInt(colorHex);
      const sc = envScale(e);
      const p = this._w(e.x, e.y, envHeight(e));

      const body = new THREE.Mesh(
        new THREE.SphereGeometry(55 * sc, 14, 10),
        this._mat({
          color, emissive: color, emissiveIntensity: 0.5,
          metalness: 0.1, roughness: 0.5,
        }));
      body.position.set(p.x, p.y, p.z);
      this._envGroup.add(body);

      const text = e.entity_id ? envValueText(st) : 'unbound';
      const sprite = this._makeTextSprite(`${ENV_KINDS[kind].glyph} ${text}`, colorHex, sc);
      sprite.position.set(p.x, p.y + 170 * sc, p.z);
      this._envGroup.add(sprite);
    }
  }

  // Canvas-rendered text on a Sprite (always faces the camera). ~240 mm tall
  // in world units at scale 1; width follows the text aspect ratio. The
  // texture resolution is fixed — `scale` only stretches world size, which
  // stays sharp because the source canvas is oversampled ~3× already.
  private _makeTextSprite(text: string, accentHex: string, scale = 1): THREE.Sprite {
    const font = '500 44px system-ui, sans-serif';
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d')!;
    ctx.font = font;
    const tw = ctx.measureText(text).width;
    const padX = 26, h = 76;
    cv.width = Math.ceil(tw + padX * 2);
    cv.height = h;
    ctx.font = font;  // canvas resize resets ctx state
    ctx.beginPath();
    ctx.roundRect(2, 2, cv.width - 4, h - 4, 22);
    ctx.fillStyle = 'rgba(8,10,16,0.85)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = accentHex;
    ctx.stroke();
    ctx.fillStyle = '#f5f7fa';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cv.width / 2, h / 2 + 2);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false,
    }));
    const H = 240 * scale;
    sprite.scale.set(H * (cv.width / cv.height), H, 1);
    return sprite;
  }

  // Sprite canvas textures aren't covered by _clearGroup's material
  // disposal. Guarded on isSprite so mesh materials (floor's cached
  // procedural / bg textures) are never touched.
  private _disposeSpriteMaps(g: THREE.Group): void {
    g.traverse(o => {
      const s = o as THREE.Sprite;
      if (s.isSprite) s.material.map?.dispose();
    });
  }

  updateLightsSwitches(lights: Light[], switches: SwitchFixture[], stateProvider: StateProvider): void {
    if (!this._scene) return;
    this._fanRotors = [];  // rebuilt below; never spin disposed objects
    this._clearGroup(this._lightGroup);
    const LIGHT_BODY_R = 200;
    for (const l of lights) {
      const st = l.entity_id ? stateProvider(l.entity_id) : null;
      const isOn = st?.state === 'on';
      const attrs = (st?.attributes || {}) as Record<string, unknown>;
      const rgb = Array.isArray(attrs.rgb_color) && (attrs.rgb_color as number[]).length === 3
        ? attrs.rgb_color as number[] : null;
      const bri = typeof attrs.brightness === 'number' ? attrs.brightness as number : 255;
      const intensity = lightIntensity(l);
      const kind = lightIconKind(l);
      const lh = lightHeight(l);
      const lr = lightRadius(l);
      let r = 1, g = 0.9, b = 0.7;
      if (rgb && isOn) { r = rgb[0] / 255; g = rgb[1] / 255; b = rgb[2] / 255; }
      // Fireplace forces warm orange-red regardless of HA color, plus a
      // per-frame flicker (this builder runs every render frame).
      let flickerMul = 1;
      if (kind === 'fireplace' && isOn) {
        const f1 = 0.7 + Math.random() * 0.3;
        r = 1.0 * f1; g = 0.45 * f1; b = 0.15 * f1;
        flickerMul = 0.85 + Math.random() * 0.30;
      }
      const color = new THREE.Color(r, g, b);
      const ud = { kind: 'light', entity_id: l.entity_id, fixtureId: l.id };
      const bodyMat = this._mat({
        color: isOn ? color.getHex() : 0x444444,
        emissive: isOn ? color.getHex() : 0x111111,
        emissiveIntensity: isOn ? 0.9 * intensity * flickerMul : 0.05,
        metalness: 0.2, roughness: 0.4,
      });
      const shadeMat = this._mat({
        color: 0xeeeeee, emissive: isOn ? color.getHex() : 0x000000,
        emissiveIntensity: isOn ? 0.35 * intensity : 0.0,
        metalness: 0.1, roughness: 0.7,
        transparent: true, opacity: 0.85, side: THREE.DoubleSide,
      });
      const stemMat = this._mat({
        color: 0x222227, metalness: 0.3, roughness: 0.6,
      });
      const buildBody = (): { group: THREE.Group; bodyY: number } => {
        const g = new THREE.Group();
        let bodyY = lh;
        // Faint volumetric shaft for downlights (recessed / spot): a cone of
        // light from the fixture to its floor pool. Sells "ceiling-mounted"
        // even though rooms have no ceiling plane to recess into.
        const addShaft = (topR: number) => {
          if (!isOn || lh < 400) return;
          const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(topR, lr * 0.8, lh, 24, 1, true),
            new THREE.MeshBasicMaterial({
              color: color.getHex(), transparent: true,
              opacity: Math.min(0.16, 0.07 * intensity * (0.4 + 0.6 * (bri / 255))),
              side: THREE.DoubleSide, depthWrite: false,
            }));
          shaft.position.y = -lh / 2;
          g.add(shaft);
        };
        switch (kind) {
          case 'spot': {
            // Cylindrical housing with an emissive lens at the mouth + a
            // faint beam shaft toward the floor pool.
            const housingMat = this._mat({
              color: 0x2b2e33, roughness: 0.5, metalness: 0.5,
            });
            const housing = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 0.9, LIGHT_BODY_R * 1.05, LIGHT_BODY_R * 1.7, 20),
              housingMat,
            );
            housing.position.y = -LIGHT_BODY_R * 0.55;
            housing.userData = ud;
            g.add(housing);
            const lens = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 0.92, LIGHT_BODY_R * 0.92, 16, 20),
              bodyMat,
            );
            lens.position.y = -LIGHT_BODY_R * 1.4;
            lens.userData = ud;
            g.add(lens);
            addShaft(LIGHT_BODY_R * 0.9);
            break;
          }
          case 'pendant': {
            // Hanging sphere on a stem from ceiling (lh) to ~lh - 600.
            const stemH = 600;
            const dropY = lh - stemH;
            bodyY = dropY;
            const stem = new THREE.Mesh(
              new THREE.CylinderGeometry(20, 20, stemH, 8),
              stemMat,
            );
            // Group origin sits at dropY; stem's top reaches lh.
            stem.position.y = stemH / 2;
            g.add(stem);
            // Ceiling canopy where the stem meets the (implied) ceiling.
            const canopy = new THREE.Mesh(
              new THREE.CylinderGeometry(70, 90, 36, 16), stemMat);
            canopy.position.y = stemH - 18;
            g.add(canopy);
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R * 0.85, 16, 16),
              bodyMat,
            );
            sphere.userData = ud;
            g.add(sphere);
            break;
          }
          case 'sconce': {
            // Half-sphere on a wall backplate, flat side facing -Z (aim with
            // the rotation option so the plate sits against the wall).
            const plate = new THREE.Mesh(
              new THREE.BoxGeometry(LIGHT_BODY_R * 1.6, LIGHT_BODY_R * 2.4, 28),
              this._mat({ color: 0x8d8f94, roughness: 0.4, metalness: 0.5 }));
            plate.position.z = 40;
            plate.userData = ud;
            g.add(plate);
            const dome = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R * 1.1, 16, 12, 0, Math.PI),
              bodyMat,
            );
            dome.rotation.y = Math.PI;
            dome.userData = ud;
            g.add(dome);
            break;
          }
          case 'strip': {
            // Aluminum channel + inset emissive diffuser, sized by Length.
            const Ls = lightLength(l);
            const chanMat2 = this._mat({
              color: 0x84898f, metalness: 0.7, roughness: 0.4,
            });
            const chan2 = new THREE.Mesh(new THREE.BoxGeometry(Ls, 46, 74), chanMat2);
            chan2.userData = ud;
            g.add(chan2);
            const diff2 = new THREE.Mesh(new THREE.BoxGeometry(Ls * 0.985, 18, 56), bodyMat);
            diff2.position.y = -20;
            diff2.userData = ud;
            g.add(diff2);
            break;
          }
          case 'fireplace': {
            // Open-front firebox with a mantel and animated flames. The body
            // group's origin sits at bodyY; the front (opening) faces local
            // -Z, so the rotation option aims it. This builder reruns every
            // frame while ON (keyLights forces it), so time-based flame
            // motion animates for free — smooth sines, like the 2D hearth.
            bodyY = 500;
            const W2 = 1000, H2 = 1000, D2 = 450;   // overall firebox
            const OPEN_W = 700, OPEN_H = 620;       // front opening
            const brick = this._mat({
              color: 0x4a4442, metalness: 0.05, roughness: 0.9,
            });
            const inner = this._mat({
              color: 0x17120f, roughness: 0.95,
              emissive: isOn ? 0xff5a1a : 0x1a0d06,
              emissiveIntensity: isOn ? 0.25 * flickerMul : 0.08,
            });
            // Carcass: back slab + two side columns + header above the
            // opening, leaving the front genuinely open.
            const back = new THREE.Mesh(new THREE.BoxGeometry(W2, H2, 120), brick);
            back.position.set(0, 0, D2 / 2 - 60);
            g.add(back);
            const colW = (W2 - OPEN_W) / 2;
            for (const sx of [-1, 1]) {
              const col = new THREE.Mesh(new THREE.BoxGeometry(colW, H2, D2), brick);
              col.position.set(sx * (OPEN_W / 2 + colW / 2), 0, 0);
              g.add(col);
            }
            // Opening spans from the hearth floor top (-H2/2 + 40) up OPEN_H;
            // the header fills the rest up to the carcass top.
            const openTop = -H2 / 2 + 40 + OPEN_H;
            const headerH = H2 / 2 - openTop;
            const header = new THREE.Mesh(new THREE.BoxGeometry(OPEN_W, headerH, D2), brick);
            header.position.set(0, openTop + headerH / 2, 0);
            g.add(header);
            // Mantel shelf on top.
            const mantel = new THREE.Mesh(
              new THREE.BoxGeometry(W2 * 1.15, 70, D2 * 1.2),
              this._mat({ color: 0x5d4037, roughness: 0.6 }));
            mantel.position.set(0, H2 / 2 + 35, 0);
            g.add(mantel);
            // Firebox interior floor + back glow panel (visible through the opening).
            const hearthFloor = new THREE.Mesh(new THREE.BoxGeometry(OPEN_W, 40, D2 - 140), inner);
            hearthFloor.position.set(0, -H2 / 2 + 20, 0);
            g.add(hearthFloor);
            const glowBack = new THREE.Mesh(new THREE.PlaneGeometry(OPEN_W * 0.95, OPEN_H * 0.95), inner);
            glowBack.position.set(0, -H2 / 2 + 40 + OPEN_H / 2, D2 / 2 - 130);
            glowBack.rotation.y = Math.PI;  // face the opening (-Z)
            g.add(glowBack);
            // Logs.
            const logMat = this._mat({ color: 0x4e342e, roughness: 0.9 });
            for (const [ly, lr2, lz] of [[70, 55, -40], [150, 45, 30]] as const) {
              const log = new THREE.Mesh(new THREE.CylinderGeometry(lr2, lr2, OPEN_W * 0.7, 10), logMat);
              log.rotation.z = Math.PI / 2;
              log.position.set(0, -H2 / 2 + ly, lz);
              g.add(log);
            }
            // Flames: three emissive cones breathing/swaying on slow sines.
            if (isOn) {
              const tNow = performance.now() / 1000;
              const flames: { ox: number; r: number; h: number; om: number; ph: number; col: number }[] = [
                { ox: -180, r: 90, h: 300, om: 1.7, ph: 0.0, col: 0xe65100 },
                { ox:  170, r: 80, h: 260, om: 2.1, ph: 2.1, col: 0xef6c00 },
                { ox:    0, r: 120, h: 430, om: 1.4, ph: 4.2, col: 0xffa726 },
              ];
              for (const fl of flames) {
                const h3 = fl.h * (1 + 0.16 * Math.sin(tNow * fl.om + fl.ph)) * Math.min(1.4, intensity + 0.4);
                const sway = 30 * Math.sin(tNow * fl.om * 0.8 + fl.ph * 1.7);
                const flame = new THREE.Mesh(
                  new THREE.ConeGeometry(fl.r, h3, 10),
                  this._mat({
                    color: fl.col, emissive: fl.col,
                    emissiveIntensity: 1.6 * flickerMul,
                    transparent: true, opacity: 0.85, depthWrite: false,
                  }));
                flame.position.set(fl.ox + sway * 0.4, -H2 / 2 + 180 + h3 / 2, 0);
                flame.rotation.z = sway * 0.001;
                g.add(flame);
              }
              // Hot core.
              const coreH = 240 * (1 + 0.14 * Math.sin(tNow * 1.9 + 1.1));
              const core = new THREE.Mesh(
                new THREE.ConeGeometry(60, coreH, 8),
                this._mat({
                  color: 0xffd54f, emissive: 0xffd54f, emissiveIntensity: 2.2 * flickerMul,
                  transparent: true, opacity: 0.95, depthWrite: false,
                }));
              core.position.set(0, -H2 / 2 + 170 + coreH / 2, 0);
              g.add(core);
            }
            const hit = new THREE.Mesh(
              new THREE.BoxGeometry(W2, H2, D2),
              new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
            hit.userData = ud;
            g.add(hit);
            break;
          }
          case 'fan':
          case 'fan_light': {
            const metal = this._mat({
              color: 0x8a8f94, metalness: 0.7, roughness: 0.35,
            });
            const bladeMat = this._mat({
              color: 0x5d4037, roughness: 0.6, metalness: 0.1,
            });
            // Downrod up toward the ceiling + motor hub at the fixture height.
            const rod = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 260, 8), metal);
            rod.position.y = 170;
            g.add(rod);
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(130, 150, 90, 16), metal);
            hub.userData = ud;
            g.add(hub);
            // Rotor: 4 pitched blades on a child group the render loop spins.
            const rotor = new THREE.Group();
            rotor.position.y = -60;
            for (let k2 = 0; k2 < 4; k2++) {
              const blade = new THREE.Mesh(new THREE.BoxGeometry(620, 12, 170), bladeMat);
              blade.position.x = 620 / 2 + 90;
              blade.rotation.x = 0.14;  // blade pitch
              const arm = new THREE.Group();
              arm.rotation.y = (k2 * Math.PI) / 2;
              arm.add(blade);
              rotor.add(arm);
            }
            g.add(rotor);
            // Spin speed: the fan entity's percentage (0–100 → 0–1 rev/s).
            // Falls back to the primary entity; a plain on/off fan runs full.
            const spinSt = l.fanEntity ? stateProvider(l.fanEntity) : st;
            const spinOn = spinSt?.state === 'on';
            const sAttrs = (spinSt?.attributes ?? {}) as Record<string, unknown>;
            const pct = typeof sAttrs.percentage === 'number'
              ? sAttrs.percentage as number : (spinOn ? 100 : 0);
            if (spinOn && pct > 0) {
              this._fanRotors.push({ obj: rotor, rps: Math.min(1, Math.max(0, pct / 100)) });
            }
            if (kind === 'fan_light') {
              const globe = new THREE.Mesh(new THREE.SphereGeometry(140, 16, 12), bodyMat);
              globe.position.y = -170;
              globe.userData = ud;
              g.add(globe);
            }
            break;
          }
          case 'wall_sconce': {
            // Up/down cylinder washer on a wall plate. Backplate sits at
            // local +Z (against the wall — aim with the rotation option);
            // soft cones wash up and down the wall face when on.
            bodyY = l.height ?? 1700;
            const plateMat = this._mat({
              color: 0x54585e, metalness: 0.6, roughness: 0.4,
            });
            const plate2 = new THREE.Mesh(new THREE.BoxGeometry(140, 200, 24), plateMat);
            plate2.position.z = 40;
            plate2.userData = ud;
            g.add(plate2);
            const cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(66, 66, 280, 18), plateMat);
            cyl2.userData = ud;
            g.add(cyl2);
            // Emissive caps top + bottom.
            for (const sy of [-1, 1]) {
              const capL = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, 14, 18), bodyMat);
              capL.position.y = sy * 147;
              capL.userData = ud;
              g.add(capL);
            }
            if (isOn) {
              // Wall-wash cones: up and down, hugging the wall plane.
              for (const sy of [-1, 1]) {
                const wash = new THREE.Mesh(
                  new THREE.CylinderGeometry(sy > 0 ? 60 : 240, sy > 0 ? 240 : 60, 700, 16, 1, true),
                  new THREE.MeshBasicMaterial({
                    color: color.getHex(), transparent: true,
                    opacity: Math.min(0.18, 0.09 * intensity),
                    side: THREE.DoubleSide, depthWrite: false,
                  }));
                wash.position.set(0, sy * (140 + 350), 25);
                g.add(wash);
              }
            }
            break;
          }
          case 'step': {
            // Louvered step light embedded low in a wall: flush faceplate,
            // slat louvers, emissive panel behind, and a downward wash onto
            // the tread when on. Face points local -Z (aim with rotation).
            bodyY = l.height ?? 300;
            const faceMat = this._mat({
              color: 0xb9bec4, metalness: 0.4, roughness: 0.45,
            });
            const face2 = new THREE.Mesh(new THREE.BoxGeometry(190, 130, 22), faceMat);
            face2.userData = ud;
            g.add(face2);
            const glow2 = new THREE.Mesh(new THREE.BoxGeometry(150, 92, 10), bodyMat);
            glow2.position.z = -12;
            glow2.userData = ud;
            g.add(glow2);
            // Louver slats angled to throw light down.
            for (const ly2 of [-28, 0, 28]) {
              const slat = new THREE.Mesh(new THREE.BoxGeometry(150, 10, 26), faceMat);
              slat.position.set(0, ly2, -16);
              slat.rotation.x = 0.5;
              g.add(slat);
            }
            if (isOn) {
              // Short wash down the wall to the floor in front of the plate.
              const wash2 = new THREE.Mesh(
                new THREE.CylinderGeometry(70, Math.min(500, lr * 0.6), bodyY, 14, 1, true),
                new THREE.MeshBasicMaterial({
                  color: color.getHex(), transparent: true,
                  opacity: Math.min(0.16, 0.08 * intensity),
                  side: THREE.DoubleSide, depthWrite: false,
                }));
              wash2.position.set(0, -bodyY / 2, -90);
              g.add(wash2);
            }
            break;
          }
          case 'under_cabinet': {
            // Slim aluminum channel + diffuser. Default mount height suits
            // the underside of wall cabinets; no floor disc — the point
            // light washes whatever sits below (counter, island, …) via PBR.
            bodyY = l.height ?? 1350;
            const Lmm = lightLength(l);
            const chanMat = this._mat({
              color: 0x9aa0a6, metalness: 0.7, roughness: 0.4,
            });
            const chan = new THREE.Mesh(new THREE.BoxGeometry(Lmm, 22, 38), chanMat);
            chan.userData = ud;
            g.add(chan);
            const diffuser = new THREE.Mesh(new THREE.BoxGeometry(Lmm * 0.98, 10, 28), bodyMat);
            diffuser.position.y = -14;
            diffuser.userData = ud;
            g.add(diffuser);
            break;
          }
          case 'string': {
            // LED string: emissive orbs along the length with a gentle sag,
            // strung on a thin wire. Oriented by the rotation option.
            const Lmm = lightLength(l);
            const n = Math.max(4, Math.round(Lmm / 160));
            const sag = Math.min(400, Lmm * 0.07);
            const orbMat = this._mat({
              color: isOn ? color.getHex() : 0x333338,
              emissive: isOn ? color.getHex() : 0x111114,
              emissiveIntensity: isOn ? 1.4 * intensity : 0.05,
            });
            const wirePts: THREE.Vector3[] = [];
            for (let k2 = 0; k2 < n; k2++) {
              const f2 = k2 / (n - 1);
              const x2 = (f2 - 0.5) * Lmm;
              const y2 = -sag * Math.sin(Math.PI * f2);
              wirePts.push(new THREE.Vector3(x2, y2, 0));
              const orb = new THREE.Mesh(new THREE.SphereGeometry(26, 8, 6), orbMat);
              orb.position.set(x2, y2 - 20, 0);
              orb.userData = ud;
              g.add(orb);
            }
            g.add(new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(wirePts),
              new THREE.LineBasicMaterial({ color: 0x555a60, transparent: true, opacity: 0.7 })));
            break;
          }
          case 'bowl': {
            // Open-top hemisphere (lower half), opening points up.
            const dome = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R * 1.2, 18, 12, 0, 2 * Math.PI, Math.PI / 2, Math.PI / 2),
              bodyMat,
            );
            dome.userData = ud;
            g.add(dome);
            break;
          }
          case 'tiered': {
            // 3 discs of decreasing radius stacked downward from lh.
            const sizes = [1.4, 1.0, 0.65];
            for (let i = 0; i < sizes.length; i++) {
              const disc = new THREE.Mesh(
                new THREE.CylinderGeometry(
                  LIGHT_BODY_R * sizes[i], LIGHT_BODY_R * sizes[i], 60, 24,
                ),
                bodyMat,
              );
              disc.position.y = -i * 90;
              disc.userData = ud;
              g.add(disc);
            }
            break;
          }
          case 'round': {
            // Flat round panel flush with ceiling.
            const panel = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 1.7, LIGHT_BODY_R * 1.7, 50, 32),
              bodyMat,
            );
            panel.position.y = -25;
            panel.userData = ud;
            g.add(panel);
            break;
          }
          case 'recessed': {
            // Flush ceiling can: wide FLAT trim ring + recessed emissive lens
            // slightly above the trim (looking up you see a lit disc inside a
            // ring, not a protruding body) + a faint light shaft below.
            const ringMat = this._mat({
              color: 0xd8dade, roughness: 0.5, metalness: 0.1,
            });
            const ring = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 1.25, LIGHT_BODY_R * 1.25, 18, 28),
              ringMat,
            );
            ring.position.y = -9;
            g.add(ring);
            addShaft(LIGHT_BODY_R * 0.9);
            const inner = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 0.9, LIGHT_BODY_R * 0.9, 14, 28),
              bodyMat,
            );
            inner.position.y = -45;
            inner.userData = ud;
            g.add(inner);
            break;
          }
          case 'jar': {
            // Mason-jar: cylinder + dome top.
            const jar = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 0.95, LIGHT_BODY_R * 0.95,
                                         LIGHT_BODY_R * 2.2, 24),
              bodyMat,
            );
            jar.position.y = -LIGHT_BODY_R * 1.1;
            jar.userData = ud;
            g.add(jar);
            const cap = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R * 0.95, 18, 10, 0, 2 * Math.PI, 0, Math.PI / 2),
              bodyMat,
            );
            cap.userData = ud;
            g.add(cap);
            break;
          }
          case 'oval': {
            const ell = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R, 18, 14),
              bodyMat,
            );
            ell.scale.set(1.3, 0.65, 1.3);
            ell.userData = ud;
            g.add(ell);
            break;
          }
          case 'lamp': {
            // Floor lamp at lh: vertical pole + cone shade.
            bodyY = 0;
            const poleH = Math.max(800, lh - 400);
            const pole = new THREE.Mesh(
              new THREE.CylinderGeometry(30, 40, poleH, 12),
              stemMat,
            );
            pole.position.y = poleH / 2;
            g.add(pole);
            const baseDisc = new THREE.Mesh(
              new THREE.CylinderGeometry(180, 180, 30, 24),
              stemMat,
            );
            baseDisc.position.y = 15;
            g.add(baseDisc);
            const shade = new THREE.Mesh(
              new THREE.CylinderGeometry(220, 320, 380, 24, 1, true),
              shadeMat,
            );
            shade.position.y = poleH + 190;
            shade.userData = ud;
            g.add(shade);
            const bulb = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R * 0.6, 12, 10),
              bodyMat,
            );
            bulb.position.y = poleH + 100;
            bulb.userData = ud;
            g.add(bulb);
            break;
          }
          default: {
            // Bulb: short stem + socket from the (implied) ceiling with the
            // globe hanging just below — not a free-floating ball.
            const stem2 = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 160, 8), stemMat);
            stem2.position.y = LIGHT_BODY_R + 130;
            g.add(stem2);
            const socket = new THREE.Mesh(
              new THREE.CylinderGeometry(52, 62, 90, 14),
              this._mat({ color: 0x6f7378, metalness: 0.7, roughness: 0.35 }));
            socket.position.y = LIGHT_BODY_R + 20;
            g.add(socket);
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R, 16, 16),
              bodyMat,
            );
            sphere.userData = ud;
            g.add(sphere);
          }
        }
        return { group: g, bodyY };
      };
      const { group: body, bodyY } = buildBody();
      const p = this._w(l.x, l.y, bodyY);
      body.position.set(p.x, p.y, p.z);
      // Orient directional bodies (fireplace hearth, strip bar, sconce).
      // Same sign convention as furniture: 2D screen-CW → negate for scene Y.
      body.rotation.y = -lightRotation(l) * Math.PI / 180;
      // Stamp userData on the outer Group so the parent-walk in the raycaster
      // finds the click target even when the geometry hit lacks userData
      // (e.g. furniture children, decorative meshes, etc.).
      body.userData = ud;
      // Cartoon outlines on the fixture body (opaque meshes only — pools,
      // shafts, and glass are transparent and skip automatically). Shells
      // are raycast hits too, but the parent-walk still lands on `body`.
      this._addOutlines(body, 8, 60);
      this._lightGroup.add(body);
      // Always-on invisible click target. Light bodies vary wildly per kind —
      // open-ended cones (spot, lamp shade), thin strips, sconces, fireplace
      // hearths — and a small unlit body is hard to click. A 400 mm
      // transparent sphere centered on the body guarantees a generous
      // hit area regardless of state or kind.
      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(400, 8, 6),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      hitMesh.position.set(p.x, p.y, p.z);
      hitMesh.userData = ud;
      this._lightGroup.add(hitMesh);
      if (isOn) {
        const pl = new THREE.PointLight(
          color.getHex(),
          (0.6 + 1.4 * (bri / 255)) * intensity * flickerMul,
          Math.max(2000, lr * 5),
          1.5,
        );
        pl.position.set(p.x, p.y - 50, p.z);
        this._lightGroup.add(pl);
        // Skip floor pool for sconce (wall), plain fan (no light), and
        // under-cabinet strips (their wash lands on the counter below via
        // the point light, not the floor).
        if (kind !== 'sconce' && kind !== 'fan' && kind !== 'under_cabinet' && kind !== 'wall_sconce') {
          const disc = new THREE.Mesh(
            new THREE.CircleGeometry(lr, 48),
            new THREE.MeshBasicMaterial({
              color: color.getHex(), transparent: true,
              opacity: Math.min(1, (0.18 + 0.22 * (bri / 255)) * intensity * flickerMul),
              side: THREE.DoubleSide, depthWrite: false,
            }));
          disc.rotation.x = -Math.PI / 2;
          const dp2 = this._w(l.x, l.y, 3);
          disc.position.set(dp2.x, dp2.y, dp2.z);
          // Floor pool is also a click target — much bigger than the body, so
          // a bird's-eye click anywhere in the lit area toggles the light.
          disc.userData = ud;
          this._lightGroup.add(disc);
        }
      }
    }
    for (const sw of switches) {
      const st = sw.entity_id ? stateProvider(sw.entity_id) : null;
      const isOn = st?.state === 'on';
      const col = isOn ? 0x4caf50 : 0x555555;
      const box = new THREE.Mesh(
        // 3D plate tracks the user-set size (2D plate mm × the original
        // 140/320 3D proportion).
        new THREE.BoxGeometry(switchSize(sw) * 0.44, switchSize(sw) * 0.44 * 1.4, 40),
        this._mat({
          color: col, emissive: col,
          emissiveIntensity: isOn ? 0.4 : 0.08, metalness: 0.1, roughness: 0.7,
        }));
      const p = this._w(sw.x, sw.y, switchHeight(sw));
      box.position.set(p.x, p.y, p.z);
      // 2D `ctx.rotate(rot)` is CW on screen; Three Y rotation with the X
      // mirror in `_w` is also CW from above, so negate to match.
      box.rotation.y = -switchRotation(sw) * Math.PI / 180;
      box.userData = { kind: 'switch', entity_id: sw.entity_id, fixtureId: sw.id };
      this._lightGroup.add(box);
    }
  }

  updateZonesWorld(zones: ZoneWorld[]): void {
    if (!this._scene) return;
    this._clearGroup(this._zoneGroup);
    const wallH = this._ZONE_H, thick = 60;
    for (const z of zones) {
      const v = z.vertices;
      if (v.length < 3) continue;
      const wallMat = this._mat({
        color: z.color, emissive: z.color, emissiveIntensity: z.occupied ? 0.3 : 0.1,
        transparent: true, opacity: z.occupied ? 0.28 : 0.15,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const lineMat = new THREE.LineBasicMaterial({
        color: z.color, transparent: true, opacity: 0.6,
      });
      const group = new THREE.Group();
      for (let i = 0; i < v.length; i++) {
        const a = v[i], b = v[(i + 1) % v.length];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) continue;
        const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        const angle = Math.atan2(-dx, dy);
        const geo = new THREE.BoxGeometry(thick, wallH, len);
        const mesh = new THREE.Mesh(geo, wallMat.clone());
        const p = this._w(cx, cy, wallH / 2);
        mesh.position.set(p.x, p.y, p.z);
        mesh.rotation.y = angle;
        group.add(mesh);
      }
      const topPts = v.map(pt => this._w(pt.x, pt.y, wallH));
      topPts.push(topPts[0].clone());
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(topPts), lineMat));
      this._zoneGroup.add(group);
    }
  }

  updateHalos(halos: HaloWorld[]): void {
    if (!this._scene) return;
    this._clearGroup(this._haloGroup);
    const wallH = this._OBJ_H;
    for (const h of halos) {
      const color = h.occupied ? 0xff9800 : 0x888888;
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(h.radius, h.radius, wallH, 48, 1, true),
        this._mat({
          color, emissive: color, emissiveIntensity: h.occupied ? 0.3 : 0.1,
          transparent: true, opacity: h.occupied ? 0.22 : 0.12,
          side: THREE.DoubleSide, depthWrite: false,
        }));
      const p = this._w(h.x, h.y, wallH / 2);
      cyl.position.set(p.x, p.y, p.z);
      this._haloGroup.add(cyl);
    }
  }

  updateTargets(targets: TargetWorld[], ctx?: ActivityContext): void {
    if (!this._scene) return;
    const now = performance.now() / 1000;
    // Bed pass derives its own dt from the previous call (per-humanoid dt is
    // already consumed by the walk integrator).
    const frameDt = this._lastTargetsNow ? Math.min(0.1, now - this._lastTargetsNow) : 0.016;
    this._lastTargetsNow = now;
    const seen = new Set<string>();
    // Stale-chunk defense: a mixed-version module graph could call the old
    // 1-arg signature. Treat a missing context as no live entities.
    const entityOn = ctx?.entityOn ?? EMPTY_ENTITY_ON;
    // RAW world target positions this frame, keyed by target — the bed-covers
    // pass tests footprint containment in world coords.
    const rawPos: Record<string, { x: number; y: number }> = {};
    // Walking (non-anchored, visible) rigs eligible for mutual separation this
    // frame, resolved after the main loop so they gently push apart.
    const movers: { h: Humanoid; key: string }[] = [];

    for (const t of targets) {
      seen.add(t.key);
      rawPos[t.key] = { x: t.x, y: t.y };
      let h = this._humanoids[t.key];
      // Rebuild on tint change (user recolored the sensor mid-track) —
      // materials are baked in at build time.
      if (h && h.color !== t.color) {
        this._targetGroup.remove(h.group);
        this._disposeHumanoid(h);
        delete this._humanoids[t.key];
        h = undefined as unknown as Humanoid;
      }
      if (!h) {
        h = this._buildHumanoid(t.color);
        this._humanoids[t.key] = h;
        this._targetGroup.add(h.group);
      }
      // Restore visibility on every seen rig: the two-in-bed pass hides
      // occupants each frame, so a rig that left a bed (or the covers
      // disengaged) is made visible again here before the bed pass re-decides.
      h.group.visible = true;
      const p = this._w(t.x, t.y, 0);   // RAW radar goal, scene coords

      // First sighting of this target: anchor the raw + nav trackers to the
      // spawn point so the next frame's delta is a real velocity, not the bogus
      // origin-to-spawn vector (which used to lock facing in a wrong direction
      // and make the figure walk backwards). Snap nav to the nearest free cell
      // if the radar drops the person inside a footprint.
      if (!h.initialized) {
        h.navX = p.x; h.navZ = p.z;
        if (this._nav && this._nav.blockedCount > 0) {
          const gi = this._cellIdxOf(t.x, t.y);
          if (this._nav.blocked[gi]) {
            const sc = this._cellToScene(this._nearestFreeCell(gi));
            h.navX = sc.x; h.navZ = sc.z;
          }
        }
        h.lastX = h.navX; h.lastZ = h.navZ;
        h.rawLastX = p.x; h.rawLastZ = p.z;
        h.lastUpdate = now;
        h.vx = 0; h.vz = 0; h.rawVx = 0; h.rawVz = 0;
        h.facing = 0;     // arbitrary; updated as soon as motion is detected
        h.path = null; h.pathRev = -1; h.goalCell = -1;
        h.initialized = true;
      }

      // dt is clamped for animation stability, but velocity must divide by
      // the REAL elapsed time — dividing a multi-frame gap's displacement by
      // the clamp (tab resume, slow devices, throttled rAF) overestimates
      // speed several-fold and spikes facing / gait / the sitting detector.
      const dtFull = Math.max(1e-3, now - h.lastUpdate);
      const dt = Math.min(0.1, dtFull);
      h.lastUpdate = now;

      // Two speeds (see DESIGN): `rawSpeed` = the low-passed RAW radar velocity,
      // drives sit/activity/dwell TRIGGERS and the seek pace; `navSpeed` (below,
      // h.vx/h.vz) = the low-passed NAV velocity, drives gait + facing so the
      // feet/turns follow the actual detour path. Keeping them separate stops
      // detour walking from feeding back into the dwell gates.
      {
        const rix = (p.x - h.rawLastX) / dtFull, riz = (p.z - h.rawLastZ) / dtFull;
        const al = Math.min(1, dt * 4);
        h.rawVx = h.rawVx * (1 - al) + rix * al;
        h.rawVz = h.rawVz * (1 - al) + riz * al;
      }
      h.rawLastX = p.x; h.rawLastZ = p.z;
      const rawSpeedMms = Math.hypot(h.rawVx, h.rawVz);

      // ── Seating v1: a target dwelling (near-zero speed) within reach of a
      // sittable piece eases into a seated pose anchored on it; real movement
      // (or the target leaving the seat radius) stands it back up. All checks
      // use the RAW target position `p`, so the visual blend below can't
      // feed back into the dwell/velocity logic.
      const rawSpeedMs = rawSpeedMms / 1000;
      if (rawSpeedMs < 0.15) h.dwell += dt; else h.dwell = Math.max(0, h.dwell - dt * 3);
      let wantSit = false;
      if (h.sitSpot) {
        const dSpot = Math.hypot(p.x - h.sitSpot.x, p.z - h.sitSpot.z);
        wantSit = rawSpeedMs <= 0.4 && dSpot <= h.sitSpot.r + 250;
        if (!wantSit) {
          h.dwell = 0;
          if (h.sit < 0.05) h.sitSpot = null;  // fully stood up → release anchor
        }
      }
      if (!h.sitSpot && h.dwell > 1.2) {
        let best: SitSpot | null = null, bd = Infinity;
        for (const sp of this._sitSpots) {
          const d2 = Math.hypot(p.x - sp.x, p.z - sp.z);
          if (d2 < sp.r && d2 < bd) { bd = d2; best = sp; }
        }
        if (best) { h.sitSpot = best; wantSit = true; }
      }
      h.sit += ((wantSit ? 1 : 0) - h.sit) * Math.min(1, dt * 3);
      const sit = h.sit;
      const spot = h.sitSpot;

      // ── Solo activities (Phase 4): a target dwelling near an activity anchor
      // (sink / dishwasher / fridge / coffee maker / exercise / shower / …)
      // eases into a kind-specific pose. Activities and sitting are separate
      // systems: no anchor is acquired while sitting (guard sit ≈ 0), so a
      // person seated on a chair never also grabs a standing appliance anchor.
      // Toilet is handled through the sit system (its seat) with a privacy
      // hook below. Release mirrors the sit hysteresis (hold the anchor while
      // the pose eases back out). All triggers read the RAW position `p`.
      let wantAct = false;
      if (h.activityAnchor) {
        const a = h.activityAnchor;
        const dA = Math.hypot(p.x - a.x, p.z - a.z);
        wantAct = !(rawSpeedMs > 0.4 || dA > a.r + 250);
        if (!wantAct) {
          h.dwell = 0;
          if (h.act < 0.05) h.activityAnchor = null;  // fully disengaged → release
        }
      }
      if (!h.activityAnchor && sit < 0.1) {
        let best: ActivityAnchor | null = null, bd = Infinity;
        for (const a of this._activityAnchors) {
          if (!PHASE4_ACTIVITIES.has(a.kind)) continue;
          const dA = Math.hypot(p.x - a.x, p.z - a.z);
          if (dA >= a.r || dA >= bd) continue;
          const need = (a.kind === 'toilet' || a.kind === 'bathe') ? 2.0 : 1.2;
          if (h.dwell <= need) continue;
          // Entity-gated kinds only read while the appliance is actually on.
          // No binding → don't gate (users without HA still get the anim).
          if (ENTITY_GATED_ACTIVITIES.has(a.kind) && a.hasEntity && !entityOn[a.furnitureId]) continue;
          bd = dA; best = a;
        }
        if (best) { h.activityAnchor = best; wantAct = true; }
      }
      h.act += ((wantAct ? 1 : 0) - h.act) * Math.min(1, dt * 3);
      const act = h.act;
      const anchor = h.activityAnchor;

      // Toilet reaches through the SIT system (a toilet is sittable); flag it
      // so the privacy blur still kicks in on the seated pose.
      const toiletSit = !!(spot && spot.hostActivity === 'toilet' && sit > 0.5);
      // Resolve the engaged activity for pose + privacy purposes.
      if (anchor && act > 0.05) h.activity = anchor.kind;
      else if (toiletSit) h.activity = 'toilet';
      else if (act < 0.05) h.activity = null;

      // Seated contextual activities (Phase 5): while settled on a seat and not
      // in a privacy activity, resolve eat / work / watch from the seat's
      // context. These are narrative + tiny pose offsets keyed on h.sit; they
      // never grab an activity anchor (that path is standing-only).
      if (sit > 0.5 && !toiletSit && h.activity !== 'toilet') {
        const ha = spot?.hostActivity;
        if (ha === 'eat_at_table' || ha === 'work_at_desk') {
          h.activity = ha;
        } else if (spot && spot.roomId) {
          // Watch only a BOUND, ON TV in the seat's room — reflecting real HA
          // state. An unbound TV never auto-triggers "watching".
          let tvOn = false;
          const tvs = this._tvsByRoom[spot.roomId];
          if (tvs) for (const tv of tvs) {
            if (tv.hasEntity ? entityOn[tv.furnitureId] : false) { tvOn = true; break; }
          }
          h.activity = tvOn ? 'watch_tv' : null;
        } else {
          h.activity = null;  // plain sitting
        }
      }

      // Stand point: OFFSET from the anchor center along +facing so the figure
      // stands beside the appliance and looks back at it (body-forward is
      // local -Z; with yaw = anchor.facing the figure looks toward the anchor
      // from the (sinθ, cosθ) side). standOff ≈ 45% of the footprint radius.
      let standX = p.x, standZ = p.z;
      if (anchor) {
        const standOff = Math.max(350, anchor.r * 0.45);
        standX = anchor.x + Math.sin(anchor.facing) * standOff;
        standZ = anchor.z + Math.cos(anchor.facing) * standOff;
      }

      // ── Collision-aware navigation. While walking, the rig renders at `nav`
      // (steered around furniture/walls) rather than the raw radar point.
      // Anchored rigs (seated / activity, blend > 0.3) skip nav entirely — the
      // sit/activity blend already owns the position — and just ease nav toward
      // the rendered spot (done after px2/pz2 resolve) so stand-up is
      // continuous. See _steerNav / _aStar.
      const anchored = sit > 0.3 || act > 0.3;
      if (!anchored) this._steerNav(h, t, dt, rawSpeedMms);
      // NAV velocity (drives gait + facing): low-passed nav displacement.
      {
        const nix = (h.navX - h.lastX) / dtFull, niz = (h.navZ - h.lastZ) / dtFull;
        const al = Math.min(1, dt * 4);
        h.vx = h.vx * (1 - al) + nix * al;
        h.vz = h.vz * (1 - al) + niz * al;
      }
      h.lastX = h.navX; h.lastZ = h.navZ;
      // Body-forward in this rig is local -Z; facing eases toward the nav
      // velocity heading (walking branch below).
      const speedMms = Math.hypot(h.vx, h.vz);

      if (anchor && act > 0.3) {
        // Turn to face the appliance while engaging.
        let d = anchor.facing - h.facing;
        d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI;
        h.facing += d * Math.min(1, dt * 6);
      } else if (spot && sit > 0.3) {
        // Turn to the seat's facing while settling.
        let d = spot.facing - h.facing;
        d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI;
        h.facing += d * Math.min(1, dt * 6);
      } else if (speedMms > 50) {
        const want = Math.atan2(-h.vx, -h.vz);
        let d = want - h.facing;
        d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI;  // wrap to [-π, π]
        h.facing += d * Math.min(1, dt * 8);
      }
      h.group.rotation.y = h.facing;

      // Walk cycle, paced by the figure's actual on-screen displacement (the
      // smoothed velocity above) — NOT HA's speed entity, which updates on
      // its own slower cadence and made feet pump while standing / skate
      // while moving. Real gaits keep near-normal cadence and shorten the
      // stride at low speed, so cadence gets a floor instead of scaling
      // linearly down to glacial giant steps.
      const speedMs = speedMms / 1000;
      const walking = speedMs > 0.08;
      const cadence = walking ? Math.max(speedMs / 1.2, 0.7) : 0;  // cycles/s
      h.phase = (h.phase + cadence * 2 * Math.PI * dt) % (2 * Math.PI);

      // Swing amplitude from stride matching: step length ≈ 2·L·amp
      // (small-angle), two steps per cycle → v = 4·L·amp·cadence, so
      // amp = v / (4·L·cadence). Feet then track the ground at every speed —
      // a fixed amplitude swept a ~40 cm arc while a slow drifter moved
      // ~7 cm per step (the cadence floor dominates down there). Eased so
      // gait starts/stops don't snap the limbs.
      const LEG_M = 0.81;  // hip height in m; matches _buildHumanoid leg segments
      const speedNorm = Math.min(1, speedMs / 1.4);
      const targetAmp = walking
        ? Math.min(0.55, Math.max(0.05, speedMs / (4 * LEG_M * cadence)))
        : 0;
      h.amp += (targetAmp - h.amp) * Math.min(1, dt * 6);
      const amp = h.amp;
      const ampNorm = Math.min(1, amp / 0.55);

      const sinP = Math.sin(h.phase);
      // Gentle fore/aft weight shift while idle, desynced between rigs.
      const idle = Math.sin(now * 1.4 + h.idleOffset) * 0.02 * (1 - ampNorm);

      // Seated pose targets: thighs horizontal forward (hip +90°-ish), shins
      // vertical (knee −90°-ish, foot lands ≈ floor for the rig's leg
      // proportions), arms resting toward the lap. Walk pose blends toward it
      // by `sit`.
      const SIT_HIP = 1.45, SIT_KNEE = -1.45, SIT_SHOULDER = 0.45, SIT_ELBOW = 0.85;
      const stand = 1 - sit;

      // Walk pose values for each joint (rad), before any sit / activity blend.
      const wLHip = sinP * amp + idle, wRHip = -sinP * amp + idle;
      const wLKnee = -Math.max(0, sinP) * (0.9 * ampNorm);
      const wRKnee = -Math.max(0, -sinP) * (0.9 * ampNorm);
      const wLSh = -sinP * amp * 0.8 - idle, wRSh = sinP * amp * 0.8 - idle;
      const wLEl = 0.25 + Math.max(0, -sinP) * 0.5 * ampNorm;
      const wREl = 0.25 + Math.max(0, sinP) * 0.5 * ampNorm;
      // Whole-body English (root rotation order is YXZ: yaw = facing above,
      // pitch = forward lean into the direction of travel — NEGATIVE is a
      // forward lean — roll = lateral weight sway once per stride).
      const wLeanX = -0.12 * speedNorm * ampNorm;
      const wRollZ = sinP * 0.045 * ampNorm;

      // Per-joint final values. Sitting and activities are mutually exclusive
      // (anchor only acquired while sit ≈ 0), so an engaged activity overrides
      // the sit-blend path entirely.
      let lHip = wLHip * stand + SIT_HIP * sit;
      let rHip = wRHip * stand + SIT_HIP * sit;
      let lKnee = wLKnee * stand + SIT_KNEE * sit;
      let rKnee = wRKnee * stand + SIT_KNEE * sit;
      let lSh = wLSh * stand + SIT_SHOULDER * sit;
      let rSh = wRSh * stand + SIT_SHOULDER * sit;
      let lEl = wLEl * stand + SIT_ELBOW * sit;
      let rEl = wREl * stand + SIT_ELBOW * sit;
      let leanX = wLeanX * stand;
      let rollZ = wRollZ * stand;
      let squatDrop = 0;  // mm the exercise squat lowers the root (blended by act)

      if (anchor) {
        // Activity pose targets (rad). Legs default to straight standing;
        // forward lean is negative (see wLeanX). See DESIGN-sims Phase 4.
        let pLHip = 0, pRHip = 0, pLKnee = 0, pRKnee = 0;
        let pLSh = 0, pRSh = 0, pLEl = 0.2, pREl = 0.2, pLean = 0;
        switch (h.activity) {
          case 'wash_hands':
            pLSh = pRSh = 0.55;
            pLEl = pREl = 0.95 + Math.sin(now * 5) * 0.18;  // scrubbing
            pLean = -0.08;
            break;
          case 'load_dishwasher':
            pLSh = pRSh = 0.7; pLEl = pREl = 0.35;
            pLean = -(0.18 + Math.max(0, Math.sin(now * 1.3)) * 0.42);  // bend down / up
            break;
          case 'make_coffee':
            pRSh = 0.85; pREl = 1.1;  // asymmetric: right arm works the machine
            pLSh = 0; pLEl = 0.2 + Math.sin(now * 1.6 + h.idleOffset) * 0.05;
            break;
          case 'forage_fridge':
            pLSh = pRSh = 0.5; pLEl = pREl = 0.6;
            pLean = -0.3;  // static peer-into-the-fridge lean
            break;
          case 'exercise': {
            const sq = Math.max(0, Math.sin(now * 3.4));  // squat cycle
            pLHip = pRHip = 0.9 * sq; pLKnee = pRKnee = -1.5 * sq;
            pLSh = pRSh = (Math.PI / 2) * 0.9; pLEl = pREl = 0.15;  // arms raised
            squatDrop = 180 * sq;
            break;
          }
          case 'toilet':
            // Defensive: the toilet normally routes through the sit system, but
            // if reached via anchor, reuse the seated pose.
            pLHip = pRHip = SIT_HIP; pLKnee = pRKnee = SIT_KNEE;
            pLSh = pRSh = SIT_SHOULDER; pLEl = pREl = SIT_ELBOW;
            break;
          // shower / bathe: pose is hidden behind the privacy blur — leave the
          // relaxed standing default.
        }
        const a = act, na = 1 - act;
        lHip = wLHip * na + pLHip * a; rHip = wRHip * na + pRHip * a;
        lKnee = wLKnee * na + pLKnee * a; rKnee = wRKnee * na + pRKnee * a;
        lSh = wLSh * na + pLSh * a; rSh = wRSh * na + pRSh * a;
        lEl = wLEl * na + pLEl * a; rEl = wREl * na + pREl * a;
        leanX = wLeanX * na + pLean * a;
        rollZ = wRollZ * na;  // no stride roll while engaged
        squatDrop *= a;
      } else if (sit > 0.05) {
        // Seated contextual pose add-ons (Phase 5) — subtle, layered on top of
        // the SIT_* pose and blended by `sit`. No anchor is involved. Cheap:
        // only the elbows / shoulders / head lean move.
        switch (h.activity) {
          case 'eat_at_table': {
            // Left forearm lifts toward the mouth on a slow 0.8 Hz cycle; the
            // right stays at rest — reads as bringing food up and down.
            const s = (Math.sin(now * 0.8 * 2 * Math.PI) + 1) / 2;  // 0..1
            lEl = wLEl * stand + (SIT_ELBOW + (1.3 - SIT_ELBOW) * s) * sit;
            lSh = wLSh * stand + (SIT_SHOULDER + 0.25 * s) * sit;
            break;
          }
          case 'work_at_desk':
            // Both forearms up to the desk surface, slight head-down lean.
            lEl = wLEl * stand + 1.15 * sit;
            rEl = wREl * stand + 1.15 * sit;
            leanX = wLeanX * stand - 0.06 * sit;
            break;
          case 'watch_tv':
            // Completely still except breathing — hands rest a touch lower.
            lEl = wLEl * stand + 0.9 * sit;
            rEl = wREl * stand + 0.9 * sit;
            break;
        }
      }

      h.leftHip.rotation.x = lHip; h.rightHip.rotation.x = rHip;
      h.leftKnee.rotation.x = lKnee; h.rightKnee.rotation.x = rKnee;
      h.leftShoulder.rotation.x = lSh; h.rightShoulder.rotation.x = rSh;
      h.leftElbow.rotation.x = lEl; h.rightElbow.rotation.x = rEl;
      h.group.rotation.x = leanX;
      h.group.rotation.z = rollZ;

      // Breathing — subtle torso rise/fall, always on.
      h.torso.scale.y = 1 + Math.sin(now * 1.8 + h.idleOffset) * 0.012;

      // Spawn ease-in (rig grows up from the floor; also recovers a rig
      // caught mid-despawn when a flickering target re-acquires).
      h.scale += (1 - h.scale) * Math.min(1, dt * 10);
      h.group.scale.setScalar(h.scale);

      // Terrain: figures on stairs/landings stand at the surface height under
      // the NAV position (they climb along their detour path), eased so
      // climbing reads as a glide up the treads rather than pops.
      const gTarget = this._groundYAt(this._fw / 2 - h.navX, h.navZ + this._fd / 2);
      h.groundY += (gTarget - h.groundY) * Math.min(1, dt * 8);

      // Subtle vertical bob — peaks twice per stride cycle. When seated the
      // root drops so the hip pivot (870 mm in the rig) rests on the seat,
      // and x/z pull onto the seat center. The WALKING term is the nav
      // position (obstacle-avoided), not the raw radar point.
      const bob = Math.abs(sinP) * 40 * ampNorm;
      const HIP_Y = 870;
      let px2: number, pz2: number, py2: number;
      if (anchor) {
        // Standing activity: pull onto the stand point beside the appliance;
        // stay on the walking surface (minus the exercise squat drop).
        const a = act, na = 1 - act;
        px2 = h.navX * na + standX * a;
        pz2 = h.navZ * na + standZ * a;
        py2 = h.groundY + bob - squatDrop;
      } else if (spot) {
        // Seated: drop the root so the hip pivot rests on the seat, pull x/z
        // onto the seat center.
        px2 = h.navX * stand + spot.x * sit;
        pz2 = h.navZ * stand + spot.z * sit;
        py2 = (h.groundY + bob) * stand + (spot.seatY - HIP_Y) * sit;
      } else {
        px2 = h.navX; pz2 = h.navZ; py2 = h.groundY + bob;
      }
      h.group.position.set(px2, py2, pz2);
      // While anchored, ease nav toward the rendered position so there's no
      // jump when the blend releases and nav takes over walking again.
      if (anchored) {
        h.navX += (px2 - h.navX) * Math.min(1, dt * 3);
        h.navZ += (pz2 - h.navZ) * Math.min(1, dt * 3);
      }

      // Plumbob spin (absolute clock + per-rig offset so rigs desync) and
      // blob-shadow grounding: the root bobs / drops onto seats, but the
      // shadow must stay glued to the walking surface below.
      h.plumbob.rotation.y = (now * 1.6 + h.idleOffset) % (2 * Math.PI);
      h.blob.position.y = h.groundY + 10 - py2;

      // ── Privacy blur: shower / bathe / toilet censor the rig behind a chunky
      // pixel-mosaic silhouette sprite. The plumbob + blob shadow stay (a
      // plumbob floating over a censored blob is peak Sims).
      const sitPose = h.activity === 'toilet' || h.activity === 'bathe';
      const wantPrivacy =
        ((h.activity === 'shower' || h.activity === 'bathe') && act > 0.5) ||
        (h.activity === 'toilet' && (toiletSit || act > 0.5));
      h.privacy += ((wantPrivacy ? 1 : 0) - h.privacy) * Math.min(1, dt * 4);
      if (h.privacy > 0.5) {
        if (!h.blurSprite) {
          const mat = new THREE.SpriteMaterial({
            map: this._blurTexture(sitPose), transparent: true, depthWrite: false,
          });
          h.blurSprite = new THREE.Sprite(mat);
          h.blurSprite.userData.outlineSkip = true;
          h.group.add(h.blurSprite);
        }
        const spr = h.blurSprite;
        const wantTex = this._blurTexture(sitPose);
        const sm = spr.material as THREE.SpriteMaterial;
        if (sm.map !== wantTex) { sm.map = wantTex; sm.needsUpdate = true; }
        const spriteH = sitPose ? 1250 : 1750;
        spr.scale.set(900, spriteH, 1);
        // Ground the sprite bottom on the walking surface (blob height is the
        // ground in group-local space); gentle sway so it isn't a dead billboard.
        spr.position.set(Math.sin(now * 2.2) * 30, h.blob.position.y + spriteH / 2, 0);
        spr.visible = true;
        // Hide the rig body; keep the blob shadow, plumbob, and sprite.
        for (const child of h.group.children) {
          if (child === h.blob || child === h.plumbob || child === spr) continue;
          child.visible = false;
        }
      } else if (h.blurSprite && h.blurSprite.visible) {
        h.blurSprite.visible = false;
        for (const child of h.group.children) child.visible = true;
      }

      // ── Thought bubbles (Phase 6): a context/time-aware glyph cloud above the
      // head. Per-frame cost is string compares + one pip walk to find the room;
      // the canvas is only (re)painted on a committed kind change (2.5 s
      // hysteresis makes that rare). Runs AFTER the privacy block so it has the
      // final say on the bubble sprite's visibility.
      const tb = ctx?.timeBucket ?? 'day';
      let roomName = '';
      for (const rz of this._roomZones) {
        if (pip(t.x, t.y, rz.loop)) {
          roomName = (ctx?.roomNames?.[rz.roomId] ?? '').toLowerCase();
          break;
        }
      }
      const bedHidden = this._bedState.hiddenKeys.has(t.key);
      const inBedAlone = this._bedState.soloKeys.has(t.key);
      const want = this._resolveBubbleKind(h, tb, roomName, inBedAlone, bedHidden);
      // Hysteresis: accumulate dwell only while the raw resolution holds steady;
      // any change resets the timer. Commit (and rebuild) once it's been stable
      // for 2.5 s.
      if (want === h.bubbleWant) h.bubbleDwell += dt;
      else { h.bubbleWant = want; h.bubbleDwell = 0; }
      if (h.bubbleDwell > 2.5 && h.bubbleKind !== h.bubbleWant) h.bubbleKind = h.bubbleWant;
      this._syncBubble(h, dt);

      // Eligible for mutual separation: walking (not sit/activity anchored),
      // visible, and not hidden under bed covers (previous frame's summary).
      if (sit < 0.3 && act < 0.3 && !this._bedState.hiddenKeys.has(t.key)) {
        movers.push({ h, key: t.key });
      }
    }

    // ── Mutual separation: keep crossing pedestrians from overlapping. For each
    // eligible pair closer than 380 mm in nav space, push both apart along the
    // pair axis by half the overlap (capped 60 mm/frame each). Applied to the
    // nav positions (so it persists) and re-committed to the rendered x/z.
    const SEP = 380;
    for (let i = 0; i < movers.length; i++) {
      for (let j = i + 1; j < movers.length; j++) {
        const a = movers[i].h, b = movers[j].h;
        let ddx = a.navX - b.navX, ddz = a.navZ - b.navZ;
        let d = Math.hypot(ddx, ddz);
        if (d >= SEP) continue;
        if (d < 1e-3) { ddx = 1; ddz = 0; d = 1e-3; }  // coincident → arbitrary axis
        const push = Math.min(60, (SEP - d) / 2);
        ddx /= d; ddz /= d;
        a.navX += ddx * push; a.navZ += ddz * push;
        b.navX -= ddx * push; b.navZ -= ddz * push;
      }
    }
    for (const m of movers) {
      m.h.group.position.x = m.h.navX;
      m.h.group.position.z = m.h.navZ;
    }

    // Despawn: ease out instead of popping. Brief LD2450 dropouts (a target
    // lost and re-acquired a beat later) barely dent the figure instead of
    // destroying and respawning the rig.
    for (const key of Object.keys(this._humanoids)) {
      if (seen.has(key)) continue;
      const h = this._humanoids[key];
      const dt = Math.min(0.1, now - h.lastUpdate);
      h.lastUpdate = now;
      h.scale -= h.scale * Math.min(1, dt * 7);
      if (h.scale < 0.03) {
        this._targetGroup.remove(h.group);
        this._disposeHumanoid(h);
        delete this._humanoids[key];
      } else {
        h.group.scale.setScalar(h.scale);
      }
    }

    // ── Two-in-bed covers: ≥2 settled targets inside a bed footprint hide the
    // rigs and raise a breathing blanket (the joke is the lump). Triggers read
    // the RAW target positions; occupancy is sustained via a per-bed dwell
    // accumulator with hysteresis (engage >2 s, disengage <0.3 s).
    this._updateBedCovers(rawPos, frameDt, now);
  }

  // Resolve the thought-bubble glyph for a humanoid this frame (raw, pre-
  // hysteresis). String compares only. Priority (first match wins):
  //   1. engaged activity / privacy → null (the pose already says it all).
  //   2. hidden under bed covers → null.
  //   3. late-night|night, kitchen, standing idle → snack.
  //   4. morning, kitchen, standing idle → coffee.
  //   5. evening|night|late-night, seated → reading (activity is null here, so
  //      the room's TV is off — otherwise h.activity would be 'watch_tv').
  //   6. sole occupant idling in a bed → phone.
  private _resolveBubbleKind(h: Humanoid, tb: import('./time-of-day.js').TimeBucket,
                             roomName: string, inBedAlone: boolean,
                             bedHidden: boolean): string | null {
    if (h.activity != null || h.privacy > 0.3) return null;
    if (bedHidden) return null;
    const inKitchen = roomName.includes('kitchen');
    const standingIdle = h.sit < 0.3 && h.dwell > 1.5;
    if ((tb === 'late_night' || tb === 'night') && inKitchen && standingIdle) return '🍪';
    if (tb === 'morning' && inKitchen && standingIdle) return '☕';
    if ((tb === 'evening' || tb === 'night' || tb === 'late_night') && h.sit > 0.5) return '📖';
    if (inBedAlone && h.dwell > 2) return '📱';
    return null;
  }

  // Reconcile a humanoid's committed bubble kind with its live sprite: build /
  // pop-in / shrink-out + dispose. Pop-in eases scale 0→1 over ~0.25 s; a
  // commit to null (or a privacy blur / hidden rig) shrinks it back out and
  // frees the per-rig canvas texture. Called every frame; canvas work happens
  // only when the committed glyph actually changes.
  private _syncBubble(h: Humanoid, dt: number): void {
    const forceHide = h.privacy > 0.3 || !h.group.visible;
    const wantVisible = h.bubbleKind != null && !forceHide;
    if (wantVisible && (!h.bubble || h.bubble.userData.glyph !== h.bubbleKind)) {
      if (h.bubble) this._disposeBubble(h);
      const spr = this._makeBubbleSprite(h.bubbleKind!);
      spr.userData.glyph = h.bubbleKind;
      spr.userData.outlineSkip = true;
      spr.userData.s = 0;  // eased 0..1 pop-in
      spr.position.set(BUBBLE_X, BUBBLE_LOCAL_Y, 0);
      h.group.add(spr);
      h.bubble = spr;
    }
    if (!h.bubble) return;
    const spr = h.bubble;
    const target = wantVisible ? 1 : 0;
    let s = (spr.userData.s as number) ?? 0;
    s += (target - s) * Math.min(1, dt * 8);  // ~0.25 s ease
    spr.userData.s = s;
    spr.scale.set(BUBBLE_W * s, BUBBLE_H * s, 1);
    spr.visible = wantVisible && s > 0.01;
    if (!wantVisible && s < 0.02) this._disposeBubble(h);
  }

  private _disposeBubble(h: Humanoid): void {
    if (!h.bubble) return;
    h.group.remove(h.bubble);
    const m = h.bubble.material as THREE.SpriteMaterial;
    m.map?.dispose();
    m.dispose();
    h.bubble = null;
  }

  // Classic comic thought cloud on a small canvas: a cluster of white puffs with
  // a uniform dark rim (drawn as slightly-larger dark discs UNDER white discs so
  // interior seams vanish and only the union boundary shows), the glyph centered,
  // plus two trailing tail circles bottom-left. Transparent background.
  private _makeBubbleSprite(glyph: string): THREE.Sprite {
    const cv = document.createElement('canvas');
    cv.width = 160; cv.height = 150;
    const ctx = cv.getContext('2d')!;
    // [x, y, r] — main cloud puffs then the two trailing tail circles.
    const parts: [number, number, number][] = [
      [78, 60, 44], [44, 66, 28], [112, 64, 30], [60, 40, 26], [98, 38, 26], [80, 82, 26],
      [34, 108, 12], [20, 128, 7],
    ];
    const OUT = 3;  // rim thickness (px)
    ctx.fillStyle = '#242424';
    for (const [x, y, r] of parts) { ctx.beginPath(); ctx.arc(x, y, r + OUT, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fdfdfd';
    for (const [x, y, r] of parts) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = '64px system-ui, "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#242424';
    ctx.fillText(glyph, 78, 62);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false,
    }));
    spr.scale.set(BUBBLE_W, BUBBLE_H, 1);
    return spr;
  }

  private _updateBedCovers(rawPos: Record<string, { x: number; y: number }>,
                           frameDt: number, now: number): void {
    // Occupancy summary for NEXT frame's thought-bubble resolution.
    const hiddenKeys = new Set<string>();
    const soloKeys = new Set<string>();
    for (const bed of this._beds) {
      // Targets inside this bed's footprint (raw world coords) and how many are
      // settled (smoothed speed < 0.15 m/s).
      const inside: string[] = [];
      let settled = 0;
      for (const key in rawPos) {
        const rp = rawPos[key];
        const l = furnitureWorldToLocal(bed.rotation, rp.x - bed.x, rp.y - bed.y);
        if (Math.abs(l.x) > bed.w / 2 || Math.abs(l.y) > bed.h / 2) continue;
        inside.push(key);
        const hh = this._humanoids[key];
        if (hh && Math.hypot(hh.vx, hh.vz) / 1000 < 0.15) settled++;
      }
      // Sole occupant → "in bed alone" candidate (idle gating happens in the
      // bubble resolver via h.dwell).
      if (inside.length === 1) soloKeys.add(inside[0]);
      const prev = this._bedDwell[bed.id] ?? 0;
      const dwell = settled >= 2 ? prev + frameDt : Math.max(0, prev - frameDt * 3);
      this._bedDwell[bed.id] = dwell;

      let cover = this._bedCovers[bed.id];
      // Engage at >2 s of sustained occupancy; the cover's presence carries the
      // engaged state until the dwell decays under 0.3 s (hysteresis).
      if (!cover && dwell > 2) {
        cover = this._buildBedCover(bed);
        this._bedCovers[bed.id] = cover;
      }
      if (!cover) continue;
      const stayEngaged = dwell > 0.3;
      cover.t += ((stayEngaged ? 1 : 0) - cover.t) * Math.min(1, frameDt * 3);
      if (cover.t > 0.02) {
        // Hide every rig inside the footprint (and its plumbob — the whole
        // group goes) while the lump is showing.
        for (const key of inside) {
          const hh = this._humanoids[key];
          if (hh) hh.group.visible = false;
          hiddenKeys.add(key);
        }
        cover.grp.visible = true;
        this._animateBedCover(cover, bed, now);
      } else if (!stayEngaged) {
        // Fully faded out → remove + dispose; rig visibility is restored by the
        // per-target loop next frame.
        this._targetGroup.remove(cover.grp);
        cover.mesh.geometry.dispose();
        (cover.mesh.material as THREE.Material).dispose();
        delete this._bedCovers[bed.id];
      }
    }
    this._bedState = { hiddenKeys, soloKeys };
  }

  // Lazy-build a blanket plane for a bed, parented under _targetGroup (transient
  // — cleared without a floor rebuild). Flat grid; the height is displaced per
  // frame in _animateBedCover.
  private _buildBedCover(bed: { x: number; y: number; w: number; h: number;
                                rotation?: number; color: number; matressTop: number }):
      { mesh: THREE.Mesh; grp: THREE.Group; t: number } {
    const grp = new THREE.Group();
    const p = this._w(bed.x, bed.y, 0);
    grp.position.set(p.x, 0, p.z);
    grp.rotation.y = -((bed.rotation || 0) * Math.PI / 180);
    const geo = new THREE.PlaneGeometry(bed.w * 0.96, bed.h * 0.9, 10, 14);
    geo.rotateX(-Math.PI / 2);  // lie flat; height becomes the local +Y axis
    const mesh = new THREE.Mesh(geo, this._mat({
      color: bed.color, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide,
    }));
    mesh.position.y = bed.matressTop + 60;
    mesh.userData.outlineSkip = true;
    grp.add(mesh);
    grp.visible = false;
    this._targetGroup.add(grp);
    return { mesh, grp, t: 0 };
  }

  // CPU vertex displacement: two fixed gaussian lumps (occupants are hidden, so
  // artistic license) plus a slow breathing ripple, all scaled by the eased
  // engage blend so the blanket grows in / out smoothly. Writes in place.
  private _animateBedCover(cover: { mesh: THREE.Mesh; t: number },
                           bed: { w: number }, now: number): void {
    const geo = cover.mesh.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const blend = cover.t;
    const cx = bed.w * 0.22, sig = bed.w * 0.15, twoSig2 = 2 * sig * sig;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getZ(i);  // local plan coords after rotateX
      const dy = y * 0.6;  // stretch the lumps along the bed length
      const l1 = 170 * Math.exp(-(((x - cx) * (x - cx)) + dy * dy) / twoSig2);
      const l2 = 170 * Math.exp(-(((x + cx) * (x + cx)) + dy * dy) / twoSig2);
      const ripple = 18 * Math.sin(now * 1.7 + x * 0.004) + 12 * Math.sin(now * 1.1 + y * 0.005);
      pos.setY(i, (l1 + l2 + ripple) * blend);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // ── Humanoid construction ──────────────────────────────────────────────
  // Stick-figure proportions (mm). Body forward is +Z (default) and is
  // rotated via group.rotation.y to match velocity direction. Each limb is
  // a 2-segment chain so knees / elbows can flex during the walk cycle.
  private _buildHumanoid(color: number): Humanoid {
    // Sims proportions: head and hands run oversized (~1.15×) so figures
    // read as game characters rather than mannequins.
    const HEAD_R = 126;
    const TORSO_W = 240, TORSO_H = 600, TORSO_D = 140;
    const ARM_UPPER_R = 52, ARM_UPPER_LEN = 320;
    const ARM_LOWER_R = 44, ARM_LOWER_LEN = 280;
    const HAND_R = 67;
    const LEG_UPPER_R = 80, LEG_UPPER_LEN = 430;
    const LEG_LOWER_R = 65, LEG_LOWER_LEN = 380;
    const FOOT_W = 90, FOOT_H = 60, FOOT_D = 230;

    const hipY = LEG_UPPER_LEN + LEG_LOWER_LEN + FOOT_H;
    const torsoY = hipY + TORSO_H / 2;
    const headY = hipY + TORSO_H + HEAD_R + 40;
    const shoulderY = hipY + TORSO_H * 0.88;

    const skin = this._mat({
      color, emissive: color, emissiveIntensity: 0.25,
      metalness: 0.1, roughness: 0.6,
    });
    const dark = this._mat({
      color: 0x202024, roughness: 0.75, metalness: 0.0,
    });
    const shoeMat = this._mat({
      color: 0x1a1a1f, roughness: 0.8, metalness: 0.05,
    });

    // Cylinder segment that hangs DOWN from local origin.
    const segment = (radTop: number, radBot: number, length: number): THREE.Mesh => {
      const geo = new THREE.CylinderGeometry(radTop, radBot, length, 10);
      geo.translate(0, -length / 2, 0);
      return new THREE.Mesh(geo, skin);
    };

    // Two-segment leg: hip pivot → thigh → knee pivot → shin → foot.
    const makeLeg = (xOffset: number) => {
      const hip = new THREE.Group();
      hip.position.set(xOffset, hipY, 0);
      hip.add(segment(LEG_UPPER_R, LEG_UPPER_R * 0.9, LEG_UPPER_LEN));
      // Visible knee bump
      const kneeBall = new THREE.Mesh(new THREE.SphereGeometry(LEG_UPPER_R * 0.95, 10, 8), skin);
      kneeBall.position.set(0, -LEG_UPPER_LEN, 0);
      hip.add(kneeBall);

      const knee = new THREE.Group();
      knee.position.set(0, -LEG_UPPER_LEN, 0);
      hip.add(knee);
      knee.add(segment(LEG_LOWER_R, LEG_LOWER_R * 0.85, LEG_LOWER_LEN));

      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(FOOT_W, FOOT_H, FOOT_D),
        shoeMat,
      );
      // Toes pushed toward -Z, the body-forward side (matches face).
      foot.position.set(0, -LEG_LOWER_LEN - FOOT_H / 2, -FOOT_D * 0.18);
      knee.add(foot);

      return { hip, knee };
    };

    // Two-segment arm: shoulder pivot → upper → elbow pivot → forearm → hand.
    const makeArm = (xOffset: number) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(xOffset, shoulderY, 0);
      shoulder.add(segment(ARM_UPPER_R, ARM_UPPER_R * 0.92, ARM_UPPER_LEN));
      // Visible elbow bump
      const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(ARM_UPPER_R * 0.95, 10, 8), skin);
      elbowBall.position.set(0, -ARM_UPPER_LEN, 0);
      shoulder.add(elbowBall);

      const elbow = new THREE.Group();
      elbow.position.set(0, -ARM_UPPER_LEN, 0);
      shoulder.add(elbow);
      elbow.add(segment(ARM_LOWER_R, ARM_LOWER_R * 0.85, ARM_LOWER_LEN));

      const hand = new THREE.Mesh(
        new THREE.SphereGeometry(HAND_R, 12, 10),
        skin,
      );
      hand.position.set(0, -ARM_LOWER_LEN - HAND_R * 0.5, 0);
      elbow.add(hand);

      return { shoulder, elbow };
    };

    const root = new THREE.Group();
    // Yaw (facing) → pitch (forward lean) → roll (stride sway); see
    // updateTargets.
    root.rotation.order = 'YXZ';

    // Torso
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(TORSO_W, TORSO_H, TORSO_D),
      skin,
    );
    torso.position.set(0, torsoY, 0);
    root.add(torso);

    // Head + face features (eyes/nose/mouth on +Z so facing is obvious).
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(HEAD_R, 18, 14),
      skin,
    );
    head.position.set(0, headY, 0);
    root.add(head);

    // Face features sit on the -Z side of the head: that's the body-forward
    // side (a positive hip rotation lands the foot at body-local -Z, which
    // is also where the body rotation aligns with the velocity vector).
    const eyeR = HEAD_R * 0.18;
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 10, 8), dark);
      eye.position.set(sx * HEAD_R * 0.38, headY + HEAD_R * 0.12, -HEAD_R * 0.86);
      root.add(eye);
    }
    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(HEAD_R * 0.14, 8, 6),
      skin,
    );
    nose.position.set(0, headY - HEAD_R * 0.05, -HEAD_R * 0.99);
    root.add(nose);
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(HEAD_R * 0.45, HEAD_R * 0.07, HEAD_R * 0.04),
      dark,
    );
    mouth.position.set(0, headY - HEAD_R * 0.42, -HEAD_R * 0.85);
    root.add(mouth);

    // Limbs
    const leftLeg  = makeLeg(-TORSO_W / 4);
    const rightLeg = makeLeg( TORSO_W / 4);
    const leftArm  = makeArm(-(TORSO_W / 2 + ARM_UPPER_R * 0.7));
    const rightArm = makeArm( TORSO_W / 2 + ARM_UPPER_R * 0.7);
    // Relaxed A-pose: arms splay a touch outward so the silhouette isn't a
    // rigid soldier. Static roll — updateTargets only animates rotation.x.
    leftArm.shoulder.rotation.z  = -0.08;
    rightArm.shoulder.rotation.z =  0.08;
    root.add(leftLeg.hip, rightLeg.hip, leftArm.shoulder, rightArm.shoulder);

    // Cartoon outlines on the body (thinner than furniture; minDim catches
    // limbs and head but skips eyes / nose / mouth detail).
    this._addOutlines(root, 8, 50);

    // The plumbob: elongated spinning octahedron floating above the head.
    // Transparent → automatically skipped by the outline pass.
    const plumbob = new THREE.Mesh(
      new THREE.OctahedronGeometry(85),
      this._mat({
        color: 0x2ee56a, emissive: 0x1faa44, emissiveIntensity: 0.9,
        transparent: true, opacity: 0.88,
      }),
    );
    plumbob.scale.set(0.72, 1.45, 0.72);
    plumbob.position.set(0, headY + HEAD_R + 240, 0);
    root.add(plumbob);

    // Blob shadow; re-grounded every frame in updateTargets (the root bobs
    // and drops onto seats — the blob must stay on the walking surface).
    const blob = this._blobShadow(430, 430);
    root.add(blob);

    return {
      group: root,
      color,
      torso,
      plumbob,
      blob,
      leftHip: leftLeg.hip,
      rightHip: rightLeg.hip,
      leftKnee: leftLeg.knee,
      rightKnee: rightLeg.knee,
      leftShoulder: leftArm.shoulder,
      rightShoulder: rightArm.shoulder,
      leftElbow: leftArm.elbow,
      rightElbow: rightArm.elbow,
      phase: 0, facing: 0,
      amp: 0, scale: 0,
      sit: 0, groundY: 0, dwell: 0, sitSpot: null,
      activity: null, activityAnchor: null, activityDwell: 0,
      act: 0, privacy: 0, blurSprite: null,
      bubble: null, bubbleKind: null, bubbleWant: null, bubbleDwell: 0,
      idleOffset: Math.random() * Math.PI * 2,
      vx: 0, vz: 0,
      lastX: 0, lastZ: 0, lastUpdate: 0, initialized: false,
      navX: 0, navZ: 0, rawVx: 0, rawVz: 0, rawLastX: 0, rawLastZ: 0,
      path: null, pathRev: -1, goalCell: -1,
    };
  }

  private _disposeHumanoid(h: Humanoid): void {
    h.group.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry.dispose();
        if (Array.isArray(m.material)) m.material.forEach(mm => mm.dispose());
        else m.material.dispose();
      } else if ((obj as THREE.Sprite).isSprite) {
        // Dispose the sprite's material. Per-rig maps (thought-bubble canvas
        // textures) must be freed too; the blur silhouette maps are SHARED
        // across all rigs (disposed once in destroy()) so leave those alone.
        const sm = (obj as THREE.Sprite).material as THREE.SpriteMaterial;
        if (sm.map && sm.map !== this._blurTexStand && sm.map !== this._blurTexSit) {
          sm.map.dispose();
        }
        sm.dispose();
      }
    });
  }

  resize(w: number, h: number): void {
    if (!this._renderer || !this._camera) return;
    this._camera.aspect = Math.max(w, 1) / Math.max(h, 1);
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  }

  destroy(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    // Dispose every per-frame group BEFORE tearing down the WebGL context so
    // GC isn't dumped a giant orphaned graph all at once on view-switch.
    for (const g of [
      this._floorGroup, this._doorGroup, this._modelGroup, this._zoneGroup, this._haloGroup,
      this._sensorGroup, this._motionGroup, this._envGroup, this._lightGroup, this._targetGroup,
    ]) {
      this._disposeSpriteMaps(g);
      this._clearGroup(g);
    }
    for (const key of Object.keys(this._humanoids)) {
      this._disposeHumanoid(this._humanoids[key]);
    }
    this._humanoids = {};
    this._disposeBedCovers();
    if (this._bgTexCache) {
      this._bgTexCache.tex.dispose();
      this._bgTexCache = null;
    }
    // Shared style resources (never disposed per-instance — see _mat /
    // _blobShadow / _addOutlines).
    this._gradientMapTex?.dispose(); this._gradientMapTex = null;
    this._blobTex?.dispose(); this._blobTex = null;
    this._blurTexStand?.dispose(); this._blurTexStand = null;
    this._blurTexSit?.dispose(); this._blurTexSit = null;
    this._outlineMaterial?.dispose(); this._outlineMaterial = null;
    this._controls?.dispose();
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer.forceContextLoss?.();
      this._renderer.domElement.remove();
    }
    this._scene = null; this._renderer = null; this._camera = null;
    this._controls = null;
  }

  private _animate = (): void => {
    this._rafId = requestAnimationFrame(this._animate);
    // Sims-cam azimuth glide: rotate the camera about the target toward the
    // snap goal, easing the shortest arc. Cleared once within ~0.5°.
    if (this._snapAzimuth != null && this._camera && this._controls) {
      const t = this._controls.target;
      const dx = this._camera.position.x - t.x, dz = this._camera.position.z - t.z;
      const cur = Math.atan2(dx, dz);
      let delta = this._snapAzimuth - cur;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      if (Math.abs(delta) < 0.009) {   // ~0.5°
        this._snapAzimuth = null;
      } else {
        const a = cur + delta * 0.2;   // eased step
        const r = Math.hypot(dx, dz);
        this._camera.position.x = t.x + r * Math.sin(a);
        this._camera.position.z = t.z + r * Math.cos(a);
      }
    }
    if (this._controls) this._controls.update();
    // Foreground wall cutaway — cheap per-frame dot products over tagged walls.
    this._updateWallCutaway();
    // Spin fan rotors — angle from the absolute clock so scene rebuilds
    // (which recreate rotor groups) never jump the blade phase.
    if (this._fanRotors.length) {
      const t = performance.now() / 1000;
      for (const rot of this._fanRotors) {
        rot.obj.rotation.y = (t * rot.rps * 2 * Math.PI) % (2 * Math.PI);
      }
    }
    if (this._renderer && this._scene && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  };
}
