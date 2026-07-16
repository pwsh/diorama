# Base pack: Sci-Fi Archetypes (generic)

**Hierarchy path**: `docs/avatars/base/scifi.md` — a **base group** pack. Base
packs regroup existing built-in `AvatarKind`s alongside new, archetypal
(non-franchise) members. This pack is generic sci-fi genre archetypes only —
franchise characters (Star Wars, Star Trek, Doctor Who, etc.) belong in
separate packs under `docs/avatars/sci-fi/` or `docs/avatars/pop-culture/`,
never here.

## Overview

Seven members: one existing kind (`astronaut`) plus six new archetypes drawn
from generic (non-branded) sci-fi genre conventions — military, pulp/retro,
steampunk-adjacent, outlaw, scientist, and survivalist. Each is built on the
standard humanoid rig (`sk`/`headR`/`headShape`/`limbR`/`skin`/`body`/`shoe`/
`emI`/`hands`/`eyes`/`steel`/`armL`/`legL`/`footMul`/`legColor`) — no
quadrupeds in this pack.

**Shared style/palette**: the pack deliberately does NOT share one literal
uniform — these are six different sci-fi sub-genres (military / pulp / time
travel / piracy / science / wasteland) and forcing one palette would flatten
that variety. Instead the unifying thread is a **technique**, carried over
from the existing `astronaut` kind: every member gets exactly one small
**sensor-tint accent** somewhere on the body (a status light, a glowing vial,
an LED implant, a glowing gun-tip) using `c.accent` (the sensor/person tint
color), so per-sensor color coding survives even on members whose `skin`/
`body` are hard-coded to a genre-specific hex rather than `'tint'`. Base
material tones lean desaturated/utilitarian (steel greys, olive drab, dusty
tan, brass, dark leather) so the toon saturation push doesn't turn them
cartoonish-bright — bright color is reserved for the one accent light per
character.

**Shared technique — occlusion accessories**: two members (space-pirate,
wasteland-wanderer) cover one or both eyes with a face-anchored accessory
mesh positioned slightly proud of (closer to camera than) the eye sockets,
so it depth-occludes the base `eyes: 'dots'` render rather than requiring a
new `eyes` style. This reuses the existing accessory system with zero rig
changes — see each member's Accessories list and "Rig gaps" for when a
dedicated eye style would be worth adding instead.

## Members

### 1. `astronaut` — Astronaut (existing kind)

**Existing kind: astronaut — do not respec.** Already built in
`_buildHumanoid`/`AVATAR_SPECS`: white suit, translucent bubble helmet
(`opacity 0.22`, `outlineSkip`), grey chest control panel with a sensor-tint
status lamp, backpack, moon-bounce personality. Current spec (reference
only):

```
sk: 1, headR: 118, headShape: 'sphere', limbR: 1.1,
skin: 0xffffff, body: 0xffffff, shoe: 0xffffff,
emI: 0.15, hands: 'sphere', eyes: 'dots', steel: false
personality: { bobMul: 1.5, cadenceMul: 0.75 }   // moon-bounce
bubbles: ['🚀', '⭐']
```

**Proposed refinement (optional, not required)**: none needed for silhouette
— it already reads clearly. If revisited, an optional NASA-style chest patch
(small flat box, `chest` anchor, in `c.accent`) would echo this pack's
accent-light convention a little more explicitly, but the existing tint lamp
already covers that job.

---

### 2. `space-marine` — Space Marine (heavy trooper)

**Reference**: the generic armored sci-fi infantry archetype — bulky powered
armor, broad pauldrons, an enclosed HUD-visor helmet, chunky gauntlets and
boots. A synthesis of common conventions (Warhammer 40k Space Marines,
Halo-style Spartans) kept deliberately unbranded/archetypal, not a specific
character.

**Spec**:
```
sk: 1.05, headR: 122, headShape: 'sphere', limbR: 1.3,
skin: 0x565a3d,   // olive-drab armor plating (reads as "skin" — head is a full helmet)
body: 0x4a4e57,   // gunmetal torso plate
shoe: 0x2a2c30,   // dark armored boots
emI: 0.15, hands: 'box', eyes: 'visor', steel: true,
armL: 1.0, legL: 1.0
```

**Accessories**:
- Pauldrons (×2): box, `chest` anchor offset `x = ±TORSO_W·0.62`, `y = shoulderY + 40mm`, ~170×110×140 mm, `0x565a3d` (skin tone) with a thin darker trim box overlay (`0x33363c`). *No dedicated shoulder anchor exists — see Rig gaps.*
- Chest plate emblem: box, `chest` anchor centered, ~90×60×20 mm, `0x33363c`, with a 20 mm sensor-tint accent sphere (`c.accent`) — the pack's accent-light convention.
- Backpack/power unit: box, `back` anchor, `TORSO_W·0.9 × TORSO_H·0.7 × TORSO_D·0.7`, `0x4a4e57`, plus two small emissive vent cylinders (`c.accent`, low intensity).
- Chin guard: box, `face` anchor, small, `0x2a2c30`, sitting just under the visor band.
- Utility belt: box, `hip` anchor, `0x33363c`.

**Silhouette check**: the two wide pauldron blocks are the single cue —
they widen the shoulder line beyond any other member in this pack and read
as "armored soldier" even at 30 px. The enclosed cyan HUD visor (`eyes:
'visor'`) reinforces it up close.

**Personality**: `{ bobMul: 0.8, swayMul: 0.6, cadenceMul: 0.85, ampMul: 1.1 }` — heavy, deliberate march, wide steps, minimal bounce.
**Bubbles**: `🛡️ 💥 🎯 📡`

---

### 3. `retro-spaceman` — Retro Spaceman (raygun gothic)

**Reference**: 1950s "raygun gothic" pulp sci-fi spaceman — chrome/silver
flight suit, a round fishbowl helmet (often with a central fin), black
rubber gloves and boots, chunky raygun prop. Generic pulp-adventure
archetype, not a specific licensed character.

**Spec**:
```
sk: 1, headR: 124, headShape: 'sphere', limbR: 1.0,
skin: 0xc8ccd2,   // chrome/silver flight suit (covers head/arms/hands)
body: 0xc8ccd2,
shoe: 0x1a1a1f,   // black rubber boots
emI: 0.12, hands: 'sphere', eyes: 'dots', steel: false
```

**Accessories**:
- Fishbowl helmet: sphere, `crown` anchor (enclosing the whole head, same technique as `astronaut`'s bubble), `~1.3×headR`, translucent light-blue `0xbfd8e8` at `opacity 0.22`, `outlineSkip: true`.
- Helmet fin: thin flattened cone/box, `crown` anchor, running fore-aft along the helmet's top ridge, `0xd8dce2` (chrome).
- Antenna: thin cylinder, `crown` anchor, near the fin base, dark tip.
- Chest control box: box, `chest` anchor, chrome `0xd8dce2`, with a small sensor-tint accent light (`c.accent`).
- Raygun prop: cylinder barrel + small box grip, `hand` anchor, chrome body with a `c.accent` glowing tip.

**Silhouette check**: the big clear bubble helmet with a fin breaks the head
silhouette into an unmistakable dome-plus-blade shape found nowhere else in
this pack — recognizable even before the raygun registers.

**Personality**: `{ bobMul: 1.2, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.1 }` — bouncy pulp-adventure energy, distinct from the astronaut's slow moon-bounce.
**Bubbles**: `🚀 👽 ⚡ 🛸`

---

### 4. `time-traveler` — Time Traveler (steampunk chrononaut)

**Reference**: the sci-fi/steampunk time-travel adventurer archetype — long
dark coat with tails, a top hat, brass goggles, a pocket chronometer.
Generic vintage-tech-adventurer look, not tied to any one character.

**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1.0,
skin: 'tint',     // visible face — normal sensor-tint skin
body: 0x3a2a1e,   // dark brown long coat
shoe: 0x1a1512,   // dark brown boots
emI: 0.2, hands: 'sphere', eyes: 'dots', steel: false
```

**Accessories**:
- Top hat: short wide brim disc + tall cylinder, `crown` anchor, `0x1c1712` (black felt), with a thin brass band box (`0xb08d57`).
- Goggles: two small flattened cylinders with brass rims, `crown` anchor (perched up on the hat brim/forehead rather than over the eyes, so the base `dots` eyes stay visible), amber-tinted lenses.
- Pocket watch chain: thin arc box across the torso front + a small brass sphere ("watch") hanging at center, `chest` anchor, `0xb08d57`.
- Coat tails: box, `back` anchor, `TORSO_W·1.15` wide, hanging from hip level down past the knee, `0x3a2a1e` (same as body) — same technique as `wise_oracle`'s robe skirt, but back-only so it doesn't block the front chevron.
- Belt + buckle: box, `hip` anchor, dark leather with a small brass buckle box.

**Silhouette check**: the tall black top hat plus the flared coat-tail
hanging past the hips is the unmistakable outline — a profile no other
member in this pack shares, readable before the goggles or watch chain
register.

**Personality**: `{ bobMul: 0.9, swayMul: 0.85, cadenceMul: 0.95, ampMul: 0.9 }` — a measured, slightly formal/stiff stride.
**Bubbles**: `⏳ 🕰️ ⚡ 📜`

---

### 5. `space-pirate` — Space Pirate (cybernetic raider)

**Reference**: a sci-fi outlaw archetype blending classic pirate iconography
(eyepatch, swagger, bandolier) with salvaged/cybernetic gear — a chrome ear
implant, a holstered blaster, weathered leather-and-plate jacket. Generic
"space rogue" archetype.

**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1.0,
skin: 'tint',
body: 0x3d3630,   // weathered leather/salvage-plate jacket
shoe: 0x201c18,
emI: 0.2, hands: 'sphere', eyes: 'dots', steel: false
```
Base uses standard `eyes: 'dots'` — the eyepatch below occludes one eye via
geometry, not via a special eye style (see Overview's occlusion technique).

**Accessories**:
- Eyepatch: small flat box, `face` anchor over one eye socket, positioned slightly proud (nearer -Z / camera) so it depth-occludes the eye dot beneath it, near-black `0x14120f`, plus a thin strap box running back toward the ear.
- Cybernetic ear implant: small box/cylinder, `head` anchor on the OPPOSITE side from the patch, chrome `0xd8dce2`, with a tiny `c.accent` LED sphere — the "space" tell that keeps this from reading as a plain pirate.
- Holstered blaster: box + cylinder, `hip` anchor, dark gunmetal `0x33363c` with a small `c.accent` glow at the muzzle tip.
- Bandolier: thin diagonal box across the torso front, `chest` anchor, dark leather with 2–3 small brass stud spheres (`0xb08d57`).
- Bandana/skullcap: flattened sphere segment, `crown` anchor (same downward-bowl + tilt-back technique as the hacker hood — must clear the eye band), faded maroon `0x6e2430`, small knot nub at the back.

**Silhouette check**: the single opaque eyepatch breaking the otherwise
symmetric dot-eyes, paired with the diagonal bandolier strap, reads as
"pirate" at a glance; the chrome ear implant is the secondary read that
places it in space rather than the high seas.

**Rig gap** (see below): a fully asymmetric chrome cybernetic arm or leg — a
common trope for this archetype — can't be expressed with the current spec
(only a single `legColor` covering BOTH legs, no per-limb/per-side
override). Documented rather than faked.

**Personality**: `{ bobMul: 1.0, swayMul: 1.3, cadenceMul: 0.95, ampMul: 1.15 }` — rolling swagger.
**Bubbles**: `🏴‍☠️ 💰 🔫 🌌`

---

### 6. `mad-scientist` — Mad Scientist (rogue inventor)

**Reference**: the eccentric sci-fi inventor archetype — white lab coat,
wild asymmetric hair, oversized amber goggles, a glowing hand-held
experiment. Generic "rogue genius," not a specific character.

**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1.0,
skin: 'tint',
body: 0xe8e8e4,   // white lab coat (reuses the wise_oracle beard tone for palette consistency)
shoe: 0x2a2a2e,
emI: 0.2, hands: 'sphere', eyes: 'dots', steel: false
```

**Accessories**:
- Wild hair: 3–4 irregular small spheres/boxes at deliberately UNEVEN offsets around the head's top/sides, `crown`+`head` anchors, pale grey-white `0xd8d4c8` — the asymmetry itself is the point (breaks from every other member's tidy dome-hair technique).
- Goggles: two flattened spheres directly over the eyes, `face` anchor, amber-tinted translucent lenses (`0xd8a030`, low opacity) with a brass rim (`0xb08d57`) — larger/chunkier than the `movie_star` shades style.
- Lab coat buttons/lapels: thin vertical box column + 2–3 small dark button spheres, `chest` anchor.
- Glowing vial prop: small cylinder + sphere, `hand` anchor, pale glass-cyan body (`0xcfe8ea`, low opacity) with a `c.accent` glowing liquid sphere inside — the pack's accent-light convention, doubling as the character's signature prop.
- Coat hem: short box, `back`/`hip` anchor, ending ~mid-thigh (shorter than the time-traveler's coat tails), `0xe8e8e4`.

**Silhouette check**: the asymmetric frizzy hair clumps breaking the head's
otherwise-round silhouette, combined with oversized amber goggles, is the
single tell that pushes this past "generic professional" into "mad
scientist" — the white coat alone wouldn't be enough.

**Personality**: `{ bobMul: 1.3, swayMul: 1.1, cadenceMul: 1.2, ampMul: 1.2 }` — jittery, energetic pace.
**Bubbles**: `🧪 ⚗️ 💡 ⚡`

---

### 7. `wasteland-wanderer` — Wasteland Wanderer (post-apocalyptic scavenger)

**Reference**: the post-apocalyptic survivor archetype — patchwork
salvaged clothing in desaturated tones, a gas mask/respirator hiding the
face, a rolled bedroll or scrap pack, makeshift gear. Generic wasteland
survivor, not tied to any specific franchise.

**Spec**:
```
sk: 1, headR: 126, headShape: 'sphere', limbR: 1.05,
skin: 'tint',     // hands only — face is fully covered by the mask accessory
body: 0x6b6350,   // dusty tan-olive patched wrap
shoe: 0x3a342a,
emI: 0.12, hands: 'box', eyes: 'dots', steel: false
```
Base uses `eyes: 'dots'`; the gas-mask accessory below covers BOTH eyes via
depth occlusion (see Overview's occlusion technique) rather than a new eye
style.

**Accessories**:
- Gas mask: box/cylinder muzzle covering the lower face + two round lens discs positioned directly over both eyes (occluding the base dots), `face` anchor, dark rubber-black `0x1c1c1a` with a scuffed grey rim; a small filter canister cylinder on one cheek.
- Mismatched ear wrap: small irregular box, `head` anchor, one side only (asymmetric), rust `0x8a5a3a` — sells the "scavenged, nothing matches" read.
- Patchwork panel: 2–3 small overlapping rectangles in different desaturated tones (rust `0x8a5a3a`, dust-tan `0xb8ab8a`, faded olive `0x565a3d`), `chest` anchor, layered like sewn-on patches.
- Bedroll/scrap pack: cylinder (rolled fabric) + box (pack body), `back` anchor, dust-tan `0xb8ab8a` with dark strap boxes.
- Canteen/pouch cluster: small box + cylinder, `hip` anchor, worn leather tone `0x3a342a`.
- Scrap-metal strap: thin flattened box wrapping the head, `crown` anchor, gunmetal `0x4a4e57`, continuing the mask's strap line.

**Silhouette check**: the boxy gas-mask muzzle replacing the entire face
(no visible dots/nose/mouth at all — a first in this pack) plus the lumpy
layered patchwork torso reads instantly as "wasteland survivor," distinct
from every clean-suited member here.

**Personality**: `{ bobMul: 0.85, swayMul: 1.0, cadenceMul: 0.85, ampMul: 0.9 }` — a weary, careful trudge.
**Bubbles**: `☢️ 🔧 🥫 🌪️`

## Rig gaps

1. **No per-limb (single arm/leg) color or material override.** The current
   `HumanoidSpec` exposes one `legColor` that recolors BOTH legs uniformly,
   and no arm equivalent at all. `space-pirate`'s classic "one chrome
   cybernetic limb" trope can't be built without extending the spec — e.g.
   something like `limbOverride?: { slot: 'armL'|'armR'|'legL'|'legR'; color: number; steel?: boolean }[]`.
   Flagged rather than faked with a same-color-both-sides workaround.
2. **No dedicated shoulder anchor.** Pauldrons/epaulettes (`space-marine`)
   are approximated here as wide-offset `chest` anchor accessories (manually
   positioning two boxes at `±TORSO_W·0.62`). It works, but a true `shoulder`
   anchor (auto-mirrored L/R, pinned to the shoulder pivot instead of a
   chest offset) would reduce repetition across this and future
   military/armor archetypes.
3. **No dedicated occlusion/mask eye style.** The eyepatch (`space-pirate`)
   and gas mask (`wasteland-wanderer`) both cover the base `dots` eyes by
   placing an opaque `face`-anchor accessory slightly proud of the eye
   sockets so it wins the depth test — this works today with zero rig
   changes, but if this pattern recurs often in future packs, a first-class
   `eyes: 'patch'` (one eye) or `eyes: 'masked'` (both eyes, no dots drawn
   at all) style would be cleaner than relying on occlusion geometry lining
   up exactly right.

## Sources

- [2StoryProps: Retro Spacemen (For the Budget Cosplayer!)](http://2storyprops.blogspot.com/2014/09/retro-spacemen-for-budget-cosplayer.html)
- [Raygun Gothic — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/RaygunGothic)
- [Flight-Tested Space Helmets You can Make Yourself](https://www.toyraygun.com/spacehelmets.html)
- [Space Marine Chapter Pad Color Schemes — Bolter and Chainsword](https://bolterandchainsword.com/topic/349364-space-marine-chapter-pad-color-schemes/)
- [Modular Sci-Fi Shoulder Pads — Printable Futuristic Armor](https://cults3d.com/en/3d-model/various/modular-sci-fi-shoulder-pads-printable-futuristic-armor)
- [Post-apocalyptic Costume & Outfit: Apocalyptic Costuming 101](https://postapocevents.com/post-apocalyptic-costumes-101/)
- [Zone Stalker Gas Mask for Post-Apocalyptic Cosplay](https://cults3d.com/en/3d-model/fashion/zone-stalker-gas-mask-for-post-apocalyptic-cosplay)
- [Steampunk Time Traveler Goggles Top Hat, Novelty Costume — Amazon listing](https://www.amazon.com/Attitude-Studio-Steampunk-Traveler-Costume-Silver/dp/B07WRPCHT5)
- [Men's Steampunk Time Traveler Outfit — 4-Piece Bundle](https://www.medievalcollectibles.com/product/time-traveler-mens-steampunk-outfit/)
- [Space Pirates — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/SpacePirates)
- [Cyborg eye patch — Divamp](https://divamp.com/products/cyborg-eye-patch-designed-by-divamp-futuristic-goggles-sci-fi-cyber-eyewear-mask-goggles)
- In-repo: `src/three-renderer.ts` (`AVATAR_SPECS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`, `_buildHumanoid` accessory switch, `astronaut`/`wise_oracle`/`hacker` cases used as technique precedent for the helmet bubble, robe-skirt, and hood-tilt tricks reused above).
