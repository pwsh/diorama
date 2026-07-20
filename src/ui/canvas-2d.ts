import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { customElement } from './define.js';
import { isEditableTarget } from '../dom-utils.js';
import { computeView, drawAll, pxToMm, type View } from '../canvas-render.js';
import {
  onCanvasMouseDown, onCanvasMouseMove, onCanvasMouseUp,
  onCanvasClick, onCanvasDblClick, finishZoneEdit, cancelZoneEdit,
} from '../canvas-interact.js';
import type { Planner } from '../planner.js';

@customElement('diorama-canvas-2d')
export class Canvas2D extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @query('#main-canvas') private _canvas!: HTMLCanvasElement;

  private _ctx: CanvasRenderingContext2D | null = null;
  private _ro: ResizeObserver | null = null;
  private _raf = 0;
  private _bgImg: HTMLImageElement | null = null;
  private _bgUrl: string | null = null;
  private _lastFrame = 0;
  private _view: View = { ox: 0, oy: 0, scale: 1 };
  private _spaceHeld = false;
  private _panFrom: { px: number; py: number; vc: { x: number; y: number } } | null = null;
  // Touch pinch state. `anchor` is the world point under the fingers'
  // midpoint at gesture start; every move solves viewCenter so that anchor
  // stays under the current midpoint (absolute, no incremental drift).
  private _pinch: { d: number; anchor: { x: number; y: number }; zoom: number } | null = null;

  protected override createRenderRoot() { return this; }

  override render() {
    return html`
      <canvas id="main-canvas"
              style="display:block;width:100%;height:100%;cursor:crosshair;touch-action:none">
      </canvas>
      <button class="btn-sm" title="Reset view"
              style="position:absolute;bottom:10px;left:10px;z-index:5"
              @click=${this._resetView}>⟳ Reset view</button>
    `;
  }

  override firstUpdated(): void {
    this._ctx = this._canvas.getContext('2d');
    this._bindEvents();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this._canvas);
    // Also observe parent (for visibility changes that don't always fire on canvas).
    if (this._canvas.parentElement) this._ro.observe(this._canvas.parentElement);
    this._resize();
    this._startRaf();
    // Re-resize when view switches back to 2d (display:none → '' transition).
    this.planner.addEventListener('config', this._onConfig);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._ro?.disconnect();
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener('mouseup', this._onUp);
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup', this._onKeyUp);
    this.planner.removeEventListener('config', this._onConfig);
  }

  private _onConfig = () => {
    if (this.planner.view === '2d') {
      // Wait one frame so the wrapper's display has flipped before we measure.
      requestAnimationFrame(() => this._resize());
    }
  };

  private _resize(): void {
    if (!this._canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = this._canvas.clientWidth || 600, h = this._canvas.clientHeight || 400;
    if (w < 4 || h < 4) return;  // hidden — skip, don't shrink to default
    this._canvas.width = w * dpr; this._canvas.height = h * dpr;
    this._recomputeView();
  }

  private _recomputeView(): void {
    const f = this.planner.floor();
    this._view = computeView(this._canvas, f.w, f.d, this.planner.viewCenter, this.planner.zoom);
  }

  private _resetView = () => {
    this.planner.resetView();
  };

  // Convert canvas-pixel point (scaled by dpr) to world mm using current view.
  private _pxPointToMm(canvasX: number, canvasY: number): { x: number; y: number } {
    return {
      x: (canvasX - this._view.ox) / this._view.scale,
      y: (this._view.oy - canvasY) / this._view.scale,
    };
  }

  private _bindEvents(): void {
    // Wheel zoom — anchored at cursor position.
    this._canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const before = pxToMm(this._canvas, this._view, e);
      const factor = Math.exp(-e.deltaY * 0.0015);
      const newZoom = Math.max(0.1, Math.min(20, this.planner.zoom * factor));
      this.planner.zoom = newZoom;
      // Set viewCenter if it was auto-fit
      if (!this.planner.viewCenter) {
        const f = this.planner.floor();
        this.planner.viewCenter = { x: f.w / 2, y: f.d / 2 };
      }
      this._recomputeView();
      const after = pxToMm(this._canvas, this._view, e);
      this.planner.viewCenter = {
        x: this.planner.viewCenter.x + (before.x - after.x),
        y: this.planner.viewCenter.y + (before.y - after.y),
      };
      this._recomputeView();
    }, { passive: false });

    // Pan: middle/right mouse, or Space+left.
    this._canvas.addEventListener('mousedown', e => {
      this._panEnded = false;
      const isPan = (e.button === 1) || (e.button === 2) ||
                    (e.button === 0 && this._spaceHeld);
      if (isPan) {
        e.preventDefault();
        const f = this.planner.floor();
        const vc = this.planner.viewCenter ?? { x: f.w / 2, y: f.d / 2 };
        this._panFrom = { px: e.clientX, py: e.clientY, vc: { ...vc } };
        this._canvas.style.cursor = 'grabbing';
        return;
      }
      try {
        onCanvasMouseDown(this.planner, this._canvas, this._view, e);
      } catch (err) { console.error('canvas mousedown failed:', err); }
    });
    this._canvas.addEventListener('contextmenu', e => e.preventDefault());

    this._canvas.addEventListener('mousemove', e => {
      if (this._panFrom) {
        const dpr = window.devicePixelRatio || 1;
        const dx = (e.clientX - this._panFrom.px) * dpr;
        const dy = (e.clientY - this._panFrom.py) * dpr;
        const s = this._view.scale;
        this.planner.viewCenter = {
          x: this._panFrom.vc.x - dx / s,
          y: this._panFrom.vc.y + dy / s,
        };
        this._recomputeView();
        return;
      }
      try {
        onCanvasMouseMove(this.planner, this._canvas, this._view, e);
      } catch (err) { console.error('canvas mousemove failed:', err); }
    });

    this._canvas.addEventListener('click', e => {
      // iOS in the HA app never delivers this native click (touch handlers
      // preventDefault to keep HA's drawer out), so the touch path synthesizes
      // one. On browsers that DO still fire a compatibility click after a
      // synthetic dispatch, ignore it (700 ms window) to avoid a double-fire.
      if (performance.now() - this._lastSyntheticClick < 700) return;
      this._dispatchClick(e);
    });
    this._canvas.addEventListener('dblclick', e => this._dispatchDblClick(e));
    this._canvas.addEventListener('mouseleave', () => { this.planner.cursor = null; });

    window.addEventListener('mouseup', this._onUp);
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup', this._onKeyUp);

    // Touch — 1 finger uses mouse path; 2 fingers do pinch+pan.
    const toEvt = (t: Touch): MouseEvent => new MouseEvent('mousemove', {
      clientX: t.clientX, clientY: t.clientY, bubbles: false,
    });
    // Keep touches from bubbling to HA frontend — its drawer interprets
    // rightward swipes (from the left screen edge) as "open sidebar" and hijacks
    // 2-finger pans. EXCEPTION: a gesture STARTING within 24 px of the window's
    // left edge is left to bubble so an intentional edge-swipe still opens the
    // drawer. `touchStopping` latches at touchstart (true only when every touch
    // point clears the edge) and gates the stopPropagation on later events.
    let touchStopping = false;
    this._canvas.addEventListener('touchstart', e => {
      touchStopping = Array.from(e.touches).every(t => t.clientX > 24);
      if (touchStopping) e.stopPropagation();
      if (e.touches.length === 1 && !this._pinch) {
        e.preventDefault();
        const t = e.touches[0];
        this._tap = { x: t.clientX, y: t.clientY, t: performance.now(), moved: false };
        onCanvasMouseDown(this.planner, this._canvas, this._view, toEvt(t));
      } else if (e.touches.length === 2) {
        e.preventDefault();
        this._tap = null;  // second finger down → not a tap
        const t1 = e.touches[0], t2 = e.touches[1];
        const mid = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        this._pinch = {
          d: Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY),
          // World point currently under the midpoint — the gesture keeps
          // this point glued to the midpoint for its entire duration.
          anchor: pxToMm(this._canvas, this._view, { clientX: mid.x, clientY: mid.y }),
          zoom: this.planner.zoom,
        };
        // Cancel any in-flight 1-finger drag so the object doesn't jump.
        this.planner.drag = null;
        this.planner.dragJustEnded = false;
      }
    }, { passive: false });
    this._canvas.addEventListener('touchmove', e => {
      if (touchStopping) e.stopPropagation();
      if (this._pinch && e.touches.length >= 2) {
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        const d = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const mid = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        // Absolute zoom from gesture-start ratio.
        this.planner.zoom = Math.max(0.1, Math.min(20, this._pinch.zoom * (d / Math.max(this._pinch.d, 1))));
        this._recomputeView();
        // Solve viewCenter so the anchor world point sits exactly under the
        // CURRENT midpoint. From computeView: wx = cx + (px − w/2)/s and
        // wy = cy + (h/2 − py)/s  →  cx = ax − (px − w/2)/s, etc. Absolute
        // solve every event — no accumulation, no drift.
        const rect = this._canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const px = (mid.x - rect.left) * dpr;
        const py = (mid.y - rect.top) * dpr;
        const s = this._view.scale;
        const w = this._canvas.width, h = this._canvas.height;
        this.planner.viewCenter = {
          x: this._pinch.anchor.x - (px - w / 2) / s,
          y: this._pinch.anchor.y - (h / 2 - py) / s,
        };
        this._recomputeView();
        return;
      }
      if (this._pinch && e.touches.length === 1) {
        // Finger lifted mid-pinch: remaining finger pans (anchor re-set at
        // lift time in endPinchOrDrag). Zoom stays put.
        e.preventDefault();
        const t = e.touches[0];
        const rect = this._canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const px = (t.clientX - rect.left) * dpr;
        const py = (t.clientY - rect.top) * dpr;
        const s = this._view.scale;
        const w = this._canvas.width, h = this._canvas.height;
        this.planner.viewCenter = {
          x: this._pinch.anchor.x - (px - w / 2) / s,
          y: this._pinch.anchor.y - (h / 2 - py) / s,
        };
        this._recomputeView();
        return;
      }
      if (e.touches.length === 1 && !this._pinch) {
        e.preventDefault();
        const t = e.touches[0];
        if (this._tap && Math.hypot(t.clientX - this._tap.x, t.clientY - this._tap.y) > 12) {
          this._tap.moved = true;  // moved past the tap threshold → it's a drag
        }
        onCanvasMouseMove(this.planner, this._canvas, this._view, toEvt(t));
      }
    }, { passive: false });
    const endPinchOrDrag = (e: TouchEvent) => {
      if (touchStopping) e.stopPropagation();
      if (e.touches.length === 0) touchStopping = false;
      if (this._pinch) {
        if (e.touches.length >= 2) return;
        if (e.touches.length === 1) {
          // One finger lifted mid-pinch: re-anchor on the remaining finger
          // so the view doesn't jump, and keep treating it as a pan (not a
          // 1-finger object drag — that would grab whatever is underneath).
          const t = e.touches[0];
          this._pinch = {
            d: 1,
            anchor: pxToMm(this._canvas, this._view, { clientX: t.clientX, clientY: t.clientY }),
            zoom: this.planner.zoom,
          };
          // Degenerate distance: treat single remaining finger as pan-only.
          return;
        }
        this._pinch = null;
        this._tap = null;  // a pinch is never a tap
        return;
      }
      if (e.touches.length === 0) {
        onCanvasMouseUp(this.planner, this._canvas);
        // AFTER mouseup (same order as mouse) so drag-vs-click logic holds.
        this._maybeTap(e);
      }
    };
    this._canvas.addEventListener('touchend', endPinchOrDrag);
    // App WebViews fire touchcancel when the OS steals the gesture
    // (notification shade, back-swipe). Without this the pinch state wedges.
    this._canvas.addEventListener('touchcancel', e => {
      if (touchStopping) e.stopPropagation();
      touchStopping = false;
      this._pinch = null;
      this._tap = null;  // OS stole the gesture → not a tap
      if (e.touches.length === 0) onCanvasMouseUp(this.planner, this._canvas);
    });
  }

  private _panEnded = false;  // swallow the browser 'click' a pan release fires

  // Touch → click/dblclick synthesis (Task 1). iOS in the HA companion app
  // never fires the compatibility 'click' after our preventDefault'd touch
  // handlers, so onCanvasClick-only flows (landmark / room placement, kiosk
  // tap-to-toggle) silently never ran. The touch path below records a tap
  // candidate and, on a clean lift, dispatches through _dispatchClick.
  private _lastSyntheticClick = -Infinity;   // ts of the last synthesized dispatch
  private _tap: { x: number; y: number; t: number; moved: boolean } | null = null;
  private _lastTap: { x: number; y: number; t: number } | null = null;  // for double-tap

  // Shared click body: reused by the native listener and the touch tap path.
  // Preserves the Space+left-pan swallow guard (mouse ordering: mouseup→click).
  private _dispatchClick(evt: { clientX: number; clientY: number }): void {
    if (this._panFrom || this._panEnded) { this._panEnded = false; return; }
    try {
      onCanvasClick(this.planner, this._canvas, this._view, evt as MouseEvent);
    } catch (err) { console.error('canvas click failed:', err); }
  }

  private _dispatchDblClick(evt: { clientX: number; clientY: number }): void {
    try {
      onCanvasDblClick(this.planner, this._canvas, this._view, evt as MouseEvent);
    } catch (err) { console.error('canvas dblclick failed:', err); }
  }

  // On a clean single-finger lift (no pinch, no drag past threshold, quick),
  // synthesize a click — or a dblclick when it's the second quick tap in the
  // same spot. Runs AFTER onCanvasMouseUp so the drag-vs-click logic in
  // canvas-interact sees the same mouseup→click ordering as a real mouse.
  private _maybeTap(e: TouchEvent): void {
    const tap = this._tap; this._tap = null;
    if (!tap || tap.moved) return;
    if (performance.now() - tap.t > 600) return;     // long-press, not a tap
    const ct = e.changedTouches[0];
    if (!ct) return;
    if (Math.hypot(ct.clientX - tap.x, ct.clientY - tap.y) > 12) return;
    const now = performance.now();
    this._lastSyntheticClick = now;
    const prev = this._lastTap;
    const isDouble = !!prev && (now - prev.t) < 350 &&
      Math.hypot(ct.clientX - prev.x, ct.clientY - prev.y) < 24;
    const evt = { clientX: ct.clientX, clientY: ct.clientY };
    if (isDouble) {
      this._lastTap = null;
      this._dispatchDblClick(evt);
    } else {
      this._lastTap = { x: ct.clientX, y: ct.clientY, t: now };
      this._dispatchClick(evt);
    }
  }

  private _onUp = () => {
    if (this._panFrom) {
      this._panFrom = null;
      this._panEnded = true;
      this._canvas.style.cursor = 'default';
      return;
    }
    onCanvasMouseUp(this.planner, this._canvas);
  };

  private _onKey = (e: KeyboardEvent) => {
    // Ignore keys aimed at ANY form control or editable content (sidebar
    // <select>s, textareas, the entity-picker search box, …). The old guard
    // only covered INPUT — typing 'm' while a <select> had focus (e.g.
    // jumping to "Microwave" in the kind dropdown) silently switched to the
    // Motion tool, so the user's next canvas click planted a motion sensor.
    if (isEditableTarget(e.target)) return;
    if (e.code === 'Space') { this._spaceHeld = true; this._canvas.style.cursor = 'grab'; return; }
    const p = this.planner;
    if (e.key === 'Escape') {
      if (p.editZone) { cancelZoneEdit(p); return; }
      if (p.drawingWall) { p.drawingWall = null; p.emitConfig(); return; }
      if (p.drawingPresenceZone) { p.drawingPresenceZone = null; p.emitConfig(); return; }
      if (p.drawingGroundArea) { p.drawingGroundArea = null; p.emitConfig(); return; }
      if (p.drawingPath) { p.drawingPath = null; p.emitConfig(); return; }
      if (p.drawingPoolArea) { p.drawingPoolArea = null; p.emitConfig(); return; }
      if (p.drawingVoidArea) { p.drawingVoidArea = null; p.emitConfig(); return; }
      if (p.drawingRuler) { p.drawingRuler = null; p.emitConfig(); return; }
      if (p.pickingDimWalls) { p.setPickingDimWalls(false); return; }
      if (p.store.activeSensorId) { p.store.activeSensorId = null; p.save(); p.emitConfig(); }
    }
    if (e.key === 'Enter' && p.editZone) { finishZoneEdit(p); return; }
    if (e.key === 'Enter' && p.drawingPresenceZone) { p.finishPresenceZone(); return; }
    if (e.key === 'Enter' && p.drawingGroundArea) { p.finishGroundArea(); return; }
    if (e.key === 'Enter' && p.drawingPath) { p.finishPath(); return; }
    if (e.key === 'Enter' && p.drawingPoolArea) { p.finishPoolArea(); return; }
    if (e.key === 'Enter' && p.drawingVoidArea) { p.finishVoidArea(); return; }
    if (e.key === '0' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); p.resetView(); return; }
    if (this.planner.uiMode !== 'edit') return;  // kiosk/view: no edit keys
    // Undo / redo. Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y = redo.
    // The form-control guard above already blocks these while typing in inputs.
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (e.shiftKey) p.redo(); else p.undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault(); p.redo(); return;
    }
    // Arrow keys nudge the ACTIVE furniture piece by 25 mm (100 with Shift) in
    // world mm. This is the manual escape hatch to fine-position a piece (e.g.
    // away from a wall), so it deliberately does NOT run the drag-time
    // wall/seat collision solvers — just move, persist (debounced save, same as
    // a drag), and re-render. Bare arrows only; the form-control guard above
    // already blocks INPUT/SELECT/TEXTAREA/contentEditable.
    if (e.key.startsWith('Arrow') && p.activeFurnitureId &&
        !e.ctrlKey && !e.metaKey && !e.altKey) {
      const piece = p.floor().furniture.find(x => x.id === p.activeFurnitureId);
      if (piece && !piece.locked) {
        const step = e.shiftKey ? 100 : 25;
        // Canvas Y is screen-down but world +Y is screen-up: ArrowUp raises y.
        if (e.key === 'ArrowUp') piece.y += step;
        else if (e.key === 'ArrowDown') piece.y -= step;
        else if (e.key === 'ArrowLeft') piece.x -= step;
        else if (e.key === 'ArrowRight') piece.x += step;
        e.preventDefault();
        p.save(); p.emitConfig();
        return;
      }
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && p.selectionHot) {
      // Delete the highest-priority current selection (vertex → furniture →
      // sensor → fixtures → zones/areas). Respects locked items. Only swallow
      // the keystroke when something was actually removed. Gated on selectionHot
      // so a persisted-but-untouched selection (activeSensorId survives across
      // sessions) can't be deleted by a stray keypress at body focus — e.g.
      // Backspace while typing a just-placed fixture's name before clicking in.
      if (p.deleteSelection()) { e.preventDefault(); return; }
    }
    const tk: Record<string, import('../planner.js').Tool> = {
      '1': 'select', '2': 'wall', '3': 'sensor', '4': 'motion',
      '5': 'furniture', '6': 'light', '7': 'switch', '8': 'delete',
      'm': 'motion',
    };
    // Bare keys only — Ctrl/Cmd/Alt combos are browser shortcuts, not tool picks.
    if (tk[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) p.setTool(tk[e.key]);
  };

  private _onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') { this._spaceHeld = false; this._canvas.style.cursor = 'default'; }
  };

  private _ensureBg(): HTMLImageElement | null {
    const bg = this.planner.floor().bg;
    if (!bg?.dataUrl) { this._bgImg = null; this._bgUrl = null; return null; }
    if (this._bgUrl === bg.dataUrl && this._bgImg) return this._bgImg;
    const img = new Image();
    this._bgUrl = bg.dataUrl;
    this._bgImg = img;
    img.src = bg.dataUrl;
    return img;
  }

  private _startRaf(): void {
    const tick = (now: number) => {
      // Reschedule first so a thrown exception in render doesn't pause the
      // RAF and leave stale pixels on the canvas across e.g. a floor switch.
      this._raf = requestAnimationFrame(tick);
      try {
        const dt = this._lastFrame ? Math.min((now - this._lastFrame) / 1000, 0.1) : 0.016;
        this._lastFrame = now;
        this.planner.stepLerp(dt);
        this.planner.stepRobots(dt);
        const dpr = window.devicePixelRatio || 1;
        const cw = this._canvas.clientWidth, ch = this._canvas.clientHeight;
        if (cw > 4 && ch > 4 &&
            (this._canvas.width !== cw * dpr || this._canvas.height !== ch * dpr)) {
          this._resize();
        }
        this._recomputeView();
        const bgImg = this._ensureBg();
        if (this._ctx) drawAll(this._ctx, this.planner, this._view, bgImg);
      } catch (err) {
        console.error('canvas-2d render failed:', err);
        // Wipe so a partial draw can't leave the screen wedged on old data.
        if (this._ctx && this._canvas) {
          this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
      }
    };
    this._raf = requestAnimationFrame(tick);
  }
}
