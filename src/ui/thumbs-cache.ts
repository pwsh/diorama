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

const STORE_PREFIX = 'diorama:thumbs:v1';

// The localStorage key folds in the build tag so upgrading invalidates the cache.
export function thumbStoreKey(): string { return `${STORE_PREFIX}:${THUMB_BUILD_TAG}`; }

// Stable per-descriptor cache key (custom folds the recipe hash → repaints on edit).
export function thumbCacheKey(d: ThumbDesc): string {
  switch (d.type) {
    case 'furniture': return `f:${d.kind}`;
    case 'light': return `l:${d.kind}`;
    case 'custom': return `c:${d.id}:${d.hash}`;
    case 'glyph': return `g:${d.glyph}`;
  }
}

export function loadThumbCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(thumbStoreKey());
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj as Record<string, string> : {};
  } catch { return {}; }
}

// Persist the whole map (called after each successful 3D capture). Best-effort:
// swallows quota / disabled-storage errors like the rest of the codebase.
export function saveThumbCache(map: Record<string, string>): void {
  try { localStorage.setItem(thumbStoreKey(), JSON.stringify(map)); } catch { /* ignore */ }
}

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
