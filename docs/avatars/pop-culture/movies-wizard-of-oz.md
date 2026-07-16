# Avatar Pack: Pop Culture > Movies > The Wizard of Oz

**Path**: Pop Culture / Movies / The Wizard of Oz
**Style**: Stylized geometric toon homage figures in the Diorama Sims-toon rig (primitives + MeshToonMaterial, flat banded shading, dark cartoon outlines, oversized head/hands, green plumbob). This pack evokes the 1939 MGM film's Technicolor Oz silhouettes and palette through **color + shape only** — no textures, no logos, no likenesses. Every member uses a descriptive-generic `label`; the actual character identity lives in the `Reference` line only.

This is the **regeneration-ready source of truth** for the pack's data file. Re-run pack generation from this doc; do not hand-edit the generated data file without updating this doc first.

## Overview

Eight members: the four travelers of the Yellow Brick Road party (Dorothy + her three patchwork/tin/fur companions), the two witch foils (Wicked/Good — a deliberate black-and-green vs. pink-and-gold color contrast pair), the title Wizard himself (folded in for pack-completeness the same way the LOTR pack folded in Boromir — a casual fan absolutely names "the Wizard" when asked about this film), and Toto as the pack's one pet/quadruped. Costume material and one loud signature color carry nearly all the recognition here — body proportions vary less than in an ensemble like Fellowship (only the Lion and the Wizard/Scarecrow read notably bulkier than Dorothy/Glinda/the Witch), so `body`/`legColor`/accessory color choices matter more than `sk` spread.

**Omitted** (background ensemble / one-scene bit parts, not primary cast): the Munchkins (large background ensemble), Auntie Em / Uncle Henry / Miss Almira Gulch (Kansas-frame one-scene characters), the Winkie Guards and Flying Monkeys (henchmen, not named leads), and the Emerald City doorman/carriage-driver/palace-guard bit parts (all the same actor as the Wizard in brief comic cameos — the "Wizard" member below already captures that actor's core role).

**Shared "Emerald City" contrast pairing** — the two witches are deliberately built as color opposites so they read instantly apart even at a glance:

| Swatch | Hex | Use |
|---|---|---|
| Witch black | `#1c1c1c` | Wicked Witch gown, hat, cape |
| Witch green (skin) | `#7a9c5e` | Wicked Witch skin — the signature color |
| Good-witch pink | `#f5c8dc` | Glinda's gown |
| Good-witch gold | `#d8c078` | Glinda's tiara/wand trim |
| Kansas gingham blue | `#4a6fa5` | Dorothy's dress |
| Ruby accent | `#c81e2c` | Dorothy's slippers — the ONE hot-saturated accent on an otherwise muted Kansas character |
| Straw/burlap brown | `#7a5c3a` | Scarecrow costume |
| Tin silver | `#b0b8be` | Tin Man body |
| Tawny mane | `#a8763a` | Cowardly Lion mane/coat |

**Pack-wide base spec** (start every member here, then diff):
```
emI: 0            # no emissive by default — only Glinda's sparkle gown and the Tin
                   # Man's small heart-medallion accent deviate
hands: 'sphere'
steel: false       # only the Tin Man flips this
headShape: 'sphere'
```

Every member carries a small **tint** accessory (hair ribbon, patchwork patch, shoulder rivet, tail tuft, cloak lining, tiara gem, collar, cravat) so per-sensor color coding survives even on fixed-costume-color characters — see each member's Accessories.

---

## Members

### 1. `dorothy` — "Farm Girl (blue gingham + ruby shoes)"

**Reference**: Dorothy Gale, the Kansas farm girl swept to Oz. Blue-and-white checked gingham pinafore over a cream puff-sleeve blouse, hair in two braids tied with blue ribbons, and (the film's signature addition over the books' silver) sequined ruby-red slippers.

**Spec**
```
sk: 0.85
headR: 116
headShape: 'sphere'
limbR: 0.9
skin: '#e8b48c'
body: '#4a6fa5'          # blue gingham pinafore/dress
shoe: '#c81e2c'          # ruby slippers — the ONE hot-saturated accent
emI: 0
hands: 'sphere'
eyes: 'dots'
steel: false
armL: 0.95
legL: 0.9
legColor: '#4a6fa5'       # dress hem reads as legs, same gingham blue
limbColors: { armL: '#f0ead8', armR: '#f0ead8' }   # cream puff-sleeve blouse
```

**Accessories**
- `crown` sphere, ~72mm, `#6b4226` (brown hair, center-parted).
- `head` two small cylinders each side (braids), `#6b4226`, hanging past the shoulder.
- `head` (second pair) tiny box ribbons at the braid ends, `'tint'` — the tint carrier.
- `chest` box, ~90×70×10mm, `#f0ead8` (white pinafore bib, proud of the blue dress beneath).
- `hip` thin box (apron waistband), `#f0ead8`.

**Silhouette check**: blue-check dress + white pinafore bib + bright red shoes + braids reads as Dorothy instantly; the gingham CHECK pattern itself doesn't render (flat blue stands in for it — see Rig gap #2), but the color block + braids + red-shoe accent carries the read at 30px regardless.

**Personality**: `bobMul 1.0, swayMul 0.9, cadenceMul 1.05, ampMul 0.9` (an ordinary, slightly wide-eyed farm-girl walk)
**Bubbles**: 🏠 🌪️ 👠 🐕

---

### 2. `scarecrow` — "Scarecrow (patchwork burlap + straw)"

**Reference**: The Scarecrow, a straw-stuffed farmhand who wants a brain. Brown patchwork burlap costume loosely stuffed with straw, a wide floppy pointed hat, straw poking from the collar/cuffs, and a signature loose, boneless, floppy-limbed stance and gait.

**Spec**
```
sk: 1.0
headR: 128
headShape: 'sphere'
limbR: 0.8
skin: '#c9a876'          # burlap-sack "face"
body: '#7a5c3a'          # patchwork burlap
shoe: '#4a3826'
emI: 0
hands: 'sphere'
eyes: 'dots'
steel: false
armL: 1.1                # long, loose, floppy limbs
legL: 1.05
footMul: [1.2, 0.7, 1.15]
legColor: '#6b4a2e'
```

**Accessories**
- `crown` flattened wide cone, ~170mm, `#5c4526` (floppy-brim straw hat), raised + tilted back per the crown-clearance convention so the brim clears the brow.
- `crown` (second primitive) a scatter of 3 thin yellow cones, ~40mm, `#d9c07a` (straw wisps poking out from under the hat brim).
- `neck` small cluster of thin cylinders, `#e0c878` (straw at the collar).
- `handL`/`handR` small cone tufts, `#e0c878` (straw at the cuffs).
- `chest` box patch, ~70×70×6mm, `'tint'` (a mismatched patchwork square — the tint carrier; patchwork scraps of any color is the costume's own visual joke, so a tint patch reads as diegetic, not off-model).

**Silhouette check**: floppy wide-brim hat + straw wisps at every joint + patchwork brown reads as Scarecrow at a glance; the *floppy, boneless* posture is the character's other defining trait and is only partially reachable — see Rig gap #1.

**Personality**: `bobMul 1.3, swayMul 1.5, cadenceMul 0.95, ampMul 1.2` (loose, wobbly, floppy-limbed shamble)
**Bubbles**: 🌾 🧠 🔥 🤔

---

### 3. `tin_man` — "Tin Woodman (silver funnel hat + axe)"

**Reference**: The Tin Woodman, a man made entirely of tin who wants a heart. Full silver/tin body and limbs, a tall silver funnel-shaped hat, stiff rigid joints (he rusts and seizes up), and carries an axe.

**Spec**
```
sk: 1.0
headR: 120
headShape: 'sphere'
limbR: 1.0
skin: '#b8c0c6'          # tin body doubles as "skin"
body: '#b0b8be'
shoe: '#8f979d'
emI: 0
hands: 'box'              # rigid, mechanical-feeling hands
eyes: 'dots'
steel: true                # brushed-metal material flag
armL: 1.0
legL: 1.0
legColor: '#a8b0b6'
```

**Accessories**
- `crown` cone, tall (~190mm), `#c0c6ca` (silver funnel hat, flat-brimmed), raised + tilted back for brow clearance like any crown/dome accessory.
- `neck` thin cylinder collar ring, `'tint'` — the tint carrier (a colored trim ring is a plausible "polished/repainted" detail on an otherwise all-silver body).
- `chest` small flattened disc, ~50mm, `#c0392b` (the heart he doesn't have yet — approximated as a red disc; see Rig gap #3).
- `hand` long thin cylinder + box (axe), blade `#d8dce0` / handle `#5c3c22`.
- `hip` small cylinder (oil can), `#8a9296`, with a tiny cone spout.

**Silhouette check**: solid silver body + tall funnel hat + rigid stiff-armed stance + axe is unmistakable even before any face detail. No hard gaps beyond the heart-shape approximation.

**Personality**: `bobMul 0.7, swayMul 0.35, cadenceMul 0.85, ampMul 0.65` (stiff, creaky, rust-jointed gait)
**Bubbles**: ❤️ 🪓 🛢️ 😢

---

### 4. `cowardly_lion` — "Cowardly Lion (mane + red bow)"

**Reference**: The Cowardly Lion, an anthropomorphic lion who wants courage. Bipedal throughout the film — a big tawny mane and fur suit, a red bow tied into the mane, a tufted tail, and a timid, easily-startled manner despite the fearsome look.

**Spec**
```
sk: 1.05
headR: 148
headShape: 'sphere'
limbR: 1.25
skin: '#c9974f'          # tawny fur doubles as "skin"
body: '#c9974f'
shoe: '#8a6430'
emI: 0
hands: 'sphere'
eyes: 'dots'
steel: false
armL: 0.95
legL: 0.9
legColor: '#b8863f'
```

**Accessories**
- `crown` large sphere, ~180mm, `#a8763a` (big tawny mane, surrounds the head).
- `crown` (second primitive) a ring of 5 small cone tufts, ~35mm, `#8a6430` (shaggy mane spikes for a less-perfectly-round silhouette).
- `neck` small box, ~40×30×10mm, `#c0392b` (the signature red bow, tied into the mane) — the ONE hot-saturated accent against the tawny fur.
- `tailbone` cone + sphere tuft, coat-color cone with a `'tint'` tuft ball at the tip — the tint carrier.
- `head` two small cone ear tips, `#8a6430`, tucked into the mane silhouette.

**Silhouette check**: huge tawny mane + red bow + fur-toned build reads as "lion" instantly; the timid, cringing body language is the character's other core trait and only partly reachable through gait multipliers alone.

**Personality**: `bobMul 1.15, swayMul 1.4, cadenceMul 0.8, ampMul 0.75` (skittish, shrinking, mane-swaying shuffle)
**Bubbles**: 😱 🦁 😢 💪

---

### 5. `wicked_witch` — "Wicked Witch (black robes + broom)"

**Reference**: The Wicked Witch of the West. Green skin, an all-black Victorian gown with a caped train, a tall black pointed hat with a black scarf wound at the base, and a broomstick — melts on contact with water.

**Spec**
```
sk: 1.0
headR: 118
headShape: 'sphere'
limbR: 0.85
skin: '#7a9c5e'          # green skin — the signature color
body: '#1c1c1c'          # black gown
shoe: '#141414'
emI: 0
hands: 'sphere'
eyes: 'slit'
steel: false
armL: 1.0
legL: 1.0
legColor: '#1c1c1c'
```

**Accessories**
- `crown` tall cone, ~200mm, `#181818` (black pointed witch hat), raised + tilted back for brow clearance.
- `crown` (second primitive) thin cylinder band wrapped at the hat base, `#2a2a2a` (the black scarf detail).
- `back` flattened cone, `#202020` (caped train), with a thin proud edge strip, `'tint'` — the tint carrier (a colored cloak lining hint).
- `hand` long thin cylinder (broomstick), `#4a3320` wood, with a wide flat cone bristle bundle, `#7a6030`, at the end.
- `face` small sphere wart, ~10mm, `#5c7a48` (darker green, on the chin/nose).

**Silhouette check**: green skin against all-black pointed hat + gown + broom is unmistakable at any distance — the pack's clearest silhouette, and the deliberate color opposite of Glinda below.

**Personality**: `bobMul 0.95, swayMul 0.65, cadenceMul 1.15, ampMul 0.9` (brisk, cackling, purposeful stride)
**Bubbles**: 🧹 😈 🔥 💧

---

### 6. `glinda` — "Good Witch (pink gown + star wand)"

**Reference**: Glinda the Good Witch of the North. An elegant blonde witch in a sparkling pale-pink gown sprinkled with stars/crystals, a translucent crown, and a star-tipped wand — arrives and departs inside a floating bubble.

**Spec**
```
sk: 1.0
headR: 118
headShape: 'sphere'
limbR: 0.85
skin: '#f0d0b0'
body: '#f5c8dc'          # sparkling pale-pink gown — the signature color
shoe: '#f0d8e0'
emI: 0.08                 # subtle sparkle glow, the pack's one emissive exception
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 1.0
legL: 1.0
legColor: '#f5c8dc'
```

**Accessories**
- `crown` sphere, ~150mm, `#e8c878` (long blonde hair).
- `head` thin cylinder tiara band, `#d8c078` (gold), worn low over the brow.
- `head` (second primitive) 3 tiny sphere gems on the tiara, `'tint'` — the tint carrier.
- `back` flattened wide cone, `#f8d8e8` (pale sheer cape drape, hints at the gown's train/wings).
- `hand` thin long cylinder (wand), `#e8d8a0` gold, with a small cone star tip, `#fff2b0`, `emissive: '#fff2b0'`, `emissiveIntensity: 0.3`.

**Silhouette check**: pale pink sparkling gown + blonde hair + gold tiara + glowing star wand reads as "good witch" clearly, and contrasts sharply with the Wicked Witch's black-and-green — the pair is designed to be told apart instantly even in silhouette alone.

**Personality**: `bobMul 0.7, swayMul 0.5, cadenceMul 0.9, ampMul 0.75` (graceful, floating glide)
**Bubbles**: ✨ 🎀 🌟 💗

---

### 7. `toto` — "Terrier (Toto)" *(pet, quadruped)*

**Reference**: Toto, Dorothy's small dog and constant companion — played in the 1939 film by a female Cairn Terrier named Terry. A small, shaggy, dark-coated terrier, perpetually at Dorothy's side or riding in her basket.

**Spec**
```
sk: 0.4
bodyLen: 300
bodyW: 130
bodyH: 130
legLen: 0.5
headR: 74
ears: 'pointy'
tail: 'up'
tailLen: 0.35
snout: 0.55
coat: '#3a3226'          # dark shaggy terrier coat
belly: '#4a4030'
earColor: '#2a2418'
snoutColor: '#2a2418'
pawColor: '#2a2418'
```

**Accessories**
- `qneck` thin box collar, `'tint'` — the tint carrier (also the natural place to read "this is somebody's pet," matching Dorothy's identity color).

**Silhouette check**: small size + shaggy dark coat + perky pointed ears + upright tail reads as a small terrier instantly, and (staying close at Dorothy's leg) reads as specifically HER dog in context.

**Personality**: `bobMul 1.4, swayMul 0.8, cadenceMul 1.6, ampMul 1.0` (quick trotting small-dog gait)
**Bubbles**: 🐾 🦴 🐕 ❤️

---

### 8. `wizard` — "Traveling Showman (top hat + tailcoat)"

**Reference note**: The Wizard of Oz himself — also, in the Kansas frame, the carnival huckster "Professor Marvel" (same actor/role, revealed as the humbug "man behind the curtain"). Included for pack-completeness as the title character. A portly, kindly con man in a shabby-genteel black Prince Albert tailcoat with a velvet collar, waistcoat, cravat, and a tall silk top hat.

**Spec**
```
sk: 1.05
headR: 130
headShape: 'sphere'
limbR: 1.15
skin: '#d9a878'
body: '#2b2420'          # worn black Prince Albert coat
shoe: '#241e1a'
emI: 0
hands: 'sphere'
eyes: 'dots'
steel: false
armL: 1.0
legL: 0.95
legColor: '#3a332c'       # dark trousers
```

**Accessories**
- `crown` cylinder, ~150mm tall, `#1c1a18` (tall silk top hat), raised + tilted back for brow clearance.
- `neck` small box, `'tint'` (cravat/bow tie — the tint carrier).
- `chest` thin box vest peek, `#8a7a5c` (tan waistcoat under the coat), with a small thin gold cylinder (pocket-watch chain), `#c9a227`.
- `back` flattened box, `#241e1a` (coat tails, hanging past the hip line like a tailcoat).

**Silhouette check**: portly build + tall top hat + dark tailcoat with tails reads as a Victorian-era showman/huckster archetype; paired in-scene with the other six unmistakably-Oz silhouettes, the context sells "the Wizard" even though the top-hat-and-tailcoat shape alone is a generic showman read — see Rig gap #4.

**Personality**: `bobMul 1.1, swayMul 1.1, cadenceMul 0.95, ampMul 1.0` (blustery, self-important stride)
**Bubbles**: 🎩 🎈 🐍 😅

---

## Rig gaps

(Checked against `docs/ROADMAP.md` § "Avatar rig gaps" first — the existing parked list already covers fabric patterns/prints/decals, extra eye styles, additional limb anchors, and pattern/scatter generators, so those are NOT repeated below. Only genuinely new gaps this pack surfaced:)

1. **No floppy/loose-joint personality trait distinct from bob/sway/cadence/amp multipliers.** The Scarecrow's defining trait is boneless, floppy-limbed looseness at ALL times (including standing still), not just an exaggerated walk. The existing `personality` multipliers (used here at high `swayMul`/`ampMul`) only affect the walk cycle, so an idle Scarecrow still stands with normal posture. A per-member "joint slack" trait (small continuous limb-sway noise independent of gait phase) would fix this and would generalize to any floppy/rag-doll/marionette-style character.
2. **No fabric-check/gingham pattern.** Dorothy's dress is specifically defined by its blue-and-white CHECK pattern, not a flat blue — this falls under the already-parked "fabric patterns/prints" gap (ROADMAP), flagged here just to confirm it's the same gap, not a new one.
3. **No heart-shape accessory primitive.** Only `box`/`sphere`/`cylinder`/`cone` exist; the Tin Man's signature heart medallion is approximated with a flattened red disc (sphere squashed on one axis). A `heart` primitive (two overlapping half-spheres over a wedge, or a lathe shape) would be broadly reusable for any love/heart iconography, not just this pack.
4. **No glitter/sparkle speckle material.** Glinda's gown is specifically described as crystal-and-star-sprinkled tulle, and Dorothy's ruby slippers are famously sequined — both are approximated here with a flat saturated color (plus a touch of `emI` on Glinda only). A stippled/speckle emissive-scatter material (small random bright flecks over a base color) would sell "sparkly/sequined" far better than flat color + glow alone, and would be reusable for any bejeweled/sequined/glittery costume in future packs.

## Sources

- [Gingham dress of Judy Garland — Wikipedia](https://en.wikipedia.org/wiki/Gingham_dress_of_Judy_Garland)
- [The History of Dorothy Gale Costumes — HalloweenCostumes.com Blog](https://www.halloweencostumes.com/blog/p-280-the-history-of-dorothy-gale-costumes.aspx)
- [Remember when Judy Garland wore a gingham pinafore in "The Wizard of Oz"? — CNN](https://www.cnn.com/style/article/judy-garland-remember-when)
- [Scarecrow Costume — Smithsonian Institution](https://www.si.edu/collections/snapshot/scarecrow-costume)
- [Scarecrow Hat from The Wizard of Oz — Smithsonian Institution](https://www.si.edu/object/scarecrow-hat-wizard-oz:nmah_1349614)
- [The Costume Quirks of The Wizard Of Oz (1939) — The Cinema History Blog](https://www.cinemahistory.co.uk/the-costume-quirks-of-the-wizard-of-oz/)
- [Tin Man Silver Funnel Hat — Arlene's Costumes](https://arlenescostumes.com/products/funnel-hat-wizard-of-oz-tin-man-silver-costume-accessory-adult-teen)
- [Tin Man Funnel Hat — Norcostco](https://norcostco.com/tinman-hat/)
- [Cowardly Lion's Mane worn by Bert Lahr in The Wizard of Oz (1939) — Academy Museum](https://www.academymuseum.org/en/collection/lions-mane-from-the-wizard-of-oz)
- [Cowardly Lion — Wikipedia](https://en.wikipedia.org/wiki/Cowardly_Lion)
- [The cowardly lion costume in The Wizard of Oz was made from real lion fur — The Vintage News](https://www.thevintagenews.com/2016/09/05/priority-cowardly-lion-costume-wizard-oz-made-real-lion-fur/)
- [Wicked Witch of the West — Wikipedia](https://en.wikipedia.org/wiki/Wicked_Witch_of_the_West)
- [Wicked Witch of the West from The Wizard of Oz Costume Guide — Carbon Costume](https://carboncostume.com/wicked-witch-of-the-west-from-the-wizard-of-oz/)
- [The Real Reason the Wicked Witch of the West Is Green — HISTORY](https://www.history.com/articles/wicked-witch-wizard-oz-movie-technicolor-green)
- [Glinda the Good Witch Part 1 — Costume Breakdowns](https://costumebreakdowns.wordpress.com/2014/03/03/glinda-the-good-witch/)
- [Behind the Dress: Glinda in "The Wizard of Oz" (1939) — Phyllis Loves Classic Movies](https://phyllislovesclassicmovies.blogspot.com/2016/04/behind-dress-glinda-in-wizard-of-oz-1939.html)
- [Toto (Oz) — Wikipedia](https://en.wikipedia.org/wiki/Toto_(Oz))
- [Terry (dog) — Wikipedia](https://en.wikipedia.org/wiki/Terry_(dog))
- [The Real Story of Toto From the Wizard of Oz (aka Terry) — Dogster](https://www.dogster.com/lifestyle/toto-wizard-of-oz/)
- [Did a Coat Used by Prof. Marvel in 'The Wizard of Oz' Belong to L. Frank Baum? — Snopes.com](https://www.snopes.com/fact-check/coat-of-baums/)
- [This Actor Played Five Separate Roles In The Wizard Of Oz — SlashFilm](https://www.slashfilm.com/670626/this-actor-played-five-separate-roles-in-the-wizard-of-oz/)
- [FRANK MORGAN: CHARACTER ACTOR — Ron Fassler / Medium](https://ronfassler.medium.com/frank-morgan-1890-1949-in-full-makeup-including-wig-false-eyebrows-and-cheeks-as-the-wonderful-f674771b532e)
