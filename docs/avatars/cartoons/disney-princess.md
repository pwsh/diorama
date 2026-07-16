# Avatar pack: Cartoons ▸ Classic Ballgown Princesses

Hierarchy path: `docs/avatars/cartoons/disney-princess.md` → generated pack id
`cartoons/disney-princess`.

## Overview

A ten-member set of stylized, geometric toon-homage figures inspired by the
classic animated-princess archetype — **not** licensed characters, no
likenesses/logos/textures. Every member is built from the shared humanoid rig
(`_buildHumanoid`) using only primitive shapes (box/sphere/cylinder/cone) in
flat saturated colors, per the Sims-toon house style (`MeshToonMaterial`,
4-step gradient bands, dark cartoon outlines, oversized head/hands, green
plumbob overhead). Labels are descriptive-generic ("Ice Queen," "Beauty");
the actual character each one homages is named once in that member's
**Reference** line for the researcher/regenerator, never in the label or
in-game copy.

**Pack-wide base spec** (every member starts here, then overrides):
```ts
base: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.92 /* slightly slimmer than default adult */,
  hands: 'sphere', eyes: 'almond', steel: false, armL: 1, legL: 1, footMul: [1, 1, 1],
},
```
`limbR: 0.92` (vs. the `adult` kind's `1.0`) gives the whole pack a touch of
storybook daintiness without a new rig field — same trick as existing slim
kinds. `skin` defaults per member to a canonical-ish fair/medium/deep tone
(never `'tint'` — a princess's dress carries the pack's sole visual "pop,"
so sensor/person tinting rides the accent trim instead, same convention as
the `pop-culture` pack's fixed-hue costumes) via a small **accent** piece
(a hip sash, a hair ribbon, or a hem trim box) that IS `color`, so per-sensor
tint-coding still shows through on every member. This is called out per
member below wherever the accent lives.

**Shared silhouette technique — the ballgown cone-skirt**: every full-length
gown member wears a `hip`-anchored inverted cone (or a scaled cylinder for
straighter A-line cuts) that flares from the waist to the floor, fully
occluding both legs — this is the single load-bearing trick that makes a
stick-figure rig read as "princess in a gown" rather than "person wearing a
skirt." `legColor` is still set to match the gown hem color underneath, as a
safety net for any camera angle that clips under the cone. Two members
(the archer, the warrior) are deliberately **not** in ballgowns — their
canonical looks are an active kilted dress and armor, so they keep visible
legs with `legColor` doing the actual costume work.

**Hair as the second identity axis**: with everyone in some variant of a
long dress, hair color/shape/length is the fastest silhouette read at 30px
after the dress color. Hair is built entirely from `crown`/`head` accessory
primitives (spheres for volume, cylinders for braids, cones for updos) —
there is no dedicated "hair" field on the rig, so every member's hair is a
2–4-primitive accessory stack, called out explicitly below.

---

## Members

### ice-queen
**Label**: Ice Queen (ice-blue gown)
**Reference**: Elsa, the ice-powered queen of a Nordic kingdom (*Frozen*,
2013) — after her signature "letting go" transformation she wears a
crystalline ice-blue gown with a sheer snowflake-patterned cape and a loose
side braid of platinum-blonde hair.

**Spec**
```ts
'ice-queen': {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.92,
  skin: 0xf6d9c4, body: 0xbfe6f5 /* icy powder-blue bodice */,
  shoe: 0xeaf6fb /* pale ice heels */, legColor: 0xbfe6f5,
  emI: 0.14 /* faint icy shimmer */, hands: 'sphere', eyes: 'almond', steel: false,
},
```

**Accessories**
- **hip**: gown skirt — tall inverted cone (`r ≈ TORSO_W*1.5, h ≈ legL*780mm`),
  `0xd9f2fb` (paler than the bodice — two-tone dress), flares to the floor,
  fully hides the legs.
- **crown/head**: braid — 4–5 stacked spheres (`r ≈ 20mm*sk`, tapering)
  trailing from the right side of the head down over the front shoulder,
  `0xe8e3d3` platinum-blonde; small snowflake accent (tiny flattened white
  box cross) clipped where the braid meets the hairline.
- **back**: sheer cape — a large, THIN translucent cone (`opacity ≈ 0.35`,
  `0xd6f0fb`) hanging from the shoulders to past the knees; this is the one
  member in the pack using a transparent material (matches the humanoid's
  documented transparent-material exemption from outline shells).
- **hip (accent)**: a slim icy-cyan sash at the natural waist, `color` (the
  sensor/person tint) — the pack's tint-carrier for this member.

**Silhouette check**: the pale two-tone ice-blue cone gown + single
over-the-shoulder braid is the one thing that reads "ice queen" at 30px; the
sheer cape confirms up close. Fully achievable with the current rig.

**Personality**: `{ bobMul: 0.65, swayMul: 0.7, cadenceMul: 0.85 }` (graceful,
composed, minimal bounce — regal glide).
**Bubbles**: `['❄️', '⛄', '✨', '👑']`

---

### her-sister
**Label**: Her Sister (teal cape, twin braids)
**Reference**: Anna, the ice queen's warm-hearted younger sister (*Frozen*,
2013) — strawberry-blonde hair in twin braids, a black bodice, navy skirt,
and her iconic teal-green traveling cape with magenta trim.

**Spec**
```ts
'her-sister': {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.92,
  skin: 0xf7d1b8, body: 0x1a2230 /* black bodice */, shoe: 0x2b2320,
  legColor: 0x243247 /* navy skirt hem */, emI: 0.05, hands: 'sphere', eyes: 'almond', steel: false,
},
```

**Accessories**
- **hip**: A-line skirt — a scaled cylinder-cone (`r ≈ TORSO_W*1.3, h ≈
  legL*760mm`), navy `0x243247`, straighter cut than a full ballgown flare
  (Anna's skirt is fuller than a sheath but not a hoop gown).
- **back**: traveling cape — a broad cone (`r ≈ TORSO_W*1.6, h ≈ TORSO_H*2.0`)
  in teal-green `0x2f8f7a`, clasped at the shoulders, hanging to mid-calf.
- **crown/head**: twin braids — two 3-sphere chains (`r ≈ 18mm*sk`), one each
  side of the head, trailing to shoulder height, strawberry-blonde `0xd98c4a`.
- **hip (accent)**: a thin magenta trim band at the cape's clasp/collar,
  `color` (tint carrier).

**Silhouette check**: black bodice + teal cape + twin braids is the
distinguishing combo (vs. the Ice Queen's single braid + all-icy-blue). Fully
achievable.

**Personality**: `{ bobMul: 1.2, swayMul: 1.15, cadenceMul: 1.1 }` (bouncy,
energetic, a touch clumsy-eager).
**Bubbles**: `['❤️', '🥕', '⛄', '😄']`

---

### the-mermaid
**Label**: The Mermaid (land variant, teal skirt)
**Reference**: Ariel, a mermaid princess who longs for the human world (*The
Little Mermaid*, 1989) — canonically bright red flowing hair, a lavender/
purple seashell top, and a sea-green fish tail. This pack renders the
**land/legs variant** (per house style — humanoid rig, no fin geometry
exists): the tail's iconic sea-green becomes a floor-length teal-green skirt
so the color identity carries over even without a tail. See Rig gaps for the
true fin-tail note.

**Spec**
```ts
'the-mermaid': {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.92,
  skin: 0xf6cbb0, body: 0x8b3fa0 /* purple seashell top */, shoe: 0x1f9a5b,
  legColor: 0x1f9a5b /* sea-green, matches the canonical tail hue */,
  emI: 0.10, hands: 'sphere', eyes: 'almond', steel: false,
},
```

**Accessories**
- **hip**: land-variant skirt — a cone (`r ≈ TORSO_W*1.4, h ≈ legL*760mm`),
  sea-green `0x1f9a5b` (the exact hue mermaid fans track as her tail color),
  with a slightly scalloped hem implied by 2–3 small overlapping triangular
  (cone) flares at the bottom edge for a fin-like silhouette echo.
- **chest**: seashell top — two small dome (half-sphere) shapes, purple
  `0x8b3fa0`, mounted on the upper torso in place of the plain bodice.
- **crown/head**: long flowing hair — 3 large overlapping spheres (`r ≈
  50–70mm*sk`) cascading past the shoulders and down the back, vivid red
  `0xc62828` — the single biggest-volume hair in the pack, matching how
  consistently her hair reads as her #1 identifier.
- **hip (accent)**: a small teal shell-clip accent at the hip seam, `color`
  (tint carrier).

**Silhouette check**: the vivid red hair volume + purple seashell top is the
one thing that reads at 30px; the sea-green skirt confirms. Achievable as a
land variant; the true tail-fin silhouette is a **flagged rig gap** (see
below) for a future mermaid-form alt build.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 0.95, ampMul: 1.05 }`
(dreamy, curious, slightly rolling gait — sea-legs-on-land energy).
**Bubbles**: `['🐚', '🌊', '🎶', '💭']`

---

### beauty
**Label**: Beauty (yellow ballgown)
**Reference**: Belle, a book-loving village girl who befriends a cursed
prince (*Beauty and the Beast*, 1991) — canonical for her golden-yellow
off-the-shoulder ballgown and long wavy brown hair (worn half-up for the
ballroom look).

**Spec**
```ts
beauty: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.92,
  skin: 0xf0c39a, body: 0xf4c430 /* golden-yellow bodice */, shoe: 0xd9a916,
  legColor: 0xf4c430, emI: 0.12, hands: 'sphere', eyes: 'almond', steel: false,
},
```

**Accessories**
- **hip**: ballgown skirt — a full inverted cone (`r ≈ TORSO_W*1.6, h ≈
  legL*800mm`, the widest flare in the pack — the dress is famously
  voluminous), golden-yellow `0xf4c430`.
- **crown/head**: hair — a rounded volume sphere at the crown (`r ≈
  70mm*sk`) plus a smaller trailing sphere at the nape for the half-up
  gathered look, warm brown `0x5c3a21`.
- **chest**: off-shoulder neckline hint — a thin horizontal band just below
  the collarbone line, slightly darker gold `0xd9a916`, breaking up the
  bodice/skirt color match.
- **hip (accent)**: a narrow waist sash at the natural waistline, `color`
  (tint carrier).

**Silhouette check**: the wide golden-yellow cone gown alone is enough to
read at 30px (no other member in the pack uses this saturated a yellow); the
brown hair volume confirms up close. Fully achievable.

**Personality**: `{ bobMul: 0.85, swayMul: 0.75, cadenceMul: 0.9 }` (composed,
thoughtful, unhurried — a little lost in a book even while walking).
**Bubbles**: `['📖', '🌹', '💛', '📚']`

---

### the-first
**Label**: The First (blue bodice, black bob)
**Reference**: The original animated Disney princess (1937) — a blue bodice
with a high white collar over a yellow skirt, a red bow in short black
bobbed hair, and a red cape. This member follows the brief's "blue/silver"
color cue by leaning the palette toward blue + a silvery-white collar rather
than the full canonical yellow skirt, while keeping the unmistakable black
bob + red bow that make her instantly "the first" at any color balance.

**Spec**
```ts
'the-first': {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.92,
  skin: 0xf7dcc0, body: 0x2b5faa /* blue bodice */, shoe: 0x2b5faa,
  legColor: 0xe7e9ec /* pale silver-white skirt */, emI: 0.05, hands: 'sphere',
  eyes: 'almond', steel: false,
},
```

**Accessories**
- **hip**: skirt — an A-line cone (`r ≈ TORSO_W*1.35, h ≈ legL*740mm`), pale
  silver-white `0xe7e9ec` (the brief's "silver" cue; canon is yellow — swap
  this color back to `0xf5d33c` for a fully-canonical yellow-skirt variant
  if the franchise-accuracy read matters more than the brief's palette).
- **face/chest**: a wide white collar — a flattened ring/box at the neckline,
  `0xf5f5f2`, echoing the canonical high white collar.
- **crown/head**: black bob — a single wide, flattened hemisphere (`r ≈
  75mm*sk`) hugging the head close with a straight lower edge (approximated
  via a slightly squashed sphere scale), matte black `0x161412`.
- **crown (accent)**: red hair bow — a small bowtie-shaped pair of flattened
  cones at the crown, `color` (tint carrier; canonically fixed red, but
  tinting here keeps per-sensor coding — swap to fixed `0xc62828` if strict
  canon accuracy is preferred over tint-coding).
- **back**: short red cape — a small cone from the shoulders to mid-back,
  `0xc62828`.

**Silhouette check**: the tight black bob is the one shape no other pack
member has (everyone else has long/voluminous hair), so it alone
disambiguates "the first" at 30px even before the bodice color; the collar +
bow confirm up close.

**Personality**: `{ bobMul: 1.05, swayMul: 0.9, cadenceMul: 1.0 }` (cheerful,
light-footed, sings-while-walking energy).
**Bubbles**: `['🍎', '🎶', '🐦', '🌼']`

---

### sleeping
**Label**: Sleeping (pink gown)
**Reference**: A briar-rose princess under a sleeping curse, woken by true
love's kiss (*Sleeping Beauty*, 1959) — golden-blonde hair, violet eyes, and
a gown famous for a mid-story color-swap fight between pink and blue. This
pack renders the pink version per the brief.

**Spec**
```ts
sleeping: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.92,
  skin: 0xf8d5b8, body: 0xf2a8c4 /* rose pink */, shoe: 0xe888ac,
  legColor: 0xf2a8c4, emI: 0.06, hands: 'sphere', eyes: 'almond', steel: false,
},
```

**Accessories**
- **hip**: petal-overskirt gown — a cone (`r ≈ TORSO_W*1.5, h ≈ legL*780mm`)
  in rose pink `0xf2a8c4`, with a shorter darker-pink over-cone
  (`0xd97a9e`, ~70% the height) layered on top for the canonical
  petal-overskirt silhouette.
- **crown/head**: hair — a smooth, gently waved gold-blonde volume sphere
  (`r ≈ 65mm*sk`) at the crown, `0xe8b923`.
- **crown (accent)**: a small gold circlet/crown — a thin torus-like ring
  (approximated with a flattened cylinder band, `0xd4af37`) at the hairline.
- **hip (accent)**: a fine gold cord belt at the waist, `color` (tint
  carrier).

**Silhouette check**: the soft rose-pink gown with the petal double-layer
skirt hem is the one thing that reads "storybook sleeping princess" at 30px;
the gold circlet confirms. Fully achievable.

**Personality**: `{ bobMul: 0.7, swayMul: 0.6, cadenceMul: 0.75 }` (dreamy,
floaty, drifting pace — half in a fairy-tale trance).
**Bubbles**: `['🌹', '💤', '🎂', '✨']`

---

### the-archer
**Label**: The Archer (wild curls, bow)
**Reference**: A headstrong Scottish princess and champion archer who wins
her own hand in a contest (*Brave*, 2012) — canonical for an enormous mane
of wild, curly red-orange hair and a dark teal-emerald wool gown built for
movement, bow slung across her back.

**Spec**
```ts
'the-archer': {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.95,
  skin: 0xf2c8a0, body: 0x1f5c4a /* dark teal-emerald gown */, shoe: 0x3b2a1a,
  legColor: 0x1f5c4a, emI: 0.05, hands: 'sphere', eyes: 'almond', steel: false,
},
```
Legs stay VISIBLE (no ballgown cone) — the archer's dress is split/slit for
movement and this pack is deliberately breaking its own ballgown convention
here, since an active archer silhouette needs legL/gait to read normally.

**Accessories**
- **crown/head**: the pack's headline accessory — 7–9 small overlapping
  spheres (`r ≈ 22–34mm*sk`, irregular offsets/rotations) clustered all
  around the head in a huge frizzy corona, burnt red-orange `0xc1440e`. This
  is intentionally the largest and most irregular hair mass in the pack.
- **back**: quiver — a short cylinder (`r ≈ 26mm*sk, h ≈ 210mm*sk`), brown
  leather `0x5a3a20`, slung diagonally across the back with 2–3 thin
  cylinder "arrow" tips peeking out the top.
- **hand**: bow — a thin, curved accent built from a bent-look pair of
  angled thin cylinders (or a single arc-approximating torus segment) held
  in the off hand, `0x3b2a1a` wood-brown, string a thin light-grey line.
- **hip (accent)**: a woven belt/sash, `color` (tint carrier).

**Silhouette check**: the giant wild red-orange hair corona is the ONE
thing — no other member gets anywhere close to that hair volume — readable
even as a colored blob at 30px; the bow-on-back confirms up close.

**Personality**: `{ cadenceMul: 1.25, ampMul: 1.15, swayMul: 0.85 }` (bold,
quick, purposeful stride — a huntress, not a stroller).
**Bubbles**: `['🏹', '🐻', '🎯', '🍞']`

---

### the-tower-girl
**Label**: The Tower Girl (very long braid)
**Reference**: A princess raised in an isolated tower, gifted with
impossibly long, magical golden hair (*Tangled*, 2010) — canonical
lavender-corset-and-purple-skirt dirndl-style gown (a deliberate nod to her
kingdom's purple-and-gold flag), and hair long enough to be a *character
prop* by itself.

**Spec**
```ts
'the-tower-girl': {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.92,
  skin: 0xf6cba7, body: 0x9a7ac0 /* lavender corset */, shoe: 0xe8cf5b,
  legColor: 0x7a4fa0, emI: 0.08, hands: 'sphere', eyes: 'almond', steel: false,
},
```

**Accessories**
- **hip**: dirndl-style skirt — a cone (`r ≈ TORSO_W*1.4, h ≈ legL*760mm`),
  royal purple `0x7a4fa0`, with 2–3 thin pink swirl-trim boxes near the hem,
  `0xe6a8c4`, echoing the canonical embroidered swirl pattern.
- **crown/head**: THE braid — a very long chain of 8–10 tapering spheres
  (`r ≈ 24mm*sk` down to `~10mm*sk`), golden blonde `0xf2cf5b`, starting at
  the crown and trailing all the way down the back to ankle height (by far
  the longest single accessory chain in the pack — this length IS the
  character). A separate short pink ribbon accent (`color`) spirals around
  the top third of the braid.
- **chest**: puff sleeves — two small sphere-cap bumps at the shoulders,
  lavender `0x9a7ac0`, matching the corset.

**Silhouette check**: the floor-length trailing braid is unmistakably the
one thing at any distance — nothing else in the pack has hair that extends
past the hip. Fully achievable with a longer-than-usual accessory chain (see
Rig gaps for a note on very long chains).

**Personality**: `{ bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.05, ampMul: 1.1 }`
(bouncy, adventurous, barely-contained energy after years cooped up).
**Bubbles**: `['🎨', '🖌️', '☀️', '💡']`

---

### the-frog-princess
**Label**: The Frog Princess (emerald ballgown)
**Reference**: A hardworking New Orleans waitress with a dream of owning her
own restaurant, who spends much of her story transformed into a frog
(*The Princess and the Frog*, 2009) — canonical deep-brown skin, dark
upswept hair, and a sparkling emerald-green ballgown with a lily-pad motif
for her "princess" form (rendered here, not the frog form).

**Spec**
```ts
'the-frog-princess': {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.92,
  skin: 0x8a5a3c, body: 0x1a7a4c /* emerald ballgown */, shoe: 0x156b41,
  legColor: 0x1a7a4c, emI: 0.16 /* sparkling gown */, hands: 'sphere', eyes: 'almond', steel: false,
},
```

**Accessories**
- **hip**: ballgown skirt — a full cone (`r ≈ TORSO_W*1.55, h ≈ legL*790mm`),
  emerald green `0x1a7a4c`, with a pale-yellow underskirt sliver
  (`0xf2e2a0`) peeking at the very hem (canonical petticoat detail).
- **crown/head**: hair — a smooth upswept volume (sphere + a small trailing
  bun sphere at the back), deep black `0x1c1a17`.
- **crown (accent)**: lily-pad tiara — a small flattened green disc
  (short wide cylinder, `0x2fae6c`) with a tiny white flower-dot accent,
  sitting just above the hairline.
- **chest**: a thin diamond-blue necklace line at the collarbone,
  `0x8fd0e8`.

**Silhouette check**: the deep emerald ballgown + lily-pad tiara silhouette
is the one thing that reads "frog princess" at 30px (the only fully green
gown in the pack); the dark upswept hair confirms. Fully achievable.

**Personality**: `{ cadenceMul: 1.15, bobMul: 1.0, ampMul: 1.05 }` (driven,
hardworking, no-nonsense brisk walk).
**Bubbles**: `['🍽️', '🌟', '💚', '🍳']`

---

### the-warrior
**Label**: The Warrior (armor, dark topknot)
**Reference**: A soldier's daughter who disguises herself as a man to take
her father's place in the army, becoming one of her kingdom's greatest
warriors (*Mulan*, 1998) — canonical dark green/bronze soldier's armor over
a practical undershirt, dark hair worn up in a warrior's topknot, sword
carried on the back.

**Spec**
```ts
'the-warrior': {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 1.0,
  skin: 0xe8b98c, body: 0x33422e /* dark green-bronze armor */, shoe: 0x2a2a26,
  legColor: 0x2b2b26, emI: 0.10, hands: 'sphere', eyes: 'almond', steel: true,
},
```
Legs stay VISIBLE, armored (`legColor`, `steel: true` for the brushed-metal
look) — no ballgown cone; this is an active soldier silhouette, matching
the archer as the pack's second non-gown member.

**Accessories**
- **chest/torso-front**: breastplate — a slightly proud box plate over the
  torso (`TORSO_W*1.05 × TORSO_H*0.7 × 16mm`), bronze-edged dark green
  `0x33422e` with a thin bronze trim line `0x9a7a3a`.
- **crown/head**: topknot — a single compact sphere bun (`r ≈ 42mm*sk`)
  high at the back of the crown, deep black `0x1c1a17`; hair pulled flat
  and close (no volume at the sides — reads as "pulled back," not loose).
- **back**: sword — a long thin box/cylinder blade (`h ≈ 340mm*sk`) in a
  scabbard, slung diagonally across the back (same anchor recipe the pack
  precedent already uses for the ninja's katana / pirate's bandolier).
- **hip**: armor sash/waist wrap, `color` (tint carrier) — the one piece of
  this member's costume that stays open for per-sensor tinting, since armor
  + hair are both fixed canonical hues.

**Silhouette check**: the dark plate armor silhouette (the only armored,
`steel:true` member in the pack) plus the flat pulled-back topknot is the
one thing that reads "warrior" vs. every other gowned member at 30px; the
back-slung sword confirms up close.

**Personality**: `{ swayMul: 0.55, cadenceMul: 1.1, bobMul: 0.8 }` (disciplined,
precise, minimal wasted motion — trained-soldier gait).
**Bubbles**: `['⚔️', '🐉', '🎖️', '🔥']`

---

## Rig gaps

1. **No fin-tail / legless lower-body geometry.** The rig's two rigid,
   two-segment legs can't produce a mermaid's single fused fish-tail
   silhouette. **The Mermaid** is shipped here as a land/legs variant (a
   sea-green skirt carrying the tail's color identity) rather than blocking
   the pack on this. A future rig extension — a single tapered cone/lathe
   shape replacing both legs below the hip for kinds that opt in — would let
   a true "mermaid form" alt-build exist alongside this land variant; the
   `pop-culture` pack's genie entry flagged the same underlying gap
   (footless smoke-tail), so this would be a shared payoff across two packs
   if ever built.
2. **Very long accessory chains are untested at scale.** **The Tower Girl**'s
   floor-length braid (8–10 tapering sphere segments trailing well past the
   hip, further than any existing accessory in the base rig) works within
   the current primitive/anchor system but is a new *length* regime, not a
   new capability — flagging in case very long chains need a dedicated
   "trailing accessory" helper (auto-taper, drape/physics-free follow-through)
   rather than hand-placed segments, if a future pack wants hair/tails/capes
   that long to sway or trail believably during walk-cycle motion instead of
   staying rigid.
3. **No bent/curved bow-prop geometry.** Straight primitives (box/sphere/
   cylinder/cone) can't produce a true curved longbow. **The Archer**'s bow
   is approximated with straight angled cylinder segments (echoing the same
   approximation the `pop-culture` pack already accepted for its pirate's
   hook and cutlass); readable as "a bow-shaped object in the hand" but not
   a genuine curve. Not blocking.

None of the above blocked shipping a member — all ten have a complete,
distinguishable spec using only the current rig's primitives and anchors.

## Sources

- [Elsa (Frozen) — cosplay/costume guide](https://eyecandys.com/blogs/news/elsa-frozen-cosplay)
- [How to Cosplay Anna from Frozen: Complete Costume and Makeup Guide](https://eyecandys.com/blogs/news/anna-frozen-cosplay)
- [Artist Log \[2\] — Frozen II's Costume Design](https://antigear.dev/blog/artist-log-2-frozen-iis-costume-design/)
- [Ariel | Disney Wiki | Fandom](https://disney.fandom.com/wiki/Ariel)
- [Disney 4C-60-4 Little Mermaid hex color (sea-green tail reference)](https://encycolorpedia.com/1f9a5b)
- [Why Disney Colored Ariel's Hair Red in The Little Mermaid](https://www.cbr.com/disney-the-little-mermaid-ariel-red-hair-explainer/)
- [How to Cosplay Belle from Beauty and the Beast: Complete Costume Guide](https://eyecandys.com/blogs/news/belle-cosplay-beauty-and-the-beast)
- [Belle's ball gown — Wikipedia](https://en.wikipedia.org/wiki/Belle's_ball_gown)
- [The History of Snow White Costumes](https://www.halloweencostumes.com/blog/p-195-history-of-snow-white-costumes.aspx)
- [What Color Is Snow White's Dress?](https://www.grafixfather.com/blog/what-color-is-snow-whites-dress/)
- [Aurora | Disney Princess Wiki | Fandom](https://disneyprincess.fandom.com/wiki/Aurora)
- [Merida (Brave) — Wikipedia](https://en.wikipedia.org/wiki/Merida_(Brave))
- [Merida | Disney Princess Wiki | Fandom](https://disneyprincess.fandom.com/wiki/Merida)
- [Rapunzel color palette / purple-and-gold Corona symbolism discussion](https://www.tumblr.com/tangledbea/715614907865923585/may-i-ask-about-rapunzels-color-palette-from-the)
- [Rapunzel | Disney Princess Wiki | Fandom](https://disneyprincess.fandom.com/wiki/Rapunzel)
- [Tiana | The Disney Princess Roleplay Wiki | Fandom](https://the-disney-princess-roleplay.fandom.com/wiki/Tiana)
- [Costumes in Disney's 'Mulan' Reflect the Rich History of the Epic Tale](https://thewaltdisneycompany.com/news/costumes-in-disneys-mulan-reflect-the-rich-history-of-the-epic-tale/)
- [Mulan's Warrior Costume | Disney Magic Kingdoms Wiki | Fandom](https://dmk.fandom.com/wiki/Mulan/Warrior)
- Diorama source reference (existing rig conventions, anchors, `_buildHumanoid`,
  `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`, the ballgown
  cone-skirt / `EAR_SKIP` / transparent-material-exemption precedents):
  `src/three-renderer.ts`; sibling pack doc for format precedent:
  `docs/avatars/base/pop-culture.md`.
