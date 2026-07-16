# Demo House: Studio Apartment

Reconstruction-ready build spec for a Diorama demo floor plan.

## 1. Overview

- **Style**: Modern urban studio apartment (post-war mid-rise / loft-conversion
  flavor), one open living/sleeping/kitchen "great room" plus a fully enclosed
  bathroom and two small closets. Think a corner unit in a 1960s–2000s
  mid-rise building — not a luxury new-build, just a well-organized, believable
  compact home.
- **Total area**: ~451 sq ft (41.9 m²), gross floor footprint.
- **Floors**: 1 (no staircase — single-level unit).
- **Footprint**: 6600 mm (W, x-axis) × 6350 mm (D, y-axis) = 21'8" × 20'10".
- **Feel**: A single bright, open room does triple duty — sleeping nook,
  living/TV area, and a one-wall galley kitchen — wrapped around a compact
  furniture-lined core of bathroom + coat closet + stacked-laundry closet near
  the entry. Light comes from two exposures (north + west); the entry wall
  (south) and the TV wall (east) are solid, since those face the building
  corridor / a neighboring unit. Floors are warm oak-look engineered wood in
  the great room, small-format tile in the bathroom. Walls are a soft warm
  white throughout. It reads as lived-in but tidy: a real adult's studio, not
  a furniture-catalog set piece.

## 2. Floor Plan

### Floor rectangle

`w = 6600 mm`, `d = 6350 mm` (origin at bottom-left, world +X right / +Y up,
matching Diorama's floor frame). Gross area 41.91 m² = 451.1 sq ft.

### ASCII sketch (plan view, north = top; not to exact scale)

```
   x=0                                                          x=6600
   +----------------------------------------------------------------+ y=6350 (N)
   |                                          [W1]        [W2]       |
   |            BEDROOM NOOK                                        |
   |   (dresser)      (bed, headboard N)         (wardrobe)         |
   |                                                                 |
   |   +---------+                                                  |
   |   |WARDROBE |            (nightstands flank bed)               |
   |   +---------+----------------------------------+               |
   |                                                                 |
   |  KITCHEN     |   dining table + 2 chairs        |  LIVING AREA  |
   |  (west wall  |                                  |  (extends     |
   |   run)      [W3]                                |   from below) |
   |   fridge     |                                  |               |
   |   counter    |                                  |               |
   |   sink       +----------------------------------+               |
   |   dishwasher |          |          |                     TV --- |
   |   stove      | BATHROOM | UTILITY  |   ENTRY / LIVING POCKET    |
   |   +--------+ |  (tub,   | CLOSET   |   sofa   coffee table  TV  |
   |   | CLOSET | |  toilet, | (washer/ |                            |
   |   | (coat) | |  sink)   |  dryer)  |          [door]            |
   +---+--------+-+----------+----------+----------------------------+ y=0 (S)
   x=0     900          2800      3700       4200..5100         6600
```

Legend: `[W1]`/`[W2]`/`[W3]` = windows (north/north/west). `[door]` = main
entry door on the south wall.

### Room table

Only three rooms are fully enclosed by partition walls; everything else is
one open "Great Room". Rectangles are `x, y, w, d` in mm from the floor
origin (bottom-left).

| Room | Rect (x, y, w, d mm) | Sq ft | m² | Purpose |
|---|---|---|---|---|
| Entry Closet | 0, 0, 900, 700 | 6.8 | 0.63 | Reach-in coat closet at the entry |
| Bathroom | 900, 0, 1900, 2400 | 49.1 | 4.56 | Full bath: tub/shower, toilet, vanity |
| Utility Closet | 2800, 0, 900, 800 | 7.8 | 0.72 | Stacked washer/dryer closet |
| Great Room ("Kitchen / Living / Bedroom") | Floor minus the three rooms above (irregular/L-shaped) | 387.5 | 36.0 | Open kitchen + dining + living + sleeping |
| **Total** | | **451.1** | **41.9** | matches stated ~450 sq ft / 42 m² |

> Naming note: the open area is modeled in Diorama as a single `Room` whose
> name contains the substring **"Kitchen"** (e.g. `"Kitchen / Living /
> Bedroom"`) so the kitchen-gated snack/coffee thought-bubble behavior fires
> for anyone idling anywhere in the great room — reasonable in a studio this
> size, where the kitchen is never more than a few steps away.

### Wall layout

All walls `kind: 'full'` (2743 mm / 9 ft) unless noted. Coordinates are wall
**centerlines** in mm; each row below is one `Wall.points[]` entry.

**Exterior perimeter** (one closed polyline):
```
(0, 0) → (6600, 0) → (6600, 6350) → (0, 6350) → (0, 0)
```

**Interior partitions** (each a separate wall entry; together with the
perimeter they close off the Closet / Bathroom / Utility Closet and leave the
rest as the Great Room):

| Wall | Points (mm) | Separates |
|---|---|---|
| B | (900, 0) → (900, 2400) | Entry Closet / Bathroom ↔ Great Room (west edge of both) |
| C | (0, 700) → (900, 700) | Entry Closet north wall (Closet ↔ Great Room) |
| D | (900, 2400) → (2800, 2400) | Bathroom north wall (Bathroom ↔ Great Room) |
| E | (2800, 0) → (2800, 2400) | Bathroom / Utility Closet ↔ Great Room (east edge of both) |
| F | (2800, 800) → (3700, 800) | Utility Closet north wall (Utility ↔ Great Room) |
| G | (3700, 0) → (3700, 800) | Utility Closet east wall (Utility ↔ Great Room) |

(Walls B and E each do double duty as the shared partition for two stacked
rooms along the same x-coordinate — this is normal; Diorama's closed-loop
tracer only cares about the polylines, not which named rooms they border.)

### Doors & windows

| Opening | Wall | Position (mm) | Width | Notes |
|---|---|---|---|---|
| Main entry door | South exterior (y=0) | x: 4200–5100 | 900 mm | Swings in, into the entry/living pocket |
| Closet door | Wall C (y=700) | x: 100–800 | 700 mm | Bi-fold, swings into Great Room |
| Bathroom door | Wall D (y=2400) | x: 1200–2050 | 850 mm | Standard interior door |
| Utility closet door | Wall F (y=800) | x: 2950–3650 | 700 mm | Bi-fold/pocket, for stacked washer/dryer access |
| Window W1 (bedroom) | North exterior (y=6350) | x: 900–2100 | 1200 mm | Sill 900 mm, head 2100 mm |
| Window W2 (living) | North exterior (y=6350) | x: 4300–5500 | 1200 mm | Sill 900 mm, head 2100 mm |
| Window W3 (kitchen) | West exterior (x=0) | y: 2200–3400 | 1200 mm | Sill 900 mm, head 2100 mm; sits over the sink |

South and east exterior walls carry no windows (south = corridor-facing,
east = interior/neighboring-unit side — also convenient for TV glare).

### Staircase

None — single floor.

## 3. Furnishing per room

Rotation convention below: `0°` = front faces +Y (north), `90°` = faces +X
(east), `180°` = faces −Y (south), `270°` = faces −X (west). Position is the
piece's approximate center in mm.

### Entry Closet (900 × 700)

| Furniture | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| *(none — open hanging rod + shelf, not separately modeled)* | — | — | Coats/shoes storage |

### Bathroom (900–2800, 0–2400)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `bathtub` | 2400, 1200 | 270° | Along east wall (Wall E), 800×1700 mm, tub/shower combo |
| `toilet` | 1150, 2050 | 180° | Against north wall (Wall D), west corner |
| `sink` (vanity) | 1150, 700 | 90° | Against west wall (Wall B), south of toilet |

### Utility Closet (2800–3700, 0–800)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `washer` | 3250, 350 | 0° | Stacked unit, bottom; door faces north (Wall F) |
| `dryer` | 3250, 350 | 0° | Stacked on top of washer — same footprint, modeled as a second item at the same x/y for the sidebar bind; renderer shows one stacked appliance visually |

### Kitchen zone (west wall run, x ≈ 0–900, y ≈ 800–4300 — part of the Great Room)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `stove` | 325, 1200 | 90° | Range against west wall, 750×650 |
| `microwave` | 325, 1200 | 90° | Over-the-range, mountable on stove |
| `dishwasher` | 300, 2000 | 90° | Built in under counter, beside sink |
| `sink` | 325, 2450 | 90° | Counter sink, sits under window W3 |
| `counter` (run 1) | 325, 1750 | 90° | Landing counter between stove and dishwasher, 600×650 |
| `counter` (run 2) | 325, 3100 | 90° | Counter run north of sink, 1200×650 |
| `fridge` | 375, 3900 | 90° | North end of run, 900×750, counter-depth |

### Dining nook (x ≈ 1200–2200, y ≈ 3900–4700 — Great Room)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `table` (dining) | 1700, 4200 | 0° | Small 2-top, 800×800 |
| `chair` | 1700, 3900 | 0° | Facing table (north) |
| `chair` | 1700, 4500 | 180° | Facing table (south) |

### Bedroom nook (north wall, x ≈ 0–3700, y ≈ 4250–6350 — Great Room)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `bed` (queen) | 1850, 5300 | 180° | Headboard flush against north wall, 1700×2100 |
| `nightstand` | 900, 5300 | 180° | West side of bed |
| `nightstand` | 2800, 5300 | 180° | East side of bed |
| `dresser` | 300, 4900 | 90° | Against west wall, south of bed area, 1200×550 |
| `wardrobe` | 300, 5900 | 90° | Against west wall, north corner, 1000×600 |

### Living area (entry pocket + extension, x ≈ 3700–6600, y ≈ 0–2400 and 2400–4200 — Great Room)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `tv_stand` | 6450, 1500 | 270° | Against east wall |
| `tv` | 6450, 1500 | 270° | Mounted on/above tv_stand |
| `coffee_table` | 5800, 1500 | 0° | Between sofa and TV |
| `sofa` | 5000, 1500 | 90° | Facing east toward TV, 2000×850 |
| `rug` | 5300, 1600 | 0° | Anchors sofa + coffee table, 2600×2200 |
| `bookshelf` | 3800, 2200 | 90° | Against the utility-closet's east wall (Wall G) return, near entry |

## 4. Skinning / appearance

Diorama's `Scene3D`/`Floor.look3d` texture + color are **per floor**, not
per room, so pick one dominant floor treatment for the whole floor and let
the bathroom read as a deliberate visual compromise (see Reconstruction
notes). Intended real-world materials, for reference:

| Zone | Real-world material | Diorama `floorTex` | `floorColor` |
|---|---|---|---|
| Great Room (kitchen/living/bedroom) | Warm oak engineered wood plank | `wood` | `#C7A06B` |
| Bathroom | Small-format light gray tile | `tile` | `#D9D6CE` |
| Closets/Utility | Same as Great Room (no separate finish) | `wood` | `#C7A06B` |

**Recommended single floor-wide setting** (since `floorTex`/`floorColor` are
whole-floor): `floorTex: 'wood'`, `floorColor: '#C7A06B'` — it's most of the
square footage and reads correctly from every camera angle; the bathroom's
`tile` look is the one area you'd sacrifice, or apply as a `Floor.look3d`
override if a future per-room capability lands.

**Wall color** (`Scene3D.wallColor`, whole floor): soft warm white,
`#F1ECE2`.

**Accent notes** (non-Diorama-modeled, just for renderer flavor / custom
objects if desired): navy accent on the closet doors, brushed-nickel
hardware, black-frame windows.

## 5. Reconstruction notes

- **Scale sanity check**: room rectangles sum exactly to the floor total —
  6.8 + 49.1 + 7.8 + 387.5 = 451.1 sq ft = the stated floor footprint (41.9
  m² / 451 sq ft). No slack was left unaccounted for.
- **Room-name convention**: name the open room something containing
  `"Kitchen"` (e.g. `"Kitchen / Living / Bedroom"`) so the kitchen
  substring-gated snack/coffee thought bubbles engage anywhere in the great
  room — appropriate given its size. Name the enclosed rooms plainly:
  `"Bathroom"`, `"Entry Closet"`, `"Utility Closet"`.
- **Per-room flooring limitation**: `floorTex`/`floorColor`/`wallColor` live
  on `Store.scene3d` with only a **per-floor** override (`Floor.look3d`) —
  there is no per-room texture in the current data model. Build with one
  floor-wide material (wood recommended per §4) rather than expecting the
  bathroom to render in tile.
- **Washer/dryer as one footprint**: Diorama furniture pieces don't have a
  native "stacked" relationship. Model both `washer` and `dryer` at the same
  x/y (see Utility Closet table) so each keeps its own `entity_id` binding in
  the sidebar; visually they'll overlap at that footprint, which is an
  acceptable simplification for a single closet-depth appliance stack.
- **Lighting & switches suggestion** (not required by the brief but useful
  for a believable rebuild):
  - Ceiling lights: one flush-mount over the kitchen run (~450, 2500), one
    over the dining table (1700, 4200), one centered over the bedroom nook
    (1850, 5600), one in the living area (5300, 1800), one small fixture in
    the bathroom (1850, 1200), one at the entry (4650, 600).
  - A floor lamp beside the sofa (4700, 900) for secondary living-area light.
  - Switches: one by the entry door (4600, 200, wall-snapped to the south
    wall) ganged for entry + living lights; one by the bathroom door (1600,
    2450, wall-snapped to Wall D) for the bathroom light.
  - No mmWave/motion sensors are required for a static demo, but if adding
    live-occupancy behavior: one motion sensor centered in the Great Room
    (3300, 3200) covers kitchen+dining+living, and one in the bedroom nook
    (1850, 5300) covers the sleeping area — the bathroom and closets are
    small enough that a single binary motion sensor each (bathroom: 1850,
    1200; utility: 3250, 400) suffices rather than positional mmWave.
  - A door lock / doorbell entity on the main entry door and a smoke
    detector on the bedroom-nook ceiling (1850, 6000) round out a realistic
    device set, if desired.
- **Furniture kind availability**: all kinds referenced above (`bed`,
  `nightstand`, `dresser`, `wardrobe`, `sofa`, `coffee_table`, `tv_stand`,
  `tv`, `bookshelf`, `table`, `chair`, `rug`, `fridge`, `stove`,
  `microwave`, `dishwasher`, `washer`, `dryer`, `counter`, `sink`,
  `toilet`, `bathtub`) already exist in `FURNITURE_KINDS` — no new kinds
  need to be added to `geometry.ts` to build this house.
- **Clearances are studio-tight by design**: the dining table sits close to
  the foot of the bed (~50–100 mm clearance) and the kitchen run is a single
  wall — this matches the lived reality of a genuine ~450 sq ft unit rather
  than an idealized spacious layout, and was a deliberate choice, not an
  oversight.

Sources consulted for sizing sanity: real 450 sq ft studio floor plans
(coohom.com, houseplans.net, apartmenttherapy.com) and standard US
residential bathroom/fixture dimensions (badeloftusa.com, houseplanshelper.com,
temeculaconstruction.com).
