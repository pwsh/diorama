# Avatar pack: Pop-Culture ▸ TV ▸ The IT Crowd

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no printed text, no character names anywhere in-scene; identity lives only in
this doc's Reference lines and the pack's display labels (which use
descriptive-generic wording, e.g. "IT technician (huge glasses, checked
shirt, tie)").

## Overview

- **Group**: the basement IT department (and, for two members, the executive
  floor above it) of the fictional Reynholm Industries, from Channel 4's
  *The IT Crowd* (2006–2013) — a workplace sitcom about the most neglected,
  windowless department in the building.
- **Hierarchy path**: `pop-culture / tv / it-crowd`
- **Member count**: 6
- **Rig**: humanoid only (no quadrupeds in this pack)
- **Design call — fixed costume colors, not sensor-tint carriers**: like the
  `sci-fi/star-trek-tng` and `pop-culture/tv/big-bang-theory` packs, this is
  a **named-character homage**, not a generic archetype pack — the point is
  "which specific character is this," which lives in a fixed, canonical
  costume palette per member (Moss's pale check shirt, Richmond's all-black,
  Jen's jewel-tone office wear, etc.). `skin`/`body`/`legColor` are therefore
  FIXED hex values per member, not `tint`. If per-sensor color coding matters
  for a given deployment, recolor a small accent piece instead (tie, hair,
  glasses frame) — none of the members below do this by default.
- **Shared style/palette — "beige basement vs. glass boardroom"**: the show's
  whole visual joke is a drab, unglamorous IT department (muted checks,
  faded band tees, fluorescent-lit beige) sitting one floor below a shiny,
  self-important executive suite (sharp black/jewel-tone suits) — so this
  pack deliberately splits into two palette bands: the four department
  regulars stay in muted/desaturated tones (greys, tans, dull blues, black),
  while the two Reynholm boss members get the pack's only genuinely rich,
  saturated colors (blazer black + tie red, flamboyant purple/burgundy). That
  contrast IS the sitcom's class joke and should be preserved in any reskin.
- **Shared accessory recipe — oversized rectangular glasses** (built on the
  `tv/big-bang-theory` pack's shared glasses recipe, scaled up): two flat
  lens boxes, `HEAD_R*0.55 × HEAD_R*0.38 × 8mm` each (vs. that pack's
  `HEAD_R*0.42 × HEAD_R*0.28`), centered at eye height and offset
  `±HEAD_R*0.52` horizontally, plus a thin bridge box (`HEAD_R*0.14 × 8mm ×
  6mm`) at the `face` anchor. This oversized variant exists specifically for
  Moss, whose running gag is swapping his (already large) glasses for even
  bigger pairs when flustered — see his member entry. `eyes` stays `'dots'`
  underneath, matching the BBT precedent (bolt-on frame, not an eye-style
  swap).
- **Shared build note — collar/tie hints on the `chest`/`torso-front`
  anchor**: office-wear neck details (Denholm's shirt-and-tie, Douglas's
  open-collar shirt, Jen's blouse under a fitted waistcoat) all use a small
  `chest`/`torso-front` accessory bolted over the `body` base color, the
  same approximation the BBT and TNG docs already used for collars/yokes —
  see Rig gaps for why this is now a 3-pack pattern worth a real primitive.

## Members

### 1. `helpdesk-boffin` — "IT technician (huge glasses, checked shirt, tie)"

**Reference**: The department's actual technical genius — encyclopedic,
literal-minded, and hopelessly socially awkward. Canonical look: a short-
sleeve checked shirt with a tie tucked into high-waisted corduroy trousers,
a black afro-textured hairstyle with an exaggerated side part, and
oversized glasses he keeps a whole drawer of spares for (a running gag has
him swap to progressively bigger pairs when agitated). (Maurice Moss,
played by Richard Ayoade.)

**Spec**
```
sk: 1.0
headR: 128
headShape: 'sphere'
skin: 0xb9865e
body: 0x9fb2c0      // pale blue-grey check shirt (base tone; see Rig gaps for the check itself)
legColor: 0xa8875a  // high-waisted corduroy trousers
shoe: 0x2a1c12
eyes: 'dots'
emI: 0
limbR: 0.95
```

**Accessories**
- **face** — the oversized glasses (shared recipe above, the up-scaled
  variant), frame matte black `0x151515` — REQUIRED, Moss is never seen
  without them, and this pack's whole point in defining the "oversized"
  variant is for this one member.
- **crown** — black afro-textured hair with an exaggerated side part: a
  full rounded dome, `~140×70×140mm`, `0x0e0c0a` (near-black), built visibly
  ASYMMETRIC (fuller/higher on one side, a shallow flattened notch on the
  other) to hint the hard side-part without needing a true crease.
- **chest/torso-front** — the tie: a thin tapered box running from the
  collar down the center chest, `~40×160×8mm`, dark maroon-brown `0x5a2f24`,
  with 2–3 small darker diagonal accent boxes (`~30×14×4mm`, `0x3a1f18`,
  `rotation.z` alternating) suggesting a zigzag knit-tie pattern. Behind it,
  a thin white collar wedge (`~70×20×6mm`, `0xf0ede4`) at the neckline.

**Silhouette check**: the enormous glasses + zigzag tie combination is the
single most recognizable image of this character — reads instantly even
before the corduroy trousers or asymmetric hair register.

**Personality**: `bobMul: 0.7, swayMul: 0.5, cadenceMul: 0.9, ampMul: 0.65`
(stiff, deliberate, almost mechanically formal — minimal casual sway, a
faintly robotic economy of motion)
**Bubbles**: `🖥️💾📴😐` (computers/servers, obsolete tech trivia, "have you
tried turning it off and on again," a flat deadpan stare)

---

### 2. `helpdesk-slacker` — "IT technician (graphic tee, tousled hair)"

**Reference**: A work-shy, sarcastic Irish IT support technician who spends
most of his shift bored at his desk, playing video games or reading comics
rather than fixing anything — and answering the phone with a flat, rehearsed
"Hello, IT, have you tried turning it off and on again?" Canonical look: a
graphic or band t-shirt (real and fictional bands both appear across the
show), jeans, trainers, and short, messy medium-brown hair. (Roy Trenneman,
played by Chris O'Dowd.)

**Spec**
```
sk: 1.05
headR: 128
headShape: 'sphere'
skin: 0xe0b48c
body: 0x2c2c2e      // dark grey graphic tee (base tone)
legColor: 0x33455e  // blue jeans
shoe: 0xd8d4c8      // off-white trainers
eyes: 'dots'
emI: 0
limbR: 1.05
```

**Accessories**
- **crown** — short, messy, tousled brown hair: an irregular flattened dome
  with 2–3 uneven high points, `~130×46×130mm`, `0x3a2418`, deliberately
  less neat/groomed than any other member's hair in the pack.
- **chest/torso-front** — the graphic-tee print (approximated, no text/logo
  — see Rig gaps): a flattened off-white rectangle patch centered on the
  chest, `~TORSO_W*0.55 × TORSO_H*0.5 × 6mm`, `0xd8d4c8`, with a small
  angular red accent shape (`~40×30×4mm`, `0xb01c24`) overlapping it —
  reads as "a printed band/graphic tee" without reproducing any real logo.
- **hand** — a small held prop, a flattened rectangular "comic book" or
  handheld game console (`~70×110×14mm`, `0x232323` with a pale screen
  inset `0x9fd0e0`), optional — his default idle pose when not actively
  walking.

**Silhouette check**: the pale graphic-print patch against a dark tee, messy
uncombed hair, and (whenever the held prop renders) a games console or
comic — the group's most visibly bored, unbothered posture is doing as much
work as the shirt.

**Personality**: `bobMul: 1.05, swayMul: 1.0, cadenceMul: 0.9, ampMul: 0.9`
(loose, slouchy, unhurried — a bored technician's shuffle, not a purposeful
stride)
**Bubbles**: `🎮🙄😏💤` (video games and comics, eye-rolling sarcasm, dry
wit, general workplace boredom)

---

### 3. `relationship-manager` — "Manager (auburn bob, office blouse)"

**Reference**: Hired as the department's "Relationship Manager" despite
having zero IT knowledge (a running joke nobody, including her, can define
the job) — and ends up its most socially competent, organized member simply
by being personable. Canonical look: trendy jewel-toned blouses and fitted
waistcoats over pencil skirts, black heels, and a red-brown chin-length bob
with a fringe. (Jen Barber, played by Katherine Parkinson.)

**Spec**
```
sk: 0.92
headR: 118
headShape: 'sphere'
skin: 0xe8c2a0
body: 0x1f6b5c       // jewel-tone teal blouse (base/outermost visible torso tone)
legColor: 0x2a2a2e   // charcoal pencil skirt
shoe: 0x1a1a1a       // black heels
eyes: 'dots'
emI: 0
limbR: 0.85
armL: 0.9
legL: 0.92
```

**Accessories**
- **crown** — auburn/red-brown chin-length bob with a fringe: a flattened
  sphere-cap, `~132×62×132mm`, `0x7a3a24`, plus a small forward hairline
  ridge box (`~86×18×12mm`, same color) low over the brow for the fringe,
  tilted back so the front rim still clears the eye band.
- **chest/torso-front** — the fitted waistcoat over the blouse: a narrow
  charcoal panel down the torso center, `~TORSO_W*0.62 × TORSO_H*0.85 ×
  10mm`, `0x33363a`, proud of the teal `body` blouse showing at the
  shoulders/sides (coincident-face rule — keep it a few mm proud).
- **hip** — a slim black belt, thin box band, `0x141414`, at the skirt
  waistline.

**Silhouette check**: the auburn fringed bob plus a charcoal waistcoat over
a bright jewel-tone blouse, worn with a skirt and heels — the ONLY member of
this pack in office-appropriate formalwear rather than casual/scruffy wear,
which is exactly the character's point (the one adult in a room of manchildren).

**Personality**: `bobMul: 1.0, swayMul: 1.05, cadenceMul: 1.05, ampMul: 1.0`
(brisk, confident, professional — visibly more purposeful stride than her
two IT colleagues)
**Bubbles**: `📋💼😅📱` (organizing/managing, professional ambition, an
awkward nervous laugh, competent-with-a-phone-if-not-a-server)

---

### 4. `basement-recluse` — "Reclusive technician (all black, long hair, pale)"

**Reference**: A former high-flying young executive who, after discovering
extreme black-metal music, transformed into a full goth and was demoted
into the IT department, where he now lives full-time in the server room,
rarely emerges into daylight, and reacts to sudden light or fright with a
bat-like fluttering jump. Canonical look: head-to-toe black clothing, stark
pale/white face makeup, heavy dark eye makeup, and long straight jet-black
hair. (Richmond Avenal, played by Noel Fielding.)

**Spec**
```
sk: 0.95
headR: 124
headShape: 'sphere'
skin: 0xede9e2       // stark pale/white goth face makeup (fixed, not tint)
body: 0x111111       // all-black clothing
legColor: 0x0d0d0d
shoe: 0x0a0a0a
eyes: 'dots'
emI: 0
limbR: 0.95
```

**Accessories**
- **crown** — long, straight, jet-black hair: a large flattened sphere-cap
  cascading past the shoulders, `~150×140×150mm`, `0x0a0a0a`, tilted back so
  the front rim clears the brow.
- **head** — two long side-lobes for hair falling past the shoulders/upper
  arms, `~42×100×32mm` each, same `0x0a0a0a`.
- **face** — heavy dark eyeliner: two small flattened boxes framing the eye
  sockets, `~36×8×4mm`, near-black `0x0a0a0a`, sitting just above/around
  where the generic `dots` eyes render (approximation, not a true makeup
  layer — see Rig gaps).
- **chest/torso-front** — a plain black choker/necklace band at the
  neckline, thin box/torus, `0x0a0a0a`, with one small dull-silver stud
  accent (`~10mm` sphere, `0x9a9a9a`) — a generic goth accessory, no
  band-logo or symbol geometry.

**Silhouette check**: an unbroken black-on-black silhouette against a stark
pale face and a long black-hair curtain reads as "goth" from any angle and
at any scale — the single sharpest color-contrast read in the whole pack
(every other member sits in muted or jewel-tone office colors).

**Personality**: `bobMul: 0.6, swayMul: 0.4, cadenceMul: 0.7, ampMul: 0.55`
(a slow, minimal, almost ghostly glide — deliberately the stillest, least
energetic gait in the pack, startling into a quick flinch rather than ever
moving briskly)
**Bubbles**: `🦇🖤🕯️😱` (his bat-like startled flutter-jump, all-black
goth aesthetic, candlelit server-room darkness, fear of daylight)

---

### 5. `founder-boss` — "CEO (black blazer, moustache)"

**Reference**: The blustery, self-mythologizing founder and CEO of Reynholm
Industries (the show's first two series) — fond of grandiose corporate
motivational speeches and prone to erratic, temperamental outbursts.
Canonical look: greased-back black hair (paired, distinctively, with a
brown moustache and sideburns), a black blazer over a white shirt with a
colored tie, and polished black shoes. (Denholm Reynholm, played by Chris
Morris.)

**Spec**
```
sk: 1.0
headR: 126
headShape: 'sphere'
skin: 0xd9a878
body: 0x161616       // black blazer
legColor: 0x141414   // black trousers
shoe: 0x0d0d0d
eyes: 'dots'
emI: 0
limbR: 1.0
```

**Accessories**
- **crown** — glossy slicked-back black hair, a tight low dome hugging the
  scalp, `~126×32×126mm`, `0x100c08`, with a faint emissive `0.05` for a
  greasy sheen.
- **face** — a small moustache, a thin flattened box under the nose,
  `~50×14×6mm`, `0x4a2f1c` (deliberately BROWN against the black hair — a
  distinctive, slightly mismatched real detail worth keeping rather than
  matching it to the hair color).
- **chest/torso-front** — a white shirt collar wedge at the neckline
  (`~70×22×6mm`, `0xf0ede4`) with a bold red tie running down the center
  chest (`~36×150×8mm`, `0xb01c24`).

**Silhouette check**: glossy black slicked hair + an incongruous brown
moustache + a sharp black blazer and red tie reads instantly as "old-school
corporate founder" — the brown/black hair-vs-moustache mismatch is the
specific, memorable tell.

**Personality**: `bobMul: 1.1, swayMul: 1.15, cadenceMul: 1.0, ampMul: 1.1`
(blustery, grandiose, a motivational-speaker's swagger with a short fuse
just under the surface)
**Bubbles**: `💼📢💰😤` (corporate briefcase/deal-making, grandiose
speeches, money and ambition, sudden temper)

---

### 6. `heir-playboy` — "CEO (flamboyant suit, pompadour)"

**Reference**: Denholm's crude, lecherous, and extravagantly overconfident
son, who inherits Reynholm Industries and proves an even worse (if more
flamboyant) boss than his father. Canonical look: a tall, swept-back dark
pompadour/quiff, expensive tailored suits in bold colors worn with an open
shirt collar, and a booming, theatrical self-assurance in every scene.
(Douglas Reynholm, played by Matt Berry.)

**Spec**
```
sk: 1.05
headR: 126
headShape: 'sphere'
skin: 0xcf9a68
body: 0x5a2350       // flamboyant burgundy-purple suit jacket
legColor: 0x5a2350   // matching suit trousers
shoe: 0x0d0d0d       // black patent shoes
eyes: 'dots'
emI: 0
limbR: 1.05
```

**Accessories**
- **crown** — a tall, swept-back pompadour/quiff: an angled, forward-peaked
  box or cone rising off the forehead, `~120×90×120mm`, `0x1c130c`
  (dark brown-black), with a faint emissive `0.06` (styled/glossy sheen).
- **chest/torso-front** — an open shirt collar in a deep V, cream/off-white
  wedge pair (`~60×36×8mm` each), `0xede9e0`, flaring open at the neckline
  (no tie — deliberately contrasts with his father's buttoned-up look);
  a thin gold chain hint, a small flattened torus, `0xd4af37`, resting in
  the open collar.
- **hip** — a flashy gold belt buckle, a chunky flattened box, `~80×54×
  20mm`, `0xd4af37`, centered at the belt line, proud of the trousers.

**Silhouette check**: the tall dark pompadour plus a saturated purple suit
worn open-collared with a gold chain is the pack's single most flamboyant
read — deliberately the opposite silhouette from his father's tight black
blazer/buttoned collar, which is exactly the generational contrast the
show plays for laughs.

**Personality**: `bobMul: 1.15, swayMul: 1.3, cadenceMul: 1.05, ampMul: 1.2`
(an extravagant, swaggering strut — the biggest, most theatrical gait in
the pack)
**Bubbles**: `😏💋🍾👑` (smug lecherous confidence, flirting, champagne/
excess, an inherited sense of entitlement)

## Rig gaps

1. **No fabric-pattern/print support** (expected — the rig is color+shape
   only, but this pack surfaces it twice: Moss's checked shirt and Roy's
   graphic-print tee). Both are approximated here with a solid base color
   plus a handful of small accent-colored primitives (a zigzag-tie hint for
   Moss, an off-white print patch + angular color block for Roy). Reads
   fine as "patterned/printed garment" at 30 px but loses the specific
   print up close. This is the SAME gap the `tv/big-bang-theory` doc raised
   (Howard's turtleneck prints, Raj's argyle vest, Bernadette's floral
   skirt) — now a second independent pack hitting it, which should raise
   its priority: a lightweight repeating-primitive "pattern" accessory
   (tile N small shapes across a chest/leg region) would serve both packs
   and any future costume/uniform pack.
2. **No dedicated neck/collar anchor.** This pack has three distinct
   neckline reads (Moss's shirt-collar-plus-tie, Denholm's shirt-collar-
   plus-tie, Douglas's open V-neck-plus-chain) all approximated as small
   boxes bolted to the top edge of the `chest` anchor — the same
   approximation flagged by `sci-fi/star-trek-tng` (uniform yoke) and
   `tv/big-bang-theory` (turtleneck/collar variety). THIRD independent pack
   to need this; a generalized `collar` anchor (a band wrapping the neck,
   distinct from the flat chest panel) would serve ties, dickeys, big
   collars, and open V-necks more naturally.
3. **No true face-paint/makeup layer.** Richmond's stark pale goth face and
   heavy dark eyeliner are approximated as a fixed pale `skin` hex plus two
   small dark boxes near the eyes — works well at typical in-scene scale,
   but there's no dedicated "makeup" concept distinct from `skin` color
   itself; a future pack with more elaborate face paint (clowns, tribal
   patterns, stage makeup) would hit the same wall.
4. **No pompadour/quiff hair-shape helper.** Douglas's swept-back peak is
   achievable today with a single angled box/cone (no new primitive
   needed), but it's a hand-tuned one-off; flagged as a convenience note
   only (like prior docs' "no X helper, but works with existing pieces"
   notes), not a blocking gap.

None of the above blocked shipping this pack — all six members are fully
expressible with the current rig via the workarounds above.

## Sources

- [List of The IT Crowd characters — Wikipedia](https://en.wikipedia.org/wiki/List_of_The_IT_Crowd_characters)
- [The IT Crowd — Wikipedia](https://en.wikipedia.org/wiki/The_IT_Crowd)
- [Maurice Moss | The IT Crowd Wiki (Fandom)](https://theitcrowd.fandom.com/wiki/Maurice_Moss)
- [Make Your Own Maurice Moss Costume — Carbon Costume](https://carboncostume.com/maurice-moss-from-the-i-t-crowd/)
- [three hundred and sixty six costumes: IT Crowd Moss costume](http://366costumes.blogspot.com/2012/11/moss-costume-enough-to-make-it-crowd.html)
- [Geek Chic: Fashion Inspired by The IT Crowd — College Fashion](https://www.collegefashion.net/inspiration/geek-chic-fashion-inspired-by-the-it-crowd/)
- [The IT Crowd (2006–2013) — Chris O'Dowd as Roy Trenneman — IMDb](https://www.imdb.com/title/tt0487831/characters/nm1483369/)
- [Roy's T-Shirts from the IT Crowd (and where to get them) — NerdShizzle](https://nerdshizzle.com/roys-t-shirts-from-the-it-crowd-and-where-to-get-them/)
- [The IT Crowd Shirts — itcrowdshirts.com](http://itcrowdshirts.com/)
- [Jen Barber Costume Guide — Carbon Costume](https://carboncostume.com/jen-barber/)
- [The IT Crowd (2006–2013) — Katherine Parkinson as Jen Barber — IMDb](https://www.imdb.com/title/tt0487831/characters/nm1817670/)
- [Richmond Avenal | The IT Crowd Wiki (Fandom)](https://theitcrowd.fandom.com/wiki/Richmond_Avenal)
- [Richmond Felicity Avenal Costume Guide — Carbon Costume](https://carboncostume.com/richmond-felicity-avenal/)
- [Noel Fielding | The IT Crowd Wiki (Fandom)](https://theitcrowd.fandom.com/wiki/Noel_Fielding)
- [Denholm Reynholm | The IT Crowd Wiki (Fandom)](https://theitcrowd.fandom.com/wiki/Denholm_Reynholm)
- [The IT Crowd (2006–2013) — Christopher Morris as Denholm Reynholm — IMDb](https://www.imdb.com/title/tt0487831/characters/nm0606439/)
- [Douglas Reynholm | The IT Crowd Wiki (Fandom)](https://theitcrowd.fandom.com/wiki/Douglas_Reynholm)
- [Matt Berry | The IT Crowd Wiki (Fandom)](https://theitcrowd.fandom.com/wiki/Matt_Berry)
- Diorama source reference (existing rig conventions, anchors, glasses
  accessory recipe, `SPECS` table, per-kind accessory recipes):
  `src/three-renderer.ts` (`_buildHumanoid`, `AVATAR_KINDS`,
  `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`); prior pack docs
  `docs/avatars/sci-fi/star-trek-tng.md` and
  `docs/avatars/pop-culture/tv-big-bang-theory.md` for anchor/recipe
  precedent and the shared glasses-recipe/collar-gap running threads.
