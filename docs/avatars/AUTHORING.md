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
  sessile: true,              // rooted/legless (plant/coral) — nav/gait skipped
}
```

`HumanoidFields` (defaults = adult; omit anything default):
`sk` (skeleton scale, 1 = adult; **floor 0.45**), `headR` (absolute mm,
adult 126), `headShape` `'sphere'|'box'|'cylinder'|'oval'`, `limbR`,
`skin`/`body` (hex or `'tint'` = identity color), `shoe`, `emI` (0–0.4),
`hands` `'sphere'|'box'`, `eyes`
`'dots'|'visor'|'almond'|'redvisor'|'shades'|'slit'|'halfred'|'none'|'compound'|'t_visor'|'sleepy'|'luminous'`,
`eyeColor` (hex — iris tint for `dots`/`sleepy`, glow tint for
`luminous`/`t_visor`/`visor`/`redvisor`), `steel` (brushed metal),
`armL`/`legL`, `footMul [w,h,d]`, `legColor`, `earSkip`, `noFace` (skip
nose/mouth/brows), `opacity` (0–1, transparent), `hover` (mm — legless float
+ bob), `limbColors {armL?,armR?,legL?,legR?}`, `gown` (damp leg swing),
`pattern` (see below — proud scatter on the torso).
New eye styles (Phase 4a): **compound** = insect facet cluster (masked, no
nose/mouth); **t_visor** = Mandalorian helmet band + dark T slot (masked);
**sleepy** = generic eyes + half-lids; **luminous** = big glowing orbs
(outline-skipped).

`QuadrupedFields` (defaults = dog, sk 1 = beagle ~520 mm shoulder):
`sk`, `bodyLen/bodyW/bodyH` (mm at sk 1; defaults 640/200/240), `legLen`,
`headR`, `headScale`, `neckLen` (>0 inserts a neck — horse/giraffe), `ears`
`'pointy'|'floppy'|'round'|'long'|'flap'|'none'` (**flap** = giant elephant
ear plates), `tail` `'up'|'down'|'curl'|'tuft'|'none'`, `tailLen`, `snout`
(0 = flat face), `snoutShape` `'cone'` (default) | `'broad'` (wide flat
muzzle — hippo/moose/cow), `coat` (hex|'tint'), `belly`, `earColor`,
`snoutColor`, `pawColor`, `tailTipColor`, `legColor` (recolors all 4 legs;
feet stay pawColor — the dark-"points" look), `eyes` `'dot'` (default) |
`'oval'` | `'sleepy'`, `eyeColor`, `opacity`, `pattern` (proud scatter on
the body).

`AvatarPattern` (`humanoid.pattern` / `quadruped.pattern` — Phase 4a):
`{ kind: 'stripes'|'spots'|'dapples', color: hex, count?, seed? }`.
DETERMINISTIC proud-primitive scatter (seeded mulberry32 from `seed` ?? the
avatar-id hash — never `Math.random`, so a seed reproduces exactly). stripes
= vertical thin boxes alternating flanks; spots = flat discs on back/flanks;
dapples = smaller discs clustered top-side. `count` is builder-capped
(stripes ≤10, spots/dapples ≤12) to keep the ~14-primitive budget. This
SUPERSEDES hand-authored stripe lists for new packs; existing hand-placed
packs (zebra/cow/tiger) keep their accessories.

`AvatarDef.sessile: true` (Phase 4a): builds the rig LEGLESS but grounded
(root at floor, no leg joints, no gait) — a plant/coral/totem whose base is a
trunk/tuft supplied via normal accessories. In-scene it stays pinned at its
target position (nav/facing/gait skipped; idle sway only). Humanoid OR pet.

`AvatarPrimitive` (accessory):
`shape` `'box'|'sphere'|'cylinder'|'cone'`; `size` — box `[w,h,d]`, sphere
`r` or `[rx,ry,rz]` (ellipsoid), cylinder `[rTop,rBot,h]`, cone `[r,h]`
(2-tuple ok); mm at sk 1. `anchor`:
`crown|head|face|chest|back|hip|root|handL|handR|shoulderL|shoulderR|neck|tailbone`
+ limb joints `wristL|wristR|elbowL|elbowR|kneeL|kneeR|ankleL|ankleR`
(humanoid) / `qhead|qneck|qback|qrump` (quadruped). Limb-joint anchors parent
the SWINGING pivot so the accessory rides the walk — wrist = hand-group
origin, elbow/knee = the lower-limb pivot origin, ankle = shin bottom (the
knee pivot minus the shin length); all fall back to `root` on a legless
(hover/sessile) rig, so pos offsets then read from the rig root. `pos [x,y,z]`
mm offset (body-local, **−Z = front**), `rot [x,y,z]` **radians**, `color` hex |
<!-- keep with the anchor list above -->
**`chest` vs `neck` — the z baseline differs.** `chest` already sits ON the torso
FRONT face (z = −TORSO_D/2 = −70 at sk 1), so a chest accessory only needs a few
mm of extra `pos.z` to clear it (ties author −6..−16). `neck` sits at the torso
**centre** in z (z = 0, y = torso top) so that neck-ENCIRCLING pieces (ruffs,
turtleneck rings, shoulder yokes, chains) can be authored symmetrically. A
FRONT-facing neck accessory (bow tie, cravat, collar wedge, brooch, scarf knot)
must therefore carry that extra **−70** itself: author `pos.z ≈ −78 … −88`, not
−8 … −18, or it builds INSIDE the torso box and never renders.
An ENCIRCLING neck piece (ruff / choker / turtleneck / fur collar / chain) has the
mirror-image constraint: the rig has no neck geometry — the torso box runs right up
to the collar line — so the ring must **clear the torso footprint in z**. Author its
half-extent along z at **≥ 78** (= TORSO_D/2 70 + an 8 mm margin): cylinder
`size [78, 78, h]`, box `size [w, h, ≥156]`. A smaller radius builds inside the torso
and only the sliver above the torso top plane shows; exactly 70 is coincident with
the torso face (the coincident-face gotcha) and hatches.
`'tint'|'skin'|'body'|'dark'|'accent'`, `emissive`/`emissiveIntensity`/
`metalness`/`roughness`, `outlineSkip`, `sphereArc
[phiStart,phiLength,thetaStart,thetaLength]` (hoods/hair/shells).

### Torso decals & two-handed props (rig-gap batch)

- **`HumanoidFields.decals?: AvatarDecal[]`** (cap **2**) — crisp canvas-painted
  DECAL PLANES riding ~8 mm proud of the torso `chest` (−Z front) / `back` (+Z)
  face. **This is the sanctioned way to put prints, text, or a big glyph on a
  rig — never a texture map on the flat-toon BODY mesh** (the house no-body-
  texture style is deliberate; decal planes are their own family, like the
  blob / pulse / front-arrow decals). Shape:
  `{ kind: 'text'|'glyph'|'print', text?, glyph?, print?: 'dots'|'stripes'|'check'|'heart-scatter', color?: hex|'tint'|'dark', bg?: hex, scale?, anchor?: 'chest'|'back' }`.
  `text` paints uppercase-jersey (jersey number `'7'`, a word); `glyph` = one big
  emoji/char; `print` = a deterministic tiled pattern (no `Math.random`). Material
  is a flat **`MeshBasicMaterial`** (documented `_mat()`-toon exemption — toon
  banding muddies fine art); `outlineSkip`; the per-rig CanvasTexture is freed in
  `_disposeHumanoid`. Use for jersey numbers/team emblems, plaid/print shirts
  (`check`), polka dots, etc.
- **`AvatarPrimitive.twoHanded?: true`** — valid only on a `handL`/`handR`-
  anchored prim (a long prop: staff / spear / broom / bat / pole). At build it
  registers into `h.twoHandProps`; every frame the renderer re-orients it so its
  LONG axis (local **+Y**) aims from the anchor hand toward the OTHER hand (both
  hands grip it), tracking any pose (standing / walking / seated / activity). The
  prim POSITION stays at the anchor hand — author a **single centered**
  `CylinderGeometry` whose origin is the grip (it passes through the anchor hand,
  half reaching toward the other). A second offset prim does NOT ride the staff
  (its position is in the hand-local frame, un-rotated) — model the whole prop as
  one twoHanded cylinder. Plain one-handed hand props (no flag) stay rigidly
  gripped in the one hand group as before.

### Animated appendages & gait (Phase 4b)

- **`AvatarPrimitive.animate {kind, speed?, amp?, phase?}`** — per-frame motion
  about the primitive's build pose (base captured once; zero per-frame alloc):
  - `'sway'` — `rotation.x` sinusoid, `amp` rad @ `speed` rad/s. Per-prim
    `phase` (rad) offsets desync siblings — author an octopus as N sways with
    staggered phases; antennae/tentacles.
  - `'flap'` — `rotation.z` |sin| beat, `amp` rad. Mirrored wings: author the
    LEFT wing `+amp`, RIGHT `−amp`. Flap **doubles speed while the rig walks**
    (flying feel), slow when idle.
  - `'orbit'` — position circles the base in the horizontal (x/z) plane, radius
    `amp` **mm** (×sk), `speed` rad/s — orbiting drones/fairies (pair with
    `outlineSkip`).
  - `'spin'` — continuous `rotation.y` @ `speed` rad/s — propellers, halos.
  - Defaults: `speed` 2; `amp` sway 0.3 / flap 0.6 / orbit 60 (spin ignores it);
    `phase` 0.
- **`HumanoidFields.gait 'walk'|'hop'|'knuckle'`** (absent = `'walk'`, byte-
  identical to today): `'hop'` = both legs swing phase-locked with a doubled
  bounce + tucked arms (rabbit/frog/penguin); `'knuckle'` = torso pitched
  forward, short leg steps, arms long-swinging to floor contact (gorilla). Both
  reshape the WALK pose only — a standing gaited rig reads as a normal idle.
- **`QuadrupedFields.earAnimate 'flick'|'swivel'|'none'`** (absent = `'flick'` =
  today's occasional idle flick): `'swivel'` = slow independent per-ear yaw
  wander; `'none'` holds ears still.

### Variants (costume swaps)

A rig keeps ONE identity (kind + color) but can wear an alternate **look** resolved
at build time — pajamas when sleeping at night, a headband + shorts while
exercising, an apron while working in the kitchen. Looks are **overlays** spread
over the base `AvatarDef` — never sibling pack members (no pool pollution, no
identity break). All swaps are AUTO-triggered by renderer-internal pose/time state
(no manual selection); the schema tolerates unknown look ids (ignored). See
`docs/DESIGN-costumes.md`.

- **Look keys** (`LookKey`): `sleep` (lying in a bed at evening/night/late_night),
  `exercise` (engaged `exercise` activity), `cooking` (engaged
  `load_dishwasher` / `make_coffee` / `forage_fridge`). A committed look holds
  with hysteresis (~2 s to engage, ~3 s clear to revert) and fires a brief
  sparkle on each swap.
- **Universal looks** (`UNIVERSAL_LOOKS` in `src/avatars.ts`): built-in overlays
  applied to any **eligible** def with no member variant for that key — pajamas
  (lavender legs + dotted print + nightcap), workout (tint headband + charcoal
  shorts), apron (striped chest panel).
- **Eligibility** (`universalLookEligible`): the trousers predicate + humanoid
  checks — **tint skin** (`humanoid.skin` null/undefined or `'tint'`; a numeric
  costume skin like robot/alien is out), **no explicit `legColor`** (costume legs
  like the duck are out), **not a pet/quad**, **no `hover`**. Costume-identity
  kinds and pets never take a universal look, but a pack MAY still dress them via
  an explicit `variants` entry.
- **Member variants win**: author `AvatarDef.variants?: AvatarVariant[]`
  (`{ id: LookKey, overlay: AvatarLookOverlay }`). A variant whose `id` matches the
  look key **overrides** the universal look for that def (a costume kind can wear
  its own pajamas/apron). The overlay is a WHITELIST — the resolver spreads exactly:
  `skin` (`number | 'tint'`), `legColor` (`number`), `limbColors`, `decals`
  (**REPLACE** base decals, cap 2), `prims` (**REPLACE** base accessories),
  `addPrims` (**APPEND** after base/prims). Colors are numeric hex (the whole
  avatar schema is numeric — decals use `number | 'tint' | 'dark'` too). Absent
  fields keep the base value. `resolveLook(def, null | unknown)` → the base def
  unchanged (same object).

## Conventions (violations fail review)

- **Ids**: pack `id` = filename = kebab; member ids `<packId>/<member>`.
- **IP safety**: stylized geometric homage ONLY — color + silhouette. Labels
  descriptive-generic; character/franchise names live in `//` comments and
  research docs. No franchise LOGOS or likeness attempts. Generic decals are OK
  now (`decals` — a jersey number, a plain star/emblem glyph, a plaid `check`
  print) as long as they carry no trademarked mark/wordmark.
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
  `back`; skirts/gowns = cone at `hip`; flippers = ellipsoid accessories.
  **Fabric prints / text / jersey numbers now ship** → `decals` (crisp canvas
  DECAL PLANES; never a body texture map); **two-handed staffs/brooms** →
  `AvatarPrimitive.twoHanded` (see the decals & two-handed section above).
  **Shipped in Phase 4a (prefer these
  over the recipe):** giant flap ears → `ears: 'flap'`; broad hippo/moose
  muzzle → `snoutShape: 'broad'`; stripe/spot/dapple patterns → the
  `pattern` generator (deterministic scatter — not a hand-authored box list);
  extra eye styles → the `eyes` enum + `eyeColor`; cuffs/pads on the limbs →
  the `wrist/elbow/knee/ankle` anchors; plants/totems → `sessile: true`. Full
  parked list: `docs/ROADMAP.md` § avatar rig gaps.
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
