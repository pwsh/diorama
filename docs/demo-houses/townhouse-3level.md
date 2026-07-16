# Demo House: Narrow 3-Level Townhouse

Reconstruction-ready build spec for a Diorama demo floor plan.

## 1. Overview

- **Style**: Narrow urban infill rowhouse / townhouse (brick or fiber-cement
  street facade, modern-traditional detailing) — the classic "shotgun on
  steroids" city lot: two blank party walls shared with neighbors on the long
  sides, all light and street presence concentrated at the front (street)
  and rear (yard) facades. Three stacked levels around a single switchback
  staircase, ground-floor garage tucked under the living space above — the
  same massing as countless real 18–22 ft-wide rowhouse infill builds.
- **Total area**: **≈1,875 sq ft (174 m²) heated/finished** across 3 levels,
  plus a ground-floor garage (unheated) — **≈2,131 sq ft (198 m²) gross**
  floor area including the garage. See the per-floor math in §5.
- **Floors**: 3 — **Ground** (garage / entry / flex-office / half bath),
  **Middle** (open kitchen–dining–living + half bath + balcony), **Top**
  (primary suite + secondary bedroom + hall bath + laundry).
- **Footprint**: identical on all 3 levels (true to how rowhouses stack) —
  `w = 6000 mm` (x-axis) × `d = 11000 mm` (y-axis) = 19'8" × 36'1", 66 m² /
  710 sq ft gross per floor.
- **Feel**: Tall and narrow, deep and light-starved in the middle, bright at
  both ends. The two long walls (`x=0` and `x=6000`) are **party walls** —
  solid, windowless, shared with neighboring units. All windows and both
  exterior doors live on the front (`y=0`, street) and rear (`y=11000`,
  yard/balcony) walls. A single switchback stair core sits against the
  right party wall on every level, stacking exactly so it reads as one
  continuous shaft. Ground floor is utilitarian (garage + flex room); the
  middle floor is the "public" level with a big open kitchen/dining/living
  great room and a balcony off the kitchen; the top floor is private
  (bedrooms/baths/laundry). Floors run wood-look on the living levels, tile
  in wet rooms, concrete in the garage; walls are a warm neutral throughout
  with a slightly cooler tone upstairs.

## 2. Floor Plan

### Shared conventions (all 3 floors)

- Floor rectangle every level: `w = 6000 mm`, `d = 11000 mm`. Origin at
  bottom-left, world +X right / +Y up (Diorama's floor frame).
- `x = 0` and `x = 6000` are **party walls** on every floor: no windows, no
  exterior doors, always `kind: 'full'`.
- `y = 0` is the **front/street** facade; `y = 11000` is the **rear/yard**
  facade. These carry all windows + the two exterior doors (garage + entry)
  + the balcony door.
- The **staircase core** occupies the identical rectangle on all 3 floors —
  `x: 4500–6000, y: 3300–6300` (1500 × 3000 mm) — against the right party
  wall, so the shaft stacks perfectly. See §2.4.
- Rotation convention used throughout §3: **`0°` = front faces +Y (toward
  the rear/yard)**, `90°` = faces +X (toward the right/x=6000 party wall),
  `180°` = faces −Y (toward the front/street), `270°` = faces −X (toward
  the left/x=0 party wall). A quick rule of thumb used when placing pieces
  flush against a wall: **a piece backed against a wall faces away from
  it** — against `x=0` → `90°`; against `x=6000` → `270°`; against `y=0` →
  `0°`; against `y=11000` → `180°`.

---

### 2.1 Ground Floor — Garage / Entry / Flex-Office / Half Bath

#### ASCII sketch (plan view, rear/yard = top; not to exact scale)

```
   x=0                                                          x=6000
   +----------------------------------------------------------------+ y=11000 (rear)
   |                                                                 |
   |                    FLEX ROOM / HOME OFFICE                     |
   |        (desk+chair, sofa+TV zone)              y:6600-11000    |
   |                                                                 |
   +------------------------------------+-----+----------------------+ y=6600
   |                                     | H   |      STAIRWELL       |
   |                                     | A   |    (open shaft)      |
   |                                     | L   |    y:3300-6300       |
   |            GARAGE                  | L   +----------------------+ y=3300
   |        x:0-3600, y:0-6600          | W   |    HALF BATH          |
   |                                     | A   |    y:1800-3300        |
   |                                     | Y   +----------------------+ y=1800
   |                                     |     |      ENTRY            |
   |                                     |     |    y:0-1800           |
   +----------------------------------------------------------------+ y=0 (front/street)
   x=0            [garage door]      3600  4500      [entry door]  6000
```

#### Room table

| Room | Rect (x, y, w, d mm) | Sq ft | m² | Purpose |
|---|---|---|---|---|
| Garage | 0, 0, 3600, 6600 | 255.7 | 23.76 | Single-car garage, front-loaded |
| Entry / Foyer | 3600, 0, 2400, 1800 | 46.5 | 4.32 | Front door foyer |
| Half Bath | 4500, 1800, 1500, 1500 | 24.2 | 2.25 | Powder room off the hallway |
| Hallway (L-shaped) | main run 3600, 1800, 900, 4500 + cross run 3600, 6300, 2400, 300 | 51.4 | 4.77 | Connects entry → half bath/stair → flex room |
| Stairwell (open shaft) | 4500, 3300, 1500, 3000 | 48.4 | 4.5 | Open stair core, stacks through all 3 floors |
| Flex Room / Home Office | 0, 6600, 6000, 4400 | 284.2 | 26.4 | Full-width bonus room: office nook + casual media/seating |
| **Total** | | **710.4** | **66.0** | matches the floor's gross 6000×11000 mm exactly |

#### Wall layout

Coordinates are wall **centerlines** in mm; each row is one `Wall.points[]`
entry. `full` = 2743 mm (9 ft) unless noted.

**Exterior perimeter** (closed polyline, shared shape on all 3 floors):
```
(0, 0) → (6000, 0) → (6000, 11000) → (0, 11000) → (0, 0)
```
Long runs `(0,0)→(0,11000)` and `(6000,0)→(6000,11000)` are the party walls.

**Interior partitions**:

| Wall | Points (mm) | Separates |
|---|---|---|
| W1 | (3600, 0) → (3600, 6600) | Garage ↔ Entry/Hallway |
| W2 | (4500, 1800) → (4500, 6300) | Hallway ↔ Half Bath + Stairwell |
| W3 | (4500, 3300) → (6000, 3300) | Half Bath ↔ Stairwell |
| W4 | (0, 6600) → (6000, 6600) | Garage + Hallway ↔ Flex Room (full width, doorway cut — see below) |

(No wall between Entry and Hallway — open foyer-to-corridor flow, matching
how a narrow rowhouse foyer normally opens straight into the hall.)

#### Doors & windows

| Opening | Wall | Position (mm) | Width | Notes |
|---|---|---|---|---|
| Garage door | Front exterior (y=0) | x: 650–3050 | 2400 mm | `Door.kind: 'garage'`, sectional/roll-up |
| Entry door | Front exterior (y=0) | x: 4600–5400 | 800 mm | Swing, main pedestrian entry |
| Half Bath door | Wall W2 (x=4500) | y: 2300–3100 | 800 mm | Cut into W2, opens from Hallway |
| Hallway → Flex Room opening | Wall W4 (y=6600) | x: 3600–4500 | 900 mm | Open archway (no door leaf) |
| Flex Room yard door | Rear exterior (y=11000) | x: 2550–3450 | 900 mm | Swing out to the backyard |
| Flex Room windows | Rear exterior (y=11000) | x: 1000–2200 and x: 3800–5000 | 1200 mm each | Sill 900 mm, head 2100 mm |
| Garage | — | — | — | No windows (front wall carries only the garage door; party walls blank) |

#### Staircase

Bottom of the switchback run. `Furniture` kind **`stairs`** placed at
`x: 5250, y: 4800` (center of the 1500×3000 mm stairwell rect), `rotation:
0°`, `w: 1500, d: 3000`. This flight rises to the Middle floor landing.

---

### 2.2 Middle Floor — Open Kitchen / Dining / Living, Half Bath, Balcony

#### ASCII sketch (plan view, rear/yard = top; not to exact scale)

```
   x=0                                                          x=6000
   +----------------------------------------------------------------+ y=11000 (rear)
   |                                                                 |
   |                          KITCHEN                                |  y:8300-11000
   |          (counters, island, fridge, sink, stove)                |
   |                                    ~~~ [balcony door] ~~~        |
   +------------------------------------------------------------------+ y=8300
   |                                                                 |
   |                          DINING ROOM                             |  y:6300-8300
   |                                                                 |
   +------------------------------------------------------+----------+ y=6300
   |                                                       |          |
   |                                                       | STAIR-   |  y:3300-6300
   |                                                       | WELL     |
   |             LIVING ROOM (open concept)                | (open   |
   |         sofa + TV + armchair + reading nook            |  shaft) |
   |                                                       +----------+ y=3300
   |                                                       | LANDING  |  y:1500-3300
   |                                                       +----------+ y=1500
   |                                                       |HALF BATH |  y:0-1500
   +------------------------------------------------------------------+ y=0 (front/street)
   x=0                                                4500          6000
```

#### Room table

| Room | Rect (x, y, w, d mm) | Sq ft | m² | Purpose |
|---|---|---|---|---|
| Living Room (open concept) | 0, 0, 4500, 6300 | 305.2 | 28.35 | Main seating/media room, street-facing |
| Half Bath | 4500, 0, 1500, 1500 | 24.2 | 2.25 | Powder room off the stair landing |
| Stair Landing / Hall | 4500, 1500, 1500, 1800 | 29.1 | 2.7 | Connects half bath to the stair core |
| Stairwell (open shaft) | 4500, 3300, 1500, 3000 | 48.4 | 4.5 | Continues the shaft from Ground |
| Dining Room | 0, 6300, 6000, 2000 | 129.2 | 12.0 | Open to Living + Kitchen |
| Kitchen | 0, 8300, 6000, 2700 | 174.3 | 16.2 | Rear wall, door out to the balcony |
| **Total** | | **710.4** | **66.0** | matches the floor's gross footprint exactly |

> **Room-naming note**: name the great room something containing
> **"Kitchen"** (e.g. keep the Kitchen sub-zone literally named `"Kitchen"`
> as its own `Room` entry with an anchor inside `0,8300–6000,11000`) so the
> kitchen-gated snack/coffee thought-bubble behavior fires correctly —
> Living/Dining can be separate `Room` entries (or one shared "Living /
> Dining" room) since they're one open volume with no walls between them.

#### Wall layout

**Exterior perimeter**: same closed rectangle as Ground (§2.1).

**Interior partitions**:

| Wall | Points (mm) | Separates |
|---|---|---|
| W1 | (4500, 0) → (4500, 3300) | Living Room ↔ Half Bath + Landing |
| W2 | (4500, 1500) → (6000, 1500) | Half Bath ↔ Landing |
| W3 | (4500, 3300) → (6000, 3300) | Landing ↔ Stairwell shaft (doorway cut) |
| W4 (`kind: 'railing'`) | (4500, 3300) → (4500, 6300) | Stairwell shaft open guard-rail, facing the Living Room |
| W5 | (4500, 6300) → (6000, 6300) | Stairwell shaft ↔ Dining Room (doorway cut — stair exit) |

No wall between Living Room / Dining Room / Kitchen (`x: 0–4500` runs fully
open `y: 0–11000` except where it's blocked by the half bath/landing/stair
column on the right) — this is the "open kitchen/dining/living" great room
called for in the brief.

#### Doors & windows

| Opening | Wall | Position (mm) | Width | Notes |
|---|---|---|---|---|
| Half Bath door | Wall W1 (x=4500) | y: 400–1200 | 800 mm | Opens from Living Room |
| Landing → Stairwell door | Wall W3 (y=3300) | x: 4900–5700 | 800 mm | Interior stair-hall door (draft/noise control) |
| Stairwell → Dining door | Wall W5 (y=6300) | x: 4900–5700 | 800 mm | Stair exit into the Dining Room |
| Living Room windows | Front exterior (y=0) | x: 700–1900 and x: 2600–3800 | 1200 mm each | Sill 900 mm, head 2100 mm — twin street-facing windows |
| Kitchen balcony door | Rear exterior (y=11000) | x: 2250–3750 | 1500 mm | French door out to a small cantilevered balcony (≈6000×1500 mm, exterior — not part of the interior floor rect; see §5) |
| Kitchen window | Rear exterior (y=11000) | x: 4200–5400 | 1200 mm | Sill 900 mm, beside the balcony door |

#### Staircase

Mid-run landing + continuing flight. `Furniture` kind **`stairs`** at
`x: 5250, y: 4800`, `rotation: 0°`, `w: 1500, d: 3000` — same footprint as
Ground, continuing the shaft up to the Top floor.

---

### 2.3 Top Floor — Primary Suite, Secondary Bedroom, Hall Bath, Laundry

#### ASCII sketch (plan view, rear/yard = top; not to exact scale)

```
   x=0                                                          x=6000
   +----------------------------------------------------------------+ y=11000 (rear)
   |                                    |                            |
   |                                    |   PRIMARY ENSUITE BATH     |  y:8300-11000
   |         PRIMARY BEDROOM            |   (tub, shower, vanity)    |
   |       x:0-4200, y:6300-11000       +----------------------------+ y=8300
   |                                    |   WALK-IN CLOSET           |  y:6300-8300
   +----------------------+-------------+----------------------------+ y=6300
   |         |            |             |       STAIRWELL             |
   | LAUNDRY | UPSTAIRS HALLWAY (L)     |     (open shaft, top       |  y:3300-6300
   | CLOSET  |                          |      landing/guard-rail)   |
   +---------+--------------------------+----------------------------+ y=3300
   |                                    |   STAIR LANDING / HALL     |  y:1800-3300
   |     SECONDARY BEDROOM              +----------------------------+ y=1800
   |     x:0-3900, y:0-3300             |    HALL BATH                |  y:0-1800
   +----------------------------------------------------------------+ y=0 (front/street)
   x=0                              3900              4500      6000
```

#### Room table

| Room | Rect (x, y, w, d mm) | Sq ft | m² | Purpose |
|---|---|---|---|---|
| Secondary Bedroom | 0, 0, 3900, 3300 | 138.5 | 12.87 | Front (street-facing) bedroom |
| Hall Bath | 3900, 0, 2100, 1800 | 40.7 | 3.78 | Shared bath, off the stair landing |
| Stair Landing / Hall (front) | 3900, 1800, 2100, 1500 | 33.9 | 3.15 | Connects hall bath / secondary bedroom to the stair |
| Laundry Closet | 0, 3300, 1800, 1800 | 34.9 | 3.24 | Stacked washer/dryer, top of stairs |
| Upstairs Hallway (L-shaped) | run A: 1800, 3300, 2700, 3000 + run B: 0, 5100, 1800, 1200 | 110.4 | 10.26 | Corridor from front rooms to Primary Suite |
| Stairwell (open shaft, top landing) | 4500, 3300, 1500, 3000 | 48.4 | 4.5 | Shaft terminates here — guarded overlook |
| Primary Bedroom | 0, 6300, 4200, 4700 | 212.4 | 19.74 | Rear-facing (quiet side), full width minus suite |
| Primary Walk-in Closet | 4200, 6300, 1800, 2000 | 38.75 | 3.6 | Between bedroom and ensuite |
| Primary Ensuite Bath | 4200, 8300, 1800, 2700 | 52.3 | 4.86 | Tub + shower + double vanity + toilet |
| **Total** | | **710.3** | **66.0** | matches the floor's gross footprint (rounding) |

#### Wall layout

**Exterior perimeter**: same closed rectangle as Ground/Middle (§2.1).

**Interior partitions**:

| Wall | Points (mm) | Separates |
|---|---|---|
| W1 | (3900, 0) → (3900, 3300) | Secondary Bedroom ↔ Hall Bath + Landing |
| W2 | (3900, 1800) → (6000, 1800) | Hall Bath ↔ Landing |
| W3 | (0, 3300) → (6000, 3300) | Secondary Bedroom + Landing ↔ Laundry/Hallway/Stairwell band (two doorway cuts) |
| W4 | (1800, 3300) → (1800, 6300) | Laundry Closet ↔ Upstairs Hallway |
| W5 | (0, 5100) → (1800, 5100) | Laundry Closet ↔ Hallway run B (doorway cut) |
| W6 (`kind: 'railing'`) | (4500, 3300) → (4500, 6300) | Stairwell shaft guard-rail, facing the Upstairs Hallway |
| W7 (`kind: 'railing'`) | (4500, 6300) → (6000, 6300) | Stairwell shaft top overlook rail (shaft terminates here) |
| W8 | (0, 6300) → (6000, 6300) | Hallway/Laundry ↔ Primary Bedroom + Closet + Bath (one doorway cut) |
| W9 | (4200, 6300) → (4200, 11000) | Primary Bedroom ↔ Closet + Ensuite Bath (two doorway cuts, both from inside the bedroom) |
| W10 | (4200, 8300) → (6000, 8300) | Walk-in Closet ↔ Ensuite Bath |

#### Doors & windows

| Opening | Wall | Position (mm) | Width | Notes |
|---|---|---|---|---|
| Secondary Bedroom door | Wall W3 (y=3300) | x: 1500–2300 | 800 mm | From front landing area |
| Landing → Hallway passage | Wall W3 (y=3300) | x: 4100–4900 | 800 mm | Open passage, no door needed |
| Hall Bath door | Wall W1 (x=3900) | y: 300–1100 | 800 mm | From the front landing |
| Laundry Closet door | Wall W4 (x=1800) | y: 3600–4400 | 800 mm | Bi-fold, from the hallway |
| Primary Bedroom door | Wall W8 (y=6300) | x: 1650–2550 | 900 mm | Main suite entry off the hallway |
| Primary → Closet door | Wall W9 (x=4200) | y: 7100–7900 | 800 mm | Accessed from inside the bedroom |
| Primary → Ensuite door | Wall W9 (x=4200) | y: 9300–10100 | 800 mm | Accessed from inside the bedroom |
| Secondary Bedroom window | Front exterior (y=0) | x: 1350–2550 | 1200 mm | Sill 900 mm, head 2100 mm |
| Hall Bath window | Front exterior (y=0) | x: 4650–5650 | 1000 mm | Sill 1200 mm (privacy glass, higher sill) |
| Primary Bedroom windows | Rear exterior (y=11000) | x: 500–1700 and x: 2400–3600 | 1200 mm each | Sill 900 mm, head 2100 mm |
| Ensuite Bath window | Rear exterior (y=11000) | x: 4700–5700 | 900 mm | Sill 1400 mm (privacy glass over the tub) |

#### Staircase

Top of the shaft. `Furniture` kind **`stairs`** at `x: 5250, y: 4800`,
`rotation: 0°`, `w: 1500, d: 3000` — same footprint as the two floors below,
representing the top flight + guarded overlook onto the shaft (no further
floor above).

---

### 2.4 Stair core alignment (all 3 floors)

The stairwell rectangle **`x: 4500–6000, y: 3300–6300`** is identical on
Ground, Middle, and Top — this is the load-bearing detail that makes the
building read as one structure. Each floor places its own `stairs`
furniture item at the same `x: 5250, y: 4800` center. The vertical
open-to-below/above feel is conveyed by `Wall.kind: 'railing'` on the shaft
edges that face circulation space (Middle floor W4, Top floor W6 + W7)
rather than solid walls — riders can be seen from the adjoining hallway,
consistent with an open switchback stair in a narrow rowhouse.

## 3. Furnishing per room

Rotation convention repeated from §2: `0°` = front faces +Y (toward
rear/yard), `90°` = faces +X (toward x=6000), `180°` = faces −Y (toward
front/street), `270°` = faces −X (toward x=0). Position is the piece's
approximate center in mm. Treat these as good starting placements — nudge
in 90° increments in the sidebar if a piece needs to face a different way
once real furniture bounding boxes are on screen.

### GROUND FLOOR

#### Garage (0–3600, 0–6600)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `cabinet` (storage) | 600, 6100 | 180° | Against the rear wall (W4) |
| `counter` (workbench) | 3300, 1000 | 90° | Against the hallway partition (W1), 1800×600 |

*(No vehicle is modeled — Diorama has no "car" kind; the rest of the garage
floor is left clear for the implied vehicle.)*

#### Entry / Foyer (3600–6000, 0–1800)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `bench` | 5850, 900 | 270° | Against the party wall (x=6000), shoe-removal bench |
| `rug` | 4900, 900 | 0° | 1400×1200 mm, anchors the foyer |

#### Half Bath (4500–6000, 1800–3300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `toilet` | 5750, 2050 | 270° | Against the party wall (x=6000) |
| `sink` | 4650, 2050 | 90° | Against the hallway wall (x=4500) |

#### Hallway (3600–4500, 1800–6300 + cross-run to 6000, 6300–6600)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `rug` (runner) | 4050, 4000 | 0° | 800×3000 mm runner |

#### Stairwell (4500–6000, 3300–6300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `stairs` | 5250, 4800 | 0° | 1500×3000 mm, bottom flight up to Middle floor |

#### Flex Room / Home Office (0–6000, 6600–11000)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `desk` | 1200, 10400 | 180° | Backed against the rear wall, under the left window |
| `chair` | 1200, 9900 | 0° | Facing the desk |
| `bookshelf` | 300, 10700 | 90° | Against the party wall (x=0) |
| `tv_stand` | 4500, 6800 | 0° | Against the front partition wall (W4) |
| `tv` | 4500, 6800 | 0° | Mounted above the stand |
| `sofa` | 4500, 10600 | 180° | Backed against the rear wall, under the right window |
| `coffee_table` | 4500, 9000 | 0° | Between sofa and TV |
| `rug` | 4500, 9500 | 0° | 3000×2400 mm, anchors the media zone |

---

### MIDDLE FLOOR

#### Living Room (0–4500, 0–6300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `sofa` (or `sectional`) | 2200, 700 | 0° | Backed against the front/street wall, 2400×900 |
| `coffee_table` | 2200, 1600 | 0° | In front of the sofa |
| `tv_stand` | 300, 2000 | 90° | Against the party wall (x=0) |
| `tv` | 300, 2000 | 90° | Mounted above the stand |
| `armchair` | 4100, 1600 | 270° | Against the half-bath/landing partition (x=4500) |
| `rug` | 2600, 1600 | 0° | 3400×2400 mm, main seating group |
| `armchair` (reading nook) | 300, 4800 | 90° | Against the party wall, rear portion of the room |
| `ottoman` | 900, 4800 | 90° | Paired with the reading armchair |
| `plant` | 4200, 5800 | 0° | Corner accent near the stairwell partition |

#### Half Bath (4500–6000, 0–1500)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `toilet` | 5750, 750 | 270° | Against the party wall (x=6000) |
| `sink` | 4650, 750 | 90° | Against the Living Room wall (x=4500) |

#### Stair Landing / Hall (4500–6000, 1500–3300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| *(none — circulation space)* | — | — | Optional small console/mirror, not a modeled furniture kind |

#### Stairwell (4500–6000, 3300–6300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `stairs` | 5250, 4800 | 0° | Continues the shaft to the Top floor |

#### Dining Room (0–6000, 6300–8300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `dining_table` | 3000, 7300 | 0° | 1800×1000 mm |
| `chair` ×2 | 2200, 7300 (270°) / 3800, 7300 (90°) | — | Ends of the table |
| `chair` ×2 | 2600, 6800 (0°) / 3400, 6800 (0°) | — | Front side, facing the Kitchen |
| `chair` ×2 | 2600, 7800 (180°) / 3400, 7800 (180°) | — | Rear side, facing the Living Room |

#### Kitchen (0–6000, 8300–11000)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `stove` | 900, 10700 | 180° | Against the rear wall |
| `microwave` | 900, 10700 | 180° | Mounted over the stove |
| `dishwasher` | 2400, 10700 | 180° | Beside the sink, under-counter |
| `sink` | 2800, 10700 | 180° | Under the rear window, between the two counter runs |
| `counter` (run 1) | 1500, 10700 | 180° | 2000×600 mm, stove side |
| `counter` (run 2) | 4000, 10700 | 180° | 1600×600 mm, fridge side |
| `fridge` | 5700, 10300 | 270° | Against the party wall (x=6000), end of the run |
| `island` | 2800, 9300 | 0° | 2200×900 mm, freestanding, facing the Dining Room |
| `stool` ×3 | 2200 / 2800 / 3400, 9700 | 0° each | Along the island, dining-room side |

Balcony (exterior, off the Kitchen rear wall, ≈6000×1500 mm cantilever) is
not part of the interior floor rect — see §5.

---

### TOP FLOOR

#### Secondary Bedroom (0–3900, 0–3300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `bed` (queen/full) | 1200, 900 | 0° | Headboard against the front wall, 1500×2100 |
| `nightstand` | 350, 300 | 0° | Left of the headboard |
| `nightstand` | 2050, 300 | 0° | Right of the headboard |
| `dresser` | 3300, 600 | 270° | Against the right wall (x=3900), 1200×550 |
| `rug` | 1200, 1400 | 0° | 2000×1800 mm |

#### Hall Bath (3900–6000, 0–1800)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `sink` | 4650, 300 | 0° | Vanity against the front wall |
| `toilet` | 4100, 1400 | 90° | Against the Secondary Bedroom wall (x=3900) |
| `bathtub` | 5700, 900 | 270° | Against the party wall (x=6000), 800×1700 |

#### Stair Landing / Hall (front) (3900–6000, 1800–3300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| *(none — circulation space)* | — | — | — |

#### Laundry Closet (0–1800, 3300–5100)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `washer` | 300, 3700 | 90° | Against the party wall (x=0) |
| `dryer` | 300, 4700 | 90° | Side-by-side with the washer |

#### Upstairs Hallway (1800–4500, 3300–6300 + 0–1800, 5100–6300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `rug` (runner) | 3150, 4800 | 0° | 2500×900 mm |

#### Stairwell (top landing) (4500–6000, 3300–6300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `stairs` | 5250, 4800 | 0° | Top of the shaft; guarded overlook (W6/W7 railings) |

#### Primary Bedroom (0–4200, 6300–11000)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `bed` (king) | 2100, 10400 | 180° | Headboard against the rear wall, 2000×2200 |
| `nightstand` | 900, 10400 | 180° | Left of the headboard |
| `nightstand` | 3300, 10400 | 180° | Right of the headboard |
| `dresser` | 300, 7200 | 90° | Against the party wall (x=0), 1400×550 |
| `bench` | 2100, 9100 | 180° | Foot of the bed |
| `armchair` | 3700, 7200 | 270° | Reading nook against the closet/bath partition (x=4200) |
| `rug` | 2100, 9800 | 0° | 2600×2400 mm |

#### Primary Walk-in Closet (4200–6000, 6300–8300)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `wardrobe` | 4400, 7200 | 90° | Against the bedroom partition (x=4200), 1200×600 |
| `wardrobe` | 5800, 7200 | 270° | Against the party wall (x=6000), facing the first wardrobe across the aisle |

#### Primary Ensuite Bath (4200–6000, 8300–11000)

| Furniture (kind) | Position (x, y) | Rotation | Notes |
|---|---|---|---|
| `sink` (double vanity) | 4500, 8600 | 90° | Against the closet partition (x=4200), 1600×550 |
| `toilet` | 4500, 10600 | 90° | Against the closet partition, rear of the room |
| `bathtub` | 5700, 9150 | 270° | Against the party wall (x=6000), 800×1700 |
| `shower` | 5550, 10700 | 180° | Against the rear wall, 900×900 |

## 4. Skinning / appearance

Diorama's `Scene3D`/`Floor.look3d` texture + color are **per floor** (with
an optional per-floor override), not per room — pick one dominant material
per level and treat wet-room tile as the deliberate compromise, same as the
studio-apartment spec.

| Floor | Zone | Real-world material | Diorama `floorTex` | `floorColor` |
|---|---|---|---|---|
| Ground | Garage | Sealed concrete | `concrete` | `#9A9A93` |
| Ground | Entry / Hallway / Flex Room | Warm oak engineered plank | `wood` | `#C7A06B` |
| Ground | Half Bath | Light gray tile | `tile` | `#D9D6CE` |
| Middle | Living / Dining / Kitchen (great room) | Medium walnut wide-plank wood | `wood` | `#A6784C` |
| Middle | Half Bath | Light gray tile | `tile` | `#D9D6CE` |
| Top | Bedrooms / Hallway / Landing | Soft warm carpet | `carpet` if available, else `none` + `floorColor` only | `#D8CFC0` |
| Top | Hall Bath / Ensuite Bath / Laundry | Light gray tile | `tile` | `#D9D6CE` |

**Recommended single floor-wide settings** (since texture/color are
whole-floor per level, not per room):

- **Ground floor**: `floorTex: 'wood'`, `floorColor: '#C7A06B'` (garage
  concrete + half-bath tile are the accepted compromise — most of the
  square footage is the wood-look flex room/hallway).
- **Middle floor**: `floorTex: 'wood'`, `floorColor: '#A6784C'` (slightly
  deeper tone than Ground for a "public floor" feel; kitchen tile is the
  compromise, or use `Floor.look3d` if a per-room override is desired).
- **Top floor**: `floorTex: 'none'` with `floorColor: '#D8CFC0'` (a soft
  warm neutral standing in for carpet — see note in the table above; the
  two bathrooms + laundry tile is the compromise).

**Wall colors** (`Scene3D.wallColor`, or `Floor.look3d.wallColor` per
floor): Ground `#F1ECE2` (warm white, matches the studio spec's tone),
Middle `#EDE7DA` (warm greige, slightly richer for the entertaining floor),
Top `#E7EAEC` (cool-neutral, calmer for the bedroom level).

**Accent notes** (non-Diorama-modeled, renderer flavor only): black-frame
windows front and rear, brushed-nickel/matte-black hardware throughout,
a navy or forest-green front door, board-and-batten or fiber-cement lap
siding on the street facade.

## 5. Reconstruction notes

- **Scale sanity check**: every floor's room rectangles sum to (within
  rounding) the floor's own gross footprint of 6000×11000 mm = 66.0 m² /
  710.4 sq ft:
  - Ground: 255.7 + 46.5 + 24.2 + 51.4 + 48.4 + 284.2 = **710.4 sq ft** ✓
  - Middle: 305.2 + 24.2 + 29.1 + 48.4 + 129.2 + 174.3 = **710.4 sq ft** ✓
  - Top: 138.5 + 40.7 + 33.9 + 34.9 + 110.4 + 48.4 + 212.4 + 38.75 + 52.3 =
    **710.25 sq ft** ✓ (rounding)
  - **3-floor gross total**: 3 × 710.4 = **2,131.2 sq ft (198.0 m²)**.
  - **Heated/finished total**: gross minus the Ground-floor Garage (255.7
    sq ft, unheated) = **1,875.5 sq ft (174.2 m²)** — this is the number
    quoted in §1 as "total square footage."
- **Party-wall convention**: `x=0` and `x=6000` never carry windows or
  exterior doors on any floor — that's what makes this read as a rowhouse
  rather than a detached house. All glazing and both exterior doors +
  the balcony door live on `y=0` (front) and `y=11000` (rear).
- **Stair core must stack**: keep the `stairs` furniture item and its
  1500×3000 mm footprint at the exact same `x/y` on all 3 floors (§2.4).
  Diorama has no cross-floor structural constraint that enforces this
  automatically — it's on the builder to keep the coordinates identical
  when placing each floor's copy.
- **Railings over walls at the open shaft edges**: use `Wall.kind:
  'railing'` (not `'full'`) for the stairwell edges that face circulation
  space (Middle floor's W4, Top floor's W6/W7) so the shaft reads as
  open-to-below/above rather than a sealed closet — matches the "railing"
  wall kind's real intent (posts + top/bottom rails + balusters in 3D).
- **Room-naming convention**: name the Kitchen sub-zone on the Middle floor
  literally containing **"Kitchen"** so the kitchen-gated snack/coffee
  thought-bubble behavior fires; Living/Dining can share one `"Living /
  Dining"` room or be split — either resolves fine since there's no wall
  between them (`resolveRoomForPoint` follows the closed wall loop, and
  the whole Living+Dining+Kitchen run is one loop bounded by the exterior
  walls + the half-bath/stair partition on the right).
- **Balcony (Middle floor kitchen)**: the ≈6000×1500 mm cantilevered
  balcony implied by the French door in §2.2 is an **exterior** feature —
  it's not part of the interior floor rect (`w × d`) and doesn't need a
  modeled room. If a visible exterior deck is wanted, it can be added as
  a small separate `Floor` or represented with a custom object recipe; the
  spec above only requires the door opening itself.
- **Garage note**: no `FurnitureKind` models a parked car — the garage
  floor area is deliberately left clear apart from the workbench/cabinet;
  a builder wanting a "with car" look would need a custom object recipe.
- **Furniture kind availability**: every kind referenced in §3 (`bed`,
  `nightstand`, `dresser`, `wardrobe`, `sofa`, `sectional`, `armchair`,
  `ottoman`, `bench`, `coffee_table`, `tv_stand`, `tv`, `bookshelf`,
  `desk`, `chair`, `dining_table`, `rug`, `plant`, `fridge`, `stove`,
  `microwave`, `dishwasher`, `washer`, `dryer`, `counter`, `island`,
  `stool`, `sink`, `toilet`, `bathtub`, `shower`, `cabinet`, `stairs`)
  already exists in `FURNITURE_KINDS` — no new kinds need to be added to
  `geometry.ts` to build this house. `carpet` is **not** a listed
  `floorTex` value in the current codebase (`none|wood|tile|concrete`
  only) — the Top floor recommendation above uses `floorTex: 'none'` +
  a soft `floorColor` as the practical stand-in; swap to a real `carpet`
  texture value if/when one is added.
- **Lighting & switches suggestion** (not required by the brief, useful
  for a believable rebuild):
  - Ground: flush-mounts over the garage (1800, 3300) and flex room
    (1500, 9000 and 4500, 9000); pendant or sconce at the entry (4800,
    900); switch by the entry door (5000, 200, wall-snapped) ganged for
    entry + hallway; switch at the flex-room archway (3900, 6500).
  - Middle: pendant over the dining table (3000, 7300); under-cabinet or
    flush kitchen lighting (2800, 9800); floor lamp beside the reading
    armchair (600, 4600); switch inside the front door area (4300, 300)
    ganged for living-room lights; switch at the dining/kitchen threshold
    (300, 8200).
  - Top: flush-mounts centered in each bedroom (1950, 1650 secondary;
    2100, 8650 primary); vanity sconces in both bathrooms; switch outside
    each bedroom door and at the top of the stairs (4700, 3100).
  - A door lock/doorbell entity on the Entry door and a smoke detector on
    each floor's hallway/landing ceiling (Ground: 4050, 4000; Middle:
    5250, 2400; Top: 3150, 4800) round out a realistic device set.
  - mmWave/motion suggestion for live-occupancy demos: one positional
    mmWave sensor in the Middle-floor Living/Dining/Kitchen great room
    (2800, 3000, facing rear) covers the whole public floor; binary motion
    sensors suffice for the smaller enclosed rooms (baths, closets,
    garage, bedrooms).

Sources consulted for sizing sanity: narrow-lot / rowhouse floor plan
collections (thehousedesigners.com, drummondhouseplans.com,
theplancollection.com, architecturaldesigns.com) for realistic footprint
and per-floor square footage ranges on 18–25 ft-wide multi-story lots, and
standard US residential door/hallway/stair dimensions (houseanplan.com,
dimensions.com, houzz.com) for door widths (~800–900 mm), hallway widths
(~900–1100 mm), and stair widths (~900+ mm).
