# Avatar pack: Pop-Culture ▸ TV ▸ Money Heist

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no printed text, no character names anywhere in-scene; identity lives only in
this doc's Reference lines and the pack's display labels (which use
descriptive-generic wording, e.g. "Robber (curly hair, gold hoops)").

## Overview

- **Group**: the core heist crew and the two "civilian" figures who anchor
  their story, from the Spanish Netflix heist thriller *La Casa de Papel*
  ("Money Heist," 2017–2021) — a gang of thieves who take code names from
  world cities and wear identical red jumpsuits and masks so no individual
  identity is visible during a job.
- **Hierarchy path**: `Pop Culture ▸ TV Shows ▸ Money Heist`
- **Member count**: 8
- **Rig**: humanoid only (no quadrupeds in this pack)
- **Design call — unmasked identity, not the anonymizing mask**: the show's
  whole visual hook is that, on the job, every robber is DELIBERATELY
  indistinguishable — same red boiler-suit, same plastic mask of the
  surrealist painter Salvador Dalí, no individual silhouette at all. That is
  the opposite of what an avatar pack needs (every member must pass the
  silhouette test), so this pack follows the same imagery the show's own
  cast portraits and posters use off-duty: jumpsuit on, **hood down, mask
  off**, face and hair visible. This doc deliberately does NOT attempt a
  rendered version of the Dalí mask itself — beyond the usual "no likeness"
  rule, that mask is a stylized likeness of a real historical person
  (Salvador Dalí), which this project avoids categorically regardless of
  fictional framing. Hair, build, and a few costume tells (Denver's
  tied-off sleeves, Berlin's open collar and vest, the Professor's suit
  instead of a jumpsuit) do all the identity work instead.
- **Shared style/palette — "six identical red jumpsuits vs. two civilian
  looks"**: six members (the on-site heist crew) share one **fixed jumpsuit
  red** body/leg color and the same two small shared accessories (see
  recipe below) — their hair and build are the ONLY differentiator, which
  mirrors the show's own visual joke and doubles as a strong silhouette
  test in its own right (if two of these six ever look alike at 30 px, the
  hair shape has failed and needs to change, not the palette). The other
  two members — the gang's off-site mastermind and the police inspector who
  hunts them — are dressed in their own far more iconic, non-jumpsuit looks
  (a rumpled grey suit; a dark police blazer), because that is the image a
  casual viewer actually recalls first for those two characters. This
  two-tier split is the same design move the `tv/it-crowd` doc made
  ("beige basement vs. glass boardroom") for a different reason: there, the
  palette split *was* the joke; here, the palette split *is* the show's
  premise (interchangeable crew vs. two people the story is actually about).
- **Shared jumpsuit recipe** (the six crew members only): `body` and
  `legColor` both the same fixed **jumpsuit red** `0xc1272d` (a one-piece
  coverall — matching torso and leg tones IS the coverall, no new primitive
  needed), `shoe: 0x161616` (black work boots). Two shared accessories on
  top of the base coverall: a **back** accessory for the folded-down hood
  (a soft flattened dome, `~90×70×30mm`, same `0xc1272d`, sitting low on the
  shoulders/upper back) and a **chest** accessory for the front zipper (a
  thin dark box running center-chest, `~16×190×6mm`, `0x2a2a2a`). Members
  who deviate from this recipe (Denver) say so explicitly in their entry.
- **Member-selection notes**: the 8 below are the cast a casual (non-binge-
  wiki) viewer names first — the two leads (the Professor as mastermind/
  narrator anchor, present in nearly every promotional image) plus the five
  heist-crew members with the most screen time and individually distinct
  looks, plus the police inspector who is the male lead's love interest and
  a main character in her own right from season 1. Deliberately **omitted**:
  Helsinki and Oslo (the two Serbian muscle characters) — narratively
  important but visually near-identical to each other AND to Moscow (all
  three read as "big bearded crew member in a red jumpsuit"; a fourth
  overlapping silhouette in the same 6-person jumpsuit block would fail the
  silhouette test rather than pass it); Arturo Román (a hostage/antagonist,
  not gang); Alicia Sierra, Marseille, Palermo, Bogotá, and Manila (all
  introduced from Part 3 onward — later-arriving, more niche to viewers who
  didn't finish the show).

## Members

### 1. `heist-mastermind` — "Mastermind (grey suit, round glasses)"

**Reference**: The reclusive genius who plans and directs the entire heist
from outside the building, rarely present in a jumpsuit himself. Canonical
look: a rumpled grey/tweed suit with an overcoat and tie, curly dark brown
hair, a full beard, and distinctive round dark-framed glasses he's
constantly pushing back up his nose. (The Professor / Sergio Marquina,
played by Álvaro Morte.)

**Spec**
```
sk: 1.05
headR: 128
headShape: 'sphere'
skin: 0xd9a878
body: 0x585858       // grey suit jacket
legColor: 0x3f3f3f   // darker grey trousers
shoe: 0x141414
eyes: 'dots'
emI: 0
limbR: 0.85
armL: 1.0
legL: 1.02
```

**Accessories**
- **face** — round dark-framed glasses: two flat lens boxes,
  `~HEAD_R*0.4 × HEAD_R*0.3 × 6mm`, `0x141414`, with a thin bridge box
  (`~HEAD_R*0.12 × 6mm × 5mm`) — REQUIRED, he's essentially never shown
  without them.
- **crown** — dark brown curly hair, a full rounded dome with an uneven,
  slightly tousled top surface, `~132×64×132mm`, `0x2b1d14`.
- **face** — a full beard: a wide flattened wedge covering the jaw/chin,
  `~90×50×30mm`, `0x2b1d14`, plus a thin moustache box under the nose
  (`~46×12×5mm`, same color).
- **chest** — white shirt collar wedge (`~70×20×6mm`, `0xf0ede4`) with a
  narrow maroon tie running down the center chest (`~34×140×8mm`,
  `0x6d1f24`).
- **back** — the overcoat's drape: a flattened, gently curved cone
  hanging from the shoulders, `~140×220×40mm`, same `0x585858` as the suit,
  a shade darker at the hem — the "recipes" cape approximation, here doing
  double duty as an overcoat rather than a cloak.

**Silhouette check**: round glasses + full dark beard + a grey suit-and-
overcoat silhouette is the ONE member here in structured formal wear rather
than a red jumpsuit or a police blazer — an instantly distinct read against
all seven other members, exactly the "man who never goes inside" the story
wants him to be.

**Personality**: `bobMul: 0.75, swayMul: 0.6, cadenceMul: 0.85, ampMul: 0.7`
(measured, deliberate, faintly professorial — a man who thinks several
moves ahead of his own footsteps)
**Bubbles**: `📋🧠♟️😌` (meticulous planning, constant strategizing, chess-
like foresight, an unshakeable calm)

---

### 2. `reckless-getaway` — "Robber (dark bob, red jumpsuit)"

**Reference**: The impulsive, adrenaline-chasing member of the crew and the
story's narrator — a former small-time criminal recruited as the
mastermind's most trusted (if most reckless) operative. Canonical look: a
dark brown blunt bob with a straight-cut fringe, worn under the red heist
jumpsuit. (Tokyo / Silene Oliveira, played by Úrsula Corberó.)

**Spec**
```
sk: 0.95
headR: 122
headShape: 'sphere'
skin: 0xe0b48c
body: 0xc1272d       // shared jumpsuit red
legColor: 0xc1272d
shoe: 0x161616
eyes: 'dots'
emI: 0
limbR: 0.85
```

**Accessories**
- **back** — folded-down hood (shared recipe).
- **chest** — front zipper stripe (shared recipe).
- **crown** — dark brown blunt bob: a flattened dome cut sharply at
  chin-height, `~128×58×128mm`, `0x2b1c14`, with a straight fringe ridge
  box low over the brow (`~90×16×14mm`, same color) — the fringe is cut
  level, not angled, to read as the character's signature blunt line.

**Silhouette check**: the sharp, level fringe against a dark blunt bob is
immediately readable even at 30 px — the crew's most recognizable haircut,
deliberately blunter/straighter than every other member's hair in the pack.

**Personality**: `bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.1`
(quick, restless, live-wire energy — the pack's most kinetic gait)
**Bubbles**: `💥🔥😏💣` (an appetite for danger, a running internal
narration, a cocky smirk, barely-restrained recklessness)

---

### 3. `suave-strategist` — "Robber (slicked hair, open collar, vest)"

**Reference**: The gang's most refined and theatrical member — charming,
manipulative, and openly self-mythologizing, with a terminal illness he
treats as one more reason to be dramatic about everything. Canonical look:
short, neatly combed dark brown hair, an elegant bearing even in a boiler
suit, often shown with the jumpsuit worn open at the collar over a
waistcoat or shirt rather than zipped to the neck. (Berlin / Andrés de
Fonollosa, played by Pedro Alonso.)

**Spec**
```
sk: 1.02
headR: 124
headShape: 'sphere'
skin: 0xe8c2a0
body: 0xc1272d       // shared jumpsuit red (worn open, see chest accessory)
legColor: 0xc1272d
shoe: 0x161616
eyes: 'dots'
emI: 0
limbR: 0.85
```

**Accessories**
- **back** — folded-down hood (shared recipe).
- **crown** — short, neatly combed dark brown hair, a tight low dome
  hugging the scalp, `~124×34×124mm`, `0x2a1c14`, with a faint emissive
  `0.05` for a groomed, slightly glossy finish (deliberately echoing the
  `founder-boss`-style "styled hair sheen" recipe from `tv/it-crowd`, since
  both characters share a vain, put-together self-image).
- **chest** — the open-collar look, REPLACING the shared zipper stripe: a
  black waistcoat V-wedge (`~TORSO_W*0.5 × TORSO_H*0.6 × 10mm`, `0x161616`)
  proud of the red jumpsuit at the shoulders/sides, with a small cream
  shirt-collar wedge peeking above it (`~50×16×6mm`, `0xede9e0`).

**Silhouette check**: the black waistcoat-V breaking up the solid red
jumpsuit — the only crew member whose torso ISN'T a flat block of jumpsuit
red — reads instantly as "the elegant one," which is exactly the character
point (he never quite looks like he's dressed for manual labor).

**Personality**: `bobMul: 1.1, swayMul: 1.2, cadenceMul: 0.95, ampMul: 1.05`
(a theatrical, unhurried strut — a man who treats every entrance like a
stage cue)
**Bubbles**: `🎭🍷😏🎶` (theatrical grandiosity, a taste for wine and
luxury, a knowing smirk, opera/classical music playing in his head)

---

### 4. `crew-forewoman` — "Robber (curly hair, gold hoops)"

**Reference**: The crew's quality-control lead — warm, fiercely protective
of the group, and the most level-headed peacemaker among a team of big
egos. Canonical look: dark, shoulder-length wavy/curly hair, tan skin, and
a bold personal style capped by large gold hoop earrings she's rarely
without. (Nairobi / Ágata Jiménez, played by Alba Flores.)

**Spec**
```
sk: 0.95
headR: 120
headShape: 'sphere'
skin: 0xb97a52
body: 0xc1272d       // shared jumpsuit red
legColor: 0xc1272d
shoe: 0x161616
eyes: 'dots'
emI: 0
limbR: 0.85
```

**Accessories**
- **back** — folded-down hood (shared recipe).
- **chest** — front zipper stripe (shared recipe).
- **crown** — dark wavy shoulder-length hair, a large flattened dome plus
  two side-lobes falling past the ears, `~140×80×136mm` main dome + `~40×
  90×30mm` side lobes, `0x1c130c`.
- **head** — gold hoop earrings: two small tori, `~18mm` radius, `0xd4af37`,
  offset `±HEAD_R*0.85` at ear height — a generic hoop shape, not a
  reproduction of any specific jewelry design.

**Silhouette check**: full dark wavy hair framing the face plus a pair of
bright gold hoops against the same red jumpsuit as three other members —
the hoops are the tie-breaker accessory that keeps her read distinct at a
glance, doing exactly the job the silhouette test asks of a single prop.

**Personality**: `bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 0.95`
(warm, grounded, purposeful — steady rather than showy, a natural den-
mother energy even mid-stride)
**Bubbles**: `💰❤️😆💪` (pride in a job done right, warmth toward the
crew, an easy laugh, hard-won toughness)

---

### 5. `young-hacker` — "Robber (young, tousled curly hair)"

**Reference**: The youngest member of the crew, a gifted young hacker whose
technical skill belies his age and inexperience. Canonical look: a slight,
youthful build and a mop of tousled brown wavy/curly hair, worn noticeably
less groomed than any of the older crew members. (Rio / Aníbal Cortés,
played by Miguel Herrán.)

**Spec**
```
sk: 0.9
headR: 116
headShape: 'sphere'
skin: 0xe0b48c
body: 0xc1272d       // shared jumpsuit red
legColor: 0xc1272d
shoe: 0x161616
eyes: 'dots'
emI: 0
limbR: 0.78
armL: 0.95
legL: 0.95
```

**Accessories**
- **back** — folded-down hood (shared recipe).
- **chest** — front zipper stripe (shared recipe).
- **crown** — tousled brown curly/wavy hair, an irregular flattened dome
  with several small uneven high points, `~116×50×116mm`, `0x4a2f1c` — the
  pack's second-messiest hair (after the mastermind's), but noticeably
  smaller/younger in overall head-to-body proportion than every other crew
  member.

**Silhouette check**: the smallest overall build in the pack plus a loose
mop of curls reads as "the kid of the group" at a glance — the youth cue is
carried entirely by scale and hair since the jumpsuit is otherwise
identical to four other members.

**Personality**: `bobMul: 1.1, swayMul: 0.95, cadenceMul: 1.15, ampMul: 1.0`
(quick, slightly nervous energy, a younger and lighter step than his
crewmates)
**Bubbles**: `💻❤️😅🎧` (hacking/tech instincts, an anxious crush, nervous
laughter, headphones/music)

---

### 6. `hotheaded-brawler` — "Robber (tank top, jumpsuit tied at waist)"

**Reference**: A hot-tempered, impulsive, athletically built member of the
crew who frequently works with his jumpsuit top peeled down and knotted
around his waist, leaving a plain tank top visible. Canonical look: short
black curly hair, a muscular build, and a square jaw. (Denver / Ricardo
Ramos, played by Jaime Lorente.)

**Spec**
```
sk: 1.05
headR: 124
headShape: 'sphere'
skin: 0xcf9a68
body: 0xe6e2d8       // plain tank top (jumpsuit top worn down, see hip accessory)
legColor: 0xc1272d   // jumpsuit legs, still worn
shoe: 0x161616
eyes: 'dots'
emI: 0
limbR: 1.1
```

**Accessories**
- **crown** — short black curly hair, a tight uneven dome, `~124×36×
  124mm`, `0x15100c`.
- **hip** — the jumpsuit's unzipped top half, knotted around the waist: a
  twisted cylinder band, `~100×46×46mm`, `0xc1272d`, sitting proud of the
  tank top at the beltline — this REPLACES the shared back-hood + chest-
  zip accessories for this member (the hood is bundled into this knot,
  not worn up), which is the deliberate visual break from the other five
  crew members and this member's whole silhouette point.

**Silhouette check**: a plain light tank top against dark curly hair and a
visibly muscular build, with only the tied-off red bundle at the hip
hinting at the jumpsuit underneath — the ONE crew member NOT reading as a
flat block of jumpsuit red, which (same trick as `suave-strategist`, for a
very different reason — restless energy rather than elegance) keeps him
from blending into the other five.

**Personality**: `bobMul: 1.2, swayMul: 1.15, cadenceMul: 1.1, ampMul: 1.15`
(a loose, energetic, slightly cocky swagger — quick to laugh, quicker to
throw a punch)
**Bubbles**: `😂🥊😬💪` (loud laughter, impulsive scuffles, awkward
blunders, physical confidence)

---

### 7. `veteran-digger` — "Robber (grey beard, stout build)"

**Reference**: The oldest member of the crew and its excavation specialist,
a gentle, fatherly veteran robber recruited alongside — and deeply
protective of — his own adult son, also part of the crew. Canonical look: a
stout, sturdy build, a greying beard, and thinning grey hair. (Moscow /
Agustín Ramos, played by Paco Tous.)

**Spec**
```
sk: 1.08
headR: 128
headShape: 'sphere'
skin: 0xc99566
body: 0xc1272d       // shared jumpsuit red
legColor: 0xc1272d
shoe: 0x161616
eyes: 'dots'
emI: 0
limbR: 1.2
```

**Accessories**
- **back** — folded-down hood (shared recipe).
- **chest** — front zipper stripe (shared recipe).
- **head** — thinning grey hair, two low side lobes rather than a full
  crown (bald on top), `~50×34×46mm` each, `0x9c9690`, sitting just above
  the ears.
- **face** — a full grey beard: a wide flattened wedge covering the jaw,
  `~94×54×32mm`, `0x9c9690`.

**Silhouette check**: a stout, wide-bodied build plus a grey beard and bald
crown is the pack's clearest "gentle older tradesman" read — the widest
`limbR` in the pack backs up the "stoutly built" reference directly.

**Personality**: `bobMul: 0.85, swayMul: 0.75, cadenceMul: 0.85, ampMul: 0.8`
(a slow, sturdy, unhurried gait — patient physical labor rather than
urgency)
**Bubbles**: `⛏️👨‍👦😌🛠️` (digging/tunneling work, quiet fatherly pride,
calm patience, practical handiness)

---

### 8. `police-negotiator` — "Police inspector (dark blazer, badge)"

**Reference**: The police inspector who leads the on-scene investigation
and negotiation during the heist, and who — after falling for the
mastermind under a false name — eventually abandons her career to join the
gang under her own city code name. Canonical look: professional plainclothes
police attire (a dark blazer or trench coat over a blouse), a badge, and
wavy chestnut-brown hair worn at shoulder length. (Raquel Murillo / later
"Lisbon," played by Itziar Ituño.)

**Spec**
```
sk: 0.92
headR: 118
headShape: 'sphere'
skin: 0xe8c2a0
body: 0x2a2e38       // dark navy-charcoal blazer
legColor: 0x24262c   // charcoal trousers
shoe: 0x161616
eyes: 'dots'
emI: 0
limbR: 0.85
armL: 0.92
legL: 0.94
```

**Accessories**
- **crown** — wavy chestnut-brown hair at shoulder length, a flattened
  sphere-cap with a slight forward wave, `~130×60×130mm`, `0x6b4226`.
- **chest** — a white blouse collar wedge (`~64×20×6mm`, `0xf0ede4`) peeking
  above the blazer's lapel line, plus a small dark lapel panel proud of the
  `body` blazer color (`~TORSO_W*0.55 × TORSO_H*0.7 × 8mm`, `0x1e2027`).
- **hip** — a slim black duty belt, thin box band, `0x141414`.

**Silhouette check**: dark tailored blazer + wavy chestnut hair at shoulder
length is the pack's only "law enforcement professional" read, immediately
distinct from both the mastermind's grey suit-and-overcoat and all six red
jumpsuits — the visual anchor for "the person hunting this crew," which is
exactly her narrative role for the first half of the story.

**Personality**: `bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.05, ampMul: 1.0`
(brisk, composed, purposeful — a professional's stride carrying visible
inner conflict)
**Bubbles**: `🚔❤️🤔📋` (police duty, a conflicted romance, second-guessing
tough calls, case files and procedure)

## Rig gaps

1. **No dedicated jacket/coat-over-shirt "layered torso" anchor.** Both
   non-jumpsuit members in this pack (`heist-mastermind`'s overcoat over a
   suit, `police-negotiator`'s blazer over a blouse) approximate the layered
   look as a proud chest/back panel bolted over the `body` base color —
   the same approximation already flagged by `sci-fi/star-trek-tng` (uniform
   yoke), `tv/big-bang-theory` (turtleneck/collar variety), and
   `tv/it-crowd` (three separate neckline reads). This is now a FOURTH
   independent pack hitting the same wall; a generalized `collar`/`lapel`
   anchor (a band or panel that reads naturally as an outer layer over the
   torso, distinct from a single flat `chest` patch) would serve all four
   packs and any future suit/coat/uniform pack.
2. **No "tied around the waist" sleeves-as-garment convenience.** Denver's
   signature look (jumpsuit top peeled down, arms knotted at the hip) is
   expressible today with a single twisted cylinder at the `hip` anchor
   (used above), but it's a hand-tuned one-off, not a real primitive for
   "garment worn off-body." Flagged as a convenience note only (like prior
   docs' "no X helper, but works with existing pieces" notes), not a
   blocking gap.
3. **No `ear` anchor.** Nairobi's gold hoop earrings are approximated as
   small tori positioned off the `head` anchor with a manual horizontal
   offset — works fine visually, but a dedicated `earL`/`earR` anchor pair
   would make earring/ear-jewelry accessories (a recurring "one signature
   prop" idiom across packs) less fiddly to place consistently.

None of the above blocked shipping this pack — all eight members are fully
expressible with the current rig via the workarounds above.

## Sources

- [Money Heist — Wikipedia](https://en.wikipedia.org/wiki/Money_Heist)
- [Money Heist: Why They Really Wear Salvador Dalí Masks & Red Jumpsuits — ScreenRant](https://screenrant.com/money-heist-salvador-dali-mask-red-jumpsuit-explained-2/)
- [Robbers and Hostages Costume Guide (La Casa de Papel) — costumediyguide.com](https://costumediyguide.com/robbers-hostages-casa-papel-money-heist-cosplay)
- [Professor (Money Heist) — Wikipedia](https://en.wikipedia.org/wiki/Professor_(Money_Heist))
- [The Professor | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/The_Professor)
- [Money Heist and the Professor's Glasses — Specscart](https://specscart.co.uk/blog/money-heist)
- [The glasses of The Professor in Money Heist — Ottica Mauro](https://www.otticamauro.biz/en/blog/news/the-glasses-of-the-professor-in-money-heist)
- [Tokyo | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/Tokyo)
- [Did You Know? Ursula Corbero Almost Didn't Wear Her Iconic Hairstyles in "Money Heist" — Preview.ph](https://www.preview.ph/beauty/ursula-corbero-money-heist-tokyo-hair-story-a00193-20210903)
- [Berlin (Money Heist) — Wikipedia](https://en.wikipedia.org/wiki/Berlin_(Money_Heist))
- [Berlin | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/Berlin)
- [Who Is In Money Heist's Berlin? Cast & Character Guide — ScreenRant](https://screenrant.com/money-heist-berlin-cast-character-guide-pedro-alonso/)
- [Nairobi (Money Heist) — Wikipedia](https://en.wikipedia.org/wiki/Nairobi_(Money_Heist))
- [Nairobi | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/Nairobi)
- [Nairobi Costume Guide — Costume Realm](https://www.costumerealm.com/nairobi-outfits/)
- [Rio | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/Rio)
- [Miguel Herrán | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/Miguel_Herr%C3%A1n)
- [Denver | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/Denver)
- [Jaime Lorente | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/Jaime_Lorente)
- [Moscow | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/Moscow)
- [Paco Tous | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/Paco_Tous)
- [Money Heist Character Guide: Every Robber's Real Name & Backstory — ScreenRant](https://screenrant.com/money-heist-characters-robbers-real-names-backstory/)
- [Raquel Murillo — Wikipedia](https://en.wikipedia.org/wiki/Raquel_Murillo)
- [Raquel Murillo | Money Heist Wiki (Fandom)](https://money-heist.fandom.com/wiki/Raquel_Murillo)
- Diorama source reference (existing rig conventions, anchors, tie/collar/
  overcoat and moustache accessory recipes, `SPECS` table, per-kind
  accessory recipes): `src/three-renderer.ts` (`_buildHumanoid`,
  `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`); prior pack docs
  `docs/avatars/sci-fi/star-trek-tng.md`,
  `docs/avatars/pop-culture/tv-big-bang-theory.md`, and
  `docs/avatars/pop-culture/tv-it-crowd.md` for anchor/recipe precedent and
  the shared collar/layered-torso running gap.
