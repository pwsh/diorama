# Plants & Landscaping — Diorama Model Reference

This document is a build reference for modeling **household plants and landscaping** in
Diorama's Sims-2000-style renderer. Each item below is meant to be assembled from simple
primitives (`box` / `cylinder` / `sphere` / `cone`) positioned in **millimeters**, local
origin at the piece center at floor/ground level, local **+Z = front**. It exists so a
modeler can go straight from this doc to an `ObjectRecipe` (or a new `FurnitureKind`)
without re-deriving real-world dimensions, colors, or animation ideas from scratch.

## Table of Contents

1. [Small indoor potted plant (succulent / pothos / herb)](#1-small-indoor-potted-plant-succulent--pothos--herb)
2. [Medium indoor potted plant (snake plant / ZZ plant / peace lily)](#2-medium-indoor-potted-plant-snake-plant--zz-plant--peace-lily)
3. [Large floor plant / indoor tree](#3-large-floor-plant--indoor-tree)
4. [Hanging indoor plant and macrame planter](#4-hanging-indoor-plant-and-macrame-planter)
5. [Indoor herb garden and windowsill planter](#5-indoor-herb-garden-and-windowsill-planter)
6. [Deciduous shade tree — maple, oak](#6-deciduous-shade-tree--maple-oak)
7. [Evergreen / pine / conifer tree](#7-evergreen--pine--conifer-tree)
8. [Palm tree and tropical](#8-palm-tree-and-tropical)
9. [Shrub / bush and foundation planting](#9-shrub--bush-and-foundation-planting)
10. [Hedge / privacy row](#10-hedge--privacy-row)
11. [Flower bed and annual/perennial border](#11-flower-bed-and-annualperennial-border)
12. [Vegetable garden bed and raised planter box](#12-vegetable-garden-bed-and-raised-planter-box)
13. [Lawn / turf grass](#13-lawn--turf-grass)
14. [Mulch bed and ground cover](#14-mulch-bed-and-ground-cover)
15. [Ornamental grass](#15-ornamental-grass)
16. [Cactus and desert / xeriscape planting](#16-cactus-and-desert--xeriscape-planting)
17. [Climbing vine and trellis / arbor](#17-climbing-vine-and-trellis--arbor)
18. [Outdoor potted plant and hanging basket](#18-outdoor-potted-plant-and-hanging-basket)
19. [Rock garden and decorative boulders](#19-rock-garden-and-decorative-boulders)
20. [Modeling notes for Diorama](#modeling-notes-for-diorama)

---

## 1. Small indoor potted plant (succulent / pothos / herb)

### Typical dimensions
Pot + foliage, as it'd sit on a shelf/counter/floor:

| Variant | Pot Ø × H | Overall plant H | Foliage spread |
|---|---|---|---|
| Succulent (rosette, e.g. Echeveria/Haworthia), compact | 60–100 mm Ø × 60–90 mm H | 100–180 mm | 80–150 mm |
| Succulent, standard | 100 mm Ø × 90–100 mm H | 150–250 mm | 150–200 mm |
| Pothos, small trailing | 100–150 mm Ø × 100–150 mm H | 200–300 mm pot-top; vines trail 300–600 mm over the rim | 250–350 mm across |
| Pothos, full/mature (hanging or on a shelf) | 150–250 mm Ø × 150–200 mm H | vines 1.8–3 m in real life; model 400–900 mm of trailing vine for a static prop | 300–500 mm across at crown |
| Herb (basil/mint/parsley, windowsill pot) | 100–150 mm Ø × 90–130 mm H (standard 4–6″ nursery pot) | 150–300 mm | 150–250 mm, bushy |

Standard nursery pot steps run 100 mm (4″) → 150 mm (6″) → 200 mm (8″) diameter, each
roughly as tall as it is wide (a #1 "gallon" container ≈ 150–180 mm Ø × 150–200 mm H) —
good snap points for size variants.

### Shape breakdown
Local origin = pot-bottom center on the resting surface; +Z is nominal (radially
symmetric) — bias leaf/vine mass toward +Z so it reads facing the camera.

- **Pot**: one tapered `cylinder` (radiusBottom ≈ 0.8× radiusTop, terra-cotta/plastic
  taper) sized per the table above. A thin darker `cylinder` ring (2–5 mm tall, slightly
  wider) at the top reads as the rim/lip.
- **Soil**: a flat, slightly domed `cylinder` (dark brown/black, 5–10 mm proud of the
  rim) capping the pot — hides the pot/foliage seam.
- **Succulent foliage**: 5–12 small flattened `sphere`s or squashed `cone`s (scale.y ≈
  0.4–0.6) arranged in a low rosette above the soil. For an aloe/snake-plant-type
  succulent, swap in 4–8 slim vertical `cone`s instead of the rosette.
- **Pothos foliage/vines**: 2–3 overlapping squashed `sphere`s (scale.y ≈ 0.5) as the
  crown, plus 2–4 thin drooping `cylinder`s (or a chain of small tapered cylinder
  segments) bending outward/down over the rim for trailing vines, with a few
  flattened-sphere/leaf-card billboards along each. Keep vine end-points below the pot's
  bottom plane if trailing off a shelf edge.
- **Herb**: bushier version of the succulent — 8–15 small spheres (leaf clusters)
  clumped in an irregular mound above the soil (randomized offsets), optionally 3–5 thin
  cylinder "stems" poking up before the leaf clumps for a leggier herb like basil.
- No moving/openable parts — static decorative prop.

### Colors & finishes
- **Pot**: terra-cotta orange (`#c17a4e`/`#b5673a`), matte white/cream ceramic, matte
  black/charcoal plastic or concrete, woven-basket tan (rattan cachepot).
- **Soil**: dark umber/near-black (`#2b1d14`), matte; lighter tan for cactus/succulent
  mix.
- **Foliage**: succulents skew blue-green/sage (`#8fae8b`, `#a7c4a0`), sometimes
  blush/purple leaf tips (Echeveria); pothos is mid-to-yellow-green with optional
  variegation (cream/white marbling, or a two-tone material / vertex-color speckle for a
  stylized "variegated" look); herbs are saturated grass-green, matte/fuzzy (basil) to
  dark glossy (rosemary/mint).
- Flat toon-shaded materials (per the engine's `_mat()` factory) are sufficient — no
  extra texture detail needed at this scale.

### Placement
- Primarily **mountable** (sits atop tables/counters/shelves/windowsills/nightstands) —
  the dominant real-world placement (windowsill herbs, coffee-table succulents, shelf
  pothos).
- Also viable as a floor piece for larger/mature specimens (own taller-pot variant,
  ~250–400 mm, indoor-styled floor planter).
- Common rooms: kitchen (herbs, windowsill), living room (pothos on a shelf/side table),
  bedroom (succulent on nightstand), bathroom (low-light pothos/succulent on a vanity),
  office/desk (succulent).
- Rest height when mountable = host surface top (same convention as `coffee_maker` /
  `toaster`); no wall/ceiling variant needed here (see the hanging-planter item).

### Active / interactive state
- No HA-bound on/off state — pure decorative/atmosphere prop, no `activity` anchor or
  entity binding needed.
- Optional health variant: a "needs water" wilted droop (leaves/vines angled down,
  desaturated color) vs. a healthy perky pose — could be a simple local flag, or a
  single fixed "healthy" look for v1.
- No lighting/glow effects.

### Variations & customizations
- **Kind**: succulent / pothos / herb (optionally a 4th "snake plant"/aloe using the
  spike-cone variant), mirroring how `tree`/`bush`/`flower_bed` are separate outdoor
  kinds.
- **Size**: compact / standard / oversized (3 preset tiers per the dimension table).
- **Pot style**: terra-cotta, ceramic white, black plastic, woven basket — a color/
  material swap on the pot cylinder only.
- **Foliage color**: standard green vs. variegated (pothos) vs. blue-grey/blush-tipped
  (succulent) vs. deep green (herb).
- Reuses the existing "mountable countertop object" pattern (`coffee_maker`, `toaster`)
  directly — same size class and placement rules.

### Animation opportunities
- **Idle**: subtle sway/breathe — a slow (4–8 s period) sine-driven `rotation.z` wobble
  (±1–2°) on the foliage/vine group only (pot+soil rigid); pothos vine tips get a
  slightly larger, phase-offset sway than the crown for a trailing-in-the-breeze look.
  Time-based only — no dirty-key rebuild needed.
- **Active/triggered**: none required; optional nice-to-have is a brief "disturbed"
  nudge (larger sway impulse decaying over ~1 s) if a rig brushes past — cosmetic only.
- **Health**: if ever HA-bound to a soil-moisture sensor, a droop-pose blend (leaves
  angle down, desaturate) vs. perky "healthy" — analogous to the fridge-door/appliance-
  state blend idiom.
- Growth is not worth animating — keep it a static-scale prop aside from idle sway.

**Sources**: [Gardening Know How – nursery container sizes](https://www.gardeningknowhow.com/garden-how-to/shop/nursery-containers.htm),
[Lukas Nursery pot size chart (PDF)](https://lukasnursery.com/wp-content/uploads/2023/09/Soil-Conversion-Chart.pdf),
[Joy Us Garden – pothos size & vine length](https://www.joyusgarden.com/full-pothos-plants-trailing-vines/),
[A-Z Animals – how big are pothos houseplants](https://a-z-animals.com/blog/how-big-are-pothos-houseplants/),
[The Sill – golden pothos care](https://www.thesill.com/blogs/plants-101/how-to-care-for-golden-pothos-epipremnum-aureum),
[Succulents Box – pot size for succulents](https://succulentsbox.com/blogs/blog/choosing-the-right-size-pot-for-your-succulents),
[HOJNY Succulents – ideal pot size](https://www.hojnysucculents.com/blog/selecting-the-ideal-pot-size-for-succulents),
[Mountain Crest Gardens – 2in pot succulents](https://mountaincrestgardens.com/wholesale-2in-pots/)

---

## 2. Medium indoor potted plant (snake plant / ZZ plant / peace lily)

### Typical dimensions
Pot + foliage, "medium" floor/tabletop size as commonly sold:

| Variant | Pot Ø × height | Total plant height | Foliage spread (W×D) |
|---|---|---|---|
| Snake plant (Sansevieria), standard | 250 mm Ø × 230 mm (10 in grower pot) | 500–650 mm | 300–400 mm |
| Snake plant, tall/oversized | 250–300 mm Ø × 250 mm | 750–900 mm | 350–450 mm |
| ZZ plant (Zamioculcas), standard | 200–250 mm Ø × 200 mm | 450–600 mm | 450–600 mm (arches outward) |
| ZZ plant, floor size | 300 mm Ø × 280 mm | 750–900 mm | 750 mm |
| Peace lily (Spathiphyllum), standard | 220–250 mm Ø × 200 mm | 500–650 mm (incl. white spathe blooms) | 450–600 mm |
| Peace lily, compact/"Petite" | 150 mm Ø × 140 mm | 250–300 mm | 250 mm |

Good single default: **pot 250 mm Ø × 230 mm tall, total height ~700 mm, foliage spread
~400 mm.**

### Shape breakdown
Origin at floor center of pot base.

- **Pot**: truncated cone (approximate with a scaled cylinder, slightly wider at top
  than base) — Ø 250 mm top / 210 mm base, height 230 mm, sits y=0–230.
- **Soil**: thin flat cylinder cap, Ø 235 mm, ~15 mm thick, just below the rim (y≈215–
  230), dark brown/black.
- **Foliage — snake plant**: 6–10 tall flattened blades, each a very thin scaled box
  (60 mm wide × 15 mm deep × variable height) tapering to a point (cheat with a thin
  cone or pinched-top box); arranged in a rough circular fan from the soil center,
  heights varied ±20%, tallest blades toward the back/center.
- **Foliage — ZZ plant**: 4–8 stalks, each a thin cylinder (8 mm Ø) curving outward —
  approximate with 2–3 short cylinder segments angled progressively outward; each stalk
  lined with small flattened-ellipsoid leaflets (12×12×4 mm) in opposite pairs down the
  stalk. Glossy dark green.
- **Foliage — peace lily**: broad clustered leaves as elongated scaled spheres/
  ellipsoids (flattened teardrop, ~180 mm long × 70 mm wide × 8 mm thick) angled
  outward at varying heights; a few white spathe "flowers" as small angled cones/flags
  (thin flattened cone, white, ~120 mm) on thin cylinder stems above the canopy.
- **Front face**: no true front — foliage is radially arranged. Bias slightly denser
  foliage toward +Z (back) so it reads well from the default camera.
- No moving/openable parts.

### Colors & finishes
- Pot: matte terracotta, matte white/cream ceramic, charcoal/black plastic nursery pot,
  woven basket-textured beige.
- Soil: near-black to dark brown, matte.
- Snake plant: deep green blades with lighter green horizontal banding (or simplify to
  solid mid-dark green ~`#2f5233`); some cultivars (laurentii) have pale yellow leaf
  margins.
- ZZ plant: glossy deep green (`#1f4a1f`–`#2e6b2e`), waxy-looking — slightly boosted
  saturation/gloss under toon shading.
- Peace lily: matte-glossy mid-green leaves (`#2f6b3a`), white spathe blooms, optional
  pale yellow-green spadix spike.

### Placement
- Rests on the **floor** (living room corners, entryways, office floor, bedroom) at
  y=0, or on a **counter/surface** (side table, shelf, windowsill, kitchen counter,
  desk) as a smaller variant (`mountable: true`, elevation = host surface top).
- Common furniture-adjacent placement: beside sofas, room corners, flanking entryways/
  windows, on bookshelves.
- Not wall-mounted or ceiling-hung in this category (see the hanging-plant item).

### Active / interactive state
- Not HA-bindable in the usual sense (no entity). Optional: bind to a **soil-moisture
  sensor** entity if present — droop/yellow-tint foliage color when moisture is
  critically low, perk up when watered.
- Otherwise purely decorative/static — no power state, no seasonal change (all three
  are evergreen foliage plants).

### Variations & customizations
- Species/kind: snake plant, ZZ plant, peace lily (distinct foliage silhouette per
  above).
- Size: compact tabletop (~300 mm) / standard (~650 mm) / oversized floor plant
  (~900 mm).
- Pot style: terracotta, ceramic white, black plastic nursery pot, woven basket.
- Leaf variegation toggle (snake plant: solid green vs. yellow-edged).

### Animation opportunities
- **Idle**: subtle sway/rustle — slow, low-amplitude sinusoidal rotation (±1–2°) on the
  foliage primitives only, phase-offset per leaf/stalk; can piggyback on the same
  ambient-motion idiom used for idle humanoid fidgets, driven by a shared low-frequency
  sine rather than physics.
- **Active**: none for a static prop; if moisture-sensor bound, a slow multi-second
  lerp of leaf color/droop angle at the dry/watered threshold.
- Optional flourish: a rare single-leaf twitch (idle-fidget style, low probability per
  tick) — entirely optional/low priority.

---

## 3. Large floor plant / indoor tree

### Typical dimensions
Pot + foliage canopy; floor footprint = pot diameter.

| Variant | Pot Ø | Overall height | Canopy spread |
|---|---|---|---|
| Compact / starter (dwarf fiddle, small rubber plant) | 250 mm (10") | 600–900 mm | 400–600 mm |
| Standard floor plant (6" pot rubber tree, young monstera) | 150–250 mm (6–10") | 1200–1800 mm | 600–900 mm |
| Large ("statement" fiddle leaf fig / monstera) | 250–350 mm (10–14") | 1800–2100 mm | 900–1200 mm |
| Oversized / XXL | 350 mm+ (14"+) | 2100–3000 mm | 1000–1500 mm |

Ship **3 size presets**: Small (900 mm), Standard (1800 mm), Large (2400 mm) — matches
nursery marketing tiers and gives distinct furniture-catalog entries.

### Shape breakdown
Origin at floor center, local +Z = front (largely symmetric — default `frontArrow`
off).

- **Pot**: truncated cone (`cylinder` with top radius < bottom radius) — Ø top ≈ pot
  size, Ø bottom ≈ 0.8× top, height ≈ 0.35–0.45× pot Ø. Optional thin flared-lip ring at
  top.
- **Soil cap**: flat short cylinder, dark brown/black, ~10 mm proud of the rim.
- **Trunk/cane(s)**: 1–3 thin cylinders (fiddle leaf fig/rubber tree = single or twin
  cane; monstera often has a moss pole — thin vertical cylinder wrapped in a slightly
  larger brown "fuzzy" cylinder) rising from the soil, with a slight bend (2–3 short
  cylinder segments at small angle offsets rather than one straight cylinder) for
  organic asymmetry.
- **Canopy** — species-specific, all sharing one leaf-clump primitive at different
  scale/count/tint:
  - *Fiddle leaf fig*: large flattened, slightly domed ellipsoids/spheres ("paddle"
    shape) clustered near the top third of the trunk, 6–12 per plant, each ~150–300 mm,
    angled outward at varied rotations. Cheap fallback: 2–3 overlapping large flattened
    spheres forming a lollipop canopy with a leaf alpha/color texture.
  - *Monstera*: broader, lower, bushier — cluster of large flattened spheres/ellipsoids
    (fenestration via texture, not geometry) radiating from multiple stem points near
    soil level rather than one top canopy; often leans/climbs a center moss pole.
  - *Rubber tree*: denser, more oval canopy of smaller flattened spheres, glossier
    material, more symmetric "shrub on a stick" silhouette.
- No moving/openable parts.

### Colors & finishes
- Pot: terracotta orange-brown, matte white/cream, charcoal/black matte, woven-basket
  tan, or concrete grey — glossy or matte-bisque finish.
- Soil: near-black to dark brown, matte, optionally topped with decorative moss (pale
  green) or pebble mulch (grey).
- Trunk/cane: light-to-mid brown, matte woody texture, sometimes with visible leaf-scar
  rings (fiddle fig) or aerial roots (monstera).
- Foliage: fiddle leaf fig — deep glossy green, pale-yellow leaf veins; monstera —
  mid-to-dark matte-satin green; rubber tree — deep burgundy-green (standard) or
  variegated cream/green/pink (Tineke), very glossy waxy sheen.
- Moss pole (monstera): brown coir wrap, optional sphagnum tufts.

### Placement
- **Floor**-resting only (pot base at y = 0). No wall/ceiling/counter variant for this
  size class (tabletop mini versions are the "medium potted" item above).
- Rooms: living room, bedroom, home office, entryway/foyer, sunroom, dining room —
  typically against a wall or in a corner near a window, rarely mid-room.
- Just needs floor footprint + canopy bounding box for collision/placement (same
  treatment as a floor lamp).

### Active / interactive state
- No powered state — static, non-electrical prop; no HA entity binding is meaningful.
  Optional stretch: a smart-planter moisture sensor bind (env sensor chip showing soil
  moisture %).
- No click-to-toggle behavior expected; clicking can at most select it for the sidebar
  editor.

### Variations & customizations
- **Species/type**: Fiddle Leaf Fig, Monstera Deliciosa, Rubber Tree (Burgundy), Rubber
  Tree (Variegated/Tineke) — different leaf-clump tint/shape/density preset on the
  shared rig.
- **Size** preset: Small / Standard / Large — scales trunk height + canopy count/scale
  together.
- **Pot style**: terracotta, matte white/black, woven basket, concrete.
- **Multi-cane vs single-trunk** toggle.
- **Moss pole** on/off (monstera-specific accessory cylinder).

### Animation opportunities
- **Idle**: very subtle, slow foliage sway (small per-leaf-clump rotation oscillation,
  low amplitude, long period ~4–6 s, phase-offset per clump) — same family as the
  fireplace-flicker idiom but gentler and continuous rather than random; always-on
  ambient (no HA state to gate it).
- **Reactive**: a light sway/rustle pulse when an avatar walks close by (nice-to-have,
  low priority).
- **Seasonal/health flourish** (stretch): slightly different leaf-tint or a few
  "browned" leaf clumps if bound to a soil-moisture sensor in bad condition — mirrors
  the env-sensor `warn`/`danger` color escalation.
- No open/close, no on/off glow — primary deliverable is a good static silhouette per
  species plus gentle idle sway.

---

## 4. Hanging indoor plant and macrame planter

### Typical dimensions
Assembled hanger + pot + plant; ceiling hook-to-floor is NOT fixed (sized by drop
length).

- **Pot/planter body**: 100–250 mm diameter, most common ~180–230 mm (7–9"); pot height
  ~120–180 mm.
- **Macrame hanger drop** (top ring to base of pot cradle): compact ~450–600 mm
  (18–24"); standard ~750–900 mm (30–36", fits 175–300 mm pots); long/statement
  ~1000–1100 mm (38–43"). Add ~150–250 mm above the ring for the ceiling hook +
  mounting loop.
- **Plant foliage spread** below/around pot: trailing types (pothos, string of pearls,
  ivy) add 300–900 mm of hanging vine beyond the pot base; upright/bushy types (fern,
  spider plant "pups") add 200–400 mm of radial leaf spread around and above the rim.
- **Overall envelope** (ceiling attachment to lowest leaf tip), practical build targets:
  - Compact: ~700 mm total drop, pot Ø160 mm
  - Standard: ~1100 mm total drop, pot Ø200 mm
  - Oversized/statement: ~1600–1800 mm total drop, pot Ø250 mm, long trailing vines

### Shape breakdown
Local +Z = front — largely axisymmetric, front matters mainly for trailing-vine bias.

- **Ceiling hook**: tiny torus/cylinder stub (or a small dark sphere) at the top anchor
  point.
- **Macrame netting**: a **cone** (wide flare at top near the ring, narrowing to a neck
  above the pot) in natural rope/off-white, OR 3–4 thin cylinders (hanging cords)
  converging from a small top ring sphere down to a shared knot band — the cheap
  4-cylinder version reads fine; a single tapered cone is the even cheaper fallback.
- **Knot/cradle band**: short, slightly wider `cylinder`/`torus` ring where the cords
  cinch around the pot's widest point (~60–80% up the pot height).
- **Pot**: a `cylinder` tapered slightly inward at the base (a straight cylinder is an
  acceptable simplification), often terracotta/ceramic; optional thin rim-lip
  `cylinder`.
- **Soil surface**: flat dark disc (short cylinder or flattened sphere-cap) recessed
  into the pot mouth.
- **Plant foliage**: cluster of `sphere`s (bushy foliage mass, e.g. pothos/fern) OR
  several thin drooping `cylinder`s curving downward and outward (trailing vine type,
  e.g. string of pearls/ivy) — 3–5 overlapping spheres of varying size clustered above
  and spilling over the rim, plus 2–4 thin down-curving cylinder "vines" for trailing
  varieties.
- No moving/openable parts — the only "moving part" is the whole assembly swaying, and
  optionally a swappable plant-cluster mesh per variant.

### Colors & finishes
- **Macrame cord**: natural undyed cotton (cream/off-white, most common), jute tan/
  brown, boho dyed variants (blush pink, sage green, black) — matte rope texture, no
  shine.
- **Pot**: unglazed terracotta (warm orange-brown, matte), white/cream ceramic, glazed
  colors (sage, navy, blush), woven rattan basket look, or matte black/concrete
  planter.
- **Foliage**: rich green (pothos/philodendron), silvery-green (string of pearls,
  succulents), variegated green-and-white (pothos 'marble queen', spider plant), deep
  green fern fronds.
- Wood beads are a common macrame accent (small light-wood spheres threaded on the
  cords) — cheap optional detail.

### Placement
- **Ceiling-hung** — mounts to a ceiling hook/eye-bolt, always indoors near a window.
  Common rooms: living room, kitchen (near a bright window), bedroom, sunroom/plant
  corner, bathroom (humidity-loving ferns).
- Typical hang height: pot bottom sits ~1500–1900 mm above floor (clears foot traffic)
  with the ceiling anchor at room ceiling height (2400–2743 mm per this project's wall-
  height convention); in a bay/corner window it may hang lower (~1200 mm) if clear of
  walking paths.
- Never floor- or counter-resting in its "hanging" form (a plant that merely sits on a
  stand/floor is a separate furniture kind).

### Active / interactive state
- No powered state — decor, not a device. Good candidate for **ambient idle
  animation** rather than a discrete on/off state:
  - Gentle continuous swing/sway (small-amplitude pendulum rotation about the ceiling
    anchor, phase-offset per instance).
  - Optional subtle vine/leaf sway (slight per-vine rotation offset from the main sway,
    lagging slightly for a "trailing in a breeze" feel).
  - Could react to a nearby door opening/HVAC vent (brief increased sway amplitude) as
    a nice touch, though not required.
- No seasonal/HA-entity binding expected — purely decorative, always "on."

### Variations & customizations
- **Pot style**: terracotta, glazed ceramic, woven basket/rattan, modern matte
  concrete, colored glass.
- **Hanger style**: single-cord simple wrap, classic 4-cord diamond-knot macrame,
  double/tiered hanger (two pots stacked at different drops), beaded macrame.
- **Plant type** (drives the foliage cluster): bushy upright (pothos, philodendron,
  fern), trailing/vine (string of pearls, string of hearts, ivy), spiky (spider plant,
  air plant), succulent rosette.
- **Size tier**: compact / standard / oversized, swappable independent of pot or plant
  style.
- **Multi-hanger cluster**: 2–3 hangers at staggered drop lengths from one area, common
  in boho styling — worth supporting as a placement pattern.

### Animation opportunities
- **Idle**: continuous slow pendulum sway (2–4 s period, small angle, e.g. ±3–5°),
  independent phase per instance; secondary lagged sway on trailing vines/leaf clusters
  for a layered "settling breeze" look; very slow foliage "breathing" scale pulse for
  subtle life.
- **Active/triggered**: a passing avatar or door draft could bump the sway amplitude
  briefly and let it decay (spring-damped, matching the codebase's existing
  damped-spring idiom); a gust from an open window could trigger the same.
- **No functional state changes** (no growth stages, no watering indicator) unless a
  future feature ties a humidity/plant-care sensor to a healthy/wilted foliage-color
  swap — a clean optional hook, not standard.

**Sources**: [Bouqlife 43 Inch Macrame Plant Hanger — Amazon](https://www.amazon.com/Bouqlife-Macrame-Crochet-Hanging-Planter/dp/B08NVRS18S),
[Mkono Macrame Plant Hanger, 35 Inch — Amazon](https://www.amazon.com/Mkono-Macrame-Hangers-Hanging-Planter/dp/B07L4J1P9P),
[Primitive Planters 36 in. Tan Macrame Plant Hangers (2-Pack) — The Home Depot](https://www.homedepot.com/p/Primitive-Planters-36-in-Tan-Macrame-Plant-Hangers-2-Pack-2589/203164832),
[How to Make a Macrame Plant Hanger — Simply Frayed](https://www.simplyfrayed.com/blog/howtomakeamacrameplanthanger),
[How to Make an Easy DIY Macrame Plant Hanger — First Day of Home](https://www.firstdayofhome.com/diy-macrame-plant-hanger/),
[Easy Macrame Plant Hanger — Ohio Tropics](https://www.ohiotropics.com/2024/11/25/easy-macrame-plant-hanger/),
[Macrame Plant Hangers: all you need to know — Isabella Strambio Blog](https://isabellastrambio.com/macrame-plant-hangers-all-you-need-to-know/)

---

## 5. Indoor herb garden and windowsill planter

### Typical dimensions
W × D × H, mm; front = long side facing the room/window.

| Variant | W | D | H | Notes |
|---|---|---|---|---|
| Simple windowsill trough (3-pot set or single trough) | 350–410 | 95–115 | 85–130 | Plastic/ceramic, no electronics; the everyday case |
| Larger window box | 900 | 200 | 200 | Wood/plastic, often on a wide sill or railing |
| Compact smart garden (Click & Grow SG3-class) | 300 | 120 | 210–470 | Height varies with 0–2 lamp-arm "extensions"; base pod 210, +130 per extension |
| Standard countertop hydroponic garden (AeroGarden Harvest-class) | 190–270 | 160–265 | 300–445 | Includes overhead LED hood on a rear/side arm |
| Oversized hydroponic garden (Harvest XL/Bounty-class) | 430 | 270 | up to 610 | Wider bowl, taller adjustable lamp arm |
| Single terracotta herb pot (fallback prop) | ⌀100–150 | — | 90–140 | Classic tapered pot, one per herb, clustered 3–5 on a sill |

### Shape breakdown
- **Trough/box planters**: one long `box` (rounded-rect approximation fine) as the
  body; a thinner inset `box` (recessed ~10–15 mm from the top) as soil/mulch fill,
  dark brown; optional slim `box` lip cap around the top rim. Front = the long visible
  side (+Z) facing the room.
- **Smart/hydroponic gardens** (2–4 primitives, most reusable rig):
  - **Base bowl/reservoir**: a squat `cylinder` or rounded `box` (round bowl for
    AeroGarden-style, rectangular for Click & Grow-style), ~130–180 mm tall.
  - **Lamp arm**: a thin vertical `cylinder`/`box` rising from the back edge of the
    base, height = overall H minus base height.
  - **Lamp hood**: a flattened `box`/shallow `cylinder` cap at the top of the arm,
    angled slightly downward over the bowl — this is the emissive part (see Active
    state).
  - **Plant pods**: 3–7 small `cylinder` stubs poking through the lid, each topped with
    a small `sphere`/thin-cone foliage cluster at varying heights (1–2 scaled spheres
    per pod is enough at this scale).
  - **Individual terracotta pots** (fallback/simple prop): tapered `cylinder` (larger
    top radius than base — frustum), plus a foliage sphere/cone cluster; no moving
    parts.
- **Foliage**: for all variants, a small cluster of flattened spheres or thin cones per
  plant, mid-to-yellow-green, randomized slightly in scale/rotation per pod.
- No hinges/doors; the only conceptual "moving part" is the water-level float/gauge on
  self-watering models (skip modeling; can be a decal).

### Colors & finishes
- Planter bodies: matte white, black, sage/terracotta-orange, stainless-look grey, or
  natural wood (light oak) — self-watering plastic models lean white/black/grey; wood
  boxes lean natural or painted farmhouse white.
- Reservoir/base on smart gardens: usually glossy white, black, or stainless-steel-look
  plastic.
- Grow-light hood: matte white or black plastic housing; the light itself reads as
  warm-white or a pink/purple full-spectrum LED glow — warm white is safer/less garish
  in a Sims-style room.
- Soil/mulch fill: dark brown to near-black.
- Terracotta pots: classic warm orange-brown clay, occasionally glazed ceramic in
  blue/white/sage.
- Foliage: fresh green (basil, mint) to grey-green (sage, thyme) to purple-green (basil
  varieties) — 2–3 leaf-color variants add believable variety across a cluster of pots.

### Placement
- Room(s): kitchen (most common — near sink or window over the counter), dining room,
  sunroom.
- Rest surface: **mountable/counter-or-surface** is the dominant case — sits directly
  on a countertop, kitchen island, or windowsill ledge, no mounting hardware. Windowsill
  ledges typically sit ~800–900 mm off the floor (counter height 900 mm is a good
  universal placement height).
- A wall-mounted variant (hanging shelf/rail-mounted trough) exists but is far less
  common — only if requested, mounted ~1000–1200 mm high near a window.
- Not floor-resting, not ceiling-hung, not built-in in the typical residential case.

### Active / interactive state
- **Powered smart gardens**: emissive grow-light hood when "on" (bind to a `light.*` or
  `switch.*` entity) — a soft downward cone/pool of light over the bowl, similar
  treatment to Diorama's existing pendant/spot light glow. Steady emissive change is
  enough; no need for animated flicker.
- **Growth stage**: foliage scale/height could increase over a fixture's "age" or a
  bound sensor (e.g. days since planting) — purely cosmetic; likely a static "grown-in"
  look is enough, randomizing per-instance foliage fullness for variety.
- **Water level indicator**: self-watering models have a small vertical gauge/float
  visible through a window strip on the side — a simple colored decal (blue = full,
  clear = empty) if a sensor entity exists, otherwise skip.
- **Wilting**: no real entity typically drives this; if ever tied to a "needs water"
  binary_sensor, foliage could droop (bend cones downward).

### Variations & customizations
- Style: countertop hydroponic (electronic, tallest), simple windowsill trough
  (passive, cheapest/most common), individual terracotta pot cluster (most flexible,
  works on any sill).
- Size: 1-pod single herb pot, 3-pod trough, 3–7-pod smart garden, oversized XL smart
  garden.
- Material/finish: plastic (white/black/sage), wood (natural/painted), ceramic/
  terracotta.
- Herb selection cosmetic variants: basil (broad rounded leaves), mint (small serrated
  leaves, slightly trailing), rosemary/thyme (needle-like, cone-cluster foliage),
  parsley/cilantro (frilly, more numerous thin blades) — 2–3 foliage silhouette presets
  cover most variety cheaply.
- Optional accessory: small plant tag/label sticks (thin cylinders) poking out of soil.

### Animation opportunities
- **Idle**: gentle foliage sway (small per-leaf rotation oscillation, low amplitude/
  period, offset per pod); very subtle steam/light shimmer on the grow-light pool if
  desired.
- **Active** (bound light entity on): grow-light hood emissive material lights up +
  soft light-pool decal on the counter beneath, reusing the existing light-fixture glow
  idiom (`_mat` emissive + pool disc) rather than inventing a new one.
- **Seasonal/long-term** (likely out of scope for v1): foliage fullness/height
  increases gradually, or a "harvested" trimmed-down state.
- **Interaction**: clicking toggles the bound grow-light like any other light fixture;
  no other interactive state expected.

---

## 6. Deciduous shade tree — maple, oak

### Typical dimensions
Canopy is roughly circular in plan (W≈D); trunk diameter separate.

| Variant | Canopy spread | Height | Trunk diameter (DBH) |
|---|---|---|---|
| Nursery / newly planted (2–3" caliper B&B stock) | 1200–1800 mm | 2400–3600 mm | 50–75 mm |
| Young/juvenile (5–10 yr) | 2500–4000 mm | 4500–7000 mm | 150–250 mm |
| Standard mature yard tree (useful diorama default) | 7000–10000 mm | 9000–13000 mm | 450–600 mm |
| Oversized / heritage specimen (old oak/sugar maple) | 15000–24000 mm+ | 18000–24000 mm+ | 900–1800 mm |

Species notes: red maple mature ≈ 12000–21000 mm tall, 9000–15000 mm spread, rounded/
ascending crown; sugar maple ≈ 12000–24000 mm tall, 9000–18000 mm spread, dense oval
crown; oaks (white/red) ≈ 15000–24000 mm tall with the widest canopies of common shade
trees, 18000–30000+ mm spread on old solitary specimens, often wider than tall. For
gameplay/scale reasons a diorama "standard" tree should probably be capped near
8000–10000 mm tall so it reads against a ~2743 mm (9 ft) house wall without dominating
the lot.

### Shape breakdown
Origin at ground/trunk base center, +Z = front is nominal only (trees are ~radially
symmetric — kept for consistent shadow/LOD orientation).

- **Trunk**: one tapered cylinder (wider at base) — radiusBottom ≈ DBH/2 × 1.3 (root
  flare), radiusTop ≈ DBH/2 × 0.6, height ≈ 0.35–0.45× total tree height before the
  first canopy mass. Slight bark-color; a straight cylinder reads fine at this scale.
- **Root flare** (optional): squashed cone or wide flat cylinder at the base (radius ≈
  trunk radius × 1.5, height ≈ 150–300 mm); can be skipped for a low-poly variant.
- **Canopy — maple** (rounded/oval mass): 1 large sphere (or vertically-scaled
  ellipsoid, scale.y ≈ 1.15–1.3) centered above the trunk top, plus 2–4 smaller offset
  spheres (jittered radii/position/rotation) to break up the perfect-sphere silhouette.
  Canopy radius ≈ spread/2.
- **Canopy — oak**: wider, flatter, more irregular — same multi-sphere cluster
  approach, flattened (scale.y ≈ 0.75–0.9) and spread laterally with more offset lobes
  (4–6 smaller spheres); a few short branch cylinders can poke out from the canopy edge
  into a small terminal sphere to suggest limb structure.
- **Branch hints** (optional mid-tier detail): 3–6 short cylinders angling up-and-out
  from the top third of the trunk into the canopy volume, thickness tapering, mostly
  hidden inside the foliage spheres — mainly useful for a winter/bare variant
  silhouette.
- **LOD**: cheapest = 1 trunk cylinder + 1 canopy sphere; mid version adds flattening +
  2–3 extra lobe spheres; no front-face distinction needed (symmetric build, free
  placement rotation).

### Colors & finishes
- Trunk/bark: greyish-brown to dark brown (`#5b4636`, `#6b5642`; oak slightly greyer
  `#7a7266`); flat/matte, no shine — one base tone + the shared gradient map is enough,
  no bark texture needed at this scale.
- Canopy — spring/summer: mid-to-bright green, maple slightly yellower-green
  (`#5c9e3f`–`#6fb84a`), oak slightly darker/duller olive-green (`#4f7a3a`–`#5e8a44`).
- Canopy — **seasonal variants** (big visual payoff for these species):
  - Spring: fresh light green, maybe small pink/white blossom flecks (ornamental maple
    varieties) — optional.
  - Summer: full saturated green (default state).
  - **Fall**: maple → vivid orange/red/yellow (`#d9822b`, `#c0392b`, `#e8c547` — maples
    are THE classic fall-color tree); oak → duller russet/brown-red (`#8a4a2e`,
    `#6b4226`), since oaks color later and browner than maples.
  - Winter: bare — canopy spheres hidden/shrunk to near-zero, only trunk + branch-hint
    cylinders remain, OR swap to a sparse low-opacity twiggy silhouette.
- No gloss/reflectivity — flat toon material matching the app's outdoor kit (`bush`/
  `pine_tree`/`flower_bed`).

### Placement
- **Floor** (ground-level, outdoor `cat`), like the existing `tree`/`pine_tree`/`bush`
  kinds — planted on the yard ground plane (y ≈ 0), no elevation.
- Yard/lawn placement only — front yard, back yard, along property edges; not indoors.
  Works well near `groundAreas` of kind `grass`.
- Keep clear of house walls in practice (real planting guidance keeps large shade trees
  ≥ 4500–6000 mm from foundations because of root spread), but the tool shouldn't
  hard-block placement — modeling/UX note only.
- Standard blob shadow + outline shell like other furniture, though a shadow-only (no
  outline) treatment may look better given the organic silhouette — modeler's call.

### Active / interactive state
- Trees aren't HA-bindable devices — no on/off entity state. The only "state" is
  **environmental**: time of year / weather.
- Animate ambient response to the existing weather system (Feature W) rather than any
  device binding:
  - Gentle canopy sway/rustle scaled by `WeatherFxState.windKmh` (reuse the
    wind-bearing math already used for cloud shadows/precip drift).
  - Rain glisten not needed, but existing rain particles could pass through/be partly
    hidden by canopy volume.
  - Optional: snow accumulation cap on canopy spheres in a snowy condition (small
    white-tinted cap primitive or color blend), tying into `weather.effects3d`.
- Falling leaves in fall condition would be a nice touch but is a stretch goal
  (particle system similar to precip clouds, low count, slow fall, seasonal-color-
  matched).

### Variations & customizations
- **Species**: maple (rounder, brighter canopy) vs oak (broader, flatter, lumpier
  canopy, greyer bark) as two distinct `FurnitureKind`s (or one `tree` kind with a
  species sub-property), each with its own default color/shape params.
- **Size**: sapling / young / mature / heritage presets (table above) — expose as
  width/height sliders, defaulting to "mature standard."
- **Season/color**: a color/season property (spring, summer, fall, bare-winter) the
  user can set per-tree, independent of live HA weather — or auto-tie to
  `resolveTimeBucket`/a future season-of-year concept.
- **Shape variant**: columnar (narrow, tall — a columnar maple cultivar) vs
  broad-spreading (classic oak) as an alternate canopy-scale preset.
- **Canopy density/poly-budget**: low-poly (1 sphere) vs detailed (multi-lobe cluster)
  toggle for perf-conscious large yards with many trees.

### Animation opportunities
- **Idle**: subtle continuous canopy sway (small rotation/scale wobble on the foliage
  spheres, offset phase per lobe so it doesn't read as rigid), driven by ambient time,
  optionally scaled by live wind speed from the weather system.
- **Active/weather-driven**: stronger sway + directional lean during high wind
  (windy/storm conditions, reusing the gust-burst idiom); snow settling (fade in a
  white cap layer during snowy condition, fade out after — mirrors the puddle-lingering
  pattern); seasonal color transition (cross-fade canopy material color across
  spring→summer→fall→bare, via a manual property change); rain droplet glisten/
  darken-wet-bark tint during rain (optional, minor).
- **Ambient life**: occasional bird perching/flying near the canopy could reuse the
  existing pet/avatar rig system as a stretch goal — out of scope for the tree model
  itself.

**Sources**: [Acer rubrum (Red Maple) — NC Extension Gardener Plant Toolbox](https://plants.ces.ncsu.edu/plants/acer-rubrum/),
[Maple Tree Care Guide — Arbor Masters](https://arbormasters.com/tree-101-everything-you-want-to-know-about-maple-trees/),
[How Big Do Oak Trees Get? — Howgarden.blog](https://www.howgarden.blog/how-big-do-oak-trees-get),
[Understanding Tree Sizes for Your Landscape — Angi](https://www.angi.com/articles/tree-sizes.htm),
[Understanding Nursery Stock Sizes — Johnson's Nursery](https://kb.jniplants.com/understanding-nursery-stock-sizes),
[What's the Best Size Tree to Buy & Plant? — Independent Tree](https://www.independenttree.com/best-size-tree-to-plant/),
[Selecting Nursery Stock — NPS Common Learning Portal](https://mylearning.nps.gov/library-resources/selecting-nursery-stock/)

---

## 7. Evergreen / pine / conifer tree

### Typical dimensions
Canopy width/depth × height; conifers are round-to-oval in plan (width ≈ depth).

| Variant | Width × Depth | Height | Notes |
|---|---|---|---|
| Young ornamental yard tree (default scale prop) | 800–1000 × 800–1000 mm | 2800–3500 mm | Matches typical nursery stock at install — 6–7 ft Emerald Green arborvitae / Serbian spruce |
| Compact / dwarf conifer (foundation planting) | 500–700 × 500–700 mm | 1200–1800 mm | Dwarf Alberta spruce, mugo pine — rounded globe form |
| Columnar / privacy hedge type (arborvitae) | 900–1200 × 900–1200 mm | 3000–4500 mm | Narrow, tall cylinder-cone rather than wide pyramid — mature spread only 3–4 ft even at 10–15 ft height |
| Mature specimen / statement tree (oversized) | 3000–6000 × 3000–6000 mm | 6000–12000 mm | Full-grown spruce/pine/fir can canopy a 30 ft (~9 m) diameter circle |
| Potted tabletop/porch conifer (holiday-tree-styled) | 400–600 × 400–600 mm | 1200–1500 mm | Small potted variant, base ≈ half the tree's height |

Rule of thumb: width ≈ 0.5× height for a "full" profile, ≈0.35–0.4× for a "pencil"
columnar profile.

### Shape breakdown
Local +Z = front — largely irrelevant since conifers are radially symmetric, kept
nominal for shadow/LOD purposes.

- **Trunk**: 1 tapered `cylinder` (wider at base), radius ≈ `W×0.09–0.14` at base
  tapering to ~60% at top, height ≈ 15–40% of total height depending on species look
  (round "pine_tree" kind uses a *short* exposed trunk ~16% of height since branches
  start low; the round broadleaf-style tree uses ~42%).
- **Foliage — two silhouette families**:
  - **Rounded/pine-blob style**: 3 overlapping `sphere`s of decreasing radius stacked
    with slight lateral offset (r, r×0.82, r×0.72) to fake an organic canopy cheaply.
  - **Tiered conical/fir style**: 3 stacked `cone`s, each tier narrower than the one
    below (radius shrinking ~26% per tier) and slightly overlapping in height so
    there's no visible gap — the classic Christmas-tree/fir silhouette.
  - **Columnar arborvitae variant**: a single elongated `cone` (or a very tall, gently-
    tapered `cylinder` capped with a small `cone` tip) instead of tiers — the narrow
    privacy-hedge look.
- No openable/moving rigid parts — static prop; "front" is nominal (consistent
  placement/rotation only).

### Colors & finishes
- Trunk: brown-bark tones, `#6b4a2b`-ish (mid brown), flat/matte, no visible texture
  beyond toon shading bands.
- Foliage: deep evergreen greens — blue-spruce variants skew blue-green/silvery
  (`#4a7a6e`-ish), standard pine/fir a saturated forest green (`#2f6d3a`–`#3f7d2e`),
  cedar/arborvitae a slightly yellower green. Matte, non-reflective; flat toon-shaded
  color is sufficient.
- Optional seasonal finish: light dusting of white (snow cap) on the upper tiers/sphere
  caps for a winter scene toggle.

### Placement
- **Floor** (ground) only — yard/outdoor category, sits directly on grade at y=0, no
  mounting height; base flush with the ground plane.
- Typical rooms/zones: front yard (foundation planting near entry), back yard (privacy
  screening along property line/near fence), side yard.
- Spacing guidance for multiples: full-size pines/spruces are planted 10–12 ft
  (~3–3.7 m) apart; arborvitae hedges as tight as 3 ft (~900 mm) apart for a solid
  screen — useful default spacing when a user drops several in a row.

### Active / interactive state
- No HA entity binding expected (pure decorative landscaping prop) — but a good
  candidate for **seasonal/weather-reactive visuals** already present in the yard-arc
  design:
  - Snow accumulation overlay during `snowy` weather condition (lighten tips/add a thin
    white cap layer).
  - Gentle wind-sway during `windy`/`windy-variant`/breezy conditions, tying into the
    existing 3D weather wind-bearing plumbing.
  - Could optionally pulse/highlight on selection like other fixtures for edit-mode
    affordance.

### Variations & customizations
- Silhouette family: rounded/blob pine vs. tiered fir/spruce vs. narrow columnar
  arborvitae.
- Size preset: dwarf / standard yard / oversized specimen (table above).
- Color: standard green / blue-spruce silvery-green / golden-arborvitae yellow-green.
- Snow-capped toggle (static decorative variant, independent of live weather).
- Trunk visibility: some tiered conifers have branches to the ground (trunk fully
  hidden) vs. an exposed lower trunk (mature pine look) — controllable via bottom-tier
  radius/position.

### Animation opportunities
- **Idle**: subtle continuous sway/rustle (low-amplitude rotation oscillation on the
  foliage tiers/spheres, phase-offset per tree so a row doesn't move in lockstep),
  driven by ambient time, optionally scaled by live wind speed.
- **Active/weather-reactive**: increased sway amplitude + slight bounce during `windy`
  conditions (reuse the gust-burst idiom); snow accumulation fade-in during sustained
  `snowy` conditions and fade-out after cessation (mirrors rain-puddle lingering); a
  light frost-rim tint at very cold temps (matching the existing frost threshold).
- **Incidental**: birds or falling needles/snow as a rare occasional cosmetic touch
  (low priority, particle-based, very sparse and localized to the tree).

**Sources**: general nursery/landscaping references (arborvitae/spruce/pine sizing —
see the deciduous-tree section's nursery-stock sources, which apply equally).

---

## 8. Palm tree and tropical (houseplant + landscaping)

### Typical dimensions
Pot/root-ball footprint × height; diameter given for round canopies.

| Variant | Pot/base Ø | Height | Notes |
|---|---|---|---|
| Tabletop parlor palm | 150–200 mm pot | 400–600 mm | 4″ pot, desk/shelf scale |
| Small potted (parlor/dwarf areca), floor | 250–300 mm pot | 900–1200 mm | 8–10″ pot |
| Standard indoor floor palm (areca/kentia) | 300–360 mm pot (10″) | 1500–1800 mm (5–6 ft) | most common "corner plant" size |
| Large indoor floor palm (kentia/areca) | 350–400 mm pot (14″) | 1800–2150 mm (6–7 ft) | brushes 8 ft ceilings |
| Outdoor landscaping palm (yard, e.g. queen/pygmy date) | 400–600 mm trunk base, 1800–3000 mm frond spread | 2500–6000 mm | scaled down from real 6–15 m specimens for yard use |

Canopy/frond spread is typically 0.9–1.3× height for indoor varieties (fuller, rounder
crown); outdoor palms read taller and narrower with a spread ~0.5–0.7× height.

### Shape breakdown
Front face = any orientation; palms are radially symmetric, no true "front" needed
(`frontArrow: false`).

- **Pot/planter**: tapered cylinder (or box for square planters), Ø per table, height
  ≈ 0.18–0.22× overall plant height. Optional inner soil disc (flattened cylinder, dark
  brown) proud of the rim by ~10 mm.
- **Trunk(s)**: 1–3 thin cylinders (real multi-cane palms like areca/bamboo palm show
  3–8 canes; simplify to 2–3 for silhouette) tapering slightly narrower at top, Ø
  30–80 mm at base scaling with plant size, rising from the soil to ~55–70% of total
  height before fronds start.
- **Frond crown**: approximate each frond as a very thin, elongated box (or flattened
  cone) angled outward and slightly drooping from a shared crown point; arrange 6–10
  fronds radially (evenly spaced yaw, ~15–25° between +Y tilt variants) around the
  trunk top, several tilted downward/drooping (mature fronds droop, new ones point up).
  Cheap fallback: 2–3 overlapping flattened cones (stacked umbrella shapes) with
  jagged-edge alpha texture if the engine supports cutout textures; otherwise solid
  thin boxes read fine at Sims-toon scale.
- **Outdoor palm variant**: single tall tapered cylinder trunk (subtle "ringed" texture
  from frond-scar bands — fake with darker horizontal texture bands, no extra geometry)
  topped by the same radial-frond crown, scaled up; no visible pot (planted in a
  ground/mulch circle instead, reusing the existing `groundAreas` mulch kind).
- **Other tropical foliage** (banana plant, bird-of-paradise, monstera as
  palm-adjacent "tropical" set-dressing): swap frond geometry for broader flattened-
  oval "leaf" boxes on thin stem cylinders instead of thin fronds — same trunk/pot/
  crown assembly pattern.
- No moving/openable parts — purely decorative, static geometry.

### Colors & finishes
- Foliage: mid-to-dark green (`#2e7d32`–`#3a5f3a` range), lighter yellow-green
  new-growth fronds optional as a second tone; toon shading bands this into 2 visible
  greens naturally.
- Trunk: tan/brown (`#7a6a4f`) for real bark, or grey-green for smooth-trunk palms
  (queen palm); ringed frond-scar texture reads as slightly darker horizontal bands.
- Pot: standard planter finishes — matte black, white, terracotta, or woven-basket tan.
- Soil: dark brown top disc, optionally with a lighter mulch/rock topping.

### Placement
- Indoor: **floor**-resting (pot base at y=0), typically corners of living rooms,
  entryways, sunrooms/offices, near windows. Also a small **mountable** tabletop
  variant (console table, desk) at 8–10″ pot scale.
- Outdoor: floor/ground-resting in the yard — pairs with the existing `outdoor`
  furniture category (alongside `tree`, `pine_tree`, `bush`, `flower_bed`) as a new
  `palm_tree` kind; no wall/ceiling mounting variant makes sense.
- No standard rest height beyond "on the ground/floor" — height is all in the plant
  itself.

### Active / interactive state
- No powered/toggleable state — inert decor, not entity-bound; no HA binding needed.
- Optional ambient life: a very subtle idle sway on the fronds sells "real plant"
  without an interaction model.
- Could double as a "mood" indicator only indirectly (e.g. paired with a room
  occupancy glow), but the plant itself has no state.

### Variations & customizations
- Size tiers: tabletop / small floor / standard floor / large floor (indoor), matching
  the dimension table.
- Species-flavored presets (same primitive rig, varying frond count/droop/trunk
  count/color): areca (multi-cane, bushy, bright green), kentia (fewer broader fronds,
  elegant arch), parlor (small, delicate, few thin fronds), outdoor queen/pygmy date
  (single thick trunk, ringed texture, fuller crown).
- Broader "tropical" set: swap frond geometry for monstera (big flat notched leaves —
  a few large flattened ovals on stems) or banana plant (very large paddle-leaf boxes)
  as sibling kinds reusing the same pot+stem+foliage assembly.
- Pot style options: black plastic nursery pot, decorative ceramic, woven basket, or
  none (ground-planted outdoor).

### Animation opportunities
- **Idle**: gentle continuous frond sway (small per-frond sinusoidal rotation.z/x
  wobble, phase-offset per frond — cheap, like the fireplace-flicker idiom but
  deterministic sine instead of `Math.random()`); an optional slow overall trunk
  lean-breathe for tall specimens.
- **Active/environmental**: outdoor palms could react to the weather system —
  stronger frond bend/rustle scaled by `windKmh` (reusing the wind-bearing math already
  computed for weather effects), heavier one-directional droop during `windy`/storm
  conditions; indoor palms stay static (no wind indoors) but could get a one-shot
  "shiver" if a nearby door/window opens (nice-to-have, not required).
- No seasonal state change expected (palms are evergreen) — unlike deciduous `tree`/
  `bush` kinds.

**Sources**: [Palm Trees: Areca, Parlour, Kentia & Lady — HORTOLOGY](https://hortology.co.uk/blogs/guides-to-greenery/which-palm-is-right-for-you),
[Kentia Palm Care — Joy Us Garden](https://www.joyusgarden.com/elegant-plant-lower-light-kentia-palm/),
[20 Types of Indoor Palm Trees — Botanical Interests](https://www.botanicalinterests.com/community/blog/indoor-palm-trees/),
[The Difference Between Parlor, Areca, and Other Palms — Apartment Therapy](https://www.apartmenttherapy.com/types-of-palm-plants-36649203),
[6FT Artificial Palm Tree Indoor with White Pot — Amazon](https://www.amazon.com/Artificial-Indoor-Realistic-Adjustable-Branches/dp/B0DC6MG5GJ),
[5-Foot Artificial Palm Tree — Pure Garden — Amazon](https://www.amazon.com/Pure-Garden-Foot-Artificial-Palm/dp/B00HXGT0GE),
[7FT Artificial Palm Tree Indoor — Amazon](https://www.amazon.com/Artificial-Indoor-Realistic-Adjustable-Branches/dp/B0DJJ8T4X3),
[Artificial Palm Tree, 5ft/6ft/7ft — The Warehouses](https://thewarehouses.com/artificial-palm-tree-5ft-6ft-7ft/)

---

## 9. Shrub / bush and foundation planting

### Typical dimensions
Mature, landscape-installed — width × depth (spread, roughly circular canopy so W≈D) ×
height, mm.

| Size class | Spread (W×D) | Height | Real-world examples |
|---|---|---|---|
| Dwarf / compact mound | 300–600 × 300–600 | 300–600 | dwarf boxwood, Tater Tot arborvitae (900 mm), Golden Globe arborvitae |
| Standard foundation shrub | 750–1200 × 750–1200 | 900–1400 | Green Velvet/Winter Gem boxwood, azalea, hydrangea |
| Large / hedge-form shrub | 1200–1800 × 900–1200 | 1500–3000 | American boxwood, Emerald Green arborvitae (spread only 900–1200 but height 3000–4600) |
| Column/spire evergreen | 900–1200 × 900–1200 | 2400–4600 | arborvitae hedge screen, upright juniper |

Nursery pot-to-installed-size reference: a #3 container plant is ~300–900 mm tall/wide;
a #7 container plant ~450–1400 mm — useful if offering a "newly planted/small" variant
alongside "established/mature." Rule of thumb for a single default asset: **900 × 900 ×
900 mm** rounded mound reads as a generic mid-size foundation shrub.

### Shape breakdown
All primitives, no moving parts — static landscaping prop.

- **Rounded mound shrubs** (boxwood, azalea, hydrangea): 1 flattened `sphere` (scale Y
  ~0.6–0.8 of X/Z) on the ground plane, bottom clipped flat (place sphere center at
  `y = radius*0.5` so it appears to emerge from soil). Optional second smaller sphere
  offset for an irregular/asymmetric silhouette.
- **Columnar/spire evergreens** (arborvitae): 1 tall `cone` (or cone + short cylinder
  trunk stub hidden inside foliage) — cone base radius ≈ spread/2, apex at full height;
  slight taper variation via 2 stacked cones (wide base + narrower top) for a fuller
  "arborvitae hedge" look.
- **Layered/tiered shrub** (azalea clusters, boxwood balls in a row): 2–3 overlapping
  spheres of varying size clustered together for a fuller, less-uniform blob than one
  perfect sphere.
- **Foundation hedge run**: repeat one mound or cone primitive along a line at
  ~600–900 mm pitch (a placement/recipe-level concern, not a single asset).
- No front face distinction needed — shrubs are radially symmetric; skip `frontArrow`.
- Optional: a thin flattened `cylinder` (radius ~1.15× canopy) at y≈0–20 mm as a
  mulch-ring base for foundation plantings, dark brown/black.

### Colors & finishes
- Foliage: deep green (`#2e5c3a`–`#3f7a4d` typical evergreen), yellow-green (Golden
  Globe arborvitae, `#8ba33a`), blue-green (blue juniper, `#5b7f8c`), burgundy/purple
  (some barberry/loropetalum, `#5a3247`).
- Toon-shaded flat matte finish (no gloss) fits the low-poly Sims aesthetic — a single
  base color per shrub, optionally a slightly darker sphere/cone shell inset for
  shading variation instead of texture.
- Seasonal/flowering variants: small colored sphere "blossom" dots (pink/white/red)
  scattered on the canopy surface for azalea/hydrangea bloom state.
- Mulch ring (if modeled): dark brown `#3b2b20` or reddish cedar mulch `#6b3a22`.

### Placement
- **Outdoor only** — rests on the floor (ground plane/`groundArea`, y=0), typically
  along the foundation line of a house exterior wall, in beds/borders, or as accent
  plantings in the yard.
- Sits directly on grade; no mounting height. If paired with a raised planter bed, base
  sits at the bed's soil-fill height instead of y=0.
- Fits the existing `outdoor` FurnitureKind category alongside `tree`, `pine_tree`,
  `bush`, `flower_bed` — this is likely the exact slot `bush` already targets; consider
  size variants (dwarf/standard/large) and a columnar `arborvitae`/hedge variant.

### Active / interactive state
- No functional/HA-bindable state — shrubs aren't HA-bindable devices. Possible
  ambient/decorative cues:
  - Seasonal recolor (spring bloom dots appear, autumn tint for deciduous shrubs,
    snow-cap in winter via a future season system) — treat as a future hook, not
    required now.
  - Subtle wind sway (see Animation) as the only "liveliness," matching the tree/bush
    category's static-but-breathing yard feel.

### Variations & customizations
- Shape: mound/rounded (boxwood-style) vs columnar/spire (arborvitae-style) vs
  clustered/layered (azalea).
- Size: dwarf / standard / large-hedge (uniform scale of the same primitive rig).
- Color: evergreen green / golden / blue-green / burgundy, plus a "flowering" toggle
  that adds blossom dot spheres.
- Optional mulch-ring base toggle for a "foundation bed" look vs bare lawn placement.
- Row/hedge mode: same asset repeated at fixed spacing (placement-level feature, not
  per-model).

### Animation opportunities
- **Idle**: gentle wind sway — small-amplitude rotation/skew oscillation of the canopy
  primitive (sin-wave `rotation.z`/`rotation.x`, low amplitude ~2–4°, slow period
  ~3–5 s, desynced phase per instance like existing idle offsets) — matches the
  "breathing"/idle-sway idiom already used elsewhere (torso breathing on humanoids).
- **Weather-reactive**: stronger sway amplitude scaled by `windKmh` during windy/
  lightning-rainy conditions, reusing the wind-bearing/intensity plumbing already
  driving cloud/precip drift — a shrub sway multiplier keyed off
  `WeatherFxState.windKmh` is a natural, low-cost addition.
- **Rain/snow accumulation**: could reuse the puddle/frost decal idiom (small snow-cap
  sprite or darker "wet" tint overlay on canopy) during active precip/frost states —
  optional stretch, not required for v1.
- No click/toggle interaction expected (non-entity-bound prop), though it could still
  be raycast-clickable to open an entity-picker if a future feature wants to bind
  irrigation/soil-moisture sensors to a planting bed.

**Sources**: [Boxwood Size Chart: Mature Dimensions by Variety](https://scienceinsights.org/boxwood-size-chart-mature-dimensions-by-variety/),
[Common Boxwood Height and Width Guide](https://greg.app/common-boxwood-size/),
[Common boxwood — The Morton Arboretum](https://mortonarb.org/plant-and-protect/trees-and-plants/common-boxwood/),
[Boxwood (Large) Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/boxwood-large-buxus),
[Boxwood Hedge Guide: Planting & Spacing Tips](https://naturehills.com/blogs/garden-blog/proplanttips-creating-a-formal-boxwood-hedge),
[How Big Does Arborvitae Get?](https://hometosight.com/how-big-does-arborvitae-get/),
[Emerald Green Arborvitae Growth Rate](https://treeservicescharlestonwv.com/emerald-green-arborvitae-growth-rate/),
[Tater Tot Arborvitae Growth: Height vs. Width](https://greg.app/tater-tot-arborvitae-size/),
[What Do Nursery Container Sizes Mean? — Nature Hills](https://naturehills.com/blogs/garden-blog/what-is-the-difference-between-container-sizes),
[Plant Container Size Chart — Conifer Kingdom](https://www.coniferkingdom.com/plant-sizes/),
[Understanding Nursery Stock Sizes — Johnson's Nursery](https://kb.jniplants.com/understanding-nursery-stock-sizes)

---

## 10. Hedge / privacy row

### Typical dimensions
Build as a repeatable linear segment (e.g. 1000 mm) and array along a wall/property
line.

| Variant | Height | Width (depth) | Notes |
|---|---|---|---|
| Low/border hedge (dwarf boxwood) | 300–900 mm | 400–600 mm | edging, not privacy |
| Standard privacy hedge (privet, boxwood, laurel) | 1200–1800 mm | 400–600 mm | classic clipped formal hedge |
| Tall privacy screen (arborvitae, tall laurel) | 1800–3000 mm (commonly ~2400 mm) | 600–1000 mm | full sightline block |
| Oversized/mature screen | 3000–4500 mm | 900–1200 mm | large arborvitae/leyland cypress rows |

Formal clipped hedges are almost always **tapered narrower at top than base**
(frustum, not a straight box) — good light penetration, real horticultural practice.
Individual shrub spacing when unclipped/informal: 300–900 mm on-center depending on
species/size; for the "already grown into a solid wall" look, model it as one
continuous run, not discrete bushes.

### Shape breakdown
Per 1000 mm run segment, arrayed/tiled along a path.

- **Core mass**: one elongated `box`, slightly tapered — approximate with two stacked
  boxes (wider bottom + narrower top), or a single box scaled non-uniformly top vs
  bottom if the tool supports a truncated-pyramid primitive; two boxes is simplest and
  reads fine at this stylization level.
- **Top texture**: a shallow `cylinder` (long axis horizontal, laid along the row) or
  a thin flattened `box` cap can suggest a rounded/flat-clipped top profile instead of
  a hard box edge.
- **Foliage clumping** (optional detail pass): scatter 3–6 small `sphere`s along the
  top and front face, slightly randomized in radius/offset, to break the flat box
  silhouette into a "leafy" read — the single highest-value detail for selling "hedge"
  vs "green wall."
- No front/back distinction — hedges are symmetric in cross-section; local +Z still
  applies for placement/rotation but there's no functional "front."
- No moving/openable parts. For a corner or gate opening, simply omit segments — no
  separate primitive needed.

### Colors & finishes
- Deep matte green base (`#3f6b3a`–`#4f7a3f` range) for most evergreen species
  (boxwood, privet, arborvitae).
- Slightly darker green undertone at the base/interior, lighter yellow-green highlight
  spheres on top/front (new-growth flush + sun-facing leaves) — two-tone works well in
  Diorama's toon-shaded material system.
- Seasonal alt: deciduous hedge species (beech, hornbeam) can offer an **autumn
  variant** (russet/tan `#a0703a`) that holds dead leaves through winter — nice
  seasonal option.
- No manufactured material/texture — pure stylized foliage color, matte, no specular.

### Placement
- **Outdoor only** — rests on the ground/yard (existing `groundAreas`/outdoor
  furniture cat, alongside `tree`/`bush`/`pine_tree`), never floor-mounted (indoor),
  wall-mounted, or ceiling-hung.
- Typically along **property boundaries, yard edges, or as room dividers within a
  yard/garden layout** — runs in straight or gently curved lines, sometimes with a gap
  for a gate/path opening.
- Base sits at y = 0 (grade); no elevation offset needed (matches `bush`/`tree`
  precedent).

### Active / interactive state
- No powered/HA-bound state in the real world — a pure decorative/ambient outdoor
  object, same class as `tree`/`bush`/`flower_bed` (no `activity`, no bound entity
  expected).
- Only "state" worth surfacing is **seasonal** (if a season/weather-linked palette swap
  is ever added): summer full green → autumn variant color swap for deciduous types —
  could tie into the existing weather/time-of-day system for a subtle seasonal tint,
  purely cosmetic.

### Variations & customizations
- **Height tier**: low border / standard privacy / tall screen / oversized (table
  above) — expose as a height slider like other outdoor pieces.
- **Species look**: evergreen dense (boxwood/privet — tight small-leaf spheres, deep
  green) vs. needle screen (arborvitae/cypress — more conical/columnar texture,
  slightly blue-green) vs. deciduous (looser clumping, seasonal color).
- **Trim style**: flat-top formal vs. rounded-top informal (changes the cap primitive
  from a flattened box to a half-cylinder/dome of spheres).
- **Run length**: since it's a linear/tileable object, expose as a draggable-length run
  (like a wall) rather than a fixed-footprint furniture piece — width/height fixed per
  style, length user-drawn.

### Animation opportunities
- **Idle**: very subtle wind sway — small rotational jitter (a few degrees) on the top
  foliage spheres driven by the same wind/weather system already used for tree/
  particle effects, offset per-segment so a long row doesn't sway in perfect unison.
- **Idle**: gentle rustle/shimmer via tiny per-sphere scale pulsing (very low
  amplitude) to suggest leaf flutter without new geometry.
- **Weather-reactive**: heavier sway/bend during the existing wind/storm weather
  effects (reuse the wind bearing + intensity already wired for clouds/particles);
  frost/snow could dust the top spheres white in cold weather using the existing frost
  hook.
- **Seasonal**: color-lerp the foliage spheres between summer green and autumn russet
  for deciduous variants tied to time-of-day/season if that ever gets added — no
  interaction required, purely ambient/time-driven.
- No click/interactive animation expected — this is scenery, not a fixture.

---

## 11. Flower bed and annual/perennial border

### Typical dimensions
Footprint sits flush on the ground/yard plane, no meaningful "height" beyond mounded
soil + plant growth.

| Variant | Width × Depth (mm) | Soil/edging height (mm) | Plant height above soil (mm) |
|---|---|---|---|
| Narrow foundation bed (against house/fence) | 600–900 × 300–900 | 100–150 (flush or low edging) | 150–600 |
| Standard island/border bed | 1200–1800 × 900–1800 | 100–200 | 200–900 |
| Deep perennial border | 2400–3000 × 900–1800 (depth scales ~1 ft per 3 ft of length) | 100–200 | 300–1200 (layered: front low, back tall) |
| Raised flower bed (framed) | 1219 × 1219 or 1219 × 2438 (common 4×4 / 4×8 ft) | 254–610 (framed wall height) | 200–900 |

Real-world guidance: unframed borders run 2–10 ft deep depending on access
(single-side access ≤3 ft; both-side access up to ~4 ft reach each way); raised/framed
beds are commonly 4×4, 4×8, or 2×8 ft with wall heights 10–24 in. For Diorama's
`outdoor` category, treat this as a **ground-hugging polygon/patch** kind, not a boxy
furniture kind — closer to the existing `Floor.groundAreas` paint mechanic than a
discrete prop, OR a rectangular `flower_bed` `FurnitureKind` for simpler discrete
placement (footprint w×d, near-zero elevation).

### Shape breakdown
Front = local −Z, the side that "faces" the walkway/lawn where low plants go.

- **Base bed**: one flat `box` (w × d × ~80–120 mm) sunk slightly into/level with the
  ground plane — the mulch/soil slab. Color = dark mulch brown or dark soil.
- **Edging** (optional, common on framed/raised beds): 4 thin `box` strips around the
  perimeter, 100–150 mm tall × 40–60 mm thick — timber, brick, or plastic scalloped
  edging. Skip for a soft, unedged cottage-garden border.
- **Plant clusters** — the visually load-bearing part. Compose as a scattered
  arrangement of low-poly plant primitives sitting on top of the soil slab, arranged in
  a gradient by row (front→back = short→tall, matching real design convention):
  - **Low mounding plants** (front row, ~150–300 mm): squashed `sphere`s (scale.y ≈
    0.5–0.7) in clusters of 3–5, bright saturated colors (annual bedding: red/white/
    pink/yellow/purple).
  - **Mid-height perennials** (~300–600 mm): a `cylinder` (thin stem, green) topped by
    a small `sphere`/flattened-`cone` color cluster — simple "lollipop" silhouette
    repeated 4–8× with slight position/scale jitter for a natural, non-grid look.
  - **Tall spikes/accents** (back row, ~600–1200 mm): thin tapered `cylinder`/`cone`
    spires (delphinium/foxglove-style), or a cluster of thin cones for ornamental
    grass plumes.
  - **Foliage mounds** (fill/texture, no bloom): irregular flattened `sphere`s in
    medium/dark green scattered among the color clusters, to avoid an all-flower
    "candy" look.
- Randomize per-instance scale (±20%), rotation (Y), and slight color hue variance so
  repeated clusters don't look copy-pasted (deterministic seeded jitter, not
  `Math.random()` per frame, so it doesn't shimmer).
- No moving/openable parts — static-geometry landscape piece.

### Colors & finishes
- Soil/mulch base: dark brown `#3b2a1a`–`#5a4530`, or dyed mulch red/black variants.
- Edging: weathered timber brown, brick red, or grey/black plastic/metal.
- Bloom colors: saturated primaries + pastels — red, pink, white, yellow, orange,
  purple/violet, blue (matches Diorama's Sims-toon saturation push via `_simsColor`,
  keep hues punchy rather than photoreal-muted).
- Foliage: 2–3 green tones (mid green, dark green, silvery-green for foliage plants
  like lamb's ear) to add texture without extra geometry complexity.
- Seasonal palette swap opportunity: spring (pastel/bulb colors: tulip pink/yellow),
  summer (full saturated bloom), fall (mums — orange/rust/burgundy), winter (bare
  stems/evergreen only, blooms hidden).

### Placement
- **Outdoor, on the ground/yard plane** — y ≈ 0–4 mm like Diorama's `groundAreas`
  (paint layer) or a near-zero elevation for a discrete `FurnitureKind`. Typical real
  placement: foundation beds hugging house walls, borders along fence lines or
  walkways, or free-standing island beds in a lawn. Never indoors, never wall/ceiling-
  mounted. No standard mounting height — it IS the ground treatment.

### Active / interactive state
- Not HA-entity-drivable in any direct sense — decorative-only, like `tree`/`bush`/
  `flower_bed` already noted in the yard arc — no bound-entity glow/state needed.
- Optional indirect bindings for interest: a bound irrigation/valve `switch` or
  soil-moisture `sensor` (if the user has smart garden hardware) could drive a subtle
  "just watered" sheen (darker soil slab + tiny sparkle/mist particles) or a wilted
  look (foliage droop/desaturation) when moisture is low — analogous to the existing
  power-glow/appliance-in-use pattern, entirely optional.
- Seasonal variation could be driven by `time-of-day.ts`/date (month) rather than an
  entity — swap bloom palette or hide blooms in winter — same spirit as the weather
  system's condition-driven visuals but keyed off calendar month.

### Variations & customizations
- **Style preset**: cottage/informal (dense, mixed heights, soft edging) vs. formal
  (uniform rows, crisp edging, single-color blocks) vs. xeriscape/rock-garden (rock
  clusters + ornamental grass cones, muted palette).
- **Size**: small foundation strip / medium border / large island bed.
- **Edging material**: none / timber / brick / metal.
- **Bloom color scheme**: single-hue, complementary pair, or full rainbow mix — a
  simple palette picker analogous to `Light`/`MotionSensor` color fields.
- **Season**: spring/summer/fall/dormant-winter, swapping the bloom-cluster color set
  and density.
- **Raised vs. ground-level**: taller edging + soil-slab elevation for the "framed
  raised bed" look.

### Animation opportunities
- **Idle**: gentle wind sway on stems/tall spikes — small per-cluster sinusoidal
  rotation, phase-offset per cluster so the whole bed doesn't sway in lockstep;
  occasional firefly/butterfly/bee sprite drifting above blooms in daytime (cheap
  `Sprite`, same idiom as weather particles).
- **Active/seasonal**: bloom density or color-saturation ramps up through
  spring→summer, fades/browns in fall, blooms hidden (stems only, or snow-dusted
  mounds) in winter — driven by calendar month, re-triggering a `_keyFloor`-style
  dirty rebuild rather than per-frame work.
- **Weather reactivity**: droop/flatten slightly during `rainy`/`pouring` (lower the
  bloom-cluster y-scale), sparkle/glisten right after rain via the existing
  puddle-fade idiom (a few droplet highlights, not full puddles), and light dust/
  pollen drift on `windy` conditions reusing the existing wind-bearing vector.
- **Interaction highlight**: on hover/select in edit mode, a soft outline or a brief
  "growth pulse" (scale bounce) on the whole cluster group to confirm selection.

---

## 12. Vegetable garden bed and raised planter box

### Typical dimensions
Ground-level raised bed, box-frame construction.

| Variant | Width × Length × Height (mm) | Notes |
|---|---|---|
| Compact / herb bed | 610 × 1220 × 280 mm (2×4 ft × 11 in) | 2 standard 2×6 boards stacked = 11 in, most popular height |
| Standard backyard bed | 1220 × 2440 × 280 mm (4×8 ft × 11 in) | The classic size; 8 ft = standard lumber length, minimal cutting |
| Deep-root / oversized bed | 1220 × 2440 × 420–460 mm (16.5 in) | For root veggies (carrots, potatoes) |
| Wall/fence-backed bed | 760 × 1830 × 280 mm (2.5×6 ft) | Narrower (only reachable from 3 sides) |
| **Elevated planter box (on legs)** | 1220 × 610 × 810–840 mm overall (48×24×32 in) | Waist-height galvanized-steel type; soil basin ~200 mm deep sits atop ~600 mm legs |

Rule of thumb: never make an all-sides-accessible bed wider than ~1200 mm (4 ft) or a
deeper-reach-only bed wider than ~760 mm (2.5 ft) — arm's-reach to center is the real
design constraint, useful for auto-scaling variants.

### Shape breakdown
Origin at bed center on the floor, +Z = front/long viewing side.

- **Frame**: 4 boxes forming a rectangular ring (or for elevated: a shallow open-top
  box "basin") — front/back walls (`W × wallT(≈40) × H`) and two side walls
  (`wallT × D × H`) sitting on the ground plane, y-centered at `H/2`.
- **Corner posts** (optional, board-and-batten/cedar-kit look): 4 small boxes
  (`60×60×H`) at the corners, proud of the wall faces by ~10 mm.
- **Soil fill**: one box inset ~15 mm from the top inner rim,
  `(W−2·wallT) × (D−2·wallT) × soilDepth(≈60–100 mm)`, dark-brown, top slightly below
  the rim (leaves room for mulch/plant sprites).
- **Plants**: scattered low-poly clusters on the soil surface — small clumps of leafy
  spheres, tall stem-cylinder + sphere-cluster foliage for tomato/corn, or a thin
  vertical lattice of 2–3 crossed cylinders for trellis crops. 6–12 instances randomly
  jittered across the soil box in a grid-with-noise pattern reads as "rows."
- **Elevated variant**: add 4 leg cylinders/boxes (`40×40×legH≈600 mm`) under the
  corners, X-braced with 2 thin diagonal boxes per side for the metal-frame look;
  basin is shallower (~200 mm) since it's a planter, not a deep raised bed.
- No moving parts — static structure; all animation is in contents/dressing. Front
  face (+Z) is arbitrary/symmetric — no `frontArrow` needed, though a small
  identifying label/marker sprite could face +Z.

### Colors & finishes
- **Wood (most common)**: natural cedar/pine — warm honey-tan (`#C69B6D`–`#A9784F`),
  weathering to silvery-gray (`#9C9186`) over time; corrugated-galvanized-metal variant
  is bright zinc silver (`#C8CDD0`) with visible horizontal corrugation ridges; some
  kits are painted (matte black, hunter green, barn red).
- **Composite/plastic**: solid earth tones — terracotta, charcoal, driftwood-gray.
- **Soil**: dark chocolate-brown (`#3B2A1E`) to near-black when wet; subtle lighter-
  brown mulch/straw layer option (`#8B6F47`).
- **Plants**: saturated garden greens (`#4C8C3B` foliage) with occasional pops —
  tomato red, pepper yellow/orange, purple eggplant — good candidates for the toon-
  shaded "Sims" push-saturation look.

### Placement
- **Outdoor only** — new `outdoor`-cat kind, rests directly on the ground/yard (like
  `flower_bed`/`bush`), y=0 base. The elevated leg variant is still floor-resting (legs
  touch grade) but reads visually "counter height" (~810 mm working surface) — not
  wall-mounted, not ceiling-hung. Typically placed on lawn/mulch/gravel ground-area
  kinds, often in rows near a fence or in a dedicated "garden" zone.

### Active / interactive state
- No HA entity binding expected in v1 (landscaping dressing, not a device) — but rich
  seasonal/idle potential:
  - **Growth stage** could cycle (seedling → leafy → fruiting) tied to a slow timer or
    a bound `sensor.*` (soil moisture) for flavor — not required for v1.
  - **Watering**: a bound `switch`/`valve` (drip irrigation) turning on could trigger a
    brief mist/sparkle particle burst over the soil, mirroring the fountain/sprinkler
    idiom.
  - **Wilted vs. healthy**: could dim foliage saturation/droop the cone-foliage scale
    if a bound moisture sensor reads low — same "warn/danger" color-escalation pattern
    used for `ENV_KINDS`.

### Variations & customizations
- Bed material: wood-plank / corrugated-metal / composite / cinderblock (stacked gray
  boxes, no frame — a distinct cheap-DIY look).
- Height tier: short (280 mm), deep (450 mm), elevated-on-legs (810 mm).
- Footprint: single 2×4 ft, standard 4×8 ft, square 4×4 ft, long skinny wall-bed
  2.5×6 ft.
- Crop dressing preset: "tomatoes & trellises" (tall stem+cage look), "leafy rows"
  (low bushy spheres, lettuce/kale), "herb mix" (short varied clumps), "empty/tilled
  soil" (bare, off-season).
- Corner-post trim on/off (plain slab vs. cedar-kit post-and-board look).

### Animation opportunities
- **Idle**: gentle foliage sway (small per-plant sinusoidal rotation/scale wobble,
  offset-desynced like the existing idle-fidget/breathing idioms) as if in a breeze;
  occasional leaf-shimmer via a subtle emissive/color flicker.
- **Active**: watering burst (mist particles + soil-color darken pulse) when a bound
  irrigation entity is on; a harvesting avatar interaction — a person dwelling at the
  bed could trigger a `tend_plant`-style anchor activity (already referenced in the
  codebase's idle-fidget anchor list) with a stoop/reach animation and an occasional
  small "pick vegetable" one-shot.
- **Seasonal**: swappable foliage-density/color sprite sets (lush green summer →
  orange/brown wilting fall → bare soil winter) driven by a slow date-based or manual
  toggle, reusing the ground-texture/procedural-texture caching pattern already used
  for floor/ground materials.

---

## 13. Lawn / turf grass

### Typical dimensions
A ground-covering material, not a discrete object — "size" means patch footprint +
blade/pile height rather than a bounding box.

| Variant | Blade/pile height | Notes |
|---|---|---|
| Freshly mowed (cool-season: fescue, bluegrass) | 65–100 mm (2.5–4 in) | Raised to 75–100 mm in summer heat |
| Freshly mowed (warm-season: bermuda, zoysia) | 25–50 mm (1–2 in) | Cut shorter, denser blade |
| Overgrown / unmowed meadow-style | 150–300 mm | Stylized "wild yard" option |
| Artificial turf (residential) | 20–40 mm pile (common), up to 63 mm for lush landscaping look | Uniform, no growth variance |

Patch footprint is arbitrary — sized to the yard polygon (Diorama's existing
`groundAreas` polygon-paint system), not a fixed prop dimension.

### Shape breakdown
Not a primitive-composite prop like furniture — a **ground plane treatment**.

- Base: a flat polygon patch (matches Diorama's existing `ShapeGeometry` ground-area
  pattern) at y≈4–8 mm, textured rather than geometric.
- For a *stylized 3D "thickness"* pass (optional upgrade over a flat texture): a thin
  extruded slab 5–10 mm tall (box/shape-extrude) so the lawn reads as a material layer
  above bare dirt at yard edges/borders.
- Optional low-poly "blade tuft" instancing for close-up/hero yards: small flattened
  cone or thin box billboards (8–15 mm wide × 60–120 mm tall) scattered in a jittered
  grid — a Sims-era stylization trick, not realistic geometry. Skip for the common
  case; procedural canvas texture (as already used for `groundTexture` kinds) is the
  right default, matching the existing `rock/concrete/blacktop/mulch/sand` treatment.
- No front face/moving parts — non-directional ground cover.
- Edge transition: a soft 50–100 mm blended or hard-cut border where lawn meets patio/
  driveway/mulch bed.

### Colors & finishes
- Healthy green: mid saturated green, roughly `#5a9c3f`–`#7cb84f` (brighter, cartoon-
  saturated for Sims-style toon shading vs. muddy real-grass olive).
- Seasonal/stress variants: drought/dormant tan-brown (`#c2a55a`), winter frost-dusted
  pale green-white, early-spring vivid yellow-green.
- Mowed grass shows **linear stripe banding** (alternating light/dark bands from mower
  direction) — a nice cheap procedural-texture detail.
- Artificial turf: flatter, more uniform saturated green, sometimes with a visible
  thatch/brown fleck texture and a subtle diamond tuft pattern.
- Texture: procedural canvas texture (noise + optional stripe pattern) is the
  practical approach, matching how `floorTex`/`groundTexture` already fakes wood/tile/
  concrete in this codebase.

### Placement
- **Floor** (ground-plane only) — the outdoor/yard ground area, never indoor. Rests at
  y≈0–8 mm (same z-order as existing `groundAreas` patches — `grass` already exists as
  a shipped `GroundKind`, so this is really about visual upgrade/detailing of that
  existing kind, not a new placement type). No wall-mount, no ceiling, no counter
  variant.

### Active / interactive state
- Not "powered on/off" — state changes are **seasonal/weather-driven**, not
  user-toggled:
  - Dry/hot weather (or a configured irrigation-off state) → shift base color toward
    tan/brown (droop).
  - Rainy/wet weather → slightly darker, glossier tint (wet-look bump, or just a
    saturation bump given the toon material has no real specular).
  - Snow cover (winter/cold weather condition) → white overlay decal or swap to a snow
    ground texture, consistent with how frost/puddle decals already ride the weather
    system.
  - Freshly-mowed vs. overgrown could be a manual per-area toggle/property (like
    `Furniture.doorOpen`) rather than automatic.
- Sprinkler/irrigation integration (if a `switch`/`valve` entity is bound): active
  watering could show an animated spray-arc particle effect (reusing the weather
  system's Points-based particle idiom) plus a temporary "wet, darker" tint.
- Footprint/wear-path decals are a nice-to-have but likely out of scope (needs
  occupancy tracking on the ground area, which doesn't currently exist for yards).

### Variations & customizations
- Cut length: **mowed / long / overgrown-meadow** (affects texture/height cue).
- Grass type look: **cool-season lush green** vs. **warm-season fine-bladed** vs.
  **artificial turf** (uniform, diamond-tuft texture, brighter saturation, no seasonal
  dieback).
- Stripe pattern toggle (mower-stripe banding) on/off.
- Seasonal auto-tint on/off (ties into the existing weather-driven material system).
- Border style: hard edge vs. soft-blend edge against adjacent ground kinds.

### Animation opportunities
- **Idle**: a very subtle wind-sway shader/vertex-wobble on any blade-tuft instances
  (if the instanced-tuft upgrade is built) — cheap sine-based vertex displacement
  scaled by the existing wind-bearing/intensity already computed for weather effects.
- **Idle**: mower-stripe texture shift could very slowly "regrow" (stripes fade over
  in-game days) if a lawn-care mechanic is ever wanted — likely overkill for v1.
- **Active**: sprinkler spray arcs (particle burst, reusing the `PointsMaterial` precip
  idiom) while an irrigation entity is on.
- **Active**: rain-wet darkening/puddle formation at low spots, already covered by the
  shared weather-puddle-decal system — grass areas could opt in the same way hard
  ground does.
- **Seasonal**: color-cycle between green (spring/summer) → tan (drought/fall) →
  white-dusted (snow) driven by `Planner.weatherNow`/season, same mechanism as the
  existing frost/dim lighting weather hooks — no new dirty-key plumbing needed if it
  rides the existing ground-texture cache invalidation.
- Avatar interaction: humanoid footstep dust/grass-blade puffs when a rig walks across
  a grass ground area at speed — cosmetic-only one-shot particle, not required for v1.

**Sources**: [Grass Cutting Height Chart — TruGreen](https://www.trugreen.com/lawn-care-101/blog/lawn-care-tips/mowing-heights-season-and-grass-type),
[Recommended Lawn Mowing Heights By Season — Davey Tree](https://blog.davey.com/recommended-lawn-mowing-heights-by-season-spring-summer-fall/),
[Grass Mowing Height Chart — GreenPal](https://www.yourgreenpal.com/blog/grass-mowing-height-chart-how-high-to-cut),
[The Ultimate Artificial Turf Pile Height Guide — Integriturf](https://www.integriturf.com/glossary/the-ultimate-artificial-turf-pile-height-guide/),
[Artificial Turf Pile Height and Density — Elite Turf Supply](https://www.eliteturfsupply.com/blogs/how-to-choose-the-right-turf-pile-height-and-density-for-your-landscape-project),
[Best Pile Height Thicknesses for Artificial Turf Grass — Greatmats](https://www.greatmats.com/best-pile-height-thickness-for-artificial-turf-grass.php)

---

## 14. Mulch bed and ground cover

### Typical dimensions
A garden bed as a landscaping "fixture," not a single object.

- Bed footprint (freeform, but for a primitive-based tile): compact accent ring
  600–900 mm diameter; standard foundation bed strip 900–1500 mm deep along a wall ×
  arbitrary length (typically 1800–3600 mm run); island bed 1800–3000 mm × 1200–
  1800 mm.
- Mulch layer thickness: 50–75 mm (2–3 in) standard depth for established beds;
  100–125 mm (4–5 in) for a freshly-installed bed — thin enough to read as a texture/
  color change rather than a raised slab.
- Edging (optional lip): plastic/steel edging strip ~100 mm tall × 6–10 mm thick, or
  stacked stone edging units ~200 mm × 100 mm × 100 mm each, laid end to end around the
  bed perimeter.
- Ground-cover plant units scattered across the mulch, sized per species (small
  repeated primitives):
  - Creeping thyme/low moss mat: 50–75 mm tall, spreads as a flat mat.
  - Vinca minor (periwinkle)/mondo grass tuft: 100–150 mm tall clump, ~150–200 mm
    spread.
  - Hosta clump (larger accent groundcover): 250–400 mm tall × 400–600 mm spread.
  - Ornamental grass tuft: 300–600 mm tall × 300 mm spread.

### Shape breakdown
- Base bed shape: a flat, irregular-edged patch — approximate with a shallow
  flattened cylinder or a low box with slightly rounded/chamfered top edge (scale Y
  down to ~40–60 mm) sitting directly on/recessed into the ground plane; a mulch bed
  has no "front" — it's a top-down ground treatment, viewed from above like a rug/
  ground-area patch.
- Edging ring (optional): thin torus-like ring approximated as a chain of short boxes
  (or a single extruded ring) tracing the bed's polygon boundary, ~100 mm tall.
- Ground-cover plants (scattered instances, 5–15 per bed at randomized positions/
  rotations/scale jitter for a natural look):
  - Low mat groundcover: flattened sphere or squashed hemisphere ~50–75 mm tall,
    150–250 mm diameter, mottled green.
  - Tuft/clump groundcover (mondo grass, ornamental grass): cluster of 3–6 thin cones
    or thin cylinders splayed outward from a shared base point, 100–500 mm tall
    depending on species.
  - Hosta clump: a squashed sphere (broad leaf mound) 250–350 mm tall × 500 mm spread,
    optionally topped with 2–3 small cone/cylinder flower spikes in summer.
  - Small shrub/accent (if included in the bed): sphere-on-short-cylinder ball shape,
    400–900 mm tall.
- No moving/openable parts — a static ground fixture, same category as the existing
  `groundAreas` polygon-paint feature (grass/rock/mulch could be one more
  `GroundKind`), with the ground-cover plant scatter as the added 3D dressing on top.

### Colors & finishes
- Mulch color/material: dark brown/black (dyed shredded hardwood or rubber mulch —
  most popular), natural reddish-brown (cedar), golden-tan (pine straw/pine bark
  nuggets), grey-brown (undyed wood chips). Texture: matte, fibrous/chunky procedural
  texture (similar treatment to the existing procedural ground textures — mulch would
  sit alongside grass/rock/concrete/blacktop/sand as a `GroundKind`).
- Edging: black or green plastic, weathered grey/tan natural stone, or dark charcoal
  steel.
- Ground-cover foliage: variegated greens (deep green, chartreuse, silver-green for
  vinca/lamium), plus seasonal accent colors — hosta flower spikes lavender/white,
  thyme blooms pink-purple, mondo grass near-black-green variety.

### Placement
- **Floor/ground only** — outdoor yard areas (foundation beds along house walls,
  standalone island beds in the lawn, borders along walkways/fences). Sits flush with
  or very slightly proud of the surrounding ground plane (mulch layer ~50–125 mm
  raised at most; edging ~100 mm). No wall/counter/ceiling variant. Fits the existing
  "yard arc" `outdoor` category alongside trees, bushes, flower beds — essentially the
  ground-treatment companion to the existing `flower_bed` outdoor kind, or an
  extension of `Floor.groundAreas` with a new `mulch` `GroundKind`.

### Active / interactive state
- Not device-bound — no HA entity naturally maps to a mulch bed. Purely decorative/
  seasonal:
  - Seasonal color shift: fresh mulch color right after a (simulated) refresh vs.
    faded/greyed mulch color over "time" if the app ever models seasons/age.
  - Could optionally tie to a soil-moisture or irrigation `sensor.*`/`switch.*` (a
    garden zone valve) for a "just watered" darker/wetter mulch tint pulse — analogous
    to the existing puddle-decal idiom used for rain/leaks.
  - Ground cover could get a subtle idle sway to avoid a static, dead yard.

### Variations & customizations
- Mulch type: dyed brown / dyed black / red cedar / pine straw / rubber mulch / rock
  mulch (gravel — crosses over with the existing `rock` `GroundKind`) — expose as a
  color/texture picker on the ground-area fixture.
- Bed shape: freeform polygon (already how `groundAreas` works) vs. a simple
  rectangle/ring preset for quick placement.
- Edging: none / plastic strip / stone units / steel strip — toggle + material picker.
- Ground-cover density/species mix: sparse accent planting vs. dense full-coverage
  groundcover; a simple "species" dropdown (thyme mat / vinca / mondo grass / hosta
  clumps / mixed) driving which scatter primitive set gets instanced.
- Size variants: small accent ring, standard foundation strip, large island bed.

### Animation opportunities
- **Idle**: gentle wind sway on taller ground-cover tufts/grass blades (slight
  Z-rotation oscillation, phase-offset per instance so the bed doesn't move in unison)
  and cast blob-shadow-style soft occlusion under denser clumps.
- **Seasonal/active**: subtle darkening/glisten shader pass right after "rain" (tie
  into the existing weather system's puddle/wet-ground idiom — mulch could darken like
  the existing wet-puddle decals rather than pool water); a light steam/mist wisp
  shortly after simulated irrigation.
- **Optional pollinator detail** (low priority, high charm): tiny occasional firefly/
  butterfly-particle flicker over a flowering hosta/thyme bed at dusk, reusing the
  existing particle/sprite billboard machinery (same family as the weather particle
  system) rather than adding new geometry.

---

## 15. Ornamental grass

### Typical dimensions
Planted clump, in-ground or large planter; W×D roughly equal (radially symmetric).

| Variant | Width/Depth | Height (foliage) | Height (w/ plume) |
|---|---|---|---|
| Compact/dwarf (Hameln fountain grass, dwarf Miscanthus) | 300–600 mm | 300–450 mm | 450–600 mm |
| Standard clump (purple fountain grass, 'Bandwidth' maiden grass) | 450–750 mm | 600–900 mm | 750–1100 mm |
| Large/tall (Miscanthus 'Gracillimus', standard maiden grass) | 900–1800 mm | 1500–2100 mm | 1800–2400 mm |
| Pampas grass (oversized specimen) | 1800–2500 mm | 1500–1800 mm | 2500–3000 mm (plumes) |
| Potted/indoor decorative tuft | 250–400 mm (incl. pot) | 300–500 mm | — |

Container rule of thumb: pot diameter ≈ ¾ of the clump's mature spread (e.g. a 400 mm
pot for a 500 mm-wide grass).

### Shape breakdown
No fixed "front" — radially symmetric, but give it one for consistent LOD/billboard
placement.

- **Base clump**: a squat, wide `cylinder` (or slightly tapered cone, narrow at
  bottom) representing the root/crown mass at grade — radius ≈ 40% of mature spread,
  height 60–100 mm. Skip entirely for in-ground plantings (hide under a ground decal);
  keep for potted versions.
- **Foliage mass**: the primary visual read. Best approximated as 3–5 overlapping
  `cone` primitives (tip up, apex slightly off-vertical to fake arching) clustered
  around the base center, each rotated a different yaw and tilted 8–20° outward —
  cheaply reads as a "fountain" burst without blade geometry. Alternative cheap
  version: one wide, squashed `sphere` (scaled flat on Y, tall on X/Z) with a noisy/
  rough vertex-color to suggest blade texture, for distant/small instances.
- **Seed plumes** (fountain grass, pampas, maiden grass in bloom): 6–15 thin, slightly
  curved `cylinder`s (or capsule primitives) angled outward and upward from the clump
  top at 60–80° from horizontal, each capped with a small elongated `sphere` or
  flattened cone (the plume head) tinted a contrasting cream/tan/pink. The single most
  recognizable feature and worth the extra primitives even on a low-poly model.
- **Pot** (potted variant): truncated `cone` (wider top than bottom) or straight
  `cylinder`, 250–400 mm dia, 250–350 mm tall, sitting flush on the floor; foliage
  clump origin sits at the pot's rim.
- No moving/openable parts (it's a plant) — "front" convention: orient the plume lean
  and any painted/textured blade-fan asymmetry toward local −Z to match the codebase's
  furniture-front convention, purely for consistent placement/rotation gizmos.

### Colors & finishes
- Foliage: matte mid-to-dark green (spring/summer) — common hexes in the
  `#4a7c3f`–`#6b8f4e` range; blue-green/glaucous cultivars (blue fescue-style)
  `#7a9e8e`; variegated types add cream/white longitudinal stripes.
- Fall/dormant foliage: shifts to gold/tan/beige (`#c9a86a`–`#d4b483`) or burgundy/
  copper for purple fountain grass (`#5c3a4a`–`#7a4a5c`) — a nice seasonal-swap
  opportunity.
- Plumes: cream/ivory (`#ede4d0`), tan/wheat, or pink-blush (pampas/purple fountain
  grass, `#d9a8b0`).
- Pot (if used): terracotta `#b56a4a`, glazed charcoal/black, or off-white ceramic —
  matte or semi-gloss.
- No shine/metal/plastic-look finishes — everything reads as matte organic material;
  toon-shader banding works well on the cone-cluster foliage to fake blade-clump
  shading.

### Placement
- Outdoor/yard use only in Diorama's current model — fits the existing `outdoor`
  furniture category alongside `tree`/`bush`/`flower_bed` (`Floor.groundAreas`
  grass-kind areas are a separate flat paint feature; this is the standalone planted/
  potted object). Typical spots: foundation border plantings, along walkways,
  softening fence lines, poolside, as a privacy screen when tall.
- Rests on the **floor** (ground plane), y = 0 for in-ground; potted version's clump
  origin sits at pot-rim height (≈ pot height, 250–350 mm) with the pot resting on the
  floor.
- Not wall-mounted, not ceiling-hung, not built-in. An indoor potted decorative tuft
  (small ornamental grass in a planter) could plausibly sit on a counter/console table
  as a `mountable` surface piece, similar to the existing `plant` kind.

### Active / interactive state
- No powered/electrical state — passive greenery like the existing `tree`/`bush`/
  `flower_bed` kinds, no bound-entity semantics needed.
- Seasonal variation is the main "state" worth surfacing: swap foliage/plume tint by
  time-of-year (green → gold/tan → dormant beige), mirroring how `time-of-day.ts`
  already resolves buckets — a simple month-based or manual seasonal toggle would do.
- Could optionally react to weather (Feature W): sway harder/bend during `windy`/
  `lightning-rainy` conditions using the existing `windKmh`/`windBearingPlanRad` the
  weather-effects system already threads through three-view.

### Variations & customizations
- Size tier: dwarf / standard / tall-screen / pampas-oversized (per dimension table
  above).
- Color/cultivar: green, blue-green (glaucous), variegated (cream-striped), purple/
  burgundy (purple fountain grass), golden.
- Plume presence: bloom (plumes shown) vs. pre-bloom/cut-back (foliage only, common in
  early spring after seasonal cutback).
- Container vs. in-ground planting.
- Clump shape: upright-narrow (Miscanthus-tall) vs. broad-mounding (fountain-grass-
  round).

### Animation opportunities
- **Idle**: continuous gentle sway — a low-amplitude sinusoidal bend applied per-cone/
  per-plume (phase-offset per blade cluster so it doesn't look like one rigid unit),
  the cheapest "alive" signal for a plant asset; plumes nod slightly more than the
  base foliage since they're lighter/higher.
- **Active (wind-driven)**: amplitude and frequency scale with `windKmh` from the
  weather system — calm = barely perceptible drift, `windy` condition = pronounced
  rippling bend all leaning the same direction (matches wind bearing), gusts (the
  existing gust-burst scheduler) could trigger a brief sharper whip-bend.
  - **Seasonal transition**: a slow color-lerp (green → gold → dormant tan) tied to a
    season value, plus optionally hiding the plume cones outside bloom season.
- **Micro-detail**: occasional single-blade "flick" (one cone twitching
  independently) as a cheap ambient-life touch, analogous to the idle-fidget system
  used for humanoids.

---

## 16. Cactus and desert / xeriscape planting

### Typical dimensions
Width × depth × height in mm; W×D = canopy/rosette footprint, not pot.

| Variant | Pot/base Ø | Plant W×D | Height | Notes |
|---|---|---|---|---|
| Small potted cactus (desk/windowsill, e.g. globular *Mammillaria*, 4″ pot) | 100×100 | 90×90 | 100–180 | Indoor houseplant scale |
| Barrel cactus, compact (golden barrel, young, 10–14″ pot) | 250–350 Ø | 250–350 Ø | 250–400 | Nearly spherical, ribbed |
| Barrel cactus, mature accent | 400–600 Ø | 400–600 Ø | 450–900 | Old golden barrels top out ~900×1500 W after decades |
| Prickly pear (Opuntia), clumping pad cactus | 600–900 footprint | 600–1200 W spread | 400–900 | Built from flattened pad segments, 100–450 mm each |
| Agave (americana/century plant), standard landscaping accent | 900–1800 rosette Ø | 900–1800 | 900–1800 | Symmetrical rosette; occasional bloom spike to 4500–9000 (rare — skip unless doing a "flowering" easter egg) |
| Saguaro, young/nursery specimen (common in stylized yards) | 300–450 Ø trunk base | 300–450 | 1500–3000 | Slow-grower; arms only appear at 75–100 yrs real-world, so a "young" no-arms saguaro is the most common buildable size |
| Saguaro, mature statement piece | 450–750 Ø trunk | 1500–3700 spread w/ arms | 3000–9000 | Oversized/optional "wow" variant; up to 1 or 2 raised arms |
| Xeriscape gravel/DG bed patch (ground covering, not a placed object) | tile/polygon area | — | ~75–100 (visual only) | 75–100 mm decorative rock layer over the ground plane |
| Accent boulder (single or 2–3 clustered) | 400–1200 | 400–1200 | 300–900 | Rounded granite/river-rock forms scattered in the bed |

### Shape breakdown
Front = local +Z, though most desert plants are radially symmetric so "front" only
matters for pot label/shadow bias.

- **Barrel cactus**: one squat `sphere` (or barrel-scaled by non-uniform Y) sitting on
  a short `cylinder` base/pot rim. Add 8–13 thin vertical `cylinder` ribs (very thin
  radius, protruding slightly) around the sphere for the classic ribbed silhouette, or
  fake it with vertical UV-stripe texture on the sphere if primitive count matters —
  texture stripes are the pragmatic choice for a stylized low-poly look. A tiny
  yellow/white `sphere` cluster (spines/crown) caps the top.
- **Golden barrel look**: same sphere+ribs, golden-yellow spine texture, slightly more
  flattened (squash sphere Y-scale ~0.85).
- **Saguaro**: one tall tapering `cylinder` trunk (slightly wider at base, narrower at
  crown — two stacked cylinders or a cone-cylinder hybrid), rounded `sphere`-cap top
  (flattened, half-buried in the trunk top for a smooth crown). Arms = 1–2 secondary
  bent "L-shape" cylinder pairs (a vertical cylinder joined to a short
  horizontal-then-vertical cylinder) attached partway up the trunk, each with its own
  rounded cap. Vertical pleats again via texture stripes (ribs) rather than geometry.
- **Prickly pear (Opuntia)**: NOT one blob — built from several flattened, rounded-
  edge oval "pads": approximate each pad as a squashed `sphere` (scaled thin on one
  axis, ~40–60 mm thick) or a thick flattened `box` with soft corners, stacked/offset
  diagonally (2–5 pads per clump, each pad sprouting from the top edge of the one
  below, alternating left/right for the branching look). Small pink/red `sphere` fruit
  ("tunas") can dot pad edges as an optional color accent.
- **Agave / century plant**: a radial rosette — 12–20 elongated `cone`s (or very
  flattened stretched spheres) arranged in a symmetric fan from a shared low center
  point, angled outward and slightly upward, each cone tapering to a sharp point
  (spine tip could get a tiny dark accent dot). No trunk; sits low and wide, almost
  ground-hugging at the base.
- **Yucca** (worth offering alongside agave): similar radial-blade rosette but blades
  are stiffer/straighter and narrower (`cone`s with less taper), and older yuccas add
  a visible woody `cylinder` trunk 300–900 mm before the rosette.
- **Accent boulders**: 1–3 irregular `sphere`s (non-uniform scale, partially sunk into
  the ground plane, low-poly faceted look reads fine stylized) in warm grey/tan/rust
  granite tones, half-buried so no visible "floating rock" gap.
- **Gravel/xeriscape ground bed**: really a ground-covering treatment, not a discrete
  furniture prop — model the way Diorama already does `Floor.groundAreas` (a painted
  polygon patch with a procedural texture), not a primitive stack. A tan/rust speckled
  `GroundKind` ("gravel"/"decomposed granite") sibling to grass/rock/mulch/sand would
  be the natural fit, with cacti/agave/boulders placed as point objects on top of it.
- **Pot**: for the potted/indoor variants, a simple tapered `cylinder` (wider at rim,
  narrower at base) in terracotta orange, with the cactus body sitting proud of the
  rim by roughly its own radius (so it doesn't look sunken).

### Colors & finishes
- Cactus body: blue-green, grey-green, or matte sage green (saguaro, barrel body);
  golden barrels are notably yellow-green with **bright golden-yellow spines** (the
  signature "golden" look — spines/texture color matters more than body color here).
- Spines: white, cream, golden-yellow, or reddish-brown — small light-value dot/stripe
  texture, not geometry.
- Agave/yucca blades: blue-grey (Agave americana's signature powdery glaucous blue),
  grey-green, or variegated with cream margin stripes (popular "variegata" cultivar) —
  a nice free color variant to offer.
- Prickly pear pads: blue-green to grey-green, sometimes purple-tinged at pad edges
  (Opuntia macrocentra "Purple Prickly Pear" — striking purple-plum color option);
  fruit "tunas" magenta/red when present.
- Flowers (optional seasonal accent): cacti/agave bloom yellow, orange, red, magenta,
  or white — small bright `sphere`/disc clusters at crown, a nice toggle-able "in
  bloom" state.
- Pot/planter: terracotta orange (unglazed clay, most common), or matte charcoal/
  white glazed ceramic for a modern xeriscape look.
- Ground bed: tan, rust-red, grey, or warm buff decomposed granite; darker basalt/
  lava-rock black as an alternate finish; boulders in matching warm grey-tan granite
  or reddish sandstone.

### Placement
- **Floor** for outdoor yard placement — the natural home given Diorama's existing
  `outdoor` furniture category (alongside `tree`, `pine_tree`, `bush`, `flower_bed`).
  Sits directly on the ground area/gravel bed, no elevation.
- **Counter-or-surface / floor (potted)** for small indoor accent cacti — a
  100–200 mm pot works equally well as a small tabletop/counter piece (`mountable`,
  like `coffee_maker`) or a floor-standing larger barrel/agave pot in an entryway or
  sunroom.
- Not wall-mounted or ceiling-hung in any common real-world form (living-wall
  succulent panels exist but are rare enough to skip for v1).
- Typical siting: front-yard xeriscape beds, entry paths, poolside desert
  landscaping, window sills/bright indoor corners for potted variants.

### Active / interactive state
- Static, unpowered — no bound-entity state in the HA sense expected. Treat as pure
  decor like `tree`/`bush`, not an appliance.
- The one legitimate "state" is **seasonal/occasional bloom** — a purely cosmetic
  toggle (checkbox like `sharedBedCovers`) that swaps in a small flower-cluster accent
  at the crown/rosette center. Could tie into a future seasonal simulation, but works
  fine as a static user-set option now.
- No moving parts, doors, or lights — functionally closer to `rug`/`plant` than to any
  bound fixture.

### Variations & customizations
- Kind options: `cactus_barrel`, `cactus_saguaro`, `cactus_prickly_pear`, `agave`,
  `yucca` (5 distinct silhouettes covers the recognizable desert-plant vocabulary).
- Size scale: small/potted vs standard vs oversized-accent (a single `scale` slider,
  matching the existing env-sensor `scale` pattern, covers all of these cleanly rather
  than many separate kinds).
- Color variant: standard green / blue-grey / golden-spine / purple-tinged /
  variegated-cream-edge.
- Potted vs in-ground: toggle whether it renders with a terracotta/ceramic pot base or
  planted bare in a gravel bed.
- Bloom toggle: flowering accent on/off.
- Ground treatment: a new `gravel`/`decomposed_granite` `GroundKind` (and optionally
  `lava_rock`) as siblings to the existing grass/rock/concrete/sand ground areas, for
  painting the xeriscape bed itself.
- Accent boulders as a small separate `outdoor` kind (1–3 clustered rocks), placeable
  independently to dress a gravel bed.

### Animation opportunities
- **Idle**: essentially none needed for realism — cacti don't sway (rigid, no foliage
  to animate), which is actually a nice **zero-cost prop** relative to trees/bushes. A
  very subtle idle would be a slow, tiny top-spine glint/sparkle (a faint specular
  pulse) or, if wind response exists, a barely-perceptible sway limited to agave/yucca
  blade tips only (real blades are stiff but not rigid).
- **Active**: bloom-flower toggle could get a quick "pop in" scale/opacity transition
  when the checkbox is flipped, echoing the fireplace/appliance-toggle liveliness
  idiom rather than a hard cut.
- **Environmental tie-in**: could piggyback on the existing weather system for a nice
  cheap win — a light dust/heat-shimmer particle wisp during hot/sunny conditions near
  xeriscape beds (reusing the existing `dust` cloud from the `windy` weather effect
  rather than building a new particle system).
- **Interaction**: no click-to-toggle expected; at most a hover/select outline like
  any other furniture piece. Not a candidate for avatar interaction (no realistic
  "activity" anchors it — nobody sits on or uses a cactus).

---

## 17. Climbing vine and trellis / arbor

### Typical dimensions
Three related placeable sub-types — wall trellis, freestanding obelisk/tuteur, and
arbor/pergola-gate.

| Variant | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Wall trellis panel (compact) | 450–600 mm | 20–40 mm | 900–1200 mm | flat lattice, leans/mounts against wall |
| Wall trellis panel (standard) | 560–700 mm | 20–40 mm | 1800–1900 mm (≈22×75 in) | most common retail size |
| Fan trellis (expandable) | 400–2000 mm (expands) | 15–25 mm | 300–1200 mm | accordion lattice, common for small vines |
| Obelisk / tuteur (freestanding cone) | 400–600 mm base Ø | same as width (square/round plan) | 1500–2100 mm | tapers to a point or finial |
| Garden arbor (gateway, 2 posts + top) | 1200–1800 mm opening (4–6 ft) | 300–900 mm (shallow to seat-depth) | 2100–2440 mm (7–8 ft) | classic peaked or arched top, often with a small gate/bench |
| Oversized arbor / arched pergola-gate | up to 3000 mm wide | up to 900–2400 mm deep | 2400–2700 mm | statement garden entrance, may include built-in bench |

### Shape breakdown
Local origin at ground center, +Z = front/viewing side.

- **Wall trellis**: one thin `box` backer frame (perimeter, 30–40 mm section) + a
  lattice look faked with 2–3 thin horizontal `box` slats and 3–4 thin vertical `box`
  slats (5–10 mm thick) crossing diagonally or orthogonally — the cheapest readable
  "lattice" is a diagonal criss-cross of 6–8 slim boxes rather than true woven
  geometry. Mount flush to wall (thin in depth, ~20–30 mm), or lean at a slight angle
  (~5–8°) if freestanding-against-wall.
- **Vine foliage**: irregular clumps of flattened `sphere`s (scaled non-uniformly,
  squashed on Z) in 2–3 size tiers, scattered along the lattice/frame from base
  upward with density increasing toward mid-height, thinning near the top (a real
  climbing vine rarely fully covers a tall trellis uniformly — cover ~40–70% for an
  "established" look, ~15–25% for "young"). A handful of small accent-colored
  `sphere`s = flowers/berries.
- **Obelisk/tuteur**: 3–4 thin `cylinder` corner posts angled inward (tapering plan),
  joined by 3–4 horizontal `cylinder`/`box` cross-rings at increasing heights, topped
  with a small `sphere`/`cone` finial. Foliage spheres cluster more densely at the
  base, sparse at the tip.
- **Arbor/arch gateway**: two vertical `box`/`cylinder` posts (100×100 mm section,
  2100–2400 mm tall) planted in the floor, joined by a top structure — either a flat
  `box` lintel + a shallow `cone`/half-`cylinder` arch cap, or 3–5 evenly spaced curved
  slats approximated by short angled `box` segments forming a pointed/rounded arch.
  Optional cross-bracing `box` diagonals at the top corners for the classic
  lattice-gable look. If it includes a bench, add a simple bench primitive set (seat
  box + 2 leg boxes) inside the depth footprint.
- **Front face**: the "viewing" +Z face is whichever side has the densest foliage/the
  arch opening faces; for a wall trellis, +Z is the side away from the wall (where the
  vine grows outward toward light).
- No moving parts — static garden furniture; all "motion" is vegetative (see
  Animation).

### Colors & finishes
- Structure: natural cedar/redwood (tan-brown `#b08d57` range), white-painted wood or
  vinyl (`#f5f5f0`), black or dark-bronze powder-coated metal (`#2a2a2a`), weathered/
  driftwood grey (`#9a9088`), classic green-painted iron (`#3a5a40`).
- Foliage: vine leaf greens vary by species — matte mid-green (English ivy, Boston
  ivy) `#4c7a3d`, silvery-blue-green (clematis foliage) `#7a9b6e`, deep glossy green
  (climbing hydrangea) `#2f5233`; autumn variants (Boston ivy, Virginia creeper) shift
  to red/orange/crimson (`#b33a1f`, `#d97b29`) for a seasonal option.
- Flower accents (if flowering vine modeled): purple/violet (clematis, wisteria
  `#6a4c93`/`#8e7cc3`), pink/red (climbing rose `#d6336c`, trumpet vine `#e0492a`),
  white (jasmine, climbing hydrangea `#f5f5f0`), yellow (climbing nasturtium
  `#f4c430`).
- Texture: lattice/frame reads best with a simple flat toon material; foliage spheres
  get a slightly darker "shadow" material variant mixed in for depth without true PBR.

### Placement
- Exterior only — **floor**-resting (footed posts or base plate set into ground/
  patio), placed in yard/garden ground areas (rides the existing `outdoor`
  `FurnitureKind` category alongside tree/bush/flower_bed). Wall trellis variant can
  alternately be modeled as **wall**-mounted (flush, shallow depth) leaning against an
  exterior wall face.
- Arbor gateways typically straddle a path — good candidate to snap across a walkway
  similar to how doors snap to walls, but the simplest v1 is free placement like other
  outdoor pieces.
- Typical arbor post-footing sits at floor level (y=0); trellis panel base also at
  y=0 unless raised in a planter box.

### Active / interactive state
- No HA entity typically binds to a passive garden structure — mostly a static
  seasonal/decorative prop rather than an "on/off" device.
- Possible seasonal state hook: tie foliage density/color to time-of-year (spring =
  sparse green, summer = full dense green, fall = red/orange + partial coverage,
  winter = bare frame with minimal or no foliage spheres) — could reuse the existing
  time-of-day/season resolution pattern if a season concept exists, or just a manual
  sidebar "season" dropdown per fixture.
- If the vine has a bound `sensor` (a soil-moisture or growth-tracking integration
  were ever added) it's speculative — treat as decorative-only for now.

### Variations & customizations
- Structure type: wall trellis (fan/expandable or flat panel) / obelisk-tuteur / arch
  arbor / arbor-with-bench.
- Material/finish: natural wood, white-painted, black metal, weathered grey.
- Vine species preset (drives foliage color + flower accent + optional autumn
  palette): ivy (evergreen green, no flowers), climbing rose (green + pink/red
  blooms), wisteria (green + purple hanging clusters), clematis (green + purple/white
  star flowers), Virginia creeper/Boston ivy (green→red seasonal foliage, no showy
  flowers), trumpet vine (green + orange-red flowers), jasmine (green + small white
  flowers, evergreen).
- Coverage density slider (young/newly-planted → sparse, mature → dense/full).
- Size scale (compact patio trellis → oversized garden-entrance arbor), matching the
  width/height table above.

### Animation opportunities
- **Idle**: gentle wind sway — small per-leaf/cluster sinusoidal rotation or position
  jitter on the foliage sphere clusters (low amplitude, offset phase per cluster so it
  doesn't read as rigid), synced to any existing wind/weather system (stronger sway
  when `windy`/`windKmh` is high, per the weather-effects wind-bearing plumbing).
  Frame/lattice itself stays rigid — only foliage animates.
- **Seasonal/active state**: crossfade or swap foliage-color material (green →
  red/orange) and flower-accent spheres appearing/disappearing across a "season" or
  growth-stage value — could ease similarly to other blend idioms (a slow
  `bl(cur,tgt,w)`-style transition rather than an instant pop) if a season/time-lapse
  feature is ever added.
- **Highlight/selection**: standard selection outline (matches other fixtures) — no
  special active glow needed since there's no power/on-state.
- **Optional flourish**: occasional single falling leaf/petal particle (very sparse,
  reuse the weather particle-cloud idiom at very low count) for a flowering or
  autumn-foliage variant — cheap ambient life without a persistent state machine.

**Sources**: [Trellis Structures – Standard Arbor](https://trellisstructures.com/collections/standard-arbor/),
[BACKYARDABLES – Find the Right Size Arbor](https://backyardables.com/find-the-right-size-arbor/),
[Family Handyman – Garden Arbor Guide](https://www.familyhandyman.com/article/garden-arbor-guide/),
[Walpole Outdoors – Standard Lattice Panel](https://www.walpoleoutdoors.com/standard-designs/rectangular-standard-lattice-panel),
[Fine Homebuilding – Arbor Dimensions](https://www.finehomebuilding.com/forum/arbor-dimensions)

---

## 18. Outdoor potted plant and hanging basket

### Typical dimensions
Converted from standard nursery/retail sizing.

| Variant | Pot/basket Ø × H | Plant height above rim | Notes |
|---|---|---|---|
| Compact patio pot (1-gal nursery / 8–10" pot) | 200–250 × 200–230 mm | 150–450 mm | annuals, herbs, small succulent |
| Standard planter (3–5 gal / 12–14" pot) | 300–360 × 280–350 mm | 300–900 mm | patio shrub, small ornamental grass |
| Large floor urn/barrel planter | 500–600 × 350–500 mm (barrel: ⌀560×450 mm typical whiskey-barrel) | 600–1500 mm | boxwood, small tree, statement piece |
| Hanging basket, small | Ø 300 mm (12") × 130 mm deep, chain ~400 mm | trailing foliage droops 150–400 mm below rim | porch/eave |
| Hanging basket, standard | Ø 350 mm (14") × 150 mm deep, chain ~430 mm | trailing foliage droops 200–500 mm below rim | most common porch size |
| Hanging basket, large | Ø 400–450 mm (16–18") × 180 mm deep, chain ~450–500 mm | droop 250–600 mm | commercial/entry feature |

Overall footprint to reserve on the plan: compact 300×300 mm, standard 450×450 mm,
large 700×700 mm; hanging baskets need ~600 mm vertical clearance below the mount
point (basket + droop) and read as a small "blob" from above (~500×500 mm).

### Shape breakdown
Local +Z = front/viewing side — mostly irrelevant since most are radially symmetric,
but keep foliage asymmetry facing +Z.

- **Pot/planter body**: tapered cylinder — approximate with a `cylinder` radius top >
  radius bottom (or two stacked cylinders if the engine lacks a taper param); barrel
  style adds a slight mid-bulge (one fatter cylinder segment). Rim lip = thin cylinder
  ring, slightly larger radius, ~15–20 mm tall.
- **Soil surface**: flat dark disc (short squat cylinder) inset ~10–15% below rim.
- **Foliage mass**: 1–3 overlapping `sphere`s (squashed on Y) for a rounded shrub/
  annual mound, OR a `cone` for upright/spiky plants (ornamental grass, small
  conifer), OR a single tall thin cylinder+sphere for a small potted tree (trunk +
  canopy).
- **Trailing/spilling variety** (common in both floor pots and baskets — petunias,
  ivy, sweet potato vine): add 3–6 small stretched spheres or thin tapered cylinders
  drooping down and outward past the rim, angled downward at 20–45°, tips below the
  pot's own base line for baskets.
- **Hanging basket**: liner body = shallow bowl (squashed sphere or shallow cone, open
  top) instead of a tall pot; 3 thin cylinders (chains) from rim to a single point
  above (the hook); a small `sphere`/`torus` hook detail at the top attach point.
  Foliage mounds on top + heavy trailing drape below the bowl on all sides (baskets
  are viewed from below/side, so drape reads on every edge, not just front).
- Front face (+Z) only matters for asymmetric arrangements (e.g. a "spiller" trained
  to one side, or a formal topiary with a shaped face); most household variants are
  fine radially symmetric.

### Colors & finishes
- Pot material/color: terracotta/clay (warm orange-brown, matte), glazed ceramic
  (glossy — cobalt blue, sage green, charcoal, white), resin/plastic mimicking stone
  or wood-grain (grey, black, "rustic oak" barrel tan), concrete/stone (light grey,
  textured), galvanized metal (silver, matte), wood barrel (weathered oak brown with
  dark metal bands).
- Basket liner: coco-fiber (light brown, fibrous texture) or black plastic, usually
  hidden by foliage.
- Foliage colors: green (variable saturation/shade for leaves), plus seasonal bloom
  color pops — red/pink/white/purple/yellow/orange flower clusters (geranium,
  petunia, marigold, mum), silvery-green (dusty miller), variegated white-green.
- Chains/hook: black or bronze powder-coated metal.

### Placement
- **Floor**: patio/porch/entry, deck corners, flanking front door, along walkways,
  poolside — rests directly on ground/pavement, no elevation offset (base z = 0).
- **Counter/surface**: smaller compact pots also work on outdoor tables, deck rails
  (rail-mount planter boxes clip over a 90–140 mm wide rail top).
- **Ceiling/overhang hook**: hanging baskets mount from a porch-ceiling hook or
  bracket arm, typically hook height 1900–2200 mm above the floor/porch surface so the
  basket bottom clears head height (~1600–1750 mm to basket bottom) — should be
  treated as a ceiling/overhang-anchored prop, not floor-resting.
- **Wall**: wall-mounted bracket baskets/window boxes on exterior walls, sill height
  ~800–1000 mm (window box) or bracket-mounted 1200–1800 mm.
- No indoor placement in this item's scope (that's the separate houseplant items),
  though nothing prevents reuse on a covered patio "room."

### Active / interactive state
- Largely passive decor, but seasonal/state variation is worth surfacing: a "wilted"
  low-saturation/droopy-geometry variant if a plant-care/watering integration reports
  low moisture (nice tie-in for a smart irrigation sensor), vs. a lush full-bloom
  variant normally.
- If bound to a smart irrigation valve/sensor entity, a subtle "just watered" glisten
  (darker soil tone, small water-drop decals) could flash briefly after a watering
  event.
- No mechanical moving parts; the only "interaction" is placement/rotation like other
  static furniture.

### Variations & customizations
- Pot style: terracotta classic / glazed ceramic / modern resin cylinder / whiskey
  barrel / stone urn / galvanized bucket.
- Size: compact, standard, large/oversized (barrel or urn scale).
- Plant type: mounded annual flowers, upright ornamental grass, small conifer/topiary,
  trailing/spiller mix, succulent arrangement.
- Basket style: classic wire/coco-liner English basket, solid plastic self-watering
  basket, modern minimalist bowl.
- Seasonal dressing: spring bulbs, summer annuals, fall mums, winter evergreen boughs
  — a simple palette/geometry swap keyed to a season parameter would sell a lot of
  ambience cheaply.

### Animation opportunities
- **Idle**: gentle wind sway on foliage/trailing stems (low-amplitude sinusoidal
  bend, offset phase per leaf cluster so it doesn't read as rigid), hanging basket
  adds a slow pendulum swing on the chain/hook pivot (very small angle, longer period
  than the foliage sway since it's a heavier pendulum).
- **Weather-reactive**: stronger sway/swing amplitude and rate during windy
  conditions; rain droplets or a wet-glisten shader pass during rainy/pouring
  conditions; frost rim/icicle dusting at low apparentC, matching the existing frost
  treatment used elsewhere.
- **Seasonal/state change**: bloom-color swap or wilt state as described above; a
  brief "planted/refreshed" pop-in scale animation if ever placed via a UI action.
- **Active**: none beyond the above — no lighting, no user toggle expected; purely
  ambient/environmental animation.

---

## 19. Rock garden and decorative boulders

### Typical dimensions
Footprint bed × height; boulders given as diameter.

| Variant | Plan footprint (W×D) | Height | Notes |
|---|---|---|---|
| Single accent boulder — small | 300×300–600×600 mm | 150–300 mm | 6–12 in field/landscape stone |
| Single accent boulder — medium (most common "feature" rock) | 600×600–900×900 mm | 300–600 mm | 12–24 in dia., ~100–700 lb |
| Single accent boulder — large/oversized | 900×900–1200×1200 mm | 600–900 mm | 24–36 in dia., 500–2000 lb "2–3 man" rock |
| Boulder cluster (3–5 rocks, odd-number grouping is the standard design rule) | 1200×900–2000×1500 mm | 200–700 mm (varied per rock) | Mixed small/medium/large set nested together |
| Rock garden bed (gravel/mulch bed + boulders + groundcover) | 1500×1000 mm up to 3000×2000 mm | Bed lip 50–100 mm; boulders as above | Scales to yard corner/border; irregular kidney/organic outline in reality, box/ellipse footprint is a fine game approximation |

### Shape breakdown
Origin at bed/piece center at grade, +Z = front/viewing side.

- **Bed base**: one flat `box` (or a shallow `cylinder`/ellipse approximated by a
  scaled cylinder) as the mulch/gravel pad, 40–80 mm thick, top at y≈0–20 mm (sits
  like the existing `groundAreas` "mulch" ground kind — could literally reuse that
  ground-paint system instead of a furniture piece for the bed itself).
- **Boulders**: irregular rock forms fake well with 1–2 overlapping `sphere`s
  **non-uniformly scaled** (squash Y to ~0.6–0.8, stretch X/Z slightly asymmetric so it
  doesn't read as a ball) plus one `box` with heavy corner scale/rotation jittered
  ±15–25° for a faceted look. A cluster piece = 3–5 such rock primitives at varied
  scale (0.4×, 0.7×, 1.0× a base radius) placed with irregular offsets, not a grid —
  asymmetry is what sells "natural."
- **Optional cobble/pebble scatter**: a handful of tiny `sphere`s (60–120 mm)
  flattened, scattered at the bed edges for pea-gravel/river-rock texture without a
  real particle system.
- **Groundcover accent** (optional): 1–3 small flattened `sphere`/`cone` clusters
  tinted green, echoing the existing `bush`/`flower_bed` kinds, tucked between
  boulders.
- No moving/openable parts — static hardscape, no front-facing functional face beyond
  a loose "best viewing angle" (place the tallest/most detailed boulder faces toward
  local −Z like other outdoor pieces, for the selection chevron convention).

### Colors & finishes
- Stone base tones: warm grey/tan (granite/fieldstone), buff/gold (Utah/Arizona
  buckskin, Oklahoma chop), reddish-brown (river rock, lava rock), charcoal/black
  (basalt, lava rock), white/cream (quartz, limestone).
- Real boulders show mottled/lichen texture (patchy pale-green/grey speckling on the
  upper faces) and darker weathered undersides — approximate with a subtle darker
  tint on the lower half of each sphere and a light desaturated speckle tone on top.
- Bed fill options: light tan/white pea gravel, dark brown/black shredded mulch, red
  lava rock, grey river rock — matches the palette already defined for `GroundKind`
  (rock/mulch), so a rock-garden piece could literally be built from a `ground`
  (paint) region plus a handful of boulder `Furniture` pieces rather than one
  monolithic object.

### Placement
- **Outdoor**, `cat: 'outdoor'` like `tree`/`bush`/`flower_bed`. Rests directly on the
  ground/floor (yard grade, y≈0, no elevation).
- Typically placed along house foundation borders, yard corners, berm/slope accents,
  or flanking a front walkway/entry; never indoors. No wall or ceiling mount.

### Active / interactive state
- Purely passive hardscape — no power, no HA entity to bind, no state to reflect. The
  only "activity" is environmental: it should participate in weather visuals already
  in the renderer — rain/snow accumulation look (could tie into the existing
  puddle-decal system after rain), frost rim in cold weather (reuse the existing frost
  system), and normal ground-shadow/blob-shadow treatment. No sit/anchor activity (not
  sittable, not an appliance).

### Variations & customizations
- Size preset: small accent / medium feature / large statement boulder, plus a
  "cluster" multi-rock composite kind.
- Stone material/color swatch: granite grey, buckskin tan, lava black/red, quartz
  white, river-rock mixed multi-tone.
- Bed fill kind: gravel / pea gravel / mulch / bare dirt / xeriscape (matches existing
  `GroundKind` options — rock/mulch already exist, could add `pea_gravel` as a texture
  variant).
- Optional groundcover accent toggle (succulents/grasses tucked between rocks) and
  optional small-cobble scatter toggle.
- Layout style: single accent stone, odd-numbered cluster (3/5), or full rock-garden
  bed with border edging.

### Animation opportunities
- **Idle**: essentially static (real rocks don't move) — the only ambient motion
  worth adding is environmental: rain-wet specular darkening, frost forming on upper
  facets in cold conditions, subtle seasonal groundcover color shift (green → dormant
  tan) if a groundcover accent is present, and normal wind-sway on any tucked-in
  ornamental grass/plant tuft (reuse bush/flower sway if such a system exists).
- **Active**: none intrinsic; if desired, a decorative solar-accent-light variant
  could add a warm glow at dusk/night (would ride the existing light-fixture system
  rather than the rock geometry itself), and a small water-feature variant (boulder
  with a hidden recirculating "bubbler") could reuse the `fountain` outdoor kind's
  static translucent water column treatment.
- Overall: lowest-priority animation item in the outdoor set — value is in silhouette
  variety (irregular clustered primitives) and material/color variety, not motion.

---

## Modeling notes for Diorama

### FURNITURE_KINDS defaults table

Diorama's existing outdoor kit (`FURNITURE_KINDS` in `geometry.ts`, `cat: 'outdoor'`)
already ships `tree`, `pine_tree`, `bush`, `flower_bed`, `bird_bath`, `fountain`,
`swingset`, `lawn_chair`, `picnic_table`, `trash_bin`, `recycle_bin`. This doc's items
mostly slot into that category (new kinds or size/species variants of existing ones);
a handful are **indoor** furniture (`cat: 'decor'`-style, alongside the existing
`plant` reference points implied by `coffee_maker`/`toaster` mountable precedent) and
a few are **ground-area** (`GroundKind`) or **wall/run** primitives rather than
discrete `Furniture` items at all. Suggested defaults:

| Item | Suggested `FurnitureKind` / system | Footprint w×d (mm) | Height (mm) | Tint | Category |
|---|---|---|---|---|---|
| Small indoor potted plant | new `plant_small` (mountable) | 100–250 × 100–250 | 150–300 | `#5c9e3f` foliage / `#b5673a` pot | `decor`, mountable |
| Medium indoor potted plant | new `plant_medium` | 250–300 × 250–300 | 500–900 | `#2f6b3a` | `decor` (floor or mountable) |
| Large floor plant / indoor tree | new `plant_tree_indoor` (S/M/L presets) | 250–350 × 250–350 | 900–2400 | `#2e7d32` | `decor`, floor |
| Hanging planter | new `plant_hanging` | 300–450 × 300–450 (footprint = drop shadow only) | 700–1800 (ceiling-anchored) | `#4c7a3d` | `decor`, ceiling |
| Indoor herb garden / windowsill planter | new `herb_planter` (mountable) | 300–900 × 100–270 | 200–470 | `#4c8c3b` | `decor`, mountable (counter/appliance-adjacent) |
| Deciduous shade tree | `tree` (existing kind — add species/size variant) | 7000–10000 (canopy) | 9000–13000 (capped ~8000–10000 for scale) | `#5c9e3f` (maple) / `#4f7a3a` (oak) | `outdoor` |
| Evergreen/pine/conifer tree | `pine_tree` (existing kind — add columnar variant) | 800–1200 | 1200–4500 | `#2f6d3a` | `outdoor` |
| Palm tree and tropical | new `palm_tree` | 300–600 (indoor) / 400–600 trunk (outdoor) | 400–2150 (indoor) / 2500–6000 (outdoor) | `#2e7d32` | `outdoor` or `decor` |
| Shrub / bush | `bush` (existing kind — add size tiers) | 300–1800 | 300–3000 | `#3f7a4d` | `outdoor` |
| Hedge / privacy row | new `hedge` (draggable-length run, wall-like) | 400–1200 (depth) × user length | 300–4500 | `#3f6b3a` | `outdoor` |
| Flower bed | `flower_bed` (existing kind, or `groundAreas` patch) | 600–3000 × 300–1800 | 100–1200 (plant height) | mixed bloom palette | `outdoor` |
| Vegetable garden bed / raised planter | new `garden_bed` | 610–1220 × 1220–2440 | 280–840 | `#A9784F` wood / `#4C8C3B` foliage | `outdoor` |
| Lawn / turf grass | `GroundKind: 'grass'` (existing) | ground-area polygon | 25–300 (visual only) | `#5a9c3f`–`#7cb84f` | ground-area |
| Mulch bed / ground cover | new `GroundKind: 'mulch'` + point `groundcover` accents | ground-area polygon + 5–15 small accents | 50–125 (mulch) / 100–400 (groundcover) | `#3b2a1a` mulch / mixed greens | ground-area + `outdoor` |
| Ornamental grass | new `ornamental_grass` | 300–2500 | 300–3000 (incl. plumes) | `#4a7c3f` | `outdoor` |
| Cactus / desert planting | new kinds `cactus_barrel` / `cactus_saguaro` / `cactus_prickly_pear` / `agave` / `yucca` | 90–1800 | 100–9000 (saguaro extreme; cap ~3000 for scale) | sage green / golden spines | `outdoor` or `decor` (potted) |
| Climbing vine and trellis/arbor | new `trellis` / `obelisk` / `arbor` | 400–3000 × 15–2400 | 300–2700 | `#b08d57` wood / `#4c7a3d` vine | `outdoor` (wall or floor) |
| Outdoor potted plant / hanging basket | new `planter_outdoor` (floor) + `basket_hanging` (ceiling/wall) | 200–700 | 300–1500 (floor) / ceiling-anchored (basket) | mixed bloom | `outdoor` |
| Rock garden / boulders | new `boulder` / `boulder_cluster` | 300–2000 | 150–900 | warm grey/tan granite | `outdoor` |

### ObjectRecipe custom-object mapping

Every item above is buildable as an `ObjectRecipe` (`primitives: RecipePrimitive[]`,
each a `box`/`cylinder`/`sphere`/`cone` with `size`/`pos`/`rot?`/`color?` in local mm,
origin = piece center at floor level, **+Z = front**):

- **Pot/base + foliage-cluster** is the universal recipe shape for every potted item
  (small/medium/large indoor plants, hanging planters, herb gardens, palms, cacti,
  ornamental grass, outdoor pots/baskets): one tapered `cylinder` (pot) + a flat
  `cylinder` (soil) + N `sphere`/`cone` primitives (foliage), with size/count/tint
  driving the species variant. Build ONE shared "leaf-clump" primitive and reuse it at
  different scales/counts/tints rather than bespoke geometry per species.
  - Mid-frame indoor plants, xeriscape planting see this pattern too — it is the
    single densest cluster of specs and shows the pattern clearly.
- **Radial/tiered mass** covers trees (deciduous, conifer, palm): tapered `cylinder`
  trunk + multiple offset `sphere`s (rounded canopy) or stacked `cone`s (tiered
  fir/spire) or radial thin `box`/`cone` fronds (palm).
  - The doc's dimension tables give 3–4 size presets per tree kind (sapling/young/
    mature/heritage or dwarf/standard/oversized) — expose as a single scale slider
    plus a discrete species/silhouette dropdown, matching the existing env-sensor
    `scale` pattern rather than one `FurnitureKind` per size.
- **Ground-hugging patch** covers lawn, mulch bed, flower bed, rock garden bed,
  xeriscape gravel — these are better served by `Floor.groundAreas` (`GroundKind`
  polygon paint with a procedural texture) than a boxy `Furniture` piece; discrete
  point objects (boulders, individual shrubs, ornamental grass tufts) are placed ON
  TOP of the ground-area patch as regular `Furniture`/`ObjectRecipe` items.
- **Linear/run** covers hedge and (optionally) a wall trellis run — best modeled as a
  draggable-length primitive (like a `Wall`) rather than a fixed-footprint furniture
  piece, tiling one 1000 mm segment recipe along the drawn path.
- **Frame + climbing foliage** covers trellis/obelisk/arbor: rigid wood/metal frame
  primitives (`box`/`cylinder`) stay static; foliage `sphere` clusters scatter along
  the frame at a density parameter (young/sparse → mature/dense).

### Mounting / placement summary

- **Floor-resting** (y=0, no elevation): large floor plant/indoor tree, deciduous
  tree, conifer, outdoor/landscape palm, shrub/bush, hedge, vegetable garden bed,
  cactus/xeriscape (in-ground), climbing vine trellis/obelisk/arbor, outdoor potted
  plant (floor variant), rock garden/boulders.
- **Mountable** (elevation = host `surface` top, same convention as `coffee_maker`/
  `toaster`): small indoor potted plant, indoor herb garden/windowsill planter, small
  potted cactus, potted ornamental grass/tropical accent.
- **Ceiling-hung** (anchored to a ceiling hook, not floor-resting): hanging indoor
  macrame planter, outdoor hanging basket.
- **Wall-snapped** (flush mount, shallow depth): wall trellis panel variant (optional
  — floor-footed is the simpler v1 default).
- **Ground-area / polygon paint** (`Floor.groundAreas`, not a discrete `Furniture`):
  lawn/turf grass, mulch bed base layer, xeriscape gravel/decomposed-granite bed,
  rock-garden bed base. Point accessories (boulders, tufts, individual plants) still
  place as regular furniture on top.

### "Active/running" animated-state candidates

Almost nothing in this category is HA-entity-bound in the traditional appliance sense
— these are overwhelmingly **decorative, always-animating** props rather than
on/off devices. The animation budget should go toward:

1. **Universal idle sway** (the highest-value, lowest-cost animation across nearly
   every item): a low-amplitude, phase-offset sine wobble on foliage/canopy/frond
   primitives only (never the rigid pot/trunk/frame), reusing the existing idle-sway/
   breathing idiom already used for humanoids. Applies to: all potted plants, trees
   (deciduous/conifer/palm), shrubs, hedges, flower beds, ornamental grass, vines,
   ground-cover, outdoor pots/baskets.
2. **Weather-driven amplitude scaling**: for every swaying item, tie amplitude/
   frequency to `WeatherFxState.windKmh` and `windBearingPlanRad` (already threaded
   through three-view for cloud/precip drift) — calm = barely perceptible, `windy`/
   storm conditions = pronounced directional lean + gust-burst bump. This is the
   single most reusable "active state" mechanism in the whole category, since these
   props have no bindable HA entity of their own.
3. **Explicit HA-bound "active" states** (the few genuine exceptions):
   - Indoor herb garden / smart hydroponic garden: bound `light.*`/`switch.*` grow-
     light hood → emissive-on + light-pool decal (reuse the existing pendant/spot
     glow idiom).
   - Vegetable garden bed: optional bound irrigation `switch`/`valve` → mist/sparkle
     burst + soil-darken pulse.
   - Lawn/turf: optional bound irrigation entity → sprinkler spray-arc particles
     (reuse the `PointsMaterial` precip idiom) + wet-darken tint.
   - Any item with a soil-moisture `sensor.*` bind (small/medium/large potted plants,
     flower bed, garden bed, outdoor pots): optional wilt/droop-vs-healthy color and
     pose blend, mirroring the `ENV_KINDS` warn/danger escalation pattern.
4. **Seasonal/cosmetic-only state** (no entity, manual property or future season
   system): deciduous tree fall-color swap, hedge/shrub bloom-dot toggle, ornamental
   grass green→gold→dormant transition, climbing vine autumn-color swap, lawn
   green→tan→snow-dusted cycle, mulch-bed "freshly refreshed vs. faded" tint. These
   should ride the existing ground-texture / `_keyFloor` cache-invalidation pattern
   rather than adding new per-frame work.
5. **Zero-animation items** (cheap by design — don't over-invest): cactus/xeriscape
   planting (rigid, no foliage to sway) and rock garden/boulders (inert hardscape) are
   the two intentionally static props in this category; their "liveliness" comes from
   weather-reactive shading (frost rim, wet darkening) rather than motion.
