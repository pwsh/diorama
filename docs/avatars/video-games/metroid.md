# Avatar pack: Metroid

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no on-model face sculpts, no names printed anywhere in-scene; character
identity lives only in this doc's Reference lines and the pack's display
labels.

## Overview

- **Group**: Bounty hunters, hostile fauna, and the Chozo/Space Pirate/
  Galactic Federation cast of Nintendo's *Metroid* series — a pack that
  spans from a single armored huntress down to a boss-scale reptile and a
  literal disembodied brain, so scale (`sk`) and silhouette-defining
  accessories do most of the identity work rather than a shared palette.
- **Hierarchy path**: `video-games / metroid`
- **Member count**: 8
- **Rig**: humanoid for every member. Three of the eight (`infant-metroid`,
  `mother-brain-jar`, and — partially — `space-dragon-ridley`'s tail) push
  hard against the humanoid rig's assumptions (a walking biped with visible
  limbs) and are noted individually plus summarized in **Rig gaps**; they're
  built as the closest achievable approximation on the existing rig rather
  than skipped.
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
- **Shared palette — the pack's recurring hues** (not every member uses
  every color; listed so recolors/future additions stay consistent):
  - Varia orange — `0xe8621c` (Samus's Power Suit plating — the pack's
    single most load-bearing color; nothing else in the pack uses it)
  - Suit red — `0xc81818` (Power Suit chestplate/accents)
  - Scan-visor green — `0x39ff6a` (Power Suit visor glow — saturated toon
    emissive, not a dim tactical green)
  - Zero Suit blue — `0x1c5fd1` (skin-tight catsuit)
  - Chozo gold-bronze — `0xc9a24a` (statue stone, aged-metal warmth; also
    tints the Power Suit's Chozo-derived tech by association, kept
    unused elsewhere so the statue owns it)
  - Pirate chitin green — `0x2f6b2f` (Space Pirate armor)
  - Pirate glow red — used as `eyes: 'redvisor'` on both the Space Pirate
    and Mother Brain — the pack's shared "hostile alien tech" eye glow
  - Ridley purple — `0x9b3fb5` (space dragon skin — kept distinct from the
    Pirate's duller chitin green and the Chozo's gold so the three
    "monster-ish" members don't collide)
  - Kraid green — `0x4a7a3a` (a warmer, more reptilian green than either
    Pirate chitin or Ridley purple)
  - Brain tissue pink-tan — `0xd99bb5` (Mother Brain's exposed mass)
  - Danger/nuclei red — `0xe6202a` (Infant Metroid's four nuclei; echoes
    the visor/eye reds elsewhere without being identical to either)
- **Pack-wide convention — "no true limbless/floating rig yet"**: two
  members (`infant-metroid`, `mother-brain-jar`) are canonically limbless
  and either float or sit rooted in a support housing. Both are approximated
  by scaling `armL`/`legL`/`limbR` down to near-zero (hiding, not removing,
  the limb geometry) rather than by any dedicated rig support for legless
  bodies — see **Rig gaps** for the two distinct proposed fixes (hover vs.
  sessile).

## Members

### 1. `power-suit-huntress` — "Bounty Huntress (orange power armor, green visor)"

**Reference**: The series' protagonist in her signature armored exoskeleton
— bulky orange plating with a red chestplate, big rounded shoulder pods, a
rounded helmet with a glowing green visor stripe, and a arm-mounted cannon
replacing one forearm/hand entirely. (Samus Aran, Varia Suit.)

**Spec**
```
sk: 1.0
headR: 130            // helmet reads slightly larger than a bare head
headShape: 'sphere'
limbR: 1.3             // bulky armored limbs
skin: 0xe8621c        // suit plating covers all exposed "skin"
body: 0xe8621c        // orange armor, main plating
legColor: 0xe8621c    // armored legs, same orange
shoe: 0xb8490f         // darker orange-red boot plates
eyes: 'visor'          // helmet visor slot — see visor color note below
emI: 0.15               // plating sheen + visor glow
hands: 'box'            // blocky armored gauntlet (non-cannon hand)
steel: true             // advanced alloy plating reads with a metallic sheen
armL: 1.0
legL: 1.05               // slightly long armored boots
footMul: [1.1, 1.0, 1.1] // bulkier armored boots
```

**Accessories**
- **chest** (chestplate) — a flattened box overlay, ~180×160×60 mm,
  `0xc81818` (suit red), centered on the torso front.
- **chest** (×2, shoulder pods — approximated here since no dedicated
  shoulder anchor exists, see Rig gaps) — two large spheres, ~110 mm
  diameter, `0xe8621c` with a darker rim accent (`0xb8490f`), offset
  laterally from the chest anchor (`x ≈ ±160, y ≈ +80`) so they read as
  pauldrons rather than a chest bulge.
- **face** (visor stripe) — a thin flattened box across the upper face,
  ~90×20×10 mm, `0x39ff6a` (scan-visor green) emissive ~0.3 — this is the
  ENTIRE eye read for this member; if the rig's `'visor'` eye style
  doesn't expose an independent color parameter, this accessory is the
  fallback that guarantees the green stripe regardless (see Rig gaps).
- **hand** (arm cannon, one arm only) — an oversized cylinder prop,
  ~70×260×70 mm, `0xe8621c` body with a dark gray tip (`0x4a4a4a`,
  ~80×40×80 mm) anchored at the hand, extending forward past the fist —
  the closest achievable approximation of "replace the forearm+hand with
  a cannon" on the current rig (true replacement is a rig gap, see below).
- **hand** (opposite arm only) — none; keep the default gauntlet hand so
  only one arm reads as weaponized.

**Silhouette check**: bulky orange/red armor + twin shoulder pods + a
glowing green visor stripe + one arm ending in a big cylinder cannon is
unmistakable even at 30px — no other member in the pack is this bulky AND
carries a visible weapon-arm.

**Personality**: `bobMul: 1.0, swayMul: 0.9, cadenceMul: 0.85, ampMul: 1.1`
(heavy, deliberate armored footfalls — confident but not light-footed)
**Bubbles**: `🎯💥🛸🧬` (target-lock/bounty focus, explosive combat, alien
tech/spacecraft, biological research — her recurring double life as hunter
and scientist-adjacent explorer)

---

### 2. `zero-suit-huntress` — "Bounty Huntress (blue bodysuit, blonde ponytail)"

**Reference**: The same huntress, out of her Power Suit — a skintight blue
catsuit covering her fully from the neck down, with a pink sensory-array
pack on her back and pink Chozo-derived markings across the chest/hands;
long blonde hair tied into a ponytail with a red band. (Zero Suit Samus.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
limbR: 0.9              // slim, form-fitting suit vs. the armored variant
skin: 0xf0c2a0         // fair skin tone (face only — see hand-color note)
body: 0x1c5fd1          // blue catsuit
legColor: 0x1c5fd1     // suit covers the legs entirely, same blue
shoe: 0x1c5fd1           // suit covers the feet too, same blue
eyes: 'almond'
emI: 0.05                 // subtle suit sheen
hands: 'sphere'
steel: false
armL: 1.0
legL: 1.05                // long-legged proportions
footMul: [0.95, 1.1, 0.95] // slightly taller boot-line silhouette
```

**Accessories**
- **crown** (bangs) — a small forward-swept cap of blonde hair,
  ~120×40×120 mm, `0xf2d675`, raised + tilted back per the standard
  hat/hair rule so the front edge clears the eye band.
- **head** (ponytail, back anchor point) — a tapered cylinder-then-cone,
  ~50×260 mm total, `0xf2d675`, trailing down from the back of the head.
- **head** (hair band) — a small ring/box accent at the ponytail base,
  ~50×20×50 mm, `0xcc2233` (red band).
- **chest** — a small pink Chozo-marking decal, a thin flattened box,
  ~70×90×6 mm, `0xff8fc7` emissive ~0.1, upper-left chest.
- **back** — the sensory-array backpack, a rounded box, ~120×140×60 mm,
  `0xff8fc7`, centered between the shoulder blades.

**Silhouette check**: the blonde ponytail + all-blue skintight suit + pink
back-mounted sensory pack reads as her civilian/vulnerable form instantly —
the pack's only slim, unarmored, visibly-haired member.

**Personality**: `bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.1, ampMul: 1.0`
(agile, light-footed — noticeably quicker than her armored counterpart)
**Bubbles**: `⚡🏃💥🛰️` (paralyzer/energy weapon, athletic agility, close
combat, orbiting spacecraft/rescue)

**Note**: the rig's `skin` field appears to govern both head and hand color
together; since Zero Suit gloves are the same blue as the rest of the suit
(not bare-skinned), this spec accepts hands rendering suit-blue as a
`body`-matched override is preferable to bare-skin-colored gloves — flagged
as a minor gap below, not blocking.

---

### 3. `infant-metroid` — "Infant Metroid (floating jelly, glowing nuclei)"

**Reference**: The parasitic life-form's larval stage — a translucent,
green-to-blue jellyfish-like membrane hood with no visible limbs, floating
in place, containing four small glowing red nuclei clustered near its
center (only three typically visible from any one angle). (Infant/Baby
Metroid.)

**Spec**
```
sk: 0.35               // tiny — a floating hood roughly 150-200mm across
headR: 140              // the membrane hood IS the whole body
headShape: 'sphere'
limbR: 0.01              // no visible limbs — see Rig gaps (hover mode)
skin: 0x8fe6c2         // translucent green-blue membrane tone
body: 0x8fe6c2          // same tone — there is effectively no separate torso
legColor: 0x8fe6c2      // hidden/matched so nothing reads as a leg
shoe: 0x8fe6c2           // hidden/matched
eyes: 'dots'             // overridden visually by the nuclei accessory below
emI: 0.25                 // soft bioluminescent glow through the membrane
hands: 'sphere'           // hidden — scaled to near-zero via limbR/armL
steel: false
armL: 0.01
legL: 0.01
footMul: [0.01, 0.01, 0.01]
```

**Accessories**
- **face** (×4, nuclei cluster) — four small spheres, ~20 mm diameter,
  `0xe6202a` emissive ~0.3, clustered near the front-center of the
  membrane hood with the 4th slightly recessed behind the front three
  (per canon, "only three usually visible from most angles").
- **hip** (×4, feeding mandibles) — tiny dark cone spikes, ~10×18×10 mm,
  `0x3a3a3a`, on the underside of the hood — small enough to read as
  texture rather than a defining silhouette element.

**Silhouette check**: a small translucent green-blue dome with a visible
cluster of glowing red nuclei, no visible limbs at all, and a gentle
vertical hover-bob instead of a walk cycle — instantly reads as the
Metroid creature and is the pack's only limbless, non-grounded member.
**Flagged as a rig gap**: true floating locomotion and membrane
translucency are both outside the documented rig fields (see Rig gaps).

**Personality**: `bobMul: 1.6, swayMul: 1.3, cadenceMul: 0.4, ampMul: 0.6`
(slow vertical float-bob + gentle drifting sway, no walk cadence to speak
of — see the hover-mode rig gap)
**Bubbles**: `🧬💜🩸👻` (parasitic life-drain, otherworldly biology, energy
drain, ghostly/eerie floating presence)

---

### 4. `space-pirate-trooper` — "Space Pirate (green chitin armor, glowing red eyes)"

**Reference**: The recurring rank-and-file hostile alien soldier — green
chitinous exoskeleton armor over a reptilian purple-skinned body, glowing
fiery red/orange eyes, and forearm-mounted weaponry: a cannon on one arm,
a bladed scythe on the other. (Space Pirate, standard trooper.)

**Spec**
```
sk: 1.0
headR: 120
headShape: 'box'        // angular armored/insectoid helmet silhouette
limbR: 1.15              // chitinous armor bulk
skin: 0x7a2e8f          // purple reptilian skin, visible at joints/neck
body: 0x2f6b2f           // green chitin armor plating
legColor: 0x234d23      // darker green armored legs
shoe: 0x234d23            // darker green armored boots/claws
eyes: 'redvisor'          // fiery glowing eyes
emI: 0.3                   // glowing eyes + joint-light accents
hands: 'box'               // clawed gauntlet
steel: false               // chitin, not metal — matte armor look
armL: 1.0
legL: 0.95                  // slight crouched/prowling stance
footMul: [1.2, 0.8, 1.3]   // wide, flat reptilian clawed feet
```

**Accessories**
- **head** (×2, helmet ridges) — small backswept armor fins,
  ~40×70×20 mm, `0x1c4d1c`, one per side.
- **hand** (scythe arm) — a curved blade prop, ~30×220×15 mm, `0x4a4a4a`
  with a lighter edge highlight (`0x8a8a8a`), anchored forward-curving
  from one hand.
- **hand** (cannon arm, opposite hand) — a cylinder prop, ~60×200×60 mm,
  `0x3a3a3a`, anchored extending forward from the other hand.
- **back** (×3, dorsal ridge) — small cone spikes down the spine,
  ~30×50×30 mm, `0x1c4d1c`, proud of the armor surface.

**Silhouette check**: green chitin armor + purple joint gaps + glowing red
eyes + one bladed arm / one cannon arm is instantly "Space Pirate grunt" —
the pack's only member with two DIFFERENT weaponized arms simultaneously.

**Personality**: `bobMul: 0.9, swayMul: 0.7, cadenceMul: 1.2, ampMul: 1.05`
(a quick, aggressive, skittering prowl — noticeably faster cadence than
the armored huntress)
**Bubbles**: `👾💢⚔️🛸` (alien hostile, aggression, melee/blade combat,
starfaring pirate fleet)

---

### 5. `chozo-guardian-statue` — "Chozo Statue (gold-bronze, bird motif, dormant guardian)"

**Reference**: A stone/metal guardian statue built by the extinct
bird-like Chozo race — distinctly avian silhouette (beaked head, folded
wing-backs), aged gold-and-bronze stone construction, often seen holding
an item sphere and occasionally animating into a hostile "Torizo" with
glowing golden eyes. (Chozo Statue.)

**Spec**
```
sk: 1.15               // statues read tall and imposing
headR: 135
headShape: 'box'        // angular carved-stone head (see beak accessory)
limbR: 1.4               // thick carved-stone limbs
skin: 0xc9a24a          // aged gold/bronze stone tone
body: 0x8a7048           // weathered stone brown-gold torso
legColor: 0x8a7048       // stone all over, no separate garment break
shoe: 0x5c4a2e            // dark stone/talon feet
eyes: 'halfred'            // dormant-to-glowing eye read (amber when active)
emI: 0.1                    // faint rune-glow accents, mostly inert
hands: 'box'                // clawed stone talons
steel: false                // carved stone, not polished metal
armL: 1.05
legL: 1.0
footMul: [1.3, 1.0, 1.3]    // heavy taloned stone feet
```

**Accessories**
- **crown** — a carved feather/crest motif, a swept-back cone,
  ~130×110×90 mm, `0xc9a24a`, angled up and back like a bird's crest —
  clears the eye band per the standard hat rule.
- **face** — a beak: a forward-pointing cone, ~60×90×60 mm, `0x7a6038`
  (darker stone), positioned where a nose would be, angled slightly down.
- **back** (×2, folded wings) — two flattened, tapered box/cone shapes,
  ~250×340×40 mm each, `0x8a7048` (body-matched), angled back and down
  as if folded at rest.
- **hip** — a carved stone belt ridge, a thin band, ~body-width×140×20 mm,
  `0x5c4a2e`.
- **chest** — a small glowing rune emblem, a flattened box, ~60×60×10 mm,
  `0xe6a23c` emissive ~0.4 (lights up brighter if used as an "activated
  Torizo" variant).

**Silhouette check**: the bulky gold-bronze stone body + hooked beak +
folded stone wings + heavy talons, held nearly motionless, reads as
"ancient guardian statue" rather than a living character — the personality
multipliers (near-zero bob/sway) do as much of the read as the geometry.

**Personality**: `bobMul: 0.1, swayMul: 0.05, cadenceMul: 0.6, ampMul: 0.7`
(statue-still — minimal idle motion; on the rare occasion it moves, it's
slow and deliberate, befitting stone brought to life)
**Bubbles**: `🗿⚱️✨` (stone/statue, ancient relic, dormant magic/technology)

---

### 6. `space-dragon-ridley` — "Space Dragon (purple, wings, bladed tail)"

**Reference**: A towering, dragon/pteranodon-like space pirate commander —
scaly purple skin (the most common depiction across the series, though it
varies game to game), glowing yellow eyes, large membranous wings, a bent
long neck, and a long tail ending in a bladed tip. (Ridley.)

**Spec**
```
sk: 1.6                // towering boss-scale — the largest silhouette lever here
headR: 140
headShape: 'box'         // elongated, angular draconic skull
limbR: 1.1                // lean but powerful clawed limbs
skin: 0x9b3fb5           // canonical purple scaled skin
body: 0x7a2f96            // slightly deeper purple chest/underbelly plates
legColor: 0x3a1a45        // dark taloned lower legs
shoe: 0x3a1a45              // dark clawed feet
eyes: 'slit'                 // reptilian slit pupils
emI: 0.35                     // glowing yellow eye emissive
hands: 'box'                  // large clawed talons
steel: false
armL: 1.2                     // long clawed arms
legL: 1.15                     // long, digitigrade raptor-like legs
footMul: [1.3, 0.9, 1.5]       // taloned raptor feet
```

**Accessories**
- **crown** (×2, head crest/horns) — small backswept cones,
  ~40×90×40 mm, `0x5c2570`, one per side of the head crest.
- **back** (×2, wings) — large flattened, tapered cone/box shapes,
  ~400×550×30 mm each, `0x5c2570` (a darker purple membrane tone than the
  body), held in a static outstretched pose — no flap animation (see
  Rig gaps).
- **hip** (tail, segmented chain) — 2–3 tapering cylinder/cone segments,
  ~60→30 mm diameter tapering over ~600 mm total length, `0x7a2f96`
  (body-matched), extending backward and slightly down from the hip
  anchor, ending in a bone-white bladed cone tip (~50×90×50 mm,
  `0xd9d9d9`) — a static approximation of the canonical swaying,
  bladed-tip tail (see Rig gaps).

**Silhouette check**: the sheer scale (`sk 1.6`, the largest in the pack)
combined with purple scaled skin, large static wings, and a long bladed
tail reads as a boss-scale space dragon even in silhouette — no other
member is this tall or carries a tail at all.

**Personality**: `bobMul: 1.3, swayMul: 1.4, cadenceMul: 0.75, ampMul: 1.3`
(a wide, menacing predatory swagger — heavy powerful strides, the
widest sway in the pack)
**Bubbles**: `🔥🐉💢🩸` (fire breath, dragon nature, aggression, predatory
violence)

---

### 7. `reptilian-behemoth-kraid` — "Reptilian Behemoth (green, huge belly, small head)"

**Reference**: A gigantic, room-filling reptilian boss creature —
disproportionately small head atop a massive green-scaled belly, huge
clawed arms, short stubby legs relative to its bulk. (Kraid.)

**Spec**
```
sk: 1.8                 // the largest scale in the pack — a room-filling boss
headR: 100                // deliberately SMALL relative to the body — key tell
headShape: 'sphere'
limbR: 1.6                  // extremely thick limbs
skin: 0x4a7a3a             // green reptilian skin
body: 0x3d6b30              // slightly darker green torso/back plates
legColor: 0x2a4a22          // dark taloned legs
shoe: 0x2a4a22                // dark taloned feet
eyes: 'dots'                   // small beady eyes — reinforces the tiny-head joke
emI: 0.05                       // mostly matte, minimal glow
hands: 'box'                    // massive oversized clawed hands
steel: false
armL: 1.4                       // huge long arms
legL: 0.8                        // short stubby legs relative to the torso
footMul: [1.6, 1.0, 1.6]         // huge stomping feet
```

**Accessories**
- **chest** (oversized belly overlay — the single most important
  accessory in this spec) — a large sphere/box bulge, ~450×420×380 mm,
  `0x6a9a52` (a lighter green than the back, per canon's lighter
  belly-plate coloring), scaled up well past a normal chest-emblem size
  so it defines the torso silhouette rather than accenting it (this is a
  soft rig gap — see Rig gaps).
- **hand** (×2, claw clusters) — 3–4 small cone tips per hand,
  ~30×60×30 mm each, `0xe8e0c8` (pale cream claws).
- **head** (×2, jaw spikes) — tiny cones along the jawline,
  ~15×25×15 mm, `0x3d6b30` (body-matched, darker).
- **back** (×4-5, dorsal ridge) — small cones down the spine,
  ~40×70×40 mm, `0x254019`, proud of the surface.

**Silhouette check**: a tiny head atop a gigantic green belly with massive
clawed arms is instantly "Kraid" even in flat silhouette — the scale
(`sk 1.8`) plus the oversized belly accessory do essentially all of the
identity work; no facial detail is needed at all.

**Personality**: `bobMul: 0.6, swayMul: 0.4, cadenceMul: 0.5, ampMul: 0.6`
(lumbering, minimal-bob, very slow heavy steps — mass reads as weight and
near-stationary boss presence rather than active locomotion)
**Bubbles**: `🦖💢🌋🩸` (reptilian monster, aggression, volcanic/subterranean
lair, brute violence)

---

### 8. `mother-brain-jar` — "Brain in a Jar (pink brain mass, glass tank, single eye)"

**Reference**: A giant sentient brain housed in a glass tank/dome atop a
mechanical support pedestal, with tubes running to a life-support base and
a single large glowing eye as its primary visible feature — the series'
recurring central antagonist/computer intelligence. (Mother Brain.)

**Spec**
```
sk: 1.3                   // tank + brain assembly reads large
headR: 190                  // the exposed brain mass dominates the silhouette
headShape: 'sphere'
limbR: 0.01                  // no limbs — see Rig gaps (sessile mode)
skin: 0xd99bb5              // pink-tan wrinkled brain tissue
body: 0x2a2a33                // dark mechanical housing/pedestal (mostly hidden below the head)
legColor: 0x1a1a20            // hidden/dark base
shoe: 0x1a1a20                  // hidden/dark base
eyes: 'redvisor'                 // single large glowing eye is THE iconic feature
emI: 0.25                          // glowing eye + tank-glass sheen
hands: 'sphere'                     // hidden — scaled to near-zero
steel: true                          // mechanical housing reads with metallic sheen
armL: 0.01
legL: 0.3                              // short stubby pedestal base instead of legs
footMul: [0.01, 0.01, 0.01]
```

**Accessories**
- **crown** (glass tank/dome) — a large sphere shell slightly bigger than
  the head, ~420 mm diameter, `0xbfe8f0` (pale cyan glass tone) emissive
  ~0.1 — represents the enclosing tank; true glass translucency is a rig
  gap (see below, shared with the Infant Metroid's membrane).
- **hip** (×3-4, life-support tubes) — thin cylinders, ~20×280×20 mm,
  `0x6a6a72`, trailing down/back into the mechanical base, a couple with
  colored tips (`0xc23030` red, `0xd4af37` amber) for visual variety.
- **chest** (mechanical pedestal, standing in for the hidden body) — a
  large box/cylinder, ~300×260×300 mm, `0x2a2a33`, housing the "body"
  below the tank.

**Silhouette check**: a huge pink wrinkled brain mass inside a pale glass
dome, sitting on a dark mechanical pedestal with trailing tubes and one
glowing red eye, reads as Mother Brain even with literally no limbs
visible — the pack's most extreme departure from the walking-biped rig
assumption.

**Personality**: `bobMul: 0.15, swayMul: 0.1, cadenceMul: 0.3, ampMul: 0.4`
(nearly motionless — an occasional slow pulse/throb rather than any walk
cycle; see the sessile-mode rig gap)
**Bubbles**: `🧠⚡💢👁️` (raw intellect/computer mind, electrical power,
malice, the single all-seeing eye)

## Rig gaps

- **No hover/floating locomotion mode.** The Infant Metroid canonically
  floats in place with no ground contact and no functional limbs. This
  spec approximates it by scaling `armL`/`legL`/`limbR` to near-zero
  (hiding, not removing, the joint geometry) and leaning entirely on
  `bobMul`/`swayMul` for its motion. A cleaner fix would add a `hover: bool`
  flag that lifts the whole rig root on a sine-wave bob and disables the
  leg/arm walk-cycle animation entirely, rather than relying on shrunk-to-
  invisible limbs that still technically animate underneath.
- **No sessile/rooted idle mode.** Mother Brain is grounded (not floating)
  but has no legs to animate a walk cycle at all — it's fixed in its
  pedestal. This is a distinct need from the hover gap above: a
  `sessile: bool` (or similar) flag that disables locomotion entirely while
  allowing a slow idle pulse/throb, rather than hover's floating vertical
  bob. Both this pack's limbless members need one or the other; neither
  exists today.
- **No translucent/semi-transparent material channel.** Both the Infant
  Metroid's membrane body and Mother Brain's glass tank are canonically
  translucent, and neither `skin`/`body` nor accessory colors expose an
  alpha/opacity parameter in the documented spec fields — both are
  approximated here with solid (if pale/soft) colors instead of true
  transparency.
- **No dedicated shoulder/pauldron anchor.** The Power Suit's iconic
  shoulder pods are approximated via oversized off-center `chest`-anchor
  accessories rather than a purpose-built shoulder attachment point. Works
  fine here, same workaround the Mandalorian/Zelda packs already use for
  pauldrons — but a dedicated shoulder anchor would generalize better
  across any future armored-suit pack.
- **No true per-limb primitive replacement ("arm cannon").** The Power
  Suit's cannon-arm is approximated with an oversized `hand`-anchored
  cylinder prop rather than actually replacing the forearm+hand geometry
  the ask called for. Visually close at 30px, but a rig that could swap an
  entire limb segment for a custom primitive would look more correct up
  close and generalize to any other "weapon-arm" character.
- **No animated/jointed tail-on-humanoid.** Ridley's tail is a static,
  fixed-pose chain of tapering primitives bolted to the `hip` anchor —
  there's no support for a tail with its own sway/animation physics
  independent of the walk cycle. (This gap has come up before in other
  packs for unrelated characters; Ridley is a second, independent case
  that would benefit if it's ever built.)
- **No wing-flap animation.** Ridley's wings are static `back`-anchored
  panels held in a fixed outstretched pose — no flap cycle exists.
- **No dedicated avian head shape.** The Chozo Statue's beaked bird-head
  is approximated with a `box` headShape plus a forward-pointing cone
  accessory rather than a purpose-built avian head primitive. Workable,
  but a true beak/avian head shape would read cleaner and generalize to
  any future bird-themed pack.
- **Oversized torso-defining accessory risk (Kraid's belly).** The `chest`
  anchor is designed and battle-tested for small emblems/badges, not for
  an accessory scaled up to override the entire torso silhouette. It reads
  correctly here, but there's a real risk of geometry clipping against the
  body/limb-base mesh at that scale that a purpose-built "body shape
  override" wouldn't have — flagged as a soft gap, not a blocker.
- **`skin` field doesn't separately color hands vs. head.** Noted under
  Zero Suit Samus: when a costume's gloves differ from its face's skin
  tone (or, as here, match the suit rather than bare skin), there's no
  independent hand-color channel — only the single `skin` field for both.

## Sources

- [Varia Suit — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Varia_Suit)
- [Metroid: Each of Samus Aran's Power Suits Explained — Game Rant](https://gamerant.com/metroid-samus-aran-power-suits-explained/)
- [Zero Suit Samus — SmashWiki](https://www.ssbwiki.com/Zero_Suit_Samus)
- [Samus's Hairstyle — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Samus's_Hairstyle)
- [The Fashion of Samus Aran — Shinesparkers](https://shinesparkers.net/features/the-fashion-of-samus-aran/)
- [Metroid larva — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Metroid_larva)
- [Infant Metroid — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Infant_Metroid)
- [Metroid (species) — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Metroid_(species))
- [Space Pirate (Metroid Prime) — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Space_Pirate_(Metroid_Prime))
- [Space Pirate — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Space_Pirate)
- [Chozo Statue — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Chozo_Statue)
- [Golden Torizo — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Golden_Torizo)
- [Torizo — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Torizo)
- [Ridley — Wikitroid (Fandom)](https://metroid.fandom.com/wiki/Ridley)
- [Characters in Metroid - Ridley — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Characters/MetroidRidley)
- `docs/avatars/sci-fi/star-wars-mandalorian.md` (this repo) — the
  pauldron/shoulder-anchor-approximation convention this pack reuses for
  the Power Suit's shoulder pods.
- `docs/avatars/video-games/zelda.md` (this repo) — the "no dedicated
  tail/fin/wing primitive" and hat/hair eye-band-clearance conventions
  this pack follows for Ridley, the Chozo Statue, and Zero Suit Samus.
