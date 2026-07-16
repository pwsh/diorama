# Demo House: Small 2-Bed Bungalow

Reconstruction-ready build spec for a Diorama demo floor plan. All coordinates
are **millimeters**, world frame **+X right / +Y up** (matches Diorama's
`geometry.ts` convention). Floor origin `(0,0)` is the **front-left / street
side** corner; **`y=0` is the front (street) wall**, **`y=9500` is the back
(yard) wall**, **`x=0` is the west/left wall**, **`x=9750` is the east/right
wall**. Wall centerlines are given; assume the engine's standard **100 mm**
wall thickness (`WALL_HALF = 50`) unless noted. All room rectangles below
**tile the floor exactly with zero gaps or overlaps** (verified computationally)
— every mm of the 9750×9500 slab is accounted for by a room, hallway, or
closet.

---

## 1. Overview

- **Style**: 1940s-era American "minimal traditional" / Craftsman-influenced
  bungalow — modest, single-story, gable-roofed cottage. Warm wood floors,
  cream walls, a compact efficient kitchen, one full bath, two bedrooms, and
  a small covered front porch. The feel is cozy and lived-in rather than
  open-concept-modern: rooms are human-scaled and mostly closed off from one
  another (typical of the era), with a single central hallway serving the
  private wing.
- **Total floor area**: **997 sq ft (92.6 m²)** gross / enclosed, single
  story, no garage, no basement. (A ~95 sq ft covered front porch sits
  outside the modeled floor rectangle — see §5.)
- **Floors**: 1
- **Overall footprint**: **9750 mm (32′-0″) wide × 9500 mm (31′-2″) deep**
- **Feel**: A tidy "starter home" cottage — narrow street-facing gable end
  with a centered covered porch and two flanking windows, warm honey-oak
  floors throughout the living spaces, cream plaster-look walls, a small
  efficient galley-style kitchen with a windowed sink, a cozy interior
  breakfast nook borrowing light from the kitchen, and a private bedroom
  wing at the back reached by one central hallway — the kind of place a
  single family or couple would have bought new in 1948.

---

## 2. Floor 1 (the only floor)

### 2.1 Floor rectangle

`w = 9750 mm`, `d = 9500 mm` (origin at the south-west/front-left corner).

### 2.2 ASCII sketch (plan view, north/back at top, front door at bottom; not to exact scale — see room table for real mm)

```
+-------------+------------+--------+---------------+-----------+---------+
|             |            |        |               |           |         |
|   Primary   |            |        |               | Bedroom 2 | Storage |
|   Closet    |Linen Closet|        |               |  Closet   | Closet  |
|             |            |        |               |           |         |
|             |            |        |               |           |         |
+-------------+------------+        |Utility/Storage+-----------+---------+
|                          |        |               |                     |
|                          |        |               |                     |
|                          |        |               |                     |
|                          |Hallway |               |                     |
|                          |        +---------------+                     |
|                          |        |               |                     |
|     Primary Bedroom      |        |               |      Bedroom 2      |
|                          |        |               |                     |
|                          |        |               |                     |
|                          |        |   Bathroom    |                     |
|                          |        |               |                     |
|                          |        |               |                     |
|                          |        |               |                     |
+--------------------------+--------+------+--------+------------+--------+
|                                          |                     |        |
|                                          |                     |        |
|                                          |     Dining Nook     |Mudroom |
|                                          |                     | Laundry|
|                                          |                     |        |
|                                          +---------------------+--------+
|                                          |                              |
|               Living Room                |                              |
|                                          |                              |
|                                          |                              |
|                                          |           Kitchen            |
|                                          |                              |
|                                          |                              |
|                                          |                              |
|                                          |                              |
+------------------------------------------+------------------------------+
                    [ front door ]
        ~~~~~~~~~~~ covered porch (outside floor rect) ~~~~~~~~~~~
                      (street / front yard)
```

### 2.3 Room table

All rectangles are `x, y` = **bottom-left corner** of the room in world mm,
`w × d` = width (x-extent) × depth (y-extent). Sum of all 13 rows below =
**997.0 sq ft**, exactly the floor's gross area (no unaccounted circulation —
the Hallway and the "Utility/Storage" alcove ARE the circulation).

| Room | x, y | w × d (mm) | sq ft | Purpose |
|---|---|---|---|---|
| Living Room | 0, 0 | 5700 × 4300 | 263.8 | Front door opens here; main seating/TV room, spans the full front-left of the house |
| Kitchen | 5700, 0 | 4050 × 2600 | 113.3 | Compact galley-style kitchen, street-facing window + east window over the sink |
| Dining Nook | 5700, 2600 | 2800 × 1700 | 51.2 | Small eat-in breakfast nook behind the kitchen, open to it — interior, borrows kitchen light |
| Mudroom / Laundry | 8500, 2600 | 1250 × 1700 | 22.9 | Back/side door, stacked or side-by-side washer+dryer, coat hooks |
| Primary Bedroom | 0, 4300 | 3600 × 3600 | 139.5 | Larger bedroom, west-facing windows, own closet |
| Primary Closet | 0, 7900 | 1800 × 1600 | 31.0 | Reach-in closet off the primary bedroom |
| Linen Closet | 1800, 7900 | 1800 × 1600 | 31.0 | Hall linen/storage closet, accessed from the Hallway |
| Hallway | 3600, 4300 | 1200 × 5200 | 67.2 | Central spine connecting Living Room to bedrooms/bath; widens into the Utility alcove at the back |
| Bathroom | 4800, 4300 | 2100 × 2400 | 54.3 | Single full bath, no exterior window (mechanical vent — period-accurate) |
| Utility / Storage | 4800, 6700 | 2100 × 2800 | 63.3 | Hallway-widening storage alcove with a small back window; doubles as the pass-through to Bedroom 2 |
| Bedroom 2 | 6900, 4300 | 2850 × 3600 | 110.4 | Second bedroom, east-facing windows |
| Bedroom 2 Closet | 6900, 7900 | 1500 × 1600 | 25.8 | Reach-in closet off Bedroom 2 |
| Storage Closet | 8400, 7900 | 1350 × 1600 | 23.3 | Extra storage closet, accessed from Bedroom 2 |
| **Total** | | | **997.0** | |

### 2.4 Wall layout

**Exterior perimeter** (one closed loop, wall kind `full`):
`(0,0) → (9750,0) → (9750,9500) → (0,9500) → (0,0)`

**Interior partition walls** (each a straight 2-point run, wall kind `full`,
centerline coordinates; door/window openings are cut into these runs per §2.5):

| ID | Points | Separates |
|---|---|---|
| P1 | (5700,0) → (5700,4300) | Living Room ↔ Kitchen/Nook/Mudroom block |
| P2 | (5700,2600) → (9750,2600) | Kitchen ↔ Dining Nook + Mudroom |
| P3 | (8500,2600) → (8500,4300) | Dining Nook ↔ Mudroom/Laundry |
| P4 | (0,4300) → (9750,4300) | Front rooms ↔ rear (bedroom/bath) zone |
| P5 | (3600,4300) → (3600,9500) | Primary Bedroom/closets ↔ Hallway |
| P6 | (4800,4300) → (4800,9500) | Hallway ↔ Bathroom/Utility block |
| P7 | (6900,4300) → (6900,9500) | Bathroom/Utility block ↔ Bedroom 2 block |
| P8 | (4800,6700) → (6900,6700) | Bathroom ↔ Utility/Storage |
| P9 | (0,7900) → (3600,7900) | Primary Bedroom ↔ (Primary Closet + Linen Closet) |
| P10 | (1800,7900) → (1800,9500) | Primary Closet ↔ Linen Closet |
| P11 | (6900,7900) → (9750,7900) | Bedroom 2 ↔ (Bedroom 2 Closet + Storage Closet) |
| P12 | (8400,7900) → (8400,9500) | Bedroom 2 Closet ↔ Storage Closet |

### 2.5 Doors & windows

**Exterior doors** (900 mm, swing inward):

| Door | Wall | Hinge (x,y) | Notes |
|---|---|---|---|
| Front Door | South (y=0), Living Room | (2450, 0) | Under the covered porch; primary entry |
| Back/Side Door | East (x=9750), Mudroom | (9750, 3050) | Side-yard/driveway entry via the mudroom |

**Interior openings** (800 mm swing doors unless marked "open" = no door leaf):

| Opening | Wall | Position | Notes |
|---|---|---|---|
| Living Room ↔ Kitchen | P1 | y 900–2400 (1500 open) | Open pass-through, no door |
| Kitchen ↔ Dining Nook | P2 | x 5700–8100 (2400 open) | Open pass-through, no door |
| Dining Nook ↔ Mudroom | P3 | hinge (8500, 3200) | 800 mm door |
| Living Room ↔ Hallway | P4 | x 3600–4800 (1200 open) | Open hallway mouth, no door |
| Hallway ↔ Primary Bedroom | P5 | hinge (3600, 6600) | 800 mm door |
| Hallway ↔ Linen Closet | P5 | hinge (3600, 8700) | 800 mm door |
| Primary Bedroom ↔ Primary Closet | P9 | hinge (1400, 7900) | 800 mm door |
| Hallway ↔ Bathroom | P6 | hinge (4800, 5000) | 800 mm door |
| Hallway ↔ Utility/Storage | P6 | y 7300–8500 (1200 open) | Open alcove mouth, no door — this is the "hall widens here" pass-through |
| Utility/Storage ↔ Bedroom 2 | P7 | hinge (6900, 7300) | 800 mm door |
| Bedroom 2 ↔ Bedroom 2 Closet | P11 | hinge (7600, 7900) | 800 mm door |
| Bedroom 2 ↔ Storage Closet | P11 | hinge (9100, 7900) | 800 mm door |

**Windows** (`sill` / `height` in mm off the floor; all `kind: 'double_hung'`
except the two big living-room windows, which read nicer as `picture` or
`single`):

| Window | Wall | Span | Sill / Height | Notes |
|---|---|---|---|---|
| W1 | South (y=0), Living Room | x 900–1700 | 600 / 1400 | Left of the front door |
| W2 | South (y=0), Living Room | x 3900–4700 | 600 / 1400 | Right of the front door |
| W3 | West (x=0), Living Room | y 1600–2500 | 750 / 1200 | Side-yard light |
| W4 | South (y=0), Kitchen | x 6600–7400 | 900 / 900 | Small street-facing kitchen window |
| W5 | East (x=9750), Kitchen | y 900–1800 | 900 / 900 | Over the sink |
| W6 | West (x=0), Primary Bedroom | y 4900–5700 | 750 / 1200 | |
| W7 | West (x=0), Primary Bedroom | y 6500–7300 | 750 / 1200 | |
| W8 | East (x=9750), Bedroom 2 | y 5000–5800 | 750 / 1200 | |
| W9 | East (x=9750), Bedroom 2 | y 6600–7400 | 750 / 1200 | |
| W10 | North (y=9500), Utility/Storage | x 5200–6000 | 1200 / 900 | Small, high utility window |

Note: the Dining Nook and Bathroom have **no exterior windows** — both are
fully interior (period-accurate for a modest 1940s bungalow: the nook borrows
light from the open kitchen pass-through and a pendant fixture; the bath
relies on a mechanical exhaust fan, common before window-code requirements
tightened).

### 2.6 Staircase

**None** — single story, slab-on-grade or crawlspace construction (no
basement), no garage. There is nothing to align between floors.

---

## 3. Furnishing per room

Coordinates are the **furniture center point** in world mm; `rotation` is a
rough compass-style heading (0° = piece's front faces `+Y`/north/back-of-lot,
90° = faces `+X`/east, 180° = faces `−Y`/south/street, 270° = faces `−X`/west)
— treat these as a starting orientation and nudge visually once placed, since
exact facing depends on each `FurnitureKindDef`'s own front-axis convention.

### Living Room

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| sofa | 2600, 3100 | 90 | Faces east toward the TV wall; ~2200×900 mm |
| chair | 2600, 1800 | 270 | Upholstered armchair (oversize `w:800,h:800` instance override); angled into the seating group near window W3 |
| coffee_table | 3700, 3100 | 0 | Between sofa and TV |
| tv_stand | 5500, 3100 | 90 | Against the shared kitchen wall (P1), north of the pass-through |
| tv | 5500, 3150 | 90 | Mounted on/above the stand |
| bookshelf | 150, 700 | 90 | West wall, tucked in the corner away from W3 |
| rug | 2900, 2600 | 0 | Large area rug (~2600×2200) under the seating group |
| plant | 5400, 4100 | 0 | Corner accent near the hallway opening |

### Kitchen

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| kitchen_sink | 9450, 1350 | 0 | Under window W5 |
| dishwasher | 9450, 1900 | 0 | Adjacent to the sink |
| fridge | 9450, 2350 | 0 | Corner nearest the dining nook opening |
| stove | 7000, 300 | 180 | Against the south wall under window W4 |
| microwave | 7000, 320 | 180 | `mountable`, sits above the stove |
| counter | 9450, 700 | 0 | Base run between sink and the south wall |
| cabinet | 7800, 300 | 180 | Base cabinets along the south wall |

### Dining Nook

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| table | 7100, 3450 | 0 | Seats 4 (dining table) |
| bench | 6500, 3450 | 90 | Window/wall side of the table |
| chair | 7700, 3450 | 270 | |
| chair | 7100, 2950 | 0 | |
| rug | 7100, 3450 | 0 | Small accent rug (~2200×1600) under the table |

### Mudroom / Laundry

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| washer | 9100, 2900 | 0 | Against the east exterior wall |
| dryer | 9100, 3550 | 0 | Stacked or side-by-side with the washer |
| bench | 8700, 3700 | 90 | Small bench near the back door for shoes/coats |

### Primary Bedroom

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| bed | 1800, 6700 | 0 | Queen; headboard against the north/interior wall (shared with closets) |
| nightstand | 800, 7500 | 0 | |
| nightstand | 2800, 7500 | 0 | |
| dresser | 300, 5300 | 90 | Against the west exterior wall |
| chair | 3300, 5000 | 180 | Upholstered armchair (oversize `w:800,h:800` instance override); small reading corner near window W6 |

### Primary Closet

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| wardrobe | 900, 8700 | 0 | Stands in for fitted rod/shelving |

### Linen Closet

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| bookshelf | 2700, 8700 | 0 | Stands in for linen shelving |

### Bathroom

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| toilet | 5100, 4600 | 0 | Near the hallway-side wall |
| sink | 5000, 6400 | 180 | Vanity, back wall |
| bathtub | 6500, 5500 | 90 | Along the east wall (shared with Bedroom 2 block) |

### Utility / Storage

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| bookshelf | 6700, 7000 | 90 | Storage shelving, east side |
| bookshelf | 6700, 9200 | 90 | Storage shelving, east side, back corner |
| cabinet | 4950, 8200 | 270 | West side; keep the middle of the room clear — it's also the walk-through to Bedroom 2 |

### Bedroom 2

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| bed | 8325, 6900 | 0 | Full/double; headboard against the north/interior wall |
| nightstand | 7100, 6500 | 0 | |
| desk | 7150, 4600 | 180 | Near windows W8/W9 |
| dresser | 9500, 5200 | 270 | Against the east exterior wall |

### Bedroom 2 Closet

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| wardrobe | 7650, 8700 | 0 | Stands in for fitted rod/shelving |

### Storage Closet

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| bookshelf | 9075, 8700 | 0 | General storage shelving |

### Hallway

| Furniture (kind) | Position (x, y mm) | Rotation | Notes |
|---|---|---|---|
| bench | 4200, 8700 | 90 | Small hall bench near the Linen Closet door |

---

## 4. Skinning / appearance

Diorama's floor material (`floorTex` / `floorColor`) and `wallColor` are set
**per floor** (`Store.scene3d`, optionally overridden by this floor's
`Floor.look3d` — but since this house is a single floor, the per-floor
override and the global scene settings are effectively the same set of
values). There is **no native per-room floor material** in Diorama, so wet
rooms (kitchen, bath, mudroom, utility) are given their tile/concrete look
via oversized `rug` pieces sized to fill their footprints, laid directly on
top of the house-wide wood floor — a practical, fully-supported workaround.

**Whole-house base (`scene3d` / this floor's `look3d`):**

| Setting | Value | Notes |
|---|---|---|
| `floorTex` | `wood` | Warm honey-oak strip flooring throughout |
| `floorColor` | `#C89468` | Warm honey oak |
| `wallColor` | `#EFE6D8` | Warm cream/plaster |

**Per-room "tile-look" rug overlays** (kind `rug`, sized to ~90% of the room
footprint, centered in the room):

| Room | Rug size (mm) | Rug color (hex) | Reads as |
|---|---|---|---|
| Kitchen | 3850 × 2400, centered ~(7725, 1300) | `#E4DFD3` | Pale checker/vinyl tile |
| Mudroom / Laundry | 1050 × 1500, centered ~(9125, 3450) | `#A9A6A0` | Slate/utility tile |
| Bathroom | 1900 × 2200, centered ~(5850, 5500) | `#CFE3DD` | Pale seafoam mid-century bath tile |
| Utility / Storage | 1900 × 2600, centered ~(5850, 8100) | `#B9B7B0` | Bare concrete/utility floor |

Decorative (non-material-faking) rugs also listed in §3: Living Room seating
rug (warm neutral, pairs with the wood floor) and a small Dining Nook accent
rug (soft sage `#7C9473`).

**Wall color accents** (optional; since `wallColor` is floor-wide, treat
these as "if per-room wall tinting is ever added" notes rather than
something to configure now): Bathroom would read best in a soft mint/seafoam
(`#CFE0DD`) to match its tile-look rug; Kitchen in a slightly brighter warm
white (`#F5F0E6`). For now, both simply inherit the whole-house cream.

**Lighting mood**: use `scene3d.preset = 'day'` for the default demo view (a
bright, cheerful little house); `dusk` or `night` also read well given the
window layout (the two big living-room windows and the bedroom windows will
show warm interior glow against a darkening exterior).

---

## 5. Reconstruction notes

- **Room-name convention**: keep the literal room name **"Kitchen"** on that
  room — Diorama's activity/bubble system gates several behaviors on a room
  name containing the substring `kitchen` (case-insensitive). The other room
  names are free text and don't need to match anything.
- **Grid snap**: nearly every coordinate above is a multiple of 100 mm; a few
  closet widths (1250, 2850, 1350) fall on 50 mm half-steps — snap to
  whatever `GRID_MM` the panel uses and nudge by ≤50 mm, it won't visibly
  change the plan.
- **Front porch**: not part of the modeled `Floor.w × Floor.d` (Diorama's
  floor rectangle is the enclosed/conditioned slab only). If you want a
  modeled porch, the simplest approach is to enlarge `d` by ~1800 mm (to
  11300 mm total) and leave that new front strip's walls **out** (or use
  `invisible` wall kind) so it doesn't count as an enclosed room — center it
  on the front door: roughly `x 400–5300, y −1800–0` relative to the
  original origin, i.e. `x 400–5300, y 0–1800` in the new, taller coordinate
  frame with everything else's `y` shifted +1800. Simpler still: just leave
  the porch unmodeled and treat the front-door threshold as the transition —
  it doesn't affect any Diorama mechanics.
- **Circulation note (intentional, period-accurate)**: the Kitchen / Dining
  Nook / Mudroom block has no direct opening into the Hallway (P4's only
  opening is the hallway mouth at x 3600–4800, which sits under the Living
  Room). To reach the bathroom or either bedroom from the kitchen you walk
  back through the Living Room first — this indirect routing is authentic to
  real 1940s bungalows of this size (open-plan "flow" wasn't yet a design
  priority) and isn't a layout bug.
- **Sanity check**: room-table sum = **997.0 sq ft**, floor gross =
  **997.0 sq ft** — the plan tiles the slab exactly (walls have zero
  thickness in this simplified 2D accounting; real 100 mm partition walls
  will eat a few percent of that into non-livable wall footprint once built,
  which is normal and doesn't require adjusting the room table).
- **Suggested sensors/lights for the demo** (all optional, illustrative of
  Diorama's fixture types):
  - **mmWave (LD2450) sensor** in the Living Room, mounted ~2000 mm high in
    the north-east corner (near the hallway opening), heading pointed
    south-west to cover the seating group — good default for demoing
    occupancy/avatar tracking.
  - **Motion sensor** in the Hallway (covers the spine to all bedrooms/bath)
    and one in the Mudroom (back-door activity).
  - **Env sensor** (temperature/humidity, `kind: generic`/`temperature`) in
    the Kitchen.
  - **Light fixtures**: `bulb` (ceiling) in every room; `pendant` over the
    Dining Nook table; `sconce` over the bathroom vanity; `flood`-kind
    fixture optional over the back door.
  - **Switches**: one at each room entrance for its ceiling light — Living
    Room (by the front door), Kitchen (by the pass-through), each bedroom
    (by its hallway door), Bathroom (by its door).
  - **Alarm keypad**: reasonable spot is just inside the front door on the
    Living Room's south wall, next to W1.
- **Furniture kind availability**: all kinds referenced above (`sofa`,
  `chair`, `coffee_table`, `tv_stand`, `tv`, `bookshelf`, `rug`, `plant`,
  `kitchen_sink`, `sink`, `dishwasher`, `fridge`, `stove`, `microwave`,
  `counter`, `cabinet`, `table`, `bench`, `washer`, `dryer`, `bed`,
  `nightstand`, `dresser`, `wardrobe`, `toilet`, `bathtub`, `desk`) are
  standard `FurnitureKind`s already in `FURNITURE_KINDS` (`geometry.ts`) — no
  new kinds need to be added to reconstruct this house. Two naming notes:
  there is no separate `armchair` kind, so the two lounge chairs (Living
  Room, Primary Bedroom) use `chair` with an oversized per-instance `w`/`h`
  override to read as upholstered armchairs; and `kitchen_sink` (kitchen,
  `cat: 'appliance'`) is distinct from `sink` (bathroom vanity, `cat:
  'bathroom'`) — the Bathroom section correctly uses `sink`, the Kitchen
  section uses `kitchen_sink`.
