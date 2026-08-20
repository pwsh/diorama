# mmWave technical editor + presence history

Design for two related features, plus the upstream/dependency review that
accompanied them. Written 2026-08-19 from three research passes (repo surface
audit, ESPHome/HA changelog review, storage/rendering feasibility).

Companion docs: `docs/DESIGN-world.md` (identity fusion, GPS), `CLAUDE.md`
(architecture; the churn / slow-path rules below are load-bearing there).

---

## A. Why

The mmWave surface today is edited **inside the floor plan**: zone drawing is a
latch over the main 2D canvas at 1:1 world scale (`startZoneEdit` forces
`setView('2d')`), and device settings are five controls buried in a collapsed
sidebar sub-block. That is fine for placing a sensor and wrong for *tuning* one
— the job wants a dense readout, a sensor-local frame, and every knob the
device actually exposes.

The audit found the gap is wider than the UI:

- **Discovered but never surfaced anywhere**: radar processing time, the
  processing-too-slow flag, per-zone still-count and moving-count, and target
  `angle`. `angle_id` is fully dead — the "dir" in the canvas tooltip is a
  locally computed `atan2`, not the device's own report.
- **`presence_target_count`** is read only as a battery-badge fallback, never
  shown as a number.
- **Discovery is a fixed regex set.** Anything the firmware exposes under a
  different name — a `select.*` mode, a `button.*` restart, a firmware-version
  `text.*` — is invisible: not read, not listed, not bindable. `select` and
  `button` have zero dispatch sites in the whole codebase.
- **`Sensor.heading` and `number.<slug>_mount_angle` are decoupled.** The app
  field drives the zone-drawing frame; the device field drives only the 3D pose.
  They can silently disagree and nothing says so.

## B. What "faster refresh" can and cannot mean

The user asked for "more frequent refreshes from the sensor". The audit is
unambiguous: **Diorama applies no rate limiting to target positions at all.**
`updateLerpGoals()` reads `hass.states` fresh on every call and is driven by the
2D canvas RAF at ~60 Hz; `stepLerp`'s ω=9 spring is a *display* smoother, not a
freshness limiter. Target `sensor.*`/`binary_sensor.*` entities never enter
`_isSlowEntity` and are always live-path.

So there is no throttle to remove. The achievable wins are:

1. **Show the un-smoothed truth.** The editor reads `LerpSlot.tx/ty` (the
   spring's goal — the raw HA value) and displays it numerically at push
   cadence, alongside the eased `cx/cy`, so the report-vs-display gap is
   legible. This is the `showRealPositions` contract extended to numbers.
2. **Surface the real cadence.** Measure and display observed push rate and
   time-since-last-update per target, so "is my sensor slow?" is answerable
   rather than guessed.
3. **Reach the device knob if it exists.** Any firmware update-interval control
   is unreachable today only because discovery can't see it (§A). Generic device
   enumeration fixes that as a side effect.

What is **not** available: ESPHome's `batch_delay` (default 100 ms, settable to
0 for real-time) governs the ESPHome→HA hop and is a firmware-side YAML setting;
it is not reachable from a browser panel and does not affect HA→panel delivery.
No new HA WebSocket mechanism landed in the last 12 months that beats
`state_changed` for this. Worth stating in user docs so the question stops
recurring.

## C. The editor

New component `<diorama-mmwave-editor>` in `src/ui/mmwave-editor.ts`, following
the established modal idiom (light DOM, `planner` property, `show(sensorId)` +
`open`, mounted once in `app.ts`, opened by a CustomEvent). It is a **large
overlay panel**, not a full-screen takeover — the codebase has no full-screen
precedent and the settings drawer is the nearest shape.

Live repaint follows `<diorama-flight-modal>`: subscribe to **both** the `live`
and `config` planner channels, gate `requestUpdate()` on `this.open`. Live gives
target positions at push cadence with no polling; config gives settings echoes.

Panes:

1. **Live targets** — per target: active flag, raw x/y (`tx/ty`), eased x/y,
   speed, **angle** (finally read), resolution, derived world position, observed
   push rate, age. Raw values are never eased and never room-clamped, preserving
   the `showRealPositions` contract that `real-pos-test` and `confine-test` pin.
2. **Zones** — a **sensor-local canvas** at its own zoom, independent of floor
   pan/zoom: the sensor at origin, its FOV wedge, live target dots, and the
   inclusion/filter polygons as draggable vertices. This is the "independent of
   the layout" ask. Numeric vertex entry stays available alongside.
3. **Objects** — halo x/y/radius with the same local canvas, reusing the
   existing icon picker.
4. **Device settings** — the five known controls, **plus every other entity on
   the bound device**, enumerated generically (see §D) and rendered by domain:
   `number` → input, `switch` → toggle, `select` → dropdown, `button` → press,
   everything else → read-only readout.
5. **Diagnostics** — processing time, too-slow flag, presence, target count,
   per-zone still/moving counts, and a `heading` vs `mount_angle` disagreement
   warning.

### Write discipline (load-bearing)

Zone vertex writes fire one `number.set_value` per axis with **no debounce**
today. That is survivable for occasional numeric edits and unacceptable for a
live-drag editor. The editor must:

- Write on **release**, not during drag — the existing canvas drag already does
  this correctly; the new local canvas must match it.
- Use the **write fence** pattern (`fenceObjectWrite`, a 3 s "don't let the echo
  clobber my write" guard) for zone vertices too. Object halos already have it;
  zones rely only on the coarser `verts.length >= 3` coherence rule.
- Hold `Planner.editZone` (or an equivalent guard) for the duration, because
  **slow-path sync — including the whole zone/object resync — is skipped
  whenever `drag || editZone` is set**, at three call sites. An editor with its
  own edit state that does not set that gate will be silently overwritten
  mid-edit by a firmware echo.

And the undo hazard: `_syncZonesObjects` calls `save()` when a materially
different coherent polygon arrives, which pushes an undo snapshot. Identical
echoes dedupe by JSON equality, so this is safe today; a live-write editor must
not turn it into snapshot spam.

### Discovery must not resurrect the churn regression

`_slowIdPrefixes` scopes `number.<slug>_` / `switch.<slug>_` to **bound**
devices, deliberately, because zone-vertex ids are synthesized on demand and
can't be swept from the store. Generic enumeration (§D) will surface more
entities; any new slow-path rule must stay **scoped to the bound device**.
Reintroducing a blanket `number.*`/`switch.*` rule resurrects the idle-churn bug
that rebuilt the whole 3D floor every few seconds. `churn-test.html` (48/48)
pins exactly this and must stay green.

## D. Generic device enumeration

The fix for "the panel only sees what its regexes predicted" needs no new
`HaApi` capability. `getEntityRegistry()` + `getDevices()` already exist and are
shape-agnostic, and `scanBatteryRegistry()` already demonstrates the pattern:
group every entity by `device_id` rather than by naming convention.

So: keep the regex discovery as the **semantic** layer (it is what maps entities
to *meaning* — this one is target 1's X), and add a generic enumeration as the
**completeness** layer (everything else this device exposes, rendered by domain).
`callService(domain, service, data)` is already generic; `select.select_option`
and `button.press` need dispatch helpers, not new plumbing.

Verified upstream, so this is safe to build on: the LD2450 component's current
entity naming matches `sensor-discovery.ts`'s regexes byte-for-byte as of today.
ESPHome's 2026.1→2026.8 `id`/`name_id` migration is scoped to ESPHome's own web
server URLs and SSE payload, **not** HA `entity_id`s. No action needed.

## E. Presence history + heatmap

### Storage: aggregate, don't log

Naive per-sample logging is a non-starter at any storage location. At 2–10 Hz
per target, ~100 bytes/row, a realistic 3-active-target home produces roughly
**1.5–7.6 GB per month**, growing without bound.

So record **dwell seconds per grid cell**, not trajectories:

- In-memory accumulator per floor, `cellIndex → seconds`, sampled at ~1 Hz from
  the **raw** `LerpSlot.tx/ty` (never the eased `cx/cy` — recording the
  renderer's own smoothing as if it were an observation is a lie).
- Flush the delta every ~60 s, and on `visibilitychange`/unload, into **one
  record per `(floorId, hourBucket)`** holding a sparse cell→seconds map, merged
  additively.

This makes size a function of *cells touched*, not sample rate: ~2 KB per
occupied hour, ~32 KB/day, **under 1 MB/month** — and identical whether the
radar pushes at 2 Hz or 10 Hz. Bucketing by hour in the **key** means range
queries are a handful of direct `get()`s, so the store needs no index and does
not depart from the existing IndexedDB idiom.

**Grid: 200 mm.** Deliberately not the 150 mm nav grid — that constant is tuned
for collision precision against furniture and may change for pathing reasons
that must not silently reshape stored history. 200 mm also roughly matches
LD2450's real positional noise; finer just renders jitter as texture.

### Where it must not go

- **Not HA's recorder.** Nothing in 12 months of HA releases added a
  high-frequency path; guidance is unchanged. Writing GB/month of coordinate
  churn into a database the user manages for unrelated purposes — and cannot
  undo from inside Diorama — is the wrong place for a display feature's data.
  `getHistory` stays a one-off query tool, never a sink.
- **Not the synced `Store`.** `save()` swallows write failures with a
  `console.warn`; the project already shipped a silent-failure bug for oversized
  bg-image dataURLs at ~2.5 MB. Worse, `Store` is *one configuration* —
  export/import/switchConfig serialize the whole thing, so weeks of presence
  history would duplicate into every copy. Telemetry is not configuration.

New store `diorama-history` in `src/history-store.ts`, following
`model-store.ts` / `avatar-store.ts` / `neighborhood-store.ts` exactly: one DB,
one object store, open→transact→close per op, try/catch-tolerant.

### Rendering

Copy the **Valetudo vacuum-map** idiom, not the room-temperature heatmap. The
temperature map draws one flat polygon per room, which is right for one number
per room and useless for a dense grid. The vacuum map already solves exactly
this problem in both views: bake one `CanvasTexture` per data revision, map it
to a single quad in 3D, and in 2D compose one `setTransform` + one `drawImage`.

Non-negotiable: **`CanvasTexture`s are not freed by `_clearGroup`.** Dispose
explicitly on rebuild, floor switch and destroy, as `_clearVacMap` does.

Dirty key bumps on **flush or scrub-range change** — never per sample, never per
frame. A texture rebuilt at RAF rate is the same performance bug class as the
fire-flicker rebuild.

Depth: the ground stack is already crowded (paint 4, temp heatmap 5, vacuum 6,
light pools 7, blob shadows 8) and the project has shipped a real z-fighting bug
there. Use `polygonOffset` as the ground-depth work does rather than trusting a
hand-picked Y gap.

### Naming — `heatmap` is taken

`Layers2D.heatmap` is the room **temperature** map. New layer key
**`presenceHistory`**, label "Presence history", cat `people`, added to
`DEFAULT_OFF_LAYERS`. Colour ramp is a **separate** `presenceHeatColor`, not the
existing `heatmapColor`.

### Selective display (v1)

Time-range presets (last hour / today / 7 days / 30 days) + per-sensor toggle.
Weight by **dwell seconds**, not visit count, so standing somewhere reads hotter
than walking through — which the accumulator gives for free.

Deferred to v2: continuous scrubbing (re-summing hundreds of buckets per drag
frame wants daily rollup records first) and per-person filtering (only
meaningful where identity fusion has resolved a target; most radar dwell is
anonymous).

## F. Privacy — decided, not offered as options

This records where identifiable people stood in a private home over time: sleep
schedules from bedroom dwell, bathroom visits, time near specific furniture. The
defaults are therefore:

- **Opt-in at the recording layer.** Default off. Binding an mmWave sensor must
  never silently start building a movement log. This is stronger than the
  display-layer `DEFAULT_OFF_LAYERS` gate, which only decides whether
  already-recorded history is drawn — both apply, as defence in depth.
- **Visible while recording.** A persistent indicator, not just a checkbox that
  can be forgotten. This matters most on a shared wall tablet, where anyone
  glancing at it should be able to tell.
- **Enforced retention.** 30 days default, user-configurable. An *active delete
  sweep*, not the read-time staleness filter the tile cache uses — "the UI won't
  show it" does not satisfy an erase expectation.
- **A real erase control**, modelled on "Clear cache" for neighborhood tiles.
- **Never leaves the device.** Not synced to `frontend.user_data`, not included
  in a config export envelope, never round-tripped by `switchConfig`. If a
  shared floor-plan export ever carries presence history, that is a bug.

## G. Dependencies and upstream (reviewed 2026-08-19)

- `three` 0.185.1, `typescript` 7.0.2 — already current. TS 7 is the native
  compiler and the project's `tsc -b` gates already pass on it.
- `vite` ^8.1.5 → **^8.2.1**: patch/minor inside the already-validated Rolldown
  major. Both April 2026 dev-server advisories (CVE-2026-39363/39364, fixed in
  8.0.5) are already behind the pinned range.
- `lit`, `@types/three`, `esbuild`: newer patches already satisfied by the
  existing caret ranges — lockfile refresh only.
- After **any** Vite bump, re-confirm the two build properties CLAUDE.md calls
  load-bearing: `grep -c MeshToonMaterial dist/assets/app.js` must be 0 (the
  lazy three.js chunk split), and output filenames must stay unhashed.

Two upstream items worth acting on separately:

- **`getEntitySuggestion`** (HA 2026.6): a custom card can offer itself in the
  entity picker's "Community" section. `src/card.ts` already registers on
  `window.customCards`; adding this is additive and makes Diorama discoverable
  without users knowing it exists.
- **`handle_safe_area`** — CLAUDE.md carries a hard "NEVER add this to the
  panel_custom YAML" warning dated to 2026.8.0, where core's schema rejected it.
  An opt-out reportedly landed in **2026.8.2**, i.e. after that note was written.
  **Do not change the warning without a real 2026.8.2+ repro**: the original
  fix was root-caused in a Docker instance and it is unverified whether the
  opt-out is a YAML key at all or only a frontend-side property.
