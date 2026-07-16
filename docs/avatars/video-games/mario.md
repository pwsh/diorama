# Avatar pack: Super Mario

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no printed letters/initials, no on-model face sculpts, no names printed
anywhere in-scene; character identity lives only in this doc's Reference
lines and the pack's display labels.

## Overview

- **Group**: The core cast of Nintendo's *Super Mario* franchise — two
  plumber brothers, a princess, a mushroom retainer, a dinosaur companion,
  a Koopa king villain, a shy ghost, a rival anti-hero, and a big friendly
  ape.
- **Hierarchy path**: `video-games / mario`
- **Member count**: 9 (pack `version: 2` — the barrel ape was appended in the
  v2 audit pass as a missing primary the core cast lacked)
- **Rig**: humanoid only. `dino-companion` (Yoshi) and `mushroom-toad`
  (Toad) and `shy-ghost` (Boo) are all **bipeds built on the humanoid rig**,
  exactly like the existing `cartoon_duck` kind and the `farm-cucco` member
  of `docs/avatars/video-games/zelda.md` — no quadruped machinery anywhere
  in this pack, despite the non-human designs. Species/character read comes
  entirely from color, proportion (`sk`/`limbR`/`headR`), and accessory
  silhouette.
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
- **Shared palette — Mushroom Kingdom signature hues** (each member owns
  ONE of these as their primary identity color so the group reads as
  distinct silhouettes at a glance, plumber-blue shared by both brothers
  on purpose — see Overview note below):
  - Plumber red — `0xd21f1a` (Mario's shirt/cap)
  - Plumber green — `0x1f9e2c` (Luigi's shirt/cap)
  - Overall blue — `0x1c3d9e` (shared by both brothers' overalls —
    intentional: it's what visually unifies them as "the brothers" against
    their differing red/green)
  - Royal pink — `0xf199c4` (Peach's gown)
  - Regal gold — `0xd9b34a` (crowns, buttons, trim — accessory accent only,
    never a whole-body fill)
  - Toad red-and-white — `0xd9241f` / `0xf5f2ea` (cap spots)
  - Yoshi green — `0x3fae3f` (skin/body) with cream belly `0xf5f2ea`
  - Bowser shell green — `0x2f7a2e` with mustard-olive hide `0xc7b02e`
  - Ghostly white — `0xf5f2f0` (Boo)
  - Rival yellow/purple — `0xf0c020` / `0x6a2f9e` (Wario)
- **Pack-wide convention — the plumber "bib" torso split**: both plumber
  brothers need a visible two-tone shirt-over-overalls read despite the
  rig having a single `body` fill for the torso. Convention: `body` carries
  the SHIRT color (arms + upper torso), `legColor` carries the OVERALLS
  color (legs), and a `chest` accessory (a rounded rectangular bib patch in
  the overalls color, ~body-width x 160 x 10mm, with 2 small button-dot
  accents) sits over the lower chest/belly to complete the bib silhouette.
  Any future dungarees-wearing character in another pack should reuse this
  exact three-part convention rather than inventing a new one.
- **Pack-wide caveat — no glove-color override**: Mario, Luigi, Peach, and
  Wario are all canonically white-gloved, but the rig has no distinct
  hand/glove color field (`hands` is a shape enum only: `'sphere'|'box'`;
  hands render in the figure's `skin` tone). This pack does not attempt a
  workaround per-member — see Rig gaps #1 — so treat bare skin-toned hands
  as the accepted approximation throughout.

## Members

### 1. `plumber-red` — "Plumber (red cap, blue overalls)"

**Reference**: The series' iconic protagonist — a stocky, mustached
Italian-American plumber. Red long-sleeved shirt, blue overall dungarees
with gold buttons, white gloves, brown shoes, a red cap with a front
emblem, and a thick brown mustache. Shorter and stockier than his brother.
(Mario.)

**Spec**
```
sk: 0.9
headR: 130
headShape: 'sphere'
limbR: 1.1
skin: 0xf2b28c
body: 0xd21f1a        // red shirt
legColor: 0x1c3d9e    // blue overalls
shoe: 0x5a3620         // brown shoes
eyes: 'dots'
emI: 0
hands: 'sphere'        // white gloves not representable — see pack caveat
steel: false
armL: 0.95
legL: 0.85
footMul: [1.1, 1.0, 1.05]
```

**Accessories**
- **crown** — the red cap: a flattened dome ~140mm wide with a small
  forward-projecting brim disc, `0xd21f1a`; raised + tilted back per the
  standard hat rule so the brim clears the brow instead of draping to eye
  level. A plain white circular patch (~40mm, `0xffffff`) sits front-center
  where the canonical emblem would go — a blank accent disc, not a letter,
  per the pack's no-logo policy.
- **head** — a little brown hair peeking at the sides/back under the cap:
  small tufts (flattened boxes), `0x5a3620`.
- **face** — the mustache: a wide, thick box under the nose, ~90x30x20mm,
  `0x5a3620` — bushy and wide is the read, not neat.
- **chest** — the overalls bib patch (pack-wide convention above),
  `0x1c3d9e`, with 2 small gold button dots (~14mm, `0xd9b34a`) near the
  top corners.
- **chest** (second primitive) — two thin diagonal straps crossing from
  the bib up over each shoulder, `0x1c3d9e`.

**Silhouette check**: the round-brimmed red cap + wide brown mustache +
blue overalls bib over a red shirt is unmistakably "the plumber" even as a
flat color blob at 30px — no letter needed.

**Personality**: `bobMul: 1.1, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0`
(a confident, bouncy platformer hop)
**Bubbles**: `🍄⭐🪙😲` (mushroom power-up, star power-up, coin, surprise)

---

### 2. `plumber-green` — "Tall Brother (green cap, blue overalls)"

**Reference**: Mario's younger brother — taller and noticeably thinner,
green shirt and cap in place of Mario's red, the same blue overalls,
a thinner mustache, and a more nervous, easily-spooked demeanor (famous
for his cowardice around ghosts). (Luigi.)

**Spec**
```
sk: 1.05
headR: 124
headShape: 'sphere'
limbR: 0.85
skin: 0xf2b28c
body: 0x1f9e2c        // green shirt
legColor: 0x1c3d9e    // blue overalls — same family as his brother
shoe: 0x3a2a1a
eyes: 'dots'
emI: 0
hands: 'sphere'
steel: false
armL: 1.05
legL: 1.05
footMul: [1.0, 1.0, 1.0]
```

**Accessories**
- **crown** — green cap, same dome+brim construction as Mario's, `0x1f9e2c`,
  with the same blank white accent disc front-center.
- **head** — dark brown hair tufts, `0x3a2418`.
- **face** — a thinner, narrower mustache box than Mario's, `0x3a2418`.
- **chest** — overalls bib patch, `0x1c3d9e`, 2 gold buttons, same
  pack-wide convention as Mario, plus the crossing shoulder straps.

**Silhouette check**: the taller, thinner frame (`sk 1.05`/`limbR 0.85` vs.
Mario's `0.9`/`1.1`) plus the green-not-red cap/shirt reads instantly as
"the other brother" while the shared blue overalls keeps the pair legible
as a family at a glance.

**Personality**: `bobMul: 0.95, swayMul: 1.1, cadenceMul: 1.1, ampMul: 0.9`
(a slightly higher-strung, more hesitant gait than his brother's confident
bounce)
**Bubbles**: `👻😱🍄⭐` (ghost-fright nod to his signature cowardice,
mushroom, star)

---

### 3. `mushroom-princess` — "Princess (pink gown, blonde, crown)"

**Reference**: The Mushroom Kingdom's ruler — blonde, blue-eyed, in a
long pink ballgown with puffed sleeves, elbow-length white gloves, a
gold crown set with a red jewel, and a blue brooch/amulet at the collar.
Composed and graceful. (Princess Peach.)

**Spec**
```
sk: 0.95
headR: 122
headShape: 'sphere'
limbR: 0.85
skin: 0xf6cba8
body: 0xf199c4        // pink gown bodice
legColor: 0xf199c4    // full-length gown, no visible leg break
shoe: 0xd9b34a         // gold slippers, barely visible under the hem
eyes: 'almond'
emI: 0
hands: 'sphere'        // white gloves not representable — see pack caveat
steel: false
armL: 0.95
legL: 1.0
footMul: [1.0, 1.0, 1.0]
```

**Accessories**
- **head** (×2, hair) — long blonde hair down each side to shoulder
  height: tapered boxes, ~50x220x40mm, `0xf5d060`.
- **back** — hair continuing down the back, a wider tapered box,
  ~140x260x30mm, `0xf5d060`.
- **crown** — a gold crown: a shallow band/box with 3 small point-cones,
  `0xd9b34a`, sitting LOW across the forehead at brow height (not a tall
  dome — this is the one crown-style accessory in the pack that must sit
  low rather than raised/tilted back), with a red jewel cabochon
  (~20mm, `0xc23030`) centered above the brow.
- **chest** — a small blue brooch/amulet at the collar: a gem accent
  (~18mm, `0x3a6fd1`) in a thin gold ring (`0xd9b34a`).

**Silhouette check**: the pink full-length gown silhouette (no leg break)
topped by a low gold crown with its single red jewel and long blonde hair
is unmistakable — the only all-pink, floor-length-dress member in the pack.

**Personality**: `bobMul: 0.55, swayMul: 0.45, cadenceMul: 0.85, ampMul: 0.7`
(graceful, composed, an unhurried royal glide)
**Bubbles**: `👑💖🍰🎀` (crown, heart, her signature cake-baking, ribbon/bow)

---

### 4. `mushroom-toad` — "Mushroom Retainer (red-spotted cap)"

**Reference**: A short, energetic Mushroom Kingdom retainer whose defining
feature is a huge red-and-white spotted mushroom cap that reads as fused
with his head rather than worn over it. Pale tan face, big round eyes, a
blue vest with yellow trim over a white body, brown shoes, no visible hair.
(Toad.)

**Spec**
```
sk: 0.55
headR: 130
headShape: 'sphere'
limbR: 0.9
skin: 0xf0c9a0        // pale tan face
body: 0x2255c9        // blue vest
legColor: 0xf5f2ea    // white
shoe: 0x5a3d20
eyes: 'dots'           // big simple round eyes
emI: 0
hands: 'sphere'
steel: false
armL: 0.8
legL: 0.7
footMul: [1.15, 0.9, 1.1]
```

**Accessories**
- **crown** — THE mushroom cap, this member's entire read: a wide
  flattened dome, ~200mm diameter (notably larger than the ~130mm head it
  sits on — see Rig gaps #2), white base `0xf5f2ea` with 3-4 large red
  polka-dot bumps (small flattened spheres, `0xd9241f`) scattered across
  the top. Raised/tilted back per the standard hat rule, though here the
  "hat" dominates the whole head silhouette rather than sitting modestly
  atop it.
- **chest** — a thin yellow trim band at the collar and cuffs of the blue
  vest, `0xf0c020`.
- No `head`-anchor hair — bald under the cap, the absence is part of the
  read (like the LOTR pack's Gollum convention: no crown-hair accessory at
  all when the character is canonically hairless).

**Silhouette check**: the oversized white, red-polka-dotted domed cap is
instantly readable in silhouette alone — no other member has a domed,
spotted head.

**Personality**: `bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.3, ampMul: 0.65`
(fast tiny scurry-steps, high-energy exuberance)
**Bubbles**: `🍄🎉😊✨` (mushroom, cheer, chipper enthusiasm, sparkle)

---

### 5. `dino-companion` — "Dinosaur Companion (green, saddle, big nose)"

**Reference**: A friendly green dinosaur who serves as a rideable
companion — upright biped stance, green scaly hide, a cream/white belly,
a big rounded orange-red snout, small backswept neck spikes, and a
saddle-like hump on the back (also literally where a rider sits). Stubby
arms, strong legs, big three-toed feet. (Yoshi.)

**Spec**
```
sk: 0.9
headR: 110
headShape: 'sphere'
limbR: 1.0
skin: 0x3fae3f        // green hide
body: 0x3fae3f
legColor: 0x3fae3f
shoe: 0xe8720a         // orange-red stubby feet
eyes: 'almond'          // closest existing preset — see Rig gaps #5
emI: 0
hands: 'sphere'
steel: false
armL: 0.7               // short stubby arms
legL: 1.1                // long strong dinosaur legs
footMul: [1.3, 0.9, 1.4]  // big three-toed feet
```

**Accessories**
- **face** — the big rounded orange-red snout: an oversized sphere bump,
  ~70mm, `0xe8722a`, at the front of the face — the single most important
  read per the brief.
- **chest** — a large cream/white belly patch, a flattened oval disc,
  `0xf5f2ea`, covering the front torso from chest to hip.
- **head** (×2-3) — small backswept neck spikes, small cones,
  `0xd9481f`, running down the nape.
- **back** — the saddle: a curved flattened box/cone draped mid-back,
  deep red `0xd9241f` with a thin cream edge trim `0xf0e0c0`.

**Silhouette check**: upright green body + cream belly + oversized round
orange nose + red saddle-hump on the back is unmistakably this character;
no other member combines a snout-nose with a belly-patch torso split.

**Personality**: `bobMul: 1.2, swayMul: 1.0, cadenceMul: 1.15, ampMul: 1.05`
(a bouncy, energetic hopping trot)
**Bubbles**: `🥚🍎👅😋` (egg, fruit-loving, tongue-flick, delighted)

---

### 6. `koopa-king` — "Koopa King (spiked shell, horns)"

**Reference**: The series' towering antagonist — a huge, hulking
turtle-dragon with mustard-yellow-green scaly hide, a cream underbelly, a
green shell ringed with large white spikes, wild upswept red-orange hair,
curved white horns, bushy dark eyebrows, and a heavy fanged jaw.
(Bowser.)

**Spec**
```
sk: 1.35              // biggest, most imposing member in the pack
headR: 150
headShape: 'sphere'
limbR: 1.3
skin: 0xc7b02e         // mustard-olive scaly hide
body: 0xf0e2b0         // cream belly/plastron (front torso)
legColor: 0xc7b02e     // hide-toned legs
shoe: 0x3a2e1c          // dark claws
eyes: 'halfred'          // heavy-lidded, fierce villain eyes
emI: 0.1
hands: 'box'             // clawed, knuckly hands read better blocky
steel: false
armL: 1.2
legL: 0.95
footMul: [1.3, 1.0, 1.3]
```

**Accessories**
- **back** — the spiked shell: a large domed shape, green `0x2f7a2e`,
  with 5-6 white cone spikes (~60mm, `0xf5f2ea`) proud of the surface
  around the rim.
- **crown** — wild red-orange hair, 2-3 tall backswept cones, `0xd9481f`,
  raised + tilted back per the standard hat/hair rule.
- **head** (×2) — curved white horns, small curved cones, `0xf0ece0`,
  above the brow.
- **face** — heavy dark eyebrows, thick angled boxes, `0x2a2018`, notably
  bulkier than the rig's default brow.
- **face** (second primitive) — 2 small white fang cones pointing up from
  the lower jaw corners, `0xf5f2ea`.
- **hand** (×2) — spiked wristbands, small dark cuffs (`0x2a2018`) with
  tiny white cone spikes, at each wrist.

**Silhouette check**: the sheer bulk (`sk 1.35`, largest in the pack), the
white-spiked green shell dome, the upswept red-orange hair, and the curved
white horns together are unmistakable in flat silhouette alone. A thick
tail is canonical but not renderable — see Rig gaps #3.

**Personality**: `bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.55, ampMul: 1.1`
(slow, thunderous, ground-shaking stomp — the heaviest gait in the pack)
**Bubbles**: `🔥😈👑💢` (fire breath, menace, self-styled king, rage)

---

### 7. `shy-ghost` — "Shy Ghost (white, hovering)"

**Reference**: A small, round, mischievous ghost that hovers rather than
walks — a pure white spherical body with no visible neck/limbs of note, a
wide toothy grin, and a tattered, wavy lower hem instead of legs. Shy and
prone to hiding its face when watched directly. (Boo.)

**Spec**
```
sk: 0.75
headR: 140            // body and head read as one continuous round shape
headShape: 'sphere'
limbR: 0.6             // thin stub arms
skin: 0xf5f2f0
body: 0xf5f2f0         // same tone as the head — one continuous ghost body
legColor: 0xf5f2f0
shoe: 0xf5f2f0
eyes: 'dots'            // big simple round eyes
emI: 0.05                // a faint ghostly glow
hands: 'sphere'
steel: false
armL: 0.6
legL: 0.4               // legs shrunk near-zero — see Rig gaps #4 (hover)
footMul: [0.8, 0.6, 0.8]
```

**Accessories**
- **face** — a wide, jagged, toothy grin in place of the default smile: a
  dark wavy band, `0x2a2a2a`, across the lower face, larger/toothier than
  the rig's default.
- **hip** (×3-4) — the wavy, tattered lower hem in place of a normal leg
  silhouette: small overlapping cone/wedge shapes around the base,
  `0xf5f2f0`, same white as the body.
- No `crown`/`head` accessories — bald, featureless round head; the
  absence of hair or a hat is part of the read.

**Silhouette check**: a featureless, pure-white, round floating body with
a wide toothy grin and no clear legs/arms is instantly distinct from every
other (grounded, colorful, clothed) member in the pack. The true "hovers
with no footfall" motion this character needs isn't achievable with the
current gait system — see Rig gaps #4.

**Personality**: `bobMul: 1.6, swayMul: 1.5, cadenceMul: 0.4, ampMul: 0.2`
(slow ghostly drifting hover-bob — near-zero stride amplitude and cadence,
exaggerated vertical float stands in for true hovering)
**Bubbles**: `👻😈🤭💨` (ghost, mischief, shy giggle, poof/vanish)

---

### 8. `rival-plumber` — "Rival Plumber (yellow & purple)"

**Reference**: Mario's greedy, garlic-loving anti-hero rival — short and
extremely broad/heavyset, a yellow shirt and cap, purple overalls, a
distinctive zigzag mustache, and small pointed elf-like ears. (Wario.)

**Spec**
```
sk: 0.9
headR: 132
headShape: 'sphere'
limbR: 1.4             // widest/broadest member in the pack
skin: 0xf2b28c
body: 0xf0c020         // yellow shirt
legColor: 0x6a2f9e     // purple overalls
shoe: 0x4a2e1a
eyes: 'dots'
emI: 0
hands: 'sphere'
steel: false
armL: 0.9
legL: 0.75
footMul: [1.2, 1.0, 1.15]
```

**Accessories**
- **crown** — yellow cap, same dome+brim construction as the plumber
  brothers', `0xf0c020`, with a purple blank accent disc front-center
  (`0x6a2f9e`) in place of a letter, per the no-logo policy.
- **face** — the zigzag mustache: 2 small angled box segments meeting at
  a sharp point under the nose, wide and jagged rather than neat/bushy,
  `0x3a2418` — the single most character-defining accessory.
- **head** (×2) — small pointed elf-like ear tips, small cones,
  `0xf2b28c`.
- **chest** — overalls bib patch (pack-wide convention), `0x6a2f9e`, with
  2 gold button dots, `0xd9b34a` — recoloring the brothers' bib into this
  character's yellow/purple family.

**Silhouette check**: the extremely broad, stocky build (`limbR 1.4`,
widest in the pack) plus the yellow cap/shirt, purple overalls, and sharp
zigzag mustache reads instantly as "the uncouth rival plumber," clearly
distinct in hue family (yellow/purple vs. the brothers' red/green) and
proportion.

**Personality**: `bobMul: 1.4, swayMul: 1.3, cadenceMul: 0.85, ampMul: 1.15`
(a heavy, self-satisfied swaggering stomp)
**Bubbles**: `💰😤🧄💪` (greed/coins, gruff annoyance, garlic, brute
strength)

---

### 9. `barrel-ape` — "Barrel Ape (brown, red tie)"  *(v2)*

**Reference**: A huge, barrel-chested, friendly gorilla — brown fur, a
lighter tan chest/belly patch, a heavy brow ridge, small rounded ears, and
his single most identifying accessory, a red necktie worn on the bare chest.
Bulky and long-armed, he knuckle-walks in canon but stands and walks upright
on the humanoid rig here. (Donkey Kong.)

**Pet decision**: **NOT `pet: true`** — he's treated as a full character,
matching the pack's `dino-companion` (Yoshi), which sits and runs standing
activities; only `shy-ghost` (Boo) is `pet: true` in this pack. DK is a hero
of his own games, not a companion-pet, so he joins nothing random (franchise
packs are already excluded from the stranger pool) but DOES get activities
and thought bubbles.

**Spec**
```
sk:       1.2                 # big — second only to the Koopa king's 1.35
headR:    140
limbR:    1.5                 # broad, barrel-chested bulk
skin:     0x6b4a2e            # brown fur
body:     0x6b4a2e
legColor: 0x6b4a2e
shoe:     0x3a2a1a
eyes:     'dots'
hands:    'box'              # big blocky ape hands
armL:     1.3                 # long ape arms
legL:     0.85                # short relative to the long arms
footMul:  [1.3, 1.0, 1.4]     # big flat feet
```

**Accessories**
- **chest** — tan chest/belly panel, a proud box ~200×240×12 mm, `0xc9a06a`.
- **chest** (red tie) — a vertical box ~50×120×10 mm, `0xd21f1a`, over the
  panel — the single most identifying accessory.
- **head** (×2, ears) — small rounded fur spheres ~⌀40 mm, `0x6b4a2e`, at the
  head sides.
- **face** — a heavy dark brow ridge box ~110×20×12 mm, `0x2a1a12`.
- **crown** — a short dark hair tuft box ~90×40×90 mm, `0x2a1a12`.

**Silhouette check**: the huge brown-furred, long-armed, barrel-chested build
(`limbR 1.5`, the widest in the pack) with a bright red tie on a bare tan
chest is unmistakable — the only ape and the only necktie in the pack.

**Personality**: `bobMul: 0.7, swayMul: 0.9, cadenceMul: 0.7, ampMul: 1.2`
(a heavy, powerful, ground-covering knuckle-walker's roll)
**Bubbles**: `🍌🦍💪😤` (bananas, ape nature, raw strength, gruff resolve)

---

## Rig gaps

1. **No hand/glove color override.** `hands` is a shape enum only
   (`'sphere'|'box'`); hands always render in the figure's `skin` tone.
   Four of this pack's eight members (Mario, Luigi, Peach, Wario) are
   canonically white-gloved and can't get that look without recoloring
   the whole arm. A dedicated `handColor` field (or a small `hand`-anchor
   glove-shell accessory convention) would fix this across the entire
   avatar library, not just this pack — cartoon/mascot packs in general
   lean heavily on white-gloved hands.
2. **No convention for an accessory that exceeds the head's own bounding
   sphere.** Toad's mushroom cap (~200mm) is meant to read as FUSED with
   his head, not as a modest hat sitting atop a separate ~130mm head — the
   `crown` anchor's existing sizing assumptions (a small addition proud of
   the head) don't cover a case where the accessory IS effectively the
   head. Worth a documented "oversized crown" convention if more
   mushroom-headed characters are ever added.
3. **No tail anchor.** Bowser's canonical thick tail has no anchor point —
   this is at least the second pack to want one (previously flagged for a
   hypothetical Ganon beast-form in `docs/avatars/video-games/zelda.md`).
   Worth promoting to a real anchor (e.g. a `tail` slot near the hip,
   pointing backward) given the recurring demand.
4. **No hover/no-footfall locomotion mode.** Boo has no legs and should
   hover with a pure vertical bob and zero ground-contact stride — the
   rig's walk cycle always drives a 2-leg gait tied to stride phase/foot
   placement. This pack approximates it by shrinking `legL`/`limbR` and
   leaning on `bobMul`/`ampMul`, but a `hover: true` flag that fully
   suppresses leg-gait animation in favor of vertical-only bob would
   generalize cleanly to ghosts, spirits, and drone-type characters in
   future packs.
5. **No dedicated oversized-nose/snout accessory.** Yoshi's signature big
   round nose is approximated with an oversized `face` sphere bump larger
   than the rig's default nose bump, which works but isn't integrated with
   the head's own toon-shading band the way the built-in nose is — a
   `noseScale` field would read more consistently across lighting angles.
6. **(Minor, intentional) No letter/logo/decal primitive.** This is
   consistent with the pack's own no-logo policy (Mario/Luigi/Wario's cap
   emblems and Toad's spots are rendered as plain color patches, never
   letters), so not really a gap to fix — but noting it means ANY future
   pack wanting even a non-trademarked symbol (a plain star, a plus sign)
   has no text/decal primitive to build one from beyond stacking small
   geometric shapes by hand.

## Sources

- [Mario — Super Mario Wiki](https://www.mariowiki.com/Mario)
- [Mario and Luigi Color Palette — color-hex.com](https://www.color-hex.com/color-palette/18092)
- [Luigi Color Palette — color-hex.com](https://www.color-hex.com/color-palette/66379)
- [Princess Peach Mario Color Palette — color-hex.com](https://www.color-hex.com/color-palette/72899)
- [Luigi — Super Mario Wiki](https://www.mariowiki.com/Luigi)
- [Princess Peach — Super Mario Wiki](https://www.mariowiki.com/Princess_Peach)
- [Toad — Super Mario Wiki](https://www.mariowiki.com/Toad)
- [Bowser — Super Mario Wiki](https://www.mariowiki.com/Bowser)
- [Yoshi (species) — Super Mario Wiki](https://www.mariowiki.com/Yoshi_(species))
- [Boo (species) — Super Mario Wiki](https://www.mariowiki.com/Boo_(species))
- [Wario — Super Mario Wiki](https://www.mariowiki.com/Wario)
- [The official home of Super Mario — Characters, Nintendo](https://mario.nintendo.com/characters/)
- `docs/avatars/video-games/zelda.md` (this repo) — the biped-on-humanoid
  convention for non-human designs, and the recurring tail-anchor gap,
  both reused/cross-referenced here.
