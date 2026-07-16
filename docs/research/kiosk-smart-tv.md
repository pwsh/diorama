# Kiosk on smart TVs (webOS / Tizen / Android TV / Fire TV / Apple TV) — build-ready research

## 1. Summary

Diorama already ships everything a *desktop or tablet* kiosk needs:
`Planner.uiMode` (`edit`/`kiosk`/`view`), URL templates
(`?mode&lock&view&floor&layers&view3d&cam`), a topbar "Kiosk link" button that
mints one from the current camera pose, camera-view presets (`iso/top/front/
back/left/right/sims`), auto-follow + cinematic-orbit ambient camera modes,
and layer presets (`Store.layerPresets2d`, e.g. `simple`) that can strip the
scene down for weaker hardware. None of that is TV-specific — it's just a URL
a browser loads.

The gap is entirely on the **display device** side, and it is a real gap:
smart-TV platforms are not desktop-class web runtimes. This doc is honest
about that. The two hard constraints that matter most for Diorama
specifically are:

1. **No touch, no mouse.** Every existing Diorama interaction (fixture click,
   drag, 3D raycast, zone editing) assumes a pointer. A TV remote is a D-pad
   + OK/Back. There is currently **no D-pad/focus-navigation layer anywhere
   in Diorama** — this would be new work, not configuration.
2. **Weak GPUs.** Diorama's 3D view is a real-time three.js scene (Sims-toon
   `MeshToonMaterial`, animated humanoid rigs, blob shadows, outline shells,
   weather particles) tuned against tablet/desktop-class GPUs. Smart-TV SoCs
   and most streaming-stick GPUs are mobile-class parts from the 2016–2019
   era, some considerably weaker. The 2D canvas view is the safe default for
   most TV hardware; the 3D view is realistically usable only on a handful of
   devices.

This matters for Diorama because the natural TV use case isn't "control panel
you tap" — it's an **ambient living-room display**: the dollhouse view of the
house on the wall, avatars going about their day, watch_tv/now-playing tying
into the room's actual TV. That's a "view mode" / ambient-camera product,
which sidesteps the D-pad problem almost entirely — and that reframing is the
single most important design conclusion of this research.

## 2. Platform / data model / real-world facts

### 2.1 LG webOS (LG Smart TVs)

**Browser engine by platform version** (verified against LG's own developer
docs, [webostv.developer.lge.com/develop/specifications/web-api-and-web-engine](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine)):

| webOS TV platform | Release year | Web engine |
|---|---|---|
| webOS TV 26 | 2026 | Chromium 132 |
| webOS TV 25 | 2025 | Chromium 120 |
| webOS TV 24 | 2024 | Chromium 108 |
| webOS TV 23 | 2023 | Chromium 94 |
| webOS TV 22 | 2022 | Chromium 87 |
| webOS TV 6.x | 2021 | Chromium 79 |
| webOS TV 5.x | 2020 | Chromium 68 |
| webOS TV 4.x | 2018–2019 | Chromium 53 |
| webOS TV 3.x | 2016–2017 | Chromium 38 |
| webOS TV 2.x | 2015 | WebKit 538.2 (browser app used Chromium 34) |
| webOS TV 1.x | 2014 | WebKit 537.41 (browser app used Chromium 26) |

All of these are Chromium/Blink engines with WebGL, so **WebGL itself is not
the blocker on webOS** for anything 2016+ — the blocker is GPU horsepower and
the built-in browser app's restrictions (below), not engine feature support.
LG does not publish an explicit WebGL compatibility statement in this doc;
treat "WebGL works" as inferred from the Chromium version, not LG-confirmed,
and verify on the actual TV.

**The built-in "Web Browser" app** (present on the LG homescreen,
[lg.com support: LG TV – How to Use the Web Browser](https://www.lg.com/us/support/help-library/lg-tv-how-to-use-the-web-browser--20153257222107)) is a normal
consumer browser with real limits for kiosking:
- The **screensaver still activates ~45 minutes after the last remote input**,
  even with energy-saver settings off, and playing fullscreen video does
  **not** reset/prevent it
  ([webOS TV Community: Keep screen on, prevent screensaver/blackout](https://forum.webostv.developer.lge.com/t/keep-screen-on-prevent-screensaver-blackout/740)).
- `navigator.wakeLock.request('screen')` **hangs indefinitely and never
  resolves** on webOS — the standard web Wake Lock API is not usable here.
- There's no documented way to run the stock browser app in a locked-down,
  chrome-less kiosk mode (no URL bar, no back/forward) — that's a native-app
  concept webOS doesn't extend to the browser app.

**The real kiosk path is a packaged web app via Developer Mode**, not the
browser app:
- Install the "Developer Mode" app from the LG Content Store, enable it, then
  from a PC use `ares-setup-device` / `ares-install` (webOS TV CLI, `ares-cli`)
  to push an `.ipk` package built with `ares-generate` / `ares-package`
  ([webOS TV Developer: App Testing with Developer Mode App](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app), [CLI Developer Guide](https://webostv.developer.lge.com/develop/tools/webos-tv-cli-dev-guide)).
- A trivial packaged app is just an HTML shell that iframes/redirects to the
  Diorama kiosk URL — this gets you full-bleed, chrome-less display.
- **Developer Mode sessions expire after 1000 hours (~41 days)** and pulled
  apps get removed; the timer must be reset periodically from the Developer
  Mode app (webOS TV Community / multiple sideload guides). Not a permanent
  install without recurring maintenance.
- Packaged apps get a **screensaver-type config** unavailable to the browser
  app — "Type 2" extends the timeout to 30 min, "Type 3" to 30 min with a
  dimmed full-screen fallback, but **both are OLED-only and require webOS
  5.0+** ([webOS TV Developer: Screensaver guide](https://webostv.developer.lge.com/develop/guides/screensaver)). LCD LG TVs don't get this escape hatch; an
  undocumented Luna Service API call is the only other reported workaround.
- **Permanent/commercial alternative**: LG's webOS Smart Signage Platform is
  the real "always-on kiosk" target, provisioned via platforms like
  [signageOS](https://docs.signageos.io/hc/en-us/articles/4409188234130-webOS) or similar digital-signage MDM tools — no Developer Mode timer,
  officially supported unattended operation. This is a commercial-display SKU
  path, not a consumer TV you buy at a retailer, though signageOS also lists
  consumer webOS models under [supported devices](https://www.signageos.io/supported-devices/lg-webos).

**HA-side control**: HA's core [`webostv` integration](https://www.home-assistant.io/integrations/webostv/) gives a `media_player`
entity with `select_source` (launches an installed app by name/id),
`webostv.command` (raw Luna Service calls, e.g.
`com.webos.applicationManager/launch` with an `id` param to launch a specific
sideloaded app), and `webostv.turn_on` (Wake-on-LAN / HDMI-CEC power-on, since
2022.2 it's a device-trigger/automation, not a bare service). This means HA
can plausibly power on the TV **and** launch the sideloaded Diorama kiosk app
in one automation.

### 2.2 Samsung Tizen (Samsung Smart TVs)

**Browser engine by platform version** (verified against Samsung's own spec
page, [developer.samsung.com/smarttv/.../web-engine-specifications.html](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html)):

| TV model year | Tizen version | Web engine |
|---|---|---|
| 2026 | 10.0 | Chromium M130 |
| 2025 | 9.0 | Chromium M120 |
| 2024 | 8.0 | Chromium M108 |
| 2023 | 7.0 | Chromium M94 |
| 2022 | 6.5 | Chromium M85 |
| 2021 | 6.0 | Chromium M76 |
| 2020 | 5.5 | Chromium M69 |
| 2019 | 5.0 | Chromium M63 |
| 2018 | 4.0 | Chromium M56 |
| 2017 | 3.0 | Chromium M47 |
| 2016 | 2.4 | WebKit r152340 |
| 2015 | 2.3 | WebKit (no Chromium) |

Samsung's own spec explicitly lists **WebGL API (Canvas 3D) as supported
across all modern Tizen versions from 2015 onward** — this is the one
platform where WebGL support is directly vendor-confirmed rather than
inferred. Two other concrete gates from the same spec:
- **Full ES6** (arrow functions, classes, destructuring, template literals,
  Promises) only from **Tizen 5.0 / 2019 TVs onward** — pre-2019 Samsung TVs
  need a transpiled/polyfilled bundle (Diorama's Vite/TS build targets modern
  JS by default; a 2019-or-newer Samsung TV should be treated as the
  practical floor unless the build target is downgraded).
- **Service Worker API** only from Tizen 6.0 / 2021 — irrelevant unless a
  future PWA-style offline cache is added.

**No PWA install on Tizen.** Multiple independent sources confirm Tizen OS
itself never surfaces an "Add to Home Screen" / install prompt, regardless of
whether the underlying browser engine supports the PWA manifest spec
([Progressier: Can a PWA be installed on Tizen OS?](https://intercom.help/progressier/en/articles/6750662-can-a-pwa-be-installed-on-tizen-os), [firt.dev PWA compatibility notes](https://firt.dev/notes/pwa/)). A "pin this URL to the
home screen" flow, the way it works on a phone, does not exist on Samsung TV.

**The built-in browser** is labeled "Web"/"Internet" (globe icon), findable
via TV search if not pinned to the home screen, and behaves like a normal
consumer browser controlled by the remote — same "not a kiosk mode" caveat as
webOS's browser app.

**Real kiosk path**: Developer Mode, enabled from the Apps screen by
entering the sequence **1-2-3-4-5** on the remote, then typing in the
provisioning PC's IP address in the Developer Mode dialog
([TechJunctions: Samsung TV Developer Mode](https://techjunctions.com/samsung-tv-developer-mode/)). From there, **Tizen Studio**
(with the "TV Extensions" + "Samsung Certificate Extension" packages from its
Extension SDK manager) creates a Tizen Web Application project, connects to
the TV via Device Manager over the same LAN, and deploys/runs it
([Samsung Developer: Tizen Studio](https://developer.samsung.com/smarttv/develop/tools/tizen-studio.html), [Norigin Media: Ultimate Guide to Samsung Tizen TV Web Development](https://medium.com/norigintech/the-ultimate-guide-to-samsung-tizen-tv-web-development-f4613f672368)).
Same trivial-iframe-shell trick as webOS works here.
- **Permanent/commercial alternative**: Samsung's Business TV line
  (Tizen-based signage displays) supports provisioning via MagicInfo or the
  Tizen Enterprise/Business Portal, and third-party MDM/signage platforms
  like [signageOS](https://docs.signageos.io/hc/en-us/articles/4405549783058-Samsung-Tizen-Kiosk-Provisioning) or [Wallboard](https://www.wallboard.us/) support arbitrary-URL kiosk
  deployment without a developer-mode dance. Same distinction as LG: consumer
  Tizen TV kiosking is a developer hack; Business TV / signage SKUs are the
  officially supported unattended-display path.

**HA-side control**: HA's core [`samsungtv` integration](https://www.home-assistant.io/integrations/samsungtv/) supports 2016+ Tizen
TVs, offers Wake-on-LAN turn-on (when the TV's MAC is known via discovery),
and communicates over a local REST API + WebSocket for state. It does **not**
appear to expose an app-launch action equivalent to webOS's — worth flagging
as an open question if the goal is "HA auto-launches the sideloaded kiosk
app," not just power on/off.

### 2.3 Android TV / Google TV

Because these are real Android, the standard "any browser is an APK" model
applies — the constraint is whether sideloading/installing that APK is
possible at all, and whether the browser's UI works with a D-pad rather than
touch.

- **[TV Bro](https://github.com/truefedex/tv-bro)** — open-source, purpose-built browser for
  Android TV: "focused item is highlighted, you move between elements with
  the D-pad," Android's built-in WebView (Blink) engine, D-pad/OK/Back
  navigation, no touch assumption. This is the most directly usable
  off-the-shelf option for pointing an Android TV box at a Diorama kiosk URL
  today.
- **[Webview Kiosk](https://github.com/nktnet1/webview-kiosk)** — smaller open-source Android kiosk
  app; its own description explicitly lists "a home assistant dashboard" as a
  target use case.
- **Fully Kiosk Browser** exists but its own vendor documentation flags that
  "Android OS derivatives like Chrome OS, Android TV, Fire OS and Android Go
  Edition may have restricted feature set or have serious issues" — treat as
  unverified on Android TV specifically, not a confirmed-good option the way
  it is on Android phones/tablets ([fully-kiosk.com](https://www.fully-kiosk.com/en/)).

**Real hardware and its GPUs** (this is the load-bearing performance data —
see §2.5 for what it means for three.js):
- Chromecast with Google TV (2020, non-4K and 4K variants): Amlogic S905X3,
  Mali-G31 class GPU.
- Walmart onn. Google TV 4K Plus/Pro (budget boxes, ~$20–50): Amlogic S905X4
  (Mali-G31 MP2, 650 MHz, ~2.6 Gpixels/s, OpenGL ES 3.2 + Vulkan 1.1) in the
  Pro, newer S905X5M in the 2025 4K Plus refresh
  ([androidpctv.com: Amlogic S905X4 comparative](https://androidpctv.com/comparative-amlogic-s905x4/), [gadgetversus.com](https://gadgetversus.com/processor/amlogic-s905x4-vs-nvidia-tegra-x1-t210/)).
- **NVIDIA Shield TV** (2015/2017/2019 revisions): Tegra X1 / X1+, an NVIDIA
  Maxwell 256-core GPU — a materially stronger, discrete-GPU-lineage part
  compared to every Amlogic/Mali box above, even though it's the same rough
  era (20 nm Maxwell vs 12 nm Mali-G31). This is the best-performing "Android
  TV box" option for anything doing real 3D rendering.
- Most **built-in Google TV smart TVs** (Sony Bravia, TCL, Hisense with
  Google TV) use similarly modest embedded Mali/Adreno-class silicon tuned
  for video decode + Android TV UI compositing, not general 3D rendering —
  treat them like the Amlogic boxes above, not like Shield TV.

### 2.4 Fire TV

**Sideloading only survives on the older Android-based models.** Amazon's
own Fire TV developer page confirms *"Starting with Fire TV Stick 4K Select,
all future Fire TV Sticks will run on Vega"* — a new, **Linux-based, non-
Android OS**. Vega OS devices (Fire TV Stick 4K Select, released Oct 2025;
Fire TV Stick HD, Apr 2026) **cannot sideload apps at all** — no Downloader
app, no ADB, no workaround; it's a hardware/software platform limitation, not
a locked setting ([AFTVnews: These are the Fire TVs that don't support
Sideloading](https://www.aftvnews.com/these-are-the-fire-tvs-that-dont-support-sideloading-or-downloader-due-to-vega-os-replacing-fire-os/), [AFTVnews: Amazon confirms all future Fire TV Sticks will run Vega OS](https://www.aftvnews.com/amazon-confirms-all-future-fire-tv-sticks-will-run-vega-os-no-more-android-or-sideloading-on-new-models/)).

The **Fire TV Stick 4K Plus and 4K Max remain Android-based** and still
support sideloading (via the AFTVnews **Downloader** app) — these are, as of
this research, the *only* Fire TV devices that can run a sideloaded browser
like TV Bro at all. Their Silk browser is the stock browser and has the same
"not a kiosk" limitation as webOS/Tizen's stock browsers.

**Bottom line for Fire TV**: don't design around it as a primary target.
Only already-owned older Android Fire TV Sticks are viable, and new Fire TV
purchases are trending toward a platform (Vega OS) that structurally cannot
run Diorama or any sideloaded browser.

### 2.5 Apple TV

**There is no user-facing web browser on tvOS at all** — no Safari, no
alternative browser app exists in the App Store as of this research
([Macworld: How to surf the web on Apple TV](https://www.macworld.com/article/671364/how-to-surf-the-web-on-apple-tv.html)). The only way to get a web page "onto" an
Apple TV screen is **AirPlay mirroring a browser tab from a Mac, iPhone, or
iPad** — Safari on Mac AirPlays individual `<video>` elements directly, and a
full-tab/whole-screen mirror works from macOS Control Center or iOS Control
Center Screen Mirroring ([Apple Support: Use AirPlay](https://support.apple.com/en-us/102661)).

This means an Apple TV **never runs Diorama itself** — the source device
(Mac/iPhone/iPad) does all the WebGL rendering and encodes/streams the
result. Consequences: the mirrored session dies if the source device sleeps,
locks, or the mirroring is manually stopped; there's no "always-on kiosk"
concept; visual quality/latency depends on the AirPlay encode, not Diorama's
renderer. **Apple TV is not a realistic kiosk target** — it's a
"look at this for a minute" cast target, not a display device.

### 2.6 Casting a dashboard (Chromecast / Google Cast) vs. running Diorama

**Home Assistant Cast** ([cast.home-assistant.io](https://cast.home-assistant.io/), [FAQ](https://cast.home-assistant.io/faq.html)) shows a **Lovelace
view** (including custom cards) on any Chromecast, over Google Chrome or
Edge (all platforms except iOS). It explicitly:
- Requires HA be served over **HTTPS**.
- Does **not** support live video streams from the streaming integration.
- Does **not** support a single-card view with `panel: true`.
- Fundamentally renders **Lovelace only** — there is no path to cast an
  arbitrary URL, an iframe, or a `panel_custom` panel through it.

Diorama is a `panel_custom` panel or a standalone SPA (`index.html` entry),
**not** a Lovelace view/card — so **native Home Assistant Cast cannot show
Diorama** without wrapping it in something Lovelace considers a "view," which
doesn't really exist for arbitrary web content. A generic Chrome "Cast tab…"
of any URL (including Diorama's) does work, but it's a **video mirror of the
source Chrome tab** — same caveat class as AirPlay: the source device (a PC
or phone that has Diorama open in Chrome) does the actual rendering and
streams pixels, so it's not an independent, persistent kiosk display, and
adds a transcode/decode step on top of an already GPU-constrained Chromecast
receiver. The `continuously_casting_dashboards` HACS integration
([b0mbays/continuously_casting_dashboards](https://github.com/b0mbays/continuously_casting_dashboards)) automates re-casting a Lovelace
dashboard when idle Chromecasts are detected — it's built around HA Cast's
Lovelace flow and would need adaptation, not direct reuse, for a raw Diorama
URL.

**Conclusion**: casting protocols (Google Cast, AirPlay) are a poor fit for
Diorama specifically. The only two viable delivery models are (a) a real
browser running natively on/at the TV loading the Diorama URL, or (b) a
separate small computer (PC/stick/Pi/tablet) HDMI'd into the TV, running a
normal desktop-class kiosk browser and using the TV purely as a monitor.

### 2.7 D-pad / 10-foot UI facts

- **Spatial navigation is not automatic on the web** the way it is in native
  Android TV layouts. "Every TV app you build must implement a complete
  focus management system... not handled by the browser — you write it
  yourself in JavaScript" ([sofiadigital.com: Spatial Navigation for Smart TVs](https://sofiadigital.com/spatial-navigation-for-smart-tvs/)).
- The W3C/WICG **CSS Spatial Navigation** spec + reference **polyfill**
  ([github.com/WICG/spatial-navigation](https://github.com/WICG/spatial-navigation), npm `spatial-navigation-polyfill`) implements
  arrow-key directional focus movement between DOM-focusable elements. It
  migrated from WICG to the CSS WG in 2018 and, per its own docs, **"is not
  yet complete... does not yet follow \[the spec\] closely, and has several
  known issues."** It also only understands real DOM focusable elements —
  it has no concept of "things drawn inside a `<canvas>` or a WebGL scene,"
  which is most of Diorama's actual clickable surface (fixtures, lights,
  furniture rendered as canvas pixels / 3D meshes, not DOM nodes).
- Android's own TV framework auto-handles D-pad focus **between native
  layout views** ([developer.android.com/training/tv/get-started/navigation](https://developer.android.com/training/tv/get-started/navigation)) — irrelevant to a web app
  running inside a WebView/browser, which gets none of that for free.
- **10-foot UI / safe area**: the broadcast-video "title safe" convention is
  90% of frame width/height (5% margin each edge); "action safe" is 93%
  ([Safe area (television) — Wikipedia](https://en.wikipedia.org/wiki/Safe_area_(television)), SMPTE ST 2046-1). Amazon's own Fire TV design guidelines say
  the same thing for app UI: keep focused items and text within the inner
  90% ([developer.amazon.com: Fire TV Design and UX Guidelines](https://developer.amazon.com/docs/fire-tv/design-and-user-experience-guidelines.html)). In practice this matters far more for
  **older CRT-era overscan** than for modern 1080p/4K panels and HTML5 apps,
  which typically render pixel-exact full-bleed — but it's still the
  standard reason smart-TV app stores reject apps whose focusable UI touches
  the outer few percent of the frame.

## 3. Diorama design / integration

### 3.1 What already covers this (no new work needed)

- **`Planner.uiMode` + URL templates** (`?mode=kiosk|view&lock=1&view=2d|3d&
  floor=<id>&layers=<preset>&view3d=<name>&cam=x,y,z,tx,ty,tz`) are exactly
  the right foundation — a TV browser just needs to be pointed at one of
  these URLs. `kiosk` mode still allows device interaction (light/switch
  toggle, light-config); `view` mode is fully passive. **For an ambient TV
  display, `view` mode is almost certainly the correct default** — it
  sidesteps the "no pointer" problem entirely instead of needing new D-pad
  interaction machinery.
- **Camera framing**: `applyViewPreset('sims'|'iso'|...)`, `Scene3D.
  autoFollow`, and `Scene3D.cinematicOrbit` already produce exactly the
  "ambient living diorama" look a TV wants — a slow ~78 s/rev orbit or a
  cluster-framing auto-follow, no user input required. The `?cam=` template
  plus the topbar 💾 saved-view mechanism already let a user dial in a
  starting pose once from a laptop and bake it into the kiosk URL.
- **`Layers2D` presets** (`Store.layerPresets2d`, e.g. the built-in "Simple
  floorplan") are the existing lever for trimming render cost — turning off
  `weatherFx`, `labels`, `appliances` etc. via `?layers=simple` (or a new
  named preset) is a zero-code way to cut GPU load for weak TV SoCs today.
- **`view=2d`** (the 2D canvas path) is a legitimately good TV target on its
  own — it's Canvas2D, not WebGL, dramatically cheaper than the 3D path, and
  still shows live device state, avatar dots, and glow/activity — the
  "simple floorplan" preset was explicitly designed for exactly this kind of
  reduced-fidelity display.

### 3.2 What would need to be built

- **A "TV mode" URL flag** (e.g. `?tv=1`, additive to the existing template
  parser in `app._applyUrlParams`) that, beyond what `kiosk`/`view` already
  do, could: force a larger base font-scale for the weather chip / name
  labels / bubbles (today's text is sized for arm's-length viewing, not
  10 ft), and/or force `view=2d` + `layers=simple` as defaults unless
  overridden, acknowledging most TV hardware can't carry the full 3D scene.
- **A D-pad virtual-cursor / focus layer**, if any TV interaction beyond pure
  ambient display is wanted (kiosk-mode light toggling from a remote). This
  is genuinely new work, not configuration — Diorama's clickables (fixtures,
  lights, furniture) are canvas pixels (2D) or raycast-hit 3D meshes, not DOM
  nodes, so the WICG spatial-navigation polyfill (which only understands
  focusable DOM elements) does not apply directly. The buildable shape:
  maintain a list of clickable-object **screen-space centers** each frame
  (2D: existing hit-test target list; 3D: project `_lightGroup`/`_switchGroup`
  /etc. children already tracked for raycasting), let arrow keys move a
  highlighted "reticle" to the nearest neighbor in the pressed direction
  (same nearest-neighbor idea the WICG polyfill uses, just against Diorama's
  own object list instead of the DOM), and treat OK/Enter as a synthetic
  click at the reticle's position — reusing the existing `_dispatchClick`
  path already used for the touch-to-click synthesis. Scope this as a
  stretch goal, not a prerequisite — `view` mode ambient display needs none
  of it.
- **A render-quality tier for weak GPUs.** Nothing in `_mat()` / the
  humanoid rig / weather particle system currently has a "cheap mode" knob
  (fewer particles, lower-segment primitives, outline shells disabled,
  avatar count capped). Given the SoC survey in §2.3, this is worth adding
  as a first-class concept (e.g. folded into the `layers=simple` preset or a
  new `?quality=low` template param) rather than assuming every TV-class
  device can just run the existing scene at a lower frame rate. The
  **dirty-key architecture already helps**: static furniture/floor geometry
  only rebuilds on `configRev`/state changes, so on an idle ambient display
  the per-frame cost is dominated by `updateTargets` (avatar rig animation,
  which runs every frame unconditionally) — **avatar/humanoid count is the
  single biggest per-frame cost lever for TV performance**, more than scene
  complexity from furniture/fixtures. A "max concurrent avatars" cap for
  weak-hardware URLs would buy more headroom than trimming furniture detail.
- **`webostv` HA-side launch automation**: since HA's `webostv` integration
  can both power on the TV (`webostv.turn_on`, WoL/HDMI-CEC) and launch a
  specific installed app (`media_player.select_source`, or
  `webostv.command` → `com.webos.applicationManager/launch`), an HA
  automation could power on the living-room LG TV and launch the sideloaded
  Diorama kiosk wrapper app whenever the AI-avatar/occupancy system detects
  someone's home — a genuinely nice tie-in to Diorama's existing presence
  machinery, not just a static always-on display. No equivalent app-launch
  action was found for `samsungtv` — flagged as an open question in §6.
- **Media/now-playing recursion caveat**: if the TV displaying Diorama is
  *also* the room's real TV (bound as a `media_player` to a `Furniture` TV
  fixture in the same room), the on-screen avatar can appear to
  "watch_tv"/show now-playing art for the very screen it's displayed on.
  Harmless, but worth flagging in user-facing docs so it reads as an
  intentional Easter egg rather than a bug — or just tell users to bind the
  in-scene TV fixture to a *different* media player than whichever device
  renders Diorama.

## 4. Setup / integration steps

These are ordered from "works today, no new Diorama code" to "requires the
most platform fighting," so a user/dev can stop at the first tier that meets
their bar.

1. **Decide interaction model first**: ambient display (`?mode=view`) vs.
   light/switch control from the couch (`?mode=kiosk` — today still needs a
   pointer device of some kind since no D-pad layer exists yet; see §3.2).
   This single choice determines whether any TV's native remote is usable at
   all, or whether a second input device (phone/tablet/mouse) is required
   regardless of platform.
2. **Pick a delivery device tier**, in order of reliability:
   - **Tier 0 — small PC / stick PC / Raspberry Pi / spare Android tablet,
     HDMI into the TV, running a real desktop-class Chromium in
     `--kiosk https://<ha>/…` (or the tablet's own kiosk browser).** This
     sidesteps every smart-TV-OS limitation in §2 (screensaver quirks, no
     PWA, Developer Mode timers, weak embedded GPU) because the TV is just a
     monitor. Recommended default if reliability matters more than
     "it's built into the TV."
   - **Tier 1 — NVIDIA Shield TV**, sideload **TV Bro** (or Webview Kiosk)
     from the Play Store or via ADB, point it at the kiosk URL. Best 3D
     performance among "smart" streaming boxes per §2.3's GPU comparison.
   - **Tier 2 — Amlogic-based Android TV / Google TV box** (Chromecast with
     Google TV, onn. 4K Plus/Pro, most embedded Google TV smart TVs): same
     TV Bro sideload, but **default to `view=2d`** — the Mali-G31/G52-class
     GPUs in these boxes are not confirmed capable of the full 3D scene at
     acceptable frame rates; verify on-device before trusting 3D here.
   - **Tier 3 — LG webOS TV native**: enable Developer Mode app → build a
     one-page IPK shell that loads the kiosk URL → `ares-install` it →
     configure screensaver Type 2/3 if the panel is OLED + webOS 5.0+ (LCD
     panels have no equivalent escape hatch — plan for periodic
     screensaver/blank-out) → re-arm Developer Mode before the 1000-hour
     timer lapses, or move to a commercial signageOS/Wallboard deployment
     for a maintenance-free permanent install.
   - **Tier 4 — Samsung Tizen TV native**: enable Developer Mode (Apps →
     `1-2-3-4-5`) → install Tizen Studio + TV Extension + Samsung
     Certificate Extension → build/deploy a Tizen Web Application shell
     pointing at the kiosk URL via Device Manager → same idle/screensaver
     caveats to verify on-device; commercial route = Business TV / MagicInfo
     / Tizen Enterprise Portal, or a signageOS/Wallboard deployment.
   - **Skip Apple TV** as a kiosk target (no browser exists; only AirPlay
     mirroring, which is not a persistent display — see §2.5).
   - **Fire TV**: only viable on an already-owned Android-based Fire TV
     Stick 4K Plus/Max (sideload TV Bro via the Downloader app); do not plan
     around a newly purchased Fire TV Stick, since current/new models run
     Vega OS and cannot sideload anything.
3. **Build the kiosk URL** using Diorama's existing "Kiosk link" topbar
   button (mints `?mode&lock&view&floor&layers&view3d&cam` from the current
   camera pose), or hand-compose it: pick `mode=view` or `kiosk`,
   `lock=1`, a `floor=`, a `layers=` preset (start with `simple` on any
   Tier 2+ hardware), and either `view=2d` (safe default on weak GPUs) or
   `view=3d&view3d=<saved-view>` once 3D is confirmed to run acceptably.
4. **Sanity-check frame rate on the actual device** before committing to 3D
   — there's no `chrome://gpu`-equivalent on TV OSes, so in practice this
   means loading the 3D kiosk URL and watching for stutter with a handful of
   avatars active, then falling back to `view=2d` or a lighter `layers=`
   preset if it's rough.
5. **Disable the TV's own screensaver/auto-sleep** at the OS level — this is
   a distinct, standard smart-TV setting from the in-browser screensaver
   quirks documented in §2.1/§2.2 (LG: General → Screen Saver / disable
   auto power-off; Samsung: disable Auto Protection Time / ambient motion
   lighting; Android TV boxes: Settings → Device Preferences → Sleep →
   Never, and turn off Daydream).
6. **Optional — wire HA automation for power/launch**: for LG, use
   `webostv.turn_on` (WoL/HDMI-CEC) plus `media_player.select_source` or
   `webostv.command` (`com.webos.applicationManager/launch`) to power on the
   TV and launch the sideloaded kiosk app together, e.g. gated on presence /
   an AI-avatar occupancy signal. For Samsung, `samsungtv`'s turn-on is
   available; no confirmed app-launch action exists (verify before relying
   on it).

## 5. Potential additional features

- **Ambient / screensaver mode**: a dedicated "no one's actively watching"
  camera behavior — slow cinematic orbit (already shipped) plus dimmed
  lighting preset and reduced avatar count, engaged automatically after N
  minutes of no HA state changes, distinct from and cooperating with (not
  fighting) the TV's own screensaver.
- **Remote-control mapping beyond D-pad focus**: map a handful of remote
  buttons (color keys / numeric keys, which most TV remotes still have) to
  fixed camera-view presets (`iso`/`top`/`sims`) or floor switches, without
  needing a full spatial-navigation reticle system — cheaper than the
  general D-pad cursor in §3.2 and covers the most common "flip between a
  couple of saved views" want.
- **Presence-gated auto power-on**: tie the `webostv`/`samsungtv` turn-on
  actions (or a smart plug) to the same occupancy/BLE-person signals
  Diorama already computes, so the TV wakes to the kiosk view specifically
  when someone's actually home to see it, rather than running 24/7.
  - **Multi-TV / multi-room sync**: if several rooms each kiosk a
  different `floor=`/`cam=` URL, an HA automation could rotate all of them
  together, or key each TV's URL off which room's occupancy sensor is
  currently active.
- **A "TV preview" mode in the sidebar** (edit-mode only): render the
  current camera/layers config at a simulated TV-safe-area overlay (the 90%/
  93% guides from §2.7) so the person configuring the kiosk URL from a
  laptop can see whether important UI (weather chip, name labels) would sit
  too close to the edge before ever touching the actual TV.
- **Low-power "digital picture frame" still-image fallback**: for genuinely
  incapable hardware (very old webOS/Tizen sets, or WebGL context failures),
  a server-side/cron-rendered static PNG of the floor plan refreshed every
  few minutes, shown via the TV's native photo-frame/ambient mode instead of
  a live browser session at all.

## 6. Open questions & risks

- **No device testing was performed for this doc.** Every Chromium-version
  and GPU-model fact above is sourced from vendor docs or hardware reviews,
  not from loading Diorama on a physical TV. Actual three.js frame rate on
  any specific Mali-G31/G52 box, any specific webOS/Tizen model year, or any
  Shield TV revision is unverified and should be the first thing tested
  before committing engineering time to TV-specific features.
- **WebGL2 feature-completeness on embedded Mali GPUs** (shadow maps aren't
  used by Diorama's Sims-toon renderer, but MRT/multiple texture units,
  `MeshToonMaterial`'s gradient-map sampling, and the `DataTexture`/
  `CanvasTexture` usage throughout) is assumed to work since OpenGL ES 3.2
  is advertised, but embedded GPU driver quality on cheap Android TV boxes
  and smart TVs is historically inconsistent — budget for driver-specific
  bugs, not just raw performance shortfalls.
- **`samsungtv` HA integration app-launch gap**: no confirmed
  service/action to launch a specific installed Tizen app was found (unlike
  `webostv`'s `select_source`/`command`). If auto-launching the sideloaded
  kiosk shell from HA matters for Samsung, this needs direct verification
  against the current `samsungtv` integration docs/source, not just this
  search pass.
- **LG LCD-panel screensaver has no confirmed workaround** — the Type 2/3
  screensaver escape hatch is explicitly OLED-only in LG's own docs; an LCD
  webOS kiosk may just periodically blank regardless of packaging effort.
  The undocumented Luna Service wake-lock trick some forum posts describe is
  unofficial and could break on any webOS update.
- **Developer Mode's 1000-hour timer** (LG) is a real maintenance burden for
  a "install once and forget" kiosk unless the commercial signageOS/
  Wallboard/Signage-Platform route is used instead — worth deciding upfront
  whether a recurring ~monthly touch-up is acceptable before choosing the
  cheap Developer Mode path over the paid/commercial provisioning path.
- **Fire TV's Android lineage is actively shrinking.** Amazon has stated
  intent for *all future* Fire TV Sticks to ship on Vega OS; today's
  Android-based 4K Plus/Max models are a shrinking window (Amazon states
  continued support into 2030 per secondary sources, not independently
  verified here against a primary Amazon statement) — don't design a
  long-term product story around sideloading Fire TV.
  - **D-pad focus-navigation is real, unsolved product work**, not a
  library drop-in: the WICG polyfill only understands DOM-focusable
  elements and is self-described as incomplete/imperfect even for that case;
  Diorama's actual clickable surface is canvas pixels and 3D raycast
  targets, so a genuinely usable "control Diorama from a couch remote"
  experience would be new, Diorama-specific UI work, not a spec/polyfill
  Diorama can just adopt.
- **Casting is a dead end for Diorama specifically** (see §2.6) — don't
  invest in Chromecast/AirPlay support expecting it to deliver a persistent
  kiosk; at best it's an occasional "look at this for a second" cast of a
  mirrored tab from another device, with that device's GPU doing the real
  rendering work.

## 7. Sources

- LG webOS: [Web API and Web Engine](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine) · [App Testing with Developer Mode App](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app) · [CLI Developer Guide](https://webostv.developer.lge.com/develop/tools/webos-tv-cli-dev-guide) · [Screensaver guide](https://webostv.developer.lge.com/develop/guides/screensaver) · [LG TV – How to Use the Web Browser](https://www.lg.com/us/support/help-library/lg-tv-how-to-use-the-web-browser--20153257222107) · [webOS TV Community: prevent screensaver/blackout](https://forum.webostv.developer.lge.com/t/keep-screen-on-prevent-screensaver-blackout/740) · [webOS homebrew Dev Mode](https://www.webosbrew.org/devmode/)
- Samsung Tizen: [Web Engine Specifications](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html) · [Tizen Studio](https://developer.samsung.com/smarttv/develop/tools/tizen-studio.html) · [TechJunctions: Samsung TV Developer Mode](https://techjunctions.com/samsung-tv-developer-mode/) · [Norigin Media: Ultimate Guide to Samsung Tizen TV Web Development](https://medium.com/norigintech/the-ultimate-guide-to-samsung-tizen-tv-web-development-f4613f672368) · [Progressier: PWA on Tizen OS](https://intercom.help/progressier/en/articles/6750662-can-a-pwa-be-installed-on-tizen-os) · [firt.dev PWA compatibility](https://firt.dev/notes/pwa/)
- Digital signage / provisioning: [signageOS Samsung Tizen Kiosk Provisioning](https://docs.signageos.io/hc/en-us/articles/4405549783058-Samsung-Tizen-Kiosk-Provisioning) · [signageOS webOS](https://docs.signageos.io/hc/en-us/articles/4409188234130-webOS) · [signageOS LG webOS supported devices](https://www.signageos.io/supported-devices/lg-webos) · [Wallboard](https://www.wallboard.us/)
- Android TV / Google TV / Fire TV: [TV Bro (GitHub)](https://github.com/truefedex/tv-bro) · [Webview Kiosk (GitHub)](https://github.com/nktnet1/webview-kiosk) · [Fully Kiosk Browser](https://www.fully-kiosk.com/en/) · [AFTVnews: Fire TVs that don't support sideloading](https://www.aftvnews.com/these-are-the-fire-tvs-that-dont-support-sideloading-or-downloader-due-to-vega-os-replacing-fire-os/) · [AFTVnews: all future Fire TV Sticks run Vega OS](https://www.aftvnews.com/amazon-confirms-all-future-fire-tv-sticks-will-run-vega-os-no-more-android-or-sideloading-on-new-models/) · [androidpctv.com: Amlogic S905X4 comparative](https://androidpctv.com/comparative-amlogic-s905x4/) · [gadgetversus.com: Amlogic S905X4 vs Tegra X1](https://gadgetversus.com/processor/amlogic-s905x4-vs-nvidia-tegra-x1-t210/)
- Apple TV: [Macworld: How to surf the web on Apple TV](https://www.macworld.com/article/671364/how-to-surf-the-web-on-apple-tv.html) · [Apple Support: Use AirPlay](https://support.apple.com/en-us/102661)
- Home Assistant integrations & casting: [webostv integration](https://www.home-assistant.io/integrations/webostv/) · [samsungtv integration](https://www.home-assistant.io/integrations/samsungtv/) · [fully_kiosk integration](https://www.home-assistant.io/integrations/fully_kiosk/) · [Home Assistant Cast](https://cast.home-assistant.io/) · [Home Assistant Cast FAQ](https://cast.home-assistant.io/faq.html) · [Google Cast integration](https://www.home-assistant.io/integrations/cast/) · [continuously_casting_dashboards (GitHub)](https://github.com/b0mbays/continuously_casting_dashboards)
- D-pad / 10-foot UI: [WICG/spatial-navigation (GitHub)](https://github.com/WICG/spatial-navigation) · [Spatial Navigation polyfill docs](https://wicg.github.io/spatial-navigation/polyfill/) · [Sofia Digital: Spatial Navigation for Smart TVs](https://sofiadigital.com/spatial-navigation-for-smart-tvs/) · [Android Developers: TV navigation](https://developer.android.com/training/tv/get-started/navigation) · [Safe area (television) — Wikipedia](https://en.wikipedia.org/wiki/Safe_area_(television)) · [Amazon Fire TV Design and UX Guidelines](https://developer.amazon.com/docs/fire-tv/design-and-user-experience-guidelines.html)
