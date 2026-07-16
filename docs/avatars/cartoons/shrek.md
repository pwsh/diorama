# Avatar pack: Cartoons ▸ Swamp & Storybook Crew

Hierarchy path: `docs/avatars/cartoons/shrek.md` → generated pack id
`cartoons/shrek`. Franchise pack (opt-in novelty, defaults `loaded:false`
like every other franchise pack).

## Overview

A seven-member set of stylized, geometric toon-homage figures inspired by
the DreamWorks ogre-and-fairy-tale-storybook franchise — **not** licensed
characters, no likenesses/logos/textures. Every silhouette cue is a
primitive (box/sphere/cylinder/cone) in a flat saturated color per the
Sims-toon house style (`MeshToonMaterial`, 4-step gradient bands, dark
cartoon outlines, oversized head/hands on humanoids, green plumbob
overhead). Labels are descriptive-generic; the actual character each member
homages is named once in that member's **Reference** line, never in the
label or in-scene copy.

**Member selection**: the researched primary cast is the ogre lead, his
donkey sidekick, the ogre princess, the swashbuckling cat ally, the tyrant
antagonist, the dragon guardian, and the sentient cookie sidekick — the
seven figures a casual viewer of the first two films names unprompted.
Omitted as secondary/ensemble (fails the "casual fan names first" bar):
the Fairy Godmother and Prince Charming (introduced in the second film,
strong designs but secondary to the core seven), King Harold and Queen
Lillian (supporting royalty), the Ugly Stepsister/Doris (one-film
recurring gag), the Three Blind Mice/Pinocchio/Big Bad Wolf (background
storybook-creature ensemble, no individual costume identity distinct
enough to clear the silhouette test as a group). Seven members sits
comfortably inside the 5–12 range without needing a sub-series split.

**Two rig families**: five members are humanoid bipeds (`_buildHumanoid`)
— the ogre lead, the ogre princess, the upright swashbuckling cat, the
tyrant, and the cookie sidekick — and two are quadrupeds
(`_buildQuadruped`) — the donkey and the dragon. This follows the source
material exactly: the donkey and dragon are the only members who are
literal, four-legged animals; everyone else (including the cat, who
consistently stands, walks, duels, and rides upright throughout the
franchise) reads as bipedal.

**Ogre form for the princess (a deliberate choice, not a default)**: the
princess spends most of her screen time — and the ending/every sequel
after the first film — in her true ogre form, which is also her own
canonical preference in the story. Building her as an ogre here (rather
than a generic human-princess look already well covered by
`docs/avatars/cartoons/disney-princess.md`) both matches her actual
identity in this franchise and avoids any redundant overlap with that
sibling pack.

**Shared ogre-family conventions** (the lead and the princess only; the
other five members are each bespoke — there isn't enough of a shared
uniform/body across a donkey, a cat, a tyrant, a dragon, and a cookie to
justify a pack-wide `base`):
```ts
// shared silhouette language for both ogre members — not a literal `base`
// spread (their sk/color values diverge too much), just a documented
// convention: bulky sk ≥ 1.0, prominent flattened-cone/ellipsoid ear
// accessories at the `head` anchor, and green skin drawn from the same
// olive-green family so the two read as "the same species" side by side.
```

---

## Members

### shrek
- **id**: `shrek/shrek` · **label**: "Big Ogre (green, brown vest)"
- **Reference**: the grumpy-but-good-hearted swamp-dwelling ogre lead.
  Canonical look: olive-green skin, bald head, large pointed ears, a
  stuffed off-white poet shirt under a brown vest, muted plaid trousers
  (brown/tan), a black belt, and rugged brown boots — a big, thick-necked,
  barrel-bodied build.
- **Spec**
```ts
shrek: {
  sk: 1.35, headR: 152, headShape: 'sphere', limbR: 1.5,
  skin: 0x6e9c3f /* olive-green ogre skin */,
  body: 0xe9dfc4 /* off-white poet shirt, the vest layers on top as an accessory */,
  shoe: 0x5a3d22 /* brown boots */,
  legColor: 0x8a7550 /* plaid trousers approximated as a solid muted tan-brown — see Rig gaps */,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
  armL: 1.0, legL: 0.95, footMul: [1.3, 0.9, 1.3] /* big flat feet */,
},
```
- **Accessories**
  - **head**: two large ogre ears — flattened cone/ellipsoid shapes
    (`~90mm*sk` long, `HEAD_R*0.6` wide at the base) jutting outward and
    slightly down from the sides of the head, skin-toned `0x6e9c3f`.
  - **chest**: vest — two side-panel boxes flanking the torso front and
    wrapping to the back, brown `0x6b4423`, leaving a strip of the
    off-white shirt visible down the center front (the shirt-V, same
    layering trick as the base rig's `tall-dog-pal` vest).
  - **hip**: belt — a black band (`TORSO_W*1.05 × TORSO_H*0.12 ×
    TORSO_D*1.05`, `0x161311`) with a small square brass buckle,
    `0xb8a24a`.
- **Silhouette check**: the huge olive-green bald head with jutting ears
  atop a barrel-chested brown-vest-over-white-shirt silhouette is
  unmistakable at 30px — no other member shares this build, color, or
  ear shape. Fully achievable.
- **Personality**: `{ bobMul: 1.3, swayMul: 1.1, cadenceMul: 0.75, ampMul: 1.3 }`
  (heavy, deliberate, ground-shaking ogre stomp — slow cadence, big
  displacement per step).
- **Bubbles**: `['🧅', '😤', '🏚️', '💚']`

---

### donkey
- **id**: `shrek/donkey` · **label**: "Chatty Steed (grey, long ears)"
- **Reference**: the ogre lead's hyperactive, endlessly-talkative donkey
  sidekick. Canonical look: grey fur, a black mane, long upright ears, and
  brown eyes; modeled loosely after a real miniature donkey.
- **Spec**
```ts
donkey: {
  sk: 1.15, bodyLen: 700, bodyW: 230, bodyH: 260, legLen: 620,
  neckLen: 90 /* a touch more neck than the base dog rig */,
  headR: 150, headScale: 1.1, snout: 130 /* elongated donkey muzzle */,
  ears: 'long' /* the signature tall upright donkey ears */,
  tail: 'tuft', tailLen: 240,
  coat: 0x9e9e9e /* grey fur */, belly: 0xd8d0c0 /* lighter grey-cream */,
  earColor: 0xc9a6a6 /* pale pink inner-ear hint */,
  snoutColor: 0xd8d0c0 /* pale muzzle */,
  pawColor: 0x2a2a2a /* dark hooves */, tailTipColor: 0x1a1a1a /* black tuft */,
},
```
- **Accessories**
  - **qneck**: mane ridge — a row of 4 short thin dark boxes
    (`~18 × 90 × 6mm*sk` each) along the neck/back dorsal edge, black
    `0x1a1a1a` — the source's "black mane" detail, and the pack's clearest
    single silhouette add.
  - **qhead**: a small forelock tuft between the ears, black `0x1a1a1a`.
- **Silhouette check**: grey body + tall upright ears + a black dorsal
  mane ridge reads "donkey" instantly at 30px, distinct from any generic
  base-pack quadruped by the ear length + mane combo. Fully achievable.
- **Personality**: `{ bobMul: 1.25, swayMul: 1.1, cadenceMul: 1.3, ampMul: 1.15 }`
  (quick, bouncy, can't-stay-still trot — matches the nonstop chatter).
- **Bubbles**: `['🧇', '🗣️', '😄', '⭐']`

---

### fiona
- **id**: `shrek/fiona` · **label**: "Ogre Princess (green, dark gown)"
- **Reference**: the princess lead, shown here in her true ogre form (her
  own preferred, and story-canonical, state by the end of the first film
  and in every subsequent one). Canonical ogre-form look: green ogre skin
  matching the lead's family, auburn-red hair worn up, a dark green gown,
  and a brown corset/vest layered over the bodice.
- **Spec**
```ts
fiona: {
  sk: 1.05, headR: 132, headShape: 'sphere', limbR: 1.05,
  skin: 0x7ab04c /* ogre-green, a warmer/lighter shade than the lead's */,
  body: 0x1f5c34 /* dark green gown bodice */,
  shoe: 0x3a2a1a /* dark flats, mostly hidden under the gown */,
  legColor: 0x1f5c34 /* gown color continues down — the hip cone accessory does the real "gown" read */,
  emI: 0, hands: 'sphere', eyes: 'almond', steel: false,
  armL: 0.98, legL: 0.98,
},
```
- **Accessories**
  - **head**: two ogre ears — the same flattened cone/ellipsoid shape as
    the lead's but scaled down (`~75mm*sk`), skin-toned `0x7ab04c`.
  - **crown**: hair — a rounded volume at the back of the head plus a
    small raised bun sphere on top, auburn-red `0x9c3b1f` (raised/tilted
    back per the crown-clearance convention so it doesn't drape onto the
    brow).
  - **chest**: corset — a fitted panel box over the gown bodice, brown
    `0x6b4423`, with thin lighter-brown lace-up accent lines (2–3 very
    thin proud boxes down the center, `0x8a6238`).
  - **hip**: gown skirt — a broad flattened cone flaring from the hips to
    knee height, dark green `0x1f5c34` (the recipe's standard "skirts/
    gowns = cone at hip" approximation; it visually reads as a full skirt
    over the rig's own legs).
- **Silhouette check**: the dark-green gown cone + ogre ears + auburn bun
  is instantly distinct from every other member (only ogre besides the
  lead, only gown-cone silhouette in the pack, only auburn hair). Fully
  achievable.
- **Personality**: `{ bobMul: 1.0, swayMul: 0.95, cadenceMul: 1.1, ampMul: 1.05 }`
  (confident, capable stride — a warrior-trained princess, not a
  storybook damsel gait).
- **Bubbles**: `['👑', '🥋', '🌙', '💚']`

---

### puss
- **id**: `shrek/puss` · **label**: "Swashbuckling Cat (orange tabby,
  feathered hat)"
- **Reference**: the debonair, sword-wielding anthropomorphic cat ally,
  a Zorro-style swashbuckler. Canonical look: a small orange tabby cat
  standing and fighting upright, with a broad leather hat lined in red
  and topped with a yellow feather, a black cape, a sword belt and rapier,
  and oversized soft leather boots.
- **Spec**
```ts
puss: {
  sk: 0.68, headR: 100, headShape: 'sphere', limbR: 0.8,
  skin: 0xd97a2b /* orange tabby fur */, body: 0xd97a2b,
  shoe: 0xb5241f /* red boots */, legColor: 0xd97a2b,
  emI: 0, hands: 'sphere', eyes: 'almond' /* the character's signature large, pleading eyes — closest existing style */,
  steel: false, armL: 0.95, legL: 0.95, footMul: [1.25, 1.0, 1.25],
},
```
- **Accessories**
  - **head**: two triangular cat-ear cones (`~30mm*sk` base, `50mm*sk`
    tall) at the crown, orange `0xd97a2b` with a small darker-orange tip
    accent `0x9c4f18`.
  - **face**: 4–6 very thin whisker cylinders (`r=2mm*sk, h=60mm*sk`)
    radiating from the muzzle sides, white `0xf2f0e6` (same fine-detail
    recipe as the TMNT sensei's whiskers; may not read below ~50px).
  - **chest**: a small white chest-patch oval, `0xf2f0e6` — a common
    tabby marking, and a bit of tint break against the solid orange.
  - **tailbone**: tail — a single tapering cylinder/cone chain
    (`~180mm*sk` long) curling out and up behind, orange `0xd97a2b` with a
    dark tip `0x6e3a12`. Built as a static prop, not an animated appendage
    — see Rig gaps.
  - **crown**: cavalier hat — a wide flat-brimmed dome (`sphereArc`,
    raised + tilted back per the crown-clearance convention) in dark
    leather `0x2a1a12` lined red on the underside `0x8a1414`, plus a
    single tall thin cone/box feather plume, egg-yolk yellow `0xe8c430`.
  - **back**: cape — a flattened cone from the shoulders, black
    `0x161619`, tied with a thin cream cord accent at the neck.
  - **hip**: belt + scabbard — a thin dark band at the waist with a long
    thin box scabbard along the hip, `0x2a1a12`.
  - **handR**: rapier — a long thin cylinder blade with a small
    cross-guard box, matte steel `0xb8bcc2`, dark hilt `0x1a1a1a`.
- **Silhouette check**: small orange-cat build + the oversized cavalier
  hat + black cape + rapier is unmistakable at 30px and reads
  "swashbuckler," not just "cat," well before the whiskers/eyes register
  up close. Fully achievable — including the tail, now that the
  `tailbone` anchor exists (see Rig gaps for the residual animation gap).
- **Personality**: `{ bobMul: 0.85, swayMul: 1.0, cadenceMul: 1.25, ampMul: 1.1 }`
  (light, nimble, theatrical struts and flourishes).
- **Bubbles**: `['⚔️', '🥺', '🐈', '🥛']`

---

### farquaad
- **id**: `shrek/farquaad` · **label**: "Tiny Tyrant (red & black, tall
  red hat)"
- **Reference**: the vain, short-statured, iron-fisted ruler of the
  storybook-creature-cleansed city-state — the story's antagonist.
  Canonical look: a short build with an oversized head/big chin, a blond
  medieval pageboy (bowl-cut) haircut, a red tunic with black sleeves, a
  red hat with a white top, a red cape, red gloves with gold trim, black
  trousers, and black boots.
- **Spec**
```ts
farquaad: {
  sk: 0.55 /* the character's whole comedic build — short, well above the 0.45 floor */,
  headR: 130, headShape: 'sphere', limbR: 0.95,
  skin: 0xe8c39a, body: 0xb5151a /* red tunic torso */,
  shoe: 0x0f0f0f /* black boots */, legColor: 0x141414 /* black trousers */,
  limbColors: { armL: 0x1a1a1a, armR: 0x1a1a1a } /* black sleeves distinct from the red torso */,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
},
```
- **Accessories**
  - **crown**: hat — a short wide cylinder crown, red `0xb5151a`, topped
    with a puffed white sphere, `0xf2f2ee` (raised + tilted back per the
    crown-clearance convention).
  - **crown/head**: pageboy hair — a bowl-shaped dome (`sphereArc`,
    trimmed `phiLength` so the front fringe clears the brow) plus a
    straight fringe box across the forehead, blond `0xe8c468`.
  - **face**: a small forward-projecting skin-toned chin box at the jaw
    — the character's signature oversized-chin silhouette detail.
  - **back**: cape — a flattened cone from the shoulders, red `0xb5151a`,
    with a thin white trim strip at the collar edge, `0xf2f2ee`.
  - **hip**: belt — a black band with a small gold square buckle,
    `0xd4af37`.
  - **handL / handR**: glove cuffs — small red ring/box accents at each
    hand, `0xb5151a`, with a thin gold trim line, `0xd4af37` (approximating
    the character's gold-trimmed gloves via the existing `hand` anchors —
    see Rig gaps for the precision caveat).
- **Silhouette check**: the deliberately SHORT build (`sk` near the floor)
  topped with an oversized head, blond bowl-cut, and a tall red-and-white
  hat is the one silhouette in the pack built entirely around scale
  rather than color — reads "small, self-important ruler" instantly next
  to every other (taller) member. Fully achievable.
- **Personality**: `{ bobMul: 0.6, swayMul: 0.55, cadenceMul: 1.0, ampMul: 0.55 }`
  (short, stiff, self-important little strides — small legs, formal
  bearing).
- **Bubbles**: `['👑', '😤', '🏰', '💍']`

---

### dragon
- **id**: `shrek/dragon` · **label**: "Guardian Wyrm (magenta, bat wings)"
- **Reference**: the enormous, initially antagonist-then-ally dragon who
  guards the princess's tower — later revealed to be female. Canonical
  look: a giant magenta-maroon body, a pink belly, maroon dorsal spines,
  white spikes at the cheeks, webbed ears, large bat-like wings, and a
  long, spade-tipped, prehensile tail.
- **Spec**
```ts
dragon: {
  sk: 1.5 /* near the documented ~1.5-1.6x dog-scale cap for oversized creatures */,
  bodyLen: 1500, bodyW: 420, bodyH: 480, legLen: 380 /* short, stubby legs relative to the huge body */,
  neckLen: 480 /* long serpentine neck */, headR: 210, headScale: 1.3,
  snout: 220, ears: 'round' /* closest enum to the character's webbed ears — see Rig gaps */,
  tail: 'up', tailLen: 900,
  coat: 0x8a2547 /* magenta-maroon */, belly: 0xe8a0c0 /* pink underside */,
  earColor: 0x5c1830, snoutColor: 0x6e1c38,
  pawColor: 0x3a1020 /* dark claws */, tailTipColor: 0x4a1020 /* darker accent, approximating the spade tip's color — see Rig gaps */,
},
```
- **Accessories**
  - **qhead**: 3 white cheek spikes per side — small cone shapes
    (`~24mm*sk` base, tapering, `50–70mm*sk` long), `0xf2f2ee`.
  - **qhead / qneck**: dorsal spine ridge — a row of 6–8 small dark-maroon
    cone spikes (`~20mm*sk` base, `40–60mm*sk` tall) along the crown of
    the head, neck, and back, `0x4a1020`.
  - **qback**: wings — two large flattened cone/box wing shapes flaring
    up and back from the shoulders, dark maroon-purple membrane
    `0x5c1a40` with a darker rim edge `0x3a1028` — the pack's single
    biggest silhouette element (same "large flattened cone from the back"
    recipe the He-Man pack's Falcon Sorceress wings and this doc's own
    capes use, scaled up considerably).
- **Silhouette check**: the sheer scale (largest member in the pack by a
  wide margin) plus the flared bat-wing silhouette reads "dragon"
  unmistakably at 30px, long before the magenta coloring or cheek spikes
  register up close. Fully achievable; the wings render static (no
  wing-flap animation channel — see Rig gaps).
- **Personality**: `{ bobMul: 0.55, swayMul: 0.6, cadenceMul: 0.7, ampMul: 0.9 }`
  (heavy, powerful, unhurried gait — a huge body that doesn't need to
  hurry).
- **Bubbles**: `['🔥', '💜', '🦇', '🥰']`

---

### gingy
- **id**: `shrek/gingy` · **label**: "Cookie Fellow (gingerbread, icing
  trim)"
- **Reference**: the small, endlessly cheerful sentient gingerbread-cookie
  sidekick, roughly the size of a human hand. Canonical look: a brown
  gingerbread-cookie body and head, white icing trim and a white icing
  smile, and two candy-colored gumdrop buttons down the front that he is
  famously protective of.
- **Spec**
```ts
gingy: {
  sk: 0.5 /* tiny — "about the size of a human hand," well above the 0.45 floor */,
  headR: 80, headShape: 'oval', limbR: 1.3 /* short, stubby, chunky cookie limbs */,
  skin: 0x8a5a2e /* gingerbread brown, head+body uniform */,
  body: 0x8a5a2e, shoe: 0x6e4423 /* slightly darker cookie-foot nubs */,
  legColor: 0x8a5a2e, emI: 0, hands: 'sphere', eyes: 'dots' /* a rare case where the plain-dot eye style IS the exact canonical look — icing-dot candy eyes */,
  steel: false, noFace: true /* skip the generic nose/brow/mouth — replaced with icing accessories below */,
  armL: 0.55, legL: 0.55, footMul: [1.2, 0.6, 1.1],
},
```
- **Accessories**
  - **face**: icing smile — a single thin white flattened box arc across
    the lower face, `0xf5f2ea` (approximated as one straight segment, not
    a true curved smile — see Rig gaps).
  - **crown**: icing hairline — one thin white proud box across the top
    of the head, `0xf5f2ea`.
  - **chest**: 2 gumdrop buttons — two small spheres down the front,
    bright candy red `0xd4213b` and candy green `0x2f9e44` — the exact
    detail (and count) the character is famously protective of.
  - **handL / handR**: icing wrist cuffs — small white ring accents at
    each hand, `0xf5f2ea` (the closest available approximation to the
    character's icing "stitches"; true ankle icing is omitted — no
    ankle/foot anchor exists, see Rig gaps).
- **Silhouette check**: the tiny, chunky, uniform-brown cookie-shaped
  body with white icing trim and two bright gumdrop buttons is
  unmistakable at 30px — smallest build in the pack by far, and the only
  solid-brown silhouette. Fully achievable (smile shape approximated, not
  blocking).
- **Personality**: `{ bobMul: 1.35, swayMul: 1.2, cadenceMul: 1.4, ampMul: 0.5 }`
  (quick, bouncy, tiny-legged skitter — fast cadence, small step
  amplitude).
- **Bubbles**: `['🍪', '😊', '🧁', '💪']`

---

## Rig gaps

1. **`tailbone` anchor resolves a previously flagged gap — with a residual
   animation caveat.** The `tailbone` humanoid anchor (documented in
   `docs/avatars/AUTHORING.md`'s current anchor list) now provides exactly
   the hip-back attachment point the TMNT pack's research doc flagged as
   missing for its rat sensei's tail. This pack uses it for **Puss**'s
   signature tail. The residual gap: it's a static prop placement, not an
   animated appendage — there is still no idle tail-sway channel (tracked
   in `docs/ROADMAP.md` § Avatar rig gaps, "Animated appendages: tail
   sway..."), so Puss's tail holds one fixed curl rather than swishing.
2. **No giant-flap/webbed ear enum.** The quadruped `ears` field
   (`'pointy'|'floppy'|'round'|'long'|'none'`) has no shape matching the
   **Dragon**'s canonical webbed ears; `'round'` is the closest available
   approximation. Already tracked in `docs/ROADMAP.md` § Avatar rig gaps
   ("giant-flap ear enum").
3. **No wing-flap animation.** The Dragon's bat wings (and any future
   winged member) render as a static built-time shape — there is no flap/
   idle-motion channel, the same class of gap as tail sway above (tracked
   under "Animated appendages" in `docs/ROADMAP.md`).
4. **No forked/curved small-prop or fabric-pattern geometry.** Straight
   primitives can't produce a true curved icing smile or a spade-shaped
   tail tip. **Gingy**'s smile (single straight box) and the **Dragon**'s
   spade tail-tip (approximated as a `tailTipColor` accent rather than an
   actual spade shape) both fall back to the same class of approximation
   already accepted for the TMNT pack's sai/nunchaku and covered by the
   house "fabric patterns/prints/decals/text" design constraint in
   `docs/ROADMAP.md` § Avatar rig gaps. **Shrek**'s plaid trousers are
   likewise approximated as a solid muted tan-brown (dominant-color
   substitution, per the same convention).
5. **No true wrist/ankle-cuff or limb-midpoint anchors.** The existing
   `handL`/`handR` anchors sit at the hand, not the wrist proper —
   close enough for **Farquaad**'s gold-trimmed glove cuffs and **Gingy**'s
   icing wrist stitching, but not a precise wrist placement; and there is
   no ankle/foot anchor at all, so Gingy's canonical ankle icing (added
   after his legs were reattached in the story) is omitted entirely. Both
   are already tracked in `docs/ROADMAP.md` § Avatar rig gaps ("wrist/
   cuff, ankle/foot, limb-midpoint" anchors).

None of the above blocked shipping a member — all seven have a complete,
distinguishable spec using only the current rig's primitives and anchors.

## Sources

- [Dress Like Shrek Costume | Halloween and Cosplay Guides — Costumewall](https://costumewall.com/dress-like-shrek/)
- [Shrek Costume Ideas — Characters Database](https://charactersdb.com/shrek-costume-ideas/)
- [Donkey (Shrek) — Wikipedia](https://en.wikipedia.org/wiki/Donkey_(Shrek))
- [Donkey — WikiShrek (Fandom)](https://shrek.fandom.com/wiki/Donkey)
- [Princess Fiona — Wikipedia](https://en.wikipedia.org/wiki/Princess_Fiona)
- [How to Dress Like Princess Fiona from Shrek — Costumewall](https://costumewall.com/dress-like-princess-fiona/)
- [Puss in Boots (Shrek) — Wikipedia](https://en.wikipedia.org/wiki/Puss_in_Boots_(Shrek))
- [Puss in Boots — WikiShrek (Fandom)](https://shrek.fandom.com/wiki/Puss_in_Boots)
- [Lord Farquaad — Wikipedia](https://en.wikipedia.org/wiki/Lord_Farquaad)
- [Lord Farquaad Costume Guide for Cosplay and Halloween — Costumewall](https://costumewall.com/dress-like-lord-farquaad/)
- [Dragon (Shrek) — Wikipedia](https://en.wikipedia.org/wiki/Dragon_(Shrek))
- [Dragon — WikiShrek (Fandom)](https://shrek.fandom.com/wiki/Dragon)
- [Gingerbread Man — WikiShrek (Fandom)](https://shrek.fandom.com/wiki/Gingerbread_Man)
- [Gingerbread Man (Shrek) — Heroes Wiki (Fandom)](https://hero.fandom.com/wiki/Gingerbread_Man_(Shrek))
- Diorama source reference (existing rig conventions, anchors, `_buildHumanoid`/
  `_buildQuadruped`, the `tailbone` anchor, the crown-clearance idiom, and the
  TMNT/He-Man/disney-animals prop-approximation and wing/cape precedents):
  `src/three-renderer.ts`; sibling pack docs for format precedent:
  `docs/avatars/cartoons/tmnt.md`, `docs/avatars/cartoons/he-man.md`,
  `docs/avatars/cartoons/disney-animals.md`.
