# Avatar pack: Robotic (base group)

## Overview

- **Hierarchy path**: `base / robotic`
- **Group**: mechanical / synthetic avatar kinds — the household's robots, cyborgs,
  and clockwork oddities. All members are **humanoid rig** (bipedal); no
  quadruped robots in this pack.
- **Shared style**: Sims-toon (`MeshToonMaterial`, 4-step gradient band, dark
  cartoon outline shells, oversized head/hands, green plumbob). Robotic members
  lean on the rig's `steel` flag (brushed-metal `metalness`/`roughness` bump on
  the skin material) and higher `emI` (emissive) than organic kinds — toon
  shading reads accent lights/visors/seams as flat glowing bands, which is
  exactly the "glowing eye/seam" language this whole group wants.
- **Shared palette convention**: each member keeps one **sensor-tint accent**
  (`c.accent` in the renderer — an antenna tip, chest stripe, visor glow, seam
  light, or similar) so per-sensor color coding survives even on an otherwise
  fixed-color metal body. This mirrors the existing `robot` kind's tint chest
  stripe — every new member below follows the same convention rather than
  inventing a new one.
- **No pack-wide chibi/uniform base** — unlike a squad pack, these are meant to
  read as visually distinct machines; only the accent-tint convention and the
  toon/outline/plumbob shell are shared.

## Members

### 1. `robot` — existing kind (do not respec)

- **id**: `robot` · **label**: Household Robot
- **Reference**: the pack's generic default robot — grey boxy head, visor eyes,
  brushed-steel body, antenna, sensor-tint chest stripe. Genre-generic "helper
  robot," not a specific IP character.
- **Current spec** (from `three-renderer.ts` `HUMANOID_SPECS`):
```
robot: { sk: 1, headR: 128, headShape: 'box', limbR: 1, skin: GREY, body: GREY,
         shoe: 0x33363c, emI: 0.10, hands: 'box', eyes: 'visor', steel: true }
```
- **Current accessories**: crown antenna (dark stalk + tint-colored ball tip),
  chest tint accent stripe (`TORSO_W*0.9 × TORSO_H*0.18`).
- **Proposed refinement (optional, not applied)**: `emI` reads a little flat at
  0.10 next to the newer members below (sleek-android/security-bot both sit at
  0.20+); bumping to ~0.15–0.18 would make the visor/stripe pop consistently
  across the regrouped set. Cosmetic only — leave as-is unless the pack is
  regenerated wholesale.

### 2. `cyborg` — existing kind (do not respec)

- **id**: `cyborg` · **label**: Cyborg (steel arm)
- **Reference**: half-human/half-machine — adult sensor-tint skin/body, steel
  right arm + right leg, steel head half-plate, single red implant eye
  (`halfred`). Generic sci-fi cyborg archetype.
- **Current spec**:
```
cyborg: { sk: 1, headR: 126, headShape: 'sphere', limbR: 1, skin: color, body: color,
          shoe: 0x1a1a1f, emI: 0.25, hands: 'sphere', eyes: 'halfred', steel: false }
```
  (note: `steel: false` at the top-level spec — the steel *look* is applied via
  a dedicated steel `THREE.Material` on the +x arm/leg/head-plate meshes inside
  the kind-specific accessory branch, not via the generic `steel` flag.)
- **Current accessories**: steel head half-plate (`HEAD_R*1.06` half-sphere,
  +x side), small sensor-tint chest panel.
- **Proposed refinement**: none — this member reads clearly and is already
  distinct from `robot` (organic torso vs. all-metal) and `ninja_cyborg`
  (bright halfred visor vs. matte redvisor). Leave as-is.

### 3. `ninja_cyborg` — existing kind (do not respec)

- **id**: `ninja_cyborg` · **label**: Cyborg Ninja
- **Reference**: matte-black stealth cyborg — full-matte skin/body (no metal
  sheen, no emissive glow beyond the visor), red visor eyes, katana slung
  across the back. Distinct from plain `ninja` (which has a full hood + waist
  sash and no visor).
- **Current spec**:
```
ninja_cyborg: { sk: 1, headR: 120, headShape: 'sphere', limbR: 1, skin: MATTE, body: MATTE,
                shoe: 0x0a0a0c, emI: 0.05, hands: 'sphere', eyes: 'redvisor', steel: false }
```
- **Current accessories**: shared katana-on-back group (with `ninja`), no hood
  (that's `ninja`-only), no sash (`ninja`-only).
- **Proposed refinement**: none needed for readability. If the pack ever wants
  a "combat cyborg" distinct from a "stealth cyborg," this is already that —
  no change recommended.

### 4. `retro-tin-bot` — new

- **id**: `retro-tin-bot` · **label**: Tin Wind-Up Bot
- **Reference**: 1950s–60s Japanese/American "tin toy" robots (e.g. the boxy
  yellow *Robot Lilliput* lineage, and the wind-up space-toy robots collected
  under names like *Machine Man*) — stamped-tin boxy body, painted panel chest
  covered in dials/gauges/rivets, a coil-spring antenna on the crown, and a
  flat lit visor band. Bright period paint (reds/silvers), not a modern matte
  finish.
- **Spec**:
```
retro-tin-bot: { sk: 1, headR: 128, headShape: 'box', limbR: 1.15,
                 skin: 0xaeb4bb, body: 0xaeb4bb, shoe: 0x8a2e22,
                 emI: 0.15, hands: 'box', eyes: 'visor', steel: true,
                 legColor: 0x8a2e22 }
```
  (`legColor` gives it dark rust-red "boot plate" legs against the silver
  torso/head — a common two-tone tin-toy paint split; `shoe` matches so the
  foot reads as one continuous painted boot.)
- **Accessories**:
  - **crown** — coil-spring antenna: thin cylinder stalk (`9×9×130 sk` mm,
    chrome `0xd8dadd`) + small ball tip in the sensor-tint accent color,
    emissive ~0.2 — direct reuse of the existing `robot` antenna primitive,
    just chrome instead of dark.
  - **chest** — two flat cylinder "dial" discs (`~70 mm` radius, white face
    `0xf2f0e6` + a thin red needle box) side by side across the upper chest,
    plus one larger recessed "gauge" disc (`~90 mm`, dark bezel `0x2a2a2e`)
    lower-center — the classic dial-and-gauge tin-toy chest panel.
  - **chest** (additional) — 4 small rivet spheres (`~10 mm`, dark grey
    `0x55585d`) at the panel corners.
  - **hip** — a riveted waist seam band (thin box, chrome) suggesting the
    stamped-tin panel line where the torso shell meets the leg shell.
- **Silhouette check**: the boxy silver head/torso + bright dial-and-gauge
  chest panel + chrome coil antenna reads instantly at 30 px — this is fully
  achievable with the current rig (box head, `visor` eyes, accessory chest
  discs). The one thing the real toys have that this rig can't cheaply do is
  the **segmented accordion-tube arm/leg joints** (see Rig gaps) — not needed
  for silhouette recognition, just a nice-to-have.
- **Personality**: `{ cadenceMul: 0.85, bobMul: 1.3, swayMul: 0.4, ampMul: 0.9 }`
  — stiff, slightly jerky wind-up gait: quick little bobs, almost no lateral
  sway (rigid stamped-tin body doesn't swing loosely).
- **Bubbles**: `⚙️` `🔔` `📻` `🔧`

### 5. `sleek-android` — new

- **id**: `sleek-android` · **label**: Sleek Android
- **Reference**: the generic modern sci-fi "synthetic" archetype — glossy
  pearl-white shell, slender elegant proportions, a single glowing cyan visor
  band across the eyes, and thin glowing seam-lines at the joints/sternum
  (a widely-used design language across recent sci-fi androids and real
  concept-android renders — smooth curves, no visible screws/rivets, cool-tone
  accent light rather than a chest stripe).
- **Spec**:
```
sleek-android: { sk: 1.02, headR: 122, headShape: 'sphere', limbR: 0.85,
                 skin: 0xf2f4f6, body: 0xf2f4f6, shoe: 0xe5e8ea,
                 emI: 0.30, hands: 'sphere', eyes: 'visor', steel: true }
```
  (slender `limbR 0.85` + slightly elongated `sk 1.02` for the "elegant, not
  bulky" read; pearl-white skin/body/shoe keep it a single continuous glossy
  shell rather than tin-bot's two-tone paint job.)
- **Accessories**:
  - **face** — thin cyan glowing band overlaying the visor line (flat box,
    emissive `0x4fd8ff` @ ~0.6) — reinforces the `visor` eye style with a
    brighter, cooler glow than the stock robot amber/white.
  - **chest** — a thin vertical seam-light strip down the sternum (tall thin
    box, emissive cyan, low-profile — proud of the torso face by ~6 mm to
    dodge the coincident-face gotcha).
  - **back** — a small nape-of-neck status node (tiny sphere, emissive cyan)
    reading as a power/status indicator.
- **Silhouette check**: the single cyan visor glow + cyan seam light against
  an all-white glossy shell is the one signature — recognizable even with the
  limbs in shadow. Fully achievable with existing `visor` eyes + emissive
  accessory primitives; no rig gap.
- **Personality**: `{ swayMul: 0.5, bobMul: 0.7, cadenceMul: 1.0, ampMul: 0.85 }`
  — smooth, minimal-effort glide; low bob/sway reads as an efficient,
  friction-free stride rather than a stomping machine.
- **Bubbles**: `💠` `🔷` `✨` `💫`

### 6. `drone-carrier-bot` — new

- **id**: `drone-carrier-bot` · **label**: Drone Carrier Bot
- **Reference**: a generic sci-fi "support/deployer" bot archetype — a
  broad-shouldered, boxy-headed chassis whose distinguishing feature is a
  back-mounted docking rack carrying a couple of small hover-drone orbs, plus
  a horizontal scanning visor. Not any specific licensed droid — a genre
  composite of "worker/carrier robot" designs seen across sci-fi media and
  robotics concept art (broad utility chassis + a visible payload rack).
- **Spec**:
```
drone-carrier-bot: { sk: 1.05, headR: 118, headShape: 'box', limbR: 1.2,
                     skin: 0x4a4f57, body: 0x3a3e44, shoe: 0x22242a,
                     emI: 0.20, hands: 'box', eyes: 'redvisor', steel: true }
```
  (bulkier `sk 1.05` + `limbR 1.2` for a broad-shouldered carrier build; smaller
  `headR 118` relative to the wide shoulders reads as "all torso, small head.")
- **Accessories**:
  - **back** — a flat docking-rack plate spanning the upper back (wide thin
    box, gunmetal `0x50545c`), with **two small mini-drone assemblies**
    perched above the shoulder line: each a small sphere body (sensor-tint
    accent color, emissive ~0.3) on a short cylinder mount, with two tiny
    crossed box "rotor" nubs — a simplified static quadcopter read.
  - **chest** — a thin horizontal status-light strip (box, emissive accent,
    low profile).
  - **crown** — a small rotating-sensor dome (short cone, dark chrome) above
    the head, suggesting a radar/scanner unit distinct from the antenna
    language used by `robot`/`retro-tin-bot`.
- **Silhouette check**: the broad dark chassis with **two glowing mini-drone
  orbs riding above the shoulders** on the back rack is the one signature
  element — reads clearly even in silhouette since the orbs sit above the
  shoulder line, clear of the body outline. Achievable with the `back` anchor
  supporting multiple stacked primitives; the drones are **static-mounted**,
  not independently hovering (see Rig gaps).
- **Personality**: `{ bobMul: 1.1, cadenceMul: 0.8, swayMul: 0.9, ampMul: 1.0 }`
  — heavier, slower-cadence gait befitting the bulked-up carrier frame.
- **Bubbles**: `🛰️` `📡` `🚁` `🔋`

### 7. `steampunk-automaton` — new

- **id**: `steampunk-automaton` · **label**: Steampunk Automaton
- **Reference**: the Victorian clockwork-automaton archetype — a brass/bronze
  humanoid body with visible mechanism, an exposed glowing gear or furnace
  panel at the chest, riveted brass plating, and a stovepipe/gear-topped hat.
  Genre convention (not a specific licensed character): brass (`~0xb08d57`)
  and aged bronze, oxidized-patina accents, visible-mechanism chest panel,
  Victorian industrial silhouette.
- **Spec**:
```
steampunk-automaton: { sk: 1, headR: 126, headShape: 'sphere', limbR: 1,
                       skin: 0xb08d57, body: 0x8a6b3e, shoe: 0x4a3a22,
                       emI: 0.10, hands: 'sphere', eyes: 'visor', steel: true }
```
  (note: `steel` here repurposes the metal-look flag for a **brass** finish —
  the material stays metallic/brushed, just tinted brass instead of grey;
  `body` a shade darker aged-bronze than the brass `skin` so the torso reads
  as a separate, older plate.)
- **Accessories**:
  - **chest** — one large exposed "clockwork" gear: a flat wide cylinder disc
    (`~140 mm` radius, thin, brass `0xc9a45c`) proud of the torso front, with
    a small warm-amber emissive core sphere behind it (suggesting an inner
    furnace/mainspring glow through the gear). *(Simplification: no true
    gear-tooth geometry exists in the primitive set — see Rig gaps.)*
  - **crown** — a short brass-cylinder "stovepipe hat" with a wide flat brim
    (flat cylinder disc), raised and tilted back (`rotation.x`) so the brim
    rides above the brow, matching the existing hacker-hood/supermodel-hair
    clearance convention.
  - **back** — a thin exhaust pipe (small cylinder) with a static pale-grey
    low-opacity "steam puff" sphere at its tip (documented flat-material /
    transparency exemption, like the weather particle sprites).
  - **hip** — a gear-buckle belt: thin box band + one small brass disc buckle.
- **Silhouette check**: the round brass head + wide stovepipe-hat brim + one
  large glowing exposed chest gear against a darker bronze torso is the
  signature — recognizable at 30 px from the hat brim + chest glow alone.
  Achievable with current primitives modulo the gear-tooth detail (cosmetic
  only — a plain glowing disc reads fine as "exposed clockwork" at this
  scale). The single asymmetric "monocle" lens some automaton depictions use
  is NOT achievable with current symmetric eye styles — used `visor` as the
  nearest stand-in (see Rig gaps).
- **Personality**: `{ cadenceMul: 0.75, bobMul: 1.2, swayMul: 0.7, ampMul: 0.9 }`
  — slow, clunky clockwork stride with a pronounced mechanical bob.
- **Bubbles**: `⚙️` `🕰️` `💨` `🔧`

### 8. `security-bot` — new

- **id**: `security-bot` · **label**: Security Bot
- **Reference**: a generic corporate/patrol security-droid archetype — matte
  dark chassis, bold warning-red diagonal chest/shoulder livery, a boxy
  helmet-like head with a horizontal scanning red visor, and a chest-mounted
  badge/lens. Composite of real patrol-robot conventions (multi-camera /
  scanner head units) and the common "red accent on black armor" security-droid
  design language used broadly across sci-fi — not a specific licensed droid.
- **Spec**:
```
security-bot: { sk: 1, headR: 130, headShape: 'box', limbR: 1.1,
                skin: 0x2b2e33, body: 0x1c1e22, shoe: 0x111214,
                emI: 0.20, hands: 'box', eyes: 'redvisor', steel: true }
```
- **Accessories**:
  - **chest** — a bold diagonal red stripe (thin wide box, rotated `rotation.z`
    ~0.4 rad, bright warning red `0xd21f1f`, low emissive) crossing the torso
    corner-to-corner — the primary warning-livery cue.
  - **chest** (additional) — a small chrome-rimmed badge/camera lens (flat
    disc, chrome rim `0xc7cbd0` + dark lens center `0x0a0a0c`) centered above
    the stripe.
  - **crown** — a small beacon dome (sphere, bright red, emissive ~0.5) —
    intended as a "warning light," though true blink/pulse animation isn't
    available generically (see Rig gaps; renders as a steady glow for now).
  - **head** (sides) — two short antenna/sensor stubs flanking the helmet,
    dark chrome.
  - **hip** — a holstered baton prop (thin cylinder) at the side.
- **Silhouette check**: the matte-black chassis with one **bold red diagonal
  stripe** crossing the chest, topped by the red visor bar, is the single
  recognizable cue — reads instantly even without the smaller badge/antenna
  details. Fully achievable with current primitives; no blocking rig gap
  (the beacon-pulse animation is a nice-to-have, not required for silhouette).
- **Personality**: `{ cadenceMul: 1.15, ampMul: 1.05, bobMul: 0.9, swayMul: 0.5 }`
  — brisk, purposeful patrol gait; minimal sway, slightly longer stride.
- **Bubbles**: `🚨` `👁️` `🔒` `📛`

## Rig gaps

1. **No gear-tooth ornament primitive.** `steampunk-automaton`'s signature
   exposed chest gear is approximated with a plain flat disc — a genuinely
   toothed-gear primitive (or a cheap radial-notch box array) would sell the
   clockwork read much better without hand-building N boxes per gear.
2. **No asymmetric single-lens ("monocle") eye style.** All current eye
   styles (`dots/visor/almond/redvisor/shades/slit/halfred`) are left-right
   symmetric. `steampunk-automaton` (and potentially future "mad inventor" /
   pirate-style characters) want one lens over one eye, bare on the other
   side. Nearest current stand-in used: `visor` (full symmetric band).
3. **No generalized pulsing/blinking-emissive hook.** Per-frame emissive
   animation currently exists only as a hardcoded special case (the fireplace
   flicker forces a rebuild every frame via `Math.random()`). `security-bot`'s
   warning beacon and `drone-carrier-bot`'s mini-drone status lights both want
   a lightweight, reusable "pulse this material's emissiveIntensity on a sine/
   random schedule" utility instead of one-off special-casing per kind.
4. **No independent secondary-prop motion.** `drone-carrier-bot`'s mounted
   mini-drones are static geometry riding the rig's back anchor — there's no
   mechanism for a small attached prop to hover/bob/orbit independently of the
   parent rig's walk cycle. Would need a tiny secondary animation channel
   (a few sine terms keyed off the humanoid's own clock, similar to the
   plumbob spin) if independently-animated attached props are wanted later.
5. **No dedicated shoulder/limb-band accessory anchor.** The accessory anchor
   set is `crown / head / face / chest / back / hip / hand` — there's no
   anchor for a band wrapped around an upper arm or leg segment.
   `retro-tin-bot`'s accordion-tube joint rings (a period-authentic tin-toy
   detail) can't be placed this way; not blocking (the boxy body + chest
   dials + antenna already carry the silhouette), but worth having for a
   future pack that leans on joint detailing more.

## Sources

- [18 Retro Robots from Back When They Looked Like Tin — Cracked.com](https://trivia.cracked.com/image-pictofact-21169-18-retro-robots-from-back-when-they-looked-like-tin)
- [Vintage Tin Robots — Etsy](https://www.etsy.com/market/vintage_tin_robots)
- [Vintage Tin Toy and Robot Museum](https://www.tin-robot.com/)
- [Robby the Robot, and toy and model robots, 1950s and 60s — Carters price guide](https://www.carters.com.au/index.cfm/index/3794-robots-toys-and-models/)
- [Steampunk Automaton Busker in Clockwork City — Nightcafe](https://creator.nightcafe.studio/creation/ltT5zZWlKqM9rlRQiXC6/a-steampunk-automaton-busker-crafted-from-polished-brass-and-copper-serenades-passersby-in-a-bustlin)
- [Victorian Steampunk Automaton — DeviantArt](https://www.deviantart.com/inkimagine/art/Victorian-Steampunk-Automaton-1056599519)
- [The Rise of Industrial Design and Steampunk Culture in Metal Rotating Gear Clocks — DesignMyTime](https://designmytime.com/blog/the-rise-of-industrial-design-and-steampunk-culture-in-metal-rotating-gear-clocks/)
- [Sleek Robot Design — Pinterest](https://www.pinterest.com/ideas/sleek-robot-design/924863672321/)
- [Futuristic Android Art: Sleek Mecha Robot — Dreamstime](https://www.dreamstime.com/futuristic-android-art-sleek-mecha-robot-contemplation-mecha-android-futuristic-robotic-figure-stands-proudly-against-image360044592)
- [Sleek Android Toy — Streamlined Sci-Fi Robot — Cults3D](https://cults3d.com/en/3d-model/various/sleek-android-toy-streamlined-sci-fi-robot-for-3d-printing)
- [Robots in Law Enforcement — SuperDroid Robots](https://www.superdroidrobots.com/tactical-robots/surveillance-and-patrol-robots)
- [Surveillance and Patrol Robots — SuperDroid Robots](https://www.superdroidrobots.com/sdr-tactical/Applications/Surveillance_Patrol.php)
- [OOM-series security droid — Wookieepedia](https://starwars.fandom.com/wiki/OOM-series_security_droid/Legends) (design-language reference only — this pack's `security-bot` is a generic composite, not a respec of this character)
- In-repo: `src/three-renderer.ts` `HUMANOID_SPECS` / kind-accessory `switch` (existing `robot`/`cyborg`/`ninja_cyborg` specs and accessory builds, read directly from source rather than searched)
