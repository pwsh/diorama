// IndexedDB storage for imported 3D model text (OBJ + optional MTL).
// Sweet Home 3D exports run multiple MB — far too large for HA's
// frontend.user_data (JSON in the HA database) or localStorage (~5 MB
// quota). IDB is local to the browser; the Floor.model3d metadata in the
// regular store records that a model *should* exist so other devices can
// prompt for re-import.

const DB_NAME = 'diorama-models';
const STORE = 'models';

export interface ModelBlob {
  obj: string;
  mtl: string | null;
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

export async function saveModel(floorId: string, blob: ModelBlob): Promise<void> {
  await withDb(db => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, floorId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

export async function loadModel(floorId: string): Promise<ModelBlob | null> {
  const out = await withDb(db => new Promise<ModelBlob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(floorId);
    req.onsuccess = () => resolve((req.result as ModelBlob) ?? null);
    req.onerror = () => reject(req.error);
  }));
  return out;
}

export async function deleteModel(floorId: string): Promise<void> {
  await withDb(db => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(floorId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}
