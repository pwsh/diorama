# Avatar pack: Farm animals (base)

## Overview

- **Hierarchy path**: `docs/avatars/base/farm-animals.md` — a **base** pack
  (generic barnyard archetypes, not licensed characters), sibling to
  `docs/avatars/base/{humans,aliens,robotic}.md`. This is a **regroup pack**:
  no farm-animal kind ships today (the group starts from zero), but it is the
  pack that finally generalizes the **quadruped** rig — which currently
  supports exactly two hardcoded kinds, `cat` and `dog`, via a single
  `isCat ? … : …` ternary inside `_buildQuadruped` — into a real per-kind
  spec table, the same way `SPECS` already does for the humanoid rig. Every
  member below is written against that PROPOSED generalized schema; see
  **Rig gaps** for exactly what's missing today vs. what already exists.
- **Two rig families in this pack**: six members (cow, pig, horse, sheep,
  goat, donkey) are **quadrupeds**; two (chicken, rooster) are **bipeds**
  built on the existing humanoid rig, the same way `cartoon_duck` already is
  (short legs, stubby wing-arms via `armL`, a beak instead of hands/face) —
  chicken/rooster need no new rig family, only new kind entries + a couple of
  small bird-specific accessories (comb, wattle, tail plumes), mirroring how
  `cartoon_duck`'s bill is one bespoke branch in `_buildHumanoid`'s per-kind
  switch. `duck` itself is **not a new member** — the existing `cartoon_duck`
  kind (white body, yellow-orange bill/legs, `armL: 0.6`, `footMul: [1.6,
  0.7, 1.35]`) already reads as a plain white farm duck; it's listed below
  purely to anchor the relationship, no changes proposed.
- **Fixed (non-tint) coloring, on purpose**: unlike `cat`/`dog` — generic
  pet placeholders whose coat *is* the sensor/person identity tint — every
  farm-animal member uses **fixed, breed-accurate hex colors** for coat/
  belly/ear/snout, the same convention `cartoon_duck`/`cartoon_dog` already
  use inside the humanoid rig (a specific-looking character overrides tint).
  A Holstein's black-and-white patches or a rooster's iridescent black-green
  body would look wrong recoloring itself to match a random sensor's palette.
  This is itself part of the quadruped rig gap: today `_buildQuadruped`
  takes exactly one `color: number` argument and paints the ENTIRE coat with
  it (ears/snout use separate but hardcoded-in-source hex, not per-kind
  data) — there's no fixed-multi-zone-color path a data table could drive.
- **Proposed generalized quadruped spec** (schema every quadruped member
  below is written against — see Rig gaps for what's real vs. proposed):
  ```
  rig:        quadruped
  sk:         <uniform scale; dog = 1.0 ≡ ~520 mm shoulder height (existing
               baseline, see _buildQuadruped's LEG_UPPER_LEN+LEG_LOWER_LEN
               +PAW_H at sk=1). cat = 0.58 (existing).>
  bodyLen:    <mult vs dog baseline 640 mm>
  bodyW:      <mult vs dog baseline 200 mm>
  bodyH:      <mult vs dog baseline 240 mm>
  legLen:     <mult vs dog baseline 455 mm (LEG_UPPER_LEN+LEG_LOWER_LEN)>
  neckLen:    <NEW field, mm — a neck segment between torso and head pivot;
               dog/cat = 0 (head sits directly off the torso today)>
  headR:      <mm, absolute — mirrors humanoid headR convention>
  earKind:    'pointy' | 'floppy' | 'round' | 'long'   (dog/cat only ship
               'floppy'/'pointy' today)
  tailKind:   'switch' | 'curly' | 'long-flowing' | 'tufted-tip' | 'short-dock'
  snoutSize:  <mult vs dog baseline HEAD_R*0.62>
  snoutShape: 'box' | 'disc' | 'wedge'
  coat:       hex (fixed — NOT sensor tint)
  belly:      hex (optional lighter underside patch)
  ear:        hex
  snout:      hex
  ```
  Accessory anchors follow the same vocabulary the humanoid docs use —
  `crown` (top of head — horns, comb), `head` (side — mane start, wattle),
  `back` (dorsal — mane ridge, patches, tail plumes), `face` (front — beard,
  patches), `hip`/`flank` (side patches) — bolted primitives in local mm,
  exactly like the humanoid accessory convention in `humans.md`/`aliens.md`.
- **Palette discipline**: six distinct coat families so the barnyard doesn't
  collapse into "brown quadrupeds" — Holstein black-and-white (cow), warm
  pink (pig), bay reddish-brown + black points (horse), cream wool + black
  face/legs (sheep), tan/fawn (goat), gray-dun + dark dorsal cross (donkey);
  the two birds get rust-brown (hen) and black-green-with-orange-hackles
  (rooster) so they don't read as recolors of each other either.
- **Real-world scale anchor**: every quadruped's `sk` is derived from its
  real shoulder height against the dog baseline (**dog ≈ 520 mm shoulder ≡
  sk 1.0**, the existing in-code reference), then rounded/adjusted slightly
  for toon readability (a literal cow at `sk 2.9` dwarfs every other pack in
  the house scene; dialed back a touch, same way the humanoid docs treat
  real head/body ratios as a *curve to follow*, not a spec to hit exactly).

## Members

### `cow` — Cow (Holstein dairy, black-and-white patches)

**Reference**: the Holstein-Friesian — by far the most recognizable dairy
cattle breed — has sharply-defined black-and-white (or red-and-white)
piebald patches, unique per animal like a fingerprint, on an otherwise
white coat. Mature shoulder height 145–165 cm (~150 cm typical).

**Spec**
```
rig:        quadruped
sk:         2.5            # 150 cm / 52 cm dog baseline ≈ 2.9, dialed to 2.5
bodyLen:    1.35            # long barrel torso
bodyW:      1.3
bodyH:      1.05
legLen:     0.85            # visually short legs under a big barrel (real cattle read squat-legged relative to body size)
neckLen:    0.3             # short thick neck, mostly head-to-shoulder
headR:      150
earKind:    round
tailKind:   switch          # thin tail ending in a dark tuft, swats side to side
snoutSize:  1.1
snoutShape: wedge           # flat wide muzzle, not a rounded dog snout
coat:       0xf3efe6        # white base
belly:      0xf3efe6
ear:        0xf3efe6
snout:      0x2b2320        # dark grey-black wet muzzle
```

**Accessories**
- `crown` (top of head): horn pair — short forward-curving cones, ⌀40 mm ×
  180 mm, color `0xe8ddc8` (pale horn), angled outward + slightly forward
  ~0.3 rad.
- `back`/`flank`/`face` (3–5 instances): Holstein patches — flattened,
  irregularly-sized black boxes (`0x141414`) sitting **proud of the coat
  surface by ~4 mm** (the documented coincident-face gotcha — flush boxes on
  a toon-shaded body would hatch/z-fight), scattered asymmetrically across
  shoulder/flank/rump/one ear-tip so no two cows in a scene need to look
  identical (positions can vary per instance if the generator wants
  per-spawn variety; a fixed reference layout is fine too).
- `flank`/underside (rear, near `belly`): small pink udder hint — a squashed
  sphere, ⌀110 mm, color `0xe8a8ad`, tucked between the rear legs.

**Silhouette check**: the black-on-white patch pattern is the single most
recognizable "cow" cue at any size, even before the horns register — this
member reads at 30 px purely off the patch accessories against the white
base coat.

**Personality**: `{ bobMul: 0.7, swayMul: 0.8, cadenceMul: 0.6, ampMul: 0.85 }`
— slow, heavy, lumbering plod.
**Bubbles**: `['🌾', '🐄', '🥛', '💤']`

---

### `pig` — Pig (pink farm hog)

**Reference**: a generic pink domestic farm pig (Yorkshire/Large-White
type — the "classic" cartoon pig coloring) — pale pink hairless-looking
skin, a flat disc-shaped snout, a tightly curled tail, short stubby legs
under a rotund barrel body. Farm hog shoulder height commonly ~55–100 cm;
~80 cm is a reasonable mid-size adult.

**Spec**
```
rig:        quadruped
sk:         1.5             # 80 cm / 52 cm dog baseline ≈ 1.5
bodyLen:    1.15
bodyW:      1.4              # rotund barrel, wider than long relative to other members
bodyH:      1.15
legLen:     0.65             # short stubby legs
neckLen:    0.05             # almost no visible neck
headR:      130
earKind:    round             # small forward-flopping triangular ears
tailKind:   curly
snoutSize:  0.9
snoutShape: disc              # flat round snout disc, not a box muzzle
coat:       0xf0b8bc          # pale pink
belly:      0xf5cdd0
ear:        0xecabb0
snout:      0xe89aa0          # slightly deeper pink disc
```

**Accessories**
- `face` (snout front, additive): two small dark nostril dots, ⌀12 mm,
  `0x3a2a2a`, punched into the snout disc face.
- `back` (rump, replacing the standard tail geometry): a TIGHT SPIRAL —
  the existing quadruped tail is two straight cylinder segments bent at
  fixed angles, which cannot make a true curl; a pig's tail needs a small
  helical/torus-coil shape (2–3 tiny torus loops decreasing in radius) —
  flagged in Rig gaps as a genuinely new tail geometry, not just a new
  `tailKind` enum value pointing at existing segments.

**Silhouette check**: pink barrel body + flat disc snout is the primary
read; the curly tail is the classic secondary cue but (per the Rig gaps
note) is too small to register at 30 px regardless of shape — the pink
rotundity + disc snout carry the recognizability, the tail is flavor for
closer views.

**Personality**: `{ bobMul: 1.1, swayMul: 1.2, cadenceMul: 1.0, ampMul: 0.9 }`
— a bouncy, snuffling little trot.
**Bubbles**: `['🌽', '🥔', '🍂', '😋']`

---

### `horse` — Horse (bay, tall & leggy)

**Reference**: a generic bay horse — reddish-brown body with black "points"
(mane, tail, lower legs) — the single most common/iconic horse coloring, ~15
hh (about 152 cm / 60 in at the withers). Long neck, flowing mane and tail.

**Spec**
```
rig:        quadruped
sk:         2.2             # dialed down from the literal 152/52≈2.9 ratio; legLen carries the "tall" read instead of raw sk so it doesn't just become a bigger cow
bodyLen:    1.25
bodyW:      0.85             # leaner torso than cow/pig
bodyH:      0.95
legLen:     1.4              # THE tall/leggy read — long, slender legs
neckLen:    1.5              # long neck (needs the neckLen rig gap)
headR:      118              # elongated head reads more via snoutSize than headR
earKind:    pointy            # short upright pointed ears
tailKind:   long-flowing
snoutSize:  1.3               # long muzzle
snoutShape: wedge
coat:       0x8a5a34          # bay reddish-brown
belly:      0x8a5a34
ear:        0x8a5a34
snout:      0x2a1c14          # dark muzzle
legColor:   0x241812          # black "points" — lower legs/socks (existing legColor field already used by duck's yellow legs on the humanoid rig; quadruped needs the equivalent)
```

**Accessories**
- `back`/`head` (running along the neckLen, new `neck` anchor): mane — a
  row of 6–8 thin flattened boxes, ~20 × 140 × 8 mm each, color `0x1c130e`
  (near-black), draped down the neck's dorsal edge.
- `back` (tail base, layered over the standard `long-flowing` tailKind):
  a few extra trailing strand boxes for volume, same near-black `0x1c130e`.

**Silhouette check**: long neck + long legs + flowing mane/tail is the
"horse" read well before the bay coloring registers — this is the member
that most needs the `neckLen` rig gap resolved, since without a distinct
neck segment the head just sits close to an oversized torso and the
"elegant tall animal" silhouette collapses toward the cow's proportions.

**Personality**: `{ bobMul: 0.9, swayMul: 0.7, cadenceMul: 0.85, ampMul: 1.3 }`
— long, ground-covering stride (high `ampMul`), minimal wasted bob/sway.
**Bubbles**: `['🌾', '🐴', '🍎', '💨']`

---

### `sheep` — Sheep (fluffy wool, black face & legs)

**Reference**: a black-faced wool breed look (Suffolk/Hampshire-style — the
most instantly-recognizable "cartoon sheep" silhouette): thick cream-white
fluffy wool body with a black face and black legs showing below the wool
line. Shoulder height commonly 80–120 cm; ~90 cm is a typical adult.

**Spec**
```
rig:        quadruped
sk:         1.6             # 90 cm / 52 cm dog baseline ≈ 1.73, dialed to 1.6
bodyLen:    1.0
bodyW:      1.35             # wide wool poof
bodyH:      1.55             # THE big cue — an oversized rounded wool body
legLen:     0.55             # short thin legs, mostly hidden under the wool
neckLen:    0.1
headR:      95               # small head relative to the wool body
earKind:    round
tailKind:   short-dock
snoutSize:  0.75
snoutShape: wedge
coat:       0xf2ece0          # cream wool
belly:      0xf2ece0
ear:        0x1c1c1c          # black face bleeds onto the outer ear
snout:      0x1c1c1c          # black face
legColor:   0x1c1c1c          # black legs, thin — contrast against the wool
```

**Accessories**
- `back` (2–4 instances, optional texture): "wool tuft" — small overlapping
  spheres bumped slightly proud of the main torso surface along the spine
  and flanks, same coat color, to break up the box/sphere primitive
  silhouette into something poofier at closer range. Purely a bonus; the
  oversized `bodyH` alone carries the read at distance.

**Silhouette check**: oversized round cream wool body + black face/legs
poking out is fully readable at 30 px with zero accessories — the one
"must-have" member of this pack where the base spec alone (no bolt-ons) does
all the work.

**Personality**: `{ bobMul: 1.15, swayMul: 1.0, cadenceMul: 1.1, ampMul: 0.7 }`
— small quick huddling steps, short stride.
**Bubbles**: `['🌿', '☁️', '😴', '🐑']`

---

### `goat` — Goat (tan, horns & beard)

**Reference**: a generic tan/fawn dairy-goat look (Alpine/Toggenburg family
coloring) with backward-arching horns and a chin beard (both sexes can grow
one, though bucks' are more pronounced) — the two features that read "goat"
rather than "sheep" at a glance. Dairy goat shoulder height ~50–100 cm;
~76 cm (Alpine average) is a good reference.

**Spec**
```
rig:        quadruped
sk:         1.45            # 76 cm / 52 cm dog baseline ≈ 1.46
bodyLen:    1.05
bodyW:      0.9
bodyH:      0.9
legLen:     1.1              # slightly leggier than sheep — goats read more upright/agile
neckLen:    0.5
headR:      105
earKind:    round             # short upright/side-set ears (distinct from a horse's small pointed ears and a donkey's long ones)
tailKind:   short-dock
snoutSize:  0.85
snoutShape: wedge
coat:       0xc2a06a          # tan/fawn
belly:      0xe8d9bd          # lighter cream belly
ear:        0xc2a06a
snout:      0x2b2320
```

**Accessories**
- `crown` (top of head): horn pair — thin curved cylinders/cone chains
  arching backward (~0.9 rad sweep), ⌀18 mm tapering, ~160 mm developed
  length, color `0x2b2320` (dark horn).
- `face` (chin, front): beard — a small downward tuft, a flattened cone
  ~70 mm, color `0x4a3c28` (a shade darker than coat), hanging just below
  the snout.

**Silhouette check**: backward-swept horns + chin beard together are what
separate `goat` from `sheep` in this pack at a glance (their base body
proportions are close) — both are load-bearing; losing either risks reading
as a small tan sheep.

**Personality**: `{ bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.15, ampMul: 0.95 }`
— quick, curious, slightly headbutt-y energy.
**Bubbles**: `['🌿', '🥫', '❓', '😋']`

---

### `donkey` — Donkey (gray-dun, long ears, dorsal cross)

**Reference**: the classic gray-dun donkey coloring — grayish-brown coat
with a dark dorsal stripe running poll-to-tail crossed by a dark shoulder
stripe (folk-named "the cross"), a short upright dark mane (unlike a
horse's long flowing one), and famously long ears — the single biggest
visual differentiator from a horse. Standard donkey withers height
commonly ~100–120 cm.

**Spec**
```
rig:        quadruped
sk:         2.0             # ~110 cm / 52 cm dog baseline ≈ 2.1
bodyLen:    1.1
bodyW:      0.8
bodyH:      0.9
legLen:     1.15
neckLen:    0.8
headR:      120
earKind:    long              # THE signature cue — much longer/more upright than horse's `pointy`
tailKind:   tufted-tip         # slim tail, dark tuft only at the very tip
snoutSize:  1.15
snoutShape: wedge
coat:       0xa39784          # gray-dun
belly:      0xd8cdb8          # pale cream muzzle-ring/belly (donkeys often show a light muzzle + belly against the dun body — worth keeping if the palette needs a second tone)
ear:        0xa39784          # dark tips, see accessories
snout:      0x362e24
```

**Accessories**
- `back` (dorsal stripe, running the neckLen + bodyLen length): a single
  thin dark box, `0x2a2118`, laid flush along the spine from poll to tail
  base (proud a few mm per the coincident-face rule).
- `back` (shoulder cross, one instance): a short dark box crossing the
  dorsal stripe transversely at the withers, same color — together these
  two boxes form "the cross" marking.
- `head` (neck, upright short mane): 4–5 short stiff dark boxes standing
  UPRIGHT off the neckLen dorsal edge (not draping down like the horse's) —
  a "roached" mane silhouette.
- `head` (ear tips, 2 instances): darker tip caps, `0x2a2118`, on each long
  ear.

**Silhouette check**: the elongated `long` ears are unmistakable and
sufficient on their own at 30 px (nothing else in this pack, or the horse,
has ears anywhere near that proportion) — the dorsal cross reinforces at
closer range but isn't needed for the base read.

**Personality**: `{ bobMul: 0.75, swayMul: 0.85, cadenceMul: 0.65, ampMul: 0.8 }`
— slow, deliberate, occasionally-balky plod (a notch slower/more stubborn
than the cow).
**Bubbles**: `['🌾', '🚫', '😤', '💤']`

---

### `chicken` — Chicken (hen, rust-brown, red comb & wattle)

**Reference**: a generic barnyard hen (Rhode-Island-Red-style rust-brown
coloring, chosen to keep clear of the existing all-white `cartoon_duck`) —
red fleshy comb on top of the head, a red wattle hanging under the beak,
short yellow legs, a short pointed yellow-orange beak (not a duck's flat
bill). **Biped**, built on the existing humanoid rig exactly like
`cartoon_duck` — no quadruped machinery involved.

**Spec**
```
sk:        0.55
headR:     95
headShape: sphere
limbR:     0.75
skin:      0xa9552e          # rust-brown feather body
body:      0xa9552e
shoe:      0xe0a020          # yellow legs
emI:       0.15
hands:     sphere             # wing stubs — reuse the duck's stubby-arm treatment
eyes:      dots
steel:     false
armL:      0.55               # short wing stubs (a touch shorter than the duck's 0.6)
footMul:   [1.3, 0.6, 1.15]   # scaled-down bird foot, smaller than the duck's webbed flipper
legColor:  0xe0a020
```

**Accessories** (new bird-only branch, same technique as the duck's bill —
a bespoke kind-block, not the generic bolt-on list)
- `face` (front, beak — replaces hands/mouth): short triangular cone,
  ⌀40 mm × 55 mm, color `0xe0a020` (matches legs), point forward (−Z).
- `crown` (top of head): comb — a row of 3–4 small red serrated bumps
  (flattened cones or half-spheres), `0xc23030`, emissive same color ~0.2,
  running front-to-back along the head crest.
- `face` (chin, below beak): wattle — one or two small red teardrop
  shapes (stretched spheres), `0xc23030`, hanging just under the beak.

**Silhouette check**: at 30 px the red comb+wattle likely does NOT read
distinctly from noise (they're each only a few mm at that scale) — the
PRIMARY read is the short rounded rust-brown body + upright bird stance +
short yellow legs (silhouette alone says "small bird," comb/wattle confirm
"chicken" only on closer inspection). Flagged as a soft gap below, same
category as `teen`'s hoodie in the humans pack.

**Personality**: `{ bobMul: 1.4, swayMul: 1.3, cadenceMul: 1.3, ampMul: 0.6 }`
— fast jittery peck-walk, exaggerated head-bob, short stride.
**Bubbles**: `['🌾', '🥚', '❓', '😮']`

---

### `rooster` — Rooster (iridescent black-green, orange hackles, tail plumes)

**Reference**: the classic barnyard rooster — dark, glossy black-green
body plumage, warm orange-red neck "hackle" feathers, a larger, more
upright red comb + wattle than the hen, and the unmistakable tail: long,
curved, sickle-shaped black-green plumes sweeping up and back. Shares the
`chicken` biped rig/scale family; a distinct spec + its own accessories,
not a recolor swap of the hen.

**Spec**
```
sk:        0.62              # slightly larger than the hen — males run bigger
headR:     98
headShape: sphere
limbR:     0.8
skin:      0x1c2420          # near-black body with a cool green sheen (toon emissive sells the "iridescent" read)
body:      0x1c2420
shoe:      0xd4941a           # yellow-orange legs, slightly deeper than the hen's
emI:       0.28               # higher emissive than the hen — the "glossy iridescent" cue
hands:     sphere
eyes:      dots
steel:     false
armL:      0.55
footMul:   [1.35, 0.6, 1.2]   # slightly larger feet/spurs than the hen
legColor:  0xd4941a
```

**Accessories**
- `face` (beak): same technique as `chicken`, `0xd4941a`.
- `crown` (comb, larger than the hen's): 4–5 taller red bumps, `0xd83a3a`,
  emissive ~0.25.
- `face` (wattle, larger): two pronounced red teardrops, `0xd83a3a`.
- `back`/`head` (neck hackles): a short ruff of thin orange-red feather
  boxes, `0xc9701c`, flared around the base of the neck/head — the
  "mane"-equivalent for this bird.
- `back` (tail plumes, THE signature accessory): 3–4 long curved thin
  cones or bent-cylinder strips, ~180–260 mm, near-black `0x141a17` with a
  faint green emissive tint, swept up and back from the rear in a fan —
  needs a shape closer to the horse's curved mane boxes than the hen's
  short-dock stub; this is the one piece of genuine new geometry this
  member needs (a "plume" primitive: a thin tapered curved strip, not
  covered by any existing box/cylinder/cone/sphere accessory shape used
  elsewhere in the rig without faceting oddly at this thinness/length).

**Silhouette check**: the swept sickle tail plumes are the single most
recognizable "rooster, not hen" cue at any distance — they alone
distinguish it from `chicken` even in silhouette. The orange hackle ruff is
a strong secondary cue at closer range.

**Personality**: `{ bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.1, ampMul: 0.75 }`
— a proud, strutting walk (busier than the hen's jitter but with a touch
more swagger/amplitude per step).
**Bubbles**: `['🌅', '📣', '🐓', '❗']`

---

### `duck` — Duck (existing kind, farm-flavored)

*Existing kind: `cartoon_duck`.* No changes proposed — listed only to close
out the group. Already white-bodied with a yellow-orange bill and legs
(`sk 0.85, headR 122, skin/body 0xf2f0e6, shoe 0xe8a020, armL 0.6, footMul
[1.6, 0.7, 1.35], legColor 0xe8a020`), which reads perfectly well as a
plain farm duck as-is — no farm-specific recolor needed. Personality/bubbles
unchanged (`swayMul 1.7, cadenceMul 1.15` waddle; `['💦', '🐟']`).

## Rig gaps

- **No generalized quadruped spec table (the big one)**: `_buildQuadruped`
  hardcodes every proportion/color off a single `isCat` boolean + `sk` +
  one tint `color` argument — there is no `SPECS`-equivalent data table for
  quadrupeds the way the humanoid rig has one. Every field this doc uses
  beyond `sk` and coat tint (`bodyLen/W/H`, `legLen`, `headR` as an
  absolute mm, `earKind`, `tailKind`, `snoutSize`/`snoutShape`, and
  independent fixed `coat`/`belly`/`ear`/`snout`/`legColor` hexes) needs to
  be built. This is the prerequisite for every member in this pack beyond a
  literal cat/dog recolor.
- **No neck segment**: the quadruped head (`headG`) attaches directly to
  the torso at a fixed offset; there is no `neckLen` parameter or neck
  pivot. `horse` (long neck + flowing mane) and `donkey` (shorter neck +
  upright mane) both need this to read correctly — without it, both
  collapse toward the cow's proportions (head close to an oversized torso).
- **`earKind` vocabulary incomplete**: today only `pointy` (cat) and
  `floppy` (dog) exist, hardcoded via the `isCat` ternary rather than an
  enum. This pack needs `round` (cow/pig/goat/sheep) and `long` (donkey —
  the single defining silhouette cue for that member) added as real,
  data-driven ear shapes.
- **`tailKind` vocabulary incomplete + curly tail needs new geometry**:
  today both cat and dog get the SAME two-segment bent-cylinder tail shape
  at different lengths — there's no shape variation, only a length
  ternary. This pack needs `switch` (cow), `long-flowing` (horse),
  `tufted-tip` (donkey), `short-dock` (sheep/goat) as length/thickness
  variants of the existing two-segment shape (cheap), but `pig`'s tight
  **curl** genuinely cannot be built from two straight bent cylinders — it
  needs a small spiral/coil primitive (a short helical tube, or 2–3
  shrinking torus loops), which is new geometry, not just a new enum value.
- **Quadruped accessory anchors don't exist**: the humanoid rig's
  crown/head/face/chest/back/hip/hand bolt-on convention has no quadruped
  equivalent — `cat`/`dog` build ears/snout/tail as fully bespoke inline
  code, not data-driven attachments. `cow`'s horns+patches+udder,
  `pig`'s nostril dots, `horse`'s mane, `goat`'s horns+beard, and
  `donkey`'s dorsal-cross+mane all assume a quadruped accessory system
  (equivalent anchors: `crown`, `head`/`neck`, `back`, `face`, `flank`)
  that would need to be added alongside the spec-table gap above.
- **Multi-instance / scattered accessories (Holstein patches)**: `cow`'s
  patch pattern wants several irregularly-placed, irregularly-sized black
  boxes rather than one fixed accessory — the existing accessory
  convention (documented in `humans.md`/`aliens.md`) is a short fixed list
  per kind; a "scatter N patches with randomized-but-seeded size/position"
  authoring path doesn't obviously exist yet. A fixed reference layout
  (documented above) is an acceptable fallback if per-instance variety
  isn't worth building.
- **Coincident-face risk on flush-mounted patches/stripes**: per the
  project's documented toon-shading gotcha, any patch/stripe accessory
  (Holstein patches, the donkey's dorsal cross) sitting exactly flush on
  the coat surface will hatch/z-fight under `MeshToonMaterial`'s flat
  banding — every such accessory in this doc is specified "proud of the
  surface by a few mm," which the pack generator must preserve.
- **Rooster tail plumes need a new "plume" primitive**: the existing
  accessory shape vocabulary (box/cylinder/cone/sphere) doesn't cleanly
  produce a thin, tapered, curved sickle-feather at the rooster's tail
  length without visible faceting — worth a small dedicated primitive
  (a bent, tapered thin box or cylinder chain) if the pack generator wants
  a clean result; a coarser approximation (2–3 straight tapered cones,
  horse-mane-box style) is an acceptable fallback.
- **Chicken/rooster comb+wattle sub-30px legibility (soft gap)**: like
  `teen`'s hoodie in the humans pack, the comb/wattle accessories are the
  "confirms it" detail, not the "reads at a glance" detail — the primary
  silhouette read for both birds is body-shape + color + (for the rooster)
  tail plumes. Not a blocker, just noted so nobody expects comb/wattle
  alone to carry recognizability at avatar scale.
- **No fixed-multi-zone-color path, even for existing cat/dog**: today
  `earMat`/`snoutMat` colors in `_buildQuadruped` ARE already effectively
  "fixed, not tint" (pink cat ears, brown dog ears/snout) — but they're
  hardcoded hex literals in the ternary, not data pulled from a per-kind
  table. Generalizing the spec table (gap #1) should retrofit `cat`/`dog`
  onto the same schema this pack uses, so there's one code path instead of
  a special-cased original two plus a data-driven N.

## Sources

- [Holstein Friesian — Wikipedia](https://en.wikipedia.org/wiki/Holstein_Friesian)
- [Holstein Friesian Cattle Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/holstein-friesian-cattle)
- [Cattle Breeds 101: Holstein Cow Characteristics — Australia's Livestock Exporters](https://www.australiaslivestockexporters.com/holstein-cow-characteristics/)
- [Domestic Pig (Sus domesticus) Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/domestic-pig)
- [Pig — Wikipedia](https://en.wikipedia.org/wiki/Pig)
- [How Tall is a Horse? (Average Horse Height Chart) — Wild Jolie](https://wildjolie.com/blogs/guide/horse-height)
- [A Look at Different Horse Heights — Horse Illustrated](https://www.horseillustrated.com/horse-breeds-horse-height-explained/)
- [Domestic Sheep (Ovis aries) Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/domestic-sheep-ovis-aries)
- [7 Sheep Colors — Homestead Geek](https://homesteadgeek.com/sheep-colors/)
- [Breed Standards — American Dorper Sheep Breeders' Society](https://dorpersheep.org/breed-standards/)
- [Alpine Goat — Wikipedia](https://en.wikipedia.org/wiki/Alpine_goat)
- [Domestic Goat (Capra hircus) Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/domestic-goat-capra-hircus)
- [Goat — Britannica](https://www.britannica.com/animal/goat)
- [Color — Miniature Donkey Association](https://miniaturedonkeyassociation.com/standards/color.php)
- [Primitive markings — Wikipedia](https://en.wikipedia.org/wiki/Primitive_markings)
- [Miniature Donkeys — Oklahoma State University](https://breeds.okstate.edu/other-breeds-of-livestock/donkeys/miniature-donkeys.html)
- [Comb (anatomy) — Wikipedia](https://en.wikipedia.org/wiki/Comb_(anatomy))
- [Chicken Colors: A Complete Guide to Breeds & Patterns — Star Milling](https://starmilling.com/chicken-feather-colors-101/)
- [How to Identify a Rooster vs Hen — Grubbly Farms](https://grubblyfarms.com/blogs/the-flyer/how-to-identify-a-rooster-vs-hen)
- Existing in-repo reference: `src/three-renderer.ts` `_buildQuadruped`
  (cat/dog quadruped rig, `PET_KINDS`), `SPECS`/`_buildHumanoid`'s
  `cartoon_duck`/`cartoon_dog` kind branches (biped bird/animal costume
  convention), `AVATAR_PERSONALITY`/`AVATAR_BUBBLES` tables.
