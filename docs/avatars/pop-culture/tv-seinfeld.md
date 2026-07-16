# Avatar pack: Pop-Culture ▸ TV ▸ Seinfeld

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color/proportions read as the character archetype, not a likeness.
No logos, no printed text, no character names anywhere in-scene; identity
lives only in this doc's Reference lines and the pack's display labels (which
use descriptive-generic wording, e.g. "The Neighbor (wild hair, vintage
shirt)").

## Overview

- **Group**: The core "show about nothing" cast plus four recurring
  supporting players from *Seinfeld* (1989–1998) — a Manhattan comedian and
  his three closest friends, plus the mailman-nemesis, the soup-stand tyrant,
  the on-again girlfriend's boyfriend, and the overbearing uncle who orbit
  their apartment-building/coffee-shop world. The show's visual comedy is
  **flat, deadpan 90s normcore punctuated by one loud signifier per
  character** (Kramer's hair, Elaine's dance/hair, George's dome, Puddy's
  jacket, the Soup Nazi's toque) — this pack leans on the same anchor points
  other packs use for costume reads: `crown` (hair/hats), `head` (side
  hair/ears), `face` (glasses/mustache), `chest`/`torso-front` (shirt layer +
  emblem/patch accents), `back` (jacket-back emblem), `hip` (belt/mailbag).
- **Hierarchy path**: `pop-culture / tv / seinfeld`
- **Member count**: 8
- **Rig**: humanoid only (no quadrupeds in this pack — Elaine's ex-boyfriend's
  dog and the Alaskan pipeline sled dogs are one-off gags, not core cast)
- **Design call — fixed costume colors, not sensor-tint carriers**: like
  `sci-fi/star-trek-tng` and `pop-culture/tv/big-bang-theory`, this is a
  named-character homage, not a generic archetype pack — "which specific
  regular is this" lives in a fixed per-member palette (Jerry's bright solid
  button shirts, Kramer's rust/vintage tones, Elaine's coral florals, Puddy's
  black leather). `skin`/`body`/`legColor` are FIXED hex values per member,
  not `tint`. If per-sensor color coding matters for a given deployment,
  recolor a small accent piece instead (tie, buckle, hair) — none of the
  members below use a tint carrier by default.
- **Shared palette note — 90s NYC normcore**: the baseline silhouette for the
  four principals is deliberately plain — solid-color button shirts or
  blouses, straight-leg jeans, white or neutral sneakers, no logos/patterns —
  so that the ONE loud signifier per character (hair volume, glasses, a
  jacket emblem, a toque) reads clearly against a quiet background instead of
  competing with a busy outfit. Supporting players get one occupational/prop
  signifier each (postal uniform, chef's whites, leather jacket, cardigan).
- **The puffy shirt note**: in "The Puffy Shirt" (S5E2), Jerry is talked into
  wearing an enormous pirate-style shirt with balloon sleeves and a huge
  collar on national television ("I don't want to be a pirate!"). This is
  modeled as an OPTIONAL alt-costume accessory swap on Jerry's member (see
  below), not a separate pack member — swap it in for a themed/costume-day
  variant, default is the plain button shirt.

## Members

### 1. `comedian-jerry` — "The Comedian (button shirt, dad jeans, white sneakers)"

**Reference**: A Manhattan stand-up comedian whose apartment and life are the
show's hub — signature look is a plain, brightly-colored button-up shirt
tucked into straight-leg jeans (black or mid-wash denim) with clean white
sneakers; the most consistently "normal-looking" of the whole cast, on
purpose. (Jerry Seinfeld.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xe0b090
body: 0x3a7ab8       // solid bright blue button shirt (rotate any solid bright hue — see note)
legColor: 0x22283a    // black/dark denim jeans
shoe: 0xf5f5f0        // white sneakers
eyes: 'dots'
emI: 0
limbR: 0.95
hands: 'sphere'
```
Note: Jerry's button shirts rotate through many solid bright/pastel colors
episode to episode (never a print) — `0x3a7ab8` is a representative default;
any single solid saturated-to-pastel hue reads correctly for this member.

**Accessories**
- **crown** — short, neat dark brown hair, a low flattened cap,
  ~`128×34×128mm`, `0x2e1c12`, front rim above the brow.
- **OPTIONAL alt "puffy shirt" swap** (costume-day variant, replaces the
  plain `body` shirt read): a large rounded torso overshirt
  (`TORSO_W*1.3 × TORSO_H*1.1 × TORSO_D*1.2`, off-white `0xf2ede0`) plus two
  oversized balloon-sleeve spheres at the shoulders (`~r = ARM_R*2.2`, same
  off-white) and a wide ruffled collar disc at the neckline (flattened
  cylinder, `R = HEAD_R*0.9`, same off-white). Swap in whole-cloth for the
  plain shirt; do not combine with it.

**Silhouette check**: the plainest, most "normal" silhouette in the pack by
design — deliberately unremarkable so the white sneakers + solid bright shirt
read as "the straight man" against the louder friends around him. The puffy
shirt swap is the one alt-look gag reference if a costume variant is wanted.

**Personality**: `bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.0, ampMul: 0.9`
(an easy, observational-comic saunter — nothing exaggerated)
**Bubbles**: `🥨🚗🃏🧴` (New York snacking/cereal obsession, "Newman!" car
gags, comedy-bit deadpan asides, germaphobe hand-cleanliness)

---

### 2. `friend-george` — "The Friend (bald dome, glasses, short & stocky)"

**Reference**: Jerry's short, stocky, perpetually anxious best friend —
balding on top with close-cropped side hair, large dark-framed glasses, and a
wardrobe of jeans/khakis with sneakers; defined by chronic insecurity,
scheming, and a habit of digging himself into holes. (George Costanza.)

**Spec**
```
sk: 0.85
headR: 132
headShape: 'sphere'
skin: 0xe0b090
body: 0x6a7a5a       // muted olive/khaki button shirt or jacket
legColor: 0x3a4552    // stone-grey jeans/trousers
shoe: 0xece8dc        // off-white sneakers
eyes: 'dots'
emI: 0
limbR: 1.15           // stocky build
armL: 0.95
legL: 0.92
```

**Accessories**
- **face** — large dark-framed glasses: two flat lens boxes,
  `HEAD_R*0.42 × HEAD_R*0.3 × 8mm` each, centered at eye height and offset
  `±HEAD_R*0.5`, plus a thin bridge box (`HEAD_R*0.12 × 8mm × 6mm`), frame
  `0x1a1410` (near-black) — REQUIRED, George is rarely seen without them.
- **head** — thinning side/back hair only (bald dome on top): two small
  flattened wedge boxes hugging the head above the ears and around the back,
  `~40×26×70mm` each, `0x2e2016` (dark brown), leaving the crown bare.
- **crown** — intentionally empty (bald top is the point) — do not add a
  hair piece here for the default look.

**Silhouette check**: the bald dome (empty `crown`) + heavy dark glasses on
a short, stocky (`sk 0.85`, `limbR 1.15`) frame is the one thing — reads
instantly even before the anxious idle-fidget posture does.

**Personality**: `bobMul: 0.9, swayMul: 1.1, cadenceMul: 1.05, ampMul: 0.85`
(a slightly harried, defensive walk — quick, a little hunched)
**Bubbles**: `😤🥪🛋️🎭` (frustrated exasperation, food/snacking schemes,
unemployed couch-lounging, "art of the lie" scheming)

---

### 3. `neighbor-kramer` — "The Neighbor (tall wild hair, vintage shirt, entrance slide)"

**Reference**: Jerry's eccentric across-the-hall neighbor — tall, gangly,
famous for his gravity-defying swept-up hair, loud vintage 1950s-style
bowling/camp shirts in rust and warm tones, thrift-store trousers, and his
signature high-velocity sliding entrance through Jerry's apartment door.
(Cosmo Kramer.)

**Spec**
```
sk: 1.18
headR: 120
headShape: 'sphere'
skin: 0xe0b090
body: 0xb8492a       // rust/brick vintage camp shirt (rotate loud warm solids — see note)
legColor: 0x4a4640    // charcoal-grey trousers
shoe: 0x6a4a30        // brown loafers
eyes: 'dots'
emI: 0
limbR: 0.85           // lanky, loose-limbed build
armL: 1.08
legL: 1.1
```
Note: Kramer's shirts rotate through many loud vintage solids (rust, mustard,
teal, olive) — `0xb8492a` is a representative default; any single bold warm
hue reads correctly.

**Accessories**
- **crown** — tall wild upswept hair: a cluster of 3 irregular vertical
  cone/sphere shapes rising off the top of the head (~`base r = HEAD_R*0.5,
  height 90–140mm` each, staggered heights, slight outward splay),
  `0x1c1712` (near-black), the single tallest hair silhouette in the pack —
  should visibly break the head's bounding sphere from every angle.
- **hip** — loose, untucked shirt hem hint: a slightly flared box skirt
  around the lower torso (`TORSO_W*1.05 × TORSO_H*0.18 × TORSO_D*1.05`), same
  `body` color, reinforcing the "shirt worn loose/open" read.

**Silhouette check**: the tall vertical hair spikes alone silhouette as
"Kramer" from across a room, even in profile — no other member in this or
prior packs has hair breaking the head silhouette this aggressively upward.

**Personality**: `bobMul: 1.15, swayMul: 1.3, cadenceMul: 1.35, ampMul: 1.2`
(the fastest, loosest, most physically extravagant walk in the pack — high
cadence for the signature slide-through-the-door entrance energy)
**Bubbles**: `🍿🚬🕺💡` (fruit/junk-food schemes, cigars, wild get-rich-quick
scheme energy, sudden "I've got it!" ideas)

---

### 4. `ex-elaine` — "The Ex (big curly hair, floral blouse, little-kicks dance)"

**Reference**: Jerry's ex-girlfriend, now one of his closest friends — known
for voluminous curly dark hair, floral-print blouses, an assertive
independent streak, and a legendarily awkward stiff-armed dance ("The Little
Kicks"). (Elaine Benes.)

**Spec**
```
sk: 0.95
headR: 118
headShape: 'sphere'
skin: 0xe0b090
body: 0xc9524a       // coral/rose blouse (stand-in base for floral print — see Rig gaps)
legColor: 0x262230    // dark trousers/skirt
shoe: 0x2e2a2a        // black chunky flats
eyes: 'almond'
emI: 0
limbR: 0.85
armL: 0.95
```

**Accessories**
- **crown** — big curly dark hair volume: a large flattened sphere cluster
  fuller than any other pack member's, `~150×100×150mm`, `0x2a1a10`
  (dark brown/near-black), tilted back so the front rim clears the brow.
- **chest** — small floral accent: a cluster of 4–5 tiny colored spheres
  (`r ≈ 10mm`, alternating `0xe8a0b0` pink / `0xdec95a` yellow) grouped near
  one shoulder as a corsage-style hint of the blouse's floral print (see Rig
  gaps — approximation only, not a repeating pattern).

**Silhouette check**: the oversized curly-hair volume + solid bright blouse
color is the one thing that reads at 30 px; the floral accent cluster is a
close-up bonus, not load-bearing.

**Personality**: `bobMul: 1.1, swayMul: 1.4, cadenceMul: 1.05, ampMul: 1.15`
(elevated sway/bob multipliers specifically to hint her stiff, jerky "little
kicks" dance energy even in the ordinary walk cycle)
**Bubbles**: `💅📞😂👠` (assertive independence, gossiping on the phone,
sharp sarcastic wit, career/fashion-forward energy)

---

### 5. `rival-newman` — "The Rival (postal uniform, heavyset, mailbag)"

**Reference**: Kramer's close friend and Jerry's self-declared arch-nemesis —
a disheveled, scheming U.S. Postal Service mail carrier, heavyset with a
rumpled uniform, who Jerry describes as his own "Lex Luthor." (Newman.)

**Spec**
```
sk: 1.02
headR: 128
headShape: 'sphere'
skin: 0xe0b090
body: 0x5a6a7a       // postal blue-grey uniform shirt
legColor: 0x384552    // matching uniform trousers
shoe: 0x232323        // black shoes
eyes: 'dots'
emI: 0
limbR: 1.3            // heavyset build
armL: 0.95
legL: 0.92
```

**Accessories**
- **crown** — thinning hair combed flat: a thin, low flattened cap covering
  only the top-center, `~110×20×110mm`, `0x3a2a1a` (dark brown), leaving the
  sides visible (not fully bald like George — thinning, not domed).
- **chest** — postal patch/badge: a small rectangular emblem box,
  `~34×26×6mm`, gold `0xc9a227`, on the upper chest.
- **hip** — a slung mailbag: a flattened box/cylinder combo hanging at the
  hip on a diagonal strap (strap = thin box across the torso, `0x4a3a2a`;
  bag = `~110×90×50mm` box, canvas tan `0x9a8a64`).

**Silhouette check**: the heavyset build (`limbR 1.3`, highest in the pack)
in blue-grey postal uniform with the slung mailbag reads as "the mailman"
instantly, distinguishing him at a glance from the leaner principal cast.

**Personality**: `bobMul: 1.05, swayMul: 1.0, cadenceMul: 0.85, ampMul: 0.8`
(a slower, heavier, faintly self-satisfied plod — never in a hurry)
**Bubbles**: `📬😈🍔🗝️` (mail/postal scheming, villainous glee, junk food,
sneaking into places he shouldn't be)

---

### 6. `chef-soupstand` — "The Chef (tall toque, apron, stern mustache)"

**Reference**: The imperious, stone-faced proprietor of a Manhattan soup
stand, nicknamed for his intolerance of any deviation from his strict
ordering ritual — a thick dark mustache, immaculate chef's whites, and the
famous shouted refusal "No soup for you!" (Yev Kassem, "the Soup Nazi.")

**Spec**
```
sk: 1.05
headR: 124
headShape: 'sphere'
skin: 0xc99a72
body: 0xf0f0ec       // white chef's coat
legColor: 0x2a2a2a    // black trousers
shoe: 0x1c1c1c
eyes: 'dots'
emI: 0
limbR: 1.05
```

**Accessories**
- **crown** — tall white chef's toque: a wide cylinder,
  `R = HEAD_R*0.8, height = 130mm`, off-white `0xf5f5f0`, sitting upright on
  the crown (not tilted — this one should stand tall and formal, opposite of
  Kramer's spike cluster).
- **face** — thick dark mustache: a flattened, slightly curved box beneath
  the nose, `~60×16×14mm`, near-black `0x171310`.
- **torso-front** — white bib apron: a flat rectangular panel proud of the
  chest, `TORSO_W*0.9 × TORSO_H*0.85 × 8mm`, off-white `0xf5f5f0`, with a
  thin dark waist-tie hint (`thin box, 0x2a2a2a`) at the bottom edge.

**Silhouette check**: the tall upright white toque + white apron over a
stern, still posture is the one thing — instantly reads as "commanding chef"
at any distance, no motion needed.

**Personality**: `bobMul: 0.6, swayMul: 0.4, cadenceMul: 0.85, ampMul: 0.55`
(rigid, minimal, almost military stillness — the opposite end of the pack's
movement spectrum from Kramer)
**Bubbles**: `🍲🚫😠📏` (soup obsession, "no soup for you" refusal, stern
temper, strict rule-following)

---

### 7. `boyfriend-puddy` — "The Boyfriend (black leather jacket, eight-ball, deadpan)"

**Reference**: Elaine's on-again/off-again boyfriend — a tall, broad,
perpetually deadpan mechanic best known for his black leather jacket with a
giant eight-ball emblem on the back, his devotion to a fast-food chicken
sandwich chain, and painting his whole face in team colors for hockey games.
(David Puddy.)

**Spec**
```
sk: 1.1
headR: 126
headShape: 'sphere'
skin: 0xe0b090
body: 0x1a1a1a       // black leather jacket
legColor: 0x1e1e1e    // black jeans
shoe: 0x232323
eyes: 'dots'
emI: 0
limbR: 1.1
```

**Accessories**
- **crown** — short, dark slicked-back hair: a tight low cap,
  ~`126×30×126mm`, `0x1c140e`.
- **back** — the eight-ball jacket emblem: a white sphere (`r ≈ 55mm`,
  `0xf5f5f0`) with a small black center disc (flattened cylinder, `r ≈ 22mm`,
  `0x141414`) centered on the jacket back — the pack's single most
  load-bearing prop.
- **OPTIONAL alt "game day" face paint** (situational variant, replaces
  plain `skin` on the face only — see Rig gaps for the swap mechanism this
  needs): three horizontal color bands across the face — black `0x141414`,
  red `0xb0202a`, green `0x1a5c34` — stacked thin flattened boxes at the
  `face` anchor. Default look has no face paint; use only for a themed
  "hockey game" variant.

**Silhouette check**: the black leather jacket with the white/black eight-ball
disc on the back is the one thing — deadpan stillness (low personality
multipliers, matching the chef) reinforces it but the jacket emblem alone
reads at 30 px.

**Personality**: `bobMul: 0.8, swayMul: 0.6, cadenceMul: 0.9, ampMul: 0.75`
(a cool, unbothered, minimal-affect saunter — Puddy's whole comedic point is
that nothing fazes him)
**Bubbles**: `🏒🥪😐🚗` (hockey fandom, fast-food-sandwich devotion,
unshakeable deadpan, car mechanic trade)

---

### 8. `uncle-leo` — "The Uncle (cardigan, glasses, arms-wide greeting)"

**Reference**: Jerry's boisterous, overbearing uncle — an older man in a
cardigan sweater with thinning grey hair and glasses, notorious for grabbing
people's arms mid-conversation and for his booming, arms-flung-open greeting
whenever he spots Jerry. (Uncle Leo.)

**Spec**
```
sk: 0.88
headR: 122
headShape: 'sphere'
skin: 0xdcb090
body: 0x8a3a3a       // maroon cardigan sweater
legColor: 0x4a4a4a    // grey slacks
shoe: 0x5a4a3a        // brown shoes
eyes: 'dots'
emI: 0
limbR: 1.05
armL: 0.95
legL: 0.9
```

**Accessories**
- **crown** — thinning grey hair, a sparse low cap only at the sides/back
  (bare on top, less domed than George — an older, wispier thinning rather
  than a clean bald pate): two small thin wedge boxes, `~36×18×60mm` each,
  `0xb0aca4` (grey), hugging the sides.
- **face** — glasses: two flat lens boxes, `HEAD_R*0.4 × HEAD_R*0.26 × 8mm`,
  offset `±HEAD_R*0.48`, plus a thin bridge, frame `0x3a2e22` (brown).
- **chest** — a cardigan button placket hint: 3 small round buttons (tiny
  flattened cylinders, `r ≈ 6mm`, `0x3a2e22`) down the center chest,
  reinforcing the cardigan (vs. plain shirt) read.

**Silhouette check**: the maroon cardigan + glasses on a shorter, older-coded
frame (`sk 0.88`) is the baseline read; the arms-wide "Jerry! Hello!" greeting
is a personality/animation trait more than a static-silhouette one — see Rig
gaps for a possible dedicated greeting one-shot.

**Personality**: `bobMul: 1.05, swayMul: 1.2, cadenceMul: 1.1, ampMul: 1.1`
(elevated across the board — an exuberant, arm-grabbing, larger-than-life
older-relative energy that shouldn't read as frail)
**Bubbles**: `👋😄🤝📰` (loud enthusiastic greetings, general boisterousness,
overly familiar arm-grabbing, retired-guy newspaper-reading between bouts of
being loud)

## Rig gaps

- **No fabric-pattern/print support** (expected — the rig is color+shape
  only, but this pack surfaces it directly: Elaine's signature look is
  specifically *floral-print* blouses, and Kramer's/Jerry's shirts are
  frequently patterned camp/bowling prints in the source material). Elaine's
  member approximates this with a solid coral base plus a small multi-color
  corsage-like accent cluster near one shoulder rather than a true repeating
  print — reads as "colorful decorated blouse" at 30 px but loses the
  specific floral repeat up close. Same gap already flagged in the
  `big-bang-theory` pack (Howard's turtleneck prints, Raj's argyle vest,
  Bernadette's floral skirt) — a generalized repeating-primitive "pattern"
  accessory (small shapes tiled across a chest/leg region) would serve all
  of these packs at once.
- **No situational costume/skin swap mechanism.** Two members in this pack
  canonically have a well-known ALTERNATE look tied to a specific episode/
  event rather than their everyday appearance: Jerry's puffy pirate shirt
  ("The Puffy Shirt") and Puddy's tri-color hockey face paint ("The Face
  Painter"). Both are written up above as "OPTIONAL alt" accessory
  swaps, but the rig/pack-generator has no first-class concept of a
  per-member alternate costume variant (e.g. selectable at avatar-pool
  config time, or triggered by a themed deployment) — today this would have
  to be modeled as a second, separately-`id`'d pack member if it needs to
  coexist with the default look at runtime. Worth a generalized "costume
  variant" concept if more packs want this (holiday outfits, alternate-timeline
  looks, etc.).
- **No dedicated "big arm-wave greeting" one-shot fidget.** Uncle Leo's
  defining physical bit — stopping dead, flinging both arms wide, and
  grabbing whoever's nearest — doesn't have a clean equivalent in the
  existing `IDLE_FIDGETS` one-shot pool (wave/stretch/cross_arms are close
  but none matches the specific "arms flung fully open toward another rig"
  motion). Approximated here via elevated `swayMul`/`ampMul` personality
  multipliers only. A literal "big greeting wave" one-shot (arms swept from
  down-and-in to fully splayed out, held ~1s) would generalize to other
  boisterous/showman archetypes beyond this pack.
- **No neck/collar anchor** (same gap already flagged in
  `big-bang-theory`): Uncle Leo's cardigan placket and the Soup Nazi's apron
  tie both get approximated as small boxes bolted to the `chest`/
  `torso-front` anchor's edge rather than a true neck-wrapping band. Not
  blocking here either, just recurring.

None of the above blocked shipping a member — all eight have a complete,
distinguishable spec using only the current rig's primitives and anchors.

## Sources

- [The 90s Are Back! Dress Like Jerry Seinfeld — He Spoke Style](https://hespokestyle.com/jerry-seinfeld-fashion-normcore/)
- [Normcore 101: How Seinfeld's Costumers Built One of TV's Most Iconic Wardrobes — InsideHook](https://www.insidehook.com/culture/how-seinfeld-costumers-built-normcore)
- [Seinfeld: 40 Significant Style Moments — BAMF Style](https://bamfstyle.com/2023/05/12/seinfeld-style-moments/)
- [George Costanza — Wikipedia](https://en.wikipedia.org/wiki/George_Costanza)
- [George Costanza's Glasses in the Seinfeld Pilot — Cracked](https://www.cracked.com/article_41029_george-costanzas-glasses-in-the-seinfeld-pilot-came-from-spike-lees-malcolm-x.html)
- ["Kramer brings back the look of the '50s" — Baltimore Sun](https://www.baltimoresun.com/1995/06/15/kramer-brings-back-the-look-of-the-50s/)
- [The Truth About Kramer's Ridiculous Clothes On Seinfeld — TheThings](https://www.thethings.com/michael-richards-kramer-ridiculous-clothes-seinfeld/)
- [The untold evolution of Elaine Benes in Seinfeld — NewsBytes](https://www.newsbytesapp.com/news/entertainment/seinfeld-s-elaine-benes-hidden-details-even-superfans-missed/story)
- [Elaine Benes is the original '90s powersuit inspiration — Fashion Journal](https://fashionjournal.com.au/fashion/elaine-benes-is-the-original-90s-powersuit-inspiration/)
- [Newman (Seinfeld) — Wikipedia](https://en.wikipedia.org/wiki/Newman_(Seinfeld))
- [The Soup Nazi — Wikipedia](https://en.wikipedia.org/wiki/The_Soup_Nazi)
- [Yev Kassem — WikiSein (Fandom)](https://seinfeld.fandom.com/wiki/Yev_Kassem)
- [Why We Still Love the David Puddy Eight Ball Jacket](https://david-puddy-eight-ball.pages.dev/posts/david-puddy-eight-ball/)
- ['Puddy' from Seinfeld shows up at Devils playoff game — Washington Post](https://www.washingtonpost.com/news/early-lead/wp/2018/04/19/puddy-from-seinfeld-shows-up-at-devils-playoff-game-and-yes-he-painted-his-face/)
- [Patrick Warburton brings back David Puddy and his face paint — Washington Post](https://www.washingtonpost.com/sports/2019/02/20/patrick-warburton-brings-back-david-puddy-his-face-paint-devils-game/)
- [Uncle Leo — Wikipedia](https://en.wikipedia.org/wiki/Uncle_Leo)
- ["Jerry! Hello!": Some of Len Lesser's Best Lines as Uncle Leo — Flavorwire](https://www.flavorwire.com/152832/len-lesser-seinfeld-uncle-leo-quotes)
- Diorama source reference (existing rig conventions, anchors, `SPECS`
  table, per-kind accessory recipes): `src/three-renderer.ts`
  (`_buildHumanoid`, `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`);
  prior pack docs `docs/avatars/pop-culture/tv-big-bang-theory.md` and
  `docs/avatars/sci-fi/star-trek-tng.md` for anchor/recipe precedent.
