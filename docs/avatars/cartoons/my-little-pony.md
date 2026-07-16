# Avatar pack: Cartoons ▸ My Little Pony

Hierarchy path: `docs/avatars/cartoons/my-little-pony.md` → generated pack id
`cartoons/my-little-pony`.

## Overview

A six-member set of stylized, geometric toon-homage figures inspired by the
"mane six" ensemble-cast archetype from a 2010s animated pony franchise —
**not** licensed characters, no likenesses/logos/cutie-mark art. Every member
is built on the **quadruped** rig (`_buildQuadruped` in `three-renderer.ts`,
the same builder that already ships `cat`/`dog`) using only primitive shapes
(box/sphere/cylinder/cone) in flat, saturated pastel colors, per the
Sims-toon house style (`MeshToonMaterial`, 4-step gradient bands, dark
cartoon outlines, green plumbob overhead). Labels are descriptive-generic
("Purple unicorn," "Apple farmer"); the actual character each one homages is
named once in that member's **Reference** line, never in the label or
in-game copy. Cutie marks (the flank symbols) are **deliberately skipped**
per the brief — too small a detail to read at this rig's scale, and there is
no flank-decal system to place one on regardless (see Rig gaps).

**Correcting the record vs. older sibling docs**: `docs/avatars/base/
farm-animals.md` and `docs/avatars/base/zoo-animals.md` were written against
a *proposed* generalized quadruped schema, back when `_buildQuadruped` still
hardcoded everything off a single `isCat` ternary. **That schema has since
shipped**, but under different field names/units than those two docs
guessed at. This doc is written against the **actual, current**
`QuadrupedFields` interface (`src/avatars.ts`) and the real
`_addDeclarativeAccessories` anchor set (`qhead`/`qneck`/`qback`/`qrump`) —
verified directly against `three-renderer.ts._buildQuadruped` /
`_addDeclarativeAccessories` in this repo today, not the older aspirational
tables. Notably: `bodyLen`/`bodyW`/`bodyH`/`headR`/`neckLen` are **absolute
mm at `sk = 1`** (scaled by `sk`, mirroring the dog defaults 640/200/240/132/
0), not multipliers; `legLen`/`snout`/`tailLen` **are** pure multipliers;
`ears` is `'pointy'|'floppy'|'round'|'long'|'none'`; `tail` is
`'up'|'down'|'curl'|'tuft'|'none'`. Quadruped accessory anchors already
exist today (`qhead`/`qneck`/`qback`/`qrump` — head, neck-base, mid-back,
rump), so — unlike the farm/zoo docs — **this pack surfaces no "anchors
don't exist yet" gap at all**.

**Pack-wide base spec** (every member starts here, then overrides —
mirrors `AvatarPackDef.base` merge semantics: `base.quadruped` shallow-merges
under each member's own `quadruped`):
```ts
base: {
  rig: 'quadruped',
  quadruped: {
    sk: 1.35,          // ~680 mm shoulder pivot — comfortably bigger than
                        // the dog baseline (505 mm), pony-sized without
                        // dwarfing the room the way a zoo-pack member would
    bodyLen: 620, bodyW: 230, bodyH: 260,   // mm @ sk=1 — a rounder, more
                        // compact barrel than dog's 640/200/240: chibi-cute,
                        // not horse-realistic
    legLen: 0.9,        // slightly shorter/stockier legs than dog proportion
    headR: 150,         // LARGE relative to body — the single biggest lever
                        // for the show's oversized-head chibi proportions
    neckLen: 50,        // short — just enough to hang a mane off, not a
                        // giraffe-style extended neck
    headScale: [1.08, 1.0, 1.05],   // slightly broad/rounded head volume
    ears: 'pointy',     // small upright horse-like ear (same approximation
                        // zoo-animals.md's zebra/giraffe already accepted —
                        // see Rig gaps for the shape-fidelity note)
    tail: 'none',       // built-in tail DISABLED pack-wide — see the
                        // "two-tone mane/tail" note below and Rig gaps #1
    snout: 0.3,         // short, blunt, gently rounded cartoon muzzle —
                        // much less protrusion than a dog/cat snout
    snoutColor: 0xf0d8c8,   // soft pinkish-cream muzzle, overridden per
                        // member only where the canonical look differs
  },
},
```

**The two-tone mane/tail problem (pack-wide technique, load-bearing)**: a
defining trait of every member in this cast is that mane/tail color is a
**different hue from the coat** (e.g. lavender coat + navy-blue mane, orange
coat + pale-gold mane). But `_buildQuadruped`'s built-in tail always renders
in `bodyMat` — i.e. the **coat** color (`segment(…, bodyMat)` for both tail
segments and the tuft sphere; there is no independent tail-tint field). This
pack works around that gap by setting `tail: 'none'` pack-wide (disabling
the animated, coat-colored built-in tail) and building a **static** custom
tail as a `qrump`-anchored accessory stack instead, in the correct
mane-matching color. The **mane itself was never a rig-native feature to
begin with** (dogs/cats have none) — it is built entirely from `qneck`/
`qhead`/`qback` accessory primitives on every existing quadruped member, so
it already supports arbitrary color; only the tail needed the workaround.
The tradeoff — losing the built-in tail's per-frame idle sway/wag animation
— is flagged as Rig gap #1 (the clean fix is a small, additive `tailColor`
field on `QuadrupedFields`).

**Eyes**: real show ponies have huge, glossy, individually-colored eyes with
visible eyelashes — currently the quadruped rig hardcodes small flat dark
sphere eyes (`HEAD_R * 0.15`, one shared dark material, no per-kind color or
size) with zero customization, unlike the humanoid rig's `eyes` enum
(`dots`/`visor`/`almond`/…). This is the pack's second cross-cutting
limitation — flagged once here and not repeated per member (every member is
affected equally). See Rig gap #2.

**Palette** (all six coats + manes drawn from the source material's
existing, already-fairly-pastel show palette — no further desaturation
needed): lavender-purple + navy-blue mane (unicorn), sky-cyan + rainbow mane
(pegasus), pale-pink + magenta poofy mane (earth pony), orange + pale-gold
mane (earth pony), near-white + deep-purple mane (unicorn), pale-yellow +
pale-pink mane (pegasus) — six coats chosen so no two are within one hue
family of each other.

---

## Members

### purple-unicorn
**Label**: Purple Unicorn (horn, book-smart)
**Reference**: Twilight Sparkle, the studious protagonist of the "mane six"
— a lavender-purple unicorn with a dark navy-blue mane/tail carrying a
magenta and violet streak, a single straight horn, canonically the most
organized/bookish of the group.

**Spec**
```ts
'purple-unicorn': {
  quadruped: {
    coat: 0xcc9cdf, earColor: 0xcc9cdf, snoutColor: 0xdcb8ea,
  },
  accessories: [
    // Horn — THE unicorn identifier.
    { shape: 'cone', size: [26, 150], anchor: 'qhead', pos: [0, 190, -55],
      rot: [-0.35, 0, 0], color: 0xe8d9a0 /* pale ivory-gold */ },
    // Mane — sleek/straight, two-tone streaks over a navy base.
    { shape: 'box', size: [30, 140, 55], anchor: 'qneck', pos: [0, 40, 10],
      color: 0x243870 /* dark navy base */ },
    { shape: 'box', size: [26, 130, 50], anchor: 'qneck', pos: [-18, 10, 60],
      color: 0x243870 },
    { shape: 'box', size: [16, 120, 45], anchor: 'qneck', pos: [-20, 25, 20],
      color: 0xb35fce /* magenta streak */ },
    { shape: 'box', size: [14, 110, 42], anchor: 'qneck', pos: [-22, -5, 75],
      color: 0x8a5fce /* violet streak */ },
    // Tail — static replacement for the disabled built-in tail (see
    // Overview's two-tone-tail note), same navy + streak coloring.
    { shape: 'box', size: [40, 220, 60], anchor: 'qrump', pos: [0, -60, 40],
      rot: [0.5, 0, 0], color: 0x243870 },
    { shape: 'box', size: [22, 160, 40], anchor: 'qrump', pos: [10, -160, 90],
      rot: [0.7, 0, 0], color: 0xb35fce },
  ],
  personality: { bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.05, ampMul: 1.0 },
  bubbles: ['📚', '✨', '🔮', '🤓'],
},
```

**Accessories**
- **qhead**: horn — a single tapering cone, pale ivory-gold `0xe8d9a0`,
  mounted center-forehead and tilted forward ~0.35 rad so it reads as
  growing up-and-out from the brow rather than straight up out of the skull.
- **qneck** (×4): mane — a dark-navy base slab plus a magenta and a violet
  streak layered slightly proud and offset toward one side, echoing the
  canonical straight, sleek mane with its two accent stripes.
- **qrump** (×2): static tail — navy base + one violet streak segment,
  angled down and back from the rump (the `tail: 'none'` workaround).

**Silhouette check**: the horn alone reads "unicorn" at 30px; the lavender
coat against the dark navy mane (rather than a same-hue mane) is the
secondary confirm that this is specifically the bookish one and not a
generic purple pony. Fully buildable today.

**Personality**: `{ bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.05, ampMul: 1.0 }`
— purposeful, measured, a little brisk (always somewhere to be).
**Bubbles**: `['📚', '✨', '🔮', '🤓']`

---

### rainbow-pegasus
**Label**: Rainbow Pegasus (fastest flyer)
**Reference**: Rainbow Dash — a cyan-blue pegasus with a short, spiky,
wind-swept rainbow-striped mane and tail, canonically the most athletic/
competitive of the group and the fastest flyer in the show.

**Spec**
```ts
'rainbow-pegasus': {
  quadruped: {
    coat: 0x9bdbf5, earColor: 0x9bdbf5, snoutColor: 0xcaeefb,
  },
  accessories: [
    // Wings — THE pegasus identifier. Coat-colored (canonical — pony wings
    // are feathered in the body's own coat hue, not a separate color).
    { shape: 'sphere', size: [150, 40, 230], anchor: 'qback',
      pos: [-140, 40, -180], rot: [0.15, -0.35, 0.5], color: 0x9bdbf5 },
    { shape: 'sphere', size: [150, 40, 230], anchor: 'qback',
      pos: [140, 40, -180], rot: [0.15, 0.35, -0.5], color: 0x9bdbf5 },
    // Rainbow mane — short, spiky, 6-stripe order.
    { shape: 'box', size: [26, 90, 40], anchor: 'qneck', pos: [0, 60, 0],
      rot: [0.2, 0, 0], color: 0xec4141 /* red */ },
    { shape: 'box', size: [24, 85, 38], anchor: 'qneck', pos: [-4, 55, 35],
      rot: [0.35, 0, 0], color: 0xf2932e /* orange */ },
    { shape: 'box', size: [22, 80, 36], anchor: 'qneck', pos: [-6, 48, 65],
      rot: [0.5, 0, 0], color: 0xf5df4a /* yellow */ },
    { shape: 'box', size: [20, 75, 34], anchor: 'qneck', pos: [-8, 40, 92],
      rot: [0.6, 0, 0], color: 0x5ecb6e /* green */ },
    { shape: 'box', size: [18, 70, 32], anchor: 'qback', pos: [-10, 60, -20],
      rot: [0.3, 0, 0], color: 0x4fa8e0 /* blue */ },
    { shape: 'box', size: [16, 65, 30], anchor: 'qback', pos: [-12, 50, 10],
      rot: [0.4, 0, 0], color: 0x9a6fd9 /* purple */ },
    // Rainbow tail (static; tail: 'none' workaround), same 6-stripe order.
    { shape: 'box', size: [34, 100, 45], anchor: 'qrump', pos: [0, -50, 30],
      rot: [0.6, 0, 0], color: 0xec4141 },
    { shape: 'box', size: [30, 95, 42], anchor: 'qrump', pos: [8, -110, 55],
      rot: [0.7, 0.1, 0], color: 0xf5df4a },
    { shape: 'box', size: [26, 90, 38], anchor: 'qrump', pos: [14, -165, 75],
      rot: [0.8, 0.15, 0], color: 0x4fa8e0 },
  ],
  personality: { bobMul: 0.9, swayMul: 1.05, cadenceMul: 1.35, ampMul: 1.2 },
  bubbles: ['🌈', '⚡', '😎', '🏆'],
},
```

**Accessories**
- **qback** (×2): wings — flattened ellipsoid "membrane" shapes, swept back
  and angled outward/up from the shoulder blades, coat-cyan (real ponies'
  wings match their coat, conveniently the accurate AND the simple choice).
- **qneck**/**qback** (×6, THE headline accessory): rainbow mane — six
  short, spiky, forward-swept boxes in strict red→orange→yellow→green→
  blue→purple order, each a shade shorter/thinner than the last for a
  wind-blown taper.
- **qrump** (×3): static rainbow tail (the `tail: 'none'` workaround),
  same stripe order, longer and looser than the mane.

**Silhouette check**: wings + a visibly multi-color (not solid-hue) mane
is unmistakable at 30px — no other member in this pack or the existing
`cat`/`dog` kinds has a multi-hue hair mass, so the rainbow stripe read
alone disambiguates this member even in a thumbnail. Fully buildable, though
see Rig gap #3 (no native multi-color-gradient mane primitive — this is 9
hand-placed boxes, the same "pattern accessory" cost the zoo pack's tiger/
zebra stripes already flagged).

**Personality**: `{ bobMul: 0.9, swayMul: 1.05, cadenceMul: 1.35, ampMul: 1.2 }`
— fast, confident, a cocky athletic swagger.
**Bubbles**: `['🌈', '⚡', '😎', '🏆']`

---

### party-pony
**Label**: Party Pony (pink, big bouncy mane)
**Reference**: Pinkie Pie — a pale-pink earth pony (no horn, no wings) with
an extremely poofy, tightly-curled cotton-candy magenta mane and tail,
canonically the group's hyperactive, party-obsessed member with a signature
bouncing gait ("Pinkie bounce").

**Spec**
```ts
'party-pony': {
  quadruped: {
    coat: 0xf5b7d0, earColor: 0xf5b7d0, snoutColor: 0xfbdde9,
  },
  accessories: [
    // Poofy mane — many small overlapping spheres (poodle technique) for
    // a curled/tufted volume instead of the flat streaked-box mane the
    // other members use.
    { shape: 'sphere', size: 55, anchor: 'qneck', pos: [-10, 70, -10],
      color: 0xeb458b },
    { shape: 'sphere', size: 50, anchor: 'qneck', pos: [-40, 55, 20],
      color: 0xeb458b },
    { shape: 'sphere', size: 48, anchor: 'qneck', pos: [-30, 40, 55],
      color: 0xeb458b },
    { shape: 'sphere', size: 45, anchor: 'qneck', pos: [-8, 65, 45],
      color: 0xeb458b },
    { shape: 'sphere', size: 42, anchor: 'qback', pos: [-20, 55, -30],
      color: 0xeb458b },
    // Poofy tail (static; tail: 'none' workaround) — a tight cluster.
    { shape: 'sphere', size: 50, anchor: 'qrump', pos: [0, -20, 60],
      color: 0xeb458b },
    { shape: 'sphere', size: 46, anchor: 'qrump', pos: [16, -35, 90],
      color: 0xeb458b },
    { shape: 'sphere', size: 42, anchor: 'qrump', pos: [-14, -35, 90],
      color: 0xeb458b },
  ],
  personality: { bobMul: 1.6, swayMul: 1.3, cadenceMul: 1.3, ampMul: 1.15 },
  bubbles: ['🎉', '🧁', '🎈', '🥳'],
},
```

**Accessories**
- **qneck**/**qback** (×5): the poofy mane, THE headline accessory —
  overlapping magenta-pink spheres clustered into a tight curled cloud
  rather than flat streaked planes, the one member in this pack that reuses
  the "poodle sphere-cluster" technique instead of the streaked-box mane
  every other pony here uses (a deliberate style break — Pinkie's hair is
  canonically the odd one out among the six).
- **qrump** (×3): poofy tail (the `tail: 'none'` workaround), same tight
  sphere-cluster technique, smaller volume than the mane.

**Silhouette check**: the tight curly poof silhouette (round, cloud-like,
NOT streaked/flat like every other member's hair) reads instantly even
before the bright pink coat registers — the exaggerated `bobMul: 1.6` bounce
(the highest personality value in this pack, per the brief) is the
secondary, motion-based confirm.

**Personality**: `{ bobMul: 1.6, swayMul: 1.3, cadenceMul: 1.3, ampMul: 1.15 }`
— the biggest, bounciest, most exuberant gait in the roster by a wide
margin.
**Bubbles**: `['🎉', '🧁', '🎈', '🥳']`

---

### apple-farmer
**Label**: Apple Farmer (orange, Stetson hat)
**Reference**: Applejack — an orange earth pony (no horn, no wings) with a
pale-gold/blonde mane and tail worn tied back, canonically an honest,
hardworking farmhand who runs her family's apple orchard and always wears
a brown Stetson-style hat.

**Spec**
```ts
'apple-farmer': {
  quadruped: {
    coat: 0xfaba62, earColor: 0xfaba62, snoutColor: 0xfde6c4,
  },
  accessories: [
    // Stetson hat — THE headline accessory.
    { shape: 'cylinder', size: [95, 100, 30], anchor: 'qhead', pos: [0, 175, -25],
      color: 0x8a5a34 /* brown felt */ },
    { shape: 'cylinder', size: [50, 50, 90], anchor: 'qhead', pos: [0, 220, -25],
      color: 0x8a5a34 },
    // Mane — tied back, low ponytail: a compact bound bundle rather than
    // a flowing loose mane.
    { shape: 'box', size: [34, 90, 50], anchor: 'qneck', pos: [-6, 30, 30],
      color: 0xfaf5ab },
    { shape: 'box', size: [24, 130, 34], anchor: 'qneck', pos: [-4, -10, 70],
      rot: [0.4, 0, 0], color: 0xfaf5ab },
    { shape: 'box', size: [14, 24, 34], anchor: 'qneck', pos: [-4, 55, 40],
      color: 0xd94f4f /* hair tie accent */ },
    // Tail (static; tail: 'none' workaround) — also tied off partway down.
    { shape: 'box', size: [40, 200, 55], anchor: 'qrump', pos: [0, -60, 40],
      rot: [0.5, 0, 0], color: 0xfaf5ab },
    { shape: 'box', size: [16, 26, 40], anchor: 'qrump', pos: [8, -90, 80],
      color: 0xd94f4f },
  ],
  personality: { bobMul: 0.8, swayMul: 0.85, cadenceMul: 0.95, ampMul: 1.0 },
  bubbles: ['🍎', '🤠', '🚜', '💪'],
},
```

**Accessories**
- **qhead** (×2): Stetson hat — a wide flat brim disc (short wide cylinder)
  plus a shorter, narrower crown cylinder sitting on top, brown felt
  `0x8a5a34` — a plain farm hat, not a fashion prop.
- **qneck** (×3): mane tied into a practical low bundle rather than left
  flowing, pale gold `0xfaf5ab`, with a small red hair-tie accent — reads
  as "worn back and out of the way," matching a working farmhand's styling.
- **qrump** (×2): static tail (the `tail: 'none'` workaround), same pale
  gold, also tied off partway down to match the mane's practical styling.

**Silhouette check**: the brown Stetson silhouette against orange coat is
instantly readable at 30px and is a shape no other member in this pack
wears — the pale-gold tied-back mane (vs. a loose flowing one) is the
secondary "practical farmhand" confirm.

**Personality**: `{ bobMul: 0.8, swayMul: 0.85, cadenceMul: 0.95, ampMul: 1.0 }`
— sturdy, no-nonsense, an even working trot.
**Bubbles**: `['🍎', '🤠', '🚜', '💪']`

---

### fashion-unicorn
**Label**: Fashion Unicorn (white, elegant curl)
**Reference**: Rarity — a near-white unicorn with a deep-purple, elaborately
styled wavy mane and tail (often finished in a single stylized curl),
canonically the group's fashion-designer/dressmaker, poised and glamorous.

**Spec**
```ts
'fashion-unicorn': {
  quadruped: {
    coat: 0xeaeef0, earColor: 0xeaeef0, snoutColor: 0xf5f7f8,
  },
  accessories: [
    // Horn — same unicorn identifier as purple-unicorn, but slimmer/more
    // tapered for an elegant read.
    { shape: 'cone', size: [20, 145], anchor: 'qhead', pos: [0, 188, -55],
      rot: [-0.3, 0, 0], color: 0xf0e6c8 },
    // Elegant wavy mane — larger, smoother volume lobes than the streaked-
    // box technique, finishing in one stylized curl.
    { shape: 'sphere', size: [50, 65, 70], anchor: 'qneck', pos: [-6, 55, 10],
      color: 0x794897 },
    { shape: 'sphere', size: [46, 58, 62], anchor: 'qneck', pos: [-22, 35, 55],
      color: 0x794897 },
    { shape: 'sphere', size: [40, 32, 32], anchor: 'qneck', pos: [-30, 5, 95],
      rot: [0, 0, 0.9], color: 0x4a1767 /* the finishing curl, darker tone */ },
    // Tail (static; tail: 'none' workaround) — same wavy volume + curl tip.
    { shape: 'sphere', size: [55, 75, 90], anchor: 'qrump', pos: [0, -20, 60],
      color: 0x794897 },
    { shape: 'sphere', size: [36, 30, 30], anchor: 'qrump', pos: [16, -80, 105],
      rot: [0, 0, 0.9], color: 0x4a1767 },
  ],
  personality: { bobMul: 0.7, swayMul: 0.75, cadenceMul: 0.85, ampMul: 0.85 },
  bubbles: ['💎', '✨', '👗', '💅'],
},
```

**Accessories**
- **qhead**: horn — slimmer/more tapered than `purple-unicorn`'s, pale
  ivory `0xf0e6c8`.
- **qneck** (×3): elegant wavy mane using large smooth sphere lobes (not
  streaked boxes) with a single darker-purple curled tip sphere (flattened +
  rotated) — the "one perfect curl" finishing detail this character is
  known for.
- **qrump** (×2): static tail (the `tail: 'none'` workaround), matching
  wavy-lobe + curl-tip technique, deep purple.

**Silhouette check**: the near-white coat is unique in this pack (every
other member has a saturated body color), so the coat alone already
disambiguates this member; the large smooth wavy purple mane volume
(distinct from every other member's streaked or poofy hair) plus the
signature curl-tip confirm "the elegant one."

**Personality**: `{ bobMul: 0.7, swayMul: 0.75, cadenceMul: 0.85, ampMul: 0.85 }`
— poised, minimal bounce, a composed glide.
**Bubbles**: `['💎', '✨', '👗', '💅']`

---

### shy-pegasus
**Label**: Shy Pegasus (pale yellow, gentle)
**Reference**: Fluttershy — a pale-yellow pegasus with a long, straight,
gentle pale-pink mane and tail (worn loose, often partly veiling one eye),
canonically the group's soft-spoken, animal-loving, timid member.

**Spec**
```ts
'shy-pegasus': {
  quadruped: {
    coat: 0xfaf5ab, earColor: 0xfaf5ab, snoutColor: 0xfdfae0,
  },
  accessories: [
    // Wings — smaller/more folded/demure posture than rainbow-pegasus's
    // swept, athletic wings.
    { shape: 'sphere', size: [110, 30, 170], anchor: 'qback',
      pos: [-110, 20, -140], rot: [0.05, -0.2, 0.25], color: 0xfaf5ab },
    { shape: 'sphere', size: [110, 30, 170], anchor: 'qback',
      pos: [110, 20, -140], rot: [0.05, 0.2, -0.25], color: 0xfaf5ab },
    // Long, straight, gentle mane — smooth flowing panels, no spikes/curls,
    // one lock swept forward over the brow toward one eye (the shy "hiding"
    // trait).
    { shape: 'box', size: [26, 160, 45], anchor: 'qneck', pos: [-8, 20, 20],
      color: 0xf3b5cf },
    { shape: 'box', size: [22, 150, 40], anchor: 'qneck', pos: [-24, 5, 55],
      color: 0xf3b5cf },
    { shape: 'box', size: [30, 40, 20], anchor: 'qhead', pos: [10, 60, -70],
      rot: [0.1, 0, 0.15], color: 0xf3b5cf /* forward-swept eye-veiling lock */ },
    // Tail (static; tail: 'none' workaround) — long and straight, matching.
    { shape: 'box', size: [36, 210, 50], anchor: 'qrump', pos: [0, -60, 45],
      rot: [0.45, 0, 0], color: 0xf3b5cf },
  ],
  personality: { bobMul: 0.7, swayMul: 0.6, cadenceMul: 0.75, ampMul: 0.65 },
  bubbles: ['🦋', '🌸', '🐰', '🤫'],
},
```

**Accessories**
- **qback** (×2): wings, smaller and held closer to the body than
  `rainbow-pegasus`'s (a demure, folded posture rather than a swept
  athletic one), coat-pale-yellow.
- **qneck** (×2) + **qhead** (×1): long, straight, gentle pink mane, plus a
  single small forward-swept lock over one side of the face — the
  character's signature "hiding behind her hair" shyness cue.
- **qrump** (×1): static tail (the `tail: 'none'` workaround), long and
  straight, matching the mane.

**Silhouette check**: pale-yellow coat + pale-pink straight mane is a soft,
low-contrast combination unlike any other member's (everyone else pairs a
saturated coat with a contrasting mane) — the forward eye-veiling lock plus
the folded (not swept-back) wing posture is what reads "the shy one"
specifically, distinct from `rainbow-pegasus`'s confident wing pose.

**Personality**: `{ bobMul: 0.7, swayMul: 0.6, cadenceMul: 0.75, ampMul: 0.65 }`
— small, soft, hesitant steps; the quietest gait in the roster.
**Bubbles**: `['🦋', '🌸', '🐰', '🤫']`

---

## Rig gaps

1. **No independent tail/mane tint field on `QuadrupedFields` (the pack's
   biggest, load-bearing gap)**: `_buildQuadruped`'s built-in tail
   (`tseg1`/`tseg2`/tuft) always renders in `bodyMat` — i.e. the **coat**
   color — with no separate tail-tint parameter, unlike the accessory
   system (which accepts any color). Every member in this pack has a mane/
   tail color that **differs** from its coat (the defining two-tone trait
   of the source material), so all six set `tail: 'none'` and rebuild a
   **static** tail via `qrump`-anchored accessories instead — which works,
   but loses the built-in tail's per-frame idle sway/wag animation
   (`_applyQuadPose`'s `h.quadTail` swing). The clean fix is small and
   additive: add an optional `tailColor?: number` to `QuadrupedFields`,
   have `_buildQuadruped` build a second `THREE.Material` for the tail
   segments when it's set (falling back to `bodyMat` when absent, so `cat`/
   `dog` are unaffected), and this whole pack's tails could go back to
   being real, swaying, rig-native tails.
2. **No quadruped eye customization at all (new, pack-wide, affects every
   member equally)**: `_buildQuadruped`'s eyes are two small hardcoded dark
   spheres (`HEAD_R * 0.15`, one shared `dark` material) with no per-kind
   size, color, or shape override — unlike the humanoid rig's `eyes` enum
   (`dots`/`visor`/`almond`/`shades`/…). This franchise's single most
   recognizable shared trait across all six members is huge, glossy,
   individually-colored eyes (each character has her own canonical iris
   hue) with visible lash accents — completely unbuildable today without
   extending the quadruped rig with an eye-color/eye-size field (and
   ideally a small lash accessory anchor, or folding lashes into the
   existing `qhead` accessory anchor as thin angled boxes, which would at
   least be buildable today as a workaround once color/size exist).
3. **No native multi-color / gradient mane-and-tail primitive (inherited
   from the zoo pack's tiger/zebra stripe gap, pushed into hair for the
   first time)**: `rainbow-pegasus`'s six-stripe mane and tail (9 separate
   hand-placed, hand-colored box accessories) is this pack's heaviest
   exercise of "no scatter/pattern authoring path, only a fixed per-instance
   list" — the same underlying gap `zoo-animals.md` flagged for scattered
   coat patterns, now applied to hair instead of skin.
4. **Horn is a plain static cone (new, minor)**: real show unicorn horns
   have a spiral-ridge texture; with no texture/decal system (COLOR + SHAPE
   only, per this rig's house style) a plain tapered cone is the closest
   achievable shape and reads correctly as "a horn" at 30px — flagged as a
   minor fidelity note, not a blocker; a segmented/twisted cone stack would
   be a nice-to-have, not required.
5. **Wing shape is an approximated flattened ellipsoid, not a feathered
   fan (new, minor)**: same class of approximation the zoo pack accepted
   for its elephant's ears — a scaled/flattened sphere reads as "a wing" in
   silhouette but has none of a real feathered pinion's stepped/fanned
   profile. Acceptable at this rig's scale; not blocking either pegasus
   member.
6. **Ear shape is a 4-sided cone approximation, not a rounded equine oval
   (inherited, minor)**: same precedent `zoo-animals.md`'s zebra/giraffe
   already accepted (`ears: 'pointy'` reused for "tall upright horse-like
   ears") — a pony's ear is a softer rounded-tip oval, not a sharp cone.
   Cosmetic only, fully readable at 30px.
7. **No hoof/sock coloring field (new, minor, not used by this pack)**: some
   ponies canonically have slightly different hoof tones (rarely load-
   bearing for these six specifically, so this pack leaves hooves at the
   default coat-matching paw color) — flagged only in case a future pack
   member needs visibly distinct hoof "socks"; would need either a new
   `hoofColor` field or a small `qhoof`-style accessory anchor per leg
   (neither exists today).

None of the above blocked shipping a member — all six have a complete,
distinguishable spec buildable today (with the `tail: 'none'` + static
`qrump` accessory workaround for gap #1, and plain dark eyes per gap #2).

## Sources

- [User blog: The colors of the mane 6 — My Little Pony Friendship is Magic Wiki](https://mlp.fandom.com/wiki/User_blog:AmyRosegirl12/The_colors_of_the_mane_6)
- [Twilight Sparkle — Friendship is Magic Color Guide, MLP Vector Club](https://mlpvector.club/cg/pony/v/1-Twilight-Sparkle)
- [Rainbow Dash — Friendship is Magic Color Guide, MLP Vector Club](https://mlpvector.club/cg/pony)
- [Pinkie Pie — Friendship is Magic Color Guide, MLP Vector Club](https://mlpvector.club/cg/pony)
- [Applejack — Friendship is Magic Color Guide, MLP Vector Club](https://mlpvector.club/cg/pony)
- [Rarity — Friendship is Magic Color Guide, MLP Vector Club](https://mlpvector.club/cg/pony/v/6-Rarity)
- [Fluttershy — Friendship is Magic Color Guide, MLP Vector Club](https://mlpvector.club/cg/pony)
- [Full color-guide list — MLP Vector Club](https://mlpvector.club/cg/pony/full)
- [Mane Six — Wikipedia](https://en.wikipedia.org/wiki/Mane_Six)
- Diorama source reference (verified directly, not inferred): `src/avatars.ts`
  (`QuadrupedFields`, `AvatarPrimitive`, `AvatarDef`, the `cat`/`dog` core
  entries), `src/three-renderer.ts` (`_buildQuadruped`,
  `_addDeclarativeAccessories`'s `qhead`/`qneck`/`qback`/`qrump` anchor
  table, `_applyQuadPose`'s `quadTail` sway guard); sibling docs for format/
  schema precedent and the corrected-record note above:
  `docs/avatars/cartoons/disney-princess.md`, `docs/avatars/base/
  farm-animals.md`, `docs/avatars/base/zoo-animals.md`.
