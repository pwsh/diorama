import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { fmtLen } from '../geometry.js';
import './alert-center.js';
import type { Planner } from '../planner.js';

@customElement('diorama-topbar')
export class Topbar extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() private _ = 0;
  @state() private _refreshing = false;

  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    this.planner.addEventListener('config', this._tick);
    this.planner.addEventListener('conn', this._tick);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._tick);
    this.planner.removeEventListener('conn', this._tick);
  }
  private _tick = () => { this._++; };

  private _copyKioskLink = async () => {
    const p = this.planner;
    const u = new URL(window.location.href);
    u.searchParams.set('mode', 'kiosk');
    u.searchParams.set('view', p.view);
    u.searchParams.set('floor', p.floor().name);
    if (p.view === '3d' && p.lastCam3d) {
      const c = [...p.lastCam3d.pos, ...p.lastCam3d.target].map(n => Math.round(n));
      u.searchParams.set('cam', c.join(','));
    } else {
      u.searchParams.delete('cam');
    }
    try {
      await navigator.clipboard.writeText(u.toString());
      alert('Kiosk URL copied to clipboard.');
    } catch {
      prompt('Kiosk URL:', u.toString());
    }
  };

  override render() {
    const p = this.planner;
    // Offline (LocalApi) never talks to HA — show a neutral pill instead of a
    // connection status that would imply a live HA link.
    const connClass = p.isOffline ? ''
                    : p.conn === 'connected' ? 'connected'
                    : p.conn === 'auth_invalid' || p.conn === 'error' ? 'error' : '';
    const connText = p.isOffline ? 'Offline'
                   : p.conn === 'connected' ? 'Connected'
                   : p.conn === 'auth_invalid' ? 'Auth Invalid'
                   : p.conn === 'connecting' ? 'Connecting…' : 'Disconnected';
    return html`
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;padding:0 12px;height:48px;
                  background:var(--surface2);border-bottom:1px solid var(--border)">
        ${p.uiMode === 'edit' ? html`
          <button class="btn-sm ${p.sidebarOpen ? 'active' : ''}"
                  title=${p.sidebarOpen ? 'Hide side panel' : 'Show side panel'}
                  style="font-size:14px;padding:4px 8px"
                  @click=${() => p.toggleSidebar()}>☰</button>
        ` : nothing}
        <button class="btn-sm" title="Open Home Assistant menu"
                style="font-size:14px;padding:4px 8px"
                @click=${this._openHaMenu}>🏠</button>
        <button class="btn-sm"
                title=${p.view === '2d' ? 'Switch to 3D view' : 'Switch to 2D view'}
                @click=${() => p.setView(p.view === '2d' ? '3d' : '2d')}>
          ${p.view === '2d' ? '3D' : '2D'}
        </button>
        <span style="font-size:15px;font-weight:600;white-space:nowrap">Diorama</span>
        ${p.uiMode !== 'edit' ? html`
          <select title="Current floor"
                  style="background:#111;color:var(--text);border:1px solid var(--border);
                         border-radius:5px;padding:5px 8px;font-size:12px"
                  .value=${p.store.currentFloorId}
                  @change=${(e: Event) => p.switchFloor((e.target as HTMLSelectElement).value)}>
            ${p.enabledFloors().map(f => html`
              <option value=${f.id}>
                ${f.name} — ${fmtLen(f.w, p.store.imperial)} × ${fmtLen(f.d, p.store.imperial)}
              </option>
            `)}
          </select>
        ` : nothing}
        ${!p.uiModeLocked ? html`
          <select title="UI mode: Edit (full editor) / Kiosk (interact with devices, no editing) / View only (visualization, no interaction)"
                  style="background:#111;color:var(--text);border:1px solid var(--border);
                         border-radius:5px;padding:5px 8px;font-size:12px"
                  .value=${p.uiMode}
                  @change=${(e: Event) => p.setUiMode((e.target as HTMLSelectElement).value as 'edit' | 'kiosk' | 'view')}>
            <option value="edit">✏️ Edit</option>
            <option value="kiosk">🖥 Kiosk</option>
            <option value="view">👁 View only</option>
          </select>
        ` : nothing}
        ${p.uiMode === 'edit' ? html`
          <button class="btn" title="Copy a kiosk URL reproducing the current floor, view, and 3D camera — open it on a wall tablet (add &lock=1 in the URL to hide the mode switcher there)"
                  @click=${this._copyKioskLink}>🔗 Kiosk link</button>
        ` : nothing}
        <button class="btn-sm ${this._refreshing ? 'active' : ''}"
                title="Re-fetch all entity states from Home Assistant"
                ?disabled=${this._refreshing || !p.hass || p.conn !== 'connected'}
                @click=${this._refreshStates}>↻</button>
        ${p.uiMode === 'edit' ? html`
          <button class="btn-sm" title="Settings" @click=${this._openSettings}>⚙</button>
        ` : nothing}
        <span style="flex:1"></span>
        <diorama-alert-center .planner=${p}></diorama-alert-center>
        <span class="pill ${connClass}">${connText}</span>
      </div>
    `;
  }

  // HA frontend listens for this event (bubbling + composed so it crosses
  // the shadow boundary) and toggles its sidebar drawer. No-op in iframe
  // mode — nothing listens there.
  private _openHaMenu = () => {
    this.dispatchEvent(new Event('hass-toggle-menu', { bubbles: true, composed: true }));
  };

  private _refreshStates = async () => {
    const p = this.planner;
    if (!p.hass || this._refreshing) return;
    this._refreshing = true;
    try {
      await p.refreshStates();
    } catch (err) {
      console.warn('refreshStates failed:', err);
    } finally {
      this._refreshing = false;
    }
  };

  private _openSettings = () => {
    this.dispatchEvent(new CustomEvent('open-settings', { bubbles: true, composed: true }));
  };
}
