# Diorama research — build-ready references for outstanding roadmap items

Generated 2026-07-15 by a multi-agent sweep (one Sonnet 5 web-research agent
per outstanding item, Opus-reviewed). Each doc under `docs/research/` is a
build-ready reference for ONE unshipped [ROADMAP](../ROADMAP.md) / backlog
item: Home Assistant data model (verified entity attributes + service/action
signatures with source links), real-world/visual specs, a concrete Diorama
2D+3D visualization & animation design mapped onto the existing architecture,
an integration checklist following the canvas-fixture recipe, additional
feature ideas, and open questions/risks.

**These are research, not decisions.** Where a doc recommends an approach it
says so; the open-questions sections flag the real product calls to make
before implementing.

---

## Opus review synthesis — cross-cutting findings

The 22 docs were written independently but converge on a handful of shared
primitives and prerequisites. Building these ONCE unlocks several features:

### Reusable primitives worth extracting first
1. **Shared "beacon / alert" visual** — sirens, the generic logical-state
   light, and the shipped smoke/CO/leak beacon all want the same pulsing-ring
   + emissive-glow primitive (strobe square-wave vs smooth sine as a param).
   → `sirens-beacons.md`, `generic-logical-light.md`.
2. **Text-plaque / CanvasTexture face** — a toon bezel with an emissive text
   face proud of its front (coincident-face gotcha), painted from a
   CanvasTexture, optionally camera-facing. Recurs in the entity-value display,
   wall calendar, thermostat screen, EV-charger label, and info sprites.
   → `entity-value-display.md` is the reference implementation; reused by
   `calendar-tv-surfaces.md`, `climate-hvac-controls.md`, `ev-charger.md`.
3. **Screen-space HUD overlay beside the weather chip** — a mount-once
   light-DOM element (not a placeable fixture) for things with no natural
   on-plan location: weather forecast panel, weather alerts banner, and the
   global alert/log center + toast tray. → `weather-forecast-display.md`,
   `weather-alerts.md`, `log-events-alerting.md`.
4. **Conditional value→style rule schema** — ranges OR gradient mapping a
   live numeric state to color/effect. The entity-value display and the
   generic logical-state light want the SAME evaluator; design it once.
   → `entity-value-display.md`, `generic-logical-light.md`.
5. **Generic call_service dispatch + subscribe** — the action button, the
   thermostat modal, tap-to-clean, and irrigation all issue arbitrary
   `call_service`; log/alert surfacing wants `subscribe_events` /
   persistent_notification. Both belong on `HaApi` (both impls).
   → `generic-action-control.md`, `log-events-alerting.md`.

### Architectural prerequisites (confirmed by the research)
- **Direct-MQTT bridge** — the gate to Frigate raw boxes + Valetudo room
  maps. Preferred shape is **Path A: ride HA's own `mqtt/subscribe` WS
  command** (zero new credentials, additive to HaApi) — but it **hard-requires
  an admin HA session**, which breaks restricted kiosk users. This is a real
  UX decision, not just code. → `frigate-mqtt-bridge.md`.
- **Floor coordinate alignment** — cross-floor stair traversal (and the
  glass-house "watch them climb" stretch) needs floors to share an origin;
  ghost floors currently center independently. → `avatar-nav-stairs.md`.
- **Generalize mountable auto-snap beyond `Furniture`** — table-sitting
  info cards / clocks need the `mountOnId` surface-snap that today only
  Furniture has. → `entity-value-display.md`.

### Cheap independent wins (no new mechanism)
- Bind `Floor.presenceZones` straight to Frigate's already-HA-visible per-zone
  occupancy `binary_sensor`s — room glow from cameras with **no MQTT bridge**.
- Fold the lock **jammed** state (amber + pulse) into the existing lock color
  switch while touching it for display-only mode.
- UV index + a parasol flourish — `WeatherNow.uvIndex` already exists.

### Suggested build order (low-risk → high-ceiling)
1. Quick fixture reuses of shipped recipes: **sirens**, **fans**,
   **display-only locks**, **moon/UV/vehicle**, **irrigation**, **generic
   action button**.
2. Shared primitives: **entity-value display** + **generic logical light**
   (share the rule evaluator); **climate/HVAC** wall control + modal.
3. HUD overlays: **weather forecast panel**, **weather alerts**,
   **log/alert center** (share the chip-overlay pattern).
4. Avatar depth: **event-focused bubbles**, then **void→stairs** (needs the
   floor-alignment prerequisite).
5. Surfaces & fun: **calendar/TV**, **background text FX**,
   **weather-as-background**.
6. Niche fixtures: **EV charger**, **pool/spa**, **plant health droop**,
   **peripheral fixtures** (mail/printer/rack).
7. High ceiling, high cost: **direct-MQTT bridge → Frigate boxes / Valetudo
   room maps** (do the UX/admin decision first).

---

## Index

### Avatars
- [avatar-nav-stairs.md](avatar-nav-stairs.md) — confine avatars to real
  floor (void areas as nav holes) and route them to stairs; needs the
  floor-coordinate-alignment prerequisite for true cross-floor climbing.
- [event-thought-bubbles.md](event-thought-bubbles.md) — top-priority bubble
  tier for events (appliance finished / rain starts / lightning / severe
  weather), above the recent-trigger tier; Home Connect `job_state` verified.

### Climate, comfort & air
- [climate-hvac-controls.md](climate-hvac-controls.md) — `ThermostatFixture`
  cloning the AlarmPanel recipe: wall unit + popup modal + mode-colored vent
  airflow (heat=red/cool=blue/fan=white) + per-room temp heat-map. **High conf.**
- [fans.md](fans.md) — blade-spin from `percentage`, oscillation sweep,
  `direction` reverse; ceiling vs pedestal/tower. Vendor fragmentation noted.

### Weather (display & backdrop)
- [weather-forecast-display.md](weather-forecast-display.md) — movable,
  customizable `<diorama-weather-panel>` (6 anchors + custom) showing any mix
  of current + hourly + daily via `weather.get_forecasts` (already wired).
- [weather-alerts.md](weather-alerts.md) — region-agnostic alert model
  (NWS Alerts / MeteoAlarm / DWD / Env-Canada) as a HUD banner, its own
  customization. **Medium-high conf** (BOM schema unconfirmed).
- [weather-background-fx.md](weather-background-fx.md) — current weather as
  sky-dome/backdrop + forecast approaching from the horizon (extends the
  existing `_weatherGroup` particle FX).

### Generic controls & indicators
- [entity-value-display.md](entity-value-display.md) — placeable readout of
  ANY entity, custom format/size/color, wall/table/floor, optional billboard,
  range- or gradient-based conditional styling. **High conf** (repo-grounded).
- [generic-action-control.md](generic-action-control.md) — wall/table/floor
  button triggering any entity/scene/script/service; press animation.
- [generic-logical-light.md](generic-logical-light.md) — indicator driven by
  a client-side rule/query (e.g. >200°F red, >300°F flash); shares the
  value→style evaluator with the entity-value display.
- [locks-display-only.md](locks-display-only.md) — per-door display-only flag
  (show state, disable click-to-lock) + fold in the jammed-state color.

### Surfaces & alerting
- [log-events-alerting.md](log-events-alerting.md) — global alert center
  (topbar bell + drawer + toast tray) from persistent_notification (live via
  subscribe) + logbook/system_log/repairs (polled). Non-admin degrades.
- [calendar-tv-surfaces.md](calendar-tv-surfaces.md) — wall calendar fixture
  via `calendar.get_events` + news/weather-on-TV scroller. **High conf.**
- [background-text-fx.md](background-text-fx.md) — fun message text: sky glow,
  grass writing, plane banner, skywriting; one `_messageGroup`, default OFF.

### Yard, vehicles & niche fixtures
- [irrigation-sprinklers.md](irrigation-sprinklers.md) — `SprinklerZone`
  bound to switch/valve; spray-wedge animation while on. Manual binding only.
- [ev-charger.md](ev-charger.md) — vendor-agnostic charger fixture (state /
  power / current-limit / session), cable + charging animation.
- [pool-spa.md](pool-spa.md) — `Floor.pools` sunken basin (reuses stairwell
  recess + bed-cover ripple); heater/pump/light branch on integration.
- [plant-health-sensors.md](plant-health-sensors.md) — thirsty droop/wilt +
  recovery on plant kinds, driven by a bound moisture sensor (FYTA/Mi Flora).
- [moon-uv-vehicle.md](moon-uv-vehicle.md) — moon-phase night-sky prop + UV
  parasol/chip (`WeatherNow.uvIndex` exists) + garage-bay car silhouette.
- [sirens-beacons.md](sirens-beacons.md) — `siren` domain wall beacon;
  strobe primitive shared with the logical light. **High conf.**
- [peripheral-fixtures.md](peripheral-fixtures.md) — mailbox lid + package
  count, 3D-printer progress, NAS/router rack health LED. **High conf** core.

### Architectural (high ceiling)
- [frigate-mqtt-bridge.md](frigate-mqtt-bridge.md) — opt-in direct-MQTT bridge
  (Path A `mqtt/subscribe`, admin-gated) → Frigate box→floor homography
  targets + Valetudo room-segment overlays. **Medium-high conf**; Valetudo
  coordinate unit/origin must be verified on a live instance first.

---

## Deployment, design & content guides (2026-07-15)

A second research batch — NOT roadmap features. These cover *deploying* and
*dressing* Diorama rather than new HA integrations. Opus review: the kiosk set
found **no renderer gap** — Diorama's existing DPR-cap, `shadowMap` off,
toon-material (no PBR), `webglcontextlost` recovery, and `uiMode`/URL-template
kiosk contract are already the recommended mitigations; the work is a
per-platform **setup checklist** plus a few small web hooks (Wake Lock,
Fullscreen, PWA manifest, D-pad focus nav) in [kiosk-web-platform.md]. The one
hard limit: **Echo Show cannot run a WebGL panel at all** — the doc gives three
realistic fallbacks instead.

### Kiosk deployment (running Diorama as a wall display)
- [kiosk-web-platform.md](kiosk-web-platform.md) — **start here**: the
  cross-platform web techniques (Wake Lock, Fullscreen API, PWA manifest +
  offline shell, viewport/safe-area/orientation, auto-refresh self-heal, D-pad
  remote focus nav) and concrete additions to Diorama's kiosk mode. **High conf.**
- [kiosk-android.md](kiosk-android.md) — Android tablets: Fully Kiosk Browser
  (recommended) vs. HA Companion launcher vs. WallPanel (archived May 2025) vs.
  MDM. No renderer gap; setup checklist + small hooks.
- [kiosk-ios.md](kiosk-ios.md) — iPad/iPhone: PWA standalone, Guided Access,
  HA Companion Kiosk mode (best default), iOS kiosk-browser options, wake-lock
  + safe-area + WebGL memory limits. **Medium conf** (some HA-doc strings suspect).
- [kiosk-windows.md](kiosk-windows.md) — Edge/Chrome `--kiosk`, Assigned
  Access + Shell Launcher, auto-login, power/screensaver, touch. **High conf.**
- [kiosk-smart-tv.md](kiosk-smart-tv.md) — webOS/Tizen/Android TV/Fire TV:
  honest per-platform browser + GPU reality, casting, 10-foot no-touch nav.
- [kiosk-echo-show.md](kiosk-echo-show.md) — **candid**: a persistent WebGL
  panel is NOT viable on Echo Show (Silk/Vega OS, APL has no canvas); three
  realistic fallbacks instead. **Medium-high conf.**

### Home theater
- [home-theater-equipment.md](home-theater-equipment.md) — physical elements +
  buildable geometry: Dolby Atmos/CEDIA/THX speaker angles, projector throw,
  screen/seating/riser sizes, acoustic panels, bias lighting (mm). **High conf.**
- [home-theater-ha-control.md](home-theater-ha-control.md) — control surfaces:
  `media_player`, `remote`/Harmony, AV-receiver + projector/PJLink, motorized
  screen covers, HDMI-CEC, movie-mode scenes, bias light sync. **High conf.**
- [home-theater-diorama.md](home-theater-diorama.md) — modeling + visualizing +
  controlling it in Diorama: screen now-playing (reuse `_nowPlayingGroup`),
  projector beam, speaker fixtures, tiered recliners (avatars already `watch_tv`),
  bias lighting, movie-mode dim, click-to-control via the media raycast path.

### Skinning — textures, colors, walls, flooring
- [skin-flooring.md](skin-flooring.md) — hardwood/LVP/tile/stone/concrete/carpet
  with mm plank/tile sizes, color families, patterns → toon `_texCache` textures.
- [skin-walls.md](skin-walls.md) — paint/wallpaper/paneling/brick/stone/tile/
  wainscoting + exterior siding, extending the procedural texture pipeline.
- [skin-palettes.md](skin-palettes.md) — 8 whole-home palettes (modern →
  transitional) with named-paint hex/LRV, **adjusted for the toon saturation
  push** so muted real colors still read. **Medium-high conf.**
- [skin-procedural.md](skin-procedural.md) — the CanvasTexture engineering layer:
  a shared material recipe registry + correct mm repeat, seamless tiling, per-
  material color params, aligned with the `_mat()` toon factory. **Medium-high.**

### Demo house library
- [../demo-houses/README.md](../demo-houses/README.md) — 8 reconstruction-ready
  floor-plan specs (studio → large 3-level luxury), each with mm coordinates,
  room tables, wall/door/window schedules, furniture + appliance placement, and
  skinning — buildable directly into Diorama `Floor`/`Room`/`Wall`/`Furniture`.
