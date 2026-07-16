# Avatar pack: Power Rangers — Mighty Morphin

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no textures, no names printed anywhere in-scene; character identity lives only
in this doc's Reference lines and the pack's display labels.

## Overview

- **Group**: The core hero team + inner villain circle of *Mighty Morphin
  Power Rangers* (1993–1996) — five ordinary teenagers (later six) given
  color-coded powered battle suits by an ancient interdimensional mentor to
  defend Earth from a space witch and her monsters. Color-blocked spandex
  suits are this franchise's entire visual language — the whole point of the
  team design is that members are told apart almost purely by hue, which
  maps directly onto this pack's silhouette-test philosophy.
- **Hierarchy path**: `Sci-Fi / Power Rangers / Mighty Morphin`
- **Member count**: 10
- **Rig**: humanoid only (no quadrupeds; Alpha 5's short, squat build and
  Goldar's tail/wings are approximated on the humanoid rig — see Rig gaps)
- **Member selection**: the research survey proposed 9 — the six Rangers
  (Jason/Red, Zack/Black, Billy/Blue, Trini/Yellow, Kimberly/Pink, Tommy/
  Green-White), Zordon, Alpha 5, and Rita Repulsa. Verified against casual-
  fan recognition and **added Goldar** (Rita's ever-present monster-general
  and chief muscle, on-screen in nearly every episode of the Rita era,
  arguably as recognizable to a casual viewer as Rita herself) for a round
  10, still comfortably inside the 5–12 budget. Deliberately **omitted**:
  Squatt and Baboo (Rita's bumbling flunkies — comic-relief background,
  low recognition outside superfans), Finster (the monster-maker gnome —
  one-note, rarely a face fans name first), Scorpina (a secondary general,
  less iconic than Goldar), and Lord Zedd/Rito Revolto/Master Vile (later-
  season main villains who belong to a hypothetical follow-on "Zeo era"
  pack, not this one — this pack stays scoped to the original Rita-led
  Season 1–2 status quo the survey targeted).
- **Shared base spec** for the six Ranger suits (near-identical geometry by
  design — canon distinguishes them almost entirely by color):
  ```
  sk: 1.0
  headR: 126
  headShape: 'sphere'
  hands: 'box'            // gauntleted fists
  eyes: 'visor'            // full-face chrome/mirrored visor
  steel: false
  emI: 0
  shoe: 0xf2f0ea           // shared white boots
  footMul: [1.0, 1.0, 1.0]
  limbR: 1.0
  ```
- **Shared palette — the six suits + team metals**:
  - Red — `0xd6231f` (Jason)
  - Black — `0x1a1a1a` (Zack)
  - Blue — `0x2a63c9` (Billy)
  - Yellow — `0xf5c400` (Trini)
  - Pink — `0xf24f9c` (Kimberly)
  - Green — `0x1e7a38` (Tommy, original); White — `0xf5f3ed` (Tommy's later
    upgrade, see his entry's alt-state note)
  - Shared trim: white boots/team base `0xf2f0ea`, gold coin/buckle accent
    `0xc9a227`, chrome/silver grille+visor accent `0xb8b8b8`
  - Rita/Goldar palette: witch-pale skin `0xb8ae9c`, black gown `0x1c1a1e`,
    silver-gray headdress/collar `0x9a9a92`, Goldar gold armor `0xc9a227` /
    darker bronze-gold `0x8a7328`, shared red accent `0x8a1f1f`
- **Known deviation — `skin` is single-purpose (head + hands)**: every
  Ranger's canonical look is a saturated color-coded **helmet** paired with
  **white** gloves/boots. The rig's `skin` field colors the head AND hands
  together (no independent hand channel — the same limitation already
  flagged in `video-games/mario.md` and `video-games/metroid.md`; this is
  the third pack to hit it, reinforcing that case). `limbColors.armL/armR`
  was considered as a workaround (it recolors the arm SEGMENTS only, never
  the hand) — but that would fix the wrong end: it could make the sleeves
  suit-colored while leaving the head+hands whatever `skin` says, which
  still can't give a suit-colored **helmet** AND white **hands**
  simultaneously. Since the helmet color is the single most important
  identity read for this pack (it's literally how you tell Red from Blue),
  `skin` is set to each Ranger's suit color and the resulting suit-colored
  hands (instead of white gloves) are accepted as a minor, documented
  deviation — consistent with how the two prior packs resolved the same
  conflict.
- **Tommy's alt state**: the survey lists him as "Green/White Ranger" — one
  actor, two costumes at different points in the show. This pack defaults
  to the **Green Ranger** look (his introduction, the more visually distinct
  of the two thanks to the gold Dragon Shield) and documents the **White
  Ranger** upgrade as an alternate field-override block in his entry, the
  same pattern `star-wars-mandalorian.md` used for the Marshal's helmet-on/
  off variant.
- **Shoulder anchors now available**: `shoulderL`/`shoulderR` (added since
  earlier sci-fi docs flagged their absence, e.g. the Mandalorian pauldron
  gap) are used directly here for Alpha 5's shoulder trim and Goldar's
  pauldrons — no `chest`-anchored approximation needed this time.

## Members

### 1. `jason-red-ranger` — "Red Ranger (red suit, white gloves/boots)"

**Reference**: The team's first-chosen leader, commands the Tyrannosaurus
Dinozord and wields the Power Sword — bright red spandex suit, white gloves
and boots, gold belt buckle bearing his Power Coin, full-face helmet with a
chrome mouth grille styled after his Zord. (Jason Lee Scott.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xd6231f        // suit red — also colors hands (see Overview deviation note)
body: 0xd6231f
shoe: 0xf2f0ea
eyes: 'visor'
emI: 0
hands: 'box'
steel: false
limbR: 1.0
```

**Accessories**
- **face** — chrome mouth-grille bar, ~90×18×14 mm, `0xb8b8b8`, centered
  low on the visor, suggesting a T-Rex "teeth" grille.
- **chest** — gold circular Power Coin emblem, a flattened disc ~46×46×8 mm,
  `0xc9a227`, centered upper chest, proud of the suit surface.
- **hip** — belt band, `0x1a1a1a`, body-width × 30 × 16 mm.
- **hip** — square gold buckle, ~50×40×10 mm, `0xc9a227`, centered on the
  belt.

**Silhouette check**: solid saturated red head-to-toe with white gloves/
boots and a centered gold coin — the archetypal "red = leader" read,
unmistakable next to five other hues at 30px.

**Personality**: `bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0`
(confident, athletic, front-and-center team-leader stride)
**Bubbles**: `🦖⚔️🛡️😤` (Tyrannosaurus zord, Power Sword, protecting the
team, grit/determination)

---

### 2. `zack-black-ranger` — "Black Ranger (black suit, white gloves/boots)"

**Reference**: The team's high-energy, dance-loving powerhouse, commands the
Mastodon Dinozord and wields the twin-bladed Power Axe — black suit, white
gloves and boots, same gold-coin/chrome-grille recipe as every teammate,
recolored. (Zack Taylor.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0x1a1a1a
body: 0x1a1a1a
shoe: 0xf2f0ea
eyes: 'visor'
emI: 0
hands: 'box'
steel: false
limbR: 1.05           // read as the pack's broadest/most powerful build
```

**Accessories**
- **face** — chrome grille, ~90×18×14 mm, `0xb8b8b8`, but shaped as two
  small downward tusk cones (~16×26×16 mm each) flanking center instead of
  a flat bar, per the Mastodon motif.
- **chest** — gold Power Coin disc, ~46×46×8 mm, `0xc9a227`.
- **hip** — belt band, `0x2a2a2a` (a hair lighter than the suit so it
  doesn't vanish against it), body-width × 30 × 16 mm.
- **hip** — gold buckle, ~50×40×10 mm, `0xc9a227`.

**Silhouette check**: solid black suit with the same white gloves/boots and
gold coin as the rest of the team — the only all-black member, reads
instantly as "the black one" by elimination even before the coin registers.

**Personality**: `bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.15, ampMul: 1.05`
(loose-limbed, a little showy — the team's dancer, most bounce of any Ranger)
**Bubbles**: `🐘🪓🕺😄` (Mastodon zord, Power Axe, dance moves, upbeat energy)

---

### 3. `billy-blue-ranger` — "Blue Ranger (blue suit, white gloves/boots)"

**Reference**: The team's brilliant, gadget-building brain, commands the
Triceratops Dinozord and wields the Power Lance — royal blue suit, white
gloves and boots, the shared gold-coin recipe. (Billy Cranston.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0x2a63c9
body: 0x2a63c9
shoe: 0xf2f0ea
eyes: 'visor'
emI: 0
hands: 'box'
steel: false
limbR: 0.95           // read as the least physically imposing build — the brain, not the brawn
```

**Accessories**
- **face** — chrome grille, a single small forward horn nub (cone,
  ~18×20×18 mm) centered low on the visor, `0xb8b8b8`, per the Triceratops
  motif.
- **chest** — gold Power Coin disc, ~46×46×8 mm, `0xc9a227`.
- **hip** — belt band, `0x1c3a78` (a shade darker than the suit),
  body-width × 30 × 16 mm.
- **hip** — gold buckle, ~50×40×10 mm, `0xc9a227`.

**Silhouette check**: solid royal-blue suit, single small horn-nub grille —
the only blue member, distinct from Trini's yellow and Jason's red at any
distance.

**Personality**: `bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.95, ampMul: 0.85`
(measured, slightly stiff, thoughtful gait — the team's scientist)
**Bubbles**: `🦕🔬🛠️🤓` (Triceratops zord, science/analysis, gadgeteering,
bookish enthusiasm)

---

### 4. `trini-yellow-ranger` — "Yellow Ranger (yellow suit, white gloves/boots)"

**Reference**: The team's calm, disciplined martial artist, commands the
Sabertooth Tiger Dinozord and wields the Power Daggers — golden-yellow suit,
white gloves and boots, no skirt (unlike Kimberly's Pink — the Yellow
Ranger's suit is one of the plain unisex cuts). (Trini Kwan.)

**Spec**
```
sk: 0.97
headR: 124
headShape: 'sphere'
skin: 0xf5c400
body: 0xf5c400
shoe: 0xf2f0ea
eyes: 'visor'
emI: 0
hands: 'box'
steel: false
limbR: 0.9
```

**Accessories**
- **face** — chrome grille, two small downward fang cones (~14×24×14 mm
  each) flanking center, `0xb8b8b8`, per the Sabertooth Tiger motif.
- **chest** — gold Power Coin disc, ~46×46×8 mm, `0xc9a227`.
- **hip** — belt band, `0xc9a300` (a shade darker than the suit),
  body-width × 30 × 16 mm.
- **hip** — gold buckle, ~50×40×10 mm, `0xc9a227`.

**Silhouette check**: solid bright-yellow suit, twin fang-grille, NO skirt
silhouette (deliberately plain-legged, unlike Kimberly) — reads instantly
as "the yellow one," and the leg silhouette itself is the tell that
distinguishes her from the pink member at a glance.

**Personality**: `bobMul: 0.75, swayMul: 0.55, cadenceMul: 0.9, ampMul: 0.8`
(controlled, centered, martial-arts poise — the calmest walk in the pack)
**Bubbles**: `🐯🗡️🧘😌` (Sabertooth zord, Power Daggers, martial discipline,
serenity)

---

### 5. `kimberly-pink-ranger` — "Pink Ranger (pink suit, wrap skirt)"

**Reference**: The team's gymnast, commands the Pterodactyl Dinozord and
wields the Power Bow — vivid pink suit, white gloves and boots, and (unlike
every other teammate) a short pink wrap skirt over the suit — an artifact of
the source footage, where she was originally the team's sole woman.
(Kimberly Hart.)

**Spec**
```
sk: 0.95
headR: 122
headShape: 'sphere'
skin: 0xf24f9c
body: 0xf24f9c
shoe: 0xf2f0ea
eyes: 'visor'
emI: 0
hands: 'box'
steel: false
limbR: 0.85
```

**Accessories**
- **face** — chrome grille, a small forward beak point (cone, ~14×22×14 mm)
  centered at chin height, `0xb8b8b8`, per the Pterodactyl motif.
- **chest** — gold Power Coin disc, ~46×46×8 mm, `0xc9a227`.
- **hip** — belt band, `0xd93f89` (a shade darker than the suit),
  body-width × 30 × 16 mm.
- **hip** — gold buckle, ~50×40×10 mm, `0xc9a227`.
- **hip** — wrap skirt: a SHORT flared cone (not the full floor-length
  gown-cone used for princess/witch skirts elsewhere in this doc corpus —
  legs stay visible below it), ~`TORSO_W*1.3` wide tapering to `TORSO_W*0.9`
  at the hem, ~220 mm tall, `0xd93f89`, sitting proud over the upper thighs
  only. This is the pack's one deliberate two-height variant of the
  standard hip-cone skirt recipe.

**Silhouette check**: solid pink suit topped by a short flared skirt at the
hip — the only member with any skirt silhouette at all, an instant,
unambiguous tell even before the color registers.

**Personality**: `bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.0, ampMul: 0.95`
(springy, light-footed, gymnast's bounce)
**Bubbles**: `🦅🏹🤸💕` (Pterodactyl zord, Power Bow, gymnastics/agility,
warmth)

---

### 6. `tommy-green-ranger` — "Green Ranger (green suit, gold dragon shield)"

**Reference**: A new arrival at Angel Grove High, briefly enchanted into
Rita's evil Green Ranger before breaking free to join the team — green suit
with a distinctive gold chest shield (the "Dragon Shield"), gold armbands,
and triangle (not diamond) trim; wields the Dragon Dagger, which doubles as
a flute to summon the Dragonzord and is the only Ranger weapon carried in a
holster at all times. Later empowered as the White Ranger (see alt state
below). (Tommy Oliver.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0x1e7a38
body: 0x1e7a38
shoe: 0xf2f0ea
eyes: 'visor'
emI: 0
hands: 'box'
steel: false
limbR: 1.0
```

**Accessories**
- **chest** — the Dragon Shield: a large gold oval/flattened disc,
  ~150×170×26 mm, `0xc9a227`, centered on the chest, proud of the suit —
  the single biggest silhouette element in the pack.
- **neck** — a thin gold collar/gorget band, ~body-width×18×10 mm,
  `0xc9a227`, at the neckline above the shield.
- **shoulderL** / **shoulderR** — gold armbands: two thin cylinder rings,
  ~50×20×50 mm each, `0xc9a227`, on the upper arms (canon has these as
  armbands rather than shoulder plates — reusing the shoulder anchors here
  since there's no dedicated upper-arm/bicep anchor).
- **hip** — a black dagger holster box, ~30×90×20 mm, `0x1a1a1a`, worn at
  the hip (Tommy is the only Ranger who keeps his weapon holstered at all
  times rather than only drawing it in combat).

**Silhouette check**: solid green suit dominated by a large gold oval on the
chest — no other member combines green + a big centered chest medallion;
instantly reads as "the one with the shield," even smaller than 30px.

**Personality**: `bobMul: 0.95, swayMul: 0.8, cadenceMul: 1.0, ampMul: 1.0`
(confident but slightly apart from the others — a loner's edge under the
team stance)
**Bubbles**: `🐉🎺⚔️🤔` (Dragonzord, the Dragon Dagger/flute, combat prowess,
his conflicted/redeemed backstory)

**Optional alt state — White Ranger**: swap `skin`/`body` → `0xf5f3ed`
(near-white), drop the chest Dragon Shield oval to a smaller
black-and-gold shield (~110×130×22 mm, `0x1a1a1a` base + a `0xc9a227` gold
trim band), swap the gold armbands for plain gold bands unchanged, add a
**hip** gold belt band (~body-width×24×14 mm, `0xc9a227`) in place of the
holster, and give `handR` a short straight sword prop (thin box
~14×220×14 mm, `0xd8d8d8`) representing Saba, his talking sabre — his later
season-2 upgrade, empowered directly rather than by a stolen coin, with a
plain white suit (no chest diamond) and unsculpted helmet mouthpiece. Kept
as a documented variant rather than a second member, since the survey
treats "Green/White" as one character slot.

---

### 7. `zordon-mentor` — "Floating mentor (giant head, energy tube)"

**Reference**: An ancient interdimensional being, trapped for millennia and
freed as a floating, disembodied giant blue-toned head confined within a
glowing energy tube in the team's command center — wise, calm, fatherly,
physically unable to leave the tube; guides the Rangers but never fights
directly. (Zordon.)

**Spec**
```
sk: 0.85
headR: 175             // oversized floating head — the primary read
headShape: 'oval'
skin: 0x6fa8dc          // pale blue-toned "energy being" face
body: 0x274472          // deep blue robe/collar glimpsed beneath the tube
shoe: 0x274472
eyes: 'almond'           // calm, bare-faced gaze — not helmeted like the Rangers
emI: 0.15                // faint self-luminous energy-being glow
hands: 'sphere'
steel: false
hover: 380               // floats — legs omitted entirely, a being with no feet to plant
opacity: 0.85            // slightly translucent, reads as contained energy, not solid flesh
limbR: 0.55
armL: 0.45
```

**Accessories**
- **crown** — close-cropped gray-white hair, a shallow `sphereArc` dome
  (`[0, Math.PI*2, 0, 0.35]`, low coverage — NOT a full hood), `0xb8b4a8`,
  sitting close to the scalp.
- **face** — a small mustache/beard tuft, a flattened box ~55×20×10 mm,
  `0xc8c4b4`, just under the nose.
- **chest** — a thin robe-collar band peeking above the tube line,
  ~body-width×20×8 mm, `0x1c3a5e`.
- **root** — the energy tube: a tall, wide translucent cylinder from the
  floor up past the hover height, ~440 mm diameter, `0x9fd8f0`, `emissive:
  0x9fd8f0`, `emissiveIntensity: 0.2`, opacity handled via the accessory's
  own transparency (documented approximation — see Rig gaps; the tube
  necessarily moves with the rig rather than staying fixed in the room).

**Silhouette check**: an oversized calm elder face with NO visible legs,
hovering inside a pale glowing cylinder — nothing else in any Diorama pack
combines "giant head" with "legless, tube-contained float"; unmistakable
even smaller than 30px, and the only member in this pack that never
"stands" on the floor at all.

**Personality**: `bobMul: 0.25, swayMul: 0.2, cadenceMul: 0.4, ampMul: 0.25`
(serene, almost motionless drift — a being who is never seen to physically
move under his own power)
**Bubbles**: `🌌🔮📡🕊️` (cosmic/ancient wisdom, foresight, guidance over
comms, peacekeeping)

---

### 8. `alpha-5-robot` — "Command-center robot (gold dome, flashing visor)"

**Reference**: The excitable, fussing robot assistant who runs the Command
Center alongside Zordon — short (roughly four feet), a golden dome head
with a flashing red visor-bar, red-and-gold plating over a black chassis,
and a yellow inverted-lightning-bolt emblem on the chest; prone to anxious
"Ay yi yi yi!" outbursts. (Alpha 5.)

**Spec**
```
sk: 0.55                // notably shorter than the adult cast
headR: 110
headShape: 'cylinder'    // flattened dome/saucer reads better on a squat cylinder than a sphere
skin: 0xc9a227           // gold dome — also colors hands, see Overview deviation note
body: 0x1a1a1a            // black chassis torso
legColor: 0xc9a227        // gold-trimmed leg plating
shoe: 0x8a1f1f             // small red foot housings
eyes: 'redvisor'           // flashing red bar visor — the character's single most identifying feature
emI: 0.3
steel: true
hands: 'box'
limbR: 0.85
armL: 0.85
legL: 0.75
footMul: [0.9, 0.8, 0.9]
```

**Accessories**
- **crown** — a thin antenna, cylinder ~10×60×10 mm, `0xc9a227`, top-center
  of the dome.
- **chest** — an inverted lightning-bolt emblem: two angled thin boxes
  forming a chevron, ~50×70×8 mm combined footprint, `0xf5c400`, centered
  chest, proud of the black torso.
- **shoulderL** / **shoulderR** — gold shoulder-plate trim, small boxes
  ~40×24×36 mm each, `0xc9a227`.
- **head** (×2) — small dome side-bumps (sensor knobs), spheres ~16 mm,
  `0x8a7328`, flanking the head.

**Silhouette check**: short, squat, gold-domed, red-visored robot with a
yellow chest chevron — the shortest member by far and the only rounded-
dome silhouette in the pack; unmistakable next to the taller armored/caped
figures even at 30px.

**Personality**: `bobMul: 1.1, swayMul: 0.4, cadenceMul: 1.25, ampMul: 0.6`
(small, quick, slightly fussy scurrying steps — anxious, high-strung energy)
**Bubbles**: `😨📡🔧🤖` (panicked "ay-yi-yi" outbursts, monitoring/comms,
tinkering, robotic nature)

---

### 9. `rita-repulsa` — "Space witch (black/gold gown, horned headdress)"

**Reference**: The Rangers' original arch-nemesis, an evil sorceress
imprisoned in a space dumpster for ten millennia before being accidentally
freed — pale, witch-like complexion, a silver horned headdress with a
flared fin-like collar behind the head, a flowing black gown with big
draped sleeves, and a gold wand tipped with a glowing red orb; commands an
army of Putty Patrollers and monsters. (Rita Repulsa.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
skin: 0xb8ae9c           // pale, grayish witch complexion
body: 0x1c1a1e            // black gown
legColor: 0x1c1a1e         // gown covers the legs — see hip skirt-cone accessory below
shoe: 0x1c1a17
eyes: 'shades'             // heavy dark eye makeup — the closest built-in style to her look
emI: 0
hands: 'sphere'
steel: false
limbR: 0.9
```

**Accessories**
- **hip** — the gown: a tall inverted cone (the full-length ballgown
  recipe, NOT Kimberly's short variant), ~`TORSO_W*1.4` wide tapering to
  the floor, ~`legL*760` mm tall, `0x1c1a1e`, fully hiding the legs.
- **crown** (×2, horns) — tall thin cones, ~24×160×24 mm each, `0x9a9a92`,
  splayed outward and slightly back from the crown, per the wrapped gray
  headdress.
- **crown** — a center headdress band between the horns, a thin low box
  ~14×30×110 mm, `0xc9a227` (gold trim).
- **back** — the flared fin collar: a wide flattened cone rising behind the
  neck/shoulders, ~260×220×20 mm, `0x9a9a92`, fanning up and outward.
- **chest** — a red jewel brooch, a small sphere ~30 mm, `0x8a1f1f`,
  centered at the collarbone.
- **handR** — the wand: a thin cylinder ~14×260×14 mm, `0xc9a227`, tipped
  with a small glowing red sphere ~26 mm, `0x8a1f1f`, `emissive: 0x8a1f1f`,
  `emissiveIntensity: 0.4`, held at rest.

**Silhouette check**: a black floor-length gown with NO visible legs, twin
silver horns and a fanned collar rising behind the head, wand in hand —
the only gown-and-horns silhouette in the pack, unmistakable as the
franchise's classic villain even in flat color.

**Personality**: `bobMul: 0.7, swayMul: 1.1, cadenceMul: 0.8, ampMul: 0.9`
(a dramatic, swaying witch's glide — theatrical, cackling energy)
**Bubbles**: `😈🪄🌑😤` (villainous cackle, wand/magic, the space-dumpster
prison and dark of space, fury at the Rangers' interference)

---

### 10. `goldar-general` — "Winged general (gold armor, folded wings)"

**Reference**: Rita's most trusted monster-general and chief muscle, a
hulking winged creature encased in gold-plated armor with a Greek/Egyptian-
styled helmet, glowing red eyes, a lion-like mane and snout, a scorpion-like
tail, and large bird-like wings usually held folded behind him; fights with
a sword and answers directly to Rita. (Goldar.)

**Spec**
```
sk: 1.15                 // hulking, taller build than the human-scale Rangers
headR: 132
headShape: 'box'          // angular helmet-face reads better boxed than round
skin: 0xc9a227            // gold armor plating — fully encased, reads as "skin"
body: 0xb8934a             // slightly darker gold torso plating
legColor: 0xc9a227
shoe: 0x8a7328
eyes: 'redvisor'            // glowing red eyes — REQUIRED
emI: 0.25
hands: 'box'
steel: true
limbR: 1.15
armL: 1.05
legL: 1.0
footMul: [1.1, 1.0, 1.1]
```

**Accessories**
- **face** — a lion-like snout, a forward cone bump ~50×40×60 mm,
  `0xb8934a`, centered low on the face.
- **crown** — a low mane/crest ridge, a short box ~90×30×30 mm,
  `0x8a7328`, running back from the crown.
- **shoulderL** / **shoulderR** — pauldron plates, boxes ~70×60×50 mm each,
  `0xc9a227`.
- **back** (×2, wings) — large flattened cones, ~30×220×340 mm each,
  `0x8a7328`, angled outward and swept back rather than spread, per the
  usually-folded on-screen wings.
- **tailbone** — a scorpion tail: a single tapering cylinder curving up and
  forward from the tailbone anchor, ~24×160×24 mm tapering to a point,
  `0xc9a227`, tipped with a small dark stinger cone (~14×20×14 mm,
  `0x3a2a1e`).
- **handR** — a sword: a long thin box blade, ~16×300×16 mm, `0xd8d8d8`,
  held at rest.

**Silhouette check**: a hulking, angular gold-armored figure with swept
bronze wings and a curling tail rising behind the hip — the only fully
gold-clad, winged, tailed member in the pack, unmistakable as monstrous
muscle even in silhouette, distinct from Rita's gown and the Rangers'
solid single-color suits.

**Personality**: `bobMul: 0.6, swayMul: 0.4, cadenceMul: 0.7, ampMul: 0.9`
(heavy, swaggering, monstrous stride — slow but powerful)
**Bubbles**: `🗡️🐒🔥😠` (sword combat, his monkey/manticore-like nature,
fiery menace, loyal wrath carrying out Rita's orders)

## Rig gaps

- **`skin` has no independent hand-color channel** (affects 6 of 10
  members here: all six Ranger suits, plus Alpha 5). Every Ranger's canon
  look pairs a saturated helmet with WHITE gloves/boots; this rig's `skin`
  field colors head AND hands together, so this doc's Rangers render with
  suit-colored hands instead of white gloves — a deliberate, documented
  trade-off (see Overview) favoring the far more identity-critical helmet
  color. This is the THIRD pack in the doc corpus to hit this exact gap
  (after `video-games/mario.md` and `video-games/metroid.md`), which makes
  a stronger case for an independent hand-color field (or a `hands` color
  override alongside the existing shape choice) than either prior
  single-instance note did alone.
- **No animated eye-flash/pulse channel, distinct from the static `emI`
  glow.** Alpha 5's single most identifying trait is a red visor-bar that
  flashes rhythmically while he talks — not a constant glow. The current
  rig only exposes a fixed `emI` intensity; this pack approximates the
  character with a modest constant glow instead of a true flash. Related
  to, but more specific than, the existing ROADMAP "Animated appendages"
  bullet (tail sway / wing flap / ear posing) — none of those cover an
  eye-light pulse.
- **Humanoid `tailbone` anchor stretched onto a bipedal "monster" member
  for the first time in this pack (Goldar).** It already exists and works
  (documented for both rigs in `avatars.ts`), so this is a note, not a
  gap — flagged only because prior sci-fi docs hadn't exercised it on a
  humanoid.
- Everything else this pack needed (pauldrons via `shoulderL`/`shoulderR`,
  a held glowing-orb wand via a `handR` accessory, a legless hovering being
  via `hover`, a partial-height hip skirt as a shorter variant of the
  existing gown-cone recipe) was already covered by existing fields/
  anchors or prior-pack recipes — see `docs/ROADMAP.md` § "Avatar rig gaps"
  for the full parked list (fabric patterns/prints, which would otherwise
  cover the suits' diamond-plate trim, are already tracked there).

## Sources

- [Mighty Morphin Power Rangers — Wikipedia](https://en.wikipedia.org/wiki/Mighty_Morphin_Power_Rangers)
- [The Original Power Rangers Cast & Their Color — CBR](https://www.cbr.com/power-rangers-original-cast-colors/)
- [Every Mighty Morphin' Power Rangers' Color, Main Weapon, Forms, Age, Height & Zords — Game Rant](https://gamerant.com/every-mighty-morphin-power-rangers-color-weapon-age-height-zord/)
- [Every Power Rangers Suit Ever Created For Movies And Television — ScreenRant](https://screenrant.com/every-power-rangers-suit-movies-tv/)
- [Power Rangers Calls Out the Pink Ranger's Controversial 90s Costume — ScreenRant](https://screenrant.com/power-rangers-pink-ranger-skirt-costume/)
- [Tommy Oliver — Wikipedia](https://en.wikipedia.org/wiki/Tommy_Oliver)
- [Tommy Oliver (Green) — RangerWiki, Fandom](https://powerrangers.fandom.com/wiki/Tommy_Oliver/Green)
- [Dragon Shield — Ranger Retrocenter](https://ranger-retrocenter.com/seasons/01-mighty-morphin-power-rangers/mmpr-arsenal/dragon-shield/)
- [Zordon — Wikipedia](https://en.wikipedia.org/wiki/Zordon)
- [Zordon | RangerWiki | Fandom](https://powerrangers.fandom.com/wiki/Zordon)
- [Power Rangers: Zordon's Origins, Explained — Game Rant](https://gamerant.com/power-rangers-zordon-origins-explained/)
- [Alpha 5 (Power Rangers) — Wikipedia](https://en.wikipedia.org/wiki/Alpha_5_(Power_Rangers))
- [Alpha 5 | RangerWiki | Fandom](https://powerrangers.fandom.com/wiki/Alpha_5)
- [Power Rangers: 17 Things You Didn't Know About Alpha-5 — ScreenRant](https://screenrant.com/alpha-5-power-rangers-movie-tv-show-trivia/)
- [Rita Repulsa — Wikipedia](https://en.wikipedia.org/wiki/Rita_Repulsa)
- [Rita Repulsa | RangerWiki | Fandom](https://powerrangers.fandom.com/wiki/Rita_Repulsa)
- [Power Rangers Rita Repulsa Costume — Costume Works](https://www.costume-works.com/rita-repulsa.html)
- [Goldar — Wikipedia](https://en.wikipedia.org/wiki/Goldar)
- [Goldar | RangerWiki | Fandom](https://powerrangers.fandom.com/wiki/Goldar)
- [Power Rangers: 15 Things You Didn't Know About Goldar — ScreenRant](https://screenrant.com/power-rangers-goldar-tv-show-movies-trivia-facts/)
- General character/appearance knowledge of *Mighty Morphin Power Rangers*'
  original cast and Rita-era villains, as broadly documented across
  RangerWiki/Fandom character pages and mainstream entertainment-press
  retrospectives.
