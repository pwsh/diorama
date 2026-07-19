# Flags — adding a flag to the yard flagpole library

The yard **flagpole fixture** (`FlagpoleFixture`, tool 🚩) flies a cloth flag whose
design comes from the pure flag library in **`src/flags.ts`**. Adding a new flag is
a one-line registry entry + one painter function — nothing else needs wiring. The
renderer builds a `CanvasTexture` from the painter (cached per flag id, disposed in
`destroy()`); the 2D canvas reads only the `dominant` hex for its tiny map glyph;
the sidebar dropdown enumerates the registry labels automatically.

## The painter signature

```ts
type FlagPainter = (g: CanvasRenderingContext2D, w: number, h: number) => void;
```

A painter receives a 2D canvas context and the canvas size (`w × h`, currently
`240 × 144` = 5:3 in the renderer, but write for ANY size). It fills the whole
canvas with a simplified geometric rendition of the flag.

### Canvas coordinate conventions

- Origin **top-left**, `+x` right, `+y` down (standard canvas).
- Work in **fractions of `w`/`h`** so any canvas size renders correctly — never
  hard-code pixel counts. E.g. a centered disc is `arc(w/2, h/2, h*0.3, …)`.
- The painter **owns the whole canvas**: always paint the full background first
  (`fillRect(0, 0, w, h, …)`), then draw stripes/charges on top. A painter that
  leaves pixels untouched fails the "non-blank" test.
- **Deterministic only** — NEVER `Math.random()`. Textures are cached and must be
  byte-stable across rebuilds; a randomized painter would flicker.

### Small helpers (in `flags.ts`)

`rect(g, x, y, w, h, color)`, `disc(g, cx, cy, r, color)`,
`star(g, cx, cy, r, color, points?, rot?)`, `poly(g, points[], color)`.

## The registry entry

Add one entry to `FLAG_PAINTERS`:

```ts
export const FLAG_PAINTERS: Record<string, FlagPainterEntry> = {
  // …
  my_flag: { label: 'My Flag', dominant: '#3366cc', paint: myFlagPainter },
};
```

| Field      | Meaning                                                                 |
|------------|-------------------------------------------------------------------------|
| key        | the stable `Flagpole.flag` id (snake_case). `'usa'` is `DEFAULT_FLAG`.   |
| `label`    | human-readable dropdown label (sidebar).                                 |
| `dominant` | the flag's headline hex — tints the **2D** map glyph (the 3D shows cloth).|
| `paint`    | the painter function.                                                    |

That's it. `flagEntry(id)` / `flagDominant(id)` fall back to the default for an
unknown/stale id (never throw), so removing a flag can't break a saved plan.

## Simplification guidance

Get the **proportions and field colors right**; simplify anything fiddly:

- Complex crests / coats of arms → a single clean disc or omitted (Spain, Mexico,
  Brazil all drop their central emblem or reduce it to a disc).
- Star fields → a dot grid (USA) or a few `star(...)` calls, not exact geometry.
- Eagles / animals / mottos → skip them (Brazil's motto banner is omitted).
- Text is fine and useful — the `open_sign` flag ("OPEN") is intentionally
  **asymmetric** so it exercises the double-face / non-mirror build (two FrontSide
  planes sharing one texture, the back rotated π so the design reads correctly
  from both flanks — see `_buildFlagpole` / `updateFlagpoles` in
  `three-renderer.ts`, the same technique as the sky-banner tow plane).

## What you do NOT need to touch

The texture is built + cached automatically the first time a pole flies the flag.
No renderer switch, no dirty-key change, no 2D special-casing, no dispose plumbing
(the shared `CanvasTexture` cache is freed once in `destroy()`). Adding a painter +
registry entry is the entire change. Cover the new entry in
`test-pages/flagpole-test.html` (every `FLAG_PAINTERS` member is asserted to paint
non-blank + carry a label/dominant).
