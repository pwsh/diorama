# Avatar pack: Pop-Culture ▸ TV ▸ Friends

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color/proportions read as the character archetype, not a likeness.
No logos, no printed text, no character names anywhere in-scene; identity
lives only in this doc's Reference lines and the pack's display labels (which
use descriptive-generic wording, e.g. "Paleontologist (sweater vest)").

## Overview

- **Group**: The six-friend Manhattan ensemble cast of *Friends* (1994–2004) —
  a paleontologist, a chef, a fashion-industry professional, a struggling
  actor, a masseuse/musician, and a statistical-analysis executive who share
  a Greenwich Village apartment building and a coffeehouse hangout. The
  show's visual comedy leans on **90s NYC casual with one strong hair/costume
  signifier per character** (Ross's sweater vests, Monica's sleek dark bob,
  Rachel's flipped-layer haircut, Joey's leather jacket, Phoebe's long blonde
  waves + boho layers, Chandler's sweater-vest-and-tie office look) — this
  pack uses the same anchor points other packs use for costume reads: `crown`
  (hair/hats), `head` (side hair), `back` (long hair length / capes), `chest`/
  `torso-front` (shirt layer + emblem accents), `hip` (belts/vests), `hand`
  (character props).
- **Hierarchy path**: `pop-culture / tv / friends`
- **Member count**: 6
- **Rig**: humanoid only (no quadrupeds — Marcel the monkey and the ducks/
  chick are one-off gags, not core cast)
- **Design call — fixed costume colors, not sensor-tint carriers**: like
  `pop-culture/tv/seinfeld` and `pop-culture/tv/big-bang-theory`, this is a
  named-character homage, not a generic archetype pack — "which specific
  friend is this" lives in a fixed per-member palette (Ross's burgundy
  sweater vests, Monica's chef whites, Rachel's pastel 90s separates, Joey's
  black leather, Phoebe's mustard/rust boho layers, Chandler's navy sweater
  vest + tie). `skin`/`body`/`legColor` are FIXED hex values per member, not
  `tint`. If per-sensor color coding matters for a given deployment, recolor
  a small accent piece instead (tie, belt, hair accent) — none of the members
  below use a tint carrier by default.
- **Shared palette note — 90s NYC casual**: warm neutrals throughout (cream,
  camel, burgundy, olive, mustard, denim blue, charcoal) with each member's
  ONE loud signifier layered on top — Ross's vest color, Monica's stark chef
  white, Rachel's pastel-fashion palette, Joey's all-black leather, Phoebe's
  earthy boho mix, Chandler's tie. Kept deliberately plain below the neck so
  the hair silhouette (the pack's real differentiator — see each member's
  Silhouette check) reads clearly against a quiet outfit.
- **Hair is the primary read for four of six members.** Because the source
  show's six leads dress in broadly similar 90s-casual layers, this pack
  leans harder on `crown`/`head`/`back` hair-shape variety than most packs —
  Monica's blunt dark bob, Rachel's flipped shoulder-length shag, Phoebe's
  long wavy blonde locks, and Chandler's/Joey's/Ross's shorter neat-vs-messy
  cuts are all built from distinct primitive assemblies (see each Spec) so
  the six read apart from each other even before costume color is factored
  in.

## Members

### 1. `paleontologist-ross` — "Paleontologist (burgundy sweater vest)"

**Reference**: A paleontologist at the Museum of Natural History and tenured
NYU professor — signature look is a sweater vest (or turtleneck/knit
sweater) over a collared shirt in warm browns/burgundy/navy, with a running
gag about his obsessive love of dinosaurs. (Ross Geller.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xe0b090
body: 0x7a2a30       // burgundy sweater vest over a visible white collar
legColor: 0x5a4632    // brown corduroy trousers
shoe: 0x4a3624        // brown loafers
eyes: 'dots'
emI: 0
limbR: 0.95
hands: 'sphere'
```

**Accessories**
- **crown** — short, neat brown hair with a side part: a low flattened cap,
  ~`124×32×124mm`, `0x2e1c12`, front rim above the brow.
- **chest** — visible white shirt collar peeking above the vest: two small
  flat wedge boxes, `~26×14×6mm` each, `0xf2ede0`, angled outward at the
  neckline before the burgundy vest color takes over below.
- **hand** — a small dinosaur bone/fossil prop: a slim curved cylinder,
  `~50×14×14mm`, bone-white `0xe8dfc8`, held in one hand — the pack's most
  load-bearing prop for this member (see Silhouette check).

**Silhouette check**: sweater vest + peeking white collar reads as "office
academic," but it's the small hand-held fossil/bone prop that locks in
"paleontologist" specifically at a glance — without it he could pass as any
buttoned-up 90s office guy.

**Personality**: `bobMul: 1.0, swayMul: 1.15, cadenceMul: 1.0, ampMul: 1.05`
(a slightly fussy, over-explaining energy — a touch more upper-body sway than
a plain walk, never frantic)
**Bubbles**: `🦕🦴📚😬` (dinosaur obsession, fossil digs, academic
over-explaining, awkward second-guessing)

---

### 2. `chef-monica` — "Chef (dark bob, chef whites)"

**Reference**: A competitive, detail-obsessed chef known for her cleanliness
and perfectionism — signature look is a sleek dark bob (voluminous with
bangs in early seasons, longer and sleeker later) and, on the job, crisp
white chef's whites over dark trousers. (Monica Geller.)

**Spec**
```
sk: 0.96
headR: 120
headShape: 'sphere'
skin: 0xe0b090
body: 0xf2f0ea       // white double-breasted chef coat
legColor: 0x232323    // black chef trousers
shoe: 0x1c1c1c        // black clogs
eyes: 'dots'
emI: 0
limbR: 0.9
armL: 0.95
```

**Accessories**
- **crown** — dark bob hair with a blunt, flat-bottomed edge at jaw height: a
  wide flattened dome, `~136×88×140mm`, near-black brunette `0x1c1410`, cut
  sharply straight along the bottom rim (no taper) rather than rounded —
  the blunt edge is what reads as "bob" vs. a generic hair-dome.
- **torso-front** — white bib apron over the chef coat: a flat rectangular
  panel proud of the chest, `TORSO_W*0.85 × TORSO_H*0.8 × 8mm`, off-white
  `0xf8f6f0`, with a thin dark waist-tie hint (`0x2a2a2a`) at the bottom edge.
- **hand** — a small whisk/wooden-spoon prop: a thin cylinder with a tiny
  looped tip, `~55×12×12mm`, warm wood tone `0x9a7040`.

**Silhouette check**: the blunt dark bob is the one thing that reads at 30 px
even without the chef whites (it's her defining hair silhouette across all
ten seasons); the white coat + apron confirms "chef" specifically.

**Personality**: `bobMul: 0.9, swayMul: 0.8, cadenceMul: 1.2, ampMul: 0.9`
(a brisk, controlled, purposeful walk — competitive energy with tight,
efficient motion rather than loose swagger)
**Bubbles**: `🍳🧽✨😤` (cooking/plating perfectionism, obsessive cleaning,
sparkle-eyed competitiveness, exasperated control-freak energy)

---

### 3. `fashionista-rachel` — "Fashionista (flipped-layer haircut)"

**Reference**: A fashion-industry professional (starts as a Central Perk
waitress, becomes a Bloomingdale's/Ralph Lauren buyer) whose shoulder-length,
face-framing layered haircut became a real-world 90s phenomenon — pastel and
neutral 90s separates, always put-together. (Rachel Green; the haircut is
"The Rachel.")

**Spec**
```
sk: 0.94
headR: 116
headShape: 'sphere'
skin: 0xe6b89c
body: 0xdcb8c4       // blush-pink cropped cardigan/blouse
legColor: 0xe8dcc8    // cream high-waisted trousers
shoe: 0xf0ece0        // cream flats
eyes: 'almond'
emI: 0
limbR: 0.82
armL: 0.92
```

**Accessories**
- **crown** — honey-blonde/light-brown layered hair with volume at the crown:
  a rounded dome, `~130×70×130mm`, `0x8a5c34`, tapering down toward the
  shoulders.
- **head** (both sides) — the signature flipped-out layer ends at jaw/
  shoulder height: two flattened wedge-box "flips" angled outward away from
  the face, `~46×30×20mm` each, same `0x8a5c34`, positioned at ear height
  and jaw height on each side — this is the specific detail that makes the
  cut read as "The Rachel" rather than a generic bob.
- **hand** — a small shopping-bag prop: a thin flattened box with two loop
  handles, `~50×60×18mm`, cream `0xf5efe0` with a thin pink ribbon line
  accent, `0xdcb8c4`.

**Silhouette check**: the flipped, face-framing layered hair silhouette (the
outward-angled "wings" at ear/jaw height) is the one thing — the real-world
haircut this member homages was famous enough to be voted the most
influential haircut of all time, and it's the single most recognizable
"Rachel" tell at any distance.

**Personality**: `bobMul: 1.0, swayMul: 1.25, cadenceMul: 1.0, ampMul: 1.1`
(a confident, fashion-forward strut with more hip sway than the group
average)
**Bubbles**: `👗☕💅` (fashion/shopping enthusiasm, coffeehouse hangout
energy, put-together vanity)

---

### 4. `actor-joey` — "Actor (black leather jacket)"

**Reference**: A charming, food-loving struggling actor (later finds
success on a soap opera) — signature look is a black leather jacket over a
plain shirt or turtleneck with blue jeans, easygoing and confident. (Joey
Tribbiani.)

**Spec**
```
sk: 1.06
headR: 128
headShape: 'sphere'
skin: 0xd8a878
body: 0x1c1a18       // black leather jacket
legColor: 0x2e4258    // mid-wash denim jeans
shoe: 0x2a2a2a        // black boots
eyes: 'dots'
emI: 0
limbR: 1.05
armL: 1.0
```

**Accessories**
- **crown** — short, dark wavy hair: a rounded cap with 3–4 shallow ridge
  bumps suggesting waves, `~128×36×128mm`, `0x241a10`.
- **chest** — leather jacket lapels/collar: two flat angled wedge boxes at
  the collarbone, `~34×20×10mm` each, same `0x1c1a18` but a shade lighter
  (`0x2a2622`) to read as a popped collar against the torso base.
- **hand** — a sandwich prop (Joey's love of food is a running gag): a
  small rounded box with visible layered color bands, `~46×26×30mm`, bread
  tan `0xd8b878` / filling accents `0xc9524a` + `0xdec95a`.

**Silhouette check**: the all-black leather jacket silhouette with the
popped-collar wedge accents is the one thing — reads instantly as "the cool
one" even in profile; the sandwich prop is a close-up personality bonus.

**Personality**: `bobMul: 1.05, swayMul: 1.15, cadenceMul: 0.92, ampMul: 1.1`
(a relaxed, confident swagger — unhurried but with a bit of extra shoulder
roll)
**Bubbles**: `🍕📺😏` (constant food cravings, acting/soap-opera aspirations,
easy confident smirk)

---

### 5. `masseuse-phoebe` — "Quirky Masseuse (long blonde waves, boho layers)"

**Reference**: An eccentric, warm-hearted masseuse and amateur folk musician
known for her long blonde wavy hair, vintage/boho thrift-store fashion in
earthy tones, off-beat humor, and her signature original song "Smelly Cat."
(Phoebe Buffay.)

**Spec**
```
sk: 0.92
headR: 118
headShape: 'sphere'
skin: 0xe6c0a0
body: 0xb8863a       // mustard/rust fringed vest over a cream blouse
legColor: 0x6a5a3a    // olive/rust skirt
shoe: 0x8a6a3a        // tan suede boots
eyes: 'almond'
emI: 0
limbR: 0.8
armL: 0.95
```

**Accessories**
- **crown** — long blonde wavy hair, top volume: a full rounded dome,
  `~136×90×136mm`, `0xd8c078` (warm blonde), tilted back so the front rim
  clears the brow.
- **head** (both sides) — long hair sides falling past the shoulders: two
  elongated flattened teardrop/box shapes running from ear height down past
  shoulder level, `~40×140×30mm` each, same `0xd8c078`.
- **back** — long hair length trailing down the back (reuses the cape/back
  anchor as a hair-length piece — see Rig gaps): a thin, softly tapered
  cylinder/cone, `~70×220×40mm`, same `0xd8c078`, following the spine down
  to roughly mid-back.
- **hip** — a fringed vest hem: a ring of thin short dangling box "fringe"
  strips around the lower vest edge, `~10×60×4mm` each, same `0xb8863a`
  base tone, slightly darker (`0x9a7028`).
- **hand** — a small acoustic-guitar prop: a flattened figure-eight box body
  (`~90×130×20mm`, warm wood `0xa87840`) with a thin neck cylinder
  (`~10×90×10mm`, darker wood `0x6a4a28`) — a direct nod to her signature
  musical numbers.

**Silhouette check**: the long, full blonde wavy hair (crown + side + back
pieces together) against a boho earth-tone vest is the one thing that reads
at 30 px; the guitar prop is the close-up confirmation this is specifically
the folk-singing masseuse and not just "the blonde one."

**Personality**: `bobMul: 1.3, swayMul: 1.3, cadenceMul: 1.1, ampMul: 1.2`
(the bounciest, most unpredictable gait in the pack — quirky, off-beat energy
across every multiplier)
**Bubbles**: `🎸🔮🌙😄` (guitar/music moments, new-agey mysticism, dreamy
whimsy, offbeat delighted laughter)

---

### 6. `statistician-chandler` — "Statistician (navy sweater vest, tie, sarcastic)"

**Reference**: An executive in "statistical analysis and data
reconfiguration" (a long-running joke that no one, including his friends,
understands or remembers his job title) — signature look is a sweater vest
over a collared shirt and tie with pleated slacks, deployed with constant
sarcastic one-liners as a defense mechanism. (Chandler Bing.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
skin: 0xdcb090
body: 0x2a3a5a       // navy sweater vest over a light collared shirt
legColor: 0x4a4640    // grey pleated slacks
shoe: 0x3a2e22        // brown office shoes
eyes: 'dots'
emI: 0
limbR: 0.9
armL: 0.95
```

**Accessories**
- **crown** — short, neat brown hair: a low tight cap, ~`122×28×122mm`,
  `0x2a1c12`.
- **chest** — sweater-vest V-neckline + tie: a V-shaped notch pair of thin
  angled boxes (lighter shirt color `0xe8e4d8` showing through the V,
  `~30×24×6mm` each) plus a thin vertical tie strip down the center,
  `~18×70×6mm`, muted burgundy `0x6a2a30`.
- **hand** — a small coffee-mug prop (a nod to the Central Perk hangout
  habit): a short flattened cylinder with a loop handle, `~40×46×40mm`,
  `0xe8e4d8` with a warm brown "coffee" fill disc on top, `0x4a2c18`.

**Silhouette check**: the navy V-neck sweater vest with the tie strip peeking
through is the one thing — a fussier, more buttoned-up office silhouette
than Joey's leather jacket or Ross's looser vest colors, reinforcing "the
sarcastic office guy" read.

**Personality**: `bobMul: 0.9, swayMul: 0.9, cadenceMul: 1.05, ampMul: 0.85`
(a slightly stiff, self-conscious walk — understated motion to match a
character whose humor is verbal deflection rather than physical comedy)
**Bubbles**: `😏☕🙄` (dry sarcastic smirk, coffeehouse hangout energy,
deflective eye-rolling)

## Rig gaps

- **No dedicated "long hair" attachment convention.** Phoebe's long wavy
  hair past the shoulders is approximated by stacking a `crown` dome + two
  `head`-anchor side pieces + a `back`-anchor trailing length piece (the
  `back` anchor is designed for capes/wings/shells, reused here as a hair
  shape). It reads correctly in silhouette but there's no first-class
  "hair length" concept distinct from the cape/cloak family it's borrowing
  from — a generalized long-hair primitive (already flagged conceptually in
  prior packs' cape/robe notes) would clean this up for any future
  long-haired character.
- **No fabric-pattern/print support** (expected — the rig is color+shape
  only; same gap flagged in `tv-seinfeld` and `tv-big-bang-theory`). Phoebe's
  vintage boho layers in the source material often mix prints/patterns —
  this pack approximates with solid earthy-tone color-blocking (vest + skirt
  + fringe) rather than any print, which reads fine at 30 px but loses the
  eclectic mixed-pattern detail up close.
- **No neck/collar anchor** (recurring gap, also flagged in `tv-seinfeld`/
  `tv-big-bang-theory`): Ross's peeking shirt collar and Chandler's
  V-neck-plus-tie are both approximated as small boxes bolted onto the
  `chest`/`torso-front` anchor rather than a true neck-wrapping band. Not
  blocking here, just recurring across office-attire characters.

None of the above blocked shipping a member — all six have a complete,
distinguishable spec using only the current rig's primitives and anchors;
no new eye style or head shape was needed (all six are ordinary humans using
existing `'dots'`/`'almond'` eyes and the default sphere head).

## Sources

- [Ross Geller — Wikipedia](https://en.wikipedia.org/wiki/Ross_Geller)
- [Ross Geller | Friends Central | Fandom](https://friends.fandom.com/wiki/Ross_Geller)
- [Monica Geller — Wikipedia](https://en.wikipedia.org/wiki/Monica_Geller)
- [Monica Geller Hair: The Definitive Ranking, By Season — Formulate](https://www.formulate.co/journal/p/monica-geller-hair)
- [See Monica Geller's Hair Transformation From Season 1 of 'Friends' — Distractify](https://www.distractify.com/p/monica-geller-hair)
- [The Rachel — Wikipedia](https://en.wikipedia.org/wiki/The_Rachel)
- [The Rachel Haircut: From 90s TV Icon to Modern Fashion Statement — Klaiyi](https://www.klaiyihair.com/blogs/blog/the-rachel-haircut-from-90s-tv-icon-to-modern-fashion-statement)
- [Rachel Green's Hairstyles in Friends: Every Look Decoded — Haiirology](https://www.haiirology.com/blog/hairstyles-of-rachel-green-in-friends)
- [Friends: Joey's 10 Best Outfits — ScreenRant](https://screenrant.com/friends-joey-tribbiani-best-outfits-fashion-style/)
- [Matt LeBlanc Friends season 7 Leather Jacket — LeatherCult](https://www.leathercult.com/products/matt-leblanc-friends-season-7-leather-jacket)
- [8 Phoebe Buffay Iconic Hair and Behind-the-Scenes Hair Secrets — Unice](https://www.unice.com/blog/phoebe-buffay-hairstyles/)
- [Phoebe Buffay's Best Outfits: The Fashion Icon of the 90s — Elin Manon](https://www.elinmanon.com/post/phoebe-buffays-best-outfits)
- [Chandler Bing — Wikipedia](https://en.wikipedia.org/wiki/Chandler_Bing)
- [Chandler Bing | Friends Central | Fandom](https://friends.fandom.com/wiki/Chandler_Bing)
- [Friends: What Is Chandler's Job? — Looper](https://www.looper.com/1417422/friends-what-chandler-job-matthew-perry/)
- Diorama source reference (existing rig conventions, anchors, `SPECS`
  table, per-kind accessory recipes): `src/three-renderer.ts`
  (`_buildHumanoid`, `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`);
  prior pack docs `docs/avatars/pop-culture/tv-seinfeld.md` and
  `docs/avatars/pop-culture/tv-big-bang-theory.md` for anchor/recipe
  precedent.
