# Avatar pack: Careers & Occupations

Pack path: `base/careers` (group: **base**, sibling to `sci-fi`, `pop-culture`, `video-games`, `cartoons` under `docs/avatars/`).

Regeneration-ready reference for the avatar-pack data generator. This doc is the
source of truth — regenerate the pack's data file from it, don't hand-edit the
generated file and let it drift.

## Overview

This is a **base group**: a roundup of every existing built-in avatar kind that
reads as an "occupation" plus new members that round the set out to cover the
common civil-service / trades / white-collar archetypes not yet represented.
11 of the 21 members below are **existing kinds already shipped** in
`three-renderer.ts` — they are listed for completeness (so this doc is a full
inventory of the group) but are NOT respecced here; only light refinements are
proposed. 10 members are **new**.

**Shared style baseline** (every member in this group, existing and new):
- Standard adult proportions: `sk: 1`, `headR: 126`, `headShape: 'sphere'`,
  `hands: 'sphere'`, `limbR: 1` unless a member calls out a deviation (only
  `supermodel` at `sk: 1.05/limbR: 0.9` and `astronaut` at `headR: 118/limbR:
  1.1` deviate among the existing kinds; none of the 10 new members deviate).
  This group deliberately stays in "believable adult" proportions rather than
  the exaggerated/chibi proportions used by mascot or cartoon packs — the
  occupation reads through **color + accessory silhouette**, not body shape.
- `eyes: 'dots'` for every member (existing and new) — no member in this group
  needs a special eye style; identity is carried entirely by hats, uniforms,
  and hand-held/worn props, keeping faces open and readable.
- `skin: 'tint'` (the sensor/target color) for every member except the three
  existing kinds with a fixed non-tint skin (`hacker` pale, `wise_oracle`
  pale, `astronaut` white flight-suit skin) — new members all keep tinted
  skin so the per-sensor color-coding survives.
- Palette convention: uniform/costume `body` colors are fixed hex (the
  occupation's real-world color), `shoe` is fixed hex footwear, and any
  "sensor color accent" (badge trim, ties, stripes, tint pens) uses the
  existing `c.accent`-equivalent — i.e. the target's tint color — the same
  way `professional`'s tie and `cowboy`'s bandana already do. New members
  follow this: at least one small accessory element per member carries the
  sensor tint so per-sensor color coding is never fully lost under a solid
  uniform.
- Accessory anchors used throughout (per the existing rig's anchor set):
  `crown` (hats/caps/helmets), `head` (bands/goggles/ear-level items),
  `face` (glasses), `chest`/`torso-front` (badges, aprons, ties, emblems),
  `back` (satchels, tanks, capes), `hip` (belts, tool pouches), `hand`
  (held props).
- **No-texture constraint reminder**: patterned fabric (chef's houndstooth
  trousers, a woven duty-belt weave) collapses to a single flat color — noted
  per-member where it applies, not treated as a defect.

## Members

### Existing kinds (do not respec — listed for inventory + optional refinements)

---

#### `professional` — Professional (charcoal suit)
**Reference**: Generic office/corporate worker archetype (not a specific person) — dark suit, white shirt, tie.
**Existing kind**: `professional`. Current spec (verbatim):
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0x2c2e34 (CHARCOAL),
shoe: 0x141416, emI: 0.20, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories (current)**: white shirt cone (torso-front, apex-down triangular prism) + thin tint tie box below it.
**Silhouette check**: charcoal suit block + tint tie is the pack's "baseline office worker" — deliberately the most neutral silhouette in the group.
**Personality**: none (`{}`). **Bubbles**: `📊`, `☕`.
**Proposed refinement**: none needed; consider a small tint lapel-pin dot if the pack ever wants a second tint touch-point, but the tie already carries it.

---

#### `hacker` — Hacker (hoodie coder)
**Reference**: Generic software/security "hacker" archetype — pale skin, near-black hoodie with a cowl-shaped hood shell.
**Existing kind**: `hacker`. Current spec:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: 0xe7c6a4 (PALE), body: 0x161619 (NEARBLACK),
shoe: 0x141416, emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories (current)**: dark hood shell (tilted-back partial sphere so the front rim clears the brow).
**Silhouette check**: near-black hoodie silhouette + pale skin contrast reads instantly.
**Personality**: none. **Bubbles**: `💻`, `🔓`.
**Proposed refinement**: none needed; a laptop-under-arm hand prop would strengthen the read if this kind gets touched for other reasons, but it's optional.

---

#### `tech_expert` — Tech Expert (AV/IT technician)
**Reference**: Generic IT/AV support technician — headset, rectangular glasses, utility belt.
**Existing kind**: `tech_expert`. Current spec:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0x161619 (NEARBLACK),
shoe: 0x33363c, emI: 0.20, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories (current)**: rectangular glasses + bridge, ear-to-ear headset torus band + mic boom + tint mic-tip, tint utility belt.
**Silhouette check**: headset boom + glasses combo is unmistakable even against the same near-black body as `hacker`.
**Personality**: none. **Bubbles**: `💡`, `🔌`.
**Proposed refinement**: none.

---

#### `farmer` — Farmer (straw hat & overalls)
**Reference**: Generic rancher/farmer archetype — straw hat, denim overall bib with shoulder straps.
**Existing kind**: `farmer`. Current spec:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: tint,
shoe: 0x5a3d28, emI: 0.22, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories (current)**: straw-tan hat (brim + short crown cylinders), denim bib + two shoulder straps (all `0x3f5f8a`).
**Silhouette check**: straw hat brim + denim bib reads as "farmer" regardless of the tinted shirt underneath.
**Personality**: none. **Bubbles**: `🌽`, `🚜`.
**Proposed refinement**: none.

---

#### `cowboy` — Cowboy (stetson & vest)
**Reference**: Generic western rancher/cowboy — wide-brim stetson, bandana, leather vest panels.
**Existing kind**: `cowboy`. Current spec:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: tint,
shoe: 0x5a3d28, emI: 0.22, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories (current)**: wide stetson brim + crown, tint bandana box at the collar, two brown vest panels on the chest.
**Silhouette check**: stetson brim silhouette alone is enough at 30 px.
**Personality**: none. **Bubbles**: `🤠`, `🐴`.
**Proposed refinement**: none.

---

#### `athlete` — Athlete (headband & shorts)
**Reference**: Generic athlete/coach — sweatband, athletic shorts overlay.
**Existing kind**: `athlete`. Current spec:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: tint,
shoe: 0xf2f2f2, emI: 0.25, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories (current)**: white headband torus riding high on the forehead, dark-navy shorts overlay proud of the torso.
**Silhouette check**: headband + shorts block against bright shoes.
**Personality**: none. **Bubbles**: `🏆`, `💪`.
**Proposed refinement**: none.

---

#### `movie_star` — Movie Star (gold trim & shades)
**Reference**: Generic celebrity/actor archetype — gold-trimmed outfit, sunglasses.
**Existing kind**: `movie_star`. Current spec:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0xcaa53a (GOLD),
shoe: 0x0a0a0c, emI: 0.20, hands: 'sphere', eyes: 'shades', steel: false
```
**Accessories (current)**: emissive gold chest stripe (shades handled by the `eyes` face pass, not a bolt-on accessory).
**Silhouette check**: gold emissive body reads as "celebrity" at a glance; shades finish the read up close.
**Personality**: none. **Bubbles**: `🎬`, `🌟`.
**Proposed refinement**: none.

---

#### `supermodel` — Supermodel (hair & shades)
**Reference**: Generic fashion-model archetype — long dark hair shell, pushed-up sunglasses, tint dress hem.
**Existing kind**: `supermodel`. Current spec:
```
sk: 1.05, headR: 124, headShape: 'sphere', limbR: 0.9, skin: tint, body: tint,
shoe: 0xf2f2f2, emI: 0.25, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories (current)**: long hair cap + back fall (both `0x2a2026`), dark glasses box pushed up on the forehead, tint dress hem below the hips.
**Personality**: `swayMul: 1.35, ampMul: 1.1` (strut). **Bubbles**: `📸`, `💅`.
**Proposed refinement**: none.

---

#### `magician` — Magician (top hat & bowtie)
**Reference**: Generic stage magician — black top hat, white shirt front, bowtie.
**Existing kind**: `magician`. Current spec:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0x161619 (NEARBLACK),
shoe: 0x0a0a0c, emI: 0.20, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories (current)**: black top hat (brim + tall crown cylinders), white shirt cone (shared geometry with `professional`), tint bowtie box.
**Silhouette check**: top hat height is the single strongest cue in the whole pack.
**Personality**: none. **Bubbles**: `🎩`, `✨`, `🐇`.
**Proposed refinement**: none.

---

#### `astronaut` — Astronaut (helmet & suit)
**Reference**: Generic spacesuit archetype — translucent helmet bubble, chest control panel, backpack.
**Existing kind**: `astronaut`. Current spec:
```
sk: 1, headR: 118, headShape: 'sphere', limbR: 1.1, skin: 0xf2f2f2 (WHITE), body: 0xf2f2f2 (WHITE),
shoe: 0xf2f2f2 (WHITE), emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories (current)**: translucent helmet sphere (`outlineSkip`), grey chest panel + tint status lamp, backpack box.
**Personality**: `bobMul: 1.5, cadenceMul: 0.75` (moon-bounce). **Bubbles**: `🚀`, `⭐`.
**Proposed refinement**: none.

---

#### `wise_oracle` — Wise Oracle (robed sage)
**Reference**: Generic sage/mystic archetype — full-length robe skirt, white beard, tint amulet.
**Existing kind**: `wise_oracle`. Current spec:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: 0xe7c6a4 (PALE), body: 0x7b718f (ROBE),
shoe: 0x3a3542, emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories (current)**: ankle-length robe skirt shell over the hips, white beard block, tint amulet sphere at the chest.
**Personality**: `cadenceMul: 0.8, swayMul: 0.6` (slow, measured). **Bubbles**: `🔮`, `📜`.
**Proposed refinement**: none. (Not strictly a "career" but ships in the same kind list as the other occupation-flavored kinds, so it's inventoried here rather than left orphaned.)

---

### New members

---

#### `doctor` — Doctor (white coat & stethoscope)
**Reference**: Generic physician archetype (any specialty) — white lab coat worn open over scrubs, stethoscope draped around the neck. Not a specific person.
**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0xf5f5f2,
shoe: 0xf2f2f2, emI: 0.18, hands: 'sphere', eyes: 'dots', steel: false,
legColor: 0x5b8ab0   // scrub-blue trousers under the coat hem
```
**Accessories**:
- `torso-front` box, ~`TORSO_W*0.34 × TORSO_H*0.22`, color `0x5b8ab0` (scrub-blue) — a collar wedge peeking above the coat's open front, same slot as `professional`'s shirt cone but smaller and lower-contrast against the white coat.
- `head`/neck: partial torus (~`HEAD_R*0.9` radius, thin tube) at shoulder height for the stethoscope's neck loop, color `0x2c2e34`, **positioned at shoulder height, not head height** — a neck loop drawn too high collides with the jaw/chin.
- `chest` drop: thin cylinder hanging from the neck loop to sternum height + a small sphere (~40 mm) chest-piece disc at the end, color `0x2c2e34` with a tiny tint accent ring where the tube meets the disc.
- `chest` badge: small box (~`TORSO_W*0.12 × TORSO_H*0.08`), tint color, clipped at the upper-left chest pocket (ID badge).
**Silhouette check**: the neck-draped stethoscope tube + disc against a solid white coat block is the load-bearing cue — the white coat alone reads as "medical/lab," the stethoscope narrows it to "doctor" specifically (vs. `scientist`'s goggles, `nurse`'s cap-cross).
**Personality**: none (`{}`). **Bubbles**: `🩺`, `📋`, `💊`.

---

#### `firefighter` — Firefighter (turnout gear & helmet)
**Reference**: Generic structural firefighter — dark turnout coat, fluorescent reflective stripe, traditional red helmet with a front shield, SCBA air tank on the back. Helmet color varies by department in reality (yellow/black/red/white by rank); red is used here as the single most globally-recognizable "firefighter helmet" color for toon-scale readability, not a claim about any real department's rank system.
**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1.05, skin: tint, body: 0x24262b,
shoe: 0x141416, emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories**:
- `crown`: dome half-sphere (~`HEAD_R*1.18`) + a short flat brim disc (~`HEAD_R*1.3` radius, low profile — flatter than `cowboy`'s wide stetson brim), color `0xb81f24` (fire-engine red).
- `crown` front: small diamond/box badge accent (~`HEAD_R*0.3`), color `0xd9c34a` (brass gold) centered on the helmet front, approximating the traditional brass shield.
- `torso-front` + `torso-back`: a wide horizontal stripe band each (~`TORSO_W*0.95 × TORSO_H*0.16`), color `0xd9e021` fluorescent lime, `emissiveIntensity ~0.5` so it pops against the near-black coat; matching thin stripe rings around each upper-arm and lower-leg cylinder.
- `back`: two vertical cylinders side-by-side (~90 mm dia × 260 mm tall), color `0xd8d8dc` pale tank grey, plus a thin dark hose accent — the SCBA air tank.
**Silhouette check**: red helmet dome over a near-black coat with a bright lime chest stripe is the single most legible fire-service cue at 30 px — stronger than the badge, which only reads up close.
**Personality**: `bobMul: 1.1, cadenceMul: 0.9` (heavy gear, deliberate stride). **Bubbles**: `🚒`, `🔥`, `🧯`.

---

#### `police-officer` — Police Officer (navy uniform & badge)
**Reference**: Generic municipal patrol officer — navy uniform shirt, badge, black duty belt, flat-brim cap. Not modeled on any specific department's exact regalia (departments vary); navy is used as the most common historical/current US patrol color.
**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0x1c2b46,
shoe: 0x141416, emI: 0.18, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories**:
- `crown`: flat-topped cylinder crown (~`HEAD_R*0.85` radius) + a short, all-around flat brim disc (~`HEAD_R*1.15`), color `0x161e30` (near-navy-black) — flatter and rounder than the firefighter's dome and the pilot's taller crown so all three caps stay distinguishable in silhouette.
- `crown` front: tiny gold badge dot (~`HEAD_R*0.15`), color `0xd9c34a`.
- `chest`: small gold diamond/circle badge (~`HEAD_R*0.22`), color `0xd9c34a`, upper-left chest — approximates a shield/star badge (exact 5/6/7-point star geometry isn't representable with the box/cylinder/sphere/cone primitive set; a flat diamond reads close enough at this scale).
- `hip`: box band around the hips (~`TORSO_W*1.08 × TORSO_H*0.12`), color `0x0e0e10` (black basket-weave duty belt), studded with 2–3 small box "pouches."
**Silhouette check**: the flat navy cap plus the black duty-belt-with-pouches silhouette around the hips reads as "officer" before the badge is even legible.
**Personality**: none. **Bubbles**: `🚓`, `🚨`, `📻`.

---

#### `chef` — Chef (toque & whites)
**Reference**: Generic professional kitchen chef — white double-breasted jacket ("chef's whites"), tall pleated toque blanche, apron. The toque and white double-breasted jacket are the standard, centuries-old kitchen uniform (per Escoffier-era convention), not tied to any individual chef.
**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0xf5f5f2,
shoe: 0x1a1a1e, emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false,
legColor: 0x2c2e34   // solid dark trousers — the checked/houndstooth pattern
                     // real chef pants use can't be represented (no textures);
                     // solid charcoal is the flat-color approximation
```
**Accessories**:
- `crown`: a flattened/poofy sphere top (~`HEAD_R*1.0`, scaled ~`[1, 0.8, 1]`) sitting on a short cylinder band (~`HEAD_R*0.85` radius × 60 mm tall), color `0xf5f5f2` white — the poof balloons above the band, distinct from every other hat in the pack (no brim at all).
- `torso-front`: box apron panel (~`TORSO_W*0.7 × TORSO_H*0.6`), color `0xe8e6e0` off-white, lower-chest to hip, proud of the jacket front.
- `head`/neck: small tint box or flattened-triangle neckerchief (~`TORSO_W*0.22`) at the collar.
- optional `torso-front` detail: two thin vertical rows of tiny dark spheres down the jacket front suggesting double-breasted buttons.
**Silhouette check**: the tall white poofy toque rising well above the head silhouette is unmistakable even at 30 px with zero face detail — no other member in any career pack has a hat this tall and rounded.
**Personality**: none. **Bubbles**: `🍳`, `🔪`, `🥘`.

---

#### `scientist` — Scientist (lab coat & goggles)
**Reference**: Generic lab researcher — white lab coat, safety goggles, clipboard. Shares the white-coat silhouette with `doctor`/`nurse` on purpose (all three are "clinical/lab whites"); goggles + clipboard are what differentiate this member.
**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0xf2f2f0,
shoe: 0x2c2e34, emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories**:
- `face`: two lens boxes + bridge (same construction as `tech_expert`'s glasses but larger, ~`HEAD_R*0.5` each lens), lens material semi-transparent pale cyan `0xbfe0e8` at `opacity ~0.4` (reuse the `astronaut` helmet's transparent-material pattern), frame `0x17181c`.
- `head`: thin torus/strap band around the head at brow height (reuse `tech_expert`'s headset-band pattern), color `0x2c2e34`, connecting the goggles.
- `hand`: flat box clipboard (~`HAND_R*2` wide × `HAND_R*3` tall × 20 mm), color `0x8a6a3c` wood-brown with a thin white paper-face inset, held near the resting hand.
- `chest`: tiny box "pocket protector" + 2–3 thin cylinder "pens," color `0x2c2e34` protector with tint pen accents.
**Silhouette check**: goggles-over-eyes is the load-bearing cue that separates this member from `doctor`/`nurse` at a glance — the clipboard confirms it up close.
**Personality**: `cadenceMul: 0.9` (measured, thoughtful pace). **Bubbles**: `🧪`, `🔬`, `💡`.

---

#### `teacher` — Teacher (cardigan & glasses)
**Reference**: Generic classroom teacher — cardigan/sweater over a collared shirt, glasses, book in hand. Deliberately warmer and less corporate than `professional`.
**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0x7a4b3a,
shoe: 0x3a2a20, emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories**:
- `face`: two small lens boxes + thin bridge (thinner frame than `scientist`'s or `tech_expert`'s), color `0x1a1a1e`.
- `chest`: small white shirt-collar wedge peeking at the neckline (~`TORSO_W*0.3 × TORSO_H*0.1`), color `0xf2f2f0`.
- `hand`: flat box book (~`HAND_R*1.8 × HAND_R*2.4 × 30mm`) held at hip/chest height, cover color = tint accent with a thin white page-edge stripe along one side.
- optional `torso-front` detail: a thin vertical stripe of tiny dark buttons down the cardigan front.
**Silhouette check**: glasses + a held book distinguish this from `professional`'s same general build; the warm maroon-brown cardigan (vs. `professional`'s cold charcoal) is the secondary, color-only cue if the book hand is occluded (e.g., seated).
**Personality**: none. **Bubbles**: `📚`, `✏️`, `🍎`.

---

#### `construction-worker` — Construction Worker (hard hat & vest)
**Reference**: Generic construction/trades worker — hard hat, ANSI high-visibility vest, tool belt, work boots. Colors follow ANSI/OSHA-documented high-vis conventions (fluorescent yellow-green or orange-red are the only ANSI-approved hues) rather than a specific brand.
**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1.05, skin: tint, body: 0x9a8468,
shoe: 0x5a3d28, emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories**:
- `crown`: brimless dome half-sphere (~`HEAD_R*1.15`) with a small ridge line, color `0xf5d90a` (ANSI safety yellow) — no brim at all, the shape that most distinguishes it from every hat/cap in this pack.
- `torso-front` + `torso-back`: overlay box pair (~`TORSO_W*1.05 × TORSO_H*0.85`), color `0xf07a1e` (high-vis orange), each with 2 horizontal reflective stripe bands (`0xd9d9d9` silver, `emissiveIntensity ~0.3`) wrapping front-to-back.
- `hip`: belt box (~`TORSO_W*1.05 × TORSO_H*0.1`), color `0x3a2a20`, with 2–3 small box tool pouches + a small hammer prop (thin cylinder handle + small box head, `0x1a1a1e`) clipped at one hip.
**Silhouette check**: yellow hard-hat dome + full-torso orange vest with silver stripes is a stronger, larger-area cue than the firefighter's single chest band — the vest wraps the whole torso, not just one band.
**Personality**: `bobMul: 1.1` (heavy boots). **Bubbles**: `🔨`, `🚧`, `⚠️`.

---

#### `pilot` — Pilot (navy uniform & wings)
**Reference**: Generic commercial airline captain/first-officer archetype — navy uniform jacket, gold sleeve-cuff stripes, pilot cap with a badge, gold wings emblem. Not any specific airline's livery.
**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0x14203a,
shoe: 0x0e0e10, emI: 0.2, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories**:
- `crown`: rounded crown cylinder (~`HEAD_R*0.85` radius, taller than the police cap's) + a black brim disc (~`HEAD_R*1.15`), crown color `0x14203a` navy, brim `0x0e0e10`, small gold badge circle (~`HEAD_R*0.18`) at the front.
- `chest`: flat wide gold chevron/bar pair (~`TORSO_W*0.5 × TORSO_H*0.1`), color `0xd9c34a`, centered upper chest — approximates a wings insignia as a simple gold horizontal bar (exact wings geometry isn't representable with the primitive set).
- `hand`/cuff: 2–3 thin gold ring bands around each lower-arm cylinder near the wrist, color `0xd9c34a` (rank stripes).
- `chest`: thin dark box tie at the collar, color `0x0e0e10`.
**Silhouette check**: gold cap-badge + gold cuff rings against solid navy reads "pilot/captain" before the wings emblem is legible up close; the taller rounded crown (vs. the police officer's flatter cap) is what keeps the two navy-uniform members from silhouette-colliding.
**Personality**: `swayMul: 1.1` (confident, measured stride). **Bubbles**: `✈️`, `🧭`, `☁️`.

---

#### `nurse` — Nurse (scrubs & cross cap)
**Reference**: Generic clinical nurse — modern scrub uniform in a soft teal, plus a scrub cap carrying a small red-cross badge. The red-cross cap nods to the classic (largely historical) nurse-cap silhouette purely for toon-scale readability — modern nurses mostly wear plain scrub caps or none; the cross badge is the deliberate legibility exception in this pack.
**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0x6fb3c0,
shoe: 0xf2f2f2, emI: 0.2, hands: 'sphere', eyes: 'dots', steel: false
```
**Accessories**:
- `crown`: soft brimless dome half-sphere (~`HEAD_R*1.08`), color `0x9ed6df` (lighter teal than the body) — a poof similar in construction to the chef's toque band but much lower/flatter, no tall crown.
- `crown` front: small flat plus-sign (two crossed thin boxes), color `0xd9302f` red, ~`HEAD_R*0.22` — the load-bearing recognizability cue.
- `chest`: small tint ID badge box (~`TORSO_W*0.12 × TORSO_H*0.08`).
**Silhouette check**: the small red cross on the cap is what makes this read as "nurse" rather than "anyone in teal scrubs" at 30 px — without it the uniform alone is ambiguous.
**Personality**: `cadenceMul: 1.1` (brisk clinical pace). **Bubbles**: `💉`, `🩹`, `❤️`.

---

#### `mail-carrier` — Mail Carrier (postal uniform & satchel)
**Reference**: Generic letter carrier archetype — postal blue-grey uniform shirt & shorts/slacks, a round-brim pith-style sun helmet, an over-shoulder mail satchel. Generic "letter carrier," not any specific national postal service's branded uniform/logo.
**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: tint, body: 0x5a6a78,
shoe: 0x2c2e34, emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false,
legColor: 0x3f4a54   // slightly darker shorts/slacks
```
**Accessories**:
- `crown`: dome half-sphere (~`HEAD_R*1.2`) with a small **all-round** brim disc (not front-only like the police/pilot caps, not ridge-only like the hard hat) — the full round brim is the single geometric feature no other member in this pack has, color matches the body `0x5a6a78`.
- `back`→`hip`: a long thin box running diagonally across the torso front-to-back (reuse the `ninja` katana-strap's rotated-box + rotation.z pattern), color `0x3a2a20` brown leather.
- `hip`: box satchel bag (~`TORSO_W*0.5 × TORSO_H*0.4 × TORSO_D*0.6`) where the strap ends, color `0x3a2a20`, riding at the side.
- `chest`/sleeve: small tint patch badge (~`TORSO_W*0.14`).
**Silhouette check**: the diagonal strap + hip-slung satchel is unique in this pack — no other member wears a cross-body bag — so it reads even before the round-brim helmet registers.
**Personality**: `cadenceMul: 1.15, bobMul: 1.05` (brisk delivery-route pace). **Bubbles**: `✉️`, `📦`, `🐕` (a light, generic "dog chases the mail carrier" nod — no specific brand or person referenced).

## Rig gaps

None of the 10 new members require rig extensions — every accessory above is
buildable from the existing `box`/`cylinder`/`sphere`/`cone` primitive set on
the existing anchor list (`crown`/`head`/`face`/`chest`/`back`/`hip`/`hand`),
reusing patterns already proven by shipped kinds (transparent lens material
from `astronaut`'s helmet, the headset-band torus from `tech_expert`, the
diagonal rotated-box strap from `ninja`'s katana sling, the brim+crown
cylinder-stack from `cowboy`/`farmer`/`magician`). Two **documented
approximations**, not gaps:
- **Badge/star shapes**: exact 5–7-point police/sheriff star or fire-service
  shield geometry isn't representable with the primitive set; every badge in
  this pack is approximated as a flat diamond, circle, or small box. Fine at
  toon scale (badges are a secondary cue in every member here, never the
  primary silhouette read) — flag only if a future pack leans on a badge as
  its *primary* identifier, at which point a low-poly star/shield primitive
  (5–6 triangle fan, similar to how the shirt-cone already uses a 3-sided
  cone) would be worth adding.
- **Patterned fabric**: chef's houndstooth trousers collapse to solid
  charcoal (the no-texture, color-only constraint working as intended, not a
  defect to fix).

## Sources

- [Firefighter Helmet Colors and Their Meaning – Fire-End](https://fire-end.com/blogs/blog/firefighter-helmet-colors-and-their-meaning)
- [Helmet Colors - Police. Fire. Emergency Of Muskogee OK](https://www.muskogeepublicsafety.org/about_mfd/traditions/helmet_colors.php)
- [Chef's uniform - Wikipedia](https://en.wikipedia.org/wiki/Chef's_uniform)
- [A Brief History Of The Chef's Uniform - Escoffier](https://www.escoffier.edu/blog/culinary-arts/a-brief-history-of-the-chefs-uniform/)
- [Police uniforms in the United States - Wikipedia](https://en.wikipedia.org/wiki/Police_uniforms_in_the_United_States)
- [Why are some police uniforms light blue and others are navy? - Quora](https://www.quora.com/Why-are-some-police-uniforms-light-blue-and-others-are-navy)
- [Safety Vest Colors Explained | PowerPak](https://www.powerpak.net/blog/safety-vest-colors-explained/)
- [Understanding Safety Vest Color Lime vs. Orange, and Beyond - Traffic Safety Resource Center](https://www.trafficsafetystore.com/blog/understanding-safety-vest-color-lime-vs-orange-and-beyond/)
- Existing-kind specs verified directly against `src/three-renderer.ts` (`SPECS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES` tables and the per-kind accessory branches in the humanoid builder), not web sources.
