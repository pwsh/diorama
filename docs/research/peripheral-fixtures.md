# Mail/packages, printers, network rack — peripheral fixtures

Research doc for a Diorama feature. Written to be build-ready: every claim
about Diorama's existing code cites a file/mechanism so an implementer can
jump straight there; every HA claim is flagged core/custom and cited.

Research target (as given): three low-spatial-value peripherals that are
nonetheless common smart-home fixtures worth a small, honest presence in the
plan — (1) **Mail-and-Packages** (HACS) at the front door, (2) **3D printers**
(OctoPrint / Bambu Lab / Klipper-Moonraker; ink/laser printers via core IPP),
(3) **NAS / server / router** as a rack fixture with a health LED, explicitly
noting that UniFi does **not** expose per-client AP association (no
room-level Wi-Fi device mapping is possible from that integration).

## 1. Summary

Diorama's pitch is "see live device state in spatial context, click anything
to control it." These three peripherals are a deliberate scope-down from that
pitch: they are boxes that sit in one fixed spot in the house and occasionally
have something worth glancing at (a package count, a print percentage, a
blinking status LED) but very little that benefits from full 3D animation —
nobody needs a Sims-toon router. The right design language for all three is
the one Diorama already uses for its "quiet fixture" tier — env sensors
(puck + camera-facing text sprite), safety sensors (ceiling disc + alarm
pulse), and the alarm keypad (wall plate + state-colored screen band) — not
the "rich furniture" tier (appliances, beds, sofas) or the "living being"
tier (avatars/pets). Concretely:

- **Mail/packages** is a **door-adjacent fixture**: a mailbox prop at the
  location a user places it (curbside or a wall-mount parcel box near the
  entry), showing a lid-open binary state (mailbox-flag-style) and a package
  count badge, plus an optional informed-delivery mail-piece thumbnail —
  reusing the exact `entity_picture`-driven image pattern Diorama already
  ships for camera snapshot cards and Roborock now-playing album art.
- **3D printer** is a **new furniture-adjacent fixture** (closer to a
  appliance than a sensor): a printer-shaped box on a desk/bench with a
  progress readout, bed/nozzle temperature glow, and a status LED, following
  the exact "appliance in-use LED + state-driven `_keyFloor` term" recipe
  Diorama already uses for washers/dishwashers/TVs.
- **NAS/server/router** is a **rack fixture**: a small rack-unit box (or
  stack of them) with one health LED (color-coded from the aggregate of
  whatever binary/problem sensors are bound) — deliberately the *simplest*
  of the three, because the underlying HA data (CPU/disk/network counters)
  is diagnostic-grade and disabled-by-default, not something to visualize
  richly, and because per-client AP/room Wi-Fi mapping — the one thing that
  *would* be spatially interesting about a network rack — does not exist in
  the UniFi integration's data model (confirmed below).

All three follow the standard canvas-fixture recipe end-to-end (types →
geometry defaults → canvas-render draw + layer gate → canvas-hit → canvas-
interact → sidebar section + TOOLS entry → three-renderer group + dirty key),
and all three need **zero new `HaApi` methods** — they are pure
state-read + optional `call_service`/`toggle`/`button.press` fixtures, exactly
like the alarm keypad and safety sensors before them.

## 2. Home Assistant data model

### 2.1 Mail and Packages (custom, HACS)

Repo: [github.com/moralmunky/Home-Assistant-Mail-And-Packages](https://github.com/moralmunky/home-assistant-mail-and-packages)
("providing day of package counts and USPS informed delivery images"),
install/config wiki:
[…/wiki/Configuration-and-Email-Settings](https://github.com/moralmunky/Home-Assistant-Mail-And-Packages/wiki/Configuration-and-Email-Settings).
**Custom integration, HACS-installed** — not in HA core. It works by IMAP-
polling a mailbox the user forwards shipping-notification emails into (or
whose provider natively CCs them, e.g. Gmail); it does **not** talk to any
carrier API or hardware sensor. There is therefore no notion of a physical
mailbox-lid switch baked into the integration itself — see 2.1.3 below for
how Diorama should source the "door/lid open" half of the fixture.

#### 2.1.1 Sensor entities (from the integration's `const.py`, read directly)

Per-carrier pattern (present for each supported carrier: USPS, Amazon, UPS,
FedEx, DHL, Canada Post (`capost`), Hermes, Royal Mail (`royal`), Australia
Post (`auspost`), InPost Poland (`inpost_pl`), DPD Poland (`dpd_com_pl`),
GLS):

- `<carrier>_packages` — count of packages detected in transit **and**
  scheduled for delivery today, combined per-carrier count (sensor, unit
  "packages")
- `<carrier>_delivering` — count still in transit / out for delivery
- `<carrier>_delivered` — count confirmed delivered today
- `<carrier>_exception` — count with a delivery exception (USPS, Amazon, UPS
  have this; not every carrier)
- Amazon additionally has `amazon_hub` (Amazon Hub/locker deliveries)

USPS mail (letters, not packages):

- `usps_mail` — number of pieces of *mail* (not packages) expected/received
  today, sourced from Informed Delivery scan images

Image sensors (only meaningful if USPS Informed Delivery is configured):

- `usps_mail_image_system_path` — local filesystem path to a generated GIF of
  today's Informed Delivery scan images (for use with a `camera.local_file`
  entity or file-based automations)
- `usps_mail_image_url` — the same image, built into a web-accessible URL off
  HA's configured External URL / Internal URL / Nabu Casa remote UI URL

Aggregate/meta sensors:

- `zpackages_delivered` — total packages delivered today across ALL carriers
- `zpackages_transit` — total packages still in transit across all carriers
- `mail_updated` — timestamp of the last successful mailbox scan

All of the above are plain `sensor.*` domain entities; the integration names
them per the user's configured "sensor name" prefix at setup (default prefix
is typically `mail`, e.g. `sensor.mail_usps_mail`,
`sensor.mail_amazon_packages`, `sensor.mail_zpackages_delivered`).

#### 2.1.2 Binary sensor

- A `binary_sensor.<prefix>_usps_mail_delivered`-style entity exists but is
  **disabled by default** in the entity registry and must be manually
  enabled (Settings → Devices & services → Mail and Packages → entity list)
  before it starts reporting. It flips when the day's USPS mail scan
  indicates delivery has occurred. This is the closest thing the integration
  has to a "delivered today" boolean; it is mail-specific, not per-package.

#### 2.1.3 What is NOT available / needs a separate device

The integration is purely inbox-derived — it has **no concept of a physical
mailbox door/lid sensor**. A literal "mailbox lid opened" binary_sensor (the
kind of thing Diorama's fixture recipe wants for a swing-open 3D animation,
mirroring the alarm-panel / lock / fridge-door pattern) has to come from a
**separate physical sensor** the user places on their own mailbox — typically
a battery reed/tilt sensor (Zigbee/Z-Wave/ESPHome) exposed to HA as an
ordinary `binary_sensor.*` (`device_class: door` or `opening`) with no
connection to Mail-and-Packages at all. Diorama's fixture should therefore
expose **two independent, optional bindings** on the same prop: a
`mailEntity` pointing at whichever `sensor.*_zpackages_transit` /
`_zpackages_delivered` / `_usps_mail` the user wants shown as the badge count,
and a `lidEntity` pointing at the user's own door/lid `binary_sensor.*` (or,
absent one, an unbound `localState` the user can flip by hand — the existing
"local control of unbound interactive objects" idiom). Nothing here is a
literal "mailbox" domain in HA — it is entirely user-assembled from generic
sensor primitives, same as Diorama's existing safety-sensor / lock fixtures
already assume.

There is also no washer/dryer-style richly-typed device — no `device_class`
specific to "mail count" exists, so all the count sensors above are plain
unitless/`unit_of_measurement: packages` sensors; Diorama should NOT try to
`envKindOf()`-derive anything from them (that resolver is device-class based
and none of these carry a meaningful one).

### 2.2 3D printers

Three realistic integration paths exist; a Diorama fixture should accept a
generic **progress/state/temperature entity bundle** so it works with
whichever one the user has, rather than hard-coding one integration's
entity-naming scheme (all three use different naming conventions).

#### 2.2.1 OctoPrint (core integration)

Doc: [home-assistant.io/integrations/octoprint](https://www.home-assistant.io/integrations/octoprint/).
**Core**, config-flow only (Settings → add integration → needs host/port/
API key from OctoPrint's Application Keys plugin + Discovery plugin enabled
on the OctoPrint side).

- **Binary sensors**: `Printing`, `Print Error`
- **Sensors**: `Current Printer State` (text: e.g. `Operational`/`Printing`/
  `Paused`/`Error`/`Offline`), `Job Percentage` (0–100, the print-progress
  sensor), `Estimated Start Time`, `Estimated Finish Time`, `Actual Bed
  Temperature`, `Actual Tool (Nozzle) Temperature`, `Target Bed Temperature`,
  `Target Tool (Nozzle) Temperature`, `Current File Name`, `Current File
  Size`
- **Number entities (writable)**: Set Target Bed Temperature, Set Target Tool
  Temperature — these are ordinary `number.*` domain entities (`number.set_value`
  service), so `_isSlowEntity` should treat them like the rest of Diorama's
  `number.*` config-path rule (already true — no change needed).
- **Buttons**: `Pause Job`, `Resume Job`, `Stop Job` (created by default),
  optionally `Reboot System` / `Restart OctoPrint` / `Shutdown System` if the
  System Command plugin is installed on the OctoPrint side. All are ordinary
  `button.*` entities pressed via `button.press`.
- **Action**: `octoprint.printer_connect` — [home-assistant.io/actions/octoprint.printer_connect](https://www.home-assistant.io/actions/octoprint.printer_connect/)
  (target device; optional `printer_profile`/`serial_port`/`baud_rate` fields)
  tells the OctoPrint server to connect to the printer — useful after a
  reboot, not part of the visual fixture.
- **Camera**: if OctoPrint has a webcam configured, a `camera.*` entity is
  exposed (same `entity_picture`/snapshot pattern Diorama already reads for
  camera fixtures and Roborock map images).

#### 2.2.2 Bambu Lab (custom, HACS — `greghesp/ha-bambulab`)

Repo: [github.com/greghesp/ha-bambulab](https://github.com/greghesp/ha-bambulab),
entity reference: [docs.page/greghesp/ha-bambulab/entities](https://docs.page/greghesp/ha-bambulab/entities).
**Custom, HACS**. Connects via Bambu's local MQTT broker (LAN-only mode) or
Bambu Cloud, depending on printer firmware mode; X1-series/P1-series/A1-series
all supported.

- **Print-job sensors**: `Print Progress` (0–100%), `Current Stage` (text
  enum — e.g. "Heating bed", "Printing", "Auto bed leveling" — a rich state
  machine specific to Bambu firmware), `Print Status` (idle/running/paused/
  failed/finished-style), `Current Layer` / `Total Layer Count`, `Remaining
  Time`, `Start Time`, `End Time`, `Print Weight`, `Print Length`, `Print Bed
  Type`, `Cover Image` (thumbnail of the model being printed — an
  `entity_picture`-style camera/image entity), `Total Usage Hours`.
- **Temperatures**: `Bed`/`Target Bed`, `Chamber`/`Target Chamber`, one
  `Nozzle`/`Target Nozzle` pair per extruder (multi-tool H2D-class printers
  have several).
- **Fans**: Aux, Chamber, Cooling, Secondary aux — numeric % sensors.
- **AMS (Automatic Material System) entities**: per-unit `Active tray`,
  `Active tray index`, `Drying`, `Humidity Index`/`Humidity`, `Temperature`,
  plus **Tray 1–4** sensors each carrying rich attributes: `Color` (hex),
  `Empty`, `State`, `K Value`, `Name`, `Nozzle max/min temp`, `Remaining
  Filament` (%), `Spool serial number`, `Type` (PLA/PETG/ABS/etc). This is
  the single richest piece of visualizable data in the whole research
  target — filament color + remaining % per bay is a natural fit for a tiny
  3D AMS unit prop with 4 colored cylinders that "fill down" as they're used.
- **Diagnostics**: `Enclosure Door` (binary_sensor — open/closed), `HMS
  Errors` (Bambu's Health Management System error/warning codes), `Print
  Error`, `Online`, `Wifi Signal`, `Firmware Update Available`.
- **Controls**: `Pause`/`Resume`/`Stop` (buttons), `Chamber Light`/`Heatbed
  Light` (light entities — real ones, not synthetic; togglable like any
  other light fixture Diorama already supports), Bed/Chamber/Nozzle target
  temperature `number.*` entities.
- **Camera**: chamber camera entity (X1-series has a built-in camera; P1/A1
  do not) — same pattern as OctoPrint's webcam.

#### 2.2.3 Klipper via Moonraker (custom, HACS — mention only)

Repo: [github.com/marcolivierarsenault/moonraker-home-assistant](https://github.com/marcolivierarsenault/moonraker-home-assistant),
docs: [moonraker-home-assistant.readthedocs.io](https://moonraker-home-assistant.readthedocs.io/en/latest/).
**Custom, HACS.** A third community, DIY-printer-oriented path (Klipper
firmware + Moonraker API, e.g. Voron/Ender-with-Klipper builds). Exposes a
similar shape to OctoPrint (progress, temperatures, current print thumbnail)
plus a `button.*` **per configured Klipper macro** (since Klipper's
automation primitive is user-authored G-code macros, not a fixed action set).
Not worth a bespoke code path — it should map onto the same generic
progress/state/temperature bundle as OctoPrint.

#### 2.2.4 Generic mapping for the fixture

Given the three integrations name things differently, the fixture's bindable
fields should be **generic, HA-entity-agnostic** (mirroring how
`RobotFixture`/`AlarmPanel`/env sensors already just take arbitrary
`sensor.*`/`binary_sensor.*` ids, not integration-specific ones):

| Fixture field | Bind to (any of) |
|---|---|
| `progressEntity` | OctoPrint `Job Percentage` / Bambu `Print Progress` / Moonraker progress sensor — any 0–100 `sensor.*` |
| `stateEntity` | OctoPrint `Current Printer State` / Bambu `Print Status` — any text `sensor.*` |
| `bedTempEntity` | Any `sensor.*` bed temperature |
| `nozzleTempEntity` | Any `sensor.*` nozzle/tool temperature |
| `doorEntity` (optional) | Bambu `Enclosure Door` `binary_sensor.*` |
| `errorEntity` (optional) | OctoPrint `Print Error` / Bambu `HMS Errors`/`Print Error` |
| `pauseButton`/`resumeButton`/`stopButton` (optional) | `button.*` entities → `button.press` |

No new `HaApi` calls: reading these is plain `state_changed` (already
universal); pressing a button reuses whatever generic "call a domain
service" path Diorama already has for `alarm_control_panel.*`/`lock.*` calls
(`hass.callService`/`connection.sendMessagePromise` `call_service` — both
`HassClient` and `HassPanelAdapter` already have this).

### 2.3 NAS / server / router (health-LED rack fixture)

#### 2.3.1 Synology DSM (core integration)

Doc: [home-assistant.io/integrations/synology_dsm](https://www.home-assistant.io/integrations/synology_dsm/).
**Core.** Config-flow, local polling.

- **Volume sensors** (per storage pool/volume): status, total size (TB, disabled
  by default), used size (TB), % used, average disk temperature, max disk
  temperature (disabled by default).
- **Disk sensors** (per physical drive): internal temperature, status
  (as shown in DSM), SMART status (disabled by default).
- **System sensors**: CPU load (current/user/system/1-5-15 min combined —
  1-min disabled by default), memory (total/free/% used), network
  upload/download rate, NAS internal temperature, uptime (disabled by
  default).
- **Binary sensors**: overall "Security status" (reflects DSM Security
  Advisor), per-drive "exceeded bad-sector threshold" and "below remaining-
  life threshold."
- **Controls**: Surveillance Station Home-mode switch, Reboot/Shutdown
  buttons, fan-speed-mode selector (Low-Power/Quiet/Cool/Full-speed).
- **Camera** entities per Surveillance Station camera (same pattern as
  Diorama's existing camera fixture).

Almost everything numeric here is **disabled by default** and tagged
diagnostic — a reasonable signal that this data is meant for dashboards/
troubleshooting, not a spatial "glance and understand" panel. This supports
scoping the Diorama fixture to a single aggregate health LED rather than
trying to surface every counter.

#### 2.3.2 UniFi Network (core integration)

Doc: [home-assistant.io/integrations/unifi](https://www.home-assistant.io/integrations/unifi/).
**Core.** Talks to a UniFi Network Application (Cloud Gateway/UDM/
self-hosted controller), not to individual UniFi devices directly.

- **`device_tracker.*`**: one per network client (if client tracking is
  enabled) and optionally one per UniFi infrastructure device itself (APs,
  switches, gateways) if "Track network devices" is enabled. Source of
  presence detection ("home"/"not_home"), NOT room location.
- **Sensors**: per-client bandwidth (rx/tx, disabled by default), wired
  client link speed, WLAN client counts, uptime (clients + devices), power
  outlet utilization, per-UniFi-device temperature/state/CPU/memory, per-port
  bandwidth and link speed (disabled by default).
- **Switches**: block network access per configured client MAC, PoE port
  on/off (disabled by default), port enable/disable (disabled by default),
  DPI traffic-restriction groups, WLAN enable/disable, port-forward rules,
  traffic rules, policy routing rules, zone-based firewall policies.
- **Buttons**: power-cycle a PoE port, restart a UniFi device, regenerate a
  WLAN password.
- **Update** entities: firmware availability/install per UniFi device.
- **Light**: LED-ring brightness/color on compatible access points.
- **Image**: WLAN QR codes (disabled by default).

**Confirmed limitation** (the research prompt's explicit ask): the UniFi
integration's data model has **no per-client access-point-association
attribute** exposed as an HA entity/attribute — i.e. there is no
`device_tracker.<client>` attribute telling you *which AP* (and therefore,
transitively, which room) a client is currently associated with, and no
signal-strength/RSSI-to-room inference is documented or exposed. The
controller itself *does* track AP association and RSSI internally (visible
in the UniFi app), but the HA integration does not surface it as an entity
attribute in its documented entity list. **Practical implication for
Diorama**: do NOT build a "which room is this phone in" feature off UniFi —
that idea is a dead end with this integration. (Diorama already has the
*correct* tool for that job — BLE trilateration via Bermuda, already
shipped — this note exists purely to prevent re-proposing it here.)

#### 2.3.3 Generic "System Monitor" (core, for the HA host itself or any Linux box reachable by the same agent)

Doc: [home-assistant.io/integrations/systemmonitor](https://www.home-assistant.io/integrations/systemmonitor/).
**Core**, but only monitors the machine HA itself runs on (or, via the same
config entry mechanism, is not usable as a generic remote-host monitor — it's
local-only). CPU/memory/disk-per-mountpoint/network-per-interface/process
running-boolean sensors, **all disabled by default** and marked diagnostic.
Relevant only as a possible health-LED input if the user's "NAS/server" *is*
literally the Home Assistant host — a real but narrow case.

#### 2.3.4 Generic mapping for the fixture

Like the printer fixture, the rack fixture should bind **generic entities**,
not one integration's naming:

| Fixture field | Bind to (any of) |
|---|---|
| `problemEntities[]` (list) | Any set of `binary_sensor.*` the user considers "bad" (Synology security status, disk bad-sector/life sensors, UniFi device offline, System Monitor process-down) |
| `cpuEntity` / `tempEntity` (optional, cosmetic only) | Synology CPU load / NAS temperature sensor, System Monitor CPU sensor |
| `label` | Free-text ("Rack", "NAS", "Router") |

The health LED is a simple aggregate: **red** if any bound `problemEntities`
is in a "problem" state (`on` for a `problem`/`connectivity` device-class
binary_sensor, or a text sensor whose state isn't a known-good value),
**amber** if a bound update entity has a firmware update available, else
**green**. This mirrors the safety-sensor / alarm-panel color-resolver
pattern (`ALARM_STATE_COLORS`/`alarmStateColor`, `ENV_KINDS` warn/danger) —
a small pure `rackHealthColor()` helper, not a new subsystem.

## 3. Real-world / visual reference

### 3.1 Mailbox / parcel box

- **Curbside mailbox (USPS T1, most common)**: ≈165 mm W × 216 mm H × 470–
  483 mm D (6.5″ × 8.5″ × 18.5–19″), post-mounted with the box floor 1041–
  1143 mm (41–45″) above ground per USPS regulation. T2 (medium): ≈216 mm ×
  267 mm × 508 mm. T3 (large): ≈267 mm × 305 mm × 572 mm. Typical colors:
  black, dark green, or galvanized steel; a red flag pivots up when mail is
  ready for pickup (the mirror-image of "delivered" — Diorama's fixture
  should probably not conflate "flag up" with "delivered," since they're
  opposite-direction signals in real use — flag = outgoing, lid-open sensor
  = incoming).
- **Wall-mount / porch parcel box** (the more common target for a DIY
  lid-sensor + Mail-and-Packages pairing): a locking hinged-lid box roughly
  400–600 mm cube-ish, wall or post mounted near the front door, sized to
  swallow a medium package.
- Placement in Diorama: curbside mailboxes sit at the property edge (outside
  the floor-plan rect, in "yard" territory — same conceptual zone as the
  existing outdoor furniture kinds tree/bush/mailbox-adjacent props); a
  porch parcel box sits just outside or beside the front door, in the
  entryway room.

### 3.2 3D printer

- **Bambu Lab X1 Carbon**: 389 × 389 × 458 mm chassis (enclosed cube,
  256×256×256 mm build volume) — the reference enclosed-printer silhouette
  (AMS unit mounts on top or beside it, another ~300×170×220 mm box with 4
  visible filament spools behind a window).
- **Bambu Lab P1S**: similar enclosed-cube footprint, ~256×256×256 mm build
  volume, slightly smaller chassis than X1C.
  ([bambulab P1S tech-specs PDF](https://marketplace.createeducation.com/wp-content/uploads/2023/11/bambu-lab-P1S-tech-specs.pdf))
- **Bambu Lab A1 (open-frame/bedslinger)**: ~256×256×256 mm build volume, no
  enclosure — a flat rectangular bed on rails with an open gantry overhead,
  visually a completely different silhouette from the enclosed X1C/P1S (open
  frame vs. cube). A generic printer prop should probably offer **two body
  shapes** (`enclosed` cube vs. `open_frame` gantry) rather than one, since
  both are extremely common in the wild (classic Ender/Prusa-style printers
  are open-frame; Bambu X1/P1, Prusa CORE One, Qidi etc. are enclosed cubes).
- **Ender-3-class (common Klipper/Moonraker target)**: ~475 × 470 × 620 mm
  open-frame footprint, 220×220×250 mm build volume — representative of the
  "open frame" body shape option above.
- Colors: matte black/dark-grey chassis is near-universal across Bambu/
  Creality/Prusa; an amber/white glow from the heated bed and a small blue/
  white LED strip inside enclosed models are the characteristic "in use"
  tells worth reproducing as an emissive glow (mirrors the existing
  appliance in-use LED treatment).
- Placement: desk/bench-top furniture-adjacent prop (like `coffee_maker`/
  `toaster` — small, mountable on a `surface` piece such as a desk or
  workbench) OR floor-standing on its own footprint for larger printers.

### 3.3 Rack / NAS / router

- **1U rack unit**: 44.45 mm (1U) height × 482.6 mm (19″) front-panel width;
  usable internal mounting width ≈465 mm; depth varies 600–1200 mm for full
  server racks, but home/network racks are commonly small 4U–20U wall- or
  floor-mount cabinets 400–600 mm deep. A believable "home rack" prop is a
  short open-frame or enclosed cabinet a few U tall (e.g. 6U ≈ 267 mm)
  mounted on a wall or in a closet/office corner, NOT a full 42U cabinet.
- **Consumer NAS** (Synology DS920+, representative 4-bay desktop NAS):
  166 × 199 × 223 mm (H×W×D) tower-ish box, matte black/dark-grey, front
  drive-bay LEDs.
  ([Synology DS920+ product spec PDF](https://global.download.synology.com/download/Document/Hardware/ProductSpec/DiskStation/20-year/DS920+/enu/Product_Spec_DS920+_enu.pdf))
- **UniFi Dream Machine (standard/base)**: cylindrical, Ø110 × 184 mm — a
  distinctive non-rectangular silhouette if modeled precisely, though a
  simplified box is acceptable for Diorama's toon style.
- **UniFi Dream Machine Pro/SE/Pro Max** (rack-mount router+switch combo):
  442 × 43.7 × 285.6 mm — a standard 1U rack-width unit, confirming the 1U
  dimension above as the right "generic rack gear" building block.
  ([techspecs.ui.com/unifi/other/udm](https://techspecs.ui.com/unifi/other/udm), […/udm-pro](https://techspecs.ui.com/unifi/cloud-gateways/udm-pro))
- Colors/tells: dark grey/black chassis near-universal; small status LEDs
  (single or RGB) on the front are the one universal "at a glance" visual —
  exactly what the health-LED design leans on.
- Placement: a closet, office corner, or basement utility spot — free
  placement like other furniture, not wall-snapped (racks sit against a wall
  but don't need the switch/fireplace flush-snap machinery — a plain
  `block`-family placement matches how a bookshelf or cabinet is placed
  today).

## 4. Diorama visualization & animation design

All three are **new `FurnitureKind` entries** (not new top-level fixture
types with their own draw/hit/interact files) — they are placeable "props"
with an appliance-like bound-entity relationship, which is exactly the shape
`FurnitureKindDef` + `cat` already models (fridge/stove/tv today; add
`cat: 'peripheral'`, a new optgroup label in `furnitureCat()`/the sidebar
dropdown). This reuses 100% of the existing furniture drag/place/delete/
resize/rotate/lock/room-grouping machinery — no new canvas-hit or
canvas-interact code paths are needed beyond what `FurnitureKind` already
gets for free. Each kind still needs its own binding fields (`mailEntity`/
`lidEntity`, printer's progress/state/temp bundle, rack's `problemEntities[]`)
carried on the `Furniture` instance the same way `doorEntity`/`tempEntity`/
`powerEntity` already ride on it — additive optional fields, no
`repairFloor` changes needed (item-level fields on an array-of-objects field
never need backfill, per the existing convention note in CLAUDE.md).

### 4.1 Mailbox / parcel box

- **2D**: a small rect/box glyph (mailbox silhouette: post + box, or a flat
  wall box) drawn by a new case in `drawFurniturePrimitive` (or, if modeled
  as its own kind under the `outdoor`/`peripheral` cat, whichever switch it
  lands in). A package-count badge (small circle with a number, same visual
  language as `drawBatteryBadge*`) shows the resolved `mailEntity` reading
  (prefer `zpackages_transit`+`zpackages_delivered` sum, or let the user pick
  which sensor to badge). When `lidEntity` (or unbound `localState`) is
  `on`, draw an amber "open" wedge/tilt on the lid, mirroring
  `drawFireplace2D`'s open-state treatment.
- **3D**: a simple composite (box body + peaked/curved lid — a half-cylinder
  or angled box) via `_buildFurniture`'s generic-recipe path or a small new
  `switch (kind)` case; standard blob shadow + outline shell. Lid pivots
  open ~50–60° about its back hinge when `doorOpenFraction(effectiveState)`
  (the existing shared openness resolver — reuse it, don't invent a new
  one) is > 0, same swing idiom as fridge doors. A package-count text
  sprite (the shared `_makeTextSprite`/env-sprite idiom, `_disposeSpriteMaps`
  pairing) floats above when count > 0; hide it at 0 so an empty mailbox
  doesn't clutter the scene.
- **Dirty key**: folds into `_keyFloor`'s existing appliance-state-hash
  mechanism (mailbox's `mailEntity` reading + `lidEntity`/`localState`
  bucketed into the same compact per-fixture hash pattern already used for
  appliances/fridge doors) — no new dirty key needed, just two more terms in
  the existing hash builder.
- **Layer**: rides `furniture` (or `appliances` if categorized that way) —
  no new layer.
- **Entities are LIVE or config-path?**: package-count sensors update at
  most a few times a day (IMAP poll interval) — treat as **config-path**
  in `_isSlowEntity` (like env sensors) so the sidebar re-renders promptly;
  chatter is negligible either way.
- **Animation**: none needed beyond the lid swing — this is a "quiet
  fixture," per the design principle above. A brief flag-up detail could be
  added later (see §6) but isn't part of the MVP.

### 4.2 3D printer

- **2D**: rect footprint sized per `bodyShape` (`enclosed` cube vs.
  `open_frame` gantry outline), a progress-bar strip across the front (like
  a tiny loading bar, filled per `progressEntity`), and the existing
  appliance in-use pulsing LED dot when `stateEntity` resolves to a
  "printing"-like state. A small `N%` text chip (same idiom as the oven
  temp chip, `Furniture.tempEntity` → `N°` chip) sits beside it showing
  progress.
- **3D**: `_buildFurniture` case — enclosed variant: a box shell with a
  glass-look front panel (transparent material, exempted from the toon
  outline the same way window glass already is) showing the (optional)
  build-plate glow; open_frame variant: a flat bed slab + two vertical
  gantry rails + a horizontal print-head bar, all toon-shaded via `_mat()`.
  Both variants get:
  - An emissive **status LED** (green pulsing while printing, amber if
    paused, red if `errorEntity` is on, dim grey if idle/offline) — same
    "in-use LED" recipe as washers/dishwashers.
  - A soft warm **bed glow** (emissive plane under the build plate) scaled
    by `bedTempEntity` reading via the existing `powerGlowScale()`-style sqrt
    ramp (reuse the helper, generalized, rather than writing a new curve).
  - A camera-facing **progress text sprite** ("67% · 2h14m left") above the
    unit, built the same way as the now-playing card / env sprite (dispose
    via `_disposeSpriteMaps`).
  - Optional AMS accessory prop (Bambu only): a small 4-cylinder block beside
    the printer, each cylinder tinted by that tray's `Color` attribute and
    vertically "filled" by `Remaining Filament %` — a nice, cheap, uniquely
    Bambu-flavored detail matching Diorama's fondness for small material-
    based flourishes (cf. bin fill-lump, puddle decals).
- **Dirty key**: `_keyFloor`'s appliance-state hash gains printer terms
  (state + progress bucketed to, say, 5% steps like cover openness bucketing
  already does + bed-temp bucketed like the oven's `N°` chip) — same
  established pattern, not a new key.
  A print actively running could optionally force-rebuild every frame for a
  subtly animating build-plate glow (mirroring the fireplace-flicker /
  smoke-alarm-pulse "force every frame while active" idiom) — recommended
  ONLY for the LED pulse (cheap), not a full rebuild; the pulse itself can
  be time-based inside the persistent group like the appliance LED already
  is, needing no forced rebuild at all.
- **Layer**: `appliances` (it's categorically an appliance — bound entity,
  in-use LED, `_keyFloor` appliance hash membership already assumes
  `cat === 'appliance'` — either add this cat to that appliance-hash filter
  or give peripherals their own cat that's also included in the filter).
- **Click behavior**: click (2D + 3D `userData.kind='appliance'` or a new
  `'printer'` kind) → if `pauseButton`/`resumeButton`/`stopButton` bound,
  toggle pause/resume via `button.press` (mirrors the door-lock click
  pattern: bound → real service call; unbound → flip `localState`).
  Dblclick → entity picker / bind flow, matching every other bindable
  furniture piece.

### 4.3 NAS / server / router (rack fixture)

- **2D**: a plain rect (rack-unit proportions, wider than tall) with a small
  colored LED dot in a corner — deliberately the simplest 2D treatment of
  the three, matching the "diagnostic, not spatial" nature of the underlying
  data. Optional row of tiny dashes suggesting drive bays / ports for visual
  interest, no functional meaning.
- **3D**: a box (`_mat()` toon material, dark grey/black, matching the
  1U-rack or NAS-tower real-world reference) + a single emissive LED sphere/
  disc on the front face, colored via the pure `rackHealthColor()` helper
  (green/amber/red per §2.3.4). Standard blob shadow + outline shell — no
  bespoke geometry beyond a body box and a stack of thin horizontal bars
  suggesting a rack-unit look, if the "rack" flavor (vs. "NAS tower" flavor)
  is chosen via a `bodyShape` field mirroring the printer fixture's pattern.
- **Dirty key**: folds into `_keyFloor`'s appliance/state hash exactly like
  the printer (aggregate health state as one bucketed term); this is the
  cheapest of the three since there's only one derived value (the LED
  color) to hash.
- **Layer**: `appliances` (or a plain `furniture` categorization is equally
  defensible — this is the most "just a box" of the three; either choice
  is consistent with existing conventions, pick one and note it doesn't
  matter functionally).
- **Click behavior**: click → if a Reboot/Shutdown `button.*` is bound
  (Synology has one), offer it via the same confirm-and-press pattern used
  elsewhere for destructive actions (or simply omit — the safest MVP choice
  is display-only, matching the "locks are display-only" precedent
  Diorama already has for high-consequence toggles it chose NOT to expose
  one-click). Recommend **display-only** for MVP; a reboot button is a
  footgun for a spatial glance panel and doesn't need to ship day one.

## 5. Integration steps

Ordered checklist per fixture, following the canvas-fixture recipe (types →
geometry → canvas-render → canvas-hit → canvas-interact → sidebar/TOOLS →
three-renderer group → dirty key). Since all three are `FurnitureKind`
entries riding the *existing* furniture pipeline, most steps collapse to
"extend an existing switch statement," per CLAUDE.md's own furniture-kind
gotcha note.

1. **types.ts** — add optional fields to `Furniture`: mailbox
   (`mailEntity?`, `lidEntity?`), printer (`printerProgressEntity?`,
   `printerStateEntity?`, `bedTempEntity?`, `nozzleTempEntity?`,
   `printerDoorEntity?`, `printerErrorEntity?`, `pauseButtonEntity?`,
   `resumeButtonEntity?`, `stopButtonEntity?`, `bodyShape?: 'enclosed' |
   'open_frame'`), rack (`problemEntities?: string[]`, `rackCpuEntity?`,
   `rackTempEntity?`, `bodyShape?: 'rack_unit' | 'tower'`). All optional —
   no `repairFloor` change needed (item-level fields on an existing array).
2. **geometry.ts** — add `mailbox`, `printer_3d`, `network_rack` (naming
   TBD) entries to `FURNITURE_KINDS` with default w/h/height/tint per §3;
   add a `cat: 'peripheral'` (new optgroup) or fold into `appliance`/
   `outdoor` depending on final call; if a new cat is introduced, add it to
   wherever the `_keyFloor` appliance-state-hash filter enumerates
   `cat === 'appliance'` membership so state changes actually rebuild.
3. **canvas-render.ts** — add cases to `drawFurniturePrimitive` for the
   three new kinds (or reuse the generic-recipe custom-object renderer if
   simple enough); add the progress-bar/badge/LED-dot 2D chips using the
   existing badge/chip helper idioms (`drawBatteryBadge*`, oven `N°` chip).
4. **canvas-hit.ts** — no new hit-test function needed if these are plain
   `FurnitureKind`s (they ride the existing furniture hit test); only touch
   this file if a badge/chip needs its own draggable-handle hit region
   (env sensors' size-handle precedent) — not needed for MVP.
5. **sidebar.ts** — extend the Furniture editor's per-kind conditional
   fields: for mailbox, two entity-picker rows (mail count sensor, lid
   binary_sensor) with `_localBadge` fallback; for printer, five entity-
   picker rows + `bodyShape` dropdown; for rack, a multi-select/list-add UI
   for `problemEntities[]` (mirrors how alarm/robot pick a single entity —
   this one is a small array, closer to how `Store.geo.landmarks` or
   `customObjects.primitives` already manage small repeated sub-lists in
   the sidebar) + `bodyShape` dropdown. No new `_section` — these live
   inside the existing Furniture section's per-item sub-block, like every
   other furniture kind's conditional fields (fridge door sensor row,
   TV/appliance bind row) already do.
6. **three-renderer.ts** — add `switch (kind)` cases in `_buildFurniture`
   for the three new bodies (§4 composites); register printer/rack LED
   materials for in-place recolor (like the appliance in-use LED already
   does) rather than full rebuild on every state tick; wire mailbox lid
   into the existing `_applianceDoors`-style pivot-group registration +
   `_advanceApplianceDoors` blend (reuse, don't duplicate) if lid-swing
   animation is wanted, else a static open/closed state swap is acceptable
   for MVP.
7. **three-view.ts** — extend the existing appliance-state hash builder
   (whatever function currently folds `cat==='appliance' || isBinKind(kind)`
   into `_keyFloor`) to also catch the three new kinds' bound-entity state
   (mail count/lid, printer progress/state/temps, rack health) — bucket
   progress to 5% steps and temps to a few-degree buckets like existing
   appliance/oven hashing does, so tiny live jitter doesn't thrash rebuilds.
8. **`_isSlowEntity`** (planner.ts) — add the new bound-entity ids
   (mail sensors, printer progress/state/temp, rack problem sensors) to the
   config-path routing list (same treatment as env/robot/alarm ids) so the
   sidebar re-renders on change without needing the 10 Hz live channel.
9. **Test page** — add a `peripheral-fixtures-test.html` (or extend an
   existing furniture test page) asserting: mailbox lid swing + badge count
   render, printer progress bar/LED/AMS-tray tint render across both
   `bodyShape`s, rack LED color resolves correctly from `rackHealthColor()`
   for green/amber/red inputs — following the existing `PASS N/N` test-page
   convention (`robot-test.html`, `covers-test.html`, etc.).

No `HaApi` additions are required for any of the three (plain state reads +
`button.press`/generic `call_service`, both already supported in both
`HassClient` and `HassPanelAdapter`). No new top-level `Store` field is
needed either — everything is item-level on `Furniture`.

## 6. Potential additional features

- **Mailbox flag (outgoing mail)** as a second, independent boolean prop
  distinct from "lid opened for delivery" — real mailboxes have both signals
  and they mean opposite things; worth a second optional `flagEntity`.
- **Package delivery thought bubble**: feed a "package delivered" event
  into the existing recent-triggers bubble tier (`BUBBLE_POOL_TRIGGER`-style)
  so an avatar walking near the mailbox shortly after a delivery gets a 📦
  glyph — reuses the shipped doorbell-pulse/recent-trigger machinery
  (`ctx.recentTriggers`) rather than inventing a new one.
- **Print-complete notification pulse**: reuse the doorbell
  `TransientPulse`/`updateDoorbellPulses` primitive for "print just
  finished" (state transition to a completed/idle state after having been
  printing) — a generic transient-pulse primitive already exists and is
  explicitly documented as reusable for exactly this kind of one-shot event.
  A 🖨️✅-style thought-bubble trigger for a nearby avatar is the same idea
  as the package-delivered bubble above.
- **Printer camera integration**: OctoPrint/Synology/Bambu (X1 only) all
  expose a `camera.*` entity — Diorama's existing camera-fixture snapshot-
  card pattern (`_camAlertGroup`, entity_picture cache-bust) could show a
  "now printing" thumbnail the same way the now-playing card shows album
  art, rather than only the generic Cover Image sensor.
- **AMS/filament low-stock warning color** — escalate the AMS tray tint or
  add a small warning glyph when `Remaining Filament` drops below a
  threshold, mirroring the `ENV_KINDS` warn/danger escalation pattern.
- **Rack fan-speed control** (Synology exposes a fan-mode selector) — could
  be wired as a real interactive control if the display-only stance in §4.3
  is later relaxed; deliberately deferred for MVP given the "locks are
  display-only" precedent for high-consequence toggles.
- **Generic printer via IPP** (core `ipp` integration, doc:
  [home-assistant.io/integrations/ipp](https://www.home-assistant.io/integrations/ipp/))
  covers ink/laser office printers (auto-discovered or manually added via
  hostname; local polling). It exposes a printer-state sensor (idle/
  printing/stopped-style) and one **marker/ink-level sensor per cartridge**
  color detected (percentage remaining) via the underlying `pyipp`
  ([github.com/ctalkington/python-ipp](https://github.com/ctalkington/python-ipp))
  client, which reads the IPP `printer-state`/`marker-levels`/`marker-colors`
  attributes over the standard Internet Printing Protocol — but it is
  **read-only** (no print/pause/cancel action exists in this integration;
  IPP as HA implements it is a status-only protocol here). This is a much
  lighter-weight sibling fixture: same body-shape idea as the 3D printer
  minus the toon-glow/AMS richness, plus a set of small colored ink-level
  bars (CMYK) instead of a filament tray — worth offering as a `bodyShape:
  'office_printer'` variant or a wholly separate, simpler kind, since an
  office inkjet/laser printer has neither a build plate nor a progress
  percentage worth animating, just "idle/printing/error" + ink levels.

## 7. Open questions & risks

- **Vendor/integration fragmentation is real and unavoidable** for all
  three peripherals — there is no core "mailbox," "3d_printer," or
  "network_rack" domain in HA; everything is assembled from generic
  `sensor`/`binary_sensor`/`button`/`number` entities the user binds
  themselves. This is consistent with how Diorama already treats
  appliances/robots/alarm panels (bind whatever entity you have), but it
  means the sidebar binding UI is doing real work here (multiple optional
  entity-picker rows per fixture) — worth confirming the UX doesn't feel
  like a form wall, particularly for the rack fixture's `problemEntities[]`
  array (small repeated-list UI pattern — closest precedent is the
  custom-object primitives list editor, which is already a bit fiddly).
- **HA Floor Registry / Floor entity attribute confidence**: not applicable
  here (that was the avatar-nav-stairs doc's territory) — no similar gap in
  this doc; flagging only that all entity-list claims above came from
  official integration doc pages and the `const.py`/entity-reference pages
  directly, so confidence is **high** for OctoPrint/Synology/UniFi/IPP (core,
  documented) and **medium-high** for Mail-and-Packages/Bambu/Moonraker
  (custom, but read directly from the source `const.py` / official entity-
  reference docs.page, not just blog posts) — still worth a spot-check
  against a live install before hardcoding exact default entity_id prefixes,
  since HACS integrations rename entities across major versions more freely
  than core does.
- **Does a Bambu "Cover Image" / OctoPrint camera snapshot need a new
  `HaApi` image-fetch path, or does it reuse `haBaseUrl + entity_picture`
  exactly like existing camera/robot-map/now-playing images?** Almost
  certainly the latter (same `entity_picture` attribute convention every HA
  camera/image entity uses) — flagged as a "verify once, should be free"
  item, not a real unknown.
- **Mailbox lid sensor is BYO hardware** — Diorama can't assume every user
  has one; the fixture must work sensibly with `lidEntity` entirely absent
  (package badge only, no lid animation), which the `localState`/optional-
  binding pattern already handles cleanly, but it's worth explicitly
  deciding the *default* prop appearance when nothing at all is bound (a
  static closed mailbox with no badge, presumably — same as an unbound
  appliance rendering as a plain box today).
- **UniFi per-client AP/room mapping is confirmed absent from the HA
  integration's documented entity set** — this closes the door on the one
  genuinely "spatial" idea a network-rack feature might otherwise chase
  (placing a phone icon in whichever room's AP it's associated with). If a
  user wants that, the honest answer is "you already have Bermuda BLE
  trilateration for this, shipped" — not a UniFi-based feature. Worth
  stating explicitly to whoever picks this up so they don't re-discover the
  dead end mid-implementation.
- **Where does `problemEntities[]` "problem" state come from generically?**
  Different binary_sensors use different device classes (`problem`,
  `connectivity`, `safety`) with different on/off semantics, and some of
  the "bad" signals above are actually plain text-state sensors (Synology
  disk "status" is a string, not a boolean). The aggregate health resolver
  needs a small per-entity rule table (device_class-aware default: `problem`/
  `safety` → on=bad; `connectivity` → on=good/off=bad (inverted!); text
  sensor → compare against a known-good literal set) rather than a single
  boolean assumption — get this wrong and the LED lies. Flag as a real
  design detail to get right, not just wire up naively.
- **Scope discipline**: all three peripherals are explicitly the "low
  spatial value" tier per the research prompt itself — resist the urge to
  over-invest in animation richness (e.g., don't build a full print-head
  gantry motion simulation); the value proposition is "the object exists in
  the plan and shows its one important number/state at a glance," matching
  env sensors and safety sensors, not full furniture-tier richness.

## 8. Sources

- [github.com/moralmunky/Home-Assistant-Mail-And-Packages](https://github.com/moralmunky/home-assistant-mail-and-packages) — repo overview
- […/wiki/Configuration-and-Email-Settings](https://github.com/moralmunky/Home-Assistant-Mail-And-Packages/wiki/Configuration-and-Email-Settings) — setup/config, sensor list, image sensors, binary sensor enable step
- `custom_components/mail_and_packages/const.py` (raw GitHub) — exact sensor key list per carrier
- [home-assistant.io/integrations/octoprint](https://www.home-assistant.io/integrations/octoprint/) — core OctoPrint integration entity list
- [home-assistant.io/actions/octoprint.printer_connect](https://www.home-assistant.io/actions/octoprint.printer_connect/) — action signature
- [github.com/greghesp/ha-bambulab](https://github.com/greghesp/ha-bambulab) — Bambu Lab custom integration
- [docs.page/greghesp/ha-bambulab/entities](https://docs.page/greghesp/ha-bambulab/entities) — full entity reference
- [github.com/marcolivierarsenault/moonraker-home-assistant](https://github.com/marcolivierarsenault/moonraker-home-assistant) + [moonraker-home-assistant.readthedocs.io](https://moonraker-home-assistant.readthedocs.io/en/latest/) — Klipper/Moonraker custom integration
- [home-assistant.io/integrations/synology_dsm](https://www.home-assistant.io/integrations/synology_dsm/) — core Synology DSM entity list
- [home-assistant.io/integrations/unifi](https://www.home-assistant.io/integrations/unifi/) — core UniFi Network entity list
- [home-assistant.io/integrations/systemmonitor](https://www.home-assistant.io/integrations/systemmonitor/) — core System Monitor (host-only)
- [home-assistant.io/integrations/ipp](https://www.home-assistant.io/integrations/ipp/) — core Internet Printing Protocol integration
- [github.com/ctalkington/python-ipp](https://github.com/ctalkington/python-ipp) — `pyipp` client backing the core IPP integration (marker-levels/printer-state attributes)
- USPS curbside mailbox size chronology: [about.usps.com/who/profile/history/pdf/curbside-mailboxes-size-chronology.pdf](https://about.usps.com/who/profile/history/pdf/curbside-mailboxes-size-chronology.pdf); mailbox dimension summaries via [mailboxavenue.com](https://mailboxavenue.com/blogs/the-mailbox-blog/how-big-is-a-standard-mailbox)
- Bambu Lab P1S tech specs PDF: [marketplace.createeducation.com/.../bambu-lab-P1S-tech-specs.pdf](https://marketplace.createeducation.com/wp-content/uploads/2023/11/bambu-lab-P1S-tech-specs.pdf); X1 Carbon / A1 tech specs via [bambulab.com/en/a1/tech-specs](https://bambulab.com/en/a1/tech-specs)
- 19-inch rack unit dimensions: [en.wikipedia.org/wiki/19-inch_rack](https://en.wikipedia.org/wiki/19-inch_rack)
- Synology DS920+ product spec PDF: [global.download.synology.com/.../Product_Spec_DS920+_enu.pdf](https://global.download.synology.com/download/Document/Hardware/ProductSpec/DiskStation/20-year/DS920+/enu/Product_Spec_DS920+_enu.pdf)
- UniFi Dream Machine / Dream Machine Pro tech specs: [techspecs.ui.com/unifi/other/udm](https://techspecs.ui.com/unifi/other/udm), [techspecs.ui.com/unifi/cloud-gateways/udm-pro](https://techspecs.ui.com/unifi/cloud-gateways/udm-pro)
