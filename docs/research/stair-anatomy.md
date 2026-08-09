# Stair Anatomy — Build-Ready Reference (Real-World Dimensions & Terminology)

Status: research complete, not yet implemented. Target: real-staircase
anatomy on the existing `STAIRS_KINDS` furniture family (`stairs` /
`stairs_half` / `stair_landing` — `isStairsKind` in `geometry.ts`) — correct
top-step-down geometry, closed-riser boards, an enclosed-stairwell side wall
option, newel posts, and a handrail/baluster guard. This is **terminology and
typical-value reference only**: no code changes, no new fields, no
implementation plan. Diorama is a stylized toon model, not a code-compliance
tool, so every number below is a *typical residential* value with the IRC
range given as context, and each section flags the ONE nominal value
recommended for a hard-coded Diorama constant (all gathered in the final
table).

Primary source throughout: **IRC 2021 §R311.7 (stairways)** and §R311.7.8
(handrails) — the same residential code `docs/research/avatar-nav-stairs.md`
already cites (2018 edition, same section) for this furniture family. The
metric world lands in the same neighborhood (UK Approved Document K: 220 mm
max rise / 220 mm min going for a private stair, 100 mm baluster gap), so
the mm figures below already read as the metric convention — no separate
section needed.

## 1. The core geometric fact: n treads ⇒ n+1 risers

This is the fact the whole feature encodes, so state it precisely.

A **riser** is one vertical step; a **tread** is the horizontal surface you
stand on. A flight that changes level by a total rise `HT`, using constant
riser height `R`, needs `HT / R` risers. Call that count `n`.

- **Riser 1** carries you from the LOWER floor up onto tread 1.
- **Risers 2 .. n−1** carry you from tread `i` to tread `i+1`.
- **Riser n** (the last one) carries you from the topmost tread up onto the
  UPPER floor itself.

So a flight has **n risers but only n−1 treads** — equivalently, a flight
built from **T treads has T+1 risers**. The lower floor and the upper floor
are never counted as treads; they're the two endpoints the risers connect.

The consequence that matters for a 3D model: **the topmost tread's walking
surface sits exactly ONE riser height below the upper floor** — it is *not*
flush with the floor above. Stepping off the top tread onto the upper floor
is itself the final riser. A model that treats "tread count" and "the
divisor of the total rise" as the same number will make the last tread flush
with the floor above (one riser short over the whole flight, and the top
step reads as a shallow half-step) or will overshoot the total rise by one
riser. Either error is a visible flaw at eye level, right where an avatar's
foot lands walking off the stairs — get this one relationship right before
anything else in the feature.

## 2. Riser height & tread depth

| Quantity | IRC 2021 §R311.7.5 limit | Typical *comfortable* residential value |
|---|---|---|
| Riser height | max **7¾ in (196 mm)**; largest/smallest in one flight must not differ by >3/8 in (9.5 mm) | **7.0–7.5 in (178–190 mm)** |
| Tread depth (run) | min **10 in (254 mm)**, measured nose-to-nose | **10.5–11.5 in (267–292 mm)** |

[Tread depth & risers — Viewrail](https://resources.viewrail.com/code-compliance/stair-code/tread-depth-and-risers),
[2018 IRC Residential Stair Guide §R311.7](https://timnath.org/wp-content/uploads/2022/03/2018-RESIDENTIAL-STAIR-GUIDE.pdf).

**The 2R + T "comfort rule"**: twice the riser height plus one tread depth
should land in **24–25 in (610–635 mm)** — the classic ergonomic check that
keeps a stride natural (too-steep stairs feel cramped, too-shallow ones feel
like a ramp). A 7 in riser + 11 in tread gives 2(7)+11 = 25 in — a textbook
"comfortable" flight.

**Nosing** (the tread's projecting front lip past the riser face below it):
IRC requires **3/4–1¼ in (19–32 mm)** of nosing on closed-riser stairs whose
tread depth is under 11 in; open-riser / deep-tread stairs may omit it. A
**1 in (25 mm)** nosing is the standard commercial-tread-stock default.

(Out of scope for v1, noted for later: IRC also sets minimum headroom at
6 ft 8 in / 2032 mm above the tread nosing line — only matters once a
ceiling/soffit is modeled above a flight.)

Diorama's shipped `stairs` default is 1000 mm wide × 3600 mm run ×
2743 mm rise (`docs/research/avatar-nav-stairs.md`), and `stairsTreadCount`
(geometry.ts) derives count from a 280 mm nominal tread depth with a
130 mm minimum riser floor — both already inside the ranges above.

## 3. Stringers

The **stringer** (also called the **carriage**) is the sloped structural
board the treads and risers are notched into or hung from — one on each side
of the flight, plus often a third centered one on wide stairs.

- **Closed (housed) stringer**: a solid board with the tread/riser profile
  routed into dadoes on its inner face, so the stringer itself is a flat
  raked board and the ends of the treads are hidden — the stair reads as a
  smooth-sided box from outside.
- **Open (cut / sawtooth) stringer**: the board is cut into a zig-zag
  matching the tread/riser profile, so the tread ends sit ON TOP of the
  notches and are visible from the side — the classic "sawtooth" silhouette.
  This is what an OPEN staircase (no side walls) shows.

Typical stringer stock is a **2×12** (nominal; actual 1.5 × 11.25 in /
38 × 286 mm) — deep enough that a **5 in (127 mm) "throat"** of solid wood
remains below the cut notches (a code minimum). Stringers sit on ~16 in
(406 mm) centers for a full-width stair (two edge stringers + a center one).
[Standard stair stringer dimensions — Oak Valley Designs](https://oakvalleydesigns.com/blogs/diy/standard-stair-stringer-dimensions),
[Stair stringer specifications — InspectAPedia](https://inspectapedia.com/Stairs/Stair-Stringer-Specifications.php).

Diorama already builds a stringer-shaped board for **open-underneath**
flights (`Furniture.stairsOpen`, three-renderer.ts): `STAIR_STRINGER_T_MM =
40`, inset 2 mm, sloped profile dropped `STAIR_STRINGER_DROP_MM = 300` below
the tread line — already a reasonable stand-in for the closed-stringer
board; reuse it as the "carriage" member rather than adding a duplicate.

## 4. Risers — the boards

- **Closed-riser stairs**: a vertical board (the "riser board") fills the
  gap under each tread's nosing, closing the flight from view. This is the
  default look for most enclosed residential staircases.
- **Open-riser stairs**: no riser board — you can see through/under each
  step. Common in modern/contemporary designs and basements. IRC still
  requires the gap to reject a 4 in sphere (same rule as guard balusters,
  §8) if the flight is >30 in above grade.

Typical riser board stock is **3/4 in (19 mm)** nominal lumber (1×8 riser
board). [Traditional 3/4 in stair risers — WoodStairCo](https://www.woodstairco.com/traditional-treads-and-risers/traditional-3-4-riser.html).
**Placement**: the riser board's face sits set BACK from the tread nosing
above it by the nosing overhang (§2) — the tread overhangs its riser by
~1 in, never flush with it (a flush riser reads as a slab-front, not a
stair). That inset — riser plane behind the tread-above's leading edge, not
aligned with it — is the detail a riser-board pass needs to get right.

## 5. Enclosed stairwells & the spandrel wall

An **enclosed staircase** runs beside a full-height wall rather than being
open. From inside the stairwell that wall looks like an ordinary interior
wall (drywall, baseboard) that follows the raked stair line instead of
running level — its bottom edge is scribed at an angle to sit just above
each tread/nosing, its top runs level with the ceiling above. Structurally
it's a normal stud wall; the only tell is the angled cut line at the stair.

The **spandrel** is the specific term for the triangular volume UNDER a
flight, on the side with no room below it — the wedge between the stringers'
sloped underside and the floor, commonly boxed into the classic
"under-the-stairs closet" when unused. [What is the wall under the stairs
called? — Stair101](https://stair101.com/what-is-the-wall-under-the-stairs-called/),
[Spandrel — Wikipedia](https://en.wikipedia.org/wiki/Spandrel).

For Diorama these are one shape seen from two sides: a flat panel that
follows the stair's rake — a vertical side wall ABOVE the tread line when
enclosed, a sloped "spandrel" panel BELOW it when exposed from underneath.
One raked quad-strip (the same `THREE.Shape`-profile-extruded-across-width
technique the shipped open-stringer board already uses) covers both; only
the extrusion depth/placement differs.

## 6. Handrails

**Height**: IRC requires the handrail's top surface to be **34–38 in
(864–965 mm) above the nosing line** (a plane drawn through the leading edge
of each tread) — not above the floor. **Recommended nominal: 900 mm**
(≈35.4 in), comfortably mid-range.

**Profile size**: IRC Type I (circular) handrails must have an outside
diameter of **1¼–2 in (32–51 mm)**; non-circular (Type II) profiles use a
perimeter/cross-section rule instead. Commercial round and oval stair-rail
stock commonly runs right at the top of that range. **Recommended nominal:
50 mm** round/oval — big enough to read clearly at Diorama's toy scale
without exceeding code. [Handrail size requirements — Viewrail](https://resources.viewrail.com/code-compliance/railing-code/handrail-size-requirements),
[R311.7.8.5 Grip Size — UpCodes](https://up.codes/s/grip-size).

**Support**: a handrail is either **wall-mounted** (steel brackets fastened
into studs, common on one side of an enclosed stair — no balusters needed)
or **baluster-supported** (a continuous rail riding on top of a run of
balusters between newels — the open-guard look, §7–8). A stair can mix both:
wall rail on the enclosed side, baluster rail on the open side.

**Termination**: a baluster-supported rail always terminates into something
solid — a **newel post** at the top and bottom of the run (§7), or, on a
wall-mounted rail, a **wall return** (the rail curves back into the wall
face at roughly a right angle) so the end can't snag a sleeve or catch a
child's head between rail and wall.

## 7. Newel posts

A **newel post** is the heavier structural/decorative post the handrail
terminates or changes direction at — NOT one of the many thin balusters.
Newels go at the **foot of the flight** (the "starting newel," usually the
most decorative one in a house), the **head of the flight** (where the rail
meets the upper floor's guard), and at every **landing turn** (§9).

**Cross-section**: a plain **box newel** (hollow or solid square post) is
commonly ~4 in square (≈100 mm); a slightly trimmer **90 × 90 mm** section
reads as post-not-wall against Diorama's own 100 mm interior-wall
convention. **Height above the tread/floor to the top of its cap**:
commonly 36–42 in (915–1067 mm), i.e. **~1100–1200 mm** — taller than the
handrail so the rail can terminate INTO the post below its cap, not at the
very top. [Newel post height — WoodStairs](https://www.woodstairs.com/newel-post-height/),
[Height of newel post — NEFS](https://www.stair-part.com/height-of-newel-post.html).

**Cap styles** (visual only): flat/plain box top, pyramid, turned ball, or a
plain hemisphere — any one low-poly primitive on the post box works; a
flat-capped box is the safest generic default for the toon aesthetic.

## 8. Balusters / spindles

A **baluster** (also "spindle") is one of the many slim vertical members
between the treads/rail and the newels, filling the guard so nothing (and no
one) can fall through the open side of a stair or landing.

- **Spacing (the "4 in sphere rule")**: no gap in the guard may admit a
  **4 in (102 mm) sphere** — the governing child-safety rule everywhere in
  the guard, not just baluster-to-baluster. **Recommended nominal clear
  gap: 100 mm.**
- **Section**: typically 1¼–1¾ in square (~32–45 mm); recommend a slim
  **35 mm square** — visually a spindle, not a post.
- **Convention**: **two balusters per tread** is the traditional placement
  (each incrementally taller than its neighbor, by half a riser height, so
  their tops trace the rake line) — keeps spacing safely under the 4 in
  rule and is the simplest rule for a generated run (modern code-driven
  runs sometimes use three per tread on very deep treads; two-per-tread is
  the classic residential look recommended here).

[Residential stair railing code — BuyRailings](https://www.buyrailings.com/blog/buy-railings-1/residential-railing-code-requirements-for-decks-stairs-balconies-132),
[Baluster — Dimensions.com](https://www.dimensions.com/element/baluster-square).

## 9. Landings (multi-flight stairs) — scope note

Where two flights meet at a landing (switchback, L-turn, or a straight run
broken partway), the guard/handrail continues around the landing's open
edge, and a **newel post sits at the turn** where one flight's rail meets
the next at a different angle — often the tallest, most decorative newel in
the run. `stair_landing` is already a shipped `FurnitureKind` (1000×1000 mm,
half-story elevation) that two `stairs_half` pieces snap to via
`snapStairEdges`. This doc's constants apply unchanged at a landing — no
landing-specific value is needed. **v1 of the anatomy feature is scoped to a
single flight piece** (risers/treads/stringers/side-wall/newel/rail on one
`stairs`/`stairs_half`); a continuous guard *across* a landing/newel-turn
junction between two separate pieces is a reasonable follow-up, not v1.

## Diorama design constants (recommended)

One nominal mm value per dimension, for the renderer to hard-code (mirroring
how `STAIRS_TREAD_DEPTH_MM = 280` / `STAIRS_MIN_RISER_MM = 130` already work
in `geometry.ts`, and `STAIR_STRINGER_T_MM` etc. already work in
`three-renderer.ts`):

| Constant | Recommended nominal | Code/typical range it sits in |
|---|---|---|
| Riser board thickness | **19 mm** (3/4 in) | typical closed-riser stock |
| Tread nosing overhang | **25 mm** (1 in) | IRC 19–32 mm |
| Handrail height above nosing | **900 mm** (~35.4 in) | IRC 864–965 mm (34–38 in) |
| Handrail profile diameter | **50 mm** (~2 in) | IRC circular 32–51 mm |
| Newel post section | **90 × 90 mm** | typical box newel ~100 mm sq. |
| Newel post height (tread/floor → cap) | **1150 mm** | typical 915–1200 mm |
| Baluster section | **35 mm square** | typical 32–45 mm |
| Baluster clear spacing | **100 mm** | code max ≈102 mm (4 in sphere) |
| Balusters per tread | **2** | traditional residential convention |
| Enclosed-stairwell side wall thickness | **100 mm** | matches Diorama's existing `Wall` thickness (`WALL_HALF = 50`) |
| Stringer / carriage thickness | **40 mm** | already shipped as `STAIR_STRINGER_T_MM` — reuse, don't duplicate |

## Sources

- [2018 IRC Residential Stair Guide, §R311.7](https://timnath.org/wp-content/uploads/2022/03/2018-RESIDENTIAL-STAIR-GUIDE.pdf)
- [Tread depth and risers — Viewrail](https://resources.viewrail.com/code-compliance/stair-code/tread-depth-and-risers)
- [Residential stair railing code requirements — BuyRailings](https://www.buyrailings.com/blog/buy-railings-1/residential-railing-code-requirements-for-decks-stairs-balconies-132)
- [R311.7.8.5 Grip Size — UpCodes](https://up.codes/s/grip-size)
- [Handrail size requirements — Viewrail](https://resources.viewrail.com/code-compliance/railing-code/handrail-size-requirements)
- [Newel post height — WoodStairs](https://www.woodstairs.com/newel-post-height/)
- [Height of newel post — NEFS](https://www.stair-part.com/height-of-newel-post.html)
- [Standard stair stringer dimensions — Oak Valley Designs](https://oakvalleydesigns.com/blogs/diy/standard-stair-stringer-dimensions)
- [Stair stringer specifications — InspectAPedia](https://inspectapedia.com/Stairs/Stair-Stringer-Specifications.php)
- [Traditional 3/4 in stair risers — WoodStairCo](https://www.woodstairco.com/traditional-treads-and-risers/traditional-3-4-riser.html)
- [What is the wall under the stairs called? — Stair101](https://stair101.com/what-is-the-wall-under-the-stairs-called/)
- [Spandrel — Wikipedia](https://en.wikipedia.org/wiki/Spandrel)
- [Baluster — Dimensions.com](https://www.dimensions.com/element/baluster-square)
- `docs/research/avatar-nav-stairs.md` (existing Diorama stairs geometry + IRC citation)
