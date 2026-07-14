# Household Furniture & Built-Ins — Diorama Modeling Reference

This document is a build reference for adding STYLIZED 3D furniture and built-in
fixtures to Diorama, the Sims-2000-style Home Assistant floor-plan app. Every
piece below is broken into simple primitives (box / cylinder / sphere / cone)
positioned in **millimeters**, with the local origin at the piece's floor-level
center and **local +Z as the front** — matching the conventions the renderer
already uses for furniture, doors, and fixtures. Use it to spec new
`FURNITURE_KINDS` defaults or hand-authored `ObjectRecipe`s, and to plan which
pieces deserve an animated "in use" state.

## Table of Contents

1. [Sofa and sectional](#1-sofa-and-sectional)
2. [Armchair and recliner](#2-armchair-and-recliner)
3. [Coffee table and end/side tables](#3-coffee-table-and-endside-tables)
4. [Dining table and dining chairs](#4-dining-table-and-dining-chairs)
5. [Bar stool and counter stool](#5-bar-stool-and-counter-stool)
6. [Bed](#6-bed)
7. [Dresser and chest of drawers](#7-dresser-and-chest-of-drawers)
8. [Nightstand](#8-nightstand)
9. [Wardrobe / armoire and built-in closet](#9-wardrobe--armoire-and-built-in-closet)
10. [Desk and office chair](#10-desk-and-office-chair)
11. [Bookshelf / bookcase](#11-bookshelf--bookcase)
12. [Kitchen sink and faucet](#12-kitchen-sink-and-faucet)
13. [Bathroom vanity and sink](#13-bathroom-vanity-and-sink)
14. [Kitchen cabinets and countertops](#14-kitchen-cabinets-and-countertops)
15. [Kitchen island](#15-kitchen-island)
16. [Ottoman and bench](#16-ottoman-and-bench)
17. [Entertainment center / TV console / media wall](#17-entertainment-center--tv-console--media-wall)
18. [Built-in fireplace and mantel](#18-built-in-fireplace-and-mantel)
19. [China cabinet / hutch / sideboard buffet](#19-china-cabinet--hutch--sideboard-buffet)
20. [Bathtub, shower, and toilet](#20-bathtub-shower-and-toilet)
21. [Modeling notes for Diorama](#modeling-notes-for-diorama)

---

## 1. Sofa and sectional

Loveseat, 3-seat sofa, chaise sofa, L-sectional, U-sectional.

**Dimensions** (W × D × H, mm; W = overall width along the front, D =
front-to-back depth, H = overall height including back cushion):

| Variant | Width | Depth | Height | Seat height | Arm height |
|---|---|---|---|---|---|
| Loveseat (2-seat) | 1400–1550 | 850–1000 | 800–900 | 430–460 | 600–660 |
| 3-seat sofa (standard) | 1800–2200 | 900–970 | 810–915 | 430–460 | 610–685 |
| Oversized / "family" sofa | 2200–2600 | 1000–1070 | 850–950 | 450–480 | 650–700 |
| Chaise sofa (sofa + extension) | sofa side 1830–2440; chaise extension 1520–1830 long × 915–1020 deep | — | 810–915 | 430–460 | 610–685 |
| L-sectional (2 runs) | long run 2440–3660; short run (return) 1520–2440 | 915–1120 | 810–915 | 430–460 | 610–685 |
| U-sectional (3 runs) | center span 2440–3660; each return 1520–2130 | 915–1020 | 810–915 | 430–460 | 610–685 |

Seat depth (cushion front-to-back, subset of overall D): 500–635 mm. A
corner/wedge piece of an L/U sectional is roughly a D×D square block joining
two runs.

**Shape breakdown** (origin at floor-level piece center):
- **Base/plinth**: flat box spanning the full footprint, 100–150 mm tall, on 4
  short cylinder or box **legs** (Ø/side 40–60 mm, 100–150 mm tall) at the
  corners — or a **skirted** base (plinth box drops straight to the floor, no
  visible legs; common on traditional/Chesterfield styles).
- **Seat cushion(s)**: one long box per module (or 2–3 boxes with a hairline
  gap to read as separate cushions), ~150–200 mm thick, seat surface at
  430–460 mm.
- **Back band**: a box the same width, set toward the rear, ~250–350 mm
  thick, rising from the seat top to overall height (810–915 mm) — this is
  the **+Z (back)** side per Diorama's existing sofa builder.
- **Armrests**: two boxes (or rolled-arm = box + half-cylinder cap) at the
  −X/+X ends, roughly seat-height to ~100 mm above it, ~150–220 mm wide,
  running the full depth. Armless "sectional module" pieces omit these on
  sides that abut another module.
- **Sectional corner/wedge**: a square block (D×D) where two runs meet.
  **Chaise**: one run's seat box extends past the others' front line by the
  chaise length with no armrest on the extended end.
- **Throw pillows** (decoration): 2–4 boxes or squashed spheres, ~400–500 mm,
  tilted a few degrees, tucked into a back corner.
- **Front face**: local **−Z** (open, cushion-facing side); backrest/arm
  decorations live on **+Z**/±X per the existing `sofa`/`chaise` builders.
- **Moving parts**: none structural. A future **reclining** variant would add
  a hinged front footrest box and a rear-tilting back band — out of scope for
  v1 static geometry but bolts onto the same box stack.

**Colors & finishes**: linen/linen-blend, chenille, boucle, tweed, brushed
velvet, microfiber/performance fabric, canvas/cotton duck; leather / faux
leather (smooth, slightly glossy). Common colors: greige, oatmeal, dove gray,
charcoal, navy, forest/olive green, terracotta/rust, mustard, blush, classic
black/brown leather. Legs/frame: natural or walnut-stained wood (tapered peg
or angled hairpin), matte black or brushed-brass metal, or fully
upholstery-skirted. Styling cues (texture, not geometry): tufted/channel-
stitched back, box-edge vs. waterfall-edge seat cushions, contrast welt/piping.

**Placement**: FLOOR-resting (`seat` set → sittable `SitSpot`s), elevation 0,
legs included in the H figure above. Living room / family room / den
primarily; loveseats also appear in bedrooms, offices, reading nooks. No wall
or ceiling mounting.

**Active / interactive state**:
- **Occupied**: dwelling target eases into the seat (hip/knee pose, facing
  the room); optional 5–10 mm seat-cushion Y-compression while `sit > 0` to
  sell weight.
- **Multi-seat occupancy**: `floor(W/600)` spots across the usable width
  minus arm insets; L/U sectionals spread spots along the main run plus one
  per return arm.
- **Contextual activity**: seated + room has a bound/ON TV → `watch_tv` pose;
  seated + evening/night → seated-evening thought-bubble pool (book/phone/
  tea/TV/nap glyphs).
- **Seasonal/decorative**: optional throw-blanket-draped variant (low box
  over one arm); no powered/lit state (sofas aren't entity-bound).

**Variations**: seat count (loveseat / 3-seat / 4-seat oversized); shape
family (straight, chaise-end, L-sectional left/right-facing, U-sectional);
arm style (track/square, rolled, armless module); base style (exposed
tapered legs, metal legs, fully skirted); upholstery family (fabric vs.
leather — material only); cushion look (3-cushion seat, one-piece bench
seat, individual modular cushions with tufting toggle).

**Animation opportunities**:
- Idle: none required when unoccupied; optional subtle ambient light-catch
  shimmer on velvet/leather.
- On sit: cushion-compression blend (small −Y scale/offset on the seat box
  under the occupant) synced to the existing `sit` 0→1 blend; back cushion
  gets a slight lean-indent.
- On stand: reverse over ~0.3–0.5 s.
- Ambient prop motion: a draped throw/pillow could get a one-shot settle
  animation the first time a rig sits nearby, echoing the bed-cover
  "breathing" plane idiom.
- Multi-occupant: stagger compression/lean per claimed `SitSpot` so two
  people on the same sectional don't read as one rigid block.

---

## 2. Armchair and recliner

**Dimensions** (W × D × H, mm; local +Z = backrest side, −Z = seat-front/
footrest side):

| Variant | Width | Depth (upright) | Height | Seat ht | Arm ht |
|---|---|---|---|---|---|
| Compact/slipper armchair | 650–750 | 700–800 | 750–850 | 420–450 | 550–600 (or armless) |
| Standard armchair/club chair | 750–900 | 800–950 | 800–1000 | 420–480 | 580–650 |
| Oversized/wingback armchair | 900–1050 | 900–1000 | 1000–1150 | 450–480 | 600–680 |
| Manual/power recliner (upright) | 750–1000 | 900–1050 | 1000–1100 | 450–480 | 600–650 |
| Recliner, **fully reclined** | same | **1500–1800** total (footrest adds 700–900 forward of −Z face) | drops ~150–250 (backrest lays back ~130–145°) | — | — |

**Shape breakdown**:
- Seat cushion: box with a rounded top edge (bevel or slightly squashed
  cylinder blend), on a hidden frame/legs.
- Backrest: box, or two-lobe box (wingback = box + two angled "ear" boxes
  flaring forward at the top corners) on **+Z**, raked back ~10–15°.
- Armrests: two boxes on **±X**, front edge rounded (small cylinder cap
  optional), ~550–650 mm tall; roll-arm (quarter-cylinder profile) or
  track-arm (flat box).
- Legs: 4 short cylinders or tapered boxes (wood) inset ~100 mm from
  corners, OR a central pedestal (cylinder + flared cone/disc base) for
  swivel/glider types.
- Recliner-specific moving parts:
  - **Backrest**: hinge pivot at seat-back junction, rotates ~30–40°
    rearward when reclined.
  - **Footrest**: a box stored flat under the front seat lip (−Z),
    translates + rotates up ~90° to horizontal when deployed — a separate
    box parented to a hinge/slide at the seat front.
  - Manual lever: small cylinder/paddle on the right armrest (cosmetic
    detail, non-animated is fine).
  - Power recliners: no visible lever; may show a small toggle/USB plate on
    the outer armrest.
- Rocker/glider variants: replace legs with two long curved runners
  (flattened arc, or a thin curved box/cylinder segment) or a swivel base
  (cylinder plinth).

**Colors & finishes**: leather/leatherette (cognac, brown, black, oxblood,
cream); fabric (grey, navy, olive, tan, houndstooth/plaid); velvet (emerald,
mustard, blush, navy). Frame/legs: natural or dark-stained wood (oak/walnut
tones), matte black or brushed-brass metal on modern styles. Trim: nailhead
studs along arm/skirt edges, tufted button-back diamond pattern, contrast
piping.

**Placement**: FLOOR-resting, freestanding (elevation ≈ 0). Living room, den,
bedroom reading nook, home office. Recliners need real clearance behind/in
front for the reclining envelope (~300–450 mm behind for wall-hugger types,
more for standard swing-back) — a soft placement hint, not a hard collision
rule.

**Active / interactive state**:
- **Occupied**: standard sit-blend (seat compresses slightly, avatar
  reclines torso against backrest).
- **Reclined** (recliner only): backrest tilts back + footrest deploys as a
  two-stage blend (footrest first, then backrest), synced to the avatar's
  `lie`/relaxed-sit pose so ankles rest on the footrest.
- **Powered**: brief "motorized" easing (~1.5–2 s smoothstep, not instant)
  distinguishes power recliners from a manual snap; optional soft amber
  USB/control-panel glow on the armrest while charging.
- **Massage/heat** (premium power recliners): subtle high-frequency vertical
  jitter on the backrest/seat while active, small red heat-indicator glow.
- **Rocker/glider**: gentle idle rocking arc (few degrees) while occupied
  and idle-fidgeting.

**Variations**: style (club chair, wingback, barrel chair, slipper/armless,
tub chair, accent/slipper, Chesterfield-tufted); recliner subtype (manual
lever, power/motorized, rocker-recliner, glider-recliner, swivel-recliner,
wall-hugger zero-clearance, lift-chair for mobility — full seat raises/tilts
forward to help standing); size (compact, standard, oversized/"big man");
material/color per the palette above; wood vs. metal leg finish toggle.

**Animation opportunities**: idle — subtle cushion settle on sit-down; slow
ambient rock for glider/rocker types; occasional armrest-lever nudge (manual)
as a fidget. Active — two-stage recline deploy (footrest slide/rotate up,
then backrest tilt) with eased motorized timing for power units; reverse on
stand-up; light pulse for USB/heat/massage indicators; continuous light
jitter for massage mode; return-to-neutral spring when the avatar leaves
(footrest retracts, backrest springs upright faster than it deployed).

---

## 3. Coffee table and end/side tables

**Dimensions** (mm):

| Type | Width/Diameter | Depth | Height |
|---|---|---|---|
| Compact coffee table | 900–1050 | 450–500 | 400–420 |
| Standard rectangular coffee table | 1100–1350 | 550–650 | 430–460 (rule of thumb: sofa seat height ±25 mm) |
| Oversized / sectional coffee table | 1400–1700 | 700–900 | 430–460 |
| Round coffee table | Ø 900–1200 | — | 400–450 |
| Square coffee table | 750–1050 sq | — | 400–450 |
| End/side table (rectangular) | 400–550 | 450–600 | 500–650 |
| End/side table (round/drum) | Ø 400–550 | — | 550–680 |
| Tall "C-table" / laptop table | 300–450 | 300–450 | 600–700 (slides over sofa arm/lap) |

Height rule: coffee-table top ≈ paired sofa's seat height (0 to −25 mm);
end-table top ≈ sofa/chair arm height (+50 to +100 mm over the coffee table).

**Shape breakdown** (origin at floor center, +Z = front):
- **Tabletop**: one flat `box` (thickness 25–50 mm; solid wood/stone slabs up
  to 40 mm, glass/thin metal tops 10–20 mm). Round variants use a squat
  `cylinder` instead.
- **Apron/skirt** (optional, mid-range/traditional): thin `box` band just
  under the top, inset ~15–20 mm from the edge — omit for minimalist/glass
  styles.
- **Legs** (primary style differentiator, 4 recipes):
  - *Peg/tapered square legs*: 4× thin tapered `box` (30–40 mm sq top,
    ~20 mm at floor), splayed slightly outward — mid-century.
  - *Straight cylindrical legs*: 4× `cylinder` (Ø 30–50 mm), vertical —
    modern.
  - *Pedestal base*: 1 central `cylinder` (Ø 100–150 mm) + a flat round or
    X-shaped `box` foot plate — round tables.
  - *Trestle/plank base*: 2 flat `box` slabs near each end instead of 4
    legs — farmhouse.
- **Lower shelf** (common on coffee tables, less so end tables): a second
  thin `box`/`cylinder` slab ~150–200 mm off the floor, same footprint minus
  legs — good "clutter" prop-drop surface.
- **Drawer face** (some end tables): a shallow `box` inset in the apron on
  the front (+Z) face — non-functional unless animated open.
- **Front face**: for asymmetric pieces (drawer or shelf lip), +Z is the
  drawer-face side; symmetric 4-leg tables have no meaningful front and can
  skip the chevron indicator (`frontArrow: false`).

**Colors & finishes**: wood tones — natural oak/light ash, walnut/espresso
dark brown, black-stained, whitewashed (matte/satin lacquer). Glass top
(clear or smoked) over metal or wood base — low-opacity see-through box.
Marble/stone-look top (white/grey veined) paired with black or brass metal
base. Metal bases: matte black, brushed brass/gold, brushed nickel/chrome.
Rattan/wicker basket-weave lower shelf or base (textured tan/brown) for
coastal/boho. Upholstered/storage ottoman-as-coffee-table — treat as the
existing `ottoman` kind, not this recipe.

**Placement**: FLOOR-resting. Coffee table centered in front of the primary
sofa/sectional, ~350–450 mm from its front edge (walking clearance).
End/side tables flank sofa/chair arms or sit beside a bed. No wall-snap
needed (freestanding, floor-centered in a seating group). `surface: true`
should be set so mountable props (books, remote, drink, lamp, plant) can
snap onto the top like countertop appliances.

**Active / interactive state**: no powered/electronic state in the base
piece. Prop dressing driven by nearby activity: a mug/plate prop appears on
the surface when a seated rig's `sit` blend engages `eat_at_table`/
`work_at_desk` near it, disappearing on stand. Drawer-front end tables: a
drawer can pop open briefly on a "look for remote / rummage" idle fidget —
translate along local +Z rather than rotate (a drawer slides, not swings).
Optional stretch: LED-edge lighting or a wireless-charging glow inset in the
top, togglable if ever bound to a `light.*`/`switch.*` entity.

**Variations**: shape (rectangular, round, square, oval, kidney/free-form,
nesting pair, lift-top hinged); storage (open lower shelf, closed drawer(s),
fully enclosed trunk/ottoman); base style (4-leg, pedestal, trestle,
X-crossed metal, cube/plinth); material pairing (wood/wood, glass/metal,
stone/metal, all-metal, all-wood, woven/rattan); size tiers — Compact,
Standard, Oversized/Sectional, Round, Nesting-set; end-table sub-kind
**C-table** (cantilevered top slides over a sofa arm/lap).

**Animation opportunities**: idle — none for the object itself; its main
role is as an anchor for nearby humanoid idle fidgets and a prop-hosting
surface (book, phone, drink, remote, decorative bowl/plant/candle spawn
points). Active — lift-top hinge animation (rotate top about its rear edge,
same coincident-face care as appliance doors); drawer slide-out (translate,
not rotate); nesting tables could offset-animate on placement (low
priority). No seasonal/weather-driven state; no power state.

Sources: [Flowyline](https://flowyline.com/blogs/for-diy-ers/coffee-table-dimensions) ·
[Sohnne](https://sohnne.com/standard-coffee-table-size/) ·
[Popmaison](https://www.popmaison.com/blogs/guide/coffee-table-size) ·
[Timber and Tulip](https://www.timberandtulip.com/blogs/news/sizing-guide-for-your-coffee-table) ·
[Dimensions.com](https://www.dimensions.com/collection/coffee-tables-accent-tables) ·
[Rapport Furniture](https://rapportfurniture.com/blogs/rapport-furniture/end-table-dimensions-guide) ·
[Kouboo](https://www.kouboo.com/blogs/news/side-end-table-height-and-size-guide) ·
[Wayfair](https://www.wayfair.com/sca/ideas-and-advice/guides/end-table-height-how-tall-should-your-side-table-be-T478) ·
[Dimensions.com](https://www.dimensions.com/collection/end-tables-side-tables)

---

## 4. Dining table and dining chairs

**Dimensions**:

| Piece | Width | Depth | Height |
|---|---|---|---|
| Compact table (4-seat) | 800–1200 mm | 800–900 mm (or round Ø900–1100) | 720–760 mm |
| Standard table (6-seat, rectangular) | 1600–1900 mm | 900–1000 mm | 750 mm |
| Large table (8-seat) | 2000–2400 mm | 1000–1100 mm | 750 mm |
| Round table (4–6 seat) | Ø1000–1500 mm | — | 750 mm |
| Dining chair | 420–480 mm | 500–560 mm | 850–950 mm overall; **seat height 450–500 mm** |
| Bench (alt. to chairs) | 1200–1800 mm | 300–350 mm | seat 450 mm |

Table height 750 mm is near-universal; chair seat ~450 mm with ~260–280 mm
knee clearance under the top. Leaf/extension tables add 300–500 mm when
opened (a simple "extended" boolean/prop rather than a moving part in v1).

**Shape breakdown**:
- **Table**: one flat `box` top (thickness 25–40 mm) at y=750 (top surface),
  origin at floor-level center. Legs as one of:
  - 4 corner `box`/`cylinder` legs (leg-and-apron style) — thin box apron
    band (≈80 mm deep) just under the top on all 4 sides for realism.
  - Pedestal style: 1–2 central `cylinder` columns + a flat `cylinder`/`box`
    base foot.
  - Trestle style: 2 flat vertical `box` end-panels + 1 horizontal `box`
    stretcher.
  - Front face (+Z) arbitrary for a symmetric table — no chevron needed
    (`frontArrow: false`).
- **Chair**: `box` seat pad at seat height, `box` backrest rising from the
  rear (+Z, matching Diorama's back-decoration convention) to ~900 mm, 4 thin
  `cylinder`/`box` legs. Armchair variant adds 2 short `box`/`cylinder`
  armrests at ~650 mm. Front (−Z) is the open seating side — the chair
  rotates to face the table when placed.
- **Bench**: single long `box` seat + 4–6 `box` legs, no back.

**Colors & finishes**: wood tones — honey oak, walnut brown, espresso/
black-brown, whitewashed/weathered gray, natural pine (matte/satin
wood-grain). Table tops: solid wood, laminate, glass (light blue-tinted
translucent box), marble/stone-look (white/gray veining), matte black or
white lacquer, concrete-look gray. Metal accents: matte black or brushed-
brass hairpin/tube legs, popular with a wood top. Chairs: matching wood,
painted solid colors (black, white, sage, navy) for a mixed "mismatched
chair" bistro look, woven rattan/cane seat-and-back, upholstered fabric seat
pads (neutral linen, gray, mustard, terracotta) or full upholstered "parsons"
chairs.

**Placement**: FLOOR-resting, always in the dining room / kitchen-dining
combo / open-plan great room. Table centered under a pendant/chandelier
light fixture typically. Chairs float freely around the table — good
candidates for per-side `SitSpot` layout (2 long sides + 1–2 ends), spaced
~600–650 mm center-to-center. No wall-mount; benches sometimes pushed flush
against a wall on one side.

**Active / interactive state**: not entity-bound itself in most homes —
primarily an **anchor for seated activity** (`eat_at_table`) rather than
HA-driven state. Visible "in use" cues: place settings / plate+glass prop set
appearing when a rig is seated and `eat_at_table` engages; tablecloth or
centerpiece (fruit bowl, vase, candle) as static dressing. Optional seasonal
dressing: holiday centerpiece swap (pumpkins in fall, poinsettia/candles in
winter). Extension leaf: a simple "extended" toggle swapping table length,
no real hinge animation needed.

**Variations**: shape (rectangular, round, oval, square, square-with-drop-
leaves); seat count/size tiers (2-seat bistro, 4-seat compact, 6-seat
standard, 8+ seat great-room); leg style (4-leg traditional, pedestal
single/double column, trestle, hairpin); chair style (classic ladder-back,
upholstered parsons, cane/rattan bistro, modern shell — molded seat on
splayed legs, no separate back-and-legs, single box+cone/cylinder legs;
bench instead of end chairs; mixed head-chair/captain's chair with arms at
the ends); material/finish pairings as above.

**Animation opportunities**: idle — none for the table itself; chairs are
static props except when claimed. Active — chair visually "pulled out"
slightly (~150 mm outward slide) when a rig approaches to sit, eased back in
as they settle (reuses the sit-blend `bl(cur,tgt,w)` idiom). Seated rig ties
into `eat_at_table` arm-IK (hands on the tabletop) and could drive a simple
prop swap (empty plate → plate-with-food → empty) on a timer. Centerpiece
candle flame flicker (reuse the fireplace-flicker `Math.random()` idiom).
Extended/leaf state: swap-on-toggle rather than an animated slide.

---

## 5. Bar stool and counter stool

**Dimensions** (W × D × H; seat height is the critical number since it must
match the companion `surface` height it tucks under):

| Variant | Overall footprint (W×D) | Seat height | Overall height (incl. back, if any) | Companion surface height |
|---|---|---|---|---|
| Counter stool | 400–460 × 400–530 mm | 610–740 mm (typ. ~635–660 mm) | ~890–1050 mm (backless: seat ht only) | Counter, 865–915 mm |
| Bar stool (standard) | 460–560 × 460–560 mm | 735–815 mm (typ. ~760 mm) | ~965–1140 mm | Bar/high table, 1015–1065 mm |
| Tall / spectator stool | 460–560 × 460–560 mm | 840–915 mm | ~1040–1220 mm | Extra-tall bar ledge, ~1120 mm+ |
| Backless disc/saddle stool | 330–400 dia. | as above per height class | seat only | — |

Rule of thumb: leave ≥250–300 mm clearance between seat top and counter/bar
underside. Footrest ring (round pedestal base) typically sits 250–300 mm
above floor.

**Shape breakdown** (origin = floor-level center, front = local +Z, the
direction the sitter's knees point):
- **Seat**: one flattened `cylinder` (round stool, ~330–400 mm dia. ×
  40–50 mm thick) or a rounded `box` (square/rectangular seat) at seat
  height.
- **Base — two families**:
  - *4-leg splayed*: 4 thin `cylinder`s (18–25 mm dia.) angled outward from
    seat underside to floor, matching a dining-chair splay; a `cylinder`
    footrest ring (18–22 mm dia., y ≈ 280 mm) connecting the front two (or
    all four) legs.
  - *Pedestal/disc base*: one central `cylinder` (60–90 mm dia.) from seat
    to a flat round `cylinder` foot plate (300–380 mm dia. × 15 mm) at
    floor, plus a thin `cylinder` footrest ring near the base (common on
    gas-lift stools).
- **Backrest** (counter/bar chair variant): a curved `box` or thin vertical
  `cylinder` spindles rising from the rear seat edge to ~350–450 mm above
  the seat (low back, doesn't block reach-over).
- **Armrests** (optional): two thin `box`/`cylinder` uprights + horizontal
  rail at ~200–230 mm above seat, set at ±(W/2 − 30 mm).
- **Adjustable gas-lift variant**: 5-star `cylinder`-spoke base (5 short
  cylinders radiating from a central hub) + a single central `cylinder`
  lift column + small floor `sphere`/`cylinder` casters or glides — no
  separate footrest ring since the seat itself lowers.

**Colors & finishes**: black, white/cream, navy, mustard, sage, terracotta,
camel/tan leather look — PU leather, woven fabric, velvet, or bare molded
plastic/wood (Scandinavian bent-plywood). Wood tones (bar-height wood
stools): natural oak/ash, walnut, whitewash, matte black-stained. Metal
base finishes: brushed nickel, matte black, brass/gold, chrome, bronze —
often a strong style signal distinct from the seat. Molded-plastic seats
(Eames-style/industrial): white, black, red, yellow, mint, translucent.
Rattan/wicker woven seats for coastal/boho.

**Placement**: FLOOR-resting. Kitchen (at an island/peninsula — the single
most common placement), dining area (bar-height tables), home bar/basement
bar, breakfast nook. Pairs with a `surface`-flagged counter/island top or
bar-height table at the heights above; stools are NOT parented to the
surface, just positioned adjacent/under it. Typically placed in a row along
one edge, spaced ~600–700 mm on-center. Many are stackable or swivel in
place; a "tucked in" vs. "pulled out" idle position could be two placement
presets.

**Active / interactive state**: **Occupied** — hips land on the seat top,
knees drop toward the counter/bar surface (`eat_at_table`/drink-at-bar
activity); feet often don't reach the floor on tall bar stools (footrest
ring instead) — worth a distinct foot-on-footrest pose vs. a normal dining
chair's feet-on-floor pose. **Swivel** (gas-lift variants): idle
micro-rotation of the seat top around the vertical axis while occupied — a
cheap, readable "someone's relaxed here" tell distinct from static dining
chairs. **Height-adjust** (gas-lift): seat cylinder Y could animate on a
lever-press interaction, likely out of scope for a static placeable. No
powered/lit states.

**Variations**: height class (counter 610–660 mm seat / bar 735–815 mm /
tall-spectator 840–915 mm — should be a stool "kind" or height field since it
determines the paired surface height); base style (4-leg splayed, pedestal-
disc, 5-star swivel-caster, X-cross metal frame, wire-frame Bertoia-style);
back style (backless, low-back, full-back with arms); seat shape (round
disc, saddle-shaped dished wood, square cushioned); material pairing
(all-wood, all-metal, upholstered-seat/metal-base, molded-plastic/wood-leg);
footrest (ring — front-only or full wraparound — or none).

**Animation opportunities**: idle — subtle swivel-seat wiggle for gas-lift
bases even when unoccupied; static-base stools stay rigid. Occupied —
standard seated-activity pose (hip/knee bend + table/counter IK arm target
reused from eat/work seats); feet resolve to floor contact (lower counter
stools) or a raised footrest-ring contact point (bar/tall stools) — a
per-stool "foot target height" analogous to seat height. Mount/dismount: a
stool rotating ~15–30° toward the approach vector on capture, back to
resting orientation on release — cheap since it only touches the seat-top
node. Stack/store: a "stacked" prop variant for storage state — flag as a
future toggle, out of scope for v1.

Sources: [WebstaurantStore](https://www.webstaurantstore.com/article/1045/bar-stool-dimensions.html) ·
[Barstool Comforts](https://barstoolcomforts.com/heights/) ·
[PopMaison](https://www.popmaison.com/blogs/guide/bar-stool-dimensions) ·
[Wayfair](https://www.wayfair.com/sca/ideas-and-advice/guides/bar-stool-dimensions-how-to-choose-the-right-ones-T494) ·
[Frontgate](https://www.frontgate.com/homeplusstyle/entertaining/the-bar-stool-measuring-guide/) ·
[Lowe's](https://www.lowes.com/n/buying-guide/counter-height-vs-bar-height-stools) ·
[Dimensions.com](https://www.dimensions.com/element/stool-heights) ·
[KitchenAid](https://www.kitchenaid.com/pinch-of-help/major-appliances/counter-height-vs-bar-height.html) ·
[Homeyfad](https://homeyfad.com/blogs/furniture/bar-stool-vs.-counter-stool-height)

---

## 6. Bed

**Dimensions** (mattress W × D; frame adds ~50–100 mm all around; height =
floor to top of mattress):

| Size | Mattress W × D (mm) | Frame footprint W × D (mm)* | Mattress thickness | Deck height (floor→mattress top) |
|---|---|---|---|---|
| Twin | 965 × 1905 | ~1050 × 2000 | 200–350 mm | 400–500 mm (platform) / 550–600 mm (with box spring) |
| Full/Double | 1372 × 1905 | ~1470 × 2000 | 200–350 mm | same range |
| Queen (most common) | 1524 × 2032 | ~1620 × 2130 | 250–350 mm | same range |
| King | 1930 × 2032 | ~2030 × 2130 | 250–350 mm | same range |
| Cal King | 1829 × 2134 | ~1930 × 2230 | 250–350 mm | same range |

*Frame overhang typically +50–100 mm beyond mattress each side for rails/skirt.

Headboard height above mattress top: twin/kids ≈ 350 mm; full/queen ≈
700 mm; king/cal-king ≈ 1450 mm (tall statement style). Overall headboard
height off floor ≈ 1000–1450 mm depending on size/style. Headboard thickness:
50–250 mm (thin panel to padded/upholstered slab). Footboard (optional):
300–500 mm tall, same thickness range; often omitted on modern platform beds.

**Shape breakdown** (local +Z = front = foot end, where feet point when
lying down; headboard sits at −Z per this convention — flip to match the
engine's "headboard/backrest on +Z" convention used elsewhere if needed for
consistency):
- **Base/frame**: one flat `box` (the platform/rail box), W × D_frame ×
  ~150 mm thick, top surface = deck height minus mattress thickness. Add 4
  short `cylinder`/`box` legs (Ø40–60 mm, 100–150 mm tall) at corners for
  elevated/mid-century style; omit for flush platform beds.
- **Mattress**: one large `box`, slightly inset from frame edges (10–20 mm
  reveal), on top of the base box. A thin `box` (10–20 mm) in contrasting
  color on top can fake a fitted sheet/quilted band.
- **Headboard**: one flat vertical `box` (W_frame × thickness 50–150 mm ×
  headboard height), centered at the head edge, base flush with floor or
  with frame top depending on style. Upholstered look = same box with
  rounded top corners (`cylinder` cap) or a horizontal seam line (second
  thin box) for channel tufting.
- **Footboard** (optional): shorter twin of the headboard box at the foot
  end.
- **Pillows**: 2 (or 1 for twin) squashed `box`es or sphere-box hybrids near
  the headboard, slightly overlapping, tilted for a "leaned against
  headboard" look.
- **Blanket/duvet**: a `box` covering the lower ⅔ of the mattress, folded-
  back edge suggested by a stepped second thin box near the top third. For
  sims-style, a single vertex-displaceable plane (already used for the
  "breathing" covers effect) can substitute for the flat box.
- **Bed skirt** (optional, traditional): a thin vertical `box` "curtain"
  from frame top to floor, hiding the base/legs.
- **Canopy/four-poster** (variant): 4 tall thin `cylinder` posts at frame
  corners rising 1800–2100 mm, optional connecting top `box` frame rails; no
  fabric canopy needed for v1.

**Colors & finishes**: frame/headboard — natural wood (oak/walnut/pine
tones), painted white/black/grey, upholstered fabric (linen greige, navy,
blush velvet), metal (matte black or brass tubular frames — thin cylinders
for rails/finials). Mattress: white/cream quilted look (flat color is fine).
Bedding: white, pastel, patterned. Common pairings: light wood + white
linens (Scandinavian), dark walnut + navy (traditional), upholstered
grey/beige (modern), black metal + white (industrial/minimal), brass +
blush (glam).

**Placement**: **bedroom only** (primary/guest/kids). Rests on the FLOOR.
Deck height (top of mattress) ≈ 500–600 mm off floor — the seat-equivalent
surface avatars sit/lie on. Typical clearance: ≥600 mm on at least one long
side for walking; headboard usually flush or near a wall. Kids'/twin variant
sometimes has a trundle or bunk configuration (stacked second frame).

**Active / interactive state**: **occupied/sleeping** — Diorama's flagship
lying-in-bed behavior: occupant reclines flat, head at headboard end, feet
toward the foot/front; multi-lane capacity for 2 occupants side by side;
shared blanket blend replaces both rigs with a breathing displaced-cover
plane when ≥2 settled. **Made vs. unmade**: could toggle a "rumpled"
blanket-mesh variant vs. a crisp flat "made" state when unoccupied.
**Smart-bed/adjustable base** (if ever entity-bound): head/foot sections
tilt via an articulated two-segment mattress+base hinge group, mirroring the
appliance-door pivot idiom — not standard for v1. **Reading lamp glow**
(paired nightstand light) is the natural "in-use at night" cue rather than
the bed itself changing.

**Variations**: size (twin / twin XL / full / queen / king / cal king —
drives W/D and lane count); style (platform — low, no boxspring, exposed
frame; panel — tall flat headboard/footboard; sleigh — curved head/foot,
approximate with angled boxes; four-poster/canopy; upholstered/tufted;
storage bed — drawers under the base, extra box row with seam lines; bunk
bed — two stacked frames + ladder; daybed/trundle — bench-style with
pull-out lower mattress); finish (wood tone, fabric color, metal finish for
tubular frames); optional footboard toggle. `Furniture.sharedBedCovers`
toggle already exists in Diorama — keep as the multi-occupant blanket-vs-
lanes switch.

**Animation opportunities**: idle — subtle breathing displacement on the
blanket/cover plane when occupied; slight pillow compression when a rig's
head settles. Getting in/out — brief sit-on-edge pose before lying (entering
from the foot end), reverse on waking. Making the bed (stretch) — morning-
routine anchor activity, a standing rig doing a short "smoothing" arm-sweep
one-shot, blanket mesh snapping from rumpled to made. Reading/phone glow —
paired with the seated-in-bed thought-bubble pool (📱💤💭⭐🛌🧸🌜); a faint
blue glow decal on the pillow area when the "phone" bubble is active would
sell it further. Seasonal linens swap — heavier/darker duvet in winter
presets, lighter/white in summer — material swap only, no geometry change.

---

## 7. Dresser and chest of drawers

**Dimensions** (W × D × H, mm — front face = wide dimension):

| Variant | W | D | H | Drawers |
|---|---|---|---|---|
| Narrow/compact chest | 700–950 | 400–450 | 900–1100 | 3–4 |
| Standard dresser (low/"double") | 1000–1500 | 450–500 | 750–900 | 6 |
| Wide/long dresser (9-drawer "triple") | 1500–1800 | 480–530 | 800–900 | 9 |
| Tallboy / chest of drawers (narrow+tall) | 700–900 | 450–480 | 1100–1400 | 5–7 |
| Media/console-style dresser | 1200–1600 | 400–450 | 700–800 | 4–6 + open shelf |

Reference product: IKEA MALM 6-drawer wide = 1600 × 480 × 780 mm; MALM
6-drawer tall chest = 800 × 480 × 1230 mm.
([IKEA MALM](https://www.ikea.com/us/en/p/malm-6-drawer-dresser-white-30360468/))

Drawer front height typically 130–220 mm, stacked with 5–15 mm reveal gaps;
bottom drawer often taller (180–260 mm). Standing on 4 short legs/feet,
80–120 mm tall (some flush-base "waterfall" styles have none).

**Shape breakdown**:
- **Carcass**: one box (the case) — outer W×D×H minus leg height.
- **Drawer fronts**: a grid of thin boxes (10–20 mm proud of the carcass
  face) tiling the front (+Z) face — N rows, matching row heights; small
  gap (5–15 mm reveal) between each.
- **Drawer pulls**: small cylinders (knobs, ⌀20–35 mm, protrude 20–30 mm)
  centered or offset per front, OR a horizontal bar (thin box/cylinder) for
  bar-pull styles, OR omit entirely for flush/finger-groove modern fronts
  (a shallow horizontal notch/cut-line at low poly).
- **Legs/feet**: 4 short cylinders or tapered cones at the base corners
  (skip for base-flush styles — box meets floor; add a 10 mm plinth inset
  instead).
- **Top**: usually flush with carcass box; optionally a slightly
  overhanging thin box (10–20 mm larger footprint, 20–30 mm thick) for a
  "cap" look.
- **Mirror attachment** (dresser-with-mirror combo): separate thin box/frame
  on two thin cylinder or box risers at the back edge, ~700–1100 mm tall —
  optional add-on, not default.
- Front face (+Z) = the drawer-front side; back is plain.

**Colors & finishes**: white/off-white (painted MDF), natural or stained
wood tones (oak, walnut, cherry, espresso, driftwood grey), black/charcoal
matte, two-tone (dark case + light wood top or vice versa), high-gloss
lacquer (white/black), boho/rattan-front variants. Hardware finish: brushed
nickel, matte black, brass/gold, or bare wood (finish-matched, no separate
pull).

**Placement**: FLOOR-resting, freestanding, against a wall (back typically
flush to a wall, not centered in a room). Rooms: bedroom (primary use,
opposite or beside the bed), nursery (often paired with a changing-table
top), occasionally hallway/entry or laundry room. Not wall-mounted or
built-in in the general case. Legs/base sit at floor level (y=0); top
surface height 750–1400 mm depending on variant.

**Active / interactive state**: no powered/electrical state normally — a
static storage piece; interactive "state" is purely open/closed drawers.
Click/interact affordance: animate one or more drawer-front boxes sliding
out along local +Z (world +Y) by 60–70% of case depth, e.g. 300–350 mm slide
for a 480 mm-deep case — a nice idle/demo "someone getting dressed"
animation tied to a nearby avatar's dwell/activity trigger (mirrors the
appliance-door easing idiom: pivot→slide blend, τ≈0.25 s, one drawer at a
time). Optional accent: a folded-clothes sliver of color peeking from a
half-open drawer. Could carry a bound `entity_id` only in unusual smart-
furniture setups (rare) — more realistically an **unbound, locally-
triggered** prop like TVs/appliances (`localState`/`doorOpen`-style field)
rather than an HA-entity-bound fixture.

**Variations**: size tiers (compact/apartment 3–4 drawer, standard 6-drawer
double, wide 9-drawer triple, tallboy/chest 5–7 drawer vertical); pull style
(knob, bar pull, flush/finger-groove, no hardware); leg style (short turned
legs, tapered mid-century legs, flush plinth base, hairpin metal legs); top
style (flush top, overhanging cap top, optional attached mirror);
finish/material preset (painted solid color, wood-grain texture, two-tone,
gloss vs. matte); drawer-count/layout preset (uniform rows vs. mixed — 2
small top drawers + wider lower drawers).

**Animation opportunities**: idle — none needed; optionally a very subtle
ambient light-catch shimmer on a gloss finish (low priority). Active —
drawer slide-open/close on interaction or avatar activity trigger (getting
dressed), staggered so only one drawer opens at a time; a subtle
wood-knock/soft-thud settle at the end of the slide (bounce-back ease, no
audio per project convention); mirror (if present) reflecting a cheap fake
environment tint is likely out of scope for the toon-shader pipeline.

---

## 8. Nightstand

**Dimensions** (W × D × H, mm):

| Variant | Width | Depth | Height |
|---|---|---|---|
| Compact / apartment | 350–450 | 300–400 | 500–560 |
| Standard (1–2 drawer) | 450–560 | 400–500 | 550–650 |
| Tall / oversized | 560–700 | 400–500 | 650–760 |
| Floating / wall-mounted shelf style | 400–600 | 250–380 | 100–200 (box only) |

Height convention: top surface should sit roughly level with, or slightly
above, the mattress top (≈550–700 mm off floor for a standard bed). Depth is
intentionally shallow versus a dresser.

**Shape breakdown**:
- **Carcass**: one box, W×D×H as above (a single solid box reads fine at
  this scale).
- **Legs** (if not flush-to-floor plinth): 4 short cylinders or boxes
  ~30–40 mm dia/side, 100–150 mm tall, inset from corners; OR a flush
  plinth box recessed ~30 mm from the front/side faces (kickboard look).
- **Drawer front(s)**: thin box (10–20 mm proud of the carcass face)
  covering the front, local **+Z** = front face. 1–2 stacked drawer fronts
  typical, each with a small cylinder or box knob/pull, protruding
  ~15–25 mm off +Z.
- **Open shelf variant**: omit the drawer box; a slightly recessed lower box
  suggests a shelf ledge.
- **Tabletop overhang**: optional thin box (10–15 mm) slightly wider/deeper
  than the carcass, sitting on top — reads as a finished surface distinct
  from the body.
- **Floating/wall-mount variant**: no legs; whole box mounts flush to a
  wall plane at a fixed height, optional single drawer front; back face
  flush against the wall.
- Moving parts: drawer front(s) translate along +Z (open/close) — the only
  articulated part.

**Colors & finishes**: wood tones — oak, walnut, espresso/dark brown,
whitewash/natural pine (most common). Painted: white, black, soft grey,
navy, sage green. Modern/glam: high-gloss lacquer (white or black),
mirrored/glass front panels, brass or matte-black metal legs and pulls.
Industrial: metal-frame + wood-top combos, black powder-coat metal legs.
Knob/pull finishes: brushed nickel, brass, matte black, or finish-matched
wood (handleless/push-latch look).

**Placement**: bedroom, flanking one or both sides of the bed (a matched
pair is common for queen/king setups); occasionally guest rooms or a small
side table elsewhere. Rest surface: **FLOOR** (standard/tall variants) or
**WALL** (floating/mounted variant, hung so the top aligns near mattress-top
height, commonly ~550–650 mm off the floor, independent of a supporting leg
structure). Typically pushed flush against the wall behind the bed, front
face into the room, adjacent to the headboard.

**Active / interactive state**: not powered by default, but commonly hosts
bound accessories: a lamp on top (separate light fixture object), a phone
charger, a smart alarm clock/display. Visible "in use" cues: a drawer
slightly ajar or fully open (translate along +Z), a small glow/emissive if a
lamp on top is switched on (handled by the separate light object — the
nightstand top should have a flat clear spot to receive it), items appearing
on top (book, glass, phone) as clutter/occupancy indicators tied to
time-of-day or presence.

**Variations**: drawer count (0 open shelf, 1, or 2 stacked); leg style
(straight tapered wood, hairpin metal, plinth/kickboard base, or none for
floating); door style (drawer-front vs. hinged cabinet door vs. fully open
cubby); size tiers (compact/standard/tall); top material accent (glass or
marble-look inset distinct from body color); style presets (farmhouse —
painted + wood top; mid-century — tapered legs, walnut, brass pulls; modern
glam — mirror/lacquer; industrial — metal + wood; minimalist floating).

**Animation opportunities**: idle — none required; optionally a subtle
lamp-glow flicker if a light entity is bound and on. Active — drawer front
sliding open/closed along +Z (triggered by nearby avatar activity such as a
"get dressed"/"wake up" anchor, or randomly during idle-fidget passes); a
bound lamp toggling brightness/emissive when its light entity changes state;
small prop pop-in (book/phone/glass) when an avatar "goes to sleep"/"wakes
up" near the bed, then pop-out on wake — reusing the existing anchor/dwell
activity idiom.

---

## 9. Wardrobe / armoire and built-in closet

**Dimensions** (W × D × H, mm):

| Variant | Width | Depth | Height |
|---|---|---|---|
| Compact single-door armoire | 600–800 | 500–600 | 1800–2000 |
| Standard 2-door wardrobe | 900–1200 | 580–600 | 2000–2100 |
| Large 3–4 door wardrobe | 1500–2000 | 580–600 | 2000–2360 |
| Modular system (e.g. IKEA PAX) | 500 / 750 / 1000 per unit, ganged wider | 350 (shallow) or 580 (standard) | 2010 or 2360 |
| Built-in reach-in closet (wall niche) | 1200–2400 (opening) | 600–650 clear interior | 2400–2700 (ceiling height) |
| Built-in walk-in closet | 1500×1500 min room, often 2400×2400+ | rods/shelves 300–650 deep per wall run | 2400–2700 |

Sources: IKEA PAX frame specs; ClosetWorld / Closet America standard closet
guides.

**Shape breakdown**:
- **Freestanding wardrobe/armoire**: one box carcass — front face carries
  1–4 door panels as thin flat boxes (18–25 mm thick), hinged or sliding,
  front = local **+Z**. Add a plinth/base box (~80–100 mm tall, slightly
  inset) and a cornice/top cap box (~40–60 mm) for a period/traditional
  look; modern flat-pack styles skip both. Interior (relevant only if doors
  animate open) = simple flat shelf boxes + a thin cylinder rod near the
  top for hanging.
- Doors: hinged = pivot group rotating about a vertical edge (mirror the
  fridge/appliance door pivot pattern); sliding = two overlapping
  door-panel boxes on parallel tracks, offset in depth ~20–30 mm,
  translating along local X.
- Legs/feet: small cylinder or box "bun feet" (traditional) or the base box
  flush to floor (modern) — optional, 40–80 mm tall.
- Handles/knobs: tiny cylinder or box protrusions on the door's outer edge
  — cosmetic, low priority.
- **Built-in closet**: NOT a separate 3D object in most cases — a
  wall-recessed volume. Model as an opening in the wall (like a door/window
  cut) + a shallow shelf/rod assembly inside (thin box shelves + rod
  cylinder) + one set of door panels (hinged bifold pair, sliding pair, or a
  single swing door) at the opening plane. A walk-in closet is simply a room
  (defined by walls) furnished internally with wardrobe-style shelf/rod
  inserts along one or more walls — no special "closet" primitive needed
  beyond room + door + shelving furniture pieces.

**Colors & finishes**: woods — oak, walnut, cherry, mahogany (stained/
natural), painted white/cream/grey/black shaker styles. Modern flat-pack:
white, light oak, grey, black melamine/laminate, matte or gloss lacquer
fronts. Mirror-front doors are extremely common on bedroom wardrobes (a flat
reflective panel material sells this well). Hardware: brushed nickel, matte
black, brass/gold knobs and pulls. Built-in closets: typically match the
room's trim/door color (white paint, or the same door style as other
interior doors); interior shelving usually white melamine or
unfinished/painted wood.

**Placement**: rests on the FLOOR, flush against a wall (freestanding
wardrobe/armoire) — typically backed to a wall, front into the room.
Built-in closets are recesses within a wall — effectively a small
room/alcove, door(s) flush with the wall plane. Always bedroom-context
primarily; occasionally entryway (coat armoire) or laundry/mud room (built-in
linen closet). No counter-mount, wall-mount (as furniture), or ceiling-hang
variants — floor-standing or built-in-envelope only.

**Active / interactive state**: door open/closed is the primary interactive
state — bind to a `binary_sensor`/`cover` or local toggle like other
doored furniture (fridge/appliance door pattern) so a door can swing or
slide open. Avatar interaction: a person could approach and "browse"
(mirrors the existing `browse_bookshelf` anchor activity) — brief idle
animation of reaching toward the door; useful as a new activity anchor
(`browse_wardrobe`/`get_dressed`). No powered/lit state normally, though a
closet **light** (small ceiling puck inside a walk-in/built-in closet, or an
LED strip under a wardrobe's top shelf) is a common real-world feature and a
natural bindable light fixture — glows when the door state is open in some
smart-home setups (motion-activated closet light). Seasonal: no strong
signal, though visible clothes on the rod could optionally reflect
season/decor — likely out of scope for primitive-based models.

**Variations**: door count/style (1–4 hinged doors, sliding 2–3 panel,
bifold, mirror-front, glass-front/display armoire); size tiers (compact
bedroom niche, standard double-door, oversized/walk-in-adjacent wall units,
modular ganged systems); traditional (cornice + plinth + bun feet, wood-grain)
vs. modern flat-pack (no ornamentation, matte laminate); interior
configuration (rod-only, shelves-only, mixed rod+shelf+drawers, cosmetic
unless doors open); built-in vs. freestanding toggle (same footprint
concept, different wall relationship).

**Animation opportunities**: door swing/slide on open/close toggle — the
main animatable element (hinge pivot or track-slide, matching the existing
appliance-door easing pattern, τ≈0.25 s blend). Idle — none needed; optional
subtle mirror-door reflection sheen for a mirror-front variant. Active —
closet-light glow fade-in when door opens (paired light fixture); avatar
"browse"/"get dressed" anchor animation — brief reach-and-pause near the
open door, reusing the solo-activity dwell/ease system (same tier as
`forage_fridge`/`load_dishwasher`). Hardware micro-detail — a subtle toon
highlight band on the knob/handle on open (cosmetic, low priority, likely
skip).

---

## 10. Desk and office chair

**Dimensions — Desk** (single-pedestal/writing desk):

| Variant | Width | Depth | Height |
|---|---|---|---|
| Compact/laptop desk | 910–1220 mm | 500–610 mm | 710–760 mm |
| Standard office desk | 1220–1520 mm | 610–760 mm | 740 mm (fixed) |
| Large/executive or multi-monitor | 1520–1830 mm | 760 mm | 740 mm |
| Standing/sit-stand desk | 1200–1600 mm | 600–750 mm | 620–1280 mm (motorized range) |

Worksurface thickness typically 25–40 mm. Modesty panel (if present) starts
~50 mm below the top and runs to ~150 mm above floor. Pedestal/drawer unit
(if attached): ~400×550×650 mm, usually right or left side, front face flush
with desk front.

**Dimensions — Office/task chair**:

| Metric | Range |
|---|---|
| Overall width (incl. arms) | 630–700 mm |
| Overall depth | 650–700 mm (up to 700 mm reclined) |
| Overall height | 950–1300 mm (varies with backrest height + adjustment) |
| Seat width | 480–530 mm |
| Seat depth | 400–530 mm |
| Seat height (floor to seat pan) | 400–530 mm adjustable, ~460 mm typical seated-center |
| Backrest height above seat | 500–700 mm (mid-back) or 700–850 mm (high-back/headrest) |
| Armrest height above seat | 180–290 mm, often adjustable |
| Base/caster spread (5-star) | 620–700 mm diameter |

Source-verified example: Herman Miller Aeron (Size B) — overall
~690×690×1050 mm, seat height adjustable 410–520 mm, arms 170–270 mm above
seat. Gaming/racer-style chairs run taller backs (~800–850 mm) with wider
bucket seats.

**Shape breakdown — Desk**:
- **Top**: one flat box (W × D × 30 mm), front edge = local +Z.
- **Legs**: either (a) 4 slim boxes/cylinders (40–60 mm square/round) at the
  corners inset ~30 mm, running floor→underside of top; (b) 2 solid
  side-panel boxes (legs desk) at the ends; or (c) a center metal H-frame (2
  vertical tube cylinders + 1 horizontal box stretcher) for modern/standing
  desks.
- **Modesty panel** (optional): thin box spanning the back half height, set
  back from the front face.
- **Drawer pedestal** (optional): a box unit under one side with 1–3 thin
  box "drawer front" overlays (front flush, +Z); handle as a thin cylinder
  or box.
- **Standing-desk column**: 2 telescoping rectangular cylinders/boxes per
  leg to hint at the lift mechanism, plus a control pad (small box) under
  the front edge.
- **Cable tray** (optional): shallow box/half-cylinder slung under the back
  edge.

**Shape breakdown — Office chair**:
- **Seat pan**: rounded box or a flattened cylinder (D-shape via a box with
  chamfered front corners), ~50 mm thick padding on a thin base plate.
- **Backrest**: curved thin box or bent cylinder-segment, tilted back
  ~5–15° from vertical, mounted on a lumbar-height pivot bracket (small
  box/cylinder) — front face of the seat/back assembly faces local **+Z**
  (away from the desk).
- **Armrests** (if present): 2 thin vertical cylinders/boxes from the seat
  sides to a short horizontal pad box, along +Z.
- **Gas-lift column**: 1 vertical cylinder (chrome/black) from seat bottom
  to the base hub.
- **Base**: 5-point star — flattened cylinder or 5 thin radiating box legs
  — each ending in a small sphere/cylinder caster wheel (spin/swivel visual
  only).
- **Headrest** (high-back variant): small pad box hinged/fixed atop the
  backrest.

**Colors & finishes**: desk — laminate tops in white, light oak/maple,
walnut, black, or gray; legs in matte black/white powder-coated steel, or
matching/contrasting wood; glass or MDF less common for casual use. Chair —
mesh backs in black, gray, or graphite (subtle grid/hatch texture);
upholstered seats in black/gray/navy fabric or leather/pleather; frame and
base typically black or polished aluminum/chrome; gaming chairs add bold
color-blocking (red/black, blue/black) with faux-leather sheen and
stitch-line details.

**Placement**: FLOOR-resting for both. Desk against a wall or floating in a
home-office/study/bedroom corner; chair tucked under the desk front edge,
pulled out ~300–400 mm when "in use." Desk height 710–760 mm is the
functional surface height; chair seat ~450 mm nests under it with
~250–300 mm knee clearance. Standing desks range the surface 620–1280 mm —
model the top's Y offset as a variable if animating sit/stand.

**Active / interactive state**: **chair occupied** — seat cushion
compresses slightly (optional squash), chair scoots in/out and swivels; a
person sits with hips at seat height, forearms at armrest/desk height (ties
into the `eat_at_table`-style seated IK — here `work_at_desk`). **Monitor/
lamp on desk** (separate props): screen glow / lit desk lamp indicate
"desk in use." **Standing desk**: animate the Y-height of the top +
telescoping column boxes rising/lowering on toggle (bound to a `cover` or
`number` entity if ever wired), taking ~10–15 s in reality (can compress for
feedback). **Idle chair**: slow gentle swivel oscillation (±5–10°) or none;
casters show subtle roll wobble if bumped by a passing avatar.

**Variations**: desk — writing desk, L-shaped/corner desk, executive desk
with hutch, standing/sit-stand desk, secretary desk with fold-down front,
simple table-as-desk. Chair — mesh-back ergonomic task chair, high-back
executive chair, gaming chair, drafting stool (tall, footring, no arms),
simple armless task chair, kneeling chair. Offer size presets
(compact/standard/executive) and finish presets (white/oak/walnut/black) as
recipe parameters.

**Animation opportunities**: idle — subtle chair swivel drift, caster-wheel
micro-roll, gas-lift micro-bounce when someone sits down (quick
compress-release). Active — seated avatar's arms resting on desk (existing
table-arm IK), chair rotating to face the avatar's task direction,
standing-desk height transition, monitor/lamp glow toggling with a bound
entity, drawer-front sliding open a few mm if a "drawer open" state is ever
modeled, paper/keyboard prop idle shuffle (out of scope for the chair/desk
primitives themselves, worth flagging for companion desk-accessory recipes).

Sources: [Autonomous](https://www.autonomous.ai/ourblog/standard-desk-dimensions-guide) ·
[Boulies](https://boulies.com/blogs/tips-and-guides/standard-desk-dimensions-guide-for-home-and-office) ·
[EffyDesk](https://effydesk.com/blogs/news/standard-desk-size-dimensions) ·
[Dimensions.com — Aeron B](https://www.dimensions.com/element/aeron-chair-b-size) ·
[Herman Miller Aeron specs](https://www.hermanmiller.com/products/seating/office-chairs/aeron-chair/specs/) ·
[Eureka Ergonomic](https://eurekaergonomic.com/blogs/eureka-ergonomic-blog/gaming-chair-size-calculator-perfect-fit) ·
[Razer Enki X](https://www.razer.com/gaming-chairs/razer-enki-x)

---

## 11. Bookshelf / bookcase

**Dimensions** (W × D × H, mm):

| Variant | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Narrow/compact (single-cube) | 400–600 | 280–300 | 1060–1400 | e.g. IKEA Billy narrow, small studio units |
| Standard freestanding | 700–900 | 280–320 | 1800–2020 | most common; IKEA Billy standard = 800×280×2020 |
| Wide/low console-style | 1000–1200 | 300–350 | 700–1000 | media-adjacent, credenza-height |
| Oversized/library ladder unit | 900–1200 | 300–400 | 2200–2400 | needs wall anchoring, near ceiling height |
| Built-in wall unit | 600–3600 (run) | 250–400 (300 typical, shallower 200–250 in niches) | floor-to-ceiling, 2100–2900 | fixed to a wall run, often flanking a fireplace/window |

Shelf spacing (opening height between shelves): 250–300 mm typical; carcass
sides/top/bottom material 18–25 mm thick.

**Shape breakdown**:
- Outer carcass: one thin-walled box (or 5 boxes: left side, right side,
  top, bottom, back panel) — back panel is often a thin (3–6 mm) inset box
  recessed 10–15 mm from the rear face.
- Shelves: 3–6 thin boxes (18–22 mm thick) spanning the interior width,
  spaced evenly or with wider gaps at the bottom for larger books.
- Optional plinth/base: a short box (50–100 mm tall) inset 20–30 mm from
  the front face, or simple splayed feet (4 small cylinders/boxes) for
  mid-century styles.
- Optional crown/cornice cap: a shallow box slightly overhanging the top
  front/sides on traditional styles.
- Front face (local +Z, functional front): open-front is the default (no
  primitive — just the shelf cavity showing); a **doored** variant adds
  1–2 thin door-panel boxes (hinged, openable like the existing furniture
  door idiom) or glass-front boxes (transparent material) covering the
  lower cabinet section only, with upper shelves open.
- Built-in wall unit: same primitive set but width scales to fill a wall
  run (or several bookshelf modules placed edge-to-edge), often flanking a
  **fireplace** with a matching TV/mantel bump-out box in the center.
- Decorative fill (static, optional): a scatter of thin vertical box
  "books" in varied heights/colors along shelves, plus occasional small
  boxes (bins) or a sphere/cylinder (vase, globe) accent prop — cheap
  non-interactive geometry that reads as "lived-in."

**Colors & finishes**: woods — birch/oak/walnut/espresso stains,
whitewash, natural pine. Painted — white and black most common (IKEA Billy
default), also navy, sage green, greige for accent pieces. Materials —
painted MDF/particleboard (budget), solid wood or veneer (mid/high),
powder-coated metal-frame + wood-shelf hybrids (industrial), matte black
metal + glass (modern/urban). Hardware — doors/glass-front variants add
thin metal or wood pulls/knobs; traditional crown-molded units get a
slightly darker or gilded trim accent.

**Placement**: living room, home office/study, bedroom, hallway, kids'
room, library/den. Rests on the **FLOOR** (freestanding, most common) or is
**built-in** against a wall (floor-to-ceiling or wall-run, structurally
treated as a fixed wall feature rather than a movable piece). No ceiling-
mount or countertop variant. Anchoring: tall units (>1200 mm) are typically
wall-strapped for tip-over safety — could be modeled as an always-present
thin anti-tip strap/bracket detail at the top-back, non-interactive.

**Active / interactive state**: no power state, but Diorama already has an
anchor activity (`browse_bookshelf`) — an avatar can approach, face the
shelf, and idle-browse. Interactive door variant: doored/glass-front
sections can open/close like other Diorama doors (swing out on local −Z
hinge), toggled by proximity/interaction the same as fridge/appliance
doors. No lighting by default, but a "lit display shelf" variant (built-in
units especially) could carry a thin LED strip prop under a shelf edge with
a warm emissive glow — purely cosmetic (always-on or tied to a bound light
entity).

**Variations**: size presets (compact single-cube, standard, wide/low,
oversized/library, built-in wall-run scaling freely); door style (open,
solid doors lower section only, full glass doors, no doors); base style
(flush plinth, exposed square legs, splayed mid-century legs); cap style
(flat top, overhanging crown/cornice); finish palette (wood-tone vs.
painted white/black/color-accent vs. black-metal-and-glass); fill density
(empty/new, lightly styled, fully stocked — a simple decoration-density
slider); built-in fireplace-flanking pair (two matching modules generated
symmetrically either side of a fireplace/TV niche).

**Animation opportunities**: idle — none needed for the carcass; decorative
book-color fill can be randomized per-instance (deterministic hash, not
per-frame) for variety without animation. Active — door swing-open/close on
interaction (shared door-pivot easing idiom, ~70–90° like other cabinetry).
Avatar interaction — a browsing pose anchored at the shelf front (existing
`browse_bookshelf` activity), avatar facing +Z, one arm reaching toward a
shelf, occasional page-flip/head-tilt idle variation. Optional lit-shelf
variant — static warm emissive glow (no per-frame animation needed) or, if
tied to a bound light entity, on/off glow like existing light fixtures.

---

## 12. Kitchen sink and faucet

Single/double basin, farmhouse, undermount.

**Dimensions — sink**:

| Type | Width | Front-to-back depth | Basin depth | Notes |
|---|---|---|---|---|
| Compact single-bowl | 530–610 mm | 530–560 mm | 200–230 mm | Small kitchens, secondary sinks |
| Standard single-bowl (undermount) | 760–840 mm | 530–560 mm | 230–255 mm | Most common; needs 33–36" base cabinet |
| Oversized single-bowl / farmhouse | 840–915 mm | 530–560 mm | 230–255 mm | Apron front adds an exposed face panel |
| Double-bowl undermount | 760–1220 mm total, bowls 460–635 mm each | 530–560 mm | 200–255 mm | Equal or 60/40 offset bowl split common |
| Farmhouse/apron front | "named" sizes 610/760/840/915 mm wide | 530–560 mm | 230–255 mm | Apron overhangs cabinet face ~230–255 mm, flush with counter edge |

**Dimensions — faucet** (deck-mounted, standard single-handle):
- Overall height: 300–500 mm; high-arc "gooseneck" styles up to 500+ mm.
- Spout reach (mount hole to spout tip): 200–300 mm (scale to sink width —
  ~230 mm reach for a 400 mm sink, up to 300 mm for a 760 mm sink).
- Spout height above deck: 150–300 mm; taller for deep basins.
- Deck hole: ~35 mm diameter; typical multi-hole spacing 100 mm
  (single-hole most common on modern undermount farmhouse installs).
- Vertical clearance spout-tip-to-basin-bottom: keep ≤250 mm to limit splash
  in the resting pose.
- Handle: single lever most common (also two-handle + separate
  side-spray/soap-dispenser holes on multi-hole decks).

**Shape breakdown**:
- *Basin(s)*: a box with a shallow inset box as the visible basin cavity —
  one outer box for the counter cutout/apron shell and one smaller inset
  box (recessed, offset down and back) for the cavity color, or fake depth
  with a darker-toned flat inset box "floor" plus 4 thin wall boxes.
  Corners can be softened conceptually but boxy reads fine at this
  stylization level.
- *Farmhouse apron panel*: a flat box (the "front face") sitting proud of
  the cabinet face, flush with the counter's front edge, height ≈ basin
  depth + rim (300–350 mm tall panel).
- *Undermount rim*: sits BELOW the counter surface plane — the basin box's
  top edge simply meets the underside of the counter box with no
  protruding lip.
- *Faucet body*: cylinder base (deck flange, short squat cylinder ~40 mm
  tall × 50 mm dia) → cylinder or tapered-cylinder riser (the "neck",
  straight or curved; a curved gooseneck can be approximated with 2–3
  angled cylinder segments) → cylinder spout tip angled down, sometimes
  with a small cone/cylinder aerator cap at the outlet.
- *Handle*: a small box or elongated cylinder (lever) on a small cylinder
  base, offset to the side or behind the spout base.
- *Optional side accessories*: soap dispenser (thin cylinder + sphere-ish
  cap); side sprayer (small cylinder in its own deck hole) — small child
  primitives near the faucet base.
- Front face: apron/basin opening faces local **+Z** (toward the
  room/user); faucet spout curves toward +Z, handle typically off to one
  side (+X/−X) or behind spout (−Z bias) depending on style.

**Colors & finishes**: basin material — stainless steel (brushed
silver-gray, most common, satin/matte finish reads best in toon shading),
fireclay/cast-iron farmhouse (glossy white or bone/almond, the classic
farmhouse look), granite composite (matte black, gray, or beige speckle),
copper (warm orange-brown patina). Faucet finish — chrome (bright silver,
high specular), brushed nickel (soft matte silver, currently most popular),
matte black, oil-rubbed bronze (dark brown-black), brushed/polished
brass or gold (warm yellow-gold, trending). Toon-shader guidance: keep
basin/faucet materials distinct in value from countertop and cabinets so
the fixture reads clearly.

**Placement**: kitchen only (occasionally a wet bar/butler's pantry as a
secondary instance). **COUNTER/built-in**: sink basin undermounts from
below a counter surface — top of basin rim flush with, or ~0 mm below, the
countertop plane; standard countertop height 900–915 mm above floor. Faucet
deck-mounts on the counter (or on the back ledge of the sink for some
farmhouse models) at the same 900–915 mm height, directly behind/at the
rear of the basin. Farmhouse/apron sinks additionally require the front of
the cabinet run to be recessed/absent where the apron sits. Requires a sink
base cabinet beneath (typically 800–915 mm wide) — model as a paired
"counter run + sink" custom object so cabinet doors don't clip through the
basin.

**Active / interactive state**: water running — animate a thin translucent
blue-white cylinder or particle stream from spout tip to basin, plus a
small splash/ripple decal in the basin bottom; toggle tied to a bound
faucet/valve entity if one exists, or a generic "in use" flag. Handle
rotation/lift — single-lever faucets lift/rotate a few degrees to indicate
on vs. off (cheap idle vs. active pose swap, same idiom as appliance
doors). Basin occupancy — dishes/suds could be a swappable decal or small
prop set (optional custom-object layer), not core geometry. Steam wisp
(soft translucent quad billboard) for a "hot water running" flourish,
similar to other Sims-style ambient effects.

**Variations**: bowl count/config (single, double-equal, double-offset
60/40, triple/prep-bowl accessory); mount style (undermount — seamless
counter edge; drop-in/top-mount — visible rim lip, would need a raised rim
box; farmhouse/apron-front — exposed front panel); material/finish pairs as
above; faucet style (standard gooseneck, pull-down/pull-out sprayer head —
bulbous spray-head cylinder+box at spout tip, bridge faucet — two-legged
base with a horizontal bridge cylinder, commercial pre-rinse — spring-coil
hose + separate spray head, touchless/sensor — small sensor eye detail);
optional deck accessories (soap dispenser, side spray, air-gap cap,
instant-hot dispenser — each a small bolt-on primitive cluster in its own
deck hole).

**Animation opportunities**: idle — none needed beyond static geometry;
optionally a very subtle occasional single drip animation (small sphere
detaching from spout tip, falling, tiny splash) for "leaky faucet"
ambiance/flavor. Active — water-stream toggle (cylinder/particle stream +
basin ripple + optional steam wisp) keyed to on/off state; handle lever
rotates/lifts on activation; pull-down sprayer head could animate extending
on a curved path when "in use." Contextual — a `wash_hands`/
`make_coffee`-style anchor (a standing dwell activity at the sink, matching
`forage_fridge`/`load_dishwasher` patterns already in the codebase) with the
water-running visual as the tell.

Sources: [Homewares Insider](https://homewaresinsider.com/kitchen-sink-dimensions/) ·
[KOHLER farmhouse sinks](https://www.kohler.com/en/products/kitchen-sinks/shop-farmhouse-kitchen-sinks) ·
[Horow](https://horow.com/blogs/guide/standard-kitchen-sink-size-guide-choose-the-right-kitchen-sink) ·
[American Standard](https://www.americanstandard-us.com/single-bowl-kitchen-sinks/suffolk-30-x-22-inch-stainless-steel-undermount-single-bowl-apron-front-farmhouse-residential-kitchen-sink-with-grid/stainless-stl-18sb9302200ar075) ·
[Payless Kitchen Cabinets](https://paylesskitchencabinets.com/farmhouse-sink-sizes/) ·
[Wayfair](https://www.wayfair.com/sca/ideas-and-advice/guides/buying-a-kitchen-faucet-heres-exactly-what-to-measure-T1722) ·
[Kohler Assist](https://assist.kohler.com/en/kitchen-faucets/Measuring-Spout-Height-and-Reach) ·
[PlumbingSupply.com](https://www.plumbingsupply.com/kitchen-faucet-buying-guide.html) ·
[Liquid Image](https://www.liquidimageco.com/what-is-the-standard-spout-reach-for-a-kitchen-faucet/)

---

## 13. Bathroom vanity and sink

**Dimensions** (W × D × H, mm — height = counter top surface unless noted):

| Variant | Width | Depth | Counter height | Notes |
|---|---|---|---|---|
| Compact/powder | 460–610 | 400–460 | 810–865 | Corner or pedestal-adjacent |
| Standard single | 610–1220 | 460–535 | 810–865 | Most common: 750×500×860 |
| Comfort-height single | 610–1220 | 535–585 | 865–915 | ADA-adjacent, less back strain |
| Double sink | 1520–1830 | 535–610 | 865–915 | Two basins ~600–700 mm apart center-to-center |
| Cabinet carcass alone | as above | as above | 700–800 to underside of top | Countertop adds 20–40 mm slab |
| Backsplash (optional) | = cabinet width | 15–20 | 100–150 rise above counter | Thin box lip at back edge |

Sink basin sits ON the counter (undermount/drop-in) or ABOVE it (vessel,
+100–150 mm extra rim height). Faucet spout height above basin floor:
150–200 mm standard, 200–300 mm for vessel sinks.

**Shape breakdown** (one composite `Furniture` piece, `cat: 'bathroom'`,
`surface: true` so a soap dispenser/cup can mount on top):
- **Cabinet body**: single box, w × d × ~750 tall (floor to underside of
  counter), origin at floor-level center. Front face (local **+Z**) has the
  door/drawer detail — one large recessed-panel rectangle (single door) or
  a vertical split into 2–3 drawer-front boxes with small cylinder/box pull
  hardware, OR an open-shelf variant (omit the front face box, add one
  recessed inner shelf box + toe-kick notch).
- **Toe-kick**: shallow box recess at front-bottom ~100 mm tall × 50 mm
  deep inset — a slightly-recessed dark box rather than a true cutout.
- **Countertop slab**: thin box, `(w+20) × (d+20) × 30`, on top of the
  cabinet, slight overhang all sides (~10–15 mm), front edge can bullnose-
  round via a half-cylinder strip (optional).
- **Backsplash** (optional toggle): thin box `w × 15 × 120` standing on the
  counter's back edge.
- **Sink basin**:
  - *Undermount/drop-in* (default): shallow cylinder or rounded box
    recessed INTO the counter — a slightly-darker inset ellipse/box flush
    with or just below counter top (squashed cylinder, radius ~230, height
    ~15, positioned −40 to −60 from counter surface to read as a bowl).
  - *Vessel*: full cylinder or hemisphere-topped cylinder (radius ~200,
    height ~150) sitting proud ON TOP of the counter — the standout
    "active" silhouette.
  - Double-sink: duplicate basin, offset ±(w/4) along local X.
- **Faucet**: thin cylinder riser (radius ~10, height ~150–250, back-center
  of each basin) + a curved spout — a short angled cylinder or a
  quarter-torus/cone segment bending from vertical to horizontal — plus a
  small sphere or box handle to one side.
- **Mirror** (often paired, sometimes a separate wall-mount item): flat box
  `w × 15 × (w×0.8)` mounted on the wall above, bottom edge ~1000–1100 mm
  off floor.
- Overall assembly rests on the **FLOOR**; countertop surface acts as a
  `surface` mount point at h ≈ 860 mm for mountable accessories (soap
  dispenser, tissue box, cup).

**Colors & finishes**: cabinet — white, gray, navy/dark blue, black,
natural wood (oak/walnut) stain, matte or satin painted MDF/shaker-style
panel fronts. Countertop — white/gray/black quartz or granite speckle,
marble-look (white with gray veining), butcher-block wood, solid-surface
white. Basin — white or bisque vitreous china (undermount, most common);
vessel sinks add glass (clear/frosted/colored), copper/hammered-metal,
stone (granite/marble), matte black or white ceramic. Hardware — brushed
nickel, matte black, chrome, brushed gold/brass (pulls and faucet should
match). Backsplash/mirror frame matches cabinet or countertop trim color.

**Placement**: bathroom (primary/ensuite/powder/guest). Cabinet body rests
on the **FLOOR**; countertop/basin/faucet sit at counter height
(~810–915 mm) as a fixed **surface** for accessories; a matching mirror
mounts on the **WALL** above (bottom ~1000–1100 mm off floor). Often placed
against a wall with plumbing (snap-to-wall like the fireplace/switch
convention — back flush, front/basin into the room). Sometimes a
floating/wall-mounted cabinet variant (no floor contact, cabinet bottom
~200 mm off floor, open space beneath) — worth a `floating: boolean` prop.

**Active / interactive state**: bind to a `switch`/`light` for the
mirror/vanity light strip (glow above mirror). Bind to a
`binary_sensor` (occupancy) or `sensor` (water flow/smart valve) to show a
running-water state: thin translucent cylinder/particle stream from spout
to basin, basin surface ripple, brief steam wisp (soft translucent
cone/plane) if hot water + cold-room heuristic. Fogged mirror
during/after shower use (translucent overlay plane fading in/out) — a nice
cross-fixture tie-in with a bound shower entity. Drawer/door "recently
used" idle nudge (see animation).

**Variations**: single vs. double basin; vessel vs. undermount vs.
integrated (basin+counter same material, no seam) vs. pedestal (skip
cabinet, just a column + basin); open-shelf vs. shaker-door vs. flat-slab
modern front; floating/wall-mount vs. floor-standing; with/without
backsplash; with/without paired mirror or medicine cabinet (mirror becomes
a hinged door, swinging like the fridge/appliance door pivot pattern);
powder-room compact corner variant (triangular/curved front).

**Animation opportunities**: idle — none required structurally, but a
subtle light-on glow pulse if a vanity light is bound; occasional "steam
wisp" if a nearby shower/tub is active (cross-fixture ambient detail).
Active — faucet running-water stream (animated translucent cylinder/
particles) + basin ripple when a bound water/occupancy entity is on;
drawer/door pop-open a few degrees when an avatar is anchored at the sink
(mirrors the appliance-door anchor-proximity rule, reuse
`_advanceApplianceDoors`-style easing); mirror light strip flicker-on;
fogged-mirror overlay fade in while a paired shower runs and fade out after,
echoing the fireplace/appliance liveliness idioms. Avatar interaction — a
natural `wash_hands`/`brush_teeth`-style solo standing activity (per the
existing `PHASE4_ACTIVITIES` pattern) — a dwelling avatar turns to face the
basin, arms perform a small hand-washing loop, capturing the same
anchor-radius/dwell-timer machinery used for the fridge/dishwasher/
coffee-maker anchors.

---

## 14. Kitchen cabinets and countertops

Base, wall, island, and pantry cabinetry.

**Dimensions** (W×D×H mm; W in 75 mm/3" increments, 225–1200 mm):

| Type | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Base cabinet | 300–1200 (450/600/900 common) | 600 (610) box, incl. toe-kick | 870–900 box | + countertop → 915 mm finished top |
| Toe-kick recess | full width | 75–100 | 100 | inset at floor, base sits back |
| Wall cabinet | 300–1200 | 300 (305) std, 380/600 over fridge | 760 (30"), 915 (36"), 1065 (42") | mounts 460 mm above counter (bottom edge 1370 mm AFF) |
| Island (cabinet run) | 900–2400 | 900–1350 (two-sided) or 600 (one-sided) | 870–900 box, 915 top | often + raised bar counter to 1065–1100 mm |
| Pantry / tall cabinet | 450–900 | 600 (deeper: 660) | 2100–2400 | full height, often to ceiling |
| Countertop slab | matches run | 600–650 (25–26 incl. 25–40 mm front overhang) | 30–40 thick (38 mm laminate/quartz typical) | sits at 915 mm |
| Backsplash | matches run | ~15–20 (tile/slab) | 100 (4") strip or full height to wall cabinets | vertical, against wall |

**Shape breakdown**:
- **Carcass**: one box per cabinet, front face = local +Z. Base cabinets:
  box floor-to-870 mm MINUS a notched toe-kick box (100 mm tall ×
  75 mm deep, inset from +Z front) — simplest as two boxes (body + a
  recessed toe strip in a darker/shadowed material, or just paint a dark
  inset band).
- **Doors/drawer fronts**: thin boxes (18–20 mm) proud of the carcass front
  (+Z offset ~10 mm), sized to grid — one tall door per 450–600 mm bay, or
  1–4 stacked drawer fronts (drawer stack often 1 shallow + 1 medium + 1
  deep, heights ~150/200/250 mm). Pulls/knobs: tiny box (bar pull) or
  cylinder (knob), on the door's latch-side edge, ~100 mm from top
  (uppers) or bottom-adjacent edge (drawers) or top edge (base doors).
- **Doors are the openable part**: pivot group at hinge-side vertical edge
  (local ±X edge), rotate about local Y up to ~110° for base/wall doors.
  Drawers: pivot-less, translate the whole drawer-front-+-box assembly
  along +Z (slide out 400–500 mm max).
- **Countertop**: single flat box (slab) on top of the base run,
  overhanging the front face by 25–40 mm (+Z) and each open end.
- **Island**: same base-cabinet box logic but often doors/drawers face TWO
  opposite sides (+Z and −Z) since it's freestanding; countertop overhangs
  further (150–300 mm) on the seating side to fit stool knee clearance.
- **Pantry**: a tall single box, either 1–2 full-height doors (hinge at
  outer vertical edge) or the same door grid scaled up; interior shelves
  are optional (not visible with doors closed) — a few thin box
  "shelf hint" planes if the door is ever modeled open.
- **Crown molding/light rail** (optional trim): thin angled box strip along
  the top-front edge of wall cabinets/bottom-front edge (for under-cabinet
  lighting).

**Colors & finishes**: cabinet boxes — white, off-white/greige, navy/dark
green, black, natural wood (oak/maple/cherry/walnut stain), two-tone (dark
lowers + light uppers is trending). Door styles (surface detail, affects
panel bevel): shaker (recessed center panel, most common), flat-slab
(minimalist), raised-panel (traditional). Countertop — white/grey/black
granite or quartz (speckled procedural texture), butcher-block wood, white
marble w/ grey veining, laminate solid color, concrete grey. Hardware —
brushed nickel, matte black, brass/gold — small emissive-free metal accent.
Backsplash — white subway tile, natural stone, or matches countertop
(full-height slab "waterfall" look).

**Placement**: kitchen only. Base + island cabinets are **FLOOR**-resting
(toe-kick sits on floor). Wall + pantry-upper sections are **WALL**-mounted
(wall cabinet bottom at 1370 mm AFF). Countertop is a **COUNTER/surface**
element itself — the mounting surface for small appliances (toaster,
coffee maker, stand mixer — Diorama's `mountable` kind). Pantry is
**FLOOR**-resting, freestanding against a wall or in a run. Island is
FLOOR-resting but freestanding (not against a wall) — often has toe-kick on
all exposed sides.

**Active / interactive state**: no native "power" state for cabinetry
itself, but bind to real fixtures riding on it: under-cabinet LED strip
lighting (light entity → warm linear glow along the wall-cabinet
underside), an in-cabinet trash/recycle pull-out, or a smart faucet at the
sink base. Door/drawer could expose a `doorOpen`/`localState` like the
fridge pattern (binary_sensor or click-toggle) for a "cabinet ajar"
animation — swings ~70–110° open. Countertop clutter/appliance state rides
on whatever small appliance is mounted on it (coffee maker brew glow, etc.)
rather than the counter itself.

**Variations**: door style (shaker / slab / raised-panel — swap the
door-front bevel/inset); finish (paint color swatch vs. wood-stain swatch,
optional procedural wood grain texture); layout (L-shape / U-shape /
galley / island-with-seating — just placement of the same modular units);
countertop edge profile (visual bevel: eased, bullnose, mitered — minor
chamfer on the slab box edges); open shelving instead of upper doors (skip
door boxes, add 2–3 thin shelf planes + optional dish props); glass-front
upper doors (swap door material to translucent + thin visible interior
shelf lines); farmhouse apron-front sink cut into a base run (recess a sink
bowl shape into the countertop + carcass front).

**Animation opportunities**: idle — none needed structurally; under-
cabinet lighting can have a subtle warm-up flicker on toggle; a static
steam/glow could rise if a stovetop/kettle sits on an adjacent counter
section (shared with appliance animation). Active — door/drawer swing-open
when an avatar's activity anchor is "forage_fridge"-style (`load_dishwasher`/
`make_coffee` already exist for adjacent appliances — a generic "get
dish"/"put away" anchor could open a random upper door or drawer front
briefly); pull-out trash bin sliding out; under-cabinet LED strip
brightness synced to a bound light entity; a pantry door swinging
open/closed when an avatar dwells at it (mirrors the fridge-door recipe
already in the codebase, reuse the `_applianceDoors` pivot pattern for a
"pantry" activity anchor).

---

## 15. Kitchen island

**Dimensions** (W × D × H, mm — W = long axis, D = front-to-back):

| Variant | W | D | Countertop H | Notes |
|---|---|---|---|---|
| Compact/cart-style | 900–1200 | 600–700 | 900–920 | Often on casters, no seating |
| Standard | 1500–2000 | 900–1050 | 900–920 (cabinet base) | Most common size for 12'×12'+ kitchens |
| Oversized | 2200–3000+ | 1050–1200 | 900–920 | Multi-zone (prep + sink + seating) |
| Bar-height overhang | as above | +300–450 overhang for knee room | counter 900–920, raised bar ledge 1050–1070 | Two-tier islands common |

Standard 42"-clearance aisles on all sides drive footprint, not island
height. Cabinet toe-kick: ~100 mm high × 75 mm deep recess at floor.

**Shape breakdown**:
- **Base cabinet carcass**: one large box, W × D × ~850 mm (floor to
  underside of countertop), on a recessed toe-kick box (inset ~75 mm from
  front/sides, ~100 mm tall, darker/shadowed).
- **Countertop slab**: thin box (30–50 mm thick) overhanging the carcass
  20–30 mm on all sides, 250–450 mm overhang on the seating side for knee
  clearance.
- **Front face** (local +Z, the side with doors/drawers): 1–3 flat
  door/drawer boxes recessed slightly (2–3 mm) into the carcass face, plus
  small cylinder or box door pulls/handles protruding ~20–30 mm — the
  openable elements (drawers translate out on +Z, doors rotate open about a
  vertical edge like a hinge pivot).
- **Optional raised bar counter** (two-tier islands): a second thinner slab
  box offset ~150 mm above and behind the main counter, supported by 2–4
  thin cylinder or box corbels/legs on the seating side.
- **Optional built-in sink**: a shallow inset box/negative cavity in the
  countertop + a small cylinder/torus faucet on the back edge.
- **Optional cooktop**: a flush dark box inset in the countertop with 2–4
  small dark cylinders (burner grates) — see "active state."
- **Optional overhead pot rack/pendant lights**: separate ceiling-hung
  fixtures, not part of the island body (handled by the Light fixture
  system).
- Legs/open-shelf variant: instead of a solid carcass box, 4 cylinder or
  box legs (~80×80 mm) at corners + a lower open shelf box (thin slab) —
  good for a "furniture-style" island.

**Colors & finishes**: cabinetry — white, navy/dark blue, sage green,
charcoal/black, natural wood stain (oak/walnut) — often a DIFFERENT color/
finish than the surrounding perimeter cabinets (classic contrast-island
look). Countertop — white/grey quartz or marble (veined texture, lighter
mottled tint), butcher-block wood, dark granite, matte concrete grey.
Hardware — brushed nickel/matte black/brass pulls (small metallic
cylinders). Toe-kick — usually matte black or matches cabinet color,
slightly darker shade for shadow read.

**Placement**: kitchen only. Rests on the **FLOOR**, freestanding, not
wall-snapped (unlike counters/cabinets which line walls). Needs clearance
on all 4 sides — model center point, no auto-snap needed. Countertop
surface height ~900–920 mm — a `surface: true` piece so mountable small
appliances (coffee maker, toaster) and bar stools can interact with it like
a counter. Bar-overhang side registers `seat` (stool height ~660–760 mm
footrest, seat 660 mm) as a `SitSpot` host if barstools are modeled as
separate furniture drawn up to the overhang edge.

**Active / interactive state**: if it hosts a bound sink faucet or
cooktop, cooktop burners can show a subtle emissive orange glow + faint
shimmer when the bound `switch`/`sensor` is on (mirrors the fireplace
flicker idiom — cheap per-frame `Math.random()` on emissive intensity).
Drawer/door fronts could open briefly on interaction click (toggle a
`localState` open/closed pose, same idiom as fridge/appliance doors) —
nice touch, not required for v1. Pendant lights over the island (if
present as separate Light fixtures) already animate via the existing
light system — islands are the most common pendant-light location. Idle: a
person avatar working at the island can anchor to a `work_at_counter`-style
standing activity (chop/stir animation), same tier as `make_coffee`/
`forage_fridge`.

**Variations**: single-level vs. two-tier (raised bar overhang) top;
with/without integrated sink or cooktop (cutout + fixture); with/without
seating overhang (determines whether it registers stool `SitSpot`s);
open-shelf/leg style vs. solid cabinet carcass; waterfall-edge countertop
(countertop wraps down the end face to the floor, extra vertical box on
one short end, same material as top) as a premium look option;
casters + cart-style compact variant (small, movable, no toe-kick — 4
visible caster cylinders at the base instead of a toe-kick box).

**Animation opportunities**: idle — none inherent (static furniture);
ambient interest comes from anchored avatar activity (chopping, stirring,
standing) and any pendant lights above it. Active — cooktop-burner
emissive flicker while a bound cooktop entity is on; faucet running (a thin
animated cylinder/particle stream) if a bound sink entity is on; cabinet
door/drawer open-pose on click (same idiom as fridge/dishwasher doors —
pivot group built closed, eased open on trigger); a "food prep"
clutter-decal swap (cutting board + ingredients props) could pop in during
a `make_coffee`/prep-type anchored activity for visual richness.

---

## 16. Ottoman and bench

**Dimensions** (W × D × H, mm):

| Variant | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Cube pouf / small ottoman | 400–500 | 400–500 | 350–430 | Often square, doubles as extra seat |
| Standard footstool ottoman | 550–700 | 450–550 | 380–450 | Classic rectangular footstool |
| Cocktail/storage ottoman (coffee-table sub) | 800–1000 | 500–750 | 380–450 | Lift-top lid, ~450–480 mm seat height incl. cushion |
| Oversized/sectional ottoman | 1200–1500 | 900–1200 | 400–450 | Multi-person, sometimes modular (2–4 join into an "island") |
| Round tufted ottoman | Ø 600–750 | — | 380–450 | Cylinder primitive, drum-shaped |
| Entryway/hallway bench | 900–1200 | 350–450 | 450–500 (seat), some to 1050 w/ backrest hooks | Backless typical; bench-with-back adds ~800–900 mm total height |
| Bedroom/end-of-bed bench | 1050–1500 | 400–450 | 450–500 | Long and low, matches bed foot width |
| Dining/kitchen bench | 1200–1800 | 300–400 | 450 (seat) | No back, slides under table |
| Piano bench | 750–900 (or 350 for duet stools) | 350 | 500 | Sometimes with hinged storage lid |

**Shape breakdown**:
- **Ottoman**: one padded top box (or cylinder for round/drum types)
  beveled at edges + 4 short leg cylinders/tapered cones (or a plinth box
  for fully-upholstered "waterfall" styles with no visible legs). Storage
  variant = same box shell + a lid box (hinged, opens on local +Z or lifts
  straight up ~250–300 mm) revealing a hollow interior — a good openable-
  part candidate. Front face (+Z): usually none functionally distinguished
  (ottomans are typically symmetric on all 4 sides) — skip a front-chevron
  indicator like other symmetric pieces, except tray-top or tufted-pattern
  variants where a diamond-tuft texture is a flat color, no geometry
  needed.
- **Bench**: one long flat seat box (thickness ~50–80 mm cushion pad on top
  of a thinner support box) + 4–6 leg cylinders/tapered box legs at the
  corners (a long bench may need a center leg pair to avoid visual sag) +
  optional low backrest panel box on local +Z (bench-with-back/hallway
  bench with hooks above) OR a slim armrest box at each end (settee-style
  bench). Front face (+Z): the side a person sits facing outward from; if
  it has a back, keep consistent with `FURNITURE_KINDS.bench`/`chair`.
  Under-bench storage variant: swap the plain support box for a shorter box
  shell + hinged lid top (same recipe as storage ottoman).

**Colors & finishes**: fabrics — linen/cotton weave (beige, gray, navy,
blush, sage), velvet (jewel tones — emerald, mustard, blush pink),
performance/boucle (cream, oatmeal), leather/faux-leather (cognac, black,
white). Wood-topped/entry benches: natural oak/walnut/pine seat slab +
black or brass metal hairpin/X-frame legs, upholstered cushion pad insert
optional. Tufted diamond-stitch pattern is a common surface detail (a
normal-map/texture rather than geometry). Leg finishes: matte black metal,
brushed brass/gold, natural wood, chrome (mid-century variants).

**Placement**: rests on the **FLOOR** — no wall/ceiling mount. Ottomans:
living room (paired with sofa/armchair as a footrest or extra seat, often
doubling as a coffee table with a tray), bedroom (foot of bed), family
room. Benches: entryway/mudroom (against a wall, often under coat hooks/a
mirror), foot of bed (bedroom), dining nook (against a wall or table long
side), hallway, closet/walk-in. Typical top/seat height 380–500 mm off the
floor — matches chair seat height so it registers as sittable
(`def.seat`). Entryway benches are frequently placed flush against a wall —
worth auto-snap-to-wall behavior similar to switches/fireplaces, though not
required.

**Active / interactive state**: **storage lid** — open/close animation
(lid box rotates open, hinge at back edge, or lifts vertically); could bind
to nothing (pure decorative interactive prop, `localState` toggle) since HA
rarely models ottoman/bench storage lids. **Occupancy** — like any `seat`
piece, an avatar can sit; bench is a great multi-seat host
(`floor(W/600)` spots per the existing sofa/bench convention) so 2 people
can sit at a hallway bench putting on shoes. **Tray-top ottoman** — could
show a subtle "in use" state (a book/mug prop) when a seated rig is nearby
and idling — cosmetic dressing, not entity-driven. No powered/electrical
state — purely passive furniture.

**Variations**: ottoman — cube, round/drum, rectangular footstool, storage
(lift-lid), tray-top (removable tray surface = separate mountable prop),
sectional/modular (join 2–4 into an island), pouf (soft, no visible legs,
slightly bulging profile via a flattened sphere/capsule instead of a hard
box). Bench — backless vs. backed, armless vs. arm-ended, storage vs.
open, with-hooks-above (technically a separate wall shelf piece),
wood-slab-top vs. fully upholstered, X-frame/hairpin-leg mid-century vs.
skirted traditional vs. floating wall-mounted ledge (rare "wall" variant —
bracket-hidden, could be modeled as a WALL-mount option at ~450 mm height
with no visible legs). Both — size tiers (compact/standard/oversized/
bench-for-two/bench-for-three) mapped straight onto `FURNITURE_KINDS`
default w/d like other seating.

**Animation opportunities**: idle — none inherent (static prop) beyond
ambient dust-mote/light-pool consistency; a seated avatar's normal idle
fidgets (foot-tap, check-watch, cross-arms) read naturally on a
bench/ottoman. Active — storage-lid open/close swing or lift (mirrors the
fridge/appliance-door pivot-group pattern, `_applianceDoors`-style blend);
cushion slight compression squash (tiny Y-scale dip) when a rig sits
down/stands up for Sims-style bounce; tray-top prop pop-in (mug/book) while
a rig sits idle nearby (echoes the "recent trigger" bubble idiom — cosmetic,
driven by dwell state, no HA entity needed).

---

## 17. Entertainment center / TV console / media wall

**Dimensions** (W × D × H, mm — floor-standing console; a wall-mounted
flat-panel TV usually sits above it as a separate object):

| Variant | Width | Depth | Height |
|---|---|---|---|
| Compact (up to 50" TV) | 900–1200 | 400–450 | 450–550 |
| Standard (55–65" TV) | 1500–1800 | 400–460 | 500–600 |
| Large / sectional (75–85" TV, low modern profile) | 1900–2500 | 400–460 | 450–550 |
| Floating wall-mounted shelf-style | 1200–2000 | 300–400 | 200–300 |
| Tall "entertainment center"/armoire w/ hutch | 1500–2200 | 450–550 | 1500–2100 |

Rule of thumb: console width ≈ TV width + 300 mm (150 mm overhang each
side); depth just enough for an AV receiver/soundbar (380–460 mm); top
surface 450–600 mm off the floor for a low modern stand, or console top at
500–600 mm with TV mounted separately above (TV screen center commonly
~1050 mm AFF for seated eye level).

**Shape breakdown**:
- **Carcass**: one long low `box` (the console body) — front face = local
  **+Z**.
- **Top**: thin `box` slab (20–30 mm) proud of the carcass on all sides by
  ~15–20 mm (classic "waterfall" overhang lip).
- **Legs/base**: either (a) 4 short cylinder or box legs (80–150 mm tall,
  mid-century style, tapered/angled outward), (b) a plinth `box` (recessed
  ~30 mm from the front face, shadow-gap look), or (c) none for a floating
  wall-mounted unit (mounted flush to a wall bracket, box only, no legs).
- **Doors/drawers on front face (+Z)**: 1–3 flat door-panel boxes and/or
  drawer-front boxes, each set ~5 mm proud of the carcass front with a
  small pull (thin cylinder or box handle) or a push-open (no visible
  pull, groove notch instead).
- **Open cubby sections**: omit a door box over part of the width, leaving
  a dark inset box (component "cavity") behind, optionally with a small
  emissive rectangle to fake AV-gear standby LEDs.
- **Cable-management cutout**: a thin dark slot/hole at the back top edge
  — cosmetic, a dark decal quad suffices.
- **TV (separate object, optional companion piece)**: thin `box` slab
  (bezel-less flat panel, ~40–60 mm thick incl. stand/mount) either resting
  on the console top or wall-mounted above it; screen face is a flat quad
  textured/emissive when "on".
- **Wall-mount bracket variant**: skip the console box, just the TV slab
  centered on the wall at eye height, floating (no legs, no console below)
  — a valid standalone variant for small rooms.
- **Media wall/built-in variant**: wide, floor-to-ceiling `box` unit — TV
  recessed into a central niche box, flanked by tall bookshelf-style boxes
  with shelf-hint boxes, and often a fireplace box below the TV niche
  (mirrors the existing `fireplace` kind's box proportions).

**Colors & finishes**: matte black, white, warm walnut/oak wood-grain,
grey-washed oak, espresso brown; occasional two-tone (wood body + black
top, or black body + wood-tone doors). Materials read: painted MDF/
engineered wood (flat matte), wood veneer (grain texture, toon-shaded still
reads fine as flat brown), matte black metal frame + wood shelves
(mid-century), high-gloss lacquer (white/black gloss, "TV lounge" look),
rattan/cane door inserts (textured beige panel) as a boho variant. TV
screen: near-black `#0a0a0a` glass when off; emissive blue-white/
content-colored glow when on.

**Placement**: living room (primary), family/media room, bedroom (smaller
variant facing the bed), basement/rec room. Rests on the **FLOOR**
(standard/compact/large variants — legs or plinth), or **WALL-mounted**
(floating shelf variant, bracket height so the shelf top sits ~400–600 mm
below TV, shelf itself ~600–1000 mm AFF), or **BUILT-IN** (media wall,
floor-to-ceiling against a wall). The companion TV, when modeled as a
separate piece, either rests ON the console top (mountable-on-surface, like
the existing `mountable`/`surface` relationship) or wall-mounts at a fixed
height independent of the console. Always placed with its front (+Z,
screen/door side) facing into the room, typically against a wall (back
flush like a bookshelf/dresser).

**Active / interactive state**: bind to a `media_player.*` entity (TV) —
reuse the existing now-playing idiom: while playing, show a camera-facing
card sprite above the piece with title/artist + album-art/content
thumbnail, plus a `♪`/title line in 2D; screen quad lit with an emissive
glow (soft animated color-shift or a bright "on" white-blue) vs. flat dark
when off/idle. Optional AV-gear standby LEDs (small emissive dots on the
console front, cable box/soundbar/game console) — tiny always-on
green/red pinpricks, cheap detail. Soundbar (thin box under/in front of the
TV) could pulse a subtle equalizer glow when media is playing. Unbound:
click-toggle `localState` on/off like other appliance/media furniture, same
visual swap.

**Variations**: size tiers (compact/standard/large-sectional/floating-
shelf/tall-armoire/media-wall built-in); leg style (angled tapered legs
mid-century, plinth base, none for floating); door configuration (full
doors, drawers, open cubbies, mixed — drawers left, open shelf right);
finish swap (wood-grain, matte black, matte white, gloss black/white,
two-tone); with/without a companion soundbar box, game-console box, or
side-mounted floor speakers (tall thin boxes flanking the console);
fireplace-integrated media wall variant (TV niche above a firebox, reusing
fireplace-kind geometry conventions).

**Animation opportunities**: idle — screen off = static dark quad; standby
LEDs blink very slowly (cheap `Math.random`-free sine flicker — calm/steady
since it's electronics, not flame). Active (media playing) — screen
emissive glow (color cycling low-frequency to fake content flicker, or a
fixed bright glow for simplicity), now-playing sprite card, soft ambient
bounce-light tint on nearby floor/wall (optional, cheap fake via a dim
colored point light), soundbar equalizer bars pulsing. Drawer/door — could
open partway when an avatar is anchored/dwelling nearby doing a "browse
media" activity (mirrors the `browse_bookshelf` anchor activity) — a
drawer or door pivot easing open ~200–300 mm/~60–70° while "in use," easing
shut after. Cable clutter/dust — not worth animating; static detail only.

---

## 18. Built-in fireplace and mantel

**Dimensions** (overall surround unit, floor to top of mantel shelf):

| Variant | Width | Height (to mantel top) | Depth (surround/hearth) | Firebox opening |
|---|---|---|---|---|
| Compact / bedroom | 900–1050 mm | 1200–1350 mm | 350–400 mm | 600×500 mm |
| Standard living-room (masonry or gas insert) | 1100–1300 mm | 1350–1525 mm | 400–500 mm | 900×700–760 mm |
| Oversized / great-room | 1500–1800+ mm | 1525–1700 mm | 500–600 mm | 1050×800 mm |
| Linear modern (gas/electric, no mantel) | 1200–2400 mm | 600–900 mm band | 250–400 mm | full-width glass strip |

Firebox opening ranges ~610–1220 mm wide × 610–915 mm high × 500–760 mm
deep per masonry/NFPA norms; a common "medium" masonry opening is
~915×735 mm. Mantel shelf sits **1370–1525 mm** (54–60") above finished
floor for wood-burning masonry units; gas allows 1220–1525 mm; electric
units can go as low as 900–1220 mm. Minimum code clearance: mantel
underside ≥300 mm above the firebox top opening, +25 mm more per 25 mm of
mantel shelf projection (a 150 mm-deep shelf wants ~450 mm clearance).

Diorama's existing engine convention (`fireplace` `LightIconKind`) already
targets W2=1000 × H2=1000 × D2=450 mm firebox + mantel — keep new built-in
variants proportioned around that baseline for visual consistency across
kinds.

**Shape breakdown** (front = local −Z, matching the existing engine
convention where the firebox opening faces −Z; keep the mantel BACK flush
with the firebox back plane, never proud of it, so wall-snap doesn't clip):
- **Surround box**: one flat box spanning full width × full mantel height ×
  shallow depth (~150–250 mm), representing the drywall/stone face around
  the opening. Front face at local −Z is planar except for the firebox
  cutout.
- **Firebox cavity**: a recessed box (darker/black material) inset into the
  surround, opening toward −Z; 500–900 mm wide, 500–750 mm tall,
  ~300–450 mm deep — a separate dark box slightly behind the surround
  plane, or a literal notch if the engine supports boolean cuts.
- **Firebox interior details**: 2–3 short cylinders (logs, horizontal,
  parallel along X) tinted brown/grey char, optionally a low flat cone or
  two overlapping thin cones tinted orange/red for flame silhouettes (the
  existing engine already animates flicker on emissive flames — reuse that
  primitive).
- **Hearth**: a thin flat box (slab, ~40–60 mm thick) extending forward
  from the firebox base, flush to floor, often a contrasting stone/tile
  material, proud ~600–900 mm wide.
- **Mantel shelf**: a box projecting forward (toward the −Z opening
  direction — the mantel's extra depth overhangs the FRONT, never the
  back) 100–300 mm deep, 40–100 mm thick, spanning the surround width plus
  50–150 mm overhang each side.
- **Mantel legs/corbels** (traditional style only): two vertical boxes or
  simple cylinders flanking the firebox, supporting the shelf visually.
- **Optional overmantel/TV recess**: a shallow rectangular box recess above
  the mantel for a mounted TV or art, on modern builds.
- Moving/openable parts: none structurally (built-ins don't have doors
  typically), but gas-insert glass fronts can be modeled as a thin
  transparent box pane over the firebox opening.

**Colors & finishes**: surround — white/cream painted drywall, whitewashed
shiplap, natural stone (stacked ledgestone grey/tan/charcoal), brick (red,
whitewashed, or painted black), poured concrete grey, or dark venetian
plaster. Mantel — stained wood (walnut, oak, white oak, driftwood grey),
painted-white MDF, reclaimed barn-beam (rough brown), or floating steel/
black metal shelf on ultra-modern units. Firebox surround trim — matte
black steel frame (common on modern linear units), brass/bronze on
traditional units, or blackened firebrick interior. Hearth — matching
stone/tile, or a raised brick hearth pad. Flame color — orange-yellow
(wood/gas), blue-tinted or color-changing LED (modern electric inserts).

**Placement**: **built-in / WALL-mounted-and-floor-resting hybrid** — the
surround typically rests on the FLOOR (hearth slab touches floor level,
y=0) and is either recessed into or applied flush against a wall, snapping
like Diorama's existing fireplace (`snapFireplaceToWall`, firebox back on
the wall face, opening −Z into the room). Rooms: living room, family room,
primary bedroom, basement/rec room, occasionally outdoor patio (masonry,
taller hearth). Linear modern units sometimes float mid-height on a wall
with no floor hearth (true wall-mount, base ~300–600 mm off floor) — worth
a variant flag.

**Active / interactive state**: existing engine behavior (keep) — warm
orange-red emissive flame regardless of HA light color, per-frame flicker
(`Math.random()`) on emissive intensity, point-light intensity, and
floor-pool glow opacity — cheap because it rebuilds every tick. Additional
opportunities: ember glow pulsing faintly when "off but pilot lit" (gas
units); a thin rising heat-shimmer/smoke-particle wisp when active;
mantel-top objects (candles, string lights) could pulse warmly in sync at
night. Seasonal: stockings hung from the mantel edge (winter), garland/
wreath draped along the shelf (holidays), seasonal mantel décor (pumpkins
fall, flowers spring) as swappable prop attachments.

**Variations**: style (traditional — corbels + raised hearth + painted
wood mantel; modern linear — no mantel, full-width glass, floating shelf
optional; rustic — stacked stone + rough-hewn timber mantel; craftsman —
tile surround + simple square mantel); fuel-look (wood-burning — visible
logs; gas insert — glass front, glowing ceramic logs or glass beads;
electric — flat panel, often no real depth needed, LED flame); size
(compact bedroom unit up through great-room oversized/double-height,
sometimes stone reaching to ceiling with no mantel shelf at all — full
floor-to-ceiling stone accent wall); mantel-less "modern linear" variant;
overmantel TV recess toggle.

**Animation opportunities**: idle — flame flicker (already implemented),
faint ember glow, subtle heat-shimmer distortion or rising particle wisps
above the opening, warm point-light bob. Active/triggered — intensify
flame height/brightness + point-light radius on "on", quick brightness
pulse on ignition (WHOOSH-like), gentle dim-down over 1–2 s on shutoff
rather than an instant cut. Ambient — firelight could cast a warm flicker
tint onto nearby floor/rug patches (reuse the existing blob-shadow decal
idiom but additive/warm instead of dark) for extra atmosphere without a
real shadow-map.

Sources: [Rockford Chimney Supply](https://www.rockfordchimneysupply.com/blogs/fireplaces-wood-stoves-and-inserts/fireplace-mantel-required-clearances) ·
[Columns and Balustrades](https://columnsandbalustrades.com/architectural-blog/fireplace-mantel-surround-dimensions/) ·
[Mantels Direct](https://www.mantelsdirect.com/blogs/news/mantel-height-guide-standard-ranges-clearances-and-design-rules) ·
[PICKHVAC](https://www.pickhvac.com/fireplace/mantel-height/) ·
[Planika USA](https://planikafires.us/fireplace-dimensions-sizing-guide-for-architects/) ·
[PositionIsEverything](https://www.positioniseverything.net/standard-fireplace-dimensions-comprehensive-size-chart-5-expert-guidelines/) ·
[DesigningIdea](https://designingidea.com/fireplace-dimensions/)

---

## 19. China cabinet / hutch / sideboard buffet

**Dimensions** (mm; combo hutch = base buffet + upper display cabinet,
often one piece or two stacked pieces):

| Variant | Width | Depth | Height |
|---|---|---|---|
| Buffet/sideboard only (base) | 1220–1830 (compact ~1050) | 405–610 | 760–915 (top counter ~900) |
| Oversized modern sideboard | 2030–2540 | 510–610 | 900–1015 |
| China hutch upper cabinet (on buffet or standalone tall) | 1050–2140 (narrow ~810) | 305–460 | full unit 1830–2130; upper section alone ~1100–1300 |
| Full two-piece hutch (buffet + hutch stacked) | 1220–1830 | 460–610 | 1830–2130 total |

Compact/apartment sideboards run ~900–1050 mm wide; grand dining-room
hutches top out near 2100 mm wide × 2130 mm tall.

**Shape breakdown**:
- **Base buffet/cabinet**: one large box carcass (W × D × ~800–900 mm H)
  sitting on 4 short cylinder or tapered-box legs (~100–150 mm) OR a
  plinth box (flush to floor, no visible legs — common on traditional
  pieces).
- **Base front**: 2–4 door boxes (thin flat boxes, ~20 mm thick) inset into
  the front face, plus 1–3 shallow drawer-face boxes above/between the
  doors (drawers usually centered over the doors). Small cylinder or box
  knobs/pulls protruding +Z.
- **Countertop**: thin box slab (~30–40 mm) capping the base, slightly
  overhanging the carcass on all sides (~15–20 mm lip) — this is the
  display shelf for hutch-less sideboards.
- **Upper hutch cabinet** (if present): a taller, shallower box (less depth
  than the base, typically set back or flush at the rear) sitting on top
  of the counter slab. Front face = 1–2 large glass-door boxes
  (transparent/glass material) with thin box mullions/muntins overlaid in
  a grid (2×3 or 3×3 pattern of thin strips) for the classic multi-pane
  look. Interior: 2–3 thin box shelves visible through the glass
  (optionally place tiny box/cylinder "china" props for visual life).
- **Crown/pediment**: an optional thin box or shallow box "hat" at the very
  top, wider than the cabinet, sometimes with a shallow arch cutout
  (approximate with two small corner boxes flanking a gap, or skip for
  simplicity).
- **Sides**: often flat flush boxes; some traditional styles add a thin
  vertical box "pilaster" strip at each front corner.
- **Front face** = local +Z (glass doors/drawer faces/handles all on +Z).
  Back is a plain flat box (unseen against a wall).
- **Moving/openable parts**: base doors (hinge on one vertical edge, swing
  out on +Z), drawers (slide out on +Z), upper glass doors (hinge + swing,
  same as base doors but with glass box + mullion overlay).

**Colors & finishes**: wood tones dominate — warm oak/honey, cherry/
mahogany (reddish-brown), walnut (dark brown), espresso/black-brown.
Painted finishes increasingly common — white, cream/antique white, sage/
soft green, navy — often two-tone (painted base + natural wood top, or
painted body + dark stained top). Hardware — brass, brushed nickel, black
iron, or bronze knobs/pulls. Glass — clear or slightly tinted upper doors;
mullions/muntins usually match the wood tone or are painted to match trim.
Traditional styles carry carved/routed detail (approximate with a raised
thin box trim strip); modern/Scandinavian styles are flat-panel, minimal
hardware, often two-tone with tapered peg legs (thin cylinders).

**Placement**: FLOOR-standing, always. Dining rooms (primary), kitchens
(as a buffet/hutch for extra storage), sometimes living rooms or entryways
as a display/storage piece. Base sits flush on floor or on short legs
(~100–150 mm clearance); no wall/ceiling mount. Typically placed against a
wall, back flush.

**Active / interactive state**: doors/drawers open/closed (bind to no
entity typically — could tie to a `binary_sensor` on a "liquor cabinet" or
bar hutch for opened/closed feedback, similar to the fridge door pattern).
Optional interior LED lighting strip in the upper glass cabinet (some
modern china cabinets have puck lights) — could animate as a warm emissive
glow when a bound light/switch entity is on, visible through the glass.
Otherwise static/decorative — a good candidate for an ambient "china
cabinet light" bindable fixture prop but not required for v1.

**Variations**: one-piece vs. two-piece (base buffet only, vs.
buffet+hutch stacked, vs. tall standalone china cabinet with no lower
buffet); door style (solid wood doors — all-storage buffet — vs. glass-
front upper — display hutch — vs. mixed glass upper + solid lower); width
tiers (compact ~1050 mm, standard ~1520 mm, oversized ~2030+ mm — size
presets like other casework); style/finish presets (traditional — ornate
crown, curved/arched glass mullions, dark wood; farmhouse — painted
two-tone, black hardware; modern — flat panel, tapered legs, minimal
hardware, wide glass panes with no mullions); corner variant (triangular/
corner china cabinet footprint — could be a separate kind if desired).

**Animation opportunities**: idle — none needed structurally; glass
reflections/subtle toon specular sell the "glass" read. Active — door
swing open/close (base doors and/or upper glass doors) on bind/click,
matching the existing fridge-door pivot-group pattern (`_applianceDoors`
idiom) — pick one primary door to animate for simplicity, or both tiers.
Active — drawer slide out/in (simple box translate on +Z) as a secondary
interactive flourish. Active — interior light glow (emissive bump on
shelf-area or a small point light) when bound to an on/off entity, visible
through the glass door box. Ambient life — static prop "china"/glassware
boxes on the visible shelves make the piece read as furnished even without
animation.

---

## 20. Bathtub, shower, and toilet

Built-in bathroom fixtures.

### Bathtub

**Dimensions** (W × D × H, mm; W = long axis):

| Variant | Size (mm) | Notes |
|---|---|---|
| Standard alcove (most common, ~80% of US homes) | 1524 × 762 × 406 | 3 walls, drop-in, apron front visible on 1 long side |
| Compact alcove | 1372 × 762 × 406 | Small bath / older homes |
| Oversized alcove | 1676–1829 × 813 × 406 | |
| Freestanding (soaking/clawfoot/slipper) | 1500–1700 × 700–800 × 550–700 (rim height) | No apron — finished all sides, taller rim, deeper basin |
| Corner/whirlpool | 1400–1500 × 1400–1500 × 460–530 | Diagonal front face, often w/ jets |

**Shape breakdown**: outer shell = one rounded box (large-radius bevel on
top rim, or a box with a chamfered/lofted top edge) sitting in a shallow
rectangular recess (the basin) — model as a box with a slightly-inset
second box nested for the interior. Front face (+Z, apron) is flat/
vertical on alcove tubs, a simple curved-front box on freestanding. Add: a
small cylinder overflow plate + drain disc (flush, at the bottom, offset
toward the faucet end), a cylinder+torus faucet spout and 1–2 small
cylinder handles at the head end (usually the wall end, not user-facing
+Z), optional 4 short cylinder/sphere "feet" under a freestanding tub. Rim
thickness ~40–60 mm — a subtle inset ring/bevel around the top opening
sells it. Corner tubs use a pentagon/chamfered-box footprint instead of
rectangular.

**Colors & finishes**: dominant white/bone/almond gloss (acrylic,
fiberglass, enameled cast iron, enameled steel); freestanding soakers also
appear in matte black, slate grey, or copper/brushed-metal (exposed
exterior tubs). Faucet/drain hardware: chrome, brushed nickel, matte
black, brass — pick one accent metal per bathroom.

**Placement**: rests on the FLOOR, built into a 3-wall alcove niche (back
+ 2 short walls) for alcove type; freestanding sits with clearance on all
sides. Rim height 400–450 mm above floor is the key ergonomic number
(bench/sit height).

**Active/interactive state**: water fill level (animated rising translucent
plane when "running" — bind to a `water_heater`/valve or just a toggle),
steam wisp particles when hot, drain animation (spiral swirl) on drain-out,
tap handle rotate on toggle, occupied = humanoid sitting/reclining anchor
with waterline overlay dimming the lower body (works with the existing
privacy-blur idiom for `bathe`).

**Variations**: alcove / freestanding-oval / freestanding-slipper /
corner-whirlpool / clawfoot; jet nozzles (small dark discs) for whirlpool
variant; apron color or panel material (wood-look panel option);
with/without integrated shower-above (glass panel + rod, see shower).

**Animation opportunities**: idle — none (static fixture) but a filled tub
can have a slow shimmering/rippling water-surface shader-substitute
(simple UV-scrolled translucent plane) and rising steam particles. Active —
fill/drain water-level lerp, faucet handle rotation, splash particles on
someone entering/exiting, occupant bathe-activity arm/idle motion already
covered by the humanoid activity system.

### Shower (stall / enclosure)

**Dimensions** (W × D × H, mm):

| Variant | Size (mm) |
|---|---|
| Code-minimum stall | 762 × 762 |
| Standard square stall | 813 × 813 or 914 × 914 |
| Rectangular stall | 900–1200 × 800–900 |
| Walk-in / curbless | 1200 × 900+ |
| Tub/shower combo | uses alcove tub footprint, 1524 × 762 |
| Enclosure glass height | 1900–2000 mm (to ceiling or near it) |
| Shower head height | 2000–2100 mm (fixed); rain-head 2200+ |
| Curb/threshold height | 100–150 mm (curbless = 0) |

**Shape breakdown**: shallow box (the pan/base, ~100 mm curb rim) + 1–2
flat glass box "panels" (thin, transparent material, front-facing +Z door
panel that can pivot/slide open) + a thin frame outline (thin box edges)
if framed. For a combo, reuse the bathtub shell + add a shower-curtain rod
(thin cylinder spanning the tub width at ~1900 mm) with a simple curtain
plane (or 12 small "ring" toruses) OR glass panel. Shower head = short
cylinder arm from wall + flattened disc/cone spray head; separate cylinder
handle/valve on the wall. Corner units use a pie-slice/quarter-circle pan +
curved door.

**Colors & finishes**: pan — white/grey/black acrylic, or tiled (procedural
tile texture on floor + walls, matches the existing floor-texture system);
glass — clear or frosted (semi-transparent grey); frame/hardware — chrome,
matte black, brushed nickel. Walls typically tile (subway/mosaic texture)
up to ceiling or a tiled half-wall + painted upper.

**Placement**: FLOOR-mounted pan/base; glass panels are wall-mounted/
floor-mounted vertical planes; shower head and valve mount to the WALL at
fixed heights (head ~2000 mm, valve/handle ~1050–1200 mm, matching the
light-switch-height conventions already in the codebase).

**Active/interactive state**: running water = animated particle stream
from head (cone-shaped falling particles) + fogged/steamed glass (opacity/
tint shift on the glass material) + puddle/wet-floor darkening; door
open/closed swing state (like the existing door-openness resolver) with
the glass panel rotating on a hinge or sliding; occupant = privacy-blur
silhouette (already documented in the activity system) with idle
washing-motion.

**Variations**: framed vs. frameless glass, sliding vs. hinged vs.
curtain, square/rectangular/corner/neo-angle footprint, with/without an
integrated bench-seat (small box ledge), with/without rain-head + separate
handheld wand (wall-mounted cylinder holder + hose).

**Animation opportunities**: idle — none when off. Active — particle
stream toggling on/off with the bound `switch`/valve entity, steam
particle drift + glass fog fade-in, door swing/slide open-fraction (reuse
`doorOpenFraction`), floor puddle decal lingering after use (mirrors the
existing rain-puddle fade system), occasional water-droplet trickle down
the glass.

### Toilet

**Dimensions** (mm):

| Measurement | Size (mm) |
|---|---|
| Overall width (bowl/tank) | 430–510 |
| Overall depth (wall to bowl front) | 660–790 (elongated bowl deeper: 735–785; round bowl: 685–710) |
| Standard bowl height (floor to seat) | 350–410 |
| "Comfort/ADA/right height" | 460–480 |
| Total height incl. tank | 685–815 |
| Tank width | 430–510 |
| Rough-in (wall to drain center) | 305 mm standard (12"), also 254/356 mm (10"/14") variants |
| Seat lid height above bowl rim (up) | +~30–40 mm clearance arc |

**Shape breakdown**: two-part composite. **Tank** = a simple rounded box
mounted against the wall (back, −Z) at the rear, with a slightly
overhanging flat lid box on top. **Bowl** = an elongated or round
teardrop-ish shape — approximate with a squashed cylinder/oval-profile box
tapering into a pedestal cylinder base (the "trumpet" base) meeting the
floor; a thin flattened torus/ring for the rim, and a flat elliptical
"seat" plane + separate hinged "lid" plane (both pivot up on a shared
hinge axis at the tank-side, local −Z). Front (+Z) = the open bowl/seat
front where a person approaches and sits. Small button/lever cylinder on
the tank top or side (flush handle) as the flush control.

**Colors & finishes**: overwhelmingly white/bone/biscuit vitreous china
(glossy ceramic look — high specular, smooth toon-shaded surface);
occasional black or grey modern designer models. Seat: white or black
plastic/resin (matte, slightly different material break from the glossy
ceramic bowl). Metal fittings (flush lever, bolt caps, supply line) in
chrome.

**Placement**: FLOOR-mounted, bolted at the base, tank backs flush against
a WALL (or wall-hung tankless variant where the bowl mounts to the wall
with the tank concealed in-wall — floating off the floor at ~400 mm).

**Active/interactive state**: lid up/down and seat up/down as two
independent hinge states (visual toggle, could bind to a `binary_sensor`/
manual click like the fridge-door idiom); flush = brief animated swirl
decal in the bowl + a short water-fill visual flash (no audio per project
convention) or a quick color/opacity flash in the bowl water disc;
occupied = seated humanoid anchor (toilet activity already listed in
`PHASE4_ACTIVITIES`).

**Variations**: two-piece (separate tank+bowl, most common) vs. one-piece
(tank/bowl fused, lower-profile, smoother silhouette) vs. wall-hung (no
visible tank, floating bowl); round-front vs. elongated bowl; standard vs.
comfort height; bidet-combo (add a small side control panel).

**Animation opportunities**: idle — none (static). Active — lid/seat hinge
rotation (up/down), flush swirl/water-level flash in the bowl basin (short
one-shot), flush-lever press animation (small button/lever rotates and
springs back), reused sit-activity pose from the humanoid system for an
occupant.

Sources: [Badeloft — Bathtub Dimensions](https://www.badeloftusa.com/ideas/bathtub-dimensions/) ·
[Rosenberry Rooms](https://www.rosenberryrooms.com/bathtub-dimensions-guide/) ·
[Measurement Stuff](https://measurementstuff.com/standard-bathtub-dimensions/) ·
[Home Depot](https://www.homedepot.com/c/ab/types-of-bathtubs/9ba683603be9fa5395fab90209ab53e) ·
[Horow — Toilet Bowl Dimensions](https://horow.com/blogs/guide/toilet-bowl-dimensions-exact-measurements-fit-guide-2025) ·
[Badeloft — Toilet Sizes](https://www.badeloftusa.com/ideas/toilet-sizes/) ·
[Wayfair — Toilet Dimensions](https://www.wayfair.com/sca/ideas-and-advice/renovation/toilet-dimensions-measurements-to-know-T68) ·
[Homenish](https://www.homenish.com/toilet-dimensions/) ·
[Horow — Shower Size Guide](https://horow.com/blogs/guide/2025-guide-to-standard-shower-size-dimensions-for-bathrooms) ·
[USA Cabinet Store](https://www.usacabinetstore.com/standard-shower-sizes/) ·
[DesigningIdea — Shower Sizes](https://designingidea.com/shower-sizes/)

---

## Modeling notes for Diorama

This section maps the 20 categories above onto Diorama's actual systems:
`FURNITURE_KINDS` defaults (`geometry.ts`), the `ObjectRecipe` custom-object
system, and the mount/animation conventions the renderer already expects.

### FURNITURE_KINDS defaults table

Suggested `w`/`d` (footprint, mm) and `h` (height, mm) defaults, tint, and
`furnitureCat` grouping for each new/expanded kind. Existing kinds already in
the codebase (`sofa`, `chair`, `bed`, `bookshelf`, `coffee_table`, `tv_stand`,
`dresser`, `nightstand`, `wardrobe`, `desk`, `toilet`, `sink`, `bathtub`,
`shower`, `fridge`, `stove`, `dishwasher`, `washer`, `dryer`, `microwave`,
`tv`, `counter`, `island`, `cabinet`, `ottoman`, `stool`, `plant`,
`exercise_equipment`, `coffee_maker`, `toaster`) already carry defaults —
this table lists the SIZE TIER a new sidebar variant/preset should use, not a
wholesale re-definition.

| Kind (existing or proposed) | w × d (mm) | h (mm) | seat / surface | Default tint | `furnitureCat` |
|---|---|---|---|---|---|
| `sofa` (loveseat preset) | 1500 × 900 | 850 | seat 450 | muted blue-grey | seating |
| `sofa` (standard preset) | 2000 × 950 | 880 | seat 450 | muted blue-grey | seating |
| `sofa` (oversized preset) | 2400 × 1050 | 900 | seat 460 | muted blue-grey | seating |
| `sectional_l` / `sectional_u` | long run 2800–3000 × 1000 | 880 | seat 450 | muted blue-grey | seating |
| `chaise` | 2100 × 950 (side) + 1700 × 950 (chaise) | 880 | seat 450 | muted blue-grey | seating |
| `armchair` | 800 × 850 | 900 | seat 450 | warm neutral | seating |
| `recliner` | 850 × 950 (1650 reclined) | 1050 | seat 460 | warm neutral | seating |
| `rocking_chair` (existing) | 700 × 900 | 950 | seat 430 | wood brown | seating |
| `coffee_table` (existing, retune) | 1200 × 600 | 440 | surface: true | wood/glass | tables |
| `end_table` | 480 × 500 | 580 | surface: true | wood/glass | tables |
| `dining_table` | 1700 × 950 | 750 | surface: true | wood | tables |
| `dining_chair` | 450 × 530 | 900 | seat 460 | wood/upholstered | seating |
| `bench` (existing, dining variant) | 1500 × 350 | 450 | seat 450 | wood | seating |
| `bar_stool` / `counter_stool` | 450 × 450 | 950 (bar) / 850 (counter) | seat 760/660 | metal + upholstery | seating |
| `bed` (existing, retune by size) | queen 1620 × 2130 | 550 (deck) | seat/lie: bed | linen | bedroom |
| `dresser` (existing, retune) | 1400 × 480 | 800 | surface: true | wood/painted | bedroom |
| `nightstand` (existing, retune) | 500 × 450 | 600 | surface: true | wood/painted | bedroom |
| `wardrobe` (existing, retune) | 1100 × 590 | 2050 | — | wood/painted | bedroom |
| `desk` (existing, retune) | 1400 × 700 | 740 | surface: true | laminate/wood | office |
| `office_chair` | 650 × 650 | 1050 | seat 460 | mesh/upholstered | seating |
| `bookshelf` (existing, retune) | 800 × 300 | 2000 | surface (shelves) | wood/painted | storage |
| `kitchen_sink` | 800 × 550 | 900 (counter) | mountable on counter | stainless/fireclay | appliance |
| `bathroom_vanity` | 750 × 500 | 860 | surface: true | white/wood | bathroom |
| `kitchen_cabinet_base` | 600 × 610 | 900 (incl. counter) | surface: true (counter) | painted/wood | storage |
| `kitchen_cabinet_wall` | 600 × 305 | 760–1065 | — | painted/wood | storage (wall-mounted) |
| `pantry_cabinet` | 600 × 600 | 2200 | — | painted/wood | storage |
| `island` (existing, retune) | 1800 × 1000 | 920 (counter) | surface: true, seat on overhang | painted/wood + stone-look top | appliance |
| `ottoman` (existing, retune) | 650 × 500 | 420 | seat 420, surface: true | upholstered | seating |
| `bench_entry` | 1050 × 400 | 480 | seat 480 | wood/upholstered | seating |
| `tv_stand` (existing, retune) | 1600 × 430 | 550 | surface: true | wood/matte black | appliance |
| `tv` (existing) | 1300 × 60 | 750 (mounted) | mountable | black glass | appliance |
| `fireplace` (existing, retune per variant) | 1200 × 450 | 1450 (to mantel) | — | stone/wood/painted | appliance |
| `china_cabinet` | 1500 × 500 | 2000 | surface (upper shelves) | wood/painted | storage |
| `bathtub` (existing, retune) | 1524 × 762 | 550 | — | white gloss | bathroom |
| `shower` (existing, retune) | 900 × 900 | 2000 | — | white/tile + glass | bathroom |
| `toilet` (existing, retune) | 480 × 700 | 750 | seat: toilet activity | white gloss | bathroom |

### ObjectRecipe custom-object mapping

Every composite above decomposes cleanly into Diorama's `ObjectRecipe`
`primitives: box | cylinder | sphere | cone`, each with `size` / `pos` /
`rot?` / `color?` in **local mm**, origin = piece center at floor level,
**+Z = front**:

- **Carcass-and-front pattern** (dressers, nightstands, wardrobes,
  vanities, cabinets, china cabinets, TV consoles): one large `box` body +
  N thin `box` fronts offset +Z (doors/drawers) + small `cylinder`/`box`
  pulls. This is the single most common recipe shape in this document —
  reuse one parametrized recipe (width, height, depth, door/drawer count,
  pull style) rather than bespoke recipes per kind.
- **Seat-and-legs pattern** (chairs, stools, benches, ottomans): one `box`
  or `cylinder` seat pad + 4 `cylinder`/tapered-`box` legs, optional `box`
  backrest on +Z, optional `box`/`cylinder` armrests on ±X.
- **Slab-on-legs pattern** (tables, desks, islands, counters): one flat
  `box` top + 4 corner legs OR 2 end-panel legs OR a pedestal `cylinder` +
  foot disc.
- **Basin/fixture pattern** (sinks, tubs, toilets): a shell `box`/`cylinder`
  with a smaller inset `box`/`cylinder` for the cavity color, plus
  `cylinder` faucet risers/spouts and small `sphere`/`box` handles.
- **Firebox pattern** (fireplace): surround `box` + recessed dark cavity
  `box` + log `cylinder`s + flame `cone`s (already an engine-level kind, not
  a custom recipe — new styles should extend `LightIconKind: 'fireplace'`
  rather than reinvent it).

### Floor / surface-mounted / wall-snapped / ceiling-hung

| Mounting | Items |
|---|---|
| **FLOOR** (elevation 0, freestanding or against a wall) | sofa/sectional, armchair/recliner, coffee/end/dining tables, dining chairs, bar/counter stools (unless a fixed-to-floor bar-height table), bed, dresser, nightstand (standard variant), wardrobe/freestanding armoire, desk, office chair, bookshelf (freestanding), kitchen island, base + pantry cabinets, ottoman, bench, entertainment console (standard/large), china cabinet/buffet, bathtub, toilet |
| **WALL-SNAPPED** (flush like the existing fireplace/switch/floodlight convention) | built-in fireplace/mantel, wall kitchen cabinets, bathroom vanity mirror, floating nightstand, floating TV/media shelf, wall-hung toilet, wall-mounted TV (companion piece), shower head + valve, closet doors (built-in) |
| **SURFACE-MOUNTED** (`surface: true` host; small items are `mountable`) | coffee table / end table / dresser top / nightstand top / desk top / kitchen counter / island counter / vanity counter / TV-stand top / china-cabinet counter — all host small mountable props (lamp, books, coffee maker, toaster, soap dispenser, TV) |
| **CEILING-HUNG** | none directly in this category (pendant lights over islands/dining tables are a separate Light fixture, not furniture) |
| **BUILT-IN / recessed** (structural, not a movable placeable in the strict sense) | walk-in/reach-in closet, media-wall unit, floor-to-ceiling bookshelf wall-run, kitchen wall-cabinet run |

### Items that want an "active/running" animated state

Ranked by how load-bearing the animation is to selling the piece as "alive":

1. **Kitchen sink / bathroom vanity / shower / bathtub** — running water
   (particle stream + ripple/puddle + optional steam), matching the
   existing `make_coffee`/`forage_fridge` anchored-activity + emissive-
   flicker idioms. Highest value: water is the one animation every kitchen/
   bath fixture in this doc shares.
2. **Built-in fireplace** — already implemented (flame flicker, point-light
   randomization); new variants (linear modern, gas insert) should reuse the
   same per-frame `Math.random()` flicker rather than adding a new system.
3. **Entertainment center / TV** — screen emissive glow + now-playing sprite
   card (already an existing idiom for bound `media_player.*`); standby LED
   blink for unbound consoles.
4. **Recliner / office chair / bar stool (gas-lift)** — two-stage recline
   deploy, swivel micro-rotation; a seat-height animation is unique to this
   category and worth a shared "seat blend" helper (backrest tilt, footrest
   slide) alongside the existing sit-blend idiom.
5. **Drawers/doors on casework** (dresser, nightstand, wardrobe, cabinets,
   china cabinet, TV console) — all share ONE animation primitive: a pivot
   group (hinge, ~70–110°) or a translate-along-+Z slide (drawer), eased
   τ≈0.25 s, triggered by proximity/dwell or click, exactly mirroring the
   existing `_applianceDoors` fridge/dishwasher/microwave/washer idiom. This
   is the single biggest reusable animation investment in the whole
   document — one system, a dozen furniture kinds.
6. **Seating occupancy** (sofa, armchair, dining chair, stool, bench,
   ottoman) — cushion-compression squash on sit/stand, already anchored to
   the existing `sit` 0→1 blend; no new state machine needed, just a
   per-kind Y-scale tweak on the seat box.
7. **Toilet** — lid/seat hinge + flush swirl one-shot, reusing the same
   hinge-pivot idiom as casework doors.
8. **Static/no-animation pieces**: dining/coffee/end tables, bookshelves
   (structure), bed frame (the *covers* animate, not the frame), china
   cabinet carcass, kitchen island carcass — these are staging surfaces
   whose liveliness comes entirely from props (mugs, books, plates) and
   nearby avatar activity anchors rather than their own geometry moving.

Cross-cutting reminders from `CLAUDE.md` that apply to every kind above:
add new `FurnitureKind`s to `FURNITURE_KINDS` (geometry.ts), the
`drawFurniturePrimitive` switch (canvas-render.ts), and the `_buildFurniture`
switch (three-renderer.ts) — the sidebar dropdown enumerates
`Object.keys(FURNITURE_KINDS)` automatically. Any door/drawer pivot must
avoid the coincident-face gotcha (two sibling boxes sharing an exact
visible plane hatch under toon banding) — stagger by a few mm the same way
the appliance doors and outline shells already do. Materials go through
`_mat()` (MeshToonMaterial) — never construct `MeshStandardMaterial`
directly.
