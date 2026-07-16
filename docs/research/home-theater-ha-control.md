# Home theater HA control surfaces — build-ready research

Status quo check (read this first): Diorama **already ships the core of a
home-theater screen**. `FURNITURE_KINDS` (`geometry.ts` ~L1255-1256) has `tv`
(1450×250 mm footprint, 1100 mm mount height, `cat: 'appliance'`,
`activity: 'watch_tv'`) and `wall_tv` (1300×180 mm, 1550 mm height, same
activity) — both bind a `media_player.*` entity_id (sidebar wires the domain
picker to `'media_player'` specifically when `furnitureKind(piece) === 'tv'`,
`ui/sidebar.ts` ~L2877). `three-renderer.ts` already: groups bound TVs by the
room they sit in (`_tvsByRoom`, ~L836-838, populated in `updateFloor` when
`fu.kind === 'tv' || def.activity === 'watch_tv'`, ~L2453), drives a seated
avatar's `watch_tv` activity only when a bound **ON** TV exists in that room
(~L7200-7204), and renders a camera-facing **now-playing card** above ANY
`media_player`-bound furniture — not just TVs — via `parseNowPlaying`/
`isMediaPlayerId` (`geometry.ts` ~L968-988) into a dedicated `_nowPlayingGroup`
(outside `_floorGroup` so it survives `_keyFloor` rebuilds; its own
`_keyNowPlaying` = configRev + layer flags + per-media `id:state:title:picture`
hash — see CLAUDE.md "Roborock live position & media now-playing"). None of
that is theater-specific — it fires for a kitchen radio media_player exactly
the same way.

What's **missing** — and what this doc specs out — is everything *around* the
screen: an AV receiver / amp fixture, a Harmony-style universal-remote
activity control, a projector + drop-down screen pair (a natural reuse of the
already-shipped window-blind roller-shade primitive), a "movie mode"
scene/script hook wired into Diorama's scene3d lighting presets and camera
system, and optional bias-lighting (Hue Sync Box) sympathy glow on Diorama's
existing `Light` fixtures. All of it rides the **canvas-fixture recipe**
(types → geometry defaults → canvas-render/hit/interact → sidebar + `TOOLS` →
three-renderer group + dirty key) that every other fixture in this codebase
already follows — there is no new mechanism to invent, only entities to bind
and a few new `FurnitureKind`/fixture types to add.

## 1. Summary

A home theater is the single highest "wow" scene for a kiosk/theater skin:
one room, several devices, and a very legible before/after (lights up, screen
off → lights down, screen glowing, screen dropping from the ceiling). Home
Assistant's media/AV control surface for this room is genuinely fragmented —
there is no single "home theater" domain — so the practical design is: bind
what's real per-installation (an AVR is `media_player.*` from whichever
vendor integration matches the hardware; a screen is a generic `cover.*`; a
universal remote is `remote.*`), and let unbound pieces render as inert
show-props (matching Diorama's existing local-control convention for
furniture/lights/switches). This doc gives the exact HA attributes/services
for each control surface a real theater room has (screen/TV, AVR, universal
remote/activities, projector, motorized screen, ambient/bias lighting) with
doc links, plus real-world millimeter dimensions for the new geometry
(AV rack unit, projector body + ceiling mount, screen sizes at 100"/120"
16:9, theater recliners + risers) so the furniture/fixture defaults in
`geometry.ts` can be authored without re-deriving them, plus a concrete
mapping onto Diorama's existing dirty-key/canvas-fixture/scene3d machinery.

## 2. Platform / data model / real-world facts

### 2.1 `media_player` domain — the screen + the AVR + multi-room audio

Core building-block domain; every AVR/soundbar/TV/streaming-box integration
implements the same entity contract.
[Developer docs](https://developers.home-assistant.io/docs/core/entity/media-player/) ·
[User-facing integration page](https://www.home-assistant.io/integrations/media_player/) ·
[`media_player.join` action reference](https://www.home-assistant.io/actions/media_player.join/)

**States** (`MediaPlayerState`, all lowercase on the wire): `off`, `on` (on but
detail unknown), `idle` (on, accepts commands, nothing playing), `playing`,
`paused`, `buffering`, plus the universal `unavailable`/`unknown`.

**Attributes** (all optional — presence gated by `supported_features`):

| Attribute | Notes |
|---|---|
| `source` / `source_list` | Current input + the full input vocabulary (e.g. `"HDMI 1"`, `"Blu-ray"`) |
| `volume_level` | float 0.0–1.0 |
| `is_volume_muted` | bool |
| `sound_mode` / `sound_mode_list` | e.g. `"Dolby Atmos"`, `"DTS:X"`, `"Stereo"` — receiver-defined vocabulary, not standardized across vendors |
| `media_title` / `media_artist` / `app_name` | now-playing metadata — this is what Diorama's `parseNowPlaying` already reads |
| `media_duration` / `media_position` | seconds |
| `entity_picture` | album-art/now-playing image URL — already consumed by `_nowPlayingGroup` |
| `group_members` | "a dynamic list of player entities which are currently grouped together for synchronous playback" — multi-room audio (Sonos/HEOS/MusicCast-style) |
| `shuffle` / `repeat` | bool / `RepeatMode` enum |

**`MediaPlayerEntityFeature` bitmask** (subset relevant to a theater rig):
`TURN_ON`, `TURN_OFF`, `VOLUME_SET`, `VOLUME_MUTE`, `VOLUME_STEP`,
`SELECT_SOURCE`, `SELECT_SOUND_MODE`, `PLAY_MEDIA`, `PAUSE`/`PLAY`/`STOP`,
`GROUPING` (gates `join`/`unjoin`), `BROWSE_MEDIA`.

**Services/actions** (all `media_player.*`): `turn_on`, `turn_off`, `toggle`,
`volume_set` (`volume_level: 0..1`), `volume_up`/`volume_down`,
`volume_mute`, `select_source` (`source: string`), `select_sound_mode`,
`media_play`/`media_pause`/`media_stop`/`media_play_pause`,
`media_next_track`/`media_previous_track`, `play_media`, `shuffle_set`,
`repeat_set`, `clear_playlist`, and grouping:

```yaml
action: media_player.join
target:
  entity_id: media_player.living_room_avr
data:
  group_members:
    - media_player.kitchen
    - media_player.bedroom
```
`target` is the group leader that keeps playing; `group_members` follow it.
`media_player.unjoin` removes one player from its group. **Not possible**:
there is no standard cross-vendor guarantee that grouping actually works
between different brands — it's per-integration (Sonos groups Sonos, HEOS
groups HEOS, MusicCast groups MusicCast; there is no universal audio-group
protocol HA can bridge for you).

**The Universal media player** (`media_player.universal`,
[docs](https://www.home-assistant.io/integrations/universal/)) is the
standard glue for a real theater rig split across devices: it combines several
child entities into one virtual `media_player`, e.g. "volume/power/sound_mode
from the AVR, title/art from the streaming box, source list mapped to Harmony
activities." It works via **YAML-templated attribute/command overrides** (no
UI wizard) — `attribute_templates` remap e.g. `state` from a switch's on/off,
`command_templates` remap e.g. `turn_on` to a different service call per
child. This is the officially-documented pattern for "one logical theater
entity out of an AVR + a streaming box + a Harmony remote," and it's exactly
the shape a Diorama user would want to bind to a single theater fixture.

### 2.2 `remote` domain — Harmony Hub & universal-remote activities

Building-block domain (no direct "Remote" integration to add; other
integrations — Harmony, Broadlink, etc. — implement it).
[Developer docs](https://developers.home-assistant.io/docs/core/entity/remote/) ·
[Remote domain overview](https://www.home-assistant.io/integrations/remote/) ·
[Harmony Hub integration](https://www.home-assistant.io/integrations/harmony/)

**Attributes**: `is_on` (bool), `current_activity` (string — the active named
Harmony activity, e.g. `"Watch Movie"`, `"PowerOff"`), `activity_list` (all
programmed activities). **Supported features**: `LEARN_COMMAND`,
`DELETE_COMMAND`, `ACTIVITY`.

**Services**: `remote.turn_on` (optional `activity:` name-or-id — this is
literally "start this activity," the Harmony equivalent of a movie-mode
macro that powers the AVR/projector/screen/lights in sequence),
`remote.turn_off` (kills the current activity, powers everything down),
`remote.toggle`, `remote.send_command` (raw IR/BT command passthrough, with
repeat/delay), `remote.learn_command`/`remote.delete_command`. Harmony-specific
extras: `harmony.sync` (re-pull activity/device config from the Harmony
cloud), `harmony.change_channel`.

Practical template for reading the active activity into a Lovelace/automation
condition: `state_attr('remote.family_room', 'current_activity')`, or in an
automation trigger: `trigger.to_state.attributes.current_activity == 'Watch Movie'`.

**Setup**: auto-discovery via Settings → Devices & Services, or manual by
hub IP; a `harmony_UNIQUE_ID.conf` file is written to the HA config dir on
first connect listing every activity ID/name and device/command it knows
about (useful for authoring a Diorama activity-picker UI without querying HA
live). Some older hub firmware needs XMPP enabled in the Harmony app for HA to
talk to it.

**Risk flag** (see §6): Logitech discontinued Harmony **hardware**
manufacturing in April 2021; support for the oldest first-gen remotes
(670/720/880/1100i-class) ended May 28 2025, but the Hub/Elite-class hardware
and the MyHarmony app/cloud/database are still confirmed operating as of
2026 — the HA integration talks to the hub locally (not the app), so it
survives independent of app-store fate, but it is a legacy platform with no
new hardware and a slow-motion sunset trajectory. Don't design around
"everyone has one" — it's the best-known but not the majority path in a 2026
build.

### 2.3 AV-receiver integrations (the physical rack unit)

No universal "AVR" domain — every brand is its own HA integration, all
converging on `media_player` + `select_source` + `select_sound_mode`, but
each with **different limits**:

- **Denon / Marantz** — one integration (`denonavr`) covers both, since
  Marantz shares Denon's protocol.
  [Docs](https://www.home-assistant.io/integrations/denonavr/). Auto-discovery
  or manual IP; config options: show-all-sources, Zone 2/Zone 3 (become
  additional full-featured `media_player` entities), Telnet (real-time push
  status — **limited to one connection at a time**, so a second controller
  app will fight it), optional Audyssey-settings sync (can take up to 10 s).
  ~80 named models covered plus "other Denon (untested)" and "Marantz
  (experimental)." Required ports: 23, 8080, 60006/TCP. **Not possible**: two
  simultaneous Telnet clients on some older models (e.g. AVR 3808CI) —
  whatever else you use to control the receiver (app, IR) can silently break
  HA's connection.
- **Onkyo / Integra / Pioneer** — one integration (`onkyo`),
  [docs](https://www.home-assistant.io/integrations/onkyo/). UI-config only
  (YAML import path removed in HA 2024.11). Covers Onkyo/Integra net receivers
  2011+ and Pioneer net receivers 2016+. Config includes volume-resolution
  steps (50/80/100/200) and custom source/listening-mode name mapping.
  Multi-zone → additional media_players. Requires "Network Standby" enabled
  on the unit. HA's own integration-quality rating is **Bronze** (lower
  maturity tier) — expect rough edges. A HACS custom fork
  (`fleXible/ha-onkyo-custom`) exists for HomeKit-exposure fixes.
- **Yamaha** — two *different* integrations depending on product line:
  `yamaha` (legacy YXC/AVENTAGE network-receiver protocol, includes NET RADIO
  `play_media`) vs `yamaha_musiccast` (current MusicCast ecosystem,
  [docs](https://www.home-assistant.io/integrations/yamaha_musiccast/)).
  MusicCast additionally surfaces **`select`** entities (dimmer brightness,
  surround-decoder type, sleep timer, EQ/tone-control mode, link audio
  delay/quality), **`number`** entities (per-zone EQ high/mid/low, bass/treble
  tone, dialogue level/lift, DTS dialogue control), and **`switch`** entities
  (speaker A/B, party mode, bass extension, pure-direct, adaptive DRC) — a
  genuinely richer entity surface than the plain-media_player brands, useful
  if Diorama ever wants a sidebar "AVR detail" sub-panel. Zone caveat: "not
  possible" to group media_player entities of *different zones on the same
  device* into separate multi-room groups, and non-main zones can't be a
  group master.
- **Anthem** — official `anthemav`
  [integration](https://www.home-assistant.io/integrations/anthemav/), local
  push over a persistent network socket. Covers current + one prior
  generation: MRX 540/740/1140 & MRX 520/720/1120 (current), MRX 310/510/710
  (previous), AVM 60/70 processors, MDX 8/16 + Martin Logan MDA 8/16
  distribution amps. **Not possible**: tuner control, transport controls
  (play/pause/next/prev) are unsupported by the integration even though the
  hardware has them; and — a sharper limitation than Denon's — **the
  integration holds the receiver's one control socket exclusively**, so
  Anthem's own mobile app AND their ARC-2 room-calibration software **cannot
  connect while HA is running**; you must disable the integration + restart HA
  to run ARC-2. Older RS-232 serial models (D2v-class) aren't supported by the
  official integration; community `anthem-serial`/`hass-anthemav-serial`
  custom components target that older serial protocol specifically.

### 2.4 Projector control

- **Epson** — official
  [`epson`](https://www.home-assistant.io/integrations/epson/) integration,
  creates a **media_player** entity (not separate switch/sensor/select
  entities in the official build — a Diorama author should not assume a
  standalone `sensor.lamp_hours` exists; it is not documented as an exposed
  attribute). Controls: power on/off, input/source select, color-mode
  (including lamp high/low), volume up/down + mute, track next/prev (some
  ESC/VP21 units expose disc-transport-like commands). Connects over **LAN**
  (HTTP or TCP, enter the projector's IP) or **serial** (direct cable or a
  ser2net proxy at 9600 baud). Requires the projector to be **powered on**
  during initial HA setup. Works with any Epson projector implementing the
  **ESC/VP21** command protocol (confirmed tested: EH-TW5350/TW7000/TW9400W/
  TW3200, PowerLite W39 — a wide swath of Epson's consumer/home-cinema line
  uses ESC/VP21). For *push* power-state notifications rather than polling,
  the projector's own "Standby Mode" must be set to keep networking alive in
  standby (labelled "Communication On" or similar depending on firmware).
  Two actively-maintained **community alternatives** exist for newer models:
  `amosyuen/ha-epson-projector-link` and a fork specifically targeting modern
  LS11000/LS12000-class laser projectors
  (`mag1024/epson-projector-modern-homeassistant`) — worth flagging to users
  whose model predates or postdates the official integration's tested list.
- **PJLink** (generic, cross-vendor) —
  [official integration](https://www.home-assistant.io/integrations/pjlink/),
  also a **media_player**. PJLink is an industry-standard projector control
  protocol (many brands besides Epson implement it — see the
  [PJLink spec](https://pjlink.jbmia.or.jp/english/index.html)). Setup needs
  host, port, and password (PJLink's built-in auth). This is the right default
  recommendation for "any brand of network projector" rather than assuming
  Epson. Documented feature surface is thin (no exposed lamp-hours/detailed
  attribute list in the HA docs) — treat it as power + input-source only for
  planning purposes. Low install base (~291 reporting installs at last
  public count) — low but real signal that most theater builders wire their
  projector through the AVR/Harmony activity rather than direct HA control.

### 2.5 Motorized projector screens (`cover` domain)

No first-party "screen" integration; screens ride the generic **`cover`**
domain, same domain as Diorama's existing `Window.coverEntity` blinds. Two
concrete paths:
1. **Dedicated integration**: `rrooggiieerr/homeassistant-xyscreens`
   ([GitHub](https://github.com/rrooggiieerr/homeassistant-xyscreens)) talks
   RS-485 to XY Screens / SeeMax-brand motorized screens and lifts —
   surfaces as a `cover` entity.
2. **DIY relay/roller control**: any Sonoff/Tasmota or ESPHome relay driving
   the screen motor's up/down/stop contacts, wired into HA as an MQTT/ESPHome
   `cover`.

**Cover semantics gotcha** (documented in HA's own cover-entity guidance and
confirmed across the screen threads): `cover.open` conventionally means
"raise" and `cover.close` means "lower" — which is **backwards** for a
projector screen (you want it **down** to watch a movie). The fix is the
same `cover` entity's `position`-based mental model Diorama already uses for
window blinds: a screen "position 100 = fully retracted (open)" reads
correctly through `doorOpenFraction`'s existing cover branch (`'open'→
position/100 (else 1)`, `'closed'→position/100 (else 0)`) *if* the screen's
own `position` attribute follows normal cover convention — no code change
needed on Diorama's resolver, only a labeling note in the sidebar UI so users
don't get confused about which direction is "showtime."

### 2.6 HDMI-CEC (in-band TV/AVR control, zero extra hardware on a Pi)

[Official integration](https://www.home-assistant.io/integrations/hdmi_cec/).
HDMI-CEC is a one-wire signalling protocol on HDMI pin 13 — devices in the
chain (TV, AVR, streaming box) can command each other with **no network
config or pairing**. On Home Assistant OS running on a **Raspberry Pi 4/5**,
the Pi's own HDMI port doubles as a CEC adapter — literally just plug an HDMI
cable from the Pi to the TV/AVR. Any other host (NUC, VM, generic x86) needs
a **Pulse-Eight USB-CEC adapter**. Creates `media_player` entities per
discovered CEC device (power, volume, mute, source-select all map to normal
media_player services) plus a `select-active-source`/"power on all"/"standby
all" action set. A **CEC Scanner add-on** exists to enumerate device
addresses before writing the YAML config (still YAML-configured, not a UI
flow, per current docs). This is a strong *cheap-hardware* path for a
Diorated theater room that already runs on a Pi.

### 2.7 "Movie mode" pattern (scene/script, not a domain)

There is no dedicated "movie mode" entity type anywhere in HA — it's always
authored as a **scene** + **automation/script**, using `media_player` state
as the trigger. HA's own cookbook
([dim_lights_when_playing_media](https://www.home-assistant.io/cookbook/dim_lights_when_playing_media/),
title still resolves via search cache though the live page 404s as of this
research pass — treat as historical/cached reference, verify before citing to
end users) documents the canonical shape: two `scene`s ("normal" — e.g. two
lights at 150/215 brightness, 2 s transition; "dim" — same lights at 75/145),
an automation on `media_player.state` transitioning `idle→playing` (apply the
dim scene) and `playing→idle` (apply normal), gated by a `sun` condition so it
only dims after dark. `scene.apply`/`scene.turn_on` both accept a
`transition:` seconds param for a smooth crossfade — this is the mechanism,
not a hard-coded "movie mode" toggle. A newer community blueprint, **"🎥 Movie
Mode Light Control"**
([community thread](https://community.home-assistant.io/t/movie-mode-light-control/886100),
posted May 2025), packages the same idea as a drop-in blueprint: detect
media_player→playing, optionally prompt via notification, turn off
selected lights/switches, restore on pause/stop.

### 2.8 Ambient / bias lighting sync

- **Philips Hue Play HDMI Sync Box** — no official HA integration; a mature
  **custom** integration, `mvdwetering/huesyncbox`
  ([GitHub](https://github.com/mvdwetering/huesyncbox),
  [community thread](https://community.home-assistant.io/t/philips-hue-play-hdmi-sync-box-custom-integration/204772),
  HACS-installable). Exposes: box on/off, sync on/off (turning sync on also
  turns the box on), brightness, intensity, **mode** (video/music/game —
  selecting a mode also starts sync), **HDMI input select**, and
  **entertainment-area select** (must name-match the area configured in the
  Hue app). This is the standard "bias lighting reacts to on-screen color"
  product for a theater room and maps naturally onto Diorama's *already
  existing* `Light` fixtures if the user's bias-light strip is itself a Hue
  entertainment-area light — Diorama doesn't need new geometry, only a
  sidebar affordance to show sync-box on/off state near the TV.
- **Adaptive/Circadian lighting** (`basnijholt/adaptive-lighting`,
  [GitHub](https://github.com/basnijholt/adaptive-lighting), the actively
  maintained successor to the older `circadian_lighting` component) is a
  general ambient-lighting automation (sun-position-driven brightness/color
  temp), not theater-specific, but frequently paired with movie-mode
  automations to suspend/override during a movie. Configurable via UI
  (Settings → Devices & Services) or YAML.

### 2.9 Real-world dimensions (for `geometry.ts` defaults, all mm)

| Object | Dimension | Source |
|---|---|---|
| Standard AV rack rail width | 482.6 mm (19 in) | [AVSForum std-component thread](https://www.avsforum.com/threads/standard-component-dimensions.281529/) |
| 1 rack unit (1U) | 44.45 mm (1.75 in) | same |
| Typical rack AVR height | 3U–5U (133–222 mm) | same |
| Flagship AVR body | ≈435 × 191 × 473 mm (W×H×D) | [Denon AVR-X3300W manual](https://manuals.denon.com/AVRX3300W/NA/EN/GFNFSYzjlkmxom.php)-class spec sheets |
| Home-theater projector body (Epson HC 5050UB, representative mid/high-end) | 521 × 193 × 450 mm (W×H×D), ≈11.2 kg | [ProjectorCentral spec](https://www.projectorcentral.com/epson-home_cinema_5050ub.htm) |
| Epson universal ceiling-mount kit (ELPMBPJG) | mount plate 102×112×112 mm + 76 mm extension column | [Epson product page](https://epson.com/Accessories/Projector-Accessories/Universal-Projector-Mount-(ELPMBPJG)/p/V12H808001) |
| 100" 16:9 screen | 2214 × 1245 mm (diagonal 2540 mm) | computed from the 16:9 diagonal formula, cross-checked against [projector-screen-material.co.uk size table](https://projector-screen-material.co.uk/tools/dimension-tables/size-table/) |
| 120" 16:9 screen | 2656 × 1494 mm (diagonal 3048 mm) | same formula (`w = d·16/√337`, `h = d·9/√337`); community sources round to ≈2642×1473 mm from whole-inch truncation — either is fine for a 3D prop |
| Short-throw distance | ~0.9–2.4 m (3–8 ft) projector-to-screen | [Epson throw-distance guide](https://epson.com/projector-guide-how-to-buy-a-projector-throw-distance-and-positioning) |
| Long-throw (center-ceiling) distance | can exceed 3.5 m depending on throw ratio (e.g. ≈11.75 ft min for a 120" screen at throw ratio 1.35) | [ProjectorCentral throw calculator, 5050UB example](https://www.projectorcentral.com/Epson-PowerLite_Home_Cinema_2040-projection-calculator-pro.htm) |
| Theater recliner seat width | 559–660 mm (22–26 in) | [theaterseatstore standard sizing](https://www.theaterseatstore.com/size/standard-sized-hts) |
| Recliner seat height / upright depth | ≈457 mm / ≈508 mm | same |
| Recliner overall height | 965–1067 mm (38–42 in) | same |
| Recliner reclined footprint depth | 1651–1905 mm (65–75 in) | same |
| Riser platform module width | 813 mm / 965 mm (32 in single-add / 38 in single-seat) | [theaterseatstore riser guide](https://www.theaterseatstore.com/blog/home-theater-riser-guide) |
| Riser height (single tier) | ≈178–203 mm (7–8 in); a common commercial module is 7.75 in ≈ 197 mm | [SeatUp 7.75" riser](https://seatup.com/7-75-inch-home-theater-riser-platform) |

## 3. Diorama design / integration

### 3.1 The screen — already shipped, needs no new code
`tv`/`wall_tv` `FurnitureKind`s already bind `media_player.*`, already drive
`watch_tv`, already render now-playing art. **Action for this feature**: none
required for the screen itself. If a receiver-driven Universal media player
(§2.1) is what the user actually has, they simply bind the TV fixture's
`entity_id` to that `media_player.universal.*` entity instead of the raw
streaming-box entity — Diorama doesn't care, it's just a media_player id.

### 3.2 New fixture: AV receiver / rack (`FurnitureKind: 'av_receiver'`)
Add to `FURNITURE_KINDS` (geometry.ts) as a rack-mount box: default
`w: 450, h: 191, ht: 400` (elevated on a rack shelf per the §2.9 dims — treat
like a `mountable` piece the way `coffee_maker`/`toaster` sit on a `surface`
counter, OR give it its own floor footprint as a low AV-cabinet piece with
`cat: 'appliance'`). Binds a `media_player.*` (denonavr/onkyo/musiccast/
anthemav/universal — all present the same domain, so **no per-vendor
branching needed in Diorama's own code** — the vendor differences in §2.3 are
purely "does the user's real hardware support X," not something Diorama's
renderer needs to special-case). Reuses the existing appliance-in-use LED
glow (`_buildFurniture`'s green pulsing-LED-on-ON-state, already generic for
any `cat: 'appliance'` piece per CLAUDE.md's "Device-state bindings on
structural items" section) — an AVR playing shows the same glow a washer/TV
shows today, for free. Optional stretch: a small emissive `sound_mode` text
plaque using the same CanvasTexture-sprite idiom as env-sensor readouts /
oven temp chips (`entity-value-display.md`'s planned generic primitive is the
natural long-term home for this — don't build a bespoke sprite path, wait for
that shared primitive if it lands first).

### 3.3 New fixture: universal remote / activity panel
Model this **exactly like `AlarmPanel`** (`types.ts` ~L213-223) — it's the
closest existing shape (a wall-plate-or-tabletop fixture bound to one entity
whose *state string itself* is the meaningful display, plus an optional
allow-control flag):

```ts
export interface TheaterRemote {
  id: string;
  x: number; y: number;
  rotation?: number;       // wall-plate convention, or free if tabletop
  height?: number;         // default ~900 (tabletop) or 1400 (wall, like AlarmPanel)
  entity_id: string | null;    // remote.* (Harmony hub etc.)
  activityEntities?: string[]; // OPTIONAL: media_player ids this remote's activities gate,
                                // so watch_tv / recentTriggers logic can react to "Watch Movie" starting
  allowControl?: boolean;      // permit remote.turn_on(activity=...) picks from the panel
  localState?: string;         // unbound demo: current_activity name, inert once bound
  label?: string;
  locked?: boolean;
}
```
2D: a small remote-glyph plate showing `current_activity` as text (or "Off").
3D: reuse the AlarmPanel wall-plate build + a state-colored screen band, OR — if
tabletop — a simple beveled box with an emissive face (a scaled-down version
of the entity-value-display text-plaque primitive other research docs already
plan). Clicking with `allowControl` pops a modal listing `activity_list`
(from the bound `remote.*` entity's attribute) as buttons calling
`remote.turn_on({entity_id, activity})` — mirrors the AlarmPanel modal's
button-per-action pattern exactly. Dirty key `_keyRemote` = configRev + the
bound entity's `current_activity` string (cheap: one string compare, same
shape as `_keyAlarm`).

### 3.4 Projector + drop-down screen — reuse the window-blind roller
This is the strongest reuse opportunity in the whole feature. Diorama already
builds a **descending roller shade** for `Window.coverEntity` blinds (3D:
"roller shade descends from the header ((1−fraction)·glassH + weight bar,
proud of the glass)" per CLAUDE.md's Covers section) driven by
`doorOpenFraction`'s cover branch. A projector screen is the *same primitive*
mounted on a ceiling/wall plate instead of over a window opening:
- Add a `ProjectorScreen` fixture (or extend `Window.kind` with a `'screen'`
  variant if it should also live in the wall-opening system) with
  `coverEntity?: string | null` (a `cover.*`, e.g. the XY Screens integration
  or a DIY relay `cover`), `width`/`dropHeight` in mm (default from the
  §2.9 100"/120" 16:9 table), mount height (ceiling-track height, ~2600 mm).
  3D: literally the existing roller-shade descent math, just anchored to a
  ceiling track box instead of a window header — same `(1−fraction)` lerp,
  same weight-bar-at-the-bottom-edge look.
- Add a `Projector` fixture (ceiling-mounted small box, `media_player.*` or
  a plain `switch`/generic `entity_id` for Epson/PJLink power state) with a
  translucent **throw-cone wedge** reusing the exact wedge-rendering code
  already written for `CameraFixture`'s FOV frustum (`types.ts` ~L497-516) —
  same fov/range/rotation shape, just aimed at the screen instead of drawn as
  a security-camera cone, and tinted to look like a light beam instead of a
  camera FOV (toon-additive white cone, low opacity, brightens when the
  bound entity is "on"). This is a near-zero-net-new-code fixture given
  `CameraFixture`'s wedge already exists.
- Sidebar labels the cover's "open" position as "screen up / retracted" per
  §2.5's semantics note, so users aren't confused inverting the convention.

### 3.5 "Movie mode" — a scene/preset hook, not a new fixture
Diorama already has the exact right lever for this: `Scene3D.lightMode` /
`applyScenePreset` (`night`/`day`/`dusk`) and the **manual** `scene3d.preset`
override, plus `Planner.toggleEntity`/`toggleItem` service dispatch. Two
complementary integration points, both cheap:
1. **HA-side automation does the real work** (per §2.7's scene/script
   pattern) — Diorama doesn't need to reimplement scene.apply logic. What
   Diorama *can* do is give the user a one-click **"Movie Mode" topbar/3D-bar
   button** (peer to the existing 🎥 auto-follow / 🎬 cinematic-orbit / 💎 Sims
   buttons) that fires `hass.callService('scene', 'turn_on', {entity_id})` or
   `script.turn_on` against a user-configured scene/script id stored on
   `Store` (one string field, e.g. `Store.movieModeSceneId?: string`) — this
   is a **generic action button**, exactly the shape already researched in
   `generic-action-control.md`; don't build a bespoke service-call path here,
   reuse that primitive when it lands.
2. **Visually**, pressing the button can *also* (client-side, no HA
   round-trip needed) drop `scene3d.preset` to `'night'`/`'dusk'` and call
   `renderer.applyViewPreset('sims')` or a saved `Store.views3d` "theater"
   camera pose framing the couch+screen — instant dramatic feedback even
   before HA's real lights finish dimming. This composes cleanly with the
   already-shipped weather-driven preset downgrade (`WEATHER_DIM_CONDITIONS`)
   since both just feed `_effectivePreset`/`_keyFloor` the same way.

### 3.6 Bias-lighting sympathy glow — no new fixture, a light-color feed
If a user's bias strip is itself a normal Diorama `Light` fixture (it is, in
HA terms, just a `light.*` entity, possibly one of a Hue entertainment area),
nothing new is needed: it already renders with its live HA color/brightness
like any other light. The one nice-to-have is showing the **Hue Sync Box's
own on/off + mode** as a small badge near the TV/AVR (reuse the `local:` /
bound-entity badge idiom sidebar rows already use for doors/lights) — display
only, not a placeable fixture, since the sync box has no physical footprint
worth drawing.

### 3.7 Dirty keys / groups checklist (mirrors the canvas-fixture recipe)
- `types.ts`: `TheaterRemote`, `Projector`, `ProjectorScreen` (or the
  `Window.kind` extension) interfaces + `Floor.theaterRemotes?`/`projectors?`/
  `projectorScreens?` arrays, `repairFloor` + `defaultFloor` backfill `[]`.
  `av_receiver` just needs a `FURNITURE_KINDS` entry — no new array.
- `geometry.ts`: default dims from §2.9's table; `av_receiver` cat
  `'appliance'`; wall/ceiling-snap helper for the screen+projector pair
  (mirror `snapFireplaceToWall`/`snapFloodlightToWall`'s "flush to nearest
  wall within 500 mm" pattern — a screen almost always mounts on the wall the
  TV would otherwise occupy).
- `canvas-render.ts` / `canvas-hit.ts` / `canvas-interact.ts`: 2D glyphs +
  hit tests + drag cases per the standard recipe (motion-sensor/BLE-proxy
  flow cited throughout CLAUDE.md's gotchas).
- `sidebar.ts` + `TOOLS`: new tool buttons (remote 🎛️/📽️ projector/🖥️ screen
  glyphs), bind rows (`remote.*` domain picker for the remote, `cover.*` for
  the screen, `media_player.*`/generic for the projector).
- `three-renderer.ts`: new groups (`_theaterRemoteGroup`, `_projectorGroup`,
  `_screenGroup`) added to `scene.add`/`clearTransientGroups`/`destroy`/
  `setLayerVisibility` (ride the existing **`sensors`** layer like
  AlarmPanel/CameraFixture/BLE-proxies do — no new layer needed), each with
  its own dirty key (`_keyRemote`, `_keyProjector`, `_keyScreen`) folding
  `configRev` + the relevant bound entity's state/position, per three-view's
  `_tickOnce` dirty-key discipline.
- `av_receiver` needs **no** new group — it's a `Furniture` piece, so it
  rides `_floorGroup`/`_keyFloor` + the existing appliance-state hash exactly
  like a fridge/TV/washer already does.

## 4. Setup / integration steps

**User-side (HA configuration), ordered:**
1. Get the screen device (TV, or streaming box behind the AVR) onto a
   `media_player.*` entity — native integration (Roku/Apple TV/Google
   Cast/HDMI-CEC) or via the AVR if the AVR exposes it.
2. Add the AVR integration matching the actual hardware (§2.3): `denonavr`
   for Denon/Marantz, `onkyo` for Onkyo/Integra/Pioneer, `yamaha_musiccast`
   or `yamaha` for Yamaha depending on product generation, `anthemav` for
   current-gen Anthem (accept that it will lock out the vendor's own app while
   HA runs). Enable required network settings on the device first (Denon
   Telnet, Onkyo "Network Standby," Anthem "Standby IP Control" — the Anthem
   integration sets this automatically).
3. If there's a Harmony hub or similar universal remote, add the `harmony`
   integration (or the equivalent for another remote brand) and note the
   `activity_list` it reports.
4. If devices are split across an AVR + streaming box + remote, add a
   `media_player.universal` entity in YAML combining them into one logical
   theater player (attribute_templates for volume/power from the AVR, media
   metadata from the streaming box).
5. Add the projector integration: `epson` (official, needs LAN/serial + the
   projector powered on during setup) or `pjlink` (generic, any PJLink-capable
   brand) or a community alternative for newer Epson laser models.
6. Add the motorized screen as a `cover` (XY Screens integration, or an
   ESPHome/Tasmota relay `cover`) — check whether its `open`/`close` /
   `position` matches "position 100 = retracted" before wiring into Diorama,
   invert in the device's own config if not.
7. Optional: add HDMI-CEC if running on a Pi (free, in-band) as a second path
   to power/volume/source control without buying an IR blaster.
8. Optional: install the Hue Sync Box custom integration (HACS) if bias
   lighting is in play.
9. Build (or install a blueprint for) the movie-mode scene/automation: a
   "dim" scene + a `media_player` state-trigger automation, or the community
   blueprint (§2.7).

**Diorama-side (developer), ordered — follow §3.7's checklist mapped onto the
canvas-fixture recipe**:
1. `types.ts` new interfaces + array fields + repair/backfill.
2. `geometry.ts` defaults (§2.9 dims) + any wall/ceiling-snap helper.
3. 2D draw/hit/interact wiring.
4. Sidebar sections + `TOOLS` entries + bind rows (correct domain per fixture:
   `remote.*`, `media_player.*`/generic, `cover.*`).
5. Three-renderer groups + dirty keys, riding the `sensors` layer.
6. `av_receiver` is just a `FURNITURE_KINDS` entry — no array/group needed,
   confirm it inherits the appliance-LED-glow behavior for free.
7. Movie-mode button: a `Store.movieModeSceneId` field + a topbar/3D-bar
   button dispatching `scene.turn_on`/`script.turn_on` (defer to
   `generic-action-control.md`'s primitive once it exists, to avoid a
   duplicate one-off service-call path).

## 5. Potential additional features

- **Activity buttons row** in the sidebar theater-remote editor: one button
  per `activity_list` entry (Watch Movie / Watch TV / Listen to Music /
  PowerOff), calling `remote.turn_on(activity=...)` directly — turns the
  whole rig into a one-tap macro board, which is the actual point of owning
  a Harmony hub.
- **Multi-room audio visualization**: draw a soft connecting line/glow between
  2D dots of `media_player`s currently in each other's `group_members` list —
  cheap, and answers "which speakers are grouped right now" at a glance.
- **Projector lamp-hour maintenance badge**: if a given projector integration
  *does* expose lamp hours (verify per-model — not confirmed for the official
  Epson integration; some community projector integrations do surface it),
  reuse the shipped battery-badge pattern (`batteryFor`/`drawBatteryBadge*`)
  for a "lamp due" warning icon instead of inventing a new indicator.
- **Sound-mode / Dolby Atmos indicator**: a small badge showing `sound_mode`
  text next to the AVR piece — cheap, uses the existing env-sensor-chip
  CanvasTexture idiom.
- **Popcorn/snack thought-bubble tie-in**: `watch_tv` already exists as a
  seated activity; the kitchen-night bubble pool (🍪🍿🧀) already fires for a
  standing idle avatar at night in a kitchen room — no change needed, but
  worth noting the fridge/kitchen bubble pools and a "movie starting" trigger
  compose naturally without new code (recentTriggers tier already covers
  `tv` on/off with a 📺🍿 bubble pool per CLAUDE.md's Activity System section).
- **Soundbar `FurnitureKind`**: a slim wall-mounted box under the TV,
  `media_player.*`-bound, essentially a smaller sibling of `av_receiver` with
  a wider/flatter default footprint (typical soundbar ≈ 900–1200 × 60–100 ×
  100–140 mm) — cheap add if AVR is being built anyway.
- **Adaptive-lighting-aware movie mode**: if the user runs
  `adaptive_lighting`, the movie-mode button could also flip its "manual
  override" input_boolean (a documented adaptive-lighting pattern) so the
  circadian automation doesn't fight the dim scene — a setup-checklist note,
  not new Diorama code.

## 6. Open questions & risks

- **No universal "home theater" schema exists in HA** — every layer (screen,
  AVR, remote, projector, screen-cover, bias light) is bound independently by
  the user to whatever their real hardware integration is. Diorama's fixture
  design must stay domain-generic (bind a `media_player.*`/`remote.*`/
  `cover.*` id, don't assume vendor-specific attributes) — confirmed
  necessary by how differently Denon/Onkyo/Yamaha/Anthem each behave.
  Vendor-specific extras (MusicCast's rich number/select/switch surface,
  Anthem's exclusive-socket behavior) are real but shouldn't drive Diorama's
  own data model.
- **Harmony's long-term trajectory is a real risk, not a solved question.**
  Hardware manufacturing ended 2021, oldest-generation remotes lost app
  support May 2025; Hub/Elite-class + the app/cloud/database are still
  confirmed running as of 2026 per Logitech's own support page, and the HA
  integration talks to the hub locally rather than through the app, but this
  is a legacy platform. Anyone using this doc in 2027+ should re-verify
  Harmony is still alive before designing UI copy around it as *the*
  universal-remote answer; treat it as one option among several (a
  `remote.*` entity could equally be Broadlink, a Zigbee/RF hub, etc.) — the
  `TheaterRemote` fixture's data model (bind any `remote.*`) is deliberately
  Harmony-agnostic for this reason.
- **The HA cookbook "dim lights when playing media" page 404s live** as of
  this research pass, though search-cache/mirror snapshots (home-assistant
  中文网 mirror, community forum quotes) corroborate its content consistently.
  Treat the pattern as confirmed by convergent secondary sources, but don't
  cite the live URL to end-users without re-checking it resolves.
- **`media_player.universal`'s attribute/command templates are YAML-only** —
  no UI config flow as of this research. That's a real friction point if
  Diorama wants to offer "combine these three entities into one theater
  control" as a first-class in-app flow; more realistically, Diorama should
  let users bind Diorama's own fixtures to *whichever* individual entities
  exist (TV fixture → streaming box, AV-receiver fixture → AVR,
  remote fixture → Harmony) rather than trying to also build a
  Universal-media-player *authoring* UI inside the panel — that's HA
  configuration territory, out of scope for a floor-plan renderer.
- **Cover-domain "open means retract" is a real footgun** for a screen the
  same way it already was for blinds; confirmed by HA's own inverted-logic
  guidance and cross-checked in the XY Screens/Sonoff cover-integration
  threads. The mitigation is a documentation/labeling fix in Diorama's
  sidebar, not a code branch.
- **Onkyo's Bronze integration-quality rating and its 2024.11 YAML→UI
  migration break** are both signals of a rougher, less stable path than
  Denon/Anthem/MusicCast — a "HA 2024.11 no longer supports older Onkyo
  models" issue thread surfaced during this research (unresolved status not
  independently re-verified against the live GitHub issue) — flag Onkyo as
  the AVR brand most likely to need a HACS custom-component fallback.
- **Anthem's exclusive-socket behavior is a genuine UX cost**: any user
  wanting HA control of an Anthem receiver loses concurrent use of the
  vendor's own app and ARC-2 room calibration unless they toggle the
  integration off first. Worth a setup-checklist callout, not solvable in
  Diorama.
- **HDMI-CEC's hardware dependency** (free on Pi 4/5, requires a Pulse-Eight
  USB adapter otherwise) means it's not a universal zero-cost path — only
  worth recommending when the target box is confirmed to be a Pi.
- **Projector lamp-hours**: could not confirm this is exposed as an HA
  attribute/sensor by the *official* Epson integration (docs describe power/
  input/color-mode/volume only) — don't build the "lamp maintenance badge"
  feature assuming the data exists; gate it behind per-integration
  verification.
- **120" screen dimension rounding**: community sources (WEMAX/AWOL-vision
  style "how big is a 120-inch screen" posts) commonly quote ≈104"×58"
  (≈2642×1473 mm) from whole-inch-truncated math, while the exact 16:9
  diagonal formula gives 2656×1494 mm. The ~14 mm/21 mm difference is
  irrelevant for a 3D prop; noted only so a future author isn't confused
  seeing two "authoritative-looking" numbers.

## 7. Sources

- [Media player entity — HA Developer Docs](https://developers.home-assistant.io/docs/core/entity/media-player/)
- [Media player — HA integration index](https://www.home-assistant.io/integrations/media_player/)
- [Universal media player — HA docs](https://www.home-assistant.io/integrations/universal/)
- [`media_player.join` action reference](https://www.home-assistant.io/actions/media_player.join/)
- [Remote entity — HA Developer Docs](https://developers.home-assistant.io/docs/core/entity/remote/)
- [Remote domain overview — HA docs](https://www.home-assistant.io/integrations/remote/)
- [Logitech Harmony Hub — HA integration docs](https://www.home-assistant.io/integrations/harmony/)
- [Harmony Remote Manufacturing, Service and Support Update — Logitech](https://support.myharmony.com/en-ls/harmony-remote-manufacturing-update)
- [Denon AVR Network Receivers — HA docs](https://www.home-assistant.io/integrations/denonavr/)
- [Marantz — HA docs](https://www.home-assistant.io/integrations/marantz/)
- [Onkyo — HA docs](https://www.home-assistant.io/integrations/onkyo/)
- [HA 2024.11 no longer supports older Onkyo models — GitHub issue](https://github.com/home-assistant/core/issues/130250)
- [MusicCast — HA docs](https://www.home-assistant.io/integrations/yamaha_musiccast/)
- [Yamaha Network Receivers — HA docs](https://www.home-assistant.io/integrations/yamaha/)
- [Anthem A/V Receivers — HA docs](https://www.home-assistant.io/integrations/anthemav/)
- [`anthem-serial` custom component — GitHub](https://github.com/gwendalg/anthem-serial)
- [Epson — HA docs](https://www.home-assistant.io/integrations/epson/)
- [Epson Projector Link (community integration) forum](https://community.home-assistant.io/t/epson-projector-link/805841)
- [`epson-projector-modern-homeassistant` — GitHub](https://github.com/mag1024/epson-projector-modern-homeassistant)
- [PJLink — HA docs](https://www.home-assistant.io/integrations/pjlink/)
- [PJLink protocol specification](https://pjlink.jbmia.or.jp/english/index.html)
- [`homeassistant-xyscreens` — GitHub](https://github.com/rrooggiieerr/homeassistant-xyscreens)
- [Motor projector screen as cover component — HA community](https://community.home-assistant.io/t/motor-projector-screen-as-cover-component/84583)
- [HDMI-CEC — HA docs](https://www.home-assistant.io/integrations/hdmi_cec/)
- [Automate your home theater with HA + HDMI-CEC — Botmonster](https://botmonster.com/posts/automate-home-theater-home-assistant-cec/)
- [Dim lights when playing media — HA cookbook (mirror)](https://home-assistant-china.github.io/cookbook/dim_lights_when_playing_media/)
- [🎥 Movie Mode Light Control — HA community blueprint](https://community.home-assistant.io/t/movie-mode-light-control/886100)
- [Scenes — HA docs](https://www.home-assistant.io/docs/scene/)
- [`huesyncbox` custom integration — GitHub](https://github.com/mvdwetering/huesyncbox)
- [Philips Hue Play HDMI Sync Box custom integration — HA community](https://community.home-assistant.io/t/philips-hue-play-hdmi-sync-box-custom-integration/204772)
- [`adaptive-lighting` custom component — GitHub](https://github.com/basnijholt/adaptive-lighting)
- [Standard component dimensions — AVSForum](https://www.avsforum.com/threads/standard-component-dimensions.281529/)
- [Denon AVR-X3300W dimensions/weight — Denon manuals](https://manuals.denon.com/AVRX3300W/NA/EN/GFNFSYzjlkmxom.php)
- [Epson Home Cinema 5050UB specs — ProjectorCentral](https://www.projectorcentral.com/epson-home_cinema_5050ub.htm)
- [Universal Projector Ceiling Mount (ELPMBPJG) — Epson](https://epson.com/Accessories/Projector-Accessories/Universal-Projector-Mount-(ELPMBPJG)/p/V12H808001)
- [Projector Guide: Throw Distance and Positioning — Epson](https://epson.com/projector-guide-how-to-buy-a-projector-throw-distance-and-positioning)
- [Screen size dimensions table — PSM Screens](https://projector-screen-material.co.uk/tools/dimension-tables/size-table/)
- [Home Theater Riser Platform Guide — theaterseatstore](https://www.theaterseatstore.com/blog/home-theater-riser-guide)
- [Regular sized theater seats — theaterseatstore](https://www.theaterseatstore.com/size/standard-sized-hts)
- [Modular Home Theater 7.75" Riser Platform — SeatUp](https://seatup.com/7-75-inch-home-theater-riser-platform)
