# Avatar pack: The Legend of Zelda

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no on-model face sculpts, no names printed anywhere in-scene; character
identity lives only in this doc's Reference lines and the pack's display
labels.

## Overview

- **Group**: Hero, royalty, villain, and folk of Hyrule from Nintendo's *The
  Legend of Zelda* series — a bright, saturated, storybook-fantasy palette is
  this pack's throughline (every member reads as a distinct primary/secondary
  hue at a glance: green, pink, black/red, leaf-green, white, rock-orange,
  aqua-blue).
- **Hierarchy path**: `video-games / zelda`
- **Member count**: 7
- **Rig**: humanoid only. Two members (`farm-cucco`) are **bipeds built on
  the humanoid rig** exactly like the existing `cartoon_duck` kind and the
  proposed `chicken`/`rooster` entries in `docs/avatars/base/farm-animals.md`
  (short legs, stubby wing-arms via `armL`, a beak instead of hands/mouth) —
  no quadruped machinery involved anywhere in this pack. Every other member
  is a straightforward biped humanoid despite non-human races (Goron, Zora)
  — their species read comes entirely from color + accessory silhouette, the
  same technique the base `aliens.md` pack already establishes.
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
- **Shared palette — Hyrule's signature hues**:
  - Kokiri/hero green — `0x2e7a34` (Link's tunic; saturated toon forest
    green, not olive/muted)
  - Royal pink — `0xe85d9c` (Zelda's dress)
  - Hyrule gold — `0xd4af37` (royal trim, tiaras, the Triforce, jewelry —
    used sparingly as accessory accents, never a whole-body fill)
  - Gerudo dark bronze — `0x7a4a2a` (Ganondorf's skin)
  - Villain black — `0x181818` (Ganondorf's armor)
  - Deep forest leaf — `0x4c8c3c` (Korok mask, saturated but distinct from
    the hero-green tunic so the two don't read as recolors)
  - Barnyard white — `0xf5f2ea` (Cucco plumage)
  - Death Mountain rock — `0xa0623a` (Goron hide)
  - Zora's Domain blue — `0x2f7da0` (Zora skin)
  - Danger/alert red — `0xc23030` (comb/wattle, gems, emblems, tusks'
    root-blush — used as a small accent on multiple members, never a base
    fill, so it doesn't compete with any one character's identity color)
- **Pack-wide convention — pointed ears**: three members (Link, Zelda,
  Ganondorf — all Hylian/Gerudo) share the series' signature long pointed
  ears. Approximated the same way the base `aliens.md` pack handles
  non-round ears: a pair of small elongated cone accessories at the `head`
  anchor (skin-colored, angled up and slightly back, ~35–45° from
  horizontal), replacing the rig's default rounded ear treatment. Sized to
  the member's own skin tone each time rather than factored into a single
  shared spec, since Ganondorf's are notably larger/coarser than Link's or
  Zelda's.

## Members

### 1. `hylian-hero` — "Hero (green tunic, pointed cap)"

**Reference**: The series' recurring silent protagonist — a young elf-eared
adventurer in a green sleeveless tunic over a long-sleeved undershirt, tan
leggings, brown boots, and a signature floppy-pointed green cap; carries a
sword and shield slung on his back. Fair-skinned, blond, blue-eyed. (Link.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
limbR: 1.0
skin: 0xe8b892        // fair skin
body: 0x2e7a34        // green tunic
legColor: 0xdbc9a0    // tan leggings
shoe: 0x5c3a21        // brown boots
eyes: 'almond'         // alert, expressive hero eyes
emI: 0
hands: 'sphere'
steel: false
armL: 1.0
legL: 1.0
```

**Accessories**
- **crown** — the pointed cap: a tall soft cone, ~110×170×110 mm,
  `0x2e7a34` (tunic-matched green), tip flopped slightly to one side; per
  the CLAUDE.md hat rule the cone's rim is raised + tilted back
  (`rotation.x`) so the front edge clears the eye band instead of draping
  to brow level.
- **head** (×2) — pointed Hylian ears: slim elongated cones, ~18×55×18 mm
  each, skin-toned `0xe8b892`, anchored at the head sides and angled up
  ~40° from horizontal (per the pack-wide pointed-ear convention).
- **head** (small hair tufts) — a few short blond wisps peeking from under
  the cap at the nape: small flattened boxes, ~40×20×20 mm, `0xf0d060`,
  at the back-of-head anchor.
- **chest** — brown belt with a gold buckle: a thin band across the
  tunic's hem line, ~body-width×24×8 mm, `0x5c3a21`, with a small gold
  buckle square (~26×26×8 mm, `0xd4af37`) centered on it.
- **back** — sword + shield: a tall rounded shield (a flattened, slightly
  domed box or disc, ~180×220×20 mm) blue `0x1e4fa0` with a small red
  bird-crest accent (~50×40×4 mm, `0xc23030`) and a thin gold rim
  (`0xd4af37`); crossed by the sword — a slim cylinder blade
  ~24×340×24 mm silver `0xd6d6da` with a gold cross-guard
  (~90×16×16 mm, `0xd4af37`) and a blue hilt cap — both mounted flat
  against the `back` anchor, sword hilt-up over the shield.

**Silhouette check**: the pointed green cap + green tunic silhouette,
topped by the sword-and-shield cross-shape on the back, is instantly
"Link" even as a flat green blob at 30px — no other member in this or any
shipped pack combines a peaked cap with a back-mounted weapon-and-shield
pair.

**Personality**: `bobMul: 1.0, swayMul: 0.7, cadenceMul: 1.0, ampMul: 1.0`
(a confident, upright adventurer's stride — energetic default with no
exaggeration either way)
**Bubbles**: `🗡️🛡️🧭❤️` (sword, shield, exploration/compass, hearts/courage)

---

### 2. `hyrule-princess` — "Princess (pink & gold dress, tiara)"

**Reference**: The kingdom's princess and bearer of a piece of the sacred
Triforce — a fair-skinned, blonde, blue-eyed young Hylian woman in a
flowing pink medieval-style gown trimmed in gold, wearing gold jewelry and
a tiara set with a red gem; the Triforce motif recurs on her dress and
regalia. Pointed Hylian ears like Link's. (Princess Zelda.)

**Spec**
```
sk: 0.95
headR: 122
headShape: 'sphere'
limbR: 0.9
skin: 0xecc4a0        // fair skin, slightly warmer/lighter than Link's
body: 0xe85d9c        // pink gown bodice
legColor: 0xe85d9c    // full-length gown covers the legs entirely — same pink, no visible leg break
shoe: 0xd4af37         // gold slippers, barely visible under the hem
eyes: 'almond'
emI: 0
hands: 'sphere'
steel: false
armL: 0.95
legL: 1.0
```

**Accessories**
- **head** (×2) — pointed ears, slim cones ~16×48×16 mm, `0xecc4a0`,
  same convention as Link's but slightly smaller/more delicate.
- **head** (×2, long hair) — flowing blonde hair down each side of the
  head to shoulder height: two tapered boxes, ~50×220×40 mm, `0xf0d060`,
  anchored at the head sides, hanging straight down.
- **back** — hair continuing down the back: a wider tapered box,
  ~140×260×30 mm, `0xf0d060`, cascading from the crown down between the
  shoulder blades.
- **crown** — the tiara: a thin gold band, ~130×24×110 mm (arc-shaped, or
  approximated as a shallow curved box), `0xd4af37`, sitting low across
  the forehead (NOT a tall dome — this must clear the eye band by sitting
  at brow height, not above it, unlike the taller cap/helm accessories in
  other packs), with a small red gem cabochon (~20×20×14 mm, `0xc23030`)
  centered above the brow.
- **chest** — a small gold Triforce emblem: three tiny stacked triangular
  segments (approximated as 3 small flattened tetra-ish boxes or cones,
  ~16 mm each), `0xd4af37`, centered on the bodice below the collar.
- **hip** — a gold rope-belt/sash accent at the waist seam, thin band
  ~body-width×18×6 mm, `0xd4af37`.

**Silhouette check**: the pink full-length gown + low gold tiara with its
single red gem is unmistakable — the only all-pink member in the pack, and
the only one wearing a floor-length dress silhouette (no visible leg
break) rather than tunic/armor/bare-skin proportions.

**Personality**: `bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.7`
(composed, graceful, deliberately unhurried royal bearing)
**Bubbles**: `✨👑📜🙏` (sacred magic, royalty, ancient prophecy/lore,
blessing/prayer)

---

### 3. `demon-king` — "Demon King (dark bronze skin, red hair, boar tusks)"

**Reference**: The towering, dark-skinned, red-haired king of the Gerudo
and the series' recurring antagonist — physically imposing and clad in
black-and-gold armor with a flowing dark cape in his humanoid form; wields
the Triforce of Power and, at his most monstrous, transforms into a giant
tusked boar-demon. This spec renders his armored humanoid form with boar
motifs (tusks, a boar-hide cape trim) worked in as his signature "pig
villain" tell. (Ganondorf / Ganon.)

**Spec**
```
sk: 1.3               // notably larger/broader than every other member — "big" is load-bearing to the read
headR: 148
headShape: 'sphere'
limbR: 1.25
skin: 0x7a4a2a        // dark Gerudo bronze skin
body: 0x181818        // black plate armor, chest/torso
legColor: 0x181818    // black armored legs
shoe: 0x181818         // black armored boots, gold-tipped (see accessory)
eyes: 'halfred'        // heavy-lidded, glowing red-tinged villain eyes
emI: 0.15
steel: true            // armor plating reads with a metallic sheen
hands: 'box'            // gauntleted hands
armL: 1.15
legL: 1.05
```

**Accessories**
- **head** (×2) — pointed Gerudo ears: larger, coarser cones than Link's
  or Zelda's, ~24×65×24 mm, `0x7a4a2a`, angled up ~35°.
- **crown** — thick red hair swept back: a wide flame-like sculpted mass
  (2–3 stacked/overlapping cones or a tapered box), ~160×140×120 mm,
  `0xb33d1e`, sitting high and back off the crown of the head.
  **Must clear the eye band** per the standard hat/hair rule — kept high
  and back rather than draping forward.
  raised + tilted back per the standard hat/hair rule.
- **face** (×2, tusks) — pale curved boar tusks jutting up from the lower
  jaw at the mouth corners: small curved cones, ~16×45×16 mm,
  `0xe8dfc8`, pointing forward-and-up — the pack's single most important
  "pig villain" tell.
- **chest** (×2, pauldron approximation, per the shoulder-anchor gap
  documented in other packs) — heavy black pauldrons, ~85×65×60 mm each,
  `0x181818`, trimmed along the top edge with a thin gold band
  (~85×10×10 mm, `0xd4af37`).
- **chest** — a gold Gerudo crescent-and-jewel emblem, a small flattened
  disc/crescent ~50×50×8 mm, `0xd4af37` with a central red gem accent
  (~16×16×8 mm, `0xc23030`), centered on the breastplate.
- **back** — a heavy dark red cape: a tall tapered cone/flattened
  cylinder, ~420 mm wide at the shoulders narrowing to ~360 mm at the hem,
  ~560 mm long, deep red `0x5c1010`, with a coarse dark boar-hide-textured
  trim strip along the hem (a thin darker box, `0x2a1010`) — the boar-hide
  trim is this cape's tie-in to the "pig" motif, distinct from any other
  caped member elsewhere in the avatar library.
- **hand** (gold-tipped boots) — small gold conical accents at each boot
  toe, ~20×20×20 mm, `0xd4af37` (anchor note: modeled as a `hip`- or
  `hand`-adjacent small accessory pair near the feet if the generator
  lacks a foot anchor; otherwise fold into `shoe` as a two-tone paint).

**Silhouette check**: the sheer bulk (`sk 1.3`, the largest scale in the
pack), black-and-gold armor, upswept red hair mass, and forward-curving
white tusks together are unmistakable even in silhouette — no other
member is this large, this dark, or has any tusks at all.

**Personality**: `bobMul: 0.5, swayMul: 0.3, cadenceMul: 0.6, ampMul: 0.9`
(slow, heavy, deliberate — a powerful figure who never needs to hurry)
**Bubbles**: `😈🔥🐗⚡` (menace/dark laughter, destructive power, boar/
beast nature, dark magic)

---

### 4. `forest-korok` — "Forest companion (wood body, leaf mask)"

**Reference**: A small, shy wooden forest spirit found throughout Hyrule's
woodlands, dwelling near and serving the Great Deku Tree — a stubby
sapling-like wooden body with twig-thin limbs, its face entirely hidden
behind a leaf-shaped mask with simple eye and mouth holes; personalities
and mask shapes vary korok to korok. (Korok.)

**Spec**
```
sk: 0.4               // small — a sapling, not an adult
headR: 78
headShape: 'box'       // a squarish wood-chunk head reads better than a smooth sphere for bark
limbR: 0.55             // deliberately thin twig limbs
skin: 0x8a6034         // bark-brown "skin"
body: 0x8a6034         // matching wood-brown trunk-body
legColor: 0x6e4c28     // slightly darker lower-trunk/root tone
shoe: 0x5a3d20          // small root-like feet
eyes: 'dots'            // largely irrelevant — hidden behind the mask, see Rig gaps
emI: 0
hands: 'sphere'         // small round twig-hands
steel: false
armL: 0.75
legL: 0.7
footMul: [0.9, 0.8, 0.9]
```

**Accessories**
- **face** — the leaf mask: a large flattened, gently domed disc/cone
  covering nearly the entire face, ~130×130×20 mm, saturated leaf-green
  `0x4c8c3c` with a slightly darker vein line down the center (a thin
  raised strip, `0x3a6e2c`) and two small dark eye-holes + one mouth-hole
  (small dark dot recesses, `0x201810`) — the mask is this character's
  ENTIRE face; no separate eyes/brow/nose/smile should render underneath
  it (see Rig gaps — this needs the same face-skip treatment robot/ninja
  kinds already get).
- **crown** — a small leafy sprout tuft at the very top of the head,
  above the mask: 2–3 small tapered cones, ~20×40×20 mm, `0x5cab48`
  (a brighter spring green than the mask), fanned slightly outward.
- **head** (×2) — small twig-stub "ears"/branch nubs at the head sides,
  short thin cylinders ~10×30×10 mm, `0x6e4c28`.
- **back** — a couple of small knot/bark-ring texture accents, flattened
  dark ovals ~30×40×6 mm, `0x6e4c28`, proud of the torso surface (avoids
  the coincident-face hatching gotcha).

**Silhouette check**: the small stubby wood-brown body topped by a
disproportionately large flat green leaf-mask is immediately readable even
at 30px, and unlike every other member here has NO visible eyes/brow/nose
— the mask silhouette alone is the entire face read. Flagged as a rig gap
below since the standard rig always builds visible facial features.

**Personality**: `bobMul: 1.4, swayMul: 1.1, cadenceMul: 1.2, ampMul: 0.7`
(a light, bouncy, curious little hop-step — small quick strides, playful)
**Bubbles**: `🌰🍃🌳❓` (acorn/seed, leaf, tree/forest, shy curiosity)

---

### 5. `farm-cucco` — "Farm chicken (Cucco, white, red comb)"

**Reference**: The recurring barnyard chicken found throughout Hyrule's
villages, ranches, and castles — ordinary white plumage with a red comb
and wattle, short yellow legs, entirely unremarkable UNTIL provoked, at
which point it (and every other Cucco in earshot) turns furiously,
disproportionately violent on the offender. **Biped**, built on the
existing humanoid rig exactly like `cartoon_duck` and the base pack's
proposed `chicken`/`rooster` — no quadruped machinery involved. (Cucco.)

**Spec**
```
sk: 0.5
headR: 92
headShape: 'sphere'
limbR: 0.75
skin: 0xf5f2ea        // white plumage body
body: 0xf5f2ea
shoe: 0xe0a020          // yellow legs
emI: 0
hands: 'sphere'          // wing stubs, duck-style stubby-arm treatment
eyes: 'dots'
steel: false
armL: 0.55               // short wing stubs
footMul: [1.3, 0.6, 1.15]
legColor: 0xe0a020
```

**Accessories** (bespoke bird kind-block, same technique as `cartoon_duck`'s
bill — not the generic bolt-on list)
- **face** — short triangular yellow-orange beak, ⌀38×50 mm, `0xe0a020`,
  point forward (−Z), replacing hands/mouth at the face anchor.
- **crown** — a small red comb: 3 small serrated bumps (flattened cones),
  `0xc23030`, front-to-back along the head crest.
- **face** (chin, below beak) — a small red wattle teardrop,
  `0xc23030`, hanging just under the beak.

**Silhouette check**: at 30px the primary read is simply "small white
bird" — the short rounded white body + upright stance + yellow legs;
the red comb/wattle confirms "chicken" only up close, same soft-gap
category the base farm-animals doc already flags for its own chicken.
The all-white plumage (vs. the base pack's rust-brown hen, kept distinct
on purpose) is this member's one differentiator from a generic barnyard
hen — worth calling out if both packs are ever loaded together.

**Personality**: `bobMul: 1.4, swayMul: 1.3, cadenceMul: 1.3, ampMul: 0.6`
(fast jittery peck-walk, exaggerated head-bob, short stride — with an
implied capacity to go from placid to furious without warning)
**Bubbles**: `🐔😠❗` (chicken, sudden Cucco-fury anger, alert/danger)

---

### 6. `goron-brawler` — "Goron (rock-brown, boulder body)"

**Reference**: A race of large, immensely strong, rock-skinned people
native to the volcanic Death Mountain region — round, boulder-like bodies
with a hide of ridged stone plates across the back, small eyes, wide
mouths, and (in most depictions) light brown-to-orange stone-colored
skin; famously curl into a ball and roll like a boulder as both transport
and attack. (Goron.)

**Spec**
```
sk: 1.25              // large and bulky, second-biggest member after the Demon King
headR: 145
headShape: 'sphere'
limbR: 1.35             // thick, heavy limbs
skin: 0xa0623a         // rock-brown/orange stone-toned skin
body: 0xa0623a
legColor: 0x8f5530     // very slightly darker lower-body tone
shoe: 0x6e4020          // stone-toned bare feet, no separate boots
eyes: 'dots'            // small eyes set in a broad face, per canon
emI: 0
hands: 'sphere'          // big broad hands
steel: false             // rock, not metal — no metallic sheen
armL: 1.15
legL: 0.85               // squat legs under a heavy round torso
footMul: [1.2, 1.0, 1.1]
```

**Accessories**
- **back** (×4–5, dorsal stone ridge) — the signature ridge of stone
  plates down the back: rounded half-spheres of varying size,
  ~70–110 mm diameter, `0x7a4a2a` (a shade darker than the base skin),
  proud of the torso surface by ~5 mm (coincident-face gotcha), running
  from nape to lower back.
- **chest** — a small fire-stone emblem tattoo (the Spiritual Stone of
  Fire / Goron's Ruby motif recurring on Goron forearms/chests in canon):
  a small flattened diamond/gem shape, ~30×30×6 mm, `0xd6552a` (warm
  orange-red), proud of the surface, upper-chest or upper-arm placement.
- **hip** — a simple tan loincloth/wrap, a short flattened band,
  ~body-width×140×10 mm, `0xc9a86a`, the Gorons' minimal canonical garb.

**Silhouette check**: the massive rounded, ridge-backed, uniformly
rock-brown body — no separate clothing above the waist, no visible neck,
squat thick limbs — reads as "boulder person" instantly, distinct from
every other member's more slender/costumed proportions.

**Personality**: `bobMul: 0.8, swayMul: 0.9, cadenceMul: 0.55, ampMul: 1.0`
(heavy, ground-shaking footfalls — a slow, powerful lumbering gait, the
slowest cadence in the pack alongside the Demon King)
**Bubbles**: `🪨🔥💪` (rock — Gorons famously eat rock as food, Death
Mountain's volcanic heat, raw strength)

---

### 7. `zora-swimmer` — "Zora (blue, finned, aquatic)"

**Reference**: A slender, fish-like aquatic people who move fluidly
between water and land — smooth blue skin (the series' predominant Zora
coloring), a fin sweeping back from the head like a dolphin's fluke,
paired forearm fins, and webbed hands/feet; associated with Zora's Domain
and its waterways. (Zora.)

**Spec**
```
sk: 1.0
headR: 118
headShape: 'sphere'
limbR: 0.9              // slender, streamlined build
skin: 0x2f7da0         // Zora blue skin
body: 0x2f7da0          // smooth, largely unclothed — the skin IS the "outfit"
legColor: 0x2a6f90     // very slightly darker leg tone
shoe: 0x2f7da0           // webbed feet, same blue, no separate footwear
eyes: 'almond'           // large, calm aquatic eyes
emI: 0.08                 // a faint sheen — smooth wet-look skin
steel: false
hands: 'sphere'
armL: 1.0
legL: 1.05                // slightly longer, slender legs
footMul: [1.25, 0.7, 1.3] // webbed, flipper-like feet (duck/cucco-style footMul reuse)
```

**Accessories**
- **crown** — the signature head-fin: a swept-back flattened cone/fin
  shape, ~90×160×20 mm, `0x8fd0e0` (a lighter aqua than the base skin so
  it reads as a distinct fin, not just more skin), angled back off the
  crown of the head like a dolphin's fluke.
- **head** (×2, forearm fins — approximated at the head/hand anchor
  nearest the forearm if no limb-mounted anchor exists, else `hand`) —
  small flattened fin shapes, ~50×70×12 mm, `0x8fd0e0`, one per forearm.
- **head** (×2, ankle fins) — smaller matching fin shapes, ~35×45×10 mm,
  `0x8fd0e0`, at the ankles.
- **face** — subtle gill-line accents at the sides of the neck/jaw: 2–3
  short thin dark-blue grooves (thin flattened boxes), ~24×6×4 mm,
  `0x1f5570`.

**Silhouette check**: the sleek, uniformly blue, unclothed body topped by
a single swept-back head-fin plus the paired forearm fins is unmistakably
"aquatic humanoid" — the only member with visible fins and the only fully
skin-toned (no separate clothing layer) silhouette besides the Korok.

**Personality**: `bobMul: 0.5, swayMul: 0.9, cadenceMul: 0.9, ampMul: 0.85`
(a fluid, gently swaying gait — carries some of its swimming grace even
walking on land)
**Bubbles**: `🌊🐟🎶` (water/Zora's Domain, fish/aquatic nature, music —
Zora lore ties closely to song and harp-playing)

## Rig gaps

- **No face-skip mechanism for a full mask/foliage accessory.** The Korok's
  entire face is a leaf mask with its own painted eye/mouth holes — the
  rig currently always builds visible eyes/brow/nose/smile per
  `_buildHumanoid` (skipped only for the documented `EAR_SKIP`-adjacent
  visor/slit "helmeted" kinds like robot/ninja). The Korok needs the same
  treatment: a face-skip flag so the leaf-mask accessory is the ONLY facial
  feature rendered, rather than default dot-eyes showing through/behind a
  flat mask disc. Workaround in this doc: spec `eyes: 'dots'` as a harmless
  default and treat the mask as visually overlapping/hiding them, but a
  clean fix would add `korok`-or-similar organic-mask kinds to the same
  skip list robot/ninja already use.
- **No craggy/rock surface material.** `steel` is the only surface-look
  toggle beyond flat toon color (brushed-metal sheen for armored/robotic
  kinds). The Goron's canonical ridged-stone hide is approximated purely
  with discrete raised-bump accessories (the dorsal ridge) plus a plain
  matte color — there's no equivalent "craggy"/"rock" material variant a
  future stone/golem/elemental pack could reuse more cheaply than bolting
  on 4–5 individual bump primitives per figure.
- **No dedicated fin/wing primitive.** The Zora's head-fin and forearm/
  ankle fins are approximated with flattened cones and boxes from the
  existing `box|cylinder|sphere|cone` accessory set, which is serviceable
  but reads a little blocky for a fin's naturally thin, curved profile — a
  thin wedge/fin primitive (or a cone with independently-scalable
  thin-axis taper) would generalize across this member, aquatic creature
  packs, and any future dragon/bird pack's wings.
- **Boar-beast alternate form not spec'd.** This doc renders the Demon
  King in his armored Gerudo-humanoid form (with boar-tusk accessories as
  the "pig villain" tell) rather than his full monstrous boar-beast
  transformation, which canonically adds ram-like horns, a tail, and a
  much larger reptilian/beast-proportioned body. The existing rig's `crown`
  horn accessories (already used elsewhere, e.g. the Mandalorian pack's
  Armorer) would cover the horns, but a humanoid tail accessory doesn't
  exist yet (flagged previously in the Mandalorian pack's Rig gaps for an
  unrelated reason) — noted here as a second, independent pack that would
  want it if a "Ganon beast form" variant is ever added.

## Sources

- [Green Tunic — Zelda Wiki](https://zeldawiki.wiki/wiki/Green_Tunic)
- [Green Clothes — Zelda Wiki (Fandom)](https://zelda.fandom.com/wiki/Green_Clothes)
- [The Legend of Zelda: Why Does Link Always Wear a Green Tunic? — Den of Geek](https://www.denofgeek.com/games/the-legend-of-zelda-link-green-tunic/)
- [Princess Zelda — Zelda Wiki (Fandom)](https://zelda.fandom.com/wiki/Princess_Zelda)
- [Legend Of Zelda: Every Princess Zelda Design, Ranked — ScreenRant](https://screenrant.com/princess-zelda-designs-ranked-worst-best/)
- [Not Just Your Princess: Zelda's Character Design — Women Write About Comics](https://womenwriteaboutcomics.com/2015/08/princess-zeldas-character-design/)
- [Ganondorf — Zelda Wiki (Fandom)](https://zelda.fandom.com/wiki/Ganondorf)
- [Ganon — Zelda Wiki (Fandom)](https://zelda.fandom.com/wiki/Ganon)
- [What Is The Difference Between Ganon & Ganondorf in Zelda? — CBR](https://www.cbr.com/zelda-ganon-vs-ganondorf/)
- [Korok — Zelda Wiki (Fandom)](https://zelda.fandom.com/wiki/Korok)
- [The Legend of Zelda: The Wind Waker/Species/Korok — Wikibooks](https://en.wikibooks.org/wiki/The_Legend_of_Zelda:_The_Wind_Waker/Species/Korok)
- [Cucco — Zelda Wiki (Fandom)](https://zelda.fandom.com/wiki/Cucco)
- [Fowl play: Cuccos, the most dangerous creatures in Hyrule — Zelda Universe](https://zeldauniverse.net/features/fowl-play-cuccos-the-most-dangerous-creatures-in-hyrule/)
- [Goron — Zelda Wiki](https://zeldawiki.wiki/wiki/Goron)
- [Zora — Zelda Wiki](https://zeldawiki.wiki/wiki/Zora)
- [Zora — Zelda Wiki (Fandom)](https://zelda.fandom.com/wiki/Zora)
- `docs/avatars/base/farm-animals.md` (this repo) — the `cartoon_duck` /
  proposed `chicken`/`rooster` biped-on-humanoid convention `farm-cucco`
  follows directly.
- `docs/avatars/sci-fi/star-wars-mandalorian.md` (this repo) — the
  pauldron-approximation and horn/mask-accessory conventions this pack
  reuses for the Demon King and Goron.
