# Avatar pack: League of Legends

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the champion archetype, not a likeness. No logos,
no on-model face sculpts, no names printed anywhere in-scene; character
identity lives only in this doc's Reference lines and the pack's display
labels.

## Overview

- **Group**: Eight of Riot's most broadly recognized *League of Legends*
  champions — the roster a casual fan (or *Arcane* viewer who has never
  opened the client) would name first. Two are the show's breakout leads
  (Jinx, Vi), the rest are perennial classic/starter champions with the
  longest-running mascot presence in League merch and marketing (Ashe,
  Teemo, Yasuo, Lux, Garen, Ezreal). Together they span gunner, brawler,
  archer, tiny scout, swordsman, mage, knight, and explorer archetypes, so
  no two members lean on the same silhouette trick.
- **Hierarchy path**: `video-games / league-of-legends`
- **Member count**: 8
- **Rig**: humanoid for every member (no quadrupeds/pets in League's
  primary champion cast).
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
  - Piltover/Zaun hextech blue-cyan — `0x4fd8ff` (Jinx's glow accents,
    Vi's gauntlet glow, Ezreal's blast tip — the pack's shared "arcane
    energy" emissive, kept off any non-tech member)
  - Demacian silver — `0xc0c0c8` (Garen's plate armor)
  - Demacian gold trim — `0xc9a24a` (Garen's armor trim, Ashe's robe
    trim, Ezreal's gauntlet — a warm metallic that reads "regal/artifact"
    without being identical to any one member's signature color)
  - Demacian blue — `0x1c3a6b` (Garen's scarf, Lux's headband/leggings —
    the pack's shared "Demacia" navy)
  - Jinx magenta — `0xe0399e` (bralette/shorts — this pack's single most
    saturated, unique hue; nothing else uses it)
  - Jinx blue-cyan hair — `0x4dd8e0` (kept distinct from the hextech glow
    above by being a flatter, non-emissive tone)
  - Vi pink — `0xd9668f` (hair)
  - Frost white — `0xf0f0f5` (Ashe's hair — paired with dark robes rather
    than bright armor so it never reads as "Lux blonde")
  - Radiant gold — `0xf2d675` (Lux's and Ezreal's blonde hair — shared
    because both are fair-haired Piltover-adjacent humans; their armor
    vs. jacket silhouettes keep them apart, see Members)
  - Yordle beige — `0xd9c39a` (Teemo's fur)
  - Scout green — `0x3a7d3a` (Teemo's hat — the pack's only saturated
    green, kept off every other member)
  - Ionian steel-blue — `0x5c7a94` (Yasuo's armor)
- **Member-selection notes**: the survey list (Jinx, Vi, Ashe, Teemo,
  Yasuo, Lux, Garen, Ezreal) held up under verification — all eight are
  top-tier recognition champions (Jinx/Vi via *Arcane*'s crossover
  popularity; Ashe/Teemo/Garen/Ezreal/Lux as the game's longest-standing
  marketing mascots; Yasuo as one of the most culturally memed champions
  in the game's history). No swaps were needed. Omitted deliberately:
  hundred-plus supporting roster champions with lower casual-recognition
  (e.g. Annie, Katarina, Darius, Ahri) — a strong case could be made for
  any of them, but the brief's 5–12 primary-cast ceiling and this pack's
  already-full archetype spread (gunner/brawler/archer/scout/swordsman/
  mage/knight/explorer) argue for stopping at eight rather than crowding
  in a second mage or a second sword-user.

## Members

### 1. `sharpshooter-blue-braids` — "Sharpshooter (blue braids, magenta crop top, oversized gun)"

**Reference**: A manic, loose-cannon gunner from the undercity of Zaun —
pale skin, pink eyes, long blue braided hair, a punk mismatched magenta/
black crop top, torn magenta shorts held up by a bullet-belt, and a
minigun ("Pow-Pow") too large for her slight frame. (Jinx.)

**Spec**
```
sk: 0.95              // slender build despite the huge weapon
headR: 122
headShape: 'sphere'
limbR: 0.85             // deliberately slight/lanky, contrasts the gun's bulk
skin: 0xf2d9c4         // pale skin
body: 0xe0399e          // magenta crop-top base
legColor: 0xe0399e      // magenta shorts
shoe: 0x2a2a2a           // dark boots
eyes: 'dots'              // pink-eyed but plain dot read at 30px is cleaner
emI: 0.05                  // faint bullet-belt glint only
hands: 'sphere'
steel: false
armL: 0.95
legL: 1.0
footMul: [0.9, 1.0, 0.9]  // slim boots
```

**Accessories**
- **crown** (long braid, back-trailing) — a tapered cylinder-then-cone,
  ~45×320 mm, `0x4dd8e0` (blue-cyan hair), raised + tilted back per the
  standard hat/hair rule so the front hairline clears the eye band.
- **head** (×2, side braid wisps) — small tapered cylinders, ~25×140 mm
  each, `0x4dd8e0`, flanking the face.
- **chest** (mismatched strap accent) — a thin diagonal box, ~140×30×8 mm,
  `0x1a1a1a` (the canonical black-leather strap side), proud of the top.
- **hip** (bullet-belt) — a thin band, ~body-width×60×15 mm, `0xc9a24a`
  (brass bullets), worn low over the shorts.
- **hand** (Pow-Pow minigun, one hand) — an oversized cylinder,
  ~90×280×90 mm, `0x3a3a3a` with a `0x4fd8ff` emissive muzzle ring
  (~30 mm), extending forward past the fist — the pack's biggest prop,
  echoing the character's signature "weapon bigger than she is" joke.

**Silhouette check**: bright blue braided hair + saturated magenta top/
shorts + a gun barrel longer than her own arm is unmistakable even at
30px — no other member in the pack carries a weapon this oversized.

**Personality**: `bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.25, ampMul: 1.1`
(twitchy, gleeful, unpredictable energy — the fastest cadence in the pack)
**Bubbles**: `💥🔫🎉😜` (explosive weapons, guns, gleeful chaos, mischief)

---

### 2. `enforcer-shaved-pink-hair` — "Enforcer (shaved pink hair, oversized gauntlets)"

**Reference**: A Piltover peacekeeper built for hitting first and asking
questions never — reddish-pink hair shaved on one side and falling in
spikes on the other, faint freckles, mechanical-augment tattoos across
the arms/back, a white tank top under a ripped-sleeve blue hoodie, and a
pair of Hextech "Atlas Gauntlet" fists each bigger than her own head.
(Vi.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
limbR: 1.1               // stocky, muscular build
skin: 0xf0c8a8          // fair skin with freckle undertone
body: 0xf0f0ea           // white tank top
legColor: 0x2f2f38       // dark utility trousers
shoe: 0x2f2f38             // dark boots
eyes: 'almond'
emI: 0.1                     // subtle gauntlet-glow spill onto the arms
hands: 'box'                  // blocky read even before the gauntlet prop
steel: false
armL: 1.0
legL: 1.0
footMul: [1.05, 1.0, 1.05]
```

**Accessories**
- **crown** (spiked half-hair) — an asymmetric swept cone, ~130×90×70 mm,
  `0xd9668f` (pink), offset to one side (shaved on the other), raised +
  tilted back so the front clears the eye band.
- **chest** (hoodie collar) — a rounded box overlay, ~170×60×40 mm,
  `0x2f6fb0` (blue hood fabric), across the shoulders/collar only.
- **handL** / **handR** (×2, Hextech gauntlets) — large boxes, ~140×140×
  160 mm each, `0x5a6b7a` (gunmetal), with a `0x4fd8ff` emissive knuckle
  band (~130×25×20 mm) — sized to visibly dwarf the forearm, the single
  most load-bearing read for this member.
- **back** (tattoo panel) — a thin flattened box, ~120×160×6 mm, `0xc27a9a`
  (a muted pink-toned ink accent, proud of the surface per the coincident-
  face rule), centered between the shoulder blades.

**Silhouette check**: the asymmetric shaved-and-spiked pink hair plus a
pair of fists visibly larger than the head reads as "brawler" instantly,
even in flat color — no other member in the pack has oversized hands.

**Personality**: `bobMul: 1.1, swayMul: 0.85, cadenceMul: 0.95, ampMul: 1.2`
(heavy, confident, punch-first stride — strong but not slow)
**Bubbles**: `👊💥🚨🍩` (heavy punches, explosive strength, law-enforcement
duty, her well-known donut habit)

---

### 3. `frost-archer-white-hair` — "Frost Archer (white hair, dark blue-gold robes, ice bow)"

**Reference**: The warmother of a great northern tribe, known for the bow
of True Ice passed down through her lineage — pale skin, long white hair
(once blonde, turned white the day she took up the bow), and elegant
dark blue-black robes trimmed in gold. (Ashe.)

**Spec**
```
sk: 0.95
headR: 122
headShape: 'sphere'
limbR: 0.95
skin: 0xf2ddc9
body: 0x1c2740           // dark navy-black robe
legColor: 0x1c2740        // matching robe leggings
shoe: 0x14192a              // darker robe hem/boots
eyes: 'almond'
emI: 0.08                    // faint true-ice glow on the bow only
hands: 'sphere'
steel: false
armL: 1.0
legL: 1.05                    // tall, elegant proportions
footMul: [0.95, 1.0, 0.95]
```

**Accessories**
- **crown** (long straight hair, back-trailing) — a flattened tapered box,
  ~90×360×20 mm, `0xf0f0f5` (frost white), raised + tilted back so the
  front clears the eye band.
- **chest** (gold robe trim) — a thin V-shaped box pair, ~140×100×8 mm,
  `0xc9a24a`, framing the collar.
- **hip** (robe sash) — a thin band, ~body-width×90×10 mm, `0xc9a24a`.
- **back** (quiver) — a short cylinder, ~60×180×60 mm, `0x3a2f28` (dark
  leather), angled across the back.
- **hand** (True Ice bow, one hand) — a thin curved prop approximated as
  a tall flattened box, ~20×260×15 mm, `0x8fd8f5` (pale ice-blue)
  emissive ~0.15, held vertically alongside the body — the closest
  achievable bow read on the current rig (see Rig gaps).

**Silhouette check**: floor-length white hair over dark navy-black robes
with gold trim and a pale ice-blue bow prop reads "regal frost archer"
distinctly from every other member — the pack's only white-haired,
robed silhouette.

**Personality**: `bobMul: 0.85, swayMul: 0.8, cadenceMul: 0.9, ampMul: 0.95`
(composed, measured, unhurried — a warmother's bearing, not a soldier's
march)
**Bubbles**: `🏹❄️👑🦅` (bow and arrow, ice magic, tribal leadership, her
hawk companion/scouting ability)

---

### 4. `scout-yordle-hat` — "Scout Yordle (beige fur, green hat, backpack)"

**Reference**: The fearless, diminutive leader of a scouting fellowship —
a small furred creature with beige fur and brown eye markings, a signature
green scout hat with red-lensed goggles on top, a furry red scarf, a
telescope, and a backpack of maps nearly as big as he is. (Teemo.)

**Spec**
```
sk: 0.5                // small yordle scale, the pack's shortest member
headR: 132               // oversized head relative to body, cute-critter read
headShape: 'sphere'
limbR: 0.9
skin: 0xd9c39a          // beige fur
body: 0xd9c39a            // fur covers the "torso" too
legColor: 0xc4ac82        // slightly darker fur legs
shoe: 0xc9b98a              // khaki boots/paws
eyes: 'dots'
emI: 0.05
hands: 'sphere'
steel: false
armL: 0.9
legL: 0.85                  // short legs relative to the oversized head
footMul: [1.0, 0.9, 1.0]
```

**Accessories**
- **crown** (scout hat) — a rounded cone/dome, ~150×110×150 mm,
  `0x3a7d3a` (scout green), raised + tilted back with a trimmed dome so
  the front rim clears the brow per the standard hat-clearance rule.
- **head** (×2, goggle lenses on the hat brim) — two small spheres,
  ~30 mm diameter, `0xc9a24a` (gold rims) with `0xd94f4f` (red lens)
  centers, mounted on the hat front rather than over the eyes.
- **neck** (scarf) — a thick torus-like band, approximated as a short
  cylinder, ~90×40×90 mm, `0xc0392b` (red).
- **back** (backpack) — a box, ~140×160×90 mm, `0x6b4a2f` (brown leather),
  deliberately large relative to the small body.
- **face** (×2, brown eye markings) — small flattened ovals (thin boxes),
  ~30×20×5 mm, `0x7a5c34`, just above each eye.

**Silhouette check**: the pack's shortest, roundest silhouette — a small
beige critter topped with a disproportionately large green hat and a
bulky backpack — reads instantly even next to the pack's tallest member.

**Personality**: `bobMul: 1.3, swayMul: 0.7, cadenceMul: 1.2, ampMul: 0.85`
(quick, perky, short-strided — a cheerful scurry rather than a stride)
**Bubbles**: `🍄🔭🎒😄` (mushroom traps, scouting telescope, backpack of
maps, cheerful enthusiasm)

---

### 5. `wind-samurai-topknot` — "Wind Samurai (torn blue-grey armor, topknot, katana)"

**Reference**: An exiled Ionian swordsman wandering to clear his name —
back-length dark hair tied into a topknot with a woven cord, a scar
across the nose, and torn samurai-style armor: one shoulder in intact
steel plate, the rest in weathered light-blue cloth exposing part of the
chest, worn with baggy trousers and a long sword carried edge-up like a
katana. (Yasuo.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
limbR: 0.95
skin: 0xe8c39e
body: 0x5c7a94           // weathered light-blue cloth armor
legColor: 0x3a3f45         // baggy dark trousers
shoe: 0x2a2a2a               // dark wrapped boots
eyes: 'almond'
emI: 0
hands: 'sphere'
steel: false
armL: 1.0
legL: 1.0
footMul: [0.95, 1.0, 1.0]
```

**Accessories**
- **crown** (topknot base) — a small rounded box, ~70×50×70 mm,
  `0x1a1a1a` (black hair), raised + tilted back.
- **head** (topknot tail) — a short tapered cylinder, ~35×140 mm,
  `0x1a1a1a`, trailing back from the topknot.
- **head** (woven cord accent) — a thin ring/box, ~40×15×40 mm,
  `0xc9a24a` (tan cord), at the topknot base.
- **shoulderR** (intact plate pauldron) — a box, ~110×80×90 mm,
  `0x8a8a8a` (steel), on the one armored shoulder only — the torn-armor
  asymmetry is the character's whole point.
- **hip** (sash/rope) — a thin band, ~body-width×40×10 mm, `0xc9a24a`.
- **back** (sheathed sword, worn diagonally) — a long thin box,
  ~30×420×20 mm, `0x3a2f28` (dark lacquered sheath) with a `0xc9a24a`
  hilt cap (~40×60×20 mm), worn diagonally across the back edge-up.

**Silhouette check**: an asymmetric single steel pauldron over torn
light-blue cloth armor, a black topknot, and a long sword worn diagonally
across the back is distinct from every other member — the pack's only
asymmetrically-armored silhouette.

**Personality**: `bobMul: 0.9, swayMul: 0.6, cadenceMul: 1.05, ampMul: 1.0`
(controlled, economical, quietly swift — minimal wasted motion until he
needs to move fast)
**Bubbles**: `⚔️🌪️🍃🥋` (his sword, wind-based abilities, drifting leaves,
disciplined martial arts)

---

### 6. `radiant-mage-blonde` — "Radiant Mage (blonde hair, silver-white armor, wand)"

**Reference**: Demacia's youngest battle-mage, gifted with the power to
bend light — tall, pale-skinned, with shoulder-length golden-blonde hair
under a dark blue headband, a silver-white breastplate and skirt over
dark blue leggings/sleeves, white boots, and a wand she throws to bend
light into shields and blasts. (Lux.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
limbR: 0.9
skin: 0xf2ddc9
body: 0xe8e8ec           // silver-white breastplate
legColor: 0x1c3a6b         // dark Demacian blue leggings/sleeves
shoe: 0xf0f0f0              // white boots
eyes: 'almond'
emI: 0.1                      // faint light-magic sheen
hands: 'sphere'
steel: true                   // polished armor plate reads with a sheen
armL: 1.0
legL: 1.05
footMul: [0.95, 1.05, 0.95]  // heeled boot line
```

**Accessories**
- **crown** (headband) — a thin band, ~140×20×20 mm, `0x1c3a6b` (dark
  blue), worn over the blonde hair.
- **head** (shoulder-length hair, sides) — two flattened tapered boxes,
  ~50×220×30 mm each, `0xf2d675` (radiant gold), framing the face.
- **hip** (armored skirt panel) — a flared box, ~body-width×110×30 mm,
  `0xe8e8ec` (matches the breastplate).
- **chest** (light-magic emblem) — a small flattened box, ~50×50×8 mm,
  `0xffe27a` emissive ~0.2, centered on the breastplate.
- **hand** (wand, one hand) — a thin cylinder, ~15×220 mm, `0xf2d675`
  with a `0xffe27a` emissive sphere tip (~35 mm), held at the side.

**Silhouette check**: golden hair under a dark headband, a bright silver-
white breastplate/skirt over navy leggings, and a glowing wand tip reads
"radiant battle-mage" clearly — distinct from Ezreal's brown-jacket
silhouette despite the shared blonde hair.

**Personality**: `bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.05, ampMul: 1.0`
(light, graceful, quick on her feet)
**Bubbles**: `✨💡🎀📖` (light magic sparkle, radiance, her ribbon/bow
motif, a studious, bookish streak)

---

### 7. `demacian-knight-broadsword` — "Demacian Knight (silver-gold armor, blue scarf, broadsword)"

**Reference**: A tall, muscular Sword-Captain of Demacia's Dauntless
Vanguard — short brown hair, a strong jaw, magic-resistant silver-and-
gold plate armor over the torso and forearms, a blue Demacian scarf,
large brown gloves and boots, and a mighty broadsword ("Judgment") worn
at the back. (Garen.)

**Spec**
```
sk: 1.1                // tall, imposing knight build
headR: 128
headShape: 'sphere'
limbR: 1.25              // heavy plate armor bulk
skin: 0xe0b090
body: 0xc0c0c8            // silver plate breastplate
legColor: 0x9a9aa0         // matching silver plate greaves
shoe: 0x6b4a2f               // brown leather boots
eyes: 'dots'
emI: 0.08                     // subtle plate sheen
hands: 'box'                   // gauntleted fists
steel: true
armL: 1.05
legL: 1.0
footMul: [1.15, 1.0, 1.15]     // heavy armored boots
```

**Accessories**
- **head** (short hair) — a small rounded cap, ~120×50×120 mm, `0x5c3a1e`
  (brown), close to the scalp.
- **chest** (gold armor trim + emblem) — a flattened box, ~150×130×10 mm,
  `0xc9a24a`, centered on the breastplate.
- **neck** (Demacian scarf) — a draped box, ~100×160×20 mm, `0x1c3a6b`
  (Demacian blue), hanging from the collar.
- **shoulderL** / **shoulderR** (×2, pauldrons) — boxes, ~110×90×100 mm
  each, `0xc0c0c8` (matches the plate) with a `0xc9a24a` trim edge.
- **back** (broadsword, sheathed) — a long flattened box, ~50×480×25 mm,
  `0x9a9aa0` (steel blade) with a `0xc9a24a` cross-guard/hilt accent
  (~90×40×25 mm), worn diagonally across the back.

**Silhouette check**: bulky silver-gold plate armor, a draped blue scarf,
and a sword longer than his own torso worn across the back reads
"armored knight" instantly — the pack's bulkiest, tallest humanoid
silhouette, distinct from Yasuo's slimmer, asymmetric swordsman read.

**Personality**: `bobMul: 0.9, swayMul: 0.7, cadenceMul: 0.85, ampMul: 1.15`
(heavy, steadfast, unshakeable — the slowest cadence but the widest,
most deliberate stride in the pack)
**Bubbles**: `⚔️🛡️🦁🎖️` (sword and duty, shield/defense, the Demacian
lion crest, honor and valor)

---

### 8. `arcane-explorer-gauntlet` — "Arcane Explorer (blonde hair, brown jacket, gold gauntlet)"

**Reference**: A dashing, unknowingly gifted young explorer who raids
long-lost catacombs — tousled blonde hair, pale skin, a brown leather
jacket with a blue fur-lined collar over a white v-neck shirt with a
brown diamond motif, and an oversized bronze-gold Shuriman artifact
glove on one hand that unleashes arcane blasts. (Ezreal.)

**Spec**
```
sk: 0.95               // slim, youthful build
headR: 120
headShape: 'sphere'
limbR: 0.9
skin: 0xf2ddc9
body: 0x6b4a2f            // brown leather jacket
legColor: 0x3a3f45         // dark trousers
shoe: 0x4a3320               // brown boots
eyes: 'almond'
emI: 0.05                      // faint gauntlet-glow spill
hands: 'sphere'                 // plain hand; the gauntlet is one-sided
steel: false
armL: 1.0
legL: 1.0
footMul: [0.95, 1.0, 0.95]
```

**Accessories**
- **crown** (tousled hair) — an irregular swept cap, ~130×70×130 mm,
  `0xf2d675` (radiant gold, shared blonde with Lux), raised + tilted
  back so the front clears the eye band.
- **neck** (fur-lined collar) — a short thick band, ~110×40×110 mm,
  `0x3a5a8a` (blue fur lining), around the jacket collar.
- **chest** (white shirt V + diamond motif) — a small triangular box,
  ~90×110×8 mm, `0xf0ece0` (white shirt) with a smaller `0x4a3320`
  (brown diamond) accent centered on it.
- **handL** (Gauntlet of Ne'Zuk, one hand only) — an oversized box,
  ~120×130×140 mm, `0xc9a24a` (bronze-gold) with a `0x4fd8ff` emissive
  knuckle slot (~60×20×20 mm) — sized to read as a mystical artifact
  glove rather than a fist.
- **hand** (opposite hand) — none; the plain default hand stays bare so
  only one side reads as artifact-augmented.

**Silhouette check**: tousled blonde hair, a brown leather jacket with a
blue fur collar, and one oversized glowing gold gauntlet on a single hand
reads "artifact-wielding explorer" distinctly from Lux's armored,
two-handed silhouette despite sharing the blonde hair color.

**Personality**: `bobMul: 1.0, swayMul: 0.95, cadenceMul: 1.1, ampMul: 1.0`
(nimble, confident, quick on his feet — an adventurer's easy stride)
**Bubbles**: `💎✨🗺️😏` (Shuriman relic magic, arcane sparkle, exploration
and maps, cocky charm)

## Rig gaps

- **No dedicated bow/ranged-weapon prop shape.** Ashe's True Ice bow is
  approximated with a tall thin flattened box held vertically alongside
  the body rather than a true curved bow silhouette — reads fine at 30px
  but a purpose-built curved-bow primitive (or a `sphereArc`-style curved
  accessory) would generalize to any future archer-type champion pack.
- **No per-limb asymmetric armor convention beyond single-shoulder
  pauldrons.** Yasuo's "one steel shoulder, rest torn cloth" look is
  approximated with one `shoulderR` box and nothing on the left — works,
  but there's no broader "half-armored" convention (e.g. one full sleeve
  of plate vs. bare skin) if a future character needs more asymmetry than
  a single pauldron communicates.
- **No independent hand-prop-only-on-one-side convention beyond the
  existing `handL`/`handR` anchors.** Both Vi (gauntlets on both hands)
  and Ezreal (gauntlet on one hand only) work with the documented
  anchors, but a shared "weapon-arm" convention (flagged previously by
  the Metroid pack for Samus's arm cannon) would apply just as well here
  — this pack is a second, independent case for that same parked gap.
- **`emI`/emissive tuning for "throws a glowing projectile" abilities**
  (Lux's wand, Ezreal's blast, Jinx's rockets) has no dedicated "charged
  weapon" visual state — approximated here with a constant low emissive
  on the prop itself rather than any pulse/charge animation. Purely a
  static-geometry approximation, not a blocker.

## Sources

- [Jinx (Character) — League of Legends Wiki (Fandom)](https://leagueoflegends.fandom.com/wiki/Jinx)
- [ORIGINS: Jinx — League of Legends](https://nexus.leagueoflegends.com/en-us/2017/04/origins-jinx/)
- [Jinx (League of Legends) — Wikipedia](https://en.wikipedia.org/wiki/Jinx_(League_of_Legends))
- [Vi (Character) — League of Legends Wiki (Fandom)](https://leagueoflegends.fandom.com/wiki/Vi)
- [Vi — Universe of League of Legends](https://universe.leagueoflegends.com/en_US/story/champion/vi/)
- [Vi (League of Legends) — Wikipedia](https://en.wikipedia.org/wiki/Vi_(League_of_Legends))
- [Ashe (Character) — League of Legends Wiki (Fandom)](https://leagueoflegends.fandom.com/wiki/Ashe)
- [Ashe, the Frost Archer — League of Legends](https://nexus.leagueoflegends.com/en-us/champion/ashe/)
- [Ashe/Trivia — League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/Ashe/Trivia)
- [Teemo (League of Legends) — League of Legends Wiki (Fandom)](https://leagueoflegends.fandom.com/wiki/Teemo/LoL)
- [Teemo — League of Legends](https://www.leagueoflegends.com/en-us/champions/teemo/)
- [The Iconic Teemo Hat: A Deep Dive — Lolscape](https://lolscape.com/articles/teemo-hat-league-of-legends-significance/)
- [Yasuo/Cosmetics — League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/Yasuo/Cosmetics)
- [Yasuo — Universe of League of Legends](https://wiki.leagueoflegends.com/en-us/Universe:Yasuo)
- [Yasuo/Trivia — League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/Yasuo/Trivia)
- [Lux (Character) — League of Legends Wiki (Fandom)](https://leagueoflegends.fandom.com/wiki/Lux)
- [Lux — League of Legends](https://www.leagueoflegends.com/en-us/champions/lux/)
- [Characters in League of Legends: Lux — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Characters/LeagueOfLegendsLux)
- [Garen (League of Legends) — League of Legends Wiki (Fandom)](https://leagueoflegends.fandom.com/wiki/Garen/LoL)
- [Garen — League of Legends](https://www.leagueoflegends.com/en-us/champions/garen/)
- [Garen — Universe of League of Legends](https://wiki.leagueoflegends.com/en-us/Universe:Garen)
- [Ezreal (Character) — League of Legends Wiki (Fandom)](https://leagueoflegends.fandom.com/wiki/Ezreal)
- [Ezreal — Universe of League of Legends](https://universe.leagueoflegends.com/en_US/champion/ezreal/)
- [Make Your Own Ezreal Costume — Carbon Costume](https://carboncostume.com/ezreal-from-league-of-legends/)
- `docs/avatars/video-games/metroid.md` (this repo) — the shoulder/
  pauldron-anchor approximation and hat/hair eye-band-clearance
  conventions this pack reuses for Garen's pauldrons, Ashe's hair, and
  Teemo's hat.
- `docs/avatars/video-games/mario.md` (this repo) — the small-critter
  `sk` scale-down precedent (Toad, `sk: 0.55`) this pack follows for
  Teemo's `sk: 0.5`.
