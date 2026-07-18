# Avatar prop audit — character-iconic hand props & motion

*Audited 2026-07-18. Scope: every shipped avatar pack (`core` + 9 `base-*` +
53 franchise packs, ~572 members total across `src/avatar-packs/*.ts`) plus
the 24 legacy `legacyAccessories` kinds built imperatively in
`three-renderer.ts._addAvatarAccessories`. Cross-checked against
`docs/avatars/AUTHORING.md` (schema) and spot-checked research docs
(`docs/avatars/**`) for star-wars, mario, toy-story, fallout-tv,
sesame-street, wall-e to catch spec-vs-implementation prop gaps.*

**Division of labor** (per brief): this doc covers **character-iconic props**
only — a magician's wand, Cookie Monster's cookie, Master Chief's rifle. A
concurrent effort (`docs/research/shared-props.md`) covers **household chore
props** (vacuum, broom, umbrella) as a shared system. Where a character's
iconic prop happens to double as a household item (a witch's broom, a chef's
whisk), it is listed here as character-authored (per-member `accessories`),
not routed through the shared mechanism — these are different code paths and
both can exist.

## How to read this doc

- **TOP-20**: the highest recognition-value gaps, each with a ready-to-paste
  `AvatarPrimitive` spec (shape/size mm/color/anchor/rot/animate), current
  primitive count (for the ≤10 budget) and decal count (cap 2), so an
  implementer can drop it straight into the pack file.
- **Appendix**: everything else, grouped by pack family, table-style —
  members with props (prop + anchor + animated?), members missing an
  iconic prop, members whose existing prop should gain `animate`, and
  explicit "no prop is correct" calls so the implementer doesn't
  over-decorate a deliberately clean silhouette (Sleek Android, Pac-Man
  ghosts, Squid Game Front Man, etc.).
- Every recommendation respects the **≤10 primitives/member** cap and
  **≤2 decals/member** cap — current usage is noted so headroom is obvious.
  Where a member is already AT the cap (Fallout T-60 armor), the doc says so
  explicitly and suggests what to trim.

## Rig limitations encountered (`// approx:` convention)

These recur across dozens of members; flagging once instead of per-member.
Follow the existing `// approx: <what and why>` comment convention
(AUTHORING.md "Recipes" section) when implementing:

1. **No torus/ring primitive.** Halos (Mercy, Paimon), monocles (Penguin,
   Count von Count), rings, and hoops are all approximated as flattened
   cylinders/discs. Fine as-is; don't re-litigate existing approximations.
2. **No curved/hook primitive.** Canes with a curved handle (Riddler), hooks
   (Peter Pan-style pirate hook), recurve bows (Legolas, Ashe, Hawkeye) are
   straight cylinders. Acceptable; a bow read comes from context (quiver +
   arrow), not curvature.
3. **No per-primitive opacity.** Sheer capes (Elsa) render opaque.
4. **No forked/pronged primitive.** Sai (Raphael) render as plain cylinders.
5. **No helical primitive.** Slinky Dog's coil is 3 stacked rings.
6. **Fabric prints beyond `decals.print` enum** (`dots|stripes|check|
   heart-scatter`) — argyle diamond lattices, floral, gingham, plaid-not-check
   all fall back to solid color or a couple of proud accent boxes. This is a
   real recurring gap (Raj's argyle vest, Dorothy's gingham, Bernadette's
   floral skirt) but is explicitly the shared-props/decals team's surface,
   not a hand-prop issue — noted for completeness only.
7. **No cloth-flutter/physics channel.** Billowing robes/coats (Snape,
   Barbossa's coat) are static oversized cone/cape shells. `animate:'sway'`
   on the cape primitive itself is NOT currently used ANYWHERE in the
   codebase despite ~35 members having a `cape` shape — this is the single
   biggest systemic miss (see TOP-20 #11 and the cape appendix note).
8. **Wings never use `animate:'flap'`.** Every winged member (Buzz
   Lightyear, Mercy, Rainbow Dash, He-Man's Sorceress, Shrek's Dragon,
   Goldar) builds static wing boxes. `flap` exists, costs zero extra
   primitives (just add the `animate` field to the existing wing prims), and
   is the single cheapest high-value fix in this whole audit.
9. **Whiskers / thin linear accessories** (Puss in Boots) may not read
   below ~50 px — noted in-source already, no action needed.

---

## TOP-20 punch list

Ranked by recognition value × implementation cost. Each entry: pack file,
member id, current primitive/decal count, the gap, and an exact spec.

### 1–2. Harry Potter — Harry and Ron have no wands

`src/avatar-packs/movies-harry-potter.ts`. `movies-harry-potter/harry` (6
accessories, headroom 4) and `movies-harry-potter/ron` (5 accessories,
headroom 5) are the two title characters of a wand-based franchise and
neither holds a wand (Dumbledore, Voldemort, and Draco all correctly have
one). This is the single most glaring gap in the whole audit.

```ts
// Harry — add to accessories[]:
{ shape: 'cylinder', size: [6, 5, 220], anchor: 'handR', pos: [0, -100, 0], rot: [0.15, 0, 0.1], color: 0x6b4a2c },
// Ron — same recipe, slightly different wood tone:
{ shape: 'cylinder', size: [6, 5, 230], anchor: 'handR', pos: [0, -105, 0], rot: [0.15, 0, 0.1], color: 0x7a5a34 },
```

### 3. Sesame Street — Cookie Monster has no cookie

`src/avatar-packs/sesame-street.ts`, `sesame-street/cookie-monster` (5
accessories, headroom 5). Has the giant mouth and shaggy tufts but nothing
to eat — the character's entire premise. Big value, trivial cost.

```ts
{ shape: 'cylinder', size: [46, 46, 16], anchor: 'handR', pos: [0, -30, -10], color: 0x8a5a2e }, // cookie body
{ shape: 'sphere', size: 7, anchor: 'handR', pos: [-14, -22, -20], color: 0x2a1810 },            // choc chip
{ shape: 'sphere', size: 7, anchor: 'handR', pos: [10, -34, -14], color: 0x2a1810 },              // choc chip
{ shape: 'sphere', size: 6, anchor: 'handR', pos: [2, -20, -4], color: 0x2a1810 },                // choc chip
```
(4 new prims → 9 total, still under cap.)

### 4. Base ▸ Careers — Magician has no wand

`src/avatar-packs/base-careers.ts`, `magician` (4 accessories via
`legacyAccessories:'magician'` imperative build, no declarative
`accessories` array yet — headroom is effectively the full 10). A magician
with a top hat and no wand is the most conspicuous single-member gap in the
base packs.

```ts
accessories: [
  { shape: 'cylinder', size: [6, 6, 240], anchor: 'handR', pos: [0, -110, 0], color: 0x141414 },
  { shape: 'sphere', size: 11, anchor: 'handR', pos: [0, 10, 0], color: 0xf2f2f0 }, // white tip
],
```

### 5. Base ▸ Pop Culture — Genie has no magic lamp

`src/avatar-packs/base-pop-culture.ts`, `genie` (7 accessories, headroom 3).
Has cuffs on both hands but no lamp — the single object the character
exists to be summoned from.

```ts
{ shape: 'sphere', size: [46, 30, 50], anchor: 'handL', pos: [0, -30, -20], color: 0xd9b23a, metalness: 0.6, roughness: 0.3 }, // lamp body
{ shape: 'cone', size: [14, 46], anchor: 'handL', pos: [-30, -30, -50], rot: [0, 0, 1.2], color: 0xd9b23a }, // spout
```
(9 total, within cap.)

### 6. Halo — Master Chief has no rifle

`src/avatar-packs/halo.ts`, `halo/spartan-supersoldier` (6 accessories,
headroom 4). Full Mjolnir armor, pauldrons, power unit backpack — but empty
hands. The MA5 assault rifle is as iconic as the armor itself.

```ts
{ shape: 'box', size: [24, 26, 300], anchor: 'handR', pos: [0, 10, -80], color: 0x2a2c2e },
{ shape: 'box', size: [16, 16, 40], anchor: 'handR', pos: [0, -30, -30], color: 0x1a1a1a }, // magazine
```

### 7. DC Batman — Catwoman has no whip

`src/avatar-packs/dc-batman.ts`, `dc-batman/cat-burglar` (7 accessories,
headroom 3). Ears, goggles, catsuit — no whip, arguably her most repeated
prop across every adaptation. A coiled-at-hip approximation avoids needing a
curved/dynamic primitive.

```ts
{ shape: 'cylinder', size: [60, 60, 16], anchor: 'hip', pos: [80, -14, -30], rot: [1.5708, 0, 0], color: 0x161616 }, // coiled whip
```

### 8. Genshin Impact — five characters missing their signature weapon

`src/avatar-packs/genshin-impact.ts`. Only the Traveler (of 8 members) holds
a weapon. The other five are all built around a specific weapon-type
identity in the source game — a real gap, batchable in one pass:

| Member | id | Missing weapon | Headroom |
|---|---|---|---|
| Diluc | `crimson-vintner` | Claymore (great­sword, back-slung like Ned Stark's Ice) | 4 (6/10) |
| Venti | `wind-bard` | Bow (back-slung like Legolas) | 1 (9/10 — trim a hair-tip sphere first) |
| Zhongli | `amber-contractor` | Polearm (back-slung like Yasuo's sword) | 3 (7/10) |
| Raiden Shogun | `thunder-regent` | Naginata (hand-held, matches her stance) | 2 (8/10) |
| Ganyu | `frost-envoy` | Bow + quiver (matches Ashe's recipe) | 0 (10/10 — trim the darker-ombré-tip box first) |

Reuse the existing `saber()`-style helper pattern (star-wars-prequels.ts) or
Legolas/Ashe's back-slung bow recipe (`cylinder` bow + `cylinder` quiver on
`back`) directly — the geometry already exists elsewhere in the codebase.

### 9. Zelda — Ganondorf has no weapon

`src/avatar-packs/zelda.ts`, `zelda/demon-king` (9 accessories, headroom 1
— trim is needed, e.g. drop one tusk cone or merge the shoulder pauldrons
into one wider box). The Demon King with tusks, horns, and a cape but no
sword/trident reads as unfinished for the franchise's main antagonist.

```ts
{ shape: 'cylinder', size: [16, 16, 60], anchor: 'handR', pos: [0, 40, 0], color: 0x8a6a2e }, // hilt
{ shape: 'cylinder', size: [10, 10, 480], anchor: 'handR', pos: [0, 340, 0], color: 0xb0b0ac }, // blade
```
(Requires trimming ~1 prim first to stay ≤10 — swap the two shoulder boxes
for one wider one.)

### 10. Overwatch — Mercy has no caduceus staff; wings never animate

`src/avatar-packs/overwatch.ts`, `overwatch/guardian-medic` (7 accessories,
headroom 3). Has the halo and wings but no staff, and the wings are static
boxes despite `animate:'flap'` existing for exactly this. Both fixes in one
member:

```ts
// Staff (replaces nothing, new prim):
{ shape: 'cylinder', size: [8, 8, 260], anchor: 'handR', pos: [0, 120, 0], color: 0xd4af37 },
{ shape: 'sphere', size: 16, anchor: 'handR', pos: [0, 255, 0], color: 0xffe066, emissiveIntensity: 0.4 },
// Wing animate (edit the TWO EXISTING wing box prims, no new prims):
// wing L: add  animate: { kind: 'flap', speed: 1.4, amp: 0.35 }
// wing R: add  animate: { kind: 'flap', speed: 1.4, amp: -0.35 }  // mirrored per the flap convention
```
(9 total, within cap.)

### 11. Marvel Avengers — Doctor Strange's Cloak never animates

`src/avatar-packs/marvel-avengers.ts`, `marvel-avengers/master-sorcerer`.
The Cloak of Levitation is functionally a co-star in the source material —
it moves on its own. Currently a static `cape` primitive. Add `animate` to
the existing cape (no new prims) and spin the existing Eye-of-Agamotto-style
chest amulet cylinder (already present, `emissiveIntensity: 0.4`, currently
static):

```ts
// on the existing cape accessory: animate: { kind: 'sway', speed: 0.6, amp: 0.15 }
// on the existing chest amulet cylinder: animate: { kind: 'spin', speed: 1.2 }
```
This is also the flagship example to generalize: **every cape-bearing
member in the codebase (~35 of them) is a free `animate:'sway'` candidate**
— see appendix note under "systemic cape gap."

### 12. Toy Story — Buzz Lightyear has no laser

`src/avatar-packs/toy-story.ts`, `toy-story/buzz` (9 accessories, headroom
1 — trim one shoulder pad or merge them). "This is my laser" is his
signature line; the wrist-mounted laser is absent.

```ts
{ shape: 'cone', size: [9, 24], anchor: 'handR', pos: [0, -34, -18], color: 0xd8302a, emissive: 0xd8302a, emissiveIntensity: 0.3 },
```
(Merge the two `shoulderL`/`shoulderR` pad boxes into a shared pair sized
identically first, or drop one green wingtip box, to make room.)

### 13. Base ▸ Careers — Chef has no whisk/spatula

`src/avatar-packs/base-careers.ts`, `chef` (4 accessories via
`legacyAccessories`, ample headroom). Toque, apron, neckerchief — no
cooking implement in hand, the one prop that would sell "chef" from across
the room.

```ts
accessories: [
  { shape: 'cylinder', size: [6, 6, 130], anchor: 'handR', pos: [0, -55, 0], color: 0xd8d8d0 }, // whisk handle
  { shape: 'sphere', size: [24, 36, 24], anchor: 'handR', pos: [0, 5, 0], color: 0xc8c8c8 },     // wire-loop approx
],
```

### 14. Base ▸ Careers — Cowboy has no lasso/sidearm

`src/avatar-packs/base-careers.ts`, `cowboy` (4 accessories via
`legacyAccessories`, ample headroom). Hat, bandana, vest — no rope or
six-shooter. Coiled-rope-at-hip is the cheapest read (mirrors the
Catwoman-whip idiom above).

```ts
accessories: [
  { shape: 'cylinder', size: [55, 55, 14], anchor: 'hip', pos: [80, -10, 0], rot: [1.5708, 0, 0], color: 0x9c7a45 }, // coiled lasso
],
```

### 15. Star Wars OT — Chewbacca has no bowcaster

`src/avatar-packs/star-wars-ot.ts`, `star-wars-ot/chewbacca` (8
accessories, headroom 2). Bandolier and pouches present; the bowcaster
(his entire fighting-stance silhouette) is missing.

```ts
{ shape: 'box', size: [30, 50, 220], anchor: 'handR', pos: [0, -90, -40], color: 0x5a4a3a },
```

### 16. Base ▸ Aliens — Martian antennae never animate

`src/avatar-packs/base-aliens.ts`, `base-aliens/martian` (4 accessories, no
new prims needed — pure `animate` addition to the two existing antenna
cylinders). "Glowing-tip telepathy antennae" that never move is a missed,
essentially-free win.

```ts
// antenna L cylinder: animate: { kind: 'sway', speed: 1.1, amp: 0.22, phase: 0 }
// antenna R cylinder: animate: { kind: 'sway', speed: 1.1, amp: 0.22, phase: 1.6 }
```

### 17. Base ▸ Aliens — Tentacle-head's tentacles never writhe

`src/avatar-packs/base-aliens.ts`, `base-aliens/tentacle-head` (5
accessories, pure `animate` addition to all 5 existing cone tentacles).
This is the textbook use case the `sway` channel's doc comment describes
("author an octopus as N sways with staggered phases") — the member exists
and is unanimated.

```ts
// each of the 5 tentacle cones: animate: { kind: 'sway', speed: 0.9, amp: 0.3, phase: <0, 1.2, 2.4, 3.6, 4.8> }
```

### 18. Base ▸ Robotic — Drone-carrier-bot's drones are static, not orbiting

`src/avatar-packs/base-robotic.ts`, `base-robotic/drone-carrier-bot` (5
accessories, pure `animate` addition to the two existing drone spheres). A
"drone carrier" whose drones just sit fixed on a rack reads as inert; the
`orbit` channel exists for exactly this.

```ts
// drone L sphere: animate: { kind: 'orbit', speed: 0.8, amp: 70 }
// drone R sphere: animate: { kind: 'orbit', speed: -0.8, amp: 70 }  // counter-rotating reads as "patrolling"
```

### 19. Fallout TV — T-60 Power Armor Knight has no weapon (at primitive cap)

`src/avatar-packs/fallout-tv.ts`, `fallout-tv/t60-power-armor-knight` (10
accessories — **at the hard cap**, no headroom). Sealed power armor without
a minigun/laser rifle undersells the single most recognizable Fallout
silhouette. Requires a trim first.

```ts
// Trim: merge the two vent cylinders (back, ±40mm) into ONE centered vent box, freeing 1 slot.
// Add:
{ shape: 'cylinder', size: [22, 22, 320], anchor: 'handR', pos: [0, -140, -60], color: 0x2f3236 }, // minigun/laser rifle barrel
```

### 20. Base ▸ Sci-Fi — Space Marine has no weapon

`src/avatar-packs/base-scifi.ts`, `base-scifi/space-marine` (7 accessories,
headroom 3). Bulky armor, HUD visor, utility belt — but a "space marine"
archetype with empty hands undersells the combat read.

```ts
{ shape: 'box', size: [26, 28, 320], anchor: 'handR', pos: [0, 10, -90], color: 0x2a2c30 },
```

---

## Appendix A — everything else, grouped by pack family

Table columns: **member** (id, dropping the pack prefix) · **existing
props/notes** · **gap or recommendation** · **headroom** (current
accessories/10; only listed when a change is proposed). "—" in the gap
column with a note means the existing choice is correct and should be left
alone (don't over-decorate).

### Legacy `legacyAccessories` kinds (imperative, `three-renderer.ts`)

These 24 kinds (adult/child/robot/professional/hacker/movie_star/ninja/
ninja_cyborg/cyborg/athlete/teddy_bear/cartoon_mouse/cartoon_dog/
cartoon_duck/cowboy/magician/farmer/tech_expert/supermodel/wise_oracle/
astronaut/alien/cat/dog) build hand-crafted THREE.Mesh trees directly, not
`AvatarPrimitive[]` — adding a hand prop here means editing
`_addAvatarAccessories` in `three-renderer.ts` (out of scope for this
research-only doc, but flagged for the implementer):

| Kind | Has prop | Gap |
|---|---|---|
| magician | top hat, bowtie | **wand** — see TOP-20 #4 |
| cowboy | hat, bandana, vest | **lasso/gun** — see TOP-20 #14 |
| wise_oracle | ankle robe, beard, amulet | already has a **twoHanded staff** (declarative override in `base-careers.ts`) — no action |
| farmer | straw hat, denim bib | pitchfork optional, low priority (decal now carries "flannel" read) |
| tech_expert | glasses, headset+mic, belt | tablet/handheld device optional, low priority |
| astronaut | helmet, panel, backpack | no prop needed — helmet+panel silhouette reads clean |
| ninja / ninja_cyborg | katana slung on back | correct — sheathed-weapon convention matches Genji/Yasuo elsewhere |
| robot | antenna, chest stripe | antenna could gain `// approx:` sway if ever migrated to declarative form; low priority |
| professional, hacker, movie_star, athlete, teddy_bear, cartoon_mouse/dog/duck, cyborg, supermodel, adult, child, alien, cat, dog | — | **no prop is correct** — clean archetype/costume silhouettes, adding hand items would clutter |

### Base packs

**base-humans** (child/toddler/teen/elder): no hand props on any member —
**correct**, these are generic scaffolding archetypes; a prop would break
the "any household member" genericness.

**base-careers**: doctor (stethoscope✓), scientist (clipboard✓+pen), teacher
(book✓), police-officer (belt+pouches, no baton — low-medium, optional),
firefighter (SCBA tanks, no axe — low-medium, optional), pilot (no prop —
correct, cockpit implied), nurse (cap+ID, no syringe/clipboard — low),
mail-carrier (satchel✓ — the satchel IS the prop, no action), chef →
TOP-20 #13, magician → TOP-20 #4, cowboy → TOP-20 #14, wise_oracle
(staff✓ twoHanded), construction-worker (hammer **handle only** — a stub
cylinder near the hip, no head — upgrade: add a box hammer-head at the
cylinder tip, cheap, 6/10 headroom).

**base-scifi**: astronaut (—, correct), space-marine → TOP-20 #20,
retro-spaceman (raygun✓ in handR), time-traveler (pocket watch on chest,
static — low-priority `animate:'sway'` candidate for the swinging chain),
space-pirate (holstered blaster at hip — reads fine as "ready," no action),
mad-scientist (vial✓ in handR), wasteland-wanderer (gas mask, filter
canister, no hand weapon — low priority, a pipe wrench would fit the
scavenger theme, 8/10 headroom).

**base-pop-culture**: teddy_bear/cartoon_mouse/cartoon_dog/cartoon_duck/
ninja — legacy, see above. pirate (hook✓), vampire (cape✓ — animate
candidate, see systemic cape note), zombie (— correct, arms-out shamble is
the "prop"), witch_wizard (staff+orb✓ twoHanded — orb has emissiveIntensity
but no `animate:'spin'`; cheap upgrade, headroom 4/10), superhero (cape +
emblem✓ — correct as-is, a hand prop would clutter a generic hero), clown
(9/10 — near cap, a juggling-ball/balloon-animal prop is nice-to-have but
would need a trim first), mummy (— correct), knight (sword✓), caveman
(club✓), genie → TOP-20 #5.

**base-robotic**: robot/cyborg/ninja_cyborg — legacy. retro-tin-bot (antenna,
no hand prop — low priority, antenna sway is a cheap animate win, headroom
4/10), sleek-android (— **correct**, deliberately clean chrome minimalism,
do NOT add a prop), drone-carrier-bot → TOP-20 #18, steampunk-automaton
(furnace/pipe, no hand tool — low priority; the exhaust "steam puff" sphere
is a candidate for `animate:'sway'` too, small extra win), security-bot
(baton at hip via cylinder — reads fine, low priority to move to hand).

**base-aliens**: alien (legacy, —), grey-alien (— correct, clinical bald
look), martian → TOP-20 #16, tentacle-head → TOP-20 #17, insectoid
(mandibles/wing-cases static — low-priority sway candidate, headroom 4/10),
blob-alien (floating internal "organ" spheres, static — low-priority sway
candidate for an "ooze churning" effect, headroom 7/10).

**base-domestic-animals, base-farm-animals, base-zoo-animals**: all
quadrupeds/pets — **no hand props anywhere, correct** (animals don't hold
things; the rig doesn't even have a `handL`/`handR` anchor concept on
`quadruped`). Farm/zoo pack headline reads (horns, manes, trunks, stripes)
are all well covered by existing accessories; no gaps found.

### Sci-Fi franchise packs

**star-wars-ot**: Luke/Obi-Wan/Anakin-adjacent all have lightsabers✓ (great
coverage). Leia — no prop, correct (blaster optional but not essential to
her read). Han — no blaster shown despite `bubbles:['🔫',...]`; low-medium
priority add (holstered box at hip, mirrors the vest read). Chewbacca →
TOP-20 #15. C-3PO/R2-D2 — no prop needed, droids read via body shape.
Vader — no prop, correct (saber implied, doesn't ignite while walking).
Stormtrooper (blaster rifle✓ in handR). Boba Fett — no blaster shown;
low-medium priority (holstered pistol at hip).

**star-wars-prequels**: every Jedi/Sith has a saber✓ (excellent coverage,
including the Maul double-blade and Grievous four-armed dual-wield). No
gaps.

**star-wars-mandalorian**: Din Djarin has a wrist-gadget cylinder, no
blaster pistol — low-medium priority add. Grogu — no prop, correct (a
frog/cookie prop would be cute but is optional flavor, not a gap). Armorer
— "forgemaster" with no hammer/anvil prop; medium priority given her title.
Others (Marshal, Dark Trooper, remnant trooper, Bo-Katan, IG-11, Imperial
warlord) — no prop needed, armor silhouette carries the read.

**star-trek-tng / star-trek-ds9**: nobody holds a tricorder/phaser/PADD.
This is a systemic but LOW-priority gap — Star Trek's "hands at sides,
calm bridge posture" convention is itself period-accurate; forcing a prop
into every member would fight the source material's restraint. If any
member gets one, make it the Chief Engineer (Geordi/O'Brien, both already
carry a hand-tool box — check: O'Brien and DS9's doctor already HAVE a
handR tool box✓, TNG's Geordi does not — low priority parity fix).

**halo**: Master Chief → TOP-20 #6. Cortana — correct, no prop (hologram).
Elite Commander (energy sword✓ in handR — good). Marine Sergeant (cigar
only, no rifle — medium priority, "grunt with a smoke and no gun" reads
oddly for a marine). Grunt Trooper (mask+tank, no plasma pistol — low
priority). Brute Warrior (no gravity hammer — medium-high, it's his
signature weapon and there's headroom, 8/10). ODST (no SMG — medium
priority, 5/10 headroom).

**transformers**: Optimus (—, correct hand-to-hand robot), Megatron (arm
cannon✓), Bumblebee (—, correct), Ironhide (twin back cannons✓), Ratchet
(—, correct medic), Starscream (no weapon — low priority, jets are the
read), Alpha Trion (energon core chest disc✓, static — cheap `animate:
'spin'` candidate, headroom 4/10).

**firefly**: Malcolm Reynolds — holster box at hip implies a revolver but
no visible gun body; low priority (already reads as armed). Zoe (—,
correct, "quiet competence" look). Wash (—, correct, Hawaiian-shirt pilot).
Kaylee (wrench✓ in handR). Jayne (rifle✓ in handR, tactical vest✓ — well
covered). Inara (—, correct). Simon (—, correct doctor look, could add a
med-kit but low priority). River (—, correct, unsettling-calm read). Shepherd
Book (—, correct, collar carries the clergy read).

**metroid**: Samus (arm cannon✓ — built into the armor, excellent). Zero
Suit Samus (—, correct civilian look). Infant Metroid (pet, correct no
prop). Space Pirate (staff-like weapon✓ in handL + cylinder in handR — good).
Chozo Statue (—, correct, statue pose). Ridley/Kraid/Mother Brain — pets/
bosses, correct no hand props (creature-scale, not humanoid-prop-scale).

**avatar-pandora**: Jake (bow✓), Neytiri (bow✓), Mo'at (staff✓), Tsu'tey
(spear✓) — all four Na'vi covered. Grace (tablet✓+cigarette), Quaritch
(holstered sidearm✓ at hip), Trudy (holstered sidearm✓ at hip) — the three
RDA humans all read fine, no gaps.

**stranger-things**: Mike (walkie-talkie✓), Dustin (—, correct, cap is the
read), Lucas (slingshot✓), Will (sketchbook✓), Max (skateboard✓), Steve
(nail bat✓), Hopper (holstered sidearm✓). Eleven (—, correct, powers are
the read, a nosebleed accent already sells it). Demogorgon (clawed hands✓
approx, pet — correct).

**wall-e**: exceptionally well-covered already — see TOP-20 rig-limitations
note; every eyestalk-bearing member (WALL-E, EVE, Mr. Handy-adjacent BURN-E)
already uses `animate:'sway'`, M-O already uses `animate:'spin'` on its
brush base. **No changes recommended** — this pack is the model example
other packs should be brought up to.

**fallout-tv**: Lucy (—, correct, unarmed Vault Dweller), Cooper/Ghoul
(revolver✓ in handR), Maximus-squire (—, correct pre-armor), T-60 Knight →
TOP-20 #19, Norm/Hank/generic-dweller/Brotherhood-scribe (—, correct, suits
carry the read), Dogmeat (pet, correct), Mr. Handy (already animates 3
eyestalks✓ + dual mechanical arms — excellent), Protectron (—, correct
patrol-bot look).

**dc-batman**: Batman (—, correct, no gun ever), Robin (—, correct,
acrobat), Batgirl (—, correct), Alfred (—, correct butler), Commissioner
(—, correct), Joker (—, correct, no weapon reads as more unsettling), Harley
Quinn (—, correct, jester silhouette is enough — a mallet would be nice but
optional/low priority), Catwoman → TOP-20 #7, Penguin (umbrella✓), Riddler
(cane✓).

**marvel-avengers**: Iron Man (glowing palms✓ implied repulsors), Cap
(shield✓), Thor (hammer✓), Hulk (—, correct, fists are the weapon), Black
Widow (glowing gauntlet accents✓), Hawkeye (bow✓), Spider-Man (—, correct,
webs implied via costume only, no prop needed), Black Panther (—, correct,
claws implied), Doctor Strange → TOP-20 #11, Loki (—, no scepter — low-
medium priority, headroom 2/10 is tight though).

**power-rangers-mighty-morphin**: all six Rangers hold no Power Weapon
(Blade Blaster/Power Sword etc.) — low-medium priority as a themed batch,
suits alone read fine for a base roster. Zordon (—, correct, floating head).
Alpha 5 (—, correct, no prop needed). Rita Repulsa (wand✓). Goldar (sword✓
in handR, but wings are static — cheap `animate:'flap'` win, headroom 0/10
so the wing animate is the way to add motion without a new prim).

### Video Games franchise packs

**mario**: Mario/Luigi/Peach/Toad/Yoshi/Bowser/Wario/Donkey Kong — none
hold props, all **correct** (Mushroom Kingdom cast reads via cap+overalls
silhouette, adding fireballs/hammers would clutter). Boo — pet, correct.

**zelda**: Link (sword+shield+bow✓ back-slung — excellent), Zelda (—,
correct, Triforce emblem carries royalty), Ganondorf → TOP-20 #9, Korok
(—, correct), Cucco (—, correct), Goron (—, correct, boulder-body IS the
weapon), Zora (—, correct, aquatic hand-fin paddles already on both hands).

**pokemon**: Trainer (poke-ball-colored hand blocks✓ on both hands — good,
reads as "carrying poke balls"). Pikachu/Charmander/Squirtle/Bulbasaur/
Eevee/Jigglypuff/Meowth/Charizard — all pets, **correct**, no hand props
(quadruped or biped-creature rig, not human-prop-scale).

**minecraft**: Steve/Alex (—, correct, base skins hold nothing; a pickaxe
would be a nice low-priority touch but isn't the canonical bare-skin look).
Skeleton (bow✓+quiver). Creeper/Zombie/Enderman/Villager/Piglin — all
correct, no prop (mob silhouettes read via body shape, not held items).

**lego**: Pirate Captain (cutlass✓), Knight (sword+shield✓), Construction
Worker (hammer✓+toolbelt), Police Officer (baton✓ at hip), Classic Space
×3 (—, correct, twin back-tanks are the read), Smiley Minifig (—, correct,
deliberately bare baseline), LEGO Batman (—, correct, cape+belt is enough
for a minifig-scale Batman).

**pac-man**: dot-chomper/bow-chomper (gloved hands✓, no other prop needed
— **correct**, "radical minimalism is correct here" per the pack's own
source comment). Four ghosts — pets/hover, **correct**, no hands exist on
the hover rig.

**sonic-the-hedgehog**: Sonic/Tails/Knuckles (—, correct, speed/fists are
the read; Knuckles already has knuckle-spike hand accents✓). Amy (hammer✓).
Eggman (—, correct, egg-mobile is implied but not part of the base look).
Shadow (inhibitor rings✓ on both hands — nice touch). Metal Sonic (hand
plates✓ — armor read).

**street-fighter**: all World Warriors are unarmed martial artists —
**correct** across the board (Ryu/Ken/Chun-Li/Guile/Blanka/Zangief/Dhalsim/
Bison), fists and stance ARE the prop for a fighting-game roster.

**league-of-legends**: Jinx (minigun✓), Vi (gauntlets✓), Ashe (bow✓+quiver),
Teemo (—, no blowgun — low priority, backpack+goggles already carry the
"scout" read), Yasuo (sheathed sword✓ — correct, deliberate "haven't drawn
yet" read), Lux (wand✓), Garen (broadsword✓ back-slung), Ezreal (gauntlet✓).
Best-covered franchise pack in the audit — no changes recommended.

**overwatch**: Tracer (—, no dual pistols — medium priority, her holstered/
hand-mounted pistols are a strong identity marker, headroom 5/10). D.Va
(—, correct — light gun is secondary to the mech, base look is fine
unarmed). Reinhardt (rocket hammer✓). Widowmaker (sniper rifle✓). Genji
(sheathed katana✓ — correct, matches Yasuo idiom). Mercy → TOP-20 #10.
Roadhog (hook✓+scrap gun✓). Winston (Tesla cannon✓).

**genshin-impact**: see TOP-20 #8 for the five-character weapon batch.
Paimon (—, correct, floating-fairy read; the halo disc is a cheap
`animate:'spin'` candidate though, headroom 3/10).

**animal-crossing**: Tom Nook (—, correct, shopkeeper apron is enough), K.K.
Slider (guitar✓ two-piece neck+body), Blathers (—, correct, museum-curator
bowtie), Isabelle (—, correct), Resetti (—, correct, hard-hat carries the
"mole warden" read), three generic villagers (—, correct, chibi mascot
reads via ears/tail/face only).

### Cartoons franchise packs

**he-man**: He-Man (Power Sword✓, back-slung — acceptable, though a
hand-held pose would be more iconic; low priority since it's already
present just not gripped). Skeletor (havoc staff✓ twoHanded), Man-At-Arms
(mace✓), Sorceress (—, correct, wings are the read — cheap `animate:'flap'`
win on the two wing boxes, headroom 3/10), Battle Cat (pet mount, correct
no prop), Teela (shield✓), Evil-Lyn (wand✓), Orko (— no wand despite being
"the wizard," medium-low priority, headroom 6/10 with room for a small
cylinder+sphere wand).

**power-rangers** — see Sci-Fi section above (cross-listed under Sci-Fi ▸
Power Rangers path).

**tmnt**: all four turtles have their signature weapon✓ (Leo twin katana
on back, Raph twin sai at hip, Donnie bo staff on back, Mikey nunchaku in
hand) — **exemplary coverage**. Splinter (staff✓ twoHanded + rat tail✓).
April (camera✓). Shredder (blade✓ in handR). No gaps in this pack.

**disney-princess**: Merida (bow✓+quiver — correctly the one archer with a
prop). Rapunzel (—, correct, the giant braid IS the signature prop — no
frying pan needed for a base recognition read, though it's a fun optional
low-priority add). Mulan (sword✓ back-slung). All other princesses
(Elsa/Anna/Ariel/Belle/Snow White/Aurora/Tiana) — **correct**, no hand
prop; gown+hair silhouette is the entire design language of this pack and a
held object would fight it.

**disney-animals**: Founding Mouse/Sailor Duck/Tall Dog Pal — mascot
recolors of legacy kinds, **correct**, no hand props (matches the
teddy_bear/cartoon_* "no prop" convention). Chipmunks ×2, Yellow Pup, Lion
Cub, Elephant Calf, Spotted Fawn — animals, **correct**, no hand props
(quadruped/no-hands or animal-mascot silhouette).

**my-little-pony**: all 6 ponies are quadrupeds, **correct**, no hand props
possible on the rig. Manes/tails are static box stacks — every member here
is a candidate for `animate:'sway'` on the tail segments (low-medium
priority, purely cosmetic "flowing mane" upgrade, zero new primitives).

**shrek**: Shrek (—, correct, fists+belt buckle are enough), Donkey (pet,
correct), Fiona (—, correct, corset+gown carry the ogre-princess read),
Puss in Boots (rapier✓ in handR — good), Farquaad (—, correct, tiny-tyrant
cape+hat silhouette is the joke), Dragon (pet, correct — wings are static,
cheap `animate:'flap'` candidate, headroom 1/10 so animate-only is the way
to add motion here too), Gingy (—, correct, icing details carry the read).

**toy-story**: Woody (—, correct — a toy pistol is optional/low priority),
Buzz → TOP-20 #12, Jessie (—, correct — lasso optional/low priority, mirrors
Woody), Mr. Potato Head (—, correct), Rex (—, correct, tiny arms are the
joke), Hamm/Bullseye/Slinky — pets, correct no props.

**despicable-me**: Gru (—, correct, scarf+turtleneck silhouette carries
him; a freeze-ray gadget is a fun optional low-priority add), three Minions
(—, correct, goggles+bib are the entire design), Margo/Edith (—, correct),
Agnes (unicorn plush✓ in handL — nice), Dr. Nefario (wrench✓ in handR),
Vector (gadget✓ in handR — shrink-ray, covered), El Macho (—, correct,
luchador cape+medallion carry the villain read).

**sesame-street**: Big Bird (—, correct, feather crest is the read), Elmo
(—, correct), Cookie Monster → TOP-20 #3, Bert (—, correct, unibrow is the
joke — a paperclip collection prop is fun/optional low priority), Ernie
(rubber duckie✓ — great), Oscar (sessile, correct no prop), Grover (cape✓ —
correct, no hand prop needed; cheap `animate:'flap'` candidate on the small
cape, headroom 8/10), Count von Count (monocle✓ — correct, cape is
already present and is a cheap `animate:'sway'` win, headroom 2/10),
Rosita (guitar✓ — good, two-piece neck+body), Snuffleupagus (trunk already
`animate:'sway'`✓ — excellent, no action), Zoe (pet rock✓ — good).

**wall-e** — see Sci-Fi franchise section above (cross-listed, `path:
['Sci-Fi','WALL-E']`).

### Pop Culture ▸ Movies franchise packs

**movies-harry-potter**: Harry → TOP-20 #1, Ron → TOP-20 #2, Hermione (book✓
in handL — could ALSO hold a wand in handR since she's equally
wand-associated; medium priority, headroom 3/10), Dumbledore (wand✓), Snape
(—, no wand — medium priority, billowing-cape read is strong on its own,
headroom 5/10), Hagrid (umbrella✓ — his wand is famously hidden inside it,
so this is actually correct/clever, not a gap), Voldemort (wand✓), Draco
(wand✓ — good, 3 of 8 members already have wands, making Harry/Ron's
absence stand out more).

**movies-lotr**: Frodo/Sam/Merry/Pippin — hobbits, **mostly correct** as
unarmed for the early trilogy, though Frodo holding Sting (a small blade)
would be a nice low-priority touch, headroom 4/10. Gandalf (staff✓
twoHanded). Aragorn (sword✓). Legolas (bow✓+quiver). Gimli (axe✓). Gollum
(—, correct, empty grasping hands ARE the character read). Boromir (horn✓ —
correct, could add a sword too but the horn alone is distinctive enough).

**movies-pirates-caribbean**: Jack Sparrow (compass✓ — a stronger choice
than a cutlass, correct), Will Turner (sword✓ back-slung), Elizabeth
(cutlass✓), Barbossa (apple✓ — iconic "not equal" scene prop; low priority
to also add a sword since he's canonically sword-focused too, headroom
1/10 so would need a trim), Davy Jones (crab claw✓+tentacle beard✓ — no
action, creature design carries it), Tia Dalma (—, correct, mystic jewelry
is the read).

**movies-wizard-of-oz**: Dorothy (—, correct, ruby slippers ARE the prop —
a basket for Toto is optional/low priority), Scarecrow (—, correct, straw
detailing is the read), Tin Man (axe✓+oil-can✓), Cowardly Lion (—, correct,
mane+bow read; tail is static, cheap `animate:'sway'` win, headroom 1/10),
Wicked Witch (broom✓), Glinda (wand✓), Toto (pet, correct), The Wizard
(—, correct, top hat + tailcoat generic-showman read is by design).

### Pop Culture ▸ TV Shows franchise packs

These packs already lean heavily on sitcom-realistic, mostly-empty-handed
silhouettes, which is **correct for the genre** — adding action-figure-style
props to Seinfeld/Big Bang Theory/IT Crowd would clash with the source
material's low-key visual language. Only real gaps and standout wins noted:

- **Friends**: Ross (dinosaur bone✓), Monica (whisk✓), Rachel (bag✓), Joey
  (sandwich✓), Phoebe (guitar✓), Chandler (mug✓). **Zero gaps** — every
  member already carries their signature prop.
- **The Office**: Michael (mug✓), Jim (jello-stapler prank✓), Pam
  (sketchbook+pencil✓), Dwight (beet✓), Andy (songbook✓), Angela (cat✓),
  Kevin (chili bowl✓), Creed (guitar pick✓). **Zero gaps.**
- **The Fresh Prince of Bel-Air**: Will (boombox✓), Carlton (tennis
  racket✓), Philip (gavel✓), Vivian (book✓), Hilary (handbag✓), Ashley
  (basketball✓), Geoffrey (serving tray✓). **Zero gaps** — best-covered TV
  pack alongside Friends/The Office.
- **Squid Game**: Gi-hun (betting slip✓), Front Man (—, correct, mask+coat
  is the entire design), Pink Guard (rifle✓), Sae-byeok (shiv✓), Sang-woo
  (marble✓), Il-nam/Han/Ali/Anonymous (—, correct, no props needed — this
  is a low-key thriller cast). **Zero gaps.**
- **I Love Lucy**: Ricky (conga drum✓), Fred (cigar✓), Little Ricky
  (drumsticks✓), Lucy/Ethel (—, correct, comedic gesture-driven characters).
  **Zero gaps.**
- **Game of Thrones**: Jon (Longclaw✓ back-slung), Tyrion (goblet✓), Arya
  (Needle✓), Jaime (golden hand✓ — no sword shown though he's a knight;
  low-medium priority add, headroom 6/10), Ned (greatsword✓ back-slung),
  Daenerys/Cersei/Sansa (—, correct, royal-gown silhouettes carry them).
- **Money Heist**: Moscow (—, no pickaxe despite "veteran digger" job title
  — low-medium priority, headroom 7/10), all others (—, correct — the
  shared jumpsuit+hood silhouette is the entire design language, individual
  props would dilute the uniform-crew read).
- **IT Crowd**: Roy (games console✓), all others (—, correct, deliberately
  understated office-sitcom cast).
- **Seinfeld**: Newman (mailbag✓), Puddy (jacket emblem✓ — correct, no hand
  prop needed), Soup Nazi (—, no ladle — low priority, apron+toque already
  sell "chef," headroom 6/10), all others (—, correct).
- **Breaking Bad, Big Bang Theory**: **zero hand props on ANY member in
  either pack, and that's correct** — near-monochrome show-accurate
  costuming is the entire identity mechanism here (Walt's hat, Jesse's
  beanie, Sheldon's tee, Leonard's glasses); adding items would fight the
  source shows' restrained, prop-light visual style.

---

## Stats

- **Members audited**: ~572 across `core` (1) + 9 `base-*` packs + 53
  franchise packs (`src/avatar-packs/*.ts`, excluding `manifest.ts`).
- **Members with an existing character-iconic hand/carried prop**: roughly
  230–250 (best estimate; every member with a `handL`/`handR`/`hip`-anchored
  weapon, tool, instrument, or held object like a book/mug/cane/staff/bow).
- **Members correctly propless** (animals/pets, quadrupeds, minimalist
  archetypes, and sitcom/thriller casts where empty hands are period- or
  genre-accurate): roughly 200+ — this is a design choice, not a gap, and
  is called out explicitly per-pack above so the implementer doesn't
  "fix" them.
- **Members with a clear missing iconic prop** (the appendix's "gap" rows,
  TOP-20 included): ~55–65, concentrated in: base-careers (magician, cowboy,
  chef, and 4 lower-priority optionals), Harry Potter (2 of 8), Genshin
  Impact (5 of 8), Halo (3 of 8), Power Rangers (6, batchable/low priority),
  Star Wars OT/Mandalorian (3–4), Overwatch (2), Marvel (2), Money Heist
  (1), Game of Thrones (1), Zelda (1), DC Batman (1), Toy Story (1), He-Man
  (1), Sesame Street (1).
- **Members whose existing prop should gain `animate`** (zero new
  primitives, pure motion upgrade): ~20+, dominated by the systemic gaps —
  **capes never use `animate:'sway'` anywhere in the codebase** (~35 cape
  members are all candidates; TOP-20 #11 flags the highest-value one) and
  **wings never use `animate:'flap'`** (Mercy, Buzz, Shrek's Dragon, He-Man
  Sorceress, Goldar, Rainbow Dash's folded wings — TOP-20 #10 flags the
  highest-value one).
- **Packs fully covered with zero gaps found**: Friends, The Office, The
  Fresh Prince of Bel-Air, Squid Game, I Love Lucy, TMNT, League of
  Legends, Minecraft, Pac-Man, Mario, Star Wars Prequels, WALL-E (already
  animate-exemplary), Disney Princess (by design), Street Fighter (by
  design), Animal Crossing, base zoo/farm/domestic animal packs (by design).
- **Packs with the highest-value single fixes**: Harry Potter (2 title
  characters wandless), Genshin Impact (5 of 8 weaponless), base-careers
  (3 of the most classic archetypes — magician/cowboy/chef — all propless).

## Files touched

None — this is a research-only audit. `docs/research/avatar-prop-audit.md`
(this file) is the sole artifact.
