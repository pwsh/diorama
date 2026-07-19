// Lazy 3D thumbnail service for the visual toolbar.
//
// Renders each furniture / light / custom-object card through the REAL renderer
// (the same one the 3D view uses) into a hidden 128×128 canvas → dataURL, cached
// in memory + localStorage (keyed by build tag). Everything else (fixtures /
// structure / ground) uses a flat 2D glyph tile. The renderer chunk is loaded
// LAZILY via a dynamic `import('../three-renderer.js')` (NEVER a static import —
// the lazy-3D-chunk rule; copies three-view.ts's idiom) so 2D-only startup never
// downloads three.js. If the import or WebGL fails, every card falls back to a
// glyph tile — never blank, never throws.
import type { ThreeDRenderer } from '../three-renderer.js';   // type-only (erased)
import type { ThumbDesc } from './tool-arm.js';
import type { Floor, Scene3D, ObjectRecipe } from '../types.js';
import { FURNITURE_KINDS } from '../geometry.js';
import {
  glyphDataURL, thumbCacheKey, loadThumbCache, saveThumbCache,
} from './thumbs-cache.js';

const PX = 128;
const DAY: Scene3D = { preset: 'day', floorColor: '#8a7860', floorTex: 'none', wallColor: '#cfd2d6', wallCutaway: false } as Scene3D;

// A minimal fake floor (mirrors the docs-gallery capture scaffolding). Only the
// arrays the renderer touches during a single-piece build are populated.
function baseFloor(w = 6000, d = 6000): Floor {
  return {
    id: 'thumb', name: 'T', w, d,
    walls: [], furniture: [], lights: [], switches: [], sensors: [], motionSensors: [],
    envSensors: [], doors: [], windows: [], rooms: [], groundAreas: [], presenceZones: [],
  } as unknown as Floor;
}
const nullState = () => null;

interface GetCtx { customObjects?: ObjectRecipe[] }

class ThumbService {
  private _mem = new Map<string, string>();          // key → dataURL ('' = capturing)
  private _persist: Record<string, string> = loadThumbCache();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _R: any = null;                             // ThreeDRenderer (internals via any)
  private _host: HTMLDivElement | null = null;
  private _webglOk = true;
  private _initPromise: Promise<boolean> | null = null;
  private _queue: { desc: ThumbDesc; ctx?: GetCtx; onReady: () => void }[] = [];
  private _draining = false;

  // Return a dataURL immediately: the cached 3D capture if ready, else a glyph
  // placeholder — and schedule a 3D capture (once) for descriptors that warrant
  // one. `onReady` fires when the real capture lands so the toolbar re-renders.
  get(desc: ThumbDesc, glyph: string, onReady: () => void, ctx?: GetCtx): string {
    const key = thumbCacheKey(desc);
    const hit = this._mem.get(key) ?? this._persist[key];
    if (hit) return hit;
    // Glyph descriptors (fixtures / structure / ground) never need 3D.
    if (desc.type === 'glyph') {
      const g = glyphDataURL(desc.glyph, PX);
      this._mem.set(key, g);
      return g;
    }
    // 3D-capable descriptor: schedule a capture if WebGL is available and we
    // aren't already working on this key.
    if (this._webglOk && !this._mem.has(key)) {
      this._mem.set(key, '');                          // mark in-flight
      this._queue.push({ desc, ctx, onReady });
      this._drain();
    }
    return glyphDataURL(glyph, PX, { dim: true });      // dim = "loading" placeholder
  }

  private async _ensure(): Promise<boolean> {
    if (this._R) return true;
    if (!this._webglOk) return false;
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      try {
        // Static-string dynamic import → Vite code-splits it into the SAME chunk
        // three-view.ts loads (three.js stays out of the startup bundle).
        const mod = await import('../three-renderer.js');
        const host = document.createElement('div');
        host.style.cssText =
          'position:fixed;left:-99999px;top:0;width:128px;height:128px;pointer-events:none;opacity:0';
        document.body.appendChild(host);
        const R = new mod.ThreeDRenderer(host, { preserveDrawingBuffer: true }) as ThreeDRenderer;
        await R.load();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const RA = R as any;
        if (!RA.loaded || !RA._renderer) throw new Error('renderer failed to load');
        if (RA._controls) RA._controls.enableDamping = false;
        this._R = RA;
        this._host = host;
        return true;
      } catch (err) {
        console.warn('thumbnail renderer unavailable, using glyphs:', err);
        this._webglOk = false;
        this._R = null;
        return false;
      }
    })();
    return this._initPromise;
  }

  // Drain the capture queue a couple items per animation frame so a freshly
  // opened tab of ~30 furniture cards never janks.
  private _drain(): void {
    if (this._draining) return;
    this._draining = true;
    const step = async () => {
      const ok = await this._ensure();
      if (!ok) {
        // WebGL denied — flush the queue to glyphs so the placeholders settle.
        for (const job of this._queue.splice(0)) {
          const g = this._fallback(job.desc);
          this._mem.set(thumbCacheKey(job.desc), g);
          job.onReady();
        }
        this._draining = false;
        return;
      }
      const batch = this._queue.splice(0, 2);
      for (const job of batch) {
        const key = thumbCacheKey(job.desc);
        let url = '';
        try { url = this._capture(job.desc, job.ctx); } catch { url = ''; }
        if (!url) url = this._fallback(job.desc);
        this._mem.set(key, url);
        this._persist[key] = url;
        job.onReady();
      }
      if (this._queue.length) {
        raf(step);
      } else {
        saveThumbCache(this._persist);
        this._draining = false;
      }
    };
    raf(step);
  }

  private _fallback(desc: ThumbDesc): string {
    const g = desc.type === 'furniture' ? (FURNITURE_KINDS[desc.kind]?.label ? '🪑' : '▦')
      : desc.type === 'light' ? '💡'
      : desc.type === 'custom' ? '🧩' : '▦';
    return glyphDataURL(g, PX);
  }

  // ── One synchronous capture (scene setup → render → toDataURL) ────────────────
  private _capture(desc: ThumbDesc, ctx?: GetCtx): string {
    const R = this._R;
    if (desc.type === 'furniture') return this._captureFurniture(desc.kind);
    if (desc.type === 'light') return this._captureLight(desc.kind);
    if (desc.type === 'custom') {
      const recipe = (ctx?.customObjects ?? []).find(o => o.id === desc.id);
      if (!recipe) return '';
      return this._captureCustom(recipe);
    }
    void R;
    return '';
  }

  private _captureFurniture(kind: string): string {
    const def = FURNITURE_KINDS[kind as keyof typeof FURNITURE_KINDS];
    if (!def) return '';
    const f = baseFloor();
    f.furniture = [{ id: 'it', x: f.w / 2, y: f.d / 2, w: def.w, h: def.h, kind, rotation: 0 } as unknown as Floor['furniture'][number]];
    this._R.updateFloor(f, DAY, undefined, undefined, nullState);
    const target: [number, number, number] = [0, Math.min(def.ht * 0.5, 850), 0];
    const radius = Math.max(def.w, def.h) * 1.5 + def.ht * 0.9 + 1400;
    this._orbit(target, radius, 22, Math.PI - 0.6);   // 3/4 view onto the functional front
    return this._readback();
  }

  private _captureCustom(recipe: ObjectRecipe): string {
    const f = baseFloor();
    const w = recipe.w ?? 800, h = recipe.h ?? 800, ht = recipe.ht ?? 800;
    f.furniture = [{
      id: 'it', x: f.w / 2, y: f.d / 2, w, h, kind: 'block',
      customKindId: recipe.id, rotation: 0,
    } as unknown as Floor['furniture'][number]];
    this._R.updateFloor(f, DAY, undefined, [recipe], nullState);
    const target: [number, number, number] = [0, Math.min(ht * 0.5, 850), 0];
    const radius = Math.max(w, h) * 1.5 + ht * 0.9 + 1400;
    this._orbit(target, radius, 22, Math.PI - 0.6);
    return this._readback();
  }

  private _captureLight(kind: string): string {
    const f = baseFloor(5000, 5000);
    // A two-wall corner so wall-mounted kinds (sconce/step/flood) have a surface.
    f.walls = [
      { id: 'wb', points: [{ x: 400, y: 600 }, { x: 4600, y: 600 }] },
      { id: 'ws', points: [{ x: 400, y: 600 }, { x: 400, y: 4600 }] },
    ] as unknown as Floor['walls'];
    const wallMount = kind === 'sconce' || kind === 'wall_sconce' || kind === 'step' ||
      kind === 'flood' || kind === 'exhaust_wall';
    const lx = wallMount ? 2400 : f.w / 2;
    const ly = wallMount ? 600 : f.d / 2;
    const rotation = (kind === 'fireplace' || kind === 'sconce') ? 180 : 0;
    f.lights = [{
      id: 'l', x: lx, y: ly, entity_id: 'light.demo', iconKind: kind, rotation, label: '', length: 1600,
    } as unknown as Floor['lights'][number]];
    const preset: Scene3D = kind === 'fireplace'
      ? { preset: 'night', floorColor: '#2f333c', wallColor: '#6c7686', wallCutaway: false } as Scene3D
      : { preset: 'dusk', floorColor: '#4a4640', floorTex: 'wood', wallColor: '#c2c8d0', wallCutaway: false } as Scene3D;
    this._R.updateFloor(f, preset, undefined, undefined, nullState);
    this._R.updateLightsSwitches(f.lights, [], () => ({ state: 'on', attributes: { brightness: 255 } }));
    // Camera on the room side so the fixture reads against the corner (mirrors capLight).
    this._orbit([0, 1200, 0], 6800, 22, Math.PI * 1.86);
    return this._readback();
  }

  private _orbit(target: [number, number, number], radius: number, elevDeg: number, aziRad: number): void {
    const el = (elevDeg * Math.PI) / 180;
    const y = target[1] + radius * Math.sin(el);
    const hor = radius * Math.cos(el);
    this._R.setCameraView(
      [target[0] + hor * Math.sin(aziRad), y, target[2] + hor * Math.cos(aziRad)], target);
  }

  private _readback(): string {
    // Render synchronously (the renderer's own RAF would otherwise race the
    // readback) and pull the pixels — preserveDrawingBuffer makes toDataURL safe.
    this._R._renderer.render(this._R._scene, this._R._camera);
    return this._R._renderer.domElement.toDataURL('image/png');
  }
}

function raf(fn: () => void): void {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fn);
  else setTimeout(fn, 16);
}

export const thumbs = new ThumbService();
