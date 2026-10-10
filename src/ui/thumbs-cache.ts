// Thumbnail cache + 2D glyph rendering — PURE (no three.js, headless-safe).
// Split out of thumbs.ts so the toolbar-test can exercise the fallback path and
// cache keying without pulling the renderer chunk.
import type { ThumbDesc } from './tool-arm.js';

// Cache generation key — bumps on every app upgrade so stale thumbnails from a
// prior build regenerate. __DIORAMA_VERSION__ is compiled in for the real app;
// the test harness (no define) falls back to 'dev'.
export const THUMB_BUILD_TAG: string = (() => {
  try {
    return typeof __DIORAMA_VERSION__ !== 'undefined' ? __DIORAMA_VERSION__ : 'dev';
  } catch { return 'dev'; }
})();

// Every thumbnail store key starts with this family prefix (any version).
const STORE_FAMILY = 'diorama:thumbs:';
// Schema/salt: bump to invalidate every persisted capture regardless of build
// tag. v2 (2026-09): the hidden renderer used to keep the LAST light capture's
// light group alive, so furniture/custom/vehicle thumbnails captured after a
// light card baked that light (and its floor pool) in — those are all suspect.
const STORE_PREFIX = `${STORE_FAMILY}v2`;

// Upper bound on the serialized cache (UTF-16 chars ≈ what localStorage quotas
// count). The origin shares ~5M chars with `diorama:store:v1`, the offline/demo
// config registry and every device-local pref; an uncapped PNG-dataURL map
// (≈10–25 kB per card, 700+ possible cards, never pruned across builds) could
// fill it and then SILENTLY break the store writes that matter.
export const THUMB_CACHE_MAX_CHARS = 1_500_000;

// The localStorage key folds in the build tag so upgrading invalidates the cache.
export function thumbStoreKey(): string { return `${STORE_PREFIX}:${THUMB_BUILD_TAG}`; }

// Stable per-descriptor cache key (custom folds the recipe hash → repaints on edit).
export function thumbCacheKey(d: ThumbDesc): string {
  switch (d.type) {
    case 'furniture': return `f:${d.kind}`;
    case 'light': return `l:${d.kind}`;
    case 'custom': return `c:${d.id}:${d.hash}`;
    // Vehicle-pack model — keyed by pack VERSION (a pack bump re-authors the
    // geometry), the recipe-hash idiom without hashing a whole recipe.
    case 'vehicle': return `veh:${d.id}:${d.ver}`;
    case 'glyph': return `g:${d.glyph}`;
  }
}

// Delete every thumbnail store EXCEPT the current one — older build tags, the
// v1 schema, and any other prefix variant. Previously a key per build tag was
// written and never removed, so each upgrade stranded another full map.
export function pruneStaleThumbStores(storage: Storage = localStorage): number {
  const keep = thumbStoreKey();
  const doomed: string[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(STORE_FAMILY) && k !== keep) doomed.push(k);
    }
    for (const k of doomed) storage.removeItem(k);
  } catch { /* storage disabled — nothing to prune */ }
  return doomed.length;
}

export function loadThumbCache(): Record<string, string> {
  pruneStaleThumbStores();
  try {
    const raw = localStorage.getItem(thumbStoreKey());
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj as Record<string, string> : {};
  } catch { return {}; }
}

// A key's "stem": everything that identifies the SUBJECT, minus the part that
// versions it. A custom object's thumbnail is keyed by recipe hash and a vehicle
// by pack version, so every recipe edit / pack bump used to ADD a variant while
// the stale ones piled up forever. Storing a key evicts its stem-siblings.
export function thumbKeyStem(key: string): string {
  if (key.startsWith('c:') || key.startsWith('veh:')) {
    const cut = key.lastIndexOf(':');
    return cut > key.indexOf(':') ? key.slice(0, cut + 1) : key;
  }
  return key;
}

// Record a capture as the MOST RECENTLY USED entry. The map's insertion order is
// the LRU order (string keys that are not array indices keep insertion order in
// JS objects), so delete-then-set moves a key to the tail.
export function rememberThumb(map: Record<string, string>, key: string, url: string): void {
  const stem = thumbKeyStem(key);
  if (stem !== key) {
    for (const k of Object.keys(map)) if (k !== key && k.startsWith(stem)) delete map[k];
  }
  delete map[key];
  map[key] = url;
}

// Bump an existing entry to most-recently-used (a cache HIT). No-op if absent.
export function touchThumb(map: Record<string, string>, key: string): void {
  if (!(key in map)) return;
  const v = map[key];
  delete map[key];
  map[key] = v;
}

// Evict least-recently-used entries until the serialized map fits `maxChars`.
// Returns the serialized JSON of what remains (so the caller writes it as-is).
export function trimThumbCache(map: Record<string, string>, maxChars = THUMB_CACHE_MAX_CHARS): string {
  let json = JSON.stringify(map);
  if (json.length <= maxChars) return json;
  const keys = Object.keys(map);
  // Per-entry cost ≈ key + value + quoting/colon/comma; evict from the head.
  let size = json.length;
  for (const k of keys) {
    if (size <= maxChars) break;
    size -= k.length + map[k].length + 6;
    delete map[k];
  }
  json = JSON.stringify(map);
  // The estimate is exact for plain ASCII; loop once more for pathological keys.
  while (json.length > maxChars && Object.keys(map).length) {
    delete map[Object.keys(map)[0]];
    json = JSON.stringify(map);
  }
  return json;
}

// Once a write has hit the quota, stop persisting for this session: retrying
// every capture would thrash storage and still fail.
let _persistDisabled = false;

// Persist the map (called after each drained capture batch). Best-effort, but
// QUOTA-SAFE: the map is LRU-trimmed to THUMB_CACHE_MAX_CHARS first, and if the
// write still throws (quota exceeded, storage disabled) the persisted copy is
// DROPPED entirely so thumbnails can never be what starves the store writes.
// The in-memory map keeps working for the session either way.
export function saveThumbCache(map: Record<string, string>): void {
  if (_persistDisabled) return;
  const key = thumbStoreKey();
  let json: string;
  try { json = trimThumbCache(map); } catch { return; }
  try { localStorage.setItem(key, json); }
  catch {
    _persistDisabled = true;
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}

/** Test hook: re-enable persistence after a simulated quota failure. */
export function _resetThumbPersistForTest(): void { _persistDisabled = false; }

// Draw an emoji/glyph tile → PNG dataURL. Used as the placeholder while a 3D
// capture is pending AND as the permanent thumbnail for cards where a 3D
// snapshot is meaningless (fixtures / structure / ground). Never throws.
export function glyphDataURL(glyph: string, size = 128, opts?: { dim?: boolean; label?: string }): string {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    if (!ctx) return '';
    // Rounded card background.
    ctx.fillStyle = opts?.dim ? '#141c26' : '#1b2734';
    roundRect(ctx, 2, 2, size - 4, size - 4, 10);
    ctx.fill();
    ctx.globalAlpha = opts?.dim ? 0.45 : 1;
    ctx.font = `${Math.round(size * 0.5)}px "Noto Color Emoji", "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(glyph || '▦', size / 2, size * 0.5);
    ctx.globalAlpha = 1;
    return c.toDataURL('image/png');
  } catch { return ''; }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
