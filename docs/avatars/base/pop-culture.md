# Avatar pack: Base ▸ Pop-Culture Archetypes

Hierarchy path: `docs/avatars/base/pop-culture.md` → generated pack id `base/pop-culture`.

## Overview

Generic (non-IP) costume archetypes drawn from pop culture and folklore — the
stuff of Halloween costume aisles, not licensed characters. This pack
**regroups six kinds that already exist** in `AVATAR_KINDS` (no respec, notes
only) and **adds ten new humanoid kinds** to round the archetype set out. All
members are humanoid rigs (`_buildHumanoid`); none are quadrupeds.

**Existing members regrouped here:** `teddy_bear`, `cartoon_mouse`,
`cartoon_dog`, `cartoon_duck`, `ninja`, `magician`.

**New members to add:** `pirate`, `vampire`, `zombie`, `witch_wizard`,
`superhero`, `clown`, `mummy`, `knight`, `caveman`, `genie`.

That's 16 total members — above the usual 5–12 guideline for a pack doc, but
this group is explicitly a "regroup existing + round out" job, so the
existing six are kept lightweight (reference + note only, no Spec/Accessories
block) while the ten new kinds get full specs. Net *new* code surface is 10
kinds, in line with other packs.

**Shared style**: no textures/decals, ever — every costume cue is a primitive
(box/sphere/cylinder/cone) in a flat saturated color, bolted to one of the
seven anchors (`crown`, `head`, `face`, `chest`/`torso-front`, `back`, `hip`,
`hand`). Where a member's canonical look needs a fine material detail (stripes,
patterns, embroidery) that the primitive-only rig can't render, the doc
approximates with a solid accent color or a secondary accessory instead and
says so — this pack hits no **hard** blocking gaps (see "Rig gaps" for the
soft/approximation notes).

**Palette convention**: most members keep `skin`/`body` = `color` (the
passed-in sensor/person tint) somewhere on the rig, exactly like the existing
`adult`/`professional`/`magician`/`cowboy` entries, so the per-sensor color
coding survives even in costume. A few (vampire, zombie, mummy, clown, genie,
knight) intentionally override `skin` to a fixed archetype-defining hue
(pale, sickly green, bandage-tan, white face paint, blue, steel) because that
color IS the silhouette — for those, the sensor tint is pushed onto a small
**accent** trim piece instead (sash, cuffs, tabard, emblem — the same
`accent` material every existing kind already uses to keep tint-coding on
costumed variants; see `cyborg`'s chest panel / `ninja`'s sash for
precedent).

**Implementation notes** (bookkeeping, not new fields):
- `AVATAR_KINDS` gains the 10 new ids (position: after `magician`/`farmer` in
  the "Occupations & archetypes" block reads naturally, or a new "Costumes &
  legends" comment block).
- `AVATAR_PERSONALITY` and `AVATAR_BUBBLES` gain one entry per new id (see
  each member).
- `SPECS` (inside `_buildHumanoid`) gains one entry per new id.
- The per-kind `else if (kind === …)` accessory chain gains one branch per
  new id.
- `EAR_SKIP` gains **`knight`** (full helm shell replaces the generic ear
  bumps), **`clown`** (rainbow wig wraps the head sides), and **`mummy`**
  (uniform wrapped head — no separate ear nub reads correctly on a mummy).
  No other new member needs it (hats in this pack sit *above* the head,
  ears stay clear).

---

## Members

### teddy_bear — *existing kind: `teddy_bear`* (no respec)
Plush stubby-limbed bear mascot, already built (round ears, lighter muzzle +
belly patch, stubby tail). No refinements proposed — the existing build
already nails the archetype.

### cartoon_mouse — *existing kind: `cartoon_mouse`* (no respec)
Grey mascot mouse with oversized round ear discs (pink inner) and a curled
two-segment tail. No refinements proposed.

### cartoon_dog — *existing kind: `cartoon_dog`* (no respec)
Brown cartoon dog, floppy ear slabs + lighter muzzle box + dark nose sphere +
wagging tail. No refinements proposed.

### cartoon_duck — *existing kind: `cartoon_duck`* (no respec)
White cartoon duck, flat orange bill, orange webbed-flipper feet/legs
(`footMul`/`legColor`), waddle personality already tuned
(`swayMul: 1.7, cadenceMul: 1.15`). No refinements proposed.

### ninja — *existing kind: `ninja`* (no respec)
Matte-black full hood wrap + katana slung on the back + tint waist sash, slit
eyes. No refinements proposed — it already reads clean at 30px (silhouette:
all-black body breaks only at the tint sash).

### magician — *existing kind: `magician`* (no respec)
Black top hat + white shirt-V + tint bowtie. **One refinement proposed**: add
a **wand** prop at the `hand` anchor — a thin white cylinder (`18×260mm`,
`sk`-scaled) with a small black tip band, held down at the side. Currently
the kind has no hand prop at all; a wand is the single missing read for
"magician" vs. generic "man in a top hat," and it's a two-primitive addition
with no anchor/gap issues.

---

### pirate
**Label**: Pirate (tricorn + sash)
**Reference**: The generic swashbuckler/buccaneer archetype — tricorn hat,
eyepatch, cutlass, striped or plain shirt, sash and sword-belt, sea boots.
Not any specific character; this is the Halloween-aisle "pirate captain"
silhouette (tricorn + eyepatch + sash are consistently the three defining
pieces across costume guides).

**Spec**
```ts
pirate: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 1,
  skin: color, body: 0xe8dcc0 /* cream shirt */, shoe: 0x3b2a1a /* boots */,
  emI: 0.20, hands: 'sphere', eyes: 'dots', steel: false,
},
```

**Accessories**
- **crown**: tricorn hat, approximated as a flat brim cylinder
  (`r = HEAD_R*1.35, h = 16mm*sk`, `0x141416`) + a shorter, wider crown
  cylinder above it (`r = HEAD_R*0.8, h = HEAD_R*0.5`, same material) — the
  same brim+crown recipe as the existing `cowboy`/`magician` hats. **This is
  an approximation** — see Rig gaps (no bent/upturned-brim geometry for a
  true three-corner shape).
- **face**: eyepatch — a small dark box (`HEAD_R*0.32 × HEAD_R*0.22 × 14mm`,
  `0x0a0a0c`) over one eye, positioned so the OTHER generic eye stays visible.
- **chest/torso-front**: bandolier — a diagonal box strap
  (`TORSO_W*0.22 × TORSO_H*1.1 × 18mm`) in the `accent` (tint) material,
  crossing the chest at `rotation.z ≈ 0.5` (same recipe as `ninja`'s katana
  strap, just on the front).
- **hip**: red sash — a wide band (`TORSO_W*1.05 × TORSO_H*0.14 × TORSO_D*1.05`,
  `0x9a1f1f`) around the low waist, slightly proud (coincident-face rule).
- **hand**: hook — a small curved silver accent (approximate with a thin cone,
  `r=18mm*sk, h=90mm*sk`, tilted 0.6 rad, `0xb8bcc2` metal-ish `_mat`) at one
  hand in place of the sphere hand, sword-hand side.

**Silhouette check**: the tricorn hat silhouette is the one thing that reads
"pirate" vs. generic sailor at 30px; the eyepatch is the confirming detail up
close. Approximation flagged above (brim+crown stack, not a true bent
tricorn) — readable but soft, see Rig gaps.

**Personality**: `{ swayMul: 1.35, cadenceMul: 0.9 }` (rolling sea-legs gait).
**Bubbles**: `['⚓', '🏴‍☠️', '💰', '🦜']`

---

### vampire
**Label**: Vampire (cape + widow's peak)
**Reference**: Count Dracula-style archetype — pale/white skin, black
slicked hair with a widow's-peak point, black cape with a red lining, a
medallion, black formal suit. Verified via costume-guide consensus (pale
face, black cape + red lining, widow's peak, medallion on a ribbon).

**Spec**
```ts
vampire: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 1,
  skin: 0xe7d8ce /* pale */, body: 0x14141a /* black suit */, shoe: 0x0a0a0c,
  emI: 0.18, hands: 'sphere', eyes: 'dots', steel: false,
},
```

**Accessories**
- **back**: cape — a large inverted cone (`r = TORSO_W*1.3, h = TORSO_H*2.1`,
  `0x0d0d10`) hanging from the shoulders, PLUS a smaller inset cone just
  behind it (`r = TORSO_W*1.05, h = TORSO_H*1.9`, `0x8a1220` red) offset
  further back so only its edges peek past the black outer cone — reads as a
  red lining without a two-sided material.
- **crown/head**: widow's peak — a small flattened, forward-tilted cone tip
  (`r = HEAD_R*0.22, h = HEAD_R*0.3`, near-black `0x101013`) centered on the
  front hairline, point aimed down at the browline. Approximation of a hard
  V-part in hair; see Rig gaps.
- **face**: two tiny white cone fangs (`r=8mm*sk, h=22mm*sk`) at the mouth
  corners, points down.
- **chest**: medallion — a flat gold disc (short cylinder, `r=44mm*sk,
  h=8mm*sk`, `0xcaa53a`) at upper chest, `accent`-independent (fixed gold, not
  tint — this member's tint lives on the cape lining instead… actually the red
  lining above is fixed too; if per-sensor tint-coding matters for this kind,
  swap the lining color to `accent` instead of fixed red).

**Silhouette check**: the black cape (cone) + red lining sliver is the one
thing; pale skin + widow's peak confirm on approach. Reads well at 30px
because the cape is the single largest silhouette element on the rig.

**Personality**: `{ bobMul: 0.6, cadenceMul: 0.85 }` (slow, stiff, aristocratic
glide — minimal vertical bob).
**Bubbles**: `['🦇', '🩸', '🌙']`

---

### zombie
**Label**: Zombie (tattered + sickly)
**Reference**: The reanimated-undead archetype — sickly green-grey skin,
ragged/torn clothing, slow shambling gait, dead-eyed stare. Generic "zombie
walk" trope, not a specific franchise zombie.

**Spec**
```ts
zombie: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 1,
  skin: 0x8a9478 /* sickly green-grey */, body: 0x5a5a48 /* grimy clothes */,
  shoe: 0x2f2f28, emI: 0.10, hands: 'sphere', eyes: 'dots', steel: false,
},
```

**Accessories**
- **chest/torso-front**: 2–3 ragged cloth-tatter boxes
  (`~TORSO_W*0.3 × TORSO_H*0.25 × 10mm` each, irregular `rotation.z` ±0.3,
  darker grimy tone `0x3f3f34`) overlapping the torso edges for a torn look.
- **face**: a dark red scar slash — thin box (`HEAD_R*0.5 × 8mm × 6mm`,
  `0x5a1414`) diagonally across one cheek.

**Silhouette check**: the flat sickly green-grey skin tone reads instantly at
any distance — the ONE thing. The torn-cloth tatters confirm up close. What
this pack **cannot** fully deliver is the stereotypical forward-hunched,
arms-out shamble as a *resting* pose — see Rig gaps (no per-kind static idle
lean/arm-offset field exists yet; the walk personality multipliers below
approximate the stagger but can't bias the idle stance).

**Personality**: `{ cadenceMul: 0.55, swayMul: 1.6, bobMul: 0.85 }` (slow,
staggering, lurching shuffle).
**Bubbles**: `['🧠', '🩸', '😖']`

---

### witch_wizard
**Label**: Witch / Wizard (pointed hat)
**Reference**: The generic spell-caster archetype — tall pointed hat with a
brim, flowing robe, optional staff. Covers both the "witch" and "wizard"
reading with one build (robe color + accessories are the only variance; the
pointed hat is the one non-negotiable read per costume-history sources, which
trace the pointy-hat association to conical medieval/religious headwear and
pop culture like *The Wizard of Oz*). Distinct from the existing
`wise_oracle` kind (bearded sage in a robe, no hat) — this member adds the
pointed-hat silhouette `wise_oracle` lacks.

**Spec**
```ts
witch_wizard: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 1,
  skin: color, body: 0x3a2a52 /* deep purple robe */, shoe: 0x141416,
  emI: 0.20, hands: 'sphere', eyes: 'dots', steel: false,
},
```

**Accessories**
- **crown**: pointed hat — flat brim cylinder (`r = HEAD_R*1.35, h = 14mm*sk`,
  robe-matched `0x2a1e3e`) + a tall CONE crown on top (`r = HEAD_R*0.5,
  h = HEAD_R*1.7`, same material) tilted slightly forward
  (`rotation.z ≈ 0.12`) for the classic slouched witch-hat look. Cone
  geometry gives a genuinely pointed tip natively — no approximation needed
  here (unlike the pirate's tricorn).
- **back**: ankle-length robe skirt — reuse the `wise_oracle` recipe: a
  static box shell (`TORSO_W*1.18 × (hipY-20*sk) × TORSO_D*1.35`,
  body-matched) from hip to floor.
- **hip**: rope-cord belt — thin cylinder ring in `accent` (tint) around the
  waist, over the robe.
- **hand**: staff — a long thin cylinder (`r=16mm*sk, h=520mm*sk`,
  `0x3a2a1a` wood-brown) held vertically, topped with a small glowing orb
  (sphere, `r=40mm*sk`, `accent` material with `emissiveIntensity ≈ 0.5`) —
  reads as "magic" and carries the sensor tint.

**Silhouette check**: the pointed hat cone is the one thing — unlike the
pirate/cowboy hats, this one needs zero approximation because a cone tip IS
the witch/wizard hat point.

**Personality**: `{ cadenceMul: 0.85, swayMul: 0.7 }` (unhurried, faintly
mystical glide).
**Bubbles**: `['🔮', '✨', '🪄', '📜']`

---

### superhero
**Label**: Superhero (cape + emblem)
**Reference**: The generic caped-crusader archetype — skin-tight tinted
bodysuit, flowing cape, a bold chest emblem, hands-on-hips confidence. Kept
deliberately generic/uncostumed-in-a-specific-way per the brief (no name, no
specific color scheme beyond the sensor tint) so it reads as "a superhero,"
not any IP character.

**Spec**
```ts
superhero: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 1,
  skin: color, body: color, shoe: 0x1a1a1f,
  emI: 0.30, hands: 'sphere', eyes: 'dots', steel: false,
},
```

**Accessories**
- **back**: cape — large flowing cone (`r = TORSO_W*1.35, h = TORSO_H*2.3`,
  `accent`-adjacent but slightly darker shade of the tint for contrast against
  the body) hanging from the shoulders, same recipe as vampire's cape but
  brighter/larger and single-layer (no lining sliver).
- **chest/torso-front**: emblem — a bright contrasting box
  (`TORSO_W*0.32 × TORSO_W*0.32 × 12mm`, gold `0xcaa53a` or white
  `0xf2f2f2`, whichever contrasts the tint more) rotated `rotation.z = π/4`
  for a diamond read, centered on the chest.
- **hip**: belt — thin gold band (`TORSO_W*1.02 × 40mm*sk × TORSO_D*1.02`,
  `0xcaa53a`).
- **face** *(optional flourish, not required for the read)*: domino mask — a
  thin dark band (`HEAD_R*0.9 × HEAD_R*0.22 × 10mm`, `0x141414`) across the
  eye line.

**Silhouette check**: cape (large silhouette element) + bright chest emblem
(diamond of contrasting color against the tinted suit) is the one thing —
both called out explicitly in the brief and both read cleanly at 30px.

**Personality**: `{ ampMul: 1.15 }` (a slightly bigger, more confident
stride; otherwise standard).
**Bubbles**: `['💥', '🦸', '✨', '🛡️']`

---

### clown
**Label**: Clown (big shoes + red nose)
**Reference**: The circus/birthday-party clown archetype — white face paint,
oversized ruffled collar, rainbow wig, red nose, oversized shoes, bright
solid-color jumpsuit. Verified via costume-guide consensus (red nose +
ruffle collar + rainbow wig + oversized shoes are the four canonical pieces).

**Spec**
```ts
clown: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 1,
  skin: 0xf2ede4 /* white face paint */, body: color /* bright tinted suit */,
  shoe: 0xffcf3d, emI: 0.25, hands: 'sphere', eyes: 'dots', steel: false,
  footMul: [1.7, 0.6, 1.5],
},
```

**Accessories**
- **head**: rainbow wig — 4–5 small spheres (`r ≈ HEAD_R*0.3` each) in varied
  bright hues (`0xdd2222, 0xffcf3d, 0x3aa0dd, 0x3ac16a`) clustered around the
  head sides/back at ear height, leaving the crown open (bald-cap look).
  Wraps the head sides → drives the `EAR_SKIP` addition.
- **face**: red nose — an oversized sphere (`r = HEAD_R*0.22`, well bigger
  than the standard nose bump) at the nose position, `0xdd2222` with
  `emissiveIntensity ≈ 0.35` so it pops.
- **chest/torso-front**: ruffled collar — a flattened torus
  (`R = TORSO_W*0.7, tube = 18mm*sk`) at the neck base, bright white or
  rainbow-tinted, plus 3 small pom-pom button spheres down the front chest
  centerline in contrasting accent colors.

**Silhouette check**: the single biggest red nose "dot" on the face is the
one thing that reads at 30px (a bright emissive sphere against the white
face paint); the oversized shoes (`footMul`) confirm on approach.

**Personality**: `{ bobMul: 1.4, cadenceMul: 1.3, swayMul: 1.4 }` (bouncy,
erratic, goofy wobble).
**Bubbles**: `['🤡', '🎈', '🎪', '🎉']`

---

### mummy
**Label**: Mummy (wrapped bandages)
**Reference**: The ancient-Egyptian reanimated-mummy archetype — full-body
beige/tan linen bandage wrap head to toe, trailing loose bandage ends, stiff
shambling gait. Verified via costume-guide consensus (gauze/bandage wrap is
THE defining material, applied uniformly over the whole body).

**Spec**
```ts
mummy: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 1,
  skin: 0xd8c9a8 /* bandage tan */, body: 0xd8c9a8 /* same tone, uniform wrap */,
  shoe: 0xcfc09c, emI: 0.10, hands: 'sphere', eyes: 'dots', steel: false,
},
```

**Accessories**
- **head**: diagonal wrap band — a thin box crossing the forehead at an
  angle (`HEAD_R*1.1 × 14mm*sk × 8mm`, slightly darker tan `0xc2b28c`) to
  read as a wrap seam. `EAR_SKIP` addition — a wrapped head has no separate
  ear nub.
- **chest, hip, back** (3–4 instances total, distribute across anchors):
  trailing bandage strips — thin, elongated boxes (`~40mm*sk wide ×
  200–320mm*sk long × 8mm`, same darker tan) hanging loose off shoulder/hip
  edges at slight random-looking angles, some dangling past the knee.
- **face**: hollow eye sockets — small dark inset spheres (`r=20mm*sk`,
  `0x0e0e10`) at the eye position, deeper-set than the standard eye white, for
  a sunken look (layered UNDER/behind where the generic eye-white sphere
  would sit — if it visually conflicts, this kind can skip the generic eyes
  and use these dark sockets alone as its "eyes").

**Silhouette check**: the uniform bandage-tan color across BOTH skin and body
(no separate "shirt" or "pants" color break — unique among every other member
in this pack) plus the loose trailing strips is the one thing.

**Personality**: `{ cadenceMul: 0.45, bobMul: 0.7, swayMul: 1.1, ampMul: 0.75 }`
(very slow, stiff, short-strided shuffle).
**Bubbles**: `['🏺', '🧻', '😵‍💫']`

---

### knight
**Label**: Knight (steel plate + tabard)
**Reference**: The medieval armored-knight archetype — full steel/silver
plate armor, closed helm (sometimes with a plume), a heraldic-color tabard/
surcoat over the armor, sword at the hip. Verified via costume/history
sources (steel plate finished polished-silver or matte/burnished, plume as
a helm accent, tabard/surcoat worn over armor).

**Spec**
```ts
knight: {
  sk: 1, headR: 128, headShape: 'sphere', limbR: 1.05,
  skin: 0x9aa3ad /* steel */, body: 0x9aa3ad /* steel */, shoe: 0x585d64,
  emI: 0.10, hands: 'box' /* gauntlets */, eyes: 'visor', steel: true,
},
```

**Accessories**
- **head**: helm shell — a near-full sphere shell over the head
  (`r = HEAD_R*1.1`, phi 0..2π, theta 0..0.9π, `steel` `_mat`, same recipe as
  `ninja`'s hood but metal) — completes the closed-helm read and covers the
  ears (`EAR_SKIP` addition).
- **crown**: helm plume — a thin cone (`r=20mm*sk, h=140mm*sk`) in `accent`
  (tint) standing up from the helm crown, tilted back slightly.
- **chest/torso-front**: tabard — a rectangular cloth panel
  (`TORSO_W*0.85 × TORSO_H*0.9 × 14mm`) in `accent` (tint = the knight's
  heraldry color) proud of the steel chest, with a small centered emblem box
  in a contrasting color.
- **back**: matching tabard back panel (surcoat wraps front+back), same
  material/size, on the back face.
- **hip**: sheathed sword — a long thin box blade (`24mm*sk × 420mm*sk ×
  10mm`, steel) + a small crossguard box, slung at a slight diagonal at the
  hip via a thin strap loop.

**Silhouette check**: uniform brushed-steel body (`steel: true`, same flag
`robot`/`cyborg` already use) + closed visor band is the one thing that reads
"armored" instantly; the tint tabard confirms per-sensor identity at a
glance without breaking the armor read.

**Personality**: `{ cadenceMul: 0.75, bobMul: 1.2 }` (heavy, deliberate,
stomping gait — armor weight).
**Bubbles**: `['⚔️', '🛡️', '🐴']`

---

### caveman
**Label**: Caveman (fur pelt + club)
**Reference**: The prehistoric hunter-gatherer archetype — animal-pelt
one-shoulder wrap or loincloth, unkempt hair, a wooden club, bone
accessories, bare feet. Verified via costume-guide consensus (loincloth +
faux-fur accents + bone accessories + club/spear are the canonical pieces).

**Spec**
```ts
caveman: {
  sk: 1.05, headR: 128, headShape: 'sphere', limbR: 1.1,
  skin: color, body: 0x7a5a38 /* fur pelt */, shoe: color /* bare feet */,
  emI: 0.20, hands: 'sphere', eyes: 'dots', steel: false,
},
```

**Accessories**
- **head/crown**: messy hair tuft — 2–3 small overlapping dark spheres
  (`r ≈ HEAD_R*0.3`, `0x2a2016`) clustered on top of the head, irregular
  offsets for an unkempt look.
- **chest/torso-front + hip**: single-shoulder pelt drape — ONE diagonal box
  (`TORSO_W*0.5 × TORSO_H*1.3 × 24mm`, fur tone `0x8a6a45`, `rotation.z ≈
  0.4`) from one shoulder to the opposite hip, PLUS a hip loincloth box
  (`TORSO_W*0.9 × TORSO_H*0.3 × TORSO_D*1.1`, same fur tone) — the
  *asymmetric* single strap is the point (every other member in this pack
  is symmetric front-to-back or left-right).
- **chest**: bone necklace — 4–5 tiny white cylinder "beads"
  (`r=10mm*sk, h=26mm*sk`) strung in an arc across the upper chest,
  `0xe8e4d8`.
- **hand**: club — a wide-topped cone prop (`r=70mm*sk top tapering to
  24mm*sk grip, h=340mm*sk`, flipped so the WIDE end is up, `0x5a3f24` wood)
  gripped in one hand, resting against the shoulder at idle.

**Silhouette check**: the asymmetric single-shoulder fur drape (unique
left-right imbalance in a pack full of symmetric costumes) plus the club
prop is the one thing.

**Personality**: `{ bobMul: 1.3, cadenceMul: 0.8, ampMul: 1.25 }` (heavy,
lumbering, big stomping strides).
**Bubbles**: `['🦴', '🔥', '🦣']`

---

### genie
**Label**: Genie (blue skin + cuffs)
**Reference**: The classic wish-granting-spirit archetype — vivid blue skin,
bare/vest chest, oversized gold wrist cuffs, harem pants or a tapered
"smoke" lower body, pointed ears with hoop earrings, a red waist sash.
Verified via costume-guide consensus (blue skin + gold cuffs + red sash +
harem pants + smoke-tail hint are the recurring, non-IP-specific pieces).

**Spec**
```ts
genie: {
  sk: 1, headR: 124, headShape: 'sphere', limbR: 0.95,
  skin: 0x2f6fe0 /* saturated blue */, body: 0x1c3a78 /* deeper blue vest */,
  shoe: 0x2f6fe0 /* legs read as continuous blue, no shoe break */,
  emI: 0.28, hands: 'sphere', eyes: 'dots', steel: false, legColor: 0x2f6fe0,
},
```

**Accessories**
- **head**: small dark topknot — one sphere (`r = HEAD_R*0.3`, `0x18181c`)
  at the back-top of the head, PLUS gold hoop earrings — a thin torus
  (`R=26mm*sk, tube=6mm*sk`) at each ear position, `0xcaa53a`.
- **chest/torso-front**: vest opening — two side panel boxes
  (`TORSO_W*0.3 × TORSO_H*0.85 × 16mm` each, `0x0f2050` near-black-blue) as
  lapels, leaving a bare blue strip down the center chest exposed.
- **hip**: red sash — a thick band (`TORSO_W*1.05 × TORSO_H*0.16 ×
  TORSO_D*1.05`, `0x9a1f1f`), the sharpest color contrast on the rig.
- **hand**: gold cuffs — a chunky torus (`R=60mm*sk, tube=22mm*sk`) around
  each wrist near the hand anchor, `0xcaa53a`, `emissiveIntensity ≈ 0.3`.

**Silhouette check**: the solid saturated blue skin is the one thing — reads
at any distance, no confusion with any other member in the roster. Note: the
classic "legless smoke-tail" lower body is NOT reproduced (see Rig gaps) —
this build approximates with ordinary color-matched legs (`legColor`), which
keeps the silhouette blue but loses the tapered-wisp read up close.

**Personality**: `{ bobMul: 0.5, swayMul: 1.3 }` (floaty, minimal vertical
bob, a snake-charmer hip sway in its place).
**Bubbles**: `['🧞', '💫', '🪔', '✨']`

---

## Rig gaps

1. **No per-kind static idle-pose bias** (root pitch/arm rest-offset). The
   walk-cycle `PERSONALITY` multipliers (`bobMul`/`swayMul`/`cadenceMul`/
   `ampMul`) only scale the existing walk animation; there's no field for a
   baseline stance skew. This blocks a fully authentic **zombie** (forward
   hunch + arms drifted slightly forward even at idle) and would also help
   **caveman** (a slouchier baseline posture) and **vampire** (a stiffer,
   more upright baseline). Not blocking for this pack — approximated via the
   personality multipliers alone — but worth a future rig extension if more
   "posture" archetypes get added.
2. **No curved/bent-brim hat geometry.** Box/sphere/cylinder/cone can't
   produce a true three-cornered upturned brim. **Pirate**'s tricorn is
   approximated with the existing flat-brim-cylinder + crown-cylinder stack
   (same recipe as `cowboy`/`magician`), which reads as "a hat" but not
   specifically a tricorn shape. Not blocking — the eyepatch + sash carry the
   rest of the read — but flagged since it's the member's headline
   accessory.
3. **No tapered/legless "smoke wisp" lower-body option.** The two-segment
   rigid leg skeleton can't produce **genie**'s classic footless smoke-tail
   silhouette. Approximated with ordinary legs recolored to match the skin
   (`legColor`) so the silhouette stays unbroken-blue, but it won't read as
   "smoke" up close. A future rig extension (a single tapered cone replacing
   both legs below the hip, for kinds that opt in) would fix this cleanly —
   flagging as a nice-to-have, not a blocker for this pack.

None of the above blocked shipping a member — all ten new kinds have a
complete, distinguishable spec using only the current rig's primitives and
anchors.

## Sources

- [How to Cosplay the Genie from Aladdin: Complete Guide](https://eyecandys.com/blogs/news/genie-cosplay-aladdin)
- [Genie Costume From Aladdin – Halloween 2026 Guide](https://www.costumerealm.com/genie-costume/)
- [Clown Suit | Rainbow Clown Suit | Clown Clothing – The Horror Dome](https://www.thehorrordome.com/products/big-top-clown-suit-multicolor-value-halloween-costume)
- [How to Create a Clown Costume: Classic and Horror Clown Cosplay Guide](https://eyecandys.com/blogs/news/clown-costume-cosplay)
- [Dress Like Count Dracula Costume | Halloween and Cosplay Guides](https://costumewall.com/dress-like-count-dracula/)
- [Vampire Count Medallion as a costume accessory | Horror-Shop.com](https://www.horror-shop.com/en/p/vampire-count-medallion.html)
- [List of medieval armour components - Wikipedia](https://en.wikipedia.org/wiki/List_of_medieval_armour_components)
- [The Armour of an English Medieval Knight - World History Encyclopedia](https://www.worldhistory.org/article/1244/the-armour-of-an-english-medieval-knight/)
- [How to Dress Like a Pirate: Tips and Inspiration](https://blog.abracadabranyc.com/how-to-dress-like-a-pirate-tips-and-inspiration/)
- [Governor Tricorn Adult Pirate Costume Hat](https://halloween.com/governor-pirate-costume-hat.html)
- [Why Do Witches Wear Pointy Hats? | HISTORY](https://www.history.com/articles/witch-hat-costume-origins)
- [How to Create a Witch Costume: Complete DIY and Cosplay Guide](https://eyecandys.com/blogs/news/witch-costume-contacts)
- [Mummy Bandage Wrap – Pinterest](https://www.pinterest.com/ideas/mummy-bandage-wrap/924823243753/)
- [Mummy Costume for Kids: Easy DIY Halloween Costume](https://www.kenarry.com/mummy-costume-for-kids/)
- [Caveman Costumes - Adult Caveman and Cavewoman Halloween Costume](https://halloween.com/caveman-costumes.html)
- [Guys Caveman Costumes Studly Caveman](https://www.halloweencostumes4u.com/products/guys-caveman-costumes-studly-caveman)
- Diorama source reference (existing rig conventions, anchors, `EAR_SKIP`,
  `SPECS` table, per-kind accessory recipes): `src/three-renderer.ts`
  (`_buildHumanoid`, `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`).
