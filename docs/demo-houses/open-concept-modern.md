# Demo House: Open-Concept Modern Single-Story

Build spec for a Diorama demo/reference house. All coordinates are in **mm**,
floor-origin at **bottom-left (0,0)**, `+X` = right (east), `+Y` = up/back
(north). This matches Diorama's world frame convention. Wall paths given below
are **centerlines**; assume standard Diorama `full` wall thickness (100 mm)
unless noted. Room rectangles are `(x, y)` = bottom-left corner, `w` = width
(x-extent), `d` = depth (y-extent).

---

## 1. Overview

**Style**: Modern single-story open-concept home ("modern farmhouse" massing
with clean modern interiors — low-slope roof lines implied, large glazing,
flat-panel cabinetry, warm-neutral palette). One story, no stairs.

**Total floors**: 1

**Conditioned living area**: ≈ 2,200 sq ft (≈ 204 m²) — see §5 sanity check;
brief target was ~2,000 sq ft, this plan lands modestly over that with a
generously-sized primary suite and office (trim per §5 if an exact 2,000 is
required).

**Total footprint (incl. garage, porch, patio, side yard)**: ≈ 3,620 sq ft
(≈ 336 m²)

**Overall floor rectangle**: **21,000 mm (W) × 16,000 mm (D)** — 68'-11" ×
52'-6"

**Feel**: A wide, shallow-U massing — attached 2-car garage on the west end,
a wide-open great room (kitchen + dining + living combined under one volume)
in the center opening onto a big covered rear patio, and a private bedroom
wing on the east end split front-to-back (secondary bedrooms/office up front,
primary suite tucked at the quiet back corner). Minimal interior partitions
in the great room — just structural/utility walls at each end — so the
kitchen island, dining table, and living seating all read as one continuous
volume with sightlines from the front door straight through to the backyard
glass. Warm white oak flooring runs the whole great room + hallway for a
seamless modern flow; bedrooms get soft carpet; wet rooms get tile.

---

## 2. Floor Plan

### 2.1 Floor rectangle

**W = 21,000 mm, D = 16,000 mm** (68'-11" × 52'-6")

Three wings, left to right (x):

| Wing | X range | Width | Contents |
|---|---|---|---|
| A — Garage/Utility | 0 – 6,400 | 6,400 mm (21'-0") | Garage, laundry, pantry, side yard |
| B — Great Room | 6,400 – 13,600 | 7,200 mm (23'-7") | Porch, foyer, kitchen, dining, living, patio |
| C — Bedroom Wing | 13,600 – 21,000 | 7,400 mm (24'-3") | Hall, office, 2 secondary bedrooms, shared bath, primary suite |

y = 0 is the **front/street side** (entry, garage doors, porch). y = 16,000
is the **back yard side** (covered patio, primary suite windows).

### 2.2 ASCII sketch (schematic, not to scale)

```
y=16000 (BACK / YARD) ────────────────────────────────────────────────────
        ┌───────────────┬───────────────────────┬───────────────────────┐
        │                                       │      PRIMARY BED      │
        │   SIDE YARD    │    COVERED PATIO      │  (bed | bath | WIC)   │
        │  (unenclosed)  │                       ├───────────────────────┤
        │                │                       │       BED 3          │
        ├────────────────┤                       ├───────────────────────┤
        │                │       LIVING          │      BATH 2 / LINEN   │
        │   LAUNDRY /    │   (sectional + TV)    ├───────────────────────┤
        │    PANTRY      │                       │       BED 2           │
        ├────────────────┼───────────────────────┼───────────────────────┤
        │                │   KITCHEN  │  DINING  │        OFFICE / DEN   │
        │     GARAGE     ├────────────┴──────────┤                       │
        │   (2-car)      │  porch  │FOYER│ porch  │  (hallway spine on   │
        │                │                       │   the west edge of   │
        └────────────────┴───────────────────────┘   this wing)          │
                                                 └───────────────────────┘
y=0 (FRONT / STREET) ───────────────────────────────────────────────────
        x=0          x=6400                x=13600                 x=21000
        [garage doors ×2]      [main entry door, centered]
```

### 2.3 Room table

All rectangles `(x, y, w, d)` in mm, origin bottom-left of the floor.

| Room | x | y | w | d | sq ft | Purpose |
|---|---|---|---|---|---|---|
| Garage (2-car) | 0 | 0 | 6,400 | 6,400 | 441 | Parking, storage |
| Laundry | 0 | 6,400 | 3,000 | 2,200 | 71 | Washer/dryer |
| Walk-in Pantry | 3,000 | 6,400 | 3,400 | 2,200 | 81 | Dry storage, off kitchen |
| Side Yard (unenclosed) | 0 | 8,600 | 6,400 | 7,400 | 509 | Landscaping strip, no walls |
| Covered Front Porch (×2, exterior) | 6,400 / 11,200 | 0 | 2,400 each | 1,800 | 46 ea (92 total) | Flanks entry, roofed, open edge |
| Foyer | 8,800 | 0 | 2,400 | 1,800 | 46 | Entry |
| Kitchen | 6,400 | 1,800 | 3,600 | 5,200 | 201 | Cooking, island |
| Dining | 10,000 | 1,800 | 3,600 | 5,200 | 201 | Dining table, seats 6 |
| Living | 6,400 | 7,000 | 7,200 | 4,000 | 310 | Sectional + TV |
| Covered Patio (exterior) | 6,400 | 11,000 | 7,200 | 5,000 | 387 | Outdoor living, roofed |
| Hallway (wing C spine) | 13,600 | 0 | 1,100 | 11,200 | 133 | Bedroom-wing corridor |
| Office / Den | 14,700 | 0 | 6,300 | 3,000 | 203 | Home office |
| Bedroom 2 | 14,700 | 3,000 | 6,300 | 3,300 | 224 | Secondary bedroom (incl. reach-in closet nook, NW corner ~1,900×1,700) |
| Bath 2 (shared) | 14,700 | 6,300 | 6,300 | 1,600 | 108 | Hall bath serving Bed 2 & 3 |
| Bedroom 3 | 14,700 | 7,900 | 6,300 | 3,300 | 224 | Secondary bedroom (incl. reach-in closet nook, NW corner) |
| Primary Bedroom | 13,600 | 11,200 | 5,100 | 4,800 | 264 | Primary suite |
| Primary Bath | 18,700 | 11,200 | 2,300 | 2,600 | 64 | Ensuite (compact — shower, no separate tub) |
| Primary Walk-in Closet | 18,700 | 13,800 | 2,300 | 2,200 | 54 | WIC off primary bedroom |

**Conditioned total** (excludes garage, porch, patio, side yard): Laundry +
Pantry + Foyer + Kitchen + Dining + Living + Hall + Office + Bed2 + Bath2 +
Bed3 + PrimaryBed + PrimaryBath + PrimaryWIC ≈ **2,205 sq ft**.

### 2.4 Wall layout

**Exterior / structural perimeter** (kind `full`, 2,743 mm / 9 ft, unless
noted), given as ordered point lists (mm), walked clockwise from origin:

*Wing A (Garage/Utility) — simple rectangle, north side borders unenclosed side yard:*
```
(0,0) → (6400,0) → (6400,8600) → (0,8600) → (0,0)
```
(Side yard beyond y=8,600 up to y=16,000 is **unenclosed** — no walls, just
ground texture. Optional: a low `railing`-kind wall or fence line along
(0,8600)→(6400,8600)→(6400,16000)→(0,16000)→(0,8600) if you want the yard
visually bounded.)

*Wing B (Great Room) — notched front for the recessed porch:*
```
(6400,1800) → (8800,1800) → (8800,0) → (11200,0) → (11200,1800)
→ (13600,1800) → (13600,11000) → (6400,11000) → (6400,1800)
```
- `(8800,0)–(11200,0)` is the true exterior wall with the **main entry door**.
- `(6400,1800)–(8800,1800)` and `(11200,1800)–(13600,1800)` are the kitchen's
  and dining's exterior walls, facing the open (unwalled) porch below them.
- `(6400,0)–(6400,1800)` and `(13600,0)–(13600,1800)` need **no wall** — those
  segments are already the neighboring wings' real exterior walls (garage
  east wall and wing-C west wall respectively); the porch sits in the notch
  between them.
- Add a `railing`-kind wall along the open porch edges: `(6400,0)–(8800,0)`
  and `(11200,0)–(13600,0)`, and along the patio edge `(6400,16000)–
  (13600,16000)`.
- `(13600,11000)–(6400,11000)` is the **living room back wall** — mostly
  glass (see openings below).

*Wing C (Bedroom Wing) — plain rectangle:*
```
(13600,0) → (21000,0) → (21000,16000) → (13600,16000) → (13600,0)
```

**Interior partition walls** (kind `full`, 2,743 mm unless noted):
- `(3000,6400)–(3000,8600)` — laundry / pantry divider (open doorway, no door
  leaf, ~900 mm gap).
- `(14700,0)–(14700,11200)` — hallway east wall / bedroom-wing rooms' west
  wall (the corridor spine). Door openings punched through at:
  - `(14700, 1500)` → Office (900 mm)
  - `(14700, 4700)` → Bedroom 2 (900 mm, offset south of its NW closet nook)
  - `(14700, 7100)` → Bath 2 (900 mm)
  - `(14700, 9500)` → Bedroom 3 (900 mm)
- Light partitions closing off each bedroom's NW reach-in closet nook, at
  `x=16,600` (i.e. `14700+1900`): `(16600,3000)–(16600,4700)` for Bedroom 2
  and `(16600,7900)–(16600,9600)` for Bedroom 3 (optional — can also be a
  simple built-in wardrobe with no wall).
- `(18700,11200)–(18700,16000)` — primary bedroom / bath+WIC divider.
- `(18700,13800)–(21000,13800)` — primary bath / WIC divider.
- `(13600, 8500)` — doorway (900 mm) through the wing B/C shared wall,
  connecting **Living** directly to the **hallway** spine.

### 2.5 Doors & windows

| Opening | Wall / location | Width | Kind | Notes |
|---|---|---|---|---|
| Garage door 1 | Front wall, centered x≈1,700 | 2,400 mm | `garage` | |
| Garage door 2 | Front wall, centered x≈4,700 | 2,400 mm | `garage` | |
| Garage man-door | `(3000,6400)` into Laundry | 900 mm | `swing` | Garage ↔ utility hall |
| Pantry-to-kitchen door | `(6400,7300)` | 900 mm | `swing` | Grocery flow pantry → kitchen |
| Main entry | `(8800–11200, 0)`, centered x=10,000 | 1,500 mm (double) | `swing` | Front door, faces porch |
| Kitchen porch window | Kitchen front wall, x≈7,600 | 1,800 mm | `single` | Faces porch |
| Dining porch window | Dining front wall, x≈12,400 | 1,800 mm | `single` | Faces porch |
| Living → patio doors | Back wall, x 8,500–11,500 | 3,000 mm (2× 1,500 mm swing, French-door style) | `swing` | Great room ↔ covered patio |
| Living side window | West wall, x=6,400, y≈9,000 | 1,500 mm | `picture` | Faces side yard |
| Living/hall connector | `(13600, 8500)` | 900 mm | `swing` | Great room ↔ bedroom-wing hall |
| Office window | East wall, x=21,000, y≈1,500 | 1,800 mm | `single` | |
| Bedroom 2 window | East wall, x=21,000, y≈4,500 | 1,500 mm | `double_hung` | |
| Bath 2 window | East wall, x=21,000, y≈7,000 | 900 mm | `single` (frosted, décor only) | |
| Bedroom 3 window | East wall, x=21,000, y≈9,200 | 1,500 mm | `double_hung` | |
| Primary bedroom window | Back (north) wall, x≈16,000, y=16,000 | 1,800 mm | `picture` | Faces back yard |
| Primary bedroom side window | West wall, x=13,600, y≈13,000 | 1,200 mm | `double_hung` | Optional, faces patio side |
| Primary bath window | East wall, x=21,000, y≈12,500 | 900 mm | `casement_pair` (frosted) | |
| Hall bedroom doors | See §2.4 partition list | 900 mm each | `swing` | |
| Primary suite door | `(14200,11200)` off hall terminus | 900 mm | `swing` | |
| Primary bath door | `(18700,12000)` off primary bedroom | 800 mm | `swing` | |
| Primary WIC door | `(18700,13900)` off primary bedroom | 800 mm | `swing` | |

**Staircase**: none — single story.

---

## 3. Furnishing per room

Positions are approximate centers `(x, y)` in mm, `rotation` in degrees
(convention assumed: 0° = piece's default/front-facing orientation as placed
by `FURNITURE_KINDS` defaults, i.e. back/headboard toward local +Z = world
+Y; 180° flips it to back-toward −Y; 90°/270° face east/west). **Verify
visually after placing** — flip 180° if a piece renders facing the wrong way.

### Garage
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Storage shelving (`bookshelf`) | (1,200, 6,100) | 180° | Along back wall |
| Storage shelving (`bookshelf`) | (5,200, 6,100) | 180° | Along back wall |

### Laundry
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Washer | (900, 8,300) | 180° | Against north wall |
| Dryer | (2,100, 8,300) | 180° | Against north wall |
| Sink | (1,500, 6,700) | 0° | Utility sink |

### Walk-in Pantry
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Shelving (`bookshelf`) | (3,700, 6,700) | 90° | Along west wall |
| Shelving (`bookshelf`) | (5,700, 6,700) | 90° | Along east wall |

### Foyer
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Entry bench | (10,000, 1,600) | 180° | Against front wall, beside door |

### Kitchen
| Furniture / appliance | Position | Rotation | Notes |
|---|---|---|---|
| Counter run | (6,700, 3,000) | 90° | Along west wall, y 1,800–5,000 |
| Fridge | (6,700, 2,100) | 90° | Near pantry doorway |
| Stove | (6,700, 4,300) | 90° | Along west wall |
| Microwave | (6,700, 4,300) | 90° | Mounted above stove (`mountable`) |
| Dishwasher | (8,600, 1,950) | 0° | Beside sink, island end |
| Island (`island`) | (8,200, 4,200) | 0° | 2,400 × 1,100 mm, seats 3 |
| Sink | (8,200, 3,800) | 0° | Mounted on island |

### Dining
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Dining table | (11,800, 4,400) | 0° | 1,800 × 1,000 mm |
| Dining chairs ×6 | ringed around table | — | 2 long sides ×2, ends ×1 each |

### Living
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Sectional sofa | (9,500, 9,200) | 90° | Opens toward TV wall (east) |
| Coffee table | (10,600, 9,200) | 0° | Between sofa and TV |
| TV | (13,200, 8,500) | 270° | East wall (shared w/ hallway) |
| TV stand | (13,200, 8,500) | 270° | Under TV |
| Area rug | (9,800, 9,000) | 0° | 3,600 × 2,400 mm, under sofa/table |
| Accent chair | (7,200, 10,200) | 180° | Near patio doors, reading nook |

### Hallway (wing C)
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Console table (optional) | (14,150, 5,500) | 90° | Slim console against hall wall |

### Office / Den
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Desk | (19,500, 800) | 180° | Facing into room |
| Desk chair | (19,500, 1,200) | 0° | |
| Bookshelf | (20,700, 2,600) | 270° | East wall |

### Bedroom 2
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Bed (queen) | (18,200, 6,000) | 0° | Headboard on east exterior wall |
| Nightstand | (16,900, 6,000) | 0° | |
| Nightstand | (19,500, 6,000) | 0° | |
| Dresser | (15,400, 3,300) | 90° | Near closet nook |
| Wardrobe (closet nook) | (15,400, 4,600) | 90° | NW corner reach-in |

### Bath 2 (shared)
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Toilet | (15,200, 6,700) | 90° | |
| Vanity / sink (double) | (16,800, 7,700) | 180° | Along long north wall |
| Tub/shower combo | (19,800, 6,900) | 270° | East end, near window |

### Bedroom 3
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Bed (queen) | (18,200, 10,200) | 0° | Headboard on east exterior wall |
| Nightstand | (16,900, 10,200) | 0° | |
| Nightstand | (19,500, 10,200) | 0° | |
| Desk | (15,400, 8,200) | 90° | Near closet nook, kid/study room feel |
| Wardrobe (closet nook) | (15,400, 10,900) | 90° | NW corner reach-in |

### Primary Bedroom
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Bed (king) | (16,150, 15,200) | 180° | Headboard on back (north) exterior wall |
| Nightstand | (14,700, 15,200) | 180° | |
| Nightstand | (17,600, 15,200) | 180° | |
| Dresser | (14,100, 12,500) | 90° | West wall |
| Accent chair | (17,900, 12,200) | 270° | Reading corner |

### Primary Bath
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Double vanity / sink | (18,950, 11,500) | 180° | |
| Toilet | (18,950, 13,500) | 90° | |
| Walk-in shower | (20,500, 12,600) | 270° | Compact ensuite — no separate tub |

### Primary Walk-in Closet
| Furniture | Position | Rotation | Notes |
|---|---|---|---|
| Wardrobe / built-ins | (19,000, 14,000) | 0° | Along west wall |
| Wardrobe / built-ins | (20,700, 15,600) | 270° | Along north wall |

---

## 4. Skinning / appearance

| Zone | Floor material (`floorTex`) | Floor color (hex) | Wall color (hex) |
|---|---|---|---|
| Garage | `concrete` | `#B8B4AC` | `#E9E4D8` |
| Laundry / Pantry | `tile` | `#DDD7CC` | `#E9E4D8` |
| Foyer / Kitchen / Dining / Living (great room) | `wood` | `#C9B79C` (light European white oak) | `#E9E4D8` |
| Hallway (wing C) | `wood` | `#C9B79C` (matches great room flow) | `#E9E4D8` |
| Office / Den | `wood` | `#C9B79C` | `#E9E4D8` |
| Bedroom 2 / Bedroom 3 / Primary Bedroom | `none` (carpet look, see note) | `#DCD5C8` (warm greige) | `#E9E4D8` |
| Bath 2 / Primary Bath | `tile` | `#E5E1D8` (soft neutral) | `#E9E4D8` |
| Primary WIC | `none` (carpet look, see note) | `#DCD5C8` | `#E9E4D8` |
| Covered Patio | `concrete` | `#C4BEB2` | — (open air) |

Diorama's built-in `floorTex` enum is `none | wood | tile | concrete`
(procedural, cached per `_texCache`). There is no dedicated `carpet` texture
— use `none` with `floorColor` set to a soft warm greige (`#DCD5C8`) for
bedrooms/WIC to approximate carpet, or extend `_texCache` with a carpet
variant if a fuzzier look is wanted.

**Global `Scene3D`**: `wallColor: #E9E4D8` house-wide (one wall color per
floor in Diorama — no native per-room override beyond the per-floor
`look3d`). Suggested lighting preset: `day` for daytime walkthroughs,
`dusk`/`night` to show off the great-room pendant + recessed lighting.
An accent (e.g. a charcoal `#3A3A3C`) media wall behind the Living TV can be
faked with a `custom object` recipe (a thin box primitive tinted dark)
layered over the wall if a two-tone wall look is wanted.

---

## 5. Reconstruction notes

- **Room-name conventions**: name the Room entries `Kitchen`, `Dining`,
  `Living` (or a single `Great Room` anchor covering all three, since they
  share one open volume and one wall loop) — a name containing `kitchen`
  (case-insensitive) is required to gate Diorama's snack/coffee thought-bubble
  behaviors, so keep at least one room named with that substring even if you
  merge kitchen/dining/living into a single `Room` anchor.
- **Wall loops / floor patches**: the great room (Wing B) is one continuous
  closed loop (Foyer + Kitchen + Dining + Living all share the same
  perimeter with no interior walls between them) — this becomes a single
  floor patch in the 3D clipped-floor system. Wing A and Wing C are each
  their own closed loops. The unenclosed side yard and the porch/patio
  (railing-only edges) do **not** close a loop on their own — that's
  intentional (they render as the classic full-rectangle fallback / open
  ground plane in that region, not a separate clipped patch).
- **Scale sanity check**: conditioned room areas sum to **≈2,205 sq ft**
  (Laundry 71 + Pantry 81 + Foyer 46 + Kitchen 201 + Dining 201 + Living 310
  + Hall 133 + Office 203 + Bed2 224 + Bath2 108 + Bed3 224 + PrimaryBed 264
  + PrimaryBath 64 + PrimaryWIC 54 = 2,205) against a ~2,000 sq ft brief —
  about 10% generous, driven mainly by the office (203 sq ft) and the two
  secondary bedrooms (224 sq ft each, larger than the ~3,000–3,700 mm /
  10–12 ft "typical" secondary bedroom footprint cited in the brief because
  each also swallows its own closet nook). To hit exactly 2,000 sq ft, trim
  Office depth 3,000→2,400 mm (−57 sq ft) and shave ~600 mm off each
  secondary bedroom's depth (−2×43 sq ft), which nets ≈2,060 sq ft; further
  trim the Primary Bedroom by ~400 mm depth to land at ≈1,995 sq ft.
  Garage (441 sq ft) + covered patio (387 sq ft) + porch (92 sq ft) + side
  yard (509 sq ft) are correctly excluded from the "2,000 sq ft" living-area
  figure (matches standard real-estate sq-ft convention).
- **Door hinge / span-center convention**: per Diorama's `Door` model, a
  door's stored `(x, y)` is its **hinge**, not its span center — when
  placing, offset from the wall-opening center given above by half the
  door's width toward whichever side you want the hinge (hinge on the side
  nearer an adjacent wall/corner reads most natural).
- **Sensor / light suggestions**:
  - One **mmWave (LD2450)** sensor ceiling-mounted at the great room's
    center (≈ x=10,000, y=6,000, height ~2,700 mm), heading south, to cover
    kitchen + dining + living in one shot.
  - **Motion sensors** in: the wing-C hallway (covers all 3 bedroom-wing
    doors from one spot), the primary suite, garage.
  - **Lights**: pendant fixtures over the kitchen island and dining table
    (`LightIconKind: pendant`), recessed `bulb` kind in kitchen/living/
    bedrooms, `sconce` kind flanking the primary bathroom vanity mirror,
    a `flood`-kind fixture over each garage door and the patio.
  - **Switches**: one `switch` fixture wall-mounted just inside each room's
    primary entry door (foyer, kitchen, living, each bedroom, office),
    following Diorama's auto wall-snap/gang behavior.
- **Furniture kind reference**: all appliance/furniture kinds referenced
  above (`island`, `bookshelf`, `wardrobe`, etc.) already exist in
  `FURNITURE_KINDS` (`geometry.ts`) — no custom objects required to build
  this house, though the media-wall accent mentioned in §4 is a nice-to-have
  custom object, not a requirement.
- **Weld tolerance**: several wall segments listed above meet at shared
  corners (e.g. the wing A/B boundary at x=6,400, wing B/C boundary at
  x=13,600) — Diorama's `connectWallEnds` weld (250 mm tolerance) plus
  nearest-node clustering (25 mm, for closed-loop detection) should stitch
  these automatically as long as endpoints are placed within a few mm of the
  coordinates given; don't rely on exact floating-point equality.
