// ── Device-local viewport persistence (2D pan/zoom + 3D camera pose) ────────
//
// PURE + ZERO imports (the geo.ts / trilateration.ts / flights.ts idiom) so the
// test page can transpile this file standalone and so nothing here can drag a
// heavyweight module into either bundle. The only I/O is through the tiny
// `ViewStorage` seam below — callers pass `localStorage` (or a fake in tests),
// and every access is try/catch-guarded so a locked / full / disabled storage
// can never break a render loop.
//
// WHY device-local (localStorage, NOT the synced HA store): a viewport is a
// property of the SCREEN you are sitting at, not of the plan. A wall tablet
// framed on the kitchen and a desktop framed on the whole house must not fight,
// and `Planner.save()` deliberately no-ops outside edit mode — kiosk devices
// must be able to remember their view anyway. Same precedent as
// `diorama:view` (2D/3D preference) and `diorama:token`.
//
// Entries are keyed by `{configId, floorId}` and are SINGLE-SLOT (the last
// viewport used). A different config or a different floor simply doesn't match
// and the caller falls back to its default framing — which is why switching /
// importing / creating a config needs no invalidation pass: the new config's id
// never matches the stored one.

/** localStorage key of the saved 2D pan/zoom entry. */
export const VIEW2D_KEY = 'diorama:view2d';
/** localStorage key of the saved 3D camera pose entry. */
export const VIEW3D_KEY = 'diorama:cam3d';

/** The 2D zoom multiplier clamp the canvas gesture handlers enforce. */
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 20;

// ── Floor-fit guards (shared with the floor-switch retention rules) ─────────
// World mm coordinates are SHARED across stacked stories — the ghost-floor /
// 2D peek machinery depends on identical world coords landing at identical
// positions — so a floor switch does NOT change the coordinate frame; floors
// differ only in rect SIZE. That's why `switchFloor` retains pan/zoom, and it's
// the same reasoning that lets a saved viewport be restored on reload.

/**
 * How far outside a floor's `0..w × 0..d` rect a retained 2D `viewCenter` (or a
 * restored 3D camera target) may land before it's considered stale. Inflated by
 * this fraction of the LARGER dimension on every side, so a modestly-offset
 * centre survives but one from a wildly different plan can't strand the user on
 * blank canvas.
 */
export const VIEW_RETAIN_MARGIN_FRAC = 0.5;

/**
 * Does a retained 2D pan centre still make sense on a floor of `w × d` mm?
 * True while it lies inside the floor rect inflated by
 * `VIEW_RETAIN_MARGIN_FRAC · max(w, d)` on every side.
 */
export function viewCenterFitsFloor(w: number, d: number, cx: number, cy: number): boolean {
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return false;
  const m = VIEW_RETAIN_MARGIN_FRAC * Math.max(w, d);
  return cx >= -m && cx <= w + m && cy >= -m && cy <= d + m;
}

/**
 * The 3D analogue of `viewCenterFitsFloor`, in SCENE coordinates. The renderer
 * maps world (wx, wy) → scene (fw/2 − wx, h, wy − fd/2), so the floor rect
 * occupies scene x ∈ [−fw/2, +fw/2], z ∈ [−fd/2, +fd/2] — the guard is the same
 * inflated-rect test recentred on the origin. `ty` is only checked for
 * finiteness (a camera legitimately looks at any height).
 */
export function camTargetFitsFloor(fw: number, fd: number, tx: number, tz: number): boolean {
  if (!Number.isFinite(tx) || !Number.isFinite(tz)) return false;
  const m = VIEW_RETAIN_MARGIN_FRAC * Math.max(fw, fd);
  return Math.abs(tx) <= fw / 2 + m && Math.abs(tz) <= fd / 2 + m;
}

// ── Entry shapes ────────────────────────────────────────────────────────────

export interface SavedView2d {
  configId: string;
  floorId: string;
  /** world-mm point shown at canvas centre */
  cx: number;
  cy: number;
  /** multiplier over the fit-to-canvas base scale */
  zoom: number;
}

export interface SavedCam3d {
  configId: string;
  floorId: string;
  /** scene-space camera position */
  pos: [number, number, number];
  /** scene-space orbit target */
  target: [number, number, number];
}

/** The `localStorage` subset used here (so tests can pass a Map-backed fake). */
export interface ViewStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** `localStorage` when it exists and is reachable, else null. Never throws. */
export function browserViewStorage(): ViewStorage | null {
  try {
    // Safari in private mode can throw on ACCESS, not just on write.
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch { return null; }
}

// ── Parse / validate (pure) ─────────────────────────────────────────────────

function isVec3(v: unknown): v is [number, number, number] {
  return Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number' && Number.isFinite(n));
}

function nonEmpty(s: unknown): s is string {
  return typeof s === 'string' && s.length > 0;
}

/** Parse a stored 2D entry. Returns null for anything malformed. */
export function parseSavedView2d(raw: string | null | undefined): SavedView2d | null {
  if (!nonEmpty(raw)) return null;
  let o: unknown;
  try { o = JSON.parse(raw); } catch { return null; }
  if (!o || typeof o !== 'object') return null;
  const e = o as Record<string, unknown>;
  if (!nonEmpty(e.configId) || !nonEmpty(e.floorId)) return null;
  const { cx, cy, zoom } = e as { cx: unknown; cy: unknown; zoom: unknown };
  if (typeof cx !== 'number' || !Number.isFinite(cx)) return null;
  if (typeof cy !== 'number' || !Number.isFinite(cy)) return null;
  if (typeof zoom !== 'number' || !Number.isFinite(zoom)) return null;
  if (zoom < ZOOM_MIN || zoom > ZOOM_MAX) return null;
  return { configId: e.configId, floorId: e.floorId, cx, cy, zoom };
}

/** Parse a stored 3D entry. Returns null for anything malformed. */
export function parseSavedCam3d(raw: string | null | undefined): SavedCam3d | null {
  if (!nonEmpty(raw)) return null;
  let o: unknown;
  try { o = JSON.parse(raw); } catch { return null; }
  if (!o || typeof o !== 'object') return null;
  const e = o as Record<string, unknown>;
  if (!nonEmpty(e.configId) || !nonEmpty(e.floorId)) return null;
  if (!isVec3(e.pos) || !isVec3(e.target)) return null;
  const pos = e.pos, target = e.target;
  // A degenerate pose (camera sitting exactly on its target) has no orbit basis
  // — OrbitControls would produce NaNs from it.
  const dx = pos[0] - target[0], dy = pos[1] - target[1], dz = pos[2] - target[2];
  if (Math.hypot(dx, dy, dz) < 1) return null;
  return { configId: e.configId, floorId: e.floorId, pos, target };
}

// ── Load / save (storage-seam, never throws) ────────────────────────────────

/**
 * The saved 2D viewport for THIS config + floor, or null when there is none,
 * it belongs to another config/floor, it is malformed, or the centre no longer
 * fits the floor rect (`viewCenterFitsFloor` — the same guard `switchFloor`
 * uses when retaining a pan across stories).
 */
export function loadView2d(
  storage: ViewStorage | null | undefined,
  configId: string, floorId: string, w: number, d: number,
): { cx: number; cy: number; zoom: number } | null {
  if (!storage) return null;
  let raw: string | null = null;
  try { raw = storage.getItem(VIEW2D_KEY); } catch { return null; }
  const e = parseSavedView2d(raw);
  if (!e) return null;
  if (e.configId !== configId || e.floorId !== floorId) return null;
  if (!viewCenterFitsFloor(w, d, e.cx, e.cy)) return null;
  return { cx: e.cx, cy: e.cy, zoom: e.zoom };
}

/** Write (or, with `entry === null`, REMOVE) the saved 2D viewport. */
export function saveView2d(storage: ViewStorage | null | undefined, entry: SavedView2d | null): void {
  if (!storage) return;
  try {
    if (!entry) { storage.removeItem(VIEW2D_KEY); return; }
    storage.setItem(VIEW2D_KEY, JSON.stringify(entry));
  } catch { /* quota / private mode — a viewport is never worth throwing over */ }
}

/**
 * The saved 3D camera pose for THIS config + floor, or null when there is none,
 * it belongs to another config/floor, it is malformed, or its orbit target no
 * longer sits near the floor rect (`camTargetFitsFloor`).
 */
export function loadCam3d(
  storage: ViewStorage | null | undefined,
  configId: string, floorId: string, fw: number, fd: number,
): { pos: [number, number, number]; target: [number, number, number] } | null {
  if (!storage) return null;
  let raw: string | null = null;
  try { raw = storage.getItem(VIEW3D_KEY); } catch { return null; }
  const e = parseSavedCam3d(raw);
  if (!e) return null;
  if (e.configId !== configId || e.floorId !== floorId) return null;
  if (!camTargetFitsFloor(fw, fd, e.target[0], e.target[2])) return null;
  return { pos: e.pos, target: e.target };
}

/** Write (or, with `entry === null`, REMOVE) the saved 3D camera pose. */
export function saveCam3d(storage: ViewStorage | null | undefined, entry: SavedCam3d | null): void {
  if (!storage) return;
  try {
    if (!entry) { storage.removeItem(VIEW3D_KEY); return; }
    storage.setItem(VIEW3D_KEY, JSON.stringify(entry));
  } catch { /* quota / private mode */ }
}

// ── Boot camera pose decision (pure) ────────────────────────────────────────
// The whole precedence + re-framing policy for the 3D view's startup pose,
// lifted out of three-view so it can be tested without lit or three.js. The
// caller supplies the already-resolved saved pose (it owns storage + the
// "config registry has loaded" gate) and simply EXECUTES what comes back.

export type BootPreset = 'iso' | 'sims';

export interface BootPoseInput {
  /** a URL / card `cam=` or `view3d=` template exists — it owns the pose */
  hasTemplate: boolean;
  /** the user has posed the camera by hand (gesture or a view-bar click) */
  userPosed: boolean;
  /** device-local saved pose already validated for this config + floor, else null */
  saved: { pos: [number, number, number]; target: [number, number, number] } | null;
  /** `${floorId}|${w}|${d}` of the floor as it stands RIGHT NOW */
  floorKey: string;
  /** the floorKey the default framing was last computed for ('' = never) */
  framedKey: string;
  /** ms since the boot latch armed */
  elapsedMs: number;
  /** how long the latch may keep re-framing */
  windowMs: number;
  /** a card forced Sims cam → its dimetric pose IS the default framing */
  simsDefault: boolean;
}

export interface BootPoseDecision {
  /** apply this camera pose verbatim (wins over `framePreset`) */
  restore: { pos: [number, number, number]; target: [number, number, number] } | null;
  /** apply this view preset (default framing), or null for "leave the camera" */
  framePreset: BootPreset | null;
  /** the floorKey to remember as framed (unchanged when framePreset is null) */
  framedKey: string;
  /** close the latch — never pose the camera at boot again */
  done: boolean;
}

/**
 * Resolve the startup camera pose. Precedence, highest first:
 *   1. a URL / card `cam=` / `view3d=` template  (kiosk links must keep working)
 *   2. a hand gesture / view-bar click already posed the camera
 *   3. the device-local saved pose for this config + floor
 *   4. the default framing (`iso`, or `sims` when a card forced Sims cam),
 *      RE-APPLIED whenever the floor rect changes inside the boot window —
 *      the store is served from cache first and replaced when HA's
 *      authoritative body lands, so the rect legitimately changes under the
 *      first framing.
 */
export function resolveBootPose(i: BootPoseInput): BootPoseDecision {
  const idle = (done: boolean): BootPoseDecision =>
    ({ restore: null, framePreset: null, framedKey: i.framedKey, done });
  if (i.hasTemplate) return idle(true);
  if (i.userPosed) return idle(true);
  if (i.saved) return { restore: i.saved, framePreset: null, framedKey: i.framedKey, done: true };
  const expired = i.elapsedMs > i.windowMs;
  if (i.floorKey !== i.framedKey) {
    return {
      restore: null,
      framePreset: i.simsDefault ? 'sims' : 'iso',
      framedKey: i.floorKey,
      done: expired,
    };
  }
  return idle(expired);
}
