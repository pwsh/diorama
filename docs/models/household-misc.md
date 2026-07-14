# Household Misc — Diorama Model Reference

This document is a build reference for stylized, Sims-2000-style 3D models and
animations of common household items in Diorama, a Home Assistant floor-plan
app. Every item below is broken into buildable **box / cylinder / sphere / cone**
primitives sized in **millimeters**, with the local origin at the piece's floor
center and **local +Z as the front** (matching Diorama's furniture convention).
Use this alongside `FURNITURE_KINDS` / the `ObjectRecipe` custom-object system
(see "Modeling notes for Diorama" at the end) when implementing new kinds.

## Table of contents

1. [Television and TV stand / wall mount](#television-and-tv-stand--wall-mount)
2. [Computer desk setup](#computer-desk-setup-desk--monitor--keyboardmouse--tower-or-laptop)
3. [Treadmill and stationary exercise bike](#treadmill-and-stationary-exercise-bike)
4. [Free weights / dumbbell rack / weight bench](#free-weights--dumbbell-rack--weight-bench)
5. [Upright / grand piano and keyboard](#upright--grand-piano-and-keyboard)
6. [Guitar and instrument stand](#guitar-and-instrument-stand)
7. [Children's toy box and toys](#childrens-toy-box-and-toys)
8. [Pet bed, crate, litter box, and food bowls](#pet-bed-crate-litter-box-and-food-bowls)
9. [Laundry hamper / basket](#laundry-hamper--basket)
10. [Ironing board & drying rack](#ironing-board--drying-rack)
11. [Upright and robot vacuum, cleaning supplies](#upright-and-robot-vacuum-cleaning-supplies)
12. [Indoor trash can and recycling bin](#indoor-trash-can-and-recycling-bin)
13. [Floor and table fan](#floor-and-table-fan)
14. [Aquarium / fish tank](#aquarium--fish-tank)
15. [Gaming console and setup](#gaming-console-and-setup)
16. [Coat rack, umbrella stand, shoe rack](#coat-rack-umbrella-stand-shoe-rack)
17. [Storage bins and utility shelving unit](#storage-bins-and-utility-shelving-unit)
18. [Grandfather / standing floor clock](#grandfather--standing-floor-clock)
19. [Baby crib, changing table, high chair, stroller](#baby-crib-changing-table-high-chair-stroller)
20. [Safe and gun cabinet](#safe-and-gun-cabinet)
21. [Modeling notes for Diorama](#modeling-notes-for-diorama)

---

## Television and TV stand / wall mount

### Typical dimensions

| Variant | Screen diag. | Screen W × H (mm) | Overall W × H incl. bezel (mm) | Panel depth (mm) |
|---|---|---|---|---|
| Compact bedroom | 32–43" | 700×390 – 950×535 | 730×420 – 980×560 | 40–90 (LED/QLED) |
| Standard living room | 55" | 1,217×686 | 1,240–1,280 × 720–760 | 25–90 |
| Standard-large | 65" | 1,440×810 | 1,470–1,510 × 850–890 | 25–90 |
| Oversized | 75–85" | 1,650×930 – 1,870×1,050 | 1,700×960 – 1,920×1,090 | 30–90 |
| Ultra-thin OLED | any | as above | as above | 10–45 (bezel-thin edge, thicker connector spine on back) |

- Stand/legs (tabletop use): adds 90–250 mm height, feet splayed to ~60–80% of screen width, 300–330 mm depth footprint.
- TV stand / media console (floor furniture): width 1,070–2,290 mm (small 1,070–1,370 / medium 1,470–1,780 / large 1,830–2,290), depth 380–460 mm (460 mm "deep" holds an AV receiver), height 430–560 mm (modern low-profile) up to 610–760 mm (legacy tall console).

### Shape breakdown

- **Panel**: one thin flat box — the screen — W×H per table, depth 25–90 mm. Front face (+Z) gets an emissive/lit material when "on." A slim 10–15 mm darker bezel border can be a second, very slightly larger box behind it or baked into the material.
- **Stand/legs** (tabletop variant): 2 small feet (box or cylinder) near the bottom-left/right of the panel, or one wide flat box foot bar (soundbar-style pedestal), set back so the panel's center of mass sits above it.
- **Wall-mount bracket** (wall variant): a thin vertical box mounting plate behind the panel (mostly hidden), plus 1–2 short horizontal box arms for a tilt/articulating mount holding the panel a small offset (20–150 mm) off the wall.
- **TV stand/console** (furniture piece housing the TV): a box low cabinet body, W×D×H per table, with 1–3 recessed door/drawer front boxes (optionally split by a vertical box divider for open cubbies), a thin box inset for a soundbar shelf, and 4 short cylinder/box legs (60–100 mm) for mid-century-style consoles (flush-to-floor plinth for modern ones).
- No lens/cone parts needed; keep the panel perfectly flat and thin — this is the single most recognizable silhouette cue.

### Colors & finishes

- Panel/bezel: matte black or dark charcoal (near-universal); occasional brushed-silver or white bezel on budget/kids models.
- Screen "glass": deep near-black gray-blue when off (`#0a0d12`–`#1a1e24`); vivid emissive color/pattern when on.
- Stand/legs: matte black or brushed metal (silver/gunmetal).
- TV console furniture: walnut/oak/espresso wood tones, matte black, white lacquer, or industrial black-metal-and-wood combos; occasionally glass-fronted doors (semi-transparent box).

### Placement

- Rooms: living room, bedroom, family/media room, occasionally kitchen (small) or office.
- **On a surface (mountable)** — sits atop a TV stand/console/dresser; screen bottom ~430–560 mm off the floor.
- **Wall-mounted** — bracket-hung, no stand; screen center at ~1,050–1,150 mm off floor (range 1,050–1,520 mm), panel standoff 20–150 mm from wall face.
- Rarely ceiling-mounted (motorized drop-down bracket) in high-end media rooms — niche/optional variant.

### Active / interactive state

- **Off**: flat dark/near-black screen, no glow.
- **On**: front face emissive with a shifting/lit "content" look — a soft color-cycling glow or animated gradient/noise texture reads as "playing" without real video; optional soft ambient light bleed onto wall/floor at night.
- Bound to `media_player.*`: show a small "now playing" info sprite/title; dim/highlight when `playing` vs `paused`/`off`.
- Optional standby LED: tiny dim red/white pinprick dot at the bottom edge when plugged in but off.

### Variations & customizations

- Size tiers: compact (32–43"), standard (55"), standard-large (65"), oversized (75"+).
- Mount type: tabletop-on-stand vs wall-mounted (toggle removes/adds stand legs, adds bracket + wall standoff).
- Console style: low modern media cabinet, tall mid-century console w/ legs, corner unit, floating wall-mounted shelf, or no-stand (wall-mount only).
- Bezel/finish: black matte (default), silver/white, thin premium OLED profile vs thicker budget LED profile.
- Add-ons: soundbar (slim box beneath/in front), game console + controller clutter props on the console shelf.

### Animation opportunities

- Idle (off): none needed — static dark panel; maybe a faint reflective sheen via material only.
- Idle (on, ambient): slow color-cycling/soft flicker on the screen texture to imply video motion; gentle bias-lighting glow pulsing subtly.
- Active/interaction: click toggles power (instant or quick fade); when a bound person is "watching TV" (existing `watch_tv` activity anchor), brighten the glow slightly / sync a faster content-flicker cadence.
- Standby LED blinks briefly on power-state change as a confirmation cue.

**Sources**: [55-Inch TV Dimensions](https://belleze.com/blogs/news/55-inch-tv-dimensions) · [TV Dimensions Chart 2026](https://dimensionschart.com/tv-dimensions-chart/) · [Dimensions of 55" TV – Mount-It!](https://www.mount-it.com/blogs/articles/dimensions-of-55-inch-tv) · [How Wide Is a 55" TV – TCL](https://www.tcl.com/global/en/blog/guides/how-wide-and-big-is-a-55-inch-tv) · [TV Stand Size Guide 2026](https://www.hernest.com/blog-detail/tv-stand-size-guide-2026-b-94.html) · [TV Stand Size Guide – Belleze](https://belleze.com/blogs/news/tv-stand-size-guide-how-to-choose-the-right-size-for-your-tv) · [TV Stand Size Guide – Walnutry](https://walnutry.com/blogs/journal/media-console-tv-stand-size-guide) · [TV Stand Height & Size Guide – Tribesigns](https://tribesigns.com/blogs/furniture-knowledge/tv-stand-height) · [VESA Size Chart – Express Mounting](https://expressmounting.com/blog/understanding-vesa-patterns-before-buying-tv-mount/) · [Right TV wall height – Vogel's](https://www.vogels.com/en-us/c/tv/the-perfect-height) · [VESA Mount Guide – Ergotron](https://www.ergotron.com/en-us/support/vesa-standard)

---

## Computer desk setup (desk + monitor + keyboard/mouse + tower or laptop)

### Typical dimensions

| Component | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Desk — compact | 900–1100 mm | 500–600 mm | 730–740 mm | dorm/small-bedroom size |
| Desk — standard | 1200–1400 mm | 600–700 mm | 740 mm | most common; ~29 in top height |
| Desk — oversized/gaming | 1500–1830 mm | 700–800 mm | 740 mm (or 650–850 mm adjustable/sit-stand) | L-shaped/corner variant common |
| Monitor (with stand) — 24″ | ~530 mm | ~200 mm (base) | ~400 mm (screen ~320 mm + stand) | panel ~20 mm thick |
| Monitor — 27–32″ / ultrawide | 620–800 mm | ~220 mm | 430–480 mm | curved ultrawides bow ~40–60 mm at center |
| Keyboard (full-size membrane/mech) | 430–450 mm | 130–150 mm | 25–40 mm | tenkeyless: ~360 mm wide |
| Mouse | 115–130 mm | 60–70 mm | 35–42 mm | with a mousepad ~250×350×2 mm underneath |
| Tower PC (mid-tower ATX) | 200–230 mm | 400–480 mm | 430–490 mm | sits beside/under desk |
| Laptop (13–16″, open) | 300–360 mm | 210–260 mm | screen open ~200–250 mm tall at ~100–110° | base ~15–20 mm thick |
| Desk chair (scale reference) | ~600 mm | ~600 mm | seat 420–480 mm, back to ~900–1300 mm | not modeled here, but occupies front clearance |

### Shape breakdown

Local origin = desk center at floor, +Z = front/user side.

- **Desk**: flat box top (1200–1500 × 650 × 30 mm) at y=height; 4 cylinder or thin box legs at corners (40×40 section), OR a single back box modesty panel + 2 side-panel legs. Optional center drawer as a slightly-inset box under the front-right edge (front = local +Z).
- **Monitor**: thin box panel (~20–30 mm deep) on a cylinder neck stand rising from a small flat box/oval base on the desktop; screen face is +Z — give it a distinct emissive/lit material swap for "on." Second monitor = duplicate offset along X for a dual-monitor setup.
- **Keyboard**: shallow wide box, slightly wedge-profiled (back edge 10 mm taller than front — a plain box is fine at this scale). Placed flat on desktop, front edge ~100–150 mm back from the desk's +Z edge.
- **Mouse**: small rounded box or squashed sphere/capsule, right (or left) of keyboard.
- **Tower PC**: rectangular box, vertical, on the floor beside/under one desk leg (or horizontal on a desktop/under-desk shelf). A thin front box strip or cylinder disc for a front-panel power LED/fan grille.
- **Laptop alternative**: base box (closed-lid thickness) + hinged lid box rotated back ~100–110° from the rear edge (hinge = the moving joint, pivot at the back-bottom edge of the base); screen face is the lid's inner face.
- **Cable management** (optional): a few thin dark cylinder cable runs from tower/monitor down a leg to a floor power strip box.

### Colors & finishes

- Desk top: white/light-oak laminate, black, walnut/espresso wood-grain, or "gamer" red-black-carbon accents; legs often black or silver metal tube.
- Monitor/tower: matte black or white plastic/aluminum bezel; gaming towers add tempered-glass side panel (semi-transparent material) + RGB accent strip (emissive).
- Keyboard/mouse: black, white, or two-tone (gray+orange); mechanical "gamer" keyboards get per-key emissive glow option.
- Chair (context): black mesh, leather brown/black, or fabric gray.

### Placement

- Rooms: home office, bedroom, study nook, living-room corner setups.
- Rests on the **floor** (desk legs) — desktop surface at 730–740 mm (a "surface" host height for other pieces).
- Monitor, keyboard, mouse are all **mountable** on the desk-top surface, elevation = desk height + item's own base thickness.
- Tower PC either floor-standing beside the desk (elevation 0) or shelved under/on the desk (mountable, elevation = desk height or a sub-shelf ~250 mm).
- Monitor can alternately be **arm-mounted**, clamped to the desk edge — same on-surface anchor, offset up/forward with a thin cylinder arm instead of a stand base.

### Active / interactive state

- **Powered on**: monitor screen swaps to an emissive/bright material (soft glow color — blue/white "in use," or a warm still-image tint for "idle/screensaver"); tower front LED emissive pulses faintly; keyboard backlight (if modeled) emissive strip along key gaps.
- **Powered off**: screen goes flat dark gray/black, no emissive; tower LED off.
- **In-use indicator**: a subtle screen-glow pool cast onto the desk surface sells "someone's working" — reuse the appliance in-use LED + glow pattern.
- Binding candidate: `media_player`/`switch`/`binary_sensor` (PC awake / display on), or treat as always-on decorative "on" for a lived-in look, matching TV/appliance conventions.

### Variations & customizations

- Desk style: straight rectangular / L-shaped corner / sit-stand (adjustable height, animatable) / small floating wall-shelf desk (no legs, wall-mounted brackets).
- Monitor count: single, dual side-by-side, or one large ultrawide.
- Compute form factor: tower PC (floor) vs. all-in-one (monitor+PC combined, single box+stand) vs. laptop (desk-only footprint, no tower).
- Finish sets: "home office" (light wood/white), "gaming" (black/RGB/glass), "minimalist" (white/birch, no visible cables).
- Add-ons: monitor-arm mount, desk lamp, small speakers flanking the monitor, cable-tray/grommet detail.

### Animation opportunities

- Idle: slow emissive pulse/flicker on a "screensaver" screen texture; faint RGB color-cycle on gaming-tower accent strip/keyboard backlight; occasional subtle screen-content flicker to suggest video playback.
- Active (person seated, existing `work_at_desk` anchor): screen swaps to a brighter "active" tint while occupied; the existing seated arm-IK typing pose plus a lit screen is likely sufficient.
- State-driven: screen on/off tied to a bound entity (PC power sensor / media_player state) the same way TVs toggle their glow; laptop lid could animate open/closed like a door panel if made interactive.
- Power-on transient: brief bright flash/emissive spike on the monitor the moment its bound entity flips on (mirrors the doorbell/appliance transient-pulse idiom).

---

## Treadmill and stationary exercise bike

### Typical dimensions

| Type | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Treadmill, folding home | 800–900 | 1700–1800 | 1400–1500 (console up) | Belt ~1400×500 mm; folds to ~600×1150×1750 (deck upright) |
| Treadmill, standard non-folding | 850–950 | 1900–2050 | 1350–1450 | Bigger belt (1400–1550×510 mm), sturdier frame |
| Treadmill, compact/under-desk | 700–750 | 1300–1500 | 150–250 (no mast) or ~1000 with pop-up handle | "WalkingPad"-style, minimal/no console |
| Exercise bike, upright | 500–550 | 1100–1150 | 1250–1350 | Narrow footprint, tall handlebar mast |
| Exercise bike, recumbent | 600–650 | 1400–1450 | 1050–1100 | Long low frame, bucket seat, low step-over |
| Exercise bike, spin/indoor cycle | 500–550 | 1000–1100 | 1050–1150 | Weighted flywheel front, racing-drop bars |

### Shape breakdown — treadmill

Front = console side, local +Z faces the walker standing on the belt looking at the console.

- **Base/deck**: one long flat box ~1400×550×150 mm at floor level (running deck), with a slightly wider box underlayer (motor hood) ~500×550×120 mm at the front third.
- **Belt**: thin dark box inset on top of the deck, ~1300×480×10 mm, near-black/charcoal, subtle tread-line texture.
- **Side rails**: two long thin boxes flanking the belt, ~1400×70×60 mm, light grey/silver plastic.
- **Uprights**: two angled cylinders (or slightly tapered boxes) from the front deck corners to the console, ~40 mm dia, splayed outward, height ~1100–1200 mm.
- **Console mast/head unit**: a box ~500×150×300 mm atop the uprights, angled back ~15–20°; front face is the "screen" (flat dark rectangle, optionally emissive when lit).
- **Handlebars**: short cylinder bars projecting forward from console sides, plus straight cylinder grips down each upright — optional detail tier.
- **Front stabilizer/wheels**: two small transport-wheel cylinders under the front motor hood.
- Moving/openable parts: none that open in daily use, but the **deck folds up** vertically in folding models (hinge at the front) — a discrete "folded" vs "in use" pose swap.

### Shape breakdown — upright exercise bike

Front = the direction the rider faces, local +Z.

- **Base**: flat elongated box or two crossed flat bars ~1100×250×40 mm, often with small end-cap cylinders as floor pads.
- **Main frame spine**: a diagonal thick cylinder (or box) from the base to the seat post and down to the pedal housing.
- **Flywheel housing**: a flattened cylinder (drum) near the base front, ~350 mm dia × 60 mm thick, often with an accent ring.
- **Pedal cranks**: two short cylinders (crank arms) from a central hub, each ending in a small flat box pedal.
- **Seat**: a cylinder seat post topped with a saddle built from a squashed sphere/wedge ~280×220×80 mm.
- **Handlebar mast**: a cylinder post topped with a box/bent-cylinder-pair bar at ~1100–1200 mm height.
- **Console**: small flat box ~200×120×40 mm clipped to the handlebar mast, front face = display.
- Moving parts: pedals + crank rotate; seat height adjusts (fix at mid position); resistance knob (tiny cylinder) on the frame.

### Shape breakdown — recumbent bike

Front = forward, where the pedals/console face; rider's back is toward local −Z against the seat back.

- **Base**: long flat box ~1300×300×40 mm, wheeled feet (cylinders) front and rear.
- **Seat assembly**: wide bucket box/shell seat bottom (~400×400×80 mm) plus a tall curved seat-back panel (curved/bent box or cylinder-segment) rising ~500–600 mm behind the seat, often mesh-textured.
- **Pedal housing**: forward of the seat, a flywheel drum (cylinder) at low height (~350–400 mm) with crank arms + pedals as in the upright.
- **Console mast**: shorter cylinder stalk between the rider's knees/in front, topped with the display box — lower and closer than an upright's.
- Moving parts: pedals/cranks rotate; seat slides fore/aft on a rail (cosmetic).

### Colors & finishes

- Frames: matte or gloss **black**, **charcoal grey**, or **white** (home-gym aesthetic); occasional silver/brushed-aluminum accents on uprights and rails.
- Accent trim: brand-color highlight ring on flywheel/motor hood — red, blue, or orange common (Peloton red, NordicTrack blue/silver, Schwinn grey/blue).
- Belt/tread: matte black or dark charcoal with fine long tread grooves.
- Seats/handgrips: black rubber/foam grips; seat cushions black or grey vinyl/mesh.
- Console: dark glass/plastic bezel, flat emissive dark panel that lights blue/white when "on."
- Consumer bikes (Peloton-style) may swap in a large tablet-shaped screen (flat box, ~550×350×40 mm) for a "premium" variant.

### Placement

Floor-standing, freestanding (no wall/ceiling mount). Rooms: home gym / basement / spare bedroom / garage; occasionally bedroom or living-room corner for compact folding units. Elevation 0. Treadmills want ~600 mm clear behind + console-height overhead clearance — a good candidate for a dedicated "gym" room tag.

### Active/interactive state

Bindable to HA `switch`/`sensor`/`binary_sensor` or a fitness-equipment integration if available.

- **Powered on**: console screen glows (emissive swap on the display quad); small LED status dot on the console lights green.
- **In use**: belt visually "runs" (scroll a tread-texture UV or spin a thin cylinder representing belt travel) on a treadmill; crank/pedals + flywheel rotate continuously on a bike. Speed/resistance level could scale rotation speed.
- **Idle/off**: static pose, dark screen, folded (if folding treadmill).
- **Occupant animation hook**: existing `ActivityKind` anchor `exercise_equipment` — a dwelling avatar anchors here with a walking/pedaling pose loop instead of standing idle, matching the existing exercise activity tier.

### Variations & customizations

- Treadmill: folding vs non-folding, compact "walking pad" (no mast) vs full console, incline-capable (slight deck-tilt option).
- Bike: upright / recumbent / spin (indoor-cycle, drop bars, no back support) — worth separate kind entries or at minimum a shape toggle.
- Console tier: small basic display vs large tablet-screen (Peloton-style).
- Color presets: black/grey (generic), black/red (Peloton-esque), black/blue (NordicTrack-esque), white/silver (boutique studio).

### Animation opportunities

- Idle: subtle console screen flicker/glow pulse if left "on"; folding treadmill sits collapsed upright against the wall.
- Active: belt scroll/spin loop (treadmill), crank+pedal+flywheel rotation loop scaled by intensity (bike); occupant avatar's legs/arms animate in sync (walking or pedaling cadence) while anchored — reuse the standing-activity pose-blend idiom (`act` 0→1) with a continuous machine-part rotation added independently, since the belt/pedals should keep moving as long as powered even between avatar visits (if bound to a real "on" entity).

---

## Free weights / dumbbell rack / weight bench

### Typical dimensions

| Piece | Variant | W × D × H (mm) | Notes |
|---|---|---|---|
| Flat bench | Standard | 1145–1270 × 250–300 × 430–460 | Seat/pad ~300 mm wide, fixed height ~17–18 in |
| Adjustable FID bench | Flat-Incline-Decline | 1220–1345 (pad) × 600–710 (leg-spread footprint) × 430 (flat) up to ~1320 (upright ~85°) | Backrest pivots 5–85° in steps; base footprint wider than the pad for tip-over stability |
| Dumbbell rack, compact/home | 2-tier A-frame | 700–900 × 400–500 × 700–1000 | Holds ~3–6 pairs, 5–30 lb |
| Dumbbell rack, commercial | 3-tier horizontal | 1350–1750 × 500–550 (base, narrower at top) × 850–1000 | Holds 8–15 pairs, 5–50+ lb |
| Single dumbbell | Light | ~180 mm long, head Ø ~60–90 mm | e.g. 5–15 lb |
| Single dumbbell | Heavy | ~380–430 mm long, head Ø ~150–200 mm | e.g. 50–75 lb; handle Ø 25–32 mm knurled |
| Adjustable/selectorized dumbbell | Bowflex-style | ~430 × 200 × 230 (at max) | Single unit replaces a whole rack of pairs |

### Shape breakdown

- **Bench**: one flat box pad (~1200×300×100 mm, corners can be sharp — stylized) on a steel frame: two box/cylinder A-legs per end + a horizontal cylinder stretcher bar. Adjustable version splits the pad into a fixed seat box (front = local −Z per convention) and a hinged backrest box pivoted at the seat/backrest joint, rotated up to represent incline. A small box lever/pin cluster near the hinge reads well at a glance.
- **Dumbbell rack**: two angled end-frame box uprights + 2–3 horizontal cylinder rails (the "tiers"), tilted ~5–10° down toward the front so dumbbells nest against a lip; a base box foot pad. Compact vertical/A-frame variant: same idea but rails stack near-vertically on a single narrow frame.
- **Dumbbell (single)**: two cylinder "hex heads" (a true hex isn't available, but a short flat-ended cylinder reads as the iconic silhouette at Sims scale) joined by a thin cylinder handle, with a slightly darker/knurled-look material band. Scale head radius + handle length together per weight per the table.
- **Front face**: bench front is the foot end (feet approach from −Z); rack front is the open face where dumbbells lift out (−Z).
- **Moving parts**: bench backrest hinge (incline angle) is the only literally-moving part; everything else is static geometry.

### Colors & finishes

- Bench pad: black vinyl/pleather (dominant), occasional red/blue/gray accent piping; frame matte black or gunmetal powder-coated steel.
- Rack frame: matte black or gray powder-coated steel tubing.
- Dumbbells: **rubber-hex** heads matte black (most common) or color-coded by weight (blue/yellow/green/red/purple bands, common in commercial gyms) with a bright chrome or satin-steel handle; **cast-iron hex** (older style) uniform gloss/matte black; **urethane/premium** heads come in colored gloss finishes.
- Adjustable/selectorized dumbbells: black shroud with a colored (often red/orange) weight-selector dial, exposed silver weight plates when set light.

### Placement

Floor-resting. Home gym, garage, basement, spare bedroom, or a corner of a living room/bedroom in smaller homes. Bench pad ~430–460 mm off floor; rack tiers 250–1000 mm off floor by tier. No wall/ceiling mount variant in typical residential use (wall-mounted rack brackets exist but are niche — skip for v1).

### Active / interactive state

- Unpowered analog props — no HA entity naturally binds here. The natural hook is behavioral: an avatar using the bench/rack triggers the existing `exercise` anchor activity (already in `PHASE4_ACTIVITIES`) — dwelling near the rack/bench eases the avatar into a lifting pose (bent-arm curl loop or bench-press loop) rather than any change to the object itself.
- Optional prop-level "in use" tell: one dumbbell pair popped out of its rack slot while an avatar holds a matching pair in-hand during the exercise pose, and/or the bench backrest shown inclined rather than flat when "occupied."
- No seasonal/lighting variation needed.

### Variations & customizations

- Bench: flat-only (fixed) vs. adjustable FID vs. decline-capable (extra low foot bar).
- Rack: compact 2-tier home A-frame vs. commercial 3-tier horizontal vs. vertical single-column (space-saving apartment size).
- Dumbbell set size: small starter pair vs. full graduated rack set (5–8 pairs) vs. single adjustable/selectorized unit.
- Color-coded weight sets (rainbow bands) as a cosmetic rack option vs. all-black uniform set.
- Could pair with a barbell + weight-plate tree as a related but separate fixture for a fuller home-gym kit.

### Animation opportunities

- Idle: essentially static — a subtle specular glint sweep on chrome handles/rails on rebuild is the only "life" worth spending polish on, optional.
- Active (avatar-driven, via the `exercise` activity anchor): bicep-curl loop (forearm rotation at the elbow, alternating arms) while standing near the rack; bench-press loop while lying on the bench (arms extend/retract above the chest, reusing the existing lying-pose root pitch); could support a seated dumbbell-row/shoulder-press variant on the bench. All reuse existing joint channels (elbow/shoulder/hip) — no new rig joints needed, following the same anchor-and-pose-blend idiom as other Phase-4 solo activities.

**Sources**: [Average Weight Bench Dimensions – Kalibre Fitness](https://kalibrefitness.com/average-weight-bench-dimensions/) · [Rugged Flat Incline Bench – Fitness Factory](https://fitnessfactory.com/item/rugged-flat-incline-bench/) · [Self Adjusting Flat/Incline Bench – Verta Fitness](https://vertafitness.com/products/adjustable-flat-incline-bench) · [Adjustable Bench – PRIME Fitness USA](https://www.primefitnessusa.com/products/bench) · [Understanding Weight Bench Dimensions – Mikolo](https://gym-mikolo.com/blogs/home-gym/understanding-weight-bench-dimensions-what-you-need-to-know-for-a-proper-fit-and-effective-training) · [3 Tier Dumbbell Rack – Force USA](https://www.forceusa.com/products/3-tier-dumbbell-rack) · [3-Tier Hex Dumbbell Rack – Rae Crowther](https://raecrowther.com/product/3-tier-hex-dumbbell-rack/) · [3-Tier Dumbbell Rack – Titan Fitness](https://titan.fitness/products/3-tier-dumbbell-weight-rack-1) · [TAG 3-Tier Horizontal HEX Dumbbell Rack](https://tagfitness.net/product/tag-3-tier-horizontal-dumbbell-rack/) · [Harbor 3-Tier Dumbbell Storage Rack](https://harborheavyweightsco.com/products/harbor-3-tier-dumbbell-rack) · [Rubber Hex Dumbbells – Valor Fitness](https://valorfitness.com/products/rubber-hex-dumbbells) · [Rubber Hex Dumbbells 2.5–125 lb – York Barbell](https://yorkbarbell.com/product/rubber-hex-dumbbell/) · [Valor Fitness 2-Tier Dumbbell Rack (BG-10)](https://valorfitness.com/products/bg-10-2-tier-dumbbell-rack) · [XPRT Fitness 2-Tier Compact Dumbbell Rack](https://xprtfitness.com/products/xprt-compact-heavy-duty-dumbbell-rack) · [Dumbbell Racks – Iron Company](https://www.ironcompany.com/strength-training-equipment/fitness-equipment-storage-racks/dumbbell-racks)

---

## Upright / grand piano and keyboard

### Typical dimensions

| Type | Width | Depth | Height |
|---|---|---|---|
| Spinet upright | ~1425–1450 | ~510–560 | ~900–1000 |
| Console/studio upright (common) | ~1450–1500 | ~600–650 | ~1050–1150 |
| Full/professional upright (e.g. Yamaha U/UX) | ~1500–1520 | ~610–650 | ~1200–1320 |
| Baby grand | ~1500–1520 (W) | ~1500–1750 (length, keyboard-to-tail) | ~1000 (closed lid) |
| Medium/parlor grand | ~1520 | ~1750–2130 | ~1000 |
| Concert grand | ~1520 | ~2130–2900 (up to 9'6") | ~1010–1020 |
| Digital keyboard, 61-key (with stand) | ~950–1000 | ~350–400 (~500 w/ X-stand) | key-bed at ~760 (seated height), stand ~700–780 total |
| Digital piano / keyboard, 88-key w/ stand | ~1300–1360 | ~300–420 | ~700–800 |

Grand-piano "width" above is the fixed keyboard-end width (88 keys ≈ constant ~1500 mm across all grand sizes); "depth" is the overall length from keyboard front to tail — grands are oriented with the long axis as depth in plan view, tail widening from a narrow front.

### Shape breakdown

- **Upright**: one tall vertical box (case) — front face (+Z) is the flat panel holding the keyboard; a shallow box lid/fallboard on top-front hinges up; keyboard is a thin wide box (or textured plane) inset ~150 mm below the top edge; two/three cylinder legs or a plinth box base; a thin box music desk tilted back on top-front; pedal lyre = small box/tapered cylinder cluster at floor level under the keyboard.
- **Grand**: the asymmetric wing shape is the hard part for primitives — approximate with a tapered box (wide flat front where the keyboard sits, narrowing/curving to a point at the tail), or two boxes: a rectangular keyboard block (front, +Z) fused to a large flat lid box wider at the back curve — many stylized approximations use a curved-corner flat slab (a scaled/rotated box or a half-cylinder blended into a box) on **3 cylinder legs** (two front corners, one at the tail point). The lid is a separate thin box, hinged along the long inner edge, propped open at an angle (a prop stick as a thin cylinder) for "performance mode." Add a cylinder piano bench with a padded box top nearby (not attached).
- **Keyboard (digital)**: a single low, long box body + inset lighter-toned key-bed strip (texture/decal rather than modeled keys at this scale) + optional thin box control-panel strip along the back edge; X-stand = two crossed flattened box/cylinder struts; furniture-style stand = 4 tapered cylinder legs under a box.

### Colors & finishes

- Ebony/satin black (most common, especially uprights and student grands), polished ebony (glossy black — high-gloss shader), walnut/mahogany/cherry wood tones, white satin/polish (popular for baby grands in modern interiors), and less common colors (red, blue) on specialty/keyboard-style digital pianos.
- Keys: white plastic + black sharps; older/vintage pianos may show ivory (cream) veneer keys.
- Metalwork: brass/gold-tone pedals, hinges, string plate visible under an open grand lid (bronze/gold cast-iron plate, silver/copper wound strings) — a nice detail patch if the lid is ever modeled open.
- Digital keyboards: matte black or dark-grey plastic bodies, occasionally white; control panel accents in silver/blue LED.

### Placement

- Floor-resting — uprights back against a wall (front clearance for player + bench, ~600–900 mm), grands free-standing away from walls (need clearance on all sides, often placed diagonally in a corner of a living room / music room / parlor).
- Digital keyboards on a floor-standing stand, or on a surface for portable 61-key units.
- Common rooms: living room, music/piano room, den, occasionally dining room or entryway for smaller uprights; digital keyboards anywhere flexible.
- Bench sits ~350–450 mm in front of the keyboard, seat height ~500 mm.

### Active / interactive state

- No power state for an acoustic piano — "in use" is an occupancy/activity cue (a seated figure = playing). For digital pianos/keyboards: power LED on control panel, backlit/glowing keys optional, screen glow.
- **Lid state**: grand lid closed vs propped open (prop stick angle) — open = "performance/practice" visual; upright fallboard open/closed over the keys similarly signals in-use vs stored.
- Sustain pedal could get a subtle depressed-tilt animation when "active."
- Could tie to an HA `media_player` or a "piano practice" input_boolean/scene to flip lid-open + bench pulled out.

### Variations & customizations

- Upright height tier: spinet / console / studio / full-size professional.
- Grand size tier: baby / parlor-medium / concert.
- Finish: ebony satin, ebony polish (glossy), walnut, mahogany, white satin/polish.
- Digital: 61-key portable (thin, no stand or X-stand) vs 88-key weighted (furniture cabinet style, closer to upright silhouette) vs stage piano on X-stand.
- Optional lid open/closed toggle, bench included/excluded, sheet music on the music desk as a decal.

### Animation opportunities

- Idle: none needed for the piano itself; ambient dust-mote/light glint on polished-black finish is a nice static-shader touch, not animation.
- Active (someone playing): seated humanoid at the bench with an arm/hand-oscillation "playing" pose anchored to the keyboard (reuse the existing seated-activity anchor system — a new `ActivityKind` e.g. `play_piano`), lid prop toggling between open/closed to mark session start/stop, optional subtle sustain-pedal dip synced to the same activity blend, and a thought-bubble glyph (🎵/🎹) tier already supported by the bubble-pool system for a nearby idling figure "enjoying the music."
- Grand lid could ease open (rotate about the hinge edge) when the anchor activity engages and ease closed after dwell ends, matching the appliance-door-blend idiom already used for fridges/dishwashers.

---

## Guitar and instrument stand

### Typical dimensions

Stand hardware; the guitar itself is a separate prop — full-size acoustic/electric ≈ 1000–1030 mm overall length, ~300–405 mm lower-bout body width, ~50–130 mm body depth.

| Variant | Footprint (W×D) | Height | Notes |
|---|---|---|---|
| Compact wire A-frame (JamStands JS-AG75 style) | ~310×260 mm | 350–370 mm | Folding wire legs, 5 width notches |
| Standard folding A-frame (Amazon Basics / Foraineam) | ~290–330×310 mm | 380–420 mm | Most common floor stand; padded yoke |
| Tall / bass A-frame (JS-AG100 style) | ~330×350 mm | 580–790 mm (telescoping) | Taller yoke arm for bass guitars |
| Multi-stand rack (3–5 instrument) | 700–1200×400 mm | 900–1000 mm | Row of A-frame cradles on a shared rail/base |
| Wall hanger (yoke/hook style, e.g. K&M 16280, String Swing) | 90–160 mm deep, ~90–140 mm wide | mounts ~150–250 mm tall bracket | Single wall bracket, cradles neck at the headstock |

### Shape breakdown

- **Floor A-frame**: two splayed tube "legs" forming an inverted-V (2 thin cylinders, ~15–20 mm dia, raked ~15–20° from vertical) meeting a short vertical center post (cylinder) that carries a padded **yoke** — a shallow U-shaped cradle (two short angled cylinders or a torus-segment) at ~350–450 mm height where the guitar body rests. A horizontal **neck strap/bar** (thin box or cylinder) sits low across the front (local +Z, ~80–120 mm off the floor) restraining the headstock/neck. Rubber foot caps = small spheres/cylinders at each ground-contact point. Front face (+Z) is the open side facing the room where the guitar's face shows.
- **Multi-stand rack**: repeat the yoke+neck-bar unit at even spacing along a shared base rail (long low box), offset so bodies fan out slightly.
- **Wall hanger**: a single wall-mounted bracket — a flat backplate (thin box against the wall) with a forward-projecting curved cradle arm (cylinder or two angled cylinders forming a shallow hook) that the guitar's neck rests in behind the nut.
- **Guitar prop** (if modeled): body = a flattened, waisted box/cylinder hybrid (or two overlapping cylinders for the "figure 8" bout), neck = a long thin box tapering slightly, headstock = a small flared box at the neck end, 6 strings = thin cylinders/lines along the neck+body face.

### Colors & finishes

- Stand hardware: matte black powder-coated tube steel (most common), some chrome/silver, wire-frame stands in black or silver; yoke pads and neck-rest padding black or grey foam/rubber.
- Wall hangers: natural or dark-stained hardwood (walnut, maple, oak) backplates with black felt/cork-lined cradle, or all-black powder-coated steel bracket.
- Guitar prop palette: sunburst (amber-to-brown gradient), solid black, cream/white, natural wood tan, red (Fender-red / wine), with a black pickguard and chrome/gold hardware accents.

### Placement

Floor-standing (A-frame, rack), freestanding against a wall or beside furniture, typically in a living room, bedroom, home studio/music room, or den; footprint counts as small furniture. Wall hanger variant mounts on the wall — bracket placed so the guitar's lowest point clears the floor by ~600–900 mm (bracket itself ~1400–1700 mm off floor for an adult-reach hang). No ceiling-hung or built-in variants are common.

### Active / interactive state

Mostly a static display prop — no powered state. Possible "interactive" hooks: toggle between "guitar present on stand" vs "empty stand" (tied to a person leaving/arriving, or a simple click-to-toggle like the fireplace/appliance local-state pattern) — an empty stand reads as "guitar in use / being played elsewhere." Could also pulse a subtle highlight when a bound `person`/practice-room automation is active, similar to the activity-glow treatment used for appliances.

### Variations & customizations

- Stand style: compact wire A-frame / padded standard A-frame / tall bass stand / multi-instrument rack (2–5 slots) / wall hanger.
- Instrument type on the stand: acoustic guitar, electric guitar (slimmer body), bass (longer, larger body), ukulele (scaled-down mini variant), banjo (round body).
- Finish options as above (black steel / wood / chrome; guitar body color).
- Rack size (2, 3, or 5-instrument variants) as a width multiplier.

### Animation opportunities

- Idle: none needed for the stand itself (static furniture); if a guitar prop is present, a very subtle idle sheen/rim-light catch could sell "polished wood" but isn't necessary.
- Active: an avatar activity anchor — "play guitar" — like `browse_bookshelf`/`tend_plant`: a seated or standing avatar near the stand picks up the guitar (guitar prop reparents/hides from the stand, appears held against the avatar's torso) with a strumming-arm animation (shoulder/elbow oscillation) for a few seconds, then returns it (empty-stand state toggled back). Simpler v1: just swap "guitar present" vs "guitar removed/leaning elsewhere" as a static state change tied to dwell/activity triggers, no held-prop rig needed.

---

## Children's toy box and toys

### Typical dimensions

| Variant | Width | Depth | Height |
|---|---|---|---|
| Compact | 760 mm (30") | 400 mm (16") | 400–450 mm (16–18") |
| Standard | 900–930 mm (36") | 460 mm (18") | 460 mm (18") |
| Oversized/bench-style | 1000–1050 mm (40–41") | 470–500 mm | 460–500 mm |

Lid thickness ~20–30 mm; walls ~15–20 mm (panel construction). A softer "toy bin" variant (no lid) runs smaller: ~500×350×350 mm.

### Shape breakdown

- **Body**: one box, hollowed visually by a slightly-inset lighter-toned box (or just a flat-shaded top rim) to suggest interior cavity — no need for true geometry hollowing.
- **Lid**: a slab box (full W × D × ~30 mm) as a separate mesh, pivoted along the rear top edge (local rotation about the back-top hinge line, local −Z = front). Closed = flush on top; open = swung back toward vertical (~70–100°, using the fireplace/door-panel hinge idiom already in the codebase).
- **Optional feet**: 4 small cylinder or box feet (~30 mm) if styled as furniture-grade; flat-bottom for the plastic bin variant.
- **Front face** (local −Z): often a printed/decal graphic band (animal face, alphabet, castle silhouette) — approximate as a flat colored rectangle/decal plane, no geometry needed.
- **Handles**: two small cutout or cylinder handles on the left/right sides at mid-height (optional, cosmetic).

### Colors & finishes

- Painted wood: pastel primary palette (red/blue/yellow/green), white, or natural/honey-stained wood grain.
- Plastic bin variant: bright single-color (translucent or opaque), molded character branding.
- Fabric/canvas pop-up hamper: printed pattern, collapsible drum shape (cylinder instead of box, no lid, floppy fabric rim) — a fun alt-primitive variant.
- Common accent: stenciled name or animal decal on the lid top.

### Placement

Floor-resting, against a wall in a kid's bedroom or playroom; also common in a family/living room corner or under a window. Sits directly on the floor, elevation 0; clear ~150 mm in front for the lid swing arc if animated open.

### Active / interactive state

- **Lid open/closed** is the primary state — could bind to nothing (decorative) or to a `binary_sensor`/manual toggle (like the fridge-door idiom) so clicking pops the lid open, revealing a jumble of toy props inside (small primitive shapes: a ball sphere, a block cube, a stuffed-animal blob) rendered only when open.
- Could pulse/highlight briefly when a "toys picked up" automation fires (tidy-up cue), or glow softly at night as a nightlight easter egg (optional, not standard).
- No power state — purely mechanical.

### Variations & customizations

- **Style**: painted wood chest (classic), plastic bin (modern/budget), canvas pop-up hamper (soft, collapsible), toy bench (padded lid doubles as seating — pairs with the existing `seat` furniture metadata).
- **Size**: compact / standard / oversized as above.
- **Decal theme**: dinosaurs, princess/castle, alphabet blocks, sports, plain solid color.
- **Lid style**: flat slab, domed/barrel-top (half-cylinder on top of the box lid), or no lid (open bin/basket).

### Animation opportunities

- Idle: gentle dust-mote/sparkle particle occasionally (whimsical, optional); toys inside subtly bob at rest.
- Active (interaction): lid swinging open/closed on click/dblclick (hinge-pivot animation, same envelope idiom as fridge/appliance doors — ease over ~0.3–0.5 s); a spilled/scattered toy beside the box (static prop) that could be added/removed as a "mess" decoration toggle.
- Occupancy tie-in: a child humanoid rig dwelling nearby could trigger a "play" idle-fidget one-shot (kneel/reach animation) — fits the existing idle-fidget picker pattern rather than needing new joints.
- Seasonal: swap decal/color theme (e.g., a toy bench with holiday-print lid) as a purely cosmetic recolor, no new geometry.

---

## Pet bed, crate, litter box, and food bowls

### Typical dimensions

W × D × H in mm; oval/round pieces given as diameter × height.

| Item | Variant | Dimensions (mm) |
|---|---|---|
| Dog bed (rectangular bolster) | Small (dogs <11 kg) | 457 × 610 × 90 |
| | Medium (<27 kg) | 686 × 914 × 100 |
| | Large (<43 kg) | 686 × 1168 × 100 |
| | XL (<68 kg) | 889 × 1143 × 100 |
| Cat/small-pet donut bed | Small | Ø 480–500 × 150 |
| | Standard | Ø 500–610 × 150–200 |
| Wire dog crate | Small (24″) | 610 × 457 × 533 |
| | Medium (30″) | 762 × 533 × 610 |
| | Large (36″) | 914 × 610 × 686 |
| | XL (42″) | 1067 × 686 × 762 |
| | Giant (48″) | 1219 × 762 × 838 |
| Litter box, open pan | Standard | 406 × 356 × 200 |
| | Jumbo | 560 × 460 × 230 |
| Litter box, hooded/covered | Jumbo | 594 × 490 × 470 (dome roofline) |
| Elevated food/water bowl stand | Small/med dog | 550 × 260 × 180–230 (stand top) |
| | Large dog | 600 × 300 × 250–330 |
| Single bowl (steel/ceramic) | Standard | Ø 250–280 × 75–90 |

### Shape breakdown

- **Dog bed**: flattened torus/rounded box for the bolster rim (extruded rounded-rect profile, ~90–100 mm thick) + a slightly recessed flat box/cylinder cushion insert as the sleeping pad, sunk ~20–30 mm below the rim top. Front = the low/open side if it has one gap in the bolster (many are fully enclosed, no gap needed).
- **Cat donut bed**: single torus (or a squashed sphere ring made from a cylinder minus a smaller cylinder) on a flat cylinder base pad; radially symmetric, no strict front face.
- **Crate**: box shell built from thin flat panels (5–8 mm) on 5 sides, wire-look achieved with a grid-pattern texture/alpha map rather than modeling bars; front face is an open door panel — a separate thin box/frame rotating ~100–110° about a vertical edge hinge (open) or sitting flush (closed), plus a floor pan (flat box, slightly inset) and optional low bolster/pad box inside.
- **Litter box, open**: a shallow open-top box with slightly outward-flared walls (trapezoidal box or box with beveled top edge) — front is the low entry lip if it's a low-front style; add a thin "sand" plane inset ~30 mm from the rim as the litter surface (color/texture swaps for clean vs. used).
- **Litter box, hooded**: base = open-pan box as above; hood = a half-cylinder or dome (half-sphere flattened) over the back 2/3, with a rectangular cutout for the front entry (front = the open archway) and a small swinging flap box hinged at the top of the entry; a cylindrical carbon filter cap often on the roof.
- **Elevated bowl stand**: flat box or shallow-arch box base/platform, 2 circular cutout collars (thin ring/torus) sized to seat two bowl cylinders (shallow wide cylinder, slightly domed inner face or a cone-frustum bowl profile) — front is open.
- **Single floor bowl**: cone frustum or shallow cylinder with a slightly concave top face (a thin inset cylinder cap), optionally on a thin rubber base ring (flattened torus/cylinder, contrasting dark color).

### Colors & finishes

- Beds: neutral upholstery tones dominate (grey, tan/oatmeal, navy, sage, charcoal), plush faux-fur or ribbed/corduroy texture on the bolster; nylon/canvas ripstop or waterproof-liner beds in brighter solids (teal, red) for outdoor/washable lines; wicker-look basket beds (tan/brown woven texture) are a common variant.
- Crates: matte black or white epoxy-coated wire (grid look), charcoal/graphite plastic (airline/travel crates), and furniture-style crates finished as wood-tone cabinets (espresso, natural oak, white) that double as end tables — worth a distinct "furniture crate" skin.
- Litter boxes: mostly plastic in muted tones — grey, taupe, navy, sage green, white; hooded units often two-tone; stainless-steel/self-cleaning variants are brushed metal + black.
- Food bowl stands: stainless-steel bowls (default) in a black wrought-iron, raw wood, white-lacquer, or bamboo stand; ceramic bowls in glazed solid colors or patterned (paw prints, stripes).

### Placement

All floor-resting, no wall/ceiling mounting. Typical rooms: kitchen or mudroom/utility area (crate, food bowls, water bowl), a bedroom corner or living room (dog bed), and a bathroom, laundry room, or quiet closet/corner (litter box — cats prefer it away from food and foot traffic). Crate height above floor = the shell itself; door swings outward roughly to horizontal (~90°) or slightly past. Elevated bowl stands raise the bowl rim 180–330 mm off the floor by dog size; standard floor bowls sit flat, rim at 75–90 mm. Litter boxes are placed directly on the floor, ideally against a wall on 2–3 sides for privacy but not enclosed.

### Active / interactive state

- **Bed**: occupancy is the only "state" — show a pet lying/curled avatar anchored to the cushion (matches the existing SitSpot/lie-anchor idiom); an empty bed can subtly show a body-shaped impression via a darker cushion texture variant.
- **Crate**: door open/closed is the key toggle — could bind to a `binary_sensor`/`lock` or just click-toggle like other doors; a pet inside is a dwell/anchor state (small idle animations: ear flick, tail sway) reusing the pet quadruped "lie/curl" pose.
- **Litter box**: usage state could pulse a subtle "in use" glow when a pet anchor is active nearby (mirrors the appliance in-use LED idiom); a bound `sensor` (e.g., a smart litter box's last-used timestamp or weight) could drive a "needs cleaning" indicator (small icon/badge) if ever bound to an entity — otherwise purely decorative/unbound like most pet furniture.
- **Food bowls**: fill-level could be a simple decorative variant (empty vs. full bowl mesh swap) triggered by time-of-day or a bound `sensor` (smart feeder dispense count) — no HA entity is standard here, so treat as toggleable local-state like appliance doors (full/empty).

### Variations & customizations

- Bed: rectangular bolster vs. round donut vs. flat orthopedic mat vs. elevated cot (fabric stretched over a low metal frame — legs = 4 thin cylinders, ~150 mm).
- Crate: wire vs. plastic/travel (rounded-corner box shell, side vents as texture) vs. soft-sided pop-up (fabric-look, rounded box) vs. furniture-style end-table crate.
- Litter box: open pan vs. hooded vs. top-entry (a box with a circular/oval hole cut in the lid) vs. self-cleaning robotic (add a raised electronics housing + status light).
- Food bowls: single bowl, double bowl, elevated stand, gravity feeder (adds a big cylinder/cone hopper above the bowl), or a built-in cabinet-style feeding nook.
- Size scaling (S/M/L/XL) should scale primitive footprint AND height modestly (bigger crates get taller, not just wider) to stay visually plausible across pet sizes.

### Animation opportunities

- Idle: gentle "breathing" scale pulse on an occupied bed/crate cushion (reuse the humanoid breathing-scale idiom on the pet rig, not the furniture); food bowl liquid-surface shimmer (subtle shader/alpha flicker) if water bowl.
- Active: crate door swinging open/closed on toggle (hinge rotation, matches door-open animation conventions); pet entering/exiting crate or bed via the existing nav/anchor system (approach → dwell → curl/lie pose); litter box flap swinging on entry/exit for hooded models; bowl fill/empty swap or a quick "lap water" ripple ping when a pet anchors at the bowl briefly; a light "sparkle" or steam-poof VFX could mark "just cleaned" litter box state for a few seconds after a bound cleaning-cycle entity fires, echoing the fireplace-flicker/appliance-glow idiom already used for other bound fixtures.

---

## Laundry hamper / basket

### Typical dimensions

W × D × H, mm — footprint varies by shape more than a fixed W/D.

| Variant | Size | Notes |
|---|---|---|
| Compact round basket | Ø 400–460 × H 500–560 | Bathroom/bedroom, single-load |
| Standard round/oval hamper | Ø 460–610 × H 610–710 | ~1.5–2 bushels (~53–71 L) |
| Rectangular basket (open) | 610–660 × 430–480 × 250–350 | Classic molded-plastic carry basket, handles at short ends |
| Tall lidded hamper | 400–450 × 400–450 × 700–800 | Trash-can-like column, hinged or lift-off lid |
| Wheeled sorter/bin (e.g. IKEA ENHET/FYLLEN-style) | ~600 × 400 × 600–650 | On casters, sometimes multi-bin for sorting |
| Collapsible mesh/fabric pop-up | Ø 380–450 × H 550–650 | Springs flat to a ~30 mm disc for storage |

### Shape breakdown

- **Round/oval basket**: single tapered cylinder (slightly wider at top than base — two stacked cylinders of increasing radius, or one cylinder + a thin torus-like rim ring) sitting directly on the floor. No separate lid.
- **Rectangular basket**: one open-top box with slightly tapered walls (or straight walls for a stylized look); two small box/cylinder cutout handles at the short ends (faked with thin bar geometry rather than true holes) — these read as the "front/back" cues, so pick either long face as **front (+Z)**.
- **Tall lidded hamper**: a cylinder or rounded box body + a flat disc/box lid as a separate primitive offset for a hinge pivot at the back edge (rotate to open, like the fridge/appliance door pattern) or a simple lift-off cap (translate straight up when "open").
- **Wheeled sorter bin**: a box body (often 2–3 compartments — add a thin vertical divider box down the middle for a dual-sorter look) + 4 small cylinder casters at the base corners; sometimes a flip-top box lid per compartment.
- **Collapsible mesh pop-up**: a tapered cylinder shell (thin-walled, slightly bulging sides) with a fabric-look drawstring rim (thin torus/ring at the top edge); no rigid lid — a fold-flat "collapsed" alt state is the same cylinder scaled to ~5% height.
- Front face convention: for basket/hamper shapes without an obvious front, treat the handle axis or lid-hinge side as **+Z front**.

### Colors & finishes

- Woven look: natural rattan/seagrass tan, water-hyacinth brown, whitewashed wicker.
- Molded plastic: white, cream, grey, black, pastel (mint, blush), often with ventilation slot texture (alternating-color horizontal bands or a subtle stripe texture).
- Fabric/mesh pop-ups: canvas colors (navy, grey, olive) or printed patterns; foldable frame edge in a contrasting color (grey/white plastic rim wire).
- Metal wire hampers: chrome or matte-black wire-frame look (solid but lower opacity read to suggest lightweight).
- Wood-slat hampers: light oak/walnut stained slatted box, sometimes with a linen liner bag visible at the rim (a soft cream cylinder inset).

### Placement

Floor-resting, always. Common rooms: bathroom (corner, near shower/vanity), bedroom (closet or corner), laundry room (multiple, often lined up or built into cabinetry/wheeled sorters that dock under a counter). Not wall-mounted or ceiling-hung in normal residential use. Sits flush on floor, y = 0 base.

### Active / interactive state

- **Fullness**: the most useful "state" — a low fill level (empty, floor of basket visible) vs. an overflowing pile of clothes (a soft lumpy mound of mixed-color boxes/rounded blobs poking above the rim). Could bind to nothing in HA directly, but could animate a slow "fill" over time for liveliness, or tie to a virtual laundry-day routine.
- **Lid open/closed**: for lidded hampers, an open lid (rotated back ~100–120°) signals "in use"/being loaded; closed is the idle/default resting state.
- **Wheeled bin**: casters imply it can be nudged/dragged — a subtle rock or roll-wobble on interaction would read well.
- No HA entity typically binds here (a passive prop) — but an avatar "doing laundry" activity anchor (like `load_dishwasher`) could target it, dwelling nearby with a stooped "load basket" pose.

### Variations & customizations

- Shape: round, oval, rectangular, tall-cylindrical.
- Lid: none / hinged flip-top / lift-off cap.
- Material look: woven natural, painted wicker, molded plastic, mesh/fabric pop-up, wire-frame, wood-slat.
- Single vs. multi-compartment (sort by color/darks-lights).
- Static floor basket vs. wheeled/casters.
- Liner bag visible at rim (cloth bag peeking over edge) as an optional detail primitive.

### Animation opportunities

- Idle: gentle sway/creak on wicker/wire types when "bumped" (near a walking avatar path, a tiny wobble); fabric pop-up rim breathing very subtly; laundry pile could have a slow bobbing top item to avoid a totally static prop.
- Active: lid swinging open/closed (hinge rotation) when an avatar activity anchors here; fill level rising in discrete steps to simulate someone tossing clothes in (small box/blob added or scaled up in the pile each "toss," with a brief toss-arc for a piece of clothing flying from an avatar's hand into the basket); wheeled sorter casters spinning briefly if nudged; collapsible basket popping open (fast scale-up from flat disc to full height) as a fun one-shot when first placed/interacted with.

---

## Ironing board & drying rack

Two slender folding-frame textile-room objects, commonly modeled as a matched pair (utility/laundry room, closet, or bedroom corner) since they share a fabric-over-metal-frame construction language and both fold flat against a wall when not in use.

### Typical dimensions

| Item | Variant | Width | Depth | Height | Notes |
|---|---|---|---|---|---|
| Ironing board | Compact/small | 330 mm | 1345 mm (length) | 685–990 mm (adjustable legs) | board surface only ~13"×53" |
| Ironing board | Standard/full | 380 mm | 1370 mm (length) | 685–990 mm adjustable | most common; legs telescope, board tilts to ~level |
| Ironing board | Wide | 457 mm | 1245 mm (length) | 685–990 mm | shorter but wider, more stable |
| Ironing board | Tabletop/mini | 305 mm | 813 mm (length) | ~150–250 mm (own short legs) or set on counter | no full-height legs |
| Drying rack (gullwing/A-frame) | Standard folding | 1000–1750 mm wide (unfolded) | 500–650 mm deep (unfolded) | 900–1000 mm | folds to ~100 mm deep, wheeled models add casters |
| Drying rack | Tall/adjustable | 720–900 mm wide | 400–500 mm deep | 1140–1330 mm (telescoping) | taller "gullwing" style with extra tiers |
| Drying rack | Wall-mounted folding | 600–900 mm wide | 50–100 mm deep folded / 400–500 mm deployed | mounts at 1500–1800 mm | accordion arms fold flat to wall |

### Shape breakdown

**Ironing board:**
- Board top: one flattened, tapered box — wide/rounded at the back (~380 mm), narrowing to a rounded point at the front nose (~150 mm) at local +Z. A single scaled/tapered box or two boxes (rear rectangle + a squashed cone/wedge nose) reads fine at this scale.
- Board surface: a ~30–40 mm thick padded top (lighter cover-color box layer) over the bare-metal understructure.
- Legs: an X-frame — two long thin cylinders (or thin boxes) crossing under the board, pinned at a visible hinge (small cylinder) at the crossing point; 4 short cylinder feet with small rubber-tip caps (dark grey/black spheres or short cylinders).
- Iron rest (optional add-on): small wire cylinder-frame ring at the tail end (rear, local −Z), sometimes with a heat-resistant pad box.
- Front face: the pointed nose end (+Z) — where a person stands and works.
- Static object; no moving parts strictly needed for the base model (legs can be a fixed "set up" pose — folding animation is a nice-to-have).

**Drying rack:**
- Two (or three) A-frame/gullwing panels: each panel = a set of parallel thin horizontal cylinders (drying bars, ~15–20 mm dia, spaced ~60–80 mm apart) connecting two vertical thin cylinder/box end-frames, the whole panel tilted outward from a central top hinge (small cylinder) like an easel/gullwing.
- Base: two or four short angled cylinder legs splaying out from the bottom hinge for stability, sometimes with small caster wheels (flattened spheres/cylinders) at the feet.
- Wing/side racks: smaller fold-out arm assemblies (a few short parallel cylinders on a hinge) attached to the ends of the main panels for socks/small items.
- Wall-mounted variant: a single flat back-plate box against the wall with 3–5 parallel accordion arms (thin cylinders linked by short box brackets) that swing out from vertical (folded, flush) to horizontal (deployed).
- Front face: doesn't strongly have one — symmetric/bilateral; treat local +Z as the side a person approaches to hang/remove laundry (the open face between the two leaning panels).

### Colors & finishes

- Ironing board frame/legs: chrome or painted steel tubing — silver, white, or grey; some black.
- Ironing board cover: printed/patterned cotton-poly (florals, stripes, gingham, metallic silver heat-reflective) or plain solid — white, grey, blue, silver most common; padding foam layer visible as a thin white/cream edge.
- Drying rack frame: epoxy-coated steel or aluminum tube — white, chrome/silver, grey, black, occasionally pastel (mint, sage); wood-dowel bars on premium wall-mounted wooden racks (natural pine/beech, walnut stain).
- Bar/dowel material on wire racks: white or grey plastic-coated wire, or bare metal bars.
- Rubber feet/caster wheels: black or dark grey.

### Placement

Floor-resting for both in their deployed/standing state — ironing board legs planted on floor; drying rack legs/casters on floor. Both are also commonly stored **folded**, either leaning flat against a wall/inside a closet or hung on a wall bracket/door hook (ironing boards often have a dedicated wall-mount bracket, hanging ~1400–1700 mm high by the top edge) — worth offering a "wall-stored, folded" placement variant distinct from the "deployed" one. Wall-mounted folding drying racks are a true wall fixture: back-plate mounted around 1500–1800 mm height, arms swing out horizontally into the room. Typical rooms: laundry room, utility/mud room, closet, bathroom, garage, bedroom corner.

### Active / interactive state

- Ironing board: "in use" state = an iron prop resting on the board (small wedge/cone-nose box with a cylinder handle) plus a draped fabric/garment mesh-plane over one end; steam wisp (soft particle/sprite puff) could indicate active pressing. Idle state = bare board, possibly with a basket of laundry nearby.
- Drying rack: "in use" = draped fabric planes (simple curved/sagging quads or thin boxes) hung over several bars, varying in count/color to show partial vs. full load; could add a subtle "damp" darker tint on hung items vs. bright "dry" tint over time to imply progress.
- Neither is HA-entity-driven in the usual sense — best treated as ambient/decorative props whose "loaded" state is either randomized/time-seeded (like the bed-cover idiom) or toggled by an unbound `localState` for a lived-in look, rather than bound to a real entity.

### Variations & customizations

- Ironing board: compact / standard / wide / tabletop-mini; with or without iron rest; with or without a small side shelf for spray bottles; folded-and-stored vs. deployed.
- Drying rack: A-frame gullwing (2–3 panel) / tall telescoping tower / wall-mounted accordion / tabletop mini rack; with or without caster wheels; with or without wing extensions; wood vs. metal frame finish.
- Cover/frame color options as a simple palette swap (matches the existing per-fixture tint pattern used elsewhere in Diorama).

### Animation opportunities

- Idle: draped-fabric planes on the drying rack could get a very slight sway (low-amplitude sine offset) to read as lightweight cloth, echoing the existing bed-blanket "breathing" vertex-displacement idiom.
- Active-use one-shot: a rig-anchored `iron_clothes` activity (person standing at the board, forearm IK similar to the existing table-arm solve, small back-and-forth hand sweep over the board) — fits the existing solo-activity anchor system (like `make_coffee`/`load_dishwasher`).
- Fold/unfold transition: legs or gullwing panels animating between stored-flat and deployed angles would be a satisfying but optional flourish (mirrors the existing appliance-door ease-blend idiom — a fixture-id-keyed blend between two pose states).
- Steam puff sprite while "ironing" is active, reusing the existing sprite/particle patterns (fireplace flicker / weather particle idiom) at small scale.
- Laundry appearing/disappearing on the rack over a slow multi-hour cycle (fresh damp → dry) as a subtle time-of-day-linked color/opacity fade, echoing the puddle-fade or bed-cover persistence pattern already in the renderer.

**Sources**: [Ironing Board Size Guide](https://ironinglab.com/ironing-board-size/) · [Ironing Board Sizes – Westex International](https://www.westex-intl.com/blogs/news/ironing-board-size-chart) · [Ironing Board Size Guide – bestadvisorz](https://bestadvisorz.net/ironing-board-size/) · [Ironing Board Sizes (Dimensions Guide)](https://designingidea.com/ironing-board-sizes/) · [Amazon Basics Foldable Portable Metal Clothes Drying Rack](https://www.amazon.com/AmazonBasics-Foldable-Drying-Rack-Chrome/dp/B00H7P1G7C) · [Wooden Wall-Mounted Drying Rack – Woodesa](https://woodesa.com/products/wooden-wall-mounted-foldable-drying-rack) · [Drying Racks Dimensions & Drawings – Dimensions.com](https://www.dimensions.com/collection/drying-racks) · [White Heavy-Duty Folding Gullwing Laundry Drying Rack](https://honeycando.com/products/collapsible-folding-clothes-drying-rack)

---

## Upright and robot vacuum, cleaning supplies

### Typical dimensions

| Item | Width | Depth | Height |
|---|---|---|---|
| Upright vacuum (standard) | 300–400 mm (body ~300; handle sweep wider) | 250–300 mm (base/nozzle) | 1100–1150 mm (handle upright) |
| Upright vacuum (compact/stick) | 250 mm | 200 mm | 950–1100 mm |
| Canister vacuum (body, on floor) | 300–380 mm | 300–380 mm | 250–300 mm (+ separate wand/hose) |
| Robot vacuum (disc) | 330–355 mm diameter | same (circular) | 85–95 mm (S-series/D-shaped variants ~92 mm tall, 310–355 mm wide with a flat front) |
| Robot charging dock (basic) | 150–220 mm | 120–180 mm | 120–200 mm |
| Robot self-empty dock (tower) | 350–430 mm | 350–430 mm | 400–500 mm |
| Broom (upright, leaning) | 280–320 mm (head) | 30–40 mm (handle dia.) | 1400–1500 mm handle length |
| Mop (upright, leaning) | 120–150 mm (head) | 30–40 mm (handle dia.) | 1400–1500 mm handle length |
| Mop bucket + wringer | 350–450 mm | 300–380 mm | 550–870 mm (bucket body 250–300, + wringer top) |
| Cleaning caddy (tote) | 350–400 mm | 220–260 mm | 250–300 mm (+ 150 mm handle arch) |

### Shape breakdown

- **Upright vacuum**: tall thin box body (motor housing) tilted ~10–15° back from vertical, mounted on a wide flat box base/nozzle (cleaning head) with two small cylinder wheels at the rear corners and a front swivel sphere/small cylinder caster. A cylinder handle post rises from the body to a horizontal grip cylinder at the top. A cylinder dust bin/canister (clear or colored) clips to the body front — front face (+Z) is the side the handle grip curves toward, i.e. where the user stands. Bagged models: flat rectangular bag box on the back instead of a canister.
- **Robot vacuum**: one flat cylinder (disc, ~340 mm dia × 90 mm tall) — or for D-shaped models, a cylinder with the front third clipped flat (a box bite, or just use a true cylinder for simplicity). Top face carries a small raised cylinder "bump" (lidar turret, off-center) on nav models. Front face (+Z) has a shallow darker-toned band wrapping the front 120° arc suggesting the bumper. Charging dock: a slim vertical box (back panel, slightly backward-leaning) on a flat box base plate with two small cylinder/box charging contacts; self-empty towers add a tall box/rounded-top cylinder canister body stacked on the same base.
- **Broom/mop**: a long thin cylinder handle; broom head = a flared box or trapezoid (wide flat fan) capped with a thin bristle-texture band (color-only, no extra geometry needed); mop head = a shorter wide box with a fuzzy/string texture tint, or a flat box for a flat/microfiber mop pad. Typically shown **leaning against a wall** at ~15–20° from vertical, resting on the floor.
- **Mop bucket**: tapered cylinder or box bucket body (wider at top), with a cylinder/box wringer unit clipped to the rim on one side and a thin cylinder bail handle arcing over the top. Optional 2–4 small cylinder casters at the base.
- **Cleaning caddy**: a shallow open box (tote) with a raised arched cylinder/thin box handle over the top; optionally 3–4 small cylinder bottle props standing inside for detail.

### Colors & finishes

- Upright/canister vacuums: most commonly **black, red, purple, or two-tone gray/white** plastic bodies (Dyson purple/nickel, Shark gray/rose gold, Hoover red) with a clear or smoke-tinted plastic dust canister; matte body plastic + glossy accent trim band.
- Robot vacuums: predominantly **matte black or white/cream** top shell, glossy black sensor bump, thin metallic trim ring around the edge; some mid-tier models in silver/gray.
- Charging docks: match the robot — black or white plastic, minimal.
- Brooms/mops: wood or brightly colored (blue/green/yellow/red) plastic handles; broom bristles natural tan/straw or synthetic black/yellow; mop heads white/gray (string) or blue/green (microfiber flat pad).
- Mop buckets: yellow (janitorial-standard, OSHA "wet floor" color) or gray/blue plastic; caddies gray, yellow, or red plastic.

### Placement

Floor-resting, always. Uprights/canisters/brooms/mops typically stored leaning in a corner, utility closet, pantry, or against a wall near the kitchen/laundry/garage — set-dressing for realism. Robot vacuum + its dock live on the floor against a wall or under/beside furniture (living room, kitchen, hallway) — dock is typically flush to a wall, robot parked docked or shown mid-room when "cleaning." Mop buckets/caddies rest on the floor, usually kitchen, bathroom, laundry, or utility/garage area. None of these are wall-mounted or ceiling-hung in typical residential use (a broom/mop **holder clip** on the wall is an optional wall-mount variant, holding the handle horizontally at ~1200–1500 mm height).

### Active / interactive state

- **Robot vacuum** is the item most worth animating — it's the one that visibly moves through the house. When "cleaning" (state on): drive it along a wandering/serpentine path at slow speed (~0.2–0.3 m/s equivalent), tiny idle wheel-spin, subtle random turns; a soft ambient LED ring/turret light color (blue pulse = cleaning, green = docked/charging, red/amber = error/stuck, blinking = returning to dock). When docked/idle: static, dock's LED small solid green glow. Self-empty tower can pulse a light + brief "vwoosh" moment (a couple of dust-mote particles pulled up) at empty-cycle time.
- **Upright/canister vacuum**: essentially a static prop; could subtly rock/vibrate + show a faint headlight glow at the nozzle when bound to a "vacuum running" input_boolean, or just remain a still furnishing item (lower priority for animation).
- **Mop bucket**: could show a water-tint level in the bucket cylinder as a "full/empty" toggle state; otherwise static.
- **Broom/mop/caddy**: purely static set-dressing.

### Variations & customizations

- Upright vs. canister vs. cordless-stick vacuum body style.
- Robot vacuum: round vs. D-shaped (flat-front), with/without visible lidar turret bump, with/without self-empty dock (compact charger vs. tower).
- Dust bin: bagged (fabric bag on back) vs. bagless (clear cyclone canister).
- Broom head: angled/flared vs. straight; mop head: string vs. flat/microfiber pad.
- Bucket: single-compartment vs. dual-compartment (clean/dirty water) mop systems, with/without wringer, with/without casters.
- Caddy: open tote vs. multi-bottle rack.
- Color presets per brand-flavor (black/red uprights, black/white robots, yellow buckets).

### Animation opportunities

- **Robot vacuum** (highest value): path-following drive animation, wheel rotation, LED state color (cleaning/charging/error/returning), docking/undocking sequence (drives to dock, contacts, LED turns solid), random object-avoidance turn wiggles, self-empty tower suction pulse.
- Idle robot at dock: slow "breathing" LED pulse.
- Upright vacuum: optional headlight glow + faint body vibration when toggled "running"; cord sway skipped (not worth the rig).
- Mop bucket: water-level fill toggle (empty/full) as a simple color-band state.
- Everything else (broom, mop, caddy): static — no animation needed, just believable leaning/resting poses for scene richness.

> **Note**: Robot vacuum and lawn mower fixtures already ship in Diorama as `RobotFixture` (`Floor.robots`, tool `robot` 🤖) with a full planner-driven movement controller (`Planner.stepRobots`), LED palette (`robotLedColor`), and docking behavior — see `test-pages/robot-test.html`. This section documents the household-object researched here for cross-reference; implementers should reuse the existing `RobotFixture` system rather than building a second one.

**Sources**: [45L Rectangular Step Can with Liner Pocket — Simplehuman](https://www.simplehuman.com/products/rectangular-liner-pocket-step-can-45l) *(shared sourcing set with trash can section below)*

---

## Indoor trash can and recycling bin

### Typical dimensions

W × D × H, mm:

- **Small bathroom/office wastebasket**: 180 × 180 × 250–360 mm (1.5–3 gal), e.g. 178×178×254 mm
- **Standard bathroom**: 230 × 230 × 355 mm (4–6 gal)
- **Compact kitchen step can**: 320 × 300 × 620 mm (~30–38 L / 8–10 gal)
- **Standard kitchen step/sensor can**: 330–380 × 300–330 × 600–650 mm (45–58 L / 12–15 gal) — e.g. simplehuman 45L rectangular normalizes to ~355 × 330 × 650 mm
- **Dual-compartment recycler (kitchen)**: 470 × 330 × 630 mm (58 L, two inner buckets side by side)
- **Large freestanding office/utility bin**: 400 × 380 × 700–760 mm (30–32 gal stackable)
- **In-cabinet pull-out double bin**: 400 × 390 × 585 mm (two ~39 L buckets in a cabinet-height frame)
- **Round wastebaskets** (kitchen/utility): Ø 300–360 mm × 550–650 mm H

### Shape breakdown

- **Body**: one tapered box (kitchen rectangular cans — slightly wider at top, ~5–8° taper) or a tapered cylinder (round bins). Scale ~1.08× wider at top than base for the taper look; flat front/back/side faces are fine at low poly.
- **Base**: a slightly recessed/darker box or thin cylinder foot, 15–20 mm tall, inset 10 mm from the body edge (reads as the molded plastic foot ring).
- **Lid**: a shallow box (swing-lid/step can) or dome-topped cylinder cap (sensor cans), ~30–50 mm thick, on top of the body — the primary openable part. Step cans also get a thin foot-pedal box (60×40×15 mm) protruding from the front-bottom edge, connected to the lid by an implied linkage (no need to model the mechanism, just pedal + lid).
- **Front face** (local −Z per this repo's furniture convention — front = functional opening side): pedal foot pad and any handle/label face outward here. A push-swing lid (round bins) shows a hinge seam as a thin dark cylinder segment along the back top rim.
- **Recycling variant**: same body, add a thin colored inset panel (box, 2 mm proud) or printed emblem quad on the front face reading "recycling" — or model as two half-width bodies side by side under a shared or split lid (dual-compartment).
- **Liner rim**: a slim protruding lip ring (approximate with a slightly wider short cylinder band) just under the lid line, where the trash bag folds over.
- Total: **4–6 primitives** per can (body, base, lid, pedal, optional rim band, optional recycling label quad).

### Colors & finishes

- Kitchen: **brushed stainless steel** (light grey, subtle vertical brush noise texture) or matte black/white powder-coat plastic.
- Bathroom/office: white, grey, black, or bone plastic; sometimes wicker/rattan-look woven texture.
- Recycling-specific: **blue** body or blue lid/label (US convention) — sometimes green; often just a recycling-arrows decal on an otherwise neutral bin rather than a fully colored body.
- Outdoor-adjacent utility bins (if reused indoors, e.g. garage): green (yard waste), grey/black (general).
- Materials to fake in toon shading: brushed metal (light grey + soft specular band), matte plastic (flat color, slightly darker base/lid than body).

### Placement

Floor-resting, always. Common rooms: kitchen (beside counter/sink or in a cabinet pull-out), bathroom (beside toilet/vanity), bedroom/office (beside desk), laundry room, garage/utility. Body sits flush on floor (no elevation); the in-cabinet pull-out variant is technically inside cabinetry (could be modeled `mountable`-style, elevation = 0, tucked against a counter/island footprint) but simplest as a normal floor placement near a counter kind.

### Active / interactive state

- **Lid open/closed**: step cans and sensor cans show the lid popped open (rotate the lid box up ~70–100° about its back-hinge edge, matching the door-swing/appliance-door idiom already in the codebase) when "in use" — could bind to a `binary_sensor` (someone approaching) or trigger briefly via foot-pedal press, then auto-close after ~2 s (soft-close ease).
- **Fullness**: an optional "full" state (no native HA entity typically, but if bound to a smart bin's fill-level sensor) could raise a visible overflow lump/tilt the lid ajar, or tint an LED ring red — mirrors the existing outdoor `trash_bin`/`recycle_bin` (`outdoor` cat) lid-props-open + overflow-lump pattern already used in this codebase; indoor variants should reuse that same prop logic (`FULL` state → lid props open + lump, matching `Furniture` state resolution via `effectiveState`/`localState`).
- **Sensor can indicator**: simplehuman-style sensor cans have a small dark IR-sensor dot near the top front — could pulse/glow briefly on "open" trigger.

### Variations & customizations

- **Step can** (foot pedal, hinged lid) — most common kitchen style.
- **Sensor/touchless can** (motion-activated lid, larger, taller, often dual-compartment) — premium kitchen variant.
- **Swing-top round bin** — classic push-lid, single or double swing flaps.
- **Open-top bin** (no lid) — common in bathrooms/offices/bedrooms.
- **Dual-compartment recycler** — two inner buckets (trash + recycling) under one wider lid/frame.
- **In-cabinet pull-out** — slides out from a cabinet, taller/narrower double-bucket frame, no visible outer shell in a room view (skip for freestanding kind, or offer as a kitchen-island/cabinet accessory).
- Size presets: **small** (bathroom, ~230×230×355), **standard kitchen** (~330×330×630), **large/dual** (~470×330×630).

### Animation opportunities

- Idle: none (static object) — best left static except for state-driven motion.
- Active (lid open on approach/use): lid swings open on a bound sensor/trigger, holds ~2 s, eases closed — same anchor-dwell idiom already used for solo standing activities (a passing avatar dwelling near the bin could trigger a `discard_trash`-style anchor lean-and-toss, reusing the `ENTITY_GATED_ACTIVITIES`/anchor pattern).
- Foot-pedal press: brief pedal-box dip (5–10 mm) synced with the lid-open trigger for step cans.
- Full-state: lid held slightly ajar + overflow lump pop-in (matches the existing outdoor bin full-state prop swap — build once, toggle visibility rather than rebuild).
- Recycling emblem: no animation needed — static decal/color is sufficient to read "recycling" vs "trash" at a glance.

**Sources**: [45L Rectangular Step Can with Liner Pocket — Simplehuman](https://www.simplehuman.com/products/rectangular-liner-pocket-step-can-45l) · [Rectangular Step Can, Brushed — Simplehuman](https://www.simplehuman.com/products/rectangular-step-can) · [58L Sensor Can, Brushed — Simplehuman](https://www.simplehuman.com/products/58l-sensor-can) · [58L Sensor Recycler, Brushed — Simplehuman](https://www.simplehuman.com/products/58l-sensor-recycler) · [In-Cabinet Pull-Out Waste & Recycling Bins — Rubbermaid](https://www.rubbermaid.com/trash-recycling/indoor-trash-cans/in-cabinet-pull-out-waste-and-recycling-bins/SP_4123877.html) · [Rubbermaid 30 Gal. Stackable Indoor Recycling Bin — Home Depot](https://www.homedepot.com/p/Rubbermaid-30-Gal-Stackable-Indoor-Recycling-Bin-1803654/203581847) · [Rubbermaid 7 Gal. Deskside Recycling Trash Container — Home Depot](https://www.homedepot.com/p/Rubbermaid-7-Gal-Deskside-Recycling-Trash-Container-2099559/309841363) · [How Big is a Standard Trash Can? — Trash Cans Unlimited](https://trashcansunlimited.com/blog/how-big-is-a-standard-trash-can/) · [Bathroom Trash Cans Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/collection/bathroom-trash-cans)

---

## Floor and table fan

### Typical dimensions

W×D×H mm — the fan is roughly axisymmetric (width ≈ depth = guard diameter).

| Variant | Guard/blade dia. | Base footprint | Height |
|---|---|---|---|
| Clip-on / mini desk fan | 130–200 mm | 150×150 mm clamp base | 200–300 mm |
| Table fan (standard) | 230–300 mm (9–12") | 250×250 mm weighted base | 350–450 mm |
| Pedestal / standing floor fan | 400–460 mm (16–18") guard | 380×380 mm cross-foot base | 950–1,400 mm, telescoping (most models 965–1,385 mm) |
| Tower fan (bladeless-look slim column) | 200×200 mm footprint | same | 1,000–1,300 mm |

### Shape breakdown

Front = local +Z, the direction air blows.

- **Base**: flat wide cylinder or 4-legged flat cross (two crossed flat boxes) for a pedestal fan; a rounded weighted disc/cylinder for a table fan; spring clamp (small box + curved bracket) for a clip fan.
- **Pole** (pedestal only): slim cylinder, often with a mid-height thumbscrew nub (small cylinder) for height adjustment.
- **Motor housing**: squat cylinder or capsule (cylinder + flattened hemisphere caps) at the top of the pole/on the table base, tilts on a vertical hinge for up/down angle.
- **Front guard cage + blades**: a large flat cylinder (guard silhouette) in a light metal/plastic tone, with a slightly smaller disc/cone behind it standing in for the blade hub — true individual wire-guard ribs and blades are overkill for the stylized primitive budget; a flat ring (thin torus-like cylinder shell or a disc with a darker inset circle) reads fine at Sims scale.
- **Rear guard**: a shallower matching disc behind the motor housing, same diameter as the front guard.
- **Control panel**: a small flat box on top of or behind the motor housing (speed dial or button row) — 2–3 tiny cylinder "buttons" or one dial.
- **Blade hub** (visible through the guard): small cone or flattened sphere, 3–5 thin flat blade paddles (thin box wedges) fanned around it — can be a single flattened cone with radial texture stripes if true blade geometry is too fussy.
- **Oscillation base plate** (pedestal/table): thin disc between motor and pole that yaws.

### Colors & finishes

Predominantly white or black plastic housing/base; guard cage bare or chrome-tone metal wire (light grey/silver) or matching white/black plastic; occasional retro finishes in brushed metal (silver), matte pastel colors (mint, cream), or "industrial" all-black/gunmetal for shop fans. Base often glossy plastic, guard matte-metal.

### Placement

Floor-resting (pedestal fans, tower fans) at natural base height 0 mm, motor head 950–1,400 mm up; or **mountable on a surface** (table/desk fans) on a desk, nightstand, or dresser top, adding the surface height (~700–750 mm) to the fan's own 350–450 mm; clip fans mount to a shelf/headboard edge. Common rooms: bedroom, living room, home office, garage/workshop. Not wall-mounted or ceiling-hung (that's the separate ceiling-fan item).

### Active / interactive state

- **Powered on**: blade hub spins continuously (fast-rotating cone/blade group about the local Z-front axis); a faint semi-transparent disc or motion-blur ring can substitute for actual blade animation at distance.
- **Oscillating**: the whole head (motor + guards + blade) yaws left-right ~±40–45° on a slow sinusoidal cycle about the vertical axis through the pole/base — independent toggle from power.
- **Speed levels**: 2–4 discrete speeds could scale blade rotation rate and add a subtle housing hum/vibration jitter at high speed.
- **Off**: blades static, angled slightly downward/idle tilt.
- Any LED indicator dot or lit dial ring on the control panel could glow at power-on, matching the "appliance in-use" LED convention already used for appliances.

### Variations & customizations

Pedestal (adjustable height) vs. table vs. clip-on vs. tower/column; guard-cage vs. bladeless (annular duct, no visible blades — a single smooth torus/ring shape with hidden internal blade); with/without oscillation; with/without remote (small flat rectangle prop dropped on a table); box fan (a plain flat square housing with front/back grilles, meant to sit in a window or on the floor) as an additional variant; color options white/black/silver/pastel; retro chrome variant.

### Animation opportunities

- Idle (off): none — fully static prop; blades resting at a random idle rotation angle set once at placement (deterministic per-fixture, not randomized per frame).
- Active: continuous blade-hub spin (fast, looping) about the front-facing axis; slow head oscillation sweep left/right when enabled; subtle whole-housing micro-vibration/jitter tied to speed; optional faint glow/pulse on a power/speed LED; for a pedestal fan, a one-time telescoping height animation could accompany a "height changed" property edit (not required, just a nice-to-have parity with other adjustable fixtures).

---

## Aquarium / fish tank

### Typical dimensions

External glass footprint, W × D × H — standard "long/high" glass tanks (actual dims vary ±5–10 mm by brand/wall thickness).

| Variant | W × D × H (mm) | Notes |
|---|---|---|
| Nano / desktop (5 gal) | ~410 × 205 × 255 | cube or small rectangle, common on desks |
| Compact (10 gal) | ~510 × 265 × 320 | most common starter size |
| Standard (20 gal Long) | ~770 × 320 × 325 | low, wide "long" profile — most common family display tank |
| Standard (20 gal High) | ~610 × 305 × 405 | narrower footprint, taller water column |
| Large (55 gal) | ~1220 × 330 × 535 | classic "big tank" silhouette, room-anchor scale |
| Oversized (125 gal+) | ~1830 × 460 × 535 | statement/feature tank, often built into a wall or cabinetry |
| Stand (furniture) | matches tank W×D, height ≈ **760 mm** (30 in) standard cabinet stand, up to ~900 mm DIY | brings water surface to comfortable seated-viewing height |

### Shape breakdown

A layered box stack, no exotic geometry needed:

- **Glass box** (main volume): one large box, W×D×H per table, with a distinct lighter/blue-tinted semi-transparent material for the "water" fill — model as a second inset box (a few mm smaller on all sides, top surface ~30–50 mm below tank rim to leave an air gap) so it reads as glass-with-water-inside rather than solid glass.
- **Rim/frame trim**: thin box strips (10–15 mm tall × full W or D, ~15 mm thick) capping the top and bottom edges — classic black or silver plastic trim, contrasting color from the glass.
- **Hood/lid**: flat box slightly larger than the tank footprint, ~30–50 mm thick, sitting on the top rim — often integrates the light fixture. Can be a simple hinged flap (rotate about the back long edge) for an "open lid" state.
- **Light fixture**: a slim box (strip-light) mounted on/under the hood lip, along the rear/top edge — the "front" (+Z) is the long glass viewing pane, so mount lights along the rear/top edge, not blocking the view.
- **Stand**: separate box cabinet (or four cylinder/box legs + a top panel) at the standard 760 mm height, footprint matching the tank; may have a lower shelf (another thin box) and cabinet doors (front face).
- **Substrate**: thin flat box or slightly irregular low mound at the tank bottom (sand/gravel color), ~20–40 mm deep.
- **Decor** (optional, cheap wins): a cone for a small plastic plant cluster, a couple of cylinder/rounded box "rock" clusters, a cylinder driftwood log (angled).
- **Filter**: small box hanging on the back rim (hang-on-back filter) or a compact box tucked in a rear corner (canister/internal) — back face only, never on the front (+Z) viewing pane.
- **Air hose/bubbler**: thin vertical cylinder of tiny bubbles (particle billboard or stacked tiny spheres) rising from a corner airstone.

### Colors & finishes

- Glass: clear with a pale blue/cyan tint for the water volume (alpha ~0.25–0.4, additive/fresnel-ish brighten at edges reads well even without real refraction).
- Trim/frame/lid: black (most common), less often silver/brushed-aluminum or white (kids'/decorative tanks).
- Stand cabinets: black, dark espresso wood-grain, or white — matches typical furniture finishes already in the palette (reuse cabinet/dresser wood texture).
- Substrate: natural tan/beige gravel, black "moonsand," or white aragonite (reef tanks).
- Water tint shifts subtly with lighting: fresh/blue-green (planted/community) vs. bright teal-cyan (reef/marine with strong LED).

### Placement

- Living room, family room, den, office, or bedroom — almost always **floor** via its dedicated stand (stand top ≈ 760 mm, tank bottom sits right on the stand top, so tank rim height ≈ 760 + tank H).
- Smaller nano tanks (5–10 gal) commonly rest on a **surface** (desk, dresser top, kitchen counter) rather than a floor stand.
- Occasionally built-in/wall-recessed as a room-divider feature tank (large tanks only) — out of scope for v1, worth a flag for a future "recessed" variant.
- Always placed against or near a wall (rear panel is unglazed/dark) with the glass front (+Z) facing into the room.

### Active / interactive state

A great "always-alive" ambient object:

- **Light on/off**: hood light entity bound → emissive strip lit (warm/white for planted, blue-white/actinic for reef) vs. dark hood when off; bind like other fixtures to a `light.*` entity.
- **Filter running**: rising bubble stream + a faint ripple/shimmer on the water's top surface (simple scrolling normal-ish wobble or a few animated highlight quads).
- **Fish present**: 1–4 tiny fish primitives (flattened sphere/teardrop with a thin triangular tail fin) patrolling a bounded swim-path inside the water volume — the single highest-value animation for this object, since an aquarium's whole purpose is "things swimming."
- **Feeding moment** (nice-to-have): occasional upward dart-to-surface flick.
- **Heater/thermometer glow**: tiny LED dot on a heater stub for bound temperature sensors, matching the env-sensor sprite idiom (numeric chip above the tank).

### Variations & customizations

- Size tier: nano / standard / large / oversized (table above).
- Tank profile: "long" (low & wide) vs. "high" (tall & narrow) vs. cube (nano).
- Theme: freshwater/planted (green plants, warm light, tan substrate) vs. marine/reef (corals via small colorful cone/sphere clusters, blue actinic light, white sand) vs. minimal/betta (bare, one fish, small size).
- Stand style: cabinet (enclosed, doors) vs. open metal-frame stand (thin cylinder/box legs, no panels) vs. no stand (countertop nano).
- Frame color: black / silver / white.
- Fish count/species color variety (simple recolor of the fish primitive is enough — no need for distinct species geometry).

### Animation opportunities

- Idle: continuous fish swimming loop (bounded bezier/waypoint patrol with a slight tail-fin wag), rising filter bubbles, faint water-surface shimmer, gentle plant sway (thin cone/blade swaying like the existing plant fixture idiom).
- Active/on: hood light emissive turns on, water tint brightens, bubble stream appears/intensifies when the filter entity is on.
- Interactive: click toggles the hood light (if bound to a `light.*` entity, same as any other light fixture) — matches the existing local-control/unbound toggle convention; could also flip a "feeding" one-shot animation on double-click as a fun Easter egg, mirroring the appliance-door/one-shot idiom.
- Seasonal/contextual (optional): dim/darken at night matching the room's time-of-day preset, same as other ambient light sources.

---

## Gaming console and setup

### Typical dimensions

Console unit itself; this is a "setup" composed of several pieces — console + TV/monitor stand + chair + optional desk are separate furniture pieces covered elsewhere, so focus here is the console/accessories cluster.

| Variant | W × D × H (mm) | Notes |
|---|---|---|
| PS5 (disc, vertical stand) | 104 × 260 × 390 | Two-tone white/black, widest silhouette of the group |
| PS5 Digital Edition | 92 × 260 × 390 | Same height, slightly slimmer |
| PS5 Slim (2023+) | ~80 × 216 × 358 | ~30% smaller redesign |
| Xbox Series X | 151 × 151 × 301 | Near-cube monolith, matte black |
| Xbox Series S | 151 × 65 × 275 | Slim white slab, black "orb" vent circle on front face |
| Nintendo Switch dock | 173 × 54 × 104 | Small charging cradle, console slots in vertically |
| Retro/mini console (NES/SNES Classic) | ~110 × 70 × 30 | Tiny, usually laid flat |
| Controller (generic) | ~155 × 100 × 60 | For scale reference near console |

### Shape breakdown

- **PS5**: tall rounded-lozenge body — a vertically-oriented flattened box (or box with heavily chamfered long edges) split into a black center band (cylinder-esque midsection) sandwiched by two white wing panels; small cylinder disc-slot detail on the front face of the disc edition; sits on a small disc/oval base stand (flattened cylinder) at the bottom for vertical orientation, or a low box stand if horizontal.
- **Xbox Series X**: simple rectangular box (near-cube), single black material; top face gets a thin lighter-toned circular vent inset (flattened cylinder or texture, not geometry); small halo-glow ring at front-bottom for the power button — good animation hook.
- **Xbox Series S**: flat box, white, with one large flat cylinder (black disc, subtly recessed or just painted) centered on the front face as the standout feature.
- **Switch dock**: simple angled box, open-topped slot (a notch/cutout box) where the console tablet slides in vertically; console itself is a thin flat box with two small controller "Joy-Con" boxes clipped to its sides when undocked.
- **Front face**: for all consoles, "front" = the face showing the primary logo/vent/disc slot, generally faced out toward the room/TV viewer, i.e. local +Z should point toward where the player would stand/sit.
- **Accessory cluster** (small child primitives around the console): controller(s) = flattened rounded box with two small cylinder "grip" bumps; headset = a thin torus/half-ring (approximate with a scaled thin cylinder arc or two cylinders forming an arc) with two small oval ear cups (flattened spheres or cylinders) resting beside the console or hung on a stand hook; a vertical headset stand = a thin cylinder pole on a flat disc base.

### Colors & finishes

- PS5: gloss white shell + matte black center — glossy plastic finish, prone to visible reflection/highlight.
- Xbox Series X/S: matte black (X) or matte white (S), soft-touch plastic, minimal color variation (occasional special-edition wraps: pastel, camo, translucent).
- Switch/dock: matte black or neon red/blue (Joy-Con accents), dock inner cradle often grey rubberized.
- Retro consoles: matte grey/beige/black plastic, often with colorful button accents.
- Accessories: controllers commonly black, white, or 2-tone with colored face buttons; headsets black/grey with LED accent trim (RGB strip good animation candidate).

### Placement

- Console rests on a **surface** — almost always a TV stand/media console shelf or a dedicated gaming desk shelf, roughly 300–600 mm off the floor (typical AV-stand shelf height); some vertical-orientation stands sit directly on the floor-level stand top rather than a raised shelf.
- Controller/headset: surface-resting (desk or stand top) or headset hung off a stand hook ~150–250 mm above the surface.
- Switch dock: surface-mounted (TV stand or desk), connects to a TV — same shelf height convention.
- Room: living room (TV setup) or bedroom/office (desk/monitor setup) — placeable near either a `tv` furniture piece or a desk/monitor piece.

### Active / interactive state

- Power LED: console front/edge shows a small emissive dot/strip — off (grey) vs on (white/blue for PS5, green pulse for Xbox on standby-to-active, orange/white for Switch dock).
- Disc-edition PS5: could show a subtle spinning-disc sound/vibration cue, but no visible moving part externally.
- Screen tie-in: when bound to a `media_player`/`switch` entity reflecting "on," drive the console's LED to lit + optionally brighten a paired TV/monitor glow — mirrors the existing appliance in-use LED pattern (pulsing green/blue emissive).
- Controller: could rest "docked" in a charging cradle, LED lit while charging (amber) vs full (green) — nice tiny detail light.
- RGB accessory strips (chair, headset, deskmat): idle slow color-cycle animation when the console is on, mirroring general PC/gaming-room ambiance.

### Variations & customizations

- Console family pick: PS5 (disc/digital/slim) / Xbox Series X / Series S / Switch+dock / retro-mini / generic PC tower.
- Orientation: vertical (with stand) vs horizontal (laid flat) for PS5/Xbox.
- Special-edition color wraps/faceplates.
- Accessory bundle toggles: controller(s) on desk, headset on stand, charging dock, extra controller pair for multiplayer flavor.
- Paired setup type: "couch/TV" (console + TV stand + couch, controllers on coffee table) vs "desk" (console/PC + monitor + gaming chair + RGB keyboard/mouse).

### Animation opportunities

- Idle: slow LED breathing/pulse on power indicator; faint fan-hum implied via a barely-visible vent shimmer (optional subtle emissive flicker, cheap); RGB accessory color-cycle loop.
- Active (bound entity "on"/"playing"): brighter steady or pulsing LED, paired TV/monitor screen glow bump, controller "charging" LED color swap when docked, headset LED trim lit.
- Interaction: click toggles power state like other appliances (fits the existing unbound `localState` on/off pattern); could trigger a quick "wake" flash animation on the front LED the moment it powers on.
- Ambient room touch: when console+TV are on, a warm/blue screen-glow bounce added to the console shelf area (same idiom as existing appliance/TV in-use glow).

**Sources**: [PlayStation 5 Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/playstation-5) · [PS5 dimensions, size, and weight confirmed — GamesRadar+](https://www.gamesradar.com/ps5-dimensions-size/) · [Xbox Series X Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/xbox-series-x) · [Xbox Series X and Series S Dimensions Revealed — Den of Geek](https://www.denofgeek.com/games/xbox-series-x-and-series-x-dimensions-details-height-width/) · [Nintendo Switch dock specifications — Nintendo](https://www.nintendo.com/sg/hardware/switch/modal/specs/dock.html?width=960) · [E-WIN Gaming Chair Dimensions](https://www.ewinracing.com/pages/chair-dimensions) · [Ultimate Gaming Chair Sizing Guide — ChairsFX](https://chairsfx.com/computing-chair-advice/ultimate-gaming-chair-size-guide/)

---

## Coat rack, umbrella stand, shoe rack

### Typical dimensions

| Item | Variant | W × D × H (mm) | Notes |
|---|---|---|---|
| Coat rack (tree/pillar, freestanding) | Compact | 350×350×1500 | Small hallway |
| | Standard | 400–500 dia base × 1700–1830 | Top hooks at 1650–1780 |
| | Wall-mounted rail | 600–900 × 60 × 100 | 3–6 hooks, mounted 1500–1650 mm AFF (adult), 1100–1200 for kids |
| Umbrella stand | Compact (indoor bin) | ⌀220–280 × H 500–600 | Ceramic/metal cylinder |
| | Standard entryway | ⌀250–380 × H 550–700 | Holds 6–10 umbrellas |
| | Outdoor patio-pole base | ⌀480 × H 70–100 | Flat disc, not a "stand" shape — skip for interior sets |
| Shoe rack | Compact (2–3 tier) | 600×300×450–600 | Open wire/metal shelves |
| | Standard (3–4 tier) | 900×300–380×760–900 | Common 900 mm width holds 8–10 pairs |
| | Bench-style w/ shoe storage | 900–1200×350×450 (seat ~450) | Doubles as sit-to-put-on-shoes bench |
| Combo hall tree (all 3 in one) | Standard | 800–1000×300–400×1800–1900 | Bench + hooks + upper shelf; umbrella well often a side cutout, not modeled separately |

### Shape breakdown

- **Coat rack (tree)**: 1 tall cylinder (⌀30–40 mm pole) + a wide flat cylinder base disc (⌀400–500×30 mm, or a tripod of 3 slim angled cylinder legs for a modern variant) + a ring of 6–8 short angled cylinder/cone peg stubs near the top (radiating outward/upward, ~80–120 mm long, evenly spaced around the pole) + optional small sphere ball-tips on peg ends. Front face is nominal (radially symmetric) — treat +Z as the side with the tallest/hero hook if pegs are staggered in height (common real design: 2–3 height tiers).
- **Coat rack (wall rail)**: 1 long thin box rail (back plate) + 4–6 cylinder hook pegs protruding on +Z, evenly spaced, angled ~10–15° upward. Mounts flush to the wall, so the rail's flat back sits at the wall plane, pegs project into the room.
- **Umbrella stand**: 1 cylinder body (may taper — use two stacked cylinders, wider bottom + narrower top rim, or a single cylinder with a slightly larger-diameter short cylinder "lip" ring stacked on top to read as a rolled rim). Fully open top (no separate lid geometry — just leave a dark disc via a darker top material). Radially symmetric, no strict front face; a decorative front panel/motif variant can treat +Z as the pattern side.
- **Shoe rack (open-shelf)**: 2–4 thin box shelves stacked at even vertical spacing, supported by 4 slim cylinder or box corner legs (or 2 side-panel box slabs instead of 4 legs for a "closed side" look). Fully open front/back — front (+Z) is just the open access side, no door.
- **Shoe cabinet variant**: outer box shell + 1–2 flat box doors on +Z hinged at outer edges (swing open like the wardrobe/cabinet furniture kind) hiding the shelves.
- **Shoe bench**: 1 padded seat box (~450 mm high) on a box shelf base (open cubbies below, 1–2 internal shelf box dividers), legs as 4 short cylinder/box stubs. Front (+Z) is the open shoe-cubby face; seat top is where avatars would sit (could reuse `seat` furniture metadata).
- **Combo hall tree**: bench module (as above) + a tall back box panel rising to ~1800 mm with hook pegs (cylinder, like the wall rail) mounted on its front face, plus a small top box shelf cap. Everything shares the bench's footprint; no separate umbrella-stand geometry (real combo units usually just have an open end-slot, easily represented as a gap rather than modeled).

### Colors & finishes

- Coat rack: matte black or bronze powder-coated metal (very common modern look), natural/walnut/espresso stained wood, white-painted wood, brass/gold metal accents for pegs.
- Umbrella stand: ceramic glazed (solid color or patterned — navy, terracotta, white), brushed/matte metal (stainless, black, bronze), woven rattan/wicker texture, ribbed cast-iron looking texture.
- Shoe rack: light oak/birch or dark walnut/espresso wood-tone, white laminate, black or white powder-coated wire metal (very common budget style), matching-fabric bench cushion (grey/tan/black linen) on bench variants.
- Combo hall trees typically pair a black or bronze metal frame with a warm wood-tone bench seat and shelf.

### Placement

- All three: entryway / mudroom / foyer, occasionally a back door/garage entrance for a secondary shoe rack.
- Coat rack (tree/pillar) and umbrella stand: rest on the floor, free-standing, typically pushed near the entry door or in a corner.
- Wall-rail coat rack: **wall-mounted**, hook centerline ~1500–1650 mm AFF for adults (lower 1100–1200 mm row for kids in a family mudroom).
- Shoe rack/cabinet/bench: rests on the floor, against a wall, usually flanking the entry door.

### Active / interactive state

None of these are powered devices — no HA entity binding expected in the general case. Visual "in use" cues are about occupancy/clutter rather than state:

- Coat rack: could optionally show 1–3 draped coat/jacket blob meshes on random pegs as ambient set-dressing (static, not entity-driven), toggled by a simple "occupied" prop flag rather than any binding.
- Umbrella stand: could show 1–2 umbrella-shape props inserted (cylinder shaft + folded-cone canopy) as a static variant, more likely to appear/disappear tied to weather (rainy condition → more umbrellas showing) as a cute weather-linked Easter egg.
- Shoe rack/bench: could show a few shoe-pair props scattered on shelves as static clutter dressing.
- If a smart variant exists (rare) — an LED motion-sensor nightlight strip under a bench — that would bind like any other light fixture, not a core feature of this item.

### Variations & customizations

- Coat rack: tree/pillar (pole+pegs) vs. wall rail vs. tripod-leg modern style vs. antler/decorative-top novelty style.
- Umbrella stand: cylinder bin vs. stepped/tiered (wider foot, narrower neck) vs. woven-texture vs. novelty (boot-shaped, animal-shaped) — offer plain cylinder + tiered as the two buildable options.
- Shoe rack: open wire shelves vs. closed cabinet with doors vs. bench-with-cubbies vs. slim over-the-door variant (skip — not floor furniture) vs. tall combo hall tree.
- Finish/color swatches as the main customization axis (matches existing furniture tint pattern), plus a shelf-count slider for shoe racks (2–5 shelves) and a peg-count slider for coat racks (4–8 pegs).

### Animation opportunities

- Idle: none of these have inherent moving parts (no motors, no doors that open automatically) — treat as static furniture like a bookshelf/rug.
- If a shoe cabinet or hall-tree bench with cubby doors is offered, its doors could use the same appliance-door-pivot idiom (pivot group, ease open on click/toggle) as fridge/wardrobe pieces — purely a manual/local-state interaction, not entity-bound.
- Passive liveliness: coats/umbrellas/shoes as static prop meshes give the entryway a "lived-in" read without needing any animation system — cheaper and more in keeping with how rugs/plants are handled than trying to animate cloth.
- A rig walking past could pause briefly to "hang a coat" or "grab shoes" as a new solo activity anchor (similar to `forage_fridge`/`make_coffee`) — dwell near the rack eases an arm-raise pose toward a peg; low priority, optional future activity kind rather than day-one scope.

**Sources**: [Coat Racks & Hat Stands Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/collection/coat-racks-hat-stands) · [Pillar Coat Rack Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/pillar-coat-rack) · [Coat Hook Height — Ashdeco](https://ashdeco.com/blogs/room-ideas/coat-hook-height-where-to-mount-for-every-room-guide) · [How High Should a Coat Rack Be from the Floor?](https://www.ojcommerce.com/blogs/web-stories/how-high-should-a-coat-rack-be-from-the-floor-bl0472.html) · [Standing Coat Racks](https://www.allcoatracks.com/standcoatrack.html) · [Umbrella Stand Sizing — POLYWOOD](https://help.polywood.com/hc/en-us/articles/4422019549595-Umbrella-Stand-Sizing) · [Umbrella Stands Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/collection/umbrella-stand) · [Hub Umbrella Stand Dimensions & Drawings — Dimensions.com](https://www.dimensions.com/element/hub-umbrella-stand) · [Shoe Rack Sizes — Tribesigns](https://tribesigns.com/blogs/furniture-knowledge/shoe-rack-sizes) · [How to Pick the Right Entryway Shoe Storage Dimension — HOMEYFAD](https://homeyfad.com/blogs/furniture/how-to-pick-the-right-entryway-shoe-storage-dimension) · [Find the Perfect Shoe Rack Dimensions](https://designingidea.com/shoe-rack-dimensions/) · [Yaheetech 3-in-1 Coat Rack Shoe Bench](https://www.amazon.com/Yaheetech-Metal-Entryway-3-Tier-Umbrella/dp/B01ABT8HQ8) · [Recaceik 5 in 1 Entryway Coat Rack With Storage Shoe Rack and 12 Hooks](https://www.hooseng.com/products/recaceik-5-in-1-entryway-coat-rack-with-storage-shoe-rack-and-12-hooks)

---

## Storage bins and utility shelving unit

### Typical dimensions

| Item | Width × Depth × Height (mm) | Notes |
|---|---|---|
| Small tote (~18 gal) | 597 × 467 × 410 | e.g. Sterilite 18-Gal Tote (23½"×18⅜"×16⅛") |
| Large tote (~27 gal) | 654 × 467 × 492 | Sterilite 27-Gal Stacker Tote (25¾"×18⅜"×19⅜") |
| Wide industrial tote (~27 gal) | 775 × 524 × 387 | Sterilite Industrial Tote (30½"×20⅝"×15¼") — squatter, wider footprint |
| Utility shelving, compact | 813 × 356 × 1829 | 32"×14"×72" — 5 fixed tiers, ~100 lb/shelf |
| Utility shelving, standard | 914 × 457 × 1829–1880 | 36"×18"×72–74" — the most common "garage rack," 150 lb/shelf (750 lb total) |
| Utility shelving, deep/heavy-duty | 914 × 610 × 1829 | 36"×24"×72", 200 lb/shelf |
| Utility shelving, oversized | 1219 × 610 × 1905 | 48"×24"×75", adjustable, up to 1000 lb total |

Shelf-to-shelf clearance on standard racks runs ~380–410 mm (15–16") — sized to fit a stacked tote underneath.

### Shape breakdown

**Bin/tote:**
- Body: a single box with **tapered/battered side walls** — real totes narrow toward the base (~10–15% smaller at bottom than top). Fake a true frustum with a box scaled slightly narrower at the bottom vertex group, or just use a straight box for the stylized/simplified look (acceptable at this scale).
- Lid: a slightly-larger flat box (30–50 mm tall) capping the top, with a subtle lip overhang (~10 mm) on all sides — front is whichever long side faces +Z (totes are symmetric, so "front" is arbitrary/labelable).
- Recessed grip handles: two shallow inset boxes or cut notches on the short ends (cosmetic only, no need to model as separate geometry).
- Stacking ribs: optional thin horizontal box strips (2–3) on the body for visual detail at close zoom.
- Movable part: none in closed state; an "open" variant can hinge the lid box up ~110° from a back-edge pivot, matching the fridge/appliance-door pivot convention already in the codebase.

**Shelving unit:**
- Two side frames, each built from 4 thin vertical box posts (25–40 mm square) joined by thin horizontal box cross-braces near top/bottom/mid — OR for wire-shelf style, thin cylinders (8–10 mm dia) for legs.
- **Shelves**: 4–5 flat horizontal panels. Two visual styles:
  - *Solid plastic shelf*: one flat box (~15–20 mm thick) per tier, injection-ribbed underside (skip detail — a flat slab is fine at this scale).
  - *Wire shelf*: a grid of thin cylinders, or a single flat semi-transparent box textured to fake the wire grid — much cheaper to build and reads fine at Sims scale.
- Feet: 4 short cylinder or box pucks/leveling feet at the base corners (~30–50 mm tall).
- Front face (+Z): open — no doors or backing; the whole unit is typically visually open on all sides (utility racks aren't enclosed), so "front" is just the side the modeler chooses to face the room for 2D chevron purposes.
- Contents: place 3–6 generic tote/box primitives (varying the bin size/color per tier) directly on the shelf tops as sub-objects — cheap since they're just scaled boxes, and this is what sells the "storage" read.

### Colors & finishes

- Totes: translucent/opaque base in **black, gray, clear, or cement/tan**, with a colored snap-lid — common lid colors are **yellow ("Lily"), blue, red, green, or matching black/gray**. Matte injection-molded plastic look; slight sheen highlight works well with the toon shader.
- Shelving: almost always **black** or **gray** resin/plastic (HDX, Gracious Living); occasionally **white** (wire shelving, closet-style, e.g. chrome wire) or **chrome/galvanized silver** for wire racks. Metal-frame utility shelving (boltless rivet-shelf) is typically **gray/gunmetal steel with particleboard-tan shelf tops**.
- Wire shelving finish: bright chrome or white epoxy-coated wire grid — a good candidate for a subtle metallic/specular tint distinct from the matte plastic totes.

### Placement

Floor-resting, always — never wall-mounted or built-in (that's a separate "built-in shelving/closet" item). Rooms: garage (primary — the classic use case), basement, laundry room, utility/mud room, closet, attic/storage room, occasionally kitchen pantry or garden shed exterior placement (as an "outdoor" cat item). No clearance requirement beyond normal walk-aisles; typically pushed flush against a wall (back face near-touching), like bookshelf/wardrobe placement — snaps to a wall the way `bookshelf`/`wardrobe` kinds do, front face out. Standalone totes are placed either on the floor directly, stacked 2–4 high, or resting on a shelving unit's tiers (**mountable** on a surface, same idiom as `coffee_maker`/`toaster` mounting onto counters — bins mount onto shelf tops).

### Active / interactive state

- No power/electrical state — these are passive furniture.
- "In use" cues are compositional rather than state-driven: a fuller shelf (more tote primitives stacked) reads as "actively used storage" vs. a bare rack; an open lid with visible clutter reads as "recently accessed."
- Could optionally bind a bin's "lid open/closed" to a `localState` toggle (click-to-open like a fridge door) purely for a lived-in animation beat — not tied to any real HA entity, since there's no sensor for a storage bin. Same idea as unbound appliance doors.
- Seasonal dressing: swap in labeled bins (e.g., a red/green bin with a snowflake or wreath decal) near winter for a "holiday decorations" storage vignette — cosmetic recipe variant only.

### Variations & customizations

- Tote **size**: small/medium/large (18/27 gal proportions above), plus a shallow **under-bed** flat variant (wide, short) for bedroom closets.
- Tote **color** family: neutral (black/gray/clear) vs. colorful (yellow/blue/red lids) — expose as a recipe/tint parameter.
- Shelving **width**: 3-tier compact (household closet) up to 5-tier 48" oversized (garage/warehouse).
- Shelving **material style**: solid resin shelf vs. wire/grid shelf (visual/material swap only, same primitive skeleton).
- **Labeled** bin variant: add a small flat rectangular label decal/box on the front face for an "organized garage" flourish.
- Stack **height** variant: 1 bin / 3-stack / 6-stack column, useful as a quick standalone clutter prop without needing the full shelving unit.

### Animation opportunities

- Idle: essentially static (inanimate storage); at most a very subtle occasional dust-mote/light glint or, if the engine supports it, a barely-there sway on tall wire-shelf tiers when a nearby door slams (cosmetic, skip if not worth the complexity).
- Active: lid-open/close swing (~110° about the back hinge edge) when clicked, mirroring the fridge-door interaction pattern — gives it a real click affordance even with no bound entity. An avatar "browsing"/rummaging anchor (like `browse_bookshelf`) — a person could pause in front of the rack, reach toward a shelf, mimicking the existing anchor-activity system, without needing new joints (reuse arm-reach channels). Optional one-shot: a bin sliding out slightly from a shelf tier when "accessed," then sliding back — purely decorative, on a timer or click trigger.

---

## Grandfather / standing floor clock

### Typical dimensions

| Variant | Width | Depth | Height |
|---|---|---|---|
| Compact / "grandmother" clock | 430–530 | 250–330 | 1400–1700 |
| Standard grandfather clock | 480–620 | 300–380 | 1900–2100 |
| Oversized / hall clock | 700–810 | 450–530 | 2200–2410 |

Reference real models: Howard Miller Gavin 610-985 ≈ 565 × 324 × 2096 mm (W×D×H); Howard Miller J.H. Miller II ≈ 787 × 527 × 2400 mm. Use ~550 × 320 × 2000 mm as the default "standard" instance. Three vertical zones, roughly: hood/bonnet (top ~15–20% of height), waist/trunk (middle ~55–65%, holds the pendulum door), base/plinth (bottom ~10–15%).

### Shape breakdown

Local +Z = front, origin at floor-center of footprint.

- **Base/plinth**: box, full W×D footprint, ~150–250 mm tall, slightly wider than the waist (a small projecting foot base) — optionally a second thinner box as a foot-molding lip at the very bottom (~30 mm).
- **Waist/trunk**: box, ~0.75–0.85× the base width, the bulk of the height (~1100–1400 mm on a 2000 mm clock) — this is the visually dominant box.
- **Waist door** (the long glass-fronted pendulum door): a slightly recessed/inset box or just a flat front face treatment (thin box, ~10 mm proud or recessed) covering most of the trunk front, with a small rectangular glass panel — this is the "front face" and, if made openable, hinges on one vertical edge (±70–90° swing) to reveal the pendulum.
- **Hood/bonnet**: box for the clock-face housing, similar width to the trunk, ~300–450 mm tall, topped by:
  - a **cornice** — thin flat box wider than the hood (small overhang lip), and
  - a **pediment/crown** — optional cylinder-segment or triangular-prism arch (rounded-top "cathedral" hoods), OR a flat-top box (classic/Mission style), OR a broken-scroll pediment (two small angled boxes + a central finial).
  - **finials**: 1–3 small cylinder+sphere/cone turnings on top (center + two corners) on traditional styles.
- **Dial face**: flat cylinder or disc (thin, radius ~120–160 mm) inset in the hood front, embossed with a circle rim (torus/ring approximation via a slightly larger flat cylinder behind it) — brass-colored, with thin dark cylinder "hands" as optional articulated child objects (see animation).
- **Hood glass side lights**: thin flat boxes/panes on the hood's side faces (visual only).
- **Pendulum**: inside the trunk, a thin long cylinder (rod) + a flat wide cylinder or sphere-flattened disc (the "bob") ~150–250 mm diameter, hung from a pivot near the base of the hood — the one prominent moving part when visible through the door glass.
- **Weights** (optional detail): 2–3 thin tall cylinders hanging beside the pendulum rod, visible only on high-detail models.
- **Feet**: on fancier styles, 4 small turned cylinder/ball feet under the plinth corners (else the plinth box just meets the floor).

### Colors & finishes

- Wood tones dominate: warm cherry/mahogany (`#5c2e1e`–`#7a3b20`), walnut (`#4a3222`), oak (`#8a6a45`), espresso/black-stained (`#241a14`), and lighter modern finishes (whitewash `#e8e2d8`, grey-wash `#6b6b68`).
- Trim/accents: brass or gold hardware for the dial surround, hinges, and finials (`#c9a227`/`#d4af37`), often with a lacquered high-gloss clear-coat sheen.
- Dial face: cream/ivory (`#f2ead6`) or brushed silver/pewter (`#c8c8c8`), with black Roman-numeral markings and a brass or gold bezel ring.
- Glass panels (door, hood sides): pale blue-grey semi-transparent material, low opacity (~0.15–0.25) tint over a dark interior.

### Placement

Floor-resting always — never wall-mounted or built-in. Common rooms: living room, entryway/foyer, hallway, den, study, dining room — typically against a wall (needs ~150–250 mm clearance behind for the pendulum swing and weight cords) and away from direct sun/humidity in real life (flavor detail only). Rests flush on the floor; no elevation offset. Often placed in a corner or centered on a focal wall.

### Active / interactive state

- **Pendulum swing**: continuous side-to-side rotation of the pendulum rod+bob about the top pivot when the clock is "running" — the signature idle animation, always-on ambient motion regardless of HA binding (like the fireplace flicker idiom — cheap, rebuilds every tick or animates via a persistent object).
- **Clock hands**: could tick/rotate in real time (minute hand once per minute, hour hand continuously) tied to actual wall-clock time for a nice touch-of-life detail — not HA-bound, just `Date.now()`.
- **Chime moment**: on the hour (or a bound `input_button`/automation trigger), a brief flourish — a subtle glow pulse on the dial face or a small radiating ring/sound-wave decal (visual-only, no audio per repo convention), lasting a couple seconds.
- **HA-bound variant**: no natural HA entity maps to "grandfather clock" — treat as an unbound decorative furniture piece with only ambient/time-based animation, similar to unbound TVs/fireplaces defaulting to a demo state.

### Variations & customizations

- **Style**: traditional/cathedral-hood (arched pediment), Mission/flat-top (simple square hood, Craftsman look), modern minimalist (slab sides, no finials, matte finish), "grandmother clock" (narrower, shorter compact variant), "granddaughter clock" (even more compact tabletop-adjacent variant — a size preset rather than a distinct kind).
- **Size presets**: compact / standard / oversized (table above).
- **Finish presets**: cherry, walnut, oak, black/espresso, whitewash/modern.
- **Dial style**: Roman numeral cream dial (classic) vs. Arabic numeral silver/modern dial vs. moon-phase dial (extra small sub-dial disc above the main dial).
- **Finial count**: 0 (flat-top), 1 (center only), 3 (center + two corner).

### Animation opportunities

- Idle: continuous pendulum swing (rotation oscillation, e.g. ±15–20° at a slow ~1 Hz-ish period scaled to a believable multi-second full swing — real pendulums for this height run ~1 s per half-swing, but a slightly slower stylized swing reads better); slow continuous rotation of the minute/hour hand groups tied to real time; a faint ambient brass glint (very subtle emissive pulse) is optional flavor.
- Active/triggered: on-the-hour chime flourish — brief emissive pulse on the dial + expanding thin ring decal (reuse the doorbell `TransientPulse` primitive) + optional quick double-flash like the fireplace/lightning flicker idiom, no audio.
- Interaction: clicking the piece could pause/resume the pendulum (toggle a local "stopped" display state) purely as a fun local-only flourish, matching the "unbound interactive furniture" `localState` pattern (`'on'` = running/swinging, `'off'` = stopped, pendulum frozen mid-swing).

**Sources**: [Grandfather Clock Dimensions — Premier Clocks](https://www.premierclocks.com/blogs/clock-blog/grandfather-clock-dimensions) · [Standard Grandfather Clock Dimensions — Steebar](https://www.steebar.com/grandfather-clock-dimensions/) · [Grandfather Clock – Case Dimensions — Engineered Musings](http://engineeredmusings.com/grandfather-clock-case-dimensions/) · [Howard Miller Gavin Grandfather Clock 610-985](https://giftoftimeclocks.com/grandfather-clock-610-985/) · [J.H. Miller II Grandfather Clock — Howard Miller](https://howardmiller.com/products/j-h-miller-floor-clock-611031) · [Grandfather clock — Wikipedia](https://en.wikipedia.org/wiki/Grandfather_clock)

---

## Baby crib, changing table, high chair, stroller

### Baby crib

**Typical dimensions** (W × D × H, mm; W = long slat side, D = short end):

| Variant | W | D | H (rail top) | Notes |
|---|---|---|---|---|
| Standard/full crib | 1300 | 760 | 1000–1100 | Mattress area ~1311×692 mm (US 16 CFR 1219 standard); rail top 660 mm+ above mattress at lowest setting |
| Mini/portable (pack-n-play style) | 1000–1080 | 660–700 | 850–900 | Mesh sides, often folds flat |
| Convertible (toddler-bed stage) | 1300 | 760 | 550–650 | One long side rail removed/lowered |

**Shape breakdown**: 4 corner posts (thin box or cylinder, ~50×50 mm, slightly taller than rails, sometimes capped with a small sphere/finial); two long sides + two short ends built as a shallow box "frame" (top rail + bottom rail boxes) with a row of repeated thin vertical box/cylinder slats (model 8–12 representative slats, evenly spaced, rather than every real slat) — the slats are the primary readable silhouette, keep them crisp; flat mattress box inset ~50 mm below rail top, covered by a thin fitted-sheet box (rounded top edges); small bun-foot cylinders/flattened spheres at the base (fixed, no casters on modern full cribs — mini/portable variants may have small caster spheres). Front face (local +Z) = the headboard/footboard end, matching the existing bed convention.

**Colors & finishes**: white, natural/birch, gray-wash, espresso/walnut solid wood or wood-look laminate; mattress sheet in pastel or printed cotton (stars, animals). No bumpers/pillows (modern safety guidance — omit soft loose bedding from the model).

**Placement**: Floor, nursery/bedroom. No wall/ceiling mount (mini travel variants sometimes have a bassinet-height insert but still floor-resting).

**Active / interactive state**: overhead mobile toy (small dangling shapes on a rotating arm) is the signature "in use" tell — slow constant rotation + gentle chime-bob is a good idle animation regardless of occupancy. If occupied, a tiny blanket-covered bump could rise/fall slowly (breathing) — mirrors Diorama's existing bed-cover breathing idiom. A nightlight glow or baby monitor camera prop on the rail could pulse dim amber at night.

**Variations**: standard 4-in-1 convertible, mini/portable mesh-side, bassinet (smaller, on a stand, ~900 mm H), daybed conversion (one side fully open).

**Animation opportunities**: idle — mobile rotation + chime sway; active — subtle breathing bump under a blanket when "occupied," nightlight pulse tied to time-of-day/night bucket, monitor camera LED blink.

### Changing table

**Typical dimensions** (W × D × H, mm): 813–1016 × 457–559 × 914–1092 (36–43 in height sits at adult waist level). Contoured pad itself: ~410×840×80 mm, with raised bumper edges ~50–75 mm high.

**Shape breakdown**: two common builds — (a) **standalone open-shelf table**: box tabletop + 4 leg boxes/cylinders + 1–2 open shelf boxes below (for diapers/wipes basket), or (b) **dresser topper**: a taller solid dresser box (drawer-front boxes with small cylinder knobs) with the contoured pad box sitting on top, slightly overhanging the dresser's footprint. Pad: a rounded box (or box with cylinder-capped ends) with a raised bumper lip on all 4 sides; a thin box "safety strap" arcs across the middle. Front face (+Z) = the side the parent stands at (no doors/drawers needed there).

**Colors & finishes**: matches nursery furniture — white, natural wood, gray, espresso; pad usually white/gray vinyl or a soft pastel/printed cover (elephants, clouds, stars).

**Placement**: Floor (freestanding or as dresser topper), nursery. A commercial/public-restroom wall-mounted fold-down variant exists (wall mount, hinged, fold-down like a Murphy shelf) — worth offering as an optional kind for non-residential floor plans.

**Active / interactive state**: mostly static furniture; could support Diorama's activity-anchor system (a `change_diaper` anchor pairing a standing adult rig + a small lying baby prop on the pad, similar to how appliance anchors work). Diaper caddy/wipes box props on the shelf are a nice static detail. No powered state.

**Variations**: standalone table, dresser-topper combo, wall-mounted fold-down (fold fraction 0↔1 like a garage door/Murphy bed), compact travel-pad-only (a thin mat with no legs, placed atop any surface — mountable).

**Animation opportunities**: idle — essentially none (static furniture); active — fold-down wall variant animates open/closed on the same openFraction idiom as covers/garage doors; optional activity-anchor pose when "in use."

### High chair

**Typical dimensions** (mm): overall footprint ~510–610 W × 580–840 D (legs splayed at base can widen the footprint versus the seat), overall height 760–970; seat height off floor 510–610; tray height off floor 660–760; seat width ~430, seat depth ~230.

**Shape breakdown**: seat box + backrest box angled slightly back (baby faces local +Z, same as the tray/front convention); 4 legs as tapered cylinders or thin boxes (some models use a single central pedestal cylinder with a cross-foot, à la wooden growth chairs; classic tube-leg plastic models use 4 splayed cylinders, front 2 sometimes ending in small caster spheres for rolling models); flat tray box attached at the front via two short cylinder arms (hinged/removable — model as a separate piece offset slightly, can "detach" by hiding it), with a shallow circular cylinder-cutout suggestion for a cup-holder; thin box/strap details for the 5-point harness (a simple decal-level detail, skip separate geometry). Footrest as a small flat box between the front legs partway up.

**Colors & finishes**: bright molded plastic (red, blue, green, gray, white) for mainstream models; natural or painted beechwood for Scandinavian adjustable-growth designs (e.g., Tripp-Trapp style); tray often translucent/clear plastic or color-matched; seat cushion insert in a printed fabric pad.

**Placement**: Floor, kitchen/dining room, typically pulled up to or near the dining table.

**Active / interactive state**: "occupied + feeding" could show a food-splatter decal on the tray and a subtle dimmed cushion when unoccupied vs. bright when in use; growth-chair variants have an adjustable-height seat/footrest that could visually step between 2–3 discrete height presets. Rolling models' front casters could get a tiny highlight when "moved."

**Variations**: classic 4-leg plastic/molded (fixed height), adjustable wooden growth chair (seat + footrest slide, grows child→adult), 3-in-1 convertible (highchair → booster → youth chair, i.e., swap in shorter legs), hook-on clamp/table-mounted chair (no legs at all — clamps to a tabletop, mountable, tiny footprint), simple strap-on booster cushion (straps to a normal dining chair — smallest variant, essentially just a cushion + strap box, no legs).

**Animation opportunities**: idle — none needed (or a faint tray-cushion idle bob if paired with an occupant rig); active — food splatter/mess decal fade-in while an activity anchor (`feed_baby`-style) is engaged, tray attach/detach as a simple slide, adjustable-growth models step between height presets when reconfigured.

### Stroller

**Typical dimensions** (mm, unfolded, single-seat standard):

| Variant | L | W | H (canopy/handle) | Wheels |
|---|---|---|---|---|
| Full-size single | 900–970 | 560–635 | 1000–1020 | front swivel ⌀150–200, rear ⌀200–250 |
| Umbrella/lightweight | 750–850 | 380–430 | 950–1020 | small ⌀100–130 all around |
| Jogging | 950–1050 | 600–650 | 1000–1050 | large fixed ⌀400 rear, ⌀300 front |
| Double side-by-side | 900–970 | 760–810 | 1000–1020 | as single |
| Double tandem | 1150–1270 | 560–635 | 1000–1020 | as single |

Folded footprint (upright, leaning): roughly the same W, L collapses to 250–500 mm, H stays near-full or drops slightly.

**Shape breakdown**: seat "shell" as a scooped/angled box (backrest tilted back a few degrees) mounted on a simplified frame — approximate the fold-linkage with two flat side-frame boxes rather than modeling every strut; canopy as a curved shell (a scaled/cut sphere section or a shallow angled box works well at this stylization level) hinging over the top-front of the seat; basket underneath as a shallow open box; handlebar as a bent cylinder or two angled cylinders joining a straight cylinder grip at the top rear (~1000 mm height); wheels as flat cylinders (front smaller + swivel-mounted via a short vertical cylinder caster stem, rear larger and fixed); a bumper bar as a thin cylinder arcing in front of the seat. Front face (+Z) = the direction the seat faces/canopy overhangs (opposite the handlebar, i.e., handlebar is at −Z/"back").

**Colors & finishes**: aluminum/steel frame in silver, black, or gunmetal; seat & canopy fabric in black, gray, navy, tan/camel, or pastel (mint, blush) — sometimes printed; wheels black rubber/foam with plastic hubs; basket typically black mesh/fabric.

**Placement**: Floor — entryway, mudroom, garage, or nursery; frequently stored **folded** and leaned against a wall (a distinct "folded" pose is worth modeling as a variant/state rather than only upright).

**Active / interactive state**: fold/unfold as an animated openFraction (like a garage door or cover) collapsing frame height and rotating the wheels inward; a snap-in infant car-seat carrier (separate small pod shape with a carry handle) can dock onto the frame for "travel system" variants — show/hide that pod as an attachment. Wheels could get a subtle rotation cue if the object is dragged/repositioned, purely cosmetic.

**Variations**: full-size single, umbrella/lightweight (smallest folded size), jogging (oversized wheels, no swivel front), double side-by-side, double tandem, travel-system with detachable infant car-seat pod.

**Animation opportunities**: idle — canopy/basket static, maybe a faint sway if treated as outdoor; active — fold/unfold openFraction animation (frame height + wheel-splay easing), infant-pod attach/detach, wheel spin tied to any drag/move interaction.

---

## Safe and gun cabinet

### Typical dimensions

W × D × H, mm — exterior:

| Variant | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Small handgun/document safe | 350–450 | 350–450 | 350–500 | Floor or shelf box, often with a small pistol capacity |
| Compact gun safe (10–14 guns) | ~560–635 | ~380–460 | ~1100–1300 | Common apartment/closet size |
| Standard gun safe (24–30 guns) | 660–760 mm (Liberty USA-30: 762×559×1537 mm) | 559–635 | 1500–1830 | The classic tall black rectangular vault |
| Large/oversized safe (40–60+ guns) | 710–1020 | 510–635 | 1500–1830 | Same silhouette, just wider |
| Wood/glass-front display gun cabinet (12-gun) | 735–1155 (typ. 735, some up to 1155 wide) | 330–370 | 1830–1920 | Furniture-style, not a security safe |

Sources: Liberty USA-30 spec (762×559×1537 mm exterior); American Furniture Classics 12-gun glass cabinet (~735×370×1920 mm).

### Shape breakdown

- **Security safe**: one dominant box (the body), corners very slightly rounded but a plain box reads fine at this style scale. A second, very slightly smaller/inset box as the door, hinged on one vertical edge — front face is local **+Z**.
- Door front details: a round cylinder disc for the dial/electronic keypad (off-center, upper-third), a small rectangular box handle/spoke wheel protruding on +Z, and 4–6 small cylinder bolt-stubs peeking from the door edge (visible only when open, optional detail).
- Recessed box (slightly darker/inset, scaled ~0.9 of the front) for the door panel look, plus a thin box trim strip (contrasting color) near the top as the manufacturer badge/logo band.
- **Wood/glass cabinet variant**: a tall box case, top portion is a glass-front door (a thin transparent box pane inset in a frame box) showing 2 angled cylinder gun-barrel rests inside; bottom portion is a solid wood box with a smaller cabinet door for ammo/handgun storage, often a box drawer beneath.
- Feet: 4 tiny cylinder or box stubs/levelers under the base, or the safe just sits flush.

### Colors & finishes

- Security safes: matte or textured **black** (most common), **gunmetal grey**, hunter green, or graphite; textured "wrinkle powder-coat" paint (render as a matte, slightly rough material, not glossy). Chrome or brass-tone accents on the handle/dial/hinges/trim band.
- Wood cabinets: **oak, pine, cherry, espresso/dark walnut, or grey-washed** finishes; brass or black hardware; tempered-glass door (light blue-tinted transparent material) framed in matching wood.

### Placement

Floor-standing, always. Security safes go in a closet, garage, basement, or bedroom corner; sometimes bolted to the floor/wall studs (no visual change needed). Wood display cabinets are a living-room/den/office "trophy" piece, placed against a wall. Rests flush on the floor (no legs needed structurally, though small levelers are common); no counter or wall-mount variant for the large sizes. (Small pistol boxes can optionally be modeled as bolting to a closet shelf/nightstand top, but floor placement is the default and sufficient.)

### Active / interactive state

- **Door open/closed** is the primary interactive state — swing the door box open ~90–110° about its hinge edge (mirrors the existing door/fireplace-panel pattern), revealing interior shelving (a few thin horizontal box shelves) and, for the wood cabinet, visible "gun" silhouettes (simple thin cylinders) resting in barrel-rest notches.
- Electronic-lock variant: a tiny emissive keypad LED (red = locked/idle, green flash = just unlocked) — a nice cheap highlight using the same emissive-dot idiom as other fixtures.
- No powered/animated idle state otherwise — it's inert furniture. Could bind a `lock.*` or `binary_sensor` (door contact) entity the same way `Door.lockEntity`/fridge `doorEntity` already work in this codebase, driving open/closed + LED color.

### Variations & customizations

- Security safe: color (black/grey/green), size tier (compact/standard/large), keypad vs. dial-and-handle lock face, optional top handle bar across the door.
- Wood cabinet: wood tone, glass vs. solid door, number of barrel slots (affects nothing visually beyond interior clutter count), with/without a bottom drawer.
- Optional "open interior" detail toggle (show a handful of simple rifle/shotgun silhouettes standing in slots) for extra flavor when the door is open.

### Animation opportunities

- Idle: essentially static (it's a locked box) — at most a very subtle keypad LED blink/breathe if bound to a lock entity.
- Active: door swings open/closed on interaction/state change (reuse the door-hinge-swing animation pattern already used for fridges/doors); optional brief green LED flash + soft click-moment scale-pulse on unlock; if modeling the interior, guns could very slightly sway/settle on open (cheap secondary motion, low priority).

---

## Modeling notes for Diorama

This category spans **20 item groups**, most best implemented as new `FurnitureKind`s (or, for one-off/user-authored pieces, `ObjectRecipe` custom objects) following the conventions in `geometry.ts` / `three-renderer.ts`. A few (robot vacuum) already have a dedicated first-class system and should NOT be reimplemented as furniture.

### Suggested `FURNITURE_KINDS` defaults

All footprints in mm (w × d), height in mm, tint as a representative hex, category per `furnitureCat`/`cat` grouping used for sidebar optgroups. `seat` marks a sittable piece (registers a `SitSpot`); `surface` marks a counter-height host; `mountable` marks a piece that auto-snaps onto a `surface` host; `activity` names the `ActivityKind` anchor the piece should register.

| Kind | w × d (mm) | height (mm) | Default tint | Cat | Notes |
|---|---|---|---|---|---|
| `tv` *(existing appliance kind — extend, don't duplicate)* | 1240×90 | 720 | `#161616` | appliance | wall-snap or stand-mounted; screen emissive on `playing` |
| `tv_stand` *(existing casework kind)* | 1470×430 | 500 | `#4a3222` | casework | `surface` host for TV/console |
| `desk` *(existing casework kind — extend)* | 1400×700 | 740 | `#8a6a45` | casework | `surface` host for monitor/keyboard/tower |
| `monitor` (new, mountable) | 620×220 | 430 | `#161616` | electronics | `mountable`; screen emissive when "on" |
| `pc_tower` (new) | 220×450 | 460 | `#161616` | electronics | floor or `mountable` on desk shelf |
| `treadmill` (new) | 900×2000 | 1450 | `#1a1a1a` | fitness | `activity: 'exercise_equipment'` |
| `exercise_bike` (new) | 550×1150 | 1300 | `#1a1a1a` | fitness | `activity: 'exercise_equipment'` |
| `weight_bench` (new) | 1250×300 | 450 | `#141414` | fitness | `seat: 300` (lying/press pose host) |
| `dumbbell_rack` (new) | 900×500 | 900 | `#1a1a1a` | fitness | no seat/activity; static prop |
| `piano_upright` (new) | 1500×620 | 1150 | `#241a14` | decor | wall-adjacent; `activity: 'play_piano'` (new kind) |
| `piano_grand` (new) | 1520×1750 | 1000 | `#241a14` | decor | free-standing; `activity: 'play_piano'` |
| `guitar_stand` (new) | 320×310 | 400 | `#1a1a1a` | decor | small footprint, no activity by default |
| `toy_chest` (new) | 930×460 | 460 | `#d94f4f` | kids | `seat: 460` on bench variant only |
| `pet_bed` (new) | 686×914 | 100 | `#8a8478` | pet | `seat`-like "lie" spot for pet rigs |
| `pet_crate` (new) | 762×533 | 610 | `#1a1a1a` | pet | door pivot like fridge/appliance |
| `litter_box` (new) | 406×356 | 200 | `#9aa0a6` | pet | floor puck, no seat |
| `laundry_hamper` (new) | 500×500 | 650 | `#e8e2d8` | utility | lid pivot optional |
| `ironing_board` (new) | 380×1370 | 900 | `#c8c8c8` | utility | `activity: 'iron_clothes'` (new kind) |
| `drying_rack` (new) | 1200×550 | 950 | `#c8c8c8` | utility | static, optional fabric-sway sub-mesh |
| `trash_can_indoor` (new) | 330×330 | 630 | `#b0b3b8` | utility | reuse outdoor bin FULL-state prop logic |
| `floor_fan` (new) | 400×400 | 1200 | `#e8e8e8` | electronics | blade-hub spin + oscillation |
| `aquarium` (new) | 770×320 | 325 (+stand 760) | `#3a6b7a` | decor | `mountable` on stand; always-on ambient fish |
| `game_console` (new, mountable) | 150×260 | 390 | `#e8e8e8` | electronics | `mountable` on tv_stand shelf |
| `coat_rack` (new) | 450×450 | 1800 | `#241a14` | decor | static |
| `umbrella_stand` (new) | 280×280 | 600 | `#2b3a55` | decor | static |
| `shoe_rack` (new) | 900×350 | 850 | `#8a6a45` | casework | open shelves, optional `seat` on bench variant |
| `storage_tote` (new, mountable/stackable) | 654×467 | 492 | `#2a2a2a` | utility | `mountable` on `utility_shelving` |
| `utility_shelving` (new) | 914×457 | 1880 | `#2a2a2a` | utility | `surface`-tiers host for totes |
| `grandfather_clock` (new) | 550×320 | 2000 | `#4a3222` | decor | continuous pendulum swing (always-on ambient) |
| `crib` (new) | 1300×760 | 1050 | `#e8e2d8` | kids | mobile-rotation ambient |
| `changing_table` (new) | 900×500 | 1000 | `#e8e2d8` | kids | `surface` for a baby prop |
| `high_chair` (new) | 550×700 | 900 | `#c0392b` | kids | `seat: 550` |
| `stroller` (new) | 950×600 | 1010 | `#2b2b2b` | kids | openFraction fold/unfold |
| `safe` (new) | 660×560 | 1500 | `#1a1a1a` | storage | door pivot ~90–110°, optional `lock.*` bind |
| `gun_cabinet` (new) | 900×360 | 1900 | `#4a3222` | storage | door pivot, glass-front variant |

`robot_vacuum` / `robot_mower` are **not** new furniture kinds — they already exist as `RobotFixture` (`Floor.robots`); reuse that system's dock geometry + `Planner.stepRobots` movement controller rather than re-deriving vacuum behavior from the cleaning-supplies research above.

### `ObjectRecipe` custom-object mapping

Every shape breakdown above is already written as a primitive list (box/cylinder/sphere/cone with size/pos/rot/color in local mm, origin at floor-center, +Z = front) and can be authored directly as an `ObjectRecipe` before graduating to a first-class `FurnitureKindDef` + `_buildFurniture` switch case:

- **Simple static props** (coat rack, umbrella stand, storage totes, dumbbell rack, guitar stand, toy chest closed) are single-digit primitive counts — ideal first-pass `ObjectRecipe`s with no renderer code changes needed.
- **Composite hinged pieces** (pet crate door, safe/gun-cabinet door, toy-chest lid, laundry-hamper lid, trash-can lid, changing-table fold-down) need a pivot group — these should graduate to real `FurnitureKindDef` builders so they can reuse the existing appliance-door pivot/ease-blend idiom (`_applianceDoors`, τ≈0.25 s) rather than re-deriving hinge math per recipe.
- **Always-on ambient movers** (aquarium fish, grandfather-clock pendulum, floor-fan blades, robot-vacuum equivalent) need renderer-side per-frame logic (like the fireplace flicker / blob-shadow re-grounding) and cannot be pure static recipes — budget renderer time for these, not just modeling time.

### Placement summary (floor / surface / wall / ceiling)

- **Floor-resting** (the majority): treadmill, exercise bike, weight bench, dumbbell rack, upright/grand piano, toy chest, pet bed/crate/litter box, laundry hamper (most variants), ironing board, drying rack, upright vacuum/broom/mop/bucket, indoor trash can, pedestal/tower fan, aquarium (via its stand), coat rack (tree), umbrella stand, shoe rack, utility shelving, grandfather clock, crib, changing table (standalone), high chair, stroller, safe, gun cabinet.
- **Mountable (auto-snaps to a `surface` host)**: monitor + keyboard + mouse (desk), tabletop/desktop fan, table-fan variant, game console + accessories (TV stand shelf), aquarium (nano/desktop size), storage totes (onto utility shelving), travel-pad changing mat (onto any surface), coffee_maker/toaster-style countertop items already covered elsewhere.
- **Wall-snapped**: TV (wall-mount bracket variant), coat rack (wall-rail variant), drying rack (wall-mounted folding variant), changing table (fold-down wall variant), ironing board (wall-stored bracket — folded pose).
- **Ceiling-hung**: none in this category — the closest is a motorized drop-down TV bracket (niche/optional), which still anchors from a wall/ceiling stud rather than a true hanging fixture.

### Items that want an "active/running" animated state

Priority order by animation value (per the researched sections' own callouts):

1. **Aquarium** — always-on ambient: swimming fish loop, rising bubbles, water shimmer; light on/off bindable to `light.*`.
2. **Grandfather clock** — always-on ambient: pendulum swing + real-time hand rotation; optional hourly chime flourish (reuse `TransientPulse`).
3. **Floor/table fan** — blade-hub spin + oscillation sweep when "on"; speed-scaled vibration jitter.
4. **Treadmill / exercise bike** — belt scroll or crank/pedal/flywheel rotation while "in use," synced to the anchored avatar's `exercise_equipment` activity pose.
5. **TV / gaming console / computer monitor** — emissive screen-glow swap on `media_player`/power-state change, mirroring the existing appliance in-use LED convention.
6. **Robot vacuum** (existing system) — path-driving, LED state color, dock/undock sequence; reuse `RobotFixture`, don't rebuild.
7. **Doors/lids with no bound entity** (safe, gun cabinet, pet crate, toy chest, indoor trash can, storage tote): click-toggle `localState` open/closed via the existing appliance-door pivot/ease-blend idiom — gives every one of these a satisfying interaction even unbound.
8. **Static set-dressing** (dumbbell rack, guitar stand, coat rack, umbrella stand, shoe rack, ironing board/drying rack at rest, crib/stroller/changing table baseline): no animation required beyond optional idle sway/breathing details already used elsewhere in the renderer (bed-cover breathing, plant sway) — don't over-invest here.

New `ActivityKind` anchors worth adding alongside the existing `PHASE4_ACTIVITIES` set: `exercise_equipment` (already exists — extend to cover the new fitness kinds), `play_piano`, `iron_clothes`, and optionally `browse_shelf`/`hang_coat` (low priority, mirrors `browse_bookshelf`). All should follow the anti-feedback rule (dwell/trigger reads RAW target position, pose blend uses the existing `bl(cur,tgt,w)` idiom) and reuse existing joint channels (hip/knee/shoulder/elbow, root pitch/roll) rather than adding new rig joints.
