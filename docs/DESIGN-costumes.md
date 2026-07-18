# DESIGN — Avatar costume swaps (situational outfit variants)

*Authored 2026-07-18 (Fable). Status: **shipped** (v0.21.0).*
*Implementation delta: overlay color fields are NUMERIC hex (`number`, skin
`number | 'tint'`) matching the rest of the avatar schema, not the `string`
sketched below; and `avatarCostumes` is mutated inline from the UI (the
`avatarInteractions` idiom) — no dedicated Planner setter exists for either.*
*Closes the last parked avatar rig gap ("situational costume swaps — UX
decision"). The UX decisions are now made (user-approved 2026-07-18):
overlay-style variants, automatic triggers only (sleep / exercise / kitchen
work), instant swap with a brief sparkle pulse, global + per-person gates.*

## Concept

A rig keeps ONE identity (kind + color) but can wear an alternate **look**
resolved at build time. Looks are **overlays** spread over the base
`AvatarDef` — never sibling members (no pool pollution, no identity break).
Three built-in look keys in v1, all auto-triggered:

| Look key   | Trigger (renderer-internal, RAW-state driven)                       |
|------------|---------------------------------------------------------------------|
| `sleep`    | `h.lie > 0.5` AND timeBucket ∈ {evening, night, late_night}          |
| `exercise` | engaged standing activity === `exercise` (`h.act > 0.5` at anchor)   |
| `cooking`  | engaged activity ∈ {`load_dishwasher`, `make_coffee`, `forage_fridge`} |

Day naps keep day clothes (time gate on `sleep`). Manual look selection is
OUT of scope for v1 (schema tolerates unknown trigger ids — ignored).

## Schema (`src/avatars.ts` — stays pure, three-free)

```ts
export type LookKey = 'sleep' | 'exercise' | 'cooking';

export interface AvatarLookOverlay {
  // Whitelisted overlay keys ONLY — resolver spreads exactly these:
  skin?: string; legColor?: string;
  limbColors?: { armL?: string; armR?: string; legL?: string; legR?: string };
  decals?: AvatarDecal[];        // REPLACES base decals (cap 2 still applies)
  prims?: AvatarPrimitive[];     // REPLACES base prims
  addPrims?: AvatarPrimitive[];  // APPENDED after base (or after `prims`)
}

export interface AvatarVariant { id: string; overlay: AvatarLookOverlay }

// On AvatarDef (additive): variants?: AvatarVariant[]
```

`resolveLook(def: AvatarDef, look: LookKey | null): AvatarDef` — pure,
deterministic, never throws. `null`/unsupported → base def unchanged (same
object, no clone). Member-authored variant with matching `id` WINS over the
universal look; else the universal applies **only when eligible**.

**Universal eligibility** = the trousers predicate + humanoid checks:
`def.legColor == null && def.skin == null (tint skin)` AND not `pet`/quad
AND no `hover`. Costume-identity kinds (robot, astronaut, mascots, duck…)
and pets NEVER take universal looks; a pack may still author `variants` for
them explicitly.

**Universal look content** (`UNIVERSAL_LOOKS: Record<LookKey, AvatarLookOverlay>`
in avatars.ts, exact colors pinned at implementation, style below):
- `sleep`: pajamas — `legColor` soft lavender-blue; chest decal
  `print:'dots'` in a dim tone; `addPrims` nightcap (small crown cone, deep
  blue, + tiny pompom sphere). Base decals replaced by the pajama print.
- `exercise`: crown headband (thin accent-colored cylinder band via
  `addPrims`) + `legColor` charcoal (shorts read). Base decals kept.
- `cooking`: apron — chest decal `print:'stripes'` with a warm off-white
  `bg` (reads as an apron panel). Base decals replaced.

## Gates

- **Global**: `Store.avatarCostumes?: boolean` (absent = ON) — Settings ▸
  Display checkbox "Avatars change outfits". MUST land in
  `Planner._loadFromHa`'s explicit field list. Planner setter mirrors
  `avatarInteractions`.
- **Per-person**: `DioramaPerson.allowCostumes?: boolean` (absent = ON) —
  checkbox in the People editor. Item-level (people array passes through
  `_loadFromHa` whole — no schema plumbing needed).
- Wiring: `ActivityContext.costumes?: boolean` (global flag, absent = ON —
  stale-chunk safe) built in three-view `_tickOnce`; identified targets
  (fused radar / BLE) get `TargetWorld.noCostumes?: true` stamped when their
  person sets `allowCostumes === false`. Both optional/additive.

## Renderer mechanics (`three-renderer.ts`)

- `Humanoid.look: LookKey | null` (+ `lookWant`, `lookHoldT`). Per-frame in
  `updateTargets` (humanoids only, `!h.quad`): resolve the wanted look from
  the trigger table above. **Hysteresis**: a non-null want must hold ~2 s
  continuously before commit; once committed, the look holds until its
  trigger has been clear for ~3 s (then reverts to null/base). Never flaps
  with the sit/lie blends (lie > 0.5 is already slow).
- **Swap = rebuild through the EXISTING kind-rebuild path**, with the look
  passed into the def resolution (`resolveLook(resolveDef(kind), look)`).
  Hard requirements: (1) pool-rolled kinds survive (the `forcedKind`
  carry-over idiom — a look change must NOT re-roll or fight the pool
  pick); (2) identity color unchanged; (3) pose continuity — `h.sit`,
  `h.lie`, `h.act`, nav state, claims, and blends carry across the rebuild
  exactly like a fused-person kind swap does (a sleeper must not pop
  standing). Verify against the existing rebuild mechanics before coding.
- **Sparkle pulse**: on each committed swap (both directions), a brief
  one-shot effect at torso height — a small additive white/gold sprite
  burst scaling out + fading over ~0.6 s. Shared `_sparkleTex`
  CanvasTexture (built once, disposed only in `destroy()` — blob-tex
  idiom); the per-swap sprite is allocated on the event (rare — fine),
  parented to the rig group, and self-disposed at end of life (sprite
  material freed; the shared map NOT freed). If the rig is disposed
  mid-pulse, `_disposeHumanoid`'s sprite traverse covers it — do not
  double-free the shared map.
- No new dirty keys (rigs are per-frame). No planner→renderer calls; the
  renderer reads ctx + target flags only.

## Files

`src/avatars.ts` (schema + resolveLook + UNIVERSAL_LOOKS + eligibility),
`src/types.ts` (Store.avatarCostumes, DioramaPerson.allowCostumes),
`src/planner.ts` (_loadFromHa + setter), `src/ui/modals.ts` (Display tab
checkbox), `src/ui/sidebar.ts` (People editor checkbox),
`src/ui/three-view.ts` (ctx flag + person stamp), `src/three-renderer.ts`
(trigger/hysteresis/rebuild/sparkle), `docs/avatars/AUTHORING.md` (variants
section), test page.

## Test page — `test-pages/costume-test.html` (`COSTUME PASS n/n`)

Pure matrix (bundle avatars.ts): resolveLook base-when-null / unsupported-id
/ universal-eligibility (adult yes, robot no, cat no, hover no) /
member-variant-wins / addPrims append / decals cap. Renderer harness (built
three-renderer chunk): forced lie+night → sleep look applied (nightcap prim
present, legColor changed) with pose continuity (lie stays > 0.5 across the
swap); exercise anchor → headband; kitchen activity → apron decal;
hysteresis (no swap before the hold, reverts after clear+3 s); global gate
off → no swap; per-person noCostumes → no swap; pool rig keeps rolled kind
across a look change; sparkle sprite appears on swap and is gone after ~1 s
with the shared map alive. Deterministic (no Math.random in assertions).
