# Avatar Pack: Pop Culture > Movies > Pirates of the Caribbean

**Path**: Pop Culture / Movies / Pirates of the Caribbean
**Style**: Stylized geometric toon homage figures in the Diorama Sims-toon rig (primitives + MeshToonMaterial, flat banded shading, dark cartoon outlines, oversized head/hands, green plumbob). This pack evokes the film series' silhouettes and palette through **color + shape only** — no textures, no logos, no likenesses. Every member uses a descriptive-generic `label`; the actual character identity lives in the `Reference` line only.

This is the **regeneration-ready source of truth** for the pack's data file. Re-run pack generation from this doc; do not hand-edit the generated data file without updating this doc first.

## Overview

This pack draws its cast from the *Pirates of the Caribbean* film series: a small, high-contrast ensemble built around one antihero captain, one hero couple, one rival captain, and two cursed/supernatural sea figures. That mix is exactly what the silhouette test rewards — nobody here relies on costume detail alone; each member has ONE strong shape read (a tricorn + dreadlocks, a wide low Eastern-styled hat, a feathered wide brim, a tentacle beard, a dreadlock mane with shell jewelry) that survives at 30 px even before color is considered.

**Design call — fixed costume colors, not sensor-tint carriers**: like `movies-lotr` and the TV packs, this is a named-character homage, not a generic archetype pack. The faded pale-blue of Davy Jones's coat, the earthy red of Will's shirt, and the ash-grey of Barbossa's coat are load-bearing identity colors — a sensor-tint override would wash out the read that makes the pack work. `body`/`legColor`/`shoe` stay FIXED hex per member; every member still carries at least one small saturated **accent** accessory (bandana, necklace, sash, bead) so per-sensor color coding has *something* to land on without fighting the costume.

**Member-selection notes**: the survey's suggested six — Jack Sparrow, Will Turner, Elizabeth Swann, Captain Barbossa, Davy Jones, Tia Dalma — all verify as primary-cast-or-iconic and are kept as-is; this sits comfortably in the healthy 5–12 range without needing to stretch for a seventh. Considered and cut:
- **James Norrington** (Commodore-turned-privateer) — a recurring named character across the first three films, but his "starched Royal Navy officer" silhouette (tricorn + navy coat) sits too close to the pack's existing hat-and-coat vocabulary (reads as a paler echo of Barbossa/Jack) without a signature prop strong enough to separate him at 30 px.
- **Pintel & Ragetti** — memorable comic-relief pirate duo, but one-note background ensemble, not primary cast.
- **Cutler Beckett** — secondary antagonist (introduced film 2), reads as a generic East India Company officer with no distinct silhouette beyond a plain coat and powdered wig; cut for redundancy with the pack's existing "coated authority figure" reads.
- **Joshamee Gibbs / Cotton / Jack the monkey** — background crew, not name-first recognition.
- Calypso's released giant sea-goddess form (Tia Dalma's true identity, revealed late in film 3) is a one-scene CGI transformation, not a worn costume — Tia Dalma's shopkeeper/voodoo-priestess look is the representative, silhouette-stable form and covers both.

**Shared "High Seas" palette** — every member pulls from this weathered, sun-and-salt family, with ONE saturated accent per character carrying the individual read (Jack's red bandana, Will's red shirt, Elizabeth's jade necklace, Barbossa's green bandana, Davy Jones's dark red sash, Tia Dalma's pale shell necklace):

| Swatch | Hex | Use |
|---|---|---|
| Weathered oak brown | `#5c4630` | coats, boots, wood props |
| Sun-bleached parchment | `#d8c9a0` | linen shirts, sashes |
| Aged brass/gold | `#a8842e` | buckles, trim, jewelry |
| Rope tan | `#c9a86a` | sashes, belts, cord |
| Deep charcoal leather | `#241f1a` | dark leathers, boots, hair |
| Storm-grey ash | `#7a756c` | ghostly / cursed coats |

**Pack-wide base spec** (start every member here, then diff):
```
emI: 0            # no glow — grounded seafaring pirates, not magical
hands: 'sphere'
headShape: 'sphere'
steel: false       # metal reads through accessory metalness, not a metallic body
eyes: 'almond'
footMul: [1, 1, 1]
```

---

## Members

### 1. `jack` — Roguish Captain (tricorn + beaded dreadlocks)

**Reference**: Captain Jack Sparrow, eccentric antihero captain of the Black Pearl. Kohl-lined eyes, dark dreadlocks threaded with beads, coins, and trinkets, a red bandana under a worn black tricorn hat, a layered off-white shirt, multiple belts and an oversized buckle, a rope-tan sash, and a battered brown frock coat; carries a compass and cutlass.

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
limbR: 0.95
skin: '#c9976a'
body: '#5c4630'        # weathered brown frock coat
shoe: '#3a2e20'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 1.0
legL: 1.0
footMul: [1, 1, 1]
legColor: '#3a2e20'
```

**Accessories**
- `crown` flattened box, ~130×40×90mm, `#241f1a` (worn black tricorn hat) — raised + tilted back (`rot [0.45,0,0]`) so the brim clears the brow.
- `crown` (second primitive, same anchor) thin band, `#a83030` (red bandana peeking under the brim) — the ONE saturated accent.
- `head` sphere cluster, ~70mm, `#1c1810` (beaded dreadlocks) with a couple of tiny bead dabs, `#a8842e` — proud of the head surface.
- `chest` diagonal thin box, `#c9a86a` (rope-tan sash) over the shirt.
- `hip` box cluster (three overlapping belts + oversized buckle), `#3a2e20` leather / `#a8842e` brass buckle.
- `handL` small disc, ~30mm, `#a8842e` (compass, held prop).
- `hip` thin long box (cutlass sheath), `#7a756c`.

**Silhouette check**: worn tricorn + beaded dreadlocks + red bandana band + stacked belts reads instantly as "the swaggering antihero captain," distinct from Barbossa's cleaner wide-brim feathered hat and Elizabeth's sleek low black hat.

**Personality**: `bobMul 1.15, swayMul 1.35, cadenceMul 0.95, ampMul 1.1` (off-balance, tipsy swagger)
**Bubbles**: 🏴‍☠️🧭🥃😏

---

### 2. `will` — Blacksmith Swordsman (red shirt + bandana)

**Reference**: Will Turner, blacksmith's apprentice turned pirate and eventual Flying Dutchman captain. Bandana-wrapped dark hair, an earthy red open-collar shirt, a black sailor coat, brown trousers, and a sword slung across the back.

**Spec**
```
sk: 1.0
headR: 120
headShape: 'sphere'
limbR: 1.0
skin: '#d8ac82'
body: '#8a3d2c'        # earthy red shirt — the ONE saturated accent
shoe: '#241f1a'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 1.05
legL: 1.0
footMul: [1, 1, 1]
legColor: '#4a3826'    # brown trousers
```

**Accessories**
- `crown` small sphere, ~55mm, `#241f1a` (short dark hair) plus a thin wrap, `#c9a86a` (bandana knot).
- `back` long thin box, diagonal, `#8a8a86` blade / `#3a2e20` grip+sheath (sword slung across the back).
- `back` (second primitive) flattened box, `#1c1a18` (black sailor coat panel), proud of the shirt.
- `hip` thin box belt, `#3a2e20`.
- `chest` small disc, `#a8842e` (cord/medallion detail at the collar).

**Silhouette check**: red open shirt (no coat covering it) + plain bandana (no hat) + sword-across-back reads as "the young blacksmith swordsman," clearly distinct from Jack's tricorn/dreadlocks read and Barbossa's ornate coat.

**Personality**: `bobMul 1.0, swayMul 0.7, cadenceMul 1.05, ampMul 1.0` (steady, athletic swordsman stride)
**Bubbles**: ⚔️⚓❤️🔨

---

### 3. `elizabeth` — Pirate Captain (Eastern-style black leathers)

**Reference**: Elizabeth Swann, the governor's daughter who rises to Pirate King. Dark hair, a black dyed-silk captain's robe with cream stitching, a wide, low-crowned black leather hat with red piping, a jade knotted necklace, and a leather waist cincher — an Eastern-warrior-inflected captain's look from the character's *At World's End* turn.

**Spec**
```
sk: 0.95
headR: 114
headShape: 'sphere'
limbR: 0.85
skin: '#e8c2a0'
body: '#1c1a18'         # black captain's robe
shoe: '#1c1a18'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 0.95
legL: 1.0
footMul: [1, 1, 1]
legColor: '#241f1a'
```

**Accessories**
- `crown` wide flattened cylinder, ~140mm diameter, low profile, `#1c1a18` (wide low-brimmed captain's hat) with a thin edge trim, `#a83030` (red piping) — raised + tilted back (`rot [0.4,0,0]`).
- `head` sphere cluster, ~65mm, `#241f1a` (long dark hair) trailing from under the hat brim.
- `chest` small disc, ~16mm, `#3f6b5a` (jade knotted necklace) — the ONE saturated accent against the all-black robe.
- `hip` thin box waist cincher, `#3a342c`, with brass details, `#a8842e`.
- `back` flattened cone, `#2a2420` (long coat drape).
- `handR` thin long box (cutlass), `#8a8a86` blade / `#3a2e20` grip.

**Silhouette check**: wide low black hat + jade necklace accent + sleek all-black silhouette reads as a distinct female-captain shape, contrasted against Jack's tricorn and Barbossa's feathered wide-brim — none of the three hat shapes overlap.

**Personality**: `bobMul 0.95, swayMul 0.85, cadenceMul 1.05, ampMul 1.0` (confident, commanding stride)
**Bubbles**: ⚔️👑🌊😤

---

### 4. `barbossa` — Cursed Captain (feathered hat + apple)

**Reference**: Captain Hector Barbossa, mutinous rival captain of the Black Pearl (later a privateer). An ash-grey ornate coat, a wide-brim hat trimmed with dark feathers, curly greying hair and a goatee, a green bandana, and a well-known fondness for eating apples.

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
limbR: 1.0
skin: '#c99a70'
body: '#7a756c'         # ash-grey ornate coat
shoe: '#241f1a'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 1.0
legL: 1.0
footMul: [1, 1, 1]
legColor: '#3a342c'
```

**Accessories**
- `crown` wide flattened cone, ~150mm, `#3a342c` (weathered wide-brim hat) with 2–3 thin angled cone feather details, `#241f1a`/`#5c4630` — raised + tilted back (`rot [0.42,0,0]`).
- `head` sphere cluster, ~60mm, `#8a8378` (curly greying hair) plus a thin band, `#3f5c3a` (green bandana) — the ONE saturated accent.
- `face` small box, `#8a8378` (goatee).
- `chest` small disc, `#a8842e` (ornate vest button/buckle detail).
- `hip` wide box belt + baldric, `#4a3826` leather / `#a8842e` buckle.
- `handR` small sphere, ~35mm, `#4f6b3a` (green apple, signature idle prop — plain shape/color only, no text or logo).

**Silhouette check**: feathered wide-brim hat + ash-grey ornate coat + green bandana accent + apple prop reads as "the flamboyant rival captain," clearly distinct from Jack's black tricorn/red and Elizabeth's sleek black/jade.

**Personality**: `bobMul 1.0, swayMul 0.9, cadenceMul 0.9, ampMul 1.05` (measured, predatory swagger)
**Bubbles**: 🍏🦜⚔️😏

---

### 5. `davyjones` — Cursed Sea Captain (tentacle beard + claw)

**Reference**: Davy Jones, cursed captain of the Flying Dutchman, condemned to a monstrous half-octopus form. A faded pale-blue captain's coat and matching tricorn with a thin gold brim, a beard made of writhing octopus tentacles, a crab claw in place of one hand, and a crab-leg limp.

**Spec**
```
sk: 1.05
headR: 130
headShape: 'sphere'
limbR: 1.0
skin: '#5c6e5c'          # mottled green-grey sea-creature skin
body: '#5c7280'          # faded, wet-darkened pale-blue coat
shoe: '#2a3430'
emI: 0
hands: 'sphere'
eyes: 'slit'              # closest existing preset for an inhuman, unreadable gaze
steel: false
armL: 1.0
legL: 0.95
footMul: [1.1, 1, 1.1]
legColor: '#3a4640'
```

**Accessories**
- `crown` cone, tall, `#5c7280` (faded pale-blue tricorn) with a thin gold edge, `#a8842e` — raised + tilted back (`rot [0.4,0,0]`).
- `face` cluster of 4–5 thin cylinders at varied `rot`, fanning down from the chin, `#7a5c78` → `#4a3a52` (mottled pink-purple tentacle beard) — a straight-segment approximation of the writhing tentacle beard; see Rig gap #1.
- `handR` box+cone combo, `#8a9098`, `metalness 0.6` (a crab claw standing in for the hand) — see Rig gap #2.
- `hip` thin box sash, `#5c1c1c` (dark red sash) — the ONE saturated accent against the cool blue-grey palette.
- `chest` thin box row, `#a8842e` (gold buttonhole trim on the coat).
- `back` flattened cone, `#3a4650` (long coat-tail).

**Silhouette check**: pale faded-blue tricorn + fanning tentacle-beard cluster + a claw where a hand should be reads instantly as "not quite human sea captain" — unmistakable next to the fully-human rest of the cast, even in flat silhouette.

**Personality**: `bobMul 0.8, swayMul 1.1, cadenceMul 0.75, ampMul 0.85` (heavy, dragging crab-leg limp)
**Bubbles**: 🐙💔⚓😠

---

### 6. `tiadalma` — Voodoo Seer (shell jewelry + dreadlocks)

**Reference**: Tia Dalma, mysterious voodoo priestess and jungle shopkeeper (secretly the sea goddess Calypso). Long heavy dreadlocks, a gold-flecked tooth, a layered ragged dark dress with a woven overcoat, and necklaces of shells, bone, and beads.

**Spec**
```
sk: 0.95
headR: 116
headShape: 'sphere'
limbR: 0.85
skin: '#5c4030'          # deep warm brown skin
body: '#3a2e22'          # layered dark ragged dress
shoe: '#241a12'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 0.9
legL: 0.95
footMul: [1, 1, 1]
legColor: '#2e2418'
```

**Accessories**
- `crown` sphere cluster, large ~140mm, `#1c140e` (long heavy dreadlocks).
- `chest` cluster of small discs/spheres, `#e8dcc0` (cowrie shells) + `#a8842e` (bone/brass beads) strung as necklaces — the ONE pale accent against the dark dress.
- `hip` thin cord belt with dangling tassels (thin box + small cone tassels), `#8a6a3a`.
- `back` flattened cone, `#4a3c2c` (woven overcoat drape).
- `face` tiny disc, ~8mm, `#c9a83a` (glint of a gold tooth) — small, subtle, not a decal.

**Silhouette check**: heavy dreadlock mane + layered dark ragged dress + pale shell/bone necklace cluster reads as "the mystic" instantly, clearly distinct from the seafaring-captain silhouettes around her.

**Personality**: `bobMul 0.85, swayMul 1.0, cadenceMul 0.8, ampMul 0.8` (slow, deliberate, otherworldly glide)
**Bubbles**: 🐍🔮🌊💀

---

## Rig gaps

1. **No curved/segmented tentacle accessory.** Davy Jones's beard is approximated with a fan of straight, rigid thin cylinders at varied static `rot` — reads as "tentacle-like" in silhouette but can't curl or writhe. This is the same gap already parked in `docs/ROADMAP.md` § Avatar rig gaps ("Animated appendages: … per-tentacle idle channels") — noting it here as a second, higher-profile use case for that fix rather than proposing a new one.
2. **No pincer/claw accessory shape.** Only `box | sphere | cylinder | cone` primitives exist; Davy Jones's crab claw is approximated with a fused box+cone on `handR`. A dedicated two-piece hinged pincer shape (or an openable box pair) would read far more clearly as a claw than the current fused blob, and would be reusable for any future crustacean/monster pack.
3. **No per-limb shape/length override for asymmetric body modification.** Davy Jones's design gives him one human-ish leg and one crab-like leg (plus the claw hand) — the rig's only per-side leg field is `legColor` (a color, not a shape/length), so the limp is approximated purely through `personality` gait tuning (`cadenceMul`/`ampMul`) rather than an actual asymmetric limb. A per-side `legShape`/`legLScale` override would generalize well beyond this pack (peg legs, prosthetics, injured gaits).

## Sources

- [Dress Like Jack Sparrow Costume Guide — Costume Wall](https://costumewall.com/dress-like-jack-sparrow/)
- [Pirates of the Caribbean Jack Sparrow Costume Guide — FilmsJackets](https://www.filmsjackets.com/blog/pirates-of-the-caribbean-jack-sparrow-costume-guide)
- [Jack Sparrow Costuming — A Pirate's Compendium](https://jacksparrowcostuming.com/wigbandana.htm)
- [Will Turner from Pirates of the Caribbean Costume Guide — Carbon Costume](https://carboncostume.com/will-turner-from-pirates-of-the-caribbean/)
- [The Costumer's Guide to Movie Costumes — Will Turner](http://www.costumersguide.com/potc2_will.shtml)
- [Elizabeth Swann At World's End Pirate King costume (POTC) — The RPF](https://www.therpf.com/forums/threads/elizabeth-swann-at-worlds-end-pirate-king-costume-potc.261221/)
- [PIRATES OF THE CARIBBEAN: THE CURSE OF THE BLACK PEARL — Captain Hector Barbossa's Costume — Propstore](https://propstore.com/product/pirates-of-the-caribbean-the-curse-of-the-black-pearl/captain-hector-barbossas-geoffrey-rush-costume/)
- [Hector Barbossa's pirate hats — Pirates of the Caribbean Wiki (Fandom)](https://pirates.fandom.com/wiki/Hector_Barbossa's_pirate_hats)
- [Davy Jones (Pirates of the Caribbean) — Pirates of the Caribbean Wiki (Fandom)](https://pirates.fandom.com/wiki/Davy_Jones)
- [Davy Jones (Pirates of the Caribbean) — Wikipedia](https://en.wikipedia.org/wiki/Davy_Jones_(Pirates_of_the_Caribbean))
- [Tia Dalma costume references — Costumer's Guide](http://www.costumersguide.com/potc2_tia.shtml)
- [Tia Dalma Cosplay from Pirates of the Caribbean — Melting Mirror](https://www.meltingmirror.ca/tiadalmapotc.html)
