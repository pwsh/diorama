# Avatar pack: Pop-Culture ▸ TV ▸ I Love Lucy

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no printed text, no character names anywhere in-scene; identity lives only in
this doc's Reference lines and the pack's display labels (which use
descriptive-generic wording, e.g. "Comedienne (upswept red hair, polka-dot
dress)").

## Overview

- **Group**: The core cast of *I Love Lucy* (1951–1957) — the scheming
  Manhattan housewife, her Cuban bandleader husband, and their landlords/best
  friends upstairs-downstairs — plus two supporting archetypes (their young
  son, and a generic Tropicana Club showgirl) that round out the pack's
  variety and represent the show's recurring nightclub production numbers.
- **Hierarchy path**: `pop-culture / tv / i-love-lucy`
- **Member count**: 6
- **Rig**: humanoid only (no quadrupeds in this pack)
- **Design call — remembered in color, not b/w**: the series aired in black
  and white, but its cultural memory (merchandise, reruns, costume parties)
  is entirely in color — Lucy's fiery red hair chief among them. This pack
  uses a **1950s pastel-and-primary palette** (saturated red, crisp white
  collars/aprons, muted housedress teal, warm cardigan brown, nightclub
  coral/gold) rather than any grayscale treatment.
- **Design call — fixed costume colors, not sensor-tint carriers**: like the
  `pop-culture/tv-big-bang-theory` and `sci-fi/star-trek-tng` packs, this is a
  named-character homage, not a generic archetype pack — telling Lucy from
  Ethel from a showgirl at a glance depends on a fixed, canonical palette per
  member. `skin`/`body`/`legColor` are therefore FIXED hex values, not `tint`.
- **Shared anchor usage**: `crown` (hair, hats, the feather headdress),
  `chest`/`torso-front` (collars, aprons, bow ties, shirt-front ruffles —
  see Rig gaps for the neckline approximation), `hip` (belts, apron ties,
  skirt flare), `hand` (the conga drum, cigar, drumsticks, maracas props that
  do a lot of the identity work in this pack).
- **Pack-wide caveat — no fabric pattern support**: the rig is color + shape
  only (no textures/decals). Lucy's polka-dot dress — arguably the single
  most iconic garment in American sitcom history — is approximated as a
  **solid red dress** broken up by a white collar, bow, and belt rather than
  an actual dot pattern. See Rig gaps.

## Members

### 1. `lucy-comedienne` — "Comedienne (upswept red hair, polka-dot dress)"

**Reference**: A scatterbrained, scheme-prone 1950s Manhattan housewife
endlessly plotting to break into show business, forever landing in
physical-comedy disasters. Signature look: a fitted red dress with a white
collar (the polka-dot print this dress wore in over 25 episodes is the
character's most iconic single visual, alongside her hair) and short,
swept-up bright red hair usually tied back with a bow. (Lucy Ricardo.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
skin: 0xf0c7a0
body: 0xc41e3a       // solid red dress (polka-dot print not reproducible — see Rig gaps)
legColor: 0xc41e3a    // dress reads as one garment top-to-hem
shoe: 0x2a2220
eyes: 'almond'
emI: 0
limbR: 0.9
hands: 'sphere'
```

**Accessories**
- **crown** — swept-up red-orange hair updo: a tall rounded dome offset
  toward the back-top of the head, ~150×120×140 mm, `0xb5451f` (a touch more
  orange than the dress red so hair reads as its own feature), raised +
  tilted back so the front rim clears the brow. A small white satin bow
  (flattened cone or box, ~40×30×14 mm, `0xf5f0e8`) pins to one side of the
  updo.
- **chest** — white Peter Pan collar: two small flared wing boxes at the
  neckline (~60×26×8 mm each), `0xffffff`, proud of the red dress body
  underneath (coincident-face rule — keep a few mm proud).
- **hip** — thin black belt band cinching the waist, `0x1c1c1c`.

**Silhouette check**: the swept-up red-orange hair plus the white collar
breaking an otherwise solid red dress is the one thing that reads "Lucy" at
30 px — the polka-dot texture itself is the piece that's lost (flagged
below).

**Personality**: `bobMul: 1.15, swayMul: 1.2, cadenceMul: 1.05, ampMul: 1.3`
(big physical-comedy gestures, exaggerated arm swings and pratfall energy)
**Bubbles**: `😆🍫📺💄` (candy-factory-style chaos, showbiz dreams, comic
dismay, vanity/lipstick gags)

---

### 2. `ricky-bandleader` — "Bandleader husband (white dinner jacket, conga)"

**Reference**: Lucy's Cuban-American husband, an orchestra leader, singer,
and conga drummer fronting the house band at the Tropicana nightclub.
Signature stage look: a white dinner jacket over black trousers, black bow
tie, ruffled white shirt front, and — rarely far from hand — a conga drum.
(Ricky Ricardo.)

**Spec**
```
sk: 1.03
headR: 124
headShape: 'sphere'
skin: 0xc98a5e
body: 0xf5f2ea       // white dinner jacket
legColor: 0x1a1a1a    // black trousers
shoe: 0x141414
eyes: 'almond'
emI: 0
limbR: 1.0
```

**Accessories**
- **crown** — black hair slicked back: a low flattened cap, ~130×36×130 mm,
  `0x140d08`.
- **chest** — a black bow-tie box at the collar (`0x101010`) plus a stack of
  2–3 thin horizontal white ruffle boxes peeking above the jacket lapels
  (`0xffffff`), hinting the tuxedo shirt front.
- **hand** — a conga drum prop: a squat wood-tone cylinder (`0x8a5a34`) with
  a cream drumhead cap (`0xe8dcc0`), held at hip height.

**Silhouette check**: the white dinner jacket against black trousers and bow
tie, paired with the handheld conga drum, reads instantly as "Ricky the
bandleader" even before the face is legible.

**Personality**: `bobMul: 1.05, swayMul: 1.3, cadenceMul: 1.15, ampMul: 1.0`
(a confident rumba hip-sway, energetic bandleader stage presence)
**Bubbles**: `🎶🥁😲❤️` (orchestra cues, the conga drum, his exasperated
"'splaining to do" reaction, devoted-husband affection)

---

### 3. `ethel-landlady` — "Landlady best friend (bleached blonde, apron)"

**Reference**: Lucy's warm, sharp-tongued best friend and landlady — a
former vaudeville performer content as a housewife, the voice of reason
(mostly) to Lucy's schemes. Signature look: bleached blonde hair with dark
roots showing (a deliberately "bad dye job"), and a dowdy, slightly
ill-fitting 1950s housedress with an apron. (Ethel Mertz.)

**Spec**
```
sk: 0.92
headR: 118
headShape: 'sphere'
skin: 0xe6b58f
body: 0x7f9c8c       // muted teal-green housedress
legColor: 0x7f9c8c
shoe: 0x5a3d2b
eyes: 'dots'
emI: 0
limbR: 0.95
```

**Accessories**
- **crown** — bleached blonde curled hair: a flattened cap, ~128×74×128 mm,
  `0xe4cf7e`, PLUS a thin dark-root strip at the front hairline (a small box,
  ~90×16×14 mm, `0x5c4a2e`) — the show's running two-tone "bad dye job" gag.
- **chest** — a white apron bib panel proud of the housedress, `0xf2efe6`.
- **hip** — the apron's waist tie/bow at the back, a small bow-shaped box
  pair, `0xf2efe6`.

**Silhouette check**: the two-tone dark-root/blonde hair plus the white
apron over a muted, unglamorous housedress reads as "Ethel," distinct from
Lucy's vivid solid-red hair-and-dress combo.

**Personality**: `bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.95, ampMul: 0.85`
(grounded, matronly walk with sharp, quick gestures when scheming with Lucy)
**Bubbles**: `🙄🧺☕😏` (eye-rolling at the husbands, laundry/housework,
coffee-klatch gossip, dry wit)

---

### 4. `fred-landlord` — "Landlord (bald, brown cardigan)"

**Reference**: Ethel's much-older husband, the building's landlord and
superintendent, and the Ricardos' downstairs neighbor — a retired
vaudevillian, World War I veteran, and notorious penny-pincher forever
grousing about money. Signature look: bald, in a cardigan sweater over a
white shirt. (Fred Mertz.)

**Spec**
```
sk: 0.95
headR: 122
headShape: 'sphere'
skin: 0xdda87e
body: 0x8a6a3e       // brown cardigan
legColor: 0x3a3a3a    // dark trousers
shoe: 0x1c1c1c
eyes: 'dots'
emI: 0.05             // faint bald-scalp sheen
limbR: 1.0
```

**Accessories** (no `crown` piece at all — bald is the point)
- **chest** — a cardigan placket: a short row of small button dots (tiny
  spheres, `0xc9a227`) down the front, plus a white shirt-collar wedge
  peeking above it (`0xf2efe6`).
- **hand** — a stubby cigar prop: a thin brown cylinder (`0x5a3a20`) with a
  faint orange emissive tip (`emI ≈ 0.2` on that piece only).

**Silhouette check**: the bald head (no hair accessory at all — unique in
this pack) plus the brown cardigan over a white shirt is the single
identifying combo.

**Personality**: `bobMul: 0.6, swayMul: 0.55, cadenceMul: 0.85, ampMul: 0.75`
(a slow, grumbling old-man shuffle)
**Bubbles**: `😤🪙📰😒` (grumbling, penny-pinching, reading the newspaper,
grousing at Ethel)

---

### 5. `little-ricky` — "Young son (overalls, drumsticks)"

**Reference**: Lucy and Ricky's young son, who by the show's later seasons
is old enough to show off a budding talent for drumming — inherited from his
bandleader father. A small boy, typically dressed in simple 1950s kidswear.
(Ricky Ricardo Jr., a.k.a. "Little Ricky.")

**Spec**
```
sk: 0.55
headR: 108
headShape: 'sphere'
skin: 0xd9a06e
body: 0xeae4d0       // white/cream shirt
legColor: 0x3b5ba0    // blue denim overalls
shoe: 0xf2efe6
eyes: 'dots'
emI: 0
limbR: 0.9
```

**Accessories**
- **crown** — short black hair, a small rounded cap, ~110×30×110 mm,
  `0x140d08`.
- **chest** — a thin red accent stripe down the overalls bib (a small box,
  `0xc41e3a`), hinting the shirt-under-overalls layering.
- **hand** — a pair of drumsticks props: two thin cylinders held forward,
  `0x8a5a34`.

**Silhouette check**: the smallest build in the pack (`sk 0.55`) in blue
denim overalls, holding drumsticks, reads as "Little Ricky" — the only child
figure among five adults.

**Personality**: `bobMul: 1.3, swayMul: 1.1, cadenceMul: 1.3, ampMul: 1.2`
(bouncy, high-energy kid gait)
**Bubbles**: `🥁🎈🧸😄` (drumming, playfulness, toys, easy laughter)

---

### 6. `tropicana-showgirl` — "Nightclub showgirl (ruffles, feather headdress)"

**Reference**: A generic chorus dancer at the Tropicana Club, Ricky's
workplace — standing in for the glamorous Latin-nightclub production numbers
that recur throughout the series. Signature look: a bright ruffled rumba
costume, upswept hair, and a tall feathered headdress. (Ensemble archetype,
not a named character.)

**Spec**
```
sk: 0.95
headR: 116
headShape: 'sphere'
skin: 0xd9a06e
body: 0xff6f61       // hot coral-pink ruffled costume
legColor: 0xff6f61
shoe: 0xf2efe6
eyes: 'almond'
emI: 0.12             // sequin sparkle
limbR: 0.85
```

**Accessories**
- **crown** — a tall feather-plume headdress: 3–4 slim cones fanned upward
  from an upswept-hair base sphere, alternating coral (`0xff6f61`) and gold
  (`0xd4af37`), raised + tilted back so the front rim clears the brow.
- **hip** — a ruffled skirt flare: two stacked cone "ruffle" bands around the
  hips, `0xffb199`.
- **hand** — a pair of maracas props: small spheres on short cylinder
  handles, `0xd4af37`.

**Silhouette check**: the fan of upright feather plumes above upswept hair,
over a bright ruffled coral costume, reads instantly as "nightclub showgirl"
even before the maracas.

**Personality**: `bobMul: 1.0, swayMul: 1.35, cadenceMul: 1.2, ampMul: 1.25`
(flourishing rumba/dance movement, showy arm lines)
**Bubbles**: `💃🎉🌺🎶`

## Rig gaps

- **No fabric-pattern/print support** (the rig is color+shape only). This
  pack's single biggest loss: Lucy's polka-dot dress is arguably the most
  iconic garment in American sitcom history, and it's approximated here as a
  flat solid red with a white collar/bow/belt — the actual dot pattern is
  gone entirely. A lightweight repeating-primitive "pattern" accessory (an
  array of small dot/diamond/stripe shapes tiled across a `chest`/`hip`
  region) would recover this and would generalize well across many other
  franchise packs (polka dots, plaid, argyle, camo all recur).
- **No dedicated neck/collar anchor.** Four different neckline reads appear
  in this one pack — Lucy's Peter Pan collar, Ricky's bow-tie + ruffled
  shirt front, Ethel's apron bib, Fred's cardigan/shirt collar — all
  approximated as small boxes bolted to the top edge of the `chest` anchor
  (the same gap already flagged in `pop-culture/tv-big-bang-theory.md`). A
  generalized `collar` anchor (a band wrapping the neck, distinct from the
  flat chest panel) would serve all of these more naturally.
- **No wrist/cuff anchor.** Ricky's ruffled cuffs and Lucy's white dress
  cuffs (period detail on both costumes) have no natural anchor point — the
  `hand` anchor is for held props, not a wrist trim ring. Left off both
  specs rather than mis-anchoring a cuff to the prop slot; a `wrist` anchor
  (paired conceptually with `hip`/`chest` bands) would generalize to any
  formalwear or uniform pack with visible cuffs.
- **Bald-head shine is a blunt instrument.** Fred's bald head uses a small
  flat `emI` bump for a scalp sheen since there's no separate "shine
  highlight" primitive — functional, but a dedicated small specular-highlight
  decal (or a baldness flag that tweaks the head material directly) would
  read a little more convincingly at close range.

None of the above blocked shipping a member — all six have a complete,
distinguishable spec using only the current rig's primitives and anchors.

## Sources

- [Lucille Ball's signature polka-dot dress (auction listing, Elois Jenssen
  design) — Heritage Auctions](https://entertainment.ha.com/itm/movie-tv-memorabilia/lucille-ball-signature-lucy-ricardo-polka-dot-dress-designed-by-elois-jenssen-for-i-love-lucy/a/997042-1948.s)
- ["Lucy Goes to Mexico" polka-dot dress — The Lucy Room](https://thelucyroom.com/2024/10/15/lucy-goes-to-mexico-polka-dot-dress/)
- [I Love Lucy Costume: Step-by-Step Styling Guide — Costume Realm](https://www.costumerealm.com/i-love-lucy-costume/)
- [Ricky Ricardo — Ultimate I Love Lucy Wiki (Fandom)](https://ultimateilovelucy.fandom.com/wiki/Ricky_Ricardo)
- [Ricky Ricardo Costume Guide — Carbon Costume](https://carboncostume.com/ricky-ricardo/)
- [Lucy and Ricky Ricardo — Wikipedia](https://en.wikipedia.org/wiki/Lucy_and_Ricky_Ricardo)
- [Ethel Mertz — Wikipedia](https://en.wikipedia.org/wiki/Ethel_Mertz)
- [Fred Mertz — Wikipedia](https://en.wikipedia.org/wiki/Fred_Mertz)
- [Vivian Vance — Wikipedia](https://en.wikipedia.org/wiki/Vivian_Vance)
- ['I Love Lucy': Vivian Vance Transformed Herself to Play Ethel — Cheat Sheet](https://www.cheatsheet.com/news/i-love-lucy-vivian-vance-transformed-herself-for-ethel.html/)
- [Tragic Real-Life Details About Ethel And Fred Mertz — Grunge](https://www.grunge.com/894858/tragic-real-life-details-about-ethel-and-fred-mertz-from-i-love-lucy/)
- [Ricky Ricardo Jr. — Wikipedia](https://en.wikipedia.org/wiki/Ricky_Ricardo_Jr.)
- [Ricky Ricardo, Jr. — I Love Lucy Wiki (Fandom)](https://ilovelucyandricky.fandom.com/wiki/Ricky_Ricardo,_Jr.)
- Diorama source reference (existing rig conventions, anchors, `SPECS`
  table, per-kind accessory recipes): `src/three-renderer.ts`
  (`_buildHumanoid`, `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`);
  prior pack docs `docs/avatars/pop-culture/tv-big-bang-theory.md` and
  `docs/avatars/sci-fi/star-trek-tng.md` for anchor/recipe precedent.
