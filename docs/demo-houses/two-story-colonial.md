# Demo House: Two-Story Colonial

A reconstruction-ready build spec for a traditional American center-hall
colonial, sized and detailed for direct entry into Diorama (floors → walls →
rooms → doors/windows → furniture → materials). All coordinates are
**millimeters (mm)**. World frame: **+X = right, +Y = up** (screen-up in
Diorama's 2D/3D views); floor origin `(0,0)` = bottom-left corner of the
floor rectangle. Rotation convention used throughout: an item's functional
**front points toward −Y at 0°**, **+X at 90°**, **+Y at 180°**, **−X at
270°** (front = seat opening / screen / appliance door / hinge side; the
back — sofa back, headboard, bookshelf back — is the opposite side).

---

## 1. Overview

**Style:** Traditional American center-hall Colonial, 2 full stories plus an
attached 2-car garage (single-story, no room above it — the standard real-world
arrangement).

**Total heated area:** ≈ **2,600 sq ft** (≈ 242 m²) across 2 floors — main
house block only; the garage (≈ 401 sq ft / 37 m²) is unheated and excluded,
standard real-estate convention. Of the 2,600 sq ft, ≈ 122 sq ft on the second
floor is the open, guard-railed stairwell landing rather than solid floor
(see §3.1 note) — it's still counted here as floor-plan footprint, the same
convention the app's other demo-house specs use for stair openings.

**Floors:** 2, plus the attached garage wing (first floor only).

**Overall footprint:**
- First floor (bounding rectangle incl. garage wing): **18,300 mm W × 9,900 mm D**
  (60'0" × 32'6"). Main house block: **12,200 × 9,900 mm** (40'0" × 32'6").
  Garage wing: **6,100 × 6,100 mm** (20'0" × 20'0"), attached flush to the
  house's east wall, flush with the front (street) face.
- Second floor: **12,200 mm × 9,900 mm** (40'0" × 32'6") — identical footprint
  and origin to the first floor's main house block, so exterior walls and the
  staircase stack exactly between floors. No second story over the garage.

**Feel / appearance:** A symmetric, front-gabled colonial — white-painted
clapboard siding, black-shuttered 6-over-6 windows, a paneled front door
centered under a small portico, and a side-loaded 2-car garage tucked to the
east so it doesn't dominate the front elevation (exterior skin/roofline
aren't modeled in Diorama — this is scene-setting for whoever textures the
`Floor.look3d`). Inside: a formal center hall with a straight-run,
switchback staircase rising directly ahead of the front door, flanked by a
quiet living room and dining room that see mostly holiday/company traffic,
opening at the back of the house into the casual kitchen-and-breakfast-nook
cluster and a big family room where the household actually lives. A half
bath and a mudroom/laundry sit tucked behind the stair hall, between the
kitchen and the garage entry. Upstairs is a conventional 4-bedroom split: a
primary suite with en-suite bath and walk-in closet over the family room,
two front-facing secondary bedrooms flanking the stair landing, and a fourth
secondary bedroom over the kitchen sharing a plumbing wall with the hall
bath (stacked directly above the downstairs half bath for efficient
plumbing runs). Warm oak floors through the formal/casual living spaces,
tile in the kitchen/baths/mudroom, carpet-toned floors upstairs in the
bedrooms.

---

## 2. First Floor

### 2.1 Floor rectangle

`Floor.w = 18300, Floor.d = 9900` (mm) — this bounding rectangle covers the
main house block **and** the attached garage. World-frame convention used
throughout this doc: **y = 0 is the front (street-facing) edge of the
house; y increases toward the rear (backyard) edge. x = 0 is the west
(left, as viewed from the street) end; x increases east toward the garage.**

- **Main house block:** x 0–12,200, y 0–9,900.
- **Garage wing:** x 12,200–18,300, y 0–6,100 (front-flush with the house).
- **Unbuilt side-yard notch:** x 12,200–18,300, y 6,100–9,900 — no wall loop
  encloses it, so it renders as bare ground beside the garage (Diorama only
  floors closed wall loops — this is the intended way to model an L-shaped
  footprint), reading as a side walkway/patio strip.

The garage sits **inside** the same exterior perimeter loop as the house (one
continuous L-shaped exterior wall run) but is separated from the living
space by a solid interior partition at x = 12,200 — i.e. a real house's
attached-garage firewall, not a second building.

### 2.2 ASCII sketch (top-down, front at bottom)

```
y=9900  ┌───────────────┬─────┬────────┬─────────┐
 (rear) │               │Back │        │Breakfast│
        │  FAMILY ROOM  │Hall │KITCHEN │  NOOK   │← ext windows/door, E wall
        │               │     │        │         │   (x=12200, y 6100–9900)
        │               ├─────┤        ├─────────┤
        │               │Stair│  (open Kitchen /  │
        │               │Hall │   Nook area, no   │
        ├───────────────┤     │  partition wall)  │
        │               │     ├────────┼─────────┤
        │               │     │  Half  │ Mudroom /│──door──┐
        │  LIVING ROOM  │     │  Bath  │ Laundry  │        │
        │               ├─────┤        │          │        │
        │               │Foyer│                    │ GARAGE │
        │               │     │    DINING ROOM      │(2-car) │
        └───────────────┴─────┴─────────────────────┴────────┘
y=0                                                  x=12200 x=18300
(front, street — front door in Foyer)
x=0             x=4650      x=7350   x=8850/10000
```

(The Foyer / Stair Hall / Back Hall column is the 2,700 mm-wide center
spine, x 4,650–7,350, running the full depth of the house — classic
center-hall layout. Kitchen and Breakfast Nook are drawn as one open area on
purpose — see the room table note.)

### 2.3 Room table (first floor)

Rectangles given as `x, y` = bottom-left corner, `w × d` = size, all mm.

| Room | x, y | w × d (mm) | sq ft | Purpose |
|---|---|---|---|---|
| Living Room | 0, 0 | 4,650 × 4,300 | 215.2 | Formal living room, front-left |
| Foyer | 4,650, 0 | 2,700 × 2,400 | 69.8 | Entry, front door, opens to Stair Hall |
| Stair Hall | 4,650, 2,400 | 2,700 × 4,200 | 122.1 | Staircase run to 2F |
| Back Hall | 4,650, 6,600 | 2,700 × 3,300 | 95.9 | Connector: Stair Hall ↔ Family Room / Kitchen |
| Dining Room | 7,350, 0 | 4,850 × 4,300 | 224.5 | Formal dining, front-right |
| Half Bath | 7,350, 4,300 | 1,500 × 1,400 | 22.6 | Powder room off Stair Hall (interior) |
| Mudroom / Laundry | 8,850, 4,300 | 3,350 × 1,400 | 50.5 | Between Half Bath and garage; garage entry door |
| Family Room | 0, 4,300 | 4,650 × 5,600 | 280.1 | Casual great room, rear-left, slider to yard |
| Kitchen + Breakfast Nook (one open room) | 7,350, 5,700 | 4,850 × 4,200 | 219.3 | Working kitchen (west 2,650 mm) + eat-in nook (east 2,200 mm), no dividing wall — see below |
| Garage (2-car) | 12,200, 0 | 6,100 × 6,100 | 400.7 (unheated) | Attached, front-facing bay doors |

**Kitchen / Breakfast Nook** is modeled as a **single wall-loop room** with
**two `Room` anchors** dropped inside it (one in the western ~2,650 mm —
named `"Kitchen"` — one in the eastern ~2,200 mm — named `"Breakfast Nook"`),
the same technique used for other open-concept great rooms in this app's
demo houses: no partition wall, but sidebar grouping and activity/room
resolution still split the two zones sensibly because each anchor resolves
to whichever room name is nearest.

**First-floor heated total:** 215.2 + 69.8 + 122.1 + 95.9 + 224.5 + 22.6 +
50.5 + 280.1 + 219.3 = **≈ 1,300 sq ft**, matching the main block's gross
rectangle (12,200 × 9,900 mm = 120.78 m² = 1,300.0 sq ft) almost exactly —
interior wall centerlines were chosen so the room table tiles the block
without gaps (see §6 sanity check).

### 2.4 Wall layout

Wall thickness 100 mm throughout (Diorama default, `kind: full`), height
2,743 mm (9 ft) except where noted. All coordinates are wall **centerlines**.

**Exterior perimeter** (one L-shaped closed loop, house + garage):
`(0,0) → (18300,0) → (18300,6100) → (12200,6100) → (12200,9900) → (0,9900) → (0,0)`

**Interior partition walls:**

| # | Points (mm) | Separates |
|---|---|---|
| 1 | (4650, 0) → (4650, 9900) | Living/Family ↔ Foyer/Stair Hall/Back Hall (full-depth spine wall, west) |
| 2 | (7350, 0) → (7350, 9900) | Foyer/Stair Hall/Back Hall ↔ Dining/Half Bath+Mudroom/Kitchen+Nook (full-depth spine wall, east) |
| 3 | (4650, 2400) → (7350, 2400) | Foyer ↔ Stair Hall |
| 4 | (4650, 6600) → (7350, 6600) | Stair Hall ↔ Back Hall |
| 5 | (0, 4300) → (4650, 4300) | Living Room ↔ Family Room |
| 6 | (7350, 4300) → (12200, 4300) | Dining Room ↔ Half Bath + Mudroom row |
| 7 | (7350, 5700) → (12200, 5700) | Half Bath + Mudroom row ↔ Kitchen/Nook open area |
| 8 | (8850, 4300) → (8850, 5700) | Half Bath ↔ Mudroom/Laundry |
| 9 | (12200, 0) → (12200, 6100) | Main house block ↔ Garage (interior firewall; carries the Mudroom↔Garage door) |

No wall at x = 10,000 between Kitchen and Breakfast Nook — intentionally
open (see §2.3).

### 2.5 Doors & windows

| Opening | Wall / position | Width | Notes |
|---|---|---|---|
| Front Door | South wall (y=0), x ≈ 6,000 (Foyer center) | 1,000 | Single door, faces the street, sidelights optional at x≈5,400/6,600 |
| Living Room windows ×2 | South wall, x ≈ 1,300 and 3,300, y=0 | 1,200 | Double-hung |
| Dining Room windows ×2 | South wall, x ≈ 8,600 and 10,950, y=0 | 1,200 | Double-hung, symmetric front-lit dining bay |
| Living Room ↔ Foyer | (4650, y) | — | Open cased opening, y ≈ 500–1,500 |
| Dining Room ↔ Foyer | (7350, y) | — | Open cased opening, y ≈ 500–1,500 |
| Foyer ↔ Stair Hall | (x, 2400) | — | Open, no door, x ≈ 5,500–6,500 |
| Stair Hall ↔ Back Hall | (x, 6600) | — | Open, no door, x ≈ 5,300–6,700 |
| Half Bath ↔ Stair Hall | (7350, y) | 700 | Door, y ≈ 4,700–5,400 |
| Back Hall ↔ Family Room | (4650, y) | 1,200 | Open cased opening, y ≈ 7,500–8,700 |
| Back Hall ↔ Kitchen/Nook | (7350, y) | 1,200 | Open cased opening, y ≈ 7,000–8,200 |
| Mudroom ↔ Kitchen | (x, 5700) | 800 | Door, x ≈ 9,000–9,800 |
| Mudroom ↔ Garage | (12200, y) | 900 | Door, y ≈ 4,700–5,600 (the "mudroom entry") |
| Family Room rear slider | Rear (north) wall, x ≈ 2,000, y=9,900 | 1,800 | `kind: sliding`, glass door to backyard patio |
| Family Room windows | Rear wall x ≈ 4,000, y=9,900; West wall x=0, y ≈ 6,000 and 8,300 | 1,200 each | Double-hung |
| Kitchen window (over sink) | Rear wall, x ≈ 8,600, y=9,900 | 1,200 | Double-hung |
| Breakfast Nook rear window | Rear wall, x ≈ 11,100, y=9,900 | 1,500 | `kind: picture` |
| Breakfast Nook side window | East wall, x=12,200, y ≈ 8,000 | 1,200 | Double-hung (this stretch of x=12,200 is the true exterior — south of it, y<6,100, is the garage) |
| Side door (near Nook) | East wall, x=12,200, y ≈ 7,000 | 900 | Secondary/side entrance from the driveway |
| Garage bay doors ×2 | South wall of garage wing, x ≈ 13,900 and 16,600 centers | 2,400 each | `kind: garage`, 2,100 mm lintel opening |
| Garage side window | East wall, x=18,300, y ≈ 3,000 | 1,200 | Utilitarian |
| Garage rear man-door | Rear wall of garage wing, x ≈ 17,500, y=6,100 | 900 | To the side yard |

Half Bath has no exterior wall — use an exhaust fan, not a window (its
Diorama fixture equivalent is just omitted).

### 2.6 Staircase

The **Stair Hall** (x 4,650–7,350, y 2,400–6,600, a 2,700 × 4,200 mm room)
holds a switchback (dogleg) staircase, 1,100 mm-wide flights, rising from
y ≈ 2,600 (top of the Foyer) with a landing near the room's midpoint
(y ≈ 4,500) and arriving at y ≈ 6,400 (Back Hall end) — roughly 17 risers at
~178 mm rise / ~260 mm run split across the two flights. It lands **exactly
under** the second floor's Stairwell, which occupies the identical
x 4,650–7,350 / y 2,400–6,600 footprint one level up (see §3.6) — the two
floors share the same origin and spine width, so this alignment falls out
of the coordinates by construction.

---

## 3. Second Floor

### 3.1 Floor rectangle

`Floor.w = 12200, Floor.d = 9900` (mm) — same origin and footprint as the
first floor's main house block. No garage overhang.

**Note on the stairwell:** the second floor's Stairwell room (§3.3) is the
open, guard-railed landing over the stairs below — it is floor-plan
footprint, not solid walkable floor. Finished (solid) second-floor area is
≈ 1,300 − 122 = **≈ 1,178 sq ft**; the gross floor-plan total used for the
2,600 sq ft headline figure includes the stairwell footprint, matching how
the rest of this app's demo-house specs count stair openings.

### 3.2 ASCII sketch

```
y=9900  ┌───────────────┬─────┬────────────────────┐
 (rear) │               │Hall-│                    │
        │   PRIMARY     │way  │      BEDROOM 4     │
        │   BEDROOM     │     │                    │
        │               ├─────┤                    │
        ├───────┬───────┤Stair├────────┬───────────┤
        │Primary│ Walk- │well │        │  Linen /  │
        │ Bath  │  in   │(open,│ Hall  │  Storage  │
        │       │Closet │rail)│ Bath  │           │
        ├───────┴───────┼─────┼────────┴───────────┤
        │               │Land-│                    │
        │  BEDROOM 2    │ing/ │      BEDROOM 3      │
        │               │Nook │                    │
        └───────────────┴─────┴────────────────────┘
y=0                                                x=12200
(front, street side)
x=0             x=4650      x=7350
```

### 3.3 Room table (second floor)

| Room | x, y | w × d (mm) | sq ft | Purpose |
|---|---|---|---|---|
| Bedroom 2 | 0, 0 | 4,650 × 4,300 | 215.2 | Front-left secondary bedroom |
| Landing / Reading Nook | 4,650, 0 | 2,700 × 2,400 | 69.8 | Small sitting nook at the top of the stairs |
| Stairwell (open, railed) | 4,650, 2,400 | 2,700 × 4,200 | 122.1 | Open to below — guardrail, not solid floor |
| Upstairs Hallway | 4,650, 6,600 | 2,700 × 3,300 | 95.9 | Connects all four bedrooms |
| Bedroom 3 | 7,350, 0 | 4,850 × 4,300 | 224.5 | Front-right secondary bedroom |
| Hall Bath | 7,350, 4,300 | 2,600 × 1,400 | 39.2 | Shared bath, stacked over the Half Bath below |
| Linen / Storage Closet | 9,950, 4,300 | 2,250 × 1,400 | 33.9 | Interior, accessed through Hall Bath |
| Primary Bedroom | 0, 5,700 | 4,650 × 4,200 | 210.2 | Rear-left, over the Family Room |
| Primary Bathroom | 0, 4,300 | 2,650 × 1,400 | 39.9 | En-suite, accessed from Primary Bedroom |
| Primary Walk-in Closet | 2,650, 4,300 | 2,000 × 1,400 | 30.1 | En-suite, accessed from Primary Bedroom |
| Bedroom 4 | 7,350, 5,700 | 4,850 × 4,200 | 219.3 | Rear-right secondary bedroom, over Kitchen/Nook |

**Second-floor total:** 215.2 + 69.8 + 122.1 + 95.9 + 224.5 + 39.2 + 33.9 +
210.2 + 39.9 + 30.1 + 219.3 = **≈ 1,300 sq ft**, matching the floor rectangle
(12,200 × 9,900 mm = 1,300.0 sq ft) with no gaps — including the 122.1 sq ft
open Stairwell, per the note above.

**Grand total heated area:** ≈ 1,300 + 1,300 ≈ **2,600 sq ft**, matching the
overview target. Garage (≈ 401 sq ft) is additional and unheated.

### 3.4 Wall layout

Same 100 mm walls, 2,743 mm height, exterior perimeter identical to the
first floor's main-block loop: `(0,0)→(12200,0)→(12200,9900)→(0,9900)→(0,0)`.

| # | Points (mm) | Separates |
|---|---|---|
| 1 | (4650, 0) → (4650, 9900) | Bedroom 2/Primary suite ↔ Landing/Stairwell/Hallway (matches 1F wall #1) |
| 2 | (7350, 0) → (7350, 9900) | Landing/Stairwell/Hallway ↔ Bedroom 3/Hall Bath+Linen/Bedroom 4 (matches 1F wall #2) |
| 3 | (4650, 2400) → (7350, 2400) | Landing/Reading Nook ↔ Stairwell |
| 4 | (4650, 6600) → (7350, 6600) | Stairwell ↔ Upstairs Hallway — **`kind: railing`**, the open guardrail over the stair, not a solid wall |
| 5 | (0, 4300) → (4650, 4300) | Bedroom 2 ↔ Primary Bath/Walk-in Closet row |
| 6 | (0, 5700) → (4650, 5700) | Primary Bath/Walk-in Closet row ↔ Primary Bedroom |
| 7 | (2650, 4300) → (2650, 5700) | Primary Bathroom ↔ Primary Walk-in Closet |
| 8 | (7350, 4300) → (12200, 4300) | Bedroom 3 ↔ Hall Bath/Linen row |
| 9 | (7350, 5700) → (12200, 5700) | Hall Bath/Linen row ↔ Bedroom 4 |
| 10 | (9950, 4300) → (9950, 5700) | Hall Bath ↔ Linen/Storage Closet |

### 3.5 Doors & windows

| Opening | Wall / position | Width | Notes |
|---|---|---|---|
| Bedroom 2 windows ×2 | South wall x ≈ 1,300 and 3,300, y=0 | 1,200 | Matches Living Room below |
| Bedroom 3 windows ×2 | South wall x ≈ 8,600 and 10,950, y=0 | 1,200 | Matches Dining Room below |
| Primary Bedroom windows ×2 | Rear wall x ≈ 1,500 and 3,500, y=9,900 | 1,200 | Matches Family Room below |
| Primary Bedroom side window | West wall x=0, y ≈ 7,500 | 1,200 | |
| Primary Bathroom window | West wall x=0, y ≈ 5,000 | 900 | Frosted/privacy glass (cosmetic — Diorama has no glass-opacity field) |
| Bedroom 4 windows ×2 | Rear wall x ≈ 8,600 and 10,950, y=9,900 | 1,200 | Matches Kitchen/Nook below |
| Bedroom 4 side window | East wall x=12,200, y ≈ 7,500 | 1,200 | Matches Nook side window below |
| Bedroom 2 door | (4650, y) | 900 | y ≈ 1,500–2,400, off Landing/Reading Nook |
| Bedroom 3 door | (7350, y) | 900 | y ≈ 1,500–2,400, off Landing/Reading Nook |
| Primary Bedroom door | (4650, y) | 900 | y ≈ 7,800–8,700, off Upstairs Hallway |
| Bedroom 4 door | (7350, y) | 900 | y ≈ 7,800–8,600, off Upstairs Hallway |
| Primary Bathroom door | (x, 5700) | 700 | x ≈ 1,000–1,700, off Primary Bedroom |
| Primary Walk-in Closet door | (x, 5700) | 700 | x ≈ 3,200–3,900, off Primary Bedroom |
| Hall Bath door | (7350, y) | 700 | y ≈ 4,700–5,400, off Upstairs Hallway — stacked directly over the Half Bath door below (shared plumbing wall) |
| Linen Closet door | (9950, y) | 700 | y ≈ 4,700–5,400, off Hall Bath (in-bathroom linen storage) |
| Landing/Reading Nook ↔ Stairwell | (x, 2400) | — | Open, no door |
| Stairwell guardrail | (x, 6600), x 4,650–7,350 | — | `railing`-kind wall (see wall #4) — the overlook rail, not a solid partition |

---

## 4. Furnishing per room

Positions are approximate item **centers** in mm, world frame. `kind` names
are Diorama `FurnitureKind`s. Rotation follows the header convention (0° =
front faces −Y). Nudge ±90/180° on placement to match the wall each piece
actually backs onto — the values below indicate intent, not gospel.

### First floor

**Living Room** (front-left, 0,0 – 4650,4300)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| sofa | 1,600, 1,200 | 180° | Back near south wall, faces into the room |
| armchair | 3,600, 1,500 | 225° | Angled toward sofa |
| coffee_table | 2,300, 1,900 | 0° | Between sofa and TV wall |
| tv_stand | 2,325, 3,900 | 180° | Against north (interior) wall |
| tv | 2,325, 3,950 | 180° | On the stand |
| bookshelf | 200, 900 | 90° | Against west exterior wall |
| rug | 2,300, 1,900 (2,600×1,700) | 0° | Under coffee table |
| plant | 300, 3,900 | 0° | Corner accent |

**Foyer** (4650,0 – 7350,2400)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| bench | 4,850, 700 | 90° | Entry bench, against west wall |
| rug | 6,000, 1,200 (1,200×2,000) | 0° | Runner in front of the door |
| plant | 7,150, 2,200 | 0° | Corner accent |

**Stair Hall** (4650,2400 – 7350,6600)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| stairs | 6,000, 4,500 | 0° | Switchback run, see §2.6; footprint ≈ 1,100×3,800 |
| bench | 4,850, 6,300 | 90° | Small landing bench near Half Bath door |

**Back Hall** (4650,6600 – 7350,9900)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| bookshelf | 4,850, 9,600 | 0° | Against rear wall |
| rug | 6,000, 8,000 (1,200×2,400) | 0° | Runner |

**Dining Room** (front-right, 7350,0 – 12200,4300)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| dining_table | 9,775, 2,150 | 0° | ~1,800 × 1,000 |
| chair ×6 | (8,950,1,650) (9,775,1,650) (10,600,1,650) (8,950,2,650) (9,775,2,650) (10,600,2,650) | facing table (0°/180°) | 3 per long side |
| cabinet | 7,550, 1,200 | 90° | China cabinet against west wall |
| rug | 9,775, 2,150 (2,700×1,900) | 0° | Under table |
| plant | 11,950, 3,950 | 0° | Corner accent |

**Half Bath** (7350,4300 – 8850,5700)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| toilet | 7,550, 4,500 | 90° | Back to west wall |
| sink | 8,650, 5,500 | 180° | Pedestal, against north wall |

**Mudroom / Laundry** (8850,4300 – 12200,5700)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| washer | 11,700, 4,500 | 0° | Near the garage door |
| dryer | 12,050, 4,500 | 0° | Beside washer |
| bench | 9,300, 4,500 | 0° | Boot/coat bench |
| cabinet | 9,300, 5,500 | 180° | Cubby storage |

**Family Room** (rear-left, 0,4300 – 4650,9900)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| sectional | 1,400, 5,600 | 0° | Anchors the casual seating area |
| coffee_table | 2,100, 6,500 | 0° | |
| armchair | 3,900, 5,900 | 270° | |
| tv_stand | 2,325, 8,900 | 180° | Against rear wall |
| tv | 2,325, 8,950 | 180° | |
| bookshelf | 200, 8,600 | 0° | West wall, near the slider |
| rug | 2,200, 6,600 (3,000×2,400) | 0° | |
| plant | 4,400, 8,900 | 0° | Corner by the slider |
| fireplace (light fixture) | 200, 6,750 | 90° | Wall-snapped to west wall, `LightIconKind: fireplace` |

**Kitchen** (west zone of the open room, 7350,5700 – 10000,9900)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| counter | 7,550, 6,900 | 90° | Run along west (spine) wall |
| counter | 8,700, 5,900 | 0° | Run along south wall |
| stove | 8,900, 5,900 | 0° | In the south counter run |
| microwave | 8,400, 6,000 | 0° | Mountable, over/near the stove |
| dishwasher | 9,300, 5,900 | 0° | Beside the sink |
| sink | 8,600, 9,700 | 180° | Under the rear window |
| island | 9,000, 7,800 | 0° | Center island, faces the nook |
| fridge | 7,550, 9,300 | 90° | Corner near the Nook opening |
| cabinet | 7,550, 8,200 | 90° | Upper storage run |

**Breakfast Nook** (east zone of the open room, 10000,5700 – 12200,9900)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| table | 11,100, 8,000 | 0° | Round breakfast table |
| chair ×4 | (10,600,7,600) (11,600,7,600) (10,600,8,400) (11,600,8,400) | facing table | |
| plant | 11,900, 6,200 | 0° | By the side window |

**Garage**

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| cabinet | 17,900, 900 | 270° | Storage against east wall |
| desk (as workbench) | 12,400, 3,000 | 90° | Against the shared house wall |
| bookshelf (as shelving) | 17,900, 5,300 | 270° | Bins/sports-gear shelving |

### Second floor

**Bedroom 2** (0,0 – 4650,4300)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| bed (queen) | 1,700, 1,100 | 180° | Headboard to south (front) wall |
| nightstand | 700, 700 | 180° | |
| nightstand | 2,700, 700 | 180° | |
| dresser | 300, 3,600 | 90° | Against west wall |
| desk | 3,900, 3,600 | 270° | |
| rug | 1,700, 2,300 (1,800×1,400) | 0° | |

**Landing / Reading Nook** (4650,0 – 7350,2400)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| armchair | 5,200, 700 | 90° | |
| bookshelf | 4,850, 1,800 | 90° | Against west wall |
| rug | 6,000, 1,200 (1,200×2,000) | 0° | |

**Stairwell** — no furniture (open guardrail landing over the stairs).

**Upstairs Hallway** (4650,6600 – 7350,9900)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| bookshelf | 4,850, 9,600 | 0° | Linen/display, against rear wall |
| rug | 6,000, 8,000 (1,200×2,400) | 0° | Runner |

**Bedroom 3** (7350,0 – 12200,4300)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| bed (full) | 8,750, 3,600 | 180° | Headboard to east partition side |
| nightstand | 7,750, 3,600 | 180° | |
| dresser | 11,700, 700 | 0° | Against south wall |
| desk | 7,750, 700 | 0° | Study nook |
| rug | 8,750, 3,000 (1,600×1,300) | 0° | |

**Hall Bath** (7350,4300 – 9950,5700)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| toilet | 7,550, 4,500 | 90° | Directly above the Half Bath toilet |
| sink | 9,600, 5,500 | 180° | Vanity |
| bathtub | 8,600, 5,500 | 180° | Tub/shower combo along north wall |

**Linen / Storage Closet** (9950,4300 – 12200,5700)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| cabinet | 11,100, 5,000 | 0° | Built-in shelving stand-in |

**Primary Bedroom** (0,5700 – 4650,9900)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| bed (king) | 2,325, 8,700 | 0° | Headboard to rear wall |
| nightstand | 1,000, 8,700 | 0° | |
| nightstand | 3,650, 8,700 | 0° | |
| dresser | 300, 6,300 | 90° | Against west wall |
| armchair | 4,300, 6,300 | 270° | Reading corner near the side window |
| ottoman | 2,325, 7,200 | 0° | Foot-of-bed bench substitute |
| rug | 2,325, 7,800 (2,700×2,100) | 0° | |

**Primary Bathroom** (0,4300 – 2650,5700)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| toilet | 400, 4,500 | 90° | |
| sink | 300, 5,300 | 90° | Vanity against west wall (double-sink stand-in) |
| bathtub | 1,900, 4,500 | 0° | Along south wall |
| shower | 2,300, 5,400 | 270° | Corner enclosure |

**Primary Walk-in Closet** (2650,4300 – 4650,5700)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| wardrobe | 2,850, 5,000 | 90° | Along west side |
| wardrobe | 4,450, 5,000 | 270° | Along east side |
| dresser | 3,650, 4,450 | 0° | Center island-style, against south wall |

**Bedroom 4** (7350,5700 – 12200,9900)

| Item (kind) | x, y | Rotation | Notes |
|---|---|---|---|
| bed (queen) | 8,700, 8,700 | 0° | Headboard to rear wall |
| nightstand | 7,700, 8,700 | 0° | |
| nightstand | 9,700, 8,700 | 0° | |
| dresser | 11,700, 6,300 | 90° | Against east wall |
| desk | 7,700, 6,300 | 90° | |
| rug | 8,700, 8,000 (1,800×1,400) | 0° | |

---

## 5. Skinning / appearance

Diorama's `Scene3D` material fields (`floorTex`, `floorColor`, `wallColor`)
are set per floor via `Store.scene3d` and overridable per room-group only
through `Floor.look3d` (whole-floor, not per-room) — the table below states
the intended per-room finish; where a floor genuinely needs two different
textures, either accept the whole-floor default with rugs carrying the
visual distinction (as done for the carpeted bedrooms below), or split that
floor into the finish that dominates by area and treat the rest as an
accent-rug compromise, which is the approach this spec takes throughout.

| Area | `floorTex` | `floorColor` | `wallColor` | Notes |
|---|---|---|---|---|
| Foyer, Stair Hall, Back Hall, Landing/Nook, Upstairs Hallway | `wood` | `#b8875a` (medium oak) | `#f3ecd9` (warm cream) | Continues the main-floor oak up the stairs |
| Living Room | `wood` | `#b8875a` | `#b9cdd6` (soft colonial blue) | |
| Dining Room | `wood` | `#b8875a` | `#7d8f6b` (deep sage green) | |
| Family Room | `wood` | `#b8875a` | `#d9c7a8` (warm taupe) | |
| Kitchen + Breakfast Nook | `tile` | `#e6ddc8` (warm travertine) | `#f7f4ec` (crisp white) | One open room — same finish both zones |
| Half Bath, Hall Bath, Primary Bathroom | `tile` | `#ece5d6` (soft ivory) | `#e7efe9` (pale seafoam) | |
| Mudroom / Laundry | `tile` | `#d7d3c8` | `#f0ede3` | Utility grey-white |
| Garage | `concrete` | `#b6b6b0` | `#e5e2da` | Bare, utilitarian |
| Bedroom 2 | `none` (flat color, stands in for carpet — Diorama has no dedicated carpet texture) | `#cdb996` (warm taupe carpet tone) | `#f1e9c9` (soft yellow) | |
| Bedroom 3 | `none` | `#cdb996` | `#d9e4d3` (soft green) | |
| Bedroom 4 | `none` | `#cdb996` | `#d3e0ea` (soft blue) | |
| Primary Bedroom, Primary Bathroom accent, Walk-in Closet | `none` | `#d7dee2` (soft blue-grey carpet tone) | `#dce6ea` (soft blue-grey) | Primary suite gets its own cooler tone |
| Linen / Storage Closet | `none` | `#cdb996` | `#f2ead9` | |

Set the house-wide baseline via `Store.scene3d` (`floorTex: 'wood'`,
`floorColor: '#b8875a'`, `wallColor: '#f3ecd9'`) and use `Floor.look3d` for
the tile-vs-wood-vs-concrete split per floor if your build supports
per-floor overrides; per-room wall-color variety (blue Living Room, sage
Dining Room, etc.) is a stylistic layer on top that Diorama doesn't model
structurally — call it out as intent for whoever paints/textures the scene,
or approximate it with room-colored rugs and furniture upholstery if literal
per-room wall tinting isn't available in your build.

Lighting preset: `scene3d.preset: 'day'` for a bright walkthrough demo, or
`'dusk'`/`'night'` to show off the sconce/pendant/lamp fixtures below with
the toon lighting doing more of the work.

---

## 6. Reconstruction notes

- **Room naming convention:** name rooms exactly as in §2.3/§3.3
  (`Kitchen`, `Breakfast Nook`, `Family Room`, `Primary Bedroom`, etc.) — the
  substring **"kitchen"** (case-insensitive) in a room name is what gates
  Diorama's kitchen-time-of-day thought-bubble behaviors, so keep "Kitchen"
  literally in that room's name, and remember it's one of the **two anchors**
  inside the shared Kitchen/Breakfast Nook wall loop (§2.3).
- **Alignment check:** both floors share the exact same origin and the same
  2,700 mm-wide central spine (x 4,650–7,350). Build the first floor's main
  block first, then reuse its outer wall loop (minus the garage wing) as the
  second floor's perimeter before drawing the different interior
  partitions — this guarantees the staircase, spine walls, and exterior
  walls stack correctly between floors. As a bonus, the Half Bath (1F) and
  Hall Bath (2F) share the same x 7,350–8,850(ish) footprint, so their
  plumbing fixtures stack — a nice touch if you're modeling realism into
  the fixture placement.
- **Staircase footprint parity:** the Stair Hall (1F, x 4,650–7,350,
  y 2,400–6,600) and the Stairwell (2F, identical rectangle) occupy the same
  x/y footprint on purpose. Model the 2F room's south-facing boundary
  (wall #4 in §3.4) as a `railing`-kind wall (open guardrail) rather than a
  `full` wall so it reads as an overlook down the stairwell, not a solid
  partition; the other three sides of the Stairwell room (the two spine
  walls plus the Landing boundary) stay `full` since they back bedrooms
  and the reading nook.
- **Sensor / light suggestions:** one mmWave (LD2450) sensor in the Family
  Room (covers the busiest casual space, plus sight into the Back Hall) and
  one in the Kitchen/Nook area; binary motion sensors in the Foyer, both
  hallway segments (Stair Hall/Back Hall and the Upstairs Hallway), and the
  Garage. A ceiling `bulb` per bedroom + Living/Dining/Family Room, a
  `pendant` over the kitchen island, a `sconce` pair flanking the front
  door, a `strip` under the kitchen's upper cabinets, and a `lamp` beside
  the Primary Bedroom's nightstand round out the "lived-in" feel. A
  `fireplace` fixture (already placed in §4's Family Room table) makes a
  good west-wall anchor for evening activity/thought-bubble behavior.
- **Scale sanity check:** secondary bedrooms run 4,300–4,850 mm on their
  long side (14'1"–15'11"), matching the brief's "US bedroom ≈
  3,000–4,000 mm" guidance on the shorter axis (4,650/4,850 mm here reads
  as generous-but-plausible for a builder-grade colonial, not oversized);
  the center spine (Foyer/Stair Hall/Back Hall/Landing/Hallway) is
  2,700 mm wide, comfortably above the 1,000–1,200 mm "hallway" range
  because it's also the stair run, not a pure corridor; doors run
  700–1,000 mm (28"–39", standard interior/exterior range); the garage's
  2,400 mm bay-door width matches Diorama's own `garage` door-kind default.
  Room-table sums reconcile exactly against both floor rectangles (§2.3,
  §3.3): 1,300.0 sq ft first floor, 1,300.0 sq ft second floor (of which
  122.1 sq ft is the open stairwell, per §3.1), for a **2,600 sq ft**
  grand total, plus 400.7 sq ft of unheated garage.
- **Doors' hinge point:** a `Door`'s stored `(x, y)` is its **hinge**, not
  its center — when placing the door items listed in §2.5/§3.5, offset by
  roughly half the door width along the wall from the given approximate
  center so the swing lands correctly (`doorSpanCenter` handles this
  automatically if you're placing via the Diorama UI rather than raw data).
- **Garage roofline:** since the second floor's rectangle stops at
  x = 12,200 (no garage overhang), the garage roof is implicitly a lower,
  separate structure — no special handling needed in Diorama; it's simply
  a first-floor-only wing sharing one exterior wall loop with the house.
- **What's not modeled:** roofline/attic, exterior siding/brick/shutters,
  HVAC ductwork, a literal carpet texture (simulated with `floorTex: 'none'`
  + warm flat colors + area rugs, per §5), and a driveway (the unbuilt
  side-yard notch beside the garage, §2.1, is where it would go).
