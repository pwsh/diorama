# Avatar pack — Base / Domestic animals

## Overview

**Hierarchy path**: `avatars › base › domestic-animals` (file:
`docs/avatars/base/domestic-animals.md`).

This is the foundational "household pet" group. It regroups the two
quadruped kinds that already ship (`cat`, `dog`) and rounds the set out with
six new small-pet members plus one explicit non-member (goldfish — flagged
as out of scope, see below). Together these are the animals a real home is
statistically likely to have wandering it alongside the humans in the
`base/humans` pack.

**Two rig families in this group**:
- **QUADRUPED** (`cat`, `dog`, and five new members: `rabbit`, `hamster`,
  `guinea_pig`, `ferret`, `turtle`) — built by `_buildQuadruped` in
  `three-renderer.ts`. Body-forward is local −Z, root rotation order YXZ,
  shared blob-shadow/outline/plumbob machinery, same as humanoids (`quad:
  true` on the `Humanoid` record switches the per-frame pose function to
  `_applyQuadPose`).
- **HUMANOID-RIG biped** (`budgie`) — a small bird built on the *humanoid*
  skeleton, the same trick the existing `cartoon_duck` kind already uses
  (stubby `armL` wings, wide flat `footMul` feet, no legs-as-legs illusion
  needed because the proportions read as "bird" anyway).

**Shared color convention (important, and a deliberate continuation of
existing precedent — see Sources / code citations below)**: in
`_buildQuadruped`, `cat`/`dog` do **not** use a fixed "real animal color" —
their main coat (`bodyMat`) is built straight from the `color` parameter,
which is the same per-sensor / per-person **identity tint** used everywhere
else in the rig (`SENSOR_PALETTE`, a fused BLE person's color, etc.). Only
the *secondary* features — ears, snout/nose, paws — use fixed realistic hex
constants. This doc continues that convention for every new **quadruped**
member: **coat = tint**, secondary accents = real fixed species colors. This
keeps the fun "your dog is however color your motion sensor is" identity
system intact while still reading unmistakably as "dog" vs. "rabbit" vs.
"ferret" via silhouette + fixed accent markings.

`budgie`, being built on the **humanoid** rig alongside costume/mascot kinds
like `cartoon_duck` / `teddy_bear` (which use fixed costume colors, not
tint — see `humans.md`'s note that only `adult`/`child` use `skin: color`),
breaks from tint the same way `cartoon_duck` does: fixed, species-accurate
plumage color. A budgie is a "costume" kind in this rig-family sense, not an
identity surrogate.

**Real-size grounding, but NOT 1:1 scale**: every member below is grounded
in a real shoulder-height / body-length figure (see per-member Reference +
Sources), but none of the new members are literally built at 1:1 human-room
scale in the same way a chair or table is. The rig already sets this
precedent — `dog` is scaled as "beagle ≈ 520 mm shoulder" even though a real
beagle standard is closer to 330–410 mm (see the `dog` entry below), and
`cartoon_duck` (sk 0.85, i.e. most of an adult human's skeletal scale) is
wildly larger than a real ~150–200 mm-tall mallard. Readability in a 3D room
at typical camera distance wins over biological accuracy; real numbers are
given so each new member's *relative* proportions (leg-to-body ratio, ear
size, neck length) land correctly even though absolute scale is a stylized
compromise. This is called out explicitly per-member where it matters (esp.
`budgie`).

## Members

### `cat` — Cat (sensor-tint coat)
*existing kind: `cat`* — no changes proposed. Quadruped, `sk 0.58` (dog ×
0.58). At `sk 0.58` the rig's `backHeight` formula
(`LEG_UPPER_LEN + LEG_LOWER_LEN + PAW_H`, all `×sk`) puts shoulder height at
**≈ 293 mm** and tail length (`tLen1 230×sk + tLen2 200×sk`) at **≈ 249 mm**.
Real domestic cats run 20–25 cm shoulder height, ~46 cm body length, tail
often 25–30 cm — the rig's shoulder height reads a little tall but the tail
proportion is a near-exact match. No refinement needed; flagging the
shoulder-height number here only so a future tuning pass has the real
comparison in one place. Ears are pointed cone shapes (`earMat 0xf2a0b5`,
pink), snout/nose/paws fixed dark tones — this doc's "pack-wide" ear/snout
color fields below are literally quoting this existing implementation.

**Personality / bubbles**: **none configured today** — `AVATAR_PERSONALITY`
and `AVATAR_BUBBLES` have no `cat` entry, and `_buildQuadruped` hardcodes
`persBob/persSway/persCadence/persAmp = 1` unconditionally (never looks the
kind up in `AVATAR_PERSONALITY`), and pet rigs hardcode
`chatterNext: 9e9` ("pets never chatter"). This is a pack-wide rig gap (see
Rig gaps) that blocks every gait/bubble note below for the *new* members
too, not just a `cat`-specific note.

### `dog` — Dog (sensor-tint coat)
*existing kind: `dog`* — no changes proposed. Quadruped, `sk 1.0`,
documented in-code as "beagle ≈ 520 mm shoulder" (`backHeight` at `sk 1` =
`235+220+50 = 505 mm`). Real beagle breed standards put shoulder height at
33–41 cm (AKC/Kennel Club), meaningfully shorter than the rig's ~505 mm — a
soft refinement candidate (not a respec) would be dropping the reference
`sk` for a "beagle-scale" preset toward ~380 mm, or simply relabeling the
in-code comment to a generic "medium dog" rather than naming beagle
specifically, since ~505 mm shoulder height is closer to a Labrador/
Shepherd-sized dog. Floppy box ears (`0x6b4226` brown), tail `160×sk /
130×sk` two-segment (~290 mm total at `sk 1`, matching a real
medium-dog tail).

**Personality / bubbles**: same gap as `cat` — none wired for the *quadruped*
`dog` kind (only the unrelated humanoid mascot kind `cartoon_dog` has
`AVATAR_PERSONALITY`/`AVATAR_BUBBLES` entries, e.g. `cadenceMul: 1.1` /
`['🦴','🎾']` — those do not apply to the quadruped `dog`).

### `rabbit` — Rabbit (sensor-tint coat)
**Reference**: a generic mid-size pet rabbit (mixed breed / mini-lop scale,
not a giant or true dwarf) — not a licensed character. Canonical silhouette:
tall upright ears, a high, rounded, raised-rump crouch (rabbits' hind legs
are disproportionately longer/more powerful than their front legs — the
"coiled spring" hunch is as recognizable as the ears), a stub cottontail
puff, and a hop rather than a trot. Reference sizing: Dutch rabbit breed
dimensions run ~19–23 cm shoulder height / 28–36 cm body length; broader
"average pet rabbit" figures run 30–41 cm.

**Spec** *(proposed generalized quadruped fields — `_buildQuadruped` doesn't
accept most of these yet; see Rig gaps)*
```
sk:         0.62            # relative to dog's 505 mm backHeight reference
bodyLen:    380              # mm
bodyW:      160
bodyH:      190              # taller than long — rabbits sit high-rumped, not low-slung like a dog
legLenFront: 140              # mm, short front legs
legLenRear:  230              # mm, MUCH longer/thicker rear legs (hop power) — NEW asymmetric field, dog/cat legs are symmetric today
headR:      85
neckLen:    0                 # rabbits have essentially no visible neck
earKind:    upright_long       # NEW enum value
earLen:     130                # mm, tall upright ears — the single most load-bearing feature
tailKind:   puff               # NEW enum value — single small sphere, no two-segment sway
tailLen:    40
snoutShape: box
snoutLen:   45
coat:       tint
belly:      0xf5f0e6           # pale cream underside
ear:        0xf2b9c4           # pink inner ear
snout:      0xf2b9c4           # pink nose
emI:        0.18
```

**Accessories**
- `face` (front): two small white cylinder "buck teeth" ~14 mm, tucked under
  the snout — optional but a fun secondary read.
- Whiskers are skipped (too thin to read at 30 px and no thin-line primitive
  exists in the rig's accessory vocabulary).

**Silhouette check**: tall upright ears + the raised-rump hunch stance. The
ears alone would still read as "rabbit" even at 30 px; the hunch reinforces
it but needs a static rump-raised body-pitch bias the quad rig doesn't have
today (flat back like `cat`/`dog` — see Rig gaps).

**Personality**: `{ bobMul: 2.0, swayMul: 0.3, cadenceMul: 'bursty' (see Rig gaps), ampMul: 1.3 }`
— big vertical hop, almost no lateral tail-sway (no tail to swish), a
stop-start "binky" rather than continuous cadence.
**Bubbles**: `['🥕', '🥬', '❤️', '💤']` (carrot, greens, happy binky, naps a
lot).

### `hamster` — Hamster (sensor-tint coat)
**Reference**: a generic Syrian ("golden") hamster — the classic pet-store
hamster, not a licensed character. Canonical silhouette: a nearly perfect
compact ball/egg body with the head barely distinguishable from the torso,
tiny stub legs almost hidden under the body, tiny round ears, no visible
tail, and — the single most identifying trait — puffed-out cheek pouches.
Real Syrian hamsters run 12–20 cm body length (commonly cited ~14–19 cm).

**Spec** *(proposed fields)*
```
sk:         0.30
bodyLen:    150
bodyW:      110               # nearly as wide as long — egg/ball silhouette
bodyH:      100
legLen:     35                 # very short, largely hidden under the body
headR:      58                 # head reads as "part of the same ball," not a distinct segment
neckLen:    0
earKind:    round
earLen:     16
tailKind:   none                # NEW enum value — omit the tail mesh entirely
snoutShape: box
snoutLen:   20
cheekPouch: true                # NEW accessory flag — two small side bulges, the #1 hamster trait
coat:       tint
belly:      0xf3e4c9
ear:        0xf3e4c9            # ears same tone as belly, not a contrasting accent
snout:      0xf3e4c9
emI:        0.15
```

**Accessories**
- `cheek` bulges (side, both cheeks): two small flattened spheres, ~26 mm,
  coat tint × 1.05 (barely lighter) — this is the load-bearing feature, not
  a flourish; a hamster without visible cheek pouches reads as a generic
  "round rodent," not specifically a hamster.

**Silhouette check**: the perfectly round ball body with **no visible
neck/tail and barely-visible legs** is the core read; the cheek bulges seal
the identification. This is the furthest departure from the cat/dog
template in the whole pack (see Rig gaps — omitting tail/neck entirely
isn't supported today).

**Personality**: `{ bobMul: 0.4, swayMul: 0.6, cadenceMul: 2.2, ampMul: 0.5 }`
— very fast tiny scurrying steps, low to the ground, minimal bounce (short
legs can't produce much vertical travel).
**Bubbles**: `['🌻', '🎡', '🥜', '💤']` (sunflower seeds, exercise wheel,
peanut, sleeps most of the day — hamsters are crepuscular/nocturnal).

### `guinea_pig` — Guinea pig (sensor-tint coat)
**Reference**: a generic short-haired guinea pig (cavy) — not a licensed
character. Canonical silhouette: a chunky, elongated-oval body low to the
ground, short stubby legs, a blunt flat face with no real snout protrusion,
small ears that lie close to the head, and **no visible external tail at
all** (guinea pigs have no visible tail — a genuine anatomical trait, not a
stylization choice). Real guinea pigs run 20–25 cm body length (a commonly
cited average is ~27 cm).

**Spec** *(proposed fields)*
```
sk:         0.44
bodyLen:    240
bodyW:      130
bodyH:      110
legLen:     55                  # short, stubby
headR:      70
neckLen:    0                    # very short — face blends almost directly into the body
earKind:    round
earLen:     22                   # small, flat-ish, barely proud of the head
tailKind:   none                 # anatomically correct — no tail at all
snoutShape: box
snoutLen:   26                    # short and blunt, flatter than the hamster's
coat:       tint
belly:      0xf5f0e6
ear:        0x9c8060              # dusty tan, close to a natural cavy tone
snout:      0x9c8060
emI:        0.18
```

**Accessories**
- `rump` patch (back, OPTIONAL): a lighter-tone flattened box/sphere
  overlay near the tail-less rear, mimicking the classic tan-and-white
  "patched" cavy coat pattern (since a plain single tint can't fake a
  two-tone patch — no decals in this rig, so a patch needs a second
  primitive, not a texture).

**Silhouette check**: chunky low oval body + **absence** of tail/visible
neck + small flat-lying ears. Size is the main cat/guinea-pig-vs-hamster
discriminator (guinea pigs are noticeably bigger, ~240 mm vs. the hamster's
~150 mm) since both share the "no visible tail/neck" trait.

**Personality**: `{ bobMul: 0.5, swayMul: 0.8, cadenceMul: 1.6, ampMul: 0.6 }`
— quick trotty steps, portly waddle, short stride. Guinea pigs also have a
famous "popcorning" behavior (a sudden straight-up happy hop) — a candidate
new idle one-shot, see Rig gaps.
**Bubbles**: `['🥒', '🌾', '🥕', '❗']` (cucumber, hay, carrot, the
excited "wheek!" vocalization guinea pigs are known for).

### `ferret` — Ferret (sensor-tint coat)
**Reference**: a generic "sable" ferret — the most common pet-ferret color
pattern (a cream/tan coat with a dark facial "bandit" mask and dark tail
tip) — not a licensed character. Canonical silhouette: an unusually long,
low, slender tube-shaped body (mustelid build) on short legs, a long
flexible neck the ferret can periscope up, and a thick, fully-furred (not
thin/rat-like) tail. Real ferrets run 33–41 cm body length (+ ~13 cm tail),
shoulder height ~13–15 cm.

**Spec** *(proposed fields)*
```
sk:         0.55
bodyLen:    420                  # the longest body:leg ratio in this pack — the core "weasel" read
bodyW:      90                    # slender round-ish cross-section, not boxy
bodyH:      90
legLen:     110                   # short relative to the very long body — belly rides low
headR:      60
neckLen:    80                    # visibly long neck (NEW — no member below needed one until now)
earKind:    round
earLen:     18
tailKind:   bushy                 # NEW enum value — thick two-segment tail, ~as long as the torso
tailLen:    150
snoutShape: cone                  # narrow, pointed face — unlike every rounder-faced pack member above
snoutLen:   40
coat:       tint
belly:      0xf0e6d2
ear:        0x3a2a1e
snout:      0x3a2a1e              # dark "bandit mask" wraps eyes + nose — see Accessories
emI:        0.18
```

**Accessories**
- `face` mask (front, wrapping both sides of the head): a dark
  (`0x3a2a1e`) flattened band across the eyes — the single most
  identifying sable-ferret marking.
- `tail` tip (back, distal end of the tail): the last ~35 mm of the tail
  recolored dark `0x3a2a1e` instead of the base coat tint — a fixed-tone
  override on an otherwise-tinted part, a pattern this pack introduces (see
  Rig gaps — no existing accessory targets "the tip of a tail specifically").

**Silhouette check**: the extreme body-length:leg-length ratio (the lowest,
longest silhouette of any pack member) plus the dark eye mask. Even at 30
px, "long low tube with a dark stripe across the face" reads unambiguously
as ferret/weasel-family and nothing else in this pack.

**Personality**: `{ bobMul: 1.6, swayMul: 1.1, cadenceMul: 1.4, ampMul: 1.2 }`
— an energetic, arch-backed bouncing gallop (ferrets' signature "weasel war
dance" play gait is a good idle one-shot candidate, see Rig gaps) alternating
with long sleep bouts (ferrets sleep 14–18 h/day).
**Bubbles**: `['😴', '🎾', '🧦', '🍗']` (sleeps most of the day; ferrets are
notorious for "ferreting away" small stolen objects like socks).

### `turtle` — Turtle (sensor-tint skin, fixed-color shell)
**Reference**: a generic red-eared slider — by far the most common pet
turtle — not a licensed character. Canonical silhouette: a dominant domed
two-tone carapace (dark olive dome, lighter rim/plastron) sitting over a
low, flat, short-legged body, a short thick neck, a blunt hard beak instead
of a soft snout, no external ears at all, and — the one signature marking
that specifically says "red-eared slider" rather than "generic turtle" — a
small red/orange patch just behind each eye. Real red-eared sliders run
15–30 cm shell length depending on sex (males smaller, ~15–20 cm; females
larger, ~25–30 cm) — this spec targets a mid/male-scale individual.

**Spec** *(proposed fields)*
```
sk:         0.36
bodyLen:    190                  # the exposed body under the shell — low and flat
bodyW:      140
bodyH:      70                    # very low profile — the shell (below) sits above this
legLen:     40                    # very short, stubby, webbed
headR:      35
neckLen:    50                    # short thick neck (no retraction animation — display-only)
earKind:    none                  # NEW enum value — turtles have no external ears at all
tailKind:   short_stub
tailLen:    25
snoutShape: beak                  # NEW enum value — hard beak, not a soft snout box
snoutLen:   18
footMul:    [1.3, 0.6, 1.05]       # broad webbed feet, echoing the duck/budgie footMul idiom
coat:       tint                  # exposed skin (legs/neck/head) — the pack-wide quad convention
belly:      0x8a9c5a
snout:      0x5f7a3d
emI:        0.14
```

**Accessories** *(shell + red-ear-patch — both FIXED real colors, an
exception to the coat's tint, exactly like ears/snout are fixed on the
mammal members)*
- `back` shell dome: a large flattened hemisphere, ~140 mm radius, dark
  olive `0x4a5c30` — the dominant visual mass of the whole figure.
- `back` shell rim: a thin flat ring/box under the dome's edge, lighter
  `0x8a9c5a`, mimicking the plastron/marginal-scute color break.
- `head` ear patch (both sides, just behind the eye): a small red-orange
  oval, ~15 mm, `0xc23b3b` — the red-eared slider's namesake marking and
  the single most identifying detail for this specific species (a plain
  green turtle would just read as "generic turtle").

**Silhouette check**: the two-tone domed shell dominating the figure, plus
tiny stub legs peeking out from under its rim. The red ear patches are the
species-specific confirmation once you're close enough to see the head.

**Personality**: `{ bobMul: 0.15, swayMul: 0.4, cadenceMul: 0.3, ampMul: 0.35 }`
— extremely slow, ponderous, minimal vertical bob (the shell keeps the body
level), the slowest cadence of any pack member by a wide margin.
**Bubbles**: `['🥬', '☀️', '💤', '🐢']` (leafy greens, basking under a heat
lamp, sleeps a lot, generally just... a turtle).

### `budgie` — Budgie (fixed plumage color, HUMANOID rig)
**Reference**: a generic wild-type green budgerigar (the most common pet
parakeet color morph) — not a licensed character. Canonical look: a mostly
green body, a yellow face/forehead with fine black cheek/throat markings, a
small pale hooked beak, and a blue-tinged tail. Real budgies run ~18–20 cm
overall length, standing (perched) height roughly 18–23 cm — see the
Overview's note on why this pack does not build birds at literal 1:1 scale.

**Spec** *(humanoid Spec fields, following the `cartoon_duck` pattern — see
CLAUDE.md's Spec interface)*
```
sk:        0.5            # smaller than cartoon_duck's 0.85 — the smallest biped in the roster
headR:     95              # proportionally large round head, typical bird proportions
headShape: sphere
limbR:     0.7             # thin legs
skin:      0x6fae3e        # wild-type green body — FIXED, not tint (costume-family convention)
body:      0x6fae3e
shoe:      0x8f8f8f        # grey feet/legs
emI:       0.18
hands:     sphere
eyes:      dots
steel:     false
armL:      0.45            # short tucked wings-as-arms, smaller than the duck's 0.6
legL:      0.62
footMul:   [1.2, 0.5, 0.9]  # small clawed feet — narrower than the duck's flipper footMul
legColor:  0x8f8f8f
```

**Accessories**
- `crown`/`face` (forehead/face, front-top): a yellow mask patch,
  `0xf5e14a`, covering the upper face — the classic budgie "yellow face"
  marking over the green body.
- `face` (cheek, both sides): two tiny black dot spheres, ~8 mm,
  `0x232323` — the wild-type cheek markings.
- `back` (tail): a small flattened blue wedge, `0x3f6fb0`, at the tail end.
- `face` (beak): a small pale grey-horn hooked cone, `0xc9b89a`, front of
  the head — see Rig gaps, this likely needs the same hardcoded per-kind
  treatment `cartoon_duck`'s bill got rather than a generic accessory.

**Silhouette check**: the disproportionately large round head/beak on a
tiny tucked-wing body, plus the green-body/yellow-face two-tone split. At
30 px, silhouette reads mainly via the oversized-head-to-body ratio (more
extreme than any other biped in the roster) and the beak.

**Personality**: `{ bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.3, ampMul: 0.9 }`
— quick small steps; real parakeets have a distinctive head-bob-independent-
of-body-bob walk not captured by the existing bob channel (see Rig gaps).
**Bubbles**: `['🎵', '🪞', '🌾', '💭']` (budgies chirp/whistle/mimic sound,
often kept with a cage mirror toy, millet-spray treat).

### `goldfish` — not built (recommendation: skip)
**Reference**: a generic common/comet goldfish, ~10–15 cm for a typical
tank-kept pet (fancy varieties can reach larger). Not built here, and not
recommended for this pack.

**Why it doesn't fit**: every avatar in this rig — humanoid or quadruped —
is driven by a target that **walks around the house** (a real person's
mmWave/BLE trace, or an AI/demo avatar wandering a room). A goldfish never
leaves its tank; it has no legs and no walk cycle, and "wandering the
house" is meaningless for it. Building a `Humanoid`-shaped rig for it would
be pure novelty with no presence-tracking hook to drive it.

**Recommendation**: if a fishbowl/aquarium is wanted as a *decor* piece, it
belongs as a static/ambient **furniture fixture** (in the spirit of the
existing `fountain` outdoor `FurnitureKind`, which is a static translucent
water column with no particle system "v1") — a small tank furniture piece
with a simple looping fish-bob animation baked into the model, not a
target-tracking avatar kind. Out of scope for `avatars/base/domestic-animals`.

## Rig gaps

- **Quadruped params are not generalized** (the big one): `_buildQuadruped`
  today takes only `color` + an `isCat` boolean — every proportion (leg
  length, body length/width/height, head size, ear shape, tail length) is
  either a fixed `sk`-scaled constant or a two-way `isCat ? … : …` ternary.
  None of `rabbit`/`hamster`/`guinea_pig`/`ferret`/`turtle` can be built
  without generalizing this into real per-kind fields (the proposed
  `bodyLen/bodyW/bodyH`, `legLen`, `earKind`, `tailKind`/`tailLen`,
  `snoutShape`/`snoutLen`, `belly`/`ear`/`snout` colors used throughout this
  doc). This is the prerequisite for every other new-member gap below.
- **No neck segment exists at all**: the quad head attaches directly to the
  torso at a fixed offset. `ferret` (long periscoping neck) and `turtle`
  (short thick neck) both need an actual neck geometry piece added to
  `_buildQuadruped` — not just a parameter, a new mesh/pivot.
- **Asymmetric front/rear leg lengths**: today all four legs share one
  `LEG_UPPER_LEN`/`LEG_LOWER_LEN`. `rabbit`'s signature hunch needs distinct
  front vs. rear leg lengths (rear noticeably longer/thicker).
  - **Static body-pitch bias / raised-rump stance**: relatedly, the quad
    root has no static resting-pitch bias (only the shared speed-proportional
    lean). `rabbit`'s raised-hindquarter crouch needs one.
- **Hop gait is a different locomotion cycle, not a parameter tweak**:
  `_applyQuadPose`'s trot is a 4-beat diagonal-pair walk. A rabbit hop is a
  synchronized front-pair/rear-pair bound with an airborne phase and a
  resting crouch — needs its own pose function (or a `gaitKind: 'trot' |
  'hop'` branch inside `_applyQuadPose`), not just different multipliers.
  Also implies a **bursty, stop-start cadence** (rabbits don't move in a
  smooth continuous cadence the way `_applyQuadPose`'s sinusoidal `phase`
  assumes) — no existing concept of non-continuous gait.
- **No/omitted tail and ear support**: the builder unconditionally adds
  exactly one 2-segment tail and one ear pair. `hamster`/`guinea_pig` need
  the tail (and, for hamster, most of the ear prominence) omitted entirely,
  not just shortened — `tailKind: 'none'` needs to actually skip mesh
  creation.
- **No fixed-color override on part of a tinted piece**: `ferret`'s dark
  tail-TIP (last ~35 mm) sits on an otherwise coat-tint tail — there's no
  existing "override the distal end of an otherwise-tinted part" pattern in
  either the humanoid accessory system or the quad builder.
- **Cheek-pouch accessory** (`hamster`): a new bolt-on primitive type (two
  small lateral bulges) with no analog in the current accessory vocabulary
  (which is built around humanoid anchors — crown/head/face/chest/back/
  hip/hand).
- **Shell-as-accessory** (`turtle`, per the assignment brief): applying a
  large dome primitive to a quadruped's back is untested — the quad rig
  exposes no `'back'`-style anchor point the way the humanoid rig does.
  Needs (a) a back-anchor concept ported to quads, and (b) the shell's
  two-tone dome/rim coloring, which is a fixed real color, not tint (an
  exception carved out the same way ears/snout already are).
- **Quad personality is entirely hardcoded to neutral**: `_buildQuadruped`
  sets `persBob/persSway/persCadence/persAmp = 1` unconditionally — it never
  reads `AVATAR_PERSONALITY[kind]` at all. This blocks *every* gait note in
  this document (hamster's frantic scurry, turtle's ponderous crawl,
  ferret's bouncy gallop, etc.) for both the new members AND the two
  existing kinds (`cat`/`dog` have no personality entries today either).
- **Quad thought bubbles are hard-disabled**: `chatterNext: 9e9` is baked
  into every `_buildQuadruped` return value with the comment "pets never
  chatter." Every bubble pool proposed in this doc needs that removed (or
  made kind-aware) and `AVATAR_BUBBLES` consulted for quad kinds, mirroring
  how the humanoid pose branch already does it.
- **New idle one-shots for signature behaviors**: guinea pig "popcorning"
  (sudden vertical happy hop) and ferret's "weasel war dance" bouncing
  play-gait are both excellent candidate additions to the existing
  `IDLE_FIDGETS` roster — but that roster is humanoid-only (it drives
  hip/knee/shoulder/elbow channels quads don't have in the same shape) so
  it needs its own quad-flavored one-shot system, not a direct port.
- **Bird head-bob-while-walking** (`budgie`): real parakeets bob their head
  on a different rhythm than their body bob — no existing channel separates
  head motion from body motion for a walking humanoid-rig biped the way
  this would need.
- **No generic beak/mask anchor**: `cartoon_duck`'s bill is a hardcoded
  per-kind mesh added directly in `_buildHumanoid`'s `switch (kind)` block,
  not a reusable accessory-anchor. `budgie`'s beak (and, differently,
  `turtle`'s hard beak-mouth) would need the same one-off treatment
  duplicated, or — better — a new generic `'beak'` anchor point added to
  the accessory system so future bird/reptile kinds don't each need a
  bespoke builder branch.
- **True-to-scale bipeds are impractical**: real budgie standing height
  (~180–230 mm) is far below any workable humanoid `sk` (the smallest
  human-pack member, `toddler`, is `sk 0.42`; `cartoon_duck` itself is
  already a huge scale-up from a real duck). `budgie`'s proposed `sk 0.5`
  is a deliberate stylization, matching the `cartoon_duck` precedent — worth
  writing down explicitly so a future bird/insect pack doesn't chase
  literal real-world scale into an unworkable rig.
- **No new eye/head-shape style needed** — every member here uses the
  existing `sphere` head + `dots` eyes; nothing required a new face
  primitive (the shell/mask/cheek-pouch/beak gaps above are all *body*
  accessory gaps, not face-style gaps).

## Sources

- [Dutch Rabbit Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/dutch-rabbit)
- [How Big Do Rabbits Get? — The Bunny Lady](https://bunnylady.com/how-big-do-rabbits-get/)
- [Syrian Hamster Size: How Big Do They Get? — Fluffy Tamer](https://fluffytamer.com/syrian-hamster-size-2/)
- [How big are Syrian hamsters? — Pet Hamster Home](https://www.pethamster.net/hamster-info/1788.html)
- [Guinea Pig — Cavy Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/guinea-pig-cavy)
- [Measurements, years of life and sex of guinea pigs — Cunipic](https://cunipic.com/en/medidas-longevidad-y-sexaje-de-las-cobayas/)
- [Domestic Ferret (Mustela furo) Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/domestic-ferret-mustela-furo)
- [How Big do Ferrets Get? — A-Z Animals](https://a-z-animals.com/blog/how-big-do-ferrets-get/)
- [Budgerigar — Wikipedia](https://en.wikipedia.org/wiki/Budgerigar)
- [Red-Eared Slider — Trachemys scripta elegans — PetMD](https://www.petmd.com/rc/red-eared-slider-trachemys-scripta-elegans)
- [Red-Eared Slider Facts — All Turtles](https://www.allturtles.com/red-eared-slider-facts/)
- [Beagle Height Guide — DogBeagle](https://dogbeagle.com/beagle-appearance/beagle-size/beagle-height/)
- [Beagle — Breed Standards — The Kennel Club](https://www.royalkennelclub.com/breed-standards/hound/beagle/)
- [How Tall is the Average Cat? — SpotPet](https://spotpet.com/blog/cat-tips/how-tall-is-the-average-cat)
- [What is the average length and height of a cat? — 21Cats.org](https://www.21cats.org/what-is-the-average-length-and-height-of-a-cat/)
- Existing in-repo reference: `src/three-renderer.ts` `_buildQuadruped` (the
  literal `cat`/`dog` proportions quoted above), `AVATAR_PERSONALITY` /
  `AVATAR_BUBBLES` (confirming the current absence of quad entries), and
  the `cartoon_duck` `Spec` row (the humanoid-rig-biped precedent `budgie`
  follows).
