# DESIGN — Visual placement toolbar (bottom dock)

*Authored 2026-07-19 (Fable). Status: **shipped** (2026-07-19).*
*Implementation deltas: the dock is a flex-column layout SIBLING below the
canvas (canvas shrinks — chip/reset-button clearance for free, no offset
hacks); buildTag = compiled `__DIORAMA_VERSION__`; sensor/control fixture
cards use authored glyph tiles (not 3D captures) — bespoke per-fixture
scaffolding deferred, service structured to add later; four runtime-only
pending kinds (`pendingLightKind/WindowKind/DoorKind/GroundKind`) added so
variant chips arm real drops.*

User brief: replace the text-list tools menu with a visual selection system —
a bottom toolbar (familiar from other design programs) where the user picks a
CATEGORY, then an ITEM (and variant) with a live visual preview, instead of
placing blind. Stays inside EDIT mode (no new UI mode — the brief allowed one
only if necessary; it isn't: the dock renders only in edit mode alongside the
existing sidebar).

## Pinned decisions

1. **Component**: `<diorama-toolbar>` (light DOM via define.ts, styles in
   styles.ts), mounted by `app.ts` under the shared canvas container, bottom
   docked, full width, ~92 px tall when open. Collapsible to a slim handle
   (chevron); collapsed state persists device-local
   (`localStorage['diorama:toolbar:collapsed']`, try/catch — the sidebar
   collapse idiom). Renders ONLY in edit mode. Must not collide with the
   2D reset-view button / 3D view bar — those sit top/left; the weather chip
   default anchor is bottom-right: the dock's right edge leaves a ~180 px
   gap OR the chip's `barOffsetPx` idiom is reused to lift the chip when the
   dock is open (pick the cheaper; report).
2. **Structure**: two rows.
   - Row 1 — category tabs (icon + short label): Furniture · Appliances ·
     Bathroom · Theater · Outdoor · Vehicle · Lights · Controls & Sensors ·
     Structure · Ground · Custom. Categories map to existing groupings:
     furniture cats via `furnitureCat` (custom objects get the Custom tab),
     light icon kinds under Lights, the TOOLS fixture list (mmWave, motion,
     env, BLE, safety, alarm, thermostat, valve, plug, camera, projector,
     robot, sprinkler, info card, action button, calendar, alert beacon…)
     under Controls & Sensors, wall/door/window/room/zone/void tools under
     Structure, ground-area kinds + path + landmark under Ground.
   - Row 2 — horizontally scrollable ITEM CARDS for the active category:
     ~72×72 px thumbnail + tiny label. Clicking a card arms EXACTLY what the
     sidebar tool buttons arm today (`setTool` + `pendingFurnitureKind` /
     `pendingCustomObjectId` / `pendingWallKind` / ground-kind latch / etc.) —
     the toolbar is a VISUAL FRONT-END to the existing tool state, no new
     placement semantics. The armed card shows a selected ring; ESC / placing
     clears per existing tool behavior. Sidebar TOOLS section stays (hotkeys
     + power users) but gains a one-line hint pointing at the dock.
   - **Variants**: kinds that are variants of one thing show as a variant
     CHIP ROW above row 2 while that item is armed — doors (swing/garage/
     gate), windows (5 kinds), walls (full/half/railing/invisible/fences/
     hedge), ground kinds. Furniture/light kinds are each their own card
     (they ARE the variant set).
3. **Previews — real 3D thumbnails from the actual renderer** (the
   docs-gallery capture already drives the real `ThreeDRenderer` for GIFs —
   same idea, in-app):
   - `src/ui/thumbs.ts`: a lazy thumbnail service. On first use it
     `await import('../three-renderer.js')` (NEVER a static import — the
     lazy-chunk rule), instantiates ONE hidden `ThreeDRenderer` on an
     offscreen ~128×128 canvas, and renders each requested kind by feeding a
     minimal fake floor (one furniture piece / one light / one fixture,
     small rect, day preset, iso-ish camera framed to the piece), then
     `canvas.toDataURL()` → cache.
   - Cache: module-level `Map<kindKey, dataURL>` + persisted
     `localStorage['diorama:thumbs:v<N>']` keyed by app build (the `?v=`
     build query / a version constant) so thumbnails survive reloads and
     regenerate on upgrade. Custom-object thumbnails key on the recipe's
     JSON hash (recipes change).
   - Generation is BATCHED lazily per category (only the open tab renders,
     a few ms per kind, spread over rAF so the UI never janks) with a flat
     placeholder glyph while pending. If the dynamic import or WebGL fails,
     fall back to a 2D top-down canvas drawing via
     `drawFurniturePrimitiveLocal` / glyphs (never blank, never throws).
   - The service must dispose nothing shared incorrectly: one renderer
     instance kept for the session, disposed on page hide? Keep it simple:
     keep it alive; it's one small canvas. Verify it does NOT interfere with
     the real three-view (separate canvas + renderer instance is already
     supported — the privacy-mosaic and gallery prove multi-scene use).
4. **Fixture thumbnails** (lights, sensors, controls): rendered the same way
   through the renderer's real builders (updateLightsSwitches / update* with
   a single fixture). Structure tools (wall/door/window/room/zone/void/
   ground) may use authored SVG-ish canvas glyphs instead of 3D captures
   where a 3D snapshot is meaningless (a zone tool) — judgment per tool,
   bias toward 3D captures for anything physical (doors/windows/walls get a
   3D snippet: a short wall run with the door/window in it).
5. **No behavior changes** to placement/tools/kiosk/view. `uiMode` gating:
   dock hidden outside edit. Mobile: the dock is scrollable; under the
   900 px breakpoint it overlays above the canvas bottom edge and the
   sidebar auto-close-on-placement idiom applies unchanged.
6. **Tests** (`test-pages/toolbar-test.html`): category mapping completeness
   (every FURNITURE_KINDS entry appears in exactly one tab; every TOOLS
   entry mapped; light kinds present), arming semantics (card click sets
   tool/pending state exactly like the sidebar button — drive the real
   Planner), variant chips for door/window/wall/ground, thumbnail service:
   fake-import fallback path renders 2D placeholders (headless-safe),
   cache keying by build version + recipe hash, collapse persistence,
   edit-mode-only rendering. 3D capture itself is asserted loosely (a
   dataURL longer than the placeholder for one furniture kind) since
   headless WebGL is available in the harness.
