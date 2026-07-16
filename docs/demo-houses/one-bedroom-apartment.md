# Demo House: One-Bedroom Apartment

Reconstruction-ready build spec for a Diorama demo floor plan.

## 1. Overview

- **Style**: Standard mid-rise US rental one-bedroom, the kind built by the
  thousands in 1970s–2000s garden-apartment and mid-rise complexes. Open-concept
  living/dining, a separate enclosed galley kitchen open to it through a wide
  pass-through/peninsula (not a full wall), one real bedroom down its own
  hallway, one full bathroom, and the closet cluster (coat, in-unit
  stacked-laundry, linen, bedroom walk-in) every rental listing photographs.
  Not luxury, not cramped — a believable "someone's actual apartment."
- **Total area**: ~750 sq ft (69.7 m²), gross floor footprint.
- **Floors**: 1 (no staircase — single-level unit).
- **Footprint**: 8500 mm (W, x-axis) × 8200 mm (D, y-axis) = 27'11" × 26'11".
- **Feel**: A big south-facing great room (living + dining) runs the full
  depth of the west two-thirds of the unit, lit by two windows on the entry
  wall and one on the side wall. The front door lands in a small east-side
  foyer next to a coat closet; behind the foyer a compact galley kitchen
  looks back into the great room over an open peninsula counter (no interior
  wall — a real one-wall-kitchen-open-to-living layout). A short hallway
  behind the kitchen is the spine to the bedroom, the full bath, and the
  stacked-laundry + linen closets. The bedroom is a clean rectangle with its
  own walk-in closet notched into the far corner. Floors are warm oak-look
  wood through the living spaces, small-format tile in the wet rooms, and a
  soft neutral carpet-tone in the bedroom; walls are a consistent warm
  off-white throughout.

## 2. Floor Plan

### Floor rectangle

`w = 8500 mm`, `d = 8200 mm` (origin at bottom-left, world +X right / +Y up,
matching Diorama's floor frame; y=0 is the south/entry side). Gross area
69.7 m² = 750.4 sq ft.

### ASCII sketch (plan view, north = top; not to exact scale)

```
   x=0                                          x=4700  x=5900     x=7000  x=8500
   +-------------------------------------------------------------------------+ y=8200 (N)
   |                                          |CLOSET |             | LINEN  |
   |          BEDROOM                         |-------|             |--------|
   |    (bed, nightstands,                    | (BR   |             |        |
   |     dresser, desk+chair)                 | cont.)|   HALLWAY   |  BATH  |
   |                                           |-------|             | [WinG] |
   |___________________________________________|       |             |--------|
   |                                                    |             |LAUNDRY |
   |                                                    |             |--------|
   |                                                    |-------------|--------|
   |                                                    |             |        |
   |        LIVING / DINING                             |  KITCHEN    |  x=8500
   |   (sofa, TV, coffee table,                         |   [WinD]    |
   |    dining table + 4 chairs,        (open peninsula)|             |
   |    bookshelf, plant)                               |-------------|--------|
   |                                                    | ENTRY |  CLOSET     |
   |                                                     [door]                |
   +-------------------------------------------------------------------------+ y=0 (S)
   x=0      [WinA]         [WinB]                     x=5900  x=7300      x=8500
```

Legend: `[WinA..G]` = windows (see Doors & windows table). `[door]` = main
entry on the south wall.

### Room table

Rectangles are `x, y, w, d` in mm from the floor origin (bottom-left).

| Room | Rect (x, y, w, d mm) | Sq ft | m² | Purpose |
|---|---|---|---|---|
| Living / Dining Room | 0, 0, 5900, 4900 | 311.2 | 28.91 | Open-concept great room; sofa/TV zone + dining table, opens to the kitchen peninsula |
| Entry / Foyer | 5900, 0, 1400, 1400 | 21.1 | 1.96 | Front door landing |
| Coat Closet | 7300, 0, 1200, 1400 | 18.1 | 1.68 | Reach-in coat/storage closet beside the entry |
| Kitchen | 5900, 1400, 2600, 2600 | 72.7 | 6.76 | Galley kitchen, open to Living/Dining via a west-side peninsula (no wall) |
| Hallway | 5900, 4000, 1100, 4200 | 49.7 | 4.62 | Spine from the great room to bedroom/bath/closets |
| Laundry Closet | 7000, 4000, 1500, 900 | 14.5 | 1.35 | Stacked washer/dryer |
| Bathroom | 7000, 4900, 1500, 2400 | 38.75 | 3.6 | Full bath: tub/shower, toilet, vanity |
| Linen Closet | 7000, 7300, 1500, 900 | 14.5 | 1.35 | Shelving, off the hallway |
| Bedroom | 0, 4900, 5900, 3300 (L-shaped — see note) | 192.8 | 17.91 | Primary bedroom, entered only via the Hallway |
| Bedroom Closet | 4700, 6900, 1200, 1300 | 16.8 | 1.56 | Walk-in, notched into the bedroom's NE corner |
| **Total** | | **750.15** | **69.7** | matches stated ~750 sq ft / 69.7 m² |

> **Bedroom L-shape**: the Bedroom's rect above (5900 × 3300) is its full
> envelope; the Bedroom Closet is walled off from its NE corner
> (x 4700–5900, y 6900–8200). The Bedroom's actual closed wall loop is the
> hexagon `(0,4900)→(5900,4900)→(5900,6900)→(4700,6900)→(4700,8200)→(0,8200)`
> — traced by walls F, E, L, K and the north/west exterior walls below. Its
> usable sleeping-area footprint (192.8 sq ft) already excludes the closet.

### Wall layout

All walls `kind: 'full'` (2743 mm / 9 ft) unless noted. Coordinates are wall
**centerlines** in mm; each row below is one `Wall.points[]` entry.

**Exterior perimeter** (one closed polyline):
```
(0, 0) → (8500, 0) → (8500, 8200) → (0, 8200) → (0, 0)
```

**Interior partitions** (each a separate wall entry):

| Wall | Points (mm) | Separates |
|---|---|---|
| A | (5900, 0) → (5900, 1400) | Entry ↔ Living/Dining (door D2) |
| B | (7300, 0) → (7300, 1400) | Entry ↔ Coat Closet (door D3) |
| C | (5900, 1400) → (8500, 1400) | Entry + Coat Closet ↔ Kitchen (solid, no door — kitchen is reached from the great room, not the foyer) |
| — | *(intentional gap: x=5900, y 1400→4000)* | **Open pass-through** — Kitchen ↔ Living/Dining. No wall here; a `counter` piece models the peninsula that visually divides the two |
| D | (5900, 4000) → (5900, 4900) | Living/Dining ↔ Hallway (door D4 — occupies this whole 900 mm wall stub as an open threshold) |
| E | (5900, 4900) → (5900, 8200) | Bedroom ↔ Hallway (door D5) |
| F | (0, 4900) → (5900, 4900) | Living/Dining ↔ Bedroom (solid — the bedroom is entered only from the Hallway) |
| G | (7000, 4000) → (7000, 8200) | Hallway ↔ {Laundry Closet / Bathroom / Linen Closet} column (doors D6, D7, D8) |
| H | (7000, 4000) → (8500, 4000) | Kitchen ↔ Laundry Closet (solid) |
| I | (7000, 4900) → (8500, 4900) | Laundry Closet ↔ Bathroom (solid) |
| J | (7000, 7300) → (8500, 7300) | Bathroom ↔ Linen Closet (solid) |
| K | (4700, 6900) → (4700, 8200) | Bedroom ↔ Bedroom Closet (door D9) |
| L | (4700, 6900) → (5900, 6900) | Bedroom ↔ Bedroom Closet, north-facing edge (solid) |

### Doors & windows

| Opening | Wall | Position (mm) | Width | Notes |
|---|---|---|---|---|
| D1 Main entry door | South exterior (y=0) | x: 6150–7050 | 900 mm | Swings in, into the Entry/Foyer |
| D2 Entry → Living/Dining | Wall A (x=5900) | y: 250–1150 | 900 mm | Open doorway, no door leaf needed |
| D3 Coat Closet door | Wall B (x=7300) | y: 300–1100 | 800 mm | Bi-fold |
| D4 Living/Dining → Hallway | Wall D (x=5900) | y: 4000–4900 | 900 mm | Open threshold — the 900 mm door exactly spans this short wall stub, so no jamb wall remains either side |
| D5 Hallway → Bedroom | Wall E (x=5900) | y: 5850–6750 | 900 mm | Standard interior door |
| D6 Hallway → Laundry Closet | Wall G (x=7000) | y: 4050–4850 | 800 mm | Bi-fold/louvered, for stacked washer/dryer access |
| D7 Hallway → Bathroom | Wall G (x=7000) | y: 5700–6500 | 800 mm | Standard interior door |
| D8 Hallway → Linen Closet | Wall G (x=7000) | y: 7400–8100 | 700 mm | Bi-fold |
| D9 Bedroom → Bedroom Closet | Wall K (x=4700) | y: 7150–7950 | 800 mm | Bi-fold or standard swing |
| Window A (living) | South exterior (y=0) | x: 900–2400 | 1500 mm | Sill 900, head 2100 |
| Window B (living/dining) | South exterior (y=0) | x: 3800–5300 | 1500 mm | Sill 900, head 2100 |
| Window C (living, side light) | West exterior (x=0) | y: 3050–4550 | 1500 mm | Sill 900, head 2100 |
| Window D (kitchen) | East exterior (x=8500) | y: 2250–3150 | 900 mm | Sill 900, head 2100; over the sink run |
| Window E (bedroom) | North exterior (y=8200) | x: 450–1950 | 1500 mm | Sill 900, head 2100 |
| Window F (bedroom) | North exterior (y=8200) | x: 2450–3950 | 1500 mm | Sill 900, head 2100 |
| Window G (bathroom) | East exterior (x=8500) | y: 5750–6450 | 700 mm | Sill 1200 (privacy height), frosted glass |

The bedroom's north wall only runs x 0–4700 (x 4700–5900 at y=8200 belongs to
the Bedroom Closet), so Windows E/F both sit correctly on that shorter run.

### Staircase

None — single floor.

## 3. Furnishing per room

Rotation convention: `0°` = front faces +Y (north), `90°` = faces +X (east),
`180°` = faces −Y (south), `270°` = faces −X (west) — matches the motion
sensor heading convention (screen-CW). Position is the piece's approximate
center in mm. Diorama `FurnitureKind` defaults are cited in parens for
sanity-checking footprints against the room sizes above.

### Living / Dining Room (0–5900, 0–4900)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `tv_stand` | 3100, 300 | 0° | Against south wall, centered in the pier between Windows A/B |
| `tv` | 3100, 300 | 0° | Mounted on/above the stand |
| `coffee_table` | 3100, 2400 | 0° | Between sofa and TV (1100×600) |
| `sofa` | 3100, 3800 | 180° | Back near the Living/Bedroom divider wall, facing the TV (2000×900) |
| `chair` (accent) | 1600, 2600 | 90° | Reading chair near the west window, angled into the seating group |
| `rug` | 3100, 2900 | 0° | Anchors sofa + coffee table + TV sightline (~2600×2200) |
| `table` (dining) | 4900, 3500 | 0° | Just inside the room, beside the kitchen peninsula (1500×900) |
| `chair` | 4900, 3050 | 0° | South side of dining table |
| `chair` | 4900, 3950 | 180° | North side of dining table |
| `chair` | 4500, 3500 | 90° | West side of dining table |
| `chair` | 5300, 3500 | 270° | East side of dining table |
| `bookshelf` | 200, 4600 | 180° | Against the Living/Bedroom divider wall (Wall F), west corner |
| `plant` | 5700, 4700 | 0° | NE corner, near the dining table |

### Entry / Foyer (5900–7300, 0–1400)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `bench` | 6600, 300 | 0° | Small entry bench against the south wall (1500×400 default; may need to shrink to fit) |
| `rug` | 6600, 700 | 0° | Landing mat |

### Coat Closet (7300–8500, 0–1400)

| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| *(none — open hanging rod + shelf, not separately modeled)* | — | — | Coats/shoes storage |

### Kitchen (5900–8500, 1400–4000)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `counter` | 8250, 2000 | 270° | East-wall run, south end, under Window D (1800×650 default — trim to fit) |
| `kitchen_sink` | 8250, 2700 | 270° | Centered under Window D |
| `counter` | 8250, 3350 | 270° | East-wall run, north end |
| `dishwasher` | 8000, 3350 | 270° | Beside the sink run |
| `stove` | 6300, 1550 | 0° | Against the south (interior) wall |
| `microwave` | 6300, 1650 | 0° | Over-the-range, mountable on the stove |
| `fridge` | 8100, 1650 | 0° | SE corner, counter-depth (910×760) |
| `counter` (peninsula) | 6050, 2700 | 270° | Free-standing on the open west edge — doubles as the visual divider from Living/Dining and a breakfast bar |
| `stool` | 5700, 2500 | 90° | Living-room side of the peninsula |
| `stool` | 5700, 2900 | 90° | Living-room side of the peninsula |

### Hallway (5900–7000, 4000–8200)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `rug` (runner) | 6450, 6100 | 90° | Long axis along the hallway |

### Laundry Closet (7000–8500, 4000–4900)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `washer` | 7400, 4300 | 0° | Stacked unit, bottom; front faces the door on Wall G |
| `dryer` | 7400, 4300 | 0° | Stacked on top of the washer — same footprint, modeled as a second item at the same x/y so each keeps its own `entity_id` bind |

### Bathroom (7000–8500, 4900–7300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `bathtub` | 8200, 6100 | 270° | Along the east exterior wall, under/near Window G (1520×760 fits the 2400 mm wall easily) |
| `toilet` | 7250, 5150 | 90° | Against the west (hallway) wall, south end |
| `sink_vanity` | 7250, 7050 | 90° | Against the west (hallway) wall, north end, near the Linen Closet wall |

### Linen Closet (7000–8500, 7300–8200)

| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| *(none — shelving, not separately modeled)* | — | — | Towels/linens storage |

### Bedroom (0–5900, 4900–8200, L-shaped)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `bed` (queen) | 2350, 7450 | 180° | Headboard against the north exterior wall, centered in the 0–4700 usable width (2000×1500) |
| `nightstand` | 1300, 7450 | 180° | West side of bed |
| `nightstand` | 3400, 7450 | 180° | East side of bed |
| `dresser` | 4300, 5300 | 270° | Against the Bedroom-Closet wall (Wall K), south end of the room, facing into the room |
| `desk` | 600, 5300 | 90° | Against the west exterior wall, south portion |
| `chair` | 900, 5300 | 270° | Desk chair, facing the desk |
| `rug` | 2350, 6800 | 0° | Under/around the bed |

### Bedroom Closet (4700–5900, 6900–8200)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `wardrobe` | 5300, 7550 | 0° | Built-in hanging rod/shelving along the back (north) wall |

## 4. Skinning / appearance

Diorama's `Scene3D`/`Floor.look3d` texture + color are **per floor**, not
per room — this is a single-floor apartment, so there is no per-room override
available at all; pick one dominant treatment for the whole unit. Intended
real-world materials, for reference:

| Zone | Real-world material | Diorama `floorTex` | `floorColor` |
|---|---|---|---|
| Living/Dining, Entry, Hallway | Warm oak-look engineered wood plank | `wood` | `#C9A874` |
| Kitchen, Bathroom, Laundry Closet, Linen Closet | Small-format light warm-gray tile | `tile` | `#DAD5C8` |
| Bedroom, Bedroom Closet | Wall-to-wall carpet (no dedicated carpet texture exists — use `none` + a soft carpet tone) | `none` | `#D8CDB8` |
| Coat Closet | Matches the Entry (wood) | `wood` | `#C9A874` |

**Recommended single floor-wide setting**: `floorTex: 'wood'`,
`floorColor: '#C9A874'` — it covers Living/Dining/Entry/Hallway, the largest
and most-viewed share of the floor. The bathroom/kitchen tile look and the
bedroom carpet tone are the deliberate compromises under the current
one-material-per-floor model (see Reconstruction notes).

**Wall color** (`Scene3D.wallColor`, whole floor): warm off-white,
`#EFE9DE`.

**Accent notes** (non-Diorama-modeled, flavor only): brushed-nickel door
levers and cabinet pulls, white kitchen cabinetry, a navy or forest-green
accent pillow on the sofa.

## 5. Reconstruction notes

- **Scale sanity check**: room rectangles sum to 750.15 sq ft (69.7 m²),
  matching the floor's own 8500 × 8200 mm = 750.4 sq ft almost exactly (the
  0.25 sq ft gap is rounding in the per-room sq-ft conversions, not an
  unaccounted area — every mm² of the floor rect is claimed by exactly one
  room above).
- **Room-name convention**: name the enclosed galley room literally
  `"Kitchen"` — the kitchen substring-gate (snack/coffee thought bubbles)
  fires for anyone idling **inside that room's own wall loop**, e.g. at the
  peninsula stools. Someone idling in `"Living / Dining Room"` proper (not
  overlapping the Kitchen rectangle) will **not** get kitchen-gated bubbles,
  since that's a separate named room even though the two are visually open
  to each other — this is architecturally correct behavior for a "galley
  kitchen with a pass-through" layout, not a bug to route around.
- **Open kitchen pass-through**: the gap in Wall C's family at x=5900,
  y 1400→4000 is **intentional** — no `Wall` entry there at all. The visual
  divider between Kitchen and Living/Dining is the `counter` piece at
  (6050, 2700), not a wall. Diorama's `closedWallLoops` tracer needs the
  *rest* of the Kitchen's perimeter (Walls C, H, plus the east/portion of
  the north exterior) to still close a floor patch for it — verify the
  kitchen's loop closes even with that one open edge (it does: the loop
  simply isn't closed through that edge, and floor generation instead
  relies on the Living/Dining room's own closed loop plus the rest of the
  building perimeter; no dedicated Kitchen floor patch is required since it
  shares the same continuous slab as an unenclosed area — treat Kitchen as
  a **named zone**, not a separately walled floor patch, if a builder finds
  the tracer wants a closed loop).
- **Small-closet doors spanning their whole wall stub** (D4, D6, D8, D9):
  several interior partitions here are barely longer than a standard door
  (900mm wall / 900mm door for D4; 900mm wall / 800mm door for D6). This is
  intentional and matches real shallow-closet framing — there's effectively
  no jamb wall left on either side of the opening, which is normal for a
  30" bifold closet in a tight hallway.
- **Per-room flooring limitation**: `floorTex`/`floorColor`/`wallColor` live
  on `Store.scene3d` with only a per-**floor** override (`Floor.look3d`) —
  since this is a single-floor unit, there is no mechanism at all for the
  kitchen/bath tile or bedroom carpet to render distinctly from the living
  room's wood. Build with one floor-wide material (wood, per §4).
- **Washer/dryer as one footprint**: model both `washer` and `dryer` at the
  same x/y (see Laundry Closet table) so each keeps its own `entity_id`
  binding in the sidebar; visually they overlap at that footprint, an
  accepted simplification for a stacked in-unit unit.
- **Lighting & switches & sensors suggestion** (not required by the brief
  but useful for a believable rebuild):
  - Ceiling lights: one over the living seating group (3100, 2400), one
    over the dining table (4900, 3500), one in the kitchen (7200, 2700),
    one at the entry (6600, 700), one in the hallway (6450, 6100), one
    centered over the bedroom (2350, 6800), one in the bathroom (7750,
    6100).
  - A floor lamp beside the accent chair (1300, 2400) for secondary living
    light; a nightstand lamp is implied by the `nightstand` pieces (no
    separate light fixture needed if binding isn't required).
  - Switches: one by the entry door (6600, 200, wall-snapped to the south
    wall) ganged for entry + living + kitchen lights; one at the hallway
    entrance (5950, 4100) for the hallway + bathroom; one just inside the
    bedroom door (5850, 6400) for the bedroom light.
  - mmWave (positional) coverage: one centered in the Living/Dining room
    (3100, 2400) covering the whole great room + peninsula/kitchen sightline,
    one in the Bedroom (2350, 6500). Simple binary motion sensors suffice for
    the Bathroom (7750, 6100), Kitchen (7200, 2700), and Hallway (6450, 6100)
    given how small and single-purpose those rooms are.
  - A door lock + doorbell entity on the main entry door, and a smoke
    detector on the hallway ceiling (6450, 6100) round out a realistic
    device set, if desired.
- **Furniture kind availability**: every kind referenced above (`sofa`,
  `chair`, `coffee_table`, `tv_stand`, `tv`, `table`, `bookshelf`, `plant`,
  `bench`, `rug`, `counter`, `kitchen_sink`, `dishwasher`, `stove`,
  `microwave`, `fridge`, `stool`, `washer`, `dryer`, `bathtub`, `toilet`,
  `sink_vanity`, `bed`, `nightstand`, `dresser`, `desk`, `wardrobe`) already
  exists in `FURNITURE_KINDS` (`src/geometry.ts`) — no new kinds need to be
  added to build this house. (`kitchen_sink` and `sink_vanity` are used in
  preference to the generic `sink` kind, matching their intended rooms.)
- **Clearances**: the dining table sits ~1000 mm from the open kitchen edge
  (comfortable serving distance), the hallway is a true 1100 mm clear width
  (top of the standard 1000–1200 mm range, since it also carries the linen
  and laundry bifold doors), and the bathroom's 1500 mm width was
  specifically chosen (over a tighter 1400 mm) to comfortably fit a
  standard 1520 mm tub along its long (2400 mm) wall per code-minimum
  full-bath guidance.

Sources consulted for sizing sanity: real ~750 sq ft one-bedroom apartment
floor plans and standard unit composition (houseplans.net, homewip.com,
kalex.kendal.org), and standard US full-bathroom dimensions / fixture
clearances (badeloftusa.com, temeculaconstruction.com).
