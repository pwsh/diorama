# Interior color palettes for skinning (whole-home style palettes)

Research doc for a new Diorama feature. Build-ready: cites real-world paint
color data (names, hex, LRV) with sources and exact Diorama hooks (files,
functions, dirty keys) so this can be implemented without further
investigation. Companion to `skin-walls.md` (wall **finishes**/textures) and
`skin-flooring.md` (floor **materials**/textures) — this doc is about
**color**: which hues belong together, in what proportions, and how the toon
shader changes what you should pick.

## 1. Summary

Diorama already exposes exactly three whole-scene color knobs —
`Scene3D.floorColor`, `Scene3D.floorTex`, `Scene3D.wallColor` (default
`#101820`/`none`/`#bbbbbb`), each overridable per-floor via `Floor.look3d`
(`FloorLook3D`) — plus a per-piece `Furniture.color` hex override on every
placed item. Today these are raw `<input type="color">` pickers in the
sidebar's "3D Scene" section (`sidebar.ts._scene3dSection`); there is no
curated "pick a style and get a coherent wall/floor/trim/accent set"
experience. This doc supplies that curation: eight real interior-design
palette families (modern/contemporary, farmhouse/modern-farmhouse,
traditional, mid-century modern, industrial, coastal, Scandinavian,
transitional) with verified named paint colors + hex + LRV, the wall/trim/
ceiling/accent relationships professional designers actually use, the
warm-vs-cool-undertone logic that makes a palette read as coherent instead of
muddy, and room-type conventions (kitchen/bath/bedroom/living).

Why it matters for a kiosk/theater/skin build: a Diorama house that's
structurally accurate but uniformly `#bbbbbb` walls over a `#101820` floor
reads as a wireframe mockup, not a home. A "pick modern farmhouse" or "pick
coastal" one-click preset is disproportionately high value per line of code —
same mechanism as the existing manual pickers, just pre-filled with numbers a
professional would choose. The harder, load-bearing part is **not** the color
science — it's that Diorama's 3D renderer is not a photoreal PBR pipeline.
Every material goes through `ThreeDRenderer._mat()`, which builds a
`MeshToonMaterial` and runs the input color through `_simsColor()` — an HSL
**saturation boost** (`s' = min(1, s·1.25 + 0.02)`) — then lights it with a
**hard 4-step gradient map** (bands at 90/150/210/255 out of 255, i.e.
≈35%/59%/82%/100% of the lit value) and **no tone mapping / no environment
map**. Real paint-deck neutrals (low HSL saturation) survive this fine;
naively porting a designer's exact LRV-differentiated wall/trim pair can
still collapse into one visual band under weak light. Section 3 gives the
worked numbers and the concrete fix (widen the LRV gap, and always pair a
`floorTex` with a light `floorColor` — it's a multiplicative tint, and the
current default is nearly black).

## 2. Platform / data model / real-world facts

Nothing here comes from Home Assistant — a color palette is a static design
choice, not a live device or entity. All hex/LRV values below are **third-party
colorimetry conversions** (encycolorpedia, myperfectcolor, hextoral,
matchmypaintcolor, colorxs, etc.) of Sherwin-Williams (SW) / Benjamin Moore
(BM) proprietary paint names — not the brand's own published digital swatch
(SW's own Color-of-the-Year page cautions screen rendering can shift 3–5%
from the printed chip). Treat every hex value as "close enough for a
stylized toon renderer," not paint-matching precision.

### 2.1 The 60-30-10 rule and "how many colors" a coherent home uses

The near-universal designer heuristic: **60%** dominant color (walls, large
flooring, the backdrop), **30%** secondary (large furniture, rugs, drapery,
an accent wall), **10%** accent (pillows, art, lamps) — optionally split into
two 10% accents (60-30-10-10). [Apartment Therapy](https://www.apartmenttherapy.com/interior-design-rule-60-30-10-explained-37504313),
[Homes & Gardens](https://www.homesandgardens.com/advice/60-30-10-rule),
[Behr](https://www.behr.com/colorfullybehr/tried-and-true-color-combinations/).

Practically, a **coherent whole home** repeats **one trim/ceiling white**
throughout and **2–4 wall colors** across connected spaces (often just one
greige/neutral used everywhere, with mood varied per room via slightly deeper
shades or an accent wall) — [Bob Vila 2026 guide](https://www.bobvila.com/design/paint-color-trends-by-room-2026/),
[Paint Color HQ](https://www.paintcolorhq.com/blog/best-sherwin-williams-paint-colors).
Jewel-tone/rich accent colors stay at the 10% tier (pillows, art, one
accent wall) rather than becoming a wall-wide choice — [Havenly](https://havenly.com/blog/jewel-tone-colors),
[Decorilla](https://www.decorilla.com/online-decorating/jewel-tone-colors/).

### 2.2 Light Reflectance Value (LRV) — the number that actually matters

LRV is the % of light a color reflects: 0 = pure black, 100 = pure white.
It is **the** predictor of how light/dark a color reads on a wall, independent
of its marketing name. Rough bands: **>70** reads light/airy; **50–70**
mid-light with presence; **30–50** noticeably moody, wants good natural
light; **<20** dark/dramatic, best as an accent. [MyPerfectColor](https://www.myperfectcolor.com/What-is-the-Light-Reflectance-Value-LRV/34201.htm),
[MatchThatPaint](https://matchthatpaint.com/guides/lrv-explained/),
[Welsh Design Studio](https://welshdesignstudio.com/light-reflectance-value-lrv-of-paint/).
Two paint *names* can sit 30 LRV points apart yet look deceptively similar in
a marketing photo — LRV is the ground truth, paint names are not.

### 2.3 Warm vs. cool undertones

Warm neutrals carry yellow/red/brown undertones (cozy, inviting); cool
neutrals carry blue/green/violet undertones (crisp, modern). **Beige**
undertones split into pink/peach (rosy, pairs with cool furnishings),
yellow ("builder beige," warm/golden), and green (earthy in warm light, can
read muddy/olive otherwise). **Greige** = gray + beige; warmer greige leans
toward beige, cooler greige leans toward gray — a cooler greige (e.g. SW
Repose Gray) can drift blue/purple in north light, a warmer one (e.g. SW
Accessible Beige) stays cozy in the same room. North-facing rooms get flat,
cool light that strips warmth — a cool gray there reads steel-blue.
[Paint Color HQ](https://www.paintcolorhq.com/blog/understanding-paint-color-undertones),
[Kylie M Interiors](https://www.kylieminteriors.ca/paint-color-undertones-explained-beige-taupe-greige-beyond/).

### 2.4 Style palettes (named colors, hex, LRV, structure)

Every entry below follows wall / trim-ceiling / accent, with LRV where a
source gave one. Hex values are approximate (see the caveat in the section
intro).

**Modern / contemporary**
- Wall/whole-house neutral: **SW Alabaster** SW 7008, `#EDEAE0`, LRV ≈ 82
  (warm off-white); **SW Light French Gray** SW 0055; **BM Edgecomb Gray**
  HC-173; **BM Manchester Tan** HC-81.
- 2026 shift toward warmer/deeper neutrals: **SW Universal Khaki** SW 6150
  (2026 SW Color of the Year), `#B7AD8E`, LRV ≈ 41, warm yellow-olive
  undertone; **BM Silhouette** AF-655 (2026 BM Color of the Year),
  hex ≈ `#5B4E47`, LRV ≈ 8 — a deep espresso-charcoal used as an **accent**
  (cabinetry, a door, a single wall), not a whole-room wall color.
- Trend: **tonal layering** — walls, millwork, and textiles sit within the
  *same* color family/depth rather than high-contrast pairing.
  [LUXE 2026 trends](https://luxesource.com/trends/interior-design-color-trends-2026/),
  [Paint Color HQ best-SW list](https://www.paintcolorhq.com/blog/best-sherwin-williams-paint-colors).

**Farmhouse / modern farmhouse**
- Whole-house workhorse wall: **SW Agreeable Gray** SW 7029, LRV ≈ 60
  (balanced greige, neither warm nor cool) OR **SW Repose Gray** SW 7015,
  `#C8C2B6`, LRV ≈ 58 (cooler greige).
- Trim/ceiling: **SW Alabaster** `#EDEAE0` or a pure trim white.
- Accents: stormy blue-grays, muted green-grays ("muted mushroom"), and
  charcoal/black for window frames, shutters, and hardware.
- Typically 3–4 colors total: one greige wall (repeated everywhere), one
  warm-white trim, black/charcoal metal accents, one muted blue or green in
  a single room. [NISH](https://nishthasadana.com/12-sherwin-williams-modern-farmhouse-paint-colors/),
  [Sherwin-Williams Agreeable Gray](https://www.sherwin-williams.com/en-us/color/color-family/neutral-paint-colors/sw7029-agreeable-gray).

**Traditional**
- 60% neutral base: whites/off-whites, warm tan, soft gray, natural wood.
- 30% secondary: warm-neutral upholstery on major pieces.
- 10% accent: **jewel tones** — sapphire, emerald, ruby, amber/citrine,
  orange-topaz — kept to pillows/art/lamps, not walls.
- A cited warm-neutral quint (usable as a wood/trim/wall ladder): Beaver
  `#AD9788`, Chamoisee `#92745F`, Umber `#634B3D`, Cinereous `#9C8E8B`,
  Timberwolf `#D2C8C4`.
- Uses more total colors (4–6) than the other styles but keeps them
  disciplined to the 60/30/10 ratio. [Havenly](https://havenly.com/blog/color-palette-for-home),
  [Color-meanings](https://www.color-meanings.com/neutral-color-palettes/).

**Mid-century modern (MCM)**
- Warm American MCM: mustard/ochre (deep, not neon — approx `#D9A441`),
  burnt orange (`#C1521C`-ish), terracotta, olive green (`#6B6E3A`-ish),
  walnut brown (`#5B3A29`-ish).
- Cool/Danish-leaning MCM: teal (`#3C8C8C`-ish), slate blue, seafoam, birch
  wood, charcoal.
- Neutrals: creamy off-white walls, charcoal graphic trim/lines.
- **Rule of one**: pick a single saturated accent per zone and commit fully
  (a whole accent wall, a full door, a full credenza) — a timid dab of
  mustard reads as a mistake, the same mustard fully committed reads as
  intentional. [Homes & Gardens](https://www.homesandgardens.com/interior-design/mid-century-modern-color-schemes),
  [Edward George](https://edwardgeorgelondon.com/mid-century-modern-color-palette/).

**Industrial**
- "Material neutrals": charcoal, graphite, concrete gray, off-white, muted
  taupe (e.g. a cool slate-gray like BM Stonington Gray family).
- Dark anchor: **SW Iron Ore** SW 7069, `#434341`, very low LRV (a deep
  charcoal just short of black).
- Utility black: **SW Tricorn Black** SW 6258, `#2F2F30` — window frames,
  pipes, structural beams.
- Optional navy anchor: **SW Naval** SW 6244, `#2F3D4C` or **BM Hale Navy**
  HC-154, `#434C56`, LRV ≈ 7.
- One high-signal accent used sparingly: rust, safety orange, lime, mustard,
  or copper. Few total colors (3–4); cool-leaning, high-contrast.
  [Media.io](https://www.media.io/color-palette/industrial-color-palette.html),
  [Hunker](https://www.hunker.com/13727133/industrial-color-palettes-ideas-and-inspiration/).

**Coastal**
- Whites: **BM Chantilly Lace** OC-65/2121-70, `#F4F6F1`, LRV ≈ 91 (crisp,
  pure) or **BM Stone White** OC-50 (warmer, creamy).
- Blues/blue-greens: **BM Beach Glass** 1564 (soft sea-glass green-blue),
  **BM Aegean Teal** 2136-40 (dusty teal accent), **BM Ice Cap** 875 (icy
  blue-gray), **BM Early Morning Mist** 1528.
- Sandy neutral: **BM Skipping Stone** (warm, sand-like backdrop).
- Character: brightest whole-home palette here alongside Scandinavian — high
  LRV walls (>70) plus one blue/teal accent (a wall, trim, or millwork) and
  driftwood-tone furniture. [Benjamin Moore coastal](https://www.benjaminmoore.com/en-us/paint-colors/coastal),
  [Packard Paint](https://www.packardpaint.com/blog/2026/06/19/types-of-coastal-colors-to-use-in-my-home).

**Scandinavian**
- Off-white base: `#F6F5F2`-ish (**SW Alabaster** or **BM White Dove**
  OC-17, `#EFEEE5`, LRV ≈ 85).
- Warm greige: `#DDD7CE`-ish (**SW Accessible Beige** SW 7036, LRV ≈ 58, or
  **BM Edgecomb Gray** HC-173).
- Dark accent: charcoal `#222222`-ish (**SW Tricorn Black** or **BM Wrought
  Iron** 2124-10).
- Muted accents (used sparingly, not as wall-wide colors): sage `#A7B2A2`
  (**SW Evergreen Fog** SW 9130, `#95978A`, LRV ≈ 30, or **BM October Mist**
  1495), dusty blue `#9DB2C7` (**SW Quietude** SW 6212 or **BM Quiet
  Moments** 1563), muted terracotta `#C47C67` (**SW Cavern Clay** SW 7701 or
  **BM Pheasant** 1110).
- Wood does a lot of the "color" work: light birch/ash/beech dominant,
  medium oak/maple for grounding, dark walnut used sparingly as contrast.
- Structure: one off-white + one warm greige + one or two muted cool or
  terracotta accents, with wood standing in for most of the visual variety.
  [Media.io](https://www.media.io/color-palette/scandinavian-color-palette.html),
  [The Modern Dane](https://www.moderndane.com/blogs/the-modern-dane-blog/the-role-of-color-palettes-in-scandinavian-design).

**Transitional (and the 2026 macro-direction generally)**
- The dominant 2026 story across all styles is a **return to warmth**:
  sand, clay, linen, wheat, caramel, warm taupe/greige replacing the cool
  grays of the prior decade. **SW Universal Khaki** SW 6150 `#B7AD8E`
  (2026 SW COTY); **SW Shiitake** SW 9173 (warm mushroom greige, used on
  both walls and kitchen cabinets).
- Deeper accents trending up: merlot/oxblood reds, plum, deep teal, moss/
  celadon green — paired with warm metals and dark wood, not high-contrast
  whites.
- Key technique: **tonal layering** — walls/millwork/textiles kept within
  the same color family and depth rather than built from contrasting hues.
  This is the style whose contrast is *value* (light/dark), not *hue* — the
  single most Diorama-relevant idea in this doc (see §3).
  [Homes & Gardens "what's replacing gray"](https://www.homesandgardens.com/interior-design/whats-replacing-gray-in-2026),
  [Fufugaga 2026 warm neutrals](https://fufugaga.com/blogs/news/warm-neutral-paint-colors-for-2026-a-complete-guide).

### 2.5 Trim, ceiling, and door conventions

- **Ceiling**: almost always **flat/matte** — reduces glare from overhead
  fixtures and helps the ceiling recede. [Southington Painting](https://www.southingtonpainting.com/blog/do-you-have-to-use-flat-paint-on-ceilings-interior-painting-advice).
- **Trim**: one consistent "trim white" repeated through the whole home, in
  **satin** (contemporary convention) or **semi-gloss** (traditional
  convention) — never flat. Common trim whites: **SW Extra White**, **SW
  Pure White**, **BM Simply White** OC-117, **BM Chantilly Lace** `#F4F6F1`
  (crisp/cool), **BM White Dove** `#EFEEE5` (warmer, pairs better with warm
  wall colors). [The DIY Playbook sheens](https://thediyplaybook.com/paint-sheens-101/),
  [Clare](https://www.clare.com/blogs/articles/best-paint-finishes).
- **Doors** sometimes break from trim-white as a deliberate accent (black,
  navy, deep green) — the single most common "10%" accent move in a
  neutral-heavy home.

### 2.6 Room-type conventions

- **Kitchen**: white/cream classic; 2026 trend toward sage/olive greens and
  warm mushroom neutrals; needs a scrubbable satin/semi-gloss finish.
- **Bathroom**: historically light/neutral for a "clean" feel; 2026 trend
  toward richer spa-calm colors (terracotta, sandstone) that still flatter
  skin tone; satin/semi-gloss for moisture.
- **Bedroom**: saturated but calming — dusty plum, sage, deep navy — in
  matte/eggshell, often the darkest-LRV room in the home (less need for
  daytime brightness, more for a "boutique hotel" mood).
- **Living room**: warm grounded neutrals, soft greige, muted green;
  eggshell finish.
- **Function-driven finish rule**: high-traffic/wet rooms (kitchen, bath) —
  satin/semi-gloss; low-traffic rooms (bedroom, living) — eggshell/matte.
  [Bob Vila 2026 by-room guide](https://www.bobvila.com/design/paint-color-trends-by-room-2026/).

## 3. Diorama design / integration

### 3.1 Exact current hooks (verified in-repo)

- `Scene3D` (`types.ts:454`): `preset: ScenePreset` (`'day'|'dusk'|'night'`,
  **lighting only** — see the gotcha below), `floorColor?` (hex, default
  `#101820`), `floorTex?: FloorTexKind` (`'none'|'wood'|'tile'|'concrete'`,
  default `'none'`), `wallColor?` (hex, default `#bbbbbb`).
- `Floor.look3d?: FloorLook3D` (`types.ts:448`) — per-floor override of the
  same three fields, edited in the sidebar's "This floor only" subsection
  (`sidebar.ts._floorLookOverrides`, ~line 4445).
- Sidebar "3D Scene" section: `sidebar.ts._scene3dSection` (~line 4326) —
  today plain `<input type="color">` + `<select>` writing straight into
  `p.store.scene3d` via the shared `upd()` helper (debounced save +
  `emitConfig`).
- `Furniture.color?: string` (`types.ts:92`) — per-piece hex override,
  resolved by `furnitureColor(f, customObjects)` in `geometry.ts:1100`
  (`f.color ?? resolveFurnitureDef(f).color`). Built-in kind defaults are
  already a coherent muted-wood palette expressed as hex **ints**
  (`FURNITURE_KINDS`, `geometry.ts:1216+`, e.g. `table: 0x8d6e63`,
  `sofa: 0x37474f`, `bookshelf: 0x3e2723`).
- `ThreeDRenderer._mat(params)` (`three-renderer.ts:1183`) — the single
  material factory; `updateFloor` builds the floor mesh(es) via
  `this._mat({ color: floorColor, map: floorTex ?? null, ... })`
  (`three-renderer.ts:1991-1993`) and walls via
  `this._mat({ color: scene3d?.wallColor ? hexToInt(...) : 0xbbbbbb, ... })`
  (`three-renderer.ts:2137`).
- Procedural floor textures: `_floorTexture(kind)` (`three-renderer.ts:1656`),
  cached in `_texCache`, canvas base fills are **`wood` `#7a5a3c`**, **`tile`
  `#9aa0a6`**, **`concrete` `#8d8d90`**.
- No per-room color exists. `Room` (`types.ts`, `Floor.rooms`) carries only
  `{id, name, anchor, occupancyEntity?}` — no color field. Walls build as
  **one mesh per segment** (`_buildSolidWallSegment`), floor-wide, with no
  room association; `wallColor` is necessarily a whole-floor (or whole-house)
  setting today, not a per-room one.

### 3.2 The toon-shader gotcha — worked numbers

`_simsColor` (`three-renderer.ts:1176-1182`):

```ts
col.setHSL(hsl.h, Math.min(1, hsl.s * 1.25 + 0.02), hsl.l);
```

This is the **entire** color-adjustment story for every material in the
scene; there's no other saturation/contrast step. Two worked examples using
hex values from §2.4:

- **A muted designer neutral** — SW Repose Gray `#C8C2B6` has roughly 9%
  chroma in HSL terms (channels 200/194/182 are close together). After
  `_simsColor`: `s' = min(1, 0.09·1.25 + 0.02) ≈ 0.13`. A ~44% *relative*
  bump but a tiny *absolute* one — the wall still reads as a neutral greige,
  not a color. **Real paint-deck neutrals are safe to port verbatim.**
- **A committed MCM accent** — the mustard accent `#D9A441` computes to
  HSL saturation ≈ 0.667. After `_simsColor`: `s' = min(1, 0.667·1.25 + 0.02)
  ≈ 0.85`. A large absolute jump — the mustard will look noticeably more
  vivid on-screen than the swatch. This actually *reinforces* the MCM
  "commit fully to one saturated accent" rule from §2.4 — the renderer
  amplifies exactly the move the style already wants. For styles whose
  accents should stay subdued (Scandinavian's dusty blue/sage, traditional's
  jewel tones used sparingly), consider swatch-shopping one step less
  saturated than you would in real life, or accept the boost as "the Sims
  look" (which is the documented intent of the whole rendering pipeline).

`_mat()`'s shared 4-band `gradientMap` (`three-renderer.ts:1163-1174`,
steps `[90, 150, 210, 255]` ≈ 35%/59%/82%/100% of the lit color) then
quantizes whatever brightness the light hits the surface with into one of
four discrete steps. Two colors whose real LRV differs by, say, 10–15 points
can still land in the *same* toon band under a given light angle and read as
visually identical on screen, even though their raw hex values differ.
**Recommendation for any curated palette table**: pick wall vs. trim vs.
floor values that differ by roughly ≥15–20 real LRV points if the goal is
for them to read as visibly distinct materials; if the goal is the 2026
"tonal layering" look (§2.4, Transitional), the toon banding will actually
help by compressing close values toward the same apparent band — that
trend and this renderer's quantization are, happily, aligned.

No tone mapping and no environment map (`NoToneMapping`; `scene.environment`
unset — see CLAUDE.md's "Sims-style rendering" section) means colors render
close to their literal (post-`_simsColor`) hex with no PBR-style ambient
wash-out, which is good news for hex fidelity — the only two transforms
between "hex you pick" and "hex on screen" are the saturation boost and the
4-band lighting quantization, both fully characterized above.

### 3.3 The floorColor × floorTex multiplication gotcha

`updateFloor` passes **both** `color: floorColor` and `map: floorTex` into
the same `_mat()` call (`three-renderer.ts:1991-1993`); Three.js multiplies a
material's base `color` against its `map` texel-by-texel. `Scene3D`'s
default `floorColor` is `#101820` — very dark navy-black. If a palette
preset sets `floorTex: 'wood'` (canvas base `#7a5a3c`, a warm tan) but
leaves `floorColor` at its default, the multiplication crushes the wood
grain nearly to black. **Any palette/preset table that turns on a
`floorTex` must also set a light, neutral-to-warm `floorColor`** (e.g.
`#ffffff` or a warm off-white like `#e8ddc8`) — encode the pairing directly
in the preset data so the UI literally cannot reproduce this bug. `tile`
(`#9aa0a6`) and `concrete` (`#8d8d90`) are lighter bases and more tolerant of
a mid-gray tint, but still shouldn't inherit the near-black default.

### 3.4 `ScenePreset` is lighting, not palette — keep them orthogonal

`Scene3D.preset` (`'day'|'dusk'|'night'`, `applyScenePreset` in
`three-renderer.ts:1620`) only changes the ambient/hemisphere/sun rig and
scene background tint — it has nothing to do with wall/floor color choice.
Don't conflate "pick a moody palette" with "switch to night preset" in the
UI or the data model; a light Scandinavian palette should still work fine
viewed under the `night` lighting preset (dim, blue-tinted ambient — the
walls are still their chosen hex, just under less light). Keep a palette
picker and the existing lighting-preset picker as separate, composable
controls (as they already are structurally in `_scene3dSection`).

### 3.5 `SENSOR_PALETTE` is unrelated — don't reuse it

`SENSOR_PALETTE` (`geometry.ts:478`, 8 fairly saturated hues:
`#4fc3f7`/`#81c784`/`#ffb74d`/`#ba68c8`/`#f06292`/`#4dd0e1`/`#aed581`/
`#ff8a65`) exists to keep overlaid radar-target dots/rigs visually
distinguishable from each other — a completely different design goal
(maximum mutual contrast among a small rotating set) than a coherent
whole-home interior scheme (mutual harmony within a limited hue family).
Don't pull from it when building the interior-palette table.

### 3.6 Proposed shape for a "Style presets" feature (not yet built)

- Add an `INTERIOR_PALETTES` table to `geometry.ts` (same convention as
  `SENSOR_PALETTE`/`FURNITURE_KINDS`): one entry per style with
  `{ id, label, wallColor, floorColor, floorTex, accentColor, note? }` — the
  §2.4 values, pre-paired per §3.3 (every `floorTex !== 'none'` entry ships
  its own compatible light `floorColor`).
- Sidebar: add a palette `<select>` at the top of `_scene3dSection`
  (`sidebar.ts` ~4326). Selecting a preset just writes
  `p.store.scene3d!.{wallColor,floorColor,floorTex}` through the existing
  `upd()` call — **no new persistence plumbing**, it rides the same
  `configRev` → `_keyFloor` dirty-key path manual edits already use.
  The individual color/texture pickers stay visible below it so a user can
  hand-tweak after applying a preset (applying a preset is just a bulk
  pre-fill of the same fields, not a new mode).
- "This floor only" is already free: writing into `f.look3d` instead of
  `p.store.scene3d` reuses `_floorLookOverrides` verbatim.
- Furniture-level palette coordination (recolor wood-tone pieces to match)
  would iterate `floor.furniture` and set `.color` per piece from a
  `FurnitureKind → hex` map carried on the preset — a bigger, optional v2
  (§5), not required for v1's wall/floor preset.
- If the chosen preset's *identity* needs to be remembered (e.g. so a later
  "nudge only what changed" edit knows the floor is currently "coastal"), add
  `Scene3D.paletteId?: string` (and/or `FloorLook3D.paletteId?`) — per the
  CLAUDE.md gotcha this is a **new top-level `Store`/`Floor` field** and
  MUST be added to `Planner._loadFromHa`'s explicit field list (and
  `repairFloor` if per-floor) or it silently resets on load. v1 doesn't need
  this field at all if the preset picker is a one-shot "apply and forget"
  action (recommended: simplest correct implementation).

## 4. Setup / integration steps

1. Add the `INTERIOR_PALETTES` data table to `geometry.ts` with the §2.4
   values (pick ONE representative wall/trim/accent hex triplet per style —
   don't try to encode the full designer nuance, this is a starting point).
2. For every entry that sets a non-`'none'` `floorTex`, hard-pair it with a
   light `floorColor` in the same table row (§3.3) — never let a preset
   leave `floorColor` at the dark default while a texture is active.
3. Add a palette `<select>` to `sidebar.ts._scene3dSection`, above the
   existing floorColor/floorTex/wallColor controls; wire its `onchange` to
   bulk-write those three `Scene3D` fields via the existing `upd()` helper.
4. Manually preview each preset under all three `ScenePreset` values
   (day/dusk/night) and confirm wall vs. floor vs. trim (where relevant)
   still read as distinct under the 4-step toon gradient (§3.2) — widen the
   LRV gap in the table if two elements visually collapse.
5. Confirm a plan that has never touched 3D Scene settings still falls back
   to the existing bare defaults (`#101820`/`none`/`#bbbbbb`) — the new
   preset table must not change what an untouched `Scene3D` renders as.
6. (Optional v2) Add per-`FurnitureKind` hex overrides to each preset and a
   "recolor furniture to match" action that iterates `floor.furniture`
   setting `.color`.
7. (Optional, larger scope) If per-room color is wanted, that is new data
   model + renderer work (a `Room.wallColor` plus splitting
   `_buildSolidWallSegment`'s per-segment material by owning room) — scope
   it separately; it is explicitly **not** a v1 palette-picker task (§6).

## 5. Potential additional features

- **Per-room paint** — `Room.wallColor` override, requires associating wall
  segments with the room(s) they bound and splitting today's one-material-
  per-segment build. The single biggest gap between "real interior design"
  (kitchen ≠ bedroom ≠ bath color) and what Diorama can currently show.
- **Accent wall** — a single wall segment colored differently from the rest
  of its room/floor; would need a `Wall.color?` override field and a small
  change to the wall-segment material lookup.
- **Palette preview swatch strip** in the sidebar before applying (small
  color chips), reusing whatever inline-CSS chip pattern the entity-picker/
  light-config modal already draws with.
- **Seasonal/holiday quick-reskins** — same `INTERIOR_PALETTES` mechanism,
  just more entries (e.g. a "warm autumn" or "cool holiday" one-click reskin
  for a kiosk/theater display).
- **Kitchen/bath sub-palette** — extend the per-piece recolor idea (§3.6) to
  target just `cat: 'appliance'`/counter/cabinet-family kinds, so applying a
  "farmhouse kitchen" only recolors cabinetry-adjacent pieces, not the whole
  floor's furniture.
- **Auto-suggest from a background image** — dominant-color extraction from
  an uploaded `Floor.bg` image (already supported) to seed a custom palette
  instead of picking from the eight canned styles.
- **Toon-band preview helper** — a small debug utility that shows which of
  the four gradient-map bands a candidate wall/trim/floor color lands in
  under the current sun angle, directly addressing the §3.2 collapse risk
  without needing a human to eyeball three lighting presets by hand.

## 6. Open questions & risks

- **Hex precision**: every hex value in this doc is a third-party
  colorimetry conversion, not Sherwin-Williams'/Benjamin Moore's own
  published digital value (their own COTY page admits screen rendering
  drifts 3–5% from the printed chip). Fine for a stylized toon renderer;
  don't present these as paint-matching-grade.
- **LRV vs. toon banding is not a clean linear relationship**: LRV describes
  real-world diffuse reflectance; Diorama's renderer applies a saturation
  boost *and* then quantizes lighting into 4 hard bands. A palette curated
  for good real-world LRV contrast can still visually collapse on screen —
  §4 step 4 (manual per-preset visual check across all three lighting
  presets) is not optional, it's the actual verification method; LRV math
  alone won't predict the on-screen result.
- **No per-room color today**: this doc's room-type conventions (§2.6) can't
  be wired into a live per-room 3D view without the new-data-model work
  flagged in §5 — a v1 "Style presets" feature can only apply a palette
  floor-wide (or per-floor via `look3d`), not per-room. Set expectations
  accordingly before promising "paint just the kitchen."
- **Style taxonomy is fuzzy**: "modern farmhouse," "transitional," and
  "coastal" all draw from overlapping neutral families; users will
  reasonably want to blend two presets. Treat `INTERIOR_PALETTES` as a
  curated starting point users can hand-edit afterward (the existing raw
  pickers stay visible), not a rigid, mutually-exclusive taxonomy.
- **2026-specific calls will age**: Universal Khaki (SW) and Silhouette (BM)
  are this year's Colors of the Year and will read dated within a couple of
  years; the warm-vs-cool-undertone logic, the 60-30-10 structure, and the
  toon-shader math (§3.2–3.3, which is source-verified against the actual
  `three-renderer.ts` code and won't drift) are the durable parts of this
  doc — treat the named-2026-color call-outs as swappable seasoning.
- **Saturation-math worked examples are my own colorimetry read**: the
  `_simsColor` formula itself is copied verbatim from source and is
  authoritative; the claim that specific named paint hexes compute to
  particular HSL saturation values is my own conversion from the RGB hex
  each color's third-party source reported, spot-checked for a couple of
  colors (Repose Gray, mustard) but not exhaustively verified for every hex
  in §2.4 — treat individual saturation numbers as illustrative, not exact.

## 7. Sources

- [Apartment Therapy — 60-30-10 rule](https://www.apartmenttherapy.com/interior-design-rule-60-30-10-explained-37504313)
- [Homes & Gardens — 60-30-10 rule](https://www.homesandgardens.com/advice/60-30-10-rule)
- [Behr — tried and true color combinations](https://www.behr.com/colorfullybehr/tried-and-true-color-combinations/)
- [Sherwin-Williams — Agreeable Gray SW 7029](https://www.sherwin-williams.com/en-us/color/color-family/neutral-paint-colors/sw7029-agreeable-gray)
- [NISH — 12 SW modern farmhouse paint colors](https://nishthasadana.com/12-sherwin-williams-modern-farmhouse-paint-colors/)
- [FacadeColorizer — SW Repose Gray guide](https://facadecolorizer.com/us/blog/sw-repose-gray-7015-exterior-guide-2026)
- [Sherwin-Williams — Alabaster SW 7008](https://www.sherwin-williams.com/en-us/color/color-family/white-paint-colors/sw7008-alabaster)
- [Paint Colors Wiki — SW Alabaster](https://paintcolorswiki.com/items/sw-alabaster)
- [Media.io — mid-century modern color palette](https://www.media.io/color-palette/mid-century-modern-color-palette.html)
- [Homes & Gardens — mid-century modern color schemes](https://www.homesandgardens.com/interior-design/mid-century-modern-color-schemes)
- [Edward George — MCM color palette](https://edwardgeorgelondon.com/mid-century-modern-color-palette/)
- [Media.io — Scandinavian color palette](https://www.media.io/color-palette/scandinavian-color-palette.html)
- [The Modern Dane — Scandinavian color palettes](https://www.moderndane.com/blogs/the-modern-dane-blog/the-role-of-color-palettes-in-scandinavian-design)
- [Benjamin Moore — coastal paint colors](https://www.benjaminmoore.com/en-us/paint-colors/coastal)
- [Packard Paint — types of coastal colors](https://www.packardpaint.com/blog/2026/06/19/types-of-coastal-colors-to-use-in-my-home)
- [Media.io — industrial color palette](https://www.media.io/color-palette/industrial-color-palette.html)
- [Hunker — industrial color palettes](https://www.hunker.com/13727133/industrial-color-palettes-ideas-and-inspiration/)
- [Havenly — home color palettes designers reach for](https://havenly.com/blog/color-palette-for-home)
- [Havenly — jewel tone colors guide](https://havenly.com/blog/jewel-tone-colors)
- [Color-meanings — neutral color palettes](https://www.color-meanings.com/neutral-color-palettes/)
- [LUXE Interiors + Design — 2026 color trends](https://luxesource.com/trends/interior-design-color-trends-2026/)
- [Homes & Gardens — what's replacing gray in 2026](https://www.homesandgardens.com/interior-design/whats-replacing-gray-in-2026)
- [Fufugaga — 2026 warm neutral paint colors](https://fufugaga.com/blogs/news/warm-neutral-paint-colors-for-2026-a-complete-guide)
- [Bob Vila — 2026 paint color trends by room](https://www.bobvila.com/design/paint-color-trends-by-room-2026/)
- [Paint Color HQ — best SW paint colors 2026](https://www.paintcolorhq.com/blog/best-sherwin-williams-paint-colors)
- [Southington Painting — flat ceiling paint](https://www.southingtonpainting.com/blog/do-you-have-to-use-flat-paint-on-ceilings-interior-painting-advice)
- [The DIY Playbook — paint sheens 101](https://thediyplaybook.com/paint-sheens-101/)
- [Clare — best paint finishes for walls and trim](https://www.clare.com/blogs/articles/best-paint-finishes)
- [MyPerfectColor — what is LRV](https://www.myperfectcolor.com/What-is-the-Light-Reflectance-Value-LRV/34201.htm)
- [MatchThatPaint — LRV explained](https://matchthatpaint.com/guides/lrv-explained/)
- [Welsh Design Studio — LRV of paint](https://welshdesignstudio.com/light-reflectance-value-lrv-of-paint/)
- [Paint Color HQ — paint color undertones explained](https://www.paintcolorhq.com/blog/understanding-paint-color-undertones)
- [Kylie M Interiors — paint color undertones explained](https://www.kylieminteriors.ca/paint-color-undertones-explained-beige-taupe-greige-beyond/)
- [Sherwin-Williams — 2026 Color of the Year, Universal Khaki SW 6150](https://www.sherwin-williams.com/en-us/color/color-of-the-year/2026)
- [Forbes — SW names Universal Khaki 2026 COTY](https://www.forbes.com/sites/rdaniel-foster/2025/09/24/sherwin-williams-names-universal-khaki-as-its-2026-color-of-the-year/)
- [Benjamin Moore — announces Silhouette AF-655 COTY 2026](https://www.benjaminmoore.com/en-us/press/benjamin-moore-announces-color-of-the-year-2026)
- [Encycolorpedia — SW Sea Salt 6204](https://encycolorpedia.com/cdd2ca)
- [Encycolorpedia — SW Evergreen Fog 9130](https://encycolorpedia.com/95978a)
- [Encycolorpedia — BM Hale Navy HC-154](https://encycolorpedia.com/434b56)
- [Encycolorpedia — SW Naval 6244](https://encycolorpedia.com/2f3d4c)
- [Sherwin-Williams — Iron Ore SW 7069](https://www.sherwin-williams.com/en-us/color/color-family/neutral-paint-colors/sw7069-iron-ore)
- [Sherwin-Williams — Tricorn Black SW 6258](https://www.sherwin-williams.com/en-us/color/color-family/neutral-paint-colors/sw6258-tricorn-black)
- [Benjamin Moore — White Dove OC-17](https://www.benjaminmoore.com/en-us/paint-colors/color/oc-17/white-dove)
- [Benjamin Moore — Chantilly Lace 2121-70](https://www.benjaminmoore.com/en-us/paint-colors/color/2121-70/chantilly-lace)
