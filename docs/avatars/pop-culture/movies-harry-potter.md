# Avatar Pack: Pop Culture > Movies > Harry Potter

**Path**: Pop Culture / Movies / Harry Potter
**Style**: Stylized geometric toon homage figures in the Diorama Sims-toon rig (primitives + MeshToonMaterial, flat banded shading, dark cartoon outlines, oversized head/hands, green plumbob). This pack evokes the film series' silhouettes and palette through **color + shape only** — no house-crest artwork, no logos, no likenesses. Every member uses a descriptive-generic `label`; the actual character identity lives in the `Reference` line only.

This is the **regeneration-ready source of truth** for the pack's data file. Re-run pack generation from this doc; do not hand-edit the generated data file without updating this doc first.

## Overview

The primary cast splits cleanly into three silhouette tiers, which is exactly the kind of variety the rig rewards: three teenage students at reduced scale (`sk 0.85–0.95`), three full-adult professors/villains (`sk 1.0–1.05`), and one towering half-giant (`sk 1.55`, the largest humanoid scale precedent shipped so far is `sk 1.6` for a boss-scale quadruped in `metroid.md` — the same lever applied to a humanoid here). Hair silhouette does most of the recognition work across this cast far more than in most packs: bushy (Hermione), flat-slicked (Draco), messy-black (Harry), bright-red (Ron), long-silver-bearded (Dumbledore), flat-black-parted (Snape), wild-and-huge (Hagrid), absent (Voldemort) — eight members, eight distinct hair/head reads, no two overlapping even before costume color is considered.

**Member selection**: the surveyed eight — Harry Potter, Hermione Granger, Ron Weasley, Albus Dumbledore, Severus Snape, Rubeus Hagrid, Lord Voldemort, Draco Malfoy — are confirmed as the primary cast a casual fan names first (the golden trio, the two most iconic Hogwarts staff, the two most iconic antagonists) and kept as-is; no trims or additions needed. Deliberately omitted as secondary/ensemble despite franchise prominence: Neville Longbottom, Luna Lovegood, Ginny Weasley, Minerva McGonagall, Sirius Black, Dobby, Bellatrix Lestrange — strong recognizability but a rung below the surveyed eight, and adding any would push past the ~12-member ceiling without a sub-series split the franchise doesn't need (unlike Star Trek TNG/DS9, there's no natural second "series" to carve off here).

**Shared "Hogwarts" palette** — most costumes are black-based, so each member gets exactly ONE saturated house-color accent (tie/trim) to carry house identity without any two black-robed members reading as identical blobs at 30px:

| Swatch | Hex | Use |
|---|---|---|
| Gryffindor scarlet | `#740001` | Harry/Hermione/Ron tie stripe |
| Gryffindor gold | `#eeba30` | tie stripe (paired with scarlet) |
| Slytherin green | `#1a472a` | Draco tie/trim |
| Slytherin silver | `#aaaaaa` | Draco tie/trim (paired with green) |
| Hogwarts black robe | `#1c1c1e` | base robe color, most members |
| Wand wood | `#4a3826` | every wand prop |

**Pack-wide base spec** (start every member here, then diff):
```
body: '#1c1c1e'      # black Hogwarts robe — most members diff from this
headShape: 'sphere'
hands: 'sphere'
steel: false          # buckles/wand tips read through accessory color, not a metallic body flag
emI: 0
```
Voldemort and Snape diff to darker near-black variants of the base to read as more severe/inhuman than the students' plain black robes; Dumbledore and Hagrid diff away from black entirely (violet, moleskin brown).

---

## Members

### 1. `hp-harry` — Bespectacled Student Wizard (scarlet-gold tie)

**Reference**: Harry Potter, the series protagonist and Gryffindor student. Black messy hair, round wire-frame glasses, a lightning-bolt scar on his forehead, black school robe over a grey jumper with a scarlet-and-gold Gryffindor tie.

**Spec**
```
sk: 0.88
headR: 116
headShape: 'sphere'
limbR: 0.85
skin: '#e8b48c'
body: '#1c1c1e'        # black school robe
shoe: '#241e1a'
emI: 0
hands: 'sphere'
eyes: 'dots'
steel: false
armL: 0.95
legL: 0.95
footMul: [1, 1, 1]
legColor: '#3a3a3a'    # grey school trousers
```

**Accessories**
- `crown` small messy sphere cluster, ~85mm, `#16130f` (jet-black tousled hair).
- `face` thin flattened ring/box, ~30mm, `#201c18` (round wire-frame glasses), sitting directly over the eye band, 3mm proud.
- `face` tiny bent box, ~10mm, `#7a4a30` (lightning-bolt scar) on the forehead, 3mm proud.
- `chest` thin diagonal stripe box, ~40mm, alternating `#740001`/`#eeba30` (Gryffindor tie) — the ONE saturated accent.
- `back` flattened cone, `#1c1c1e` (robe drape, plain — not the largest in the pack, unlike Snape's).

**Silhouette check**: round glasses + lightning scar + black messy hair + scarlet-gold tie reads as Harry even though the black robe alone is shared with Ron and Hermione. The glasses/scar pairing is the primary recognizer. Rig gap: no dedicated eyewear anchor (see Rig gap #1).

**Personality**: `bobMul 1.0, swayMul 0.9, cadenceMul 1.0, ampMul 0.95`
**Bubbles**: ⚡ 🦉 📖 😳

---

### 2. `hp-hermione` — Studious Witch (bushy hair, scarlet-gold tie)

**Reference**: Hermione Granger, top-of-class Gryffindor student. Famously bushy brown hair, black school robe over a grey pleated skirt, scarlet-gold tie, rarely seen without a book.

**Spec**
```
sk: 0.85
headR: 112
headShape: 'sphere'
limbR: 0.8
skin: '#e6bd98'
body: '#1c1c1e'
shoe: '#201c18'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 0.9
legL: 0.9
footMul: [1, 1, 1]
legColor: '#8a8a86'    # grey pleated skirt reading as legs
```

**Accessories**
- `crown` large voluminous sphere cluster, ~120mm, `#4a3320` (bushy brown hair) — the primary recognizer, deliberately the widest/roundest hair silhouette in the pack.
- `chest` thin diagonal stripe box, `#740001`/`#eeba30` (tie).
- `hand` small flat box, ~40mm, `#d8d0b8` (held book), optional idle prop.
- `back` flattened cone, `#1c1c1e` (robe).

**Silhouette check**: the wide bushy-hair silhouette plus a held book plus tie distinguishes her instantly from Harry's/Ron's flatter hair. No new gaps.

**Personality**: `bobMul 0.95, swayMul 0.85, cadenceMul 1.15, ampMul 0.95` (brisk, purposeful)
**Bubbles**: 📚 ✋ 🔮 😤

---

### 3. `hp-ron` — Tall Freckled Wizard (maroon sweater)

**Reference**: Ron Weasley, Harry's best friend. Tall and lanky, bright red hair, freckles, a hand-knit maroon jumper worn under an open black school robe, scarlet-gold tie.

**Spec**
```
sk: 0.95
headR: 116
headShape: 'sphere'
limbR: 0.8
skin: '#f0c8a0'
body: '#7a1f1f'        # maroon hand-knit sweater, visible under the open robe
shoe: '#241e1a'
emI: 0
hands: 'sphere'
eyes: 'dots'
steel: false
armL: 1.05             # lanky long limbs
legL: 1.1
footMul: [1.1, 1, 1.1]
legColor: '#3a3a3a'
```

**Accessories**
- `crown` sphere, ~85mm, `#c94a1e` (bright red-orange hair).
- `face` tiny scattered dot cluster, ~4mm each, `#b5723a` (freckles across the cheeks) — an approximation, low proud offset.
- `chest` thin diagonal stripe box, `#740001`/`#eeba30` (tie), small, worn over the sweater.
- `back` flattened cone, `#1c1c1e` (robe worn open/loose, not buttoned like Harry's).

**Silhouette check**: bright red hair + tall lanky proportions (`armL 1.05` / `legL 1.1`, the longest limbs among the students) + maroon sweater instantly separates Ron from the rest of the black-robed cast. No new gaps beyond the freckle-dot approximation (already covered by the parked "no pattern/scatter generator" item).

**Personality**: `bobMul 1.1, swayMul 1.15, cadenceMul 0.95, ampMul 1.05` (loose, gangly stride)
**Bubbles**: ♟️ 🍫 🕷️ 😨

---

### 4. `hp-headmaster` — Elder Headmaster (violet robes, silver beard)

**Reference**: Albus Dumbledore, Hogwarts headmaster. Long silver hair and beard, half-moon spectacles, flowing violet robes and a tall pointed hat, carries an ornate wand.

**Spec**
```
sk: 1.05
headR: 128
headShape: 'sphere'
limbR: 0.9
skin: '#d8b48c'
body: '#4a2e6e'        # deep violet robe
shoe: '#3a2a1a'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 1.0
legL: 1.0
footMul: [1, 1, 1]
legColor: '#4a2e6e'
```

**Accessories**
- `crown` tall cone, ~190mm, `#3a2258` (pointed violet wizard hat) — raised + tilted back so the brim clears the brow, same rule as any dome/hat accessory.
- `face` long box + two thin trailing cylinders, ~140mm, `#e8e8e0` (long silver beard, past the chest).
- `face` (second primitive) thin flattened ring, ~28mm, `#d8b84a` (half-moon spectacles, gold frame) — sits lower on the nose than Harry's round frames, per the "half-moon" read.
- `hip` thin cylinder belt, `#6b4a2e`.
- `hand` long thin cylinder (wand), `#4a3826` wood, small sphere cap `#cfd8e0`, `emI: 0.15` (faint glow).

**Silhouette check**: violet pointed hat + waist-length silver beard + wand instantly reads as "wizened elder wizard," distinct from Voldemort's bald black look and Snape's stern black robe. No new gaps.

**Personality**: `bobMul 0.9, swayMul 0.75, cadenceMul 0.85, ampMul 0.9` (measured, deliberate elder gait)
**Bubbles**: 🍬 ⭐ 🕊️ 😌

---

### 5. `hp-professor` — Stern Potions Master (black billowing robes)

**Reference**: Severus Snape, Potions professor. Pale, sallow skin, long straight black hair framing a gaunt face, severe all-black dress, floor-length robes famous for "billowing" as he moves.

**Spec**
```
sk: 1.0
headR: 120
headShape: 'sphere'
limbR: 0.85
skin: '#d8c4a8'        # pale/sallow
body: '#141414'        # near-black — more austere than the pack base
shoe: '#0f0f0f'
emI: 0
hands: 'sphere'
eyes: 'slit'            # narrow, appraising
steel: false
armL: 1.0
legL: 1.0
footMul: [1, 1, 1]
legColor: '#141414'
```

**Accessories**
- `crown` flat sphere, ~80mm, `#0d0d0d` (straight black hair, center part, framing the face).
- `face` thin box, `#0d0d0d` (hair strands falling past the jaw on both sides) — reinforces the flat "curtain" hair read.
- `back` large flattened cone, the LONGEST back-drape in the pack (past knee), `#101010` (billowing black robe) — the primary silhouette-defining shape, deliberately oversized to sell "billowing."
- `chest` thin vertical row of small button boxes, `#2a2a2a` (severe high-buttoned coat front).

**Silhouette check**: near-black-on-black palette + oversized billowing back-cone + flat center-parted hair reads as a severe, looming figure at 30px, distinct from Voldemort (paler skin, no hair) and Dumbledore (violet, bearded). Rig gap: the cloak is a static shape with no cloth-flutter motion (see Rig gap #3).

**Personality**: `bobMul 0.7, swayMul 0.5, cadenceMul 1.05, ampMul 0.8` (minimal bob, gliding stride)
**Bubbles**: 🧪 🐍 😒 🤫

---

### 6. `hp-groundskeeper` — Towering Groundskeeper (wild beard, moleskin coat)

**Reference**: Rubeus Hagrid, Hogwarts Keeper of Keys and Grounds, a half-giant. Towering height and bulk, an enormous wild black beard and hair, a huge shaggy moleskin overcoat, carries a pink umbrella as his wand-substitute.

**Spec**
```
sk: 1.55
headR: 150
headShape: 'sphere'
limbR: 1.5
skin: '#c9976e'
body: '#3a2e22'        # heavy moleskin overcoat, dark brown
shoe: '#241a10'
emI: 0
hands: 'sphere'
eyes: 'dots'
steel: false
armL: 1.1
legL: 0.9              # proportionally shorter legs under a huge torso — bulk, not height alone
footMul: [1.4, 1.2, 1.4]
legColor: '#241a10'
```

**Accessories**
- `crown` large shaggy sphere cluster, ~150mm, `#1c1712` (wild black hair).
- `face` large box + two thick trailing cylinders, ~170mm, `#1c1712` (huge tangled beard, covers most of the lower face) — the primary recognizer alongside sheer scale.
- `back` flattened cone, `#2e2418` (overcoat drape, extra bulk).
- `hand` long thin cylinder, ~260mm, `#d05a8a` (pink umbrella, his wand stand-in) with a small sphere tip, `#e8a0c0`.
- `hip` wide box belt, `#1c1410`.

**Silhouette check**: sheer scale (`sk 1.55`, dwarfing every other member) + the huge black beard swallowing the lower face + the incongruous pink-umbrella prop reads instantly, even in flat silhouette. No new gaps — scale plus facial-hair coverage do the work.

**Personality**: `bobMul 1.3, swayMul 1.15, cadenceMul 0.8, ampMul 1.2` (heavy, ground-shaking gait)
**Bubbles**: 🐉 🍮 🕷️ 😢

---

### 7. `hp-darklord` — Serpentine Dark Sorcerer (bald, crimson eyes)

**Reference**: Lord Voldemort, the series' primary antagonist. Chalk-white skin, no nose (flat with slit nostrils), bald, glowing red eyes, tall and skeletally thin, always in flowing black robes.

**Spec**
```
sk: 1.05
headR: 122
headShape: 'sphere'
limbR: 0.65             # skeletally thin
skin: '#e8e4e0'          # chalk-white
body: '#0d0d0d'          # black robe, darkest in the pack
shoe: '#0a0a0a'
emI: 0
hands: 'sphere'
eyes: 'redvisor'         # closest existing preset to glowing crimson eyes — the primary recognizer
steel: false
armL: 1.1                # unnaturally long spindly arms
legL: 1.05
footMul: [0.9, 1, 0.9]
legColor: '#0d0d0d'
noFace: true             # bald + noseless + lipless — the absence IS the read
```

**Accessories**
- `back` large flattened cone, the longest robe-drape in the pack, `#0a0a0a` (floor-length black robe).
- `hand` thin long cylinder (wand), `#2a2018` wood, small pale sphere tip, `#e8e4e0`.
- `chest` thin box collar detail, `#1a1a1a` (high stiff robe collar).

No `crown` (bald), no separate facial-hair accessory — the design intentionally omits nose/mouth (`noFace`) for the "not quite human" read, leaning on the glowing-red `redvisor` eyes as the primary tell.

**Silhouette check**: chalk-white skin against all-black robe + glowing red visor-eyes + the absent nose/hair reads as inhuman and menacing even at 30px, sharply distinct from every other (warmer-skinned, haired) member. Rig gap: `noFace` removes nose+mouth+brows as one bundle, with no way to keep an expressive mouth while omitting only the nose (see Rig gap #2).

**Personality**: `bobMul 0.6, swayMul 0.55, cadenceMul 0.8, ampMul 0.75` (slow, deliberate, gliding menace)
**Bubbles**: 🐍 💀 🌑 😈

---

### 8. `hp-rival` — Slicked-Blonde Rival Wizard (green-silver trim)

**Reference**: Draco Malfoy, Harry's Slytherin rival. Platinum-blonde hair slicked back tight, pale pointed features, black school robe with Slytherin green-and-silver tie, perpetually smug bearing.

**Spec**
```
sk: 0.87
headR: 114
headShape: 'sphere'
limbR: 0.8
skin: '#efd9c0'
body: '#1c1c1e'
shoe: '#201c18'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 0.95
legL: 0.95
footMul: [1, 1, 1]
legColor: '#3a3a3a'
```

**Accessories**
- `crown` flat close sphere, ~78mm, `#e8dfa0` (platinum-blonde hair, slicked back tight to the skull) — the primary recognizer, deliberately the FLATTEST hair silhouette in the pack (opposite of Hermione's/Hagrid's volume).
- `chest` thin diagonal stripe box, `#1a472a`/`#aaaaaa` (Slytherin green-silver tie) — the ONE saturated accent against all-black.
- `back` flattened cone, `#1c1c1e` (robe).
- `hand` thin long cylinder (wand), `#4a3826`.

**Silhouette check**: tight platinum-slicked hair (flat, no volume) + green-silver tie against black reads as the Slytherin rival at a glance, and the flat-hair silhouette alone rules out every other member (all of whom have some hair volume or none at all). No new gaps.

**Personality**: `bobMul 1.0, swayMul 1.2, cadenceMul 0.95, ampMul 0.9` (smug, swaggering strut)
**Bubbles**: 🐍 💰 😏 🙄

---

## Rig gaps

1. **No dedicated eyewear/glasses anchor.** Harry's round wire-frames and Dumbledore's half-moon spectacles are both approximated via a thin flattened ring/box accessory bolted onto the `face` anchor, positioned by hand over the eye band. It reads fine at 30px but there's no first-class "glasses" concept distinct from the generic `face` accessory family — a dedicated eyewear anchor (small ring shape, auto-positioned relative to `eyes`) would generalize cleanly to any future bespectacled character.
2. **`noFace` is all-or-nothing.** It currently removes nose + mouth + brows as a single bundle. Voldemort's design goal — a noseless, lipless face — happens to want exactly that, but a character who needs only ONE of the three removed (e.g. a noseless-but-expressive face, or a mouth-only removal for a masked/muzzled look) has no way to do that today. Splitting `noFace` into per-feature flags (`noNose`/`noMouth`/`noBrows`) would cover this without breaking existing packs (all current uses want the full bundle).
3. **No cloth/cape flutter animation.** Snape's and Voldemort's signature "billowing" robes, and Dumbledore's flowing sleeves, are static oversized `back`-anchor cones — there's no idle cloth-sway channel the way there's an idle-fidget system for limbs. This reinforces (rather than duplicates) the already-parked "animated appendages" item in `docs/ROADMAP.md` § avatar rig gaps, which lists tail sway / wing flap / ear posing but doesn't yet call out cape/robe cloth motion specifically — worth folding in explicitly since three of eight members here would benefit.

## Sources

- [Gryffindor Costumes: Ultimate Guide & Best Picks — Morphsuits](https://www.morphsuits.com/blog/gryffindor-costumes/)
- [Harry Potter Costume — For The Love of Harry](https://fortheloveofharry.com/harry-potter-costume/)
- [Hermione Granger Costume — For The Love of Harry](https://fortheloveofharry.com/hermione-costume/)
- [Harry Potter: 10 Hidden Details About Hermione Granger's Costume — ScreenRant](https://screenrant.com/harry-potter-hermione-granger-costume-facts/)
- [Dress Like Ron Weasley Costume — Costume Wall](https://costumewall.com/dress-like-ron-weasley/)
- [Ron Weasley Costume — For The Love of Harry](https://fortheloveofharry.com/ron-weasley-costume/)
- [Albus Dumbledore Costume — For The Love of Harry](https://fortheloveofharry.com/dumbledore-costume/)
- [Harry Potter: 10 Hidden Details About Albus Dumbledore's Costumes — ScreenRant](https://screenrant.com/harry-potter-dumbledore-costume-hidden-details/)
- [Dress Like Severus Snape Costume — Costume Wall](https://costumewall.com/dress-like-severus-snape/)
- [Professor Severus Snape Costume — Vocal Media](https://vocal.media/styled/professor-severus-snape-costume)
- [Dress Like Rubeus Hagrid Costume — Costume Wall](https://costumewall.com/dress-like-rubeus-hagrid/)
- [Rubeus Hagrid's moleskin overcoat — Harry Potter Wiki (Fandom)](https://harrypotter.fandom.com/wiki/Rubeus_Hagrid%27s_moleskin_overcoat)
- [Why Does Voldemort Look Like a Snake in Harry Potter? — CBR](https://www.cbr.com/why-harry-potter-voldemort-snake-appearance/)
- [Why Lord Voldemort Doesn't Have a Nose in Harry Potter — CBR](https://www.cbr.com/voldemort-nose-what-happened-harry-potter/)
- [How to Make a Draco Malfoy Costume — The Leaky Cauldron](http://www.the-leaky-cauldron.org/features/crafts/resources/howtodracomalfoycostume/)
- [Draco Malfoy Costume Guide for Cosplay and Halloween — Costume Wall](https://costumewall.com/dress-like-draco-malfoy/)
