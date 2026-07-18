# Avatar pack: Fallout (TV Series)

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no printed insignia beyond generic blank shapes, no names printed anywhere
in-scene; character identity lives only in this doc's Reference lines and the
pack's display labels.

## Overview

- **Group**: the primary cast + iconic hardware of Amazon's *Fallout* (2024– ),
  the live-action TV adaptation of the post-apocalyptic RPG franchise — a
  Vault 33 dweller, a 200-year-old ghoul gunslinger, a Brotherhood of Steel
  squire-turned-knight (in and out of power armor), the MacLean family, a
  loyal wasteland dog, and three genre-defining robot silhouettes.
- **Hierarchy path**: `sci-fi / fallout` — placed under **Sci-Fi**, not Pop
  Culture, per the taxonomy's genre-beats-medium rule (live-action but
  unambiguously sci-fi, same precedent as `stranger-things` and `firefly`).
  Kept as a single path level (no sub-series) since this pack covers the TV
  continuity specifically; a future *Fallout* video-game pack would live
  under `Video Games` per the games-always-there rule and would never
  collide with this one.
- **Member count**: 11. **Rig mix**: 10 humanoid, 1 quadruped (the dog).
- **No shared base spec.** Like `star-wars-ot`, this ensemble is deliberately
  heterogeneous by design — vault jumpsuits, a century-weathered gunslinger,
  Brotherhood military dress, sealed power armor, and household robots share
  no single starting point worth factoring out. Discipline is in the shared
  conventions below, not a `base` block.
- **Shared conventions**:
  - **The Vault 33 blue/yellow jumpsuit** (`0x2f4a72` body / `0x24395c` legs
    / `0xd9b23a` gold trim) is reused verbatim across every MacLean-family
    member (`lucy-vault-suit`, `norm-maclean`, `hank-overseer` underneath his
    coat) and the standalone `vault-dweller-generic`, distinguished from each
    other by hair, build, and the **back `decals` vault-number text** — the
    sanctioned way to put the vault number on a suit (see Rig gaps for the
    one place this technique runs into an anchor limit).
  - **Diagonal bandolier strap technique** (chest-anchor box, rotated) is
    reused for the Ghoul's shell bandolier — established for Chewbacca in
    `sci-fi/star-wars-ot.md` and Boba Fett's ammo belt in the same doc; cited
    here, not re-derived.
  - **Enclosing-helmet technique** (oversized head-wrapping sphere shell) is
    reused for the T-60 power-armor knight, matching the Vader/astronaut
    precedent already established across this doc set.
  - **`pattern` for weathering, not just fur/scales**: this pack is the first
    to lean on the Phase 4a `pattern` scatter generator for skin/armor wear
    rather than an animal coat — the Ghoul's radiation-mottled skin and
    Snuffleupagus-style texture aren't in play here, but the technique
    (`kind:'spots'`) is used for the Ghoul's blotchy irradiated skin.
  - **`hover` for a genuine floating household robot**: Mr. Handy is this
    pack's one hover member — a real legless float, not an approximation
    (contrast the `sci-fi/wall-e.md` sibling pack, which repurposes `hover`
    for *tracked* robots that don't actually float; this entry is the clean,
    literal use of the flag).
- **Member-selection notes**: **Dame Barb Howard** (the Ghoul's flashback-era
  wife, Vault 32's overseer) was considered and deliberately cut — she's a
  flashback-only antagonist secondary to Hank's own overseer-secret arc, and
  her "overseer coat + vault suit" silhouette would sit too close to
  `hank-overseer`'s to pass the merge-or-drop rule at pack scale. If a future
  audit wants a second flashback-era antagonist, she's the natural add.
  `Dogmeat`/CX404 is included as the pack's one quadruped exactly as the
  brief asked. A generic `vault-dweller-generic` and a Brotherhood
  `brotherhood-scribe` round out the roster per the brief's suggestion,
  alongside the two Fallout-iconic robot silhouettes (`mr-handy`,
  `protectron`) the brief flagged as worth considering.

## Members

### 1. `lucy-vault-suit` — "Vault Dweller (blue/yellow, twin braids)"

**Reference**: Lucy MacLean, the show's protagonist — a lifelong Vault 33
resident who ventures into the wasteland to rescue her kidnapped father.
Blonde hair in twin braids, optimistic vault-bred naivety hardening into a
survivalist. Wears the franchise-standard vault jumpsuit: blue body, a
gold/yellow trim strip down the collar/torso/sleeves, and her vault's number
on the back.

**Spec**
```
sk: 0.95
headR: 120
headShape: 'sphere'
skin: 'tint'
body: 0x2f4a72       // blue jumpsuit
legColor: 0x24395c   // darker blue legs
shoe: 0x1c2c40
eyes: 'dots'
emI: 0.1
hands: 'sphere'
limbR: 0.9
```

**Accessories**
- **crown** — twin blonde braids: two thin tapering cylinders flanking the head, `0xd9b95c`.
- **chest** — vertical gold zipper/collar trim stripe, thin box, `0xd9b23a`.
- **hip** — thin gold utility belt band, `0xc9a227`.
- **decals**: `[{ kind: 'text', text: '33', anchor: 'back', color: 0xd9b23a, bg: 0x2f4a72 }]` — the vault number, crisp and legible per the decal system's jersey-number convention.

**Silhouette check**: the blue/yellow jumpsuit plus twin braids and a bold
"33" on the back is unmistakably a Vault Dweller — no other member combines
braids with the jumpsuit palette.

**Personality**: `bobMul: 1.05, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0` (bright, determined optimist)
**Bubbles**: `🚪⚡😊🔧` (vault door, radiation, cheerful optimism, makeshift tools)

---

### 2. `cooper-ghoul` — "Wasteland Gunslinger (weathered duster)"

**Reference**: The Ghoul / Cooper Howard (Walton Goggins) — a 200-year-old
irradiated bounty hunter, formerly a Hollywood cowboy actor before the Great
War. Grey-green mottled irradiated skin, no visible nose, a tattered leather
duster over a faded western shirt, a dirty white cattleman hat, a shell
bandolier, and a low-slung revolver.

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0x9c8f78        // grey-tan irradiated skin
body: 0x6b5a45        // tattered leather duster
legColor: 0x2a2a2e    // black pinstripe trousers
shoe: 0x1c1a18
eyes: 'slit'            // weathered, squinting
emI: 0.05
hands: 'sphere'
limbR: 1.0
```
`pattern: { kind: 'spots', color: 0x746a55, count: 8 }` — radiation-mottled
skin blotches, the pack's showcase use of the pattern generator on skin
rather than fur.

**Accessories**
- **crown** — dirty white cattleman hat: dome + wide brim disc, `0xd8d2c0`, raised + tilted back per the standard hat-clearance rule.
- **face** — a flattened stub in place of the default nose cone, `0x8c8168` — the ghoul's signature missing nose.
- **chest** — diagonal bandolier strap (Chewbacca technique, reused not re-derived), dark leather `0x2a201a`, with 3–4 small shell-cylinder nubs.
- **hip** — gunbelt + holster, box + cylinder, `0x3a2c1e`.
- **hand** — long-barrel revolver prop, thin gunmetal cylinder, `0x4a4a4c`.

**Silhouette check**: the dirty white cattleman hat over a tattered brown
duster and mottled grey-green skin is unmistakable — no other member
combines a western hat with a duster.

**Personality**: `bobMul: 0.8, swayMul: 0.55, cadenceMul: 0.85, ampMul: 0.85` (weary, unhurried, deadly-efficient gunslinger stride)
**Bubbles**: `🤠🔫☢️😏` (cowboy, gunslinger, radiation, wry dark humor)

---

### 3. `maximus-squire` — "Brotherhood Squire (olive coat, no armor)"

**Reference**: Maximus (Aaron Moten) before claiming his knight's power armor
— a lowly Brotherhood of Steel squire, servant to Knight Titus. Squire
uniform: a double-breasted olive-drab coat, a red scarf, leather gloves, and
knee-high combat boots — no armor plating at all.

**Spec**
```
sk: 1.05
headR: 128
headShape: 'sphere'
skin: 'tint'
body: 0x5a6048        // olive-drab double-breasted coat
legColor: 0x3f4536
shoe: 0x2a2420
eyes: 'dots'
emI: 0.05
hands: 'box'            // leather gloves
limbR: 1.05
```

**Accessories**
- **neck** — red scarf wrap, small flattened box, `0xa8281f`.
- **chest** — double-breasted button rows, small dark button-dot cluster, `0x241f1a`.
- **crown** — short cropped dark hair, low flattened cap, `0x2a2018`.
- **hip** — Brotherhood belt buckle, small square, `0x8a8a86`.

**Silhouette check**: a plain olive-drab double-breasted coat with a red
scarf reads as a humble, unarmored squire — deliberately the least
imposing silhouette in the pack, which is the point: he earns the armor.

**Personality**: `bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.05, ampMul: 0.9` (earnest, striving, a little anxious)
**Bubbles**: `🛡️😰💪⭐` (aspiration to knighthood, nerves, effort, ambition)

---

### 4. `t60-power-armor-knight` — "Knight (sealed T-60 power armor)"

**Reference**: Maximus after claiming Knight Titus's T-60 power armor — a
hulking, sealed steel/brass exosuit with a rounded helmet, a glowing amber
HUD-visor band, oversized pauldrons, and a servo-motor backpack. The single
most iconic Fallout silhouette.

**Spec**
```
sk: 1.3               // armor bulk — matches the informal pack-scale
                        // ceiling this doc set uses for oversized builds
headR: 140
headShape: 'sphere'    // entirely enclosed by the helmet accessory
skin: 0x2a2c30
body: 0x3a3d42         // dark steel plating
legColor: 0x33363b
shoe: 0x1c1e21
eyes: 'visor'
eyeColor: 0xf0a830      // amber HUD glow
emI: 0.15
hands: 'box'
limbR: 1.35
steel: true
```

**Accessories**
- **crown** + **head** — full sealed helmet dome (enclosing-helmet technique, cited from `vader`/`astronaut`), gunmetal `0x2f3236`, raised center ridge.
- **chest** — chestplate control panel, `0x8a6a3a` brass trim, small amber status light.
- **back** — bulky servo backpack box, `0x2a2c30`, with 2 side vent cylinders.
- **shoulderL** / **shoulderR** — oversized pauldron caps, `0x4a4d52`.
- **hip** — armored plating skirt, short wide cone, `0x33363b`.

**Silhouette check**: the bulkiest, tallest silhouette in the pack — gunmetal
armor, glowing amber visor band, oversized pauldrons — is unmistakable
power armor at any size, sharply distinct from the plain squire coat above.

**Personality**: `bobMul: 0.65, swayMul: 0.4, cadenceMul: 0.7, ampMul: 1.1` (heavy, deliberate, powerful mechanized stomp)
**Bubbles**: `🛡️⚡🤖💪` (sealed armor, HUD hum, mechanized might, resolve)

---

### 5. `norm-maclean` — "Vault Sibling (short dark hair)"

**Reference**: Norm MacLean (Moisés Arias), Lucy's younger brother — stays
behind in Vault 33 investigating the unsettling truth about neighboring
Vault 32. Same standard jumpsuit as his sister; short dark hair, a more
guarded, skeptical demeanor.

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 'tint'
body: 0x2f4a72         // Vault 33 blue jumpsuit — same suit as Lucy
legColor: 0x24395c
shoe: 0x1c2c40
eyes: 'dots'
emI: 0.1
hands: 'sphere'
limbR: 1.0
```

**Accessories**
- **crown** — short tousled dark hair, `0x2a2018`.
- **chest** — gold zipper trim stripe (same convention as Lucy), `0xd9b23a`.
- **hip** — thin belt.
- **decals**: `[{ kind: 'text', text: '33', anchor: 'back', color: 0xd9b23a, bg: 0x2f4a72 }]`

**Silhouette check**: shares Lucy's exact Vault 33 palette (an intentional
sibling read, the same "shared family palette" idiom the `mario` pack uses
for the plumber brothers' overalls) but reads apart via dark hair and a
stockier plain build — the one deliberately-similar pairing in this pack.

**Personality**: `bobMul: 0.9, swayMul: 0.85, cadenceMul: 0.95, ampMul: 0.85` (watchful, a little sardonic)
**Bubbles**: `🔍🤨📋😒` (investigating, suspicion, vault records, dry skepticism)

---

### 6. `hank-overseer` — "The Overseer (cream coat, silver hair)"

**Reference**: Hank MacLean, Overseer of Vault 33 (Kyle MacLachlan) — Lucy and
Norm's father, publicly the community's beloved leader, secretly a Vault-Tec
scientist and the show's central antagonist. Wears the vault jumpsuit under a
distinguishing long Overseer's coat; neat silver-grey hair.

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 'tint'
body: 0x2f4a72         // vault jumpsuit underneath
legColor: 0x24395c
shoe: 0x1c2c40
eyes: 'dots'
emI: 0.1
hands: 'sphere'
limbR: 1.0
```

**Accessories**
- **crown** — neat silver-grey hair, `0xc7c4ba`.
- **back** — long Overseer coat drape, flattened cone from the shoulders down, cream/tan `0xdcd6c4` — the one member wearing an outer layer over the standard suit, distinguishing him at a glance.
- **chest** — Overseer badge/pin, small gold disc, `0xd9b23a`.

**Silhouette check**: the only cream/tan long coat over a vault suit, paired
with silver hair, reads instantly as "the Overseer" — distinct from every
plain-jumpsuit MacLean sibling.

**Personality**: `bobMul: 0.75, swayMul: 0.55, cadenceMul: 0.85, ampMul: 0.75` (composed, authoritative, quietly unsettling)
**Bubbles**: `📢🔬🗝️😐` (announcements, hidden science, secrets, unreadable calm)

---

### 7. `dogmeat-cx404` — "Wasteland Dog (tan, black mask)"

**Reference**: CX404, later nicknamed "Dogmeat" by the Ghoul — a female
Belgian Malinois, tan/fawn coat with a black muzzle mask and black-tipped
ears, loyal wasteland companion introduced in the show's flashback arc.

**Spec**
```
rig: quadruped
sk: 1.05
bodyLen: 620
bodyW: 190
bodyH: 230
legLen: 1.05
headR: 105
ears: 'pointy'          // erect Malinois ears
tail: 'up'
tailLen: 0.7
snout: 1.0
snoutShape: 'cone'
coat: 0xc9a06a           // tan/fawn
belly: 0xe0c48c
earColor: 0x2a2018        // black-tipped ears
snoutColor: 0x2a2018      // black muzzle mask
pawColor: 0xc9a06a
eyes: 'dot'
```

**Accessories**
- **qneck** — worn leather collar band, `0x4a3423`.

**Silhouette check**: alert pointed ears and a black muzzle mask on a lean
tan build reads instantly as a loyal wasteland dog — the pack's only
quadruped, unmistakable purely by rig family.

**Personality**: `bobMul: 1.15, swayMul: 1.0, cadenceMul: 1.2, ampMul: 1.05` (alert, energetic trot)
**Bubbles**: `🐕🦴👃🏜️` (loyal dog, tracking scent, desert wander)

---

### 8. `vault-dweller-generic` — "Vault Dweller (unnumbered, plain)"

**Reference**: a nameless, everyday resident of some other numbered vault —
background ensemble representing the wider Fallout vault system, wearing the
unmodified standard jumpsuit but a DIFFERENT vault number than the MacLean
family's Vault 33.

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 'tint'
body: 0x2f4a72
legColor: 0x24395c
shoe: 0x1c2c40
eyes: 'dots'
emI: 0.1
hands: 'sphere'
limbR: 1.0
```

**Accessories**
- **chest** — gold trim stripe (same convention), `0xd9b23a`.
- **chest** (second, tint accent) — a small blank name-tag badge in `'tint'` color, satisfying the pack-wide tint rule without touching the suit's canon-accurate blue/yellow.
- **decals**: `[{ kind: 'text', text: '111', anchor: 'back', color: 0xd9b23a, bg: 0x2f4a72 }]` — a different vault number so this member never gets mistaken for a MacLean.
- No `crown` hair accessory — kept deliberately plain/neutral (tint-colored default hair via the base skin tone) since this member's entire point is to be the pack's blank-slate everyman.

**Silhouette check**: the same vault suit family as Lucy/Norm but a
different vault number and no distinguishing hair — intentionally the
pack's most neutral entry, functioning as random-citizen fill.

**Personality**: `bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.0` (baseline, unremarkable)
**Bubbles**: `🚪🥫😊❓` (vault life, canned rations, cheerful vault-bred naivety, wasteland uncertainty)

---

### 9. `brotherhood-scribe` — "Brotherhood Scribe (red robe, spectacles)"

**Reference**: a Brotherhood of Steel Scribe — the order's tech/lore-keeper
caste. The show's uniform hierarchy marks scribes with a red sweater/robe
over the base brown uniform, distinct from knights' orange-and-white and
officers' black.

**Spec**
```
sk: 0.95
headR: 122
headShape: 'sphere'
skin: 'tint'
body: 0xa8281f          // red scribe sweater/robe
legColor: 0x4a4238       // brown trousers
shoe: 0x2a2420
eyes: 'dots'
emI: 0.05
hands: 'sphere'
limbR: 0.9
```

**Accessories**
- **crown** — short practical hair, `'tint'`.
- **face** — small round spectacles, thin ring accessory, `0x8a8a86`.
- **chest** — Brotherhood gear-insignia patch, small flat disc, `0xc7c7c0`.
- **hip** — satchel of scrolls/data slung at the side, small box, `0x5a4a34`.

**Silhouette check**: a red sweater/robe over brown, plus round spectacles,
reads as "the Brotherhood's bookish researcher" — distinct from the
squire's plain olive coat and the knight's full armor.

**Personality**: `bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.75` (studious, unhurried)
**Bubbles**: `📖🔬🗒️🤓` (lore-keeping, research, note-taking, bookish curiosity)

---

### 10. `mr-handy` — "Household Robot (hovering, three eyestalks)"

**Reference**: a Mister Handy — the franchise's genre-defining household/
utility robot, present across every era including the show. A spherical
hovering chassis (single central thruster, ground-effect skirt), three
segmented arms, and three eyes on independently-flexing stalks giving
near-360° awareness.

**Spec**
```
sk: 0.85
headR: 150             // the sphere body IS the head — see accessories
headShape: 'sphere'
hover: 650              // mm — legless float; the pack's ONE literal hover
skin: 0xc7c3b4           // riveted cream-metal shell
body: 0xc7c3b4
eyes: 'none'             // occluded by 3 bespoke eyestalk accessories
emI: 0.15
hands: 'box'
steel: true
limbR: 0.9
```

**Accessories**
- **root** — a large sphere shroud (~180 mm radius) enclosing the torso box entirely, matching `skin` — reuses the R2-D2 body-shroud technique (`sci-fi/star-wars-ot.md`) so the whole silhouette reads as one continuous sphere rather than a sphere head over a boxy torso.
- **face** ×3 — three thin cylinder eyestalks (~60 mm) radiating from the top-front of the sphere at different angles, each tipped with a small emissive-blue lens sphere (`0x4fd8ff`). Independently animated: `animate: { kind: 'sway', speed: 1.5, amp: 0.3, phase: 0 }` / `phase: 1.4` / `phase: 2.8` — desynced per-stalk wobble, a clean showcase of the Phase 4b per-primitive `phase` offset.
- **handL** / **handR** — two extra thin mechanical arm-cylinder accessories beyond the rig's built-in hands, approximating the canonical THIRD arm (see Rig gaps).
- **root** (second) — a flat wide skirt-flange ring at the sphere's base, `0x8a8a86`, with a faint blue emissive underglow disc beneath it (the ground-effect hover skirt).

**Silhouette check**: a floating cream-metal sphere with three independently
waving blue-tipped eyestalks and no legs at all is unmistakably a Mister
Handy — the pack's only hovering member.

**Personality**: `bobMul: 0.4, swayMul: 0.6, cadenceMul: 0.3, ampMul: 0.2` (smooth gliding hover — no stride at all, `hover` does the real work)
**Bubbles**: `🔧🫖🤖😊` (handyman tools, prim-and-proper tea-service politeness, robot nature, cheerful helpfulness)

---

### 11. `protectron` — "Patrol Robot (olive, domed head)"

**Reference**: a Protectron — a compact, clunky bipedal security/work drone
(~1.67 m), a large domed head housing three optic sensors, a boxy segmented
torso, and a stiff, jerky patrol gait. Painted here in the common
military-surplus olive-drab-with-a-white-star livery.

**Spec**
```
sk: 0.95
headR: 120              // domed head
headShape: 'sphere'
skin: 0x5a6048            // olive-drab
body: 0x4a5240
legColor: 0x3f4536
shoe: 0x2a2e28
eyes: 'compound'           // 3-sensor cluster reads as a faceted eye
emI: 0.2
hands: 'box'
steel: true
limbR: 1.05
gait: 'walk'
```

**Accessories**
- **chest** — white star roundel, flat disc, `0xf0ece0` — faction livery marking (a generic star, no branch insignia, per the no-logos policy).
- **crown** — small antenna stub.
- **back** — thin exhaust/vent detail box.

**Silhouette check**: the domed compound-eyed head atop a boxy olive torso
with a white chest star reads as a patrol robot — clearly distinct from
Mr. Handy's sleek hovering sphere and the T-60 knight's bulk.

**Personality**: `bobMul: 0.9, swayMul: 0.3, cadenceMul: 0.55, ampMul: 0.6` (stiff, jerky, mechanical patrol shuffle)
**Bubbles**: `🤖🚨👁️⚠️` (patrol bot, alert, scanning, warning)

## Rig gaps

1. **No third/extra-limb anchor for genuinely multi-armed characters.**
   Mr. Handy's canonical THREE arms are approximated by piling extra
   cylinder accessories onto `handL`/`handR` beyond the rig's built-in pair
   — there's no anchor meant for a limb beyond the standard two. A generic
   "extra limb" anchor (or an N-limb quadruped-style rig variant for
   multi-armed robots) would remove this hand-waving. This is the SAME gap
   the `sci-fi/wall-e.md` sibling pack hits independently for WALL-E's third
   arm and BURN-E's four eyestalks — cross-referenced there, not
   re-derived twice.
2. **`decals` anchors are restricted to `chest`/`back` only.** The vault
   jumpsuit's canonical number placement (back) works perfectly for
   `lucy-vault-suit`/`norm-maclean`/`vault-dweller-generic`, but the T-60
   knight's glowing amber HUD-visor readout — a natural decal candidate —
   has no `face`-anchored decal option, so it's approximated with a plain
   `eyeColor` tint instead of actual HUD glyphs/text. A `face` (or
   `visor`-specific) decal anchor would let a future pass put real
   readout-style text on a helmet visor.
3. **No brass-vs-steel metallic tint on the `steel` flag** (already flagged
   in `base/robotic.md` for `steampunk-automaton` — cited, not re-derived).
   The T-60 knight's armor and Protectron's chassis both use plain grey
   `steel: true`; a tinted-metal variant would let power armor read more
   distinctly brass/bronze without hand-picking a non-metallic `skin` hex
   that loses the metal sheen entirely.

## Sources

- [Lucy's vault suit — Fallout Wiki (Fandom)](https://fallout.fandom.com/wiki/Lucy's_vault_suit)
- [Fallout's Lucy Gets A Perfect Recreation In Cosplay — ScreenRant](https://screenrant.com/fallout-show-lucy-cosplay-vault-jumpsuit/)
- [Vault jumpsuit — Fallout Wiki (Fandom)](https://fallout.fandom.com/wiki/Vault_jumpsuit)
- [Cooper Howard — The Fallout Wiki](https://fallout.wiki/wiki/Cooper_Howard)
- [The Ghoul (Howard Cooper) Fallout Prime Show Costume Guide](https://costumediyguide.com/ghoul-howard-cooper-fallout-prime-cosplay)
- [The Ghoul's outfit — Fallout Wiki (Fandom)](https://fallout.fandom.com/wiki/The_Ghoul's_outfit)
- [T-60 power armor (TV series) — Fallout Wiki (Fandom)](https://fallout.fandom.com/wiki/T-60_power_armor_(TV_series))
- [Maximus — The Fallout Wiki](https://fallout.wiki/wiki/Maximus)
- ['Fallout' Maximus Actor On Secrets Of Wearing His Brotherhood Of Steel Power Armor — Forbes](https://www.forbes.com/sites/timlammers/2024/04/14/fallout-maximus-actor-on-secrets-of-wearing-his-brotherhood-of-steel-power-armor/)
- [Hank MacLean — The Fallout Wiki](https://fallout.wiki/wiki/Hank_MacLean)
- [The MacLean Family In Fallout, Explained — TheGamer](https://www.thegamer.com/fallout-maclean-family-explained/)
- [CX404 — Fallout Wiki (Fandom)](https://fallout.fandom.com/wiki/CX404)
- [Dogmeat (Fallout) — Wikipedia](https://en.wikipedia.org/wiki/Dogmeat_(Fallout))
- [Mister Handy (Fallout 3) — Fallout Wiki (Fandom)](https://fallout.fandom.com/wiki/Mister_Handy_(Fallout_3))
- [Fallout's Mr. Handy Robot Line Explained — GameRant](https://gamerant.com/fallout-mr-handy-robot-line-explained/)
- [Brotherhood of Steel uniforms — Fallout Wiki (Fandom)](https://fallout.fandom.com/wiki/Brotherhood_of_Steel_uniforms)
- [The Fallout TV Show's Brotherhood of Steel Ranks Explained — GameRant](https://gamerant.com/the-fallout-tv-shows-brotherhood-of-steel-ranks-explained/)
- [Protectron — Fallout Wiki (Fandom)](https://fallout.fandom.com/wiki/Protectron)
- [Protectron robots in Fallout video games — Writeups.org](https://www.writeups.org/fallout-protectron-robots/)
- [Fallout (American TV series) — Wikipedia](https://en.wikipedia.org/wiki/Fallout_(American_TV_series))
- In-repo: `src/avatars.ts` (`AvatarPrimitive.animate`, `decals`, `hover`,
  `pattern` fields), `docs/avatars/AUTHORING.md`; sibling docs
  `docs/avatars/sci-fi/star-wars-ot.md` (bandolier/enclosing-helmet/shroud
  technique precedent), `docs/avatars/base/robotic.md` (steel-tint gap cited
  rather than re-derived), `docs/avatars/sci-fi/wall-e.md` (multi-limb gap
  cross-reference).
