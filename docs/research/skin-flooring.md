# Flooring materials for skinning (3D floor texture expansion)

## Summary

Diorama already ships a procedural floor-texture system: `Store.scene3d.floorTex`
(`FloorTexKind = 'none' | 'wood' | 'tile' | 'concrete'`, `types.ts`), rendered
by `ThreeDRenderer._floorTexture(kind)` in `three-renderer.ts` — a 256×256
`<canvas>` painted with `fillRect`/`stroke`/per-pixel noise, wrapped into a
`THREE.CanvasTexture` (`RepeatWrapping`, `SRGBColorSpace`), cached forever in
`_texCache`, and `repeat`-scaled to the floor's mm dimensions (`f.w/800`,
`f.d/800` — one texture tile per 800 mm). It's a **3D-only** feature: the 2D
canvas floor is a flat `#101020` fill + grid (`canvas-render.ts drawFloor`),
never textured. `floorColor`/`floorTex`/`wallColor` apply globally
(`scene3d`) with **per-floor overrides** via `Floor.look3d` (`FloorLook3D`).

This matters for the kiosk/theater/skin use case because flooring is the
single largest visible surface in every 3D shot — sims-cam, auto-follow, and
every fixed camera preset all show the floor plane continuously. Three more
procedural kinds (wood is one style only, tile is one grid only) get you
disproportionate visual variety per line of code: the existing pattern
already proves out the "cheap canvas noise reads fine under `MeshToonMaterial`
banding" assumption, so this is pure execution — extend `FloorTexKind`,
extend one `if/else` chain, extend one sidebar `<select>`, done. This doc
catalogs the real residential flooring categories, their true-to-life colors
and module dimensions (converted to mm, since Diorama is mm-native), typical
layout patterns, and — for each — a concrete recipe for a toon-friendly
procedural `<canvas>` texture that fits the existing `_floorTexture` factory
verbatim (same 256×256 canvas, same repeat-per-800mm convention, same
disposal lifecycle).

## Platform / data model / real-world facts

### Existing Diorama texture plumbing (ground truth from the repo)

- `FloorTexKind` (`types.ts:445`): `'none' | 'wood' | 'tile' | 'concrete'`.
  Referenced by `Scene3D.floorTex` (global) and `FloorLook3D.floorTex`
  (per-floor override, `types.ts:459`, "inherit" sentinel handled in the
  sidebar as `undefined`/absent, not a real enum value).
- `ThreeDRenderer._texCache: Partial<Record<FloorTexKind, THREE.Texture>>`
  (`three-renderer.ts:913`) — one canvas built once per kind, kept for the
  renderer's lifetime, disposed only in `destroy()` (`:9653`). Adding a kind
  means adding one cache slot implicitly (the `Partial<Record<...>>` already
  covers any enum member) — **no signature change needed** there.
- `_floorTexture(kind)` (`:1656`): `kind === 'none'` short-circuits `null`
  (no map at all — cheapest path, keep it). Otherwise: 256×256 canvas, 2D
  context, an `if (kind === 'wood') {...} else if (kind === 'tile') {...}
  else {/* concrete */}` chain (**note: today concrete is the unconditional
  `else`, not a `kind === 'concrete'` check — adding a 4th kind means
  converting that final `else` into `else if (kind === 'concrete') {...} else
  {/* new kind */}` or, better, an explicit `else if` per kind with a safe
  fallback at the very end**), builds `THREE.CanvasTexture`, sets
  `wrapS = wrapT = THREE.RepeatWrapping`, `colorSpace = THREE.SRGBColorSpace`,
  caches, returns.
- Applied at three call sites in `updateFloor` (`:1934-2055`): the main slab
  gets `floorTex.repeat.set(fw/800, fd/800)`; two other slab paths (used for
  loop-clipped `ShapeGeometry` floors, presumably per-room-loop patches) set
  a flat `1/800` repeat because those use raw-mm UVs directly, not
  normalized 0..1 UVs — **this convention (some paths scale repeat by floor
  size, some by a flat 1/800) must be matched exactly by any new kind**;
  nothing about the texture *content* differs, only how callers set
  `.repeat`, so it's not a per-kind concern, just a note for whoever wires a
  5th slab path later.
- The sibling `GroundKind` system (`grass/rock/concrete/blacktop/mulch/sand/
  water`, `_groundTexture` at `:1712`) is architecturally identical (own
  cache `_groundTexCache`, same canvas size/wrap/colorSpace) and is the
  better template for *organic/speckled* looks (uses a shared `speckle(n, r,
  colors[])` closure — worth lifting into a shared helper if `floorTex`
  grows past ~4 kinds, since wood-grain and stone-veining are speckle-like
  too). It confirms the "many small kinds sharing one canvas-noise idiom" pattern
  scales fine in this codebase.
- **Sidebar wiring** (`sidebar.ts:4391-4394` for the global "3D Scene" section,
  `:4470-4474` for the per-floor "This floor only" override): a plain
  `<select>` bound to `sc.floorTex`, options are just `Object.keys`-style
  literals typed directly in the template (not derived from an array
  constant) — so a new kind needs one new `<option>` in **both** places.
- 3D uses `MeshToonMaterial` exclusively via `_mat()` (`:1183`) — a factory
  that accepts `MeshStandardMaterialParameters` (so `map`, `color`,
  `roughness`, `metalness` are all accepted syntactically but roughness/
  metalness are silently dropped — **texture VALUE/shading differences must
  be baked into the canvas pixels**, not material PBR params) and pushes
  saturation via `_simsColor`. There is no tone mapping and no environment
  map — flat, punchy colors read best; anything subtle (fine noise,
  low-contrast veining) will wash out under the 4-step toon gradient band.
  The wood/tile/concrete textures already lean into this: wood uses hard
  ~0.55-alpha dark stroke lines for plank seams (not soft gradients),
  concrete uses fairly aggressive ±9 RGB per-pixel noise (`(Math.random()-0.5)*18`).
  New kinds should match that contrast level or they'll look flat/invisible
  once toon-shaded.
- 2D has **no analogous floor texture rendering at all** — `drawFloor`
  (`canvas-render.ts:1347`) fills a fixed dark navy rect + optional bg image
  + grid. Flooring skins are therefore a pure 3D-view feature; no 2D work is
  implied unless a future task explicitly wants a 2D floor swatch/preview
  (see Potential additional features).

### Real-world flooring categories, sizes (mm), colors

All the following are standard, verifiable industry facts, converted to mm
for direct use as texture-tile pitches (Diorama repeats a tile every 800 mm
of floor by convention, but the *ratio* of plank/tile size to that 800 mm
reference is what should drive each canvas's internal proportions, not an
attempt at literal real-world scale — the existing wood texture, for
instance, draws four ~64px-tall "planks" per 256px canvas, i.e. **it doesn't
try to be a real board width, it just needs to look like planks at
in-game viewing distance**).

**Hardwood / engineered wood**
- Board width: narrow ~75–125 mm (2.25–5 in, classic "strip" flooring),
  medium ~125–180 mm, wide-plank ~180–250+ mm. Herringbone/chevron blocks run
  narrower, ~70 mm.
- Board length: commonly 600–1800 mm (random-length runs within a pack;
  premium "long plank" products go longer).
- Thickness: engineered 10–15 mm total (2–5 mm real-wood wear layer over
  plywood/HDF core); solid hardwood 18–22 mm.
- Species/color families: red oak (warm reddish-tan, prominent open grain —
  hides wear well), white oak (cooler/more neutral tan-gray, tighter grain),
  maple (pale cream/blond, subtle grain, harder to hide imperfections),
  walnut (dark chocolate-brown, sometimes with lighter sapwood streaks),
  hickory (high color variation board-to-board — light cream to dark brown
  in the same floor, very prominent grain/character, one of the hardest
  common species), cherry (warm reddish-amber, darkens with age).
- Finishes affecting appearance: matte/satin/gloss sheen; hand-scraped
  (distressed, uneven plank surface with visible tool marks); wire-brushed
  (textured grain, grain valleys darker than ridges).
- Layout: strip flooring is laid running-bond (staggered end-joints, the
  overwhelmingly common residential pattern); parquet/chevron/herringbone
  are specialty geometric layouts (see pattern section below).
  Source: [Wood and Beyond — plank sizes](https://www.woodandbeyond.com/blog/what-size-does-wood-flooring-come-in/),
  [JP Flooring — engineered plank/width guide](https://www.jpflooring.com/a/blog/engineered-hardwood-floor-sizes-a-guide-to-planks-and-widths),
  [Bruce — choosing board width](https://www.bruce.com/en-us/resources/how-to-choose-the-best-hardwood-floor-width-bruce-flooring.html).

**Laminate & luxury vinyl plank (LVP) / luxury vinyl tile (LVT)**
- Common plank footprints (industry-standard nominal inch sizes, converted):
  6 in × 48 in = **152.4 × 1219.2 mm**; 7 in × 48 in = **177.8 × 1219.2 mm**;
  9 in × 60 in = **228.6 × 1524 mm** (a popular "wide/long" premium format).
  LVT (tile-look vinyl, not plank) commonly matches ceramic tile sizes (see
  below), often 300×300 mm or 300×600 mm equivalents.
- Thickness: 2–8 mm core is typical for LVP; wear layer 6–30 mil (0.15–0.76 mm),
  12 mil minimum recommended residential, 20 mil+ for pet/high-traffic homes.
  Click-lock LVP with attached underlayment commonly lands 4–8 mm total.
- Visual: printed photographic layer under a clear wear layer — can mimic
  ANY wood species/color above, OR stone/tile looks (travertine-look LVT,
  slate-look LVT) — so visually it's "pick a look, not a distinct material,"
  meaning Diorama doesn't need a separate LVP canvas recipe; it's the same
  wood-plank or tile-grid canvas at a different color/plank-ratio.
  Source: [FlooringStores — LVP thickness guide](https://www.flooringstores.com/a/blog/lvp-thickness-guide),
  [MSI — LVP thickness](https://www.msisurfaces.com/blogs/post/2019/09/25/choosing-the-right-thickness-of-luxury-vinyl-planks.aspx).

**Ceramic / porcelain tile**
- Very common metric field-tile sizes: 300×300 mm (12×12 in), 450×450 mm
  (18×18 in), 600×600 mm (24×24 in), and large-format planks/slabs
  600×1200 mm (24×48 in). Grout joints: rectified (precision-cut,
  minimal-variance) porcelain runs 1.5–3 mm (1/16–1/8 in); standard
  calibrated ceramic/porcelain commonly 3–5 mm (3/16–1/4 in); natural stone
  and rustic tile often wider, up to 6 mm (1/4 in). Never below ~1.6 mm
  (1/16 in) per most manufacturer specs.
  Source: [DIYTileGuy — grout line sizing](https://www.diytileguy.com/grout-lines/),
  [Custom Building Products TB85 grout-joint bulletin (PDF)](https://www.custombuildingproducts.com/media/60712312/tb85-grout-joint-width.pdf),
  [TileCloud — standard grout size](https://tilecloud.com.au/blogs/news/standard-grout-size).
- Common color families: warm greige/beige (most common "builder" tile),
  cool gray, white/off-white, and wood-look porcelain planks (printed to
  mimic oak/walnut — visually a "tile" module shape with a "wood" color/
  grain skin, another point-in-favor of treating look and module-shape as
  independent axes rather than one texture per marketing name).
- Layout patterns (definitions, all directly applicable as a texture-grid
  parameter — offset per row):
  - **Running bond / brick joint / "staggered"**: each row offset by ~1/3–1/2
    tile length from the row above — the dominant residential floor-tile
    layout.
  - **Herringbone**: rectangular tiles at opposing 45° (or 90°, "straight
    herringbone") angles, square-cut ends butting the long edge of the
    neighbor — zigzag look.
  - **Chevron**: tile ends pre-mitered at an angle so the V-points meet
    exactly — sharper/more graphic than herringbone (herringbone has a
    stepped look at the join; chevron is a continuous point).
  - **Basketweave, windmill, stack/grid (no offset)** are additional named
    patterns but running-bond + herringbone + a plain grid cover the
    practical variety worth modeling procedurally.
  Source: [CleTile — 14 floor tile patterns](https://www.cletile.com/blogs/cle-education/floor-tile-layout-patterns),
  [TileBar — herringbone vs chevron](https://www.tilebar.com/learn/herringbone-vs-chevron-which-pattern-is-the-one-for-you/).

**Natural stone (marble, travertine, slate)**
- Marble: crystallized limestone; classic Carrara reads white/light-gray
  with soft gray veining; other varieties run cream, gold-veined, or
  dramatic black-and-gold. Veining comes from mineral impurities (clay,
  iron oxide) and is characteristically soft, branching, irregular streaks
  — NOT straight lines.
- Travertine: a banded limestone with a naturally pitted/dotted surface;
  "vein-cut" travertine shows directional linear striping, "cross-cut" shows
  swirled/non-directional movement; earthy tones — beige, walnut/noce,
  silver-gray, ivory.
- Slate: metamorphic, splits into thin cleft layers; wide color range —
  gray, green, purple-gray, black, rust/gold-flecked brown; naturally
  textured/matte "riven" surface (as opposed to marble/travertine's typical
  polish).
- Module sizes: common squares 300/330/400/450/600 mm (12/13/16/18/24 in);
  travertine plank format 300×600 mm (12×24) up to 450×900 mm (18×36);
  thickness typically 12/15/20/30 mm.
  Source: [Daltile — travertine](https://www.daltile.com/natural-stone-product-category/travertine),
  [Floor Coverings International — natural stone guide](https://floorcoveringsinternational.com/locations/us/tx/plano/tips/natural-stone-floors/).

**Polished / stained concrete**
- Natural cement color ranges near-white through mid-gray to deep charcoal;
  gray is overwhelmingly the default/expected look. 2025-era trend pieces
  note warm-neutral stains (taupe, sandy tan, beige) and deep charcoal/near-
  black as popular alternatives to plain gray, plus blue-gray industrial
  tones.
- Acid-stain palette is inherently earthy (tan/brown/terracotta/soft
  blue-green — a chemical reaction with the cement, limited hues);
  water-based stains/dyes can hit almost any hue including black, white,
  vivid yellow/orange.
- Visual character: mottled/variegated color (acid stains especially —
  never a flat single tone), plus optional score-lines / control joints
  (straight expansion-joint cuts, typically on a grid) and a light
  aggregate-fleck sparkle when ground/polished exposes sand.
  Source: [Concrete Network — floor color guide](https://www.concretenetwork.com/concrete/interiorfloors/color.html),
  [PolishThePlanet — 2025 polished concrete color trends](https://www.polishtheplanet.com/blog/article/beyond-gray-the-hottest-color-trends-in-polished-concrete-for-2025).

**Carpet**
- Cut pile family: plush/Saxony (dense, uniform, flat sheared top — shows
  vacuum/footprint "shading" directionally), frieze (highly twisted yarn,
  curly/textured look, hides traffic patterns and footprints well).
- Loop pile family: Berber (chunky visible loop weave, classically flecked/
  heathered multi-tone coloring, very traffic-pattern-hiding), plain level-
  loop (low, durable, common in commercial/basement contexts).
- Cut-and-loop / "patterned" carpet: mixes pile heights within the same
  carpet for a subtle sculpted geometric texture.
- Color: solid residential carpet skews toward neutrals (beige/tan/gray/
  taupe, off-white) with Berber commonly a heathered multi-fleck blend
  rather than one flat color — visually this is the single biggest
  departure from the other categories (needs a fleck/noise texture, not
  planks or a grid).
  Source: [Happy Starts at Home — pile style guide](https://www.happystartsathome.com/loops-plush-berber-oh-my-the-best-carpet-pile-style-for-your-home/),
  [National Floors Direct — cut vs loop](https://www.nationalfloorsdirect.com/learn/articles/cut-pile-vs-loop-pile-carpet-what-you-need-to-know/).

**Garage epoxy / flake coating**
- Flake sizes: 1/16 in (~1.6 mm), 1/8 in (~3.2 mm), 1/4 in (~6.4 mm, "the
  standard size you see on most garage floors"), up to 1 in (~25 mm) for
  bold/decorative blends. Flakes are randomly broadcast (not a grid), so
  visually this is a **speckle texture**, same idiom as the existing
  `_groundTexture` grass/rock speckle helper.
- Popular named color blends mix a base coat with contrasting fleck colors
  — e.g., black/white/gray ("Domino"-style), gray-blue ("Orbit"-style),
  tan/gray coastal blends, earth-tone blends — i.e., "gray or dark base +
  2-4 accent-colored flecks" is the general recipe regardless of the
  marketing name.
  Source: [Mach One — flake color/size choices](https://www.mach1epoxy.com/flake-color-choices/),
  [NWA Garage Floors — flake color chart](https://www.nwagaragefloors.com/garage-floor-flakes-color-chart/).

### What is NOT possible / limits worth flagging
- **No physically-based reflectivity** — `_mat()` drops `roughness`/
  `metalness` (PBR-only knobs are silently dropped per CLAUDE.md's "Sims-
  style rendering" section); a "high-gloss polished marble" look can only be
  faked via canvas contrast/highlight painting, never a real specular
  response. This is consistent with every other texture in the codebase and
  is not a regression to fix — it's the house style.
- **No real 3D relief** — hand-scraped wood grain valleys, slate's riven
  texture, and epoxy flake grain are all necessarily flat-shaded color
  variation on a flat plane; there's no normal-mapping path in the toon
  pipeline (would need a new material capability, out of scope here).
  the CLAUDE.md house style deliberately trades this for cheap flat toon
  banding, so this is an accepted look, not a shortfall to solve.
- **No literal-scale accuracy** — the existing wood texture doesn't attempt
  a true board-width-to-mm mapping (it just divides 256 px into a handful of
  visually-plausible "plank" bands); new kinds should follow the same
  "looks right at typical camera distance" approach rather than computing
  exact real-world module sizes into UV space, since `.repeat` is already
  fixed at one tile per 800 mm regardless of what's painted inside that
  tile.
- **2D has zero floor-texture rendering** — anyone expecting a 2D plan-view
  material swatch will not see one; this would be new 2D work (see Potential
  additional features), not something already latent in `drawFloor`.

## Diorama design / integration

### Recommended new `FloorTexKind` members

Extend the enum (`types.ts:445`) additively — existing saved stores keep
working since `'none'` stays the default and unknown-to-old-code values
degrade gracefully wherever `floorTex` is read defensively (it already is,
via `?? 'none'` at the sidebar `<select>` binding):

```ts
export type FloorTexKind =
  | 'none' | 'wood' | 'tile' | 'concrete'
  // new:
  | 'herringbone_wood' | 'stone' | 'carpet' | 'checkerboard_tile' | 'epoxy_flake';
```

Pick a subset rather than all five in one pass — `herringbone_wood` (reuses
the existing wood palette, new layout only), `stone` (marble/travertine
speckle+vein, distinct from tile's hard grid), and `carpet` (flat color +
fleck noise, visually the most different from anything that exists) are the
highest-value/lowest-risk additions. `checkerboard_tile` and `epoxy_flake`
are easy repeats of patterns already proven (`tile`'s grid, `_groundTexture`'s
speckle) and can follow later.

### Per-kind canvas recipes (drop-in `_floorTexture` branches)

All follow the established shape: 256×256 canvas, fill base color, layer in
pattern strokes/noise, return as before. Each is written as it would slot
into the existing `if (kind === 'wood') {...} else if (...) {...}` chain.

**`stone` (marble/travertine-style)** — base a warm-white or greige fill,
then a handful of long, soft, low-opacity bezier "vein" strokes (reuse the
wood texture's `bezierCurveTo` grain-streak idiom exactly, just fewer/
longer/more randomly-angled strokes instead of horizontal grain lines,
plus a couple of branch strokes off the main veins for the "branching
mineral vein" look real marble has), then a light per-pixel noise pass
(same `getImageData` ± noise trick concrete already uses, smaller magnitude,
~±6) for a subtle mottled/travertine-pit feel:
```ts
} else if (kind === 'stone') {
  g.fillStyle = '#d8d2c4'; g.fillRect(0, 0, 256, 256);   // warm greige field
  const img = g.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    img.data[i] += n; img.data[i + 1] += n * 0.9; img.data[i + 2] += n * 0.8;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 5; i++) {                          // soft branching veins
    g.strokeStyle = `rgba(140,132,118,${0.25 + Math.random() * 0.2})`;
    g.lineWidth = 1 + Math.random() * 1.5;
    const x0 = Math.random() * 256, y0 = Math.random() * 256;
    const x1 = x0 + (Math.random() * 160 - 80), y1 = y0 + (Math.random() * 160 - 80);
    g.beginPath(); g.moveTo(x0, y0);
    g.bezierCurveTo(x0 + 40, y0 - 30, x1 - 40, y1 + 30, x1, y1); g.stroke();
  }
}
```

**`carpet`** — flat mid-tone fill + dense small-radius speckle (the
`_groundTexture` `speckle(n, r, colors[])` closure is a perfect match — worth
promoting to a small shared module-level helper both texture builders can
import rather than copy-pasting a second closure) for the Berber-style
heather look, no hard lines at all (carpet has no seams at floor-texture
scale):
```ts
} else if (kind === 'carpet') {
  g.fillStyle = '#8a7d6c'; g.fillRect(0, 0, 256, 256);   // warm taupe field
  const fleck = ['#a89482', '#766655', '#c4b5a0', '#5f5346'];
  for (let i = 0; i < 2200; i++) {                        // dense fine fleck
    g.fillStyle = fleck[(Math.random() * fleck.length) | 0];
    const x = Math.random() * 256, y = Math.random() * 256;
    g.beginPath(); g.arc(x, y, 0.8 + Math.random() * 0.8, 0, 2 * Math.PI); g.fill();
  }
}
```
(use the real `speckle()` helper once shared; the exact fleck palette —
e.g. `['#a89482', '#766655', '#c4b5a0', '#5f5346']` — should read as a
heathered blend, no single color dominating).

**`herringbone_wood`** — reuse the wood base fill + grain-streak logic
verbatim, but instead of horizontal plank rows, draw a herringbone grid of
short rectangles at alternating ±45° (or a plain 90° "basket" pair) — this
is the one case where the pattern (not the material) changes, confirming
that "layout" and "material" are separable concerns worth keeping
orthogonal if this system grows (e.g. eventually `Floor.look3d` could carry
an independent `floorPattern` alongside `floorTex`, though that's a bigger
refactor than this doc scopes — flag it as an option, not a requirement).

**`checkerboard_tile`** / **`epoxy_flake`** — checkerboard is the existing
`tile` grid logic with alternating cell fill colors (two-tone) instead of
one tile color + per-cell shade jitter; epoxy_flake is the existing
concrete-noise base plus a `speckle()` pass using 2-4 saturated fleck colors
scattered at small radius (mirrors garage-epoxy's random-broadcast look
directly).

### Where this plugs into existing machinery

- **`_mat()` toon factory** — no changes needed; these are `map` textures
  fed straight into the same `MeshToonMaterial` factory every other surface
  uses. Keep contrast punchy (CLAUDE.md's toon-banding note) — err toward
  the concrete texture's aggressive ±18 noise rather than something subtle.
- **Dirty-key rebuilds** — `floorTex` already rides `_keyFloor` (it's part of
  `scene3d`/`look3d`, both folded into `configRev`); no new dirty-key wiring
  required for any of these additions.
- **`uiMode`/kiosk** — purely cosmetic scene-appearance state (like the
  existing 3 kinds), so it needs zero interaction/permission gating beyond
  what `floorTex` already has (sidebar edit-only, same as every other
  `scene3d` field).
- **`Store` migration** — `FloorTexKind` is a plain string union stored
  inline on `scene3d`/`look3d`, not a separate top-level `Store` field, so
  the "new top-level field must be added to `_loadFromHa`'s explicit list"
  gotcha from CLAUDE.md **does not apply** here — this is the cheap case.
- **Sidebar** — two `<select>` blocks (global + per-floor override) each get
  N new `<option>` lines; no new component, no new section.
- **Ground-covering (`GroundKind`) cross-pollination** — `stone`/`carpet` as
  described are floor-only, but a matching **outdoor** `GroundKind` addition
  (e.g. a paver/flagstone patio look, distinct from the existing `rock`
  speckle) would reuse the exact same recipe against `_groundTexture`
  instead — worth doing in the same pass if outdoor stone patios come up,
  since it's the identical canvas code against a parallel cache.

## Setup / integration steps

1. Extend `FloorTexKind` in `types.ts` with the new kind(s) chosen (start
   with `stone`, `carpet`, `herringbone_wood` per the recommendation above).
2. In `three-renderer.ts._floorTexture`, convert the current unconditional
   `else` (concrete) into an explicit `else if (kind === 'concrete')`, then
   add one `else if` branch per new kind (canvas recipes above), ending in a
   safe final `else` fallback (flat mid-gray) so an unrecognized string
   never throws.
3. (Optional but recommended if adding ≥2 speckle-based kinds) Lift the
   `speckle(n, r, colors[])` closure out of `_groundTexture` into a small
   private helper method (or shared module function) both `_floorTexture`
   and `_groundTexture` call, to avoid duplicating it a third time.
4. Add the new `<option>` entries to both `<select>` blocks in `sidebar.ts`
   (`:4391` global "3D Scene" section, `:4470` per-floor "This floor only"
   override) — plain literal option values/labels matching the existing
   style (no shared constant array exists to update; consider introducing
   one, e.g. `FLOOR_TEX_KINDS: {value, label}[]`, once the list exceeds ~5-6
   entries so both selects and future docs stay in sync from one source).
5. `npm run typecheck && npm run build` — verify no other exhaustive
   `switch`/`if-chain` over `FloorTexKind` exists elsewhere that needs a new
   arm (grep confirms today it's used only in the two sidebar selects and
   the one `_floorTexture` chain — no other consumer as of this writing).
6. Manually verify in `npm run dev`: switch the "3D Scene" floor-texture
   dropdown through each new kind, confirm the toon-shaded look reads
   correctly at both the sims-cam distance and a close top-down view (texture
   tiling artifacts show up most at close range), and confirm a per-floor
   override still falls back to "inherit" correctly.
7. No test-harness page exists for floor textures specifically (`test-pages/`
   has no `floortex-test.html`); if this becomes a recurring area of churn,
   consider a small deterministic canvas-hash regression test following the
   pattern of `weather-fx-test.html` (`?c=` query param selecting a preset).

## Potential additional features

- **2D floor-texture preview swatch** — `drawFloor` currently never paints a
  texture; a lightweight 2D echo (even just a small tiled-pattern fill
  behind the grid, gated by the same `floorTex` value) would let users
  preview the material choice without opening the 3D view. Bigger lift than
  it sounds because `drawFloor`'s current fill is a single solid `fillRect`
  — would need its own small canvas-pattern cache mirroring `_texCache`.
- **Layout as an independent axis** — separate "material" (wood/stone/
  carpet/concrete) from "pattern" (running-bond/herringbone/chevron/
  checkerboard/plain-grid) as two orthogonal fields rather than baking every
  combination into its own enum member (`herringbone_wood` vs. plain `wood`
  otherwise multiplies enum members combinatorially as more layouts are
  added). Bigger refactor, worth flagging as the "real" long-term design
  even though this doc recommends the cheaper combined-enum path for the
  first pass.
- **Rug/area-specific override** — `Furniture` kind `rug` already exists as
  its own flat-slab piece independent of the floor material; a natural
  companion feature is letting a `rug` piece pick its OWN `floorTex`-style
  material (e.g. a carpet-pattern rug on a wood floor) reusing the exact
  same canvas recipes, rather than only ever being a flat tinted color.
- **Room-scoped flooring** (kitchen tile vs. living-room wood in the SAME
  floor) — today `floorTex` is one value per floor (or per-floor override
  of the global), not per-room. A per-`Room` texture override (paralleling
  `Room.occupancyEntity`'s per-room binding pattern) would need the floor
  slab to build as multiple per-loop `ShapeGeometry` patches with different
  materials instead of one slab — a real geometry-builder change, not just
  a new canvas, so scope it separately if requested.
- **Grout/plank-line color customization** — expose a secondary "accent"
  color (grout line, mortar joint, or plank-seam darkness) per floor, since
  real tile/wood floors vary enormously in how much the joint lines read
  (dark grout vs. grout-matched-to-tile). Cheap to add as one more optional
  `Scene3D`/`FloorLook3D` field feeding the existing canvas draw calls.

## Open questions & risks

- **Combined vs. orthogonal enum growth**: is `FloorTexKind` meant to stay a
  flat list of "look" presets (this doc's assumption, cheapest to ship), or
  should material/pattern be split now before more combinations accumulate?
  Product call, not a technical blocker — flagged above.
  Recommendation: ship the flat-enum version first (low risk, matches
  existing 3-kind precedent); revisit only if a 4th or 5th layout variant
  is requested for the same material.
- **Toon-shading contrast tuning is eyeball-only** — there's no automated
  check that a new texture "reads" well under `MeshToonMaterial`'s 4-step
  gradient; every existing kind was clearly hand-tuned (the wood texture's
  strong dark stroke lines, concrete's fairly extreme ±18 noise). Expect a
  visual-iteration pass per new kind rather than a one-shot correct value.
- **256×256 canvas ceiling for high-contrast patterns** — herringbone/
  chevron layouts need enough resolution to show distinct plank shapes at
  a 1-tile-per-800mm repeat; 256px may look chunky/aliased for a fine
  herringbone versus the current coarse plank-row wood texture. May need a
  larger canvas (512×512) for pattern-heavy kinds specifically, which is a
  cheap per-kind choice (canvas size isn't hardcoded as a shared constant,
  it's set inline at the top of `_floorTexture` per call — would need
  lifting to a per-kind size, small change).
- **No literal real-world scale validation possible from this research
  alone** — the mm dimensions cataloged above are real, but Diorama's
  texture tiling is NOT scale-locked to them (repeat is fixed at 1 tile /
  800 mm regardless of content) — so "is an 800mm-square wood texture tile
  visually consistent with a 150mm actual plank width" is a stylization
  choice already accepted by the existing `wood` kind (it draws ~4 plank
  rows per 256px canvas => each "plank" reads as roughly 200mm wide at the
  800mm/tile convention, in the right ballpark but not engineered to be
  exact) — new kinds should match that existing loose-fidelity bar, not
  attempt precision the system doesn't otherwise have.
- **Carpet flooring is visually a bigger departure than wood/tile/concrete
  variants** — it's the first "soft goods" floor covering in a system that
  has otherwise only modeled hard/rigid surfaces (floor, ground). Nothing
  technically blocks it (it's still just a flat plane + canvas texture) but
  it may raise the question of whether carpet should instead be a very
  large `rug`-kind `Furniture` piece covering an entire room rather than a
  floor-level material — worth a product decision before implementing.

## Sources

- [Wood and Beyond — What size does wood flooring come in?](https://www.woodandbeyond.com/blog/what-size-does-wood-flooring-come-in/)
- [JP Flooring — Engineered hardwood floor sizes: planks and widths](https://www.jpflooring.com/a/blog/engineered-hardwood-floor-sizes-a-guide-to-planks-and-widths)
- [Bruce Flooring — How to choose the best hardwood floor width](https://www.bruce.com/en-us/resources/how-to-choose-the-best-hardwood-floor-width-bruce-flooring.html)
- [FlooringStores — LVP thickness guide](https://www.flooringstores.com/a/blog/lvp-thickness-guide)
- [MSI Surfaces — Choosing the right thickness of luxury vinyl planks](https://www.msisurfaces.com/blogs/post/2019/09/25/choosing-the-right-thickness-of-luxury-vinyl-planks.aspx)
- [DIYTileGuy — How big should your grout lines be?](https://www.diytileguy.com/grout-lines/)
- [Custom Building Products — TB85 grout joint width (PDF)](https://www.custombuildingproducts.com/media/60712312/tb85-grout-joint-width.pdf)
- [TileCloud — What is the standard grout size?](https://tilecloud.com.au/blogs/news/standard-grout-size)
- [CleTile — 14 floor tile patterns, explained](https://www.cletile.com/blogs/cle-education/floor-tile-layout-patterns)
- [TileBar — Herringbone vs. chevron](https://www.tilebar.com/learn/herringbone-vs-chevron-which-pattern-is-the-one-for-you/)
- [Dynamic Stone Tools — Herringbone, chevron & running bond](https://dynamicstonetools.com/blogs/news/stone-tile-patterns-herringbone-chevron-running-bond)
- [Daltile — Natural stone: travertine](https://www.daltile.com/natural-stone-product-category/travertine)
- [Floor Coverings International — A guide to natural stone flooring](https://floorcoveringsinternational.com/locations/us/tx/plano/tips/natural-stone-floors/)
- [Concrete Network — Concrete floor colors](https://www.concretenetwork.com/concrete/interiorfloors/color.html)
- [PolishThePlanet — Beyond gray: 2025 polished-concrete color trends](https://www.polishtheplanet.com/blog/article/beyond-gray-the-hottest-color-trends-in-polished-concrete-for-2025)
- [Concrete Network — Stained concrete color chart](https://www.concretenetwork.com/stained-concrete/colorchart.html)
- [Happy Starts at Home — The best carpet pile style for your home](https://www.happystartsathome.com/loops-plush-berber-oh-my-the-best-carpet-pile-style-for-your-home/)
- [National Floors Direct — Cut pile vs. loop pile carpet](https://www.nationalfloorsdirect.com/learn/articles/cut-pile-vs-loop-pile-carpet-what-you-need-to-know/)
- [Mach One — Explore epoxy flake colors and sizes](https://www.mach1epoxy.com/flake-color-choices/)
- [NWA Garage Floors — Garage floor flakes color chart](https://www.nwagaragefloors.com/garage-floor-flakes-color-chart/)
