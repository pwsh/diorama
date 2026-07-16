# Diorama demo-house library

Eight reconstruction-ready floor-plan specs, from a studio apartment to a large
three-level luxury home. Each doc is a **build spec** — enough detail to
reconstruct the plan directly in Diorama's data model without further design:
floor rectangle(s) in **mm**, an ASCII plan sketch, a per-floor **room table**
(name · `x,y,w,d` mm · sq ft · purpose), the **wall layout** as point-lists,
a **door & window schedule** (with sill/head heights), **furniture + appliance
placement** per room (Diorama `kind` · position · rotation), **skinning**
(per-room floor material/color + wall color), and reconstruction notes.

Generated 2026-07-15 (Sonnet-gathered against real residential dimensions,
Opus-reviewed). Room rectangles are non-overlapping tilings whose areas were
checked to sum to the stated square footage (±~1%); multi-floor plans use an
identical stacked footprint with a stair core pinned to the same rectangle on
every level so floors align.

## The houses

| Spec | Style | Floors | Footprint (mm) | Living area |
|---|---|---|---|---|
| [studio-apartment.md](studio-apartment.md) | Urban studio | 1 | 6 600 × 6 350 | ~451 sq ft (42 m²) |
| [one-bedroom-apartment.md](one-bedroom-apartment.md) | 1-bed apartment | 1 | 8 500 × 8 200 | ~750 sq ft (70 m²) |
| [small-bungalow.md](small-bungalow.md) | 2-bed / 1-bath bungalow | 1 | 9 750 × 9 500 | ~997 sq ft (93 m²) |
| [ranch-3bed.md](ranch-3bed.md) | 3-bed / 2-bath ranch + 2-car garage | 1 | 22 100 × 10 000 (house 16 000 × 10 000) | ~1 723 sq ft (160 m²) + garage |
| [open-concept-modern.md](open-concept-modern.md) | Modern open-concept + garage | 1 | house 16 800 × 11 400 (+ garage, patio) | ~2 031 sq ft (189 m²) |
| [townhouse-3level.md](townhouse-3level.md) | Narrow rowhouse, party walls | 3 | 6 000 × 11 000 (identical/level) | ~1 875 sq ft (174 m²) |
| [two-story-colonial.md](two-story-colonial.md) | Center-hall colonial + 2-car garage | 2 | 19 500 × 9 150 (L1) | ~2 599 sq ft (242 m²) + garage |
| [large-multilevel.md](large-multilevel.md) | 5-bed luxury, walkout basement | 3 | 16 450 × 11 800 (identical/level) | ~4 541 sq ft (422 m²) |

Coverage spans compact single-room living, single-story small/mid homes,
open-plan modern, narrow multi-level urban, traditional two-story, and a large
three-level home with a home theater / gym / guest suite in a finished
basement — a spread that exercises most Diorama features (multi-floor + stairs,
garages, open plans, party walls, en-suites, laundry, appliances).

## Building one in Diorama

Each spec maps onto the same fields:
- **Floor** — `w`/`d` = the floor rectangle (mm); one `Floor` per level, stacked
  in `Store.floors` order. Multi-level specs share a footprint and a stair-core
  rectangle so the levels register.
- **Walls** — each wall run in the spec's point-lists becomes a `Wall`
  (`points: [{x,y}, …]` mm). Closed loops become the 3D floor patches; use
  `kind: 'railing'`/`'invisible'` where the spec calls out open stair edges.
- **Rooms** — one `Room` per table row; drop its `anchor` inside the room
  rectangle. Keep the given names — a name containing `kitchen` gates kitchen
  behaviors, and room names scope TV-watching + activities.
- **Doors / windows** — from the opening schedule; they snap to the nearest wall.
- **Furniture / appliances** — one `Furniture` per placement row, `kind` from
  `FURNITURE_KINDS`, at the given `x,y` + `rotation`.
- **Skinning** — set `floorTex`/`floorColor`/`wallColor` (or per-floor `look3d`,
  or per-room once a per-room material system exists) from the appearance
  section. See [../research/skin-*.md](../research/README.md) for the materials.

These are demonstration layouts — realistic but generic, safe to ship as
built-in example dioramas or onboarding templates.
