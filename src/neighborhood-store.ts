// IndexedDB cache for OpenFreeMap vector tiles (the neighborhood overlay).
// Mirrors model-store.ts / avatar-store.ts exactly (same openDb/get/put shape),
// its OWN database so a rebuild never touches the model/avatar stores. Raw tile
// bytes are far too large for HA user_data; a house's block never moves, so a
// generous 30-day TTL (OpenFreeMap refreshes its planet weekly) keeps the free
// service from being re-hammered. clearNeighborhoodTiles() backs a future
// Settings "reset cache" button.

const DB_NAME = 'diorama-tiles';
const STORE = 'tiles';

export const TILE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CachedTile {
  bytes: ArrayBuffer;
  fetchedAt: number;
}

// Cache key: `z/x/y@source` (PIN) — the source segregates openfreemap vs a
// custom endpoint so switching sources never serves the wrong tiles.
export function tileCacheKey(source: string, z: number, x: number, y: number): string {
  return `${z}/${x}/${y}@${source}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Open → run → ALWAYS close, including when the transaction rejects. A
// close() skipped on the error path leaks the connection for the page's
// lifetime (and blocks any future onupgradeneeded version change).
async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  const db = await openDb();
  try { return await fn(db); } finally { db.close(); }
}

// Read a cached tile. Returns null on a miss OR when the entry is older than
// `ttlMs` (default 30 days) — the TTL check is on READ so a stale tile is
// transparently refetched. Never throws (IDB failure → null).
export async function getTile(key: string, ttlMs: number = TILE_TTL_MS): Promise<CachedTile | null> {
  try {
    const out = await withDb(db => new Promise<CachedTile | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as CachedTile) ?? null);
      req.onerror = () => reject(req.error);
    }));
    if (!out) return null;
    if (typeof out.fetchedAt !== 'number' || (Date.now() - out.fetchedAt) > ttlMs) return null;
    return out;
  } catch {
    return null;
  }
}

export async function putTile(key: string, tile: CachedTile): Promise<void> {
  try {
    await withDb(db => new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(tile, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  } catch {
    /* cache write is best-effort — never throw into the fetch path */
  }
}

export async function clearNeighborhoodTiles(): Promise<void> {
  try {
    await withDb(db => new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  } catch {
    /* ignore */
  }
}
