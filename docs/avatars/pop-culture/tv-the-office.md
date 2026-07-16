# Avatar pack: Pop-Culture ▸ TV Shows ▸ The Office

Regeneration-ready reference for the Diorama Sims-toon avatar pack generator.
This is a **stylized geometric homage** pack — generic toon minifigures whose
silhouette/color/proportions read as the character archetype, not a likeness.
No logos, no printed text, no character names anywhere in-scene; identity
lives only in this doc's Reference lines and the pack's display labels (which
use descriptive-generic wording, e.g. "Assistant Regional Manager (mustard
shirt, round glasses)").

## Overview

- **Group**: The Scranton, Pennsylvania branch ensemble of the mockumentary
  workplace sitcom *The Office* (US, 2005–2013) — a paper-company office of
  deadpan direct-camera glances, cubicle politics, and a large supporting
  cast built around one attention-hungry boss. This pack covers the eight
  members a casual fan names first: the boss, the will-they-won't-they
  salesman and receptionist, the intense rival, the preppy Cornell grad, the
  uptight cat-loving accountant, the lovable heavyset accountant, and the
  ancient eccentric from Quality Assurance.
- **Hierarchy path**: `pop-culture / tv-shows / the-office`
- **Member count**: 8
- **Rig**: humanoid only (no quadrupeds — Angela's cats are a running gag
  prop, not core cast; the office does not have a mascot animal)
- **Design call — fixed costume colors, not sensor-tint carriers**: like
  `pop-culture/tv/friends`, `pop-culture/tv/seinfeld`, and
  `pop-culture/tv/big-bang-theory`, this is a named-character homage, not a
  generic archetype pack — "which specific coworker is this" lives in a
  fixed per-member palette (Michael's navy suit + loud tie, Dwight's mustard
  shirt, Jim's blue quarter-zip, Pam's pink cardigan, Andy's Cornell-red
  sweater vest, Angela's cat sweater, Kevin's oversized novelty tie, Creed's
  drab olive cardigan). `skin`/`body`/`legColor` are FIXED hex values per
  member, not `tint`. If per-sensor color coding matters for a given
  deployment, recolor a small accent piece instead (tie stripe, cardigan
  trim, hair accent) — none of the members below use a tint carrier by
  default.
- **Shared palette note — 2000s beige cubicle office**: every member sits on
  the same drab corporate backdrop (khaki trousers, brown/black office
  shoes, muted shirt bases) with ONE loud personal signifier layered on top —
  this is a business-casual pack, so the anchor points that matter most are
  `crown`/`head` (hair), `face` (glasses — three of eight members wear them),
  `chest` (shirt/tie/sweater-vest layering — the dominant read, since nearly
  the whole cast is dressed in a shirt-and-necktie combo over neutral
  trousers), and `hand` (each member's one signature office prop: a loud
  tie, a beet, a sketchbook, drumsticks, a chili bowl, a guitar pick).
- **Necktie variety is load-bearing**: five of eight members (Michael, Jim,
  Dwight, Andy, Kevin) wear a necktie over a similar shirt-and-trouser base,
  so the ties themselves are deliberately differentiated — Michael's is an
  ostentatiously WIDE loud two-tone "power tie," Jim's is a plain, narrow,
  visibly LOOSENED tie (a small rotation on the strip sells this), Dwight's
  is a thin, perfectly straight, severe dark solid, Andy's is a striped
  preppy tie with a tie-clip, and Kevin's is the widest and loudest of all
  (novelty-print, approximated as an oversized two-tone block). Combined
  with each member's distinct hair/build/color, no two read as the same
  silhouette at 30 px.

## Members

### 1. `regional-manager-michael` — "Regional Manager (navy suit, wide power tie)"

**Reference**: The self-proclaimed "World's Best Boss" and regional manager
of the Scranton branch — desperate to be liked, performs constant bits for
the camera, dresses in a boxy navy or charcoal suit with a white dress shirt
and a wide tie he thinks reads as a "power tie" but is often garish. Short
combed-back hair with a slight side part. (Michael Scott.)

**Spec**
```
sk: 1.02
headR: 128
headShape: 'sphere'
skin: 0xe6bb98
body: 0x28324a       // navy suit jacket
legColor: 0x222a3c    // matching navy trousers
shoe: 0x241d18        // black dress shoes
eyes: 'dots'
emI: 0
limbR: 1.0
hands: 'sphere'
```

**Accessories**
- **crown** — short combed hair with a side part: a low flattened cap,
  ~`128×30×128mm`, `0x3a2c1e`.
- **chest** — white dress-shirt collar wedge (two small flat angled boxes,
  `~28×16×6mm` each, `0xf5f2ea`) plus an oversized, boldly two-toned tie
  strip running collar-to-belt: `~34×160×8mm`, gold `0xd8b830` with a
  contrasting maroon diagonal stripe block `0x7a2430` — deliberately WIDER
  than any other member's tie so it reads as the "hideous power tie" even
  before color is factored in.
- **hand** — a plain ceramic mug prop (his ever-present desk mug): a short
  flattened cylinder with a loop handle, `~44×48×44mm`, white `0xf2efe6`.

**Silhouette check**: the oversized, boldly two-toned tie against a plain
navy suit is the one thing — its width alone is the tell, since three other
members also wear ties but none this wide; the mug is a close-up
personality bonus (his self-appointed office authority).

**Personality**: `bobMul: 1.1, swayMul: 1.2, cadenceMul: 1.05, ampMul: 1.15`
(an over-eager, performing-for-the-camera energy — a bouncier, showier walk
than anyone else in the pack)
**Bubbles**: `😄🎤👍😬` (attention-seeking showmanship, forced jokes, desperate
need for approval, awkward second-guessing)

---

### 2. `salesman-jim` — "Salesman (blue quarter-zip, loosened tie)"

**Reference**: A paper salesman and the show's deadpan straight man, famous
for his to-camera glances and low-key pranks on his desk rival — a
business-casual look of a button-down shirt and tie under a blue quarter-zip
sweater, with khaki trousers; tall, lanky build, short neat hair. (Jim
Halpert.)

**Spec**
```
sk: 1.06
headR: 124
headShape: 'oval'
skin: 0xe8c2a2
body: 0x3a5a78       // blue quarter-zip sweater over a white shirt
legColor: 0x9a8a64    // khaki trousers
shoe: 0x4a3624        // brown shoes
eyes: 'dots'
emI: 0
limbR: 0.9
armL: 1.02
```

**Accessories**
- **crown** — short, neat side-parted brown hair: a low flattened cap,
  ~`124×26×124mm`, `0x342414`.
- **chest** — white shirt collar wedge (`~26×14×6mm` each, `0xf2ede0`) plus a
  narrow tie strip left visibly LOOSENED — the strip is angled off-vertical
  by a slight rotation rather than hanging straight, `~16×130×6mm`, muted
  slate `0x4a5866`, distinguishing it at a glance from Michael's wide
  straight tie and Dwight's severe straight one.
- **hand** — a small translucent cube with a tiny stapler shape suspended
  inside (a nod to his running gag of encasing Dwight's stapler in gelatin):
  jello block `~60×50×60mm`, pale amber `0xd8c878` at `opacity ~0.55`, with a
  tiny dark stapler-shaped box `~30×10×14mm`, `0x2a2a2a`, embedded near the
  center.

**Silhouette check**: the blue quarter-zip over a loosened, off-angle tie
reads as "the low-key sales guy" — casual-but-still-dressed, the opposite
read from Dwight's severe straight tie; the jello-stapler prop is the
close-up confirmation of his prankster streak.

**Personality**: `bobMul: 0.95, swayMul: 0.9, cadenceMul: 0.95, ampMul: 0.9`
(a relaxed, unhurried saunter with a hint of amused restraint — nothing
frantic, ever)
**Bubbles**: `😏📎👀😂` (dry smirk, prank-planning, camera-glance side-eye,
suppressed laughter)

---

### 3. `receptionist-pam` — "Receptionist (pink cardigan, half-up wavy hair)"

**Reference**: The front-desk receptionist (later a saleswoman and,
eventually, an artist) — warm and soft-spoken, known for a wardrobe of
pastel cardigans and blouses and wavy chestnut-brown hair worn half-up,
half-down. (Pam Beesly.)

**Spec**
```
sk: 0.9
headR: 112
headShape: 'sphere'
skin: 0xecc4a4
body: 0xdca8b8       // soft pink cardigan over a light blouse
legColor: 0x5a4a3a    // tan/brown skirt
shoe: 0x8a6a4a        // tan flats
eyes: 'almond'
emI: 0
limbR: 0.78
armL: 0.9
```

**Accessories**
- **crown** — wavy chestnut-brown hair with volume at the crown: a rounded
  dome, `~120×72×120mm`, `0x5a3a26`.
- **head** (both sides) — loose wavy strands framing the face at ear height,
  pulled back rather than falling to the shoulders: two small flattened
  teardrop shapes, `~34×46×20mm` each, same `0x5a3a26` — the "half-up"
  silhouette read, distinct from a full loose-hair member like Angela's tied
  bun or a long-hair member elsewhere in the roster.
- **hand** — a small sketchbook-and-pencil prop (her later artistic pursuit):
  a thin flat rectangular box, `~50×70×10mm`, cream `0xf0ead8`, with a
  slender pencil cylinder, `~6×60×6mm`, `0xd8a840`, laid across it.

**Silhouette check**: the soft pink cardigan against the half-up wavy
brunette hair is the one thing that reads at 30 px — the pack's gentlest,
most pastel palette by design, standing apart from Angela's stiffer
bun-and-cardigan look; the sketchbook is the close-up confirmation.

**Personality**: `bobMul: 0.95, swayMul: 1.0, cadenceMul: 1.0, ampMul: 0.95`
(an easy, warm, unhurried walk — approachable rather than showy)
**Bubbles**: `🎨☕😊💌` (art hobby, the reception-desk coffee routine, a warm
shy smile, quiet romance notes)

---

### 4. `assistant-regional-manager-dwight` — "Assistant (to the) Regional Manager (mustard shirt, round glasses)"

**Reference**: An intensely rule-bound salesman who insists on the title
"Assistant to the Regional Manager" — a beet farmer and volunteer sheriff's
deputy outside the office, known for a mustard-yellow short-sleeve dress
shirt with a severe dark tie, a brown blazer, and large round metal-framed
glasses over neatly side-parted hair. (Dwight Schrute.)

**Spec**
```
sk: 1.0
headR: 122
headShape: 'sphere'
skin: 0xd8a878
body: 0xc8a030       // mustard-yellow short-sleeve dress shirt
legColor: 0x3a2e20    // brown trousers
shoe: 0x241a10        // brown dress shoes
eyes: 'dots'
emI: 0
limbR: 0.95
```

**Accessories**
- **crown** — short, severely neat side-parted hair: a low tight cap,
  ~`122×24×122mm`, `0x2a1c10`.
- **face** — large round metal-framed glasses (the shared rectangular-lens
  recipe from `tv-big-bang-theory`, adapted round): two flattened cylinder
  "lenses" ~`52×52×8mm` each, centered at eye height, offset `±60mm`
  horizontally, plus a thin bridge box `~14×8×6mm` connecting them at the
  `face` anchor — frame color `0x3a3a3a` (dark metal), noticeably ROUNDER
  and LARGER than a typical rectangular-glasses recipe, which is the point.
- **chest** — a single perfectly straight, severe dark tie strip (no
  loosening, no angle — the opposite of Jim's): `~16×130×6mm`, near-black
  `0x232323`.
- **hand** — a beet prop (his farm's namesake crop): a small rounded
  ellipsoid, `~50×60×50mm`, deep reddish-purple `0x6a1a2e`, with a short
  green stem stub, `~10×20×10mm`, `0x3a6a2a`.

**Silhouette check**: the mustard shirt plus the oversized round glasses is
the one thing — the color alone is unique in the pack, and the glasses
shape (round vs. everyone else's bare eyes) locks the read even in
silhouette; the beet is the close-up confirmation of the farm connection.

**Personality**: `bobMul: 1.15, swayMul: 0.85, cadenceMul: 1.25, ampMul: 1.1`
(a stiff, brisk, almost martial marching gait — rigid intensity, no
wasted motion)
**Bubbles**: `🥊🚨🧮😤` (martial-arts/survivalist intensity, volunteer-deputy
authority obsession, calculator-watch nerdiness, exasperated single-minded
focus)

---

### 5. `sales-rep-andy` — "Sales Rep (Cornell-red sweater vest, preppy)"

**Reference**: An eager-to-please Cornell University graduate (never lets
anyone forget it) with an over-the-top Ivy League wardrobe — pastel and
school-color sweater vests over a collared shirt and striped tie, khaki or
brightly patterned trousers, boat shoes; prone to sudden anger-management
outbursts beneath the friendly surface. (Andy Bernard.)

**Spec**
```
sk: 1.0
headR: 120
headShape: 'sphere'
skin: 0xe8bfa0
body: 0xb03a3a       // Cornell-red V-neck sweater vest
legColor: 0xd8c8a0    // khaki trousers
shoe: 0x8a6a3a        // tan boat shoes
eyes: 'dots'
emI: 0
limbR: 0.9
armL: 0.92
```

**Accessories**
- **crown** — short, wavy sandy-brown hair: a rounded cap with 2–3 shallow
  wave ridges, `~120×34×120mm`, `0x6a4a2a`.
- **chest** — V-neck sweater-vest notch showing a striped tie underneath: a
  V-shaped pair of thin angled boxes (light shirt collar `0xe8e4d8`,
  `~26×20×6mm` each) plus a thin vertical tie strip with an alternating
  stripe hint (two stacked short color-block segments), `~16×70×6mm`, navy
  `0x2a3a5a` and white `0xe8e4d8` bands, and a small silver tie-clip box,
  `~20×6×4mm`, `0xc8c8c8`, near the base.
- **hand** — a small striped guitar-pick / a-cappella-songbook prop (nods to
  his college a-cappella group): a thin flattened triangular-ish box,
  `~36×40×6mm`, cream `0xf0ead8` with a navy stripe accent `0x2a3a5a`.

**Silhouette check**: the Cornell-red V-neck sweater vest with the
striped-tie-and-clip peeking through is the one thing — a louder, more
"trying too hard" preppy read than Michael's suit or Jim's plain quarter-zip;
the songbook prop is the close-up nod to his a-cappella pride.

**Personality**: `bobMul: 1.05, swayMul: 1.1, cadenceMul: 1.05, ampMul: 1.05`
(an eager, bouncy, people-pleasing gait with an undercurrent of nervous
energy)
**Bubbles**: `🎵⛵😅💥` (a-cappella singing pride, preppy leisure/sailing
affect, anxious eagerness, sudden anger flare-ups)

---

### 6. `senior-accountant-angela` — "Senior Accountant (cat sweater, tight bun)"

**Reference**: The uptight, judgmental senior accountant and head of the
Party Planning Committee — a devoted cat owner known for prim turtlenecks
and cardigans (including a memorable knitted cat-print sweater), a pencil
skirt, and her hair pulled into a tight, severe blonde bun with a thin
headband. (Angela Martin.)

**Spec**
```
sk: 0.84
headR: 106
headShape: 'sphere'
skin: 0xead0b8
body: 0x5a2a38       // deep maroon cat-print cardigan
legColor: 0x242424    // black pencil skirt
shoe: 0x1c1c1c        // black flats
eyes: 'almond'
emI: 0
limbR: 0.7
armL: 0.85
```

**Accessories**
- **crown** — straight blonde hair pulled back into a tight, severe bun: a
  low flattened cap, ~`106×20×106mm`, `0xd8c078`, plus a small sphere bun
  sitting proud at the back-crown, `~34mm` diameter, same `0xd8c078`.
- **head** (both sides, thin) — a thin straight headband: a slim box arcing
  over the crown just above the hairline, `~8×6×110mm`, black `0x1c1c1c`.
- **chest** — a small proud cat-silhouette accent on the cardigan (the
  "cat sweater" nod, approximated as color-blocking rather than a printed
  pattern): two tiny triangular ear-shaped boxes plus a small rounded body
  patch, `~20×14×4mm` combined, cream `0xe8dcc0`, sitting a few mm proud of
  the maroon base.
- **hand** — a small cat prop (a sphere body, two small triangular ears, and
  a thin curled tail): body `~40mm` diameter, cream `0xe8dcc0`, ears/tail
  same tone.

**Silhouette check**: the tight severe blonde bun with a thin black headband
above a stiff, high-necked cardigan is the one thing that reads at 30 px —
noticeably more buttoned-up and rigid than Pam's soft half-up waves; the cat
prop plus the small cat-silhouette chest accent confirm the character even
before the cardigan's maroon tone registers.

**Personality**: `bobMul: 0.8, swayMul: 0.75, cadenceMul: 0.95, ampMul: 0.7`
(a stiff, controlled, prim walk — minimal sway, disapproving posture)
**Bubbles**: `🐱📏😒🙏` (cat devotion, strict rule enforcement, judgmental
side-eye, moral righteousness)

---

### 7. `accountant-kevin` — "Accountant (oversized novelty tie, easygoing)"

**Reference**: A good-natured, none-too-sharp accountant and amateur
drummer — heavyset build, short-sleeve or plain button shirts, and a
running gag of wearing an even wider, louder novelty necktie than anyone
else in the office (paired with a memorably disastrous chili incident).
(Kevin Malone.)

**Spec**
```
sk: 1.16
headR: 132
headShape: 'oval'
skin: 0xd8a880
body: 0xd8d0c0       // plain light button shirt
legColor: 0x4a4038    // brown trousers
shoe: 0x342820        // brown shoes
eyes: 'dots'
emI: 0
limbR: 1.18
armL: 0.92
```

**Accessories**
- **crown** — thinning, receding short dark hair: a small low cap set well
  back from the front hairline (leaving more bare scalp/skin-tone forehead
  showing than any other member), ~`100×22×100mm`, `0x2c2018`.
- **chest** — the widest, loudest tie in the pack: an oversized two-tone
  block strip, `~40×170×8mm`, teal `0x2a7a72` with a bold contrasting
  diagonal stripe `0xd85a3a` — deliberately WIDER even than Michael's
  power tie, playing up the "louder is funnier" gag.
- **hand** — a small bowl prop with a reddish-brown fill (a nod to his
  famous chili spill): a shallow flattened cylinder, `~60×20×60mm`, cream
  `0xf0ead8`, with a rounded reddish-brown fill disc on top, `~50mm`
  diameter, `0x8a3020`.

**Silhouette check**: the heavyset build plus the oversized, extra-wide
novelty tie is the one thing — its width alone out-does even Michael's tie,
which is the joke; the chili bowl is the close-up confirmation of the
character's most famous scene.

**Personality**: `bobMul: 1.2, swayMul: 0.9, cadenceMul: 0.85, ampMul: 0.85`
(a slow, heavy, amiable rolling gait — unhurried and good-natured)
**Bubbles**: `🥣🥁🎰😊` (the chili mishap, drumming hobby, a gambling habit,
easygoing friendliness)

---

### 8. `quality-assurance-creed` — "Quality Assurance (graying frizzy hair, tinted glasses)"

**Reference**: The ancient, eccentric Quality Assurance representative with
a hazy and possibly criminal past — a former 1960s rock musician, prone to
bizarre non-sequiturs and a phenomenally poor memory; visually the office's
oldest and most weathered figure, with unruly graying hair and small tinted
glasses over rumpled, drab cardigans. (Creed Bratton.)

**Spec**
```
sk: 0.93
headR: 116
headShape: 'oval'
skin: 0xc89870
body: 0x6a6255       // drab olive/taupe cardigan
legColor: 0x443c30    // brown trousers
shoe: 0x2e2820        // worn brown shoes
eyes: 'dots'
emI: 0
limbR: 0.85
```

**Posture**: `pitch: 0.15` (a slight forward stoop — the pack's oldest,
most weathered build)

**Accessories**
- **crown** — wild, unruly graying hair: a lumpy dome built from several
  overlapping small bumps rather than one smooth surface (suggesting
  frizz), `~118×60×118mm` overall, ash-gray `0x9a968a` — see Rig gaps.
- **face** — small tinted glasses (the shared rectangular-lens recipe from
  `tv-big-bang-theory`, sized down and tinted): two flattened lens boxes,
  `~36×26×6mm` each, offset `±48mm` horizontally, plus a thin bridge box,
  `~10×6×5mm`, all in a warm amber-tinted tone `0x5a4326` rather than clear
  — noticeably smaller and rounder than Dwight's oversized round frames.
- **hand** — a small guitar-pick prop (a nod to his 1960s rock-band past):
  a thin flattened triangular box, `~30×32×5mm`, tortoiseshell
  `0x8a5a2a`.

**Silhouette check**: the wild gray frizzy-hair dome plus a forward stoop is
the one thing that reads at 30 px — visibly the oldest, most weathered
silhouette in the pack, distinct from every other member's neat/managed
hairstyle; the tinted glasses and guitar pick are close-up confirmations of
his eccentric-musician backstory.

**Personality**: `bobMul: 0.85, swayMul: 1.15, cadenceMul: 0.75, ampMul: 0.8`
(a slow, loose, slightly shuffling drift — detached and unhurried, never in
a rush)
**Bubbles**: `🎸🕶️🤔💤` (rock-musician past, shady mysteriousness, cryptic
non-sequiturs, sleepy detachment)

## Rig gaps

- **No neck/collar anchor** (recurring gap, also flagged in `tv-friends`,
  `tv-seinfeld`, and `tv-big-bang-theory`): every tie in this pack (Michael,
  Jim, Dwight, Andy, Kevin) and every collar wedge are approximated as small
  boxes bolted onto the `chest` anchor rather than a true neck-wrapping
  band. This pack leans on the gap harder than most — five of eight members
  need a tie — but all five stayed distinguishable purely through width/
  angle/color variation on the same `chest`-anchor recipe (see "Necktie
  variety is load-bearing" in Overview), so it did not block shipping.
- **No dedicated "receding hairline" primitive.** Michael's combed-back hair
  and Kevin's thinning hair are both approximated the same way — a smaller,
  further-back `crown` cap that leaves more bare (skin-tone) forehead
  showing — rather than any true scalp-shading or hairline-recession
  concept. Reads fine at 30 px but is a coarse approximation up close.
- **No frizzy/textured-hair primitive.** Creed's wild graying hair is
  approximated by clustering several overlapping small dome bumps instead
  of one smooth `crown` shape — this is a shape-level workaround, not a
  first-class "frizzy/permed hair" concept, and is closely related to the
  already-parked fabric-pattern gap (`docs/ROADMAP.md` § avatar rig gaps)
  in that both want a "textured surface" primitive the rig doesn't have.
- **No fabric-pattern/print support** (expected — the rig is color+shape
  only; same gap flagged in every named-cast pack to date). Angela's
  knitted cat-print sweater is approximated with a small proud
  cat-silhouette color-block accent on the `chest` anchor rather than any
  printed/knitted pattern.

None of the above blocked shipping a member — all eight have a complete,
distinguishable spec using only the current rig's primitives and anchors;
the `face`-anchor glasses recipe (shared with `tv-big-bang-theory`) covered
both Dwight's oversized round frames and Creed's small tinted ones without
needing a new eye style or anchor.

## Sources

- [Michael Scott Costume Guide for Cosplay and Halloween — Costume Wall](https://costumewall.com/dress-like-michael-scott/)
- [The Office: Michael Scott's Birthday Suit — BAMF Style](https://bamfstyle.com/2021/03/15/office-michael-birthday-suit/)
- [How to Dress Like Dwight Schrute from The Office — Costume Wall](https://costumewall.com/dress-like-dwight-schrute/)
- [Dwight Schrute's clothing — Dunderpedia: The Office Wiki (Fandom)](https://theoffice.fandom.com/wiki/Dwight_Schrute's_clothing)
- [Dress Like Pam Beesly Costume — Costume Wall](https://costumewall.com/dress-like-pam-beesly/)
- [The Office: Pam's 5 Best (& 5 Worst) Outfits — ScreenRant](https://screenrant.com/office-pam-best-worst-outfits/)
- [The Office: 10 Of Angela's Best (And Worst) Outfits — ScreenRant](https://screenrant.com/office-angela-martin-best-worst-outfits-kinsey/)
- [Cat Sweater as Seen on The Office worn by Angela — Worthpoint](https://www.worthpoint.com/worthopedia/cat-sweater-as-seen-on-the-office-worn-by)
- [Kevin Malone — Wikipedia](https://en.wikipedia.org/wiki/Kevin_Malone)
- [This Character Was Actually the Heart of 'The Office' — Collider](https://collider.com/the-office-kevin-malone-was-heart/)
- [Creed Bratton | Dunderpedia — The Office Wiki (Fandom)](https://theoffice.fandom.com/wiki/Creed_Bratton)
- [List of The Office (American TV series) characters — Wikipedia](https://en.wikipedia.org/wiki/Creed_Bratton_(The_Office))
- [How to Dress Like Andy Bernard from The Office — Costume Wall](https://costumewall.com/dress-like-andy-bernard-from-the-office/)
- [Andy Bernard | Dunderpedia — The Office Wiki (Fandom)](https://theoffice.fandom.com/wiki/Andy_Bernard)
- Diorama source reference (existing rig conventions, anchors, `SPECS`
  table, per-kind accessory recipes): `src/three-renderer.ts`
  (`_buildHumanoid`, `AVATAR_KINDS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`);
  prior pack docs `docs/avatars/pop-culture/tv-friends.md`,
  `docs/avatars/pop-culture/tv-seinfeld.md`, and
  `docs/avatars/pop-culture/tv-big-bang-theory.md` for anchor/recipe
  precedent (shared rectangular-glasses recipe, necktie-on-`chest`
  approximation, neck/collar gap).
