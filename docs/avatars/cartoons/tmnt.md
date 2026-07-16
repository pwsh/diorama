# Avatar pack: Cartoons ▸ Half-Shell Ninja Squad

Hierarchy path: `docs/avatars/cartoons/tmnt.md` → generated pack id
`cartoons/tmnt`.

## Overview

A seven-member set of stylized, geometric toon-homage figures inspired by the
sewer-dwelling mutant-ninja-brothers team and their circle — **not** licensed
characters, no likenesses/logos/textures. Every member is built from the
shared humanoid rig (`_buildHumanoid`) using only primitive shapes (box/
sphere/cylinder/cone) in flat saturated colors, per the Sims-toon house style
(`MeshToonMaterial`, 4-step gradient bands, dark cartoon outlines, oversized
head/hands, green plumbob overhead). Labels are descriptive-generic ("Leader
(blue mask)"); the actual character each one homages is named once in that
member's **Reference** line for the researcher/regenerator, never in the
label or in-game copy.

This pack is the textbook **pack-inheritance test case**: four of the seven
members (the mutant-turtle brothers) share one `turtleBase` spec almost
verbatim, differing only in mask color, a couple of build tweaks (height/
bulk), and their signature weapon accessory — while the other three (the rat
sensei, the reporter ally, the armored villain) are fully bespoke builds that
stress-test the rig in different directions (a tailed quadruped-adjacent
humanoid, a fixed-hue civilian costume, and a `steel:true` armored antagonist).

**Pack-wide turtle base spec** (the four brothers start here, then override
mask color / weapon / minor build tweaks):
```ts
turtleBase: {
  sk: 0.92, headR: 130, headShape: 'sphere', limbR: 1.15,
  skin: 0x4a9c53 /* turtle green, identical across all four */,
  body: 0x4a9c53 /* bare torso, same green — no shirt */,
  shoe: 0x4a9c53 /* barefoot, reads as continuous green */,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
  armL: 1.0, legL: 0.95, footMul: [1.3, 0.8, 1.3] /* wide three-toed clawed feet */,
},
```
`footMul` reuses the same non-default-shoe-shape trick the base rig's duck
kind already uses for its webbed feet — here approximating a turtle's wide
clawed foot instead of a flipper. `sk: 0.92` (vs. the `adult` kind's `1.0`)
plus `limbR: 1.15` gives the whole quartet a stocky, muscular teenager build
before any per-member tweak.

**Shared accessory recipe across all four turtles** (called out once here,
referenced per member below instead of repeated verbatim):
- **face + head**: mask — a thin band box (`HEAD_R*1.05 × HEAD_R*0.28 ×
  10mm`) across the brow line (a bandana sitting ABOVE the eye line, not
  covering them — the generic `dots` eyes stay visible through the "eye
  holes," same layering idea as the base rig's brow/eye stacking), plus two
  short trailing tail-ends (thin flattened boxes, `HEAD_R*0.25 × HEAD_R*0.9 ×
  6mm`) hanging off the back of the head at ear height from the mask's knot.
  Color is the ONE thing that changes per brother (see each member).
- **back**: shell — a broad dome/hemisphere (`r ≈ TORSO_W*1.3`, phi 0..2π,
  theta 0..0.55π) covering the back from shoulder to hip, dark green
  `0x2f5233`, with a thin lighter-green rim ring (`0x3f6a43`, a slightly
  larger flattened torus/cylinder band at the dome's open edge) for a
  plated-segment hint without a decal.
- **chest/torso-front**: plastron — a pale tan-cream flattened oval plate
  (`TORSO_W*0.85 × TORSO_H*0.9 × 10mm`), `0xd8c9a0`, on the front torso —
  the belly-plate every turtle iteration keeps regardless of adaptation.
- **hip**: belt — a brown leather band (`TORSO_W*1.05 × TORSO_H*0.14 ×
  TORSO_D*1.05`, `0x6b4423`) with a small square buckle box colored to match
  that brother's mask. This is the pack's answer to the brief's "belt
  initials" cue: since the rig has no text/decal capability (house-style
  rule — color + shape only), the buckle is **color-coded to the mask**
  instead of lettered; see Rig gaps for the explicit note on why an actual
  glyph isn't possible.

Each brother then adds ONE weapon accessory (their canonical signature) and a
small per-member `sk`/`limbR`/`armL` build tweak reflecting their established
body-type differences (Donatello lankiest/tallest, Raphael stockiest/most
muscular, Michelangelo smallest/roundest, Leonardo the balanced baseline).

---

## Members

### leo
**Label**: Leader (blue mask, twin swords)
**Reference**: The disciplined eldest brother and team leader, trained in
ninjutsu by his rat-sensei father figure — canonical for his blue mask and
twin katana blades.

**Spec**
```ts
leo: {
  sk: 0.93, headR: 130, headShape: 'sphere', limbR: 1.15,
  skin: 0x4a9c53, body: 0x4a9c53, shoe: 0x4a9c53,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
  armL: 1.0, legL: 0.95, footMul: [1.3, 0.8, 1.3],
},
```

**Accessories**
- **face/head**: shared mask recipe (see Overview), blue `0x2b5faa`.
- **back**: shared shell + plastron + belt recipe (see Overview); buckle
  `0x2b5faa` to match the mask.
- **back (weapon)**: twin katana — two long thin boxes (`14mm*sk × 320mm*sk
  × 6mm` each) crossed in an X over the shell, hilt-down, matte-grey blades
  `0xb8bcc2` with dark hilts `0x1a1a1a` — the pack's cleanest weapon read
  (two long straight primitives, no approximation needed).

**Silhouette check**: identical green silhouette to his brothers at 30px —
the blue mask band is the ONLY differentiator, exactly the pack-inheritance
point; the crossed katana on the shell confirms up close. Fully achievable.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 }`
(controlled, disciplined, purposeful stride — team-leader composure).
**Bubbles**: `['⚔️', '🧭', '📜', '🐢']`

---

### raph
**Label**: Hothead (red mask, twin sai)
**Reference**: The hot-tempered, most physically powerful brother, quick to
anger and quicker to act alone — canonical for his red mask and twin
three-pronged sai.

**Spec**
```ts
raph: {
  sk: 0.90, headR: 130, headShape: 'sphere', limbR: 1.25 /* bulkiest build */,
  skin: 0x4a9c53, body: 0x4a9c53, shoe: 0x4a9c53,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
  armL: 1.0, legL: 0.92, footMul: [1.3, 0.8, 1.3],
},
```

**Accessories**
- **face/head**: shared mask recipe, red `0xc62828`.
- **back**: shared shell + plastron + belt recipe; buckle `0xc62828`.
- **hip (weapon)**: twin sai — two short cylinders (`10mm*sk r, 140mm*sk h`)
  slotted into the belt at the hips, each with a small perpendicular
  cross-guard box (`36mm*sk × 8mm*sk × 8mm*sk`) near the grip end,
  matte-grey `0xb0b4ba`. **Approximated** — a true forked sai prong can't be
  built from straight primitives; see Rig gaps.

**Silhouette check**: same green base silhouette; the red mask + visibly
bulkier build (`limbR 1.25`, shortest `sk`) reads as "the strong one" even
before the mask color registers at very small sizes. Fully achievable
(weapon shape is an approximation, not a blocker).

**Personality**: `{ bobMul: 1.2, swayMul: 1.3, cadenceMul: 1.15, ampMul: 1.2 }`
(aggressive, heavy-footed, quick to stomp — barely-contained temper).
**Bubbles**: `['😤', '🔥', '💢', '🏍️']`

---

### donnie
**Label**: Brains (purple mask, bo staff)
**Reference**: The team's tech-and-science genius and inventor, the tallest
and lankiest of the four brothers — canonical for his purple mask and long
bo staff.

**Spec**
```ts
donnie: {
  sk: 0.95 /* tallest brother */, headR: 130, headShape: 'sphere', limbR: 1.1,
  skin: 0x4a9c53, body: 0x4a9c53, shoe: 0x4a9c53,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
  armL: 1.05 /* lankier */, legL: 1.0, footMul: [1.3, 0.8, 1.3],
},
```

**Accessories**
- **face/head**: shared mask recipe, purple `0x8b3fa0`.
- **back**: shared shell + plastron + belt recipe; buckle `0x8b3fa0`.
- **back (weapon)**: bo staff — a single long thin cylinder (`16mm*sk r,
  900mm*sk h`, wood-brown `0x7a5230`) slung diagonally across the shell,
  extending well above the head — deliberately the single tallest accessory
  in the pack, echoing how consistently his staff reads as "the tech one's
  weapon" across adaptations (length over cleverness of shape — a plain
  cylinder is the whole trick).

**Silhouette check**: same green base silhouette; the purple mask + the bo
staff's silhouette poking up well past the head is the one thing that reads
"Donnie" even in a crowd shot of all four brothers. Fully achievable.

**Personality**: `{ bobMul: 0.9, swayMul: 0.8, cadenceMul: 0.95, ampMul: 0.9 }`
(measured, thoughtful, slightly stooped-forward-in-thought gait).
**Bubbles**: `['🔧', '💻', '📡', '🤓']`

---

### mikey
**Label**: Party Dude (orange mask, nunchaku)
**Reference**: The easygoing, food-obsessed, comic-relief youngest brother —
canonical for his orange mask and nunchaku.

**Spec**
```ts
mikey: {
  sk: 0.88 /* smallest, roundest build */, headR: 132, headShape: 'sphere', limbR: 1.15,
  skin: 0x4a9c53, body: 0x4a9c53, shoe: 0x4a9c53,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
  armL: 0.95, legL: 0.92, footMul: [1.35, 0.85, 1.35],
},
```

**Accessories**
- **face/head**: shared mask recipe, orange `0xf47a1f`.
- **back**: shared shell + plastron + belt recipe; buckle `0xf47a1f`.
- **hand (weapon)**: nunchaku — two short cylinders (`14mm*sk r, 110mm*sk h`,
  dark wood `0x2a1e14`) linked by a single thin short connecting cylinder
  (`4mm*sk r, 24mm*sk h`), held loosely at one hand. **Approximated** — no
  functioning chain-link/swing physics, just a static three-segment prop;
  same class of approximation as the pack's sai.

**Silhouette check**: same green base silhouette; the orange mask + visibly
the roundest/smallest of the four (largest `headR`, smallest `sk`) reads as
"the goofy young one" instantly, before the mask color even registers.
Fully achievable (weapon shape approximated, not blocking).

**Personality**: `{ bobMul: 1.4, swayMul: 1.4, cadenceMul: 1.25, ampMul: 1.3 }`
(bouncy, restless, exaggerated goofball energy — the biggest walk-cycle
multipliers in the pack).
**Bubbles**: `['🍕', '🤙', '😝', '🎮']`

---

### sensei
**Label**: Sensei (rat master, walking staff)
**Reference**: The elderly mutant-rat martial-arts master who raised and
trained the four brothers as his own sons — canonical for aged brown fur, a
simple robe and belt, and a wooden staff; robe color varies widely across
adaptations (pink, gray monk's robes, tan, burgundy), so this build picks a
neutral warm brown that reads clearly against the green brothers rather than
pinning to one adaptation's exact hue.

**Spec**
```ts
sensei: {
  sk: 0.86 /* elderly, smaller/hunched read via reduced scale */,
  headR: 118, headShape: 'sphere', limbR: 0.85,
  skin: 0x7a5230 /* brown fur */, body: 0x6e4a2e /* warm brown robe */,
  shoe: 0x2a2016 /* dark wrapped feet */, legColor: 0x6e4a2e /* robe covers legs to the floor */,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false, armL: 0.9, legL: 0.85,
},
```
`body` and `legColor` matching keeps the robe reading as one continuous
flowing garment from shoulder to floor rather than a separate shirt/pants
break — the same "uniform single-tone" trick the base rig's `mummy` kind
uses for its wrap.

**Accessories**
- **face**: snout — a small forward-projecting cone (`r=HEAD_R*0.35,
  h=HEAD_R*0.55`, fur-matched `0x7a5230`) at the nose position, replacing the
  generic nose bump.
- **head**: round rat ears — two small flattened spheres (`r=HEAD_R*0.4`) on
  the top-sides of the head, darker fur `0x5c3d22`, rounder and higher-set
  than the generic humanoid ear bump (drives an `EAR_SKIP` addition — a
  furred rat head has no separate generic ear nub).
- **face (accent)**: 4–6 very thin whisker cylinders (`r=2mm*sk, h=70mm*sk`)
  radiating from the sides of the snout — a fine detail that may not read
  below ~50px; see Silhouette check.
- **hip**: black belt/sash — a dark band (`TORSO_W*1.0 × TORSO_H*0.13 ×
  TORSO_D*1.0`, `0x141210`) over the robe at the waist.
- **hand**: walking staff — a long thin cylinder (`r=16mm*sk, h=780mm*sk`,
  aged wood `0x4a3420`), held vertically, taller than the rig itself.
- **NOT built — tail**: this member's long rat tail is a flagged rig gap (no
  tail anchor exists on the humanoid rig); see Rig gaps. It is the single
  biggest authenticity loss for this member.

**Silhouette check**: the small, hunched, brown-furred silhouette with a
tall staff is the one thing that reads "elder sensei" among six other larger/
brighter members at 30px; the rat ears + snout confirm up close. The missing
tail is the pack's headline rig gap.

**Personality**: `{ bobMul: 0.55, swayMul: 0.45, cadenceMul: 0.65, ampMul: 0.6 }`
(slow, deliberate, minimal wasted motion — a lifetime of discipline in every
step).
**Bubbles**: `['🍵', '🧘', '☯️', '📜']`

---

### reporter
**Label**: Reporter (yellow jumpsuit)
**Reference**: The brothers' human ally, a local TV news reporter —
canonical (classic animated look) for a bright yellow jumpsuit, white boots,
and a shoulder-length reddish-auburn bob.

**Spec**
```ts
reporter: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.95,
  skin: 0xe8b48c, body: 0xf4c430 /* signature yellow jumpsuit */,
  shoe: 0xf2f2ee /* white boots */, legColor: 0xf4c430,
  emI: 0.08, hands: 'sphere', eyes: 'almond', steel: false,
},
```

**Accessories**
- **crown/head**: shoulder-length bob — a rounded volume sphere at the crown
  plus a slightly flared lower sphere for the classic bob flip, auburn-red
  `0xa8452a`.
- **hip**: thin belt at the waist, `color` (the sensor/person tint) — the
  one piece of this fixed-hue costume kept open for per-sensor coding, same
  convention as every other fixed-palette kind in the base rig.
- **hand** *(optional flourish)*: microphone/handheld minicam — a small dark
  cylinder-and-box prop (`r=20mm*sk, h=90mm*sk` cylinder + a small box head),
  `0x1a1a1a`, held in one hand.

**Silhouette check**: the flat, saturated yellow jumpsuit is the one thing
that reads instantly at 30px — no other member in the pack (or, practically,
in most Diorama scenes) wears this color; the auburn bob confirms up close.
Fully achievable.

**Personality**: `{ bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.05, ampMul: 1.0 }`
(brisk, alert, always-on-the-story energy).
**Bubbles**: `['🎙️', '📰', '📷', '❗']`

---

### villain
**Label**: Villain (spiked mask, cape)
**Reference**: The brothers' armored ninja-master arch-nemesis — canonical
for a spiked metal helmet/mask that fully hides his face, blade-edged
gauntlets, dark battle armor, and a flowing cape.

**Spec**
```ts
villain: {
  sk: 1.05 /* imposing, taller than the turtles */,
  headR: 128, headShape: 'sphere', limbR: 1.1,
  skin: 0x2a2a2e /* hidden under a full mask — dark tone shows only at joints */,
  body: 0x8e97a0 /* brushed-steel armor plating over the torso */,
  shoe: 0x585d64, legColor: 0x3a1f24 /* dark maroon under-armor on the legs */,
  emI: 0.15, hands: 'box' /* armored gauntlets */, eyes: 'redvisor', steel: true,
},
```

**Accessories**
- **crown**: spiked helmet — a near-full angular shell over the head
  (`r=HEAD_R*1.15`, phi 0..2π, theta 0..0.9π, `steel` `_mat`, same recipe as
  the base rig's `knight` helm) PLUS 5–6 short cone blades radiating from the
  crown/sides (`r=14mm*sk tapering, h=50–90mm*sk`, dark steel `0x51565c`) —
  covers the ears (`EAR_SKIP` addition, same reasoning as `knight`).
- **back**: cape — a large flowing cone (`r=TORSO_W*1.4, h=TORSO_H*2.4`),
  dark purple `0x3a1f45`, hanging from the shoulders — the pack's biggest
  single silhouette element.
- **chest/torso-front**: shoulder + chest plating — proud box plates at each
  shoulder (`TORSO_W*0.4 × TORSO_H*0.35 × 18mm` each) plus a center chest
  ridge box, all `steel` `_mat`, with a small dark-maroon accent strip at the
  sternum, `color` (the sensor/person tint) — the one piece of this
  fixed-palette villain kept open for per-sensor coding, same convention as
  the base rig's `knight` tabard.
- **hand**: gauntlet blades — 3 short thin cone "blades" (`r=8mm*sk,
  h=70–110mm*sk`) fanned out from each fist in place of visible fingers,
  matte-steel `0xb8bcc2`.

**Silhouette check**: the spiked-steel helmet + flowing dark cape silhouette
is the one thing that reads "armored villain" at 30px, unmistakably distinct
from the four bare-headed green brothers; the fanned gauntlet blades and
`redvisor` glowing eyes confirm up close. Fully achievable.

**Personality**: `{ bobMul: 0.8, swayMul: 0.7, cadenceMul: 0.9, ampMul: 0.85 }`
(heavy, deliberate, menacing stride — armor-weighted).
**Bubbles**: `['⚔️', '😈', '💢', '👹']`

---

## Rig gaps

1. **No tail-on-humanoid anchor.** The seven current accessory anchors
   (`crown`, `head`, `face`, `chest`/`torso-front`, `back`, `hip`, `hand`)
   have no attachment point behind/below the hip suited to a trailing tail on
   a **bipedal** rig (quadrupeds get a real tail via `_buildQuadruped`, but
   that rig walks on four legs and can't stand/pose like this pack's rat
   sensei). **Sensei** ships without his signature long rat tail as a result
   — the single biggest authenticity gap in the pack. A future rig extension
   (an optional `tail` anchor at the hip-back, built the same way the
   quadruped tail already is — a 2-segment tapering cylinder chain with
   idle sway) would fix this cleanly and would also benefit any future
   pack with tailed-but-bipedal members (were-creatures, anthro mascots).
2. **No limb-midpoint anchor for bands/pads.** Several modern versions of
   the four brothers add color-matched wrist/knee/elbow pads over an
   otherwise bare-limbed look. The current anchor set has nothing at a limb
   midpoint (only `hand` at the extremity). Not blocking here — the mask
   color alone fully disambiguates the four brothers per the brief's own
   framing — but flagged since it would round out this exact archetype (and
   any future armored/padded pack) with one more coordinated color accent
   per member.
3. **No forked/curved small-prop geometry.** Straight primitives (box/
   sphere/cylinder/cone) can't produce a true three-pronged sai or a
   chain-swinging nunchaku. **Raph**'s sai (cylinder + cross-guard box) and
   **Mikey**'s nunchaku (two cylinders + a thin static link) are both
   approximated the same way the base rig already accepts for the
   `pop-culture` pack's pirate hook and witch/wizard staff — readable as "a
   weapon-shaped object" but not a literal reproduction. Not blocking.
4. **No text/decal capability (design constraint, not a rig bug).** The
   brief's "belt initials note" cue can't be rendered as an actual glyph
   under the house "color + shape only, no textures/decals" rule that
   applies to every pack. This pack substitutes a **mask-color-coded belt
   buckle** per brother instead (see Overview) — a full workaround, not a
   gap, but noted since it's the literal brief language being reinterpreted.

None of the above blocked shipping a member — all seven have a complete,
distinguishable spec using only the current rig's primitives and anchors.

## Sources

- [Why Did the Teenage Mutant Ninja Turtles Get Color-Coded Masks? (CBR)](https://www.cbr.com/tmnt-color-coded-masks-explained/)
- [Leonardo (Teenage Mutant Ninja Turtles) — Wikipedia](https://en.wikipedia.org/wiki/Leonardo_(Teenage_Mutant_Ninja_Turtles))
- [Raphael (Teenage Mutant Ninja Turtles) — Wikipedia](https://en.wikipedia.org/wiki/Raphael_(Teenage_Mutant_Ninja_Turtles))
- [Donatello (Teenage Mutant Ninja Turtles) — Wikipedia](https://en.wikipedia.org/wiki/Donatello_(Teenage_Mutant_Ninja_Turtles))
- [Weapons used by the Teenage Mutant Ninja Turtles — TMNTPedia (Fandom)](https://turtlepedia.fandom.com/wiki/Weapons_used_by_the_Teenage_Mutant_Ninja_Turtles)
- [Splinter (Teenage Mutant Ninja Turtles) — Wikipedia](https://en.wikipedia.org/wiki/Splinter_(Teenage_Mutant_Ninja_Turtles))
- [Master Splinter — 2003 TMNT Wiki (Fandom)](https://2003-tmnt.fandom.com/wiki/Master_Splinter)
- [Dress Like Master Splinter Costume Guide](https://costumewall.com/dress-like-master-splinter/)
- [April O'Neil — Wikipedia](https://en.wikipedia.org/wiki/April_O'Neil)
- [April O'Neil (1987 TV series) — TMNTPedia (Fandom)](https://turtlepedia.fandom.com/wiki/April_O'Neil_(1987_TV_series))
- [April O'Neil Costume (Yellow Jumpsuit) — TV Store Online](https://www.tvstoreonline.com/products/april-o-neil-yellow-ladies-costume-jumpsuit)
- [Oroku Saki (2012 TV series) — TMNTPedia (Fandom)](https://turtlepedia.fandom.com/wiki/Oroku_Saki_(2012_TV_series))
- [The Shredder — Nick TMNT 2012 Wikia (Fandom)](https://nick-teenage-mutant-ninja-turtles-2012.fandom.com/wiki/The_Shredder)
- [TMNT DIY Shredder Costume — Nickelodeon Parents](https://www.nickelodeonparents.com/tmnt-diy-shredder-costume/)
- Diorama source reference (existing rig conventions, anchors, `_buildHumanoid`,
  `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`, the `knight` helm/
  tabard, `mummy` uniform-tone, and `pirate`/`witch_wizard` prop-approximation
  precedents): `src/three-renderer.ts`; sibling pack docs for format precedent:
  `docs/avatars/cartoons/disney-princess.md`, `docs/avatars/base/pop-culture.md`.
