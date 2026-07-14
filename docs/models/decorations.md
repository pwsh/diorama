# Household Decorations — Diorama Modeling Reference

This document exists to let a developer build STYLIZED 3D primitive-recipe
models and animations for Diorama's "household decorations" category — the
small, mostly non-interactive props (wall art, mirrors, clocks, rugs, window
treatments, soft goods, tabletop dressing, seasonal decor, greenery, and
organizational trays) that fill out a Sims-2000-style floor plan. Every item
below is specified as a set of `box` / `cylinder` / `sphere` / `cone`
primitives in **millimeters**, local origin at the piece's floor/mount-point
center, **local +Z = front** — buildable directly against Diorama's existing
`ObjectRecipe` custom-object system and `FurnitureKindDef` conventions.

## Table of contents

1. [Framed wall art / picture / canvas](#framed-wall-art--picture--canvas)
2. [Wall mirror and floor mirror](#wall-mirror-and-floor-mirror)
3. [Wall clock](#wall-clock)
4. [Area rug and runner](#area-rug-and-runner)
5. [Curtains / drapes / blinds — decorative window treatments](#curtains--drapes--blinds--decorative-window-treatments)
6. [Throw pillows and throw blanket](#throw-pillows-and-throw-blanket)
7. [Vase and decorative bowl](#vase-and-decorative-bowl)
8. [Candles and candle holders](#candles-and-candle-holders)
9. [Tabletop picture frames and books](#tabletop-picture-frames-and-books)
10. [Sculpture / figurine / decorative object](#sculpture--figurine--decorative-object)
11. [Floating wall shelf with decor](#floating-wall-shelf-with-decor)
12. [Tapestry / wall hanging / macrame](#tapestry--wall-hanging--macrame)
13. [Table centerpiece and faux floral arrangement](#table-centerpiece-and-faux-floral-arrangement)
14. [Decorative fairy / accent string lights](#decorative-fairy--accent-string-lights)
15. [Seasonal decor — wreath, garland, Christmas tree](#seasonal-decor--wreath-garland-christmas-tree)
16. [Wall-mounted plant / shelf greenery](#wall-mounted-plant--shelf-greenery)
17. [Room divider / decorative screen](#room-divider--decorative-screen)
18. [Decorative tray and coasters](#decorative-tray-and-coasters)
19. [Modeling notes for Diorama](#modeling-notes-for-diorama)

---

## Framed wall art / picture / canvas

**Dimensions** (frame outer W × H; depth is the wall-standoff dimension):

| Variant | Width × Height (mm) | Depth (mm) |
|---|---|---|
| Small / tabletop-to-wall | 203×254 (8×10″) | 20–30 |
| Common mid-size | 279×356 (11×14″), 406×508 (16×20″) | 25–35 |
| Large statement piece | 610×914 (24×36″) | 30–45 |
| Gallery-wrap canvas (no frame) | any of the above | 20–40 (1.5″ stretcher bar standard; 0.75″ "thin-wrap" variant) |
| Oversized / lean-against-wall | 900–1500 × 1200–1800 | 30–50 |

Aspect ratios cluster around 4:5, 5:7, 2:3, 3:4 — avoid perfect squares except for the "square print" variant (e.g., 400×400).

**Shape breakdown**:
- One flat **box** = the frame/canvas slab (W × H × depth), local origin at slab center, mounted flush to wall.
- Framed-print variant: a thin outer box (the molding, ~15–30 mm wide) can be a second slightly-larger box behind, or just bevel the color via a lighter/darker rim — a single box with a contrasting-color inset "mat" plane (a thin flat box, ~2 mm thick, inset 10–20 mm from the frame edge, before the "print" front face) reads well at this scale.
- Front face (**local +Z**, pointing OUT of the wall into the room) carries the "print" — a flat-color or textured box face; no moving parts.
- Gallery-wrap canvas variant: skip the mat/molding boxes entirely — just the single deeper box, image wraps the edges (no visible frame lip).
- Optional: a thin **cylinder** or two small box "wire/hook" hints are not worth modeling at this scale — skip.

**Colors & finishes**:
- Frame molding: black, white, natural wood (oak/walnut tones), brushed gold/brass, matte gray — keyed to a `frameColor` prop.
- Mat board: off-white/cream (most common), black, or none (mat-less "full bleed").
- "Print" face: flat abstract color blocks, a landscape-ish gradient, or a solid muted tone — a procedural 2–3 color gradient/canvas texture (same idiom as env sprites) reads as "art" from Sims-camera distance.
- Canvas variant: matte fabric texture, no mat/frame color at all — just the art color(s) wrapping the box.

**Placement**: WALL-mounted only. Living rooms, bedrooms, hallways, dining rooms, offices — anywhere with wall run. Standard hang height centers the piece at **~1450 mm** off the floor (interior-design "57-inch rule," eye level) for standalone pieces; when hung over furniture (sofa, console, headboard), drop it so the frame bottom sits **150–300 mm above the furniture top** instead of using the fixed height. Mounts flush or near-flush to the wall face — same wall-snap idiom as switches/fireplaces (offset = wallT/2 + depth/2, rotation from the wall normal).

**Active / interactive state**: Mostly passive decor — no HA entity in the common case. Optional "smart frame" variant could bind to a `light`/`switch`-like entity standing in for "powered on" — when on, the face brightens/shows a lit texture (emissive bump), when off it's a dark/blank rectangle. Not worth over-engineering; treat as decorative unless a digital-frame kind is explicitly requested.

**Variations & customizations**:
- Frame style: thin modern / wide ornate / floating (no visible frame, canvas-wrap) / matless.
- Size: small / medium / large / oversized-lean (an oversized variant could rest against the wall from the floor rather than hang — same box, placement mode `floor-lean` at height 0 tilted a few degrees off the wall).
- Orientation: portrait (default) vs landscape — just swap W/H.
- Grouping: "gallery wall" of 3–6 small/medium frames at slightly randomized offsets — a multi-instance preset rather than a new kind.
- Content palette: 4–6 canned "art" color/gradient presets (abstract warm, abstract cool, botanical green, mono black-and-white, family-photo beige) selectable per instance like `lightIconKind`.

**Animation opportunities**:
- Idle: essentially static — the only ambient touch worth adding is a very subtle light-catching glint if the renderer ever adds a moving light source (toon material won't really show it) — safe to leave fully static.
- Active (smart/digital frame): emissive intensity fade in/out on power toggle, and/or a slow crossfade between 2–3 canned art textures every N seconds to suggest a rotating digital photo frame.
- Seasonal/contextual (low priority): swap the canned art-color preset by time-of-day bucket or season if decor is ever wired into `resolveTimeBucket` — not a v1 must-have.

[↑ Back to top](#table-of-contents)

---

## Wall mirror and floor mirror

**Dimensions** (W × D × H, mm; glass panel is a thin slab, frame adds ~20–50 mm depth):

| Type | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Small/accent wall mirror | 450–610 | 20–40 | 610–760 | round, oval, or square decorative |
| Vanity/bathroom wall mirror | 460–1020 (610–915 common) | 20–40 | 710–915 | rectangular, often frameless w/ beveled edge |
| Large "statement" wall mirror | 915–1520 | 20–50 | 915–1220 | living/dining room |
| Full-length wall-mounted mirror | 405–610 | 20–30 | 1220–1830 | door-mounted or hung flat |
| Leaning floor mirror | 500–865 | 30–60 (frame) | 1625–2100 (64–83 in) | rests on floor, tilts back ~5–10° against wall |
| Cheval/swivel floor mirror | 530–585 | 300–460 (stand footprint) | 1500–1700 | mirror pivots in a freestanding frame on 2 posts + feet |

**Shape breakdown**:
- **Wall mirror**: one thin flat `box` (glass, ~10–20 mm thick) + an optional frame as 4 slim `box` strips (or a single slightly larger, slightly deeper box behind the glass box). Round/oval variants: swap the glass box for a squat `cylinder` (radius = mirror radius), frame as a slightly larger cylinder ring behind it. Front face = the reflective face, flush-mounted with near-zero depth offset from the wall.
- **Leaning floor mirror**: same flat glass box/frame, full-height, standing on the floor, tilted back a few degrees (small negative rotation about local X) with the bottom edge touching wall and floor simultaneously (kickstand implied by tilt, or a thin box foot brace).
- **Cheval/swivel floor mirror**: glass panel as an oval/rect box mounted between two vertical frame posts (2 slim `cylinder`s or `box`es), a horizontal top yoke bar (`cylinder`) through pivot points, and a bottom stretcher/feet base (2–4 short `cylinder`/`box` legs). Static authored tilt angle is fine — true interactivity not required.
- Frame corners/moldings can be skipped or approximated with a single beveled-look outer box slightly proud of the glass; no moving parts needed except the implied swivel tilt on cheval style.

**Colors & finishes**:
- Frame: black or gold/brass metal (thin modern), natural or dark-stained wood, white-painted wood, matte black, brushed nickel/chrome, rattan/wicker (bohemian), or **frameless** (polished/beveled edge only).
- Glass: neutral light gray-blue tint (`#c8d6dc`-ish) rather than true reflection unless the engine supports it; antique/smoked mirror variants are warm bronze-tinted glass.
- Shapes: rectangle, round, oval, arched-top, irregular/asymmetric "blob" mirrors, sunburst (metal rays around a small round mirror).

**Placement**: WALL-mounted (bathroom over vanity, entryway, bedroom, living room accent) or resting on the FLOOR leaning against a wall / freestanding on a base. Not ceiling-hung.
- Bathroom vanity mirror: center height ≈ 1500 mm from floor, hung 125–250 mm above the sink/backsplash.
- Entryway/decorative wall mirror: center ≈ 1500–1550 mm from floor.
- Full-length wall mirror: bottom edge near floor (0–50 mm), top around 1800–2000 mm.
- Leaning floor mirror: base flush on floor, top leans back against wall at 1600–2100 mm height.
- Cheval floor mirror: freestanding, no wall contact; needs ~400–500 mm clearance depth for the base.

**Active/interactive state**: No powered state, but a good passive detail/animation surface:
- Subtle idle "reflection shimmer" (slow-scrolling faint gradient or specular highlight sweep) sells the mirror look cheaply.
- Could highlight/glow faintly when an avatar walks past and "checks themselves" (ties into the idle-fidget system: `check_watch`-style glance-in-mirror one-shot).
- Could show a duplicated/mirrored silhouette of the nearest avatar as a cheap fake-reflection gag (optional, higher effort).
- Some smart mirrors (bathroom, LED-ringed) have an actual `light`-like ON state — a thin emissive ring/backlit edge could pulse when bound to a light entity.

**Variations & customizations**: shape (rectangle / round / oval / arched / sunburst), frame finish (black/gold/wood/white/frameless/rattan), size tier (small accent / vanity / oversized statement / full-length), mount type (wall-hung vs leaning floor vs cheval swivel-on-stand), optional integrated LED backlight ring (smart/vanity variant), tinted "antique" glass option.

**Animation opportunities**:
- Idle: slow specular sheen/gradient sweep across the glass surface (cheap trick: animate a UV-offset light streak or a lightened stripe); very subtle sway/creak is NOT appropriate (mirrors are rigid/mounted).
- Active: on-glance highlight/pulse when an avatar's idle-fidget "check_watch"/"glance" plays nearby; optional cheap fake-reflection silhouette of the nearest rig; smart-mirror LED ring pulsing color/brightness when bound to a light/switch entity (reuse the existing light-fixture glow machinery).

[↑ Back to top](#table-of-contents)

---

## Wall clock

**Dimensions** — Diameter (round, by far the most common shape) with thin depth:
- Compact/desk-adjacent: 200–250 mm dia. × 40 mm deep
- Standard: 300 mm dia. × 40–50 mm deep (300 mm / ~12 in is the classic "kitchen clock" size)
- Large/statement: 400–500 mm dia. × 45–60 mm deep
- Oversized/gallery: 600–900 mm dia. × 50–70 mm deep
- Square/rectangular variants exist (e.g. 300×300 mm, or 250×400 mm) at similar depths. Cuckoo/chalet-style novelty wall clocks are boxier: roughly 200×120×350 mm (w×d×h).

**Shape breakdown**:
- Body: one flat **cylinder** (radius = dia/2, height ≈ 40–70 mm), axis along Z, front face toward local +Z.
- Rim/bezel: slightly larger-radius thin cylinder (ring), often contrasting metal/black finish, ~5–10 mm proud.
- Face (dial): a flat disc (short cylinder, ~2 mm) inset just behind the bezel, white/cream/black; numerals/ticks are a texture/decal, not geometry.
- Hands: 3 thin flat **boxes** (hour/minute/second) pivoting from a small center **cylinder** (hand-nut); lengths roughly 0.35 / 0.5 / 0.55 × radius, thickness 2–4 mm.
- Hanging hardware: negligible visually — omit or represent as a tiny box nub.
- Square/rectangular variants: swap the body cylinder for a thin **box** of matching footprint; hands/pivot unchanged.
- Cuckoo-style: chalet-shaped box body (box + **cone**/triangular-prism roof gable) + small door + pendulum — treat as a distinct "novelty" kind, not a variant of the round clock.

**Colors & finishes**:
- Body/rim: black, white, brushed silver/chrome, matte gunmetal, wood-tone (oak/walnut laminate), brass/gold (traditional), bold accent colors (red, navy, sage).
- Face: white/cream dial with black numerals/ticks (classic); black dial with white/luminous numerals (modern/industrial); minimalist faces with no numerals, just index ticks.
- Hands: black, white, or matching metal finish (gold/silver) to the rim.
- Materials: injection-molded plastic (budget), MDF/wood (mid), metal spun-aluminum/stainless (premium/industrial loft), glass lens cover on nicer models.

**Placement**: **WALL**-mounted only (never floor/counter). Kitchen, living room, home office, bedroom, hallway. Typical mount height: center **1500–1700 mm** above floor (eye level); kitchen clocks sometimes higher (1800–2000 mm) to clear cabinets/backsplash. Mounts flush or near-flush to the wall (front face projects only the clock's own depth, e.g. 40–70 mm) — analogous rigging to `LightIconKind: sconce` (wall-flush, no floor pool).

**Active / interactive state**:
- Continuously "powered" in the sense that hands should be in continuous slow rotation — a good ambient animation target regardless of any bound entity.
- No real device binding expected — likely a static/animated furniture-kind prop rather than an entity-bound fixture, unless bound to `sensor.time` for fun (hands rotate to actual wall-clock time as a live readout).
- Seasonal/decorative: wreaths/garland around a wall clock in winter — optional cosmetic layer only, not core.

**Variations & customizations**:
- Shape: round (default) / square / rectangular.
- Size: compact / standard / large / oversized (diameter slider).
- Face style: numeral (12 digits) / index-tick minimalist / roman-numeral / no-numbers.
- Finish/color: body color + face color as two independent color pickers (mirrors `MotionSensor.color` / `Sensor.color`).
- Hand style: classic (spade-tip) / thin modern / ornate (baroque).

**Animation opportunities**:
- **Idle (always-on)**: continuous hand rotation — second hand sweeps (or ticks in 1 Hz discrete steps for retro feel), minute hand creeps continuously, hour hand creeps continuously; all driven off wall-clock time (`Date.now()`) rather than any HA entity, same spirit as the fireplace's free `Math.random()` flicker liveliness.
- **Active/highlight**: could add a subtle tick "flick" (slight overshoot-and-settle micro-rotation each second) on the second hand for a mechanical-movement feel versus a perfectly smooth "quartz sweep."
- No lighting/glow states — the only motion is the hands, a cheap always-moving background detail reinforcing the "living dollhouse" feel even with no avatars present.

[↑ Back to top](#table-of-contents)

---

## Area rug and runner

**Dimensions** (W × D × H, mm — flat on floor, no bounding volume beyond pile height):

| Variant | W × D (mm) | Common imperial | Notes |
|---|---|---|---|
| Accent / entry | 910 × 1520 | 3×5 ft | small entry/bath mats scale down further (500×800) |
| Compact | 1220 × 1830 | 4×6 ft | apartment living rooms |
| Standard | 1520 × 2440 | 5×8 ft | most common single size |
| Medium-large | 2740 × 3050 | 9×10 ft | queen bed / medium living room |
| Large | 2740 × 3660 | 9×12 ft | king bed / large living room, most common "big" size |
| Oversized | 3050 × 4270+ | 10×14 ft | great rooms |
| Runner | 610–910 × 1830–4270 | 2–3 ft × 6–14 ft | hallways, kitchens, alongside beds — length is the free variable |
| Round | Ø 1520 / 1830 / 2440 | 5/6/8 ft dia. | breakfast nooks, under round tables |

Height (pile thickness) is nearly flat in real life: low pile <6 mm, medium 6–12 mm, high/plush 12–19 mm, shag 19 mm+. Diorama's existing `rug` kind already models this as a **flat 5 mm slab**; a "plush/shag" variant could go to 15–20 mm without looking wrong.

**Shape breakdown**:
- Single **box** primitive, `w × d × 5–20mm`, flush on the floor (y ≈ 0, top face at pile-height) — matches Diorama's `rug` FurnitureKind ("Flat 5 mm slab, opaque, depthWrite on"); parametrize thickness per pile-style variant.
- **Round rugs**: swap the box for a short **cylinder** (radius = size/2, same low height).
- Optional low-cost detail: a border-ring effect is better done in texture/material (a border color baked into a canvas texture, or two-tone gradient) than extra geometry — same idiom as procedural floor textures (`_texCache`).
- **Front face**: rugs are symmetric — no front-facing orientation needed (skip `frontArrow`).
- No moving/openable parts.
- Fringe (flatweave/kilim, oriental rugs): optional very thin extra box strip at each short end, barely proud of the rug top, for silhouette read at distance — skip for the base version.

**Colors & finishes**:
- Materials: wool, jute/sisal (natural fiber, tan/undyed), cotton (flatweave/rag rugs), synthetic (polypropylene/nylon — outdoor-safe), shag (polyester/acrylic).
- Common palettes: neutral (beige/ivory/grey/jute-tan) for living/bedroom; bold pattern (Persian/oriental medallion, moroccan trellis, southwestern, striped) for accent pieces; solid saturated colors (navy, rust, sage) for modern rooms; jute/natural fiber has visible woven texture.
- Toon-shaded renderer: solid base tint via `_mat()` + optional simple 2-color pattern baked into a small canvas `DataTexture` (stripes / border / medallion blob).

**Placement**: FLOOR only, always. Sits directly on top of the floor plane (y ≈ 0 to pile-height), centered under/near seating groups, beds, dining tables, or laid the long way down a hallway (runner). No wall/ceiling/counter placement ever applies.

**Active / interactive state**: Passive decor — no bound entity, no power state. The only "activity" signal is contextual: humanoid rigs may stand/walk across it, and a pet rig can curl up/lie on a rug flagged as "soft" surface (Diorama's `SitSpot.soft` already extends to sofa/chaise/ottoman/bed — a rug could opt into the same soft-lie pose for pets). No color/light change on interaction.

**Variations & customizations**:
- Size preset (accent / standard / large / oversized / runner-length slider / round).
- Shape: rectangular vs round vs runner (aspect-ratio-only difference for rectangular; round needs the cylinder path).
- Pile style: flatweave (5 mm, crisp edge) / plush (10–12 mm) / shag (18–20 mm, could get a fuzzy-edge texture trick).
- Color/pattern swatch list (solid neutral, solid bold, striped, bordered, medallion/oriental, jute natural).
- Fringe toggle (adds the thin end-strip geometry) for oriental/kilim styles.

**Animation opportunities**:
- Idle: essentially none — a static flat decal-like object; at most a very subtle shag "fluff" via a bump/normal-mapped texture rather than actual geometry animation.
- Active: a pet curling up on it (reuse existing quadruped curl/lie pose); footstep dust/shake is unnecessary. Optional: a faint blob-shadow-style soft highlight ring that pulses briefly when a rig steps onto it (echoing the appliance-in-use LED-glow idiom) purely as a debug/visual affordance — not required, since rugs carry no HA entity to react to.

[↑ Back to top](#table-of-contents)

---

## Curtains / drapes / blinds — decorative window treatments

**Dimensions** (mounted relative to a window opening of width `Wwin` × height `Hwin`; window `sill`/`head` height already tracked per-window in Diorama's `Window` data):

| Variant | Width | Depth (proud of wall) | Height | Notes |
|---|---|---|---|---|
| Curtain rod + panels (standard) | `Wwin + 300–450` (rod overhangs opening ~150–225 mm each side) | 100–150 mm (rod standoff + gathered fabric) | rod → floor or rod → sill | rod mounted 100–150 mm above the window head (4–6 in) |
| Rod diameter/finials | rod Ø 20–38 mm (light) or 25–35 mm (heavy); finials Ø 40–90 mm, protrude 60–90 mm past each end | — | — | finials are simple sphere/cone caps |
| Curtain panel (pair) | each panel ≈ 0.5–1.0× `Wwin` (gathered fullness 1.5–2×) | 15–30 mm fabric slab (stylized) | floor-length: `sill_to_floor`; sill-length: to sill; puddle: +50–100 mm past floor | 2 panels typical, sometimes 1 (single sliding panel) |
| Venetian/mini blind | `Wwin − 20 to 40` (inside-mount) or `Wwin + 50–100` (outside-mount) | 40–60 mm headrail box; slats stack ~25–40 mm at top when raised | headrail at head; slats span head→sill | slat width 16/25/35/50 mm (25 & 50 mm most common) |
| Roller shade | `Wwin − 20` (inside) / `Wwin + 60` (outside) | 60–80 mm roller tube Ø + fabric ~2–5 mm | head → variable (raised = rolled at top, ~80 mm band) | single flat fabric sheet |
| Roman shade | `Wwin ± 40` | 40 mm flat when down; folds into ~150–250 mm stacked pleats when raised | head → sill/floor | fabric with 3–5 horizontal fold seams |
| Vertical blind (patio-door scale) | `Wwin` up to 2400+ mm | vane depth 90 mm (3.5 in) or 127 mm (5 in), headrail 60 mm | ceiling/head-mounted, hangs to floor | vanes rotate on individual pivots |

**Shape breakdown** (stylized, primitives only — front face = local **+Z**, facing into the room):
- **Rod + panels**: 1 thin `cylinder` (rod, along X, radial to wall) + 2 small `sphere`/`cone` finials at the ends + 1–2 `box` panels (thin, ~15–30 mm deep, width ≈ panel width) hung just proud of the rod, slightly bowed outward at the bottom via a second offset box for a "gathered" look (stack 3–4 thin vertical boxes with alternating tiny Z-offsets to fake pleats cheaply). A tieback = small `cylinder` or flattened `sphere` pulling one panel toward the wall at ~1/3 height.
- **Venetian/mini blind**: 1 `box` headrail (full width, ~50×50 mm) + when CLOSED, one `box` slab standing in for the whole slat stack (thin, 15–20 mm deep) OR 6–10 thin flat `box` slats stacked vertically with a hair of Z-tilt alternating (open-slat look); when RAISED, collapse to a short stacked block (~80 mm tall) tight under the headrail plus two thin `cylinder` pull cords hanging to about counter height.
- **Roller shade**: 1 `cylinder` roller tube at the head + 1 thin `box`/plane fabric sheet extending down from it (length = current position) + a slim `box` pull-bar at the fabric's bottom edge.
- **Roman shade**: 1 flat `box` when fully down; when raised, 3–5 stacked slightly-overlapping thin `box` segments compressed near the top to suggest pleats.
- **Vertical blind**: headrail `box` at top + N thin vertical `box` vanes (width ≈ vane depth's visual width, ~90–130 mm) hanging full height, each independently yaw-rotatable about its own top pivot for the open/closed sweep.
- All types are built as a **child group of the `Window`** (or a standalone accessory keyed to a `Window` id) so they inherit the window's wall position/rotation; depth offset keeps them just inside the room face of the glass (avoid coincident-face z-fight with the window pane/frame).

**Colors & finishes**:
- Curtains: solid neutrals (white, ivory, linen, grey, navy, sage) most common; sheers (near-white, semi-transparent) vs. blackout (opaque, denser color) vs. patterned (florals/stripes — approximate with a solid tint); fabric family implies texture only (linen/cotton/velvet — velvet reads darker/richer, silk reads with a slight sheen).
- Blinds: white/off-white/grey PVC or aluminum (most common), warm wood tones (bamboo, oak, walnut) for wood venetians, black/graphite for modern aluminum minis; headrails usually match slat color or a neutral white/grey.
- Roller/roman shades: fabric matches room's soft-goods palette; blackout roller shades often show a distinct grey/white rubberized backing.

**Placement**: WALL/CEILING-mounted at the window, never floor-resting. Rod or headrail mounts to the wall directly above the window head (curtain rod: head + 100–150 mm; blind/shade headrail: at or just above the head, flush for inside-mount, proud for outside-mount). Present in every room with a window — bedrooms/living rooms favor curtains or roman shades, kitchens/bathrooms favor blinds or roller shades, offices commonly get blinds for glare control.

**Active/interactive state**: primary interactive state is **open vs. closed** (a `0..1` openness fraction, mirroring the repo's existing `doorOpenFraction` resolver) — could bind to `cover.*` entities (many smart blinds report `current_position`) the same way `Window.coverEntity` already drives the roller-shade builder. Visible changes:
- Curtains: panels slide/gather along the rod (translate + fake-fold) between fully-drawn and stacked at the sides.
- Blinds: slats rotate (tilt) for light control short of full raise, and the whole stack telescopes up into the headrail when raised.
- Roller/roman shades: fabric height shrinks toward the headrail as raised.
- A bound `cover.*` in motion should ease over ~1–2 s rather than snap, matching the repo's spring/ease conventions.
- Optional idle: a very subtle sheer-curtain sway (small sinusoidal local Z/X offset) if a window is marked "open" — cheap idle flourish, not required.

**Variations & customizations**: type (rod+panel curtain, sheer curtain, venetian blind [slat width 25/50 mm, material wood/aluminum/PVC], roller shade, roman shade, vertical blind, or "none"), panel count (1 or 2), length (sill-length / floor-length / puddle), color/tint swatch + opacity (sheer vs. blackout), tieback on/off, mount style (inside-mount vs. outside-mount).

**Animation opportunities**:
- *Idle*: faint sway/billow for sheers near an "open" window or a breeze/HVAC vent (low-amplitude, low-frequency sinusoidal offset, cheap per-frame transform tweak, no rebuild needed).
- *Active*: openness-fraction-driven transitions bound to a `cover.*` entity — panels sliding, blind slats stacking/unstacking + tilting, roller/roman fabric rising/falling — all eased, consistent with existing cover animation conventions.
- *Contextual*: auto-close at night / auto-open at day if tied to a lighting/time-of-day preset, or a quick "flutter" one-shot when the bound cover entity's target position changes.
- *Manual light-and-shadow cue*: when closed + a light is on behind them (interior at night), a warm glow/backlit tint on the fabric reads as "someone's home" — cheap emissive tweak keyed off the window's room light state.

**Sources**: [Curtain Rod Size Chart & Guide](https://joeyzshopping.com/blogs/news/curtain-rod-size-chart), [How To Measure For Curtain Rods](https://www.continentalwindowfashions.com/pages/how-to-measure-for-rods), [Standard Curtain Rod Sizes](https://joeyzshopping.com/blogs/news/standard-curtain-rod-sizes), [Curtain Rods Organized By Size](https://stylebyemilyhenderson.com/curtain-rods-by-size), [Curtain Rod Sizes Guide](https://designingidea.com/curtain-rod-sizes/), [Venetian Blinds Slat Sizes](https://velablinds.com/venetian-blinds-slat-sizes-how-do-you-choose-for-perfect-light-control/), [Window Blind - Venetian, Dimensions.com](https://www.dimensions.com/element/window-blind-venetian-wide), [Venetian Blinds for Small vs. Large Windows](https://www.topjoyblinds.com/news/venetian-blinds-for-small-vs-large-windows-slat-size-material-style-guide/), [Venetian Blinds Specifications](https://venetablinds.com.au/pages/venetian-blinds-specifications)

[↑ Back to top](#table-of-contents)

---

## Throw pillows and throw blanket

**Dimensions**:

| Item | Common name | W × D × H (mm) | Notes |
|---|---|---|---|
| Throw pillow | Compact/lumbar | 305 × 508 × ~130 (12×20 in) | rectangular accent/lumbar cushion |
| Throw pillow | Small square | 406 × 406 × ~150 (16×16 in) | |
| Throw pillow | Standard square | 457 × 457 × ~180 (18×18 in) | most common size, industry default |
| Throw pillow | Large square | 508 × 508 × ~200 (20×20 in) | anchor pillow on bigger sofas/beds |
| Throw pillow | Oversized square | 559–610 × 559–610 × ~220 (22×22–24×24 in) | sectionals, king beds, floor cushions |
| Throw blanket | Travel/mini | 1016 × 1270 (40×50 in) | thin fold, chair-back size |
| Throw blanket | Standard | 1270 × 1524 (50×60 in), folded thickness ~40–80 | fits ~80% of sofas/chairs |
| Throw blanket | Oversized | 1524 × 1778 (60×70 in) | 2-person / tall-adult throw |
| Throw blanket | Weighted | 1219 × 1829 (48×72 in) | thicker (~30–60 mm loft), heavier drape |

Insert convention: cover is usually 1–2 in smaller than its insert for a plumped, pillowy look — worth baking a slight "over-stuffed" bulge into the model rather than a flat cushion.

**Shape breakdown**:
- **Square/lumbar pillow**: cheapest buildable approximation is a **squashed sphere** (scale Y to ~35–40% of X/Z) sitting on the seat/backrest — reads as a soft pillow instantly, no flat box faces to hatch under toon shading. (A box with heavily rounded/domed corners is the "ideal" but not achievable with a raw box.)
- **Bolster/round pillow variant**: a **cylinder** (horizontal axis) with two hemispherical **sphere** caps, laid along a sofa arm or bed head.
- **Front face**: pillows have no true "front" — for a lumbar pillow, orient the long axis along the backrest (local +Z pressed toward the seat back).
- **Throw blanket, draped** (sofa arm / chair back / bed foot): model as a **thin box** ("sheet", ~1270×400–600×30 mm visible drape segment) with 2–3 short box segments angled progressively downward around the arm/rail to fake a soft fold-over, rather than one rigid flat plank. Alternatively a plane with a folded silhouette baked into vertex offsets (same technique as the renderer's `_animateBedCover` vertex-displaced blanket plane).
- **Throw blanket, folded** (ottoman/bench/bed foot): stack of 3–5 thin flattened **boxes** slightly offset in X/Z and increasingly narrow, mimicking a folded stack; top layer gets a subtle diagonal rotation for a "just tossed there" look.
- **Throw blanket, crumpled** on a seat: a lumpy **sphere** scaled flat (like a squashed pillow but larger and lower, ~1200×150×900) with 2–3 overlapping smaller sphere lumps to break the silhouette — reads as "bunched fabric" without cloth simulation.

**Colors & finishes**:
- Pillows: solid neutrals (cream, taupe, charcoal, navy), accent brights (mustard, terracotta, sage, blush), pattern prints (stripe, geometric, floral, ikat) — for a low-poly texture-free build, pick 1–2 flat accent colors per piece (body + a piped edge trim color) rather than a print.
- Fabric families: cotton/linen (matte, slightly nubby), velvet (deep saturated colors, soft sheen — bump specular slightly), faux fur/sherpa (fluffy, usually cream/grey/blush — subtle noise-bump or lighter toon band), knit/cable-knit throws (chunky texture, oatmeal/grey/cream), outdoor/performance (solid bold color, canvas-like).
- Trim details worth a thin secondary primitive: piping/welt cord along pillow seams, pom-pom or tassel fringe along a blanket's short edges (tiny sphere/cylinder row), knit fringe (thin cylinder rows).

**Placement**: **Rests on FLOOR-standing furniture, not the floor itself** — always mounted on top of a host piece: sofa/chair seat or backrest corners, bed head/foot, chaise, bench, window-seat, floor cushion pile (in which case the pillow itself IS floor-resting).
- Typical rest height = host seat/mattress top surface (e.g., ~420–460 mm sofa seat, ~500–600 mm mattress top) plus half the pillow's squashed height.
- Blankets drape over a sofa arm/back top edge (~600–700 mm arm height), lie folded across a bed foot (mattress-top height) or ottoman top (~400 mm), or hang folded over a blanket ladder/rack (a distinct furniture piece).
- No wall-mount, no ceiling-hang, not built-in.

**Active / interactive state**: No powered/electronic state. The only "in use" signal is contextual: when an avatar sits/lies in a spot, pillows nearby could compress slightly (squash scale down ~10–15% where a body overlaps) and a blanket could get an occupant variant (partially unfolded / pulled up over a lying rig) — mirrors the existing bed-cover occupancy blend (`_animateBedCover`) and could reuse that pattern for a sofa throw when a rig sits/naps there.
- Seasonal styling: swap accent colors/textures (chunky knit + plaid in winter presets, linen/light colors in summer) as a purely cosmetic recipe variant, no live binding needed.

**Variations & customizations**: shape (square [compact/standard/oversized], lumbar/rectangular, round bolster, crumpled/floor-cushion), blanket style (flat-folded stack, single draped-over-arm, crumpled/tossed, chunky knit vs. wooly sherpa vs. flat woven throw), color/pattern presets (solid, striped, pattern-block) + trim toggle (piping / pom-pom fringe / knit fringe / none), count/arrangement presets per sofa (e.g., 2 corner pillows + 1 lumbar + folded throw on the arm) as a single "decorate this seat" recipe.

**Animation opportunities**:
- **Idle**: none needed for a static prop; treat as inert dressing.
- **On occupancy (active)**: squash/compress nearby pillows when a rig sits down (scale blend keyed off the same `sit` trigger used for seating), and blend a folded throw into a "pulled over legs" pose when a rig lies down nearby (reuse the bed-cover vertex-displacement technique, blended by a `lie`/`sit`-style 0→1 trigger driven by RAW target dwell, not the eased pose).
- **On pickup/toss (optional flourish)**: not warranted given no direct pillow-interaction affordance in Diorama; skip unless a future "tidy room" interaction is added.

[↑ Back to top](#table-of-contents)

---

## Vase and decorative bowl

**Dimensions** (diameter × height, roughly round in plan so width≈depth):

| Variant | Diameter | Height | Placement |
|---|---|---|---|
| Bud vase | 60–90 mm | 150–250 mm | tabletop/shelf accent |
| Standard table vase | 120–200 mm | 250–350 mm | dining table, console, mantel |
| Oversized/statement vase | 200–300 mm | 350–450 mm | console table, hearth |
| Floor vase | 250–400 mm | 600–900 mm (24–36 in most common; up to 1200 mm in tall rooms) | rests on floor, corner/entryway |
| Small decorative bowl | 180–200 mm dia | 60–90 mm | entry table, shelf accent |
| Medium centerpiece bowl | 250 mm dia | 90–120 mm | dining table, kitchen counter |
| Large statement bowl | 320–380 mm dia | 100–150 mm | dining table, console, coffee table |

**Shape breakdown**:
- **Vase**: a lathe-turned silhouette approximated as a stack of primitives — e.g. `cylinder` (narrow neck, top) + `cylinder`/truncated-`cone` (shoulder tapering out) + `cylinder`/flattened-`sphere` (belly, widest point) + `cylinder` (small foot/base, slightly narrower than belly). A bulbous "ginger jar" reads well as two stacked cones point-to-point (or a sphere) between neck and foot cylinders; a simple cylindrical vase is just one `cylinder` with a slightly flared top cylinder for the lip. No front face distinction needed — vases are radially symmetric; orient any painted pattern toward local +Z if textured.
- **Decorative bowl**: a squat shape — cheapest approximation is a `cylinder` flattened (small height:diameter ratio, e.g. 1:3) with a slight taper (wider top than base); if a hollow look is wanted, a `sphere` scaled flat on Y and sunk into the surface it sits on reads more convincingly as a basin. A footed bowl adds a thin small `cylinder` base ring under the main body. No moving/openable parts on either object.
- Both are placed with local origin at floor/surface-contact center (bowl/vase base) — fully rotationally symmetric, no separate "front."

**Colors & finishes**:
- **Vase**: ceramic/porcelain (glossy white, celadon green, cobalt blue, matte black, terracotta unglazed orange), glass (clear, frosted, colored — amber, sea glass green/blue, smoked grey), metal (brushed brass/gold, matte black, bronze, hammered silver), concrete/stone (grey/sand matte), woven/rattan (natural tan) for floor variants.
- **Bowl**: matches vase material families — glazed ceramic (white/cream, blue, terracotta), turned wood (walnut, mango, teak — visible grain), polished or hammered metal (brass, silver, copper), marble/stone (white/grey veined, black), woven seagrass/rattan (natural), glass (clear or colored, often fluted rim).
- Finish cues: glossy specular highlight for glazed/glass/metal, flat diffuse for concrete/wood/woven, occasional two-tone (dark neck + light body, or metallic rim on a matte body).

**Placement**: **COUNTER-or-surface** is the default for both — table vase/bowl variants rest on dining tables, consoles, coffee tables, shelves, mantels, entryway tables (surface height typically 400–750 mm off floor). Floor vases rest directly on the **FLOOR**, typically tucked in corners, beside furniture, or flanking entryways/fireplaces — no wall or ceiling mounting for either object type.

**Active / interactive state**: Both are static decor with no powered/on-off state. Possible contextual "liveliness":
- Vase can visually swap between "empty" and "with flowers/branches" (a simple stem+bloom primitive cluster above the neck) as a style variant, optionally tied to season (spring = green stems, fall = dried branches/pampas).
- Bowl can swap "empty" vs "filled" (a cluster of small spheres for fruit/orbs, or flattened discs for potpourri/ornaments) sitting in the basin.
- Neither needs runtime animation triggers from HA state (no bound entity) — treat as furniture accessory dressing, not an interactive fixture.

**Variations & customizations**: vase silhouette presets (cylinder/simple tube, bottle/gourd, urn/ginger-jar, trumpet/flared cone, low bowl-vase), bowl presets (shallow tray-bowl, deep basin bowl, footed/pedestal bowl, fluted/scalloped rim), size tiers (bud/small/medium/large/oversized) as a scale slider independent of silhouette, content toggle (empty / filled), material/color tint pick from the finish list.

**Animation opportunities**:
- **Idle only**: a very subtle idle "presence" touch — e.g. flower stems in a filled vase given a slow, tiny sway (sine-based, a couple degrees), matching plant-sway/curtain-flutter idle motion elsewhere rather than a per-frame rebuild.
- No active-state animation applies (no bound entity, no open/close, no light/motion state) — pure static dressing geometry; the only "animation" worth budgeting is the optional stem sway and a one-time placement/spawn pop-in scale.

[↑ Back to top](#table-of-contents)

---

## Candles and candle holders

**Dimensions** (candle body, excluding holder; Ø × height, mm):

| Type | Diameter | Height |
|---|---|---|
| Tea light | 38 mm | 15–20 mm |
| Votive | 45–50 mm | 50 mm |
| Taper (standard 10″) | 22 mm | 240 mm (packaged 250 mm, burns to ~240) |
| Taper (12″) | 22 mm | 300 mm |
| Pillar, small | 75 mm | 100–150 mm |
| Pillar, standard | 75–100 mm | 150–230 mm |
| Pillar, oversized/statement | 150 mm | 230–300 mm |
| Jar candle (single-wick, e.g. Yankee-style) | 90–100 mm | 100–110 mm (incl. glass jar) |
| Jar candle (large 3-wick) | 150 mm | 100 mm |

Holders (separate from candle):
- Tealight cup/holder: Ø 45–60 mm, height 15–40 mm.
- Votive cup: Ø 60–80 mm, height 60–90 mm.
- Single candlestick (taper holder): base Ø 60–100 mm, stem height 100–300 mm (dinner-height ~150 mm, tall/formal ~300 mm).
- Hurricane/lantern (glass chimney around a pillar or LED): Ø 100–150 mm, height 200–400 mm.
- Candelabra (multi-arm, 3–7 branches): base Ø 150–250 mm, overall height 300–450 mm, arm spread 200–350 mm wide.

**Shape breakdown**:
- Candle body = single `cylinder` (or slightly tapered via two stacked cylinders of decreasing radius for tapers). Top face gets a small conical/rounded wax pool dip for realism (optional — a shallow `cylinder` scaled down, or skip for low-poly).
- Wick = thin `cylinder` (Ø ~2 mm, height 5–8 mm) centered on top, dark grey/black.
- Flame (when lit) = a small `cone` or teardrop (stretched `sphere` + `cone` tip) ~15–25 mm tall, emissive orange/yellow, offset ~3 mm above the wick tip. The one non-static/glowing part.
- Jar candle = squat `cylinder` (the wax) inset a few mm inside a slightly larger/taller `cylinder` (the glass jar, transparent material) so a rim of glass shows above the wax line.
- Taper: two-stage `cylinder` (fat at base, narrower at top); front face irrelevant — fully radially symmetric.
- Candlestick holder: `cylinder` base disc (wide, flat, 10–20 mm tall) + `cylinder` stem (narrow, tall) + `cylinder` bobeche/drip-cup (flared, slightly wider disc partway up) + a shallow `cylinder` cup recess at top. No moving parts.
- Candelabra: same stem/base as candlestick, but multiple curved arms — approximate curves with 2–3 short angled `cylinder` segments per arm, each ending in a small cup `cylinder`, radiating from a central shared stem.
- Hurricane/lantern: candle or LED pillar surrounded by a `cylinder` (transparent glass, open or vented top) on a flat `cylinder` base plate.
- None of these are directional — fully rotationally symmetric, so no `+Z` "front" convention needed.

**Colors & finishes**:
- Wax: white, ivory/cream, red, green, gold/bronze, black, pastel (spring/pink, blue), or dyed to match décor; finish usually matte/satin, sometimes a subtle sheen. Jar candle wax often slightly translucent near the glass.
- Holders: brushed/polished silver or brass/gold metal, matte black iron (farmhouse), clear or colored glass (amber, blue, smoked), ceramic/porcelain (white, glazed colors), natural or dark-stained wood (rustic pillar risers), rose gold (modern).
- Glass jars: clear, frosted, or tinted (amber, green, blue); often with a printed/wrapped label band.
- Seasonal color swaps: red/green (winter holidays), orange/black (Halloween), pastels (spring), white/cream (year-round formal).

**Placement**:
- Rests on a **COUNTER/surface**: dining table (centerpiece, candelabra or paired candlesticks), coffee table, mantel/fireplace shelf, side/end table, bathroom counter, kitchen counter, windowsill.
- **Built-in-adjacent**: fireplace mantel display is extremely common — cluster of 2–4 varying-height pillars/holders.
- Rarely floor-standing except large floor-lanterns or tall candelabra floor stands (height 800–1200 mm) in entryways — an optional tall "floor candelabra" variant.
- Not wall-mounted or ceiling-hung in the common case (wall sconces with candles overlap with the existing Light fixture `sconce` kind — better modeled there).
- Typical surface height context: dining/coffee table 400–750 mm, mantel 1100–1400 mm above floor.

**Active / interactive state**:
- Lit vs unlit is the whole "state": flame mesh visibility/scale toggled, plus a small emissive point-light glow and soft warm halo (reuse the fireplace flicker idiom — `Math.random()`-jittered emissive intensity per frame for a lit candle).
- A gentle **flame flicker** (scale + rotation jitter, low-amplitude, higher frequency than the fireplace's for a smaller flame) sells "lit."
- Optional soft blob-glow decal on the surface beneath (like the existing blob-shadow but warm-colored and additive) for lit candles at night preset.
- Wax level could optionally lower slightly over "burn time" — nice-to-have, not required; simplest correct behavior is binary lit/unlit.
- No real HA entity typically maps to a physical candle (unless bound to a `switch`/`light` standing in for a "candle mode" smart light or an LED flameless candle) — likely modeled as a **local-state-only decorative object** (`localState` on/off, matching the existing unbound-interactive-object pattern) rather than requiring an entity bind.

**Variations & customizations**: kind variants (`tealight`, `votive`, `pillar` [size slider], `taper` [single], `taper_pair` [two on one tray], `jar_candle`, `candlestick_holder` [empty or with candle], `candelabra` [3/5/7-arm], `hurricane_lantern`), holder material swatch (metal/glass/ceramic/wood) as a color/tint parameter, cluster presets ("3 pillars staggered heights on a tray") as a single custom-object recipe, flameless/LED candle variant (flame becomes a small emissive `sphere` bulb instead of a cone flame, no flicker or gentle low-amplitude flicker).

**Animation opportunities**:
- Idle (lit): flickering flame (scale/tilt/intensity jitter), soft light-radius pulsing, faint warm glow decal breathing.
- Idle (unlit): none — fully static, cheapest default state.
- Active/triggered: toggle click lights/extinguishes the candle (flame fades in/out over ~0.3–0.5 s rather than popping); could sync multiple candles in a candelabra to light in a quick staggered sequence (each arm ~150 ms apart) for a "someone just lit these" moment.
- Seasonal: swap wax/holder color by season/holiday preset if the app ever adds decorative theming.

[↑ Back to top](#table-of-contents)

---

## Tabletop picture frames and books

**Dimensions**:

*Picture frames (photo + border, standing on a shelf/desk):*

| Variant | Photo opening | Overall frame (w × h) | Frame depth (front-to-back) |
|---|---|---|---|
| Compact | 4×6″ → 102×152 mm | ~140×190 mm | 15–20 mm |
| Standard | 5×7″ → 127×178 mm | ~165×215 mm | 15–25 mm |
| Oversized | 8×10″ → 203×254 mm | ~240×290 mm | 20–30 mm |
| Square/instant (Polaroid-style) | ~86×86 mm | ~120×140 mm | 12–15 mm |

Frame border (mat + molding) is typically 18–30 mm wide all around. Most tabletop frames are portrait orientation with an integrated fold-out **easel back** kicked out ~15–25° from vertical (leans back), or occasionally landscape with the easel on the long edge. Overall standing height at the display surface ≈ frame height (portrait) since it leans; physical footprint depth on the table ≈ 60–90 mm (frame depth + easel kickstand).

*Books (stacked or standing as décor, not for reading):*

| Variant | Trim size (w × h) | Spine thickness |
|---|---|---|
| Novel / trade hardcover | 152×229 mm (6×9″) | 20–35 mm |
| Small gift/pocket book | 130×190 mm | 15–25 mm |
| Coffee-table book | 250×300 mm to 330×280 mm | 25–45 mm |
| Decorative stack (3 books) | varies | combined stack height 80–140 mm |

**Shape breakdown**:
- *Frame*: one flat **box** (the frame face, ~15–25 mm thick) with a thinner inset **box** slightly recessed and darker/lighter (the "photo" — flat-colored plane or placeholder texture) sitting proud of the back — i.e. frame = outer box, photo = inner box offset +front (local +Z) by a few mm, sized to the opening. A thin **box** easel leg hinges off the back bottom edge, angled back ~20° (model pre-angled as a static prop — no need for a real hinge joint).
  - Front face = local +Z, the photo-facing side.
  - Circular/oval frames: swap the outer box for a flattened **cylinder** (disc) with an inset disc primitive for the photo — no true boolean needed.
- *Books*: each book = one **box** (closed) — width × spine-thickness × height. A stack is 2–4 boxes of slightly varying footprint stacked in Y, each rotated a few degrees off-axis for a casual "tossed on the table" look. An "open book" variant: two thin flat boxes (pages) angled outward from a shared spine edge like a shallow V, optionally with a slightly domed thin box/plane on top of each half to suggest bulging pages.
- A bookend variant (small leaning stack) = same book boxes plus one vertical **box** or **L-bracket** (two boxes) at the stack end.

**Colors & finishes**:
- Frames: wood tones (walnut, oak, whitewash), matte black, brushed silver/gold metal, white-painted, and clear acrylic/glass block frames. Mat board inside is almost always off-white/cream/black.
- "Photo" fill: since it's a static prop, use a muted placeholder — soft warm beige/gray gradient-ish flat color, or a tiny painted scene blob; doesn't need to look like a real photo.
- Books: cloth or paper dust-jacket covers in saturated solid colors (red, navy, forest green, mustard, teal) or neutral (cream, charcoal) with a thin contrasting spine band (foil-stamped title look = a thin lighter box/decal on the spine). Coffee-table books skew glossy white/black with bold cover art blocks.

**Placement**: **Surface** props only — never floor or wall or ceiling. Rest directly on: side tables, console tables, desks, dressers, nightstands, bookshelves, mantels (with fireplace kind), coffee tables, kitchen counters/islands.
- Rest height = host surface top (same idiom as `mountable` furniture in Diorama: `elevation = host top`); typical surface heights already in the codebase — desk/table ~750 mm, nightstand ~550 mm, dresser top ~850 mm, mantel ~1200–1400 mm.
- Common groupings: a frame + small book stack + a plant/lamp clustered on one nightstand/console — good as a small multi-primitive "recipe" (custom object) rather than a single kind, since real rooms rarely show just one.

**Active / interactive state**: Pure décor — no HA entity binding expected, no power state. Nothing to animate as "in use." Optional cosmetic idea: vary the "photo" color per household as a light personalization touch, but not state-driven.

**Variations & customizations**: frame shape (portrait rectangle default, landscape rectangle, square, oval/circular, multi-opening with 2–3 small openings in one mat — one outer box with 2–3 inset photo boxes), frame finish (wood / black / white / metallic material swap), book stack (single book lying flat, 2–4 book stack, upright books leaning at an angle as if propped against a bookend or wall, open book), scale variant (mini frame/book cluster for a nightstand vs. a larger coffee-table-book stack as a coffee-table centerpiece).

**Animation opportunities**:
- Idle: none needed — static, zero-cost background props (no per-frame update), consistent with other small dressing objects.
- If ambient life is wanted: a rare "flip" micro-animation is NOT recommended (no plausible real-world trigger) — better to leave these fully static and let avatars' idle fidgets (`check_watch`, `glance`) or the `browse_bookshelf` anchor activity provide the only motion nearby. A bookshelf `browse_bookshelf` avatar could be posed reaching toward a book-stack prop, but the prop itself stays inert.

**Sources**: [Guide to Picture Frame Sizes | Frame Destination](https://www.framedestination.com/guides/sizes/picture-frame), [Standard Picture Frame Sizes | Frame USA](https://frameusa.com/pages/picture-frame-sizes), [Picture Frame Size Guide • Memory Box](https://memory-box.co.uk/blog/picture-frame-size-guide/), [Standard Book Sizes in Publishing?](https://reedsy.com/studio/resources/standard-book-sizes), [Standard Book Sizes & Dimensions | Blurb](https://www.blurb.com/book-dimensions), [Book size - Wikipedia](https://en.wikipedia.org/wiki/Book_size), [Hardback and Paperback Book Sizes 2025](https://imprintdigital.com/paperback-book-size/)

[↑ Back to top](#table-of-contents)

---

## Sculpture / figurine / decorative object

**Dimensions** (W×D×H mm, footprint always modest — this is a small-object category, not furniture):
- **Mini/shelf figurine**: 80×80×115–150 mm (the common 4–6 in curio/keepsake figurine)
- **Standard tabletop sculpture/statuette**: 150×150×200–380 mm (6–15 in decor pieces — the most common "console table centerpiece" size; interior-design rule of thumb is ~2/3 the width of the surface it sits on, but in practice most retail pieces cluster here)
- **Oversized/floor sculpture**: 300×300×600–1200 mm (statement floor pieces, abstract metal/stone sculptures, large ceramic urns-as-art)
- **Bookend pair** (functional sub-variant): each unit ~120×130×120–180 mm, placed in pairs ~250–400 mm apart to flank a row of books
- Base/plinth (if present) typically 15–30 mm thick, 10–20% wider than the figure's footprint

**Shape breakdown** (build as one static prop, low poly budget):
- **Base/plinth**: flat box or short cylinder, 15–30 mm tall — many tabletop sculptures skip this and sit directly on the surface.
- **Body**: the primary primitive depends on style —
  - *Abstract/modern*: 1–3 stacked/offset boxes, a twisted cylinder, or a sphere-cone combo (no literal "front" needed — safe to treat as symmetric, skip the front chevron).
  - *Figurative* (bust, animal, human figure): a sphere (head) + cylinder or tapered cylinder (torso/body) + small cone or box accents (arms/base details) — orient the "face"/visual front toward local **−Z** like other placed objects.
  - *Vessel-as-art* (large decorative bowl/urn treated as sculpture rather than functional vase): a lathe-like stack of cylinders/cones (wide cylinder body, narrow cylinder neck, flared cone rim).
- **Bookend variant**: an L-shaped pair — vertical box (the upright, ~150 mm tall) + horizontal box foot (~120 mm deep) per side, with a small decorative sphere/animal-cone shape mounted on or replacing the upright's top.
- No moving parts — treat as a single rigid static group (like `rug`, no blob shadow needed for wall/shelf-mounted pieces, but floor-standing oversized sculptures should get the standard furniture blob shadow).

**Colors & finishes**:
- Materials: bronze/gold-tone metal (warm amber-brown, `#8a6a3a`-ish, slightly emissive glint), matte ceramic/porcelain (white, cream, black, pastel glazes), polished stone/marble (white/grey with subtle vein tint — hard to fake with flat toon shading, just pick light grey), resin/plaster (matte off-white or hand-painted multi-color folk-art pieces), natural wood (carved), brushed steel/chrome (cool grey, higher specular band).
- Popular finish families: matte solid color (most common, easiest to render), metallic gold/bronze/silver, black-and-white contrast (abstract art pieces), terracotta/earthy glaze.
- A single flat `_mat()` toon color per primitive is sufficient; metals can get a slightly desaturated lighter gradient step to read as "shiny" without a PBR path.

**Placement**:
- **Surface** (primary use case): console tables, side tables, coffee tables, bookshelves, mantels, dressers, entry tables — `mountable: true` against a `surface` host piece, same auto-snap-to-top mechanic as `coffee_maker`/`toaster`.
- **Floor**: oversized statement sculptures sit directly on the floor in entryways, living rooms, or corners — free placement, standard blob shadow.
- **Wall**: less common but valid — small wall-mounted relief plaques/masks, flush-mounted like a picture frame at eye height (~1500–1700 mm).
- Rooms: living room, entryway/foyer, office/study, dining room (centerpiece), bedroom (nightstand-scale figurines).
- No HA entity binding is expected for a pure decor object — a **static, unbound `Furniture`/custom-object kind** (like a rug or bookshelf), not an interactive fixture.

**Active / interactive state**: None inherent — passive decor with no power/occupancy state. Two soft options if a "liveliness" pass is wanted:
- Seasonal reskin (swap color/props via a `seasonal` prop — e.g. a bust wearing a tiny santa hat in December), purely cosmetic, no HA binding.
- If placed near a light fixture, it could catch the room's ambient/emissive glow like any other prop, but should NOT carry its own on/off state.

**Variations & customizations** (good sidebar/recipe options): style (abstract/modern, figurative/bust, animal figurine, vessel/urn-as-art, folk-art painted, bookend pair), size (mini/shelf, standard/table, oversized/floor), finish (matte ceramic, metallic gold/bronze, polished stone/marble, painted resin), mount type (freestanding surface, floor-standing, wall-mounted relief). Since this is exactly the shape of the existing **custom object / recipe system** (`ObjectRecipe`: box/cylinder/sphere/cone primitives, optional `surface`/`mountable`), decorative sculptures are a natural first-class use case for the Custom Objects editor rather than a new hardcoded `FurnitureKind` — a user could sculpt their own from primitives directly in the sidebar.

**Animation opportunities**:
- **Idle**: essentially none — real sculptures don't move; at most a very slow, subtle ambient sheen/rim-light pulse on metallic finishes tied to the day/night lighting preset (not per-object animation).
- **Active**: none in the literal sense; if desired, a one-off "dust mote"/sparkle particle drifting past a prized piece, or a tiny camera-facing highlight glint when a light turns on nearby — purely decorative flourishes, no functional state to animate.
- Best treated as a zero-animation prop: its value to Diorama is purely spatial/visual richness (fills empty shelf/table space believably), not interactivity.

[↑ Back to top](#table-of-contents)

---

## Floating wall shelf with decor

**Dimensions** (shelf board itself, W × D × H):
- Compact/accent: 300–450 mm W × 200–260 mm D × 30–50 mm H (e.g., IKEA LACK 30×26 cm)
- Standard: 600–900 mm W × 240–300 mm D × 38–50 mm H (10″ depth is the most common "sweet spot")
- Long/statement (over sofa/bed): 1100–1900 mm W × 260–300 mm D × 38–50 mm H (IKEA LACK runs up to 74¾″×10¼″ ≈ 1900×260 mm)
- Bathroom variant: shallower, 150–200 mm D
- Board thickness alone: typically 25–65 mm (1–2.5″); slab-style "floating" shelves read visually thicker (40–65 mm) than thin ledges (20–25 mm)
- Mount height: eye-level display ~1400–1700 mm off floor; kitchen open-shelving ~1350–1500 mm; grouped sets often stagger 3 shelves ~250–300 mm apart vertically

**Shape breakdown**:
- Core shelf = one flat **box** (W × D × thickness), front face = local +Z edge (the exposed long edge facing the room).
- Optional under-shelf shadow gap: render the box slightly proud of the wall plane (a few mm) to sell the "floating" bracket-hidden look; no visible bracket needed (concealed-mount is the point of the style).
- Decor items sit as small child primitives positioned along the top face (local Y = board top), inset ~15–30 mm from the front edge so nothing overhangs:
  - **Books** — stacked/leaning thin boxes (varied widths/colors), optionally one row upright + one stack lying flat.
  - **Small potted plant** — cylinder or tapered box pot + sphere/blob "foliage" cluster (a few offset spheres read as leaves cheaply).
  - **Picture frame** — thin box (frame) + slightly recessed thinner box (photo/mat), can lean against wall behind shelf or stand via a small box "easel foot."
  - **Vase/jar** — cylinder body, optionally cone or sphere-cap neck taper.
  - **Decorative box/candle** — small box or cylinder, candle gets a thin cylinder wick + small cone/sphere "flame" (for lit variant).
  - **Trinket/figurine** — a small sphere+box abstraction is fine at this scale (decor doesn't need detail, just silhouette + color).
- No moving/openable parts on the shelf itself; only optional decor swaps.

**Colors & finishes**:
- Shelf board: white, black/black-brown, natural oak/birch, walnut, matte black metal, or floating "invisible" glass; finishes are matte laminate, painted MDF, stained wood grain, or powder-coated metal.
- Decor palette is intentionally varied/eclectic per item (book spines multicolor, plant pot terracotta/white/black, frame black/gold/natural wood, vase ceramic white/blue/earth-tone) — a great candidate for per-item color randomization to sell "personalized" decor.

**Placement**:
- **WALL**-mounted (concealed bracket/cleat system — no visible hardware), typically in living rooms (above console/sofa), bedrooms, home offices (above desk), kitchens (open shelving instead of upper cabinets), hallways, and bathrooms.
- Mount height 1350–1700 mm is the standard band; groups of 2–3 shelves stagger vertically ~250–300 mm apart.
- Decor objects rest ON the shelf's top face (treat the shelf as a `surface`/mountable host in Diorama terms, same idiom as counters — small decor pieces are `mountable` children, not floor-anchored).

**Active / interactive state**:
- Not entity-bound in the traditional HA sense, but a natural pairing: a **smart candle / small lamp accent** or LED strip tucked under the shelf lip bound to a `light.*` entity — glow toggles on/off, matches the existing light-fixture animation language (emissive bump + soft pool of light on the wall behind/below).
- Could optionally reflect a bound `sensor.*` (e.g., a small photo-frame "digital frame" swaps tint) but this is a stretch feature, not core.
- Seasonal dressing: swap decor set (pumpkin in fall, small tree/ornaments in winter, flowers in spring) — purely cosmetic variant swap, no live binding needed.

**Variations & customizations**: size (compact / standard / long/statement), material/finish (wood-tone, painted white/black, metal, glass), mount style (single ledge, stacked set of 2–3 staggered, L-shaped corner shelf), decor loadout presets ("books & plant", "photo display", "minimalist single vase", "kitchen jars & mugs", "bathroom towels & candle"), shape variant (standard rectangular, rounded-corner, hexagonal/geometric novelty shelf).

**Animation opportunities**:
- Idle: none needed for the shelf itself (static, wall-mounted); a subtle idle could be a plant's foliage sphere doing a very slow scale/sway breathing loop, or a candle-flame cone/sphere flicker (reuse the fireplace flicker idiom: per-frame `Math.random()` on emissive intensity).
- Active: bound accent light glow on/off (reuse light-fixture pool-glow pattern); could bump a tiny dust-mote/sparkle sprite when a bound "someone's home" trigger fires nearby, echoing the recent-trigger thought-bubble system.
- Seasonal swap: crossfade or instant-swap the decor prop set on a schedule/time-bucket, similar in spirit to time-of-day scene presets already in the codebase.

[↑ Back to top](#table-of-contents)

---

## Tapestry / wall hanging / macrame

**Dimensions** (W × depth × H, mm; depth is nominal "hang-off-wall" thickness, not fabric — treat as a thin proud slab/rope mass):

| Variant | Width | Height | Notes |
|---|---|---|---|
| Small tapestry | 660–1020 mm | 460–660 mm | dorm/entry size, ~26–40 in wide |
| Standard tapestry | 1520 mm | 1020–1300 mm | 60×40 in / 60×51 in, most common "bed backdrop" size |
| Large tapestry | 1830–2030 mm | 1220–1730 mm | 72×48 in / 80×68 in, living-room scale |
| XL tapestry | 2640 mm | 2240 mm | 104×88 in, oversized feature wall |
| Small macrame | 250–400 mm | 330–460 mm | single accent piece (e.g. 13″×10″) |
| Medium macrame | 1000–1450 mm | 890–1000 mm | over-sofa/headboard scale |
| Large macrame | 760–1930 mm | 560–2240 mm | statement pieces, can run very long/narrow (e.g. 30″×88″) |
| Depth (all) | — | — | flush fabric ≈ 20–40 mm proud of wall; macrame with dowel/rings + fringe ≈ 60–120 mm proud |

**Shape breakdown**:
- Core: one thin **box** (the fabric/fiber field) — `w × depth(30) × h`, positioned with its back face flush against the wall plane, front face (local **+Z**, facing into the room) carries the pattern/texture.
- **Top hanger**: a thin horizontal **cylinder** (wood dowel or metal rod, diameter 15–25 mm, length = fabric width + 40–80 mm overhang each side) spanning just above the fabric top edge; tapestries often skip this (rod-pocket sleeve implied, or just pins/tacks — cylinder optional/hidden).
- **Hanging cord** (macrame only): 2 short thin **cylinders** angled outward from the dowel ends up to a single wall-mount point (or omit — cosmetic, low priority).
- **Fringe/tassels** (macrame): a row of thin vertical **cylinders** (or a single skirt-shaped box with a jagged bottom texture) along the bottom edge, extending 100–500 mm below the main field depending on size — the single most identity-defining shape cue for macrame vs. flat tapestry.
- **Woven texture/knot pattern**: not geometrically modeled — bake into a tiled canvas/normal-style texture on the front face (diamond lattice for macrame, printed motif/photo/pattern for tapestry).
- No moving/openable parts — it's a static flat hang.

**Colors & finishes**:
- Tapestry: printed cotton/polyester-blend — mandala/boho prints (jewel tones: purple, teal, orange, gold), celestial (navy + gold/silver), nature/botanical (greens), pop-culture/art prints (full color), minimalist solid-with-print-border.
- Macrame: almost always **natural undyed cotton rope** (cream/off-white, `#EDE4D3`-ish) — occasionally dip-dyed pastel or earth-tone (terracotta, sage, rust) at the fringe ends; wood dowel = light natural or dark walnut.
- Finish is matte/fibrous either way — no gloss/specular; a toon material reads fine with a slightly warm base tone.

**Placement**: **WALL**-mounted only (nail/hook/pushpin, occasionally a curtain rod). Common rooms: bedroom (headboard-scale, behind/above the bed), living room (above sofa/media console), dorm/studio (any large blank wall), boho-styled entryways/nurseries. Typical hang height: **top edge 2000–2300 mm** off floor (roughly picture-rail height, or immediately above furniture-back height — e.g. ~150–250 mm above a sofa top / headboard top); bottom edge (with macrame fringe) can reach down to ~1200–1500 mm. Always flush against a wall face (offset = wallT/2 + ~15–40 mm), never freestanding.

**Active / interactive state**: no HA-bindable state in the typical sense (pure decor, no entity). If a slot is wanted: a `localState`-style "on/off" purely cosmetic toggle (e.g. swap print), or tie to a **light fixture behind/near it** for an uplit/backlit effect at night — but there's no real-world powered variant. Best treated as **static decor**, occasionally with a subtle idle animation for liveliness rather than a "state."

**Variations & customizations**: size tier (small / standard / large / XL), style/print family (mandala, celestial, botanical/leaf, geometric/Aztec, solid-color-minimal, photo/art-print, macrame-plain, macrame-dip-dyed, macrame-with-wood-ring — a circular frame variant swaps the box field for a flat **cylinder/disc**), shape variant (rectangular tapestry default vs. tall-narrow runner macrame column e.g. 300×2200 mm vs. circular hoop macrame), fringe length (none / short 100 mm / long dramatic 400–500 mm), color/tint parameter exposed like other fixtures (base hex).

**Animation opportunities**:
- **Idle**: very slow, low-amplitude sinusoidal sway of the bottom edge/fringe (simulate air currents) — displace lower vertices or tilt the whole piece ±1–2° about the top hanger axis on a slow sine (period ~4–6 s), stronger on the fringe cylinders than the rigid field.
- **Idle**: gentle fringe-strand independent phase offsets (each fringe cylinder swaying slightly out of sync) for a fibery, tactile feel — cheap since they're separate primitives.
- **Active/triggered**: a one-shot "ruffle" ripple (localized wave pulse traveling down the fabric) if a nearby door/window opens (draft cue) — optional flourish, not required.
- **Seasonal/contextual**: swappable print texture set (warmer palette in evening lighting preset, or a seasonal print swap) purely as a texture change, no geometry change.
- No occupancy/interaction animation needed — nobody "uses" a tapestry; keep motion purely ambient/atmospheric.

[↑ Back to top](#table-of-contents)

---

## Table centerpiece and faux floral arrangement

**Dimensions**:

| Variant | Diameter/Width × Depth × Height |
|---|---|
| Compact (bud vase / single stem) | 80–120 mm dia × 150–250 mm H |
| Standard dining centerpiece (bowl/vase + florals) | 250–350 mm dia × 300–450 mm H |
| Oversized/formal (banquet, wedding-style) | 350–500 mm dia × 450–700 mm H |
| Low/horizontal "runner" style (doesn't block sightlines) | 400–700 mm L × 150–250 mm W × 150–250 mm H |
| Seasonal wreath-base bowl centerpiece | 300–450 mm dia × 150–250 mm H |

Rule of thumb (event/floral design guidance): centerpiece height for a seated dining table should stay under ~350 mm OR clear ~450 mm (so guests can see over or under it) — the "low or tall, never eye-level" convention. Base vessel diameter is typically 25–35% of the table's width.

**Shape breakdown** (front face = symmetrical, no true "front" — but +Z can anchor a signature bloom or bow for label-facing consistency):
- **Base/vessel**: cylinder (round vase/bowl, most common) or box (rectangular trough/lantern base) — radius 100–175 mm, height 80–200 mm depending on vessel type.
- **Filler mass** (foam/floral base sitting in/above vessel rim): a squashed sphere (scale.y ≈ 0.5–0.6) sitting at vessel-top height, radius roughly matching vessel radius — the "green mass" the stems appear to emerge from.
- **Stems/greenery**: 6–14 thin cylinders (radius 3–6 mm, length 100–250 mm) angled outward/upward from the filler-sphere center at varied rotations (rotate.x/z randomized ±20–35°) — cheap, reads as sprigs/foliage from a distance.
- **Blooms**: small spheres (radius 15–35 mm, flattened scale.y ≈ 0.4–0.6 for open flowers like roses/peonies) or clusters of 4–6 tiny spheres bunched (hydrangea look) at stem tips; mix 2–3 sizes for visual variety.
- **Accent leaves**: flattened boxes (thin, 2–3 mm thick, 30–60 mm long) angled off stems, or skip for a stylized/low-poly look.
- **Optional candles** (candle-and-floral combo centerpieces): 1–3 cylinders (radius 15–20 mm, height 100–200 mm) rising from the filler mass, each with a small cone or teardrop-sphere "flame" primitive on top (emissive orange, ~10–15 mm) — a common real-world hybrid style.
- Overall silhouette should read as: cylinder base → squashed sphere mass → radiating thin cylinder stems → sphere blooms, optionally + candle cylinders.

**Colors & finishes**:
- **Vessel**: clear/frosted glass, matte ceramic (white, black, terracotta), brushed metal (gold, silver, copper), woven rattan/wicker (natural tan), or mercury glass (silver mirrored).
- **Florals (faux)**: seasonal-neutral greens/whites (eucalyptus, hydrangea, ranunculus) for everyday; saturated seasonal palettes for holidays (red/gold for winter, pastel for spring, orange/burgundy for fall, white/green for weddings).
- **Popular real product finishes**: velvet-textured petals, silk stems, "real touch" latex petals (matte, slightly glossy highlight), preserved/dried look (muted tan, taupe, dusty rose, pampas-grass beige).
- Stylized-game render: keep 2–3 flat toon-shaded colors per bloom cluster (e.g., cream + sage + one accent) rather than photoreal gradients.

**Placement**:
- Rests on a **SURFACE**: dining table, console table, coffee table, kitchen island, entry table, or buffet/sideboard top.
- Typical surface heights it sits on: dining table ~740 mm, coffee table ~400–450 mm, console/entry table ~850–900 mm, kitchen island ~900–920 mm — centerpiece origin should be placed at host-surface top (mountable/surface-attached, like the existing `coffee_maker`/`toaster` recipe pattern), centered on the table unless flanked by a candle pair (then offset a matched pair symmetrically).
- Most common room: dining room and kitchen (table/island); secondary: living room (coffee table), entryway (console table).

**Active / interactive state**:
- Static object — no powered state in itself, but real-world variants often pair with an LED tea light or programmable candle (battery-powered flicker) tucked in the arrangement — could bind to a `light.*`/`switch.*` entity for a flicker/glow animation (reuse the existing fireplace-flicker `Math.random()` idiom on emissive intensity).
- Seasonal swapping is the main "state change" a user would want: swap flower-color set / add pinecones-and-berries (fall) / ornaments (winter) / pastel blooms (spring) — best modeled as **kind variants** rather than live animation.
- No door/lid/moving mechanical part.

**Variations & customizations**: vessel style (round vase / low bowl / rectangular trough / lantern / tiered stand), height class (low, dinner-table-safe <350 mm / tall, statement >450 mm / runner, horizontal with multiple small clusters along table length), floral theme (everyday greenery, seasonal spring/summer/fall/winter/holiday, monochrome, wildflower/loose, formal rose/peony), with/without integrated candles, material tier (glass/ceramic formal vs rattan/wood farmhouse vs metal modern).

**Animation opportunities**:
- **Idle**: extremely subtle sway/bob (amplitude ~2–3 mm, slow sine) on individual bloom spheres to suggest a faint air current — good cheap "alive" detail without full physics; stems stay rigid to avoid looking rubbery.
- **Seasonal transition**: cross-fade or swap the bloom-color palette on a schedule (e.g., tied to a virtual calendar/season setting) — same geometry, recolored materials, no rebuild cost.
- **Active/candle variant**: flickering emissive flame cones/point-light intensity jitter (fireplace idiom) if bound to a smart candle entity's on/off state.
- **Interaction highlight**: on select/hover in the editor, a soft outline-shell pulse (matching the existing inverted-hull outline system) rather than any "functional" animation, since this is a decorative-only fixture with no HA entity binding in the typical case.

[↑ Back to top](#table-of-contents)

---

## Decorative fairy / accent string lights

**Dimensions**:
- Bulb/LED head: micro-LED "water-droplet" bead ≈ 3–6 mm diameter; larger globe-style ("G40"/"G50") decorative bulbs run 40–50 mm diameter (round Edison-style globes, less common indoors).
- Bulb spacing along the wire: ~100 mm (≈4 in) is the de-facto industry standard (range 90–130 mm depending on product); loose "fairy" spacing on light-count/length ratios (e.g., 50 LEDs / 5 m, 100 LEDs / 10 m) works out to the same ~100 mm pitch.
- Wire gauge: ultra-thin flexible copper or silver-coated copper, ≈1–1.5 mm diameter — visually near-invisible at scale, reads as a thin dark/silvery line more than a cylinder.
- Common overall lengths (straight strand, uncoiled): compact 2 m/20 LEDs (~79 in), standard 5 m/50 LEDs, long 10 m/100 LEDs, extra-long 16–33 ft (≈5–10 m) versions.
- "Curtain" variant: a horizontal top wire ~2.4 m (8 ft) wide with 10–20 vertical drop-strands each ~1.5 m (5 ft) long, LEDs every ~150–200 mm along each drop — reads as a rectangular glowing curtain rather than a single garland.
- Battery pack (when present): small rectangular box ≈ 50 × 20 × 6 mm with a slide switch, usually tucked out of sight.

**Shape breakdown** (stylized/buildable approximation — real-world detail is far too fine for game-primitive fidelity):
- **Wire**: one thin tube/spline — either a single thin cylinder chain following a sagging catenary curve (draped swag) or a simple polyline following a fixed surface (wrapped around a headboard rail, threaded through a window frame, coiled around a mirror edge). No need for true rope-physics; a few fixed control points per placement context is enough.
- **Lights**: small spheres (or tiny octahedra/tetrahedra for a "sparkle" look) spaced evenly along the wire spline, each an emissive material. Model as a fixed count (e.g., 8–16 "lit points") rather than literally hundreds — a repeated primitive array along the curve.
- **Front face**: not applicable in the usual sense — orient the strand's "face" as whichever side the bulbs point outward from the mounting surface (e.g., away from the wall for wall-drape, downward for ceiling-hung curtain style).
- **Optional accessories to bundle as one recipe**: a small battery-box box primitive at one end (if unbound/no visible power source needed), or a mason-jar/vase (cylinder + narrow neck cylinder) if modeling the popular "lights-in-a-jar" centerpiece variant.
- **Moving/openable parts**: none mechanically — the only "moving" part is the light state itself.

**Colors & finishes**:
- Warm white (≈2700–3000K, the overwhelming majority default) and cool/pure white are most common; multi-color (RGB) strands exist for party/seasonal use.
- Wire finish: bare copper (warm coppery-brown), silver-coated copper (bright silvery), or green/black rubber-jacketed wire (outdoor-rated, patio strings).
- Bulb color when unlit: clear/frosted translucent plastic bead, near-invisible against the wire until lit.
- Seasonal palette variants: red/green (Christmas), orange (Halloween/fall), pastel multi (spring/birthday).

**Placement**:
- Indoor: draped along a **bedroom headboard or wall** above/behind the bed, wound around a **mirror or window frame**, coiled inside a **glass jar/vase** as a tabletop centerpiece (COUNTER/surface-resting), strung along a **mantel** alongside other mantel décor, hung as a **curtain** in front of a window or doorway (WALL/CEILING-mounted top rail), wrapped around **stair railings** or a bookshelf.
- Outdoor: strung along a **patio pergola/gazebo edge** or fence line (WALL/structure-mounted, catenary swag), wound up **porch railings** or tree trunks/branches (wrap-around).
- Typical mounting heights: headboard drape sits roughly 900–1400 mm off the floor (bed-height dependent); window/mantel drape follows the window or mantel's own height (typically 750–2100 mm); ceiling-hung curtain style clips to a rod usually 2000–2400 mm up; jar centerpiece sits on a counter/table surface (≈750–900 mm).
- Classify as WALL-adjacent decoration (draped) or CEILING-hung (curtain) or COUNTER-resting (jar) depending on the specific preset chosen — no floor-standing variant is typical.

**Active / interactive state**:
- Binary visible change: **off** = dim/invisible beads on a thin wire; **on** = each bead emissive/glowing, plus a soft ambient light-pool glow around the whole strand (much softer/smaller than a real fixture — think ambient accent, not room lighting).
- If bound to an HA `light.*` entity: brightness attribute could scale the emissive intensity/glow radius; color-capable strands could tint the emissive color.
- Seasonal/contextual: could auto-tie to time-of-day (dusk/evening) like Diorama's other ambient lighting, echoing real-world usage (fairy lights are almost always evening/night décor).

**Variations & customizations**: style (draped swag [headboard/mantel], wrap [mirror/railing/tree], curtain [window/doorway], jar/vase centerpiece), color temperature (warm white default / cool white / multi-color RGB), wire finish (copper / silver / green outdoor-rubber), density/length (compact short accent / standard / long-curtain many bulbs — mainly affects bulb-count-along-spline and spline length, not model complexity), bulb style (micro/water-droplet default, subtle vs larger globe G40-style, more visible individual bulbs, novelty/patio look).

**Animation opportunities**:
- **Idle (powered on, steady)**: gentle per-bulb emissive flicker/twinkle — offset random-phase pulsing per bead (cheap: sine wave with per-bulb phase offset, same idiom as the fireplace flicker) so the strand doesn't look static.
- **Idle (off)**: fully static, dim/translucent beads.
- **Active/interactive**: on HA toggle, ease emissive intensity 0→target (soft fade-in/out rather than a hard pop) — mirrors how the fireplace and other emissive fixtures already ease state.
- **Mode variety** (real fairy-light controllers commonly offer these — worth mimicking visually if the entity/attribute is available): steady-on, slow twinkle (few random bulbs fade in/out), full twinkle (all bulbs sparkle), chase/sequence (a moving lit segment along the strand), slow fade (whole strand breathes brightness up/down).
- **Seasonal color cycle**: for RGB variants, a slow hue drift or a fixed seasonal palette swap could be a nice low-cost differentiator from a plain static-white strand.

[↑ Back to top](#table-of-contents)

---

## Seasonal decor — wreath, garland, Christmas tree

**Dimensions**:

| Item | Variant | Width × Depth × Height (mm) |
|---|---|---|
| Wreath | Compact (door accent) | 460 dia × 100 deep (flat ring) |
| Wreath | Standard (24″) | 610 dia × 100 deep |
| Wreath | Oversized (36″) | 915 dia × 130 deep |
| Garland | Mantel/stair strand | 150–400 dia (bundle cross-section) × 2700 length (9 ft, most common retail length) |
| Garland | Short accent | 1200–1800 length |
| Christmas tree | Tabletop/mini | 300–450 dia base × 600–900 tall |
| Christmas tree | Compact (4–5 ft) | 750–900 dia base × 1200–1500 tall |
| Christmas tree | Standard (6–7 ft, most popular) | 1050–1200 dia base × 1800–2130 tall |
| Christmas tree | Oversized (9 ft+) | 1500–1700 dia base × 2740+ tall |

Rule of thumb tree silhouette: base diameter ≈ 55–65% of height (cone tapers to a point/star). Wreath standard sizing: ~300 mm (12″) narrower than the door it hangs on.

**Shape breakdown**:
- **Wreath**: a torus is ideal if available; if primitives are limited to box/cylinder/sphere/cone, approximate with a short flattened **cylinder** (outer dia minus a same-height inner cylinder boolean), or a thick ring built from 8–12 small **sphere**/short-**cylinder** "sprigs" arranged in a circle, plus a **box** or small bow-shaped cluster of flattened boxes at the bottom or top (the bow) as the "front" accent. Front face = the side facing away from the door/wall (+Z), where the bow sits.
- **Garland**: a chain of overlapping **spheres** or short fat **cylinders** (150–250 mm dia) strung along a path (straight for mantels, helical for stair rails/tree wrap) — cheap version is a single tapered **cylinder** bent via multiple straight segments following the banister/mantel edge, tinted green with sparse tiny sphere "berries"/light dots.
- **Christmas tree**: a stack of 3–5 **cones**, each shorter and narrower than the one below (classic layered-cone silhouette), on a **cylinder** trunk stub and a **box** or short **cylinder** tree-stand/skirt base (300–450 mm dia, 150–250 mm tall). Optional single unbroken large cone for a low-poly variant. Front face is irrelevant (radially symmetric) — orientation only matters for a directional feature like a star topper or lopsided ornament placement. A small **cone** or flattened star (extruded box star, or an octahedron-like sphere) tops it.
- Ornaments/lights: small **spheres** (20–60 mm) scattered on the cone surfaces at a jittered-but-deterministic pattern; a topper (star **cone**-pair or box-star) at the apex.

**Colors & finishes**:
- Wreath: matte deep green (pine/fir) base, red velvet bow (classic) or gold/burlap/white (modern/farmhouse); frosted/flocked (white-tipped) variant common.
- Garland: matte green pine/fir or flocked white; often threaded with small warm-white or multicolor light dots and metallic gold/red/silver ball accents; ribbon variant in red/gold/plaid.
- Christmas tree: matte deep green (traditional), flocked/frosted white-green, all-white "winter" tree, or black/silver "designer" tree; trunk/stand hidden by a tree skirt (fabric box/cylinder, red-and-white or plaid) or a plain metal stand (dark cylinder). Ornaments in red/gold/silver/blue globes; topper gold/silver star or angel silhouette.
- Common toon-shader palette: `#1d5c33` (pine green), `#0d3b1f` (shadow green), `#c41e3a` (classic red), `#d4af37` (gold accent), `#f2f2f2` (flocked white).

**Placement**:
- Wreath: WALL-mounted, typically front door or above a mantel/fireplace, hung center at ~1500–1700 mm (eye level) via a hook; can also be an interior wall accent.
- Garland: WALL/mantel-mounted (draped along a mantel edge at mantel height, ~1100–1200 mm) or wound around a stair railing/banister (following the rail's slope) or door/window frame; occasionally floor-adjacent as a tree-base wrap.
- Christmas tree: FLOOR-standing, corner or near-window placement typical, base center resting at floor level (y=0), full footprint needs ~1.2–1.7 m clearance radius from other furniture for the branch spread.
- Tabletop tree variant: COUNTER/surface-resting (mountable, like `coffee_maker`), on an entry table, mantel, or sideboard.

**Active / interactive state**:
- All three are typically **unbound** decor (no HA entity) but can optionally bind to a `light.*` string-lights entity for the tree/garland — when ON, ornament/light spheres switch to emissive material + a soft point-light glow; when OFF they render as dim unlit spheres.
- Animation-friendly "twinkle": per-frame pseudo-random emissive intensity flicker on a subset of light-dot spheres (same idiom as the fireplace flicker), independent of any bound entity, purely for ambiance — always-on twinkle regardless of binding gives a lively look without needing a real light entity.
- Seasonal: these pieces would logically only be toggled visible/hidden by a `Furniture`-style seasonal flag or just placed/removed by the user each season — no persistent state needed beyond presence.

**Variations & customizations**:
- Wreath: size (compact/standard/oversized), bow style (velvet bow / no bow / burlap / plaid), flocked vs. plain green, add string-lights toggle.
- Garland: length (short accent / 9 ft mantel-stair / long multi-run), flocked vs. plain, lit vs. unlit, with/without ribbon weave.
- Christmas tree: height tier (tabletop/compact/standard/oversized), shape fullness (narrow/full/extra-full — adjust cone radii), flocked/white/black finish, pre-lit vs. unlit, topper style (star/angel/none), with/without tree skirt, ornament density slider.
- Generic "seasonal swap": same rig could reskin for other holidays (swap green/red palette + topper for other seasonal motifs) if the recipe system supports palette overrides.

**Animation opportunities**:
- Idle: gentle twinkle flicker on light-dot spheres (independent random emissive pulsing, low amplitude); a very subtle sway/rotation on hanging ornament spheres (small pendulum arc) for liveliness.
- Idle: slow ambient rotation of a rotating tree-stand variant (novelty "rotating Christmas tree" stands exist — optional fun toggle spinning the whole tree slowly about Y).
- Active (bound light entity ON): brighten all light-dot emissive intensity, add a soft point-light source at tree center / garland midpoint; OFF fades to dim matte.
- Interaction: click-toggle (like a switch fixture) could flip a purely-local `localState` powering the twinkle/glow even with no HA entity bound, matching the "local control of unbound interactive objects" pattern already used for fireplaces/lights.
- Seasonal appearance: an optional snow-accumulation dusting (lightened top-facing surfaces / small white sphere clusters) could be layered onto branch tips for a "just snowed" look, toggled by a scene/weather flag rather than animated per-frame.

[↑ Back to top](#table-of-contents)

---

## Wall-mounted plant / shelf greenery

**Dimensions** (variants span three distinct object types — pick per-instance):

| Variant | W × D × H (mm) | Notes |
|---|---|---|
| Ceramic wall-pocket planter | 150–230 × 75–190 × 150–200 | Single half-cone/teardrop vessel, flat mounting back |
| Floating shelf w/ potted plants | 400–900 × 200–300 × 20–40 (shelf slab) | 24″/600 mm is the most common width; 150–300 mm depth |
| Macrame-hung planter | pot Ø 150–380, cord drop 400–1100 | Hangs from ceiling or a wall bracket, not floor-supported |
| Modular living-wall panel | 600–900 × 50–75 × 500–900 | Grid of 6–12 pockets, ~150–250 mm pocket pitch |

**Shape breakdown** (build as one `Furniture`/custom-object recipe per variant; local +Z = front, wall-mounted so front faces into the room):
- **Wall-pocket planter**: one tapered `cylinder` (or half-cone: `cone` with top radius > bottom, clipped by placing behind the wall plane) for the vessel body, flattened on the −Z (wall) side — cheapest approximation is a `box` (flat back, 20 mm deep) fused with a `cylinder`/`sphere` bulging toward +Z for the pot belly. 1–3 `sphere`/blob-cluster primitives above the rim for foliage (scaled non-uniformly, slightly randomized per-instance seed for variety), a couple of thin flattened `cylinder`s or tapered `box`es as trailing leaves/vines drooping below the pocket for trailing species (pothos, string-of-pearls).
- **Floating shelf**: one thin `box` slab (bracket hidden inside wall), 2–4 small pot groups on top — each pot = small `cylinder` (tapered, terracotta/ceramic) + a foliage cluster of 2–4 `sphere`s or a single tall thin `cone`/`cylinder` bundle for upright plants (snake plant, ZZ plant profile). Vary pot heights/positions along the shelf so it doesn't read as a repeated row.
- **Macrame hanger**: pot = tapered `cylinder`; foliage = spilling `sphere` cluster + 3–6 thin drooping `cylinder`/curve-approximated segments (a few short chained cylinders angled progressively downward reads better than one long thin cone) representing trailing vines below pot rim; the hanger cords themselves are 3–4 very thin `cylinder`s converging from a ceiling/wall-bracket point down to the pot rim (cosmetic only, no physics).
- **Modular living-wall panel**: flat backing `box` (thin, ~50–75 mm deep) flush to wall, with a grid of small pocket recesses (implied by placing small `cylinder`/`box` "pot cup" primitives proud of the panel face at regular pitch) each topped with a foliage `sphere` cluster — vary foliage scale/color per cell for a natural look, don't tile identically.
- No moving/openable parts on any variant — passive dressing, not a mechanism.

**Colors & finishes**:
- Vessel/pot: terracotta orange-brown, matte white/cream ceramic, charcoal/black matte, concrete grey, natural rattan/wicker tan, galvanized/brushed metal, or woven-macrame cord in natural jute/off-white/black cotton.
- Shelf slab: matches furniture wood tones (walnut, oak, white oak, black-painted MDF) or white/black powder-coat metal bracket-shelf combos.
- Foliage: standard leaf greens (mid-green, deep green, silvery-sage for succulents/air plants, variegated white-green for pothos), occasional trailing vine color variety.
- Living-wall panel backing: black or dark-green felt/plastic (visually reads as a dark grid ground so foliage pops), or a plain painted board.

**Placement**: WALL-mounted (all variants) or ceiling-hung (macrame). Typical mounting height: eye-level to slightly above, **1400–1800 mm** to shelf/pocket bottom in living rooms and hallways; kitchen herb shelves often lower, **1100–1400 mm** (near a window); bathroom wall-pockets **900–1200 mm**. Macrame hangers: cord attachment (ceiling hook or wall bracket) at **1900–2300 mm**, pot bottom typically drops to **1200–1600 mm** so it clears head height but still reads as "hanging." Common rooms: living room, kitchen (near window/sink), bathroom, home office, entryway/hallway, bedroom. Never floor-resting or surface-mounted on furniture — this item's whole identity is the wall/ceiling attachment.

**Active / interactive state**: Static decor — no HA entity typically binds to it (not a smart device). Optional nice-to-have: bind to a `light`/`switch` entity representing an integrated LED grow-light strip in a living-wall panel (rare but real product category) — when on, add a soft warm/violet (grow-light) glow emissive on the foliage tips. Otherwise the only "state" is cosmetic/seasonal. Could animate a subtle idle sway/breathing on trailing leaves (very slow, low-amplitude) to keep the scene alive without implying any device logic — matches Diorama's ambient-idle conventions (like TV/appliance flicker) even though there's no real sensor behind it.

**Variations & customizations** (worth exposing as a kind/style dropdown, mirroring `FurnitureKindDef` + custom-object patterns): sub-kind (`wall_pocket`, `shelf_planter`, `macrame_hanger`, `living_wall_panel` — each its own default footprint/height like other furniture kinds), plant style (upright — snake plant/ZZ/succulent, cone/spike silhouette; trailing — pothos/string-of-pearls, drooping cylinder chains; bushy/round — pilea/fern, sphere cluster; air-plant — tiny, no visible pot, just a small spiky sphere cluster mounted directly to the wall), pot material/color swatch, size (compact single small pot / standard shelf with 2–3 pots / oversized living-wall panel or large single wall-pocket urn), seasonal reskin (swap foliage color/add small flower-`sphere` accents for a "flowering" variant spring/summer vs plain green).

**Animation opportunities**:
- **Idle**: gentle low-amplitude sway on trailing-vine segments and topmost foliage spheres (slow sine, desynced phase per instance like `idleOffset` elsewhere in the codebase) — a faint "air current" life-detector; macrame pot could have an even smaller pendulum sway on the cord since it's suspended.
- **Idle**: very subtle "breathing" scale pulse on foliage clusters (same trick used for humanoid torso breathing) purely for ambient liveliness.
- **Active** (only if grow-light bound): emissive glow ramps up/down on light on/off, matching the existing appliance-LED idiom (soft emissive + small point-light).
- **Active** (optional, avatar interaction hook): a passing/idling humanoid near a kitchen herb shelf could occasionally trigger a bubble-pool glyph (🌿/💧) via the existing `tend_plant` anchor activity — this item is a natural anchor target for that activity rather than needing new animation code.
- No door/lid/moving mechanical parts — all motion is ambient/cosmetic.

[↑ Back to top](#table-of-contents)

---

## Room divider / decorative screen

**Dimensions** (folding "shoji"-style screen, the dominant residential form):
- Per-panel: **400–460 mm wide × 15–25 mm thick × 1500–2100 mm tall**. Most common panel width ≈ **450 mm (17.7″)**.
- Panel count/config: 3-panel (compact, ~1350 mm total width), **4-panel (standard, ~1800 mm total width)**, 5–8 panel (wide/oversized, up to ~3000+ mm).
- Height variants: short/accent **1220 mm (48″)**, standard **1800 mm (70–72″)**, tall/privacy **2030–2290 mm (80–90″)**.
- Folded (storage) footprint: panels concertina down to roughly one panel-width × thickness×N.

**Shape breakdown**:
- Each panel = a thin **box** (frame) — model as one flattened box per panel, or a thin box "frame" outline with a slightly-inset, slightly-thinner **box** "infill" (paper/fabric/lattice look) recessed a few mm for a shadow-gap.
- 2–8 panels arranged in a shallow zig-zag (accordion) around a vertical axis — alternate hinge rotation ±10–20° per panel off dead-straight so it reads as "standing open" rather than a flat wall; a fully flat single-slab version is a fine cheap/idle variant.
- Hinges: 2–3 small **cylinder** stubs per panel edge (barely visible, or skip — too small to read at this scale).
- Optional frame detail: thin **box** strips forming a grid over the infill panel (shoji lattice look) — 3–4 horizontal + 2–3 vertical strips, raised ~5 mm proud of the infill face.
- Front face: **no strong functional front** — viewed/decorated from both sides equally; treat local +Z as the "convex" side of the zig-zag fold for consistent placement logic.
- Moving parts: none needed for base model; the fold angle itself *is* the only articulable parameter (could vary per placement for variety — flatter = space-saving, more folded = more privacy).

**Colors & finishes**:
- Frame: natural bamboo/rattan tan, dark walnut/espresso wood, black-lacquered, white-painted, or brushed metal (black/gold).
- Infill: rice-paper white/cream (shoji), woven bamboo/rattan mesh (natural tan), linen/fabric in muted solids (grey, navy, blush, sage), frosted/translucent acrylic, or printed canvas (florals, landscapes, abstract art — decorative "wall art" screens).
- Popular finish pairing: light wood frame + cream paper (Japanese/zen), black frame + rattan (boho), dark wood + linen (transitional/modern).

**Placement**:
- **FLOOR-resting**, freestanding — no wall/ceiling mount. Rests flat on the floor via the bottom edge of each panel (no separate feet on most designs; a few add small rubber pads, negligible height).
- Common rooms: bedroom (visual privacy for a dressing corner), living room (zone separator behind a sofa/open-plan), home office (backdrop/privacy for a desk nook), studio apartments (kitchen/sleep zone split).
- Placed along a wall or floating mid-room in a zig-zag stance; footprint is a shallow zig-zag polyline rather than a straight rectangle — treat it like a **wall run** for 2D footprint/collision (a short jointed partition), not a point fixture.

**Active / interactive state**: Purely decorative/passive — no power, no bound entity in most homes. The only "state" is the **fold angle / position**, which a user could conceivably drag to reposition or "open/close" (more folded = more compact, straighter = wider coverage). No lighting or animation cues expected; could optionally support a click-to-toggle between "folded" (narrow, near a wall) and "extended" (zig-zag, mid-room) pose for a nice low-cost interactive touch.

**Variations & customizations**: panel count (3/4/5/6/8) and height tier (short/standard/tall) as the two primary size knobs, material/finish presets (bamboo natural, dark wood + rattan, black lacquer + paper, white + linen, metal + frosted acrylic, printed/art canvas), lattice-frame toggle (plain flat infill vs. grid-strip shoji look), alternative form factor — rigid **hinged 3-fold table screen** (short, ~600–900 mm tall, sits on a dresser/console — COUNTER-resting variant) for smaller decorative use.

**Animation opportunities**:
- Idle: none needed (it's inert furniture) — optionally a very subtle sway/settle on placement (drop-in physics flourish) or a gentle print/fabric "flutter" shader if translucent, both purely cosmetic and skippable.
- Interactive: ease the fold angle between "compact/folded" and "extended/zig-zag" poses when clicked or dragged (a simple per-panel hinge-angle lerp), functioning like a soft "open/close" for the divider without any HA entity involved — good candidate for a purely local (`localState`) interactive toy object like the other unbound furniture.

[↑ Back to top](#table-of-contents)

---

## Decorative tray and coasters

**Dimensions**:

| Piece | Variant | Width × Depth × Height (mm) |
|---|---|---|
| Tray | Small/accent (bath, vanity, entry catch-all) | 250×150×20 |
| Tray | Medium decorative (coffee-table centerpiece) | 380×300×25–40 |
| Tray | Large ottoman/serving tray | 500×400×40–75 (rim ht 25–40, +handles) |
| Tray | Oversized square ottoman tray | 500–610×500–610×75 |
| Tray | Round ottoman tray | Ø400–815 × 40–75 |
| Coaster | Standard round | Ø90–100 × 3–10 |
| Coaster | Standard square | 90×90×3–10 |
| Coaster stack (set of 4–6) | in a holder/caddy | 100×100×35–50 (stacked) |

**Shape breakdown**:
- **Tray body**: one flat `box` (or shallow `cylinder` for round trays) forming the base plate, plus a thin perimeter lip — a slightly larger/taller `box` (rectangular) or `cylinder` shell (round) offset up 10–15 mm and inset so only the rim shows (or model as a thin base slab + a thin wall ring). Front face (+Z) is arbitrary/symmetric (trays have no true front) — treat the long handle axis as the "front-back" axis if handles are present.
- **Handles** (rope/cutout/metal loop style): two small `cylinder`s (rolled/rope handle) or two flattened ring shapes approximated with thin curved `cylinder` segments, mounted at each short end, protruding ~20–30 mm outward and rising ~15–25 mm above the rim — or, simplest buildable version, two rectangular cutout handles as negative space (just don't fill that portion of the rim wall).
- **Coaster (single)**: one flat squat `cylinder` (round, most common) or thin `box` (square/hex approximated as box). No moving parts.
- **Coaster stack**: N coasters stacked as a `cylinder` array offset in Y by the coaster thickness; optional holder = a slightly wider/taller open-top `cylinder` shell or a small vertical stand (thin `box` back + `box` base) if using a caddy-style holder.
- No openable/moving parts on either item — purely static dressing props.

**Colors & finishes**:
- Tray materials: wood (acacia, mango, walnut — natural/dark stain), rattan/wicker (woven tan), mirrored glass (silver/antique-mirror), metal (brushed gold, brass, matte black, silver, hammered aluminum), lacquered/enamel (glossy black, white, or bold color), marble/stone (white/grey veined), leather-wrapped.
- Coaster materials: cork (natural tan, sometimes stained), leather/faux-leather (black, brown, tan, saddle), marble/stone (white, grey, black veined), ceramic/terrazzo (multicolor speckle), wood slice (natural bark-edge round), silicone (bright solid colors), woven rattan.
- Common textures: visible wood grain, woven basket texture, hammered-metal dimpling, polished mirror reflectivity, matte stone veining.

**Placement**:
- Rests on a **COUNTER-or-surface**: coffee table, ottoman top, kitchen counter, bathroom vanity, entry console, nightstand, bar cart shelf. Never wall-mounted, floor-set, or ceiling-hung.
- Typical resting surface height in scene: whatever the host furniture's top Y is (e.g., coffee table ~400–450 mm, ottoman ~380–450 mm, console ~800–900 mm, nightstand ~550–650 mm) — the tray/coaster origin sits directly on that top with tray height added, coasters just their own thin height.
- Coasters are typically placed individually near a seat position (on a table/nightstand top) rather than centered.

**Active / interactive state**: Fully static/decorative — no powered or occupied state. The only "activity" signal is contextual: a tray/coaster set could visually gain a prop (a mug, glass, or drink) when a nearby seated avatar's `work_at_desk`/seated-evening bubble tier rolls a drink/coffee glyph — an optional cheap enhancement would be spawning a tiny cup mesh centered on a coaster when a seated rig's bubble is ☕/🍷/🧃, removed when the bubble clears. Otherwise purely idle set-dressing, similar to a bowl or vase. Seasonal reskin opportunity: swap tray/coaster color-set (red/green holiday palette, pastel spring) as a style variant rather than a runtime animation.

**Variations & customizations**: tray shape (rectangular / round / oval), size tier (small/medium/large/oversized), material/finish (wood, rattan, mirror, metal, lacquer, marble), handle style (none / cutout / rope-loop / metal ring), rim height; coasters shape (round/square/hex), material (cork/leather/stone/ceramic/wood/silicone), set count (typically 4 or 6), with or without a holder/caddy, monogram or pattern decal (flat color swap, no geometry change); combo variant — matching tray-and-coaster set in the same material/finish as a single placeable "recipe" bundle.

**Animation opportunities**:
- Idle: essentially none needed — static props; at most a very subtle specular highlight shimmer on mirror/metal/marble finishes if the renderer supports moving light reflections (toon shading likely makes this unnecessary).
- Active: the optional coaster-holds-a-drink prop swap described above (spawn/despawn a small cup/glass mesh tied to a seated rig's drink-themed bubble) is the only meaningful "in use" cue; otherwise these items are pure ambience with no state machine of their own.

[↑ Back to top](#table-of-contents)

---

## Modeling notes for Diorama

### Where this category lives in the app

Every item above is small, mostly-static dressing — it belongs in Diorama's **custom object / recipe system** (`Store.customObjects: ObjectRecipe[]`), not as new hardcoded `FurnitureKind`s, with a few exceptions noted below. An `ObjectRecipe extends FurnitureKindDef` and adds `id` + `primitives: RecipePrimitive[]`; each primitive is a `box` / `cylinder` / `sphere` / `cone` with `size` / `pos` / `rot?` / `color?` in **local mm**, origin = piece center at floor level, **+Z = front**. A `Furniture` instance references a recipe via `customKindId`; `resolveFurnitureDef(fu, customObjects)` returns the recipe def or the built-in `FURNITURE_KINDS[kind]` fallback. The 3D generic recipe builder in `_buildFurniture` walks `primitives` directly — no per-kind `switch` case is needed for anything in this document, which is exactly why the recipe system is the right home: a modeler (or a user, via the sidebar's Custom Objects form editor) can compose all 18 items from four primitive types without touching `three-renderer.ts`.

A few items are good candidates for **first-class `FurnitureKind`s** instead, because they carry real footprint/activity semantics the recipe system doesn't model on its own:
- **Rug** already exists (`rug` kind, flat 5 mm slab) — extend its defaults for pile-style variants (plush/shag thickness) rather than adding new kinds.
- **Room divider / decorative screen** has real 2D footprint/collision behavior (a jointed zig-zag "wall run") that benefits from kind-level treatment if it should block nav/collide like furniture.
- **Wall-mounted plant / shelf greenery**, if it should anchor the existing `tend_plant` idle-fidget activity, needs an `activity` field on its def the way `FurnitureKindDef` already supports — either a small new `FurnitureKind` per sub-kind (`wall_pocket`, `shelf_planter`, `macrame_hanger`, `living_wall_panel`) or an `activity` override on the custom-object recipe.

Everything else (wall art, mirrors, clocks, curtains/blinds, pillows/blankets, vases/bowls, candles, tabletop frames/books, sculptures, floating shelves, tapestries, centerpieces, fairy lights, seasonal decor, trays/coasters) is pure recipe-system dressing with no nav/collision/activity requirement.

### Suggested defaults table (footprint w/d, height, tint, category)

Use these as `FurnitureKindDef`-shaped starting points (`w`/`d` = plan footprint mm, `h` = built height mm, `cat` = sidebar optgroup, `tint` = default hex) for a "decor" custom-object starter library. Pick the mid-tier size from each item's dimension table unless noted:

| Item (mid-tier default) | w × d (mm) | h (mm) | Default tint | `cat` | Mount |
|---|---|---|---|---|---|
| Framed wall art (standard mid-size) | 406 × 30 | 508 | `#e8e0d0` (mat) | decor | wall |
| Wall mirror (vanity/statement) | 760 × 30 | 900 | `#c8d6dc` (glass) | decor | wall |
| Floor mirror (leaning) | 650 × 45 | 1830 | `#c8d6dc` | decor | floor |
| Wall clock (standard) | 300 × 45 | 300 | `#ffffff` (face) | decor | wall |
| Area rug (standard 5×8) | 1520 × 2440 | 5 | `#c9b79c` (jute-neutral) | decor | floor |
| Curtain panel pair (standard window) | `Wwin+375` × 120 | `sill_to_floor` | `#f2ede3` (linen) | decor | wall/ceiling |
| Venetian blind (standard window) | `Wwin` × 50 | `Hwin` | `#e0e0e0` | decor | wall |
| Throw pillow (standard square) | 457 × 457 | 180 | `#a67c52` (accent) | decor | mountable (on seating) |
| Throw blanket (standard, draped) | 1270 × 400 | 100 | `#6b7f6b` (sage) | decor | mountable (on seating) |
| Standard table vase | 160 × 160 | 300 | `#e6e6e6` (ceramic) | decor | mountable (surface) |
| Medium centerpiece bowl | 250 × 250 | 100 | `#c9a878` (wood) | decor | mountable (surface) |
| Pillar candle (standard) + holder | 90 × 90 | 200 | `#f5f0e6` (wax) | decor | mountable (surface) |
| Tabletop picture frame (standard) | 165 × 60 | 215 | `#5c4636` (wood frame) | decor | mountable (surface) |
| Book stack (3-book decorative) | 200 × 150 | 110 | `#8a3b3b` (cover) | decor | mountable (surface) |
| Sculpture/figurine (standard tabletop) | 150 × 150 | 300 | `#8a6a3a` (bronze) | decor | mountable (surface) or floor |
| Floating wall shelf (standard, w/ decor) | 750 × 260 | 45 | `#3d2b1f` (walnut) | decor | wall (host surface for mountables) |
| Tapestry/wall hanging (standard) | 1520 × 30 | 1150 | `#7a5c8a` (jewel-tone) | decor | wall |
| Macrame wall hanging (medium) | 1200 × 60 | 950 | `#ede4d3` (natural cotton) | decor | wall |
| Table centerpiece (standard dining) | 300 × 300 | 380 | `#7a8f6b` (greenery) | decor | mountable (surface) |
| Fairy/string lights (headboard drape, standard 5 m/50-LED) | 1800 × 100 | 200 | `#fff2cc` (warm white, lit) | decor | wall (draped) |
| Wreath (standard 24″) | 610 × 100 | 610 | `#1d5c33` (pine green) | decor | wall |
| Garland (mantel/stair, 9 ft) | 2700 × 250 | 250 | `#1d5c33` | decor | wall |
| Christmas tree (standard 6–7 ft) | 1100 × 1100 | 2000 | `#1d5c33` | decor | floor |
| Wall-pocket planter | 190 × 130 | 180 | `#b5652c` (terracotta) | decor | wall |
| Room divider screen (4-panel standard) | 1800 × 25 | 1800 | `#c9a878` (bamboo) | decor | floor |
| Decorative tray (medium) | 380 × 300 | 30 | `#8a6a3a` (wood) | decor | mountable (surface) |
| Coaster set (4, stacked) | 100 × 100 | 40 | `#c9a878` (cork) | decor | mountable (surface) |

### Mount-type summary

- **Floor**: area rugs/runners, floor mirrors (leaning + cheval), floor vases, oversized/floor sculptures, Christmas trees, room divider screens.
- **Surface-mounted (`mountable`, snaps to a `surface` host's top like `coffee_maker`/`toaster`)**: vases, decorative bowls, candles/candle holders (+ candelabra/hurricane variants), tabletop picture frames, decorative book stacks, tabletop sculptures/figurines/bookends, table centerpieces/faux florals, decorative trays and coasters, jar-style fairy-light centerpieces.
- **Wall-snapped (flush, offset = wallT/2 + item depth/2, rotation from wall normal — same idiom as `snapSwitchToWall`/`snapFireplaceToWall`)**: framed wall art, wall mirrors, wall clocks, tapestries/wall hangings/macrame, floating wall shelves, wall-pocket planters/living-wall panels, wreaths, mantel garland, wall-mounted relief sculptures.
- **Wall/ceiling-mounted at a window opening (child of the `Window`, inherits its wall position/rotation)**: curtains/drapes, venetian/roller/roman/vertical blinds.
- **Ceiling-hung**: macrame plant hangers, curtain-style fairy-light installations.
- **Mixed/either** (modeled per-instance): fairy/string lights (wall-drape, wrap, ceiling-curtain, or surface jar), garland (wall/mantel or stair-rail wrap), tapestry-style macrame (wall) vs. macrame planter (ceiling).

### Which items want an "active/running" animated state

Most of this category is intentionally **static dressing** — the closing per-item sections above already flag idle-only vs. active-capable pieces, but the short version for anyone wiring up dirty keys / `stateProvider` hashing:

- **Genuinely bindable / stateful** (extend `_isSlowEntity` + a `_keyFloor`-style hash the same way appliance-state and fridge-door bindings already work): candles/candelabra (`localState` lit/unlit — flame flicker, emissive fade), fairy/string lights (`light.*` brightness/color → emissive intensity + optional twinkle-mode attribute), Christmas tree / garland / wreath string-lights (`light.*` on/off → ornament emissive), floating-shelf accent light or living-wall grow-light (`light.*`), optional "smart frame" (digital photo frame `switch`/`light` stand-in).
- **Always-on ambient animation regardless of binding** (cheap per-frame `Math.random()`/sine idioms, same spirit as the fireplace flicker and humanoid breathing): wall-clock hand rotation (driven by `Date.now()`, not an entity), lit-candle flicker, fairy-light twinkle, tapestry/macrame fringe sway, wall-mirror reflection shimmer, potted/hanging greenery leaf sway + breathing pulse, floral-centerpiece bloom sway, Christmas-ornament pendulum sway.
- **Occupancy-reactive (anti-feedback: trigger off RAW target dwell/sit, never the eased pose — same rule as every other activity blend)**: throw pillows compressing + throw blankets blending to a "pulled over" pose when a rig sits/lies nearby (reuse `_animateBedCover`'s vertex-displacement idiom), decorative tray/coaster spawning a small cup/glass mesh tied to a seated rig's drink-themed thought bubble, wall-mounted plant as a `tend_plant` activity anchor.
- **Purely static, zero per-frame cost**: framed wall art (unless "smart"), tabletop picture frames, decorative books, vases/bowls (barring the optional stem sway), sculptures/figurines/bookends, decorative trays/coasters (barring the drink-prop swap), room divider screens (barring the optional click-to-fold interaction), curtains/blinds absent a bound `cover.*` entity. These should have no per-frame update at all — the cheapest possible props, matching the codebase's existing convention that static dressing costs nothing until a real state or activity trigger gives it a reason to move.
