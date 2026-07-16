# Avatar pack authoring reference

*The canonical guide for building future avatar packs — research docs, pack
data modules, categorization, and where each pack fits. Authored 2026-07-16
(Fable). System design: `docs/DESIGN-avatars.md`; runtime schema:
`src/avatars.ts`; shipped examples: `src/avatar-packs/*.ts` paired with their
research docs under `docs/avatars/**`.*

## The pipeline

Every pack goes through the same four stages:

1. **Research doc** (`docs/avatars/<category>/<key>.md`) — the regeneration
   source of truth, written in the member template below. A pack can always
   be rebuilt from its doc.
2. **Pack data module** (`src/avatar-packs/<key>.ts`) — pure data,
   default-exports one `AvatarPackDef`. Type-only imports from
   `../avatars.js`. Never statically imported by the startup graph.
3. **Manifest row** (`src/avatar-packs/manifest.ts`) — `{id, label, path,
   count, franchise?, load: () => import('./<key>.js')}`. Bodies stay lazy
   chunks.
4. **Content gate** — `test-pages/avatar-content-test.html` builds EVERY
   member of every manifest pack; it must stay green (`AVATAR-CONTENT PASS
   n/n`). Update its expectations only by adding packs, never by weakening
   assertions.

User-imported packs skip 2–3: they are the SAME `AvatarPackDef` shape as
JSON, validated by `validatePackJson` (avatar-store.ts) and stored in
IndexedDB. Anything this doc says about data shape applies to them too.

## Categorization — where a pack fits

The `path` array is the hierarchy shown in the Settings ▸ Avatars tree.
Existing top-level categories (extend sparingly; prefer fitting in):

| Top level | Use for | Examples (shipped) |
|---|---|---|
| `['Base', …]` | Generic archetypes, no IP. Default **loaded+active**; members feed the random-stranger pool. | Humans, Careers, Robotic, Aliens, Sci-Fi, Pop Culture, Domestic/Farm/Zoo Animals |
| `['Sci-Fi', <franchise>, <sub-series?>]` | Sci-fi franchises (any medium) | Star Trek ▸ Next Generation, Star Wars ▸ The Mandalorian, Transformers, Firefly |
| `['Pop Culture', 'TV Shows', <show>]` | Live-action TV | Friends, Seinfeld, The IT Crowd |
| `['Pop Culture', 'Movies', <film/series>]` | Live-action film | The Lord of the Rings |
| `['Video Games', <franchise>]` | Games | Zelda, Metroid, Mario, LEGO |
| `['Cartoons', <franchise>]` | Animated shows/films | Disney Princess, MLP, TMNT, He-Man |

Placement rules (tiebreaks, in order):
0. **Games always go under `Video Games`** regardless of genre (Metroid /
   Zelda / Halo precedent) — the genre rule below applies to TV/film only.
1. **Genre beats medium for sci-fi**: a sci-fi TV show or film goes under
   `Sci-Fi`, not Pop Culture (Firefly, Stranger Things precedent).
2. **Animation beats medium**: animated properties go under `Cartoons`
   (Disney Animals precedent) unless they are games (games stay under
   `Video Games`) or sci-fi (Transformers precedent — sci-fi wins).
3. Live-action, non-sci-fi → `Pop Culture` ▸ TV Shows / Movies.
4. Three path levels max; use a third level only for real sub-series
   (Star Trek ▸ TNG vs DS9) — one pack per sub-series so users can select
   subconfigurations independently.
5. A NEW top-level category (e.g. `['Anime', …]`, `['Music', …]`) is
   allowed when ≥3 packs would live there; otherwise fit the closest
   existing branch.

### Base vs franchise semantics (behavioral, not just cosmetic)

- **Base packs** (no `franchise` flag): builtin defaults **loaded+active**;
  humanoid non-pet members join the random-stranger fallback pool.
- **Franchise packs** (`franchise: true`): default **UNLOADED** (opt-in via
  Settings); members NEVER join the random pool — they appear only where a
  user selects them (sensor pools, person assignment).
- **`pet: true`** members (all quadrupeds + non-person creatures): valid
  selections, excluded from the random pool, skip standing-activity anchors
  and thought bubbles, and render as quadrupeds when `rig:'quadruped'`.
- **core** is reserved: `adult` only, locked. Never add to it.

## Member selection rule

5–12 members per pack: the **primary cast only** — characters a casual fan
names first. Omit one-episode characters, minor villains, background
ensemble. If a franchise genuinely needs more (large primary cast), split by
sub-series (path level 3) rather than exceeding ~12. Every member must pass
the **silhouette test**: recognizable at ~30 px tall via color blocking +
one signature shape (hat/hair/helmet/build). If two members would be
identical at 30 px, merge or drop one.

## Pack data schema (authoritative: `src/avatars.ts`)

```ts
{
  id: 'kebab-key',            // == filename; NEVER 'core'
  version: 1,                 // bump on ANY member change (re-import/update path)
  label: 'Display Name',
  path: ['Category', '…'],    // see taxonomy above
  builtin: true,              // shipped packs; user JSON omits
  franchise: true,            // franchise packs ONLY (see semantics)
  base: { /* Partial<AvatarDef> spread under every member — shared uniforms,
             chibi proportions (Animal Crossing), shared bodies (TMNT) */ },
  avatars: [ /* AvatarDef[] */ ],
}
```

`AvatarDef` (member):
```ts
{
  id: '<packId>/<member>',    // ALWAYS namespaced; registry is flat.
                              // Bare ids are reserved for the 24 legacy kinds.
  label: 'Captain (red uniform)',  // SHORT + descriptive-generic; the real
                                   // character name goes in a // comment ONLY
  rig: 'humanoid' | 'quadruped',
  humanoid: { … }, quadruped: { … },   // per-rig fields below
  accessories: [ /* AvatarPrimitive[], ≤10 per member */ ],
  personality: { bobMul?, swayMul?, cadenceMul?, ampMul? },  // walk feel
  bubbles: ['🎈','…'],        // 1–4 plain emoji (canvas sprite pipeline)
  posture: { pitch? },        // static root-pitch bias (stoop/hunch), radians
  pet: true,                  // see semantics above
}
```

`HumanoidFields` (defaults = adult; omit anything default):
`sk` (skeleton scale, 1 = adult; **floor 0.45**), `headR` (absolute mm,
adult 126), `headShape` `'sphere'|'box'|'cylinder'|'oval'`, `limbR`,
`skin`/`body` (hex or `'tint'` = identity color), `shoe`, `emI` (0–0.4),
`hands` `'sphere'|'box'`, `eyes`
`'dots'|'visor'|'almond'|'redvisor'|'shades'|'slit'|'halfred'|'none'`,
`steel` (brushed metal), `armL`/`legL`, `footMul [w,h,d]`, `legColor`,
`earSkip`, `noFace` (skip nose/mouth/brows), `opacity` (0–1, transparent),
`hover` (mm — legless float + bob), `limbColors {armL?,armR?,legL?,legR?}`.

`QuadrupedFields` (defaults = dog, sk 1 = beagle ~520 mm shoulder):
`sk`, `bodyLen/bodyW/bodyH` (mm at sk 1; defaults 640/200/240), `legLen`,
`headR`, `headScale`, `neckLen` (>0 inserts a neck — horse/giraffe), `ears`
`'pointy'|'floppy'|'round'|'long'|'none'`, `tail`
`'up'|'down'|'curl'|'tuft'|'none'`, `tailLen`, `snout` (0 = flat face),
`coat` (hex|'tint'), `belly`, `earColor`, `snoutColor`, `pawColor`,
`tailTipColor`, `opacity`.

`AvatarPrimitive` (accessory):
`shape` `'box'|'sphere'|'cylinder'|'cone'`; `size` — box `[w,h,d]`, sphere
`r` or `[rx,ry,rz]` (ellipsoid), cylinder `[rTop,rBot,h]`, cone `[r,h]`
(2-tuple ok); mm at sk 1. `anchor`:
`crown|head|face|chest|back|hip|root|handL|handR|shoulderL|shoulderR|neck|tailbone`
(humanoid) / `qhead|qneck|qback|qrump` (quadruped). `pos [x,y,z]` mm offset
(body-local, **−Z = front**), `rot [x,y,z]` **radians**, `color` hex |
`'tint'|'skin'|'body'|'dark'|'accent'`, `emissive`/`emissiveIntensity`/
`metalness`/`roughness`, `outlineSkip`, `sphereArc
[phiStart,phiLength,thetaStart,thetaLength]` (hoods/hair/shells).

## Conventions (violations fail review)

- **Ids**: pack `id` = filename = kebab; member ids `<packId>/<member>`.
- **IP safety**: stylized geometric homage ONLY — color + silhouette. Labels
  descriptive-generic; character/franchise names live in `//` comments and
  research docs. No logos, no text/decals, no likeness attempts.
- **Tint rule**: give every member a tint (`'tint'`/`'accent'`) surface
  somewhere (trim/sash/stripe) when it doesn't fight the costume — per-sensor
  color coding should survive. Costume-critical colors win.
- **Crown clearance**: any crown dome/hat is raised + tilted back
  (+`rot[0]` ≈ 0.4–0.5) so the front rim clears the brow (the hacker-hood
  idiom). sphereArc hoods follow the shipped hood recipes.
- **Coincident faces**: patches/stripes/panels sit ≥3 mm proud of the body
  surface (toon banding hatches coplanar faces).
- **Recipes** (parked rig gaps — approximate, and mark `// approx:`):
  diagonal sash = thin rotated box on `chest`; capes = flattened cone/box on
  `back`; skirts/gowns = cone at `hip`; big flap ears / flippers / broad
  muzzles = ellipsoid accessories; patterns = a few proud boxes, not
  scatter; fabric prints = dominant solid color. Full parked list:
  `docs/ROADMAP.md` § avatar rig gaps.
- **Scale**: sk floor 0.45; oversized creatures cap ~1.5–1.6× dog scale and
  carry size through proportions (bodyLen/legLen/neckLen), not true scale.
- **Bubbles**: plain emoji only. **rot is radians** (the furniture
  ObjectRecipe uses degrees — do not confuse the two systems).
- **Version**: any member change bumps pack `version` (that is the
  update/replace path for re-imports).

## Research-doc member template

Each `docs/avatars/<category>/<key>.md` uses exactly this structure (the 32
shipped docs are examples):

```markdown
## Overview
Hierarchy path, shared style/palette, pack-wide `base` proposal, member-
selection notes (who was omitted and why).

## Members            (5–12, primary cast only)
### <member-id>
- **id**: <packId>/<member> · **label**: "<descriptive-generic>"
- **Reference**: 1–2 sentences — who this is + canonical look (web-verified;
  name the character HERE, not in the label).
- **Spec**: fenced block of HumanoidFields/QuadrupedFields values (hex!)
- **Accessories**: bullets — shape, anchor, ~size mm, color hex, notes
  (tilt/clearance/proud-offset).
- **Silhouette check**: the ONE 30-px recognizer; flag any rig gap.
- **personality** / **bubbles**.

## Rig gaps            (new gaps this pack surfaced — check ROADMAP first)
## Sources             (URLs used)
```

## Checklist for a new pack (author + reviewer)

1. Research doc written in the template; primary-cast rule respected.
2. Pack module: schema-valid, namespaced ids, `franchise` flag correct,
   `base` used for shared bodies/uniforms, ≤10 primitives/member,
   conventions above.
3. Manifest row added (count correct); `npm run typecheck` + `npm run build`
   clean; pack emits its own lazy chunk.
4. `avatar-content-test.html` green with the new members included.
5. Settings ▸ Avatars shows the pack at the right tree position; members
   resolve + render (spot-check one in the 3D view).
