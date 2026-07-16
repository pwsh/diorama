# DESIGN — Avatar packs & settings overhaul

*Authored 2026-07-16 (Fable architecture pass). Status: **in build**.
Companion research: `docs/avatars/**` (32 regeneration-ready group/franchise
reference docs, Sonnet-gathered).*

## Goals

1. Split the hard-coded avatar set into **packs** (groups) that can be
   **loaded/unloaded** and **activated/deactivated** from the settings menu —
   users can add, remove, update, or replace avatar collections without code
   changes.
2. Keep a **default avatar** (`adult`) built in and irremovable; keep the
   existing 24 kinds working under their persisted ids (no store migration).
3. Hierarchical pack selection (`Sci-Fi > Star Trek > TNG`), including
   generated franchise/cosplay packs and rounded-out base groups
   (humans, careers, robotic, aliens, sci-fi, pop culture, domestic/farm/zoo
   animals).
4. Grow the settings drawer into a real **tabbed settings surface** and move
   the *global* (non-placeable) sidebar sections into it. Placeable /
   resizable / renameable things (walls, rooms, fixtures, landmarks, bg
   images, floors) STAY in the sidebar.

## Current state (recon)

- `AvatarKind` string union in `types.ts` (22 humanoid + cat/dog).
- `three-renderer.ts`: `AVATAR_KINDS` (random pool) / `PET_KINDS` /
  `AVATAR_KIND_SET`; `AVATAR_PERSONALITY` (walk multipliers);
  `AVATAR_BUBBLES` (glyph pools); `SPECS` table inside `_buildHumanoid`
  (sk/headR/headShape/limbR/skin/body/shoe/emI/hands/eyes/steel/armL/legL/
  footMul/legColor — already data-shaped); `_addAvatarAccessories` —
  imperative per-kind blocks (box/sphere/cyl helpers anchored off
  HEAD_R/headY/torsoY/hipY/TORSO_*); `EAR_SKIP` set; `_buildQuadruped`
  hard-coded cat (0.58×) / dog (beagle 520 mm shoulder).
- `resolveAvatar(want, list, key, pick?)` + `avatarFromPool` validate pools
  against `AVATAR_KIND_SET`; unknown → adult; re-roll on fresh spawn for pools.
- UI: `AVATAR_OPTIONS` flat `[kind,label]` list; `_avatarGrid` checkbox grid
  (sensor + motion editors) writing `avatarKinds`; person `avatarKind` select.
- Settings drawer (`modals.ts`): Connection + Bermuda toggle + version only.

## Data model

### `src/avatars.ts` — NEW pure module (no three.js import)

Shared by the app graph AND the lazy renderer chunk (vite hoists it into a
shared chunk; the `?v=` chunk-pinning keeps graphs consistent). Holds types,
the CORE pack, the registry singleton, and the resolve functions (moved out
of three-renderer).

```ts
// Persisted avatar id. Legacy kinds keep bare ids ('adult', 'ninja', 'cat'…);
// pack members are '<packId>/<memberId>' ('star-trek-tng/captain').
export type AvatarId = string;                 // widens the old AvatarKind union
export type LegacyAvatarKind = /* the old 24-value union, kept for defaults */;

export interface AvatarPrimitive {
  shape: 'box' | 'sphere' | 'cylinder' | 'cone';
  // mm at sk=1: box [w,h,d]; sphere r or [rx,ry,rz] (scaled); cyl [rTop,rBot,h]; cone [r,h]
  size: number | [number, number, number];
  anchor: 'crown' | 'head' | 'face' | 'chest' | 'back' | 'hip' | 'root'
        | 'handL' | 'handR'                       // humanoid
        | 'qhead' | 'qneck' | 'qback' | 'qrump';  // quadruped
  pos?: [number, number, number];   // mm offset from anchor (body-local, -Z front)
  rot?: [number, number, number];   // radians
  color: number | 'tint' | 'skin' | 'body' | 'dark' | 'accent';
  emissive?: number; emissiveIntensity?: number;
  metalness?: number; roughness?: number;
  outlineSkip?: boolean;
  // sphere-section support for hoods/hair/shells (phiStart/phiLength/thetaStart/thetaLength):
  sphereArc?: [number, number, number, number];
}

export interface HumanoidFields {   // mirrors the old Spec, colors accept 'tint'
  sk?: number; headR?: number; headShape?: 'sphere' | 'box'; limbR?: number;
  skin?: number | 'tint'; body?: number | 'tint'; shoe?: number; emI?: number;
  hands?: 'sphere' | 'box';
  eyes?: 'dots' | 'visor' | 'almond' | 'redvisor' | 'shades' | 'slit' | 'halfred';
  steel?: boolean; armL?: number; legL?: number;
  footMul?: [number, number, number]; legColor?: number;
  earSkip?: boolean;                // replaces the EAR_SKIP list membership
}

export interface QuadrupedFields {  // parameterizes _buildQuadruped (cat/dog become data)
  sk?: number;                      // 1.0 = beagle 520 mm shoulder
  bodyLen?: number; bodyW?: number; bodyH?: number;   // mm at sk=1 (defaults 640/200/240)
  legLen?: number;                  // upper+lower total mult
  headR?: number; neckLen?: number; // neckLen>0 inserts a neck segment (giraffe/horse)
  ears?: 'pointy' | 'floppy' | 'round' | 'long' | 'none';
  tail?: 'up' | 'down' | 'curl' | 'tuft' | 'none'; tailLen?: number;
  snout?: number;                   // snout length mult (0 = none)
  coat?: number | 'tint'; belly?: number; earColor?: number; snoutColor?: number;
}

export interface AvatarDef {
  id: AvatarId; label: string;
  rig: 'humanoid' | 'quadruped';
  humanoid?: HumanoidFields; quadruped?: QuadrupedFields;
  accessories?: AvatarPrimitive[];
  legacyAccessories?: LegacyAvatarKind;  // route to _addAvatarAccessories(kind)
  personality?: { bobMul?: number; swayMul?: number; cadenceMul?: number; ampMul?: number };
  bubbles?: string[];
  pet?: boolean;      // excluded from the bare-'random' human fallback pool
}

export interface AvatarPackDef {
  id: string;                // 'core', 'base-careers', 'star-trek-tng', …
  version: number;
  label: string;
  path: string[];            // hierarchy, e.g. ['Sci-Fi','Star Trek','Next Generation']
  base?: Partial<AvatarDef>; // spread under every member (TMNT shared body, chibi packs)
  avatars: AvatarDef[];
  builtin?: boolean;         // shipped in the app bundle (vs user-imported)
  locked?: boolean;          // core only: cannot unload/deactivate
}
```

### Registry (singleton in `avatars.ts`)

```ts
registerPack(def: AvatarPackDef): void          // hydrate (idempotent by id+version)
unregisterPack(id: string): void
getPack(id) / listPacks(): PackEntry[]          // entry = def + source ('builtin'|'user')
resolveDef(id: AvatarId): AvatarDef             // unknown → core 'adult' (never throws)
activeAvatarIds(cfg: AvatarPacksConfig): AvatarId[]   // for UI grids & pools
resolveAvatar(want, list, key, cfg, pick?)      // moved from three-renderer; validates
avatarFromPool(want, list, cfg)                 //   against loaded+active packs
```

- **CORE pack** (`id:'core'`, `locked:true`): the 24 existing kinds as
  `AvatarDef`s under their **bare legacy ids**. Specs come from the old
  `SPECS` table verbatim; accessories via `legacyAccessories` (the imperative
  blocks stay — they are hand-tuned); cat/dog become the first two
  `QuadrupedFields` data entries. `adult` is the default avatar — core cannot
  be unloaded or deactivated.
- **Built-in extra packs** live in `src/avatar-packs/` — a small eagerly
  imported `manifest.ts` (`{id,label,path,count,load:()=>import(...)}` per
  pack) + one lazy data module per pack. Pack bodies stay out of the startup
  bundle; hydration happens on connect for loaded packs (then
  `emitConfig()` so grids/keys refresh).
- **User packs**: imported JSON validated against the same shape →
  `avatar-store.ts` (IndexedDB, mirrors `model-store.ts`; db
  `diorama-avatars`, key = pack id) + registered. Export serializes any pack
  (builtin or user) to JSON — that is also the update/replace path
  (re-import same id, bump `version`).

### Store config (persisted, HA-synced)

```ts
// types.ts
export interface AvatarPackConfig { loaded?: boolean; active?: boolean; members?: string[] }
// Store:
avatarPacks?: Record<string, AvatarPackConfig>;   // keyed by pack id
```

- Absent entry ⇒ pack defaults: `core` + base-group packs loaded+active;
  franchise packs **loaded:false** (opt-in novelty); user packs loaded on
  import. `members` absent ⇒ all members active; present ⇒ subset.
- **MUST be added to `Planner._loadFromHa`'s explicit field list** (the
  classic gotcha) — `avatarPacks: remote.avatarPacks ?? undefined`.
- Pack JSON bodies are NOT in the store (user packs live in IndexedDB,
  device-local like imported OBJ models; builtins ship with the bundle). The
  store only carries the small config record, so HA `user_data` stays tiny.

## Resolution semantics

- The bare `'random'` / unknown fallback pool stays **core humanoids only**
  (deterministic; a stranger never spawns as a franchise character — matches
  today's behavior).
- Sensor/motion `avatarKinds` pools may contain ANY avatar id; resolution
  filters to ids that exist in a **loaded+active** pack (and active member
  subset), else falls back to adult. Deactivating a pack therefore instantly
  (next spawn) removes its members from every pool without editing sensors.
- `person.avatarKind` (single pick) resolves the same way.
- Re-roll-on-respawn, stable djb2 hash pick, pets-excluded-from-random, and
  the humanoid⇄quadruped rebuild path are all unchanged — they key off the
  resolved def instead of the union type.

## Renderer changes (`three-renderer.ts`)

- `_buildHumanoid(color, def)` — SPECS lookup replaced by `def.humanoid`
  (defaults = adult values); `'tint'` resolves to the passed color exactly
  like `skin: color` today. `EAR_SKIP` list → `def.humanoid.earSkip`.
- `_addAvatarAccessories(legacyKind, …)` unchanged, called when
  `def.legacyAccessories` is set; NEW `_addDeclarativeAccessories(def, rig
  metrics)` builds `AvatarPrimitive[]` — anchor table resolves to the same
  HEAD_R/headY/torsoY/hipY/TORSO_* metrics the imperative blocks use, sizes
  scale by `sk`, colors resolve tint/skin/body/dark/accent to the rig's
  materials, all parts parented to `root` (privacy-blur/fade/outline systems
  pick them up automatically; outline minDim auto-skips small parts).
- `_buildQuadruped(color, def)` — cat/dog constants become defaults
  overridden by `def.quadruped`; adds optional neck segment, ear/tail/snout
  variants, and quad anchors for declarative accessories (horns, mane,
  trunk, saddle, wings).
- `AVATAR_PERSONALITY` / `AVATAR_BUBBLES` lookups → `def.personality` /
  `def.bubbles` (tables retired into core pack data).
- `updateTargets` keeps comparing avatar **id strings**; a def change with
  the same id (pack update) is picked up on next rebuild — pack re-import
  bumps `configRev`, and rigs rebuild via the existing kind-mismatch path.
- **Stale-chunk fallback**: a stale renderer chunk that never got a registry
  simply resolves every id through its own bundled core pack (adult
  fallback) — same graceful degradation as today.

## Settings surface (batch B)

`<diorama-settings-drawer>` grows into a wider tabbed panel (still a light-DOM
drawer, ~560 px, tab strip on top):

| Tab | Contents |
|---|---|
| **Connection** | existing URL/token + version footer |
| **Display** | MOVED from sidebar `scene3d`: global lighting preset + auto mode + lux entity, global floor color/texture + wall color, glass house, wall cutaway, auto-follow, cinematic orbit; plus `imperial` units toggle |
| **Weather** | MOVED from sidebar `weather`: the whole section (source, entity/sensors/zip, chip, effects master + per-effect toggles) |
| **Avatars** | NEW pack manager (below) |
| **Integrations** | existing Bermuda toggle (+ future) |
| **Data** | MOVED from sidebar `data`: export/import/reset + storage info |

Sidebar section REMOVALS: `scene3d`, `weather`, `data`. The **per-floor**
`look3d` overrides ("This floor only") move into the sidebar **Floors**
section as a sub-block of the current floor (they are floor-scoped, not
global). Everything placeable/resizable/renameable stays where it is.
All moved editors keep their `Planner` mutation paths (`setWeather`,
scene3d setters, etc.) — pure relocation, no behavior change. Settings tabs
render edit-mode-gated exactly like the sidebar did (kiosk/view see
Connection only).

### Avatars tab (pack manager)

- Tree grouped by `path` (Sci-Fi ▸ Star Trek ▸ …), one row per pack:
  label, member count, source badge (built-in / imported),
  **Loaded** toggle, **Active** toggle (disabled while unloaded), expander →
  member checkbox list (writes `members` subset; per-member preview swatch
  of body/skin colors). Core row is locked (always on, tooltip explains).
- Buttons: **Import pack (JSON)** (file input → validate → IDB + register +
  config `loaded:true`), **Export** per pack, **Remove** (user packs only).
- A "Default avatar" note: unknown/unresolved ids render as `adult`.

## Pack generation (batch C, research-driven)

`docs/avatars/**` reference docs are the regeneration source of truth
(one doc per group/franchise; member specs in rig vocabulary + accessory
lists + personality + bubbles + rig-gap flags). Generation = Opus agents
translating docs → `src/avatar-packs/<id>.ts` data modules + manifest rows.
Franchise members use descriptive labels ("Captain (red uniform)") — no
likenesses/logos/textures, geometric homage only.

Rig gaps surfaced by research are triaged by Fable before generation;
expected candidates: cylinder head shape (minifigs), humanoid tail
(monkey/kangaroo), hover (ghosts/droids), two-tone torso (overalls),
biped-bird variant (chicken/penguin — cartoon_duck precedent says this
mostly works already via footMul/armL). Cheap ones land with batch C;
expensive ones get parked in ROADMAP backlog.

## Test pages

- `avatar-pack-test.html` — registry: register/unregister, resolveDef
  fallback, active-pool math vs config (loaded/active/members), pack
  inheritance (`base` spread), legacy id back-compat.
- `avatar-build-test.html` — renderer: declarative accessory build (anchor
  placement sanity vs rig metrics), parameterized quadruped (neck/ears/tail
  variants), tint resolution, outline/dispose lifecycle (reuse
  pet-test/tabletest idioms).
- Existing pet-test / tabletest / phase6-test must stay green (cat/dog via
  data path).

## Batches

- **A — core infrastructure**: `avatars.ts` + core pack data + renderer
  refactor (declarative accessories, parameterized quadruped, def-driven
  build) + `Store.avatarPacks` (+ `_loadFromHa`) + hydration on connect +
  sidebar `_avatarGrid` grouped by pack + `avatar-pack-test` /
  `avatar-build-test`.
- **B — settings overhaul**: tabbed drawer, section moves (Display/Weather/
  Data), sidebar removals + look3d relocation, pack-manager UI,
  `avatar-store.ts` (IDB) + import/export/remove.
- **C — content**: base-group packs (careers/robotic/aliens/sci-fi/pop/
  domestic/farm/zoo — incl. new quadruped species + biped birds) + 23
  franchise packs, generated from `docs/avatars/**`; rig-gap triage; pack
  READMEs.

## Rig-gap triage (Fable, post-research)

Research surfaced ~150 raw gap mentions across 32 packs. Triage:

**LAND in batch C (contained, multi-pack payoff):**
- New accessory anchors: `shoulderL`/`shoulderR` (pauldrons/epaulettes — 7 packs),
  `neck` (collars/ties — 5 sitcom packs), `tailbone` (static humanoid tail —
  6 packs: monkey/kangaroo/Pokémon/Bowser/rat-sensei/AC villagers).
- `headShape: 'cylinder' | 'oval'` additions (minifigs; gaunt/elongated heads).
- `eyes: 'none'` + `noFace?: boolean` (skip nose/mouth/brows — masked/skull/
  leaf-mask/tentacle faces).
- `opacity?: number` on humanoid skin/body + quad coat (ghosts, blob alien,
  energy beings).
- `hover?: number` (mm): build with legs omitted, root floated, gentle bob —
  ghosts, genie, floating droids/robots (no new gait code; reuses bob channel).
- `limbColors?: { armL?; armR?; legL?; legR? }` per-limb overrides (the cyborg
  steel-limb pattern, generalized — silver-leg droid, glove colors).
- `posture?: { pitch?: number }` static root-pitch bias (elder stoop, hunched
  creatures) folded into the existing speed-proportional lean.
- Quadruped: `pawColor?`, `tailTipColor?` fields; quads read `def.personality`
  (walk multipliers) — pets keep the no-bubbles rule (deliberate).
- Registry: fallback 'random' pool becomes the union of ACTIVE humanoid
  non-pet avatars from builtin NON-franchise packs (franchise members never
  surprise an unidentified person; unload-everything degrades to [adult]).

**CONVENTIONS (no rig change — documented recipes for the generator):**
- Diagonal sash/baldric = thin rotated box on `chest`; patches/spots =
  N proud boxes/spheres (≥3 mm offset — coincident-face gotcha); elephant
  ears / mermaid tail / penguin flippers / broad hippo muzzle = accessory
  recipes; sk floor 0.45 (nav/gait untested below); existing kinds keep their
  EXACT legacy ids (underscores — `tech_expert`, not `tech-expert`).

**PARK (ROADMAP backlog):** fabric patterns/prints & decals/text (no-texture
house style is deliberate), extra visor eye variants, animated tails/wings/
ears, hop/knuckle gaits, per-tentacle idle channels, wrist/ankle/limb-mid
anchors, sessile/rooted mode, quad eye-color styling, pose-aware hand props.

**Core-pack correction (batch C):** core shrinks to `adult` ONLY (the
irremovable default). The other 23 legacy kinds MOVE into their base-group
packs under their bare legacy ids (base packs are builtin + default
loaded+active, so out-of-the-box behavior is unchanged; unloading a base
pack degrades its members to adult — exactly the intended control).
cat/dog land in base-domestic-animals.

## Gotchas checklist (for the implementing agents)

- `avatarPacks` in `_loadFromHa` explicit list or it resets on load.
- `avatars.ts` must stay three-js-free (shared chunk; 2D canvas + sidebar
  import it).
- Do NOT statically import pack data modules anywhere in the startup graph —
  manifest only; bodies via dynamic import (code-splitting gotcha mirrors
  three-renderer's).
- Accessory meshes: children of `root`, share the outline pass; sprite-free
  (no `_disposeSpriteMaps` interaction); materials created via `_mat()`.
- Widening `AvatarKind` → string: keep the legacy union exported for core
  pack typing; `types.ts` store fields become `AvatarId`.
- Settings moves are pure relocations — reuse the exact render/mutation
  code; collapsed-key localStorage slugs for removed sidebar sections are
  harmless stale entries.
- HACS zip ships whatever `dist/` contains — pack chunks are just more
  hashed-less chunk files; `chunkVersionQuery` pins them.
