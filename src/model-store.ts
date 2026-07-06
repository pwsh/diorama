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

export async function saveModel(floorId: string, blob: ModelBlob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, floorId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadModel(floorId: string): Promise<ModelBlob | null> {
  const db = await openDb();
  const out = await new Promise<ModelBlob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(floorId);
    req.onsuccess = () => resolve((req.result as ModelBlob) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return out;
}

export async function deleteModel(floorId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(floorId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
