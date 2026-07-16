# Avatar pack: Pop-Culture ▸ TV ▸ The Fresh Prince of Bel-Air

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color/proportions read as the character archetype, not a likeness.
No logos, no printed text, no character names anywhere in-scene; identity
lives only in this doc's Reference lines and the pack's display labels (which
use descriptive-generic wording, e.g. "Preppy Cousin (argyle sweater vest)").

## Overview

- **Group**: The Banks household of *The Fresh Prince of Bel-Air* (1990–1996)
  — a wealthy, formal Bel-Air family plus the street-smart Philadelphia
  nephew who moves in with them, and their household butler. The show's
  whole visual joke is a **culture-clash palette**: the Banks family dresses
  in tailored, old-money formalwear (navy, charcoal, burgundy, cream, gold
  accents) while Will's loud 90s hip-hop streetwear (neon gold, purple, hot
  pink) reads as the deliberate odd one out against that refined household —
  this pack leans on that contrast as its primary visual thesis, the same
  way `pop-culture/tv/friends` leans on hair-shape variety.
- **Hierarchy path**: `Pop Culture / TV Shows / The Fresh Prince of Bel-Air`
- **Member count**: 7
- **Rig**: humanoid only (no quadrupeds — the show has no recurring animal
  cast member)
- **Design call — fixed costume colors, not sensor-tint carriers**: like
  `pop-culture/tv/friends` and `pop-culture/tv/seinfeld`, this is a
  named-character homage — "which specific Banks-household member is this"
  lives in a fixed per-member palette (Will's neon color-block streetwear,
  Carlton's mustard argyle vest, Philip's charcoal three-piece suit, Vivian's
  wine-toned blazer, Hilary's bold red power suit, Ashley's purple overalls,
  Geoffrey's black-and-white formalwear). `skin`/`body`/`legColor` are FIXED
  hex values per member, not `tint`. If per-sensor color coding matters for a
  given deployment, recolor a small accent piece instead (brooch, tie, chain,
  bow, hatband) — none of the members below use a tint carrier by default.
- **Anchor plan**: `crown` (hair/caps/hats — cap, argyle-vest is chest not
  crown, balding pates, updo, bowler, pigtails, side-hair band), `head`
  (pigtail side bunches), `face` (mustaches, the one recurring adult-male
  signifier in this cast), `chest`/`torso-front` (vest/blazer/collar/tie/
  pearl/brooch/bow-tie accents), `hip` (Philip's watch-chain drape reads off
  `chest`, no hip pieces needed here), `hand` (character props — boombox,
  tennis racket, gavel, book, handbag, basketball, serving tray).
- **Scale spread doubles as a silhouette differentiator**: Philip is the
  pack's largest build (imposing patriarch, `sk 1.2`) and Ashley is its only
  child-scale member (`sk 0.7`) — the two extremes bookend five adult-scale
  members in between, so build alone helps separate members at a glance
  before costume color is even factored in.
- **Member-selection notes**: the seven Banks-household regulars from the
  opening-credits main cast are all included (Will, Carlton, Philip, Vivian,
  Hilary, Ashley, Geoffrey). Deliberately omitted: **Nicky Banks** (the
  youngest Banks sibling, added only in later seasons as a recurring/
  semi-regular rather than an original-cast primary), **Jazz** (Will's
  friend — memorable but a recurring guest, not household cast), and
  one-off/minor characters (Judge Robertson, various dates-of-the-week).
  Seven sits comfortably inside the 5–12 primary-cast range without needing
  a sub-series split.

## Members

### 1. `transplant-will` — "Streetwise Nephew (color-blocked jacket, sideways cap)"

**Reference**: The Philadelphia-born title character sent to live with his
wealthy aunt and uncle in Bel-Air — his defining visual joke against the
refined household is loud 90s hip-hop streetwear: color-blocked bomber/
windbreaker jackets in bright clashing primaries, a flat-brim cap worn
sideways or backwards, baggy jeans, and high-top sneakers. (Will Smith.)

**Spec**
```
sk: 1.05
headR: 126
headShape: 'sphere'
skin: 0x8a5a3a
body: 0xe8c020       // bright gold/yellow jacket base
legColor: 0x3a5590    // baggy denim-blue jeans
shoe: 0xf0ece0        // white high-top sneakers
eyes: 'dots'
emI: 0
limbR: 1.05
```

**Accessories**
- **crown** — flat-brim cap worn tilted sideways: a short flat disc brim +
  low box crown, `~130×40×130mm`, navy `0x1c2a4a`, rotated ~0.3 rad off
  center on the yaw axis for the "sideways" read.
- **chest** — color-block jacket panel: a flat rectangular panel proud of
  the gold body, `TORSO_W*0.9 × TORSO_H*0.5 × 6mm`, bold purple `0x6a2a8a`
  — the clashing second color is the point (color-block, not a single loud
  jacket tone).
- **hand** — a small portable boombox/radio prop: a flattened box,
  `~70×50×40mm`, black `0x1c1c1c` with two small silver dial-accent
  cylinders, `0xc8c8c8`.

**Silhouette check**: the sideways flat-brim cap over a purple-and-gold
color-blocked jacket against baggy blue jeans and white hi-tops is the one
thing that reads as "the fish-out-of-water street kid" instantly — it's the
single loudest, least-formal silhouette in a pack full of tailored suits and
blazers, which is exactly the show's joke.

**Personality**: `bobMul: 1.15, swayMul: 1.2, cadenceMul: 1.05, ampMul: 1.15`
(a loose, confident, bouncy swagger — hip-hop street energy)
**Bubbles**: `🎤🏀😎💰` (rapping/freestyling, basketball, effortless cool,
hustling get-rich-quick schemes)

---

### 2. `prep-carlton` — "Preppy Cousin (argyle sweater vest, popped collar)"

**Reference**: Will's straight-laced, Ivy-League-bound cousin — signature
look is a sweater vest (often argyle) over a button-down collared shirt with
the collar popped, paired with pleated khakis and loafers; famous for a
stiff-armed, hip-swinging solo dance move to Tom Jones. (Carlton Banks.)

**Spec**
```
sk: 0.98
headR: 122
headShape: 'sphere'
skin: 0x8a5c3c
body: 0xc4a030       // mustard sweater-vest base
legColor: 0xd8c8a0    // khaki trousers
shoe: 0x5a3c24        // brown loafers
eyes: 'dots'
emI: 0
limbR: 0.9
armL: 0.95
```

**Accessories**
- **crown** — short, neat, tightly combed hair: a low flattened cap,
  `~120×26×120mm`, `0x1c140e`.
- **chest** — popped white collar wedges + argyle diamond accent: two small
  flat collar-wedge boxes, `0xf2ede0`, at the neckline, plus 3 small proud
  diamond-rotated boxes (`~20×20×4mm`, alternating `0x8a6a20` / cream
  `0xe8dcc0`) set diagonally across the vest — the argyle pattern
  approximated with a few proud boxes per the pack's pattern convention
  (see Rig gaps), not a scatter/print.
- **hand** — a small tennis-racket prop (country-club leisure signifier): a
  thin flattened oval frame, `~60×90×8mm`, cream `0xe8e4d8`, with a thin
  handle cylinder, brown `0x5a3c24`.

**Silhouette check**: the mustard argyle-diamond vest over a popped white
collar reads as "buttoned-up prep" at a glance — without the diamond accents
he'd read as a generic office-casual kid rather than specifically Carlton's
country-club preppiness.

**Personality**: `bobMul: 0.85, swayMul: 1.3, cadenceMul: 1.0, ampMul: 0.8`
(a stiff-postured walk with an outsized hip-sway flourish — the show's
signature dance move baked into an otherwise uptight gait)
**Bubbles**: `🎶💼📈😳` (Tom Jones needle-drop dance breaks, career-climbing
ambition, stock-market enthusiasm, easily flustered nervousness)

---

### 3. `patriarch-philip` — "Judge & Patriarch (three-piece suit, mustache)"

**Reference**: Will's imposing, successful uncle — a self-made attorney who
later becomes a Los Angeles County Superior Court judge; a large, commanding
presence in dark three-piece suits with a mustache and a balding head, known
for booming "WILL!" outbursts when exasperated. (Philip Banks / "Uncle
Phil.")

**Spec**
```
sk: 1.2               // largest build in the pack
headR: 132
headShape: 'sphere'
skin: 0x6a4530
body: 0x1e2438       // charcoal-navy three-piece suit
legColor: 0x1a1e2e    // matching suit trousers
shoe: 0x1c1c1c        // black oxfords
eyes: 'dots'
emI: 0
limbR: 1.15
armL: 1.05
```

**Accessories**
- **crown** — balding pate: hair only at the sides/back (bare skin left on
  top, no separate top piece), a thin low band, `~110×18×110mm`,
  `0x2a2018`.
- **face** — a neat mustache: a flattened, slightly curved box beneath the
  nose, `~50×14×10mm`, `0x201810`.
- **chest** — vest front + gold watch chain: a flat vest panel,
  `TORSO_W*0.7 × TORSO_H*0.6 × 6mm`, `0x151a28` (a shade darker than the
  suit), with a thin draped chain hint (small cylinder arc), gold
  `0xd0b840`.
- **hand** — a small gavel prop: a short handle cylinder with a block head,
  `~50×20×20mm`, handle `0x5a3c24` / head `0x3a2416`.

**Silhouette check**: the broad, tall build (this pack's largest `sk`)
combined with the dark three-piece-suit silhouette and the gold watch-chain
glint reads instantly as "the imposing wealthy patriarch" before the gavel
confirms judge specifically.

**Personality**: `bobMul: 0.75, swayMul: 0.7, cadenceMul: 0.9, ampMul: 0.85`
(a slow, deliberate, authoritative gait — imposing stillness rather than
bustle)
**Bubbles**: `😠💼⚖️🙄` (booming exasperation, business/legal seriousness,
courtroom authority, weary patience with household chaos)

---

### 4. `matriarch-vivian` — "Professor Matriarch (elegant updo, pearls)"

**Reference**: Will's warm but no-nonsense aunt — a poised university
professor (English literature, later art history) with a doctorate, known
for elegant, sophisticated dress and a graceful classic updo hairstyle.
(Vivian Banks / "Aunt Viv.")

**Spec**
```
sk: 0.94
headR: 118
headShape: 'sphere'
skin: 0x6a4028
body: 0x5a2438       // deep burgundy/wine blazer-dress
legColor: 0x4a1e2c    // matching skirt
shoe: 0x2a1c14        // dark brown heels
eyes: 'almond'
emI: 0
limbR: 0.85
armL: 0.9
```

**Accessories**
- **crown** — elegant rounded updo: a smooth high dome tapering to a small
  twist at the back, `~124×80×120mm`, deep brunette `0x1c140e`.
- **chest** — a single strand of pearls: a small string of tiny sphere
  beads (~8mm each), cream `0xf0ece0`, arcing across the upper chest,
  proud of the blazer.
- **hand** — a small book prop (academic signifier): `~50×70×14mm`, cover
  `0x2a3a5a` with a cream page-edge accent, `0xf0ece0`.

**Silhouette check**: the smooth high updo plus a single strand of pearls
against a rich wine-toned blazer reads as "elegant, educated household
matriarch" at a glance; the book confirms the professor detail up close.

**Personality**: `bobMul: 0.9, swayMul: 0.95, cadenceMul: 1.0, ampMul: 0.9`
(graceful, composed, unhurried — warm authority rather than stiffness)
**Bubbles**: `📚🎓❤️🧘` (literature/scholarship, graduation-day pride,
nurturing warmth, calm groundedness)

---

### 5. `socialite-hilary` — "Socialite Fashionista (bowler hat, power blazer)"

**Reference**: Will's glamorous, fashion-obsessed older cousin — favors
sharply tailored power-suit separates and mini-dresses in bold primary
colors, always finished with a statement accessory (bowler hats, brooches,
oversized bags); style-obsessed and blithely self-absorbed. (Hilary Banks.)

**Spec**
```
sk: 0.92
headR: 116
headShape: 'sphere'
skin: 0x8a5c3c
body: 0xb01c28       // bold red power blazer
legColor: 0x1c1c1c    // black skirt
shoe: 0x1c1c1c        // black pumps
eyes: 'almond'
emI: 0
limbR: 0.8
armL: 0.92
```

**Accessories**
- **crown** — a black bowler hat: a flat wide brim disc (`~140×16×140mm`)
  plus a short rounded crown dome stacked above it (`~110×50×110mm`), both
  `0x161616`, tilted back so the front rim clears the brow (the top-hat/
  hood-clearance recipe, shortened for a bowler's lower crown).
- **chest** — a gold brooch accent: a small flattened sphere/disc,
  `~18mm`, gold `0xd8b840`, pinned at the lapel, proud of the blazer.
- **hand** — an oversized handbag prop: a flattened box with a thin loop
  handle, `~70×80×24mm`, black `0x1c1c1c`, with a thin gold clasp accent,
  `0xd8b840`.

**Silhouette check**: the flat-brimmed black bowler hat against a bold red
power blazer is the one thing that reads at 30 px as "the glamorous,
over-the-top fashionista" — the brooch and handbag are close-up
confirmation, not the primary read.

**Personality**: `bobMul: 1.0, swayMul: 1.3, cadenceMul: 1.0, ampMul: 1.15`
(a confident, runway-ready strut with heavy hip sway)
**Bubbles**: `💅👛💄😌` (vanity/glamour, shopping obsession, self-satisfied
confidence, blithe self-absorption)

---

### 6. `youngest-ashley` — "Youngest Cousin (casual pigtails)"

**Reference**: Will's youngest cousin — a sporty, down-to-earth pre-teen who
idolizes Will and dresses in casual, playful outfits (overalls, sneakers,
twin pigtails) rather than her older sister's designer looks. (Ashley
Banks.)

**Spec**
```
sk: 0.7              // the pack's only child-scale member
headR: 110
headShape: 'sphere'
skin: 0x8a5c3c
body: 0x6a4a90       // purple casual overalls/dress
legColor: 0x3a4a70    // denim-blue overalls leg
shoe: 0xf0ece0        // white sneakers
eyes: 'dots'
emI: 0
limbR: 0.75
armL: 0.8
```

**Accessories**
- **crown** + **head** (both sides) — twin puffs/pigtails: two small round
  sphere bunches at ear height, `~50mm` each, `0x1c140e`.
- **chest** — a small ribbon-bow accent at the collar: a thin bow-shaped
  box pair, `~20×16×4mm`, tint `0xd06090`.
- **hand** — a small basketball prop (tags along with Will's love of
  sports): a `~50mm` sphere, orange `0xd86a2a`, with a couple of thin dark
  seam-line box hints.

**Silhouette check**: the twin side-puff pigtails on a noticeably
smaller build (this pack's only `sk 0.7` member) is the one thing that reads
as "the youngest kid" instantly against every adult-scale member around her.

**Personality**: `bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.25, ampMul: 1.1`
(a bouncy, quick, kid-energy walk — eager and a little scampering)
**Bubbles**: `🏀🤗📺😆` (tagging along for sports/games, hero-worship
affection for Will, cartoon-watching downtime, easy giggly delight)

---

### 7. `butler-geoffrey` — "Household Butler (bow tie, tailcoat)"

**Reference**: The Banks family's dry-witted, impeccably proper English
butler — bald with neatly trimmed grey hair at the sides and a thin
mustache, always in formal black-and-white attire (tailcoat/waistcoat, wing
collar, bow tie), delivering deadpan sarcasm with total composure. (Geoffrey
the Butler.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0x8a6040
body: 0x141414       // black tailcoat/waistcoat
legColor: 0x141414    // black trousers
shoe: 0x0c0c0c        // black formal shoes
eyes: 'dots'
emI: 0
limbR: 0.92
```

**Accessories**
- **crown** — a thin band of grey hair at the sides/back only (balding
  pate, bare skin on top — same recipe as Philip's, grey instead of
  brown): `~108×16×108mm`, `0x9a9690`.
- **face** — a thin mustache: a small flattened box beneath the nose,
  `~44×10×8mm`, `0x8a8680` (grey, matching the side hair).
- **chest** — white wing-collar shirt front + black bow tie: a flat white
  shirt-front panel, `0xf2ede0`, with a small black bow-tie box pair,
  `~26×14×8mm`, `0x0c0c0c`, at the neckline.
- **hand** — a small silver serving-tray prop: a thin flat disc,
  `~70mm` diameter, silver `0xd0d0d0`, held flat.

**Silhouette check**: the black tailcoat silhouette with a crisp white
wing-collar front and a serving tray in hand reads instantly as "the proper
English butler" at any distance; the grey side-hair band and mustache
confirm the specific character up close.

**Personality**: `bobMul: 0.7, swayMul: 0.6, cadenceMul: 0.95, ampMul: 0.75`
(a stiff, perfectly composed, unhurried gait — total formal restraint)
**Bubbles**: `🍷🎩😏🫖` (formal service duties, refined propriety, dry
deadpan wit, tea-time composure)

## Rig gaps

- **No fabric-pattern/print support** (expected — the rig is color+shape
  only; same gap flagged in every prior sitcom pack). Carlton's argyle
  sweater vest is the clearest case in this pack — approximated with 3 small
  proud diamond-rotated boxes alternating two tones rather than a true
  repeating argyle grid, which reads fine at 30 px but loses the density of
  the real pattern up close.
- **No neck/collar-wrap anchor** (recurring gap, also flagged in
  `tv-seinfeld`/`tv-big-bang-theory`/`tv-friends`): Carlton's popped collar,
  Geoffrey's wing collar + bow tie, and Vivian's pearls are all approximated
  as small boxes/bead-strings bolted onto the `chest`/`torso-front` anchor
  rather than a true neck-wrapping band.
- **No situational costume/skin swap mechanism**: Philip Banks spends much
  of the later series in a judge's black robe rather than a three-piece
  suit, and Hilary's wardrobe famously rotates hats/colors episode to
  episode — this pack picks ONE canonical signature look per member (the
  three-piece suit for Philip as the show's dominant early-series look; the
  bowler-hat power-blazer combo for Hilary as her most-cited signature) per
  the primary-cast/single-look convention used throughout this pack family,
  rather than modeling alt-looks (same gap noted in `tv-seinfeld`'s
  puffy-shirt/game-day-paint OPTIONAL variants, which this pack does not
  attempt).

None of the above blocked shipping a member — all seven have a complete,
distinguishable spec using only the current rig's primitives and anchors; no
new eye style or head shape was needed (all seven are ordinary humans using
existing `'dots'`/`'almond'` eyes and the default sphere head).

## Sources

- [The Fresh Prince of Bel-Air — Wikipedia](https://en.wikipedia.org/wiki/The_Fresh_Prince_of_Bel-Air)
- [Fresh Prince of Bel-Air Costume Guide for Cosplay and Halloween — Costume Wall](https://costumewall.com/dress-like-the-fresh-prince-of-bel-air/)
- [16 Super '90s Will Smith Outfits — Bustle](https://www.bustle.com/articles/95209-16-super-90s-will-smith-outfits-that-prove-the-fresh-prince-of-bel-air-swag-isnt-exactly)
- [Fresh Prince of Bel-Air Style Guide — The Quality Edit](https://www.thequalityedit.com/articles/fresh-prince-style-guide)
- [18 Carlton Outfits From The Fresh Prince of Bel-Air — Bustle](https://www.bustle.com/articles/87650-18-carlton-outfits-from-the-fresh-prince-of-bel-air-that-prove-will-wasnt-the-only-fresh)
- [Carlton Banks — Wikipedia](https://en.wikipedia.org/wiki/Carlton_Banks)
- [Carlton Banks Costume Guide — Costume Wall](https://costumewall.com/dress-like-carlton-banks/)
- [Philip Banks (The Fresh Prince of Bel-Air) — Wikipedia](https://en.wikipedia.org/wiki/Philip_Banks_(The_Fresh_Prince_of_Bel-Air))
- [James Avery — Wikipedia](https://en.wikipedia.org/wiki/James_Avery)
- [The Fresh Prince Of Bel-Air: 10 Ways Philip Banks Is TV's Greatest Dad — ScreenRant](https://screenrant.com/fresh-prince-bel-air-philip-banks-best-television-father/)
- [Vivian Banks — Fresh Prince Fandom](https://freshprince.fandom.com/wiki/Vivian_Banks)
- [Character Study: Vivian Banks of The Fresh Prince of Bel-Air — THIS. ENTERTAINMENT](https://thisent.com/character-study-vivian-banks-of-the-fresh-prince-of-bel-air/)
- [Bel-Air's Hairstylist Walks Us Through the Characters' Hair — PS UK Beauty](https://www.popsugar.co.uk/beauty/bel-air-hairstylist-interview-48739763)
- [Fresh Prince of Bel-Air Style 90s Vs Now: Hilary Banks Outfits — Fish Out of Closet](https://fishoutofcloset.wordpress.com/2022/05/18/fresh-prince-of-bel-air-style-90s-vs-now-hilary-banks-outfits/)
- [Hilary Banks Fresh Prince 90s Fashion Outfits — Refinery29](https://www.refinery29.com/en-us/2016/04/108048/hilary-banks-fresh-prince-90s-fashion-outfits)
- [15 Times Hilary Banks' Outfits Ruled The Fresh Prince Of Bel-Air — Bustle](https://www.bustle.com/articles/180902-15-times-hilary-banks-outfits-ruled-the-fresh-prince-of-bel-air-photos)
- [Ashley Banks — Fresh Prince Fandom](https://freshprince.fandom.com/wiki/Ashley_Banks)
- [Geoffrey Butler — Fresh Prince Fandom](https://freshprince.fandom.com/wiki/Geoffrey_Butler)
- [Joseph Marcell — Wikipedia](https://en.wikipedia.org/wiki/Joseph_Marcell)
- Diorama source reference (existing rig conventions, anchors, `SPECS`
  table, per-kind accessory recipes): `src/three-renderer.ts`
  (`_buildHumanoid`, `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`);
  prior pack docs `docs/avatars/pop-culture/tv-friends.md` and
  `docs/avatars/pop-culture/tv-seinfeld.md` for anchor/pattern-recipe
  precedent (argyle/pattern-as-proud-boxes, balding-pate crown convention,
  face-anchor mustache/glasses precedent).
