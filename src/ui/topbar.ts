import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fmtLen } from '../geometry.js';
import type { Planner } from '../planner.js';
import type { Floor } from '../types.js';

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
    const connClass = p.conn === 'connected' ? 'connected'
                    : p.conn === 'auth_invalid' || p.conn === 'error' ? 'error' : '';
    const connText = p.conn === 'connected' ? 'Connected'
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
        <span style="font-size:15px;font-weight:600;white-space:nowrap">Diorama</span>
        <select title="Current floor"
                style="background:#111;color:var(--text);border:1px solid var(--border);
                       border-radius:5px;padding:5px 8px;font-size:12px"
                .value=${p.store.currentFloorId}
                @change=${(e: Event) => p.switchFloor((e.target as HTMLSelectElement).value)}>
          ${p.store.floors.map(f => html`
            <option value=${f.id}>
              ${f.name} — ${fmtLen(f.w, p.store.imperial)} × ${fmtLen(f.d, p.store.imperial)}
            </option>
          `)}
        </select>
        ${p.uiMode === 'edit' ? html`
          <button class="btn" title="New floor" @click=${this._openNew}>+ Floor</button>
          <button class="btn" title="Edit floor size / name" @click=${this._openEdit}>✎</button>
          <button class="btn danger" title="Delete current floor" @click=${this._delFloor}>🗑</button>
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
        <span style="flex:1"></span>
        <div style="display:flex;gap:4px">
          <button class="btn-sm ${p.view === '2d' ? 'active' : ''}"
                  @click=${() => p.setView('2d')}>2D</button>
          <button class="btn-sm ${p.view === '3d' ? 'active' : ''}"
                  @click=${() => p.setView('3d')}>3D</button>
        </div>
        <label style="display:flex;align-items:center;gap:6px;padding:0"
               title="Show mmWave sensor coverage cones">
          <span style="color:var(--text-dim);font-size:11px">Cov</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${p.store.coverage}
                   @change=${(e: Event) => { p.store.coverage = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); }}>
            <span></span>
          </span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;padding:0"
               title="Show motion sensor coverage zones">
          <span style="color:var(--text-dim);font-size:11px">Motion</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${p.store.showMotionZones !== false}
                   @change=${(e: Event) => { p.store.showMotionZones = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); }}>
            <span></span>
          </span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;padding:0">
          <span style="color:var(--text-dim);font-size:11px">Imp</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${p.store.imperial}
                   @change=${(e: Event) => { p.store.imperial = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); }}>
            <span></span>
          </span>
        </label>
        <button class="btn-sm ${this._refreshing ? 'active' : ''}"
                title="Re-fetch all entity states from Home Assistant"
                ?disabled=${this._refreshing || !p.hass || p.conn !== 'connected'}
                @click=${this._refreshStates}>↻</button>
        <button class="btn-sm ${p.showDetails ? 'active' : ''}"
                title="Toggle target detail overlay"
                @click=${this._toggleDetails}>ⓘ</button>
        ${p.uiMode === 'edit' ? html`
          <button class="btn-sm" title="Settings" @click=${this._openSettings}>⚙</button>
        ` : nothing}
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

  private _toggleDetails = () => {
    const p = this.planner;
    p.showDetails = !p.showDetails;
    p.store.showDetails = p.showDetails;
    p.save();
    p.emitConfig();
  };

  private _openNew = () => {
    this.dispatchEvent(new CustomEvent('open-floor-modal', {
      bubbles: true, composed: true, detail: { floor: null },
    }));
  };
  private _openEdit = () => {
    this.dispatchEvent(new CustomEvent('open-floor-modal', {
      bubbles: true, composed: true, detail: { floor: this.planner.floor() as Floor },
    }));
  };
  private _delFloor = () => {
    const f = this.planner.floor();
    if (this.planner.store.floors.length <= 1) { alert('At least one floor is required.'); return; }
    if (!confirm(`Delete floor "${f.name}"?`)) return;
    this.planner.deleteFloor(f.id);
  };
  private _openSettings = () => {
    this.dispatchEvent(new CustomEvent('open-settings', { bubbles: true, composed: true }));
  };
}
