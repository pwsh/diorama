# Vehicle Model Library — Research (aircraft + ground vehicles, pack-organized)

Status: research complete, not yet implemented. This doc scopes a **vehicle
model library** for Diorama, organized like the shipped avatar-pack system
(`src/avatars.ts`, `docs/avatars/AUTHORING.md`): selectable, loadable,
activatable model packs, this time for aircraft and ground vehicles instead
of humanoid/quadruped rigs. It also proposes a concrete mapping from today's
live ADS-B flight-display archetypes to richer named-model replacements, at
"appropriate" (i.e. deliberately not-to-scale, shell-compressed) size —
consistent with the honesty/compression precedent `flight-tracking.md` and
`flight-fields-models.md` already established and CLAUDE.md's "Flight &
satellite tracking" section documents in force today. Written in the same
voice as those two docs: real-world dimensions are web-search-verified where
practical; popularity/recognition ranking is reasoned from cultural-ubiquity
signals (search results, decades of production/media presence, and — for
fiction — existing "coolest/most iconic" listicle consensus), flagged
**UNVERIFIED** where a search came back thin. This pass did not read
`src/three-renderer.ts`'s full 17k+ lines; it read the BG_CRAFTS roster, the
8-archetype builder switch, and `_flightArchetypeMetrics` directly (line
ranges cited below), plus `src/avatars.ts`'s design doc, the `car`
`FurnitureKind`, and the Custom Objects recipe system.

## 0. Summary — the 9 decision-relevant facts

1. **Diorama already has two independent "build a toon vehicle from
   primitives" systems that a vehicle-model library should unify, not
   triplicate**: `BG_CRAFTS` (19 hand-built banner-tow silhouettes in
   `three-renderer.ts`, `_buildBannerCraft`) and the **Custom Objects /
   `ObjectRecipe`** system (`Store.customObjects`, `src/geometry.ts` +
   `resolveFurnitureDef`) — a user-authored array of `box`/`cylinder`/
   `sphere`/`cone` primitives at local mm positions, already three-free and
   already the shape avatar accessories (`AvatarPrimitive`) also converged
   on. A vehicle model is naturally the SAME shape: a small primitive list
   plus 1–2 tint slots (`BgColors.main`/`detail`, already shipped) plus a
   couple of numeric metrics (length, tow/anchor height). No new primitive
   vocabulary is needed — only a new REGISTRY/pack layer around the existing
   vocabulary.
2. **The 8 ADS-B flight archetypes are already NOT built to real relative
   scale, by design** — `_flightArchetypeMetrics` (three-renderer.ts
   ~L16544–16592) gives every archetype a `fusLen` between 1600 mm (`heli`)
   and 3200 mm (`widebody`), a 2:1 spread, while the real aircraft the
   archetypes stand in for span an 11:1 length range (a Cessna 172 at 8.3 m
   to a 747-8 at 76.3 m). This is the SAME "decorative, not to scale"
   posture `flights.ts`'s `compressRadiusMm`/`compressAltitudeMm` already
   documents for position — so a named-model swap inside an archetype bucket
   is a **shape** change (wing position, engine count/placement, tail style),
   not a rescale; the bucket's `fusLen` stays the authority (§4).
3. **The BG_CRAFTS roster has NO load/activate pack system today** — all 19
   craft (7 military/NASA + 11 fiction + the news helicopter) are simply
   always present in the Aircraft dropdown (`src/ui/modals.ts` ~L2345–2384),
   unconditionally, with no equivalent of the avatar system's
   loaded/active/franchise toggles. Building the pack layer this doc
   proposes is genuinely new work, not a UI wrapper around an existing
   registry.
4. **The avatar-pack precedent generalizes well but drops the rig-specific
   half**: pack registry, loaded/active/`members` subsets, base-vs-franchise
   default state, IndexedDB user import, and the "silhouette test" (readable
   at ~30 px via color blocking + one signature shape) all carry over
   directly. Gait/pose/personality/bubbles do not apply — a vehicle has no
   skeleton. What replaces them: a `len` (or L/W/H triple) + tow/mount
   anchor points + livery tint slots + (for aircraft) an optional prop/rotor
   spin rate — i.e. exactly `BgCraftSpec`'s existing shape, generalized.
5. **IP posture precedent is "trade-dress-lite homage," already shipped, but
   inconsistently applied in two of 11 existing fiction UI labels.** Real
   hardware (F-16, B-2, Apache, Space Shuttle) gets its real name in the UI —
   there is no IP issue in depicting real government/public aircraft.
   Fiction craft get **descriptive-generic UI labels** that avoid the
   franchise/proper noun in 9 of 11 cases ("Bat-winged jet," "Chrome explorer
   pod," "Bounty hunter pod," "Royal chrome starship," "Freighter (disc
   hull)"), while the internal ids (`xwing`, `slave1`, `naboo`, `enterprise`)
   stay franchise-coded (code comments only, never user-visible). **Two
   labels break the pattern**: `xwing` → "X-wing fighter" (names the
   Star-Wars-specific term directly) and `serenity` → "Firefly transport"
   (names the show). Reported as a stale-precedent note in §9, not something
   this doc's own recommendations should repeat (new fiction entries below
   follow the descriptive-generic rule strictly).
6. **A live-archetype "named skin" is a genuinely new capability, not
   something today's code exposes.** Today only the banner-tow path
   (`BgTextEntry.aircraft`) lets a user pick a specific archetype/craft;
   the live ADS-B path (`_buildAircraftModel(archetype, military, dim, tint)`)
   always builds the ONE generic shape per archetype with no per-aircraft
   model choice. This doc's mapping (§4) is scoped as: (a) richer NAMED
   variants WITHIN each archetype bucket (a Cessna-shaped vs. a
   Cherokee-shaped `ga-high`/`ga-low`, already latent in the "high wing vs
   low wing" fork the archetype split itself encodes) and (b) an optional
   user-facing "skin" override — e.g. force a specific bizjet-archetype
   aircraft to render as an F-16 silhouette when `category === 'A6'`
   (fighter) — reusing geometry that **already exists** in BG_CRAFTS.
7. **Ground vehicles have no equivalent live-feed pipeline at all** — the
   `car` `FurnitureKind` (1850×4800×1450 mm, `cat: 'vehicle'`) is one
   generic stylized sedan with a presence-binding and an EV-charging
   binding, no shape choice. A ground vehicle-pack surfaces exclusively as
   (a) a `carModel`-style shape choice on the existing `car`/new vehicle
   `FurnitureKind`s (driveway/garage/roadside decor) and (b) new placeable
   `FurnitureKind`s per category (fire truck, school bus, tank, DeLorean…) —
   there is no "live tracked ground vehicle" feed to skin (Diorama's own
   robot vacuum/mower and Frigate car-target dot are the closest analogs,
   and neither wants a named-model swap — a Roomba doesn't need to look like
   a Rolls-Royce).
8. **Toy-train precedent**: the existing `bgTexts` `mode:'train'` (toon
   engine + N cars circling the property) is itself a "ground vehicle
   model," already shipped, already primitive-built, already tow/decal-lit —
   worth folding into this library's taxonomy as the one existing ground
   entry rather than treating it as unrelated.
9. **Scope discipline**: this doc catalogs candidates and proposes the pack
   architecture + archetype mapping; it does NOT propose new src/ code (hard
   constraint) and does not attempt to enumerate every possible model — each
   category below is capped at a "first wave" (~8–12) plus a longer
   "second wave" list for future packs, mirroring the avatar system's own
   5–12-members-per-pack discipline (`docs/avatars/AUTHORING.md`).

---

## 1. Where this fits in Diorama today

### 1.1 BG_CRAFTS — the existing named-model precedent (banner-tow only)

`src/three-renderer.ts` (~L776–817) defines `BgCraftId` (19 members) and
`BG_CRAFTS: Record<BgCraftId, BgCraftSpec>` — each entry is just
`{len, idY, rotorY?, propRate?, chopper?}` (hull length for banner standoff,
tow height, rotor-axis flag, spin rate, and the one special "news chopper"
flight-profile flag). Geometry + signature paint live in `_buildBannerCraft`
(a big per-id switch), tint reaches two named slots (`col.main`/`col.detail`,
threaded from `BgTextEntry.colorMain`/`colorDetail`) via `mkBody`/`mkAccent`
closures — **exactly** the "livery slot" abstraction a vehicle-pack member
needs. The roster is consumed from exactly one place: `BgTextEntry.aircraft`
on a `mode:'banner'` background-text entry, rendered via
`_buildBgAircraft(...)`. There is no load/activate layer, no franchise
grouping, no IP-conscious opt-in default — every craft is simply always
offered.

### 1.2 The 8 ADS-B flight archetypes — live-feed geometry, one shape per bucket

`src/flights.ts`/`src/aircraft-types.ts` resolve any live ADS-B aircraft to
one of 8 `AircraftArchetype`s (`ga-high`, `ga-low`, `twin-prop`, `turboprop`,
`narrowbody`, `widebody`, `bizjet`, `heli`) via a 184-entry ICAO type table +
a category/speed fallback ladder (fully documented in
`flight-fields-models.md`, already shipped). `_flightArchetypeMetrics`
(three-renderer.ts L16544–16592) is the per-archetype geometry contract every
consumer (label plate, beacon, fuselage lettering, trail/tail-anchor math)
reads:

| Archetype | `fusLen` (mm) | `fusHalfW` | Shipped reference type (per Settings copy) |
|---|---|---|---|
| `ga-high` | 1700 | 160 | Cessna (172-family, high wing) |
| `ga-low` | 1700 | 150 | Cirrus (SR-series, low wing) |
| `twin-prop` | 2000 | 170 | King Air (twin, low wing) |
| `turboprop` | 2400 | 190 | ATR / Dash 8 (twin, HIGH wing, T-tail) |
| `narrowbody` | 2400 | 170 | 737 / A320 |
| `widebody` | 3200 | 220 | 747 / 777 |
| `bizjet` | 1900 | 145 | Learjet / CRJ (rear-fuselage engines, T-tail) |
| `heli` | 1600 | 450 (cabin bubble, not a true fuselage) | generic helicopter |

`_buildAircraftModel(archetype, military, dim, tint?)` (~L16594 onward) is
the 8-way switch that actually builds each shape; `tint` is already the
2-slot `{body?, accent?}` override BG_CRAFTS also uses. **This is the exact
seam a "named-model swap" plugs into**: replace the generic per-archetype
body with a richer, named silhouette that still reports the bucket's
`fusLen`/`fusHalfW` so every downstream consumer (label Y, beacon position,
trail tail-anchor, lettering plane fit) needs zero changes.

### 1.3 Ground vehicles today

- `car` `FurnitureKind` (`geometry.ts` L2664): 1850×4800×1450 mm, `cat:
  'vehicle'`, one stylized sedan body + cabin + glass band + 4 wheels +
  emissive light hints; ghosted when a bound presence sensor reads "away."
- `ev_charger` (350×250×1200 mm, same cat) — a post fixture, not a vehicle.
- Robot vacuum/mower (`RobotFixture`) — functional fixtures with real
  steering/kinematics, not a "pick a model" surface; out of scope here (a
  Roomba reskin has no popularity-ranking question to answer).
- The toy **train** (`bgTexts` `mode:'train'`) — the one other shipped
  ground "vehicle model," toon-built, already tow/decal-capable.
- `trash_bin`/`recycle_bin`/`mailbox` — adjacent yard objects, not vehicles,
  but confirm the `cat: 'outdoor'`/`cat: 'vehicle'` optgroup precedent a new
  ground-vehicle `FurnitureKind` would extend.

### 1.4 Avatar packs — the organizational precedent

`src/avatars.ts` + `docs/avatars/AUTHORING.md` (read in full for this pass):
a flat `AvatarId` registry, packs carrying `{id, label, path[], builtin?,
franchise?, base?, avatars[]}`, lazy-chunked builtin pack bodies
(`src/avatar-packs/manifest.ts`), user packs validated + stored in IndexedDB
(`avatar-store.ts`). Behavioral rule that matters most here: **base packs
default loaded+active; franchise packs default UNLOADED (opt-in)**; a
"silhouette test" gates member selection (recognizable at ~30 px via color
blocking + one signature shape); 5–12 members per pack, split by sub-series
if a franchise's primary cast is bigger. `Store.avatarPacks?:
Record<packId, {loaded?, active?, members?}>` is the ENTIRE persistence
surface — cheap, additive, and directly reusable in shape for a
`Store.vehiclePacks?` sibling.

### 1.5 The reusable primitive vocabularies (why no new geometry language is needed)

Three shapes already coexist in the codebase for "build a toon object from a
short primitive list": `RecipePrimitive` (Custom Objects — box/cylinder/
sphere/cone, local mm, `+Z` front), `AvatarPrimitive` (avatar accessories —
same four shapes + torus, anchored to a named body point, `sk`-scaled), and
`BgCraftSpec` (banner-tow craft — a per-id hand-written builder function,
not a data table, because 19 hand-tuned silhouettes justified bespoke code).
A vehicle-pack member sits between the first two: richer than a bare
`ObjectRecipe` (vehicles want a couple of named anchors — nose/tail,
tow/beacon point, wheel/rotor/prop spin axes) but simpler than a full
`AvatarDef` (no rig, no pose, no bubbles). §2.2 sketches the shape.

---

## 2. Design — a vehicle model registry mirroring avatar packs

### 2.1 What generalizes from `avatars.ts`, what doesn't

**Generalizes directly:**
- Flat id registry (`VehicleModelId` = plain string; pack members
  namespaced `'<packId>/<member>'`, matching `AvatarId`'s `'<pack>/<member>'`
  convention).
- `{loaded, active, members}` per-pack state, same persistence shape as
  `Store.avatarPacks`.
- Base-vs-franchise default state (real hardware + generic archetypes =
  base, loaded+active; named fiction/franchise vehicles = franchise,
  default unloaded) — **with one carve-out**: the 11 already-shipped
  BG_CRAFTS fiction craft migrate in as an already-loaded/active
  "grandfathered" pack (never breaking an existing user's banner-plane
  config on upgrade), while any NEW fiction pack this doc recommends
  defaults unloaded like every other franchise pack.
- IndexedDB user-import path (`validatePackJson`-equivalent) for the same
  reason avatars have one: a hobbyist community will hand-build niche
  aircraft/vehicles Diorama will never ship itself.
- The "silhouette test" — at the sizes these render (a banner-tow craft or
  a live ADS-B dot is rarely more than ~40–80 px on screen), 2–3 signature
  cues (silhouette shape, ONE proud accent color, at most one distinguishing
  proportion) is the right authoring bar, same as an avatar at 30 px.

**Does NOT generalize (vehicles have no rig):**
- `rig: 'humanoid'|'quadruped'`, gait/pose/personality/bubbles/idle fidgets
  — none apply. A vehicle model is closer to `AvatarDef.accessories`
  (a primitive list) than to the humanoid skeleton it decorates.
- Costume swaps / decals-as-clothing — a vehicle's "decal" is livery
  (already the `BgColors main/detail/bg/text/frame` shape), not a seasonal
  outfit.
- What REPLACES pose: a small numeric metrics block (length, half-width,
  tow/mount anchor height, prop/rotor spin rate — literally
  `BgCraftSpec` today, promoted to a per-member field instead of a
  hand-coded constant) plus, for archetype-swap candidates only,
  `_flightArchetypeMetrics`-shaped fields so a live-swap model can report
  the SAME contract the generic archetype body does.

### 2.2 Proposed data shape (sketch — not proposed src/ code, an authoring reference)

```
VehicleModelDef {
  id: '<packId>/<member>',
  label: string,                    // UI label — descriptive-generic for fiction (§ IP posture)
  category: 'aircraft' | 'ground',
  era?: 'wwi' | 'wwii' | 'coldwar' | 'modern' | 'historical' | 'contemporary',
  metrics: { lenMm, halfWMm, towYMm, beaconYMm?, beaconZMm? },  // BgCraftSpec-shaped
  archetypeSkin?: AircraftArchetype,  // set ⇒ this model can SKIN a live ADS-B bucket (§4)
  spin?: { rotorY?: boolean, propRateRadS?: number, wheelCount?: number },
  primitives: RecipePrimitive[],     // reuse the Custom-Objects vocabulary verbatim
  tintSlots: { main?: hex, detail?: hex },  // BgColors precedent
  pet: false,                        // n/a, kept only for schema-shape symmetry — omit in practice
}
VehiclePackDef {
  id, version, label, path: string[],   // Settings ▸ Vehicles tree, avatar-pack idiom
  builtin?, franchise?, base?: Partial<VehicleModelDef>,
  models: VehicleModelDef[],
}
```

`archetypeSkin` is the one field with no avatar-pack analog: it's what lets
a pack model additionally register as a **live ADS-B archetype override**
(§4.4), not just a banner-tow/ground option.

### 2.3 Three consumption surfaces (generalizing BG_CRAFTS's one)

1. **Banner-tow dropdown** (`BgTextEntry.aircraft`) — direct generalization
   of today's `AIRCRAFT_GROUPS` in `modals.ts`; the dropdown becomes
   pack-driven (loaded+active packs only), same UI shape, richer roster.
2. **Live-flight archetype skin** (NEW capability, §4.4) — an optional
   per-archetype (or per-tail/registration watch-list entry, reusing the
   existing watch-list machinery from `flight-glow-rules.md`) model choice
   that swaps `_buildAircraftModel`'s generic body for a named
   `archetypeSkin`-tagged pack model, keeping the archetype's own
   `fusLen`/label-Y/beacon-Y contract untouched.
3. **Ground vehicle `FurnitureKind` extension** — a `carModel`-style field
   on `car` (or a family of new `FurnitureKind`s per silhouette bucket:
   `truck_pickup`, `truck_fire`, `bus_school`, …) drawing from `category:
   'ground'` pack models; driveway/garage/roadside decor is the only
   consumption surface (§1.7's "no live feed" finding).

---

## 3. Ranked model catalog

Dimensions are length × wingspan-or-width × height in metres unless noted;
aircraft figures are fuselage/wing dimensions of a representative production
variant (not every subtype). **★ = first-wave** (build these first, ~8–12
per category, mirroring the avatar-pack member cap). Popularity rank is
1 = most recognizable within its own category.

### 3.1 Aircraft — historical military (WWI / WWII / Cold War / modern icons)

| # | Aircraft | Era | Dimensions (L×W×H, m) | Signature silhouette | Pop rank |
|---|---|---|---|---|---|
| ★1 | Supermarine Spitfire | WWII (UK) | 9.12 × 11.23 × 3.86 | Elliptical wing, rounded wingtips, bubble/framed canopy | 1 |
| ★2 | North American P-51 Mustang | WWII (US) | 9.83 × 11.28 × 4.16 | Bubble canopy, chin radiator scoop, laminar-flow wing | 2 |
| ★3 | Messerschmitt Bf 109 | WWII (Germany) | 8.95 × 9.92 × 2.60 | Narrow fuselage, canted/squared wingtips, tail-dragger stance | 3 |
| ★4 | Mitsubishi A6M Zero | WWII (Japan) | 9.06 × 12.0 × 3.05 | Rounded wingtips, long low canopy, red roundel | 4 |
| ★5 | Vought F4U Corsair | WWII (US) | 10.16 × 12.5 × 4.50 | Inverted gull wing, huge 4-blade prop | 5 |
| ★6 | Boeing B-17 Flying Fortress | WWII (US) | 22.8 × 31.6 × 5.82 | 4 wing-mounted engines, chin/tail turret bulges | 6 |
| 7 | Avro Lancaster | WWII (UK) | 21.2 × 31.1 × 6.10 | 4 engines, twin tail fins, bulged bomb bay | 7 |
| ★8 | Lockheed SR-71 Blackbird | Cold War (US) | 32.74 × 16.94 × 5.64 | Chined delta fuselage, all-black, twin canted tails | 8 |
| 9 | Sopwith Camel | WWI (UK) | 5.72 × 8.53 × 2.59 | Humped fuselage over twin Vickers guns, biplane | 9 |
| 10 | Fokker Dr.I Triplane | WWI (Germany) | 5.77 × 7.19 × 2.95 | Three stacked wings — "the Red Baron's plane" | 10 |
| ★11 | Grumman F-14 Tomcat | Cold War/modern (US) | 19.1 × 19.55/11.65 (swept) × 4.88 | Variable-sweep wings, twin canted tail fins | 11 |
| ★12 | Bell UH-1 "Huey" | Vietnam-era (US) | 12.98 × — (2-blade rotor 14.6 dia) × 4.39 | 2-blade "whop-whop" rotor, boxy cabin — the definitive Vietnam silhouette | 12 |
| 13 | McDonnell Douglas F-15 Eagle | Cold War/modern (US) | 19.43 × 13.05 × 5.63 | Twin tall tail fins, huge boxy intakes | 13 |
| 14 | General Dynamics F-16 Fighting Falcon | Modern (US) | 15.03 × 9.45 × 5.09 | Bubble canopy, single tail, blended body/wing | 14 |
| 15 | Boeing AH-64 Apache | Modern (US) | 14.69 × — (rotor 14.6 dia) × 3.87 | Tandem gunship cockpit, chin gun, stub wings | 15 |
| 16 | Boeing B-52 Stratofortress | Cold War/modern (US) | 49.0 × 56.4 × 12.4 | 8 engines in 4 underwing pods, huge straight wing | 16 |
| 17 | Lockheed Martin F-22 Raptor | Modern (US) | 18.92 × 13.56 × 5.08 | Angular stealth facets, twin canted tails | 17 |
| 18 | Northrop B-2 Spirit | Modern (US) | 21.0 × 52.4 × 5.18 | Flying wing, no tail at all | 18 |
| 19 | Lockheed C-130 Hercules | Cold War/modern (multi) | 29.3 × 39.7–40.4 × 11.4 | High wing, 4 turboprops, blunt upswept rear ramp | 19 |
| 20 | Lockheed U-2 Dragon Lady | Cold War/modern (US) | 19.2 × 31.4 × 4.88 | Glider-proportioned wing on a slim fuselage, bicycle gear | 20 |
| 21 | Sikorsky UH-60 Black Hawk | Modern (US) | 19.76 × — (rotor 16.4 dia) × 5.13 | Modern 4-blade utility helo, stub wings for stores | 21 |
| 22 | Boeing CH-47 Chinook | Modern (US) | 29.87 × — (2× 18.3 rotors) × 5.68 | Tandem twin rotors, banana-shaped fuselage | 22 |
| 23 | Bell Boeing V-22 Osprey | Modern (US) | 17.5 × 25.8 (rotor-tip) × 6.73 | Tiltrotor nacelles, half-plane/half-helicopter | 23 |
| 24 | Mikoyan MiG-15/MiG-29 (Cold War Soviet rivals) | Cold War/modern (USSR/Russia) | MiG-15 10.1×10.08; MiG-29 17.3×11.4 | Swept wings, the "enemy fighter" silhouette in Western media | 24 |

*Second wave (not researched to full dimension detail this pass, listed for
future coverage):* F/A-18 Hornet, F-35 Lightning II, F-4 Phantom II, A-10
Thunderbolt II (already in BG_CRAFTS), Harrier jump-jet, Concorde-era Tu-144,
Douglas SBD Dauntless, Hawker Hurricane, Grumman F6F Hellcat, de Havilland
Mosquito, Junkers Ju 87 Stuka, MiG-21, F-4U already covered.

### 3.2 Aircraft — civilian, historical + modern

| # | Aircraft | Era | Dimensions (L×W×H, m) | Signature silhouette | Pop rank |
|---|---|---|---|---|---|
| ★1 | Boeing 747 | 1970–present | 70.6 (−400) / 76.25 (−8) × 59.6–68.4 × 19.4 | The upper-deck "hump" — instantly readable at any scale | 1 |
| ★2 | Douglas DC-3 | 1935–present (legacy) | 19.7 × 29.0 × 5.16 | Tail-dragger stance, twin radial engines, riveted skin | 2 |
| ★3 | Concorde | 1976–2003 | 61.7 × 25.6 × 12.2 | Delta wing, droop nose, needle fuselage | 3 |
| ★4 | Cessna 172 Skyhawk | 1956–present | 8.28 × 11.0 × 2.72 | High strut-braced wing, the default "small plane" shape | 4 |
| ★5 | Piper J-3 Cub | 1938–1947 | 6.83 × 10.74 × 2.03 | Yellow, high wing, tandem open-ish cockpit, tailwheel | 5 |
| 6 | de Havilland Canada DHC-2 Beaver | 1947–present | 9.22 × 14.63 × 2.74 | High wing bush plane, commonly seen on floats | 6 |
| 7 | Lockheed Super Constellation | 1943–1958 | 34.7 × 37.6 × 7.56 | Dolphin-shaped fuselage, triple tail fins | 7 |
| ★8 | Modern narrowbody (737/A320 family) | 1968/1988–present | ~37.6–39.5 × ~34.3–36 × ~12 | The default airliner silhouette (underwing pods, single-aisle) | 8 |
| 9 | Hot air balloon | 1783–present | envelope ~18–24 tall, ~15–18 dia | Onion-bulb envelope over a wicker basket | 9 |
| 10 | Blimp/airship (Goodyear/Zeppelin NT type) | 1925–present | ~58 × 15 × 18 | Cigar-shaped envelope, gondola slung below | 10 |

*Second wave:* Piper PA-28 Cherokee family, Cirrus SR22, Beechcraft Bonanza,
Boeing 707, Airbus A380 (already covered by the `widebody` archetype),
Wright Flyer (historical curiosity, extreme age), Ford Trimotor, Spruce
Goose (one-off but very high novelty value).

### 3.3 Space vehicles — real

| # | Vehicle | Program | Dimensions | Signature silhouette | Pop rank |
|---|---|---|---|---|---|
| ★1 | Saturn V | Apollo (1967–1973) | 110.6 m tall × 10.1 m dia | Tallest classic rocket — three white/black-striped stages | 1 |
| ★2 | Space Shuttle orbiter (+ ET + SRBs stack) | STS (1981–2011) | Orbiter 37.24 × 23.79 span; full stack ~56 m tall | Winged orbiter riding an orange tank flanked by 2 white boosters — **already shipped as `shuttle`** in BG_CRAFTS (orbiter-only geometry) | 2 |
| ★3 | Apollo Lunar Module | Apollo (1969–1972) | ~7.0 m tall × ~4.3 m wide (legs deployed ~9.4 m diag) | Boxy gold-foil "bug" on four spindly legs | 3 |
| ★4 | SpaceX Falcon 9 | 2010–present | 70 m tall × 3.7 m dia | Slim white booster, gridfins + landing legs, soot-streaked reused boosters | 4 |
| 5 | SpaceX Starship + Super Heavy | 2023–present | ~121 m tall × 9 m dia | Bare stainless-steel, blunt nose, giant flaps | 5 |
| 6 | Apollo Command/Service Module | Apollo (1968–1972) | CM ~3.5 m dia cone; CSM stack ~11 m | Gumdrop-shaped cone on a cylindrical service module | 6 |

*Second wave:* ISS (a structure, not a vehicle — already handled by
Diorama's separate ISS sky-tracking feature, not this catalog), Soyuz,
Space Shuttle mated to the SCA carrier 747 (a fun crossover novelty), Mercury/
Gemini capsules, Voyager probe (recognizable dish-antenna silhouette).

### 3.4 Space vehicles — fiction (candidates beyond the 11 already shipped)

The shipped roster already covers: `einstein_rocket`, `enterprise`,
`enterprise_c`, `xwing`, `falcon`, `slave1`, `naboo`, `serenity`. Candidates
below deliberately avoid duplicating those franchises' OTHER ships (no
second Star Wars/Star Trek ship) except where noted as a clearly distinct
silhouette.

| # | Concept | Homage source (never named in UI) | Signature silhouette | Pop rank |
|---|---|---|---|---|
| ★1 | Classic flying saucer / UFO | Generic — no single IP owns "flying saucer," the safest possible entry | Chrome disc with a central dome, rim running-lights | 1 |
| ★2 | Blue call-box time machine | *Doctor Who* | A boxy blue booth with a beacon on top — extremely recognizable, but the SHAPE itself (a British police box) predates/is broader than the show; treat as a homage the same way `naboo`/`slave1` already are | 2 |
| 3 | Long modular science-vessel with a rotating ring | *2001: A Space Odyssey*-style "Discovery" silhouette | Slim spine with a spherical head and a rear engine cluster | 3 |
| 4 | Retro "battle carrier" with a boxy prow | *Battlestar Galactica*-style | Blocky, industrial, flight-pod "wings," landing-bay glow | 4 |
| 5 | Sleek chrome transporter craft with folding legs | *Space: 1999*/70s-retrofuturism-style "Eagle" | Modular truss frame, boxy cargo pod, spindly legs | 5 |

**IP note**: unlike BG_CRAFTS's existing fiction roster (which openly
mirrors specific franchise ship SHAPES under generic labels — trade-dress-
lite, same posture as a toy aisle's unlicensed "space cruiser" line), the
UFO/flying-saucer entry needs no homage framing at all — it's genuinely
generic. The TARDIS-shaped entry is the closest to a single, unmistakable
piece of IP (a very specific real prop design) and is the one candidate this
doc flags for a product-owner IP-comfort check before building, rather than
recommending outright.

### 3.5 Ground vehicles — civilian, modern

| # | Vehicle | Category | Dimensions (L×W×H, m) | Signature silhouette | Pop rank |
|---|---|---|---|---|---|
| ★1 | Full-size pickup truck (Ford F-150 class) | Personal | 5.89–6.19 × 2.03 × 1.98 | Tall cab + open bed, dominant on US roads/driveways | 1 |
| ★2 | Mid-size SUV | Personal | ~4.8 × 1.9 × 1.75 | Tall wagon body, the modern default family vehicle | 2 |
| 3 | Minivan | Personal | ~5.2 × 2.0 × 1.75 | Sliding doors, low sloped nose, boxy cabin | 3 |
| ★4 | School bus (Type C conventional) | Institutional | ~10.7–11 × 2.44 × 3.05 | Flat yellow face, black roof stripe, stop-arm | 4 |
| ★5 | City transit bus | Institutional | ~12.2 (articulated to 18) × 2.6 × 3.2 | Long low-floor box, destination sign, accordion joint (articulated variant) | 5 |
| ★6 | Semi truck (tractor + trailer) | Commercial | tractor ~6.5, combined ~21–22 × 2.6 × 4.1 | Tall cab-over/conventional nose + long box trailer | 6 |
| ★7 | Fire engine (pumper) | Emergency | ~9–10 (aerial ladder 12–15) × 2.5 × 3.2 | Red, ladder/hose reel, roof beacons | 7 |
| ★8 | Ambulance (Type III box) | Emergency | ~7.0 × 2.4 × 2.9 | Van cab + boxy patient module, light bar | 8 |
| ★9 | Police cruiser (sedan) | Emergency | ~5.0 × 1.9 × 1.5 | Light bar, push bumper, black-and-white/decal livery | 9 |
| 10 | Garbage truck (rear loader) | Municipal | ~7.6–9 × 2.6 × 3.4 | Rear hopper, side-arm or rear-loading compactor | 10 |
| 11 | Ice cream truck (step van) | Whimsical | ~6.1 × 2.3 × 3.0 | Serving window, jingle-speaker roof, pastel/soft-serve graphics | 11 |
| ★12 | Motorcycle (cruiser) | Personal | ~2.4 × 0.9 × 1.2 | Low long profile, exposed engine, single headlamp | 12 |
| 13 | Class A motorhome/RV | Personal/leisure | ~10.7 × 2.6 × 3.7 | Bus-sized body, cab-over sleeping bubble | 13 |
| 14 | Farm tractor (row-crop) | Agricultural | ~4.5–5 × 2.4 × 2.9 | Huge rear wheels, small front wheels, high cab | 14 |
| 15 | Bicycle | Personal | ~1.75 × 0.6 × 1.1 | Two wheels + diamond frame — the simplest possible silhouette | 15 |
| 16 | Golf cart | Leisure/utility | ~2.4 × 1.2 × 1.8 | Open-sided, canopy roof, small wheels | 16 |

### 3.6 Ground vehicles — military + historical

| # | Vehicle | Era | Dimensions (L×W×H, m) | Signature silhouette | Pop rank |
|---|---|---|---|---|---|
| ★1 | Ford Model T | 1908–1927 | ~3.4 × 1.7 × 2.1 | Boxy brass-era body, spoked wheels, black paint | 1 |
| ★2 | Volkswagen Beetle (Type 1) | 1938–2003 | 4.08 × 1.54 × 1.50 | Rounded "bug" body, rear-mounted engine hump | 2 |
| ★3 | Volkswagen Type 2 "Bus" (Microbus) | 1950–2013 (Brazil) | ~4.28 × 1.75 × 1.94 | Split/bay windshield van face, flat front, two-tone paint | 3 |
| ★4 | Willys MB Jeep | WWII | 3.36 × 1.57 × 1.32 | Flat fenders, exposed grille slats, folding windshield | 4 |
| ★5 | HMMWV / Humvee | 1985–present | 4.57 × 2.16 × 1.75 | Wide flat boxy body, huge ground clearance, low silhouette | 5 |
| ★6 | M4 Sherman tank | WWII | 5.84 (hull) × 2.62 × 2.74 | Rounded turret, vertical volute suspension | 6 |
| ★7 | M1 Abrams | 1980–present | ~9.77 (gun-forward) × 3.66 × 2.44 | Angular composite armor, long smoothbore gun | 7 |
| 8 | M3 Half-track | WWII | 6.32 × 2.22 × 2.26 | Wheeled front axle + rear tank tracks | 8 |
| 9 | Checker Marathon taxi | 1956–1982 | ~5.28 × 1.90 × 1.58 | Boxy sedan, checkerboard side stripe (US yellow-cab icon) | 9 |
| 10 | London black cab (FX4/TX-series) | 1958–present | ~4.58 × 1.80 × 1.79 | Tall boxy black sedan, wide turning circle silhouette | 10 |
| 11 | London Routemaster bus | 1956–2005 (classic)/2012–present (New) | classic ~8.4, New Routemaster 11.23 × 2.52 × 4.4 | Red double-decker, open rear platform (classic) | 11 |
| 12 | Classic American muscle car (Mustang/Camaro/Charger/Corvette, late-1960s) | 1964–1974 | ~4.6–5.3 × 1.8 × 1.3 | Long hood, short deck, twin round or slotted tail-lights | 12 |

### 3.7 Ground vehicles — fiction

| # | Vehicle | Homage source (never named in UI) | Signature silhouette | Pop rank |
|---|---|---|---|---|
| ★1 | Chrome time-traveling sports car | *Back to the Future* DeLorean | Gullwing doors, brushed-steel body, rear flux-capacitor glow | 1 |
| ★2 | Black armored superhero car | *Batman*'s Batmobile (any era's silhouette reads) | Long low black wedge, exposed rear turbine/exhaust, bat-fin tail | 2 |
| ★3 | Talking black muscle car with a scanning light | *Knight Rider*'s KITT | Black Trans-Am-shaped coupe, red scanning-light nose bar | 3 |
| ★4 | Orange muscle car with a horn fanfare | *The Dukes of Hazzard*'s General Lee | Bright orange coupe, painted number/decal on the door, welded-shut doors (window-only entry) | 4 |
| ★5 | Boxy white ambulance-turned-ghost-wagon | *Ghostbusters*'s Ecto-1 | Long tailfinned ambulance body, roof light array, side graphics | 5 |
| ★6 | Semi-sentient friendly compact with a racing number | *The Love Bug*'s Herbie | Round-bodied compact, big white circle with a racing number, red/blue stripes | 6 |
| ★7 | Green psychedelic van with flowers | *Scooby-Doo*'s Mystery Machine | Boxy van, teal/green body, orange-flower graphics, roof travel case | 7 |
| 8 | Black-and-grey commando van | *The A-Team*'s van | Boxy cargo van, red stripe, spoiler | 8 |
| 9 | Yellow muscle car with racing stripes | *Transformers*'s Bumblebee | Modern muscle-coupe silhouette, black racing stripes over yellow | 9 |
| 10 | Stone-wheeled foot-powered car | *The Flintstones*'s family car | Open-top wood/stone buggy on visible round stone wheels | 10 |

**Category counts (this pass):** 24 historical/modern military aircraft +
10 civilian aircraft + 6 real spacecraft + 5 fiction spacecraft (beyond the
11 already shipped) + 16 modern civilian ground vehicles + 12 military/
historical ground vehicles + 10 fictional ground vehicles = **83 newly
researched models**, plus the 19 already-shipped BG_CRAFTS entries the
pack system would ingest = **102 total candidate models** for the library.

---

## 4. Archetype → model mapping (the required deliverable)

### 4.1 The compression precedent, restated for this doc

`flightDisplayScale`/`compressRadiusMm`/`FLIGHT_SHELL` (flights.ts) are
explicit that Diorama's flight display is a **decorative, non-literal
scale model** — position compresses piecewise-linearly and altitude on a
log curve with an absolute clearance floor, precisely so the display reads
well at any radius rather than tracking true geometry. `_flightArchetypeMetrics`
extends the same philosophy to airframe SIZE: every member of an archetype
bucket shares one `fusLen`, regardless of the real type's true length. **A
named-model swap must therefore preserve the bucket's `fusLen`/`fusHalfW` —
it changes the SHAPE drawn inside that envelope, not the envelope itself.**
This is why the "scale factor" below is a per-BUCKET constant (computed once
from each bucket's own shipped reference type), not a per-model constant —
adding, say, a 757 alongside 737/A320 in `narrowbody` means building 757-
shaped primitives inside the SAME 2400 mm `fusLen` box the 737/A320 already
use, exactly as `flight-fields-models.md` §3.4 already recommends for the
`A388`/`C208` size outliers within their own buckets.

### 4.2 Per-archetype scale factor (reference type → bucket `fusLen`)

| Archetype | `fusLen` (mm) | Reference real type | Real length (m) | Scale factor* | Note |
|---|---|---|---|---|---|
| `ga-high` | 1700 | Cessna 172 | 8.28 | **0.205×** | Matches the shipped wing-box width (2400 mm) almost exactly: 11.0 m real span × 0.205 ≈ 2.26 m — the shipped generic body is already built near this factor |
| `ga-low` | 1700 | Cirrus SR22 | 7.92 | **0.215×** | Slightly higher factor than `ga-high` because the reference type is shorter; both buckets share one `fusLen`, so a Cherokee (7.28 m) would compute 0.234× if used instead — pick ONE reference type per bucket and hold it |
| `twin-prop` | 2000 | Beechcraft King Air 350 | 14.22 | **0.141×** | |
| `turboprop` | 2400 | ATR 72 | 27.17 | **0.088×** | Real length nearly DOUBLES vs. twin-prop's reference, factor drops accordingly — the compression is already doing real work here |
| `narrowbody` | 2400 | Boeing 737-800 | 39.47 | **0.061×** | |
| `widebody` | 3200 | Boeing 747-400 | 70.6 | **0.045×** | The real-world size gap between `ga-high` (8.3 m) and `widebody` (70.6 m) is 8.5:1; the display's is only 1.9:1 (1700→3200 mm) — the deliberate flattening the shell already commits to |
| `bizjet` | 1900 | Learjet 75 | 17.68 | **0.107×** | **Caveat**: this archetype ALSO covers CRJ/ERJ regional jets (per `flight-fields-models.md` §3.3's rear-engine/T-tail finding), and a CRJ900 is 36.4 m — nearly 2× the Learjet reference, which would compute 0.052× if used. The bucket currently absorbs this with one shape; a future refinement could split `bizjet` into `bizjet-small` (Learjet-scale) and `bizjet-regional` (CRJ-scale) if the size mismatch becomes visually bothersome — flagged as an open question, §8 |
| `heli` | 1600 (cabin-bubble proxy, not a true fuselage) | Airbus H125/AS350 | 12.94 (rotor turning) | **0.124×** | The metric itself is a cabin-bubble stand-in per the code comment — treat this factor as illustrative only |

\* `scale factor = archetype fusLen (mm) / (reference real length (m) × 1000)`.
Apply this factor to a new model's REAL-WORLD primitive dimensions (in mm)
to get build-time local mm that drop into the existing archetype envelope
with no changes to label/beacon/trail anchor math.

### 4.3 Legacy 3-way collapse (`kind: 'prop'|'jet'|'heli'`)

Unchanged by this doc: `FlightRig.kind` remains the existing backward-
compat collapse (`ga-high`/`ga-low`/`twin-prop`/`turboprop`/`bizjet` →
`'prop'`, `narrowbody`/`widebody` → `'jet'`, `heli` → `'heli'`) for any
stale-chunk/test consumer that still reads the 3-way field. New named
models slot under their 8-way archetype exactly like the generic bodies do
today; nothing about the collapse needs to change.

### 4.4 Suggested "skin" assignments (which model replaces/augments which archetype)

| Archetype | Suggested named skin(s), first wave | Rationale |
|---|---|---|
| `ga-high` | Cessna 172 (refined high-wing shape); Piper Cub (secondary, tandem-seat, tailwheel variant skin) | Both already implied by the "high wing" fork; Cub adds visual variety for GA-heavy feeds |
| `ga-low` | Cirrus SR22 (refined low-wing shape) | Matches the Settings copy's own named reference |
| `twin-prop` | Beechcraft King Air | Matches the Settings copy's own named reference |
| `turboprop` | ATR 72 / Dash 8 (T-tail, high wing) | Matches the Settings copy's own named reference |
| `narrowbody` | 737 / A320 (generic); optionally a distinct DC-3 "vintage narrowbody" skin for a nostalgic feel on historical-tour flights | DC-3 doesn't fly ADS-B commercially today in practice, so this is a novelty skin, not a realism improvement |
| `widebody` | 747 (hump), 777/787 (twin-pod, no hump) as a second widebody sub-skin | The 747 hump is different enough from a generic 777 that offering both as alternate skins (same `fusLen`) meaningfully improves recognizability |
| `bizjet` | Learjet (small-cabin skin), CRJ/ERJ (regional-jet skin — same archetype bucket per the T-tail/rear-engine finding) | See §4.2's caveat: both skins share `fusLen` today; a size-band split is a future refinement, not required to ship the skin choice |
| `heli` | Generic utility helo (Bell/Airbus twin-engine shape) as the civil default; **Apache/Airwolf/Black Hawk military skins reuse BG_CRAFTS geometry that already exists** when `category==='A7'` AND `military` dbFlags bit is set | The cheapest win in this whole doc: no new geometry, just a new consumption path for shapes the renderer already builds |
| N/A — `category==='A6'` fallback (fighters, §3.6 of `flight-fields-models.md`) | F-16 / F-22 skin, reusing BG_CRAFTS's existing `f16`/`f22` geometry unchanged | The fighter fallback today renders as a generic `bizjet` body; swapping in the ALREADY-BUILT F-16/F-22 silhouette when `category==='A6'` is a near-zero-cost visual upgrade — no new model authoring required, just a new call site |

### 4.5 Banner-tow roster vs. live-swap vs. ground-only placement

| Model / family | Banner-tow (existing surface) | Live ADS-B skin (new surface, §4.4) | Ground-only decor |
|---|---|---|---|
| P-51 Mustang, Spitfire, Bf 109, Zero, Corsair (WWII fighters) | ✅ natural fit — small, fast, tow-plane-shaped | ❌ essentially never appear on ADS-B (rare warbird transponders) | ✅ static yard/hangar prop |
| F-16, F-22, Apache (**already in BG_CRAFTS**) | ✅ already shipped | ✅ **reuse as-is** for the `category==='A6'` fallback / military `heli` skin (§4.4) | ✅ |
| B-17, B-52, C-130 (large military) | ✅ (B-52 already shipped) | ⚠️ possible but rare sightings — low priority | ✅ |
| SR-71, U-2, V-22 Osprey | ✅ (novelty tow craft) | ❌ almost never on a home ADS-B feed | ✅ |
| Cessna 172, Cirrus SR22, King Air, ATR 72, 737/A320, 747/777, Learjet/CRJ (civil GA/airline) | ⚠️ possible but redundant with the "Toy plane & airliners" archetype dropdown that ALREADY offers these shapes for towing | ✅ **primary use case** — these ARE the archetype skins | ❌ low value (a parked airliner isn't a yard object) |
| DC-3, Concorde, Super Constellation (historical airliners) | ✅ great novelty tow craft | ❌ essentially retired from scheduled ADS-B-visible service | ✅ (a "vintage airliner overhead" novelty) |
| Saturn V, Falcon 9, Space Shuttle (**shuttle already shipped**), Starship | ✅ (as a vertical-launch novelty banner tow, unusual but charming) | ❌ n/a | ✅ launch-pad-style yard novelty |
| Flying saucer, TARDIS-style box, retro spaceships (fiction, §3.4) | ✅ same slot as the 11 shipped fiction craft | ❌ n/a | ✅ |
| Pickup, SUV, school bus, fire truck, ambulance, police car, etc. (ground civilian) | ❌ n/a — no ground-vehicle banner-tow mode exists | ❌ n/a | ✅ **only** surface — driveway/curb/street decor via a new/extended `FurnitureKind` |
| Jeep, Humvee, Sherman, Abrams, Model T, VW Beetle/Bus, muscle cars (ground military/historical) | ❌ n/a | ❌ n/a | ✅ **only** surface |
| DeLorean, Batmobile, KITT, General Lee, Ecto-1, etc. (ground fiction) | ❌ n/a | ❌ n/a | ✅ **only** surface — a fun, low-cost "Custom Objects" style novelty pack |

---

## 5. Proposed pack organization

### 5.1 Taxonomy

| Pack id (proposed) | Path (Settings tree) | Default state | First-wave member count |
|---|---|---|---|
| `base-aircraft-military-historical` | `['Aircraft', 'Military', 'Historical (WWI–WWII)']` | loaded+active | 10 (§3.1 rows 1–10) |
| `base-aircraft-military-modern` | `['Aircraft', 'Military', 'Cold War & Modern']` | loaded+active | 10 (§3.1 rows 11–20, minus already-shipped BG_CRAFTS dupes) |
| `base-aircraft-civil` | `['Aircraft', 'Civil']` | loaded+active | 8 (§3.2, all ★ rows) |
| `base-space-real` | `['Space', 'Real']` | loaded+active | 4 (§3.3 rows 1, 3, 4; row 2 already shipped) |
| `base-ground-civil` | `['Ground Vehicles', 'Civil']` | loaded+active | 9 (§3.5 ★ rows) |
| `base-ground-military-historical` | `['Ground Vehicles', 'Military & Historical']` | loaded+active | 7 (§3.6 ★ rows) |
| `bgcrafts-legacy` (migrated, not newly authored) | `['Aircraft', ...]`/`['Space', 'Fiction']` split by content | loaded+active (grandfathered — never regresses an existing banner config) | 19 (today's BG_CRAFTS, unchanged geometry) |
| `franchise-space-fiction` | `['Space', 'Fiction']` | **unloaded (opt-in)** | 5 (§3.4) |
| `franchise-ground-fiction` | `['Ground Vehicles', 'Fiction']` | **unloaded (opt-in)** | 10 (§3.7) |

Base packs (real hardware, public-domain shapes) default loaded+active —
same reasoning BG_CRAFTS's existing military/NASA roster already applies
without a formal pack system. Franchise/fiction packs default unloaded,
matching avatar-pack precedent, EXCEPT the already-shipped 11 fiction
BG_CRAFTS entries, which migrate in pre-loaded so no existing user's saved
`bgTexts` config silently loses its aircraft on upgrade.

### 5.2 Where each pack surfaces

- **Banner-tow dropdown** (`BgTextEntry.aircraft`): every loaded+active
  pack's `category:'aircraft'` and `category:'space'` (real or fiction)
  members, grouped by pack path — direct generalization of today's 4
  hard-coded optgroups in `modals.ts`.
- **Live-flight archetype skin** (NEW, §4.4): only members carrying
  `archetypeSkin` — i.e. the civil aircraft in `base-aircraft-civil` (the
  refined per-archetype shapes) and, opportunistically, the already-built
  BG_CRAFTS F-16/F-22/Apache geometry for the fighter-fallback/military-helo
  cases. Ground and fiction packs never appear here.
- **Driveway/garage `FurnitureKind` extension of `car`** (future): every
  loaded+active `category:'ground'` member, civil and military/historical
  alike, plus fiction — this is the natural home for the Custom-Objects-
  style ground roster, since a driveway novelty car has the exact same
  "pick a shape, no live feed" profile as a Custom Object today.
- **Roadside/yard decor**: same surface as the `FurnitureKind` extension
  above — a parked Model T, a yard-display Sherman tank (a real thing at
  war memorials/museums), or a Batmobile prop are all just placed,
  non-interactive ground models.

### 5.3 IP posture (following the existing `modals.ts` precedent)

- **Real hardware** (all of §3.1, §3.3, §3.5, §3.6): full real names in the
  UI. No IP concern — these are historical/government/public vehicles, the
  same posture BG_CRAFTS's military/NASA roster already takes ("F-16
  Fighting Falcon," "Space Shuttle orbiter").
- **Fiction** (§3.4, §3.7): **descriptive-generic UI labels only**,
  following 9 of BG_CRAFTS's 11 existing fiction labels — e.g. "Chrome
  time-traveling sports car," not "DeLorean"; "Black armored superhero
  car," not "Batmobile." Internal ids may stay franchise-coded in code
  comments (as `xwing`/`slave1`/`naboo` already are) but must never leak
  into a user-visible string.
  - **Do not repeat the two existing label slips** (`xwing` → "X-wing
    fighter," `serenity` → "Firefly transport") when authoring new fiction
    packs — both name the franchise/proper-noun term directly, breaking
    the pattern the other 9 entries establish. This doc's own §3.4/§3.7
    candidate lists already avoid this (see the "Homage source (never
    named in UI)" column — that column is FOR THIS DOC'S internal tracking
    only, never for shipped UI copy).
  - The one candidate flagged for a product-owner call rather than an
    outright recommendation: the TARDIS-shaped spacecraft entry (§3.4 row
    2) is closer to "a single unmistakable prop design" than the other
    fiction entries, which mostly borrow a general SHAPE FAMILY (X-wing-
    style fighter, saucer-style freighter) rather than one specific
    real-world-photographed object.

---

## 6. Integration checklist (delta against what's shipped today)

1. **`Store.vehiclePacks?: Record<packId, {loaded?, active?, members?}>`**
   — new, additive, mirrors `Store.avatarPacks` exactly; add to
   `Planner._loadFromHa`'s explicit field list (CLAUDE.md's own repeated
   warning about this step applies here too).
2. **`src/vehicles.ts`** (new, pure, three-free — the `avatars.ts`
   precedent): `VehicleModelDef`/`VehiclePackDef` types, registry
   singleton, `resolveVehicleModel`/pack-membership helpers. Shared by both
   the app graph and the lazy three.js chunk, exactly like `avatars.ts`.
3. **`src/vehicle-packs/*.ts`** (new, lazy-chunked per pack, manifest
   pattern copied from `src/avatar-packs/manifest.ts`) — one module per
   pack in §5.1, each a data table of `VehicleModelDef`s built from
   `RecipePrimitive`-shaped arrays.
4. **`modals.ts`'s `AIRCRAFT_GROUPS`** → replaced by a pack-driven builder
   reading loaded+active vehicle packs (mirrors how the avatar pack tree
   already replaces a hard-coded avatar list in the Avatars settings tab).
5. **`three-renderer.ts`'s `BG_CRAFTS`/`_buildBannerCraft`** → the 19
   existing entries migrate into a `bgcrafts-legacy` pack UNCHANGED
   (geometry byte-identical, so no existing banner config or test golden
   regresses); `_buildBannerCraft`'s per-id switch becomes a generic
   primitive-list interpreter reading `VehicleModelDef.primitives`
   (reusing whatever interpreter Custom Objects already has, per §1.5).
6. **`_buildAircraftModel`** gains an optional model-skin parameter: when a
   `VehicleModelDef` with a matching `archetypeSkin` is active (either
   user-selected per-archetype in Settings, or auto-selected for the
   `category==='A6'`/military-`heli` fallback cases per §4.4), build its
   primitives inside the archetype's existing `fusLen`/`fusHalfW` envelope
   instead of the generic body; `_flightArchetypeMetrics`'s other fields
   (`beaconY/Z`, `topY/Z/H/Len`, `aftZ`) either come from the model's own
   authored anchors or fall back to the archetype's generic values when a
   skin doesn't specify them (stale-model-safe).
7. **`Store.flights` gains an optional `archetypeSkins?: Partial<Record<AircraftArchetype, string>>`** (vehicle-model id per bucket) plus the
   existing watch-list mechanism (`flight-glow-rules.md`) extended with an
   optional per-entry skin override, so a user can say "always show tail
   N12345 as an F-16" for a personal favorite.
8. **A new/extended `FurnitureKind` surface** for ground models: either (a)
   `Furniture.vehicleModelId?` on the existing `car` kind (simplest,
   reuses today's presence/EV bindings unchanged) or (b) a family of new
   `cat:'vehicle'` kinds per silhouette bucket (`truck_pickup`,
   `truck_fire`, `bus_school`, …) if per-kind default dimensions matter
   more than a single shared footprint — this doc recommends (a) for the
   first wave (lower integration cost) with (b) as a natural follow-up
   once specific vehicle shapes need distinct footprints (a fire truck and
   a sedan should not share one `w/h/ht` default).
9. **Avatar-pack-content-test precedent**: a `vehicle-content-test.html`
   analog (build EVERY member of every manifest pack, assert it doesn't
   throw) should gate this the same way `avatar-content-test.html` gates
   avatar packs.
10. **Docs**: a `docs/vehicles/AUTHORING.md` sibling to
    `docs/avatars/AUTHORING.md`, and per-pack research docs under
    `docs/vehicles/<category>/<key>.md` mirroring `docs/avatars/**`.

---

## 7. Open questions & risks

- **`bizjet` archetype size-band mismatch** (§4.2): the archetype already
  covers both Learjet-scale (~14–20 m) and CRJ/ERJ-scale (~26–36 m) real
  aircraft in ONE `fusLen`. Adding named skins for both ends makes the
  mismatch visually concrete (a "Learjet" and a "CRJ900" skin both built to
  1900 mm) in a way the current generic single-shape body doesn't surface.
  Worth a product call: accept it (consistent with the archetype's existing
  design), or split into `bizjet-small`/`bizjet-regional` — a real
  archetype-count change, out of scope for this research pass.
- **TARDIS-style entry's IP comfort** (§5.3) — flagged, not resolved here.
- **Ground-vehicle `FurnitureKind` shape** (checklist item 8) — single
  shared footprint (`car`-extension) vs. per-kind kinds is a real design
  fork this doc intentionally leaves open rather than picking for the
  implementer.
- **No web-verifiable popularity metric exists** for most rankings in this
  doc — every "pop rank" column is this pass's own reasoned ordering from
  search-result consensus (multiple "most iconic X" listicles agreeing) and
  general cultural-ubiquity judgment, not a cited statistic. Treat rankings
  as a reasonable starting order for "first wave" selection, not a hard
  fact — exactly the caution `flight-fields-models.md` §3.1 already
  applies to its own "most-produced ≠ most-flying" caveat.
- **Real dimensions for a few entries are single-source or rounded**
  (SF34/Saab-340-style caveat precedent from `flight-fields-models.md`
  §3.4 applies analogously here): Model T length, farm tractor, golf cart,
  and several fictional-vehicle "dimensions" (fiction ground vehicles have
  no real-world dimension to verify — the table omits a dimensions column
  for §3.7 for exactly this reason, unlike every other section).
- **This pass did not fetch primary manufacturer spec sheets** for most
  entries (used web-search-aggregated figures, consistent with how
  `flight-fields-models.md` treats secondary sources it couldn't
  independently verify) — good enough for "appropriate scale," not
  engineering-grade.

---

## 8. Sources

- Diorama repo internals (read directly): `src/three-renderer.ts` (`BG_CRAFTS`
  ~L776–817, `_buildBgAircraft`/`_buildBannerCraft` ~L13822–14010,
  `_flightArchetypeMetrics`/`_buildAircraftModel` ~L16544–16700+),
  `src/ui/modals.ts` (`AIRCRAFT_GROUPS` ~L2330–2400), `src/geometry.ts`
  (`FURNITURE_KINDS` — `car`/`ev_charger`/outdoor cat entries ~L2630–2665),
  `src/avatars.ts` + `docs/avatars/AUTHORING.md` (pack registry precedent,
  read in full), `docs/research/flight-fields-models.md` and
  `docs/research/flight-tracking.md` (the archetype design + display-shell
  compression precedent this doc extends), CLAUDE.md ("Flight & satellite
  tracking," "Playful background text," "Avatar packs & settings drawer"
  sections).
- Aircraft dimensions: Britannica ("11 of the World's Most Famous
  Warplanes"), Military Aviation Museum (P-51D), SlashGear ("Best-Looking
  WW2 Aircraft"), World War 2 Planes (dimension comparisons), MILAVIA
  aircraft specification pages (F-14, F-15, F-16, F-22), globalsecurity.org
  (F-16/F-22/M1 Abrams/U-2/C-130 spec pages), sr-71.org/sr71blackbird.org
  (SR-71), inetres.com (UH-60, AH-64), Boeing.com (CH-47, V-22), Patriots
  Point / Sullenberger Aviation Museum (UH-1 Huey), AeroCorner (F4U
  Corsair, B-52), aero-web.org (Corsair variants), Wikipedia (Douglas DC-3,
  Piper J-3 Cub, Piper PA-18, De Havilland DHC-2 Beaver, Falcon 9,
  Falcon 9 v1.1/Block 5, Saturn IB/C-2, TX1, New Routemaster, Volkswagen
  Transporter T5/T6, Volkswagen Beetle Type 1 via Dimensions.com), KN
  Aviation (Boeing 747 specs, Concorde vs. 747), concordesst.com (Concorde
  dimensions), airships.net / liquisearch.com (Goodyear Blimp), Space.com
  ("Rockets Then and Now," "The World's Tallest Rockets," Apollo
  spacecraft), Universe Today (Falcon Heavy vs. Saturn V), classicjeeps.co.uk
  (Willys Jeep), globalsecurity.org (M1 Abrams), 247wallst.com (M4 Sherman
  vs. modern trucks), dimensions.com (Volkswagen Beetle, muscle cars
  collection), zeroto60times.com / U.S. News ("10 Most Iconic American
  Muscle Cars"), vehiclesizes.com (Ford Mustang).
- Ground-vehicle civilian dimensions: dimensions.com (Ford F-150, city
  transit buses), gigacalculator.com / greenlight.com / enderamotors.com
  (school bus size guides), schneiderjobs.com / truxspot.com / fleetsworld.com
  (semi-truck dimensions), firefighterinsider.com / truckcamperfanatic.com
  (fire engine dimensions), dimensionsguide.com / shunauto.com (ambulance
  dimensions), various waste-truck industry pages (garbage truck
  dimensions).
- Fictional vehicle rankings: WatchMojo ("Top 10 Best Fictional Cars"),
  OboxMA ("15 of the Coolest Cars Driven by Fictional Characters"), Ina
  Motors ("10 Most Famous Cars from Movies and TV"), Ranker ("The Coolest
  Fictional Cars"), SlashFilm ("The 15 Best Fictional Cars"), Paste
  Magazine ("15 Iconic Fictional Cars"); fictional spacecraft: The Geek
  Twins ("Ultimate Guide to Sci-Fi Vehicles"), New Space Economy ("Top 10
  Spaceships in Science Fiction"), HowStuffWorks ("The Coolest Spaceships
  in Science Fiction"), SlashFilm ("The 15 Best Movie Spaceships").
- WWI aircraft: warhistory.org (SPAD XIII), Wikipedia (Fokker Dr.I),
  greatwarflyingmuseum.org (Sopwith Camel specifications),
  historynet.com ("Deadly Duo: Sopwith Camel and Fokker Triplane").
