# Avatar pack: Pop-Culture ▸ TV ▸ Squid Game

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color/proportions read as the character archetype, not a likeness.
No logos, no printed text/numbers, no character names anywhere in-scene;
identity lives only in this doc's Reference lines and the pack's display
labels (which use descriptive-generic wording, e.g. "Frail Elder (green
tracksuit, stooped)").

## Overview

- **Group**: The primary player ensemble + antagonist apparatus of *Squid
  Game* (2021– ), Hwang Dong-hyuk's Korean survival-drama about 456
  debt-ridden contestants competing in deadly children's games for a cash
  prize, overseen by masked pink-clad guards and a black-masked "Front Man"
  reporting to unseen VIPs. Uncommonly for a live-action pack, the source
  material's OWN visual language is already geometric — pink guard masks are
  literally stamped with a circle/triangle/square rank system, and the
  Front Man's mask is an angular faceted plate — so this pack's "color +
  silhouette only" house style is an unusually close match to the source
  rather than a simplification of it.
- **Hierarchy path**: `Pop Culture / TV Shows / Squid Game`
- **Member count**: 9
- **Rig**: humanoid only (no quadrupeds in the primary cast)
- **Design call — fixed costume colors, not sensor-tint carriers**: like
  `pop-culture/tv/friends`, `tv/seinfeld`, and `tv/big-bang-theory`, this is a
  named-character/named-uniform homage, not a generic archetype pack — the
  teal-green tracksuit, bubblegum-pink guard jumpsuit, and all-black Front
  Man coat are load-bearing identity colors that a sensor-tint override would
  wash out. `body`/`legColor`/`shoe` are FIXED hex per member. The one
  exception is the **Nameless Player** (see member 9), whose entire reason
  for existing is to be the pack's recolorable crowd-filler entry — it keeps
  a genuine `'tint'` chest patch so per-sensor color coding has somewhere to
  land in this pack if a deployment wants it.
- **Shared palette note — one uniform, three factions**: the six ordinary-
  player members (Gi-hun, Sae-byeok, Sang-woo, Il-nam, Mi-nyeo, Ali, and the
  Nameless Player — seven total) all wear the **identical** teal-green
  tracksuit (`body`/`legColor` `0x1d6b52`, off-white slip-on sneakers
  `0xf0ece0`) — matching the source, where the games' whole visual joke is
  that 456 identically-dressed strangers are only distinguishable by hair,
  build, and small props. The guard faction (Pink Guard) is bubblegum pink
  + black; the command faction (Front Man) is all black. **Because seven
  members share one exact uniform, this pack leans harder on hair-shape
  and prop variety than any prior TV pack** — see each member's Silhouette
  check.
- **Pack-wide `base` proposal** (for the data-module author): a shared
  `humanoid: { body: 0x1d6b52, legColor: 0x1d6b52, shoe: 0xf0ece0, emI: 0,
  hands: 'sphere' }` under the seven tracksuit-wearing members, with `skin`,
  `sk`, `headR`, `eyes`, and all hair/prop accessories overridden per member
  (mirrors the `tmnt.ts` shared-turtle-body pattern — same body, different
  mask/weapon). The Front Man and Pink Guard fully override `body`/`legColor`
  and are not part of this `base`.
- **Member-selection notes**: the survey's suggested nine (Seong Gi-hun, The
  Front Man, Kang Sae-byeok, Cho Sang-woo, Oh Il-nam, Han Mi-nyeo, Ali Abdul,
  Pink Guard, Green Tracksuit Player) all check out as primary-cast-or-
  iconic-apparatus and are kept as-is — this is exactly a 9-member pack, at
  the top of the healthy range but under the ~12 ceiling. Notable omissions
  considered and cut:
  - **Jang Deok-su** (gangster antagonist) — a strong season-1 presence, but
    his "menacing tough guy" read would sit too close to Sang-woo's
    "calculating strategist" niche once both are reduced to green-tracksuit
    silhouettes with no build differentiator strong enough to separate them
    at 30 px; cut to keep the roster non-redundant.
  - **VIPs** (masked wealthy spectators) — visually rich (animal-head
    masks, gold), but a season-1-only cameo device, not part of the game
    ensemble, and their mask motif is already represented by the Front Man's
    faceted plate; would need a whole separate sub-pack to do justice to the
    animal-mask variety, which is out of scope here.
  - **Hwang Jun-ho** (the detective / Front Man's brother) — a subplot
    investigator who spends the season in a stolen guard uniform, not a
    game participant; omitted as a secondary character, not primary cast.
  - **No-eul** (season 2–3 guard-turned-ally) — omitted to keep this pack
    scoped to the season-1 primary cast the survey centered on; a season
    2/3-focused follow-up pack could pick her up alongside Player 246/Jun-hee
    etc. if ever warranted.
  - One-episode/background players (the glassmaker, the singer, etc.) —
    omitted per the primary-cast rule; none has a signature enough look to
    clear the silhouette bar without borrowing another member's hair/prop.

## Members

### 1. `protagonist-gihun` — "Debt-Ridden Gambler (green tracksuit, receding hairline)"

**Reference**: The protagonist, a chauffeur and compulsive horse-race
gambler crushed by debt who enters the games as Player 456 and ultimately
wins. Established as a gambler in the show's opening minutes (a betting
slip he can't cash), and drawn as a rumpled, thinning-haired, unremarkable
middle-aged everyman — deliberately the "nobody" the audience follows into
an extraordinary situation. (Seong Gi-hun.)

**Spec**
```
sk: 1.02
headR: 128
headShape: 'sphere'
skin: 0xe0b48e
body: 0x1d6b52       // teal-green tracksuit jacket
legColor: 0x1d6b52    // matching tracksuit pants
shoe: 0xf0ece0        // white slip-on sneakers
eyes: 'dots'
emI: 0
limbR: 1.0
hands: 'sphere'
```

**Accessories**
- **crown** (two side patches, not a full dome) — thinning, receding
  hairline: two small flattened patches, `~90×24×70mm` each, dark brown
  `0x241c14`, positioned back from the brow so a visible bare-forehead gap
  shows between them — a full dome would read as a normal head of hair and
  lose the "receding" tell.
- **chest** — a small plain rectangular number-patch panel (no digits, per
  house no-text style): `~30×20×4mm`, off-white `0xf5f2ea`, proud of the
  jacket — every player has one; here it's decorative only.
- **hand** — a small folded betting-slip prop: thin flat box `~40×30×4mm`,
  paper tone `0xe8e2d0` with a thin diagonal accent stripe `0xb23b32`, held
  low at the hand.

**Silhouette check**: among seven identical tracksuits, the visible bare
scalp between the two hair patches (rather than a full dome) is the one
thing that reads at 30 px as "the ordinary, slightly worn-down one" — the
betting slip is the close-up confirmation of which specific ordinary guy
this is.

**Personality**: `bobMul: 1.0, swayMul: 1.0, cadenceMul: 0.95, ampMul: 1.0`
(a deliberately unremarkable, everyman baseline walk — every other
tracksuit member's multipliers read as a variation on this one)
**Bubbles**: `🐎💸😰🏃` (horse-racing debt, financial panic, dread, the
frantic running the games demand of everyone)

---

### 2. `mastermind-frontman` — "Masked Overseer (black coat, faceted mask)"

**Reference**: The black-clad, fully masked commander who runs the games on
the ground and answers only to the unseen VIPs; his mask is a matte black
plate molded into sharp angular facets, deliberately evoking a menacing,
anonymous authority figure (fans and costume retailers alike describe the
design as a nod to classic sci-fi villain helmets). Never seen unmasked in
uniform. (The Front Man.)

**Spec**
```
sk: 1.05
headR: 124
headShape: 'sphere'
skin: 0x2a2622        // mostly hidden by the mask
body: 0x0d0d0d        // black coat
legColor: 0x0d0d0d    // black trousers
shoe: 0x111111        // black boots
eyes: 'none'
emI: 0
limbR: 1.0
hands: 'box'          // gloved, more angular than bare hands
noFace: true           // fully masked — no nose/mouth/brow
```

**Accessories**
- **face** — the faceted black mask plate: a flattened box `~132×150×40mm`,
  near-black `0x161616`, plus two smaller angled "facet" boxes at the cheeks
  (`~40×50×10mm` each, slightly lighter `0x1e1e1e`) sitting ≥3 mm proud of
  the base plate so the facets read as distinct planes rather than
  coplanar-hatching into the base (coincident-face gotcha).
- **back** — the long black coat's trailing skirt (reuses the cape recipe
  from the AUTHORING conventions): a flattened cone, `~260×520×30mm`, black
  `0x0d0d0d`, hanging from the shoulders.
- **handL/handR** — black glove overlays: small boxes `~34×34×40mm` each,
  `0x141414`, over the hand anchors.

**Silhouette check**: the only fully black, faceless silhouette in the
pack — a solid dark humanoid topped by an angular plate mask reads
instantly as "the masked commander" against every colorful player and the
pink-and-black guards.

**Personality**: `bobMul: 0.8, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.8`
(slow, deliberate, imposing — no wasted motion)
**Bubbles**: `🎭🗡️🖤👁️` (the mask, quiet menace, all-black authority,
constant surveillance)

---

### 3. `guard-pink` — "Masked Guard (pink jumpsuit, triangle rank)"

**Reference**: One of the pink-hooded, black-masked soldiers who guard,
manage, and — depending on rank — execute players; their identical
head-to-toe uniforms (pink hooded jumpsuit, black gloves/boots, perforated
black mask) exist specifically to erase individuality, and their masks are
marked with one of three geometric rank shapes: circle (menial workers),
triangle (armed soldiers, the rank modeled here), or square (supervisors
answering only to the Front Man). (Pink Guards / Pink Soldiers.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0x2a2622        // mostly hidden by the mask
body: 0xe66fa0        // bubblegum-pink hooded jumpsuit
legColor: 0xe66fa0
shoe: 0x1c1c1c        // black boots
eyes: 'none'
emI: 0
limbR: 1.0
hands: 'box'
noFace: true
```

**Accessories**
- **crown** (hood) — a black hood covering the head, `~140×60×140mm`,
  `0x141414`.
- **face** — a flat mask plate, `~118×90×20mm`, `0x161616`, with a small
  proud rank marker: a `cone` `[r:24,h:32]`, `0x2a2a2a`, tip-up at mask
  center to read as a triangle from the front — see Rig gaps for the
  swap-recipe to the other two ranks.
- **chest** — a thin vertical zipper-line accent, `~10×160×6mm`,
  `0x141414`.
- **handL/handR** — black glove overlays, `~34×34×40mm` each, `0x141414`.
- **handR** — a slim rifle silhouette prop: `~18×18×140mm`, `0x1c1c1c`,
  held along the forearm.

**Silhouette check**: the bright bubblegum-pink jumpsuit block topped by an
all-black hooded, masked head is unmistakable on its own — the rank shape
on the mask is a nice close-up detail, but the pink-vs-black color block
alone separates this member from everyone else in the pack before you're
close enough to read the triangle.

**Personality**: `bobMul: 0.7, swayMul: 0.5, cadenceMul: 1.0, ampMul: 0.8`
(rigid, marching, uniform — no individual flourish)
**Bubbles**: `🔺⚫🔫🤐` (triangle rank, faceless anonymity, armed
enforcement, enforced silence)

---

### 4. `defector-saebyeok` — "Sharp-Eyed Survivor (green tracksuit, blunt bob)"

**Reference**: A North Korean defector and pickpocket supporting her
younger brother and institutionalized mother, whose guarded, self-reliant
toughness masks real vulnerability; visually defined by a short, sharply
blunt bob haircut with straight-cut bangs that became one of the show's
most-copied real-world looks. (Kang Sae-byeok, Player 067.)

**Spec**
```
sk: 0.92
headR: 116
headShape: 'sphere'
skin: 0xe6bd9c
body: 0x1d6b52
legColor: 0x1d6b52
shoe: 0xf0ece0
eyes: 'almond'
emI: 0
limbR: 0.85
armL: 0.92
```

**Accessories**
- **crown** — blunt bob, flat-bottomed at jaw height: a rounded dome,
  `~120×60×120mm`, near-black `0x161310`, no taper at the bottom edge (the
  blunt-cut convention already established by `chef-monica` in the Friends
  pack, reused here).
- **face** — a straight-cut fringe ledge at the brow: a thin flattened box,
  `~110×18×30mm`, same `0x161310`, sitting proud of the forehead.
- **hand** — a small hidden shiv: a thin flat sliver, `~60×8×4mm`, steel
  grey `0xb8bcc2`, held low.

**Silhouette check**: the sharp, straight-edged bob-and-bangs silhouette —
more angular than any other hair shape in the pack — is the one thing that
separates her from the identical tracksuit crowd at 30 px.

**Personality**: `bobMul: 0.95, swayMul: 0.85, cadenceMul: 1.1, ampMul: 0.95`
(wary, efficient, always a little on-guard)
**Bubbles**: `🔪🤐🧷😔` (survival edge, guarded silence, quiet resourceful
mending, held-back grief)

---

### 5. `strategist-sangwoo` — "Calculating Strategist (green tracksuit, marble in hand)"

**Reference**: A once-celebrated investment-firm graduate who embezzled
client funds and enters the games hiding his ruin behind a composed,
sharp-featured, always-in-control demeanor; his arc turns on the marble
game, making a single marble the character's defining prop. (Cho Sang-woo,
Player 218.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
skin: 0xdcb090
body: 0x1d6b52
legColor: 0x1d6b52
shoe: 0xf0ece0
eyes: 'dots'
emI: 0
limbR: 0.95
```

**Accessories**
- **crown** — neat, tightly side-parted short hair: a low flat cap,
  `~120×30×120mm`, `0x18120c`, with a subtle asymmetric part line (two
  slightly offset patches rather than one uniform dome).
- **hand** — a single small marble: a `sphere` `r:12`, pale glassy
  `0xcfe0e8`, held in the palm.
- **chest** — a thin collar accent, `~26×10×6mm`, off-white `0xeceadd`.

**Silhouette check**: the tightest, most deliberately "put-together" hair
part in the pack reads as controlled/calculating even before the marble
prop is visible up close — the marble is the specific tell that locks in
which character this is.

**Personality**: `bobMul: 0.85, swayMul: 0.8, cadenceMul: 1.05, ampMul: 0.85`
(controlled, measured, calculating — minimal wasted motion until the mask
slips)
**Bubbles**: `🔵🧠♟️😨` (the marble game, cold calculation, strategic
scheming, mounting desperation)

---

### 6. `elder-ilnam` — "Frail Elder (green tracksuit, stooped)"

**Reference**: An elderly player far older than the rest of the field,
frail and seemingly unaware of the games' stakes at first — small,
stooped, and sparse-haired, standing out physically among a field of
otherwise able-bodied adults. (Oh Il-nam, Player 001.)

**Spec**
```
sk: 0.8
headR: 108
headShape: 'sphere'
skin: 0xd9b48c
body: 0x1d6b52
legColor: 0x1d6b52
shoe: 0xf0ece0
eyes: 'dots'
emI: 0
limbR: 0.75
armL: 0.85
legL: 0.9
```

**posture**: `{ pitch: 0.25 }` — a forward stoop/hunch.

**Accessories**
- **crown** — thin, wispy white-grey hair: a small low flat patch (not a
  full dome), `~90×20×90mm`, near-white grey `0xe6e2da`, leaving most of the
  scalp visible.
- **hip** — a thin pale belt accent (this member's tint surface): `'tint'`
  color, `~140×20×8mm`.

**Silhouette check**: the smallest, most stooped-over frame in the whole
pack (low `sk` + root-pitch hunch), topped with sparse pale hair, reads
instantly as "the frail elder" among an otherwise able-bodied field — no
prop needed.

**Personality**: `bobMul: 0.6, swayMul: 0.6, cadenceMul: 0.7, ampMul: 0.6`
(slow, careful, frail baseline — the character's late reveal that he's
spryer than he looks is a nice surprise the base animation doesn't need to
chase)
**Bubbles**: `🎈👴🩺😊` (childhood-game nostalgia, elderly warmth, failing
health, gentle contentment)

---

### 7. `schemer-minyeo` — "Flamboyant Schemer (voluminous permed hair)"

**Reference**: A loud, theatrical con artist and repeat fraud offender who
allies opportunistically with whichever group serves her best in the
moment; visually defined by voluminous, frizzy, dark permed hair and
constantly exaggerated, expressive body language. (Han Mi-nyeo, Player
212.)

**Spec**
```
sk: 0.9
headR: 122
headShape: 'sphere'
skin: 0xe0b494
body: 0x1d6b52
legColor: 0x1d6b52
shoe: 0xf0ece0
eyes: 'almond'
emI: 0
limbR: 0.85
```

**Accessories**
- **crown** — a large, wide frizzy permed dome: `~150×110×150mm`, dark
  brown-black `0x241c16` — noticeably wider than any other member's hair in
  the pack.
- **head** (both sides) — extra frizz puffs breaking the dome's clean
  outline: two small spheres, `~40mm` dia each, same `0x241c16`, at ear
  height.

**Silhouette check**: the widest, frizziest hair silhouette in the entire
pack — instantly the biggest head-shape outline even in a crowd of
identical tracksuits.

**Personality**: `bobMul: 1.3, swayMul: 1.35, cadenceMul: 1.15, ampMul: 1.25`
(the loudest, most theatrical gait swing in the pack — erratic, big
gestures)
**Bubbles**: `🃏😼💅🗣️` (con-artist trickery, sly cattiness, vain flair,
loud talkativeness)

---

### 8. `worker-ali` — "Devoted Migrant Worker (curly hair, sturdy build)"

**Reference**: A Pakistani migrant factory worker who joins the games to
support his wife and infant son after his employer withholds his wages;
noted for his physical strength (a factory-labor build) and for being the
kindest, most guileless, most trusting member of the cast. (Ali Abdul,
Player 199.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0x8a5a3a
body: 0x1d6b52
legColor: 0x1d6b52
shoe: 0xf0ece0
eyes: 'dots'
emI: 0
limbR: 1.05
```

**Accessories**
- **crown** — short black curly hair: a rounded dome with 3–4 shallow
  ridge bumps suggesting tight curls, `~124×50×124mm`, `0x18120e`.
- **hip** — a plain dark work-belt accent, `~140×20×8mm`, `0x3a3a2c`.

**Silhouette check**: the tight black curly-hair dome combined with a
noticeably broader/sturdier limb build (`limbR 1.05`, the widest of the
tracksuit members) than the rest of the cast is the one read that separates
him from the pack — his in-game strength is his defining trait, and the
build says so before any prop would.

**Personality**: `bobMul: 1.05, swayMul: 0.95, cadenceMul: 0.95, ampMul: 1.05`
(a steady, sturdy gait with a touch of extra weight behind it — no
swagger, just quiet strength)
**Bubbles**: `👨‍👩‍👦💪🙏😊` (devotion to family, physical strength, humble
gratitude, warm kindness)

---

### 9. `recruit-anonymous` — "Nameless Player (green tracksuit, plain crop)"

**Reference**: Not a named character — one of the hundreds of identically
tracksuited, interchangeable contestants who fill out the games' crowd
scenes; the show's core visual irony is that this anonymous mass and the
eight named principals above wear the exact same uniform. Included as this
pack's deliberate "blank" crowd-filler member and its one true tint carrier
(see the Overview design call).

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0xdcb090
body: 0x1d6b52
legColor: 0x1d6b52
shoe: 0xf0ece0
eyes: 'dots'
emI: 0
limbR: 1.0
```

**Accessories**
- **crown** — a plain, short, cropped hair cap: `~118×24×118mm`,
  `0x201812` — deliberately the most unremarkable hair shape in the pack
  (no part, no volume, no bump).
- **chest** — a plain number-patch panel, this member's genuine tint
  surface: `'tint'` color, `~30×20×4mm`, proud of the jacket.

**Silhouette check**: intentionally the LEAST distinctive figure in the
pack — plain crop, no signature prop, average build — reads only as "one
of the four hundred and fifty-six," which is the point; it should be the
one member that could plausibly be mistaken for a background figure rather
than a named principal.

**Personality**: `bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.0`
(the pack's neutral walk-cycle reference)
**Bubbles**: `😨🔢🤝😰` (numbered anonymity, nervous solidarity, shared
dread)

## Rig gaps

- **No first-class full-face "mask/faceplate" accessory** distinct from
  layering a flat box over the `face` anchor plus `noFace: true` +
  `eyes: 'none'`. It reads fine here (Front Man, Pink Guard) but there's no
  dedicated "this member has literally no visible face" primitive — every
  masked/helmeted member has to remember to set both `noFace` and
  `eyes: 'none'` by hand rather than a single flag doing both.
- **No small "badge/rank-insignia" shape convention.** The show's own
  circle/triangle/square guard-rank system is exactly the kind of small
  geometric emblem this rig has no first-class support for — approximated
  here with a single swappable primitive (cone≈triangle; a flat disc or
  sphere would read as circle, a small box as square) sized to read at
  close range on the mask. Good enough for one rank per member, but a future
  pack needing a genuine multi-shape insignia system (military rank pins,
  sports-team logos-as-shapes) would hit the same wall.
- **No balding/receding-hairline hair convention.** Gi-hun's receding
  hairline is approximated with two small side crown patches instead of a
  full dome (leaving bare scalp between them) rather than any dedicated
  "partial hair coverage" primitive — works at 30 px but is a one-off
  trick, not a documented recipe.
- **Fabric patterns/prints/text** (recurring, already tracked in
  `docs/ROADMAP.md` § "Avatar rig gaps" and flagged in `tv-seinfeld`/
  `tv-big-bang-theory`/`tv-friends`): not newly surfaced here, but worth
  noting this pack's uniforms are real-world plain enough (solid teal
  jacket, solid pink jumpsuit) that the gap barely bites — unlike prior
  packs, nothing here NEEDED a print to read correctly.
- **Long coat via the existing `back`-anchor cape recipe**: not a new gap —
  the Front Man's trench coat reuses the documented cape/cloak recipe
  (flattened cone on `back`) exactly as written in AUTHORING.md, confirming
  it also covers "long coat," not just literal capes.

None of the above blocked shipping any member — all nine have a complete,
distinguishable spec using only the current rig's primitives and anchors.

## Sources

- [The Squid Game Tracksuit — BAMF Style](https://bamfstyle.com/2021/10/20/squid-game-tracksuit/)
- [Tracksuits — Squid Game Wiki (Fandom)](https://squid-game.fandom.com/wiki/Tracksuits)
- [Squid Game The Front Man Mask Costume — Costume Party World](https://www.costumepartyworld.com/squid-game-the-front-man-mask-costume)
- [Squid Game: 9 Subtle Details About The Costumes Fans Might Have Missed — ScreenRant](https://screenrant.com/squid-game-hidden-details-costumes-meaning/)
- [Front Man: A Mysterious Gang Leader in Squid Game — Quda Halloween](https://qudahalloween.com/blogs/tv-show-costumes/front-man-costume)
- [Explained: What the shapes on the Squid Game guards' masks actually mean — Facebook/Holy Church of Netflix](https://www.facebook.com/theholychurchofnetflix/posts/explained-what-the-shapes-on-the-squid-game-guards-masks-actually-mean-%EF%B8%8F/1017080850465812/)
- [Pink Guards — Squid Game Wiki (Fandom)](https://squid-game.fandom.com/wiki/Pink_Guards)
- [Understanding the Pink Soldiers' Hierarchy — Factual America](https://www.factualamerica.com/squid-game/the-significance-of-the-pink-soldiers-hierarchy)
- [Squid Game Pink Soldiers Costume Guide — Just American Jackets](https://justamericanjackets.com/squid-game-pink-soldiers-costume-guide/)
- [Beyond the Number: Unpacking Player 067's Iconic Look — Oreate AI Blog](https://www.oreateai.com/blog/beyond-the-number-unpacking-player-067s-iconic-look-in-squid-game/e1b44b9f1259fc9241b206e6b7d59965)
- [Cho Sang-woo (Squid Game) — Wikipedia](https://en.wikipedia.org/wiki/Cho_Sang-woo_(Squid_Game))
- [Cho Sang-woo — Squid Game Wiki (Fandom)](https://squid-game.fandom.com/wiki/Cho_Sang-woo)
- [Oh Il-nam — Squid Game Wiki (Fandom)](https://squid-game.fandom.com/wiki/Oh_Il-nam)
- [From Player 001 to Mastermind — Distractify](https://www.distractify.com/p/what-happened-to-the-old-man-in-squid-game)
- [Han Mi-nyeo — Wikipedia](https://en.wikipedia.org/wiki/Han_Mi-nyeo)
- [Han Mi-nyeo — Squid Game Wiki (Fandom)](https://squid-game.fandom.com/wiki/Han_Mi-nyeo)
- [Ali Abdul — Wikipedia](https://en.wikipedia.org/wiki/Ali_Abdul)
- [Ali Abdul — Squid Game Wiki (Fandom)](https://squid-game.fandom.com/wiki/Ali_Abdul)
- [Ali Abdul from Squid Game Costume Guide — Carbon Costume](https://carboncostume.com/ali-abdul-from-squid-game/)
- [How Does 'Squid Game' End? Season 1 Finale Recap — Netflix Tudum](https://www.netflix.com/tudum/articles/squid-game-season-1-ending-explainer)
- [Seong Gi-hun — Squid Game Wiki (Fandom)](https://squid-game.fandom.com/wiki/Seong_Gi-hun)
- Diorama source reference (existing rig conventions, anchors, `SPECS`
  table, per-kind accessory recipes): `src/three-renderer.ts`
  (`_buildHumanoid`, `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`);
  prior pack doc `docs/avatars/pop-culture/tv-friends.md` for anchor/recipe
  precedent, and pack module `src/avatar-packs/tmnt.ts` for the shared-body/
  `base` precedent.
