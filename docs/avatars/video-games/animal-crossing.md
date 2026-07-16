# Avatar pack: Animal Crossing

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
color/silhouette reads as the character archetype, not a likeness. No logos,
no on-model face sculpts, no printed names anywhere in-scene; character
identity lives only in this doc's Reference lines and the pack's display
labels.

## Overview

- **Group**: Anthropomorphic-animal townsfolk of Nintendo's *Animal Crossing*
  series — the raccoon shopkeeper, the dog secretary, the owl curator, three
  archetypal "peppy" villagers (cat/dog/bear), the gruff mole who guards your
  save data, and the itinerant dog musician.
- **Hierarchy path**: `video-games / animal-crossing`
- **Member count**: 8
- **Rig**: humanoid only, for every member. Every character in this cast
  already stands, walks, and gestures upright in its source game (there is no
  quadruped locomotion anywhere in Animal Crossing), so this pack builds
  entirely on the existing bipedal humanoid rig with animal-flavored
  accessories (ears, snouts/beaks, tails) bolted on — the same technique the
  Zelda pack's Goron/Zora and the zoo pack's monkey/gorilla/penguin/kangaroo
  established for non-human bipeds. No new rig FAMILY is needed, only the
  gaps called out below.
- **Pack-wide base spec — chibi proportions** (every member starts here,
  then overrides; this is the "whole pack shares chibi proportions" note
  from the brief):
  ```
  sk: 0.7                  // short, round chibi body
  headR: 155                // oversized head vs. body — the AC "big head" look
  headShape: 'sphere'
  limbR: 1.15                // slightly plush/rounded limbs, not stick-thin
  hands: 'sphere'             // paws
  eyes: 'dots'                // default; overridden per member below
  steel: false
  emI: 0
  armL: 0.85                  // short chibi arms
  legL: 0.75                  // short chibi legs
  footMul: [1.15, 0.85, 1.05] // rounded, slightly flattened paw-feet
  ```
- **Shared palette notes**: this cast is deliberately color-coded per
  character (there is no single "uniform" — Animal Crossing townsfolk each
  have a signature palette) rather than a shared costume. What IS shared:
  warm, saturated pastels for the villager trio, and a recurring
  "shopkeeper brown" family for Tom Nook that the toon saturation push
  should keep readable as brown/tan rather than sliding orange.
- **Pack-wide convention — animal ears via the `head` anchor**: every member
  gets a pair of `head`-anchor ear accessories (round/floppy/pointy per
  species) rather than the rig's default small human ear — same technique
  the Zelda pack uses for pointed Hylian ears and the zoo pack uses for
  every quadruped-derived biped. Kinds with prominent ear accessories should
  be added to the rig's `EAR_SKIP`-style set so the default ear doesn't peek
  out from underneath.
- **Pack-wide convention — tails via the `back` anchor**: Tom Nook (ringed
  raccoon tail) and the peppy dog/cat villagers (short stub tails) all reuse
  the `back` anchor (documented for capes/wings elsewhere) as a static
  cylinder/cone accessory. See Rig gaps — this is the same "no dedicated
  tail-attachment convention on the humanoid rig" gap `docs/avatars/base/
  zoo-animals.md` already flagged for its monkey/kangaroo members; this pack
  inherits it rather than re-deriving it.

## Members

### 1. `tom-nook` — "Shopkeeper (raccoon, brown, blue apron)"

**Reference**: The recurring tanuki (raccoon dog) shop owner who fronts the
player's move-in costs and runs the general store across every game — warm
brown fur with a darker-brown "mask," ear tips, limbs, and long snout, a
round bushy ringed tail, half-lidded sleepy blue eyes, and no visible mouth
(his nose moves when he talks). At the shop counter he wears his signature
short blue apron with a leaf emblem on the front. (Tom Nook.)

**Spec**
```
sk: 0.72
headR: 158
headShape: 'sphere'
limbR: 1.1
skin: 0x9a7a54        // warm tan-brown body fur
body: 0x9a7a54
legColor: 0x5c4030    // darker brown "mask"-family tone carried down the limbs
shoe: 0x3f2c1e         // dark brown paws/feet
eyes: 'almond'          // closest existing style to his half-lidded sleepy look — see Rig gaps
emI: 0
hands: 'sphere'
steel: false
armL: 0.8
legL: 0.7
```

**Accessories**
- **face** (mask patch) — a flattened dark-brown oval band across the eyes,
  ~140×60×10 mm, `0x5c4030`, proud of the fur surface.
- **face** (snout) — a rounded elongated nose bump, ~70×50×90 mm (long,
  per canon), `0x5c4030`, with a small black nose tip (~24×20×24 mm,
  `0x201812`) at the front.
- **head** (×2, ears) — small rounded dark-brown ear domes, ~50×60×30 mm,
  `0x5c4030`, at the head sides.
- **back** (tail) — a round, bushy cylinder-and-sphere tail, ~130 mm
  diameter × 320 mm long, base color `0x9a7a54` with a darker ringed tip
  segment (~110 mm diameter, `0x5c4030`) — see Rig gaps (no dedicated tail
  convention; static `back`-anchor accessory).
- **chest** (apron) — a short flattened box bib + skirt, ~body-width×220×15
  mm, signature blue `0x3f7fbf`, hanging from a thin strap pair at the
  shoulders; centered on the bib, a small leaf emblem (a flattened cone or
  two overlapping ovals, ~40×40×6 mm, `0x5cab48`).

**Silhouette check**: the brown-and-darker-brown mask/snout raccoon head
plus the bright blue apron (his single most iconic piece of clothing,
instantly legible against the brown body) reads as "Tom Nook" even at 30px
— no other member in this pack wears a blue apron over bare fur.

**Rig gaps surfaced**: his canonical half-lidded, sleepy blue eyes don't
have a true match in the existing eye vocabulary; `almond` is the closest
stand-in used above (see Rig gaps for a proposed `sleepy` eye style).

**Personality**: `bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.7, ampMul: 0.8`
(an unhurried, business-like shopkeeper's shuffle)
**Bubbles**: `💰🦝📦🏠` (bells/money, raccoon, shop inventory, home loan)

---

### 2. `isabelle` — "Secretary (dog, yellow, ponytail)"

**Reference**: The mayor's cheerful, endlessly helpful secretary and
assistant — a yellow Shih Tzu with orange floppy ears, a light cream
muzzle, big round dark eyes, and hair tied into a ponytail with a
bell-topped ribbon that jingles as she walks. In *New Horizons* she carries
a small resident-services shoulder bag. (Isabelle.)

**Spec**
```
sk: 0.72
headR: 152
headShape: 'sphere'
limbR: 1.05
skin: 0xf6c945        // butter-yellow fur
body: 0xf6c945
legColor: 0xf6c945
shoe: 0xd9a52e          // slightly deeper yellow paws
eyes: 'dots'             // big round dark eyes
emI: 0
hands: 'sphere'
steel: false
armL: 0.82
legL: 0.75
```

**Accessories**
- **head** (×2, floppy ears) — drooping, flattened teardrop shapes (angled
  spheres/cones hanging down), ~55×110×35 mm, orange `0xe8791e`, at the head
  sides.
- **face** (muzzle) — a small cream oval snout bump, ~60×40×55 mm,
  `0xf5ecd0`, with a tiny black nose tip.
- **crown** (ponytail) — a small tied tuft: a short cylinder "scrunchie"
  band (~40×20×40 mm, `0xe8791e`) with a puffed sphere of fur above it
  (~65 mm diameter, `0xf6c945`), sitting high and back off the crown per
  the standard hat/hair rule (clears the eye band).
- **crown** (ribbon + bell) — a small flattened bow (two joined cones,
  ~50×30×20 mm, `0xc23050`) at the base of the ponytail, with a tiny gold
  bell sphere (~18 mm diameter, `0xd4af37`, faint emissive) hanging just
  below it.
- **chest** (shoulder bag) — a small satchel box, ~70×90×30 mm, `0x6b4a2e`
  (brown leather), on a thin diagonal strap crossing the torso — her
  *New Horizons* resident-services bag.

**Silhouette check**: solid butter-yellow body plus the orange floppy ears
and the topknot-with-bell silhouette is unmistakably Isabelle even before
the bag registers — no other member combines yellow fur with orange ears.

**Personality**: `bobMul: 1.0, swayMul: 0.8, cadenceMul: 1.0, ampMul: 0.9`
(bright, professional, cheerfully brisk — never sluggish, never manic)
**Bubbles**: `🔔🎀📋🐾` (her bell, ribbon, clipboard/duties, paw prints)

---

### 3. `blathers` — "Museum curator (owl, brown, bowtie)"

**Reference**: The scholarly, easily-flustered owl who curates the town
museum's fossil, fish, bug, and art wings — rich dark-brown feathers with
white/black-tipped wings, a light cream face disc, round pink cheeks, a
yellow beak, thick feathered brown eyebrows, and a dark green bowtie; his
belly carries a light brown-and-cream diamond ("argyle") patterned patch.
Famously, and comedically, terrified of bugs. (Blathers.)

**Spec**
```
sk: 0.78              // slightly taller than the villager trio — an adult scholar, not a chibi kid
headR: 168             // big round owl head
headShape: 'sphere'
limbR: 1.0
skin: 0x5c4030        // dark brown feathers, body + limbs
body: 0x5c4030
legColor: 0x5c4030
shoe: 0xf4c430          // yellow talons/feet
eyes: 'dots'             // round, expressive — brows carry most of the emotion
emI: 0
hands: 'sphere'          // wingtip "hands"
steel: false
armL: 0.85
legL: 0.7
```

**Accessories**
- **face** (face disc) — a large flattened cream disc covering most of the
  face, ~170×170×15 mm, `0xf0e6d2`.
- **face** (beak) — a short wide cone, ~60×45×70 mm, bright yellow
  `0xf4c430`, point forward.
- **face** (×2, brows) — thick angled brown tufts above the eyes, ~50×18×18
  mm, `0x4a3220`, giving his fussy/startled expression.
- **face** (×2, cheeks) — small round pink cheek patches, ~40 mm diameter,
  `0xf0a8b0`.
- **crown** (×2, ear tufts) — short feathered tuft spikes, ~30×55×25 mm,
  `0x4a3220`, raised + tilted back off the crown per the standard hat/hair
  clearance rule.
- **chest** (belly patch) — a single flattened cream oval standing in for
  the diamond/argyle pattern, ~140×160×10 mm, `0xf0e6d2` — see Rig gaps;
  the real two-tone diamond weave can't be rendered with flat-color
  primitives, so this is a solid-color approximation.
- **chest** (bowtie) — a small dark green bow (two joined cones + a center
  knot box), ~60×35×20 mm, `0x2f5233`, at the throat.
- **hand** (×2, wingtips) — small white-and-black accent tips at the hands,
  ~40×30×15 mm each, half `0xf5f2ea` / half `0x1c1c1c`, reading as the
  feather-tip contrast on his wings.

**Silhouette check**: the big round brown head with a yellow beak and dark
green bowtie is instantly "Blathers" even before the belly patch or cheeks
register — no other member has a beak.

**Silhouette limitation**: the belly's real diamond/argyle two-tone pattern
is flattened to a single cream patch — see Rig gaps.

**Personality**: `bobMul: 0.7, swayMul: 0.6, cadenceMul: 0.75, ampMul: 0.7`
(a fussy, hesitant, faintly nervous scholarly gait)
**Bubbles**: `🦉📜😨` (owl, ancient scroll/fossil lore, his signature fright
— often at the mere mention of bugs)

---

### 4. `peppy-villager-dog` — "Peppy villager (dog, pink)"

**Reference**: A generic peppy-personality dog villager in the archetypal
"peppy" mold — bubbly, energetic, endlessly chatty. Modeled on the palette
of villagers like Cookie: saturated bubblegum-pink fur, floppy cream-lined
ears, big sparkly dark eyes, and a cheerful, bouncy demeanor. Represents the
peppy-dog slot generically rather than one single named villager. (Peppy
personality archetype; cf. Cookie.)

**Spec**
```
sk: 0.68
headR: 150
headShape: 'sphere'
limbR: 1.1
skin: 0xf5a9c9        // saturated bubblegum pink
body: 0xf5a9c9
legColor: 0xf5a9c9
shoe: 0xe07fae
eyes: 'dots'             // big, bright — a small white glint accessory adds the "sparkly" read, see accessories
emI: 0.05
hands: 'sphere'
steel: false
armL: 0.85
legL: 0.75
```

**Accessories**
- **head** (×2, floppy ears) — drooping teardrop shapes, ~50×100×30 mm,
  pink `0xf5a9c9` outside with a small cream inner patch (~30×50×10 mm,
  `0xf5ecd0`).
- **face** (muzzle) — small cream snout bump, ~55×35×50 mm, `0xf5ecd0`.
- **face** (×2, eye glints) — tiny white highlight spheres, ~8 mm diameter,
  slightly emissive, overlapping the upper-outer edge of each eye — a cheap
  way to fake the "big sparkly eyes" personality trait without a dedicated
  eye style.
- **crown** (bow) — a small bright bow, ~55×30×20 mm, `0xc23050`, off to
  one side of the head.
- **back** (short tail) — a small stub cone, ~50×40×50 mm, pink
  `0xf5a9c9`, wagging-ready per the standard tail workaround (see Rig gaps).

**Silhouette check**: solid saturated pink with floppy cream-lined ears is
an instant "peppy pink pup" read at 30px — pink is used nowhere else as a
base body color in this pack, so it can't be confused with any other member.

**Personality**: `bobMul: 1.3, swayMul: 1.1, cadenceMul: 1.2, ampMul: 1.0`
(bouncy, excitable, quick little bounding steps)
**Bubbles**: `🐶💬🎀😆` (dog, chatty gossip, bow/cute accessory, giggly)

---

### 5. `peppy-villager-cat` — "Peppy villager (cat, cream)"

**Reference**: A generic peppy-personality cat villager, modeled on the
palette of villagers like Felicity: creamy white fur, a reddish-brown hair
tuft, pink cheeks, a small red nose, and pink-lined pointed ears. Represents
the peppy-cat slot generically. (Peppy personality archetype; cf. Felicity.)

**Spec**
```
sk: 0.68
headR: 148
headShape: 'sphere'
limbR: 1.05
skin: 0xf5f0e6        // creamy white
body: 0xf5f0e6
legColor: 0xf5f0e6
shoe: 0xe0d8c4
eyes: 'dots'
emI: 0
hands: 'sphere'
steel: false
armL: 0.85
legL: 0.75
```

**Accessories**
- **head** (×2, pointed ears) — small cones, ~45×70×45 mm, cream
  `0xf5f0e6` with a nested smaller pink inner cone (~25×45×25 mm,
  `0xf2b8c4`).
- **crown** (hair tuft) — a small reddish-brown fringe, 2–3 short tapered
  boxes, ~50×40×20 mm, `0x8b4a2b`, at the front-top of the head.
- **face** (×2, cheeks) — small pink circles, ~35 mm diameter, `0xf2b8c4`.
- **face** (nose) — a tiny red dot, ~14 mm diameter, `0xc23050`.
- **crown** (bandana) — a small orange neck bandana knot, ~60×25×20 mm,
  `0xe8791e` (her preferred orange/yellow palette), at the throat instead
  of the crown if a neck anchor is unavailable.
- **back** (short tail) — a slim tapering cone, ~40×35×140 mm, cream
  `0xf5f0e6` with a small pink tip, curling slightly.

**Silhouette check**: the cream body with a reddish-brown hair fringe on
top and pink-lined pointed ears is a clean "peppy cat" read distinct from
the pink dog and white bear — the only cream-colored, pointed-eared member
in the pack.

**Personality**: `bobMul: 1.2, swayMul: 1.0, cadenceMul: 1.15, ampMul: 0.95`
(light, prancy, a touch vain — quick dainty steps)
**Bubbles**: `🐱💕✨` (cat, affection/friendliness, self-admiring sparkle)

---

### 6. `peppy-villager-bear` — "Peppy villager (bear, white)"

**Reference**: A generic peppy-personality bear villager, modeled on the
palette of villagers like Tutu: bright white (polar-bear-style) fur, blue
inner ears, soft pink blush under the eyes, and a blonde forehead fur tuft.
Represents the peppy-bear slot generically. (Peppy personality archetype;
cf. Tutu.)

**Spec**
```
sk: 0.75              // the biggest/roundest of the three villagers — a plush bear-cub build
headR: 162
headShape: 'sphere'
limbR: 1.25             // extra-plush, roundest limbs in the trio
skin: 0xf7f7f4        // bright white
body: 0xf7f7f4
legColor: 0xf7f7f4
shoe: 0xe8e8e2
eyes: 'dots'
emI: 0
hands: 'sphere'
steel: false
armL: 0.85
legL: 0.72
```

**Accessories**
- **head** (×2, round ears) — round domes, ~65×65×35 mm, white `0xf7f7f4`
  outside with a nested smaller blue inner dome (~35 mm diameter,
  `0x6ab0d6`).
- **crown** (forehead tuft) — a small blonde fringe, 2 small tapered boxes,
  ~55×35×20 mm, `0xe8c766`, front-top of the head.
- **face** (×2, blush) — soft pink blush patches under the eyes, ~45×22×8
  mm, `0xf2c0c8`.
- **face** (nose) — a small black triangular bump, ~26×20×22 mm, `0x1c1c1c`.

**Silhouette check**: an all-white, extra-round plush body with small blue
ear-dots and a blonde forehead tuft is the pack's one "snowball" silhouette
— easily the roundest, palest member, distinct from every other villager's
color.

**Personality**: `bobMul: 1.15, swayMul: 1.2, cadenceMul: 1.0, ampMul: 0.85`
(a soft, bouncy, plush-toy waddle)
**Bubbles**: `🐻🍧❄️` (bear, her shaved-ice/dessert design theme, a wintry
polar-bear nod)

---

### 7. `resetti` — "Mole warner (brown, blue overalls, hard hat)"

**Reference**: The gruff underground mole who — in older games — would burst
from the dirt to scold the player for quitting without saving, and today
mostly answers the in-game help hotline. Brown fur, black whiskers and
down-turned brows, tiny squinting eyes, a white shirt under blue denim
overalls, black boots, and a plain yellow hard hat. (Mr. Resetti.)

**Spec**
```
sk: 0.65              // the shortest, stockiest member — a mole built for digging, not standing tall
headR: 145
headShape: 'sphere'
limbR: 1.2
skin: 0x6b4a35        // brown mole fur
body: 0x2255aa        // blue denim overalls cover most of the torso
legColor: 0x2255aa    // overalls continue down the legs
shoe: 0x1c1c1c          // black boots
eyes: 'slit'             // small, squinting mole eyes — a strong existing-style match, no gap
emI: 0
hands: 'sphere'
steel: false
armL: 0.8
legL: 0.65
```

**Accessories**
- **face** (snout) — a small pointed mole snout, ~50×35×55 mm, dark brown
  `0x4a3220`, with a tiny black nose tip.
- **face** (×2, whisker clusters) — a few short thin black cylinders,
  ~4×30×4 mm each (3 per side), radiating from the snout sides, `0x151515`.
- **face** (×2, brows) — thick, down-turned angry brows, ~45×16×16 mm,
  `0x201812`, giving his signature scowl.
- **chest** (overalls bib + straps) — a flattened bib box, ~body-width×140×
  10 mm, `0x2255aa`, with two thin straps over the shoulders (~20×160×8 mm
  each); a small white undershirt strip (~body-width×40×6 mm, `0xf5f2ea`)
  peeks above the bib at the collar.
- **crown** (hard hat) — a smooth dome, ~140×90×140 mm, yellow `0xf6c945`,
  raised + tilted back per the standard hat rule so the front brim clears
  the brow band.
- **head** (×2, small round ears) — tiny brown domes, ~30×30×15 mm,
  `0x6b4a35`, mostly hidden under the hard hat.

**Silhouette check**: the yellow hard hat sitting on a squat brown mole body
in blue overalls is instantly "Resetti" and shares its silhouette with no
other member — the hard hat + overalls combination is unique in the pack.

**Personality**: `bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.65, ampMul: 1.1`
(a gruff, heavy, stomping little gait — short legs, big attitude)
**Bubbles**: `⛏️😠💾` (digging/mole work, his signature scolding anger, the
save-data warning that made him famous)

---

### 8. `kk-slider` — "Traveling musician (dog, white, guitar)"

**Reference**: The laid-back canine musician who tours Animal Crossing towns
performing original songs, most famously live every Saturday night — a
white-furred dog (styled after a Jack Russell Terrier) with thick black
eyebrows, black dot eyes, a black nose, floppy black-tipped ears, and no
default clothing; always seen with his acoustic guitar. (K.K. Slider.)

**Spec**
```
sk: 0.78              // taller/leaner than the villager trio — an adult performer, not a chibi kid
headR: 140
headShape: 'sphere'
limbR: 0.95
skin: 0xf2f2ee        // white fur
body: 0xf2f2ee
legColor: 0xf2f2ee
shoe: 0xe8e8e2
eyes: 'dots'             // black dot eyes
emI: 0
hands: 'sphere'
steel: false
armL: 0.88
legL: 0.8
```

**Accessories**
- **head** (×2, floppy ears) — drooping teardrop shapes, ~50×100×30 mm,
  mostly white `0xf2f2ee` with the outer half tipped black (~40×50×30 mm,
  `0x1c1c1c`) — his signature black ear tips.
- **face** (×2, brows) — thick black tufts above the eyes, ~50×18×18 mm,
  `0x1c1c1c`, his most recognizable facial feature.
- **face** (nose) — a small black nose bump, ~26×20×24 mm, `0x1c1c1c`.
- **hand** (guitar) — his acoustic guitar prop: a flattened tan body box
  (~140×200×40 mm, `0x8b5a2b`) with a darker sound-hole disc (~50 mm,
  `0x3a2418`) and a thin cylinder neck (~20×260×20 mm, `0x5c3a21`),
  slung across the front torso and held at the `hand` anchor — the rig's
  documented prop use for the `hand` anchor covers this directly, no gap.

**Silhouette check**: a plain white dog is deliberately unadorned — per
canon he wears no default clothing — so the guitar prop slung across the
body IS the entire silhouette read; without it, this member is generically
"white dog." No other member in this pack carries an instrument.

**Personality**: `bobMul: 0.7, swayMul: 0.9, cadenceMul: 0.7, ampMul: 0.8`
(a loose, relaxed, unhurried saunter — a musician's easy cool)
**Bubbles**: `🎸🎵🌙` (his guitar, music/song, his famously chill nighttime
performances)

## Rig gaps

- **No "sleepy"/half-lidded eye style.** Tom Nook's canonical half-lidded,
  drooping eyes have no true match in the existing `dots`/`visor`/`almond`/
  `redvisor`/`shades`/`slit`/`halfred` vocabulary — `almond` is the closest
  stand-in used above, but a dedicated `sleepy` style (heavy upper AND lower
  lid coverage, a narrow visible sliver) would generalize to any laid-back/
  drowsy character in a future pack.
- **No two-tone pattern/diamond-weave accessory.** Blathers' canonical
  belly patch is a light-brown-and-cream diamond (argyle) weave; the rig's
  color+shape-only, no-texture design means this can only be approximated
  as a single flat-colored patch (done above). Same underlying limitation
  `docs/avatars/base/zoo-animals.md` flags for its tiger stripes/zebra
  stripes/giraffe reticulation/panda patches — a scatter-pattern authoring
  path (parametrized stripes/checks rather than one primitive per patch)
  would help here too, though Blathers only needs ONE patch, not a dozen.
- **No tail-attachment convention on the humanoid rig** (inherited from
  `docs/avatars/base/zoo-animals.md`'s Rig gap #9, re-surfaced here for
  `tom-nook`'s ringed raccoon tail and the `peppy-villager-dog`/
  `peppy-villager-cat` stub tails). Buildable today only as a plain static
  `back`-anchor cylinder/cone, with no idle-sway or wag animation — a real
  raccoon tail's ring pattern and a wagging dog stub would both benefit from
  a dedicated, animatable tail primitive shared across humanoid AND
  quadruped rigs.
- **"Sparkly eyes" personality trait has no dedicated shimmer/highlight
  treatment.** Approximated above (peppy-villager-dog) with a tiny emissive
  white highlight sphere overlapping the eye — a cheap, working technique,
  noted here in case a future pack wants a first-class "glint" accessory
  instead of a bespoke per-character workaround.

## Sources

- [Tom Nook — Nookipedia](https://nookipedia.com/wiki/Tom_Nook)
- [Tom Nook — Animal Crossing Wiki (Fandom)](https://animalcrossing.fandom.com/wiki/Tom_Nook)
- [Tom Nook with Apron — DeviantArt reference](https://www.deviantart.com/supermariocarlos/art/Tom-Nook-with-Apron-899599493)
- [Isabelle — Nookipedia](https://nookipedia.com/wiki/Isabelle)
- [Isabelle — Animal Crossing Wiki (Fandom)](https://animalcrossing.fandom.com/wiki/Isabelle)
- [Blathers — Nookipedia](https://nookipedia.com/wiki/Blathers)
- [Blathers — Animal Crossing Wiki (Fandom)](https://animalcrossing.fandom.com/wiki/Blathers)
- [Peppy — Nookipedia](https://nookipedia.com/wiki/Peppy)
- [Category:Peppy villagers — Nookipedia](https://nookipedia.com/wiki/Category:Peppy_villagers)
- [Cookie — Animal Crossing peppy villagers roundup — TheGamer](https://www.thegamer.com/animal-crossing-best-peppy-villagers/)
- [Felicity — Nookipedia](https://nookipedia.com/wiki/Felicity)
- [Tutu — Nookipedia](https://nookipedia.com/wiki/Tutu)
- [Mr. Resetti — Nookipedia](https://nookipedia.com/wiki/Mr._Resetti)
- [K.K. Slider — Nookipedia](https://nookipedia.com/wiki/K.K._Slider)
- [K.K. Slider — Animal Crossing Wiki (Fandom)](https://animalcrossing.fandom.com/wiki/K.K._Slider)
- `docs/avatars/video-games/zelda.md` (this repo) — the biped-on-humanoid
  convention for non-human races, and the pointed-ear `head`-anchor
  technique this pack reuses.
- `docs/avatars/base/zoo-animals.md` (this repo) — the tail-attachment and
  multi-instance-pattern rig gaps this pack inherits rather than re-derives.
