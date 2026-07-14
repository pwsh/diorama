# Household Lighting Fixtures — Diorama Model Reference

This document is a build reference for adding **household lighting fixtures** to
Diorama, a Sims-2000-style Home Assistant floor-plan app. Each section below
gives real-world dimensions and appearance (verified via web search, primary
sources preferred) translated into a **buildable primitive recipe** — box /
cylinder / sphere / cone shapes positioned in millimeters, local origin at the
piece center at floor level (or ceiling/wall attach point, as noted), with
local **+Z as the front face**. It's meant to hand straight to a modeler
building Diorama `ObjectRecipe`s / new `LightIconKind`s and their on/off,
dimming, and idle animations.

## Table of Contents

1. [Flush-mount and semi-flush ceiling light](#flush-mount-and-semi-flush-ceiling-light)
2. [Chandelier](#chandelier)
3. [Pendant light (single, multi-pendant, mini-pendant island cluster)](#pendant-light-single-multi-pendant-mini-pendant-island-cluster)
4. [Recessed can / downlight](#recessed-can--downlight)
5. [Track lighting](#track-lighting)
6. [Floor lamp (+ torchiere uplight)](#floor-lamp--torchiere-uplight)
7. [Table lamp & desk lamp](#table-lamp--desk-lamp)
8. [Wall sconce](#wall-sconce)
9. [Under-cabinet lighting — puck and LED bar](#under-cabinet-lighting--puck-and-led-bar)
10. [Bathroom vanity light bar](#bathroom-vanity-light-bar)
11. [Picture light and art light](#picture-light-and-art-light)
12. [Ceiling fan with light kit](#ceiling-fan-with-light-kit)
13. [LED strip / tape / cove lighting](#led-strip--tape--cove-lighting)
14. [Exterior floodlight and security light](#exterior-floodlight-and-security-light)
15. [Porch / coach / wall-lantern exterior light](#porch--coach--wall-lantern-exterior-light)
16. [String / fairy / festoon lights](#string--fairy--festoon-lights)
17. [Night light and plug-in accent](#night-light-and-plug-in-accent)
18. [Linear pendant / kitchen island bar light](#linear-pendant--kitchen-island-bar-light)

---

## Flush-mount and semi-flush ceiling light

**Typical dimensions** (ceiling-mounted, round is by far most common; square/rectangular variants share the same depth/height figures):

| Variant | Diameter/width | Height / drop from ceiling |
|---|---|---|
| Compact (hallway, closet, small bath) | 250–350 mm (10–14") | Flush: 60–100 mm profile |
| Standard (bedroom, small living room) | 400–500 mm (16–20") | Flush: 75–125 mm profile |
| Large / master (great room, foyer) | 500–760 mm (20–30") | Flush: 100–150 mm profile |
| Semi-flush (any of the above sizes) | same diameters as above | drop 100–200 mm (4–8") below the ceiling on short stems/arms |

Rule of thumb used by lighting retailers: fixture diameter (inches) ≈ room
length + width (feet) — e.g. a 6×10 ft room → ~16" fixture. Mounting height
guidance: keep ≥2130 mm (7 ft) clearance from floor to fixture bottom in
walkable rooms; kitchens typically want ≥2130 mm to the bottom of the shade.

**Shape breakdown** (buildable from 2–4 primitives):

- **Base plate**: flat wide cylinder, ~15–20 mm thick, flush against the ceiling (the mounting canopy, often barely visible).
- **Shade/diffuser** — the dominant visible mass, one of:
  - *Drum*: short cylinder (open or closed bottom), sides straight, height ≈ 0.3–0.5× diameter.
  - *Dome/bowl* ("boob light"): a squashed hemisphere/dome — approximate with a scaled sphere (flatten Y) or a cone with rounded cap; bottom is a flat or slightly convex disc.
  - *Disc/puck* (modern LED): very thin flat cylinder, height 30–60 mm, edge-lit look — the most common contemporary flush profile.
  - *Square/rectangular panel*: flat box instead of cylinder, same depth range.
- **Trim ring** (optional): thin torus/cylinder ring at the shade's edge, often a contrasting metal finish (brushed nickel/brass/black) around a frosted glass/acrylic disc.
- **Finial** (dome/traditional variants only): tiny sphere or small cone at the very bottom center.
- **Front face**: the entire underside is the light-emitting face — no lateral front like a sconce; reads the same from any horizontal angle. No moving/openable parts — the only "motion" is the light state.

**Colors & finishes**:

- Shade/diffuser: frosted white opal glass or white acrylic (most common), clear seeded glass, or ribbed/fluted glass for texture.
- Trim/canopy metal finishes: brushed nickel, matte black, aged/antique brass, chrome, bronze, white-painted.
- Traditional dome ("boob light") variants: brass trim + frosted glass + small ball finial — a deliberately dated/builder-grade look, useful for a "before" aesthetic or older-home floors.
- Modern LED disc variants: all-white or all-black flat housing, sometimes a thin silver edge ring.

**Placement**: **Ceiling**-mounted only (never floor/counter/wall). Universal
— hallways, closets, bedrooms, bathrooms, kitchens, laundry rooms, stairwells;
the "builder-grade default" fixture found in nearly every room that isn't
getting a pendant or chandelier. Mount the origin at the ceiling plane (piece
height = room ceiling height, commonly 2440–2740 mm/8–9 ft above floor
in-game); semi-flush variants just add the 100–200 mm drop offset below that
plane. Sits naturally between `bulb` (bare) and `pendant` (long stem) in
Diorama's `LightIconKind` roster — flush has ~0 mm stem, semi-flush has a
short 100–200 mm stem/canopy-to-shade gap versus a pendant's much longer drop.

**Active / interactive state**:

- OFF: shade renders as a dim/neutral flat-shaded disc/dome, no glow.
- ON: shade material goes emissive (warm ~2700K or cool ~4000K tint per HA color temp/color), plus a floor-pool light-cone/disc (matches how `bulb`/`spot` already project a floor pool) — for a flush fixture the pool is centered directly beneath it, wide and soft since there's no directional cone.
- Dimmable brightness (common on modern LED flush mounts) scales emissive intensity and pool opacity continuously, same as other light kinds.
- No other physical state changes (no swing/open parts, no seasonal variant) — a static light source.

**Variations & customizations worth offering**:

- Shade shape: drum / dome / disc-puck / square-panel.
- Size: compact / standard / large (diameter presets above).
- Semi-flush toggle: 0 mm drop (true flush) vs 100–200 mm stem drop.
- Finish/trim color (nickel/black/brass/white) as a tint on the trim ring, independent of shade color.
- Multi-light cluster variant (2–3 small dome lights on one canopy) — optional but cheap visual variety.

**Animation opportunities**:

- *Idle (off)*: essentially static; low-motion fixture by nature, unlike a fan or fireplace.
- *Active (on)*: emissive intensity ramp on toggle (quick ease, not instant), floor-pool fade in/out, brightness/color-temp interpolation on dimmer changes.
- *Flicker (optional "needs replacing"/old-house variant)*: reuse the fireplace's `Math.random()`-driven emissive-intensity flicker idiom at much lower amplitude/frequency — a distinct "faulty bulb" cosmetic state.
- No shade-opening, no cord/chain sway (unlike a pendant) — the "boring but ubiquitous" light kind, valuable for filling rooms that don't get a statement fixture.

**Sources**: [Flush Mount Light Right Size Guide – ParrotUncle](https://parrotuncle.com/blogs/news/flush-mount-light-right-size-guide-picking-diameter-by-room-size) · [Flush Mount Ceiling Lights Sizing Guide – LOOMLAN](https://loomlan.com/pages/flush-mount-lighting-guide) · [Ceiling Light Size Guide – City Lights SF](https://citylightssf.com/blogs/city-lights-insights/ceiling-light-size-guide) · [Flush/Semi-Flush Buying Guide – Lowe's](https://www.lowes.com/n/buying-guide/flush-mount-and-semi-flush-mount-buying-guide) · [Flush/Semi-Flush Buying Guide – Home Depot](https://www.homedepot.com/c/ab/flush-mount-and-semi-flush-mount-lighting-buying-guide/9ba683603be9fa5395fab90a736b49c) · [Semi Flush Mount Buying Guide – Golden Lighting](https://goldenlighting.com/blogs/the-golden-edit/semi-flush-mount-ceiling-lights-2) · [Drum Ceiling Lights – Destination Lighting](https://www.destinationlighting.com/products/drum-ceiling-lights) · [The Outdated Dome Fixture Making a Comeback – House Digest](https://www.housedigest.com/1934688/outdated-ceiling-dome-light-fixture-stylish-comeback/) · [Progress Lighting Drum Flush Mount – Home Depot](https://www.homedepot.com/p/Progress-Lighting-Inspire-Collection-13-in-2-Light-Brushed-Nickel-Transitional-Kitchen-Ceiling-Light-Drum-Flush-Mount-P3713-09/301218789)

---

## Chandelier

**Typical dimensions** (diameter × height of the fixture body itself, excluding drop chain/rod):

| Variant | Diameter | Fixture height | Typical use |
|---|---|---|---|
| Compact/mini (foyer, breakfast nook, bathroom) | 250–450 mm | 300–500 mm | small entries, powder rooms |
| Standard dining | 600–900 mm | 500–750 mm | 8 ft (2440 mm) ceiling, 6–8 person table |
| Oversized/great-room | 900–1500+ mm | 900–1800+ mm | vaulted foyers, 2-story great rooms |

Sizing rule of thumb: diameter ≈ (room length ft + width ft) → inches → mm;
over a table, diameter ≈ 1/2–2/3 the table width, staying ≥150 mm inset from
each edge. Fixture height ≈ 65–75 mm per foot of ceiling height (a 24″/600 mm
fixture suits an 8 ft ceiling).

**Drop height** (rod/chain, adjustable, not part of the fixture body): bottom
of fixture sits 750–900 mm (30–36″) above a dining table surface (table ~750
mm tall → bottom of chandelier ~1500–1650 mm above floor); rises another ~75
mm per extra foot of ceiling height. Over open floor (foyer/stairwell) bottom
clearance should stay ≥2100 mm above any walking surface.

**Shape breakdown** (build top-down, local origin at the fixture's own
center — the whole assembly is offset upward at scene-build time by the drop
length):

- **Canopy**: flat wide cylinder (~120 mm dia × 20 mm), flush to the ceiling — the true mount point.
- **Drop**: thin cylinder chain or rod (6–15 mm dia) from canopy down to the fixture crown — length is the *variable* piece (tunes "hang height").
- **Crown/frame hub**: small cylinder or sphere where all arms converge.
- **Arms**: 3–12 thin radiating cylinders (candelabra-style) angled outward/down from the hub, OR replaced by a solid **drum shade** (one large open-ended cylinder) for a modern variant.
- **Candle cups + bulbs** (candelabra style): tiny cylinder cup + small cone "candle" + sphere or teardrop bulb at each arm tip — this fixture is **front-agnostic** (radially symmetric, no single "front"; +Z can just be the arm-numbering start).
- **Crystals/tiers** (crystal chandelier variant): rings of small elongated spheres/cones ("teardrops") strung below the frame in 1–3 concentric tiers, widest at top tapering down — approximate with a scattered ring array of tiny stretched spheres, or a single tapered-cone silhouette for a distant/LOD version.
- **Shade variant**: one big open-topped cone or cylinder shade hiding the bulbs, light spilling from the bottom rim only.

**Colors & finishes**: metal frame in bronze/oil-rubbed-bronze, matte black,
antique/polished brass or gold, brushed/polished nickel, chrome, or wrought
iron (black, textured). Crystal chandeliers: clear or smoked-glass/acrylic
"crystal" tiers with a warm sparkle highlight. Drum-shade variants: fabric
shade in white/cream/linen or black, sometimes with a diffuser disc. Candle-
style bulbs: warm-white glow, often faux "flame-tip" bulb shape.

**Placement**: hangs from the **ceiling** (never floor/wall/surface). Center
over the dining table (not the room center) in dining rooms; also common in
foyers/entries (often 2-story, long drop), primary bedrooms (over a seating
area, not the bed), and stairwells (long drop spanning floors). Canopy mounts
to the ceiling structure; drop chain/rod length is the tunable placement
parameter per room ceiling height.

**Active/interactive state**: on/off glow at each bulb position (emissive
sphere/cone brightening), optional warm point-light contribution to the room;
brightness scaling with HA `light.brightness` like other fixtures; color
temperature shift if the bound entity supports color temp. No moving parts in
real fixtures, but a subtle "sparkle" flicker on crystal facets when lit reads
well stylistically (tiny randomized emissive flicker on a few crystal
elements, Sims-toon appropriate).

**Variations & customizations**: candelabra/traditional (arms + candle
bulbs), crystal/tiered (rings of hanging crystals), drum-shade/modern (single
fabric or metal drum hiding bulbs), linear/rectangular (elongated bar
chandelier for long tables — arms/bulbs distributed along a line instead of
radially), industrial/cage (exposed bulbs in a wire-cage sphere),
rustic/wagon-wheel (horizontal ring frame with hanging candle-style bulbs).
Size tiers (compact/standard/oversized per table above) and finish/color
swaps (bronze/black/brass/nickel/crystal-clear) are the cheapest option set to
offer.

**Animation opportunities**: *Idle* — very slow, small-amplitude sway/
rotation of the whole fixture (as if from HVAC air currents) reads as alive
without looking broken; no idle light animation when off. *Active (light
on)* — bulb emissive intensity ramps on/off with a quick ease (not instant
snap) matching brightness; optional soft point-light flicker only for a
"candle mode" preset (mirrors the fireplace flicker idiom at much lower
intensity/frequency); crystal variants could sparkle-highlight a rotating
subset of facets while lit. On dimmer-capable entities, bulb emissive + point-
light intensity both scale continuously with `brightness`.

---

## Pendant light (single, multi-pendant, mini-pendant island cluster)

**Typical dimensions** (shade/globe body, excluding cord/stem):

| Variant | Diameter | Body height | Typical mount (bottom-of-shade above counter/table) |
|---|---|---|---|
| Mini-pendant (sink, hallway, small island) | 100–250 mm (4–10") | 150–250 mm | 760–910 mm (30–36") above counter |
| Standard single pendant (dining, entry) | 250–400 mm (10–16") | 250–400 mm | same rule over a surface; 1500–1700 mm over floor-standing seating areas |
| Oversized statement / drum | 400–600+ mm | 300–500 mm | often lower, 700–800 mm above counter (focal piece) |
| Multi-pendant island cluster | 3 heads, 250–350 mm dia each, spaced 600–750 mm (24–30") center-to-center OR on a shared 900–1500 mm linear rail, heads every 250–350 mm | — | same 760–910 mm band, all heads level |

Cord/stem drop is field-adjustable: rule of thumb ≈ (ceiling height − 1830
mm) + 910 mm slack to trim; for a fixed model default a stem long enough to
land the shade at the standard band above a **2440 mm** ceiling is fine
(~1200–1500 mm exposed stem/cord from a ceiling canopy).

**Shape breakdown** (maps directly onto the existing `LightIconKind
'pendant'` recipe — sphere-on-stem from ceiling):

- **Canopy**: small flat cylinder flush to the ceiling (`r≈60, h≈20`), origin of the stem.
- **Stem/cord**: thin cylinder (`r≈4–8 mm` for cord, `r≈10–15` for a rigid rod/chain-look), spans canopy down to the shade top. Length = `lightHeight` minus shade height minus ceiling height — group origin sits at the bulb/shade, stem reaches up to the ceiling.
- **Shade/body** — pick by sub-kind, all hung with their opening facing DOWN (rotationally symmetric — skip the 2D front-chevron):
  - *Dome/bell*: cone (apex up, wide base down) or a sphere clipped flat on top.
  - *Globe*: plain sphere, often frosted (visible bulb-glow through the shell).
  - *Drum*: short open-ended cylinder (translucent side, dark disc cap top and bottom rim).
  - *Lantern/cage*: cylinder or box frame with thin vertical bar accents (4–6 slim box "cage ribs") around a small inner bulb sphere.
  - *Industrial cone/barn*: wide flat cone, open bottom, metal finish, exposed bulb sphere peeking below the rim.
- **Bulb**: small emissive sphere at/near the shade's open bottom (visible in globe/cage/industrial styles, hidden in dome/drum).
- **Multi-pendant island cluster**: 3 (occasionally 2 or 4–5) identical single-pendant assemblies, either each with its own ceiling canopy spaced along the island's long axis, or all stems dropping from one shared linear canopy bar (thin box, ~900–1500 mm long) mounted flush to the ceiling.

**Colors & finishes**: shade materials — frosted/clear/smoked glass, matte
ceramic, woven rattan/wicker (textured cylinder look, warm tan), linen/fabric
drum (off-white/cream), metal (brushed nickel, matte black, aged brass,
copper, chrome). Cord/stem/canopy matches shade metal finish — black, bronze,
brass, nickel, white. Bulb glow: warm white (2700–3000K) is overwhelmingly
common; some Edison-bulb-visible styles show an amber filament tint.

**Placement**: hangs from the **ceiling** (always). Rooms: kitchen
(island/sink cluster — the classic 3-pendant row), dining room (single or
paired over the table), entry/foyer, bedroom (bedside alternative to lamps),
bathroom (vanity, paired mini-pendants flanking a mirror). Mount height is the
single biggest design variable — see table above; over walkways/entries it's
often set higher (2000+ mm clearance) purely for headroom rather than task
lighting.

**Active / interactive state**: Powered ON — shade material gets an emissive
boost (esp. glass/frosted/drum types where light visibly passes through the
shell) + the existing floor light-pool glow disc under it (per the
`lightRadius`/`lightIntensity` convention already used for `pendant`).
Multi-pendant clusters read as a cohesive "row" — worth keying all heads in a
cluster to one shared entity/brightness so they don't animate independently.
No moving parts in normal operation (unlike a fan or fireplace); the only
"motion" is the light level itself and, optionally, a very subtle idle sway.

**Variations & customizations**: sub-kind selector (dome / globe / drum /
cage-lantern / industrial-cone), parallel to how `bulb/spot/pendant/sconce/
strip/fireplace/lamp` are already distinct `LightIconKind`s; single vs.
linear multi-head cluster (count 2–5, spacing param) for island use; finish
swatch (glass clear/frosted/smoked, matte black, brass, nickel, rattan,
fabric); cord/stem length override (fits the pattern of `lightHeight` driving
stem length); diameter/scale slider (mini → oversized statement) reusing
`lightRadius`-style scaling.

**Animation opportunities**: *Idle* — an almost-imperceptible pendulum sway
on the stem (a few degrees, very slow period) sells "hanging" rather than
"welded"; a faint bulb-glow shimmer if visible-filament style. *Active
(power on/off)* — cross-fade the shade emissive + bulb glow + floor-pool
disc opacity, matching the existing light on/off treatment used by other
`LightIconKind`s — apply it to the shade material instead of a bare bulb
sphere. *Interaction feedback* — click-to-toggle could nudge the stem/shade
slightly (a tiny bounce) on state change for tactile feedback, simpler than
the fireplace's continuous flicker (a short damped one-shot).

**Sources**: [The Complete Pendant Sizing Guide – LightsOnline](https://www.lightsonline.com/blog/guides/the-complete-pendant-sizing-guide/) · [Pendant Lights Dimensions & Drawings – Dimensions.com](https://www.dimensions.com/collection/pendant-lights) · [How To Space Pendant Lights Over A Kitchen Island – DIY With Christine](https://diywithchristine.com/how-to-space-island-pendant-lights/) · [Pendant and Chandelier Length Guide – Hangout Lighting](https://www.hangoutlighting.com/blogs/lighting-guides/pendant-and-chandelier-length-guide) · [Mini Pendant Lighting Size Guide – Perimost](https://perimost.com/blogs/inspiration/mini-pendant-lighting-size-guide-what-diameter-do-you-really-need) · [Kitchen Island Pendant Height & Placement – Visual Comfort](https://www.visualcomfort.com/inspiration/how-high-should-you-place-pendant-lights-over-a-kitchen-island/) · [Kitchen Island Light Height Guide – Homebaa](https://www.homebaa.com/blogs/lighting/kitchen-island-lighting-height) · [Kitchen Island Pendant Lighting Size Guide – Lightopia](https://www.lightopia.com/kitchen-island-pendant-lighting-guide)

---

## Recessed can / downlight

**Typical dimensions** (visible face = the ceiling-flush trim; housing itself
is hidden above the ceiling plane):

| Variant | Trim outer Ø | Aperture (cutout) Ø | Visible reveal depth | Above-ceiling housing (not modeled) |
|---|---|---|---|---|
| Compact / "4-inch" | ~130 mm | ~100–115 mm | 5–10 mm | ~140 mm can, 125–228 mm deep |
| Standard / "5-inch" | ~180 mm | ~125 mm | 5–10 mm | ~165 mm can, ~190 mm deep |
| Standard / "6-inch" (most common) | ~180–205 mm | ~150 mm | 5–10 mm | ~180 mm can, ~190 mm deep (shallow "IC" versions ~140 mm) |
| Oversized / commercial | ~230–280 mm | ~200 mm | 5–10 mm | varies |

Rule of thumb: trim OD ≈ aperture + 25–50 mm (trim overlaps the cutout by
~12–25 mm per side).

**Shape breakdown**:

- A **cylinder** (flat, disc-like — radius per table, thickness 5–10 mm) flush-mounted in the ceiling plane = the trim ring, front face down (local −Y, since this is ceiling-mounted; treat "front" as facing down into the room).
- A slightly smaller, slightly recessed **cylinder** or shallow **cone** (radius = aperture, recessed 10–20 mm up into the ceiling) = the reflector cone / baffle — darker, subtly tapering upward into shadow.
- A thin **cylinder** or flat disc at the very bottom of the reflector = the lens/diffuser or bare LED module — the only piece that should glow when the entity is on.
- Optional: for gimbal/adjustable "eyeball" trims, add a small **sphere-in-ring** (a squashed sphere partially recessed, offset off-center) to suggest the tiltable module poking below the ceiling plane.
- No moving parts in the base version; the can body above the ceiling is never visible and doesn't need geometry.

**Colors & finishes**: trim ring — white (most common, ~90%), matte black,
brushed nickel/satin chrome, oil-rubbed bronze — matte or satin, rarely
glossy. Baffle/reflector interior — usually flat black or white (black "cans"
for glare control, white for max reflected light, "specular" silver in
commercial trims). Lens — warm-white to neutral-white emissive disc (color
temperature could tint it 2700K amber → 5000K cool-white). Trimless variants
— same color as the ceiling paint (near-invisible ring), just a dark slot.

**Placement**: **Ceiling** only — always built-in/recessed, flush with the
ceiling plane (local Y = ceiling height, e.g. 2743 mm to match Diorama's wall
height convention), front face pointing straight down (−Y). Common rooms:
kitchens (over islands/counters), living rooms, hallways, bathrooms
(shower-rated "wet location" trims), offices. Typically arranged in a grid or
a line, spaced roughly 1200–1800 mm apart and ~600–900 mm from walls. Would
be a new **ceiling-flush** `LightIconKind` — most like a flattened `spot` but
with zero visible protrusion below the ceiling and no floor-mounted disc
glyph needed the way pendant/lamp have — reuse the existing floor-pool-glow
mechanic (`lightRadius`, floor disc) for the down-pool of light.

**Active / interactive state**: OFF — lens reads as a flat, slightly
darker-than-ceiling disc (matte, no emission), reflector nearly invisible in
shadow. ON — lens disc becomes emissive (warm/cool per color temp +
brightness attribute), a soft **conical floor-pool glow** directly beneath it
(reuse the existing floor-disc/pool mechanic — tight radius, ~600–900 mm,
since downlights throw a narrower, more defined pool than a pendant), and the
reflector cone catches a faint bounce-light tint from the emissive color.
Dimming — pool alpha + lens emissive intensity scale with HA brightness, same
as other light kinds. No animated moving parts; the only "activity" signal is
the emissive/pool state matching `bulb`/`spot`/`strip` kinds already in the
system.

**Variations & customizations**: size (4-inch compact/accent, 5/6-inch
standard/most common, 8-inch+ oversized/great-room); trim style (baffle —
matte black cone, glare-control; reflector — white/specular, max output;
retrofit LED disc — near-flat, the "trimless" option; eyeball/gimbal —
adjustable, small offset dome poking below ceiling; wall-wash — asymmetric
reflector, throws light sideways toward a wall, could bias the floor-pool
off-center); finish color options (white/black/nickel/bronze); wet-location
variants for bathrooms/showers (visually identical, no extra geometry).

**Animation opportunities**: *Idle (off)* — none, fully static, matte disc.
*Idle (on)* — a very subtle slow "breathe" (±3–5% emissive intensity) could
sell "ambient/idle" without being distracting, though most recessed lights
are static-on; better to keep static like existing `bulb`/`spot` kinds unless
flagged as a "smart" color-changing fixture. *Active/on transition* — quick
fade-in/out of emissive + floor pool (matches existing light toggle
behavior). *Color-changing smart downlights* (if HA reports RGB/color-temp)
— lens tint animates smoothly on color change. *Gimbal/eyeball variant* —
could support a static rotation/tilt property (like sensor heading/tilt) for
visual variety, no need for continuous motion.

---

## Track lighting

**Typical dimensions**:

- **Rail (track)**: straight sections sold in 1220 mm (4 ft) and 2440 mm (8 ft) runs, cuttable/joinable; L-/H-/J-track profile ≈ 25 mm wide × 12–16 mm tall. Modern low-voltage "magnetic track" strips are slimmer: 15 mm / 20 mm / 35 mm wide × ~10 mm tall.
- **Track head (spotlight/gimbal puck)**: body ≈ 70–100 mm diameter × 100–140 mm long, sized to the lamp it holds — PAR20 head ≈ Ø64 mm, PAR30 ≈ Ø95 mm, PAR38 ≈ Ø122 mm; modern integrated-LED gimbal heads run smaller, ≈ Ø70–85 mm × 90–110 mm.
- **Standoff from ceiling**: rail sits nearly flush, ~15–25 mm below the ceiling plane (surface-mounted canopy/connector adds ~10 mm); heads project down/out an additional 60–120 mm depending on tilt.
- **Common run configurations**: single straight run (1.2–3.6 m), L-/T-/X-shaped runs via connectors, or a monopoint/single-circuit adapter with just one head.

**Shape breakdown**:

- **Rail**: one long thin `box` (e.g., 25 × 15 × length mm), front face = the slotted underside where heads clip in (local −Z if the rail is mounted overhead running along local X).
- **End caps / power feed connector**: small `box` at each rail end (≈30 × 30 × 20 mm) — one end typically has a slightly larger junction box cap where power feeds in.
- **Track head — canonical gimbal/cylinder style**:
  - **Track adapter (foot)**: small `box` (~30 × 20 × 15 mm) clipped to the rail's underside — the only static/non-aiming part.
  - **Yoke/gimbal ring**: thin `cylinder` or half-torus approximated by a flattened `cylinder` ring connecting the foot to the lamp housing — the pivot for tilt.
  - **Lamp housing**: a `cylinder` (classic "coffee-can" head) or `cone` (bell/scoop shaped head), open-front, tilts on the gimbal's local X axis (aimable) and swivels on the rail-mount's local Y (yaw).
  - **Lamp/lens**: a `sphere` (bulb) or flat `cylinder` disc (lens) capping the open front — this is the "front," local −Z of the head at rest (pointing straight down).
  - **Optional barn doors**: 2–4 thin flat `box` flaps hinged at the housing rim, angled outward — decorative, usually static.
- **Other head shapes worth offering**: cube/box head (modern minimalist — a rectangular `box` on the gimbal), bell/cone head (wide-mouth `cone`), small pendant-drop head (cylinder head hung below the rail on a thin rod, for track pendants).

**Colors & finishes**: rail and heads almost always matched in one finish —
matte black, white, brushed/satin nickel, bronze/oil-rubbed bronze, or matte
silver/aluminum. Black and white are by far the most common residential/
commercial defaults. Materials: stamped/extruded aluminum or steel housings,
powder-coat or anodized finish; lens is clear or frosted polycarbonate/glass.
Texture: mostly flat matte or satin metal — avoid glossy plastic look; a
subtle brushed-metal specular helps sell "fixture" vs "toy."

**Placement**: **Ceiling**-mounted only — surface-mounted flush to the
ceiling plane (most common) or, less often, stem/rod-suspended 100–300 mm
below a tall ceiling. Rooms: kitchens (over island/counter run), living rooms
(accent/art lighting), hallways, galleries, retail-style display walls, home
offices/studios. Typical mounting height = ceiling height of the room (rail
plane flush to ceiling); heads then hang/project down 60–150 mm from that
plane, and are commonly aimed at a 30–45° angle toward a wall, artwork, or
counter rather than straight down.

**Active / interactive state**: Powered/on — cone/pool of light rendered
similarly to a spot/bulb fixture — a soft downward or angled light cone plus
a floor/wall light pool matching the head's aim direction (not straight down
like a recessed can). Multiple heads on one circuit typically all switch
together (single `entity_id` for the whole track) — but if modeled per-head,
each head could carry its own on/off/dim for flexibility. No door/lid to
open; the only "moving part" state is aim direction, normally static (set
once during installation) but could be exposed as a user-adjustable property
for scene variety.

**Variations & customizations**: track shape (straight, L, T, X/plus, or a
closed rectangle loop); head style (cylinder "can" gimbal, cone/bell gimbal,
minimalist cube, mini pendant drop, low-profile magnetic-track puck with no
visible gimbal); head count per rail (2–6 typical for residential); finish
(black / white / nickel / bronze, single shared color-tint parameter for
rail + all heads); aim angle per head (straight down vs angled — exposed as
a per-head rotation for visual variety along a run); barn doors present/
absent for a more theatrical/gallery look.

**Animation opportunities**: *Idle* — none needed structurally, but a subtle
static light-pool render (angled cone, not vertical) sells "track" vs
"recessed can" at a glance. *Active (powered on)* — light cone/pool fade in
on toggle, matching each head's aim direction; if multiple heads share a
circuit, they should all illuminate together instantly (no per-head
stagger). *Fun/optional* — a slow, barely-perceptible gimbal "settle" wobble
when first switched on (mimics someone bumping the head), or letting a user
drag-rotate an individual head's aim in edit mode as a placement affordance.

---

## Floor lamp (+ torchiere uplight)

**Typical dimensions** (mm; converted from common trade sizing):

| Variant | Base Ø | Pole height (floor→shade bottom) | Overall height | Shade/bowl Ø |
|---|---|---|---|---|
| Standard (shade) floor lamp | 280–350 | ~1200–1350 | 1470–1630 (58–64″) | 400–500 |
| Reading lamp (shorter, task) | 250–300 | ~1050–1250 | ≤1470 (<58″) | 250–350 (drum/cone) |
| **Torchiere / uplight** | 300–380 (tripod ~330×290) | pole to bowl rim | **1780–1830 (70–72″)** | 250–400 open bowl |
| Arc lamp | 400–550 (heavy counterweight) | — | 1500–2000, arm reaches 900–1200 out | 350–500 |

**Shape breakdown** (primitives, local origin at floor center, +Z = front/
reading side):

- **Base**: flattened `cylinder` (disc), Ø per table × 30–50 mm tall — torchieres often read as a wide flat disc or a shallow 3-point tripod (3 short thin box/cylinder feet); standard shade lamps use a small round or square weighted disc.
- **Pole**: single slim `cylinder`, Ø 20–30 mm, running from base top to shade height. A reading lamp may add a bent/angled second pole segment (rotate a short cylinder ~15–30°) toward +Z.
- **Shade lamp head**: inverted-cone frustum (`cone`, tip up, wide bottom) or a plain `cylinder` drum, sized to the shade Ø, sitting so its bottom sits at ~seated-shoulder height (24–26″ / 610–660 mm above a seat, roughly pole-top).
- **Torchiere bowl**: an upward-opening `cone` (tip down this time, wide mouth up) or a shallow bowl approximated by a squat wide cylinder with a smaller cylinder "well" (no true boolean needed — just render as a cone/cylinder); light appears to come from inside the bowl, aimed at the ceiling.
- **Arc lamp**: pole rises ~300–400 mm then a swept arm (chain 2–3 short cylinder segments at increasing tilt, or one bent tube) reaches ~900–1200 mm horizontally to a small pendant-style shade (cone or sphere) hanging tip-down; the heavy counterweight base sits opposite the arm reach (offset −Z of the arm's overhang so it doesn't look like it'll tip).
- **Bulb glow**: small `sphere` inside shade/bowl, emissive material, only visibly "on" when active.
- No moving/openable parts in real life beyond a pull-chain/foot-switch/dimmer knob (tiny cylinder or box nub near the base or on the cord) — could be a clickable hotspot.

**Colors & finishes**: pole/base metals — brushed nickel, matte black,
oil-rubbed bronze, brass/gold, chrome — most common currently in matte black
and brass. Shade materials — fabric drum (white/cream/linen, beige, grey,
black), frosted/opal glass bowl (torchiere), rice-paper (Noguchi-style),
metal cone (industrial, black/white enamel). Wood/rattan poles as a warm-
finish variant.

**Placement**: **Floor**-resting only (defining trait of the category) —
living room beside a sofa/chair, bedroom reading corner, home office,
entryway corner. Torchieres specifically favor a room corner (uplight needs
open ceiling above, away from low shelving) — keep clear of low ceilings/
fans. No wall/ceiling mount variant (that would be a sconce/pendant, a
separate fixture).

**Active / interactive state**: OFF — bulb sphere emissive = 0, shade/bowl
material unlit tint only. ON — bulb sphere emissive lit warm-white/amber;
standard shade lamps cast a soft downward+sideways glow pool on the floor
near the base (small radius, since shade contains most light); **torchieres
should render a strong upward light cone/glow reaching the ceiling** — this
is their visual signature, worth a distinct ceiling-bounce highlight or a
soft vertical light shaft, to visually differentiate from a normal shade
lamp. Dimmable models could support a 2–3 step glow-intensity animation on
toggle (fade in/out ~0.3–0.5s) rather than a hard on/off pop.

**Variations & customizations**: shade lamp / torchiere / arc lamp /
reading (task) lamp as distinct kind presets (different silhouette, not just
a texture swap); finish palette swap (black / brass / nickel / bronze /
wood) on pole+base; shade color/material swap independent of pole finish;
multi-head torchieres (2–3 small reading-light arms branching off the main
pole partway up) as a "deluxe" variant; smart-bulb color variant (shade/
bowl glow tinted by an RGB color instead of fixed warm white).

**Animation opportunities**: *Idle* — none needed structurally (no fan/
moving air part) — optionally a very subtle flicker-free steady glow pulse
(breathing ±2% emissive) to read as "alive" rather than static art, à la the
fireplace flicker idiom but much subtler and non-random for calmness.
*Active (turn on/off)* — emissive fade in/out on the bulb sphere + a
matching floor-pool / ceiling-bounce glow fade, mirroring the existing
light-fixture on-glow animation pattern. *Torchiere-specific* — an animated
soft vertical "uplight shaft" (a very faint additive translucent cone from
bowl to ceiling) that fades in with power-on — gives torchieres a distinct
on-state silhouette versus a plain shade lamp's floor glow. *Optional
flourish* — a tiny pull-chain/cord swings briefly (a couple of damped
oscillations) on toggle click, echoing a real tug — cheap, small-amplitude
rotation on a thin cylinder/chain segment.

**Sources**: [Floor Lamp Height Guide – Homebaa](https://www.homebaa.com/blogs/lighting/floor-lamp-height-guide) · [Best Height for a Floor Lamp – Room-by-Room Size Guide](https://flyachilles.com/blogs/default-blog/best-height-for-a-floor-lamp) · [Floor Lamps Dimensions & Drawings – Dimensions.com](https://www.dimensions.com/collection/floor-lamps) · [Torch Floor Lamp Dimensions & Drawings – Dimensions.com](https://www.dimensions.com/element/torch-floor-lamp) · [How to Measure Torchiere Style Glass Shades – Grand Brass Lamp Parts](https://grandbrass.zendesk.com/hc/en-us/articles/201516270-How-to-Measure-Torchiere-Style-Floor-Lamp-Glass-Shades) · [Modern Torchiere Floor Lamps – Lumens](https://www.lumens.com/torchiere-floor-lamps/)

---

## Table lamp & desk lamp

**Typical dimensions** (mm, converted from trade-standard inches):

| Variant | Overall H | Base Ø | Shade Ø | Shade H | Notes |
|---|---|---|---|---|---|
| Compact table lamp | 460–560 | 130–180 | 250–300 | 200–250 | nightstand/accent size |
| Standard table lamp | 610–760 | 150–220 | 300–360 | 250–330 | most common; trade rule ≈ 1475–1625 mm total from floor (tabletop ~600 + lamp ~900–1000 for a seated sightline) |
| Oversized/console table lamp | 800–865 | 220–280 | 380–410 | 330–406 | console/buffet tables |
| Architect / swing-arm desk lamp (Luxo-style) | 500–850 extended (folds to ~250) | 170–290 (weighted disc) | shade/hood 180–220 dia | hood 150–200 | 2-arm articulated, clamp or weighted-base mount |
| Banker's lamp | 330–400 | 130–180 | 200–260 | 130–180 | brass stem + green glass dome shade, pull chain |
| Modern LED task lamp (flat-panel head) | 350–500 (folds lower) | 150–220 base | panel 250–350w × 20–30 thick | — | rectangular light bar instead of round shade |

**Shape breakdown**:

- **Base**: a cylinder (column lamp), or a sphere/ellipsoid squashed on Y for a ceramic urn/globe base, or 2–3 stacked cylinders of stepped diameter for a turned-wood look. Diameter 130–290 mm, height 100–350 mm depending on style.
- **Stem/neck**: a slim cylinder (8–20 mm dia) rising from base center to the shade's underside (harp). For architect lamps, replace the single stem with **two rigid cylinder arms (~250–300 mm each) joined by cylindrical pivot knuckles** (small cylinders/spheres as joints) — this is the poseable part; a third short segment holds the shade "head."
- **Shade**: the signature part — a **cone with the tip clipped** (frustum) is the closest primitive match for a drum/empire shade; fake it with a short cone plus a slightly-smaller inverted cone stacked, or two stacked cylinders of increasing radius (bottom wider than top). A true cylinder works for a straight drum shade. Banker's-lamp shades use a **half-dome (scaled sphere, bottom half only)** or a bent half-cylinder. Modern task-lamp "shades" are just a flat box (light panel).
- **Bulb/socket**: tiny sphere or short cylinder visible under the shade rim (only relevant when the shade is translucent or shade-less accent bulbs are used).
- **Front face**: none in the furniture sense — table/desk lamps are symmetric about the vertical axis. For gooseneck/swing-arm variants, "front" is wherever the shade currently points (the poseable/openable part).
- **Moving parts**: swing-arm pivots (2–3 rotational joints), gooseneck flex (model as 3–5 short cylinder segments with slight rotation offsets to fake a bendable tube), pull-chain (thin cylinder + small sphere bead) on banker's lamps, rotary/knob switch (small cylinder) or touch-button dot on modern lamps.

**Colors & finishes**: base materials — ceramic (glossy white/cream/blue/
terracotta), glass (clear, colored, mercury/antiqued), brass/bronze/antique
gold, brushed nickel, matte black/white metal, turned wood, resin/faux-
marble. Shade materials — fabric drum (linen white, cream, gray, black, or
bold color linings), paper/rice-paper (warm cream), glass (banker's lamp =
classic emerald green, sometimes amber or white milk glass), metal
(perforated or solid, industrial look). Desk-lamp finishes — matte black and
white dominate (architect style), plus brushed nickel, chrome, and brass-
accent variants; modern LED bars lean black/white/silver aluminum.

**Placement**: rests on a **counter/surface**: side/end tables, nightstands,
console/buffet tables, desks, credenzas. Typical supporting-surface height
500–650 mm (nightstand/desk), so the lamp's visual base sits at that height +
its own height. Never floor- or wall-mounted (that's the floor-lamp/sconce
category); never ceiling-hung. Desk lamps specifically cluster at desk-
height surfaces (~750 mm) and are commonly clamp-mounted to the desk edge
(clamp base) as an alternative to a weighted foot — same silhouette, just
swap the base cylinder for a small C-clamp shape.

**Active / interactive state**: ON — warm emissive bulb/shade glow, soft
radial light-pool decal on the supporting surface (same idiom as floor-lamp
pools, just smaller radius, ~250–400 mm), point/spot light enabled. OFF —
shade reads flat/dim, no pool decal, emissive stripped. Smart-bulb color/
brightness — glow tint and pool intensity should track HA `light.*`
color_temp/rgb + brightness attributes exactly like other Diorama light
fixtures. Banker's lamp toggle — brief pull-chain swing animation on state
change is a nice, cheap "was just touched" tell. Task-lamp dimmer touch — a
glowing touch-dot on the base that brightens/dims with the light level.

**Variations & customizations**: shade shape (drum/cylinder, empire/tapered
cone, bell, globe/sphere, rectangular panel); base style (single column,
urn/vase, stacked-disc, tripod — 3 splayed legs instead of a solid base,
clamp-mount); named archetypes worth offering as discrete kinds — standard
table lamp, banker's lamp (brass + green glass), architect/swing-arm desk
lamp, gooseneck desk lamp, modern LED panel task lamp, touch lamp (no
visible switch, just a base tap-target); finish presets (paired base+shade
color combos) rather than free color per primitive, to keep the sidebar
simple.

**Animation opportunities**: *Idle* — extremely subtle shade "settle" sway
if a nearby avatar bumps the table (optional, low priority); dust-mote
sparkles inside the light cone when on (reuse the floor-lamp light-pool
idiom). *Active/on-toggle* — eased brighten/dim tween on the emissive +
point light (no snap pop); banker's-lamp pull-chain swings and settles
(~0.5–1 s decaying oscillation) right after a toggle click. *Poseable
variants* — architect/gooseneck lamps could support a draggable "aim" — even
a static per-fixture stored joint-angle (like `lightRadius`/`lightHeight`
today) that lets a user tilt the head toward a desk for visual variety, with
no functional gameplay effect. *Smart color changes* — quick cross-fade of
the emissive/pool tint when HA reports a color_temp or RGB change, instead
of an instant color snap. *Seasonal/easter-egg* — rare flicker on old-style
banker's lamps (reuse the fireplace `Math.random()` flicker idiom sparingly)
for character, off by default.

---

## Wall sconce

**Typical dimensions** (W × D × H, projecting from wall face):

| Variant | Width | Projection (depth) | Height |
|---|---|---|---|
| Compact/half-moon (bath, hallway) | 100–180 mm | 60–110 mm | 150–250 mm |
| Standard (living/bed/dining) | 150–250 mm | 100–200 mm | 250–400 mm |
| Oversized/statement | 200–350 mm | 150–250 mm | 450–700 mm |
| Vertical bath bar (2–3 lamp) | 500–900 mm (horizontal) | 80–120 mm | 100–150 mm |

Backplate itself is small — round ~100–115 mm dia. or square ~100 mm,
sometimes an elongated oval up to ~500 mm for linear fixtures.

**Shape breakdown**:

- **Backplate**: flat cylinder (short, wide radius) or box, flush to wall — the mounting point, front face = local **+Z** (points into the room, away from wall).
- **Arm/stem** (optional, for "candle" or swing-arm styles): thin cylinder projecting +Z from backplate center, 40–150 mm.
- **Shade/diffuser**: the dominant visible mass — options:
  - *Half-cylinder or half-dome* (drum/half-moon style) — a cylinder or sphere clipped at the wall plane, flat side against backplate, open/glowing curved side facing +Z and up/down.
  - *Cone* (uplight/downlight shade) — cone apex toward wall, flared opening +Z ± up or down tilt.
  - *Box/rectangular panel* — flat box, frosted front face, common in modern hallway fixtures.
  - *Bare bulb / candle-style* — small sphere (bulb) on a stem, no shade, exposed emissive geometry.
- **Diffuser glass**: thin translucent box/cylinder cap in front of the bulb — give it a separate emissive material so it can glow independently of the metal shade color.
- No moving/openable parts in the vast majority of real sconces (fixed fixture); some picture-light/swing-arm variants pivot the arm, but that's a rare option, not core.

**Colors & finishes**: metal backplate/arm/shade finishes — matte black,
oil-rubbed bronze, brushed nickel/brushed steel, polished chrome,
antique/polished brass or gold, white, matte grey. Shade/diffuser materials
— frosted or clear glass, fabric drum (linen/cream/black), alabaster, ribbed
glass, opal acrylic. Common pairings: black or bronze metal + frosted glass
(modern); brass + linen shade (traditional); chrome + clear glass (bath/
vanity bar).

**Placement**: **Wall**-mounted only (occasionally paired flanking a mirror
or door). Living/dining/bedroom/hallway/entry: center of fixture 1500–1830
mm (60–72") above floor, eye level. Bedroom (flanking bed): 1400–1650 mm,
roughly 600–750 mm above mattress top. Bathroom flanking mirror: 1500–1650
mm; single sconce above mirror: 1900–2030 mm. Kitchen (over counter/sink):
counter height (≈900 mm) + 600 mm ≈ 1500 mm, or ~150 mm above a window
frame. Typically placed in pairs (flanking a mirror, fireplace, headboard,
or door) or evenly spaced along a hallway wall.

**Active / interactive state**: OFF — shade/diffuser reads as flat base-
color material, backplate/arm unlit. ON — diffuser/shade goes emissive
(warm ~2700–3000K glow); add a soft radial light-pool decal on the wall
behind/around it (like the existing pendant/spot pool treatment) and a dim
volumetric-feel bloom on the shade material. Dimmable variants — emissive
intensity scales with HA brightness attribute, matching existing light
pipeline conventions. No other state changes (no doors, no seasonal
variants) — visibility of the glow is the only "in use" signal.

**Variations & customizations** (good sidebar options, mirroring existing
`LightIconKind` pattern): shape (half-cylinder/drum, cone up or down facing,
box/panel, bare-bulb candle, swing-arm); size (compact / standard /
oversized — scale multiplier on the shade + backplate); orientation
(uplight — shade opens upward, good for washing a ceiling; downlight; or
both-open — cylinder open top+bottom); finish (metal color black/bronze/
nickel/brass/chrome/white × shade material frosted glass/fabric/clear/
alabaster as two independent color pickers, similar to how furniture tint
works today); mount style (single sconce vs. gang-pair — two sconces
symmetric about a shared centerline, e.g. flanking a mirror).

**Animation opportunities**: *Idle (off)* — none, static fixture. *On-state
transition* — emissive intensity ease-in/out on toggle (already the
convention for lights); optional soft flicker only for a "candle" bare-bulb
variant (reuse the fireplace `Math.random()` flicker idiom, sparingly).
*Active* — gentle warm-glow pulse tied to brightness changes (dimmer
slider), light-pool decal on the wall scaling/fading with intensity.
*Seasonal/contextual* — could join the existing "recent trigger" thought-
bubble tier (💡 on/off) when a nearby avatar reacts to it turning on/off,
same as other lights — no unique animation needed beyond the shared light-
toggle system.

---

## Under-cabinet lighting — puck and LED bar

**Typical dimensions**:

| Variant | Diameter / Length × Width × Height |
|---|---|
| Mini puck | ⌀32 mm × 15 mm H |
| Standard puck | ⌀65–80 mm × 10–15 mm H (most common: ⌀76 mm × ~10 mm) |
| Recessed/cast puck | ⌀70 mm × 25–35 mm H (deeper, drilled into cabinet bottom) |
| LED bar — short | 280–500 mm (11″–19″) × 20–90 mm W × 7–10 mm H |
| LED bar — standard | 500–900 mm (20″–36″) × 20–90 mm W × 7–25 mm H |
| LED bar — long | 1000–1830 mm (40″–72″) × 90 mm W × 10–25 mm H |

Pucks are sold in 3-packs wired in a daisy chain; bars are sold individually
or linked end-to-end to span a run of cabinets.

**Shape breakdown**:

- **Puck**: single flat `cylinder` (radius 35–40 mm, height 10–15 mm). Front face = the downward (−Y, ceiling-mounted to the cabinet underside) circular face, textured/colored as a frosted diffuser lens; a thin `cylinder` rim (1–2 mm taller, slightly larger radius, metal-tone) as the housing lip. Optional tiny `cylinder` nub off-center on the top face for a wired-daisy-chain connector (cosmetic, easy to skip).
- **LED bar**: one long flat `box` (length × 20–90 mm × 7–25 mm). Front/visible face = the bottom face (diffuser strip) — model as a slightly recessed or differently-colored long thin `box` insert running the length of the underside, standing in for the frosted acrylic lens. A `box` end-cap at each end (a few mm bigger in cross-section than the extrusion) reads well at low poly. No moving parts on either variant — both are static, wall/cabinet-mounted fixtures.

**Colors & finishes**: housing — matte white, black, or brushed nickel/
aluminum extrusion (bar); aluminum is by far the most common finish for bars
(heat-sinking). Lens/diffuser — frosted translucent white or warm-white
acrylic (light cream/off-white unlit color), swapping to a bright emissive
white/warm-white when the bound light is on. Puck housings — white or
brushed-nickel plastic/metal disc, sometimes bronze/oil-rubbed-bronze to
match cabinet hardware.

**Placement**: kitchen (most common — under upper cabinets above a counter/
backsplash), also bathrooms (under vanity cabinets/mirrors) and workshops/
garages (under shelving). Mount type: **wall/cabinet** — technically mounted
to the underside of an overhead cabinet, so treat it like a ceiling-mount
fixture attached to furniture rather than a wall or true ceiling: local
origin at the cabinet-bottom attach point, hanging just below the cabinet's
underside. Height in world terms: cabinet-bottom height is typically
1350–1450 mm above the floor (standard 900 mm counter height + ~450–540 mm of
cabinet-to-counter clearance) — fixture sits flush to that plane, front face
pointing straight down (−Y) onto the counter/backsplash below. Puck lights
are sometimes surface-mounted rather than recessed — protruding 10–35 mm
below the cabinet bottom; bars sit nearly flush (7–25 mm).

**Active / interactive state**: OFF — dim/unlit lens color, no glow. ON —
lens goes bright emissive (warm white ~2700–3000K typical, some CCT-
adjustable models shift cooler); cast a soft rectangular (bar) or circular
(puck) pool of light onto the counter/backsplash below — mirrors the
existing 2D "light on-glow" / 3D floor-pool-disc pattern already used for
ceiling lights, just projected onto the counter surface instead of the
floor. Many bars/pucks are dimmable or have color-temp presets — could
support a brightness-driven glow intensity and a warm↔cool tint slider like
other `Light` fixtures. Motion-activated versions (occupancy sensor built
into an end-cap) exist — flick on transiently when a nearby target/avatar
dwells at the counter, independent of a bound HA entity.

**Variations & customizations**: puck vs. bar as the two headline kinds
(`LightIconKind`-style split), each with size variants (mini/standard/
oversize puck; short/standard/long bar) parametrized by radius or length;
finish variant (white vs. black vs. brushed-nickel/aluminum housing); CCT
variant (warm white / cool white / RGB-accent — same primitive with an
adjustable emissive tint); wired vs. battery/wireless-puck (no visible cable
run needed for battery variant — a modeling simplification option); multi-
puck chain (3 pucks with a thin cable/line strung between, for the "daisy
chain" look) vs. single continuous bar.

**Animation opportunities**: *Idle (off)* — none, static fixture, no
ambient motion needed beyond existing dust-mote/ambient scene effects.
*Active (on)* — emissive intensity ramp on toggle (quick fade-in/out
~150–250 ms rather than an instant snap, matching other light fixtures);
soft counter-pool glow appears/disappears in sync. *Dimmer support* — glow
radius/intensity scales continuously with HA brightness attribute, same as
ceiling lights. *CCT shift* — if bound to a tunable-white entity, lens
emissive color eases between warm and cool tones over the same fade window.
*Occupancy/motion variant* — brief auto-on glow pulse when an avatar/target
lingers at the counter below, auto-off after a few seconds of no dwell — a
nice small "someone's making a snack" ambient touch that also feeds the
existing kitchen-night thought-bubble tier.

---

## Bathroom vanity light bar

**Typical dimensions** (mounted horizontally above a mirror; backplate +
globes):

| Variant | Width (bulb count) | Backplate H | Projection (depth) | Globe Ø |
|---|---|---|---|---|
| Compact (2-light) | 300–460 mm | 100–130 mm | 90–130 mm | 110–130 mm |
| Standard (3-light) | 460–610 mm | 100–130 mm | 90–130 mm | 120–140 mm |
| Standard-large (4-light) | 610–915 mm | 100–130 mm | 90–130 mm | 120–140 mm |
| Oversized/Hollywood (5–8-light) | 915–1700 mm | 100–130 mm | 100–150 mm | 100–130 mm (often smaller, more numerous bulbs) |

Mounting center height: ~1900–2000 mm AFF (75–80 in, the classic "eye level
over mirror" rule); bottom edge typically sits 50–150 mm above the mirror
top.

**Shape breakdown**:

- **Backplate**: one flat, wide `box` (width × ~110 mm tall × ~25–35 mm deep) flush to the wall — the mounting strip.
- **Globes/bulbs**: a row of `sphere` (or lightly flattened sphere / short `cylinder` capped with hemispheres for "drum" styles) evenly spaced along the backplate's long axis, each on a short `cylinder` stem (~20–30 mm Ø × 40–70 mm) projecting forward (local **+Z**, since it mounts on a wall the "front" is the room-facing face) from the backplate. Spacing: globes centered, even pitch = width / count, e.g. a 610 mm 4-light bar ≈ 150 mm pitch.
- Optional **Hollywood-strip variant**: skip the backplate box; render only the row of stem+globe units directly against the wall (mirror-frame style) — visually reads as "just bulbs."
- No moving parts; some styles include a thin frosted **cylinder** or squashed-sphere shade over each bulb instead of a bare globe (opacity ~0.6–0.8 to suggest frosted glass).

**Colors & finishes**: backplate/stem metal finishes — matte black,
brushed nickel/chrome (silver-grey, slightly reflective), brass/gold (warm
yellow-metal, increasingly popular), bronze/oil-rubbed (dark brown-black),
white. Globe/shade material — clear glass, frosted/opal white glass (most
common — soft glowing sphere), or bare exposed Edison-style amber bulb
(vintage look, visible filament tint). Emissive glow color — warm white
(~2700–3000K, yellowish tint) is most common in residential; some modern
fixtures run cool white (4000K+, neutral/blue-white).

**Placement**: room — **bathroom** only (occasionally a walk-in-closet
vanity). Mount type: **wall**-mounted, centered above (or beside) the
mirror/vanity mirror, horizontal orientation. Center height ~1900–2000 mm
AFF; occasionally two vertical bars flank the mirror instead (sconce-pair
style) at ~1500–1700 mm center height. Depth: sits nearly flush, projecting
only 90–150 mm off the wall face.

**Active / interactive state**: OFF — dim/unlit globes, matte material, no
glow. ON — globes switch to an emissive material (warm/cool white per
finish) + optionally a soft point-light per bulb (or one averaged point
light along the bar) to cast light on the mirror/counter area below. Could
pulse brightness briefly on toggle (quick 0.2s ease) to sell the "switch
flip" moment; a subtle warm glow bloom on the wall behind the bar sells
"vanity lit" mood at night presets.

**Variations & customizations**: bulb count (2 / 3 / 4 / 5 / 6 / 8-globe
options, width scales accordingly); globe shape (sphere — classic, drum/
cylinder shade, bare bulb — vintage/Edison, squared/cube shade — modern
minimalist); finish (black / nickel / chrome / brass / bronze / white —
reuses the existing light-fixture finish palette); orientation (standard
horizontal bar over mirror vs. two vertical side bars flanking the mirror);
backplate style (bar-strip — visible plate — vs. minimal/hidden mount —
Hollywood strip, bulbs only).

**Animation opportunities**: *Idle (off)* — none, fully static fixture.
*Toggle on/off* — emissive intensity ease-in/out (~150–250 ms) rather than
a hard pop; optional 1-frame brighter "flicker" flash for cheap fluorescent-
tube variants (if ever added) using the existing fireplace-style
`Math.random()` flicker idiom — but standard incandescent/LED vanity bars
should NOT flicker (steady glow only, per real-world expectation).
*Scene-linked* — warmer/dimmer tint at night preset, brighter/cooler at day
preset, matching existing `applyScenePreset` light-level tuning. *Bathroom
activity tie-in* — could brighten slightly or cast a stronger floor-pool
glow while a rig is anchored at a `wash_hands`/`bathe` activity spot below
it, reinforcing "someone's using the vanity."

**Sources**: [How To Determine Bathroom Vanity Light Sizes – LITELUME](https://litelume.com/how-to-determine-bathroom-vanity-light-sizes/) · [Vanity Light Size Guide – Homebaa](https://www.homebaa.com/blogs/lighting/vanity-light-size-guide) · [The Complete Bath Light Sizing Guide – LightsOnline](https://www.lightsonline.com/blog/guides/the-complete-bath-light-sizing-guide/) · [Vanity Light Height – The Home Depot](https://www.homedepot.com/c/ab/vanity-light-height/9ba683603be9fa5395fab9071c7b70f) · [Vanity Light Sizing Guide – Southern Lights Electric](https://www.southernlightselectric.com/blogs/journal/vanity-light-sizing-guide) · [Ideal Vanity Light Height – Lumina Pro](https://www.luminapro.co/blogs/beautycorner/ideal-vanity-light-height) · [3 Light Vanity Light Size Guide – Coohom](https://www.coohom.com/article/3-light-vanity-light-size-guide) · [Light Fixtures Sizing Guide For Bathroom Vanities – MTD Vanities](https://mtdvanities.com/blogs/posts/light-fixtures-sizing-guide-for-bathroom-vanities-all-sizes)

---

## Picture light and art light

**Typical dimensions** (shade/bar length × wall projection × height of
housing):

| Variant | Length | Projection | Housing height |
|---|---|---|---|
| Compact (small frames) | 250–300 mm (10–12″) | 120–150 mm | 60–90 mm |
| Standard swing-arm (most common) | 450–610 mm (18–24″) | 150–240 mm | 70–100 mm |
| Oversized (large art/mantels) | 760–900 mm (30–36″) | 200–250 mm | 80–110 mm |
| LED slimline/linear bar | 300–900 mm | 40–70 mm (near-flush) | 30–50 mm |

Mounting bracket/backplate: ~110 × 25 mm disc or small rect plate. Rule of
thumb sizing: shade ≈ half the artwork's width, centered above it.

**Shape breakdown**:

- *Wall night light — see below for the small plug-in variant; this section covers the wall-mounted picture/art light*: one **backplate/mount** — small flattened cylinder or box (Ø ~40–50 mm, 15–25 mm deep) flush on the wall.
- **Arm**: one or two thin cylinders (Ø 10–15 mm) — a short vertical stub off the backplate, then a horizontal (or gently downward-angled) arm projecting outward (local +Z "front" = outward from the wall, over the art). Swing-arm styles hinge at the wall AND at the shade for adjustable reach — a modeler can rig this as a fixed elbow, no need for real articulation.
- **Shade/head**: the signature part — a long shallow half-cylinder or trough (a cylinder sliced along its length, open underside) OR a slim rectangular box with a curved cross-section, spanning the "Length" dimension above, oriented parallel to the wall (its long axis = world X when wall-mounted on a vertical wall, tilted a few degrees downward at its front lip to aim light at the art below). LED slimline variants: just a thin flat box/bar, no visible shade cavity.
- **Bulb/LED strip hint**: a thin emissive cylinder or box tucked inside the shade's opening, hidden until "on."
- No moving parts needed for a static Sims-style build; a swing-arm's hinge can be modeled as a fixed bent arm (compound of 2 cylinders at an angle) rather than an animatable joint.

**Colors & finishes**: brushed/antique brass, polished nickel, oil-rubbed
bronze, matte black, brushed steel, white, and (traditional wood-look)
walnut/mahogany-stained composite for gallery styles. Shade material reads
as painted metal (matte or satin, occasionally with a subtle turned/
scalloped edge on traditional designs); LED slimline bars are usually matte
black or white aluminum extrusion.

**Placement**: **wall**-mounted, always paired with hanging art/a mirror/a
shelf of frames — living rooms, hallways, stairwells, dining rooms, home
offices, galleries. Mount height: centered horizontally over the artwork,
positioned so the shade's bottom lip sits roughly 150–250 mm above the top
edge of the frame (absolute height varies with art placement — typically
1800–2100 mm off the floor for eye-level art). Cordless/battery variants may
also perch on a mantel or shelf ledge resting flat rather than wall-fixed —
treat as the same geometry, just resting instead of bracket-mounted.

**Active / interactive state**: when "on," the light casts a warm elongated
pool/wash down the wall onto the art below (a stretched elliptical or
rectangular glow cone matching the shade's long trough shape, wider at the
bottom) — visually distinct from a downlight's round pool. Some
rechargeable models show a tiny status LED dot on the backplate (charging/
low battery) — a nice-to-have emissive detail. No seasonal or occupancy
behavior; it's a manual toggle or dimmer like any other light entity.

**Variations & customizations**: power type (hardwired — no visible cord;
plug-in — visible cord run down the wall to an outlet, could be modeled as
a thin dropping cylinder; battery/rechargeable — fully cordless, sometimes
magnetic-mount, no arm needed — just a slim bar directly on the frame's top
rail); style (traditional brass swing-arm with curved/scalloped shade vs.
modern slimline LED bar, minimalist rectangular); adjustability (fixed-angle
vs. articulating arm/shade — tiltable head); size (3 lengths — small/
medium/large — scaling to frame width as in the table above); color
temperature (warm 2700–3000K, typical/gallery-accurate, vs. cooler
4000–6500K options on cheaper battery units).

**Animation opportunities**: *Idle* — none needed structurally, but a
subtle warm flicker-free steady glow (unlike a fireplace) sells "on"; a
faint ambient dust-mote shimmer in the light cone is optional flourish.
*Active (on-toggle)* — fade the shade-interior emissive + wall-wash decal
in/out over ~0.2–0.3 s on state change (matches the existing light on/off
convention); brightness slider maps to wash opacity/intensity like other
`Light` fixtures. *Battery/status flourish* — a slow-pulsing tiny red/green
status dot when charging, distinguishing battery variants. No moving parts
warrant real-time animation (arm/shade are static once placed), so this
fixture is otherwise a "dumb" light like a sconce — same interaction model
as `LightIconKind: 'sconce'`, but with an elongated/rectangular wash instead
of a radial one and mounted noticeably higher, always paired visually with
wall art.

---

## Ceiling fan with light kit

**Typical dimensions**:

- **Blade span (diameter)** — the controlling size spec: compact 760–900 mm (30–36 in, bedrooms/small rooms); standard 1070–1220 mm (42–48 in, most common bedrooms/dens); large 1320–1370 mm (52–54 in, living/great rooms); oversized 1520–1830+ mm (60–72 in, great rooms/lofts).
- **Motor housing (body)** — roughly 300–400 mm diameter × 250–350 mm tall, blades mount around it at a slight downward pitch (~12–14°).
- **Downrod** — standard 75–150 mm (3–6 in) included; extension rods sold 300–1800 mm for tall ceilings. Rod diameter ~19 mm (3/4 in).
- **Integrated light kit** adds ~100–250 mm of extra height below the motor housing (bowl/frosted globe or a slim LED disc).
- **Blade count**: usually 3, 4, or 5 blades ~130–180 mm wide.
- **Mounting clearance**: fan blades should sit ≥ 2100 mm (7 ft) above floor and ≥ 200 mm (8 in) below ceiling; optimal blade height ≈ 2440–2740 mm (8–9 ft) above floor.

**Shape breakdown**:

- **Ceiling mount**: small flush box/dome against the ceiling (cylinder, flattened, ~150 mm dia).
- **Downrod**: thin cylinder (the visible connector, 75–150 mm typical, longer on tall ceilings).
- **Motor housing**: squat cylinder or slightly tapered drum (the "body"), front/underside faces down (local −Y in world, treat "front" as the light-facing underside).
- **Blades**: 3–5 thin flat boxes (long rectangular paddles, slightly angled/pitched), radiating from the housing at even angular offsets — arrange procedurally around the Y-axis.
- **Light kit**: mounted centered on the underside of the housing — a small cylinder stem + a sphere or flattened dome (frosted glass bowl) enclosing 1–3 bulb spheres, OR a slim flat disc (modern LED-integrated fans) flush to the housing bottom.
- **Pull chains** (traditional models): two thin cylinders with small sphere/acorn pulls hanging from the housing — optional detail, skip on modern remote-control variants.
- No moving/openable parts besides the rotating blades and (rarely) a manually-adjustable light-bowl.

**Colors & finishes**: blades — matte white, walnut/wood-tone (brown),
black, or dual-finish reversible (white one side / wood the other — a
common real product feature). Housing/motor — matte black, brushed nickel,
oil-rubbed bronze, white, brushed brass/gold, or matte white — should match
blade-arm color. Light kit shade — frosted/opal glass (white, translucent),
clear seeded glass, or a flat white acrylic LED lens on modern low-profile
fans. Materials read as painted metal (housing/blade irons) + wood-look
composite or stamped-metal blades + glass/acrylic shade.

**Placement**: **ceiling**-hung (mounts on ceiling via bracket + downrod, or
flush "hugger" mount for low ceilings — no downrod, housing sits ~230–250 mm
below ceiling). Rooms: bedrooms, living rooms, family rooms, covered patios/
porches (damp/wet-rated variants), home offices. Placed centered in the room
or over the primary seating/bed area; needs ≥ 460 mm (18 in) clearance from
walls.

**Active / interactive state**: fan running — blades visibly spin (animate
rotation about the vertical axis) at variable speed (low/med/high) — could
drive rotation speed off a HA fan-speed attribute/percentage. Light on/off —
light-kit glow (emissive bump on the shade + soft downward glow pool on the
floor, same idiom as other Diorama lights) tied to the bound `light.*`/
`fan.*` entity's light sub-state. Reverse mode (winter setting) — blades
spin the opposite direction, a nice subtle detail if ever exposed, otherwise
skip. Idle/off state: blades static, light dark.

**Variations & customizations**: size tiers (compact / standard / large /
oversized, as above) — offer as a scale or discrete kind; style variants
(modern low-profile — hugger, no visible downrod, integrated flush LED disc,
no pull chains; traditional — 5-blade wood-tone, pull chains, frosted glass
bowl light; industrial — matte black, exposed-look housing, cage-style
light; outdoor/patio — weatherproof look, often ABS blades, simpler housing,
same geometry, just recolor); with vs. without light kit (blade-only fans —
light kit sphere/dome simply omitted); blade finish (single-color vs.
reversible two-tone); remote/wall-control vs. pull-chain (purely cosmetic —
presence of chain cylinders).

**Animation opportunities**: *Idle* — near-imperceptible micro-sway or
none (fans at rest don't animate — reserve motion budget for active state).
*Active (fan on)* — continuous blade rotation, speed keyed to fan speed/
percentage (slow/med/fast); optional subtle housing hum/vibration wobble at
high speed. *Active (light on)* — emissive shade + downward glow pool,
consistent with other Diorama light fixtures; could flicker briefly on
toggle for a "power up" feel. *Pull chain toggle* (if modeled) — a quick
swing/settle animation on click, matching the physicality of other
clickable fixtures. *Direction reversal* — instantaneous spin-direction
flip if a "reverse"/winter mode is ever surfaced.

**Sources**: [How to Measure a Ceiling Fan – Hunter Fan](https://www.hunterfan.com/pages/how-to-measure-a-ceiling-fan) · [Ceiling Fan Buying Guide – Lowe's](https://www.lowes.com/n/buying-guide/ceiling-fan-buying-guide) · [Ceiling Fan Basics – ENERGY STAR](https://www.energystar.gov/products/ceiling_fans/ceiling_fan_basics) · [Ceiling Fan Size Guide – Lighting and Bulbs Unlimited](https://lightingandbulbsunlimited.com/blogs/l-b-u/how-to-size-a-ceiling-fan) · [The Ultimate Sizing Guide – Southern Lights](https://southernlightsinc.com/blog/the-ultimate-sizing-guide-how-to-choose-the-right-ceiling-fan-for-your-room/) · [What downrod length should I purchase – Hunter Fan Support](https://support.hunterfan.com/hc/en-us/articles/360042825653-What-downrod-length-should-I-purchase-for-my-fan) · [How to Choose a Ceiling Fan – The Edit by Lumens](https://the-edit.lumens.com/the-guides/how-to-choose-a-ceiling-fan/)

---

## LED strip / tape / cove lighting

**Typical dimensions**: this is a *linear system*, not a discrete object —
model as one or more thin runs of arbitrary length. Real-world tape: 8–12 mm
wide × 2–3 mm thick (adhesive-backed COB/SMD tape), sold in reels and cut/
run to length; aluminum channels that house it (for a crisp diffused line)
run 15–25 mm wide × 7–19 mm high, with common surface-mount channel ≈17 mm ×
9 mm and recessed/plaster-in channel ≈25 mm × 7.5 mm. For Diorama's purposes,
give the modeler a **run length parameter** (common presets: 600 / 1200 /
2400 / 3000 mm, or "full wall/perimeter") rather than a fixed footprint.

**Shape breakdown**: a single thin `box` per run segment, `runLength × 12mm
× 6mm` (tape) or `runLength × 20mm × 10mm` (channel variant with a slightly
rounded emissive top — approximate the diffuser as a lighter/emissive-
tinted box cap rather than a true rounded profile). No moving parts. "Front"
(local +Z) is irrelevant for straight runs — orient along whichever wall/
edge/underside it's tracing; corner runs are 2+ segments meeting at a
mitred joint (just butt two boxes, no chamfer needed at this fidelity). For
**cove lighting** specifically, mount the box recessed into a ceiling ledge/
soffit lip so only its glow is visible, not the strip itself — pair it with
a thin (≈100–150 mm deep, wall-colored) soffit box the strip tucks behind.

**Colors & finishes**: strip body — white or black PCB/adhesive backing
(rarely visible once installed); aluminum channel finishes — mill silver,
white, or black anodized; diffuser lens — frosted/opal white (soft, no
visible LEDs) or clear (visible individual LED dots). Emitted light color is
the customizable part: warm white (~2700–3000K, warm-amber tint), neutral/
cool white (4000–6500K, blue-white tint), or full RGB/RGBIC (any hue, often
shown as a gradient across the run in real products).

**Placement**: highly flexible — the one fixture that legitimately spans all
four mounting categories:

- **Ceiling** — cove/crown-molding runs hidden in a ceiling perimeter recess (uplight wash), typically at ceiling height (~2400–2740 mm) tucked into a soffit lip.
- **Wall** — behind a floating shelf, headboard backlight, stair-riser accents, or a TV bias-light run mounted directly to the wall.
- **Counter/surface** — under-cabinet kitchen strip mounted to the underside of upper cabinets (~1400–1500 mm height), lighting the counter below.
- **Floor** — toe-kick lighting under lower cabinets/stair treads (near-floor, ~50–150 mm).

Rooms: kitchens (under-cabinet/toe-kick), living rooms (TV bias/shelf/cove),
bedrooms (headboard cove), stairs (riser accents), home theaters (full cove
perimeter).

**Active / interactive state**: the whole fixture IS the light source, so
"on" = the strip box itself becomes emissive (color/brightness from the
bound `light.*` entity) rather than lighting a separate bulb — visually the
most direct one-to-one mapping of any fixture to HA state. Off = the box
reverts to its unlit channel/diffuser color (dim white/grey, no glow).
Color-changing (RGB) strips should show the actual HA color, not just warm/
cool white. Optional soft bloom/glow quad along the run (like the existing
floor-pool glow, but as a thin line-light halo along the wall/ceiling
surface it's mounted to) sells the "wash" effect cove/bias lighting is
prized for.

**Variations & customizations**: mounting context (cove/ceiling, under-
cabinet, toe-kick, bias/shelf, stair-riser, corner/coving V-channel); strip
width/profile (slim tape vs. boxier aluminum channel); diffuse vs. dotty
(visible LEDs) look; static warm/cool white vs. full RGB/RGBIC; single run
vs. multi-segment perimeter loop (auto-trace room/ceiling perimeter as a
nice power feature, since Diorama already tracks wall loops).

**Animation opportunities**: *Idle* — a very slow, subtle brightness
"breathing" only if HA reports an effect mode (most strips are static once
on); a barely-there flicker is NOT appropriate here (that's the fireplace's
signature — don't reuse it). *Active* — instant color/brightness swap on
state change (no fade needed at this fidelity, though a quick ~150 ms eased
cross-fade between colors would read nicely and is cheap); for RGBIC/
effect-mode strips that HA reports as `effect: rainbow` or similar, an
optional slow hue-cycle shader-free approximation (cycle the emissive color
over several seconds) could distinguish "effect mode" from solid-color mode.
Consider tying its glow into the existing "activity" pool-glow system so an
on cove-light contributes ambient light-detection like any other light
fixture.

**Sources**: [What LED Strip Widths Are Available? – SuperLightingLED Blog](https://www.superlightingled.com/blog/what-led-strip-widths-are-available/) · [How to Choose the Right LED Strip Width – Sparkle Star Lighting](https://www.starledprofile.com/how-to-choose-the-right-led-strip-width/) · [Low Profile Aluminum Channel, 17mm x 9mm – Lumicrest](https://lumicrest.com/product/low-profile-aluminum-channel-for-led-strip-surface-mount-2-5m-8ft-17-mm-wide-x-9-mm-high/) · [Recessed Mounted Aluminum Channel (5pack) – HitLights](https://hitlights.com/products/aluminum-channels-recessed) · [Recessed Ceiling Cove Light Aluminum Profile, 10mm – SuperLightingLED](https://www.superlightingled.com/recessed-ceiling-cove-light-aluminum-profile-for-10mm-led-strip-lights-p-4766.html) · [VBD-CH-D10 Plaster-In Cove LED Aluminum Channel – Veroboard](https://veroboard.com/products/vbd-ch-d10-plaster-cove-aluminum-channel-2-4meters94-4in-and-3meters118in)

---

## Exterior floodlight and security light

**Typical dimensions**:

| Variant | Width (mounting spread) | Height | Depth (wall projection) | Notes |
|---|---|---|---|---|
| Residential dual-head motion light (most common "security light") | 350–450 mm (head-to-head) | 150–200 mm | 200–260 mm | Two adjustable PAR38/PAR20 lamp heads on a center junction-box plate |
| Residential triple-head | 450–550 mm | 150–200 mm | 200–260 mm | Same as above + a third head, often on a longer bar |
| Commercial LED wall pack (flat/full-cutoff box) | 250–360 mm (W) | 200–300 mm (H) | 100–150 mm (D) | Rectangular slab, forward-throw lens, no moving heads |
| Compact single floodlight ("bullet"/"QT" style) | 130–180 mm dia. | 150–220 mm long | — | Single cylindrical head on a small wall bracket, fixed or slightly adjustable |

**Shape breakdown** (dual-head residential — the archetype to model first):

- **Base plate**: flat box or shallow cylinder, ~120–150 mm dia./side × 25–40 mm thick — mounts flush to the wall (the "front face," local +Z).
- **PIR sensor**: small dome or faceted hemisphere, ~45–60 mm dia., centered on the base plate protruding ~20–30 mm forward — approximate with a sphere clipped by a box, or a squat cone.
- **Yoke arms**: two thin bent cylinders/boxes (~15 mm dia.) extending outward and forward from the base plate, one per lamp head — these are the pivot/swivel points.
- **Lamp heads**: each a short cylinder capped with a slightly domed front (cone or lathe-like taper works as a stand-in) ~120–130 mm dia. × 150–180 mm long, holding a "bulb" — model the bulb as a subtle lighter-color cone/hemisphere inset in the head's open face. Heads tilt independently on the yoke (pitch) and swivel (yaw) — this is the openable/adjustable part.
- **Commercial wall pack** instead: single rectangular box (flat back against wall, front face is a lens panel — a slightly recessed/darker box face or thin glass-like plane) with a shallow visor lip (thin box overhang) above the lens to cut glare — no moving parts.

**Colors & finishes**: dominant residential finishes — bronze/oil-rubbed
bronze, black, white, occasionally gray/graphite. Material read: textured/
matte powder-coated die-cast aluminum or ABS plastic housing; lamp-head
front face reads as dark tinted plastic/glass (slightly glossy) around a
bright "lens." Commercial wall packs: mostly dark bronze or graphite gray
anodized aluminum, sharp flat surfaces, glossy polycarbonate lens.

**Placement**: **wall**-mounted, exterior only — garages, eaves, back
doors, driveways, barns, loading docks. Residential motion lights: typically
2100–2700 mm above grade (just under the eave or beside a garage door).
Commercial wall packs: 2700–4300 mm (above doors/loading docks, sometimes
higher on warehouse walls). Front face (+Z) points outward/downward-ish
from the wall into the yard/lot being illuminated; heads are usually aimed
down at ~20–35° from horizontal.

**Active / interactive state**: off (idle) — heads dark/matte, no glow,
static. Triggered/on — emissive bright cone/disc from each lamp face; a
broad, soft ground-projected light pool (two overlapping ellipses for
dual-head) fading with distance — same "pool decal" technique as other
Diorama lights, just angled/directional rather than a floor disc. Dusk-to-
dawn behavior — many units auto-trigger at dusk regardless of motion (could
tie to time-of-day preset the same way a porch light would) plus a brief
brighter "motion flash" state on detection before dimming back. Optional PIR
"detecting" cue — a faint sensor-dome glow or tiny pulse when a target is
nearby, for debug/visual feedback of the bound `binary_sensor`.

**Variations & customizations**: head count (single / dual / triple);
finish (bronze, black, white, gray); fixture family (residential
adjustable-head PIR light vs. flat commercial wall pack vs. compact single
bullet light vs. decorative gooseneck/barn-style floodlight — arched arm,
cage-guarded lamp, farmhouse aesthetic); lens tint (clear vs. frosted vs.
amber — sodium-vapor throwback for a "dusk to dawn" retro look); mount style
(direct wall-plate vs. arm/gooseneck standoff, offsetting the fixture
150–300 mm from the wall).

**Animation opportunities**: *Idle* — none needed (static fixture);
optionally a very subtle sensor-dome micro-glint/reflection cycle to read as
"live" tech. *Active/triggered* — emissive intensity ramp-up (instant
snap-on, like the fireplace-flicker idiom but a clean step rather than
random flicker), light-pool decal fade-in, and — most fun — a quick
head-swivel micro-adjustment the first time it's triggered (like it's
"waking up" to track), settling back to its aimed position. Could reuse the
same per-frame `Math.random()`-driven idiom as the fireplace flicker for a
very subtle stray insect/moth flicker while lit (cheap, optional, on brand
for a bug light). *Seasonal/context* — dim/warm color shift at dusk vs. a
cooler white at full night could tie into the existing `resolveScenePreset`
day/dusk/night buckets already used for scene lighting.

---

## Porch / coach / wall-lantern exterior light

**Typical dimensions** (W × D × H, mm — W/D measured across the lantern
body, not counting the mount arm):

| Variant | Width | Depth (wall extension) | Height |
|---|---|---|---|
| Compact/mini (acorn, cylinder) | 125–150 | 130–185 | 185–265 |
| Standard coach lantern | 150–180 | 150–185 | 320–390 |
| Large/oversized (estate, "Resort"-class) | 265–305 | 250–335 | 450–500 |
| Square backplate/canopy (all sizes) | ~110–130 wide × 130–140 tall | — | — |

Sources cluster tightly: Progress Lighting "Roman Coach" small/medium run
330–390 mm tall × 145–180 mm wide with a 145–185 mm wall extension; a basic
8" coach light ≈ 200 mm tall; large estate lanterns (e.g. "Resort"
collection) reach ~500 mm tall × 265 mm wide. Build 3 size presets:
**compact** (150w×150d×230h), **standard** (170w×170d×360h), **oversized**
(280w×280d×480h).

**Shape breakdown** (local origin = wall-mount point, +Z = outward from
wall / the direction it shines):

- **Backplate**: flat box or octagon-ish box, ~120w × 130h × 15d mm, flush to the wall, sits *behind* everything else (−Z-most element).
- **Mounting arm** (traditional coach style only): short box or cylinder bracket projecting +Z ~30–50 mm from the backplate before flaring into the cage.
- **Cage/lantern body**: the signature shape — a **cylinder or square prism** (the "cage") capped top and bottom, with 4 thin vertical box "muntins"/mullions spaced around it standing proud of a slightly-recessed glass cylinder (model the glass as a separate slim translucent cylinder inset a couple mm, muntins as 4 thin long boxes at 0/90/180/270°). Height is ~55–65% of total fixture height.
- **Roof/finial cap**: a **cone** (pagoda/pyramid style) or shallow **cone frustum**, often with a small **sphere** finial ball on top (acorn styles are literally a sphere-topped cone).
- **Base**: mirrored smaller cone or a flat cylinder cap, sometimes with a small drip-ring box.
- **Bulb**: single small sphere/cylinder candelabra bulb visible through the cage glass (2nd sphere for double-bulb "2-light" variants).
- No moving parts in real life (fixed glass cage — most aren't hinged for access, though a few have a hinged door on the cage back).

**Colors & finishes**: matte/textured **black** (dominant modern choice) and
**oil-rubbed/antique bronze** are by far the most common; also matte white,
brushed nickel/satin silver/pewter, aged copper (patinas green over time —
worth an optional weathered-copper texture variant), and dark bronze. Glass
is typically clear seedy/water/ribbed textured glass (slightly frosted
look) — occasionally amber "hurricane" tint or opal white for a soft glow.

**Placement**: **wall**-mounted only — flanking the front door, garage
door, or a side/back entry. Mounting height (backplate center) ≈ 1500–1650
mm above the porch floor (60–66 in "eye level" rule; center of fixture, not
top), roughly 150 mm horizontal offset from the door jamb. Rarely also used
on porch posts/columns (still wall-equivalent mount, same primitives).

**Active / interactive state**: primary interactive element is simply
on/off — the bulb sphere/cylinder gets an emissive material and the cage
glass cylinder gets a soft glow + a warm circular light pool decal on the
wall/ground below it (reuse the existing floor-pool + `_mat` emissive
idiom). Dusk-to-dawn/photocell fixtures are common in reality — could tie
"on" state to a `light.*`/`switch.*` entity exactly like other Diorama
lights. No occupancy-driven visual change beyond on/off (no motion-flicker
expected, unlike the fireplace).

**Variations & customizations**: style (traditional coach lantern — cage +
roof cap; craftsman/mission — squared-off cage, flat-top; cylinder/tube —
minimalist, no roof cap, just a capped cylinder; acorn/globe — sphere-
dominant, minimal cage; square-panel lantern — flat glass panes instead of
curved cage); size (compact / standard / oversized, table above); light
count (1-light standard vs 2-light stacked bulbs, taller cage); mount style
(wall-arm coach light vs. flush/semi-flush "small square" variant, shorter
extension ~60–90 mm depth, for tight clearances); finish swap (black /
bronze / white / nickel / copper, material-only, no geometry change).

**Animation opportunities**: *Idle (off)* — essentially static; optional
very subtle glass "glint" specular sweep at dusk transition is overkill —
treat as static. *Active (on)* — emissive bulb + cage-glass glow ramps up/
down over ~0.3 s on toggle (not instant) to feel tactile; soft warm light-
pool decal on the wall/porch ceiling/ground fades in with it; at night
presets, a very subtle moth/bug-swarm particle sprite loop near the cage
would sell "porch light at night" (optional/low-priority flourish, same
idiom as weather particles); a slight cyclic warm-flicker (like the
fireplace flicker, at a much lower magnitude) as an alternate "old bulb /
storm" easter-egg state could be a fun optional variant but should default
OFF since it's not standard behavior for this fixture (unlike the
fireplace, which is expected to flicker).

---

## String / fairy / festoon lights

**Typical dimensions** (whole-strand footprint is user-defined — a bent
catenary curve; these are per-bulb / spacing specs to build a repeatable
segment):

| Variant | Bulb size (mm) | Spacing (mm) | Wire gauge | Typical strand length |
|---|---|---|---|---|
| Micro/fairy LED (rice-grain) | ⌀2–3 × 4–5 long | 50–100 (dense) | 0.3–0.5 mm enamel/copper, near-invisible | 2–10 m (battery, indoor/craft) |
| Mini lights (M5/T5 "Italian" incandescent-style LED) | ⌀5 × 10–12 long | 50–100 | ~1 mm insulated | 6–20 m, 50–100 lamps |
| C7 globe/teardrop (festoon) | ⌀32 × H38 (1.25″×1.5″) | 300–450 (12–18″) | 2–2.5 mm rubber-jacket | 5–15 m |
| C9 globe/teardrop (festoon) | ⌀38 × H57–64 (1.5″×2.25″) | 300–450 | 2.5–3 mm rubber-jacket | 5–15 m |
| G40 globe (patio/bistro) | ⌀40 sphere | 300 (12″) standard, 150 (6″) dense | 2.5 mm rubber-jacket, often black/green | 7.5 m / 25 ct is a common retail unit |
| G50 globe (oversized patio) | ⌀50 sphere | 300–450 | 3 mm rubber-jacket | 7.5–15 m |

**Shape breakdown**:

- **Wire/cable**: a thin cylinder (⌀3–6 mm) chained as short straight segments following a **catenary sag** — for N support points, sag depth ≈ 5–15% of the span; simplest buildable approach is a poly-line of short cylinder segments between computed sag points, or a single tapered/curved tube if the engine supports splines.
- **Bulbs**: sphere (globe/fairy/mini) or capsule (cylinder + hemisphere cap, for C7/C9 teardrop shape) threaded onto the wire at even intervals, each with its own small socket base (short dark cylinder, ⌀ = bulb⌀×0.6, height 3–5 mm) between bulb and wire.
- **Front face**: none — omnidirectional; orient each bulb's "front" as whichever way looks best from the dominant camera angle (Sims-style toon shading doesn't need a true directional emitter per bulb).
- No moving/openable parts — the only "motion" is the passive sag geometry (fixed) plus animated emissive twinkle (see below).
- For a **festoon swag** across a patio/yard: model as multiple parallel or crossing catenary strands anchored between 2+ mount points (posts, eaves, tree trunks), each strand an instance of the above.

**Colors & finishes**: wire — black, green, white, or copper/brown rubber
jacket (outdoor rated); bare/clear thin wire for indoor fairy lights (near-
invisible look). Bulbs — clear/transparent glass (unlit look = pale warm-
white or clear), frosted/opal white, or multicolor sets (red/green/blue/
yellow/orange — classic C7/C9 "multi"); warm white (2700K) and cool white
(5000K+) are the two dominant "designer" choices; some globes are colored
glass (amber, blue) rather than colored LED. Socket bases — matte black or
dark green plastic. Seasonal variants add red/green/white candy patterns or
twinkling multicolor for holiday use.

**Placement**: almost always **ceiling-hung/suspended** between two or more
mount points — strung along eaves, pergola beams, patio string-light poles,
tree branches, indoor across a ceiling or draped along a wall/headboard, or
coiled loosely on a surface (nightstand, shelf) for fairy-light decor.
Typical hang height for patio/festoon: 2400–3000 mm at the low point of the
sag (clears head height); indoor fairy-light drapes are lower and looser,
often resting along furniture edges (bed frame, mirror, shelf — effectively
"surface" draped rather than taut).

**Active / interactive state**: bind to a `light.*` entity — ON = all bulbs
emissive (warm glow + soft point-light falloff along the strand, or a
handful of proxy point lights rather than one per bulb for performance);
OFF = bulbs render as dim/unlit glass color, no glow. Brightness attribute
could scale glow intensity/opacity. Color-changing (RGB) sets — tint all
bulbs to the current HA color. Seasonal/holiday themes could reskin bulb
colors without new geometry.

**Variations & customizations**: bulb style (micro/fairy, mini/classic
small, C7/C9 teardrop, G40/G50 globe); color (clear/warm-white, cool-white,
multicolor, single accent color e.g. all-blue); wire color (black / green /
white / clear); density (sparse — 12–18" spacing, patio look — vs dense —
2–4" spacing, fairy-light look); mount pattern (straight run, crossed/
zigzag canopy for patio, draped swag/single low catenary, coiled/scattered
indoor decorative); length/span (short indoor accent 2–3 m vs long run
yard/patio 8–15 m spanning multiple posts).

**Animation opportunities**: *Idle* — gentle sway/sag oscillation from a
simulated breeze (low-amplitude sine wave perturbing the catenary control
points), subtle continuous emissive shimmer/flicker per bulb (staggered
random phase) to sell "twinkle." *Active (power on)* — fade-in glow when the
bound light turns on/off rather than a hard cut; optional twinkle mode
(bulbs randomly pulse brightness on staggered timers) for a festive/
animated preset; color-cycle animation for RGB festoon sets (slow hue
rotation) as an optional "party mode." *Seasonal* — swap to a chase/marquee
pattern (sequential bulb lighting) as a fun optional effect, mirroring real
chasing-light festoon controllers.

---

## Night light and plug-in accent

**Typical dimensions** (two related but distinct forms — bundle both as
sub-kinds):

| Variant | W × D × H (mm) | Notes |
|---|---|---|
| Compact plug-in night light (wall-wart) | 50–70 × 25–35 × 60–90 | Body sits flush over an outlet; prongs add ~15 mm protrusion into the wall |
| "Directional"/photocell plug-in (common dusk-to-dawn sensor type) | ~49 × 30 × 49 | Small square |
| Decorative/seasonal shaped plug-in (star, snowman, jack-o'-lantern cutout shade) | 70–100 × 25–40 × 90–130 | Larger front face for the cutout silhouette |
| Plug-in accent lamp (tabletop, e.g. salt lamp, small ceramic uplighter, cord-plug orb) | Ø100–180 base, 150–280 tall | Rests on furniture, not the wall; runs off a cord to the nearest outlet |
| Plug-in star/scene projector night light | Ø60–90 × 80–120 tall | Dome or ovoid body, rotates a light pattern |

**Shape breakdown**:

- *Wall night light*: one flattened **box** body (50–70×25–35×60–90mm), local **+Z = front** (facing into the room; −Z back face flush against the outlet plate). Two small **box/cylinder prongs** on the back (−Z) at the bottom, spaced ~12.7mm apart (NEMA 5-15 standard), protruding ~15mm to suggest the plug — can be omitted/hidden since it's flush to the wall in practice. A small **rounded box or lens-shaped sub-box** on the front houses the bulb/LED — give it an emissive material. Optional tiny **cylinder or sphere** near the top for the photocell sensor dot. Seasonal shade variants: a thin flat box with a **cutout silhouette** (approximate via a low-opacity dark plate with a bright emissive insert shape — star/moon/pumpkin — behind it).
- *Plug-in accent lamp*: **cylinder or low box base** (Ø100–150×20–40mm), a **body** approximated as a rounded box/cylinder or low-poly **sphere** (salt-lamp/orb look), sitting on the base. No moving parts. Front face is nominal (radially symmetric — skip `frontArrow`).
- *Star/scene projector*: a **cone or dome** (Ø60–90×60–100mm) atop a small **cylinder base**; front face (+Z) or top is where the pattern "beam" emits — represent the projected pattern as a soft **cone/decal** of light on the nearest wall/ceiling, textured with a star/dot pattern.

**Colors & finishes**: housings — white, ivory, or clear/frosted
translucent plastic (most common); black, bronze, or "wood-look" for
premium/decorative lines. Glow color — warm amber/soft-white (2700K, most
common — marketed as sleep-friendly, melatonin-safe), pure white, or color-
cycling RGB (kids' novelty models). Seasonal shades — colored translucent
plastic (orange pumpkin, white snowflake, green shamrock, red heart) with a
silhouette cutout. Salt lamp accent — natural pink/orange Himalayan salt
crystal texture (translucent, uneven rock shape), wood or metal base. Star
projector — matte white/pastel plastic shell, sometimes with a fabric-
textured shade.

**Placement**: **wall**-mounted, flush over a standard duplex outlet — this
is the dominant placement, at typical US residential outlet height ≈
300–400mm AFF (above finished floor; matches switch/outlet convention, much
lower than a sconce). Mounts flush like the existing `SwitchFixture`/sconce
wall-lock pattern (plate flush to wall face, front axis = local +Z out of
the wall). Rooms: hallways, bedrooms, bathrooms, kids' rooms, staircases,
kitchens (near stove/counter outlet). **Accent lamp variant** rests on a
**surface/counter** — nightstand, dresser, bathroom counter, entryway
console — like a small lamp; not wall-locked, freely placed on `mountable`/
`surface` hosts. Star/scene projector is usually placed on a nightstand or
dresser (surface-mount) aimed at a nearby wall/ceiling.

**Active / interactive state**: photocell (dusk-to-dawn) models auto-
illuminate when ambient light drops — animate as an automatic on/off tied to
the scene's day/night preset (like the existing `clock`/`lux` light-mode
resolvers) rather than a manual toggle. Motion-activated variants light up
briefly on nearby movement, then fade off after ~30–60s — could hook into
the same "recent trigger" bubble/activity plumbing used for lights. Visible
state: a small soft glow pool on the wall/floor around the fixture (much
smaller radius than a normal light — think 150–300mm, not the 900mm
default), plus the lens/emissive insert brightening. Color-cycling novelty
models slowly rotate hue (~10–20s per cycle). Salt-lamp/accent — a gentle
breathing glow (slow sine pulse, 3–6s cycle, small intensity delta) rather
than a flicker — reads as "ambient," not urgent. Star projector — the
projected pattern rotates slowly (~1 rev per 20–40s) across the ceiling/
wall when active.

**Variations & customizations**: sensor type (dusk-to-dawn/photocell,
motion-activated, manual switch/always-on, or smart — HA-controllable,
bindable `light.*`/`switch.*` entity like any other fixture); shape/theme
(plain square/rounded, seasonal silhouette — star, moon, pumpkin,
snowflake, heart — or character/novelty shaped); glow color (warm amber —
sleep-safe, cool white, multicolor cycling, or user-selectable fixed
color); brightness (single-level, dual-level dusk-to-dawn dim/full, or
fully dimmable); form factor (flush wall-wart, wall-wart with swivel/
rotating head to aim the beam, tabletop accent lamp, or ceiling/wall star-
projector); material/style for accent lamps (salt-crystal, frosted glass
globe, ceramic novelty shape, woven/rattan shade).

**Animation opportunities**: *Idle* — soft ambient glow pool breathing
(slow opacity/intensity pulse), especially for salt-lamp/accent style —
mirrors the fireplace-flicker idiom but slower/gentler (no `Math.random()`
needed, a simple sine works and is cheaper). *Active (dusk-to-dawn
engage)* — emissive intensity + glow-pool opacity ease up over ~1s when the
scene preset flips to dusk/night, ease down at day — analogous to how
`applyScenePreset` already drives other lighting. *Color-cycle novelty* —
continuous hue rotation on the emissive material and glow pool tint.
*Star/scene projector* — slow-rotating pattern decal on the nearest wall/
ceiling surface; optional gentle sway. *Motion-triggered* — quick fade-in
on trigger, linger, fade-out — reuse the "recent trigger" bubble-context
pattern (`light_on`/`light_off` glyph tiers) already in the codebase for
nearby avatar reactions (e.g., a 😲/✨ bubble when a night light snaps on as
someone walks by in the dark). *Seasonal shade swap* — a simple material/
texture swap on the cutout insert (no geometry change) to reskin for
holidays.

**Sources**: [Plug-In Night Light – DIY Direct](https://www.diydirect.com/plug-in-night-light) · [1.93 in. Plug-In Directional LED Dusk to Dawn Night Light – Home Depot](https://www.homedepot.com/p/1-93-in-Plug-In-Directional-LED-Automatic-Dusk-to-Dawn-Soft-White-Night-Light-2-Pack-89853/325062203) · [Amazon Basics LED Plug-in Night Light with Dusk to Dawn Sensor](https://www.amazon.com/AmazonBasics-Sensor-Dimming-Bedroom-Hallway/dp/B0844187WM) · [LOHAS LED Night Light Plug-in, Dusk to Dawn Sensor](https://www.amazon.com/LOHAS-Adjustable-Brightness-Dimmable-Stairway/dp/B0B3XMTRHN) · [LED Dusk to Dawn Night Lights – National Artcraft](https://www.nationalartcraft.com/subcategory.asp?gid=1&cid=19&scid=2341) · [20 Best Plug In Night Lights – Penglight](https://www.penglight.com/best-plug-in-night-lights/)

---

## Linear pendant / kitchen island bar light

**Typical dimensions** (length × depth × height of the fixture body; hangs
from ceiling on rods/cable, drop is separately adjustable):

| Variant | Length | Depth/width | Body height | Notes |
|---|---|---|---|---|
| Compact (2-light) | 600–750 mm (24–30″) | 100–150 mm | 80–150 mm | small islands / breakfast bars |
| Standard (3–4 light) | 900–1220 mm (36–48″) | 100–180 mm | 100–200 mm | most common — ⅔–¾ of island length |
| Long / oversized | 1500–1830 mm (60–72″+) | 150–250 mm | 120–250 mm | large islands, sometimes two fixtures end-to-end |

Rule of thumb: fixture length ≈ 0.65–0.75 × island length, inset 200–400 mm
from each end. Mounting drop (bottom of fixture above countertop): 750–900
mm (30–36″); ceiling-to-fixture-top cable/rod run varies with ceiling
height, typically 150–500 mm of visible stem/cable.

**Shape breakdown**:

- **Canopy**: flat cylinder or box, ~120–150 mm diameter/side × 20–30 mm, flush to ceiling.
- **Suspension**: 2 (compact) or 3–4 (standard/long) thin cylinders (rods, ⌀6–10 mm) OR cables — evenly spaced along the length, running from canopy down to the housing. Rods for a rigid architectural look, cable for a lighter look.
- **Housing/body**: the dominant shape — one long box or rounded-cap cylinder (long axis = local X, since it runs along the counter, not front-facing like most fixtures). Two common profiles:
  - **Bar/channel**: a long shallow box, flat or frosted diffuser panel on the underside (a thin box slightly proud of the housing bottom, lighter/emissive color).
  - **Linear-of-globes**: a long thin box/rod housing with 3–6 small spheres (glass globes/bulbs) spaced evenly along its underside, each on a short stub cylinder — reads as "island bar" more than "single bar."
- No moving/openable parts. "Front" is ambiguous (symmetric along its length) — orient long axis to match the island's long axis; no `frontArrow` needed (symmetric kind).
- Floor light-pool disc: one elongated oval (or a few overlapping ovals along the length) rather than a single circle, to read as a linear wash on the counter below.

**Colors & finishes**: housing — matte black, brushed/satin brass or gold,
brushed nickel/chrome, matte white, oil-rubbed bronze, natural wood/walnut
(linear wood battens are trendy). Diffuser/lens — frosted white acrylic/
glass (soft even glow), clear seeded glass globes (exposed-filament look),
or opal glass tubes. Rods/cable — matched metal finish to the housing;
cable is usually black or matches canopy. Emissive color for the diffuser
strip/globes: warm white (2700–3000K look) to neutral white (3500–4000K).

**Placement**: **ceiling**-hung, centered lengthwise over a kitchen island
or peninsula/dining bar counter. Also used over long dining tables. Never
floor- or wall-mounted. Bottom of fixture sits ~750–900 mm above the
counter/island top (counter top itself is typically ~900 mm off the floor,
so fixture bottom ≈ 1650–1800 mm above the floor); canopy at ceiling height
(2400–2743 mm typical residential ceiling).

**Active / interactive state**: OFF — housing/diffuser reads as flat
matte/neutral material, no glow. ON — diffuser panel or each globe becomes
emissive (warm-white ~2700–3000K for ambient/dining, cooler 3500–4000K for
task/prep — matches Diorama's existing HA-brightness-driven emissive
intensity pattern used for other light kinds); floor-pool disc/oval
brightens & widens with brightness; dimmable fixtures could scale emissive
intensity continuously with HA brightness attribute (already the pattern
for `lightIntensity`). Tunable-white products would shift emissive hue
toward warm at low brightness / cool at high brightness if a color-temp
attribute is ever modeled — optional stretch, not required to match other
kinds' current HA color handling.

**Variations & customizations**: length variant (compact/standard/long —
pick housing box length + globe count off overall fixture length); style
(solid bar with frosted diffuser vs. row of exposed globes vs. row of small
drum shades vs. linear wood/rattan battens); suspension (rods — rigid,
architectural — vs. cable — minimalist — vs. direct flush stems); finish
presets (black, brass/gold, nickel/chrome, white, wood-tone — mirrors the
finish options already offered on other light kinds); orientation lock to
the island's long axis so it doesn't need a front-facing rotation control
like most fixtures.

**Animation opportunities**: *Idle (off, unpowered)* — none, static
fixture, maybe a very subtle metal specular/gleam if the renderer supports
it. *Power on/off* — emissive intensity fade in/out on the diffuser panel/
globes (reuse the existing bulb-intensity transition idiom), floor-pool
oval fade in/out matching. *Brightness change (HA dimmer)* — continuous
emissive-intensity + pool-opacity scaling, same as other `bulb`/`pendant`
kinds. *Optional flourish* — a faint gentle sway animation on the
suspension rods/cable if the renderer ever adds ambient physics to hanging
fixtures (not currently done for `pendant`, so likely skip for consistency)
— otherwise treat it as fully static geometry like the existing `pendant`/
`strip` kinds, only elongated and centered over the island rather than a
single ceiling point.

**Sources**: [How Long Should a Linear Pendant Light Be?](https://www.risenlighting.com/info/how-long-should-a-linear-pendant-light-be-103170349.html) · [Moriarty Linear Island Pendant Light – Mullan Lighting](https://www.mullanlighting.com/us/moriarty-linear-island-pendant-light-nine-light/) · [Ultimate Guide Kitchen Island Pendant Light Height, Size and Spacing – Porch Daydreamer](https://porchdaydreamer.com/kitchen-island-pendant-light-size-right-height/) · [Linear Lighting Sizing for Over-Sized Kitchen Island – Houzz Forum](https://www.houzz.com/discussions/5840512/linear-lighting-sizing-for-over-sized-kitchen-island-suggestions) · [What Size Pendant Lights Over My Kitchen Island? – 2Modern](https://www.2modern.com/blogs/modern-how-to/what-size-pendant-light-over-island) · [The 19 Best Kitchen Island Lights – Flexfire LEDs](https://flexfireleds.com/blog/the-best-kitchen-island-lighting) · [LED CCT Guide – Flexfire LEDs](https://flexfireleds.com/blog/how-to-choose-kitchen-CCT) · [Kitchen Island Pendants: Spacing, Count, and Glare-Free Design](https://jolux-light.com/blogs/how-to/kitchen-island-pendant-spacing-count-glare-guide)

---

## Modeling notes for Diorama

This whole category maps onto Diorama's existing **`Light` fixture system**
(`LightIconKind` in `types.ts`, built per-kind in
`three-renderer.ts.updateLightsSwitches`, drawn in 2D via `LIGHT_GLYPH` in
`canvas-render.ts`) rather than the furniture/`ObjectRecipe` system — these
are light-emitting fixtures with `lightHeight`/`lightRadius`/`lightIntensity`
knobs, not passive furniture. A few items (night light, plug-in accent,
string lights, festoon swags) are borderline and could go either route
depending on how much of their geometry needs per-instance customization —
see the recipe note below.

### Suggested `LightIconKind` additions and their defaults

| Kind | Mount | Default height (mm) | Default floor-pool radius (mm) | Tint / finish default | Notes |
|---|---|---|---|---|---|
| `flush` | Ceiling | ceiling height (2440–2740) | 900 (wide, soft — no cone) | white acrylic + nickel trim | New kind between `bulb` and `pendant`; 0 mm stem |
| `semiflush` | Ceiling | ceiling height − (100–200) drop | 900 | white acrylic + nickel trim | Same body as `flush` + short stem |
| `chandelier` | Ceiling | ceiling height − drop (750–900 above table) | 700–1200 (wide, diffuse) | bronze/black frame, warm bulbs | Radially symmetric; drop length is the placement variable |
| `pendant` (existing) | Ceiling | user `lightHeight` | 500–700 | frosted glass / black | Add sub-kind selector: dome/globe/drum/cage/industrial |
| `linear_pendant` | Ceiling | user `lightHeight` | elongated oval, 400×1200 | matte black / brass | Long-axis housing, orient to island; no `frontArrow` |
| `recessed` | Ceiling | ceiling height (flush) | 600–900 (tight cone) | white trim, black baffle | Zero protrusion below ceiling |
| `track` | Ceiling | ceiling height − 15..25 | angled cone/pool per head | matte black / white | Multi-head; per-head aim angle optional |
| `sconce` (existing) | Wall | 1500–1830 (eye level) | 400–600 wall wash | black/bronze + frosted glass | Add shape (half-cyl/cone/box/candle) + orientation (up/down) options |
| `vanity_bar` | Wall | ~1900–2000 (over mirror) | 400–700 per globe | nickel/black + frosted globes | Multi-globe row, even pitch |
| `picture_light` | Wall | ~1800–2100 | elongated rectangular wash | brass/black | Long trough shade, aim down at art |
| `lamp` (existing, floor) | Floor | user `lightHeight` | 300–500 (shade) / vertical shaft (torchiere) | black/brass + fabric shade | Add torchiere/arc/reading sub-kinds |
| `table_lamp` | Surface (mountable) | surface height + lamp height | 250–400 | ceramic/glass base + fabric shade | New surface-mounted kind; desk/banker's/gooseneck sub-kinds |
| `undercabinet` | Wall/cabinet underside | 1350–1450 | rectangular (bar) / circular (puck) | white/aluminum | Puck vs. bar sub-kind |
| `led_strip` | Ceiling/wall/counter/floor | context-dependent | thin line-light halo along run | white/black channel | Run-length parameter, not fixed footprint; spans all 4 mount categories |
| `ceiling_fan` | Ceiling | ceiling height − downrod | 600–900 (light kit only) | white/black/wood blades | Only fixture with a spin animation (blades) in addition to light glow |
| `floodlight` | Wall (exterior) | 2100–2700 (residential) / 2700–4300 (commercial) | broad overlapping ellipses | bronze/black | PIR sensor dome; heads swivel/tilt |
| `porch_lantern` | Wall (exterior) | 1500–1650 | 400–600 | black/bronze + seeded glass | Cage + roof-cap composite |
| `string_lights` | Ceiling-hung / draped | 2400–3000 (patio low point) | small pool per bulb cluster | clear/multicolor bulbs | Catenary poly-line, best as a per-scene primitive chain rather than a single `ObjectRecipe` |
| `night_light` | Wall (outlet height) | 300–400 | 150–300 (small) | white/seasonal shade | Also has a surface "accent lamp" variant |

### `ObjectRecipe` custom-object mapping

For fixtures a modeler wants to expose through Diorama's **custom-object
recipe system** (`Store.customObjects: ObjectRecipe[]`, `FurnitureKindDef` +
`primitives: RecipePrimitive[]`) instead of a new native `LightIconKind` —
e.g. a one-off decorative floor lamp, a string-light swag, or a themed night
light — every shape in this doc decomposes into the primitive vocabulary
already supported: **box / cylinder / sphere / cone**, each with `size` /
`pos` / `rot?` / `color?` in local mm, origin at the piece center at floor
level, **+Z = front**. Concretely:

- **Cylinders** cover: canopies, stems/poles/rods/cable segments, drum
  shades, puck lights, recessed-can trims/reflectors, track rails
  (as elongated boxes, see below), chandelier crowns, sconce backplates,
  lamp bases, LED strip housings (as thin boxes), fan downrods/housings.
- **Spheres** cover: bulbs, globe pendants, chandelier crystals (elongated/
  scaled), acorn/finial caps, salt-lamp/accent-lamp bodies, string-light
  bulbs, PIR sensor domes.
- **Cones** cover: dome/bell pendant shades, torchiere bowls (tip-down),
  lamp shade frustums (approximate with a clipped cone), lantern roof caps,
  floodlight/track lamp-head tapers.
- **Boxes** cover: LED strip/bar runs (any length), backplates, vanity-bar
  strips, picture-light troughs, track rails and heads, night-light bodies,
  fan blades, cage muntins, barn-door flaps.

Since most of these fixtures are **radially symmetric or front-agnostic**
(chandeliers, pendants, flush mounts, LED strips), set `frontArrow: false`
in the recipe def — only genuinely directional pieces (sconces, picture
lights, floodlights, track heads, night lights) want the front chevron.

### Mount-type summary (for placement/snap logic)

- **Ceiling-hung** (new `updateLightsSwitches` builds at ceiling height, no wall/surface snap needed): flush/semiflush, chandelier, pendant, linear pendant, recessed can, track, ceiling fan, string/festoon (indoor runs), the cove-mount case of LED strip.
- **Wall-mounted** (reuse the `snapSwitchToWall`/`snapFireplaceToWall` flush-mount + optional ganging idiom): sconce, vanity bar, picture light, floodlight, porch/coach lantern, night light (over an outlet, at switch height), the wall/headboard-bias case of LED strip.
- **Surface-mounted / `mountable`** (auto-snap onto a `surface` host piece, e.g. a dresser or console, following the existing mountable-furniture convention): table lamp, desk lamp, plug-in accent lamp, star/scene projector night light.
- **Floor-resting** (free placement like ordinary furniture): floor lamp (shade/torchiere/arc/reading).
- **Cabinet-underside** (a ceiling-mount variant attached to furniture rather than the room ceiling): under-cabinet puck/bar.
- **Multi-category / run-based** (no single footprint — a parameterized linear run that can attach to any of the above): LED strip/cove lighting spans ceiling, wall, counter, and floor depending on where it's traced; string/festoon lights are ceiling-hung/draped by nature but conceptually closer to a "wire with beads" primitive chain than a discrete fixture.

### Which fixtures want an animated "active/running" state

Every kind in this doc shares the baseline **on/off emissive + floor/wall/
counter light-pool fade** already used by existing `LightIconKind`s
(`bulb`/`spot`/`pendant`/etc.) — that's the default "active" animation and
needs no new mechanism, just applying the existing pattern to each new
shade/lens material. Fixtures that want **something extra** beyond that
baseline:

- **Ceiling fan**: continuous blade rotation while running (`fan.*` speed-driven) — the one fixture in this category with a genuine moving-part animation independent of the light state.
- **Chandelier / crystal variants**: optional per-facet sparkle flicker while lit (reuses the fireplace `Math.random()` idiom, much subtler).
- **Torchiere floor lamp**: distinct upward light-shaft/ceiling-bounce visual (not just a floor pool) — its signature "on" silhouette.
- **Floodlight/security light**: PIR-triggered snap-on + brief head-swivel "waking up" micro-adjustment, plus optional dusk-to-dawn auto-engage tied to scene preset.
- **Porch lantern / exterior fixtures generally**: optional moth/bug-swarm particle flourish at night when lit (low priority).
- **String/festoon lights**: idle breeze-sway on the catenary + staggered per-bulb twinkle shimmer even at rest; an optional "twinkle mode" / color-chase / hue-cycle active state for RGB sets.
- **Night light / plug-in accent**: breathing glow pulse at idle (salt-lamp style), automatic dusk-to-dawn engagement, and a slow-rotating projected pattern for the star/scene-projector sub-variant.
- **Table/banker's lamp**: a brief pull-chain swing-and-settle one-shot on toggle (tactile feedback, not continuous).
- **LED strip/cove lighting**: NO flicker (explicitly the fireplace's signature, not this fixture's) — the only "extra" motion worth adding is an optional slow hue-cycle for RGBIC "effect mode," otherwise instant/eased color-swap only.
- **Flush/semiflush and recessed can**: intentionally the "boring but ubiquitous" baseline — no extra animation beyond on/off fade; an optional low-amplitude flicker is reserved for a distinct "faulty bulb" cosmetic state, off by default.

All new kinds should route through the existing HA-brightness → emissive-
intensity and HA-color-temp/RGB → emissive-tint pipelines already used by
`bulb`/`pendant`/etc., and any per-fixture toggle should hit the same eased
fade-in/out (never an instant snap) that the current light kinds use.
