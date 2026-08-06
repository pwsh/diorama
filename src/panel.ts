// Home Assistant native panel entry (panel_custom). HA loads this module and
// instantiates <diorama-panel>, then sets the `hass` property on every state
// change. We ride HA's authenticated connection — no iframe, no token paste.
//
// configuration.yaml:
//   panel_custom:
//     - name: diorama-panel
//       sidebar_title: Diorama
//       sidebar_icon: mdi:floor-plan
//       url_path: diorama
//       module_url: /local/diorama/diorama-panel.js
//       embed_iframe: false

import { Planner } from './planner.js';
import { HassPanelAdapter } from './ha-panel-adapter.js';
import { injectSharedStyles } from './styles.js';
import './ui/app.js';
import type { App } from './ui/app.js';

// Never collapse below this even if a measurement goes bad (detached element,
// display:none ancestor, zero-height viewport during an orientation flip).
const MIN_PANEL_H = 120;

// Safe-area inset expressions. HA defines --safe-area-inset-* on <html>
// (itself already wrapping the native env()), and a SIDEBAR-AWARE
// --safe-area-content-inset-left/right on home-assistant-main's :host so a
// docked sidebar that already absorbs the left inset doesn't double it. Custom
// properties inherit THROUGH shadow boundaries, so both resolve from inside the
// panel. Every lookup falls back to the raw env() so this also works on hosts
// that predate those variables (and in a plain browser).
const INSET_TOP = 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))';
const INSET_BOTTOM = 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))';
const INSET_LEFT =
  'var(--safe-area-content-inset-left, var(--safe-area-inset-left, env(safe-area-inset-left, 0px)))';
const INSET_RIGHT =
  'var(--safe-area-content-inset-right, var(--safe-area-inset-right, env(safe-area-inset-right, 0px)))';

const px = (v: string | undefined): number => {
  const n = parseFloat(v ?? '');
  return Number.isFinite(n) ? n : 0;
};

class DioramaPanel extends HTMLElement {
  private _adapter = new HassPanelAdapter();
  private _planner: Planner | null = null;
  private _app: App | null = null;

  private _ro: ResizeObserver | null = null;
  private _sizeRaf = 0;
  private _measuring = false;
  private _lastH = -1;
  private _sig = '';

  // HA frontend sets this on every state change. First call boots the app.
  set hass(h: unknown) {
    if (!h) return;
    if (!this._planner) {
      // Inject styles INTO the panel element — it sits inside HA frontend's
      // shadow DOM, where document.head styles can't reach.
      injectSharedStyles(this);
      this.style.display = 'block';
      this.style.boxSizing = 'border-box';
      this.style.overflow = 'hidden';
      this._startSizing();
      this._planner = new Planner();
      this._planner.connectWith(this._adapter);
      const app = document.createElement('diorama-app') as App;
      app.adoptPlanner(this._planner);
      this.appendChild(app);
      this._app = app;
      // HA's drawer/chrome settles after mount (and web fonts land later);
      // re-measure a few times so the first paint isn't sized off a
      // mid-transition layout.
      for (const d of [0, 120, 400, 1200]) setTimeout(this._queueSize, d);
    }
    this._adapter.attach(h as Parameters<HassPanelAdapter['attach']>[0]);
  }

  // ── Self-sizing (do NOT depend on the host's height chain) ───────────────
  //
  // HA 2026.8 (frontend PR #53127) gave <ha-panel-custom> automatic safe-area
  // handling: it now sets `display:block; box-sizing:border-box` + four
  // `padding: var(--safe-area-inset-*)` values on ITSELF — but never a height.
  // Before that it carried no inline style at all, so it rendered as an
  // unstyled custom element (display:inline), did NOT establish a containing
  // block, and our `height:100%` quietly resolved against ha-drawer's
  // `.app-content { height: 100% }` further up. Promoting it to display:block
  // made it the containing block WITH height:auto, so a percentage height
  // computes to `auto` (CSS 2.1 §10.5) and the panel collapsed to its content
  // height: on mobile the canvas went to 0 px (toolbar slid up under the
  // topbar, everything below black), on desktop it ballooned to ~4900 px
  // (canvas backing store far past the viewport → wrong 3D aspect, and the
  // sidebar grew to full content height so it had nothing left to scroll).
  //
  // Rather than chase whatever the host does next, we measure our own region:
  //   height = viewportHeight − ourTop − hostPaddingBottom
  // `ourTop` is read with our height COLLAPSED TO ZERO, so our own content can
  // never influence where we start (that feedback loop is exactly what made
  // the collapse self-reinforcing). Everything the host already reserves is
  // therefore accounted for automatically:
  //   • 2026.8 default — host pads top/bottom → ourTop includes the top inset,
  //     hostPaddingBottom removes the bottom one; our own padding resolves to 0.
  //   • handle_safe_area: true, or any host ≤2026.7 that pads nothing — ourTop
  //     is 0, hostPaddingBottom is 0, and our OWN padding (below) reserves the
  //     insets inside our border box instead.
  // Either way the content box lands exactly inside the safe area, with no
  // double-counting, and it needs no configuration.yaml change from the user.
  private _startSizing(): void {
    // Idempotent: connectedCallback can re-arm an already-armed panel. The
    // window listeners dedupe on identity; the observer needs an explicit
    // teardown so a re-mount doesn't leak the old one.
    this._ro?.disconnect();
    this._ro = null;
    window.addEventListener('resize', this._queueSize);
    window.addEventListener('orientationchange', this._queueSize);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', this._queueSize);
    vv?.addEventListener('scroll', this._queueSize);
    // Watch the HOST box too, so a host-side layout change (chrome appearing,
    // sidebar docking, a future wrapper) re-sizes us even without a window
    // resize. Safe against feedback: _measure only writes a CHANGED height,
    // and re-entrant callbacks are dropped while measuring.
    try {
      this._ro = new ResizeObserver(this._queueSize);
      if (this.parentElement) this._ro.observe(this.parentElement);
    } catch { /* no ResizeObserver — the listeners above still cover resizes */ }
    this._measure();
  }

  private _queueSize = (): void => {
    if (this._measuring || this._sizeRaf) return;
    this._sizeRaf = requestAnimationFrame(() => { this._sizeRaf = 0; this._measure(); });
  };

  private _measure(): void {
    if (!this.isConnected) return;
    this._measuring = true;
    try {
      const host = this.parentElement ? getComputedStyle(this.parentElement) : null;
      const hostPad = {
        top: px(host?.paddingTop), right: px(host?.paddingRight),
        bottom: px(host?.paddingBottom), left: px(host?.paddingLeft),
      };
      // Cheap change guard. Measuring costs two synchronous layouts (we collapse
      // to read our top), and the observer/visualViewport can fire often, so bail
      // when nothing that feeds the result moved. offsetTop is used rather than
      // the viewport-relative top because it does NOT depend on our own height,
      // so reading it here cannot be perturbed by the value we last wrote.
      const vhNow = window.visualViewport?.height ?? window.innerHeight;
      const sig = `${vhNow}|${this.offsetTop}|${this.clientWidth}|` +
        `${hostPad.top}|${hostPad.right}|${hostPad.bottom}|${hostPad.left}`;
      if (sig === this._sig && this._lastH > 0) return;
      this._sig = sig;
      // Reserve only the part of each inset the HOST has not already padded.
      // max()/calc() keep this in CSS so the var chain is resolved natively —
      // no parsing of custom-property token streams.
      const own = (inset: string, already: number) =>
        already > 0 ? `max(0px, calc(${inset} - ${already}px))` : inset;
      const s = this.style;
      s.paddingTop = own(INSET_TOP, hostPad.top);
      s.paddingBottom = own(INSET_BOTTOM, hostPad.bottom);
      s.paddingLeft = own(INSET_LEFT, hostPad.left);
      s.paddingRight = own(INSET_RIGHT, hostPad.right);

      // Collapse, then read where the host actually starts us.
      s.height = '0px';
      const top = this.getBoundingClientRect().top;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const h = Math.max(MIN_PANEL_H, Math.round(vh - top - hostPad.bottom));
      s.height = `${h}px`;
      this._lastH = h;
    } catch {
      // Never leave the element collapsed if measurement threw.
      if (this._lastH > 0) this.style.height = `${this._lastH}px`;
      else this.style.height = '100%';
    } finally {
      this._measuring = false;
    }
  }

  private _stopSizing(): void {
    window.removeEventListener('resize', this._queueSize);
    window.removeEventListener('orientationchange', this._queueSize);
    const vv = window.visualViewport;
    vv?.removeEventListener('resize', this._queueSize);
    vv?.removeEventListener('scroll', this._queueSize);
    this._ro?.disconnect();
    this._ro = null;
    if (this._sizeRaf) { cancelAnimationFrame(this._sizeRaf); this._sizeRaf = 0; }
  }

  // HA tears the panel out of the DOM when you navigate away and can put it
  // back on return; re-arm the listeners so a second visit still sizes itself.
  connectedCallback(): void {
    if (this._planner) this._startSizing();
  }

  disconnectedCallback(): void {
    this._stopSizing();
    this._app?.remove();
    this._app = null;
  }
}

if (!customElements.get('diorama-panel')) {
  if (!customElements.get('diorama-panel')) customElements.define('diorama-panel', DioramaPanel);
}
