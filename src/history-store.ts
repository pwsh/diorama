// IndexedDB storage for mmWave PRESENCE HISTORY (design doc §E/§F).
// Mirrors model-store.ts / avatar-store.ts / neighborhood-store.ts exactly:
// one DB, one object store, `indexedDB.open(NAME, 1)`, createObjectStore only
// if missing, a single openDb() promise wrapper, and every op
// opens → transacts → db.close()s (no persistent connection is held).
//
// db `diorama-history`, store `presence`, key = `<floorId>:<hourBucket>`,
// value = PresenceRecord (typed arrays structured-clone natively).
//
// WHY ITS OWN DB, AND WHY HERE AT ALL (design §E "Where it must not go"):
//  • NOT HA's recorder — GB/month of coordinate churn into a database the user
//    manages for unrelated purposes, and cannot undo from inside Diorama.
//  • NOT the synced Store — save() swallows write failures with a console.warn
//    (the oversized bg-image dataURL bug), and Store is ONE CONFIGURATION:
//    export / import / switchConfig serialize the whole thing, so weeks of
//    presence history would duplicate into every copy. Telemetry is not
//    configuration.
//
// PRIVACY (design §F) — enforced here, not merely documented:
//  • Retention is an ACTIVE DELETE SWEEP (sweepPresenceHistory), NOT the
//    read-time staleness filter neighborhood-store.ts uses for tiles. "The UI
//    won't show it" does not satisfy an erase expectation.
//  • clearPresenceHistory() is one call and erases everything, immediately and
//    completely — the "Clear cache" affordance's privacy-grade sibling.
//  • There is deliberately no bulk read-out / export helper. Records leave this
//    module one bucket at a time, for rendering.
//
// EVERY op is try/catch-wrapped: an IndexedDB failure (private-browsing quota,
// a blocked upgrade, a hostile stub) degrades to null / no-op / 0 and NEVER
// throws into app logic.

import {
  type PresenceRecord,
  PRESENCE_RETENTION_DAYS_DEFAULT,
  expiredHistoryKeys,
  historyKey,
  mergePresenceRecords,
} from './mmwave-history.js';

const DB_NAME = 'diorama-history';
const STORE = 'presence';

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

/** Overwrite the record for one (floorId, hourBucket). Returns false on failure. */
export async function putPresenceRecord(rec: PresenceRecord): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(rec, historyKey(rec.floorId, rec.bucket));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * THE FLUSH PATH: additively merge `delta` into whatever is already stored for
 * its hour. Read-modify-write inside ONE readwrite transaction so two flushes
 * cannot interleave and lose an update. Returns false on failure.
 */
export async function mergePresenceRecord(delta: PresenceRecord): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const os = tx.objectStore(STORE);
      const key = historyKey(delta.floorId, delta.bucket);
      const getReq = os.get(key);
      getReq.onsuccess = () => {
        const prev = getReq.result as PresenceRecord | undefined;
        os.put(prev ? mergePresenceRecords(prev, delta) : delta, key);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

/** One record, or null on a miss / any failure. */
export async function getPresenceRecord(key: string): Promise<PresenceRecord | null> {
  try {
    const db = await openDb();
    const out = await new Promise<PresenceRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as PresenceRecord) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return out;
  } catch {
    return null;
  }
}

/**
 * A range query: a handful of direct get()s in ONE readonly transaction (design
 * §E — bucketing lives in the key precisely so no index is needed). Misses are
 * skipped; the result is in `keys` order. [] on any failure.
 */
export async function getPresenceRecords(keys: readonly string[]): Promise<PresenceRecord[]> {
  if (!keys || keys.length === 0) return [];
  try {
    const db = await openDb();
    const out = await new Promise<PresenceRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const os = tx.objectStore(STORE);
      const reqs = keys.map(k => os.get(k));
      tx.oncomplete = () => {
        const recs: PresenceRecord[] = [];
        for (const r of reqs) {
          const v = r.result as PresenceRecord | undefined;
          if (v) recs.push(v);
        }
        resolve(recs);
      };
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return out;
  } catch {
    return [];
  }
}

/** Every stored key. [] on any failure. */
export async function listPresenceKeys(): Promise<string[]> {
  try {
    const db = await openDb();
    const out = await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAllKeys();
      req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(k => String(k)));
      req.onerror = () => reject(req.error);
    });
    db.close();
    return out;
  } catch {
    return [];
  }
}

/** Delete one record. Returns false on failure. */
export async function deletePresenceRecord(key: string): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * ACTIVE RETENTION SWEEP (design §F). Physically deletes every record outside
 * the retention window — this is deliberately NOT the read-time staleness
 * filter neighborhood-store.ts uses, because that only hides data and an erase
 * expectation is not satisfied by hiding.
 *
 * `nowMs` is caller-supplied (the no-clock-inside rule). Returns the number of
 * records deleted; 0 on any failure.
 */
export async function sweepPresenceHistory(
  nowMs: number, retentionDays: number = PRESENCE_RETENTION_DAYS_DEFAULT,
): Promise<number> {
  try {
    const keys = await listPresenceKeys();
    const doomed = expiredHistoryKeys(keys, nowMs, retentionDays);
    if (doomed.length === 0) return 0;
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const os = tx.objectStore(STORE);
      for (const k of doomed) os.delete(k);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return doomed.length;
  } catch {
    return 0;
  }
}

/**
 * THE ERASE CONTROL (design §F): one call, immediate, complete. Backs the
 * user-facing "Delete presence history" button.
 */
export async function clearPresenceHistory(): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}
