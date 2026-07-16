# Avatar pack: Cartoons — He-Man and the Masters of the Universe

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the Eternian archetype, not a likeness of any
specific actor, animation cel, or Mattel sculpt. No logos, no printed names,
no filed-off trademarks recreated — character identity lives only in this
doc's Reference lines and the pack's display labels.

## Overview

- **Group**: heroes, villains, and allies of the 1980s *He-Man and the
  Masters of the Universe* toy line / Filmation cartoon (Eternia setting).
- **Hierarchy path**: `Cartoons / He-Man and the Masters of the Universe`
- **Member count**: 8 (6 humanoid + 1 humanoid-villain-pair-adjacent + 1
  quadruped: He-Man, Skeletor, Man-At-Arms, Sorceress, Teela, Evil-Lyn, Orko,
  Battle Cat).
- **Rig**: 7 humanoid + 1 quadruped (`battle-cat`). This is the pack set's
  first quadruped mount rather than a pet — see Silhouette check on Battle
  Cat for the scale implication (it must read as a mount, not a housecat).
- **No shared base spec.** Like `sci-fi/star-wars-ot.md`, this cast is
  heterogeneous by design (armored soldier, winged sorceress, tiny floating
  wizard, giant striped mount) and a single starting spec would fight more
  members than it would help.
- **Shared conventions across members**:
  - **80s Filmation-saturated palette, hero/villain color-coded by biology,
    not just costume**: heroes and neutral allies keep natural/warm human
    skin tones (He-Man's bronze tan, Man-At-Arms', Teela's) with ONE bright
    heroic accent (He-Man's red chest cross, Teela's white/gold armor);
    villains get unnatural cool skin tones as the primary tell — Skeletor's
    blue, Evil-Lyn's bright yellow, Orko's (mostly hidden) blue — layered
    under a saturated purple/blue costume family. This mirrors the
    "palette groups by allegiance" convention already used in
    `sci-fi/star-wars-ot.md`.
  - **Barbarian/sword-and-sorcery textiles as solid color blocks**: fur
    trunks, leather harnesses, and robes are approximated as flat-colored
    accessory primitives (box/cone), the same technique as the LOTR pack's
    `back`-anchor cloak cones and `hip`-anchor belts — no cloth sim, no
    weave texture, color + silhouette only.
  - **Full-enclosure technique reused for Skeletor's skull**: the
    "enlarged sphere shell wrapping the entire head" trick already used for
    Vader's helmet (`sci-fi/star-wars-ot.md`) and Boba Fett's dome is reused
    here for the bone-white skull face over blue skin — see member 2 and
    Rig gap 1 for what it can't fully capture.
  - **Robe-cone leg concealment reused for Orko**: the same technique used
    for Yoda's and Gandalf's floor-length robes (`pop-culture/movies-lotr.md`)
    hides Orko's legs under his floor-length wizard robe — necessary because
    he canonically has none visible and never touches the ground. See Rig
    gap 3 for why this still isn't a true hover.
  - **Hat-clearance rule applies everywhere a dome/hood accessory exists**
    (Man-At-Arms has none, but Skeletor's hood, Evil-Lyn's witch hat, and
    Orko's wizard hat all raise + tilt back per the standard rule) — except
    Orko, where it's a **documented deliberate partial override**; see his
    entry.

## Members

### 1. `he-man` — "Barbarian Hero (harness & fur)"

**Reference**: He-Man, secret alter ego of Prince Adam and "the most
powerful man in the universe" — bronzed, heavily muscled barbarian
physique, a blond pageboy-style bob, a leather battle harness with a red
Coridite cross at the chest, cream/white fur trunks, and a sheathed sword
carried on the back.

**Spec**
```
sk: 1.05
headR: 128
headShape: 'sphere'
limbR: 1.4            // BULKY — heroic power-fantasy proportions
skin: 0xd9a373         // bronzed tan (also the bare-chested "body" color)
body: 0xd9a373         // bare-chested — harness is an accessory, not a shirt
legColor: 0xe8dfc8     // cream/white fur trunks
shoe: 0x6b4a2e         // brown fur-cuffed boots
eyes: 'dots'
emI: 0.15
hands: 'sphere'
armL: 1.05
legL: 1.0
```

**Accessories**
- **crown** — blond pageboy bob: a low, rounded flattened sphere-cap hugging the head, `0xe8c468`, front rim above the brow.
- **chest** — battle harness: two crossing diagonal straps (rotated boxes), dark brown leather `0x6b4226`, meeting at a small emissive red cross/gem centerpiece, `0xc41e1e`, `emissiveIntensity ≈ 0.3` — the signature chest detail.
- **hip** — fur-trunk belt line accent: a thin brown box belt, `0x4a3320`, brass buckle `0xc9a227`.
- **back** — sheathed sword: a long thin silver blade box (`0xc7c9cc`) with a gold hilt cylinder (`0xd4af37`), angled diagonally across the back.

**Silhouette check**: bare bronzed torso + blond bob + crossed-strap harness
with a red centerpiece + cream fur trunks reads instantly as the barbarian
hero, and the exaggerated `limbR 1.4` bulk alone separates him from every
other humanoid in the pack even in pure silhouette.

**Personality**: `bobMul: 1.15, swayMul: 0.6, cadenceMul: 0.9, ampMul: 1.2` (heavy, confident heroic swagger)
**Bubbles**: `💪⚔️✨🛡️` ("I have the power", sword, heroic resolve, shield)

---

### 2. `skeletor` — "Skull-Faced Sorcerer (blue & purple)"

**Reference**: Skeletor, self-proclaimed "Evil Lord of Destruction" and
He-Man's archenemy from Snake Mountain — a muscular blue-skinned sorcerer
with his skull fully exposed, wearing a purple hood/cloak and a purple
loincloth, wielding the ram-headed Havoc Staff.

**Spec**
```
sk: 1.05
headR: 128
headShape: 'sphere'    // entirely occluded by the skull shell below
limbR: 1.15
skin: 0x2f6bb0          // blue skin — visible on torso/limbs
body: 0x2f6bb0
legColor: 0x2f6bb0
shoe: 0x241c38           // dark purple boots
eyes: 'dots'
emI: 0.1
hands: 'box'             // bony, angular
armL: 1.0
legL: 1.0
```

**Accessories**
- **crown + head + face** — bone-white skull shell: an enlarged sphere fully enclosing the default head (the same "enclosing helmet" technique as Vader/Boba Fett in `sci-fi/star-wars-ot.md`), `0xe8e2d0`. *This is the load-bearing hack for this entry — see Rig gap 1 for what it can't capture (carved eye sockets, exposed teeth).*
- **crown** (second primitive) — purple hood draping behind/above the skull, a raised + tilted-back cone/section, `0x4a2f7a`, clearing the eye band per the standard hat rule.
- **chest** — two thin bone-white horizontal bars mimicking exposed rib accents, `0xe8e2d0`.
- **back** — purple cape, a flattened cone from the shoulders, `0x3a2265`.
- **hip** — purple loincloth, a wide box/cone wrap, `0x3a2265`.
- **hand** — Havoc Staff: a long dark cylinder (`0x4a3826`) topped by a small ram-skull-suggestive cone, bone-white `0xe8e2d0`.

**Silhouette check**: blue skin + a fully bone-white head + purple hood/cape
is unmistakable at any size — the skull-shell trick sells the color-block
read even though it can't sculpt the actual skull's hollow eye sockets or
bared teeth (see Rig gap 1).

**Personality**: `bobMul: 0.9, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.95` (deliberate, menacing villain stride)
**Bubbles**: `💀☠️🔥😈` (skull menace, evil cackle, dark magic, villainy)

---

### 3. `man-at-arms` — "Weapons Captain (moustache & armor)"

**Reference**: Duncan, Man-At-Arms — He-Man's mentor and the Royal
Guard's weapons master (and Teela's adoptive father) — yellow/gold plate
armor over a green body-glove, brown barbarian-style shorts, and his
signature grey/brown moustache (added by the Filmation cartoon; the
original 1982 action figure had none).

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
limbR: 1.15             // stocky soldier build
skin: 0xc9946a
body: 0x2e6b3a           // green body-glove
legColor: 0x2e6b3a
shoe: 0x4a3320            // brown boots
eyes: 'dots'
emI: 0.12
hands: 'box'              // armored gauntlets
steel: true
armL: 1.0
legL: 0.95
```

**Accessories**
- **face** — the signature grey-brown moustache: a thin box under the nose, `0x8a7050` — *the single defining prop; see Silhouette check.*
- **head** — close-cropped grey hair at the temples/sides (thinning/balding), two small flattened patches, `0x9a9086`.
- **chest** — yellow-gold armor breastplate, a wide box overlay over the green body-glove, `0xd4a017`.
- **hip** — brown shorts/belt overlay wrapping the waist, `0x5c4028`, brass buckle `0xc9a227`.
- **hand** — mace/hammer prop: a metal-grey cylinder handle + box head, `0x8a8a86`.

**Silhouette check**: yellow-gold breastplate over green body-glove plus the
grey moustache is the "captain" read at a glance — no other member pairs
armor plating with visible facial hair.

**Personality**: `bobMul: 0.9, swayMul: 0.6, cadenceMul: 0.9, ampMul: 0.85` (steady, disciplined soldier's march)
**Bubbles**: `🔧⚔️🛡️😤` (gadgeteer/weaponsmith, duty, protection, gruff patience)

---

### 4. `sorceress` — "Falcon Sorceress (winged headdress)"

**Reference**: the Sorceress of Castle Grayskull, Grayskull's shapeshifting
guardian who can transform into Zoar the giant falcon — an orange, blue,
and white bird-motif costume with a falcon-beaked headdress and large
feathered wings that spread from the shoulders/back.

**Spec**
```
sk: 0.98
headR: 116
headShape: 'sphere'
limbR: 0.85              // slender, ethereal
skin: 0xdba876
body: 0xe8c9a0            // white/cream costume base
legColor: 0xe8c9a0
shoe: 0x2f6fae             // blue boots
eyes: 'almond'
emI: 0.2
hands: 'sphere'
armL: 0.95
legL: 1.0
```

**Accessories**
- **crown** — falcon-head headdress: a shaped sphere/cone combo with a small forward-projecting beak cone, white `0xe8e4da` with a blue-beak accent `0x2f6fae`, raised + tilted back to clear the brow (standard hat rule).
- **back** — the wings: two large flattened cone/box wing shapes flaring from the shoulders, two-tone orange primary (`0xe0791e`) with blue trim (`0x2f6fae`) — **the signature prop; see Silhouette check.**
- **chest** — a V-shaped blue/orange plumage accent, two angled thin boxes.
- **head** — trailing side headdress plumes, thin cones, `0xe0791e`.
- **hip** — a thin gold belt band, `0xc9a227`.

**Silhouette check**: the falcon-beaked headdress plus the large two-tone
orange-and-blue wings spread from the back are the unmistakable tell —
no other member has a back-mounted wing silhouette. The wings render as
static rigid geometry with no flutter/flap animation channel (the rig has
no wing/cloth-sim state), so they read correctly at rest and mid-stride but
can't visibly beat — a minor, non-blocking gap, not listed separately below
since it doesn't threaten recognizability.

**Personality**: `bobMul: 0.85, swayMul: 0.5, cadenceMul: 0.9, ampMul: 0.85` (graceful, regal, glide-like)
**Bubbles**: `🦅✨🔮🏰` (falcon/Zoar, magic, sorcery, Castle Grayskull)

---

### 5. `battle-cat` — "Battle Tiger (green & red saddle)"

**Reference**: Battle Cat, He-Man's fierce armored tiger-mount and battle
steed (secretly Cringer, Prince Adam's cowardly pet, transformed) — a huge,
muscular green-furred tiger with a red armored headguard and saddle, large
enough to carry a rider into battle.

**Rig**: quadruped.

**Spec**
```
sk: 1.9                  // ~2× the beagle (sk 1.0 = 520 mm shoulder) reference
                          // → ~990 mm shoulder height, a true mount, not a housecat
bodyLen: 900
bodyW: 260
bodyH: 300
legLen: 1.1
headR: 140
neckLen: 0
ears: 'round'
tail: 'up'
tailLen: 1.2
snout: 0.7
coat: 0x4a7a3a            // green fur base — canonical orange/black tiger
                          // STRIPES are not representable, see Rig gap 2
belly: 0x8ac06a           // lighter green-yellow belly
earColor: 0x2f5a28
snoutColor: 0xd8d4b0       // pale muzzle
```

**Accessories**
- **qhead** — red armored headguard: a box+dome shape over the skull, `0xb0281c` with gold trim, `0xc9a227`.
- **qback** — the saddle: a curved box/cylinder sitting mid-back, red leather `0x8a1f18` with gold buckle details `0xc9a227` — **the signature prop the brief called out explicitly.**
- No **qrump** accessory — the long, raised tail (`tail: 'up'`, `tailLen: 1.2`) carries the read on its own.

**Silhouette check**: the huge scale (`sk 1.9`, dwarfing the pack's cat/dog
baseline) plus the green coat plus the red saddle+headguard together read as
Battle Cat even without the tiger stripes — but the stripes are the single
biggest loss in this pack; a solid green tiger reads more like a cartoon
panther than the character's signature striped coat. See Rig gap 2.
(Note, not a pack-specific gap: `personality`/`bubbles` fields are
schema-valid for this entry, but the current renderer gates thought bubbles,
privacy blur, and standing activity anchors off on all quadruped rigs
[`!h.quad`] — Battle Cat's gait multipliers below apply, his bubbles will
not render under current behavior.)

**Personality**: `bobMul: 1.2, swayMul: 1.3, cadenceMul: 0.8, ampMul: 1.3` (heavy, powerful, stalking strides)
**Bubbles**: `🐯💨😾🔥` (tiger growl, speed, ferocity, battle-ready — see the quad-bubble note above)

---

### 6. `teela` — "Warrior Captain (snake armor)"

**Reference**: Teela, Captain of the Royal Guard of Eternos and
Man-At-Arms' adoptive daughter — red hair worn up under a gold tiara, a
white-and-gold bodysuit, and distinctive reddish-brown snake-motif chest
armor.

**Spec**
```
sk: 0.96
headR: 118
headShape: 'sphere'
limbR: 0.95
skin: 0xdba876
body: 0xe8e4da            // white bodysuit
legColor: 0xe8e4da
shoe: 0x8a6a2e              // gold boots
eyes: 'dots'
emI: 0.18
hands: 'sphere'
armL: 0.95
legL: 1.0
```

**Accessories**
- **crown** — red hair pulled into a high bun, `0x9c3a24`, with a thin gold tiara band, `0xc9a227`.
- **chest** — reddish-brown snake-motif armor: a wide box overlay, `0x8a4a2e`, with two curved thin cylinder accents suggesting the cobra-hood plate, `0x6b3a1e` — the signature detail.
- **hip** — a gold belt, `0xc9a227`.
- **hand** — a small round shield prop, gold/red disc, `0xc9a227`.

**Silhouette check**: red hair + white/gold bodysuit + the reddish-brown
snake chest plate reads as the warrior-captain, distinct from both the
Sorceress's feathered look and Evil-Lyn's yellow-and-blue villain palette.

**Personality**: `bobMul: 1.0, swayMul: 0.7, cadenceMul: 1.05, ampMul: 1.0` (confident warrior stride)
**Bubbles**: `⚔️🛡️😤✨` (warrior discipline, shield, resolve, Eternian magic)

---

### 7. `evil-lyn` — "Yellow Sorceress (blue robes)"

**Reference**: Evil-Lyn, Skeletor's chief sorceress and second-in-command
— bright yellow skin, a tall pointed blue witch's hat, and blue
robes/leotard, with pale blonde/white hair.

**Spec**
```
sk: 0.95
headR: 114
headShape: 'sphere'
limbR: 0.85
skin: 0xd4c92a             // bright yellow — the signature tell
body: 0x1f3f8a              // blue costume
legColor: 0x1f3f8a
shoe: 0x14224a               // dark blue boots
eyes: 'dots'
emI: 0.15
hands: 'sphere'
armL: 0.9
legL: 0.95
```

**Accessories**
- **crown** — tall pointed blue witch hat: a cone, `0x16305e`, raised + tilted back per the standard hat-clearance rule, with pale hair peeking beneath, `0xe8e4da`.
- **chest** — a small yellow accent clasp, `0xd4c92a`.
- **back** — a short blue cape, a flattened cone, `0x1c2e5c`.
- **hip** — a thin gold-trim belt, `0xc9a227`.
- **hand** — a wand prop: a thin dark cylinder (`0x2a2a2e`) with a small emissive orb tip, `0xffe066`, `emissiveIntensity ≈ 0.4`.

**Silhouette check**: bright yellow skin — the only saturated-yellow skin
tone in the pack — under a tall pointed blue witch hat and blue robes is
instantly readable as Skeletor's sorceress, contrasting cleanly against
Teela's white/gold hero palette.

**Personality**: `bobMul: 0.85, swayMul: 0.65, cadenceMul: 0.95, ampMul: 0.9` (sly, calculating glide)
**Bubbles**: `🔮😈✨💛` (sorcery, villainy, dark magic, her signature yellow)

---

### 8. `orko` — "Floating Wizard (red robe)"

**Reference**: Orko, the bumbling Trollan magician and comic relief of
Castle Grayskull — a small blue-skinned being (mostly hidden), wrapped
almost entirely in a red robe with a large pale "O" emblem on the chest, a
tall pointed hat, and a purple scarf across the lower face. Orko has no
visible legs and floats permanently rather than walking.

**Spec**
```
sk: 0.5                    // diminutive, floating imp scale
headR: 100
headShape: 'sphere'
limbR: 0.7
skin: 0x2f6bb0               // blue — mostly hidden under the robe
body: 0xb0281c                // red robe
legColor: 0xb0281c            // robe continues down, hiding the legs entirely
shoe: 0xb0281c                 // fully hidden under the floor-length hem
eyes: 'dots'
emI: 0.1
hands: 'sphere'
armL: 0.85
legL: 0.6                       // shortened — concealed under the robe-cone
```

**Accessories**
- **crown** — tall pointed red wizard hat, a cone, `0xa8241a`. **Deliberate partial override of the standard hat rule**: raised enough to keep the default eyes legible (an intentional readability compromise — see Rig gap 4), rather than drooping low over the face the way the canonical look actually implies.
- **face** — a purple scarf band across the lower face (nose/mouth), `0x5a3a7a`, gesturing at the character's canonical near-total face concealment without fully blanking the eyes.
- **chest** — the large pale "O" emblem, a flat disc, `0xe8dcc0`, on the red robe front — the signature detail.
- **hip** — a thin gold cinch cord, `0xc9a227`.
- **legs** — reuses the robe-cone leg-concealment technique from Yoda/Gandalf (`pop-culture/movies-lotr.md`): a wide cone from the hip anchor to the ground, `0xb0281c`, hiding the leg silhouette entirely. **This is the load-bearing hack for this entry** — see Rig gap 3 for why it still isn't a true hover.

**Silhouette check**: small stature + a solid red pointed-hat robe with a
pale "O" chest emblem reads as Orko even with the actual floating trait
absent — the robe-cone conceals the legs, but the figure still visibly
walks rather than hovering (Rig gap 3).

**Personality**: `bobMul: 0.6, swayMul: 1.0, cadenceMul: 1.1, ampMul: 0.6` (light, bouncy, impish shuffle — the closest approximation to floating available today)
**Bubbles**: `🎩✨😅🪄` (hat full of tricks, magic — often backfiring, comic bumbling, wizardry)

## Rig gaps

1. **No skull/carved-face or concave eye-socket accessory.** Skeletor's
   defining trait is a fully exposed skull with hollow eye sockets and bared
   teeth. The best available approximation reuses the "enclosing helmet
   shell" technique already established for Vader/Boba Fett
   (`sci-fi/star-wars-ot.md`) — a solid bone-white sphere over the head —
   which nails the color-block read but can't sculpt any concave detail
   (accessory primitives are solid box/sphere/cylinder/cone, never boolean
   cut). A `headShape: 'skull'` or a documented "carved detail" accessory
   technique would close this and would generalize to any future
   skeletal/undead character.
2. **No fur-pattern/stripe/spot accessory on the quadruped rig.**
   `QuadrupedFields` exposes only solid `coat`/`belly`/`earColor`/
   `snoutColor` — there's no way to lay a pattern over the base coat.
   Battle Cat's signature orange-and-black tiger stripes over green fur
   are the single biggest loss in this pack; without them the mount reads
   as a solid-green panther-analog rather than a striped tiger. A
   `coatPattern?: 'stripes' | 'spots' | 'patches'` field (or a set of thin
   overlay accessory strips anchored along `qback`) would fix this and is
   broadly reusable for zebras, leopards, and any future striped/spotted
   animal pack.
3. **No hover/levitation offset for humanoids.** Orko canonically has no
   legs and floats permanently — he never touches the ground. The rig
   always grounds the root position and the blob shadow to the nav surface
   every frame (`CLAUDE.md`: "re-grounded every frame in updateTargets so it
   stays on the walking surface"), and there is no persistent Y-lift
   independent of the walk-cycle bob. Hiding the legs under a floor-length
   robe-cone (reusing the Yoda/Gandalf technique) is the only available
   workaround, and the result still visibly walks rather than hovering. A
   `hoverHeight?: number` field (a constant root Y-offset, separate from
   the walk bob, that also re-pins the blob shadow at ground level rather
   than at the root) would be broadly reusable for future ghosts, drones,
   spirits, or floating-orb characters.
4. **No documented technique for a canonically ~fully concealed face that
   stays legible at small scale.** Every existing full-coverage trick
   (Vader's helmet, a stormtrooper's visor) still keeps a defined eye
   band/visor readable. Orko's hat-and-scarf concealment goes further in
   canon (almost nothing of his face is ever shown), but going further here
   risked the figure reading as a rendering error rather than an
   intentional design — so his entry keeps the default `'dots'` eyes
   visible under a partial scarf as a documented, deliberate compromise
   rather than inventing a new "blank face" convention ad hoc.

## Sources

- [He-Man - Wikipedia](https://en.wikipedia.org/wiki/He-Man)
- [He-Man - Masters of the Universe - 1980s cartoon - Profile - Writeups.org](https://www.writeups.org/he-man-masters-universe-profile/)
- [List of He-Man and the Masters of the Universe characters - Wikipedia](https://en.wikipedia.org/wiki/List_of_He-Man_and_the_Masters_of_the_Universe_characters)
- [Skeletor - Wikipedia](https://en.wikipedia.org/wiki/Skeletor)
- [Skeletor | Wiki Grayskull | Fandom](https://he-man.fandom.com/wiki/Skeletor)
- [Man-at-Arms - Masters of the Universe cartoon - Character profile - Writeups.org](https://www.writeups.org/man-at-arms-masters-universe-cartoon/)
- [Man-At-Arms | Wiki Grayskull | Fandom](https://he-man.fandom.com/wiki/Man-At-Arms)
- [Sorceress of Castle Grayskull - Wikipedia](https://en.wikipedia.org/wiki/Sorceress_of_Castle_Grayskull)
- [Sorceress of Grayskull - He-Man & the Masters of the Universe - Writeups.org](https://www.writeups.org/sorceress-grayskull-masters-universe-cartoon/)
- [10 Things You Should Know About The Sorceress — Zentara](https://zentara.blog/2026/03/12/10-things-you-should-know-about-the-sorceress-masters-of-the-universe/)
- [Battle Cat | Wiki Grayskull | Fandom](https://he-man.fandom.com/wiki/Battle_Cat)
- [Battle-Cat - Masters of the Universe cartoon - Cringer - Profile - Writeups.org](https://www.writeups.org/battle-cat-masters-universe-cartoon/)
- [Battle Cat: Fighting Tiger (1982) — Battle Ram](https://battleramblog.com/battle-cat-fighting-tiger-1982/)
- [Teela | Wiki Grayskull | Fandom](https://he-man.fandom.com/wiki/Teela)
- [Teela: Warrior goddess (1982) — Battle Ram](https://battleramblog.com/teela-warrior-goddess-1982/)
- [Teela - Masters of the Universe cartoons - Character Profile - Writeups.org](https://www.writeups.org/teela-masters-of-the-universe-cartoon/)
- [Evil-Lyn - Wikipedia](https://en.wikipedia.org/wiki/Evil-Lyn)
- [Evil-Lyn | Wiki Grayskull | Fandom](https://he-man.fandom.com/wiki/Evil-Lyn)
- [Orko | Wiki Grayskull | Fandom](https://he-man.fandom.com/wiki/Orko)
- [Orko (character) - Wikipedia](https://en.wikipedia.org/wiki/Orko_(character))
- In-repo: `docs/DESIGN-avatars.md` (`HumanoidFields`/`QuadrupedFields`/
  `AvatarPrimitive` shapes cited throughout this doc); sibling docs
  `docs/avatars/sci-fi/star-wars-ot.md` (full-helmet-enclosure technique
  reused for Skeletor, palette-by-allegiance convention) and
  `docs/avatars/pop-culture/movies-lotr.md` (robe-cone leg-concealment
  technique reused for Orko, hat-clearance rule) for conventions cited
  rather than re-derived above.
