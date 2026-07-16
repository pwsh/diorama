# Windows Fullscreen Kiosk for Diorama

Research reference for turning a Windows PC (mini-PC, all-in-one touchscreen, wall-mounted
panel) into a dedicated, always-on Diorama display — the Windows analogue of an Android
tablet running Fully Kiosk Browser. Build-ready: concrete settings, exact command lines,
policy names + doc links, and how each piece maps onto Diorama's existing architecture.

## 1. Summary

A "Diorama kiosk PC" on Windows needs five independent things solved, all well-trodden
ground for digital signage but with a couple of gotchas that are load-bearing for *this*
app specifically:

1. **Launch surface** — get a browser to a specific URL, fullscreen, with no chrome (address
   bar, tabs) and no way for a visitor to escape into the desktop.
2. **Auto-everything** — the PC boots, logs in, and opens the dashboard with zero human
   interaction after a power cut or reboot.
3. **Stays awake** — no sleep, no screensaver, no lock screen, ever (this is a wall display,
   not a workstation).
4. **Touch works** — calibrated, single-canvas touch input, no accidental OS-level pinch-zoom
   or edge-swipe gestures fighting Diorama's own touch handling.
5. **Renders well, indefinitely** — three.js/WebGL needs real GPU acceleration and the
   browser must not be allowed to throttle, discard, or background the tab it's never going
   to put in the background.

The single biggest gotcha specific to Diorama: **Microsoft Edge's official `--kiosk` flag
always runs an InPrivate session**, and InPrivate's `localStorage` is memory-only — it is
wiped every time the browser (re)launches. Diorama leans on `localStorage` for the offline
cache (`diorama:store:v1`), the connection token (`diorama:token`, iframe/standalone mode
only), last-used 2D/3D view (`diorama:view`), and collapsed-sidebar state
(`diorama:sidebar:collapsed`). Using literal `--kiosk` mode means all of that resets on
every reboot/crash — the panel would always come up as if freshly installed, and a
standalone-mode long-lived token pasted into the auth screen would never survive a restart.
Section 3 gives the recommended workaround (drop `--kiosk`, use `--app` + Assigned Access
instead).

## 2. Platform / data model / real-world facts

### 2.1 Browser kiosk mode (Edge — Chromium, same engine as Chrome)

Microsoft's own kiosk-mode doc for Edge ([Configure Microsoft Edge kiosk mode](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-configure-kiosk-mode), current as of Oct 2025) defines two "lockdown experiences":

- **Digital/Interactive Signage** — one site, fullscreen, no tabs/omnibox at all.
  ```
  msedge.exe --kiosk https://ha.local:8123/diorama?mode=kiosk&lock=1 --edge-kiosk-type=fullscreen --no-first-run
  ```
- **Public-Browsing** — a limited multi-tab browser (home button, no navigation elsewhere).
  Not useful for Diorama (there's only one page to show).

Both **always run in an Edge InPrivate session** ("Both experiences are running a Microsoft
Edge InPrivate session, which protects user data"). Key supported features (from the
feature table, Edge ≥89 unless noted): F11/F12 blocked, Ctrl+N/Ctrl+T blocked,
`--kiosk-idle-timeout-minutes=N` (0 disables; default is 0/off for fullscreen-signage type,
5 min for public-browsing — this closes/resets the Edge *session* on inactivity, it does
**not** relaunch Edge; something else — Assigned Access or Shell Launcher — must restart it),
`URLAllowlist`/`URLBlocklist` policies, `--kiosk-printing` for silent print. Kiosk mode is
**Windows-only** ("Kiosk for Linux is not supported"). Functional limitations list (features
that don't work / must be turned off) includes `InPrivateModeAvailability`,
`IsolateOrigins`, `Extensions`, `BackgroundModeEnabled`, and several others — leave those
policies at default/unset.

**The InPrivate/localStorage problem, confirmed**: multiple sources (a Microsoft Q&A thread
titled "Edge Kiosk mode wiping local storage?" and independent kiosk blogs) state InPrivate's
`localStorage` behaves like `sessionStorage` — in-memory only, gone when the browsing session
ends, which for `--kiosk` mode is every relaunch. There is **no supported flag to turn off
InPrivate while keeping `--kiosk`** — `InPrivateModeAvailability` is explicitly listed as
not supported in kiosk mode.

**The practical workaround, documented independently by several kiosk-deployment writeups**
(e.g. Andrew Taylor's Intune kiosk post, and general "Chromium app-mode kiosk" guides): don't
pass `--kiosk` at all. Use **`--app=<url>`** instead, which opens a borderless, chrome-less
window pointed at one URL but runs a **normal (non-InPrivate) profile** — `localStorage`,
cookies, and IndexedDB persist across relaunches exactly like a normal browser tab. Lock the
window down some other way (Assigned Access / Shell Launcher restricting what else can run,
plus `URLAllowlist` policy restricting navigation) instead of relying on `--kiosk`'s built-in
sandboxing. Combine with an explicit, persistent profile directory:
```
msedge.exe --app=https://ha.local:8123/diorama?mode=kiosk^&lock=1 ^
  --user-data-dir="C:\DioramaKiosk\EdgeProfile" ^
  --no-first-run --disable-pinch ^
  --disable-features=CalculateNativeWinOcclusion ^
  --disable-backgrounding-occluded-windows --disable-background-timer-throttling
```
(the `--kiosk` flag also accepts `--user-data-dir=`, but it's moot — InPrivate still wipes
storage regardless of which profile directory backs it.)

### 2.2 Locking down the shell: Assigned Access vs. Shell Launcher

Two distinct, complementary Windows features, both documented under
[learn.microsoft.com/windows/configuration](https://learn.microsoft.com/en-us/windows/configuration/assigned-access/):

**Assigned Access** ([overview](https://learn.microsoft.com/en-us/windows/configuration/assigned-access/), [single-app kiosk guide](https://learn.microsoft.com/en-us/windows/configuration/assigned-access/configure-single-app-kiosk)):
- Runs a single UWP app or Edge (via its kiosk mode) full-screen "above the lock screen"; if
  the app exits it **automatically restarts**.
- Requires **UAC enabled**; must be signed in **from the console** (no RDP).
- Windows editions: **Pro, Enterprise/Enterprise LTSC, Education, IoT Enterprise/IoT
  Enterprise LTSC** — Home edition is NOT supported.
- Simplest path for one or two machines: **Settings → Accounts → Other users → Set up a
  kiosk (assigned access)** — creates a new local standard account, walks you through Edge
  digital-signage vs public-browsing, the URL, and the idle timeout. Fully GUI, no XML.
- Scriptable path: `Set-AssignedAccess -AppUserModelId <AUMID> -UserName <username>` (PowerShell,
  [cmdlet doc](https://learn.microsoft.com/en-us/powershell/module/assignedaccess/set-assignedaccess)); remove with `Clear-AssignedAccess`.
- Advanced/fleet path: the [AssignedAccess CSP](https://learn.microsoft.com/en-us/windows/client-management/mdm/assignedaccess-csp) with an XML config, pushed via Intune, a
  provisioning package, or the MDM Bridge WMI Provider — overkill for one homeowner PC.
- Escape hatch: **Ctrl+Alt+Del** exits assigned-access by default (configurable "breakout
  sequence"); the kiosk app **auto-relaunches** either immediately or after the sign-in
  screen's `IdleTimeOut` (default 30 s, registry
  `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\LogonUI`, DWORD `IdleTimeOut`
  in milliseconds-hex). Note this registry timeout **does not apply to Edge kiosk mode**
  itself (Edge's own `--kiosk-idle-timeout-minutes` is separate and doesn't auto-restart).
- Touch keyboard auto-triggers on tap-into-textbox when no physical keyboard is present —
  nothing to configure. (Diorama has no text-entry UI relevant to a locked-down kiosk view,
  so this mostly doesn't matter, but the sidebar's numeric/label inputs would still trigger
  it if a viewer somehow reached edit mode.)

**Shell Launcher** ([overview](https://learn.microsoft.com/en-us/windows/configuration/shell-launcher/)):
- Replaces `Explorer.exe` itself with an arbitrary Win32 exe (v1, via `Eshell.exe`) or either
  a Win32 exe or a UWP app (v2, via `CustomShellHost.exe`, Windows 10 1809+).
- Editions: **Enterprise/Enterprise LTSC, Education, IoT Enterprise/IoT Enterprise LTSC**
  only — **notably NOT Pro** (a meaningful gap vs. Assigned Access, which does support Pro).
  A homeowner on a Pro-edition mini-PC should default to Assigned Access, not Shell Launcher.
- Doesn't sandbox anything by itself — "it doesn't prevent a user from accessing other
  desktop applications and system components"; access control is layered on with CSP/GPO/
  AppLocker. Useful when you want the "shell" itself to be your own launcher/watchdog
  process rather than a browser directly (e.g. a small wrapper .exe that launches Edge,
  watches for crash, restarts it, and could later manage multiple monitors/views).
- Gotcha: the replacement shell process must **stay running** — Shell Launcher watches its
  exit code and reacts (usually by restarting it). A tool that spawns a child and exits
  immediately (their example: `write.exe` spawning `wordpad.exe`) breaks this; don't wrap
  Edge in a batch file that immediately returns.
- Custom shell runs with the signed-in account's rights; if it needs admin rights, **UAC
  must be disabled** for it to launch elevated.

**Recommendation for Diorama**: Assigned Access, Settings-app path (or `Set-AssignedAccess`
for scriptability), targeting **Edge in `--app=` mode is not selectable from the Settings UI
kiosk wizard** (that wizard only offers Edge's built-in `--kiosk` type) — so to get the
`--app=` + persistent-profile workaround, use the **PowerShell/CSP path** with `-AppUserModelId`
pointed at Edge, and instead of relying on the wizard's URL field, pre-provision a **desktop
shortcut / scheduled task** that launches `msedge.exe --app=...` with the full flag set above,
and target Assigned Access at *that* launcher rather than at Edge's kiosk-type directly. (A
Shell Launcher setup with a tiny watchdog .bat/.exe that starts Edge with those flags is the
Enterprise/IoT-edition alternative and gives cleaner "relaunch on crash" behavior — see
setup steps below.)

### 2.3 Auto-login

Three documented options, in order of appropriateness for a purpose-built kiosk PC:

1. **Netplwiz** (`Control userpasswords2`) — GUI, uncheck "Users must enter a user name and
   password", fastest for a one-off box.
2. **Sysinternals Autologon** ([download](https://learn.microsoft.com/en-us/sysinternals/downloads/autologon)) — same registry keys as netplwiz but stores the
   password as an **encrypted LSA secret** instead of a plaintext registry value; has a CLI
   (`autologon user domain password`) so it's scriptable for repeat deployments.
3. **Direct registry** (`HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon`:
   `AutoAdminLogon=1`, `DefaultUserName`, `DefaultPassword`, `DefaultDomainName`) — same
   mechanism under the hood; useful for unattended provisioning scripts.

Security note (consistently flagged across sources): auto-login stores credentials somewhere
a local admin can retrieve them (plaintext registry for netplwiz, LSA secret for Autologon —
still extractable with tooling). Appropriate for a dedicated kiosk account with **no
meaningful local rights and no access to the real HA admin credentials** — pair with a local
standard account, never a domain/Microsoft account with broader access.

When Assigned Access is configured via the Settings-app kiosk wizard on a workgroup PC,
**auto-login for the kiosk account is enabled automatically** — no separate step needed;
Microsoft's Assigned Access doc calls this out explicitly (and shows how to turn it back off
via **Settings → Accounts → Sign-in options → "Use my sign-in info..."** before applying the
kiosk config, if for some reason you don't want it).

### 2.4 Preventing sleep / screensaver / update reboots

**Power** (`powercfg` — [command-line reference](https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/powercfg-command-line-options)), all four apply since a
kiosk display has no reliable "on battery vs. plugged in" distinction to rely on defaults for:
```
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0
powercfg /change hibernate-timeout-ac 0
powercfg /change hibernate-timeout-dc 0
```
Also worth disabling **"Allow wake timers"** and, on laptops-as-kiosks, closing the lid
should be set to "Do nothing" (Power Options → lid close action) since it otherwise sleeps
regardless of the powercfg timeouts above.

**Screensaver** — registry, per-user (`HKCU\Control Panel\Desktop`):
```
reg add "HKCU\Control Panel\Desktop" /v ScreenSaveActive /t REG_SZ /d 0 /f
reg add "HKCU\Control Panel\Desktop" /v ScreenSaverIsSecure /t REG_SZ /d 0 /f
reg add "HKCU\Control Panel\Desktop" /v ScreenSaveTimeOut /t REG_SZ /d 0 /f
```
Group Policy alternative for fleets: **Computer Configuration → Administrative Templates →
System → Power Management → Video and Display Settings → "Turn Off the Display (Plugged
In)" → Disabled**.

**Windows Update auto-restart** ([Manage device restarts after updates](https://learn.microsoft.com/en-us/windows/deployment/update/waas-restart)) — a kiosk that reboots itself mid-day
into the Windows lock screen (bypassing Assigned Access until re-login) is a real failure
mode. Two GPOs (`Computer Configuration → Administrative Templates → Windows Components →
Windows Update`):
- **"Turn off auto-restart for updates during active hours"** + **"Specify active hours
  range for auto-restarts"** — set active hours to cover all expected viewing hours (max
  range is 18 hours, so overnight is the only safe restart window — plan for that).
- **"No auto-restart with logged on users for scheduled automatic updates installations"**
  — only relevant if Automatic Updates is set to the specific "auto download and schedule
  install" mode (option 4); Microsoft's docs explicitly flag this combination as intended
  **for kiosk devices**, not general workstations.
- These GPOs require Pro/Enterprise/Education (Group Policy Editor isn't in Home edition);
  on Home, the closest equivalent is manually setting Active Hours in
  Settings → Windows Update → Advanced options, which has no explicit "kiosk" carve-out
  but the same active-hours effect.

### 2.5 Touch handling

- **Calibration**: `tabcal` (Control Panel → Hardware and Sound → Tablet PC Settings →
  Display tab → Setup, then Calibrate). ~16-point calibration, ~90 seconds. **Must select
  the correct physical monitor first** on any multi-monitor rig — Windows doesn't
  auto-detect which display a USB/HID touch digitizer belongs to, and per several
  troubleshooting threads, mixed-DPI multi-monitor touch setups are a known source of
  touch-lands-in-wrong-place bugs; isolate one monitor at a time when debugging.
- **Cursor**: Windows has **no built-in "hide the cursor after N seconds"** system setting —
  confirmed across multiple sources ("Windows does not offer a true, single-layer
  system-wide cursor hide toggle"). Practical options: (a) most touch-panel vendors (e.g.
  Elo) ship a driver setting to disable the synthesized mouse pointer entirely for a
  touch-only digitizer — check the specific touch controller's control panel first; (b) a
  small always-idle-hide utility/AutoHotkey script; (c) accept a static arrow cursor parked
  in a corner (usually invisible enough behind fullscreen browser content in practice, since
  nothing moves it once nobody's touching). There's a separate **touch-visual-feedback ring**
  (the expanding circle Windows draws under a finger) controlled by registry
  `HKCU\Control Panel\Cursors\ContactVisualization` (0 disables it) — turn this off too, it's
  a chrome-like overlay a signage viewer shouldn't see.
- **Pinch-to-zoom / OS gestures**: the old `--disable-pinch` Chromium flag was **deprecated
  in Chrome 88+ and no longer works**. Current supported mechanism is the Chrome/Edge
  Enterprise policy **`AllowPinchToZoom = false`** (registry
  `HKLM\SOFTWARE\Policies\Microsoft\Edge` or `\Google\Chrome`, DWORD `AllowPinchToZoom=0`).
  Belt-and-suspenders at the page level (Diorama already partially does this — see §3):
  `touch-action: none` in CSS and a `<meta name="viewport" content="width=device-width,
  initial-scale=1, maximum-scale=1, user-scalable=no">` tag both help, though the Chrome
  policy is the only thing that reliably kills OS-level pinch on a Chromium *window* as
  opposed to inside a scrollable page element.
- **DPI / scaling mismatch**: Windows kiosk/Assigned-Access sessions have been reported
  (Microsoft Q&A) to **default to 150% scaling** with no obvious kiosk-wizard control to
  change it; fix by setting the display scaling in normal Settings → System → Display
  **before** provisioning the kiosk account (scaling is a per-session or per-user setting —
  set it while signed into the intended kiosk account), or via registry
  `LogPixels=0x60` (96 = 100%) + `Win8DpiScaling=1` under
  `HKCU\Control Panel\Desktop` for that account. Keep OS scaling at 100% on kiosk displays
  and let the page (Diorama's own responsive canvas sizing, DPR-capped at 2 in the 3D
  renderer) do the rest — mixing OS scaling with browser zoom on top is explicitly called
  out as confusing and easy to get wrong twice.

### 2.6 GPU / WebGL

- Diorama's three.js path (`MeshToonMaterial` + `NoToneMapping`, no PMREM environment) is
  cheap by 3D-web standards but still needs a **real, hardware-accelerated WebGL2 context**.
  Verify at `edge://gpu` (or `chrome://gpu`) — look for "Hardware accelerated" under Graphics
  Feature Status / WebGL / WebGL2.
- Chrome/Edge maintains an internal **GPU driver blocklist**; a blocklisted GPU/driver combo
  (common on old integrated Intel chips with ancient drivers) silently falls back to
  **SwiftShader**, Chromium's CPU software rasterizer. SwiftShader technically runs WebGL but
  doesn't implement the full spec and is dramatically slower — three.js scenes with many
  animated humanoid rigs would be the first thing to visibly suffer (dropped frames, or
  outright WebGL context-loss under load). As of 2026 Chromium is actively **removing
  automatic SwiftShader fallback** (`--allow-unsafe-swiftshader` / `--use-angle=swiftshader`
  now required to opt in deliberately) — meaning an unsupported/blocklisted GPU is trending
  toward **WebGL simply failing to initialize** rather than silently degrading, which is
  actually easier to diagnose but means kiosk hardware selection matters more than it used
  to. Practical guidance: use anything from the last ~8 years with Intel UHD Graphics 600-
  series or newer / any dedicated GPU / any recent AMD APU — avoid old netbook-class Atom/
  Celeron systems with ancient GPU drivers that never get updated.
- If a specific GPU is wrongly blocklisted but actually fine, `edge://flags/#ignore-gpu-
  blocklist` ("Override software rendering list") forces hardware acceleration back on —
  test thoroughly before relying on it for an unattended device.
- **Background/occlusion throttling** — Chromium throttles or fully stops rendering + JS
  timers for tabs it thinks are backgrounded, including (on Windows specifically) a "native
  window occlusion" heuristic that can trigger even for a foreground, on-screen window if
  Windows itself misjudges visibility. For an always-on single-window kiosk this is pure
  downside. Flags: `--disable-features=CalculateNativeWinOcclusion`,
  `--disable-backgrounding-occluded-windows`, `--disable-background-timer-throttling`. This
  overlaps functionally with Chrome's newer **Memory Saver** tab-discarding feature (Settings
  → Performance, or Enterprise policy `HighEfficiencyModeEnabled=false` / the "Always keep
  these sites active" exception list) — for a kiosk you want Memory Saver **off entirely**,
  not just exempted, since a discarded tab reloads from scratch (losing the same in-memory
  three.js scene state a context-loss event would).
- **`webglcontextlost`**: Diorama already listens for this (per CLAUDE.md, "`webglcontextlost`
  listener prevents iOS Safari blackouts") — the same listener protects a Windows kiosk from
  GPU-process crashes/TDR timeouts, which per current (2026) discussion are one of the most
  common real-world causes of context loss on long-running WebGL kiosks, alongside VRAM
  exhaustion and the ~16-simultaneous-WebGL-context Chrome ceiling (not a concern here — one
  Diorama tab = one WebGL context).

### 2.7 Windows edition choice

[Windows 11 IoT Enterprise LTSC](https://learn.microsoft.com/en-us/windows/iot/iot-enterprise/hardware/system_requirements) is Microsoft's purpose-built edition for "fixed-function,
specialized commercial devices... digital signage,... kiosks." Minimum hardware: 1 GHz+
dual-core 64-bit or Arm CPU, 4 GB RAM preferred (2 GB minimum), 64 GB storage preferred
(16 GB minimum), UEFI (BIOS optional), TPM 2.0/Secure Boot both **optional** (unlike
mainstream Windows 11). 10-year support lifecycle, security-only updates (no forced feature
updates or UI churn) — genuinely nice properties for a display appliance a homeowner wants to
set up once. **Trade-off**: it's an OEM/volume-licensing SKU, not something you install on an
arbitrary existing PC the way you can with Pro — realistically only relevant if buying
purpose-built kiosk/signage hardware. For a homeowner repurposing an existing Windows 10/11
**Pro** machine or a consumer mini-PC, Assigned Access on Pro is the practical path (Shell
Launcher's IoT/Enterprise-only requirement is the other reason Pro users should default to
Assigned Access, not Shell Launcher, per §2.2).

## 3. Diorama design / integration

**Pick the integration mode with the kiosk gotcha in mind.** Diorama ships three ways
(CLAUDE.md "Deploy" section): native `panel_custom` (loads inside the authenticated HA
frontend, no token), `panel_iframe` (long-lived token pasted once into
`<diorama-auth>`, cached to `localStorage['diorama:token']`), and the raw standalone
`index.html` entry (same auth screen/token flow, used for the Vite dev/preview build). All
three benefit from *not* using literal Edge `--kiosk` mode:

- If storage is wiped every relaunch (the `--kiosk` InPrivate problem, §2.1), the
  **iframe/standalone token flow re-prompts for a long-lived token on every reboot or Edge
  crash** — a non-starter for an unattended wall panel; and even the native panel path loses
  its `diorama:store:v1` local cache and `diorama:view`/`diorama:sidebar:collapsed`
  device-local state each time, so the panel "forgets" which 2D/3D view and floor it was on
  and always reopens with sidebar sections in their default collapsed/expanded state.
- **Recommendation**: launch via `--app=<url>` with an explicit `--user-data-dir` (§2.1),
  not `--kiosk`. This keeps `localStorage`/IndexedDB persistent, so:
  - **Native panel mode** is simplest end-to-end if the target HA install has a
    `trusted_networks` auth provider (§2.5, `homeassistant.auth_providers` in
    `configuration.yaml`) covering the kiosk PC's LAN IP with `allow_bypass_login: true` —
    the browser opens straight to the dashboard with no login screen ever, and no token to
    manage. This is the cleanest match for Diorama's stated preference ("Native panel
    (preferred — no token, HA handles auth)").
  - **Standalone/iframe mode** is the fallback when trusted_networks isn't set up (or the
    homeowner doesn't want to open that hole): paste the long-lived token into
    `<diorama-auth>` **once**, right after first provisioning the persistent profile
    directory — it then survives reboots because storage isn't wiped. Model-store data
    (imported SH3D OBJ/MTL, `model-store.ts`'s IndexedDB) also depends on this persisting.
- Either way, use Diorama's own **URL template params** (already shipped, per CLAUDE.md "UI
  modes... & URL templates") to fully pin the kiosk experience without touching the sidebar:
  `?mode=kiosk&lock=1&floor=<id>&view=3d&view3d=<savedViewName>&layers=<presetName>`, or a
  `cam=x,y,z,tx,ty,tz` pinned camera pose (`Planner.lastCam3d` / the topbar "Kiosk link"
  button already mints one of these — generate it once from an admin session, then bake it
  into the kiosk shortcut's target URL). `mode=kiosk` (not `view`) is right for a wall panel
  that should still allow entity taps (light/switch toggles, alarm panel, door lock) but
  never editing — `lock=1` hides the mode switcher so a stray tap can't flip it back to
  edit.
- **Touch double-handling**: Diorama's own canvas code already fights this exact battle for
  mobile (CLAUDE.md "Touch → click synthesis" — `preventDefault` on 1-finger touch, edge-swipe
  carve-out, 700 ms synthetic-click de-dupe window). On a Windows touch panel the OS-level
  concerns from §2.5 (`AllowPinchToZoom` policy, `ContactVisualization` registry, DPI scaling)
  are a **separate, lower layer** — get those right at the OS/browser level so Diorama's
  existing touch-synthesis code (which assumes a single, undistorted, non-zoomed viewport)
  isn't fighting the OS for the same gesture.
- **GPU verification is part of bring-up, not an afterthought**: before wiring up
  auto-login/Assigned Access, load the intended kiosk URL in a normal (non-kiosk) Edge
  window on the target hardware first, open `edge://gpu`, confirm WebGL2 is hardware
  accelerated, and only then lock it down — a SwiftShader fallback (§2.6) is far easier to
  spot and fix (driver update, or `ignore-gpu-blocklist`) before Assigned Access makes the
  desktop inaccessible.
- **Background-throttling flags are not optional for this app**: `updateTargets` in
  `three-renderer.ts` runs every frame to keep humanoid rigs, blob shadows, and the
  auto-follow camera live; Chrome's Memory Saver / native-window-occlusion throttling
  (§2.6) would periodically stall or fully discard exactly that per-frame work on a display
  nobody ever "backgrounds" by user action but that Windows might still misjudge as
  occluded/idle. Pass `--disable-features=CalculateNativeWinOcclusion
  --disable-backgrounding-occluded-windows --disable-background-timer-throttling` in the
  launch shortcut, and turn off Memory Saver in `edge://settings/performance` (or
  `HighEfficiencyModeEnabled=false` via policy) rather than relying on an "always keep this
  site active" exception, since that setting is scoped by *site*, and a same-origin panel
  URL with query-string mode params should still match — but disabling the feature outright
  removes any doubt.
- **`webglcontextlost` already covers the recovery path** (CLAUDE.md, shared with the iOS
  Safari blackout mitigation) — no new Diorama code needed for GPU-process crashes/TDR on
  Windows; it's the same event.
- **Idle timeout interactions**: Edge's own `--kiosk-idle-timeout-minutes` only applies in
  literal `--kiosk` mode (not `--app` mode, which is what §3 recommends) — moot either way
  once `--kiosk` is dropped. Diorama has no built-in "reset to a home view after N idle
  minutes" feature today; if that's wanted for a kiosk (e.g. always drift back to the sims
  camera / a specific floor after visitors wander the 3D view), that would be new Diorama
  work — a small idle timer in `app.ts` re-applying the same URL-template params
  (`_applyUrlParams`) periodically, or a page auto-reload every N hours as a poor-man's
  version (acceptable since `--app` mode's persistent profile means a reload doesn't lose
  the token/cache).
- **Auto-follow / cinematic orbit already give "signage mode" a pulse without any new
  work**: `Scene3D.autoFollow` and `Scene3D.cinematicOrbit` (already shipped) are exactly
  the kind of ambient movement a kiosk display benefits from when nobody's standing at it —
  worth defaulting ON via a saved `view3d` preset baked into the kiosk URL.

## 4. Setup / integration steps

A concrete checklist, Assigned-Access-on-Pro path (the realistic default for a homeowner
repurposing a Windows Pro mini-PC or NUC-class device):

1. **Pick hardware / verify GPU** — anything ≥8 years old with Intel UHD 600-series+/any
   dedicated GPU. Confirm in a normal Edge session: `edge://gpu` → WebGL2 hardware
   accelerated.
2. **Set display scaling to 100%** (Settings → System → Display) on the account that will
   become the kiosk account, before locking it down (§2.5).
3. **Calibrate touch** (if applicable): search "calibrate" → Tablet PC Settings → pick the
   correct monitor → Calibrate (`tabcal`); disable the touch contact-visualization ring
   (`HKCU\Control Panel\Cursors\ContactVisualization=0`).
4. **Create the local kiosk account** (standard user, no admin rights) — either let the
   Settings kiosk wizard create it in step 8, or pre-create it manually if you want to
   configure its display scaling/touch calibration first (those settings are per-account).
5. **Home Assistant side**: mint a long-lived access token (user profile → bottom of page)
   if using iframe/standalone mode; OR configure `trusted_networks` +
   `allow_bypass_login: true` scoped to the kiosk PC's IP/subnet if using native panel mode
   with zero-login (verify the `homeassistant` auth provider fallback stays listed too, per
   §2.4's warning about locking yourself out).
6. **Build the launch shortcut/script** (this replaces the Settings-wizard's built-in
   `--kiosk` URL field, to get the `--app` + persistent-profile behavior from §2.1/§3):
   ```bat
   msedge.exe --app="https://ha.local:8123/diorama?mode=kiosk&lock=1&floor=main&view3d=Wall" ^
     --user-data-dir="C:\DioramaKiosk\EdgeProfile" ^
     --no-first-run --disable-pinch ^
     --disable-features=CalculateNativeWinOcclusion ^
     --disable-backgrounding-occluded-windows --disable-background-timer-throttling
   ```
   Save as `C:\DioramaKiosk\launch.bat`, referenced by an .exe/.lnk if Assigned Access's
   AUMID targeting needs an actual executable (test — a `.bat` may not resolve cleanly
   through `Set-AssignedAccess -AppName`; a tiny compiled launcher or a scheduled task,
   §6, is the fallback).
7. **Disable Memory Saver** in that Edge profile: `edge://settings/performance` → Memory
   Saver off (this is per-profile, so must be set once inside the persistent
   `--user-data-dir` before locking down navigation).
8. **Configure Assigned Access** targeting the launcher from step 6 and the kiosk account
   from step 4: Settings → Accounts → Other users → Set up a kiosk (assigned access) if the
   wizard accepts a custom app, otherwise `Set-AssignedAccess -AppUserModelId <AUMID>
   -UserName <kioskaccount>` from an elevated PowerShell prompt (find the AUMID for a
   packaged launcher, or fall back to Shell Launcher — Enterprise/IoT editions only — if a
   plain Win32 exe as the literal shell is preferred over Assigned Access's app model).
9. **Auto-login**: Assigned Access via the Settings wizard enables this automatically for a
   workgroup PC; verify with a reboot. If configured via PowerShell/CSP instead, set it
   explicitly with Sysinternals Autologon targeting the kiosk account.
10. **Power settings** — run the six `powercfg /change *-timeout-*` commands (§2.4) as
    admin; verify with `powercfg /query` that no `standby`/`monitor`/`hibernate` timeout
    is nonzero.
11. **Screensaver off** for the kiosk account (registry keys, §2.4).
12. **Windows Update active hours** — set to span the full expected display-on window
    (max 18 h), enable "Turn off auto-restart for updates during active hours" if using
    Group Policy (Pro+); on Home, set Active Hours manually in Settings → Windows Update.
13. **Smoke test**: reboot from a cold power-off, confirm the panel comes up fullscreen with
    no login prompt, no address bar, correct floor/camera, and that a touch tap toggles a
    light. Leave it running 24+ h and check `edge://gpu` again / watch for any visible
    stutter (Memory Saver or occlusion throttling misconfigured would show up as periodic
    freezes).
14. **Physical**: mount, route power (a UPS or at least a surge-protected outlet + BIOS
    "restore power state after outage = on" so a breaker trip doesn't leave a dark screen
    waiting for a manual power button press), hide/secure the keyboard+mouse if any (or
    remove entirely for a touch-only install — Assigned Access's Ctrl+Alt+Del breakout
    still needs *a* keyboard attached somewhere for maintenance access, even if unplugged
    day-to-day).

## 5. Potential additional features

- **Multi-view rotation**: cycle through several saved `view3d` presets / floors on a timer
  — not a Diorama feature today; would need a small idle/interval timer in `app.ts`
  re-applying `_applyUrlParams`-style state (see §3's idle-timeout note — same mechanism
  would serve both).
- **Presence-aware wake**: pair with an HA `binary_sensor` (a motion sensor, or the Fully
  Kiosk Browser Android pattern already documented for tablets) to switch the *display*
  brightness/on-off via HDMI-CEC or a smart plug when nobody's around — orthogonal to
  Diorama itself but a natural companion automation.
- **Small watchdog service**: a scheduled task (or Shell Launcher-hosted exe) that pings
  `edge://gpu` state or simply checks the Edge process is alive and the window is foreground/
  fullscreen, relaunching if not — belts-and-suspenders beyond Assigned Access's own
  auto-restart-on-exit.
- **Remote kiosk health**: expose the kiosk PC's own uptime/GPU-mode as an HA sensor (e.g.
  via a lightweight HA integration or MQTT from a startup script) so a homeowner notices a
  silently-degraded (SwiftShader-fallback, or frozen) kiosk without walking up to it.
- **Multi-monitor "glass house" wall**: since Diorama's `glassHouse`/ghost-floor rendering
  and per-floor camera views already exist, a Shell Launcher custom shell (§2.2, "can launch
  secondary views displayed on multiple monitors") could drive two physical displays (e.g.
  a hallway showing one floor, a kitchen panel showing another) from one PC — bigger lift,
  Enterprise/IoT edition only.

## 6. Open questions & risks

- **`Set-AssignedAccess -AppName` targeting a `.bat`/launcher shortcut is unverified** —
  Microsoft's own examples target a UWP AUMID or, for Win32 apps, generally expect a
  friendly app name the user has run at least once; whether a bare batch file behaves
  reliably as an Assigned-Access-managed Win32 "app" (vs. needing an actual signed .exe or
  a Shell Launcher config instead) should be smoke-tested on real hardware before relying on
  it — this doc's step 6/8 is the least battle-tested part of the plan.
- **No supported way to keep literal Edge `--kiosk` mode's built-in restrictions (F11/F12/
  Ctrl+N blocked, "Settings and more" trimmed, etc., §2.1's feature table) while also getting
  persistent storage** — the `--app` workaround trades away all of those free protections
  for storage persistence, pushing the lockdown burden onto Assigned Access + the
  `URLAllowlist` policy instead. Worth re-checking Microsoft's kiosk docs periodically in
  case a future Edge version decouples InPrivate from `--kiosk` (no indication as of this
  writing that it's planned or considered a bug).
- **DPI/scaling defaulting to 150% in some kiosk configurations** (§2.5) was reported on
  Microsoft Q&A without a clean official fix (registry workaround only) — this may be
  fixed, changed, or edition-specific by the time of implementation; verify on the actual
  target Windows build.
- **Windows Home edition** has no Assigned Access, no Shell Launcher, no Group Policy editor
  — a homeowner on a Home-edition PC is limited to manual auto-login (netplwiz) + a startup
  shortcut + manual power/screensaver settings, with no OS-level lockdown at all (a
  determined user, or an accidental Alt-Tab, escapes to the desktop). Worth flagging plainly
  rather than assuming Pro/Enterprise.
- **SwiftShader-fallback removal is actively in flux in Chromium as of 2026** (§2.6) — the
  exact current-channel Edge/Chrome behavior (silent CPU fallback vs. hard WebGL failure)
  should be re-verified against whatever Edge version ships at actual implementation time,
  since this changes what "GPU not supported" looks like to a user (blank/black 3D view vs.
  degraded-but-working).
- **Cursor hiding has no clean system-level answer** (§2.5) — every option is a workaround
  of some kind; if a touch-panel vendor driver setting isn't available, this may just be an
  accepted cosmetic wart (a static arrow parked somewhere unobtrusive) rather than something
  worth engineering around.

## 7. Sources

- [Configure Microsoft Edge kiosk mode — Microsoft Learn](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-configure-kiosk-mode)
- [Configure a Single-App Kiosk With Assigned Access — Microsoft Learn](https://learn.microsoft.com/en-us/windows/configuration/assigned-access/configure-single-app-kiosk)
- [Assigned Access Overview — Microsoft Learn](https://learn.microsoft.com/en-us/windows/configuration/assigned-access/)
- [Set-AssignedAccess cmdlet — Microsoft Learn](https://learn.microsoft.com/en-us/powershell/module/assignedaccess/set-assignedaccess)
- [Shell Launcher Overview — Microsoft Learn](https://learn.microsoft.com/en-us/windows/configuration/shell-launcher/)
- [AssignedAccess CSP — Microsoft Learn](https://learn.microsoft.com/en-us/windows/client-management/mdm/assignedaccess-csp)
- [Autologon — Sysinternals, Microsoft Learn](https://learn.microsoft.com/en-us/sysinternals/downloads/autologon)
- [Powercfg command-line options — Microsoft Learn](https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/powercfg-command-line-options)
- [Manage device restarts after updates — Microsoft Learn](https://learn.microsoft.com/en-us/windows/deployment/update/waas-restart)
- [Minimum System Requirements, Windows IoT Enterprise — Microsoft Learn](https://learn.microsoft.com/en-us/windows/iot/iot-enterprise/hardware/system_requirements)
- [Windows Native Window Occlusion Detection — Chromium docs](https://chromium.googlesource.com/chromium/src/+/master/docs/windows_native_window_occlusion_tracking.md)
- [Using Chromium with SwiftShader — Chromium docs](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md)
- [Intent to Remove: SwiftShader Fallback — blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM)
- [MemorySaverModeSavings policy — Chrome Enterprise](https://chromeenterprise.google/policies/memory-saver-mode-savings/)
- [What developers need to know about Chrome's Memory and Energy Saver modes — Chrome for Developers](https://developer.chrome.com/blog/memory-and-energy-saver-mode)
- [Edge Kiosk mode wiping local storage? — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/1187729/edge-kiosk-mode-wiping-local-storage)
- [Getting Windows Kiosks to work in Intune whilst avoiding InPrivate browsing — Andrew Taylor](https://andrewstaylor.com/2025/10/20/getting-windows-kiosks-to-work-in-intune-whilst-avoiding-inprivate-browsing/)
- [Windows 11 kiosk mode default scale is 150% — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/1295270/windows-11-kiosk-mode-default-scale-is-150-and-the)
- [How do I calibrate touch across multiple displays? — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/2589496/how-do-i-calibrate-touch-across-multiple-displays)
- [How do I hide the mouse cursor via the Windows Registry? — Elo Technical Support](https://elosupport.elotouch.com/hc/en-us/articles/31651502322839-How-do-I-hide-the-mouse-cursor-via-the-Windows-Registry)
- [Authentication providers (trusted_networks) — Home Assistant docs](https://www.home-assistant.io/docs/authentication/providers/)
- [Fully Kiosk Browser — Home Assistant integration docs](https://www.home-assistant.io/integrations/fully_kiosk/)
- [chrome-launcher flags-for-tools (CalculateNativeWinOcclusion, background throttling) — GoogleChrome/chrome-launcher](https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md)
