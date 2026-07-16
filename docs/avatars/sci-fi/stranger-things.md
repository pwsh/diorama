# Franchise pack: Stranger Things

**Hierarchy path**: `docs/avatars/sci-fi/stranger-things.md` — a franchise
pack under `docs/avatars/sci-fi/` (genre beats medium for sci-fi/horror —
Firefly precedent). These are stylized geometric toon homage figures
(Sims-style minifigures inspired by the show's costuming and color-coding) —
no likenesses, no logos, no copyrighted creature-design geometry beyond
silhouette/color. Every member below uses a **descriptive-generic label**
for in-app display; the actual character name lives only in the Reference
line of this doc.

## Overview

- **Group**: the core Hawkins, Indiana ensemble of *Stranger Things*
  (Netflix, 2016– ) — the kid protagonists, their two adult anchors, and the
  franchise's signature monster.
- **Member count**: 9
- **Rig**: humanoid only (the Demogorgon is bipedal in the source material —
  no quadruped needed in this pack).
- **Shared base spec** (all members start here, then override):
  ```
  sk: 1.0
  headR: 126
  headShape: 'sphere'
  limbR: 1.0
  hands: 'sphere'
  eyes: 'dots'
  steel: false
  emI: 0
  armL: 1.0
  legL: 1.0
  footMul: [1.0, 1.0, 1.0]
  ```
- **Shared style/palette — "small-town 1983 Americana vs. the sterile
  Upside Down"**: the kid cast reads as a denim-and-corduroy, earth-and-primary
  color bike gang (jeans, flannel, graphic tees, trucker caps) shot through
  with two deliberate color outliers that ARE their characters — Eleven's
  pastel pink dress under an oversized navy windbreaker (institutional,
  borrowed, "not from around here"), and Max's fiery red hair breaking the
  palette the moment she arrives as the new kid in town. The two adults
  bracket the kids in worn, working-clothes tones (Hopper's tan sheriff
  khaki, Steve's preppy pastel-polo-and-denim). The Demogorgon breaks the
  palette entirely — a bone-pale, mottled hide with no analog anywhere else
  in the pack, on purpose.
- **Member-selection notes**: trimmed from a much larger ensemble (Nancy and
  Jonathan Byers, Joyce Byers, Robin Buckley, Erica Sinclair, Eddie Munson,
  Murray Bauman, Dr. Brenner, Billy Hargrove, Vecna/Henry Creel, the Mind
  Flayer, and the Demodogs are all recognizable but secondary or
  season-specific) to the nine names a casual fan lists first: the four
  original bike-gang boys (Mike, Dustin, Lucas, Will), Eleven, the two kids
  who join the core group early (Max, Steve), the one adult who anchors the
  show from season 1 (Hopper), and the franchise's original, title-defining
  monster (the Demogorgon — kept over the later Vecna/Mind Flayer villains
  as the single "iconic creature" slot; it named the season-1 threat and
  remains the show's most reproduced silhouette in merchandise). Nine sits
  comfortably inside the 5–12 range without stretching for secondary cast.
- **Recurring accessory idiom — the diagonal strap**: reused again here for
  Dustin's backpack strap (see the Firefly, Star Trek TNG, and Star Trek DS9
  docs for the same chest→hip rotated-box approximation — a FOURTH
  independent pack hitting this need).
- **Recurring accessory idiom — dominant-solid-color pattern patches**: reused
  for Lucas's camo headband (three solid patches standing in for a mottled
  print), the same approximation Firefly's Wash Hawaiian-shirt entry and the
  Star Trek DS9 Trill-spots entry already flagged.

## Members

### 1. `psychic-girl` — "Escaped test subject (buzzed head, pink dress, blue jacket)"

**Reference**: Eleven — a girl with psychokinetic abilities who escaped a
secret government lab and is taken in by the boys. Signature Season 1 look:
a shaved/buzzed head, a pale pink smocked dress with a white collar
(hospital-issue, borrowed from the lab), and an oversized navy blue
windbreaker jacket she's given partway through; white socks and sneakers;
frequent nosebleeds when she strains her powers. (Eleven, played by Millie
Bobby Brown.)

**Spec**:
```
sk: 0.8, headR: 108, headShape: 'sphere', limbR: 0.78,
skin: 0xe8c4a0,
body: 0xeaa9bb,        // pale pink smock dress
legColor: 0xeaa9bb,    // dress falls past the hips — same tone as body
shoe: 0xf2f2ec,        // white socks/sneakers
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.78, legL: 0.8
```

**Accessories**:
- **Oversized windbreaker** (the defining garment): `chest` anchor, a boxy
  panel with slightly flared shoulders that reads bigger than her frame,
  ~ 300×260×22 mm, navy `0x1f3a5c`, with a thin white racing-stripe box
  along each side, ~6 mm wide, `0xf0f0f0`.
- **White collar**: small flattened box at the chest/neck boundary,
  ~50×10×8 mm, off-white `0xf5f5f0` — the one hint of the hospital-smock
  dress peeking above the jacket.
- **Buzzed head**: `crown` anchor, an extremely thin dome barely proud of
  the scalp (~3 mm), dark brown stubble `0x4a3626` — NOT a normal hair
  dome; the point is that it reads bald/shorn, not styled.
- **Nosebleed accent**: `face` anchor, a tiny dark-red drip, ~8 mm,
  `0x7a1414` — a subtle, non-graphic nod to the power-use tell rather than
  gore.

**Silhouette check**: a buzzed head + a boxy oversized navy jacket over a
pale pink dress hem is a combination no other member shares — nobody else
wears a dress-and-jacket layer or has a shaved head — instantly readable
even faceless at 30 px.

**Personality**: `{ bobMul: 0.75, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.8 }`
— watchful, deliberate, minimal sway; a girl unused to moving freely in the
world.
**Bubbles**: `🧇 📻 🩸 😐` (Eggo waffles, the radio/psychic connection to the
boys, the nosebleed, her flat, guarded affect)

---

### 2. `party-leader` — "Party leader (striped shirt, walkie-talkie)"

**Reference**: Mike Wheeler — the de facto leader of the kids' D&D "party,"
the one who brings Eleven home and refuses to give up on Will. Signature
look: a striped short-sleeve button-up (blue/yellow bands), light-wash
jeans, and a walkie-talkie he's rarely without. (Mike Wheeler, played by
Finn Wolfhard.)

**Spec**:
```
sk: 0.86, headR: 118, headShape: 'sphere', limbR: 0.86,
skin: 0xe0b28c,
body: 0xd9c14a,        // yellow-ground striped shirt
legColor: 0x6a86a8,    // light-wash denim jeans
shoe: 0xf0f0ec,        // white sneakers
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.86, legL: 0.88
```

**Accessories**:
- **Stripe bands** (shirt pattern): 2 thin flattened boxes across the
  chest, ~torso-width×10×4 mm each, proud 3 mm, blue `0x2f4f7a` alternating
  against the yellow ground.
- **Dark side-swept hair**: `crown` anchor, ~118×40×118 mm, near-black
  brown `0x241a12`.
- **Walkie-talkie** (signature prop): `handR` anchor, a small box + thin
  antenna cylinder, body `0x2a2a2a` (~18×40×14 mm), antenna `0x9a9a9a`
  (~30 mm).

**Silhouette check**: the yellow/blue-striped shirt plus a walkie-talkie
visibly held at the hand is the clearest "leader of the group" read in the
pack — the prop alone distinguishes him from the other three boys at a
glance.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 }`
— earnest, decisive, protective; steady forward energy.
**Bubbles**: `📻 🎲 🚲 ❤️` (walkie-talkie leadership, D&D, biking everywhere
as a group, devotion to Eleven)

---

### 3. `curious-inventor` — "Science kid (trucker cap, curly hair)"

**Reference**: Dustin Henderson — the group's chatty, big-hearted resident
scientist/tinkerer (compasses, Cerebro, later AV Club). Signature look:
curly light-brown hair mostly hidden under a red/white/navy trucker cap
("Dustin's cap"), graphic tees, and corduroy pants. (Dustin Henderson,
played by Gaten Matarazzo.)

**Spec**:
```
sk: 0.84, headR: 120, headShape: 'sphere', limbR: 0.86,
skin: 0xe8bd92,
body: 0x7a8a9a,        // grey-blue graphic tee
legColor: 0x8a6a4a,    // corduroy pants
shoe: 0xf0ece0,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.86, legL: 0.86
```

**Accessories**:
- **Trucker cap** (the defining accessory): `crown` anchor, a front panel
  ~ 130×70×20 mm red `0xb2242a`, a thin white mid-stripe `0xf0f0ec`, a mesh
  "back panel" hint in navy `0x24406e`, and a curved brim ~40 mm tan
  `0x3a2a1a` — raised + tilted back so the brim clears the brow (the
  crown-clearance idiom).
- **Curly hair tufts**: `head` anchor pair, two small spheres peeking out
  from under the cap sides, ~30 mm each, warm brown `0x8a6440`.
- **Backpack strap** (adventurer detail, the diagonal-strap idiom — see
  Overview): `chest`→`hip` anchor, olive `0x5a6b3a`, ~14 mm wide.

**Silhouette check**: the red/white/navy trucker cap — with curly hair
tufts escaping the sides — is unique in this pack; no other kid wears
headgear, so the cap alone identifies him at 30 px.

**Personality**: `{ bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.1 }`
— bouncy, chatty, enthusiastic; the liveliest gait among the boys.
**Bubbles**: `🧢 🔬 📻 🍫` (the cap, science/curiosity, the walkie-talkie,
snacking)

---

### 4. `sharp-shooter` — "Cautious scout (camo headband, slingshot)"

**Reference**: Lucas Sinclair — the group's pragmatic skeptic-turned-loyal
friend, quick to doubt the supernatural but quicker to act once convinced.
Signature look: a camouflage-print bandana/headband worn low across the
forehead, a light collared shirt over jeans, and his slingshot — the weapon
he actually uses against the Demogorgon. (Lucas Sinclair, played by Caleb
McLaughlin.)

**Spec**:
```
sk: 0.86, headR: 118, headShape: 'sphere', limbR: 0.88,
skin: 0x6b4a30,
body: 0x7a94b0,        // light blue collared shirt
legColor: 0x4a5f80,    // denim jeans
shoe: 0x2a2a2a,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.88, legL: 0.88
```

**Accessories**:
- **Camo headband** (the defining accessory, dominant-solid-color pattern
  idiom — see Overview): `crown` anchor, a thin flat band built from 3
  overlapping solid patches, olive `0x5a6b3a` / brown `0x4a3a20` / tan
  `0x8a7a52`, ~130×24×140 mm, worn low across the forehead.
- **Slingshot** (signature weapon prop): `handR` anchor, a small Y-fork
  cylinder, wood-brown `0x5a3a20`, ~10 mm radius × 70 mm.
- **Short dark hair**: `head` anchor hint beneath the headband, near-black
  `0x1c140e` (mostly covered).

**Silhouette check**: the low camo headband is the one head silhouette in
the pack that reads as "worn low across the forehead" rather than "on top
of the head" — combined with the slingshot prop, unmistakable.

**Personality**: `{ bobMul: 0.95, swayMul: 0.85, cadenceMul: 1.0, ampMul: 0.95 }`
— grounded, watchful, athletic.
**Bubbles**: `🎯 🚲 🛡️ 😠` (marksmanship, biking, protectiveness, healthy
skepticism)

---

### 5. `quiet-artist` — "Quiet artist (red vest, sandy hair)"

**Reference**: Will Byers — the gentlest and most artistic of the group,
whose abduction into the Upside Down kicks off the series and who keeps a
mysterious lingering connection to it afterward. Signature Season 1 look: a
red vest over a tan/mustard long-sleeve shirt, sandy-brown hair, and a
noticeably slighter build than the other boys. (Will Byers, played by Noah
Schnapp.)

**Spec**:
```
sk: 0.78, headR: 112, headShape: 'sphere', limbR: 0.75,
skin: 0xe8c4a0,
body: 0xc9a86a,        // tan/mustard long-sleeve shirt
legColor: 0x5a6f92,    // denim jeans
shoe: 0x3a2a1a,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.75, legL: 0.78
```

**Accessories**:
- **Red vest** (the defining garment): `chest` anchor, a fitted sleeveless
  panel over the shirt, ~torso-width×torso-height×18 mm, red `0x8a2f2f`.
- **Sandy-brown hair**: `crown` anchor, ~112×36×112 mm, `0x9c7a4a`.
- **Sketchbook** (optional held prop — his defining hobby, both D&D map
  art and comics): `handL` anchor, a small flattened box, cream pages
  `0xe8e0d0` with a thin dark cover edge `0x2a2a2a`.

**Silhouette check**: the red vest over a tan/mustard shirt, on the
smallest and slightest-built member of the boys, reads as Will instantly —
nobody else in the pack wears a vest, and his `sk`/`limbR` are deliberately
the lowest among the four boys.

**Personality**: `{ bobMul: 0.8, swayMul: 0.6, cadenceMul: 0.9, ampMul: 0.8 }`
— gentle, watchful, introspective; the quietest gait among the kids.
**Bubbles**: `🎨 📓 🌌 💭` (drawing/art, his sketchbook, the Upside Down
connection, being lost in thought)

---

### 6. `skater-newcomer` — "Skater newcomer (fiery red hair, striped tee)"

**Reference**: Max Mayfield — the new kid in town who out-skates and
out-scores the boys at the arcade before earning a place in the group.
Signature Season 2 look: bright fiery-red shoulder-length hair, a
red/yellow/blue-striped tee, rolled denim shorts, red sneakers, and her
skateboard. (Max Mayfield, played by Sadie Sink.)

**Spec**:
```
sk: 0.85, headR: 116, headShape: 'sphere', limbR: 0.85,
skin: 0xe8c2a0,
body: 0xc23b3b,        // red-ground striped tee
legColor: 0x4a6088,    // rolled denim shorts
shoe: 0xb2242a,        // red sneakers
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.85, legL: 0.85
```

**Accessories**:
- **Fiery red hair** (the single defining feature): `crown` anchor, a
  voluminous shoulder-length dome ~140×120×140 mm plus two side lobes
  ~35×90×30 mm falling past the shoulders, bright red-orange `0xd1531f`.
- **Stripe bands**: 2 thin flattened boxes across the tee, proud 3 mm,
  yellow `0xe0b83a` and blue `0x2f4f7a` (same stripe idiom as Mike's shirt,
  different palette — deliberately, they're both "striped-shirt kids" from
  different color families).
- **Skateboard** (signature prop): `handL` anchor, a thin flattened board
  ~30×140×8 mm tucked under the arm, deep red `0x8a1f1f` with small dark
  wheel-cylinder hints at each end, `0x1a1a1a`.

**Silhouette check**: bright red-orange shoulder-length hair against a
striped tee, with a skateboard tucked under one arm, is unmistakable — the
only bright-red-haired, board-carrying member in the pack.

**Personality**: `{ bobMul: 1.1, swayMul: 1.05, cadenceMul: 1.1, ampMul: 1.05 }`
— confident, restless, quick.
**Bubbles**: `🛹 🕹️ 🎧 😏` (the skateboard, her arcade high scores, music,
wry confidence)

---

### 7. `mall-cool-guy` — "Reluctant protector (feathered hair, nail bat)"

**Reference**: Steve Harrington — the popular high-schooler who evolves
from Nancy's boyfriend into the kids' loyal, self-deprecating protector and
de facto babysitter. Signature look: tall, voluminous swept-back "perfect
hair," a preppy polo/light denim look, and the nail-studded baseball bat he
wields against the Demogorgon. (Steve Harrington, played by Joe Keery.)

**Spec**:
```
sk: 1.0, headR: 128, headShape: 'sphere', limbR: 0.95,
skin: 0xe0b28c,
body: 0x8a94a0,        // light collared/polo shirt
legColor: 0x8a9cb0,    // light-wash denim jeans
shoe: 0xf2f2ec,        // white sneakers
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.95, legL: 1.0
```

**Accessories**:
- **Feathered hair** (the single most famous silhouette in the show):
  `crown` anchor, a tall voluminous swept-back dome with a slight forward
  crest, ~130×70×130 mm, dark brown `0x2a1c12` — the biggest hair volume
  in the pack, raised + tilted back so the crest clears the brow.
- **Denim jacket**: `chest` anchor, a panel over the shirt, light-blue
  denim `0x4a6a8c`, with a small proud box at the neckline suggesting a
  popped collar.
- **Nail bat** (iconic weapon prop): `handR` anchor, a wood cylinder bat
  ~18 mm radius × 120 mm, brown `0x8a6a42`, with 4–5 tiny dark cone "nail"
  spikes protruding from the striking end, `0x2a2a2a`.

**Silhouette check**: the tall swept-back hair plus a bat visibly studded
with spikes is the single most recognizable read in the pack — nobody else
carries a weapon prop or has this much hair volume.

**Personality**: `{ bobMul: 1.05, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.0 }`
— cocky-turned-caring, loose, protective swagger.
**Bubbles**: `💇 🏏 🛡️ 😏` (the hair, the nail bat, babysitter-protector
role, wry charm)

---

### 8. `small-town-sheriff` — "Small-town sheriff (tan uniform, wide-brim hat)"

**Reference**: Jim Hopper — Hawkins' gruff, world-weary chief of police,
who becomes Eleven's protector and adoptive father. Signature look: a tan
sheriff's uniform shirt with navy trousers, a wide flat-brim tan Stetson
hat, and a mustache — costuming explicitly modeled on Chief Brody from
*Jaws*. (Jim Hopper, played by David Harbour.)

**Spec**:
```
sk: 1.1, headR: 132, headShape: 'sphere', limbR: 1.15,
skin: 0xc98a5e,
body: 0xb89a68,        // tan sheriff shirt
legColor: 0x2a3a52,    // navy police trousers
shoe: 0x1a1a1a,        // black duty boots
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 1.1, legL: 1.05
```

**Accessories**:
- **Wide-brim Stetson hat** (the defining silhouette): `crown` anchor, a
  low flat-topped cylinder crown (~90 mm) plus a wide flared brim disc
  (~180 mm diameter), tan `0x8a7248`, raised + tilted back so the front
  brim clears the brow (the crown-clearance idiom).
- **Badge**: `chest` anchor, a small gold star/disc, ~20 mm, `0xd4af37`,
  slight emissive 0.1 (metal catch-light).
- **Mustache**: `face` anchor, thin flattened box just above the mouth,
  ~34×8×6 mm, grey-brown `0x6b5a42`.
- **Duty belt**: `hip` anchor, wide dark band ~260×60×20 mm, black
  `0x1a1a1a`, with a small holstered-sidearm prop.

**Silhouette check**: the flat-crowned, wide-brimmed tan hat is the single
most recognizable read in the pack — instantly "small-town lawman" the
moment it silhouettes, before the badge or mustache even register.

**Personality**: `{ bobMul: 0.85, swayMul: 0.6, cadenceMul: 0.9, ampMul: 0.85 }`
— gruff, weary, protective; the heaviest, most settled adult gait.
**Bubbles**: `☕ 🚓 😤 ❤️` (his coffee habit, sheriff duty, gruffness, a
secret soft spot as Eleven's adoptive father)

---

### 9. `flower-faced-hunter` — "Faceless hunter (petal-jawed head, elongated limbs)"

**Reference**: the Demogorgon — the original, title-defining monster of
Season 1, a tall, gaunt, upright predator from the Upside Down. Signature
design: no eyes, nose, or ears at all — its head is instead covered by
several thick, closed petal-like flaps that peel open into a five-way,
teeth-lined "flower" mouth (nicknamed the "corpse flower") when it attacks;
elongated limbs, clawed digitigrade legs, and pale, slimy, mottled skin.
(Design by Aaron Sims Creative for Season 1 of Stranger Things.)

**Spec**:
```
sk: 1.3, headR: 110, headShape: 'sphere', limbR: 0.68,
skin: 0xc9baa0,        // pale mottled grey-beige hide
body: 0xc9baa0,
legColor: 0xb8ab8e,    // slightly darker mottling toward the legs
shoe: 0x1a1a1a,        // near-black clawed feet
emI: 0.04, hands: 'sphere', eyes: 'none', steel: false,
noFace: true,
armL: 1.3, legL: 1.35,
footMul: [0.8, 1.3, 1.1]   // narrow, elongated digitigrade feet
pet: true
```

**Accessories**:
- **Petal-flap head** (the defining feature, closed/docile pose): `crown`/
  `head` anchors, 5 small overlapping cones arranged radially around the
  head, ~50×70×50 mm each, pale flesh `0xc2b39a`, with just the innermost
  tips hinting a darker interior, `0x6b2020` — reads as the closed
  flower-bud head (it only unfurls in the show's jump-scare beat; this pack
  poses it closed).
- **Clawed hands**: `handL`/`handR` anchors, 3–4 small dark cones each,
  ~14 mm, near-black `0x1a1a1a`.
- **Clawed feet**: matching small dark cones near the feet (approximated
  off the existing foot geometry — see Rig gaps; no dedicated foot anchor
  exists).

**Silhouette check**: a featureless, petal-flapped head atop a hunched,
unnaturally elongated frame (the pack's highest `sk`/`armL`/`legL`, its
only `eyes: 'none'` + `noFace` member) is instantly alien against every
human silhouette in this pack — nothing else here has no eyes at all.

**Posture**: `pitch: 0.35` (a forward hunch/stalking lean — the pack's
only member with a static forward-pitch bias).
**Personality**: `{ bobMul: 0.6, swayMul: 0.3, cadenceMul: 0.75, ampMul: 0.7 }`
— predatory, coiled, unnervingly still between strikes.
**Bubbles**: `🌸 🦷 👀 🩸` (the flower-mouth, teeth, sensing prey without
eyes, threat) — kept for schema completeness/toy-diorama flavor, but
`pet: true` means this member skips thought bubbles and standing-activity
anchors in the current rig (see Rig gaps and the `domestic-animals.md`
precedent for the same pet-suppression behavior) — a deliberate fit, not a
workaround: a mindless hunter shouldn't muse over coffee or sit at a table.

## Rig gaps

1. **No dedicated diagonal-strap/sash accessory type.** A FOURTH
   independent pack needing the chest→hip rotated-box workaround (Dustin's
   backpack strap), after Firefly (Mal's suspenders, Jayne's webbing,
   Inara's girdle) and the Star Trek TNG/DS9 docs (Worf's baldric/sash).
   Raising this gap's priority again — four packs and counting hitting the
   identical hand-tuned approximation.
2. **No decal/pattern-scatter primitive for prints.** Lucas's camo headband
   is approximated as 3 solid-color patches rather than a true mottled camo
   texture — the same class of gap already flagged for Firefly's Hawaiian
   shirt and Star Trek DS9's Trill spots (a THIRD+ pack hitting this).
   Already parked in `docs/ROADMAP.md` § Avatar rig gaps
   ("fabric patterns/prints/decals").
3. **No ankle/foot accessory anchor.** The Demogorgon's clawed feet have to
   be approximated off the existing foot/shoe geometry rather than a
   dedicated low-limb anchor point — already parked in
   `docs/ROADMAP.md` § Avatar rig gaps ("wrist/cuff, ankle/foot,
   limb-midpoint anchors").
4. **No true "unfurl" animation channel.** The Demogorgon's signature
   moment — the closed petal head peeling open into the five-petaled
   toothed mouth — has no rig support for a state-dependent shape change;
   this pack poses it permanently closed. A generic "alternate accessory
   set swapped on a trigger" mechanism (related to the parked "situational
   costume swaps" gap in `docs/ROADMAP.md`) would let a future pass build
   the open-mouth "attack" pose as a real state instead of a single static
   look.

None of these gaps blocked building this pack; all nine members are fully
expressible with the current rig via the workarounds above.

## Sources

- [How to Cosplay Eleven from Stranger Things: The Ultimate Guide — Eyecandys](https://eyecandys.com/blogs/news/cosplay-stranger-things-eleven-costume)
- [Eleven Costume Guide (Stranger Things TV Show) — Costume DIY Guide](https://costumediyguide.com/eleven-stranger-things-cosplay)
- [Dress Like Mike Wheeler Costume — Costume Wall](https://costumewall.com/dress-like-mike-wheeler/)
- [Mike Wheeler Outfits & Fashion on Stranger Things — WornOnTV](https://wornontv.net/stranger-things/mike-wheeler/)
- [Dustin Henderson Costume Guide for Cosplay and Halloween — Costume Wall](https://costumewall.com/dress-like-dustin-henderson/)
- [Stranger Things Hat Trucker SnapBack Dustin's OG Season 1 Cap — eBay](https://www.ebay.com/itm/136645029764)
- [Lucas Sinclair Costume Guide for Cosplay and Halloween — Costume Wall](https://costumewall.com/dress-like-lucas-sinclair/)
- [The bandana camouflage by Lucas Sinclair in Stranger Things S1E7 — Spotern](https://www.spotern.com/en/spot/tv/stranger-things/214008/the-bandana-camouflage-by-lucas-sinclair-caleb-mclaughlin-in-stranger-things-season-1-episode-7)
- [Yellow in Horror — Stranger Things Costuming](https://beckytylerartandphotography.com/2025/12/25/yellow-in-horror-stranger-things-costuming/)
- [Stranger Things S1 Will Byers Vest — Stranger Things Outfits](https://www.strangerthingsoutfits.com/product/stranger-things-s1-will-byers-vest/)
- [Max Mayfield Costume Guide — Costume Realm](https://www.costumerealm.com/max-mayfield-outfits-season-2/)
- [Dress Like Max Mayfield from Stranger Things — What Is X Wearing](https://whatisxwearing.com/television/max-mayfield-stranger-things-costume/)
- [Steve Harrington from Stranger Things Costume Guide — Carbon Costume](https://carboncostume.com/steve-harrington-from-stranger-things/)
- [Stranger Things Style Guide: How To Dress Like Steve Harrington — Man of Many](https://manofmany.com/style/stranger-things-style-guide-steve-harrington)
- [Dress like Chief Jim Hopper Costume — Costume Wall](https://costumewall.com/dress-like-chief-jim-hopper/)
- [Chief Jim Hopper Costume and Props Thread — The RPF](https://www.therpf.com/forums/threads/chief-jim-hopper-costume-and-props-thread.283224/)
- [The Demogorgon — Stranger Things Wiki (Fandom)](https://strangerthings.fandom.com/wiki/The_Demogorgon)
- [Stranger Things: Demogorgon Nearly Had Eyes — CBR](https://www.cbr.com/stranger-things-demogorgon-eyes/)
- ['Stranger Things' Concept Artist Talks Demogorgon Egg, Barb — ScreenCrush](https://screencrush.com/stranger-things-concept-art-demogorgon-upside-down-barb/)
- In-repo precedent: `docs/avatars/sci-fi/firefly.md`, `star-trek-tng.md`,
  `star-trek-ds9.md` (diagonal-strap and pattern-scatter rig-gap precedent);
  `docs/avatars/base/domestic-animals.md` (pet-suppression-of-bubbles
  precedent); `docs/DESIGN-avatars.md` § "Rig-gap triage" (confirms
  `posture.pitch`, `eyes:'none'`/`noFace`, and `footMul` are already-landed
  fields, not gaps); `src/three-renderer.ts` (`AVATAR_SPECS`,
  `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`, `_buildHumanoid` accessory switch)
  as the implementation target this doc specs for.
