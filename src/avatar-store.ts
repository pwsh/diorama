// IndexedDB storage for USER-IMPORTED avatar packs (raw JSON text).
// Mirrors src/model-store.ts in style. Imported pack JSON can be large-ish and
// is device-local (like imported OBJ models) — the HA-synced Store only carries
// the tiny per-pack config record (loaded/active/members), never the pack body.
// db `diorama-avatars`, store `packs`, key = pack id, value = raw JSON string.

import type { AvatarPackDef } from './avatars.js';

const DB_NAME = 'diorama-avatars';
const STORE = 'packs';

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

export async function savePackJson(id: string, json: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(json, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadPackJson(id: string): Promise<string | null> {
  const db = await openDb();
  const out = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return out;
}

export async function deletePackJson(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listPackIds(): Promise<string[]> {
  const db = await openDb();
  const out = await new Promise<string[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(k => String(k)));
    req.onerror = () => reject(req.error);
  });
  db.close();
  return out;
}

// Read every stored user pack as { id, json }. Used by planner hydration.
export async function loadAllPacks(): Promise<{ id: string; json: string }[]> {
  const db = await openDb();
  const out = await new Promise<{ id: string; json: string }[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const keysReq = store.getAllKeys();
    const valsReq = store.getAll();
    tx.oncomplete = () => {
      const keys = keysReq.result as IDBValidKey[];
      const vals = valsReq.result as string[];
      resolve(keys.map((k, i) => ({ id: String(k), json: vals[i] })));
    };
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return out;
}

// ── Pack JSON validation ────────────────────────────────────────────────────
// Pure, deterministic, no IDB — safe to import in a test page and at import time
// in the settings drawer. Rejects with a readable one-line error rather than
// throwing, so a malformed import never crashes the panel.
export interface PackValidation { ok: boolean; pack?: AvatarPackDef; error?: string }

export function validatePackJson(raw: unknown): PackValidation {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Not a JSON object.' };
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id.trim()) return { ok: false, error: 'Missing "id" (string).' };
  if (o.id === 'core') return { ok: false, error: '"core" is a reserved pack id.' };
  if (typeof o.label !== 'string' || !o.label.trim()) return { ok: false, error: 'Missing "label" (string).' };
  if (typeof o.version !== 'number' || !isFinite(o.version)) return { ok: false, error: 'Missing "version" (number).' };
  if (!Array.isArray(o.path) || !o.path.every(s => typeof s === 'string')) {
    return { ok: false, error: '"path" must be an array of strings.' };
  }
  if (!Array.isArray(o.avatars) || o.avatars.length === 0) {
    return { ok: false, error: '"avatars" must be a non-empty array.' };
  }
  for (let i = 0; i < o.avatars.length; i++) {
    const a = o.avatars[i];
    if (a == null || typeof a !== 'object' || Array.isArray(a)) {
      return { ok: false, error: `avatars[${i}] is not an object.` };
    }
    const av = a as Record<string, unknown>;
    if (typeof av.id !== 'string' || !av.id.trim()) return { ok: false, error: `avatars[${i}] missing "id".` };
    if (typeof av.label !== 'string' || !av.label.trim()) {
      return { ok: false, error: `avatars[${i}] ("${av.id}") missing "label".` };
    }
    if (av.rig !== 'humanoid' && av.rig !== 'quadruped') {
      return { ok: false, error: `avatars[${i}] ("${av.id}") "rig" must be "humanoid" or "quadruped".` };
    }
  }
  return { ok: true, pack: raw as AvatarPackDef };
}
