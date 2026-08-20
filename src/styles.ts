import { css } from 'lit';

// Shared CSS injected once at the document level so descendant Lit elements can
// use these classes via Light DOM (we render to light DOM throughout to keep
// styling simple and to allow native form input behavior).
export const SHARED_CSS = `
/* Vars on :root for iframe mode; diorama-panel / diorama-app for
   panel_custom mode where the style tag lives inside HA's shadow tree and
   :root (the document root) is out of scope. */
:root, diorama-panel, diorama-app {
  --bg: #0d0d1a;
  --surface: #1a1a2e;
  --surface2: #16213e;
  --border: #2a2a4a;
  --text: #e0e0e0;
  --text-dim: #888;
  --accent: #1976d2;
  --accent-hover: #1565c0;
  --danger: #c62828;
  --warn: #f9a825;
  --good: #2e7d32;
}
.btn-primary { width: 100%; padding: 11px; background: var(--accent); color: #fff; border: none;
               border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500; margin-top: 8px; }
.btn-primary:hover { background: var(--accent-hover); }
.btn { padding: 5px 10px; border-radius: 5px; border: 1px solid var(--border);
       background: transparent; color: var(--text); font-size: 11px; cursor: pointer; }
.btn:hover { border-color: var(--accent); }
.btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn.danger { border-color: var(--danger); color: #ef9a9a; }
.btn.danger:hover { background: rgba(198,40,40,0.15); }
.btn-sm { padding: 5px 10px; border-radius: 5px; border: 1px solid var(--border);
          background: transparent; color: var(--text-dim); font-size: 11px; cursor: pointer; }
.btn-sm:hover { border-color: var(--accent); color: var(--text); }
.btn-sm.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.danger-btn { padding: 6px 12px; background: transparent; border: 1px solid var(--danger);
              color: #ef9a9a; border-radius: 4px; font-size: 12px; cursor: pointer; width: 100%; }
.danger-btn:hover { background: rgba(198,40,40,0.15); }
.pill { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 500;
        background: var(--border); color: var(--text-dim); white-space: nowrap; }
.pill.connected { background: #1b5e20; color: #a5d6a7; }
.pill.error { background: #b71c1c; color: #ef9a9a; }
/* Sections must NOT scroll individually and must NOT shrink: the sidebar
   root is the single scroll container. (overflow-x:hidden here would force
   overflow-y to compute to auto → per-section scrollbars; flex-shrink
   default 1 would squeeze sections into the viewport height.) */
.section { padding: 3px 12px; border-bottom: none;
           min-width: 0; flex-shrink: 0; }
/* The 3px vertical padding applies in BOTH states (user-reported: expanding a
   section restored the old 12px block padding, so the clicked header JUMPED
   down — the space above a header must be identical collapsed vs expanded for
   it to stay put under the pointer). An EXPANDED section only adds a little
   padding-bottom after its body (below the header, so the header itself never
   moves); the divider rule is gone in both states — the pill relief already
   reads as a discrete item. 3px still clears the pill's own drop shadow
   (0 2px 5px ⇒ ~4.5px of visible reach below the box).
   Horizontal padding and the pill's own 7px/10px inner padding (the touch
   target) are untouched, and expanded sections keep the full 12px rhythm. */
.section:not(.collapsed) { padding-bottom: 8px; }
.section h3 { font-size: 11px; color: var(--text-dim); text-transform: uppercase;
              letter-spacing: 0.08em; margin-bottom: 8px; }
.row { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 3px 0;
       min-width: 0; }
.row label { color: var(--text-dim); flex: 1 1 auto; min-width: 0;
             overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row input[type="number"], .row input[type="text"], .row select {
  width: 110px; min-width: 40px; flex: 0 1 110px;
  padding: 3px 5px; background: #111; border: 1px solid var(--border);
  border-radius: 3px; color: var(--text); font-size: 11px;
}
/* Inline action buttons inside a row (rotate ↺↻, reset ↺, hinge L/R) must
   never wrap to a new line or stretch the 250px sidebar. */
.row .btn { flex: 0 0 auto; white-space: nowrap; }
/* Blanket overflow guard for the 250px sidebar: flex/grid items default to
   min-width:auto (their content size), which lets long entity ids, nested
   editor panes, and input clusters push past the fixed width. Forcing
   min-width:0 lets every level shrink; inputs additionally cap at 100%. */
diorama-sidebar .section * { min-width: 0; }
diorama-sidebar .section input,
diorama-sidebar .section select { max-width: 100%; }
.row input[type="number"] { text-align: right; }
.mini-toggle { position: relative; display: inline-block; width: 28px; height: 16px; flex-shrink: 0; cursor: pointer; }
.mini-toggle input { opacity: 0; width: 0; height: 0; }
.mini-toggle span { position: absolute; inset: 0; background: #444; border-radius: 16px; transition: background 0.2s; }
.mini-toggle span::before { content: ''; position: absolute; width: 10px; height: 10px;
  left: 3px; bottom: 3px; background: #aaa; border-radius: 50%; transition: transform 0.2s; }
.mini-toggle input:checked + span { background: var(--accent); }
.mini-toggle input:checked + span::before { transform: translateX(12px); background: #fff; }
.icon-btn { background: none; border: none; color: var(--text-dim); cursor: pointer;
            font-size: 13px; padding: 1px 3px; border-radius: 3px; line-height: 1; }
.icon-btn:hover { color: var(--text); background: rgba(255,255,255,0.08); }
.icon-btn.edit-btn { font-size: 18px; padding: 2px 5px; }
.collapsible-header { display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; }
.collapse-arrow { font-size: 10px; transition: transform 0.15s; }
.collapsible-header.open .collapse-arrow { transform: rotate(90deg); }

/* ── Section headers: glass pill whose RELIEF encodes the collapse state ──
   The <h3> IS the toggle, so its state is carried by the surface itself:
     collapsed = EMBOSSED (raised cap — light from above, drop shadow below)
     expanded  = DEBOSSED (pressed into the panel — inset shadow, dark rim)
   That relief REPLACED the old ▸ arrow glyph (the header carries
   aria-expanded for assistive tech instead).

   NB backdrop-filter is declared as a progressive enhancement only and
   currently renders NOTHING: the sidebar paints an opaque var(--surface)
   behind these pills, and blurring a flat colour is a no-op. The visible
   "glass" is entirely the layered translucent gradient + hairline border +
   highlight/shadow stack below — that is deliberate, not a fallback bug. */
h3.collapsible-header {
  padding: 7px 10px; border-radius: 9px; margin: 0 0 8px;
  color: var(--text-dim);
  background: linear-gradient(180deg, rgba(255,255,255,0.115) 0%,
              rgba(255,255,255,0.035) 48%, rgba(0,0,0,0.14) 100%);
  border: 1px solid rgba(255,255,255,0.13);
  box-shadow: 0 2px 5px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.24),
              inset 0 -2px 3px rgba(0,0,0,0.3);
  backdrop-filter: blur(6px) saturate(1.25);
  -webkit-backdrop-filter: blur(6px) saturate(1.25);
  transition: background 0.15s, box-shadow 0.15s, color 0.15s, border-color 0.15s;
}
h3.collapsible-header:hover { color: var(--text); border-color: rgba(255,255,255,0.22); }
h3.collapsible-header.open {
  color: var(--text);
  background: linear-gradient(180deg, rgba(0,0,0,0.36) 0%,
              rgba(0,0,0,0.16) 60%, rgba(255,255,255,0.055) 100%);
  border: 1px solid rgba(0,0,0,0.5);
  box-shadow: inset 0 3px 6px rgba(0,0,0,0.62),
              inset 0 -1px 0 rgba(255,255,255,0.09),
              0 1px 0 rgba(255,255,255,0.05);
}
/* Caption variant — the same glass tint with NO relief, for headings that are
   NOT toggles (the pinned floor picker, the tool-group captions). Keeping
   relief exclusive to toggles is what makes the emboss/deboss cue readable. */
.section-caption {
  padding: 6px 10px; border-radius: 8px;
  background: linear-gradient(180deg, rgba(255,255,255,0.038), rgba(255,255,255,0.008));
  border: 1px solid rgba(255,255,255,0.05);
  backdrop-filter: blur(6px) saturate(1.15);
  -webkit-backdrop-filter: blur(6px) saturate(1.15);
}
.sensor-item { display: flex; align-items: center; gap: 6px; padding: 5px 2px;
               border-bottom: 1px solid var(--border); cursor: pointer; }
.sensor-item:hover { background: rgba(255,255,255,0.04); }
.sensor-item.sel { background: rgba(25,118,210,0.22); }
.sensor-item .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: #4fc3f7; }
.sensor-item .nm { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.sensor-item .badge { font-size: 9px; padding: 1px 5px; border-radius: 8px;
                      background: #2a2a4a; color: var(--text-dim); }
.sensor-item .badge.bound { background: #1b5e20; color: #a5d6a7; }
.zone-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.sensor-cfg-row { display: flex; align-items: center; justify-content: space-between;
                  font-size: 12px; padding: 5px 0; border-bottom: 1px solid var(--border); }
.sensor-cfg-row:last-child { border-bottom: none; }
.sensor-cfg-row > label:first-child { color: var(--text-dim); flex: 1; }
.sensor-cfg-row input[type="number"] {
  width: 70px; background: #111; border: 1px solid var(--border); border-radius: 3px;
  color: var(--text); font-size: 11px; padding: 3px 5px; text-align: right;
}
.modal-ov { position: fixed; inset: 0; z-index: 100;
            background: rgba(0,0,0,0.55);
            display: flex; align-items: center; justify-content: center; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
         padding: 16px; width: 90%; max-width: 420px; max-height: 80vh;
         display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.6); }
.modal h3 { font-size: 14px; margin-bottom: 10px;
            display: flex; justify-content: space-between; align-items: center; }
.modal h3 button.close { background: none; border: none; color: var(--text-dim);
                          font-size: 18px; cursor: pointer; padding: 0 4px; }
.modal .search { width: 100%; padding: 7px 10px; border-radius: 5px;
                 border: 1px solid var(--border); background: #111; color: var(--text);
                 font-size: 12px; margin-bottom: 10px; }
.entity-list { overflow-y: auto; flex: 1; min-height: 0;
               border: 1px solid var(--border); border-radius: 4px; background: #111; }
.entity-item { padding: 7px 10px; font-size: 12px; cursor: pointer;
               border-bottom: 1px solid var(--border);
               display: flex; justify-content: space-between; gap: 8px; }
.entity-item:hover { background: var(--surface2); }
.entity-item .eid { font-family: monospace; color: var(--text-dim); font-size: 10px; }
.entity-item .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* Lock viewport: html/body never scroll. Topbar + sidebar are fixed-size
   children of the app's flex column / row; only the sidebar's inner div and
   the main canvas pane scroll. html/body rules only apply in iframe mode
   (in panel mode HA owns the page and these selectors can't match from
   inside the panel subtree anyway). */
html, body { height: 100%; margin: 0; overflow: hidden; }
diorama-app { display: block; height: 100%; overflow: hidden; }
diorama-topbar { display: block; flex-shrink: 0; }
diorama-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  width: 250px;
  flex-shrink: 0;
  overflow: hidden;
}
diorama-canvas-2d, diorama-three-view { display: block; width: 100%; height: 100%; }

/* Backdrop behind the overlay sidebar — only participates on narrow screens. */
.sidebar-backdrop { display: none; }

/* Phone / small tablet: sidebar floats over the canvas instead of docking,
   so the map keeps full width. Tap the dimmed canvas (backdrop) to close.
   The ☰ button in the topbar toggles; preference persists per device. */
@media (max-width: 900px) {
  diorama-sidebar {
    position: absolute; left: 0; top: 0; bottom: 0; z-index: 30;
    box-shadow: 4px 0 24px rgba(0,0,0,0.55);
  }
  .sidebar-backdrop {
    display: block; position: absolute; inset: 0; z-index: 25;
    background: rgba(0,0,0,0.4);
  }
  /* Topbar carries many controls; allow sideways scroll instead of wrap. */
  diorama-topbar > div { overflow-x: auto; }
}

/* Liveness pulse for the geo-calibration card (so a zero-sample window still
   visibly animates, signalling the panel is alive and waiting on the phone). */
@keyframes diorama-calib-pulse {
  0%, 100% { opacity: 0.25; transform: scale(0.85); }
  50%      { opacity: 1;    transform: scale(1.15); }
}
.diorama-calib-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  background: #4dd0e1; vertical-align: middle;
  animation: diorama-calib-pulse 1.1s ease-in-out infinite;
}

/* Alt+click IDENTIFY: the sidebar scrolls the named item's row into view and
   pulses it once (~1.5 s) so the eye lands on it. Navigation only — the row is
   never focused (that would cool the delete-hotkey selection heat). The class is
   stamped/removed imperatively on the row wrapper, which binds no class
   attribute of its own, so Lit re-renders can't wipe it mid-pulse. */
@keyframes diorama-identify-flash {
  0%, 100% { background: transparent; }
  15%      { background: rgba(255,213,79,0.30); }
  60%      { background: rgba(255,213,79,0.12); }
}
.identify-flash {
  animation: diorama-identify-flash 1.5s ease-out 1;
  border-radius: 4px;
}

/* ── Visual placement toolbar (bottom dock) ─────────────────────────────── */
diorama-toolbar { display: block; flex: 0 0 auto; }
.tb-dock {
  background: var(--surface2); border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 4px; padding: 5px 6px 6px;
  user-select: none;
}
/* Collapsed: the dock is just the handle, LEFT-anchored (thumb-reachable on a
   phone) rather than centred. */
.tb-dock.tb-collapsed { padding: 3px 6px; flex-direction: row; justify-content: flex-start; }
.tb-row { display: flex; align-items: center; gap: 4px; overflow-x: auto; overflow-y: hidden; }
.tb-row::-webkit-scrollbar { height: 6px; }
.tb-row::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
/* The tabs row does NOT scroll as a whole — the handle is a fixed flex item on
   the left and only .tb-tabstrip beside it scrolls, so the collapse control can
   never be scrolled out of reach at narrow widths. */
.tb-tabs { display: flex; align-items: center; gap: 6px; }
.tb-tabstrip {
  flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 4px;
  overflow-x: auto; overflow-y: hidden; padding-bottom: 1px;
}
.tb-tabstrip::-webkit-scrollbar { height: 6px; }
.tb-tabstrip::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
.tb-tab {
  flex: 0 0 auto; display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 9px; border-radius: 6px; border: 1px solid var(--border);
  background: transparent; color: var(--text-dim); font-size: 11px; cursor: pointer;
  white-space: nowrap;
}
.tb-tab:hover { border-color: var(--accent); color: var(--text); }
.tb-tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.tb-tab-glyph { font-size: 13px; }
/* Full touch target (>=40x40) with an oversized chevron — this is the one
   control a phone user reaches for to get the canvas back. */
.tb-handle {
  flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-width: 40px; min-height: 40px; padding: 0 10px; line-height: 1;
  border-radius: 8px; border: 1px solid var(--border);
  background: transparent; color: var(--text-dim); font-size: 12px; cursor: pointer;
}
.tb-handle:hover { border-color: var(--accent); color: var(--text); }
.tb-handle-glyph { font-size: 19px; line-height: 1; }
.tb-handle-label { white-space: nowrap; }
.tb-cards { gap: 6px; padding: 2px 0 3px; min-height: 92px; }
.tb-card {
  flex: 0 0 auto; width: 72px; display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding: 3px; border-radius: 8px; border: 1px solid var(--border);
  background: #141c26; color: var(--text-dim); cursor: pointer;
}
.tb-card:hover { border-color: var(--accent); color: var(--text); }
.tb-card.armed { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent) inset; color: #fff; }
.tb-thumb { width: 64px; height: 64px; border-radius: 6px; object-fit: cover; display: block; }
.tb-label {
  font-size: 9.5px; line-height: 1.1; text-align: center; width: 100%;
  max-height: 22px; overflow: hidden; word-break: break-word;
}
.tb-variants { display: flex; align-items: center; gap: 4px; overflow-x: auto; padding-bottom: 1px; }
.tb-variants-label { flex: 0 0 auto; color: var(--text-dim); font-size: 10px; }
.tb-chip {
  flex: 0 0 auto; padding: 2px 8px; border-radius: 10px; border: 1px solid var(--border);
  background: transparent; color: var(--text-dim); font-size: 10px; cursor: pointer; white-space: nowrap;
}
.tb-chip:hover { border-color: var(--accent); color: var(--text); }
.tb-chip.armed { background: var(--accent); border-color: var(--accent); color: #fff; }

@media (max-width: 900px) {
  .tb-cards { min-height: 82px; }
  .tb-card { width: 64px; }
  .tb-thumb { width: 56px; height: 56px; }
}

/* ── mmWave technical editor (src/ui/mmwave-editor.ts) ──────────────────────
   A large OVERLAY PANEL, not a full-screen takeover: the codebase has no
   full-screen precedent and the settings drawer is the nearest shape. Sized
   to fit a dense table plus a sensor-local canvas side by side, and clamped
   to the viewport so a tablet still gets a usable panel. */
.mmw-ov { position: fixed; inset: 0; z-index: 120; background: rgba(0,0,0,0.62);
          display: flex; align-items: center; justify-content: center; padding: 16px; }
.mmw-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
             width: min(1180px, 96vw); height: min(820px, 92vh);
             display: flex; flex-direction: column; overflow: hidden;
             box-shadow: 0 12px 40px rgba(0,0,0,0.65); }
.mmw-head { display: flex; align-items: flex-start; justify-content: space-between;
            padding: 12px 16px 8px; border-bottom: 1px solid var(--border); }
.mmw-title { font-size: 14px; font-weight: 600; color: var(--text); }
.mmw-sub { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
.mmw-sub code { font-family: monospace; }
.mmw-x { background: none; border: none; color: var(--text-dim); font-size: 18px;
         cursor: pointer; padding: 0 4px; }
.mmw-tabs { display: flex; gap: 2px; padding: 0 12px; border-bottom: 1px solid var(--border);
            flex-wrap: wrap; }
.mmw-tab { background: none; border: none; border-bottom: 2px solid transparent;
           color: var(--text-dim); font-size: 12px; padding: 7px 10px; cursor: pointer; }
.mmw-tab.on { border-bottom-color: var(--accent); color: var(--text); }
.mmw-body { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 16px 18px; }
.mmw-body h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
               color: var(--text-dim); margin: 0 0 6px; font-weight: 600; }
.mmw-empty { font-size: 12px; color: var(--text-dim); padding: 24px; text-align: center;
             border: 1px dashed var(--border); border-radius: 6px; line-height: 1.7; }
.mmw-note { font-size: 11px; color: var(--text); line-height: 1.6; margin: 0 0 10px; }
.mmw-note.dim, .mmw-dim { color: var(--text-dim); }
.mmw-dim { font-size: 11px; }
.mmw-tbl { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.mmw-tbl th { text-align: left; font-weight: 600; color: var(--text-dim); font-size: 10px;
              text-transform: uppercase; letter-spacing: 0.04em;
              padding: 3px 6px; border-bottom: 1px solid var(--border); white-space: nowrap; }
.mmw-tbl td { padding: 4px 6px; border-bottom: 1px solid var(--border); white-space: nowrap; }
.mmw-tbl td.num { text-align: right; font-variant-numeric: tabular-nums; font-family: monospace; }
.mmw-tbl td.dim, .mmw-vtbl td.dim { color: var(--text-dim); }
.mmw-tbl tr.off td { color: var(--text-dim); }
.mmw-ok { color: #69f0ae; } .mmw-bad { color: #ff8a80; }
.mmw-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%;
           vertical-align: middle; margin-right: 4px; }
.mmw-split { display: flex; gap: 14px; align-items: flex-start; }
.mmw-canvas-col { flex: 1 1 auto; min-width: 0; }
.mmw-side { flex: 0 0 320px; max-width: 320px; }
.mmw-canvas-wrap { border: 1px solid var(--border); border-radius: 6px; overflow: hidden;
                   background: #0b0f14; }
.mmw-canvas { display: block; width: 100%; height: 460px; touch-action: none; cursor: crosshair; }
.mmw-canvas-bar { display: flex; gap: 5px; align-items: center; padding: 5px 7px;
                  border-top: 1px solid var(--border); }
.mmw-row { display: flex; align-items: center; gap: 6px; font-size: 12px;
           padding: 4px 5px; border-bottom: 1px solid var(--border); cursor: pointer;
           border-radius: 3px; }
.mmw-row.sel { background: rgba(79,168,255,0.14); }
.mmw-row-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mmw-vtbl { width: 100%; border-collapse: collapse; font-size: 11px; }
.mmw-vtbl th { text-align: left; color: var(--text-dim); font-size: 10px; padding: 2px 3px; }
.mmw-vtbl td { padding: 2px 3px; }
.mmw-vtbl input { width: 100%; background: #111; border: 1px solid var(--border);
                  border-radius: 3px; color: var(--text); font-size: 11px; padding: 2px 4px; }
.mmw-btnrow { display: flex; gap: 5px; margin-top: 6px; }
.mmw-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--text);
           font-size: 11px; padding: 3px 9px; border-radius: 4px; cursor: pointer; }
.mmw-btn.danger { color: #ff8a80; border-color: rgba(255,138,128,0.4); }
.mmw-btn:disabled { opacity: 0.4; cursor: default; }
.mmw-mini { background: var(--surface2); border: 1px solid var(--border); color: var(--text-dim);
            font-size: 11px; line-height: 1; padding: 3px 7px; border-radius: 3px; cursor: pointer; }
.mmw-mini:disabled { opacity: 0.35; cursor: default; }
.mmw-grid2 { display: grid; grid-template-columns: auto 1fr; gap: 4px 8px; font-size: 11px;
             align-items: center; }
.mmw-grid2 input { width: 100%; background: #111; border: 1px solid var(--border);
                   border-radius: 3px; color: var(--text); font-size: 11px; padding: 2px 4px; }
.mmw-icons { display: flex; flex-wrap: wrap; gap: 3px; }
.mmw-icon { font-size: 15px; padding: 2px 3px; border-radius: 3px; cursor: pointer;
            line-height: 1.2; background: #222; border: 1px solid var(--border); color: var(--text); }
.mmw-icon.on { background: var(--accent); border-color: var(--accent); }
.mmw-ctrls { display: flex; flex-direction: column; }
.mmw-ctrl { display: flex; align-items: center; gap: 8px; font-size: 12px;
            padding: 5px 4px; border-bottom: 1px solid var(--border); }
.mmw-ctrl-label { flex: 0 0 210px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mmw-ctrl input[type="number"] { width: 88px; background: #111; border: 1px solid var(--border);
                                  border-radius: 3px; color: var(--text); font-size: 11px;
                                  padding: 2px 5px; text-align: right; }
.mmw-ctrl select { background: #111; border: 1px solid var(--border); border-radius: 3px;
                   color: var(--text); font-size: 11px; padding: 2px 5px; max-width: 200px; }
.mmw-unit { color: var(--text-dim); font-size: 10px; }
.mmw-val { font-family: monospace; }
.mmw-eid { margin-left: auto; font-family: monospace; font-size: 10px; color: var(--text-dim);
           overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px;
           /* Entity ids are full of underscores, and overflow:hidden on a tight
              line box CLIPS them away — the id then reads with spaces where the
              separators are, which is worse than useless for copying. */
           line-height: 1.7; }
/* Orientation: two independent values on two different axes, shown side by
   side. Deliberately NOT styled as a warning — nothing here is wrong. */
.mmw-orient { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.mmw-orient-cell { flex: 1 1 300px; min-width: 260px; background: rgba(0,0,0,0.25);
                   border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; }
.mmw-orient-k { font-size: 11px; color: var(--text-dim); }
.mmw-orient-v { font-size: 20px; font-weight: 600; color: var(--text);
                font-variant-numeric: tabular-nums; line-height: 1.3; }
.mmw-orient-d { font-size: 11px; color: var(--text-dim); line-height: 1.55; margin-top: 3px; }
.mmw-eid-inline { font-family: monospace; font-size: 10px; color: var(--text-dim);
                  line-height: 1.7; }
/* Diagnostics sub-tables are label/value pairs, not a wide matrix: let them
   stop before the panel edge so the right-aligned numbers stay near their row. */
.mmw-tbl.narrow { max-width: 760px; }
/* ── Presence-history recording indicator (design §F) ──────────────────────
   A PERSISTENT, visible marker that a movement log is being built — not merely
   a checkbox somewhere in settings that can be forgotten. Shown in ALL UI modes
   (edit / kiosk / view): the case it exists for is a shared wall tablet, where
   anyone glancing at it should be able to tell. Non-interactive by design
   (pointer-events:none) so it can never swallow a canvas click; the controls
   live in Settings ▸ Integrations. */
.rec-chip {
  position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 6px;
  padding: 3px 9px 3px 7px; border-radius: 999px;
  background: rgba(28, 8, 10, 0.86); border: 1px solid rgba(255, 82, 82, 0.55);
  color: #ffb3b3; font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
  line-height: 1.5; white-space: nowrap; pointer-events: none; z-index: 6;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
}
.rec-chip .rec-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #ff5252;
  box-shadow: 0 0 6px rgba(255, 82, 82, 0.9);
  animation: diorama-rec-pulse 1.6s ease-in-out infinite;
}
@keyframes diorama-rec-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
@media (prefers-reduced-motion: reduce) { .rec-chip .rec-dot { animation: none } }

@media (max-width: 900px) {
  .mmw-split { flex-direction: column; }
  .mmw-side { flex: 1 1 auto; max-width: none; width: 100%; }
}
`;

// Inject the shared CSS. `target` defaults to document.head (iframe mode).
// In panel_custom mode the panel element lives inside HA frontend's shadow
// DOM, where document-level styles can't reach — pass the panel element
// itself so the <style> sits in the same shadow tree as the components.
export function injectSharedStyles(target?: HTMLElement): void {
  const host: HTMLElement = target ?? document.head;
  // querySelector scoped to host: document.head lookup in iframe mode,
  // subtree lookup in panel mode (an id can legally repeat across roots).
  if (host.querySelector('#diorama-shared-css')) return;
  const el = document.createElement('style');
  el.id = 'diorama-shared-css';
  el.textContent = SHARED_CSS;
  host.appendChild(el);
}

// Lit-managed CSS used inside shadow DOM components.
export const componentCss = css``;
