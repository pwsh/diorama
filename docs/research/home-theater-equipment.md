# Home Theater Equipment & Room Layout — Build-Ready Research

Status: research complete, not yet implemented. Target: a cluster of new
**home-theater `FurnitureKind`s** (screen/projector, AV receiver + rack,
soundbar, floorstanding/bookshelf/in-wall/in-ceiling/subwoofer speakers,
theater recliners + riser platform, acoustic panels, bias-lighting strip)
plus a small set of **pure geometry helpers** (`throwDistanceMm`,
`screenDimsFromDiagonal`, an Atmos speaker-layout solver) that let Diorama
both *render* a theater room accurately and *auto-place* a technically
correct speaker layout from a room footprint + seat position — the same
"pure helper + one-click solve" shape already used for `geo.ts`/
`trilateration.ts` and the vacuum dock-offset solver.

## 1. Summary

A dedicated home theater / media room is a fixed cluster of AV equipment
(source + AV receiver + amplification), a picture source (large flat panel
**or** projector + screen), a multichannel speaker system (up to Dolby Atmos
7.1.4), tiered seating, and room treatment (acoustic panels, bias lighting).
Every physical element has well-documented industry placement geometry —
angles in degrees from the listening position, heights in mm/feet, throw
distances as a ratio of screen width — published by Dolby, the CEDIA/CTA-RP22
recommended practice, and THX. None of this is exposed by Home Assistant in
any form (HA sees only a `media_player` entity: power/volume/source/now-playing
— it has no concept of "channel count" or "speaker angle"), so this is
**entirely a Diorama-side visual/placement model**, not something driven live
by an HA API, with one exception: whichever device *is* HA-visible (the AVR,
the TV, a smart soundbar) still rides Diorama's existing `media_player`
now-playing card, appliance in-use glow, and `localState`/`toggleItem`
machinery for free, exactly like any other bound furniture.

This matters for Diorama because it is the single richest "themed room" a
user is likely to build (a kitchen has appliances; a bedroom has a bed; a
theater has a small forest of speakers with real geometric rules) — getting
the placement math right turns "drop 11 boxes in a room" into "drop one
recliner + one screen and let Diorama place a technically-correct Atmos
layout," which is a genuinely differentiated feature versus generic
floor-planning tools. It's also a natural home for `watch_tv`-style avatar
behavior (recliners are `seat`-capable furniture, the screen/soundbar is a
`media_player`-bound anchor) and for the bias-lighting look Diorama's
Sims-toon glow aesthetic already suits well.

## 2. Platform / data model / real-world facts

### 2.1 Home Assistant data model — what's live, what's design-time-only

**`media_player` is the only entity domain in play**, and it covers the AV
receiver, the soundbar, the TV, and (rarely) a network-attached projector — no
Home Assistant domain models "receiver zone speaker configuration," "Atmos
channel count," or "projector lens/throw." Everything about a system's
*physical* channel layout is necessarily user-entered in Diorama, not read
from HA.

- **`media_player` entity attributes** (developer docs:
  <https://developers.home-assistant.io/docs/core/entity/media-player/>, user
  docs: <https://www.home-assistant.io/integrations/media_player/>):
  `state`, `volume_level`, `volume_step`, `is_volume_muted`, `media_content_id`,
  `media_content_type`, `media_duration`, `media_position`, `media_title`,
  `media_artist`, `media_album_name`, `media_album_artist`, `media_track`,
  `media_series_title`, `media_season`, `media_episode`, `media_channel`,
  `media_playlist`, `app_id`, `app_name`, `source`, `source_list`,
  `sound_mode`, `sound_mode_list`, `shuffle`, `repeat`, `group_members`,
  `media_image_url`/`media_image_hash`, `device_class`. Diorama already
  consumes this exact attribute set for the shipped **now-playing card**
  (`parseNowPlaying`, `_nowPlayingGroup` — see `three-renderer.ts`) — a
  bound AVR/soundbar/TV needs **no new Diorama plumbing** to show title/
  artist/art above the fixture.
- **`MediaPlayerEntityFeature` flags** (same doc): `PAUSE`, `PLAY`, `STOP`,
  `PLAY_MEDIA`, `NEXT_TRACK`, `PREVIOUS_TRACK`, `SEEK`, `VOLUME_SET`,
  `VOLUME_MUTE`, `VOLUME_STEP`, `TURN_ON`, `TURN_OFF`, `SELECT_SOURCE`,
  `SELECT_SOUND_MODE`, `SHUFFLE_SET`, `REPEAT_SET`, `CLEAR_PLAYLIST`,
  `GROUPING`, `BROWSE_MEDIA`, `SEARCH_MEDIA`, `MEDIA_ANNOUNCE`,
  `MEDIA_ENQUEUE`.
- **Services** (all standard `media_player.*` actions, callable via HA's
  `call_service`/action mechanism Diorama already uses everywhere):
  `media_player.turn_on` / `turn_off`, `media_player.volume_set` /
  `volume_mute` / `volume_up` / `volume_down`, `media_player.select_source`
  (`{entity_id, source}` — the value must match one of `source_list`'s
  strings, e.g. an AVR's named HDMI input), `media_player.select_sound_mode`
  (`{entity_id, sound_mode}` — e.g. an AVR's "DOLBY ATMOS"/"DTS:X"/"STEREO"
  listening-mode strings, again from `sound_mode_list`), `media_player.
  media_play` / `media_pause` / `media_stop` / `media_next_track` /
  `media_previous_track`, `media_player.join` / `unjoin` (multi-room
  grouping), `media_player.shuffle_set`, `media_player.repeat_set`.
- **AVR-specific integration — `denonavr`** (core, docs
  <https://www.home-assistant.io/integrations/denonavr/>): the most common
  dedicated home-theater-receiver integration. Each configured **zone**
  (Main Zone, Zone 2, Zone 3) becomes its own `media_player` entity with the
  same generic attribute set above; `source`/`source_list` carry the
  receiver's actual named inputs (e.g. `"Blu-ray"`, `"Game"`, `"TV Audio"`)
  and `select_source` is the correct action to switch AVR inputs from
  Diorama's UI:
  ```yaml
  service: media_player.select_source
  target:
    entity_id: media_player.cinema_receiver
  data:
    source: "Blu-ray"
  ```
  There is **no `denonavr`-specific action beyond the standard domain
  actions** in the current integration surface — no service to read/set
  Atmos channel count, no service to read which physical speakers are
  configured on the receiver (that configuration lives entirely in the AVR's
  own setup menu / Audyssey-style room calibration, invisible to HA).
  **Sonos HEOS-based AVRs** (some Denon/Marantz "HEOS built-in" models) may
  instead surface through the `heos` integration
  (<https://www.home-assistant.io/integrations/heos/>), same generic
  attribute shape, multi-room grouping is a first-class HEOS feature.
- **Projector control has no dedicated HA domain.** A network-controllable
  projector (Epson/BenQ/Sony with LAN or PJLink support) has, at best, a
  community/custom integration exposing it loosely as a `media_player` or
  `switch` (power) + `select` (input) — nothing in HA core. The much more
  common real-world path is **IR control**: HA's `remote` entity domain
  (`remote.send_command`, target an IR-emitter device such as a Broadlink or
  ESPHome IR blaster) sending the projector remote's raw IR codes for
  power/input/lens-memory. As of 2026, HA has introduced a dedicated
  **infrared entity platform** that decouples IR-emitter hardware
  (ESPHome, Broadlink, …) from the "which device, which button" mapping
  (announcement: <https://developers.home-assistant.io/blog/2026/03/30/infrared-entity-platform/>,
  integration doc: <https://www.home-assistant.io/integrations/infrared/>) —
  still fundamentally a fire-and-forget command, **no state feedback**
  (a projector controlled purely over IR cannot report "lamp is on" back to
  HA; if the projector is unbound or IR-only, Diorama should treat it exactly
  like any other unbound interactive object via the existing
  `localState`/`toggleItem` convention rather than pretend to read real
  state).
- **What is NOT possible, flagged explicitly**: (1) no entity/attribute
  anywhere reports real speaker count, Atmos height-channel count, or
  per-channel level/distance/size calibration data (this lives inside the
  AVR's own room-correction system — Audyssey/Dirac/YPAO — and is not
  exposed over the network protocols HA integrations talk to); (2) no
  standard way to read "is Atmos currently being decoded/played back" beyond
  the loose `sound_mode` string an AVR chooses to report (format varies
  per-brand, not a fixed enum); (3) a projector's lamp hours / focus / zoom /
  lens-shift are not HA-visible for IR-only setups. All of Diorama's theater
  visualization must therefore be understood as a **design-time, user-
  configured spatial model**, with only power/source/volume/now-playing as
  genuinely live HA state — same shape as the existing TV/media-furniture
  precedent.

### 2.2 Speaker placement standards (Dolby Atmos / CEDIA RP22 / THX)

Three overlapping-but-not-identical industry references exist. Numbers are
close but not literally the same source-to-source; Diorama should treat them
as a **range**, defaulting to the middle of the band, not a single "correct"
constant.

Primary sources: [Dolby Atmos Home Theater Installation Guidelines (PDF)](https://www.dolby.com/siteassets/technologies/dolby-atmos/atmos-installation-guidelines-121318_r3.1.pdf),
[Dolby Atmos Speaker Setup 101](https://www.dolby.com/about/support/guide/dolby-atmos-speaker-setup/),
[CEDIA/CTA-RP22 v1.2 Immersive Audio Design Recommended Practice (PDF)](https://cedia.org/site/assets/files/6057/cedia-cta_rp22_v1_2_sept_2023.pdf)
(dense technical PDF; the angle figures below are corroborated against two
independent secondary breakdowns — [Kyte Tech's RP22 chapter-5 summary](https://kytech.com.au/designing-the-perfect-speaker-layout-for-immersive-sound-rp22-chapter-5/)
and the [AVSForum RP22 implementation-guide thread](https://www.avsforum.com/threads/making-a-home-theater-sound-good-%E2%80%9Cimplementation-guide%E2%80%9D-companion-to-the-cedia-cta-rp22-immersive-audio-design-recommended-practice-in-first-post.3285380/) —
**re-verify against the primary PDF directly before hard-coding
certification-grade numbers**), and [Focal's Dolby Atmos installation guide](https://www.focal.com/dolby-atmos-installation)
(professional mix-room figures, stricter than consumer guidance).

All angles are measured **from the Main Listening Position (MLP)**, 0° =
straight ahead at the screen/center channel, positive = toward the right
(mirror for left).

| Channel | Angle from center (°) | Height | Notes |
|---|---|---|---|
| **Center** | 0° | ear height, ~1.2 m (3.9 ft) seated | directly at/below/above screen |
| **Front L/R** | 22–30° (THX: 22.5–30°, sweet spot ~26–30°) | ear height, ~1.2 m | equidistant from MLP and from the screen |
| **Side surrounds (5.1)** | 90–110° (Dolby: 100–120° ideal, 90° acceptable if constrained; THX: exactly 90°) | ear height + 0.6–0.9 m (2–3 ft) | slightly above ear level for a diffuse, non-point-source feel |
| **Side surrounds (7.1)** | 60–100/110° (narrower/more-forward than the 5.1 position) | same as above | 7.1 moves the "side" pair forward and adds a rear pair |
| **Rear surrounds (7.1)** | 130–150° (Dolby: 135–150°; CEDIA: 130–150°) | ear height + 0.6–0.9 m | behind and to the side of MLP |
| **Height/ceiling (Atmos, consumer)** | elevation 30–55° from MLP, sweet spot 35–45° | ceiling, ideal room height 2.4–3.4 m (8–11 ft); up-firing modules "work best" 2.3–3.7 m (7.5–12 ft) | in-ceiling firing straight down is Dolby's preferred method over up-firing modules for a dedicated theater |
| **Height (professional mix-room, Focal/Dolby pro spec)** | fixed 45° elevation | ceiling ≥ 2.4 m | stricter than the consumer 30–55° band |
| **4-height layout (5.1.4 / 7.1.4)** | front-height pair ~45°, rear-height pair over the surround positions | same ceiling height rule | CEDIA RP22's four-height-channel guidance |

Additional placement rules:
- **Overhead speaker height ratio**: Dolby's consumer guide states overhead
  (height/ceiling) speakers should sit at roughly **2–3× the height of the
  listener-level speakers** (i.e., proportionally, not a fixed meters value)
  — e.g. listener-level speakers at 1.2 m ear height → ceiling speakers
  roughly 2.4–3.6 m, consistent with typical 8–11 ft residential ceilings.
- **All main-tier speakers at one consistent height** (Dolby): keeping
  front/side/rear main speakers all at the same ~1.2 m height is explicitly
  recommended for tonal consistency panning around the room.
- **Minimum recommended Atmos layout**: 7.1.4 is described by Focal/Dolby pro
  guidance as the practical minimum for a "proper" object-based immersive
  layout; 5.1.2 is the common consumer entry point.
- **Subwoofer**: bass below ~80 Hz is effectively omnidirectional, so
  placement is far less angle-sensitive than any other channel. The
  **crossover standard is 80 Hz** (THX). The classic tuning method is the
  **"subwoofer crawl"**: put the sub at the MLP, play a bass-heavy track, then
  crawl the listening area at ear height listening for the position with the
  smoothest, most extended bass — that's where the sub belongs. **Multi-sub
  placement** (Harman/Welti research, widely cited by SVS/THX-adjacent
  guidance) for rooms wider than ~4.3 m (14 ft): **two subwoofers** at the
  midpoints of the two side walls significantly improves seat-to-seat bass
  consistency versus one; **four subwoofers** (midpoint of all four walls) is
  the highest-end approach. Avoid a bare corner placement (over-excites room
  modes) per Dolby's consumer guide, even though "almost anywhere" is
  nominally fine.
- **Screen-relative L/C/R height** for a flat-panel/screen setup: tweeters/
  front speakers at seated ear height (~1.2 m) is the height target
  regardless of screen size; center-channel placement above or below the
  screen is acceptable as long as it stays close to that height band and is
  angled to fire at the MLP.

### 2.3 Screen size, viewing angle, and projector throw-distance geometry

Primary sources: [THX/SMPTE viewing-angle comparison](https://www.avsforum.com/threads/how-to-choose-screen-size-per-thx-recommended-angles.3099450/),
[Kaleidescape screen size guide](https://www.kaleidescape.com/home-theater-guide/screen-size/),
[projector throw-ratio explainer](https://projectordistancecalculator.com/),
[ProjectorCentral's Projection Calculator Pro](https://www.projectorcentral.com/projection-calculator-pro.cfm).

- **Viewing-angle standards**: **SMPTE** recommends a minimum **30°**
  horizontal field of view from the primary seat to the screen edges (a
  conservative, multipurpose-room number); **THX** recommends **~40°** for a
  fully immersive, cinema-like experience in a dedicated theater. Rule of
  thumb (screen diagonal `D`, viewing distance `V`, both in the same unit):
  - THX 40°: `D ≈ V × 0.835` (equivalently `V ≈ D × 1.0` to `1.2`, varies by
    source rounding)
  - SMPTE 30°: `D ≈ V × 0.65` (equivalently `V ≈ D × 1.5–1.6`)
  - Worked example (both sources agree to within rounding): at a 3.66 m
    (12 ft) viewing distance, THX recommends roughly a **121″** diagonal
    screen, SMPTE roughly **90″**.
- **Diagonal → width/height** (pure trigonometry, aspect ratio `a:b`,
  diagonal `D`): `width = D · a/√(a²+b²)`, `height = D · b/√(a²+b²)`.
  For the two aspect ratios a theater room actually uses:
  - **16:9** (flat-panel / most projector content): `width ≈ 0.8718·D`,
    `height ≈ 0.4903·D`.
  - **2.35:1** ("Cinemascope" — projector screens sized for scope content):
    `width ≈ 0.9205·D`, `height ≈ 0.3916·D`.

  | Diagonal | 16:9 width × height (mm) | 2.35:1 width × height (mm) |
  |---|---|---|
  | 100″ (2540 mm) | 2214 × 1245 | 2338 × 995 |
  | 120″ (3048 mm) | 2657 × 1494 | 2806 × 1194 |
  | 135″ (3429 mm) | 2990 × 1681 | 3157 × 1343 |
  | 150″ (3810 mm) | 3321 × 1868 | 3507 × 1492 |

  Common fixed-frame screen range is **100–150″ diagonal**
  (source: [Draper fixed screens](https://www.draperinc.com/projectionscreens/fixedscreens.aspx),
  [Elite Screens sizing guide](https://elitescreens.com/how-to-select-your-projection-screen/)):
  100″ suits smaller rooms, 120″ a common "typical" home theater sweet spot,
  150″+ for larger dedicated rooms/more rows.
- **Screen mounting height**: bottom edge of the screen **610–915 mm
  (24–36″)** above the finished floor is the common guidance, targeting a
  **15–20° vertical viewing angle**, with the front-row eye line landing
  roughly one-third of the way up from the bottom of the image (least
  neck/eye strain). Source:
  [Beacon AV — screen height & visibility](https://beaconaudiovideosystems.com/blog/designing-building-a-home-theater-4-screen-height-position-and-visibility-requirements) —
  best treated as general industry practice rather than a single formal
  standard.
- **Projector throw distance**: `throw ratio (TR) = distance / screen width`,
  so `distance = TR × width`. Typical projector classes:
  - **Standard throw**: TR ≈ 1.0–2.0 (1.4–1.6 most common) → suits rooms
    roughly 3–5.5 m (10–18 ft) deep.
  - **Short throw**: TR ≈ 0.4–0.8 → smaller rooms.
  - **Ultra-short throw (UST)**: TR ≈ 0.2–0.4 → projector sits inches from
    the screen/wall (often a low console beneath the screen rather than
    ceiling-mounted).
  - Worked example: a 120″ 16:9 screen (2657 mm wide) with a 1.5 throw ratio
    → **distance ≈ 3986 mm (≈ 13.1 ft)** from lens to screen.
  - **Vertical lens offset**: most projectors mount inverted from the ceiling
    with some vertical lens-shift/offset range (varies hugely by model — not
    a single constant); Diorama should treat the projector's height as a
    user-set field (typical ceiling mount, screen-top height + a few hundred
    mm) rather than derive it from a formula.

### 2.4 Real-world equipment sizes (mm)

All figures are **typical/representative**, not universal — consumer AV gear
varies significantly by brand/model. Cite the closest verified real product
as a concrete anchor per category rather than claiming a single "correct"
size; Diorama's default `FurnitureKindDef` sizes should read as "reasonable
generic defaults," matching how existing kinds (fridge, tv, etc.) already
work.

- **AV receiver**: rack-width consumer chassis. Mid-range example — Denon
  AVR-X1800H: **434 × 151 × 339 mm (W×H×D)**
  ([Denon manuals](https://manuals.denon.com/) dimension pages). Flagship/
  high-channel-count units run taller and deeper (historical high-end
  example, Yamaha DSP-A1: 435 × 191 × 473 mm). A reasonable Diorama default:
  **440 × 170 × 400 mm**, `cat: 'appliance'`-like (rack-mounted, not floor
  furniture) or as an item inside an equipment rack (below).
  Rack-unit convention: **1U = 44.45 mm (1.75″)**; standard rack rail width
  **482.6 mm (19″)**. A receiver is typically ~3U tall; a home-theater
  equipment rack commonly runs **20–30U** total.
- **Equipment rack** (open or closed cabinet housing the AVR + amp + source
  components): reasonable default footprint **600 × 600 mm** base ×
  **900–1500 mm** tall (12–30U), dark/black matte finish — standard rack
  glyph, no need for per-slot modeling in v1 (a single labeled box is enough;
  the AVR/amp could be separate mountable pieces on its "surface" shelves in
  a v2 if desired, mirroring the existing `mountable`/`surface` furniture
  relationship already used for countertop appliances).
- **Soundbar**: Sonos Arc — **1142 × 87 × 116 mm (W×H×D)**
  ([Dimensions.com](https://www.dimensions.com/element/sonos-arc)). Good
  generic default for a large-format soundbar; smaller soundbars run
  600–900 mm wide.
- **Subwoofer** (10″ sealed/ported box, representative): SVS PB-1000 —
  **480 × 381 × 493 mm (H×W×D)**
  ([SVS product page](https://www.svsound.com/products/pb-1000)). A generic
  default cube-ish box **450 × 400 × 450 mm** covers most consumer 10–12″
  powered subs.
- **Floorstanding speaker**: no single verified spec fetched this pass;
  typical published dimensions across major brands run roughly
  **950–1150 mm tall × 200–320 mm wide × 300–420 mm deep** — treat as a
  general-knowledge estimate (flagged, not independently source-verified
  this pass) and re-confirm against a specific model if exact accuracy
  matters later.
- **Bookshelf speaker**: representative example (Vera-Fi Vanguard Scout) —
  **305 × 171 × 241 mm (H×W×D)**. Good generic default; bookshelf speakers
  commonly sit on stands (~600–750 mm tall) or on furniture/shelves,
  matching Diorama's existing `mountable`-on-`surface` relationship.
- **In-ceiling speaker**: driver sizes are conventionally **6.5″ or 8″**
  (165/200 mm) with 4″/10″ less common; **cutout diameter ≈ 196–250 mm**;
  **mounting/back-can depth ≈ 36–160 mm, ~100 mm average**
  (source: [Extron ceiling-speaker calculator guide](https://www.extron.com/article/ceilspkcalcguide),
  [Totem Acoustic in-ceiling sizing guide](https://totemacoustic.com/how-do-i-choose-an-in-ceiling-speaker-what-size-in-ceiling-speaker-do-i-need/)).
  Visually a flush ceiling grille disc — a strong match for Diorama's
  existing flush-mount fixture idiom (see §3).
  In-ceiling height speakers for Atmos are the SAME physical part class as
  general in-ceiling surround speakers — position, not hardware, is what
  differs.
- **In-wall speaker**: roughly **300–380 mm tall × 200–250 mm wide**, thin
  (~75–100 mm) mounting depth including the back can
  (source: [World Wide Stereo in-wall vs in-ceiling guide](https://www.worldwidestereo.com/blogs/guides/in-wall-speakers-vs-in-ceiling-speakers-guide)) —
  another flush grille, this time wall-mounted (matches Diorama's existing
  switch-plate/floodlight wall-snap idiom, see §3).
- **Projection screen** (fixed-frame): see §2.3 table above for panel
  dimensions by diagonal; frame border typically adds ~50–75 mm all around
  beyond the visible image.
- **Projector body**: no dedicated primary source fetched this pass; typical
  consumer/prosumer home-theater projectors run roughly
  **350–450 mm wide × 120–180 mm tall × 250–350 mm deep** — general-knowledge
  estimate, flagged for later verification against a specific model.

### 2.5 Theater seating & riser dimensions

Primary sources: [Seatcraft — home theater seating dimensions](https://www.seatcraft.com/blogs/news/home-theater-seating-dimensions),
[Theater Seat Store — riser guide](https://www.theaterseatstore.com/blog/home-theater-riser-guide),
[Valencia — seating layout & row spacing](https://us.valenciatheaterseating.com/blogs/knowledge-center/home-theater-seating-layout-spacing),
[Audio Advice — riser height guide](https://www.audioadvice.com/blogs/expert-advice/home-theater-riser-height),
[Home Theater Visualizer — seating & riser guide](https://www.hometheatervisualizer.com/guides/home-theater-seating).

- **Individual recliner seat**: width per seat **760–915 mm (30–36″)**,
  armrest ~200 mm (8″), seat depth (upright) ~500 mm (20″), overall chair
  height **965–1065 mm (38–42″)**.
- **Fully reclined footprint**: footrest extends **460–660 mm (18–26″)** in
  front of the seat base; a fully reclined chair occupies **965–1270 mm
  (38–50″)** of front-to-back floor space total.
- **Row spacing (back of one row to back of the next, reclining seats)**:
  **1525–1905 mm (60–75″)** — wide enough for full recline plus a walking
  clearance behind.
- **Riser height** (2-row rooms, second row elevated so sightlines clear the
  front-row headrests): standard range **305–457 mm (12–18″)**, most common
  practical middle ground **355–405 mm (14–16″)**; exact value should be
  calculated from seat/headrest height + the desired 2–4″ eye-line clearance
  over the front row, not just picked from the range blind.
- **Riser depth**: minimum **1830 mm (6 ft)**, **1980–2135 mm (6′6″–7′)**
  preferred for reclining seats.
- **Riser width**: row width + ~50–100 mm (2–4″) buffer per side for a clean
  finished edge.
- **Seated eye height**: ~1.07–1.22 m (42–48″) for an adult in an upright
  chair; theater-recliner seated eye height commonly cited nearer **915 mm
  (36″)** once reclined — this is the number that ultimately drives screen
  height + riser sightline math (§2.3).

### 2.6 Acoustic treatment & bias/ambient lighting

- **Acoustic panels**: the ubiquitous **2×4 ft (610 × 1220 mm)** rectangle is
  the ready-made industry standard panel size; thickness drives function —
  **~50 mm (2″)** for general mid/high absorption, **~100 mm+ (4″+)** for
  bass traps, with dedicated **corner bass traps** (triangular profile,
  placed in room corners where low-frequency energy concentrates) sometimes
  well over a foot deep at their thickest point.
  Sources: [John Hunter Acoustics 2×4 ft panel](https://johnhunteracoustics.com/products/2x4-ft-4-thickness-acoustic-panels),
  [GIK Acoustics bass traps](https://www.gikacoustics.com/collections/bass-traps).
  Visually: flat rectangular wall-mounted panels in a neutral/dark fabric
  finish (charcoal, navy, burgundy are common home-theater choices) —
  straightforward as a thin `_mat()` box with a fabric-toned color, using the
  existing wall-flush-mount recipe (no new geometry needed).
- **Bias / ambient lighting**: a TV/screen backlight strip is now a
  mainstream feature. Philips Hue's **Play Gradient Lightstrip** is the
  reference product: individually-addressable RGBICWW zones (~300 mm/zone)
  behind the screen, sized in three SKUs matched to **55–64″, 65–74″, and
  75″+** screens, driven by the **Hue Sync Box** (HDMI passthrough that
  samples on-screen color in real time and pushes near-zero-lag color
  updates to the strip zones).
  Sources: [Philips Hue — best backlights for TV](https://www.philips-hue.com/en-us/explore-hue/blog/best-backlights-for-tv),
  [Philips Hue — lights that sync with TV](https://www.philips-hue.com/en-us/explore-hue/blog/sync-with-tv).
  From HA's perspective this is just a `light.*` entity (color/brightness
  attributes Diorama already fully supports via the shipped light-config
  modal) — **no new HA data model needed**, only a new `LightIconKind`
  (e.g. `'bias_strip'`) for the visual (a thin light-emitting bar hugging the
  back of the screen furniture piece, tinted by the bound light's current
  RGB — reusing the exact same emissive-material pattern as every other
  light kind, see §3).

## 3. Diorama design / integration

### 3.1 New `FurnitureKind`s (theater cluster) — mostly the existing recipe

Nearly everything here is a straight application of the **already-documented
`FurnitureKind` recipe** (`FURNITURE_KINDS` in `geometry.ts` →
`drawFurniturePrimitive` switch in `canvas-render.ts` → `_buildFurniture`
switch in `three-renderer.ts`, sidebar dropdown is automatic via
`Object.keys(FURNITURE_KINDS)`). A new `cat: 'theater'` optgroup (fed through
`furnitureCat(def)`) keeps these out of the existing appliance/bathroom/
outdoor groups in the sidebar dropdown.

| New kind | `cat` | Defaults (w×h×d mm) | Notes |
|---|---|---|---|
| `screen` (flat-panel or projector screen surface) | `theater` | from §2.3 table, default 120″ 16:9 (2657×1494, thin ~40 mm) | reuse the existing TV click/bind flow (`isMediaPlayerId`) for a bound display; a *projection* screen itself has no entity (it's just a surface) — the projector is the bindable device |
| `projector` | `theater` | 400×150×300 | ceiling-mount piece (see §3.3); optional IR/`remote`-entity bind, else `localState` on/off like any unbound interactive object |
| `av_receiver` | `theater` (mountable on a `surface`/rack shelf) | 440×170×400 | bind a `media_player.*`; gets the now-playing card + appliance-style in-use glow automatically once tagged appropriately |
| `equipment_rack` | `theater` (a `surface` host) | 600×1200×600 | static cabinet; AVR/amp pieces `mountable` onto it like countertop appliances already do |
| `soundbar` | `theater`, `mountable` (on a TV stand/screen) | 1140×90×120 | bind a `media_player.*` if it's a smart soundbar |
| `subwoofer` | `theater` | 450×450×400 | no bind target typically (passive from the AVR) — pure decoration/placement, or bind AVR power as a proxy for "system on" |
| `floorstanding_speaker` | `theater` | 250×1050×350 | pair, placed via the layout solver (§3.2) |
| `bookshelf_speaker` | `theater`, `mountable` (on stand/shelf) | 175×305×240 | |
| `theater_recliner` | `theater`, `seat: 500` | 850×1050×750 (fully-open footprint) | sittable — feeds the existing seating/dwell/activity system for free |
| `riser_platform` | `theater` | user-sized rect, `elevation` field | a flat raised floor patch — closest existing precedent is a stair landing/elevated floor section; occupiable, not a nav blocker |
| `acoustic_panel` | `theater`, wall-flush | 610×1220×50 (2×4 ft) | wall-snapped like a switch plate/floodlight, thin fabric-toned box |

Wall/ceiling-mounted members of this list (`in_wall_speaker`,
`in_ceiling_speaker`, `acoustic_panel`) are the odd ones out — they're
**flush fixtures**, not free-standing furniture, and should follow the
**switch-plate / floodlight wall-snap recipe** (`snapSwitchToWall`/
`snapFloodlightToWall` in `geometry.ts`) rather than the furniture drop
flow:

- `in_wall_speaker` — new fixture kind cloning `snapSwitchToWall`'s geometry
  (flush at wall face, offset = `WALL_HALF + halfDepth`), default
  340×230×85 mm, round-cornered grille look.
- `in_ceiling_speaker` — **new territory**: nothing in Diorama currently
  flush-mounts to the *ceiling* (lights hang at `lightHeight`, but nothing
  sits flat against the ceiling plane the way a switch sits flat against a
  wall). The cleanest fit is to model it as a `LightIconKind`-style fixture
  at a fixed height equal to the room's ceiling (`STORY_H = 3000 mm`
  constant referenced elsewhere in the renderer, or the floor's actual wall
  height) with **no vertical placement freedom** — drop anywhere in the
  room's XZ footprint, renders as a flush grille disc at ceiling level, no
  wall-snap needed (it just always sits at ceiling Y). This is a small,
  genuinely new placement mode (distinct from both the floor-drop and
  wall-snap patterns already in the codebase) — worth flagging as the one
  piece of real net-new interaction plumbing in this whole feature set.
- `acoustic_panel` — flush wall-mount like `in_wall_speaker`, thinner (50 mm),
  skip the outline-shell system's "thin sheet" exclusion threshold check
  (<8 mm skip — a panel is comfortably above that) so it still gets a toon
  outline.

### 3.2 Pure geometry helpers — the differentiated feature

Following the exact convention already established for `geo.ts` /
`trilateration.ts` (pure, deterministic, zero imports, unit-testable via a
`test-pages/*.html` harness), add to `geometry.ts` (or a new
`theater-layout.ts` if it's substantial enough to warrant its own file, like
`geo.ts`/`trilateration.ts` did):

```ts
// Given a diagonal (mm) and aspect ratio, return width/height (mm).
function screenDimsFromDiagonal(diagonalMm: number, aspect: '16:9' | '2.35:1'): { w: number; h: number };

// Given desired screen width (mm) and a projector's throw ratio (or a
// [min,max] range), return the recommended throw distance (mm), or a range.
function throwDistanceMm(screenWidthMm: number, throwRatio: number | [number, number]): number | [number, number];

// Given the room footprint (fw, fd mm) and a seat/MLP point (sx, sy),
// return recommended speaker positions + rotations for a requested layout
// ('5.1' | '7.1' | '5.1.2' | '5.1.4' | '7.1.4'), applying the §2.2 angle
// bands (front 22–30°, side 90–110°/60–100°, rear 130–150°, height 30–55°
// elevation) projected onto the actual room rectangle — placing each
// speaker at the wall/ceiling intersection nearest its ideal angle ray from
// the seat, clamped to stay inside the room.
function atmosSpeakerLayout(
  fw: number, fd: number, ceilingH: number,
  seat: { x: number; y: number },
  config: '5.1' | '7.1' | '5.1.2' | '5.1.4' | '7.1.4'
): { role: string; x: number; y: number; z: number; rotDeg: number }[];
```

This is the genuinely novel, high-value piece: a **"Auto-place speakers"**
sidebar button (mirroring the existing "Set dock as reference" one-click
solve for vacuum calibration, and the geo-calibration flow's "Finish" button)
that reads the room rectangle + a placed `theater_recliner`/seat position and
seat, then instantiates the correct furniture/fixture set at
technically-correct positions — instead of a user eyeballing 11 speaker
positions by hand. Ship the pure solver + a `theater-layout-test.html` first
(matching the `geo-test.html`/`trilateration.html` precedent), independent of
the furniture-kind work, since it's the part someone could get subtly wrong.

### 3.3 3D rendering — no new mechanisms, all documented reuse

- **Materials**: every new piece routes through `_mat()` (`MeshToonMaterial` +
  shared gradient map) like all furniture — no PBR, no exceptions needed
  here (unlike weather particles, nothing in this feature set is a billboard
  sprite).
- **Screen**: a large thin emissive-capable panel; when bound to a `media_player`
  that's playing, this is the **exact same now-playing / "TV" pattern**
  already shipped (media art card sprite above it via `_nowPlayingGroup`,
  `watch_tv` activity anchor). A *projector screen* differs from a flat-panel
  `tv` kind only in that the "screen" surface and the "device" (the
  projector) are two separate furniture pieces — the screen itself is inert
  geometry; bind the `media_player` to the **projector** piece (or to
  whatever upstream source device the room actually exposes) and key the
  `watch_tv`/now-playing anchor off the **screen's** position, not the
  projector's, since that's where the avatar should visually look.
- **Bias-lighting strip**: new `LightIconKind: 'bias_strip'` — a thin bar
  hugging the back edge of the screen furniture, emissive-tinted from the
  bound light's live RGB (exactly like every other light kind reads color),
  **no floor pool** (like `sconce` — it lights the wall/screen surround, not
  the floor). Extend `LIGHT_GLYPH`, the `three-renderer.ts` `updateLightsSwitches`
  switch, and `LIGHT_KINDS` in `sidebar.ts` per the documented "adding a new
  `LightIconKind`" gotcha.
- **In-ceiling speakers**: flush ceiling disc, always at ceiling height (new
  placement mode, §3.1) — skip blob shadow (elevation effectively "ceiling,"
  same exclusion already applied to elevated pieces ≥300 mm).
- **Acoustic panels / in-wall speakers**: wall-flush box, standard outline
  shell (thick enough to clear the thin-sheet skip threshold), standard blob
  shadow skip (flush-mounted, like other wall fixtures).
  **Coincident-face gotcha applies**: a panel sitting flush against a wall
  face must not share an exactly coplanar face with the wall's own surface —
  offset it a few mm proud of the wall (same fix already applied to
  fireplace mantels / bed blankets).
- **Riser platform**: an elevated floor patch — closest existing precedent
  is a stairwell floor recess/hole (used in reverse — a raised patch instead
  of a hole). Verify against the actual stairwell-hole implementation before
  assuming direct reuse (same verification flag already raised in
  `pool-spa.md` for its recessed-basin case) — a flat raised box at
  `y = riserHeight` with a front-facing step edge is the simplest correct
  model and may not need the stairwell machinery at all.
- **Theater recliner**: a `seat`-capable furniture piece — this is **already
  a fully generic system** (SitSpot registration, dwell capture, seated pose,
  `watch_tv` activity when a bound/ON screen or projector sits in the same
  room) — no new avatar work needed at all beyond registering the kind with
  `seat` set and `activity: 'watch_tv'`-eligible per the existing
  `SitSpot.hostActivity` resolution (a seated rig in a theater room with an
  ON, bound screen/projector in-room already triggers `watch_tv` through the
  shipped mechanism).
- **Dirty keys**: AV receiver / soundbar / screen power+source state folds
  into the existing **appliance-state-hash-in-`_keyFloor`** pattern (already
  used for TVs/fridges/etc.) — no new dirty key needed unless the theater
  cluster is pulled into its own group (not necessary; it's ordinary
  furniture).

### 3.4 UI mode / kiosk interplay

Nothing theater-specific here beyond what already exists: a theater room
built in `edit` mode renders identically in `kiosk`/`view` per the existing
uiMode contract (device interaction still allowed in kiosk — tapping the
soundbar toggles power/source picker same as any bound `media_player`
furniture already does). A **kiosk link** (`?mode=kiosk&view=3d&cam=…`) aimed
at the theater room, saved via the existing 💾 view-save button, is the
natural "wall tablet mounted at the theater door shows tonight's movie /
lets guests dim the lights" use case — no new URL-template surface needed.

## 4. Setup / integration steps

1. **HA-side prerequisites** (user, one-time): ensure the AVR (denonavr/HEOS/
   generic media_player integration) and any smart soundbar/TV are already
   configured as HA `media_player` entities; note the AVR's actual
   `source_list` / `sound_mode_list` strings for later binding (these are
   receiver-specific, not standardized). If the projector is IR-only, set up
   an IR emitter (Broadlink/ESPHome) + the `remote`/infrared-entity mapping
   for at least power toggle; accept no live projector state feedback.
2. **types.ts**: add the new `FurnitureKind` string literals (§3.1 table);
   add `in_wall_speaker`/`in_ceiling_speaker`/`acoustic_panel` as their own
   flush-fixture types if following the switch/floodlight pattern rather
   than generic furniture (decide during implementation which is cleaner —
   the flush ones need wall/ceiling-snap fields the generic `Furniture`
   interface doesn't carry).
3. **geometry.ts**: `FURNITURE_KINDS` entries with defaults from §2.4/§3.1;
   `screenDimsFromDiagonal`/`throwDistanceMm`/`atmosSpeakerLayout` pure
   helpers (§3.2); a `snapInCeilingSpeaker`-equivalent placement resolver
   (always-ceiling-height, no wall search) if implementing the flush variant;
   `cat: 'theater'` in `furnitureCat`.
4. **Test page first**: `test-pages/theater-layout-test.html` (esbuild
   `--bundle`, matching `weather-test.html`/`trilateration.html`) asserting
   the pure geometry helpers against the §2.2/§2.3 numeric bands before any
   rendering work — cheapest place to catch a sign/unit error.
5. **canvas-render.ts / canvas-hit.ts / canvas-interact.ts**: standard
   furniture-kind switch cases (screen/AVR/rack/soundbar/sub/speakers/
   recliner/riser) automatically get 2D drawing via `drawFurniturePrimitive`;
   add dedicated wall-snap/ceiling-snap draw+hit+interact cases only for the
   flush fixture trio if built as a separate fixture type rather than generic
   furniture (mirrors the switch/floodlight/alarm-panel recipe exactly).
6. **sidebar.ts**: furniture dropdown is automatic (`Object.keys(FURNITURE_KINDS)`);
   add per-kind editor fields where needed (screen diagonal/aspect picker
   feeding `screenDimsFromDiagonal` to auto-size the piece; AVR/soundbar
   entity bind row; a "🎬 Auto-place Atmos speakers" button in a new
   `_section('theater', …)` that calls `atmosSpeakerLayout` and instantiates
   the returned positions as furniture/fixtures, following the vacuum
   dock-offset one-click-solve UX precedent).
7. **three-renderer.ts**: `_buildFurniture` switch cases (§3.3); new
   `LightIconKind: 'bias_strip'` (extend `LIGHT_GLYPH`, `updateLightsSwitches`,
   `LIGHT_KINDS`); ceiling-flush placement mode for `in_ceiling_speaker` if
   built as its own fixture; verify stairwell-hole reuse for `riser_platform`
   before assuming it, or just build a simple raised box.
8. **Wire `watch_tv`**: confirm a theater-room seated rig with a bound/ON
   screen or projector in-room already satisfies the existing
   `SitSpot.hostActivity`/`_tvsByRoom` resolution — likely **already works**
   once the screen/projector furniture is `hasEntity`-eligible (bound OR
   `localState`), matching the existing TV precedent; add the projector/
   screen kind to whatever set `_tvsByRoom` currently scans if it's
   `tv`-kind-specific rather than "any bound-media-player furniture in room."
9. **Docs**: log the shipped feature in `docs/STATUS.md` once implemented,
   per repo convention (research docs describe the plan, not a shipped
   feature — don't claim ship status here).

## 5. Potential additional features

- **Sound-mode-aware Atmos glow**: when the bound AVR's `sound_mode`
  contains "atmos"/"dts:x" (best-effort substring match — no fixed enum
  exists across brands), give the height/ceiling speakers a distinct
  "engaged" emissive tint versus the idle/stereo look — a cheap, purely
  cosmetic tell that immersive audio is actively decoding.
  **Fragile**: `sound_mode` strings are brand-specific free text (see §2.1)
  — treat any match as best-effort, never assume a fixed vocabulary.
- **Volume-reactive glow**: subtle emissive pulse scaled by `volume_level`
  on the subwoofer/speakers while `state === 'playing'` — cheap, no new
  entity data, reuses the existing appliance-glow alpha-pulse idiom.
  Deliberately **not** audio-reactive to actual playback content (Diorama
  has no audio-analysis pipeline and the "no audio, permanent decision" rule
  already established for lightning strikes applies in spirit here too —
  keep it a simple level-based pulse, not a beat-detector).
- **Screen-size sidebar picker → auto throw-distance suggestion**: pick a
  diagonal + aspect + a projector's published throw-ratio range, and the
  sidebar shows the recommended projector placement distance live (direct
  UI application of `throwDistanceMm`).
- **Riser + recliner "auto-layout" for a whole row**: given a row width and
  seat count, auto-space N recliners evenly (small helper analogous to the
  multi-seat sofa/bench spot-distribution logic already shipped for sitting
  spots) — separate from, but complementary to, the Atmos speaker solver.
- **PJLink / networked-projector support** (if a specific brand/protocol
  gains a real HA integration later): would upgrade the projector from
  `localState`-only to genuine bound state (power/input/lamp-hours) — worth
  revisiting if a core PJLink integration ships; not present as of this
  research pass.
- **Curtain/masking**: scope-format screens sometimes have motorized side
  masking panels that retract for 2.35:1 vs slide in for 16:9 content —
  a nice-to-have `cover.*`-style animation reusing the existing
  `doorOpenFraction` cover resolver, purely cosmetic v2.
- **Popcorn machine / concession furniture**: a fun, low-effort furniture
  kind (`cat: 'theater'`) with no live binding — pure atmosphere, matching
  the existing decorative-furniture precedent (bird bath, lawn chairs, etc.)

## 6. Open questions & risks

- **No live speaker-layout or Atmos-decode signal from HA.** Every placement
  number in §2.2 is applied at **design time only** — Diorama cannot verify
  a real system actually matches the modeled layout, and cannot show true
  live "Atmos object panning" visualization. Be explicit in any UI copy that
  the speaker layout is a **planning aid**, not a live readout.
- **Placement standards genuinely disagree by a few degrees** (Dolby vs THX
  vs CEDIA RP22 side-surround angle: 90° / 90–110° / 100–120° depending on
  source) — pick one band as the tool's default (recommend the CEDIA RP22
  numbers as the most current/nuanced, since it's the newest and most
  detailed of the three) but don't present any single number as
  unimpeachable fact in UI copy; a tooltip citing "typically 90–120°,
  Dolby/THX/CEDIA vary" is more honest than a bare "110°."
- **The CEDIA/CTA-RP22 PDF is a large, paywalled-adjacent technical
  document** that this research pass could not fully machine-parse (8+ MB,
  image-heavy); the angle figures above are corroborated across the Dolby
  consumer guide + two independent secondary RP22 summaries, but if a
  certification-grade feature is ever built around RP22 specifically,
  **re-verify directly against the primary PDF** (link above) rather than
  trusting this document's secondhand figures alone.
- **Product dimensions vary enormously by brand/model** — every mm figure in
  §2.4 is anchored to one real, verified product per category as a sanity
  check, not a category-wide average; treat `FurnitureKindDef` defaults as
  "a reasonable generic," exactly like existing kinds (e.g. `fridge`) already
  are, and let the user resize per-piece as already supported everywhere in
  Diorama.
- **Floorstanding speaker and projector-body dimensions were NOT
  independently verified against a primary spec sheet this pass** (flagged
  inline in §2.4) — low risk (these are visual-only defaults, not placement-
  critical), but worth a quick follow-up product-spec check before shipping
  if precise sizing matters.
- **In-ceiling-mount is genuinely new placement plumbing** (§3.1) — the one
  piece of this feature set that isn't a mechanical clone of an existing
  recipe. Scope it carefully (fixed ceiling height, XZ-only placement, no
  wall-snap search) rather than trying to generalize the wall-snap code path
  to also handle ceilings; they're different enough (a wall has a normal
  vector to snap to at any point along its run; a ceiling is a single flat
  plane at a fixed height) that forcing a shared abstraction is likely more
  work than two small, separate resolvers.
- **Projector IR control is one-way** (§2.1) — no lamp-hour/input feedback.
  If a user expects the projector fixture to show "currently on input X,"
  that's only possible for a genuinely network-controlled projector
  (rare, integration-fragmented), not the common IR-remote case. Default the
  projector fixture to the same honest `localState`-only pattern already
  used for every other unbound interactive object rather than inventing a
  fake state model.
- **Riser-platform 3D geometry needs implementation-time verification**
  against whatever the stairwell/elevated-floor code actually supports today
  (flagged, not assumed) — same caution already raised for the pool
  basin-recess feature in `pool-spa.md`.

## 7. Sources

**Home Assistant data model**
- [Media player entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/media-player/)
- [Media player — Home Assistant integration docs](https://www.home-assistant.io/integrations/media_player/)
- [Denon AVR Network Receivers — Home Assistant integration docs](https://www.home-assistant.io/integrations/denonavr/)
- [Denon HEOS — Home Assistant integration docs](https://www.home-assistant.io/integrations/heos/)
- [Infrared — Home Assistant integration docs](https://www.home-assistant.io/integrations/infrared/)
- [New infrared entity platform for IR device integrations — HA Developer Blog, 2026-03-30](https://developers.home-assistant.io/blog/2026/03/30/infrared-entity-platform/)

**Speaker placement standards**
- [Dolby Atmos Home Theater Installation Guidelines (PDF, Dec 2018)](https://www.dolby.com/siteassets/technologies/dolby-atmos/atmos-installation-guidelines-121318_r3.1.pdf)
- [Dolby Atmos Speaker Setup 101 — Dolby](https://www.dolby.com/about/support/guide/dolby-atmos-speaker-setup/)
- [CEDIA/CTA-RP22 v1.2 Immersive Audio Design Recommended Practice (PDF)](https://cedia.org/site/assets/files/6057/cedia-cta_rp22_v1_2_sept_2023.pdf)
- [Kyte Tech — RP22 Chapter 5 speaker layout summary](https://kytech.com.au/designing-the-perfect-speaker-layout-for-immersive-sound-rp22-chapter-5/)
- [AVSForum — RP22 Implementation Guide companion thread](https://www.avsforum.com/threads/making-a-home-theater-sound-good-%E2%80%9Cimplementation-guide%E2%80%9D-companion-to-the-cedia-cta-rp22-immersive-audio-design-recommended-practice-in-first-post.3285380/)
- [Focal — Guidelines for Dolby Atmos installation](https://www.focal.com/dolby-atmos-installation)
- [Polk Audio — Ultimate Guide to Dolby Atmos, Part 4: Setup](https://www.polkaudio.com/en-us/polklore/how-to/ultimate-guide-to-dolby-atmos-setting-up-your-system.html)
- [SVS — The Art of Speaker Placement (multi-sub guidance)](https://www.svsound.com/blogs/speaker-setup-and-tuning/74790851-the-art-of-speaker-placement)

**Screen size, viewing angle, projector throw**
- [AVSForum — How to choose screen size per THX recommended angles](https://www.avsforum.com/threads/how-to-choose-screen-size-per-thx-recommended-angles.3099450/)
- [Kaleidescape — Screen Size, Viewing Distance & Resolution](https://www.kaleidescape.com/home-theater-guide/screen-size/)
- [Projector Distance Calculator — throw ratio explainer](https://projectordistancecalculator.com/)
- [ProjectorCentral — Projection Calculator Pro](https://www.projectorcentral.com/projection-calculator-pro.cfm)
- [Draper Inc. — Fixed Projection Screens](https://www.draperinc.com/projectionscreens/fixedscreens.aspx)
- [Elite Screens — How to Select Your Projection Screen](https://elitescreens.com/how-to-select-your-projection-screen/)
- [Beacon AV — Screen Height, Position, and Visibility Requirements](https://beaconaudiovideosystems.com/blog/designing-building-a-home-theater-4-screen-height-position-and-visibility-requirements)

**Equipment sizes**
- [Denon manuals — AVR-X1800H dimensions/weight](https://manuals.denon.com/)
- [Dimensions.com — Sonos Arc](https://www.dimensions.com/element/sonos-arc)
- [SVS — PB-1000 Subwoofer](https://www.svsound.com/products/pb-1000)
- [Extron — Ceiling Speaker Calculator Guide](https://www.extron.com/article/ceilspkcalcguide)
- [Totem Acoustic — In-ceiling speaker sizing guide](https://totemacoustic.com/how-do-i-choose-an-in-ceiling-speaker-what-size-in-ceiling-speaker-do-i-need/)
- [World Wide Stereo — In-ceiling vs in-wall speakers buying guide](https://www.worldwidestereo.com/blogs/guides/in-wall-speakers-vs-in-ceiling-speakers-guide)

**Seating & risers**
- [Seatcraft — Home Theater Seating Dimensions](https://www.seatcraft.com/blogs/news/home-theater-seating-dimensions)
- [Theater Seat Store — Home Theater Riser Platform Guide](https://www.theaterseatstore.com/blog/home-theater-riser-guide)
- [Valencia Theater Seating — Seating Layout & Row Spacing](https://us.valenciatheaterseating.com/blogs/knowledge-center/home-theater-seating-layout-spacing)
- [Audio Advice — How to Pick the Best Riser for Your Home Theater](https://www.audioadvice.com/blogs/expert-advice/home-theater-riser-height)
- [Home Theater Visualizer — Seating Distance & Riser Guide](https://www.hometheatervisualizer.com/guides/home-theater-seating)

**Acoustic panels & bias lighting**
- [John Hunter Acoustics — 2×4 ft acoustic panels](https://johnhunteracoustics.com/products/2x4-ft-4-thickness-acoustic-panels)
- [GIK Acoustics — Bass Traps](https://www.gikacoustics.com/collections/bass-traps)
- [Philips Hue — Best Backlights for TV](https://www.philips-hue.com/en-us/explore-hue/blog/best-backlights-for-tv)
- [Philips Hue — Lights that sync with TV](https://www.philips-hue.com/en-us/explore-hue/blog/sync-with-tv)
