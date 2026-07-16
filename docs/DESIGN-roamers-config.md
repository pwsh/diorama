# DESIGN — Roaming avatars, multi-configuration, offline standalone

*Authored 2026-07-16 (Fable). Status: **in build** (3 batches A/B/C).*

## A. Persistent roaming AI avatars

A **roamer** is a display-only AI presence that lives in the config (not
bound to any sensor) and wanders the whole floor with a preference for
interior activities. Unlike motion-sensor AI avatars (home-room confined,
gated on binding/demo), roamers are free-range and always on when enabled.

- **Data** (`types.ts`): `Roamer { id: string; name?: string;
  avatarKind?: AvatarId | 'random'; avatarKinds?: AvatarId[];
  plumbobColor?: string; color?: string; enabled?: boolean  // absent = on
  }` on `Floor.roamers?: Roamer[]` (per-floor — they roam THIS canvas).
  Backfill `[]` in `repairFloor` + `defaultFloor`.
- **Avatar selection = the motion-sensor model exactly**: the sidebar reuses
  `_avatarGrid` (writes `avatarKinds`); resolution via the existing
  `resolveAvatar` — a multi-selection stably hash-picks per roamer (and
  re-rolls on respawn via `avatarFromPool`), a single selection uses that
  one, none/invalid falls back to the **default avatar (adult)**. No new
  resolution code.
- **Runtime**: three-view appends synthetic targets `key: 'roam_<id>'`
  (`TargetWorld.ai: true` + new optional `roam?: true`) for the current
  floor's enabled roamers, in ALL UI modes (display presence, like demo
  avatars). Identity color = `roamer.color` else the default target tint;
  plumbob per `plumbobColor`.
- **Controller** (renderer AI controller): `roam` targets skip home-loop
  confinement (roam their whole nav region) and use an **interior-activity
  goal bias**: each goal roll picks ~50 % an activity anchor / sit spot
  (dwell systems then capture — sitting, TV, appliances), ~35 % a random
  free cell INSIDE any closed wall loop, ~15 % anywhere in the region
  (porch/yard excursions stay possible). Descend/emerge stair behaviors
  (v1) apply as to any AI rig. Everything downstream (nav, activities,
  bubbles, fidgets, despawn) is unchanged.
- **Sidebar**: new `_section('roamers', 'Roaming avatars', …)` — list rows
  (name input, enabled toggle, plumbob color row, avatar grid, delete) +
  "+ Add roamer". No canvas placement (they spawn like AI avatars).

## B. Multiple configurations + complete export

### Config registry (storage layer)

Today: one store at HA `user_data` key `diorama` + localStorage cache.
New model — an **index** + per-config **bodies**:

- Index at user_data key **`diorama-configs`**:
  `{ version: 1, activeId: string, configs: [{ id, name, updatedAt }] }`.
- Bodies at **`diorama-cfg-<id>`** (full `Store` JSON each).
- **Migration** (first load, index absent): read legacy `diorama` key →
  becomes config `{id:'default', name:'Default'}` (body copied to
  `diorama-cfg-default`), index written. Legacy key is left in place but no
  longer written (old panel versions still find their data).
- localStorage mirrors: `diorama:store:v1` remains the ACTIVE body cache
  (instant paint, unchanged key = no cache migration); plus
  `diorama:configs` (index cache) and the index's `activeId` is the
  **last-active selection restored on next load** (HA-synced; kiosk/view
  modes cannot switch — settings tabs are edit-only).
- `Planner.save()` writes the active config's body key. New planner API:
  `listConfigs()`, `switchConfig(id)` (load body → swap store → full
  emitConfig + view reset like floor switch), `saveConfigAs(name)` (clone
  current store under a new id, switch to it), `renameConfig`,
  `deleteConfig(id)` (never the last one; if active, switch to first
  remaining), `importConfig(json, name?)` (ADDS to the list + switches).

### Settings ▸ Configurations (Data tab, top block)

Dropdown of configs (active selected) + **Save** (explicit write now),
**Save as…** (prompt name), **Import** (file → added to the list + made
active), **Export** (download the active config), **Delete** (confirm()
warning; disabled when only one config exists), inline rename.

### Export envelope (complete + cleanly importable)

`{ diorama: 2, name, exportedAt, store: <full Store>, userAvatarPacks?:
AvatarPackDef[] }` — the full store already carries floors (sensors/motion/
roamers with their avatar pools + every bound entity id), people,
avatarPacks config, weather, geo, layers, custom objects. The envelope adds
the **user-imported avatar pack bodies** (from IndexedDB) so an import on a
fresh browser is self-contained: import writes packs back to IDB +
registers them, then adds the store as a new config. Import ACCEPTS legacy
bare-store JSON too (wraps it). Export must never silently drop a store
field: serialize the WHOLE store object (no field list on export; the
field-list gotcha applies on LOAD, and import routes through the same
`_loadFromHa`-style normalization + `repairFloor`).

## C. Standalone / offline webpage

`index.html` (standalone entry) already runs outside HA's UI but requires a
WS connection + token. Offline mode makes it a true no-HA standalone page:

- **`LocalApi implements HaApi`** (new `src/ha-local.ts`): `getUserData`/
  `setUserData` backed by localStorage (`diorama:local:<key>`); states map
  empty; `subscribe*` no-ops returning unsubscribers; service calls no-op
  (console.debug); registries return `[]`; `getWeatherForecasts`/`getHistory`
  return null/[]. Because the multi-config layer rides `HaApi.get/setUserData`,
  **configurations work offline unchanged** (stored in localStorage).
- Auth screen gains **"Use offline (no Home Assistant)"** → `planner.
  connectWith(new LocalApi())` + a persistent `diorama:offline=1` flag so
  reloads go straight to offline (an "Exit offline mode" action in Settings ▸
  Connection clears it). Everything binding-driven is inert-but-safe
  (`effectiveState` → null; `localState` interactivity still works); roamers,
  demo avatars, unbound fixtures, weather via Open-Meteo (direct fetch), and
  the whole editor run normally.
- Docs: README/STATUS note — serve `dist/` from any static server (or the
  HACS zip unzipped) and open `index.html`; choose offline.

### C — implementation notes (as built)

- `src/ha-local.ts`: `LocalApi implements HaApi` (`readonly offline = true`
  marker). `get/setUserData` back onto `localStorage['diorama:local:<key>']`
  (JSON, guarded, null on absence). A tombstone write (`{}`, from B's
  `deleteConfig`) is stored verbatim and reads back as `{}` — `_loadBody`
  rejects it exactly as with HA; a `null`/`undefined` value REMOVES the slot.
  `connect()` defers (microtask) an initial `connected` + empty full-state
  emit so the Planner's one-time `_loadFromHa` → config-registry load fires,
  matching the WS boot shape. States empty; `subscribe*`/service calls/
  registries all inert (service + `updateEntityRegistry` `console.debug`).
  Also exports the pure `shouldStartOffline(storage?)` helper (reads
  `OFFLINE_FLAG_KEY = 'diorama:offline'`, guarded → false).
- `Planner.isOffline` getter reads the `offline` marker off the active HaApi.
- Auth screen: "Use offline — no Home Assistant" button below a divider →
  sets `diorama:offline='1'` + dispatches `connect-offline`; `app.ts`
  `_launchOffline()` wires `connectWith(new LocalApi())` (mirrors panel-mode
  adoption). Startup: `app.connectedCallback` runs `shouldStartOffline()`
  BEFORE the token check, but only inside the `!this._planner` branch — panel
  mode adopts a Planner first, so the offline flag never touches panel_custom.
- Exit path: Settings ▸ Connection renders an "Offline mode" note + "Exit
  offline mode" button (clears the flag + reload) when `isOffline`, hiding the
  URL/token/Save/Clear controls. Topbar shows a neutral **Offline** pill
  instead of the connection status.
- Degradation: no source changes were needed beyond the above — the existing
  empty-state paths (entity pickers over `[]` registries, sensor discovery /
  BLE / Bermuda no-ops, `haBaseUrl` → `''`, `effectiveState`/`toggleItem`
  local control, weather Open-Meteo direct fetch) all tolerate LocalApi as-is.
  `save()` in edit mode writes through `LocalApi.setUserData` to localStorage.
- Tests: `test-pages/offline-test.html` (`OFFLINE PASS 27/27`) drives the REAL
  LocalApi + a real Planner (user_data roundtrip incl. tombstone/null; connect
  + migrate + save/switch/saveAs; reload restores active config; callService/
  toggleEntity no-op; `effectiveState`+`toggleItem` local control;
  `shouldStartOffline` matrix).

## Batches

- **A** — roamers (types/storage/planner/three-view/renderer bias/sidebar +
  `roamer-test.html`).
- **B** — config registry + Settings Configurations UI + export envelope
  incl. user packs (+ `config-test.html`).
- **C** — LocalApi + offline auth path + docs (+ coverage in config-test).

Gotchas: index/body keys go through BOTH HaApi impls (they already have
get/setUserData — verify arbitrary keys); `Floor.roamers` in repairFloor;
roam targets must not enter fusion/BLE paths; save() debounce applies per
body; deleting the active config must not orphan localStorage cache;
offline flag must never block the normal auth path.
