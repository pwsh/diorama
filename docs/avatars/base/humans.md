# Avatar pack — Base / Humans

## Overview

**Hierarchy path**: `avatars › base › humans` (file: `docs/avatars/base/humans.md`).

This is the foundational "everyday person" group underneath every themed pack —
the age/life-stage variants of the plain human rig. It regroups the two
built-in kinds that already ship (`adult`, `child`) and rounds the set out with
new age variants (`toddler`, `teen`, `elder`) so a household's mmWave/BLE/AI
avatars can read as a family rather than a lineup of identical grown-ups.

**Shared style**: HUMANOID rig only (no quadrupeds in this group). Every
member is **tint-driven** — `skin` and `body` resolve to the per-sensor /
per-person identity color (`'tint'` in the spec blocks below, matching
`color` in `three-renderer.ts`'s `SPECS` table), so recoloring a sensor or
fusing a BLE person's color still repaints the whole figure the way `adult`/
`child` do today. Only secondary elements — shoes, hair, accessories — take
fixed hex values. All members use `headShape: 'sphere'`, `hands: 'sphere'`,
`eyes: 'dots'`, `steel: false` — the plain human "look," varied only by scale
(`sk`), head-size ratio (`headR`), limb proportions, and gait personality.

**Pack-wide base spec** (inherited unless a member overrides it):
```
headShape: sphere
hands:     sphere
eyes:      dots
steel:     false
skin:      tint
body:      tint
shoe:      0x1a1a1f   (dark shoe — overridden by toddler's soft sneaker)
emI:       0.25
```

**Proportion curve**: real head-to-body ratio flattens with age (1 yo ≈ 4
head-heights tall, 5 yo ≈ 6, 10 yo ≈ 7, 15 yo ≈ 7.5, adult ≈ 8 — see Sources).
The rig already encodes this trend for `adult`/`child` via `headR` shrinking
slower than `sk` (child is 60% scale but keeps 85% of adult head radius); the
new members below continue the same curve outward in both directions
(toddler exaggerates it further, teen eases back toward adult, elder holds
adult proportions but dials the gait down).

## Members

### `adult` — Adult (sensor-tint)
*existing kind: `adult`* — no changes proposed. Baseline human: full scale,
`headR 126`, dark shoe, `emI 0.25`. Every other member in this doc is defined
relative to it.

### `child` — Child (sensor-tint)
*existing kind: `child`* — no changes proposed. `sk 0.6`, `headR 107` (a
proportionally bigger head than the adult, per the curve above), same
dark shoe/eyes/hands. `AVATAR_PERSONALITY.child` already adds `bobMul: 1.25`
for a bouncier gait.

### `toddler` — Toddler (sensor-tint)
**Reference**: a generic 2–4-year-old — not a licensed character. Canonical
"toddler" silhouette: short legs, a large round head (~4 head-heights tall
vs. an adult's 8), a rounded belly, and a wide-set wobbly gait. Real-world
toddler standing height ≈ 85–100 cm (roughly a third of adult height).

**Spec**
```
sk:        0.42
headR:     100
headShape: sphere
limbR:     1.15        # stubby, slightly thick limbs read as "baby fat"
skin:      tint
body:      tint
shoe:      0xf2ede4     # soft cream sneaker, not the adult's dark shoe
emI:       0.25
hands:     sphere
eyes:      dots
steel:     false
armL:      0.85         # short arms
legL:      0.72         # short legs relative to oversized head/torso
```

**Accessories**
- `crown` (top of head): small tuft — one flattened sphere, ~40 mm, tint ×1.15
  (slightly lighter than body) for a hint of baby hair; optional, safe to
  omit if a pack wants a bald-toddler look.

**Silhouette check**: the oversized head (headR/sk ratio is the highest of
any member here) + very short legL is what reads "toddler" at 30 px — no
accessory is load-bearing. If the rig's leg-length floor (nav/animation
assumes some minimum stride) clips `legL 0.72`, that's a rig gap to verify
(see Rig gaps).

**Personality**: `{ bobMul: 1.4, swayMul: 1.3, cadenceMul: 1.3, ampMul: 0.75 }`
— quick, short, wobbly steps with a pronounced waddle-bob (busier than
`child`'s 1.25 bob, shorter stride than the general adult amp curve gives it).
**Bubbles**: `['🧸', '🍭', '🎈', '❓']`

### `teen` — Teen (sensor-tint)
**Reference**: a generic 13–17-year-old — not a licensed character. Near-adult
height/proportions (growth plates mostly closed by the mid-teens) but a
leaner build and a looser, more casual gait than an adult.

**Spec**
```
sk:        0.85
headR:     118
headShape: sphere
limbR:     0.92         # leaner limbs than adult
skin:      tint
body:      tint
shoe:      0x1a1a1f
emI:       0.25
hands:     sphere
eyes:      dots
steel:     false
```

**Accessories**
- `crown` (top of head, OPTIONAL): a hoodie-hood dome, same technique as the
  `hacker` kind's hood (downward bowl, raised + tilted back with a trimmed
  `phiLength` so the rim clears the brow) — tint × 0.7 (a darker shade of the
  body tint, like a hoodie over a same-color-family fit). Pack authors can
  drop this for a bare-headed teen; it's the one variant-flavor accent this
  member needs since everything else is scale-only.

**Silhouette check**: at 30 px, `teen` mostly reads via HEIGHT relative to
neighboring `adult`/`child` rigs in the same scene (a mid-scale figure between
the two) — the optional hoodie accessory is the one prop that gives it a
distinct read in isolation. Without the hoodie, `teen` and a small-built
`adult` are hard to tell apart at a glance; flagged below as a soft rig gap.

**Personality**: `{ bobMul: 1.0, swayMul: 1.1, cadenceMul: 1.05, ampMul: 1.05 }`
— a slightly loose, saunter-ish gait (a touch more sway/amp than adult
baseline, nothing exaggerated).
**Bubbles**: `['📱', '🎧', '🎮', '😂']`

### `elder` — Elder (sensor-tint)
**Reference**: a generic older adult (65+) — not a licensed character.
Canonical "senior" silhouette: adult scale/proportions but a slower, shorter
gait, often with visibly grey/white hair and sometimes a cane or glasses.

**Spec**
```
sk:        0.97          # a touch of height loss with age
headR:     124
headShape: sphere
limbR:     1
skin:      tint
body:      tint
shoe:      0x5a3d28       # brown walking shoe
emI:       0.25
hands:     sphere
eyes:      dots
steel:     false
```

**Accessories**
- `crown` (top of head): grey/white hair cap — half-dome, ~130 mm, color
  `0xe4e2df`, raised + tilted back like every other crown accessory so it
  clears the eye band.
- `face` (front, OPTIONAL): thin dark-rimmed glasses — a flat box outline,
  `0x24242a`, sat across the eye band.
- `hand` (prop, OPTIONAL): a cane — thin cylinder, ~700 mm, color `0x6b4a2f`,
  held at the side, angled down to a floor-contact point. Only makes sense
  while standing/walking; would need to be hidden during the seated/activity
  poses (same suppress-on-anchor treatment other hand props would need).

**Silhouette check**: the grey hair cap is the one MUST-HAVE accent — without
it, `elder` at adult `sk`/`headR` is nearly indistinguishable from `adult` at
30 px. The cane reinforces it but is optional flavor (would need pose-aware
hiding, see Rig gaps). A true "stoop" (a static forward-leaning spine) isn't
attempted here — the rig's only forward lean is the existing speed-proportional
pitch shared by every kind — so age-appropriate posture is carried entirely by
the **personality** gait dampening below, not a body-shape change.

**Personality**: `{ bobMul: 0.8, swayMul: 0.9, cadenceMul: 0.75, ampMul: 0.8 }`
— slower cadence, shorter stride, less bounce: the whole "elder" read leans
on this gait damping plus the grey-hair crown, per the note above.
**Bubbles**: `['📰', '☕', '🌷', '🧶']`

## Rig gaps

- **Static per-kind posture (stoop)**: the humanoid root only pitches
  proportional to walking speed (shared across all kinds) — there's no
  per-`Spec` static-lean knob. `elder` (and any future hunched character)
  can only lean on gait-personality damping + a hair/prop accessory, not a
  genuine stooped spine. A small constant `rootPitchBias` per spec would let
  `elder` (and later, e.g., a witch/hunchback pack) read correctly even
  standing still.
- **Pose-aware hand props**: `elder`'s cane and any future held prop (mug,
  phone, tool) has no way to auto-hide/re-anchor when the rig sits, does a
  standing activity, or idle-fidgets (arms move through poses the prop
  doesn't know about). Today's `hand` anchor is a fire-and-forget bolt-on;
  a hand-prop needs to either track the hand joint continuously (it already
  would, since it's parented) or be suppressed during activities that
  repurpose the arms (e.g. `work_at_desk`, `browse_bookshelf`) — worth a
  documented convention rather than solving ad hoc per pack.
- **Sub-child leg-length floor**: `toddler`'s `legL 0.72` combined with
  `sk 0.42` produces a very short absolute leg — worth a quick visual check
  against the nav/gait system's assumptions (foot-to-hip clearance, stride
  amplitude at very small `sk`) before shipping; no other pack member pushes
  `sk` this low today (the smallest existing kind, `cartoon_mouse`, is 0.85).
- **No new eye/head-shape style needed** — all five members use the existing
  `sphere` head + `dots` eyes; nothing here required a new rig primitive.

## Sources

- [Height of Heads at Different Ages (Male & Female) — ArhFoundation.org](https://www.arhfoundation.org/height-of-heads-by-age-male-female)
- [Understanding Changes in Body Proportions as Children Grow — Teachers Institute](https://teachers.institute/elementary-school-child/understanding-changes-body-proportions-children-grow/)
- [Research on Children's Body Proportions (head-length canon, ages 2–15) — MDPI Applied Sciences](https://www.mdpi.com/2076-3417/14/16/7185)
- Existing in-repo reference: `src/three-renderer.ts` `SPECS` table (`adult`/
  `child` field values quoted verbatim above) and `AVATAR_PERSONALITY` /
  `AVATAR_BUBBLES` tables for the existing-kind conventions this doc mirrors.
