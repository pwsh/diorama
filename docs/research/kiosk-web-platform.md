# Cross-Platform Kiosk Web Techniques — Build-Ready Research

Status: research complete, not yet implemented. Target: hardening Diorama's
*existing* `uiMode` (`edit`/`kiosk`/`view`) + URL-template machinery for
always-on wall/TV displays, independent of which physical box renders the
page (Fully Kiosk Browser tablet, Chromium-on-Raspberry-Pi signage, HA
Companion app WebView, a plain desktop browser tab, or a TV browser).

## 1. Summary

Diorama already ships the *product-level* half of kiosk support: `Planner.uiMode`
(`edit`/`kiosk`/`view`), URL templates (`?mode`, `lock=1`, `view`, `floor`,
`layers`, `view3d`, `cam=x,y,z,tx,ty,tz`), a kiosk-link button that mints a
`cam=` URL from the live camera pose, `save()` no-op outside edit, touch-drawer
edge-swipe guards, device-local view memory (`localStorage['diorama:view']`),
a DPR cap of 2, and a `webglcontextlost` listener with try/catch-wrapped RAF
loops that reschedule the next frame before doing work (self-healing at the
frame level already).

What's missing is the *platform* half: the handful of browser/OS-level
mechanisms every unattended kiosk display needs regardless of vendor —
keeping the screen alive, going edge-to-edge fullscreen, surviving flaky
Wi-Fi/HA-restarts without a human walking over to it, respecting notches/
curved corners/TV overscan, and (for the no-touch, remote-control case)
being operable at all. None of these are Diorama-specific; they're the same
five problems every "put a dashboard on a wall or a TV" project solves. This
doc is a reference for solving them once, mapped onto Diorama's existing
`Planner`/`ui/app.ts`/three-view architecture, so a future session can
implement without re-researching.

This matters for Diorama specifically because it is **not always inside a
browser chrome the user controls** — it's most often loaded three different
ways (`panel_custom` inside HA's own frontend SPA, the iframe fallback with a
pasted long-lived token, or the standalone `index.html` entry pointed at
directly by a kiosk browser), and each hosting mode changes which of these
platform mechanisms are even reachable. Getting that mapping right up front
avoids shipping a Wake Lock call that's a no-op inside a WebView that already
holds its own native wake lock, or a service worker that fights HA's own.

## 2. Platform / data model / real-world facts

### 2.1 Screen Wake Lock API

- **API shape**: `const sentinel = await navigator.wakeLock.request('screen')`
  resolves to a `WakeLockSentinel`; `sentinel.release()` (also a Promise)
  releases it explicitly. Source: [MDN — Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), [MDN — Navigator.wakeLock](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/wakeLock).
- **Support** (Baseline since March 2025 per MDN): Chrome/Edge 84+, Opera 70+,
  Samsung Internet 14+, Firefox 126+, **Safari 16.4+ on both macOS and iOS/iPadOS**
  ([web.dev — Screen Wake Lock API now supported in all browsers](https://web.dev/blog/screen-wake-lock-supported-in-all-browsers)).
  Because Apple forces every iOS browser engine to be WebKit, this Safari
  version gate applies to Chrome/Edge/Firefox-on-iOS too. Global support
  "above 94%" as of the sources' write-up date.
- **Hard requirements / gotchas** (verified from MDN):
  - **Secure context only** (HTTPS, or `localhost`).
  - The lock is tied to **document visibility** — `document.visibilityState`.
    A wake lock is **automatically released the instant the document/tab
    goes hidden** (app backgrounded, screen turned off by the OS, tab
    switched). It does **not** care about any in-page CSS `visibility` /
    `opacity` — an internal dimming overlay for a screensaver effect is
    perfectly safe and won't drop the lock.
  - The documented re-acquire pattern is a `visibilitychange` listener that
    re-requests the lock when `document.visibilityState === 'visible'` again
    (MDN's own example). This is **required**, not optional — any real
    implementation needs it, because the very first time the OS blanks the
    screen (even briefly) silently drops the lock forever otherwise.
  - Gated by the `screen-wake-lock` **Permissions-Policy** directive
    (default allowlist `self` — same-origin nested frames only; irrelevant
    for Diorama's own top-level document but relevant if it's ever embedded
    cross-origin in an iframe with no policy header).
  - **Pre-16.4 iOS / older Android WebView fallback**: [NoSleep.js](https://github.com/richtr/NoSleep.js/)
    is the standard shim — plays a tiny looping muted video, since browsers
    won't sleep the screen while a video is actively playing. It still
    requires a user-gesture to start (autoplay policy), same constraint as
    real `<video>` playback anywhere else.
- **Already-native alternatives that make this partially redundant**:
  - HA's **Android Companion app WebView** ships its own **"Keep screen on"**
    toggle in *Settings → Companion App* that keeps the screen on while the
    WebView activity is foregrounded — independent of the Wake Lock API
    entirely ([Companion docs — Android WebView](https://companion.home-assistant.io/docs/integrations/android-webview/)).
  - HA's **iOS Companion app** kiosk mode has its own **"Keep screen on"**
    setting that overrides iOS Auto-Lock while the app is foregrounded
    ([Companion docs — iOS Kiosk Mode](https://companion.home-assistant.io/docs/integrations/ios-kiosk-mode/)).
  - **Fully Kiosk Browser** has its own **"Keep Screen On"** device setting
    plus a **screen-off timer** / scheduled wake-sleep window that overrides
    it when desired.
  - So the Wake Lock API is chiefly valuable for the cases *without* one of
    those native app-level settings: a **plain desktop/laptop browser tab**
    left open (e.g. an old iPad's stock Safari, a spare monitor driven by
    Chrome), or as a zero-cost defense-in-depth layer that doesn't hurt when
    a native setting is *also* on.

### 2.2 Fullscreen API

- **API shape**: `el.requestFullscreen()` (any `Element`, typically
  `document.documentElement`) returns a Promise; `document.exitFullscreen()`
  to leave; `document.fullscreenElement` / `fullscreenchange` event to track
  state. Source: [MDN — Element.requestFullscreen()](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen), [MDN — Fullscreen API guide](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide).
- **Hard limit — cannot be silently automatic**: `requestFullscreen()` is
  restricted to fire from within a **user gesture** (a click/tap/keydown
  handler) in every browser bar one documented exception. There is **no**
  way for a page to enter fullscreen on load with zero interaction on stock
  browser settings — a kiosk page must show a one-time "tap to go
  fullscreen" affordance, or rely on an OS/app-level fullscreen mechanism
  instead (see 2.4/2.5 below).
  - **The one exception**: Chrome Enterprise's `AutomaticFullscreenAllowedForUrls`
    policy lets an MDM administrator grant specific origins permission to
    call `requestFullscreen()` with no gesture at all
    ([ChromeOS.dev — Using the Fullscreen API without gestures](https://chromeos.dev/en/posts/using-the-fullscreen-api-without-gestures)).
    This requires **managed Chrome** (Chrome Enterprise / ChromeOS device
    policy) — not available on a stock Android tablet, Fully Kiosk Browser's
    embedded WebView, or an unmanaged Raspberry Pi Chromium install.
- **Kiosk-hardware alternatives that make the web Fullscreen API moot**:
  browser-level `--kiosk` flags (Chromium: `--kiosk --noerrdialogs
  --disable-infobars`, commonly paired with `--incognito --no-first-run
  --disable-translate --overscroll-history-navigation=0` on Raspberry Pi
  signage builds — see [Raspberry Pi's own kiosk tutorial](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/)
  and multiple community write-ups) already force true OS-level fullscreen
  with no per-page JS needed; **Fully Kiosk Browser** has its own "Enable
  Fullscreen Mode" device setting that does the same at the app layer. In
  those hosts the web Fullscreen API is redundant — it only matters for a
  **plain browser tab** (desktop Chrome/Safari pointed at the panel, an
  unmodified tablet browser) where the user hasn't set up a dedicated kiosk
  wrapper.

### 2.3 Viewport, safe area, orientation

- **`viewport-fit=cover`**: added to the `<meta name="viewport">` tag,
  this tells the browser to let the page's viewport extend into the
  notch/sensor-housing/rounded-corner area of the physical display *instead
  of* the browser reserving a plain black bar there.
  ([MDN — meta viewport](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport), [CSS-Tricks — "The Notch" and CSS](https://css-tricks.com/the-notch-and-css/))
- **`env(safe-area-inset-*)`**: four CSS environment variables —
  `safe-area-inset-top/right/bottom/left` — describing the inset from each
  edge that is guaranteed clear of the notch/home-indicator/rounded corner.
  **They only resolve to a nonzero value when `viewport-fit=cover` is set**
  — omit that meta tag and every one of these variables is always `0px`,
  silently doing nothing (a documented gotcha, not just an edge case).
  Typical usage: `padding: env(safe-area-inset-top) env(safe-area-inset-right)
  env(safe-area-inset-bottom) env(safe-area-inset-left);` on fixed-position
  chrome. Chrome for Android has an active **edge-to-edge migration**
  pushing the same model onto Android system bars
  ([Chrome for Developers — edge-to-edge migration guide](https://developer.chrome.com/docs/css-ui/edge-to-edge)).
- **Screen Orientation API — `lock()`**: `screen.orientation.lock('landscape')`
  (accepts `portrait-primary/secondary`, `landscape-primary/secondary`,
  `portrait`, `landscape`, `natural`, `any`) returns a Promise. **"Well
  established" per MDN**, but **"orientation locking is only enabled on
  mobile devices, and when the browser context is full screen"**
  ([MDN — ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock)) —
  i.e. it silently fails outside fullscreen and is a desktop no-op, so it
  must be attempted only after a successful `requestFullscreen()`, wrapped
  in try/catch.
  - Both HA Companion apps already expose their own OS-level orientation
    lock (Android: "fix the webview orientation" setting; similar toggle in
    iOS kiosk settings) — again making the web API redundant *inside those
    specific hosts*, but still the only lever available for a stock browser
    tab or a non-HA-Companion kiosk wrapper.

### 2.4 PWA manifest + service worker (installable offline shell)

- **Manifest fields relevant here** ([web.dev — Web app manifest](https://web.dev/learn/pwa/web-app-manifest)):
  `display: 'standalone'` (recommended default; `'fullscreen'` strips even
  more chrome but is less consistently honored) or the newer
  `display_override` array for finer fallback control; `orientation`
  (`'landscape'` is the natural choice for a floor-plan app); `start_url`
  (absolute path, `'.'` or `'/'`); `scope` (anything navigated to outside
  `scope` opens an in-app browser rather than staying in the installed
  shell — matters if Diorama ever deep-links out to HA's own dashboard);
  `theme_color` / `background_color` for the OS chrome + splash screen;
  icons — minimum 512×512, recommended set 192/384/512/1024, with a
  **maskable** 512×512 variant (content inside a centered 40%-radius "safe
  zone" so OS icon-shape masking doesn't clip it).
- **Service worker**: the offline-shell mechanism is the
  **App Shell pattern** — cache the small set of static files that make up
  the UI chrome (here: the built JS/CSS bundle, since Diorama is a Vite
  SPA) so the shell paints even with zero network, then fetch live data
  (HA WebSocket state) once connectivity returns. Caching-strategy
  convention: **cache-first** for versioned static assets, **network-first
  or stale-while-revalidate** for anything that can go stale (not very
  applicable here since all live data rides the WS connection, not HTTP
  fetches). [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) is the
  standard Vite integration and offers two strategies: **`generateSW`**
  (the plugin auto-writes a Workbox service worker from a config object —
  zero custom SW code) or **`injectManifest`** (you author your own
  `sw.js`, and the plugin injects the precache manifest into it via
  Workbox's `injectManifest` build step, needed if custom logic — like a
  kiosk watchdog reload — must live inside the SW itself).
- **What is NOT possible / what doesn't apply to Diorama's `panel_custom`
  mode**: when Diorama runs as a `panel_custom` panel, it is a custom
  element mounted **inside HA's own frontend SPA document** — it does not
  own the top-level `<html>` document, so it cannot register its own
  manifest or top-level service worker there; the installable-PWA shell in
  that mode is **HA's own frontend PWA** (already installable/offline-
  capable by HA core itself), and Diorama is just a panel inside it. A
  Diorama-specific manifest + service worker is therefore only meaningful
  for the **standalone `index.html` entry** — the mode where a kiosk
  browser is pointed directly at Diorama's own URL with a pasted
  long-lived token, bypassing the HA frontend shell entirely.

### 2.5 Home Assistant companion/kiosk ecosystem (the realistic deployment targets)

- **HA iOS Companion app — Kiosk Mode** ([Companion docs](https://companion.home-assistant.io/docs/integrations/ios-kiosk-mode/)):
  ships a **screensaver** with three modes — **Clock** (full-screen time,
  with Large/Medium/Small style + optional date/seconds), **Dim** (keeps
  the dashboard visible but dimmed), **Blank** (black screen, "most
  power-efficient... best choice for OLED displays"). **Time to start**:
  30 seconds to 1 hour of inactivity, or **"Push notification controlled"**
  to disable the local inactivity timer entirely and drive the screensaver
  purely by remote command. **Remote kiosk commands** (sent as the message
  body of a push notification): `kiosk_show_screensaver` /
  `kiosk_hide_screensaver`, `kiosk_show_camera` / `kiosk_hide_camera`
  (needs an `entity_id`), `kiosk_set_brightness` (0–100), `kiosk_set_volume`
  (0–100), `kiosk_reload`, `kiosk_default` (return to the configured
  dashboard) — commands only apply while the app is foregrounded, and there
  is a toggle to accept/ignore them. There is also a configurable
  **auto-reload** schedule (Never, or every 1 minute–1 hour) baked into the
  app.
- **HA Android Companion app — WebView settings** ([Companion docs](https://companion.home-assistant.io/docs/integrations/android-webview/)):
  **Keep screen on**, **fix orientation** (landscape/portrait/system),
  **pinch-to-zoom** enable, **Chrome remote debugging** enable, autoplay
  videos in the more-info panel. No documented crash-recovery / auto-reload
  toggle at the WebView-settings level specifically (the "Android Home App
  launcher" mode is the closer analogue to a dedicated kiosk wrapper).
- **Fully Kiosk Browser & Lockdown** (third-party Android app, the most
  commonly recommended non-HA kiosk wrapper in the community): **Auto Reload
  on Idle** (reload the Start URL / current page after N seconds of no
  touch input), plus auto-reload triggers on network reconnect or screen-on;
  **Keep Screen On** (independent of, and layered under, its own **Screen
  Off Timer** / scheduled wake-sleep windows); a **Fullscreen Mode** device
  setting; 300+ total config options via its Remote Admin web panel.
  - **HA's official `fully_kiosk` integration** ([home-assistant.io/integrations/fully_kiosk](https://www.home-assistant.io/integrations/fully_kiosk/))
    talks to that Remote Admin API: requires **Fully Kiosk Browser Plus**
    (paid license — the free tier works with a watermark for testing) with
    **"Remote Admin" enabled** on-device, plus its IP + Remote Admin
    password for HA to connect (LAN, optionally with a self-signed cert).
    It surfaces sensors (battery, charging, current page, active app,
    storage/RAM, kiosk-locked state) and actions: **`fully_kiosk.load_url`**,
    **`fully_kiosk.set_config`** (sets any of Fully's 300+ config keys — the
    key list is visible via "Show keys" in Fully's own Remote Admin panel),
    **`fully_kiosk.start_application`**, plus screen on/off, brightness,
    volume, TTS/overlay messages, motion-triggered camera entity, and
    reboot (root-required). This means Diorama's existing **kiosk-link
    button** (which mints a `cam=`/`view3d=`/`mode=kiosk&lock=1` URL) can be
    pushed to a Fully-Kiosk-Browser tablet entirely from HA automations via
    `fully_kiosk.load_url`, with no touch on the tablet at all.
- **Chromium `--kiosk` on generic hardware** (Raspberry Pi signage being the
  most-documented case): the standard flag set is `--kiosk --noerrdialogs
  --disable-infobars`, frequently extended with `--incognito
  --disable-translate --no-first-run --overscroll-history-navigation=0`
  ([Raspberry Pi Foundation's own tutorial](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/),
  corroborated by several independent walkthroughs). This is the path for
  any wall panel that isn't a tablet running a dedicated kiosk app — a
  cheap Pi + monitor driven straight by Chromium.

### 2.6 D-pad / remote-control (no-touch TV) navigation

- **There is no shipped browser standard for this yet.** The W3C/WICG
  **CSS Spatial Navigation** spec (`--spatial-navigation-contain`,
  `--spatial-navigation-action`, `--spatial-navigation-function` CSS
  properties; `navigate()`, `spatialNavigationSearch()`,
  `getSpatialNavigationContainer()`, `focusableAreas()` JS APIs) has moved
  from WICG to the CSS Working Group as an official draft, but **"hasn't
  been implemented in any browser yet"** per the spec's own explainer
  ([WICG spatial-navigation draft](https://wicg.github.io/spatial-navigation/)).
  Treat it as **not usable in production today** — it's a future target,
  not a current API.
- **What TV browsers actually do today**: they map the remote's D-pad
  directly onto **standard arrow-key `KeyboardEvent`s** and move
  `document.activeElement` between **native focusable elements** (links,
  buttons, inputs, anything with `tabindex`) using the browser's ordinary
  tab-order/geometric-focus heuristics — "TV browsers have enabled users to
  move the focus using the arrow keys out of necessity, since no other
  input mechanism is available on a typical TV remote control"
  ([Norigin Media's Smart TV Navigation write-up](https://medium.com/norigintech/smart-tv-navigation-with-react-86bd5f3037b7)).
  This is confirmed on the native-Android-TV side too — the platform's own
  guidance is the same directional-focus contract: "The D-pad transfers
  focus from one object to the nearest object in the direction of the
  button pressed," and app authors are told to ensure "a user with a D-pad
  controller can navigate to all visible controls on the screen" with
  visibly obvious focus rings ([Android Developers — TV navigation](https://developer.android.com/training/tv/get-started/navigation)).
- **The production-grade library**: [Norigin Spatial Navigation](https://github.com/NoriginMedia/norigin-spatial-navigation)
  (React-hooks based, MIT, npm `@noriginmedia/norigin-spatial-navigation`)
  is reported in active production use on Samsung Tizen, LG webOS, Hisense
  Vidaa, Vizio, and Chromium-based set-top boxes. It works by wrapping each
  navigable UI region in a *focusable container* component and computing
  directional candidates itself (a userland polyfill of the unshipped
  spec), **not** by relying on any native browser spatial-nav feature.
- **The framework mismatch for Diorama specifically**: Norigin-style
  libraries assume the navigable surface is a tree of **native DOM
  elements** (React components, real focusable nodes). Diorama's
  interactive surface is the opposite of that — fixtures are either
  **canvas-drawn shapes** hit-tested by raycasting mouse/touch coordinates
  (`canvas-hit.ts`) or **three.js meshes** hit-tested by `Raycaster`
  (`three-renderer.ts`) — *none* of them are individually focusable DOM
  nodes today. Adopting a real spatial-nav library would mean either (a)
  overlaying invisible focusable proxy elements positioned over every
  clickable fixture on every frame (expensive, fights the RAF/dirty-key
  architecture), or (b) a much larger redesign. This is the single biggest
  practical obstacle for full D-pad support — see §6.

## 3. Diorama design / integration

Concrete mapping onto the existing files/mechanisms named in CLAUDE.md.

### 3.1 Wake Lock — `Planner` + `app.ts`

- Add a small `wake-lock.ts` (or a few methods directly on `Planner`, in the
  style of the existing fire-and-forget notify calls in the geo-calibration
  code): `acquireWakeLock()` / `releaseWakeLock()`, feature-detected via
  `'wakeLock' in navigator`, entirely wrapped in try/catch (matches the
  codebase's documented convention that all "fire-and-forget" platform
  calls never block the UI).
- Hook it to `Planner.uiMode`: acquire when mode flips to `kiosk` or `view`,
  release when it flips back to `edit` (mirrors how `save()` already no-ops
  outside edit — same "kiosk/view = display appliance" philosophy).
- Add the MDN-documented `visibilitychange` re-acquire listener once, at
  `app.ts` bootstrap (parallel to the existing `webglcontextlost` listener
  already living at that level) — without it the lock permanently drops
  the first time the OS blanks the screen or the tab is backgrounded even
  momentarily.
- No new dirty key needed — this is host-level, not render-state.

### 3.2 Fullscreen — topbar + kiosk-link button family

- Add a "⛶ Fullscreen" affordance next to the existing kiosk-link button in
  `topbar.ts` (kiosk/view mode only, or always-visible but most useful
  there). On click: `document.documentElement.requestFullscreen()` inside
  the click handler (satisfies the user-gesture requirement — this **must**
  be a direct synchronous result of the click, not deferred).
- On `fullscreenchange`, if a fullscreen session drops unexpectedly (some
  Android WebViews kick out of fullscreen on certain system dialogs),
  re-show the button rather than silently leaving the user in windowed
  mode — a one-line state flag, no new architecture.
- Persist "was in fullscreen" as a device-local flag (`localStorage`,
  same convention as `diorama:view`) purely so a return visit shows the
  right button label/hint; there's no way to *act* on it without a gesture,
  so don't over-engineer this.
- Document in the sidebar/Settings drawer (or a kiosk-mode help tooltip)
  that production installs should prefer the **host's own** fullscreen
  mechanism (Fully Kiosk Browser's "Fullscreen Mode" setting, Chromium's
  `--kiosk` flag, or Chrome Enterprise's `AutomaticFullscreenAllowedForUrls`
  policy for MDM-managed hardware) — the in-page button is a fallback for
  the plain-browser-tab case, not the primary path.

### 3.3 Auto-refresh / self-heal — extends the existing RAF + `webglcontextlost` pattern

Diorama already has two of the three legs of self-healing (per-frame
try/catch that reschedules before doing work; `webglcontextlost`/`restored`
handling). The missing leg is **liveness of the HA connection itself** —
detecting "the WebSocket died and reconnect logic isn't recovering" rather
than a rendering fault.

- Both `HassClient` and `HassPanelAdapter` already track connection state
  (`Planner.connect`/`connectWith`). Add a watchdog timer (kiosk/view mode
  only) that checks "have we received *any* `state_changed` event or a
  successful `get_states` refresh in the last N minutes" (N configurable,
  default something like 5–10 minutes — comfortably longer than any normal
  HA restart) and calls `location.reload()` if not. This mirrors exactly
  the pattern the ecosystem already converged on independently: HA iOS's
  own **configurable Auto-Reload** (1 min–1 hr) and Fully Kiosk Browser's
  **Auto Reload on Idle** — "just reload the page periodically/on staleness"
  is the field-tested answer, not a fancier reconnection state machine.
- Layer in a **hard periodic reload** floor too (e.g. once every 12–24
  hours regardless of connection health) as a memory-leak hedge for a
  three.js scene that's been running for days — cheap insurance, same
  spirit as Fully Kiosk's own scheduled-reload feature.
- Gate all of this behind kiosk/view mode (never in `edit`, where an
  unexpected reload would be actively harmful to someone mid-edit) and
  behind an explicit opt-in (URL param, e.g. `?selfheal=1`, or a
  Settings-drawer checkbox persisted like other kiosk-adjacent prefs) so it
  never surprises a developer running `npm run dev`.

### 3.4 Viewport / safe-area / orientation

- `index.html`'s `<meta name="viewport">` should add `viewport-fit=cover`
  (currently just controls width/scale) — zero risk, and does nothing
  without it being set (per the documented gotcha in §2.3).
- `styles.ts` (shared CSS injected at document level, per CLAUDE.md) should
  pad the **fixed-position overlay chrome** with
  `env(safe-area-inset-*)` — concretely: the 3D view-controls bar, the
  weather chip (mounted once in `app.ts`'s shared canvas container,
  bottom-right), and the new fullscreen/kiosk-link buttons in the topbar.
  These are exactly the kind of corner-anchored fixed UI a notch, a curved
  corner, or TV overscan would clip — and Diorama already has several of
  them living at that CSS layer.
- Orientation lock: attempt `screen.orientation.lock('landscape')`
  immediately after a successful `requestFullscreen()` (both preconditions
  the spec requires — mobile + fullscreen), wrapped in try/catch since it's
  a silent no-op everywhere else (desktop, non-fullscreen, or unsupported).
  Add the `orientation: 'landscape'` field to a future Diorama manifest
  (§3.5) for the installed-PWA case, which is honored without needing
  fullscreen first on platforms that support manifest-driven orientation.

### 3.5 PWA manifest + service worker — standalone `index.html` entry ONLY

- **Do not** add a manifest/service worker story for `panel_custom` mode —
  per §2.4, that mode lives inside HA's own document and HA's frontend
  already owns the installable-PWA shell. Trying to register a second
  manifest/service worker there would be inert at best and could conflict
  with HA's own service worker scope at worst.
- **Do** add a manifest + minimal service worker for the **standalone
  `index.html` entry** (the iframe-fallback/pasted-token mode) — this is
  the genuinely new, useful case: a kiosk browser (Fully Kiosk Browser,
  Chromium `--kiosk`, or a tablet's stock browser's "Add to Home Screen")
  pointed **directly at Diorama's own URL** (bypassing HA's frontend shell
  entirely) with a saved token + a kiosk URL template
  (`?mode=kiosk&lock=1&view=...&cam=...`), installed as its own home-screen
  icon. `display: 'standalone'`, `orientation: 'landscape'`,
  `start_url` baking in the saved kiosk URL template, `theme_color`/
  `background_color` matched to the dark toon-scene default, and a
  512×512 + maskable icon (the existing favicon can be upscaled/redrawn).
- Use **`vite-plugin-pwa`** with the **`generateSW`** strategy for a
  cache-first precache of the built JS/CSS bundle (a pure app-shell cache —
  Diorama's live data is 100% over the WebSocket, not HTTP fetches, so
  there's no cache-invalidation-vs-freshness tradeoff to design around, a
  much simpler case than a typical content PWA). Only reach for
  `injectManifest` (hand-written SW) if the auto-reload watchdog in §3.3
  needs to live inside the service worker itself (e.g. a periodic-sync
  based reload trigger) rather than in-page.
- **Scope discipline**: since Diorama is deployed under a subpath (HACS's
  `/hacsfiles/diorama/...` or a `www/diorama/` local path), the service
  worker's `scope` must be pinned to that subpath, never `/` — a root-scoped
  SW risks intercepting requests that belong to HA's own frontend if ever
  served same-origin. Flag this explicitly in the vite-plugin-pwa config
  when it's built.

### 3.6 D-pad / TV remote — a scoped answer, not full spatial nav

Given the framework mismatch in §2.6 (no native focusable DOM elements
behind Diorama's canvas/three.js fixtures), recommend **against** pulling
in Norigin Spatial Navigation or the WICG polyfill as a first step — it's
real added weight and complexity (CLAUDE.md's lazy-three.js-chunk /
bundle-size discipline argues the same direction) for a navigation model
that doesn't match Diorama's spatial-canvas-plus-sidebar UI anyway (there's
no dense list/grid of menu items to tab through; the "content" is a pannable
plan and an orbitable 3D scene).

Instead, a lightweight kiosk-mode-only keyboard layer that reuses what's
already there:

- **Arrow keys** (which is *exactly* what a TV remote's D-pad already
  surfaces as, per §2.6 — no Gamepad API or special input handling needed,
  it Just Works as `keydown` events): pan the active 2D view / orbit the
  active 3D camera, reusing the same math the mouse-drag pan/orbit paths
  already call.
- **Enter/OK** (`Enter` keycode, which is what D-pad "select/center" maps
  to on Android TV/webOS/Tizen browsers): open/toggle whichever fixture is
  nearest the current view center — a much smaller lift than true focus
  management, since Diorama already has `viewCenter` as first-class state
  to hit-test against.
- **PageUp/PageDown** (commonly what Channel-Up/Down remote buttons emit
  in TV browsers): cycle through the already-shipped camera view presets
  (`applyViewPreset('iso'|'top'|'front'|'back'|'left'|'right'|'sims')`) —
  a concrete, cheap "something to press" for a couch remote, built entirely
  from existing renderer entry points.
- Treat this as the pragmatic v1; if a future feature needs a genuine
  focusable menu/grid (e.g. a camera-tile grid dashboard), that's the point
  to reconsider Norigin for *that specific surface* rather than retrofitting
  the whole app.

## 4. Setup / integration steps

Ordered checklist, cheapest/lowest-risk first:

1. **Viewport meta + safe-area CSS** (`index.html`, `styles.ts`) — add
   `viewport-fit=cover`; pad fixed overlay chrome with
   `env(safe-area-inset-*)`. Zero behavioral risk, ships immediately.
2. **Wake Lock** — add the feature-detected acquire/release + visibilitychange
   re-acquire, gated on `uiMode !== 'edit'`. Small, isolated, no dirty-key
   or dependency changes.
3. **Fullscreen button** — add to `topbar.ts` next to the kiosk-link button;
   wire `fullscreenchange` to keep the button state honest; attempt
   `screen.orientation.lock('landscape')` right after a successful
   fullscreen entry, try/catch-guarded.
4. **Self-heal watchdog** — add the connection-liveness timer + periodic
   hard-reload floor, opt-in via `?selfheal=1` or a Settings-drawer toggle,
   kiosk/view-mode only. Document the default timeout in `docs/STATUS.md`
   or the kiosk-link UI copy.
5. **Standalone-entry PWA manifest + service worker** — only for the
   `index.html` iframe-fallback entry; add `vite-plugin-pwa` with
   `generateSW`, pin `scope` to the deployed subpath, verify it does not
   register when loaded inside `panel_custom` (the panel entry has a
   different bundle — `diorama-panel.js` — so this is naturally scoped
   correctly by virtue of which entry point registers the SW).
6. **Kiosk-mode help copy** — a short in-app note (Settings drawer or a
   first-run kiosk tooltip) pointing at the *host-level* mechanisms that
   make most of the above redundant when available: Fully Kiosk Browser's
   Fullscreen Mode / Keep Screen On / Auto Reload, or the HA Companion
   apps' native kiosk settings — so users deploying via those hosts don't
   need to lean on Diorama's own fallbacks at all.
7. **D-pad keyboard layer** — arrow-key pan/orbit, Enter-to-select-nearest,
   PageUp/PageDown camera-preset cycling, gated to kiosk/view mode (avoid
   colliding with the existing edit-mode Delete/tool hotkeys).
8. **(Optional, higher effort)** Push the kiosk-link URL to a Fully Kiosk
   Browser device automatically from an HA automation via
   `fully_kiosk.load_url`, documented as a recipe rather than shipped code
   (it's pure HA-side automation, no Diorama changes required — just worth
   writing down since the kiosk-link button already produces the exact URL
   that service needs).

## 5. Potential additional features

- **Idle-timeout "screensaver" reusing what's already built**: Diorama
  already ships `Scene3D.cinematicOrbit` and `Scene3D.autoFollow` (slow
  auto-orbit / auto-framing camera). A kiosk-mode idle timer that,
  after N minutes of no interaction, switches to a "sims pose" + cinematic
  orbit — functionally Diorama's own equivalent of HA iOS's Clock/Dim/Blank
  screensaver, but showing the house instead of blanking it. Cheap because
  the camera behaviors already exist; only the idle-timer trigger is new.
- **Pause the render loop when hidden**: hook the same Page Visibility API
  (`document.visibilityState`) already needed for Wake Lock re-acquire to
  also **stop** the RAF/three.js render loop entirely while the document is
  hidden (background tab, screen off) — pure battery/CPU win, no visual
  cost since nothing is visible anyway. Natural to bundle with 3.1's
  `visibilitychange` listener since it's the same event.
- **Push the kiosk-link URL automatically** via `fully_kiosk.load_url`
  or Companion `kiosk_reload`/`kiosk_default` notify commands whenever a
  saved view/camera changes — turns the existing manual "copy this link to
  the tablet" workflow into a one-way automation.
- **Gamepad API as a second TV input path**: some set-top-box remotes
  surface as an actual `Gamepad` (via the Gamepad API) rather than
  synthesized `KeyboardEvent`s. Worth a follow-up spike if a specific piece
  of hardware in the field doesn't send arrow-key events for its D-pad —
  not needed for the Android TV/webOS/Tizen mainstream case per §2.6, which
  already arrives as keyboard events.
- **Brightness/volume tie-in**: both HA Companion kiosk modes and the Fully
  Kiosk integration expose brightness/volume as remotely-settable —
  Diorama's own scene presets (day/dusk/night `lightMode`) could optionally
  fire a `notify.mobile_app_*`/`fully_kiosk.set_config` brightness nudge
  keyed to the same day/dusk/night resolution already computed for 3D
  lighting, so the physical screen dims in sync with the virtual scene.
  Speculative/stretch — flag as such.

## 6. Open questions & risks

- **The D-pad answer here is deliberately partial.** True spatial
  navigation (tab between individually-focusable fixtures) is blocked on
  Diorama's canvas/three.js hit-testing model having no native focusable
  DOM nodes to navigate between. The arrow-pan + Enter-to-select-nearest +
  channel-cycle scheme in §3.6 is a pragmatic stand-in, not feature parity
  with a real remote-friendly UI — don't oversell it as "TV support" in
  user-facing copy without this caveat.
  - Norigin Spatial Navigation was still the only production-proven library
    found; if a future feature genuinely needs list/grid navigation (a
    camera-tile grid, a settings menu), it's the one to reach for *for that
    surface specifically* rather than the whole app.
- **Fullscreen cannot be silently automatic on unmanaged hardware.** Only
  Chrome-Enterprise-managed installs can skip the tap-to-fullscreen step
  via `AutomaticFullscreenAllowedForUrls`. Every other deployment (which is
  most of them — a bare Android tablet, Fully Kiosk Browser's WebView, an
  unmanaged Raspberry Pi) needs either a one-time human tap on Diorama's
  own fullscreen button, or to lean on the *host's* fullscreen mechanism
  (Fully Kiosk setting, `--kiosk` flag) instead of the web API. This is a
  real, permanent piece of friction, not a solvable bug.
- **Manifest/service worker scope risk.** A service worker for the
  standalone entry must be scoped to Diorama's own deployed subpath. If a
  future deploy topology ever serves Diorama same-origin at the HA root
  (unlikely given HACS/`www/` conventions, but worth a guard), a
  root-scoped SW could intercept requests meant for HA's own frontend.
  Treat the `scope` config as load-bearing, not a default to accept
  blindly.
- **`fully_kiosk` integration requires a paid license + a LAN-exposed
  Remote Admin password.** Any documentation Diorama ships recommending
  this path should say so plainly — it's a real cost/security tradeoff,
  not a free lunch, and the Remote Admin password sits on the local network
  without additional hardening from HA's side.
- **Wake Lock's "release on hidden" behavior is correct but easy to
  mis-model.** It's tied to *document* visibility, not any in-page overlay
  — confirmed not a risk for a future Diorama screensaver overlay (§5), but
  worth stating explicitly since it's the kind of detail that's easy to
  get backwards when implementing.
- **No verification was possible against a live Fully Kiosk Browser device
  or a real TV browser** (Tizen/webOS Chromium build) in this research
  pass — the `KeyboardEvent`-arrow-key claim is corroborated by two
  independent sources (Android's own dev docs + Norigin's production
  write-up) but wasn't hands-on tested against Diorama's actual keydown
  handlers. Recommend a real device smoke-test before considering §3.6
  "shipped."
- **iOS Companion app and Fully Kiosk Browser auto-reload timers are not
  configurable by Diorama** — they're host-app settings independent of
  anything in this repo. Diorama's own `?selfheal=1` watchdog (§3.3) is
  additive/redundant with them by design, not a replacement — document
  that clearly so a user doesn't think they need to configure it twice.

## 7. Sources

- [MDN — Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [MDN — Navigator.wakeLock](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/wakeLock)
- [MDN — WakeLockSentinel](https://developer.mozilla.org/en-US/docs/Web/API/WakeLockSentinel)
- [web.dev — The Screen Wake Lock API is now supported in all browsers](https://web.dev/blog/screen-wake-lock-supported-in-all-browsers)
- [NoSleep.js (GitHub)](https://github.com/richtr/NoSleep.js/)
- [MDN — Element.requestFullscreen()](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)
- [MDN — Fullscreen API guide](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide)
- [ChromeOS.dev — Using the Fullscreen API without gestures](https://chromeos.dev/en/posts/using-the-fullscreen-api-without-gestures)
- [MDN — meta viewport](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)
- [CSS-Tricks — "The Notch" and CSS](https://css-tricks.com/the-notch-and-css/)
- [Chrome for Developers — edge-to-edge migration guide](https://developer.chrome.com/docs/css-ui/edge-to-edge)
- [MDN — ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock)
- [web.dev — Web app manifest](https://web.dev/learn/pwa/web-app-manifest)
- [vite-plugin-pwa docs](https://vite-pwa-org.netlify.app/)
- [Raspberry Pi Foundation — How to use a Raspberry Pi in kiosk mode](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/)
- [Home Assistant Companion Docs — iOS Kiosk Mode](https://companion.home-assistant.io/docs/integrations/ios-kiosk-mode/)
- [Home Assistant Companion Docs — Android WebView](https://companion.home-assistant.io/docs/integrations/android-webview/)
- [Home Assistant — Fully Kiosk Browser integration](https://www.home-assistant.io/integrations/fully_kiosk/)
- [Home Assistant — fully_kiosk.set_config action](https://www.home-assistant.io/actions/fully_kiosk.set_config/)
- [Fully Kiosk Browser & Lockdown (official site)](https://www.fully-kiosk.com/en/)
- [WICG — CSS Spatial Navigation draft/explainer](https://wicg.github.io/spatial-navigation/)
- [Norigin Spatial Navigation (GitHub)](https://github.com/NoriginMedia/norigin-spatial-navigation)
- [Norigin Media — Smart TV Navigation with React](https://medium.com/norigintech/smart-tv-navigation-with-react-86bd5f3037b7)
- [Android Developers — TV navigation](https://developer.android.com/training/tv/get-started/navigation)
