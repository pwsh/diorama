# Kiosk on Android Tablets — Build-Ready Research

Status: research complete, not yet implemented as any code change. This is a
**deployment/ops** research doc, not a new HA-entity feature — it covers how to
run Diorama itself, unmodified, as a locked-down wall display on Android
tablets, plus a short list of small Diorama-side hooks that would make that
deployment noticeably better.

## 1. Summary

Diorama already ships everything a browser-based kiosk needs on the *app*
side: `Planner.uiMode` (`edit`/`kiosk`/`view`) with URL templating
(`?mode=kiosk&lock=1&view=3d&floor=…&layers=…&view3d=…&cam=…`), a topbar
"🔗 Kiosk link" button that mints that URL from the current camera/floor, a
`?debug3d=1` on-screen error console for devices with no devtools, per-device
view persistence, touch-vs-swipe guards tuned for the HA mobile app's edge
drawer, and a Sims-toon 3D renderer that was already built cheap (no shadow
maps, no PBR/PMREM, DPR capped at 2, `webglcontextlost` recovery) — i.e. the
rendering choices this research would otherwise recommend for a cheap tablet
are already the codebase's *only* rendering path (see CLAUDE.md "Sims-style
rendering"). What's missing is entirely on the **device/OS/browser side**:
which app hosts the browser tab, how the screen is kept on and the nav/status
bars hidden, how the device survives a power cycle and comes back showing
Diorama, and how a fleet of such tablets gets provisioned/updated.

That's what this doc covers. The practical answer for "which fits a Diorama
kiosk best" is: **Fully Kiosk Browser (Plus license) pointed at the panel's
own URL, running on a real tablet (not a locked-down $30 no-name unit)**,
optionally with Home Assistant's `trusted_networks` auth provider for
password-free auto-login and the `kiosk-mode` HACS frontend module to hide
HA's own sidebar chrome around the panel. The HA Companion App's launcher/
kiosk mode is the free, lower-effort alternative and is genuinely good enough
for many installs, but it currently trails Fully Kiosk on exactly the things a
wall panel needs (configurable screensaver timeout, motion-wake, remote
admin/health telemetry). MDM tools (Scalefusion/AirDroid/emteria) matter only
past ~3–5 tablets or when non-technical people need to self-service reboots;
below that, Fully Kiosk's own remote-admin web UI (`http://<tablet-ip>:2323`)
already covers single-installer needs.

## 2. Platform / data model / real-world facts

### 2.1 Fully Kiosk Browser — the leading HA-tablet kiosk app

Fully Kiosk Browser & App Lockdown ([fully-kiosk.com](https://www.fully-kiosk.com/en/))
is a dedicated Android kiosk browser built specifically for digital signage /
unattended panels, and is the de-facto standard in the Home Assistant
community for wall tablets.

- **Engine**: it renders through the **Android System WebView**, which is
  itself Chromium-based — *not* a bundled/independent browser engine. The
  admin settings (Settings → Admin → **WebView Implementation**) let you pick
  which installed WebView/Chrome channel (Stable/Beta/Dev, or the standalone
  WebView APK) backs the rendering, so an old device stuck on an outdated
  system WebView can be pointed at a newer Chrome-Beta APK to fix WebGL/CSS
  bugs without an OS update. Practical implication for Diorama: **WebGL2
  support tracks the WebView's Chromium version, not Fully Kiosk's own version
  number** — WebGL 1.0 landed in Chrome 25, WebGL 2.0 (which three.js r16x
  prefers/needs for some features) only in Chrome 114+. A device frozen on
  Android 7–9 with an old Chrome-51-era WebView may only get WebGL1. [Android WebView engine — Fully Kiosk help](https://help.android-kiosk.com/en/article/what-browser-engine-does-kiosk-browserlauncher-built-in-browser-use-1rhzkn9/)
- **OS support**: officially "Android OS ver. 6 to 16"; v1.50+ requires
  Android 7+. Fire OS / Chrome OS are explicitly called out as having a
  "restricted feature set or serious issues" — treat Fire tablets as a
  second-class target.
- **Licensing**: **free to try** (adds a watermark / feature caps), **Fully
  Plus is a one-time (perpetual) license**, reported at **€7.90 per device**
  (Capterra, Oct 2025 pricing snapshot) with volume discounts (down to
  ~€1.18/mo-equivalent/device on large annual-volume deals) — **not a
  subscription**. [Fully pricing — Capterra](https://www.capterra.com/p/156468/Fully/) · [Fully PLUS licenses](https://license.fully-kiosk.com/license/single)
- **Remote Admin**: a built-in web server at `http://<device-ip>:2323`
  reachable from any browser on the LAN (or over VPN), password-protected,
  exposing device info, screenshot, and settings — this is what a solo
  installer uses instead of an MDM for a handful of tablets. HTTPS needs a
  manually installed cert.
- **REST API**: ~70 documented commands for automation, e.g. `screenOn`,
  `screenOff`, `loadUrl`, `loadStartUrl`, `screensaver` (start/stop), plus
  generic `setStringSetting`/`listSettings`. This is the mechanism HA
  automations use to push a tablet back to the Diorama URL, wake it, dim it,
  etc.
- **MQTT (Plus, v1.34+)**: publishes device telemetry (battery, screen state,
  foreground app, storage, RAM…) to a broker and subscribes to command topics.
  Real topic shape from a worked example: `fully/<device-name>/status/<feature>`
  (state) and `fully/<device-name>/command/<feature>` (command), e.g.
  `fully/mytablet/command/screenOn` with payload `TRUE`/`FALSE`. [Fully Kiosk + MQTT walkthrough](https://newerest.space/home-assistant-fully-kiosk-mqtt/)
- **Native HA integration — `fully_kiosk` (HA core, config-flow based)**:
  [home-assistant.io/integrations/fully_kiosk](https://www.home-assistant.io/integrations/fully_kiosk/).
  Setup needs Fully's **Remote Admin** enabled + its password, plus the
  **Plus license** (the integration itself is free/core, but most of what it
  controls is a Plus-gated Fully feature). It exposes:
  - **Sensors**: battery level, free storage, free RAM, current page URL,
    foreground app.
  - **Binary sensor / switch-like controls**: kiosk-mode lock state, plugged-
    in state, motion detection on/off, screensaver on/off (+ timer +
    brightness), screen on/off (+ timer + brightness), app foreground/
    background, cache clear, maintenance mode, reboot (needs root).
  - **Camera entity** — "only works if Motion detection is set to On" in
    Fully.
  - **Actions/services**: `fully_kiosk.load_url`, `fully_kiosk.set_config`,
    `fully_kiosk.start_application`.
  - **Notify**: TTS and on-screen overlay message push to the tablet.
  - A community MQTT+REST blueprint exists for ambient-light-based brightness
    stepping and motion→screensaver timeout automation (import URL:
    `https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=...`),
    though several 2025 forum reports flag YAML-indentation breakage in it —
    treat as a starting point, not drop-in. [Fully MQTT sensor automation blueprint](https://community.home-assistant.io/t/fully-kiosk-mqtt-sensor-automation/849229)
  - The now-archived `lovelace-fullykiosk` custom Lovelace card (2019,
    superseded by the core integration + `browser_mod`) is dead; don't build
    on it. [thomasloven/lovelace-fullykiosk](https://github.com/thomasloven/lovelace-fullykiosk)
- **Motion detection** (Plus): visual (front camera) and acoustic
  (microphone), sensitivity 90–95 recommended in normal room lighting; some
  devices' cameras "don't start or stop" reliably or overheat with continuous
  use — a real, hardware-dependent flake, not a Fully bug per se.
  **Android 14 tightened this further at the OS level** (see §2.4) —
  independent of Fully, camera/mic **foreground-service** access from a
  backgrounded/screen-off app throws `SecurityException` on API 34+ targets
  unless the app already holds the runtime permission while foregrounded;
  community reports specifically say **newer Android-14+ tablets refuse
  camera-based motion detection once Fully is backgrounded or the screen is
  off** — a deliberate Google privacy hardening, not a regression to chase.
  [Foreground service type restrictions — Android Developers](https://developer.android.com/about/versions/14/changes/fgs-types-required) · [HA community: Fully Kiosk browser or app](https://community.home-assistant.io/t/home-assistant-on-a-tablet-fully-kiosk-browser-or-app/265283)
- **Kiosk lockdown**: exit-gesture disabling, PIN-gated settings, app allow/
  block lists, single-app mode, hardware-button disabling, launch-on-boot,
  "keep screen on."

### 2.2 Home Assistant Companion App (Android) — the free, native alternative

- **Launcher/kiosk mode**: Settings → Companion app → **Device home screen**
  → "Use as Home app (launcher)" → confirm via the system's "change default
  home app" picker. Once set: no app-drawer access, Home button
  returns-to/refreshes HA, device boots straight into the app. [Android Home App (launcher) — Companion docs](https://companion.home-assistant.io/docs/integrations/android-home-app-launcher/)
- **Keep screen on**: Settings → Companion app → Other settings → "Keep
  screen on."
- **Full-screen mode**: hides the status bar/nav buttons, but **is reported
  device-inconsistent** — a still-open upstream issue shows the status bar
  staying visible on some Lenovo tablets even with full screen enabled.
  [Status Bar Still Visible in Fullscreen Mode — home-assistant/android#5539](https://github.com/home-assistant/android/issues/5539)
- **Default dashboard**: Settings → Dashboards → pick a dashboard → "Set as
  default on this device" — lets a kiosk device open straight to a
  purpose-built view (this is exactly the device-local role Diorama's own
  `?floor=`/`?layers=`/`?view3d=` URL template plays if Diorama is the target
  instead of a Lovelace dashboard).
- **What it lacks vs. Fully (as of this research)**: no configurable
  screensaver timeout (unlike Fully's simple "screensaver after N seconds"),
  no motion-wake, no remote-admin/telemetry surface, no REST/MQTT control
  plane. Community sentiment (2025 "Month of WTH" thread) is that Android
  kiosk parity with the iOS Companion app's built-in kiosk+screensaver mode is
  still catching up. [WTH doesn't the companion app have kiosk-mode functionality? — HA community](https://community.home-assistant.io/t/wth-doesnt-the-companion-app-have-kiosk-mode-functionality/804699) · [iOS Kiosk mode — Companion docs](https://companion.home-assistant.io/docs/integrations/ios-kiosk-mode/)
- **What it has that Fully doesn't, for free**: native device sensors
  (battery %, charging state, GPS/location, connectivity) pushed as real HA
  entities with **zero extra config** — useful background context, though
  irrelevant to a wall-mounted (non-mobile) kiosk tablet specifically.
- **Trade-off widely reported in practice**: users running the Companion App
  report *better* video-stream (camera feed) stability than Fully, but must
  reach for `browser_mod` for popups/media-player-style control of the
  device, which several 2025 threads call fiddly (device-registry IDs churn
  across app updates; `browser_mod` 2.0 popup + media_player behavior called
  unreliable by at least one reporter). Fully gets you a `media_player` entity
  "for free." One 2025 report: paying Fully's ~€7.90 "Single App Kiosk" mode
  to run the **HA Companion App inside Fully's frame** (auto-unlock +
  reliability) as a hybrid. [HA on a tablet: Fully Kiosk Browser or App? — HA community](https://community.home-assistant.io/t/home-assistant-on-a-tablet-fully-kiosk-browser-or-app/265283)

### 2.3 WallPanel — dead as of May 2025

`TheTimeWalker/wallpanel-android` (the actively-forked successor to the
original `thanksmister`/`WallPanel-Project` lineage) was **archived by its
owner on 2025-05-05**, citing burnout ("archive this repository instead of
disappointing additional people"), with an open offer to hand off the Play
Store listing/signing keys/domain to a new maintainer — no confirmed
successor as of this research pass. It's also no longer in the Play Store;
only sideloaded APKs remain available. **Do not recommend WallPanel for new
installs**; note it only as a still-installed legacy option some existing
users report as "more responsive" than Fully on their specific hardware.
[WallPanel-Project (deprecated) → active-fork pointer](https://github.com/WallPanel-Project/wallpanel-android) · [TheTimeWalker/wallpanel-android](https://github.com/TheTimeWalker/wallpanel-android)

### 2.4 Android OS mechanisms relevant to any kiosk build

- **Screen pinning** (user-facing, Settings → Security → "Screen pinning," no
  special provisioning): lets a *user* pin the foreground app so Home/Recents
  are blocked, but the **user can still unpin at any time** (a long-press
  Back+Overview gesture, PIN-gated if screen-lock is set). Fine for a
  single trusted household but not tamper-proof.
- **Lock task mode** (the enterprise/DPC-driven superset, `DevicePolicyManager`):
  requires the launching app to be **Device Owner or Profile Owner** (a DPC)
  or explicitly allow-listed via `dpm.setLockTaskPackages(admin, […])`; once
  entered, **only the DPC can release it** (no user escape hatch) — this is
  what Fully Kiosk's Device Owner mode and MDM "dedicated device" kiosk modes
  use under the hood. Android 9+ (`ActivityOptions.setLockTaskEnabled(true)`)
  lets a DPC start *any* allow-listed app's activity directly into lock task,
  vs. the older 5.0–8.1 path (`activity.startLockTask()` from within the
  app's own `onResume()`). `dpm.setLockTaskFeatures()` grants back selective
  UI (Home button, Overview, notifications, keyguard, global-actions power
  menu) rather than an all-or-nothing lockdown. [Lock task mode — Android Enterprise developer docs](https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode)
- **Immersive mode** (hide status + nav bars): `SYSTEM_UI_FLAG_HIDE_NAVIGATION`
  + `SYSTEM_UI_FLAG_FULLSCREEN` + `SYSTEM_UI_FLAG_IMMERSIVE_STICKY` (pre-
  `WindowInsetsController`, still the conceptual model on newer APIs via
  `WindowInsetsController.hide()`/`BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`).
  **Not tamper-proof alone** — a user can still swipe from a screen edge to
  temporarily reveal the bars; combining immersive mode with lock task mode
  (or Device Owner status) is what actually prevents that swipe-reveal from
  escaping the app. This is Fully Kiosk / MDM kiosk apps' actual mechanism,
  not a Diorama-reachable web API — a plain browser tab (Chrome, or a PWA)
  cannot suppress the Android chrome this way; only a native app hosting a
  WebView can.
- **PWA "Add to Home Screen" (Chrome/Android)**: the manifest's `display`
  field controls chrome — `standalone` drops the browser's own URL bar/tab
  strip but Android **still shows the OS status bar**; `fullscreen` requests
  no browser UI *and* hides the status bar, but this is a **request**, not a
  guarantee, and neither mode gets you the nav-bar/lock-task guarantees above
  — a PWA is a good zero-install path for "looks clean" but not a true kiosk
  lockdown by itself. `window.matchMedia('(display-mode: standalone)').matches`
  is how a page can detect it's running installed. [Optimizing PWAs for display modes — Smashing Magazine](https://www.smashingmagazine.com/2025/08/optimizing-pwas-different-display-modes/) · [PWA "Add to Home Screen" guide](https://www.gomage.com/blog/pwa-add-to-home-screen/)
- **Android 14 (API 34) foreground-service hardening**: apps targeting API 34+
  cannot start a `camera`/`microphone`/`location` **foreground service** while
  backgrounded (throws `SecurityException`), and cannot do so from a
  `BOOT_COMPLETED` receiver either. This is why motion-detection-on-wake apps
  (Fully included) increasingly can't pre-arm a camera watch before the user
  physically approaches/unlocks — plan kiosk motion-wake around a **physical
  PIR sensor bound into HA** (which Diorama already renders as a `MotionSensor`
  fixture) firing the `fully_kiosk.load_url`/`screenOn` service, rather than
  relying on the tablet's own camera. [Foreground service types are required — Android 14 changes](https://developer.android.com/about/versions/14/changes/fgs-types-required)

### 2.5 MDM / fleet provisioning (only matters past a handful of devices)

| Tool | Model | Price (per device) | Notes |
|---|---|---|---|
| Fully Kiosk **Remote Admin** (built-in) | LAN web UI, no cloud | included in Plus | Fine solo/small-install management; no bulk enrollment/zero-touch. |
| Fully **Cloud** | Fully's own hosted fleet manager | add-on to Plus | Centralized config templates, fleet-wide push, still Fully-specific. |
| **Scalefusion** | Full Android EMM (kiosk + MDM + app/content mgmt) | from **$24/device/yr** | Zero-touch, IMEI/serial/QR/EMM-token bulk enrollment; heavier than most home installs need. |
| **AirDroid Business** | MDM + kiosk + remote access | from **$12/device/yr** | Cheaper entry tier, still full MDM (geofencing, remote view/control). |
| **emteria.OS** | A **modified Android OS image** (for Raspberry Pi / Rock Pi / x86 boards) bundling kiosk + MDM | OS-license-based | Only relevant if building a *custom* single-board kiosk device rather than buying a consumer tablet. |

Bulk enrollment mechanisms these tools share: **Android Zero-touch
enrollment**, IMEI-based, serial-number-based, QR-code/URL, and EMM-token
enrollment. [Top Android MDM solutions 2026 — Scalefusion blog](https://blog.scalefusion.com/top-android-mdm-solutions/) · [MDM providers comparison — AirDroid](https://www.airdroid.com/mdm/mdm-providers/) · [emteria kiosk software guide](https://emteria.com/blog/android-kiosk-software)

**Verdict**: none of the MDM tools above are HA/Diorama-specific — they're
generic Android fleet managers. They only earn their cost once a household or
business is managing **enough** tablets (roughly 3–5+) that per-device manual
Fully Kiosk setup + Remote Admin isn't practical, or non-technical staff need
self-service reboot/reset without touching the tablet.

### 2.6 Real device sizes (concrete reference, mm)

Common budget-to-midrange Android tablets used for HA/Diorama wall panels
(useful if Diorama ever wants a "typical kiosk bezel" reference for mockups):

| Device | Dimensions (mm) | Notes |
|---|---|---|
| Lenovo Tab M8 (3rd Gen) | 199.1 × 121.8 × 8.15 | Budget 8″ panel size. |
| Lenovo Tab M8 (4th Gen) | 197.97 × 119.82 × 8.95 | |
| Lenovo Tab M10 (FHD) | 242 × 168 × 8.1 | Common 10″ wall-mount pick. |
| Lenovo Tab M10 5G | 252.74 × 160.34 × 8.3 | |
| Samsung Galaxy Tab A8 | ~$180–230 street price | Cited as "best Android value" with 3rd-party wall-mount ecosystem compatibility (ActionTiles-style mounts). |
| Amazon Fire HD 8 / 10 (refurb) | ~$20–60 used | Cheapest entry point; Fire OS explicitly flagged by Fully as reduced-feature-set — expect friction. |

[Lenovo Tab M10 specs — GSMArena](https://www.gsmarena.com/lenovo_tab_m10-12425.php) · [Lenovo Tab M8 specs — GSMArena](https://www.gsmarena.com/lenovo_tab_m8_%284th_gen%29-12521.php) · [Best tablets for HA wall dashboard 2026 — SmartHomeExplorer](https://www.smarthomeexplorer.com/guides/home-assistant-dashboard-setup-2026)

### 2.7 Home Assistant auth + chrome-hiding pieces that complete the picture

- **`trusted_networks` auth provider** (HA core, `configuration.yaml`):
  password-free login for devices on an allow-listed IP/subnet.
  ```yaml
  homeassistant:
    auth_providers:
      - type: trusted_networks
        trusted_networks:
          - 192.168.1.0/24       # a /24 network, not a single host — a bare
                                  # host IP is rejected in practice per a 2025
                                  # community report
        trusted_users:
          192.168.1.0/24: SOME_USER_ID   # optional: restrict which user(s)
                                          # are offered from that network
        allow_bypass_login: true         # skip the "pick a user" screen
                                          # entirely IF only one user qualifies
      - type: homeassistant            # MUST also be listed — omitting it
                                        # disables username/password login
                                        # everywhere, a lockout risk
  ```
  **Ordering matters**: `trusted_networks` must be listed **before**
  `homeassistant` in the `auth_providers` list, or the password prompt renders
  first and the bypass never triggers. `allow_bypass_login` skips the login
  page only when exactly one non-system user is selectable for that network;
  it does **not** persist across page loads via a cookie — every fresh page
  load re-runs the (invisible, instant) auth handshake. MFA is disabled for
  trusted-network logins. [Authentication providers — Home Assistant docs](https://www.home-assistant.io/docs/authentication/providers/) · [Fully Kiosk auto-login — HA community](https://community.home-assistant.io/t/fully-kiosk-auto-login/697057)
- **`panel_custom` chrome**: Diorama's native-panel mode
  (`embed_iframe: false`, per CLAUDE.md) still loads *inside* HA's own
  frontend shell — the collapsible left sidebar and (depending on HA version/
  theme) a top app bar are still present around the panel unless separately
  hidden. The community-standard tool for suppressing that remaining HA
  chrome is the **`kiosk-mode` HACS frontend module**
  ([maykar/kiosk-mode](https://github.com/maykar/kiosk-mode)): hides header
  and/or sidebar, selectively (icons, whole header, whole sidebar, per-user,
  per-viewport-width via a default 812 px mobile breakpoint), with a
  `?disable_km` URL escape hatch for debugging. This is an orthogonal, HA-side
  install — it doesn't touch Diorama's code — but is worth documenting as
  a companion step since a kiosk tablet with Diorama's own full-bleed
  canvas *plus* HA's own sidebar peeking in from the left looks broken.
  [Kiosk Mode — GitHub](https://github.com/maykar/kiosk-mode) · [Custom panel — Home Assistant docs](https://www.home-assistant.io/integrations/panel_custom/)

### 2.8 WebGL / three.js on cheap Android hardware

- **Draw calls, not triangles, are the mobile bottleneck.** General guidance:
  keep per-frame draw calls under ~50 (vs. desktop's ~100+ tolerance); total
  scene triangle budget under ~500k for broad compatibility; merge geometry /
  use instancing over many discrete meshes (a naive "5,000 trees = 5,000 draw
  calls" scenario collapses to 1 draw call via `InstancedMesh`).
- **Thermal throttling is real and fast**: a scene that hits 60 fps on first
  load can fall to ~20 fps after ~30 s of sustained load on passively-cooled
  budget tablets — a kiosk display that never sleeps is exactly the sustained-
  load case this warns about.
- **Standard mobile mitigations**: cap `devicePixelRatio` (commonly capped at
  2, sometimes forced to 1 on the very cheapest hardware), disable shadow
  maps, halve texture resolutions, prefer KTX2/Basis-compressed textures,
  `powerPreference: 'high-performance'` in the WebGL context-creation options
  to nudge the OS toward the discrete/faster GPU tier where one exists.
  [100 Three.js performance tips (2026) — Utsubo](https://www.utsubo.com/blog/threejs-best-practices-100-tips) · [Draw calls: the silent killer — Three.js Roadmap](https://threejsroadmap.com/blog/draw-calls-the-silent-killer)
- **WebGL2 availability gate**: as noted in §2.1, this is really a WebView-
  Chromium-version question on Android, not a three.js question — Chrome 114+
  for WebGL2. A kiosk fleet with old, unmanaged system WebViews is the
  concrete failure mode worth testing for (three.js can be told to prefer
  WebGL1 as a fallback, but that's a separate decision outside this doc's
  scope).

## 3. Diorama design / integration

Diorama's existing machinery already covers almost everything a kiosk needs;
this section maps the research above onto specific files/behaviors so a
deploy doesn't require new code, plus flags the handful of places a small
addition would help.

### 3.1 Already-shipped hooks that ARE the kiosk story

- **`Planner.uiMode` + URL template** (`src/ui/app.ts` `_applyUrlParams`,
  ~L43–126): `?mode=kiosk&lock=1&view=3d&floor=<name|id>&layers=<preset|simple|full>&view3d=<name|id>&cam=x,y,z,tx,ty,tz`
  is precisely the "point Fully Kiosk's Start URL here" contract. `lock=1`
  sets `p.uiModeLocked = true`, which (per CLAUDE.md) hides the mode switcher
  and the whole sidebar/floor-editor UI — this is Diorama's own kiosk lockdown,
  independent of anything Android-side. `layers=simple` is a canned "just show
  avatars + activity glow, hide the editing-heavy layers" preset — a good
  default kiosk starting point (`src/ui/app.ts` L103–106 shows the exact
  layer set it applies).
- **Topbar "🔗 Kiosk link" button** (`src/ui/topbar.ts` `_copyKioskLink`,
  L27–45; only rendered in edit mode, L96–99): builds exactly that URL from
  the CURRENT camera pose (`p.lastCam3d`, refreshed every 3D tick per
  CLAUDE.md), floor, and view, and copies it to the clipboard (falls back to
  a `prompt()` if `navigator.clipboard` is unavailable — relevant since some
  kiosk WebViews restrict clipboard APIs). **This is the intended workflow**:
  frame the shot you want on a desktop browser, click the button, paste the
  URL into Fully Kiosk's "Web content address" field. Don't hand-write kiosk
  URLs when this button exists.
- **`?debug3d=1`** (`src/ui/app.ts` L54–67): an on-screen error/rejection
  console, explicitly built "for environments with no devtools (the HA
  companion app)" — the same rationale applies to any embedded WebView kiosk
  (Fully Kiosk's own WebView, a PWA). Worth documenting in the setup checklist
  as the first troubleshooting step for a blank/frozen kiosk screen, since
  there's no way to open Chrome DevTools on most of these devices without USB
  debugging.
- **Device-local view persistence** (`Planner.view` reads/writes
  `localStorage['diorama:view']`, CLAUDE.md "Device-local view + touch
  guards"): a tablet that gets power-cycled reopens in its last 2D/3D view —
  exactly the behavior a kiosk needs after a nightly reboot, with the `?view=`
  URL param still able to override it if the deployment wants a fixed view
  regardless of local state drift.
- **Touch-vs-edge-swipe guard** (same section, CLAUDE.md): both canvases stop
  touch propagation except within 24 px of the left window edge — this exists
  *specifically* so a `panel_custom` panel loaded inside the **HA Companion
  App's own WebView** doesn't have its own edge-swipe fights with the
  Companion app's hamburger-drawer gesture. This guard is irrelevant when
  Diorama is loaded in Fully Kiosk (no HA app drawer to protect against) but
  is exactly why using the HA Companion App's *launcher* mode (§2.2) as the
  host is safe — Diorama was already built expecting to sit inside it.
- **Rendering is already "cheap tablet" tuned** (CLAUDE.md "Sims-style
  rendering" + confirmed in source):
  - `MeshToonMaterial` + one shared 4-step gradient map instead of PBR (no
    per-material lighting-model cost, no `scene.environment`/PMREM).
  - `renderer.shadowMap.enabled = false` (`src/three-renderer.ts` L952) —
    shadow maps are one of the most expensive mobile GPU features; Diorama
    never pays that cost, using blob-shadow decals instead.
  - `setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))`
    (`src/three-renderer.ts` L943, and again for weather particle density at
    L5507–5510) — the exact DPR-cap-at-2 mitigation research recommends is
    already in place; there is no retina/4K kiosk tablet that will render at
    a wasteful pixel ratio.
  - `webglcontextlost` listener (`src/three-renderer.ts` L1032–1034) — guards
    against the exact "backgrounded WebView drops its GL context" failure
    mode that's common on Android when a kiosk app briefly suspends the tab
    (e.g. during a Fully Kiosk screensaver/screen-off cycle) and resumes it.
  - Outline shells / inverted-hull rendering doubles draw calls for furniture/
    humanoids but geometry is intentionally low-poly (Sims-2000 aesthetic, not
    photoreal) — no action needed, flagging only because §2.8's draw-call
    guidance is the lens to re-examine this through if a future feature adds
    heavy per-object geometry.
  - **Lazy 3D chunk** (CLAUDE.md "Lazy 3D chunk"): a kiosk fixed to the 2D
    view never pays the ~600 kB (157 kB gzip) three.js cost at all — worth
    remembering when picking a kiosk's default view for the very cheapest
    hardware (Fire HD-class): 2D-only is a legitimate "won't stutter" fallback
    dashboard mode, not just an editing convenience.

### 3.2 Small gaps worth closing (not yet built)

- **No first-class "kiosk device" fixture.** Diorama has no way to *see* its
  own kiosk tablet's telemetry (battery %, screen-on state) inside the plan
  the way it can any other `sensor.*`/`binary_sensor.*`. This doesn't need new
  Diorama code, though — the existing **EnvSensor fixture** (any `sensor.*`
  binding, generic kind) already covers a `fully_kiosk`-provided battery-level
  sensor, and the existing **battery badge** machinery (CLAUDE.md "Roadmap
  quick wins (batch E)" — `batteryFor`/`batteryForDevice`, `drawBatteryBadge*`)
  will already surface it on any fixture whose HA device has a sibling
  battery-class sensor, *if* the tablet's Fully Kiosk device is itself
  represented by some placed fixture bound to one of its entities (e.g. a
  `MotionSensor` bound to `fully_kiosk`'s kiosk-mode binary sensor, placed
  wherever the tablet physically hangs). This is a **documentation-only**
  integration point, not a code gap — call it out in the setup checklist
  rather than building anything new.
- **No "screensaver" mode of Diorama's own.** Fully Kiosk's screensaver (blank
  screen or slideshow after N idle seconds) and Diorama's own **auto-follow
  camera** / **cinematic slow-orbit** (`Scene3D.autoFollow`, `cinematicOrbit`,
  CLAUDE.md) solve *different* problems and can compose: point Fully's Start
  URL at a Diorama kiosk URL with `view=3d`, `layers=simple`, cinematic orbit
  ON, auto-follow ON, and NO Fully screensaver at all — the 3D view itself
  becomes an ambient "watch your house" display, which is arguably a nicer
  wall-panel idle state than a blank screen or photo slideshow. This is a
  **usage pattern to document**, not a feature to build (all the pieces
  already ship).
- **`?debug3d=1` isn't discoverable.** It exists only as a code comment; the
  setup checklist below should surface it explicitly since it's the single
  most useful troubleshooting tool for a kiosk device with no devtools access.

## 4. Setup / integration steps

Ordered checklist, Fully Kiosk as the primary path (HA Companion App variant
noted inline where it diverges):

1. **Pick hardware.** A real Android tablet, not the cheapest no-name
   unbranded unit — Fire OS and generic $30 tablets are explicitly flagged by
   Fully Kiosk as reduced-feature-set / issue-prone (§2.1, §2.6). Budget
   picks: Lenovo Tab M8/M10 or Samsung Galaxy Tab A8 class; confirm Android 7+
   at minimum, prefer a device that will get updates so the system WebView
   (and thus WebGL support) doesn't freeze on an old Chromium build (§2.1).
2. **(Optional, recommended for password-free kiosk login) Configure
   `trusted_networks`** in HA's `configuration.yaml` per §2.7 — `homeassistant`
   provider must remain listed, `trusted_networks` listed *before* it, use a
   subnet (`/24`), not a bare host IP.
3. **(Optional, recommended) Install the `kiosk-mode` HACS frontend module**
   ([maykar/kiosk-mode](https://github.com/maykar/kiosk-mode)) so HA's own
   sidebar/header don't show around the `panel_custom` Diorama panel (§2.7).
4. **Build the kiosk URL from inside Diorama**: open Diorama in edit mode on
   a desktop/laptop, frame the floor/camera you want the tablet to show,
   click **"🔗 Kiosk link"** in the topbar (§3.1) — this copies a URL with
   `mode=kiosk`, `view`, `floor`, and (if in 3D) `cam` already filled in.
   Manually append `&lock=1` to hide the mode switcher on the tablet, and
   optionally `&layers=simple` for the reduced-clutter preset.
5. **Install Fully Kiosk Browser**, buy the **Plus license** (~€7.90/device,
   one-time; §2.1) if using Remote Admin/MQTT/motion features. Set:
   - **Start URL** = the kiosk URL from step 4.
   - **Launch on Boot** = on.
   - **Keep Screen On** = on (or configure a motion-based wake instead if a
     physical PIR sensor is available — see step 7).
   - **Motion Detection**: only enable if the device is Android <14 or the
     use case tolerates it staying foregrounded (§2.4) — otherwise skip and
     rely on a real HA-bound motion sensor.
   - Enable **Remote Admin** + set its password (needed for step 8's HA
     integration and for solo-installer LAN management at
     `http://<tablet-ip>:2323`).
   - *(HA Companion App alternative to this whole step)*: Settings →
     Companion app → Device home screen → "Use as Home app (launcher)";
     Other settings → "Keep screen on"; Dashboards → set the Diorama panel/
     dashboard as default-on-this-device. Simpler, free, but no configurable
     screensaver timeout or motion-wake (§2.2).
6. **Add the `fully_kiosk` integration** in HA (Settings → Devices & Services
   → Add Integration → search "Fully Kiosk Browser"), entering the tablet's
   IP + Remote Admin password from step 5. This surfaces battery/RAM/storage/
   foreground-app sensors and the `load_url`/`set_config`/`start_application`
   actions.
7. **Wire a wake/health automation** using a real HA motion sensor (not the
   tablet's own camera, per §2.4) → `fully_kiosk.load_url` (reload to the
   kiosk URL, guards against the tablet having wandered off it) and/or the
   `screenOn` REST/service call. The community blueprint at
   `community.home-assistant.io/t/fully-kiosk-mqtt-sensor-automation/849229`
   is a starting point but reportedly needs YAML fixes — hand-roll a minimal
   version if it doesn't import cleanly.
8. **If troubleshooting a blank/frozen tablet with no devtools access**,
   reload the kiosk URL with `&debug3d=1` appended — an on-screen error
   console will render at the bottom of the viewport (§3.1, §3.2).
9. **(Fleet of 3+ tablets)** evaluate Scalefusion (~$24/device/yr) or
   AirDroid Business (~$12/device/yr) for zero-touch bulk enrollment,
   central config push, and self-service remote reboot — skip this for a
   single-digit tablet count where Fully's own Remote Admin (step 5) is
   already sufficient (§2.5).
10. **(Optional ambient-display pattern)** for a tablet meant to be a passive
    "watch your house" display rather than an interactive control panel,
    point its kiosk URL at `view=3d`, enable `Scene3D.cinematicOrbit` and
    `Scene3D.autoFollow` from Diorama's 3D Scene sidebar section before
    minting the kiosk link, and disable Fully's own screensaver — Diorama's
    3D view becomes the screensaver (§3.2).

## 5. Potential additional features

- **A "kiosk device" self-registration helper**: a small sidebar affordance
  that, given a `fully_kiosk`-integrated device, auto-suggests placing/
  binding a fixture at the tablet's approximate wall position so its battery/
  screen-state ride the existing badge machinery without the user having to
  know that trick (§3.2) — pure UX sugar over existing capability.
- **Kiosk-link presets beyond the single button**: since the URL template
  already supports `layers=<preset>` and `view3d=<saved view>` (CLAUDE.md), a
  "Kiosk links" sidebar list (one row per saved 3D view / layer preset, each
  with its own copy button) would let a multi-tablet household mint several
  different kiosk URLs (kitchen tablet → kitchen floor + top-down 2D; living
  room tablet → cinematic 3D orbit) without re-navigating the camera each
  time.
- **QR-code kiosk link**: render the kiosk URL as an on-screen QR code next
  to the "🔗 Kiosk link" button — faster to get a long URL with a `cam=`
  payload onto a tablet's Fully Kiosk Start URL field than typing/pasting
  from a clipboard that may not sync across devices.
- **Health tile**: a tiny always-visible corner badge (kiosk/view mode only)
  showing HA connection state + last-frame timestamp, doubling as a "is this
  tablet still alive" remote-glanceable signal, complementing `?debug3d=1`
  for a fleet an installer isn't standing in front of.
- **Explicit "ambient/screensaver" URL flag**: a single `?ambient=1` template
  param that bundles the step-10 pattern (3D view, cinematic orbit + auto-
  follow on, simple layers) into one flag instead of requiring four separate
  settings to be pre-configured, lowering the setup steps in §4 by one.

## 6. Open questions & risks

- **WebGL2 availability on old/frozen system WebViews** (§2.1, §2.8) was
  identified as a real risk (Chrome 114+ needed) but not load-tested against
  a specific old device in this research pass — worth a concrete smoke test
  on a genuinely old (Android 8–9, unpatched WebView) unit before recommending
  it as a supported floor.
- **Fully Kiosk performance complaints exist** ("became very laggy after a
  day or two," video-stream crashes) in community reports (§2.2) — unclear
  whether this is a Fully-specific WebView memory-leak pattern, generic
  Android WebView long-session degradation, or specific to certain camera-
  streaming dashboards (not obviously applicable to Diorama's own render
  loop, which already guards against context loss, but worth a long-duration
  soak test — e.g. 48–72 h uninterrupted — before treating any kiosk device
  as "set and forget").
- **Android 14's foreground-service camera/mic restriction is a moving
  target** — exact behavior may continue to change across Android 15/16;
  re-verify at implementation/deployment time rather than trusting this
  snapshot indefinitely, especially for any future feature that assumes tablet
  camera-based presence detection.
- **`trusted_networks` + `allow_bypass_login` re-authenticates on every page
  load** (§2.7) rather than persisting a session cookie — for Diorama
  specifically this is low-risk (SPA reload is rare mid-session, WS reconnect
  handles disconnects without a full page reload) but worth confirming it
  doesn't cause an extra visible flash/redirect on the specific reload paths
  a kiosk device exercises (e.g. after `fully_kiosk.load_url` resets it).
- **WallPanel's maintenance status is a dead end** (§2.3) — flagged, not
  recommended, but note some existing installs still run it; no action
  needed beyond not building anything new against it.
- **MDM pricing quoted (§2.5) is a point-in-time snapshot** (2025–2026
  marketing pages) — re-check before quoting a specific number to a user
  making a purchase decision; treat as "same order of magnitude" not exact.
- **The `kiosk-mode` HACS module and `trusted_networks` are both HA-side,
  outside Diorama's own repo** — this doc documents them as companion setup
  steps because they materially affect what a Diorama kiosk *looks like* and
  *how it logs in*, but neither is something Diorama's code can control or
  verify at runtime; a support conversation about "why does my sidebar still
  show" needs to route to HA/HACS troubleshooting, not Diorama's issue
  tracker.

## 7. Sources

- [Fully Kiosk Browser & App Lockdown — official site](https://www.fully-kiosk.com/en/)
- [What browser engine does Fully Kiosk use? — Fully help](https://help.android-kiosk.com/en/article/what-browser-engine-does-kiosk-browserlauncher-built-in-browser-use-1rhzkn9/)
- [Fully Kiosk Browser — Home Assistant integration docs](https://www.home-assistant.io/integrations/fully_kiosk/)
- [Fully Kiosk + MQTT/REST worked example — newerest.space](https://newerest.space/home-assistant-fully-kiosk-mqtt/)
- [Fully Kiosk MQTT sensor automation blueprint — HA community](https://community.home-assistant.io/t/fully-kiosk-mqtt-sensor-automation/849229)
- [thomasloven/lovelace-fullykiosk (deprecated 2019) — GitHub](https://github.com/thomasloven/lovelace-fullykiosk)
- [Fully pricing snapshot — Capterra](https://www.capterra.com/p/156468/Fully/)
- [Fully PLUS single/volume licenses](https://license.fully-kiosk.com/license/single)
- [Home Assistant on a tablet: Fully Kiosk Browser or App? — HA community](https://community.home-assistant.io/t/home-assistant-on-a-tablet-fully-kiosk-browser-or-app/265283)
- [Android Home App (launcher) — HA Companion docs](https://companion.home-assistant.io/docs/integrations/android-home-app-launcher/)
- [iOS Kiosk mode — HA Companion docs (for comparison)](https://companion.home-assistant.io/docs/integrations/ios-kiosk-mode/)
- [WTH doesn't the companion app have kiosk-mode functionality? — HA community](https://community.home-assistant.io/t/wth-doesnt-the-companion-app-have-kiosk-mode-functionality/804699)
- [Status Bar Still Visible in Fullscreen Mode — home-assistant/android#5539](https://github.com/home-assistant/android/issues/5539)
- [TheTimeWalker/wallpanel-android (archived May 2025)](https://github.com/TheTimeWalker/wallpanel-android)
- [WallPanel-Project (deprecated, points to active fork)](https://github.com/WallPanel-Project/wallpanel-android)
- [Lock task mode — Android Enterprise developer docs](https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode)
- [Foreground service types are required — Android 14 changes](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- [Restrictions on starting a foreground service from the background — Android Developers](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start)
- [Optimizing PWAs for different display modes — Smashing Magazine (2025)](https://www.smashingmagazine.com/2025/08/optimizing-pwas-different-display-modes/)
- [PWA "Add to Home Screen" guide — Gomage](https://www.gomage.com/blog/pwa-add-to-home-screen/)
- [10 Best Android MDM Solutions for 2026 — Scalefusion blog](https://blog.scalefusion.com/top-android-mdm-solutions/)
- [8 Top MDM Providers for Android & iOS — AirDroid](https://www.airdroid.com/mdm/mdm-providers/)
- [Android Kiosk Software: A Comprehensive Guide — emteria](https://emteria.com/blog/android-kiosk-software)
- [Lenovo Tab M10 specifications — GSMArena](https://www.gsmarena.com/lenovo_tab_m10-12425.php)
- [Lenovo Tab M8 (4th Gen) specifications — GSMArena](https://www.gsmarena.com/lenovo_tab_m8_%284th_gen%29-12521.php)
- [Best tablets for HA wall dashboard 2026 — SmartHomeExplorer](https://www.smarthomeexplorer.com/guides/home-assistant-dashboard-setup-2026)
- [Authentication providers — Home Assistant docs](https://www.home-assistant.io/docs/authentication/providers/)
- [Fully Kiosk auto-login — HA community](https://community.home-assistant.io/t/fully-kiosk-auto-login/697057)
- [Kiosk Mode (maykar/kiosk-mode) — GitHub](https://github.com/maykar/kiosk-mode)
- [Custom panel (panel_custom) — Home Assistant docs](https://www.home-assistant.io/integrations/panel_custom/)
- [100 Three.js performance tips (2026) — Utsubo](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Draw calls: the silent killer — Three.js Roadmap](https://threejsroadmap.com/blog/draw-calls-the-silent-killer)
- Diorama repo source read directly: `src/ui/app.ts` (`_applyUrlParams`,
  `adoptPlanner`), `src/ui/topbar.ts` (`_copyKioskLink`), `src/planner.ts`
  (`lastCam3d`), `src/three-renderer.ts` (DPR cap L943/L5510, shadow-map
  disable L952, `webglcontextlost` L1032–1034), `CLAUDE.md` (uiMode/URL
  templates, device-local view + touch guards, Sims-style rendering, lazy 3D
  chunk sections).
