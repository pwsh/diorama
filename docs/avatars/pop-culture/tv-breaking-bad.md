# Avatar pack: Pop-Culture ▸ TV Shows ▸ Breaking Bad

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no printed text, no character names anywhere in-scene; identity lives only in
this doc's Reference lines and the pack's display labels (which use
descriptive-generic wording, e.g. "Balding science teacher (goatee, dark
porkpie hat)").

## Overview

- **Group**: The core family/antagonist circle from *Breaking Bad* (2008–2013)
  — a high-school chemistry teacher turned meth kingpin, his young partner,
  his wife and son, his DEA brother-in-law and sister-in-law, his
  fast-talking lawyer, and the calm fried-chicken magnate running the
  operation above him. The show's whole visual language leans on **deliberate,
  near-monochrome costume palettes per character** (Marie's purple-everything,
  Skyler's cool blues fading to grays/blacks, Walt's khaki-to-black
  Heisenberg turn, Jesse's mustard hoodie/beanie, Gus's yellow-and-khaki
  managerial uniform) — this pack leans hard on the same anchor points other
  named-cast packs use: `crown` (hair/hats), `face` (glasses/goatee/
  mustache/half-rim readers), `chest`/`torso-front` (the signature garment +
  layer hints), `hip` (belts/holsters/jewelry), `hand` (props — jewelry,
  crutches).
- **Hierarchy path**: `Pop Culture / TV Shows / Breaking Bad`
- **Member count**: 8
- **Rig**: humanoid only (no quadrupeds in this pack)
- **Design call — fixed costume colors, not sensor-tint carriers**: like
  `sci-fi/star-trek-tng`, `sci-fi/star-trek-ds9`, and `pop-culture/tv-big-
  bang-theory`, this is a **named-character homage**, not a generic
  archetype pack — the whole point is "which specific character is this,"
  which the show itself encodes as a near-fixed personal color (Marie is
  ALWAYS purple; Skyler is blue; Hank is earth-tone orange/brown). `skin`/
  `body`/`legColor` are therefore FIXED hex values per member, not `tint`. If
  per-sensor color coding matters for a given deployment, recolor a small
  accent piece instead (tie, belt, jewelry, hair) rather than the base
  costume color.
- **Shared accessory recipe — facial hair**: this pack reuses the
  already-shipped `face`-anchor flattened-box facial-hair idiom (see
  `sci-fi/star-trek-ds9`, `sci-fi/firefly`, `video-games/mario`) for two
  members: Walter White's goatee (chin, below the mouth) and Hank Schrader's
  mustache (lip, above the mouth) — same recipe, different vertical offset
  and dims, listed once here to avoid repeating the idiom twice below.
- **Shared accessory recipe — half-rim reading glasses**: a variant of the
  rectangular-glasses recipe already documented in `tv-big-bang-theory`
  (two lens boxes + a bridge at the `face` anchor), here reduced to just the
  BOTTOM bar of each lens (no top rim, no visible temple arms) to match Gus
  Fring's specific half-rim readers — the only glasses-wearer in this pack.
- **Member-selection notes**: the survey's suggested eight (Walter White,
  Jesse Pinkman, Skyler White, Hank Schrader, Saul Goodman, Gus Fring, Marie
  Schrader, Walter White Jr.) checked out as the primary cast a casual fan
  names first — the five main-title Whites/Schraders plus the two breakout
  supporting characters popular enough to headline their own spinoff/prequel
  (Saul, and Gus as the season 3–4 arc's defining antagonist) — so it ships
  unchanged at 8 members, within the 5–12 rule with room to spare. Considered
  and OMITTED as secondary/supporting rather than primary cast: **Mike
  Ehrmantraut** (fan-favorite recurring fixer, but a season-3+ arrival and
  secondary to the two kingpins he serves), **Todd Alquist** and **Lydia
  Rodarte-Quayle** (final-season antagonists, not primary), **Tuco Salamanca**
  and the **Cousins** (early/mid-series antagonists), and **Badger** /
  **Skinny Pete** / **Combo** (Jesse's one-note friend-group, background
  ensemble). None of these are one-episode nobodies, but none are named
  before the core 8 by a casual viewer either.
- A note on **Walter White Jr. / "Flynn"**: his single most defining visual
  trait on the show is that he walks on forearm crutches (the actor's own
  cerebral palsy informed the character's). This pack represents that
  honestly with a crutch prop rather than omitting it or quietly writing
  around it — see his entry and Rig gaps below for the animation limitation
  that comes with a static prop bolted onto a generic two-leg walk cycle.

## Members

### 1. `walter-white-heisenberg` — "Balding science teacher (goatee, dark porkpie hat)"

**Reference**: A mild-mannered high-school chemistry teacher who builds a
meth empire under the alias "Heisenberg" — shaved bald head, goatee, dark
sunglasses, and (the single most iconic prop of the whole show) a black
pork-pie hat, worn once he fully steps into the Heisenberg persona. (Walter
White.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xe4c39c
body: 0x1c1c1c       // black jacket/windbreaker
legColor: 0x2b2b2b    // dark grey/black trousers
shoe: 0x141414
eyes: 'shades'        // dark sunglasses — no visible eyes underneath
emI: 0
limbR: 1.0
```

**Accessories**
- **crown** — the black pork-pie hat: a short flat-topped cylinder
  (`r≈78, h≈40mm`, `0x141414`) sitting on the bare scalp, plus a slightly
  wider, thin flat-brim cylinder (`r≈98, h≈10mm`, same color) just beneath
  it. No hair accessory at all elsewhere on the head — the baldness itself is
  a primary read, so `crown` is otherwise empty.
- **face** — the goatee (shared facial-hair recipe): a small flattened box
  at the chin, ~`46×26×16mm`, `0x2e2a26` (dark salt-and-pepper brown-grey).
- **chest** — a thin dark lapel/collar hint (`~TORSO_W*0.5 × 26 × 8mm`,
  `0x141414`) at the jacket's open collar, a shade darker than `body` so the
  jacket reads as having a slight structured collar rather than a flat shirt.

**Silhouette check**: bald head (no crown hair) + black flat pork-pie hat +
goatee + opaque shades is unmistakable even before the black-on-black
costume registers — the pork-pie silhouette alone is the show's own visual
shorthand for "Heisenberg."

**Personality**: `bobMul: 0.9, swayMul: 0.7, cadenceMul: 0.95, ampMul: 0.85`
(a controlled, deliberate, faintly menacing walk — measured rather than
casual)
**Bubbles**: `🧪⚗️💰😎` (chemistry/lab work, the flask, the money it's all
for, cold confidence)

---

### 2. `jesse-pinkman-hoodie` — "Young partner (beanie, mustard hoodie, baggy jeans)"

**Reference**: Walt's former student turned meth-cook partner — young,
scrappy, and visually defined across the early/most iconic seasons by a
knit beanie and a bright mustard-yellow zip hoodie over deliberately baggy
jeans. (Jesse Pinkman.)

**Spec**
```
sk: 0.95
headR: 122
headShape: 'sphere'
skin: 0xdab08c
body: 0xf2c230       // mustard-yellow zip hoodie
legColor: 0x5a6b84    // faded/baggy blue-grey denim
shoe: 0xd8d8d0        // light sneakers
eyes: 'dots'
emI: 0
limbR: 0.9
footMul: [1.15, 1.0, 1.15]   // baggier sneaker silhouette
```

**Accessories**
- **crown** — the knit beanie: a flattened dome cap, ~`128×48×128mm`,
  `0x2a2a2a` (charcoal knit), plus a thin contrasting band accessory around
  the base (`~R=66, tube=10mm`, `0xb01c24` red), matching one of his several
  recurring red/black beanies.
- **chest** — the hoodie's kangaroo pocket: a shallow proud box on the lower
  torso, ~`TORSO_W*0.55 × TORSO_H*0.28 × 10mm`, a slightly darker mustard
  `0xc99a1e` than `body` (coincident-face rule — a few mm proud).
- **neck** — two thin hanging cylinders either side of the collar
  (`r≈4mm, h≈70mm`, `0xc99a1e`) reading as the loose hoodie drawstrings.

**Silhouette check**: the beanie + solid mustard hoodie + baggy faded denim
is the single most repeated Jesse silhouette across the whole series —
recognizable even before the hoodie's pocket or drawstrings register.

**Personality**: `bobMul: 1.05, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.1`
(restless, jumpy energy — quicker steps, more sway than the rest of the
pack)
**Bubbles**: `🧪😬💨🎮` (amateur chemistry pride, anxiety, smoke, couch/
video-game downtime)

---

### 3. `skyler-white-blazer` — "Wife and bookkeeper (blue blouse, golden-brown hair)"

**Reference**: Walt's wife, a former English-lit hopeful turned the family's
increasingly overwhelmed bookkeeper — golden-brown hair usually worn loose
or in a low ponytail, a silver beaded necklace, and (in her pre-turn,
most-iconic look) cool blue blouses/cardigans over practical slacks; the show
visually cools her palette toward grays and blacks as the series darkens.
(Skyler White.)

**Spec**
```
sk: 0.88
headR: 118
headShape: 'sphere'
skin: 0xe8c4a0
body: 0x3f6d95       // cool blue blouse/cardigan
legColor: 0x8a8a90    // grey slacks
shoe: 0x3a2a1a
eyes: 'dots'
emI: 0
limbR: 0.85
```

**Accessories**
- **crown** — golden-brown shoulder-length hair with a side part: a
  flattened sphere-cap, ~`138×76×138mm`, `0x6b4a2c`, tilted back so the front
  rim clears the brow.
- **head** — two side-lobes for hair falling past the shoulders,
  ~`40×80×30mm` each, same `0x6b4a2c`.
- **chest** — a thin silver necklace: a small ring accessory at the neckline
  (`R≈28, tube≈4mm`), `0xc0c0c0`, sitting just above the blouse collar.

**Silhouette check**: cool blue blouse + golden-brown loose hair + the
silver necklace glint reads as pre-turn Skyler; the blue-vs-purple hue alone
keeps her instantly distinct from Marie at a glance.

**Personality**: `bobMul: 0.95, swayMul: 0.8, cadenceMul: 0.95, ampMul: 0.85`
(composed, guarded, controlled — the opposite energy of Marie's showier
walk)
**Bubbles**: `📊😟🚬🛁` (household ledgers/bookkeeping stress, worry, her
recurring stress-cigarette habit, a rare quiet escape)

---

### 4. `hank-schrader-dea` — "DEA agent (stocky, mustache, orange shirt, holster)"

**Reference**: Walt's brother-in-law, a boisterous, macho DEA agent whose
investigation (unknowingly) closes in on Heisenberg all series — a stocky,
broad build, a thick mustache, a wardrobe of earth-tone (orange/brown/tan)
button and bowling shirts, and a badge-and-holster belt he's rarely without.
Off-duty, an enthusiastic mineral/rock collector. (Hank Schrader.)

**Spec**
```
sk: 1.08
headR: 128
headShape: 'sphere'
skin: 0xd9a066
body: 0xb5651d       // burnt-orange button/bowling shirt
legColor: 0x6b6f74    // grey slacks
shoe: 0x1c1c1c
eyes: 'dots'
emI: 0
limbR: 1.15          // broad, stocky build
```

**Accessories**
- **crown** — short, neat dark-brown cropped hair, a low flattened cap,
  ~`128×32×128mm`, `0x3a2a1c`.
- **face** — the mustache (shared facial-hair recipe): a thick flattened box
  just above the mouth, ~`80×26×14mm`, `0x3a2a1c` matching the hair.
- **hip** — the DEA belt rig: a chunky dark holster box on one hip
  (`~70×90×30mm`, `0x1c1c1c`) plus a small gold badge-glint accent
  (`~30×20×6mm`, `0xd4af37`) on the belt front, proud of the trousers.

**Silhouette check**: the broadest, stockiest build in the pack (`sk 1.08`,
`limbR 1.15`) plus the mustache plus a saturated orange/brown shirt plus the
hip holster is unmistakably "the tough DEA brother-in-law" — any two of
these alone already read as Hank.

**Personality**: `bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.1`
(a confident, macho swagger — bigger, more energetic steps than the rest of
the family)
**Bubbles**: `🪨😂🍺🎣` (his mineral-collecting hobby, loud laughing at his
own jokes, beer with the guys, fishing)

---

### 5. `saul-goodman-suit` — "Strip-mall lawyer (loud suit, purple shirt, gold jewelry)"

**Reference**: The family's fast-talking, morally elastic criminal-defense
lawyer (later, in his own prequel, seen building toward this persona) —
loud, brightly colored/patterned suits, a purple or lilac dress shirt
underneath, slicked-back hair, and gaudy gold jewelry. (Saul Goodman.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0xe8c4a0
body: 0xc9962c       // bold mustard suit jacket (pattern approximated as solid — see Rig gaps)
legColor: 0xc9962c    // matching suit trousers
shoe: 0x5a3a1e
eyes: 'dots'
emI: 0
limbR: 0.95
```

**Accessories**
- **crown** — slicked-back thinning hair, a low flattened cap,
  ~`120×26×120mm`, `0x4a3a2a`.
- **chest** — the purple dress shirt peeking above the suit lapels: a
  V-shaped collar wedge, ~`TORSO_W*0.42 × 46 × 8mm`, `0x7a4a9c`, plus a thin
  diagonal loud-tie hint (a rotated box, `~90×22×6mm`, `rotation.z≈0.5`,
  bright red-orange `0xd9531e`) — the "louder than a lawyer needs to be"
  read.
- **hand** — gold jewelry: a small gold sphere ring accessory on `handR`
  (`r≈14mm`, `0xd4af37`) and a thin gold cuff-cylinder on the same wrist
  (`r≈20, h≈18mm`, same color).

**Silhouette check**: the bold mustard suit + purple shirt collar peek + the
gold hand-glint reads instantly as "the flashy strip-mall lawyer" —
distinguished from Gus's business look by loud vs. muted color and from
Hank's earth tones by saturation alone.

**Personality**: `bobMul: 1.05, swayMul: 1.15, cadenceMul: 1.05, ampMul: 1.1`
(a fast-talking hustler's strut)
**Bubbles**: `💰📞⚖️😬` (money, his ever-ringing burner phones, the
courtroom he skirts around, a nervous grin)

---

### 6. `gus-fring-manager` — "Fried-chicken franchise manager (yellow shirt, khakis, half-rim glasses)"

**Reference**: The soft-spoken, meticulously composed owner of a fried-
chicken chain who is secretly the region's dominant meth distributor — a
yellow dress shirt with a black tie, khaki trousers, half-rim reading
glasses, and close-cropped greying hair; famous for never once breaking his
calm, buttoned-up civilian persona. (Gus Fring.)

**Spec**
```
sk: 1.0
headR: 124
headShape: 'sphere'
skin: 0x8a5a3c
body: 0xd9c94a       // yellow dress shirt
legColor: 0xb8a074    // khaki trousers
shoe: 0x5a3a1e
eyes: 'dots'
emI: 0
limbR: 1.0
```

**Accessories**
- **crown** — short, close-cropped greying hair, a low flattened cap,
  ~`122×24×122mm`, `0x8a8a8a` (salt-and-pepper grey).
- **face** — half-rim reading glasses (shared recipe, bottom-bar-only
  variant): two thin flat bars, `HEAD_R*0.42 × 10 × 6mm` each, sitting just
  BELOW eye height (no top rim, no bridge box above), `0x1c1c1c`, connected
  by a very thin bridge (`HEAD_R*0.12 × 6 × 4mm`).
- **chest** — a thin black tie: a vertical box down the shirt center,
  ~`26×160×8mm`, `0x1c1c1c`, proud of the yellow shirt.

**Silhouette check**: the flat yellow shirt + black tie + khakis + half-rim
glasses + an almost unnaturally upright, still posture reads as "the calm
businessman" even before a viewer registers who he secretly is —
distinguished from Saul's loud suit by muted solid color and near-total
stillness.

**Personality**: `bobMul: 0.7, swayMul: 0.5, cadenceMul: 0.9, ampMul: 0.6`
(unnervingly measured and controlled — deliberately the least "loose" walk
in the whole pack)
**Posture**: `pitch: -0.03` (a faint backward/rigid lean — stiffly upright)
**Bubbles**: `🍗📋😐💵` (the fried-chicken business, meticulous management,
an unreadable poker face, the empire it's covering for)

---

### 7. `marie-schrader-purple` — "Hank's wife (purple, everything, big wavy hair)"

**Reference**: Skyler's sister and Hank's wife, a radiologic technologist
defined almost entirely by one running visual joke: she wears purple, in
every shade, on nearly every article of clothing, in nearly every scene —
plus big wavy/permed hair and a chatty, larger-than-life presence (and a
quietly running kleptomania habit). (Marie Schrader.)

**Spec**
```
sk: 0.85
headR: 116
headShape: 'sphere'
skin: 0xe8c4a0
body: 0x7a3f9c       // purple blouse/cardigan
legColor: 0x8a5ab0    // lighter purple slacks/skirt
shoe: 0x5a2f7a        // purple flats
eyes: 'dots'
emI: 0
limbR: 0.85
```

**Accessories**
- **crown** — big wavy/permed reddish-brown hair: a wide flattened cap
  (~`150×70×150mm`, `0x5a3a26`) topped with 2 overlapping smaller spheres
  (`r≈HEAD_R*0.3` each, same color) for extra curl volume — a bigger, fuller
  silhouette than any other hair in the pack.
- **hip** — a darker purple belt/accent band, thin box, `0x4a1f6c`.
- **hand** — a small handbag prop on `handL` (`~50×60×24mm`, tan
  `0xc9a06a`), a light nod to her kleptomania habit without depicting an
  actual stolen object.

**Silhouette check**: head-to-toe monochrome purple (blouse, slacks, shoes,
belt) is instantly "Marie" — the hue alone separates her from Skyler's cool
blues even at a glance, before the bigger hair volume registers.

**Personality**: `bobMul: 1.1, swayMul: 1.2, cadenceMul: 1.1, ampMul: 1.05`
(the most animated, chatty walk in the pack)
**Bubbles**: `💜🏠😤👜` (her favorite color, her real-estate/home-décor
enthusiasm, exasperation, the handbag/kleptomania nod)

---

### 8. `walt-jr-flynn` — "Teen son on crutches (varsity jacket, cheerful)"

**Reference**: Walt and Skyler's teenage son, who has cerebral palsy and
walks on forearm crutches — an upbeat, well-liked, football-loving high
schooler known for his good humor, his oversized breakfast requests, and
(later in the series, after learning the truth) adopting the alias "Flynn."
The crutches are his single most consistent, defining visual trait
throughout the show. (Walter White Jr.)

**Spec**
```
sk: 0.85
headR: 118
headShape: 'sphere'
skin: 0xe4bf98
body: 0x36536b       // navy varsity/letterman-style jacket
legColor: 0x3a4a63    // jeans
shoe: 0xd8d8d0        // white sneakers
eyes: 'dots'
emI: 0
limbR: 0.95
```

**Accessories**
- **crown** — short, neat brown hair, a low flattened cap, ~`120×28×120mm`,
  `0x3a2416`.
- **chest** — a varsity stripe accent: a horizontal band across the upper
  chest, ~`TORSO_W*0.9 × 26 × 8mm`, cream `0xe8e4da`, proud of the navy
  jacket.
- **handL** + **handR** — forearm crutches (the defining prop, approx — see
  Rig gaps): a thin vertical cylinder each (`r≈10, h≈420mm`, `0xb0b0b0`
  brushed grey-metal) reaching from hand to ground, with a small horizontal
  cuff ring near the top of each (`R≈30, tube≈8mm`, same color) suggesting
  the forearm cuff.

**Silhouette check**: the pair of forearm crutches is a completely unique
prop in this whole pack — it reads as Walt Jr./Flynn on its own, before the
navy jacket color even registers, satisfying the silhouette test through
prop shape rather than costume color alone.

**Personality**: `bobMul: 1.0, swayMul: 0.9, cadenceMul: 0.95, ampMul: 0.9`
(kept close to a normal cheerful teen gait — see Rig gaps for the honest
limitation on a true crutch-supported walk cycle)
**Bubbles**: `🍳🥓😊🎮` (his famously huge breakfast orders, bacon, a
cheerful smile, video games)

## Rig gaps

- **No mobility-aid gait accommodation (new gap — checked ROADMAP.md § Avatar
  rig gaps first; not currently listed).** `walt-jr-flynn`'s crutches are
  static hand-held props bolted onto the SAME generic two-leg bipedal walk
  cycle every other humanoid uses (hip/knee swing, arm counter-swing,
  vertical bob) — the rig has no three-point crutch-gait variant (crutches
  advance with alternating legs, weight-bearing shifts through the arms,
  torso lean pattern differs from a natural stride). The static prop is a
  respectful, honest visual nod to the character's most consistent trait
  rather than an attempt to simulate the actual gait; a genuine "mobility
  aid" gait mode (paired with the existing `quad`-style alternate-pose
  system) would generalize to any future character who uses a cane, crutch,
  or wheelchair. Flagged rather than silently worked around.
- **No fabric-pattern/print support** (already parked in `ROADMAP.md` §
  Avatar rig gaps — "deliberately against the no-texture house style"). This
  pack surfaces it once, on `saul-goodman-suit`: his canonical suits are
  usually a bold plaid, approximated here as a solid saturated color instead
  (the same approximation `tv-big-bang-theory` used for Howard's checked
  shirts and Raj's argyle vest).
- **No `collar` anchor** (already parked via `tv-big-bang-theory`'s Rig
  gaps). `gus-fring-manager`'s shirt-and-tie neckline and `hank-schrader-
  dea`'s open shirt collar are both approximated as small boxes bolted to
  the top of the `chest` anchor rather than a true neck-wrapping band.

None of the above blocked shipping a member — all eight have a complete,
distinguishable spec using only the current rig's primitives and anchors.

## Sources

- [Breaking Bad: Here's How Walt's Clothes Showed His Heisenberg Transformation — ScreenRant](https://screenrant.com/breaking-bad-walter-white-heisenberg-clothes-transform/)
- [The Walter White Hat | All About Pork Pie Heisenberg Hats — Nimble Made](https://www.nimble-made.com/blogs/news/walter-white-hat)
- [An Epic Timeline Of Wardrobe Colors In "Breaking Bad" — Fast Company](https://www.fastcompany.com/1673264/an-epic-timeline-of-breaking-bads-wardrobe-colors)
- [How to Dress Like Heisenberg (Walter White) — Medium](https://medium.com/@outfits-hub/how-to-dress-like-heisenberg-walter-white-ff6639638771)
- [How to Dress Like Jesse Pinkman — TV Style Guide](https://www.tvstyleguide.com/breaking-bad/jesse-pinkman/how-to-dress-like-jesse-pinkman/)
- [Breaking Bad: Jesse Pinkman's 10 Best Hoodies Ranked — ScreenRant](https://screenrant.com/jesse-pinkman-best-hoodie-breaking-bad/)
- [Jesse Pinkman's Breaking Bad Style — Elemental Spot](https://elementalspot.com/jesse-pinkmans-breaking-bad-style/)
- [Colors — Breaking Bad Wiki (Fandom)](https://breakingbad.fandom.com/wiki/Colors)
- [Timeline: Skylar White's Color Scheme in Season 5 of Breaking Bad — Timetoast](https://www.timetoast.com/timelines/skylar-white-color-scheme)
- [Breaking Bad: Walter White Wearing Beige Has More Meaning Than Fans Realize — Cheat Sheet](https://www.cheatsheet.com/news/breaking-bad-walter-white-wearing-beige-has-more-meaning-than-fans-realize.html/)
- [Make Your Own Hank Schrader from Breaking Bad Costume — Carbon Costume](https://carboncostume.com/hank-schrader-from-breaking-bad/)
- [How to Dress Like Hank Schrader (Breaking Bad) — TV Style Guide](https://www.tvstyleguide.com/breaking-bad/how-to-dress-like-hank-schrader/)
- [Hank Schrader — Wikipedia](https://en.wikipedia.org/wiki/Hank_Schrader)
- [Saul Goodman's Best Suits In Better Call Saul, Ranked — Looper](https://www.looper.com/1100039/saul-goodmans-best-suits-in-better-call-saul-ranked/)
- [Steal His Look: Saul Goodman Costumes (from Better Call Saul & Breaking Bad)](https://stealhislook.club/steal-his-look-saul-goodman-costumes-from-better-call-saul-breaking-bad/)
- [Better Call Saul (2015): Breaking Down Saul Goodman's Iconic Fashion Choices — Beyond Pop Culture](https://beyondpopculture.com/better-call-saul-2015-breaking-down-saul-goodmans-iconic-fashion-choices/)
- [How to Dress Like Gus Fring (Breaking Bad) — TV Style Guide](https://www.tvstyleguide.com/breaking-bad/how-to-dress-like-gus-fring/)
- [Dress Like Gus Fring Costume — Costume Wall](https://costumewall.com/dress-like-gus-fring/)
- [Breaking Bad: Why Marie Schrader Always Wears Purple — ScreenRant](https://screenrant.com/breaking-bad-marie-schrader-purple-clothes-why/)
- [Breaking Bad: Why Marie Schrader Always Wears Purple — IMDb](https://www.imdb.com/news/ni64017186/)
- [Marie Schrader: Beyond Kleptomania in Breaking Bad — Factual America](https://www.factualamerica.com/breaking-bad/marie-schrader-more-than-just-a-kleptomaniac-in-breaking-bad)
- [Walter White Jr. — Wikipedia](https://en.wikipedia.org/wiki/Walter_White_Jr.)
- [Walter White Jr. — Breaking Bad Wiki (Fandom)](https://breakingbad.fandom.com/wiki/Walter_White_Jr.)
- Diorama source reference (existing rig conventions, anchors, glasses/
  facial-hair accessory recipes, `SPECS` table, per-kind accessory recipes):
  `src/three-renderer.ts` (`_buildHumanoid`, `AVATAR_KINDS`,
  `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`); prior pack docs
  `docs/avatars/pop-culture/tv-big-bang-theory.md`,
  `docs/avatars/sci-fi/star-trek-ds9.md`, and `docs/ROADMAP.md` § "Avatar rig
  gaps" for anchor/recipe precedent and gap-triage cross-checking.
