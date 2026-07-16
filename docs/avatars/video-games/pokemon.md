# Avatar pack: Pokémon

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon mascot figures
whose silhouette/color reads as the creature archetype, not a licensed
likeness. No logos, no on-model face sculpts, no species/character names
printed anywhere in-scene; identity lives only in this doc's Reference lines
and the pack's display labels (e.g. "Electric Mouse (yellow, red cheeks)").

## Overview

- **Group**: Six pocket-monster mascots spanning the three starter
  elemental families (electric, fire, grass, water) plus two fan-favorite
  "everyday" species (a fox-like normal-type and a mischievous feline), plus
  one **human Trainer** included for scale contrast — in the games/anime the
  creatures are deliberately drawn small enough to walk beside or be carried
  by a person, and having one full-height human in the pack sells that
  size relationship the same way `teddy_bear`/`cartoon_duck` read as
  companion-scale next to `adult` in the core pack.
- **Hierarchy path**: `video-games / pokemon`
- **Member count**: 8
- **Rig mix**: 3 **quadruped** (seed dino, evolution fox, coin cat — all
  built on `_buildQuadruped` via `QuadrupedFields`, no rig extension needed)
  + 5 **humanoid** (electric mouse, fire lizard, shell turtle, balloon imp,
  and the trainer — all built on `_buildHumanoid` via `HumanoidFields`). The
  four creature-bipeds all use the same "creature standing upright on the
  humanoid rig" technique the core pack's `cartoon_duck` already establishes
  (short legs, small/absent hands treatment, oversized head) — no new rig
  family required for any of them, just aggressive `sk`/`headR` dialing.
- **Shared design principle — color-coded species, flat toon saturation**:
  each creature is a single, highly saturated signature hue (yellow /
  orange-red / teal-green / light blue / warm brown / cream) with at most
  one secondary accent color and one small dark-marking accent — matching
  how these designs read as instantly identifiable silhouettes in the
  source material even in flat single-color merchandise silhouette form.
  The Trainer is the one member allowed a multi-color (red/blue/green)
  outfit, since as the only human he needs costume detail rather than a
  body-color read to stay interesting next to five solid-color creatures.
- **Shared base spec** (every creature member starts here, then overrides
  skin/body/eyes/proportions — the Trainer diverges most since he's the
  pack's only full human):
  ```
  emI:      0            # flat toon color is the read; accents get their own emI
  hands:    'sphere'
  eyes:     'dots'        # overridden to 'almond' only for the Trainer
  steel:    false          # no metal-type creatures in this set
  ```
- **Real-world scale, dialed for toon legibility**: every creature's
  official height (per Bulbapedia, see Sources) is well under a metre —
  literal 1:1 scale would make them nearly invisible next to a `sk 1.0`
  human in the same scene. Following the exact precedent set in
  `docs/avatars/base/farm-animals.md` / `domestic-animals.md` (dial the
  real ratio back for readability rather than reproduce it literally), each
  creature's `sk` is chosen in the 0.35–0.65 range — small and distinctly
  "creature-scale" next to the Trainer's `sk 1.0`, without shrinking to the
  point of being hard to read at 30 px.
- **Quadruped fields used are the CURRENT real schema**, not a proposed
  one: `QuadrupedFields` in `src/avatars.ts` already ships `sk, bodyLen,
  bodyW, bodyH, legLen, headR, neckLen, headScale, ears
  ('pointy'|'floppy'|'round'|'long'|'none'), tail
  ('up'|'down'|'curl'|'tuft'|'none'), tailLen, snout, coat, belly, earColor,
  snoutColor` and `_buildQuadruped` is fully data-driven off it (verified
  directly against `src/three-renderer.ts` — this pack's three quadrupeds
  need **zero** rig changes to build as specified below). This differs from
  the older `farm-animals.md`/`domestic-animals.md` docs, which were written
  against an earlier, non-data-driven `_buildQuadruped` and proposed most of
  this schema as a gap; that gap has since been closed. See **Rig gaps**
  below for what's still genuinely missing (mostly tail-related).

## Members

### 1. `pkmn-electric-mouse` — "Electric Mouse (yellow, red cheeks)"

**Reference**: The franchise's mascot — a small, plump, mouse-like creature
covered in bright yellow fur, with long pointed ears with black tips, round
red cheek pouches that store electricity, and a lightning-bolt-shaped tail
with a patch of brown fur at its base. Bipedal, black eyes, officially
0.4 m tall. (Pikachu.)

**Spec**
```
sk: 0.42
headR: 116              # big rounded head, oversized relative to body
headShape: 'sphere'
limbR: 0.85
skin: 0xf6d94e           # bright saturated toon yellow
body: 0xf6d94e
legColor: 0xf6d94e       # no separate leggings — solid yellow all the way down
shoe: 0xf6d94e            # bare feet, same tone as skin
eyes: 'dots'
emI: 0.05
hands: 'sphere'
steel: false
armL: 0.6                # short stubby arms
legL: 0.75
footMul: [1.25, 0.7, 1.2]  # small chunky feet, slightly enlarged for the toon stance
```

**Accessories**
- `crown` (×2) — long pointed ears with black tips: tall slim cones,
  ~34×190×34 mm, base color `0xf6d94e` (yellow) with a smaller dark cone cap
  layered at the tip (~34×50×34 mm, `0x181818`) for the signature black tip;
  angled up and slightly back (~15° from vertical), NOT drooping — per the
  standard hat/hair rule this keeps the tip clear of the eye band since the
  ears mount well above brow height already.
- `face` (×2) — the red cheek pouches: two flattened discs, ⌀70×70×18 mm,
  `0xd0262c`, centered on the cheeks at eye height — the single most
  load-bearing color cue in the pack (this creature is instantly "wrong" in
  any other cheek color).
- `back` (×2, the two dorsal stripes) — thin horizontal brown bands across
  the upper back, ~140×26×10 mm each, `0x4a3222`, stacked one above the
  other, proud of the body surface by a few mm (coincident-face rule).
- `hip` (tail base) — see **Rig gaps #1/#2**: the lightning-bolt tail is
  approximated as a short chain of 3 tapered boxes bolted at the `hip`
  anchor, alternating bend angles to suggest a zigzag (~40×130×30 mm each,
  tapering), base segment `0x6b4a2e` (the canonical brown patch at the
  tail's root) transitioning to `0xf6d94e` (yellow) for the outer two
  segments, angled down and back away from the body.

**Silhouette check**: long black-tipped ears + round red cheeks + solid
saturated yellow body is unmistakable even as a flat silhouette — the
zigzag tail is the classic secondary read but (per Rig gaps) can only be
approximated as a bent box-chain rather than a crisp lightning-bolt profile,
so the ears + cheeks are what actually carry recognizability at 30 px.

**Personality**: `bobMul: 1.15, swayMul: 1.0, cadenceMul: 1.3, ampMul: 0.8`
(a quick, energetic, slightly bouncy little trot)
**Bubbles**: `⚡😊🔋❗` (electricity, cheerful, energy/charge, alert)

---

### 2. `pkmn-fire-lizard` — "Fire Lizard (orange, flame tail)"

**Reference**: A small bipedal reptilian creature, primarily orange with a
cream underside (chest down) and cream foot soles, blue eyes, and a slender
tail that has carried a living flame since birth — the flame's size/vigor
is said to reflect its mood and health. Officially 0.6 m tall. (Charmander.)

**Spec**
```
sk: 0.48
headR: 100
headShape: 'sphere'
limbR: 0.8
skin: 0xf0752a            # saturated toon orange
body: 0xf0752a
legColor: 0xf0752a         # legs stay orange — only the front torso + soles go cream
shoe: 0xf2e6c8              # cream foot soles
eyes: 'dots'
emI: 0
hands: 'sphere'
steel: false
armL: 0.55                  # small stubby arms
legL: 0.8
footMul: [1.1, 0.75, 1.15]
```

**Accessories**
- `chest` — the cream belly patch: a flattened vertical panel running
  chest-to-waist, ~body-width×0.7×200×10 mm, `0xf2e6c8`, proud of the torso
  surface (coincident-face rule) — this is deliberately a `chest` accessory
  rather than `legColor`, since canonically only the front torso (not the
  whole leg) is cream.
- `crown` — a small dark ridge of head scales: 2–3 tiny rounded bumps,
  ~20 mm, `0xcf6420` (a shade darker than the base orange), running back
  from the crown of the head.
- `hip` (tail base + flame) — per **Rig gaps #1**: the tail is approximated
  as a single tapered cone/cylinder chain bolted at the `hip` anchor,
  ~28×220×20 mm, `0xf0752a` (matching body), angled back and slightly up,
  ending in the signature tail-tip flame: a small emissive cone/sphere,
  ~55×70×55 mm, warm fire gradient `0xffb020` with `emissive: 0xff7a1a,
  emissiveIntensity: 0.4` — the flame is this character's single most
  important read and the one place `emI`/emissive is pushed hard.

**Silhouette check**: the emissive orange flame at the tail tip against an
otherwise flat-orange body is the character's signature cue even in
silhouette (a lit orange dot trailing the body reads as "fire" instantly);
the cream belly patch is a confirming secondary detail at closer range. See
**Rig gaps #1** — without a proper tail joint the flame can't flicker/sway
independently the way the quadruped tail tip can (only a static bolt-on).

**Personality**: `bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.1, ampMul: 0.85`
(alert, slightly cautious upright gait)
**Bubbles**: `🔥😊💤😠` (flame/fire, content, drowsy — flame burns low when
tired, per canon — irritable, flame flares when angry)

---

### 3. `pkmn-seed-dino` — "Seed Dino (teal-green, back bulb)"

**Reference**: A small, sturdy quadruped resembling a toad/dinosaur hybrid,
blue-green (teal) skin with darker patches, and a large plant bulb on its
back that grows as it matures. Wide, flat toad-like face, stubby legs, no
visible ears, officially 0.7 m tall. (Bulbasaur.)

**Spec**
```
rig:        quadruped
sk:         0.62
bodyLen:    620            # squat, roughly as long as tall — toad-proportioned
bodyW:      210
bodyH:      230
legLen:     0.65            # short stubby legs under a low, wide body
neckLen:    0               # no neck — head sits directly forward of the body
headR:      108             # wide, round, flat-faced head
headScale:  [1.15, 0.85, 1.0]   # squashed wider/flatter than the dog default — toad-faced, not snouted
ears:       'none'           # no visible external ears
tail:       'none'            # canonically a stub, not worth a visible tail segment
snout:      0                 # flat frog/toad face, no protruding muzzle
coat:       0x5fa88e          # blue-green/teal base skin
belly:      0x9fd6b0          # lighter green-cream underside
earColor:   0x5fa88e          # unused (ears:'none') but set for consistency
snoutColor: 0x5fa88e
```

**Accessories**
- `qback` — the signature bulb: a large sphere, ⌀150×150×150 mm at sk=1,
  saturated leaf-green `0x4c9c5c`, sitting centered on the back/shoulders,
  slightly flattened top-down (`sphereArc` or a non-uniform scale on a
  second wrapping mesh is fine if the generator wants a touch of
  squash — a plain sphere reads well already).
  - 2–3 small dark-green oval "patch" accessories on the bulb and flanks,
    flattened ellipsoids ~35×25×8 mm, `0x2e6e3a`, proud of the surface by a
    few mm (same Holstein-patch idiom `docs/avatars/base/farm-animals.md`
    documents for scattered dark markings on a lighter coat).
  - 2–3 tiny leaf-sprout tufts at the very top of the bulb: small slim
    cones, ~18×45×18 mm, a brighter spring green `0x6cc46a`, fanned
    slightly outward.
- `qhead` (×2) — small dark round eyes are already built into the base
  quadruped head; no override needed (base `dark` eye spheres read fine
  against this coat).

**Silhouette check**: the oversized green bulb riding on a low, wide,
teal-green toad body is unmistakable at any distance — no other member in
this pack (or the sibling `farm-animals`/`domestic-animals`/`zoo-animals`
base packs) puts a giant sphere on a quadruped's back, so there's no
cross-pack confusion risk either.

**Personality**: `{ bobMul: 0.75, swayMul: 0.7, cadenceMul: 0.7, ampMul: 0.8 }`
(a steady, grounded, slightly plodding gait — the bulb's weight reads as
real mass)
**Bubbles**: `['🌱', '☀️', '😌', '🍃']` (growth/seed, sunlight it basks in
per canon, contentment, leaf/plant nature)

---

### 4. `pkmn-shell-turtle` — "Shell Turtle (blue, brown shell)"

**Reference**: A small, bipedal, turtle-like creature — light-blue skin,
big round eyes, and a shell that's brown on top, pale yellow underneath,
with a thick white ridge line between the two halves. Officially 0.5 m
tall. (Squirtle.)

**Spec**
```
sk: 0.44
headR: 96
headShape: 'sphere'
limbR: 0.85
skin: 0x8fd0e8            # light blue toon skin
body: 0x8fd0e8
legColor: 0x8fd0e8
shoe: 0x8fd0e8              # webbed feet, same light blue
eyes: 'dots'
emI: 0
hands: 'sphere'
steel: false
armL: 0.55
legL: 0.75
footMul: [1.2, 0.7, 1.2]     # small webbed/flipper-ish feet
```

**Accessories**
- `back` — the shell, THE signature read: a large domed shape (a flattened,
  wide sphere-section or a low box with rounded corners), ~230×160×230 mm,
  split into two layered pieces so the two canonical shell tones show:
  a brown upper dome `0x6b4a2e` and a slightly smaller pale-yellow
  underside disc `0xf0e0a0` peeking out at the base rim, with a thin white
  ridge strip running the seam between them (~230×14×8 mm, `0xf5f2ea`) —
  the ridge line is the single most identifying shell detail per canon.
- `chest` — a small pale cream belly-plate patch, ~90×70×10 mm, `0xe8dcc0`,
  centered low on the front torso.
- `hip` (small curled tail stub, optional/minor — see **Rig gaps #1**): a
  single short tapered cone, ~20×45×20 mm, `0x8fd0e8`, curled tight against
  the body; this member's tail is a minor cosmetic detail (unlike Pikachu's
  or Charmander's), so a plain static stub is an acceptable simplification
  with no meaningful silhouette loss if the generator wants to skip it.

**Silhouette check**: the brown-over-pale-yellow domed shell with its white
seam ridge, worn on an otherwise plain light-blue bipedal body, reads as
"turtle creature" instantly — no accessory beyond the shell is load-bearing.

**Personality**: `bobMul: 0.9, swayMul: 0.8, cadenceMul: 1.0, ampMul: 0.8`
(a calm, slightly waddling gait — steady rather than energetic)
**Bubbles**: `💧😌🐢💤` (water, calm contentment, shell/turtle nature,
tends to withdraw and rest)

---

### 5. `pkmn-trainer` — "Rookie Trainer (red cap, blue jacket)"

**Reference note**: A generic young Pokémon trainer archetype — included
for scale contrast against the five creature members. Common design
elements across the franchise's most iconic trainer look: a red cap with a
white front panel, an open blue jacket with a white collar over a dark
undershirt, light blue jeans, and a backpack; the palette is deliberately
drawn from the classic red/blue/green/yellow franchise branding rather than
any single character's exact outfit, keeping this a generic archetype
rather than a likeness. (Evokes Ash Ketchum's design lineage.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
limbR: 1.0
skin: 0xe8b48c            # fair skin
body: 0x2f6fd1             # bright toon blue jacket
legColor: 0xaed4e8          # light blue jeans
shoe: 0x1c1c1e               # dark sneakers
eyes: 'almond'                # the one member with expressive human eyes
emI: 0
hands: 'sphere'
steel: false
armL: 1.0
legL: 1.0
footMul: [1.0, 1.0, 1.0]
```

**Accessories**
- `crown` — the red cap: a flattened dome/short cylinder, ~200×90×200 mm,
  `0xd42020` (saturated red), with a small white front panel (a flattened
  disc, ~70×70×10 mm, `0xf5f5f0`) centered on the brim front — per the
  standard hat rule, raised + tilted back (`rotation.x`) so the brim clears
  the eye band instead of draping to brow level.
- `chest` — a white collar/zip-front accent on the jacket: a thin band
  across the collarbone, ~body-width×30×8 mm, `0xf5f5f0`.
- `back` — a green backpack: a rounded box, ~160×220×90 mm, `0x3a7a3a`,
  centered between the shoulder blades.
- `hip` — a brown belt with a small buckle, thin band ~body-width×22×8 mm,
  `0x5c3a21`, buckle square ~26×26×8 mm, `0x9a9a96`.
- `hand` (×2, small optional detail) — fingerless glove cuffs, thin bands
  at the wrist, `0x5cab48` (green), matching the franchise's accent-green
  detailing without depicting anything held (deliberately no ball/device
  prop in-hand — a round two-tone red/white handheld sphere reads too close
  to an actual franchise logo-item for this "geometric homage, no logos"
  pack; the trainer is characterized by cap+jacket+backpack instead).

**Silhouette check**: the red cap + open blue jacket + backpack silhouette
is instantly "trainer" and, at full `sk 1.0`, visually anchors the scale of
the whole pack — every creature member reads as notably smaller standing
next to him, which is itself part of the pack's charm.

**Personality**: `bobMul: 1.0, swayMul: 0.75, cadenceMul: 1.05, ampMul: 1.0`
(an upbeat, energetic, forward-leaning stride — an adventurer always ready
to move)
**Bubbles**: `🎒🗺️😃⭐` (backpack/journey, exploration, enthusiasm,
aspiration/ambition)

---

### 6. `pkmn-evolution-fox` — "Evolution Fox (brown, cream collar)"

**Reference**: A small, fox-like quadruped with brown fur, a large fluffy
cream collar around the neck, a bushy cream-tipped tail, long pointed ears
with dark interiors, and slender legs. Notable for its ability to evolve
into many different elemental forms depending on external conditions —
this spec renders its plain, unevolved base form. Officially 0.3 m tall.
(Eevee.)

**Spec**
```
rig:        quadruped
sk:         0.55
bodyLen:    560
bodyW:      190
bodyH:      210
legLen:     0.9              # slender, fairly leggy for its size
neckLen:    100
headR:      95
headScale:  [1.0, 1.0, 1.05]  # a touch of extra face-forward length, still mostly round
ears:       'pointy'
tail:       'tuft'             # bushy, ends in a distinct tuft — closest existing kind
tailLen:    1.3                 # notably bushier/longer than the cat/dog default
snout:      0.55                 # small fox-like muzzle
coat:       0x8a5a34             # warm brown fur
belly:      0xefe3c8              # pale cream underside
earColor:   0x5c3c22               # dark brown ear interior (see Rig gaps — exterior stays coat-brown, this paints the whole ear one tone so the darker interior is chosen as the more distinctive of the two per-canon reads)
snoutColor: 0x8a5a34
```

**Accessories**
- `qneck` — the signature fluffy collar: a ring/cluster of 5–6 small
  overlapping cream spheres, ~45–60 mm each, `0xefe3c8`, wrapped around the
  base of the neck, proud of the coat surface.
- `qrump` (tail-tip accent, approximate — see **Rig gaps #3**) — a small
  cream sphere, ⌀40 mm, `0xefe3c8`, positioned near the tail's resting tip
  to suggest the cream tuft color; because this bolts to `qrump` (parented
  to root) rather than to the animated tail pivot, it will only track the
  tail's REST pose, not its per-frame sway — acceptable at a glance, a
  known simplification (see Rig gaps).
- `qhead` (×2, ear inner-tone hint, optional) — if the generator wants a
  cleaner two-tone ear than a single `earColor` allows, a pair of small
  thin flattened cream discs (`0xefe3c8`) can be tucked just inside the
  ear-pivot position (roughly `ex·headR·0.55` lateral, `headR·0.6` up,
  `headR·0.1` forward, matching the base rig's own ear-pivot placement) to
  hint at a paler inner ear — otherwise the solid dark-brown `earColor`
  above is a perfectly serviceable simplification on its own.

**Silhouette check**: the fluffy cream neck collar breaking up an otherwise
solid brown fox-like silhouette is the primary read; the long pointed ears
and bushy tail are strong secondary confirmers. The tail-tip cream color
(per Rig gaps #3) is the one detail that won't be pixel-perfect without
either a new field or the static-accessory workaround above.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.1, ampMul: 0.95 }`
(alert, quick, faintly skittish — ears/tail give it a lot of expressive
motion even before quirky footwork)
**Bubbles**: `['✨', '❓', '😊', '🍃']` (the "many possible evolutions"
mystery/sparkle, curiosity, easygoing friendliness, its grassy/woodland
habitat)

---

### 7. `pkmn-balloon-imp` — "Balloon Imp (pink, huge eyes)"

**Reference**: A small, round, balloon-bodied creature — bright pink,
almost entirely spherical, with enormous blue eyes, tiny stub limbs, and
pointed ears with black interiors; famous for singing a soothing song that
puts listeners to sleep. Officially 0.51 m tall (a near-perfect sphere on
tiny feet). (Jigglypuff.)

**Spec**
```
sk: 0.34                  # deliberately extreme — the same oversized-head trick
                            # `child`/`toddler` use (see docs/avatars/base/humans.md),
                            # pushed to its limit so the body reads as almost all head
headR: 148                  # huge relative to sk — the balloon-body silhouette
headShape: 'sphere'
limbR: 0.6
skin: 0xf2a0c0              # bright saturated pastel-pink
body: 0xf2a0c0
legColor: 0xf2a0c0
shoe: 0xf2a0c0                # tiny feet, same pink, no separate footwear
eyes: 'almond'                 # the closest existing preset to big expressive eyes
emI: 0.05
hands: 'sphere'
steel: false
armL: 0.4                      # tiny stub arms
legL: 0.35                      # tiny stub legs
footMul: [0.85, 0.6, 0.8]        # small feet, scaled down further than the body already is
```

**Accessories**
- `head` (×2) — small pointed ears: slim cones, ~26×55×26 mm, `0xf2a0c0`
  (pink exterior) with a smaller dark cone cap at the base/interior,
  ~26×20×26 mm, `0x1c1c1c`, angled slightly outward.
- `crown` — a single small curl tuft at the crown of the head: a thin
  tapered, gently bent cylinder, ~14×70×14 mm, `0xf2a0c0`, standing up and
  curling forward slightly — Jigglypuff's signature single hair-curl.
- No `chest`/`back`/`hip` accessories — the whole point of this member is
  an unbroken pink sphere; adding costume details would undercut the
  "pure balloon" read.

**Silhouette check**: an almost-perfectly round, saturated pink body with
huge eyes dominating the face is unmistakable and among the most
"instantly a toy/mascot" silhouettes in this pack — no gap blocks the core
read. The one true miss is eye COLOR (see Rig gaps #5): the oversized
`almond` eyes read as huge and expressive, exactly as needed, but render in
the rig's fixed dark iris tone rather than this character's signature blue.

**Personality**: `bobMul: 1.5, swayMul: 1.3, cadenceMul: 0.85, ampMul: 0.55`
(a slow, bouncy, top-heavy waddle-hop — short little steps, exaggerated
vertical bob befitting a balloon-shaped body)
**Bubbles**: `🎤🎵😴💗` (its signature song, music, the sleep-inducing
effect, sweetness/affection)

---

### 8. `pkmn-coin-cat` — "Coin Cat (cream, gold coin)"

**Reference**: A small, cream-furred, cat-like quadruped with a gold coin
embedded in its forehead, black ears with brown interiors, long whiskers,
and a tail that curls at the tip; brown-tipped hind paws and tail. Known
for greed/coin-collecting behavior in canon. Officially 0.4 m tall.
(Meowth.)

**Spec**
```
rig:        quadruped
sk:         0.52              # close to the existing 'cat' (0.58) but a touch smaller
bodyLen:    600
bodyW:      195
bodyH:      215
legLen:     0.95
neckLen:    40
headR:      100
headScale:  [1.05, 1.0, 1.0]
ears:       'pointy'
tail:       'curl'             # existing kind — tip curls, matches canon directly
tailLen:    1.15
snout:      0.45                 # small, roundish cat face
coat:       0xf2ecd0             # cream fur
belly:      0xf7f2e2              # slightly lighter cream underside
earColor:   0x1c1c1c               # black ear exterior (the dominant, more distinctive
                                      # of the canon's black-exterior/brown-interior split
                                      # — see Rig gaps for the single-tone-per-ear limit)
snoutColor: 0xf2ecd0
```

**Accessories**
- `qhead` — the gold koban coin, THE signature read: a flattened cylinder/
  disc, ⌀70×70×14 mm, `0xd4af17` with `emissiveIntensity: 0.15` for a faint
  shine, centered on the forehead just above the eyes, plus a small dark
  square notch accessory (~14×14×6 mm, `0x8a6a10`) inset near the disc's
  top edge to suggest the coin's traditional square perforation.
- `qhead` (×6–8, whiskers, optional detail) — very thin long cylinders,
  ~4×130×4 mm, `0xf2ecd0` or pale white, radiating outward from the snout
  sides in two fanned clusters of 3–4 — thin enough to read as whisker
  lines rather than solid rods; a nice-to-have, skippable if the generator
  wants to keep the part count low (the coin alone already carries
  recognizability).
- **Paw/tail-tip brown accents** (see **Rig gaps #4**): canon gives Meowth
  brown-tipped hind paws and tail-tip — paw color isn't a data field today
  (`_buildQuadruped`'s paw material is a hardcoded dark grey shared by every
  quadruped), so this detail can't be added cleanly without a rig change;
  the existing dark-grey paw default is a reasonable stand-in and doesn't
  meaningfully hurt the read, since the gold coin is what people actually
  look for.

**Silhouette check**: the gold coin on the forehead against plain cream fur
and black pointed ears is the single unambiguous "this one, not a generic
cat" cue — nothing else in this pack or the sibling animal base packs wears
a forehead coin, so it reads immediately even before the curled tail or
whiskers register.

**Personality**: `{ bobMul: 0.95, swayMul: 1.15, cadenceMul: 1.1, ampMul: 0.9 }`
(a sly, springy, faintly showy prowl — a bit more swagger in its step than
a plain housecat)
**Bubbles**: `['💰', '😼', '✨', '❗']` (coins/greed, sly cattiness, the
coin's shine, alert opportunism)

## Rig gaps

1. **No tail anchor/joint on the HUMANOID rig.** The biped anchor set
   (`crown/head/face/chest/back/hip/handL/handR/root`) has nothing
   posterior-and-low for a tail. Two members in this pack (Pikachu,
   Charmander) have tails that are core to their identity (lightning-bolt
   shape; living emissive flame), and a third (Squirtle) has a minor
   optional one. The workaround used throughout this doc — bolting a short
   chain of tapered box/cone accessories onto the `hip` anchor — produces a
   static appendage with no independent sway/animation, unlike the
   quadruped rig's real tail pivot (`quadTail`, animated in
   `_applyQuadPose`). This is already an **anticipated candidate** per
   `docs/DESIGN-avatars.md`'s own "expected rig-gap candidates" list
   (listed alongside monkey/kangaroo tails) — this pack adds two more
   concrete, high-value use cases for it.
2. **No jagged/zigzag "lightning bolt" primitive.** Pikachu's tail is a
   very specific angular silhouette that the existing
   `box|sphere|cylinder|cone` accessory vocabulary can only approximate as
   a chain of 2–3 bent, tapered boxes (the same technique
   `docs/avatars/base/domestic-animals.md`/`farm-animals.md` use for manes
   and plumes) — serviceable but never a crisp bolt profile. Bundled with
   gap #1 since both stem from the same tail need.
3. **Quadruped tail is single-material end to end.** `QuadrupedFields` has
   no `tailTipColor` (or per-segment color) — the whole tail renders in
   `coat`. Eevee's cream-tufted tail tip can only be approximated with a
   separate static accessory sphere positioned near the tail's REST pose
   (anchored at `qrump`, parented to `root`), which will visibly lag behind
   the tail's actual per-frame sway animation rather than riding it. A
   clean fix is either a `tailTipColor?: number` field consumed by the
   existing `tailKind === 'tuft'` branch (it already builds a tip sphere,
   just always in `bodyMat`), or a documented `qtail` accessory anchor
   parented to the tail-tip pivot (`quadTail[1]`) so a bolt-on rides the
   animation properly. Low implementation cost, given the tuft-sphere code
   already exists and just needs its own material.
4. **Quadruped paw color is hardcoded, not a data field.** `_buildQuadruped`
   builds every paw from a fixed `0x2a2a2e` dark-grey `pawMat`, never
   reading anything off `QuadrupedFields`. This blocks Meowth's canon
   brown-tipped hind paws (and Eevee's, more subtly) from rendering
   accurately; the dark-grey default is an acceptable stand-in for both
   members here but is a one-line fix (`pawColor?: number`, mirroring how
   `earColor`/`snoutColor` already work) that any future spotted/two-tone
   quadruped would also want.
5. **Ear/paw color is one flat tone — no exterior/interior two-tone.**
   Related to #4: `earColor` paints the WHOLE ear mesh one color, so
   Meowth's black-exterior/brown-interior ear and Eevee's brown-exterior/
   dark-brown-interior ear can each only commit to one tone (exterior
   chosen for both, as the more visually dominant of the two). A thin
   inset accessory disc (documented as optional in both members' Accessory
   lists) can approximate the second tone at extra part-count cost.
6. **No iris/eye-color override.** The `eyes` field selects a *style*
   (`dots/visor/almond/…`), not a *color* — irises always render in the
   rig's fixed dark tone. Jigglypuff's signature bright-blue eyes get the
   "huge and expressive" read for free from `almond` + oversized `headR`,
   but not the actual blue tint. Purely cosmetic, doesn't block
   recognizability given the size-driven read already carries the
   character, but worth flagging since eye color is genuinely part of this
   specific character's identity.
7. **(Minor, not actually blocking this pack) No independent torso-scale
   field separate from `sk`.** Jigglypuff's near-seamless "body IS the
   head" balloon look works fine here because pushing `sk` very low while
   keeping `headR` high (the same technique `child`/`toddler` already use
   in `docs/avatars/base/humans.md`) happens to shrink the torso enough
   that the head-torso seam is barely noticeable. Flagged only because a
   future character needing the OPPOSITE — a large torso paired with a
   small head — would hit a real limit this pack doesn't.

## Sources

- [Pikachu (Pokémon) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Pikachu_(Pok%C3%A9mon))
- [Pikachu — Wikipedia](https://en.wikipedia.org/wiki/Pikachu)
- [Charmander (Pokémon) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Charmander_(Pok%C3%A9mon))
- [Charmander Pokédex — Pokémon Database](https://pokemondb.net/pokedex/charmander)
- [Bulbasaur (Pokémon) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pok%C3%A9mon))
- [Bulbasaur — Pokémon.com Pokédex](https://www.pokemon.com/us/pokedex/bulbasaur)
- [Bulbasaur Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/bulbasaur)
- [Squirtle (Pokémon) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Squirtle_(Pok%C3%A9mon))
- [Squirtle Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/squirtle)
- [Eevee (Pokémon) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Eevee_(Pok%C3%A9mon))
- [Eevee — Wikipedia](https://en.wikipedia.org/wiki/Eevee)
- [Jigglypuff (Pokémon) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Jigglypuff_(Pok%C3%A9mon))
- [Meowth (Pokémon) — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Meowth_(Pok%C3%A9mon))
- [Ash's clothing — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Ash's_clothing)
- [Dress like Ash Ketchum Costume Guide — Costume Wall](https://costumewall.com/dress-like-ash-ketchum/)
- In-repo: `src/avatars.ts` (`HumanoidFields`/`QuadrupedFields`/
  `AvatarPrimitive` — verified against the live schema, not the older
  "proposed" version some sibling base-pack docs describe),
  `src/three-renderer.ts` `_buildHumanoid`/`_buildQuadruped`/
  `_addDeclarativeAccessories` (anchor table, tail-pivot animation),
  `docs/DESIGN-avatars.md` (pack infra + expected rig-gap candidates),
  `docs/avatars/base/farm-animals.md` / `domestic-animals.md` (scattered-
  patch and chained-box mane/plume idioms reused here), `docs/avatars/
  video-games/zelda.md` (sibling pack format + pointed-ear/hat-clearance
  conventions followed directly).
