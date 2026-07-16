# Franchise pack: Transformers — Generation 1 (G1) cast

**Hierarchy path**: `docs/avatars/sci-fi/transformers.md` — a franchise pack
under `docs/avatars/sci-fi/`. These are stylized geometric toon homage
figures (blocky Sims-style minifigures inspired by the 1984-87 cartoon/toy
silhouettes and color-coding) — no likenesses, no logos, no faction insignia
geometry (Autobot/Decepticon brands are never modeled). Every member below
uses a **descriptive-generic label** for in-app display; the actual
character name lives only in the Reference line of this doc.

## Overview

Seven members, all built on the standard humanoid rig (`sk`/`headR`/
`headShape`/`limbR`/`skin`/`body`/`shoe`/`emI`/`hands`/`eyes`/`steel`/`armL`/
`legL`/`footMul`/`legColor`) — no quadrupeds in this pack (Transformers G1
alt-modes are vehicles/jets, not animals, so nothing rides the quadruped
rig).

**Pack-wide base spec — "boxy robot" silhouette**: every member sets
`headShape: 'box'`, `hands: 'box'`, and `steel: true`. This is the one
shared convention across the whole pack (Autobot and Decepticon alike) and
is what reads as "giant transforming robot" before any faction color
registers — a sphere-headed member here would look like it wandered in from
a different pack. Members otherwise vary `sk` (overall scale) and `limbR`
(limb thickness) per body type: `1.15`/bulky for the two leaders and the
old-guard weapons specialist, `0.80`/small for the compact scout, `1.0` for
the rest.

**Shared palette approach**: G1's character design language is large flat
panels of 1-3 saturated colors per bot (no gradients/decals in the source
material), which maps directly onto this rig's flat-hex `skin`/`body`/
`legColor`/`shoe` fields — little improvisation needed. Faction reads warm
vs. cool at a glance: Autobots skew red/blue/yellow/white with **blue**
glowing eyes/accents; the one Decepticon here (plus the seeker, also
Decepticon) skews silver/grey/black with **red** glowing eyes/accents. Where
a toy's signature color would collide with the "no logos" rule (faction
symbols on the chest), this pack substitutes a **non-branded panel/window/
cross/orb accent** in roughly the same position instead — the shape/color
block reads as "that character" without reproducing the actual brand.

**Shared technique — chest/face emissive accents**: G1's most repeated
design element (cockpit windows, fusion-cannon glow, chevrons, energy
cores) is a small flat glowing panel. Every member below gets exactly one
signature `emI`-driven accent (chest window, chest cross, chest orb, cockpit
canopy sliver) rather than lighting the whole body — keeps them from
reading as generic "glowy robot" and ties each accent to that character's
real signature detail.

**Shared technique — arm-mounted armament**: two members (the villain
leader's fusion cannon, the weapons specialist's shoulder cannons) need a
gun/turret bigger than a hand-held prop that should still ride the arm/
shoulder rather than float at a fixed body anchor. The current rig only
offers a `hand` anchor (sized for held props) and a `back` anchor (fixed to
the torso, doesn't follow arm rotation) — neither is quite right for a
built-in forearm cannon. This pack uses `hand` anyway (oversized) as the
closest approximation; see Rig gaps.

## Members

### 1. `tf-autobot-leader` — Autobot Leader (red/blue, semi trailer)

**Reference**: Optimus Prime — leads the Autobots, transforms into a red
Freightliner-style semi truck (cab only in G1, no separate trailer robot
parts). Cartoon-canonical color-blocking: **red** chest/torso, **blue**
lower body/legs, a grey face behind a mouthless battle mask, **blue** eyes,
a chrome grille, twin **translucent blue "chest windows,"** and twin
exhaust smokestacks rising from the back/shoulders. Widely read as the
most heroic, dignified silhouette in the cast.

**Spec**:
```
sk: 1.15, headR: 140, headShape: 'box', limbR: 1.15,
skin: 0xb0b4ba,    // grey face + hands
body: 0xc41e3a,    // red torso
legColor: 0x1b4f91, // blue legs
shoe: 0x8fa8c8,    // chrome-blue feet
emI: 0.15, hands: 'box', eyes: 'visor', steel: true,
armL: 1.05, legL: 1.05
```

**Accessories**:
- Head fins (×2, mirrored): box, `crown` anchor, ~40×90×15 mm, `0xb0b4ba` (chrome-grey), tilted outward ~0.3 rad — the twin fin/funnel crest silhouette above his temples.
- Battle mask: flattened box, `face` anchor over the lower half of the face, ~90×50×20 mm, `0xb0b4ba` — the mouthless grille mask under the visor-eye band.
- Chest grille + windows: grille box, `chest` anchor, ~140×60×15 mm, `0xc8ccd2` (chrome), PLUS two small emissive boxes flanking center, ~30×40×10 mm each, `0x4fc3f7` emissive @ ~0.3, proud 8 mm of the grille face (coincident-face gotcha) — the translucent blue chest windows.
- Exhaust stacks (×2, mirrored): cylinder, `back` anchor (upper back), ~25 mm dia × 140 mm, `0xc8ccd2` (chrome), vertical — his signature smokestacks.
- Waist belt: thin box, `hip` anchor, ~140×30×10 mm, `0xc8ccd2` with a small centered chrome square — marks the red/blue torso-to-leg seam.

**Silhouette check**: red torso over blue legs with the twin head fins is
the one combo that reads Optimus at 30 px — no other member in this or
sibling packs pairs that exact split. Fully achievable with the current
rig.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 0.9, ampMul: 1.1 }` — steady, dignified, long confident strides; minimal waddle befitting a semi-truck-sized leader.
**Bubbles**: `🛡️ ⚙️ 🔥 ✊`

---

### 2. `tf-decepticon-leader` — Decepticon Leader (silver, hand cannon)

**Reference**: Megatron — leads the Decepticons, transforms into a
Walther P38-style handgun. Cartoon/toy-canonical: **silver/gunmetal grey**
body with **black** lower legs/thighs, **red** glowing eyes, and a long
**fusion cannon** replacing his right forearm (his signature weapon and
alt-mode barrel in one). A small purple waist-trim nod acknowledges the
character's later (Classics-era) purple accent without making it dominant —
G1 him is silver/black/grey first.

**Spec**:
```
sk: 1.15, headR: 130, headShape: 'box', limbR: 1.15,
skin: 0x9aa0a6,     // silver-grey head/hands
body: 0x9aa0a6,     // silver-grey torso
legColor: 0x2b2b2e, // black thighs/legs
shoe: 0x2b2b2e,
emI: 0.2, hands: 'box', eyes: 'redvisor', steel: true,
armL: 1.05, legL: 1.0
```

**Accessories**:
- Vent fins (×2, mirrored): box, `crown` anchor, ~30×50×10 mm, `0x4a4c50` (dark gunmetal), flanking the helmet.
- Sight window: flattened cylinder disc, `chest` anchor, ~60 mm dia, `0x23262b` (dark glass) with a faint red emissive rim @ ~0.15 — the rear-sight-style chest detail nodding to his gun alt-mode.
- **Fusion cannon** (RIGHT hand only, oversized): long cylinder barrel, `hand` anchor, ~40 mm dia × 220 mm, `0x3a3c40` (dark gunmetal) with two chrome ring accents `0xc8ccd2` — mounted in place of/over the hand, reads as an integrated forearm weapon rather than a held prop. See Rig gaps.
- Waist trim: thin box, `hip` anchor, ~140×20×10 mm, `0x6a3fa0` (purple accent) — the one warm-color break in an otherwise cool-toned bot.

**Silhouette check**: the oversized barrel replacing the entire right hand,
against an all-silver/black body, is unmistakable even in outline — no
other member has an arm-mounted weapon this size. The `hand`-anchor
oversizing is a stretch of that anchor's normal "held prop" scale (see Rig
gaps) but renders fine.

**Personality**: `{ bobMul: 0.8, swayMul: 1.0, cadenceMul: 0.85, ampMul: 1.0 }` — slow, deliberate, menacing march; no wasted motion.
**Bubbles**: `💀 ⚡ 👑 💢`

---

### 3. `tf-autobot-scout` — Autobot Scout (yellow, small)

**Reference**: Bumblebee — small, young Autobot scout, transforms into a
yellow Volkswagen Beetle. Cartoon-canonical: bright **yellow** all over,
**black** trim (bumper/rocker-panel accents), a small head with distinctive
**horn-shaped antennae**, and blue eyes. The smallest, cutest member of the
cast — deliberately undersized (`sk`) relative to everyone else here.

**Spec**:
```
sk: 0.80, headR: 118, headShape: 'box', limbR: 0.95,
skin: 0xf4c60e,     // yellow head/hands
body: 0xf4c60e,     // yellow torso
legColor: 0x1c1c1e, // black rocker-panel legs
shoe: 0x1c1c1e,
emI: 0.1, hands: 'box', eyes: 'dots', steel: true,
armL: 0.95, legL: 0.9
```

**Accessories**:
- Horn antennae (×2, mirrored): thin curved cylinder, `crown` anchor, ~10 mm dia × 70 mm, `0x1c1c1e` (black), curving inward — his signature "horned" head silhouette.
- Bumper bar: box, `chest` anchor, ~130×25×15 mm, `0x1c1c1e` (black), with a small centered silver "grille" disc, ~30 mm dia, `0xc8c8c8` — the VW front-bumper motif on the chest.
- Engine-deck bump: shallow dome box, `back` anchor, ~100×60×30 mm, `0x1c1c1e` — a light nod to the Beetle's rear engine hood.
- Waist trim: thin box, `hip` anchor, ~120×20×10 mm, `0x1c1c1e` matching the rocker-panel black.

**Silhouette check**: small scale + bright unbroken yellow + black horn
antennae reads instantly, even before the bumper bar registers — the
smallest member in the pack by a wide margin, which is itself the tell.

**Personality**: `{ bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.3, ampMul: 0.85 }` — peppy, quick little steps; short legs, short stride, high energy.
**Bubbles**: `🐝 ⚡ 🚗 😊`

---

### 4. `tf-autobot-weapons-specialist` — Weapons Specialist (black, twin cannons)

**Reference**: Ironhide — the oldest, toughest, most battle-tested Autobot,
serves as Optimus's bodyguard; transforms into a van/pickup with a
combat-deck weapon station on the roof. His mainline G1 toy is red, but his
**original Japanese Diaclone precursor toy was cast in black** — this pack
uses that black variant (kept as a small red chest stripe callback to the
familiar red) to keep him visually distinct from the already-red Autobot
leader in this lineup, and because "gruff black tank of a bot" reads well
against Optimus's brighter red/blue.

**Spec**:
```
sk: 1.15, headR: 132, headShape: 'box', limbR: 1.2,
skin: 0x3a3a3e,     // dark grey head/hands
body: 0x1c1c1e,     // near-black torso
legColor: 0x1c1c1e,
shoe: 0x1c1c1e,
emI: 0.15, hands: 'box', eyes: 'visor', steel: true,
armL: 1.0, legL: 1.0
```

**Accessories**:
- Jaw guard: flattened box, `face` anchor across the lower face, ~90×40×20 mm, `0x4a4c50` (dark grey) — the jutting, gruff-veteran read.
- Chest grille + stripe: box, `chest` anchor, ~130×50×10 mm, `0x9aa0a6` (silver) with a thin diagonal red stripe box on top, ~120×20×10 mm, `0x7a1f1f` — the one red callback to his classic toy color.
- **Shoulder cannons** (×2, mirrored, oversized): two stacked cylinders, `back` anchor (upper back, angled up-and-out), ~35 mm dia × 100 mm each, `0x3a3c40` (dark gunmetal) with chrome ring highlights `0xc8ccd2` — his signature twin combat-deck turret.
- Waist belt: thick box, `hip` anchor, ~140×30×10 mm, `0x9aa0a6`.

**Silhouette check**: the black body with twin shoulder-mounted cannon
cylinders reads as "bodyguard bristling with weapons" — distinct from
Optimus (no shoulder guns, brighter colors) even though both are Autobots
of similar bulk.

**Personality**: `{ bobMul: 0.9, swayMul: 1.1, cadenceMul: 0.85, ampMul: 1.05 }` — heavy, gruff, tank-like waddle; deliberate old-soldier gait.
**Bubbles**: `💥 🔫 🛠️ 😤`

---

### 5. `tf-autobot-medic` — Autobot Medic (white, red cross)

**Reference**: Ratchet — Autobot chief medical officer, transforms into a
white ambulance/cargo van. Cartoon-canonical: **white** body with **red**
stripes/cross markings and a grey chevron on the white helmet-shaped head;
gentle, caretaker demeanor relative to the rest of the cast.

**Spec**:
```
sk: 1.0, headR: 128, headShape: 'box', limbR: 1.0,
skin: 0xe8e8e6,     // white head/hands
body: 0xf2f2f0,     // white torso
legColor: 0xf2f2f0,
shoe: 0xd6362a,     // red trim boots
emI: 0.15, hands: 'box', eyes: 'dots', steel: true,
armL: 1.0, legL: 1.0
```

**Accessories**:
- Helmet chevron: shallow chevron-shaped box, `crown` anchor, ~70×15×10 mm, `0x9aa0a6` (grey) — the "white helmet with grey chevron" cartoon-canonical detail.
- Chest cross: two crossed thin boxes, `chest` anchor, ~50×50 mm overall, `0xd6362a` (red), emissive @ ~0.2 — the medical cross, standing in for any branded emblem.
- Side stripes (×2): thin box, `chest`/torso edges, ~15×140×5 mm each, `0xd6362a` — ambulance livery stripes down the torso sides.
- Medical kit: small box, `back` anchor, ~70×50×30 mm, `0x9aa0a6` (grey) with a tiny red cross decal box on its face.
- Waist trim: thin box, `hip` anchor, ~130×20×10 mm, `0xd6362a`.

**Silhouette check**: unbroken white body + centered red cross is the
read — no other member in the pack is majority-white, so the cross alone
seals it even before the chevron registers.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.1, ampMul: 1.0 }` — brisk, efficient, purposeful — a medic who moves with intent, not swagger.
**Bubbles**: `🩹 🔧 ❤️ 🚑`

---

### 6. `tf-decepticon-seeker` — Decepticon Seeker (grey/blue, jet wings)

**Reference**: Starscream — ambitious, scheming Decepticon air commander,
transforms into an F-15-style jet fighter. Cartoon/toy-canonical:
**silver-grey** body, **navy blue** highlights on fists/toes/legs, a
**greyish-black** head, a warm **yellow** cockpit-canopy accent, red
stickered stripes on the wings, and **red** glowing eyes. The only jet
(rather than ground-vehicle) silhouette in this pack — the back-mounted
wings are the giveaway.

**Spec**:
```
sk: 1.0, headR: 126, headShape: 'box', limbR: 0.9,
skin: 0x2e3a4d,     // dark blue-grey head/hands (greyish-black head + navy fists in one field)
body: 0xacb2b8,     // silver-grey torso
legColor: 0x1e3a5f, // navy blue legs
shoe: 0x16283f,     // navy toes
emI: 0.2, hands: 'box', eyes: 'slit', steel: true,
armL: 0.95, legL: 1.0
```

**Accessories**:
- Nosecone crest: cone, `crown` anchor, ~40 mm dia × 90 mm, `0xacb2b8` (silver-grey), tilted back — the F-15 nosecone read rising off the back of the head.
- Cockpit brow sliver: thin flattened box, `face` anchor above the brow, ~70×15×8 mm, `0xf2c230` (warm yellow), emissive @ ~0.2 — echoes the cartoon's warm-yellow cockpit-glass detail.
- Chest canopy + stripe: flattened box, `chest` anchor, ~90×60×10 mm, `0xf2c230` emissive @ ~0.15, with a thin red stripe box above it, ~120×15×8 mm, `0xc81e2a` — cockpit window + the red wing/chest striping.
- **Jet wings** (×2, mirrored): large flattened tapered box, `back` anchor, ~180×90×10 mm each, `0x6e7a85` (grey-blue), swept back and outward ~0.4 rad, with a thin red trailing-edge stripe on each — the single most important accessory in the pack for reading "jet, not car."
- Waist trim: thin box, `hip` anchor, ~130×20×10 mm, `0x1e3a5f` (navy), matching the legs.

**Silhouette check**: the swept-back wing pair rising off the shoulder
blades is the signature — nothing else in this pack (or ground-vehicle
Autobots) has a back silhouette like it, readable even before the red
eyes/yellow cockpit register.

**Personality**: `{ bobMul: 1.1, swayMul: 1.3, cadenceMul: 1.05, ampMul: 1.0 }` — arrogant strut; exaggerated lateral sway sells the swaggering, self-important seeker.
**Bubbles**: `🛩️ 😈 👑 💢`

---

### 7. `tf-autobot-elder` — Autobot Elder (silver/purple, energon core)

**Reference**: Alpha Trion — one of the oldest living Autobots, a
scholar/keeper-of-records archetype who mentors younger bots; one of the
few Transformers ever shown with visible signs of age (a "beard," a
stooped bearing). Cartoon-canonical palette leans **grey/silver** with
**burgundy/purple** accents; this pack renders his signature "ancient
power source" detail (present across modern toy interpretations as a
translucent orb in the chest) as a small **emissive orange core** — the
one warm color break against an otherwise cool, dignified elder palette,
and a deliberate deviation from a flatter "orange/silver" brief toward the
character's actual canonical grey/purple/silver look plus that one orange
accent.

**Spec**:
```
sk: 1.05, headR: 130, headShape: 'box', limbR: 1.0,
skin: 0x9aa0a6,      // grey/silver head/hands
body: 0x9aa0a6,      // grey/silver torso
legColor: 0x6e7278,  // darker grey robe-hem legs
shoe: 0x6e7278,
emI: 0.25, hands: 'box', eyes: 'almond', steel: true,
armL: 0.95, legL: 0.9
```

**Accessories**:
- Brow ridge: thin box, `crown` anchor, ~70×10×8 mm, `0xc9cdd1` (light silver) — a subtle age/wisdom line rather than hair.
- Beard: tapering cone, `face` anchor at the chin, ~30 mm dia × 90 mm (wide at chin, tapering down), `0xc9cdd1` (silver-grey) — the specific "signs of aging" detail the character is known for in the cartoon model sheets.
- Chest core: sphere, `chest` anchor, ~50 mm dia, `0xff8c1a` emissive @ ~0.6, set into a grey housing ring (flattened cylinder disc, ~70 mm dia, `0x9aa0a6`) — his glowing "ancient power source," the one warm accent.
- Cape/robe: wide flattened cone, `back` anchor, ~160 mm wide × 220 mm tall, `0x5b3a78` (purple), draping down the back — the elder-sage silhouette cue, distinct from every armored/militant bot in the rest of the pack.
- Waist sash: thin box, `hip` anchor, ~140×30×10 mm, `0x5b3a78` (purple), matching the cape.

**Silhouette check**: the draped purple back-cape is the one shape nobody
else in this pack has (everyone else reads as armored plating, not cloth-
like drapery) — combined with the slower, stooped gait it reads "elder"
even before the orange chest core registers.

**Personality**: `{ bobMul: 0.7, swayMul: 0.8, cadenceMul: 0.6, ampMul: 0.6 }` — slow, shuffling, stooped elder gait — deliberately the most subdued personality in the pack.
**Bubbles**: `📜 🕯️ 🔮 ⚙️`

---

## Rig gaps

1. **No arm-mounted / shoulder-mounted weapon anchor.** The villain leader's
   fusion cannon (replacing the entire right forearm) and the weapons
   specialist's twin shoulder cannons both want an oversized weapon that
   rotates WITH the arm/shoulder, not a small prop gripped in an open hand
   nor a fixed torso-relative `back` plate. This pack approximates both with
   existing anchors stretched past their normal scale (`hand` sized up ~4×
   for the fusion cannon; `back` used for the shoulder cannons, which reads
   fine standing still but won't follow arm-swing animation). This is the
   same family of gap the base `robotic` pack flagged (`docs/avatars/base/
   robotic.md`, gap 5: "no dedicated shoulder/limb-band accessory anchor")
   and the base `scifi` pack flagged for `space-marine` pauldrons — this is
   now a **third independent pack** hitting essentially the same need
   (shoulder/arm-relative accessory anchoring), which should raise its
   priority for a real rig extension.
2. **No box-head "fin/crest" primitive beyond generic boxes.** Every G1 bot
   in this pack has a distinctive head crest (Prime's twin fins, Starscream's
   nosecone, Ironhide's plain helmet, Alpha Trion's brow ridge) built from
   plain box/cone primitives at the `crown` anchor. It works, but a
   dedicated "vehicle-mode kibble" accessory kind (small flat panels that
   suggest folded-up vehicle parts around the head/shoulders, common to
   almost every G1-style transforming-robot design) would generalize better
   than one-off box shapes if more Transformers-adjacent (or generic
   "giant robot") packs get added later.
3. **No cloth/drape-simulated accessory.** Alpha Trion's cape/robe is
   approximated with a static flattened cone at the `back` anchor. It reads
   fine motionless or walking slowly (his gait is deliberately subdued), but
   there's no drape/sway physics — acceptable here since he's the one
   slow-moving elder, but would read stiffly on a faster-moving caped
   character in a future pack.

None of these gaps blocked building this pack; all seven members are fully
expressible with the current rig via the workarounds above.

## Sources

- [Ironhide (G1) — Transformers Wiki](https://tfwiki.net/wiki/Ironhide_(G1))
- [Ironhide (G1) — Teletraan I / Transformers Wiki (Fandom)](https://transformers.fandom.com/wiki/Ironhide_(G1))
- [Optimus Prime (G1)/toys — Transformers Wiki](https://tfwiki.net/wiki/Optimus_Prime_(G1)/toys)
- [g1 optimus prime, transformers animated colors — DeviantArt](https://www.deviantart.com/elracesta/art/g1-optimus-prime-transformers-animated-colors-901444044)
- [Megatron (G1)/toys — Transformers Wiki](https://tfwiki.net/wiki/Megatron_(G1)/toys)
- [Megatron (G1) — Teletraan I / Transformers Wiki (Fandom)](https://transformers.fandom.com/wiki/Megatron_(G1))
- [Bumblebee (G1)/toys — Transformers Wiki](https://tfwiki.net/wiki/Bumblebee_(G1)/toys)
- [Bumblebee (G1) — Teletraan I / Transformers Wiki (Fandom)](https://transformers.fandom.com/wiki/Bumblebee_(G1))
- [Ratchet (G1) — Transformers Wiki](https://tfwiki.net/wiki/Ratchet_(G1))
- [Ratchet: The Autobot Medic of Transformers G1 — g1guide.com](https://g1guide.com/g1-characters/autobots/ratchet-the-autobot-medic-of-transformers-g1/)
- [Starscream (G1)/toys — Transformers Wiki](https://tfwiki.net/wiki/Starscream_(G1)/toys)
- [Decepticon Jets Starscream — Transformerland.com Collector's Guide](https://www.transformerland.com/wiki/toy-info/transformers-g1-decepticon-jets-starscream/375/)
- [Alpha Trion/toys — Transformers Wiki](https://tfwiki.net/wiki/Alpha_Trion/toys)
- [Alpha Trion (G1) — Teletraan I / Transformers Wiki (Fandom)](https://transformers.fandom.com/wiki/Alpha_Trion_(G1))
- In-repo precedent: `docs/avatars/base/robotic.md` (gap 5, shoulder/limb-band
  anchor already flagged there); `docs/avatars/base/scifi.md` (`space-marine`
  pauldron workaround, same anchor gap); `src/three-renderer.ts`
  (`AVATAR_SPECS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`, `_buildHumanoid`
  accessory switch) as the implementation target this doc specs for.
