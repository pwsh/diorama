// src/fusion.ts — pure BLE↔mmWave identity-fusion matcher core.
//
// mmWave gives precision (a live radar target), BLE gives identity (a solved
// person). This state machine decides when a radar target has adopted a BLE
// person's identity, with hysteresis on EVERY threshold so it can never
// oscillate (fuse ⇄ release must each cross their own distinct, time-held gate).
//
// Extracted from Planner as a pure, deterministic function so it is unit-testable
// in `test-pages/fusion-test.html`: no `Date`, no `Math.random`. The caller
// (Planner) samples proximities + a time delta each tick and passes them in.
//
// ── Constants (each carries hysteresis — documented) ───────────────────────
//   BASE_GATE_MM   1500  minimum fusion gate radius; the caller widens it per
//                        pair to max(BASE_GATE_MM, person.confidenceMm) so a
//                        low-confidence BLE fix demands a correspondingly looser
//                        match — supplied on each candidate as `gateMm`.
//   FUSE_HOLD_MS   4000  a UNIQUE in-gate pair (see below) must stay clean this
//                        long CONTINUOUSLY before it fuses. Any tick where the
//                        pair is not clean resets its pending timer to 0.
//   AMBIG_FACTOR   1.25  a second candidate for the same person OR the same
//                        target sitting within gate×1.25 makes the pair ambiguous
//                        → it never accrues pending time. Ambiguity blocks NEW
//                        fusion but does NOT touch an existing fusion's timers.
//   RELEASE_FACTOR 2.0   a fused pair must separate beyond gate×2 before the
//                        release timer even arms (well outside the fuse gate, so
//                        jitter around the gate can't flip the state).
//   RELEASE_HOLD_MS 6000 sustained separation past gate×2 for this long releases
//                        the fusion. Dropping back within gate×2 disarms it.
//   Plus INSTANT release when the radar target disappears, or the BLE person goes
//   stale / disappears (identity can no longer be trusted).

export interface FusionCfg {
  baseGateMm: number;
  fuseHoldMs: number;
  ambigFactor: number;
  releaseFactor: number;
  releaseHoldMs: number;
}

export const DEFAULT_FUSION_CFG: FusionCfg = {
  baseGateMm: 1500,
  fuseHoldMs: 4000,
  ambigFactor: 1.25,
  releaseFactor: 2.0,
  releaseHoldMs: 6000,
};

// One (person, target) proximity sample for this tick. `gateMm` already folds in
// the person's confidence radius: max(baseGateMm, confidenceMm). `personId` is the
// caller's stable per-BLE-device join key (Planner uses the BlePerson.key so that
// unknown devices — which have no Store.people id — still take part).
export interface FusionCand {
  personId: string;
  targetKey: string;
  distMm: number;
  gateMm: number;
}

// Runtime state, owned by the caller and mutated in place each tick.
interface PendingEntry { personId: string; targetKey: string; ms: number }
interface FusedEntry { personId: string; sepMs: number; heldMs: number }
export interface FusionState {
  pending: Record<string, PendingEntry>;   // "person\x00target" → clean-unique accrual
  fused: Record<string, FusedEntry>;        // targetKey → committed fusion
}

export function newFusionState(): FusionState {
  return { pending: {}, fused: {} };
}

// Presence description for this tick, so the machine can release on
// disappearance / staleness even when no candidate pair is supplied for a pair.
export interface FusionTick {
  cands: FusionCand[];
  presentPersons: Set<string>;   // BLE person join-keys currently solved
  stalePersons: Set<string>;     // subset with no fresh samples (identity untrusted)
  presentTargets: Set<string>;   // live radar target keys
}

// '\x00' can't appear in a sensor id / BLE key, so it's a safe pair separator.
const pk = (personId: string, targetKey: string) => personId + '\x00' + targetKey;

// Advance the matcher one tick. Mutates and returns `state`. Deterministic:
// identical (state, tick, dtMs, cfg) inputs always produce identical output.
export function stepFusion(state: FusionState, tick: FusionTick, dtMs: number,
                           cfg: FusionCfg = DEFAULT_FUSION_CFG): FusionState {
  const { cands, presentPersons, stalePersons, presentTargets } = tick;

  // Index candidate distances for O(1) pair lookup + per-side nearest scans.
  const byPair: Record<string, FusionCand> = {};
  const byPerson: Record<string, FusionCand[]> = {};
  const byTarget: Record<string, FusionCand[]> = {};
  for (const c of cands) {
    byPair[pk(c.personId, c.targetKey)] = c;
    (byPerson[c.personId] ??= []).push(c);
    (byTarget[c.targetKey] ??= []).push(c);
  }

  // ── 1. Hold or release existing fusions ─────────────────────────────────
  for (const targetKey of Object.keys(state.fused)) {
    const fz = state.fused[targetKey];
    const personId = fz.personId;
    // Instant release: radar target gone, or the BLE person went stale /
    // disappeared. A stale person hasn't re-solved recently — the identity claim
    // is no longer live, so drop it rather than let a phantom hold the target.
    if (!presentTargets.has(targetKey) || !presentPersons.has(personId)
        || stalePersons.has(personId)) {
      delete state.fused[targetKey];
      continue;
    }
    fz.heldMs += dtMs;
    const cand = byPair[pk(personId, targetKey)];
    const gate = cand ? cand.gateMm : cfg.baseGateMm;
    const dist = cand ? cand.distMm : Infinity;   // no pair supplied ⇒ far apart
    if (dist > gate * cfg.releaseFactor) {
      fz.sepMs += dtMs;
      if (fz.sepMs >= cfg.releaseHoldMs) { delete state.fused[targetKey]; continue; }
    } else {
      fz.sepMs = 0;   // back within 2× gate → disarm the release timer
    }
  }

  // Persons / targets already committed cannot take part in new pending pairs.
  const fusedTargets = new Set<string>(Object.keys(state.fused));
  const fusedPersons = new Set<string>();
  for (const tk of fusedTargets) fusedPersons.add(state.fused[tk].personId);

  // ── 2. Find this tick's clean-unique pairs ──────────────────────────────
  // A pair (p,t) is clean iff: dist < gate; it is p's NEAREST target AND t's
  // NEAREST person; and no OTHER candidate for p or for t sits within gate×ambig
  // (the uniqueness / no-second-candidate rule that makes fusion unambiguous).
  const cleanKeys = new Set<string>();
  for (const c of cands) {
    if (fusedPersons.has(c.personId) || fusedTargets.has(c.targetKey)) continue;
    if (c.distMm >= c.gateMm) continue;
    const pl = byPerson[c.personId], tl = byTarget[c.targetKey];
    let nearestP = c, nearestT = c;
    for (const o of pl) if (o.distMm < nearestP.distMm) nearestP = o;
    for (const o of tl) if (o.distMm < nearestT.distMm) nearestT = o;
    if (nearestP !== c || nearestT !== c) continue;
    const ambigLim = c.gateMm * cfg.ambigFactor;
    let ambiguous = false;
    for (const o of pl) if (o !== c && o.distMm < ambigLim) { ambiguous = true; break; }
    if (!ambiguous)
      for (const o of tl) if (o !== c && o.distMm < ambigLim) { ambiguous = true; break; }
    if (ambiguous) continue;
    cleanKeys.add(pk(c.personId, c.targetKey));
  }

  // ── 3. Advance / reset pending timers; commit at FUSE_HOLD_MS ────────────
  // Drop any pending pair that isn't clean this tick (must be CONTINUOUS).
  for (const key of Object.keys(state.pending))
    if (!cleanKeys.has(key)) delete state.pending[key];
  for (const key of cleanKeys) {
    const c = byPair[key]!;   // key === pk(personId, targetKey) → the candidate
    const prev = state.pending[key];
    const ms = (prev ? prev.ms : 0) + dtMs;
    if (ms >= cfg.fuseHoldMs) {
      // Commit — guard against a same-tick double-claim of a person or target.
      if (!fusedTargets.has(c.targetKey) && !fusedPersons.has(c.personId)) {
        state.fused[c.targetKey] = { personId: c.personId, sepMs: 0, heldMs: 0 };
        fusedTargets.add(c.targetKey); fusedPersons.add(c.personId);
      }
      delete state.pending[key];
    } else {
      state.pending[key] = { personId: c.personId, targetKey: c.targetKey, ms };
    }
  }

  return state;
}
