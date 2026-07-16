# Avatar pack: Cartoons ▸ Toy Story

Hierarchy path: `docs/avatars/cartoons/toy-story.md` → generated pack id
`cartoons/toy-story`.

## Overview

An eight-member set of stylized, geometric toon-homage figures inspired by
the core "Andy's toybox" ensemble from a landmark 1990s-launched
computer-animated toy franchise — **not** licensed characters, no
likenesses/logos/textures. Every silhouette cue is a primitive (box/sphere/
cylinder/cone) in flat saturated colors per the Sims-toon house style
(`MeshToonMaterial`, 4-step gradient bands, dark cartoon outlines, oversized
head/hands on humanoids, green plumbob overhead). Labels are
descriptive-generic; the actual character each member homages is named once
in that member's **Reference** line, never in the label or in-scene copy.

**Member selection**: the survey's proposed eight (Woody, Buzz Lightyear,
Jessie, Mr. Potato Head, Rex, Hamm, Bullseye, Slinky Dog) verified cleanly as
the franchise's primary cast — every one of the eight is a top-billed,
screen-time-heavy member of the toybox ensemble across the whole series
(several — Woody, Buzz, Jessie, Bullseye, Slinky, Rex, Hamm, Potato Head —
are literally the box art / opening-lineup toys), so no trim was needed.
Deliberately omitted as secondary/one-arc characters despite recognizability:
Mrs. Potato Head (a recolor of Mr. Potato Head with no independently
distinct silhouette — would fail the "identical at 30px" merge rule the same
way a redundant twin would in any other pack), the Aliens (background-gag
ensemble, not individually named principals), Lotso and other later-film
antagonists (film-specific, not toybox-core), and Wheezy/RC/Etch-a-Sketch/
Slinky's owner-cameo bit players (one-scene supporting cast). This keeps the
roster at the "casual fan names first" core eight rather than padding toward
twelve with secondary faces.

**No pack-wide shared base** (unlike TMNT's four-brother `turtleBase` or My
Little Pony's uniform pony chassis): every member here is a **different toy
product** with its own material, proportions, and color story by design —
that heterogeneity (plush horse vs. injection-molded action figure vs.
ceramic bank vs. posable plastic dinosaur) is itself part of what the
original characters are. The one thread tying the roster together is a
uniformly modest **"toy plastic" sheen** — every member's `emI` sits in the
0–0.15 band (glossy-injection-molded plastic and vinyl reads as a *slight*
sheen at this rig's scale, never the shinier "wet" look reserved for slime/
robot kinds elsewhere in the base packs).

**Two-and-a-half rig families**: four members are straightforward humanoid
bipeds in normal clothes (Woody, Buzz, Jessie, Mr. Potato Head), three are
quadrupeds (Hamm, Bullseye, Slinky Dog), and **Rex** is the pack's edge
case — a bipedal dinosaur built on the **humanoid** rig (he stands upright on
two legs with tiny arms, exactly like the source character), which is why his
missing sweeping tail is a *humanoid*-rig gap rather than a quadruped one
(see Rig gaps — this reinforces the same gap the `tmnt` pack's rat sensei
already flagged, not a new one).

---

## Members

### woody
**Label**: Cowboy Doll (yellow plaid, brown vest)
**Reference**: Sheriff Woody Pride, a vintage pull-string cowboy doll and
Andy's favorite toy / de facto leader of the group — canonical for a golden
yellow plaid shirt (printed pearl-snap buttons), a brown cowhide-textured
vest, blue jeans, a brown wide-brim cowboy hat, a red neckerchief/bandana,
and a gold sheriff's star badge on the vest.

**Spec**
```ts
woody: {
  sk: 1, headR: 126, headShape: 'sphere', limbR: 0.95,
  skin: 0xe8b48c, body: 0xf0c93c /* golden plaid shirt */,
  shoe: 0x6b4423 /* brown boots */, legColor: 0x2b4a7a /* blue jeans */,
  emI: 0.05, hands: 'sphere', eyes: 'dots', steel: false,
},
```

**Accessories**
- **crown**: cowboy hat — a shallow dome (`r ≈ HEAD_R*1.05`, phi 0..2π,
  theta 0..0.55π) plus a flattened wide-brim disc at its base, brown
  `0x7a4a26`, raised + tilted back per the crown-clearance convention so the
  brim doesn't drape over the eye line.
- **chest/torso-front**: vest — two flanking side-panel boxes over the
  shirt (`TORSO_W*0.42 × TORSO_H*0.85 × 14mm` each), leather-brown `0x6b4423`,
  leaving a strip of the yellow plaid visible down the center front.
- **chest (accent)**: sheriff's star badge — a tiny flattened 5-point-ish
  box cluster (3 short thin boxes crossed, ~`16mm*sk` each), gold `0xd4af37`,
  pinned to the vest's left panel.
- **neck**: red bandana — a small flattened triangular box at the throat,
  `0xc0392b` (a solid red stand-in for the printed white-dot pattern, per the
  "fabric prints = dominant solid color" convention).
- **hip**: belt — a thin brown band (`TORSO_W*1.0 × TORSO_H*0.12 ×
  TORSO_D*1.0`, `0x5a3a1e`) with a small silver square buckle box
  (`0xc7ccd1`) at the front.

**Silhouette check**: the brown wide-brim hat over a golden-yellow plaid
torso and blue-jean legs is an unmistakable "storybook cowboy" read at 30px
— no other member in the pack sits in this earthy brown/yellow/denim family;
the badge and bandana confirm up close. Fully achievable.

**Personality**: `{ bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.0 }`
(steady, confident, easy-going leader's stride — a hair of pull-string-toy
bounce, nothing exaggerated).
**Bubbles**: `['🤠', '⭐', '🐴', '🔫']`

---

### buzz
**Label**: Space Ranger (white/purple/green suit)
**Reference**: Buzz Lightyear, a Space Ranger action figure and Woody's
rival-turned-best-friend — canonical for a white/purple/lime-green plastic
spacesuit, a purple hood/collar framing the face, a chest control panel, and
folding wings tipped in translucent green.

**Spec**
```ts
buzz: {
  sk: 1.02, headR: 128, headShape: 'sphere', limbR: 1.0,
  skin: 0xe8b48c, body: 0xf2f2ee /* white suit torso */,
  shoe: 0x3fae49 /* green boots */, legColor: 0xf2f2ee /* white suit legs */,
  emI: 0.12, hands: 'box' /* gloved gauntlets */, eyes: 'dots', steel: false,
},
```

**Accessories**
- **crown/head**: purple hood/collar — a hemisphere shell framing the sides
  and back of the head (`r ≈ HEAD_R*1.1`, phi 0..2π, theta 0..0.6π), purple
  `0x6b3fa0`, raised + tilted back per the crown-clearance convention so the
  face stays fully visible (helmet-retracted "action figure" pose).
- **back**: folding wings — two flattened wing-shaped boxes hinged at the
  shoulders, white `0xf2f2ee`, each tipped with a small translucent-green
  jet accent (`0x3fae49`, `emissive` on, low `emissiveIntensity`) — the
  pack's one deliberately glowy accent.
- **chest**: control panel — a proud rectangular plate (`TORSO_W*0.5 ×
  TORSO_H*0.4 × 10mm`) on the chest, lime-green trim `0x3fae49` with a tiny
  red button dot (`0xc0392b`) — Buzz's signature belt-of-gadgets read,
  relocated to the chest since the rig has no dedicated gadget-belt anchor.
- **shoulderL / shoulderR**: shoulder pads — small green box caps
  (`~30mm*sk` each), `0x3fae49`, over each shoulder joint.

**Silhouette check**: the white-body/purple-hood/green-wingtip color
combination is unmistakably "space suit," with zero overlap against any
other member's earthy or pastel palette — reads clean at 30px; the chest
panel and shoulder pads confirm up close. Fully achievable.

**Personality**: `{ bobMul: 0.9, swayMul: 0.8, cadenceMul: 0.95, ampMul: 0.95 }`
(upright, deliberate, mock-heroic Space Ranger march — a little stiffer and
more "in character" than a normal casual walk).
**Bubbles**: `['🚀', '⭐', '🛸', '✨']`

---

### jessie
**Label**: Cowgirl Doll (red hat, yodeling)
**Reference**: Jessie, an energetic yodeling cowgirl doll from a
Woody's-Roundup-style toy line, later Andy's — canonical for a red cowboy
hat, a bright red ponytail with a yellow ribbon, a white western shirt with
yellow shoulder/cuff trim, blue-jean cow-print chaps, and brown boots.

**Spec**
```ts
jessie: {
  sk: 0.94, headR: 122, headShape: 'sphere', limbR: 0.85,
  skin: 0xe8b48c, body: 0xf2f2ee /* white western shirt */,
  shoe: 0x6b4423 /* brown boots */, legColor: 0x2b4a7a /* blue jean chaps */,
  emI: 0.05, hands: 'sphere', eyes: 'dots', steel: false,
},
```

**Accessories**
- **crown**: red cowboy hat — same dome + brim-disc recipe as Woody's, but
  red `0xb8341f`, raised + tilted back for eye clearance.
- **crown (hair)**: ponytail — a tapering cylinder trailing back off the
  crown, bright red-orange `0xd94f2b`, with a small yellow ribbon accent box
  (`0xf4d13d`) near the tip.
- **chest**: yellow yoke/cuff trim — thin yellow accent boxes
  (`0xf4d13d`) at both shoulders, echoing the shirt's signature color-blocked
  yoke.
- **hip**: cow-print chaps accent — 3–4 small dark spot boxes
  (`~16mm*sk`, `0x241d18`) over the light denim, per the "patterns = a few
  proud boxes, not scatter" convention.
- **hip (accent)**: thin belt, `color` (the sensor/person tint) — the one
  piece of Jessie's fixed-palette costume kept open for per-sensor coding,
  same convention used pack-wide-elsewhere for fixed-hue costumes.

**Silhouette check**: the bright red hat + matching red ponytail over a
white/yellow torso is a distinctly punchier, redder read than Woody's
browner cowboy palette — the two disambiguate instantly even though both are
"cowboy hat" silhouettes; the cow-print chaps confirm up close. Fully
achievable.

**Personality**: `{ bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.2, ampMul: 1.15 }`
(bouncy, spirited, can't-sit-still energy — noticeably livelier than Woody's
steady lead-cowboy gait).
**Bubbles**: `['🤠', '🎵', '🐎', '⭐']`

---

### potato
**Label**: Spud Toy (bowler hat, mustache)
**Reference**: Mr. Potato Head, a gruff, wisecracking classic toy consisting
of a plastic potato-shaped body with detachable felt/plastic facial parts —
canonical for a brown potato-shaped body/head (they're the same piece), pink
ears, a black bushy mustache and eyebrows, an orange nose, and a black
bowler hat.

**Spec**
```ts
potato: {
  sk: 0.82 /* short, squat, no real neck */,
  headR: 148 /* the oversized "potato" body doubles as the head */,
  headShape: 'oval', limbR: 0.72 /* thin stubby limbs */,
  skin: 0x9c7a45 /* potato brown */, body: 0x9c7a45 /* same tone —
    one continuous potato body, no separate torso garment */,
  shoe: 0x2b5faa /* blue shoes */, legColor: 0x9c7a45,
  emI: 0.03, hands: 'sphere', eyes: 'dots', steel: false,
},
```
`body` matching `skin` keeps the read as one continuous molded-plastic
potato shell rather than a body-plus-clothing break — the same
"uniform single-tone" trick the `tmnt` pack's rat sensei uses for its robe.

**Accessories**
- **crown**: bowler hat — a short, wide flattened dome (`r ≈ HEAD_R*1.05,
  h ≈ 60mm*sk`) plus a thin brim disc, black `0x161619`.
- **head**: pink ears — two flattened oval discs (`r ≈ HEAD_R*0.3`) on the
  sides of the head, `0xe8a0b4` — the one bright contrast color against the
  otherwise all-brown body.
- **face**: bushy eyebrows — two short thick dark boxes (`~40 × 10 × 8mm`)
  above the eyes, `0x161619`.
- **face**: mustache — a wide thin dark box (`~70 × 14 × 6mm`) under the
  nose, `0x161619`.
- **face**: nose — an oversized orange cone bump (`r ≈ HEAD_R*0.22,
  h ≈ HEAD_R*0.3`), `0xd9822b`, bigger and more forward-projecting than the
  rig's default nose bump.

**Silhouette check**: the squat, oversized brown potato-shaped body topped
with a black bowler hat and a wide dark mustache is unmistakable at 30px —
no other member is this round or this brown; the pink ears and orange nose
confirm up close. Fully achievable — see Rig gaps for the one *conceptual*
(non-blocking) gap this member surfaces.

**Personality**: `{ bobMul: 0.65, swayMul: 0.55, cadenceMul: 0.75, ampMul: 0.65 }`
(a stiff, gruff, shuffling little waddle — grumpy-old-man energy in a
squat toy body).
**Bubbles**: `['🥔', '😠', '🎩', '👃']`

---

### rex
**Label**: Nervous Dino (green, tiny arms)
**Reference**: Rex, an anxious, would-be-scary plastic Tyrannosaurus rex who
worries he isn't intimidating enough — canonical for a dark-green base with
lime-green overspray, a cream/white belly and tail-underside stripe, tiny
stubby arms, and a thick tail for balance.

**Spec**
```ts
rex: {
  sk: 1.1 /* tall, thick-legged dinosaur build */,
  headR: 138, headShape: 'oval' /* elongated toothy snout read */,
  limbR: 1.3 /* thick legs */,
  skin: 0x2f6b34 /* dark green base */, body: 0x4fae55 /* lime overspray */,
  shoe: 0x2f6b34 /* clawed feet */, legColor: 0x4fae55,
  armL: 0.55 /* tiny stubby T-rex arms — THE defining proportion */,
  footMul: [1.4, 0.9, 1.6] /* big clawed dinosaur feet */,
  emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
},
```

**Accessories**
- **chest/torso-front**: cream belly plate — a pale flattened oval
  (`TORSO_W*0.85 × TORSO_H*1.1 × 10mm`), `0xefe6c8`, down the front torso
  (the canonical white trim through the belly).
- **face**: white teeth — a small row of thin white cone/box points
  (`~10mm*sk` each) at the mouth line, `0xf7f7f2`.
- **head**: brow ridge bumps — two small dark-green cone bumps
  (`0x234f28`) above the eyes.
- **tailbone**: tail-base stub — a short tapering cone at the hip/back
  anchor, dark green `0x2f6b34`, angled down and back — a partial approxi-
  mation of the character's signature thick counterbalancing tail (the rig
  has no true sweeping-tail anchor on a bipedal build; see Rig gaps).

**Silhouette check**: the tall, thick-legged, two-tone green dinosaur build
with visibly tiny stub arms is unmistakably "T-rex, not a person" at 30px —
no other member has this build; the cream belly stripe confirms up close.
The stub is a flagged partial approximation of the full sweeping tail, which
is this member's headline rig gap (not blocking — the build/color read
alone fully carries "dinosaur").

**Personality**: `{ bobMul: 0.85, swayMul: 1.1, cadenceMul: 0.8, ampMul: 0.9 }`
(a hesitant, slightly wobbly lumber for such a big frame — nervous energy
despite the size).
**Bubbles**: `['🦖', '😰', '🌿', '😬']`

---

### hamm
**Label**: Piggy Bank (pink, coin slot)
**Reference**: Hamm, a sarcastic, deadpan ceramic piggy-bank toy — canonical
for a round soft-pink body, a flat pink snout/muzzle, small rounded ears, a
curly tail, and (his two functional details) a coin slot on the back and a
cork stopper underneath.

**Spec**
```ts
hamm: {
  rig: 'quadruped',
  sk: 0.62 /* short, round, low-to-the-ground barrel build */,
  bodyLen: 420, bodyW: 260, bodyH: 260 /* near-circular cross-section */,
  legLen: 0.55 /* stubby little legs */,
  headR: 128, headScale: [1.05, 1.0, 1.05], neckLen: 0 /* head flush to body */,
  ears: 'round', tail: 'curl', tailLen: 0.5,
  snout: 0.35 /* short, mostly-flat protrusion — the flat snout disc
    accessory below carries the actual "flat pig snout" read */,
  coat: 0xf2b9c4 /* soft pink */, belly: 0xf9d8e0 /* paler pink underside */,
  earColor: 0xe8899e /* darker pink ears */, snoutColor: 0xe8899e,
  pawColor: 0xf2b9c4,
},
```

**Accessories**
- **qhead**: flat snout disc — a wide, shallow flattened cylinder
  (`r ≈ HEAD_R*0.55, h ≈ 20mm*sk`), `0xe8899e`, proud of the head front —
  the actual "flat pig snout" silhouette cue (the `snout` field alone gives
  only a shallow protrusion, not the disc shape).
- **qhead (accent)**: two tiny dark nostril dots (`r ≈ 6mm*sk`),
  `0x5c3040`, on the snout disc.
- **qback**: coin slot — a thin dark rectangular slit box
  (`~50 × 8 × 4mm`), `0x241d18`, across the spine.
- **qrump**: cork stopper — a small tan cylinder plug (`r ≈ 20mm*sk,
  h ≈ 14mm*sk`), `0xc9a06a`, angled onto the rear underside — an
  approximation, since the canonical cork sits on the true belly/underside
  and the quadruped rig has no anchor there (see Rig gaps).

**Silhouette check**: the round soft-pink barrel body on stubby legs with a
flat snout disc and curly tail is unmistakably "piggy bank" at 30px — the
smallest, roundest, palest-pink silhouette in the pack (distinct from the
horse and dachshund's much longer builds); the coin slot confirms up close.
Fully achievable, with the cork-placement caveat noted above.

**Personality**: `{ bobMul: 0.6, swayMul: 0.9, cadenceMul: 0.7, ampMul: 0.6 }`
(a slow, portly, unbothered little waddle — all deadpan attitude, no hurry).
**Bubbles**: `['🐷', '💰', '😏', '💵']`

---

### bullseye
**Label**: Toy Horse (brown, saddle)
**Reference**: Bullseye, Woody's loyal, silent rag-doll horse from the same
toy line as Jessie — canonical for a brown corduroy-textured body, a pink
muzzle, black button eyes, a dark brown yarn mane/tail, and a removable
brown saddle.

**Spec**
```ts
bullseye: {
  rig: 'quadruped',
  sk: 1.15 /* the pack's largest quadruped — horse-scaled but kept near the
    documented oversized-creature ceiling by leaning on body/leg/neck length
    rather than pure sk */,
  bodyLen: 780, bodyW: 260, bodyH: 320 /* elongated horse torso vs. dog's 640 */,
  legLen: 1.35 /* tall horse legs */,
  headR: 138, headScale: [1.0, 1.1, 1.15] /* longer horse face */,
  neckLen: 160 /* a real visible neck, unlike the dog baseline's 0 */,
  ears: 'pointy' /* documented placeholder for small upright horse ears,
    same approximation the my-little-pony pack already accepted */,
  tail: 'down', tailLen: 1.2,
  snout: 1.2 /* elongated horse muzzle */,
  coat: 0x8a5a34 /* brown corduroy */, belly: 0xd9c19a /* cream underside */,
  earColor: 0x8a5a34, snoutColor: 0xe0a0ae /* pink muzzle */,
  pawColor: 0xf2f0e6 /* white hooves/socks */,
  tailTipColor: 0x3d2817 /* dark brown yarn tail tip */,
},
```
`tailTipColor` only tints the tail's tip segment/tuft, not the whole tail
(the base segment still reads the coat's brown) — a partial mitigation of
the whole-tail-tint gap the `my-little-pony` pack flagged; close enough here
since Bullseye's tail is brown-on-brown anyway (mane/tail are the same warm
family as the coat, unlike a contrasting pony mane), so the two-tone
brown-to-darker-brown gradient reads fine at pack scale.

**Accessories**
- **qback**: saddle — a curved, flattened box arching over the back
  (`BODY_W*1.1 × 40mm × BODY_LEN*0.35`), saddle-brown `0x5c3820`, with 2
  small cactus-shaped accent cones (`0x4a7a4a`) on the flank side, per the
  "patterns = a few proud boxes" convention.
- **qneck**: mane — a row of 4–5 small flattened triangular boxes along the
  neck ridge, dark brown `0x3d2817` (matching the tail tip), for the felt
  yarn mane.

**Silhouette check**: the tallest, longest-necked, warm-brown silhouette in
the pack, topped by a curved saddle shape, is unmistakably "horse" at 30px —
no other member comes close to this height/neck-length combination; the
pink muzzle and dark mane confirm up close. Fully achievable.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 1.1 }`
(a calm, steady, proud-stepping trot — loyal and unhurried, with a touch of
high-stepping horse carriage).
**Bubbles**: `['🐴', '❤️', '⭐', '💨']`

---

### slinky
**Label**: Spring Dog (long, coiled middle)
**Reference**: Slinky Dog, a dachshund-shaped pull-toy whose rigid
orange-brown plastic front and hindquarters are joined by a stretchable
coiled metal spring midsection — canonical for that orange-brown color, long
floppy vinyl ears, a green collar, and small wheels tucked in his feet.

**Spec**
```ts
slinky: {
  rig: 'quadruped',
  sk: 1.0 /* dog-baseline scale — the elongation carries the character, not
    overall size */,
  bodyLen: 1150 /* the signature stretched-dachshund torso, exaggerated
    further by the spring — nearly double the dog baseline's 640 */,
  bodyW: 190, bodyH: 210, legLen: 0.55 /* short stubby dachshund legs */,
  headR: 118, headScale: [1.0, 0.95, 1.05], neckLen: 0,
  ears: 'floppy' /* long vinyl ears */, tail: 'up', tailLen: 0.9,
  coat: 0xc97a3d /* orange-brown plastic */, belly: 0xe0a468,
  earColor: 0x8a4a24 /* darker weathered vinyl */, snoutColor: 0xc97a3d,
  pawColor: 0x8a8a8a /* small grey wheels tucked in the feet */,
},
```

**Accessories**
- **qback** (×3, coil rings): three evenly-spaced short wide cylinder bands
  (`r ≈ BODY_W*0.55, h ≈ 18mm*sk`) in bright steel `0xc7ccd1`, offset along
  the body length between the front and hind plastic sections — a stacked
  approximation of the continuous coiled-spring midsection (see Rig gaps:
  no true helical primitive, and no "span the body length" placement
  mechanism — each ring is just a separately-offset accessory on the same
  `qback` anchor).
- **qneck**: green collar — a thin band cylinder, `0x2e7d4a`, at the front
  section's neck/base.
- **qhead (accent)**: stylized geometric brow plate — a small darker box
  (`0x5c3820`) over the eyes, echoing the character's simplified,
  more-geometric redesigned face vs. the original 1950s toy.
- **qrump (accent)**: two tiny flattened dark-grey discs (`0x4a4a4a`)
  peeking from the rear feet — the pull-toy's wheels (front wheels
  unaddressed; a minor honest omission, not silhouette-critical).

**Silhouette check**: the absurdly elongated, low-slung body — nearly double
the length of any other quadruped in the pack — broken by three bright
metallic coil-ring bands across the midsection is unmistakably "the spring
dog" at 30px, even before the floppy ears register; the green collar
confirms up close. The coil is a flagged approximation of a true helical
spring, but the elongation + metallic-ring read alone fully carries the
silhouette.

**Personality**: `{ bobMul: 1.5, swayMul: 1.2, cadenceMul: 1.1, ampMul: 1.1 }`
(a bouncy, springy gait with the biggest vertical bob in the pack — quite
literally a spring in his step).
**Bubbles**: `['🐕', '🌀', '⭐', '🎾']`

---

## Rig gaps

1. **No tail anchor on the humanoid (bipedal) rig — reinforces an existing
   gap, not new.** **Rex** stands upright on two legs (the correct pose for
   this character) and so is built on `_buildHumanoid`, which has no anchor
   suited to his signature thick counterbalancing tail — the same limitation
   the `tmnt` pack's rat sensei already flagged (`docs/avatars/cartoons/
   tmnt.md` Rig gap #1; also tracked in `docs/ROADMAP.md` § Avatar rig gaps
   under "additional anchors"). Rex ships with only a small tail-BASE stub
   at the `tailbone` anchor as a partial mitigation — the full sweeping tail
   remains the single biggest authenticity gap for this member. A future
   `tail` anchor on the humanoid rig (a 2-segment tapering cylinder chain
   with idle sway, mirroring the quadruped tail already built) would fix
   this for Rex and any future tailed-biped pack.
2. **No underside/belly anchor on the quadruped rig (new gap).** The
   quadruped anchor set is exactly `qhead`/`qneck`/`qback`/`qrump` (head,
   neck-base, mid-back, rump) — there is nothing on the true underside/belly.
   **Hamm**'s canonical cork stopper sits on his literal belly; it had to be
   approximated at `qrump` (rear-underside-adjacent) instead, angled to read
   as "underneath" without a true belly placement. A future `qbelly` anchor
   would fix this and would generalize to any future pack needing an
   underside detail (turtle shells' plastron-from-below, saddle girth
   straps, etc.).
3. **No helical/coiled-spring primitive, and no "span the body length"
   accessory placement (new gap).** **Slinky Dog**'s entire visual gimmick —
   a continuous coiled metal spring bridging two rigid body sections — has
   no dedicated primitive shape (box/sphere/cylinder/cone can't produce a
   true helix) and no mechanism to distribute several accessories evenly
   along an anchor's local length (each of the three coil-ring accessories
   here is hand-offset individually off the single `qback` anchor, not a
   generated span). A dedicated "coil"/"spring" primitive, or a generic
   "repeat N copies along an axis" accessory helper, would fix this cleanly
   and would also help any future pack needing a segmented/ridged body
   (robot hoses, worm/snake characters, vertebrae details).
4. **No interchangeable-parts / swappable-loadout system (design note, not
   blocking).** **Mr. Potato Head**'s entire real-world gimmick is that his
   ears/eyes/nose/mustache/hat/shoes are literally detachable and
   owner-swappable — the pack data model has no concept of alternate
   accessory loadouts per member (a pack member's `accessories` array is
   fixed). This member ships with one fixed canonical arrangement (as every
   other pack member does), which fully satisfies the brief, but is worth
   naming since it's the character's single most famous trait. A future
   "alt-look" / accessory-preset mechanism (already loosely flagged in
   `docs/ROADMAP.md` § Avatar rig gaps as "situational costume swaps") would
   let a future revision offer a genuinely swappable Potato Head.
5. **`tailTipColor` only tints the tip segment/tuft, not the full tail
   (partial mitigation of an already-known gap).** Confirmed directly
   against `three-renderer.ts._buildQuadruped` (`tailTipMat`): only the
   tail's second segment + tuft read the override color; the base segment
   still reads the coat color. **Bullseye**'s tail therefore reads as a
   brown-to-darker-brown gradient rather than one uniform dark yarn tail —
   accepted here as a fine approximation (both tones are in the same warm
   brown family), but it's the same whole-tail-independent-tint gap the
   `my-little-pony` pack originally flagged (that pack worked around it
   entirely by disabling the built-in tail and hand-building a static
   `qrump`-anchored one); this doc notes the field exists and helps
   partially, but doesn't fully close the original ask.

None of the above blocked shipping any of the eight members — every one has
a complete, distinguishable spec buildable with the current rig's
primitives, anchors, and enums.

## Sources

- [Sheriff Woody Pride — Toy Story Merchandise Wiki (Fandom)](https://toystorymerchandise.fandom.com/wiki/Sheriff_Woody_Pride)
- [Dress Like Sheriff Woody Costume Guide](https://www.costumerealm.com/sheriff-woody-costume/)
- [Woody Costume for Kids — Toy Story, Disney Store](https://www.disneystore.com/woody-costume-for-kids-toy-story-5502040730139M.html)
- [Buzz Lightyear — Wikipedia](https://en.wikipedia.org/wiki/Buzz_Lightyear)
- [Buzz Lightyear Costume with Lights and Sound — Toy Story, Disney Store](https://www.disneystore.com/buzz-lightyear-costume-with-lights-and-sound-for-kids-toy-story-5502041610294M.html)
- [Buzz Lightyear Adult Kit costume accessory set — Amazon](https://www.amazon.com/Disney-Toy-Story-Lightyear-Accessory/dp/B00J4KVPLA)
- [Jessie (Toy Story) — A Mighty Girl](https://www.amightygirl.com/toy-story-jessie-costume)
- [Dress Like Jessie Costume Guide](https://costumewall.com/dress-like-jessie/)
- [Jessie Costume for Kids — Toy Story 2, Disney Store](https://www.disneystore.com/jessie-costume-for-kids-toy-story-2-5502041610297M.html)
- [Mr. Potato Head — Wikipedia](https://en.wikipedia.org/wiki/Mr._Potato_Head)
- [Mr. Potato Head (Toy Story) — Mr. Potato Head Wiki (Fandom)](https://mrpotatohead.fandom.com/wiki/Mr._Potato_Head_(Toy_Story))
- [Mr. Potato Head — Pixar Wiki (Fandom)](https://pixar.fandom.com/wiki/Mr._Potato_Head)
- [Rex — Pixar Wiki (Fandom)](https://pixar.fandom.com/wiki/Rex)
- [Rex — Disney Wiki (Fandom)](https://disney.fandom.com/wiki/Rex)
- [Rex — Toy Story Color Scheme, SchemeColor](https://www.schemecolor.com/rex-toy-story.php)
- [Hamm — Toy Story Merchandise Wiki (Fandom)](https://toystorymerchandise.fandom.com/wiki/Hamm)
- [Hamm — Pixar Wiki (Fandom)](https://pixar.fandom.com/wiki/Hamm)
- [Toy Story Hamm Piggy Bank — Ceramic Coin Bank with Cork Stopper, Walmart](https://www.walmart.com/ip/Toy-Story-Hamm-Piggy-Bank-Official-Ceramic-Coin-Bank-with-Cork-Stopper-Kids-Adults/14552104447)
- [Bullseye — Disney Wiki (Fandom)](https://disney.fandom.com/wiki/Bullseye)
- [Official Bullseye Toy Story Merchandise — Disney Store](https://www.disneystore.com/characters/pixar/bullseye/)
- [Slinky Dog — Disney Wiki (Fandom)](https://disney.fandom.com/wiki/Slinky_Dog)
- [Slinky Dog — Pixar Wiki (Fandom)](https://pixar.fandom.com/wiki/Slinky_Dog)
- [Slinky Dog Talking Action Figure — Toy Story, Disney Store](https://www.disneystore.com/slinky-dog-talking-action-figure-toy-story-417132198015.html)
- Diorama source reference (existing rig conventions, anchors, `_buildHumanoid`/
  `_buildQuadruped`, `AvatarDef`/`HumanoidFields`/`QuadrupedFields`,
  `tailTipMat` tip-only tail tint, the quadruped `qhead`/`qneck`/`qback`/
  `qrump` anchor set, the `tmnt` rat-sensei tail-anchor precedent, the
  `my-little-pony` whole-tail-tint gap and pony-scale-from-proportions
  precedent): `src/avatars.ts`, `src/three-renderer.ts`; sibling pack docs
  for format precedent: `docs/avatars/cartoons/tmnt.md`,
  `docs/avatars/cartoons/my-little-pony.md`,
  `docs/avatars/cartoons/disney-animals.md`; `docs/ROADMAP.md` § Avatar rig
  gaps (parked-gap cross-reference).
