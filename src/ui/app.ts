import { LitElement, html, nothing } from 'lit';
import { query, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { Planner } from '../planner.js';
import { LocalApi, shouldStartOffline } from '../ha-local.js';
import { seedDemoConfigs, seedModelViewer, demoSeedHash, DEMO_SEEDED_KEY, type DemoManifestEntry } from '../demo-seed.js';
import { fmtLen } from '../geometry.js';
import { injectSharedStyles } from '../styles.js';
import './auth-screen.js';
import './topbar.js';
import './sidebar.js';
import './canvas-2d.js';
import './three-view.js';
import './weather-chip.js';
import './compass.js';
import './toolbar.js';
import './modals.js';
import type { AuthScreen } from './auth-screen.js';
import type { FloorModal, EntityPicker, LightConfig, MediaConfig, AlarmModal, ThermostatModal, FlightModal, SettingsDrawer } from './modals.js';

@customElement('diorama-app')
export class App extends LitElement {
  @state() private _connected = false;
  private _planner: Planner | null = null;

  @query('diorama-auth') private _auth?: AuthScreen;
  @query('diorama-floor-modal') private _floorModal?: FloorModal;
  @query('diorama-entity-picker') private _entPicker?: EntityPicker;
  @query('diorama-light-config') private _lightConfig?: LightConfig;
  @query('diorama-media-config') private _mediaConfig?: MediaConfig;
  @query('diorama-alarm-modal') private _alarmModal?: AlarmModal;
  @query('diorama-thermostat-modal') private _thermoModal?: ThermostatModal;
  @query('diorama-flight-modal') private _flightModal?: FlightModal;
  @query('diorama-settings-drawer') private _settings?: SettingsDrawer;

  protected override createRenderRoot() { return this; }

  // Native-panel mode: the panel element builds a Planner wired to HA's own
  // connection and hands it to us. Must be called before the element is
  // appended (i.e. before connectedCallback) so the token auto-launch skips.
  adoptPlanner(p: Planner): void {
    this._planner = p;
    try { (window as unknown as { __dioramaPlanner?: Planner }).__dioramaPlanner = p; } catch { /* ignore */ }
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
        // A disabled floor is hidden from the kiosk/view picker — ignore the
        // param there (fall through to the default/current floor). In edit mode
        // a disabled floor is a legitimate target.
        if (fl && fl.disabled && p.uiMode !== 'edit') {
          this._tplDone.floor = true;   // give up on the param; don't keep retrying
        } else if (fl) {
          p.store.currentFloorId = fl.id;
          p.viewCenter = null; p.zoom = 1;
          this._tplDone.floor = true;
          p.emitConfig();
        }
      }
      if (!this._tplDone.layers) {
        const want = (p.urlTemplate.layers ?? '').toLowerCase();
        if (want === 'simple') {
          p.store.layers2d = { bg: false, furniture: false, appliances: false, lights: false,
                               switches: false, sensors: false,
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
    // Standalone entry only (panel mode adopts a Planner before this runs, so
    // this._planner is already set and the block is skipped — the offline flag
    // never interferes with panel_custom).
    if (!this._planner) {
      if (shouldStartOffline()) {
        this._launchOffline();
      } else {
        const token = localStorage.getItem('diorama:token');
        if (token) {
          const url = localStorage.getItem('diorama:url') || window.location.origin;
          this._launch(url, token);
        }
      }
    }
    this.addEventListener('connect', e => {
      const { url, token } = (e as CustomEvent).detail as { url: string; token: string };
      this._launch(url, token);
    });
    this.addEventListener('connect-offline', () => this._launchOffline());
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
    this.addEventListener('open-alarm', e => {
      const { id } = (e as CustomEvent).detail as { id: string };
      if (this._planner?.uiMode === 'view') return;   // view-only: no interaction
      this._alarmModal?.show(id);
    });
    this.addEventListener('open-thermostat', e => {
      const { id } = (e as CustomEvent).detail as { id: string };
      if (this._planner?.uiMode === 'view') return;   // view-only: no interaction
      this._thermoModal?.show(id);
    });
    // Live aircraft (3D raycast or 2D dart tap) → the read-only detail card.
    // Opens in edit + kiosk; view mode never dispatches, and this guard makes
    // that structural rather than incidental (the alarm/thermostat idiom).
    this.addEventListener('open-flight-info', e => {
      const { hex } = (e as CustomEvent).detail as { hex: string };
      if (this._planner?.uiMode === 'view') return;   // view-only: no interaction
      this._flightModal?.show(hex);
    });
    this.addEventListener('open-entity-picker', e => {
      const { domain, onPick, devices, title } = (e as CustomEvent).detail as
        { domain?: string | string[]; onPick: (id: string) => void;
          devices?: import('./modals.js').PickerDevice[]; title?: string };
      // Device-mode detail (a `devices` list) picks a device id; otherwise the
      // classic entity picker filtered by `domain` (a single domain or a list).
      if (devices) this._entPicker?.showDevices(devices, onPick, title);
      else this._entPicker?.show(domain ?? '', onPick);
    });
    this.addEventListener('open-settings', e => {
      const tab = (e as CustomEvent).detail?.tab as
        undefined | 'connection' | 'display' | 'weather' | 'avatars' | 'integrations' | 'data';
      this._settings?.show(tab);
    });
    // Weather chip click → open the settings drawer on the Weather tab (edit mode only).
    this.addEventListener('open-weather', () => {
      const p = this._planner;
      if (!p || p.uiMode !== 'edit') return;
      this._settings?.show('weather');
    });
  }

  private _launch(url: string, token: string): void {
    this._planner = new Planner();
    try { (window as unknown as { __dioramaPlanner?: Planner }).__dioramaPlanner = this._planner; } catch { /* ignore */ }
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

  // Offline / standalone: a Planner over LocalApi. Configs + the whole editor
  // run with no HA (localStorage-backed user_data). Mirrors the panel-mode
  // adoption path (connectWith + immediate connected UI, no auth flash).
  private _launchOffline(): void {
    this._planner = new Planner();
    try { (window as unknown as { __dioramaPlanner?: Planner }).__dioramaPlanner = this._planner; } catch { /* ignore */ }
    this._planner.connectWith(new LocalApi());
    this._planner.addEventListener('config', () => this.requestUpdate());
    this._connected = true;
    // Hosted-demo boot (standalone offline entry only, and only when the URL
    // asks for it via ?demo). Panel mode never reaches here; normal offline
    // (no ?demo) skips it entirely. Seeds the demo floorplans as configs, opens
    // the requested one, then applies the ?view/?mode/… templates on top.
    const params = (() => {
      try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); }
    })();
    // ?model=<kind> opens a single gallery model in a scratch floor (3D sims
    // framing); ?demo=<slug> opens a whole demo home. Both are demo mode.
    if (params.has('model')) {
      this._planner.demoMode = true;
      void this._bootModel(this._planner, params.get('model'));
    } else if (params.has('demo')) {
      this._planner.demoMode = true;
      void this._bootDemo(this._planner, params.get('demo'));
    }
    this.requestUpdate();
  }

  // Seed/switch the reusable "Model viewer" config holding one instance of the
  // requested kind, then frame it in 3D with the dimetric "sims" camera. Boots
  // in 2D first (set synchronously before the first render) so the switch to 3D
  // mounts <diorama-three-view> FRESH — its _applyUrlTemplate then picks up the
  // cam we pin on planner.urlTemplate (the one window when cam applies, matching
  // the docs floor-plan capture flow). Unknown kind → plain ?demo first-home.
  // Runs ONLY from the ?model standalone path.
  private async _bootModel(planner: Planner, kind: string | null): Promise<void> {
    planner.setView('2d');   // synchronous — lands before Lit's first render
    try {
      const ready = await this._waitFor(() => planner.configIndex !== null, 8000);
      if (!ready || !kind) { await this._bootDemo(planner, null); return; }
      const res = await seedModelViewer(planner, kind);
      if (!res.ok) { await this._bootDemo(planner, null); return; }
      // ?mode / ?lock / etc. apply first; then pin the cam + switch to 3D so the
      // freshly-mounted three-view applies the dimetric pose.
      this._applyUrlParams(planner);
      planner.urlTemplate = { ...planner.urlTemplate, cam: res.cam };
      planner.setView('3d');
    } catch (err) {
      console.warn('[diorama demo] model boot failed:', err);
      try { await this._bootDemo(planner, null); } catch { /* ignore */ }
    } finally {
      this.requestUpdate();
    }
  }

  private _waitFor(cond: () => boolean, timeoutMs: number): Promise<boolean> {
    return new Promise(resolve => {
      const started = performance.now();
      const tick = () => {
        if (cond()) return resolve(true);
        if (performance.now() - started >= timeoutMs) return resolve(false);
        setTimeout(tick, 20);
      };
      tick();
    });
  }

  // Seed the committed demo floorplans (fetched from ./floorplans/, relative so
  // it works under the gh-pages /diorama/demo/ subpath) as offline configs and
  // switch to ?demo=<slug>. Idempotent per browser via a localStorage marker so
  // a visitor's own edits survive reloads; a new build with more homes re-seeds
  // the newcomers. Every fetch is guarded — a failure just leaves the plain
  // offline app. Runs ONLY from the ?demo standalone path.
  private async _bootDemo(planner: Planner, slug: string | null): Promise<void> {
    try {
      // Wait for the offline config registry to load (LocalApi emits a deferred
      // connected + snapshot → _loadFromHa → configIndex). Bounded so a stall
      // never hangs the boot.
      const ready = await this._waitFor(() => planner.configIndex !== null, 8000);
      if (ready) {
        let manifest: DemoManifestEntry[] = [];
        try {
          const res = await fetch('./floorplans/index.json', { cache: 'no-cache' });
          if (res.ok) { const j = await res.json(); if (Array.isArray(j)) manifest = j as DemoManifestEntry[]; }
        } catch (err) { console.warn('[diorama demo] manifest fetch failed:', err); }

        if (manifest.length) {
          const want = demoSeedHash(manifest);
          let marker: string | null = null;
          try { marker = localStorage.getItem(DEMO_SEEDED_KEY); } catch { /* ignore */ }
          if (marker !== want) {
            // Fresh browser or a new build — fetch envelopes + seed missing homes.
            const envelopes: Record<string, unknown> = {};
            await Promise.all(manifest.map(async (m) => {
              try {
                const r = await fetch(`./floorplans/${m.slug}.json`, { cache: 'no-cache' });
                if (r.ok) envelopes[m.slug] = await r.json();
              } catch (err) { console.warn('[diorama demo] envelope fetch failed:', m.slug, err); }
            }));
            await seedDemoConfigs(planner, manifest, envelopes, slug);
            try { localStorage.setItem(DEMO_SEEDED_KEY, want); } catch { /* ignore */ }
          } else {
            // Already seeded this build — no envelope fetch, just open the demo.
            await seedDemoConfigs(planner, manifest, {}, slug);
          }
        }
      }
    } catch (err) {
      console.warn('[diorama demo] boot failed:', err);
    } finally {
      // ?view / ?mode / ?floor / ?layers / ?cam apply ON TOP of the seeded
      // config (which set its own floor + reset view on switch).
      this._applyUrlParams(planner);
      this.requestUpdate();
    }
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
          <!-- Canvas column: the canvas fills the top, the visual toolbar docks
               below it (edit mode only). Because the toolbar is a LAYOUT sibling
               (not an overlay), the canvas shrinks to make room — so the weather
               chip + 2D reset-view button (absolute inside the canvas) clear the
               dock for free, no barOffset / gap hack needed. -->
          <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden">
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
              <!-- Compass overlay: same shared-canvas mount as the chip (one
                   instance covers 2D + 3D); hidden unless compass.show. -->
              <diorama-compass .planner=${p}></diorama-compass>
              <!-- Data attribution (compliance, NOT configurable): shown in ALL
                   UI modes whenever a third-party data feed is enabled AND its
                   data is resolved. One fixed bottom-left container; each active
                   source is its own stacked line. Links are the only
                   pointer-interactive part. -->
              ${(p.store.neighborhood?.enabled === true && p.neighborhoodData != null)
                || (p.store.flights?.enabled === true
                    && (p.store.flights.source ?? 'cloud') === 'cloud' && p.flightsNow != null) ? html`
                <div style="position:absolute;bottom:6px;left:8px;font-size:10px;line-height:1.35;
                            color:var(--text-dim);pointer-events:none;
                            text-shadow:0 0 4px rgba(0,0,0,0.85),0 0 2px rgba(0,0,0,0.85)">
                  ${p.store.neighborhood?.enabled === true && p.neighborhoodData != null ? html`
                    <div>
                      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
                         style="color:inherit;pointer-events:auto;text-decoration:underline">© OpenStreetMap</a>
                      ·
                      <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer"
                         style="color:inherit;pointer-events:auto;text-decoration:underline">OpenFreeMap</a>
                    </div>` : nothing}
                  ${p.store.flights?.enabled === true
                    && (p.store.flights.source ?? 'cloud') === 'cloud' && p.flightsNow != null ? html`
                    <div>
                      Flight data
                      <a href="https://airplanes.live" target="_blank" rel="noopener noreferrer"
                         style="color:inherit;pointer-events:auto;text-decoration:underline">© airplanes.live</a>
                    </div>` : nothing}
                </div>
              ` : nothing}
              <diorama-zone-edit-bar .planner=${p}></diorama-zone-edit-bar>
              ${p.store.showFloorStats !== false ? html`<div style="position:absolute;bottom:10px;right:10px;color:var(--text-dim);font-size:11px;
                          padding:2px 6px;pointer-events:none;
                          text-shadow:0 0 4px rgba(0,0,0,0.85),0 0 2px rgba(0,0,0,0.85)">
                ${f.name} — ${f.sensors.length} sensor${f.sensors.length === 1 ? '' : 's'},
                ${f.walls.length} wall${f.walls.length === 1 ? '' : 's'},
                ${fmtLen(f.w, p.store.imperial)} × ${fmtLen(f.d, p.store.imperial)}
              </div>` : nothing}
            </div>
            <diorama-toolbar .planner=${p}></diorama-toolbar>
          </div>
        </div>
        <diorama-floor-modal .planner=${p}></diorama-floor-modal>
        <diorama-entity-picker .planner=${p}></diorama-entity-picker>
        <diorama-light-config .planner=${p}></diorama-light-config>
        <diorama-media-config .planner=${p}></diorama-media-config>
        <diorama-alarm-modal .planner=${p}></diorama-alarm-modal>
        <diorama-thermostat-modal .planner=${p}></diorama-thermostat-modal>
        <diorama-flight-modal .planner=${p}></diorama-flight-modal>
        <diorama-settings-drawer .planner=${p}></diorama-settings-drawer>
      </div>
    `;
  }

}
