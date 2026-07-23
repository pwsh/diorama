# Packaging Diorama as a Lovelace Card (roadmap P1)

Research doc for a Diorama feature. Status: research only, not implemented.

## 1. Summary

Diorama today ships exactly one HA-side surface: a `panel_custom` panel
(`src/panel.ts` → `dist/diorama-panel.js`), riding `HassPanelAdapter` over the
frontend's own authenticated `hass.connection`. This doc researches the
current (2025/2026) HA **custom Lovelace card** contract precisely, then
designs a third build entry (`src/card.ts` → `dist/diorama-card.js`) that
drops a `<diorama-card>` element — a single room in 2D, or a kiosk-framed 3D
view — into any dashboard, alongside the existing panel.

**Headline findings:**

- The card contract (`setConfig`/`hass`/`getCardSize`/`getGridOptions`/
  `getConfigElement`/`getStubConfig`) is well-documented on
  `developers.home-assistant.io` and stable enough to build against precisely
  (§2).
- `HassPanelAdapter` (`src/ha-panel-adapter.ts`) is reusable **verbatim** for
  a card — it only touches `hass.connection` once and then runs its own
  `state_changed` subscription; nothing in it assumes "panel" (§4).
- HACS already packages Diorama as a **Dashboard/plugin** repo with
  `zip_release` + manual registration (the README has the user hand-write the
  `panel_custom:` YAML) — adding a card resource is the exact same pattern,
  one more manual step, **zero HACS-side changes** (§2.3, §5).
- The real design work is architectural, not protocol-level: how N card
  instances share ONE `Planner`/`HassPanelAdapter` per HA connection (§5),
  and how a stripped-down host (no `<diorama-app>`, no sidebar/topbar/
  toolbar) mounts the existing `<diorama-canvas-2d>` / `<diorama-three-view>`
  read-only (§6).

---

## 2. The current HA custom-card contract

### 2.1 Element contract & sizing

| Member | Called | Contract |
|---|---|---|
| `setConfig(config)` | On card creation and on every config change (incl. live YAML-editor edits) | Must validate synchronously and **throw** on bad config — HA renders a red error card from the thrown message. Must NOT assume `hass` is set yet. |
| `set hass(hass)` | On **every** `hass` object change — i.e. on effectively every `state_changed` anywhere in the system, since HA's frontend store recomputes one immutable `hass` object per update and pushes it down the whole rendered tree | Card must diff internally (cache the entity ids it cares about, compare old vs new state) to avoid needless re-render work; this is *not* filtered by HA to "your entities" for you. `custom-card-helpers`' `hasConfigOrEntityChanged(element, changedProps)` is the community-standard `shouldUpdate` guard for this. |
| `getCardSize()` | Masonry view only, once per layout pass (may return a `Promise<number>`) | Row-height unit: **1 = 50 px**. Defaults to `1` if undefined — badly wrong for a canvas card, so always implement it. |
| `getGridOptions()` | **Sections view** (introduced HA 2024.3, "Home a better place" dashboard rework), once per layout pass | Returns `{rows?, min_rows?=1, max_rows?, columns?=12, min_columns?=1, max_columns?}`. `columns: 'full'` = full section width. Grid unit: column width ≈ *section width ÷ 12* (~30 px at typical widths), **row height 56 px**, gap 8 px. If undefined, HA defaults the card to `columns: 12` (full width) and **ignores rows** (auto-height from rendered content) — acceptable as a fallback but not ideal for a canvas that must know its pixel box up front. |
| (legacy `getLayoutOptions()`) | Early 2024.3 betas | Superseded by `getGridOptions()` in the shipped/stable API; some community threads and older third-party cards still reference the older name/shape. Target `getGridOptions()`; don't implement both. |
| Per-card-instance YAML `grid_options:` | User-authored, only meaningful in sections view | Overrides the card's own `getGridOptions()` defaults for that one placement — respect it, don't fight it. |
| `connectedCallback()` / `disconnectedCallback()` | Card element enters/leaves the DOM | **Views are torn down and recreated** when the user switches dashboard tabs/views (not just scrolled off-screen in masonry — a different *view* unmounts its whole card tree). A WebGL-heavy card MUST release its GL context + RAF loop in `disconnectedCallback` and be able to fully rebuild in a **fresh element instance's** `firstUpdated`/`connectedCallback` — don't assume the same instance reconnects. |

Sources: [Custom card — HA Developer Docs](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/), [Sections — home-assistant.io](https://www.home-assistant.io/dashboards/sections/), [A Home-Approved Dashboard chapter 1 (2024.3 blog)](https://www.home-assistant.io/blog/2024/03/04/dashboard-chapter-1/).

**Consequence for a canvas/WebGL card**: implement BOTH `getCardSize()` (masonry) and `getGridOptions()` (sections) — a card that only implements one degrades badly in the other view type. Since the 2024.3 blog post itself states "other cards will occupy the full width of a section by default" for cards without `getGridOptions()`, Diorama should ship it from day one rather than rely on the fallback.

### 2.2 Config editor contract

| Approach | Mechanism | Fit for Diorama |
|---|---|---|
| Hand-rolled editor element | Static `getConfigElement()` returns (or dynamically imports, then constructs) a custom element implementing `LovelaceCardEditor` (`hass` setter + `setConfig`); it fires `config-changed` (`{bubbles:true, composed:true}`, `detail:{config: newConfig}`) on every edit. HA re-runs the card's `setConfig` with the new value. | Needed regardless, because the floor picker must be populated from the **live store** (see §6) — a plain `ha-form` schema can't express "list of floor names in Planner's currently-loaded config" without a custom selector. |
| Built-in form (`getConfigForm()`) | Static method returning `{schema, computeLabel?, computeHelper?, assertConfig?}`; `schema` is an `ha-form` schema array (selectors: `entity`, `select`, `boolean`, `number`, …). Less code, native HA look, but the field OPTIONS must be static/derivable from `hass` alone (entities/devices) — it can't await Diorama's own async store load. | Good for the *simple* fields (`view`, `mode`, `compact`) but not `floor` (§6 editor design uses a hybrid: `getConfigForm()` schema for the static fields + a floor value that free-types until the store loads, validated defensively in `setConfig`). |
| `getStubConfig()` | Static, returns a default config object (no `type:`) used when the card is dragged from the picker with no config yet. | Return `{ view: '2d', mode: 'kiosk' }` — the safest possible default (view-only, no floor pinned = "current/first floor"). |

Sources: [Custom card — HA Developer Docs](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/), [`getConfigForm()` community thread](https://community.home-assistant.io/t/getconfigform-configure-editor-for-custom-card/845004), [boilerplate-card](https://github.com/custom-cards/boilerplate-card).

### 2.3 Registration & packaging

| Mechanism | Detail |
|---|---|
| `window.customCards` | Push `{type, name, description?, preview?, documentationURL?}` (module-scope side effect on load) so the card shows in the "Add card" picker with a friendly name/description. `type` must match the string used in dashboard YAML (`type: custom:diorama-card`, no `custom:` prefix in the registry entry itself). |
| Lovelace resource | The card module must be registered once as a dashboard resource: Settings → Dashboards → Resources (or `lovelace: resources:` YAML mode), URL `/hacsfiles/diorama/diorama-card.js`, type **module**. |
| HACS repo type | Diorama's `hacs.json` already declares no explicit HACS repo "type"; the README documents it as a **Dashboard** custom-repository type with `zip_release: true` + `filename: diorama.zip` — HACS just unpacks the release zip into `config/www/community/diorama/` and serves everything under `/hacsfiles/diorama/**`. Nothing about that changes for a card: `diorama-card.js` lands in the same unpacked folder as `diorama-panel.js` and `assets/*`. |
| Auto-resource-registration | HACS's Dashboard/"plugin" type CAN auto-add a Lovelace resource, but only for the file that name-matches the repo (`diorama.js`, or `lovelace-`-prefix-stripped) — Diorama's primary artifact is `diorama-panel.js`, which doesn't match, so **auto-registration was never in play even for the panel**. The project's own README already documents a **fully manual** registration step for the panel; adding one more manual step ("add this Lovelace resource") for the card is the same established pattern, not a new one. |
| One repo, two module URLs | **Confirmed viable, no special HACS mechanics needed.** The zip already ships multiple independent JS entry points (`diorama-panel.js` at dist root + code-split `assets/*.js` chunks) specifically because HACS's zip-release mode "ships intact" per CLAUDE.md. A third top-level file (`diorama-card.js`) is just another file in the same zip; the user wires up `panel_custom:` YAML *and* a Lovelace resource, both pointing into the one unpacked directory. No named precedent project was found that documents doing exactly this (panel + card from one HACS zip) — but nothing in the HACS Dashboard-type contract forbids it, and it's mechanically identical to what Diorama already does today for its single panel entry plus multiple internal chunks. |
| Multi-chunk / dynamic-import pitfalls | Diorama's `chunkVersionQuery` Vite plugin (vite.config.ts) appends a per-build `?v=<buildId>` to every **chunk-to-chunk** import specifier (including dynamic `import()`), pinning one build's whole module graph together regardless of entry point. Because it walks every chunk's `imports`/`dynamicImports` in `generateBundle` and is entry-agnostic, a third entry needs **no changes to the plugin** — `card.ts`'s dynamic `import('../three-renderer.js')` gets the same `?v=` treatment as `three-view.ts`'s, automatically, as long as it's the same specifier (see §5, "must not duplicate the chunk"). The Lovelace **resource URL** itself is a separate cache-busting layer HA/HACS doesn't touch automatically — same "hard refresh after updating" caveat the README already documents for the panel applies to the card resource too (a resource URL with no query the browser/CDN can cache indefinitely; bumping `module_url`/resource URL with a manual `?v=` after an update, or a hard refresh, remains the user's job either way). |

Sources: [Plugin (Dashboard) — HACS](https://hacs.xyz/docs/publish/plugin/), Diorama's own `hacs.json` + README install section, `vite.config.ts`.

### 2.4 `hass` cadence: card vs panel

| | Panel (`panel_custom`) | Card |
|---|---|---|
| `hass` setter frequency | Every state change, per `src/panel.ts`'s own comment ("HA frontend sets this on every state change") | Identical — every state change, per the dev docs ("Home Assistant will update the `hass` property... on state changes") |
| What Diorama actually *does* with it | `HassPanelAdapter.attach(h)` is called every time, but its body **early-returns after the first call** (`if (this._attached) return`) — every subsequent `hass` push is thrown away entirely | Would behave **identically** if `HassPanelAdapter` is reused as-is |
| Where live state actually comes from | The adapter's OWN `hass.connection.subscribeEvents(cb, 'state_changed')` subscription, grabbed once from that first `hass` | Same — `hass.connection` exists on a card's `hass` object exactly as it does on a panel's |
| Cardinality | Exactly one instance per browser tab (one sidebar panel) | Potentially **N instances** (same card on multiple dashboard views, or two Diorama cards side-by-side, or a 2D card + a 3D card of the same floor) |
| Lifecycle | Element persists for the tab's life; `disconnectedCallback` only tears down the `<diorama-app>` DOM, **not** the `Planner`/adapter/WS subscription — navigating back reuses the same `Planner` | Dashboard **views** are torn down/rebuilt on tab switch, so a naive one-adapter-per-card-element design would open/close a fresh `state_changed` subscription (and rebuild `Planner`'s full derived state) every time the user revisits a view — multiplied by however many Diorama cards are on the dashboard |

**Conclusion for §4/§5**: `HassPanelAdapter` needs **zero code changes** to work in a card. The thing that must change is the *owning* layer — not "one adapter per element" (panel.ts's pattern) but "one adapter+Planner per `hass.connection`, shared by every mounted card instance."

Sources: `src/panel.ts`, `src/ha-panel-adapter.ts` (read directly), [Custom card — HA Developer Docs](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/).

### 2.5 Multiple card instances — cost & recommended architecture

| Option | Cost | Verdict |
|---|---|---|
| A. One `Planner` + `HassPanelAdapter` **per card element** | N WS `state_changed` subscriptions, N full derived-state recomputations (fusion, weather polling, BLE solve timers, MQTT bridge, avatar-pack hydration...) for the SAME underlying HA connection and (usually) the SAME store/config. Planner also opens `setInterval` polls (Open-Meteo, calendar, repairs) — N cards = N redundant pollers hammering the same free APIs. | Rejected — wasteful and, worse, **inconsistent**: two cards showing the same floor could show subtly different simulated/eased state (independent RNG seeds, independent spring integrators) since nothing tied them together. |
| B. One **shared, module-level `Planner`** per `hass` connection, reference-counted by mounted card instances | One WS subscription, one weather/BLE/MQTT pipeline, total cost independent of card count — matches how `<diorama-app>` already serves **both** `<diorama-canvas-2d>` and `<diorama-three-view>` off one `Planner` today (2D RAF keeps running hidden while 3D is up, per CLAUDE.md). N cards become N more *views* of the one source of truth, which is exactly the existing app/component boundary already proven at two-views-of-one-planner. | **Recommended.** |

Recommended shape: a module-scope `Map<HassLikeConnection, Planner>` (or simpler — since a browser tab has exactly one HA connection object identity for its whole life, a single module-level `let sharedPlanner: Planner | null` is sufficient; a `WeakMap` keyed on the connection object is the defensive version in case HA ever reconnects with a new object). Each `<diorama-card>` instance's `set hass()` calls a shared `getOrCreatePlanner(hass)` helper (new file, e.g. `src/card-shared.ts`) that lazily constructs the `Planner` + `HassPanelAdapter` on the FIRST card mount and returns the same instance to every subsequent card. A simple mount counter releases nothing on the last card unmounting (mirrors the panel's own "never torn down, just the DOM view goes away" behavior — cheap enough to keep alive for the tab's life, and avoids the churn of tearing down/rebuilding the WS subscription every time the user flips dashboard views).

### 2.6 Interaction expectations in a card

| Concern | Prior art / contract | Diorama implication |
|---|---|---|
| Touch/scroll capture | `floor3d-card`'s own README states plainly: *"events in iOS and Android are not yet managed as the events are captured by the OrbitControl of Three.js library"* — i.e. this is a known, still-unsolved friction point in the most directly comparable prior-art card. `plotly-graph-card` ships an explicit `disable_pinch_to_zoom` config flag because its interactive chart otherwise fights the dashboard's own pinch-zoom/scroll. | Diorama's canvases already set `touchAction: 'none'` unconditionally (per CLAUDE.md, "so default touch gestures don't fight orbit/pan") and implement an edge-swipe carve-out for the SIDEBAR specifically — that carve-out is meaningless in a card (no sidebar to swipe open) and should be dropped/no-op'd in card mode. The `touch-action:none` capture itself is a DELIBERATE tradeoff Diorama already made for the panel (full-bleed canvas) and is *correct* for a card too, but must be scoped tightly to the card's own bounding box so a Diorama card embedded in a scrollable masonry column doesn't eat page-scroll gestures that start on/near it. This is the #1 UX risk (see Risks). |
| Fullscreen / "expand to full panel" | No universal HA convention found; common community patterns are (a) `browser_mod`/`kiosk-mode` style full-page popups, or (b) a plain button dispatching HA's own `navigate` action (`this.dispatchEvent` a `hass-action`-style event, or simpler, direct `history.pushState` via `window.location = '#/diorama'`) to the full `panel_custom` page. | Recommended: a small ⤢ icon-button overlay (top-right, matching the 3D view-controls bar's existing chrome idiom) that navigates to `/diorama?floor=<f>&view=<v>&mode=<uiMode>` — i.e. it hands off to the *existing* `_applyUrlParams` URL-template machinery already built for kiosk links (`Planner.lastCam3d` + the topbar's "Kiosk link" button already mint exactly this URL shape). No new URL scheme needed — the card's config **is** a URL template in object form. |
| `more-info` / entity actions | HA Core 2023.7 introduced the `hass-action` DOM event (`bubbles:true, composed:true`, `detail:{config, action}`) as the sanctioned way for a custom card to trigger `tap_action`/`hold_action`-style behavior (incl. `action:'more-info'`) without hand-rolling the more-info dialog itself. | Diorama's existing click-to-toggle semantics (`toggleItem`/`toggleEntity`) stay as-is for kiosk mode (a tap toggles the device directly, same as the full panel's kiosk behavior) — that's a deliberate, already-shipped UX and shouldn't be replaced by a more-info popup by default. Worth a `compact`/config-level opt so a future `moreInfoOnClick?: boolean` could route through `hass-action` instead, but that's an enhancement, not v1 scope. |

Sources: [`floor3d-card` README](https://github.com/adizanni/floor3d-card), [`lovelace-plotly-graph-card` README](https://github.com/dbuezas/lovelace-plotly-graph-card), [Action event for custom cards — HA Developer blog, 2023-07-07](https://developers.home-assistant.io/blog/2023/07/07/action-event-custom-cards/).

### 2.7 Prior art

| Card | Relevant technique | Sizing | Editor | Multi-instance notes |
|---|---|---|---|---|
| [`floor3d-card`](https://github.com/adizanni/floor3d-card) (three.js, OBJ/MTL import, closest analog to Diorama's 3D view) | Supports both "panel mode and regular" card mode from the same build; persists camera pose in config (`camera position/rotation/target`), same idea as Diorama's `Store.views3d`. Documented touch/OrbitControls friction (§2.6). | Not documented precisely (no `getGridOptions`/`getCardSize` detail surfaced) — a real risk area to test against, not copy. | Visual editor + YAML mode. | Not documented. |
| [`lovelace-plotly-graph-card`](https://github.com/dbuezas/lovelace-plotly-graph-card) (Plotly.js, canvas/WebGL renderer under the hood) | Explicit `scrollZoom`/`disable_pinch_to_zoom` config flags to resolve the exact touch-capture conflict flagged in §2.6 — a config *opt-out* rather than a hard-coded capture, which is a reasonable pattern Diorama could mirror later (`Store` already has this shape for other opt-outs). | Reuses the built-in History card's editor rather than shipping a bespoke one for simple configs; falls back to YAML for advanced options — validates the "hybrid `getConfigForm()` + hand-rolled editor" split recommended in §2.2/§6. | Visual editor (borrowed) + YAML. | Not documented. |
| `custom-cards/boilerplate-card` (reference scaffold, not a real product card) | The canonical "how to wire `type`, `customCards.push`, `getConfigElement`, dynamic `import('./editor')`" skeleton every tutorial points at. | Minimal/default `getCardSize()` only (predates `getGridOptions()`). | Dedicated editor element, dynamically imported (keeps the editor code out of the main card bundle — same lazy-chunk instinct as Diorama's three-renderer split). | N/A (template). |

---

## 3. Diorama-specific design

### 3.1 Third Vite entry

`vite.config.ts` changes (additive, both existing entries untouched):

```ts
rollupOptions: {
  input: {
    main: resolve(__dirname, 'index.html'),
    panel: resolve(__dirname, 'src/panel.ts'),
    card: resolve(__dirname, 'src/card.ts'),          // NEW
  },
  output: {
    entryFileNames: chunk =>
      chunk.name === 'panel' ? 'diorama-panel.js' :
      chunk.name === 'card'  ? 'diorama-card.js'  :    // NEW
      'assets/main.js',
    chunkFileNames: 'assets/[name].js',
    assetFileNames: 'assets/[name][extname]',
  },
},
```

- `chunkVersionQuery` needs **no changes** — it operates on `bundle` entries generically (§2.3).
- `haDeploy` needs **no changes** — it copies the whole `dist/` tree regardless of entry count.
- **Chunk sharing is automatic** as long as `card.ts` imports the SAME specifiers as `three-view.ts`/`canvas-2d.ts` (`./ui/three-view.js`, `./ui/canvas-2d.js`, `../planner.js`, …) rather than re-implementing or re-exporting them — Rollup content-addresses shared chunks by module graph, so `three-renderer.js` (the ~600 kB lazy three.js chunk) stays ONE chunk shared by `main.js`, `diorama-panel.js`, and `diorama-card.js` alike, still only downloaded when a 3D view actually mounts.
- `chunkSizeWarningLimit: 800` stays as-is (unaffected by entry count).
- `hacs.json`'s `homeassistant: "2024.6.0"` minimum predates the sections-view grid-options API's stabilization — **flagged as an open question** (§7): either bump the manifest minimum, or accept that pre-sections HA versions get the `getCardSize()`/masonry fallback only (graceful, not broken).

### 3.2 `<diorama-card>` element

```ts
// src/card.ts
import { Planner } from './planner.js';
import { HassPanelAdapter } from './ha-panel-adapter.js';
import { injectSharedStyles } from './styles.js';
import { getOrCreatePlanner } from './card-shared.js';   // NEW, §3.3
import './ui/define.js';
import './ui/canvas-2d.js';
import './ui/three-view.js';
import './ui/weather-chip.js';
import './ui/compass.js';
import type { DioramaCardConfig } from './card-config.js';  // NEW, shared with editor
```

Config schema (all optional; every field maps onto EXISTING machinery — no new Planner state):

```ts
interface DioramaCardConfig {
  type: 'custom:diorama-card';
  floor?: string;               // name or id — same match as ?floor= (app.ts _applyUrlParams)
  view?: '2d' | '3d';           // same as ?view=
  mode?: 'kiosk' | 'view';      // NEVER 'edit' — setConfig rejects/clamps 'edit'
  layers?: string;              // preset name/id, or 'simple' | 'full' — same as ?layers=
  view3d?: string;              // saved view name/id — same as ?view3d=
  cam?: [number, number, number, number, number, number]; // same as ?cam=
  compact?: boolean;            // hides the 3D view-controls overlay bar + weather chip
}
```

- `setConfig(config)` builds a **URL-template object** (`Planner.urlTemplate`) identical in shape to what `app.ts._applyUrlParams` already parses from `?floor=/?layers=/?view3d=/?cam=` — the card is, semantically, a *kiosk URL expressed as YAML instead of query string*. Reuse `_applyUrlParams`'s retry-on-config-load logic (extract it to a shared, planner-only helper both `app.ts` and `card.ts` call, since the store loads async in both cases) rather than duplicating the 20 s-retry polling.
- `mode` **always** resolves to `kiosk` or `view` — `setConfig` throws (surfacing HA's red error card, §2.1) if the user writes `mode: edit`, since a card must never expose the editor/sidebar/save-to-HA path.
- No `<diorama-app>`. The card hosts `<diorama-canvas-2d>`/`<diorama-three-view>` directly, toggling on `p.view` exactly like `app.ts`'s render does (copy that one ternary, not the whole component) — no topbar (irrelevant chrome — floor/view switching is config, not live UI, in a card), no sidebar (edit-only anyway, would never render under kiosk/view), no toolbar (`toolbar.ts` already self-suppresses outside `edit` per its own `if (p.uiMode !== 'edit') return nothing;` guard — mounting it costs nothing extra, but there's no reason to pay even that). `<diorama-weather-chip>`/`<diorama-compass>` stay (small, self-gating on config, useful in a room card) unless `compact: true` hides them.
- Suppressed chrome, concretely: topbar, sidebar, bottom toolbar, all modals (`diorama-floor-modal`, `diorama-entity-picker`, `diorama-light-config`, `diorama-media-config`, `diorama-alarm-modal`, `diorama-thermostat-modal`, `diorama-settings-drawer`), the bottom-right floor-stats readout (config-gated, but pointless in a small card — force it off regardless of `Store.showFloorStats` when `compact`).
- `getCardSize()`: return based on `view` (`3d` wants more vertical room than `2d`) — e.g. `3` (150 px) for `2d`, `5` (250 px) for `3d`.
- `getGridOptions()`: `{ rows: view==='3d'?5:4, min_rows: 3, max_rows: 12, columns: 'full', min_columns: 6 }` — a floor plan reads badly in a narrow column; `min_columns: 6` (half a 12-col section) is a reasonable floor.

### 3.3 Planner-sharing (`src/card-shared.ts`, new)

```ts
let sharedPlanner: Planner | null = null;
let sharedAdapter: HassPanelAdapter | null = null;
let mountCount = 0;

export function getOrCreatePlanner(hass: HassLike): Planner {
  if (!sharedPlanner) {
    sharedAdapter = new HassPanelAdapter();
    sharedPlanner = new Planner();
    sharedPlanner.connectWith(sharedAdapter);
  }
  sharedAdapter!.attach(hass);   // no-op after the first real call — see §2.4
  return sharedPlanner;
}
export function noteCardMounted(): void { mountCount++; }
export function noteCardUnmounted(): void { mountCount = Math.max(0, mountCount - 1); }
```

- `save()` must stay disabled for every card-owned view: this is **already true for free** — `Planner.save()` no-ops outside `edit` mode, and `setUiMode`/`toggleEntity`/`onCanvasMouseDown` etc. all gate on `uiMode` too (per CLAUDE.md's "UI modes" section). Since `setConfig` clamps `mode` to `kiosk`/`view`, the shared Planner's `uiMode` is whatever the **most recently mounted or interacted-with** card last set it to — this is the one real semantic wrinkle of sharing a single `Planner.uiMode` across card instances that could request different modes (`kiosk` on one card, `view` on another). Two options, both cheap: (a) accept it — `uiMode` is coarse and both non-edit modes already forbid writes, so the practical behavior difference (kiosk allows entity taps, view doesn't) only matters per-*interaction*, or (b) thread an explicit `forceUiMode` param through the click paths so each card enforces its OWN mode locally regardless of the shared Planner's global `uiMode` field. **Recommend (a) for v1** (simpler, matches "kiosk/view are both read-only from HA's perspective" framing) and flag (b) as a fast-follow if real dashboards mix kiosk + view Diorama cards (open question, §7).
- If NO card and NO panel is mounted (pure Lovelace-only install, no `panel_custom` YAML), the shared Planner still needs a first `hass` to bootstrap from — the first `<diorama-card>` to mount does this naturally via its own `set hass()`.
- If BOTH a panel and cards are present in the same tab, they are, by construction, DIFFERENT `Planner` instances today (`panel.ts` owns its own private `_planner`/`_adapter`, `card-shared.ts` owns a separate module-scope pair) — unifying those into one truly global singleton is possible (they'd both resolve through `getOrCreatePlanner`) but out of scope for the first card cut; flagged as a phase-2/3 consolidation (§8, open questions) since the panel and any given card may legitimately want independent view state (different floor/view) simultaneously on screen, similar to how `<diorama-canvas-2d>` and `<diorama-three-view>` already independently size themselves off one shared `Planner`.

### 3.4 Sizing / resize plumbing

- `canvas-2d.ts` and `three-view.ts` already use `ResizeObserver` (`this._ro = new ResizeObserver(() => this._resize())`, observing both the canvas and its parent) — this machinery needs **no changes** to work inside a card; a card's content box resizing (window resize, sections-view column reflow, or the user dragging a section's row-span) fires the same observer callback path already exercises today when the sidebar opens/closes.
- `canvas-2d._resize()` already guards `if (w < 4 || h < 4) return; // hidden — skip, don't shrink to default` — this exact guard is what protects a card from garbage sizing during the brief window between DOM insertion and the grid/masonry layout settling on a final box.
- **Known risk at ~300 px card widths** (not covered by any web source — a Diorama-specific test needed): the 3D overlay button bar (`three-view.ts`'s top-left row of Iso/Top/Front/Back/Left/Right/Sims/🏠/🎥/🎬 buttons, `flex-wrap:wrap`) is sized for a full panel and will wrap to several rows, eating vertical space a `getGridOptions` `min_rows: 3` (~168 px + gaps) box doesn't have. `compact: true` should hide this whole bar (it's already a `flex-wrap` div in `three-view.render()`, trivial to gate behind a new `@property() compact` on `ThreeView` reusing the same conditional the weather-chip mount already uses in `app.ts`). The bottom-left "⟳ Reset view" button on `canvas-2d.ts` has the same problem at small width and should likewise gate on `compact`.
- No change needed to the `chunkVersionQuery`/lazy-import split (§3.1) — a card mounting `<diorama-three-view>` triggers the exact same `await import('../three-renderer.js')` in `firstUpdated` that the panel/standalone app already does, so a 2D-only card (`view: '2d'`, never mounting `<diorama-three-view>`) still never downloads the three.js chunk.

### 3.5 Editor

- `getStubConfig()`: `{ view: '2d', mode: 'kiosk' }` (safest possible default — read-only-ish kiosk, first/current floor, 2D).
- `getConfigElement()` returns a hand-rolled `<diorama-card-editor>` (dynamically imported, boilerplate-card idiom, keeps editor code out of the card's own chunk) rather than a pure `getConfigForm()`, because the **floor picker's OPTIONS depend on the live store** — which isn't loaded synchronously the way `hass`'s entity list is. The editor:
  1. On `set hass(h)`, calls the SAME `getOrCreatePlanner(h)` (§3.3) the card itself uses — the editor piggybacks on whatever Planner a card on the SAME dashboard has already booted, or boots one itself if it's the very first Diorama element the user has placed. This is safe because the editor never calls `save()`/mutates the store, only reads `planner.store.floors` for the dropdown.
  2. Renders plain `<select>`/`<input>` rows for `floor` (populated once `planner.store.floors.length` is truthy — shows "(loading…)" until then, same async-tolerant pattern `_applyUrlParams` already uses for the `?floor=` retry window), `view`, `mode`, `layers`, `view3d`, `compact` — a hand-rolled equivalent of `ha-form`'s selectors, since `ha-form` itself can't await the floor list.
  3. Fires `config-changed` (`{bubbles:true, composed:true, detail:{config}}`) on every field change, per §2.2.
- `window.customCards.push({ type: 'diorama-card', name: 'Diorama', description: 'A live spatial floor plan / 3D room view.', preview: true })` at module scope in `card.ts`.

### 3.6 HACS / docs

- No `hacs.json` changes required (§2.3) beyond, optionally, bumping `homeassistant` past whatever version fully stabilized `getGridOptions()` (§7 open question — the current `2024.6.0` floor should be re-verified against the actual frontend release that shipped it, not assumed).
- README gets one new manual step mirroring the existing panel-registration step 3, e.g.:

  > **Optional: add the Lovelace card**
  > Settings → Dashboards → ⋮ → Resources → Add resource:
  > URL `/hacsfiles/diorama/diorama-card.js`, type **JavaScript Module**.
  > Then add a card anywhere: `type: custom:diorama-card`.

- `docs/GUIDE.md` gets a short "Card mode" section documenting the config schema table from §3.2 and the expand-to-panel button behavior from §2.6.

### 3.7 Phased build order

| Phase | Deliverable | Test slice |
|---|---|---|
| **C1 — bare card, no editor** | `src/card.ts` entry, `<diorama-card>` mounting `<diorama-canvas-2d>` only (2D-only, no `view` config yet, no editor, no `getGridOptions`), `getOrCreatePlanner` shared-Planner helper, `getCardSize()` fixed at `3`. `window.customCards` registration. | New harness `test-pages/card-test.html`: constructs `<diorama-card>` in a plain `<div>` with a **fake `hass`** object (states + a stub `connection` matching `HassLike`, mirroring the existing config-test/undo-test fake-HaApi pattern), `setConfig({})`, asserts the canvas renders + `getCardSize()` returns a number. Two card instances over the SAME fake hass assert `getOrCreatePlanner` returns the identical `Planner` (reference equality) and only ONE `subscribeEvents` call was made. |
| **C2 — full config surface + sizing + editor** | `floor`/`view`/`mode`/`layers`/`view3d`/`cam`/`compact` config fields wired through the shared URL-template helper (extracted from `app.ts._applyUrlParams`); `<diorama-three-view>` mounting on `view:'3d'`; `getGridOptions()`; `compact` chrome suppression (§3.4); hand-rolled `<diorama-card-editor>` + `getStubConfig()`. | Extend `card-test.html`: assert `mode:'edit'` throws from `setConfig`; assert a `floor:` config applies once the store loads (poll, mirroring `_applyUrlParams`'s own retry test posture); assert `compact:true` hides the 3D button bar / reset-view button; mount the editor standalone, change a field, assert a `config-changed` event fires with the expected detail. |
| **C3 — packaging, polish, prior-art parity** | Third Vite entry wired into `vite.config.ts` (verify `chunkVersionQuery`/chunk-sharing with a real `npm run build` — assert `dist/diorama-card.js` exists, assert `dist/assets/three-renderer.js` is NOT duplicated, i.e. one chunk file shared by all three entries); expand-to-panel ⤢ button (§2.6); README + GUIDE docs (§3.6); `hacs.json` minimum-version re-check (§7). | A build-output assertion script (grep `dist/` for exactly one `three-renderer*.js`); manual smoke test in a real HA sections-view dashboard at a few card widths (300 px / half-section / full-width) per the §3.4 risk. |

---

## 4. Open questions for the orchestrator

1. **`hacs.json` minimum HA version**: `2024.6.0` needs re-verification against whichever frontend release actually stabilized `getGridOptions()`/sections-view card sizing (this pass could not pin an exact version number from primary sources — HA's own docs describe the *current* behavior without a changelog-style "since X.Y" annotation). Worth a dedicated check before shipping C2.
2. **Mixed `mode` across simultaneously-mounted cards** (§3.3): is silently sharing one `Planner.uiMode` across a `kiosk` card and a `view` card on the same dashboard acceptable, or does it need the `forceUiMode`-per-click-path plumbing? Affects how much extra wiring C1/C2 need.
3. **Panel + card Planner unification**: should `panel.ts` and `card-shared.ts` eventually resolve to the literal same singleton (one Planner total per tab, shared by panel AND every card), or is keeping them independent (current design) actually preferable so a card's floor/view selection never fights the user's live panel navigation? No prior-art precedent found either way.
4. **`compact` scope**: does `compact` only suppress the 3D button bar + weather chip/compass (as designed in §3.2/§3.4), or should it also suppress click-to-toggle interaction entirely (pure display card, `mode` forced to `view` regardless of config)? Product call, not a technical constraint.
5. **Touch capture inside a scrollable dashboard** (§2.6, top risk): `touch-action:none` on the card's canvas is proven correct for a full-bleed panel but UNTESTED at card scale where the user's thumb starts a gesture partly over the card and partly over page chrome. No prior-art card fully solves this (floor3d-card documents it as an open problem); may need a "long-press to arm orbit" gesture gate as a fast-follow if plain `touch-action:none` proves too aggressive in real dashboards.
6. **`more-info` / `hass-action` adoption**: v1 keeps Diorama's existing tap-to-toggle kiosk semantics (§2.6) rather than routing through HA's more-info dialog. Confirm this is desired before a user reports "tapping a light in the card doesn't show HA's info dialog like every other card does."

---

## 5. Sources

- [Custom card — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/)
- [Action event for custom cards — HA Developer blog, 2023-07-07](https://developers.home-assistant.io/blog/2023/07/07/action-event-custom-cards/)
- [Sections — home-assistant.io](https://www.home-assistant.io/dashboards/sections/)
- [A Home-Approved Dashboard chapter 1 — home-assistant.io blog, 2024-03-04](https://www.home-assistant.io/blog/2024/03/04/dashboard-chapter-1/)
- [Grid card — home-assistant.io](https://www.home-assistant.io/dashboards/grid/)
- [Plugin (Dashboard) — HACS docs](https://hacs.xyz/docs/publish/plugin/)
- [`custom-card-helpers`](https://custom-cards.github.io/custom-card-helpers/)
- [`custom-cards/boilerplate-card`](https://github.com/custom-cards/boilerplate-card)
- [`adizanni/floor3d-card`](https://github.com/adizanni/floor3d-card)
- [`dbuezas/lovelace-plotly-graph-card`](https://github.com/dbuezas/lovelace-plotly-graph-card)
- [`getConfigForm()` community thread](https://community.home-assistant.io/t/getconfigform-configure-editor-for-custom-card/845004)
- [Sergio Carracedo — Creating custom cards for Home Assistant](https://sergiocarracedo.es/ha-custom-cards/)
- Repo-internal: `src/panel.ts`, `src/ha-panel-adapter.ts`, `src/ui/app.ts`, `src/ui/toolbar.ts`, `src/ui/canvas-2d.ts`, `src/ui/three-view.ts`, `src/styles.ts`, `vite.config.ts`, `hacs.json`, `README.md`, `CLAUDE.md`.
