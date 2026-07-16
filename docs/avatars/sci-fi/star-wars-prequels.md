# Avatar pack: Star Wars — Prequel Trilogy

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no textures, no names printed anywhere in-scene; character identity lives only
in this doc's Reference lines and the pack's display labels.

## Overview

- **Group**: heroes, mentors, and villains of the Star Wars prequel trilogy
  (*The Phantom Menace* 1999, *Attack of the Clones* 2002, *Revenge of the
  Sith* 2005).
- **Hierarchy path**: `Sci-Fi / Star Wars / Prequel Trilogy` — sibling to the
  already-shipped `sci-fi/star-wars-ot.md` (Original Trilogy) and
  `sci-fi/star-wars-mandalorian.md`; same franchise, separate sub-series pack
  per the taxonomy's "one pack per sub-series" rule.
- **Member count**: 8.
- **Rig**: humanoid only. All eight members build on the humanoid rig,
  including General Grievous — a four-armed cyborg approximated on the
  standard 2-arm rig (see Rig gaps). No quadrupeds in this pack.
- **No shared base spec.** Like the sibling `star-wars-ot.md`, this ensemble
  is deliberately heterogeneous — four Jedi in three different variations of
  earth-tone robes, a Naboo/Republic dignitary in ornate regalia, a
  red-skinned Sith assassin, an aristocratic cloaked Sith lord, and a
  droid-cyborg general — so there's no single starting spec that helps more
  than it fights. The binder here is discipline, not a shared spec:
  - **Faction palette split**: warm earth-tone Jedi browns/beiges (Obi-Wan,
    Qui-Gon, Mace, and — darkened — Anakin) vs. Naboo royal opulence (Padmé's
    deep reds, blacks, and gold) vs. Sith/separatist darkness (Maul's
    red-and-black, Dooku's black-and-burgundy, Grievous's cold grey-green
    metal). No two members share a body color.
  - **Lightsaber-as-differentiator, reused from `star-wars-ot.md`**: every
    saber-wielder gets the established hilt-cylinder + emissive-blade-cylinder
    hand prop (`luke-tan`'s technique), with blade color doing a lot of the
    identity work where robes alone would collide (blue for Anakin AND
    Obi-Wan, green for Qui-Gon, purple for Mace, red for Maul and Dooku,
    green+blue for Grievous's collected pair).
  - **Robe/cloak techniques reused, not re-derived**: the robe-cone technique
    (`wise_oracle`/`yoda`) covers Dooku's floor-length cloak and Vader's cape
    precedent covers Grievous's cape; the diagonal-strap technique
    (`chewbacca`/`boba` in `star-wars-ot.md`) is not needed here — no member
    wears a bandolier-style strap.
  - **Occlusion-eye technique reused**: R2-D2/C-3PO in `star-wars-ot.md`
    established swapping in a bespoke lens/implant accessory over the default
    eye position rather than inventing a new eye style; not needed here
    either (every organic member keeps plain `'dots'`), but the underlying
    "no eye color override" limitation is hit twice in this pack (Maul,
    Grievous) — see Rig gaps.
- **Member-selection notes**: the survey's 8-name list (Anakin, Obi-Wan,
  Padmé, Qui-Gon, Mace, Maul, Dooku, Grievous) was verified against the
  primary-cast rule and kept as-is — it already nets out to a clean "four
  Jedi + the heroine + one signature villain per film" structure (Maul for
  Episode I, Dooku for Episode II, Grievous for Episode III), which is a
  better organizing principle than trying to also fit a ninth or tenth
  member in. Considered and cut:
  - **Yoda** — appears throughout the prequels, but his defining screen
    look/costume/cane/ears are already fully modeled in the sibling
    `star-wars-ot.md` pack (member 8). Re-adding the same character under a
    different sub-series pack would duplicate a selectable avatar rather than
    add one; if a future pass wants a prequel-specific Yoda variant (e.g. his
    Episode II/III fighting stance) that's a append-only addition, not part
    of this baseline 8.
  - **Palpatine/Chancellor Palpatine** — hugely important to the plot, but
    for nearly the entire trilogy he reads as a plain-suited Republic
    politician with no distinctive silhouette; his one iconic costumed
    "look" (the hooded Sith Emperor) is a last-reel reveal and arguably
    belongs to the Original Trilogy's Emperor rather than to prequel-primary
    casting. Omitted from this pack's baseline 8 for the same reason Yoda
    was: better served by (a future) OT-pack Emperor entry than duplicated
    here.
  - **Jar Jar Binks** — widely recognized but a comic-relief supporting
    character, not primary cast a casual fan reaches for first; omitted per
    the "background ensemble" exclusion in the member-selection rule.

## Members

### 1. `anakin` — "Dark-Robed Jedi Knight (blue blade)"

**Reference**: Anakin Skywalker in his Jedi Knight years (*Attack of the
Clones* → *Revenge of the Sith*) — blond hair, increasingly dark tunic and
robes (costume researchers note the fabric reads as very dark brown rather
than true black, but it photographs near-black on screen), a blue
lightsaber. (Hayden Christensen.) His Episode I child appearance and his
Padawan braid (worn through Episodes I–II, cut on becoming a Knight) are
real but earlier/transitional looks — not modeled as a separate member, same
"noted but not built" treatment `star-wars-ot.md` gave Luke's later black
costume.

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 'tint'
body: 0x241f1b       // near-black dark brown Jedi tunic/robes
legColor: 0x1c1815   // matching dark trousers
shoe: 0x141210
eyes: 'dots'
emI: 0.15
hands: 'sphere'
limbR: 1.0
```

**Accessories**
- **crown** — tousled blond hair, a low irregular sphere-cap, `0xd4b06a`, front rim clearing the brow (same crown-clearance rule as every hooded/haired accessory in the rig).
- **face** — a thin diagonal scar accent over one eye: a small proud thin box, dark pinkish `0x8a5648`, subtle detail rather than a silhouette element.
- **handR** — lightsaber prop reusing `star-wars-ot.md`'s established hilt+blade recipe: metal-grey cylinder hilt (`0xc7c9cc`) topped by an emissive blue blade cylinder (`0x3fa9f5`, `emissiveIntensity ≈ 0.6`).

**Silhouette check**: near-black robes (darkest of the four Jedi in this
pack) plus tousled blond hair and a blue blade — the darkness of the outfit
alone separates him from Obi-Wan/Qui-Gon/Mace's lighter or plainer browns at
a glance; the blond hair keeps him from reading as a plain "generic dark
Jedi."

**Personality**: `bobMul: 1.05, swayMul: 1.1, cadenceMul: 1.05, ampMul: 1.0` (restless, impulsive energy)
**Bubbles**: `🔧⚡😤✨` (podracer/mechanic roots, temper, anger, chosen-one destiny)

---

### 2. `obi-wan` — "Jedi Master (tan tunic & beard)"

**Reference**: Obi-Wan Kenobi across the trilogy — a beige tunic under a
brown hooded Jedi robe, dark trousers, brown boots; clean-shaven as a young
Padawan in *The Phantom Menace*, then reddish-brown hair and a trimmed beard
from *Attack of the Clones* onward, a blue lightsaber. (Ewan McGregor.)
Modeled here at his more iconic bearded Master look.

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 'tint'
body: 0xcdbf9c       // beige tunic
legColor: 0x6b5a44   // brown trousers
shoe: 0x4a3c2c
eyes: 'dots'
emI: 0.15
hands: 'sphere'
limbR: 1.0
```

**Accessories**
- **crown** — short reddish-brown hair cap, low flattened sphere, `0x7a4a2e`.
- **face** — trimmed beard + mustache: a small flattened box under the chin/cheeks, `0x6b3f28`, proud of the skin surface.
- **back** — brown hooded robe draped from the shoulders: a flattened cone/cylinder, `0x5c4630`, reaching partway down the back (reuses the robe-drape idiom, distinct from Qui-Gon's broader poncho below).
- **handR** — lightsaber prop, same hilt/blade recipe as `anakin`, blue blade (`0x3fa9f5`).

**Silhouette check**: beige tunic + a plain draped brown cloak plus short
hair and a full beard is the "measured Jedi Master" read; the beard and
close-cropped hair are what separates him from Qui-Gon's long grey hair and
poncho at a glance, since both wear the same tunic/robe palette family.

**Personality**: `bobMul: 0.95, swayMul: 0.8, cadenceMul: 1.0, ampMul: 0.9` (measured, diplomatic bearing)
**Bubbles**: `🧘⚔️😑🍵` (patience/meditation, dueling, dry exasperation, calm restraint)

---

### 3. `padme` — "Naboo Royal (regal gown)"

**Reference**: Padmé Amidala — as Queen Amidala in *The Phantom Menace* she
wears elaborate, dramatic ceremonial gowns (deep reds, blacks, heavy
embroidery) with a wide formal headdress and pale ceremonial makeup: white
foundation, a red lower-lip stripe, and small red cheek accent dots. Later
appears in Senate gowns as she transitions to Senator/Naboo Representative
across *Attack of the Clones*/*Revenge of the Sith*. Modeled here at her most
iconic Episode I Queen look. (Natalie Portman.)

**Spec**
```
sk: 0.95
headR: 120
headShape: 'sphere'
skin: 0xf2e4d8       // pale ceremonial makeup base
body: 0x8a1c1f       // deep red ceremonial gown
legColor: 0x8a1c1f   // floor-length gown, no visible separate leg color
shoe: 0x8a1c1f       // hidden under the hem
eyes: 'dots'
emI: 0.15
hands: 'sphere'
limbR: 0.9
```

**Accessories**
- **face** — ceremonial makeup accents: a thin red lower-lip stripe (small proud box, `0xb5222c`) plus two small red cheek-dot spheres (`0xb5222c`) below the eyes.
- **crown** — wide dark formal headdress framing the face: a flattened, wide sphere-arc shell, near-black `0x1a1a1a` with a thin gold rim accent (`0xc9a227`), raised + tilted back (same clearance rule as every crown accessory) so it frames rather than covers the face.
- **head** — small central ornament on the headdress, a tiny gem-like sphere, `'tint'` (this pack's tint-rule surface for Padmé, since her skin/gown are both hardcoded to specific costume colors).
- **chest** — a thin gold collar/torque band, `0xc9a227`.
- **hip** — a dark ceremonial sash with a small gold buckle, `0x1a1a1a` + `0xc9a227` accent.

**Silhouette check**: the wide dark headdress framing a pale face over a
deep red floor-length gown is unmistakable and unique in this pack — the
only gown-silhouette, the only pale-makeup face, and the only member without
a robe/armor/plating read.

**Personality**: `bobMul: 0.85, swayMul: 0.7, cadenceMul: 1.0, ampMul: 0.85` (regal, composed poise)
**Bubbles**: `👑📜🕊️💔` (queen/senator authority, diplomacy and legislation, peace advocacy, heartbreak)

---

### 4. `qui-gon` — "Jedi Master (poncho & long hair)"

**Reference**: Qui-Gon Jinn, *The Phantom Menace*'s maverick Jedi Master —
a beige tunic and dark brown robe like other Jedi, but distinguished by a
rough-woven grey poncho worn over the shoulders, long grey-streaked brown
hair, and a green lightsaber. Dies at the end of Episode I. (Liam Neeson.)

**Spec**
```
sk: 1.04
headR: 128
headShape: 'sphere'
skin: 'tint'
body: 0xd6c7a1       // beige tunic (lighter than Obi-Wan's, poncho does the differentiating)
legColor: 0x6b5a44   // brown trousers
shoe: 0x4a3c2c
eyes: 'dots'
emI: 0.13
hands: 'sphere'
limbR: 1.05
```

**Accessories**
- **crown** — long grey-brown hair, a flattened sphere-cap extending slightly past the shoulders, `0x8a8478`.
- **back** — the signature poncho: a wide flattened cone draped over both shoulders and down the torso, weathered grey `0x9a978c` with a darker trim edge `0x6b6860` — the single biggest silhouette differentiator from Obi-Wan's plain draped cloak.
- **handR** — lightsaber prop, same recipe, green blade (`0x3fff6e`).

**Silhouette check**: the broad grey poncho draped over the shoulders,
combined with long greying hair, is what reads "renegade elder Jedi" and
keeps him from being mistaken for Obi-Wan despite sharing the same beige/
brown tunic family.

**Personality**: `bobMul: 1.0, swayMul: 0.9, cadenceMul: 0.9, ampMul: 0.95` (steady, unhurried maverick pace)
**Bubbles**: `🌌🧘🌱⚔️` (the living Force, meditation, mentorship/growth, dueling)

---

### 5. `mace-windu` — "Jedi Master (bald, purple blade)"

**Reference**: Mace Windu, a senior member of the Jedi Council — bald,
dark brown Jedi robes in the same general palette as other Jedi, and the
single most identifying detail in the whole prequel Jedi order: a purple
("amethyst") lightsaber blade, unique among on-screen Jedi. (Samuel L.
Jackson.)

**Spec**
```
sk: 1.02
headR: 126
headShape: 'sphere'
skin: 'tint'
body: 0x4a4034       // dark brown robes, richer/darker than Obi-Wan/Qui-Gon's beige
legColor: 0x352d24
shoe: 0x241f19
eyes: 'dots'
emI: 0.15
hands: 'sphere'
limbR: 1.0
```

**Accessories**
- No **crown** accessory at all — bald is the point; every other member in this pack has a hair/hood/headdress crown piece, so its deliberate absence here is itself part of the silhouette.
- **hip** — a plain belt/pouch, thin wrapping box, `0x2e2620`.
- **handR** — lightsaber prop, same recipe, **purple** blade (`0x9b30d9`, `emissiveIntensity ≈ 0.6`) — the one saber color in this pack that appears nowhere else.

**Silhouette check**: a smooth, entirely bald head (unique in this pack —
every other member has hair, a hood, or a helmet) topped off by the
unmistakable glowing purple blade the instant it's drawn.

**Personality**: `bobMul: 0.8, swayMul: 0.55, cadenceMul: 0.85, ampMul: 0.8` (stoic, controlled, minimal wasted motion)
**Bubbles**: `🟣🧘⚔️🛑` (signature purple blade, Council composure, dueling, "not the Council's decision")

---

### 6. `darth-maul` — "Sith Assassin (red & black horned)"

**Reference**: Darth Maul, the Sith apprentice of *The Phantom Menace* —
red-and-black tattoo-like facial/head markings over red skin, a crown of
short vestigial horns, plain black robes, and the iconic double-bladed red
lightsaber. Hidden under a large black cowl for most of the film until the
climactic reveal/duel. (Ray Park.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
skin: 0xb5222c       // red skin
body: 0x111112       // plain black robe/tunic
legColor: 0x111112
shoe: 0x0c0c0d
eyes: 'dots'          // canonical yellow-sclera/red-iris eyes not representable — see Rig gaps
emI: 0.1
hands: 'sphere'
limbR: 1.0
```

**Accessories**
- **crown** — a cluster of short horn nubs: 3 small cones, bone-grey `0x8a8274`, arranged front/back/sides of the head (a stylized reduction of the canonical ten-horn crown, per the silhouette-not-fidelity rule).
- **head** — tattoo markings: 2 thin proud boxes across the cheeks, black `0x111112` (matching the robe), a "few proud accents, not scatter" per the pattern convention rather than a full facial pattern.
- **handR** — double-bladed lightsaber: one metal-grey hilt cylinder plus TWO emissive red blade cylinders (`0xff3b30`, `emissiveIntensity ≈ 0.6`) extending from opposite ends of the same hilt — a novel two-blade variant of the established single-blade recipe.

**Silhouette check**: red-and-black striped face under a spiky horn crown
is instantly recognizable even before the double-red-blade weapon registers
— the only red-skinned member and the only double-bladed saber in the pack.

**Personality**: `bobMul: 1.15, swayMul: 1.0, cadenceMul: 1.2, ampMul: 1.1` (predatory, quick stalking gait)
**Bubbles**: `😈🔥⚔️🤫` (menace, rage, dueling, silent assassin)

---

### 7. `count-dooku` — "Sith Lord (aristocratic, cloaked)"

**Reference**: Count Dooku / Darth Tyranus — a silver-haired, goateed
aristocrat-turned-Sith Lord: a dark high-collared tunic, a long flowing dark
brown/burgundy cloak, and a signature curved-hilt lightsaber (red blade) tied
to his refined dueling style. (Christopher Lee.)

**Spec**
```
sk: 1.05
headR: 124
headShape: 'sphere'
skin: 'tint'
body: 0x2a2320       // dark high-collared tunic
legColor: 0x211b18
shoe: 0x171310
eyes: 'dots'
emI: 0.12
hands: 'sphere'
limbR: 1.0
```

**Accessories**
- **crown** — swept-back silver-grey hair, low flattened sphere-cap, `0xc7c5bd`.
- **face** — a pointed goatee: a small cone under the chin, `0xc7c5bd`.
- **back** — a long flowing cloak: a large flattened cone from the shoulders to the ground, dark brown/burgundy `0x4a2c22`, with a lighter proud lining accent along the inner edge `0x7a4a38` (reuses the robe-cone technique already established for `yoda`/`wise_oracle`, scaled up to full-length).
- **handR** — lightsaber prop: a silver-black hilt cylinder (`0xb9bcc2`) tilted at an angle to gesture at the signature curve (see Rig gaps — no true curved primitive), topped by an emissive red blade (`0xff3b30`, `emissiveIntensity ≈ 0.6`).

**Silhouette check**: silver-grey hair and goatee above a long dark cloak
sweeping to the ground reads "aristocratic elder Sith" — distinct from
Maul's bare tattooed head and Grievous's mechanical frame; the closest
member in overall build is Qui-Gon, separated cleanly by cloak-vs-poncho
shape and hair color (silver-grey vs brown).

**Personality**: `bobMul: 0.75, swayMul: 0.6, cadenceMul: 0.85, ampMul: 0.75` (unhurried, a duelist's poise)
**Bubbles**: `🎩⚔️🖤💰` (aristocratic bearing, elegant dueling, the dark side, separatist funding/politics)

---

### 8. `general-grievous` — "Cyborg General (four-armed)"

**Reference**: General Grievous, the droid-cyborg Supreme Commander of the
Separatist droid army in *Revenge of the Sith* — a tall, skeletal
grey/bone-white plated body, an elongated skull-like head with narrow
glowing eyes, a black cape, and four arms wielding up to four collected
lightsabers (commonly shown as one green + one blue pair in combat), plus
his signature wheezing cough. (Voiced by Matthew Wood.)

**⚠️ Rig fit**: the current rig has no multi-arm/extra-limb support (see
Rig gaps) — this entry approximates the canonical four arms as two fully
posable arms plus a static second pair suggested via shoulder-anchored
stub accessories, not four independently animated limbs.

**Spec**
```
sk: 1.15
headR: 108
headShape: 'oval'     // elongated skull-like head
skin: 0xd8d5c8         // bone-white/grey plating
body: 0x9a9890         // grey-green metallic plating
legColor: 0x7a786e
shoe: 0x4a4840
eyes: 'visor'          // closest fit for a mechanical eye band — see Rig gaps for the color caveat
emI: 0.2
hands: 'box'           // clawed armored digits
limbR: 0.85            // lean, skeletal limbs
armL: 1.15              // long gangly arms
legL: 1.05
steel: true
```
`posture: { pitch: 0.12 }` — a static forward hunch, predatory cyborg stance.

**Accessories**
- **back** — a black segmented cape: a flattened cone from the shoulders down, `0x111112`.
- **chest** — a proud rib-like plating band across the torso, `0x6e6c62`.
- **handL** — collected lightsaber #1: hilt (`0xb9bcc2`) + emissive **green** blade (`0x3fff6e`).
- **handR** — collected lightsaber #2: hilt (`0xb9bcc2`) + emissive **blue** blade (`0x3fa9f5`).
- **shoulderL** / **shoulderR** — folded stub-arm accessories, grey-green `0x7a786e`, tucked close to the torso — the load-bearing hack standing in for the retracted second arm pair (see Rig fit note above and Rig gaps).

**Silhouette check**: a tall, gangly grey-white skeletal frame with a small
elongated head and a flowing black cape is utterly distinct from every
organic member in this pack — the only non-humanoid-skinned, non-robed
silhouette, and the tallest member by `sk`.

**Personality**: `bobMul: 0.7, swayMul: 1.4, cadenceMul: 1.15, ampMul: 1.3` (loping, unnervingly long-limbed mechanical stride)
**Bubbles**: `⚙️🤧⚔️🏃` (mechanical/droid nature, the signature cough, saber-collector duelist, cowardly retreat when losing)

## Rig gaps

1. **No multi-arm/extra-limb support.** The rig has exactly two arms
   (`armL`/`armR` scale fields, `handL`/`handR` accessory anchors); there is
   no way to add a genuinely independent, jointed third or fourth arm.
   General Grievous's canonical four arms are approximated as two fully
   posable/animated arms (each holding a collected lightsaber) plus a
   static second pair suggested only as small folded-stub accessories on
   the `shoulderL`/`shoulderR` anchors — those stubs never swing, grab, or
   articulate independently. This is a new gap this pack surfaces (not
   already covered by the ROADMAP's "additional anchors" or "independent
   secondary props" items, which are about anchor points and detached
   floating props respectively, not attached posable limbs); a first-class
   second arm pair (with its own shoulder/elbow/hand joints) would be
   needed to close it properly.
2. **No eye-color override on the named eye styles.** Already parked in
   `docs/ROADMAP.md` § avatar rig gaps ("eye color overrides"); this pack
   hits it twice. Darth Maul's canonical yellow-sclera/red-iris eyes have
   no matching named style, so he's built with plain `'dots'` and the
   color is simply lost. General Grievous's `'visor'` band (the closest
   fit for a mechanical eye strip on an elongated skull head) renders the
   style's hardcoded cyan glow (`0x33ccff`), not his canonical sickly
   yellow-green — same root cause, cited once here for both rather than
   re-derived per member.
3. **No curved/bent primitive shape.** Count Dooku's single most iconic
   prop detail is his lightsaber's curved hilt (tied directly to his
   dueling style in-universe); with only straight `box`/`cylinder`/`cone`
   primitives available, it's approximated here as a straight cylinder
   held at a fixed tilt rather than a true curve. This is the same
   "no curved/bent held-prop geometry" gap `sci-fi/marvel-avengers.md`
   already flagged for Hawkeye's recurve bow (itself tied to the parked
   "pose-aware hand props" ROADMAP item) — cited here as a second concrete
   use case, not re-derived.
4. **Robe/cloak techniques reused, not new.** Dooku's floor-length cloak
   and Grievous's cape both reuse the existing robe-cone
   (`yoda`/`wise_oracle`) and cape (`vader`, `star-wars-ot.md`) techniques
   — no gap, noted here only so a future author doesn't re-derive them.

## Sources

- [Anakin Skywalker (Episode III) — Rebel Legion](https://rebellegion.com/anakin-skywalker-episode-iii/)
- [Anakin Fabrics — Jedi Council Forums (costuming detail thread)](https://boards.theforce.net/threads/anakin-fabrics.9701849/)
- [Obi-Wan Kenobi's Original Prequel Era Costume Is Undeniably Awesome — ScreenRant](https://screenrant.com/obi-wan-kenobi-prequel-costume-original-awesome/)
- [Obi-Wan Kenobi (Episode III) — Rebel Legion](https://rebellegion.com/obi-wan-kenobi-episode-iii-revenge-of-the-sith/)
- [Jedi apparel — Wookieepedia](https://starwars.fandom.com/wiki/Jedi_apparel/Legends)
- [Throne room gown — Wookieepedia](https://starwars.fandom.com/wiki/Throne_room_gown)
- [Padmé Amidala's wardrobe — Wookieepedia](https://starwars.fandom.com/wiki/Padm%C3%A9_Amidala's_wardrobe)
- [Queen Amidala (Red Invasion Gown) — Rebel Legion](https://rebellegion.com/queen-amidala-episode-i-the-phantom-menace-red-invasion-gown/)
- [Ranking Queen Amidala's Costumes From The Phantom Menace — HubPages](https://discover.hubpages.com/entertainment/a-ranking-of-queen-amidala-costume-from-star-wars-episode-i)
- [Qui-Gon Jinn — Rebel Legion](https://rebellegion.com/qui-gon-jinn/)
- [Qui-Gon Jinn Cosplay Costume — SimCosplay](https://www.simcosplay.com/qui-gon-jinn-cosplay-costume-star-wars-the-phantom-menace-robe.html)
- [Mace Windu (Episode I) — Rebel Legion](https://rebellegion.com/mace-windu-episode-i-the-phantom-menace/)
- [Mace Windu (Episode II/III) — Rebel Legion](https://rebellegion.com/mace-windu-episode-ii-attack-of-the-clonesepisode-iii-revenge-of-the-sith/)
- [Star Wars: 10 Facts & Trivia About Darth Maul's Costume — ScreenRant](https://screenrant.com/star-wars-10-things-didnt-know-darth-mauls-costume/)
- [Why Does Darth Maul Have Horns? — TheorySabers](https://www.theorysabers.com/blogs/article/darth-mauls-horns)
- [Darth Maul: The Phantom Menace — 501st Costume Reference Library](https://crls.501st.com/sld/darth-maul)
- [Darth Maul — Wikipedia](https://en.wikipedia.org/wiki/Darth_Maul)
- [Count Dooku Costume and Cosplay Guide: Cape, Sabre, and Sith Style — NeoSabers](https://neosabers.com/blogs/article/count-dooku-costume-and-cosplay-guide-cape-sabre-and-sith-style)
- [Darth Tyranus/Count Dooku: ROTS — 501st Costume Reference Library](https://crls.501st.com/sld/darth-tyranus-rots)
- [Count Dooku Costume Guide — Carbon Costume](https://carboncostume.com/count-dooku/)
- [Star Wars: Why General Grievous' Lightsabers Are Blue and Green, Not Red — CBR](https://www.cbr.com/star-wars-general-grievous-lightsaber-color-explained/)
- [General Grievous — Elite Series Research Droids Reviews](https://www.jeditemplearchives.com/content/modules.php?name=JReviews&rop=showcontent&id=2358)
- [General Grievous — Brickipedia](https://en.brickimedia.org/wiki/General_Grievous)
- In-repo: `src/three-renderer.ts` (`SPECS` table, eye-style switch —
  `'visor'`/`'halfred'`/`'slit'` cases checked directly to confirm none
  matches Maul's/Grievous's canonical eye color, hence the Rig gap rather
  than a misused eye style); sibling docs `docs/avatars/sci-fi/star-wars-ot.md`
  (lightsaber hand-prop recipe, robe-cone/cape techniques, occlusion-eye
  precedent) and `docs/avatars/sci-fi/marvel-avengers.md` (curved-prop gap
  cited rather than re-derived); `docs/ROADMAP.md` § avatar rig gaps
  (eye-color-override item cited rather than re-derived).
