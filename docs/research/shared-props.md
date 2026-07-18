# Shared Prop Library (avatars pick up & use common household objects)

## Summary

Diorama's Sims-style avatars already have three layers of "keeping busy"
behavior: idle fidgets (stretch/phone/yawn/…, ≤~4 s one-shots, CLAUDE.md
"Idle fidgets"), contextual activities (shower/dishwasher/eat-at-table/…,
anchored to specific furniture, CLAUDE.md "Activity system"), and the
avatar-device-interaction system (synthetic rigs walk up to an UNBOUND light/
switch/TV and flip it, CLAUDE.md "Avatar device interactions"). None of these
put a physical OBJECT in a rig's hand — a rig "vacuuming" today would just be
the fidget system's arm gestures with nothing to hold.

This feature adds a **shared prop library**: a small catalog of household
objects (vacuum, broom, umbrella, a plate of food, …) that ANY eligible
rig — human, robot/hover, or (a curated subset) quadruped pet — can pick up,
use for a bounded session with an object-appropriate animation, and put back
down, all driven by existing per-frame renderer state (idle dwell, weather,
time-of-day, room context, the plant-moisture system) with **no new HA
integration and no new dirty keys**. It reuses the avatar-accessory primitive
schema (`AvatarPrimitive`, `docs/avatars/AUTHORING.md`) as the prop geometry
format, the sparkle transient-mesh lifecycle as the build/dispose pattern, and
the device-interaction goal-branch + "reach one-shot" as the template for
"walk somewhere and do a thing with an object."

**Scope discipline, stated up front**: like avatar device interactions, this
is a **synthetic-rig-only** feature (`ai`/`roam` targets). Diorama's own
precedent — "real people mirror reality, not fiction" (CLAUDE.md, "Avatar
device interactions") — governs here even more strongly than it does for
flipping a light switch: putting an umbrella in a REAL tracked person's hand
because it's raining outside is inventing an object they may not actually be
holding. §3 pins this down explicitly, including why the tempting "give a
real outdoor person an umbrella when it rains" case still doesn't get an
exception in v1.

## Design goals / non-goals

- **Goal**: a glanceable, whimsical liveliness layer — the "kitchen at night
  grows snack bubbles" instinct, but with an actual object instead of just a
  thought bubble.
- **Goal**: reuse existing schema/mechanics wherever possible (accessory
  primitives, sparkle dispose idiom, device-interaction goal branch, idle
  fidget gate) rather than inventing a parallel system.
- **Goal**: eligibility is a first-class, simple, auditable rule — "who can
  hold what" must be answerable by reading one filter function, not scattered
  per-avatar-kind special cases.
- **Non-goal**: no new HA entities, bindings, or services. Everything a prop
  session reacts to (weather, time bucket, room name, plant thirst, TV-on
  state) is data Diorama already computes every frame for other features.
- **Non-goal (v1)**: no multi-step "put away the vacuum in the closet"
  narratives, no prop-to-prop handoffs between two rigs, no inventory UI. A
  prop is picked up, used, and vanishes — exactly like a fidget, just longer
  and with geometry.
- **Non-goal (v1)**: no season data (leaf-raking, unraked-leaves piles) —
  Diorama has no autumn signal today; parked (§6).

## "HA data model" — deliberately none

Every trigger this feature reads is **already computed** elsewhere in the
renderer/planner and passed through `ActivityContext` or renderer-internal
state:

| Signal | Already exists as |
|---|---|
| Weather condition / outdoors | `ActivityContext.weather.condition` + `_wallLoops` containment test (the same "is this point inside any closed wall loop" idiom the roamer interior-bias branch already uses, inverted for "outdoors") |
| Time of day | `ActivityContext.timeBucket` |
| Room name (kitchen bias) | `_roomZones` + `roomName.includes('kitchen')` (already used by the kitchen bubble tiers) |
| TV on, in this room | `_tvsByRoom` + `entityOn` (already used by `watch_tv` and the `dance` fidget's `danceRoom` check) |
| Thirsty plant | `Planner._plants` / the renderer's `_plants` registry + `thirsty` flag (already built for the droop effect) |
| Seated context | `h.sit`, `SitSpot.hostActivity` |
| Idle dwell | `h.dwell`, `rawSpeedMs` (the existing `idleStanding` gate) |

No new `Furniture`/`Store` binding fields are needed for the trigger side.
The only new persisted field is a single master on/off (`Store.avatarProps`,
§7) — the same shape as `avatarInteractions`/`avatarCostumes`.

## Real-world / animation reference

No new physical dimensions are needed (props are held/carried, not placed
fixtures), so this section is about *animation language*, not geometry specs
in the usual research-doc sense — those are folded into the per-prop table in
§4 instead, matched to Diorama's existing pose-channel vocabulary
(shoulder/elbow flex, hip/knee flex, root pitch/roll/yaw) exactly the way the
idle-fidget one-shots already compose (CLAUDE.md's `stretch`/`phone`/`yawn`/…
table is the direct model: "every fidget composes from EXISTING hip/knee/
shoulder/elbow channels + root pitch/roll — no new joints"). This feature
follows the identical discipline: **no prop introduces a new joint**; two
things ARE new (and are called out as such rather than silently claimed as
reuse): a `propPhase` free-running accumulator for prop-specific animation
beats (independent of gait `phase`, mirroring how `fidgetT` is independent of
it today), and a genuinely new **`idleSeated`** trigger gate (§5) since props
like popcorn/book/drink are more natural seated than standing and today's
idle-fidget gate (`idleStanding`) is standing-only.

The genre touchstone is The Sims' "advertised interactions" model — objects
broadcast what a Sim can do with them, autonomous idle Sims occasionally act
on a nearby advertisement, and using an object swaps out whatever the Sim was
holding. Diorama already borrows the series' whole visual language (plumbob,
toon shading, thought bubbles) per CLAUDE.md's "Sims-style rendering"; this
feature borrows the *behavioral* idiom the same intentional way — approximated
with Diorama's existing primitives, not a licensed asset pipeline.

## §1 — Capability & eligibility model

Every rig has exactly one **prop tier**, derived from fields already on the
built `Humanoid` (no new per-avatar-kind config needed for the common case):

```ts
type PropTier = 'hands' | 'quad' | 'none';

function propTierOf(h: Humanoid, def: AvatarDef): PropTier {
  if (h.sessile) return 'none';               // rooted (plant/coral) — no props, ever
  if (def.noProps === true) return 'none';    // NEW escape hatch (see below)
  if (h.quad) return 'quad';                  // pets — mouth-carry subset only
  return 'hands';                              // every other humanoid, INCLUDING hover
}
```

- **`hands` tier** — any non-sessile, non-quad humanoid, **including `hover`
  rigs** (floating droids/ghosts). This falls out of the existing rig build
  for free: `hover` only nulls the LEG joints (`leftHip`/`rightHip`/…, CLAUDE.md
  "Batch C1 rig extensions") — `handL`/`handR` groups are built and populated
  exactly like a grounded humanoid's. A floating robot butler picking up a
  vacuum needs **zero new renderer code** beyond the eligibility check passing
  — the existing `_addDeclarativeAccessories` anchor system already parents
  `handL`/`handR` props correctly regardless of `hover`. This directly
  satisfies the brief's "floating robots could use these."
- **`quad` tier** — `h.quad === true` (cat/dog and any `pet:true` quadruped
  pack member). Restricted to a small carry-in-mouth subset (§4, "fetch_toy"),
  parented to the `qhead` anchor (mouth-adjacent), never the `hands` catalog.
- **`none`** — sessile rigs (never — they're rooted, no gait, no goals to
  begin with) and any def explicitly opted out.
- **`AvatarDef.noProps?: true`** (NEW, optional, `src/avatars.ts`) — a
  per-avatar escape hatch, mirroring the brief's explicit ask ("keep it
  simple: no per-kind opt-outs in v1 beyond an optional `def.noProps?: true`
  escape hatch"). **Nothing sets it in v1** — a knight vacuuming is fine, a
  robot butler mopping is the point. It exists so a FUTURE pack author (e.g. a
  tiny fairy, a swarm-creature) can opt out without inventing a bigger rule.

Prop-side, each `PropDef` (§4) declares who can hold it:

```ts
type PropUsers = 'hands' | 'quad';   // 'any' reserved, unused in v1 (see §6)

interface PropDef {
  id: string;                 // e.g. 'vacuum_cleaner'
  users: PropUsers;
  category: 'chore' | 'weather' | 'leisure' | 'carry';
  cls: 1 | 2 | 3;              // trigger class (§3)
  allowSeated?: boolean;       // may fire from the (new) idleSeated gate too
  primitives: AvatarPrimitive[]; // reuses the accessory schema verbatim (§2)
  sessionDurS: [number, number]; // [min, max) random session length; class 3 ignores this
  poseHold: (h: Humanoid, t: number, propPhase: number, walking: boolean) => PropPoseDelta;
}
```

`_propEligible(h, def, propDef)` is the ONE gate every trigger site calls:

```ts
function _propEligible(h: Humanoid, propDef: PropDef): boolean {
  if (h.sessile) return false;
  if ((h as any).noProps) return false;         // captured at build from def.noProps
  if (propDef.users === 'quad') return h.quad === true;
  return !h.quad;                                 // 'hands' — everything non-quad, non-sessile
}
```

**Synthetic-only gate is separate from tier eligibility** — it's a property
of the TARGET, not the rig kind: `(t.ai || t.roam)` must be true. A `hands`-
tier human rig sourced from radar/BLE/camera truth is capability-eligible in
principle (it has hands) but is EXCLUDED by the synthetic-only rule (§3).
This mirrors avatar device interactions exactly, which already draws this
same line between "who has the capability" (any non-sessile rig) and "who is
allowed to act on it" (`ai`/`roam` only, never radar/BLE/cam).

## §2 — Prop geometry: reuse the accessory primitive schema

**Core design decision**: a `PropDef.primitives` field is a plain
`AvatarPrimitive[]` — THE SAME array shape a pack author writes for costume
accessories (`docs/avatars/AUTHORING.md`, box/cylinder/sphere/cone at
`handL`/`handR`/`qhead`/etc. anchors, `twoHanded` flag, `animate` channels).
This is not a new authoring format; it's the existing one, applied at RUNTIME
against an already-built rig instead of once at initial rig construction.

Concretely, this needs the mesh-building half of
`_addDeclarativeAccessories` (`three-renderer.ts:13231`) — the
`anchorOf`/`matFor`/geometry-`switch`/`animate`-registration/`twoHanded`-
registration block — **factored out into a small reusable helper**
(`_buildPrimitiveMesh(prim, ctx)` returning the built `THREE.Mesh` +
side-registrations) that BOTH the initial rig build and a new
`_equipProp(h, propDef)` call. This is the single recommended refactor; every
other capability (anchors, `twoHanded` aim, `animate` sway/flap/orbit/spin)
falls out for free because it's literally the same code path:

- A prop primitive anchored `handL`/`handR` with `twoHanded: true` (broom,
  snow shovel — a long-handled tool gripped by both hands) gets the EXACT
  same per-frame re-aim `_advanceTwoHandProps` already gives staffs/spears:
  register it into `h.twoHandProps` at equip time, unregister at teardown.
- A prop primitive with `animate: {kind:'sway', ...}` (e.g. a spray bottle's
  trigger, or a dangling dish-towel corner) gets the existing
  `_advanceAnimPrims` oscillation for free by pushing into `h.animPrims` at
  equip and SPLICING it back out at teardown (today `animPrims` is a
  build-once, dispose-with-rig array; props need it to be **removable**
  mid-life — a small but real change: `h.animPrims` becomes prop-session-aware,
  or props get their OWN parallel `h.propAnimPrims` list advanced by the same
  `_advanceAnimPrims` call with a second array — the latter avoids touching
  the invariant that `animPrims` is immutable-after-build for the rig's own
  authored accessories).
- `qhead`-anchored props (fetch_toy) reuse the quadruped anchor resolution
  unchanged — `ctx.quadHead` is already passed into `_addDeclarativeAccessories`.

**Materials**: prop primitives mostly use literal hex colors (props are
generic objects, not costume identity) — a fresh `this._mat({...})` per prop
mesh, same as any hex-colored accessory. One deliberate exception: the
**umbrella canopy** and (optionally) a **mug's tint band** use `color:'tint'`
— sharing the rig's identity-color material (`ctx.tint`, the SAME instance
every other tinted accessory on that rig uses) for a small per-avatar
personality touch. This has a disposal consequence (§5): a prop mesh using
`'tint'`/`'skin'`/`'body'`/`'dark'` must NEVER have its material disposed at
session end (it's shared with the rig body and other accessories); only
literal-hex-colored prop meshes own their material.

## §3 — Trigger model

Four independent trigger CLASSES, chosen per-prop by what kind of behavior
makes sense for that object — not every weather-conditional prop is the same
shape of event (an umbrella is a *state you're already in*; shoveling is a
*task you go do*):

### Class 1 — Goal-driven chore/task sessions (walk somewhere, do a thing)

Mirrors the existing avatar-device-interaction goal branch in `_aiPickGoal`
(`three-renderer.ts:10740`, the `~1/8 of rolls` device-interaction block)
almost exactly:

- New weighted roll in `_aiPickGoal` (own weight, recommend **~1/10** of goal
  rolls, own per-rig cooldown `ai.nextPropAt` mirroring `ai.nextInteractAt`,
  own per-prop-TYPE cooldown map `_propTypeCooldownAt[propId]` mirroring
  `_itemInteractAt`, so the same prop doesn't reappear back-to-back across the
  floor).
- Gate: `this._avatarPropsOn && !ai.propKind && _propEligible(h, propDef)` for
  each candidate prop, filtered to `cls===1` defs.
- **Candidate target resolution is per-prop** (this is where the "context
  bias" lives, not a separate mechanism):
  - `vacuum_cleaner` / `broom` — any free interior cell in the rig's region +
    home loop (identical pick to the plain "wander somewhere in this room"
    branch — no dedicated anchor type needed).
  - `dish_towel` — reuses an EXISTING `_activityAnchors` entry tagged
    `wash_hands` (kitchen sink) or any `surface:true` counter/island piece —
    literally the same anchor list the standing-activity system already
    built for `wash_hands`/`load_dishwasher`, just filtered.
  - `window_squeegee` (kit) — a random `Window` on the current floor; approach
    point = ~600 mm inside the wall along the window's normal (the SAME
    interior-offset construction `updateFloor`'s `gaze_window` ambient anchor
    already computes for windows — reuse that math, don't reinvent it).
  - `watering_can` — a THIRSTY plant from `this._plants` (the droop-effect
    registry, which already carries a per-fixture `thirsty` boolean and plan
    position). **If zero plants are thirsty, `watering_can` is not offered as
    a candidate at all** — no fallback to watering a non-thirsty plant. This
    keeps the tie-in to the real moisture-sensor data meaningful instead of
    decorative.
  - `snow_shovel` — gated additionally on `outdoors && weather.condition ∈
    {snowy, snowy-rainy}`; target = a random outdoor free cell (reuse the
    `_aiRandomCell` "any in-region cell" path with the loop filter INVERTED —
    outside every wall loop instead of inside one, the same idea the roamer
    interior-bias branch already expresses as `anyLoops.some(...)`, just
    negated).
- **Arrival handling** mirrors the device-interaction dwell exactly
  (`three-renderer.ts:10634-10665`, the `ai.interactId !== undefined` branch):
  on path completion, `ai.state = 'idle'`, start a short dwell/turn-to-face,
  then call `_startPropSession(h, propKind, targetX, targetY)` once (analogous
  to firing the reach one-shot + `onAvatarInteract` callback exactly once at
  the reach's peak) — except a prop session doesn't call back into the
  Planner at all (nothing is toggled; this is purely cosmetic), so there's no
  `onAvatarInteract`-style external hook.
- **In-session movement**: rather than inventing new locomotion, a Class 1
  chore session is **2–4 short repick legs** (~1000–2500 mm each) within the
  same target room/anchor area, using the EXISTING path/walk system
  unmodified — the session just keeps re-issuing nearby micro-goals until its
  timer (`propDurS`) expires, instead of one long walk. This is why no new
  movement code is needed: "vacuuming while walking a short back-and-forth" is
  just "wander with a tight radius and a held arm pose," which the existing
  carrot-chaser + gait system already produces once the goal-picker is told to
  stay close.

### Class 2 — Idle-driven ambient props (no destination, fires in place)

For props that don't need a location (ice cream, a drink, a book, a plate of
food, popcorn) — these extend the **idle-fidget mechanism itself**, not the
goal system:

- **New `idleSeated` gate** (genuinely new, not reused — flagged explicitly
  per the instructions): today's `idleStanding` (`three-renderer.ts:11720`,
  `h.sit < 0.1 && h.act < 0.1 && h.lie < 0.1 && rawSpeedMs < 0.15 && h.dwell >
  2`) only fires standing. Several of these props (popcorn, book, a drink) are
  more natural seated. Add a sibling condition:
  ```ts
  const idleSeated = h.sit > 0.9 && h.act < 0.1 && h.lie < 0.1 &&
    rawSpeedMs < 0.15 && h.dwell > 2;
  ```
  built the identical way, just inverted on `sit`.
- A prop-session picker sits ALONGSIDE the existing `fidgetKind` picker in
  both gates, on its own longer timer (`propNext`, recommend 25–70 s, wider
  than the fidget's 8–20 s since a prop session runs longer per engagement) —
  **mutually exclusive with `fidgetKind`**: `if (h.propKind) { /* skip the
  fidget picker this frame */ }`. A rig checking its phone and eating an ice
  cream at once doesn't happen; they alternate.
- Candidate filtering by context, same "the item just isn't in the candidate
  list" idiom as Class 1 (no separate mechanism for "soft" vs "hard" gates —
  simpler to reason about and test):
  - `plate_of_food`, `ice_cream_cone`, `drink_cup` — any idle/idleSeated rig,
    no room requirement (`allowSeated: true` for all three).
  - `popcorn_bucket` — **hard-gated**: only a candidate when `idleSeated` AND
    the rig's current room has a bound TV that's ON — literally reuse the
    `danceRoom` lookup (`three-renderer.ts:11734-11742`, `_tvsByRoom` +
    `entityOn`) verbatim. Eating popcorn while vacuuming makes no sense, so
    this is a hard filter, not a soft weight.
  - `book` — both `idleStanding` and `idleSeated`, `allowSeated: true`,
    weighted up (not gated) in `evening`/`night` timeBucket — a physical
    referent for the pre-existing 📖 glyph already in
    `BUBBLE_POOL_SEATED_EVE`/the idle chatter pool.
  - `drink_cup` — cosmetic morning bias: at session start, if `timeBucket ===
    'morning'`, build the "mug" variant (adds a handle primitive, warmer brown
    color) instead of the default "cup/glass" variant — a build-time branch
    inside the prop's own builder, not a new mechanism (echoes 🍳/☕ morning
    kitchen bubbles).
- **Session shape**: no destination, no walking. The rig equips in place,
  plays its `poseHold` animation (periodic hand-to-mouth / page-turn / sip
  beats, §4) for `sessionDurS`, then de-equips. If the rig starts walking, or
  `h.act`/`h.lie`/`h.privacy` engage mid-session (an interrupt), the session is
  force-ended immediately — same interrupt idiom as `else if (h.fidgetKind)
  h.fidgetKind = null;` in the existing idle block.

### Class 3 — Condition-driven passive equip (a state, not a task)

**Umbrella only** in v1. Distinguishing test: "is this a TASK the rig goes
and DOES, or a STATE the rig is already IN that a prop just reflects?" A
rig standing/wandering outdoors while it's raining is already in that state —
no goal, no session timer:

```ts
// checked ~1×/s per eligible synthetic rig (cheap booleans, no allocation)
const wantUmbrella = (t.ai || t.roam) && !h.quad &&
  outdoors(t.x, t.y) && RAIN_FAMILY.has(ctx.weather?.condition);
if (wantUmbrella && h.propKind == null) _startPropSession(h, 'umbrella', null, null, Infinity);
if (h.propKind === 'umbrella' && !wantUmbrella) _endPropSession(h);
```
`outdoors(x,y)` = `!this._wallLoops.some(lp => pip(x, y, lp))` (the inverse of
the containment test the roamer interior-bias branch already performs). No
duration timer (`sessionDurS` is ignored for class 3 — the condition itself is
the timer); hard-cut equip/unequip is acceptable for v1 (a rare, brief-
transition-tolerant cosmetic, same tolerance the codebase already accepts
elsewhere — e.g. the fridge-door build-vs-blend distinction). `snow_shovel`,
despite ALSO being weather-gated, is deliberately Class 1 (§ above) — shovel-
ing is an activity you go DO, not a garment you're wearing.

### Class 4 — Quad carry (pets)

`fetch_toy` (random skin: ball / bone / stick, chosen once at pickup) is
**idle-driven, quad-only**, sitting next to Class 2's `idleStanding`-analog
for quads (a quad rig, `h.sit < 0.1`, dwelling or freely wandering, low
per-interval roll — no location requirement, "found it nearby"). No goal walk
(quads already route through the same `_aiPickGoal`/`AiState` machinery per
CLAUDE.md's "Quadruped rigs" section, but a Class-1-style dedicated fetch walk
is explicitly parked to v2, §6, to keep v1 mechanically simple: pick it up,
carry it while wandering normally, drop it after `sessionDurS`). Mesh parents
to `qhead` (mouth), offset forward along the snout — the only prop anchored
somewhere other than a hand in v1. Pose: a small head-bob amplitude BOOST
(reuse the existing quad head-bob channel, no new channel) reading as "proud
carrying"; no hand-to-mouth beat (nothing to compose — the mouth IS the anchor).

### Master toggle & synthetic-only enforcement

`Store.avatarProps?: boolean` (absent/true = on — same shape and same
Settings-tab location as `avatarInteractions`/`avatarCostumes`,
`src/types.ts`), threaded through `ActivityContext.props?: boolean` (optional/
additive, stale-chunk safe like every other `ActivityContext` field added
since batch C1) and read in `three-view.ts` next to the existing
`avatarInteract: p.store.avatarInteractions !== false` line
(`ui/three-view.ts:1695`) as `props: p.store.avatarProps !== false`.

**Every trigger site (Class 1/2/3/4) additionally requires `(t.ai || t.roam)`
— a NEW, narrower restriction than the pre-existing idle-fidget system**,
which today fires on ANY rig type including real radar/BLE/camera-tracked
people (a real person standing still already gets a phone-check gesture from
the existing fidget picker — that's out of scope to change and is NOT being
touched here). Props are held to the stricter avatar-device-interaction
precedent instead. This is the answer to "should a real person standing
outside in real rain get a rendered umbrella?" — **no**, by design, even
though it's tempting and arguably harmless: consistency with "real people
mirror reality, not fiction" wins over the one cute case, and the master
toggle + synthetic-only gate are the SAME two lines of code regardless of
which prop class is checking, so there's no per-prop exception path to
accidentally leave open. §8 records this as a real, revisitable product
decision, not an oversight.

## §4 — Prop catalog (v1 = 13 defs)

Every prop's `poseHold` is described in terms of the SAME channel vocabulary
CLAUDE.md's "Animated humanoid targets" section already documents (`lSh/rSh`
shoulder flex, `lEl/rEl` elbow flex, `lHip/rHip`/`lKnee/rKnee`, `leanX`
(root pitch), `rollZ` (root roll), `yawFidget`-style yaw). While a prop is
equipped, the GRIP arm's shoulder/elbow channels are **overridden** after the
normal walk-swing/sit/activity computation — exactly the same slot in the
pipeline the table-eating IK and the device-interaction reach one-shot already
occupy (a static or animated hold pose replaces the swing for that arm only;
the free arm keeps its normal channel unless the prop is `twoHanded` or a kit
occupies both hands).

| id | tier | cls | grip | geometry (mm, sk=1) | `poseHold` | seated? |
|---|---|---|---|---|---|---|
| `vacuum_cleaner` | hands | 1 | handR, one-handed | canister box 300×250×400 + 2 wheel cylinders + tall handle cylinder ~900 to handR + small head cone | `rSh≈0.9` held, `rEl` push-pull oscillation ±0.15 @ 1.5 Hz (`propPhase`); `leanX+=0.05` | no |
| `broom` | hands | 1 | handL+handR, `twoHanded:true` | one centered cylinder shaft (broom-precedent per AUTHORING.md) + flat straw-color box "bristles" at the far end | held two-hand grip (`rSh≈0.6,rEl≈0.9`); ROOT YAW arc ±0.3 rad @ 0.8 Hz synced with amplified weight-shift sway (reuses the ambient `swayHK` idiom) reads as the sweep, not a new shoulder-abduction channel | no |
| `dish_towel` | hands | 1 | handR, one-handed | thin flat cloth box 180×20×220, `'tint'`-able trim optional | `rSh≈0.9` held, `rEl` small-circle approximation: `rEl = 1.3 + 0.25·sin(propPhase·2π·1.8)`, `leanX-=0.08` toward the counter | no (standing at a counter anchor) |
| `window_squeegee` (kit) | hands | 1 | handR squeegee + handL spray bottle, BOTH one-handed (not `twoHanded` — two independent props) | squeegee: short handle + wide flat rubber-blade paddle 250×15×80; bottle: small cylinder + trigger box ~60×140 | squeegee arm: `rSh` arcs 1.6↔0.6 @ 0.4 Hz (top-to-bottom wipe); bottle arm: periodic `lEl` flick every ~2 s | no |
| `watering_can` | hands | 1 | handR, one-handed | can body (rounded box or squat cylinder) + angled spout cone + loop handle | `rSh≈1.3,rEl≈1.0` held; periodic tip-pour pulse `rEl+=0.3` for 0.4 s every ~2 s | no |
| `snow_shovel` | hands | 1 | handL+handR, `twoHanded:true` | long shaft cylinder + wide flat blade box at the end | cyclic scoop-and-toss: shoulder dips `rSh≈0.3` then arcs to `≈1.6` with a toss flick at the top, elbow follows, ~0.5 Hz; `leanX` forward during the dip | no |
| `umbrella` | hands | 3 | handR, one-handed | canopy = flattened sphere-arc or wide cone, color `'tint'`; shaft = thin cylinder handR→canopy underside | `rSh≈2.0` (near-vertical raise) held, `rEl` slight bend — composes with normal walking (other arm unaffected); no `propPhase` animation (static hold) | n/a (walking/standing) |
| `plate_of_food` | hands | 2 | handL plate (held), handR eats | plate = flat disc/box 220×15×220 with 1–2 small food-lump primitives; eating hand = periodic reach | handL: `lSh≈0.7,lEl≈1.6` held; handR hand-to-mouth beat every 3–5 s (`rSh` 0.3→1.7→0.3, `rEl` 0.3→2.0→0.3, ~0.4 s each way — same shape as the `phone`/`check_watch` fidget raise) | yes |
| `ice_cream_cone` | hands | 2 | handR, one-handed | cone primitive + sphere "scoop" on top | relaxed carry `rSh≈0.6` while walking; lick/bite beat every 2–3 s (lighter/faster version of the plate beat) | yes |
| `drink_cup` | hands | 2 | handR (or handL), one-handed | cylinder cup/mug; morning variant adds a small handle box + warmer color | relaxed low carry `rSh≈0.4`; sip beat every 4–8 s (`rSh`→1.6,`rEl`→1.8 briefly) | yes |
| `popcorn_bucket` | hands | 2 (hard TV-gated) | handL bucket (held), handR reaches in | bucket = truncated-cone box, striped `'tint'` band optional | handL: `lSh≈0.7` held; handR punchier reach-to-mouth beat every 1.5–2.5 s, smaller amplitude than plate/ice-cream | yes (required) |
| `book` | hands | 2 | handL primary (book), handR "supporting" | flat box 180×240×20 | both arms static reading pose (`lSh/rSh≈0.9-1.0`, `lEl/rEl≈1.7-1.8`); page-turn flick every 4–7 s (`rEl` 1.8→1.3→1.8); `leanX+=0.1` head-down | yes |
| `fetch_toy` | quad | 4 | `qhead` (mouth), forward offset along snout | one of: small ball sphere / bone (2 small spheres + thin cylinder) / stick (thin cylinder) — random skin at pickup | no hand channels; quad head-bob amplitude boosted while carrying | n/a |

All thirteen satisfy the brief's explicit list (vacuum, broom, window-washing
supplies, dish towel, umbrella, dishes-for-eating → `plate_of_food`, ice
cream, drinks) plus the requested expansion, at least one quad-only item
(`fetch_toy`), and hover-rig coverage (falls out of the `hands` tier
automatically, demonstrated concretely by any of the 12 `hands` props —
e.g. a floating robot butler vacuuming).

## §5 — Prop-swap mechanics (build / hide-authored-accessories / dispose)

### Humanoid fields (new)

```ts
// three-renderer.ts, Humanoid interface — additive, mirrors the fidget block
propKind: string | null;              // active PropDef id, null = none
propCls: 1 | 2 | 3 | 4 | 0;            // which trigger class is driving it (0 = none)
propMeshes: THREE.Object3D[];         // built at equip, torn down at release
propT: number;                        // elapsed seconds in the current session
propDur: number;                      // total session length (Infinity for class 3)
propPhase: number;                    // free-running animation accumulator (independent of gait `phase`)
propGoalX: number | null;             // class 1 target (null once arrived / for class 2/3/4)
propGoalY: number | null;
propHiddenAccessories: THREE.Object3D[]; // authored hand accessories hidden for this session
propAnimPrims: AnimPrim[];            // prop-owned entries advanced by _advanceAnimPrims (parallel to h.animPrims)
propTwoHand: { mesh: THREE.Object3D; otherHand: THREE.Object3D }[]; // prop-owned twoHanded registrations
```

`AiState` gains a parallel small addition mirroring `interactId/X/Y`:
```ts
propKind?: string;      // set by _aiPickGoal's class-1 branch; consumed on arrival
propX?: number; propY?: number;
```

### Hiding authored hand accessories

The declarative-accessory build loop (`_addDeclarativeAccessories`) is
extended to also collect **hand-anchored** meshes it built (any prim whose
resolved anchor is `handL`/`handR`/`wristL`/`wristR`) into a NEW
`Humanoid.handAccessories: {mesh: THREE.Object3D; hand: 'L'|'R'}[]` list at
initial rig construction — a small, purely additive change (the anchor
resolution already happens in that loop; this just also remembers which
meshes ended up on which hand). At prop-session start, for each entry whose
hand matches the prop's grip hand(s) (both hands for a `twoHanded` prop or a
two-piece kit), set `mesh.visible = false` and push it onto
`h.propHiddenAccessories`; at session end, restore `visible = true` for
everything in that list and clear it.

**Known gap, called out rather than silently glossed over**: this hide/
restore mechanism only covers the DECLARATIVE accessory pipeline (every pack-
authored def since Phase 4a). A handful of LEGACY kinds still build hand
items via the older imperative `_addAvatarAccessories` switch, which doesn't
register into `handAccessories`. In practice very few legacy kinds hold a
hand item at all (most legacy hand-relevant looks are costume-wide, not a
single removable prop), so the double-holding artifact this could produce is
rare and cosmetic — flagged in §8 as an acceptable v1 gap, not solved here.

### Build (equip)

`_startPropSession(h, propKind, goalX, goalY, dur)`:
1. Look up `PROP_DEFS[propKind]`.
2. For each `AvatarPrimitive` in `propDef.primitives`, call the (newly
   extracted) `_buildPrimitiveMesh(prim, ctx)` shared helper against the
   LIVE rig's existing anchor groups (same `ctx.handL/handR/qhead/…` the
   initial build used — captured once per rig and kept around, or
   re-derived cheaply from the rig's stored joint refs; either is fine,
   no perf concern at prop-session frequency).
3. Push resulting meshes into `h.propMeshes`; route `animate`/`twoHanded`
   registrations into `h.propAnimPrims`/`h.propTwoHand` (NOT the rig's own
   `animPrims`/`twoHandProps`, which stay build-once/immutable).
4. Hide matching `h.propHiddenAccessories` per the grip hand(s) above.
5. Set `propKind`, `propCls`, `propT = 0`, `propDur` (random in
   `sessionDurS`, or `Infinity` for class 3), `propPhase = 0`.

### Per-frame (advance)

Inside `updateTargets`, alongside the existing `_advanceAnimPrims`/
`_advanceTwoHandProps` calls: if `h.propAnimPrims.length` /
`h.propTwoHand.length`, run the SAME two functions against those parallel
lists (zero new per-frame logic, just called with a second array). Pose
override: `if (h.propKind) { propDef.poseHold(h, propT, propPhase, walking)
writes lSh/rSh/lEl/rEl/leanX/rollZ AFTER the normal walk/sit/activity/table-IK
block, BEFORE the idle-fidget block, which is skipped this frame } else {
/* existing idleStanding / idleSeated / fidget logic */ }`. `propT`/
`propPhase` both `+= dt` unconditionally while a session is active.

### Dispose (release)

`_disposePropSession(h)` — mirrors `_disposeHumanoid`'s guarded decal-map
disposal idiom exactly:
```ts
for (const m of h.propMeshes) {
  m.parent?.remove(m);
  (m as THREE.Mesh).geometry?.dispose();
  if (m.userData.propOwnMaterial) (m as THREE.Mesh).material?.dispose(); // NOT for 'tint'/'skin'/'dark' shares
}
h.propMeshes = []; h.propAnimPrims = []; h.propTwoHand = [];
for (const m of h.propHiddenAccessories) m.visible = true;
h.propHiddenAccessories = [];
h.propKind = null; h.propCls = 0; h.propT = 0; h.propDur = 0;
```
Called: (a) naturally when `propT >= propDur` (class 1/2/4) or the class-3
condition breaks; (b) on ANY interrupt (`h.act`/`h.privacy`/`h.lie` engaging
mid-session, or the rig starting a non-prop walk for class 2/4); (c) at the
TOP of `_disposeHumanoid` (a rig fully despawning mid-session must not leak
the prop meshes — one added line); (d) on any kind/color rebuild that
replaces the rig wholesale (recolor, re-roll, fused-identity swap) — same
"don't carry state across a rebuild" rule the bubble/blur system already
follows.

### No claim/lock system needed

Unlike `SitSpot`s (a finite set of physical seats two rigs must not double-
occupy), props are **not drawn from a shared pool of scene objects** — each
rig builds its OWN meshes at equip time. Two rigs vacuuming simultaneously in
different rooms (or even the same room) need no coordination; there is no
"only one vacuum exists" constraint. This is worth stating explicitly because
it's the one place this feature could be mistaken for needing the SitSpot-
style claim machinery, and it doesn't.

## §6 — Not proposed for v1 (parked, with reasons)

| Prop | Why parked |
|---|---|
| `duster` | Mechanically identical to `dish_towel` (anchored wipe) — a trivial reskin once that ships; no new design value in v1. |
| `mop_bucket` | Same mechanism as `broom` (twoHanded sweep) plus a stationary bucket set-down detail — reskin, not new design. |
| `laundry_basket` | Needs a genuinely new "carried against the torso with both arms" hold-pose family (not a hand-grip variant of anything existing) AND a "laundry room" anchor concept that doesn't exist in the current anchor taxonomy. Real design work, not a reskin — promote once a torso-carry pose exists. |
| `toolbox` | Implies a kneel/crouch root pose near an appliance — a genuinely new root-pose family (today's poses are all standing/seated/lying, no kneeling). Parked pending that rig gap. |
| `leaf_rake` | Same mechanism as `broom`/`snow_shovel`, but Diorama has no season signal to gate it realistically (no autumn data anywhere in the codebase) — either ships as an always-eligible generic outdoor chore (fine, just no seasonal payoff) or waits for a season signal. Cheapest promotion candidate in this table once the mechanism ships. |
| `garden_hose` | Needs a trailing, bending hose from a fixed spigot point to the moving rig — a genuinely new "stretchy prop" rendering problem, not a static mesh. High effort, low payoff; parked. |
| `newspaper` | Near-duplicate of `book` (same reading pose, different mesh) — trivial reskin once `book` ships. |
| `game_controller` | Near-duplicate of `drink_cup`/`popcorn_bucket`'s seated-near-TV mechanism, with a thumb-twitch micro-animation instead of a hand-to-mouth beat. Cheap; parked only for v1 headcount discipline — good first v2 addition. |
| `guitar` | Fits the `twoHanded` neck-span pattern with an added one-arm strum animation (feasible, not a new mechanism) but is pure flavor; deprioritized. |
| `yarn_ball` | Mechanically identical to `fetch_toy` for cats — trivial reskin; parked purely for v1 headcount discipline, promote immediately after `fetch_toy` ships. |
| Season-gated triggers generally | No season data exists in Diorama today (weather condition + time-of-day only). Out of scope until/unless a season signal is added for an unrelated feature. |
| Real (radar/BLE/cam) rigs holding ANY prop | Explicit product decision, §3/§8 — "real people mirror reality" wins even for the sympathetic umbrella case. |
| Prop pickup while lying in bed (`book` especially) | Thematically appealing (ties to the existing `BUBBLE_POOL_BED` 📖/💭 glyphs) but needs the lie-pose arm channels worked out for a held object without clipping through the blanket-cover system; parked as the most promising v2 addition rather than rushed into v1. |
| Cross-species interaction (dog fetches a human-thrown ball) | Fun but a genuinely different feature (two-rig choreography) — out of scope; `users:'any'` is reserved in the type for this future direction, unused today. |
| Per-rig prop "personality"/affinity weighting | Nice-to-have polish (some avatar kinds prefer certain props) — no design blocker, just deferred for scope discipline. |
| Multi-waypoint vacuum routes (visit several spots) | v1's "2-4 short repick legs" already reads fine; a smarter room-coverage route is a pure animation-quality polish pass, not a new capability. |

## §7 — Integration checklist

1. **Types** (`src/avatars.ts`): `AvatarDef.noProps?: true`.
2. **Types** (`src/types.ts`): `Store.avatarProps?: boolean` (absent/true =
   on, same doc-comment style as `avatarInteractions`/`avatarCostumes`,
   `types.ts:1116-1117`).
3. **Planner** (`src/planner.ts`): add `avatarProps: remote.avatarProps ??
   undefined` to `_loadFromHa`'s explicit field list (next to
   `avatarInteractions`/`avatarCostumes`, `planner.ts:1652-1653`).
4. **`ActivityContext`** (`three-renderer.ts`): add `props?: boolean`
   (optional/additive, next to `avatarInteract`/`costumes`).
5. **three-view** (`ui/three-view.ts:1694-1696`): add `props: p.store.avatarProps
   !== false` to the `ctx` object build, alongside the existing
   `avatarInteract`/`costumes` lines.
6. **Refactor**: extract `_buildPrimitiveMesh(prim, ctx)` out of
   `_addDeclarativeAccessories` (three-renderer.ts:13231) so both the initial
   rig build and the new prop-equip path share it.
7. **New prop catalog module** (recommend `PROP_DEFS` as a `const` table near
   `IDLE_FIDGETS`/`BUBBLE_POOL_*`, three-renderer.ts) — the 13 `PropDef`
   entries from §4, each `primitives: AvatarPrimitive[]` + `poseHold`.
8. **`Humanoid` interface**: the new fields listed in §5 (all additive,
   defaulted at rig construction like every other new Humanoid field to date).
9. **`AiState` interface**: `propKind?/propX?/propY?` (mirrors `interactId/X/Y`).
10. **`_aiPickGoal`** (three-renderer.ts:10740): new Class-1 candidate branch
    (own weight/cooldowns), reusing/negating the existing outdoor-loop-
    containment idiom for `snow_shovel`, and the existing `_activityAnchors`/
    window/`_plants` lookups for target resolution (§3).
11. **Arrival handling**: extend the AI wander/idle state machine
    (three-renderer.ts:10627-10665) with a `propKind !== undefined` branch
    parallel to the existing `interactId !== undefined` branch, calling
    `_startPropSession` once on arrival.
12. **`updateTargets`**: add the new `idleSeated` gate alongside
    `idleStanding` (three-renderer.ts:11720); insert the prop pose-override
    branch (mutually exclusive with the fidget block); advance
    `propT`/`propPhase`/`h.propAnimPrims`/`h.propTwoHand`; the Class-3
    umbrella continuous check; the Class-4 quad carry check.
13. **`_disposeHumanoid`**: call `_disposePropSession(h)` first thing (leak
    guard for a rig despawning mid-session).
14. **Sidebar/Settings**: Settings ▸ Display gains an "Avatars use shared
    props" checkbox next to the existing "Avatars use unbound devices" /
    costume toggles (same block, same on/off semantics).
15. **Verify**: `npm run typecheck && npm run build`; manually watch a
    synthetic (AI or roamer) avatar idle long enough to trigger a Class 2 prop,
    place a thirsty plant + watch a Class 1 `watering_can` session, toggle a
    test weather source to a rainy condition and walk a roamer outdoors to
    confirm the Class 3 umbrella equips/unequips at the boundary, and confirm
    a radar-bound (non-synthetic) target NEVER equips anything regardless of
    idle time or weather.

## §8 — Test plan (`test-pages/props-test.html`, recommended)

Following the density/structure of `avatar-anim-test.html` (32 assertions) and
`action-button-test.html` (32 assertions) — bundle the real renderer +
`avatars.ts` via esbuild like those harnesses. Assertion groups:

1. **Catalog integrity** — all 13 `PROP_DEFS` entries have a valid `users`,
   non-empty `primitives`, and a `poseHold` function.
2. **Eligibility** — a `hands`-tier prop rejected for a `quad` rig; a
   `quad`-tier prop rejected for a non-quad rig; a `sessile` rig never
   equips anything; a `def.noProps` rig never equips anything.
3. **Synthetic-only regression guard** — a radar/BLE/camera target (`t.ai`
   and `t.roam` both false) never gets `propKind` set even when every idle/
   weather/context condition is otherwise satisfied. This is the single most
   important assertion in the suite — it's the enforcement of §3's central
   product decision.
4. **Class 1 candidate gating** — `watering_can` never appears as a
   candidate with zero thirsty plants in `_plants`; appears (seeded RNG) once
   one exists, targeting that plant's position. `snow_shovel` only a
   candidate outdoors + snowy-family condition.
5. **Class 1 lifecycle** — arrival sets `propKind`/builds `propMeshes`/hides
   matching `handAccessories`; natural timeout clears `propKind`, disposes
   meshes (geometry/material dispose call counts), restores hidden
   accessories to `visible=true`.
6. **Class 2 idle-standing vs idle-seated** — `idleSeated` only true when
   `h.sit>0.9`; `popcorn_bucket` never a candidate unless seated AND an
   in-range bound TV is on (reuse the existing `danceRoom` test fixture);
   mutual exclusion with `fidgetKind` asserted every frame a prop is active.
7. **Class 3 umbrella** — outdoor + rainy-family ⇒ equips; indoor OR non-
   rainy ⇒ never equips; stepping indoors mid-session or the condition
   clearing unequips promptly; no `sessionDurS` timeout applies (equip
   persists arbitrarily long while the condition holds, in a seeded test that
   runs many frames).
8. **Class 4 fetch_toy** — only a `quad` rig equips it; mesh parents under the
   `qhead` group; a non-quad rig with the master toggle on never receives it.
9. **Master toggle** — `ctx.props === false` ⇒ inert across all four classes;
   absent/`true` ⇒ normal (stale-chunk-safe default check).
10. **Mutual exclusion / interrupt** — a rig with `h.act>0.1`, `h.privacy>0.3`,
    or `h.lie>0.5` never equips, and a mid-session prop is force-released
    (disposed cleanly, no dangling geometry) the instant one of those engages.
11. **Dispose-on-teardown** — `_disposeHumanoid` called mid-session leaves no
    un-disposed geometry/material (dispose call counts asserted, mirroring the
    existing sprite/blur-map dispose tests).
12. **Hover regression guard** — a `hover:true` def successfully equips a
    `hands`-tier prop (hand groups present despite no legs) — the concrete
    check for "floating robots could use these."
13. **Shared-material dispose guard** — a prop mesh using `color:'tint'`
    (umbrella canopy) is NEVER disposed on session end (still referenced by
    the rig's tint material elsewhere); a literal-hex prop mesh IS disposed.

## §9 — Open questions & risks

- **Real-rig umbrella exception**: §3 makes a firm "no" call, but it's the
  single most likely feature request to come back ("why doesn't my actual
  kid get an umbrella when it's raining and they're standing on the porch
  sensor"). If ever revisited, the CLEANEST way to allow it without breaking
  the "no fiction on real people" principle would be an explicit, separately-
  labeled opt-in (`Store.reflectWeatherOnRealRigs?: boolean`, default OFF,
  scoped to ONLY the umbrella-class condition-reflective props, never Class
  1/2/4 sessions) — flagged here rather than silently built in, so it's a
  deliberate future decision, not scope creep smuggled into v1.
- **`animPrims`/`twoHandProps` becoming session-removable**: today those two
  `Humanoid` fields are documented as build-once/rig-lifetime lists. This
  feature proposes PARALLEL prop-owned lists (`propAnimPrims`/`propTwoHand`)
  rather than mutating the originals, specifically to avoid disturbing that
  invariant for the rig's own authored accessories — worth a second look at
  implementation time to confirm the parallel-list approach doesn't just move
  the same complexity around (e.g., `_advanceAnimPrims`/`_advanceTwoHandProps`
  taking an array parameter instead of reading `h.animPrims` directly is a
  small signature change touching two call sites).
- **Legacy imperative hand accessories not hidden** (§5): accepted gap, but
  worth a quick audit at implementation time of exactly which legacy kinds
  (pre-Phase-4a) hold a hand item, to confirm the "rare" claim holds and
  decide whether a couple of them are cheap to special-case.
- **Session diversity**: no explicit "don't repeat the same prop twice in a
  row for the same rig" rule is designed — recommend a cheap
  `h.lastPropKind` + skip-if-identical in the candidate filter (should-have,
  not a blocker; small enough to add during implementation rather than
  needing its own design section).
- **`propPhase` vs `fidgetT`/gait `phase` collision risk**: all three are
  independent per-rig accumulators already (the codebase's established
  pattern — `phase` for gait, `fidgetT` for the current fidget, now
  `propPhase` for the current prop). No shared-state risk, just confirming
  the pattern holds a third time before implementation.
- **Window pick for `window_squeegee` doesn't distinguish exterior vs interior
  walls**: v1 treats every `Window` on the floor as equally eligible (windows
  are wall openings, so this is usually fine), but an interior "window" (rare,
  e.g. an interior light well) would still get squeegeed — low-stakes
  cosmetic inaccuracy, not worth gating on in v1.
- **Kit props (`window_squeegee`) as one indivisible `PropDef`**: v1 treats a
  spray-bottle + squeegee pair as ONE `propKind` with two meshes/two hands,
  never independently equippable. Revisit only if a future prop genuinely
  needs partial equip (e.g., "holding just a drink, nothing in the other
  hand" already works fine as single-hand props — no partial-equip need has
  actually surfaced yet).

## Sources

- In-repo: `CLAUDE.md` — "Animated humanoid targets", "Idle fidgets",
  "Activity system", "Avatar packs" (accessory primitive schema,
  `twoHanded`/`animate`), "Avatar device interactions", "Quadruped rigs
  (pets)" — the load-bearing precedents this design reuses throughout.
- `docs/avatars/AUTHORING.md` — canonical `AvatarPrimitive`/anchor/animate/
  two-handed schema (the geometry format this feature reuses verbatim).
- `src/three-renderer.ts` — `IDLE_FIDGETS`/`IDLE_FIDGET_DUR` (~line 738),
  `_aiPickGoal` device-interaction branch (~line 10740-10796), the AI wander/
  idle/interact state machine (~line 10556-10670), the idle-fidget pose block
  (~line 11716-11876), `_addDeclarativeAccessories` (~line 13231),
  `_advanceAnimPrims`/`_advanceTwoHandProps` (~line 13505-13564),
  `_spawnSparkle`/`_advanceSparkles` (~line 14784-14818, the transient-mesh
  build/dispose lifecycle template), `Humanoid` interface (~line 487-706).
- `src/ui/three-view.ts` — `ActivityContext` assembly incl. `interactive`/
  `avatarInteract`/`costumes` (~line 1670-1696), the exact seam this feature's
  `props` field extends.
- `src/types.ts` — `Store.avatarInteractions`/`avatarCostumes` (~line
  1116-1117), the precedent for the new `Store.avatarProps` field shape.
- Design touchstone (genre precedent, not a technical source): The Sims'
  object "advertised interactions" + autonomous idle object-use + swap-out-
  current-object-on-pickup model — the same behavioral idiom Diorama already
  borrows visually (plumbob, toon shading) per CLAUDE.md's "Sims-style
  rendering", applied here to *behavior* rather than *look*.
