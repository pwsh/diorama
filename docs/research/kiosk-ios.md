# Kiosk on iOS (iPad / iPhone) — build-ready research

Diorama is served by Home Assistant as a `panel_custom` panel, an iframe, or
standalone `index.html` — on a device it is always just a URL loaded in a
browser/webview (`ha-panel-adapter.ts` / `HassClient`, see CLAUDE.md). This doc
covers making that URL behave like a locked-down wall display on iPadOS/iOS:
install/standalone mode, device lockdown, wake control, safe-area/viewport
handling, and the WebGL ceiling Diorama's Sims-toon three.js view runs into.

## 1. Summary

iOS has **no first-party "kiosk browser"** with the reach of Fully Kiosk
Browser on Android — Fully Kiosk is Android-only. On iOS, a fixed Diorama wall
panel is built from **three independent layers that compose**, not one
feature:

1. **Get Diorama chrome-free and installed as an app icon** — `<meta
   name="apple-mobile-web-app-capable">` + a Web App Manifest turns "Add to
   Home Screen" into a standalone, no-Safari-chrome launch, with its own
   storage lifetime separate from Safari tabs.
2. **Lock the device to that one app** — either the free, built-in
   **Guided Access** accessibility feature (single device, manual arm) or an
   MDM **Single App Mode** (multi-device, remote-managed) or a **third-party
   iOS kiosk browser app** (Kiosker, Kiosk Pro, ProSurf, WebFrame Kiosk — none
   of these are Fully Kiosk, but they fill its role) — or, for users already
   running the **Home Assistant iOS Companion app**, its built-in **Kiosk
   mode** (Settings → Kiosk mode), which is the most Diorama-relevant option
   because it can hide HA's own sidebar/top-bar chrome around the panel.
3. **Keep the screen awake and handle the notch/home-indicator/no-rotation-
   API realities of WebKit** — `Screen Wake Lock API` (iOS 16.4+), `viewport-
   fit=cover` + `env(safe-area-inset-*)`, and the fact that iOS has **no
   working orientation-lock API for web content** at all.

Underneath all of that, Diorama's Sims-toon three.js scene has to survive
iPad Safari's WebGL quirks: a real risk of `webglcontextlost` on backgrounding
(a WebKit bug, partially fixed but not eliminated), a whole-page memory
ceiling of roughly 2–3 GB that **includes GPU/texture memory**, and a
recommendation to cap `devicePixelRatio` at 2 — which Diorama's renderer
**already does** (CLAUDE.md: "DPR cap of 2 in the 3D renderer"), so that part
needs no new work, only awareness when adding new textures/effects.

This matters for Diorama specifically because it already ships the pieces a
kiosk needs — `Planner.uiMode` (`edit`/`kiosk`/`view`), the `?mode=kiosk&lock=1
&view3d=…&cam=…&layers=…` URL template system, and a "Kiosk link" button that
mints one — but none of that addresses the **iOS host** (Safari chrome,
sleep, notch, orientation, WebGL memory). This doc is the missing half.

## 2. Platform / data model / real-world facts

### 2.1 Add to Home Screen / standalone mode

- No native "install" prompt exists on iOS the way Chrome/Android has
  `beforeinstallprompt`. The only path is manual: **Share sheet → "Add to
  Home Screen"** ([MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)).
- Required meta tag to get chrome-free launch:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes">
  ```
  This is Apple's own legacy tag, not equivalent to the Manifest's
  `"display": "standalone"` alone — iOS Safari needs both the tag **and**
  (historically) ignored the manifest's `display` field for chrome removal.
  Splash-screen (`apple-touch-startup-image`) still **requires the presence of
  `apple-mobile-web-app-capable`** even though there's a standalone manifest
  alternative ([firt.dev iOS PWA compatibility notes](https://firt.dev/notes/pwa-ios/)).
- Status bar styling: `apple-mobile-web-app-status-bar-style` is Apple-only
  and has been **discouraged since iOS 15** in favor of the standard
  `theme-color` meta tag — but a translucent fullscreen status bar is
  "still the only way" to get that specific effect (firt.dev).
- **iOS 26 changed the default**: every site added to the Home Screen now
  defaults to opening as a standalone web app (no more "just a bookmark"
  fallback) — a 2026 platform shift worth knowing about, per
  [MagicBell's 2026 PWA/iOS guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide).
- **EU/DMA history (resolved, not a current risk)**: Apple planned to strip
  standalone Home-Screen web-app support in the EU under the Digital Markets
  Act for iOS 17.4, but **reversed the decision before shipping** (announced
  March 1, 2024) — EU users kept full standalone PWA support, still on
  WebKit ([9to5Mac](https://9to5mac.com/2024/03/01/apple-home-screen-web-apps-ios-17-eu/),
  [The Register](https://www.theregister.com/2024/03/02/apple_reverses_pwa_decision/),
  [Apple Developer: DMA support page](https://developer.apple.com/support/dma-and-apps-in-the-eu/)).
  Some older blog posts still describe the *planned* removal as if it
  shipped — it did not.
- **Storage lifetime — the reason installing matters, not just cosmetics**:
  Safari's Intelligent Tracking Prevention clears script-writable storage
  (localStorage, IndexedDB, Service Worker registrations) after **7 days**
  of no user interaction with the *site* (shipped iOS 13.4 / Safari 13.1).
  A **Home Screen web app runs its own separated process with its own
  "days of use" counter, entirely separate from Safari's**, so as long as the
  installed app itself gets opened, its storage survives indefinitely — but
  a Safari *tab* to the same URL does not get that exemption
  ([iTnews](https://www.itnews.com.au/news/apple-cops-flak-for-deleting-local-browser-storage-after-7-days-539833),
  [Search Engine Land explainer](https://searchengineland.com/what-safaris-7-day-cap-on-script-writeable-storage-means-for-pwa-developers-332519)).
  **Direct relevance to Diorama**: the panel caches its store in
  `localStorage['diorama:store:v1']` as an instant-paint cache before HA
  reconciliation (CLAUDE.md "HA = source of truth"). On a kiosk that's opened
  as a plain Safari bookmark and only ever auto-reloaded via JS (never truly
  "used" as its own app), this cache is not at meaningful risk from the
  7-day rule if HA's `frontend.user_data` remains the source of truth anyway
  — but an **installed Home Screen icon is strictly safer** for this cache
  and is the right recommendation regardless.
- Orientation: the Web App Manifest `"orientation"` key is **unsupported on
  iOS** across all documented versions (firt.dev), and the JS Screen
  Orientation API's `lock()` method is likewise not functional in iOS
  Safari — there is **no working programmatic orientation lock for web
  content on iOS**, full stop. The only real locks are physical (Control
  Center rotation-lock icon) or via Guided Access's "Motion" restriction
  (§2.2).

### 2.2 Guided Access (built-in, free, single-device)

Verified from [Apple Support: Use Guided Access](https://support.apple.com/en-us/111795):

- **Enable**: Settings → Accessibility → Guided Access → On. Set a Guided
  Access passcode (separate from device passcode) under Passcode Settings;
  optionally enable Face ID/Touch ID as an alternate exit method.
- **Arm a session**: open the target app (Safari, or the installed Home
  Screen web-app icon), then **triple-click the side button** (iPhone X+ /
  modern iPad) or **Home button** (older devices). Tap **Options** (bottom
  left) before starting to configure the session:
  - **Touch** — off ignores *all* screen touches (not useful for an
    interactive Diorama panel); can otherwise **circle specific screen
    regions to exclude from touch** (e.g. draw a mask over the status bar or
    a corner if something dismisses the kiosk).
  - **Motion** — disables accelerometer-driven auto-rotate entirely; this
    **is** the practical "orientation lock" on iOS for web content, since no
    JS/CSS API does it.
  - **Software Keyboards** — suppress the on-screen keyboard if nothing in
    the panel needs text entry.
  - **Time Limits** — optional session countdown with sound/speech warning;
    leave off for an always-on wall panel.
  - **Accessibility Shortcut** toggle — whether triple-click surfaces the
    Accessibility Shortcut menu (leave OFF on a public kiosk so a stray
    triple-click doesn't offer an escape hatch alongside the exit gesture).
- **Exit**: triple-click the same button → enter the Guided Access passcode
  → **End** (top left).
- Guided Access is **single-device and manual** — no remote start/stop, no
  fleet management. For >1 tablet, use MDM Single App Mode instead
  ([SimpleMDM: iOS Single App Mode](https://simplemdm.com/blog/how-to-use-ios-single-app-mode/),
  [NinjaOne: What is Single App Mode](https://www.ninjaone.com/blog/what-single-app-mode-is-and-when-to-use-it-on-ios-devices/)).
  Single App Mode additionally survives **reboot** (device reopens straight
  into the pinned app), which Guided Access does not guarantee across a full
  power cycle without the user re-arming it.

### 2.3 Home Assistant iOS Companion App — Kiosk mode

Verified from [companion.home-assistant.io/docs/integrations/ios-kiosk-mode](https://companion.home-assistant.io/docs/integrations/ios-kiosk-mode/)
and [GitHub Discussion #2403](https://github.com/orgs/home-assistant/discussions/2403).
This is the most Diorama-relevant lockdown path because it runs the panel
inside the Companion app's own `WKWebView`, giving it native hooks a plain
Safari tab doesn't have.

- **Setup**: Home Assistant app → **Settings → Kiosk mode** → enable →
  pick server + dashboard (or "use server's default dashboard").
- ⚠️ **Version-requirement caveat**: the live docs page's stated minimum
  version literally reads **"An iPhone or iPad running 2026.7.0+ version of
  iOS or iPadOS"** — verified verbatim twice via direct fetch. That string
  format (`2026.7.0`) matches Home Assistant's own **date-based app/core
  versioning** (`YYYY.M.P`), not Apple's iOS numbering (iOS is never
  versioned that way) — this reads like a documentation templating bug
  (likely a `{{ current_version }}`-style variable resolving to the *docs
  site's* build date/version rather than the intended "iOS 15+" or similar).
  **Do not treat "2026.7.0" as a real iOS version number.** Verify the actual
  minimum in-app (Settings → Kiosk mode will simply not appear/enable on an
  unsupported OS) before relying on a number here. A separate GitHub
  discussion thread claims iOS 15+ as the baseline for the underlying
  `WKWebView`/companion-app capabilities, which is directionally more
  plausible but likewise not independently confirmed against the shipped
  docs — treat as an estimate.
- **Requires HA frontend 2025.2.0+** for the "hide sidebar and dashboard
  controls" feature specifically (older frontends can still be shown in
  kiosk mode, just with HA's chrome visible).
- **Display features**: choose server + dashboard; hide HA sidebar + top-bar
  controls; hide the iOS status bar (requires true fullscreen — **does not
  work in iPad Split View/Slide Over**, a documented limitation); three
  screensaver modes (Clock w/ style/date/seconds options, Dim, Blank) after
  a configurable 30 s–1 h idle timeout; scheduled auto-reload (1 min–1 h).
- **Screen stays on via `isIdleTimerDisabled`**, Apple's native
  `UIApplication` API — this is **only available to the Companion app's own
  native shell wrapping its WKWebView**, not to arbitrary web content (i.e.
  not something Diorama's own JS can call when loaded in plain Safari — see
  §2.4 for the web-standard equivalent). This is the single biggest reason
  to prefer the Companion app's Kiosk mode over bare Safari for a Diorama
  wall panel: it sidesteps needing Guided Access *and* the Wake Lock API
  entirely.
- **Remote control via notification payload** — send a push notification
  with one of these exact command strings to drive a kiosk device live
  (verified verbatim from the docs page):
  `kiosk_show_screensaver`, `kiosk_hide_screensaver`, `kiosk_show_camera` /
  `kiosk_hide_camera` (needs an `entity_id`), `kiosk_set_brightness` (0–100),
  `kiosk_set_volume` (0–100), `kiosk_reload`, `kiosk_default`. Commands only
  apply while the app is foregrounded and "Accept kiosk remote commands" is
  enabled.
- **Dashboard targeting**: the feature exposes a "Kiosk Mode URL (`?kiosk`
  parameter)" setting per the GitHub discussion — i.e. it's fundamentally
  "load this URL, strip chrome," the same shape as any other kiosk browser.
  Whether the dashboard picker can target an arbitrary `panel_custom` path
  (e.g. a URL like `.../diorama?mode=kiosk&lock=1&…`) the way it targets a
  Lovelace dashboard **is not documented one way or the other** — since
  `panel_custom` panels are ordinary HA frontend routes, there is no
  structural reason a raw URL wouldn't work the same as a dashboard URL, but
  this needs hands-on verification (see Open Questions).
- Camera-alert popups (`kiosk_show_camera`) integrate with HA's native
  camera entities directly at the OS level — orthogonal to (and won't
  conflict with) Diorama's own in-panel camera-alert popups (CLAUDE.md
  "Camera alert popups (batch J)").

### 2.4 Screen Wake Lock API (for plain-Safari / non-Companion-app deploys)

Verified from [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API):

```js
let wakeLock = null;
async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { /* lock was released */ });
  } catch (err) {
    // rejected: low battery, power-save mode, or other platform policy
  }
}
// Locks are auto-released when the document becomes hidden/inactive —
// re-acquire on visibility change:
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});
```

- **Requires a secure context (HTTPS)** — same requirement HA panels
  already satisfy in essentially every real deployment.
- **Feature-detect** with `'wakeLock' in navigator`; **always wrap the
  request in try/catch** — it can be refused for battery/power-save/policy
  reasons at any time.
- **iOS Safari support**: from **iOS/iPadOS 16.4** (Safari 16.4), per
  [caniuse: Screen Wake Lock API](https://caniuse.com/wake-lock) and
  corroborating sources — Apple forces every iOS browser engine to WebKit,
  so this applies uniformly across Safari/Chrome/Firefox-on-iOS.
- **Known bug, now fixed**: a WebKit bug ([bugs.webkit.org #254545](https://bugs.webkit.org/show_bug.cgi?id=254545))
  broke the Wake Lock API specifically **inside installed Home-Screen web
  apps** (as opposed to Safari tabs) until Apple's fix landed in **iOS
  18.4**. On anything before 18.4, an installed Diorama PWA calling
  `navigator.wakeLock.request()` could silently fail to keep the screen on
  even though the same call worked fine in a Safari tab — worth a defensive
  fallback (fall back to reminding the user to disable Auto-Lock in Settings,
  or to use Guided Access, which has its own auto-lock override) if
  targeting pre-18.4 devices.
- The Wake Lock API has **no relationship** to `isIdleTimerDisabled` (§2.3)
  — it's the correct (only) web-standard mechanism when Diorama is *not*
  wrapped in the Companion app's native shell.

### 2.5 Fully Kiosk Browser and iOS alternatives

- **Fully Kiosk Browser does not exist for iOS/iPadOS — it is Android-only.**
  This is unambiguous across every source checked (support forums,
  comparison sites, the HA community itself). Do not scope any "Fully Kiosk
  parity on iPad" work; it isn't a porting gap, it's a different platform.
- Real iOS kiosk-browser alternatives that fill a similar role (single URL,
  fullscreen, JS/CSS injection, idle screensaver, no-Guided-Access lockdown):
  - **[Kiosker](https://www.kiosker.io/)** — idle-timer reload/screensaver
    (with weekly scheduling + touch/light/motion dismissal triggers), custom
    JS/CSS injection with a built-in editor, a "Single App Mode" (locks the
    device to Kiosker itself without needing Guided Access), subscription +
    a one-time-purchase "Pro" tier. No explicit Wake Lock/keep-awake feature
    was documented on its marketing page — check `docs.kiosker.io` before
    relying on it for that specifically.
  - **Kiosk Pro** (Kiosk Pro Lite / Basic / Plus) — the oldest iOS kiosk app
    lineage (since first-gen iPad, 2010); runs on iOS 9.3.5+.
  - **ProSurf** — an add-on to the Scalefusion UEM/MDM product; locks an
    iPad/iPhone to specific websites full-screen, oriented at enterprise
    fleets rather than a single home tablet.
  - **WebFrame Kiosk** — single-purpose full-screen web app/page/media
    kiosk for iOS/iPadOS.
  - 42Gears' **SureLock**/**SureFox** kiosk products are **Android-first**;
    treat any iOS claims for them with the same skepticism as Fully Kiosk.

### 2.6 `viewport-fit=cover` + safe-area insets

Verified from [WebKit: Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
and [MDN: `env()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env):

```html
<meta name="viewport" content="initial-scale=1, viewport-fit=cover">
```
```css
body {
  padding-left:   env(safe-area-inset-left);
  padding-right:  env(safe-area-inset-right);
  padding-top:    env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
/* combine a minimum gutter with the device inset: */
@supports (padding: max(0px)) {
  .bar { padding-left: max(12px, env(safe-area-inset-left)); }
}
```

- Default `viewport-fit` is `auto` (Safari auto-insets, content can't reach
  the notch/corners/home-indicator strip). `cover` draws edge-to-edge and
  hands inset responsibility to the four `safe-area-inset-*` `env()`
  variables, which only have non-zero values **when `viewport-fit=cover` is
  set** — test both the Safari-tab and installed-icon cases, since some
  historical reports describe inconsistent behavior between the two.
- The old `constant()` function is **gone** — Safari replaced it with
  `env()` starting Safari Technology Preview 41 / iOS 11.2 beta. No modern
  target needs the old name.
- These insets matter for Diorama's own overlay chrome — the weather chip
  (bottom-right), the 3D view-controls bar, and the bottom-left "⟳ Reset
  view" button all currently position via plain CSS; on a notched/Dynamic-
  Island iPhone or an iPad with the home-indicator strip, any of those could
  sit under an unsafe zone in true fullscreen/PWA mode.

### 2.7 Rubber-band scroll, text-select, long-press callout

- **Rubber-band/elastic overscroll**: CSS `overscroll-behavior` (e.g.
  `overscroll-behavior-y: none` on `html`/`body`) is supported in Safari
  **from version 16** (iOS 16+), confirmed via
  [caniuse: CSS overscroll-behavior](https://caniuse.com/css-overscroll-behavior).
  Pre-16 devices need the older JS `touchmove`-`preventDefault` pattern
  (e.g. the [iNoBounce](https://github.com/lazd/iNoBounce) gist/library),
  which is fragile against legitimately-scrollable inner regions. **Diorama
  likely doesn't need this for its canvases** — CLAUDE.md documents both
  canvases already stop touch propagation and set `touchAction: 'none'` — but
  the surrounding page body / any native-scroll sidebar overlay content is
  still subject to bounce unless it also gets `overscroll-behavior: contain`
  or `none`.
- **Long-press callout / text selection**:
  ```css
  html {
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  ```
  `-webkit-touch-callout: none` suppresses the "copy/lookup/share" popup on
  touch-and-hold; `-webkit-user-select: none` blocks text selection/
  highlighting. **Reliability caveat**: developer forum reports as recent as
  iOS 26.1 note `-webkit-touch-callout: none` sometimes **not fully
  suppressing** the callout in current Safari — treat this CSS as
  best-effort, not a guarantee, and re-test per iOS version bump
  ([Apple Developer Forums thread #808606](https://developer.apple.com/forums/thread/808606)).

### 2.8 WebGL / three.js on iPad Safari

- **Context loss on backgrounding** is a real, historically-widespread
  WebKit bug affecting Three.js/Babylon/Pixi/Unity-WebGL apps alike: moving
  Safari to background and returning (or the device auto-locking) can throw
  `"WebGL: context lost."` — reported across iOS 16.7–17.2+ on both iPad and
  iPhone. Apple shipped a partial fix in **Safari 17.1.x** ("Fixed an issue
  which would cause unnecessary 'WebGL: context lost.' errors after Safari
  has been moved to the background on iPadOS"), but developers reported the
  issue persisting on iPhone after that fix and in later betas — **do not
  treat this as fully resolved on all iOS versions**
  ([Apple Developer Forums #737042](https://developer.apple.com/forums/thread/737042),
  [WebKit bug #261331](https://bugs.webkit.org/show_bug.cgi?id=261331),
  [WebKit bug #262628](https://bugs.webkit.org/show_bug.cgi?id=262628)).
  Mitigation: always attach both
  ```js
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); /* pause RAF */ });
  canvas.addEventListener('webglcontextrestored', () => { /* rebuild scene */ });
  ```
  Three.js's `WebGLRenderer` does not auto-recover scene content on its own
  — geometry/material/texture GPU resources are gone and must be rebuilt
  from CPU-side state, which maps naturally onto Diorama's existing
  dirty-key rebuild model (§3).
- **Whole-page memory ceiling**: commonly cited at roughly **2–3 GB
  depending on device model**, and this budget **covers all page memory,
  not just a WebGL-specific pool** — GPU/texture memory, JS heap, DOM, etc.
  all share it; exceeding it gets Safari to silently terminate/reload the
  page. One concrete anecdote: an iPad Air 3 (iOS 14.2) reproducibly grew
  page memory on every WebGL canvas *resize* and was killed at ~1.25 GB
  ([Apple Developer Forums #668999](https://developer.apple.com/forums/thread/668999)).
  Avoid churny canvas resizes — Diorama's canvases should size once per
  layout change, not per frame.
- **Concurrent WebGL context limit**: commonly cited around **16 contexts**
  on iOS Safari/WebKit before the browser starts evicting/crashing —
  this specific number came from secondary aggregation rather than an
  Apple/WebKit primary source in this research pass, so treat it as rough
  guidance, not a hard spec. Practical takeaway for Diorama: never create a
  second `WebGLRenderer`/canvas without disposing the first (the existing
  `_clearGroup`/`destroy()` discipline in CLAUDE.md's "Sims-style rendering"
  section is exactly the right shape — keep it, and make sure a Companion-
  app `kiosk_reload` or a scheduled dashboard auto-reload triggers a real
  page navigation rather than an in-place canvas re-init that could leak a
  context).
- **DPR cap**: community consensus (three.js discourse, GitHub issues) is
  `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` — retina
  iPads reporting 2x–3x device pixel ratio cost up to 9x the fill-rate at
  3x for no perceptible visual gain. **Diorama already does this**
  (CLAUDE.md: "DPR cap of 2 in the 3D renderer to keep iPad/tablet frame
  rates sane") — no action needed, just don't regress it when touching the
  renderer.
- Broader mobile-perf notes worth keeping in mind for any *new* 3D
  additions (not just iOS): keep draw calls modest, avoid adding new large
  procedural textures without checking `_texCache`/`_groundTexCache`-style
  reuse, and remember mobile GPUs thermally throttle under sustained load —
  a scene fine at boot can visibly slow after 30+ minutes of an always-on
  kiosk display.

## 3. Diorama design / integration

Concrete mapping onto what's already shipped (per CLAUDE.md):

- **`Planner.uiMode` + URL template is the right foundation, unchanged.**
  A wall iPad should load
  `…/diorama?mode=kiosk&lock=1&floor=<id>&view3d=<name>&layers=simple&cam=x,y,z,tx,ty,tz`
  exactly as designed — `lock=1` hides the mode switcher, `kiosk` mode
  already disables edit affordances (sidebar/floor buttons/settings/save-view
  render only in `edit`), and the "Kiosk link" topbar button already mints
  this URL from `Planner.lastCam3d`. **Nothing here is iOS-specific** — the
  work is entirely in the *host* (browser chrome, sleep, lockdown), which is
  what the rest of this doc is for.
- **HA-Companion-app Kiosk mode is the best default recommendation** for
  users who already run the Companion app, specifically because:
  - It solves screen-wake via native `isIdleTimerDisabled` — Diorama needs
    **no Wake Lock API code path** for this deployment target.
  - Its "hide sidebar and dashboard controls" feature removes HA's *own*
    chrome (the left nav + top app bar that a `panel_custom` panel still
    renders inside of under native mode, per CLAUDE.md's panel_custom
    snippet) — which Diorama's `?mode=kiosk` URL param cannot reach on its
    own, since that param only controls *Diorama's* internal UI, not HA
    frontend chrome around it.
  - Its remote `kiosk_*` notification commands (brightness/volume/
    screensaver/reload/camera popup) compose with — and are a superset at
    the *device* level of — Diorama's own layer/camera state, which lives
    entirely in the URL template instead.
  - **Recommendation**: document in Diorama's own kiosk-setup guidance that
    the Companion-app path is "point Kiosk mode's URL at your full Diorama
    kiosk URL (with `?mode=kiosk&lock=1&…`), not at a Lovelace dashboard" —
    but flag this as needing hands-on confirmation the picker accepts an
    arbitrary path (§2.3, Open Questions).
- **For a bare-Safari / no-Companion-app deploy** (e.g. `panel_iframe` mode
  with a long-lived token, or a browser-only wall tablet), Diorama's own
  code should own wake-lock and safe-area handling since nothing native
  will:
  - Add a small wake-lock helper (feature-detected, re-acquired on
    `visibilitychange`) gated behind `Planner.uiMode !== 'edit'` — i.e. only
    hold the screen awake in kiosk/view modes, never during normal editing
    on someone's laptop. This is a good fit for `app.ts`'s existing
    mount-once pattern (same idiom as the weather-chip singleton mount).
  - Add `viewport-fit=cover` to the existing viewport meta tag in
    `index.html`, and thread `env(safe-area-inset-*)` into the fixed-position
    overlay chrome that already exists: the weather chip
    (`<diorama-weather-chip>`), the 3D view-controls bar, and the bottom-left
    "Reset view" button — all currently plain-CSS-positioned per CLAUDE.md
    and all candidates for sitting under a notch/Dynamic-Island/home-
    indicator strip in true edge-to-edge fullscreen.
  - Add the `-webkit-touch-callout: none` / `-webkit-user-select: none` /
    `overscroll-behavior: none` triad at the document level for kiosk/view
    modes specifically (editing on desktop still wants normal text
    selection in sidebar inputs) — scope these rules so they don't leak into
    edit-mode form fields.
- **Add-to-Home-Screen manifest** — Diorama's `index.html` entry (the
  standalone/iframe entry point, per the Layout section of CLAUDE.md) is the
  natural target for a small `manifest.json` + `apple-mobile-web-app-capable`
  meta tag, giving the "install as its own app icon" path for
  `panel_iframe`/standalone deploys (native `panel_custom` mode is already
  hosted inside the HA frontend's own PWA/manifest, so this addition is
  specifically for the iframe/standalone entry, not `diorama-panel.js`).
- **WebGL context-loss resilience** maps directly onto Diorama's existing
  dirty-key architecture (CLAUDE.md "3D dirty-key rebuilds"): a
  `webglcontextlost`/`webglcontextrestored` pair in `three-view.ts` can pause
  the RAF loop on loss and, on restore, simply **force every `_key*` dirty
  key to its "never seen" sentinel** so the very next tick rebuilds floor,
  sensors, motion, lights, zones, halos, ground, model3d, weather, and
  targets exactly as if this were the first frame — no new rebuild logic
  needed, just an invalidation hook into machinery that already exists.
- **Auto-reload interaction**: whether the reload trigger is the Companion
  app's `kiosk_reload` command or its scheduled auto-reload, or a
  third-party kiosk browser's own idle-reload, Diorama should treat this as
  a **full page navigation** (which it will be, by construction, since none
  of these reload mechanisms are SPA-internal) — meaning the existing
  `destroy()`/shared-texture-disposal discipline doesn't even need to run;
  the whole WebView context is torn down and rebuilt fresh. This sidesteps
  the ~16-context accumulation risk (§2.8) entirely, *provided* the reload
  really is a navigation and not, e.g., a Companion-app in-place WebView
  reload that keeps the WKWebView's WebGL context alive across an app-level
  "reload" button — worth a quick empirical check (Open Questions).

## 4. Setup / integration steps

**For a user setting up an iPad/iPhone wall panel today (no new Diorama
code required):**

1. Decide the connection mode: native `panel_custom` (preferred, no token)
   vs `panel_iframe` (long-lived token). See CLAUDE.md's Deploy section.
2. In Diorama's topbar, use **"Kiosk link"** to mint the
   `?mode=kiosk&lock=1&floor=…&view3d=…&layers=…&cam=…` URL for the desired
   floor/camera/layer preset.
3. **If using the HA iOS Companion app**: Settings → Kiosk mode → enable →
   point it at that URL (or the appropriate dashboard, if arbitrary panel
   URLs aren't accepted by the picker — verify first) → configure hide-
   sidebar, hide-status-bar, screensaver, auto-reload as desired.
4. **If using bare Safari** (no Companion app): Add to Home Screen from the
   kiosk URL (requires the manifest/meta-tag work in §3 to be chrome-free)
   → open the installed icon → enable Guided Access (Settings →
   Accessibility → Guided Access → On, set a passcode) → open the icon →
   triple-click the side/Home button → Options → disable Motion (locks
   orientation) and Accessibility Shortcut → Start.
5. **If using a third-party iOS kiosk app** (Kiosker, Kiosk Pro, ProSurf,
   WebFrame Kiosk): point it at the same kiosk URL; configure its own
   idle-reload/screensaver/JS-CSS-injection features as an alternative to
   (or on top of) Diorama's own URL-templated state.
6. In Settings → Display & Brightness → Auto-Lock, set to Never **if** not
   relying on Guided Access or the Companion app's `isIdleTimerDisabled` to
   keep the screen on — otherwise leave device Auto-Lock alone and let the
   chosen kiosk layer manage wake state.
7. Physically lock screen rotation via Control Center if the panel is meant
   to stay in one orientation and Guided Access's Motion restriction isn't
   in play.

**For the Diorama codebase (future work, not yet built):**

1. Add `viewport-fit=cover` to `index.html`'s viewport meta tag; thread
   `env(safe-area-inset-*)` into the weather chip / 3D view-controls bar /
   reset-view button positioning.
2. Add a minimal Web App Manifest + `apple-mobile-web-app-capable` meta tag
   to the standalone/iframe `index.html` entry point.
3. Add a feature-detected Wake Lock helper, gated to non-`edit` `uiMode`,
   re-acquiring on `visibilitychange`, mounted once alongside the weather
   chip singleton.
4. Add `webglcontextlost`/`webglcontextrestored` handling in `three-view.ts`
   that pauses `_tickOnce`'s RAF on loss and resets every dirty key to force
   a full rebuild on restore.
5. Scope `-webkit-touch-callout`/`-webkit-user-select`/`overscroll-behavior`
   resets to kiosk/view `uiMode`, not edit mode.
6. Document the above as a "Kiosk on iOS" section in the project's
   deploy/setup docs, including the Companion-app-vs-Safari-vs-third-party
   decision tree from §3.

## 5. Potential additional features

- **A Diorama-native "kiosk companion" mini-service worker** that
  periodically pings/reloads itself on a schedule (mirroring the Companion
  app's scheduled auto-reload) for deployments with no Companion app and no
  third-party kiosk browser — pure web-standard fallback.
- **Screensaver parity**: Diorama could ship its own dim/blank/clock
  overlay (a light-DOM component, same mounting idiom as the weather chip)
  driven by an idle timer, so a bare-Safari/PWA deployment gets feature
  parity with the Companion app's screensaver modes without depending on
  it — useful for `panel_iframe` deployments on non-HA-Companion devices.
- **Brightness/volume control from the panel itself** isn't reachable from
  web content on iOS at all (no web API exposes device brightness/volume) —
  this is a hard platform wall; only the Companion app's native
  `kiosk_set_brightness`/`kiosk_set_volume` (or MDM) can do it. Worth noting
  explicitly so nobody spends time looking for a JS API that doesn't exist.
- **Detect kiosk/PWA context automatically** via
  `window.navigator.standalone` (deprecated but still present) or the
  standard `matchMedia('(display-mode: standalone)')`, and auto-suggest
  entering `?mode=kiosk` when Diorama detects it's running installed —
  reduces manual URL-templating for less technical users.
- **Guided-Access-aware UI**: since Guided Access's "circle to exclude
  touch regions" workaround exists for dismissing accidental taps near
  edges, Diorama could publish suggested exclusion-zone coordinates (e.g.
  "circle the very top status-bar strip") in setup docs rather than leaving
  users to discover it.

## 6. Open questions & risks

- **Unverified**: does the HA Companion app's Kiosk-mode dashboard picker
  accept an arbitrary `panel_custom` URL (with Diorama's own `?mode=kiosk&…`
  query string preserved), or only a Lovelace dashboard path? This is the
  single most load-bearing unknown for the recommended setup in §3/§4 and
  needs a hands-on test against a real Companion app build.
- **Unverified / likely doc bug**: the Companion Kiosk-mode docs page's
  literal minimum-iOS-version string ("2026.7.0+") does not match any real
  Apple iOS version scheme and should not be published downstream without
  independent confirmation of the real minimum (candidate: iOS 15+, per a
  separate community discussion, itself unconfirmed against the shipped
  feature).
- **Partially unresolved WebKit bug**: `webglcontextlost` on
  background/foreground cycling was only *partially* fixed (Safari 17.1.x)
  and reportedly still reproduces on iPhone in later point releases —
  Diorama's mitigation (§3) reduces the *damage* (fast, cheap full rebuild)
  but cannot prevent the underlying WebKit bug from firing.
- **Whole-page 2–3 GB memory ceiling is approximate** and device-dependent
  (older/cheaper iPads will sit at the low end); Diorama has no built-in
  memory-pressure telemetry today, so a kiosk silently getting killed and
  reloaded by iOS would currently look like an unexplained refresh to the
  end user with no diagnostic trail.
- **The ~16-concurrent-WebGL-context figure is soft** — sourced from
  secondary aggregation, not a primary Apple/WebKit spec in this pass.
  Treat as "don't leak contexts," not as an exact number to design around.
- **`-webkit-touch-callout: none` reliability regression reports on recent
  iOS** (as late as 26.1) mean this CSS should be treated as best-effort
  hardening, not a guaranteed lockout of the long-press menu — a genuinely
  public kiosk needing hard tamper-resistance should lean on Guided
  Access/Single App Mode/MDM instead of CSS alone.
- **Fragmentation risk on the third-party kiosk app front**: Kiosker, Kiosk
  Pro, ProSurf, and WebFrame Kiosk were only surface-checked via marketing
  pages in this pass — feature depth (JS injection, wake-lock equivalents,
  remote management) should be re-verified against current docs
  (`docs.kiosker.io` etc.) before a user commits to one, since none has
  anywhere near Fully Kiosk's install base/community documentation to lean
  on.
- **No web API for brightness/volume/reboot-survival on plain Safari** — any
  feature parity with the Companion app's remote `kiosk_set_brightness`/
  `kiosk_set_volume` for a bare-Safari deployment is a dead end without a
  native wrapper or MDM; don't scope it as pure-web work.

## 7. Sources

- [Home Assistant Companion Docs: iOS Kiosk mode](https://companion.home-assistant.io/docs/integrations/ios-kiosk-mode/)
- [GitHub home-assistant Discussion #2403 — iOS Companion Kiosk Mode for Wall-Mounted Displays](https://github.com/orgs/home-assistant/discussions/2403)
- [Apple Support: Use Guided Access on iPhone or iPad](https://support.apple.com/en-us/111795)
- [SimpleMDM: What is iOS kiosk mode / Single App Mode](https://simplemdm.com/blog/how-to-use-ios-single-app-mode/)
- [NinjaOne: What Single App Mode Is and When to Use It](https://www.ninjaone.com/blog/what-single-app-mode-is-and-when-to-use-it-on-ios-devices/)
- [Kiosker — fullscreen browser kiosk for iOS](https://www.kiosker.io/)
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [firt.dev: iOS PWA Compatibility notes](https://firt.dev/notes/pwa-ios/)
- [MagicBell: PWA iOS Limitations and Safari Support (2026)](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [9to5Mac: iOS 17.4 won't remove Home Screen web apps in the EU after all](https://9to5mac.com/2024/03/01/apple-home-screen-web-apps-ios-17-eu/)
- [The Register: Apple reverses decision to remove Home Screen web apps in EU](https://www.theregister.com/2024/03/02/apple_reverses_pwa_decision/)
- [Apple Developer: Update on apps distributed in the European Union (DMA)](https://developer.apple.com/support/dma-and-apps-in-the-eu/)
- [iTnews: Apple cops flak for deleting local browser storage after 7 days](https://www.itnews.com.au/news/apple-cops-flak-for-deleting-local-browser-storage-after-7-days-539833)
- [Search Engine Land: What Safari's 7-day cap on script-writeable storage means for PWA developers](https://searchengineland.com/what-safaris-7-day-cap-on-script-writeable-storage-means-for-pwa-developers-332519)
- [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [caniuse: Screen Wake Lock API](https://caniuse.com/wake-lock)
- [WebKit Bugzilla #254545 — Wake Lock API broken in Home Screen Web Apps](https://bugs.webkit.org/show_bug.cgi?id=254545)
- [WebKit Blog: Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [MDN: `env()` CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env)
- [caniuse: CSS overscroll-behavior](https://caniuse.com/css-overscroll-behavior)
- [GitHub: lazd/iNoBounce](https://github.com/lazd/iNoBounce)
- [Apple Developer Forums #808606 — `-webkit-touch-callout: none` not working on iOS 26.1](https://developer.apple.com/forums/thread/808606)
- [Apple Developer Forums #737042 — WebGL context lost on iOS Safari](https://developer.apple.com/forums/thread/737042)
- [Apple Developer Forums #668999 — Resizing on-screen WebGL canvas in iOS Safari causes memory growth](https://developer.apple.com/forums/thread/668999)
- [WebKit Bugzilla #261331 — REGRESSION: WebGL context lost when backgrounding Safari (iPadOS 17)](https://bugs.webkit.org/show_bug.cgi?id=261331)
- [WebKit Bugzilla #262628 — WebGL: context lost - iOS 17 Safari](https://bugs.webkit.org/show_bug.cgi?id=262628)
- [three.js discourse: Low fps on iOS mobile with pixel ratio set as devicePixelRatio](https://discourse.threejs.org/t/low-fps-on-ios-mobile-with-pixel-ration-set-as-window-devicepixelratio/4963)
