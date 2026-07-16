# Avatar pack: Sonic the Hedgehog

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no on-model face sculpts, no names printed anywhere in-scene; character
identity lives only in this doc's Reference lines and the pack's display
labels.

## Overview

- **Group**: The core cast of SEGA's *Sonic the Hedgehog* franchise — three
  speedster mammals (a hedgehog, a fox, an echidna), the hedgehog hero's
  devoted pink counterpart, his human archenemy, his brooding hedgehog rival,
  and his robotic doppelganger. Spans furry-cartoon-animal, human, and robot
  designs in one pack, so color family + one signature silhouette lever
  (quill shape, ear size, build, headShape) carries identity rather than a
  single shared body plan.
- **Hierarchy path**: `video-games / sonic-the-hedgehog`
- **Member count**: 7
- **Rig**: humanoid for every member, including Metal Sonic (an angular
  `headShape:'box'` + `steel:true` variant rather than a separate robot rig)
  and the two funny-animal sidekicks (Tails' tails ride the `tailbone`
  anchor; no quadruped machinery needed since the whole cast walks upright
  on two legs, matching the `dino-companion`/`mushroom-toad` biped-on-
  humanoid precedent from `docs/avatars/video-games/mario.md`).
- **Member-selection notes**: the survey's suggested seven (Sonic, Tails,
  Knuckles, Amy Rose, Dr. Eggman, Shadow, Metal Sonic) checked out as the
  franchise's primary cast and are used as-is — no trim needed, nothing
  added. Considered and omitted as secondary/spinoff-tier: Rouge the Bat and
  Silver the Hedgehog (recurring but games-specific, not top-of-mind for a
  casual fan the way this seven is), Cream the Rabbit and Big the Cat (minor
  supporting cast), Blaze the Cat and the Chaotix trio (Vector/Espio/Charmy,
  spinoff/crossover-tier), and Sticks the Badger (Boom-continuity only). If
  this pack ever needed to grow, Rouge + Silver would be the natural next
  two before splitting by sub-series became necessary — but 7 stays
  comfortably within the primary-cast rule as-is.
- **Shared base spec** (all members start here, then override — most fields
  get overridden given how varied this cast is, but the convention still
  holds):
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
- **Shared palette — the pack's recurring hues**:
  - Hero blue — `0x1a50bc` (Sonic's fur; also Metal Sonic's shell, kept
    intentionally IDENTICAL since the doppelganger is canonically "built in
    the image of Sonic, mostly blue metal" — differentiated instead by
    `headShape`, `steel`, and the visor/chest-disc accessories, the same
    "shared hue, different silhouette lever" idea as the Mario Bros.'
    shared overall-blue)
  - Peach/tan skin-and-muzzle tone — `0xf6cba8`-ish family (each organic
    member gets its own close variant) — covers face AND hands per the
    `skin` field's documented behavior (see Rig gaps: hand-color reuse)
  - Fox amber — `0xe8891f` (Tails' fur)
  - Echidna red — `0xd91f1f` (Knuckles' fur — kept a flatter, deeper red
    than Amy's pink or Eggman's coat red so the three reds don't collide)
  - Rose pink — `0xf199c4` (Amy's fur) / dress red `0xcc1f2a` (her dress,
    boots, headband — a distinct red family from Knuckles' fur-red and
    Eggman's coat-red, verified against source material as "bright red")
  - Eggman coat red — `0xcc1a1a` (his coat/goggles-strap)
  - Shadow black — `0x1a1a1a` with red streak accent `0xcc1f1f` (quills,
    stripes)
  - Metal-gray accents — `0xc0c4c8` (Metal Sonic's silvery muzzle/fins/
    shoulder plates)
  - Gold/amber trim — `0xd9b34a` (Eggman's buttons/goggle lenses, Shadow's
    inhibitor rings, Amy's hammer handle) — the pack's shared "metallic
    accent" hue, echoing the convention from other packs that a recurring
    gold ties otherwise-unrelated trim details together
- **Pack-wide convention — hedgehog-family quill construction**: Sonic,
  Amy, Shadow, and Metal Sonic all canonically carry 2–7 individual quill
  spikes. Rather than one cone per quill (which would blow the ≤10-
  accessory budget once chest/hand/ring details are added), each of the
  four builds theirs from exactly two anchor groups: `crown` (2–3 short
  cones = the forward "bang" spikes above the brow, raised + tilted back
  per the standard hat/hair rule) and `back` (2–3 longer cones = the main
  backward sweep down the neck). Any future hedgehog-family character
  should reuse this two-anchor split rather than inventing a new one.
- **Pack-wide caveat — no glove-color override**: Sonic, Knuckles, Amy, and
  Shadow are all canonically white-gloved, but (as first flagged in
  `docs/avatars/video-games/mario.md`) the rig's `hands` field is a shape
  enum only (`'sphere'|'box'`) — hands always render in the figure's `skin`
  tone, with no independent glove-color channel. This pack accepts the same
  approximation throughout (skin-toned hands) EXCEPT Tails, where his
  canonical muzzle/glove tones happen to be the same near-white, so his
  `skin` value coincidentally produces a correct-looking white glove for
  free — noted per-member below, not a fix to the underlying gap.

## Members

### 1. `blue-blur` — "Speedster (blue quills, red shoes)"

- **id**: `sonic-the-hedgehog/blue-blur` · **label**: "Speedster (blue
  quills, red shoes)"
- **Reference**: The series' iconic mascot — a small, lightning-fast blue
  hedgehog. Blue fur, a peach/tan muzzle and belly, green eyes, six
  backswept quills (two forming forehead bangs, four sweeping down the
  neck), white gloves, and red sneakers with a white cuff and gold buckle
  strap. (Sonic.)
- **Spec**
  ```
  sk: 0.85              // compact, energetic build — shorter than an adult
  headR: 128
  headShape: 'sphere'
  limbR: 0.85            // slender, lithe limbs built for speed
  skin: 0xffd7a0        // peach muzzle tone (also colors hands — see caveat)
  body: 0x1a50bc         // blue fur
  legColor: 0x1a50bc     // blue, matches body
  shoe: 0xe6131f          // red sneakers
  eyes: 'almond'           // closest preset to large green cartoon eyes — see Rig gaps
  emI: 0
  hands: 'sphere'          // white gloves not representable — see pack caveat
  steel: false
  armL: 0.95
  legL: 0.85                // short, quick legs
  footMul: [1.15, 0.9, 1.2] // big sneakers
  ```
- **Accessories**
  - **crown** (×2, forehead bang quills) — two short forward-swept cones,
    ~70×110×50 mm, `0x1a50bc`, raised + tilted back per the standard hat
    rule.
  - **back** (×3, main quill sweep) — three tapering cones swept backward
    down the neck/upper back, ~50×160×50 mm to ~40×110×40 mm, `0x1a50bc`,
    per the pack-wide hedgehog-quill convention.
  - **chest** — a peach oval belly patch, ~140×180×10 mm, `0xffd7a0`
    (matches `skin`), centered on the torso front, ≥3 mm proud.
- **Silhouette check**: compact blue body + red sneakers + a backswept
  spiky quill crest is unmistakable at 30px — the pack's only all-blue
  organic member (Metal Sonic shares the hue but reads as rigid/metallic,
  not furry).
- **Personality**: `bobMul: 1.3, swayMul: 0.7, cadenceMul: 1.6, ampMul: 1.2`
  (a loose, energetic superspeed run — the fastest cadence in the pack)
- **Bubbles**: `💨💍😎🌭` (wind-dash speed, his signature gold-ring
  collectible, cocky confidence, his well-documented love of chili dogs)

---

### 2. `twin-tailed-fox` — "Twin-Tailed Fox (amber fur, big ears)"

- **id**: `sonic-the-hedgehog/twin-tailed-fox` · **label**: "Twin-Tailed Fox
  (amber fur, big ears)"
- **Reference**: The hero's young sidekick — a two-tailed fox cub. Amber-
  orange fur with white/cream countershading on the muzzle, chest, and
  tail-tips, large triangular ears, blue eyes, white gloves, white socks,
  and red shoes with white tips. Spins his two tails like a helicopter
  rotor to fly. (Tails / Miles "Tails" Prower.)
- **Spec**
  ```
  sk: 0.65               // smallest, youngest member of the pack
  headR: 118
  headShape: 'sphere'
  limbR: 0.8
  skin: 0xf0ece0        // near-white muzzle tone — see hand-color note below
  body: 0xe8891f         // amber-orange fur
  legColor: 0xe8891f     // amber, matches body
  shoe: 0xd9241f          // red shoes (white tips omitted — see Rig gaps)
  eyes: 'dots'
  emI: 0
  hands: 'sphere'          // his near-white skin tone happens to read as a
                           // correct white glove — the pack's one case where
                           // the shared skin/hand-color gap works FOR him
  steel: false
  armL: 0.85
  legL: 0.7                 // short kid-proportioned legs
  footMul: [1.1, 0.85, 1.05]
  ```
- **Accessories**
  - **head** (×2, ears) — large triangular cones, ~90×140×30 mm, `0xe8891f`
    with a small proud cream inner-ear patch (~40×60×10 mm, `0xf0ece0`) on
    each — his single most recognizable feature besides the tails.
  - **tailbone** (×2, tails) — two tapering cylinder-then-cone tails
    trailing from the tailbone anchor, ~40→15 mm diameter over ~280 mm
    each, `0xe8891f` with a small cream tip cap (~30 mm sphere, `0xf0ece0`)
    on each — the anchor built for exactly this case.
  - **chest** — a cream belly patch, flattened oval, ~130×160×10 mm,
    `0xf0ece0`.
- **Silhouette check**: two tails trailing from the tailbone anchor + big
  triangular ears + amber/cream coloring reads as Tails instantly — the
  pack's only two-tailed member and its smallest scale (`sk 0.65`).
- **Personality**: `bobMul: 1.1, swayMul: 0.8, cadenceMul: 1.2, ampMul: 0.9`
  (energetic but younger — a bouncier, slightly less controlled gait than
  the hedgehog it follows)
- **Bubbles**: `🛩️🔧🦊💡` (his flight/piloting skill, tinkering and
  gadgetry, fox nature, inventive-genius-kid smarts)

---

### 3. `echidna-guardian` — "Echidna Guardian (red, spiked fists)"

- **id**: `sonic-the-hedgehog/echidna-guardian` · **label**: "Echidna
  Guardian (red, spiked fists)"
- **Reference**: The tough, solitary guardian of a legendary emerald — a
  muscular red echidna with seven dreadlock-like head spines, a white
  crescent-moon chest patch, and large white mitten-like gloves with sharp
  spiked knuckles on each fist (boxing-glove-inspired). Red-and-yellow shoes
  with green cuffs. Strong enough to punch through rock; glides and climbs.
  (Knuckles / Knuckles the Echidna.)
- **Spec**
  ```
  sk: 1.0                // adult baseline — noticeably bulkier than the speedsters
  headR: 130
  headShape: 'sphere'
  limbR: 1.25              // muscular build
  skin: 0xf2c9a0          // peach muzzle tone (also colors hands — see caveat)
  body: 0xd91f1f           // red fur
  legColor: 0xd91f1f       // red, matches body
  shoe: 0xd9241f            // red (yellow/green cuff trim omitted — see Rig gaps)
  eyes: 'dots'
  emI: 0
  hands: 'box'               // blocky, better reads the spiked-fist bulk
  steel: false
  armL: 1.15                  // long, powerful gliding/climbing arms
  legL: 0.85                   // shorter, stocky legs relative to the arms
  footMul: [1.2, 1.0, 1.2]
  ```
- **Accessories**
  - **crown** (×3, dreadlock spines) — a cluster of backswept cones,
    ~50×130×50 mm to ~40×90×40 mm, `0xd91f1f`, raised + tilted back per the
    standard hat rule (his "hair").
  - **back** (×2, trailing spines) — two more spine cones continuing the
    crown cluster down the nape, `0xd91f1f`.
  - **chest** — a white crescent-shaped patch, a flattened wide box,
    ~140×90×10 mm, `0xf5f2ea`, centered chest.
  - **handL** / **handR** (×1 each, knuckle spikes) — a small cone spike,
    ~30×40×30 mm, `0xe8e0d0`, proud atop each boxy fist.
- **Silhouette check**: broad muscular red body + a spiked dreadlock crown
  + a white crescent chest patch + big spiked fists is unmistakably
  Knuckles even in flat silhouette — the pack's heaviest-built hero
  (`limbR 1.25`).
- **Personality**: `bobMul: 0.85, swayMul: 0.6, cadenceMul: 0.8, ampMul: 1.2`
  (heavy, deliberate, powerful footfalls — noticeably tougher and slower
  than the speedsters)
- **Bubbles**: `💎🥊😤💪` (Master Emerald guardianship, punching strength,
  gruff stubbornness, raw physical power)

---

### 4. `rosy-hero` — "Rosy Hero (pink fur, red dress, hammer)"

- **id**: `sonic-the-hedgehog/rosy-hero` · **label**: "Rosy Hero (pink fur,
  red dress, hammer)"
- **Reference**: A cheerful, love-struck pink hedgehog devoted to the
  franchise's speedster hero. Bright pink fur, a peach muzzle and arms,
  green eyes, three forward quill-bangs, a red headband, a short red dress
  with white trim, white gloves, and red-and-white boots. Wields a huge
  pink-yellow-and-red "Piko Piko Hammer." (Amy Rose.)
- **Spec**
  ```
  sk: 0.8                // petite, energetic build
  headR: 122
  headShape: 'sphere'
  limbR: 0.8
  skin: 0xf6cba8         // peach muzzle tone (also colors hands — see caveat)
  body: 0xcc1f2a          // red dress (torso)
  legColor: 0xf199c4      // bare pink-furred legs below the short dress hem
  shoe: 0xcc1f2a           // red boots (white trim omitted — see Rig gaps)
  eyes: 'almond'
  emI: 0
  hands: 'sphere'           // white gloves not representable — see pack caveat
  steel: false
  armL: 0.85
  legL: 0.95                 // long, elegant legs relative to her small frame
  footMul: [1.0, 1.05, 1.0]
  ```
- **Accessories**
  - **crown** (headband) — a thin red box band, ~130×20×15 mm, `0xcc1f2a`,
    across the forehead.
  - **crown** (bangs, second primitive) — a single forward-pointing cone
    approximating her 3-spike quill fringe, ~90×70×60 mm, `0xf199c4`,
    tucked just behind the headband — per the pack-wide hedgehog-quill
    convention, scaled down for her softer, less-spiky look.
  - **back** — one short tapered cone trailing from the back of the head,
    `0xf199c4`, the shortest/subtlest quill-sweep in the pack.
  - **chest** — a thin white collar-trim accent, flattened box,
    ~body-width×20×8 mm, `0xf5f2ea`.
  - **handR** (Piko Piko Hammer, ×3 primitives) — a slim cylinder handle
    (~15×200×15 mm, `0xd9b34a` gold), a large flattened sphere mallet head
    (~130×90×70 mm, `0xf199c4` pink), and a thin band ring around the
    mallet's middle (~100×20×20 mm, `0xcc1f2a` red) — her single most
    iconic prop, held down at her side.
- **Silhouette check**: bright pink fur + a short red dress + a red
  headband + an oversized pink-and-gold hammer prop reads instantly as Amy
  — the only member carrying a giant mallet.
- **Personality**: `bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.15, ampMul: 1.0`
  (upbeat, bouncy, cheerful energy)
- **Bubbles**: `💕🔨😊🎀` (her devotion/crush, her signature hammer,
  cheerful warmth, feminine bow/ribbon flourish)

---

### 5. `egg-shaped-genius` — "Egg-Shaped Genius (red coat, huge mustache)"

- **id**: `sonic-the-hedgehog/egg-shaped-genius` · **label**: "Egg-Shaped
  Genius (red coat, huge mustache)"
- **Reference**: The series' recurring human mad-scientist antagonist — a
  bald, rotund, egg-shaped man with an enormous ginger-orange mustache,
  tinted pince-nez glasses, goggles resting on his forehead, and a long red
  coat with gold buttons over black trousers and boots. Builds robot armies
  to conquer the world; rides machines rather than walking far. (Dr.
  Eggman / Dr. Ivo Robotnik.)
- **Spec**
  ```
  sk: 1.15                // rotund and imposing — the tallest human-scale member
  headR: 110                // bald head reads SMALL relative to the huge body
  headShape: 'sphere'
  limbR: 1.5                 // extremely wide/rotund — the egg silhouette
  skin: 0xf0c299             // peach human skin, face + hands
  body: 0xcc1a1a              // red coat
  legColor: 0x1a1a1a           // black trousers
  shoe: 0x1a1a1a                // black boots
  eyes: 'shades'                 // tinted pince-nez glasses — closest available preset
  emI: 0
  hands: 'sphere'
  steel: false
  armL: 0.85                      // stubby arms relative to the huge torso
  legL: 0.65                       // short stubby legs — bowling-pin egg balance
  footMul: [1.3, 0.8, 1.3]
  ```
- **Accessories**
  - **chest** (huge belly overlay — the single most important accessory in
    this spec, reusing the Kraid oversized-torso-accessory precedent from
    `docs/avatars/video-games/metroid.md`) — a very large sphere/box bulge,
    ~480×420×380 mm, `0xcc1a1a` (matches the coat, since the belly IS the
    coat front).
  - **chest** (×2, gold buttons) — two small gold dots, ~20 mm, `0xd9b34a`,
    down the belly's centerline.
  - **crown** (goggles band) — a thin strap box across the forehead,
    ~130×20×20 mm, `0xcc1a1a`, sitting low at brow height (like the
    low-crown convention used for Princess Peach's crown in
    `docs/avatars/video-games/mario.md`, since these are forehead goggles,
    not a tall hat).
  - **crown** (goggle lenses, second primitive) — a single wide amber
    lens-band, ~90×20×15 mm, `0xd97a1a`, set into the goggles strap.
  - **face** (mustache) — a very large, wide box, ~150×55×30 mm,
    `0xd9781a` (ginger-orange) — the single most character-defining
    accessory in the pack, wider and bushier than anything else here.
  - **face** (pince-nez glasses, second primitive) — a small dark box,
    ~70×20×10 mm, `0x1a1a1a`, bridging the nose beneath the mustache.
  - **back** (×2, coat tails) — two flat trailing panels, ~120×220×20 mm
    each, `0xcc1a1a` with a thin silver piping-trim accent (~10 mm wide,
    `0xc9c9c9`) along the outer edge.
- **Silhouette check**: the huge egg-shaped rotund body (`limbR 1.5`, the
  widest in the pack) + an enormous ginger mustache + a red coat + tiny
  stub legs is unmistakably Eggman even in flat silhouette — the pack's
  only human.
- **Personality**: `bobMul: 0.5, swayMul: 0.5, cadenceMul: 0.6, ampMul: 0.9`
  (a smug, unhurried waddle — he rides machines, he doesn't run)
- **Bubbles**: `🥚😈🤖💢` (his egg self-image, villainous scheming, his
  robot armies, frustration at losing yet again)

---

### 6. `dark-rival` — "Dark Rival (black fur, red streaks)"

- **id**: `sonic-the-hedgehog/dark-rival` · **label**: "Dark Rival (black
  fur, red streaks)"
- **Reference**: A brooding hedgehog anti-hero engineered to rival the
  franchise's speedster hero — black fur with red stripes on his quills,
  arms, and legs (inspired by kabuki makeup), red eyes, a tan muzzle, a
  white chest tuft, white gloves, and rocket-powered "hover skate" air
  shoes. Wears a gold Inhibitor Ring on each wrist and ankle to limit his
  power. (Shadow / Shadow the Hedgehog.)
- **Spec**
  ```
  sk: 0.85                // same build scale as his rival counterpart
  headR: 128
  headShape: 'sphere'
  limbR: 0.85
  skin: 0xe0b088          // tan muzzle tone (also colors hands — see caveat)
  body: 0x1a1a1a           // black fur
  legColor: 0x1a1a1a        // black, matches body
  shoe: 0xcc1f1f             // red hover skates
  eyes: 'redvisor'            // glowing red eyes — closest available preset
  emI: 0.2                     // a faint red glow befitting his intensity
  hands: 'sphere'
  steel: false
  armL: 0.95
  legL: 0.85
  footMul: [1.2, 0.95, 1.25]   // bulkier hover-skate soles
  ```
- **Accessories**
  - **crown** (×2, bang quills) — two short forward-swept cones,
    `0x1a1a1a`, raised + tilted back per the standard hat rule, per the
    pack-wide hedgehog-quill convention.
  - **back** (×3, main quill sweep) — three tapering cones swept backward,
    `0x1a1a1a`, with a single thin red stripe overlay box
    (~15×100×5 mm, `0xcc1f1f`) proud on the center one — his signature
    red streak, economized to one accent rather than striping every quill
    individually to stay within the accessory budget.
  - **chest** — a white tuft patch, flattened oval, ~110×130×10 mm,
    `0xf5f2ea`.
  - **handL** / **handR** (×1 each, wrist Inhibitor Rings) — a thin
    flattened cylinder/ring, ~50×15×50 mm, `0xd9b34a` gold, at each hand
    anchor. His canonical ANKLE rings are omitted — there's no ankle
    anchor to hang them from (see Rig gaps).
- **Silhouette check**: black fur + red-streaked quills + a white chest
  tuft + gold wrist rings + red hover skates reads instantly as Shadow —
  the pack's only black-furred member, clearly distinct from the blue hero
  he mirrors in build.
- **Personality**: `bobMul: 0.9, swayMul: 0.5, cadenceMul: 1.4, ampMul: 0.9`
  (a stiffer, more controlled sprint than his rival's loose energetic run —
  cool, disciplined intensity)
- **Bubbles**: `💢🖤⚡😤` (chaos-energy intensity, his brooding aesthetic,
  hover-skate speed, gruff pride)

---

### 7. `robotic-doppelganger` — "Robotic Doppelganger (blue metal, red visor)"

- **id**: `sonic-the-hedgehog/robotic-doppelganger` · **label**: "Robotic
  Doppelganger (blue metal, red visor)"
- **Reference**: A mad scientist's robotic copy of the franchise's
  speedster hero, built purely to outperform the original. Blue metal
  body with a silvery-metal muzzle, shoulder plates, and clawed hands, a
  yellow chest disc with a black center, glowing red camera-visor "eyes",
  sharp metal fin-quills, and red feet with a white stripe. (Metal Sonic.)
- **Spec**
  ```
  sk: 0.85                // mirrors the original hero's own scale — a direct copy
  headR: 126
  headShape: 'box'          // angular robotic head vs. the organic hedgehogs' spheres
  limbR: 0.9
  skin: 0xc0c4c8            // silvery metal muzzle (also colors hands)
  body: 0x1a50bc             // blue metal — deliberately the SAME hue as the hero
                             // it copies (see Overview shared-palette note)
  legColor: 0x1a50bc         // blue metal, matches body
  shoe: 0xcc1f1f              // red feet (white stripe omitted — see Rig gaps)
  eyes: 'redvisor'             // glowing red camera-visor — his signature feature
  emI: 0.3                      // visor glow + metallic sheen
  hands: 'box'                   // mechanical claws
  steel: true                     // brushed-metal sheen across the whole body
  armL: 0.95
  legL: 0.85
  footMul: [1.1, 0.9, 1.15]
  ```
- **Accessories**
  - **crown** (×3, fin quills) — angular cone fins swept back, `0xc0c4c8`
    (silvery metal), sharper and more rigid than any of the organic
    hedgehogs' rounded quills, raised + tilted back per the standard hat
    rule.
  - **shoulderL** / **shoulderR** (×1 each, armor plates) — small spheres,
    ~90 mm, `0xc0c4c8`, distinct in both color and material read (`steel`)
    from the blue-metal arms.
  - **chest** (×2, chest disc) — a flattened cylinder, ~90 mm diameter,
    `0xf0c020` (yellow), with a smaller black center disc (~40 mm,
    `0x1a1a1a`) proud on top — his single most identifying feature.
  - **handL** / **handR** (×1 each, hand plates) — small yellow plate
    accents, ~30×10×30 mm, `0xf0c020`, on the back of each mechanical
    hand.
- **Silhouette check**: a rigid, angular metal-blue body + a glowing red
  visor + a yellow-and-black chest disc + silvery fin-quills reads
  instantly as a robotic double, not a living hedgehog — the pack's only
  `headShape:'box'` + `steel:true` member.
- **Personality**: `bobMul: 0.6, swayMul: 0.3, cadenceMul: 1.5, ampMul: 0.8`
  (a rigid, mechanically precise sprint — none of the loose, organic bounce
  of the hedgehog it was built to outperform)
- **Bubbles**: `🤖⚡💢👁️` (robotic nature, thruster-boosted speed, cold
  aggression, the ever-watching red visor)

## Rig gaps

- **No ankle/foot anchor.** Every shoe in this pack has a canonical
  contrast detail at the ankle — Sonic's white cuff + gold buckle, Tails'
  white sock/tip, Knuckles' green cuff, Amy's white boot trim, Shadow's
  ankle Inhibitor Rings, Metal Sonic's white foot stripe — and NONE of it
  is representable; the anchor list stops at `hip`, with nothing lower.
  This is already parked in `docs/ROADMAP.md` § "Avatar rig gaps"
  ("Additional anchors: wrist/cuff, ankle/foot, limb-midpoint"), but this
  pack is an unusually concentrated case — six of seven members hit it.
- **No eye-color override.** Sonic and Amy's green eyes and Tails' blue
  eyes all fall back to whichever built-in eye-style preset reads closest
  (`'almond'`/`'dots'`), with no way to actually set the iris color. Also
  already parked in ROADMAP ("Extra eye styles ... eye color overrides").
- **`skin` colors hands too, with no glove override** (first flagged in
  `docs/avatars/video-games/mario.md`). Four of this pack's members
  (Sonic, Knuckles, Amy, Shadow) are canonically white-gloved and can't get
  that look without also whitening their face — this pack accepts
  skin-toned hands throughout, same as Mario's white-gloved quartet. Tails
  is the one member where his own near-white muzzle tone happens to
  produce a correct-looking glove by coincidence, worth noting as a small
  positive data point for whenever a real fix lands.
- **Quill/spike-cluster accessory-budget pressure (new).** Four members
  (Sonic, Amy, Shadow, Metal Sonic) canonically carry anywhere from 2 to 7
  distinct quill/fin spikes, but modeling each individually would blow the
  ≤10-accessory-per-member budget once chest patches, hand props, and
  ring/plate accents are added. This pack compresses every quilled member
  down to 2–3 cones per anchor (crown + back), which reads fine at 30px
  but is a real simplification of the source silhouette — worth flagging
  for any future character whose defining feature is "many small identical
  spikes" (a dedicated "spike crest" primitive — N evenly-distributed
  cones from one param set, rather than N hand-placed accessories — would
  generalize this cleanly).
- **No thruster/hover-trail VFX (new).** Shadow's rocket-skate hover-dash
  and Tails' helicopter-tail flight are both signature LOCOMOTION effects
  with no visual counterpart beyond the existing walk-cycle `bobMul`/
  `swayMul`/`cadenceMul` multipliers used here as a stand-in. This is a
  different ask from the already-parked "animated appendages" gap
  (ROADMAP: tail sway/wing flap/ear posing) — it's a trailing-particle/
  glow-streak VFX question, not a rig-geometry one, but it's the kind of
  thing that would make both these characters read far more correctly in
  motion.
- **Oversized torso-accessory risk (reused).** Eggman's belly-as-coat-front
  reuses the exact convention (and the exact caveat) flagged for Kraid's
  belly in `docs/avatars/video-games/metroid.md` — works here, but the
  underlying risk (a `chest` accessory scaled past a normal-emblem size
  can clip against the body/limb-base mesh) is the same, not a new
  instance worth re-describing at length.

## Sources

- [Sonic the Hedgehog Color Scheme — SchemeColor.com](https://www.schemecolor.com/sonic-the-hedgehog.php)
- [Sonic Characters' Color Values — DeviantArt](https://www.deviantart.com/trishrowdy/journal/Sonic-Characters-Color-Values-299581130)
- [Miles "Tails" Prower — Sonic Wiki Zone (Fandom)](https://sonic.fandom.com/wiki/Miles_%22Tails%22_Prower)
- [Knuckles the Echidna — Sonic Wiki Zone (Fandom)](https://sonic.fandom.com/wiki/Knuckles_the_Echidna)
- [Amy Rose — Sonic Wiki Zone (Fandom)](https://sonic.fandom.com/wiki/Amy_Rose)
- [Character Chronicle: Amy Rose — Source Gaming](https://sourcegaming.info/2022/04/07/character-chronicle-amy-rose/)
- [Doctor Eggman — Sonic Wiki Zone (Fandom)](https://sonic.fandom.com/wiki/Doctor_Eggman)
- [Doctor Eggman — Wikipedia](https://en.wikipedia.org/wiki/Doctor_Eggman)
- [Shadow the Hedgehog — Wikipedia](https://en.wikipedia.org/wiki/Shadow_the_Hedgehog)
- [Shadow the Hedgehog — Sonic Wiki Zone (Fandom)](https://sonic.fandom.com/wiki/Shadow_the_Hedgehog)
- [Metal Sonic — Sonic Wiki Zone (Fandom)](https://sonic.fandom.com/wiki/Metal_Sonic)
- [List of Sonic the Hedgehog characters — Wikipedia](https://en.wikipedia.org/wiki/Characters_of_Sonic_the_Hedgehog)
- `docs/avatars/video-games/mario.md` (this repo) — the glove/hand-color
  gap this pack reuses verbatim, and the low-crown convention reused for
  Eggman's goggles.
- `docs/avatars/video-games/metroid.md` (this repo) — the oversized-
  torso-accessory (Kraid belly) precedent reused for Eggman.
- `docs/ROADMAP.md` § "Avatar rig gaps" (this repo) — the parked
  ankle/foot-anchor and eye-color-override gaps this pack's members hit
  repeatedly.
