# Avatar pack: Pop-Culture ▸ TV ▸ The Big Bang Theory

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color reads as the character archetype, not a likeness. No logos,
no printed text, no character names anywhere in-scene; identity lives only in
this doc's Reference lines and the pack's display labels (which use
descriptive-generic wording, e.g. "Theoretical physicist (Flash tee, tall)").

## Overview

- **Group**: The core Pasadena friend group from *The Big Bang Theory*
  (2007–2019) — four Caltech scientists/engineers, their neighbor, and the
  two women who join the circle. The show's whole visual joke is **layered,
  colorful "nerd-chic" costuming that reads at a glance** (a Flash tee over a
  long-sleeve undershirt, a turtleneck dickey under a check shirt, a sweater
  vest over a huge collar, red glasses + a cardigan) — so this pack leans
  hard on the same anchor points other packs use for uniforms/costumes:
  `crown` (hair/hats), `head` (ears/side hair), `face` (glasses), `chest`/
  `torso-front` (the outer visible layer + logo/pattern accents), `hip`
  (belts/skirts), `hand` (props).
- **Hierarchy path**: `pop-culture / tv / big-bang-theory`
- **Member count**: 7
- **Rig**: humanoid only (no quadrupeds in this pack)
- **Design call — fixed costume colors, not sensor-tint carriers**: like the
  `sci-fi/star-trek-tng` pack, this is a **named-character homage**, not a
  generic archetype pack — the point is "which specific friend is this,"
  which lives in a fixed, canonical costume palette per member (Sheldon's
  red/yellow, Howard's saturated turtlenecks, Penny's pink, etc.). `skin`/
  `body`/`legColor` are therefore FIXED hex values per member, not `tint`.
  If per-sensor color coding matters for a given deployment, recolor a small
  accent piece instead (glasses frame, belt, hair) — none of the members
  below currently do this by default, matching the TNG precedent of no tint
  carriers in a named-cast pack.
- **Shared accessory recipe — rectangular glasses** (reused 3× below, listed
  once to avoid repeating identical dims per member): two flat lens boxes,
  `HEAD_R*0.42 × HEAD_R*0.28 × 8mm` each, centered at eye height and offset
  `±HEAD_R*0.5` horizontally, plus a thin bridge box connecting them
  (`HEAD_R*0.12 × 8mm × 6mm`) at the `face` anchor. Frame color is the only
  thing that varies per member (Leonard: dark tortoiseshell; Bernadette:
  bright red; Amy: brown/tortoise). `eyes` stays `'dots'` underneath — this
  is a bolt-on frame, not an eye-style swap (contrast with `movie_star`'s
  `eyes:'shades'`, which has no visible eyes at all).
- **Shared build note — layered-outer-garment convention**: every member
  whose canonical look is "something worn OVER something else" (Sheldon's
  graphic tee over an undershirt, Leonard's jacket over a hoodie over a tee,
  Howard's check shirt over a turtleneck dickey, Raj's sweater vest over a
  big-collar shirt, Amy's cardigan over a blouse, Bernadette's cardigan over
  a blouse) uses `body` for the OUTERMOST visible layer color and a small
  `chest`/`torso-front` accessory (collar wings, a peeking dickey square, a
  zip-pull stripe) to hint the layer underneath — same approximation the
  `professional`/`teacher` archetypes and the TNG uniform yoke already use.
  See Rig gaps for where this approximation is thinnest (patterned fabrics).

## Members

### 1. `sheldon-flash` — "Theoretical physicist (Flash tee, tall)"

**Reference**: The tallest and most rigid of the group, a brilliant (and
insufferably certain of it) theoretical physicist — canonically known for
graphic tees layered over a long-sleeved undershirt, most iconically a red
Flash t-shirt with a yellow lightning bolt, plain trousers, and a neat short
side-part haircut. (Sheldon Cooper.)

**Spec**
```
sk: 1.12
headR: 122
headShape: 'sphere'
skin: 0xe8c4a0
body: 0x2b3a4a      // long-sleeve undershirt (outermost sleeve color)
legColor: 0x54595e   // plain grey trousers
shoe: 0x2a2a2a
eyes: 'dots'
emI: 0
limbR: 0.85          // thin/lanky build
armL: 1.03
legL: 1.03
```

**Accessories**
- **crown** — short, neat, side-parted hair: a low flattened sphere-cap,
  ~130×36×130 mm, `0x4a2f1c` (mid-brown), hugging the head closely, front rim
  above the brow.
- **chest/torso-front** — the graphic tee layer: a flattened box covering the
  upper-center torso, ~`TORSO_W*0.8 × TORSO_H*0.75 × 10mm`, bright red
  `0xd41e2c`, proud of the undershirt `body` color underneath (coincident-face
  rule — keep it a few mm proud). Centered on it, a small yellow diagonal
  lightning-bolt hint: 2 short angled boxes (`~50×18×6mm` each, `0xf4c542`,
  opposite `rotation.z` tilts meeting mid-chest) standing in for the Flash
  emblem without reproducing a logo.
- **hand** — long-sleeve cuffs: a thin ring (short cylinder, `r=1.05×wrist,
  h=22mm`, `0x2b3a4a` matching `body`) at each wrist, hinting the undershirt
  sleeve peeking past the (unseen, short) tee sleeve.

**Silhouette check**: the tallest/thinnest build in the whole pack (highest
`sk`, lowest `limbR`) plus the red-and-yellow chest graphic is the one thing
— readable as "Sheldon" even before the held-together, upright posture reads.

**Personality**: `bobMul: 0.75, swayMul: 0.55, cadenceMul: 1.0, ampMul: 0.7`
(rigid, deliberate, almost mechanically upright — minimal casual sway)
**Bubbles**: `🚂🧠📐🧴` (model trains, physics/theory, whiteboard equations,
germaphobe hand sanitizer)

---

### 2. `leonard-hoodie` — "Experimental physicist (glasses, layered jacket)"

**Reference**: The shorter, more socially anxious of the two roommates — an
experimental physicist, horn-rimmed glasses, curly brown hair, and a
signature 3-layer look (graphic tee, zip hoodie, tan/olive field jacket worn
over both). (Leonard Hofstadter.)

**Spec**
```
sk: 0.97
headR: 126
headShape: 'sphere'
skin: 0xe4bf98
body: 0x8a7a52      // tan/olive field jacket (outermost layer)
legColor: 0x3f4a52
shoe: 0x232323
eyes: 'dots'
emI: 0
limbR: 1.0
```

**Accessories**
- **crown** — curly brown hair: 3 small overlapping spheres
  (`r ≈ HEAD_R*0.32` each) clustered across the top/back of the head,
  `0x3a2416`, irregular offsets for curl texture, front kept clear of the
  brow.
- **face** — horn-rimmed glasses (shared recipe above), frame
  `0x1c1408` (dark tortoiseshell/black) — REQUIRED, Leonard is never seen
  without them.
- **chest/torso-front** — hoodie peeking under the jacket: a grey collar
  wedge at the neckline (`TORSO_W*0.4 × 30mm × 10mm`, `0x6b6f74`) plus a thin
  vertical zip-pull stripe down the center chest (`10×140×5mm`, `0x9a9ea2`).

**Silhouette check**: glasses + curly hair + the visibly layered
jacket-over-hoodie collar wedge — the group's most "everyman" silhouette,
deliberately less bold than Sheldon's or Howard's.

**Personality**: `bobMul: 1.0, swayMul: 0.95, cadenceMul: 1.0, ampMul: 1.05`
(a touch eager/anxious, otherwise an ordinary walk)
**Bubbles**: `🔬📚💕🎮` (physics experiments, comic books, crush-on-Penny
pining, video games)

---

### 3. `howard-turtleneck` — "Aerospace engineer (turtleneck, big buckle)"

**Reference**: The shortest of the four, an aerospace/mechanical engineer
(famously the only one without a PhD — a running sore point) known for
skin-tight turtleneck "dickey" shirts in loud saturated colors, oversized
novelty belt buckles, tight trousers, and a poofy dark bowl-cut. (Howard
Wolowitz.)

**Spec**
```
sk: 0.85
headR: 124
headShape: 'sphere'
skin: 0xe0ba92
body: 0x6a3fa0      // saturated purple turtleneck/dickey (any bold hue fits — see note)
legColor: 0x1c1c1c   // tight black trousers
shoe: 0x141414
eyes: 'dots'
emI: 0
limbR: 0.85          // slight/skinny build
```
Note: Howard's turtlenecks rotate through many saturated colors episode to
episode (teal, maroon, mustard, purple...); `0x6a3fa0` is a representative
default, not a strict canon color — any single bold saturated hue reads
correctly for this member.

**Accessories**
- **crown** — poofy dark bowl-cut: a wide rounded dome, ~`144×46×144mm`,
  `0x14100c` (near-black brown), sitting low and full around the head sides
  (fuller/rounder than Leonard's curl-cluster — this is a distinct, bigger
  silhouette).
- **chest/torso-front** — dickey collar hint: a thin contrasting trim ring at
  the neckline (flattened cylinder, `R = TORSO_W*0.35, tube = 10mm`),
  off-white `0xefe8da`, suggesting the checked over-shirt collar without a
  pattern.
- **hip** — the oversized belt buckle (the single most load-bearing prop in
  this pack): a chunky flattened box, `~90×60×22mm`, bright metallic
  `0xd4af37` gold (swap silver `0xc0c0c0` for variety — Howard is never seen
  with the same buckle twice on the show), centered at the belt line, proud
  of the trousers.

**Silhouette check**: shortest build in the group (`sk 0.85`, lower even than
Bernadette's later stature difference reads through relative posing) + the
big shiny hip buckle + a saturated-color fitted turtleneck + the full poofy
hair dome — any two of these already read "Howard."

**Personality**: `bobMul: 1.0, swayMul: 1.25, cadenceMul: 1.1, ampMul: 0.95`
(a cocky, quick strut — short confident steps)
**Bubbles**: `🚀😏🎹💍` (aerospace/NASA engineering, smug charm, keyboard
playing, devoted-husband ring)

---

### 4. `raj-sweater-vest` — "Astrophysicist (sweater vest, big collar)"

**Reference**: An astrophysicist, and (for the show's first several seasons)
unable to speak to women without alcohol — signature layered look is a
patterned sweater vest over a button-down shirt with an oversized collar,
often under a zip athletic jacket, with khaki/cargo trousers. Widely
acknowledged in the show itself as the most fashion-conscious of the four
guys, in a deliberately "trying too hard" way. (Raj Koothrappali.)

**Spec**
```
sk: 0.97
headR: 126
headShape: 'sphere'
skin: 0x8a5a3c
body: 0x8a2f3a      // burgundy sweater vest (outermost layer)
legColor: 0x8a7c54   // khaki/cargo trousers
shoe: 0x3a2a1a
eyes: 'dots'
emI: 0
limbR: 0.95
```

**Accessories**
- **crown** — short, neat dark hair, a low flattened cap, ~`126×34×126mm`,
  `0x14100c`.
- **chest/torso-front** — the oversized shirt collar peeking above/around the
  vest neckline: two wide collar-wing boxes (`~70×40×8mm` each) flaring out
  from the neckline at a slight outward angle, off-white `0xf2f0e8` — bigger
  and more flared than Leonard's or Howard's collar hints, matching the
  show's running "huge collar" joke. Layered under that, 2–3 small
  diamond-rotated boxes (`~30×30×6mm`, `rotation.z ≈ π/4`) in a mustard
  accent `0xc9a227` scattered across the vest front, hinting an argyle/
  patterned knit (see Rig gaps — approximation only).
- **hip** — a slim brown web belt, thin box band, `0x4a3320`.

**Silhouette check**: the oversized flared shirt collar (the single most
recognizable "Raj" detail per the show's own running joke about it) sitting
above the patterned burgundy vest is the one thing.

**Personality**: `bobMul: 0.95, swayMul: 0.85, cadenceMul: 0.95, ampMul: 0.9`
(a touch reserved/careful — the anxious-around-new-people read)
**Bubbles**: `🐶🎨🍸🔭` (Cinnamon his dog, fashion/design side-interest,
liquid courage, astrophysics)

---

### 5. `penny-neighbor` — "Neighbor (blonde, casual pink)"

**Reference**: The pretty, street-smart neighbor across the hall — a
waitress-turned-aspiring-actress who later becomes a pharmaceutical rep, and
eventually Leonard's wife. The one main cast member with no lab coat or
geek-signifier silhouette: long blonde hair, fitted casual tops (bright
colors, pink a recurring favorite), jeans. (Penny.)

**Spec**
```
sk: 0.90
headR: 120
headShape: 'sphere'
skin: 0xeac49c
body: 0xe0568a      // bright pink casual top
legColor: 0x2b3f5c   // blue jeans
shoe: 0xc9a06a       // tan boots
eyes: 'dots'
emI: 0
limbR: 0.85
```

**Accessories**
- **crown** — long blonde wavy hair, a wide flattened sphere-cap sweeping
  past the shoulders, `~148×110×148mm`, `0xe8c468`, tilted back so the front
  rim clears the brow.
- **head** — two side-lobes for hair falling past the shoulders,
  `~42×90×32mm` each, same `0xe8c468`.

**Silhouette check**: long loose blonde hair + a bright solid-pink top with
no glasses, no vest, no collar tricks — the deliberate ABSENCE of any of the
group's nerd-signifier accessories is itself the read: the one friend who
isn't a scientist.

**Personality**: `bobMul: 1.0, swayMul: 1.1, cadenceMul: 1.0, ampMul: 1.05`
(a confident, easy saunter)
**Bubbles**: `🍷💇🎭😂` (wine — a running gag, hair/beauty, acting-career
dreams, sarcastic wit)

---

### 6. `bernadette-red-glasses` — "Microbiologist (petite, red glasses, florals)"

**Reference**: A former Cheesecake Factory waitress turned high-earning
microbiologist at a pharmaceutical company, and Howard's wife — famously
tiny (just under 5 ft), with wavy blonde hair and bangs, bold red-framed
glasses, and a wardrobe of petite cardigans over floral knee-length skirts
with black flats. Despite a sweet, squeaky voice she's written as one of the
show's most quietly intimidating characters. (Bernadette Rostenkowski.)

**Spec**
```
sk: 0.74             // shortest build in the pack
headR: 116
headShape: 'sphere'
skin: 0xeac49c
body: 0xd9b8cf       // pastel lavender cardigan (outermost layer)
legColor: 0x8ea67a    // muted floral-sage skirt tone (see Rig gaps: no print)
shoe: 0x1c1c1c        // black flats
eyes: 'dots'
emI: 0
limbR: 0.8
armL: 0.92
legL: 0.9
```

**Accessories**
- **crown** — blonde wavy hair with bangs: a flattened sphere-cap,
  `~132×88×132mm`, `0xe8c468`, tilted back, PLUS a small forward hairline
  ridge box (`~90×20×14mm`, same color) low over the brow line to read as
  bangs.
- **face** — rectangular glasses (shared recipe above), frame **bright red**
  `0xb01c24` — REQUIRED, this is Bernadette's single most consistent visual
  trait.
- **hip** — floral skirt hem: a wide band around the hips
  (`TORSO_W*1.05 × TORSO_H*0.22 × TORSO_D*1.05`), same `0x8ea67a` sage tone as
  `legColor` so the skirt reads as one continuous garment from waist to knee.

**Silhouette check**: by far the smallest build in the entire pack (`sk
0.74`, shorter even than the pack's other petite member) combined with bold
red glasses is the one thing that reads instantly — stature alone
distinguishes her from Amy at a glance even before the glasses color does.

**Personality**: `bobMul: 0.95, swayMul: 0.9, cadenceMul: 1.15, ampMul: 0.8`
(quick short strides — proportionally shorter legs naturally read as a
faster, perkier cadence)
**Bubbles**: `🔬👶😠🎀` (microbiology/yeast research, motherhood, surprising
short temper, girly bow accents)

---

### 7. `amy-cardigan-glasses` — "Neuroscientist (rectangular glasses, cardigans)"

**Reference**: A neuroscientist, Sheldon's girlfriend and eventual wife, and
(despite an awkward, deadpan start) the group's second close female friend —
brunette hair usually worn down, rectangular glasses (red-framed in earlier
seasons, tortoise/brown after a style update), modest layered cardigans over
striped or plaid blouses, denim skirts over tights, and flat orthopedic
shoes. (Amy Farrah Fowler.)

**Spec**
```
sk: 0.90
headR: 120
headShape: 'sphere'
skin: 0xe4be98
body: 0x6a3550       // plum/maroon cardigan (outermost layer)
legColor: 0x8a8a90    // tights
shoe: 0x3a2a1a        // brown orthopedic flats
eyes: 'dots'
emI: 0
limbR: 0.9
```

**Accessories**
- **crown** — brunette hair worn down, straight with a slight wave: a
  flattened cap, `~136×70×136mm`, `0x2e1c12`, tilted back to clear the brow.
- **head** — two side-lobes for mid-length hair past the ears,
  `~40×72×30mm` each, same `0x2e1c12` (shorter fall than Penny's or the
  TNG counselor's long hair — reads as neat, not glamorous).
- **face** — rectangular glasses (shared recipe above), frame **brown/
  tortoise** `0x4a2f1c` (her later-series style; swap `0x8a1c2a` dark red for
  an earlier-seasons look if that era reads better for a given deployment —
  either is canon-accurate to a different stretch of the show).
- **hip** — denim skirt hem band around the hips
  (`TORSO_W*1.02 × TORSO_H*0.2 × TORSO_D*1.02`), denim blue `0x4a5b74`.

**Silhouette check**: rectangular glasses + a plum cardigan + the denim skirt
hem band reads as "the studious one" — distinguished from Bernadette (also
glasses+cardigan) by build (taller, `sk 0.90` vs `0.74`), cooler/darker
cardigan tone (plum vs pastel lavender), and a defined skirt hem instead of a
floral pattern block.

**Personality**: `bobMul: 0.9, swayMul: 0.8, cadenceMul: 0.95, ampMul: 0.85`
(earnest, slightly formal, warm but a bit stiff)
**Bubbles**: `🧠🐈📓💜` (neuroscience, love of cats, journaling/diary,
affection for Sheldon)

## Rig gaps

- **No fabric-pattern/print support** (expected — the rig is color+shape
  only, but this pack surfaces it more than most: 3 of 7 members have a
  *named, iconic* pattern — Howard's turtleneck often prints/checks, Raj's
  sweater vests are frequently argyle, Bernadette's skirts are floral). All
  three are approximated here with a solid base color plus a handful of
  small accent-colored primitives (diamond boxes for argyle, a plain sage
  tone for the floral skirt with no actual flower shapes). This reads fine
  as "colorful patterned garment" at 30 px but loses the specific print up
  close. A lightweight repeating-primitive "pattern" accessory type (e.g. an
  array of small shapes tiled across a chest/leg region) would generalize
  well beyond this pack (military camo, plaid, polka dots recur across many
  franchise/costume packs).
- **No dedicated neck/collar anchor.** Three different neckline reads in
  this single pack — Howard's turtleneck dickey, Raj's oversized shirt
  collar, Leonard's/Amy's/Bernadette's cardigan or jacket collar wedge — all
  get approximated as small boxes/rings bolted to the top edge of the
  `chest` anchor, the same class of approximation the `sci-fi/star-trek-tng`
  pack already flagged for its uniform yoke. A generalized `collar` anchor
  (a band that wraps the neck, distinct from the flat chest panel) would
  serve turtlenecks, dickeys, big collars, and cardigan V-necks more
  naturally and would generalize to future packs (clergy collars, popped
  jacket collars, etc.).
- **Two petite/short-statured members in one pack** (`howard-turtleneck` at
  `sk 0.85` and `bernadette-red-glasses` at `sk 0.74`) both rely on `sk`
  alone to read as short — this works (confirmed distinguishable from the
  rest of the cast at a glance) but there's no separate "petite proportions"
  knob (e.g., relatively bigger head-to-body ratio the way real short
  adults, as opposed to children, are proportioned) — `headR` was nudged
  down slightly for both instead as a partial compensation. Not blocking,
  just noted since this pack has an unusually wide height spread (`sk 0.74`
  to `1.12`) for a 7-member cast.

None of the above blocked shipping a member — all seven have a complete,
distinguishable spec using only the current rig's primitives and anchors.

## Sources

- [Dress Like Sheldon Cooper from The Big Bang Theory — DeviantArt](https://www.deviantart.com/outfits-hub/art/Dress-Like-Sheldon-Cooper-from-The-Big-Bang-Theory-1128937840)
- [All Shirts Worn by Sheldon Cooper: Sheldon Cooper's Flash Costume](https://www.sheldoncoopersshirts.com/2017/02/sheldon-coopers-flash-costume.html)
- [Sheldon Cooper Outfits & Fashion on The Big Bang Theory — WornOnTV](https://wornontv.net/the-big-bang-theory/sheldon/)
- [How to Dress Like Dr. Leonard Hofstadter — TV Style Guide](https://www.tvstyleguide.com/big-bang-theory/leonard-hofstadter/how-to-dress-like-dr-leonard-hofstadter/)
- [Leonard Hofstadter Outfits & Fashion — WornOnTV](https://wornontv.net/the-big-bang-theory/leonard/)
- [How The Big Bang Theory Came Up With Howard Wolowitz's Unique Fashion Sense — SlashFilm](https://www.slashfilm.com/1896967/howard-wolowitz-the-big-bang-theory-fashion-sense-explained/)
- [How to Dress Like Howard Wolowitz — TV Style Guide](https://www.tvstyleguide.com/big-bang-theory/howard-wolowitz/how-to-dress-like-howard-wolowitz/)
- [Big Bang Theory: Why Howard Always Wears Alien Pins — ScreenRant](https://screenrant.com/big-bang-theory-howard-wolowitz-alien-pin-wear-meaning/)
- [Raj Koothrappali — Wikipedia](https://en.wikipedia.org/wiki/Raj_Koothrappali)
- [They Did This 'Big Bang Theory' Character Dirty With This Single "Hideous" Detail — Collider](https://collider.com/big-bang-theory-raj-costuming-kunal-nayyar/)
- [Kunal Nayyar Says His Character 'Ruined' Fashion for Him — TV Insider](https://www.tvinsider.com/1208299/kunal-nayyar-the-big-bang-theory-raj-ruined-fashion-for-him/)
- [Penny — The Big Bang Theory Wiki (Fandom)](https://bigbangtheory.fandom.com/wiki/Penny)
- [Penny (The Big Bang Theory) — Wikipedia](https://en.wikipedia.org/wiki/Penny_(The_Big_Bang_Theory))
- [Bernadette Rostenkowski-Wolowitz — The Big Bang Theory Wiki (Fandom)](https://bigbangtheory.fandom.com/wiki/Bernadette_Rostenkowski-Wolowitz)
- [Meet Bernadette, the Quirky Microbiologist from The Big Bang Theory](https://araromi.mlga.ek.gov.ng/01183980/meet-bernadette-the-quirky-microbiologist-from-the-big-bang-theory/)
- [Amy Farrah Fowler — The Big Bang Theory Wiki (Fandom)](https://bigbangtheory.fandom.com/wiki/Amy_Farrah_Fowler)
- [Amy Farrah Fowler Costume Guide — Carbon Costume](https://carboncostume.com/amy-farrah-fowler/)
- [Amy Farrah Fowler Outfits & Fashion — WornOnTV](https://wornontv.net/the-big-bang-theory/amy/)
- Diorama source reference (existing rig conventions, anchors, glasses
  accessory recipe, `SPECS` table, per-kind accessory recipes):
  `src/three-renderer.ts` (`_buildHumanoid`, `AVATAR_KINDS`,
  `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`); prior pack docs
  `docs/avatars/sci-fi/star-trek-tng.md` and `docs/avatars/base/careers.md`
  for anchor/recipe precedent.
