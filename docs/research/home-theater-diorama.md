# Home Theater Visualization & Control in Diorama

Research reference. Build-ready: concrete field names, defaults (mm), dirty-key
placement, and function names to add/extend, cross-checked against the current
source tree (`src/geometry.ts`, `src/types.ts`, `src/three-renderer.ts`,
`src/canvas-render.ts`, `src/ui/three-view.ts`) as of this writing.

## 1. Summary

Diorama already ships most of the *primitives* a home theater needs — it just
doesn't yet compose them into a themed feature. A "home theater" in Diorama is
not a new subsystem; it's a **furniture-kind pack + one new fixture type
(projector) + a movie-mode toggle**, built entirely with the existing
canvas-fixture recipe, the `_mat()` toon-material factory, the shared
now-playing card system, and the sit/seat/`watch_tv` activity machinery.

Why it matters for a kiosk/theater skin:
- A wall-mounted media room screen already renders exactly like a `wall_tv` —
  no new rendering path needed, just a new `FurnitureKind` (or reuse `wall_tv`
  with a bigger default width) bound to a `media_player.*` entity so the
  shipped `_nowPlayingGroup` card (title/artist/album art) floats above it.
- Recliner seating is just a `FurnitureKindDef` with `seat` set; avatars
  already sit and, if a bound **ON** `media_player.tv`-ish entity is in the
  room, trigger `watch_tv` automatically — zero new activity code required.
- A "movie mode" is a thin Planner convenience (a preset that flips light
  `localState`/calls `light.turn_off` + arms bias-light color) — it does not
  need a new store field beyond an optional per-floor or global toggle,
  because dimming *is* just driving existing `Light`/`SwitchFixture` items
  through `Planner.toggleItem`/`toggleEntity`.
- The one genuinely new fixture is the **projector**: a small `LightIconKind`-
  style ceiling/shelf object with a translucent beam decal aimed at a screen —
  modeled on the existing floodlight/spot light-cone precedent, but as its own
  fixture (not a `Light`) since it has no HA light entity semantics, only an
  optional `media_player.*` bind for on/off and an aim vector.
- Speakers (floorstanding / in-wall / subwoofer) are new **furniture kinds**
  under a new `cat: 'theater'` (or reuse `'appliance'`) with a visual-only
  audio-pulse tied to the room's media player being `playing`, mirroring the
  existing appliance in-use LED glow (`Furniture.powerEntity` /
  `powerGlowScale`) precedent but keyed off playback state, not wattage.

Nothing here requires a new dirty-key *category* — every piece folds into
`_keyFloor` (furniture/lights are already part of it) or into the existing
`_keyNowPlaying` (media card) and appliance-state-hash mechanisms. The single
new per-frame concern is the projector beam's optional pulse-with-audio, which
follows the fireplace/appliance "force-rebuild-while-active" idiom already in
the codebase.

## 2. Platform / data model / real-world facts

### 2.1 Home Assistant `media_player` domain (verified against HA docs)

**Entity attributes** (from the [Media player entity developer docs](https://developers.home-assistant.io/docs/core/entity/media-player/)):
`app_id`, `app_name`, `device_class`, `group_members`, `is_volume_muted`,
`media_album_artist`, `media_album_name`, `media_artist`, `media_channel`,
`media_content_id`, `media_content_type`, `media_duration`, `media_episode`,
`media_image_hash`, `media_image_remotely_accessible`, `media_image_url`,
`media_playlist`, `media_position`, `media_position_updated_at`,
`media_season`, `media_series_title`, `media_title`, `media_track`, `repeat`,
`shuffle`, `sound_mode`, `sound_mode_list`, `source`, `source_list`, `state`,
`volume_level`, `volume_step`. (Diorama's `parseNowPlaying`/`isMediaPlayerId`
in `geometry.ts` already consume `media_title`/`media_artist`/
`entity_picture` — `entity_picture` is a base-entity attribute exposed by
every entity, HA synthesizes it from `media_image_url`/hash for media
players.)

**States**: `off`, `on`, `idle`, `playing`, `paused`, `buffering` (also
`standby` on some integrations). Source: same dev doc.

**Device classes** ([HA architecture discussion](https://github.com/home-assistant/architecture/issues/209), reflected in HA core): `tv`, `speaker`, `receiver` — three values only. Useful for
auto-picking a sensible default icon/fixture when binding (TV → screen
fixture prompt, speaker/receiver → speaker fixture prompt), but **not all
integrations set it** (many custom/HACS media_player entities leave
`device_class` unset), so treat it as a hint, never a requirement.

**Feature flags** (`MediaPlayerEntityFeature`, bitwise OR'd into
`supported_features`): `BROWSE_MEDIA`, `CLEAR_PLAYLIST`, `GROUPING`,
`MEDIA_ANNOUNCE`, `MEDIA_ENQUEUE`, `NEXT_TRACK`, `PAUSE`, `PLAY`,
`PLAY_MEDIA`, `PREVIOUS_TRACK`, `REPEAT_SET`, `SEARCH_MEDIA`, `SEEK`,
`SELECT_SOUND_MODE`, `SELECT_SOURCE`, `SHUFFLE_SET`, `STOP`, `TURN_OFF`,
`TURN_ON`, `VOLUME_MUTE`, `VOLUME_SET`, `VOLUME_STEP`. Diorama should read
this bitmask before offering a control (e.g. don't show a volume slider if
`VOLUME_SET` isn't set) — same spirit as how `MediaPlayerEntityFeature.GROUPING`
gates multi-room join UI in HA's own frontend.

**Services / actions** (domain `media_player`, from the
[integration doc](https://www.home-assistant.io/integrations/media_player/)):
`browse_media`, `clear_playlist`, `join`, `media_next_track`, `media_pause`,
`media_play`, `media_play_pause`, `media_previous_track`, `media_seek`,
`media_stop`, `play_media`, `repeat_set`, `search_media`, `select_sound_mode`,
`select_source`, `shuffle_set`, `toggle`, `turn_off`, `turn_on`, `unjoin`,
`volume_down`, `volume_mute`, `volume_set`, `volume_up`. All take
`entity_id`/`target` plus service-specific fields (`volume_level: 0..1` for
`volume_set`, `source: string` for `select_source`, `media_content_id` +
`media_content_type` for `play_media`).

**Relevance to Diorama's dispatch model**: `Planner.toggleEntity(entity_id)`
already does exactly the HA-recommended thing — read the domain, call
`<domain>.toggle` (fallback `homeassistant.toggle`). For **play/pause** this
generalizes cleanly: a new `Planner.mediaPlayPause(entity_id)` calling
`media_player.media_play_pause` (toggle semantics baked into the service
itself, so no state-read branch needed client-side). Volume and source need
their own thin wrappers (`Planner.setVolume(entity_id, level)` →
`media_player.volume_set`, `Planner.selectSource(entity_id, source)` →
`media_player.select_source`), added to **both** `HassClient` and
`HassPanelAdapter` per the repo's `HaApi` convention (CLAUDE.md "HaApi
additions must land in both").

**What's NOT possible / limits**:
- HA has no concept of "projector" as a domain or device class — a projector
  in HA is *usually* itself a `media_player.*` (many projectors expose one)
  or controlled indirectly via `switch`/`remote`/IR blaster, or not
  represented in HA at all (RS-232/IP-only control outside HA). Diorama's
  projector fixture must therefore support **binding to any of** a
  `media_player.*` (for on/off + input), a plain `switch.*`, or **nothing**
  (pure visual + `localState`, same "local control of unbound interactive
  objects" pattern already used for TVs/appliances).
- There is no HA attribute for "which speaker is currently loud" — multi-room
  volume-per-zone would have to come from `group_members` (which speakers are
  joined) plus each member's own `volume_level`; there's no single "loudness"
  telemetry to drive a pulse. The best available signal for "this speaker is
  active" is simply the owning `media_player`'s `state === 'playing'`
  (identical resolution already used for the appliance in-use glow).
- HA `media_player.play_media` requires the integration to support arbitrary
  content — many TV/AVR integrations only support `select_source`, not
  `play_media`; a generic "Play a movie" button in Diorama isn't safely
  generalizable and should be scoped to source-select + play/pause/volume
  only, matching what `mini-media-player`-style Lovelace cards expose.

### 2.2 Real-world screen / projector geometry

**Throw ratio** = throw distance ÷ image width (`D/W`); this is the standard
industry formula used by every calculator checked (ProjectorCentral, BenQ,
Epson, XGIMI). For a 16:9 screen, width ≈ diagonal × 0.872, height ≈ diagonal
× 0.490.

| Screen diagonal | Width (16:9) | Height (16:9) |
|---|---|---|
| 100″ | ~2214 mm (87.2″) | ~1245 mm |
| 120″ | ~2657 mm (104.6″) | ~1494 mm |

Elite Screens' actual 120″ fixed-frame product ("Sable Frame") lists viewing
area 59.0″H × 104.7″W with overall framed dimensions 63.5″H × 109.3″W × 1.6″D
— i.e. **≈1613 × 2776 × 41 mm** including the frame border (~65 mm of frame
per side over the raw viewing area). Source: Elite Screens spec pages via
retailer listings (elitescreens.com product family; exact PDF spec sheet
fetch 404'd, cross-checked against Amazon/Best Buy listings for the same
SKU — consistent numbers, medium confidence on the exact border width).

**Throw ratio bands** (ProjectorCentral / XGIMI / BenQ calculators, all
consistent): standard throw ≈ 1.2–2.0, short-throw ≈ 0.4–1.0, ultra-short-
throw (UST) ≈ 0.2–0.5. Worked example for a 120″ (2657 mm-wide) screen:
standard 1.5 ratio ≈ 13 ft (≈3960 mm) throw distance; short-throw 0.5 ratio ≈
4.3 ft (≈1310 mm); UST 0.25 ratio ≈ 2.2 ft (≈670 mm). A concrete real
projector, the **Epson Home Cinema 2150**: throw ratio range 1.33–2.16 (D:W),
2500 ANSI lumens, physical body **4.80″ × 12.20″ × 11.20″ (H×W×D)** ≈ **122 ×
310 × 284 mm**, ~3.5 kg. (Source: ProjectorCentral spec page.) That's a good
generic default body size for a ceiling-mount projector fixture.

**Screen gain**: a multiplier on reflected brightness vs. a reference matte
white screen (gain 1.0); ALR (ambient-light-rejecting) screens run gain
≈0.8–1.4, high-gain screens up to ~2.5–3 for narrow viewing cones. Not
something Diorama needs to simulate physically — it only matters as a reason
the beam-decal render should stay a flat toon-shaded translucent quad, not an
attempt at real photometric falloff.

### 2.3 Real-world speaker/subwoofer sizes

- **Floorstanding tower** (ELAC Debut 2.0 DF52, verified from manufacturer
  spec page): **1016 × 180 × 234 mm** (H×W×D), 15.6 kg. General guidance
  (Crutchfield/KEF/THX buying guides): floorstanding towers run roughly
  900–1200 mm tall, 150–250 mm wide, 250–400 mm deep, with 6.5–10″ woofers;
  bookshelf speakers are the compact alternative (4–6.5″ drivers, ~300–400 mm
  tall).
- **Subwoofer** (Klipsch R-12SW, 12″ driver, verified from retailer spec
  listing): **356 × 470 × 406 mm** (14×18.5×16 in), a squat cube-ish box —
  good generic default for a floor-standing sub fixture. THX/room-size
  guidance: 8–10″ drivers suit small rooms, 12″ is the medium-room sweet
  spot, 12–18″ (or multiples) for large rooms/dedicated theaters.
- **In-wall/in-ceiling speakers**: no single authoritative mm spec found (highly
  model-dependent — typically a shallow rectangular or round cutout, depth
  60–100 mm behind a flush grille); treat as a thin wall-mounted plate rather
  than modeling a cutout, closer to the existing switch-plate wall-snap
  fixture in spirit than to a floorstanding box.

### 2.4 Real-world tiered seating / recliners

From dedicated theater-seating industry sources (TheaterSeatStore, Valencia,
comfiroom), cross-checked across multiple pages for consistency:

- **Riser height**: commonly ~12″ (305 mm) per tier; range 12–18″, with many
  installers landing on 14–16″ (356–406 mm) as a practical sightline
  compromise.
- **Riser platform depth**: at least 48–60″ (1220–1524 mm) per row, to fit
  the seat plus full recline extension.
- **Row-to-row spacing** (back-of-seat to back-of-seat): tight/upright ≈20″
  (508 mm) legroom minimum; comfortable range 30–36″ (762–914 mm); full
  recline comfort 60–66″ (1524–1676 mm); rule-of-thumb "6–7 ft between rows"
  (1830–2130 mm) for a genuine reclined front row + walk-behind space.
  **These sources partially disagree on which measurement basis they're
  using** (legroom vs. full row-to-row vs. back-to-back) — treat as a
  200–2100 mm plausible band depending on desired density, not one true
  number.
- **Per-seat width**: general theater-seating guidance (Seatcraft/Valencia
  blog pages, not independently spec-verified per model) puts a single
  recliner position at roughly 22–24″ wide (560–610 mm), consistent with
  Diorama's existing `chair` default width (500 mm) and `sofa` seat pitch
  math (~504 mm per `SitSpot` on a sofa) — i.e. **no new pitch constant is
  needed**, the existing multi-seat spot-distribution logic already lands in
  the right range for theater recliners.
- **Aisle/walkway width**: ≥20″ (508 mm) on either side minimum, ~30″ (762 mm)
  recommended.

Confidence: HA `media_player` facts are **high confidence** (primary/dev
docs, cross-checked across 2 independent HA pages). Product dimensions
(ELAC, Klipsch, Epson, Elite Screens) are **high confidence** for the
specific SKUs cited, but are illustrative defaults, not universal
"the" answer — real installs vary widely and Diorama should keep every
size adjustable per-fixture like every other kind already is (`w`/`h`/`ht`
on `FurnitureKindDef`, per-fixture overrides in the sidebar). Riser/seating
spacing numbers are **medium confidence** (consistent across sources but
industry rules-of-thumb, not a code standard) — safe as UI-suggested
defaults, not hard constraints.

## 3. Diorama design / integration

Everything below is additive; nothing requires touching the fusion/BLE/geo
systems. Grouped by piece, each with the concrete recipe-step mapping from
CLAUDE.md's "Adding a canvas fixture" gotcha checklist.

### 3.1 Projection screen (reuse `wall_tv`, don't invent a new render path)

The simplest correct move: **do not add a new furniture kind for the screen**.
`wall_tv` already renders as a flat inset panel at a configurable width/height
with no stand (`three-renderer.ts` `case 'wall_tv'`, ~line 4237) and already
qualifies for `_nowPlayingGroup` via `isMediaPlayerId(fu.entity_id)` — any
`Furniture` with `kind: 'wall_tv'` bound to a `media_player.*` already shows
the shipped media card. All that's needed for a "theater screen" flavor is:

- A **bigger default footprint** variant. Add `home_theater_screen` to
  `FurnitureKind`/`FURNITURE_KINDS` in `geometry.ts`, cloning `wall_tv`'s
  build case but with screen-realistic defaults: `w: 2657, h: 60, ht: 2200`
  (120″ 16:9 width from §2.2; `ht` = mount height to screen **top**, so the
  bottom sits ~700 mm off the floor for eye-level viewing at riser distance),
  `back: 'none'`, `cat: 'appliance'`, `activity: 'watch_tv'`. Frame color
  slightly lighter than `wall_tv`'s bezel to read as a "screen" not a "TV".
- `three-renderer.ts._buildFurniture`: add a `case 'home_theater_screen':`
  that's a near-copy of `case 'wall_tv'` (bezel + inset screen quad,
  `screen` material via `_mat()`) but sized off the piece's own `w`/`ht`
  instead of the fixed `wall_tv` constants, and **skip the wall-bracket
  box** (screens are usually flush/recessed, not floating on a bracket arm).
- `canvas-render.ts.drawFurniturePrimitive`: add the `home_theater_screen`
  case, essentially `wall_tv`'s 2D case scaled to the new default box.
- No new dirty key: it's a `Furniture` entry, folds into `_keyFloor` (footprint/
  color/kind changes) and `_keyNowPlaying` (media state/title/picture) exactly
  like every other TV today. **Zero new Store fields.**

### 3.2 Projector fixture (new fixture type — the one genuinely new piece)

Model it as a **new fixture type**, not a `Light` and not `Furniture` — it has
no dimmable-brightness HA semantics (a `Light` implies `light.*` on/brightness/
color), but it does need a translucent beam decal like the floodlight's pool,
and an optional aim target. Mirror the **alarm-panel / BLE-proxy fixture
recipe** exactly (CLAUDE.md's "canvas-fixture recipe"):

**Types** (`types.ts`):
```ts
export interface ProjectorFixture {
  id: string;
  x: number; y: number;           // mm, ceiling/shelf mount point in plan
  height?: number;                // mm above floor; default 2400 (near ceiling)
  rotation?: number;              // degrees screen-CW; aim heading, default 0 (+Y)
  entity_id?: string | null;      // optional media_player.* (on/off + source) or switch.*
  localState?: string;            // local on/off when unbound (same pattern as Light/Door)
  targetScreenId?: string | null; // Furniture id of the screen it's aimed at (optional;
                                  // falls back to pure heading if unset/deleted)
  throwRatio?: number;            // default 1.5 (standard throw); informs beam length/width only
  beamColor?: string;             // hex, default '#dfe8ff' (cool white-blue)
  label?: string;
  locked?: boolean;
  hidden?: boolean;
}
```
Add `Floor.projectors: ProjectorFixture[]` with a `repairFloor`/`defaultFloor`
backfill `[]` (CLAUDE.md's explicit-field-list reminder applies — this is a
per-floor array like `robots`/`safetySensors`/`bleProxies`, not a top-level
`Store` field, so it goes in `repairFloor`'s explicit list, not
`Planner._loadFromHa`'s top-level list).

**Geometry defaults** (`geometry.ts`): default body box ~ Epson 2150 scale,
`122 × 310 × 284 mm` (H×W×D from §2.2) — small enough to read as a ceiling
puck at plan scale; a `PROJECTOR_DEFAULTS` const analogous to
`WINDOW_DEFAULTS`.

**2D** (`canvas-render.ts`): `drawProjectors(ctx, view, projectors, states)` —
small dark rounded-rect glyph (🎥/📽 or a drawn lens-circle) at `x,y`; when
bound + on (or `localState==='on'`), draw a **translucent triangular beam
wedge** from the projector position toward `targetScreenId`'s position (or
along `rotation` heading if no target), same visual idiom as the existing
motion-sensor FOV wedge / camera FOV wedge (`drawSafetySensors`-style glyph +
`drawMotionSensors`-style wedge — reuse the wedge-drawing helper those already
call rather than writing a new one). `hitProjector` for click/drag,
`hitFloorEdge`-style priority (fixtures before floor-edge, after nothing
else needed since it's a small point fixture like BLE proxies).

**Interact** (`canvas-interact.ts`): drag kind `'projector'`, tool `projector`
(🎥 or 📽, "Projector"), delete-tool branch, cursor branch — copy the BLE-proxy
block verbatim per the recipe.

**Sidebar** (`sidebar.ts`): `_section('projectors', 'Projectors', …)` — bind
row (media_player/switch via entity picker, domain hint `media_player`),
height/rotation/throwRatio numeric inputs, `targetScreenId` dropdown
(populated from `floor.furniture` filtered to `wall_tv`/`home_theater_screen`
kinds), beam color swatch, lock toggle. `TOOLS` array entry.

**3D** (`three-renderer.ts`): new `_projectorGroup` (declared alongside
`_alarmGroup`/`_bleGroup`; added to `scene.add`, `clearTransientGroups`,
`destroy`, `setLayerVisibility` under the **`sensors` layer** — a projector is
closer to "hardware fixture" than "furniture" for layer-gating purposes, same
call the codebase already made for alarm panels and BLE proxies). New
`updateProjectors(projectors, floorW, floorD, stateProvider)` builder: small
box body via `_mat()` (toon-shaded, dark plastic gray) + a lens-cylinder
accent, mounted at `height`; when on, a **translucent cone/wedge beam** mesh
(a flattened `THREE.ConeGeometry` or a custom triangular plane, `transparent`,
low opacity ~0.12–0.18, additive-ish `beamColor`, **no outline shell** — same
exemption class as the fog ground planes / weather particles, since a solid
inverted-hull outline on a translucent beam would look wrong) stretching from
the lens to the aim point; length/width derived from `throwRatio` and the
distance to `targetScreenId` (falls back to a fixed 3000 mm reach along
`rotation` if no target/target deleted). No shadow-map concerns (shadows are
already globally disabled).

**Dirty key** (`three-view.ts`): new `_keyProjectors` = `configRev` +
projector entity on/off states — same pattern as `_keyAlarm`/`_keyRobots`
(hash of bound entity states only, not per-frame). If a future "audio-reactive
beam pulse" is added, that would need the fireplace-style
**force-every-frame-while-on** exception (documented precedent:
"An ON fireplace light forces `updateLightsSwitches` every frame"), but a
static beam (recommended for v1 — see §5) does not.

**Click routing**: 3D raycast walker gains `userData.kind === 'projector'`
(alongside light/switch/media/alarm/robot/safety) → `planner.toggleItem`
(bound media_player/switch → `toggleEntity`; unbound → flip `localState`).
2D click-vs-drag gets the same branch. This reuses the *existing*
`toggleItem`/`effectiveState` resolver verbatim — no new dispatch code.

### 3.3 Speaker fixtures (floorstanding / in-wall / subwoofer)

Model as **new `FurnitureKind`s** (they're placed room objects with a
footprint, not HA-entity-driven light sources) rather than a new fixture
type — this reuses 100% of the existing furniture pipeline (drag/resize/
rotate/lock/sidebar editor/custom-object override) for free.

Add to `FURNITURE_KINDS` (`geometry.ts`), new `cat: 'theater'` (extends
`FurnitureCat`; `furnitureCat()`/sidebar optgroup already generalize over
whatever cats exist — CLAUDE.md: "the outdoor cat optgroup label entry was
also missing and is now added" is the precedent for "remember the optgroup
label"):

```ts
speaker_floor:  { label: 'Floorstanding speaker', w: 234, h: 234, ht: 1016,
                  back: 'none', color: 0x1a1a1a, cat: 'theater', frontArrow: false },
speaker_sub:    { label: 'Subwoofer', w: 406, h: 470, ht: 356,
                  back: 'none', color: 0x111111, cat: 'theater', frontArrow: false },
speaker_inwall: { label: 'In-wall speaker', w: 300, h: 60, ht: 300,
                  back: 'none', color: 0xd8d8d8, cat: 'theater', frontArrow: false },
```
(Dimensions from §2.3 — ELAC DF52 for floorstanding, Klipsch R-12SW for sub;
in-wall is a plausible thin plate since no universal spec exists.) An
optional `powerEntity?`-style **visual-only** field is unnecessary — reuse
the *room's* media_player state instead of a per-speaker binding, since
individually metering each speaker has no HA analog (see §2.1 "what's not
possible" — no per-speaker loudness telemetry). Simplest correct binding:
speakers don't get their own `entity_id`; instead the **pulse effect reads
the nearest/room's TV or receiver `media_player.*`** the same way `watch_tv`
already resolves "a bound, ON TV in this room" via `_tvsByRoom` — add a
parallel `_theaterAudioByRoom` (or just re-use `_tvsByRoom`'s `hasEntity`+
state, since in practice the screen's media_player *is* the audio source for
a receiver-driven theater) rather than inventing a second entity-binding UI.
**Recommendation: v1 ships with a static (non-pulsing) speaker cosmetic**,
and treats the pulse as a §5 stretch feature — it's the one piece here
without a clean 1:1 HA data source, so don't force a fragile binding just to
have an animation.

**3D builder** (`_buildFurniture` new cases): `speaker_floor` = tall narrow
box + circular driver cutout accents (two stacked cylinders inset slightly,
toon-shaded darker) — visually distinguish from `bookshelf`/`block`.
`speaker_sub` = a squat cube with a single large circular driver face.
`speaker_inwall` = a thin flush wall plate (mirrors the switch-plate /
in-wall-speaker-grille look: a shallow box + perforated-look darker inset)
— and per the switch/fireplace precedent, **wall-snap it** on drop/move-
release via a new `snapSpeakerToWall` (geometry.ts, same shape as
`snapSwitchToWall`/`snapFireplaceToWall`: offset = `WALL_HALF + plateDepth/2`,
rotation = `atan2(nx, ny)`).

**2D** (`drawFurniturePrimitive`): three new cases, simple labeled rects with
a driver-circle glyph for floor/sub kinds.

No new Store field, no new dirty key — these are ordinary `Furniture` items
riding `_keyFloor` exactly like every other kind.

### 3.4 Tiered recliner seating

Also **`FurnitureKind`s**, not a new system — Diorama's `SitSpot`/`def.seat`
machinery already handles multi-seat pieces (sofas/benches/sectionals) and
per-spot claims/approach-zones (CLAUDE.md "seating v2"). Add:

```ts
theater_recliner: { label: 'Theater recliner', w: 600, h: 900, ht: 1150,
                    seat: 480, back: 'tall', color: 0x2b2320, cat: 'theater',
                    activity: undefined }  // seating only; watch_tv resolves
                                           // from the room's TV via SitSpot.hostActivity
```
(600 mm width matches the "22–24 inch per seat" real-world figure from §2.4;
900 mm depth accommodates the reclined footprint without needing a literal
recline animation — the footprint is what matters for nav-blocking and
row-spacing, not a moving mesh.) `ht: 1150` gives a tall-backed recliner
silhouette. This is a **single-seat** kind (one `SitSpot` centered), so a "row
of 3" is three placed instances — consistent with how the existing sofa/bench
kinds are *pieces*, not "rows"; users lay out rows by placing + aligning
multiple recliners (the existing **smart alignment guides** feature — "the
dragged item's center snaps to align with peer centers of the SAME category
on X/Y" — already makes this easy for a category like `theater`/furniture).

**Riser platform** (optional, v1-skippable): expressed as `Furniture.elevation`
on a plain `block`/custom-object riser deck (custom objects already support
raised platforms — see `stair_landing`/`elevation` precedent) at ~300–400 mm
(12–16″ per §2.4), with recliners placed on top via the existing `mountOnId`
auto-snap-to-surface mechanism if the riser deck is authored with
`surface: true`. No new code needed — `surface`/`mountable` metadata already
generalizes to "any raised deck," a riser is just a wide flat `surface` piece
with `elevation` clearing the floor for the humanoid nav system (beds/rugs/
`elevation ≥ 300` already the exempted-from-nav-blocking cases per the nav
doc — a shallow riser deck under 300 mm height risks being treated as an
obstacle by `_buildNav`'s footprint inflation; **use `elevation` on the
recliners themselves rather than a separate riser furniture piece** to avoid
that nav interaction entirely, unless a true walkable-riser-deck 3D visual is
wanted, in which case flag it explicitly `elevation ≥ 300` so nav treats it as
occupiable like a bed).

`3D builder`: box seat + tall backrest + armrests, similar composition to the
existing `chair`/`sofa` cases but taller back and no legs (recliners sit low
to the floor on a plinth) — add `case 'theater_recliner':` to
`_buildFurniture` as its own small composite (plinth box + seat + back + 2
armrests), and to `drawFurniturePrimitive` for 2D.

**Activity wiring**: nothing new — `SitSpot.hostActivity` resolution already
special-cases "seat in a room with a bound ON TV" → `watch_tv` (CLAUDE.md:
"watch_tv only when a bound, ON TV sits in the seat's room"). A recliner
inherits this automatically as long as it doesn't set its own `activity`
(leave it `undefined` so the seated-context resolution — not a standing
anchor — drives it).

### 3.5 Bias / accent lighting behind the screen

No new fixture — this is an ordinary `Light` with `iconKind: 'strip'`
(already exists: "long thin LED bar") placed behind/around the screen
fixture, exactly the real-world bias-lighting product category (LED strip,
warm/cool white or RGB, low brightness). Nothing to build:
- Placement: drop a `strip` light behind the `home_theater_screen`/`wall_tv`
  piece; `lightHeight`/`rotation` position it flush to the wall like any
  strip light today.
- Color: bind to a real `light.*` (many bias-lighting products, e.g. Govee/
  Hue-style ambient strips, are already plain HA `light` entities with RGB —
  no special integration needed) or leave unbound with `localState` for a
  static cosmetic glow.
- The "sync to screen content" idea (Philips Hue Sync / Ambilight-style
  color-matching) is explicitly **out of scope for v1**: HA has no attribute
  exposing "dominant color of what's currently on screen," and doing real
  color-extraction from `entity_picture` album art would be a heavy,
  fragile addition (CORS-limited image fetch, per-frame canvas sampling) for
  a cosmetic payoff — flag as a §6 risk/dead-end, not a build target.

### 3.6 "Movie mode" (dim lights + arm bias lighting)

This does not need a new Store field or subsystem — it's a **UI convenience**
that calls existing primitives:
- A "🎬 Movie mode" toggle (topbar button or a sidebar theater-section
  button, edit-mode gated like every other write action) that, on activate:
  iterates the current floor's `lights` (optionally scoped to `Room`-grouped
  lights in the theater's room via the existing `resolveRoomForPointFuzzy`
  grouping already used by the sidebar's room-grouped sections) and calls
  `Planner.toggleEntity`/sets `localState` to dim/off, while turning the bias
  `strip` light on. This is literally the same shape as the shipped
  "Kiosk link" button — a client-side convenience wired to existing
  `Planner` methods, not a new persisted concept.
- If genuine **dimming** (not just on/off) is wanted, that requires the bound
  `light.*` to support brightness — call `light.turn_on` with
  `brightness_pct` via a small new `Planner.setBrightness(entity_id, pct)`
  (mirrors `setVolume`, HaApi addition in both clients) rather than
  `toggleEntity`. HA's own community "movie mode" pattern (verified via the
  [Home Assistant dim-lights-when-playing-media cookbook](https://www.home-assistant.io/cookbook/dim_lights_when_playing_media/))
  is exactly this: a scene/automation triggered off `media_player` state
  (`playing` → dim scene, `idle`/`paused` → normal scene). Diorama's flavor
  is a **manual one-click** version of that pattern from inside the panel,
  not a replacement for HA automations — power users who already have a
  `scene.movie_mode` in HA should be able to just bind the topbar button to
  call `scene.turn_on` on that scene instead (simplest v1: let the button be
  configurable to either "toggle a list of Diorama lights" or "call an
  arbitrary HA scene/script entity_id," reusing the entity-picker for the
  latter).
- Optional **auto-trigger**: extend `Planner._isSlowEntity`-driven state
  watching so that when the bound screen's `media_player.*` flips to
  `playing`, Diorama nudges the same dim routine automatically — but this
  duplicates what HA automations already do better (server-side, works even
  when no browser has Diorama open) — **recommend defer to HA automations**
  for the auto-trigger and keep Diorama's button manual-only, to avoid two
  systems fighting over the same lights (see §6).

### 3.7 Click-to-control (play/pause/volume/source)

The raycast/click plumbing already exists end-to-end for the screen fixture
(it's a `media_player`-bound `Furniture`, tagged clickable in `_buildFurniture`
per CLAUDE.md's "unbound TVs are tagged clickable... regardless of binding").
Today a single click **toggles** via `toggleItem`; a home-theater control
panel wants finer controls than one click can express, so:
- **Keep single-click = play/pause** (`Planner.mediaPlayPause`, new thin
  wrapper around `media_player.media_play_pause` — for a media_player this is
  more useful than a blunt on/off toggle, and still degrades gracefully:
  unbound → same `localState` flip as today).
- **Keep dblclick = open a control modal** (already the pattern: "Dblclick on
  a `light.*` entity → light config modal; dblclick on unbound → entity
  picker"). Add a `<diorama-media-modal>` (same shape as
  `<diorama-alarm-modal>`/`<diorama-light-config>`) with transport buttons
  (prev/play-pause/next), a volume slider (`volume_set`, gated on
  `MediaPlayerEntityFeature.VOLUME_SET` in `supported_features`), and a
  source dropdown (`select_source`, populated from `source_list`, gated on
  `SELECT_SOURCE`). This is a pure UI addition; no new dirty keys, no new
  renderer code — modals already sit outside the 3D dirty-key system
  entirely (they're Lit UI reading `planner.hass.states` directly).
- Projector click (§3.2) reuses the identical `toggleItem` path for on/off;
  if a projector is bound to a `media_player.*` (some projectors expose one)
  it can open the same media modal for input-select.

## 4. Setup / integration steps

**For an end user wiring up an existing physical theater**:
1. In HA, confirm entities exist: a `media_player.*` for the TV/receiver/
   streaming box, optionally `switch.*`/`media_player.*` for the projector,
   `light.*` for room + bias lighting. (No theater-specific HA integration
   is required — everything here rides ordinary `media_player`/`light`/
   `switch` domains.)
2. In Diorama (edit mode): place a `home_theater_screen` (or `wall_tv`) piece
   on the theater wall; bind its `entity_id` to the TV/receiver
   `media_player.*` via the entity picker (dblclick or the sidebar Bind row).
3. Place `theater_recliner` pieces in row(s); use alignment guides
   (automatic while dragging) to line them up; optionally raise a back row
   via `elevation` (or a `surface` riser deck) per §3.4.
4. Place `speaker_floor` / `speaker_sub` / `speaker_inwall` pieces around the
   screen/seating — cosmetic only in v1, no binding needed.
5. If there's a physical projector: switch to the **Projector** tool, drop it
   near the ceiling/mount point, set `height` (default 2400 mm), pick
   `targetScreenId` = the screen piece placed in step 2 (or leave unset and
   set `rotation` to aim manually), bind `entity_id` if the projector has one.
6. Add a `strip`-kind `Light` behind the screen for bias lighting; bind to
   the real bias-light `light.*` entity if present, else leave unbound and
   toggle `localState` for a static cosmetic.
7. (Optional) Wire "Movie mode": either point Diorama's movie-mode control at
   an existing HA `scene.*`/`script.*` that already dims the room (if the
   user already automates this), or select the room's lights directly for
   Diorama to toggle/dim on click.
8. Verify `npm run typecheck && npm run build` after adding the new
   `FurnitureKind`/`ProjectorFixture` types (per repo convention — no test
   suite, these two are the gates).
9. Test click paths: single-click screen → play/pause; dblclick → media
   modal (volume/source); click projector → on/off; click recliner → no-op
   (seating is passive, avatars auto-sit).

**For the developer implementing this** (ordered by the canvas-fixture
recipe, projector fixture path):
1. `types.ts`: add `ProjectorFixture` interface + `Floor.projectors: []`.
2. `geometry.ts`: `PROJECTOR_DEFAULTS`, new `FurnitureKind`s (`speaker_floor`,
   `speaker_sub`, `speaker_inwall`, `theater_recliner`,
   `home_theater_screen`), `snapSpeakerToWall` (for `speaker_inwall`).
3. `canvas-render.ts`: `drawProjectors`, new `drawFurniturePrimitive` cases,
   `drawAll` gating (projectors ride the `sensors` layer — add the group
   flag alongside alarm/BLE).
4. `canvas-hit.ts`: `hitProjector`.
5. `canvas-interact.ts`: drag kind `'projector'`, tool `'projector'`,
   delete-tool branch, cursor branch, click-vs-drag → `toggleItem`.
6. `sidebar.ts`: `_section('projectors', …)`, `TOOLS` entry, furniture
   sidebar already generalizes over new kinds (dropdown + w/h/ht + bind +
   activity/seat fields for the new furniture kinds need no sidebar code
   beyond the kind list itself).
7. `three-renderer.ts`: `_projectorGroup` + `updateProjectors`, new
   `_buildFurniture` cases for the 4 new furniture kinds, raycast
   `userData.kind === 'projector'` branch, `setLayerVisibility`/
   `clearTransientGroups`/`destroy` wiring.
8. `three-view.ts`: `_keyProjectors` dirty key, `_syncModel`-style tick call
   to `updateProjectors` when the key changes.
9. `planner.ts`: `mediaPlayPause`, `setVolume`, `selectSource`,
   `setBrightness` wrappers; `repairFloor` backfill for `projectors: []`.
10. `ha-client.ts` + `ha-panel-adapter.ts`: no new `HaApi` methods strictly
    required (all four wrappers above are just `call_service` on existing
    services) — only add if a typed helper is preferred over ad hoc
    `hass.callService`.
11. New Lit component `<diorama-media-modal>` in `modals.ts` (or a new file
    if `modals.ts` is getting large), following the alarm-modal shape.
12. Optional: a small `home-theater-test.html` deterministic test page
    (matches the repo's `test-pages/` convention) asserting furniture-kind
    defaults, projector beam aim math, and dirty-key stability.

## 5. Potential additional features

- **Audio-reactive speaker pulse**: once a real per-room "is audio playing"
  signal is wanted, gate a subtle scale/emissive pulse on `speaker_floor`/
  `speaker_sub` off the screen's `media_player.state === 'playing'`
  (`stateProvider` hash into `_keyFloor`, same pattern as the appliance
  in-use LED) — cheap, and doesn't need real audio analysis.
- **Projector beam dims with ambient light preset**: fold `Scene3D.preset`
  (day/dusk/night) into the beam's opacity so it barely shows in a bright
  "day" preset and reads clearly in "night" — mirrors how the sun-vs-toon-
  band tuning already works.
- **Screen "power on" animation**: a brief scale/opacity flicker on the
  screen quad when `media_player.state` transitions off→on, reusing the
  fade/scale-in idiom already used for humanoid spawn.
- **Popcorn/snack bubble tie-in**: the existing kitchen-night bubble pool
  (`BUBBLE_POOL_KITCHEN_NIGHT`, 🍪🍿 already present) already fires for
  standing idle in a kitchen at night — a seated-evening bubble pool
  (`BUBBLE_POOL_SEATED_EVE`, already includes 📺🍿) already covers "watching
  something," so a home theater room gets flavor bubbles for free with zero
  new code once recliners + a bound TV exist.
- **Popcorn machine / snack cart furniture kind**: a small `cat: 'theater'`
  appliance kind (`activity: 'make_coffee'`-style anchor, e.g.
  `activity: 'forage_fridge'` reuse or a new `get_snack` `ActivityKind`) for
  full "movie night" flavor — bigger lift (new `ActivityKind` + anchor
  wiring), reasonable v2 scope.
- **Multi-room audio group visualization**: draw a dashed link line between
  speakers/screens sharing a `media_player.group_members` relationship —
  cosmetic-only, no control implications, but genuinely useful for
  understanding a synced whole-home-audio layout at a glance.
- **Kiosk "theater remote" view**: a dedicated `?mode=kiosk&view=...` URL
  template (already supported infrastructure) scoped to a floor/layer preset
  showing just the theater room with the media modal one tap away — no new
  code, just a saved `view3d`/`layers` preset + a kiosk-link button per the
  existing mechanism.
- **Recliner recline animation**: a cosmetic 3D pose shift (backrest angle)
  when a `theater_recliner`'s `SitSpot` is occupied — nice-to-have polish,
  follows the existing sit-blend idiom (`bl(cur,tgt,w)`) used for every
  other seated pose refinement.

## 6. Open questions & risks

- **No HA-side "home theater" domain**: everything here is an assembly of
  generic `media_player`/`light`/`switch` primitives; there's no single
  integration to point at, so setup burden falls on the user correctly
  identifying which entity is "the screen" vs. "the receiver" vs. "the
  projector" — Diorama can't auto-detect a coherent theater setup from HA's
  registry alone (unlike, say, LD2450 slug-based auto-discovery).
- **Projector-in-HA fragmentation**: some projectors are full `media_player`
  entities (rich control), some are bare `switch`/`remote` (on/off only, no
  input-select), and some have zero HA presence (proprietary RS-232/IP app
  only) — the projector fixture's binding UI needs to gracefully degrade
  (feature-flag-gate the modal's buttons on `supported_features` / plain
  binary for a `switch`), and for the "no HA presence" case the fixture is
  purely decorative (`localState` only) — set that expectation, don't
  promise universal projector control.
- **No per-speaker or per-channel audio telemetry**: ruled out a "true"
  audio-reactive visualization (§2.1); any pulse effect is necessarily a
  coarse "is *a* media_player in this room playing" proxy, not real
  loudness/frequency data. Flag to the user as cosmetic, not accurate.
- **Bias-lighting content-sync (Hue Sync-style) is a dead end for v1**: no
  HA attribute exposes on-screen dominant color; building it would mean
  fetching `entity_picture` album art client-side (already done for
  now-playing cards) and extracting a color from *that* image — which is
  cover art, not actual video frame content, so it would only ever
  approximate music-mode ambient lighting, not real Ambilight-style video
  sync. Worth stating explicitly so nobody scopes it expecting TV-frame-
  accurate sync.
- **Movie-mode double-automation risk**: if a user already has an HA
  automation/scene that dims lights on `media_player` state, and Diorama
  *also* auto-triggers dimming from the panel, the two could race or
  fight (e.g. HA's automation turns lights back up while Diorama just
  dimmed them). Recommendation in §3.6 (manual button, or delegate to an
  existing HA scene) is specifically to avoid this — flag clearly in any
  implementation that auto-trigger-from-Diorama is a deliberate opt-in, not
  a default.
- **Riser deck vs. nav-blocking**: per §3.4, a physical riser platform under
  the nav system's `elevation ≥ 300` exemption threshold could get treated
  as an obstacle by `_buildNav`'s footprint inflation for avatars walking
  past/around it, producing an avatar that awkwardly routes around a normal
  step-up. Mitigated by using `elevation` on individual recliners rather than
  building a literal walkable riser mesh, at the cost of not visually showing
  a riser platform in 3D. If a real riser deck mesh is wanted later, it needs
  explicit nav-exemption testing (the existing bed/rug/`elevation≥300`
  exemption list would need the riser kind added, and should get a
  regression test akin to `bookcase-los-test.html`).
- **Speaker/recliner dimension defaults are illustrative, not standards**:
  every mm number above (speaker sizes, riser height, row spacing) comes
  from specific product specs or industry rule-of-thumb blog guidance, not
  a code/standard body (no equivalent of a building-code number here) —
  ship them as *editable defaults* (same as every other furniture kind
  already is), never hard-code assumptions elsewhere in the system.

## 7. Sources

- [Media player entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/media-player/) — attributes, states, `MediaPlayerEntityFeature` flags.
- [Media player — Home Assistant integration docs](https://www.home-assistant.io/integrations/media_player/) — service/action list.
- [Home Assistant Cookbook: Dim lights when playing media](https://www.home-assistant.io/cookbook/dim_lights_when_playing_media/) — movie-mode automation pattern.
- [Add device_class to media_player platform · home-assistant/architecture#209](https://github.com/home-assistant/architecture/issues/209) — `MediaPlayerDeviceClass` values (tv/speaker/receiver).
- [ProjectorCentral: Epson Home Cinema 2150 specs](https://www.projectorcentral.com/epson-home_cinema_2150.htm) — projector physical dimensions, throw ratio, lumens.
- [ProjectorCentral Projection Calculator Pro](https://www.projectorcentral.com/projection-calculator-pro.cfm) — throw ratio / throw distance methodology.
- [BenQ Projector Installation Calculator](https://www.benq.com/en-us/knowledge-center/knowledge/projector-installation-calculator.html) — throw distance guidance.
- [XGIMI: Projector Throw Ratio & Distance Setup Guide](https://us.xgimi.com/blogs/projectors-101/projector-throw-ratio-distance-setup-guide) — throw ratio bands by projector type.
- Elite Screens 120″ Sable Frame fixed-frame screen dimensions — cross-checked via retailer listings (Amazon/Best Buy product pages for ER120DHD3/ER120WH2).
- [ELAC Debut 2.0 DF52 product page](https://elac.com/df52) — floorstanding speaker dimensions.
- Klipsch R-12SW 12″ subwoofer dimensions — via retailer/manufacturer product listings (klipsch.com, worldwidestereo.com).
- [TheaterSeatStore: Home Theater Riser Platform Guide](https://www.theaterseatstore.com/blog/home-theater-riser-guide) — riser height/depth guidance.
- [Valencia Theater Seating: Home Theater Seating Layout & Spacing](https://us.valenciatheaterseating.com/blogs/knowledge-center/home-theater-seating-layout-spacing) — row spacing/aisle guidance.
- [comfiroom: Home Theater Riser Height Guide](https://comfiroom.com/blogs/cinematic-home-guide/home-theater-riser-height-guide-calculating-sightlines) — riser sightline math.
- Repo source (this codebase): `src/types.ts`, `src/geometry.ts`, `src/three-renderer.ts`, `src/canvas-render.ts`, `src/ui/three-view.ts` — grounding for exact existing field names, dirty-key names, and function names cited throughout §3–4.
