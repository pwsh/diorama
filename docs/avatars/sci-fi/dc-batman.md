# Franchise pack: DC Comics — Batman

**Hierarchy path**: `Sci-Fi ▸ DC ▸ Batman`. These are stylized geometric toon
homage figures (Sims-style minifigures inspired by the character's classic
comics / *Batman: The Animated Series*-era costume color-coding and signature
props) — no likenesses, no logos, no printed insignia/text anywhere in-scene.
Every member below uses a **descriptive-generic label** for in-app display;
the actual character name lives only in the Reference line of this doc,
exactly as established by the `marvel-avengers` precedent this doc mirrors.

## Overview

- **Group**: the core Batman mythos ensemble — Batman himself, his closest
  sidekicks/allies, and four signature rogues-gallery villains, read through
  their classic comics / animated-series looks (the versions a casual fan
  would draw from memory, not any single film era's redesign).
- **Hierarchy path**: `Sci-Fi / DC / Batman`
- **Member count**: 10
- **Rig**: humanoid only (no quadrupeds in this pack)
- **Shared base spec** (all members start here, then override):
  ```
  sk: 1.0
  headR: 126
  headShape: 'sphere'
  limbR: 1.0
  hands: 'box'
  eyes: 'almond'
  steel: false
  emI: 0
  armL: 1.0
  legL: 1.0
  footMul: [1.0, 1.0, 1.0]
  ```
- **Member-selection notes**: the ten below are the primary cast a casual fan
  names first — Batman, Robin, Batgirl, and Alfred as the hero/family side;
  Commissioner Gordon as the one non-costumed ally who belongs in the same
  breath; and Joker, Harley Quinn, Catwoman, Penguin, and Riddler as the
  rogues-gallery names that show up in every "Batman villains" conversation
  regardless of era. Nothing here needed trimming to fit the 5–12 cap. Omitted
  as a rung below this ten in general-recognition terms (all legitimately
  famous, but each arguably behind at least half of the above for a
  *first-ten* pack): Two-Face, Poison Ivy, Bane, Mr. Freeze, Scarecrow,
  Ra's al Ghul, and Nightwing/other Robins — a natural "Gotham Rogues,
  Volume 2" follow-up pack is the right home for them rather than stretching
  this one past 12. Batgirl is specced as Barbara Gordon's classic
  purple-and-yellow look (the version that also later fed back into the
  comics) rather than the 1967-original black-and-yellow, since it's the
  more broadly recognized "classic Batgirl" read across media today.
- **Shared style note — cowls vs. bare faces vs. full disguise**: like the
  Avengers pack, there's no single shared palette by design; each member's
  silhouette carries its own read. Three members wear a full ear-cowl
  (Batman, Batgirl) or full-face covering (Catwoman's goggled cowl) that
  reads as `skin`; two wear only an eye mask over a bare head (Robin's domino
  mask, Harley's smaller domino); the rest (Alfred, Gordon, Joker, Harley's
  face itself, Penguin, Riddler) are fully bare-faced. This mirrors the
  in-universe distinction between the masked vigilantes and everyone else.
- **Tint-rule note**: primary costume colors are canon-critical the same way
  the Avengers doc treats them (a green-suited purple-accented Riddler
  recolored off-hue stops reading as the character). Every member still
  carries one small, safe recolor point for per-sensor/person color coding:
  Batman's/Robin's/Batgirl's utility-belt trim, the Joker's lapel
  boutonniere, Catwoman's belt, Penguin's hatband, and Riddler's hatband are
  all called out explicitly below as the `'tint'` slot.
- **Recurring accessory idiom — headwear carries the read**: as with the
  LEGO pack, most of this cast's identity rides on one signature head
  accessory rather than costume detail alone: the pointed ear-cowl
  (Batman/Batgirl), the domino mask (Robin/Harley), the top hat + monocle
  (Penguin), the bowler hat (Riddler), and green hair (Joker). Where a member
  has no headwear tell (Alfred, Gordon), a bare-faced older-adult read plus a
  distinct garment (tailcoat + waistcoat vs. trench coat + badge) carries it
  instead.
- **Cape convention — attach at `neck`, not `back`**: every cape below
  (Batman, Robin, Batgirl) is specced as `shape:'cape'` anchored at **`neck`**
  rather than `back`. This doc was authored anticipating a parallel fix
  landing for the shared cape recipe (`src/avatars.ts`'s `AvatarPrimitive`
  comment currently documents hanging capes from the `back` anchor with an
  outward `rot` so the drape clears the shoulders/torso) — attaching at the
  neck line is the more physically correct hang point for a cloak clasped at
  the throat, which is exactly this pack's use case (three of ten members).
  **If that fix has not landed by the time this doc is implemented as a pack
  module**, fall back to `anchor: 'back'` with the existing outward-tilt
  convention from `marvel-avengers`/`he-man`/etc. — no other field in any
  spec below needs to change either way.

## Members

### 1. `dc-batman/caped-crusader` — "Caped Crusader (grey/black suit, cowl)"

**Reference**: A billionaire industrialist who, driven by his parents'
murder, trains himself to the peak of human ability and fights crime as a
brooding, cowled vigilante — grey body armor/suit under a near-black
scalloped cape and a pointed-eared cowl, a yellow utility belt, and a bat
emblem on the chest. No superpowers, just detective skill, martial arts, and
gadgets. (Batman / Bruce Wayne.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0x232838          // cowl reads as "skin" — full head coverage, dark navy-black
body: 0x8a8f99           // grey suit
legColor: 0x8a8f99        // grey tights, matching the torso
shoe: 0x1c1e24             // black boots
eyes: 'slit'                // narrow cowl eye-slit geometry — override glow to white, not red (see Rig gaps)
emI: 0
hands: 'box'                // gauntleted fists
limbR: 1.0
limbColors: { armL: 0x1c1e24, armR: 0x1c1e24 }  // black gauntlet gloves over the grey sleeves
```

**Accessories**
- **crown** (×2, cowl ears) — small pointed cones, ~24×80×24 mm, dark
  navy-black `0x1c2030` (matching the cowl), raised and tilted back per the
  standard crown-clearance rule so the points read above the brow.
- **neck** — cape: `shape:'cape'`, size `[420, 620, 520]` (shoulder width,
  length, flared hem width), dark blue-black `0x1a2035` (deliberately a shade
  off pure black — the classic "midnight blue" comics cape read) — hangs
  from the neck line past the knee.
- **chest** — bat-emblem accent: a flattened oval disc, proud ~3 mm,
  ~90×70×6 mm, yellow `0xf2c744`, centered on the chest (no black bat
  silhouette overlay — see Rig gaps; the yellow-oval color block alone
  carries the reference).
- **hip** — utility belt: a thin band, ~body-width×40×18 mm, yellow
  `0xf2c744`, plus 3 small square pouch bumps (~20×20×14 mm each) in the
  same yellow, evenly spaced — the single most requested detail for this
  member.
- **hip** — black trunks overlay: a short box, ~body-width+10×140×
  body-depth+10 mm, near-black `0x1c1e24`, worn over the grey tights at the
  waist (the classic "trunks over tights" silhouette break).

**Silhouette check**: the pointed bat-ear cowl + flowing near-black cape +
grey body + yellow belt is unmistakable at any size — the only member with
this cowl-ear silhouette besides Batgirl, and instantly told apart from her
by grey-vs-purple color alone.

**Personality**: `bobMul: 0.85, swayMul: 0.5, cadenceMul: 0.95, ampMul: 0.9`
(a controlled, predatory glide — restrained power, never showy)
**Bubbles**: `🦇🌃🥷🕵️` (bat, night city, stealth, detective work)

---

### 2. `dc-batman/boy-wonder` — "Boy Wonder (red/green, short cape)"

**Reference**: Batman's young ward and crime-fighting partner — a bright red
tunic, green tights/boots, a short yellow cape, and a simple black domino
mask over a bare (unmasked-below-the-eyes) head; no cowl, unlike his mentor.
The classic energetic, acrobatic junior half of the Dynamic Duo. (Robin /
Dick Grayson.)

**Spec**
```
sk: 0.82                  // younger, smaller build
headR: 118
headShape: 'sphere'
skin: 0xd8a878
body: 0xcc2027            // red tunic
legColor: 0x1f7a3d         // green tights/boots
shoe: 0x1f7a3d
eyes: 'almond'
emI: 0
hands: 'box'
limbR: 0.9
```

**Accessories**
- **crown** — short dark hair cap, ~110×42×110 mm, `0x241f1c`.
- **face** — black domino mask: a thin band across the eyes, ~90×24×10 mm,
  `0x141414`, proud — the character's signature (and only) disguise element.
- **neck** — cape: `shape:'cape'`, size `[300, 380, 340]` (deliberately
  smaller/shorter than Batman's — the "short cape" the brief called for),
  bright yellow `0xf4c430`, hangs from the neck to mid-back.
- **chest** — "R" emblem accent: a small flattened disc, proud ~3 mm,
  ~40×40×5 mm, black `0x141414` (a color-block stand-in for the printed
  letter — see Rig gaps).
- **hip** — yellow utility belt band, ~body-width×26×12 mm, `0xf4c430`.

**Silhouette check**: solid red torso + green legs + a short yellow cape +
a simple eye mask (no cowl, no ears) reads as "the junior hero" instantly —
the pack's only bare-headed masked member, immediately distinct from the
full-cowl silhouettes of Batman and Batgirl.

**Personality**: `bobMul: 1.05, swayMul: 0.85, cadenceMul: 1.2, ampMul: 1.05`
(youthful, acrobatic, quick on his feet — the pack's fastest cadence)
**Bubbles**: `🐦🤸❗😄` (bird namesake, acrobatics, an exclamation for the
"Holy ___!" catchphrase habit, youthful grin)

---

### 3. `dc-batman/batgirl` — "Batgirl (purple/yellow, cowl)"

**Reference**: A librarian (and police commissioner's daughter) who
independently takes up a bat-themed identity — a purple ear-cowl and cape
over a purple bodysuit, with yellow gloves, boots, belt, and chest emblem;
red hair visible trailing from under the cowl. (Batgirl / Barbara Gordon.)

**Spec**
```
sk: 0.95
headR: 122
headShape: 'sphere'
skin: 0xd8a878
body: 0x5b2a86            // purple bodysuit
legColor: 0x5b2a86
shoe: 0xf2c744              // yellow boots
eyes: 'almond'
emI: 0
hands: 'box'
limbR: 0.88
limbColors: { armL: 0xf2c744, armR: 0xf2c744 }  // yellow gauntlet gloves over the purple sleeves
```

**Accessories**
- **crown** (×2, cowl ears) — small pointed cones, ~22×72×22 mm, dark
  purple `0x431f66` (matching the cowl), raised and tilted back per the
  crown-clearance rule.
- **head** (×2, trailing hair) — red hair spilling from under the cowl,
  elongated boxes ~34×140×26 mm each side, auburn-red `0x8b2e1f` (same
  recipe as the Avengers master-spy's hair, at longer length).
- **neck** — cape: `shape:'cape'`, size `[380, 560, 460]`, dark purple
  `0x431f66` (matching the cowl, distinct from Batman's near-black cape).
- **chest** — bat-emblem accent: a flattened oval disc, proud ~3 mm,
  ~80×62×6 mm, yellow `0xf2c744` (same insignia approximation as Batman's).
- **hip** — utility belt: thin band, ~body-width×34×14 mm, yellow
  `0xf2c744`.

**Silhouette check**: a purple ear-cowl + purple cape + yellow gloves/boots/
belt + visible trailing red hair is the pack's brightest cowl silhouette —
told apart from Batman by color alone and from Robin by the full cowl (vs.
his bare masked head).

**Personality**: `bobMul: 0.9, swayMul: 0.6, cadenceMul: 1.05, ampMul: 0.9`
(agile, confident — a hero fully arrived in her own right)
**Bubbles**: `🦇📚🥋👩‍🎓` (bat-hero, her librarian day job, martial-arts
training, a sharp, studious mind)

---

### 4. `dc-batman/butler` — "The Butler (black tailcoat, grey vest)"

**Reference**: Bruce Wayne's unflappable butler, legal guardian, and closest
confidant — a formal black tailcoat with a grey waistcoat, white shirt, black
bow tie, a greying moustache, and a receding hairline; utterly composed no
matter the crisis. (Alfred Pennyworth.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
skin: 0xd8b090
body: 0x1a1a1a            // black tailcoat
legColor: 0x6e6b66         // grey trousers
shoe: 0x141414
eyes: 'almond'
emI: 0
hands: 'box'
limbR: 0.92                // slighter, older build
```

**Accessories**
- **crown** — grey hair fringe: a thin, low, back-set band (not a full
  dome), ~120×28×120 mm, grey `0x9a968f`, positioned to leave the crown of
  the head bare — approximating a receding hairline (see Rig gaps).
- **face** — grey moustache: a small thin box, ~50×10×6 mm, `0x9a968f`,
  under the nose.
- **chest** — grey waistcoat panel: a proud flattened box,
  ~body-width−20×140×8 mm, `0x6e6b66`, centered on the torso over the black
  coat.
- **neck** — black bow tie: a small box, ~40×20×10 mm, `0x141414`.

**Silhouette check**: a black tailcoat with a visible grey waistcoat panel,
a thin grey moustache, and a receding grey hairline (no mask, cape, or prop
at all) is the pack's only plain formalwear silhouette — distinguished from
Gordon (the pack's other older, non-costumed member) by cut and color: black
tailcoat + bow tie vs. tan trench coat + badge.

**Personality**: `bobMul: 0.6, swayMul: 0.3, cadenceMul: 0.75, ampMul: 0.7`
(measured, dignified, unhurried — the household's calm, steady center)
**Bubbles**: `🫖🎩🧐📖` (tea service, propriety, quietly attentive, a book
kept close at hand)

---

### 5. `dc-batman/commissioner` — "The Commissioner (trench coat, badge)"

**Reference**: Gotham City's police commissioner and Batman's closest
lawful ally — a tan trench coat, a thick white/grey moustache, dark-framed
glasses, and a gold badge; the one who lights the bat-signal. (Commissioner
James Gordon.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0xd8b090
body: 0x6b5a45            // tan/brown trench coat
legColor: 0x3a3a3a          // dark grey trousers
shoe: 0x1c1c1c
eyes: 'almond'
emI: 0
hands: 'box'
limbR: 1.0
```

**Accessories**
- **crown** — white/grey hair cap, ~118×40×118 mm, `0xd8d4cc`.
- **face** — thick white/grey moustache, a box, ~55×14×8 mm, `0xd8d4cc`.
- **face** — dark-framed glasses: a thin flattened band across the eye
  line, ~90×16×6 mm, `0x1a1a1a` (approximates horn-rimmed glasses).
- **chest** — gold badge accent: a small disc, ~26×26×6 mm, `0xd4af37`,
  `emI: 0.1` (a color-block stand-in for a true shield/star badge shape —
  see Rig gaps, same gap the Avengers doc raised for Captain America's
  shield).

**Silhouette check**: a tan trench coat with a white moustache, dark
glasses, and a small gold chest badge is the pack's only trench-coated,
plainly-dressed ally — unmistakably apart from Alfred's black tailcoat and
from every costumed member's cape/cowl/mask.

**Personality**: `bobMul: 0.85, swayMul: 0.4, cadenceMul: 0.85, ampMul: 0.85`
(a weary, steady beat-cop trudge — dependable rather than flashy)
**Bubbles**: `🚨🕵️☎️☕` (the signal/siren, detective legwork, the direct
line to Batman, a late-night cup of coffee)

---

### 6. `dc-batman/clown-prince` — "Clown Prince (purple suit, green hair)"

**Reference**: Batman's chief nemesis — a chalk-white face, wide red grin,
green hair, and a purple tailcoat suit; theatrical, gleeful, and utterly
unpredictable. (The Joker.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xf2f2f2             // stark white face
body: 0x5b2a86             // purple tailcoat
legColor: 0x431f66          // purple trousers, a shade darker
shoe: 0x1c1030
eyes: 'almond'
emI: 0.05
hands: 'box'
limbR: 0.9                   // lean, lanky build
```

**Accessories**
- **crown** — green hair, swept back, ~130×60×130 mm, `0x2fae52`.
- **face** — wide red grin accent: a thin proud box across the mouth,
  ~55×10×5 mm, `0xcc1e2e` (emphasizing the rictus grin beyond the rig's
  default smile).
- **chest** — orange cravat accent: a small box at the collar,
  ~40×24×10 mm, `0xff8c1a`.
- **chest** — lapel boutonniere: a small sphere, ⌀20 mm, color `'tint'` (the
  classic acid-squirting gag flower — the pack's safe recolor point for
  this member, since the purple suit and green hair are canon-critical).

**Silhouette check**: a stark white face + green hair + purple tailcoat +
a slash of red grin is unlike any other member — the pack's only
white-skinned, green-haired figure.

**Personality**: `bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.2`
(loose-limbed, theatrical, unpredictably gleeful — the pack's most
exaggerated gait)
**Bubbles**: `🃏😂💜🎪` (playing card, cackling laugh, purple, circus/chaos
theatrics)

---

### 7. `dc-batman/harlequin` — "Harlequin (red/black diamond, jester)"

**Reference**: The Joker's devoted, acrobatic henchwoman-turned-antihero — a
red-and-black jester costume split diagonally in a diamond harlequin
pattern, a white ruffled collar, a two-pointed jester cap with pompoms, and
a black domino mask; playful and unpredictable. (Harley Quinn.)

**Spec**
```
sk: 0.95
headR: 120
headShape: 'sphere'
skin: 0xf2e0d5             // pale, lighter than the Joker's stark white
body: 0x161616               // base torso half
legColor: 0x161616
shoe: 0x161616
eyes: 'almond'
emI: 0
hands: 'box'
limbR: 0.85                   // lean, acrobatic build
limbColors: { armL: 0xcc1e2e, armR: 0x161616, legL: 0x161616, legR: 0xcc1e2e }
// diagonal red/black split across all four limbs — the "diamond harlequin"
// costume approximated via whole-limb color-blocking; see Rig gaps
```

**Accessories**
- **chest** — diamond patch accent: a proud box rotated 45° about Z
  (`rot: [0, 0, 0.785]`), ~70×70×8 mm, black `0x161616` (the opposite tone
  from the half of the torso it sits on), centered chest — approximating
  the diamond costume pattern per the established "patterns = a few proud
  boxes" convention.
- **neck** — white ruffled collar: a short, wide flattened cylinder ring,
  ~140×30×40 mm, `0xf2f2f2`, snug at the throat (the true fluted ruffle
  edge isn't representable — a plain flattened band approximates it).
- **crown** (×2, jester cap points) — tapered cones, one red `0xcc1e2e` one
  black `0x161616`, ~30×160×30 mm each, angled outward and back
  (`rot.x ≈ 0.35`, mirrored on `rot.z`) per the crown-clearance rule, each
  tipped with a small white pompom sphere, ⌀24 mm, `0xf2f2f2`.
- **face** — black domino mask: a thin band across the eyes, ~80×22×8 mm,
  `0x161616`.

**Silhouette check**: the two-pointed jester cap with white pompoms, paired
with diagonally split red/black limbs and a diamond chest patch, is
unmistakably "harlequin jester" — the only two-pointed hat and the only
diagonally split-limb costume in the pack.

**Personality**: `bobMul: 1.1, swayMul: 0.9, cadenceMul: 1.15, ampMul: 1.15`
(bouncy, springy, playfully unpredictable — cartwheel energy even at a walk)
**Bubbles**: `🔨💕🤪🎪` (mallet, puddin'-love, wild goofiness, carnival
chaos)

---

### 8. `dc-batman/cat-burglar` — "Cat Burglar (black catsuit, goggles)"

**Reference**: A skilled jewel thief and antiheroine with a feline theme —
a sleek all-black catsuit, small pointed cat ears, and a pair of goggle
lenses over the eyes; no powers, just agility and cunning. (Catwoman.)

**Spec**
```
sk: 0.95
headR: 120
headShape: 'sphere'
skin: 0x181818              // full black catsuit reads as "skin" — head fully covered
body: 0x181818
legColor: 0x181818
shoe: 0x0d0d0d
eyes: 'none'                 // goggles cover the eyes entirely (see accessories)
emI: 0.08                     // faint sheen, sleek catsuit material
hands: 'sphere'                // slim gloved hands
limbR: 0.82                     // lean, athletic build
```

**Accessories**
- **crown** (×2, cat ears) — small pointed cones, ~18×50×18 mm, black
  `0x181818` (a silhouette bump matching the suit, not a color break — same
  idiom the Avengers doc used for Black Panther's ears).
- **face** (×2, goggle lenses) — flattened spheres, ~40×40×14 mm each,
  offset ±26 mm for the two lenses, pale cyan-blue `0x9fd8f0`, `emI: 0.15`
  (a faint glassy glow reads better than true transparency on toon shading —
  the same idiom the LEGO spaceman's bubble helmet uses).
- **crown** — goggle strap: a thin band across the head behind the ears,
  ~130×14×10 mm, black `0x181818`.
- **hip** — gold belt: a thin band, color `'tint'` (the pack's safe recolor
  point for this member), ~body-width×24×14 mm.

**Silhouette check**: an all-black catsuit topped with small pointed ears
and a pair of pale-blue goggle lenses is the pack's sleekest, most minimal
silhouette — the only goggled member, and told apart from Batman/Batgirl's
full ear-cowls by the bare goggled face and lack of a cape.

**Personality**: `bobMul: 0.75, swayMul: 0.9, cadenceMul: 1.1, ampMul: 0.85`
(a lean, prowling, hip-swaying cat-burglar strut)
**Bubbles**: `🐈‍⬛💎🥷😼` (black cat, jewel heist, stealth, a knowing smirk)

---

### 9. `dc-batman/penguin` — "The Penguin (short, top hat, monocle)"

**Reference**: A short, portly criminal mastermind styled as a Victorian
gentleman-villain — a black tailcoat, a tall black top hat, a monocle, and a
trick umbrella; waddles when he walks. (The Penguin / Oswald Cobblepot.)

**Spec**
```
sk: 0.88                    // short
headR: 130
headShape: 'sphere'
skin: 0xdfb9a0                // fair, ruddy-cheeked
body: 0x161616                 // black tailcoat
legColor: 0x161616
shoe: 0x141414
eyes: 'almond'
emI: 0
hands: 'box'
limbR: 1.35                     // portly/rotund read — the pack's widest limbs (see Rig gaps)
armL: 0.9
legL: 0.85                       // short-legged, low center of gravity
footMul: [1.2, 0.6, 1.15]
```

**Accessories**
- **crown** — top hat: a tall cylinder, ~150×220×150 mm, black `0x141414`
  (the classic comics color; a bright purple top hat is a known 1960s
  TV-series alt-look, noted here but not used as the primary spec), with a
  thin hatband, color `'tint'` (~150×20×8 mm) — the pack's safe recolor
  point for this member.
- **face** — monocle: a small flattened disc (approximating a lens, NOT a
  true open ring — see Rig gaps), ⌀36×36×6 mm, pale glassy white-blue
  `0xd8ecf5`, `emI: 0.1`, plus a thin gold rim disc just behind it (⌀40 mm,
  proud ~2 mm, `0xc9a227`) and a short dangling chain-cord to the chest (a
  thin cylinder, ~6×80×6 mm, `0xc9a227`).
- **neck** — black bow tie: a small box, ~40×22×10 mm, `0x141414`.
- **handL** (held prop, ×2 parts, umbrella) — handle: a thin cylinder,
  ~14×220×14 mm, black `0x141414`; canopy: a cone (point down, resting
  above the handle top), ~130×90 mm, black `0x141414`, with a thin gold
  ferrule tip (a small cone, ~10×20×10 mm, `0xc9a227`).

**Silhouette check**: a short, portly black-tailcoated figure topped by a
tall black top hat and a small round monocle glint, holding a closed
umbrella, is the pack's shortest and widest-built member — unmistakable
even as a blob silhouette, and the only one carrying an umbrella.

**Personality**: `bobMul: 1.2, swayMul: 1.3, cadenceMul: 0.7, ampMul: 0.75`
(a stout, side-to-side waddling shuffle — slow cadence, exaggerated sway)
**Bubbles**: `🐧☂️🎩🧐` (penguin, umbrella, top hat, monocled poise)

---

### 10. `dc-batman/riddler` — "The Riddler (green, bowler hat, cane)"

**Reference**: An obsessive, puzzle-loving criminal genius who can't resist
leaving clues to his own crimes — an all-green suit with purple accents, a
matching green bowler hat, and a cane; theatrical and self-satisfied. (The
Riddler / Edward Nygma.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0xd8b090
body: 0x1f9e4a              // bright green suit
legColor: 0x431f66            // purple trousers
shoe: 0x161616
eyes: 'almond'
emI: 0.05
hands: 'box'
limbR: 0.9
```

**Accessories**
- **crown** — green bowler hat: a flattened dome (~140×90×140 mm) plus a
  thin brim (~150×10×160 mm), `0x1f9e4a`, with a hatband, color `'tint'`
  (~150×18×8 mm) — the pack's safe recolor point for this member. No
  question-mark print anywhere on the hat or suit — see Rig gaps/the
  IP-safety no-decals rule.
- **chest** — purple bow tie: a small box, ~40×20×10 mm, `0x431f66`.
- **handR** (held prop, cane) — a straight cylinder, ~16×420×16 mm, gold
  `0xc9a227`, topped by a small round handle sphere, ⌀32 mm, black
  `0x161616` (a straight-rod approximation — no true rounded question-mark
  handle; see Rig gaps).

**Silhouette check**: an all-green suited figure topped by a matching green
bowler hat and holding a tall gold cane is unique in the pack — the only
green-suited member and the only bowler hat (vs. Penguin's tall black
topper or Batman's pointed cowl).

**Personality**: `bobMul: 1.0, swayMul: 0.75, cadenceMul: 1.1, ampMul: 0.95`
(a theatrical, self-satisfied strut — always performing for an audience)
**Bubbles**: `❓🟢🎩😏` (a riddle, green, a hat tip, smug confidence)

## Rig gaps

1. **No true insignia/badge/emblem primitive.** The Avengers doc already
   flagged this for Captain America's shield (approximated as three stacked
   concentric discs). This pack surfaces FOUR more instances of the same
   gap: Batman's and Batgirl's bat-oval chest emblem, Robin's "R" chest
   disc, and Commissioner Gordon's badge — all approximated as plain color
   discs with no actual silhouette/shape. Five total instances across two
   packs is a strong signal this should be prioritized: a genuine low-poly
   badge/star/shield-fan (or freeform-silhouette) primitive would sharpen
   every one of these.
2. **Eye-color overrides for visor/slit-family eye styles.** Batman's and
   Batgirl's cowls both want the existing `'slit'`/narrow eye-slit geometry
   in **white**, not the red glow the style is presumed to default to
   elsewhere (Black Panther in the Avengers doc wanted white/silver for the
   same reason; the Mandalorian doc raised it for a visor). This is now a
   third and fourth documented instance of the already-parked ROADMAP item
   "eye color overrides" — worth promoting to a simple optional-color param
   on the visor-family eye styles given how often it recurs.
3. **No ring/torus primitive.** Penguin's monocle and Catwoman's goggle
   lenses both want a true open ring/lens-rim shape and are instead
   approximated as solid flattened discs (a gold "rim" disc sitting proud
   behind a lens-colored disc, rather than an actual hollow ring). Not
   previously called out in `docs/ROADMAP.md` § avatar rig gaps' "Additional
   anchors" bucket — worth adding explicitly, since eyewear (monocles,
   glasses rims, goggles) is a recurring need across packs (Gordon's
   glasses in this same doc are a third, milder instance, approximated as a
   flat bar instead).
4. **No curved/bent held-prop geometry.** The Avengers doc flagged this for
   Hawkeye's recurve bow (approximated as a straight vertical rod). The
   Riddler's signature question-mark-handled cane is a second instance of
   the same gap — approximated here as a straight gold rod with a plain
   ball handle instead of the iconic curved/hooked cane silhouette.
5. **No torso-girth/build parameter.** The LEGO pack's doc flagged the lack
   of a trapezoid/wide-shoulder torso shape; this pack surfaces the same
   underlying gap from a different angle — the Penguin's short, portly,
   rotund build has no dedicated body-width/girth field to reach for. It's
   approximated here entirely through a bumped `limbR` (1.35, the widest in
   this pack), a reduced `legL`, and a lowered `sk`, which reads more
   "stocky/burly" than truly "round." A dedicated torso-scale or girth
   parameter, independent of limb thickness, would help this and any future
   rotund character read correctly.
6. **Fabric color-block/diamond patterns.** Already covered by the
   ROADMAP's parked "fabric patterns / prints / decals" item and the
   established "patterns = a few proud boxes" convention — Harley Quinn's
   harlequin diamond costume is this pack's instance, approximated via a
   diagonal `limbColors` split across all four limbs plus one proud
   diamond-oriented chest patch. Reads correctly at silhouette scale but
   can't reproduce the true scattered diamond print.
7. **Cape neck-attach (forward-compat note, not a gap).** See the Overview's
   cape-convention note — all three capes in this pack are specced against
   `anchor:'neck'`, anticipating a parallel fix to the shared cape recipe.
   If unimplemented, fall back to `anchor:'back'` with the existing
   outward-tilt convention; no other spec fields change.

None of the above blocked building this pack; all ten members are fully
expressible with the current rig via the workarounds described above.

## LEGO Batman (member for the existing `lego` pack)

One additional member for the shipped `lego` pack (`src/avatar-packs/lego.ts`,
path `video-games / lego`, documented in `docs/avatars/video-games/lego.md`)
— **not a new pack**, a member to append to the existing manifest (bumping
its count from 8 to 9 and its `version` on the next update, per the
authoring conventions). It matches that pack's shipped minifig base
conventions: blank yellow-skinned hands, stubby `legL: 0.7`, thin `limbR`,
`'dots'` eyes, and identity carried entirely by headwear/torso/accessory
bolt-ons rather than face or body-shape changes.

### `lego/batman` — "Caped Minifig (black/grey, cowl)"

**Reference**: The LEGO Batman minifigure — a fixture of LEGO's licensed DC
sets since 2006 and the star of its own spin-off theme and films — a black
batsuit torso over the standard minifig body, a separate cowl-with-ears
headpiece that REPLACES the pack's usual blank yellow head entirely (one of
the only minifig archetypes in this franchise that does), a small stiff cape,
and a yellow-belt accent at the waist. (Generic "LEGO Batman" minifig
archetype — no likeness, no printed bat-symbol, matching this doc's IP-safety
rule.)

**Spec**
```
sk: 1.0
headR: 128
headShape: 'cylinder'    // upgrade over the shared lego-pack default — see note below
limbR: 0.72
skin: 0x1c2030            // cowl reads as "skin" — full head coverage, dark navy-black
body: 0x161616             // black batsuit torso
legColor: 0x161616
shoe: 0x141414
eyes: 'dots'                 // kept from the pack's shared smiley-face convention
emI: 0
hands: 'box'
steel: false
armL: 1.0
legL: 0.7
footMul: [1.15, 0.55, 1.05]
```

**Note on `headShape`**: the shipped `lego` pack's shared base (authored
before `headShape:'cylinder'` existed in the rig) uses `'box'` for every
member, and its own Rig-gaps section calls that out as the pack's headline
finding ("a true `cylinder` `headShape` option... would make this entire
pack read correctly instead of 'blocky human'"). That gap has since been
resolved in the rig (`HumanoidFields.headShape` now includes `'cylinder'`,
implemented in `three-renderer.ts`). This member is specced to use it
directly — a cowled head reads better as a rounded cylinder than a LEGO
brick-box — while the pack's other 8 members stay on `'box'` unless a future
version bump revisits the whole pack's shared base (out of scope for this
single-member addition).

**Accessories**
- **crown** (×2, cowl ears) — small pointed cones, ~16×36×16 mm, matching
  cowl `0x1c2030`, raised and tilted back per the crown-clearance rule.
- **neck** — cape: `shape:'cape'`, anchor `neck` (see the main pack's
  cape-convention note above; fall back to `anchor:'back'` if that fix
  hasn't landed), a small/stiff-reading size appropriate to the minifig
  scale, `[90, 130, 100]`, black `0x101010`. (Real minifig capes are a rigid
  molded cloak piece, not flowing fabric — the pack's tiny scale already
  reads "stiff" with the same curved-sheet cape geometry other packs use for
  flowing capes; no extra flag needed.)
- **hip** — yellow utility belt band, ~body-width×22×10 mm, `0xf2c744`.
- **chest** — small yellow bat-oval accent, a flattened disc, proud ~2 mm,
  ~30×22×5 mm, `0xf2c744` (the same insignia-primitive color-block
  approximation as the main pack's Batman member — see Rig gaps above; no
  bat silhouette).

**Silhouette check**: the only member of the (soon-to-be) 9-figure LEGO pack
wearing a full cowl-with-ears headpiece instead of the shared blank yellow
head — combined with the black suit, tiny cape, and yellow belt accent, this
reads instantly as "Minifig Batman" even blob-simplified, and stands apart
from every other LEGO member specifically BECAUSE it breaks the pack's own
"never recolor or reshape the head" convention (that swapped headpiece is
the entire joke of a LEGO Batman figure).

**Personality**: `bobMul: 0.8, swayMul: 0.45, cadenceMul: 0.95, ampMul: 0.85`
(a stiff, blocky-toy version of the main pack's controlled glide — minifig
proportions damp any exaggeration)
**Bubbles**: `🦇🧱😎🌃` (bat, a LEGO-brick wink, smug one-liner confidence,
night city) — the classic deadpan "I'm Batman" note.

This member reuses `dc-batman`'s cape-neck-attach assumption and
insignia-primitive gap (see the main Rig gaps section above); it adds
nothing new beyond confirming that the `lego` pack's own long-parked
`headShape:'cylinder'` gap is now closeable for a future full-pack revision.

## Sources

- [Batsuit — Wikipedia](https://en.wikipedia.org/wiki/Batsuit)
- [Every Single Batman Suit & Costume, In Chronological Order — CBR](https://www.cbr.com/every-batman-suit-costume-chronological-order/)
- [Batsuit — Batman: The Animated Series Wiki, Fandom](https://batmantheanimatedseries.fandom.com/wiki/Batsuit)
- [Armor, cape and cowl: The history and evolution of Batman's suit — SYFY](https://www.syfy.com/syfy-wire/armor-cape-and-cowl-the-history-and-evolution-of-batmans-suit)
- [Dick Grayson's 10 Best Costumes, From Robin To Nightwing — CBR](https://www.cbr.com/dick-grayson-best-costumes-robin-nightwing/)
- [The Evolution of Robin's Costumes Through History — LiveAbout](https://www.liveabout.com/the-evolution-of-robins-costumes-through-history-3955267)
- [Robin (character) — Wikipedia](https://en.wikipedia.org/wiki/Robin_(character))
- [All of Batgirl's Costumes, Ranked — Nerdist](https://nerdist.com/article/all-of-batgirls-costumes-ranked/)
- [Batgirl Cosplay Shows Off Bold New Suit Evolution DC Needs to Use — ScreenRant](https://screenrant.com/batgirl-barbara-gordon-purple-yellow-gold-costume-cosplay/)
- [The ever-changing Batgirl costume — Barbara Gordon — Comic Vine](https://comicvine.gamespot.com/barbara-gordon/4005-5368/forums/the-ever-changing-batgirl-costume-671892/)
- [Alfred Pennyworth — Wikipedia](https://en.wikipedia.org/wiki/Alfred_Pennyworth)
- [Alfred Pennyworth — Batman Wiki, Fandom](https://batman.fandom.com/wiki/Alfred_Pennyworth)
- [James Gordon (character) — Wikipedia](https://en.wikipedia.org/wiki/Jim_Gordon_(character))
- [Commissioner Gordon Costume Guide — Carbon Costume](https://carboncostume.com/commissioner-gordon/)
- [James Gordon — DC Animated Universe Wiki, Fandom](https://dcau.fandom.com/wiki/James_Gordon)
- [The Joker Costume: Ultimate Guide to Bold Style — OppoSuits](https://opposuits.com/blogs/opposuits/the-joker-costume)
- [Joker: Why the Batman Villain Wears Purple Suits — CBR](https://www.cbr.com/why-joker-wears-purple-suits/)
- [Harley Quinn Classic Jester Costume — The Costume Shoppe](https://thecostumeshoppe.com/harley-quinn-classic-jester-costume/)
- [How to Cosplay Harley Quinn: Complete Costume Guide — EyeCandys](https://eyecandys.com/blogs/news/harley-quinn-costume)
- [Nine Lives: A look back at Catwoman's costumes through the ages — Sideshow Collectibles](https://www.sideshow.com/blog/catwoman-through-the-ages)
- [The TOP 13 CATWOMAN COSTUMES Ever — RANKED — 13th Dimension](https://13thdimension.com/the-top-13-catwoman-costumes-ever-ranked/)
- [Penguin (character) — Wikipedia](https://en.wikipedia.org/wiki/Penguin_(character))
- [Action Figure Review: The Penguin (DC Classic) — Action Figure Barbecue](http://www.actionfigurebarbecue.com/2024/08/action-figure-review-penguin-dc-classic.html)
- [Jim Carrey "Riddler" costume with green bowler hat and gold cane — Heritage Auctions](https://entertainment.ha.com/itm/movie-tv-memorabilia/jim-carrey-riddler-costume-with-green-bowler-hat-and-gold-cane-from-batman-forever/a/997027-2652.s)
- [Riddler: How the Batman Villain's Suit Has Evolved — CBR](https://www.cbr.com/riddler-suit-evolution/)
- [The Riddler — Brickipedia, Fandom](https://brickipedia.fandom.com/wiki/The_Riddler)
- `docs/avatars/sci-fi/marvel-avengers.md` (this repo) — the superhero-pack
  doc structure, descriptive-label convention, and rig-gap cross-referencing
  this doc follows directly.
- `docs/avatars/video-games/lego.md` (this repo) — the minifig base
  conventions the LEGO Batman member section builds on.
