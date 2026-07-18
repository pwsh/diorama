# Avatar pack: WALL-E

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no printed corporate branding, no names printed anywhere in-scene; character
identity lives only in this doc's Reference lines and the pack's display
labels.

## Overview

- **Group**: the small, deliberately minimal cast of Pixar's *WALL-E*
  (2008) — a solitary trash-compacting robot, his hovering probe-droid love
  interest, a tiny obsessive cleaning bot, a ship's captain slowly waking up
  from centuries of disuse, a villainous shipboard autopilot, a
  short-film-adjacent repair bot, and a generic Axiom passenger.
- **Hierarchy path**: `sci-fi / wall-e` — placed under **Sci-Fi**, not
  Cartoons, per the taxonomy's tiebreak #2 ("animation beats medium... unless
  sci-fi — Transformers precedent, sci-fi wins"). *WALL-E* is unambiguously
  science fiction (post-apocalyptic Earth, a generation ship, autonomous
  robots), so it follows the Transformers precedent exactly despite being an
  animated Pixar film. Kept as a single path level — the film's cast is
  small enough that no sub-series split is warranted.
- **Member count**: 7. **Rig**: humanoid only (every member, including the
  three non-humanoid robots, builds on the humanoid rig — no quadrupeds).
  Deliberately BELOW the usual 8–12 guidance: this is a genuinely small
  primary cast (the film itself has almost no dialogue and a tiny named
  roster), and padding toward 8 would mean including background
  Axiom-passenger variants or short-film-only bit players that fail the
  "casual fan names first" bar. 7 solid, fully-distinct members beats a
  padded 9.
- **No shared base spec.** The cast splits cleanly into "robot" (WALL-E,
  EVE, M-O, AUTO, BURN-E) and "human" (Captain McCrea, the Axiom passenger)
  families with nothing useful to share across that split — same reasoning
  as `sci-fi/fallout-tv.md` and `cartoons/toy-story.md`.
- **Shared conventions across the robot half of the cast**:
  - **`hover` is used for TWO different real-world things, and only one of
    them is literally floating.** EVE genuinely hovers (anti-gravity
    thrusters, canon) — a clean, literal use of the flag, the same way
    `sci-fi/fallout-tv.md`'s Mr. Handy uses it. WALL-E, M-O, and BURN-E do
    NOT float; they move on treads, a rolling brush-base, and magnetic feet
    respectively. `hover` is reused for all three anyway at a SMALL mm value
    (WALL-E 120, M-O 80, BURN-E 70) purely as a mechanism to suppress the
    rig's leg-gait animation in favor of smooth smooth-surface translation —
    every `// approx:` note below flags this explicitly. See Rig gaps for
    the honest fix (a dedicated tracked/wheeled locomotion mode).
  - **Body-shroud technique** (an oversized accessory primitive wrapping the
    torso box to change its apparent shape) is reused from
    `sci-fi/star-wars-ot.md`'s R2-D2 and `sci-fi/fallout-tv.md`'s Mr. Handy
    for EVE's seamless ovoid — cited, not re-derived.
  - **Multi-eyestalk desync via per-primitive `animate.phase`** (Phase 4b) is
    used for BURN-E's four eyestalks the same way `sci-fi/fallout-tv.md`'s
    Mr. Handy uses it for three — an independently-wobbling cluster of
    identical accessories staggered by phase reads as "alive" far better
    than a static cluster.
  - **`eyes: 'none'` + a bespoke lens accessory** stands in for every
    robot's non-standard eye design (WALL-E's binoculars, EVE's LED bar,
    M-O's single lens, AUTO's single red eye, BURN-E's four stalks) — none
    of this pack's robots use a stock `eyes` enum value.

## Members

### wall-e
**Label**: Boxy Trash-Compactor Robot (rusty yellow, binocular eyes)
**Reference**: WALL-E (Waste Allocation Load Lifter — Earth-Class), a
solitary robot left compacting trash on an abandoned, polluted Earth for
centuries. A cube-shaped body on tank treads, a small swiveling head unit
with binocular-lens eyes capable of remarkably expressive independent
tilting, retractable three-fingered arms, and a chest solar panel. Painted
Caterpillar-tractor yellow, now rusted orange-brown from centuries of use.

**Spec**
```ts
'wall-e': {
  sk: 0.75 /* squat — his cube body is roughly waist-high to an adult */,
  headR: 55 /* the small swiveling head unit atop the boxy torso */,
  headShape: 'box', limbR: 1.0,
  hover: 120 /* mm — // approx: WALL-E does NOT float; this suppresses the
    rig's leg-gait so his tank treads can read as smooth ground contact
    instead of a bipedal walk cycle. See Rig gaps for the honest fix. */,
  skin: 0xc98a1f /* dirty rusty-yellow */, body: 0xc98a1f,
  eyes: 'none' /* two bespoke binocular-lens accessories, see below */,
  emI: 0.05, hands: 'box', steel: true,
},
```

**Accessories**
- **face** ×2: the binocular eye-lenses — two forward cylinders (~40 mm dia, 45 mm long) mounted on the small head box, dark lens tips `0x1a1a1a` with a small glass-glint highlight. Independently animated: `animate: { kind: 'sway', speed: 1.0, amp: 0.3, phase: 0 }` (left) / `phase: 1.6` (right) — desynced expressive tilting, WALL-E's whole personality lives in this motion.
- **root**: tank-tread details — two low, flat, wide boxes along the base sides, near-black rubber `0x1c1a18` (a static approximation of rolling treads — see Rig gaps).
- **chest**: a hinged solar panel, a thin flat box, dark blue-black `0x2a4fae`, with `pattern: { kind: 'stripes', color: 0x1a2a5a, count: 4 }` for panel-cell grid lines.
- **back**: a small exhaust/compactor vent detail box.

**Design note**: the film's late-story "plant in a boot" prop (a seedling
WALL-E carries in an old work boot — the emotional linchpin of the plot) is
deliberately **not** modeled as a default accessory; it belongs to one
specific plot beat, not his baseline silhouette. A future variant wanting it
would ride the `handL`/`handR` anchor as a small boot-shaped box + a green
sprout cone, held one-handed (not `twoHanded` — he cradles it, doesn't grip
a long prop).

**Silhouette check**: a squat, boxy, rusty-yellow cube on flat black treads
with two independently-tilting binocular eyes is unmistakably WALL-E — the
only tracked, headless-in-the-traditional-sense robot in the pack.

**Personality**: `{ bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.5, ampMul: 0.3 }` (slow, deliberate, treaded glide — `hover` suppresses any real stride; his character comes through in the eye-sway, not the gait)
**Bubbles**: `['🌱', '🎬', '🤖', '💛']`

---

### eve
**Label**: Sleek White Probe (hovering, blue eye-bar)
**Reference**: EVE (Extraterrestrial Vegetation Evaluator), a probe droid
sent to scan Earth for plant life — a glossy white egg/ovoid body that
genuinely hovers on anti-gravity thrusters, expressive blue LED eyes that
change shape to convey emotion, a retractable arm-blaster, and fast,
graceful movement.

**Spec**
```ts
eve: {
  sk: 0.85, headR: 130, headShape: 'oval' /* seamless egg read, continued
    by the shroud accessory below */, limbR: 0.7 /* slender, mostly-
    retracted arms */,
  hover: 900 /* mm — a REAL literal hover, unlike wall-e's approximation
    above; she floats noticeably higher and visibly clear of the ground */,
  skin: 0xf2f4f6 /* glossy pearl white */, body: 0xf2f4f6,
  eyes: 'none' /* bespoke LED eye-bar, see below */,
  emI: 0.35, hands: 'sphere', steel: true,
},
```

**Accessories**
- **root**: a large oval shroud enclosing the torso box, matching `skin`, sized to blend seamlessly with the oval head into one continuous egg shape (the same R2-D2/Mr.-Handy shroud technique cited above).
- **face**: a single horizontal blue LED eye-bar — a thin flattened box, emissive `0x4fd8ff` @ ~0.7 — spanning where both eyes would sit, reading as her two expressive eyes merged into one glowing bar per the source design. `animate: { kind: 'sway', speed: 1.8, amp: 0.15 }` for a subtle expressive tilt.
- **root** (second): a soft blue thruster-glow disc beneath her, flat translucent, `0x2f9ad1` emissive — a documented flat-material exemption (the weather-particle-sprite idiom).
- **chest**: a thin cyan seam-line accent, reusing the `sleek-android` cyan-seam idiom from `base/robotic.md` (cited, not re-derived).

**Silhouette check**: an all-white glossy ovoid, genuinely hovering, with
one glowing blue eye-bar, is unmistakable — the antithesis of WALL-E's
boxy rust, the cleanest silhouette in the pack.

**Personality**: `{ bobMul: 0.5, swayMul: 0.3, cadenceMul: 0.2, ampMul: 0.1 }` (near-motionless serene glide — true hover; her occasional darting speed bursts aren't modeled as a static value)
**Bubbles**: `['🌿', '🔫', '✨', '💙']`

---

### m-o
**Label**: Tiny Cleaning Robot (blue, spinning brush)
**Reference**: M-O (Microbe Obliterator), a tiny obsessive-compulsive
cleaning robot aboard the Axiom — a small blue boxy chassis on a rolling
brush-wheel base, a single scanning eye, endlessly chasing "foreign
contaminants."

**Spec**
```ts
'm-o': {
  sk: 0.5 /* the smallest member */, headR: 70, headShape: 'box', limbR: 0.6,
  hover: 80 /* mm — // approx: rolls on a brush-wheel base, not floating;
    same leg-gait-suppression reuse as wall-e above */,
  skin: 0x2f6fd1 /* blue */, body: 0x2f6fd1,
  eyes: 'none' /* single bespoke scanner lens, see below */,
  emI: 0.2, hands: 'box', steel: true,
},
```

**Accessories**
- **face**: a single round scanner-eye lens, a small dark sphere with a thin chrome ring, `0x141a22`, centered.
- **root**: a spinning brush-roller base — a wide thin cylinder with `animate: { kind: 'spin', speed: 6 }`, a fast continuous spin that IS his signature obsessive-scrubbing motion.
- **handL** / **handR**: tiny sanitizing-wand nub accessories.

**Silhouette check**: the smallest, boxiest, brightest-blue member with a
visibly spinning brush base reads instantly as the tiny cleaning bot,
especially once in motion.

**Personality**: `{ bobMul: 0.3, swayMul: 0.2, cadenceMul: 0.1, ampMul: 0.1 }` (a fast, low, scurrying glide — `hover` plus the spinning brush accessory carry all of his motion character)
**Bubbles**: `['🧽', '🦠', '😤', '✨']`

---

### captain-mccrea
**Label**: Ship's Captain (red uniform, heavyset)
**Reference**: Captain B. McCrea, the Axiom's captain — initially a soft,
disengaged figure who spends his days in a hover-chair before WALL-E's
arrival inspires him to stand and eventually pilot the ship home. Red
captain's uniform with gold trim, a heavyset build (like every long-term
Axiom passenger), reddish hair.

**Spec**
```ts
'captain-mccrea': {
  sk: 1.0, headR: 130, headShape: 'sphere', skin: 'tint',
  body: 0xa8281f /* red captain's uniform */, legColor: 0x8a1f18 /* darker
    red trousers */, shoe: 0x2a2420,
  eyes: 'dots', emI: 0.05, hands: 'sphere',
  limbR: 1.25 /* heavyset Axiom-passenger build */, armL: 0.9, legL: 0.85,
},
```

**Accessories**
- **chest**: gold captain's insignia trim — a thin box band + a small blank rank-star accessory, `0xd9b23a` (no corporate logo, per the no-logos policy).
- **crown**: short reddish hair, `0xb8542a`.
- **hip**: a thin gold belt.

**Silhouette check**: the only solid-red uniformed figure with a heavyset
build and gold trim reads as ship's captain instantly, distinct from the
plain-jumpsuited generic Axiom passenger.

**Personality**: `{ bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.7, ampMul: 0.6 }` (soft, sedentary gait — a character on an arc from disuse to determined captaincy; this baseline models his "still finding his legs" register, not the finale's resolve)
**Bubbles**: `['🚀', '🫡', '🌍', '💪']`

---

### auto
**Label**: Ship's Autopilot (white wheel, red eye)
**Reference**: AUTO, the Axiom's coldly obedient — and ultimately mutinous —
autopilot AI. A white steering-wheel-shaped chassis with several radiating
spoke-arms, permanently mounted at the ship's helm, and a single glowing red
circular eye (a deliberate homage to HAL 9000).

**Spec**
```ts
auto: {
  sessile: true /* permanently mounted at the helm — never moves from its
    post, the same rooted idiom as sci-fi/fallout-tv.md's other fixed-
    machinery members would use if it had one; here it's AUTO's defining
    trait, not an approximation */,
  sk: 1.0, headR: 60 /* small central hub */, headShape: 'sphere',
  skin: 0xece8de /* white/cream chassis */, body: 0xece8de,
  eyes: 'none' /* single bespoke red lens, see below */,
  emI: 0.3, hands: 'sphere', steel: true,
  armL: 0.01 /* arms scaled to near-zero and hidden under the spoke
    assembly — the same limbless idiom used for Mother Brain in
    video-games/metroid.md, cited not re-derived */,
},
```

**Accessories**
- **root** ×5: the wheel-shaped body — five radiating spoke boxes around the central hub, `0xece8de`, ~250 mm long, evenly spaced (reuses the `slinky` "several individually-offset accessories on one anchor" ring technique from `cartoons/toy-story.md`, cited not re-derived).
- **face**: the single glowing red eye — one large sphere, `0xd21f1a`, emissive ~0.8, centered on the hub. This IS the character; there is no other facial detail.
- **root** (second): a short pedestal/mast cylinder connecting the wheel-hub to the floor, `0x8a8a86` — a sessile rig still needs a visible grounded base.

**Silhouette check**: a white wheel-shaped chassis with radiating spokes and
one glowing red central eye is unmistakable — the only sessile,
faceless-but-for-one-eye, distinctly non-humanoid-read member in the pack.

**Personality**: `{ bobMul: 0.1, swayMul: 0.1, cadenceMul: 0, ampMul: 0 }` (rooted, near-motionless but for a slow ominous idle throb — the same sessile idiom cited for Mother Brain above)
**Bubbles**: `['👁️', '🔒', '🚫', '🤖']`

---

### burn-e
**Label**: Small Repair Robot (yellow, four eyestalks)
**Reference**: BURN-E, a small external hull-repair robot introduced in the
*BURN-E* short film bundled with the feature — similar chassis family to
WALL-E/M-O but insectile: four small independent eyestalks, a
welding-torch-tipped arm, and magnetic feet for exterior hull work.

**Spec**
```ts
'burn-e': {
  sk: 0.55 /* small, between m-o and wall-e in scale */,
  headR: 80, headShape: 'box', limbR: 0.65,
  hover: 70 /* mm — // approx: his magnetic-foot hull-crawling locomotion
    is approximated the same way as wall-e's treads above */,
  skin: 0xd9c020 /* safety-yellow chassis, distinct from wall-e's rustier
    tone */, body: 0xd9c020,
  eyes: 'none' /* four bespoke eyestalk accessories, see below */,
  emI: 0.15, hands: 'box', steel: true,
},
```

**Accessories**
- **face** ×4: four short thin eyestalk cylinders fanning from the head-box front, each tipped with a small emissive-blue lens, `0x4fd8ff` — staggered `animate: { kind: 'sway' }` phases per stalk (`0`, `1.0`, `2.0`, `3.0`) for independent insectile wobble, the SAME per-primitive-phase technique `sci-fi/fallout-tv.md`'s Mr. Handy uses for three stalks, extended to four here.
- **handR**: a welding-torch tip — a small cone with an emissive orange-white flame-tip sphere, `0xf5c040`.
- **chest**: a small diagonal warning-stripe accent, `0x1a1a1a` on the yellow chassis, for the hazard-worker read.

**Silhouette check**: a small yellow boxy bot with FOUR waving eyestalks
(vs. WALL-E's two, EVE's one bar, this pack's sibling Fallout doc's Mr.
Handy's three) and a glowing torch-hand — the eyestalk count alone
separates him from every other robot member.

**Personality**: `{ bobMul: 0.4, swayMul: 0.4, cadenceMul: 0.3, ampMul: 0.2 }` (small, twitchy, task-focused scurry — an anxious worker-bot energy)
**Bubbles**: `['🔧', '🔥', '😬', '⚙️']`

---

### axiom-passenger
**Label**: Ship Passenger (soft build, hover-cup)
**Reference**: a generic Axiom passenger — the film's background humans,
centuries of zero-effort microgravity living having left them uniformly
soft and rotund, reclining in hover-chairs, wearing identical red-piped
jumpsuits, sipping continuous meals-in-a-cup, oblivious to their
surroundings until WALL-E's arrival stirs them.

**Spec**
```ts
'axiom-passenger': {
  sk: 1.0, headR: 132, headShape: 'sphere', skin: 'tint',
  body: 0xc7cdd6 /* pale blue-grey jumpsuit */, legColor: 0xc7cdd6,
  shoe: 0xa8afb8,
  eyes: 'dots', emI: 0.02, hands: 'sphere',
  limbR: 1.4 /* the roundest, softest build in the pack — the film's
    visual joke about disuse-driven size */, armL: 0.8, legL: 0.75,
},
```

**Accessories**
- **chest**: a thin red piping trim band, `0xd21f1a`, matching the Axiom's ambient red accent color seen throughout the ship.
- **hand**: a small drink-cup accessory, a short cylinder, `0xf0ece0`, permanently in one hand — the character's whole personality.

**Silhouette check**: the roundest, softest silhouette in the pack, in a
plain pale jumpsuit with a drink cup glued to one hand, reads as "the
anonymous Axiom passenger" — intentionally the pack's blandest, most
uniform entry, which is the point of the character.

**Personality**: `{ bobMul: 0.3, swayMul: 0.2, cadenceMul: 0.4, ampMul: 0.3 }` (soft, barely-there shuffle — a body that has forgotten how to walk; the film's arc has this character eventually stand taller, not modeled as a separate look)
**Bubbles**: `['🥤', '📺', '😴', '💺']`

## Rig gaps

1. **No tracked/wheeled/magnetic-crawl locomotion mode.** Approximated THREE
   times in this pack (WALL-E's treads, M-O's brush-roller, BURN-E's
   magnetic crawl) by repurposing `hover` at a small mm value — which
   suppresses leg-gait animation, but is semantically "floating just above
   the ground," not "smoothly translating while visibly in contact with a
   surface." A dedicated `tracked` / `wheeled` locomotion flag (root stays
   truly grounded at y=0, zero vertical bob, an optional wheel/tread
   accessory that spins with translation speed) would be a more honest fit
   than reusing `hover` for a robot that visibly touches the ground. EVE's
   use of `hover` in this same pack is the control case — a genuine literal
   float — showing the flag works exactly as designed when the character
   actually hovers.
2. **No extra-limb anchor for genuinely multi-armed/multi-eyestalk
   characters.** WALL-E's third arm, AUTO's five spokes, and BURN-E's four
   eyestalks all pile extra accessories onto `face`/`root`/`hand` anchors
   beyond what those anchors were designed for, rather than using a real
   "Nth limb" anchor. This is the SAME gap `sci-fi/fallout-tv.md`'s Mr.
   Handy entry hits independently for its three arms — cross-referenced
   there, not re-derived twice; two sibling packs hitting the identical gap
   independently is a reasonable signal it's worth promoting to a real
   anchor.
3. **No true seamless `bodyShape` field.** EVE's entire silhouette is meant
   to read as ONE continuous glossy egg with no head/torso seam; the shroud
   workaround (an oversized accessory wrapping the torso box) gets very
   close but a close inspection still shows a faint seam where the shroud
   meets the true oval head. A `bodyShape` field mirroring `headShape`
   (first flagged for R2-D2 in `sci-fi/star-wars-ot.md`, cited again here
   rather than re-derived) would remove this seam entirely for any
   ovoid/spherical-body robot pack going forward.
4. **No wheel/ring-of-accessories primitive.** AUTO's radiating 5-spoke
   wheel body reuses the `slinky` "several individually-offset accessories
   on one anchor" workaround from `cartoons/toy-story.md` rather than a real
   spoke/ring generator — cited, not re-derived.

**Explicitly skipped, with reasoning**: **Hal the cockroach** — the film's
one surviving insect, and WALL-E's tiny companion — was seriously
considered and dropped. Two independent rig limits make it a poor fit rather
than a judgment call: (a) the humanoid rig's scale floor is `sk: 0.45`
(~still a visible, roughly child-sized figure at this scene's scale), which
can't credibly convey something that should read as barely-visible vs. a
1.75 m human and the household objects around it — every other "tiny"
member in this doc set (Yoda at `sk: 0.45` in `sci-fi/star-wars-ot.md`, Elmo
at `sk: 0.55` above) is still a person-shaped presence, not an insect meant
to be nearly lost underfoot; and (b) the quadruped rig assumes a
**four**-legged horizontal body plan, and a cockroach's six-legged,
flat-bodied silhouette doesn't map onto it any better than R2-D2 mapped onto
the humanoid rig (a fit `sci-fi/star-wars-ot.md` already documents as a
hand-tuned approximation, not a real match). Rather than ship a bug that
looks like neither a bug nor anything else recognizable, Hal is omitted; a
future insect-scale rig variant (referenced nowhere else in this doc set
yet) would be the honest fix.

## Sources

- [WALL-E (character) — Pixar Wiki (Fandom)](https://pixar.fandom.com/wiki/WALL%E2%80%A2E_(character))
- [WALL-E (character) — Grokipedia](https://grokipedia.com/page/WALL-E_(character))
- [WALL-E — Wikipedia](https://en.wikipedia.org/wiki/WALL-E)
- [EVE — Pixar Wiki (Fandom)](https://pixar.fandom.com/wiki/EVE)
- [AUTO — Pixar Wiki (Fandom)](https://pixar.fandom.com/wiki/AUTO)
- [AUTO — WALL-E Wiki (Fandom)](https://axiom.fandom.com/wiki/AUTO)
- [Characters in WALL•E — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Characters/WallE)
- [WALL•E (Western Animation) — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/WesternAnimation/WallE)
- In-repo: `src/avatars.ts` (`sessile`, `hover`, `animate`, `pattern`
  fields), `docs/avatars/AUTHORING.md`; sibling docs
  `docs/avatars/sci-fi/fallout-tv.md` (Mr. Handy hover/eyestalk/shroud
  precedent, cross-referenced multi-limb gap), `docs/avatars/sci-fi/star-wars-ot.md`
  (R2-D2 shroud technique and `bodyShape` gap precedent),
  `docs/avatars/cartoons/toy-story.md` (Slinky Dog ring-of-accessories
  technique precedent), `docs/avatars/base/robotic.md` (`sleek-android`
  cyan-seam idiom precedent), `docs/avatars/video-games/metroid.md` (Mother
  Brain limbless/sessile idiom precedent).
