# Demo House: "Maple Grove" 3-Bed / 2-Bath Ranch

A reconstruction-ready build spec for a single-story ranch demo house, sized
and detailed to be rebuilt directly in Diorama (floors → walls → rooms →
furniture → fixtures). All coordinates are **millimeters (mm)**, world frame
**+X = right, +Y = up** (screen-up in Diorama's 2D/3D views), floor origin
**(0,0) = bottom-left corner of the floor rectangle**. Rotations follow
Diorama's local-front convention: an item's front points toward **−Y at 0°**,
**+X at 90°**, **+Y at 180°**, **−X at 270°** (front = the functional face:
seat opening, screen, appliance door, headboard is the opposite/back side).

---

## 1. Overview

**Style**: Classic 1978-built American single-story ranch, lightly updated —
an open kitchen/dining/family "great room" grafted onto an otherwise
traditional center-hall bedroom wing. Low-slung, warm, unpretentious: think
oak-look vinyl plank in the living spaces, soft carpet tone in the bedrooms
(simulated with area rugs — see §4), warm greige walls, a brick-and-siding
exterior (not modeled — Diorama has no exterior skin). The garage reads as a
plain, slightly cluttered two-car box with a workbench and storage shelving.

- **Floors**: 1 (no staircase — single story, slab-on-grade)
- **Heated living area**: **≈1,720 sq ft (160 m²)**
- **Garage**: 400 sq ft (37 m²), unheated, attached
- **Footprint per floor (bounding rect, house + garage)**: **22,100 mm × 10,000 mm** (72′-6″ × 32′-10″)
  - House block: 16,000 × 10,000 mm (52′-6″ × 32′-10″)
  - Garage block: 6,100 × 6,100 mm (20′-0″ × 20′-0″), attached flush to the
    house's east wall, flush with the front (street) face
  - The 6,100 × 3,900 mm notch behind the garage (east of the house, south of
    the garage) is **unbuilt side yard** — no wall loop encloses it, so it
    renders as bare ground, not floor slab (this is the intended Diorama
    behavor for L-shaped footprints: only closed wall loops get a floor patch)

Room areas are called out per-room below and sum to the stated heated square
footage (§5 has the arithmetic check).

---

## 2. Floor 1 (only floor)

### 2.1 Floor rectangle

`Floor.w = 22100`, `Floor.d = 10000` (mm). This bounding rectangle covers
both the house and the attached garage; the unbuilt notch described above is
simply outside every closed wall loop.

### 2.2 ASCII sketch

Drawn with **y = 10000 (rear / backyard) at the top** and **y = 0 (front
door / street) at the bottom** — matching Diorama's own screen-up world
convention (`+Y` renders toward the top of the canvas), so coordinates below
map directly onto what you'd see in the app. `x = 0` (west) is on the left.

```
y=10000 (REAR / BACKYARD)  — top = world +Y
BBBBBBBBWWWWWhhhhOOOOOOOOOOOOOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
BBBBBBBBWWWWWhhhhOOOOOOOOOOOOOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
BBBBBBBBWWWWWhhhhOOOOOOOOOOOOOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
MMMMMMMMMMMMMhhhhOOOOOOOOOOOOOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
MMMMMMMMMMMMMhhhhHHHHHHHHHHHHHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
MMMMMMMMMMMMMhhhhHHHHHHHHHHHHHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
MMMMMMMMMMMMMhhhhHHHHHHHHHHHHHKKKKKKKKKKKKKDDDDDDDDDDDDUUUUUUU
MMMMMMMMMMMMMhhhhHHHHHHHHHHHHHKKKKKKKKKKKKKDDDDDDDDDDDDUUUUUUU
MMMMMMMMMMMMMhhhhHHHHHHHHHHHHHKKKKKKKKKKKKKDDDDDDDDDDDDUUUUUUUGGGGGGGGGGGGGGGGGGGGGGG
MMMMMMMMMMMMMhhhh3333333333333KKKKKKKKKKKKKDDDDDDDDDDDDUUUUUUUGGGGGGGGGGGGGGGGGGGGGGG
MMMMMMMMMMMMMhhhh3333333333333KKKKKKKKKKKKKDDDDDDDDDDDDUUUUUUUGGGGGGGGGGGGGGGGGGGGGGG
MMMMMMMMMMMMMhhhh3333333333333KKKKKKKKKKKKKDDDDDDDDDDDDUUUUUUUGGGGGGGGGGGGGGGGGGGGGGG
2222222222222hhhh3333333333333LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGG
2222222222222hhhh3333333333333LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGG
2222222222222hhhh3333333333333LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGG
2222222222222hhhh3333333333333LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGG
2222222222222FFFFFFFFFFFFFFFFFLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGG
2222222222222FFFFFFFFFFFFFFFFFLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGG
2222222222222FFFFFFFFFFFFFFFFFLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGG
2222222222222FFFFFFFFFFFFFFFFFLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGG
y=0 (FRONT DOOR / STREET)  — bottom
x=0 (west) ─────────────────────────────────────────────────────────────► x=22100 (east / garage)
```

Legend: `2`=Bedroom 2, `3`=Bedroom 3, `F`=Foyer, `L`=Living Room, `h`=hallway/
corridor, `M`=Primary Bedroom, `H`=Hall Bath, `K`=Kitchen, `D`=Dining,
`U`=Laundry/Mudroom, `B`=Primary Bath, `W`=Primary Walk-in Closet,
`O`=Office Nook, `A`=Family Room, `G`=Garage. Blank = unbuilt side yard.

### 2.3 Room table

| Room | Rect (x, y, w, d mm) | Area | Purpose |
|---|---|---|---|
| Bedroom 2 | (0, 0, 3400, 3800) | 139 sq ft | Secondary bedroom, front-left |
| Foyer | (3400, 0, 4500, 1900) | 92 sq ft | Front entry hub — open to Living Room, feeds the hallway |
| Bedroom 3 | (4500, 1900, 3400, 3800) | 139 sq ft | Secondary bedroom |
| Living Room | (7900, 0, 8100, 3800) | 331 sq ft | Front-facing main living space |
| Hallway / Corridor | (3400, 1900, 1100, 8100) | 96 sq ft | Spine connecting Foyer to bedroom wing (circulation, not a "room") |
| Primary Bedroom | (0, 3800, 3400, 4500) | 165 sq ft | Primary suite bedroom |
| Hall Bath | (4500, 5700, 3400, 2500) | 91 sq ft | Shared secondary bath |
| Kitchen | (7900, 3800, 3400, 3200) | 117 sq ft | Open to Dining + Family Room |
| Dining | (11300, 3800, 3000, 3200) | 103 sq ft | Open to Kitchen |
| Laundry / Mudroom | (14300, 3800, 1700, 3200) | 59 sq ft | Between Dining and the garage; has the garage service door |
| Primary Bath | (0, 8300, 2000, 1700) | 37 sq ft | En-suite off Primary Bedroom |
| Primary Walk-in Closet | (2000, 8300, 1400, 1700) | 26 sq ft | En-suite off Primary Bedroom |
| Office Nook | (4500, 8200, 3400, 1800) | 66 sq ft | Small flex/study off the hallway |
| Family Room | (7900, 7000, 8100, 3000) | 262 sq ft | Rear great-room space, open to Kitchen |
| Garage | (16000, 0, 6100, 6100) | 400 sq ft (unheated) | 2-car attached garage |

Heated total (all rows except Garage, including the Hallway's circulation
square footage which is ordinarily counted as heated interior space):
**≈1,720 sq ft**. See §5 for the sum check.

### 2.4 Wall layout

Wall thickness is uniform at **100 mm** throughout (matches Diorama's
`WALL_HALF = 50`), even though real ranch exteriors are usually thicker —
a deliberate simplification consistent with how the app models walls (one
thickness for every wall, no separate exterior/interior wall types).

**Exterior perimeter, house block** (closed loop, `kind: full`):
```
(0, 0) → (16000, 0) → (16000, 10000) → (0, 10000) → (0, 0)
```

**Exterior perimeter, garage** (closed loop, `kind: full`; shares its west
edge with the house's east wall — that segment is intentionally coincident,
representing the shared party wall):
```
(16000, 0) → (22100, 0) → (22100, 6100) → (16000, 6100) → (16000, 0)
```

**Interior partition walls** (each a 2-point segment, `kind: full` unless noted):

| # | Points (mm) | Separates |
|---|---|---|
| 1 | (7900, 1900) → (7900, 10000) | Bedroom wing ↔ Living/Kitchen/Dining/Family wing (note: starts at y=1900, **not** y=0 — the Foyer↔Living-Room threshold at y:0–1900 is left fully open, no wall, open-concept entry) |
| 2 | (3400, 1900) → (3400, 10000) | Bedroom 2 / Primary Bedroom ↔ Corridor |
| 3 | (4500, 1900) → (4500, 10000) | Corridor ↔ Bedroom 3 / Hall Bath / Office Nook |
| 4 | (0, 3800) → (3400, 3800) | Bedroom 2 ↔ Primary Bedroom |
| 5 | (0, 8300) → (3400, 8300) | Primary Bedroom ↔ Primary Bath + WIC |
| 6 | (2000, 8300) → (2000, 10000) | Primary Bath ↔ Primary Walk-in Closet |
| 7 | (3400, 0) → (3400, 1900) | Bedroom 2 ↔ Foyer |
| 8 | (4500, 1900) → (7900, 1900) | Foyer ↔ Bedroom 3 |
| 9 | (4500, 5700) → (7900, 5700) | Bedroom 3 ↔ Hall Bath |
| 10 | (4500, 8200) → (7900, 8200) | Hall Bath ↔ Office Nook |
| 11 | (7900, 3800) → (16000, 3800) | Living Room ↔ Kitchen/Dining/Laundry band |
| 12 | (14300, 3800) → (14300, 7000) | Dining ↔ Laundry |
| 13 | (11300, 7000) → (16000, 7000) | Dining + Laundry ↔ Family Room |
| 14 | (16000, 0) → (16000, 6100) | House ↔ Garage (coincident with the garage's own west wall above) |

**Intentionally NOT walled** (open-concept pass-throughs — leave these gaps
in the wall list; they're the "great room" openness):
- (7900, 7000) → (11300, 7000): Kitchen ↔ Family Room
- (11300, 3800) → (11300, 7000): Kitchen ↔ Dining
- (7900, 0) → (7900, 1900): Foyer ↔ Living Room

No staircase — single story on a slab.

### 2.5 Doors & windows

Door widths: exterior/front 900 mm, garage vehicle bays 2400 mm each
(`Door.kind: 'garage'`), interior bedroom/office doors 800–900 mm, bathroom
doors 700 mm, per the standard-dimensions research (interior doors 30–32″ ≈
760–810 mm, bath doors ~28″ ≈ 710 mm).

| Door | Wall | Position (mm) | Width | Notes |
|---|---|---|---|---|
| Front Door | (x, 0) exterior | x ≈ 5650 | 900 | Opens into Foyer |
| Bedroom 2 | x=3400 (wall #7) | y ≈ 900–1800 | 900 | Off the Foyer |
| Bedroom 3 | x=4500 (wall #3) | y ≈ 2600–3500 | 900 | Off the Corridor |
| Primary Bedroom | x=3400 (wall #2) | y ≈ 4200–5100 | 900 | Off the Corridor |
| Primary Bath | y=8300 (wall #5) | x ≈ 900–1600 | 700 | Off Primary Bedroom (en-suite) |
| Primary WIC | y=8300 (wall #5) | x ≈ 2600–3300 | 700 | Off Primary Bedroom |
| Hall Bath | x=4500 (wall #3) | y ≈ 6500–7200 | 700 | Off the Corridor |
| Office Nook | x=4500 (wall #3) | y ≈ 8700–9600 | 900 | Off the Corridor |
| Living Room ↔ Kitchen | y=3800 (wall #11) | x ≈ 9200–10100 | 900 | Great-room circulation |
| Laundry | x=14300 (wall #12) | y ≈ 5000–5800 | 800 | |
| Dining ↔ Family Room | y=7000 (wall #13) | x ≈ 12500–13400 | 900 | |
| Garage ↔ Laundry | x=16000 (wall #14) | y ≈ 4950–5850 | 900 | `lockEntity`-suitable interior/exterior threshold |
| Garage vehicle bay 1 | (x, 0) garage exterior | x: 16700–19100 | 2400 | `kind: 'garage'` |
| Garage vehicle bay 2 | (x, 0) garage exterior | x: 19400–21800 | 2400 | `kind: 'garage'` |
| Garage side man-door | (x, 6100) garage exterior | x ≈ 18550–19450 | 900 | To the side/back yard |

| Window | Wall | Position (mm) | Sill / Height | Kind |
|---|---|---|---|---|
| Bedroom 2 front | (x, 0) | x: 900–2100 | 800 / 1200 | `single` |
| Foyer sidelight | (x, 0) | x: 4200–5000 | 900 / 1400 | `single` (narrow, flanks front door) |
| Living Room picture window | (x, 0) | x: 10800–13200 | 700 / 1500 | `picture` |
| Primary Bath (privacy) | (x, 10000) | x: 600–1400 | 1400 / 900 | `single`, frosted (cosmetic only — Diorama has no glass-opacity field, note in HA-side styling if desired) |
| Office Nook rear | (x, 10000) | x: 5700–6900 | 800 / 1200 | `single` |
| Family Room rear (x2) | (x, 10000) | x: 9500–10700, x: 13500–14700 | 800 / 1200 | `double_hung` |
| Bedroom 2 side | (0, y) | y: 1200–2400 | 800 / 1200 | `single` |
| Primary Bedroom side | (0, y) | y: 5200–6400 | 800 / 1200 | `single` |
| Family Room slider | (16000, y) — only the y:6100–7000/10000 portion that's genuinely exterior (past the garage's depth) | y: 7500–9300 | 0 / 2000 | `sliding` (patio slider to backyard) |
| Garage utility window | (22100, y) | y: 2500–3300 | 1200 / 900 | `single` |

Note on the Kitchen: because the garage occupies the full depth of the
house's east wall's front portion, and Kitchen/Dining sit in the mid-depth
band (bounded on all four sides by interior walls or the garage), **Kitchen
has no exterior wall** in this footprint — it borrows daylight through the
open pass-throughs to Family Room and Dining. This is realistic for
mid-depth ranch plans with an attached garage eating one whole flank; compen­
sate with strong ceiling + pendant lighting (see §5).

---

## 3. Furnishing per room

Rotation convention: 0° front faces −Y, 90° faces +X, 180° faces +Y, 270°
faces −X (see header). Positions are furniture-center world coordinates
(mm). `kind` names are Diorama `FurnitureKind`s.

### Living Room
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| sofa | (11950, 900) | 180° | Back to front wall, faces into room |
| armchair | (9200, 1500) | 90° | |
| armchair | (14700, 1500) | 270° | |
| coffee_table | (11950, 1900) | 0° | Between sofa and TV |
| tv_stand | (11950, 3550) | 0° | Against the Kitchen-side wall |
| tv | (11950, 3550) | 0° | On the stand (bind to a `media_player.*`) |
| bookshelf | (8100, 3200) | 90° | Against west wall |
| rug | (11950, 1900), 2400×1700 | 0° | Under coffee table |
| plant | (15700, 3500) | 0° | Corner accent |

### Foyer
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| bench | (4000, 300) | 180° | Entry bench |
| coffee_table (as console) | (5650, 300) | 180° | Doubles as an entry console |
| plant | (7500, 300) | 0° | |

### Bedroom 2
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| bed (queen, 1500×2000) | (1700, 1050) | 180° | Headboard to front wall |
| nightstand | (700, 700) | 180° | |
| nightstand | (2700, 700) | 180° | |
| dresser | (300, 2900) | 90° | Against west wall |
| bookshelf | (2900, 3400) | 270° | |
| rug | (1700, 2200), 1800×1400 | 0° | |

### Bedroom 3
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| bed (full, 1350×1900) | (6200, 2650) | 180° | Headboard to Foyer-side wall |
| nightstand | (5300, 2200) | 180° | |
| dresser | (7700, 4900) | 270° | Against east/corridor wall |
| desk | (5000, 5300) | 0° | Small student desk |
| rug | (6200, 3800), 1600×1300 | 0° | |

### Primary Bedroom
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| bed (king, 1900×2100) | (1700, 4950) | 180° | Headboard to front-side wall |
| nightstand | (600, 4300) | 180° | |
| nightstand | (2800, 4300) | 180° | |
| dresser | (300, 7300) | 90° | Against west wall |
| bench | (1700, 6100) | 180° | Foot-of-bed bench |
| tv | (2900, 4200) | 270° | Wall-mounted, faces the bed |
| rug | (1700, 6000), 2200×1800 | 0° | |
| plant | (3100, 8100) | 0° | Corner accent |

### Primary Bath
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| toilet | (400, 9700) | 180° | |
| sink | (300, 9000) | 90° | Vanity against west wall |
| shower | (1600, 9700), 900×900 | 180° | 3-piece bath |

### Primary Walk-in Closet
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| wardrobe | (2100, 9150) | 90° | Built-in run, west side |
| wardrobe | (3300, 9150) | 270° | Built-in run, east side |

### Hall Bath
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| toilet | (5000, 6000) | 90° | |
| sink | (7500, 6200) | 270° | Vanity |
| bathtub | (6200, 7900), 1700×750 | 180° | Tub/shower combo |

### Office Nook
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| desk | (6200, 9700) | 0° | Back to rear wall |
| chair | (6200, 9300) | 180° | Faces desk |
| bookshelf | (4700, 8900) | 90° | |

### Kitchen
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| counter | (8100, 4200) | 90° | Run along west wall |
| counter | (9200, 4000) | 180° | Run along north wall |
| stove | (9400, 4000) | 180° | In the north counter run |
| microwave | (8700, 4100) | 180° | Mountable, above/near stove |
| cabinet | (8100, 5200) | 90° | Upper storage |
| island | (9600, 5600) | 0° | Faces Family Room (open side) |
| sink | (9600, 5800) | 180° | In the island, overlooking Family Room |
| dishwasher | (9200, 5800) | 180° | Beside the sink |
| fridge | (8200, 6800) | 180° | Near the Family-Room-facing opening |

### Dining
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| dining_table | (12800, 5400) | 0° | |
| chair | (12800, 4700) | 0° | |
| chair | (12800, 6100) | 180° | |
| chair | (11900, 5100) | 90° | |
| chair | (11900, 5700) | 90° | |
| chair | (13700, 5100) | 270° | |
| chair | (13700, 5700) | 270° | |
| cabinet (as buffet) | (14100, 4200) | 270° | Against Laundry-side wall |
| rug | (12800, 5400), 2700×2100 | 0° | |
| plant | (11500, 6800) | 0° | |

### Laundry / Mudroom
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| washer | (14700, 4200) | 180° | |
| dryer | (15600, 4200) | 180° | |
| cabinet | (15150, 6700) | 0° | Storage |
| bench | (15150, 5500) | 90° | Mudroom bench near the garage door |

### Family Room
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| sectional | (9500, 9500) | 0° | Back to rear wall |
| tv_stand | (11000, 7200) | 180° | Against the Kitchen-side wall |
| tv | (11000, 7200) | 180° | On the stand |
| coffee_table | (9500, 8600) | 0° | |
| ottoman | (10200, 9200) | 0° | |
| bookshelf | (8100, 9700) | 90° | |
| exercise_equipment | (15200, 9500) | 270° | Corner, near the slider |
| rug | (9700, 8800), 3000×2200 | 0° | |
| plant | (15700, 7300) | 0° | |
| plant | (8100, 7300) | 90° | |

### Garage
| Item (kind) | Position (x,y) | Rotation | Notes |
|---|---|---|---|
| cabinet | (21600, 1000) | 270° | Storage against east wall |
| desk (as workbench) | (16400, 3000) | 90° | Against shared house wall |
| bookshelf (as shelving) | (21600, 5500) | 270° | Bike/bin shelving |

Optional yard dressing near the driveway/garage front (outdoor-cat kinds,
not counted in the room table since they sit outside any wall loop):
`trash_bin` and `recycle_bin` at roughly (17500, -600) and (18200, -600)
(just outside the garage's front wall, curbside), a `tree` or two flanking
the front walk near the Foyer window, and a `lawn_chair` pair on the
backyard side of the Family Room slider.

---

## 4. Skinning / appearance

Diorama's `Scene3D` floor/wall material fields (`floorTex`, `floorColor`,
`wallColor`) are **per-floor, not per-room** — there's only one `Floor.look3d`
for the whole slab. Since this house genuinely wants wood in the living
areas, tile in the wet rooms, and carpet in the bedrooms, the practical
approach (and the one this spec uses) is:

- **Floor-wide base** (`Store.scene3d` / this floor's `look3d`):
  - `floorTex: 'wood'` — warm oak, dominant across Living Room, Foyer,
    Corridor, Kitchen/Dining/Family great room
  - `floorColor: '#b8875a'` (warm oak)
  - `wallColor: '#e8e2d2'` (warm greige, reads well under both the `day`
    and `night` toon lighting presets)
- **Simulate carpet with rugs**: large-format `rug` furniture pieces
  (already placed in §3) in Bedroom 2, Bedroom 3, and the Primary Bedroom in
  soft carpet tones — `#cfc2a8` (warm taupe) for the secondary bedrooms,
  `#c9d1c4` (soft sage-grey) for the Primary Bedroom — nearly filling each
  room's floor area so the underlying wood tex barely peeks through at the
  edges.
- **Simulate tile with rugs/tone**: the wet rooms (Primary Bath, Hall Bath,
  Laundry) don't get a dedicated rug (tile look isn't critical to sell at
  this scale); if a tiled look matters more than the open-plan wood, switch
  the floor-wide `floorTex` to `'tile'` with `floorColor: '#d9d2c3'`
  (light travertine) and add oak-toned `rug`s to the living spaces instead —
  the two approaches are mirror images of the same per-floor limitation.
- **Garage**: same floor-wide texture applies (Diorama can't give it its own
  concrete texture without a second `Floor`, which would imply a second
  story). If a literal concrete garage floor matters more than the wood
  great-room look, set the floor-wide `floorTex: 'concrete'` /
  `floorColor: '#b0b0ac'` instead and rug every other room. This spec
  defaults to **wood-wide + rugs** since the great room is the visual
  centerpiece.
- **Wall color accents**: Diorama has no per-room wall color either — treat
  the `#e8e2d2` greige as the whole-house wall color. If per-room paint
  matters more than per-room flooring for a given demo, that's the field to
  override at floor level instead (it's an either/or with the floor texture
  since both ride the same `look3d`).
- **Lighting preset**: `scene3d.preset: 'day'` for a bright walkthrough
  demo, or `'dusk'`/`'night'` to show off the lamp/pendant/ceiling-light
  fixtures listed below with the toon lighting doing more work.

---

## 5. Reconstruction notes

**Square footage sanity check** (room table §2.3, excluding Garage):
139 + 92 + 139 + 331 + 96 + 165 + 91 + 117 + 103 + 59 + 37 + 26 + 66 + 262
= **1,723 sq ft** ≈ the stated ≈1,720 sq ft heated target. Garage adds 400
sq ft unheated (37 m²); under-roof total ≈2,120 sq ft.

**Room-name conventions**: name the `Room` entries exactly `"Kitchen"`,
`"Primary Bedroom"` (or include the substring `kitchen` — case-insensitive —
in whatever you call the great room, since Diorama's snack/coffee thought-
bubble and TV-watching logic key off a room name containing `"kitchen"`).
Anchor each `Room`'s point inside its own closed wall region — the Kitchen/
Dining/Family "great room" is one continuous walk-in space with open
pass-throughs, so it's one wall loop with (at minimum) two or three `Room`
anchors dropped at reasonable points (e.g. one in the Kitchen rect, one in
Family Room rect) so sidebar grouping and activity-room resolution split
them sensibly even though there's no dividing wall between them.

**Suggested sensor/light placement**:
- **mmWave (positional) sensor**: one in the Family Room (covers the whole
  great room, ~7500 mm range covers Kitchen+Dining+Family easily) and one in
  the Living Room. A radar sensor in the bedroom Corridor is a nice touch
  for whole-house presence continuity but optional.
- **Motion (binary) sensors**: one per bedroom, one in each bathroom
  (humidity-adjacent), one in the Garage.
- **Env sensors**: `temperature`+`humidity` combo in the Kitchen (it has no
  window — good place to demonstrate a `co2`/`voc` sensor too, motivating
  the "borrowed light / needs monitoring" narrative), a `temperature` sensor
  in the Garage.
- **Safety sensors**: `smoke` in the Corridor (covers both bedroom-wing
  legs) and in the Kitchen; `co` near the Garage service door (attached
  garage = classic CO risk).
- **Lights**: `bulb`/`flush` ceiling fixtures center-room in every bedroom,
  Living Room, Family Room, Kitchen (2× — one over the island, one general),
  Dining (`pendant` over the table), Foyer, Corridor, both bathrooms
  (`sconce` pair flanking each mirror), Laundry, Office Nook, Garage (2×
  `strip` fixtures). A `lamp` beside the Primary Bedroom's nightstand and
  one beside the Family Room sectional round out the "lived-in" feel.
- **Switches**: at minimum one `switch` fixture at the Foyer entry (porch/
  entry light) and one at the Family Room slider (exterior/patio light),
  wall-snapped near their respective doors per Diorama's switch-ganging
  behavior.

**Door lock / doorbell candidates**: the Front Door and the Garage-side
man-door are natural `lockEntity` bindings; the Front Door is the obvious
`doorbellEntity`.

**Scale sanity check**: bedroom footprints (139–165 sq ft, ~3400×3800–4500 mm)
land squarely in the "US bedroom ~3000–4000 mm" guidance from the brief;
the Corridor is 1100 mm wide (comfortable-hallway range 1000–1200 mm);
doors are 700–900 mm (28–36″, standard interior range); Kitchen counter runs
assume ~600 mm depth counters per standard residential dimensions.

**What's NOT modeled**: roofline/attic, exterior siding/brick, HVAC
ductwork, real concrete-vs-wood floor distinction per room (see §4's
either/or), a mudroom coat closet (folded into the Laundry room's footprint
instead), and any second story (this is intentionally a single-floor ranch —
no staircase anywhere in the spec).
