# Avatar Pack: Pop Culture > TV Shows > Game of Thrones

**Path**: Pop Culture / TV Shows / Game of Thrones
**Style**: Stylized geometric toon homage figures in the Diorama Sims-toon rig
(primitives + `MeshToonMaterial`, flat banded shading, dark cartoon outlines,
oversized head/hands, green plumbob). This pack evokes the show's houses and
silhouettes through **color + shape only** — no textures, no logos, no
likenesses, no printed sigils. Every member uses a descriptive-generic
`label`; the actual character identity lives in the `Reference` line only.

This is the **regeneration-ready source of truth** for the pack's data file.
Re-run pack generation from this doc; do not hand-edit the generated data
file without updating this doc first.

## Overview

- **Group**: the eight most-recognized principal characters of *Game of
  Thrones* (2011–2019) — spanning House Stark (honor, the North, grey/fur),
  House Lannister (wealth, ambition, crimson/gold), House Targaryen (exile,
  dragons, silver/pale), and the Night's Watch (duty, black). A casual-fan
  primary-cast list, not the full sprawling ensemble.
- **Hierarchy path**: `Pop Culture / TV Shows / Game of Thrones`
- **Member count**: 8
- **Rig**: humanoid only (no direwolves/dragons — those are non-cast
  creatures, not part of the primary human ensemble this pack targets)
- **Design call — fixed costume colors, not sensor-tint carriers**: like
  `tv-friends`, `tv-seinfeld`, and `tv-big-bang-theory`, this is a
  named-character homage pack, not a generic archetype pack — "which
  specific character is this" lives in a fixed per-member palette (Stark
  grey/fur, Lannister crimson/gold, Targaryen pale silver, Night's Watch
  black). `skin`/`body`/`legColor` are FIXED hex values per member, not
  `tint`. If per-sensor color coding matters for a given deployment, recolor
  a small accent piece instead (brooch, sash, pendant) — none of the members
  below use a tint carrier by default.
- **Member-selection notes**: the eight chosen (Jon Snow, Daenerys
  Targaryen, Tyrion Lannister, Cersei Lannister, Arya Stark, Sansa Stark,
  Jaime Lannister, Eddard "Ned" Stark) are the characters a casual viewer
  names first and who anchor the show's marketing/poster art across its
  run. Omitted on purpose: Sandor "The Hound" Clegane, Brienne of Tarth,
  Samwell Tarly, Petyr Baelish, Bran Stark, and Jorah Mormont — all
  well-known, but each one notch below the eight above in general-audience
  recall, and 8 sits comfortably inside the 5–12 primary-cast band without
  padding it out with secondary players.
- **House palette** (fixed per-member below, shown here as the shared
  reference so members build as one recognizable ensemble; ONE signature
  prop/accessory per character carries the actual recognition load once
  house colors are shared across siblings):

  | Swatch | Hex | Use |
  |---|---|---|
  | Night's Watch / deep black | `0x1c1c1c` | Jon's furs, Ned's cloak base |
  | Stark grey-blue | `0x3a3c40` | Sansa's gown, northern doublets |
  | Lannister crimson | `0x7a1420` | Cersei's gown, Jaime's cloak |
  | Lannister/Kingsguard gold | `0xc9a227` | Jaime's armor, Tyrion's chain, brooches |
  | Targaryen pale silver | `0xe4e8ec` | Daenerys's gown |
  | Warm skin midtone | `0xd9ac82` | shared skin base, tuned ±1 shade per member |
  | Dark leather brown | `0x342a1e` | Arya's, Ned's practical leathers |

- **Two siblings, one palette, one prop**: Cersei and Jaime share the
  Lannister crimson/gold family and Sansa/Arya/Ned share Stark grey/brown —
  in both cases the pack leans on ONE unmistakable signature accessory per
  character (Jaime's golden hand, Tyrion's Hand-of-the-Realm chain +
  goblet, Arya's needle-thin blade vs. Ned's oversized greatsword) so
  same-house members stay distinguishable at a glance, the same technique
  `movies-lotr` uses for Frodo vs. Sam's shared hobbit palette.

## Members

### 1. `tv-game-of-thrones/black-cloak-ranger` — "Night Watchman (black furs, wolf-pommel sword)"

**Reference**: Jon Snow — Ned Stark's presumed bastard son, sworn brother and
eventually Lord Commander of the Night's Watch, later King in the North.
Dark curly hair, near-permanent stubble, stoic bearing; wears black
fur-trimmed leather-and-wool through nearly the entire show and carries the
Valyrian steel sword Longclaw (distinctive wolf's-head pommel) slung across
his back. (Jon Snow.)

**Spec**
```
sk: 1.0
headR: 124
skin: 0xd9a878
body: 0x1c1c1c        // black Night's Watch leather/wool
legColor: 0x222222
shoe: 0x1a1a1a
eyes: 'dots'
emI: 0
limbR: 1.0
```

**Accessories**
- `crown` — dark curly hair, low rounded cap, `~64×30×64mm`, `0x241a10`.
- `face` — stubble, thin flat box, `~50×18×6mm`, `0x2a2018`.
- `back` — black fur-trimmed cloak, flattened cone, `~180×260×40mm`,
  `0x141414`, with a proud grey-fur collar strip at the top edge,
  `~120×22×20mm`, `0x4a4038`, 3 mm proud of the cloak surface.
- `back` (second primitive, same anchor) — Longclaw slung diagonally, a
  thin long box blade `~14×420×10mm`, `0xb0b0ac`, plus a tiny wolf-head
  pommel bit, `~18mm` sphere, `0xcfd0c8`.

**Silhouette check**: an almost entirely black silhouette (furs, hair,
boots) broken only by the pale grey fur collar and the diagonal sword
across the back reads instantly as "Night's Watch" at 30 px; the wolf-head
pommel is a close-range confirm.

**Personality**: `bobMul: 1.0, swayMul: 0.85, cadenceMul: 0.95, ampMul: 1.0`
(a steady, grim soldier's stride — no swagger)
**Bubbles**: `🐺⚔️❄️😔` (direwolf loyalty, oathbound duty, the cold beyond
the Wall, brooding melancholy)

---

### 2. `tv-game-of-thrones/silver-braided-queen` — "Silver-Haired Queen (pale gown, braided crown)"

**Reference**: Daenerys Targaryen — exiled Targaryen princess who rises
through the Dothraki khalasar to become "Mother of Dragons" and, eventually,
a claimant to the Iron Throne. Signature platinum-silver hair worn in
elaborate braids, pale white/silver-blue flowing gowns, and near-constant
dragon iconography. (Daenerys Targaryen.)

**Spec**
```
sk: 0.94
headR: 116
skin: 0xe8c4a0
body: 0xe4e8ec        // pale silver-white gown
legColor: 0xe4e8ec
shoe: 0xe4e8ec
eyes: 'almond'
emI: 0
limbR: 0.82
armL: 0.9
```

**Accessories**
- `crown` — platinum-silver braided updo, rounded dome, `~130×70×130mm`,
  `0xe8e4d0`, with two small proud ridge boxes (`~50×10×14mm` each) sweeping
  back from the temples to suggest the braid pattern — the closest
  approximation the rig has to true plaiting (see Rig gaps).
- `head` (both sides) — long straight hair falling past the shoulders, two
  elongated flattened teardrop shapes, `~36×150×26mm` each, same `0xe8e4d0`.
- `chest` — a small dark disc pendant with a subtle warm glint, `~20mm`,
  `0x3a4a6a`, `emissiveIntensity: 0.1` — the dragon-egg/dragon-motif nod
  that is the ONE saturated accent against her otherwise pale look.
- `back` — pale cape, flattened cone, `~160×220×30mm`, `0xd8dce0`.

**Silhouette check**: the platinum-braided crown against an all-pale, flowing
gown silhouette is the one thing that reads at 30 px — a near-monochrome
figure against every other member's darker or brighter palette.

**Personality**: `bobMul: 0.85, swayMul: 0.75, cadenceMul: 0.9, ampMul: 0.85`
(a regal, composed carriage — deliberate, unhurried)
**Bubbles**: `🐉🔥👑😤` (dragons, fire and blood, sovereign ambition,
defiant resolve)

---

### 3. `tv-game-of-thrones/clever-small-lord` — "Clever Small Lord (Hand's chain, wine goblet)"

**Reference**: Tyrion Lannister — the youngest Lannister sibling, a person
of short stature, whip-smart and wine-loving; serves as Hand of the King
and later Hand of the Queen, marked by the ceremonial chain of clasped
hands worn by whoever holds that office. Known for his wit, his reading,
and rarely being seen without a cup of wine. (Tyrion Lannister.)

**Spec**
```
sk: 0.75          // adult short stature — proportioned, not child-scaled
headR: 130         // canonically oversized head is part of the read
skin: 0xd9a878
body: 0x8a1c24     // rich Lannister crimson doublet
legColor: 0x2a2420
shoe: 0x2a2420
eyes: 'dots'
emI: 0
limbR: 1.15         // stocky build
```

**Accessories**
- `crown` — short reddish-blond hair, low cap, `~68×22×68mm`, `0xb08850`.
- `face` — short goatee, thin box, `~40×22×6mm`, `0x9a7040`.
- `chest` — the Hand-of-the-Realm chain: a ring of 6 small linked discs,
  `~14mm` each, `0xb8860a`, arcing across the collarbone 3 mm proud of the
  doublet.
- `handR` — a wine goblet, a short wide cylinder rim `~26×10×26mm`,
  `0xb0985a` metal, with a shallow dark-red "wine" fill disc on top,
  `~20mm`, `0x5c1a20`.

**Silhouette check**: the visibly stocky `sk 0.75` build — noticeably
shorter than every other adult in the ensemble — combined with the gold
Hand's chain and ever-present goblet reads unmistakably even before the
face is legible; height alone separates him from the rest of the pack.

**Personality**: `bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.0, ampMul: 0.95`
(a confident, slightly rolling gait — unhurried despite his stature)
**Bubbles**: `🍷😏📜🧠` (wine, wry wit, books and schemes, sharp intellect)

---

### 4. `tv-game-of-thrones/golden-lioness-queen` — "Golden Lioness (crimson-gold gown, braided crown)"

**Reference**: Cersei Lannister — eldest Lannister sibling, Queen Regent
and later Queen of the Seven Kingdoms; fiercely protective of her children
and ruthless in holding power. Known for elaborate golden braided
hairstyles and rich crimson-and-gold gowns dense with lion motifs (later
seasons shift toward darker, more severe "queen" looks). (Cersei Lannister.)

**Spec**
```
sk: 1.0
headR: 118
skin: 0xe6c0a0
body: 0x7a1420       // deep Lannister crimson gown
legColor: 0x7a1420
shoe: 0x6a1218
eyes: 'almond'
emI: 0
limbR: 0.85
armL: 0.85
```

**Accessories**
- `crown` — elaborate golden braided updo, a wide flattened dome,
  `~140×74×144mm`, `0xd4af5a`, with two small proud ridge boxes
  (`~46×10×16mm`) suggesting the fan-braided pattern (same approximation
  technique as `silver-braided-queen`, see Rig gaps).
- `chest` — a gold lion pendant/brooch, small disc, `~24mm`, `0xc9a227`,
  proud of the gown.
- `hip` — a gold filigree belt, thin box, `~200×20×8mm`, `0xc9a227`.
- `back` — a long train/cape in a darker crimson, flattened cone,
  `~170×240×30mm`, `0x5a0f16`.

**Alt palette — "the Queen's black armor"** (late-series look, same
accessories, recolor only): `body → 0x1c1a1e` (severe black gown), belt
`→ 0x2a2a2a`, cape `→ 0x141216`, keep the gold lion brooch as the ONE
carryover accent so the character stays identifiable across eras. Same id,
documented palette swap rather than a second member (same technique
`movies-lotr` uses for Gandalf the White).

**Silhouette check**: the golden braided crown atop a rich crimson-gold
gown reads as "the queen" instantly; the gold lion brooch is the
close-range confirm distinguishing her from Sansa/Daenerys's paler looks.

**Personality**: `bobMul: 0.8, swayMul: 0.6, cadenceMul: 0.85, ampMul: 0.8`
(a slow, imperious glide — total composure)
**Bubbles**: `🦁👑🍷😈` (lion-house pride, sovereign entitlement, wine,
ruthless calculation)

---

### 5. `tv-game-of-thrones/scrappy-blade-wanderer` — "Scrappy Wanderer (leather jacket, needle-thin blade)"

**Reference**: Arya Stark — the tomboyish younger Stark daughter, skilled
with a blade from childhood; trains as an assassin with the Faceless Men
across the back half of the show. Signature thin fencing sword "Needle"
always at her hip, practical leather/roughspun travel clothes, hair
typically pulled back rather than styled. (Arya Stark.)

**Spec**
```
sk: 0.85
headR: 112
skin: 0xd9ac82
body: 0x4a3c2e     // brown leather jacket over roughspun
legColor: 0x38302a
shoe: 0x2e2620
eyes: 'dots'
emI: 0
limbR: 0.85
armL: 0.85
```

**Accessories**
- `crown` — dark brown hair pulled back off the face, small low cap,
  `~58×18×58mm`, `0x241a12`.
- `back` — a short ponytail, thin tapered cylinder trailing the neck,
  `~14×80×14mm`, `0x241a12`.
- `hip` — a plain leather sword belt with scabbard, thin box `~150×18×8mm`
  `0x3a2e22` plus a slim scabbard tip cylinder `~10×90×10mm` `0x9a9690`.
- `handR` — Needle, a very thin long cylinder blade, `~6×260×6mm`,
  `0xb8b8b4`, with a tiny dark hilt cap, `~16mm`, `0x2a221a` — the pack's
  most load-bearing prop for this member (see Silhouette check).

**Silhouette check**: the smaller `sk 0.85` build in plain brown leather is
already the youngest-reading silhouette in the pack, but it's the
needle-thin rapier blade at the hip that locks in "Arya" specifically —
without it she could pass as any young Northern traveler.

**Personality**: `bobMul: 1.1, swayMul: 0.9, cadenceMul: 1.2, ampMul: 1.0`
(a light, quick, watchful step — always ready to move)
**Bubbles**: `🗡️🐺😠🤫` (blade practice, direwolf/pack loyalty, simmering
anger, stealthy secrecy)

---

### 6. `tv-game-of-thrones/northern-fur-lady` — "Northern Lady (fur-mantled gown, long red hair)"

**Reference**: Sansa Stark — the eldest Stark daughter, who survives years
as a political hostage in King's Landing before returning north to become
Lady of Winterfell and eventually Queen in the North. Signature long
straight auburn-red hair; in her later seasons wears an armor-like
fur-trimmed mantle that visually marks her authority over the North.
(Sansa Stark.)

**Spec**
```
sk: 0.98
headR: 116
skin: 0xe8c4a0
body: 0x3a3c40      // dark grey-blue northern gown
legColor: 0x3a3c40
shoe: 0x362e28
eyes: 'almond'
emI: 0
limbR: 0.85
armL: 0.88
```

**Accessories**
- `crown` — long straight auburn-red hair, rounded dome, `~124×62×124mm`,
  `0x9a3c22`.
- `back` — hair length trailing down the back, thin tapered cylinder,
  `~60×190×34mm`, same `0x9a3c22`.
- `shoulderL` / `shoulderR` — pale fur mantle epaulets, two small
  flattened ellipsoid tufts, `~70×40×60mm` each, `0xc8c4b8`, proud of the
  gown shoulder line — the "armor of authority" read.
- `chest` — a silver direwolf brooch clasp, small disc, `~22mm`,
  `0xb8bcc0`.

**Silhouette check**: the long straight red hair against pale fur-mantled
shoulders is the one thing that reads at 30 px — the fur-collar "armor"
silhouette is unique to her among the Stark women in this pack (Arya wears
plain leather, no fur).

**Personality**: `bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.9, ampMul: 0.85`
(a composed, deliberately poised carriage — hard-won self-control)
**Bubbles**: `👑🐺❄️😌` (hard-won authority, direwolf/Stark loyalty, the
North, quiet vindication)

---

### 7. `tv-game-of-thrones/golden-hand-knight` — "Golden Knight (gold armor, golden hand)"

**Reference**: Jaime Lannister — Cersei's twin brother, a celebrated knight
of the Kingsguard nicknamed "the Kingslayer" after killing the Mad King he
was sworn to protect. Golden-haired, wears ornate gold Lannister plate
under a crimson cloak; after losing his sword hand partway through the
show, wears a conspicuous gilded prosthetic in its place. (Jaime Lannister.)

**Spec**
```
sk: 1.0
headR: 122
skin: 0xd9ac82
body: 0xc9a227      // gold Lannister plate armor
legColor: 0x3a2e22
shoe: 0x2e2620
eyes: 'dots'
emI: 0
limbR: 1.0
armL: 1.0
```

**Accessories**
- `crown` — short golden wavy hair, low rounded cap, `~64×20×64mm`,
  `0xd4af5a`.
- `back` — crimson Kingsguard-style cloak, flattened cone, `~170×250×36mm`,
  `0x8a1420`.
- `chest` — a small proud lion breastplate emblem, disc, `~26mm`,
  `0xf0e6c0`.
- `handR` — the golden prosthetic hand: recolor the hand mesh itself,
  `0xe6c84a`, `emissiveIntensity: 0.15` so it catches a distinct glint
  other members' hands don't — the single unambiguous tell for this
  character (see Silhouette check).

**Silhouette check**: gold-plated armor plus a crimson cloak already reads
"Lannister knight" (sharing the house palette with Cersei/Tyrion), but the
one glinting golden hand is the unique, unmistakable detail that locks in
Jaime specifically.

**Personality**: `bobMul: 1.0, swayMul: 0.85, cadenceMul: 0.95, ampMul: 1.0`
(a confident knight's stride with a roguish ease)
**Bubbles**: `🦁⚔️🍷😏` (lion-house pride, swordsmanship, wine, a wry
half-smile)

---

### 8. `tv-game-of-thrones/honorbound-northern-lord` — "Honorbound Lord (grey fur cloak, oversized greatsword)"

**Reference**: Eddard "Ned" Stark — honor-bound patriarch of House Stark,
Lord of Winterfell and briefly Hand of the King. Recognized by his
weathered dark hair and beard, plain brown-grey leathers under a heavy
grey-fur-trimmed black cloak, and the ancestral Valyrian steel greatsword
Ice, notably larger than any other blade in the ensemble. (Ned Stark.)

**Spec**
```
sk: 1.0
headR: 124
skin: 0xd0a074
body: 0x3a342e      // dark brown-grey leather doublet
legColor: 0x2e2a24
shoe: 0x241e18
eyes: 'dots'
emI: 0
limbR: 1.05
```

**Accessories**
- `crown` — dark hair with grey streaks, low cap, `~62×24×62mm`, `0x2e241a`.
- `face` — short beard, box, `~46×30×8mm`, `0x342a1e`.
- `back` — heavy grey-fur-trimmed black cloak, flattened cone,
  `~190×270×42mm`, `0x18140f`, with a proud pale-fur-trim edge piece,
  `~130×24×22mm`, `0xc8c4b8`, at the collar.
- `chest` — a silver direwolf brooch clasp, small disc, `~22mm`,
  `0xb8bcc0`.
- `back` (second primitive) — Ice, an oversized greatsword slung
  diagonally, a long thin box blade `~18×480×12mm`, `0xacaca8` — visibly
  longer than Jon's Longclaw, the deliberate size cue for "the ancestral
  greatsword."

**Silhouette check**: the heavy grey-fur collar draping over a plain dark
cloak, plus the notably oversized greatsword silhouette on the back, reads
as "the honorable northern lord" and is distinct from Jon's leaner
Night's-Watch furs and shorter sword even in outline.

**Personality**: `bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.9`
(a grave, measured, dutiful stride)
**Bubbles**: `🐺⚔️❄️😐` (direwolf/Stark loyalty, sworn duty, the North,
stoic reserve)

## Rig gaps

- **No dedicated hair-braid/plait primitive.** Daenerys's and Cersei's
  signature elaborate braided hairstyles are approximated with a `crown`
  hair dome plus a couple of small proud ridge boxes hinting at plait
  lines, rather than any true braided-strand geometry. This extends the
  same gap `tv-friends` flagged ("no dedicated long hair attachment
  convention" — approximated via crown+head+back stacking); braiding
  specifically has no representation beyond flat ridge hints and reads
  correctly only at silhouette distance, not up close.
- **Situational costume swaps (alt-looks per member) — already parked in
  `docs/ROADMAP.md` § Avatar rig gaps.** Several members have
  well-known alternate eras (Cersei's late-series black armor gown,
  Jaime's white-vs-gold Kingsguard cloak, Daenerys's many gown eras). This
  pack documents ONE alt palette (Cersei's black "queen" look) as a
  callable recolor on the same id, the same workaround `movies-lotr` used
  for Gandalf the White — confirming this is the right pattern until a
  first-class alt-look field exists.
- **No fabric-pattern/sigil-decal support** (deliberate, expected — the
  rig is color+shape only; same gap flagged in every prior named-cast
  pack). House sigils (Stark direwolf, Lannister lion, Targaryen dragon)
  that the show usually renders as embroidery/banners/shield emblems are
  approximated here as small solid-color brooch/pendant disc accessories
  instead — this reads fine at 30 px but loses the actual heraldic imagery.
- **No neck/collar-band anchor** (recurring gap, also flagged in
  `tv-seinfeld`/`tv-big-bang-theory`/`tv-friends`): fur collars (Jon,
  Ned) and mantle epaulets (Sansa) are approximated as small accessories
  bolted onto `back`/`shoulderL`/`shoulderR` rather than a true
  neck-wrapping band anchor. Not blocking here.

None of the above blocked shipping a member — all eight have a complete,
distinguishable spec using only the current rig's primitives and anchors;
no new eye style or head shape was needed (all eight are ordinary humans
using existing `'dots'`/`'almond'` eyes and the default sphere head).

## Sources

- [Jon Snow Costume — Game of Thrones Costumes](https://gameofthronescostumes.net/jon-snow-costume/)
- [Longclaw – Jon Snow's Sword Replica — Museum Replicas](https://museumreplicas.com/longclaw-jon-snows-sword/)
- [Game of Thrones - Longclaw Sword of Jon Snow — Valyrian Steel](https://valyriansteel.com/shop/game-of-thrones/longclaw-sword-of-jon-snow/prod_35.html)
- [Daenerys Targaryen Costume Ideas — Game of Thrones Insider](https://gameofthronesinsider.com/daenerys-targaryen-costume/)
- [Costumes/Major characters — Wiki of Westeros (Fandom)](https://gameofthrones.fandom.com/wiki/Costumes/Major_characters)
- [How to Cosplay Daenerys Targaryen — Eyecandys](https://eyecandys.com/blogs/news/cosplay-daenerys-targaryen)
- [Tyrion Lannister Costume — Seven Kingdoms of Westeros](https://sevenkingdomsofwesteros.com/tyrion-lannister-costume/)
- [Tyrion Lannister wore a Hand of the King chain — Wiki of Thrones](https://wikiofthrones.com/tyrion-lannister-hand-of-the-king-chain-criston-coles-battle-of-blackwater)
- [Cersei Lannister's Character Evolution, Told Through Her Wardrobe — TheWrap](https://www.thewrap.com/cersei-lannisters-style-evolution/)
- [Cersei Lannister's Fashion Evolution — Bustle](https://www.bustle.com/articles/89848-cersei-lannisters-fashion-evolution-through-game-of-thrones-and-how-her-wardobe-mirrors-her-character)
- [Game of Thrones: 10 Hidden Details About Cersei Lannister's Costume — ScreenRant](https://screenrant.com/cersei-lannister-game-of-thrones-hidden-details-costumes/)
- [Game of Thrones - Needle - Sword of Arya Stark — Kult of Athena](https://www.kultofathena.com/product/game-of-thrones-needle-sword-of-arya-stark/)
- [Arya Stark's Fashion Evolution — Bustle](https://www.bustle.com/articles/85949-arya-starks-fashion-evolution-through-game-of-thrones-and-how-her-wardrobe-mirrors-her-character)
- [Arya Stark Costume — Seven Kingdoms of Westeros](https://sevenkingdomsofwesteros.com/arya-stark-costume/)
- [Sansa Stark's Fashion Evolution — Bustle](https://www.bustle.com/articles/85163-sansa-starks-fashion-evolution-through-game-of-thrones-and-how-her-wardrobe-mirrors-her-character)
- [Dressing Game of Thrones: The Telling Story in Sansa Stark's Fashion — The Fashion Studies Journal](https://www.fashionstudiesjournal.org/longform/2020/4/26/sansa-stark)
- [Game of Thrones' Sansa Stark's Style Evolution — Marie Claire](https://www.marieclaire.com/celebrity/news/g4950/game-of-thrones-sansa-stark-fashion-evolution/)
- [Ideas for making Jaime Lannister's golden hand — The RPF](https://www.therpf.com/forums/threads/ideas-for-making-jaime-lannisters-golden-hand-from-game-of-thrones.250334/)
- [Game of Thrones: 10 Hidden Details About Jaime Lannister's Costume — ScreenRant](https://screenrant.com/game-of-thrones-jaime-lannister-hidden-facts/)
- [Jaime and Cersei Lannister — Morgothia Costuming](http://morgothiacostuming.blogspot.com/p/jaim.html)
- [Ned Stark Costume Guide — GoGoCosplay](https://gogocosplay.com/ned-stark-costume/)
- [Eddard Stark — A Wiki of Ice and Fire](https://awoiaf.westeros.org/index.php/Eddard_Stark)
- [Game of Thrones Cosplay Guide: How to Dress Like a Stark — UrCosplay](https://urcosplay.com/game-of-thrones-cosplay-guide-how-to-dress-like-a-stark-and-stand-out/)
- Diorama source reference (existing rig conventions, anchors, `SPECS`
  table, per-kind accessory recipes): `src/three-renderer.ts`
  (`_buildHumanoid`, `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`);
  prior pack docs `docs/avatars/pop-culture/tv-friends.md` and
  `docs/avatars/pop-culture/movies-lotr.md` for anchor/recipe precedent and
  the alt-palette/long-hair approximation techniques reused here.
