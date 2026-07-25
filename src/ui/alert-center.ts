import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { severityColor, worstSeverity, unreadCount, alertBellVisible } from '../alerts.js';
import type { PanelAlert } from '../alerts.js';
import type { Planner } from '../planner.js';

// Global Alert Center (§4.1) — a topbar 🔔 bell + severity/unread badge that
// opens a screen-space drawer listing normalized HA alerts (persistent
// notifications + Repairs). A new unread alert PULSES the bell. Self-contained
// (like the weather chip): mounts in the topbar, reads planner.alertFeed, and
// tracks a client-local "seen" id set in localStorage (never pushed to HA, like
// the sidebar collapse state). Works in edit + kiosk (opt-in); view mode shows
// the drawer read-only (dismiss/acknowledge refused by the planner guard).
const SEEN_KEY = 'diorama:alerts:seen';

// Inject the bell-pulse keyframes once (light-DOM component; can't scope in a
// shadow root). Guarded by id so re-registration / multiple instances are safe.
function injectAlertStyles(): void {
  if (typeof document === 'undefined' || document.getElementById('diorama-alert-styles')) return;
  const el = document.createElement('style');
  el.id = 'diorama-alert-styles';
  el.textContent =
    '@keyframes diorama-bell-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}' +
    '.diorama-bell-pulse{animation:diorama-bell-pulse 1s ease-in-out infinite}';
  document.head.appendChild(el);
}

@customElement('diorama-alert-center')
export class AlertCenter extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() private _open = false;
  @state() private _ = 0;

  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    injectAlertStyles();
    this.planner.addEventListener('config', this._tick);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._tick);
  }
  private _tick = () => { this._++; };

  private _seen(): Set<string> {
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { return new Set(); }
  }
  private _markSeen(feed: PanelAlert[]): void {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(feed.map(a => a.id))); } catch { /* ignore */ }
  }

  private _toggle = (): void => {
    this._open = !this._open;
    if (this._open) this._markSeen(this.planner.alertFeed);   // opening clears the unread badge
    this.requestUpdate();
  };

  // "3m ago" / "2h ago" / "just now". Empty when unparseable.
  private _rel(iso?: string): string {
    if (!iso) return '';
    const t = Date.parse(iso);
    if (!isFinite(t)) return '';
    const ms = Date.now() - t;
    if (ms < 45_000) return 'just now';
    const m = Math.round(ms / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  }

  private _sourceLabel(a: PanelAlert): string {
    return a.source === 'repair' ? 'Repairs' : a.source === 'system' ? 'System log'
      : a.source === 'flight' ? 'Flights' : 'Notification';
  }

  private _row(a: PanelAlert, canAct: boolean) {
    const color = severityColor(a.severity);
    const rel = this._rel(a.createdAt);
    return html`
      <div style="display:flex;gap:8px;padding:8px 10px;border-top:1px solid #22303d">
        <div style="width:3px;flex:0 0 auto;border-radius:2px;background:${color}"></div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-weight:600;font-size:12px;overflow:hidden;text-overflow:ellipsis;
                         white-space:nowrap">${a.title}</span>
            <span style="margin-left:auto;flex:0 0 auto;font-size:9px;text-transform:uppercase;
                         letter-spacing:0.3px;color:#111;background:${color};font-weight:700;
                         border-radius:3px;padding:1px 5px">${a.severity}</span>
          </div>
          ${a.message ? html`<div style="font-size:11px;color:#b0bec5;line-height:1.35;
                                          white-space:pre-wrap;word-break:break-word;
                                          max-height:66px;overflow:hidden">${a.message}</div>` : nothing}
          <div style="display:flex;align-items:center;gap:8px;margin-top:3px;font-size:10px;color:#78909c">
            <span>${this._sourceLabel(a)}</span>
            ${rel ? html`<span>· ${rel}</span>` : nothing}
            ${a.source === 'repair' ? html`
              <a href="/config/repairs" target="_blank" rel="noopener"
                 style="color:#4fa8ff;text-decoration:none;margin-left:auto"
                 @click=${(e: Event) => e.stopPropagation()}>view in Repairs →</a>` : nothing}
            ${canAct && a.dismissible ? html`
              <button title=${a.source === 'repair' ? 'Ignore this issue' : 'Dismiss notification'}
                      style="margin-left:${a.source === 'repair' ? '8px' : 'auto'};background:none;
                             border:1px solid #37474f;border-radius:4px;color:#cfd8dc;font-size:10px;
                             padding:1px 7px;cursor:pointer"
                      @click=${() => this._dismiss(a)}>
                ${a.source === 'repair' ? 'Ignore' : 'Dismiss'}
              </button>` : nothing}
          </div>
        </div>
      </div>`;
  }

  private _dismiss(a: PanelAlert): void {
    this.planner.dismissAlert(a);
    this.requestUpdate();
  }

  override render() {
    const p = this.planner;
    if (p.isOffline || !alertBellVisible(p.store.alerts, p.uiMode)) return nothing;
    const feed = p.alertFeed;
    const unread = unreadCount(feed, this._seen());
    const worst = worstSeverity(feed);
    const badgeColor = worst ? severityColor(worst) : '#78909c';
    const canAct = p.uiMode !== 'view';

    return html`
      <div style="position:relative;flex:0 0 auto">
        <button class="btn-sm ${unread > 0 ? 'diorama-bell-pulse' : ''}"
                title=${feed.length ? `${feed.length} alert${feed.length === 1 ? '' : 's'}` : 'No alerts'}
                style="font-size:14px;padding:4px 8px;position:relative"
                @click=${this._toggle}>
          🔔
          ${unread > 0 ? html`
            <span style="position:absolute;top:-3px;right:-3px;min-width:15px;height:15px;
                         border-radius:8px;background:${badgeColor};color:#111;font-weight:700;
                         font-size:10px;line-height:15px;text-align:center;padding:0 3px;
                         box-sizing:border-box">${unread > 99 ? '99+' : unread}</span>` : nothing}
        </button>
        ${this._open ? html`
          <div style="position:absolute;top:36px;right:0;width:min(360px,90vw);max-height:70vh;
                      overflow-y:auto;background:rgba(12,16,22,0.98);border:1px solid #2a3a4c;
                      border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.5);z-index:30">
            <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;
                        border-bottom:1px solid #22303d">
              <span style="font-weight:600;font-size:12px">Alerts</span>
              <span style="font-size:11px;color:#78909c">${feed.length}</span>
              <button style="margin-left:auto;background:none;border:none;color:#78909c;
                             font-size:16px;cursor:pointer;line-height:1"
                      @click=${this._toggle}>✕</button>
            </div>
            ${feed.length === 0
              ? html`<div style="padding:16px 12px;font-size:12px;color:#78909c;text-align:center">
                       Nothing needs attention.</div>`
              : feed.map(a => this._row(a, canAct))}
          </div>` : nothing}
      </div>`;
  }
}
