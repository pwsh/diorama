# Display-only lock mode

## Summary

Diorama already renders a two-sided interactive lock indicator on every `Door`
(`Door.lockEntity` / `Door.lockLocalState`): a padlock glyph in 2D near the
hinge and an emissive deadbolt box on both faces of the 3D door panel, which
the user can click to call `lock.lock` / `lock.unlock`. This is correct for a
front door the household actually operates from the panel, but it is wrong for
every lock that exists purely to be *watched*: a shed padlock nobody should
remotely open from a wall-mounted kiosk, a landlord-monitored unit where the
panel is read-only by policy, a safe/cabinet lock, or simply a household that
wants the spatial "is everything locked?" glance without the risk of a
mis-tap firing `lock.unlock` on the front door from a tablet on the wall.

The feature is small: one boolean flag on the door (`Door.lockDisplayOnly`)
that changes exactly one thing — the click handler for the lock glyph/bolt is
skipped — while every other part of the existing pipeline (state resolution,
glyph/bolt rendering, color-by-state, battery badge, dirty-key membership)
stays untouched. This fits Diorama's design language precisely: it is the
same pattern already used for `AlarmPanel.allowControl` (bound + view-only vs.
bound + controllable) and for `uiMode === 'view'` (global read-only). A
per-door flag gives per-fixture granularity that the global view mode can't:
you can have an interactive front-door lock and a display-only shed padlock
side by side on the same floor plan, in the same `edit`/`kiosk` session.

Because the panel is fundamentally *spatial* — click the thing where it
physically is — a "display only" toggle is also a safety feature: it lets an
installer confidently put an always-on kiosk in a hallway without worrying a
passerby's stray tap disarms a physical security device. It costs nothing in
new HA plumbing (the `lock.*` entity is already read for the state glyph);
it's purely an interaction-gating change plus (recommended, see below) fixing
up the state→visual mapping to cover HA's full lock state vocabulary
(`jammed`, `locking`, `unlocking`, `opening`, `open`), which the current code
does not yet distinguish (see "Real-world / visual reference" and
"Integration steps").

## Home Assistant data model

### Domain: `lock` (core)

The `lock` domain is a core Home Assistant domain (not a HACS integration) —
implemented by dozens of platform integrations (Z-Wave JS, Zigbee2MQTT/ZHA,
MQTT, Matter, August, Schlage, Kwikset/Yale via Zigbee, Nuki, Lockly, template,
etc.). Diorama only ever needs the domain-level state machine and the three
actions; the concrete platform is irrelevant to the panel.

**Reference:** developer entity docs
<https://developers.home-assistant.io/docs/core/entity/lock/>; user docs
<https://www.home-assistant.io/integrations/lock/>.

#### States (`LockState` enum)

| State | Meaning | Notes for Diorama |
|---|---|---|
| `locked` | Secured — reached after the Lock action | already handled (red/locked color) |
| `unlocked` | Not secured — reached after the Unlock action | already handled (green/unlocked color) |
| `locking` | Transient, in progress | **not currently distinguished** — falls into the `undefined`/grey "unknown" bucket today |
| `unlocking` | Transient, in progress | same gap |
| `jammed` | "The lock tried to move but got stuck before it finished, for example because the bolt is misaligned or something is blocking it" | **not currently distinguished** — this is the state most worth surfacing distinctly (security-relevant fault) |
| `open` | Latch has been released (separate from `unlocked` — see Open feature below) | not currently distinguished |
| `opening` | Transient, latch releasing | not currently distinguished |
| `unavailable` / `unknown` | HA fallback states, not lock-specific | already falls into the grey/undefined bucket |

Diorama's current `Planner.doorLockState()` only maps `'locked'` and
`'unlocked'` explicitly; every other value (including `jammed`) collapses to
`undefined` → the grey "unknown" glyph/bolt color. This is a real gap worth
closing as part of this feature (see Integration steps) — a jammed lock is
exactly the kind of fault a spatial security-glance panel should call out,
and it's a one-line addition to the existing color-resolution switch, not a
new subsystem.

#### The `open` state / `LockEntityFeature.OPEN`

Some locks (mainly higher-end smart deadbolts / connected latches — Yale,
Schlage, August, Kwikset with a separate latch retraction) support a third
action, `lock.open`, distinct from `unlock`: it electrically retracts the
latch so the door can be pushed open without turning the handle, versus
`unlock` which only disengages the bolt but still requires turning the
handle/knob. Locks that support this advertise `LockEntityFeature.OPEN` in
`supported_features`. **This is a red herring for display-only mode** —
display-only mode should hide the ENTIRE interaction (lock/unlock and open
alike), so Diorama does not need to model `open` as a separate clickable
action; it only needs `open`/`opening` as additional state values to render
distinctly from `locked`/`unlocked`/`jammed`.

#### Attributes

| Attribute | Type | Notes |
|---|---|---|
| `state` | string | one of the `LockState` values above — this is what arrives over `state_changed` |
| `code_format` | string \| null | regex describing the PIN/code format the lock expects on `lock`/`unlock`/`open`, or `null` if no code needed. Present on the entity attributes dict, so it IS visible over the WebSocket state object — Diorama doesn't need it (display-only mode never calls the service) but it's there if a future "prompt for code" feature wants it. |
| `changed_by` | string \| null | free-text description of what triggered the last state change (e.g. "Keypad", a user's name, an integration-specific autolock reason). Present in some platform integrations' attributes, not guaranteed by all. **Useful, optional enrichment**: a display-only lock tooltip could show "last changed by: <changed_by>" if present. |
| `supported_features` | bitmask (int) | standard HA entity attribute; only bit of interest is `LockEntityFeature.OPEN` (value `1`), not needed for display-only mode |
| `friendly_name`, `entity_id`, `device_class` (lock has none defined) | standard | — |

All of the above are ordinary entity **attributes** on the `lock.*` state
object, so they arrive over the same `state_changed` WebSocket subscription
Diorama already uses for every other bound entity — there is nothing here
that requires a REST call or is unavailable over WS. `changed_by` and
`code_format` are platform-dependent (not every lock integration populates
`changed_by`); code should treat both as optional/absent-tolerant, matching
the existing `raw ?? 'n/a'` fallback idiom already in `sidebar.ts`.

#### Services / actions

| Action | Signature | Notes |
|---|---|---|
| `lock.lock` | target: `entity_id` \| `device_id` \| `area_id` \| `floor_id` \| `label_id`; optional data: `code` (string) | <https://www.home-assistant.io/actions/lock.lock/> |
| `lock.unlock` | same target shape; optional `code` | <https://www.home-assistant.io/actions/lock.unlock/> |
| `lock.open` | same target shape; optional `code`; "available only for locks that support opening" (`LockEntityFeature.OPEN`) | <https://www.home-assistant.io/actions/lock.open/> |

Diorama already calls `lock.lock` / `lock.unlock` with `{ entity_id }` via
`HaApi.callService` (`Planner.toggleDoorLock`) — no `code` field is passed
today (this is a pre-existing limitation, not something display-only mode
needs to fix, since display-only mode's whole point is to *not* call these
services). If a future PIN-gated lock/unlock feature is wanted, `code_format`
+ an entity-level `code` field would be the extension point, but that is out
of scope here.

#### Not available over the WebSocket API

Nothing about the `lock` domain's state/attributes is REST-only — everything
above rides `state_changed`, exactly like every other Diorama-bound entity.
The one thing genuinely **not** exposed at the entity-state level is the
lock's *physical* battery/tamper/auto-lock-timer configuration (those live as
separate sibling entities on the same device — e.g. a `sensor.*_battery` or
`binary_sensor.*_tamper` — which Diorama already resolves generically via the
existing `batteryFor(entityId)` / device-registry sibling lookup, unrelated to
this feature). `code_format`/`changed_by` presence is integration-dependent —
some platforms (e.g. basic MQTT locks, some Z-Wave locks) never populate
`changed_by`; that's an integration-side gap, not a WS limitation.

## Real-world / visual reference

A residential smart lock a Diorama user would model is one of two form
factors:

- **Deadbolt retrofit** (August, Schlage Encode/Connect, Yale Assure, Kwikset
  Halo) — replaces just the interior thumbturn/exterior cylinder of an
  existing deadbolt. Exterior faceplate roughly **54 × 165 mm** (matches
  standard US deadbolt strike/faceplate sizing), interior module body
  roughly **70 × 70 × 55 mm** deep off the door face. Mounted centered on the
  door stile, typically **150–200 mm above the door handle/lockset**
  (standard deadbolt height ≈ 1050–1100 mm AFF, handle ≈ 900–950 mm AFF).
- **Full-body smart lock replacing the whole lockset** (Schlage Encode Plus,
  Level Lock, Yale Assure Lever) — similar overall envelope, sometimes with a
  keypad integrated into the exterior escutcheon (~50 × 200 mm).

Diorama's existing 3D representation (an emissive `70×100×30 mm` box near the
free edge of the door panel, both faces) is already a reasonable abstraction
of a deadbolt's visible edge-bolt — it does not need to become more literal
for this feature; display-only mode is a state/interaction change, not a
new geometry. The one visual addition worth considering (see next section) is
a distinct color/animation for `jammed` (since that's a real fault state a
homeowner cares about) and a small non-interactive affordance difference so
a **display-only** lock reads visibly differently from an **interactive**
one — see below.

**Color convention already established in Diorama** (`drawPadlock` in
`canvas-render.ts`, deadbolt material in `three-renderer.ts`):
- locked → `#ef5350` (red) — note this is intentionally inverted from a naive
  "red=bad" reading: red here signals "secured/armed", matching the existing
  alarm-panel and safety-sensor palette convention where red = the state
  requiring attention-when-changed, not danger.
- unlocked → `#66bb6a` (green)
- unknown/unavailable → `#90a4ae` (grey)

No new palette research is needed beyond adding a **jammed** color — amber/
orange (`#ffb300` or the existing `#ffb74d` already used for the door handle
and safety-sensor amber elsewhere in the codebase) is the natural fourth
color, consistent with amber-for-fault used by `AlarmPanel` (arming/pending
amber pulse) and safety sensors.

## Diorama visualization & animation design

### Data model change

Add one optional boolean to `Door` in `types.ts`, next to the existing lock
fields:

```ts
lockDisplayOnly?: boolean;   // when true, the lock glyph/bolt still shows live
                             // state but clicking it does nothing — display-only
                             // security glance, no remote lock/unlock. Item-level;
                             // no repairFloor change needed (same reasoning as
                             // localState/lockLocalState — arrays pass through
                             // unchanged).
```

This is item-level on an existing array element, exactly like
`lockLocalState`/`doorbellEntity` — **no `repairFloor`/`defaultFloor`/
`_loadFromHa` change needed** (per CLAUDE.md's own callout: only *new
top-level Store fields* or *new per-floor array fields* need that; a new
optional property on an existing array-item interface flows through
untouched, matching the precedent comment already in the codebase for
`localState`).

### State → visual resolution (recommended companion fix)

While implementing this, extend `Planner.doorLockState()`'s return type and
the two render call sites to cover the full HA vocabulary instead of
collapsing everything but `locked`/`unlocked` to "unknown":

```ts
type LockGlyphState = 'locked' | 'unlocked' | 'jammed' | 'locking' | 'unlocking' | 'open' | 'opening' | undefined;
```

- `locked` → red (existing)
- `unlocked` → green (existing)
- `jammed` → amber, and — matching the fireplace/safety-sensor "force rebuild
  while alarming" idiom — worth a subtle pulse so a jammed lock doesn't sit
  silently; cheap because it's a single per-frame `Math.sin(now)` alpha
  modulation on an already-emissive material, same technique as the
  fireplace flicker or safety-sensor alarm rings.
- `locking`/`unlocking`/`opening` → treat as their target state's color at
  reduced intensity (e.g. transitioning-to-locked shown as dim red), no new
  color needed.
- `open` → treat as a variant of unlocked (still green) — it's a strictly
  "more unlocked" state (latch released), doesn't need its own color.
- absent/`unavailable`/`unknown` → grey (existing).

This is optional relative to the core ask ("confirm lock states + jammed
handling") but is exactly the kind of gap the research brief asked to
surface, and it's cheap: one switch expression, no new dirty-key input (the
lock state already rides inside `_keyDoors`'s existing entity-state hash).

### 2D representation

- `drawPadlock()` (canvas-render.ts) is unchanged in its drawing logic. Two
  small additions:
  1. Accept the (recommended) wider state set for color, per above.
  2. When `d.lockDisplayOnly` is true, render the same glyph but drop the
     clickability affordance: no pointer cursor on hover (`hitDoorLock`
     should still detect the region for **tooltip** purposes but the click
     routing no-ops — see canvas-interact below), and draw the padlock at
     roughly 70% opacity relative to an interactive one, mirroring the
     existing "unbound dims" convention used for presence zones / alarm
     panels — so a user can tell at a glance, without opening the sidebar,
     that this one doesn't respond to taps.
- `hitDoorLock()` (canvas-hit.ts): keep detecting the region (needed for
  cursor + tooltip), but the **click handler** (canvas-interact.ts's mousedown
  routing at both call sites, lines ~440 and ~1253) should check
  `d.lockDisplayOnly` and skip calling `p.toggleDoorLock(d)` — instead treat
  the click as a no-op (fall through to whatever the door-body click would
  have done, i.e. nothing extra, since the lock glyph currently "wins over
  the door-panel hit" per the existing comment). Cursor (`canvas.style.cursor`
  at line ~984) should show `default` instead of `pointer` when
  `lockDisplayOnly` so hovering doesn't visually promise an action that won't
  happen.
- Battery badge (`drawBatteryBadge`) keeps rendering regardless of
  display-only — battery level is informational, not an interactive control.

### 3D representation

- `_buildFurniture`/door-building code in `three-renderer.ts` (~line 3560–3593)
  keeps building the same emissive deadbolt boxes on both faces, same color
  resolution (extended per the state table above). Two changes:
  1. When `d.lockDisplayOnly`, keep the `userData.kind = 'lock'` tag (so no
     new raycast-consumer branch needs to know about a distinct kind) but
     have the click handler check the door's flag before acting — see
     three-view.ts below. This mirrors the 2D fix exactly.
  2. Slightly reduce `emissiveIntensity` (e.g. 0.85 → 0.55) for display-only
     bolts as a subtle "look but don't touch" cue, consistent with the 2D
     opacity reduction. Not load-bearing, just a nice-to-have visual tell.
- No new group, no new dirty key, no new layer. The bolts already live inside
  `_doorGroup` under the existing `_keyDoors` dirty key (which already hashes
  `stOf(d.lockEntity)`); `lockDisplayOnly` should be folded into `_keyDoors`'s
  hash too (a one-token addition, e.g. append `:${d.lockDisplayOnly ? 1 : 0}`
  to the per-door key string at three-view.ts line 657) so toggling the flag
  in the sidebar immediately re-renders bolt appearance/intensity without
  waiting for an unrelated state change.

### Sidebar

- `_doorLockBindRow` (sidebar.ts ~2259) gains a checkbox: "Display only (no
  tap-to-lock)" right under the Bind/Unbind row, editable regardless of
  bound/unbound (display-only makes sense for both a bound real lock entity
  AND a local unbound `lockLocalState` demo lock — e.g. a shed padlock with no
  entity that's just there for visual completeness and should never be
  "unlocked" by a stray tap).
- When `lockDisplayOnly` is true, the state label span should drop its
  `role="button"`/pointer cursor/click handler (mirror the `clickable` boolean
  already computed in that method — just AND it with `!d.lockDisplayOnly`).

### Interaction with existing modes

- `uiMode === 'view'` already refuses `toggleDoorLock` globally — display-only
  is the **per-fixture, always-on** version of that same refusal, independent
  of `edit`/`kiosk`/`view`. The two compose trivially: add the check as the
  very first guard inside `Planner.toggleDoorLock` itself —
  `if (this.uiMode === 'view' || door.lockDisplayOnly) return;` — a single
  choke point that automatically covers the 2D, 3D, and sidebar click paths
  (all three already route through `toggleDoorLock`) without needing a
  duplicated guard at each call site.
- Kiosk mode: with the guard inside `toggleDoorLock`, a kiosk device showing a
  display-only shed lock behaves identically whether `uiMode` is `kiosk` or
  `edit` — the point of the feature (a lock nobody should touch from *any*
  session, not just view-only sessions).

## Integration steps

1. **types.ts** — add `lockDisplayOnly?: boolean` to the `Door` interface,
   next to `lockEntity`/`lockLocalState`, with a comment matching the style
   above. No `repairFloor` change needed (existing array item, optional
   field).
2. **planner.ts** —
   a. (Recommended companion fix) Widen `doorLockState()`'s return type and
      logic to surface `jammed`/`locking`/`unlocking`/`open`/`opening` instead
      of collapsing them to `undefined`.
   b. Add the `lockDisplayOnly` guard as the first line of
      `toggleDoorLock()`: `if (this.uiMode === 'view' || door.lockDisplayOnly) return;` — single choke point, covers 2D, 3D, and sidebar
      click paths at once.
3. **canvas-render.ts** — extend `drawPadlock()`'s color switch for the wider
   state set (if doing 2.a); dim the padlock (~70% alpha) when
   `d.lockDisplayOnly` (cursor is actually set in canvas-interact, not here —
   just handle the visual dimming here).
4. **canvas-hit.ts** — no change needed; `hitDoorLock` keeps detecting the
   region (cursor/no-op-click still needs to know a click landed on the
   glyph rather than falling through to the door body).
5. **canvas-interact.ts** — at the cursor-setting call site (~line 984), use
   `default` cursor instead of `pointer` when the hit door has
   `lockDisplayOnly`. The two click-routing call sites (~440, ~1253) don't
   need their own guard once `toggleDoorLock` self-guards (step 2b) — but
   double check whichever of those call sites might not currently route
   through `toggleDoorLock` at all and instead only exists to prevent the
   click from falling through to opening the door; if so, keep that
   swallow-the-click behavior (a display-only lock glyph click should still
   NOT open the door underneath it — it's just inert, not "pass through").
6. **three-renderer.ts** — extend the bolt-color switch to match step 3's
   wider state set (share logic/constants where practical — e.g. a small
   exported `lockGlyphColor(state)` helper in `geometry.ts` used by BOTH
   `canvas-render.ts` and `three-renderer.ts`, mirroring the existing
   `alarmStateColor` shared-helper precedent). Reduce `emissiveIntensity` when
   `d.lockDisplayOnly`.
7. **three-view.ts** — fold `d.lockDisplayOnly` into `_keyDoors`'s per-door
   hash string (~line 657) so the sidebar checkbox's effect (dimmer bolt)
   shows up immediately without waiting for an unrelated door/lock state
   change. The click-routing `if (kind === 'lock')` branch (~line 207–213)
   needs no extra change if `toggleDoorLock` self-guards (step 2b) — verify no
   dead double-guard is needed.
8. **sidebar.ts** — add the "Display only" checkbox to `_doorLockBindRow`;
   compute `clickable = (bound || !!d.lockLocalState) && !d.lockDisplayOnly`
   so the sidebar's own state-label click also respects the flag (redundant
   with step 2b's choke point, but keeps the UI honest without relying solely
   on the no-op).
9. **Typecheck + build** (`npm run typecheck && npm run build`) — no test
   harness exists for this narrow a change; manually verify in the running
   panel: (a) an unbound door with `lockLocalState` set + `lockDisplayOnly`
   checked no longer toggles on click in 2D or 3D, but still shows the
   correct color; (b) a bound door with a real `lock.*` entity in
   `lockDisplayOnly` mode still updates its glyph/bolt color live as the real
   lock's state changes over `state_changed`, but clicking it does nothing;
   (c) `uiMode: 'view'` behaves identically to `lockDisplayOnly` for a door
   that has both interactive lock fields cleared vs. set — confirm no
   regression to the interactive path when the flag is false/absent.

## Potential additional features

- **PIN-gated unlock**: use `code_format` (when present) to show a numeric
  keypad modal before calling `lock.lock`/`lock.unlock`/`lock.open` with a
  `code` field — natural follow-on to the existing alarm-panel modal's
  optional `code` pattern (`alarm_control_panel.alarm_disarm` already accepts
  one in Diorama).
- **`changed_by` tooltip**: surface "last changed by: <changed_by>" in the
  sidebar lock row and/or a 3D hover tooltip, when the platform populates it.
- **Auto-lock countdown**: some locks expose an auto-lock timer as a
  sibling `number`/`sensor` entity on the same device — could show a
  countdown ring on the deadbolt glyph, resolved via the same
  device-registry sibling-lookup pattern already used for battery badges.
- **Jammed alert integration with the existing alert/notification surface**:
  a `jammed` lock is exactly the kind of event the doorbell-pulse /
  camera-alert "transient pulse" primitive (`TransientPulse`) was built for —
  a jammed lock could emit a pulse + a persistent amber glow until resolved,
  reusing that existing primitive rather than inventing a new one.
- **Per-lock "display only" as part of a bulk security posture toggle**: a
  future "kiosk security lockdown" setting could bulk-set `lockDisplayOnly`
  on every door for a given `uiMode`/URL template, rather than requiring
  per-door sidebar edits — worth deferring until there's a second consumer of
  the same bulk-flip pattern (mirrors how `layerPresets2d` generalized
  per-layer toggles once there were enough of them).
- **Combine with `Door.locked` (canvas-lock, unrelated field)**: note there
  are now three different "locked" concepts on a `Door` — the canvas-editing
  `locked?: boolean` (prevents drag/rotate/delete ON THE CANVAS), the
  physical `lockEntity`/`lockLocalState` (real-world lock state), and this
  new `lockDisplayOnly` (interaction gating for the physical lock control).
  Naming collision risk is low since they're accessed via distinct property
  names, but sidebar copy should be careful not to conflate "lock this
  fixture in the editor" with "this door's physical lock is display-only" —
  worth a UI copy pass during implementation review.

## Open questions & risks

- **Should `lockDisplayOnly` also suppress the battery badge or
  `changed_by`?** Recommendation above keeps them visible (informational, not
  a control) — confirm this matches user expectations; a strict "display
  only = state glyph and nothing else" reading could argue for hiding the
  battery badge too, but that seems like an unnecessary restriction (battery
  level isn't an actionable control, it's a maintenance signal).
- **Jammed-state handling is currently entirely absent** from Diorama (not
  just hidden — the code doesn't distinguish it at all). This research
  treats fixing that as a recommended companion change bundled with the
  display-only feature (since both touch the same color-resolution switch),
  but it could also be scoped as a separate, smaller PR if the team wants to
  keep this feature minimal. Flagging the decision rather than assuming it.
- **`changed_by` / `code_format` availability is integration-fragmented.**
  Not every `lock.*` platform populates `changed_by` (many basic Z-Wave/
  Zigbee locks never set it); any feature built on it must be fully
  optional/absent-tolerant. This is a "vendor fragmentation" risk noted
  per the research brief but does not block the core display-only feature,
  which touches neither attribute.
- **Should the padlock glyph / deadbolt still be *hoverable* (tooltip/cursor
  feedback) in display-only mode, or fully inert (no cursor change at
  all)?** This doc recommends "still detect hover for a `default` cursor +
  dimmed glyph affordance" over "fully inert" so the user isn't confused
  about *why* nothing happened on click — but this is a UX call, not a
  technical constraint, and cheap to flip either way.
- **Naming**: `lockDisplayOnly` was chosen to read naturally next to
  `lockEntity`/`lockLocalState` and to avoid colliding with the pre-existing,
  unrelated `Door.locked` (canvas-edit-lock) field. Alternatives considered:
  `lockReadOnly` (slightly more standard HA-adjacent terminology — HA itself
  doesn't have a "read only" concept for locks, so no precedent pull either
  way), `lockInteractive` (inverted-sense boolean, avoided — codebase
  convention favors additive opt-in flags like `sharedBedCovers === false`
  rather than a flag whose false value is the interactive/default state,
  though either polarity works; `displayOnly` opt-in-to-restrict reads more
  naturally than an opt-out-of-restrict double-negative). No strong reason to
  deviate from `lockDisplayOnly` but confirm naming before implementation
  since it's a persisted field name that would need a migration story to
  rename later (per CLAUDE.md's storage-migration gotcha — HA user_data has
  no migration path in place).
- **No HA-side blocker at all**: this is confirmed to be a pure
  Diorama-side interaction-gating feature. There is no HA service, no new
  entity, no new WS call, nothing to register with `HassClient` /
  `HassPanelAdapter`. The entire feature lives in Diorama's own render +
  interact + sidebar layers.

## Sources

- <https://developers.home-assistant.io/docs/core/entity/lock/> — `LockEntity` properties (`is_locked`, `is_locking`, `is_unlocking`, `is_jammed`, `is_open`, `is_opening`, `changed_by`, `code_format`), `LockEntityFeature.OPEN`.
- <https://www.home-assistant.io/integrations/lock/> — lock domain overview, state descriptions (locked/locking/unlocked/unlocking/open/opening/jammed).
- <https://www.home-assistant.io/actions/lock.lock/> — `lock.lock` action signature.
- <https://www.home-assistant.io/actions/lock.unlock/> — `lock.unlock` action signature.
- <https://www.home-assistant.io/actions/lock.open/> — `lock.open` action signature, `LockEntityFeature.OPEN` gating, target/`code` parameters.
- Diorama source (this repo): `src/types.ts` (`Door` interface, existing `lockEntity`/`lockLocalState`), `src/planner.ts` (`doorLockState`, `toggleDoorLock`, `_isSlowEntity`), `src/canvas-render.ts` (`drawPadlock`, door draw loop), `src/canvas-hit.ts` (`hitDoorLock`), `src/canvas-interact.ts` (click routing, cursor), `src/three-renderer.ts` (deadbolt box build, ~line 3560–3593), `src/ui/three-view.ts` (`kind === 'lock'` raycast click branch, `_keyDoors` hash, ~line 207/657), `src/ui/sidebar.ts` (`_doorLockBindRow`, `_pickDoorLock`) — read directly to ground this design in the shipped implementation rather than re-deriving it from scratch.
