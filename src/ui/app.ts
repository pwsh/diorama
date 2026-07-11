import { LitElement, html, nothing } from 'lit';
import { query, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { Planner } from '../planner.js';
import { fmtLen } from '../geometry.js';
import { injectSharedStyles } from '../styles.js';
import './auth-screen.js';
import './topbar.js';
import './sidebar.js';
import './canvas-2d.js';
import './three-view.js';
import './weather-chip.js';
import './modals.js';
import type { AuthScreen } from './auth-screen.js';
import type { FloorModal, EntityPicker, LightConfig, MediaConfig, SettingsDrawer } from './modals.js';

@customElement('diorama-app')
export class App extends LitElement {
  @state() private _connected = false;
  private _planner: Planner | null = null;

  @query('diorama-auth') private _auth?: AuthScreen;
  @query('diorama-floor-modal') private _floorModal?: FloorModal;
  @query('diorama-entity-picker') private _entPicker?: EntityPicker;
  @query('diorama-light-config') private _lightConfig?: LightConfig;
  @query('diorama-media-config') private _mediaConfig?: MediaConfig;
  @query('diorama-settings-drawer') private _settings?: SettingsDrawer;

  protected override createRenderRoot() { return this; }

  // Native-panel mode: the panel element builds a Planner wired to HA's own
  // connection and hands it to us. Must be called before the element is
  // appended (i.e. before connectedCallback) so the token auto-launch skips.
  adoptPlanner(p: Planner): void {
    this._planner = p;
    this._planner.addEventListener('config', () => this.requestUpdate());
    this._connected = true;
    this._applyUrlParams(p);
    this.requestUpdate();
  }

  // ?mode=kiosk|view (&lock=1)  ?view=2d|3d  ?floor=<name|id>
  // ?layers=<preset name|id>|simple|full  ?view3d=<saved view name|id>
  // ?cam=x,y,z,tx,ty,tz
  // Floor / layer templates live in the HA store, which loads async — retry
  // on config events for 20 s, then give up (defaults remain = fallback).
  private _tplDone = { floor: false, layers: false };
  private _applyUrlParams(p: Planner): void {
    const q = new URLSearchParams(window.location.search);
    // ?debug3d=1 — on-screen error console for environments with no devtools
    // (the HA companion app). Captures uncaught errors + rejections so a
    // failure can be diagnosed from a screenshot.
    if (q.get('debug3d') === '1' && !document.getElementById('diorama-debug-log')) {
      const log = document.createElement('div');
      log.id = 'diorama-debug-log';
      log.style.cssText = 'position:fixed;left:4px;bottom:4px;right:4px;z-index:9999;' +
        'background:rgba(0,0,0,0.82);color:#9fe89f;font:10px/1.4 monospace;padding:6px;' +
        'max-height:35vh;overflow:auto;pointer-events:none;white-space:pre-wrap;word-break:break-all';
      log.textContent = `debug3d on — ${navigator.userAgent}\n`;
      document.body.appendChild(log);
      const add = (msg: string) => { log.textContent += msg + '\n'; log.scrollTop = log.scrollHeight; };
      window.addEventListener('error', e =>
        add(`ERROR ${e.message} @ ${e.filename?.split('/').pop()}:${e.lineno}`));
      window.addEventListener('unhandledrejection', e =>
        add(`REJECTION ${(e.reason as Error)?.stack || e.reason}`));
    }
    const mode = q.get('mode');
    if (mode === 'kiosk' || mode === 'view') {
      p.setUiMode(mode);
      if (q.get('lock') === '1') p.uiModeLocked = true;
    }
    const view = q.get('view');
    if (view === '2d' || view === '3d') p.view = view;
    p.urlTemplate = {
      floor: q.get('floor') ?? undefined,
      layers: q.get('layers') ?? undefined,
      view3d: q.get('view3d') ?? undefined,
      cam: q.get('cam')?.split(',').map(Number).filter(n => isFinite(n)),
    };
    if (!p.urlTemplate.floor) this._tplDone.floor = true;
    if (!p.urlTemplate.layers) this._tplDone.layers = true;
    const started = performance.now();
    const attempt = () => {
      if (!this._tplDone.floor) {
        const want = (p.urlTemplate.floor ?? '').toLowerCase();
        const fl = p.store.floors.find(f => f.id === p.urlTemplate.floor ||
                                            f.name.toLowerCase() === want);
        if (fl) {
          p.store.currentFloorId = fl.id;
          p.viewCenter = null; p.zoom = 1;
          this._tplDone.floor = true;
          p.emitConfig();
        }
      }
      if (!this._tplDone.layers) {
        const want = (p.urlTemplate.layers ?? '').toLowerCase();
        if (want === 'simple') {
          p.store.layers2d = { bg: false, furniture: false, lights: false, sensors: false,
                               motion: false, env: false, zones: false, targets: true, activity: true };
          this._tplDone.layers = true; p.emitConfig();
        } else if (want === 'full') {
          p.store.layers2d = undefined;
          this._tplDone.layers = true; p.emitConfig();
        } else {
          const pr = (p.store.layerPresets2d ?? []).find(x =>
            x.id === p.urlTemplate.layers || x.name.toLowerCase() === want);
          if (pr) {
            p.store.layers2d = { ...pr.layers };
            this._tplDone.layers = true; p.emitConfig();
          }
        }
      }
      if ((!this._tplDone.floor || !this._tplDone.layers) &&
          performance.now() - started < 20000) return;  // keep listening
      p.removeEventListener('config', attempt);  // done or timed out → defaults stand
    };
    p.addEventListener('config', attempt);
    attempt();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    injectSharedStyles();
    if (this._planner) this._applyUrlParams(this._planner);
    if (!this._planner) {
      const token = localStorage.getItem('diorama:token');
      if (token) {
        const url = localStorage.getItem('diorama:url') || window.location.origin;
        this._launch(url, token);
      }
    }
    this.addEventListener('connect', e => {
      const { url, token } = (e as CustomEvent).detail as { url: string; token: string };
      this._launch(url, token);
    });
    this.addEventListener('open-floor-modal', e => {
      const { floor } = (e as CustomEvent).detail as { floor: import('../types.js').Floor | null };
      this._floorModal?.show(floor);
    });
    this.addEventListener('open-light-config', e => {
      const { entityId, fanEntityId } = (e as CustomEvent).detail as
        { entityId: string | null; fanEntityId?: string | null };
      this._lightConfig?.show(entityId, fanEntityId ?? null);
    });
    this.addEventListener('open-media-config', e => {
      const { entityId } = (e as CustomEvent).detail as { entityId: string };
      this._mediaConfig?.show(entityId);
    });
    this.addEventListener('open-entity-picker', e => {
      const { domain, onPick, devices, title } = (e as CustomEvent).detail as
        { domain?: string; onPick: (id: string) => void;
          devices?: import('./modals.js').PickerDevice[]; title?: string };
      // Device-mode detail (a `devices` list) picks a device id; otherwise the
      // classic entity picker filtered by `domain`.
      if (devices) this._entPicker?.showDevices(devices, onPick, title);
      else this._entPicker?.show(domain ?? '', onPick);
    });
    this.addEventListener('open-settings', () => this._settings?.show());
    // Weather chip click → reveal the sidebar Weather section (edit mode only).
    this.addEventListener('open-weather', () => {
      const p = this._planner;
      if (!p || p.uiMode !== 'edit') return;
      if (!p.sidebarOpen) p.toggleSidebar();
      requestAnimationFrame(() =>
        document.getElementById('diorama-weather-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    });
  }

  private _launch(url: string, token: string): void {
    this._planner = new Planner();
    this._planner.connect(url, token);
    this._planner.addEventListener('conn', () => {
      if (this._planner?.conn === 'auth_invalid') {
        this._auth?.showError('Token rejected by Home Assistant. Check your token.');
        this._connected = false;
        this.requestUpdate();
      }
    });
    // Re-render on view switches and floor changes (lit will reconcile children).
    this._planner.addEventListener('config', () => this.requestUpdate());
    this._connected = true;
    this.requestUpdate();
  }

  override render() {
    if (!this._connected || !this._planner) {
      return html`<diorama-auth></diorama-auth>`;
    }
    const p = this._planner;
    const f = p.floor();
    return html`
      <div style="display:flex;flex-direction:column;height:100%">
        <diorama-topbar .planner=${p}></diorama-topbar>
        <div style="display:flex;flex:1;overflow:hidden;position:relative">
          ${p.uiMode === 'edit' && p.sidebarOpen ? html`
            <div class="sidebar-backdrop" @click=${() => p.toggleSidebar()}></div>
            <diorama-sidebar .planner=${p}></diorama-sidebar>
          ` : nothing}
          <div style="flex:1;position:relative;overflow:hidden;background:var(--bg)">
            <!-- Absolute inset so the canvas gets a real height to size
                 against (height:100% of an auto-height div feeds back into
                 the canvas backing-store resize and paints half-black). -->
            <div style="position:absolute;inset:0;${p.view === '2d' ? '' : 'display:none'}">
              <diorama-canvas-2d .planner=${p}></diorama-canvas-2d>
            </div>
            ${p.view === '3d' ? html`<diorama-three-view .planner=${p}></diorama-three-view>` : nothing}
            <!-- Weather chip overlays the shared canvas area so it shows in
                 both 2D and 3D without a duplicate mount / duplicate interval. -->
            <diorama-weather-chip .planner=${p}></diorama-weather-chip>
            <diorama-zone-edit-bar .planner=${p}></diorama-zone-edit-bar>
            <div style="position:absolute;bottom:10px;right:10px;color:var(--text-dim);font-size:11px;
                        padding:2px 6px;pointer-events:none;
                        text-shadow:0 0 4px rgba(0,0,0,0.85),0 0 2px rgba(0,0,0,0.85)">
              ${f.name} — ${f.sensors.length} sensor${f.sensors.length === 1 ? '' : 's'},
              ${f.walls.length} wall${f.walls.length === 1 ? '' : 's'},
              ${fmtLen(f.w, p.store.imperial)} × ${fmtLen(f.d, p.store.imperial)}
            </div>
          </div>
        </div>
        <diorama-floor-modal .planner=${p}></diorama-floor-modal>
        <diorama-entity-picker .planner=${p}></diorama-entity-picker>
        <diorama-light-config .planner=${p}></diorama-light-config>
        <diorama-media-config .planner=${p}></diorama-media-config>
        <diorama-settings-drawer .planner=${p}></diorama-settings-drawer>
      </div>
    `;
  }

}
