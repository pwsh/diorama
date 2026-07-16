# Avatar pack: Cartoons ▸ Yellow Henchmen & the Reformed Supervillain's Family

Hierarchy path: `docs/avatars/cartoons/despicable-me.md` → generated pack id
`despicable-me` (path `['Cartoons', 'Despicable Me']`).

## Overview

A ten-member set of stylized, geometric toon-homage figures inspired by the
gadget-villain-turned-family-man animated franchise and its yellow
pill-shaped "henchmen" — **not** licensed characters, no likenesses/logos/
textures. Every member is built from the shared humanoid rig
(`_buildHumanoid`) using only primitive shapes (box/sphere/cylinder/cone) in
flat saturated colors, per the Sims-toon house style (`MeshToonMaterial`,
4-step gradient bands, dark cartoon outlines, oversized head/hands, green
plumbob overhead). Labels are descriptive-generic ("Bald Boss," "Tall
Henchman"); the actual character each one homages is named once in that
member's **Reference** line for the researcher/regenerator, never in the
label or in-game copy.

Like the TMNT pack, this is a textbook **pack-inheritance case**: three of
the ten members (the trio of individually-named henchmen among a background
crowd of thousands) share one `minionBase` spec almost verbatim, differing
only in eye count/color, a wisp of hair, and their tiny build tweaks — while
the other three siblings share a second, looser `girlsBase` (same child
proportions, wildly different outfits/hair), and the remaining four members
(the tall bald protagonist, the elderly inventor, and one villain per era of
the original trilogy) are fully bespoke builds.

**Member-selection notes** (trimmed from a larger cast to the 5–12
primary-cast rule): the **three named henchmen** (the only individually
recognizable ones out of an army of visually identical background
characters) were kept as a set rather than picked down to one, mirroring how
the TMNT pack keeps all four brothers — the shared-base/differentiated-detail
pattern IS the point, and any one alone wouldn't represent "the henchmen" as
a concept. The **three adopted sisters** are kept as a set for the same
reason (they're always shown together and are individually much less
recognizable alone). **One villain per film in the original trilogy** was
kept (the bowl-cut gadget-obsessed rival from the first film, the luchador-
styled second-film antagonist) to give the franchise's rotating-villain
structure some representation without letting villains crowd out the core
family; the third film's villain and the protagonist's twin brother (visually
near-identical to the protagonist — a silhouette-collision risk for no real
payoff) were both cut to make room. The love-interest secret-agent character
(introduced in the second film) was also cut — popular, but secondary to the
above ten and the pack is already at the top of the recommended range.

**Shared henchman base spec** (the three-eyed-varieties henchmen start here,
then override eye count/color, hair wisp, and a small `sk` tweak):
```ts
minionBase: {
  sk: 0.55, headR: 150, headShape: 'oval', limbR: 0.85,
  skin: 0xf5d217 /* signature yellow, covers the whole bare "skin" continuously */,
  body: 0xf5d217 /* same yellow above the overall bib — no separate shirt */,
  shoe: 0x1c1c1c /* black boots */,
  legColor: 0x2b4a7a /* blue denim overalls covering the legs */,
  emI: 0, hands: 'sphere', eyes: 'none' /* replaced by custom lens accessories below */,
  steel: false, armL: 0.85, legL: 0.8, footMul: [1.15, 0.75, 1.2],
},
```
`eyes: 'none'` is deliberate: the signature "goggles" are built as face
accessories (a shared silver head-strap + one colored lens sphere per eye)
rather than the generic `eyes` enum, which is also what makes true
per-eye-color heterochromia possible for one member below (see Rig gaps for
why that matters relative to the ROADMAP-parked eye-color gap). `body` /
`skin` matching keeps the bare torso-above-the-bib reading as one continuous
yellow surface — the same "uniform single-tone" trick the TMNT pack's
turtle base and the base rig's `mummy` kind already use.

**Shared henchman accessory recipe** (called out once, referenced per member
below):
- **head**: goggle strap — a thin flattened silver ring (`HEAD_R*2.1 ×
  HEAD_R*0.22 × 10mm`, `0xb8bcc0`) wrapping the head at brow height, the same
  layering idea as the base rig's brow/eye stacking and the TMNT mask-band
  recipe.
- **face**: one colored lens sphere PER EYE (`~44mm*sk` flattened sphere),
  count and color vary per member (see below) — this single primitive per
  eye doubles as both "goggle glass" and "iris," a simplification that
  avoids stacking a separate rim + pupil (budget discipline; still reads as
  "goggle-eye" at 30px against the flat yellow head).
- **chest**: overall bib — a flattened blue box (`TORSO_W*0.85 ×
  TORSO_H*0.75 × 10mm`, `0x2b4a7a`) plus two thin shoulder straps (`TORSO_W*
  0.12 × TORSO_H*1.1 × 8mm` each) crossing over the shoulders to the bib, and
  one small square pocket patch (`TORSO_W*0.22 × TORSO_H*0.18 × 6mm`,
  `0x1f3a5f`, slightly darker denim) centered on the bib front.

Each henchman then differs only in `sk` (their one real body-size cue),
lens count/color, and a single hair-wisp accessory (their one real
"hairstyle" cue) — deliberately minimal, matching how little actually
differs between them on screen.

---

## Members

### boss
**Label**: Bald Boss (grey scarf, black turtleneck)
**Reference**: The reformed supervillain protagonist and adoptive father of
the three sisters below — canonical for a tall, lanky, bald build with pale
greyish skin, a prominent hooked/pointed nose, and a signature all-black
turtleneck-and-trousers outfit wrapped in a long grey scarf.

**Spec**
```ts
boss: {
  sk: 1.1 /* unusually tall and lanky */, headR: 138 /* long oval head */,
  headShape: 'oval', limbR: 0.82 /* thin limbs vs. a broad upper body */,
  skin: 0xacb4bd /* pale bluish-grey */, body: 0x1a1a1a /* black turtleneck */,
  shoe: 0x141414, legColor: 0x1a1a1a /* black trousers, same tone as the sweater */,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false, armL: 1.0, legL: 1.05,
},
```

**Accessories**
- **face**: beak nose — a forward-projecting cone (`r=HEAD_R*0.32,
  h=HEAD_R*0.62`) at the nose position, replacing the generic nose bump,
  skin-matched `0xacb4bd` — the single most load-bearing shape in the pack.
- **neck**: scarf wrap — a thick flattened cylinder band around the throat
  (`HEAD_R*1.3 × HEAD_R*0.5 × 40mm`), light grey `0xb8bcc0`, plus a hanging
  drape box down the front of the chest (`TORSO_W*0.35 × 320mm × 10mm`,
  proud of the sweater) for the long trailing scarf tail. This is the
  `neck`-anchor's textbook use case (collars/ties, per its landing note).
- **NOT built — hair**: bald, so no crown accessory at all (the omission
  IS the look).

**Silhouette check**: the tall, lanky, all-black silhouette topped by an
oversized pointed nose and a pale grey scarf reads instantly among nine
short, brightly-colored castmates — no other member is even close to this
height/build. Fully achievable.

**Personality**: `{ bobMul: 0.9, swayMul: 1.1, cadenceMul: 0.95, ampMul: 1.0 }`
(confident, faintly theatrical stride — old villain habits under a dad's
patience).
**Bubbles**: `['🌙', '😈', '🚀', '👧']`

---

### henchman_tall
**Label**: Tall Henchman (twin round lenses)
**Reference**: The tallest and most level-headed of the three individually-
named yellow henchmen — canonical for having both eyes (unlike his one-eyed
crewmate), a side-swept dark hair curl, and acting as the de facto leader of
the trio.

**Spec**
```ts
henchman_tall: {
  sk: 0.6 /* tallest of the three */, headR: 150, headShape: 'oval', limbR: 0.85,
  skin: 0xf5d217, body: 0xf5d217, shoe: 0x1c1c1c, legColor: 0x2b4a7a,
  emI: 0, hands: 'sphere', eyes: 'none', steel: false, armL: 0.85, legL: 0.82,
  footMul: [1.15, 0.75, 1.2],
},
```

**Accessories**
- **head + face**: shared goggle-strap recipe (see Overview), TWO lens
  spheres, both matching dark brown `0x3b2a1e`.
- **crown**: hair curl — a single small curved teardrop/cylinder
  (`~30mm*sk`) swept to one side of the crown, near-black `0x161616`.
- **chest**: shared overall-bib recipe (see Overview).

**Silhouette check**: identical yellow-pill silhouette to his two crewmates
at 30px — two lenses + the side-swept curl are the only tells, exactly the
pack-inheritance point (mirrors the TMNT brothers' mask-color-only
differentiation); confirms up close as "the two-eyed one."

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 1.0 }`
(steady, a little proud of being in charge).
**Bubbles**: `['🍌', '🤟', '😃', '🎯']`

---

### henchman_wild
**Label**: Wild-Haired Henchman (single center lens)
**Reference**: The medium-height, rebellious, music-loving member of the
trio — canonical for a single centered eye (rather than a pair) and a wild
hair spike sticking up off to one side.

**Spec**
```ts
henchman_wild: {
  sk: 0.52 /* medium height */, headR: 150, headShape: 'oval', limbR: 0.85,
  skin: 0xf5d217, body: 0xf5d217, shoe: 0x1c1c1c, legColor: 0x2b4a7a,
  emI: 0, hands: 'sphere', eyes: 'none', steel: false, armL: 0.82, legL: 0.78,
  footMul: [1.15, 0.75, 1.2],
},
```

**Accessories**
- **head + face**: shared goggle-strap recipe, ONE lens sphere centered on
  the face (`~52mm*sk`, slightly larger than the two-lens variant's single
  lens to keep it visually balanced), dark brown `0x4a3222`.
- **crown**: hair spike — a single thin cone tilted off-vertical
  (`r=14mm*sk, h=90mm*sk`), near-black `0x161616`.
- **chest**: shared overall-bib recipe.

**Silhouette check**: the single centered lens is the load-bearing cue that
separates this member from his two-eyed crewmates even in silhouette (an
off-center dark dot vs. a symmetric pair); the wild hair spike confirms up
close. Fully achievable.

**Personality**: `{ bobMul: 1.2, swayMul: 1.2, cadenceMul: 1.1, ampMul: 1.15 }`
(bouncy, restless, a bit of a troublemaker).
**Bubbles**: `['🎸', '🍌', '😝', '🎵']`

---

### henchman_small
**Label**: Small Henchman (mismatched lenses, teddy bear)
**Reference**: The shortest and most childlike of the trio — canonical for
two DIFFERENT-colored eyes (one brown, one green; exact shades vary across
appearances), minimal hair, and rarely seen without a small stuffed teddy
bear held in one hand.

**Spec**
```ts
henchman_small: {
  sk: 0.45 /* shortest — the rig's scale floor */, headR: 150, headShape: 'oval',
  limbR: 0.85, skin: 0xf5d217, body: 0xf5d217, shoe: 0x1c1c1c, legColor: 0x2b4a7a,
  emI: 0, hands: 'sphere', eyes: 'none', steel: false, armL: 0.8, legL: 0.75,
  footMul: [1.2, 0.8, 1.25],
},
```

**Accessories**
- **head + face**: shared goggle-strap recipe, TWO lens spheres in
  DIFFERENT colors — left `0x6b8f4a` (green), right `0x6b4423` (brown). Each
  eye is an independent accessory primitive with its own `color`, so true
  heterochromia is fully achievable here (see Rig gaps for why this differs
  from the built-in `eyes` enum).
- **crown**: a single sparse hair wisp — one very thin short cylinder
  (`r=3mm*sk, h=40mm*sk`), near-black `0x161616` (deliberately minimal —
  this member reads as almost bald).
- **chest**: shared overall-bib recipe.
- **handL**: teddy bear — a small round body sphere (`~50mm*sk`) plus a
  smaller head sphere (`~34mm*sk`) and two tiny ear nubs, warm tan-brown
  `0x8a5a34`, held in the resting hand. **Approximated** — a static cluster,
  not a poseable prop; see Rig gaps.

**Silhouette check**: the smallest of the three yellow pills, hugging a
small brown lump at hand height, reads as "the childlike one" before the
mismatched lens colors even register; the two different lens colors confirm
up close. Fully achievable.

**Personality**: `{ bobMul: 1.3, swayMul: 1.3, cadenceMul: 0.9, ampMul: 1.1 }`
(innocent, a little wobbly, always close to the bear).
**Bubbles**: `['🧸', '🍌', '😊', '🦆']`

---

### sister_oldest
**Label**: Bespectacled Big Sister (olive jacket, ponytail)
**Reference**: The oldest of the protagonist's three adopted daughters —
canonical for neat brown hair in a ponytail, black square-rimmed glasses, a
faded olive-green jacket over a lighter top, and a more mature, protective
bearing than her two younger sisters.

**Spec**
```ts
sister_oldest: {
  sk: 0.66 /* oldest / tallest of the three sisters */, headR: 118, headShape: 'sphere',
  limbR: 0.8, skin: 0xf0c8a0, body: 0x7a8f6e /* faded olive jacket */,
  shoe: 0xc0392b /* red sneakers */, legColor: 0x3a3550 /* dark navy-purple skirt */,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false, armL: 0.85, legL: 0.85,
},
```

**Accessories**
- **crown**: ponytail — a small flattened sphere/cylinder bun at the back of
  the crown, brown `0x5c3d22`, plus a thin white tie band at its base.
- **face**: square glasses — two small flattened box lenses + a thin bridge
  (reuse the base rig `scientist`/`tech_expert` glasses recipe, scaled down
  for a child head), black rim `0x1a1a1a`.
- **chest**: cream underlayer peek — a thin light box strip at the collar
  and cuffs (`0xf2f0e8`) proud of the jacket, hinting at the layered shirt
  underneath without a second full garment.

**Silhouette check**: the olive jacket + black glasses + neat ponytail reads
as "the responsible older one" against her two more colorful/energetic
sisters at 30px; the glasses confirm up close (the one sister who wears
them). Fully achievable.

**Personality**: `{ bobMul: 0.9, swayMul: 0.85, cadenceMul: 0.95, ampMul: 0.9 }`
(composed, watchful — the built-in oldest-sibling steadiness).
**Bubbles**: `['📚', '😌', '👓', '💕']`

---

### sister_middle
**Label**: Striped-Hat Sister (round glasses, pink)
**Reference**: The tomboyish middle sister — canonical for a pink
striped knit hat with dangling ear-flaps, round glasses, blonde shaggy hair
peeking out from under the hat, and a pink sweater over a red skirt with
maroon leggings and white boots.

**Spec**
```ts
sister_middle: {
  sk: 0.6, headR: 118, headShape: 'sphere', limbR: 0.8,
  skin: 0xf0c8a0, body: 0xdb5c86 /* pink sweater */, shoe: 0xf2f2ee /* white boots */,
  legColor: 0x6b2b3a /* maroon leggings */, emI: 0, hands: 'sphere', eyes: 'dots',
  steel: false, armL: 0.85, legL: 0.85,
},
```

**Accessories**
- **crown**: chullo hat — a rounded dome over the crown (raised + tilted
  back per the standard hood-clearance convention so the front rim clears
  the brow), pink `0xdb5c86` with a thin white stripe band `0xf2f2ee`
  around the base, PLUS two thin dangling ear-flap ribbons (short cylinders
  hanging to shoulder height) each ending in a small white pompom sphere.
- **face**: round glasses — two small flattened sphere lenses + a thin
  bridge, black rim `0x1a1a1a` (rounder than her older sister's square
  frames — the one deliberate frame-shape differentiator between the two).
- **crown (hair)**: a couple of small blonde hair-wisp cylinders
  (`0xe8c96a`) peeking out from under the hat's edge at the sides.

**Silhouette check**: the pink dangling-ear-flap hat is the single loudest
shape in the sisters' trio and is unmistakable at 30px even before the
round-vs-square glasses distinction registers up close. Fully achievable.

**Personality**: `{ bobMul: 1.15, swayMul: 1.25, cadenceMul: 1.1, ampMul: 1.15 }`
(scrappy, a little rough-and-tumble, quick to posture).
**Bubbles**: `['⚡', '😏', '🥋', '🎯']`

---

### sister_youngest
**Label**: Youngest Sister (unicorn plush)
**Reference**: The youngest of the three sisters and the emotional center of
the family arc — canonical for black hair in a high ponytail tied with a
bright red scrunchie, a yellow striped shirt, blue denim overalls, and an
ever-present stuffed unicorn toy she's rarely seen without.

**Spec**
```ts
sister_youngest: {
  sk: 0.5 /* youngest / shortest of the three */, headR: 122 /* slightly
  oversized head reads "youngest" */, headShape: 'sphere', limbR: 0.8,
  skin: 0xf0c8a0, body: 0xf0d060 /* yellow striped shirt, simplified to solid */,
  shoe: 0xf2f2ee /* white shoes */, legColor: 0x2b4a7a /* blue denim overalls */,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false, armL: 0.85, legL: 0.82,
},
```

**Accessories**
- **crown**: high ponytail — a small flattened sphere sitting high and
  slightly back on the crown, black `0x141210`, with a bright red scrunchie
  band `0xc0392b` at its base.
- **chest**: overall bib — a flattened blue box + two shoulder straps
  (reusing the henchman bib recipe at child scale), `0x2b4a7a`.
- **handL**: unicorn plush — a small rounded body ellipsoid (`~70×55×90mm`),
  pale lavender-white `0xece7f2`, a smaller head sphere, two floppy cone
  ears, and one short cone horn on the forehead tinted pale gold `0xe8d9a0`
  — this pack's single most recognizable held prop. **Approximated**; see
  Rig gaps.

**Silhouette check**: the yellow-and-blue outfit plus the pale, horned
plush hugged at chest height is the one thing that reads "youngest sister"
instantly, distinct from both her sisters and the fully-yellow henchmen;
the black ponytail + red scrunchie confirm up close.

**Personality**: `{ bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.15, ampMul: 1.15 }`
(bouncy, delighted, easily thrilled).
**Bubbles**: `['🦄', '🍬', '😊', '✨']`

---

### inventor
**Label**: Elderly Inventor (goggle glasses, lab coat)
**Reference**: The protagonist's elderly scientist and closest ally —
canonical for an elongated bald head with white side-tufts of hair,
enormous round goggle-glasses, a rumpled white lab coat with a high collar,
maroon trousers, and a pronounced stoop.

**Spec**
```ts
inventor: {
  sk: 0.9 /* shorter, stooped elder */, headR: 132 /* large elongated bald head */,
  headShape: 'oval', limbR: 0.85, skin: 0xe8c9a8 /* pale aged skin */,
  body: 0xf2f0ec /* white lab coat */, shoe: 0x2c2a28,
  legColor: 0x6b2a2a /* maroon trousers, plaid simplified to solid per house style */,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false, armL: 0.85, legL: 0.82,
},
posture: { pitch: 0.15 } /* elderly forward stoop, static root-pitch bias */
```

**Accessories**
- **crown**: white side-tufts — two small flattened spheres above the ears,
  off-white `0xe8e4dc` (bald on top — no crown-top accessory).
- **face**: huge round goggle-glasses — two large flattened sphere lenses
  (`~72mm*sk`, noticeably bigger than the base rig `scientist`'s), amber-
  tinted `0xd8c890`, dark rim `0x1a1a1a`.
- **head**: thin strap band connecting the goggles (reuse the base rig
  `scientist`'s headset-band recipe), `0x1a1a1a`.
- **head**: hearing-aid box — a tiny grey box tucked behind one ear,
  `0x8a8f94`.
- **chest**: lab-coat collar — two raised box collar flaps framing the neck,
  white `0xf2f0ec`, proud of the torso.
- **handR**: wrench prop — a short cylinder + small perpendicular box head,
  gunmetal `0x8a8f94`, held loosely.

**Silhouette check**: the huge round goggle-glasses + white lab coat +
visible forward stoop reads as "the elderly inventor" instantly against the
tall bald protagonist and the two younger villains; the wrench + hearing-aid
confirm up close. Fully achievable.

**Personality**: `{ bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.6, ampMul: 0.55 }`
(slow, shuffling, a lifetime of hunching over workbenches).
**Bubbles**: `['🔧', '🧪', '👴', '⚙️']`

---

### villain_gadget
**Label**: Bowl-Cut Rival (orange tracksuit)
**Reference**: The bowl-cut, gadget-obsessed rival villain of the original
film — canonical for a short, stocky build with a developing potbelly, a
signature orange-and-white tracksuit, oversized chunky black glasses, and a
brown bowl-cut hairstyle.

**Spec**
```ts
villain_gadget: {
  sk: 0.95 /* short and stocky, per canon */, headR: 126, headShape: 'sphere',
  limbR: 1.05, skin: 0xe8b48c, body: 0xf2802a /* bright orange tracksuit jacket */,
  shoe: 0xf2f2ee /* white sneakers */, legColor: 0xf2802a /* matching track pants */,
  emI: 0.05, hands: 'sphere', eyes: 'dots', steel: false, armL: 0.95, legL: 0.9,
},
```

**Accessories**
- **crown**: bowl-cut hair — a flattened dome (`sphereArc` trimmed and
  raised + tilted back like the standard hood-clearance convention so the
  front rim clears the brow), brown `0x4a3020`.
- **face**: chunky square glasses — two oversized flattened box lenses + a
  thick bridge (`~62mm*sk` each, bigger than the inventor's round lenses),
  black rim `0x1a1a1a`.
- **chest**: white side-stripes — two thin proud boxes running down each
  side of the torso, `0xf2f2ee` (the tracksuit's one graphic detail that
  survives as flat color-blocking).
- **root**: potbelly — a small proud sphere bulge at the belly line
  (`~40mm*sk`), skin-toned `0xe8b48c`, poking out over the waistband — a
  small but canon-accurate silhouette break in an otherwise trim tracksuit.
- **handR**: gadget prop — a chunky cylinder-and-box "gun" shape, dark grey
  `0x3a3a3a` with a small pink accent tip, held ready.

**Silhouette check**: the all-orange tracksuit + oversized square black
glasses + bowl-cut hair reads as "the gadget rival" instantly, unmistakably
distinct from the tall black-clad protagonist and the red-and-black luchador
villain below; the potbelly + gadget prop confirm up close.

**Personality**: `{ bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.1 }`
(cocky, showy, quick to strut).
**Bubbles**: `['😎', '🚀', '🦑', '👓']`

---

### villain_macho
**Label**: Luchador Villain (red cape, mustache)
**Reference**: The muscular, luchador-styled antagonist of the second film —
canonical for an imposing, heavily-built physique, a black-and-red wrestling
costume, a flowing red cape, and a thick dark handlebar mustache.

**Spec**
```ts
villain_macho: {
  sk: 1.1 /* imposing, taller and bulkier than the protagonist */, headR: 130,
  headShape: 'sphere', limbR: 1.35 /* very bulky, muscular build */,
  skin: 0xc98a5c /* tan skin */, body: 0x1a1a1a /* black wrestling singlet */,
  shoe: 0x8a1620 /* deep red boots */, legColor: 0x8a1620 /* red wrestling tights */,
  emI: 0.05, hands: 'sphere', eyes: 'dots', steel: false, armL: 1.05, legL: 1.0,
},
```

**Accessories**
- **face**: handlebar mustache — two curved thin flattened boxes under the
  nose, curling outward and slightly up, dark brown-black `0x1a1410`. The
  single most load-bearing shape in this member's read.
- **crown**: slicked dark hair — a small flattened dome, `0x1a1410`.
- **back**: cape — a large flowing cone (`r=TORSO_W*1.4, h=TORSO_H*2.4`,
  reusing the TMNT villain's cape recipe), deep red `0x8a1620`, hanging from
  the shoulders — the pack's biggest single silhouette element.
- **chest**: gold medallion — a small flat disc on a thin loop, gold
  `0xd4af37`, resting at the sternum.
- **hip**: belt — a black band with a square silver buckle, `0x141210` belt
  / `0xb8bcc0` buckle.

**Silhouette check**: the bulky muscular build + flowing red cape +
handlebar mustache reads as "luchador villain" instantly at 30px,
unmistakably distinct from the lanky protagonist and the compact orange
rival; the medallion confirms up close. Fully achievable.

**Personality**: `{ bobMul: 0.85, swayMul: 1.0, cadenceMul: 0.85, ampMul: 0.95 }`
(heavy, swaggering, deliberately imposing).
**Bubbles**: `['💪', '😤', '🌶️', '👹']`

---

## Rig gaps

1. **No "neckless capsule body" fusion (NEW).** The three henchmen's
   signature silhouette is a single continuous pill/capsule shape running
   from the top of the head straight down through the torso with no visible
   neck seam at all. The current rig always builds a separate head volume
   and a separate torso volume joined by an implicit neck gap — there's no
   way to fuse them into one uninterrupted capsule. Approximated here the
   same way the pack's `sensei`-precedent robe trick and the TMNT turtle
   base already paper over similar seams: color-matching `skin` and `body`
   to the identical yellow so the transition reads as continuous, plus a
   large `headR` sitting close atop a short `sk` torso to minimize the
   visible gap. It's a workable approximation, not a true fix — a future
   rig extension (an optional "fused head" build mode that skips the neck
   joint and extends the head geometry straight into the torso silhouette)
   would fix this cleanly and would also benefit any future pack with
   similarly neckless designs (blobs, ghosts, egg-shaped mascots).
2. **Fabric patterns / prints (existing ROADMAP gap).** The inventor's
   plaid trousers and the youngest sister's striped shirt both hit the
   already-parked "fabric patterns / prints / decals" gap (deliberately
   against the no-texture house style) — both simplified to their dominant
   solid color per the documented convention, same as every other pack.
3. **Animated secondary props (existing ROADMAP gap).** The middle
   sister's dangling ear-flap tassels are static geometry with no
   independent idle-sway channel of their own; they hang rigidly rather
   than swinging with gait/idle motion. Falls under the already-parked
   "animated appendages... independent secondary props" gap.
4. **Eye-color overrides (existing ROADMAP gap, worked around here).** The
   built-in `eyes` enum has no per-eye color parameter (the ROADMAP-parked
   "extra eye styles... eye color overrides" gap). This pack's shortest
   henchman needed true heterochromia (one green eye, one brown), and it
   was FULLY achievable by setting `eyes: 'none'` and building each eye as
   an independent, individually-colored `face` accessory instead — a
   workaround worth flagging as a precedent for future packs, though the
   underlying gap still stands for anyone wanting heterochromia through the
   generic `eyes` field itself (e.g. a two-tone pet or symmetric character
   that otherwise wants the built-in eye styles).
5. **Pose-aware hand props (existing ROADMAP gap).** The youngest sister's
   unicorn plush and the shortest henchman's teddy bear are both static
   primitive clusters held at a fixed offset from the resting hand — they
   won't reorient if the rig ever gains richer hand poses (waving, table
   IK, seated-lap holds) beyond the current default. Falls under the
   already-parked "pose-aware hand props; two-handed prop convention" gap.

None of the above blocked shipping a member — all ten have a complete,
distinguishable spec using only the current rig's primitives, anchors, and
documented conventions.

## Sources

- [Felonious Gru — Despicable Me Wiki (Fandom)](https://despicableme.fandom.com/wiki/Felonious_Gru)
- [Gru — Grokipedia](https://grokipedia.com/page/Gru)
- [Dress Like Gru Costume Guide](https://costumewall.com/dress-like-gru/)
- [Kevin, Stuart and Bob — Fictional Characters Wiki (Fandom)](https://characters.fandom.com/wiki/Kevin,_Stuart_and_Bob)
- [Kevin, Stuart & Bob — Villains Wiki (Fandom)](https://villains.fandom.com/wiki/Kevin,_Stuart_%26_Bob)
- [The Minions — Despicable Me Wiki (Fandom)](https://despicableme.fandom.com/wiki/Minions)
- [Agnes Gru — Despicable Me Wiki (Fandom)](https://despicableme.fandom.com/wiki/Agnes_Gru)
- [Margo Gru — Despicable Me Wiki (Fandom)](https://despicableme.fandom.com/wiki/Margo_Gru)
- [Edith Gru — Despicable Me Wiki (Fandom)](https://despicableme.fandom.com/wiki/Edith_Gru)
- [Dress Like Margo Costume Guide](https://costumewall.com/dress-like-margo/)
- [Dr. Nefario — Despicable Me Wiki (Fandom)](https://despicableme.fandom.com/wiki/Dr._Nefario)
- [Dr. Nefario — Incredible Characters Wiki](https://greatcharacters.miraheze.org/wiki/Dr._Nefario)
- [Vector Perkins — Despicable Me Wiki (Fandom)](https://despicableme.fandom.com/wiki/Vector)
- [Dress Like Vector Costume Guide](https://costumewall.com/dress-like-vector/)
- [El Macho — Grokipedia](https://grokipedia.com/page/el_macho)
- [El Macho — Villains Wiki (Fandom)](https://villains.fandom.com/wiki/El_Macho)
- [Eduardo Perez — Despicable Me Wiki (Fandom)](https://despicableme.fandom.com/wiki/Eduardo_Perez)
- Diorama source reference (existing rig conventions, anchors,
  `_buildHumanoid`, `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`,
  the `scientist` goggle/headband recipe, the `sensei`/`mummy`
  uniform-color-match trick, the TMNT pack's mask-band and villain-cape
  recipes): `src/three-renderer.ts`; sibling pack docs for format precedent:
  `docs/avatars/cartoons/tmnt.md`, `docs/avatars/base/careers.md`.
