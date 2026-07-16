# Avatar pack: Genshin Impact

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no on-model face sculpts, no names printed anywhere in-scene; character
identity lives only in this doc's Reference lines and the pack's display
labels.

## Overview

- **Group**: The mascot, playable protagonist, and six of the most-recognized
  playable characters from HoYoverse's open-world gacha RPG *Genshin
  Impact* — spanning the game's earliest widely-known roster (a launch
  five-star, the game's mascot and its own protagonist) through its most
  iconic later additions (an Archon and a fan-favorite support). Every member
  reads as visually distinct at a glance thanks to a saturated, elemental-
  themed color per character (fire red, wind green, geo amber/brown, electro
  violet, cryo blue) — the same throughline the shipped `zelda.md` and
  `metroid.md` docs use for their own casts.
- **Hierarchy path**: `Video Games / Genshin Impact`
- **Member count**: 8
- **Rig**: humanoid only — no quadrupeds in this pack. One member (`paimon`)
  is a **legless floating fairy** using the rig's `hover` field (mm of
  permanent float + bob) exactly as documented for the base rig — the same
  mechanism already covers any levitating creature, so no new rig work is
  needed for her signature floating-companion silhouette.
- **Shared base spec** (all members start here, then override):
  ```
  sk: 1.0
  headR: 124
  headShape: 'sphere'
  limbR: 1.0
  hands: 'sphere'
  eyes: 'almond'
  steel: false
  emI: 0
  armL: 1.0
  legL: 1.0
  footMul: [1.0, 1.0, 1.0]
  ```
- **Shared palette — one signature elemental hue per character**:
  - Paimon celestial white/rose-gold — `0xf5f0e8` body, `0xd9a66c` rose-gold
    trim (her halo tiara and accents — used sparingly, never a full fill)
  - Traveler blue-white traveler's cape — `0xdbe9f2` (shared by both twins'
    default outfits, their one common costume color)
  - Diluc Pyro red/black — `0xb02020` hair, `0x181818` overcoat black
  - Klee Pyro coat red — `0xc23030` (a warmer, brighter red than Diluc's —
    intentionally distinct so the two Pyro-vision members don't read as
    recolors of each other)
  - Venti Anemo green — `0x2f8f4e` (shorts/cape), aqua hair-tip accent
    `0x66d9c9`
  - Zhongli Geo amber/brown — `0x8a5a2a` waistcoat amber, `0x3b2a1e` dark
    brown tailcoat
  - Raiden Shogun Electro violet — `0x3a1f52` bodysuit, `0xb89bd9` lavender
    kimono overlay
  - Ganyu Cryo blue — `0x4a90c4` hair fading to `0x2a5a80`, black-red horns
    `0x2a1010`/`0xb02020`
  - Gold accent (visions, jewelry, trim) — `0xd4af37`, reused sparingly
    across nearly every member as their in-world Vision color, without
    ever becoming a whole-body fill.
- **Pack-wide convention — the Traveler twins**: Aether and Lumine are two
  outfit/gender presentations of the same player-inserted protagonist, not
  two separate characters, so this pack renders **one** `traveler` member
  using their single shared costume element (the pale blue-white traveler's
  cape + gold trim) rather than modeling both as separate slots — matching
  how the game's own promotional key art typically settles on one default
  per region while treating the two as interchangeable. Distinguishing hair
  treatment (Aether's feathered braid vs. Lumine's petal hairpins) is noted
  in the Reference line but folded into a single neutral silhouette so the
  member isn't gender-locked.
- **Selection notes**: Genshin's full five-star roster runs into the
  dozens, so this pack is deliberately capped at the characters a casual
  fan or onlooker names first — the mascot (Paimon), the protagonist
  (Traveler), the game's very first "poster" five-star (Diluc), its
  most talked-about early support/damage dealer (Klee), and three
  Archons/flagship later characters (Venti, Zhongli, Raiden Shogun) plus
  one of the most consistently popular supports across the game's history
  (Ganyu). Dozens of other five-stars (Hu Tao, Ayaka, Xiao, Childe, Nahida,
  etc.) were considered and cut to stay within the primary-cast rule —
  a second Genshin pack (e.g. a later-region "Inazuma" or "Sumeru" set)
  would be the right place for them rather than exceeding ~12 here.

## Members

### 1. `sky-fairy` — "Sky companion (small, white hair, floating halo)"

- **id**: genshin-impact/sky-fairy · **label**: "Sky companion (small,
  white hair, floating halo)"
- **Reference**: The game's ever-present floating narrator and guide — a
  small, childlike fairy with shoulder-length curly white hair, large
  purple eyes, and a white-and-rose-gold jumper; she never touches the
  ground, instead hovering everywhere she goes, and wears a rose-gold
  halo-shaped tiara that itself floats just above her head, plus a single
  sock on one leg (the other bare) as her one asymmetrical, whimsical
  detail. (Paimon.)
- **Spec**:
  ```
  sk: 0.45              // floor value — she's the smallest member in the pack
  headR: 100            // big head-to-body ratio, chibi/fairy proportions
  headShape: 'sphere'
  limbR: 0.6
  skin: 0xf3ddc4        // pale fair skin
  body: 0xf5f0e8        // white-and-rose-gold jumper, off-white base
  legColor: 0xf5f0e8
  shoe: 0xe8c9a0         // bare foot tone on one side (see limbColors)
  emI: 0
  eyes: 'dots'            // large round eyes, read as purple in reference only
  hands: 'sphere'
  hover: 650              // permanent float height — she never touches ground
  armL: 0.85
  legL: 0.8
  footMul: [0.85, 0.8, 0.85]
  limbColors: { legL: 0xf5f0e8 }   // one leg keeps a white "sock" tone,
                                    // the other (legR, left at shoe/legColor
                                    // default) reads bare — her one
                                    // asymmetrical, whimsical detail
  ```
- **Accessories**:
  - **crown** — puffy curled white hair mass, a rounded box/sphere blend
    ~130×90×130 mm, `0xf7f5ef`, framing the whole head.
  - **crown** (halo tiara) — a thin flattened disc floating just above the
    hair, ~90×10×90 mm, rose-gold `0xd9a66c` — the closest approximation
    available to a hollow ring (see Rig gaps: no torus primitive).
  - **head** (small star accessory) — a tiny dark star-shaped cone cluster
    pinned in the hair, ~18×18×18 mm, `0x2a2a3a`.
  - **back** — a short celestial cape, a flattened tapered box
    ~110×140×15 mm, deep navy `0x1c2540`, with 2–3 tiny pale-gold dot
    accents (`0xd9a66c`, ~6 mm spheres, proud of the surface) standing in
    for the embroidered constellations.
  - **chest** — a small dark inverted-triquetra emblem, approximated as
    three tiny overlapping flattened rings/boxes, ~30×30×6 mm total,
    `0x2a2a3a`, centered on the jumper.
- **Silhouette check**: a small childlike figure with NO visible ground
  contact (she hovers via `hover`), topped by a puffy white hair mass and a
  distinct rose-gold disc floating above it, is unmistakable even as a
  30px blob — no other member in this pack (or, per `zelda.md`/`metroid.md`,
  any shipped pack) permanently floats.
- **Personality**: `bobMul: 1.5, swayMul: 1.3, cadenceMul: 1.1, ampMul: 0.6`
  (a light, buoyant, ever-bobbing float rather than a walk — exaggerated
  vertical drift, minimal forward lean)
- **Bubbles**: `⭐🍞😋❗` (starry/celestial motif, her running food-obsession
  gag, delight, exclamation/alarm)

---

### 2. `sword-explorer` — "Traveler (blond, elemental sword, star pendant)"

- **id**: genshin-impact/sword-explorer · **label**: "Traveler (blond,
  elemental sword, star pendant)"
- **Reference**: The player-controlled protagonist searching Teyvat for
  their lost twin sibling — a blond, gold-eyed young adventurer in a
  white-and-blue traveler's cape over a dark vest, carrying a sword and a
  small glowing elemental Vision pendant. The two selectable
  presentations (a feathered braid and dark breastplate vest for one twin,
  chin-length hair with flower hairpins and a blue-and-white dress for the
  other) share the same pale blue-white cape and gold trim, which is what
  this member's silhouette is built around. (Aether / Lumine, the
  Traveler.)
- **Spec**:
  ```
  sk: 1.0
  headR: 122
  headShape: 'sphere'
  limbR: 0.95
  skin: 0xe8c4a0        // fair skin
  body: 0x3b3228        // dark vest/bodice base
  legColor: 0x2a2622    // dark trousers/skirt
  shoe: 0x1c1c1c         // black boots
  eyes: 'almond'          // gold eyes
  emI: 0
  hands: 'sphere'
  armL: 1.0
  legL: 1.0
  ```
- **Accessories**:
  - **crown** (hair) — a swept-back blond hair mass, a rounded box
    ~120×80×110 mm, `0xf0d878`, gathered toward the back.
  - **back** (hair tail) — a single long tied-back lock/braid, a tapered
    cylinder ~30×260×30 mm, `0xf0d878`, hanging center-back.
  - **back** (cape) — the signature pale blue-white traveling cape, a
    flattened tapered box ~150×280×15 mm, `0xdbe9f2`, with a thin gold
    trim strip along the hem (`0xd4af37`, ~150×10×4 mm, proud of the
    cape surface).
  - **chest** — a small glowing Vision pendant on a cord, a tiny hexagon
    approximated as a flattened box, ~24×24×10 mm, gold `0xd4af37` with a
    faint pale-blue emissive core (`emissive: 0x8fd0e0,
    emissiveIntensity: 0.3`).
  - **neck** — a folded white scarf clasped with a small gold clip, a
    short soft band ~90×30×20 mm, `0xf5f2ea`, with a tiny gold clip square
    (~14×14×6 mm, `0xd4af37`).
  - **hip** (sheathed sword) — a slim cylinder hilt-up at the hip,
    ~20×220×20 mm blade tone `0xd6d6da` with a small gold cross-guard
    (~60×12×12 mm, `0xd4af37`).
- **Silhouette check**: the pale blue-white cape with its gold hem trim,
  worn over an otherwise dark, plain traveler's outfit, plus the small
  glowing chest pendant, is this pack's only "explorer in transit" read —
  distinct from every other member's more ornate, stationary court/combat
  costuming.
- **Personality**: `bobMul: 1.0, swayMul: 0.8, cadenceMul: 1.0, ampMul: 1.0`
  (an even, purposeful adventurer's stride — default energy, always moving
  toward the next destination)
- **Bubbles**: `⚔️✨🧭❓` (sword, elemental magic, exploration/compass, the
  ongoing search for their sibling)

---

### 3. `crimson-vintner` — "Vintner (red hair, black-and-gold coat)"

- **id**: genshin-impact/crimson-vintner · **label**: "Vintner (red hair,
  black-and-gold coat)"
- **Reference**: The stoic owner of Mondstadt's most famous winery by day
  and its masked vigilante protector by night — tall, fair-skinned, with
  red hair swept into a low ponytail, wearing an elegant black overcoat
  with gold trim over a white shirt and black tie pinned with a red gem.
  (Diluc.)
- **Spec**:
  ```
  sk: 1.08              // tall, broad-shouldered adult
  headR: 128
  headShape: 'sphere'
  limbR: 1.05
  skin: 0xe8c2a0        // fair skin
  body: 0x181818        // black overcoat
  legColor: 0x1c1c1c    // black trousers
  shoe: 0x141414         // black boots
  eyes: 'almond'          // fiery red-eyed, reference only
  emI: 0
  hands: 'box'             // black gloves
  steel: false
  armL: 1.1
  legL: 1.05
  ```
- **Accessories**:
  - **crown** (hair) — swept-back red hair with a center part, a rounded
    box ~120×80×115 mm, `0xb02020`.
  - **back** (ponytail) — a long low ponytail, a tapered cylinder
    ~30×240×30 mm, `0xb02020`, hanging center-back.
  - **chest** — a black tie with a small red gem, a thin vertical band
    ~30×140×8 mm `0x101010` with a red gem square at the collar
    (~18×18×8 mm, `0xc23030`), plus a thin gold pattern trim line along
    the coat's lapel (`0xd4af37`, ~body-width×8×4 mm, proud of the
    fabric).
  - **back** (coattails) — a long split overcoat tail, a flattened
    tapered box ~140×320×15 mm, `0x181818`, with a thin gold edge trim
    (`0xd4af37`).
  - **shoe** (×2, gem accents) — small red gem studs at each boot side,
    tiny flattened boxes ~14×14×6 mm, `0xc23030`.
- **Silhouette check**: the tall, broad black silhouette with its long
  split coattails, red low ponytail, and single red gem at the throat
  reads instantly as a somber, formal "night guardian" — the darkest and
  most monochrome member in the pack, distinct from every other costume's
  brighter palette.
- **Personality**: `bobMul: 0.55, swayMul: 0.4, cadenceMul: 0.75, ampMul: 0.9`
  (a measured, composed, unhurried gait — reserved by day, but every
  motion carries controlled strength)
- **Bubbles**: `🍷🔥⚔️🌙` (his winery, his Pyro Vision/fire power, his
  vigilante blade, the night he patrols)

---

### 4. `spark-scout` — "Spark scout (child, red coat, newsboy cap)"

- **id**: genshin-impact/spark-scout · **label**: "Spark scout (child,
  red coat, newsboy cap)"
- **Reference**: A cheerful, precocious child prodigy and explosives
  expert — pale-skinned with orange eyes, elf-like ears, and blonde hair
  in pigtails, wearing a bright red coat with keyhole cutouts over a white
  dress, a large red newsboy cap pinned with a clover badge and two white
  feathers, and a brown backpack carrying her small furry companion
  charm. (Klee.)
- **Spec**:
  ```
  sk: 0.55               // child proportions, larger than the Korok-scale
                          // sapling in `zelda.md` but still well under adult
  headR: 102
  headShape: 'sphere'
  limbR: 0.65
  skin: 0xf3d9c0         // pale skin
  body: 0xc23030         // bright red coat
  legColor: 0xf5f2ea     // white dress/shorts underneath
  shoe: 0x6e4020          // brown boots
  eyes: 'dots'             // large round child eyes, orange in reference
  emI: 0
  hands: 'sphere'
  earSkip: false           // elf-like ears kept visible (small, per reference)
  armL: 0.7
  legL: 0.65
  footMul: [0.9, 0.85, 0.9]
  ```
- **Accessories**:
  - **crown** — the red newsboy cap, a wide flattened dome, ~130×70×130 mm,
    `0xa82828` (a shade darker than the coat so cap and coat don't flatten
    into one mass), raised + tilted back per the standard hat-clearance
    rule so its front brim clears the eye band; a small clover badge
    (~16×16×6 mm, `0x2f8f4e`) and two small white feather slivers
    (~8×30×4 mm, `0xf5f2ea`) pinned to one side.
  - **head** (×2, pigtails) — blonde pigtail bunches, small rounded boxes
    ~55×70×55 mm each, `0xf0d878`, at the head sides.
  - **chest** (keyhole trim) — a darker red keyhole-shaped cutout accent
    on the coat front, a small flattened diamond ~34×44×6 mm,
    `0x8a1f1f`, proud of the coat surface.
  - **back** — a small brown backpack (randoseru-style), a rounded box
    ~90×110×50 mm, `0x6b4a2e`, with a tiny tan pom-pom charm
    (~24 mm sphere, `0xd9b98a`) hanging off one side standing in for her
    plush companion.
  - **neck** — a fluffy white scarf with a small pom-pom, a short puffy
    band ~90×34×24 mm, `0xf5f2ea`, with a small round pom-pom accent
    (~20 mm sphere, `0xf5f2ea`) at the front.
- **Silhouette check**: the bright red coat + oversized red newsboy cap
  atop blonde pigtail bunches, paired with a small brown backpack, is
  instantly "excitable kid explorer" at 30px — the brightest, most
  saturated red in the pack (distinct from the vintner's much darker,
  cooler red) and the only member wearing a soft cap rather than a crown,
  helm, horns, or bare head.
- **Personality**: `bobMul: 1.3, swayMul: 1.1, cadenceMul: 1.25, ampMul: 0.75`
  (a bouncy, high-energy skip — short quick strides with an exaggerated
  bob, a kid who's always eager to move)
- **Bubbles**: `💣🌸😆✨` (her signature explosives, a flower/blast motif,
  gleeful laughter, sparkle/excitement)

---

### 5. `wind-bard` — "Wind bard (green cape, feathered beret)"

- **id**: genshin-impact/wind-bard · **label**: "Wind bard (green cape,
  feathered beret)"
- **Reference**: A carefree traveling bard often found busking in
  Mondstadt's square — slender, fair-skinned, with dark blue-black hair in
  short twin braids fading to aqua at the tips, aqua-green eyes, and an
  airy white frilled top with green shorts, a matching green cape tied
  with a deep-blue-and-gold bow, and a wide green beret-like hat pinned
  with a pale flower. (Venti.)
- **Spec**:
  ```
  sk: 0.92               // slim, youthful build
  headR: 118
  headShape: 'sphere'
  limbR: 0.85
  skin: 0xecc4a0         // fair skin
  body: 0xf5f2ea         // white frilled top
  legColor: 0x2f8f4e     // green shorts
  shoe: 0xf5f2ea          // white stockings/boots
  eyes: 'almond'           // aqua-green eyes
  emI: 0
  hands: 'sphere'
  armL: 0.9
  legL: 1.0
  ```
- **Accessories**:
  - **crown** — the wide green beret, a flattened wide disc, ~150×40×150 mm,
    `0x2f8f4e`, raised + tilted back per the standard hat-clearance rule; a
    small pale flower accent (a tiny sphere cluster, ~24 mm, `0xf5f2ea`
    petals with a `0xd9c458` center) pinned to one side.
  - **head** (×2, braid tips) — short twin braids, small tapered
    cylinders ~24×90×24 mm, dark navy `0x161a2e` at the crown fading to a
    separate aqua tip accessory (~24×24×24 mm sphere, `0x66d9c9`) at each
    braid's end — approximated as two pieces per braid since a single
    accessory can't blend two tones (see Rig gaps).
  - **back** — the green cape, a flattened tapered box ~140×280×15 mm,
    `0x2f8f4e`, with a deep-blue-and-gold bow accent at the shoulder
    (a small flattened box, ~40×50×10 mm, `0x1e4fa0`, plus a thin gold
    trim strip, `0xd4af37`).
  - **chest** — a thin gold embroidery trim line across the frilled top's
    corset seam, ~body-width×10×4 mm, `0xd4af37`, proud of the fabric.
  - **hip** (×2, leg diamond accents) — small gold diamond studs on the
    stockings, tiny flattened boxes ~16×16×6 mm each, `0xd4af37`.
- **Silhouette check**: the wide flat green beret over dark-to-aqua twin
  braids, paired with an all-white-and-green cape-and-shorts outfit, is
  the only member wearing a soft round hat AND green as a primary color —
  unmistakable next to the newsboy cap (red) and the horned/braided
  members with no hat at all.
- **Personality**: `bobMul: 0.85, swayMul: 1.0, cadenceMul: 0.95, ampMul: 0.85`
  (a loose, breezy, almost dancing gait — unhurried and playful, like a
  gust catching a cape)
- **Bubbles**: `🎵🍃🍷🎶` (music/his lyre, the wind, wine — his favorite
  drink and namesake shop tie-in, song)

---

### 6. `amber-contractor` — "Amber contractor (dark coat, dragon-scale trim)"

- **id**: genshin-impact/amber-contractor · **label**: "Amber contractor
  (dark coat, dragon-scale trim)"
- **Reference**: A composed, extraordinarily old consultant for
  Liyue's Wangsheng Funeral Parlor — dark brown hair with a longer
  amber-gradient fringe on one side, golden eyes, and an elegant outfit
  blending a Western tailcoat with a Chinese changpao: a beige shirt and
  amber waistcoat under a long dark brown tailcoat patterned with
  dragon-scale and phoenix-feather motifs in gold and silver, fastened
  with a white tie pinned by an amber gem. (Zhongli.)
- **Spec**:
  ```
  sk: 1.1                // tall, composed adult presence
  headR: 130
  headShape: 'sphere'
  limbR: 1.0
  skin: 0xe4bd96         // fair-medium skin
  body: 0x8a5a2a         // amber waistcoat
  legColor: 0x1c1a18     // black trousers
  shoe: 0x141210          // black dress boots
  eyes: 'almond'           // amber eyes, diamond pupils in reference
  emI: 0
  hands: 'box'             // black gloves
  armL: 1.0
  legL: 1.0
  ```
- **Accessories**:
  - **crown** (hair) — short dark brown hair, a rounded box
    ~118×75×112 mm, `0x3b2a1e`.
  - **head** (side fringe) — a single longer fringe lock at one side, a
    tapered cylinder ~20×90×20 mm, base `0x3b2a1e` fading to a separate
    amber tip accessory (~20×20×20 mm sphere, `0xd9902a`, faintly
    emissive `emissiveIntensity: 0.15`) — same two-piece gradient
    approximation as the wind bard's braid tips.
  - **chest** — a white tie pinned with an amber gem, a thin vertical
    band ~26×130×8 mm `0xf5f2ea` with a gem square at the collar
    (~18×18×8 mm, `0xd9902a`).
  - **back** — the long dark brown tailcoat, a flattened tapered box
    ~150×360×18 mm, `0x3b2a1e`, with a thin gold-and-silver trim strip
    down the center back (`0xd4af37` and `0xc7c9d1` alternating short
    segments, proud of the coat surface) standing in for the dragon-scale/
    phoenix-feather embroidery.
  - **hand** (×2, rings) — small silver rings at the thumbs, tiny
    flattened cylinders ~12×6×12 mm, `0xc7c9d1`.
- **Silhouette check**: the long dark brown tailcoat with its gold-silver
  center-back trim, worn over an amber waistcoat, paired with a single
  amber-tipped side fringe, reads as "composed elder statesman" — the
  only member combining brown-and-gold with formal Western-tailcoat
  proportions rather than a cape, kimono, or child's coat.
- **Personality**: `bobMul: 0.4, swayMul: 0.25, cadenceMul: 0.65, ampMul: 0.75`
  (an unhurried, weighty, utterly composed gait — nothing about this
  figure is ever in a rush)
- **Bubbles**: `⚱️📜🍵💰` (his geo/contract nature, ancient history and
  lore, a quiet tea break, and the game's own running joke about him
  perpetually being broke)

---

### 7. `thunder-regent` — "Thunder regent (violet kimono, braided hair)"

- **id**: genshin-impact/thunder-regent · **label**: "Thunder regent
  (violet kimono, braided hair)"
- **Reference**: The eternity-obsessed ruling Archon of Inazuma — long
  violet braided hair adorned with a fan-shaped hairpin, purple eyes, and
  a striking outfit layering a dark purple bodysuit under a very short
  lavender kimono skirt trimmed in tomoe and wave patterns, cinched with a
  crimson obi bow, with a black pauldron on one shoulder marking her
  Electro authority. (Raiden Shogun / Ei.)
- **Spec**:
  ```
  sk: 1.05
  headR: 122
  headShape: 'sphere'
  limbR: 0.95
  skin: 0xecc4a0         // fair skin
  body: 0x3a1f52         // dark violet bodysuit
  legColor: 0x2a1640     // dark purple thigh coverage
  shoe: 0x1c1030          // dark purple/black sandals
  eyes: 'almond'           // purple eyes, reference-only color shift
  emI: 0.05                 // faint sheen on the bodysuit
  hands: 'sphere'
  armL: 0.95
  legL: 1.0
  ```
- **Accessories**:
  - **crown** (hair) — hair swept back into a long braid start, a rounded
    box ~118×78×112 mm, `0x6a4d9c`.
  - **back** (braid) — the long violet braid, a tapered cylinder
    ~28×260×28 mm, `0x6a4d9c`.
  - **head** (kanzashi hairpiece) — a fan-shaped hairpin at one side, a
    small flattened cone/box, ~50×60×14 mm, gold `0xd4af37` with two tiny
    pale-violet flower accents (~14 mm spheres, `0xc9a8e0`).
  - **hip** (kimono skirt) — the short lavender kimono layer, a cone
    ~body-width×160×body-width mm, `0xb89bd9`, trimmed at the hem with a
    thin gold-and-purple pattern band (`0xd4af37`/`0x6a4d9c` alternating
    short proud segments).
  - **hip** (obi bow) — a crimson sash bow at the back of the waist, a
    small flattened box, ~70×50×20 mm, `0xa02030`.
  - **shoulderL** — a black pauldron, a small flattened box,
    ~70×55×50 mm, `0x161616`, with a faint violet Electro-symbol accent
    (a tiny hexagon approximated as a flattened box, ~20×20×6 mm,
    `0x6a4d9c`, `emissiveIntensity: 0.2`).
  - **chest** (neck ribbon) — a small red ribbon at the throat, a thin
    band ~40×20×8 mm, `0xa02030`.
- **Silhouette check**: the very short lavender kimono-skirt-over-bodysuit
  layering, crimson obi bow, and single black pauldron on one shoulder
  read instantly as "regal warrior-ruler" — the only member combining a
  cinched sash silhouette with an asymmetric shoulder armor piece, and the
  only violet-dominant costume in the pack.
- **Personality**: `bobMul: 0.35, swayMul: 0.2, cadenceMul: 0.6, ampMul: 0.7`
  (a rigid, formal, almost ceremonial gait — measured steps befitting an
  eternal ruler who never appears rushed)
- **Bubbles**: `⚡🗡️♾️🍡` (her Electro power, her katana, her fixation on
  eternity/permanence, and dango — a running gag about her love of the
  sweet skewered dessert)

---

### 8. `frost-envoy` — "Frost envoy (blue hair, black-red horns)"

- **id**: genshin-impact/frost-envoy · **label**: "Frost envoy (blue hair,
  black-red horns)"
- **Reference**: A famously overworked secretarial adeptus in Liyue's
  Qixing government, secretly a qilin (a horned, part-divine being) —
  cerulean-blue hair fading darker at the tips, sectoral heterochromia
  eyes, black-red goat-like horns curving back along her hairline
  (frequently mistaken by other characters for a headdress), and an
  outfit combining a black bodysuit with a white bodice/tailcoat trimmed
  in blue triangular accents, a small gold bell worn at the neck. (Ganyu.)
- **Spec**:
  ```
  sk: 0.95
  headR: 116
  headShape: 'sphere'
  limbR: 0.85
  skin: 0xecc8a8         // fair skin
  body: 0x151515         // black bodysuit
  legColor: 0x151515     // black tights
  shoe: 0x8a8a8a          // gray heels
  eyes: 'almond'           // sectoral purple-to-pink-gold heterochromia,
                            // reference-only
  emI: 0
  hands: 'sphere'
  armL: 0.9
  legL: 1.0
  ```
- **Accessories**:
  - **crown** (hair) — cerulean-blue hair bunched at the crown, a rounded
    box ~112×76×108 mm, `0x4a90c4`, fading toward a darker accessory mass
    at the tips (~40×60×40 mm, `0x2a5a80`) at the back — the same
    two-piece gradient approximation used for the wind bard/amber
    contractor's hair tips.
  - **crown** (×2, horns) — black-red goat-like horns curving back along
    the hairline, slim curved cones ~22×90×22 mm each, `0x2a1010` with a
    brighter red marking accent near the tip (~10 mm band, `0xb02020`),
    angled back ~50° from vertical — this pack's single most important
    "not human" tell, per the CLAUDE.md hat/horn clearance rule (raised +
    tilted back so the base clears the brow).
  - **chest** — the white bodice/tailcoat panel with blue triangular
    trim, a flattened box ~body-width×180×15 mm, `0xf5f2ea`, with small
    blue triangular accent wedges (small flattened cones, `0x2f6fa0`,
    proud of the panel) along its edges.
  - **neck** — a small gold bell on a cord, a tiny sphere ~24 mm,
    `0xd4af37`.
  - **back** — a short white tailcoat tail extending from the bodice, a
    flattened tapered box ~90×120×12 mm, `0xf5f2ea`, with a matching blue
    triangular hem trim (`0x2f6fa0`).
- **Silhouette check**: the black-red curved horns sweeping back from a
  blue-haired head, over an otherwise slim black-and-white silhouette, is
  unmistakable — the only member with visible horns (distinct from the
  demon-king tusks or Goron ridge-plates in `zelda.md`, which read as
  bulk/menace rather than a slender court-attendant read).
- **Personality**: `bobMul: 0.6, swayMul: 0.4, cadenceMul: 0.8, ampMul: 0.65`
  (a prim, efficient, no-wasted-motion gait — someone perpetually
  catching up on an overflowing workload)
- **Bubbles**: `❄️🏹📋🔔` (her Cryo power, her signature bow, an
  overflowing paperwork/overwork running gag, the bell she wears)

## Rig gaps

- **No ring/torus primitive.** Paimon's signature floating halo tiara is a
  true hollow ring; the generator's `box|sphere|cylinder|cone` accessory
  set has no way to leave a hole through the middle, so it's approximated
  here as a thin solid flattened disc. A torus (or a "ring" primitive
  built from a thin annular cylinder) would generalize to any future
  angelic/halo-wearing character.
- **No gradient/two-tone material within a single accessory.** Three
  members in this pack have hair (or a fringe lock) that visibly fades
  from one color to another along its length — Venti's dark-navy-to-aqua
  braid tips, Zhongli's dark-brown-to-amber fringe, and Ganyu's
  cerulean-to-darker-blue hair — and all three are approximated with TWO
  separate accessory pieces (a base-color mass plus a differently-colored
  tip mass) rather than one smoothly blended strand. A vertex-color or
  two-stop-gradient material option on accessories would clean up this
  increasingly common "ombré hair" look, which is likely to recur in any
  future anime-style pack.
- **No reactive/triggered emissive state.** Several of this pack's
  signature details are canonically dynamic rather than static — Zhongli's
  hair tips and the Raiden Shogun's eye color both shift or glow only
  when the character is actively using their elemental ability. This doc
  renders them with a small constant `emissiveIntensity` instead (a
  reasonable static approximation), but a state-driven "flares brighter
  during X" material hook doesn't exist yet — likely most reusable for
  any future "elemental power" character pack. Related to, but distinct
  from, the already-parked "eye color overrides" gap in
  `docs/ROADMAP.md` § Avatar rig gaps (which covers Raiden Shogun's
  reference-only shifting eye hue and Ganyu's sectoral heterochromia —
  both left as reference-only notes here too, no new gap needed for
  those).

## Sources

- [Paimon — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/Paimon)
- [Paimon/Companion — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/Paimon/Companion)
- [Everything You Need to Know About Paimon in Genshin Impact — GameBoost](https://gameboost.com/blog/paimon-genshin-impact-guide)
- [As Heaven and Earth Are Made Anew — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/As_Heaven_and_Earth_Are_Made_Anew)
- [Rising Star — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/Rising_Star)
- [Traveler (Genshin Impact) — Heroes Wiki (Fandom)](https://hero.fandom.com/wiki/Traveler_(Genshin_Impact))
- [Red Dead of Night — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/Red_Dead_of_Night)
- [Darknight Blaze — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/Darknight_Blaze)
- [Diluc — Sportskeeda](https://www.sportskeeda.com/esports/diluc-genshin-impact)
- [Shooting Spark — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/Shooting_Spark)
- [Klee — Heroes Wiki (Fandom)](https://hero.fandom.com/wiki/Klee)
- [Klee — Sportskeeda](https://www.sportskeeda.com/esports/klee-genshin-impact)
- [Breezy Ode — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/Breezy_Ode)
- [Venti (Genshin Impact) — Wikipedia](https://en.wikipedia.org/wiki/Venti_(Genshin_Impact))
- [Genshin Impact Venti: Character Design Detail Appreciation — GenshinFans](https://genshinfans.com/blogs/news/genshin-venti-character-design-detail)
- [Zhongli (Genshin Impact) — Wikipedia](https://en.wikipedia.org/wiki/Zhongli_(Genshin_Impact))
- [Zhongli Cosplay Guide — Eyecandys](https://eyecandys.com/blogs/news/zhongli-cosplay-guide-genshin-impact)
- [Zhongli — Sportskeeda](https://www.sportskeeda.com/esports/zhongli-genshin-impact)
- [Narukami's Law — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/Narukami's_Law)
- [Raiden Shogun — Sportskeeda](https://www.sportskeeda.com/esports/raiden-shogun-genshinimpact)
- [Ganyu/Profile — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/Ganyu/Profile)
- [Genshin Impact's Ganyu: Expert Cryo Archer — Avid Archer](https://avid-archer.com/genshin-impact-ganyu/)
- [Frostdew Trail — Genshin Impact Wiki (Fandom)](https://genshin-impact.fandom.com/wiki/Frostdew_Trail)
- `docs/avatars/video-games/zelda.md` (this repo) — the pointed-ear,
  demon-king/Goron-ridge, and hat-clearance conventions this pack follows.
- `docs/ROADMAP.md` § "Avatar rig gaps" — the parked eye-color-override
  gap this pack's reference-only heterochromia/shifting-eye notes map to.
