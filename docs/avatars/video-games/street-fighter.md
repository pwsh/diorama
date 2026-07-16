# Avatar pack: Street Fighter

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the fighter archetype, not a likeness. No logos,
no printed letters/initials, no on-model face sculpts, no names printed
anywhere in-scene; character identity lives only in this doc's Reference
lines and the pack's display labels.

## Overview

- **Group**: Capcom's *Street Fighter* "World Warriors" — the original
  Street Fighter II roster that defined the genre — plus the series'
  signature antagonist. Two rival karate stylists, a Chinese Interpol
  officer, an American soldier, a Brazilian jungle beast-man, a Russian
  wrestler, an Indian yogi, and the dictator who's hunted them all.
- **Hierarchy path**: `video-games / street-fighter`
- **Member count**: 8
- **Rig**: humanoid only — every member is a normal (if extreme) human
  build; no quadrupeds/pets in this cast.
- **Shared base spec** (all members start here, then override):
  ```
  sk: 1.0
  headR: 126
  headShape: 'sphere'
  limbR: 1.0
  hands: 'sphere'
  eyes: 'dots'
  steel: false
  emI: 0
  armL: 1.0
  legL: 1.0
  footMul: [1.0, 1.0, 1.0]
  ```
- **Shared palette — the pack's recurring hues** (each member still owns a
  distinct primary silhouette color; these repeat only as trims/accents or
  deliberate family pairings):
  - Fireball red — `0xc41e2a` (Ken's gi, Zangief's trunks, Ryu's headband
    and belt trim — the pack's "hot" red, reused across three very
    different silhouettes without collision because build/proportion
    carries the differentiation)
  - Gi white — `0xf5f2ea` (Ryu's gi, Chun-Li's boots, bone-white trims)
  - Karate black — `0x1a1410` (belts, hair — Ryu/Ken's shared dark trim)
  - Interpol blue — `0x1e56cc` (Chun-Li's qipao — this pack's only blue,
    kept exclusive to her)
  - Regal gold — `0xd9b34a` (belt buckles, dog tags, wristbands, Bison's
    cap trim — accessory accent only, never a whole-body fill)
  - Army olive — `0x5a6b45` (Guile's camo pants)
  - Jungle green — `0x5cb82e` (Blanka's skin — the pack's only green,
    kept well apart in lightness from Guile's darker tank-top green so
    the two never read as the same hue at a glance)
  - Mane orange — `0xe8720a` (Blanka's hair)
  - Saffron yellow — `0xe0b93a` (Dhalsim's wraps)
  - Shadaloo red — `0x8c1414` (Bison's uniform — deliberately darker/
    duller than the fireball red family so the villain reads as a distinct,
    heavier color, not just "another red gi")
  - Gunmetal silver — `0xc0c0c8` (Bison's epaulettes, Zangief's/Guile's
    metal accents)
- **Pack-wide convention — the shoto pairing**: Ryu and Ken share almost
  identical build/proportions (same base gi cut, same stance) and differ
  almost entirely by color + hair + headband, the same way Mario/Luigi
  share blue overalls in `docs/avatars/video-games/mario.md`. Here the
  shared element is the gi *silhouette itself* (torso + leg same color,
  bare feet, black belt); what differs is gi color (white vs red), hair
  color/style (black spikes vs blonde spikes), and the headband (Ryu wears
  one, Ken does not) — reusing the "family resemblance through shared cut,
  distinct through color/hair" idiom.
- **Pack-wide caveat — no glove-color override**: like the Mario pack,
  `hands` is a shape enum only (`'sphere'|'box'`) with no distinct glove/
  wrap color field. This pack works around it the same way League of
  Legends' Vi does — small `handL`/`handR` band accessories approximate
  Ryu/Ken's red fist wraps, Guile's fingerless gloves, Zangief's and
  Dhalsim's wristbands — rather than fighting for a whole-hand recolor.
  See Rig gaps in `docs/avatars/video-games/mario.md` #1 for the underlying
  gap; not re-filed here.
- **Member-selection notes**: the survey list (Ryu, Ken, Chun-Li, Guile,
  Blanka, Zangief, Dhalsim, M. Bison) was verified and kept as-is. This is
  the original Street Fighter II "World Warriors" cast of eight playable
  fighters **minus E. Honda, plus the series' central antagonist M.
  Bison**. That swap was deliberate, not an oversight: Ryu, Chun-Li, and
  Ken are consistently the top three most-recognized characters in the
  franchise by fan polling, and M. Bison is repeatedly cited as one of the
  most iconic villains in video-game history (box art, the 1994 live-action
  film, cartoons) — casual, non-fighting-game-fan recognition of Bison
  clearly outweighs E. Honda's, and a hero-cast-plus-one-villain shape
  mirrors the Mario pack's own Bowser precedent. Every remaining World
  Warrior earns their seat on pure archetype spread — karate stylist ×2
  (rivals), martial-arts kicker, soldier, beast-man, wrestler, yogi — so no
  two members lean on the same silhouette trick. Omitted: E. Honda (sumo,
  lower casual recognition than Bison), the three other CPU boss characters
  Balrog/Vega/Sagat (secondary to Bison as the arc villain), and the much
  larger Street Fighter Alpha/III/IV/6 supporting rosters (Sakura, Cammy,
  Akuma, Fei Long, Cody, Juri, Luke, etc.) — all strong characters, but
  outside the primary-cast ceiling for a first pack; a follow-up
  "Street Fighter II" era pack could split them out per this doc's own
  precedent for sub-series splits if the roster ever needs to grow.

## Members

### 1. `shoto-white` — "Karate Fighter (white gi, red headband)"

**Reference**: The series' protagonist — a traveling martial artist
seeking to master the "true essence" of fighting. A tattered white karate
gi with the sleeves torn off, a long red headband, a black belt, brown/
tan skin, short black hair, and bare feet. Compact and powerfully built
rather than tall. (Ryu.)

**Spec**
```
sk: 1.05
headR: 126
headShape: 'sphere'
limbR: 1.05
skin: 0xe8b48c
body: 0xf5f2ea        // white gi torso
legColor: 0xf5f2ea    // white gi pants
shoe: 0xe8b48c         // bare feet — skin tone, no footwear
eyes: 'dots'
emI: 0
hands: 'sphere'        // red fist wraps approximated via handL/handR below
steel: false
armL: 1.0
legL: 0.95
footMul: [1.0, 0.9, 1.0]
```

**Accessories**
- **head** — the red hachimaki headband: a thin flat band wrapped across
  the forehead, ~130×30×8mm, `0xc41e2a`, sitting LOW at brow height (a
  band, not a domed hat — no raise/tilt-back per the standard hat rule).
- **back** — two trailing headband tails hanging down behind the head,
  thin flattened boxes ~15×120×5mm, `0xc41e2a`.
- **head** (second primitive, hair) — short spiky black tufts peeking out
  around the band, small boxes, `0x1a1410`.
- **hip** — the black belt: a thin box wrapped around the waist,
  `0x1a1410`, full waist width × 40 × 10mm.
- **handL** / **handR** — red fist-wrap cuffs, small cylinders ~50mm
  diameter, `0xc41e2a` (approximates the modern red fighting gloves —
  see pack caveat above).

**Silhouette check**: an all-white gi torso/legs with a single red
headband band, black belt, and bare feet reads instantly as "the karate
fighter" — the white-not-red gi and headband (which Ken doesn't wear) are
what separate him from his rival at a glance.

**Personality**: `bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.0, ampMul: 1.0`
(a disciplined, balanced martial-arts gait)
**Bubbles**: `🥋👊🔥💥` (gi, punch, fireball, impact)

---

### 2. `shoto-red` — "Rival Karate Fighter (red gi, blonde hair)"

**Reference**: The protagonist's American training-brother and eternal
rival — same karate style and gi cut, but a flashier, more flamboyant
personality. Bright red gi (jacket and trousers), no headband, spiky
dyed-blonde hair, bare feet. Taller and leaner than his rival. (Ken.)

**Spec**
```
sk: 1.05
headR: 124
headShape: 'sphere'
limbR: 1.0
skin: 0xe8b48c
body: 0xc41e2a        // red gi torso
legColor: 0xc41e2a    // red gi pants
shoe: 0xe8b48c         // bare feet
eyes: 'dots'
emI: 0
hands: 'sphere'        // red fist wraps approximated via handL/handR below
steel: false
armL: 1.05
legL: 1.0
footMul: [1.0, 0.9, 1.0]
```

**Accessories**
- **head** — spiky blonde hair, larger/more voluminous tufts than Ryu's,
  `0xf0c840`.
- **hip** — black belt, same construction as Ryu's, `0x1a1410`.
- **handL** / **handR** — red fist-wrap cuffs, same construction as Ryu's,
  `0xc41e2a`.
- No headband accessory — the absence is the point (see pack-wide shoto
  pairing note above).

**Silhouette check**: solid red gi head-to-foot with no headband and
spiky blonde hair reads as "the other karate fighter" — same build/cut as
Ryu, but red-not-white and blonde-not-black flips the read instantly,
exactly like the Mario-brothers convention this pack reuses.

**Personality**: `bobMul: 1.05, swayMul: 1.0, cadenceMul: 1.1, ampMul: 1.05`
(a cockier, more energetic bounce than his rival's discipline)
**Bubbles**: `🥋😤🔥💪` (gi, cocky bravado, fireball, confidence)

---

### 3. `kicker-blue` — "Martial Artist (blue qipao, hair buns)"

**Reference**: An Interpol officer and martial artist whose fighting
style is built around powerful, rapid-fire kicks. A blue qipao (a
form-fitting one-piece Chinese dress) with gold trim, brown tights, white
combat boots, dark hair worn in two "ox-horn" buns with white bun covers,
and spiked bracelets. Composed, athletic, precise. (Chun-Li.)

**Spec**
```
sk: 0.95
headR: 120
headShape: 'sphere'
limbR: 0.85
skin: 0xf0c9a0
body: 0x1e56cc        // blue qipao bodice
legColor: 0xa0703c    // brown tights below the dress hem
shoe: 0xf5f2ea         // white combat boots
eyes: 'almond'
emI: 0
hands: 'sphere'
steel: false
armL: 0.9
legL: 1.1              // longer legs — her kicks are the whole read
footMul: [1.0, 1.0, 1.0]
```

**Accessories**
- **head** (×2, hair buns) — two "ox-horn" hair buns, small spheres
  ~70mm each, dark brown `0x2a1f1a`, each wrapped with a white bun cover
  (thin ring/disc), `0xf5f2ea`.
- **chest** — a thin gold trim band along the qipao's collar and front
  edge, `0xd9b34a`.
- **hip** — thin gold trim at the dress's side-slit edges, two small
  angled boxes, `0xd9b34a`.
- **handL** / **handR** — spiked bracelets: small dark cuffs with tiny
  spike bumps, `0x2a2a2a`.

**Silhouette check**: the fitted blue qipao (no leg break at the hip, just
a color change to brown tights at the knee) topped by twin dark hair buns
with white covers is unmistakable — the only blue-dressed, twin-bun
member in the pack.

**Personality**: `bobMul: 0.9, swayMul: 1.1, cadenceMul: 1.2, ampMul: 1.1`
(a quick, springy, kick-ready gait)
**Bubbles**: `🦵💥⚡😤` (kick, impact, lightning speed, determination)

---

### 4. `soldier-flattop` — "Soldier (flat-top, dog tags, camo)"

**Reference**: A hardened American special-forces major, driven by revenge
against the dictator who killed his best friend. A tight green tank top,
olive camo pants, black combat boots, dog tags, black fingerless gloves,
and his single most iconic feature — a tall, perfectly rectangular blonde
flat-top haircut. (Guile.)

**Spec**
```
sk: 1.05
headR: 128
headShape: 'sphere'
limbR: 1.15
skin: 0xe8b48c
body: 0x3a7d3a        // green tank top
legColor: 0x5a6b45    // olive camo pants (solid — see pattern gap in ROADMAP)
shoe: 0x2a2a2a         // black boots
eyes: 'dots'
emI: 0
hands: 'sphere'
steel: false
armL: 1.05
legL: 1.0
footMul: [1.1, 1.0, 1.05]
```

**Accessories**
- **crown** — THE flat-top: a wide, perfectly FLAT-TOPPED box sitting
  square on the head, blonde `0xe8c840`, deliberately rectangular/blocky
  rather than domed — the pack's only squared-off hair silhouette, and
  this member's single most important read.
- **chest** — dog tags: a thin chain (small dark cylinder) with a small
  rectangular tag, silver `0xc0c0c8`, hanging center-chest.
- **handL** / **handR** — black fingerless-glove cuffs, small dark bands,
  `0x2a2a2a`.

**Silhouette check**: the rigid rectangular flat-top block of blonde hair
is unique in the pack — no other member has a squared hair silhouette —
and paired with the green tank top and dog tags it reads "soldier"
instantly even with the face blank.

**Personality**: `bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.95, ampMul: 1.0`
(a disciplined, no-nonsense military bearing)
**Bubbles**: `🎖️💥😤🪖` (honor/rank, sonic-boom impact, gruff stoicism,
military bearing)

---

### 5. `beast-green` — "Jungle Beast (green skin, orange mane)"

**Reference**: A feral man raised alone in the Brazilian jungle after a
plane crash, mutated by exposure to electric eels. Vivid green skin,
a wild mane of orange hair down the head/back, clawed hands and feet,
bare-chested, wearing only ragged torn shorts, with lucky anklets from his
mother. Channels electricity as an attack. (Blanka.)

**Spec**
```
sk: 1.1
headR: 118
headShape: 'sphere'
limbR: 1.15
skin: 0x5cb82e         // green skin, whole body
body: 0x5cb82e
legColor: 0x5cb82e
shoe: 0x5cb82e          // clawed bare feet, same tone
eyes: 'dots'
emI: 0
hands: 'box'            // clawed hands read blockier
steel: false
armL: 1.05
legL: 0.95
footMul: [1.2, 0.9, 1.2]  // big clawed feet
```

**Accessories**
- **head** (×2-3, mane) — wild orange hair strands flowing from the head,
  tapered boxes, `0xe8720a`.
- **back** — the mane continuing down the back, a wider tapered box,
  `0xe8720a`.
- **hip** — ragged torn shorts, a short box around the hips, khaki-tan
  `0x8a6a4a`.
- **face** — two small white fang cones pointing up from the lower jaw,
  `0xf5f2ea`.

**Silhouette check**: solid green skin with a wild orange mane and no
shirt is utterly unique in the pack — no other member is green-skinned or
bare-chested/feral, so this reads at 30px purely off color alone. His
lucky ankle bracelets have no anchor to sit on (see Rig gaps in
`docs/ROADMAP.md` § avatar rig gaps — ankle/foot anchor already parked)
and are dropped rather than misplaced.

**Personality**: `bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.15, ampMul: 1.1`
(a springy, animalistic bounding gait)
**Bubbles**: `⚡🐒😝💥` (electric attack, feral/animal, tongue-out
mischief, impact)

---

### 6. `wrestler-red` — "Wrestler (red trunks, mohawk)"

**Reference**: A colossal Siberian professional wrestler, famed for his
spinning piledriver. Bare-chested and enormously muscular, a thick beard,
a narrow center-strip mohawk, red wrestling trunks with a gold belt trim,
and red-and-gold wrestling boots. The single biggest, most imposing member
of the roster. (Zangief.)

**Spec**
```
sk: 1.4               // biggest, most imposing member in the pack
headR: 140
headShape: 'sphere'
limbR: 1.4              // widest/most massive build in the pack
skin: 0xd9a06a          // weathered tan, bare-chested
body: 0xd9a06a
legColor: 0xd9a06a       // bare legs
shoe: 0xc41e2a           // red wrestling boots
eyes: 'dots'
emI: 0
hands: 'box'              // beefy, blocky hands
steel: false
armL: 1.3
legL: 0.9
footMul: [1.3, 1.0, 1.3]
```

**Accessories**
- **hip** — red wrestling trunks: a wide box wrapped around the hips,
  `0xc41e2a`, with a thin gold belt trim, `0xd9b34a`.
- **crown** — the mohawk: a tall, narrow ridge of dark hair running
  center-top of the head, `0x2a2018` (bald sides showing skin-tone —
  achieved by the mohawk's narrowness rather than a separate bald field).
- **face** — a thick, wide dark beard covering the lower face/jaw,
  `0x2a2018`.
- **chest** — a dark, fuzzy chest-hair patch, a proud oval, `0x3a2a1e`.
- **handL** / **handR** — gold wristbands, small cuffs, `0xd9b34a`.

**Silhouette check**: by far the widest/bulkiest build in the pack
(`sk 1.4`, `limbR 1.4` — the pack's largest values on both axes) plus red
trunks, a center mohawk, and a full beard is unmistakable; the near-nudity
also clearly separates him from Bison's fully-uniformed military bulk.

**Personality**: `bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.6, ampMul: 1.2`
(a slow, thunderous, ground-shaking powerhouse stomp — the heaviest gait
in the pack)
**Bubbles**: `💪🔥😤🤼` (raw strength, fighting spirit, gruff intensity,
wrestling)

---

### 7. `yogi-stretch` — "Yogi (yellow wraps, elongated limbs)"

**Reference**: An Indian yoga master and the series' original long-range
fighter, able to stretch his limbs to impossible lengths. Bald, dark
skin, a lean/gaunt build (toned everywhere except an emaciated waist),
torn saffron-yellow shorts tied with rope, red stripe markings on the
scalp, hoop earrings, metal bracelets, and a necklace of small skulls. The
longest-limbed, most serene fighter in the roster. (Dhalsim.)

**Spec**
```
sk: 0.95
headR: 120
headShape: 'sphere'
limbR: 0.7             // very thin/lean limbs — the emaciated-yogi build
skin: 0x9c7048          // dark bare skin, whole body
body: 0x9c7048
legColor: 0xe0b93a       // saffron yellow yoga shorts
shoe: 0x9c7048            // bare feet
eyes: 'dots'
emI: 0
hands: 'sphere'
steel: false
armL: 1.45               // longest arms in the shipped library — his
                         // signature limb-stretch, approximated as a
                         // static elongated proportion — see Rig gaps
legL: 1.15
footMul: [0.9, 0.8, 0.9]
```

**Accessories**
- **head** (×3) — three thin red stripe markings across the bald scalp,
  small flat boxes, `0xc41e2a`.
- **head** (×2, earrings) — small gold hoop rings at each side of the
  head, `0xd9b34a`.
- **neck** — the necklace of small skulls: 4-5 tiny bone-white spheres
  strung in a line, `0xe8e0d0`, hanging at the chest.
- **handL** / **handR** — gold bangle bracelets, thin rings, `0xd9b34a`.
- **hip** — a thin dark rope tied at the waist holding the shorts,
  `0x5a3620`.

**Silhouette check**: dramatically elongated arms and legs (the longest
proportions in the pack, by a wide margin) combined with a bald head,
saffron wrap-shorts, and a bone necklace is wholly unique — no other
member has stretched proportions, so the silhouette reads even before any
color registers.

**Personality**: `bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.6, ampMul: 0.5`
(a slow, serene, almost-floating meditative glide — his reach does the
work, not his stride)
**Bubbles**: `🧘🔥😌✨` (meditation, fire-breath attack, serene calm,
mystic energy)

---

### 8. `dictator-red` — "Dictator (red uniform, peaked cap, cape)"

**Reference**: The dictator-warlord leader of the crime syndicate
Shadaloo and the series' central antagonist, wielding a dark psychic
"Psycho Power." A deep-red military uniform with large silver shoulder
plates, black boots, a peaked service cap (dark hair slicked back
underneath), and a short cape. Imperious, commanding, menacing. (M.
Bison.)

**Spec**
```
sk: 1.15
headR: 128
headShape: 'sphere'
limbR: 1.1
skin: 0xd9a878
body: 0x8c1414        // deep red uniform torso — deliberately duller/
                       // darker than the pack's "fireball red" family
legColor: 0x8c1414    // uniform trousers
shoe: 0x1a1a1a          // black boots
eyes: 'halfred'          // heavy-lidded, fierce villain eyes
emI: 0.05                // faint psycho-power menace
hands: 'sphere'
steel: false
armL: 1.05
legL: 1.0
footMul: [1.05, 1.0, 1.05]
```

**Accessories**
- **crown** — the peaked service cap: a flattened dome with a stiff front
  brim, `0x8c1414`, a gold band trim `0xd9b34a`, and a small blank
  bone-white emblem disc front-center (no logo, per the pack's no-logo
  policy); raised + tilted back per the standard hat rule so the brim
  clears the brow.
- **shoulderL** / **shoulderR** — large silver epaulette plates,
  flattened discs proud of the shoulders, `0xc0c0c8`.
- **chest** — a thin gold braid trim running down the uniform front,
  `0xd9b34a`.
- **back** — a short dark cape draped from the shoulders: a flattened
  cone/box, `0x2a1414` (the pack's cape recipe per `docs/avatars/
  AUTHORING.md`).
- **handL** / **handR** — silver wristband cuffs, `0xc0c0c8`.
- **face** — a heavy, dark, angled brow, `0x2a2018` (menacing villain
  read, same convention as Bowser's brow in the Mario pack).

**Silhouette check**: the deep-red (not "fireball" red) military uniform
with silver shoulder plates, a peaked cap with pale emblem, and a short
dark cape is unmistakable — the only epauletted, caped member in the
pack, clearly the villain silhouette against the seven fighters.

**Personality**: `bobMul: 0.5, swayMul: 0.45, cadenceMul: 0.6, ampMul: 0.9`
(a slow, imperious, controlled glide-march — commanding presence, not a
stomp)
**Bubbles**: `👑💢😈⚡` (self-styled ruler, rage, menace, psycho power)

---

## Rig gaps

1. **No torso-taper / independent waist-width field.** Dhalsim's canonical
   build is toned everywhere except an out-of-proportion, emaciated waist
   — the rig's `sk`/`limbR` scale the whole body uniformly, with no field
   to make the torso narrower at the waist than at the shoulders. Worth a
   `waistMul` (or similar) field if a future pack wants a similarly
   lopsided build (starved/ascetic characters, "apple"/"pear" builds).
2. **No true elastic/telescoping limb-stretch animation.** Dhalsim's and
   (to a lesser extent) Ryu/Ken's signature attacks dynamically extend a
   limb mid-motion and retract it; the rig only offers a static `armL`/
   `legL` proportion multiplier, so this pack approximates the *look* of
   long limbs (permanently elongated) but not the *stretch-and-snap-back*
   motion itself. This is distinct from the already-parked "animated
   appendages" gap in `docs/ROADMAP.md` (tail sway / wing flap / tentacle
   idle channels are about small idle motions on existing limbs, not a
   whole limb changing length on demand) — worth filing separately if a
   future rubber-limbed or extending-weapon character pack comes up.
3. **No aura/energy-charge pulse for special-move telegraphing.** Ryu/
   Ken's fireball charge-up and Bison's Psycho Power crackle are both
   static costume reads here (`emI` constant, no pulse). This reinforces
   the League of Legends pack's existing note (`docs/avatars/video-games/
   league-of-legends.md`, Vi's gauntlet gap) that a charge/pulse emissive
   animation — distinct from a steady glow — would generalize across many
   franchise packs (energy weapons, magic charge-ups, "power up" beats).

## Sources

- [Ryu — Protagonists Wiki](https://protagonists.fandom.com/wiki/Ryu_(Street_Fighter))
- [How to Dress Like Ryu — CostumeWall](https://costumewall.com/dress-like-ryu/)
- [Ken Masters — Street Fighter Wiki](https://streetfighter.fandom.com/wiki/Ken_Masters)
- [Ken Masters — Wikipedia](https://en.wikipedia.org/wiki/Ken_Masters)
- [Dress Like Chun-Li — CostumeRealm](https://www.costumerealm.com/dress-like-chun-li/)
- [Street Fighter Classic Chun-Li Cosplay Costume — Micotaku](https://www.micotaku.com/Street-Fighter-Classic-Chun-Li-Blue-Cheongsam-Cosplay-Costume-with-Hair-Accessories-Halloween-Costume-255089p.html)
- [Guile — Street Fighter Wiki](https://streetfighter.fandom.com/wiki/Guile)
- [Dress Like Guile — CostumeRealm](https://www.costumerealm.com/dress-like-guile/)
- [Blanka — Street Fighter Wiki](https://streetfighter.fandom.com/wiki/Blanka)
- [Blanka — Wikipedia](https://en.wikipedia.org/wiki/Blanka)
- [Zangief — Street Fighter Wiki](https://streetfighter.fandom.com/wiki/Zangief)
- [Zangief — Wikipedia](https://en.wikipedia.org/wiki/Zangief)
- [Dhalsim — Street Fighter Wiki](https://streetfighter.fandom.com/wiki/Dhalsim)
- [M. Bison — Street Fighter Wiki](https://streetfighter.fandom.com/wiki/M._Bison)
- [Dress Like M. Bison — CostumeWall](https://costumewall.com/dress-like-m-bison/)
- [The Most Iconic Street Fighter Characters, Ranked — CBR](https://www.cbr.com/street-fighter-iconic-characters/)
- `docs/avatars/video-games/mario.md` (this repo) — the shoto-pairing
  "family resemblance through shared cut, distinct through color/hair"
  idiom and the glove-color rig gap, both reused/cross-referenced here.
- `docs/avatars/video-games/league-of-legends.md` (this repo) — the
  charge/pulse-emissive rig gap, reinforced here for a second pack.
