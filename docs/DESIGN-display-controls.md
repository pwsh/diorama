# DESIGN — Display & Controls arc (InfoCard, generic controls, weather display+alerts)

*Authored 2026-07-17 (Fable). Status: **shipped**.*

Builds the cluster the user picked as the next arc, straight from the four
build-ready research docs (each carries the authoritative §4 design + §5
integration checklist — this doc stitches them together and pins the
cross-cutting decisions):

- `docs/research/entity-value-display.md` → **InfoCard** fixture
- `docs/research/generic-action-control.md` → **ActionButton** fixture
- `docs/research/generic-logical-light.md` → logical-state lights
- `docs/research/weather-forecast-display.md` + `weather-alerts.md` →
  weather chip upgrades (position/content/forecast) + alert surfaces

## Cross-cutting decisions (pinned)

1. **One shared rule engine** (`src/value-rules.ts`, pure, three-free —
   importable by geometry consumers, canvas-render, the renderer chunk, AND
   sidebar): `ValueRule { op: 'lt'|'lte'|'gt'|'gte'|'eq'|'neq'|'between'|
   'contains'|'regex'; value: number|string; value2?: number;
   color?: string; flash?: boolean; label?: string }`;
   `evalRules(rules, raw): { color?, flash?, label? }` — first matching rule
   wins; numeric ops coerce (`parseFloat`, NaN → no match), string ops
   compare raw state. Both InfoCard (value→color) and logical lights
   (state→on/color/flash) consume THIS engine — no second rule syntax.
   Deterministic + test-paged.
2. **Formatting** (`formatEntityValue` in value-rules.ts): precision,
   unit override/hide, prefix/suffix, `mapping` (state string → display
   string, e.g. on→Open), relative-time mode (for timestamps), and the
   entity-free **clock/date mode** (`source: 'clock'`, format tokens per
   the research doc). Respects `store.imperial` where unit-aware.
3. **Fixture recipes**: InfoCard and ActionButton are new per-floor arrays
   (`Floor.infoCards`, `Floor.actionButtons`) following the canvas-fixture
   recipe verbatim (types → geometry defaults → canvas-render + drawAll →
   canvas-hit → canvas-interact (drag/place/delete/cursor) → sidebar
   section + TOOLS → 3D group + dirty key + setLayerVisibility +
   clearTransientGroups/destroy). Both ride the **sensors** layer? NO —
   InfoCard gets its own `info` layer key (it's display furniture, users
   will want to declutter); ActionButton rides `switches` (it IS a
   control). Logical lights are NOT a new fixture — `Light` grows an
   optional `logic` config.
4. **3D text**: canvas-texture sprites/planes via the established
   env-sprite idiom (`_makeTextSprite` family), repainted only on text/color
   change, `_disposeSpriteMaps` pairing everywhere. InfoCard supports
   `billboard?: boolean` (default true = camera-facing sprite; false = flat
   plane at `rotation` for wall/table mounting).
5. **Live/slow routing**: InfoCard + logical-light + ActionButton bound ids
   are config-path (`_isSlowEntity`) scoped to current-floor bound ids;
   flash animation is renderer-side per-frame (state read via provider) so
   no per-frame emit. InfoCard values that update fast still repaint only
   on change (text compare).
6. **Kiosk semantics**: ActionButton presses work in kiosk (device
   interaction), refused in view; unbound buttons flip `localState` with a
   press animation (save() no-ops outside edit — session-only, honest).
   InfoCards are display-only everywhere.
7. **Weather config growth** stays inside `Store.weather` (`WeatherConfig`)
   — no new store roots: `chipAnchor` ('tl'|'tm'|'tr'|'bl'|'bm'|'br',
   default 'br') + `chipCustom {x,y}` px offsets, `chipContent`
   (flags: current, apparent, humidity, wind, hourly (N), daily (N)),
   `alerts { entityId?, mode }`. Forecast DATA plumbing exists
   (`getWeatherForecasts`, `_refreshEntityForecasts`) — the display
   consumes the already-fetched daily/hourly arrays; Planner caches the
   full normalized arrays (`Planner.forecastDaily/hourly`) instead of only
   folding rainSoon/condition.
8. **Alerts**: normalize per `weather-alerts.md` §2.7 (`WeatherAlert
   {event, severity: advisory|watch|warning, headline?, expires?}`), source
   = a user-picked alert entity (NWS Alerts / MeteoAlarm / DWD / EnvCanada
   shapes auto-detected best-effort; parse defensively, null on anything
   odd). Surfaces: the chip gains a severity-tinted badge; expanding the
   chip shows headline(s); a 3D ambient beacon effect (severity-scaled sky
   tint pulse) gated by the existing weatherFx layer + effects master. HUD
   banner from the research doc is DEFERRED to keep the batch bounded —
   the chip badge + expanded panel carry v1.

## Batches

- **DC-A**: `value-rules.ts` engine + InfoCard end-to-end (+ test page
  `value-rules-test.html` for the pure engine + an infocard section in a
  fixture test page). Files: types, geometry (defaults), value-rules.ts,
  canvas-render/hit/interact, sidebar, three-renderer group + key,
  three-view key, planner (arrays in repairFloor/defaultFloor, slow-path).
- **DC-B** (after A — consumes the rule engine): ActionButton fixture +
  Light.logic (sidebar rule editor rows shared between them; logical
  lights resolve `effectiveState`-equivalent through evalRules and feed
  the EXISTING light rendering — the renderer sees a resolved on/color,
  keeping the change planner/adapter-side where possible per the research
  doc). Press animation 2D+3D; dispatch via `callService` (script/scene/
  button/select service per domain, research §2.1 table).
- **DC-C** (parallel with A): weather chip anchor/custom position +
  content flags + forecast rows (chip expands into a small panel;
  Planner.forecastDaily/hourly caching; Open-Meteo path already returns
  hourly/daily — extend its parse if fields are missing). Files: weather.ts,
  planner.ts (forecast cache), weather-chip component, settings Weather tab.
- **DC-D** (after C): weather alerts (normalizer + chip badge/panel +
  3D beacon). Files: weather.ts (parse), planner (alert entity slow-path +
  runtime alert state), chip, three-renderer beacon under weatherFx,
  settings Weather tab source picker.

Verification: typecheck/build; test pages value-rules-test (pure engine
matrix), extend weather-test for forecast/content/alert parsing; fixture
behaviors asserted in a new `infocard-test.html` (env-sprite idiom harness)
where deterministic. Ship the whole arc as one batch train (commit+push+
deploy per batch or at arc end per pace).

Gotchas: new Floor arrays MUST land in repairFloor + defaultFloor;
`Store.weather` fields must flow through `_loadFromHa`'s existing
`weather:` passthrough (verify it's whole-object); sprite maps disposed via
`_disposeSpriteMaps` before every clear; chip is mounted once in app.ts's
shared container — anchor styles must not collide with the 3D controls bar
(the reason it lives bottom-right today); alert entities may be absent →
everything null-safe; no new store roots.
