# Avatar pack: Zoo animals (base)

## Overview

- **Hierarchy path**: `docs/avatars/base/zoo-animals.md` — a **base** pack
  (generic wildlife archetypes, not licensed characters), sibling to
  `docs/avatars/base/{humans,aliens,robotic,careers,pop-culture,scifi,
  farm-animals,domestic-animals}.md`. This is a **regroup-from-zero** pack —
  no zoo/wildlife kind ships today — built entirely against the same
  **PROPOSED generalized quadruped schema** that `farm-animals.md`
  established (see that doc's Overview + Rig gaps for the full derivation).
  `_buildQuadruped` in `three-renderer.ts` today hardcodes exactly two kinds
  (`cat`/`dog`) via a single `isCat ? … : …` ternary — there is still no
  `SPECS`-equivalent per-kind data table for quadrupeds, the way the
  humanoid rig already has one. This doc does not re-derive that schema; it
  **adopts it verbatim** (field names/units below) and only calls out where
  the zoo pack's real-world animals push it further than farm animals did.
- **Two rig families in this pack**: eight members (`lion`, `tiger`,
  `elephant`, `giraffe`, `zebra`, `bear`, `panda`, `hippo`) are
  **quadrupeds**; four (`monkey`, `gorilla`, `penguin`, `kangaroo`) are
  **bipeds** built on the existing humanoid rig, the same trick
  `cartoon_duck`/farm's `chicken`/`rooster` already use. No zoo member is an
  existing shipped kind — every one below is new (the prompt's "existing
  kinds: none yet" holds).
- **Fixed (non-tint) coloring, on purpose**: like `farm-animals.md` (and
  unlike `domestic-animals.md`'s generic cat/dog, whose coat IS the sensor
  identity tint), every member here uses **fixed, species-accurate hex
  colors**. A randomly-tinted purple tiger or a lime-green panda would
  defeat the entire point of an instantly-recognizable zoo roster — these
  are specific, iconic animals, not generic pet placeholders.
- **Adopted schema** (verbatim from `farm-animals.md`, reproduced here so
  this doc is self-contained):
  ```
  rig:        quadruped
  sk:         <uniform scale; dog = 1.0 ≡ ~520 mm shoulder height (existing
               baseline: _buildQuadruped's LEG_UPPER_LEN+LEG_LOWER_LEN+PAW_H
               at sk=1). cat = 0.58 (existing).>
  bodyLen:    <mult, on top of sk, vs dog baseline 640 mm>
  bodyW:      <mult, on top of sk, vs dog baseline 200 mm>
  bodyH:      <mult, on top of sk, vs dog baseline 240 mm>
  legLen:     <mult, on top of sk, vs dog baseline 455 mm
               (LEG_UPPER_LEN+LEG_LOWER_LEN, excludes paw)>
  neckLen:    <NEW field, mm — a neck segment between torso and head pivot;
               dog/cat = 0 (head sits directly off the torso today)>
  headR:      <mm, absolute — mirrors humanoid headR convention>
  earKind:    'pointy' | 'floppy' | 'round' | 'long'
  tailKind:   'switch' | 'curly' | 'long-flowing' | 'tufted-tip' | 'short-dock'
  snoutSize:  <mult vs dog baseline HEAD_R*0.62>
  snoutShape: 'box' | 'disc' | 'wedge'
  coat:       hex (fixed — NOT sensor tint)
  belly:      hex (optional lighter underside patch)
  ear:        hex
  snout:      hex
  ```
  **One schema extension this pack needs, additive and backward-compatible**:
  `tailLen: <mm, absolute>`. Farm's `tailKind` values implied one reference
  length per shape; this pack's tails vary too widely for a shared implicit
  default — giraffe's thin tail (~800 mm) vs. hippo's stub (~350 mm) vs.
  tiger's thick ringed tail (~950 mm) all want the SAME `tailKind` shape
  family at very different lengths. `tailKind` picks the shape, `tailLen`
  scales it. This is a data-field addition, not a new rig capability, so it
  is not listed under Rig gaps below.
  **Reuse discipline**: every quadruped member below reuses an EXISTING
  `earKind`/`tailKind`/`snoutShape` value wherever the real animal's shape
  family genuinely matches one already on the list (see farm's `round`/
  `long`/`tufted-tip` etc.) — this pack adds exactly ONE new `snoutShape`
  (`broad`, for `hippo`) and flags two members (`elephant`'s ears + trunk)
  where no enum value applies at all and a bespoke accessory is the only
  option (see Rig gaps).
- **Palette discipline**: eight very distinct coat families so the exhibit
  doesn't collapse into "brown quadrupeds" — tawny gold + dark mane (lion),
  bright orange + black stripes (tiger), slate grey (elephant), tan + dark
  reticulated patches (giraffe), black-and-white stripes (zebra), grizzled
  brown (bear), black-and-white patches (panda), slate-purple grey (hippo);
  the four bipeds get brown-black + cream cap (monkey), near-black + silver
  saddle (gorilla), black-and-white "tuxedo" + yellow (penguin), red-brown
  (kangaroo).
- **Real-world scale anchor, dialed for toon readability** (same philosophy
  as `farm-animals.md`'s cow/horse worked examples — a literal elephant at
  its real ~6× dog-baseline ratio would tower absurdly over every other
  avatar and most rooms; every `sk` below is derived from the real shoulder
  height against the dog baseline, then dialed down, with the proportion
  fields (`legLen`/`bodyLen`/`bodyH`/`neckLen`) carrying most of the
  "distinctively shaped" read instead of raw scale). `elephant` is the
  extreme case and gets its own explicit discussion in its entry and in Rig
  gaps (oversized-quadruped nav footprint).

## Members

### lion — "Lion (maned)"

**Reference**: the African lion — tawny-gold coat, adult males carry a
shaggy mane (blond to black, darkening with age) framing the head/neck/
chest, a dark tail tuft. Shoulder height ~1.0–1.2 m (male avg ~1.2 m),
weight 150–250 kg (male). The mane is THE defining trait separating lion
from every other big cat in this pack.

**Spec**
```
rig:        quadruped
sk:         2.0              # 1.2 m / 0.52 m dog baseline ≈ 2.3, dialed to 2.0
bodyLen:    1.4               # long, low predator body
bodyW:      1.3
bodyH:      1.1
legLen:     0.95
neckLen:    150               # short, thick — the mane visually replaces most of it
headR:      230               # large blocky head, generous radius for the mane volume
earKind:    round
tailKind:   tufted-tip
tailLen:    850
snoutSize:  1.3
snoutShape: wedge
coat:       0xc9963e          # tawny gold
belly:      0xe8d9b0          # pale cream underside
ear:        0xc9963e
snout:      0x6b4a2e          # darker muzzle
```

**Accessories**
- `crown`/`head`/`back` (neck ruff, THE headline accessory): 8–10
  overlapping sphere "tuft" lobes forming a ruff around the head, neck, and
  upper chest, color `0x6b4224` (dark chestnut-brown), each lobe slightly
  offset in radius/position so the ruff reads as shaggy rather than one
  smooth dome. A lighter-blond variant (`0x9a7038`) on a second instance is
  an easy optional refinement (younger male), not required for the base
  read.
- `back` (tail tip, layered onto the `tufted-tip` tailKind): a slightly
  oversized dark tuft sphere, `0x3a2a1c`, bigger than the donkey's
  reference tuft — a lion's tail tuft is a much more prominent feature.

**Silhouette check**: the shaggy mane ruff around the head/neck is
unmistakable even at 30 px and is the ONE thing that reads "lion" and not
"generic big cat" — without it this spec is just a tawny mountain lion or
lioness silhouette. Fully buildable with the existing sphere-lobe accessory
technique (see Rig gaps for the "quadruped accessory anchors don't exist
yet" prerequisite it shares with every member in this pack).

**Personality**: `{ bobMul: 0.8, swayMul: 0.75, cadenceMul: 0.65, ampMul: 1.0 }`
— a slow, confident, powerful prowl.
**Bubbles**: `['🦁', '☀️', '😴', '👑']`

---

### tiger — "Tiger (striped)"

**Reference**: the Bengal/generic tiger — bright orange-to-rust coat with
black vertical stripes (unique per animal, no two alike), white muzzle/
chest/belly patches, black rings down the tail. Shoulder height ~0.9–1.1 m,
weight 100–260 kg (male avg ~221 kg). Distinguished from `lion` by stripes +
no mane + a longer, leaner body — colour AND pattern both do the work here.

**Spec**
```
rig:        quadruped
sk:         1.9              # ~1.0 m / 0.52 m ≈ 1.9
bodyLen:    1.5               # longer, leaner body than lion
bodyW:      1.2
bodyH:      1.05
legLen:     0.95
neckLen:    100
headR:      210
earKind:    round             # small rounded ears with a pale spot on the back (see accessories)
tailKind:   long-flowing      # thin tail shape; the RINGS are a pattern accessory, not the shape
tailLen:    950
snoutSize:  1.25
snoutShape: wedge
coat:       0xe8791e          # bright orange
belly:      0xf5efe0          # white muzzle/chest/belly
ear:        0xe8791e
snout:      0xf5efe0          # pale muzzle
```

**Accessories**
- `back`/`flank`/`face`/`head` (8–12 instances, THE headline accessory):
  black stripe patches — thin curved plates following the body/leg/head
  cylinders, sitting **proud of the coat surface by ~4 mm** (the documented
  coincident-face gotcha, same treatment farm's cow patches use), color
  `0x151515`. Vertical on the torso flanks, angled on the shoulders/hips,
  a couple of thin rings wrapped around the tail.
- `head` (ear backs, 2 instances): small pale spot, `0xf0ede0`, on the back
  of each ear — a genuine tiger feature (thought to function as a false
  "eye" signal to cubs/rivals from behind).

**Silhouette check**: orange-and-black stripes are the single most
recognizable big-cat pattern in the world and carry this member's read
almost entirely on their own, even before body shape registers — but see
Rig gaps: this is the pack's heaviest stress-test of the "no pattern
system, no scatter-authoring path" gap (10+ individually placed stripe
accessories per animal).

**Personality**: `{ bobMul: 0.85, swayMul: 0.9, cadenceMul: 0.7, ampMul: 1.05 }`
— a lean, deliberate, slightly more sinuous prowl than the lion's.
**Bubbles**: `['🐯', '🧡', '🎋', '😼']`

---

### elephant — "Elephant (African, trunk & tusks)"

**Reference**: the African bush elephant — the largest land animal.
Slate-grey wrinkled skin, huge fan-like ears (~1.8 m × 1.2 m — a defining
silhouette feature in themselves), a long muscular trunk (the single most
iconic feature of any animal in this pack), ivory tusks, a small tufted
tail. Bull shoulder height 3.0–3.36 m (largest recorded 3.96 m), weight
5.2–6.9 t.

**Spec** (see the scale note below — this is the pack's one genuinely
oversized member)
```
rig:        quadruped
sk:         2.6              # true ratio ≈ 3200/520 ≈ 6.15 — see scale note
bodyLen:    1.7               # huge barrel torso
bodyW:      1.8
bodyH:      1.9
legLen:     1.3               # thick pillar legs, minimal visible knee flex
neckLen:    0                 # no visible neck — head blends into the shoulder mass
headR:      420
earKind:    round             # PLACEHOLDER only — the real ear is not a small pivot
                                # shape at all; see accessories + Rig gaps
tailKind:   tufted-tip
tailLen:    1200               # looks short against the huge body despite the length
snoutSize:  0                 # the snout primitive is entirely superseded by the trunk
snoutShape: box               # unused — see trunk accessory
coat:       0x8a8a86          # slate grey
belly:      0x8a8a86
ear:        0x8a8a86
snout:      0x8a8a86
```

**Scale note**: a literal true-scale bull (`sk` ≈ 6.15) would stand ~3.2 m
at the shoulder in a scene built for ~1.7–1.8 m human rigs — dwarfing every
door, most rooms, and the nav grid's person-scale assumptions (see Rig
gaps). `sk: 2.6` (~1.3 m shoulder) is the recommended DISPLAY default —
still clearly the largest thing in any scene it's placed in — with the
true-scale option flagged for an outdoor/zoo-scale diorama that explicitly
wants it.

**Accessories**
- `head` (ears, 2 instances, THE headline accessory alongside the trunk):
  large, thin, gently-curved flat fan shapes (flattened, scaled hemisphere
  domes or wide flattened boxes work as an approximation), ⌀ roughly
  `headR × 1.3`, color matches coat, mounted on the sides of the head and
  angled to flare outward/backward — see Rig gaps: no existing `earKind`
  value models a flap even remotely this large relative to the head.
- `face` (trunk, THE single most important accessory in this entire pack):
  a segmented, tapering cylinder chain — 4–5 segments narrowing from
  `headR × 0.35` at the base to `headR × 0.12` at the tip — hanging from
  the face anchor with a slight forward-and-down curl, `HEAD_R × 1.6` total
  length. See Rig gaps: this needs its own jointed/poseable accessory
  primitive, the same category of need as the aliens pack's tentacle-head
  gap, but here it's the animal's SOLE defining feature rather than one
  detail among several.
- `face` (tusks, 2 instances): tapered cones curving slightly outward and
  up, flanking the trunk base, ⌀ `headR × 0.12` tapering to a point,
  length `headR × 0.9`, color `0xf2ede0` (ivory).

**Silhouette check**: the trunk alone is sufficient to read "elephant" at
any scale, even in pure silhouette — the huge fan ears are the strong
secondary confirm. Without a real trunk accessory (today's rig has nothing
resembling one), this member cannot be built at all, only approximated as
"big grey quadruped with a long nose bump" — flagged as the pack's single
biggest rig gap.

**Personality**: `{ bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.5, ampMul: 0.65 }`
— slow, heavy, deliberate steps; almost no bounce.
**Bubbles**: `['🐘', '🌿', '💧', '🎪']`

---

### giraffe — "Giraffe (reticulated pattern)"

**Reference**: the giraffe — the tallest land animal. Total height 4.3–5.7
m, of which the neck alone is ~1.8 m (~272 kg on its own) and the legs are
similarly extreme; two hair-covered ossicones on the crown; a body pattern
of patches separated by lighter lines, whose exact shape varies by
subspecies — this doc follows the **reticulated giraffe** look (large
orange-brown polygonal patches separated by narrow cream network lines),
the single most visually iconic version of the pattern.

**Spec**
```
rig:        quadruped
sk:         1.8              # body girth/head-size scale only — height comes from legLen+neckLen, not sk
bodyLen:    1.3
bodyW:      0.75              # notably narrow/lean torso relative to its height
bodyH:      1.15
legLen:     3.0               # THE headline proportion, alongside neckLen — extremely long straight legs
neckLen:    1900               # THE other headline proportion — this pack's biggest ask of the neckLen gap
headR:      190
earKind:    round              # small, forward-set
tailKind:   tufted-tip
tailLen:    800
snoutSize:  1.1
snoutShape: wedge
coat:       0xe8c9a0          # cream/tan base
belly:      0xf2e6cf
ear:        0xe8c9a0
snout:      0x2b2320
```

**Accessories**
- `crown` (ossicones, 2 instances): short fur-covered knobs — a stubby
  cylinder + a small sphere cap, ⌀40 mm × 130 mm, color `0xc9a878`
  (slightly darker than the base coat, "furred" read), positioned either
  side of the crown midline.
- `back`/`head`/`face` (patch pattern, THE headline accessory alongside
  the neck itself, 15–20+ instances): large flattened irregular
  polygon-ish patches (approximated with clustered flattened boxes/cones)
  covering the neck, body, and upper legs, color `0x8b4a2b` (chestnut-
  brown), separated by the cream base coat showing through as the "network
  lines" — proud of the surface per the coincident-face rule. This is, by
  instance count, the single densest pattern-accessory member in the
  entire pack.

**Silhouette check**: the neck + leg length combination is so extreme that
NOTHING else matters for recognizability — a giraffe silhouette is
unmistakable in pure grey outline before the patch pattern or ossicones
register at all. This makes `giraffe` the pack's clearest demonstration of
why the **no-neck-segment** rig gap blocks a member outright rather than
just degrading it: without `neckLen`, the head has nowhere to go but
directly onto an already-oversized torso, and the entire silhouette
collapses toward a generic long-legged quadruped.

**Personality**: `{ bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.55, ampMul: 1.4 }`
— a slow-looking but very ground-covering stride (real giraffes move both
legs on one side together, a gait style well beyond this doc's scope —
noted as a nice-to-have, not required for a readable toon walk).
**Bubbles**: `['🦒', '🌳', '🍃', '😊']`

---

### zebra — "Zebra (plains, striped)"

**Reference**: the plains zebra — black-and-white stripes (vertical/thin
on the neck and forequarters, widening and turning horizontal on the
flanks/hindquarters, extending onto the belly in this species), a short
upright dark mane along the neck ridge, horse-like build. Shoulder height
~1.3 m, weight 290–340 kg.

**Spec**
```
rig:        quadruped
sk:         2.1              # ~1.3 m / 0.52 m ≈ 2.5, dialed to 2.1
bodyLen:    1.15
bodyW:      0.85
legLen:     1.25
neckLen:    280
headR:      160
earKind:    pointy            # tall upright horse-like ears
tailKind:   tufted-tip
tailLen:    700
snoutSize:  1.2
snoutShape: wedge
coat:       0xf2eee4          # white/cream base
belly:      0xf2eee4
ear:        0xf2eee4
snout:      0x1c1c1c          # dark muzzle
```

**Accessories**
- `back`/`head`/`face`/`flank` (10–15+ instances, THE headline accessory):
  black stripe patches, `0x141414`, thin and near-vertical on the neck/
  shoulders, widening and turning horizontal toward the flanks/hindquarters
  (matching the real vertical-to-horizontal transition), continuing a few
  strokes onto the belly per the plains-zebra species trait — proud of the
  surface per the coincident-face rule.
- `head`/`neck` (upright mane, running the `neckLen`): 5–7 short stiff
  standing boxes, `0x141414`, alternating with thin white gaps if the
  generator wants extra fidelity (a plain solid dark ridge is an acceptable
  simpler fallback).

**Silhouette check**: black-and-white stripes are as globally iconic as
the tiger's orange-and-black — this member's read is 100% the pattern
accessory; the base body shape alone (cream, no stripes) would just look
like a plain generic equine and not register as "zebra" at all.

**Personality**: `{ bobMul: 0.85, swayMul: 0.8, cadenceMul: 0.9, ampMul: 1.15 }`
— alert, skittish energy, a touch quicker/twitchier than a calm horse gait.
**Bubbles**: `['🦓', '🌾', '👀', '💨']`

---

### bear — "Bear (grizzly, shoulder hump)"

**Reference**: the grizzly/brown bear — brownish-buff fur with silver-
tipped "grizzled" guard hairs, small round ears, a short thick tail almost
entirely hidden in fur, and — the key trait separating it from a generic
big dog — a pronounced muscular hump over the shoulders. Shoulder height
1.0–1.4 m, weight 180–360 kg average (coastal males up to ~680 kg).

**Spec**
```
rig:        quadruped
sk:         2.2              # ~1.2 m / 0.52 m ≈ 2.3, dialed to 2.2
bodyLen:    1.2
bodyW:      1.35              # bulky, low-slung barrel
bodyH:      1.25
legLen:     0.85               # short, stocky legs relative to the barrel
neckLen:    90
headR:      230
earKind:    round
tailKind:   short-dock
tailLen:    120
snoutSize:  1.15
snoutShape: box
coat:       0x7a5a3c          # grizzled brown
belly:      0x7a5a3c
ear:        0x7a5a3c
snout:      0x3a2c1e
```

**Accessories**
- `back` (shoulder hump, THE headline accessory): a raised muscle-mass
  bump between the shoulders — a flattened dome or box, coat-colored,
  subtly proud of the torso silhouette right at the base of the neck. This
  is the single detail that reads "grizzly" rather than "generic big dog"
  at a glance.

**Silhouette check**: the shoulder hump + bulky low-slung body + small
round ears is fully readable at 30 px with just ONE accessory — the
grizzled brown coloring is a nice-to-have confirm, not load-bearing.

**Personality**: `{ bobMul: 0.7, swayMul: 0.85, cadenceMul: 0.6, ampMul: 0.9 }`
— a heavy, rolling, powerful plod.
**Bubbles**: `['🐻', '🐟', '🍯', '😴']`

---

### panda — "Panda (giant, black-and-white patches)"

**Reference**: the giant panda — thick white coat with bold black patches:
eye "goggles," ears, muzzle band, and a front "vest" running down the
shoulders/forelegs. Shoulder height ~0.9–1.1 m, weight up to 125 kg (male).
Shares this pack's `bear`-family quadruped body plan (round bulky torso,
short thick legs) at a smaller, stockier, and much more roundly "cute"
scale, with an entirely different fixed color pattern.

**Spec**
```
rig:        quadruped
sk:         1.7              # ~1.0 m / 0.52 m ≈ 1.9, dialed down further than bear — reads smaller/stockier on purpose
bodyLen:    1.0
bodyW:      1.3
bodyH:      1.2
legLen:     0.7               # very short, stubby legs
neckLen:    50
headR:      215               # proportionally large, round head vs. body — a key "cute" trait
earKind:    round              # BLACK, contrasting the white head (ear color ≠ coat color, see spec)
tailKind:   short-dock
tailLen:    130
snoutSize:  1.0
snoutShape: box
coat:       0xf5f3ec          # white base
belly:      0xf5f3ec
ear:        0x161616          # black
snout:      0xf5f3ec
```

**Accessories**
- `face` (eye patches, 2 instances, THE headline accessory): black
  flattened oval "goggle" discs, `0x161616`, angled around each eye —
  sitting OVER the standard toon eye position rather than replacing it.
- `face` (muzzle band): a black box/cylinder wrap around the snout base,
  `0x161616`.
- `chest`/`back` (shoulder "vest", 2–3 instances): connected black patches
  running down the front legs and across the shoulders, `0x161616`,
  reading as a saddle/vest over an otherwise white body.
- `hip` (rear-leg "stockings", 2 instances): black patches on the rear
  legs, `0x161616`, echoing the front-leg vest.

**Silhouette check**: the black eye-goggles + black-and-white body split
is unmistakable even at 30 px and cannot be confused with any other member
in the pack — this is, alongside `giraffe`'s patch density, the heaviest
exercise of the pattern/multi-instance-accessory rig gap in this doc.

**Personality**: `{ bobMul: 0.9, swayMul: 1.0, cadenceMul: 0.75, ampMul: 0.7 }`
— a slow, tumbling, faintly clumsy amble.
**Bubbles**: `['🐼', '🎋', '😴', '🖤']`

---

### hippo — "Hippopotamus (river, barrel body)"

**Reference**: the common hippopotamus — an enormous barrel-shaped body on
short stubby legs, a huge wide muzzle/mouth, small eyes and ears set HIGH
on the head (a semi-aquatic adaptation), slate/mud-brown to purplish-grey
skin. Shoulder height up to ~1.5 m, body length 3.3–5 m, weight up to
~4,500 kg — the third-largest land mammal after elephants and some
rhinos.

**Spec**
```
rig:        quadruped
sk:         2.4              # true ratio ≈ 2.9, dialed to 2.4 — the barrel WIDTH carries most of the "huge" read, not raw sk
bodyLen:    1.8               # huge barrel torso — the widest-relative-to-length member in the pack
bodyW:      2.0
bodyH:      1.5
legLen:     0.55               # very short, stumpy legs under the barrel — the OTHER headline proportion
neckLen:    0                 # no visible neck — head blends straight into the barrel
headR:      340               # huge, wide head/muzzle
earKind:    round              # tiny relative to the head, and set HIGH near the crown, not the sides (see note)
tailKind:   short-dock
tailLen:    100
snoutSize:  1.6
snoutShape: broad             # NEW value — see Rig gaps
coat:       0x6e6a6a          # slate grey-brown
belly:      0x8a7070          # slightly pinker undertone
ear:        0x6e6a6a
snout:      0x6e6a6a
```

**Positioning note**: real hippo eyes/ears/nostrils sit in a near-straight
vertical line high on the head (so the animal can see/hear/breathe while
almost fully submerged) — the `earKind: round` pivot should be anchored
noticeably higher/more-crown-ward than every other quadruped in this pack,
not a new enum value, just an authoring note for whoever places the
anchor.

**Accessories**
- `face` (eye/ear pink accents, optional, small detail): faint pink
  patches, `0x9a6a6a`, around the eyes/ears/mouth-line — a real, if subtle,
  hippo trait. Skippable at 30 px; a nice-to-have for closer inspection.

**Silhouette check**: the sheer body-width-to-leg-length ratio (a huge low
barrel on stumpy legs) plus the oversized broad muzzle is the recognizer —
no exotic accessory is needed; this member is a pure proportions play and
a good stress test of how far the `bodyW`/`legLen` extremes of the
generalized quad schema can flex.

**Personality**: `{ bobMul: 0.65, swayMul: 0.6, cadenceMul: 0.55, ampMul: 0.75 }`
— a slow, waddling, ponderous plod (surprisingly fast in real life over
short bursts — not attempted here; a toon "surprising speed" gait spike
would be a fun but unnecessary refinement).
**Bubbles**: `['🦛', '💧', '🌿', '😮']`

---

### monkey — "Monkey (capuchin-style, tailed)"

**Reference**: a generic New-World capuchin-style monkey — deliberately
NOT a chimpanzee: real apes (chimps, gorillas) have **no tail**; only true
monkeys do, and the prompt's "monkey/chimp… tail" pairing is resolved here
by anchoring on the tailed, zoologically-correct half of that pairing.
Brown-to-black body fur with a paler cream "cap" of fur on the head and a
pale face/throat/chest patch, a long tail (as long as the body). Head-body
length 30–56 cm, tail 35–55 cm, mass 1.5–5 kg — much smaller than an ape.
**Biped**, built on the humanoid rig.

**Spec**
```
sk:        0.55
headR:     100
headShape: sphere
limbR:     0.85
skin:      0x2e2118          # dark brown-black body fur
body:      0x2e2118
shoe:      0x1c1512
emI:       0.15
hands:     sphere
eyes:      dots
steel:     false
armL:      1.2                # long arms for climbing (per the prompt's explicit spec)
legL:      0.85               # short legs relative to arms
```

**Accessories**
- `crown`/`head` (fur cap, 1 instance): a cream dome, `0xdccdaa`, sized to
  clear the eye band (raised + tilted back, following the standard
  hat/hair convention already used elsewhere in the rig) — reads as the
  lighter fur "cap" real capuchins have.
- `face` (pale face/throat patch): a small flattened oval, `0xe8dcc0`,
  overlaying the lower face — the light-face-against-dark-body contrast
  capuchins are named for.
- `back` (tail, THE headline accessory): a long, thin, tapering cylinder
  chain (2–3 segments), curling gently at the tip, `0x2e2118` (matches
  body), length roughly equal to `headR`-scaled body length. See Rig gaps
  — the humanoid rig has no existing tail-attachment convention at all
  (unlike the quadruped's dedicated `tailKind`/`tailLen` fields); this is
  buildable today as a plain static `back`-anchor accessory, just without
  any dedicated idle-sway animation.

**Silhouette check**: the long tail plus long-armed silhouette is what
separates this member from a small child-scaled humanoid — the cream face/
cap patch is the secondary confirm. Loses very little at 30 px since the
tail, even static, reads clearly as a tail against the small body.

**Personality**: `{ bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.4, ampMul: 0.85 }`
— quick, twitchy, restless energy.
**Bubbles**: `['🐒', '🍌', '❓', '😄']`

---

### gorilla — "Gorilla (silverback)"

**Reference**: the mature male ("silverback") gorilla — jet-black-to-dark-
brown coarse fur with a silvery-grey "saddle" patch across the back that
develops with age, a pronounced sagittal crest on the skull, an enormous
arm span (up to ~2.6 m) relative to standing height (~1.7–1.8 m upright,
though it typically knuckle-walks at a lower shoulder height ~1.4–1.5 m),
weight 140–220+ kg. **Biped**, built on the humanoid rig (rendered upright,
matching every other member's Sims-style bipedal walk — see Rig gaps for
the optional knuckle-walk note).

**Spec**
```
sk:        1.25              # bulky, taller/broader than the adult baseline
headR:     150                # large head, room for the sagittal crest bump
headShape: sphere
limbR:     1.6                # extremely thick, muscular limbs — the primary bulk read
skin:      0x141210           # near-black
body:      0x141210
shoe:      0x0a0a0a
emI:       0.10                # matte, non-glowy
hands:     box                 # heavy, blunt knuckle-mitts rather than the default sphere hand
eyes:      dots                # small, deep-set under the default heavy brow
steel:     false
armL:      1.5                 # huge arm span — the OTHER primary silhouette read, alongside limbR
legL:      0.85                # comparatively shorter legs vs. arms, a real gorilla trait
```

**Accessories**
- `back` (silverback saddle patch, THE headline accessory): a flattened,
  gently curved patch over the mid-back, `0xb9b9bd` (silver-grey), proud of
  the coat surface.
- `crown` (sagittal crest): a low, thin raised ridge sliver along the head
  midline, dark (matches skin), subtle enough to read as bone structure
  rather than hair.

**Silhouette check**: the combination of extreme `limbR` bulk + `armL`
reach is the primary recognizer; the silver saddle patch is what confirms
"specifically a mature silverback" rather than just a generic bulky dark
ape.

**Rig note (optional, non-blocking)**: real gorillas knuckle-walk
quadrupedally most of the time; this spec renders an upright bipedal Sims
walk like every other member in the roster (consistent with how the rest
of this doc's humanoid-rig members are handled) — a forward-lean,
knuckles-down gait variant would be a nice-to-have refinement, not
required for a readable "gorilla" silhouette.

**Personality**: `{ bobMul: 0.75, swayMul: 0.9, cadenceMul: 0.65, ampMul: 1.1 }`
— a slow, heavy, rolling gait with a wide-armed swing.
**Bubbles**: `['🦍', '🌿', '💪', '🥁']`

---

### penguin — "Penguin (emperor, tuxedo)"

**Reference**: the emperor penguin — the largest/most iconic penguin
species. Black dorsal plumage (head, back, tail, flipper backs), white
belly/front, pale-to-bright yellow breast/ear patches, a pink-orange-lilac
bill, height ~1.15–1.3 m, weight 22–45 kg. Distinctive upright waddling
gait. **Biped**, built on the humanoid rig — the same "duck" pattern the
existing `cartoon_duck` kind already uses, per the prompt's explicit
framing.

**Spec**
```
sk:        0.9
headR:     118
headShape: sphere
limbR:     0.85
skin:      0x15161a          # near-black "tuxedo" base
body:      0x15161a
shoe:      0xe2841c          # orange-pink feet
emI:       0.18
hands:     box                # approximates a flat flipper better than a sphere (see Rig gaps)
eyes:      dots
steel:     false
armL:      0.5                # short flipper-arms (per the prompt's explicit spec)
legL:      0.7                 # short legs, waddling stance
footMul:   [1.3, 0.6, 1.1]     # flat, wide feet
legColor:  0xe2841c            # orange legs, matching feet
```

**Accessories**
- `chest`/`torso-front` (white belly patch, THE headline accessory): a
  large flattened oval/box overlay on the torso front, `0xf5f3ea`, proud of
  the black base coat — the core "tuxedo" contrast.
- `chest`/`head` (yellow breast/ear patches, 2 instances): small flattened
  almond patches at the upper chest and head sides, a pale-to-bright yellow
  (`0xf0e6a8` collar fading toward `0xf2c230` cheek patches, or a single
  mid-tone `0xe8d24a` for a simpler build).
- `face` (bill): a small horizontally-flattened cone/wedge, a dusty coral-
  orange (`0xc97a54`) as a practical single-color simplification of the
  real bill's pink/orange/lilac blend (secondary detail, low priority at
  30 px).

**Silhouette check**: the black "tuxedo" head/back against the bright
white belly and yellow neck patches is the recognizer, readable well
before the bill registers at all.

**Personality**: `{ bobMul: 1.3, swayMul: 1.6, cadenceMul: 0.75, ampMul: 0.9 }`
— the heaviest, most exaggerated waddle in the roster (more than
`cartoon_duck`'s default), a slow comedic gait.
**Bubbles**: `['🐧', '❄️', '🐟', '😆']`

---

### kangaroo — "Kangaroo (red, tripod tail)"

**Reference**: the red kangaroo — the largest marsupial. Standing height
to the top of the head ~1.5 m (large males up to ~1.8–2.1 m), males red-
brown fading to pale buff on the limbs/belly (females blue-grey — this
spec follows the male coloring as the more iconic "red kangaroo" look),
powerful elongated hind legs and feet, small forearms held close to the
chest, and a thick muscular tail used as a "third leg"/tripod for balance
and as a prop while standing still. **Biped**, built on the humanoid rig.

**Spec**
```
sk:        1.0
headR:     108                # small head relative to the body
headShape: sphere
limbR:     0.9                # one shared value for all four limbs — see Rig gaps (arms read thinner than they'd ideally be against these powerful legs)
skin:      0xb5652e           # red-brown (male coloring)
body:      0xb5652e
shoe:      0x3a2a1c            # dark, clawed feet
emI:       0.20
hands:     sphere
eyes:      dots
steel:     false
armL:      0.55                # short forearms held close to the chest
legL:      1.6                 # powerful, elongated hind legs — per the prompt's explicit spec
footMul:   [1.2, 0.65, 2.1]    # long, narrow, elongated feet — pushed harder on the depth axis than any other member in this doc
```

**Accessories**
- `back`/`hip` (tail, THE headline accessory): a thick, tapering cylinder
  chain (2–3 segments), base radius large narrowing toward the tip, length
  ~1100 mm, coat-matching red-brown, extending back-and-down from the hip.
  See Rig gaps: this needs a "resting tripod" pose bias distinct from the
  monkey's freely-hanging tail — a real kangaroo visibly PLANTS its thick
  tail on the ground when standing still (using it as a third leg), which
  the current idle pose has no coupling for.
- `head` (ears, 2 instances): tall, thin cones, coat-colored, noticeably
  taller/narrower than any existing default humanoid ear treatment — this
  kind should be added to the `EAR_SKIP` set so the rig's default small
  human ear doesn't poke out from underneath/behind these.

**Silhouette check**: the powerful hind-leg-heavy stance (via `legL: 1.6`)
plus the thick tripod tail together read as "kangaroo" even in silhouette;
the long ears and red-brown coloring are secondary confirms.

**Rig note (optional, non-blocking)**: real kangaroos move by hopping, not
an alternating-stride walk — the shared humanoid walk cycle has no "hop"
gait. A high-`bobMul` bouncy walk (the same approximation `teddy_bear`/
`cartoon_duck` rely on for their own non-human gaits) is an acceptable
toon substitute; a genuine hop-gait blend is a nice-to-have, not required.

**Personality**: `{ bobMul: 1.6, swayMul: 0.6, cadenceMul: 0.9, ampMul: 1.1 }`
— a heavy, bouncy gait standing in for a hop.
**Bubbles**: `['🦘', '🥊', '🌏', '😤']`

## Rig gaps

1. **No generalized quadruped spec table (the big one, inherited from
   `farm-animals.md`)**: `_buildQuadruped` still hardcodes every proportion/
   color off a single `isCat` boolean + `sk` + one tint `color` argument.
   Every field this doc uses beyond `sk` and a single coat tint (`bodyLen/
   W/H`, `legLen`, `neckLen`, `headR` as absolute mm, `earKind`, `tailKind`,
   `tailLen`, `snoutSize`/`snoutShape`, independent fixed `coat`/`belly`/
   `ear`/`snout` hexes) needs to be built. This is the prerequisite for
   every quadruped member in this pack, exactly as it was for farm animals.
2. **No neck segment (inherited, pushed to its extreme here)**: farm's
   `horse`/`donkey` first flagged this; `giraffe` in this pack is the
   single hardest case the gap will ever see — a **1900 mm** `neckLen`
   with its own bend/idle-sway pivot is not optional, it's the entire
   silhouette. Without it, `giraffe` cannot be built at all, only
   approximated as an oddly long-legged quadruped with a head sitting
   directly on its shoulders.
3. **Quadruped accessory anchors don't exist (inherited, heavily used
   here)**: no equivalent of the humanoid rig's crown/head/face/chest/back/
   hip/hand bolt-on convention exists for quadrupeds yet. Every quadruped
   member in this pack (`lion`'s mane, `tiger`/`zebra`'s stripes,
   `giraffe`'s ossicones+patches, `elephant`'s ears+trunk+tusks, `bear`'s
   hump, `panda`'s patches, `hippo`'s pink accents) assumes this system
   (anchors: `crown`, `head`/`neck`, `back`, `face`, `flank`/`hip`, `chest`)
   is built alongside the spec-table gap above.
4. **Multi-instance / scattered "pattern" accessories, pushed harder than
   farm ever needed**: farm's cow patches (3–5 instances) first flagged
   that the accessory convention is a short FIXED list per kind with no
   "scatter N patches" authoring path. This pack pushes that gap much
   further — `tiger` and `zebra` both want 10–15+ individually-placed
   stripe accessories, and `giraffe`'s reticulated pattern wants 15–20+.
   A fixed reference layout (as sketched in each entry above) remains an
   acceptable fallback, but a real "stripe/patch generator" authoring path
   (parametrized by count/spacing/angle rather than a literal per-instance
   list) would clearly pay for itself starting with this pack.
5. **Elephant's ears have no matching `earKind` value at all (new, major)**:
   every existing/proposed `earKind` (`pointy`/`floppy`/`round`/`long`) is a
   small pivot-mounted shape; a real elephant ear is a huge flat fan nearly
   as large as the head itself. This needs a bespoke large-flap accessory
   (the same category of solution the aliens pack used for the insectoid's
   compound eyes — treat it as an accessory pair rather than force it into
   the `earKind` enum), not a new enum value.
6. **Segmented, poseable trunk/proboscis accessory (new, THE pack's single
   biggest gap)**: nothing in the current accessory vocabulary (box/
   cylinder/sphere/cone bolt-ons) produces a genuinely trunk-like,
   independently-poseable appendage — `elephant` needs this more than any
   member in this pack needs any other single feature, since the trunk
   alone IS the animal's silhouette. Same underlying need-class as the
   aliens pack's tentacle-head gap (a jointed chain with its own idle
   motion), but here it is fully blocking rather than a nice-to-have detail
   — without it, `elephant` degrades to "big grey quadruped with a long
   nose bump," which does not read as an elephant.
7. **New `snoutShape: 'broad'` value (new, small)**: `hippo`'s enormous
   flat-topped wide muzzle doesn't fit any of farm's existing `box`/`disc`/
   `wedge` shapes — needs one new, wider/flatter primitive. Small,
   contained addition; every other member in this pack reuses an existing
   `earKind`/`tailKind`/`snoutShape` value.
8. **Oversized-quadruped nav/physical footprint (new)**: `PERSON_R = 170`
   (the nav-grid furniture-footprint inflation radius), the ~380 mm
   pairwise rig-separation spacing, and the default blob-shadow radii all
   assume a person/pet-scale moving footprint. `elephant` (this pack's
   largest even at the dialed-down `sk: 2.6`), `hippo`, and `giraffe` all
   need either a per-kind nav footprint radius or an explicit acceptance
   that pathing/separation code won't reflect their real bulk. Farm's
   biggest member (`cow` at `sk: 2.5`) stayed close enough to person-scale
   to avoid surfacing this; this pack's largest animals do not.
9. **No tail-attachment convention on the humanoid rig at all (new)**: the
   quadruped rig at least has dedicated (if under-built) `tailKind`/
   `tailLen` fields; the humanoid rig has NOTHING equivalent — `monkey`'s
   freely-hanging curled tail and `kangaroo`'s thick, ground-planted
   "tripod" tail are both buildable TODAY only as a plain static `back`-
   anchor accessory (cylinder chain), with no idle-sway animation and, for
   `kangaroo` specifically, no way to couple the tail's rest pose to the
   idle-standing state (a kangaroo's tail visibly plants on the ground when
   still, distinct from a walking/hopping tail) — a materially harder ask
   than `monkey`'s simple hang.
10. **Per-limb-group thickness on the humanoid rig (new)**: `Spec` has one
    `limbR` shared by all four limbs. `kangaroo` genuinely wants thin,
    slight forearms (`armL: 0.55`) alongside powerful, thick hind legs
    (`legL: 1.6`) — the single shared `limbR` can't express "thin arms,
    thick legs" simultaneously the way two independent fields
    (`armLimbR`/`legLimbR`) could. Workable today as a compromise single
    value (specced above), not a blocker, but a real limitation for this
    member specifically.
11. **No flipper/paddle hand shape (new, minor)**: `hands` only supports
    `'sphere'`/`'box'`; `penguin` wants a genuinely flat paddle-shaped
    flipper, which `'box'` only approximates (reads as a blunt mitt, not a
    flat paddle). Minor — the existing `'box'` option is an acceptable
    stand-in, same as `gorilla`'s knuckle-mitts use it deliberately.
12. **Hop / knuckle-walk gait blends (new, nice-to-have, non-blocking)**:
    `kangaroo`'s real hopping locomotion and `gorilla`'s real knuckle-
    walking both differ from the shared alternating-stride bipedal walk
    cycle every humanoid-rig kind uses today. Both are specced above with
    personality-multiplier approximations (high `bobMul` for the kangaroo,
    a slow wide-armed gait for the gorilla) in the same spirit as how
    `teddy_bear`/`cartoon_duck` already stand in for their own non-human
    gaits — acceptable for a Sims-toon read, not blocking either member,
    but flagged in case a future pack wants literal hop/knuckle-walk
    animation.

## Sources

- [Lion | Smithsonian's National Zoo](https://nationalzoo.si.edu/animals/lion)
- [African Lion — Physical Characteristics, SDZG fact sheet](https://ielc.libguides.com/sdzg/factsheets/lions/characteristics)
- [Bengal tiger — Wikipedia](https://en.wikipedia.org/wiki/Bengal_tiger)
- [Bengal Tiger — Dimensions.com](https://www.dimensions.com/element/bengal-tiger)
- [African bush elephant — Wikipedia](https://en.wikipedia.org/wiki/African_bush_elephant)
- [African Elephants — Physical Characteristics, SDZG fact sheet](https://ielc.libguides.com/sdzg/factsheets/african_elephant/characteristics)
- [Giraffe — San Diego Zoo](https://animals.sandiegozoo.org/animals/giraffe)
- [Giraffes — Physical Characteristics, SDZG fact sheet](https://ielc.libguides.com/sdzg/factsheets/giraffes/characteristics)
- [10 Amazing Facts About Giraffes — Wilderness Destinations](https://www.wildernessdestinations.com/journal/wildlife/10-amazing-facts-about-giraffes)
- [Plains Zebra — World Land Trust](https://www.worldlandtrust.org/species/plains-zebra/)
- [Plains Zebra — Physical Characteristics, SDZG fact sheet](https://ielc.libguides.com/sdzg/factsheets/plains_zebra/characteristics)
- [Chimpanzee — Animal Fun Facts](https://www.animalfunfacts.net/primates/71-chimpanzee.html)
- [Capuchin Monkey — Animal Fun Facts](https://www.animalfunfacts.net/primates/1586-capuchin-monkey.html)
- [Silverback Gorilla Size Comparison — Go Silverback Safaris](https://www.gosilverbacksafaris.com/silverback-gorilla-size-comparison/)
- [How do gorillas walk? — Berggorilla & Regenwald Direkthilfe](https://www.berggorilla.org/en/gorillas/general/facts/how-do-gorillas-walk-and-can-they-walk-upright/)
- [Emperor penguin — Wikipedia](https://en.wikipedia.org/wiki/Emperor_penguin)
- [Bear Size Comparison — A-Z Animals](https://a-z-animals.com/animals/bear/bear-facts/bear-size-comparison-2/)
- [Pandas vs Grizzlies — PDXWildlife](https://www.pdxwildlife.com/pandas-vs-grizzlies/)
- [Hippopotamus — Wikipedia](https://en.wikipedia.org/wiki/Hippopotamus)
- [Hippo Fact Sheet — PBS Nature](https://www.pbs.org/wnet/nature/blog/hippo-fact-sheet/)
- [Red kangaroo — Wikipedia](https://en.wikipedia.org/wiki/Red_kangaroo)
- [Red Kangaroo — Physical Characteristics, SDZG fact sheet](https://ielc.libguides.com/sdzg/factsheets/redkangaroo/characteristics)
- Repo grounding (not web): `src/three-renderer.ts` `_buildQuadruped`
  (cat/dog quadruped rig, `PET_KINDS`), `SPECS`/`_buildHumanoid`'s
  `cartoon_duck` kind branch, `_addAvatarAccessories`, `EAR_SKIP` set,
  `AVATAR_PERSONALITY`/`AVATAR_BUBBLES` tables; `docs/avatars/base/
  farm-animals.md` for the adopted proposed quadruped schema and its own
  Rig gaps list, which this doc extends rather than repeats where possible.
