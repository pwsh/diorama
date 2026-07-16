# Procedural texture generation engine (the layer under skin-flooring / skin-walls)

Research doc for a new Diorama feature. Build-ready: cites primary Three.js /
MDN docs and real-world module sizes with sources, and exact Diorama hooks
(files, functions, line numbers, dirty keys) so this can be implemented
without further investigation.

**Scope note**: `docs/research/skin-flooring.md` and `docs/research/skin-walls.md`
already catalog the real-world *material* facts (wood/tile/stone/brick/
wallpaper colors and mm module sizes) and propose per-kind canvas recipes for
floors and walls respectively. This doc does **not** re-litigate that catalog.
It is the layer underneath both: the shared canvas-2D/`CanvasTexture`
*engineering* — tiling correctness, mm→repeat math, determinism, an
extensible recipe registry, and a unified material data model (kind + color
params + per-room override) that both the flooring and wall-finish docs
should be built on top of rather than each growing its own one-off cache and
`if/else` chain. Read this doc first if implementing either of those, or if
adding a texture kind to `GroundKind` (the yard system) — all three today are
independent copy-pasted canvas builders with no shared plumbing.

## Summary

Diorama's only procedural-texture precedent today is three parallel,
structurally-identical, but code-duplicated systems in `three-renderer.ts`:
`_floorTexture(kind: FloorTexKind)` (`:1656`, cache `_texCache` at `:913`),
`_groundTexture(kind: GroundKind)` (`:1712`, cache `_groundTexCache`), and (per
the wall-finish research doc) a proposed fourth, `_wallTexture`. Each builds a
256×256 `<canvas>` once, draws flat fills + strokes + per-pixel noise with the
2D context, wraps it in a `THREE.CanvasTexture`, sets `RepeatWrapping` +
`SRGBColorSpace`, caches forever, and feeds it as the `map` on the shared
`_mat()` `MeshToonMaterial` factory. This matters for the kiosk/theater/skin
use case because **every material surface in the whole 3D view — floor, walls,
soon ground — is this exact same primitive**, so hardening it once (a shared
recipe registry, correct/tested mm-to-UV repeat math, deterministic noise, a
uniform material-parameter shape) pays off across floor, wall, and yard
skinning simultaneously, and unblocks the natural next step both sibling docs
flag but don't solve: **per-room material override**, which needs the floor
slab to build as multiple per-loop `ShapeGeometry` patches with independent
materials instead of one slab per floor.

## Platform / data model / real-world facts

### Three.js primitives (verified against the official docs)

- **`THREE.CanvasTexture`** ([three.js docs](https://threejs.org/docs/#api/en/textures/CanvasTexture)):
  constructed from an `HTMLCanvasElement`/`OffscreenCanvas`; unlike `Texture`,
  it sets `needsUpdate = true` automatically at construction, and any time the
  canvas is redrawn afterward `needsUpdate` must be set again for the GPU
  upload to refresh. Default filtering is `LinearFilter` (mag) /
  `LinearMipmapLinearFilter` (min) and default wrap is `ClampToEdgeWrapping`
  — **all three defaults are wrong for a tiling material** and Diorama's
  existing code already overrides wrap (`wrapS = wrapT = RepeatWrapping`,
  `three-renderer.ts:1702`) but — verified by reading the source directly —
  **does NOT override min/magFilter for `_floorTexture`/`_groundTexture`**.
  Only the toon `gradientMap` DataTexture (`_gradientMap()`, `:1163`) sets
  `NearestFilter` on both. This is an important correction to the premise of
  this research request: Diorama's pattern textures are **not** nearest-
  filtered today; they use the smooth default. That's arguably correct — the
  crisp "toon" look comes entirely from the 4-step `MeshToonMaterial`
  gradient *lighting* band, not from pixelating the diffuse texture, and
  `NearestFilter` on a 256 px wood-grain texture tiled across a multi-meter
  floor would look chunky/aliased rather than stylized. **Do not blanket-apply
  `NearestFilter` to new pattern textures** — reserve it for the gradient map
  only, unless a specific new kind (e.g. an 8-bit "pixel-art rug" look) wants
  the aliased aesthetic on purpose.
- **`THREE.DataTexture`** ([three.js docs](https://threejs.org/docs/#api/en/textures/DataTexture)):
  the mechanism behind the shared gradient map — a raw typed-array texture
  (`Uint8Array`, `RedFormat`, width=4/height=1 in Diorama's case) with
  `generateMipmaps = false` and `NearestFilter` both directions so the 4 hard
  color steps don't blur into a smooth ramp. This is the correct reference
  pattern for any *non-color, discrete-step* texture; pattern/diffuse
  textures (the subject of this doc) are a different case and should stay on
  `CanvasTexture` with normal filtering.
- **`MeshToonMaterial.gradientMap`** ([three.js docs](https://threejs.org/docs/pages/MeshToonMaterial.html);
  corroborated by [sbcode.net's MeshToonMaterial tutorial](https://sbcode.net/threejs/meshtoonmaterial/)
  and a [three.js forum thread on combining an image map with toon shading](https://discourse.threejs.org/t/adding-image-to-toon-material/60271)):
  the gradient map must have `minFilter`/`magFilter` set to `NearestFilter` or
  the discrete bands blur into a smooth ramp, defeating the cel-shaded look —
  Diorama already does this correctly. A `map` (diffuse/pattern texture) and
  a `gradientMap` compose independently: the diffuse texture supplies
  per-texel *color*, the gradient map supplies the *lighting quantization* —
  confirmed by the forum thread's discussion of combining an image texture
  with toon shading. This is exactly Diorama's existing floor recipe
  (`map: floorTex, color: floorColor` both feed `_mat()` together,
  `three-renderer.ts:1991-1992`) and generalizes cleanly to walls/rooms.
- **Texture repeat & wrapping** ([Texture.wrapS docs](https://threejs.org/docs/#api/en/textures/Texture.wrapS);
  [three.js forum: "How to repeat texture properly?"](https://discourse.threejs.org/t/how-to-repeat-texture-properly/56430)):
  `repeat` > 1 on an axis requires `wrapS`/`wrapT` = `RepeatWrapping` (or
  `MirroredRepeatWrapping`) on that axis or the texture just samples the
  clamped edge pixel repeatedly instead of tiling — a common footgun the docs
  call out explicitly and which Diorama's existing code already avoids.
  `offset` shifts UVs in texture-fraction units (1.0 = one full texture
  width); Three.js composes `offset`/`repeat`/`rotation`/`center` into one UV
  transform matrix (`Texture.updateMatrix()`), so combining a repeat-scale
  with a rotation (e.g. a diagonal herringbone-oriented board) is a supported,
  cheap operation, not a custom shader.
- **Color-space table for `MeshToonMaterial` maps** (verified directly against
  the current [three.js MeshToonMaterial docs](https://threejs.org/docs/pages/MeshToonMaterial.html)):
  `map`/`emissiveMap` → `SRGBColorSpace`; `gradientMap`/`normalMap`/`bumpMap`/
  `alphaMap`/`aoMap`/`displacementMap` → `NoColorSpace`; `lightMap` →
  `LinearSRGBColorSpace`. Diorama's existing code already gets this right —
  `_floorTexture`/`_groundTexture` set `tex.colorSpace = THREE.SRGBColorSpace`
  on the pattern `map` (`three-renderer.ts:1703`, `:1782`) while the gradient
  `DataTexture` is left at its `NoColorSpace` default (never set explicitly,
  which is correct since that's the default) — any new pattern-texture kind
  should follow the `map` row, never the `gradientMap` row.
- **WebGL power-of-two constraint on `RepeatWrapping`** ([MDN — Using textures
  in WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL);
  corroborated by a [three.js forum NPOT thread](https://discourse.threejs.org/t/texture-is-not-power-of-two-cant-change-texture/8433)):
  in WebGL1, a non-power-of-two texture is restricted to `ClampToEdgeWrapping`
  and `Nearest`/`Linear` filtering with no mipmaps — `RepeatWrapping` (which
  every tiling pattern texture needs) **requires power-of-two dimensions**
  (WebGL2 relaxes this, but Diorama targets tablets/kiosk browsers of unknown
  vintage per CLAUDE.md's mobile-robustness section, so treat POT as a hard
  constraint, not a nice-to-have). This is why every existing recipe uses a
  **256×256** canvas (`_floorTexture`, `_groundTexture`, `_wallTexCache`'s
  proposed sibling) — that size is not arbitrary, it's the smallest power-of-
  two that reads as detailed enough for grain/grid content at typical camera
  distance. **Any new recipe, or the "512×512 for pattern-heavy kinds" idea
  both `skin-flooring.md` and `skin-walls.md` float, must stay power-of-two**
  (256, 512, 1024 — not e.g. 300×300 to literally mirror a real tile's mm
  ratio) or `RepeatWrapping` silently breaks on older/stricter WebGL1 devices.
- **`CanvasRenderingContext2D.createPattern(image, repetition)`**
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createPattern)):
  takes any `CanvasImageSource` (including another `<canvas>`) plus a
  repetition string (`'repeat'` / `'repeat-x'` / `'repeat-y'` / `'no-repeat'`,
  `''`/`null` treated as `'repeat'`) and returns a `CanvasPattern` usable as
  `fillStyle`/`strokeStyle`. **Diorama's existing textures do not use this API
  at all** — they draw the full tile content directly with `fillRect`/
  `stroke`/`bezierCurveTo` onto one canvas, which Three.js then tiles via GPU
  `RepeatWrapping`. `createPattern` would only matter if composing a
  *higher-resolution* canvas out of a smaller repeating motif (e.g. stamping
  a single subway-tile sprite across a bigger canvas before handing the whole
  thing to `CanvasTexture`) — a real option for finer patterns (see "Seamless
  tiling techniques" below) but not required for the coarse single-tile
  approach already in use.

### Seamless tiling techniques (how to avoid a visible seam)

1. **Single-tile direct draw + GPU `RepeatWrapping`** (Diorama's existing
   approach): draw content that is inherently seamless because every mark
   (grid lines, noise, plank rows) is either full-bleed edge-to-edge or
   symmetric — e.g. the existing `tile` kind's grid lines are drawn at `0`
   and `256` so the wrapped copies' lines coincide exactly; the `wood` kind's
   horizontal plank-row bands wrap cleanly because rows are evenly spaced
   full-width strips. This works well for *grid-based* patterns (tile,
   brick-course rows, shiplap boards) where the repeat period is chosen to
   equal the canvas size, but any content that varies *within* a row (the
   `wood` kind's `bezierCurveTo` grain streaks, or any per-pixel noise pass)
   is only *quasi*-seamless — the noise itself doesn't wrap, it just tiles
   with the row structure, and at typical viewing distance in a toon-shaded
   scene this reads fine (confirmed by the shipped `wood`/`concrete` kinds'
   visual acceptance) even though a mathematician would call it not
   perfectly continuous at the tile boundary.
2. **True seamless noise via wrap-around drawing**: to make freeform content
   (veins, streaks, speckle) actually wrap, draw every element **twice**
   (or four times, for corner wrap) — once at its position and once offset by
   ±canvasSize on the axis it's near the edge of — so anything that would be
   clipped at one edge reappears correctly on the opposite edge. This is the
   simplest fully-general "offset copy" tiling technique and needs no new
   library; it is a straightforward extension of the existing per-stroke loop
   (e.g. the `stone` kind proposed in `skin-flooring.md` could draw each vein
   stroke 2–4× at `(x,y)`, `(x±256,y)`, `(x,y±256)` when the stroke's bbox
   comes within its own stroke-width of an edge).
3. **Wrap by drawing into a doubled canvas and cropping the center** (the
   general "seamless tile" trick used broadly in texture-authoring tools,
   corroborated by the pattern-validation approach described at
   [GetZenQuery's Texture Generator](https://www.getzenquery.com/tools/texture-generator/)
   and the Medium walkthrough on [creating seamless tiled patterns](https://medium.com/@dna.mr.b/creating-seamless-tiled-patterns-from-ai-generated-images-17cb26ad4920)):
   render content onto a canvas twice the target size with the *pattern
   itself* wrapped via `drawImage` at four staggered offsets, then take the
   center quadrant as the final exported tile — guarantees edge continuity
   for arbitrary noise-based content at the cost of 4× the fill work (still
   cheap: one-time cost, cached forever, exactly like every existing kind).
4. **Perlin/Simplex noise for organic patterns** (wood grain, marble veining,
   stone mottling): per [Procedural Textures in JavaScript](https://clockworkchilli.com/blog/6_procedural_textures_in_javascript)
   and the classic [Perlin Noise on JavaScript Canvas](https://snippet.zone/2021/12/16/perlin-noise-on-javascript-canvas/)
   writeups, wood grain specifically reads well from **5–6 octaves of Perlin
   noise stretched along one axis** (elongating gradient-noise input
   coordinates in the grain direction produces the "streaky" look; more
   octaves/higher frequency = finer, more irregular grain). A from-scratch
   2D value-noise function (hash the 4 corners of the containing grid cell
   with a small integer hash, bilinear/smoothstep-interpolate) is ~20 lines
   and needs no dependency — consistent with the CLAUDE.md gotcha against
   adding unnecessary npm packages (a literal `node`-named package once
   sneaked in this way; a noise **library** is a much smaller risk but still
   unnecessary bundle weight for something this cheap to hand-roll). True
   Perlin/Simplex tiling (making the *noise function itself* periodic over
   an exact interval, not just the canvas) requires either doubling the
   sample-coordinate domain and blending the seams (technique 3 above) or a
   period-aware noise variant; for Diorama's use case (view from meters away,
   toon-shaded, tiled every 800 mm) the simple "draw with wrap-around offset
   copies" approach is sufficient and much simpler than implementing
   tileable Perlin.
5. **Wang tiles** ([Wikipedia](https://en.wikipedia.org/wiki/Wang_tile);
   the original SIGGRAPH paper, [Cohen & Shade, "Wang Tiles for Image and
   Texture Generation"](https://graphics.uni-konstanz.de/publikationen/Cohen2003WangTilesImage/index.html)):
   a small set of square tiles with color-coded edges that must match
   neighbor-to-neighbor, letting a *non-periodic* (no visible large-scale
   repetition) tiling be assembled from a handful of source tiles, optionally
   picked pseudorandomly at runtime since any two same-colored edges are
   interchangeable. This solves a **different** problem than Diorama has
   today: it hides *macro-scale* repetition (a repeating knot or vein
   pattern becoming visually obvious across a large floor), not micro-scale
   seam continuity. Given Diorama's textures repeat every 800 mm and a
   typical room is a handful of meters, the current single-tile approach
   hasn't shown a macro-repetition problem in practice (per `skin-flooring.md`'s
   real-world acceptance of the existing 3 kinds) — Wang tiles are a real,
   well-documented technique but **higher effort than this codebase's texture
   scale currently justifies**; flagged as a future option only if
   large open-plan floors start showing an obvious repeat (see Open
   questions & risks).

### mm ↔ repeat conversion — the exact formula, verified against the code

Three.js `Texture.repeat` is a `Vector2` multiplier on the *normalized* 0..1
UV space — `repeat.set(n, m)` makes the texture appear `n`×`m` times across
whatever geometry range maps to UV `0..1`. There are, per the existing code
(confirmed by direct read), **two different UV conventions already coexisting
in `three-renderer.ts`**, and any new material-kind work must know which one
applies at each call site:

1. **Normalized-UV geometries** (a `BoxGeometry`/`PlaneGeometry` floor slab
   whose UV already spans `0..1` across its full physical extent): repeat
   count = `physicalSizeMm / patternTileMm`. Diorama's main floor slab does
   exactly this — `floorTex.repeat.set(Math.max(1, f.w / 800), Math.max(1, f.d / 800))`
   (`three-renderer.ts:1937`, comment: *"Repeat ~1 tile per 800 mm so texel
   density stays sane on any floor"*) — i.e. the canvas is authored to *read*
   as an 800 mm real-world tile, and `f.w`/`f.d` (the floor's mm dimensions)
   divided by 800 gives the repeat count across the whole slab.
2. **Raw-mm-UV geometries** (the loop-clipped `ShapeGeometry` floor patches,
   built with `THREE.Path`/`ShapeGeometry` from **millimeter-scale**
   coordinates directly, so each shape's own UV already equals world mm, not
   0..1): these paths instead do `floorTex.repeat.set(1 / 800, 1 / 800)`
   (`three-renderer.ts:2027`, `:2055`) — i.e. `repeat = 1/patternTileMm`
   directly, with **no floor-size multiplication**, because the UV coordinate
   *is* the mm coordinate already, so one texture repeat naturally spans
   800 UV-units = 800 mm. **This is the exact `repeat = 1/patternSizeMm`
   formula named in this research's brief** — it is real and already shipped,
   but it only applies to the mm-native `ShapeGeometry` UV paths, not the
   normalized-UV box-slab path. Getting this backwards (applying
   `1/800` to a normalized-UV mesh, or `size/800` to a raw-mm-UV mesh) is the
   single most likely bug when adding a new textured surface (a wall segment,
   a per-room floor patch) — **verify which UV convention the target geometry
   uses before choosing the formula**, don't assume.
3. **Wall segments** (per `skin-walls.md`'s analysis of `_buildSolidWallSegment`):
   each wall is its own extruded mesh with an auto-generated along-wall-length
   × height profile UV, meaning `repeat` must be set **per segment** (not once
   globally like the single floor slab) — `repeat.set(lengthMm / boardPeriodMm,
   heightMm / boardPeriodMm)` — and because a `THREE.Texture` object carries
   exactly one `.repeat` value, per-segment variation needs either a
   `tex.clone()` per unique (kind, rounded-length) bucket (cheap — a Three.js
   texture clone shares the underlying canvas/GPU upload, it does not
   re-rasterize) or accepting one averaged repeat for the whole floor. This is
   unresolved in `skin-walls.md` and is the same open question this doc's
   proposed shared registry should settle **once**, generically, rather than
   per-wall-finish-kind.

### Per-pattern-family techniques and real-world module sizes (quick reference)

The brief for this doc names six pattern families directly. Full curated
palettes and drop-in `_floorTexture`/`_wallTexture` branch code for each
already live in `skin-flooring.md` (wood, tile, stone, carpet) and
`skin-walls.md` (brick, wallpaper, plus tile/stone as wall finishes) — this
table is the one-page index of **which generation technique fits which
family** and the **real module size** that should drive its internal canvas
proportions, so this doc's registry design can be read standalone without
flipping between four files:

| Family | Generation technique (canvas-2D) | Real-world module (mm, verified) | Full recipe / palette |
|---|---|---|---|
| **Wood grain** | Horizontal plank bands (`fillRect` row) + `bezierCurveTo` grain streaks per row (already shipped, `three-renderer.ts:1663-1679`); richer grain = 5–6 octaves of axis-stretched value/Perlin noise (§ "Seamless tiling techniques" #4) | Strip flooring **57–125 mm** wide boards (2¼–5 in), wide-plank **180–250+ mm**, herringbone block **~70×500–600 mm** ([Wood and Beyond](https://www.woodandbeyond.com/blog/what-size-does-wood-flooring-come-in/); herringbone size per [Adler Parkett](https://www.adlerparkett.com/en/herringbone-and-chevron.html)) | `skin-flooring.md` §"Hardwood / engineered wood" + `stone`/`herringbone_wood` recipes |
| **Tile grids** | Grid-line loop at fixed pitch (already shipped, `three-renderer.ts:1680-1691`) + per-cell shade jitter; herringbone/running-bond via row-offset math | Field tile **300×300 / 450×450 / 600×600 / 600×1200 mm**; subway **75×150 mm** (3×6 in, the historic-standard size); grout **1.6–5 mm** (rectified tightest, rustic widest) ([Orientbell tile sizes](https://www.orientbell.com/tiles/tile-size); [DIYTileGuy grout sizing](https://www.diytileguy.com/grout-lines/)) | `skin-flooring.md` §"Ceramic / porcelain tile"; `skin-walls.md` §2.6 (backsplash) |
| **Carpet** | Dense small-radius `speckle(n, r, colors[])` fleck pass (the `_groundTexture` idiom, `three-renderer.ts`'s grass/rock speckle closure) over a flat mid-tone field — no hard lines, since carpet has no seam at texture scale | Broadloom rolls **12 ft (3.66 m)** wide (occasionally 15 ft), so a real installed carpet is visually seamless across an entire room — reinforces that the procedural texture should read as **one continuous fleck field**, not a tiled module, matching how `RepeatWrapping` already hides the tile boundary ([FlooringInc broadloom guide](https://www.flooringinc.com/blog/broadloom-carpet-guide)) | `skin-flooring.md` §"Carpet" |
| **Stone** (marble/travertine/veneer) | Soft low-opacity `bezierCurveTo` "vein" strokes (branching, irregular — NOT straight) over a mottled per-pixel-noise base (reuses the existing concrete `getImageData` ± noise trick at lower magnitude) | Veneer courses **height 25–150 mm, length 100–480 mm** (irregular by design — no fixed grid); cut-stone squares **300–600 mm**; travertine plank **300×600 → 450×900 mm** ([Stoneyard ledgestone guide](https://stoneyard.com/ledger-stone-panels/); [Daltile travertine](https://www.daltile.com/natural-stone-product-category/travertine)) | `skin-flooring.md` §"Natural stone"; `skin-walls.md` §2.5 |
| **Brick** | Running-bond grid of rectangles (each row offset half a brick length) with small per-rectangle color jitter (reuse `lighten()`/`_simsColor`) for natural brick-to-brick variance, mortar-gray grid lines between | **US modular brick**: actual **92 × 57 × 194 mm** (depth × height × length), nominal (+ mortar) **102 × 68 × 203 mm**, **9.5 mm (3/8 in) mortar joint** — 3 courses + joints = one 203 mm (8 in) vertical module, the standard masonry coordination constant ([BIA Technical Note 10](https://www.gobrick.com/media/file/10-dimensioning-and-estimating-brick-masonry.pdf); [Civiconcepts](https://civiconcepts.com/blog/standard-brick-size)) | `skin-walls.md` §2.4 + `brick` recipe |
| **Wallpaper** | Flat base fill + a repeating motif (stripe pairs, trellis lattice via `strokeStyle` lines, low-alpha blotches for grasscloth) at a period tuned to a scale knob; `RepeatWrapping` tiles it perfectly, which is actually *more* seamless than a real installed roll | Roll width **US single roll 533 mm (21 in)**, American-made **686 mm (27 in)**, EU **521 mm (20.5 in)**; double-roll unit **~530 mm × 10 058 mm (33 ft)**; pattern repeat **25 mm (small geometric) to 600+ mm (large floral/damask)** — no single standard, repeat size is the key period-selection number; drop-match conventions (straight / half-drop / quarter-drop) don't matter to a `RepeatWrapping` texture since there's no real seam to match ([Milton & King](https://www.miltonandking.com/blog/single-roll-double-roll-two-roll-set-what-does-it-mean/); [Laurenpeploe repeat guide](https://laurenpeploe.co.uk/understanding-wallpaper-widths-and-repeats/)) | `skin-walls.md` §2.2 + `wallpaper` recipe |

Two corroborating facts from this round of research, not previously cited in
either sibling doc: **herringbone parquet block** commonly ships **500×100 mm**
or **600×100 mm** at a 45° lay ([Wood and Beyond herringbone
guide](https://www.woodandbeyond.com/blog/what-size-does-wood-flooring-come-in/);
corroborated by [Adler Parkett](https://www.adlerparkett.com/en/herringbone-and-chevron.html)),
and **grout joint width scales with tile size** more precisely than a flat
range — sub-600 mm tiles want **≥2 mm**, tiles up to 1200 mm want **≥3 mm**
([TB85 technical bulletin](https://www.custombuildingproducts.com/media/60712312/tb85-grout-joint-width.pdf)) —
both are drop-in refinements to the corresponding sibling-doc recipes' pitch
constants, not new families.

## Diorama design / integration

### The generalization: one recipe registry instead of three copy-pasted `if/else` chains

Today `_floorTexture`, `_groundTexture`, and (proposed) `_wallTexture` are
structurally identical but independently written: same canvas size, same
`CanvasTexture`/`RepeatWrapping`/`SRGBColorSpace` setup, same "cache forever,
dispose only in `destroy()`" lifecycle, different `if (kind === ...)` bodies.
Recommended shape, additive and non-breaking (existing call sites keep
working verbatim):

```ts
// three-renderer.ts (or a small new module, e.g. procedural-textures.ts,
// imported by three-renderer.ts — either works; a separate module keeps the
// canvas-drawing code testable in isolation from the renderer class)
type TexRecipe = (g: CanvasRenderingContext2D, size: number, rng: () => number,
                   params: MaterialParams) => void;

const FLOOR_RECIPES: Record<FloorTexKind, TexRecipe> = {
  none: () => {},             // never called — 'none' short-circuits null
  wood: drawWoodRecipe,
  tile: drawTileGridRecipe,
  concrete: drawConcreteRecipe,
  // new kinds slot in here as one function each, not a growing if/else arm
};
```

A single generic `_buildProceduralTexture(size, recipe, params, seed)` helper
(canvas create → context → seeded RNG → `recipe(g, size, rng, params)` →
`CanvasTexture` → wrap/colorSpace → return) replaces the body of
`_floorTexture`/`_groundTexture`/`_wallTexture` alike; each keeps its own
cache map (`_texCache`/`_groundTexCache`/`_wallTexCache`) since cache-key
shape differs slightly (walls need a `(kind, paletteOrColor)` compound key
per `skin-walls.md` §3.2, floors/ground only need `kind`) but the
canvas-drawing internals stop being duplicated.

### Determinism — a real gap in the existing code, worth fixing while generalizing

Every existing recipe calls `Math.random()` directly (`three-renderer.ts:1672`,
`:1674`, `:1676`, `:1689`, `:1696` and the `_groundTexture` speckle helper) —
**not seeded**. Because each kind's texture is cached the *first* time it's
requested and kept for the renderer instance's lifetime, this doesn't cause
visible flicker within one session, but it does mean:
- The exact same floor+texture-kind combination looks subtly different every
  time the app reloads (page refresh, HA reconnect creating a fresh
  `ThreeDRenderer`) — harmless for wood grain, but would be a real bug for a
  hypothetical future per-room-cached variant where two rooms with the *same*
  material kind should visually match, or for a saved "kiosk link" camera
  view where a user might reasonably expect a stable screenshot.
- No deterministic test/regression harness (following the `?c=` query-param
  convention other test pages use, e.g. `weather-fx-test.html`) is possible
  for texture output without seeding, since two runs of the same recipe won't
  byte-compare.

**Recommendation**: swap bare `Math.random()` for a tiny seeded PRNG —
[Mulberry32](https://github.com/cprosche/mulberry32) is a widely-used ~6-line
32-bit seeded generator (documented as "tiny, fast, deterministic" per
[this writeup](https://www.4rknova.com/blog/2026/01/08/understanding-how-to-use-mulberry32-to-achieve-deterministic-randomness-in-javascript/))
— seed each kind's recipe with a small hash of `(kind, paletteOrColor)` so the
SAME kind+color always draws the SAME canvas (stable across reloads and
directly diffable in a future test page), while different kinds/colors still
look distinct from each other. This is a small, low-risk change (swap the RNG
source, no behavior change to *what* gets drawn) worth bundling into whichever
PR first touches this code, rather than a separate effort.

### A unified `MaterialSpec` data model (floor + wall + per-room)

`skin-flooring.md` extends `FloorTexKind` (lives on `Scene3D.floorTex` /
`FloorLook3D.floorTex`) and `skin-walls.md` proposes a parallel
`WallFinishKind` (`Scene3D.wallFinish` / `FloorLook3D.wallFinish`) — both
correctly additive to the existing global/per-floor-override two-tier
resolution Diorama already has. This doc adds the missing **third tier** both
sibling docs flag as a "natural v2" but don't design: **per-room**. A clean,
minimally-invasive shape:

```ts
// types.ts — additive to the existing Room interface
export interface Room {
  id: string;
  name: string;
  anchor: Vec2;
  floorTex?: FloorTexKind;      // NEW: per-room floor override
  floorColor?: string;          // NEW
  wallFinish?: WallFinishKind;  // NEW (once skin-walls.md ships wallFinish)
  wallColor?: string;           // NEW
}
```

Resolution order becomes room → `FloorLook3D` (per-floor) → `Scene3D`
(global) → hard default — the exact same "most-specific-wins, `undefined` =
inherit" pattern the sidebar already implements for floor→global with its
`'inherit'` sentinel select option (`sidebar.ts:4470-4474`). This is
**additive to `Room`**, a type that already persists via `repairFloor`/
`defaultFloor` backfill (`Floor.rooms: Room[]`), so no store-migration
concern beyond the ordinary "new optional field" case.

**The real cost is geometric, not data-model**: today one floor = one slab
mesh (or one mesh per closed wall loop, already the case per
`closedWallLoops`/`_wallLoops` — see `three-renderer.ts:1943-1944`). Per-room
material override needs the floor build to emit **one mesh per loop with its
OWN resolved material** instead of one shared `floorMat` reused across every
loop's `ShapeGeometry`. Looking at the existing code, `updateFloor` already
iterates `loops` to build per-loop `ShapeGeometry` patches when the floor is
non-rectangular (the `scenePathFor`/`MIN_HOLE_AREA` machinery at `:1971-1984`
and the two `1/800`-repeat call sites at `:2027`/`:2055` this doc already
identified as the raw-mm-UV path) — **this is closer to already-built than
either sibling doc assumed**: the per-loop patch mechanism exists for
*floor-shape* reasons (closed wall loops carving the floor extent), and
extending it to also carry a *per-loop resolved material* (looking up which
`Room` — if any — claims that loop via `resolveRoomForPoint(rooms, loops, ...)`,
already a shared geometry.ts helper) is additive to a loop, not a new
subsystem. Recommend sequencing per-room override **after** whole-floor
`floorTex`/`wallFinish` ship (both sibling docs' v1 scope), reusing this
existing per-loop patch code as the implementation vehicle rather than
building parallel geometry.

### Where this rides existing machinery (uiMode, dirty keys, lifecycle)

- **`uiMode`/URL templates**: purely cosmetic config, identical to how
  `floorTex`/`wallColor` already need zero permission gating beyond normal
  sidebar edit-only rendering — a kiosk/view-mode session simply renders
  whatever material config was saved; no new URL param needed (the existing
  `layers=` / `view3d=` / `cam=` templates already capture "what does this
  kiosk screen look like," and material choice is baked into the scene like
  lighting preset already is).
- **Dirty keys**: `floorTex`/`wallFinish`/per-room fields are all pure
  config with no live entity dependency, so they ride `configRev` →
  `_keyFloor` exactly like `floorTex` does today — **no new dirty-key term**,
  as long as new fields live inside the same `scene3d`/`look3d`/`Room` objects
  `_keyFloor` (or the ghost-floor ground truth, `_keyGhost`) already
  depends on. Verify at implementation time that no dirty key hand-enumerates
  individual `scene3d` sub-fields rather than hashing the whole object.
- **Cache lifecycle vs. sprite lifecycle — a distinction worth stating
  explicitly**: the now-playing media-art system (`_nowPlayingGroup`,
  `_disposeSpriteMaps` pairing) is the codebase's other prominent
  `CanvasTexture` user, but it has the **opposite** lifecycle from
  `_texCache`: now-playing textures are **per-instance, rebuilt whenever
  track metadata changes**, and MUST be disposed per-rebuild (their sprite
  `CanvasTexture`s are not shared, so `_clearGroup`'s generic material
  disposal isn't enough — the doc-comment at `three-renderer.ts:1925-1927`
  spells this out for the floor-group rebuild specifically). Material
  pattern textures (`_texCache`/`_groundTexCache`, and any new
  `_wallTexCache`/room-texture cache) are the **opposite**: built once per
  kind (or per `(kind, color)` pair), kept for the renderer's entire
  lifetime, and disposed ONLY in `destroy()` — never per-rebuild. Any new
  code touching this area must not accidentally apply the sprite-lifecycle
  discipline (dispose-and-rebuild every frame/every `updateFloor` call) to a
  material texture, which would be a correctness regression (visible texture
  flash/rebuild cost) as well as a performance regression (canvas redraw is
  the expensive part, not the GPU upload).
- **`_mat()` toon factory**: no changes needed for any of this — every new
  pattern texture is just another `map:` fed into the same
  `MeshToonMaterial` factory every other surface already uses; `roughness`/
  `metalness`/`envMapIntensity` passed alongside a texture are silently
  dropped exactly as today (PBR knobs have no meaning in this pipeline).

## Setup / integration steps

1. **Extract the shared recipe-registry helper** (`_buildProceduralTexture` +
   a `TexRecipe` function-map per surface family) as described above, with
   `_floorTexture`/`_groundTexture` refactored to call it — a pure
   internal-structure change, zero behavior difference, verify with
   `npm run typecheck && npm run build` and a visual spot-check of all
   existing `wood`/`tile`/`concrete`/ground kinds (regression risk is purely
   "did the refactor preserve pixel output," not new functionality).
2. **Swap `Math.random()` for a seeded PRNG** (Mulberry32 or equivalent) keyed
   per `(kind, colorParams)`, threaded through the new `TexRecipe` signature's
   `rng` parameter — small, isolated change, same recommendation as above.
3. **Add the wrap-around-copy helper** (`drawWrapped(g, size, drawFn)` that
   calls `drawFn` at the primary position plus any of the 8 neighbor offsets
   whose bbox would clip the canvas edge) as a small shared utility, used by
   any *new* freeform/noise-based recipe (marble veins, herringbone joints)
   that isn't already inherently seamless like the grid-based kinds.
4. **Implement whichever of `skin-flooring.md` / `skin-walls.md`'s proposed
   kinds are prioritized**, now as entries in the shared recipe map instead
   of new `if/else` arms — this is where those two docs' per-kind canvas
   recipes plug in verbatim, just relocated into `TexRecipe` functions.
5. **Wall per-segment repeat bucketing** (`skin-walls.md`'s flagged open
   question): implement the `tex.clone()`-per-rounded-length-bucket scheme
   generically in the new shared layer (round `len` to nearest 500 mm per
   that doc's recommendation) so it's solved once for every wall-finish kind,
   not reinvented per kind.
6. **Extend `Room` with the three optional per-room override fields** (floor
   tex/color, wall finish/color) — additive type change, verify it rides the
   existing `Floor.rooms` backfill in `repairFloor`/`defaultFloor` (it should,
   since `Room` fields are copied as part of the array, not individually
   enumerated — verify, don't assume, per the historical `scene3d` reset bug
   class called out in CLAUDE.md).
7. **Per-loop material resolution in `updateFloor`**: extend the existing
   per-loop `ShapeGeometry` patch build (`:1971` onward) to resolve
   `resolveRoomForPoint(rooms, loops, loopAnchorPoint)` per loop and pick that
   room's override → floor `look3d` → global `scene3d` → default, mirroring
   the sidebar's existing inherit-chain UX.
8. **Sidebar**: per-room material pickers in the Rooms section
   (`sidebar.ts`'s existing room-row UI), same `<select>` + inherit-sentinel
   pattern as the floor-level override already uses.
9. **`npm run typecheck && npm run build`** — no test suite exists per
   CLAUDE.md; these two commands are the verification gate. Grep for any
   other exhaustive `switch`/`if`-chain over `FloorTexKind`/`WallFinishKind`
   before considering a new-kind addition complete (today, per
   `skin-flooring.md`'s own grep, `FloorTexKind` is consumed only by the two
   sidebar selects + the one `_floorTexture` chain).
10. **Manual visual verification**: cycle every kind at both a close top-down
    view (tiling seams/aliasing show up most here) and the default sims-cam
    distance; confirm a per-room override correctly falls back through all
    three inherit tiers; confirm reload-stability once the seeded-RNG change
    lands (same kind+color should look pixel-identical before/after a page
    refresh — a quick manual screenshot diff is enough, no harness needed for
    v1).
11. **(Optional, recommended if this becomes a churn area)** add a
    `texture-test.html` following the existing `?c=` query-param test-page
    convention (e.g. `weather-fx-test.html`) that renders each recipe's
    canvas output directly (2D, no Three.js needed) for a fast deterministic
    visual-diff loop — cheap to add once recipes are seeded/deterministic,
    not worth it before that.

## Potential additional features

- **Wang-tile macro-variation** — if a specific large open-plan floor (or a
  future very-large-format skin, e.g. an outdoor patio ground texture) starts
  showing an obvious large-scale repeat, revisit the Wang-tile approach
  (§ above) rather than just bumping canvas resolution; it's the
  textbook-correct fix for *that specific* symptom (macro repetition), not
  a general-purpose upgrade worth doing preemptively.
- **User-uploaded tileable photo textures** — same idea `skin-walls.md`
  flags as a stretch goal: let a user supply their own seamless photo texture
  (stored in IndexedDB like `model-store.ts` already does for OBJ/MTL text,
  since a texture image is too large for `localStorage`/HA `user_data`) as an
  alternative to the procedural kinds. Explicitly breaks the "no external
  binary assets" purity of the current renderer — a real product/scope
  decision, not a small addition.
- **Shared `speckle(n, r, colors[])` promotion** — already flagged in
  `skin-flooring.md`: the ground-texture speckle closure is the right
  general-purpose helper for any fleck/noise-based kind (carpet, epoxy flake,
  stone mottling) and should move into the same shared module this doc
  proposes rather than being copy-pasted a third/fourth time.
- **Grout/seam accent color as its own parameter** — both sibling docs
  independently note that real tile/brick/plank seams vary a lot in how much
  they read (dark grout vs. grout-matched-to-tile, dark vs. light mortar);
  a shared `MaterialParams.seamColor?` (alongside `baseColor`) threaded
  through the generic recipe signature costs nothing extra once the unified
  `TexRecipe(g, size, rng, params)` signature exists, versus bolting it onto
  each kind's function individually later.
- **Higher-resolution canvas for pattern-heavy kinds** — `skin-flooring.md`
  flags 256×256 as possibly too coarse for herringbone/chevron; since canvas
  size is a per-call argument in the proposed shared helper (not a hardcoded
  constant), a pattern-heavy kind can simply request 512×512 without any
  architectural change — this is already "free" once the refactor in step 1
  lands.

## Open questions & risks

- **Determinism regression risk**: swapping every existing `Math.random()`
  call for a seeded RNG changes the *exact* pixel output of the shipped
  `wood`/`tile`/`concrete`/ground textures (different random sequence =
  different noise pattern, even though the *style* is unchanged) — this is a
  visible, if minor, one-time appearance change for existing users on
  upgrade. Worth calling out in a changelog rather than silently shipping;
  not a technical risk, a communication one.
- **Wang tiles are real but likely premature**: this doc deliberately
  recommends against implementing them now (see "Seamless tiling
  techniques" #5) — flag this as a call to revisit only if a concrete
  macro-repetition complaint surfaces, not a gap to fill preemptively.
- **Per-room override's geometric cost is bigger than the data-model cost
  suggests**: per-loop material resolution is additive to existing code
  (the per-loop `ShapeGeometry` patch path already exists for shape reasons),
  but multiplies the number of live materials/textures per floor from ~1 to
  ~(number of rooms) — bounded and cheap by the standards of this renderer
  (still far fewer materials than one-per-furniture-piece), but worth a quick
  sanity check on very-many-room floors (unlikely to be a real residential
  plan, but a stress-test plan could have dozens of small rooms).
- **Wall per-segment repeat bucketing is still an open design call**, not
  resolved by this doc — `skin-walls.md`'s "exact-repeat-per-segment vs.
  floor-averaged-repeat" tradeoff (§6 there) is inherited unchanged; this doc
  only proposes generalizing WHERE that bucketing logic lives (shared layer)
  once a decision is made, not making the decision itself.
- **`createPattern`/multi-motif composition remains unused** — this doc
  documents it as a real, primary-source-verified API (MDN) but doesn't
  recommend adopting it yet, since the single-tile-direct-draw approach
  already in production covers every proposed kind in both sibling docs. Flag
  as a tool to reach for specifically if a future kind needs to *stamp* a
  discrete motif (e.g. a repeating floral wallpaper sprite) rather than draw
  continuous procedural content — a genuinely different authoring shape from
  everything shipped today.
- **No literal real-world scale validation** — inherited from both sibling
  docs: Diorama's repeat convention (one texture tile per 800 mm, or
  `1/patternMm` on raw-UV geometry) is a stylization choice, not an attempt
  at photographic accuracy; new recipes should match the existing "looks
  right at typical camera distance" bar rather than engineering exact
  real-world module fidelity, since the rest of the system doesn't either.

## Sources

- [three.js docs — CanvasTexture](https://threejs.org/docs/#api/en/textures/CanvasTexture)
- [three.js docs — DataTexture](https://threejs.org/docs/#api/en/textures/DataTexture)
- [three.js docs — MeshToonMaterial](https://threejs.org/docs/pages/MeshToonMaterial.html)
- [three.js docs — Texture.wrapS](https://threejs.org/docs/#api/en/textures/Texture.wrapS)
- [sbcode.net — MeshToonMaterial tutorial](https://sbcode.net/threejs/meshtoonmaterial/)
- [three.js forum — Adding image to toon material](https://discourse.threejs.org/t/adding-image-to-toon-material/60271)
- [three.js forum — How to repeat texture properly?](https://discourse.threejs.org/t/how-to-repeat-texture-properly/56430)
- [MDN — CanvasRenderingContext2D.createPattern()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createPattern)
- [MDN — Using textures in WebGL (power-of-two / RepeatWrapping constraint)](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL)
- [three.js forum — Texture is not power of two / can't change texture](https://discourse.threejs.org/t/texture-is-not-power-of-two-cant-change-texture/8433)
- [BIA Technical Note 10 — Dimensioning and Estimating Brick Masonry (PDF)](https://www.gobrick.com/media/file/10-dimensioning-and-estimating-brick-masonry.pdf)
- [Civiconcepts — Standard Brick Size (mm & inches)](https://civiconcepts.com/blog/standard-brick-size)
- [Custom Building Products — TB85 Grout Joint Width bulletin (PDF)](https://www.custombuildingproducts.com/media/60712312/tb85-grout-joint-width.pdf)
- [DIYTileGuy — How big should your grout lines be?](https://www.diytileguy.com/grout-lines/)
- [Orientbell — Standard tile sizes](https://www.orientbell.com/tiles/tile-size)
- [Wood and Beyond — What size does wood flooring come in? (incl. herringbone block)](https://www.woodandbeyond.com/blog/what-size-does-wood-flooring-come-in/)
- [Adler Parkett — Herringbone and chevron pattern sizing](https://www.adlerparkett.com/en/herringbone-and-chevron.html)
- [FlooringInc — Broadloom carpet guide (12 ft roll width)](https://www.flooringinc.com/blog/broadloom-carpet-guide)
- [Stoneyard — Ledgestone veneer panel guide](https://stoneyard.com/ledger-stone-panels/)
- [Daltile — Natural stone: travertine](https://www.daltile.com/natural-stone-product-category/travertine)
- [Milton & King — Single roll, double roll & two-roll set](https://www.miltonandking.com/blog/single-roll-double-roll-two-roll-set-what-does-it-mean/)
- [Lauren Peploe — Understanding wallpaper widths and repeats](https://laurenpeploe.co.uk/understanding-wallpaper-widths-and-repeats/)
- [Wikipedia — Wang tile](https://en.wikipedia.org/wiki/Wang_tile)
- [Cohen & Shade — Wang Tiles for Image and Texture Generation (SIGGRAPH 2003)](https://graphics.uni-konstanz.de/publikationen/Cohen2003WangTilesImage/index.html)
- [ACM — Wang Tiles for image and texture generation](https://dl.acm.org/doi/abs/10.1145/882262.882265)
- [Procedural Textures in JavaScript — clockworkchilli](https://clockworkchilli.com/blog/6_procedural_textures_in_javascript)
- [Perlin Noise on JavaScript Canvas — snippet.zone](https://snippet.zone/2021/12/16/perlin-noise-on-javascript-canvas/)
- [Perlin Noise in JavaScript — asserttrue blog](https://asserttrue.blogspot.com/2011/12/perlin-noise-in-javascript_31.html)
- [GetZenQuery — Texture Generator (seamless/tileable)](https://www.getzenquery.com/tools/texture-generator/)
- [Medium — Creating Seamless Tiled Patterns from AI-Generated Images](https://medium.com/@dna.mr.b/creating-seamless-tiled-patterns-from-ai-generated-images-17cb26ad4920)
- [Mulberry32 — cprosche/mulberry32 (GitHub)](https://github.com/cprosche/mulberry32)
- [Understanding Mulberry32 for deterministic randomness](https://emanueleferonato.com/2026/01/08/understanding-how-to-use-mulberry32-to-achieve-deterministic-randomness-in-javascript/)
- Diorama source (read directly for this doc): `src/three-renderer.ts`
  (`_floorTexture` `:1656`, `_groundTexture` `:1712`, `_gradientMap`/`_mat`
  `:1162-1189`, `updateFloor`'s per-loop `ShapeGeometry` path `:1933-2060`),
  `src/types.ts` (`FloorTexKind` `:445`, `FloorLook3D` `:448`, `Scene3D`
  `:454`, `Room` `:469`), `src/ui/sidebar.ts` (floorTex selects `:4391`,
  `:4470`), and the companion docs `docs/research/skin-flooring.md` /
  `docs/research/skin-walls.md`.
