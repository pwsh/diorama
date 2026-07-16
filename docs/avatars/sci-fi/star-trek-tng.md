# Avatar pack: Star Trek — The Next Generation (bridge crew)

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no textures, no names printed anywhere in-scene; character identity lives only
in this doc's Reference lines and the pack's display labels.

## Overview

- **Group**: Starfleet bridge officers, USS Enterprise-D (TNG, 1987–1994)
- **Hierarchy path**: `sci-fi / star-trek / tng`
- **Member count**: 8
- **Rig**: humanoid only (no quadrupeds in this pack)
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
  legColor: 0x161616   // black uniform trousers, shared by every crew member
  shoe: 0x0d0d0d        // black boots, shared
  ```
- **Shared palette — TNG division colors** (uniform is worn as `body`; the
  uniform reads mostly as the division color with a black shoulder/collar
  yoke — see the yoke accessory note in Rig gaps):
  - Command (red) — `0x9c1c24` (muted burgundy-red, not fire-engine red)
  - Operations / gold — engineering + security — `0xc9982f` (mustard-gold, not bright yellow)
  - Sciences / blue — medical + counseling — `0x1f6e7a` (teal-blue, TNG's "blue" reads teal on camera)
  - Black yoke/collar accent — `0x161616` (shared with pants/boots)
  - Combadge — small gold accessory, `0xd4af37`, chest anchor, ~40×30×8 mm, every member
- **Pack-wide accessory**: **combadge** (chest anchor, small flattened gold
  box ~40×28×6 mm, centered upper-left chest, `0xd4af37`, slight emissive
  0.1) — present on every member, listed once here instead of per-member.
- **Pack-wide accessory**: **shoulder/collar yoke** — a thin black flattened
  box at the chest anchor's top edge (~body-width×0.95 wide × 18 mm tall ×
  10 mm deep, `0x161616`), simulating the black yoke that caps the division-
  color uniform top. This is an **approximation** — see Rig gaps.

## Members

### 1. `captain-bald` — "Captain (bald, red uniform)"

**Reference**: The bald, authoritative captain of the Enterprise-D — command
red uniform, upright bearing, diplomat and archaeologist as much as soldier.
(Jean-Luc Picard.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xe0b08c
body: 0x9c1c24      // command red
legColor: 0x161616
shoe: 0x0d0d0d
eyes: 'dots'
emI: 0
limbR: 1.0
```

**Accessories**
- (pack-wide combadge + yoke, see Overview)
- No hair accessory — bald head IS the silhouette; do not add a crown piece.

**Silhouette check**: bald head + red torso, held very upright/still (low
personality sway) — reads instantly as "the captain" even faceless at 30px.

**Personality**: `bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.95, ampMul: 0.85`
(measured, deliberate walk — command presence, no swagger)
**Bubbles**: `☕📖🖖🚀` (Earl Grey tea, archaeology books, Vulcan salute, exploration)

---

### 2. `commander-bearded` — "Commander (bearded, red uniform)"

**Reference**: The bearded first officer — command red uniform, broader
build, confident/relaxed swagger, jazz trombonist off-duty. (William Riker.)

**Spec**
```
sk: 1.02
headR: 128
headShape: 'sphere'
skin: 0xe0b08c
body: 0x9c1c24      // command red
legColor: 0x161616
shoe: 0x0d0d0d
eyes: 'dots'
limbR: 1.1
armL: 1.02
```

**Accessories**
- (pack-wide combadge + yoke)
- **face** — full beard: a dark rounded box wrapping the jaw/chin, ~90×50×70 mm,
  `0x3a2a1e`, positioned to cover jaw+chin+upper lip, sitting just below the
  generic mouth/nose so it reads as facial hair not a mask.
- **crown** — short cropped hairstyle: a low flattened sphere-cap, ~130×40×130 mm,
  `0x3a2a1e`, hugging the top/back of the head only (front rim stays above the brow).

**Silhouette check**: beard shadow on the jaw + red torso + slightly wider
stance (higher `swayMul`) — the confident lean-back posture is as recognizable
as the beard.

**Personality**: `bobMul: 1.05, swayMul: 1.15, cadenceMul: 1.0, ampMul: 1.1`
(confident, loose-limbed swagger)
**Bubbles**: `🎺🚀🖖😏` (trombone, exploration, salute, smirk)

---

### 3. `android-officer` — "Operations officer (android, gold)"

**Reference**: A fully synthetic android serving as second officer / operations
— pale gold-toned synthetic skin, gold operations uniform, perfectly precise
and controlled movement, curious about humanity. (Data.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xd9c99a       // pale gold synthetic skin (as specified)
body: 0xc9982f       // operations gold
legColor: 0x161616
shoe: 0x0d0d0d
eyes: 'dots'
steel: true          // subtle brushed-synthetic sheen over the skin tone
emI: 0.15            // slight glow hint — synthetic, not organic
limbR: 1.0
```

**Accessories**
- (pack-wide combadge + yoke)
- **crown** — short, straight, side-parted bowl-cut hairstyle: a low flattened
  sphere-cap ~132×38×132 mm, `0x1c1c1c` (near-black), hugging the head closely
  all the way around (front rim just above the brow) — distinct from Riker's
  cap in being uniform all around rather than tapered at the sides.

**Silhouette check**: the pale-gold skin tone against the gold uniform (skin
and uniform nearly matching-but-not-quite) plus an almost perfectly rigid,
minimal-sway gait is the tell — a human figure never stands *that* still.

**Personality**: `bobMul: 0.4, swayMul: 0.15, cadenceMul: 1.0, ampMul: 0.9`
(mechanically precise, minimal idle sway/fidget)
**Bubbles**: `🤖🎻🔬❓` (android, violin — Data's hobby, science, curiosity about being human)

---

### 4. `engineer-visor` — "Chief engineer (VISOR, gold)"

**Reference**: The ship's blind chief engineer, who sees via a signature
cybernetic VISOR spanning both eyes — gold operations uniform, upbeat,
technically obsessive. (Geordi La Forge.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0x6b4423
body: 0xc9982f       // operations gold
legColor: 0x161616
shoe: 0x0d0d0d
eyes: 'visor'        // REQUIRED — the defining trait
emI: 0.05
limbR: 1.0
```

**Accessories**
- (pack-wide combadge + yoke)
- **face** — VISOR hardware band reinforcing the `eyes:'visor'` render: a thin
  flattened cylinder/box spanning temple-to-temple across the eye line,
  ~150×18×14 mm, brushed silver `0xb0b0b0`, slight emissive 0.1 (catches light
  like metal/optics), sitting proud of the face by a few mm.
- **crown** — short, close-cropped hair cap, ~130×36×130 mm, `0x1c1c1c`.

**Silhouette check**: the silver VISOR band across the eyes is completely
unmistakable even at 30px — this is the one member where the `eyes:'visor'`
style alone carries the whole read.

**Personality**: `bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.15, ampMul: 1.05`
(energetic, quick, enthusiastic gait — an engineer in a hurry)
**Bubbles**: `🔧💡🖖🚀` (tools, ideas/eureka, salute, engineering pride)

---

### 5. `klingon-security-chief` — "Security chief (Klingon, gold)"

**Reference**: The Enterprise's Klingon security chief and tactical officer —
cranial forehead ridges, tall/broad build, operations gold uniform, wears a
silver ceremonial sash across the chest honoring his Klingon house. (Worf.)

**Spec**
```
sk: 1.08
headR: 132
headShape: 'sphere'
skin: 0x8a5a3c        // ruddy Klingon skin tone
body: 0xc9982f        // operations gold
legColor: 0x161616
shoe: 0x0d0d0d
eyes: 'dots'
limbR: 1.18
armL: 1.05
legL: 1.03
```

**Accessories**
- (pack-wide combadge; **skip** the shared black yoke here — the sash
  visually replaces it, adding both would clutter the torso)
- **face** — forehead ridges: 3 small stacked domes/boxes along the forehead
  centerline above the brow, each ~26×14×18 mm, tone slightly darker than
  skin `0x6b4126`, running brow-height up to hairline — the single most
  important accessory in this pack.
- **crown** — dark, center-parted hair combed back, a low-profile cap shape
  ~136×44×136 mm, `0x14100c`.
- **chest→hip sash (approximated)**: an elongated flattened box ~260×16×10 mm,
  brushed silver `0xc0c0c0`, anchored at `chest`, rotated ~35° about the
  local Z axis so it runs diagonally from the right shoulder toward the left
  hip. This is an approximation of a true shoulder-to-opposite-hip baldric —
  see Rig gaps.

**Silhouette check**: forehead ridge bumps + noticeably bulkier/taller build
(`sk`/`limbR` bumped) + the diagonal silver sash — any ONE of the three reads
Klingon, together it's unmistakable.

**Personality**: `bobMul: 0.9, swayMul: 0.6, cadenceMul: 0.9, ampMul: 1.0`
(stiff, proud, deliberate — minimal casual sway, heavier footfalls)
**Bubbles**: `⚔️🛡️😤🦴` (honor/blade, defense, pride/scowl, gagh/Klingon cuisine)

---

### 6. `chief-medical-officer` — "Chief medical officer (blue, red hair)"

**Reference**: The ship's doctor and head of sickbay — sciences/medical blue
uniform, shoulder-length red hair, warm but no-nonsense. (Beverly Crusher.)

**Spec**
```
sk: 0.96
headR: 122
headShape: 'sphere'
skin: 0xe8c2a0
body: 0x1f6e7a       // sciences/medical blue (teal)
legColor: 0x161616
shoe: 0x0d0d0d
eyes: 'dots'
limbR: 0.95
```

**Accessories**
- (pack-wide combadge + yoke)
- **crown** — shoulder-length hairstyle: a wider flattened sphere-cap
  extending down past the head sides, ~140×90×140 mm, auburn-red `0xa8461f`,
  tilted back slightly so the front rim clears the brow.
- **head** — two side lobes (hair falling past the ears) ~40×70×30 mm each,
  same `0xa8461f`, at left/right head anchors.

**Silhouette check**: red hair + teal/blue torso against a sea of gold and
red crewmates — color contrast alone identifies her role instantly.

**Personality**: `bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.05, ampMul: 0.95`
(brisk, professional, purposeful — a doctor who's always needed somewhere)
**Bubbles**: `💉🩺🌿❤️` (medical, stethoscope/care, herbal medicine interest, compassion)

---

### 7. `ships-counselor` — "Ship's counselor (teal, empath)"

**Reference**: The half-Betazoid ship's counselor with empathic abilities —
sciences-track teal/blue uniform, long dark wavy hair, calm and perceptive
demeanor. (Deanna Troi.)

**Spec**
```
sk: 0.94
headR: 120
headShape: 'sphere'
skin: 0xc48a6a        // olive/tan Betazoid-coded skin tone
body: 0x1f6e7a        // sciences/counseling blue (teal)
legColor: 0x161616
shoe: 0x0d0d0d
eyes: 'almond'        // softer, expressive eye style for the empath
limbR: 0.9
```

**Accessories**
- (pack-wide combadge + yoke)
- **crown** — long wavy hairstyle: a large flattened sphere-cap sweeping down
  past the shoulders, ~150×130×150 mm, near-black `0x2b1a12`, tilted back so
  the front clears the brow.
- **head** — two long side-lobes for hair past the shoulders, ~45×110×35 mm
  each, same `0x2b1a12`.
- **chest** — small dark bead/pendant accessory, ~14 mm sphere, `0x3a2a55`
  (subtle jewelry flourish, optional).

**Silhouette check**: long dark wavy hair (much longer/fuller than Crusher's)
against the same teal uniform, plus a visibly softer/slower gait (`ampMul`,
`cadenceMul` both eased down) — reads as the calm empath of the pair.

**Personality**: `bobMul: 0.8, swayMul: 0.75, cadenceMul: 0.85, ampMul: 0.8`
(graceful, unhurried, composed)
**Bubbles**: `💜🍫🧠😌` (empathy, chocolate — Troi's well-known weakness, sensing emotion, serenity)

---

### 8. `acting-ensign` — "Acting ensign (grey/burgundy, teen)"

**Reference**: The captain's precocious teenage protégé, an acting ensign who
serves on the bridge in a distinct trainee uniform rather than a division
color. (Wesley Crusher.)

**Spec**
```
sk: 0.82
headR: 112
headShape: 'sphere'
skin: 0xe8c2a0
body: 0x8a8a8a        // cadet/trainee grey (NOT a division color)
legColor: 0x2a2a2a    // slightly lighter than the adult crew's black — a trainee cut
shoe: 0x0d0d0d
eyes: 'dots'
limbR: 0.85
armL: 0.9
legL: 0.9
```

**Accessories**
- (pack-wide combadge — **skip** the black yoke; the trainee uniform's own
  color-block reads better without it)
- **chest** — a maroon/burgundy chest panel accent, flattened box
  ~90×110×8 mm, `0x6b1f2b`, covering the upper-center torso to stand in for
  the well-known burgundy accent on the trainee/cadet uniform.
- **crown** — short, boyish hairstyle, a small flattened cap ~110×34×110 mm,
  mid-brown `0x4a3320`.

**Silhouette check**: noticeably smaller build (`sk 0.82`) + grey uniform
with a burgundy chest panel (the only crew member NOT wearing a solid
division color) — instantly reads as "the kid," not a fourth command-red officer.

**Personality**: `bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.2, ampMul: 1.15`
(youthful, quick, energetic — noticeably livelier gait than any adult officer)
**Bubbles**: `💻🚀🤓✨` (tech/computer console, exploration eagerness, brainy enthusiasm, wonder)

## Rig gaps

- **No dedicated shoulder/yoke anchor.** TNG's (and TOS/DS9/VOY's) division
  uniforms are a two-tone design: a colored torso body with a contrasting
  black shoulder/collar yoke. The current accessory anchors (`crown`, `head`,
  `face`, `chest`/`torso-front`, `back`, `hip`, `hand`) have nothing that sits
  naturally across the shoulder line, so the pack approximates the yoke with
  a flattened black box at the top of the `chest` anchor. A true `shoulder`
  anchor (spanning both shoulders, draping over the sk-scaled shoulder width)
  would generalize to any two-tone franchise uniform, not just this pack.
- **No diagonal sash/baldric accessory primitive.** Worf's silver baldric
  runs from one shoulder to the opposite hip — a single anchor point (chest)
  with a rotated elongated box gets close but is a hand-tuned approximation
  that may clip the arm at rest pose and won't track `sk`/`limbR` changes
  automatically. A "strap" accessory type defined by two anchor endpoints
  (e.g. `chest` → `hip`, opposite side) would make sash/bandolier/baldric
  looks (common across many sci-fi and fantasy packs) far more robust.
- **Forehead-ridge / brow-accessory preset** (Worf) is achievable today via
  stacked small `face`-anchor primitives — not a gap, but worth a named
  preset since alien-brow foreheads recur across sci-fi packs (Klingons,
  Cardassians, Ferengi, Bajorans, etc.).

## Sources

- [Star Trek's Starfleet Uniform Colors: What They Mean & Why They Changed — ScreenRant](https://screenrant.com/star-trek-uniform-colors-meaning-change-reason/)
- [Star Trek 101: TNG's Primary Colors — StarTrek.com](https://www.startrek.com/news/star-trek-101-tng-s-primary-colors)
- [Star Trek uniforms — Wikipedia](https://en.wikipedia.org/wiki/Star_Trek_uniforms)
- [Worf's Sash/Baldric — TrekBBS](https://www.trekbbs.com/threads/worfs-sash-baldric.65342/)
- [Baldric — Memory Alpha](https://memory-alpha.fandom.com/wiki/Baldric)
- [Klingon Defense Force uniform — Memory Alpha](https://memory-alpha.fandom.com/wiki/Klingon_Defense_Force_uniform)
- General character/appearance knowledge of TNG's main cast (Picard, Riker,
  Data, La Forge, Worf, Crusher, Troi, Wesley Crusher) as broadly documented
  across Star Trek reference sources (Memory Alpha character pages).
