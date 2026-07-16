# Avatar pack: Halo

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no textures, no names printed anywhere in-scene; character identity lives
only in this doc's Reference lines and the pack's display labels.

## Overview

- **Group**: The primary cast of Bungie/343 Industries' *Halo* — the
  military sci-fi shooter franchise (2001– ). Colors/props are researched
  per-character but rendered as flat toon color-blocking, never printed
  insignia or logos.
- **Hierarchy path**: `sci-fi / halo`
- **Member count**: 7
- **Rig**: humanoid only. All seven members — including the AI companion,
  rendered as a hovering hologram rather than a walking figure — build on
  the standard humanoid rig (`sk`/`headR`/`headShape`/`limbR`/`skin`/`body`/
  `shoe`/`emI`/`hands`/`eyes`/`steel`/`armL`/`legL`/`footMul`/`legColor`).
  No quadrupeds — Halo's primary cast has no primary-cast creature analog
  (the Flood is a body-horror infection swarm, not a "member" a casual fan
  would pick as a stranger/avatar, and was omitted for that reason as much
  as for rig fit).
- **Member-selection notes**: the survey's seven (Master Chief, Cortana,
  Arbiter, Sergeant Johnson, Grunt, Brute, ODST Trooper) hold up as the
  primary-cast set and are used as-is — between them they cover the
  franchise's most casually-recognized roles: the armored protagonist, his
  AI companion, the reformed-alien-ally leader, the fan-favorite human NCO,
  and the games' two most iconic enemy archetypes (small cannon-fodder /
  hulking brute) plus the sibling elite-human-trooper class. Omitted:
  named secondary humans (Miranda Keyes, Captain Keyes, ODST squadmates
  like Buck/Rookie — recognizable to series players but not "primary cast"
  the way Johnson is), the Prophets and 343 Guilty Spark (memorable but
  more setting/lore figures than an avatar a casual fan reaches for first),
  and the Flood (rig-inappropriate body-horror swarm, not a person).
- **Shared technique — tint-rule accent light**: Halo's UNSC/Covenant gear
  is full of small indicator lights, gauges, and beacons (armor status
  lights, tank gauges, drop-beacons, rank gems) — every member below gets
  exactly one small accessory in `color: 'accent'` riding one of these
  in-universe lights, satisfying the tint rule without fighting any
  member's costume-critical base color.
- **Shared technique — pauldron approximation**: as in every other armored
  pack shipped so far, this rig has no dedicated shoulder anchor, so the
  three heavily-armored members (Master Chief, the Elite Commander's
  harness, the Brute) approximate shoulder bulk with `chest`-anchored boxes
  offset outward and raised — see Rig gaps.
- **Visor-glow caveat**: `eyes: 'visor'` and `eyes: 'redvisor'` render at
  fixed engine colors (cyan-blue and red respectively — see
  `three-renderer.ts`, `_buildHumanoid`'s eye switch), not a per-member
  override. This happens to land close to canon for the ODST (whose visor
  really is blue-silver) but is a genuine approximation for Master Chief
  (whose canon visor is gold) — see Rig gaps.

## Members

### 1. `halo/spartan-supersoldier` — "Supersoldier (bulky green armor, gold-visored helmet)"

**Reference**: The Master Chief (Spartan-117) — humanity's flagship
super-soldier, sealed head-to-toe in olive-drab MJOLNIR powered armor with
a smooth, full-face, gold-polarized visor; broad armored pauldrons, no
visible face or hair in any appearance. The franchise's protagonist and
single most recognizable Halo silhouette.

**Spec**
```
sk: 1.15
headR: 128
headShape: 'sphere'
skin: 0x597859        // olive-drab Mjolnir plating reads as "skin" — full helmet, no face
body: 0x597859
legColor: 0x46614a     // slightly darker/cooler green leg plating
shoe: 0x2e3f30         // dark boot housings
eyes: 'visor'          // enclosed HUD visor; rig renders fixed cyan-blue, not canon gold — see Rig gaps
emI: 0.1
steel: true
hands: 'box'           // armored gauntlets
limbR: 1.25
armL: 1.05
legL: 1.0
footMul: [1.1, 1.05, 1.1]
```

**Accessories**
- **crown** — small antenna/comms nub, thin cylinder ~14×50×14 mm,
  `0x33363c`, offset to one side toward the rear of the helmet dome.
- **chest** (×2, pauldron approximation) — boxes ~150×100×130 mm,
  `0x46614a` (darker green), raised and offset outward per the pack-wide
  pauldron note — the broadest shoulder line in the pack.
- **back** — backpack/power-cell unit, box ~130×160×90 mm, `0x3f5940`.
- **hip** — ammo/utility pouch cluster, small boxes, `0x2e3f30`.
- **chest** — status-light strip, thin box ~40×20×8 mm, `color: 'accent'`,
  emissive ~0.4 — armor status indicator (tint-rule accent).

**Silhouette check**: an all-green, heavily pauldroned, fully-enclosed
helmeted humanoid — the bulkiest human-scale silhouette in the pack, and
the only one in green — reads instantly even next to the similarly-armored
but leaner, all-black ODST.

**Personality**: `bobMul: 0.8, swayMul: 0.5, cadenceMul: 0.9, ampMul: 1.05`
(a heavy, powered-armor stride — deliberate and economical, not showy)
**Bubbles**: `🎯🛡️⭐💪` (combat focus, protector, hero, super-soldier strength)

---

### 2. `halo/ai-companion` — "AI companion (translucent blue hologram)"

**Reference**: Cortana — a "smart" AI construct who projects a slender,
holographic human woman: close-cropped hair, bare feet, a body that reads
as a circuitry-laced second skin, glowing and flashing with light whenever
she speaks or moves; described across the games as shifting between navy
blue and lavender. The Chief's constant AI companion and the franchise's
most recognized non-human-soldier character.

**Spec**
```
sk: 0.9
headR: 112
headShape: 'sphere'
skin: 'tint'           // hologram color IS the bound sensor/person tint — see Overview
body: 'tint'
legColor: 'tint'
shoe: 'tint'
eyes: 'almond'         // rendered as a woman's face, not a masked/mechanical visor
emI: 0.35
opacity: 0.55          // translucent projected body (precedent: base-aliens.ts grey alien)
hover: 260             // floats, no footfall — a projection has no solid feet; see Rig gaps
hands: 'sphere'
limbR: 0.75
armL: 0.95
legL: 0.95
```

**Accessories**
- **crown** — close-cropped hair cap, shallow dome ~110×40×110 mm,
  `color: 'tint'`, very slightly emissive — the short hairstyle.
- **chest** — circuit-light accent band, thin horizontal box ~90×10×10 mm,
  `color: 'accent'`, emissive ~0.5 — the flashing circuitry-under-skin
  detail, doubling as the tint-rule accent.
- **head** — a small drifting light-mote sphere ~20 mm, `color: 'accent'`,
  emissive, offset just above one shoulder — a stray data-particle flourish
  nodding to her digital nature (optional; omit for a plainer hologram).

**Silhouette check**: the only translucent, glowing, hovering (no visible
footfall) member in the entire pack — reads as "not a physical body" even
reduced to a soft blue smear at 30 px, the polar opposite of every armored
figure around her.

**Personality**: `bobMul: 0.3, swayMul: 0.4, cadenceMul: 1.0, ampMul: 0.5`
(drifts more than walks — minimal footfall-driven bob since she hovers)
**Bubbles**: `💾📡🧠💡` (data/AI nature, comms, intelligence, ideas/insight)

---

### 3. `halo/elite-commander` — "Elite commander (alien warrior, bronze harness, mandibles)"

**Reference**: The Arbiter (Thel 'Vadam) — a senior Sangheili ("Elite")
warrior: tall, digitigrade, scaly-hided alien with a four-part mandibled
jaw and narrow reptilian eyes, wearing an ornate bronze/copper combat
harness marking his rank. A reformed enemy commander who becomes a
playable co-protagonist and one of the series' most recognized aliens.

**Spec**
```
sk: 1.1
headR: 118
headShape: 'oval'
skin: 0x3d4a42        // dark scaly grey-green Sangheili hide
body: 0xa8763f        // bronze/copper combat harness
legColor: 0x7a5730    // darker bronze leg plating
shoe: 0x3d4a42        // bare clawed feet, matches hide tone
eyes: 'slit'          // narrow reptilian eyes
emI: 0.12
steel: true
hands: 'box'
limbR: 1.0
armL: 1.05
legL: 1.1             // longer legs lean toward the canon digitigrade stance — approximation, see Rig gaps
```

**Accessories**
- **face** (×2, mandibles) — thin boxes flanking the lower jaw,
  ~20×60×15 mm each, `0x3d4a42`, angled slightly outward — the signature
  four-part jaw silhouette.
- **crown** — helmet crest/head ridge, low tapered box ~100×30×40 mm,
  `0xa8763f`, running the dome's centerline.
- **chest** — harness centerpiece, box ~50×50×15 mm, `0x7a5730`, with a
  small rank-gem sphere ~18 mm, `color: 'accent'`, emissive — tint-rule
  accent doubling as a rank marker.
- **back** — ornate cloth sash, wide flattened cone ~140×260 mm, deep
  maroon `0x5a2020`, hanging from one shoulder.
- **hand** — a short glowing hilt prop, thin cylinder ~16×70×16 mm,
  `0x161616` with a `color: 'accent'` emissive blade sliver — his signature
  energy weapon at rest; omit for a neutral idle/empty-hand pose.

**Silhouette check**: the bronze/copper harness plus the mandibled jaw is
the tell — no other member in the pack has visible mandibles or that warm
copper tone, distinguishing him instantly from the human Spartan/ODST's
smooth full helmets.

**Personality**: `bobMul: 0.75, swayMul: 0.65, cadenceMul: 0.95, ampMul: 0.95`
(a predatory, purposeful alien stride with a slight forward lean)
**Bubbles**: `⚔️🛡️🐍👑` (blade/honor combat, protection, reptilian/alien
nature, commander status)

---

### 4. `halo/marine-sergeant` — "Marine sergeant (digital-camo BDU, cigar, sunglasses)"

**Reference**: Sergeant Major Avery Johnson — a gruff, wisecracking,
cigar-chomping UNSC Marine Corps NCO: olive/tan digital-camouflage battle
dress, bald head, thin mustache, dark aviator sunglasses, rarely without a
Sweet William cigar clenched in his teeth. A recurring, fan-favorite human
ally across the original trilogy.

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
skin: 0x6b4b35        // medium-dark skin tone, bald head/face visible
body: 0x6b6a4a        // olive/tan digital-camo BDU jacket
legColor: 0x5a5940    // matching camo trousers
shoe: 0x2a2622        // black combat boots
eyes: 'shades'        // dark aviator sunglasses
emI: 0
hands: 'sphere'
limbR: 1.0
armL: 1.0
legL: 1.0
```

**Accessories**
- **face** — cigar stub, thin cylinder ~6×40×6 mm, dark brown `0x2e1c12`,
  protruding from the corner of the mouth — his signature prop.
- **chest** — rank insignia patch, small box ~30×20×4 mm, `0x8a7a2a`
  (gold-ish) — senior-NCO rank marking, no printed text.
- **chest** — dog tags, two tiny flattened discs ~14 mm, `color: 'accent'`
  — tint-rule accent worn on the chest.
- **hip** — sidearm holster, small box ~40×70×25 mm, `0x2a2622`.
- **back** — webbing/pack straps, thin crossed boxes over the shoulders,
  `0x4a4930`.

**Silhouette check**: the only bare-headed, cigar-in-mouth human in the
pack, dressed in earthy olive-tan camo rather than sleek powered armor —
reads instantly as "grizzled marine," distinct from both the Spartan and
ODST's enclosed-helmet silhouettes.

**Personality**: `bobMul: 1.0, swayMul: 1.1, cadenceMul: 0.95, ampMul: 1.0`
(a confident, unhurried NCO swagger)
**Bubbles**: `🚬🎖️💪😤` (cigar, decorated veteran, tough resolve, gruff bark)

---

### 5. `halo/grunt-trooper` — "Grunt trooper (small hunched alien, methane mask)"

**Reference**: An Unggoy "Grunt" — a short, hunched, potbellied Covenant
infantry species entirely dependent on a back-mounted methane tank and
breather mask for survival; armor color marks rank, with orange denoting
the common Grunt Minor seen throughout the series. The franchise's
signature comic-relief cannon-fodder enemy, instantly recognizable even to
non-players.

**Spec**
```
sk: 0.55
headR: 100            // oversized relative to sk — matches the rig's Sims norm and the species' big-headed profile
headShape: 'sphere'
skin: 0x8a7a56        // tan-brown hide visible at the jaw/hands
body: 0xd97b2e        // orange combat harness (Minor rank)
legColor: 0xb85f22    // darker orange leg wrap
shoe: 0x5a4a32        // small clawed feet
eyes: 'dots'          // oversized dark eyes — the one visible feature above the mask
emI: 0.05
hands: 'sphere'
limbR: 0.85
armL: 0.75
legL: 0.55            // short bandy legs
footMul: [0.85, 0.7, 0.8]
```

`posture: { pitch: 0.35 }` — a hunched-forward stance, distinct from every
upright human/Elite member.

**Accessories**
- **face** — breather-mask muzzle, box ~70×45×30 mm, `0x33362e` (dark
  grey-green), covering the lower half of the face — the defining methane
  mask.
- **back** — methane tank, cylinder ~50 mm dia × 130 mm, `0x6a6a52`, with a
  small gauge-light sphere, `color: 'accent'`, emissive — tint-rule accent
  doubling as an in-universe tank gauge.
- **head** (×2) — small backswept cranial bumps, short cones ~14×30×14 mm,
  `0x8a7a56` (skin-matched) — subtle head-ridge detail.
- **hip** — plasma-pistol holster, small box, `0x33362e`.

**Silhouette check**: the shortest, most hunched, potbellied member in the
pack, topped by an oversized head and a bulky back-mounted tank —
unmistakable as "small alien grunt" even in outline, the polar opposite of
every tall armored human/Elite around it.

**Personality**: `bobMul: 1.4, swayMul: 1.3, cadenceMul: 1.2, ampMul: 0.7`
(a nervous, waddling scurry — short, quick, unsteady steps)
**Bubbles**: `😱🍖💥🏃` (panic, hungry for rations, explosive temperament,
fleeing)

---

### 6. `halo/brute-warrior` — "Brute warrior (hulking furred alien, blue-grey armor)"

**Reference**: A Jiralhanae "Brute" — massive, gorilla-like Covenant
shock-troops introduced as the Covenant's brutal enforcers: thickly furred
(brown, greying toward silver with age/honor), wearing bulky blue-grey
combat armor with spiked pauldrons. The series' iconic hulking-enemy
archetype, physically dominant and openly savage compared to the more
disciplined Elites.

**Spec**
```
sk: 1.3
headR: 138
headShape: 'sphere'
skin: 0x5c4632        // brown fur visible at the head/shoulders
body: 0x3a4a5c        // blue-grey combat armor
legColor: 0x2e3a48    // darker blue-grey leg plating
shoe: 0x22282f
eyes: 'dots'          // small, deep-set eyes under a heavy brow
emI: 0.08
steel: true
hands: 'box'
limbR: 1.45           // the thickest limbs in the pack — raw bulk
armL: 1.1
legL: 0.95
```

**Accessories**
- **face** — heavy brow ridge, thin box ~90×20×15 mm, `0x4a3826` — the
  ape-like heavy brow.
- **head** — fur mane collar, wide flattened ring ~160×60×160 mm,
  `0x5c4632` — the shaggy ruff where fur meets armor at the neck.
- **chest** (×2, oversized pauldron approximation) — boxes ~180×120×150 mm,
  `0x2e3a48`, each with a small spike-cone detail ~20×40×20 mm, `0x1c2228`
  — the broadest, spikiest shoulder silhouette in the pack.
- **back** — fur cape/mantle, wide flattened cone ~200×260 mm, `0x5c4632`
  — a chieftain-style honor-cloak look.
- **chest** — small trophy bead/tooth, `color: 'accent'`, ~20 mm — tint-rule
  accent.

**Silhouette check**: the single largest, bulkiest silhouette in the pack —
furred shoulders erupting into oversized spiked blue-grey pauldrons —
dwarfs the Spartan and Elite alike; the unmistakable "big scary enemy"
read.

**Personality**: `bobMul: 0.6, swayMul: 0.9, cadenceMul: 0.7, ampMul: 1.3`
(a heavy, aggressive stomping gait with pronounced shoulder sway)
**Bubbles**: `💢🦍🔨😡` (rage, brute strength, hammer/melee weapon,
aggression)

---

### 7. `halo/odst-trooper` — "Drop trooper (black armor, blue-silver visor)"

**Reference**: An ODST (Orbital Drop Shock Trooper) — elite UNSC special-
forces infantry who drop from orbit in single-occupant pods; sleek black
semi-powered battle armor with a rounded, enclosed helmet and a
polarizing blue-silver visor. Leaner and more human-scaled than a
Spartan's bulky MJOLNIR suit — the games' iconic "elite human trooper"
class, distinct from the super-soldier programme.

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
skin: 0x1e1e22        // matte black armor plating reads as "skin" — full helmet, no face
body: 0x232327
legColor: 0x1a1a1d
shoe: 0x141416
eyes: 'visor'         // fixed cyan-blue rig visor — already a close match to canon's polarized blue-silver ODST visor, no override needed
emI: 0.1
steel: true
hands: 'box'
limbR: 1.0
armL: 1.0
legL: 1.0
```

**Accessories**
- **crown** — small rangefinder/comm antenna, cylinder ~12×40×12 mm,
  `0x4a4a50`, offset to one side (shared trooper-helmet convention with the
  Spartan's antenna, smaller and centered differently so the two don't
  read identically).
- **chest** — locator-beacon light, small box ~24×24×10 mm, `color:
  'accent'`, emissive ~0.4 — the drop-pod locator beacon, doubling as the
  tint-rule accent.
- **back** — parachute-harness/pack straps, thin crossed boxes, `0x3a3a3e`.
- **hip** — sidearm + ammo-pouch cluster, small boxes, `0x1a1a1d`.

**Silhouette check**: sleek, uniformly matte-black plating with a smooth
rounded visor and NO shoulder pauldrons — the leanest, least-adorned
armored-human silhouette in the pack, reading as "commando" next to the
Spartan's bulkier hero-armor.

**Personality**: `bobMul: 0.85, swayMul: 0.55, cadenceMul: 1.0, ampMul: 0.95`
(a disciplined special-forces march — tighter and leaner than the
Spartan's heavier stride)
**Bubbles**: `🪂🔫🌃🎯` (orbital drop, firearm, urban night ops, precision)

## Rig gaps

1. **No per-member visor/eye-glow color override.** `eyes: 'visor'` and
   `eyes: 'redvisor'` render at fixed engine colors (cyan-blue and red —
   `three-renderer.ts`, `_buildHumanoid`'s eye switch) with no exposed hex
   parameter. This happens to land close to canon for the ODST (genuinely
   blue-silver) but is a real approximation for Master Chief, whose signature
   visor is gold, not blue. Already parked generically as "eye color
   overrides" in `docs/ROADMAP.md` § Avatar rig gaps and flagged concretely
   in `docs/avatars/sci-fi/star-wars-mandalorian.md` (the remnant trooper's
   black-vs-red `redvisor` note) — this pack adds a third distinct
   franchise-color need (gold) to that same parked item.
2. **No dedicated shoulder/pauldron anchor.** Three of this pack's seven
   members (Master Chief, the Elite Commander's harness, the Brute) wear
   armor with a visually distinct shoulder plate, approximated here — as in
   every prior armored pack — with `chest`-anchored boxes offset outward
   and raised. This is now the **fourth-plus** pack hitting this exact gap
   (after `docs/avatars/base/scifi.md`'s space-marine,
   `docs/avatars/sci-fi/star-wars-mandalorian.md`, and
   `docs/avatars/sci-fi/transformers.md`), which should keep raising its
   priority for a real `shoulder` anchor.
3. **No reverse-knee/digitigrade leg option.** The Elite Commander's
   Sangheili legs are canonically digitigrade (backward-bending "shin",
   two-toed clawed feet) — this pack approximates the stance with a longer
   `legL` and no true reverse-knee joint, the same workaround already
   flagged for IG-11 in `docs/avatars/sci-fi/star-wars-mandalorian.md` and
   used for a raptor-legged member in `docs/avatars/video-games/metroid.md`
   (`legL: 1.15`). Reads fine standing/walking but is a stretch of the
   humanoid rig's straight-legged default, not a true fix.

None of these gaps blocked building this pack; all seven members are fully
expressible with the current rig via the workarounds above.

## Sources

- [Master Chief Color Palette — color-hex.com](https://www.color-hex.com/color-palette/1006335)
- [What exact color is Master Chief's armor? — Vintage Is The New Old](https://www.vintageisthenewold.com/faq/what-exact-color-is-master-chiefs-armor)
- [Master chief color chart — 405th Halo Costume and Prop Maker Community](https://www.405th.com/forums/threads/master-chief-color-chart.8323/)
- [Master Chief: Why green armor and a gold visor? — Bungie.net forums](https://www.bungie.net/en/Forums/Post/1217299)
- [Cortana (Halo) — Wikipedia](https://en.wikipedia.org/wiki/Cortana_(Halo))
- [Cortana — Halo Alpha (Fandom)](https://halo.fandom.com/wiki/Cortana)
- [AI Evolved: Every Version Of Cortana In Halo — GameRant](https://gamerant.com/halo-every-version-cortana-ai/)
- [Arbiter body armor — Halopedia](https://www.halopedia.org/Arbiter_body_armor)
- [Arbiter — Halopedia](https://www.halopedia.org/Arbiter)
- [Arbiter — Halo Alpha (Fandom)](https://halo.fandom.com/wiki/Arbiter)
- [Unggoy combat harness — Halopedia](https://www.halopedia.org/Unggoy_combat_harness)
- [Unggoy — Halo Alpha (Fandom)](https://halo.fandom.com/wiki/Unggoy)
- [Unggoy Ultra — Halopedia](https://www.halopedia.org/Unggoy_Ultra)
- [Jiralhanae — Halo Alpha (Fandom)](https://halo.fandom.com/wiki/Jiralhanae)
- [Jiralhanae — Halopedia](https://www.halopedia.org/Jiralhanae)
- [Jiralhanae Power Armor — Halo Alpha (Fandom)](https://halo.fandom.com/wiki/Jiralhanae_Power_Armor)
- [Avery Johnson — Halopedia](https://www.halopedia.org/Avery_Johnson)
- [Avery Johnson — Halo Alpha (Fandom)](https://halo.fandom.com/wiki/Avery_Johnson)
- [Sweet William Cigars — Halo Alpha (Fandom)](https://halo.fandom.com/wiki/Sweet_William_Cigars)
- [ODST battle armor — Halo Alpha (Fandom)](https://halo.fandom.com/wiki/ODST_battle_armor)
- [ODST battle dress uniform — Halopedia](https://www.halopedia.org/ODST_armor)
- [ODST armor (MJOLNIR) — Halopedia](https://www.halopedia.org/ODST_armor_(MJOLNIR))
- In-repo precedent: `docs/avatars/base/scifi.md` (space-marine pauldron
  workaround, occlusion-accessory technique), `docs/avatars/base/aliens.md`
  (translucent-hologram `opacity`+`hover` precedent),
  `docs/avatars/sci-fi/star-wars-mandalorian.md` (pauldron + redvisor-color
  gaps, digitigrade IG-11 note), `docs/avatars/sci-fi/transformers.md`
  (shoulder-anchor gap reinforcement), `docs/avatars/video-games/metroid.md`
  (digitigrade `legL` approximation, hologram `hover` precedent),
  `src/three-renderer.ts` (`AVATAR_SPECS`, `AVATAR_PERSONALITY`,
  `AVATAR_BUBBLES`, `_buildHumanoid` eye/accessory switches) as the
  implementation target this doc specs for.
