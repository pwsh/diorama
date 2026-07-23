// In-memory stand-in for src/neighborhood-store.ts, swapped into the planner
// bundle for neighborhood-test.html (IndexedDB does not complete under the
// headless --virtual-time-budget harness — same reason config-test swaps
// avatar-store). A module-level Map is a singleton across Planner instances, so
// a fresh Planner sharing this store exercises the cross-session IDB-hit path.
// A globalThis hook lets the test age entries (to force TTL expiry) + inspect it.

const mem = new Map<string, { bytes: ArrayBuffer; fetchedAt: number }>();

export const TILE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function tileCacheKey(source: string, z: number, x: number, y: number): string {
  return `${z}/${x}/${y}@${source}`;
}

export async function getTile(key: string, ttlMs: number = TILE_TTL_MS): Promise<{ bytes: ArrayBuffer; fetchedAt: number } | null> {
  const o = mem.get(key);
  if (!o) return null;
  if (Date.now() - o.fetchedAt > ttlMs) return null;
  return o;
}

export async function putTile(key: string, tile: { bytes: ArrayBuffer; fetchedAt: number }): Promise<void> {
  mem.set(key, tile);
}

export async function clearNeighborhoodTiles(): Promise<void> {
  mem.clear();
}

// Test controls (not part of the real module).
(globalThis as unknown as { __nbhdStore: unknown }).__nbhdStore = {
  ageAll: (ms: number) => { for (const v of mem.values()) v.fetchedAt -= ms; },
  size: () => mem.size,
  clear: () => mem.clear(),
};
