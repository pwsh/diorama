# Wall finishes for skinning (paint, wallpaper, paneling, brick, stone, tile, siding)

Research doc for a new Diorama feature. Build-ready: cites real-world
specs/sizes with sources and exact Diorama hooks (files, functions, dirty
keys) so this can be implemented without further investigation.

## 1. Summary

Diorama already treats the **floor** as a paintable surface: `Scene3D.floorTex`
(`'none'|'wood'|'tile'|'concrete'`) picks a procedurally-generated
`CanvasTexture` built once in `three-renderer.ts._floorTexture()`, cached in
`_texCache`, tiled via `texture.repeat` scaled to the floor's mm footprint, and
composited under the shared `_mat()` `MeshToonMaterial` factory. **Walls have
no equivalent.** Today a wall is one flat, unmodulated color:
`Scene3D.wallColor` (default `#bbbbbb`, overridable per-floor via
`Floor.look3d.wallColor`) feeds a single shared `wallMatFor()` material used by
every wall segment in the 3D view — flat color, translucent, no texture map,
no per-wall variation. The 2D canvas is even further behind: `drawWalls()` in
`canvas-render.ts` uses **hard-coded** stroke colors per `WallKind`
(`#bfc9d6` full, `#93a2b4` half, `#a4b6c9` railing) that don't even read
`scene3d.wallColor` — 2D walls are visually disconnected from the 3D color
picker today.

This feature closes that gap: give walls (interior AND, for glass-house/
cutaway views, the implied exterior shell) a **finish** — paint sheen, wallpaper
pattern, wood paneling (shiplap/board-and-batten/beadboard), brick, stone
veneer, tile (backsplash/accent), wainscoting, and (for ext. siding briefly)
lap/fiber-cement/brick/stucco/stone — using the exact same procedural
`CanvasTexture` + `_mat()` toon-material recipe the floor already uses, so it
costs nothing architecturally: no new rendering path, no PBR, no image assets,
same dirty-key discipline. This is a **pure visual "skin"** feature (kiosk/
theater value: a diorama that reads as an actual decorated home, not gray
boxes) — it adds no interactivity, no new entity bindings, and composes
cleanly with every `uiMode` (edit/kiosk/view) since it's config-driven,
not stateful.

## 2. Platform / data model / real-world facts

Nothing here comes from Home Assistant — wall finish is a **static visual
property of the plan**, not a live device. There is no HA entity, service, or
integration involved (flagging this explicitly since other Diorama research
docs are HA-attribute-heavy; this one is real-world materials + Three.js
procedural-texture facts only). All measurements below are converted to mm
(Diorama's native unit) alongside the trade unit they're commonly specified in.

### 2.1 Paint (the default/baseline finish)

- **Application unit**: color + sheen, not a tileable pattern — this is the
  ALREADY-shipped `wallColor` picker, just needs a "sheen" knob layered on.
- **Sheen ladder** (gloss %, low → high): **Flat/Matte** 0–5% (fully
  non-reflective, hides drywall imperfections, common on ceilings/low-traffic
  walls), **Eggshell** 10–25% (soft velvety luster, most popular residential
  wall finish), **Satin** 25–35% (visible soft sheen, wipeable, common in
  kitchens/baths/hallways), **Semi-gloss** 35–70% (shiny, highly washable,
  trim/doors/high-moisture), **Gloss** 70–100% (mirror-like, rare on whole
  walls). [Paint Sheen Guide](https://www.paintcolorhq.com/blog/paint-sheen-guide),
  [Sherwin-Williams sheen guide](https://www.sherwin-williams.com/en-us/project-center/paint-sheen-guide),
  [Benjamin Moore](https://www.benjaminmoore.com/en-us/interior-exterior-paints-stains/how-to-advice/painting-101/choosing-paint-finish).
- **Drywall substrate** (relevant for a wall-height sanity check / accent-wall
  panel boundaries): standard sheet is **4×8 ft = 1219 × 2438 mm**, thickness
  1/2″ (12.7 mm) most common wall thickness, 5/8″ (15.9 mm) for fire-rated /
  ceiling spans. [Drywall Sheet Sizes Guide](https://drywallcalculator.net/blog/drywall-sheet-sizes-guide/).
- **Toon-render translation**: sheen has no physical meaning in a
  `MeshToonMaterial` (no specular highlight model beyond the flat gradient
  band) — it maps to a **cosmetic-only band-count/brightness tweak**, not a
  real roughness/reflectance change (see §3.1).

### 2.2 Wallpaper

- **Roll widths**: US "single roll" nominal **21″ (533 mm)**; American-made
  rolls commonly **27″ (686 mm)**; European/metric rolls **20.5″ (521 mm)**.
  A "double roll" is the shippable unit: **~20.8–21″ wide × 33 ft long
  (~529–533 mm × 10,058 mm)**. [Single vs Double Roll — Milton & King](https://www.miltonandking.com/blog/single-roll-double-roll-two-roll-set-what-does-it-mean/),
  [Prime Walls](https://primewalls.com/pages/single-roll-vs-double-roll).
- **Pattern repeat**: the vertical distance before a motif re-occurs —
  ranges from ~25 mm (small geometric/stripe) to 600+ mm (large damask/mural
  florals). No single "standard"; repeat size is the single most important
  number for procedural-pattern period selection. [Wallpaper Calculator](https://projectcalcs.com/calculators/wallpaper/).
- **Common pattern families** (useful as canvas-pattern presets): vertical
  stripes, small geometric/trellis, damask/floral (large repeat), grasscloth
  (irregular woven texture, no hard repeat), subtle tone-on-tone texture.
- **Seam behavior**: adjacent drops butt-joined, most patterns "match" (align)
  across the seam — irrelevant to Diorama since a `RepeatWrapping` canvas
  texture tiles seamlessly by construction (no real seam to fake, which is
  actually MORE convincing than most real wallpaper installs).

### 2.3 Wood paneling — shiplap, board-and-batten, beadboard/wainscoting

- **Shiplap**: overlapping-rabbet boards, historically 3–8″ wide, most common
  widths **5.5″ and 7.25″ (140 mm / 184 mm)**; a "standard" catch-all is often
  cited as **6″ (152 mm)**. Reveal (shadow gap between boards) is a small
  routed step, ~3/8″ (9.5 mm), that reads as a dark hairline. [Shiplap Sizes — Metrie](https://www.metrie.com/the-finished-space/shiplap-sizes),
  [Stikwood](https://www.stikwood.com/blogs/workbench/how-wide-is-shiplap).
- **Board-and-batten**: vertical boards **6–12″ (152–305 mm)** wide, seams
  covered by battens **1–4″ (25–100 mm)** wide (a "true" batten is ≤2″/51 mm);
  spacing (batten centerline to centerline) commonly **10–12″ (254–305 mm)**,
  adjustable. [Board and Batten Dimensions](https://designingidea.com/board-and-batten-dimensions/),
  [Allura USA spacing guide](https://allurausa.com/blog/board-and-batten-spacing).
- **Beadboard / wainscoting**: standard wainscoting cap height **32–36″
  (813–914 mm)** for 8 ft (2438 mm) ceilings, scaling to 36–42″ (914–1067 mm)
  for 9–10 ft ceilings — roughly 1/3 of wall height. Individual raised/recessed
  panel width **12–18″ (305–457 mm)**; a 14–16″ (356–406 mm) panel width is
  cited as the most balanced proportion. A cap rail + baseboard trim bracket
  top/bottom. [Wainscoting Height Guide](https://kofflersales.com/blog/wainscoting-height-guide/),
  [Bob Vila](https://www.bobvila.com/articles/wainscoting-height/).
- **Color families**: paneling is usually painted (white/greige/navy/sage are
  the current popular families) or stained natural wood tones (honey oak
  ~#c19a6b, walnut ~#5c4033, whitewash ~#e8e0d0) — no fixed "standard" color,
  it's a paint-adjacent finish layered on a textured substrate.

### 2.4 Brick (interior exposed/painted, or exterior veneer)

- **US modular brick** — the overwhelmingly common size: **actual 3⅝ × 2¼ ×
  7⅝ in = 92 × 57 × 194 mm** (depth × height × length); **nominal** (brick +
  mortar joint) **4 × 2⅔ × 8 in**, i.e. **102 × 68 × 203 mm**, with a **3/8 in
  (9.5 mm) mortar joint**. Three courses + joints = one 8 in (203 mm) vertical
  module — the standard masonry coordination constant. [Brick Dimensions guide](https://thecactusproperty.com/standard-brick-dimensions/),
  [BIA Technical Note 10](https://www.gobrick.com/media/file/10-dimensioning-and-estimating-brick-masonry.pdf),
  [Dimensions.com — Brick Modular](https://www.dimensions.com/element/brick-modular).
- **Running bond** (by far the most common pattern): each course offset
  horizontally by half a brick length (~97 mm) from the course below —
  this is exactly the classic "brick wall" 2-row alternating stagger.
- **Color families**: red/red-brown (iron oxide, most common), buff/tan,
  gray, brown/charcoal, "white" (painted or white-body brick) — mortar is
  usually a lighter gray/tan that reads as the grid line.
- **Exposed vs. painted**: exposed shows natural color variation brick-to-
  brick (each brick a slightly different red); painted brick is a single
  color over the same coursed texture (limewash/matte white over brick is
  currently a very popular look) — both are just palette swaps of the same
  procedural coursed-rectangle pattern.

### 2.5 Stone veneer

- No single "standard size" — stone veneer is intentionally **irregular**.
  Manufacturer ledgestone specs cluster around **height 1–6 in (25–150 mm)**,
  **length 4–19 in (100–480 mm)**, panel thickness **1–2 in (25–50 mm)** (up
  to 2.5 in/64 mm for deep-relief profiles). Stacked in tight horizontal
  courses with minimal/no visible mortar joint (the "dry-stack ledgestone"
  look) or wider mortared joints (traditional fieldstone). [Stone Veneer Dimensions](https://mountainviewstone.net/blogs/carved-in-stone/stone-veneer-dimensions),
  [Stoneyard ledgestone guide](https://stoneyard.com/ledger-stone-panels/).
- **Color families**: gray/charcoal (bluestone), tan/buff (limestone/sandstone),
  warm brown/rust (fieldstone), near-white (Austin/Oyster Bay style).
- Sold as **manufactured stone veneer (MSV)**, lightweight concrete cast in
  molds — a real-world nod to why a procedural "fake stone" texture is not a
  stretch; it's literally how the physical product is made too.

### 2.6 Tile (backsplash / accent wall)

- **Subway tile 3×6 in (76×152 mm)** is the historic-standard size, still the
  most common for kitchen backsplashes; other common formats: 2×4 in
  (compact), 2×8/3×6 (classic), 4×8 in (modern/large-format). [Subway Tile Size Guide — Apollo Tile](https://apollotile.com/blogs/our-blogs/subway-tile-size-guide),
  [CLE Tile sizes](https://www.cletile.com/blogs/cle-education/subway-tile-sizes).
- **Grout line**: 1/16 in (1.6 mm) for a tight seamless look, 1/8 in (3.2 mm)
  more common/forgiving — this is the dominant visual "grid line" weight.
  [Grout Line Size for 3×6 Subway Tile](https://upgradedhome.com/grout-line-size-for-3-x-6-subway-tile/).
- **Layout**: running-bond/brick offset by half a tile is the classic subway
  pattern; herringbone and stacked (grid-aligned) are common alternates.
- **Color**: white/off-white gloss is the classic; the same grid geometry in
  any single color covers most backsplash looks.

### 2.7 Exterior siding (for glass-house / cutaway exterior-shell views)

- **Vinyl lap siding**: sold by "exposure" — **Double-4 (D4)** = two 4 in
  courses per panel = **8 in (203 mm) exposure**; **Double-5 (D5)** = **10 in
  (254 mm) exposure**; Single-8 = one 8 in plank exposure. [Clapboard/Lap Siding Calculator](https://www.inchcalculator.com/siding-clapboard-calculator/).
- **Fiber-cement lap siding** (HardiePlank-style): common board **8.25 in
  (210 mm) wide with 7 in (178 mm) exposure** (1.25 in / 32 mm overlap),
  sold in **12 ft (3658 mm)** lengths; minimum overlap per manufacturer spec
  (James Hardie) **1.25 in (32 mm)**. [Fine Homebuilding — siding exposures](https://www.finehomebuilding.com/2022/04/20/adjusting-siding-exposures).
- **Brick veneer / stucco / stone veneer exteriors**: same real-material specs
  as §2.4/§2.5 above, just applied to the outside face.
- **Stucco texture families**: **sand** (fine/medium/coarse grainy, hides
  imperfections), **dash** (rough, small sprayed peaks), **lace** (semi-smooth
  with underlying grooves), **worm** (large-aggregate grooved, troweled). Base
  is Portland cement/sand/lime (traditional) or acrylic/elastomeric
  (synthetic, "EIFS"). [Stucco Finish Types — Sto Corp.](https://www.stocorp.com/stucco-finish-types/),
  [Stuccoboy finishes/textures](https://stuccoboy.com/finishes-textures/).
- **Color**: siding/stucco color families are broad neutrals (white, gray,
  greige, navy, sage, brick-red) — same swap-a-hex-value story as brick/stone.

### 2.8 What is NOT possible / limits

- No physical HA integration exists for "what is my wall finish" — this is
  100% a Diorama-authored plan property, never live device state. Nothing to
  bind, no entity picker involved.
- Three.js `MeshToonMaterial` (Diorama's only material — see CLAUDE.md
  "Sims-style rendering") has no roughness/normal-map channel that would read
  correctly under `NoToneMapping` + flat toon bands — a **normal-mapped**
  brick/stone bump look is off the table without breaking the toon aesthetic;
  everything must be color-only (bake AO/edge-darkening into the diffuse
  texture pixels, not a normal map).
- Real product catalogs (thousands of SKUs/colors) are out of scope —
  Diorama should ship a **curated palette per finish kind** (5–8 color swatches
  each), not a full manufacturer catalog.

## 3. Diorama design / integration

### 3.1 Data model — mirror `FloorTexKind` exactly

Add a **wall-finish** analogue to the existing floor-texture type, at both the
global and per-floor-override layers already in place for floors:

```ts
// types.ts
export type WallFinishKind =
  | 'paint'        // existing behavior — flat wallColor, sheen-tinted
  | 'wallpaper'    // pattern + repeat, tinted by wallColor
  | 'shiplap'      // horizontal board reveal lines
  | 'board_batten' // vertical battens over boards
  | 'beadboard'    // wainscoting-style vertical ribs, lower band only
  | 'brick'        // running-bond coursed rectangles
  | 'stone'        // irregular ledgestone courses
  | 'tile';        // subway grid, lower band or full wall

export interface Scene3D {
  // ...existing fields...
  wallFinish?: WallFinishKind;       // default 'paint'
  wallFinishScale?: number;          // 0.5–2, default 1 (like envScale pattern)
  wainscotHeightMm?: number;         // for beadboard/tile "lower band" kinds, default 900
}
export interface FloorLook3D {
  // ...existing fields...
  wallFinish?: WallFinishKind;
  wallFinishScale?: number;
}
```

This is **additive** to `Scene3D`/`FloorLook3D` — remember the CLAUDE.md
gotcha: any new top-level `Store`/`Scene3D` field must be added to
`Planner._loadFromHa`'s explicit field list (`scene3d` is already whole-object
copied there per existing code, so `wallFinish` rides along for free as long
as it stays nested inside `scene3d`/`look3d`, matching how `floorTex` already
works — verify this at implementation time, it's the exact bug class that hit
`scene3d` historically per the gotchas list).

### 3.2 Texture generation — a `_wallTexture(kind)` sibling to `_floorTexture`

Add a second procedural-texture cache, styled **identically** to the existing
one (same 256×256 canvas size, same `CanvasTexture` + `RepeatWrapping` +
`SRGBColorSpace` idiom, same "cached per kind, disposed only in `destroy()`"
lifecycle rule):

```ts
private _wallTexCache: Partial<Record<WallFinishKind, THREE.Texture>> = {};
private _wallTexture(kind: WallFinishKind, baseColorHex: string): THREE.Texture | null {
  if (kind === 'paint') return null; // flat color, no map — current behavior
  const cacheKey = `${kind}:${baseColorHex}`;      // color-tinted patterns need
  const cached = this._wallTexCache[cacheKey];      // a key per (kind, color) —
  if (cached) return cached;                        // NOT just per kind, since
  // ... build 256x256 canvas per kind ...           // brick/stone/tile are drawn
  // ... cache, return ...                            // pre-tinted (see 3.3)
}
```

Per-kind canvas recipes (mirroring the existing `_floorTexture`/
`_groundTexture` style — flat fill + procedural lines/noise, no real images,
`Math.random()` seeded once at texture-build time is fine since it's cached):

- **`wallpaper`**: flat base fill + a repeating small motif (diagonal stripe
  pairs, a diamond/trellis lattice via `strokeStyle` lines, or soft blotches
  via low-alpha circles for a grasscloth look) at a period tuned to
  `wallFinishScale`. Reuse the "wood grain streaks" `bezierCurveTo` idiom from
  `_floorTexture('wood')` for a damask-ish flowing line if a floral option is
  wanted later.
- **`shiplap`**: horizontal dark 1–2 px lines every ~1/5 of canvas height
  (5 boards per 256 px tile ≈ real 6″ board at the floor's `/800`-style
  world-scale mapping — see §3.4), identical technique to `_floorTexture
  ('tile')`'s grid-line loop but horizontal-only + a subtle per-board
  brightness alternation like the existing wood plank bands.
- **`board_batten`**: base board fill + evenly-spaced vertical raised battens
  as slightly-lighter/darker vertical bands (`fillRect` stripes at fixed
  pitch) — literally the `_floorTexture('tile')` vertical-line loop, coarser
  pitch, plus a soft gradient per band to fake the batten's proud edge shadow
  (two thin `rgba(0,0,0,alpha)` lines flanking each batten).
- **`beadboard`**: tight, thin repeating vertical ribs (higher frequency than
  board_batten) confined to the lower `wainscotHeightMm` band only — this is
  the one kind that needs **two regions** in one texture (rib pattern below a
  V-coordinate cutoff, flat/paint above it) OR (simpler, recommended) is drawn
  as **two separate meshes**: a short wainscot-height box with the rib texture
  + the remaining wall height above it using the flat paint material — this
  reuses geometry decomposition instead of a shader region, which fits the
  "everything is boxes/extrusions" style of the rest of the renderer.
- **`brick`**: draw pre-tinted (this is the one place where the true output
  color ≠ `wallColor` alone) — fill background with `wallColor`'s mortar-gray
  neutral, then draw a running-bond grid of `hexToInt`/`lighten()`-varied
  brick-colored rectangles (reuse `lighten()`/`_simsColor` for the natural
  per-brick variance — small per-rectangle `Math.random()` tint jitter, same
  technique as `_floorTexture('concrete')`'s per-pixel noise but coarser/per-
  rect). Offset alternate rows by half a brick width for running bond.
- **`stone`**: irregular-course variant of the brick recipe — vary rectangle
  HEIGHT per "course" (not just color) using random per-row height picks
  within the §2.5 range, ragged left/right joints (slight x-jitter per stone),
  same lighten/darken jitter for natural stone color variance.
- **`tile`**: literally reuse `_floorTexture('tile')`'s grid-line + per-tile
  shade-variance code verbatim (it already produces exactly a subway-tile-
  style grid) — offer it as a wall option with a tighter default `repeat`
  (subway proportions are 1:2, so use a non-square UV repeat, see §3.4) and,
  like beadboard, confine it to the lower `wainscotHeightMm` band via a
  separate short mesh for backsplash/accent-wall realism.

### 3.3 Color tinting strategy

For `wallpaper`/`shiplap`/`board_batten`/`beadboard` (single-material-color
finishes): draw the pattern in **neutral grayscale** (like `_floorTexture`
does) and let `_mat({ color: hexToInt(wallColor), map: tex })` do the tinting
— this is exactly how the existing floor system works (the floor's `map` +
`color` multiply together in Three.js), so **zero new tinting code** is
needed; `wallColor` keeps working as the single color knob.

For `brick`/`stone`/`tile` (inherently multi-tone finishes): the pattern
itself carries the color variance (brick red + mortar gray can't both come
from one multiplied tint), so these bake the **actual palette** into the
canvas at draw time from a **small curated swatch list per kind** (§2.4/2.5
colors above), and `wallColor` is repurposed as which swatch family to pick
(e.g. `wallColor` nearest-matches to "red brick" vs "gray brick" vs "buff
brick" from a short list) OR — simpler, recommended for v1 — these three
kinds ignore `wallColor` entirely and get their own small
`wallFinishPalette?: string` sub-picker (e.g. `'red'|'buff'|'gray'|'painted'`
for brick) shown only when the finish kind is one of the three. This avoids
building a "nearest palette color" resolver for v1.

### 3.4 Applying the texture to wall geometry

The load-bearing gotcha here: walls are **one extruded mesh per segment**
(`_buildSolidWallSegment`, per CLAUDE.md's "Continuous walls" section) with
an auto-generated UV from the 2D along-wall-length × height profile — there
is **no single shared "wall plane"** the way there's one floor plane, so
texture **repeat must be set per-segment**, not once globally:

- In the wall-segment loop (`three-renderer.ts` around the `wallMatFor`/
  `_buildSolidWallSegment` call), after building each segment's material,
  set `tex.repeat.set(len / BOARD_PERIOD_MM, kindH / BOARD_PERIOD_MM)` scaled
  per finish kind's real-world period (shiplap ~152 mm board, brick ~203 mm
  course module, tile use non-square repeat matching the 76×152 mm subway
  proportions) — **this exactly mirrors** the existing floor line
  `floorTex.repeat.set(Math.max(1, f.w / 800), Math.max(1, f.d / 800))`.
- **Shared texture, per-segment repeat** means the `THREE.Texture` object
  itself can't be shared with a different `.repeat` per segment (Three.js
  textures carry ONE repeat value globally) — either clone the texture per
  unique repeat value (cheap: same canvas source, `tex.clone()` is a shallow
  GPU-texture-sharing clone in Three.js and won't reallocate canvas pixels) or
  accept a single averaged repeat for the whole floor's walls (simpler, likely
  fine visually since most walls in a plan are similar lengths) — **flag this
  as an implementation decision**, not solved here (see §6).
- **Material reuse**: today `wallMatFor()` is called once per building pass
  and its returned single material is reused for every segment
  (`this._mat({...})` inside `wallMatFor`, called fresh per invocation — check
  actual call-site count at implementation time; if it's called once outside
  the loop, switching to a textured, per-segment-repeat scheme means calling
  `_mat()` **inside** the per-segment loop instead, one material per unique
  (finish, repeat-bucket) pair, still far fewer materials than one-per-
  segment-always since most segments round to the same bucket).
- **Interior vs. all-4-sides**: a wall segment's extruded mesh has faces on
  both sides (it's the actual wall thickness) — a finish is usually
  interior-only in reality (the far side of a wall in another room might have
  a different finish, or be exterior siding). V1 should apply **one finish
  per wall segment** (both faces get the same texture — cheapest, matches how
  `wallColor` already works: one color for a whole wall regardless of which
  room you're viewing from). A per-face-per-room finish is a real future
  enhancement (§5) but is a bigger data-model change (finish would need to
  live on a wall's *room-facing side*, not the wall object itself) — out of
  scope for v1.

### 3.5 Wainscoting / accent-wall as geometry, not just texture

Per §3.2's `beadboard`/`tile` note: the realistic look for wainscoting,
beadboard, and tile backsplash is a **lower band ending at a height with a
visible cap-rail line** (real wainscoting has a physical rail transition —
§2.3's 900±150 mm height). Recommended approach: split the wall segment build
into **two boxes stacked vertically** — a short box `0..wainscotHeightMm` with
the accent finish + a thin proud cap-rail sliver box at the transition (same
coincident-face-avoidance discipline CLAUDE.md flags repeatedly — the cap
rail must be proud by a few mm, not coplanar, or it'll hatch/z-fight) — and
the remaining `wainscotHeightMm..kindH` box keeps the regular paint/wallpaper
finish. This is a **per-wall-segment feature toggle** (`Wall.accentBand?:
{kind, heightMm}` at the wall-item level, or a floor-wide "accent height"
setting) rather than a whole-floor wall-finish switch — flagged as a natural
v2, since v1 (whole-floor `wallFinish`) is simpler and ships the core value
(a brick or shiplap ROOM) faster.

### 3.6 2D canvas parity fix (pre-existing bug, worth fixing alongside this)

`drawWalls()` in `canvas-render.ts` currently hard-codes wall stroke colors
per `WallKind` and **never reads `scene3d.wallColor`** — so today, changing
the 3D wall color sidebar picker has zero visible effect in the 2D plan view.
When adding `wallFinish`, also thread `scene3d?.wallColor` into `drawWalls`'s
`full`-kind stroke color (keep `half`/`railing`'s distinct tints for
at-a-glance kind differentiation, or lighten/darken the base color per kind
via the existing `lighten()` helper instead of separate hard-coded hexes).
2D wall **finish** itself (a brick hatch pattern on the plan stroke) is a
nice-to-have, not required — the 2D view is a schematic, not a render; a
solid color read from `wallColor` is enough parity. Diorama's existing
`FloorLook3D` naming convention ("3D" in the type name) suggests wall finish
is intentionally 3D-only, matching how `floorTex` is *also* 3D-only today
(the 2D floor draws a flat fill, no wood-grain hatch) — precedent favors
leaving 2D as flat-color-only for finish too, just fixing the color-source bug.

### 3.7 Sidebar UI — extend the existing "3D Scene" section

`sidebar.ts._scene3dSection()` already has the `floorTex`/`wallColor` picker
pattern (lines ~4386–4406) and the per-floor override block
`_floorLookOverrides()` (~4445+). Add directly alongside:
- A `<select>` for `wallFinish` next to the existing `wallColor` `<input
  type="color">`, exact same `upd(() => {...})` + `emitConfig()` wiring as
  `floorTex`.
- A conditional palette `<select>` (red/buff/gray/painted swatches) that only
  renders when `wallFinish` is `brick`/`stone` (per §3.3's decision to skip a
  nearest-color resolver for v1) — same conditional-render style already used
  elsewhere in the sidebar (e.g. the `northDeg` input "only when exactly 1
  calibrated" landmark).
- Mirror both into `_floorLookOverrides()` so per-floor overrides work exactly
  like `floorTex`/`wallColor` already do (inherit/override select pattern,
  `clearBtn` to reset to inherited).

### 3.8 Dirty-key wiring

`wallFinish`/`wallFinishScale`/`wainscotHeightMm` are pure config fields (no
live entity dependency, exactly like `floorTex`/`wallColor` today) — they
already ride `configRev` → `_keyFloor` (three-view's existing dirty key
already hashes the whole `scene3d`/`look3d` object's relevant fields the same
way `floorTex` does today) — **no new dirty-key term needed** as long as the
new fields are read from the same `scene3d`/`look3d` objects `_keyFloor`
already depends on; verify at implementation time that `_keyFloor`'s hash
isn't hand-enumerating individual `scene3d` fields (if it is, add the new
ones to that enumeration — the exact same gotcha class as "add a renderer
input → add it to the corresponding key").

## 4. Setup / integration steps

1. **Types**: add `WallFinishKind` + `wallFinish?`/`wallFinishScale?`/
   `wainscotHeightMm?` to `Scene3D` and `FloorLook3D` in `types.ts`.
2. **Loader**: confirm `wallFinish` rides inside the whole-object `scene3d`/
   `look3d` copy in `Planner._loadFromHa` / `repairFloor` (it should, since
   it's nested, not top-level — verify, don't assume, per the historical
   `scene3d` reset bug).
3. **Renderer — texture factory**: add `_wallTexCache` + `_wallTexture(kind,
   paletteOrColor)` to `three-renderer.ts`, one canvas-recipe branch per
   `WallFinishKind` (§3.2), disposed only in `destroy()` alongside the
   existing `_texCache`/`_groundTexCache` teardown.
4. **Renderer — apply to wall segments**: in the wall-build loop, resolve
   `wallFinish` (per-floor `look3d` override → global `scene3d` → `'paint'`
   default, matching the existing `floorTex` resolution order), get/clone the
   texture, set `.repeat` per real-world period scaled to `len`/`kindH`
   (§3.4), pass into `wallMatFor()`'s `_mat({..., map: tex})` call.
5. **Renderer — brick/stone/tile palette**: implement the curated-swatch
   lookup (§3.3) — a small `const BRICK_PALETTES: Record<string, string[]>`
   style table, same shape as `SENSOR_PALETTE`/`ALARM_STATE_COLORS` in
   `geometry.ts`.
6. **Renderer — wainscot band split** (if doing §3.5 in the same pass):
   extend the wall-segment builder to emit two stacked meshes when
   `wallFinish` is `beadboard`/`tile` and `wainscotHeightMm` is set.
7. **2D parity fix**: thread `scene3d?.wallColor` into `drawWalls()`'s stroke
   color resolution (§3.6) — small, independent, ships even if the 3D texture
   work slips.
8. **Sidebar**: extend `_scene3dSection()` + `_floorLookOverrides()` with the
   new picker(s) (§3.7).
9. **Typecheck + build**: `npm run typecheck && npm run build` (no test
   suite exists per CLAUDE.md — these two are the verification gate).
10. **Manual visual check**: load a plan with a few connected wall runs, cycle
    through each `wallFinish` kind + a couple of floor sizes (short and long
    wall runs) to eyeball tiling/repeat correctness before considering it done.

## 5. Potential additional features

- **Per-wall (not per-floor) finish override** — a `Wall.finish?` item-level
  field mirroring how `Furniture`/`Light` already carry item-level overrides;
  natural v2 once the floor-wide picker proves the texture pipeline out.
- **Per-room finish** — resolve finish via `resolveRoomForPointFuzzy` the same
  way room-name-driven activities work today (e.g., "kitchen" gets tile,
  "living room" gets shiplap) — would want a `Room.wallFinish?` field.
- **Exterior shell finish** — a distinct `Scene3D.exteriorFinish` for the
  glass-house ghost-floor exterior faces / roofline, using the siding
  palettes from §2.7 — currently ghost floors are translucent boxes with no
  finish concept at all; this would be the first "exterior skin" Diorama has.
- **Accent-wall single-segment override** — let the user pick ONE wall
  segment (not a whole room/floor) to carry brick/wallpaper while the rest
  stays painted — the single most requested real-world decorating pattern
  ("accent wall"). This is really the combination of "per-wall finish" (above)
  plus a UI affordance to click-select one wall segment in the sidebar/canvas,
  similar to the existing wall-kind double-click-to-cycle interaction.
  Loved in the actual decorating world; cheap once per-wall finish exists.
  ([Design context](https://designingidea.com/board-and-batten-dimensions/) —
  accent walls are overwhelmingly the #1 use case for shiplap/board-and-batten
  in real homes, not whole-room treatments.)
- **Baseboard + crown molding trim** — thin proud boxes at the wall's top/
  bottom edge (same coincident-face-avoidance recipe as the cap-rail in
  §3.5), a cheap "finished room" signal independent of the wall-fill texture.
- **Sheen-driven emissive tweak**: since real specular sheen can't render
  correctly in the toon material, a cosmetic knob — semi-gloss/gloss bumps
  `emissiveIntensity` a hair and/or a slightly higher toon-band step (whiter
  highlight band) — would at least give a *perceptual* nod to "this wall is
  glossier" without claiming physical accuracy.
- **Real-photo texture import** (stretch, breaks the "no external images"
  purity of the current renderer): let a user upload a tileable photo texture
  for a custom finish, similar to how `Floor.model3d`/background images
  already accept user-provided image data — bigger scope, would need its own
  research pass on storage (IndexedDB, like `model-store.ts`) since these are
  the kind of asset too big for `localStorage`/HA `user_data`.

## 6. Open questions & risks

- **Per-segment texture-repeat vs. one shared texture**: flagged in §3.4 as
  unresolved — cloning textures per unique repeat bucket is cheap but adds a
  small bookkeeping surface (a repeat-bucket cache keyed by rounded
  `len`/`kindH`) that doesn't exist anywhere else in the renderer today
  (`_floorTexture` never needed this because there's exactly ONE floor plane
  per floor, not N wall segments of varying length). Needs a design call
  before implementation: exact-repeat-per-segment (more correct, more
  materials) vs. floor-average-repeat (simpler, occasionally slightly
  mismatched board/brick scale on unusually long or short walls).
  **Recommendation**: bucket by rounding `len` to the nearest 500 mm before
  computing repeat — keeps material count bounded (most real wall runs cluster
  around a handful of lengths) while looking correct at a glance.
- **Brick/stone/tile color resolution**: §3.3 punts to a small curated-palette
  picker instead of deriving from `wallColor` directly, to avoid building a
  "nearest color in swatch list" resolver. This is a real product decision —
  a user might reasonably expect the SAME `wallColor` swatch to drive brick
  tint too. Worth a quick design pass before implementation, not a pure
  engineering call.
- **Toon-material sheen fidelity**: §2.1/§5 — sheen literally cannot render
  correctly under `MeshToonMaterial` + `NoToneMapping` (no real specular
  model). Any "sheen" UI knob must be honest that it's a cosmetic-only
  approximation, or it should be dropped from v1 entirely and only the
  `wallColor` + pattern-kind axes shipped (paint sheen adds UI complexity for
  a difference that won't read clearly in the toon render anyway — likely
  **not worth building** for v1; recommend cutting it and revisiting only if
  users ask).
- **Interior-only vs. two-sided finish** (§3.4 "Interior vs. all-4-sides"):
  v1's "one finish per wall regardless of which room you view from" is a
  known simplification that will look wrong the instant someone puts brick on
  one side of a shared wall and expects the other room to show painted
  drywall. Explicitly flagged as an accepted v1 limitation, not an oversight,
  but worth stating plainly to whoever signs off on scope.
  Real per-face finish requires wall data to carry TWO finishes (one per
  side) or moving finish onto rooms instead of walls — meaningfully bigger
  than what's scoped here.
- **Performance**: brick/stone-per-rectangle jitter drawing (§3.2) at build
  time is a one-time 256×256 canvas cost per (kind,palette) pair, cached
  forever — no per-frame cost, consistent with every other procedural texture
  in the renderer. Not a real risk, just confirming it fits the existing
  "cheap because built once" pattern before implementation, since a naive
  per-frame regeneration would NOT be cheap.
- **Wainscoting geometry split (§3.5) interacting with wall openings**: doors
  and windows already notch the wall's solid-run profile
  (`wallCutsForSegment`) — a wainscot band split needs to compose with that
  notching (a door opening that starts below `wainscotHeightMm` cuts through
  BOTH stacked boxes) rather than being layered naively on top. This is
  probably the single trickiest geometry interaction in the whole feature and
  deserves its own careful pass (or a v1 that explicitly skips wainscoting on
  wall segments that contain any opening, falling back to whole-segment
  paint on those specific segments) — flagged, not solved.

## 7. Sources

- [Paint Sheen Guide (Flat/Eggshell/Satin/Semi-Gloss)](https://www.paintcolorhq.com/blog/paint-sheen-guide)
- [Sherwin-Williams — Paint Sheen Guide](https://www.sherwin-williams.com/en-us/project-center/paint-sheen-guide)
- [Benjamin Moore — Choosing a Paint Finish](https://www.benjaminmoore.com/en-us/interior-exterior-paints-stains/how-to-advice/painting-101/choosing-paint-finish)
- [Drywall Sheet Sizes Guide](https://drywallcalculator.net/blog/drywall-sheet-sizes-guide/)
- [BIA Technical Note 10 — Dimensioning and Estimating Brick Masonry (PDF)](https://www.gobrick.com/media/file/10-dimensioning-and-estimating-brick-masonry.pdf)
- [Dimensions.com — Brick (Modular)](https://www.dimensions.com/element/brick-modular)
- [Standard Brick Dimensions — The Cactus Property](https://thecactusproperty.com/standard-brick-dimensions/)
- [Brick Dimensions Guide — BigRentz](https://www.bigrentz.com/blog/brick-dimensions)
- [Standard Shiplap Sizes & Dimensions — Metrie](https://www.metrie.com/the-finished-space/shiplap-sizes)
- [How Wide is Shiplap? — Stikwood](https://www.stikwood.com/blogs/workbench/how-wide-is-shiplap)
- [Board and Batten Dimensions (Spacing & Sizes)](https://designingidea.com/board-and-batten-dimensions/)
- [Board and Batten Spacing — Allura USA](https://allurausa.com/blog/board-and-batten-spacing)
- [Wainscoting Height Guide](https://kofflersales.com/blog/wainscoting-height-guide/)
- [The Right Wainscoting Height for Every Scenario — Bob Vila](https://www.bobvila.com/articles/wainscoting-height/)
- [Subway Tile Size Guide — Apollo Tile](https://apollotile.com/blogs/our-blogs/subway-tile-size-guide)
- [Subway Tile Sizes — CLE Tile](https://www.cletile.com/blogs/cle-education/subway-tile-sizes)
- [Grout Line Size for 3×6 Subway Tile](https://upgradedhome.com/grout-line-size-for-3-x-6-subway-tile/)
- [Single Roll, Double Roll & Two Roll Set — Milton & King](https://www.miltonandking.com/blog/single-roll-double-roll-two-roll-set-what-does-it-mean/)
- [Single vs Double Roll Wallpaper — Prime Walls](https://primewalls.com/pages/single-roll-vs-double-roll)
- [Wallpaper Calculator — ProjectCalcs](https://projectcalcs.com/calculators/wallpaper/)
- [Clapboard and Lap Board Siding Calculator — Inch Calculator](https://www.inchcalculator.com/siding-clapboard-calculator/)
- [Adjusting Siding Exposures — Fine Homebuilding](https://www.finehomebuilding.com/2022/04/20/adjusting-siding-exposures)
- [Stucco Finish Types — Sto Corp.](https://www.stocorp.com/stucco-finish-types/)
- [Types of Stucco Finishes & Textures — Stuccoboy](https://stuccoboy.com/finishes-textures/)
- [Stone Veneer Dimensions — Mountain View Stone](https://mountainviewstone.net/blogs/carved-in-stone/stone-veneer-dimensions)
- [A Builder's Guide to Real Natural Ledgestone Veneer — Stoneyard](https://stoneyard.com/ledger-stone-panels/)
- Diorama source: `src/three-renderer.ts` (`_floorTexture`, `_groundTexture`,
  `_mat`, wall-segment build loop), `src/canvas-render.ts` (`drawWalls`),
  `src/types.ts` (`Scene3D`, `FloorLook3D`, `WallKind`), `src/ui/sidebar.ts`
  (`_scene3dSection`, `_floorLookOverrides`) — read directly for this doc.
