# Avatar Pack: Pop Culture > Movies > The Lord of the Rings

**Path**: Pop Culture / Movies / The Lord of the Rings
**Style**: Stylized geometric toon homage figures in the Diorama Sims-toon rig (primitives + MeshToonMaterial, flat banded shading, dark cartoon outlines, oversized head/hands, green plumbob). This pack evokes the film trilogy's silhouettes and palette through **color + shape only** — no textures, no logos, no likenesses. Every member uses a descriptive-generic `label`; the actual character identity lives in the `Reference` line only.

This is the **regeneration-ready source of truth** for the pack's data file. Re-run pack generation from this doc; do not hand-edit the generated data file without updating this doc first.

## Overview

The Fellowship of the Ring is a mixed-race adventuring party, which is exactly the kind of size/silhouette variety the rig is built for: two small hobbits (`sk 0.55`), one stocky dwarf (`sk 0.7`), and four full-height humans/elf/wizard (`sk ~1.0`), plus one corrupted, hunched non-Fellowship creature (`sk 0.5`) included for completeness/contrast. Race, not costume alone, does most of the silhouette work — get `sk`/`headR`/`limbR`/`legL` right first, then layer costume color and accessories on top.

**Shared "Fellowship" palette** — keep every member's clothing pulled from this earth-tone family so the group reads as one set at a glance, with ONE saturated accent per character for recognition (Frodo's green cloak, Legolas's bright hair, Gimli's red beard, Boromir's silver tree emblem):

| Swatch | Hex | Use |
|---|---|---|
| Weathered leather brown | `#5c4a30` | jackets, belts, boots |
| Ranger/woodland green | `#3f5c3a` | cloaks, elf tunic |
| Ash / stone grey | `#7a7a76` | wizard robe, mail, stone accents |
| Deep charcoal | `#2b2620` | Gondor black leather, dark hair |
| Parchment / bone | `#e8dcc0` | horn, pale accents, hobbit shirts |
| Muted gold/brass | `#8a6a2e` | buckles, helmet trim, horn bands |

**Pack-wide base spec** (start every member here, then diff):
```
emI: 0            # no emissive by default — this is an earthbound, un-magical group
hands: 'sphere'
steel: false       # armor reads through accessory color, not the metallic body flag
headShape: 'sphere'
```
Only Gandalf gets a documented **alt palette** (White) as a callable variant, noted inline in his section rather than as a separate member.

---

## Members

### 1. `lotr-frodo` — Ring-bearer Hobbit (green cloak)

**Reference**: Frodo Baggins, the hobbit protagonist who carries the One Ring. Curly brown hair, fair round face, a brown waistcoat/vest over a linen shirt, rust-brown breeches, and a grey-green Elven cloak clasped with a leaf brooch. Famously always barefoot with large hobbit feet.

**Spec**
```
sk: 0.55
headR: 112
headShape: 'sphere'
limbR: 0.9
skin: '#e8b48c'
body: '#5c3a24'        # brown waistcoat over linen shirt
shoe: '#e8b48c'        # no shoe mesh — barefoot, same tone as skin
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 0.95
legL: 0.85
footMul: [1.3, 0.6, 1.25]   # big bare hobbit feet
legColor: '#6b4a30'     # rust-brown breeches
```

**Accessories**
- `crown` sphere, ~70mm, `#4a3324` (curly brown hair), sits low/round — no brim to clear, hobbit hair is short.
- `chest` disc, ~18mm, `#d8d8c0` (pale leaf-brooch clasp) at the collar.
- `back` flattened cone, large (drapes to knee), `#4f6b47` (grey-green Elven cloak) — the ONE saturated accent on this member.
- `hip` thin box belt, `#3a2818`.

**Silhouette check**: small stature + curly brown hair + green-grey cloak + bare feet reads instantly at 30px. The bare-feet detail is the weakest link — see Rig gap #1 (no foot/ankle accessory anchor for the hairy-foot texture beyond `footMul` enlarging the mesh).

**Personality**: `bobMul 1.0, swayMul 1.1, cadenceMul 1.15, ampMul 0.85` (quick short-legged waddle)
**Bubbles**: 💍 🌿 😰 🍞

---

### 2. `lotr-sam` — Gardener Hobbit (grey cloak)

**Reference**: Samwise Gamgee, Frodo's loyal gardener and companion. Sandy/dirty-blonde curly hair, stouter build than Frodo, a plain brown work jacket, and a grey travelling cloak (also leaf-clasped). Carries cooking gear and a pack.

**Spec**
```
sk: 0.55
headR: 112
headShape: 'sphere'
limbR: 1.0
skin: '#e2ac82'
body: '#6e6b4a'         # olive-brown work jacket
shoe: '#e2ac82'         # barefoot
emI: 0
hands: 'sphere'
eyes: 'dots'
steel: false
armL: 0.95
legL: 0.85
footMul: [1.3, 0.6, 1.25]
legColor: '#5c4a2e'
```

**Accessories**
- `crown` sphere, ~70mm, `#c8a35a` (sandy curly hair).
- `back` flattened cone, `#8f8f84` (grey cloak) — the paler cloak is the ONE differentiator from Frodo's green at a glance.
- `back` (second primitive, same anchor) small cylinder bedroll/pack, `#6b4a2e`, riding just below the cloak line.
- `chest` disc, ~16mm, `#6b8f4e` (leaf clasp, greener than Frodo's for variety).
- `hand` small cylinder (cook pot), `#6b6b68`, optional idle prop.

**Silhouette check**: stouter body + sandy hair + grey (not green) cloak + visible pack/pot reads as "the practical one" next to Frodo. No gaps beyond #1.

**Personality**: `bobMul 1.05, swayMul 1.15, cadenceMul 1.1, ampMul 0.9`
**Bubbles**: 🍳 🥔 🎒 😢

---

### 3. `lotr-gandalf` — Grey Wizard (pointed hat + staff)

**Reference**: Gandalf the Grey, wandering wizard (Istari). Tall pointed grey hat, ash-grey robes, long grey beard, wooden staff. (Later becomes Gandalf the White — see alt palette below.)

**Spec**
```
sk: 1.0
headR: 128
headShape: 'sphere'
limbR: 0.9
skin: '#d8b48c'
body: '#7a7a76'         # ash-grey robe
shoe: '#4a4a48'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 1.05
legL: 1.0
footMul: [1, 1, 1]
legColor: '#7a7a76'     # robe hem reads as legs — no separate trouser color
```

**Accessories**
- `crown` cone, tall (~180mm), `#6e6e6c` (pointed wizard hat) — **raise + tilt back** so the brim clears the brow band, same rule as any dome/crown accessory.
- `face` box/cone, long (chin to upper chest), `#d8d8d0` (long grey beard).
- `hip` thin cylinder belt, `#5a4a30` (braided leather).
- `back` flattened cone, `#5c5c5a` (cloak, slightly darker than robe for depth).
- `hand` long thin cylinder (staff), `#4a3826` (wood) with a small sphere cap, `#cfd8e0`, `emI: 0.15` (faint crystal glow).

**Alt palette — Gandalf the White** (same accessories, recolor only): `body/robe → '#f0f0ea'`, hat `→ '#e8e8e0'`, beard `→ '#f5f5f0'`, staff wood `→ '#d8d0c0'`, `emI: 0.08` on the robe/body for a subtle radiant look. Same id, treat as a documented palette swap rather than a second member.

**Silhouette check**: pointed grey hat + long grey beard + staff = unmistakable wizard silhouette even at 30px; no gaps.

**Personality**: `bobMul 0.9, swayMul 0.8, cadenceMul 0.85, ampMul 0.9` (measured, deliberate elder gait)
**Bubbles**: 🔥 📜 🕯️ 💭

---

### 4. `lotr-ranger` — Ranger King (dark leathers + sword)

**Reference**: Aragorn, Ranger of the North (Strider) and heir to the throne of Gondor. Dark tousled hair, stubble, weathered dark-green/brown leather coat and trousers (Ranger camouflage colors), grey-green travel cloak, sword at the hip.

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
limbR: 1.05
skin: '#c99770'
body: '#3a3f2e'         # dark green-brown ranger leather
shoe: '#2b2620'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 1.0
legL: 1.0
footMul: [1, 1, 1]
legColor: '#4a3c28'
```

**Accessories**
- `crown` small sphere cluster, ~60mm, `#2b2018` (dark tousled hair — no hat).
- `face` thin box, `#2b2018` (stubble/short beard).
- `back` flattened cone, `#4a4f3e` (weathered grey-green cloak).
- `hip` box + small sheath, `#5c4a30` belt / `#8a8a86` scabbard tip.
- `hand` thin long box (plain sword), `#b0b0ac`.

**King variant note**: for a coronation/Gondor-king look, swap to `body '#1c1c1c'` + `back '#2a2a30'` (black + deep blue-grey) and add a `crown` accessory: a thin silver circlet (torus-like ring approximated as a flattened cylinder), `#d8dce0` — no rig gap, just a recolor + one swapped crown accessory.

**Silhouette check**: dark ranger leathers + cloak + sword + stubble reads as "weathered wanderer," distinct from Boromir's cleaner black/silver Gondor cut. No gaps.

**Personality**: `bobMul 1.0, swayMul 0.7, cadenceMul 0.95, ampMul 1.05` (steady, confident stride)
**Bubbles**: ⚔️ 👑 🔥 🛡️

---

### 5. `lotr-archer` — Elf Archer (green + longbow)

**Reference**: Legolas, Woodland Elf archer of the Fellowship. Long straight blonde hair, pointed ears, green-toned woodland leather tunic, bow and quiver carried on the back.

**Spec**
```
sk: 1.0
headR: 118
headShape: 'sphere'
limbR: 0.85
skin: '#e8c9a8'
body: '#3f5c3a'         # green tunic — the ONE saturated accent on this member
shoe: '#4a3c28'
emI: 0
hands: 'sphere'
eyes: 'almond'
steel: false
armL: 1.0
legL: 1.05             # long-legged, elven proportions
footMul: [1, 1, 1]
legColor: '#33421f'
```

**Accessories**
- `crown` large sphere/cone cluster, ~150mm, `#e8d59a` (long straight blonde hair, drapes past shoulders).
- `head` two small cones, ~15mm, `#e8c9a8` (pointed ear tips) — the elf's signature tell at any distance.
- `back` long thin cylinder diagonal (bow), `#6b5636`, plus a shorter cylinder (quiver) with 2–3 small cone fletching tips, `#d8d8d0`.
- `chest` small box (vambrace/tie detail), `#8a6a3d`.

**Silhouette check**: long blonde hair + pointed ears + bow-and-quiver silhouette on the back + green tunic is unambiguous even in outline. No hard gaps; pointed-ear accessory already covered by the existing `head` anchor.

**Personality**: `bobMul 0.75, swayMul 0.5, cadenceMul 1.2, ampMul 0.9` (light, gliding, quick steps — minimal vertical bob)
**Bubbles**: 🏹 🍃 👁️ ✨

---

### 6. `lotr-dwarf` — Dwarf Warrior (red beard + axe)

**Reference**: Gimli, Dwarven warrior of the Fellowship. Stocky, short but broad; long braided red-orange beard, horned/winged bronze helmet, chainmail under a maroon tunic, battle axe.

**Spec**
```
sk: 0.7
headR: 130
headShape: 'sphere'
limbR: 1.3
skin: '#d9a878'
body: '#5c2e22'          # maroon-brown tunic under the mail
shoe: '#3a2e22'
emI: 0
hands: 'sphere'
eyes: 'dots'
steel: false
armL: 0.85
legL: 0.7
footMul: [1.1, 1.0, 1.1]
legColor: '#3a2e22'
```

**Accessories**
- `crown` box+cone combo helmet, `#8a6a2e` (bronze/brass), small cone "wing" details each side — raised to clear the brow like any dome/hat.
- `face` box + two thin trailing cylinders (long braided red beard), `#a83c28` — the ONE saturated accent and the primary recognition cue.
- `chest` box (chainmail breastplate hint), `#8a8a86`, small buckle detail.
- `back` two crossed thin box/cylinder shapes (axes), blade `#b0b0ac` / handle `#5c3c22`.
- `hip` wide box belt, `#4a3020`, brass buckle `#8a6a2e`.
- `hand` box+cylinder (battle axe, held), blade `#b0b0ac` / handle `#5c3c22`.

**Silhouette check**: red braided beard + horned helmet + stocky wide proportions (`sk 0.7`, `limbR 1.3`) + axe reads as dwarf unmistakably, even before color. No gaps.

**Personality**: `bobMul 1.3, swayMul 1.2, cadenceMul 0.9, ampMul 1.1` (heavy stomping gait)
**Bubbles**: 🪓 🍺 😤 💥

---

### 7. `lotr-corrupted` — Corrupted Creature (crouched, hunted)

**Reference**: Gollum/Sméagol, a hobbit-like creature warped over centuries by the One Ring. Small, gaunt, hunched, pale green-grey clammy skin, huge pale luminous eyes, bald, large webbed/paddle-like bare feet, minimal ragged clothing. Perpetually crouched posture.

**Spec**
```
sk: 0.5
headR: 100
headShape: 'sphere'      # a true elongated skull isn't representable — see Rig gap #2
limbR: 0.6                # thin, wiry, near-skeletal limbs
skin: '#8a9c7a'            # pale sickly green-grey
body: '#8a9c7a'            # effectively nude — body reads as skin
shoe: '#8a9c7a'            # bare, same tone as skin
emI: 0
hands: 'sphere'
eyes: 'slit'                # closest existing preset — see Rig gap #3 (no bulbous/glowing eye style)
steel: false
armL: 1.1                  # long gangly arms
legL: 0.8                  # short bandy legs
footMul: [1.5, 0.6, 1.6]    # big webbed "paddle" feet
legColor: null              # no distinct trouser — bare skin all the way down
```

**Accessories**
- `head` two tiny cones (large bat-like ears), `#8a9c7a`.
- `hip` small box (tattered loincloth — the only clothing), `#4a4238`.
- No `crown` (bald — the absence IS the read), no `face` accessory (gaunt, no beard).

**Silhouette check**: the crouched, hunched POSTURE plus pale green-grey bare skin plus huge eyes is what sells this character — color and accessories are secondary. This exposes the pack's main rig gap: there is no persistent forward-hunch/crouch posture bias independent of walk speed (see Rig gap #4). Without it, this character will stand upright like everyone else when idle, which undersells the read badly.

**Personality**: `bobMul 0.6, swayMul 1.4, cadenceMul 1.3, ampMul 0.7` (erratic, skittering, fast tiny steps)
**Bubbles**: 🐟 💍 😖 🤫

---

### 8. `lotr-captain` — Gondor Captain (black leather + white tree)

**Reference note**: Boromir, Captain of Gondor and member of the Fellowship, son of the Steward. Included for Fellowship completeness. Black leather surcoat with silver Gondor accents, White Tree emblem at the chest, fur-trimmed cloak, the Horn of Gondor carried across the body, sword and shield.

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
limbR: 1.05
skin: '#c9976e'
body: '#2e2620'          # black Gondor leather surcoat
shoe: '#241e1a'
emI: 0
hands: 'sphere'
eyes: 'dots'
steel: false
armL: 1.05
legL: 1.0
footMul: [1, 1, 1]
legColor: '#241e1a'
```

**Accessories**
- `crown` sphere, ~65mm, `#3a2a1a` (short dark brown hair).
- `face` thin box, `#2a1c10` (stubble/short beard).
- `chest` small flat disc/box, `#d8d8d0` (White Tree of Gondor emblem — the ONE saturated/pale accent against the black surcoat; the primary recognition cue).
- `chest` (second primitive) diagonal thin cylinder + small cone (Horn of Gondor on a strap), `#e8dcc0` horn / `#b08a3a` brass band.
- `back` flattened cone, `#3a3530` (grey-black cloak) with a thin lighter edge accessory, `#8a8378` (fur trim).
- `hip` box + scabbard, `#4a3626`.
- `hand` small box (leather-and-metal gauntlet), `#6a6058`.

**Silhouette check**: black leather Gondor cut + pale White Tree emblem + horn-across-chest reads as a distinct captain silhouette, differentiated from Aragorn's ranger green-brown by the black/silver Gondor palette. No gaps.

**Personality**: `bobMul 1.05, swayMul 0.75, cadenceMul 1.0, ampMul 1.05`
**Bubbles**: 📯 🛡️ 👑 😔

---

## Rig gaps

1. **No foot/ankle accessory anchor.** Existing anchors are `crown / head / face / chest / torso-front / back / hip / hand` — nothing below the knee. Hairy hobbit feet (Frodo, Sam) can only be approximated via enlarged `footMul` + skin-toned `shoe`; there's no way to add the tuft-of-hair detail that actually sells "hobbit feet." A `foot` anchor (small accessory riding the foot mesh) would fix this and is broadly reusable (also useful for boots-with-buckles, claws, etc.).
2. **No elongated/oval head shape.** Only `'sphere' | 'box'` exist. Gollum's gaunt, elongated skull is approximated with a small sphere; a `headShape: 'oval'` (vertically stretched sphere) would materially improve this and any other gaunt/alien character.
3. **No bulbous/luminous large-eye style.** Existing `eyes` presets (`dots/visor/almond/redvisor/shades/slit/halfred`) don't cover Gollum's signature huge pale-green glowing eyes that dominate a gaunt face. Closest available (`slit`) gets the "not human" read but not the size or the glow. Recommend a new `eyes: 'bulbous'` (oversized emissive pale sclera-less eyes) — likely reusable for other non-human/monstrous packs later.
4. **No static posture/hunch bias.** The rig's lean is currently speed-proportional (root pitch ∝ forward speed) with no persistent idle offset. Gollum's defining trait is a permanent hunch/crouch regardless of speed — including standing still. A `postureBias` (constant root pitch/height offset independent of gait) would fix this and would also help an aged Gandalf-the-Grey read as more stooped than Gandalf-the-White, or any future "old/crouched/injured" character.
5. **(Minor) No documented convention for a visibly two-handed held prop.** Gimli's axe and Gandalf's staff both assume a single `hand` anchor is enough (arm blends toward the prop). Fine for this pack, but a future character gripping a two-handed weapon/staff with BOTH hands visibly wrapped around it has no documented anchor pairing — flagging so it doesn't get invented ad hoc later.

## Sources

- [The Lord Of The Rings: 10 Hidden Details About Frodo's Costume You Never Noticed](https://screenrant.com/lord-of-the-rings-hidden-details-frodos-costume-you/)
- [Frodo's Fellowship Outfit — Alley Cat Scratch](https://www.alleycatscratch.com/lotr/Hobbit/Frodo/Fellowship.htm)
- [Samwise Gamgee Costume Guide — Carbon Costume](https://carboncostume.com/samwise-gamgee/)
- [The Lord Of The Rings: 10 Hidden Details About Gandalf's Costume You Never Noticed](https://screenrant.com/the-lord-of-the-rings-gandalf-costume-details/)
- [Gandalf the Grey Costume Guide — Carbon Costume](https://carboncostume.com/gandalf-the-grey/)
- [The Lord of the Rings: 10 Hidden Details About Aragorn's Costume You Never Noticed](https://screenrant.com/lord-rings-aragorn-costume-details/)
- [Dress Like Legolas Costume Guide — Costume Wall](https://costumewall.com/dress-like-legolas/)
- [Legolas — Alley Cat Scratch](https://www.alleycatscratch.com/lotr/Elf/Legolas.htm)
- [I Tested the Ultimate Gimli Lord of the Rings Costume — joyrossdavis.com](https://joyrossdavis.com/gimli-lord-of-the-rings-costume/)
- [Gollum — Wikipedia](https://en.wikipedia.org/wiki/Gollum)
- [What Color was Gollum? — Middle-earth & J.R.R. Tolkien Blog](https://middle-earth.xenite.org/what-color-was-gollum/)
- [The Story of a Seamstress: The Boromir Costume](http://storyofaseamstress.blogspot.com/2010/10/boromir-costume.html)
- [Boromir Costume Guide — Carbon Costume](https://carboncostume.com/boromir/)
