# Franchise pack: Firefly (Serenity crew)

**Hierarchy path**: `docs/avatars/sci-fi/firefly.md` — a franchise pack under
`docs/avatars/sci-fi/`. These are stylized geometric toon homage figures
(Sims-style minifigures inspired by the show's silhouettes and color-coding)
— no likenesses, no logos, no copyrighted insignia geometry. Every member
below uses a **descriptive-generic label** for in-app display; the actual
character name lives only in the Reference line of this doc.

## Overview

- **Group**: the crew of the firefly-class transport ship Serenity (Firefly,
  2002; Serenity, 2005)
- **Member count**: 9
- **Rig**: humanoid only (no quadrupeds in this pack)
- **Shared base spec** (all members start here, then override):
  ```
  sk: 1.0
  headR: 126
  headShape: 'sphere'
  limbR: 1.0
  hands: 'sphere'
  eyes: 'dots'
  steel: false
  emI: 0
  armL: 1.0
  legL: 1.0
  footMul: [1.0, 1.0, 1.0]
  ```
- **Shared style/palette — "Western-in-space"**: no uniforms here (this is a
  scrappy independent crew, not a fleet), but the show's costume design
  (Shawna Trpcic) keeps everyone in a narrow **cowboy-frontier earth-tone
  band** — browns, tans, rust, maroon, olive, cream, weathered leather and
  suede — punctuated by exactly TWO members who break the palette on
  purpose (Wash's tropical shirt, Inara's rich red/gold silk) precisely
  because their whole character point is standing out from the dusty
  frontier look everyone else wears. When building recolor variants, keep
  new colors inside the earth-tone band unless the member is meant to read
  as an outlier like Wash/Inara.
- **Recurring accessory idiom — the diagonal strap** (suspenders, gun belt,
  tactical bandolier, companion sash): this pack reuses the same
  chest-anchor rotated-box approximation already flagged as a rig gap by
  the Star Trek TNG doc (Worf's baldric) and the DS9 doc (Worf's sash) —
  see Rig gaps below; this is now the THIRD independent pack hitting the
  same need, which should raise its priority further.

## Members

### 1. `captain-browncoat` — "Captain (brown duster, maroon shirt)"

**Reference**: Captain Malcolm "Mal" Reynolds — Independent (Browncoat) war
veteran turned smuggler-captain of Serenity. Signature look: a maroon
button-up shirt, suspenders, a gun-belt holster, and above all a long brown
suede duster coat that falls to just below the knee. (Malcolm Reynolds,
played by Nathan Fillion.)

**Spec**:
```
sk: 1.0, headR: 126, headShape: 'sphere', limbR: 1.0,
skin: 0xd9a878,
body: 0x7a2f2f,       // maroon button-up shirt
legColor: 0x8a7052,   // tan trousers
shoe: 0x3a2a1a,       // brown boots
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 1.0, legL: 1.0
```

**Accessories**:
- **Duster coat** (the defining silhouette): `back` anchor, a long tapered
  cone/cylinder hanging from the shoulders to just above the knee,
  ~340×620×260 mm, suede brown `0x5c3a1e`, slightly flared at the hem —
  reads as an open coat draping past the sides of the body.
- **Suspenders**: two thin diagonal straps, `chest`→`hip` anchor pair
  (mirrored, see the diagonal-strap idiom in Overview), ~14 mm wide, dark
  brown `0x2a1a12`, running shoulder to opposite hip-front.
- **Gun-belt holster**: `hip` anchor, a wide belt band ~260×60×20 mm,
  worn brown leather `0x4a3520`, with a small holstered-pistol prop
  (box + thin cylinder, `0x1c1c1c`) riding the outside of the right hip.

**Silhouette check**: the long brown duster coat hanging past the hips —
nothing else in this pack (or in most sci-fi packs, which trend toward
fitted jumpsuits) has a loose open coat silhouette; unmistakable in
profile even faceless at 30px.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 1.0 }`
— steady, watchful, a soldier's economy of motion with a captain's
confidence.
**Bubbles**: `🔫 🤠 🚀 😏` (gunslinger readiness, frontier leadership,
the ship/exploration, dry wit)

---

### 2. `warrior-wife` — "First mate (leather vest, war veteran)"

**Reference**: Zoe Washburne — Serenity's imperturbable first mate, a
fellow Independent war veteran, and Wash's wife. Signature look: a plain
shirt under a brown leather vest (V-neck, brass buckle closures,
sleeveless), tan pants, black boots — dark skin, close-cropped or braided
dark hair, near-permanent stoic composure. (Zoe Washburne, played by
Gina Torres.)

**Spec**:
```
sk: 1.0, headR: 124, headShape: 'sphere', limbR: 1.05,
skin: 0x6b4a30,        // dark brown skin, toon-saturation-pushed
body: 0x8a8a7a,        // plain undershirt (grey-tan), mostly covered by the vest
legColor: 0x9c8a6a,    // tan trousers
shoe: 0x1a1a1a,        // black boots
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 1.0, legL: 1.0
```

**Accessories**:
- **Leather vest** (the defining garment): `chest`/`torso-front` anchor,
  a fitted sleeveless panel covering the torso front, ~TORSO_W×TORSO_H×
  20 mm, brown leather `0x4a2f1c`, V-neck notch at the collar.
- **Brass buckles** (×2, mirrored): tiny flattened boxes at the vest's
  side closures, ~14×20×6 mm each, `0xc9a227` (brass), slight emissive
  0.08 (metal catch-light).
- **Hair**: `crown` anchor, short/pulled-back dark hair, a low tight dome,
  ~124×34×124 mm, `0x1c140e` (near-black).

**Silhouette check**: dark skin + brown leather vest over a bare-shoulder
undershirt, held in an almost perfectly rigid, minimal-sway stance — the
"war veteran who's seen it all and startles at nothing" reads in the
posture as much as the vest.

**Personality**: `{ bobMul: 0.85, swayMul: 0.55, cadenceMul: 0.95, ampMul: 0.9 }`
— disciplined, economical, soldier's stillness; almost no idle fidget.
**Bubbles**: `⚔️ 🛡️ 😐 ❤️` (combat readiness, protection of the crew,
stoicism, quiet devotion to Wash)

---

### 3. `ships-pilot` — "Pilot (Hawaiian shirt, flight coveralls)"

**Reference**: Hoban "Wash" Washburne — Serenity's laid-back, wisecracking
pilot and Zoe's husband. Signature look: a loud tropical/Hawaiian-print
shirt worn open over an orange flight jumpsuit, sandy-blond hair, a
mustache, and (off-duty at the helm) his beloved plastic dinosaur toys.
(Hoban Washburne, played by Alan Tudyk.)

**Spec**:
```
sk: 1.0, headR: 126, headShape: 'sphere', limbR: 0.95,
skin: 0xe0b08c,
body: 0x2f7d6b,        // Hawaiian shirt base (teal/turquoise print ground)
legColor: 0xc9691f,    // orange flight jumpsuit legs, visible below the untucked shirt hem
shoe: 0x3a2a1a,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.95, legL: 0.95
```

**Accessories**:
- **Hawaiian print** (the defining garment — approximated as scattered
  print dots, see Rig gaps): 4–5 tiny flattened spheres, `chest`/
  `torso-front` anchor, scattered across the torso, ~16 mm each, alternating
  coral `0xe0623f` and warm yellow `0xe8c14a` — reads as a loud floral print
  against the teal ground at typical scale.
- **Hair**: `crown` anchor, short tousled sandy-blond hair, ~126×36×126 mm,
  `0xd9b872`.
- **Mustache**: `face` anchor just above the mouth, thin flattened box
  ~34×8×6 mm, `0x9c7a4a` (sandy brown, matching the hair).

**Silhouette check**: bright multi-color torso dots against orange jumpsuit
legs is the ONE bright/tropical-patterned silhouette in an otherwise
earth-toned crew (excepting Inara's very different red/gold) — instantly
reads as "the funny one" even before the mustache registers.

**Personality**: `{ bobMul: 1.1, swayMul: 1.15, cadenceMul: 1.0, ampMul: 1.05 }`
— loose, breezy, unhurried swagger; a pilot totally at ease in his chair.
**Bubbles**: `🦖 🦕 😄 🌺` (his plastic dinosaurs — the character's single
most iconic prop, easy humor, tropical shirt)

---

### 4. `mechanic` — "Mechanic (olive coveralls, grease-stained)"

**Reference**: Kaylee Frye — Serenity's cheerful, naturally gifted engineer.
Signature look: oil-stained olive-green mechanic's coveralls (often with
sleeves rolled or removed), a warm sunny disposition, and — off the engine
room — a fondness for a parasol and a memorable pink party dress ("Shindig").
This pack specs her everyday coveralls look. (Kaylee Frye, played by
Jewel Staite.)

**Spec**:
```
sk: 0.92, headR: 118, headShape: 'sphere', limbR: 0.9,
skin: 0xe8c2a0,
body: 0x5a6b3a,        // olive-green coveralls
legColor: 0x5a6b3a,    // one-piece — same as body
shoe: 0x3a2a1a,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.9, legL: 0.9
```

**Accessories**:
- **Grease smudge**: `chest` anchor, a small dark flattened patch,
  ~40×30×4 mm, `0x2a2a26` (dark grey-olive), offset off-center on the
  coveralls chest — a working mechanic's tell.
- **Hair**: `crown` anchor, a loose ponytail/braid accessory, a tapered
  cylinder sweeping back and down, ~40×160×40 mm, `0x5a3a20` (warm brown).
- **Parasol** (optional held prop, her Shindig-era signature): `hand`
  anchor, a small cone canopy + thin cylinder dowel, canopy ~120×90×120 mm,
  pink `0xe89ac0` with a cream `0xf0e6d8` trim ring.

**Silhouette check**: olive coveralls + off-center grease smudge + a
noticeably bouncier, warmer gait than anyone else aboard — she's the one
figure who looks genuinely delighted to be doing manual labor.

**Personality**: `{ bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.15, ampMul: 1.15 }`
— bouncy, energetic, warm; the liveliest gait in the pack.
**Bubbles**: `🔧 🌸 😊 💕` (mechanical aptitude, love of flowers/pretty
things, sunny warmth, big heart)

---

### 5. `mercenary` — "Mercenary (cunning hat, tactical vest)"

**Reference**: Jayne Cobb — the crew's gruff, mercenary muscle: hired for
firepower, motivated by money, secretly sentimental underneath. Signature
look: a bulky, muscular frame, a sleeveless tee under ammo-strap webbing,
and — unforgettably — a homemade knit winter cap in orange/gold/maroon
stripes with earflaps and a pom-pom (in-universe "the cunning hat," a gift
from his mother). (Jayne Cobb, played by Adam Baldwin.)

**Spec**:
```
sk: 1.1, headR: 132, headShape: 'sphere', limbR: 1.25,
skin: 0xc48a5e,
body: 0x9c8a72,        // sleeveless tan tee
legColor: 0x5a5a4a,    // olive-grey cargo pants
shoe: 0x1a1a1a,        // black boots
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 1.05, legL: 1.0
```

**Accessories**:
- **The cunning hat** (the single most important accessory in this pack):
  `crown` anchor, a banded knit dome with small earflaps — build as 3
  stacked short cylinder bands (top to bottom `0xd9691f` orange /
  `0xc9982f` gold / `0x7a2f2f` maroon), ~150×130×150 mm overall, plus a
  small pom-pom sphere ~26 mm `0xe8c14a` on top, and two small earflap
  tabs (`head` anchor, ~30×70×20 mm each) hanging past the ears in the
  same maroon `0x7a2f2f`.
- **Tactical webbing/straps**: `chest`→`hip` diagonal strap pair
  (mirrored, the diagonal-strap idiom — see Overview), dark olive
  `0x4a4a3a`, ~16 mm wide, crossing over the tee.
- **Gun prop** (optional, held): `hand` anchor, a chunky box+cylinder
  rifle silhouette, `0x2a2a2a` with a brushed-steel `0x9a9a9a` barrel hint.

**Silhouette check**: the striped orange/gold/maroon knit cap with its
pom-pom and earflaps is completely unmistakable at any scale — no other
figure in any sci-fi pack in this repo has a comparable silhouette; the
bulky muscular build (`sk`/`limbR` both bumped) reinforces it.

**Personality**: `{ bobMul: 1.25, swayMul: 1.2, cadenceMul: 0.85, ampMul: 1.1 }`
— heavy, swaggering stomp; slower cadence than the rest of the crew but
bigger, more forceful strides.
**Bubbles**: `🔫 💰 😤 🧶` (guns-for-hire, greed/payment, gruffness, the
hat itself — knit yarn)

---

### 6. `companion` — "Companion (red silk gown, gold sash)"

**Reference**: Inara Serra — a licensed Companion (a registered, highly
respected courtesan-diplomat), renting a shuttle aboard Serenity.
Signature look: sumptuous, warm-toned silk gowns — reds and golds above
all — in a style blending Asian and Indian influences with 1930s starlet
glamour; elegantly upswept dark hair; unfailingly graceful bearing.
(Inara Serra, played by Morena Baccarin.)

**Spec**:
```
sk: 0.95, headR: 120, headShape: 'sphere', limbR: 0.85,
skin: 0xd9a878,
body: 0x8a1f2f,        // rich red silk gown
legColor: 0x8a1f2f,    // floor-length gown — same red as the body
shoe: 0x2a1a12,        // hidden under the gown hem
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.85, legL: 0.85
```

**Accessories**:
- **Gold girdle/sash** (the defining accent): `hip` anchor, a wide banded
  cylinder wrap, ~TORSO_W×70×20 mm, gold `0xc9a227`, slight emissive 0.1
  (rich metallic sheen).
- **Draping gown train**: `back` anchor, a long tapered cone flowing from
  the waist to the floor, ~320×700×220 mm, matching red `0x8a1f2f` — see
  Rig gaps for the floor-length-gown approximation note.
- **Upswept hair**: `crown` anchor, a smooth rounded bun/updo, ~118×60×
  118 mm, near-black `0x2a1a12`.
- **Necklace**: `chest` anchor, a small gold pendant, ~14 mm sphere,
  `0xd4af37`, emissive 0.1.

**Silhouette check**: the flowing red/gold gown silhouette plus a visibly
more graceful, upright, low-sway carriage than the rest of the crew — she
is the ONE figure aboard who looks like she stepped out of a different,
richer world, exactly as the show intends.

**Personality**: `{ bobMul: 0.7, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.75 }`
— graceful, composed, unhurried elegance; the most refined gait in the pack.
**Bubbles**: `🌹 💋 🍵 ✨` (companion refinement, charm, ceremony/tea,
poise)

---

### 7. `doctor` — "Doctor (waistcoat, white shirt)"

**Reference**: Dr. Simon Tam — a brilliant former Core-world trauma surgeon
who became a fugitive to rescue his sister River, now Serenity's ship's
doctor. Signature look (earlier episodes): a crisp white shirt under a
fitted dark, subtly patterned waistcoat/vest with fine buttons and
flat-front trousers — noticeably more refined and out-of-place than the
rest of the crew's rough-and-ready wear. (Simon Tam, played by Sean
Maher.)

**Spec**:
```
sk: 0.98, headR: 122, headShape: 'sphere', limbR: 0.9,
skin: 0xe0b08c,
body: 0xe8e4d8,        // crisp white shirt
legColor: 0x2a2a2a,    // dark flat-front trousers
shoe: 0x1a1a1a,        // black dress shoes
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.9, legL: 0.95
```

**Accessories**:
- **Waistcoat** (the defining garment): `chest`/`torso-front` anchor, a
  fitted sleeveless panel over the shirt, ~TORSO_W×TORSO_H×18 mm, dark
  charcoal `0x2a2a2a` with a subtle warmer undertone (reads as a fine
  oriental-patterned silk at a glance), 3 small brass button dots down
  the front, `0xc9a227`, ~8 mm each.
- **Hair**: `crown` anchor, neat short dark hair, ~122×32×122 mm,
  `0x2a1a12`.

**Silhouette check**: crisp white-shirt-and-dark-waistcoat formality
against the crew's earth-toned work clothes, held in a noticeably
straighter, stiffer, more anxious posture — reads instantly as "the
core-world professional who doesn't quite belong out here."

**Personality**: `{ bobMul: 0.75, swayMul: 0.6, cadenceMul: 0.95, ampMul: 0.8 }`
— precise, controlled, faintly tense; a surgeon's careful economy of
motion.
**Bubbles**: `💉 🩺 😟 ❤️` (medicine, care, protective worry — mostly
about River, devotion)

---

### 8. `mysterious-sister` — "Mysterious sister (dress, long dark hair)"

**Reference**: River Tam — Simon's teenage sister, a genius and
former Alliance experimental subject with emergent psychic abilities and
devastating close-combat skill, now hiding aboard Serenity. Signature
look: simple, loose cotton sundresses, long dark messy/wet-looking hair,
and — tellingly — almost always barefoot, occasionally swapping in heavy
combat boots that look strikingly incongruous with the dress. (River Tam,
played by Summer Glau.)

**Spec**:
```
sk: 0.8, headR: 110, headShape: 'sphere', limbR: 0.78,
skin: 0xe8c2a0,
body: 0xaab4bc,        // simple pale grey-blue cotton dress
legColor: 0xaab4bc,    // dress falls past the hips — same tone as body
shoe: 0xe8c2a0,         // bare feet — shoe recolored to skin tone, see Rig gaps
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.8, legL: 0.82
```

**Accessories**:
- **Long messy hair** (the defining feature alongside bare feet): `crown`
  anchor, a large flattened sphere-cap cascading well past the shoulders,
  ~145×140×145 mm, near-black `0x241a14`, tilted back so the front clears
  the brow; `head` anchor pair, two long side-lobes ~40×100×32 mm each,
  same `0x241a14`, for hair falling past the shoulders/upper arms.

**Silhouette check**: the combination of skin-toned bare feet + long
loose dark hair + a plain pale dress is the tell; the erratic,
unpredictable quality of her movement (rather than any one accessory) is
what should read as "not quite present in the ordinary world" — lean on
the personality multipliers, not extra geometry.

**Personality**: `{ bobMul: 1.15, swayMul: 1.3, cadenceMul: 1.1, ampMul: 1.2 }`
— deliberately erratic and asymmetric: quicker, twitchier, less
predictable than any other member's gait; occasional stillness broken by
sudden bursts (best approximated with the idle-fidget system leaning
toward its more startled/quick one-shots rather than steady sway).
**Bubbles**: `🌀 🩰 💭 🔪` (mental chaos/psychic noise, dancer-like
grace, racing thoughts, her lethal close-combat skill)

---

### 9. `shepherd` — "Shepherd (grey shirt, clerical collar)"

**Reference**: Shepherd Derrial Book — a preacher of mysterious past who
takes passage aboard Serenity, serving as the crew's moral compass.
Signature look: a plain grey clergy shirt with a distinctive white
priestly tab collar, black trousers, close-cropped grey hair, calm and
unhurried bearing. (Shepherd Book, played by Ron Glass.)

**Spec**:
```
sk: 1.0, headR: 126, headShape: 'sphere', limbR: 0.95,
skin: 0x6b4a30,
body: 0x8a8a86,        // grey clergy shirt
legColor: 0x1a1a1a,    // black trousers
shoe: 0x0d0d0d,        // black shoes
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.95, legL: 1.0
```

**Accessories**:
- **Clerical tab collar** (the defining accessory): `chest`/`face`
  boundary anchor, a small flattened white box at the neckline,
  ~60×16×10 mm, `0xf0f0f0`, sitting just below the chin/jaw — the single
  detail that makes the grey shirt read as clergy rather than a plain
  work shirt.
- **Hair**: `crown` anchor, short close-cropped grey hair, a low dome
  hugging the scalp, ~128×34×128 mm, `0xb8b8b8`.

**Silhouette check**: grey shirt + the small white tab collar + grey hair
against an otherwise young, roughneck crew is the unmistakable "preacher
among smugglers" read, even before his calm, upright bearing registers.

**Personality**: `{ bobMul: 0.8, swayMul: 0.55, cadenceMul: 0.9, ampMul: 0.8 }`
— calm, measured, steady; the most unhurried, settled gait in the pack.
**Bubbles**: `🙏 📖 ☕ 😌` (faith, scripture/wisdom, quiet tea-time
comfort, serenity — deliberately, the ship's namesake virtue)

## Rig gaps

1. **No dedicated diagonal-strap/sash accessory type.** THIRD independent
   pack to need this (after TNG's Worf baldric and DS9's Worf sash/Kira
   diagonal panel): Mal's suspenders, Jayne's tactical webbing, and
   Inara's girdle-sash all use the same hand-tuned rotated-box-at-the-chest
   workaround. A real "strap" primitive defined by two anchor endpoints
   (e.g. `chest`→`hip`, mirrored) would remove this repeated approximation
   across at least 3 packs and counting — raising this gap's priority
   further versus where the TNG/DS9 docs left it.
2. **No floor-length skirt/gown accessory — long dresses currently just
   recolor `legColor` to match `body`.** Inara's Companion gown and
   River's sundress both need the LEGS themselves to visually disappear
   into a garment rather than remain two independently-swinging cylinders
   in a matching color; recoloring is a decent approximation at typical
   in-scene scale (~30px) but a true "skirt" accessory — a wide cone or
   flared cylinder from the hip anchor down to ankle height, wide enough
   to visually occlude the leg cylinders during the walk cycle — would
   read far better up close and would generalize to any future
   period/formal/robed pack (this doc's Companion, any future royalty or
   clergy-robe pack, etc.).
3. **No decal/print-pattern primitive for loud fabric prints.** Wash's
   Hawaiian shirt is approximated as scattered small sphere "print dots"
   on the torso — serviceable at typical scale but hand-placed and
   fiddly, the same class of gap the DS9 doc flagged for Trill skin
   spots. A parametrized "scatter N small shapes across an anchor's
   surface" helper would serve both use cases (organic markings AND loud
   fabric prints) with one primitive.
4. **No explicit "barefoot" flag — approximated by recoloring `shoe` to
   match `skin`.** Works visually (no foot-shaped shoe geometry renders)
   but is a semantic hack; a `feet: 'shoes' | 'bare' | 'boots'`-style enum
   that suppresses/adjusts the shoe geometry directly would be cleaner and
   would matter for any future pack with barefoot/sandaled characters
   (fantasy, beach/summer packs, etc.).
5. **No banded/striped knit-cap helper.** Jayne's cunning hat is
   achievable today by stacking 3 short cylinder bands of different
   colors plus a pom-pom sphere and earflap tabs — no new primitive
   needed, just several hand-positioned pieces. Flagged as a convenience
   note only (like the DS9 doc's "ridge row" helper suggestion), not a
   capability gap.

None of these gaps blocked building this pack; all nine members are fully
expressible with the current rig via the workarounds above.

## Sources

- [How to Dress Like Captain Malcolm Reynolds — TV Style Guide](https://www.tvstyleguide.com/firefly/malcolm-reynolds/how-to-dress-like-captain-malcolm-reynolds/)
- [SERENITY (2005) — Captain Mal Reynolds' (Nathan Fillion) Costume — Propstore](https://propstore.com/product/serenity/captain-mal-reynolds-nathan-fillion-costume/)
- [Zoe Washburne Costume Guide — Carbon Costume](https://carboncostume.com/zoe-washburn/)
- [Firefly Zoe Washburne Leather Vest — Films Jackets](https://www.filmsjackets.com/firefly-zoe-washburne-vest)
- [How to Dress Like Hoban "Wash" Washburne — TV Style Guide](https://www.tvstyleguide.com/firefly/hoban-washburne/how-to-dress-like-hoban-wash-washburne/)
- [Firefly/Serenity Wash's Hawaiian shirts — RPF Costume and Prop Maker Community](https://www.therpf.com/forums/threads/firefly-serenity-washs-hawaiian-shirts.111989/)
- [Kaylee Frye – Coveralls — Jessica Smith Creates](https://jessicasmithcreates.com/costumes/kaylee-frye-coveralls/)
- [Sara Sewing: Firefly Cosplay: Kaylee's Jumpsuit Tutorial](https://sarasewing.blogspot.com/2015/01/firefly-cosplay-kaylees-jumpsuit.html)
- [The Ultimate "Jayne Hat" pattern — glitzyfaery](https://glitzyfaery.wordpress.com/2012/10/24/the-ultimate-jayne-hat-pattern/)
- [Make Your Own Jayne Hat — Quantum Mechanix](https://qmxonline.com/blogs/news/13844233-make-your-own-jayne-hat)
- [Inara Serra's Red Satin Gown with Gold Girdle — Liana's Paper Dolls](https://lianaspaperdolls.com/2009/02/19/inara-serrs-red-satin-gown-with-gold-girdle-from-the-train-job-episode-of-firefly/)
- [Inara Shindig — The Costumer's Guide](http://www.costumersguide.com/firefly2.shtml)
- [Simon Tam Firefly Costume — RPF Costume and Prop Maker Community](https://www.therpf.com/forums/threads/simon-tam-firefly-costume.63215/)
- [River Tam Cosplay — beledy.net](http://www.beledy.net/fam/rivtam.htm)
- [River Tam Costume for Halloween — Firefly — costumet.com](https://www.costumet.com/firefly/river-tam/)
- [Derrial Book — The Firefly and Serenity Database (Fandom)](https://firefly.fandom.com/wiki/Derrial_Book)
- [Shepherd Book — Wikipedia](https://en.wikipedia.org/wiki/Shepherd_Book)
- [List of Firefly (TV series) characters — Wikipedia](https://en.wikipedia.org/wiki/List_of_Firefly_(TV_series)_characters)
- In-repo precedent: `docs/avatars/sci-fi/star-trek-tng.md` and
  `docs/avatars/sci-fi/star-trek-ds9.md` (diagonal-strap/sash-as-rig-gap
  precedent); `src/three-renderer.ts` (`AVATAR_SPECS`, `AVATAR_PERSONALITY`,
  `AVATAR_BUBBLES`, `_buildHumanoid` accessory switch) as the
  implementation target this doc specs for.
