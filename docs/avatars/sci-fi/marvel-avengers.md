# Franchise pack: Marvel Cinematic Universe — The Avengers

**Hierarchy path**: `Sci-Fi ▸ Marvel ▸ The Avengers`. These are stylized
geometric toon homage figures (Sims-style minifigures inspired by the
franchise's costume color-coding and signature props) — no likenesses, no
logos, no printed insignia/text anywhere in-scene. Every member below uses a
**descriptive-generic label** for in-app display; the actual character name
lives only in the Reference line of this doc.

## Overview

- **Group**: Earth's Mightiest Heroes — the primary founding + expanded
  roster of the Marvel Cinematic Universe's Avengers ensemble (2012's *The
  Avengers* through *Avengers: Endgame*, plus each member's own franchise).
- **Hierarchy path**: `Sci-Fi / Marvel / The Avengers`
- **Member count**: 10
- **Rig**: humanoid only (no quadrupeds in this pack)
- **Shared base spec** (all members start here, then override):
  ```
  sk: 1.0
  headR: 126
  headShape: 'sphere'
  limbR: 1.0
  hands: 'box'
  eyes: 'almond'
  steel: false
  emI: 0
  armL: 1.0
  legL: 1.0
  footMul: [1.0, 1.0, 1.0]
  ```
- **Member-selection notes**: the survey's suggested ten (Iron Man, Captain
  America, Thor, Hulk, Black Widow, Hawkeye, Spider-Man, Black Panther,
  Doctor Strange, Loki) hold up as the primary-cast set a casual moviegoer
  names first across the ensemble films — verified against each character's
  screen presence/marketing prominence rather than comics tenure, which is
  why Spider-Man, Black Panther, and Doctor Strange (all post-2012 arrivals)
  outrank founding-era comics regulars like Ant-Man or Vision for a **team**
  pack scoped to the *Avengers* ensemble specifically. Loki is included as
  the ensemble's recurring foil/antihero (present in the first film, later a
  headline MCU character in his own right) rather than as a villain-pack
  entry. Nothing was trimmed from the suggested ten; all ten clear the
  silhouette test independently (see each member's check) with no two
  members sharing a color family + prop combination. Omitted: Nick Fury,
  War Machine, Falcon, Scarlet Witch, Vision, Ant-Man, Captain Marvel,
  Winter Soldier — all recognizable, but each a rung below this ten in
  ensemble-marketing prominence; a "Phase 2/3 expanded roster" follow-up
  pack is the natural home for them if wanted later, rather than stretching
  this one past 12.
- **Shared style note — primary-color heroics vs. one all-black outlier**:
  unlike a matched military/uniformed pack, there is no shared palette here
  by design — each hero's costume is a distinct, saturated primary-color
  block (this IS the silhouette system the comics/films themselves use to
  keep a crowded team readable at a glance, which maps directly onto this
  rig's toon-color-blocking approach). Black Widow and Black Panther are
  the pack's two black-suited members and are kept apart by silhouette
  shape (bare red-haired human head vs. an all-black cat-eared cowl with
  glowing slit eyes) and by build (lean human vs. Panther's slightly
  broader steel + emissive read).
- **Tint-rule note**: every member's primary costume colors are canon-
  critical and stay fixed (a red Iron Man or blue Captain America recolored
  off-hue would stop reading as the character). If per-sensor/person color
  coding is wanted for a specific deployment, recolor a small secondary
  accent piece instead — Iron Man's arc-reactor/repulsor glow, Thor's or
  Black Widow's hair, Doctor Strange's amulet glow, Spider-Man's web-
  shooter housings, or Loki's helmet-horn gold are all safe recolor points
  that don't collapse the character read.
- **Recurring accessory idiom — the signature held/worn prop**: this pack
  leans harder on ONE big identifying prop per member than on costume
  pattern detail (which the house no-texture style can't render anyway):
  Cap's ring-shield, Thor's hammer, Hawkeye's bow+quiver, Loki's horned
  helm, Strange's amulet+cloak. Where a member has no single iconic prop
  (Hulk, Black Widow, Spider-Man, Black Panther), color-blocking + build/
  scale carry the whole read instead — see each Silhouette check.
- **Anchor note**: this pack was authored after `shoulderL`/`shoulderR`
  landed on the humanoid anchor list, so pauldron-style shoulder armor
  (Loki) uses the real anchor pair directly rather than the older `chest`-
  box-pair workaround seen in pre-shoulder-anchor docs (e.g. the Star Wars:
  Mandalorian pack).

## Members

### 1. `marvel-avengers/armored-genius` — "Armored genius (red/gold suit)"

**Reference**: A billionaire inventor who builds himself a series of
increasingly advanced full-body powered armors — smooth red-and-gold
plating, a glowing chest reactor, palm-mounted repulsor blasters, and a
featureless metal faceplate that hides the wearer entirely. (Iron Man / Tony
Stark.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xb71c1c        // red faceplate/helmet reads as "skin" — fully encased in armor
body: 0xb71c1c        // red chest/torso plating
legColor: 0xd4a017    // gold thigh/shin plating
shoe: 0xd4a017        // gold boot plating
eyes: 'redvisor'       // narrow horizontal eye-slit geometry — override glow color to icy white-blue (see Rig gaps)
emI: 0.25              // polished-metal sheen + reactor bleed
steel: true
hands: 'box'           // gauntleted fists
limbR: 1.05
limbColors: { armL: 0xd4a017, armR: 0xd4a017 }  // gold forearm gauntlets against the red torso
```

**Accessories**
- **chest** — arc reactor housing: a flattened cylinder ring, ~55×55×10 mm,
  gold `0xd4a017`, centered on the chest.
- **chest** — arc reactor core, a smaller disc nested inside the housing
  (proud ~5 mm), ~34×34×8 mm, glowing cyan-white `0xbfe8ff`, `emissive`
  true at high intensity — the character's single most recognizable detail.
- **handL** / **handR** — repulsor emitters: small discs, ~36×36×8 mm,
  cyan-white `0xbfe8ff`, `emissive`, centered in each palm.

**Silhouette check**: an entirely metal-plated red-and-gold body with NO
visible human face, topped by a glowing cyan chest light and matching palm
glows — the only member whose head is fully encased armor and the only one
with a built-in light source; unmistakable even as a featureless blob.

**Personality**: `bobMul: 0.9, swayMul: 0.6, cadenceMul: 1.0, ampMul: 0.85`
(confident, unhurried — a genius who trusts the suit, not a soldier's drill)
**Bubbles**: `⚙️💡😏🚀` (tech/genius, reactor glow, snark, flight)

---

### 2. `marvel-avengers/super-soldier` — "Super soldier (blue suit, shield)"

**Reference**: A scrawny WWII volunteer transformed by an experimental serum
into the peak of human ability — a blue-bodied uniform with a winged cowl,
and an indestructible round shield (concentric red/white/blue rings around
a center disc) that he throws and catches like a boomerang. (Captain
America / Steve Rogers.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0x2a4d8f        // blue cowl reads as "skin" — mask covers the head
body: 0x2a4d8f        // blue torso
legColor: 0x2a4d8f    // blue legs
shoe: 0x8a1f1f         // red boots
eyes: 'almond'         // eyes visible through the cowl's cutouts
emI: 0
hands: 'box'           // gauntleted gloves
limbR: 1.0
```

**Accessories**
- **crown** (×2, cowl wings) — small flattened-cone wing fins flanking the
  top of the cowl, ~34×16×12 mm each, bright white `0xf0ece0`, angled
  slightly back — the cowl's signature Hermes-wing detail.
- **hip** — a red/white belt band, thin box ~body-width×30×15 mm,
  `0x8a1f1f`, at the waistline.
- **back** (shield, ×3 stacked discs approximating the concentric rings) —
  outer ring: a flattened cylinder ~340×20 mm, red `0x8a1f1f`; middle ring,
  proud ~4 mm: ~260×24 mm, white `0xf0ece0`; inner disc, proud ~8 mm from
  the outer: ~140×28 mm, blue `0x2a4d8f` — slung flat against the back,
  reading as a colored bullseye rather than a printed star/emblem (see Rig
  gaps for why this is a disc approximation, not a true star shape).

**Silhouette check**: a solid blue-bodied figure with a large red-white-blue
ringed disc slung on the back and two small white cowl-wing fins — no
other member carries a circular shield or wears wing fins; instantly reads
even blob-simplified.

**Personality**: `bobMul: 1.0, swayMul: 0.7, cadenceMul: 1.05, ampMul: 1.0`
(upright, disciplined, a soldier's confident march)
**Bubbles**: `🛡️💪⭐🫡` (shield, strength, star, salute)

---

### 3. `marvel-avengers/thunder-god` — "Thunder god (armor, red cape, hammer)"

**Reference**: An immortal, hammer-wielding prince of a golden realm beyond
Earth — imposing build, flowing long blonde hair, dark battle armor with
metallic chest discs, and a flowing red cape; wields the enchanted hammer
Mjolnir and commands lightning. (Thor Odinson.)

**Spec**
```
sk: 1.1
headR: 128
headShape: 'sphere'
skin: 0xd8a878        // fair Asgardian skin tone
body: 0x53504c        // dark steel-grey breastplate
legColor: 0x1c1a18    // black trousers
shoe: 0x1c1a18         // black boots
eyes: 'almond'
emI: 0.05
steel: true            // brushed-metal armor sheen
hands: 'box'
limbR: 1.15            // broad, powerfully built
armL: 1.05
legL: 1.05
```

**Accessories**
- **crown** — long blonde hair cap, ~135×55×135 mm, gold-blonde
  `0xd8b878`, sitting high and full.
- **head** (×2) — long hair falls past the shoulders, elongated boxes
  ~38×190×28 mm each side, matching gold-blonde `0xd8b878`.
- **chest** (×2) — small metallic breastplate discs, ~34×34×10 mm,
  brushed steel `0x8a8a86`, placed symmetrically — the classic disc-
  studded Asgardian cuirass detail.
- **back** — a flowing cape: a tapered flattened cone, ~380 mm wide at the
  shoulders narrowing to ~340 mm at the hem, ~540 mm long, deep red
  `0x8b1a1a`, hanging from the shoulder line past the knee.
- **handR** (Mjolnir, held prop, ×2 parts) — handle: a thin cylinder
  ~16×95×16 mm, dark leather-brown `0x3a2a1e`; hammer head: a box
  ~70×50×60 mm, dull grey stone `0x6e6b66`, offset above the handle tip.

**Silhouette check**: flowing blonde hair + a blood-red cape + a held
hammer-and-handle prop is a combination no other member shares — the
pack's tallest, broadest-built member as well.

**Personality**: `bobMul: 1.1, swayMul: 0.6, cadenceMul: 0.9, ampMul: 1.1`
(powerful, unhurried, long confident strides — a god's swagger)
**Bubbles**: `⚡🔨😄🍺` (lightning, hammer, boisterous humor, Asgardian revelry)

---

### 4. `marvel-avengers/gamma-giant` — "Gamma giant (green, purple shorts)"

**Reference**: A brilliant scientist whose exposure to gamma radiation
transforms him, under stress, into an enormous green-skinned, superhumanly
strong brute — the biggest and least controllable member of the team; his
clothes shred in the transformation except for a pair of oversized purple
trousers. (Hulk / Bruce Banner.)

**Spec**
```
sk: 1.42               // by far the largest humanoid in this pack — the giant read
headR: 132
headShape: 'sphere'
skin: 0x5a9c3a         // saturated toon green
body: 0x5a9c3a         // bare green torso
legColor: 0x5a9c3a     // bare green legs below the shorts (see hip accessory)
shoe: 0x5a9c3a          // bare green feet
eyes: 'almond'
emI: 0
hands: 'box'            // huge fists
limbR: 1.55             // massively muscular
armL: 1.3               // long, gorilla-proportioned arms
legL: 0.9               // relatively short legs vs. the huge torso/arms
footMul: [1.3, 1.1, 1.3]
posture: { pitch: 0.12 }  // a permanent forward hunch/lean, never fully upright
```

**Accessories**
- **hip** — torn purple shorts: a wide box/short cone, ~body-width+40×220×
  body-depth+30 mm, deep purple `0x5b2a86`, hanging waist to mid-thigh,
  ragged at the hem — the character's one fixed costume element.
- **chest** — a torn shirt-collar remnant on one shoulder, a small ragged
  grey box, ~80×60×10 mm, `0x3a3a38`, offset to one side — a nod to the
  shirt that never survives the transformation.

**Silhouette check**: a giant (by far the largest `sk` in the pack) green-
skinned figure with long-arm/short-leg gorilla proportions and purple torn
shorts — the only green member and the only one whose scale alone would
identify him even before color; unmistakable as a blob.

**Personality**: `bobMul: 0.6, swayMul: 0.3, cadenceMul: 0.65, ampMul: 1.4`
(heavy, ground-shaking, deliberately the slowest cadence paired with the
biggest stride amplitude in the pack — raw power over speed)
**Bubbles**: `💥😠🟢💪` (smash, rage, green, strength)

---

### 5. `marvel-avengers/master-spy` — "Master spy (black suit, red hair)"

**Reference**: A former Soviet-trained assassin turned elite S.H.I.E.L.D./
Avengers operative — no powers, just peak human skill: a fitted black
tactical stealth suit, cropped red hair, and wrist-mounted "Widow's Bite"
stun gauntlets. (Black Widow / Natasha Romanoff.)

**Spec**
```
sk: 0.96
headR: 122
headShape: 'sphere'
skin: 0xdba888        // fair skin, face unmasked
body: 0x161616        // black tactical stealth suit
legColor: 0x161616
shoe: 0x0d0d0d
eyes: 'almond'
emI: 0.05
hands: 'sphere'        // slim gloved hands
limbR: 0.85            // lean, athletic build
```

**Accessories**
- **crown** — a cropped red hair cap/bob, ~118×55×118 mm, auburn-red
  `0x8b2e1f`.
- **handL** / **handR** — Widow's Bite gauntlet cuffs: small boxes,
  ~40×28×40 mm, dark `0x1a1a1a`, each with a tiny emissive blue-white
  accent dot (~8 mm) suggesting the stun charge.
- **hip** — a utility belt with a small pouch: thin band ~body-width×24×
  14 mm plus a pouch box ~30×38×20 mm, both `0x0d0d0d`.

**Silhouette check**: an all-black, lean tactical silhouette broken only by
a cropped red-hair accent and two small glowing wrist cuffs — the pack's
only unmasked all-black member, distinguished from Black Panther by the
visible human head/hair and leaner, less bulky build.

**Personality**: `bobMul: 0.85, swayMul: 0.6, cadenceMul: 1.05, ampMul: 0.8`
(controlled, economical, silent-professional movement)
**Bubbles**: `🕶️🥷🔴🤫` (tradecraft/cool, stealth, Widow's Bite red spark, secrecy)

---

### 6. `marvel-avengers/master-archer` — "Master archer (purple/black, bow)"

**Reference**: A S.H.I.E.L.D. marksman with no superpowers beyond
world-class archery — a purple tactical jacket over black trousers, a
recurve bow, and a back-slung quiver of trick arrows; dry, deadpan sense of
humor. (Hawkeye / Clint Barton.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0xd8a878
body: 0x4a2f7a        // purple tactical jacket
legColor: 0x1a1a1a    // black trousers
shoe: 0x141414         // black boots
eyes: 'almond'
emI: 0
hands: 'box'           // archery gloves
limbR: 0.95
```

**Accessories**
- **crown** — short sandy-brown hair cap, ~112×42×112 mm, `0x6b4a2e`.
- **chest** — a color-blocked diamond accent (NOT a printed logo — a
  proud solid-color panel), ~50×70×8 mm, darker purple `0x3a2060`,
  centered chest, evoking the suit's chevron design.
- **back** — quiver: a cylinder ~62×220×62 mm, dark brown-black
  `0x2a2420`, slung diagonally, plus two small cone "fletching tips"
  (~14×30×14 mm each, `0x8a8a86`) poking from the top.
- **handL** (held prop, approximation — see Rig gaps) — a straight vertical
  rod standing in for the recurve bow: a thin cylinder, ~16×260×16 mm,
  matte black `0x0d0d0d`.

**Silhouette check**: solid purple torso over black legs, with a tall
vertical prop in one hand and a back-slung quiver — the only member
holding a straight weapon and the only purple-dominant costume in the pack.

**Personality**: `bobMul: 0.85, swayMul: 0.55, cadenceMul: 0.95, ampMul: 0.85`
(steady, focused, a marksman's economical walk)
**Bubbles**: `🏹🎯😑🍿` (arrows, bullseye focus, deadpan, snarky commentary)

---

### 7. `marvel-avengers/web-slinger` — "Web-slinger (red/blue, masked)"

**Reference**: A high-school-age hero granted spider-like abilities after a
lab accident — a skintight red-and-blue suit with a full mask, large
white lens-shaped eyepieces, and wrist-mounted web-shooters; quippy and
acrobatic. (Spider-Man / Peter Parker.)

**Spec**
```
sk: 0.98
headR: 122
headShape: 'sphere'
skin: 0xc41e2a        // full red mask reads as "skin" — no visible face at all
body: 0xc41e2a        // red torso/head panels
legColor: 0x1a3a8f    // blue legs
shoe: 0x1a3a8f          // blue boots
eyes: 'shades'          // full-coverage lens geometry — override color to bright white (see Rig gaps)
emI: 0.1
hands: 'sphere'
limbR: 0.85             // lean, agile build
limbColors: { armL: 0x1a3a8f, armR: 0x1a3a8f }  // blue arms against the red torso/head
```

**Accessories**
- **handL** / **handR** — web-shooter housings: small boxes, ~20×16×20 mm,
  matte black `0x1a1a1a`, on the underside of each wrist.

**Silhouette check**: solid red head/torso against contrasting blue limbs,
with large white full-face eye lenses and NO other visible facial
features — the only fully masked member without a glowing/metallic head
(vs. Iron Man's metal faceplate or Black Panther's slit-eyed cowl); the
red/blue block plus blank white eyes is unique in the pack.

**Personality**: `bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.15, ampMul: 1.0`
(light-footed, springy, the pack's quickest cadence — youthful energy)
**Bubbles**: `🕸️😅📸🙃` (webs, nervous quips, photography, wisecracking)

---

### 8. `marvel-avengers/wakandan-king` — "Wakandan king (black suit, cat cowl)"

**Reference**: The king and protector of the hidden, technologically
advanced African nation of Wakanda — a sleek, all-black vibranium suit
woven with silver accents, a feline cowl with small pointed ears and
glowing eye slits, and kinetic-energy panels that glow purple on impact.
(Black Panther / T'Challa.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0x141414        // all-black cowl reads as "skin" — head fully covered
body: 0x141414        // black vibranium suit
legColor: 0x161616
shoe: 0x0d0d0d
eyes: 'slit'           // narrow feline eye-slit geometry — override glow to white/silver, not red (see Rig gaps)
emI: 0.15              // faint kinetic-energy sheen
hands: 'box'            // clawed gauntlets
limbR: 0.95
```

**Accessories**
- **head** (×2, panther ears) — small pointed cones, ~20×34×20 mm each,
  black `0x141414` (same as the cowl — a silhouette bump, not a color
  break), at the head's upper sides.
- **chest** — a thin silver collar/necklace band, ~body-width×20×8 mm,
  brushed silver `0xb0b0b0`, at the throat — the suit's activation choker.
- **chest** — a faint kinetic-energy line accent, a thin diagonal box,
  ~90×12×6 mm, pale violet `0x8a6fb0`, `emissive` at low intensity.

**Silhouette check**: an entirely black, sleek, cat-eared cowl silhouette
with a thin silver collar and faint violet glow-lines, plus glowing white
eye slits — the only member with pointed ear-bumps on the head and the
only slit-eyed member; distinguished from Black Widow by the fully
covered head and steel/emissive read.

**Personality**: `bobMul: 0.8, swayMul: 0.85, cadenceMul: 1.05, ampMul: 0.9`
(a poised, prowling, controlled warrior-king's gait)
**Bubbles**: `🐾👑⚡🙏` (stealth/prowl, royalty, kinetic power, ancestral reverence)

---

### 9. `marvel-avengers/master-sorcerer` — "Master sorcerer (blue tunic, crimson cloak)"

**Reference**: A brilliant, arrogant surgeon whose ruined hands lead him to
the mystic arts — deep blue sorcerer's robes, a sentient crimson Cloak of
Levitation, and the glowing Eye of Agamotto amulet worn at the chest.
(Doctor Strange / Stephen Strange.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xd8b090
body: 0x1a3a5c        // deep blue tunic
legColor: 0x16324e    // matching deep blue robe/trouser hem
shoe: 0x3a2a1e         // brown boots
eyes: 'almond'
emI: 0.05
hands: 'sphere'
limbR: 0.95
```

**Accessories**
- **crown** — dark hair cap, ~112×46×112 mm, near-black `0x241f1c`.
- **head** (×2, temple patches) — small flattened grey patches at the
  temples, ~30×20×10 mm each, `0x9a9086` — the character's signature
  distinguished greying-temples look.
- **neck** — amulet chain: a thin band, ~90×10×8 mm, gold `0xc9a227`,
  hanging just below the collar.
- **chest** — Eye of Agamotto pendant: a small disc, ~32×32×14 mm, amber-
  gold `0xc9a227`, `emissive` at moderate intensity, hanging from the
  chain.
- **back** — Cloak of Levitation: a tapered flattened cone, ~360 mm wide
  at the shoulders narrowing to ~320 mm at the hem, ~480 mm long, rich
  crimson `0x9c2b2b` (brighter/warmer than Thor's blood-red cape, keeping
  the two capes distinct), with a thin gold collar-trim band at the
  neckline, ~140×10×30 mm, `0xc9a227`.

**Silhouette check**: a deep-blue-robed figure with a bright crimson
flowing cloak and a small glowing chest pendant — the only member with a
visible chest amulet, and the brightest/warmest cape red in the pack
(distinct from Thor's darker blood-red).

**Personality**: `bobMul: 0.75, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.8`
(composed, precise, faintly mystical — a scholar-sorcerer's economy of motion)
**Bubbles**: `✨🔮📖🌀` (mystic sparks, sorcery, ancient tomes, portal spells)

---

### 10. `marvel-avengers/trickster-prince` — "Trickster prince (green/gold, horned helm)"

**Reference**: The adopted son of Asgard's king, a shapeshifting god of
mischief with an on-again/off-again rivalry with his brother — black and
green leathers with gold trim, a flowing dark-green cape, and a tall,
curling gold horned helmet unlike anything else on the team. (Loki.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0xd8c4b0        // paler than Thor's — the trickster's cooler pallor
body: 0x1f6b3f        // green tunic/jacket
legColor: 0x161616    // black trousers
shoe: 0x141414          // black knee-high boots
eyes: 'almond'
emI: 0.05
hands: 'box'
limbR: 0.85             // leaner than Thor
```

**Accessories**
- **crown** — slicked black hair cap, ~112×42×112 mm, `0x141414`.
- **crown** — gold helmet band encircling the head, a thin cylinder,
  ~132×40×132 mm, gold `0xc9a227`.
- **crown** (×2, horns) — tall curling horns, tapered cones, ~26×170×26 mm
  each, gold `0xc9a227`, angled outward and back (`rot.x ≈ 0.35` each,
  mirrored on `rot.z`) so they sweep up and away from the brow rather than
  standing straight — the single most identifying prop in the whole pack.
- **shoulderL** / **shoulderR** — black-and-gold pauldrons, boxes
  ~66×50×46 mm, black `0x1c1c1c` with a thin gold rim implied by scale
  (kept simple — one box per side, no separate rim piece).
- **chest** — a thin gold breastplate trim line, ~body-width×10×8 mm,
  `0xc9a227`, across the upper chest.
- **back** — a flowing cape: a tapered flattened cone, ~340 mm wide at the
  shoulders narrowing to ~300 mm at the hem, ~500 mm long, dark green
  `0x14401f`.

**Silhouette check**: the tall, curling double-horned gold helmet is
unique in this entire pack (no other member has horns), paired with a
dark-green cape over black-and-gold leathers — reads instantly even in
pure silhouette.

**Personality**: `bobMul: 0.9, swayMul: 0.75, cadenceMul: 0.95, ampMul: 0.85`
(a smug, theatrical saunter — deliberate flair in every step)
**Bubbles**: `😏🐍👑✨` (mischief, trickery, a false claim to the throne, illusion magic)

## Rig gaps

1. **No true star/shield-emblem primitive.** `docs/avatars/base/careers.md`
   already flagged this (badge/star shapes aren't representable with the
   `box`/`cylinder`/`sphere`/`cone` set) but noted it as low-priority
   *"unless a future pack leans on a badge as its primary identifier."*
   Captain America's shield is exactly that case — it's this member's
   single most important prop, not a secondary badge — so this doc
   approximates it as three stacked concentric discs (a "bullseye" read)
   rather than a true five-pointed star/heraldic shield outline. Reads
   fine at toon scale, but a genuine low-poly star/shield fan primitive
   would sharpen it and should be reprioritized given a primary-identifier
   use has now shown up.
2. **`redvisor`/`shades`/`slit` eye styles are presumed to carry fixed glow
   colors.** THREE members in this single pack want the existing visor-
   family eye geometry in a non-default color: Iron Man (`redvisor`
   geometry, wants icy white-blue, not red), Spider-Man (`shades` full-lens
   geometry, wants bright white, not dark), and Black Panther (`slit`
   geometry, wants white/silver, not red). This is the same gap the Star
   Wars: Mandalorian doc raised for its remnant trooper's black visor
   override and already-parked generically in `docs/ROADMAP.md` § avatar
   rig gaps ("eye color overrides") — three more instances in one pack
   is a strong signal to promote a simple optional-color param on the
   existing visor-family eye styles rather than adding new named styles
   per color.
3. **No cloth/cape drape or flutter animation.** Three of this pack's ten
   members (Thor, Doctor Strange, Loki) wear a flowing cape/cloak, each
   built as a static `back`-anchor flattened cone. This is the same
   already-raised extension of the ROADMAP's "animated appendages" item
   that the Harry Potter doc first called out by name (cape/robe cloth
   motion) — now flagged a second time from an unrelated pack, which
   should raise its priority further; static capes read fine standing or
   walking slowly but won't sell a running or wind-blown pose.
4. **No curved/bent held-prop geometry.** Hawkeye's recurve bow — a
   signature curved silhouette — is approximated here as a straight
   vertical rod in the off-hand, since only straight primitives
   (box/cylinder/cone) are available and there's no "held prop" primitive
   that bends. This is a specific case of the already-parked "pose-aware
   hand props / two-handed prop convention" item in `docs/ROADMAP.md` §
   avatar rig gaps; noting the concrete curved-bow use case here in case
   it helps scope that work later.

None of these gaps blocked building this pack; all ten members are fully
expressible with the current rig via the workarounds above.

## Sources

- [Mark 85 — Iron Man Wiki, Fandom](https://ironman.fandom.com/wiki/Mark_85)
- [Every Version Of The MCU Iron Man Armor Tony Stark Built — ScreenRant](https://screenrant.com/iron-man-suit-armor-versions-tony-stark-mcu/)
- [Captain America's Uniform — Marvel Cinematic Universe Wiki, Fandom](https://marvelcinematicuniverse.fandom.com/wiki/Captain_America's_Uniform)
- [The Captain America Logo History, Colors, Font, and Meaning](https://www.designyourway.net/blog/captain-america-logo/)
- [Every Captain America Suit in the MCU](https://blog.abracadabranyc.com/every-captain-america-suit-in-the-mcu/)
- [All 11 Thor Costumes In The MCU, Ranked — ScreenRant](https://screenrant.com/every-mcu-thor-suit-ranked/)
- [The History of Thor's Armor in the MCU — Murphy's Multiverse](https://www.murphysmultiverse.com/the-history-of-thors-armor-in-the-mcu/)
- [Why Were the Hulk's Pants Always Purple? — CBR](https://www.cbr.com/hulk-pants-purple-origin/)
- [A Color Guide To The Many Shades Of Incredible Hulk Skin — Tech Times](https://www.techtimes.com/articles/112100/20151202/color-guide-many-shades-incredible-hulk-skin.htm)
- [All 11 Black Widow Suits In The MCU, Ranked — ScreenRant](https://screenrant.com/black-widow-mcu-costumes-ranked/)
- [Black Widow Costume History — Costume Wire](https://costumewire.com/black-widow-costume/)
- [Hawkeye Suit — Marvel Cinematic Universe Wiki, Fandom](https://marvelcinematicuniverse.fandom.com/wiki/Hawkeye_Suit)
- [How Accurate Hawkeye's Phase 4 Suit Is To His Comics Costume — ScreenRant](https://screenrant.com/hawkeye-mcu-suit-purple-comic-accurate-comparison/)
- [Spider-Man Suit — Marvel Cinematic Universe Wiki, Fandom](https://marvelcinematicuniverse.fandom.com/wiki/Spider-Man_Suit)
- [All 14 Spider-Man Suits In Marvel Movies Explained — ScreenRant](https://screenrant.com/spiderman-movies-marvel-suits-costumes-designs-abilities-explained/)
- [Panther Habit — Marvel Cinematic Universe Wiki, Fandom](https://marvelcinematicuniverse.fandom.com/wiki/Panther_Habit)
- [Black Panther Costume Designer Ruth E. Carter on Creating the Iconic Panther Suit — The Credits](https://www.motionpictures.org/2018/02/black-panther-costume-designer-ruth-e-carter-creating-iconic-panther-suit/)
- [All 7 Doctor Strange Costumes In The MCU, Ranked — ScreenRant](https://screenrant.com/every-mcu-doctor-strange-costume-ranked/)
- [The evolution of Doctor Strange's outfit — Tumblr](https://www.tumblr.com/doctorofmagic/679279028454211584/the-evolution-of-doctor-stranges-outfit)
- [27 Mind-Blowing Details About Loki's Costumes — BuzzFeed](https://www.buzzfeed.com/crystalro/loki-costume-details)
- [All 14 Loki Costumes In The MCU, Ranked — ScreenRant](https://screenrant.com/loki-every-mcu-suit-ranked/)
- General character/appearance knowledge of the Marvel Cinematic Universe's
  Avengers ensemble (Iron Man, Captain America, Thor, Hulk, Black Widow,
  Hawkeye, Spider-Man, Black Panther, Doctor Strange, Loki) as broadly
  documented across Marvel/MCU reference and costuming sources.
