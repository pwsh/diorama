# Avatar pack: Star Wars — Original Trilogy

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no textures, no names printed anywhere in-scene; character identity lives only
in this doc's Reference lines and the pack's display labels.

## Overview

- **Group**: heroes, allies, droids, and villains of the original Star Wars
  trilogy (*A New Hope* 1977, *The Empire Strikes Back* 1980, *Return of the
  Jedi* 1983).
- **Hierarchy path**: `sci-fi / star-wars / original-trilogy`
- **Member count**: 10
- **Rig**: humanoid only. All ten members build on the humanoid rig — even
  `r2d2`, which is a genuine best-effort approximation of a legless droid
  rather than a faithful fit (see Rig gaps). No quadrupeds in this pack.
- **No shared base spec.** Unlike a uniformed-cast pack (e.g. sibling
  `sci-fi/star-trek-tng.md`, which shares one `HumanoidFields` base across the
  whole bridge crew), this ensemble is deliberately heterogeneous — human,
  Wookiee, two droid body types, a Sith cyborg-in-armor, a member of Yoda's
  unnamed species, and two full-face-helmet soldier/hunter archetypes. There
  is no single starting spec that helps more than it fights.
- **Shared conventions across members** (the pack-wide binder is discipline,
  not a shared spec):
  - **Palette groups by allegiance, not just character**: Rebel/hero earth
    tones (Luke's tan, Leia's ivory, Han's cream+navy) vs. Imperial black/white
    uniformity (Vader's black, the stormtrooper's white) vs. practical
    outdoorsy/mercenary tones (Chewbacca's rust-brown fur, Boba Fett's green
    armor, Yoda's green skin + tan robe). No two members share a body color.
  - **Eye style reuse**: `'dots'` for every unhelmeted organic member (Luke,
    Leia, Han, Chewbacca, Yoda); `'visor'` for every full-face-helmet member
    (Vader, stormtrooper, Boba Fett) — see Rig gaps for the T-visor caveat;
    the two droids each get a bespoke **occlusion accessory** over the default
    `'dots'` (a technique already established in `base/scifi.md`'s
    eyepatch/gas-mask entries) rather than a new eye style, since a single
    round photoreceptor lens isn't a defined eye style.
  - **Robe-as-cone technique** (established for `wise_oracle` in the core
    rig) is reused for both Yoda's and R2-D2's lower-body coverage.
  - **Diagonal strap technique** (chest-anchor box, rotated) is reused for
    Chewbacca's bandolier and Boba Fett's ammo-pouch belt — this is the same
    approximation already flagged as a rig gap in the sibling
    `sci-fi/star-trek-tng.md` pack for Worf's baldric; not re-derived here,
    just reused and cited.

## Members

### 1. `luke-tan` — "Farmboy Jedi (tan tunic)"

**Reference**: Luke Skywalker across *A New Hope* — Tatooine moisture farmer
turned Rebel pilot: cream/tan tunic, tan trousers, tan suede boots, a brown
gunbelt. (He switches to black in *Empire*/*Jedi*; that later look is noted
here only as a costume-swap possibility, not modeled as a separate member.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 'tint'
body: 0xd9cba8       // cream/tan tunic
legColor: 0xc7b78e   // tan trousers
shoe: 0x8a6a42       // tan suede boots
eyes: 'dots'
emI: 0.15
hands: 'sphere'
limbR: 1.0
```

**Accessories**
- **crown** — sandy-blond boyish haircut: a low flattened sphere-cap, `0xc9a565`, hugging the top/back of the head, front rim above the brow.
- **hip** — dark brown gunbelt, thin wrapping box, `0x4a3524`, with a small holster cylinder on one side.
- **hand** — lightsaber prop: a short metal-grey cylinder hilt (`0xc7c9cc`) topped by a thin emissive blue blade cylinder (`0x3fa9f5`, `emissiveIntensity ≈ 0.6`).

**Silhouette check**: an almost monochrome cream/tan farmboy outfit would be
hard to place on its own, but the glowing blue lightsaber blade in-hand is
the unmistakable tell at any size — no other member carries an emissive
blade.

**Personality**: `bobMul: 1.05, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0` (young, eager stride)
**Bubbles**: `🌵🚀⚔️✨` (desert farm, X-wing, lightsaber, destiny)

---

### 2. `leia` — "Rebel Princess (white robe)"

**Reference**: Princess Leia Organa in *A New Hope* — a plain floor-length
ivory-white hooded gown with a silver-buckled belt, and her signature double
side hair buns. (Carrie Fisher.)

**Spec**
```
sk: 0.94
headR: 118
headShape: 'sphere'
skin: 'tint'
body: 0xf4f2ea       // ivory-white gown
legColor: 0xf4f2ea   // floor-length gown, no visible separate leg color
shoe: 0xf4f2ea       // hidden under the hem
eyes: 'dots'
emI: 0.18
hands: 'sphere'
limbR: 0.9
```

**Accessories**
- **head** — the two side hair buns: two small spheres, one per side of the head at ear height, dark brown `0x3a2a20`. *This is the single defining prop — see Silhouette check.*
- **crown** — a shallow hood/cowl drape behind and above the head, ivory `0xf4f2ea`, raised and tilted back (same hat-clearance rule as every other crown accessory in the rig) so it doesn't cover the eyes.
- **hip** — a thin silver belt band, `0xc9ccd1`, with a small square buckle detail.

**Silhouette check**: two brown sphere hair buns flanking the head, over a
plain floor-length ivory robe — recognizable even with every other detail
stripped away.

**Personality**: `bobMul: 0.85, swayMul: 0.75, cadenceMul: 0.95, ampMul: 0.8` (composed, regal bearing)
**Bubbles**: `📜🔫👑✨` (secret plans, blaster, princess, hope)

---

### 3. `han` — "Smuggler Captain (vest & blaster)"

**Reference**: Han Solo, captain of the Millennium Falcon — a cream
long-sleeve shirt under a black sleeveless vest, dark navy trousers with a
red side-stripe, knee-high black boots, and a low-slung blaster holster.
(Harrison Ford.)

**Spec**
```
sk: 1.02
headR: 126
headShape: 'sphere'
skin: 'tint'
body: 0xe6ddc6       // cream shirt (vest layers over it, see Accessories)
legColor: 0x1c2430   // navy trousers
shoe: 0x14120f       // black boots
eyes: 'dots'
emI: 0.2
hands: 'sphere'
limbR: 1.05
armL: 1.0
```

**Accessories**
- **chest** — black vest overlay: a broad flat box covering the torso front, `0x111113`, proud of the shirt body color (occlusion technique, same idiom as the eyepatch/vest tricks elsewhere in this doc set).
- **hip** — gunbelt + holstered blaster prop: a dark brown/black box + cylinder, `0x2a1e16`, blaster grip visible.

**Silhouette check**: cream shirt + black vest + a low-slung gunbelt holster
reads as casual smuggler-swagger, distinct from every other member's robes
or full armor.

**Personality**: `bobMul: 1.1, swayMul: 1.2, cadenceMul: 1.0, ampMul: 1.05` (cocky swagger)
**Bubbles**: `💰🚀😏🔫` (credits, the Falcon, smirk, blaster)

*Note: the canonical red trouser side-stripe can't be rendered — there is no
leg-mounted accessory anchor and `legColor` only recolors the whole leg
uniformly. See Rig gaps.*

---

### 4. `chewbacca` — "Wookiee Co-pilot"

**Reference**: Chewbacca, Han's 7'5" (2.3 m) Wookiee co-pilot — floor-to-head
reddish-brown/strawberry-blond fur, a leather bandolier of ammo pouches
slung diagonally across the chest, no other clothing. (Peter Mayhew.)

**Spec**
```
sk: 1.32             // ~2.3 m vs. the ~1.75 m adult baseline
headR: 150
headShape: 'sphere'
skin: 0x8a5a35        // fur, all-over
body: 0x8a5a35
legColor: 0x8a5a35
shoe: 0x6e4527        // slightly darker fur "feet"
eyes: 'dots'
emI: 0.05
hands: 'sphere'
limbR: 1.25           // bulky furred limbs
armL: 1.1
legL: 1.05
```

**Accessories**
- **head** — mane tufts: 4–5 small irregular spheres around the jaw/cheeks, `0x6e4527`, breaking the smooth head sphere into a furred silhouette.
- **crown** — matching fur crest, a low flattened sphere cap, `0x6e4527`.
- **chest** — bandolier: one wide diagonal box strap crossing the torso, dark leather `0x3a281c`, rotated ~0.5 rad, with 3–4 small cylinder pouch nubs strung along it. *Reuses the diagonal-strap approximation already flagged as a gap in `sci-fi/star-trek-tng.md` (Worf's baldric) — not a new gap, just a repeat use case.*

**Silhouette check**: the tallest, bulkiest, solid-fur-brown silhouette in
the pack, plus the diagonal bandolier — sheer scale alone separates
Chewbacca from every human-scale member before the strap even registers.

**Personality**: `bobMul: 0.95, swayMul: 1.1, cadenceMul: 0.85, ampMul: 1.15` (heavy, loping gait)
**Bubbles**: `🔧🏹😤🏆` (co-pilot/mechanic, hunting instinct, frustration growl, victory howl)

---

### 5. `c3po` — "Protocol Droid (gold)"

**Reference**: C-3PO, the fussy golden protocol droid — polished gold
plating over an otherwise humanoid frame, with one lower leg conspicuously
mismatched in unpolished silver throughout the original trilogy. (Anthony
Daniels.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
skin: 0xc9a227        // gold plating
body: 0xc9a227
legColor: 0xc9a227    // canonical silver right shin NOT representable — see Rig gaps
shoe: 0x8a6f1c
eyes: 'dots'           // occluded — see face accessory below
emI: 0.15
hands: 'box'           // jointed metal digits
limbR: 1.0
steel: true
```

**Accessories**
- **face** — two small emissive amber-yellow lens spheres (`0xf2c200`, `emissiveIntensity ≈ 0.5`) placed proud of the head surface directly over the default eye position — occludes the generic `'dots'` eyes with C-3PO's round photoreceptor lenses (same occlusion trick used for eyepatches/gas masks in `base/scifi.md`).
- **chest** — exposed wiring/plate detail: a small darker-gold inset box, `0x8a6f1c`, with a thin vertical seam.
- **back** — a thin dark cylinder running the torso height for a visible spinal-wiring strip, `0x33301c`.

**Silhouette check**: solid gold from head to toe — a color no other member
in the pack shares — reads as C-3PO instantly, even with zero panel-line
detail visible at 30px.

**Personality**: `bobMul: 0.9, swayMul: 0.6, cadenceMul: 0.8, ampMul: 0.7` (stiff, fussy, mechanical — the slowest cadence in the pack)
**Bubbles**: `😰📢🔢🌐` (anxious fretting, protocol announcements, calculating the odds, translation)

---

### 6. `r2d2` — "Astromech Droid (dome droid)"

**Reference**: R2-D2, the resourceful astromech droid — a white-and-blue
barrel-bodied unit standing on two (occasionally three) stubby retractable
legs, topped by a rotating domed "head" with a single round photoreceptor
eye. Canonically has **no arms or legs** in the humanoid sense.

**⚠️ Rig fit**: the current rig has no legless/rolling/hover droid body
type and no torso-shape field (only `headShape` exists — the torso is
always the fixed humanoid box). This entry is a **documented best-effort
approximation** on the humanoid rig, not a faithful build — see Rig gaps.

**Spec**
```
sk: 0.62              // squat, roughly waist-high to an adult
headR: 90              // small dome relative to the (approximated) body
headShape: 'sphere'
skin: 0xe6e3d8         // white body/dome base
body: 0x2a5fae         // blue accent panels dominate the visible "torso"
legColor: 0x8a8a86     // stub leg/tread color, greyed metal
shoe: 0x33342f         // flat tread "feet"
eyes: 'dots'           // occluded — see face accessory below
emI: 0.2
hands: 'box'           // small utility-arm nubs, mostly retracted
limbR: 0.55            // thin stub legs
armL: 0.4              // short retracted utility arms
legL: 0.45             // very short legs, mostly hidden under the shroud below
steel: true
```

**Accessories**
- **face** — a single round photoreceptor lens: a small dark-blue-black sphere (`0x141a22`) with a thin chrome ring, centered on the dome — occludes the default `'dots'` eyes.
- **chest** — a tall white cylinder "shroud" sized to wrap most of the visible torso from chest down past the hip anchor, approximating R2's barrel body over the humanoid rig's boxier default torso. **This is the load-bearing hack in this entry** — without it the short legs read as a small person, not a droid.
- **hip** — shroud continuation + a horizontal blue accent stripe band.
- **back** — radar-eye/holo-projector detail, a small raised box, `0x8a8a86`.
- No **crown** accessory — the dome IS the head; no hat/hair layer.

**Silhouette check**: short, squat, white-and-blue barrel shape with a small
domed head and one round eye. The shroud accessory does most of the work
of hiding this pack's one real rig mismatch; that mismatch is called out
explicitly in Rig gaps rather than quietly papered over.

**Personality**: `bobMul: 0.5, swayMul: 1.3, cadenceMul: 1.4, ampMul: 0.4` (quick, waddling, tiny-stepped — the closest a bipedal walk cycle gets to "rolling")
**Bubbles**: `🔧📡😤💡` (toolkit, comms/signal, indignant beeping, clever idea)

---

### 7. `vader` — "Dark Lord (black armor)"

**Reference**: Darth Vader — an imposing black-armored Sith Lord: a
full-face helmet with twin round eye lenses and a segmented breath mask, a
black chest-plate control box with colored status lights, and a
floor-length black cape. (David Prowse, voice James Earl Jones.)

**Spec**
```
sk: 1.1
headR: 132
headShape: 'sphere'    // entirely enclosed by the helmet accessory below
skin: 0x0d0d0f
body: 0x101012
legColor: 0x101012
shoe: 0x0a0a0b
eyes: 'visor'           // dark lens band under the helmet dome
emI: 0.1
hands: 'sphere'         // gloved
limbR: 1.05
armL: 1.0
steel: false            // matte/satin armor, not shiny/chrome
```

**Accessories**
- **crown** + **head** — full helmet dome: an enlarged sphere shell wrapping the entire head (same enclosing-helmet technique as `astronaut`'s bubble / `retro-spaceman`'s fishbowl in `base/scifi.md`), dark gunmetal-black `0x1c1c1f`, with a raised vertical "spine" ridge running crown-to-back.
- **face** — breath-mask grille: 2–3 thin horizontal dark bars over the mouth/chin, `0x26262a`.
- **chest** — chest control box: a small box with 3 tiny colored emissive lights (red/green/amber, low intensity) inset on dark grey `0x3a3a3e`.
- **back** — cape: a full-length flattened cone (or heavily scaled cylinder) from the shoulders to the ground, matte black `0x0a0a0b`, slightly flared at the hem.

**Silhouette check**: solid black head-to-toe with a floor-length cape and
the helmet's raised dome ridge — the single most recognizable outline in
the pack, readable in pure silhouette at any size.

**Personality**: `bobMul: 0.75, swayMul: 0.5, cadenceMul: 0.8, ampMul: 0.85` (slow, heavy, implacable march, minimal bounce)
**Bubbles**: `😤⚡🖤🌌` (mechanical breathing, dark-side power, the dark side, the Empire)

---

### 8. `yoda` — "Small Green Jedi Master"

**Reference**: Yoda, the diminutive ~900-year-old Jedi Master — bright
green skin, large pointed/drooping ears, a simple brown/tan hooded robe,
and a gimer-stick cane. (Performed by Frank Oz.) Canonically about 66 cm
(2'2") tall; modeled here at the rig's `sk: 0.45` floor for readability
against adult-scale figures rather than a literal height ratio.

**Spec**
```
sk: 0.45
headR: 118             // large head relative to the sk-scaled body
headShape: 'sphere'
skin: 0x6b8c3e          // bright green
body: 0x9c8058          // tan/brown robe
legColor: 0x8a6f4a
shoe: 0x6b8c3e          // bare green feet, no separate footwear
eyes: 'dots'
emI: 0.1
hands: 'sphere'
limbR: 0.85
armL: 0.85
legL: 0.85
```

**Accessories**
- **head** — two long drooping ears: elongated cones (or scaled boxes) on either side of the head, angled downward/outward, `0x5f7d38`, roughly half a `headR` in length.
- **hip** — robe skirt: a wide cone from the hip anchor down past the legs, `0x9c8058`, hiding the leg silhouette almost entirely (same robe-cone technique used for `wise_oracle` in the core rig).
- **crown** — a few sparse wispy white hair strands (thin short cylinders), `0xe8e4d8`.
- **hand** — gimer-stick cane: a thin gnarled cylinder, `0x7a5a34`, held low near the ground.

**Silhouette check**: a tiny bright-green, big-eared head atop a
floor-length tan robe cone, leaning on a cane — scale alone (smallest
member by far) plus the drooping-ear silhouette sells it instantly.

**Personality**: `bobMul: 0.7, swayMul: 0.9, cadenceMul: 0.75, ampMul: 0.8` (slow, hobbling, cane-assisted shuffle — same slow-cadence register as the core rig's `wise_oracle`)
**Bubbles**: `🌿🧘💚✨` (swamp/nature, meditation, the Force, wisdom)

---

### 9. `stormtrooper` — "Imperial Trooper (white armor)"

**Reference**: an Imperial stormtrooper — full white plastoid armor over a
black body-glove, an enclosed helmet with a black horizontal eye-lens/
vocoder grille, standard-issue blaster rifle. Deliberately anonymous —
identical, interchangeable troopers by design.

**Spec**
```
sk: 1.0
headR: 128
headShape: 'sphere'
skin: 0xf0efe8         // white armor covers the head entirely
body: 0xf0efe8         // white armor
legColor: 0xf0efe8
shoe: 0x1c1c1e          // black boots peek out below the armor
eyes: 'visor'           // black horizontal lens band; see Rig gaps
emI: 0.08
hands: 'box'            // white armored gauntlets
limbR: 1.1
steel: false            // matte/glossy plastoid, not metallic
```

**Accessories**
- **face** — vocoder grille: 2 small dark rectangular vents under the visor band, `0x1c1c1e`.
- **head** — two small dark helmet "ear" comm details on the sides, short dark cylinders, `0x1c1c1e`.
- **chest** — a small darker-grey inset chest-box panel, `0x9a9a94`.
- **hip** — utility belt: a couple of small box pouches plus a thermal-detonator-style cylinder, light-grey webbing `0xc7c7c0` with one dark accent box.
- **hand** — blaster rifle prop: a long thin box + cylinder, matte black `0x1c1c1e`.

**Silhouette check**: full-coverage white armor with a black horizontal eye
band is unmistakable and deliberately uniform — the design goal is that
every trooper is interchangeable, and this member should stay generic
rather than getting per-trooper variation.

**Personality**: `bobMul: 0.95, swayMul: 0.6, cadenceMul: 1.0, ampMul: 0.9` (drilled, uniform marching gait — minimal personality by design)
**Bubbles**: `🎯📡⚠️🤖` (targeting, comms chatter, alert, "these aren't the droids you're looking for")

---

### 10. `boba` — "Bounty Hunter (green armor)"

**Reference**: Boba Fett, the taciturn Mandalorian bounty hunter introduced
in *The Empire Strikes Back* — battle-worn green Mandalorian armor with red
and gold/yellow highlights, a T-visor helmet, a back-mounted jetpack, and a
pleated cloth kama (skirt-like armor flap) at the waist. (Jeremy Bulloch.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0x3f5a34          // green armor covers the head/helmet
body: 0x3f5a34          // green armor
legColor: 0x2f4327      // slightly darker green leg plating
shoe: 0x232a1e           // dark boots
eyes: 'visor'            // approximates the T-visor; see Rig gaps
emI: 0.1
hands: 'box'             // armored gauntlets
limbR: 1.1
steel: false             // battle-worn matte paint, not chrome
```

**Accessories**
- **crown** — helmet antenna: a single thin cylinder rising from one side of the dome, dark `0x1c1c1e` with a small red tip.
- **chest** — two small offset accent plates breaking up the green: one red (`0xa4271f`), one gold/yellow (`0xc9982f`).
- **hip** — kama (cloth armor skirt): a wide flattened cone/cylinder from the hip anchor down over the upper legs, weathered tan-brown `0x6b5c3f`, plus a row of small ammo/utility pouch boxes along the belt line (same row-of-pouches idea as Chewbacca's bandolier).
- **back** — jetpack: a box with two small side thruster cylinders, dull grey-green `0x4a5240`.
- **hand** — a small wrist-gauntlet gadget box, `0x232a1e`.

**Silhouette check**: green armor + the kama skirt flap at the waist + the
back-mounted jetpack together are what separate this bounty hunter from the
stormtrooper's smooth white armor at a glance.

**Personality**: `bobMul: 0.85, swayMul: 0.55, cadenceMul: 0.9, ampMul: 0.75` (still, watchful, minimal wasted motion — a hunter's patience)
**Bubbles**: `🎯💰🚀🔇` (bounty/targeting, credits, jetpack travel, famously few words)

## Rig gaps

1. **No per-limb color override and no leg-mounted accessory anchor at
   all.** `legColor` recolors both legs uniformly, and the accessory anchor
   list (`crown`/`head`/`face`/`chest`/`back`/`hip`/`hand`) has nothing that
   sits on a limb — this is a broader restatement of the "no per-limb
   override" gap already flagged in `base/scifi.md`'s `space-pirate` entry.
   It blocks two canonical details here: **C-3PO's mismatched silver right
   shin** (both legs stay gold in the spec above) and **Han Solo's red
   trouser side-stripe** (omitted). A `limbOverride` list (as proposed in
   `base/scifi.md`) would need to cover accent *decoration*, not just solid
   recolor, to fully close this.
2. **No legless/rolling/hover droid body type, and no torso-shape field.**
   `headShape` lets a member choose `'sphere'`/`'box'`, but the torso is
   always the fixed humanoid box — there's no equivalent `bodyShape` for a
   cylindrical barrel body. R2-D2 (member 6) is built as a squat,
   short-legged humanoid with a chest/hip cylinder "shroud" standing in for
   the true body, which is a workable but hand-tuned approximation, not a
   real fit. A first-class low-`sk` astromech/rolling-droid variant (or a
   generic `bodyShape?: 'box' | 'cylinder'` alongside `headShape`) would
   remove the shroud hack and generalize to future legless-droid packs.
   **Considered and rejected**: mapping R2-D2 onto the quadruped rig — that
   rig assumes a horizontal four-legged torso built for animals, and reads
   worse for a droid that stands upright on 2–3 legs with no spine to speak
   of.
3. **No diagonal chest→hip strap/sash accessory primitive.** Already
   flagged in the sibling `sci-fi/star-trek-tng.md` pack (Worf's baldric);
   reused rather than re-derived here for Chewbacca's bandolier and Boba
   Fett's ammo-pouch belt, both approximated today with a single rotated
   `chest`-anchor box.
4. **No narrow/T-shaped visor eye style.** The current `eyes: 'visor'`
   always renders as one full-width horizontal band. That's a fine stand-in
   for Vader's twin round lenses and the stormtrooper's horizontal eye
   slit, but it can't distinguish Boba Fett's iconic narrow **T-visor**
   (a vertical center bar crossing a horizontal band) from a plain
   trooper visor — both use the same `'visor'` value in this doc. A
   `'tvisor'` eye style (or a compound accessory: a thin vertical
   `face`-anchor bar layered over the visor) would close this.

## Sources

- [Luke Skywalker Costume (DIY) — Friday We're In Love](https://fridaywereinlove.com/luke-skywalker-costume/)
- [Luke Skywalker (Lars Homestead / Tatooine) — Rebel Legion](https://rebellegion.com/luke-skywalker-episode-iv-a-new-hope-lars-homestead-tatooine/)
- [One Iconic Look: Princess Leia's White Gown in A New Hope — Tom + Lorenzo](https://tomandlorenzo.com/2020/06/one-iconic-look-princess-leias-white-gown-in-star-wars-episode-iv-a-new-hope/)
- [Princess Leia's White Robes — Smithsonian "Rebel, Jedi, Princess, Queen" exhibition](https://www.powerofcostume.si.edu/LeiaWhiteRobes.html)
- [Costume & Characters Part II: Han Solo — Star Wars Anonymous](https://starwarsanon.wordpress.com/2015/07/09/costume-characters-part-ii-han-solo-not-as-much-of-an-essay/)
- [Dress Like Han Solo Costume — Costume Wall](https://costumewall.com/dress-like-han-solo/)
- [Chewbacca — Wikipedia](https://en.wikipedia.org/wiki/Chewbacca)
- [Chewbacca's bandolier — Wookieepedia](https://starwars.fandom.com/wiki/Chewbacca's_bandolier)
- [Chewbacca (Original Trilogy) — Rebel Legion](https://rebellegion.com/chewbacca-classic-trilogy)
- [C-3PO — Wookieepedia](https://starwars.fandom.com/wiki/C-3PO)
- [Star Wars: Why C-3PO Had A Silver Leg In The Original Trilogy — ScreenRant](https://screenrant.com/star-wars-c3po-silver-leg/)
- [Making R2-D2 Part 2 — I Like To Make Stuff](https://iliketomakestuff.com/making-r2-d2-part-2/)
- [The R2-D2 Detail Catalogue Part A: the Dome](https://sites.google.com/site/3dsfinfo/astro-droids/v-the-r2-d2-detail-catalogue/the-r2-d2-detail-catalogue-part-a-the-dome)
- [Darth Vader: ANH — 501st Costume Reference Library](https://crls.501st.com/sld/darth-vader-anh)
- [Darth Vader's armor — Wookieepedia](https://starwars.fandom.com/wiki/Darth_Vader's_armor/Legends)
- [Yoda's species — Wookieepedia](https://starwars.fandom.com/wiki/Yoda's_species)
- [Star Wars: 20 Crazy Details About Yoda's Anatomy — ScreenRant](https://screenrant.com/star-wars-yoda-anatomy-abilities-hidden-trivia/)
- [Stormtrooper armor — Wookieepedia](https://starwars.fandom.com/wiki/Stormtrooper_armor)
- [Star Wars: Stormtrooper Armor, Explained — Game Rant](https://gamerant.com/star-wars-stormtrooper-armor-explained/)
- [Boba Fett's armor — Wookieepedia](https://starwars.fandom.com/wiki/Boba_Fett's_armor)
- [Star Wars: The Meaning Of Boba Fett's Armor Colors — Looper](https://www.looper.com/1270880/star-wars-meaning-boba-fetts-armor-colors-point/)
- [Boba Fett (Empire Strikes Back) — Mando Mercs Costume Club](https://mandalorianmercs.org/boba-fett-empire-strikes-back/)
- In-repo: `src/three-renderer.ts` (`SPECS` table, `AVATAR_PERSONALITY`,
  `AVATAR_BUBBLES`, `_addAvatarAccessories` accessory switch —
  `astronaut`/`wise_oracle`/`robot` cases used as technique precedent for
  the enclosing-helmet, robe-cone, and steel/hands='box' droid conventions
  reused above); sibling docs `docs/avatars/base/scifi.md` and
  `docs/avatars/sci-fi/star-trek-tng.md` for the occlusion-eye and
  diagonal-strap gaps cited rather than re-derived.
