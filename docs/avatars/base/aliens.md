# Avatar pack: Aliens (base)

## Overview

- **Hierarchy path**: `docs/avatars/base/aliens.md` — this is a **base** pack
  (generic sci-fi archetypes, not licensed/franchise characters), sibling to
  `docs/avatars/{sci-fi,pop-culture,cartoons,video-games}`. It regroups the
  one alien avatar already shipped in the rig (`alien`, in
  `three-renderer.ts`'s `SPECS` table) and rounds the group out to a small
  "little green man → classic abduction lore → pulp invader → cosmic horror
  → insect → ooze" spread so the six members read as distinct silhouettes at
  30 px, not palette-swaps of one alien.
- **Shared style / pack-wide base spec**: no separate "costume" layer — for
  every member `body` colour equals (or nearly equals) `skin`, because these
  are bare-skinned creatures, not humans in uniform (contrast the
  `professional`/`cowboy`/etc. kinds, which tint a garment over human skin).
  Heads run larger than the `adult` baseline (`headR` 118–190 vs adult's 126)
  and limbs run thinner (`limbR` 0.5–0.85 vs adult's 1) — "big head, thin
  limbs" is the family read. All six keep `hands: 'sphere'` except the
  insectoid (`'box'`, clawed). None use `steel` (that's the robot/cyborg
  family). Existing eye styles (`almond`, `dots`) plus one new style proposed
  below (`compound`) are the face language; no member reuses `visor` (that
  reads as robot, not organic alien) or `redvisor`/`shades`/`slit`/`halfred`
  (costume/cyborg-coded).
- **Palette discipline**: each member gets its own hue family so the group
  doesn't collapse into "green guys" — green (existing `alien`), ash-grey
  (`grey-alien`), red-orange (`martian`), swamp blue-green (`tentacle-head`),
  olive chitin (`insectoid`), translucent teal (`blob-alien`). `_simsColor`'s
  saturation push applies on top of every hex below as usual.

## Members

### alien — "Little green alien"

*Existing kind: `alien`.* Do not respec — listed here only to anchor the
group and flag light refinement ideas.

- **Reference**: the "little green man" of 1950s–60s pulp sci-fi/UFO
  cartoons — bulbous green head, huge black almond eyes, spindly limbs. Sits
  apart from the "Grey" abduction-lore alien (below) by colour and by having
  a warm emissive glow rather than a matte, clinical look.
- **Spec** (as shipped):
  ```
  sk: 1, headR: 158, headShape: 'sphere', limbR: 0.8,
  skin: 0x86d46a, body: 0x86d46a, shoe: 0x1a1a1f,
  emI: 0.35, hands: 'sphere', eyes: 'almond', steel: false
  ```
- **Accessories**: none currently.
- **Silhouette check**: oversized bulbous green head + huge black almond
  eyes + spindly limbs. Already reads well at 30 px — no gap.
- **Refinement note (optional, non-breaking)**: `emI: 0.35` is the highest
  emissive of the pack, which is correct (this member is the "glowy sci-fi
  green" one) — keep it that way so `grey-alien`'s near-zero `emI` reads as
  a deliberate contrast rather than a bug.
- **Personality**: existing `AVATAR_PERSONALITY.alien` (uses defaults —
  no explicit multipliers in the current table). **Bubbles**: existing
  `alien: ['🛸', '❓']`.

---

### grey-alien — "Grey (huge-eyed alien)"

- **Reference**: the classic "Grey" of UFO-abduction lore (Roswell /
  Betty-and-Barney-Hill archetype, 1961 onward) — smooth ash-grey hairless
  skin, a disproportionately large hairless cranium, huge solid-black
  almond/wraparound eyes with no visible pupil, minimal face (small nose
  slits, thin unexpressive mouth), thin frail limbs, no ears. Deliberately
  drab/clinical rather than glowing — the opposite emotional register from
  the warm green `alien`.
- **Spec**:
  ```
  sk: 1, headR: 172, headShape: 'sphere', limbR: 0.7,
  skin: 0x9aa3ad, body: 0x9aa3ad, shoe: 0x24262b,
  emI: 0.08, hands: 'sphere', eyes: 'almond', steel: false
  ```
  (`headR` 172 > the green alien's 158 — the "huge cranium" is THE
  defining trait of a Grey in a way it isn't for the pulpier green alien;
  `limbR` 0.7 reads frailer; `emI` near-zero keeps it matte/clinical.)
- **Accessories**: none — a bald, unornamented dome is the point. Do not
  add hair/hood accessories to this member.
- **Silhouette check**: the huge ash-grey dome + jet-black wraparound
  almond eyes with **no** other facial detail is the one thing that sells
  it at 30 px. Existing `almond` eye style already scales off `HEAD_R`, so
  bumping `headR` alone makes the eyes read proportionally bigger — no rig
  gap needed for this member.
- **Personality**: `bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.8`
  (slow, deliberate, minimal-affect movement — the "calm clinical
  observer" read).
- **Bubbles**: 🛸 🔬 👽 ❓

---

### martian — "Martian (antenna alien)"

- **Reference**: the pulp/B-movie Martian invader archetype (descended
  from *War of the Worlds*-era illustration through mid-century comics and
  Mars-invasion movies) — reddish-orange skin, a domed head, and a pair of
  thin telepathy antennae. Distinguished from the green/grey aliens by
  **colour + antennae** rather than by eye style (no single "canonical"
  design dominates the trope, so this member leans on the two features
  that recur most often across depictions).
- **Spec**:
  ```
  sk: 1, headR: 148, headShape: 'sphere', limbR: 0.85,
  skin: 0xc74a2e, body: 0xc74a2e, shoe: 0x241512,
  emI: 0.20, hands: 'sphere', eyes: 'almond', steel: false
  ```
- **Accessories** (both anchored `crown` — top of head):
  - Antenna L/R: thin cylinder, ⌀14 mm × 190 mm, mounted at the crown
    offset ±30 mm along local X, tilted outward ~0.35 rad from vertical.
    Colour matches skin (`0xc74a2e`) so it reads as living tissue, not a
    prop.
  - Antenna tip L/R: small sphere, ⌀26 mm, at each antenna's free end,
    colour `0xff6a2e`, emissive same colour at intensity ~0.9 (a
    bioluminescent "signal" glow — the one deliberately glowy detail on an
    otherwise matte-ish member).
- **Silhouette check**: the pair of thin antennae with glowing tips
  projecting off the head is the ONE recognizer at small scale — the
  red-orange body colour alone would just read as "warm-toned humanoid."
  Fully achievable with the existing primitive+material accessory system
  (cylinder + emissive sphere, `crown` anchor) — no rig gap.
- **Personality**: `bobMul: 1, swayMul: 1.1, cadenceMul: 0.95, ampMul: 1`
  (near-normal gait with a faint otherworldly wobble from the sway bump).
- **Bubbles**: 📡 🔴 👽 🛸

---

### tentacle-head — "Tentacle-head alien"

- **Reference**: the cosmic-horror-adjacent "tentacle-faced" alien
  archetype that recurs across pulp sci-fi and modern TV (e.g. Doctor
  Who's Ood-style face-tendrils, Lovecraftian cephalopod-faced aliens) — a
  humanoid body topped with a bulbous head whose lower face is a cluster of
  writhing tentacles standing in for mouth/nose/jaw entirely.
- **Spec**:
  ```
  sk: 1, headR: 150, headShape: 'sphere', limbR: 0.85,
  skin: 0x6a8a7a, body: 0x6a8a7a, shoe: 0x1c231f,
  emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false
  ```
  (`eyes: 'dots'` for a pair of small, deep-set, ordinary eyes ABOVE the
  tentacle mass — everything alien about this face is below the eyeline.)
- **Accessories** (anchor `face`, replacing the built-in nose+mouth — see
  rig gap below):
  - Tentacle rosette: 5–6 thin tapered cone/cylinder segments, ⌀10–16 mm
    at the base tapering to ⌀4 mm, length 70–110 mm each, fanned out in a
    rosette centered at the lower-face anchor (`headY − HEAD_R·0.35`,
    `faceZ` at the front), each at a slightly different angle/length so
    the cluster doesn't read as a radial fan.
  - Colour: `0x4d6a5c` (a shade darker than skin, so the tentacles read as
    a distinct mass against the head).
  - Two of the six tentacles get a small sucker-tip sphere, ⌀6 mm, pale
    `0xb9c9c0`.
- **Silhouette check**: the writhing tentacle rosette in place of a
  mouth/jaw is the single unmistakable feature. It reads as a static prop
  at a glance, but selling it fully wants independent per-tentacle idle
  motion (see rig gap — animation, not just geometry, is what makes
  "tentacle" read as "tentacle" instead of "beard").
- **Rig gap surfaced**: the built-in nose+mouth auto-add (gated today on
  `spec.eyes !== 'visor' && spec.eyes !== 'almond' && spec.eyes !== 'slit'`)
  would draw a normal nose/mouth UNDER the tentacle cluster for any member
  using `eyes: 'dots'`. This member needs that suppression decoupled from
  eye style — e.g. a `noFace?: boolean` spec flag — so a `'dots'`-eyed
  alien can still opt out of the stock nose/mouth.
- **Personality**: `bobMul: 0.9, swayMul: 1.3, cadenceMul: 0.8, ampMul: 0.9`
  (slow, undulating, faintly menacing gait).
- **Bubbles**: 🐙 🌌 👁️ 🫧

---

### insectoid — "Insectoid (mantis alien)"

- **Reference**: the mantis-inspired insectoid alien archetype recurring
  across sci-fi/fantasy (e.g. the Thri-kreen-style humanoid mantis
  lineage) — an angular triangular head, large bulging compound eyes
  mounted on the sides, a segmented chitinous exoskeleton, and thin
  spindly limbs; sometimes small mandibles at the jaw.
- **Spec**:
  ```
  sk: 1, headR: 118, headShape: 'box', limbR: 0.6,
  skin: 0x5a7a3a, body: 0x44602c, shoe: 0x2a2f22,
  emI: 0.15, hands: 'box', eyes: 'compound' (NEW — see rig gap), steel: false
  ```
  (`headShape: 'box'` gives the angular mantis-head silhouette immediately
  — every other alien in this pack is `'sphere'`, so this is the one that
  reads as a different animal, not just a different colour. `hands: 'box'`
  for clawed mitts, reusing the existing box-hand option already used by
  `robot`.)
- **Accessories**:
  - Compound eyes L/R (anchor `head`, sides — where ears would sit):
    flattened hemisphere domes, radius ≈54 mm, deep red-black `0x3a0f14`
    with a small emissive fleck `0x8a1f1f` (a dim highlight, not a glow),
    mounted on the sides of the box head and angled outward ~30° so they
    bulge past the head's silhouette.
  - Mandibles (anchor `face`): two small curved thin cones, ≈50 mm long,
    dark chitin tone, crossing low on the front of the head. Secondary
    detail — skippable at 30 px.
  - Wing cases (anchor `back`, optional): two thin flattened
    cone/leaf shapes, ≈180 mm long, folded flat against the back, body
    colour. Subtle; reinforces "insect" silhouette from side/¾ angles.
- **Silhouette check**: the angular box head + two huge bulbous
  side-mounted compound eyes is the recognizer; mandibles and wing cases
  are secondary reinforcement only.
- **Rig gap surfaced**: none of the existing eye styles (`dots` — front
  pair, small; `almond` — front pair, large; `visor`/`redvisor` — single
  strip; `shades` — bar; `slit` — hood slit; `halfred` — one organic + one
  implant) model a **pair of large domes bulging from the SIDES of the
  head**. Two ways to close this: (a) treat "compound eyes" purely as an
  **accessory pair** (as specced above, anchor `head`) and set
  `eyes: 'dots'` with tiny/hidden dot eyes underneath, needing no new eye
  style at all — the pragmatic near-term option; or (b) add a genuine new
  `eyes: 'compound'` style to the switch in `_buildHumanoid` if more
  insectoid-family members are planned later (mantis, fly, spider-folk).
  Flagging both because the doc should stay valid either way the pack
  generator resolves it.
- **Personality**: `bobMul: 0.7, swayMul: 0.6, cadenceMul: 1.3, ampMul: 0.85`
  (quick, jerky, twitchy movement — mantis-like, not a smooth human stride).
- **Bubbles**: 🦗 🔬 🧬 👁️

---

### blob-alien — "Blob alien (amorphous ooze)"

- **Reference**: the amorphous gelatinous-blob alien archetype (descended
  from 1950s "creature from beyond" B-movies and general sci-fi slime/ooze
  creatures) — a translucent, wobbling mass with no fixed limb structure,
  simple eye-dots suspended somewhere inside the mass, oozing/rolling
  rather than walking.
- **Spec**:
  ```
  sk: 1, headR: 190, headShape: 'sphere', limbR: 0.5,
  skin: 0x6ac2b0, body: 0x6ac2b0, shoe: 0x3a6a5f,
  emI: 0.30, hands: 'sphere', eyes: 'dots', steel: false
  ```
  (`headR` 190 is the largest in the pack — the "head" sphere is meant to
  read as most of the creature's mass, with the humanoid torso/limbs kept
  as thin/small as the rig allows (`limbR` 0.5) so they read as vestigial
  rather than as the main body. `emI` 0.30 for a faint deep-sea
  bioluminescent glow.)
- **Accessories** (anchor `chest`/`torso-front`, positioned INSIDE the
  head/body volume): 2–3 small saturated "organ" spheres, ⌀20–34 mm,
  colour `0xffd23a` (warm contrast against the teal mass), floating at
  varying depths inside the translucent volume, gently bobbing
  independently (visual interest through the "skin").
- **Silhouette check**: a normal humanoid rig reads through limb
  articulation; a blob's read is almost entirely "single wobbling
  **translucent** mass with internal floating shapes visible through it,"
  which is a MATERIAL property, not a shape one. **This is the pack's
  headline rig gap** — see below.
- **Rig gap surfaced (major)**: the shared `_mat()` factory returns opaque
  `MeshToonMaterial` with no exposed `transparent`/`opacity` knob wired
  into the humanoid `Spec` today (furniture/glass-house paths use
  transparency, but the humanoid skin/body materials never do). Two
  needs: (1) a per-rig skin-transparency knob (e.g. `skinOpacity?: number`
  on `Spec`, threaded into the `skin`/`bodyMat` `_mat()` calls as
  `transparent: true, opacity: skinOpacity`) so light + the internal
  "organ" accessory spheres show through the outer mass; (2) because the
  torso/limb skeleton would otherwise show through as a visible internal
  armature (undesirable — a blob has no bones), this member either needs
  the limbs suppressed/hidden entirely (a `hideLimbs?: boolean` spec flag
  that keeps the joint groups for animation math but skips adding their
  meshes) or a dedicated "single squash-and-stretch sphere" body-shape
  override bypassing the standard torso+4-limb build. Until one of these
  lands, `blob-alien` can only be approximated (opaque single big sphere,
  no visible interior) — flag this clearly to whoever generates the pack
  data file.
- **Personality**: `bobMul: 1.6, swayMul: 1.5, cadenceMul: 0.6, ampMul: 0.5`
  (heavy squash-bob, wide wobble, slow oozing shuffle instead of real
  strides).
- **Bubbles**: 🫠 🟢 🔵 ❓

## Rig gaps

1. **Skin/body transparency knob** (major — blocks `blob-alien`): `Spec`
   has no `opacity`/`transparent` field; `_mat()` supports it but nothing
   threads it through for humanoid skin/body materials. Needed so a
   translucent creature can show accessories floating inside its own body.
2. **Limb suppression or single-sphere body override** (blocks
   `blob-alien`): the standard torso + 2-arm + 2-leg build would show
   through a transparent skin as a visible internal skeleton. Needs either
   a `hideLimbs?: boolean` spec flag (skip limb MESHES, keep joint groups
   for animation) or a distinct blob body-shape path.
3. **Nose/mouth suppression decoupled from eye style** (blocks
   `tentacle-head`): today the stock nose+mouth auto-adds for any `eyes`
   value outside `{visor, almond, slit}`. A `'dots'`-eyed member that
   replaces its lower face with an accessory (tentacles, mandibles, a
   beak, etc.) needs to opt out independently — e.g. `noFace?: boolean`.
4. **New `eyes: 'compound'` style** (nice-to-have for `insectoid` and any
   future insect/arthropod members): a pair of large bulging domes on the
   SIDES of the head, distinct from the existing front-facing `almond`/
   `dots` and the single-strip `visor`/`shades`. Workable near-term via
   plain accessory meshes instead (documented above), so this is a
   quality-of-life gap, not a blocker.
5. **Independent idle sub-animation for accessory clusters** (nice-to-have
   for `tentacle-head`, and to a lesser extent the antenna tips on
   `martian`): accessories today are static bolted meshes; selling
   "tentacles" fully wants a small per-tentacle idle-wiggle channel (akin
   to the quadruped ear-flick pulse) rather than a rigid prop. Not a
   blocker — the geometry alone still reads as tentacles, just less alive.

## Sources

- [Grey alien — Wikipedia](https://en.wikipedia.org/wiki/Grey_alien)
- [Grey | Alien Species | Fandom](https://aliens.fandom.com/wiki/Grey)
- [Martians — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/Martians)
- [Mars in fiction — Wikipedia](https://en.wikipedia.org/wiki/Mars_in_fiction)
- [Insectoid Aliens — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/InsectoidAliens)
- Repo grounding (not web): `src/three-renderer.ts` `SPECS` table
  (`_buildHumanoid`), eye-style switch (`makeEye`/`makeBrow`/almond/visor/
  slit/halfred branches), `EAR_SKIP` set, and `_addAvatarAccessories` call
  site — used to keep every field name/range in this doc consistent with
  the shipped rig.
