# Avatar pack: Pac-Man

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon figures whose
silhouette/color reads as the character archetype, not a licensed likeness.
No logos, no printed letters/initials, no on-model face sculpts, no names
printed anywhere in-scene; character identity lives only in this doc's
Reference lines and the pack's display labels.

## Overview

- **Group**: The complete primary cast of Namco/Bandai Namco's 1980 arcade
  classic *Pac-Man* and its 1982 sequel *Ms. Pac-Man* — the two dot-chomping
  heroes plus the four named ghosts that chase them. Nothing else in the
  franchise clears the casual-fan-names-them-first bar: Sue (Ms. Pac-Man's
  fifth, rarely-used pink ghost variant), Pac-Man Jr./Baby Pac-Man, and the
  extended *Pac-Man and the Ghostly Adventures* cartoon cast (Spiral,
  Cylindria, Betrayus) are all one-off/secondary and are omitted. Six
  members, at the low end of the 5–12 range but the correct primary-cast
  count for this franchise — padding further would mean reaching for
  characters no casual fan would name.
- **Hierarchy path**: `video-games / pac-man`
- **Member count**: 6
- **Rig**: humanoid only, split into two very different builds:
  - `dot-chomper`/`bow-chomper` (Pac-Man/Ms. Pac-Man) use the **oversized
    single-sphere-body** technique — `headR` dialed up so the head IS
    effectively the whole body, `sk`/`limbR` kept small so stubby limbs stay
    subordinate to the ball silhouette. This is the exact same technique
    `docs/avatars/video-games/mario.md`'s `shy-ghost` (Boo) established for
    "one continuous round shape."
  - The four ghosts (`chaser-ghost`/`ambush-ghost`/`drifter-ghost`/
    `wander-ghost`) use the shipped **`hover` field** (a numeric mm offset
    on `HumanoidFields` — see `docs/avatars/AUTHORING.md`) for a true
    legless floating body: setting `hover` nulls both leg joints entirely
    at build time and floats the hip at that height, no walk cycle at all.
    This is a *better*, more-current fix than the `legL`-shrinking
    workaround `mario.md`'s Boo used before the field existed — worth
    knowing if `mario.md` is ever regenerated, its `shy-ghost` should
    probably switch to `hover` too.
- **Shared design principle — identical body, color is the only
  differentiator (for the ghosts)**: canonically, all four ghosts share
  *exactly* the same rounded-dome-plus-wavy-hem body and differ **only** in
  hue — this is literally the character design, not a simplification this
  doc is making (see Sources). All four ghost specs below are intentionally
  near-identical apart from `skin`/`body`/`legColor` and personality/
  bubbles, which is the correct, faithful representation rather than a
  missed opportunity for variety.
- **Shared base spec** (every member starts here, then overrides):
  ```
  headShape: 'sphere'
  hands: 'sphere'
  eyes: 'dots'      // closest built-in to both the pac-pair's simple dot
                     // eyes and the ghosts' white/blue-pupil look — see
                     // Rig gaps
  steel: false
  emI: 0.05          // a faint toon glow on every member — arcade-sprite
                      // colors read as slightly self-lit rather than flat
  ```
- **Shared palette**:
  - Arcade yellow — `0xf5d020` (Pac-Man / Ms. Pac-Man body)
  - Blinky red — `0xe0342f`
  - Pinky pink — `0xf5aef0`
  - Inky cyan — `0x3fd8e0`
  - Clyde orange — `0xf0a542`
  - Dark accent (mouth void, eyeliner, beauty mark) — `0x2a2018`
  - Ms. Pac-Man's bow/lips accent — `0xd9241f` (same family as Blinky red,
    an intentional cross-pack color echo since both are canonically red)
- **Radical minimalism is faithful, not a shortcut**: this pack's members
  carry the fewest accessories of any shipped pack (the ghosts have almost
  none) because the source designs themselves are extremely minimal —
  1980-vintage arcade sprites built from a handful of colored shapes. Piling
  on extra detail would be *less* faithful, not more.

## Members

### 1. `dot-chomper` — "Rolling Yellow Hero (wedge mouth)"

**Reference**: The franchise's mascot — a spherical yellow character who
continuously chomps dots and power pellets while fleeing four colorful
ghosts through a maze. The single defining feature across every era is the
pac-shaped wedge notch mouth. The 2010 "30th anniversary" official redesign
gave him white eyes with blue irises, more expressive eyebrows, an orange
glove read, and red sneakers (earlier promotional art used red boots); the
in-game sprite itself has never had visible limbs at all. (Pac-Man.)

**Spec**
```
sk: 0.72
headR: 150             // oversized single sphere — head IS the whole body
headShape: 'sphere'
limbR: 0.55             // small stubby limbs, kept subordinate to the ball read
skin: 0xf5d020          // arcade yellow
body: 0xf5d020
legColor: 0xf5d020
shoe: 0xd9241f           // red boots/sneakers
eyes: 'dots'
emI: 0.05
hands: 'sphere'
steel: false
armL: 0.55
legL: 0.55
footMul: [1.1, 0.9, 1.05]
```

**Accessories**
- **face** (mouth) — the signature pac-wedge chomp: two angled flattened
  dark boxes meeting at a point near the head's front-center, opening
  toward local −Z, ~130×90×10mm each, `0x2a2018` — reads as a dark void
  rather than a true cutout (see Rig gaps #1).
- **face** (second primitive) — a small red tongue sliver tucked at the
  back of the notch, ~40×20×8mm, `0xc23030`.
- **face** (third primitive) — a single bold arched brow bar over the
  eyes, `0x2a2018`, exaggerated per the 2010 redesign's "expressive
  eyebrows."
- **hand** (×2) — orange glove shells: flattened spheres over the hand
  joints, ~46mm, `0xe8720a`.

**Silhouette check**: a single yellow sphere dominated by a stark
dark wedge-notch mouth is arguably the single most recognizable video-game
silhouette in existence — reads instantly even reduced to one flat color
blob at 30px, no other accessory required to sell it.

**Personality**: `bobMul: 1.3, swayMul: 0.3, cadenceMul: 1.4, ampMul: 0.5`
(a quick, low-amplitude scurrying roll rather than a normal stride — reads
as "rolling/chomping through a maze," not walking)
**Bubbles**: `🟡👻😋💨` (dot/pellet, the ghosts he's fleeing or hunting,
chomping appetite, maze dash)

---

### 2. `bow-chomper` — "Rolling Yellow Heroine (red bow)"

**Reference**: Pac-Man's female counterpart and the star of her own 1982
arcade sequel, one of the most commercially successful arcade games ever
made — an identical yellow spherical body, distinguished by a red bow with
a small tuft of hair peeking beneath it, a beauty mark, red lipstick, dark
eyeliner, and (per the game's original promotional flyer art) a necklace
and heels, plus noticeably longer/thinner legs than her male counterpart.
(Ms. Pac-Man.)

**Spec**
```
sk: 0.68
headR: 145
headShape: 'sphere'
limbR: 0.45              // thinner, "long legs" read vs. Pac-Man's stockier build
skin: 0xf5d020
body: 0xf5d020
legColor: 0xf5d020
shoe: 0xc23030            // red heels
eyes: 'dots'
emI: 0.05
hands: 'sphere'
steel: false
armL: 0.5
legL: 0.68                // noticeably longer legs than Pac-Man
footMul: [0.85, 0.75, 0.9]  // slimmer heeled foot
```

**Accessories**
- **crown** — the red bow: two flattened wedge shapes meeting at a small
  center knot, ~70×50×20mm each, `0xd9241f`, with a small cream polka-dot
  accent (~10mm, `0xf5f2ea`) on each wing; a small dark tuft of hair peeks
  beneath (~30×20×15mm, `0x2a2018`). Sits centered atop the head, naturally
  clear of the eye band (a bow, unlike a dome hood, needs no tilt-back).
- **face** (mouth) — the same pac-wedge chomp notch as Pac-Man, `0x2a2018`,
  with the same red tongue-sliver treatment.
- **face** (second primitive) — red lipstick: a small curved band under
  the mouth notch, `0xc23030`.
- **face** (third primitive) — a single dark beauty-mark dot near the
  cheek, ~8mm, `0x2a2018`.
- **face** (fourth primitive) — thin dark eyeliner slivers flanking the
  eyes, `0x2a2018`.
- **chest** — a thin gold necklace band at the collar, `0xd9b34a`
  (the promotional-flyer necklace detail).

**Silhouette check**: the same yellow-ball read as Pac-Man, but topped with
an unmistakable red bow and a lipstick accent — distinct even at 30px, the
only member in the pack wearing a bow.

**Personality**: `bobMul: 1.15, swayMul: 0.5, cadenceMul: 1.3, ampMul: 0.55`
(a slightly lighter, quicker scurry than Pac-Man's — still rolling rather
than striding)
**Bubbles**: `🎀💋🍒😘` (bow, lipstick kiss, her signature bonus-fruit
cherries, flirtatious wink)

---

### 3. `chaser-ghost` — "Chasing Spirit (red)"

**Reference**: The most aggressive of the four ghosts — canonically the
direct, relentless pursuer that speeds up the closer it gets to clearing a
level ("Cruise Elroy" mode); its Japanese design name, "Oikake," literally
means "chaser." Shares the identical rounded-dome, wavy-hemmed body used by
all three other ghosts; hue is the sole visual differentiator, exactly
matching the 1980 arcade character design. (Blinky.)

**Spec**
```
sk: 0.8
headR: 128
headShape: 'sphere'    // rounded dome top — the whole visible body
limbR: 0.12             // near-invisible vestigial arms — see Rig gaps #3
skin: 0xe0342f          // ghost red
body: 0xe0342f
legColor: 0xe0342f
eyes: 'dots'             // white sclera + dark pupil — closest built-in to
                          // the canonical white/blue-pupil eyes; see Rig gaps #2
emI: 0.08                // a faint ghostly glow
hands: 'sphere'
steel: false
hover: 180                // legless floating body, no walk cycle — see Overview
armL: 0.25
```

**Accessories**
- **hip** (×4) — the wavy, scalloped hem in place of legs/feet: small
  overlapping cone/wedge shapes around the base of the body, `0xe0342f`,
  forming the classic 3–4-point ghost "skirt" silhouette (same technique
  as `mario.md`'s Boo hem, reused here since it's the correct read for both
  characters independently).

**Silhouette check**: identical dome-plus-wavy-hem shape to its three
siblings below — color alone differentiates it, which is exactly correct
per the source material (see Sources: "the real difference between all the
Pac-Man ghosts" is their hue and AI behavior, not their shape).

**Personality**: `bobMul: 0.9, swayMul: 0.25, cadenceMul: 1.3, ampMul: 0.4`
(a fast, direct, no-nonsense glide with tight, controlled bob — aggressive,
single-minded pursuit)
**Bubbles**: `😠🎯👹💢` (aggressive chase, direct target-lock, menace, anger)

---

### 4. `ambush-ghost` — "Ambushing Spirit (pink)"

**Reference**: The ghost that tries to get ahead of and cut off its
target rather than chase directly — its Japanese design name, "Machibuse,"
means "ambusher." Otherwise built identically to the chaser. (Pinky.)

**Spec**
```
sk: 0.8
headR: 128
headShape: 'sphere'
limbR: 0.12
skin: 0xf5aef0          // ghost pink
body: 0xf5aef0
legColor: 0xf5aef0
eyes: 'dots'
emI: 0.08
hands: 'sphere'
steel: false
hover: 180
armL: 0.25
```

**Accessories**
- **hip** (×4) — the same wavy scalloped hem as the chaser, `0xf5aef0`.

**Silhouette check**: identical shape to its siblings; the pale pink hue is
the sole, sufficient differentiator.

**Personality**: `bobMul: 1.0, swayMul: 0.6, cadenceMul: 1.1, ampMul: 0.5`
(a light, cutting, weaving glide — reads as cunning positioning rather than
a straight chase)
**Bubbles**: `😏🎯💕✨` (cunning smirk, ambush target-lock, playful,
sparkle)

---

### 5. `drifter-ghost` — "Drifting Spirit (cyan)"

**Reference**: The ghost with unpredictable, seemingly fickle movement —
its Japanese design name, "Kimagure," means "fickle"/capricious; famously
its targeting logic in the original game depends on both Pac-Man's position
*and* the chaser's, producing erratic paths. Otherwise built identically to
the other three. (Inky.)

**Spec**
```
sk: 0.8
headR: 128
headShape: 'sphere'
limbR: 0.12
skin: 0x3fd8e0          // ghost cyan
body: 0x3fd8e0
legColor: 0x3fd8e0
eyes: 'dots'
emI: 0.08
hands: 'sphere'
steel: false
hover: 180
armL: 0.25
```

**Accessories**
- **hip** (×4) — the same wavy scalloped hem, `0x3fd8e0`.

**Silhouette check**: identical shape to its siblings; the cyan hue is the
sole, sufficient differentiator.

**Personality**: `bobMul: 1.3, swayMul: 1.4, cadenceMul: 0.9, ampMul: 0.7`
(an unpredictable, wobbly, erratic drift — the most restless idle motion
in the pack, matching its fickle AI reputation)
**Bubbles**: `😵💫❓🌀` (dizzy erratic energy, confusion, question-mark
unpredictability, swirl)

---

### 6. `wander-ghost` — "Wandering Spirit (orange)"

**Reference**: The ghost famous for losing interest and retreating to
scatter in a corner whenever it gets close to its target — its Japanese
design name, "Otoboke," means "feigning ignorance"/"playing dumb," and it's
the one most often described as the "dumb" or "shy" ghost of the four.
Otherwise built identically to the other three. (Clyde.)

**Spec**
```
sk: 0.8
headR: 128
headShape: 'sphere'
limbR: 0.12
skin: 0xf0a542          // ghost orange
body: 0xf0a542
legColor: 0xf0a542
eyes: 'dots'
emI: 0.08
hands: 'sphere'
steel: false
hover: 180
armL: 0.25
```

**Accessories**
- **hip** (×4) — the same wavy scalloped hem, `0xf0a542`.

**Silhouette check**: identical shape to its siblings; the orange hue is
the sole, sufficient differentiator.

**Personality**: `bobMul: 1.1, swayMul: 1.0, cadenceMul: 0.6, ampMul: 0.3`
(a slow, aimless, easily-distracted meander — famously loses interest and
wanders off rather than committing to a chase)
**Bubbles**: `😅🍊😴🤪` (sheepish, an orange nod to its own color, sleepy,
scatterbrained)

---

## Rig gaps

1. **No boolean/cutout primitive for a wedge notch.** Pac-Man's single
   most identifying feature is a literal missing pie-slice bitten out of
   his own circular body — the current accessory primitives
   (box/sphere/cylinder/cone) are all purely additive, the same underlying
   limitation already flagged for Skeletor's hollow eye sockets in
   `cartoons/he-man.md` Rig gap 1. This doc approximates the mouth with two
   dark angled boxes overlaid on the front of the head to fake a
   wedge-shaped void via color-blocking, which works face-on but isn't a
   true cutout — the head is still a full sphere underneath, so the
   illusion is weaker from odd angles than in official 2D/pre-rendered
   art. A dedicated concave/carved-detail technique (or a real CSG
   subtract) would fix both this and the Skeletor case at once.
2. **No eye-color override.** All four ghosts canonically share the exact
   same white-sclera, blue-pupil eyes regardless of body color, and
   Pac-Man's 2010 redesign gave him blue irises specifically (not the
   rig's default dark pupil). This is the same gap already parked in
   `docs/ROADMAP.md` § avatar rig gaps ("eye color overrides") — noting it
   again here because this pack is an unusually clean case: five of six
   members would benefit from the exact same blue-pupil override, and the
   ghosts additionally lose their one non-hue distinguishing detail
   without it.
3. **No arm/limb-suppression flag.** The shipped `hover` field (see
   Overview) already solves the LEG half of the ghosts' fully-limbless
   canonical silhouette — but arms are always built regardless of `hover`,
   so this pack approximates armless-ness by shrinking `limbR`/`armL` to
   near-zero and matching every limb color to the body so the stub
   visually disappears into the dome at normal render distance. This is
   the same gap already surfaced for `blob-alien` in `base/aliens.md` Rig
   gap 2 (`hideLimbs?: boolean` — skip limb meshes, keep joint groups for
   animation math); promoting it would let this pack's ghosts render with
   zero vestigial-limb geometry instead of a shrunk approximation.

## Sources

- [Pac-Man (character) — Wikipedia](https://en.wikipedia.org/wiki/Pac-Man_(character))
- [Ms. Pac-Man (character) — Wikipedia](https://en.wikipedia.org/wiki/Ms._Pac-Man_(character))
- [Ghosts (Pac-Man) — Wikipedia](https://en.wikipedia.org/wiki/Ghosts_(Pac-Man))
- [Ms. Pac-Man — Pac-Man Wiki (Fandom)](https://pacman.fandom.com/wiki/Ms._Pac-Man)
- [Pac-Man Ghosts Color Scheme — SchemeColor.com](https://www.schemecolor.com/pac-man-ghosts-color-palette.php)
- [The Real Difference Between All The Pac-Man Ghosts — SVG.com](https://www.svg.com/333277/the-real-difference-between-all-the-pac-man-ghosts/)
- [7 Pac-Man Ghost Names: Meet the Classic Arcade Enemies — Toynk](https://www.toynk.com/blogs/pac-man/pac-man-ghost-names)
- `docs/avatars/video-games/mario.md` (this repo) — the oversized-single-
  sphere-body technique (Boo) and the wavy-hem-in-place-of-legs technique,
  both reused here; also the pre-`hover`-field workaround this pack
  supersedes.
- `docs/avatars/base/aliens.md` (this repo) — the `hideLimbs` rig gap,
  cross-referenced above.
- `docs/avatars/cartoons/he-man.md` (this repo) — the no-boolean-cutout rig
  gap, cross-referenced above.
- `docs/avatars/AUTHORING.md` (this repo) — current `HumanoidFields`
  schema, including the shipped `hover` field.
