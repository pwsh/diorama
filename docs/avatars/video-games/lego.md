# Avatar pack: LEGO Minifigures

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the classic LEGO minifigure archetype, not any
licensed likeness or printed logo. No LEGO wordmark, no brick-stud textures,
no printed face/torso graphics — everything here is COLOR + SHAPE only, per
the rig's own no-texture rule. Character identity lives in this doc's
Reference lines and the pack's display labels ("Captain (red uniform)"
style), never a real name printed in-scene. This pack doubles as a **rig
style-test**: minifigs are famously NOT proportioned like the rig's default
human — huge blocky head, thin C-clip hands, trapezoid torso, stubby legs —
so it deliberately stresses `headShape`/`hands`/`legL` and surfaces the gaps
where the current primitive set can only approximate the aesthetic.

## Overview

- **Group**: Six classic/generic LEGO minifigure archetypes spanning the
  brand's oldest and most recognizable themes — Classic Space (in its three
  most common suit colors), Pirates, Castle, City (construction + police),
  and the unthemed baseline "smiley" figure every minifig collection
  descends from.
- **Hierarchy path**: `video-games / lego`
- **Member count**: 8 (3 Classic Space color variants + 5 distinct
  archetypes)
- **Rig**: humanoid only, every member. No quadrupeds.
- **Shared base spec** (all members start here, then override):
  ```
  sk: 1.0
  headR: 128            // minifig heads read LARGE relative to the tiny body
  headShape: 'box'       // approximation — true minifig head is a cylinder, see Rig gaps
  limbR: 0.72            // thin rod arms/legs, not the human default's thicker limbs
  hands: 'box'            // best available approximation of the iconic C-clip claw hand
  eyes: 'dots'            // simple two-dot eyes + (implicit) small curved smile — the classic smiley face
  steel: false
  emI: 0
  armL: 1.0
  legL: 0.7               // stubby legs — minifig legs are notably short relative to torso+head
  footMul: [1.15, 0.55, 1.05]   // wide, flat, low block feet (no ankle/heel definition)
  ```
- **Shared palette**:
  - Minifig skin yellow — `0xf2cd37` (the classic unthemed minifig
    head/hand color; used for every member here — none of these six are
    the modern "realistic skin tone" minifig variants)
  - Bright yellow (hard hat) — `0xffd500`
  - LEGO gold (badges/trim) — `0xd4af37`
  - Space red — `0xd4231c`
  - Classic Space blue — `0x0057a6`
  - Pirate black — `0x1b1b1b`
  - Pirate red sash — `0xb22222`
  - Falcon silver — `0xc0c0c0`
  - Safety orange — `0xff8200`
  - Police navy — `0x1e3a5f`
- **Pack-wide convention — the blank yellow head**: every member keeps
  `skin: 0xf2cd37` and `eyes: 'dots'` unmodified. Identity comes entirely
  from headwear (the `crown` accessory), torso color (`body`/`legColor`),
  and a small number of front/back accessory bolt-ons — never from
  recoloring the head or changing the face. This mirrors the real toy: the
  same handful of head/hand/leg moulds get dressed differently per theme.
- **Pack-wide convention — stubby monochrome legs**: `legColor` matches
  `body` (a one-piece "hip" element in real minifigs is usually a single
  color) except where the reference figure canonically has two-tone legs
  (police, construction). `legL: 0.7` is shared by every member — the
  stubby-leg silhouette is as load-bearing to "reads as minifig" as the
  head shape, so it is never overridden per-member.

## Members

### 1. `spaceman-red` — "Classic Spaceman (red)"

**Reference**: LEGO's Classic Space astronaut line (1978 onward) — a
monochrome one-color spacesuit torso printed with a control-panel/air-hose
chest detail, worn under a round, clear/trans-yellow bubble space helmet.
Red was one of the three original launch colors (with white and yellow) and
remains the line's most iconic. (Classic Spaceman, red variant.)

**Spec**
```
sk: 1.0
headR: 128
headShape: 'box'
limbR: 0.72
skin: 0xf2cd37
body: 0xd4231c          // space red monochrome suit
legColor: 0xd4231c
shoe: 0xffffff           // white boots
eyes: 'visor'             // doubles as the reflective helmet visor cue
emI: 0.12
hands: 'box'
steel: false
armL: 1.0
legL: 0.7
footMul: [1.15, 0.55, 1.05]
```

**Accessories**
- **crown** — the bubble helmet: a large clear/trans-yellow sphere,
  ~170×170×170 mm, `0xf5e642` at low opacity/`emI 0.2` (a faint glassy
  glow reads better than true transparency on a toon material), fully
  enclosing the head, raised so its rim clears the chin rather than
  cutting across the face.
- **chest** — the classic air-supply control panel print, approximated as
  a small raised grey box, ~46×34×8 mm, `0x9a9a9a`, centered on the upper
  torso.
- **back** — twin oxygen-tank cylinders, two short cylinders ⌀20×70 mm,
  `0xcccccc`, mounted side by side flat against the back.
- **hip** — a thin equipment-belt band, `0x9a9a9a`, ~body-width×20×6 mm.

**Silhouette check**: the monochrome red suit topped by a full clear bubble
helmet is instantly "classic spaceman" at any size — no other member in
this pack wears a full head-enclosing dome, and no other member is a flat
single-color suit head-to-toe.

**Personality**: `bobMul: 0.7, swayMul: 0.4, cadenceMul: 0.9, ampMul: 0.75`
(a slightly stiff, deliberate gait — bulky suit and helmet read as mildly
restrictive movement)
**Bubbles**: `🚀🛰️👽📡` (rocket, satellite, alien contact, transmission)

---

### 2. `spaceman-white` — "Classic Spaceman (white)"

**Reference**: The same Classic Space line in its white suit variant,
released alongside red and yellow as one of the three original 1978
colorways — identical helmet/panel design, different torso/leg color.
(Classic Spaceman, white variant.)

**Spec** — identical to `spaceman-red` except:
```
body: 0xf2f2f2          // off-white suit (pure #fff reads flat/blown-out on toon shading)
legColor: 0xf2f2f2
shoe: 0x1b1b1b           // dark boots for contrast against the white suit
```
All other fields (headR, headShape, limbR, eyes, hands, legL, footMul,
armL) and every accessory are identical to `spaceman-red`, recolored to
match: helmet stays clear/trans-yellow, chest panel and tanks stay grey.

**Silhouette check**: same helmet-dome silhouette as the red variant; the
white-vs-red recolor is a deliberate pack-internal demonstration that suit
color alone (not shape) carries the "which Classic Space colorway" read —
same technique the base packs use for recolor variants.

**Personality**: same as `spaceman-red`.
**Bubbles**: `🚀🛰️👽📡` (shared with the other spaceman variants)

---

### 3. `spaceman-blue` — "Classic Spaceman (blue)"

**Reference**: The Classic Space line's blue suit variant, added in 1984
alongside black as the range expanded past the original three launch
colors. (Classic Spaceman, blue variant.)

**Spec** — identical to `spaceman-red` except:
```
body: 0x0057a6          // classic space blue
legColor: 0x0057a6
shoe: 0xf2f2f2           // white boots (matches the red variant's boot choice)
```
All other fields and accessories identical to `spaceman-red`.

**Silhouette check**: same as the other two variants — blue monochrome
suit + bubble helmet.

**Personality**: same as `spaceman-red`.
**Bubbles**: `🚀🛰️👽📡`

---

### 4. `pirate-captain` — "Pirate Captain"

**Reference**: LEGO Pirates' recurring captain figure (theme launched
1989) — a black tricorne/bicorne hat (often with a skull-and-crossbones
motif and a white plume), a black coat with gold trim over a torso, a
red sash/cummerbund, black legs, and commonly an eyepatch and/or a peg
leg or hook-hand accessory. (Generic Pirate Captain archetype.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'box'
limbR: 0.75
skin: 0xf2cd37
body: 0x1b1b1b          // black coat
legColor: 0x1b1b1b
shoe: 0x2a2a2a
eyes: 'dots'              // one eye occluded by the eyepatch accessory
emI: 0
hands: 'box'
steel: false
armL: 1.0
legL: 0.7
footMul: [1.15, 0.55, 1.05]
```

**Accessories**
- **crown** — the bicorne hat: two overlapping flattened, wide cones
  forming the pointed fore-and-aft hat silhouette, ~150×70×110 mm,
  `0x1b1b1b`, raised and tilted back per the standard hat rule so the
  front point clears the brow; a small white skull accent (a tiny white
  sphere, ⌀18 mm, `0xf2f2f2`) centered on the front face, plus a short
  white plume (a thin, backswept cone, ~16×90×16 mm, `0xf2f2f2`) jutting
  from the peak.
- **face** — an eyepatch: a small flattened black box, ~30×22×6 mm,
  `0x1b1b1b`, over one eye with a thin strap line (a slim dark band)
  continuing to the ear.
- **torso-front** — a diagonal gold trim sash, a thin angled band,
  ~body-width×26×8 mm, `0xd4af37`, crossing the coat front.
- **hip** — a red sash/cummerbund, a wide cylinder band around the waist,
  `0xb22222`, ~body-width×90×body-depth mm.
- **back** — a small cutlass, a slim angled cylinder blade
  ~16×180×16 mm `0xd6d6da` with a short gold cross-guard
  (~50×12×12 mm, `0xd4af37`), mounted diagonally flat against the back.

**Silhouette check**: the black bicorne with its white plume, paired with
the black coat + gold diagonal sash + eyepatch, is unmistakably "pirate
captain" even as a flat silhouette — the only tricorne/bicorne hat and the
only eyepatch in the pack.

**Personality**: `bobMul: 0.9, swayMul: 1.2, cadenceMul: 0.85, ampMul: 1.0`
(a rolling, swaggering sea-legs gait — exaggerated side-to-side sway)
**Bubbles**: `🏴‍☠️💰🦜⚓` (pirate flag, treasure, parrot companion, anchor)

---

### 5. `knight-silver` — "Knight (silver armor, black falcon)"

**Reference**: LEGO Castle's Black Falcons faction knight (introduced
1984) — a closed grey knight's helmet (often with a colored feather
plume), silver breastplate armor printed over a black torso, black legs,
and a black falcon-emblem shield. One of the earliest and most recognized
Castle-theme knight liveries. (Generic Knight archetype, Black Falcons
livery.)

**Spec**
```
sk: 1.0
headR: 120
headShape: 'box'
limbR: 0.78
skin: 0xf2cd37
body: 0x1b1b1b          // black torso under the armor print
legColor: 0x1b1b1b
shoe: 0x1b1b1b
eyes: 'slit'              // closed-helm eye-slit, matches the visor read
emI: 0
hands: 'box'
steel: true                // brushed-metal sheen for the armor plating
armL: 1.0
legL: 0.7
footMul: [1.15, 0.55, 1.05]
```

**Accessories**
- **crown** — the closed helmet: a rounded box/dome fully enclosing the
  head, ~150×160×150 mm, `0xb8b8b8` (steel grey), with a raised, tilted
  back plume mount and a short feather plume (a slim cone, ~16×90×16 mm,
  `0x1e4fa0` blue) — clearing the eye band per the standard hat rule.
- **chest** — a silver breastplate overlay, a broad flattened box,
  ~150×130×14 mm, `0xc0c0c0`, `steel`-style sheen, centered on the torso.
- **chest** (small emblem) — a black falcon crest, a small dark disc,
  ~40×40×6 mm, `0x101010`, centered on the breastplate.
- **back** — a short black cape, a tapered flattened cone, ~180×260×14 mm,
  `0x1b1b1b`, hanging from the shoulders.
- **hand** — a shield prop for the off-hand: a flattened, rounded box,
  ~110×140×16 mm, `0x1b1b1b`, with a small silver falcon-wing accent
  (~50×30×6 mm, `0xc0c0c0`).

**Silhouette check**: the fully-enclosed grey helmet plus silver
breastplate plus black falcon cape is unmistakably "knight" — the only
fully-helmeted (face-hidden) member in the pack besides the closed-helm
read itself, and the only one carrying a shield.

**Personality**: `bobMul: 0.55, swayMul: 0.4, cadenceMul: 0.65, ampMul: 0.85`
(heavy, deliberate armored footfalls — the slowest cadence in the pack)
**Bubbles**: `⚔️🛡️🐉🏰` (sword, shield, dragon/quest, castle)

---

### 6. `construction-worker` — "Construction Worker"

**Reference**: LEGO City's recurring construction-worker figure — a
bright yellow hard hat, a high-visibility orange safety vest with a
reflective white/silver stripe worn over a torso, and blue jean-style
legs (an orange-leg "hi-vis coverall" variant also exists). A tool belt is
common. (Generic Construction Worker archetype.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'box'
limbR: 0.76
skin: 0xf2cd37
body: 0xff8200          // safety-orange hi-vis vest
legColor: 0x2b4c7e       // blue jeans
shoe: 0x2a2a2a
eyes: 'dots'
emI: 0
hands: 'box'
steel: false
armL: 1.0
legL: 0.7
footMul: [1.15, 0.55, 1.05]
```

**Accessories**
- **crown** — the hard hat: a smooth half-dome, ~150×90×150 mm,
  `0xffd500` (bright yellow), raised so its brim sits above the brow
  rather than draping onto it.
- **chest** — a reflective safety stripe, a horizontal band,
  ~body-width×24×8 mm, `0xe8e8e8`, with `emI: 0.1` (slight reflective
  glint), across the vest's lower third.
- **hip** — a tool belt, a thin band, `0x3a3020`, with a small hammer
  prop (a tiny cylinder handle + flattened box head, ~14×70×14 mm handle,
  `0x5c3a21`, head `0x8a8a8a`) hanging at the hip.

**Silhouette check**: the smooth yellow dome hard hat over the bright
orange vest with its white reflective stripe is instantly "construction
worker" — the only bright-yellow headwear and the only hi-vis-orange torso
in the pack.

**Personality**: `bobMul: 1.0, swayMul: 0.7, cadenceMul: 1.0, ampMul: 0.95`
(an ordinary, energetic working stride — no exaggeration either way)
**Bubbles**: `🔨🚧📐🏗️` (hammer, caution/roadwork, blueprint/measuring,
building crane)

---

### 7. `police-officer` — "Police Officer"

**Reference**: LEGO City's recurring police-officer figure — a dark navy
uniform torso (often with a light-blue shirt/tie print and a badge), a
matching dark navy police cap with a small gold badge, and dark navy
legs. (Generic Police Officer archetype.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'box'
limbR: 0.72
skin: 0xf2cd37
body: 0x1e3a5f          // police navy uniform
legColor: 0x1e3a5f
shoe: 0x1b1b1b
eyes: 'dots'
emI: 0
hands: 'box'
steel: false
armL: 1.0
legL: 0.7
footMul: [1.15, 0.55, 1.05]
```

**Accessories**
- **crown** — the police cap: a flattened dome with a small forward
  brim (a thin flattened box), ~140×70×150 mm dome + ~150×10×40 mm brim,
  `0x16283f` (darker navy than the uniform, for contrast), with a small
  gold badge disc (⌀20×6 mm, `0xd4af37`) centered on the front, raised so
  the brim clears the brow.
- **chest** — a gold badge accent, a small five-point-ish flattened
  shape (approximated as a small box or disc), ~24×24×6 mm, `0xd4af37`,
  `emI: 0.15`, upper-left chest.
- **hip** — a black duty belt, a thin band, `0x1b1b1b`, with a small
  radio prop (a tiny box, ~16×30×12 mm, `0x2a2a2a`) at the hip.

**Silhouette check**: the dark navy cap with its gold badge, paired with
the plain dark navy uniform, is instantly "police officer" — the only
brimmed (rather than domed/pointed) cap silhouette in the pack.

**Personality**: `bobMul: 0.9, swayMul: 0.5, cadenceMul: 1.0, ampMul: 0.9`
(an alert, purposeful, upright patrol stride)
**Bubbles**: `🚓🚨📋🍩` (patrol car, siren/alert, notepad/citation, the
classic donut-break gag)

---

### 8. `smiley-classic` — "Classic Smiley Minifig"

**Reference**: The archetypal unthemed LEGO minifigure — a plain yellow
smiling head (two simple dot eyes, a small curved smile, no other
markings) atop a plain solid-color torso and legs, with no hat, no
accessories, and no thematic affiliation. This is the "blank" baseline
minifigure design that has anchored basic LEGO sets since 1978 and is the
mould every other themed figure in this pack customizes from. (Generic/
Classic Minifig.)

**Spec**
```
sk: 1.0
headR: 128
headShape: 'box'
limbR: 0.72
skin: 0xf2cd37
body: 0xd01012          // plain red torso (the most common "generic" color; blue/yellow are equally canonical)
legColor: 0x1b1b1b       // plain black legs
shoe: 0x1b1b1b
eyes: 'dots'
emI: 0
hands: 'box'
steel: false
armL: 1.0
legL: 0.7
footMul: [1.15, 0.55, 1.05]
```

**Accessories**: none. This member is deliberately bare — no crown, no
face, no chest/back/hip pieces — to serve as the pack's (and the rig's)
baseline reference figure.

**Silhouette check**: a plain smiling yellow head on a plain-color
torso/legs with zero accessories is, paradoxically, the single most
recognizable LEGO silhouette of all — it IS the minifigure archetype other
members riff on. If this figure is ever confused for "generic default
rig human" rather than "a LEGO minifig," that's a sign the shared base
spec (box head + stubby legs + C-hands) isn't reading strongly enough on
its own and the pack needs a stronger baseline tell (e.g. slightly more
saturated yellow, or a subtly wider trapezoid torso — see Rig gaps).

**Personality**: `bobMul: 1.0, swayMul: 0.6, cadenceMul: 1.0, ampMul: 1.0`
(a plain, neutral default walk — no personality exaggeration, the pack's
baseline gait)
**Bubbles**: `😀⭐🧱❤️` (smile, star, brick, generic happy heart)

## Rig gaps

- **No cylinder head shape.** The minifig head is canonically a distinct
  vertical cylinder (flat top and bottom, straight sides) — visually the
  single biggest tell of the LEGO aesthetic alongside the C-clip hands.
  The current rig only offers `headShape: 'sphere' | 'box'`; every member
  in this pack uses `'box'` as the closer of the two approximations, but a
  true `'cylinder'` `headShape` option (matching the existing cylinder
  primitive already used for limbs/necks elsewhere in the renderer) would
  make this entire pack read correctly at a glance instead of "blocky
  human." This is this pack's headline rig-gap finding.
- **No trapezoid/wide-shoulder torso shape.** Minifig torsos are a
  distinctive trapezoid — narrower at the waist, flaring out to wide flat
  shoulders — quite unlike the rig's default torso silhouette. There is no
  per-spec torso SHAPE field at all today (only `body` color); a
  `torsoShape` parameter (box vs. trapezoid-prism) would let this pack (and
  any future "blocky toy figure" pack) nail the silhouette instead of
  relying entirely on accessory overlays to imply it.
- **No dedicated brim/flat-cap primitive.** The police cap's small forward
  brim and the general "flat-topped cap with a brim" shape are approximated
  here as a dome + a separate flattened box glued on at an angle. A
  dedicated brim treatment (or a `crown` sub-type for "capped dome") would
  clean this up and would generalize to any future military/baseball-cap
  character.
- **Hand-prop swap already works.** Noted as a non-gap for completeness:
  the `hand` anchor already accepts arbitrary bolt-on props (the pirate's
  cutlass, the knight's shield, the construction worker's hammer, the
  cop's radio), so hook-hand / peg-leg style limb REPLACEMENTS (as opposed
  to held props) were considered for the pirate captain but intentionally
  left out of this doc's spec — true limb replacement (swapping the whole
  hand/foot geometry, not just adding a prop) isn't something the current
  accessory system does, and wasn't needed for a recognizable pirate read
  here (eyepatch + hat carry it). Worth flagging if a future pack wants a
  literal peg-leg or hook.

## Sources

- [Every LEGO Classic Space astronaut colour so far — Brick Fanatics](https://www.brickfanatics.com/every-lego-classic-space-astronaut-colour)
- [Classic Spacemen — The Lego Space Wiki (Fandom)](https://thelegospace.fandom.com/wiki/Classic_Spacemen)
- [Blue Classic Spaceman — Brickipedia (Fandom)](https://brickipedia.fandom.com/wiki/Blue_Classic_Spaceman)
- [BrickLink Reference Catalog — Minifigures — Space / Classic Space](https://www.bricklink.com/catalogList.asp?catType=M&catString=34.314)
- [LEGO minifigures PI185: Pirate Captain — Brickset](https://brickset.com/minifigs/pi185/pirate-captain-bicorne-hat-with-skull-and-white-plume-pearl-gold-epaulettes-blue-open-jacket-black-leg-and-pearl-dark-gray-peg-leg)
- [LEGO® Pirates — LEGO History](https://www.lego.com/en-ae/history/articles/g-lego-pirates)
- [BrickLink Reference Catalog — Minifigures — Pirates / Pirates I](https://www.bricklink.com/catalogList.asp?catType=M&catString=61.688)
- [Black Knight (Castle) — Brickipedia (Fandom)](https://brickipedia.fandom.com/wiki/Black_Knight_(Castle))
- [LEGO minifigures Classic Castle — Brickset](https://brickset.com/minifigs/subcategory-Classic-Castle)
- [LEGO® Construction Worker Minifigures — Choose-a-Brick](https://www.choose-a-brick.com/collections/lego-construction-worker-minifigures)
- [Hard Hat Emmet — The Minifigure Wiki (Fandom)](https://the-minifigure.fandom.com/wiki/Hard_Hat_Emmet)
- [LEGO® Police Officer Minifigure — City Shirt & Scowl — Choose-a-Brick](https://www.choose-a-brick.com/products/police-officer-minifigure-city-shirt-scowl)
- [LEGO Navy Police Cap with Badge — Minifigs.me](https://minifigs.me/products/policecap)
- [THE LEGO® MINIFIGURE MEASUREMENTS (PDF)](https://tongal.s3.amazonaws.com/custom-files/2020/08/13/MinifigureProportions.pdf)
- [Minifigure — Brickipedia (Fandom)](https://brickipedia.fandom.com/wiki/Minifigure)
- `docs/avatars/video-games/zelda.md` (this repo) — the doc-structure and
  accessory-anchor conventions this pack follows directly.
