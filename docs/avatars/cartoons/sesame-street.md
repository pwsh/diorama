# Avatar pack: Sesame Street

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no printed names, no felt/fabric texture maps; character identity lives only
in this doc's Reference lines and the pack's display labels.

## Overview

- **Group**: the core Muppet cast of *Sesame Street* — the long-running
  children's television program built around a "street" of puppet
  neighbors. Puppetry rather than traditional/CG animation, but per the
  taxonomy's tiebreak order (no dedicated puppet category exists, and every
  member here is a fantastical non-human character design, the same
  reasoning `toy-story`'s toy-product cast already applies), this pack sits
  under **Cartoons** — the closest existing branch, and where the task
  brief places it.
- **Hierarchy path**: `cartoons / sesame-street`
- **Member count**: 11. **Rig mix**: 10 humanoid (one, `oscar-grouch`,
  `sessile`), 1 quadruped (`snuffleupagus`).
- **Member selection**: of the thirteen candidates surveyed (Big Bird, Elmo,
  Cookie Monster, Bert, Ernie, Oscar the Grouch, Grover, Count von Count,
  Abby Cadabby, Rosita, Telly Monster, Snuffleupagus, Zoe), eleven made the
  cut as the primary, casual-fan-names-first cast. **Abby Cadabby** (a
  newer, 2006-era addition) and **Telly Monster** were cut — both are
  genuinely recognizable but sit a tier below the other eleven in
  decades-long cultural weight, and neither adds a silhouette family this
  roster doesn't already cover (fairy-in-training pink/purple is adjacent
  to the pack's existing pink accents on `zoe`'s tutu and `rosita`'s warm
  palette; Telly's plain magenta monster body doesn't carry a
  strong enough signature prop the way every kept member does).
- **No shared base spec.** Like `toy-story`, every member here is a
  different "species" of Muppet by design — bird, small monster, elongated
  human-adjacent puppet, rooted trash-can grouch, vampire, quadruped — and
  forcing a shared base would fight that heterogeneity. The unifying thread
  is a few **reused techniques**, documented once and cited per member:
  - **Fixed, non-tint coloring** (like `mario`/`toy-story`): every member's
    body color IS their identity — a tint-shifted purple Big Bird would
    defeat the whole point of an instantly-recognizable street.
  - **`'dots'` eyes double as "googly eyes" for free.** The rig's default
    `dots` eye style — a white-sclera sphere with a proud dark iris/pupil —
    already reads as classic Muppet googly eyes with zero extra work; every
    monster member in this pack uses the plain default rather than any
    bespoke eye accessory.
  - **The Phase 4a `pattern` scatter** stands in for shaggy/mottled fur
    texture (`big-bird`'s feather dapples, `snuffleupagus`'s shaggy coat) —
    the same technique this doc set's `sci-fi/fallout-tv.md` sibling uses
    for irradiated skin blotches, cited as a reused idiom, not re-derived.
  - **`sessile: true`** gets its first "puppet-in-a-fixed-prop" use case:
    `oscar-grouch` is rooted in his trash can exactly the way the rig's
    `sessile` flag was built for (see Members below) — a clean, no-gap fit.

## Members

### big-bird
**Label**: Tall Yellow Bird (long orange legs)
**Reference**: Big Bird, an 8'2" bright golden-yellow bird character — gentle,
childlike, endlessly curious. Long thin orange legs, big three-toed orange
feet, small wing-like arms, a crest of head feathers, round eyes, and a small
orange cone beak.

**Spec**
```ts
'big-bird': {
  sk: 1.35, headR: 110, headShape: 'sphere', limbR: 0.85,
  skin: 0xf5d020 /* bright yellow */, body: 0xf5d020,
  legColor: 0xe8720a /* orange legs */, shoe: 0xe8720a,
  eyes: 'dots', emI: 0.05, hands: 'sphere',
  armL: 0.75, legL: 1.35, footMul: [1.5, 0.7, 1.6] /* big flat 3-toed feet */,
},
```
`sk: 1.35` follows the same humanoid-oversize convention this doc set already
established for Chewbacca (`sk: 1.32` for a 2.3 m Wookiee) and Bowser
(`sk: 1.35`) — Big Bird's real 8'2"/1.75 m ratio (~1.42) is dialed down
slightly to that same informal pack-scale ceiling.
`pattern: { kind: 'dapples', color: 0xd9b81a, count: 10 }` — subtle
darker-yellow feather texture across the body.

**Accessories**
- **face**: orange cone beak, `0xe8720a`, forward-projecting and larger than the rig's default nose bump.
- **crown**: a fan of small feather-crest cones, `0xf5d020` with a couple `0xe8720a` highlights.
- **head** (×2): small oval cheek-feather tufts for a softer silhouette.

**Silhouette check**: by far the tallest member, solid bright yellow with
long orange stilt-legs and an orange cone beak — unmistakable at 30px, no
competition for "tallest" or "yellowest" in the pack.

**Personality**: `{ bobMul: 1.1, swayMul: 0.9, cadenceMul: 0.85, ampMul: 1.1 }` (gentle, gangly, long-legged lope — a big kid's amble)
**Bubbles**: `['🐦', '🎨', '😊', '🖍️']`

---

### elmo
**Label**: Small Red Monster (giggly, big nose)
**Reference**: Elmo, a small, giggly, red 3½-year-old monster with a
high-pitched voice, a round orange ball nose, and a habit of speaking about
himself in the third person.

**Spec**
```ts
elmo: {
  sk: 0.55 /* small/childlike */, headR: 130 /* big head-to-body ratio */,
  headShape: 'sphere', limbR: 0.75,
  skin: 0xd41f1f /* red fur */, body: 0xd41f1f, legColor: 0xd41f1f, shoe: 0xd41f1f,
  eyes: 'dots', emI: 0.02, hands: 'sphere', armL: 0.7, legL: 0.65,
},
```

**Accessories**
- **face**: big orange ball nose, sphere, `0xf07d1a` — noticeably larger than the default nose bump. No `crown` accessory — bald monster fur head.

**Silhouette check**: the smallest, all-red member with a round orange nose
— unmistakable, no other member is this small or this red.

**Personality**: `{ bobMul: 1.5, swayMul: 1.3, cadenceMul: 1.4, ampMul: 0.5 }` (bouncy, giggly, tiny excited steps)
**Bubbles**: `['😂', '❤️', '🎈', '🤗']`

---

### cookie-monster
**Label**: Shaggy Blue Monster (huge eyes, big mouth)
**Reference**: Cookie Monster, a large shaggy blue monster defined by huge
googly eyes and an insatiable cookie obsession — blue fur all over, no
separate visible nose, a big expressive mouth.

**Spec**
```ts
'cookie-monster': {
  sk: 1.1, headR: 150 /* huge head */, headShape: 'sphere', limbR: 1.15,
  skin: 0x2f6fd1 /* blue fur */, body: 0x2f6fd1, legColor: 0x2f6fd1, shoe: 0x2f6fd1,
  eyes: 'dots', emI: 0.02, hands: 'sphere', noFace: true /* skip the small
    default nose/mouth/brows — his giant mouth is built as a bespoke face
    accessory instead, see below */,
},
```

**Accessories**
- **face**: a wide, dark, rounded-box "big mouth" shape, `0x1a1a1a`, across the lower face — reads as his signature huge open maw far better than the rig's default thin smile line would.
- **head** (×3–4): shaggy fur tufts sticking out unevenly, small cones, `0x2f6fd1`/`0x4a86e0` for a messier silhouette.

**Silhouette check**: a huge blue shaggy head with giant googly eyes and a
big dark mouth is unmistakable — the biggest head in the pack after Big
Bird's overall height.

**Personality**: `{ bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.1, ampMul: 1.2 }` (voracious, exuberant, slightly chaotic energy)
**Bubbles**: `['🍪', '😋', '🤪', '🎉']`

---

### bert
**Label**: Tall Oval-Head Roommate (unibrow, striped shirt)
**Reference**: Bert — Ernie's uptight, orderly roommate. Yellow skin, an
elongated oval/football-shaped head, a single thick unibrow, black hair swept
up in a wave-like tuft, a narrow vertically-striped shirt, and green pants.

**Spec**
```ts
bert: {
  sk: 1.0, headR: 120, headShape: 'oval' /* his signature elongated head */,
  limbR: 0.8 /* narrow build */, skin: 0xe8c840 /* yellow */,
  body: 0xd8821a /* orange shirt base, striped via pattern below */,
  legColor: 0x3f8a3f /* green pants */, shoe: 0x3a3a3a,
  eyes: 'dots', emI: 0.02, hands: 'sphere', armL: 0.85,
},
```
`pattern: { kind: 'stripes', color: 0x2f5fae, count: 6 }` — vertical blue
stripes over the orange shirt base, approximating the orange/blue/green
striped shirt.

**Accessories**
- **face**: thick dark unibrow, a single wide box spanning both brow positions, `0x1a1a1a` — wider than the rig default single-side brow.
- **crown**: the swept-up black hair wave, a tall curved cone tilted forward, `0x1a1a1a`.
- **face** (second): an orange nose-cone bump, slightly bigger than default, `0xd8821a`.

**Silhouette check**: the elongated oval head, thick single unibrow, and
tall black hair wave are unmistakable — no other member has a non-spherical
head or a unibrow.

**Personality**: `{ bobMul: 0.7, swayMul: 0.4, cadenceMul: 0.85, ampMul: 0.6 }` (fussy, orderly, stiff-postured walk)
**Bubbles**: `['🕊️', '📎', '😤', '📋']`

---

### ernie
**Label**: Round-Head Roommate (rubber duck)
**Reference**: Ernie — Bert's cheerful, mischievous roommate. Orange skin, a
wider round head, no visible eyebrows, a red-and-white horizontally-striped
shirt, constant laughter, and his beloved Rubber Duckie.

**Spec**
```ts
ernie: {
  sk: 0.95, headR: 132 /* wider head than Bert's */, headShape: 'sphere',
  limbR: 0.95, skin: 0xe8821a /* orange */,
  body: 0xd21f1a /* red shirt base, striped via pattern below */,
  legColor: 0x3a5aa8 /* blue trousers */, shoe: 0x3a3a3a,
  eyes: 'dots', emI: 0.02, hands: 'sphere',
},
```
`pattern: { kind: 'stripes', color: 0xf0ece0, count: 6 }` — white stripes
over the red base; the pattern generator runs **vertical** bands only, so
this is an accepted approximation of Ernie's canonically **horizontal**
stripes — see Rig gaps.

**Accessories**
- **crown**: short tufted dark hair. No brow accessory at all — his bare-brow read (vs. Bert's unibrow) is the point.
- **hand**: Rubber Duckie prop, a small yellow sphere with a tiny orange cone beak, `0xf5d020`/`0xe8720a`, held in one hand.

**Silhouette check**: a wide round orange head with no eyebrows, a red/white
shirt, and a yellow rubber duck in hand reads instantly as Ernie —
distinguished from Bert by build, head shape, and the duck prop.

**Personality**: `{ bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.0 }` (jovial, easy, prank-ready bounce)
**Bubbles**: `['🛁', '🦆', '😄', '🎶']`

---

### oscar-grouch
**Label**: Grouch in a Trash Can (green, rooted)
**Reference**: Oscar the Grouch — a grumpy green Muppet who lives inside a
battered metal trash can on Sesame Street, famously hates anything nice, and
has no visible legs (only torso/head above the can rim).

**Spec**
```ts
'oscar-grouch': {
  sessile: true /* rooted in the can — no legs built, no gait, idle sway
    only; the textbook use case this flag was authored for */,
  sk: 1.0, headR: 130, headShape: 'sphere', limbR: 0.95, armL: 0.9,
  skin: 0x4a8a3f /* green fur */, body: 0x4a8a3f,
  eyes: 'dots', emI: 0.0, hands: 'sphere',
},
```

**Accessories**
- **root**: the trash can body — a large dented grey-silver cylinder, `0x8a8a86`, wrapping from the floor to roughly chest height, with a darker rim band (`0x5a5a5a`) and a couple of small dent/scuff boxes.
- **root** (second): the lid, propped open at an angle behind the can, a flat disc, `0x707070`.
- **head**: bushy, unkempt dark-green eyebrow tufts — thicker/messier than the rig's default brow, `0x2f5a28`.

**Silhouette check**: a grumpy green head/torso poking out of a battered
grey trash can with no legs at all is utterly unique in this pack — the
only sessile member, instantly "the grouch in the can."

**Personality**: `{ bobMul: 0.3, swayMul: 0.5, cadenceMul: 0, ampMul: 0 }` (rooted — no locomotion at all, only idle arm/head sway per the sessile spec)
**Bubbles**: `['😠', '🗑️', '👎', '😤']`

---

### grover
**Label**: Furry Blue Monster (round nose, cape flash)
**Reference**: Grover — a friendly, excitable, accident-prone blue monster,
lighter blue than Cookie Monster, with a soft round nose and famously loose,
floppy limbs. Occasionally dons a small red cape/helmet as the bumbling
superhero alter ego "Super Grover."

**Spec**
```ts
grover: {
  sk: 0.9, headR: 126, headShape: 'sphere', limbR: 0.85,
  skin: 0x3f9ad1 /* lighter blue than cookie-monster */, body: 0x3f9ad1,
  legColor: 0x3f9ad1, shoe: 0x3f9ad1,
  eyes: 'dots', emI: 0.02, hands: 'sphere',
  armL: 1.05 /* loose, noodle-limbed read */,
},
```

**Accessories**
- **face**: a round soft nose bump, sphere, slightly lighter blue `0x6ab8e0`.
- **back**: a small red cape, flattened cone, `0xc0392b` — a deliberate nod to the "Super Grover" alter ego, kept on by default as an accent-color flash against the otherwise monochrome blue body rather than modeled as a separate member.

**Silhouette check**: a mid-blue furry monster with a soft round nose and a
small red cape flash is distinct from Cookie Monster's darker blue bulk and
Rosita's turquoise — the cape alone confirms the ID up close.

**Personality**: `{ bobMul: 1.2, swayMul: 1.3, cadenceMul: 1.05, ampMul: 1.0 }` (eager, klutzy, over-enthusiastic near-stumble energy)
**Bubbles**: `['🦸', '😅', '🐾', '💙']`

---

### count-von-count
**Label**: Vampire Count (purple, cape, monocle)
**Reference**: Count von Count — a Dracula-styled vampire count obsessed
with counting everything, his counting punctuated by thunder and lightning.
Purple skin, black widow's-peak hair, a pointed goatee, a formal tuxedo, a
flowing cape, and a monocle.

**Spec**
```ts
'count-von-count': {
  sk: 1.0, headR: 122, headShape: 'sphere', limbR: 0.95,
  skin: 0x8a4fae /* purple */, body: 0x141416 /* black tuxedo */,
  legColor: 0x141416, shoe: 0x0a0a0c,
  eyes: 'dots', emI: 0.05, hands: 'sphere',
},
```

**Accessories**
- **crown**: black widow's-peak hair, a pointed triangular tuft, `0x0a0a0c`.
- **face**: a short pointed goatee cone under the chin, `0x0a0a0c`; plus a thin monocle ring, `0xc7ccd1`, over one eye.
- **chest**: white dress-shirt front + black bow tie, two small flattened boxes, `0xf0ece0`/`0x0a0a0c`.
- **back**: a flowing cape, flattened cone from the shoulders down, deep purple `0x4a1e6b` — reuses the cape technique already established for Vader/Obi-Wan in `sci-fi/star-wars-ot.md`, in a color no other caped member shares.
- **head**: small pointed ear tips, `0x8a4fae`.

**Silhouette check**: purple skin, a black tuxedo, a dramatic purple cape,
and widow's-peak hair together are instantly "the Count" — no other member
is purple or caped.

**Personality**: `{ bobMul: 0.75, swayMul: 0.6, cadenceMul: 0.8, ampMul: 0.8 }` (theatrical, deliberate, a dramatic flourish on every step)
**Bubbles**: `['🔢', '⚡', '🦇', '1️⃣']`

---

### rosita
**Label**: Turquoise Monster (guitar, antennae)
**Reference**: Rosita (Rosita la Monstrua de las Cuevas) — a bilingual
turquoise monster who plays guitar, has two small antennae topped with
fuzzy pom-poms, and is warm, musical, and playful.

**Spec**
```ts
rosita: {
  sk: 0.92, headR: 120, headShape: 'sphere', limbR: 0.85,
  skin: 0x2fb0a8 /* turquoise */, body: 0x2fb0a8, legColor: 0x2fb0a8, shoe: 0x2fb0a8,
  eyes: 'dots', emI: 0.02, hands: 'sphere',
},
```

**Accessories**
- **head** (×2): two thin antenna stalks rising from the crown, each tipped with a small pom-pom sphere, warm yellow `0xf0c020`.
- **chest**: a small guitar-body box slung diagonally across the torso (bandolier-strap technique, cited from `sci-fi/star-wars-ot.md`'s Chewbacca), wood-brown `0x8a5a34` with a lighter sound-hole disc.
- **handR**: a short guitar-neck cylinder extending from the strumming hand, `0x5a3c22`.

**Silhouette check**: turquoise body, twin pom-pom antennae, and a slung
guitar read instantly as the pack's musician — no other member carries an
instrument.

**Personality**: `{ bobMul: 1.1, swayMul: 1.15, cadenceMul: 1.0, ampMul: 1.05 }` (musical, warm, a little sway to her step like she's keeping rhythm)
**Bubbles**: `['🎸', '🎶', '😄', '🌟']`

---

### snuffleupagus
**Label**: Woolly Giant (trunk, floppy ears)
**Reference**: Mr. Snuffleupagus ("Snuffy") — Big Bird's massive, gentle,
shy best friend. A huge shaggy brown mammoth-like creature with a long
trunk-like nose, big floppy ears, and long expressive eyelashes; canonically
the largest creature on the street.

**Spec**
```ts
snuffleupagus: {
  rig: 'quadruped',
  sk: 1.5 /* the pack's largest — kept near the documented oversized-
    creature ceiling; the "huge" read comes from body/leg proportions
    below, not from pushing sk further */,
  bodyLen: 1400 /* huge barrel-and-hump torso, vs. the dog baseline 640 */,
  bodyW: 500, bodyH: 550, legLen: 1.3 /* tall, pillar-like legs */,
  headR: 200, headScale: [1.0, 1.05, 1.15], neckLen: 150,
  ears: 'flap' /* giant elephant-style ear plates — a direct fit for
    Snuffy's big floppy ears */,
  tail: 'down', tailLen: 0.6,
  snout: 1.6 /* elongated protrusion — the trunk accessory below carries
    the actual full-length trunk read */, snoutShape: 'cone',
  coat: 0x8a5a34 /* shaggy brown */, belly: 0xb08a5c,
  earColor: 0x6b4423, snoutColor: 0x8a5a34, pawColor: 0x8a5a34, eyes: 'dot',
},
```
`pattern: { kind: 'dapples', color: 0x6b4423, count: 10 }` — shaggy fur
texture (reused idiom, cited from `sci-fi/fallout-tv.md`'s Ghoul skin use).

**Accessories**
- **qhead**: the trunk — a long tapering cylinder (~350 mm) hanging down from the front of the face, `0x8a5a34`, with `animate: { kind: 'sway', speed: 0.8, amp: 0.2 }` for a gentle idle trunk swing — a clean showcase of the Phase 4b `animate` system on a quadruped anchor.
- **qhead** (×2): long eyelash tufts, thin curved cones above each eye, `0x2a2018` — Snuffy's single most famous small detail.
- **qback**: a shaggy hump/mane ridge, a row of small cone tufts along the spine, `0x6b4423`.

**Silhouette check**: by far the largest, shaggiest, brown silhouette, with
a hanging trunk and giant flap ears — unmistakable, the pack's gentle
giant.

**Personality**: `{ bobMul: 0.5, swayMul: 0.6, cadenceMul: 0.55, ampMul: 0.9 }` (huge, slow, gentle plodding gait — shy and unhurried)
**Bubbles**: `['🐘', '🍝', '😊', '🤫']`

---

### zoe
**Label**: Small Orange Monster (tutu, pet rock)
**Reference**: Zoe — an energetic young orange monster who loves to dance
and sing, often wears a pink tutu, and carries her beloved pet rock, Rocco.

**Spec**
```ts
zoe: {
  sk: 0.7 /* young/small */, headR: 118, headShape: 'sphere', limbR: 0.75,
  skin: 0xe8721a /* orange — distinct from elmo's red */, body: 0xe8721a,
  legColor: 0xe8721a, shoe: 0xe8721a,
  eyes: 'dots', emI: 0.02, hands: 'sphere', armL: 0.8, legL: 0.85,
},
```

**Accessories**
- **crown** (×2): two small fur-tuft "pigtail" puffs on top of the head, `0xe8721a`/`0xf29a4a`.
- **hip**: a pink ballet tutu, a short flared cone, `0xf199c4`.
- **hand**: Rocco the pet rock, a small lumpy grey sphere, `0x8a8a86`, held in one hand.

**Silhouette check**: a small orange monster in a pink tutu holding a
little grey rock is unmistakable — the tutu + rock combo is distinct from
every other member's palette and props.

**Personality**: `{ bobMul: 1.4, swayMul: 1.3, cadenceMul: 1.3, ampMul: 1.1 }` (bouncy, dance-loving, can't-stand-still energy — the liveliest gait in the pack, echoing the `jessie` energy register in the sibling `toy-story` pack)
**Bubbles**: `['💃', '🎵', '🪨', '😆']`

## Rig gaps

1. **No mouth-shape variant (frown/scowl) — new gap.** Every humanoid rig's
   default face carries one fixed slim smile-curve mouth; there's no way to
   flip it into a frown. **Oscar the Grouch** is the character this gap
   bites hardest — his default face reads a touch too pleasant for a
   professional grouch. Worked around here with bushy, messy eyebrow tufts
   to carry the crankiness instead (an established `pattern`-adjacent
   workaround), but a `mouth: 'smile' | 'frown' | 'neutral'` field on
   `HumanoidFields` would close this cleanly for any grumpy/sad character in
   a future pack.
2. **The `stripes` pattern generator only produces VERTICAL bands.** Bert's
   canonical vertical-striped shirt is a perfect fit; **Ernie**'s canonical
   shirt stripes are HORIZONTAL, and there's no orientation parameter on
   `AvatarPattern` to flip it. Approximated here by using the same
   vertical-stripes generator anyway (an accepted color-family approximation
   — the alternating red/white read still carries at pack scale even with
   the wrong stripe direction). A `direction?: 'vertical' | 'horizontal'`
   field on the stripes pattern kind would fix this precisely.
3. **No dedicated wide/open-mouth accessory convention (minor, related to
   #1).** Cookie Monster's giant expressive mouth is approximated with a
   `noFace: true` + a hand-placed dark box on the `face` anchor rather than
   any purpose-built "big mouth" shape. Works fine here, but a documented
   convention (or an actual `mouthShape` enum alongside `eyes`) would help
   any future pack with a character whose mouth, not eyes, carries most of
   the personality — Muppets lean on big expressive mouths far more than
   most avatar franchises this doc set has covered so far.

None of the above blocked shipping any of the eleven members — every one has
a complete, distinguishable spec buildable with the current rig's
primitives, anchors, and enums (including the newer `sessile`, `pattern`,
and `animate` systems, all of which this pack leans on directly rather than
approximating around).

## Sources

- [Bert and Ernie — Wikipedia](https://en.wikipedia.org/wiki/Bert_and_Ernie)
- [Bert — Sesame Street Guide](https://www.sesamestreetguide.com/2020/02/bert-sesame-street-character.html?m=1)
- [Oscar the Grouch — Wikipedia](https://en.wikipedia.org/wiki/Oscar_the_Grouch)
- [Oscar the Grouch — Muppet Wiki (Fandom)](https://muppet.fandom.com/wiki/Oscar_the_Grouch)
- [Grover — Wikipedia](https://en.wikipedia.org/wiki/Grover)
- [Grover — Muppet Wiki (Fandom)](https://muppet.fandom.com/wiki/Grover)
- [Count von Count — Wikipedia](https://en.wikipedia.org/wiki/Count_von_Count)
- [Count von Count — Muppet Wiki (Fandom)](https://muppet.fandom.com/wiki/Count_von_Count)
- [Zoe — Muppet Wiki (Fandom)](https://muppet.fandom.com/wiki/Zoe)
- [Sesame Street Characters — Sesame Workshop](https://sesameworkshop.org/our-work/shows/sesame-street/sesame-street-characters/)
- [Big Bird — Wikipedia](https://en.wikipedia.org/wiki/Big_Bird)
- [Elmo — Wikipedia](https://en.wikipedia.org/wiki/Elmo)
- [Cookie Monster — Wikipedia](https://en.wikipedia.org/wiki/Cookie_Monster)
- [Rosita (Sesame Street) — Wikipedia](https://en.wikipedia.org/wiki/Rosita_(Sesame_Street))
- [Mr. Snuffleupagus — Wikipedia](https://en.wikipedia.org/wiki/Mr._Snuffleupagus)
- [Abby Cadabby — Wikipedia](https://en.wikipedia.org/wiki/Abby_Cadabby) (context for the member-selection cut, above)
- In-repo: `src/avatars.ts` (`sessile`, `pattern`, `animate` fields),
  `docs/avatars/AUTHORING.md`; sibling docs `docs/avatars/cartoons/toy-story.md`
  (no-shared-base heterogeneous-cast precedent, the `jessie` energy-register
  precedent cited for `zoe`), `docs/avatars/sci-fi/star-wars-ot.md`
  (bandolier/cape technique precedent), `docs/avatars/sci-fi/fallout-tv.md`
  (pattern-as-skin-texture precedent).
