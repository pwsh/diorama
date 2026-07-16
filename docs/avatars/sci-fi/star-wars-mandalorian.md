# Avatar pack: Star Wars — The Mandalorian

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no textures, no names printed anywhere in-scene; character identity lives only
in this doc's Reference lines and the pack's display labels.

## Overview

- **Group**: Bounty hunters, warriors & droids of *The Mandalorian* (Disney+,
  2019– ) — beskar armor is the pack's visual throughline.
- **Hierarchy path**: `sci-fi / star-wars / mandalorian`
- **Member count**: 8
- **Rig**: humanoid only (no quadrupeds in this pack; IG-11 is a bipedal droid
  built on the humanoid rig, see its Rig-gap notes)
- **Shared base spec** (all members start here, then override):
  ```
  sk: 1.0
  headR: 126
  headShape: 'sphere'
  limbR: 1.0
  hands: 'box'          // gauntleted/gloved hands read better as boxes across this pack
  eyes: 'visor'          // most members are helmeted; override to 'dots'/'almond' for unhelmeted faces
  steel: false
  emI: 0
  armL: 1.0
  legL: 1.0
  footMul: [1.0, 1.0, 1.0]
  shoe: 0x1c1a17         // shared worn-black boot tone, override per member as needed
  ```
- **Shared palette — beskar & armor metals**:
  - Polished beskar (Din's armor) — `0xc7c9cc` (bright cool steel)
  - Battle-worn/painted beskar (Bo-Katan) — `0x5b7a99` (steel-blue)
  - Antiqued gold beskar (the Armorer) — `0xb8934a`
  - Dark/oxidized beskar (Dark Trooper, Imperial black) — `0x1c1c1e`
  - Imperial white plastoid (trooper) — `0xe6e2d8` (slightly warm off-white, not pure white)
  - Worn Fett-pattern armor (the Marshal) — sandy `0xc9a86a` + olive-green `0x5c6b3f` + a single red pauldron `0x8a1f1f`
- **Pack-wide accessory convention**: a **T-visor** (or equivalent full-face
  visor) is this pack's dominant silhouette cue. Wherever `eyes: 'visor'` is
  used, no separate face accessory is needed for the visor itself — but a
  **rangefinder/antenna** nub (small cylinder, `crown` anchor, offset to one
  side above the visor line) recurs across most helmets (Din, the Marshal,
  Bo-Katan) and is called out per-member below rather than factored out,
  since its side/angle differs each time.
- **Pauldron approximation** (applies to every armored humanoid member): this
  rig has no dedicated shoulder anchor, so pauldrons are approximated as a
  pair of small boxes anchored at `chest`, offset laterally to each side and
  raised to shoulder height, with a slight outward+downward rotation so they
  read as capping the shoulder rather than sitting flat on the sternum. See
  Rig gaps.

## Members

### 1. `beskar-bounty-hunter` — "Bounty hunter (silver beskar armor, cape)"

**Reference**: A lone Mandalorian bounty hunter clad head-to-toe in polished
silver beskar (Mandalorian iron) — full-face T-visor helmet, plated vest,
twin pauldrons, vambraces, greaves, and a weathered charcoal cape; never
removes the helmet in front of others. (Din Djarin.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xc7c9cc        // polished beskar reads as "skin" — helmet is the head
body: 0xc7c9cc        // beskar vest/pauldrons/vambraces
legColor: 0xa8abb0    // beskar greaves, a shade darker/cooler than the vest
shoe: 0x2a2622        // worn brown-black boots below the greaves
eyes: 'visor'          // REQUIRED — T-visor is the whole face
steel: true
emI: 0
hands: 'box'           // gauntlets
limbR: 1.05
```

**Accessories**
- **crown** — small rangefinder cylinder, ~30×30×20 mm, `0x8a8a8a`, offset
  to the helmet's upper-right, angled slightly forward over the visor line
  (a hallmark silhouette detail, even though it's non-functional decoration
  on Din's particular helmet — keep it, it reads as "Mandalorian helmet"
  regardless of in-canon accuracy).
- **chest** (×2, pauldron approximation) — two boxes ~70×55×50 mm,
  `0xc7c9cc`, one per shoulder, per the pack-wide pauldron note.
- **back** — cape: a tall tapered cone/flattened-cylinder, ~380 mm wide at
  the shoulders narrowing slightly to ~340 mm at the hem, ~520 mm long,
  charcoal grey `0x3b3b3d` (boiled-wool cloth, matte — no `emI`), hanging
  from the shoulder line to below the knee.
- **hip** — utility belt: thin dark band, ~body-width × 40 × 20 mm,
  `0x2a2622`, plus a small holster box (~30×60×25 mm, `0x1c1a17`) offset to
  one side.
- **chest** — small circular signet/mudhorn emblem, a flattened disc
  ~34×34×6 mm, `0x8a8a8a`, centered on the chestplate just below the collar.

**Silhouette check**: the full silver-armor T-visor helmet silhouette,
topped by the cape falling from the shoulders, reads instantly even as a
featureless grey blob at 30px — no other member combines "all-metal head" +
"cape" + neutral silver.

**Personality**: `bobMul: 0.75, swayMul: 0.6, cadenceMul: 0.9, ampMul: 0.8`
(deliberate, armored, economical movement — a warrior who doesn't waste motion)
**Bubbles**: `🛡️🔫🎯🤨` (armor/creed, blaster, tracking a bounty, wary suspicion)

---

### 2. `foundling-child` — "The Child (green, brown robe)"

**Reference**: A 50-year-old member of Yoda's species, found as a foundling
and carried as a ward — huge dark eyes, oversized pointed ears, green skin,
wrapped in a simple hooded cream/tan robe; radiates outsized cuteness
relative to his actual Force ability. (Grogu, "Baby Yoda.")

**Spec**
```
sk: 0.32
headR: 108           // large relative to sk 0.32 — the oversized-head baby proportions ARE the character
headShape: 'sphere'
skin: 0x7cb342        // saturated toon green
body: 0xd8c9a3        // cream/oatmeal robe fabric
legColor: 0xd8c9a3    // robe covers the legs entirely — same tone, no visible trouser break
shoe: 0x7cb342         // bare green feet peek out from under the robe hem
eyes: 'dots'           // oversized dark dot-eyes, the single most important read
emI: 0
hands: 'sphere'        // small round three-fingered hands
limbR: 0.85
armL: 0.8
legL: 0.7
```

**Accessories**
- **head** (×2) — the huge pointed ears: elongated cones, ~55×140×45 mm
  each, `0x7cb342` (skin-matched), anchored at the left/right head points,
  rotated to droop outward and slightly down (~20° from horizontal) rather
  than standing upright — droopy huge ears are THE silhouette trait.
- **crown** — hood: a shallow bowl of robe fabric, ~140×50×140 mm,
  `0xd8c9a3`, resting low and loose at the back of the head (does not need
  the "tilt back to clear the brow" treatment other hoods need, since
  Grogu's hood is worn pushed back off the head, not up over it, in most
  appearances) — optional; the bare-headed look (no hood accessory) is
  equally canonical and arguably the more iconic pose.
- **chest** — a small robe-fold/wrap accent, a thin diagonal box
  ~90×14×8 mm, `0xc4b48c` (slightly darker cream), suggesting the robe's
  wrap-front closure.

**Silhouette check**: the enormous head-to-body ratio (already the rig's
signature, pushed further here with `sk 0.32` + a barely-reduced `headR
108`) plus the two huge drooping green ears is unmistakable even smaller
than 30px — this is the smallest, most head-heavy member in any Diorama
pack to date.

**Personality**: `bobMul: 1.3, swayMul: 1.2, cadenceMul: 0.75, ampMul: 0.6`
(a toddling waddle — short quick bob/sway but a slow, small-stride cadence;
reads as an unsteady little walk, not a confident adult gait)
**Bubbles**: `🍪🥣🔮😴` (snacks, soup — a known favorite, Force-sensing, napping)

---

### 3. `tatooine-marshal` — "Marshal (worn green/tan armor, red pauldron)"

**Reference**: The marshal of a small Tatooine settlement, who traded for a
complete, dented suit of Mandalorian armor (originally belonging to a
notorious bounty hunter) years before its original owner reclaimed it — wears
it over a brick-red shirt and scarf, without inner padding, so the armor
plates sit looser/rawer than a trained Mandalorian's fit. (Cobb Vanth,
wearing Boba Fett's armor.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0x8a5a3c        // sun-weathered tan skin (visible — helmet often carried, not worn)
body: 0xc9a86a        // sandy/tan chestplate and vambraces
legColor: 0x5c6b3f    // olive-green cuisses/leg plates
shoe: 0x3a2a1e         // worn brown boots
eyes: 'dots'           // usually shown bare-headed / helmet off — see accessory note for the alt look
emI: 0
hands: 'box'
limbR: 1.0
```

**Accessories**
- **chest** — brick-red shirt collar peeking above the chestplate: a thin
  band ~body-width×20×6 mm, `0x8a2020`, at the neckline.
- **chest** (single pauldron, NOT the pack-wide pair — this member is
  asymmetric) — one shoulder plate only, on the wearer's left, ~75×60×55 mm,
  deep red `0x8a1f1f` — the single red pauldron is the character's single
  most identifying accessory and must stay asymmetric (one side only).
- **hip** — a dark red sash/scarf knot, small flattened box ~60×40×10 mm,
  `0x7a1f1f`, at the hip anchor.
- **OPTIONAL alternate state — helmet on**: swap `eyes` to `'visor'` and add
  a **crown** rangefinder cylinder (~28×28×18 mm, `0x8a8a8a`, offset side)
  matching the pack's other T-visor helmets — the character is shown both
  helmeted and bare-headed on screen; default this doc to bare-headed since
  it's the more distinctive "lawman, not just another Mandalorian" read.

**Silhouette check**: the single asymmetric red pauldron against
sandy/olive (not silver) armor, worn over a visibly bare/tan head, is the
tell — every other armored member in this pack is either fully silver,
fully dark, or fully blue; this is the only warm sand+olive+single-red-
accent scheme.

**Personality**: `bobMul: 0.9, swayMul: 0.9, cadenceMul: 0.85, ampMul: 0.85`
(a rangy, unhurried frontier lawman's stride — confident but not martial)
**Bubbles**: `🤠🏜️🔫🛡️` (frontier/lawman hat tip, desert, blaster, borrowed armor/protection)

---

### 4. `dark-trooper` — "Dark trooper (black combat droid)"

**Reference**: A hulking Imperial combat droid encased in matte black,
silver-jointed armor, with narrow glowing red photoreceptors and built-in
jet boots — slow, nearly unstoppable, deployed in numbers to overwhelm a
target. (Phase-III Dark Trooper.)

**Spec**
```
sk: 1.12
headR: 130
headShape: 'box'       // broader, more angular helmet than the organic-helmet members
skin: 0x1c1c1e         // matte black shell reads as "skin" — fully encased droid
body: 0x1c1c1e         // matte black torso/football-pad shoulders
legColor: 0x1c1c1e
shoe: 0x2a2a2c          // slightly lighter jet-boot housings
eyes: 'redvisor'        // narrow glowing red photoreceptor band — REQUIRED
emI: 0.3                // the red visor + silver joints should read with a slight glow
steel: true             // silver joint plating over the black shell
hands: 'box'
limbR: 1.3
armL: 1.05
legL: 1.0
```

**Accessories**
- **chest** (×2, pauldron approximation, oversized here) — "football
  shoulder pad" bulk: two boxes ~90×75×70 mm, `0x1c1c1e`, larger and boxier
  than any other member's pauldrons — the broad-shouldered silhouette is a
  primary read.
- **crown/head** joint highlights — small silver accent boxes, ~16×16×16 mm
  each, `0xb0b0b0`, at the neck/helmet seam and both elbow/knee lines
  (4–6 total), representing the visible silver joint plating.
- **shoe** (already silver-toned per spec) — no extra accessory needed; the
  jet-boot bulk is covered by `footMul` below.
- footMul: `[1.3, 1.2, 1.3]` (visibly larger, blockier boots than any other
  member — jet-boot housings).

**Silhouette check**: all-black, broad-boxy-shouldered bulk with a narrow
red visor slit and scattered silver joint glints — the only fully black,
boxy-headed, red-eyed member; unmistakable even in silhouette.

**Personality**: `bobMul: 0.5, swayMul: 0.3, cadenceMul: 0.55, ampMul: 0.6`
(heavy, slow, mechanical — deliberately the slowest/least springy gait in
the pack; strength over speed)
**Bubbles**: `💀⚙️🔴👊` (menace, machine, red-eye alert, brute force)

---

### 5. `armor-forgemaster` — "Armorer (gold horned helmet, leather apron)"

**Reference**: The keeper of a Mandalorian covert's forge and creed — an
antiqued gold, horned helmet (rank/role marker, not decoration), heavy dark
leather smithing apron over dark robes, forges beskar into armor and weapons
for the covert by hand. (The Armorer.)

**Spec**
```
sk: 0.98
headR: 126
headShape: 'sphere'
skin: 0xb8934a        // antiqued gold beskar helmet reads as "skin"
body: 0x2a2420        // dark leather/robe torso beneath the apron
legColor: 0x2a2420
shoe: 0x1c1814
eyes: 'visor'          // full-face helmet like the other Mandalorians
emI: 0
steel: true
hands: 'box'           // heavy forge gloves
limbR: 1.0
```

**Accessories**
- **crown** (×5, horns) — five cone accessories along the helmet's dome
  centerline, gunmetal `0x5a5a5c`: two outer horns ~18×40×18 mm (tallest),
  two inner-middle horns ~14×22×14 mm, and one smallest center horn
  ~10×14×10 mm — sizes must step down symmetrically from the outer pair
  inward, per the character's signature horned-helmet silhouette.
- **crown** — a raised center ridge/comb running from the visor to the back
  of the dome, a thin low box ~10×14×140 mm, same gunmetal `0x5a5a5c`,
  sitting between the horn rows.
- **hip** — the pleated leather apron: a cylinder or multi-segment skirt
  shape, ~body-width+40 wide × 260 mm tall, dark brown `0x2e2115`, hanging
  from waist to just above the knee, wrapping most of the way around with a
  gap/tabard point at the back.
- **chest** — a small forge tool or hammer prop could optionally be a
  `hand` accessory instead (held, not worn) — omit by default since the
  figure should read even with empty/idle hands.

**Silhouette check**: the stepped gold horn row across the helmet dome
(large-small-small-small-large) is the single most important read — no
other Mandalorian in this pack has ANY horns, and none are gold.

**Personality**: `bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.8, ampMul: 0.7`
(measured, ceremonial, unhurried — an elder/artisan's calm bearing, not a
fighter's swagger)
**Bubbles**: `🔥⚒️🛡️📿` (forge fire, hammering beskar, the Creed/protection, ritual/tradition)

---

### 6. `remnant-trooper` — "Shock trooper (white Imperial armor)"

**Reference**: A rank-and-file soldier of the Imperial remnant — full white
plastoid armor plates over a black body-glove, rounded white helmet with a
black T-shaped eye lens, armed and anonymous, deployed in squads. (Imperial/
Remnant stormtrooper; called "shock trooper" here as the descriptive label
for this pack's generic Imperial grunt.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xe6e2d8        // off-white plastoid helmet reads as "skin"
body: 0xe6e2d8        // white plastoid chest/torso plates
legColor: 0xe6e2d8    // white plated legs
shoe: 0x1c1a17         // black boots below the shin plates
eyes: 'redvisor'       // repurposed as a solid dark T-shaped eye lens; treat the "red" as a dark charcoal `0x1a1a1a` override rather than glowing — see note
emI: 0
hands: 'box'
limbR: 1.0
```

> Note on `eyes`: this member wants a **solid dark/black T-shaped lens**,
> not a glowing red one. Use the `redvisor` STYLE (T-shape geometry) but
> override its color to near-black (`0x141414`) with `emI: 0` — if the
> generator ties `redvisor`'s color to a fixed red, that's a minor rig gap
> (see Rig gaps) and `slit` or plain `visor` in black are acceptable
> fallbacks.

**Accessories**
- **chest** (×2, pauldron approximation) — smaller/flatter than the
  Mandalorian members' pauldrons, ~60×30×45 mm, same white `0xe6e2d8` (the
  armor is more uniform-plated than shoulder-distinct — keep these subtle).
- **chest** — a small black chest-strap/utility box detail, ~50×30×10 mm,
  `0x1c1a17`, upper-center chest.
- **OPTIONAL elite variant**: add thin red stripe accessories (`crown` — a
  flat band across the helmet's brow, ~140×8×10 mm, `0x8a1f1f`; plus
  `legColor` swapped to `0x8a1f1f` on the shin plates only via a `chest`- or
  `hip`-anchored red accent box) to represent the red-marked Imperial
  armored-commando/officer variant seen later in the show — keep the
  default plain white for the common-grunt read.

**Silhouette check**: solid, featureless white head-to-toe with a dark
horizontal-and-vertical eye-lens band — the ONLY all-white member in the
pack, instantly reads as "faceless Imperial grunt" in contrast to every
other (beskar-toned or black) armored member.

**Personality**: `bobMul: 0.7, swayMul: 0.5, cadenceMul: 1.0, ampMul: 0.75`
(uniform, drilled, unremarkable marching gait — deliberately less
characterful than any named character in the pack)
**Bubbles**: `🎯🔫📡😬` (aim/target, blaster, comms/orders, nervous grunt energy)

---

### 7. `nite-owl-warrior` — "Warrior (blue-grey armor, owl helm)"

**Reference**: A skilled Mandalorian warrior and claimant to the Mandalorian
throne, commanding a small unit of loyalist fighters — signature blue-and-
grey armor (her unit's long-standing color scheme) and an owl-motif winged
helmet; wields a legendary black energy blade. (Bo-Katan Kryze.)

**Spec**
```
sk: 0.98
headR: 124
headShape: 'sphere'
skin: 0x5b7a99        // painted steel-blue beskar reads as "skin"
body: 0x5b7a99        // blue-grey chestplate/pauldrons/vambraces
legColor: 0x8a97a3    // lighter blue-grey greaves
shoe: 0x2a2622
eyes: 'visor'          // full T-visor helmet
emI: 0
steel: true
hands: 'box'
limbR: 0.95
armL: 0.98
```

**Accessories**
- **crown** (×2, owl "ear" wings) — two small swept-back wing/fin shapes
  flanking the top of the helmet, flattened cones ~40×60×16 mm each,
  `0x8a97a3` (lighter grey-blue than the base helmet), angled back and
  slightly outward — the owl-motif "ears" are the helmet's signature trait.
  Distinct from the Armorer's centered horn row — these sit further back
  and to the sides, swept, not upright.
- **crown** — small rangefinder nub, ~24×24×16 mm, `0x8a8a8a`, offset
  forward-side of the visor (shared convention with Din's helmet, smaller).
- **chest** (×2, pauldron approximation) — ~68×52×48 mm, `0x5b7a99`,
  matching the base armor tone (no contrasting color, unlike the Marshal's
  single red one).
- **hand** (optional, held prop) — a short dark hilt, ~18×18×70 mm,
  `0x0d0d0d`, representing the black-bladed weapon at rest in one hand;
  omit for a neutral idle pose.

**Silhouette check**: the steel-blue-grey (not silver, not gold, not black)
armor plus the swept owl-wing helmet fins is the tell — the only
blue-toned armored member, and the only one with backswept "ear" fins
rather than a centered horn row or a plain dome.

**Personality**: `bobMul: 0.85, swayMul: 0.7, cadenceMul: 1.0, ampMul: 0.9`
(confident, martial, upright — a commander's bearing)
**Bubbles**: `⚔️👑🦉🛡️` (blade/combat prowess, claim to leadership, owl motif, protection/creed)

---

### 8. `nurse-droid` — "Assassin-turned-nurse droid (white/red)"

**Reference**: A reprogrammed bounty-hunter droid, originally built to kill,
later repurposed as a blunt, over-literal medic/nurse — a slim, angular
armored chassis, twin ammunition bandoliers retained from its combat past,
small glowing red optical sensors, jerky/mechanical precision of movement.
(IG-11.)

**Spec**
```
sk: 1.05
headR: 96             // small, narrow droid head relative to body — an intentional exception to the pack's oversized-head norm
headShape: 'box'       // angular, linear droid head — approximates the elongated real design; see Rig gaps
skin: 0xd6d2c8        // pale cream-white chassis plating
body: 0xd6d2c8
legColor: 0xb0aca2    // slightly darker plating on the lower limb struts
shoe: 0x8a867c          // narrow foot/tread housings, no true "shoe" bulk
eyes: 'redvisor'       // small centered red optical sensor — READ AS A DOT, not a wide band; narrow the geometry if the generator supports a width param, else accept as a stylization
emI: 0.35              // the red sensor should read with a clear glow — droid, not organic
hands: 'box'
limbR: 0.55            // deliberately THIN limbs — a linear, spindly droid frame, opposite of the Dark Trooper's bulk
armL: 1.1
legL: 1.15
footMul: [0.7, 0.8, 0.9]
```

**Accessories**
- **chest** (×2, diagonal bandoliers) — two elongated thin boxes,
  ~180×16×10 mm each, `0x8a1f1f` (worn dull red), anchored at `chest`,
  rotated to cross diagonally shoulder-to-opposite-hip in an X or parallel
  pair — retained ammo bandoliers from the droid's bounty-hunter past.
- **head** — small antenna/sensor stalks (×2), thin cylinders ~8×30×8 mm,
  `0x8a867c`, at the head anchor sides.
- **crown** — a flat panel line across the top of the head, a thin box
  ~70×10×40 mm, `0xb0aca2`, suggesting the droid's linear cranial plating.

**Silhouette check**: an unnaturally thin, angular, all-off-white body with
a small boxy head and one tiny glowing red eye, crossed by dull-red
bandoliers — the only NON-humanoid-proportioned member (thin limbs, small
head) in a pack otherwise built from armored human silhouettes, and the
pack's sole droid.

**Personality**: `bobMul: 0.2, swayMul: 0.1, cadenceMul: 1.1, ampMul: 0.7`
(almost no organic bob/sway — sharp, linear, faintly jerky mechanical
motion; the least "alive"-feeling gait in the pack by design)
**Bubbles**: `💉🩹🤖⚠️` (medical/nurse duties, patch-up, droid nature, blunt-force warning/self-destruct)

## Rig gaps

- **No dedicated shoulder/pauldron anchor.** Five of this pack's eight
  members (Din, the Marshal, the Dark Trooper, Bo-Katan, the remnant
  trooper) wear armor with a visually distinct shoulder plate. The current
  accessory anchors (`crown`, `head`, `face`, `chest`, `back`, `hip`, `hand`)
  have nothing that sits naturally astride the shoulder line, so every
  member approximates pauldrons via a symmetric (or, for the Marshal,
  deliberately asymmetric single) pair of `chest`-anchored boxes raised and
  offset outward. A true `shoulder` anchor (left/right, offset from the
  `sk`-scaled shoulder width automatically) would generalize across this
  pack and any other armored/military franchise pack (this exact gap was
  already flagged in the Star Trek TNG doc's baldric/yoke note — pauldrons
  are the same underlying need).
- **`redvisor` eye style is presumed to carry a fixed red glow color.** Two
  members in this pack want the SAME T-shaped/band visor geometry as
  `redvisor` but in different colors: the remnant trooper wants a plain
  black/charcoal lens (no glow), and the Dark Trooper wants the canonical
  red. If the generator's `redvisor` hard-codes red, exposing an optional
  color override on the existing visor-family eye styles (rather than
  adding a new named style per color) would cover this cheaply — this pack
  works around it with a documented per-member override note, but it's a
  workaround, not a clean fit.
- **Droid head/body proportions are a stretch of the humanoid rig, not a
  gap per se.** IG-11's canonical design is a tall, spindly, linear-jointed
  frame quite far from the rig's oversized-head/oversized-hands Sims norm.
  This doc leans into `headR: 96` (small for this rig) + `limbR: 0.55`
  (thin) + `headShape: 'box'` to get as close as the existing fields allow,
  and it reads recognizably in testing-by-description, but a true
  elongated/cylindrical head primitive (vs. today's `sphere`|`box` choice)
  would fit a linear droid head more precisely than a squashed box.
- **No reverse-knee/digitigrade leg option.** Not needed for IG-11 as
  currently spec'd (it stands on human-proportioned legs in canon), but
  flagged for future droid/creature packs in this same "Imperial hardware"
  neighborhood (e.g. probe droids, AT-ST-adjacent walkers) that would want
  it — noted here since it came up during this pack's research pass, not
  because this pack strictly needs it.

## Sources

- [Din Djarin's armor — Wookieepedia](https://starwars.fandom.com/wiki/Din_Djarin's_armor)
- [Mandalorian armor — Wookieepedia](https://starwars.fandom.com/wiki/Mandalorian_armor)
- [Din Djarin – The Mandalorian S2 — Mando Mercs Costume Club](https://mandalorianmercs.org/din-djarin-the-mandalorian-s2/)
- [Din Djarin - Beskar — 501st Costume Reference Library](https://crls.501st.com/bhg/din-djarin-beskar)
- [Grogu — Wikipedia](https://en.wikipedia.org/wiki/Grogu)
- [Make Your Own: Grogu (The Child / Baby Yoda) — Carbon Costume](https://carboncostume.com/make-your-own-the-child-baby-yoda-from-the-mandalorian/)
- [The Mandalorian's Marshal & Boba Fett Armor Explained — ScreenRant](https://screenrant.com/mandalorian-season-2-marshal-cobb-vanth-timothy-olyphant-boba-fett/)
- [Cobb Vanth — Wookieepedia](https://starwars.fandom.com/wiki/Cobb_Vanth)
- [Cobb Vanth — Rebel Legion](https://rebellegion.com/cobb-vanth/)
- [Boba Fett's armor — Wookieepedia](https://starwars.fandom.com/wiki/Boba_Fett's_armor)
- [Phase-III Dark Trooper — Wookieepedia](https://starwars.fandom.com/wiki/Phase-III_Dark_Trooper)
- [The Mandalorian's Dark Troopers: New Design & Powers Explained — ScreenRant](https://screenrant.com/mandalorian-dark-troopers-armor-design-powers-abilities-explained/)
- [The Armorer CRL — Mando Mercs Costume Club](https://mandalorianmercs.org/the-armorer-crl/)
- [Mandalorian Armorer — SMP Designs](https://www.smpdesigns.com/how-it-was-made/how-it-was-made-mandalorian-armorer)
- [Bo-Katan's Blue Mandalorian Armor & Owl Helmet Explained — ScreenRant](https://screenrant.com/mandalorian-bo-katan-blue-armor-owl-helmet-explained/)
- [Bo-Katan - The Mandalorian - Season 2 — 501st Costume Reference Library](https://crls.501st.com/bhg/bo-katan-the-mandalorian-season-2)
- [IG-11 — Wookieepedia](https://starwars.fandom.com/wiki/IG-11)
- [IG-11 — Star Wars Databank, StarWars.com](https://www.starwars.com/databank/ig-11)
- [Imperial armored commando — Wookieepedia](https://starwars.fandom.com/wiki/Imperial_armored_commando)
- [Stormtrooper — Wikipedia](https://en.wikipedia.org/wiki/Stormtrooper_(Star_Wars))
- General character/appearance knowledge of *The Mandalorian*'s main cast and
  recurring factions (Din Djarin, Grogu, Cobb Vanth, Dark Troopers, the
  Armorer, Imperial remnant troopers, Bo-Katan Kryze, IG-11) as broadly
  documented across Star Wars reference sources (Wookieepedia character
  pages, 501st/Rebel Legion costuming reference libraries).
