# Avatar pack: Overwatch

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the hero archetype, not a likeness. No logos, no
textures, no names printed anywhere in-scene; character identity lives only
in this doc's Reference lines and the pack's display labels.

## Overview

- **Group**: Marquee heroes of *Overwatch* / *Overwatch 2* (Blizzard,
  2016– ) — a near-future team-shooter whose whole art direction is bold,
  saturated, hyper-readable color-blocking with glowing tech accents (visors,
  chest cores, energy lines), which maps unusually cleanly onto this rig's
  toon-shaded, emissive-accent style.
- **Hierarchy path**: `Video Games / Overwatch`
- **Member count**: 8
- **Rig**: humanoid only. No canonical quadrupeds in the primary cast; the
  one four-limbed-ape temptation (Winston) is bipedal in-game and is kept on
  the humanoid rig — see his entry and Rig gaps.
- **Member-selection notes**: the survey's suggested eight (Tracer, D.Va,
  Reinhardt, Widowmaker, Genji, Mercy, Roadhog, Winston) hold up as the
  primary-cast set a casual player or viewer names first — verified against
  marketing/mascot prominence rather than lore depth. Tracer is literally the
  franchise's logo/mascot hero; D.Va is the roster's breakout esports/viral
  mascot; Reinhardt and Genji anchor most key art and the animated shorts;
  Mercy is consistently the most-played/most-cosplayed support; Widowmaker is
  the archetypal sniper silhouette; Roadhog and Winston round the set out
  with two builds (masked brute, genius ape) no other member is close to in
  silhouette. All eight clear the silhouette test independently with no two
  sharing a color family + build combination. Omitted: Reaper, Soldier: 76,
  Pharah, Junkrat, Mei, Hanzo, Cassidy (McCree), Zenyatta — all recognizable
  and arguably "primary cast" by some counts, but each a rung below this
  eight in mascot/marketing prominence for a first, tightly-scoped 8-member
  pack; a "Talon / villains" or "expanded roster" follow-up pack is the
  natural home for them rather than stretching this one past 12.
- **Shared style note — no single shared uniform, by design**: unlike a
  matched military pack, there is no forced shared base spec here — each
  hero is a deliberately distinct silhouette archetype (armored knight,
  cyborg ninja, sniper, mech pilot, masked brute, angelic medic, chrono
  pilot, genius ape), exactly mirroring how the game itself keeps a crowded
  roster readable at a glance through color-blocking + build rather than
  shared costuming. The one loose grouping worth naming: Reinhardt, Genji,
  and Roadhog are all heavily armored/masked (faces hidden or fully
  replaced), while Tracer, D.Va (partially), Widowmaker, and Mercy show a
  human face; Winston is the pack's sole non-human build.
- **Tint-rule note**: every member's primary costume colors are
  canon-critical and stay fixed (a red-suited Widowmaker or gold-free Mercy
  would stop reading as the character). Safe secondary recolor points if
  per-sensor/person color coding is wanted: Tracer's chronal-accelerator
  chest glow, D.Va's bunny-emblem/piping pink, Reinhardt's chest-core glow,
  Widowmaker's ponytail, Genji's energy-line green, Mercy's halo/wing-trim
  gold, Roadhog's harness straps, Winston's lab-vest.
- **Recurring accessory idiom — one big signature prop per member**: Tracer's
  twin pulse pistols, Reinhardt's rocket-hammer + barrier device, Widowmaker's
  rifle + grapple gauntlet, Genji's back-mounted katana, Mercy's staff +
  wings, Roadhog's hook-and-chain, Winston's Tesla Cannon. D.Va is the pack's
  exception — her single most iconic "prop" is an entire mech chassis (the
  MEKA) too large for this rig to carry as an accessory; this doc models her
  personal flight-suit likeness (the pilot, not the mech) and leaves the
  mech itself unmodeled, the same treatment Iron Man's suit-IS-the-body case
  gets in the Marvel pack, just inverted (there the suit is the body; here
  the vehicle is intentionally out of scope).
- **Anchor note**: this pack was authored after `shoulderL`/`shoulderR`
  landed on the humanoid anchor list, so pauldron-style shoulder armor
  (Reinhardt, Widowmaker) uses the real anchor pair directly rather than the
  older `chest`-box-pair workaround seen in pre-shoulder-anchor docs (e.g.
  the Star Wars: Mandalorian pack).

## Members

### 1. `overwatch/chrono-pilot` — "Chrono pilot (brown bomber jacket, orange accents)"

**Reference**: A time-displaced former test pilot whose experimental
"chronal accelerator" chest device keeps her anchored to the present after an
accident unstuck her in time — spiky brown hair, amber-tinted goggles pushed
up on her forehead, a worn brown leather bomber jacket over the glowing
accelerator, tan trousers, orange boots, and twin light pulse pistols; the
fastest, most kinetic hero in the roster. (Tracer / Lena Oxton.)

**Spec**
```
sk: 0.92              // small, spry build
headR: 118
headShape: 'sphere'
skin: 0xdba876         // tan human skin
body: 0x6b4a35          // brown leather bomber jacket
legColor: 0xc9b896      // tan/khaki trousers
shoe: 0xd2691e           // orange combat boots — signature accent color
eyes: 'dots'
emI: 0.1                // faint warm glow reflected off the jacket from the chest device
hands: 'box'             // fingerless gloves
limbR: 0.9
armL: 0.95
legL: 0.95
```

**Accessories**
- **crown** — goggles pushed up on the forehead: a shallow curved band,
  ~130×30×40 mm, amber-tinted lenses `0xd98e2b`, dark strap `0x3a3a3a`.
- **crown** — spiky hair tufts poking up behind/around the goggles, a few
  small cones, brown `0x4a3222`.
- **chest** — the chronal accelerator: a glowing disc (flattened cylinder),
  ~70×70×25 mm, bright cyan-blue `0x4dfffe`, emissive, sitting ~4 mm proud of
  the jacket so the glow reads as mounted ON it, not painted on.
- **back** — a thin diagonal strap/buckle band, dark brown `0x3f2c20`.
- **handL** / **handR** (twin pulse pistols, held props) — small boxes,
  ~20×40×70 mm each, gunmetal `0x5a5a5c`, one per hand.

**Silhouette check**: brown jacket + orange boots + a glowing cyan chest
disc + forehead goggles is a combination no other member shares — the only
member with a chest-mounted glow disc and the only orange-booted silhouette.

**Personality**: `bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.35, ampMul: 1.1`
(peppy, quick, blink-like energy — reads as perpetually about to dash)
**Bubbles**: `⏱️😄🔫✨` (chronal/time, cheerful confidence, twin pistols, blink flash)

---

### 2. `overwatch/mech-pilot` — "Mech pilot (blue flight suit, pink accents)"

**Reference**: A teenage pro-gamer drafted into a mech-piloting defense
corps, famous for ejecting from her disabled "MEKA" walker and fighting on
foot — a sleek blue flight suit with hot-pink piping and a pink bunny emblem
on the chest, dark hair in a high ponytail, pink cheek "war paint" dots, and
twin light guns. (D.Va / Hana Song. Her mech itself is out of scope for this
doc — see Overview.)

**Spec**
```
sk: 0.9                // young, petite build
headR: 116
headShape: 'sphere'
skin: 0xe0b190          // light tan skin
body: 0x2a5aa0           // blue flight-suit torso
legColor: 0x1c3f70       // darker blue suit legs
shoe: 0xecebe6            // white boot plating
eyes: 'almond'
emI: 0.1
hands: 'box'              // gloved
limbR: 0.9
armL: 0.92
legL: 0.92
```

**Accessories**
- **crown** — high ponytail, dark brown-black `0x2b211d`, an elongated
  box/cone trailing back off the crown.
- **face** (×2) — pink cheek-paint dots, small flattened spheres,
  `0xff6fae`, ~14×14×4 mm each, sitting proud of the skin.
- **chest** — bunny emblem: a small flattened disc, `0xff6fae`, centered on
  the chest, ~4 mm proud of the suit.
- **chest** — a white/pink armor-plate accent panel (the OW2 suit upgrade),
  a proud rectangular box, `0xecebe6` with a thin `0xff6fae` piping edge.
- **hip** — a thin pink sponsor-stripe band on one thigh, `0xff6fae`.
- **handL** / **handR** (light guns, held props) — small grey boxes,
  `0x6a6a6a`.

**Silhouette check**: blue suit + hot-pink trim/bunny emblem/cheek dots +
high ponytail — the only blue-and-pink gamer-styled member, clearly distinct
from Tracer's brown/orange despite both being small, agile builds.

**Personality**: `bobMul: 1.15, swayMul: 1.0, cadenceMul: 1.1, ampMul: 0.95`
(confident, springy, a gamer's cocky strut)
**Bubbles**: `🎮💗🐰💥` (gaming culture, pink/bunny brand, cheerful confidence, mech firepower memory)

---

### 3. `overwatch/crusader-knight` — "Crusader knight (silver plate armor, red crest)"

**Reference**: An aging, honor-bound former Crusader-programme super-soldier
clad in towering silver plate armor with a red-crested visored great-helm —
he charges the front line with a massive rocket-hammer in one hand and a
lion-emblazoned barrier-shield generator strapped to the other forearm; the
biggest, most heavily armored figure in this roster. (Reinhardt / Reinhardt
Wilhelm.)

**Spec**
```
sk: 1.35                // huge, imposing build — the pack's largest
headR: 134
headShape: 'sphere'      // visored great-helm
skin: 0xc7c9cc           // polished silver plate reads as "skin" — helmet
body: 0xc7c9cc            // silver breastplate
legColor: 0xa8abb0        // silver-grey greaves, a shade darker
shoe: 0x6b6b6c             // heavy steel sabatons
eyes: 'visor'              // full T-visor slit
emI: 0.15                 // glowing gold chest/visor accents
steel: true
hands: 'box'               // gauntlets
limbR: 1.35
armL: 1.1
legL: 1.0
footMul: [1.25, 1.15, 1.25]
```

**Accessories**
- **crown** — a tall red crest/comb running front-to-back over the dome, a
  flattened box, ~16×60×150 mm, deep red `0x8a1f1f`.
- **shoulderL** / **shoulderR** — silver pauldrons, boxes ~90×75×70 mm each,
  `0xc7c9cc`.
- **chest** — a glowing gold core accent, a small disc, `0xd4af37`,
  emissive, ~4 mm proud of the breastplate.
- **back** — twin jet-vent housings, small cylinders, dark grey `0x4a4a4a`.
- **handR** (rocket-hammer, held prop, 2 parts) — handle: a thin cylinder,
  ~20×110×20 mm, dark grey `0x4a4a4a`; hammer head: a box, ~90×70×70 mm,
  brighter silver `0xb0b3b6` with a small dark-red emblem accent.
- **handL** (barrier-shield projector, held/forearm prop) — a flattened box,
  ~70×100×30 mm, silver `0xb0b3b6`.

**Silhouette check**: by far the largest `sk` in the pack, full silver plate
head-to-toe, topped by a solid red crest — unmistakable bulk even as a
featureless grey-and-red blob at 30 px.

**Personality**: `bobMul: 0.55, swayMul: 0.3, cadenceMul: 0.6, ampMul: 1.3`
(heavy, thunderous, unhurried strides — the slowest cadence paired with the
biggest stride amplitude in the pack)
**Bubbles**: `🛡️🔨⚡👴` (shield/protection, hammer, electric barrier crackle,
veteran/grandfatherly warmth)

---

### 4. `overwatch/shadow-sniper` — "Shadow sniper (pale blue skin, violet catsuit)"

**Reference**: A former Overwatch agent captured and biologically/
psychologically reconditioned into an elite assassin — pale blue-grey skin
and glowing yellow eyes (side effects of the process that slowed her
heartbeat to near-undetectable), dark hair in a long ponytail, a form-fitting
violet catsuit open at the chest with segmented black lower-body armor, a
grappling-hook gauntlet, and a collapsible sniper rifle. (Widowmaker /
Amélie Lacroix.)

**Spec**
```
sk: 0.98
headR: 120
headShape: 'sphere'
skin: 0x8fa8c2          // pale blue-grey skin
body: 0x5b3f7a           // violet catsuit torso
legColor: 0x1c1c1e       // black segmented leg armor
shoe: 0x141414            // black boots
eyes: 'almond'            // canon eyes glow yellow — see Rig gaps (eye-color-override, already parked in ROADMAP)
emI: 0.15
hands: 'box'               // gloved
limbR: 0.85                // lean, athletic build
armL: 0.95
legL: 1.0
```

**Accessories**
- **crown** — a long dark ponytail, near-black blue `0x1c1e2e`, trailing
  back off the crown.
- **shoulderL** — a single small shoulder guard plate, black `0x1c1c1e`
  (asymmetric — only her left shoulder is armored in canon; keep it one-sided).
- **hip** — a small dark utility pouch, `0x1c1c1e`.
- **handL** (grapple-hook gauntlet, worn prop) — a boxy cylinder, gunmetal
  `0x5a5a5c`.
- **handR** (sniper rifle, held prop) — a long thin box, dark grey `0x3a3a3c`.

**Silhouette check**: pale blue-grey skin + violet catsuit + black segmented
lower armor + long dark ponytail — the only blue-skinned member in the pack,
unmistakable even before the rifle silhouette registers.

**Personality**: `bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.85, ampMul: 0.6`
(a slow, controlled, predatory glide — silent and precise)
**Bubbles**: `🎯🕷️💜😐` (sniper focus, spider motif, violet identity, cold detachment)

---

### 5. `overwatch/cyber-ninja` — "Cyber ninja (silver armor, green energy lines)"

**Reference**: Once a mortal ninja, rebuilt as a cybernetic warrior after a
near-fatal duel with his own brother left almost nothing of his organic body
— sleek silver-and-white armor plating traced with glowing green energy
lines, a green-visored helmet, a trailing dark scarf/ribbon, and a katana
carried across his back. (Genji / Genji Shimada.)

**Spec**
```
sk: 0.95                // lean, agile build
headR: 118
headShape: 'sphere'
skin: 0xdcdcd8           // silver-white armor plating reads as "skin" — fully encased
body: 0xdcdcd8            // white/silver torso plating
legColor: 0xb8b8b4        // slightly darker silver-grey leg plating
shoe: 0x2a2a2c             // dark foot housings
eyes: 'redvisor'           // override glow color to green 0x2ecc71 — canon color, not red; a
                            // known parked gap (eye-color override), see Rig gaps
emI: 0.3                  // glowing green visor + energy lines
steel: true
hands: 'box'
limbR: 0.85                // slender, agile build
armL: 1.0
legL: 1.05
```

**Accessories**
- **chest** / **armL** / **armR** / **legL** (energy lines, ×4) — thin
  proud boxes tracing the plating seams, emissive green `0x2ecc71`, ~4 mm
  proud of the armor.
- **crown** — a dark ribbon/hair-tail trailing from the back of the helmet,
  a thin elongated box, near-black `0x1a1a1a`.
- **back** — a katana sheath, a long thin cylinder, dark grey `0x2e2e30`,
  angled diagonally across the back.
- **chest** — a dark scarf wrap at the neckline, a thin band, charcoal
  `0x2a2a2a`.

**Silhouette check**: all-silver/white armor traced in glowing green energy
lines, a green visor, and a back-mounted katana — the pack's only
green-energy-accented member and its only visible bladed weapon.

**Personality**: `bobMul: 0.5, swayMul: 0.35, cadenceMul: 1.2, ampMul: 0.7`
(swift, precise, near-silent ninja footwork)
**Bubbles**: `⚔️🍃🟢🥷` (blade, honor/discipline, cyber-green glow, ninja stealth)

---

### 6. `overwatch/guardian-medic` — "Guardian medic (white & gold suit, wings)"

**Reference**: A brilliant field physician whose experimental "Valkyrie"
suit grants flight and rapid remote healing (and, in an emergency, brief
resurrection) — blonde hair pulled back, a gold halo-shaped headpiece, a
white-and-gold armored suit, and large mechanical angel-like wings; carries
a golden staff that channels a healing (or damage-boosting) beam. (Mercy /
Dr. Angela Ziegler.)

**Spec**
```
sk: 0.95
headR: 116
headShape: 'sphere'
skin: 0xe7c3a0           // fair skin
body: 0xf0ece0            // white Valkyrie-suit torso
legColor: 0xd4af37        // gold greaves/leg plating
shoe: 0xf0ece0             // white boots
eyes: 'almond'
emI: 0.1                  // soft halo/wing-trim glow
hands: 'box'
limbR: 0.85
armL: 0.95
legL: 0.95
```

**Accessories**
- **crown** — blonde hair pulled back, `0xf0c93d`, ~130×50×130 mm.
- **crown** — a floating halo ring, a flattened cylinder disc, gold
  `0xffd700`, emissive, hovering just above the hairline (approximates a
  ring/torus — see Rig gaps; the true "halo" hollow-center read isn't
  available with today's primitives, so this reads as a glowing disc).
- **back** (×2, wings) — large flattened cone/box wing sails, white
  `0xf5f0e6` with a proud gold leading-edge trim accent `0xd4af37`, angled
  outward and slightly back from the shoulder line, ~380 mm span each.
- **chest** — gold bodice trim accents, thin proud bands, `0xd4af37`.
- **handR** (staff, held prop, 2 parts) — shaft: a thin long cylinder, gold
  `0xd4af37`; tip: a small glowing sphere, `0xffe066`, emissive.

**Silhouette check**: white-and-gold suit + large white wings + a floating
gold halo — the pack's only winged member, unmistakable even in silhouette.

**Personality**: `bobMul: 0.8, swayMul: 0.6, cadenceMul: 0.95, ampMul: 0.75`
(graceful, composed, a caretaker's steady bearing)
**Bubbles**: `😇💛🩹🕊️` (angelic/guardian, healing glow, medic aid, flight/peace)

---

### 7. `overwatch/junker-brute` — "Junker brute (gas mask, hook & chain)"

**Reference**: A hulking Australian outlaw who survived the catastrophic
meltdown that turned his homeland into a radioactive wasteland, his ravaged
face permanently hidden behind a scarred pig-snouted gas mask — a massive
bare-chested frame, studded leather harness and bracelets, grey cargo pants,
and a signature chain hook used to yank enemies close before finishing them
with a scrap gun. (Roadhog / Mako Rutledge.)

**Spec**
```
sk: 1.5                  // the pack's largest, heaviest build
headR: 128
headShape: 'box'          // angular gas-mask silhouette
skin: 0xb0895f            // weathered tan bare skin
body: 0xb0895f             // bare torso, same weathered skin — shirtless
legColor: 0x6b6b62         // grey cargo pants
shoe: 0x3a2f24              // worn combat boots
eyes: 'slit'                // narrow mask eye-slits
emI: 0
hands: 'box'
limbR: 1.5                 // massive limbs
armL: 1.05
legL: 0.9
footMul: [1.2, 1.1, 1.2]
posture: { pitch: 0.08 }   // a slouched, lumbering forward lean
```

**Accessories**
- **head** — the gas-mask snout, a box/cylinder projecting from the face,
  steel grey `0x6b6f66`, with two small tusk-like cones either side, bone
  `0xd8d0c0`.
- **head** (×2, mask filter vents) — small cylinders, dark grey `0x3a3a3a`,
  flanking the snout.
- **chest** — crossing leather harness straps, thin proud boxes, dark brown
  `0x2a1f18`.
- **handL** — a studded leather bracelet, a small box, `0x2a1f18` with tiny
  metal stud dots.
- **handL** (chain hook, held prop) — a short angled cone approximating the
  hook's curve, gunmetal `0x5a5a5c` (see Rig gaps — no true curved/hook
  primitive), plus a short chain-link box trail.
- **handR** (scrap gun, held prop) — a bulky short box, dark grey `0x3a3a3a`.

**Silhouette check**: an enormous bare-skinned bulk topped by a boxy
pig-snout gas mask — the pack's biggest build and its only "shirtless
brute" silhouette; unmistakable even as a featureless tan-and-grey blob.

**Personality**: `bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.6, ampMul: 1.1`
(a heavy, rolling biker's swagger)
**Bubbles**: `🐷⛓️💀😤` (mask/pig motif, hook & chain, danger, gruff temper)

---

### 8. `overwatch/genius-primate` — "Genius primate (dark fur, lab vest, glasses)"

**Reference**: A genetically-enhanced, hyper-intelligent ape raised and
educated aboard a lunar research colony after a failed experiment killed his
mentor — dark fur, round wire-frame glasses inherited from that mentor, a
white lab-vest worn open over rolled cargo shorts, and a jump-jet pack on
his back; wields a crackling Tesla Cannon. (Winston.)

**Spec**
```
sk: 1.3                  // large, powerful ape build
headR: 132
headShape: 'sphere'
skin: 0x2b2b2e            // dark gorilla fur
body: 0x2b2b2e             // bare furred torso beneath the open vest
legColor: 0x2b2b2e         // furred legs, bare below the rolled shorts
shoe: 0x2b2b2e              // bare furred feet — no shoes
eyes: 'dots'
emI: 0
hands: 'sphere'            // rounder ape knuckles
limbR: 1.45                // huge muscular arms
armL: 1.4                  // long ape-proportioned arms
legL: 0.8                  // short legs relative to torso/arms
footMul: [1.3, 1.0, 1.3]
posture: { pitch: 0.15 }   // permanent ape forward-hunch
```

**Accessories**
- **face** — round wire-frame glasses, two small flattened cylinder rings,
  dark `0x1c1c1c`, joined by a thin bridge box.
- **chest** — a white lab-vest, an open sleeveless panel, cream-white
  `0xe8e4da`, hanging ~5 mm proud of the fur so it doesn't hatch against it.
- **hip** — rolled cargo shorts, a wide box, tan/khaki `0x8a7c5a`, waist to
  upper thigh.
- **back** (×2, jump-jet thrusters) — small cylinders, dark grey `0x3a3a3c`.
- **handR** (Tesla Cannon, held prop) — a bulky long box, gunmetal
  `0x5a5a5c`.

**Silhouette check**: an enormous dark-furred, forward-hunched build with
round glasses and a white lab-vest is unmistakable — the pack's only
non-human silhouette and, built on the humanoid rig at this scale, its
biggest head-to-body bulk after the crusader knight.

**Personality**: `bobMul: 0.75, swayMul: 0.4, cadenceMul: 0.7, ampMul: 1.3`
(a loping, knuckle-heavy, powerful gait — gentle-giant energy)
**Bubbles**: `🦍🔬🤓⚡` (ape/primate identity, scientist, glasses/genius, Tesla Cannon crackle)

## Rig gaps

- **No ring/torus primitive.** Mercy's signature floating halo is a hollow
  glowing ring; the only available shapes (box/sphere/cylinder/cone) can
  only approximate it as a solid flattened disc, losing the "ring" read
  (visible hollow center) at anything but a distance. A true torus/ring
  shape would generalize past this pack — halos, generic energy rings, and
  hoop-style jewelry/props in any future franchise pack.
- **No curved/hook-shaped primitive.** Roadhog's signature weapon is a
  chain-and-hook whose defining silhouette IS the hook's curve; today's
  straight-edged primitives (a cone stands in here) can't represent a bent
  or L-shaped prop. This would also help any future grappling-hook, cane, or
  shepherd's-crook style prop in other packs.
- **Large hunched-ape build on the humanoid rig is a stretch, not a gap per
  se.** Winston isn't a quadruped in canon (he stands and fights bipedally),
  so the humanoid rig is the right fit, but getting a convincing "ape, not
  just a big hunched human" read leans on `posture.pitch` + long `armL` +
  short `legL` + `sk 1.3` all at once — the same combination already used
  for Hulk in the Marvel pack. Noted here only because a THIRD franchise
  pack wanting this exact build (oversized ape/primate/ogre-type humanoid)
  would be a good trigger to promote it to a named preset rather than
  re-deriving the same five fields each time.

## Sources

- [TRACER Color Palette — color-hex.com](https://www.color-hex.com/color-palette/23345)
- [Tracer Reference Color Palette — color-hex.com](https://www.color-hex.com/color-palette/21418)
- [Tracer reference guide (PDF) — Blizzard](https://static.playoverwatch.com/media/reference/tracer_reference.pdf)
- [Tracer — Overwatch Wiki, Fandom](https://overwatch.fandom.com/wiki/Tracer)
- [D.Va (Overwatch) — Cosplay Reference Wiki, Fandom](https://cosref.fandom.com/wiki/D.Va_(Overwatch))
- [D.Va/Cosmetics — Overwatch Wiki, Fandom](https://overwatch.fandom.com/wiki/D.Va/Cosmetics)
- [D.Va Overwatch 2 Hero Guide — esports.net](https://www.esports.net/news/overwatch/overwatch-2-dva/)
- [Reinhardt — Overwatch Wiki, Fandom](https://overwatch.fandom.com/wiki/Reinhardt)
- [Reinhardt (Overwatch) — Wikipedia](https://en.wikipedia.org/wiki/Reinhardt_(Overwatch))
- [Overwatch — Heroes — Reinhardt, Blizzard](https://overwatch.blizzard.com/en-us/heroes/reinhardt/)
- [Widowmaker (Overwatch) — Wikipedia](https://en.wikipedia.org/wiki/Widowmaker_(Overwatch))
- [Widowmaker (Overwatch) — Cosplay Reference Wiki, Fandom](https://cosref.fandom.com/wiki/Widowmaker_(Overwatch))
- [Genji — Overwatch Wiki, Fandom](https://overwatch.fandom.com/wiki/Genji)
- [Overwatch — Heroes — Genji, Blizzard](https://overwatch.blizzard.com/en-us/heroes/genji/)
- [Dress Like Mercy Costume — costumewall.com](https://costumewall.com/dress-like-mercy/)
- [Mercy (Overwatch) — Cosplay Reference Wiki, Fandom](https://cosref.fandom.com/wiki/Mercy_(Overwatch))
- [Roadhog — Overwatch Wiki, Fandom](https://overwatch.fandom.com/wiki/Roadhog)
- [Roadhog (Overwatch) — Wikipedia](https://en.wikipedia.org/wiki/Roadhog_(Overwatch))
- [Winston — Overwatch Wiki, Fandom](https://overwatch.fandom.com/wiki/Winston)
- [Winston (Overwatch) — Wikipedia](https://en.wikipedia.org/wiki/Winston_(Overwatch))
- [Symbolism Saturday: Glasses in Overwatch — Pop Culture Literary Tutor](https://popcultureliterarytutor.wordpress.com/2019/07/06/symbolism-saturday-glasses-in-overwatch/)
- General character/appearance knowledge of *Overwatch*'s primary cast
  (Tracer, D.Va, Reinhardt, Widowmaker, Genji, Mercy, Roadhog, Winston) as
  broadly documented across Overwatch reference sources (Overwatch Wiki/
  Fandom hero and cosmetics pages, Blizzard's official hero pages, cosplay
  reference libraries).
