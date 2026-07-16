// Self-contained in-memory replacement for src/avatar-store.ts, used ONLY by
// the config-test harness build (copied over src/avatar-store.ts in a temp src
// tree — see config-test.html's build comment). IndexedDB does not complete
// under the headless `--virtual-time-budget` harness, so the config test swaps
// IDB for a synchronous Map. This also demonstrates the storage seam is cleanly
// injectable (mirrors the C-batch LocalApi swap). `validatePackJson` is copied
// VERBATIM from the real module (pure — keep in sync if it changes).

import type { AvatarPackDef } from './avatars.js';

const mem = new Map<string, string>();

export async function savePackJson(id: string, json: string): Promise<void> { mem.set(id, json); }
export async function loadPackJson(id: string): Promise<string | null> { return mem.has(id) ? mem.get(id)! : null; }
export async function deletePackJson(id: string): Promise<void> { mem.delete(id); }
export async function listPackIds(): Promise<string[]> { return [...mem.keys()]; }
export async function loadAllPacks(): Promise<{ id: string; json: string }[]> {
  return [...mem.entries()].map(([id, json]) => ({ id, json }));
}

// ── validatePackJson (verbatim copy of the real pure validator) ──────────────
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
