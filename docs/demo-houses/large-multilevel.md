# Demo House: "Aldergate" — Large Multilevel Luxury Home

A reconstruction-ready build spec for a Diorama demo house. All coordinates
are **world millimeters**, origin `(0,0)` at the **south-west (bottom-left)**
corner of each floor's rectangle, `+X` = east (right), `+Y` = north (up/back).
Every one of the three levels uses the **identical floor rectangle**
(`w = 19200, d = 9750`) so exterior walls and the stair core line up exactly
when the floors are stacked — this is what "aligned footprints" means in
practice for Diorama, since each `Floor` is its own independent rectangle
with its own local origin.

## 1. Overview

- **Style**: Transitional-craftsman luxury spec home — gabled roofline (not
  modeled; Diorama is a plan-view app), stone-and-siding exterior, wide
  overhangs. Interior reads as "new-build luxury": tall ceilings on the main
  level, an open kitchen/breakfast/great-room core, a hotel-style primary
  suite upstairs, and a full finished basement built for entertaining
  (theater, bar, game room, guest suite, gym).
- **Levels**: 3 — Main Level (entry, living/entertaining, kitchen, garage),
  Upper Level (bedrooms, laundry), Finished Basement (media, rec, gym,
  guest suite, mechanical).
- **Footprint per floor**: `19200 mm × 9750 mm` (63′0″ × 32′0″) — a
  **2,015 sq ft** bounding rectangle per level, repeated on all three floors
  (6,045 sq ft of building footprint stacked three high).
- **Total finished living area**: **≈4,590 sq ft (≈427 m²)** — Main
  1,503 sq ft (heated, excludes garage) + Upper 2,016 sq ft (fully heated,
  no voids) + Basement 1,074 sq ft finished (excludes mechanical/storage).
  Plus a 511 sq ft attached 3-car garage (unheated) and 941 sq ft of
  unfinished basement mechanical/storage — see §7 for the full reconciliation.
- **Feel**: Arrive through a two-story-feeling foyer flanked by a home office
  and a formal living room that flows into a formal dining room across the
  front of the house. The back half of the main level is one open
  entertaining volume — island kitchen, breakfast room, and a big great room
  with a fireplace wall — with a mudroom/pantry service path tucked behind
  the 3-car garage. Upstairs is a private, hotel-quiet wing: a primary suite
  with a sitting room, spa bath, and his/hers closets, plus three more
  bedrooms (two en-suite) and a real laundry room. Downstairs is the fun
  floor: home theater, wet bar, pool-table game room, home gym, and a guest
  suite for visitors, with the mechanical/storage zone tucked under the
  garage footprint where no one has to look at it.

---

## 2. Main Level

**Floor rectangle**: `w = 19200 mm, d = 9750 mm` (63′0″ × 32′0″).

The floor divides into two side-by-side blocks:
- **West wing** (`x: 0–7200`, full depth) — 3-car garage (south) + mudroom /
  powder room (north).
- **Core** (`x: 7200–19200`, width 12000) — the house proper, split into a
  **front band** (`y: 0–4200`, facing the street) and a **rear band**
  (`y: 4200–9750`, the open kitchen/breakfast/great-room + service core).

### 2.1 ASCII sketch (north up, not to exact scale)

```
y=9750 (rear / back of lot) ────────────────────────────────────────────────
        ┌───────────┬───────┬───────────────────────┬─────────────────────┐
        │           │       │                       │                     │
        │  MUDROOM  │POWDER │      GREAT ROOM        │                     │
        │           │  RM   │   (open to kitchen)    │                     │
        │           ├───────┤                       │                     │
y=6600  ├───────────┴───┬───┼───────┬───────┬───────┤   (GREAT ROOM cont.) │
        │               │   │KITCHEN│BREAKFST│      │                     │
        │               │ S │       │  ROOM  │      │                     │
        │   GARAGE      │ T ├───────┴───────┴───────┤                     │
        │  (3-car)      │ A │                       │                     │
        │               │ I │      (open plan)       │                    │
        │               │ R │                        │                    │
        │               │   │                        │                    │
y=4200  │               │ H ├───────┬───────┬───────┬┴─────────────────────┤
        │               │ A │       │       │       │                     │
        │               │ L │OFFICE │ FOYER │ LIVING │      DINING         │
        │               │ L │       │       │  ROOM  │      ROOM           │
        │               │   │       │       │       │                     │
y=0     └───────────────┴───┴───────┴───────┴───────┴─────────────────────┘
        x=0          x=7200  x=9700 x=12200        x=15700              x=19200
        (front of house / street side)
```

### 2.2 Room table

| Room | Rect (x, y, w, d mm) | Sq ft | Purpose |
|---|---|---|---|
| Garage (3-car) | 0, 0, 7200, 6600 | 511 | Attached 3-car garage, unheated |
| Mudroom | 0, 6600, 4200, 3150 | 142 | Garage/back-door entry, bench + coat storage |
| Powder Room | 4200, 6600, 2000, 2000 | 43 | Half bath off mudroom |
| (unlabeled hall/closet) | 4200–7200, 8600–9750 & 6200–7200, 6600–8600 | 59 | Circulation / coat closet |
| Home Office | 7200, 0, 2500, 4200 | 113 | Study, street-facing |
| Foyer | 9700, 0, 2500, 4200 | 113 | Front entry |
| Living Room | 12200, 0, 3500, 4200 | 158 | Formal living |
| Dining Room | 15700, 0, 3500, 4200 | 158 | Formal dining |
| Pantry | 7200, 4200, 2500, 2000 | 54 | Walk-in pantry, off mudroom path |
| Back Hall | 7200, 6200, 2500, 3550 | 96 | Mudroom ↔ Stair Hall ↔ Pantry link |
| Stair Hall | 9700, 4200, 2500, 5550 | 149 | Stairs up (to Upper) + landing (top of Basement stair) |
| Kitchen | 12200, 4200, 4500, 2400 | 116 | Gourmet kitchen + island |
| Breakfast Room | 16700, 4200, 2500, 2400 | 65 | Casual eat-in nook |
| Great Room | 12200, 6600, 7000, 3150 | 237 | Family/entertaining room, open to kitchen |

Main heated total: **1,503 sq ft**. Plus garage 511 sq ft (unheated) =
2,014 sq ft ≈ the 2,015 sq ft floor rectangle. ✓

### 2.3 Wall layout

**Exterior perimeter** (one closed `Wall`, `kind: 'full'`):
`(0,0) → (19200,0) → (19200,9750) → (0,9750) → (0,0)`

**Interior partitions** (each its own `Wall`, `kind: 'full'` unless noted):

| # | From (x,y) | To (x,y) | Notes |
|---|---|---|---|
| 1 | 7200, 0 | 7200, 9750 | West wing / core divider |
| 2 | 0, 6600 | 7200, 6600 | Garage / mudroom-wing divider |
| 3 | 4200, 6600 | 4200, 9750 | Mudroom / powder+hall divider |
| 4 | 6200, 6600 | 6200, 9750 | Powder Room / leftover hall divider |
| 5 | 9700, 0 | 9700, 4200 | Office / Foyer divider |
| 6 | 12200, 0 | 12200, 4200 | Foyer / Living Room divider — **open archway, no door panel** |
| 7 | 15700, 0 | 15700, 4200 | Living / Dining divider — **open archway, no door panel** |
| 8 | 9700, 4200 | 9700, 9750 | Pantry+BackHall / Stair Hall divider |
| 9 | 12200, 4200 | 12200, 9750 | Stair Hall / Kitchen-Breakfast-GreatRoom divider |
| 10 | 16700, 4200 | 16700, 6600 | Kitchen / Breakfast divider |
| 11 | 7200, 4200 | 9700, 4200 | Office / Pantry divider |
| 12 | 12200, 4200 | 19200, 4200 | Living+Dining / Kitchen+Breakfast divider |
| 13 | 7200, 6200 | 9700, 6200 | Pantry / Back Hall divider |
| — | 12200, 6600 | 19200, 6600 | **NOT built** — open-concept pass between Kitchen/Breakfast and Great Room |

Foyer ↔ Stair Hall needs no wall at all — both occupy the identical
`x: 9700–12200` column, one above the other; they're already one open
volume front-to-back.

### 2.4 Doors & windows

| Item | Kind | Position (hinge/center) | w (mm) | Wall | Notes |
|---|---|---|---|---|---|
| Front Door | swing | 10650, 0 | 900 | south (foyer) | Entry |
| Garage Door 1 | garage | 300, 0 | 2300 | south | |
| Garage Door 2 | garage | 2700, 0 | 2300 | south | |
| Garage Door 3 | garage | 5100, 0 | 2300 | south | 3 bays total |
| Garage → Mudroom | swing | 2000, 6600 | 900 | wall #2 | |
| Mudroom exterior | swing | 0, 8000 | 900 | west (rot 90) | side-yard door |
| Mudroom → hall | swing | 7200, 8000 | 900 | wall #1 (rot 90) | |
| Powder Room | swing | 6200, 7600 | 800 | wall #4 (rot 90) | |
| Office | swing | 9700, 2100 | 800 | wall #5 (rot 90) | |
| Pantry → Back Hall | swing | 8450, 6200 | 800 | wall #13 | |
| Back Hall → Stair Hall | swing | 9700, 8000 | 900 | wall #8 (rot 90) | |
| Stair Hall → Great Room | swing | 12200, 8000 | 1200 | wall #9 | wide social opening |
| Dining → Kitchen | swing | 16200, 4200 | 900 | wall #12 | butler pass-through |
| Kitchen ↔ Breakfast | swing | 16700, 5400 | 1200 | wall #10 | wide opening |
| Great Room patio doors | swing (×2) | 15500, 9750 | 1800 | north (rot 0) | French doors to backyard |

Windows (representative set; extend the pattern along remaining exterior
wall for additional openings):

| Room | Position (center) | w | Wall | Kind | Sill/Height |
|---|---|---|---|---|---|
| Office | 8450, 0 | 1200 | south | double_hung | 900/1200 |
| Living Room | 13950, 0 | 1800 | south | picture | 700/1500 |
| Dining Room | 17450, 0 | 1800 | south | picture | 700/1500 |
| Breakfast Room | 19200, 5400 | 1500 | east (rot 90) | casement_pair | 900/1200 |
| Great Room | 13000, 9750 | 2000 | north | picture | 700/1800 |
| Great Room | 17500, 9750 | 1800 | north | picture | 700/1500 |
| Mudroom | 2000, 9750 | 1000 | north | single | 1200/900 |
| Garage | 0, 3000 | 900 | west (rot 90) | single | 1500/900 |

### 2.5 Staircase

The Stair Hall (`x:9700–12200, y:4200–9750`) is the vertical circulation
spine for all 3 levels, split into two 1250 mm-wide lanes:

- **West lane** (`x:9700–10950`): the **top** of the Basement→Main stair.
  The physical `stairs` flight is modeled on the **Basement** floor (rises
  north into this landing); Main level gets a `stair_landing` piece here.
- **East lane** (`x:10950–12200`): the Main→Upper stair. The `stairs`
  flight is modeled on the **Main** floor (this level), rising north into
  the Upper level's landing.

---

## 3. Upper Level

**Floor rectangle**: identical to Main — `w = 19200, d = 9750`.

Same west-wing / core split as Main, but the west wing now holds two
secondary bedrooms (it sits over the garage), and the core rearranges into
the primary suite + two more bedrooms + laundry, all served by a single
connected hallway spine.

### 3.1 ASCII sketch

```
y=9750 ─────────────────────────────────────────────────────────────────────
       ┌──────────┬──┬──────────┬─────────────────────────────────────────┐
       │          │  │ CLOSET / │                                          │
       │ BEDROOM 5│  │  LINEN   │              LOFT / BONUS                │
       │          │U │          │                                          │
y=6000 ├──────────┤P ├──────────┼───────────┬─────────┬─────────┬─────────┤
       │ BEDROOM 4│P │          │  PRIMARY   │         │ BEDROOM │BATH/CLST│
       │ CLOSET   │E │ LAUNDRY  │  CLOSETS   │         │    3    │    3    │
y=4600 ├──────────┤R ├──────────┤            │         │         │         │
       │          │  │HALL BATH│ SPA BATH   │ STAIR   ├─── UPPER HALLWAY ──┤
y=4200 │          │H ├──────────┼────────────┤ HALL /  │                   │
       │ BEDROOM 4│A │  (hall  │            │ LANDING │                   │
       │          │L │  link)  │            │         │                   │
       │          │L │          │            │         │                   │
       ├──────────┤  ├──────────┼────────────┼─────────┼─────────┬─────────┤
y=0    │          │  │          │  PRIMARY   │ PRIMARY │ BEDROOM │BATH2 /  │
       │ (cont.)  │  │  (cont.) │  BEDROOM   │SITTING  │    2    │ CLOSET2 │
       └──────────┴──┴──────────┴────────────┴─────────┴─────────┴─────────┘
      x=0      x=3400 x=4400  x=7200      x=9700    x=12200   x=14200 x=17200 x=19200
```

### 3.2 Room table

| Room | Rect (x, y, w, d mm) | Sq ft | Purpose |
|---|---|---|---|
| Bedroom 4 (secondary) | 0, 0, 3400, 4600 | 168 | Secondary bedroom |
| Bedroom 4 Closet | 0, 4600, 3400, 1400 | 51 | Reach-in closet |
| Bedroom 5 (secondary) | 0, 6000, 3400, 3750 | 137 | Secondary bedroom |
| Upper Hall (spine) | 3400, 0, 1000, 9750 | 105 | North-south corridor, west wing |
| Hall Bath | 4400, 0, 2000, 2600 | 56 | Shared bath for Bed 4 & 5 |
| Laundry Room | 4400, 2600, 2000, 2000 | 43 | Washer/dryer |
| Hall Link | 4400, 4600, 2800, 700 | 21 | East-west connector to core |
| Bedroom 5 Closet & Linen | 4400, 5300, 2000, 4450 | 96 | Closet + linen storage |
| Storage/Linen (west sliver) | 6400, 0, 800, 9750 | 78 | Additional storage, split by Hall Link |
| Primary Bedroom | 7200, 0, 4500, 4200 | 203 | Primary suite bedroom |
| Primary Sitting Area | 11700, 0, 2500, 4200 | 113 | Sitting room / suite anteroom |
| Bedroom 2 (secondary, en-suite) | 14200, 0, 3000, 4200 | 136 | Secondary bedroom |
| Bedroom 2 Bath | 17200, 0, 2000, 2400 | 52 | En-suite |
| Bedroom 2 Closet | 17200, 2400, 2000, 1800 | 39 | Closet |
| West Hall Connector | 7200, 4200, 2500, 1100 | 30 | Links Upper Hall spine to Stair Hall |
| Primary Spa Bath | 7200, 5300, 2500, 1600 | 43 | Wet area (tub/shower/vanity/toilet) |
| Primary Closets (his + hers) | 7200, 6900, 2500, 2850 | 77 | Dual walk-ins |
| Stair Hall / Landing | 9700, 4200, 2500, 5550 | 149 | Top of Main→Upper stair; main corridor |
| Upper Hallway (east spur) | 12200, 4200, 7000, 1100 | 83 | Connects Stair Hall to Bed 2/3 wing |
| Bedroom 3 (secondary, en-suite) | 12200, 5300, 4500, 3200 | 155 | Secondary bedroom |
| Bedroom 3 Bath | 16700, 5300, 2500, 2100 | 57 | En-suite |
| Bedroom 3 Closet | 16700, 7400, 2500, 1100 | 30 | Closet |
| Loft / Bonus Room | 12200, 8500, 7000, 1250 | 94 | Reading nook / flex space |

Upper heated total: **≈2,016 sq ft** (whole floor — no unfinished space).

### 3.3 Wall layout (interior; exterior perimeter identical to Main)

| # | From | To | Notes |
|---|---|---|---|
| 1 | 7200,0 | 7200,9750 | West wing / core divider |
| 2 | 3400,0 | 3400,9750 | Bedroom4/5 column / Upper Hall spine |
| 3 | 4400,0 | 4400,9750 | Upper Hall spine / Bath-Laundry-Closet column (open at the Hall Link, y 4600–5300) |
| 4 | 6400,0 | 6400,9750 | Storage sliver divider (open at the Hall Link, y 4600–5300) |
| 5 | 0,4600 | 3400,4600 | Bedroom 4 / Bedroom 4 Closet |
| 6 | 0,6000 | 3400,6000 | Bedroom 4 Closet / Bedroom 5 |
| 7 | 4400,2600 | 6400,2600 | Hall Bath / Laundry |
| 8 | 4400,5300 | 6400,5300 | Laundry+Link / Closet&Linen |
| 9 | 11700,0 | 11700,4200 | Primary Bedroom / Sitting |
| 10 | 14200,0 | 14200,4200 | Sitting / Bedroom 2 |
| 11 | 17200,0 | 17200,4200 | Bedroom 2 / Bath2+Closet2 |
| 12 | 17200,2400 | 19200,2400 | Bath2 / Closet2 |
| 13 | 9700,4200 | 9700,9750 | West Hall Connector+SpaBath+Closets / Stair Hall |
| 14 | 7200,5300 | 9700,5300 | Connector / Spa Bath |
| 15 | 7200,6900 | 9700,6900 | Spa Bath / Primary Closets |
| 16 | 12200,4200 | 12200,9750 | Stair Hall / east wing (Hallway-Bed3-Loft) |
| 17 | 12200,5300 | 19200,5300 | Upper Hallway / Bedroom3+Bath3+Closet3 row |
| 18 | 16700,4200 | 16700,8500 | Bedroom 3 / Bath3+Closet3 |
| 19 | 16700,7400 | 19200,7400 | Bath 3 / Closet 3 |
| 20 | 12200,8500 | 19200,8500 | Bedroom3/Bath3/Closet3 row / Loft |
| 21 | 7200,4200 | 19200,4200 | Front band / rear band divider (door openings per §3.4) |

### 3.4 Doors & windows

| Item | Position | w | Notes |
|---|---|---|---|
| Bedroom 4 → Upper Hall | 3400, 2300 | 800 | |
| Bedroom 5 → Upper Hall | 3400, 7900 | 800 | |
| Hall Bath → Upper Hall | 4400, 1300 | 800 | |
| Laundry → Upper Hall | 4400, 3800 | 800 | |
| Bed5 Closet/Linen → Upper Hall | 4400, 7000 | 800 | |
| Upper Hall → Hall Link → West Hall Connector | 7200, 4950 | 900 | the critical spine-to-core link |
| West Hall Connector → Stair Hall | 9700, 4950 | open (no panel) | wide archway |
| Primary Bedroom → Spa Bath | 8500, 4200 | 800 | ensuite access |
| Spa Bath → Primary Closets | 8000, 6900 | 800 | |
| Sitting Area → Upper Hallway | 13000, 4200 | 800 | suite's public connection |
| Bedroom 2 → Upper Hallway | 15700, 4200 | 800 | |
| Bedroom 2 → Bath 2 | 17200, 1200 | 800 | ensuite |
| Bedroom 3 → Upper Hallway | 14450, 5300 | 800 | |
| Bedroom 3 → Bath 3 | 16700, 6300 | 800 | ensuite |
| Bedroom 3 → Closet 3 | 16700, 7900 | 700 | |
| Loft ← open from Upper Hallway/Bed3 area | 12200–19200, 8500 | open | no panel |

Windows: one `double_hung` (900×1200mm) centered on each bedroom's exterior
wall (Bedroom 4 west wall, Bedroom 5 west wall, Primary Bedroom + Sitting +
Bedroom 2 south wall, Bedroom 3 + Loft north wall), plus small `casement_pair`
privacy windows (600×900mm, sill 1300mm) in each bathroom's exterior wall
where one exists (Hall Bath west wall, Bath 2 east wall).

### 3.5 Staircase

Matches Main §2.5: the Stair Hall footprint (`x:9700–12200, y:4200–9750`) is
identical. A `stair_landing` piece sits at the east lane center
(`x=11575, y=7000`) — the top of the Main→Upper flight. The west lane at
this level is unused by any stair (the Basement↔Main flight doesn't reach
Upper) and is just part of the open landing/hallway floor.

---

## 4. Basement Level

**Floor rectangle**: identical to Main/Upper — `w = 19200, d = 9750`.

West wing (under the garage) is entirely unfinished mechanical/storage —
basements typically don't extend under a garage slab, so this doc treats it
as the mechanical room instead, avoiding an unrealistic void. The core
mirrors Main's front/rear band split, finished as theater/bar/guest suite up
front and gym/rec room in back.

### 4.1 ASCII sketch

```
y=9750 ─────────────────────────────────────────────────────────────────────
       ┌─────────────────────────────┬──────┬───────────────────────────────┐
       │                             │      │                               │
       │                             │STAIR │      STORAGE (unfinished)      │
       │      MECHANICAL /           │ HALL │                               │
       │   STORAGE (unfinished,      │  /   ├───────────────────────────────┤
y=7300 │   full west-wing footprint) │LNDNG │                               │
       │                             │      │        REC / GAME ROOM         │
       │                             │      │                               │
y=4200 ├────────────┬────────┬───────┼──────┼──────────┬─────────┬─────────┤
       │             │        │  GYM │      │           │         │         │
       │  THEATER /  │  WET   │      │      │   GUEST   │ GUEST   │ GUEST   │
       │    MEDIA    │  BAR   │      │      │  BEDROOM  │  BATH   │ CLOSET  │
y=0    └─────────────┴────────┴──────┴──────┴───────────┴─────────┴─────────┘
      x=0                  x=7200 x=9700  x=12200            x=16700     x=19200
```

### 4.2 Room table

| Room | Rect (x, y, w, d mm) | Sq ft | Purpose | Finished? |
|---|---|---|---|---|
| Mechanical / Storage | 0, 0, 7200, 9750 | 756 | HVAC, water heater, sump, bulk storage | No |
| Home Theater / Media Room | 7200, 0, 4000, 4200 | 181 | Media room | Yes |
| Wet Bar | 11200, 0, 2000, 4200 | 90 | Bar + seating | Yes |
| Guest Bedroom | 13200, 0, 3500, 4200 | 158 | Guest suite bedroom | Yes |
| Guest Bath | 16700, 0, 2500, 2400 | 65 | Ensuite | Yes |
| Guest Closet | 16700, 2400, 2500, 1800 | 48 | Reach-in closet | Yes |
| Gym / Fitness | 7200, 4200, 2500, 5550 | 149 | Home gym | Yes |
| Stair Hall / Landing | 9700, 4200, 2500, 5550 | 149 | Bottom of Basement→Main stair | Yes |
| Rec / Game Room | 12200, 4200, 7000, 3100 | 234 | Pool table, sofa, TV | Yes |
| Storage (rear) | 12200, 7300, 7000, 2450 | 185 | Additional storage | No |

Basement finished total: **1,074 sq ft**. Unfinished: 756 + 185 = 941 sq ft.
Floor total: 1,074 + 941 = 2,015 sq ft ≈ the floor rectangle. ✓

### 4.3 Wall layout

**Exterior perimeter**: identical rectangle to Main/Upper.

| # | From | To | Notes |
|---|---|---|---|
| 1 | 7200,0 | 7200,9750 | West wing (mechanical) / core divider |
| 2 | 11200,0 | 11200,4200 | Theater / Wet Bar — **open archway, no door** |
| 3 | 13200,0 | 13200,4200 | Wet Bar / Guest Bedroom |
| 4 | 16700,0 | 16700,4200 | Guest Bedroom / Guest Bath+Closet |
| 5 | 16700,2400 | 19200,2400 | Guest Bath / Guest Closet |
| 6 | 9700,4200 | 9700,9750 | Gym / Stair Hall divider |
| 7 | 12200,4200 | 12200,9750 | Stair Hall / Rec Room+Storage divider |
| 8 | 12200,7300 | 19200,7300 | Rec Room / Storage — **open doorway, no panel** |
| 9 | 7200,4200 | 19200,4200 | Front band / rear band divider (door openings below) |

### 4.4 Doors & windows

| Item | Position | w | Notes |
|---|---|---|---|
| Mechanical → Gym | 7200, 7000 | 900 | main service access |
| Mechanical → Theater | 7200, 2100 | 800 | secondary access |
| Theater → Gym | 8000, 4200 | 800 | |
| Wet Bar → Stair Hall | 11700, 4200 | 900 | |
| Guest Bedroom → Rec Room | 14950, 4200 | 800 | |
| Guest Bedroom → Guest Bath | 16700, 1200 | 800 | ensuite |
| Gym → Stair Hall | 9700, 7000 | 900 | |
| Egress window well (Guest Bedroom) | 19200, 2100 | 1200 | code-required basement bedroom egress; `casement_pair`, sill 1800/height 900 |
| Egress window well (Rec Room) | 19200, 5750 | 1500 | `sliding`, sill 1800/height 1000 |
| Theater — no exterior windows (light-controlled room by design) | — | — | |

### 4.5 Staircase

The Stair Hall footprint (`x:9700–12200, y:4200–9750`) matches Main/Upper
exactly. The **west lane** (`x=10325, y=7000`) holds the physical `stairs`
piece (full flight, `w:1000, h:3600`) rising north into the Main-level
landing above. The east lane at this level is unused (nothing connects
Basement directly to Upper) — leave it open floor, optionally a
"storage under the stairs" nook.

---

## 5. Furnishing Per Room

Rotation is `Furniture.rotation` in **degrees, screen-clockwise**; `0°`
keeps the kind's built-in default orientation. Because the exact sign
convention is easy to get backwards from a spec alone, every row also gives
a plain-language facing direction — treat that as authoritative and nudge
the rotation value in the live app if the piece doesn't match.

### 5.1 Main Level

**Garage** — no bound entity by default; pure prop.
| Item | Pos (x,y) | Rot | Notes |
|---|---|---|---|
| cabinet ×2 | 800,6300 / 2000,6300 | 180 | storage cabinets, back wall |
| counter (workbench) | 5800,6300 | 180 | workbench along back wall |

**Mudroom**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| bench | 300,8000 | 90 | built-in bench, west wall |
| wardrobe | 3900,8000 | 270 | coat closet, east wall |

**Powder Room**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| toilet | 5200,7000 | 0 | |
| sink_vanity | 5200,8300 | 180 | facing south into room |

**Home Office**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| desk | 8450,600 | 180 | against south exterior wall, facing north |
| chair | 8450,1300 | 0 | desk chair |
| bookshelf | 7400,3700 | 0 | along interior wall |
| rug | 8450,2100 | — | |

**Foyer**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| table (console, override w1400/h400) | 10950,300 | 180 | flanks front door |
| bench | 10950,3900 | 0 | near stair-hall entry |
| rug | 10950,2100 | — | |

**Living Room**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| sofa | 13950,3700 | 180 | back to north wall, facing south |
| coffee_table | 13950,2900 | 0 | |
| chair ×2 | 12700,2600 / 15200,2600 | 90 / 270 | flanking accent chairs |
| bookshelf | 12500,600 | 180 | south wall |
| rug (override 2600×1800) | 13950,2900 | — | |

**Dining Room**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| table (override w2000/h1100) | 17450,2100 | 0 | seats 6–8 |
| chair ×6 | around table perimeter | facing table | |
| dresser (buffet) | 17450,600 | 180 | south wall |
| rug | 17450,2100 | — | |

**Pantry** — cabinet ×2 along walls (shelving), no free positions needed beyond kind defaults.

**Kitchen**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| island | 14450,5000 | 0 | centered |
| stove | 13200,4500 | 0 | |
| microwave (mountable, elevation 1400) | 13200,4550 | 0 | over range |
| fridge | 12400,5200 | 90 | west wall |
| kitchen_sink | 15500,6400 | 180 | facing great room |
| dishwasher | 15000,6400 | 180 | beside sink |
| cabinet | 16500,5000 | 270 | pantry cabinet, east wall |
| coffee_maker (mountable, elevation 900) | 16400,6300 | 0 | counter |
| toaster (mountable, elevation 900) | 16400,6000 | 0 | counter |

**Breakfast Room**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| table (override w1200/h1200, round) | 17950,5400 | 0 | |
| chair ×4 | around table | facing table | |

**Great Room**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| sofa_l_left | 14000,8300 | 0 | facing TV/fireplace wall |
| coffee_table | 14000,7900 | 0 | |
| ottoman | 14000,8700 | 0 | |
| wall_tv (elevation 900) | 14000,9650 | 0 | north wall |
| bookshelf ×2 | 12500,9550 / 15500,9550 | 180 | flanking TV |
| chair | 16800,8300 | 180 | reading chair by window |
| plant | 13000,6900 | 0 | |
| rug (override 3600×2400) | 14000,8300 | — | |

*Light suggestion*: a `fireplace` `LightIconKind` on the great room's north
wall centered near `x=14000, y=9700`, wall-snapped (see CLAUDE.md's
`snapFireplaceToWall`).

### 5.2 Upper Level

**Bedroom 4**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| bed | 1700,3800 | 180 | headboard against north wall |
| nightstand ×2 | 600,3800 / 2800,3800 | 0 | |
| dresser | 600,600 | 0 | |
| rug | 1700,2600 | — | |

**Bedroom 4 Closet** — wardrobe at 1700,5300 (or leave as a plain reach-in shell).

**Hall Bath**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| toilet | 5400,700 | 0 | |
| sink_vanity | 5400,2300 | 180 | |
| shower | 4900,1500 | 90 | |

**Laundry Room**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| washer | 4900,3900 | 0 | |
| dryer | 5900,3900 | 0 | |
| cabinet | 5400,2700 | 180 | shelving |

**Bedroom 5**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| bed | 1700,8950 | 180 | headboard against north wall |
| nightstand ×2 | 600,8950 / 2800,8950 | 0 | |
| dresser | 600,6300 | 0 | |
| desk | 3100,6400 | 270 | study corner |
| rug | 1700,8000 | — | |

**Bedroom 5 Closet & Linen** — wardrobe at 5400,9200; open shelving for linens along the remaining wall.

**Primary Bedroom**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| bed (override 2000×2100, king) | 9450,3600 | 180 | headboard against north (Spa Bath) wall |
| nightstand ×2 | 8300,3600 / 10600,3600 | 0 | |
| dresser | 8000,600 | 180 | south exterior wall |
| bench | 9450,2200 | 0 | end-of-bed bench |
| rug (override 3000×2200) | 9450,2600 | — | |

**Primary Sitting Area**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| chair ×2 | 12950,3800 / 12950,600 | 180 / 0 | accent chairs |
| coffee_table | 12950,2200 | 0 | |
| bookshelf | 11900,2100 | 90 | |

**Bedroom 2**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| bed | 15700,3600 | 180 | headboard against north wall |
| nightstand ×2 | 14700,3600 / 16700,3600 | 0 | |
| desk | 15700,600 | 180 | |
| rug | 15700,2600 | — | |

**Bedroom 2 Bath** — toilet 18200,400; sink_vanity 18200,2100 (rot 180); shower 17700,1200 (rot 90).
**Bedroom 2 Closet** — wardrobe 18200,3300.

**Primary Spa Bath**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| bathtub | 8000,5900 | 0 | freestanding, under window |
| shower | 9200,5500 | 90 | |
| sink_vanity (override w1500) | 7900,5900 | 0 | double vanity |
| toilet | 9200,6700 | 0 | private water closet |

**Primary Closets** — wardrobe (hers) 8000,9200 rot 0; wardrobe (his) 9200,7300 rot 180; cabinet (center island) 8450,8300.

**Bedroom 3**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| bed | 14450,6300 | 0 | headboard against south (hallway) wall |
| nightstand ×2 | 13300,6300 / 15600,6300 | 0 | |
| dresser | 13000,8300 | 180 | |
| desk | 16000,8300 | 180 | |
| rug | 14450,7000 | — | |

**Bedroom 3 Bath** — toilet 17700,5800; sink_vanity 17700,7100 (rot 0); shower 18700,6300 (rot 90).
**Bedroom 3 Closet** — wardrobe 17950,7900.

**Loft / Bonus Room**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| sofa | 14450,9400 | 180 | |
| coffee_table | 14450,8900 | 0 | |
| bookshelf | 12500,9400 | 180 | |
| chair | 16500,8900 | 90 | |
| rug | 14450,8900 | — | |

### 5.3 Basement Level

**Home Theater / Media Room**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| wall_tv (elevation 600, or treat as "screen") | 9200,4050 | 180 | north wall |
| sofa_u | 9200,1600 | 0 | main theater seating |
| ottoman | 9200,2600 | 0 | |
| chair ×2 | 8300,700 / 10100,700 | 180 | back-row seating |
| bookshelf (AV storage) | 7400,3900 | 90 | |

**Wet Bar**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| counter (bar top) | 12200,600 | 180 | south wall |
| kitchen_sink (bar sink) | 11700,600 | 180 | |
| stool ×3 | 11600,1000 / 12200,1000 / 12800,1000 | 0 | |
| cabinet (back bar) | 12200,3900 | 0 | |
| fridge (override w500/h500, beverage) | 12900,3900 | 0 | mini fridge |

**Guest Bedroom**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| bed | 14950,3600 | 180 | headboard against north wall |
| nightstand ×2 | 13700,3600 / 16200,3600 | 0 | |
| dresser | 13500,600 | 180 | |
| rug | 14950,2600 | — | |

**Guest Bath** — toilet 17700,400; sink_vanity 17700,2100 (rot 180); shower 18700,1200 (rot 90).
**Guest Closet** — wardrobe 17950,3300.

**Gym / Fitness**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| exercise_equipment (treadmill) | 8450,5200 | 0 | |
| exercise_equipment (bike) | 8450,7000 | 0 | |
| bench (weight bench) | 8450,8800 | 0 | |
| rug (override 2000×1200, mat) | 8450,9200 | — | |

**Rec / Game Room**
| Item | Pos | Rot | Notes |
|---|---|---|---|
| table (override w2600/h1400, labeled "Pool table") | 14450,5750 | 0 | |
| sofa | 17800,6900 | 180 | |
| coffee_table | 17800,6300 | 0 | |
| wall_tv (elevation 1000) | 17800,7250 | 180 | |
| cabinet (game storage) | 12500,6900 | 90 | |
| rug (override 3000×1800) | 14450,5750 | — | |

**Storage (rear)** — cabinet ×3 at 13000,8500 / 15500,8500 / 18000,8500 (shelving); mechanical equipment (furnace, water heater, softener) is not a Diorama `Furniture` kind — annotate with a plain `label` on a `block` piece or leave unmodeled.

---

## 6. Skinning / Appearance

Diorama's `Scene3D`/`Floor.look3d` model applies **one** `floorTex` +
`floorColor` + `wallColor` per **floor** (not per room) — there is no native
per-room material override today. The palette below picks the dominant
material per level and calls out where a real house would vary room-to-room
(future enhancement, see §7).

| Floor | `floorTex` | `floorColor` | `wallColor` | Notes |
|---|---|---|---|---|
| Main Level | `wood` | `#c9a06a` (warm oak) | `#f2ede4` (soft warm white) | Represents the wide-plank oak that would run through foyer/living/dining/kitchen/great room in the real house; mudroom/baths would be tile in reality — see §7 note. |
| Upper Level | `none` | `#d9c9a8` (soft carpet beige) | `#eef1ee` (light warm gray) | `floorTex: 'none'` + a warm tan `floorColor` is the closest approximation of wall-to-wall bedroom carpet the engine supports; bathrooms/laundry would be tile in reality. |
| Basement | `concrete` | `#9aa0a6` (polished concrete gray) | `#e3ded4` (warm greige) | Rec-room/media-room aesthetic; guest bedroom would have carpet in reality (same `none` + warm-tone workaround as Upper if you want to differentiate it via a second `Floor` split — not needed here). |

Per-floor `look3d` overrides layer on top of the global `Store.scene3d`
(`lightMode: 'clock'` recommended so the great room / bedrooms shift
day→dusk→night automatically with `sun.sun`).

---

## 7. Reconstruction Notes

- **Room naming**: name each `Room` exactly as in the room tables above
  (`Floor.rooms[].name`) with `anchor` set to the room rectangle's center
  point (e.g. Kitchen anchor `(14450, 5400)`). The literal substring
  `"kitchen"` in a room name gates the snack/coffee thought-bubble behavior
  and TV-watching room scoping — "Kitchen" and "Breakfast Room" both count
  toward kitchen-adjacent behavior only if you also name/alias the
  breakfast room something containing "kitchen" (optional; left as
  "Breakfast Room" here to match the room table, so only the Kitchen room
  itself gates that behavior).
- **Stairs**: use the `stairs` `FurnitureKind` (`w:1000, h:3600, ht:2743` —
  a full flight climbing one full 9 ft story in a single straight run) for
  both stair connections, per §2.5/§3.5/§4.5. `stair_landing`
  (`w:1000, h:1000`) marks the top of each flight on the floor above. If you
  prefer a switchback (U-shaped) stair for visual interest, swap each
  `stairs` piece for `stairs_half` ×2 + `stair_landing` (using the
  `elevation` field on the upper half-flight — see `Furniture.elevation` in
  `types.ts`) — the footprint budgeted in the Stair Hall room (2500×5550mm)
  has room for either approach.
- **Per-room flooring limitation**: Diorama's `Floor.look3d` is whole-floor.
  If true per-room material variation becomes a priority (tile baths vs.
  wood living areas on the same level), the practical workaround today is
  either (a) accept the single dominant material per floor as tabulated in
  §6, or (b) split a level into two `Floor` objects at the same elevation
  with `disabled` used to hide whichever one isn't "current" — not
  recommended here since it would break the single-flight-of-stairs
  simplicity above.
- **Scale sanity check**: room-table areas sum to 1,503 (Main, heated) +
  2,016 (Upper) + 1,074 (Basement, finished) = **4,593 sq ft**, against the
  ~4,500 sq ft brief — 2% over, well within normal variance for a
  room-by-room layout exercise. Unfinished space (511 sq ft garage + 941 sq
  ft basement mechanical/storage) is intentionally excluded from that
  total, matching how real listings report square footage.
- **Sensor suggestions** (all optional; none are required for the furniture
  plan above to work):
  - **mmWave (`Sensor`)** in Great Room, Primary Bedroom, and Rec/Game Room
    for avatar presence + activity triggers (these are the most-occupied
    rooms).
  - **Motion sensors (`MotionSensor`)** in both hallways (Main's Back
    Hall/Stair Hall, Upper's Upper Hall spine + Stair Hall/Landing, and
    Basement's Stair Hall) and the Mudroom, for lighting automations.
  - **Env sensors (`EnvSensor`)**: temperature/humidity one per floor;
    `co2` in the Home Theater (enclosed, frequently occupied); `voc`/`pm`
    in the Kitchen.
  - **Safety sensors (`SafetySensor`)**: `smoke` in every bedroom + hallway
    + Kitchen + Home Theater; `co` near the Garage/Mechanical room and
    each bedroom level's hallway (combustion appliances are in the
    basement mechanical room and the garage).
- **Light suggestions**: one ceiling `bulb` (or `pendant` over the island/
  breakfast table, `sconce` in hallways) per room, `entity_id` following a
  `light.<floor>_<room_slug>` naming convention (e.g. `light.main_kitchen`,
  `light.upper_primary_bedroom`); a `fireplace` light in the Great Room
  (see §5.1); a `switch` fixture wall-snapped beside every door threshold
  listed in §2.4/§3.4/§4.4 (Diorama's `snapSwitchToWall` + ganging will
  place multi-gang plates automatically near the Foyer and Kitchen where
  several switches cluster).
- **Furniture kind confirmations**: this spec uses the exact
  `FurnitureKind` enum values from `src/geometry.ts`'s `FURNITURE_KINDS`
  (`stairs`, `stairs_half`, `stair_landing`, `sink_vanity`, `kitchen_sink`,
  `wall_tv`, `sofa_l_left`/`sofa_l_right`/`sofa_u`, `exercise_equipment`,
  `coffee_maker`, `toaster`, etc.) rather than guessed names — verify
  against that file if this spec is rebuilt after a future geometry.ts
  change.
- **Rotation caveat**: every furniture row in §5 states a plain-language
  facing direction alongside the numeric `rotation`. Diorama's exact
  screen-CW / local-axis convention (see `furnitureWorldToLocal` in
  `geometry.ts`) is easy to get backwards from a written spec — trust the
  facing description and nudge the number in the live editor if a piece
  renders facing the wrong way.
- **Door hinge / kind fields**: `Door.x,y` is the **hinge**, not the
  panel's swept center — all main-level garage doors use `kind: 'garage'`
  (segmented overhead, `GARAGE_DOOR_H = 2100`); every other door uses the
  default `kind: 'swing'`. Window `x,y` is the pane **center**, not an
  endpoint.
- **Wall welding**: adjoining wall segments listed with a shared endpoint
  (e.g. main-level wall #1's `(7200,9750)` and the exterior perimeter's
  `(19200,9750)→(0,9750)` run) will auto-weld within Diorama's 25 mm
  tolerance (`connectWallEnds`) as long as they're placed close to the
  listed coordinates — exact-to-the-millimeter placement isn't required.
