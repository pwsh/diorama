# Kiosk on Alexa Echo Show Displays

Research doc for a Diorama feature. Status: research only, not implemented.

## 1. Summary

Diorama's normal deployment story — a URL loaded in a browser, with `uiMode`
(`edit`/`kiosk`/`view`) and URL templates (`?mode=kiosk&layers=simple&view3d=…&cam=…`)
already built for exactly this "point a screen at it" use case — assumes the
screen runs a real, persistent browser tab. **An Echo Show does not offer
that.** Its on-device browser (Amazon Silk) has no supported kiosk/app mode,
auto-returns to the Alexa home screen on inactivity, and the OS is actively
getting *more* locked down over time (Fire OS → Vega OS drops sideloading
entirely). Alexa's own screen-content technology, APL (Alexa Presentation
Language), is a declarative JSON layout language with no WebGL/Canvas/script
primitive at all — it cannot run three.js under any circumstance, independent
of the Silk problem.

This doc's conclusion, stated up front: **a persistent WebGL Diorama panel on
an Echo Show is not viable**, on two independent, structural grounds (browser
policy + APL's rendering model), not just inconvenient policy friction. What
**is** realistically buildable, in descending order of "how Diorama-like it
feels":

1. **A periodically-refreshed static snapshot image** of the Diorama 2D plan
   (or a still 3D render), pushed to the Echo Show as a full-screen photo via
   Home Assistant + the community `alexa_media_player` integration. Reuses
   Diorama's existing kiosk URL templates and chrome-free rendering almost
   entirely unchanged — a headless-browser screenshot is the only new piece.
2. **A small hand-authored custom Alexa Skill using APL** ("Diorama Lite") —
   a native glanceable room/occupancy/lights summary, voice-invoked or docked
   as a Home-screen Widget on the devices that support widgets. This is a
   real, scoped skin, not a port of Diorama's renderer — APL has its own
   component set and the datasource has to be hand-built from HA state.
3. **Alexa Routines + a camera "show" trick** for point events (doorbell,
   motion) — leans entirely on HA's existing Alexa camera exposure and a
   community-discovered `alexa_media_player` phrase-replay trick, not on
   Diorama's renderer at all, but complements it for alert-style moments.

Sections 3–5 below map each option onto Diorama's actual architecture
(`uiMode`, the canvas-fixture recipe, `_texCache`/`_mat`, dirty keys) and give
an implementation checklist; §6 is candid about what's fragile/unofficial and
what could break with an Amazon OS update.

## 2. Platform / data model / real-world facts

### 2.1 Device lineup: real sizes, resolutions, OS

All figures verified against Amazon's own developer device-spec page plus
corroborating retail/dimension sources (see §7). "px" = native panel
resolution; "mm" = physical unit footprint (not just screen diagonal).

| Model | Screen diagonal | Resolution | Physical size (W×H×D) | OS |
|---|---|---|---|---|
| Echo Show 5 (1st/2nd gen) | 5.5" | 960 × 480 px (~196 PPI) | ~148×86×73 mm (compact puck form) | Fire OS |
| **Echo Show 5 (3rd gen, 2023)** | 5.5" | 960 × 480 px | similar puck form | **Vega OS** (Amazon's own Linux-based OS) |
| Echo Show 8 (1st/2nd gen) | 8" / 8.7" (newer gen grew) | 1280 × 800 px | 200 × 135 × 99 mm | Fire OS |
| Echo Show 10 | 10.1" (motorized swivel base) | 1280 × 800 px | — | Fire OS |
| Echo Show 15 (2021, and Gen 2 2024) | 15.6" | 1920 × 1080 px, 400 nits, 72% NTSC gamut, full lamination | 402 × 252 × 35 mm (wall-mount slab; deeper with the optional tilt stand) | Fire OS |
| Echo Show 21 (2024) | 21.4" | 1920 × 1080 px, 400 nits, 72% NTSC gamut | ≈543 × 335 × 38 mm | Fire OS (Vega-adjacent hardware generation) |

Source for the resolution/panel numbers: Amazon's own [Echo Show device
specifications page](https://developer.amazon.com/docs/device-specs/device-specifications-echo-show.html).
Physical mm figures cross-checked against dimensions.com (Echo Show 8) and
retail/press unit conversions for the 15/21 (Tom's Guide, Best Buy Q&A) since
Amazon's spec page does not itself publish device footprint in mm.

### 2.2 OS trend: Fire OS today, Vega OS tomorrow — and it's getting *more* locked down

- Legacy/current Echo Show hardware (5 1st/2nd gen, 8, 10, 15, 21) runs **Fire
  OS**, Amazon's Android/AOSP-derived OS. Fire OS **restricts the browser to
  Amazon Silk** and, on current-generation units, has had the underlying
  System/Files app removed — the mechanism earlier hobbyists used to sideload
  unknown APKs (like Fully Kiosk Browser) no longer exists on stock recent
  units.
- Amazon has already begun replacing Fire OS with **Vega OS**, a Linux-based
  OS "built with React Native and web technologies." It already ships on
  **Echo Show 5 (3rd gen, 2023)**, Echo Hub, Echo Spot, and the newest
  (2025-2026) Fire TV Stick 4K Select. Both OSes will coexist through
  2025–2026; Amazon has said it has no plans to retrofit Vega OS onto
  existing Fire OS units (so an existing Echo Show won't suddenly get
  *worse*, but every *new* purchase trends that way).
- **Vega OS explicitly disallows sideloading** — app installs are limited to
  the Amazon Appstore. This is a strictly *more* locked-down model than
  current Fire OS, not a loosening. ([Vega Developer Tools announcement](https://developer.amazon.com/apps-and-games/blogs/2025/09/announcing-vega-os);
  [AFTVnews: "No more Android or sideloading on new models"](https://www.aftvnews.com/amazon-confirms-all-future-fire-tv-sticks-will-run-vega-os-no-more-android-or-sideloading-on-new-models/).)
- Net: **don't design around future OS-level device access.** The trend line
  is the opposite direction. Whatever ships needs to work through Alexa's
  own sanctioned surfaces (Skill/APL, HA's Alexa integration, casting/photo
  push), not a jailbreak.

### 2.3 Silk browser reality: no supported kiosk mode

- There is no official "kiosk mode," fullscreen lockdown, or app-manifest/PWA
  install path for Amazon Silk on Echo Show. Community reports (uncorroborated
  by Amazon docs, but consistent across threads) describe Silk **auto-closing
  back to the Alexa home screen after roughly 10–15 minutes of inactivity**.
- The most cited workaround is **[`keep-silk-open`](https://gitlab.com/DaGammla/keep-silk-open)**
  (also mirrored on GitHub): a script embedded in the dashboard page that,
  once the user has touched the screen at least once, plays a silent looping
  audio track and reloads the page every minute so Silk's activity heuristic
  never fires the auto-close. It only works after Silk is manually opened to
  the URL (e.g., "Alexa, open Silk") — nothing re-opens it automatically
  after a reboot or power loss, and it's a fight against undocumented,
  Amazon-controlled behavior that can change on any firmware update.
- **Fully Kiosk Browser** (the standard Android kiosk-lockdown app used
  successfully on Fire *tablets* for Home Assistant dashboards) requires
  sideloading an APK. On current-generation Echo Show 15/21 this path is
  **closed** (System/Files app removed). The one documented success is an
  older **1st-generation Echo Show 5** exploit (Fire OS 6.5.7.0, via a
  Micro-USB unlock) described in a HowToGeek writeup — not reproducible on
  new hardware and not something to plan a build around.
- Even setting the timeout/sideload problem aside, Echo Show SoCs (especially
  the 5/8 tier) are lower-spec than typical Fire tablets; no vendor
  documentation confirms WebGL2 support in Silk on this hardware at all. This
  is a secondary, independent reason a three.js scene is a poor bet here even
  for a one-off demo.

### 2.4 Alexa Presentation Language (APL): the sanctioned screen-content path — and its hard ceiling

- **What it is**: Amazon's JSON-based declarative UI language for
  Alexa-skill screen responses. Docs:
  [Configure Your Skill with the APL Interface](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-support-for-your-skill.html),
  [Alexa.Presentation.APL Interface Reference](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-interface.html).
  A skill enables the `Alexa.Presentation.APL` interface, then a request
  handler returns an `Alexa.Presentation.APL.RenderDocument` directive
  carrying a `document` (layout template) + a `datasources` JSON object bound
  into it.
- **Component set**: Frame/Container/Text/Image/Sequence/Pager/VectorGraphic
  (APL Alexa Vector Graphics, for simple icon-style SVG-like assets) plus the
  "Alexa Design Language" Responsive Components/Templates. There is **no
  WebGL, `<canvas>`, or general scripting primitive** — APL is a native
  renderer with a fixed component vocabulary, not a browser engine. This is
  the hard architectural wall: even if Silk's kiosk problem were solved, APL
  itself cannot host Diorama's three.js scene.
- **Response constraints** (from the [Request and Response JSON
  Reference](https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-and-response-json-reference.html)):
  a skill must respond within **8 seconds** or Alexa logs
  `SKILL_RESPONSE_TIMEOUT_EXCEPTION`; total response payload is capped at
  **120 KB**.
- **Viewport profiles**, not raw device models — a document targets named
  buckets so the same layout adapts across hardware:
  [Viewport Profiles reference](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-alexa-viewport-profiles-package.html).
  Echo Show 5/8 land in `hubLandscapeSmall` (960–1280 dp wide, <600 dp tall);
  Echo Show 10/15/21-class devices land in `hubLandscapeMedium`/`hubLandscapeLarge`
  (960–1279 / wider dp, 600–959+ dp tall); there's also `hubRoundSmall` for
  round-screen devices (Echo Spot) not relevant here.
- **No true always-on push channel**: APL responses are fundamentally
  request/response, tied to a voice interaction or an explicit directive in
  reply to one. The **ProactiveEvents API**
  ([docs](https://developer.amazon.com/en-US/docs/alexa/smapi/proactive-events-api.html))
  sends factual notification events from pre-defined schemas — not custom
  APL screen pushes. The **Skill Messaging API** can wake a skill session
  server-side, but per Amazon's own guidance it exists to trigger the skill
  to *then* interact — it is not a mechanism to silently refresh a
  standing full-screen APL document with no session. **There is no
  officially documented "keep a custom APL dashboard live and update it in
  place forever" pattern.**

### 2.5 Alexa Widgets: real, but small and access-gated by model

- Widgets are APL-built glanceable tiles that live in the **Favorite Widget
  Panel (FWP)**, a home-screen carousel capped at **10 widgets per device**.
  Docs: [Widgets Introduction](https://developer.amazon.com/en-US/alexa/alexa-haus/widget-introduction).
- **Device support is a real gate, not a raw-capability question**: widgets
  work on Echo Show 8 (1st/2nd gen), Echo Show 10 (2nd/3rd gen), and Echo
  Show 15 — **NOT** Echo Show 5 (1st gen), the original Echo Show 10, or Echo
  Spot. (Doc language: "not currently available on the Echo Show 5, first
  generation of Echo Show 10, and Echo Spot.")
  Echo Show 21 support was not separately confirmed in Amazon's widget doc at
  research time — verify on real hardware before relying on it (see §6).
- An announced-but-pending **"Widget Shortcuts"** feature would overlay a
  widget on the Home screen as a "QuickView" without opening the FWP, on
  Echo Show 5/8/10 — described as upcoming, not yet something to build
  against.
- Widgets self-update (poll/refresh through the widget's own backend) but are
  a small tile, not a full-screen persistent plan view.

### 2.6 Home Assistant's Alexa Smart Home integration: what it actually does

Doc: [Amazon Alexa Smart Home Skill](https://www.home-assistant.io/integrations/alexa.smart_home/).

- Primary purpose is **voice control** ("Alexa, turn off the light") via a
  cloud-to-cloud Smart Home skill; it exposes entities to Alexa's device
  model, it does not push arbitrary UI.
- `media_player` entities get real Alexa media capabilities: channel change,
  volume/mute, sound-mode presets, source selection from a fixed name list
  (HDMI 1–10, DVD, CABLE, …), and pause/play/restart — **no skip/rewind**.
- **Camera live view on Echo Show** is supported, but gated hard:
  > "The Home Assistant URL must be accessible from the network the Amazon
  > echo device is connected to and must support HTTPS on port 443 with a
  > certificate signed by an Amazon approved certificate authority."
  Self-signed certs are rejected; Home Assistant Cloud or Let's
  Encrypt/DuckDNS satisfy the requirement in practice (despite Amazon's own
  disclaimer wording suggesting otherwise — this is corroborated by
  community reports). Home Assistant's `stream` integration (H.264 video /
  AAC audio over HLS) is required, and enabling **"preload stream"** on the
  camera is recommended so the response beats the response-time budget for
  the initial camera-stream request (community threads describe a ~6-second
  window here — separate from the 8-second *skill* response timeout in
  §2.4, which is a different API surface).
- There is **no directive in this integration for showing an arbitrary
  webpage or dashboard** — the only "visual push" primitive is the live
  camera stream card.

### 2.7 The actual "push something visual" primitives that exist (community, via `alexa_media_player`)

[`alandtse/alexa_media_player`](https://github.com/alandtse/alexa_media_player)
is a HACS custom_component (not core HA) that rides Amazon's **unofficial,
reverse-engineered** internal Alexa API to expose each Echo device as an HA
`media_player`. Two things it can do are directly relevant:

1. **Full-screen static image push**:
   ```yaml
   action: media_player.play_media
   target:
     entity_id: media_player.echo_show
   data:
     media_content_id: "https://your-ha-instance/local/diorama-snapshot.png"
     media_content_type: image
   ```
   The URL must be a valid `https` image URL. This is the closest real
   analog to "kiosk" behavior available today — a still image shown
   full-screen on the device.
2. **Phrase replay ("custom" media type)** — a community-discovered trick
   (thread: [Send command to alexa, such as displaying my camera 1](https://community.home-assistant.io/t/send-command-to-alexa-such-as-displaying-my-camera-1/153066)):
   ```yaml
   action: media_player.play_media
   target:
     device_id: media_player.my_echoshow
   data:
     media_content_id: "Show me the front door"
     media_content_type: custom
   ```
   This replays the given phrase to the Echo as if the user had spoken it —
   so it can trigger any existing Alexa Routine or camera-name utterance
   from an HA automation, **provided the target (e.g. a camera) is already a
   recognized Alexa smart-home device** through some other integration path.

Neither of these — nor anything else found in this research — offers "load
an arbitrary web page/dashboard URL full-screen," only a still image or a
voice-phrase replay.

## 3. Diorama design / integration

Given §2's ceiling, the practical designs below reuse Diorama's *existing*
machinery as much as possible rather than inventing new rendering paths.

### 3.1 Option A — periodic snapshot image (recommended first build)

This needs **zero changes to Diorama's renderer**. It reuses:

- The existing **kiosk URL template** (`?mode=kiosk&layers=simple&floor=<id>&view=2d&cam=x,y,z,tx,ty,tz`)
  already documented in CLAUDE.md — kiosk mode already hides editing chrome
  (sidebar, floor buttons, settings, save-view button render only in `edit`
  mode). **Verify at implementation time whether the topbar itself is fully
  hidden in kiosk mode** — if not, a small CSS tweak or a new `chrome=0`
  template param may be worth adding (see §6 open questions).
- The **"Simple floorplan" `Layers2D` preset** (everything off + targets +
  activity) for a clean, glanceable crop — exactly the preset already
  designed for exactly this kind of low-chrome display.
- The **`cam=` saved-view template** if a still 3D Sims-toon render is
  preferred over the 2D plan — you get the toon look, blob shadows, and
  outline shells "for free" in a still frame, at zero runtime FPS cost since
  it's captured once per refresh, not rendered live.

New pieces needed (outside Diorama's own codebase — a small companion
script/service, not a panel feature):

1. A headless-browser render step (e.g. Playwright/Puppeteer) that loads the
   kiosk URL at a fixed viewport matched to the target Echo Show's native
   resolution (1920×1080 for 15/21, 1280×800 for 8/10, 960×480 for 5),
   waits for the scene to settle (a couple of animation frames is enough —
   Diorama's dirty-key rebuilds mean the scene is stable almost immediately
   after load for a static view), and screenshots to PNG.
2. Host the PNG at a stable HTTPS path — the natural place is the same
   `www/` directory Diorama already deploys `dist/` into (`config/www/…`),
   so no new HTTPS/cert plumbing beyond what the existing Alexa
   integration/instance already needs.
3. An HA automation (time-pattern trigger, e.g. every 60–300 s, or an
   event-triggered refresh — see §5) calls `media_player.play_media` with
   `media_content_type: image` against the Echo Show's `alexa_media` entity.

This is honest about what it is: a **slideshow**, not a live panel. There is
no interactivity, no live target dots between refreshes, no click-to-toggle.
Cadence should be chosen with that tradeoff explicit to the user (see §6).

### 3.2 Option B — "Diorama Lite" custom APL skill

A scoped, hand-authored native skin, not a code reuse of the three.js/2D
renderer (APL cannot execute or embed either). Concretely:

- **Datasource shape**: mirror Diorama's own domain model at the *room*
  granularity — walk `Floor.rooms[]` (already resolved via
  `resolveRoomForPoint`/wall loops in the live panel) and for each room emit
  `{name, color, occupied, lightsOn, tempC?}` by reading the same bound
  entities Diorama already tracks (`Room.occupancyEntity`, light `on`
  states, an optional `EnvSensor`). The backend (Lambda or any HTTPS
  endpoint registered as the skill's fulfillment) fetches this from HA's
  REST API (`GET /api/states`) using a **long-lived access token** — the
  same auth primitive Diorama's own standalone/iframe mode already relies on
  (`diorama:token` in `HassClient`), so no new HA-side auth concept.
- **Visual vocabulary parity**: Diorama already uses emoji glyphs for tools
  and fixtures (`LIGHT_GLYPH`, alarm 🚨, mmWave, etc.) — reuse the *same*
  glyph strings as plain APL `Text` components (or `VectorGraphic`/AVG icons
  if a crisper look is wanted) so the mini-skill visually rhymes with the
  real panel without needing custom art.
- **Layout responsiveness**: build against the viewport-profile package
  (§2.4) — `hubLandscapeSmall` for Show 5/8, `hubLandscapeMedium`/`Large`
  for 10/15/21 — using APL's Responsive Components so one document adapts
  rather than hand-tuning per model.
- **Update discipline**: since APL has no live-push channel (§2.4), treat
  each voice invocation as a fresh `RenderDocument` built from current HA
  state — conceptually the same discipline as Diorama's dirty-key rebuilds
  (`_keyFloor` et al.: don't recompute more than the input changed), just
  applied server-side, per-request, rather than per-frame.
- **Widget option**: on the devices that support widgets (Echo Show 8/10/15
  — not 5, see §2.5), the same backend can additionally emit a small Widget
  APL document (a 2–3 room occupancy/lights strip) for the Favorite Widget
  Panel, as a lightweight glanceable companion to the voice-invoked full
  view.
- **Certification**: a skill enabled only on your own developer account for
  personal use does **not** need Amazon's public certification pass —
  that's only required to publish a skill for other users.

### 3.3 Option C — Routine-triggered camera show (event-driven, not "the panel")

For alert-style moments (doorbell, motion) rather than a standing dashboard:
lean on HA's existing Alexa camera exposure (§2.6, HTTPS/cert requirements
already apply) plus the `alexa_media_player` phrase-replay trick (§2.7) from
an automation keyed off Diorama's already-shipped detection primitives —
e.g. `Planner.doorbellRings` (the doorbell-pulse detector already feeding the
bubble trigger tier) firing an automation that calls
`media_player.play_media` with `media_content_type: custom` and
`media_content_id: "Show the front door"` on the nearest Echo Show. This
doesn't touch Diorama's renderer at all; it's a complementary "notice me"
channel alongside whichever of A/B is chosen for the steady-state display.

## 4. Setup / integration steps

### 4.1 Option A — snapshot image kiosk

1. Install the `alexa_media_player` custom integration via HACS; complete
   its Amazon account login flow; confirm the target Echo Show appears as
   `media_player.<name>`.
2. Decide the source view: a 2D "Simple floorplan" URL
   (`?mode=kiosk&layers=simple&floor=<id>&view=2d`) or a saved 3D `cam=`
   view. Confirm in a real browser that kiosk mode fully hides Diorama's
   chrome (topbar included) at the target aspect ratio.
3. Write a small headless-browser script (Playwright/Puppeteer) that opens
   that URL at the target Echo Show's native resolution, waits for a stable
   frame, and saves a PNG.
4. Deploy the PNG to a stable HTTPS path (e.g. alongside Diorama's own
   `dist/` under HA's `www/` — same host, same cert, no new infra).
5. Schedule the render step (cron / HA automation `time_pattern` trigger /
   external scheduler) at the desired refresh cadence.
6. Add an HA automation that calls `media_player.play_media` on the Echo
   Show's `alexa_media` entity with `media_content_type: image` pointing at
   the PNG's URL, wired to the same schedule (or to Diorama's own event
   triggers per §5).
7. Empirically test how long the image persists on-screen before the Echo
   reverts to ambient/clock display (undocumented — verify per firmware; see
   §6) and tune cadence accordingly.

### 4.2 Option B — "Diorama Lite" APL skill

1. Create an Amazon Developer account (if not already present) and a new
   Custom Skill in the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask).
2. Enable the **Alexa Presentation Language** interface for the skill
   ([Add APL Support to Your Skill](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/add-apl-support.html)).
3. Define a minimal interaction model (e.g. invocation "diorama", intents
   "open diorama status").
4. Stand up a backend (AWS Lambda, matching Alexa's usual hosting story, or
   any HTTPS endpoint) that: (a) accepts the skill request, (b) calls HA's
   REST API with a long-lived access token to read room/light/occupancy
   state, (c) returns an `Alexa.Presentation.APL.RenderDocument` directive
   with a hand-built `document` + `datasources` JSON.
5. Author the APL document using Responsive Components/Templates against the
   `hubLandscapeSmall`/`Medium`/`Large` viewport profiles; reuse Diorama's
   existing glyph vocabulary for icons.
6. Enable the skill on your own developer/Alexa account (no public
   certification needed for personal use) and test on-device.
7. Optionally add a companion Widget APL document for the Favorite Widget
   Panel on Echo Show 8/10/15.

### 4.3 Option C — routine camera show

1. Confirm the camera of interest is already an Alexa-recognized camera
   device (native Ring/other-vendor Alexa skill, or HA's Alexa Smart Home
   camera exposure with the HTTPS/CA cert requirement from §2.6 satisfied).
2. In the Alexa app, add a Routine with a custom phrase action: "When I say
   '<phrase>' → Show <camera>."
3. From HA, add an automation (e.g. on `Planner`-surfaced doorbell/motion
   events) calling `media_player.play_media` with
   `media_content_type: custom`, `media_content_id: "<phrase>"`, targeted at
   the Echo Show's `alexa_media` entity.

## 5. Potential additional features

- **Time-of-day–matched stills**: schedule the Option A render job to align
  with Diorama's own `resolveTimeBucket`/scene-preset logic, so the pushed
  image's lighting mood (day/dusk/night) matches the real clock rather than
  drifting — cheap since it's just a render-time parameter, not a new
  concept.
- **Per-device crops**: a small hallway Echo Show 8 could get a tighter
  single-room crop while a wall-mounted Echo Show 21 gets the whole-house
  overview — same render pipeline, different saved `cam=`/floor per target
  device.
- **Event-triggered refresh**: instead of (or in addition to) a fixed
  cadence, trigger an immediate re-render + push on the same signals
  Diorama's bubble/log systems already watch (doorbell ring, a light turning
  on, an alarm state change) so the still image feels reactive around the
  moments that matter, even though it's not truly live.
- **Widget occupancy strip**: even if the full "Diorama Lite" skill (Option
  B) isn't built, a minimal widget-only build (2–3 rooms, lights/occupancy)
  is a smaller, still-genuinely-useful slice of the same design.
- **Combine B + C**: a "Diorama Lite" skill session that, on request, also
  triggers a camera show for a room the user asks about ("Alexa, ask Diorama
  to show the kitchen") — bridges the two Alexa-native surfaces.
- **Watch, don't build against, Amazon's "Custom Assistant" program**: Amazon
  has a partner program letting brands build deeper branded assistant
  experiences on Alexa-family hardware (mentioned in passing in widget
  research; e.g. a Verizon-branded assistant). This is a heavy business
  partnership, not a consumer/hobbyist path — noted only as a thing to watch
  for a future, more-open surface, not something to plan around today.

## 6. Open questions & risks

- **Unofficial-API risk**: `alexa_media_player` and its `custom`
  phrase-replay media type ride Amazon's unofficial, reverse-engineered
  internal API. Amazon has broken this integration before (account/2FA
  changes) and could again, with no SLA or advance notice. Anything built
  on Option A/C inherits this fragility.
- **Silk timeout is undocumented and moving**: the ~10–15 minute auto-close
  figure and the `keep-silk-open` countermeasure are both community
  reverse-engineering, not Amazon documentation — could change on any
  firmware push. Don't depend on Silk staying open unattended for Option A's
  render source (mitigated because Option A never needs Silk to stay open —
  the *render* happens in your own headless browser, and the *display*
  happens via the image-push API, not by leaving Silk open on-device).
- **Image persistence window unknown**: how long a pushed `media_content_type: image`
  stays on-screen before the Echo Show reverts to its ambient clock/screensaver
  is not documented anywhere found in this research — treat as untested,
  verify empirically on the target hardware before committing to a cadence.
- **Topbar visibility in kiosk mode unverified for this use case**: CLAUDE.md
  confirms sidebar/floor-buttons/settings/save-view are edit-mode-only, but
  whether the topbar itself fully disappears in `kiosk` mode (vs. just
  losing certain buttons) needs a direct check before relying on kiosk URLs
  for a chrome-free screenshot crop.
- **Vega OS device-support gap**: Echo Show 21 widget support wasn't
  independently confirmed in Amazon's own widget documentation at research
  time (only 8/10/15 were named) — verify on real hardware if targeting a
  21.
- **Certification is a real fork in the road only if ever made public**:
  fine for a personal build (Options A–C are all single-account), but if
  the "Diorama Lite" skill were ever meant for other users, it would need
  Amazon's certification pass — out of scope here, flagged for completeness.
- **Camera-show dependency chain (Option C)**: requires the target camera to
  already be a recognized Alexa smart-home camera through a *separate*
  integration (native vendor skill or HA's own Alexa camera exposure with
  its HTTPS/CA requirement) — an extra prerequisite, not something Option C
  provides on its own.
- **Hardware headroom for WebGL was never actually the blocker**: even
  though no vendor doc confirms or denies WebGL2 support in Silk on
  Echo Show's lower-tier SoCs, it's moot — the kiosk-timeout problem and
  APL's total lack of a script/canvas primitive are both independently fatal
  to a live WebGL panel, so this is noted only for completeness, not as a
  reason to keep investigating the WebGL path.

## 7. Sources

- [Amazon: Echo Show device specifications](https://developer.amazon.com/docs/device-specs/device-specifications-echo-show.html)
- [Amazon Echo Show 8 — dimensions](https://www.dimensions.com/element/amazon-echo-show-8)
- [Tom's Guide: Echo Show 15 vs Echo Show 21](https://www.tomsguide.com/home/smart-home/echo-show-15-vs-echo-show-21)
- [Amazon: Echo Show 21 product page](https://www.amazon.com/Echo-Show-21-Smart-Display/dp/B0CDWWS127)
- [XDA Forums: "The Vega OS transition is starting. Look at the Echo Show 5"](https://xdaforums.com/t/warning-the-vega-os-transition-is-starting-look-at-the-echo-show-5-our-fire-sticks-are-next.4778326/)
- [Amazon Developer: Get started with Vega Developer Tools](https://developer.amazon.com/apps-and-games/blogs/2025/09/announcing-vega-os)
- [AFTVnews: Amazon confirms all future Fire TV Sticks will run Vega OS](https://www.aftvnews.com/amazon-confirms-all-future-fire-tv-sticks-will-run-vega-os-no-more-android-or-sideloading-on-new-models/)
- [SharpTools Community: Echo Show 15 — Kiosk Workaround 2024](https://community.sharptools.io/t/echo-show-15-kiosk-workaround-2024/14930)
- [Home Assistant Community: Fully Kiosk Browser with Amazon Echo Show](https://community.home-assistant.io/t/fully-kiosk-browser-with-amazon-echo-show/392954)
- [DaGammla / keep-silk-open (GitLab)](https://gitlab.com/DaGammla/keep-silk-open)
- [HowToGeek: How I turned my Echo Show into a Home Assistant control panel](https://www.howtogeek.com/how-i-turned-my-echo-show-into-a-home-assistant-control-panel/)
- [Alexa Skills Kit: Configure Your Skill with the APL Interface](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-support-for-your-skill.html)
- [Alexa.Presentation.APL Interface Reference](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-interface.html)
- [Alexa Skills Kit: Request and Response JSON Reference (8 s timeout / 120 KB limit)](https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-and-response-json-reference.html)
- [Alexa Skills Kit: Viewport Profiles](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-alexa-viewport-profiles-package.html)
- [Alexa Skills Kit: About Proactive Events](https://developer.amazon.com/en-US/docs/alexa/smapi/proactive-events-api.html)
- [Amazon Developer: Widgets Introduction](https://developer.amazon.com/en-US/alexa/alexa-haus/widget-introduction)
- [Home Assistant: Amazon Alexa Smart Home Skill integration](https://www.home-assistant.io/integrations/alexa.smart_home/)
- [Home Assistant: media_player.play_media action](https://www.home-assistant.io/actions/media_player.play_media/)
- [GitHub: alandtse/alexa_media_player](https://github.com/alandtse/alexa_media_player)
- [alandtse/alexa_media_player Wiki](https://github.com/alandtse/alexa_media_player/wiki)
- [Home Assistant Community: Send command to alexa, such as displaying my camera 1](https://community.home-assistant.io/t/send-command-to-alexa-such-as-displaying-my-camera-1/153066)
