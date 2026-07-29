# Tech-debt & dependency audit — 2026-07-28 (at v0.40.0)

Full-repo sweep: dependency currency, explicit code markers, documented
deferrals, compatibility shims, duplication risks, docs drift, tooling.
Classification below is the acted-on plan of record; STATUS.md tracks
execution.

## Dependencies

| Package | At audit | Latest | Decision |
|---|---|---|---|
| vite | 8.0.16 | 8.1.5 | **ACTION** — in-range minor; gated batch with three |
| three + @types/three | 0.184 | 0.185.1 | **ACTION** — minor, but three lands breaking changes in minors: full renderer-page gate run required |
| typescript | 5.9.3 | 7.0.2 | ~~HOLD 7.x — EVALUATE 6.x~~ **DONE in two steps**: 6.0.3 bridge (v0.42.0, one code fix), then 7.0.2 (2026-07-29, zero changes, typecheck ~6× faster) — the staged path worked exactly as designed |
| lit / esbuild / gifenc | current | — | No action |
| CI actions (checkout@v4, setup-node@v4/Node 22, gh-release@v2) | current gen | — | No action |

## DO ACTION (ranked value : effort)

1. **[quick] Untrack committed test bundles** — `test-pages/*.mod.js` (4 files:
   geo/mvt/neighborhood/planner) are tracked; ~27 pages write the SAME
   `planner.mod.js` name so the committed copy is whatever ran last — the
   mechanism behind the void-test 9/10 clean-checkout flake. Gitignore +
   `git rm --cached`; every page documents its own regen command.
2. **[quick] `hitDoor`/`hitDoorEnd` → `effectiveState`** (canvas-hit.ts:224, 281)
   — they read raw `states[entity_id]`, bypassing `localState` for unbound
   doors; violates the documented "one resolver" rule (masked today by the
   closed-span hit, still wrong).
3. **[quick] README factual fix** — "Known gaps" claims store migration doesn't
   exist; planner.ts has implemented it since the config-registry work.
4. **[quick] `engines` field in package.json** — CLAUDE.md documents Node
   20.19+/22.12+; enforce it at install time. (Orchestrator-only file.)
5. **[quick] CLAUDE.md toolbar-test count self-contradiction** (41/41 vs 41→42).
6. **[medium] localstate-test `window_unbound_open` red** — known-red on HEAD;
   root-cause candidate: the open-state visual marker missing on
   `double_hung` windows. Fix renderer or test heuristic, whichever the
   evidence supports.
7. **[medium] Hoist `flightFieldText`/`flightLabelLines` into flights.ts** —
   last mirrored canvas-render/three-renderer pair with NO parity test
   (the glow ladder already made this exact move successfully).
8. **[medium] README feature refresh** — tools/entity tables predate ~⅔ of the
   current fixture catalog; highest-visibility stale doc.
9. **[medium] docs/models tree species** — build references for
   oak/birch/willow/spruce (palm partial) in plants-landscaping.md.
10. **[large] physical.mjs nav-replica parity guard** — the floorplans
    validator hand-copies `_buildNav` (own constants, no cross-check); a nav
    change would silently desync it. Extract a shared pure nav-rasterizer
    module OR add a differential golden test. The one genuinely dangerous
    item in the audit.

## DO NOT ACTION (permanent by design — keep, zero/near-zero cost)

- `Scene3D.cameraPivot` deprecated read-only back-compat (never written).
- One-time migrations: legacy `Store.bgText` → `bgTexts[]`; legacy single
  `diorama` user_data key → config registry (removing breaks upgrade paths).
- `updateBgText` legacy wrapper + single-rig mirror fields (bgtext-test
  pairing; retire only if that page is ever folded into bgtext-multi).
- ~50 `stale-chunk` guards — the mixed-version module-graph defense
  (load-bearing pattern, see CLAUDE.md build gotchas), not debt.
- Legacy avatar bare ids + `avatarKind` single-pick field — the persisted
  identity scheme, not a deprecated path.
- `FLIGHT_SHELL_REACH_MM` base constant + `legacyModelKind` — active
  API/back-compat surface, not removable shims.
- `resolveItemGroundMm` ↔ `_itemGroundY` mirror — deliberate (chunk-split
  boundary) and TEST-PINNED equal; safe.
- `snapOpeningToWallLocal` (sh3d.ts) mirror — dependency-free by design,
  weakly pinned; acceptable (simple, rarely-changing geometry).
- Cosmetic deferrals, explicitly accepted: doorbell rings at slab height on
  graded gates; slab-relative sensor coverage wedges; no foundation-skirt
  geometry; no train smoke puffs; no blob shadow under open-underneath
  stairs; docs-gallery legacy GIF-dir relocation shim.

## Execution log

- 2026-07-28: plan agreed; vite+three shipped (v0.41.0); TS 6.0.3 shipped
  (v0.42.0); items **4** (engines) + **5** (CLAUDE.md count) done (825f4ce).
- 2026-07-29: batch A shipped — items **1** (test-pages/*.mod.js untracked +
  gitignored), **2** (hitDoor/hitDoorEnd → effectiveState; DOORKINDS 97/97),
  **3+8** (README migration fix + full feature refresh, machine-checked
  counts), **6** (localstate-test window heuristic predated the window-glass
  rework — test fixed, LOCALSTATE 16/16, was 9/10 known-red), **7** (flight
  label resolvers hoisted into flights.ts; FLIGHTS 602/602, render 393/393,
  ui 271/271), **9** (docs/models tree species §8–§12).
- 2026-07-29: **#10 DONE — the DO-ACTION list is complete.** Route chosen:
  differential golden test (`nav-parity-test.html`, NAVPARITY 54/54 — 7
  fixtures, cell-for-cell blocked + region-label agreement, analytic
  constant probes, mutation-tested non-vacuous), NOT a shared-module
  extraction (renderer-state interleaving made that riskier than the guard).
  The guard's first run found TWO real replica divergences, both fixed
  validator-side: sunken-stairs nav rails were absent, and custom-recipe
  defs weren't resolved (`resolveFurnitureDef` now threaded); inline kind
  lists replaced with `isStairsKind`/`isRiserKind`. FLOORPLANS 399/399
  byte-identical.
- Noted, unresolved: `FURNITURE_KINDS.birch_tree.color` `#7fbf4d` vs shipped
  foliage `#8fc95a` (possible intentional two-tier); plants-landscaping §8
  TOC anchor mismatch (pre-existing).

## Execution plan (agreed 2026-07-28)

1. This document (commit).
2. vite 8.1.5 + three 0.185.1 as ONE gated batch — typecheck, build,
   MeshToonMaterial chunk-split grep = 0, renderer-heavy pages (terrain,
   stairs-fit, tree, door-kinds, bgtext-multi, flights-render, camera,
   ghost-align, neighborhood-render) at their counts → **release**.
3. TypeScript 6.x viability check (bridge line to 7): breaking-change
   review vs this codebase, then trial upgrade behind the same gates →
   **release** if clean; stay on 5.9 otherwise.
4. Opus works the DO-ACTION list in order (1→10); package.json items stay
   orchestrator-owned. Nav-parity (#10) is its own dedicated batch.
