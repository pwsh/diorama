# Avatar pack: Minecraft

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon figures whose
blocky proportions and signature colors read as the mob/character archetype,
not a licensed likeness. No logos, no on-model face sculpts, no names printed
anywhere in-scene; identity lives only in this doc's Reference lines and the
pack's display labels (e.g. "Void Stalker (tall, black, purple eyes)").

## Overview

- **Group**: The most recognizable cast from Mojang's *Minecraft* — the
  game's two default playable skins plus six of its most iconic mobs,
  spanning "friendly NPC," "silent hostile," "ranged hostile," "shambling
  hostile," "tall neutral," and "nether-dwelling raider" archetypes. This
  mirrors the exact 8-member list the intake survey suggested (Steve, Alex,
  Creeper, Zombie, Skeleton, Enderman, Villager, Piglin); research confirmed
  all eight are primary-cast (every one ships as a built-in, unmistakable
  silhouette the moment a new player starts a world) and each passes the
  silhouette test distinctly, so the list stands unchanged.
- **Hierarchy path**: `video-games / minecraft`
- **Member count**: 8
- **Rig**: humanoid only — every member here is canonically bipedal
  (including the Creeper, whose 4-legged model is a well-known engine quirk
  from its origin as a mis-scaled pig; it stands and moves upright like
  everything else in this pack, so it's built on the humanoid rig with its
  arms minimized rather than as a quadruped — see Rig gaps #1). No
  quadruped members were selected: Minecraft's most iconic *quadrupeds*
  (pig, cow, sheep, wolf, spider) are farm/background/pet-tier rather than
  primary "cast" the way these eight are, and would be better served by a
  future companion pack (e.g. `base/farm-animals`-style) than by displacing
  a primary-cast biped here.
- **Member-selection notes — who was omitted and why**: boss-tier mobs
  (Ender Dragon, Wither) were considered and dropped — they're rare
  end-game encounters rather than everyday primary cast, and their scale
  (many blocks across, wings, no legs at all) is a poor fit for the
  humanoid rig even before considering the 12-member cap. The Iron Golem
  and Spider were also considered: the Golem is a large blocky protector
  that could work well as a bulky humanoid, and the Spider's 8-leg silhouette
  has no rig support at all (see Rig gaps #2) — both are good candidates for
  a future "Minecraft — Nether & Overworld II" follow-up pack rather than
  crowding this primary 8.
- **Shared design principle — cube heads, the single most Minecraft-defining
  trait**: every member uses `headShape: 'box'` (and `hands: 'box'`) instead
  of the rig's default sphere/round hands. Nothing else about this pack
  reads "Minecraft" as instantly as the flat-cube head silhouette — it's
  applied uniformly even to members (Villager, Piglin) whose in-game
  textures give an illusion of a rounder face, because the blocky read is
  the whole point of the homage.
- **Shared base spec** (every member starts here, then overrides):
  ```
  sk:        1.0
  headShape: 'box'
  hands:     'box'
  eyes:      'dots'      # overridden per-member below
  emI:       0
  steel:     false
  footMul:   [1.0, 1.0, 1.0]
  ```
- **Shared palette — signature hues, one per member so the group reads as
  distinct silhouettes at a glance**:
  - Cyan-blue — `0x4f8fce` (Steve's shirt)
  - Warm orange — `0xe08a30` (Alex's ponytail)
  - Grass green — `0x3a8f3a` (Creeper's mottled hide)
  - Olive/muted green — `0x4c7a3f` (Zombie's rotted skin — see caveat below)
  - Bone white — `0xdcd6c2` (Skeleton)
  - Void black — `0x18151a` with a glowing purple accent `0x9b30ff`
    (Enderman — the only emissive-accent member)
  - Warm brown — `0x8a6a45` (Villager's robe)
  - Pale pink — `0xe8a9a0` (Piglin's hide)
  - Gold accent — `0xd9b34a` (jewelry/trim only, never a whole-body fill —
    used solely on the Piglin, matching the "accessory accent, never a
    whole-body color" rule other packs' crown/trim golds follow)
  - **Two-greens caveat**: Creeper and Zombie both anchor on green. They're
    kept distinct by proportion as much as hue — the Creeper is a tall,
    armless, stiff blocky column with a bright/saturated grass green and a
    small dark-mottled face, while the Zombie has a normal two-armed human
    silhouette in a duller olive-green with tattered blue-grey clothing.
    Silhouette and clothing carry the distinction, not color alone.
- **Pack-wide convention — oversized face-bump snouts/noses**: the
  Villager's nose and the Piglin's snout both reuse the "oversized `face`
  sphere bump, larger than the rig's default nose" convention established
  for Yoshi in `docs/avatars/video-games/mario.md` (Rig gaps #5 there) —
  no new gap, just the same recipe applied twice more.
- **Pack-wide convention — held prop**: the Skeleton's bow/quiver reuses the
  `handR`/`back` held-prop convention already shipped in
  `docs/avatars/sci-fi/power-rangers-mighty-morphin.md` (swords) and
  `docs/avatars/sci-fi/stranger-things.md` (slingshot, nail bat) — a thin
  box/cylinder prop anchored to the hand, no new anchor needed. The prop
  itself is a straight approximation of a curved bow — see Rig gaps #3.

## Members

### 1. `player-blue` — "Player (cyan shirt, brown hair)"

**Reference**: The game's original default player skin — light-brown skin,
short dark-brown hair, a light stubble/beard (added in Java 1.19.3), a cyan
shirt with cuffs left untucked on one side, dark blue-grey pants, and grey
shoes. The archetypal "first character" every new player starts as. (Steve.)

**Spec**
```
sk: 1.0
headR: 120
headShape: 'box'
limbR: 1.0
skin: 0xd9a273
body: 0x4f8fce         // cyan shirt
legColor: 0x33344a     // dark blue-grey pants
shoe: 0x8c8c8c          // grey shoes
eyes: 'dots'
emI: 0
hands: 'box'
steel: false
armL: 1.0
legL: 1.0
footMul: [1.0, 1.0, 1.0]
```

**Accessories**
- **head** — short dark-brown hair, a flattened box cap over the crown,
  ~`headR*1.6` wide × 30 mm tall, `0x4a3728`.
- **face** — a light beard/stubble: a small dark box under the chin and
  along the jawline, ~70×22×16 mm, `0x4a3728`.

**Silhouette check**: the solid cyan shirt over dark pants, topped by a
plain cube head with short brown hair, reads instantly as the default
protagonist — no other member combines this hue with a fully human,
unaccessorized silhouette.

**Personality**: `bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 1.0`
(an even, steady, unhurried default walk)
**Bubbles**: `⛏️🧱💎😀` (mining pickaxe, block-building, ore/treasure,
cheerful)

---

### 2. `player-orange` — "Player (green shirt, orange ponytail)"

**Reference**: The game's second default player skin — a slightly slimmer
build (thinner arms in-game), long orange hair worn in a side ponytail
draped over one shoulder, a light-green shirt with darker green cuffs,
brown pants, and grayish-brown boots. (Alex.)

**Spec**
```
sk: 0.95
headR: 118
headShape: 'box'
limbR: 0.85
skin: 0xe8c19a
body: 0x74b06a         // light green shirt
legColor: 0x6b5338     // brown pants
shoe: 0x7a7267          // grayish-brown boots
eyes: 'dots'
emI: 0
hands: 'box'
steel: false
armL: 0.95
legL: 1.0
footMul: [0.95, 1.0, 0.95]
```

**Accessories**
- **head** — the side ponytail: a tapered box draped over one shoulder,
  ~40×220×35 mm, `0xe08a30`.
- **back** — hair continuing down the back/shoulder before the ponytail
  break, a shorter tapered box, ~90×110×25 mm, `0xe08a30`.
- **chest** — darker green cuff/collar trim on the shirt, thin proud
  bands, `0x4a7a42`.

**Silhouette check**: the long orange side-ponytail draped over one
shoulder against a light-green (not cyan) shirt is unmistakably the
second default skin — no other member has hair styled to one side.

**Personality**: `bobMul: 1.05, swayMul: 1.0, cadenceMul: 1.05, ampMul: 1.0`
(a touch livelier/lighter-footed than the other default skin)
**Bubbles**: `🏹🌻💚😊` (archery/adventuring, sunflower/farming, green
heart, cheerful)

---

### 3. `explosive-crawler` — "Explosive Crawler (green, blocky, no arms)"

**Reference**: The series' signature silent hostile — a tall, entirely
green, blocky mob with NO visible arms, a small square head bearing a
simple flat pixel face (two dark square eyes and a tall dark rectangular
frown), and a mottled/camouflage-patterned hide. It sneaks up silently,
freezes and hisses when close to a player, then swells and detonates in a
few seconds. Famously born from a coding accident that swapped a pig
model's height/length. (Creeper.)

**Spec**
```
sk: 1.05
headR: 95              // small head relative to its tall body
headShape: 'box'
limbR: 0.5              // arms minimized toward "no arms" — see Rig gaps #1
skin: 0x3a8f3a          // mottled grass-green hide
body: 0x3a8f3a
legColor: 0x2b6b2b       // slightly darker green legs
shoe: 0x2b6b2b
eyes: 'none'             // custom flat pixel face instead — see accessories
noFace: true
emI: 0
hands: 'box'
steel: false
armL: 0.35               // minimized, colored to match body — see Rig gaps #1
legL: 0.85               // short, stiff, stubby legs
footMul: [1.3, 0.7, 1.3]  // wide stubby feet suggest the canonical 4-leg stance
```

**Accessories**
- **face** (×2) — the flat pixel eyes: small dark-green-black squares
  (box, ~26×26×6 mm), `0x1c3d1c`, set into the face plane.
- **face** (third primitive) — the frowning mouth: a tall narrow dark
  rectangle (box, ~20×50×6 mm), `0x1c3d1c`, centered below the eyes.
- **chest** / **back** — 2–3 proud darker-green blotches (boxes, ~3 mm
  proud, `0x2b6b2b`) breaking up the flat body color for the mottled/
  camouflage read.

**Silhouette check**: a tall, uniformly green, armless blocky column with
a tiny dark-mottled square face is unmistakable — no other member is
green AND armless, and no other member's face is flat dark squares rather
than sculpted eyes.

**Personality**: `bobMul: 0.5, swayMul: 0.3, cadenceMul: 0.9, ampMul: 0.5`
(a stiff, quiet, minimal-swing creep — no arms to swing, and the source
material is famous for sneaking in near-silence)
**Bubbles**: `💥😐💚🤫` (explosion, blank stare, mottled green, hushed
sneaking)

---

### 4. `shambling-undead` — "Shambling Undead (rotted green, tattered blue)"

**Reference**: A rotting, hostile mob wearing the same base clothing
silhouette as the default player skins but weathered and darker — sickly
olive-green skin, a tattered dark cyan-blue shirt, dark blue-grey pants,
and hollow, vacant eyes. It shambles toward players with a stiff gait and
its arms raised out in front when giving chase, groaning as it closes in.
(Zombie.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'box'
limbR: 1.0
skin: 0x4c7a3f          // sickly olive-green
body: 0x3d5a73          // tattered dark cyan-blue shirt
legColor: 0x2b3a4a       // dark blue-grey pants
shoe: 0x241f1f
eyes: 'dots'             // dark, hollow-reading against the pale-olive face
emI: 0
hands: 'box'
steel: false
armL: 1.05
legL: 0.95
footMul: [1.0, 1.0, 1.0]
posture: { pitch: 0.12 } // slight forward hunch — the classic zombie lean
```

**Accessories**
- No dedicated accessories beyond the shared base — the read is entirely
  color + posture + gait (a plain rotted humanoid in ruined default-player
  clothing is the whole silhouette).

**Silhouette check**: a normal two-armed human shape in the olive-green /
tattered-blue palette, hunched forward with a heavy staggering gait, reads
instantly as "the undead" beside the upright, evenly-colored player skins.

**Personality**: `bobMul: 0.7, swayMul: 1.6, cadenceMul: 0.55, ampMul: 1.3`
(slow, stiff, staggering — heavy side-to-side sway and big stiff-armed
swing rather than a normal stride)
**Bubbles**: `😩🌙💀🚶` (groaning, night-dweller, undead, shambling)

---

### 5. `bone-archer` — "Bone Archer (bone white, bow)"

**Reference**: An undead ranged mob — an entirely bone-white/off-white
bony frame (no separate "clothing" color; the skeleton itself is the
whole silhouette), dark hollow eye sockets, and a bow it fires at players
from a distance, backing away to keep range. Rattles as it moves.
(Skeleton.)

**Spec**
```
sk: 1.0
headR: 118
headShape: 'box'
limbR: 0.65             // thin, bony limbs
skin: 0xdcd6c2          // bone white
body: 0xd2ccb6
legColor: 0xcac4ae
shoe: 0xb0aa96
eyes: 'dots'
emI: 0
hands: 'box'
steel: false
armL: 1.0
legL: 1.0
footMul: [0.85, 0.9, 0.85]
```

**Accessories**
- **handR** — the bow: a thin straight cylinder/box prop (~15 mm radius ×
  260 mm), `0x5a4632`, held forward in the draw hand (the source bow's
  curve isn't representable — see Rig gaps #3 — a straight stave-shaped
  prop is the approximation).
- **back** — a small quiver: a short cylinder (~40 mm radius × 140 mm),
  `0x6b4e34`, with 2–3 thin light-colored fletching tips (`0xe0dccc`)
  peeking from the top.

**Silhouette check**: an entirely bone-white, thin-limbed figure with a
bow held forward is unmistakable — the only all-white, weapon-carrying
member in the pack.

**Personality**: `bobMul: 0.9, swayMul: 0.6, cadenceMul: 1.0, ampMul: 0.8`
(a light, quick, skittering gait — it keeps distance rather than closing
in like the Zombie)
**Bubbles**: `🏹💀🦴😨` (bow/archery, skull, bone, startled)

---

### 6. `void-stalker` — "Void Stalker (tall, black, purple eyes)"

**Reference**: A tall, slender, neutral-until-provoked mob — an entirely
jet-black body with unnervingly long limbs, roughly a head-and-shoulders
taller than a player. Its only visible feature is a pair of glowing purple
eyes; it emits purple particles, can pick up and place blocks, and
teleports short distances when angered. (Enderman.)

**Spec**
```
sk: 1.35               // the tallest member in the pack
headR: 100              // small head atop a long, gangly body
headShape: 'box'
limbR: 0.55              // very thin, elongated limbs
skin: 0x18151a           // near-black
body: 0x18151a
legColor: 0x18151a
shoe: 0x0d0b0d
eyes: 'none'              // custom glowing accessory instead
noFace: true
emI: 0
hands: 'box'
steel: false
armL: 1.5                // unnaturally long arms
legL: 1.35                // unnaturally long legs
footMul: [0.8, 0.9, 0.9]
```

**Accessories**
- **face** (×2) — the glowing purple eyes, the ONLY visible facial
  feature: tiny spheres (~18 mm), `0x9b30ff`, `emissive: 0x9b30ff`,
  `emissiveIntensity: 0.9`, `outlineSkip: true` (matches the "emissive
  eyes carry outlineSkip" rule already used for the core `robot`/`alien`
  kinds).

**Silhouette check**: an all-black, unnaturally tall and gangly figure
with nothing visible but two floating purple glowing points is instantly
distinct from every other, grounded and colorful, member — the tallest
and darkest silhouette in the pack by a wide margin.

**Personality**: `bobMul: 0.5, swayMul: 0.3, cadenceMul: 0.75, ampMul: 0.9`
(an eerie, deliberate, unhurried stride — long legs cover ground slowly
without looking rushed)
**Bubbles**: `😳🟪👀💨` (unsettled stare, purple accent, watching eyes,
particle/teleport puff)

---

### 7. `robed-trader` — "Robed Trader (brown robe, big nose, unibrow)"

**Reference**: A passive village NPC — bald, tan-skinned, a large hooked
nose, a thick unibrow, small dark-green eyes, and a simple long brown
robe with a lighter apron-like overlay that reaches the ground (no
visible leg break). Nervous, wide-eyed, and prone to a startled shrug or
hum. (Villager.)

**Spec**
```
sk: 0.95
headR: 128              // big head — the nose reads prominent
headShape: 'box'
limbR: 0.85
skin: 0xc9a06e           // tan
body: 0x8a6a45           // brown robe
legColor: 0x8a6a45        // robe continues — no visible leg break
shoe: 0x5c4630
eyes: 'almond'
emI: 0
hands: 'box'
steel: false
armL: 0.9
legL: 0.9
footMul: [0.9, 1.0, 0.9]
```

**Accessories**
- **face** — the oversized hooked nose: an oversized sphere bump (~55 mm,
  reusing the Yoshi/Toad convention — see Overview), `0xb98e5c`
  (a shade darker than the base skin).
- **face** (second primitive) — the thick unibrow: a wide dark box across
  the brow, ~100×20×14 mm, `0x3a2a1a`.
- **chest** — the lighter apron overlay: a proud rectangular patch,
  `0xd9c39a`, ~body-width × 260 × 8 mm, covering the lower robe front.

**Silhouette check**: the oversized hooked-nose bump plus thick unibrow on
a bald head, over a plain floor-length brown robe with no leg break, is
unmistakably "the trader NPC" — no other member has a protruding nose
bump this large or a full-length ungirded robe.

**Personality**: `bobMul: 0.8, swayMul: 0.7, cadenceMul: 0.9, ampMul: 0.7`
(a nervous, shuffling, wide-eyed gait)
**Bubbles**: `💚🌾🏠😟` (emerald/trade, wheat/farming, home/hut, anxious)

---

### 8. `tusked-raider` — "Tusked Raider (pale pink, tusks, gold)"

**Reference**: A brutish, Nether-dwelling mob — pale pink pig-like skin, a
protruding snout, floppy ears, curved white tusks, small dark eyes, dark
leather clothing, and gold jewelry (earrings, a chain) it covets and
collects gold armor to wear. (Piglin.)

**Spec**
```
sk: 1.1
headR: 128
headShape: 'box'
limbR: 1.15              // bulky, brutish build
skin: 0xe8a9a0            // pale pink
body: 0x4a3a2e            // dark leather vest
legColor: 0x3a2c22        // dark leather pants
shoe: 0x2a1f18
eyes: 'dots'
emI: 0
hands: 'box'
steel: false
armL: 1.1
legL: 0.95
footMul: [1.1, 1.0, 1.15]
```

**Accessories**
- **face** — the snout: an oversized sphere bump (~50 mm, reusing the
  Yoshi/Toad/Villager convention), `0xd68f86` (a deeper pink than the
  base skin).
- **head** (×2) — floppy ears: flattened wide boxes hanging at the sides,
  ~60×90×20 mm, `0xd68f86`.
- **face** (second primitive, ×2) — curved white tusks: small cones
  pointing up from the mouth corners, ~14×36 mm, `0xf0ece0`.
- **neck** — a gold chain/necklace: a thin flattened band, `0xd9b34a`.
- **head** (third primitive) — a small gold hoop earring near one ear, a
  thin ring-like disc, `0xd9b34a`.

**Silhouette check**: the pale-pink oversized snout, floppy ears, curved
white tusks, and gold jewelry over dark leather is unmistakably this
Nether brute — the only pink-hued, tusked member, with gold as its one
accent (per the shared-palette rule) rather than any other member's.

**Personality**: `bobMul: 1.1, swayMul: 1.0, cadenceMul: 0.9, ampMul: 1.2`
(a heavy, aggressive strut with a pronounced stomp)
**Bubbles**: `🪙💰😠🔥` (gold coin, greed, aggression, Nether fire)

---

## Rig gaps

1. **No "armless mob" suppression.** The humanoid rig always builds and
   swings both arms; there's no flag to omit them entirely. The Explosive
   Crawler (Creeper) is canonically armless — approximated here by
   minimizing `armL`/`limbR` to a stub and coloring the arms to match the
   body so they recede into the silhouette rather than reading as visible
   limbs, plus a low `ampMul` so they barely swing. A dedicated
   `noArms?: boolean` (build-time skip, mirroring how `hover` already
   omits both legs) would generalize cleanly to any future limbless/
   tentacle-only/floating-torso character.
2. **No multi-leg (>2) or many-leg (spider-class) support.** The Creeper's
   canonical model literally has four short legs (a shipped engine quirk,
   not a design choice), and a hypothetical future Spider member would
   need eight. The rig has exactly two leg pivots; this pack approximates
   the Creeper with a stiff two-leg stance and wide stubby feet
   (`footMul`) suggesting more contact points than are actually there.
   Not worth generalizing for one mob's quirk, but worth flagging before
   any future arachnid/many-legged pack is attempted — it would need a
   genuinely new leg-count-parametric build path, not just field tweaks.
3. **No curved/arc prop primitive.** `AvatarPrimitive` shapes are limited
   to box/sphere/cylinder/cone — there's no way to build a genuinely
   curved bow, hook, or scythe blade. The Bone Archer's (Skeleton) bow is
   approximated as a straight stave-shaped box/cylinder prop rather than
   its canonical curve. A short chain of small rotated box segments could
   fake an arc at some polish cost; a true "arc" prop shape would be a
   cleaner fix if a future pack (any archer character) wants a
   recognizably curved bow.

## Sources

- [Steve – Minecraft Wiki](https://minecraft.wiki/w/Steve)
- [Alex – Minecraft Wiki](https://minecraft.wiki/w/Alex)
- [Minecraft Steve Color Palette — color-hex.com](https://www.color-hex.com/color-palette/92647)
- [Minecraft Alex Color Palette — color-hex.com](https://www.color-hex.com/color-palette/109099)
- [Creeper – Minecraft Wiki](https://minecraft.wiki/w/Creeper)
- [Creepers-Minecraft Color Palette — color-hex.com](https://www.color-hex.com/color-palette/5979)
- [Zombie – Minecraft Wiki](https://minecraft.wiki/w/Zombie)
- [Zombie from Minecraft Color Palette — color-hex.com](https://www.color-hex.com/color-palette/1050347)
- [Skeleton – Minecraft Wiki](https://minecraft.wiki/w/Skeleton)
- [minecraft skeleton Color Palette — color-hex.com](https://www.color-hex.com/color-palette/1021346)
- [Enderman – Minecraft Wiki](https://minecraft.wiki/w/Enderman)
- [Eye Of The Enderman Color Palette — color-hex.com](https://www.color-hex.com/color-palette/16967)
- [Villager – Minecraft Wiki](https://minecraft.wiki/w/Villager)
- [Piglin – Minecraft Wiki](https://minecraft.wiki/w/Piglin)
- `docs/avatars/video-games/mario.md` (this repo) — the oversized
  face-bump snout/nose convention (Yoshi/Toad), reused here twice.
- `docs/avatars/sci-fi/power-rangers-mighty-morphin.md`,
  `docs/avatars/sci-fi/stranger-things.md` (this repo) — the `handR`
  held-prop convention, reused for the Skeleton's bow.
- `docs/avatars/sci-fi/star-wars-ot.md` (this repo) — the emissive
  proud-accessory eye-occlusion precedent, reused (via `eyes:'none'` +
  `noFace`) for the Enderman's glowing eyes.
