import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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
  furnitureDef, doorOpenDeltaDeg,
  ENV_KINDS, envKindOf, envColor, envValueText, envHeight, envScale,
} from './geometry.js';
import type { Door, Window as WindowType, EnvSensor } from './types.js';
import { wallCutsForSegment, closedWallLoops, wallKind, WALL_KINDS, furnitureLocalToWorld, furnitureWorldToLocal, pointInPolygon as pip } from './geometry.js';

export interface ZoneWorld { vertices: Vec2[]; color: number; occupied: boolean; }
export interface HaloWorld { x: number; y: number; radius: number; occupied: boolean; }
export interface TargetWorld { key: string; x: number; y: number; color: number; }

// A seat a humanoid can settle onto (scene coords). Collected from sittable
// furniture (any kind whose def has `seat`) during updateFloor.
interface SitSpot { x: number; z: number; seatY: number; facing: number; r: number; }

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
  phase: number;       // walk-cycle radians
  facing: number;      // body yaw derived from smoothed velocity
  amp: number;         // eased limb-swing amplitude (rad) — smooths gait starts/stops
  sit: number;         // eased sitting blend 0 (standing) .. 1 (seated)
  groundY: number;     // eased terrain height under the figure (stairs/landings)
  dwell: number;       // seconds of near-zero speed (sitting trigger)
  sitSpot: SitSpot | null;  // anchor seat; retained while easing back up
  scale: number;       // eased spawn/despawn scale (0..1)
  idleOffset: number;  // per-rig phase offset so idle sway / breathing desync
  vx: number;          // smoothed velocity in 3D coords (mm/s)
  vz: number;
  lastX: number;
  lastZ: number;
  lastUpdate: number;  // performance.now() / 1000, last seen
  initialized: boolean;
}

type StateProvider = (id: string) => HassState | null;

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
  private _bgTexCache: { dataUrl: string; tex: THREE.Texture } | null = null;
  private _rafId: number | null = null;
  private _fw = 8000;
  private _fd = 6000;
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
  // Fan rotor groups spun in the render loop. rps ≤ 1 (100% = 1 rev/s).
  // Angle derives from the absolute clock, so rebuilds don't jump phase.
  private _fanRotors: { obj: THREE.Object3D; rps: number }[] = [];
  // Walkable terrain (stairs + landings): humanoids stand on the computed
  // surface height instead of the floor plane.
  private _terrain: { x: number; y: number; w: number; h: number; rotation?: number;
                      ht: number; elevation: number; kind: string }[] = [];

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
    // Filmic tone mapping + a PMREM room environment give every
    // MeshStandardMaterial soft image-based reflections — the "realistic
    // rendering" method chosen here: zero assets, one-time bake cost, no
    // per-frame post-processing (SSAO etc. was rejected for tablet perf).
    // environmentIntensity is retuned per lighting preset.
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.15;
    // Shadow map stays enabled; cost is only paid when a light actually
    // casts (sun.castShadow is gated per preset — day only).
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    // Ortho shadow camera sized to cover a typical floor + margin.
    const sc = this._sun.shadow.camera;
    sc.left = -12000; sc.right = 12000; sc.top = 12000; sc.bottom = -12000;
    sc.near = 100; sc.far = 40000;
    this._sun.shadow.mapSize.set(2048, 2048);
    this._sun.shadow.bias = -0.0005;
    this._scene.add(this._ambient, this._hemi, this._sun);
    const pmrem = new THREE.PMREMGenerator(this._renderer);
    this._scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.applyScenePreset(this._preset);

    this._grid = new THREE.GridHelper(20000, 20, 0x334466, 0x1a2235);
    this._scene.add(this._grid);
    this._scene.add(this._floorGroup, this._doorGroup, this._modelGroup,
                    this._zoneGroup, this._haloGroup,
                    this._sensorGroup, this._motionGroup, this._envGroup,
                    this._lightGroup, this._targetGroup);

    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.08;
    this._controls.target.set(0, 0, 0);
    this._controls.maxPolarAngle = Math.PI * 0.49;
    this._controls.minDistance = 1000;
    this._controls.maxDistance = 45000;
    this._controls.update();

    // Recover from iOS Safari context loss without a full reload.
    this._renderer.domElement.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      console.warn('WebGL context lost — will restore on next event.');
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

  // Strip every per-floor mesh group. Called when the user switches floors so
  // a transient bug or render hiccup can't leave the previous floor's
  // sensors / fixtures / zones / halos / targets visible.
  clearTransientGroups(): void {
    for (const g of [
      this._floorGroup, this._doorGroup, this._modelGroup, this._zoneGroup, this._haloGroup,
      this._sensorGroup, this._motionGroup, this._lightGroup, this._targetGroup,
    ]) {
      this._clearGroup(g);
    }
    // Drop persistent rigs so updateTargets rebuilds fresh on the next tick.
    for (const key of Object.keys(this._humanoids)) {
      this._disposeHumanoid(this._humanoids[key]);
    }
    this._humanoids = {};
    this._sitSpots = [];
    this._fanRotors = [];
    this._terrain = [];
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
  // the scene -Z side, which matches the bottom edge of the 2D plan.
  applyViewPreset(kind: 'iso' | 'top' | 'front' | 'back' | 'left' | 'right'): void {
    const d = Math.max(this._fw, this._fd) * 1.35;
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
  applyScenePreset(preset: ScenePreset): void {
    this._preset = preset;
    if (!this._scene || !this._ambient || !this._hemi || !this._sun) return;
    switch (preset) {
      case 'day':
        this._scene.background = new THREE.Color(0x9db8d8);
        this._ambient.intensity = 0.45;
        this._hemi.color.set(0xcfe5ff); this._hemi.groundColor.set(0x8a7f6a);
        this._hemi.intensity = 0.8;
        this._sun.color.set(0xfff6e0); this._sun.intensity = 1.6;
        this._sun.position.set(4000, 10000, 2500);
        this._sun.castShadow = true;
        this._scene.environmentIntensity = 0.85;
        break;
      case 'dusk':
        this._scene.background = new THREE.Color(0x2a2030);
        this._ambient.intensity = 0.3;
        this._hemi.color.set(0xff9d6a); this._hemi.groundColor.set(0x202028);
        this._hemi.intensity = 0.5;
        this._sun.color.set(0xff8a4a); this._sun.intensity = 0.7;
        this._sun.position.set(-6000, 2500, 4000);
        this._sun.castShadow = false;
        this._scene.environmentIntensity = 0.3;
        break;
      default: // night
        this._scene.background = new THREE.Color(0x0d0d1a);
        this._ambient.intensity = 0.55;
        this._hemi.color.set(0x223048); this._hemi.groundColor.set(0x101018);
        this._hemi.intensity = 0.25;
        this._sun.color.set(0xffffff); this._sun.intensity = 1.0;
        this._sun.position.set(3000, 8000, 3000);
        this._sun.castShadow = false;
        this._scene.environmentIntensity = 0.15;
    }
  }

  // Mark every mesh in a subtree as shadow caster + receiver. Flags are
  // ignored while no light casts (night/dusk), so it's safe to set always.
  private _shadowFlags(obj: THREE.Object3D, cast = true, receive = true): void {
    obj.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = cast; m.receiveShadow = receive; }
    });
  }

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

  updateFloor(f: Floor, scene3d?: Scene3D): void {
    if (!this._scene) return;
    this._fw = f.w; this._fd = f.d;
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
    // Stairs sunk below the floor (negative elevation) cut a stairwell
    // opening so the descending flight is visible from above.
    const wellCuts = (f.furniture ?? []).filter(fu =>
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
    const floorMat = new THREE.MeshStandardMaterial({
      color: floorColor, map: floorTex ?? null,
      side: THREE.DoubleSide, roughness: 0.9, metalness: 0.0,
    });
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
    const bgVisible = !!(bg && bg.visible !== false && bg.dataUrl);
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
    const wallMatFor = () => new THREE.MeshStandardMaterial({
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
          const railMat = new THREE.MeshStandardMaterial({
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
    this._terrain = [];
    for (const fu of f.furniture) {
      const grp = this._buildFurniture(fu);
      this._shadowFlags(grp);
      this._floorGroup.add(grp);
      const def = furnitureDef(fu);
      // Stairs and landings are walkable terrain for humanoid targets.
      if (fu.kind === 'stairs' || fu.kind === 'stairs_half' || fu.kind === 'stair_landing') {
        this._terrain.push({
          x: fu.x, y: fu.y, w: fu.w, h: fu.h, rotation: fu.rotation,
          ht: def.ht, elevation: fu.elevation ?? 0, kind: fu.kind,
        });
      }
      // Sittable kinds (def.seat set) become seating anchors for humanoids.
      // Facing: person sits facing away from the backrest — body-local -Z,
      // which is the furniture group's yaw.
      if (def.seat) {
        const c = this._w(fu.x, fu.y, 0);
        this._sitSpots.push({
          x: c.x, z: c.z, seatY: def.seat + (fu.elevation ?? 0),
          facing: -((fu.rotation || 0) * Math.PI / 180),
          r: Math.max(fu.w, fu.h) / 2 + 350,
        });
      }
    }

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
    const closedMat = new THREE.MeshStandardMaterial({
      color: 0x64b5f6, emissive: 0x1565c0, emissiveIntensity: 0.2,
      transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.1,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const openMat = new THREE.MeshStandardMaterial({
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
    const closedMat = new THREE.MeshStandardMaterial({
      color: 0x90a4ae, roughness: 0.65, metalness: 0.1,
    });
    const openMat = new THREE.MeshStandardMaterial({
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
      panel.castShadow = true; panel.receiveShadow = true;
      hinge.add(panel);
      this._doorGroup.add(hinge);
    }
  }

  // Build one furniture group at world (fu.x, fu.y). Local +Z = world +Y
  // (the "front" / backrest side for kinds that have one). `rotation` is
  // screen-CW degrees in the 2D plan; in scene space we negate it because
  // _w mirrors world +X.
  private _buildFurniture(fu: { x: number; y: number; w: number; h: number;
                                 kind?: import('./types.js').FurnitureKind;
                                 rotation?: number; elevation?: number }): THREE.Group {
    const def = furnitureDef(fu);
    const W = fu.w, D = fu.h, HT = def.ht;
    const tint = def.color;
    // Opaque PBR materials. Furniture used to be ~55% transparent, which read
    // as ghostly and produced depth-sort artifacts; with the scene environment
    // map (see _init) opaque standard materials pick up soft reflections and
    // look far more physical for zero per-frame cost.
    const wood = new THREE.MeshStandardMaterial({
      color: tint, metalness: 0.05, roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x2b1d18, roughness: 0.8, metalness: 0.05,
    });
    const cushion = new THREE.MeshStandardMaterial({
      color: tint, roughness: 0.95, metalness: 0.0,
    });
    const pillow = new THREE.MeshStandardMaterial({
      color: 0xeceff1, roughness: 0.9, metalness: 0.0,
    });
    const steel = new THREE.MeshStandardMaterial({
      color: tint, metalness: 0.75, roughness: 0.3,
    });
    const porcelain = new THREE.MeshStandardMaterial({
      color: 0xf5f5f0, metalness: 0.0, roughness: 0.15,
    });
    const screen = new THREE.MeshStandardMaterial({
      color: 0x0a0d12, metalness: 0.4, roughness: 0.12,
    });
    const glass = new THREE.MeshStandardMaterial({
      color: 0xd7e5ea, metalness: 0.1, roughness: 0.05,
      transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide,
    });
    const leaf = new THREE.MeshStandardMaterial({
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

    const kind = fu.kind ?? 'block';
    switch (kind) {
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
        addBox(W, seatY - seatT / 2, D * 0.96, dark, 0, (seatY - seatT / 2) / 2, 0);  // plinth
        addBox(W, seatT, D, cushion, 0, seatY, 0);
        // Seat cushion seams (one per ~700 mm of width).
        const seamMat = new THREE.MeshStandardMaterial({ color: 0x1f262b, roughness: 0.95 });
        const nCush = Math.max(2, Math.round(W / 700));
        for (let k = 1; k < nCush; k++) {
          addBox(12, seatT * 0.5, D * 0.9, seamMat, -W / 2 + (W * k) / nCush, seatH2 - seatT * 0.2, -D * 0.02);
        }
        // Back band on +Z.
        const backH = HT - seatH2, backT = D * 0.25;
        addBox(W, backH, backT, cushion, 0, seatH2 + backH / 2, D / 2 - backT / 2);
        // Armrests on -X / +X sides.
        const armW = W * 0.08;
        addBox(armW, HT * 0.85, D, cushion, -W / 2 + armW / 2, HT * 0.85 / 2, 0);
        addBox(armW, HT * 0.85, D, cushion,  W / 2 - armW / 2, HT * 0.85 / 2, 0);
        break;
      }
      case 'bed': {
        // Frame + mattress + blanket + pillows.
        addBox(W + 60, HT * 0.45, D + 60, dark, 0, HT * 0.45 / 2, 0);  // frame/box spring
        addBox(W, HT * 0.6, D, pillow, 0, HT * 0.45 + HT * 0.3, 0);   // mattress (white)
        // Blanket draped over the foot 2/3 of the bed, slightly wider.
        const blanket = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.95 });
        const blD = D * 0.62;
        const bl = new THREE.Mesh(new THREE.BoxGeometry(W + 20, 60, blD), blanket);
        bl.position.set(0, HT * 0.45 + HT * 0.6 - 10, -D / 2 + blD / 2);
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
        const treadMat = new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.6 });
        for (let i = 0; i < n; i++) {
          const hStep = riser * (i + 1);
          addBox(W, hStep, treadD, wood, 0, hStep / 2, -D / 2 + (i + 0.5) * treadD);
          // Tread cap for a visible nosing line.
          addBox(W, 22, treadD, treadMat, 0, hStep - 11, -D / 2 + (i + 0.5) * treadD);
        }
        // Sunk below the floor (descending flight): line the stairwell with
        // dark shaft walls up to floor level so the opening reads as a well.
        if ((fu.elevation ?? 0) < 0) {
          const shaftMat = new THREE.MeshStandardMaterial({
            color: 0x2a2d31, roughness: 0.9, side: THREE.DoubleSide,
          });
          const wellH = -(fu.elevation ?? 0);
          addBox(24, wellH, D, shaftMat, -W / 2 + 12, wellH / 2, 0);
          addBox(24, wellH, D, shaftMat, W / 2 - 12, wellH / 2, 0);
          addBox(W, wellH, 24, shaftMat, 0, wellH / 2, D / 2 - 12);  // wall under the top edge
        }
        break;
      }
      case 'stair_landing': {
        addBox(W, HT - 40, D, wood, 0, (HT - 40) / 2, 0);
        addBox(W * 1.02, 40, D * 1.02,
               new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.6 }),
               0, HT - 20, 0);
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
          ? new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.25, metalness: 0.05 })
          : dark;
        addBox(W * 1.02, 30, D * 1.02, topMat, 0, HT - 15, 0);
        // Proud door / drawer fronts with metal pulls on the front face
        // (-Z). Panels float 8 mm off the carcass so the gaps read as real
        // joinery lines from any angle.
        const panelMat = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.55, metalness: 0.05 });
        const pull = new THREE.MeshStandardMaterial({ color: 0x3a444d, metalness: 0.8, roughness: 0.35 });
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
        addCyl(W * 0.32, W * 0.24, potH, new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.8 }), 0, potH / 2, 0, 12);
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
        const seam = new THREE.MeshStandardMaterial({ color: 0x546069, roughness: 0.6 });
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
        const seam = new THREE.MeshStandardMaterial({ color: 0x546069, roughness: 0.6 });
        addBox(W * 0.9, 12, 6, seam, 0, HT * 0.55, -D / 2 - 2);  // oven door
        break;
      }
      case 'dishwasher': {
        addBox(W, HT, D, steel, 0, HT / 2, 0);
        const seam = new THREE.MeshStandardMaterial({ color: 0x546069, roughness: 0.6 });
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
        const water = new THREE.MeshStandardMaterial({
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
        const headArm = new THREE.MeshStandardMaterial({ color: 0xb9c2c9, metalness: 0.8, roughness: 0.3 });
        addCyl(12, 12, 250, headArm, W * 0.3, HT - 200, D * 0.3, 8);
        const head = new THREE.Mesh(new THREE.SphereGeometry(55, 12, 10), headArm);
        head.position.set(W * 0.3, HT - 320, D * 0.3);
        grp.add(head);
        break;
      }
      default:
        addBox(W, HT, D, wood, 0, HT / 2, 0);
    }
    return grp;
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
        new THREE.MeshStandardMaterial({ color: 0x42a5f5, emissive: 0x0a2340 }),
      );
      tiltGrp.add(mesh);

      // Small forward-pointing nub so heading + tilt are obvious in 3D.
      const nub = new THREE.Mesh(
        new THREE.ConeGeometry(20, 60, 8),
        new THREE.MeshStandardMaterial({ color: 0xbbdefb, emissive: 0x0a2340 }),
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
        new THREE.MeshStandardMaterial({
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
      const mat = new THREE.MeshStandardMaterial({
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
        new THREE.MeshStandardMaterial({
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
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isOn ? color.getHex() : 0x444444,
        emissive: isOn ? color.getHex() : 0x111111,
        emissiveIntensity: isOn ? 0.9 * intensity * flickerMul : 0.05,
        metalness: 0.2, roughness: 0.4,
      });
      const shadeMat = new THREE.MeshStandardMaterial({
        color: 0xeeeeee, emissive: isOn ? color.getHex() : 0x000000,
        emissiveIntensity: isOn ? 0.35 * intensity : 0.0,
        metalness: 0.1, roughness: 0.7,
        transparent: true, opacity: 0.85, side: THREE.DoubleSide,
      });
      const stemMat = new THREE.MeshStandardMaterial({
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
            const housingMat = new THREE.MeshStandardMaterial({
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
              new THREE.MeshStandardMaterial({ color: 0x8d8f94, roughness: 0.4, metalness: 0.5 }));
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
            const chanMat2 = new THREE.MeshStandardMaterial({
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
            const brick = new THREE.MeshStandardMaterial({
              color: 0x4a4442, metalness: 0.05, roughness: 0.9,
            });
            const inner = new THREE.MeshStandardMaterial({
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
              new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.6 }));
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
            const logMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 });
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
                  new THREE.MeshStandardMaterial({
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
                new THREE.MeshStandardMaterial({
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
            const metal = new THREE.MeshStandardMaterial({
              color: 0x8a8f94, metalness: 0.7, roughness: 0.35,
            });
            const bladeMat = new THREE.MeshStandardMaterial({
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
            const plateMat = new THREE.MeshStandardMaterial({
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
            const faceMat = new THREE.MeshStandardMaterial({
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
            const chanMat = new THREE.MeshStandardMaterial({
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
            const orbMat = new THREE.MeshStandardMaterial({
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
            const ringMat = new THREE.MeshStandardMaterial({
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
              new THREE.MeshStandardMaterial({ color: 0x6f7378, metalness: 0.7, roughness: 0.35 }));
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
        new THREE.MeshStandardMaterial({
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
      const wallMat = new THREE.MeshStandardMaterial({
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
        new THREE.MeshStandardMaterial({
          color, emissive: color, emissiveIntensity: h.occupied ? 0.3 : 0.1,
          transparent: true, opacity: h.occupied ? 0.22 : 0.12,
          side: THREE.DoubleSide, depthWrite: false,
        }));
      const p = this._w(h.x, h.y, wallH / 2);
      cyl.position.set(p.x, p.y, p.z);
      this._haloGroup.add(cyl);
    }
  }

  updateTargets(targets: TargetWorld[]): void {
    if (!this._scene) return;
    const now = performance.now() / 1000;
    const seen = new Set<string>();

    for (const t of targets) {
      seen.add(t.key);
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
      const p = this._w(t.x, t.y, 0);

      // First sighting of this target: anchor lastX/Z to the spawn point
      // so the next frame's delta is a real velocity, not the bogus
      // origin-to-spawn vector (which used to lock facing in a wrong
      // direction and make the figure walk backwards).
      if (!h.initialized) {
        h.lastX = p.x; h.lastZ = p.z;
        h.lastUpdate = now;
        h.vx = 0; h.vz = 0;
        h.facing = 0;     // arbitrary; updated as soon as motion is detected
        h.initialized = true;
      }

      // dt is clamped for animation stability, but velocity must divide by
      // the REAL elapsed time — dividing a multi-frame gap's displacement by
      // the clamp (tab resume, slow devices, throttled rAF) overestimates
      // speed several-fold and spikes facing / gait / the sitting detector.
      const dtFull = Math.max(1e-3, now - h.lastUpdate);
      const dt = Math.min(0.1, dtFull);
      h.lastUpdate = now;
      const dx = p.x - h.lastX, dz = p.z - h.lastZ;

      // Low-pass the velocity so brief lerp jitter doesn't whip the body
      // around. Time-constant ~0.25 s.
      if (dt > 0) {
        const ix = dx / dtFull, iz = dz / dtFull;
        const alpha = Math.min(1, dt * 4);
        h.vx = h.vx * (1 - alpha) + ix * alpha;
        h.vz = h.vz * (1 - alpha) + iz * alpha;
      }
      h.lastX = p.x; h.lastZ = p.z;

      // Body-forward in this rig is local -Z (face / toes / leading-leg
      // step land there), so we align local -Z with the velocity vector by
      // negating both atan2 args — equivalent to atan2(vx,vz) + π.
      // Facing EASES toward the heading along the shortest arc instead of
      // snapping — a noisy heading no longer whips the body frame-to-frame.
      // Below ~5 cm/s the heading is noise; hold the previous facing.
      const speedMms = Math.hypot(h.vx, h.vz);

      // ── Seating v1: a target dwelling (near-zero speed) within reach of a
      // sittable piece eases into a seated pose anchored on it; real movement
      // (or the target leaving the seat radius) stands it back up. All checks
      // use the RAW target position `p`, so the visual blend below can't
      // feed back into the dwell/velocity logic.
      const rawSpeedMs = speedMms / 1000;
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

      if (spot && sit > 0.3) {
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

      // Hip swing: opposing legs.
      h.leftHip.rotation.x  = (sinP * amp + idle) * stand + SIT_HIP * sit;
      h.rightHip.rotation.x = (-sinP * amp + idle) * stand + SIT_HIP * sit;

      // Knee bend: leg flexes only while it swings forward (positive sin).
      // Negative rotation = shin folds backward toward butt (anatomical).
      const kneeAmp = 0.9 * ampNorm;
      h.leftKnee.rotation.x  = -Math.max(0, sinP)  * kneeAmp * stand + SIT_KNEE * sit;
      h.rightKnee.rotation.x = -Math.max(0, -sinP) * kneeAmp * stand + SIT_KNEE * sit;

      // Shoulder swing: counter-rotation to same-side hip (right arm with
      // left leg) at ~80% amplitude — full counter-swing read as marching.
      h.leftShoulder.rotation.x  = (-sinP * amp * 0.8 - idle) * stand + SIT_SHOULDER * sit;
      h.rightShoulder.rotation.x = ( sinP * amp * 0.8 - idle) * stand + SIT_SHOULDER * sit;

      // Elbow bend: a constant baseline so arms aren't rigid sticks, plus
      // extra flexion as the arm swings forward.
      h.leftElbow.rotation.x  = (0.25 + Math.max(0, -sinP) * 0.5 * ampNorm) * stand + SIT_ELBOW * sit;
      h.rightElbow.rotation.x = (0.25 + Math.max(0, sinP)  * 0.5 * ampNorm) * stand + SIT_ELBOW * sit;

      // Whole-body English (root rotation order is YXZ: yaw = facing above,
      // pitch = forward lean into the direction of travel, roll = lateral
      // weight sway once per stride). Suppressed while seated.
      h.group.rotation.x = -0.12 * speedNorm * ampNorm * stand;
      h.group.rotation.z = sinP * 0.045 * ampNorm * stand;

      // Breathing — subtle torso rise/fall, always on.
      h.torso.scale.y = 1 + Math.sin(now * 1.8 + h.idleOffset) * 0.012;

      // Spawn ease-in (rig grows up from the floor; also recovers a rig
      // caught mid-despawn when a flickering target re-acquires).
      h.scale += (1 - h.scale) * Math.min(1, dt * 10);
      h.group.scale.setScalar(h.scale);

      // Terrain: figures on stairs/landings stand at the surface height,
      // eased so climbing reads as a glide up the treads rather than pops.
      const gTarget = this._groundYAt(t.x, t.y);
      h.groundY += (gTarget - h.groundY) * Math.min(1, dt * 8);

      // Subtle vertical bob — peaks twice per stride cycle. When seated the
      // root drops so the hip pivot (870 mm in the rig) rests on the seat,
      // and x/z pull onto the seat center.
      const bob = Math.abs(sinP) * 40 * ampNorm;
      const HIP_Y = 870;
      const px2 = spot ? p.x * stand + spot.x * sit : p.x;
      const pz2 = spot ? p.z * stand + spot.z * sit : p.z;
      const py2 = (h.groundY + bob) * stand + (spot ? (spot.seatY - HIP_Y) * sit : 0);
      h.group.position.set(px2, py2, pz2);
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
  }

  // ── Humanoid construction ──────────────────────────────────────────────
  // Stick-figure proportions (mm). Body forward is +Z (default) and is
  // rotated via group.rotation.y to match velocity direction. Each limb is
  // a 2-segment chain so knees / elbows can flex during the walk cycle.
  private _buildHumanoid(color: number): Humanoid {
    const HEAD_R = 110;
    const TORSO_W = 240, TORSO_H = 600, TORSO_D = 140;
    const ARM_UPPER_R = 52, ARM_UPPER_LEN = 320;
    const ARM_LOWER_R = 44, ARM_LOWER_LEN = 280;
    const HAND_R = 58;
    const LEG_UPPER_R = 80, LEG_UPPER_LEN = 430;
    const LEG_LOWER_R = 65, LEG_LOWER_LEN = 380;
    const FOOT_W = 90, FOOT_H = 60, FOOT_D = 230;

    const hipY = LEG_UPPER_LEN + LEG_LOWER_LEN + FOOT_H;
    const torsoY = hipY + TORSO_H / 2;
    const headY = hipY + TORSO_H + HEAD_R + 40;
    const shoulderY = hipY + TORSO_H * 0.88;

    const skin = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.25,
      metalness: 0.1, roughness: 0.6,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x202024, roughness: 0.75, metalness: 0.0,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
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
    this._shadowFlags(root, true, false);  // people cast, don't self-receive

    return {
      group: root,
      color,
      torso,
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
      idleOffset: Math.random() * Math.PI * 2,
      vx: 0, vz: 0,
      lastX: 0, lastZ: 0, lastUpdate: 0, initialized: false,
    };
  }

  private _disposeHumanoid(h: Humanoid): void {
    h.group.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry.dispose();
        if (Array.isArray(m.material)) m.material.forEach(mm => mm.dispose());
        else m.material.dispose();
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
    if (this._bgTexCache) {
      this._bgTexCache.tex.dispose();
      this._bgTexCache = null;
    }
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
    if (this._controls) this._controls.update();
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
