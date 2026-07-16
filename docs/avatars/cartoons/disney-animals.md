# Avatar pack: Cartoons ▸ Classic Animal Characters

Hierarchy path: `docs/avatars/cartoons/disney-animals.md` → generated pack id
`cartoons/disney-animals`. Franchise pack (opt-in novelty, defaults
`loaded:false` like every other franchise pack — matches the convention
already established by the sci-fi/video-games/pop-culture packs).

## Overview

A nine-member set of stylized, geometric toon-homage figures inspired by the
best-known animated animal characters of the classic (1928–1942-era) studio
shorts era — **not** licensed characters, no likenesses/logos/textures.
Every silhouette cue is a primitive (box/sphere/cylinder/cone) in a flat
saturated color per the Sims-toon house style (`MeshToonMaterial`, 4-step
gradient bands, dark cartoon outlines, oversized head/hands on humanoids,
green plumbob overhead). Labels are descriptive-generic; the actual
character each member homages is named once in that member's **Reference**
line, never in the label or in-scene copy.

**Two rig families**: five members are humanoid bipeds (`_buildHumanoid`)
and four are quadrupeds (`_buildQuadruped`) — the split follows the source
material exactly: the mouse/duck/dog-person trio has always walked upright
and worn clothes, while the "pet"/"wild animal" characters have always
walked on four legs.

**Direct relation to existing kinds (the pack's central design question)**:
three of the five humanoid members correspond to `LegacyAvatarKind`s that
already ship in the locked `core` pack — `cartoon_mouse`, `cartoon_duck`,
`cartoon_dog`. The core entries are generic, undressed mascot-animal shapes
(grey mouse, white duck, brown dog) with no costume; this pack does **not**
respec or mutate those locked core entries (matching the `pop-culture.md`
precedent's "regroup, don't respec" rule for locked kinds). Instead, each
franchise member is a **brand-new `AvatarDef`** — its own pack-scoped id,
its own `humanoid` color block — that sets `legacyAccessories: 'cartoon_mouse'`
/ `'cartoon_duck'` / `'cartoon_dog'` to **reuse the existing geometry-building
branch** in `_addAvatarAccessories` (ear discs, bill, muzzle/ear slabs) while
supplying entirely different resolved colors. This works structurally
because that branch reads the *resolved* `c.skin`/`c.body`/`c.dark` colors
off whichever `AvatarDef` is currently being built, not a literal string —
the routing field only says which shape code to run. See **Rig gaps** for
two real caveats this reuse path hits (a hardcoded pink inner-ear disc, and
`cartoon_dog`'s ear/muzzle colors being hardcoded literals rather than
parameterized).

The quadruped lion cub and elephant calf members are also worth relating to
`docs/avatars/base/zoo-animals.md`'s (not-yet-built) realistic adult `lion`
and `elephant` proposals: those are grown, true-to-life-proportioned wild
animals in a completely separate pack namespace (`base/zoo-animals`), so
there's no id collision — but this pack's cub/calf versions are deliberately
**juvenile, chibi-proportioned, and Disney-stylized** (oversized head, short
legs, no mane/tusks yet) rather than smaller copies of the adult specs, and
they inherit that pack's already-flagged elephant-ear gap (see Rig gaps).

**Shared humanoid base spec** (the three humanoid mascot recolors + the two
new chipmunk members all start here, then override):
```ts
base: {
  headShape: 'sphere', hands: 'sphere', eyes: 'dots', steel: false,
  footMul: [1, 1, 1],
},
```
Eyes stay the plain `'dots'` style pack-wide — these are mascot-cute
characters, not menacing/stylized adults, and `'dots'` is the closest
existing match to the big simple button eyes of the era (no new eye style
needed for the humanoid half of this pack).

**Shared quadruped convention**: all four-legged members use `tail: 'tuft'`
or `'up'` (never `'none'`) — every one of these characters has an
expressive, storytelling tail (Pluto's swishing tail, Simba's mane-matching
tuft, Dumbo's stub, Bambi's raised white "flag") and losing it would be a
real silhouette regression.

---

## Members

### founding-mouse
**Label**: The Founding Mouse (black & red)
**Reference**: Disney's flagship mascot mouse, debuting in *Steamboat
Willie* (1928) and still the studio's icon today. Canonical modern look:
solid black body/head, red shorts with two large buttons, oversized white
gloves, big yellow-tan shoes, and two huge black circular ears that read as
flat discs from every angle.

**Spec**
```ts
'founding-mouse': {
  sk: 0.85, headR: 120, headShape: 'sphere', limbR: 0.9,
  skin: 0x16161a /* solid black body+head, same tone as the ears */,
  body: 0x16161a, shoe: 0xf2c230 /* yellow-tan shoes */,
  legColor: 0xd21f1a /* red shorts */, emI: 0.05, hands: 'sphere',
  eyes: 'dots', steel: false, earSkip: false,
  legacyAccessories: 'cartoon_mouse' /* reuses the existing ear-disc + tail branch */,
},
```
`sk`/`headR`/`limbR` copy the existing `cartoon_mouse` proportions verbatim
— only the color fields change. Legs stay visible in `legColor` red (no
cone/skirt — a proper pair of shorts, not a gown).

**Accessories**
- **hip (accent)**: two small white button-disc dots (flattened spheres,
  `~14mm r * sk`) on the shorts front, `0xf5f2ea` — the one canonical detail
  the reused ear/tail branch doesn't provide on its own.
- *(inherited from `cartoon_mouse`'s branch, unchanged)*: two big ear discs
  at the `head` anchor (now rendering in `0x16161a` since they read `c.skin`)
  + a curled two-segment tail.

**Silhouette check**: the black head/body + bright red shorts + big
black-disc ears is the most recognizable mascot silhouette in animation
history and reads instantly at 30px — the color swap from the core kind's
plain grey is the entire job here. One approximation: the reused branch's
pink inner-ear disc (canonically solid black, no pink) — see Rig gaps.

**Personality**: `{ cadenceMul: 1.2, bobMul: 1.1 }` (peppy, chipper walk).
**Bubbles**: `['🎶', '👋', '⭐', '😄']`

---

### sailor-duck
**Label**: The Sailor Duck (blue & white)
**Reference**: Disney's hot-tempered anthropomorphic duck — white feathers,
a flat orange bill, orange webbed feet, and his signature blue sailor
middy shirt with a wide collar plus a matching blue sailor cap; no trousers
(bare below the shirt hem, per the classic gag design).

**Spec**
```ts
'sailor-duck': {
  sk: 0.85, headR: 122, headShape: 'sphere', limbR: 0.9,
  skin: 0xf2f0e6 /* white feathers, unchanged from cartoon_duck */,
  body: 0xf2f0e6, shoe: 0xe8a020 /* orange webbed feet, unchanged */,
  legColor: 0xe8a020, footMul: [1.6, 0.7, 1.35], emI: 0.20,
  hands: 'sphere', eyes: 'dots', steel: false,
  legacyAccessories: 'cartoon_duck' /* bill + webbed-feet geometry, unchanged */,
},
```
This is the pack's cleanest reuse case: the existing `cartoon_duck` body/
bill/feet colors are *already* Donald's exact palette, so nothing about the
base kind needs recoloring at all — the whole job is layering the sailor
costume on top via new accessories.

**Accessories**
- **chest**: sailor collar — a wide, flat V-shaped pair of angled boxes
  (`TORSO_W*1.1 × 12 × 90mm` each) laid over the shoulders front-and-back,
  navy-blue `0x2255aa`, with a thin white piping edge (a slightly larger,
  paler `0xeaf1fa` box directly behind each collar panel, just proud enough
  to peek out — coincident-face-safe per the documented gotcha).
- **chest (accent)**: a small black bow/knot, `0x161619`, at the collar's V.
- **crown**: sailor cap — a short, wide flat-topped cylinder brim
  (`r ≈ HEAD_R*1.15, h ≈ 28mm*sk`) in navy `0x2255aa`, sitting low on the
  head (bills-style caps ride low, not up top like the archer's hair), with
  a thin black tally-ribbon accent (`color`, the pack's tint-carrier for
  this member) trailing off the back edge.

**Silhouette check**: white body + orange bill (already present) plus the
navy sailor collar-and-cap combo is unmistakable at 30px; no part of this
needs approximation — fully achievable with the current rig.

**Personality**: `{ cadenceMul: 1.3, swayMul: 1.1, ampMul: 1.15 }` (quick,
a little indignant/blustery gait — famously easily riled up).
**Bubbles**: `['💢', '🗯️', '🦆', '😤']`

---

### tall-dog-pal
**Label**: The Tall Dog Pal (orange & green)
**Reference**: Mickey's tall, ungainly, endearingly clumsy anthropomorphic
dog-person friend — a lanky build, long floppy ears, buck teeth, and a
signature outfit: orange turtleneck, black vest, blue trousers, big brown
shoes, white gloves, and a tall green fedora-style hat with a black band.

**Spec**
```ts
'tall-dog-pal': {
  sk: 1.05 /* taller than cartoon_dog's stocky 0.95 */, headR: 128, headShape: 'sphere',
  limbR: 0.85 /* leaner than cartoon_dog's default 1.0 */,
  skin: 0xd98a4a /* lighter orange-tan hide than cartoon_dog's 0xa1704a */,
  body: 0xd98a4a, shoe: 0x5a3d28 /* brown shoes, unchanged */,
  legColor: 0x2b4a8a /* blue trousers */, emI: 0.18,
  armL: 1.15, legL: 1.15 /* lanky proportions — the pack's tallest, gangliest member */,
  hands: 'sphere', eyes: 'dots', steel: false,
  legacyAccessories: 'cartoon_dog' /* floppy-ear + muzzle + nose geometry */,
},
```

**Accessories**
- **crown**: tall hat — a tall narrow cylinder crown (`r ≈ HEAD_R*0.7, h ≈
  180mm*sk`) plus a small brim disc at its base, forest-green `0x1f7a3a`,
  with a thin black hatband box wrap near the base of the crown.
- **chest/torso-front**: black vest — two side-panel boxes flanking the
  chest centerline over the orange turtleneck, `0x161619`, leaving a thin
  strip of the orange skin/body color visible down the middle (the shirt-V).
- **face**: two small white buck-tooth boxes (`~14 × 20 × 6mm`) poking down
  just below the reused muzzle box — the one added facial detail this
  member needs beyond the inherited `cartoon_dog` snout/nose.

**Silhouette check**: the unusually LONG limbs (tallest, leggiest member in
the roster) topped by a tall green hat is the one thing that reads
"gangly dog-person, not a normal dog" at 30px — the muzzle/ear/nose shapes
alone (inherited) would otherwise read closer to `cartoon_dog`. **Caveat**:
`cartoon_dog`'s reused ear-slab (`0x6b4226`) and muzzle-box (`0xc99e6a`)
materials are hardcoded literals in `_addAvatarAccessories`, not derived
from the passed-in `skin`/`body` — so they render at their ORIGINAL brown
tones regardless of this member's lighter orange-tan `skin` override. The
mismatch is small (both are warm browns/tans in the same family) and is
accepted here as a shipped approximation; see Rig gaps for the proper fix.

**Personality**: `{ cadenceMul: 0.9, swayMul: 1.3, bobMul: 1.2 }` (loose,
clumsy, big stumbling steps — "gawrsh" energy).
**Bubbles**: `['😅', '🦴', '🎣', '🤪']`

---

### yellow-pup
**Label**: The Yellow Pup (true quadruped)
**Reference**: Mickey's pet dog — unlike the dog-PERSON above, this
character has always been a true non-anthropomorphic quadruped. Medium-
sized, short-haired, yellow-orange/tan coat with darker, almost-black
floppy ears, a black nose, and a long, constantly swishing tail
(bloodhound-adjacent mixed breed per official descriptions).

**Spec**
```ts
'yellow-pup': {
  rig: 'quadruped',
  sk: 1.0, bodyLen: 640, bodyW: 200, bodyH: 240 /* core dog baseline, unchanged */,
  legLen: 1.0, headR: 120, neckLen: 0, headScale: [1, 0.95, 1.05],
  ears: 'floppy', tail: 'up' /* mid-swish rather than a resting droop */, tailLen: 1.35,
  snout: 1.0,
  coat: 0xe8a020 /* yellow-orange */, belly: 0xf2d9a0 /* paler tan underside */,
  earColor: 0x2a221c /* near-black floppy ears */, snoutColor: 0x2a221c /* dark muzzle tip */,
},
```
Builds directly on the CORE `dog` quadruped entry's body proportions
(`bodyLen`/`bodyW`/`bodyH`/`headScale` copied verbatim) — the only changes
are the coat/ear/snout coloring and a slightly livelier tail carriage.

**Accessories**
- **qneck**: a small black nose-tip sphere is already implied by
  `snoutColor`; no extra accessory strictly required.
- **qback (accent, optional)**: a thin collar band, `color` (tint carrier),
  around the base of the neck — the pack's one tint-coding hook on this
  member, since coat/ear colors are both fixed canonical hues.

**Silhouette check**: solid yellow-orange body + contrasting dark floppy
ears + constantly-up tail is enough to read "cartoon pet dog" at 30px, and
also cleanly disambiguates this member from the humanoid `tall-dog-pal`
(quadruped silhouette alone does most of the work).

**Personality**: `{ cadenceMul: 1.4, ampMul: 1.2, swayMul: 1.1 }` (bouncy,
eager, tail-wagging energy — noticeably livelier gait than the sedate core
`dog`).
**Bubbles**: `['🦴', '🐾', '❤️', '😊']`

---

### chipmunk-smooth
**Label**: Chipmunk (smooth head, dark nose)
**Reference**: One half of Disney's wisecracking chipmunk duo — small,
reddish-brown rodents with a dark dorsal racing stripe, cream bellies, and
big round eyes. This one is identifiable by a smooth, neatly-groomed head
and a small black "chocolate-chip" nose; he's also the more level-headed,
scheming half of the pair.

**Spec**
```ts
'chipmunk-smooth': {
  sk: 0.55, headR: 105, headShape: 'sphere', limbR: 0.8,
  skin: 0xa9633a /* reddish-brown */, body: 0xa9633a,
  shoe: 0x5a3a24, legColor: 0xa9633a, emI: 0.10,
  armL: 0.85, legL: 0.8, hands: 'sphere', eyes: 'dots', steel: false,
},
```
A genuinely new kind (no existing chipmunk `legacyAccessories` branch to
reuse — chipmunk ears/stripe/tail are all-new geometry, not a `cartoon_
mouse` recolor; the ear-disc shape and tail curl of that branch are too
mouse-specific to pass as a chipmunk).

**Accessories**
- **head**: two small rounded ear bumps (`r ≈ HEAD_R*0.32*sk`, NOT the
  giant disc shape mouse ears use), `0xa9633a` (matches skin/body).
- **chest**: cream belly patch — a flattened oval/box, `0xe8cfa0`, centered
  on the lower torso.
- **face**: small dark nose bump, `0x2a1f1a` (near-black — the
  "chocolate-chip" identifier), at the muzzle tip.
- **back**: dorsal racing stripe — a thin dark box (`0x2a1f1a`) running
  the spine, flanked by two thinner cream stripe boxes (`0xe8cfa0`) just
  outside it (the real 3-stripe pattern: dark-cream-dark-cream-dark).
- **back**: bushy tail — a chain of 4–5 short, alternating-color cylinder
  segments (`0xa9633a` / `0xe8cfa0`), curling up over the back, larger in
  radius than `cartoon_mouse`'s thin curled tail (a chipmunk's tail is
  proportionally much bushier).

**Silhouette check**: small size + dorsal stripe + smooth round head is
recognizably "chipmunk, not mouse" at 30px (no giant disc ears, and the
back stripe reads even as a color-blocked stick figure); the small black
nose distinguishes this one from its partner up close. Fully achievable —
the stripe/tail-segment technique reuses the same "alternating small
primitives" trick the tiger stripes and racoon-style patterns elsewhere in
the doc set already rely on (see Rig gaps: this pack's cheapest instance of
the "no scatter-authoring path" gap, since it's only ~7 primitives, not the
tiger's 10+).

**Personality**: `{ cadenceMul: 1.5, ampMul: 0.7, bobMul: 1.3 }` (quick,
darting, low-to-the-ground scurry).
**Bubbles**: `['🌰', '🤔', '😏', '🧠']`

---

### chipmunk-tufted
**Label**: Chipmunk (head tuft, red nose)
**Reference**: The other half of the chipmunk duo — same reddish-brown
body/stripe pattern as his partner, but identifiable by a larger, more
prominent red/pink nose, a gap between his two front teeth, and (most
recognizably) a messy, upward-swept tuft of hair on top of his head. He's
the goofier, more impulsive half of the pair.

**Spec**
```ts
'chipmunk-tufted': {
  sk: 0.55, headR: 105, headShape: 'sphere', limbR: 0.8,
  skin: 0xa9633a, body: 0xa9633a, shoe: 0x5a3a24,
  legColor: 0xa9633a, emI: 0.10,
  armL: 0.85, legL: 0.8, hands: 'sphere', eyes: 'dots', steel: false,
},
```
Identical base spec to `chipmunk-smooth` on purpose — the two are meant to
read as a matched pair from a distance; every distinguishing feature below
lives entirely in accessories, mirroring how the source material
differentiates them.

**Accessories**
- **head** / **chest** / **back** (ears, belly patch, dorsal stripe, tail):
  identical to `chipmunk-smooth`'s set (see above) — copy verbatim.
- **face**: larger nose bump, red/pink `0xd23a5a` (bigger and more
  saturated than the smooth chipmunk's small dark-nosed version) — THE
  primary differentiator.
- **crown**: messy head tuft — 2–3 small overlapping, irregularly-angled
  spheres (`r ≈ 16–22mm*sk`) at the crown, same body color `0xa9633a`
  (fur, not a hat), tilted at varied angles for a "ruffled, just-woke-up"
  look — the pack's second differentiator and the more recognizable one at
  a glance.

**Silhouette check**: the messy head tuft is the ONE thing that reads
"the goofier chipmunk" vs. his smooth-headed partner even at 30px — the
nose-color difference confirms up close. Fully achievable; no new
capability needed beyond the sphere-cluster accessory technique already
used pack-wide for hair/tufts.

**Personality**: `{ cadenceMul: 1.6, ampMul: 0.85, bobMul: 1.5, swayMul: 1.2 }`
(even more frantic/impulsive than his partner — a touch clumsier scurry).
**Bubbles**: `['😜', '🥜', '💥', '🤪']`

---

### lion-cub-prince
**Label**: Lion Cub (golden, chibi-proportioned)
**Reference**: A young lion cub prince from a landmark 1994 animated
feature — brownish-gold fur with a lighter cream accent on the muzzle,
belly, and paws; large bright eyes; a small tuft of hair atop the head (the
earliest pre-stage of a mane, years from filling in); a short bushy tail
with a small dark tuft. Real lion cubs stand roughly 25–40 cm at the
shoulder in their first few months, versus ~1.0–1.2 m for an adult male.

**Spec**
```ts
'lion-cub-prince': {
  rig: 'quadruped',
  sk: 0.85 /* toddler-scaled — well below the (proposed, separate-pack) adult lion's sk 2.0 */,
  bodyLen: 0.9 /* compact, rounder cub torso vs. an adult's long low 1.4 */,
  bodyW: 1.05, bodyH: 0.95, legLen: 0.85 /* stubby cub legs */,
  headR: 150 /* deliberately oversized — chibi "big head, small body" cub proportion */,
  neckLen: 40 /* a short visible neck — no mane bulk yet to hide it, unlike the adult */,
  ears: 'round', tail: 'tuft', tailLen: 0.75,
  snout: 0.9,
  coat: 0xd9a24a /* brownish-gold */, belly: 0xf2e2b8 /* cream muzzle/belly/paws */,
  earColor: 0xd9a24a /* ears match the coat — no mane to contrast against yet */,
  snoutColor: 0xf2e2b8,
},
```

**Accessories**
- **crown**: the pre-mane tuft — a single small, slightly ruffled sphere
  cluster (2 overlapping spheres, `r ≈ 22mm*sk`) at the crown only, dark
  reddish-brown `0x8a4a2a` — deliberately modest and NOT the adult lion's
  full shaggy ruff (that would age the character up by years).
- **back** (optional, newborn detail): 3–4 small pale spots (`0xf2e2b8`,
  flattened tiny spheres) scattered over the back/flank — real lion cubs
  carry faint rosette spots that fade with age; included here as a subtle
  extra "young" tell, not load-bearing for the silhouette read.
- **back** (tail tip, on the `tuft` tailKind): a small dark tuft sphere,
  `0x5a3020`, proportionally smaller than the adult lion's oversized tuft.

**Silhouette check**: the oversized chibi head + small single crown-tuft
(NOT a full mane) on an otherwise golden, maneless cub body is the one
thing that reads "young cub, not adult lion" at 30px. Fully achievable with
existing quadruped primitives; the only soft gap is generic "big
expressive eyes" (see Rig gaps — shared with the elephant/fawn members).

**Personality**: `{ bobMul: 1.3, swayMul: 1.1, cadenceMul: 1.0, ampMul: 1.15 }`
(bouncy, tumbling, play-pouncing energy — the opposite of the adult lion's
slow confident prowl).
**Bubbles**: `['🦁', '👑', '☀️', '😸']`

---

### flying-elephant-calf
**Label**: Elephant Calf (oversized ears)
**Reference**: A baby circus elephant from a landmark 1941 animated
feature, ridiculed for his unusually enormous ears — which turn out to let
him fly. Soft grey skin, big blue eyes, a small trunk, and (critically) ears
that are, uniquely among this character's peers, bigger than his own body.
No tusks (he's a baby). Newborn African elephant calves stand roughly 90–100
cm at the shoulder, versus 3.0–3.36 m for a bull.

**Spec**
```ts
'flying-elephant-calf': {
  rig: 'quadruped',
  sk: 1.6 /* baby-elephant scaled — well below the (proposed, separate-pack) adult's sk 2.6 */,
  bodyLen: 1.1 /* round, chubby baby torso vs. the adult's huge 1.7 barrel */,
  bodyW: 1.3, bodyH: 1.2, legLen: 0.9 /* stubby baby legs */,
  headR: 320 /* big rounded baby head — proportionally even larger vs. body than the adult's 420/2.6 ratio */,
  neckLen: 0, ears: 'round' /* PLACEHOLDER — see Rig gaps, same as the base-pack adult elephant */,
  tail: 'tuft', tailLen: 0.55, snout: 0 /* superseded entirely by the trunk accessory, matches adult convention */,
  coat: 0x9ea0a0 /* soft grey, slightly lighter than the adult's 0x8a8a86 */,
  belly: 0xb8bab8, earColor: 0x9ea0a0, snoutColor: 0x9ea0a0,
},
```

**Accessories**
- **head** (ears, 2 instances — THE headline accessory, more so than for
  any other member in this pack): large, thin, gently-curved flat fan
  shapes (flattened hemisphere sections), grey `0x9ea0a0`, sized and angled
  so each ear's visual footprint is COMPARABLE TO OR LARGER THAN the body —
  even more oversized, relative to the torso, than the already-huge ears on
  the (proposed) adult elephant kind. This single pair of shapes carries
  the entire character.
- **face** (trunk): a short, segmented tapering cylinder chain (3–4
  segments, thinner and shorter than an adult's), grey `0x9ea0a0`, curling
  gently at the tip.
- **face** (accent): two blue eye-sphere overlays (`0x4a7ab5`) plus a couple
  of small dark upward-flick "lash" accents — approximating the character's
  famously big, sad/soulful blue eyes, since the quadruped rig has no
  dedicated eye-color field (see Rig gaps).
- **crown** (optional costume variant, not required for the base "classic
  look"): a small pointed party/circus hat with a star accent, if a circus
  setting wants the costumed version rather than the plain baby elephant.

**Silhouette check**: the two gigantic ears — bigger than the body itself —
are THE unmistakable, unambiguous read at any size, down to a handful of
pixels; nothing else in the pack comes close to needing one accessory to
carry this much weight. This is also this pack's single biggest rig-gap
stress test (see below): the existing `ears` enum has no value anywhere
near this scale or shape.

**Personality**: `{ bobMul: 1.1, swayMul: 1.2, cadenceMul: 0.75, ampMul: 0.9 }`
(toddling, lumbering waddle — small unsteady steps despite the bulk).
**Bubbles**: `['🐘', '🎪', '🪶', '💧']`

---

### spotted-fawn
**Label**: Spotted Fawn (long legs, dappled coat)
**Reference**: A young white-tailed deer protagonist from the same 1942
forest-set feature this pack's chipmunks and adjacent shorts belong to —
reddish-brown coat dappled with pale wheat-colored spots (real fawns use
this pattern for camouflage; it fades with age), a cream underbelly, big
dark eyes, tall upright ears, and the species' signature white-underside
tail that flicks upright as a "flag." Real white-tailed fawns stand roughly
45–50 cm at the shoulder at birth on notably long, gangly legs relative to
their compact torsos.

**Spec**
```ts
'spotted-fawn': {
  rig: 'quadruped',
  sk: 0.9, bodyLen: 0.85 /* short, compact torso */, bodyW: 0.75 /* slender */, bodyH: 0.9,
  legLen: 1.3 /* THE defining proportion — disproportionately long, gangly legs */,
  headR: 110 /* smaller/more elegant head than the lion cub or elephant calf's chibi heads */,
  neckLen: 90 /* slender graceful neck */,
  ears: 'long' /* tall upright oval ears */, tail: 'up' /* the raised white "flag," species-accurate */, tailLen: 0.3,
  snout: 1.0,
  coat: 0xb5623a /* reddish-brown/rust */, belly: 0xe8d9b5 /* cream underbelly */,
  earColor: 0xb5623a, snoutColor: 0x2a1f1a /* small dark nose tip */,
},
```
A wholly new kind — no existing deer/fawn `legacyAccessories` branch or
`base` pack member exists yet to relate to.

**Accessories**
- **back**/**flank** (spots — THE headline accessory): 10–14 small,
  flattened pale-wheat spheres (`0xe8d9b5`, `r ≈ 12–18mm*sk`), scattered in
  an irregular grid across the back and upper flanks, sitting proud of the
  coat surface by ~4mm (the same coincident-face-safe treatment the
  proposed zoo-animals tiger stripes use). This is the single most
  important visual element in the whole spec.
- **face**: two oversized dark eye-sphere overlays (`0x1c1410`), bigger
  relative to head size than any other quadruped in the pack — big
  soulful eyes are as core to this character's appeal as the spots.
- **head** (ear interior, optional refinement): a slightly paler inner-ear
  accent, `0xe8d9b5`, matching the belly cream — real deer ears are two-tone.

**Silhouette check**: the dappled spot pattern over a reddish-brown coat,
carried on unmistakably long, gangly legs, is the single most iconic
"baby forest deer" read that exists in animation — recognizable even as a
rough colored blob at 30px. The spots ARE this pack's heaviest instance of
the "no coat-pattern field, no scatter-authoring path" gap (see Rig gaps) —
now the THIRD pack (after zoo-animals' tiger stripes and this pack's own
chipmunk racing-stripes) to need hand-placed multi-primitive body patterns,
which is a real case for a dedicated helper.

**Personality**: `{ bobMul: 0.9, swayMul: 1.5 /* wobbly, unsteady on long new legs */, cadenceMul: 0.9, ampMul: 0.85 }`
(careful, tentative steps despite the long legs — a newborn still finding
its balance).
**Bubbles**: `['🌼', '🦋', '🍃', '💗']`

---

## Rig gaps

1. **`cartoon_dog`'s reused ear/muzzle colors are hardcoded, not
   parameterized (real, confirmed in source).** `_addAvatarAccessories`'s
   `cartoon_dog` branch builds its ear-slab and muzzle-box materials from
   literal hex constants (`0x6b4226`, `0xc99e6a`) rather than the resolved
   `skin`/`body` fields the rest of the rig reads. **The Tall Dog Pal**
   therefore can't get a fully clean recolor via `legacyAccessories` reuse —
   the ears/muzzle stay at their original brown tones regardless of this
   member's lighter orange-tan `skin` override (accepted here as a close-
   enough approximation). Proper fix: parameterize that branch off the
   resolved colors like `cartoon_mouse`'s ear-disc code already does (which
   correctly reads `c.skin`).
2. **`cartoon_mouse`'s pink inner-ear disc is unconditional.** The reused
   ear-disc branch always adds a pink `0xf2a0b5` inner disc regardless of
   the passed color — harmless for a generic cute mascot mouse, but not
   canonical for **The Founding Mouse**'s solid flat-black ear silhouette.
   Accepted as a minor shipped mismatch; a real fix would make the inner
   disc color optional/derived (e.g., omit it, or derive from `skin`).
3. **No coat-pattern / scatter-authoring primitive for quadrupeds.** Spots,
   stripes, and racing-stripes all have to be hand-placed as individual
   sphere/box accessories today. This pack hits the gap twice — the
   chipmunks' 3-stripe dorsal pattern (cheap, ~3 primitives) and **Spotted
   Fawn**'s 10–14 scattered dapple spots (expensive, matches the scale of
   the proposed zoo-animals tiger's 10+ stripe patches). Three independent
   packs now wanting this is a real case for a dedicated "scatter N small
   accent primitives across an anchor region" helper rather than continued
   hand-authoring.
4. **No huge/independently-shaped ear value, and no poseable ear
   accessory.** `docs/avatars/base/zoo-animals.md` already flagged this for
   its adult elephant's fan ears; **Elephant Calf**'s ears are the single
   most important visual feature of the whole pack (the character literally
   flies on them) and push the same gap further — there's no `ears` enum
   value anywhen near this scale, and no mechanism for the ears to animate/
   flap independently of the walk cycle (a "flying" pose would be a
   dream-tier extension, well out of scope here, but worth naming).
5. **No eye-color/style field on the quadruped rig.** `HumanoidFields` has
   a first-class `eyes` enum; `QuadrupedFields` has nothing equivalent. Big,
   expressive eyes are load-bearing for THREE of this pack's four
   quadrupeds — **Lion Cub**'s bright cub eyes, **Elephant Calf**'s
   signature big blue eyes, and **Spotted Fawn**'s soulful dark eyes all
   have to be approximated via generic `face`-anchor sphere accessories
   rather than a resolved, reusable field the way humanoid eyes work.
6. **Chipmunk pair needed genuinely new accessory geometry, not reuse.**
   Noted for completeness, not a blocker: unlike the mouse/duck/dog trio,
   neither chipmunk could reuse an existing `legacyAccessories` branch
   (the mouse's giant ear discs and thin curled tail are the wrong shape
   family entirely for a chipmunk) — both are shipped here as fully new,
   from-scratch accessory sets. Nothing about that was infeasible, just
   worth flagging since it breaks this pack's otherwise-dominant "recolor
   an existing branch" pattern.

None of the above blocked shipping any of the nine members — every one has
a complete, distinguishable spec buildable with the current rig's
primitives, anchors, and enums (using `'round'` as a documented placeholder
for the elephant calf's ears, exactly as the base zoo-animals pack already
does for its adult).

## Sources

- [Mickey Mouse — Wikipedia](https://en.wikipedia.org/wiki/Mickey_Mouse)
- [Classic Mickey Mouse Costume Guide — Carbon Costume](https://carboncostume.com/classic-mickey-mouse/)
- [The Evolution of Mickey Mouse — The Walt Disney Family Museum](https://www.waltdisney.org/blog/evolution-mickey-mouse)
- [Donald Duck — Wikipedia](https://en.wikipedia.org/wiki/Donald_Duck)
- [Donald Duck Through the Years — Disney Wiki](https://disney.fandom.com/wiki/Donald_Duck_Through_the_Years)
- [Goofy — Fictional Characters Wiki](https://characters.fandom.com/wiki/Goofy)
- [Dress Like Goofy Costume Guide](https://costumewall.com/dress-like-goofy/)
- [Pluto (Disney) — Wikipedia](https://en.wikipedia.org/wiki/Pluto_(Disney))
- [Pluto — Disney Wiki](https://disney.fandom.com/wiki/Pluto)
- [Chip and Dale — Disney Wiki](https://disney.fandom.com/wiki/Chip_and_Dale)
- [How to Tell Chip and Dale Apart — WDW Magazine](https://www.wdw-magazine.com/how-to-tell-chip-and-dale-apart-and-other-fun-rescue-rangers-facts/)
- [How do you tell Chip and Dale apart? — planDisney](https://plandisney.disney.go.com/question/tell-chip-dale-apart-one-black-nose-269408/)
- [Simba — Disney Wiki](https://disney.fandom.com/wiki/Simba)
- [Simba — The Lion King Wiki](https://www.mylionking.com/wiki/Simba)
- [Lion cub weight/growth facts — World Heritage Species](https://www.facebook.com/WorldHeritageSpecies/posts/lion-cub-facts-birth-weight-is-15kg-33lbs-eyes-open-at-3-to-11-days-starts-walki/3233487370248008/)
- [Lion — Smithsonian's National Zoo](https://nationalzoo.si.edu/animals/lion)
- [Dumbo — Disney Wiki](https://disney.fandom.com/wiki/Dumbo_(character))
- [How Big is a Baby Elephant? — Eco-savvy.blog](https://www.eco-savvy.blog/how-big-baby-elephant-size-weight)
- [All About Elephants — Birth & Care of Young, SeaWorld](https://seaworld.org/animals/all-about/elephants/care-of-young/)
- [Bambi — Disney Wiki](https://disney.fandom.com/wiki/Bambi_(character))
- [What Type of Deer Is Bambi? — Know Animals](https://knowanimals.com/what-type-of-deer-is-bambi/)
- [All About Deer Fawns — Texas Fawn and Friends](https://www.texasfawn.com/deer-fawns-101)
- [White-tailed deer — Wikipedia](https://en.wikipedia.org/wiki/White-tailed_deer)
- [Eastern chipmunk — Wikipedia](https://en.wikipedia.org/wiki/Eastern_chipmunk)
- Diorama source reference (existing rig conventions, anchors, `_buildHumanoid`/
  `_buildQuadruped`, `AvatarDef`/`HumanoidFields`/`QuadrupedFields`, the
  `legacyAccessories` reuse mechanism, `cartoon_mouse`/`cartoon_duck`/
  `cartoon_dog`/core `dog` source): `src/avatars.ts`, `src/three-renderer.ts`;
  sibling pack docs for format + reuse-path precedent: `docs/avatars/base/
  pop-culture.md`, `docs/avatars/cartoons/disney-princess.md`,
  `docs/avatars/base/zoo-animals.md` (elephant-ear + tiger-stripe gap
  precedents), `docs/avatars/video-games/mario.md` (glove-color gap
  precedent).
