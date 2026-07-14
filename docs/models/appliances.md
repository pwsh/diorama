# Household Appliances — Diorama Modeling Reference

This document is a build reference for stylized 3D models and animations of
household appliances in **Diorama**, a Sims-2000-style Home Assistant
floor-plan app. Every item is meant to be assembled from simple primitives
(box / cylinder / sphere / cone), positioned in **millimeters**, with the
local origin at the piece center **on the floor** and local **+Z as the
front face** (matching the `ObjectRecipe` custom-object convention). Real
dimensions, colors, and behaviors are sourced from manufacturer spec sheets
and standards so a modeler can work straight from each section without
further research.

## Table of Contents

1. [Clothes Washer](#clothes-washer)
2. [Clothes Dryer](#clothes-dryer)
3. [Dehumidifier](#dehumidifier)
4. [Dishwasher](#dishwasher)
5. [Ice Maker](#ice-maker)
6. [Refrigerator](#refrigerator)
7. [Chest & Upright Freezer](#chest--upright-freezer)
8. [Range / Oven / Cooktop](#range--oven--cooktop)
9. [Microwave (Over-the-Range & Countertop)](#microwave-over-the-range--countertop)
10. [Range Hood / Vent Hood](#range-hood--vent-hood)
11. [Wine & Beverage Fridge](#wine--beverage-fridge)
12. [Water Heater (Tankless & Tank)](#water-heater-tankless--tank)
13. [Garbage Disposal](#garbage-disposal)
14. [Trash Compactor](#trash-compactor)
15. [Air Purifier](#air-purifier)
16. [Portable Air Conditioner](#portable-air-conditioner)
17. [Space Heater](#space-heater)
18. [Furnace / Air Handler](#furnace--air-handler)
19. [Modeling notes for Diorama](#modeling-notes-for-diorama)

---

## Clothes Washer

*Top-load and front-load.*

### Dimensions (W × D × H, mm)
| Variant | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Front-load, standard | 600 | 600–700 | 850 | 24" nominal width class; door swings proud ~300 mm when open |
| Front-load, US full-size | 685 | 800–865 | 990–1015 | 27" width class (Whirlpool/LG/Samsung big-capacity) |
| Compact / portable (front or top) | 500–600 | 550–600 | 700–850 | apartment/stackable class |
| Top-load, standard | 685–735 | 710–815 | 1070–1115 | lid adds ~250 mm swing-up clearance above body |
| Stacked laundry center (washer+dryer) | 685 | 800 | 1800–1830 | single tall unit, front-load drum on bottom |

### Shape breakdown
- **Body**: one large box (rounded-corner look achieved by a slightly smaller box + thin bevel box on front edges, or just keep it a hard box — toon style tolerates it).
- **Front-load door**: a large disc/porthole — a flattened cylinder (drum window) inset ~40 mm into the front face, ringed by a slightly raised frame (approximate with a thin flattened cylinder ring, OD ≈ 0.55× body width). Behind it, a smaller dark cylinder (the drum, visible through glass) that can rotate for the "running" animation. Door itself: a circular disc (thin cylinder) as a child pivot group hinged on its left or right vertical edge, swings open ~100–120° about a vertical axis — hinge offset to one side of porthole.
- **Top-load lid**: a flat box (slightly larger than body footprint) hinged along the BACK top edge (local +Z axis line), opens upward/backward ~95–100°, pivot at back-top.
- **Control panel**: a shallow box strip across the top-front (front-load) or a rear console box standing up behind the lid hinge (top-load) — holds a small rectangular display/dial detail.
- **Dial/knob**: small cylinder protruding from control panel, optionally with a thin line decal for a rotary-dial pointer.
- **Feet**: 4 short cylinders, or omit (floor-flush box is fine at this stylization level).
- Front face = local −Z convention: for front-load, porthole + control strip face −Z; for top-load, lid opens toward −Z / hinge at +Z (back).

### Colors & finishes
- Body: white (most common, ~70%+ of market), with black stainless, "diamond gray", chrome-accent, and black as premium options; some compacts in stainless-look plastic.
- Door ring / control strip: chrome, black, or matching body color; door ring often a contrasting metallic band.
- Glass porthole: dark smoked/blue-tinted transparent material (front-load only).
- Overall finish: matte-to-satin plastic/enamel-steel look — flat toon shading works well; avoid glossy PBR highlights.

### Placement
- **FLOOR**-standing, always. Common rooms: laundry room, utility/mud room, basement, garage, kitchen-adjacent closet, or stacked in a closet nook.
- Body rests directly on floor (feet ~0–20 mm, negligible); top-load lid-open clearance needs ~600 mm headroom above unit; front-load stacking allows a dryer or storage box directly on top (flat-top models).

### Running / active indicators
- Real cues: status LED/light ring, LCD/segment display showing cycle & time remaining, illuminated start button, front-load drum visibly tumbling behind the glass, water sloshing early in cycle, door-lock indicator light, subtle machine vibration/rocking during spin cycle. Lid/door is LOCKED while running.
- Recommended stylized cues:
  1. **Tumbling silhouette in the porthole** (front-load): rotate a simple dark blob/cylinder cluster inside the glass disc continuously while running — the single most legible "washer is on" tell.
  2. **Pulsing status-ring / LED dot** on the control strip (soft emissive glow cycling opacity) — works for both top- and front-load and reads at a distance.
  3. **Body micro-wobble during "spin" phase**: brief high-frequency small-amplitude rotation/position jitter (fireplace-flicker idiom — `Math.random()`-driven timing only) — sells the spin-cycle vibration without physics.
  4. Optional: faint rising **steam-shimmer** decal above the unit for a modern steam-cycle washer.

### Variations & customizations
- Load type: top-load vs front-load (distinct geometry/animation).
- Size class: compact/portable, standard, oversized capacity, stacked laundry center.
- Door/lid hinge side (front-load: left or right — cosmetic mirror).
- Finish/color swap (white/black/gray/graphite/stainless-look).
- Pedestal option: adds a drawer box (≈350–400 mm tall) beneath the unit, raising the whole body.
- Control style: dial-only vs digital display + buttons.

### Animation opportunities
- **Idle**: static; maybe a very slow ambient LED breathing glow if a "smart" powered-on/standby state exists.
- **Active/running**: tumbling drum silhouette rotation (front-load, continuous while running); lid/door closed & lock-indicator lit; pulsing status LED; periodic spin-cycle body wobble bursts; optional water-level shimmer line inside the porthole glass early in a cycle; cycle-complete flashes the LED faster/brighter for a few seconds then settles.
- **Manual interaction**: click toggles door/lid open↔closed (door swings on Y-axis pivot / lid swings on X-axis pivot), matching the fridge/dishwasher/microwave door idiom; dblclick opens the entity-picker/bind flow.

---

## Clothes Dryer

*Electric & gas, vented.*

### Dimensions (W × D × H, mm)
| Variant | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Standard top-control | 685–735 | 710–815 | 915–1090 | 7.0–7.4 cu ft drum, classic boxy top-control dryer |
| Front-control / HE | 685–735 | 760–815 | 965–1120 | Slightly taller, often has raised control console at back of top |
| Compact / stackable (ventless) | ~610 | 610–865 | 840–890 (unit only, ~1980 stacked w/ washer) | 24" nominal width, heat-pump or condenser, no vent duct |
| Pedestal option | +355–380 added height | — | — | Storage drawer riser many buyers add under the unit |

Door swing clearance: allow ~560–610 mm in front for the door to open (hinged on left or right, opens toward viewer / +Z).

### Shape breakdown
- **Body**: one large box ≈ W×D×H — rounded corners can be faked with a slight bevel or left as a hard box for the Sims-toon aesthetic.
- **Control console**: a slim box (W × ~90 D × ~90–130 H) sitting on the rear-top edge of the body (front-control models) or flush across the full top-front (top-control models) — houses a small recessed box/decal for the display and tiny cylinder "knob" details.
- **Door**: a large circular door dominates the front face — model as a flattened cylinder (disc, radius ≈ 220–260 mm, thickness ~40 mm) inset into the front box, offset slightly +Z proud of the face; add a smaller concentric cylinder inside for the glass/window (darker, semi-transparent tint) and a cylinder door handle/rim detail. Door pivots open on a vertical hinge axis (rotate about a Y-axis edge, swinging toward +Z / outward).
- **Lint trap**: a small horizontal box slot near top-front edge (cosmetic detail only, optional).
- **Vent port** (vented models only): a cylinder stub (~100 mm dia) protruding from the back face (−Z) near the bottom — useful for back-wall clearance logic.
- **Feet**: 4 tiny cylinders/boxes at the base corners, mostly hidden — usually skip for a stylized low-poly build.

### Colors & finishes
- Dominant: white/off-white (majority of market), with graphite steel / slate gray / black stainless / "chrome shadow" as common upgrade finishes.
- Matte or brushed-metal-look front panel; door often has a smoked/tinted glass-look window (darker gray-blue disc).
- Control panel usually a contrasting dark gray/black inset with a small blue/white LED display.
- Toon-shaded material should get a gentle specular pop on the door glass disc to read as "glass."

### Placement
- Rests on the **FLOOR**. Laundry room, utility room/closet, basement, garage, or a closet nook adjacent to the washer (almost always paired side-by-side or stacked). Vented units need a rear wall gap (~100–150 mm) for the exhaust duct + hookup. Sits flush on the floor at 0 elevation (same as washer/fridge/dishwasher).

### Running / active indicators
- Real cues: lit control-panel display/LED, illuminated start button, sometimes a porthole light behind the door glass (rare, high-end only). No light or motion is visible from the drum itself since it's enclosed and opaque.
- Recommended combo:
  1. **Soft pulsing amber/blue glow** on the control-panel display decal — matches the existing appliance-LED idiom (fridge/dishwasher in-use glow).
  2. **Gentle body wobble/vibration** — sinusoidal micro-rotation/jitter of the whole body mesh (a couple mm of shake), evoking the tumble/spin cadence.
  3. Optional nice-to-have: **rising heat-shimmer / faint steam wisp** from the vent stub or top seam (low, slow opacity, reusing an existing particle idiom if available).

### Variations & customizations
- Fuel type: electric vs gas (visually identical; probably a metadata flag rather than a separate model).
- Size: standard vs compact/stackable (24") vs oversized (7.4+ cu ft, slightly larger box).
- Control layout: top-control (flush top panel) vs front-control (raised rear console).
- Finish/color swap: white / black stainless / graphite / slate.
- Stacked configuration: dryer-on-washer combo tower (doubles the effective height, centers the dryer above the washer footprint).
- Door hinge side: left vs right.

### Animation opportunities
- **Idle**: no motion; maybe a faint occasional flicker of the control display if bound to a "ready/done" entity state.
- **Active (running)**: body wobble/vibration loop, pulsing control glow, optional slow-drifting steam/heat shimmer from the vent, subtle rocking reflection on the door glass to imply drum motion.
- **Cycle-complete cue**: a brief brighter flash/blink of the display glow (distinct from steady "running" glow).
- **Door interaction**: door swings open/closed on click/bind (same swing-door idiom as the fridge) — useful as an activity anchor if laundry activities are added.

**Sources:** [Maytag washer/dryer sizing](https://www.maytag.com/blog/washers-and-dryers/washer-dryer-size.html) · [Whirlpool laundry sizing guide](https://www.whirlpool.com/blog/washers-and-dryers/laundry-sizing-guide.html) · [EasyBear standard dryer dimensions](https://easybear-appliancerepair.com/blog/standard-dryer-dimensions) · [Coast Appliances dryer dimensions](https://www.coastappliances.ca/blogs/learn/dryer-dimensions) · [Whirlpool WGD5000D spec sheet](https://www.whirlpool.com/content/dam/global/documents/202003/specification-sheet-wgd5000dspecsheetv01.pdf) · [Whirlpool WGD4950HW](https://www.us-appliance.com/wgd4950hw.html) · [Whirlpool gas dryer dimension guide](https://www.whirlpool.com/content/dam/global/documents/200210/dimension-guide-3979174-D-WH.pdf) · [Bosch compact stackable laundry](https://www.bosch-home.com/us/products/compact-laundry/stackable-washer-dryer) · [Whirlpool WCD3090JW ventless dryer](https://www.whirlpool.com/laundry/dryers/electric/p.4.3-cu.-ft.-24-small-space-ventless-dryer.wcd3090jw.html) · [LG 24 in ventless stackable dryer](https://www.homedepot.com/p/LG-24-in-W-4-2-Cu-Ft-Ventless-Stackable-Compact-SMART-Electric-Dryer-in-White-with-Dual-Inverter-HeatPump-Technology-DLHC1455W/316457781)

---

## Dehumidifier

*Portable room unit.*

### Dimensions (W × D × H, mm)
| Variant | W × D × H | Capacity | Notes |
|---|---|---|---|
| Mini/tabletop (thermoelectric) | 150×150×220 – 200×200×300 | 0.3–1.3 L tank | No wheels; counter/shelf unit |
| Compact 20–30-pint | 300×230×480 | ~4–6 L tank | Small tower, 2–4 casters |
| Standard 40–50-pint | 350–400×250–300×580–650 | 6–7 L tank | Most common "basement" size — the archetype to model |
| Large/commercial 70-pint-class | 420×320×700 | 8–10 L tank or pump-drain | Taller tower, sometimes handle bar |

Overall silhouette across all but the mini size: a **tall rounded-corner tower roughly 1.4–1.9× taller than it is wide** — depth is usually the *smallest* dimension (front face is the widest side).

### Shape breakdown
- **Body**: one main box, front face = **local +Z**, with softened/rounded vertical edges (chamfered box, or box + thin cylinder quarter-rounds at the 4 corners if rounding is wanted).
- **Front bucket door**: a slightly recessed box insert in the lower-front third (bottom ~40% of height) — often has a small rectangular **window strip** (tinted blue/gray box, slightly inset) so the water level is visible.
- **Control panel**: a small flat box or recessed panel near the TOP-front, holding the LED display + buttons.
- **Top**: shallow cylinder or rounded box forming a grille/vent area, sometimes with a recessed carry handle (thin dark box slot).
- **Air intake**: louvered grille on the back or lower sides — a darker flat box/decal panel, no need for real slats.
- **Casters**: 4 small cylinders/discs at the base corners lifting the unit ~30–40 mm off the floor.

### Colors & finishes
- Overwhelmingly **white or off-white/light-gray** ABS plastic, matte body with a slightly glossier front control panel.
- Premium/"gallery" lines add **black or graphite** bodies.
- Bucket window insert: translucent blue-gray or smoke-tinted plastic.
- Display: black bezel with blue, green, or red LED/LCD digits.
- Grille/vents: darker gray or black accent panels against the white body.

### Placement
- **FLOOR**-standing for compact/standard/large (basement, laundry room, bathroom, bedroom) — rests on its casters, no mounting.
- **Mini/tabletop units** rest on a **COUNTER** or shelf instead of the floor.
- No wall-mount or ceiling variants for portable units.

### Running / active indicators
- LED/LCD display showing current humidity % or a running-fan icon — always lit when powered on.
- Status LEDs: power light, "bucket full" light (usually red, blinks + beeps), Wi-Fi light on smart models.
- Recommended cues:
  1. **Emissive status dot/display glow** — steady green while running, pulsing/blinking red when the bucket is full (best fit — mirrors the real bucket-full LED behavior).
  2. **Rising heat-shimmer / faint mist wisp** from the top vent grille while active.
  3. Secondary: **subtle body hum-vibration** + a faint glow pulse on the display bezel.

### Variations & customizations
- Size tiers: mini/tabletop, compact (20–30 pt), standard (40–50 pt), large/commercial.
- Color options: white, black/graphite, light gray.
- Bucket-drain vs. **continuous drain hose** variant (thin hose trailing from a rear-lower barb fitting to the floor/drain).
- Built-in pump models (identical shell).
- Smart/Wi-Fi models add a small antenna icon on the display.
- Handle variants: recessed top handle vs. side cut-out grips vs. none (mini units).

### Animation opportunities
- **Idle (plugged in, off)**: none — static object, display off/dark.
- **Active/running**: pulsing display glow or status LED (green breathing pulse); periodic vent shimmer/mist wisp; subtle continuous micro-vibration/jitter; occasional "drip" particle animating into the bucket window.
- **Bucket-full event**: red LED fast-blink + a one-shot "beep" visual (small radiating rings or an exclamation glyph).
- **Interaction**: bucket door slides/swings out slightly when toggled/inspected, echoing the appliance-door idiom.

---

## Dishwasher

### Dimensions (W × D × H, mm)
| Variant | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Standard built-in | 600 (nom. 610) | 600–610 | 815–890 | Actual cabinet-fit width often 597–600 mm; fits under a 900 mm counter |
| Compact/slim built-in | 450 (17⅝–18") | 600–610 | 815–890 | Same depth/height as standard, half the width |
| Oversized built-in | 760–1065 (30–42") | 610 | 890 | Panel-ready/luxury double-drawer or wide units |
| Portable/countertop | 400–560 (16–22") | 440–575 | 420–460 | Sits on counter, hose to faucet, no built-in plumbing |
| Portable (rolling, full-size) | 600 | 600–635 | 860–915 | Freestanding on casters, butcher-block top |

### Shape breakdown
- **Body**: single box, front face = local **+Z**. Built-in units are a plain rectangular box (side panels usually hidden by cabinetry, no bevel needed); portable units get slightly rounded top-front edges (fine as a plain box) plus a countertop/lid base (~20 mm feet or none).
- **Door/front panel**: a slightly recessed box (≈10–15 mm shallower than the body) inset in the +Z face — the "door" — spanning nearly the full height and width (control panel strip lives at the TOP edge on most modern hidden-control models).
- **Control panel**: either (a) a thin box strip along the top edge of the door face (hidden-control style — most common now) or (b) a thin box strip across the top of the whole unit above the door (older/traditional visible-control style).
- **Handle**: a thin horizontal cylinder or box spanning most of the door width, mounted just under the control strip (bar-pull) — the single most identity-defining silhouette part.
- **Toe-kick base**: built-in units have a recessed thin box at the very bottom front, flush with cabinetry.
- **Openable part**: the door pivots down and forward from a hinge at the **bottom edge** (unlike most appliance doors which hinge on a side) — front-drop door, ~0–100° open range.
- **Portable variant extra**: a small cylinder hose reel/bib on the top-back, and 4 casters under the base.

### Colors & finishes
- Dominant modern finish: **stainless steel** (light grey, subtle vertical brushed texture).
- Classic/budget: **white** or **black** monochrome plastic/enamel panel.
- Panel-ready/integrated: matches surrounding cabinetry (no visible appliance face at all).
- Portable countertop units: often white, black, or stainless with a butcher-block or laminate top (light wood tan or dark grey).
- Handle/control strip: usually a contrasting darker grey/black or matching brushed metal.

### Placement
- Room: **kitchen** (occasionally a butler's pantry).
- Built-in: rests on the **FLOOR**, tucked under the counter — top of unit sits flush with adjacent counter height (≈860–900 mm), so body height ≈815–890 mm plus leveling legs closes the gap.
- Portable: rests on the **FLOOR** (rolling cart, top acts as extra counter ≈900 mm) or on a **COUNTER** (compact countertop type, next to the sink).
- Compact/drawer dishwashers may come as stacked double-drawer units — still floor/under-counter.

### Running / active indicators
- Real cues: a small status LED or LED bar on the control strip/handle (many modern units project a red dot or light bar onto the floor when running, extinguishing or turning green when done); a small display showing remaining time; a "clean" indicator light on some models.
- No drum motion, no visible water, no steam is normally visible (fully enclosed) — the door stays shut while running.
- Recommended cues:
  1. **Emissive status dot/bar** on the handle or control strip — color-coded (blue/white = running, green = done, off = idle). Cheapest, truest to life.
  2. **Floor-projected light bar** in front of the unit (a thin glowing quad on the floor) that pulses gently while running — nods to the real red-dot feature.
  3. Secondary: **soft ambient hum glow / faint vibration wobble** on the body (very subtle, ~1 mm jitter).

### Variations & customizations
- Size: compact (450 mm) / standard (600 mm) / oversized or double-drawer (760+ mm) / portable countertop / portable rolling.
- Front style: visible-control (top strip with buttons/dial) vs hidden-control (top-of-door strip) vs fully panel-ready (no face at all).
- Finish: stainless / white / black / panel-matched / colorful retro (mint, red) for a stylized "vintage kitchen" set.
- Handle style: full bar pull vs small recessed finger-pull vs none (touch-open front).
- Door-open static prop variant for dishes-loading storytelling.

### Animation opportunities
- **Idle**: mostly static; handle or control strip could get a very subtle idle sheen/reflection sweep.
- **Active (running)**: pulsing emissive status dot/handle light; optional floor-projected light bar pulsing in sync; faint body vibration/wobble; soft ambient glow bleeding from the door seam.
- **Door open/close**: door swings down/forward from the bottom hinge (0→~95-100°), lower rack sliding out along local +Z once the door is down (optional stretch goal).
- **Cycle complete**: status color/LED flips (e.g., blue→green) and pulse stops.

**Sources:** [Whirlpool dishwasher dimensions](https://www.whirlpool.com/blog/kitchen/dishwasher-dimensions.html) · [KitchenAid dishwasher size guide](https://www.kitchenaid.com/pinch-of-help/major-appliances/how-to-choose-the-right-dishwasher-size.html) · [candimension.com dishwasher dimensions](https://candimension.com/dishwasher-dimensions/) · [EasyBear compact dishwasher dimensions](https://easybear-appliancerepair.com/blog/compact-dishwasher-dimensions)

---

## Ice Maker

### Dimensions (W × D × H, mm)
| Variant | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Portable countertop (compact) | 220–300 | 280–350 | 280–345 | e.g. Euhomy/Ikich-class units ~285×240×290–330 |
| Portable countertop (larger "bullet"/nugget style) | 300–390 | 350–460 | 340–400 | Cuisinart-class, taller lid |
| Standard built-in/undercounter (15") | 380 (15") | 530–610 (21–24"), some shallow-depth ~480 (18.8") | 840–870 (33–34") | ADA/cabinet cutout units, ~+25 mm clearance each side |
| Wide undercounter (24") | 610 (24") | 610–760 | 860–890 | Higher-output crescent/nugget machines |

### Shape breakdown
- **Countertop portable**: a single rounded-corner **box** body (a box with slightly bigger corner radius/bevel, or a box + 4 small quarter-cylinders at the vertical edges) on 4 small cylindrical/box feet (~15 mm tall).
  - **Lid**: a separate box on top, hinged at the back (+Y local edge) — the openable ice-bin lid, tips up/back to reveal the basket. Inset from the body footprint.
  - **Front face (+Z)**: a flat control-panel box insert (dark plastic/acrylic panel, ~2–5 mm proud) with a small rectangular **display window** (recessed dark box or plane) + 2–4 tiny button/LED discs (flattened cylinders).
  - Optional: a small window on the lid or front (lighter/transparent plane) to see ice; a small rear box bump for the fan/compressor vent grille (thin ridged box or flat darker decal).
- **Built-in/undercounter**: a tall **box** cabinet body with a front-hinged **door** (own box, local +Z front, hinge on one vertical edge — swings open like the fridge/dishwasher recipe) or a pull-out drawer front. Stainless door with a bar-pull handle: a thin horizontal or vertical cylinder mounted near the hinge-opposite edge. Small vent louvers at the base (recessed dark box band). Optional control display as a small top-edge strip.

### Colors & finishes
- Countertop: glossy **white**, **black**, **stainless-look plastic**, or pastel/retro colors (mint, red) — smooth plastic shell, dark-tinted lid/window, chrome-accent buttons or a black touch-panel insert.
- Built-in/undercounter: **stainless steel** (brushed, most common) or **panel-ready** (matches surrounding cabinetry — model as a flat colored/wood-tone box front). Black stainless is a secondary common finish.

### Placement
- Countertop portable: rests on a **COUNTER** or surface (kitchen counter, bar cart, home bar, office desk); ~50–100 mm side/back clearance for venting.
- Built-in undercounter: **built-in**, sits on the **FLOOR** recessed under a counter/cabinet run (top of unit ~860 mm to align with 900 mm counter height); front flush with cabinetry.
- Outdoor-rated undercounter versions exist for outdoor kitchens — same geometry, weatherproof stainless.

### Running / active indicators
- Real cues: small LED indicator lights (power / "making ice" / "ice full" / "add water"), sometimes a tiny digital display (cube countdown/clock). No moving external part while running (compressor/fan/water pump are all internal); lid stays closed during operation.
- Recommended cues:
  1. **Emissive status LED(s)** on the front panel cycling color/blink pattern — steady green while cycling, blinking amber for "ice full"/"add water" (best fit, cheapest).
  2. **Soft pulsing glow** from the display-window insert (emissive intensity oscillating slowly) if a display is modeled.
  3. Optional secondary: **rising steam/heat-shimmer wisp** from the rear vent grille (small billboard particle puff, intermittent).

### Variations & customizations
- Ice shape/style as a cosmetic label only (bullet, nugget/pebble, crescent) — maybe a slightly taller lid for nugget machines.
- Size tiers: compact countertop, standard countertop ("bullet"), 15" undercounter, 24" wide undercounter.
- Finish variants: white/black/stainless plastic (countertop) vs brushed stainless/panel-ready/black-stainless (built-in).
- Optional clear ice window on lid or door; optional top-mounted basket/scoop accessory prop (countertop only).

### Animation opportunities
- **Idle**: none — at most a very slow ambient LED "breathing" glow if bound to an always-on state.
- **Active**: cycle the front-panel status LED between colors or blink it on an interval (deterministic sine/step pattern, fireplace-flicker idiom); pulse the display-window emissive intensity slowly; occasional rear-vent steam/heat-shimmer puff.
- **Lid/door interaction**: click-to-toggle swings/tilts the lid open ~30–45° briefly (adding water/scooping ice) then eases shut, a one-shot rather than continuous state. For the built-in variant, wire into the existing fridge/dishwasher door-open pivot system exactly.

**Sources:** [KitchenAid undercounter ice maker dimensions](https://www.kitchenaid.com/pinch-of-help/major-appliances/undercounter-ice-maker-dimensions.html) · [Appliance Sizes: under counter ice makers](https://www.appliancesizes.com/under-counter-ice-makers) · [Reviewho undercounter ice maker dimensions](https://reviewho.com/undercounter-ice-maker-dimensions/) · [Katom ice maker sizes](https://www.katom.com/learning-center/ice-maker-sizes.html) · [Maxx Ice shallow-depth undercounter](https://maxx-ice.com/products/mim25c-maxx-ice-shallow-depth-indoor-built-in-undercounter-ice-maker-in-stainless-steel) · [Silhouette 15" built-in undercounter](https://www.silhouetteappliances.com/us/products/dim32d2bsspr/) · [EasyBear nugget ice maker dimensions](https://easybear-appliancerepair.com/blog/nugget-ice-maker-dimensions) · [Caynel countertop ice maker](https://www.amazon.com/Caynel-Countertop-Ice-Maker-Indicator/dp/B08MK4HV52) · [IKICH countertop ice maker](https://www.amazon.com/IKICH-Countertop-Portable-Electric-Indicator/dp/B08BD5P85N)

---

## Refrigerator

*French-door / side-by-side / top-bottom-freezer.*

### Dimensions (W × D × H, mm)
Body only; excludes handles/hinges (+25–50 mm depth) and door-open swing (+300–450 mm depth).

| Variant | Width | Depth (standard-depth) | Depth (counter-depth) | Height |
|---|---|---|---|---|
| Top-freezer | 700–830 | 730–875 | n/a (rare) | 1570–1685 |
| Bottom-freezer | 750–830 | 850 | 700–735 | 1700–1780 |
| Side-by-side | 760–1010 | 760–790 | 700–735 | 1730–1810 |
| French-door (incl. 4-door) | 760–915 | 870–940 | 700–735 | 1780–1830 |

- Primary default variant to model: **900 × 900 × 1780 mm** (36″×36″×70″ French-door, standard-depth).
- Counter-depth trims ~150–230 mm off the depth so the face sits nearly flush with counters.
- Compact/apartment top-freezer variant: ~600 × 650 × 1500 mm.

### Shape breakdown
- **Body**: one large box, front face = local **+Z** (note: this is the OPPOSITE of the codebase's furniture-front-is-−Z chevron rule — flag as an exception when building doors/handles).
- **Recessed kick plate**: thin box at the base, ~100 mm tall, inset ~40 mm from front face (reads as the compressor toe-kick).
- **Doors**: thin boxes (≈40–50 mm deep) as separate pivot groups flush on the front face:
  - French-door: 2 narrow door panels side-by-side (each ~half body width), hinged on outer edges, swinging outward ~70–110°, plus one or two freezer *drawer* boxes below that slide/pop forward (translate on open rather than rotate).
  - Side-by-side: 2 full-height door panels (freezer ~⅓ width, fridge ~⅔ width), hinged on their respective outer edges.
  - Top/bottom freezer: 2 full-width doors stacked vertically, hinged on the same side (or alternating), swinging outward.
- **Handles**: thin vertical cylinders or thin boxes proud of each door's inner edge (~15–20 mm dia, running most of the door height for French-door/side-by-side; a shorter bar handle for top/bottom-freezer).
- **Door dispenser/panel** (through-door ice & water, common on side-by-side and many French-door): a small recessed rectangular box/panel with a paddle (small box) and a shallow tray cutout.
- **Handle-side trim strip**: a slightly darker thin box strip along the door edges for definition.

### Colors & finishes
- Dominant: **stainless steel** (mid-grey, subtle vertical brushed texture) and **fingerprint-resistant stainless** (matte grey) — by far the most common.
- Classic: white, black, black stainless (very dark charcoal with steel sheen).
- Modern/premium: matte black stainless, "PrintProof" finishes, panel-ready (flat colorable box matching cabinetry).
- Textures: brushed-metal look for stainless; flat matte for black/white; a thin dark bezel line where doors meet.

### Placement
- Room: **kitchen** (occasionally garage/basement as secondary fridge, or a wet bar nook).
- Rests on **FLOOR** — freestanding, base at floor level (y=0), often flanked by cabinetry.
- Typically against a wall or at the end of a counter run; ~25–50 mm side clearance, more at the hinge side for door swing.
- Built-in/panel-ready sub-variant sits flush within cabinetry (counter-depth or true built-in ~610 mm deep) — same primitive approach, shallower depth + cabinet-matched color.

### Running / active indicators
- Essentially **no obvious "I'm on" visual signal** from outside — compressor hum and internal light only. Real cues that do exist: a door left ajar (audio chirp, not visual), a display/control panel on some French-door/side-by-side models, and a soft interior light glow when a door opens.
- Recommended cues (use 2):
  1. **Door-open state with interior glow** — swing the door open and emit a soft warm-white light from the interior + a faint light spill on the floor in front (matches the existing `doorEntity` binding pattern).
  2. **Small emissive status dot / LED strip** near the dispenser or top control panel — glows blue-white when "running normally," pulsing amber briefly to suggest an ice-maker cycle.
  3. Optional: **subtle ambient hum shimmer** — a very faint low-amplitude body vibration/scale pulse only while the bound power-draw entity is above idle threshold (fireplace-flicker idiom).

### Variations & customizations
- Style/type: top-freezer, bottom-freezer, side-by-side, French-door (2-door), French-door 4-door (second full-width bottom drawer split fridge/freezer).
- Size: compact/apartment, standard, counter-depth, oversized (36″+ French-door, 4-door).
- Finish: stainless, black stainless, black, white, panel-ready.
- Feature toggles: through-door ice/water dispenser (present/absent), external control panel/display (present/absent), handle style (bar vs recessed pocket handle).

### Animation opportunities
- **Idle**: essentially static — at most the barely-perceptible ambient hum shimmer and a slow LED breathing glow if a status light is modeled.
- **Active/interaction**: door swings open/closed (rotation about hinge edge, ~70–110°) with the freezer drawer (French-door variant) translating forward/back on rails; interior light fades in/out synced to door-open fraction; ice dispenser paddle presses in slightly with a few ice-cube particles or a brief water-stream cylinder on an "in use" trigger (low priority); optional condensation/frost fog puff on freezer-drawer open (very low priority, matches existing frost/weather-FX idiom).

---

## Chest & Upright Freezer

### Dimensions — chest freezer (W × D × H, mm)
| Size class | Capacity | W × D × H (mm) | W × D × H (in) |
|---|---|---|---|
| Compact | ~5 cu ft | 685 × 560 × 840 | 27 × 22 × 33 |
| Standard | ~7 cu ft | 915 × 635 × 865 | 36 × 25 × 34 |
| Large | 10–16 cu ft | 1370–1650 × 610–710 × 840–915 | 54–65 × 24–28 × 33–36 |

Rule of thumb ≈ 1.1–1.2 cu ft per 25 mm (1 in) of width at fixed depth/height. Clearance: ~300–450 mm above the lid for full swing; ≥75 mm each side for airflow.

### Dimensions — upright freezer (W × D × H, mm)
| Size class | Capacity | W × D × H (mm) |
|---|---|---|
| Compact | 3–5 cu ft | 510–610 × 510–635 × 790–940 |
| Small | 5–9 cu ft | 535–635 × 560–660 × 1400–1525 |
| Medium | 10–16 cu ft | 585–785 × 685–760 × 1525–1855 |
| Large | 17+ cu ft | 685–865 × 735–760 × 1625–1930 |

Door swings out roughly 600 mm (24"). Back clearance 25–50 mm for compressor venting; 25–50 mm above top.

### Shape breakdown
- **Chest freezer**: one large low box (body cavity) on a slightly recessed plinth/base box (~30–50 mm tall, inset ~20 mm, hides the compressor and rounds the visual base). Top is a single hinged lid — a flat box (~40–60 mm thick) with a slight lip/overhang and a recessed handle/thumb-latch on the front-top edge; hinge runs along the back-top edge, lid rotates up on that axis (0°–~110°). A raised compressor hump often bulges at the back-bottom (optional small box, half-width, ~100 mm proud). Corners are usually gently rounded (bevel the box edges or use a shrunk inner + outer box trick). A small recessed control panel (dial or digital) sits on the front face near the top edge, sometimes under a hinged flap.
- **Upright freezer**: tall rectangular box body, flat front face (+Z) is a single hinged door (thin box, slightly proud of the body by 10–20 mm) with a vertical door handle (thin vertical cylinder/bar, offset to one side) and hinge along one vertical edge (swings 90°–115°). A shallow recessed toe-kick box at the bottom front (~100 mm, inset). Some models have a top control panel strip or a slim vertical vent grille at the base front. Interior (visible when door is open) — a few shelf boxes/drawer-front boxes and wire baskets (thin frame outlines) as a simple "open" state variant.
- Both: a rear condenser/vent grille (flat plane, subtle darker box insert) and 4 short cylindrical/box feet or casters underneath (uprights frequently have caster wheels for pull-out access).

### Colors & finishes
- Dominant: **white** (by far most common for both types), with black and "stainless-look" (brushed-metal-textured door panel, often on uprights) next-most-common; some compact/garage models in bare galvanized/grey steel.
- Smooth painted steel, matte to slightly satin; minimal ornamentation — a small brand badge/logo decal low on the front, a control dial or digital panel (dark plastic bezel), thin chrome/plastic handle or latch. Lid/door seals show as a thin darker rubber-gasket line around the opening edge.

### Placement
- Rests on the **FLOOR** — garage, basement, utility/mud room, or (compact sizes) kitchen/pantry corner. Chest freezers need top clearance for the lid; uprights need door-swing clearance and are more kitchen/hallway-friendly footprint-wise. Not built-in, not wall/ceiling mounted. Feet/casters ~15–30 mm.

### Running / active indicators
- Minimal, mostly internal: a small green "power on" LED or amber "too warm/power interruption" LED near the control dial, a digital temperature readout (upright, higher-end), and — only when opened — visible frost/cold-fog wisp + interior light (many uprights have a bulb; most chest units do not). No drum motion, water flow, or steam — a mostly static, sealed appliance.
- Recommended cues:
  1. **Emissive status dot** near the control panel — small green glow when running/at-temp, pulsing amber if door-ajar/warm alarm (best fit, mirrors the real LED).
  2. **Rising cold-mist/steam shimmer** — a faint particle wisp or vertical shimmer plane at the seam whenever the lid/door opens, dissipating after a couple seconds.
  3. Secondary: **subtle body hum vibration** (sub-millimeter continuous jitter) while powered.

### Variations & customizations
- Type: chest vs. upright (distinct kinds/models).
- Size tiers: compact / standard / large.
- Color: white / black / stainless-look.
- Lid or door state: closed (default) vs. open (reveals a simple interior — baskets for chest, shelves/drawers for upright).
- Optional add-ons: a small padlock/latch prop on the chest lid front edge (common on garage/basement units), a caster-wheel base swap for uprights.

### Animation opportunities
- **Idle**: status LED slow pulse/breathe; occasional very subtle body micro-vibration (compressor cycling — could brighten the LED and increase vibration amplitude slightly during a simulated "compressor on" cycle).
- **Active/interaction**: lid (chest) rotates up on the back-top hinge (0°→~100°) or door (upright) swings open on its vertical hinge (0°→~90-110°) when toggled/clicked; on open, trigger the brief cold-mist shimmer + interior light pop-on (upright) + a tiny gasket-separation highlight; on close, a slight compression bounce (quick small squash/settle) sells the heavy insulated lid/door weight.

---

## Range / Oven / Cooktop

*Electric, gas, induction, slide-in.*

### Dimensions (W × D × H, mm)
| Variant | Width | Depth (body, excl. handles/knobs) | Height (cooktop to floor) | Height (overall, incl. backsplash/control panel) |
|---|---|---|---|---|
| Compact / apartment (24") | 610 | 610–660 | 900–915 | 1145–1200 |
| Standard freestanding/slide-in (30") | 750–762 | 620–660 | 900–915 (914 typ.) | 1145–1215 (46⅞" ≈ 1191 w/ backsplash) |
| Oversized / pro-style (36") | 900–915 | 650–700 | 900–915 | 1150–1220 |
| Commercial/pro dual-fuel (48") | 1200–1220 | 700–760 | 900–915 | 1150–1220 |
| Built-in wall oven (separate, reference) | 600–750 | 550–600 | mounted, varies | 550–900 tall unit |
| Drop-in countertop cooktop only | 750 (30") or 900 (36") | 500–530 | flush in counter (≈890–915) | ~50–100 proud of counter |

Freestanding/slide-in bodies are essentially identical box footprints; slide-in has a lip that overlaps the counter edge on left/right and hides side gaps (no visible side panels), while freestanding shows finished side panels and usually a rear/end control panel raising overall height by ~230–280 mm.

### Shape breakdown
- **Main body**: single box, W×D×H per table — this is 90% of the visual read.
- **Cooktop surface**: a thin box (10–20 mm) capping the top, front face = local +Z.
  - Gas: 4 small **cylinders** (grates, approximated as a flat ring/short cylinder) + 4 tiny cylinder burner heads sunk slightly below.
  - Electric coil: 4 flat wide **cylinders** (coils) recessed slightly into the top box.
  - Glass electric/induction: flat dark-tinted box top with 4 faint circular decals (no geometry needed).
- **Control panel / backsplash**: a slim box standing up at the back edge (freestanding) or a horizontal band along the top-front edge (slide-in, flush with counter height) — holds knob cylinders (small flat cylinders, front +Z face) and/or a flat rectangular display box.
- **Oven door**: a box (or thin panel) hinged at the BOTTOM front edge (local −Z is front), swings open ~90–100° downward/outward — the primary openable part. Includes a small rectangular window box inset (dark glass tint) and a horizontal bar cylinder door handle proud of the door face.
- **Legs/base**: 4 short cylinders or a recessed toe-kick box at the bottom front — freestanding ranges sit slightly proud of the floor (~15–25 mm leveling legs).
- Slide-in variant: side edges flush/hidden between counters — model identically, skip any side-panel bevel detail.

### Colors & finishes
- Stainless steel (dominant modern default — light grey-silver, subtle vertical brushed texture).
- Black stainless / matte black (increasingly popular).
- White and black gloss (classic/budget).
- Slate / bronze (discontinued but still common in older homes).
- Retro/colorful (red, mint, pastel blue) for "retro-style" ranges.
- Cooktop surface is usually near-black (glass ceramic, cast iron grates) regardless of body finish; knobs are chrome/black plastic or metal.

### Placement
- Room: **kitchen** (always).
- Rests on **FLOOR** — freestanding/slide-in ranges slot between counter runs, cooktop surface at counter height (~890–915 mm). Wall ovens (separate unit) are built-in/wall-mounted in a cabinet column instead. Drop-in cooktops-only are counter-mounted (recessed into a counter cutout) paired with a separate wall/under-counter oven.
- Cooktop surface height should be treated as the "counter" reference for adjacent counter/island snapping.

### Running / active indicators
- Real cues: illuminated control panel / digital clock-timer display; knob rotated to a non-zero position; oven interior light on when door is open or preheating on some models; an "surface unit on" indicator LED near the knobs (most standard cue); visible flame (gas — blue glow); glowing red-orange coil (electric coil) or a faint red glow ring under glass (radiant/induction with indicator lights); steam rising from a pot or oven vent slot.
- Recommended cues (best fit for this codebase):
  1. **Emissive status dot/ring** at the control panel or per-burner position — colored (amber/red) glow that lights up when the entity is active.
  2. **Rising steam/heat shimmer** — a soft particle wisp or translucent animated plane above the cooktop/vent when active.
  3. **Warm glow pool** on the cooktop surface (reusing the existing light-fixture glow-disc idiom), tinted orange-red when a burner/oven is on.
  - Best fit overall: emissive LED indicator (matches existing appliance-in-use convention) + oven door as a real openable primitive matching the fridge-door pattern.

### Variations & customizations
- Fuel type: gas (visible grates/burners), electric coil (glowing coils), electric radiant/glass-top (flush dark glass), induction (visually identical to radiant glass, glows only when active).
- Form factor: freestanding (finished sides) vs. slide-in (flush overlap edges) vs. drop-in (cooktop only, separate wall oven) vs. double oven (taller body, two stacked doors).
- Width tiers: 24" compact, 30" standard, 36"/48" pro-style oversized (more burners: 4 → 5 → 6).
- Control style: front-facing knob row (slide-in) vs. rear backsplash-mounted knobs/display (freestanding).
- Door style: single large window vs. French-door double oven doors (side-hinged, swings from local sides instead of bottom).
- Finish palette: stainless / black stainless / white / black / retro-color.

### Animation opportunities
- **Idle**: none required, but a faint standby LED glow (very dim) sells "plugged in / smart appliance" for HA-bound units.
- **Active/cooking**: emissive burner/indicator glow pulsing gently (2–4 s cycle); oven door swinging open/closed (bound to a door-open sensor or click-to-toggle); rising steam particles/shimmer above cooktop or oven vent; digital clock/timer display digits cycling (cosmetic, low priority); gas burner flame flicker (small emissive cone/sprite with `Math.random()` jitter, same idiom as the fireplace flame flicker); oven interior light snapping on when the door-open blend crosses a threshold.

---

## Microwave (Over-the-Range & Countertop)

### Dimensions (W × D × H, mm)
Countertop depth is door-closed; add ~550–700 mm swing depth when the door is open.

| Variant | Width | Depth (closed) | Height | Notes |
|---|---|---|---|---|
| OTR — standard | 762 (30") | 381–457 (15–18") | 432 (17") | Matches a 30" range/cooktop below |
| OTR — low-profile | 762 (30") | 381–457 | 254 (10") | Shallower body, more clearance over cooktop |
| OTR — compact | 610 (24") | 381–457 | ~432 | Less common, narrow-range kitchens |
| Countertop — compact (0.5–0.9 cu ft) | 381–483 (15–19") | 305–406 (12–16") | 254–279 (10–11") | Dorm/office size |
| Countertop — standard/mid (1.0–2.2 cu ft) | 533–635 (21–25") | 406–508 (16–20") | 305–381 (12–15") | Most common household size |
| Countertop — large (1.6–2.2+ cu ft) | 457–610 (18–24") | ~457 (18") | ~330–406 (13–16")* | *some listings quote ~889/35" but that conflates with built-in combo wall units, not a bare countertop box — keep large countertop in the 330–406 mm band |

OTR install reference: 1676 mm (66") floor-to-microwave-top; 762 mm (30") from cooktop surface to microwave top; ≥330 mm (13") clearance from cooktop to microwave underside.

### Shape breakdown
- **Body**: one rounded box for both types. OTR bodies are wider/shorter and shallower than countertop; countertop bodies are more cube-like with a larger depth-to-height ratio.
- **Front face (local +Z)**: a recessed door panel — a slightly inset box (5–10 mm reveal) covering ~65–75% of the front width, leaving a control-panel strip on one side (countertop: usually right side; OTR: often front-bottom edge or a right strip, with a separate under-cabinet vent grille).
- **Door**: a flat or shallow-depth box inset in the front face; a smaller circular/rounded-square "window" area as a darker/tinted box or cylinder-cap for tempered glass; a small cylinder/box nub door handle (recessed pull for OTR base models, protruding bar handle for higher-end countertop units).
- **Control panel**: thin flat box, subdivided visually with a small rectangular sprite/texture for the digital display + a grid of tiny box "buttons" or a single dial (cylinder) for retro turn-knob models.
- **OTR-specific**: underside vent grille = a shallow box with slot-texture on the bottom face; a slim exhaust outlet box at the rear-top if externally vented; mounted flush to the underside of an upper cabinet, top face normally hidden.
- **Turntable** (optional interior detail): a flat cylinder visible through the door window — skip for a closed-door low-poly build.
- **Feet**: countertop models get 4 tiny cylinder/box feet (~10–15 mm) lifting the body slightly off the counter.

### Colors & finishes
- Overwhelmingly **stainless steel** (brushed, slight specular) and **black stainless** for kitchen-matching OTR units.
- **White** and **black (gloss plastic)** dominate budget/countertop models.
- Retro/color-accent lines add cream, red, mint, sage green, navy solids (often chrome accents and a mechanical dial).
- Door window is a dark tinted/smoked panel (near-black or dark gray) regardless of body finish.
- Control panel is typically black or dark gray plastic with a blue/white/red LED-style digit display.

### Placement
- **Kitchen** only (occasionally a small break room).
- OTR: **wall/cabinet-mounted**, spanning the space between countertop range and upper cabinets; top-of-unit ≈1676 mm (66") off the floor.
- Countertop: rests on a **COUNTER**-or-surface (or a shelf/cart); also common as a **built-in** shelf/niche in cabinetry — "microwave drawer" is a distinct built-in variant, drawer-style, opens by sliding horizontally rather than a hinged door.

### Running / active indicators
- Real cues: interior light on (glow visible through the door window), turntable rotating (visible through window), control-panel display lit (countdown timer digits), a beep at completion (audio, not visual). OTR vent-fan light may double as under-cabinet task lighting.
- Recommended cues:
  1. **Warm emissive glow bleeding faintly through the door-window panel** — the tinted glass gets an emissive material toggled on, low intensity.
  2. **Countdown digits on the control-panel sprite** (small canvas-texture display, reusing the sprite/CanvasTexture idiom already used for env sensors/appliance chips).
  3. Fallback: **soft pulsing amber ring/arc** on the control panel or a small LED dot next to the display (matching the existing appliance-in-use pulsing-LED convention).

### Variations & customizations
- OTR standard vs. low-profile vs. compact (width/height table above).
- Countertop compact / standard / large tiers.
- **Microwave drawer** (built-in, slides out horizontally, no visible door swing) as a distinct kind.
- Retro dial vs. modern touchpad/digital display control style.
- Handle style: recessed pull vs. protruding bar handle vs. push-button auto-open (touch-latch, no handle).
- Vent style for OTR: recirculating (grille only) vs. externally vented (rear/top duct stub).
- Finish variants: stainless / black stainless / white / black / retro color-accent.

### Animation opportunities
- **Idle**: none needed; optionally a very slow ambient reflection/specular shimmer on stainless finishes.
- **Active/running**: door-window emissive glow fade in/out; turntable rotation (simple continuous spin of an interior cylinder, visible through the window); ticking countdown digits on the control-panel sprite; brief flash + tone cue at completion (a quick bright pulse); OTR vent-fan subtle light flicker if used as task lighting.
- **Door open/close**: hinge swing (or slide-out for drawer style) about the front edge, same pivot-group technique used for fridge/oven doors — door swings toward local −Z (front), interior light snaps on while open.

---

## Range Hood / Vent Hood

*Under-cabinet, wall chimney, island.*

### Dimensions (W × D × H, mm)
| Variant | Width | Depth | Height (canopy only) |
|---|---|---|---|
| Under-cabinet (compact) | 600–900 (fits 24–36") | 300–460 | 100–330 |
| Wall chimney | 600–1200 (610/760/900/1220 common) | 460–610 | canopy 250–330 + chimney flue stacks up to ~700–900 more (telescoping) |
| Island (ceiling-hung, 4-sided) | 600–1200 | 610–760 | canopy 250–330 + dual (up+down) chimney flue, often 900–1500 combined |
| Insert/liner (hidden behind custom cabinetry panel) | 700–1100 | 400–530 | 200–250 |

Rule of thumb: hood width ≥ cooktop width, ideally +75–150 mm (3–6") overhang per side.

### Shape breakdown
- **Canopy body**: a shallow, wide **box** (or a box with a gently tapered/angled front-bottom edge — bevel at ~30–45°, doable as a box + angled box slice or a wedge-shaped prism). Front face = local **+Z**, facing the cook.
- **Underside**: a flat inset box (recessed grease-filter panel), slightly darker/shinier — a thin box offset a few mm above the bottom face reads as the filter grille.
- **Control strip**: a thin flat box/rounded strip along the front-bottom lip for buttons/slider/knobs; a small rectangular emissive display decal for digital models.
- **Light strip**: 1–2 small flush boxes or capsule shapes (cylinder laid on its side) under the front lip flanking the filter, tinted warm-emissive when "on."
- **Chimney stack** (wall/island only): one or two tapered box sections (wider at top near ceiling, narrower where they meet the canopy) — a single per-axis-scaled box works fine; a true taper needs stacked boxes of decreasing width. Island hoods need the stack duplicated/mirrored above and are fully suspended (no wall attachment).
- **Under-cabinet variant**: no chimney at all — just the flat canopy box tucked directly under an upper cabinet box.
- **Mounting bracket/duct collar**: optional small cylinder at the top-back (duct outlet) — usually hidden once installed.
- No hinged/openable parts on most units; a few retro under-cabinet models have a manual pull-out vent flap (rare — skip unless targeting that sub-style).

### Colors & finishes
- Dominant: **stainless steel** (brushed, cool-grey metallic with faint horizontal brush-line texture).
- Secondary: matte/gloss black (contemporary), white (under-cabinet, builder-grade), black glass (glossy, island/wall chimney design pieces), copper/hammered copper (rustic/farmhouse, warm orange-brown patina), matte grey/graphite.
- Filter panels: darker charcoal-grey mesh look; control strip often a contrasting black glass/plastic band even on stainless bodies.

### Placement
- **Wall-mounted** (wall chimney, above the range) or **ceiling-hung** (island hood, no wall behind it) or built into the **underside of a cabinet** (under-cabinet/insert — wall-cabinet-mounted, not floor/counter-resting). Never floor-standing.
- Mounting height: bottom edge of canopy **600–900 mm above the cooktop/counter surface** (≈24–36", varies gas vs. electric/induction) — roughly 1400–1600 mm above the floor when the counter is at ~900 mm.
- Chimney top usually meets the ceiling or an 8–9 ft (2440–2740 mm) ceiling line; telescoping sections absorb variance.

### Running / active indicators
- Real cues: status/back-lit control display (LED digits or glowing touch icons), under-cabinet task light illuminated (warm pool of light on the cooktop below), and on premium models a fan-speed LED ring/bar graph. Some show a filter-clean reminder LED (usually red/amber, only after long use).
- No visible fan blade, no drum, no water — extraction itself is invisible. Recommended cues (layer 1–2):
  1. **Emissive status ring/dot** on the control strip, color-coded by fan speed (dim blue idle → amber → red on max) — cheapest, mirrors the real display bar.
  2. **Light-pool glow** under the hood onto the cooktop (soft additive quad/cone of warm light) whenever the under-light is toggled on.
  3. Optional: **faint rising heat-shimmer/thin steam wisp** drawn just above the range and into the hood underside while active — good complement to #1.
  - Best fit: **#1 + #2**, both grounded in real hardware behavior and cheap to animate.

### Variations & customizations
- Mount type: under-cabinet / wall-chimney / island / insert-liner (hidden behind custom panel) / downdraft (retracts from behind cooktop — different shape, a low box that rises).
- Chimney profile: straight, tapered/pyramidal, curved "waterfall" glass-and-steel designer shapes.
- Filter style: mesh baffle vs. flat aluminum mesh (texture-only difference).
- Control type: mechanical slide/buttons vs. touch/digital display vs. wireless remote.
- Finish swap: stainless / black / white / copper / custom-panel (matches cabinetry, no visible metal front).
- Size scaling to match cooktop width (600/700/900/1200 mm).

### Animation opportunities
- **Idle**: subtle ambient nothing when off — optionally a very slow, barely-there ambient occlusion/spec flicker on the metal; filter/light LEDs off (dark/grey).
- **Active**: control-strip LED/ring lights and color-shifts with fan speed; under-light glow fades in/warms the cooktop pool; optional rising heat-shimmer/steam wisp pulled upward into the canopy; a barely perceptible high-frequency micro-vibration (±1–2 mm) on the canopy at max fan speed; filter-reminder LED occasionally blinking amber as a passive detail independent of on/off state.

---

## Wine & Beverage Fridge

*Undercounter & freestanding.*

### Dimensions (W × D × H, mm)
| Variant | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Compact/countertop (12–20 bottle, single-zone) | 295–400 | 510–560 | 500–620 | Sits on a counter/cabinet top, not built-in |
| Slim undercounter | 150–380 | 580–610 | 850–890 | Fits a narrow cabinet bay |
| Standard undercounter (24", 30–50 bottle, dual-zone) | 585–610 | 585–610 | 865–890 | Most common "built-in" size — matches base-cabinet height/depth |
| Freestanding tower (150+ bottle) | 585–600 | 660–685 | 1830 (72") | Full-height cabinet, stands alone like a fridge |

### Shape breakdown
- Core: one **box** (rounded-corner edges optional) — the cabinet carcass. Undercounter units are a flattened box (wide, shallow-ish, short); towers use the same box proportions as a slim refrigerator.
- **Front face (+Z)**: mostly glass — a thin box (dark tinted glass, semi-transparent material) inset a few mm from the frame, occupying ~85–90% of the front, ringed by a thin box door frame/trim (stainless or black).
- **Door**: single hinge box, opens on a vertical edge like a fridge (swing) — same door-pivot rig as fridges. Handle = a thin horizontal or vertical cylinder offset from the hinge edge, standoff a few mm off the glass.
- **Interior shelving**: 4–8 thin cylinders (wine racks) or flat box slats visible through the glass, stacked evenly — a repeating cylinder array is cheap; bottle shapes = small cylinder + tapered cone neck for visible "stock."
- **Control panel/display**: small flush rectangle (flat box or decal) near the top of the door frame or on a top strip above the door — usually a blue/red LED touch/digital readout.
- **Base**: either flush with cabinet toe-kick (built-in — no visible feet) or 4 small cylinder/box feet or a recessed base grille (freestanding).
- **Vent grille**: undercounter units exhaust through the FRONT (boxed in on 3 sides) — a thin horizontal box with slot-line texture; freestanding towers vent from the back/top instead.

### Colors & finishes
- Cabinet: stainless steel (brushed, most common), matte/fingerprint-resistant black, black stainless, white (less common), panel-ready (custom cabinetry front, no exposed cabinet at all).
- Door frame/trim: matching stainless or black; premium models use a black-framed full glass front ("floating glass" look).
- Glass: smoked/tinted dark grey or bronze-tinted, sometimes UV-protected dark green tint (blocks light).
- Interior: black interior liner is near-universal; wood-tone (beech/dark wood) shelf trim on premium "wine cellar" units; blue or warm-white interior LED strip lighting visible through the glass.
- Handle: brushed stainless or black bar, sometimes recessed (no handle, panel-ready).

### Placement
- Rooms: kitchen (built into island/counter run), home bar/basement bar, dining room, wine cellar/pantry, garage.
- **BUILT-IN/COUNTER** for undercounter models — flush under a countertop at standard counter height (worktop ~900 mm, unit top ~865–890 mm), flanked by cabinetry, front-venting since boxed in.
- **FLOOR** for freestanding towers — stands alone against a wall like a mini fridge, needs side/rear clearance for venting. Never wall-mounted or ceiling-hung.

### Running / active indicators
- Real cues: control-panel LED/display glowing (temp readout, blue/red/green), interior LED shelf-lighting (often always-on or door-triggered rather than a "compressor running" indicator), door left open (rare, momentary), condensation/fog on the glass in humid rooms.
- No strong "compressor working" visual exists. Recommended cues:
  1. **Soft pulsing interior glow** — the LED shelf-strip breathes gently in brightness (best fit — real units DO have interior lighting).
  2. **Emissive control-panel dot/segment digits** — small glowing display readout, on whenever the unit has power.
  3. Sparingly: **faint cold-shimmer/mist at the base vent** to suggest active cooling exhaust.

### Variations & customizations
- Zone count: single-zone vs. **dual-zone** (visibly split by an internal divider shelf, two independent temp displays) — worth modeling the divider.
- Size tier: compact countertop / slim undercounter / standard 24" undercounter / tall freestanding tower.
- Finish swap: stainless vs black-stainless vs panel-ready vs white.
- Door swing side (left/right hinge) as a placement-time flip, matching the fridge door-pivot convention.
- Beverage-fridge variant (same shape, no wine racks — solid glass shelves, mixed-can/bottle look, brighter interior LED) as a reskin of the same primitive rig.

### Animation opportunities
- **Idle**: interior LED breathing/pulse glow, occasional subtle condensation shimmer on the glass, control panel digit occasionally ticks (temp readout flicker).
- **Active/interaction**: door swings open on the hinge (same rig as fridge door), brief brighter interior light flash when the door opens (like a real fridge light), soft chime/glow pulse on the control panel if bound to an entity toggle.

---

## Water Heater (Tankless & Tank)

### Dimensions
| Type | W × D × H (mm) | Notes |
|---|---|---|
| Tankless (compact, e.g. Rinnai RUC/RL series) | ~350 × 250 × 550 | Wall-hung, smallest common residential unit |
| Tankless (standard/high-capacity, e.g. Navien NPE-240A2) | 439 × 335 × 696 | Larger condensing units, PVC vent stubs add ~100 mm depth |
| Tank, "lowboy"/short, 40–50 gal | Ø 600–720 × H 900–1200 | Wider, squat — fits under counters |
| Tank, "tall", 40 gal | Ø ~460 × H ~1480 | A.O. Smith 40-gal tall: 18"D × 61.75"H |
| Tank, "tall", 50 gal | Ø 500–560 × H 1280–1550 | Rheem/A.O. Smith tall gas/electric: 20.5–23.75"D × 50.5–60.75"H |
| Tank, commercial/oversized | Ø up to 800 × H up to 1900 | 75–100 gal |

### Shape breakdown
- **Tankless**: single flat **box**, front face (+Z) a smooth plastic/metal panel — slightly rounded corners (fine as a plain box), often a small rectangular window/box insert for the digital display low-center or top-center on the front face. Bottom edge has 2–4 pipe stubs (small cylinders, ~20–30 mm dia., protruding downward or from the bottom face) for gas/water/vent connections — can simplify to a single manifold box. No moving parts visible externally.
- **Tank**: primary body is one tall **cylinder** (rounded-top cylinder or cylinder + shallow cone/dome cap at top for the "jacket" hump). Add:
  - A slim cylinder on top, off-center or centered, for the flue/vent pipe (gas models only), rising straight up, often exiting through a wall/ceiling box boot.
  - A small cylinder T&P (temperature-pressure) relief valve + short pipe near the top side, bent downward — simplify to one thin cylinder nub.
  - A box or plastic panel wrapped at the very bottom front for the gas control valve module (gas models) — the natural +Z front focal point, sometimes with a small round cylinder (pilot sight glass) or digital display.
  - Electric models: no flue, but two small box access-panel outlines on the front face (upper/lower thermostat covers) — cosmetic decals/insets, no separate geometry needed.
  - 3–4 short cylinder legs or a simple ring-foot lifting the tank ~50–100 mm off the floor (some sit flush via a base ring instead).

### Colors & finishes
- Tank: painted sheet-metal jacket — **almond/beige** (classic), light **gray**, or **white** are most common; top cap and control valve module usually **black or dark gray** plastic. Matte, slightly textured "appliance" finish.
- Tankless: **white or silver/light-gray** metal or plastic housing, sometimes matte black (modern condensing units); front panel often has a glossy black display window insert.
- Vent pipe: white PVC (condensing) or galvanized/stainless metal (standard).

### Placement
- Rooms: garage, basement, utility/laundry closet, mechanical room, sometimes an exterior wall closet.
- Tank: rests on the **FLOOR** (or a drain pan on the floor); occasionally on a raised platform (~450 mm) in garages per code (ignition source clearance) — worth offering as a placement variant.
- Tankless: **WALL-mounted**, typical bottom edge ~300–450 mm above floor, unit spans up to roughly 700–1100 mm above that — mount center around 900–1400 mm high; always against an exterior wall or near a vent path.

### Running / active indicators
- Tankless: a small digital display/LED readout on the front panel (temperature setting, or a flame/flow icon) — the one genuine visible cue; some show a tiny blue or amber LED when firing.
- Tank: **no externally visible operating cue at all** — heating element/burner fully enclosed. Recommended cues:
  1. **Emissive status dot/ring** near the control module that glows warm amber/orange while heating, dims when idle (fits both types, simplest, best default for the tank).
  2. **Rising heat-shimmer/faint steam wisp** above the flue pipe or top cap for gas models when active.
  3. Secondary/alternate: **soft pulsing glow** at the base (gas burner glow bleeding from vent slots) for tank gas heaters.
  - Tankless best fit: digital display lights up + tiny flame-icon flicker, plus an optional soft blue glow from the exhaust vent when actively modulating.

### Variations & customizations
- Tank: gas vs. electric (flue present/absent), tall vs. lowboy proportions, capacity (30/40/50/75/80 gal) scaling height and diameter, color (white/almond/gray), horizontal/side-arm at low-clearance layouts.
- Tankless: compact vs. high-capacity size, indoor (wall-hung box) vs. outdoor (weatherproof louvered housing, larger, exterior wall), condensing (extra PVC intake/exhaust pair) vs. non-condensing (single metal vent).
- Both: add a floor drain pan (flat wide cylinder/box under the tank) and exposed copper/PEX pipe stubs as optional bolt-on detail.

### Animation opportunities
- **Idle**: near-imperceptible ambient hum (paired with a very subtle high-frequency body vibration, amplitude ~1–2 mm, optional), status LED slow-breathing pulse.
- **Active (heating/firing)**: status dot/ring shifts to saturated amber and pulses faster; faint rising steam/heat-shimmer particles above the flue or vent; tankless display brightens with a small animated flame or drop icon; optional soft "whoosh" ring expanding once from the vent to mark ignition start; T&P valve nub could very occasionally "weep" a tiny drip animation as a maintenance/easter-egg detail.

---

## Garbage Disposal

*Under-sink food waste disposer.*

### Dimensions
| Variant | Height | Diameter | Notes |
|---|---|---|---|
| Compact (e.g. InSinkErator Badger 1, 1/3 HP) | ~280–300 mm | ~150–165 mm | Entry-level, single-stage grind |
| Standard (1/2–3/4 HP, e.g. Badger 5, Evolution Compact) | ~300–330 mm | ~165–180 mm | Most common residential size |
| Oversized/high-HP (1–1.5 HP, e.g. Evolution Excel) | ~330–380 mm | ~180–200 mm | Larger motor housing at the bottom |

Overall envelope for clearance planning: ~305–380 mm tall × ~150–200 mm diameter, needing roughly 150–250 mm of cabinet depth/width below the sink.

### Shape breakdown
A stacked cylinder assembly, built from 2–3 stacked **cylinders** of decreasing/varying diameter:
1. Top: a short, wide cylinder (sink-mount collar/flange) — mostly hidden above the sink strainer, omittable in a stylized model since it's above the cabinet floor line.
2. Middle: the main grind-chamber cylinder — the biggest visible mass, matte-textured.
3. Bottom: a slightly narrower cylinder (motor housing), often with a small side-mounted reset button (tiny cylinder/box nub) and a discharge-pipe stub (thin horizontal cylinder) exiting to one side toward the trap.

No "front face" in the usual sense since it's tucked under a sink and rarely seen — for a stylized cabinet-interior view (if ever shown), treat the reset-button nub as the +Z "front" landmark. No hinges or opening parts.

### Colors & finishes
Body is almost always **charcoal-gray or black composite/galvanized steel** — real disposals are essentially never a showpiece color since they're hidden. Occasional stainless-look bands near the mounting flange. Matte, slightly ribbed/textured plastic-like finish (small horizontal ridge details near the mount).

### Placement
Kitchen only, mounted directly under the sink drain, hanging from the sink basin — effectively a fixture hung from the underside of the sink rather than resting on the cabinet floor. Since Diorama's sink furniture piece already occupies that footprint, this is best modeled as an **optional small hanging accessory nested under a kitchen sink piece** rather than a standalone placeable — flag as a design question for the developer rather than assuming a separate furniture kind.

### Running / active indicators
Real units have **zero external visual cue** — no lights, no display, sealed sound-only device under the sink. Recommended cues (pick 1–2):
- A brief **body wobble/shake** (small rotational jitter, high frequency, low amplitude) while running, sourced from a bound "disposal" switch/script entity.
- **Radiating sound-ring** decals (2–3 concentric expanding rings) around the unit — same primitive as doorbell pulses; reads clearly even below eye level / hidden by a cabinet.
- A dim **emissive status dot** near the reset button as a simple always-visible "on" tell if the wobble is too subtle to read.

Best fit: body wobble + sound rings together, since disposals have no light/window and the sound-based cue is truest to the real object.

### Variations & customizations
Compact vs. standard vs. high-torque size tiers (mostly affects diameter/height slightly); color limited to black/dark-gray composite (skip fancy finishes — not realistic, and this piece is rarely seen).

### Animation opportunities
- **Idle**: fully static (invisible most of the time).
- **Active**: wobble + sound rings as above; optionally a very quick "flash" of the whole unit briefly darkening/lightening to sell a "grinding jam" moment if a stuck/error binary_sensor exists.

---

## Trash Compactor

*Built-in kitchen compactor.*

### Dimensions
Standard built-in / undercounter, 15" nominal width is the dominant residential size.
| Variant | Width | Depth | Height |
|---|---|---|---|
| Standard built-in (15", e.g. GE, Whirlpool, JennAir, KitchenAid) | 380–390 (14⅞–15") | 560–675 (22–26½", panel/handle add depth) | 865–915 (34⅛–35", adjustable leveling feet) |
| Freestanding/portable (less common today) | ~380 | ~600 | ~865–915, often on casters |

Sits flush with standard base-cabinet height (~865–915 mm) and cabinet depth (~600 mm), reading architecturally identical to a slim dishwasher-width cabinet unit.

### Shape breakdown
Essentially a tall **box** (slim vertical rectangular prism matching a dishwasher/cabinet-width footprint):
- Main body: one box, full height/width/depth per table above.
- Front face (+Z): a full-height **drawer/door panel** — either a pull-out drawer (slides out along +Z) or, on panel-ready models, a decorative cabinet-matching door front. Model as a slightly inset box on rails, or a hinged door depending on style; the pull-out drawer front is more common and reads clearly with a simple sliding-forward animation.
- A small control panel strip (thin box) near the top front with a key-switch/button and 1–2 indicator lights — usually a horizontal band ~40–60 mm tall.
- Toe-kick base (thin box) at floor level like other built-in appliances (dishwasher/fridge convention).
- Optional top counter surface if freestanding-with-cutting-board top (flat box cap) — worth a variant toggle.

### Colors & finishes
Stainless steel (most common today), black, white/bisque (older/builder-grade), and **panel-ready** (accepts a cabinet-matching wood front — a plain flat neutral wood-tone box is fine). Compactors are almost always designed to visually match the surrounding kitchen appliance suite.

### Placement
Kitchen, built-in among base cabinets — **FLOOR**-resting, built-in like a dishwasher/fridge (fills a standard cabinet bay), front flush with adjacent cabinet faces.

### Running / active indicators
Compactors DO have real external cues, closer to a washer/dishwasher than the disposal:
- A small control-panel indicator light (often labeled "Ready"/"Full"/"On") — the clearest real cue, easy to represent as an emissive dot/LED matching the appliance-in-use convention already used for fridges/washers.
- Audible motor hum + a distinct heavy compaction "thunk" at cycle end — no visual analog in real life, worth inventing a stylized cue for the compaction moment itself.
- Slight door/drawer vibration during the actual compression stroke.

Recommended cues:
1. Reuse the standard **pulsing-green LED + soft glow** appliance-in-use convention for baseline "on" state (consistency with fridge/washer/etc.).
2. A brief **body squash/thump** — a quick vertical squeeze-and-release scale pulse on the main box timed to a "compacting" moment — a fun, distinctive on-genre Sims-style exaggeration since nothing else in the appliance set does a squash pulse.
3. A subtle **drawer-vibration wobble** while running for extra flavor.

Best fit: LED-glow convention for baseline "on," plus the squash-thump as the standout unique tell for a full compaction cycle if the bound entity exposes a distinct "compacting" state.

### Variations & customizations
Finish (stainless/black/white/panel-ready-wood), drawer-pull vs. flush panel-ready front, freestanding-with-cutting-board-top vs. built-in flush top.

### Animation opportunities
- **Idle**: static, LED off/dim.
- **Active**: LED pulse (reuse appliance convention) + drawer sliding open/closed on interaction (door-open fraction idiom, like a fridge/dishwasher door) + optional squash-thump one-shot for the compaction beat + faint vibration wobble while actively running.

---

## Air Purifier

### Dimensions (W × D × H, mm)
Cylindrical/tower body, sits on a small round or square base.
- Compact/small-room: ~235×235×390 (Crane tower) to ~325×265×495 (Honeywell HPA080).
- Standard/medium-room: ~320×265×610–740 (Honeywell HPA830/HPA175).
- Slim-tower variant: ~155×240×690 (GermGuardian AC5000 — narrow and tall).
- Desktop/personal mini: ~150×150×250.

### Shape breakdown
- Main body: one tall **cylinder** (most common — 360° radial intake) OR a rounded-corner **box** (slab tower, e.g. Honeywell/GermGuardian style).
- Base: slightly wider flat **cylinder** or box disc (~20–30 mm tall) for stability.
- Top: shallow **cylinder** cap with vent louvers (outlet), often subtly domed — a flattened sphere slice works too.
- Front face (+Z): control panel — a small flush **box** with a ring or button cluster and a tiny display; a slim vertical LED light strip is common.
- Sides/lower body: intake grille — represent as a texture/material change (darker mesh-pattern band), not geometry.
- Filter access: a removable outer sleeve or hinged/lift-off panel on the back or base — model as a slightly recessed seam line rather than a functioning primitive.

### Colors & finishes
White and black dominate (~80% of market); occasional grey, silver, or wood-tone (bamboo-look base) premium models. Matte plastic body, contrasting dark mesh/perforated intake band, glossy accent ring around control panel.

### Placement
**FLOOR**-standing (bedroom, living room, nursery) most common for tower units; also frequently on a **CONSOLE/side table or dresser top** (compact/desktop models) in bedrooms and offices. No wall or ceiling mounting in consumer HEPA units. Typical eye-level control panel height when floor-standing: ~500–700 mm.

### Running / active indicators
- Ring or bar LED that changes color by air quality (blue/green = clean, yellow = moderate, red = poor) — very common and visually strong.
- Small display showing fan speed/PM2.5 number.
- No obvious externally-visible fan/filter motion. Recommended cues:
  1. **Pulsing soft glow** from the top vent ring, color-shifting with an "air quality" value, brighter/faster pulse at higher fan speed.
  2. **Subtle rising heat-shimmer/particle wisp** above the top vent to sell airflow (fireplace-flicker idiom).
  3. **Animated LED ring rotation** (a thin light band slowly revolving around the base or top) to read as "actively cycling."
  - Best fit: the color-shifting glow ring (matches real product behavior) + faint upward particle drift for motion read at a glance.

### Variations & customizations
Tower (cylinder) vs. slab (box) body; size tiers (desktop/compact/tower/large-room); color (white/black/silver); with or without a visible top light-ring; simple vs. multi-button control panel.

### Animation opportunities
- **Idle**: slow color-cycle breathing glow on the ring, occasional flicker of the display digits.
- **Active**: faster pulse/rotation of the ring, rising particle wisp from the vent, tiny fan-blade blur glimpse if the top grille is see-through.

**Sources:** [Honeywell HPA080](https://www.honeywellpluggedin.com/air_purifiers/allergen-plus-hepa-compact-air-purifier-tower-for-medium-rooms/) · [Honeywell HPA830](https://www.honeywellpluggedin.com/air_purifiers/designer-series-hepa-tower-hpa830/) · [Honeywell HPA175](https://www.honeywellpluggedin.com/air_purifiers/allergen-plus-hepa-tower-for-large-rooms-hpa175/) · [Crane True HEPA Tower](https://crane-usa.com/product/crane-true-hepa-tower-air-purifier/)

---

## Portable Air Conditioner

### Dimensions (W × D × H, mm)
Boxy tower on casters.
- Compact (8,000–10,000 BTU): ~400×360×700.
- Standard (12,000 BTU): ~355–440×340–425×690–830 (e.g., Della 356×423×689; Uhome 442×340×830; Ivation 432×381×864).
- Large/dual-hose (14,000 BTU+): up to ~480×450×900.

### Shape breakdown
- Body: one primary **box** (rounded vertical edges), tall and roughly waist-height.
- Top: recessed **cylinder** exhaust port(s) at the rear/top — one (single-hose) or two (dual-hose) circular collars where the flexible hose attaches.
- Front face (+Z): control panel — a small flush box insert with an LED digital display + a horizontal row of button icons; often a vertical strip of louvered directional vents (thin overlapping box slats) just below/beside the display that can be angled.
- Sides/back: intake grille panels — flat box panels with a perforated/mesh texture, no extra geometry needed.
- Base: 4 small cylinder casters peeking out from the bottom corners, recessed cavity above.
- Accessory: corrugated exhaust **hose** (tapered cylinder chain or a single stretched cone/cylinder) running from the top port to a window-kit box slab (optional, only when "installed").

### Colors & finishes
White (majority) and black; occasional gray or two-tone (white body / dark charcoal front panel and vents). Matte-to-satin ABS plastic body, glossy black accent around the display, silver/chrome trim ring on the exhaust port, dark mesh perforation on intake/exhaust grilles.

### Placement
**FLOOR**-standing on casters, always freestanding near an exterior window (bedroom, living room, office). Requires the exhaust hose to reach a window — model an optional window-kit accessory. Not wall/ceiling mounted. Control panel sits ~500–700 mm above floor.

### Running / active indicators
- Digital display lit with set temperature/mode icon.
- LED status dot(s) for mode (cool/fan/dry/heat).
- Real cues: louvered vent flaps oscillating/angled open when running (closed/flat when off); a corrugated hose visibly present (installed = in-use context).
- Since fan/compressor motion is internal, recommended cues:
  1. **Gentle body vibration/wobble** (very slight, high-frequency shake) to sell the compressor running.
  2. **Cool-air shimmer/faint mist wisp** drifting from the front vent louvers when in cooling mode.
  3. **Pulsing display glow + rotating/oscillating vent slats** (the slats physically sweep side to side) as the primary "on" tell.
  - Best fit: oscillating vent louvers (matches real behavior, very readable) + display glow; add faint cool shimmer for a stronger "AC is blasting" read.

### Variations & customizations
Single-hose vs. dual-hose (extra top port + thicker rear grille); size tiers (compact/standard/large); with/without visible window-kit hose accessory; color (white/black/two-tone); casters visible vs. hidden behind a base skirt.

### Animation opportunities
- **Idle (off)**: static, vents closed/flat, display dark.
- **Active**: oscillating vent louvers, lit pulsing display, subtle body vibration, optional faint cool-mist shimmer at the vent outlet, slow rocking of the flexible exhaust hose if not rigidly modeled.

**Sources:** [DELLA 12,000 BTU Portable AC](https://dellahome.com/products/della-12000-btu-smart-portable-air-conditioner-for-rooms-up-to-270-sq-ft) · [Ivation 12,000 BTU Portable AC](https://www.ivationproducts.com/products/ivapac12kbtu-12-000-btu-portable-ac-w-dehumidifier-function) · [Uhome 12,000 BTU Portable AC](https://www.amazon.com/Portable-Conditioner-Compact-Dehumidifier-Included/dp/B0B5324H1H)

---

## Space Heater

*Tower / radiant-panel / oil-filled column.*

### Dimensions (W × D × H, mm)
| Type | Compact | Standard | Notes |
|---|---|---|---|
| Oil-filled column (radiator-style, fin count = size) | 385 × 173 × 340 (5-fin "nano") | 600 × 250 × 630 (9–13 fin, 1500 W) | Fins run full height; casters/feet add ~30–50 mm |
| Tower (ceramic/radiant-electric, slim vertical cabinet) | 180 × 200 × 580 | 200 × 230 × 800–900 (23–35") | Base is wider than the column for tip stability |
| Radiant panel (quartz/infrared, flat-ish box) | 300 × 150 × 400 | 400 × 200 × 500 | Squatter, often has a mesh guard front |

### Shape breakdown
- **Oil column**: a stack of thin vertical **box** "fins" (7–13 of them, ~15–25 mm thick, full appliance height, spaced ~20–30 mm apart) sharing a base — cheat this as ONE ridged box with a repeating-groove texture/normal map rather than true geometry, or 3 boxes if primitive-only (front cap, ribbed mid-slab, back cap). Sits on a thin box base plate with 2 small cylinder caster wheels at front + 2 fixed feet at back; a small box control head (dial/display) is mounted top-front. Front face = the flat fin face carrying the control panel/logo.
- **Tower heater**: a single tall rounded **box** (or box with heavily chamfered vertical edges to fake the oval cross-section) as the main body; a **cylinder** disc base slightly wider than the body for stability; a horizontal **box** slot near the top-front = the vent grille (darker material); a small box/rounded strip control panel with buttons/display at the top or a front strip. Front face = the vent-grille side.
- **Radiant panel**: a flattened **box** body with a recessed front **box** (the quartz-tube/mesh window, darker glass-like material) covering most of the front face; short cylinder legs or a small box foot-stand; a top box carry handle is common on portables. Some panel/quartz towers add a thin standing box oscillating base like the tower type.
- No openable doors on any variant — the only "moving part" physically is an oscillating base (tower/panel types) and any manual tilt dial.

### Colors & finishes
- Oil column: matte white or black powder-coated **metal**, gloss-black control head accent, chrome/silver trim strip sometimes along the top edge.
- Tower: matte white, black, or graphite **plastic/ABS** shell, contrasting dark-gray or black vent grille, silver accent ring around control display.
- Radiant panel: black or dark-gray housing with a warm amber/red-glowing mesh window (quartz tube glow), sometimes brushed-metal front.
- All types: small backlit LED/LCD control display (blue, red, or white digits) as the one bright "electronic" accent.

### Placement
**FLOOR**-standing/portable in all rooms — bedrooms, living rooms, home offices, occasionally bathrooms (GFCI-aware placement). Never wall-mounted or built-in in the household/portable category (baseboard/central heating is a different item).
- Base sits flush on floor (feet/casters ~15–30 mm); control panel typically 300–800 mm off the floor depending on type.
- Usually placed against a wall or in a corner, away from curtains/furniture (safety clearance ~300 mm+), never fully centered in open floor — good default rotation: front face angled slightly into the room.

### Running / active indicators
- Real cues: backlit control display/digits, a small power/heat-level LED, and (radiant/quartz types) a visible glowing amber-orange tube behind the mesh — the one variant with a genuinely obvious "on" signal.
- Oil column & ceramic tower have no strong visible tell. Recommended cues:
  1. **Emissive status LED + backlit display digits** (steady glow, always cheap and available).
  2. **Heat-shimmer/rising warm-air distortion** above the unit (soft vertical noise-wobble or a faint rising particle/haze sprite).
  3. **Soft pulsing warm-glow halo** at the base (reusing the fireplace floor-pool trick), scaled by intensity.
  - For the radiant/quartz variant specifically: animate the mesh-window emissive material with a slow flicker/glow-intensity pulse (same random-flicker idiom as the fireplace) — the most "honest" of the three.

### Variations & customizations
- Type switch: oil-column (fin count 7/9/11/13 as a size slider) / tower (slim vs. wide-oval) / radiant-panel (with or without carry handle, wall-lean vs freestanding).
- Color: white / black / graphite / silver-trim.
- Size tiers: compact (500–900 W, ~340–580 mm tall) / standard (1500 W, ~630–900 mm tall).
- Optional add-ons: remote-control glyph on top (tower), oscillation base ring (tower/panel), caster wheels vs. fixed feet (oil column).

### Animation opportunities
- **Idle (off)**: static, no glow, display dark.
- **Active**: emissive control-display flicker-on, steady/pulsing status LED, warm base-glow pool (fireplace-style intensity random walk), rising heat-shimmer haze above the unit, and — tower/panel types only — a slow yaw oscillation of the whole body (±40–60° sweep, several-second period) if oscillation is modeled as "on." Optional subtle idle sound-ring ripple (fan idiom) for tower types to distinguish "blowing" heat from "radiant" heat.

---

## Furnace / Air Handler

*HVAC indoor unit.*

### Dimensions
Upright rectangular cabinet, taller than wide/deep in nearly all cases.
| Variant | Width | Depth | Height |
|---|---|---|---|
| Compact/retrofit furnace | 355 (14") | 610–710 (24–28") | 840 (33") |
| Standard furnace (most common) | 445–535 (17.5–21") | 710–760 (28–30") | 840–865 (33–34") |
| Large-capacity furnace | 620 (24.5") | 760 (30") | 865 (34") |
| Vertical air handler (residential split-system) | 460–635 (18–25") | 460–585 (18–23", some slim ~150/6") | 1140–1525 (45–60") |
| Furnace/AH closet clearance envelope | +150–250 (6–10") on sides/front/top for service access | | |

Air handlers run noticeably taller/slimmer than furnaces (vertical airflow path with the blower stacked below/above the coil); furnaces are boxier and squatter. Single stylized default: **530 × 710 × 850 mm** (furnace) or **560 × 560 × 1370 mm** (air handler).

### Shape breakdown
- Core body: one tall **box** primitive — the sheet-metal cabinet.
- Front face (local +Z): a shallow recessed **box** insert (2–5 mm proud/recessed) representing the removable access/blower door panel, often with a vertical seam line down the middle (two half-width boxes read fine).
- Louvers: 3–5 thin horizontal box slats recessed into the lower third of the front face (return-air louvers) — read as a subtle striped texture/grooves rather than true geometry at low LOD.
- Top: flat, or a short cylinder stub(s) protruding for the flue vent (gas furnaces) and a box duct collar where sheet-metal ductwork transitions from round to rectangular.
- Ductwork stubs: a squat box (supply plenum) on top, a cylinder (flue pipe, if gas) exiting the top or back, and a return-duct box on the side/bottom — optional detail, can be a single generic duct-collar box.
- Small cylinder/disc on the front face for a gas valve inspection port/control door latch, and a tiny recessed box for the thermostat wiring/control-board access panel.
- No true front-vs-back asymmetry needed beyond the access-door face and duct collar — front face (+Z) is the access panel side, which in a real closet install usually faces into the room/hallway.

### Colors & finishes
- Sheet steel with **baked-on powder-coat enamel**, near-universal palette: off-white/bisque, light gray, silver/putty, occasionally pale beige or light blue-gray (older Carrier/Bryant units). Matte to slight satin sheen — not glossy.
- Trim badge/nameplate in brand color (blue, red, green) as a small optional decal.
- Louver slats and screw heads read as a subtly darker gray than the body.
- Interior return-air duct boot (if visible/exposed) is bare galvanized metal (light silvery gray).

### Placement
**FLOOR**-standing (furnace, more common) or floor-standing/closet-mounted vertical unit (air handler) — utility room, basement, garage, or a dedicated mechanical closet/hallway closet. Occasionally in an attic (horizontal orientation, not modeled here) or on a platform stand. Rests directly on the floor slab or a small plywood/plastic pan base (~50–100 mm riser) — no wall mount, no counter, no ceiling hang in the residential vertical case. Typically pushed against a wall with the front access face into the room for service clearance.

### Running / active indicators
- A small status LED (green steady = OK, amber/red blink codes = fault) behind a clear window on the control-board access door — always present on modern units, tiny but a great emissive dot.
- A digital diagnostic display (7-segment or LCD) on some furnace control boards — optional detail.
- No visible flame, no visible fan, no glass — the cabinet is fully enclosed, so there is no obvious external "I'm running" signal by default. Recommended cues:
  1. **Soft emissive status-LED pulse** (green glow breathing on the control door) — cheapest, matches the one real cue that exists.
  2. **Gentle body hum/vibration** — a tiny high-frequency, low-amplitude Y-jitter on the whole cabinet while the blower/burner runs.
  3. **Rising heat-shimmer/warm air distortion** above the supply plenum duct collar when heating is active (skip in cooling-only air-handler mode).
  4. Secondary: **faint duct-rumble sound-ring ripple** emanating from the top plenum, synced to blower cycles, if the engine supports radiating rings elsewhere (e.g. doorbell pulses).
  - Best fit: **LED pulse + subtle body vibration**, optionally layered with the heat-shimmer for gas/electric heating mode specifically.

### Variations & customizations
- Furnace vs. air handler silhouette (squat box vs. tall slim box) as a kind toggle.
- Fuel/heat type: gas furnace (add flue pipe cylinder) vs. all-electric air handler (no flue).
- Cabinet color swatch: white / bisque / gray / silver.
- Size tier: compact / standard / oversized (scales width+depth together, per the table).
- Optional visible ductwork stubs (on/off) for more mechanical detail vs. a clean box.
- Optional brand-color badge decal.

### Animation opportunities
- **Idle**: near-static; maybe an occasional single LED blink cycle (every few seconds) to read as "powered on but idle."
- **Active (heating/cooling call)**: LED shifts to a steadier/brighter pulse, body micro-vibration engages, optional heat-shimmer above the plenum duct, subtle low-frequency scale/jitter (±1–2 mm) to sell the internal blower motor without any moving geometry.
- **Access-door "open" state** (service/inspection): the front panel box could swing outward on a hinge for maintenance-themed activities, though this is a rare/optional interaction rather than a core animation.

---

## Modeling notes for Diorama

This section maps the appliance category onto Diorama's existing furniture systems (`geometry.ts` / `three-renderer.ts` / `canvas-render.ts`), so a modeler/developer can wire each item in without inventing new mechanisms.

### FURNITURE_KINDS defaults table (suggested)

All items are `cat: 'appliance'` (drives appliance-specific systems: in-use LED glow, `doorEntity`/`tempEntity` binding UI, the `_keyFloor` appliance-state hash) unless noted otherwise. Footprint is `w` (local X) × `d` (local Z, front-back); `h` is body height; tint is a starting hex for `_mat()` / toon shading.

| Kind | w × d (mm) | h (mm) | Default tint | Category | Mount |
|---|---|---|---|---|---|
| `washer` | 700 × 700 | 900 | white `#eef0f2` | appliance | floor |
| `dryer` | 700 × 800 | 950 | white `#eef0f2` | appliance | floor |
| `dehumidifier` | 350 × 260 | 600 | white `#f2f2f2` | appliance | floor (or `mountable` for mini/tabletop) |
| `dishwasher` | 600 × 610 | 860 | stainless `#b8bcc0` | appliance | floor, snaps into counter run like a cabinet bay |
| `ice_maker` | 400 × 550 | 860 | stainless `#b8bcc0` | appliance | floor (undercounter) or `mountable` (countertop) |
| `fridge` | 900 × 900 | 1780 | stainless `#b8bcc0` | appliance | floor |
| `chest_freezer` | 915 × 635 | 865 | white `#f0f0f0` | appliance | floor |
| `upright_freezer` | 750 × 750 | 1700 | white `#f0f0f0` | appliance | floor |
| `range` | 760 × 660 | 915 | stainless `#b8bcc0` | appliance | floor; cooktop-top height feeds counter alignment |
| `microwave_otr` | 762 × 420 | 432 | stainless `#b8bcc0` | appliance | ceiling/cabinet-hung (fixed offset above `range`) |
| `microwave_countertop` | 500 × 400 | 300 | white `#f2f2f2` | appliance | `mountable` (surface = counter) |
| `range_hood` | 900 × 550 | 300 (canopy only; chimney extra) | stainless `#b8bcc0` | appliance | wall/ceiling-hung, no floor footprint |
| `wine_fridge` | 600 × 600 | 870 | stainless `#b8bcc0` | appliance | floor (undercounter) or freestanding tower variant |
| `water_heater_tank` | Ø530 (as 530×530 box footprint) | 1400 | white `#eeeeee` | appliance | floor |
| `water_heater_tankless` | 440 × 335 | 700 | white `#f2f2f2` | appliance | wall-hung |
| `garbage_disposal` | n/a (sub-object of sink) | n/a | dark gray `#4a4a4a` | appliance | hangs under sink furniture — NOT a standalone placeable (design flag below) |
| `trash_compactor` | 390 × 620 | 890 | stainless `#b8bcc0` | appliance | floor, counter-height cabinet bay |
| `air_purifier` | 320 × 265 | 650 | white `#f4f4f4` | appliance | floor or `mountable` (mini/desktop) |
| `portable_ac` | 400 × 400 | 750 | white `#f0f0f0` | appliance | floor |
| `space_heater` | 300 × 250 | 600 | matte black `#2b2b2b` | appliance | floor |
| `furnace` | 530 × 710 | 850 | putty/bisque `#d8d3c8` | appliance | floor |
| `air_handler` | 560 × 560 | 1370 | putty/bisque `#d8d3c8` | appliance | floor |

Sittable/surface flags don't apply to this category (`seat`/`surface` are unset — nothing here is furniture to sit on or a counter-height surface other pieces mount to, EXCEPT a countertop microwave/ice-maker/wine-fridge, which are themselves `mountable` onto a `surface` piece like a counter or island).

### ObjectRecipe / custom-object mapping
Every item in this doc reduces to `box`/`cylinder`/`sphere`/`cone` primitives in local mm, origin at floor-level piece center, **+Z = front** (matching the note in each section's Shape Breakdown) — so each is buildable directly as a `Store.customObjects` `ObjectRecipe` if a hard-coded `FurnitureKindDef`/`_buildFurniture` switch case isn't warranted yet. Recommended primitive patterns that recur across the category (reuse rather than re-deriving per item):
- **Stacked-cylinder assemblies** (garbage disposal, water heater tank): 2–3 cylinders of decreasing/varying diameter, centered on the local Y axis.
- **Box-with-inset-door** (fridge, dishwasher, washer, dryer, freezers, microwave, wine fridge, mini-fridge-style ice maker): body box + a slightly recessed/proud door box as a child pivot group — the reusable "appliance door" idiom.
- **Porthole/window disc** (washer, dryer, microwave, wine-fridge glass front): a flattened cylinder or inset dark box standing in for tempered/tinted glass.
- **Ribbed-fin box** (space heater oil column, dishwasher/dryer control louvers): approximate real ribbing with a texture/normal-map band rather than true repeated geometry — keeps triangle count down and matches the Sims-toon flat-shading aesthetic.
- **Control-strip + emissive dot/display** (nearly every item in this doc): a thin box strip holding a small recessed display box or a tiny emissive cylinder/sphere "LED" — this is the single most-reused sub-assembly in the whole category and should probably become a shared helper (`_buildApplianceControlStrip(w, ledColor)` or similar) rather than hand-rolled per kind.

### Mount-type summary (for placement/snap logic)
- **Floor-standing** (default `Furniture` placement, rests at y=0): washer, dryer, dishwasher (built-in and portable), fridge, chest & upright freezers, range, wine-fridge undercounter/tower, water heater tank, trash compactor, air purifier (tower), portable AC, space heater, furnace, air handler, dehumidifier (standard/large sizes).
- **`mountable`** (sits atop a `surface`-flagged piece like a counter/island, per the existing mountable-auto-snap system): countertop microwave, countertop ice maker, countertop dehumidifier/air-purifier (mini sizes), countertop wine-cooler.
- **Wall-snapped** (flush-mount like the existing switch/fireplace/floodlight wall-snap idiom, offset by half its own depth): tankless water heater. Range hood also wall-mounts (wall-chimney/under-cabinet variants) but with a fixed height offset well above floor (~1400–1600 mm) rather than a flush baseboard snap.
- **Ceiling-hung / cabinet-hung** (fixed vertical offset, no floor footprint, similar to a pendant light's hang-height convention): over-the-range microwave (fixed offset above the `range` piece), island range hood (ceiling-suspended, needs its own vertical-offset field distinct from `lightHeight` but conceptually the same idea).
- **Non-standalone accessory** (flagged for developer decision, not a normal placeable): the garbage disposal — realistically it's a sub-fixture of the kitchen sink furniture piece, not something a user places independently. Recommend either (a) an optional boolean on the sink `FurnitureKindDef`/instance ("has disposal") that adds the hanging assembly + wobble/sound-ring animation automatically, or (b) skip it as a standalone Diorama object entirely and treat it as a purely cosmetic sink sub-detail.

### Items that want an "active/running" animated state
Nearly everything in this category is bindable to an HA entity (`switch.*`, `binary_sensor.*`, `sensor.*` for a running/cycle state) and should ride the existing **appliance in-use LED + soft glow** convention (`cat: 'appliance'` pulsing green/amber indicator already used for fridges/dishwashers/TVs) as the BASELINE cue, then layer a bespoke flourish per item:

| Item | Baseline cue | Bespoke flourish |
|---|---|---|
| Washer | status LED pulse | tumbling porthole silhouette (front-load) + spin-cycle body wobble |
| Dryer | control-panel glow | body wobble/vibration loop |
| Dehumidifier | status dot (green/red) | bucket-full fast-blink + vent mist wisp |
| Dishwasher | handle/control LED bar | floor-projected pulsing light bar |
| Ice maker | front-panel LED cycling | display-window glow pulse |
| Fridge | status LED (usually idle) | door-open interior glow + floor light spill |
| Chest/upright freezer | status LED | cold-mist shimmer on lid/door open |
| Range/oven | burner/knob LED, oven door pivot | gas flame flicker, rising steam, interior oven light |
| Microwave | door-window glow | turntable spin + countdown digits |
| Range hood | control-strip LED ring | under-light glow pool onto cooktop |
| Wine/beverage fridge | interior LED breathe | door-open brighter flash |
| Water heater | status LED (tank) / display (tankless) | rising heat-shimmer above flue |
| Garbage disposal | (none — no display) | body wobble + sound rings (its ONLY cue) |
| Trash compactor | LED glow | body squash-thump one-shot per compaction cycle |
| Air purifier | color-shifting glow ring | rising particle wisp from vent |
| Portable AC | display glow | oscillating vent louvers |
| Space heater | status LED + display | warm base-glow pool + heat-shimmer haze |
| Furnace/air handler | status LED pulse | body micro-vibration + heat-shimmer above plenum |

All of these flourishes reuse mechanisms already load-bearing elsewhere in the codebase — the fireplace `Math.random()` flicker idiom (emissive intensity / point-light intensity / floor-pool opacity), the appliance door-pivot system (fridge/dishwasher), the sprite/CanvasTexture idiom (env sensors, appliance chips) for any digit displays, and the transient-pulse primitive (`TransientPulse`, doorbell rings) for the garbage disposal's sound rings and the dishwasher's floor light bar — so no new rendering subsystem is required to bring this whole category online.
