import { LitElement, html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { customElement } from './define.js';
// Type-only import — erased at build time. The actual module (which pulls in
// all of three.js, ~600 kB) is loaded lazily in firstUpdated so the 2D-only
// startup path never downloads it.
import type { ThreeDRenderer, ZoneWorld, HaloWorld, TargetWorld, ActivityContext,
  GpsPinWorld, GpsLandmarkWorld, GeoEventWorld, WeatherFxState } from '../three-renderer.js';
import { localToWorld, transformVerts, pointInPolygon, sensorColor, hexToInt, motionColor, lightIconKind, furnitureKind, resolveFurnitureDef, furnitureCat, alarmStateColor, doorSpanCenter } from '../geometry.js';
import { compass8 } from '../geo.js';
import { resolveScenePreset, resolveTimeBucket } from '../time-of-day.js';
import { conditionIntensity, weatherEffectEnabled } from '../weather.js';
import { loadModel } from '../model-store.js';
import { newId } from '../storage.js';
import type { Planner } from '../planner.js';

@customElement('diorama-three-view')
export class ThreeView extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @query('#three-area') private _area!: HTMLElement;
  private _renderer: ThreeDRenderer | null = null;
  private _ro: ResizeObserver | null = null;
  private _raf = 0;
  private _simsCamOn = false;   // runtime-only Sims-cam azimuth-snap toggle

  protected override createRenderRoot() { return this; }

  override render() {
    const p = this.planner;
    const saved = p?.store.views3d ?? [];
    const btn = (label: string, title: string, k: 'iso' | 'top' | 'front' | 'back' | 'left' | 'right') => html`
      <button title=${title}
              style="font-size:10px;padding:3px 7px;background:#1c2733;border:1px solid #33465a;
                     border-radius:3px;color:#cfd8dc;cursor:pointer"
              @click=${() => this._renderer?.applyViewPreset(k)}>${label}</button>`;
    return html`
      <div id="three-area" style="position:absolute;inset:0"></div>
      <div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;align-items:center;
                  background:rgba(10,14,20,0.72);border:1px solid #2a3a4c;border-radius:5px;
                  padding:4px 6px;z-index:5;flex-wrap:wrap">
        ${btn('Iso', 'Isometric three-quarter view', 'iso')}
        ${btn('Top', 'Straight-down overhead', 'top')}
        ${btn('Front', 'Front elevation (bottom edge of 2D plan)', 'front')}
        ${btn('Back', 'Back elevation', 'back')}
        ${btn('Left', 'Left elevation', 'left')}
        ${btn('Right', 'Right elevation', 'right')}
        <button title="Sims cam — dimetric view with 45° azimuth snap on orbit"
                style="font-size:10px;padding:3px 7px;border-radius:3px;cursor:pointer;
                       ${this._simsCamOn
                         ? 'background:#2e7d32;border:1px solid #43a047;color:#e8f5e9'
                         : 'background:#1c2733;border:1px solid #33465a;color:#a5d6a7'}"
                @click=${() => this._toggleSimsCam()}>💎 Sims</button>
        <button title="Glass house — show every floor at once, other stories translucent"
                style="font-size:10px;padding:3px 7px;border-radius:3px;cursor:pointer;
                       ${p?.store.scene3d?.glassHouse
                         ? 'background:#2e7d32;border:1px solid #43a047;color:#e8f5e9'
                         : 'background:#1c2733;border:1px solid #33465a;color:#a5d6a7'}"
                @click=${() => this._toggleGlassHouse()}>🏠</button>
        <button title="Auto-follow — camera tracks and frames the active people"
                style="font-size:10px;padding:3px 7px;border-radius:3px;cursor:pointer;
                       ${p?.store.scene3d?.autoFollow
                         ? 'background:#2e7d32;border:1px solid #43a047;color:#e8f5e9'
                         : 'background:#1c2733;border:1px solid #33465a;color:#a5d6a7'}"
                @click=${() => this._toggleAutoFollow()}>🎥</button>
        <button title="Cinematic orbit — slowly circle the camera around the avatars"
                style="font-size:10px;padding:3px 7px;border-radius:3px;cursor:pointer;
                       ${p?.store.scene3d?.cinematicOrbit
                         ? 'background:#2e7d32;border:1px solid #43a047;color:#e8f5e9'
                         : 'background:#1c2733;border:1px solid #33465a;color:#a5d6a7'}"
                @click=${() => this._toggleCinematicOrbit()}>🎬</button>
        ${saved.length ? html`
          <select style="font-size:10px;background:#1c2733;border:1px solid #33465a;border-radius:3px;
                         color:#cfd8dc;max-width:110px"
                  @change=${(e: Event) => {
                    const id = (e.target as HTMLSelectElement).value;
                    const v = (p.store.views3d ?? []).find(x => x.id === id);
                    if (v) this._renderer?.setCameraView(v.pos, v.target);
                    (e.target as HTMLSelectElement).value = '';
                  }}>
            <option value="">Saved…</option>
            ${saved.map(v => html`<option value=${v.id}>${v.name}</option>`)}
          </select>
          ${p.uiMode === 'edit' ? html`
            <button title="Delete a saved view"
                    style="font-size:10px;padding:3px 5px;background:#1c2733;border:1px solid #33465a;
                           border-radius:3px;color:#cfd8dc;cursor:pointer"
                    @click=${() => this._deleteSavedView()}>🗑</button>
          ` : nothing}
        ` : nothing}
        ${p.uiMode === 'edit' ? html`
          <button title="Save the current camera as a named view"
                  style="font-size:10px;padding:3px 7px;background:#1c2733;border:1px solid #33465a;
                         border-radius:3px;color:#ffd54f;cursor:pointer"
                  @click=${() => this._saveCurrentView()}>💾 Save</button>
        ` : nothing}
      </div>
    `;
  }

  // Toggle Sims cam: first click frames the dimetric preset and enables the
  // 45°-azimuth snap; second click releases the snap (leaving the pose alone).
  private _toggleSimsCam(): void {
    this._simsCamOn = !this._simsCamOn;
    if (this._simsCamOn) this._renderer?.applyViewPreset('sims');
    this._renderer?.setSimsCam(this._simsCamOn);
    this.requestUpdate();
  }

  // Glass-house toggle: flip scene3d.glassHouse (creating scene3d if absent),
  // persist, and emit config so the ghost-floor key flips and rebuilds.
  private _toggleGlassHouse(): void {
    const p = this.planner;
    if (!p.store.scene3d) p.store.scene3d = { preset: 'night' };
    p.store.scene3d.glassHouse = !p.store.scene3d.glassHouse;
    p.save(); p.emitConfig();
    this.requestUpdate();
  }

  // Auto-follow toggle: flip scene3d.autoFollow (creating scene3d if absent),
  // persist, and emit config. The renderer reads the flag each tick.
  private _toggleCinematicOrbit(): void {
    const p = this.planner;
    if (!p.store.scene3d) p.store.scene3d = { preset: 'night' };
    p.store.scene3d.cinematicOrbit = !p.store.scene3d.cinematicOrbit;
    p.save(); p.emitConfig();
    this.requestUpdate();
  }

  private _toggleAutoFollow(): void {
    const p = this.planner;
    if (!p.store.scene3d) p.store.scene3d = { preset: 'night' };
    p.store.scene3d.autoFollow = !p.store.scene3d.autoFollow;
    p.save(); p.emitConfig();
    this.requestUpdate();
  }

  private _saveCurrentView(): void {
    const v = this._renderer?.cameraView();
    if (!v) return;
    const name = prompt('Name this view:', `View ${(this.planner.store.views3d?.length ?? 0) + 1}`);
    if (!name) return;
    const p = this.planner;
    if (!p.store.views3d) p.store.views3d = [];
    p.store.views3d.push({ id: newId('vw'), name, pos: v.pos, target: v.target });
    p.save(); p.emitConfig();
    this.requestUpdate();
  }

  private _deleteSavedView(): void {
    const p = this.planner;
    const views = p.store.views3d ?? [];
    if (!views.length) return;
    const name = prompt(`Delete which view?\n${views.map(v => v.name).join(', ')}`, views[views.length - 1].name);
    if (!name) return;
    const idx = views.findIndex(v => v.name === name);
    if (idx < 0) return;
    views.splice(idx, 1);
    p.save(); p.emitConfig();
    this.requestUpdate();
  }

  override async firstUpdated(): Promise<void> {
    let mod: typeof import('../three-renderer.js');
    try {
      mod = await import('../three-renderer.js');
    } catch (err) {
      this._area.innerHTML =
        '<div style="padding:20px;color:#ef9a9a;font-size:13px">' +
        'Failed to load 3D renderer module.<br><pre style="font-size:11px;color:#aaa">' +
        ((err as Error).message || String(err)) + '</pre></div>';
      return;
    }
    if (!this.isConnected) return;  // user switched away during download
    this._renderer = new mod.ThreeDRenderer(this._area);
    await this._renderer.load();
    this._ro = new ResizeObserver(() => {
      const w = this._area.clientWidth || 600, h = this._area.clientHeight || 400;
      this._renderer?.resize(w, h);
    });
    this._ro.observe(this._area);
    // Fixture click → toggle whatever entity is bound (uses entity's actual
    // domain so a "switch" fixture bound to a light entity does light.toggle).
    this._renderer.onFixtureClick(({ kind, entity_id, fixtureId }) => {
      const p = this.planner;
      // Alarm keypad → open the control/status modal (view mode: no interaction).
      if (kind === 'alarm') {
        if (p.uiMode === 'view') return;
        this.dispatchEvent(new CustomEvent('open-alarm', {
          bubbles: true, composed: true, detail: { id: fixtureId },
        }));
        return;
      }
      // Smoke / CO detector → unbound: manual test trigger (flip localState);
      // bound: display-only no-op (a binary_sensor can't be toggled).
      if (kind === 'safety') {
        if (p.uiMode === 'view' || entity_id) return;
        const s = p.floor().safetySensors?.find(x => x.id === fixtureId);
        if (s) p.toggleItem(s);
        return;
      }
      // Robot → run/dock (bound) or demo toggle (unbound). Refuses in view mode.
      if (kind === 'robot') {
        const ro = p.floor().robots?.find(x => x.id === fixtureId);
        if (ro) p.toggleRobot(ro);
        return;
      }
      // toggleEntity/toggleItem refuse in view-only mode.
      if (entity_id) { p.toggleEntity(entity_id); return; }
      // Unbound fixture → local control: resolve the item by kind + id and flip
      // its localState (media = TV/wall_tv furniture).
      const f = p.floor();
      const item = kind === 'light' ? f.lights.find(x => x.id === fixtureId)
        : kind === 'switch' ? f.switches.find(x => x.id === fixtureId)
        : f.furniture.find(x => x.id === fixtureId);
      if (item) p.toggleItem(item);
    });
    this._renderer.onFixtureDblClick(({ kind, entity_id, fixtureId }) => {
      const p = this.planner;
      if (p.uiMode === 'view') return;
      const f = p.floor();

      // Bound media furniture (TVs): open the media control modal. Unbound in
      // edit → pick a media_player entity (only reachable in 2D today since
      // unbound TVs aren't raycast targets, but kept for symmetry).
      if (kind === 'media') {
        if (entity_id) {
          this.dispatchEvent(new CustomEvent('open-media-config', {
            bubbles: true, composed: true, detail: { entityId: entity_id },
          }));
        } else if (p.uiMode === 'edit') {
          const fu = f.furniture.find(x => x.id === fixtureId);
          if (fu) this.dispatchEvent(new CustomEvent('open-entity-picker', {
            bubbles: true, composed: true,
            detail: {
              domain: 'media_player',
              onPick: (id: string) => { fu.entity_id = id; p.save(); p.emitConfig(); },
            },
          }));
        }
        return;
      }

      // Fan / fan_light light-fixtures: open the combined light+fan control.
      if (kind === 'light') {
        const l = f.lights.find(x => x.id === fixtureId);
        if (l && (l.iconKind === 'fan' || l.iconKind === 'fan_light')) {
          const lightEnt = p.isLightEntity(l.entity_id) ? l.entity_id : null;
          const fanEnt = l.fanEntity
            || (l.entity_id && l.entity_id.startsWith('fan.') ? l.entity_id : null);
          if (lightEnt || fanEnt) {
            this.dispatchEvent(new CustomEvent('open-light-config', {
              bubbles: true, composed: true,
              detail: { entityId: lightEnt, fanEntityId: fanEnt },
            }));
          } else if (p.uiMode === 'edit') {
            this.dispatchEvent(new CustomEvent('open-entity-picker', {
              bubbles: true, composed: true,
              detail: {
                domain: 'fan',
                onPick: (id: string) => { l.fanEntity = id; p.save(); p.emitConfig(); },
              },
            }));
          }
          return;
        }
      }

      if (p.isLightEntity(entity_id)) {
        this.dispatchEvent(new CustomEvent('open-light-config', {
          bubbles: true, composed: true, detail: { entityId: entity_id },
        }));
      } else if (p.uiMode !== 'edit') {
        return;  // kiosk: no binding pickers
      } else if (!entity_id) {
        const arr = kind === 'light' ? f.lights : f.switches;
        const it = arr.find(x => x.id === fixtureId);
        if (!it) return;
        this.dispatchEvent(new CustomEvent('open-entity-picker', {
          bubbles: true, composed: true,
          detail: {
            domain: kind,
            onPick: (id: string) => { it.entity_id = id; p.save(); p.emitConfig(); },
          },
        }));
      }
    });
    this._startSync();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._raf) cancelAnimationFrame(this._raf);
    this._ro?.disconnect();
    this._renderer?.destroy();
    this._renderer = null;
  }

  private _lastFloorId: string | null = null;
  // Recent-trigger tracking for thought bubbles: prev on/off per interactive
  // fixture (light / switch / TV) keyed by item id, and a rolling list of the
  // last few transitions (world mm + wall-clock). Fed into ActivityContext each
  // tick; pruned to 45 s / 8 entries; cleared on floor switch.
  private _trigPrevOn = new Map<string, boolean>();
  private _recentTrigs: { kind: 'light_on' | 'light_off' | 'fireplace' | 'tv' | 'doorbell'; x: number; y: number; at: number }[] = [];
  // ?view3d= / ?cam= template application. Saved views live in the HA store,
  // which loads async — retry each tick until found, then fall back to the
  // default iso framing if the named view never appears.
  private _tplPending = true;
  private _tplStart = 0;

  private _applyUrlTemplate(): void {
    if (!this._tplPending || !this._renderer?.loaded) return;
    const p = this.planner;
    const tpl = p.urlTemplate;
    if (!tpl.cam && !tpl.view3d) { this._tplPending = false; return; }
    if (!this._tplStart) this._tplStart = performance.now();
    if (tpl.cam && tpl.cam.length === 6) {
      const c = tpl.cam;
      this._renderer.setCameraView([c[0], c[1], c[2]], [c[3], c[4], c[5]]);
      this._tplPending = false;
      return;
    }
    const want = (tpl.view3d ?? '').toLowerCase();
    const v = (p.store.views3d ?? []).find(x =>
      x.id === tpl.view3d || x.name.toLowerCase() === want);
    if (v) {
      this._renderer.setCameraView(v.pos, v.target);
      this._tplPending = false;
    } else if (performance.now() - this._tplStart > 15000) {
      // Named view no longer exists — fail back to the default framing.
      this._renderer.applyViewPreset('iso');
      this._tplPending = false;
    }
  }

  // Thin wrapper over the shared resolver (src/time-of-day.ts) — kept so the
  // tick call site and the _keyFloor dependency stay put. Checked every tick;
  // the result feeds _keyFloor, so the scene only rebuilds when it changes.
  private _effectivePreset(
    sc: import('../types.js').Scene3D,
    states: Record<string, import('../types.js').HassState>,
  ): import('../types.js').ScenePreset {
    // W2 weather lighting modifier: when affectLighting is on, a live weather
    // condition can downgrade a bright day preset to dusk (see resolveScenePreset).
    const p = this.planner;
    const w = p.store.weather;
    const wnow = p.weatherNow;
    const weatherMod = wnow
      ? { condition: wnow.condition, affect: w?.affectLighting !== false }
      : undefined;
    return resolveScenePreset(sc, states, weatherMod);
  }

  // W2: derive the renderer WeatherFxState from planner.weatherNow, mapping the
  // meteorological wind bearing into the PLAN frame (geo θ when calibrated, else
  // plan-north-relative). Returns a no-effect 'sunny' state whenever the layer
  // is off, effects3d is disabled, or there's no live weather — updateWeather
  // then clears any active particles / fog.
  private _weatherFxState(layers: import('../types.js').Layers2D): WeatherFxState {
    const p = this.planner;
    const w = p.store.weather;
    const wnow = p.weatherNow;
    const states = p.hass?.states ?? {};
    // Effect-resolution flow (W3): the weatherFx LAYER + the effects3d MASTER +
    // the presence of live weather gate every effect-GROUP member; each member
    // ALSO honors its own per-key toggle (weatherEffectEnabled). `sunPosition` is
    // a lighting behavior (not a group member), so it is gated ONLY on its own
    // key + a live source — never on effects3d or the layer.
    const groupOn = layers.weatherFx !== false && w?.effects3d !== false && !!wnow;
    const mk = (k: import('../types.js').WeatherEffectKey) => groupOn && weatherEffectEnabled(w, k);
    const effects: Record<import('../types.js').WeatherEffectKey, boolean> = {
      precip: mk('precip'), fog: mk('fog'), lightning: mk('lightning'),
      wind: mk('wind'), clouds: mk('clouds'), frost: mk('frost'),
      puddles: mk('puddles'), precipForecast: mk('precipForecast'),
      sunPosition: !!wnow && weatherEffectEnabled(w, 'sunPosition'),
    };

    // Fitted geo θ recovers plan-north from calibration (else θ = 0 = plan-north).
    const fit = p.geoFit();
    const theta = fit && fit.transform.quality !== 'none' ? fit.transform.thetaRad : 0;
    const c = Math.cos(theta), s = Math.sin(theta);

    if (!wnow) {
      return {
        condition: 'sunny', intensity01: 0, windKmh: 0, windBearingPlanRad: null,
        isDay: true, effects,
      };
    }

    // Meteorological bearing = direction wind blows FROM (deg CW from geo north).
    // Wind blows TOWARD from+180. Map that geo direction into the plan frame.
    let planRad: number | null = null;
    if (wnow.windBearing != null && isFinite(wnow.windBearing)) {
      const b = ((wnow.windBearing + 180) * Math.PI) / 180;   // toward-direction, geo
      const east = Math.sin(b), north = Math.cos(b);
      const dx = c * east - s * north, dy = s * east + c * north;
      planRad = Math.atan2(dy, dx);
    }

    // Sun azimuth (compass ° CW from true north) → PLAN-frame azimuth degrees via
    // the same geo θ mapping used for wind; elevation passed raw. Absent → null.
    let sunAzimuthDeg: number | null = null;
    let sunElevationDeg: number | null = null;
    const sun = states['sun.sun'];
    if (sun) {
      const sa = parseFloat(String((sun.attributes as Record<string, unknown>)?.azimuth));
      const se = parseFloat(String((sun.attributes as Record<string, unknown>)?.elevation));
      if (isFinite(sa)) {
        const a = (sa * Math.PI) / 180;
        const east = Math.sin(a), north = Math.cos(a);
        const dx = c * east - s * north, dy = s * east + c * north;
        sunAzimuthDeg = (Math.atan2(dx, dy) * 180) / Math.PI;   // plan compass (0=+Y,90=+X)
      }
      if (isFinite(se)) sunElevationDeg = se;
    }

    return {
      condition: wnow.condition,
      intensity01: conditionIntensity(wnow.condition),
      windKmh: wnow.windKmh ?? 0,
      windBearingPlanRad: planRad,
      isDay: wnow.isDay,
      effects,
      cloudCoverage: wnow.cloudCoverage ?? null,
      visibilityKm: wnow.visibilityKm ?? null,
      windGustKmh: wnow.windGustKmh ?? null,
      apparentC: wnow.apparentC ?? null,
      rainSoon: wnow.rainSoon,
      sunAzimuthDeg,
      sunElevationDeg,
    };
  }

  private _tickFails = 0;
  private _startSync(): void {
    const tick = () => {
      // Always reschedule first so a thrown exception below cannot leave the
      // sync loop dead with the previous floor's meshes still in the scene.
      this._raf = requestAnimationFrame(tick);
      try {
        this._tickOnce();
        if (this._tickFails) { this._tickFails = 0; this._hideTickError(); }
      } catch (err) {
        console.error('three-view sync tick failed:', err);
        // A one-off bad frame recovers silently, but a PERSISTENTLY failing
        // tick used to render as an inexplicable frozen/blank view (the iOS
        // app has no console). Surface the actual error on screen instead.
        if (++this._tickFails === 30) this._showTickError(err);
      }
    };
    this._raf = requestAnimationFrame(tick);
  }

  private _showTickError(err: unknown): void {
    this._hideTickError();
    const d = document.createElement('div');
    d.id = 'three-tick-error';
    d.style.cssText = 'position:absolute;left:8px;bottom:8px;right:8px;z-index:30;' +
      'background:rgba(120,20,20,0.92);color:#ffd7d7;font-size:11px;padding:8px 10px;' +
      'border-radius:6px;max-height:40%;overflow:auto;white-space:pre-wrap;word-break:break-all';
    d.textContent = '3D view is failing to render:\n' +
      ((err as Error)?.stack || (err as Error)?.message || String(err));
    this._area.appendChild(d);
  }
  private _hideTickError(): void {
    this._area.querySelector('#three-tick-error')?.remove();
  }

  // Dirty keys per scene group. Each update* call rebuilds geometry +
  // materials from scratch, so we gate them: rebuild only when the inputs
  // that feed that group actually changed. Key strings are cheap to build
  // (string concat of revision counters + relevant entity states) compared
  // to the geometry churn they prevent.
  private _keyFloor = '';
  private _keyDoors = '';
  private _keySensors = '';
  private _keyMotion = '';
  private _keyEnv = '';
  private _keyBle = '';
  private _keyAlarm = '';
  private _keySafety = '';
  private _keyRobots = '';
  private _keyNowPlaying = '';
  private _keyCameras = '';
  private _keyPzones = '';
  private _keyLights = '';
  private _keyZones = '';
  private _keyHalos = '';
  private _keyGhost = '';
  private _keyGps = '';
  private _keyWeather = '';

  private _tickOnce(): void {
      const r = this._renderer; if (!r || !r.loaded) return;
      const p = this.planner;
      this._applyUrlTemplate();
      p.lastCam3d = r.cameraView();
      const f = p.floor();
      const states = p.hass?.states ?? {};
      const stOf = (id: string | null | undefined): string =>
        id ? `${states[id]?.state ?? '?'}` : '-';
      // Hard reset all per-floor groups when the floor changes — belt-and-
      // suspenders so a stale renderer state never bleeds across floors.
      // Also clear the dirty keys so everything rebuilds.
      if (this._lastFloorId !== f.id) {
        this._lastFloorId = f.id;
        r.clearTransientGroups();
        this._keyFloor = this._keyDoors = this._keySensors = '';
        this._keyMotion = this._keyEnv = this._keyBle = this._keyAlarm = this._keySafety = '';
        this._keyCameras = this._keyPzones = this._keyNowPlaying = '';
        this._keyLights = this._keyZones = this._keyHalos = '';
        this._keyGhost = this._keyGps = this._keyWeather = '';
        this._trigPrevOn.clear();
        this._recentTrigs.length = 0;
      }

      // Layer visibility (shared with the 2D layer flags): group-scoped
      // layers are cheap per-tick visible flips; furniture + bg gate at
      // floor build time below (they live inside _floorGroup).
      const layers = p.store.layers2d ?? {};
      r.setLayerVisibility(layers);
      r.setPlumbobs((p.store.scene3d?.plumbobs) !== false);

      // Auto-follow camera flag (cheap; the renderer does the per-frame easing).
      r.setAutoFollow(!!p.store.scene3d?.autoFollow);
      // Cinematic slow-orbit flag (renderer advances the azimuth per frame).
      r.setCinematicOrbit(!!p.store.scene3d?.cinematicOrbit);

      // Floor / walls / furniture / bg: structural + effective lighting
      // preset (auto modes flip it as the sun/lux sensor moves) + per-floor
      // look overrides + build-time-gated layers.
      const scBase = p.store.scene3d ?? { preset: 'night' as const };
      const effPreset = this._effectivePreset(scBase, states);
      const scMerged = { ...scBase, ...(f.look3d ?? {}), preset: effPreset };
      // The `geo` layer's 3D pins (landmarks + GPS devices) build in a dedicated
      // _gpsGroup under the _keyGps dirty key below (not part of keyFloor).
      // Appliance in-use indicators + fridge door swings build inside
      // updateFloor (furniture lives in _floorGroup), so their effective states
      // must be part of _keyFloor or the LED / open door wouldn't update on a
      // state change (configRev only bumps on structural edits). Compact hash of
      // each appliance's on/off + any bound fridge door sensor.
      const applianceKey = f.furniture.map(fu => {
        const def = resolveFurnitureDef(fu, p.store.customObjects);
        if (furnitureCat(def) !== 'appliance') return '';
        const on = p.effectiveState(fu)?.state ?? '-';
        const door = fu.doorEntity ? stOf(fu.doorEntity) : '';
        // Per-device power glow (#8): bucket the live power reading to 50 W so the
        // LED-intensity rebuild only fires on a meaningful step (power can be
        // chatty; the live-path RAF reads 2D directly, so bucketing suffices here).
        let pw = '';
        if (fu.powerEntity) {
          const w = parseFloat(states[fu.powerEntity]?.state ?? '');
          pw = isFinite(w) ? String(Math.round(w / 50)) : 'x';
        }
        return `${fu.id}:${on}:${door}:${pw}`;
      }).filter(Boolean).join(',');
      // Room occupancy glow (#1): fold each occupancy-bound room's on/off into
      // _keyFloor so the tinted floor patch rebuilds on an occupancy flip.
      const roomOccKey = (f.rooms ?? [])
        .filter(rm => rm.occupancyEntity)
        .map(rm => `${rm.id}:${stOf(rm.occupancyEntity!)}`).join(',');
      const keyFloor = `${p.configRev}|${effPreset}|` +
        `${layers.furniture !== false}|${layers.appliances !== false}|` +
        `${layers.bg !== false}|${layers.walls !== false}|` +
        `${layers.labels !== false}|${applianceKey}|${roomOccKey}`;
      if (keyFloor !== this._keyFloor) {
        this._keyFloor = keyFloor;
        // customObjects edits bump configRev (via emitConfig) → keyFloor flips
        // → the placed recipe instance rebuilds as its own live preview.
        r.updateFloor(f, scMerged, layers, p.store.customObjects, id => states[id] || null);
      }

      // Glass-house ghost floors: every OTHER story as a translucent shell.
      // Cheap to rebuild; keyed on the glassHouse flag + active floor id.
      const keyGhost = `${p.configRev}|${!!scBase.glassHouse}|${f.id}`;
      if (keyGhost !== this._keyGhost) {
        this._keyGhost = keyGhost;
        r.updateGhostFloors(
          p.store.floors.filter(fl => !fl.disabled || fl.id === f.id),
          f.id, scMerged, p.store.customObjects);
      }

      // Imported 3D model: reload text from IDB when rev changes; rebuild
      // mesh when transform/opacity/visibility changes.
      this._syncModel(f);

      // Doors + windows: structural + bound entity states. Door lock entities
      // (display-only deadbolt) fold in too so a lock/unlock rebuilds the panel.
      // `openKey` also buckets a cover's current_position (5% steps) so a garage
      // door / window blind rebuilds as it partially opens (state alone stays
      // 'opening'/'open' while the position slides).
      const openKey = (id: string | null | undefined): string => {
        const s = id ? states[id] : null;
        if (!s) return '-';
        const pos = (s.attributes as Record<string, unknown> | undefined)?.current_position;
        return typeof pos === 'number' ? `${s.state}:${Math.round(pos / 5)}` : s.state;
      };
      const keyDoors = `${p.configRev}|` +
        f.doors.map(d => `${openKey(d.entity_id)}:${stOf(d.lockEntity)}`).join(',') + '|' +
        f.windows.map(w => `${openKey(w.entity_id)}:${openKey(w.coverEntity)}`).join(',');
      if (keyDoors !== this._keyDoors) {
        this._keyDoors = keyDoors;
        r.updateDoorsWindows(f.doors, f.windows, id => states[id] || null);
      }

      // Doorbell transient pulses (generic flash-then-decay primitive). Resolve
      // each ring to its door's span centre; pass fresh pulses while any exist and
      // an empty list once to clear (the renderer no-ops when idle).
      const nowMs = Date.now();
      const pulses: import('../three-renderer.js').TransientPulse[] = [];
      for (const ring of p.doorbellRings) {
        const ageS = (nowMs - ring.at) / 1000;
        if (ageS > 4) continue;
        const dd = f.doors.find(x => x.id === ring.doorId);
        if (!dd) continue;
        const c = doorSpanCenter(dd);
        pulses.push({ x: c.x, y: c.y, ageS, kind: 'doorbell' });
      }
      r.updateDoorbellPulses(pulses);

      // Sensors: structural + pose entities (height / tilt numbers) +
      // coverage-wedge toggle.
      const keySensors = `${p.configRev}|${p.store.coverage}|` + f.sensors.map(s => {
        const d = p.discBy[s.id];
        return `${stOf(d?.sensorHeight)}:${stOf(d?.mountAngle)}`;
      }).join(',');
      if (keySensors !== this._keySensors) {
        this._keySensors = keySensors;
        r.updateSensors(f.sensors, s => {
          const d = p.discBy[s.id];
          if (!d) return null;
          const hRaw = d.sensorHeight ? states[d.sensorHeight]?.state : undefined;
          const aRaw = d.mountAngle   ? states[d.mountAngle]?.state   : undefined;
          const height = hRaw !== undefined ? parseFloat(hRaw) : NaN;
          const tilt   = aRaw !== undefined ? parseFloat(aRaw) : NaN;
          return {
            height: isFinite(height) ? height : 40,
            tilt:   isFinite(tilt)   ? tilt   : 0,
          };
        }, p.store.coverage);
      }

      // Motion sensors: structural + entity states + visibility toggle.
      const keyMotion = `${p.configRev}|${p.store.showMotionZones !== false}|` +
        f.motionSensors.map(m => stOf(m.entity_id)).join(',');
      if (keyMotion !== this._keyMotion) {
        this._keyMotion = keyMotion;
        r.updateMotionSensors(f.motionSensors, id => states[id] || null,
                              p.store.showMotionZones !== false);
      }

      // Environmental sensors: structural + bound entity readings.
      const keyEnv = `${p.configRev}|` +
        f.envSensors.map(en => stOf(en.entity_id)).join(',');
      if (keyEnv !== this._keyEnv) {
        this._keyEnv = keyEnv;
        r.updateEnvSensors(f.envSensors, id => states[id] || null);
      }

      // BLE proxies: purely structural (no bound live state) — key on config
      // rev + the fixture list so a placement / hide / delete rebuilds it.
      const keyBle = `${p.configRev}|` +
        (f.bleProxies ?? []).map(b => `${b.id}:${Math.round(b.x)}:${Math.round(b.y)}:${b.hidden ? 'h' : ''}`).join(',');
      if (keyBle !== this._keyBle) {
        this._keyBle = keyBle;
        r.updateBleProxies(f.bleProxies ?? []);
      }

      // Alarm keypads: structural + effective state (bound entity or unbound
      // localState). Rebuild on a placement / state change.
      const keyAlarm = `${p.configRev}|` +
        (f.alarmPanels ?? []).map(a =>
          `${a.id}:${Math.round(a.x)}:${Math.round(a.y)}:${Math.round(a.rotation ?? 0)}:${p.effectiveState(a)?.state ?? '-'}`).join(',');
      if (keyAlarm !== this._keyAlarm) {
        this._keyAlarm = keyAlarm;
        r.updateAlarmPanels(f.alarmPanels ?? [], id => states[id] || null);
      }

      // Smoke / CO detectors: structural + effective state. An ALARMING detector
      // pulses (rings animate via performance.now() inside the builder), so any
      // live alarm on the floor forces a per-frame rebuild — the fireplace idiom.
      const safetyList = f.safetySensors ?? [];
      const hasLiveAlarm = safetyList.some(s => p.effectiveState(s)?.state === 'on');
      const keySafety = hasLiveAlarm ? `${Math.random()}` :
        `${p.configRev}|` + safetyList.map(s =>
          `${s.id}:${Math.round(s.x)}:${Math.round(s.y)}:${s.kind}:${p.effectiveState(s)?.state ?? '-'}`).join(',');
      if (keySafety !== this._keySafety) {
        this._keySafety = keySafety;
        r.updateSafetySensors(safetyList, id => states[id] || null);
      }

      // Robot DOCKS are static (build-time): key on config rev + the fixture
      // list + kind/binding. The moving robot BODIES are updated every frame from
      // Planner.robotStates just below (persistent rigs — not dirty-keyed).
      const robotList = f.robots ?? [];
      const keyRobots = `${p.configRev}|` + robotList.map(ro =>
        `${ro.id}:${ro.kind}:${Math.round(ro.x)}:${Math.round(ro.y)}:${ro.entity_id ?? '-'}`).join(',');
      if (keyRobots !== this._keyRobots) {
        this._keyRobots = keyRobots;
        r.updateRobotDocks(robotList);
      }
      // Per-frame: position/animate the moving robot bodies from the planner's
      // controller state (the single source of truth shared with 2D).
      r.updateRobotRigs(robotList, p.robotStates);

      // Now-playing cards (#11): sprites above media_player-bound furniture that
      // is playing/paused. Own dirty key = configRev + per-media (state|title|
      // picture) hash + the furniture/appliance layer flags (per-piece skipping).
      const keyNP = `${p.configRev}|${layers.furniture !== false ? 1 : 0}${layers.appliances !== false ? 1 : 0}|` +
        f.furniture.filter(fu => fu.entity_id?.startsWith('media_player.')).map(fu => {
          const s = states[fu.entity_id!];
          const a = s?.attributes as Record<string, unknown> | undefined;
          return `${fu.id}:${s?.state ?? '-'}:${(a?.media_title as string) ?? ''}:${(a?.entity_picture as string) ?? ''}`;
        }).join('|');
      if (keyNP !== this._keyNowPlaying) {
        this._keyNowPlaying = keyNP;
        r.updateNowPlaying(f.furniture, p.store.customObjects, id => states[id] || null, p.haBaseUrl, layers);
      }

      // Camera fixtures (#10): structural + entity state (recording tint). Rides
      // the sensors layer. Rebuild on placement / rotation / state change.
      const cameraList = f.cameras ?? [];
      const keyCameras = `${p.configRev}|` + cameraList.map(c =>
        `${c.id}:${Math.round(c.x)}:${Math.round(c.y)}:${Math.round(c.rotation ?? 0)}:${Math.round(c.fov ?? 0)}:${Math.round(c.range ?? 0)}:${c.hidden ? 'h' : ''}:${stOf(c.entity_id)}`).join(',');
      if (keyCameras !== this._keyCameras) {
        this._keyCameras = keyCameras;
        r.updateCameras(cameraList, id => states[id] || null);
      }

      // Presence zones (#5): structural + bound occupancy state. Rides the zones
      // layer. Rebuild on shape edit / bind / occupancy flip.
      const pzoneList = f.presenceZones ?? [];
      const keyPzones = `${p.configRev}|` + pzoneList.map(z =>
        `${z.id}:${z.hidden ? 'h' : ''}:${stOf(z.entity_id)}:${z.points.map(v => `${v.x | 0},${v.y | 0}`).join(';')}`).join('|');
      if (keyPzones !== this._keyPzones) {
        this._keyPzones = keyPzones;
        r.updatePresenceZones(pzoneList, id => states[id] || null);
      }

      // GPS device pins + 3D landmark pins (both ride the geo layer). Coarse
      // dirty key: positions rounded to 500 mm + zone + stale, so the sprites
      // rebuild on real movement but not every frame. When the layer is off the
      // inputs go empty (group also hidden via setLayerVisibility above).
      const geoOn = layers.geo !== false;
      const gpsPins = geoOn ? p.gpsPins : [];
      const gpsLandmarks = geoOn ? p.geoLandmarks().filter(l => !l.hidden) : [];
      const geoEvents = geoOn ? p.geoEventPins : [];
      const keyGps = `${p.configRev}|${geoOn}|` +
        gpsPins.map(pn => `${pn.personId}:${Math.round(pn.clampedX / 500)}:${Math.round(pn.clampedY / 500)}:${pn.zone}:${pn.stale ? 1 : 0}`).join(',') + '|' +
        gpsLandmarks.map(l => `${l.id}:${Math.round(l.x / 500)}:${Math.round(l.y / 500)}`).join(',') + '|' +
        geoEvents.map(ev => `${ev.key}:${Math.round(ev.clampedX / 500)}:${Math.round(ev.clampedY / 500)}`).join(',');
      if (keyGps !== this._keyGps) {
        this._keyGps = keyGps;
        const pinsW: GpsPinWorld[] = gpsPins.map(pn => ({
          x: pn.clampedX, y: pn.clampedY, color: pn.color, stale: pn.stale,
          label: pn.zone === 'beyond'
            ? `${pn.isPet ? '🐾' : '📍'} ${pn.name} · ${Math.round(pn.distanceM)} m ${compass8(pn.bearingDeg)}`
            : `${pn.isPet ? '🐾' : '📍'} ${pn.name}`,
        }));
        const lmW: GpsLandmarkWorld[] = gpsLandmarks.map(l => ({ x: l.x, y: l.y, name: l.name || 'Landmark' }));
        const evW: GeoEventWorld[] = geoEvents.map(ev => ({
          x: ev.clampedX, y: ev.clampedY,
          color: ev.category === 'quake' ? '#ffb300' : ev.category === 'fire' ? '#ef5350' : '#b388ff',
          label: `${ev.category === 'fire' ? '🔥' : '⚠️'} ${ev.name} · ${ev.label}`,
        }));
        r.updateGpsPins(pinsW, lmW, evW);
      }

      // Outdoor weather effects (W2). The renderer group is rebuilt only when the
      // condition / intensity bucket / layer flags change; per-frame particle,
      // fog, and lightning motion happens inside the renderer's _animate loop.
      // The effective lighting preset already folds the weather dim into
      // _keyFloor above, so no extra floor plumbing is needed here.
      const fx = this._weatherFxState(layers);
      // Wind drift is baked into each cloud at build time, so a coarse wind
      // speed/bearing bucket joins the key (rebuild on a meaningful wind change).
      const windBucket = `${Math.round(fx.windKmh / 10)}:` +
        `${fx.windBearingPlanRad == null ? 'n' : Math.round(fx.windBearingPlanRad * 4)}`;
      // W3 extended inputs, coarsely bucketed so rebuilds stay rare (per-frame
      // motion / eased lighting continue in the renderer's _advanceWeather).
      const b = (v: number | null | undefined, d: number) =>
        v == null ? 'n' : Math.round(v / d);
      const effKey = (Object.keys(fx.effects ?? {}) as Array<keyof NonNullable<typeof fx.effects>>)
        .map(k => (fx.effects![k] ? '1' : '0')).join('');
      const w3Bucket = `${b(fx.cloudCoverage, 10)}:${b(fx.visibilityKm, 2)}:` +
        `${b(fx.windGustKmh, 10)}:${b(fx.apparentC, 3)}:${b(fx.sunAzimuthDeg, 5)}:` +
        `${fx.sunElevationDeg == null ? 'n' : (fx.sunElevationDeg > 0 ? 'u' : 'd')}:` +
        `${fx.rainSoon ? 'r' : '-'}:${effKey}`;
      const keyWeather = `${p.configRev}|${f.id}|${fx.condition}|` +
        `${Math.round(fx.intensity01 * 4)}|${windBucket}|${w3Bucket}`;
      if (keyWeather !== this._keyWeather) {
        this._keyWeather = keyWeather;
        r.updateWeather(fx);
      }

      // Lights + switches: structural + state/brightness/color per entity.
      // Fireplace lights flicker via Math.random() inside the builder, so an
      // active fireplace forces a rebuild every frame (cheap: few lights).
      const hasLiveFireplace = f.lights.some(l =>
        (l.iconKind === 'fireplace') && p.effectiveState(l)?.state === 'on');
      const keyLights = hasLiveFireplace ? `${Math.random()}` :
        `${p.configRev}|` + f.lights.map(l => {
          const st = l.entity_id ? states[l.entity_id] : null;
          const a = (st?.attributes ?? {}) as Record<string, unknown>;
          // Fan spin speed lives on the fan entity's percentage attribute —
          // part of the key so rotor speed updates on change.
          const fanSt = l.fanEntity ? states[l.fanEntity] : null;
          const fanA = (fanSt?.attributes ?? {}) as Record<string, unknown>;
          return `${st?.state ?? '-'}~${a.brightness ?? ''}~${a.rgb_color ?? ''}~${a.color_temp_kelvin ?? ''}` +
                 `~${a.percentage ?? ''}~${fanSt?.state ?? ''}:${fanA.percentage ?? ''}`;
        }).join(',') + '|' + f.switches.map(s => stOf(s.entity_id)).join(',');
      if (keyLights !== this._keyLights) {
        this._keyLights = keyLights;
        r.updateLightsSwitches(f.lights, f.switches, id => states[id] || null);
      }

      const zones: ZoneWorld[] = [];
      const halos: HaloWorld[] = [];
      const targets: TargetWorld[] = [];
      for (let si = 0; si < f.sensors.length; si++) {
        const s = f.sensors[si];
        if (!s.deviceSlug) continue;
        const z = p.zonesBy[s.id]; const o = p.objectsBy[s.id]; const lerp = p.lerpBy[s.id];
        const tColor = hexToInt(sensorColor(s, si));
        // Per-sensor plumbob color (attribution). Undefined = the default green.
        const sPlumbob = s.plumbobColor ? hexToInt(s.plumbobColor) : undefined;
        // Local occupancy from lerped target positions — see canvas-render
        // for rationale. Same logic mirrored here so 3D and 2D agree.
        const inPoly = (verts: { x: number; y: number }[]): boolean => {
          if (!lerp) return false;
          for (const sl of lerp) {
            if (sl.active && pointInPolygon(sl.cx, sl.cy, verts)) return true;
          }
          return false;
        };
        const inHalo = (cx: number, cy: number, r: number): boolean => {
          if (!lerp) return false;
          for (const sl of lerp) {
            if (!sl.active) continue;
            const dx = sl.cx - cx, dy = sl.cy - cy;
            if (dx * dx + dy * dy <= r * r) return true;
          }
          return false;
        };
        // LD2450 inclusion / filter polys + halos always render. Motion
        // toggle only gates motion-sensor cones (handled in
        // updateMotionSensors). Keeping zones visible matches 2D behavior
        // and lets users edit them while the motion toggle is off.
        if (z) {
          for (const incl of z.inclusion)
            if (incl.enabled && incl.vertices.length >= 3)
              zones.push({ vertices: transformVerts(s, incl.vertices), color: 0x2196f3,
                           occupied: inPoly(incl.vertices) });
          for (const filt of z.filter)
            if (filt.enabled && filt.vertices.length >= 3)
              zones.push({ vertices: transformVerts(s, filt.vertices), color: 0xf44336,
                           occupied: inPoly(filt.vertices) });
        }
        if (o) for (const obj of o) if (obj.enabled) {
          const wp = localToWorld(s, obj.x, obj.y);
          halos.push({ x: wp.x, y: wp.y, radius: obj.radius,
                       occupied: inHalo(obj.x, obj.y, obj.radius) });
        }
        if (lerp) {
          // Gait speed is derived in the renderer from the spring-eased
          // position deltas, not HA's speed entity (see updateTargets).
          for (let i = 0; i < 3; i++) {
            const sl = lerp[i];
            if (!sl.active) continue;
            const wp = localToWorld(s, sl.cx, sl.cy);
            // Edge-of-coverage flag (drives the despawn style — see updateTargets).
            // Sensor-local frame: cy = distance ahead, cx = lateral, so the
            // bearing off boresight is atan2(cx, cy) and range is hypot (matches
            // the 2D coverage-wedge convention in canvas-render).
            const dist = Math.hypot(sl.cx, sl.cy);
            const range = s.range ?? 6000;
            const halfFov = (s.fov ?? 120) / 2;
            const bearing = Math.abs(Math.atan2(sl.cx, sl.cy) * 180 / Math.PI);
            const edge = dist > range - 600 || Math.abs(bearing - halfFov) < 8;
            // Identity fusion (B3): if a BLE person is fused onto this radar
            // target, pass their identity so the renderer swaps in the person's
            // avatar/color + a name label. Undefined otherwise (per-sensor pool).
            const key = `${s.id}_${i}`;
            const fusion = p.fusions[key];
            // avatarKinds pool wins; legacy single avatarKind kept for
            // back-compat (incl. stale-chunk pairings that only read `avatar`).
            targets.push({ key, x: wp.x, y: wp.y, color: tColor, edge,
                           avatar: s.avatarKind, avatars: s.avatarKinds,
                           plumbobColor: sPlumbob,
                           person: fusion ? { name: fusion.name, color: fusion.color,
                             avatarKind: fusion.avatarKind, isPet: fusion.isPet,
                             identified: fusion.personId != null } : undefined });
          }
        }
      }
      // AI avatars: each motion sensor with `avatar` on whose bound entity is
      // firing projects a synthetic wandering target anchored at the sensor
      // position. The renderer's AI controller owns the actual movement (see
      // updateTargets); x/y here is only the spawn/wander anchor. Synthetic
      // targets never set `edge`, so presence-off runs the slow fade-out.
      //
      // Demo mode (`m.demo`): project the avatar ALWAYS — no entity binding or
      // ON state required. A pure display presence that uses the sensor's avatar
      // pool + room confinement exactly like a normal AI avatar. Rendered in
      // kiosk/view modes too (it is display, not interaction).
      for (const m of f.motionSensors) {
        const demo = m.demo === true;
        if (!demo) {
          if (!m.avatar || !m.entity_id) continue;
          if (states[m.entity_id]?.state !== 'on') continue;
        }
        targets.push({ key: 'ai_' + m.id, x: m.x, y: m.y, color: hexToInt(motionColor(m)), ai: true,
                       avatar: m.avatarKind ?? (demo ? 'random' : undefined), avatars: m.avatarKinds,
                       plumbobColor: m.plumbobColor ? hexToInt(m.plumbobColor) : undefined });
      }
      // BLE people on the CURRENT floor: synthetic goal-walk targets. x/y is the
      // (lerped) solved position — the renderer's goal controller walks the rig
      // there at human speed (see _advanceAi goal mode). Identified people carry
      // their avatar; unknown devices fall through to a stable per-key pool pick
      // ('random'). Full rigs — no ghost style (user decision B, #2). Only
      // UNFUSED people render as BLE rigs: a person fused onto a radar target
      // hides here (that target carries their avatar/label) so nobody renders
      // twice (B3).
      for (const bp of p.bleUnfused) {
        if (bp.floorId !== f.id) continue;
        targets.push({
          key: bp.key, x: bp.x, y: bp.y, color: hexToInt(bp.color),
          // Pets with no explicit avatar default to the cat quadruped rig;
          // other unknown devices fall through to the stable human pool pick.
          ble: true, avatar: bp.avatarKind ?? (bp.isPet ? 'cat' : 'random'),
          // Identified BLE people (personId set) get a name label; unknown
          // devices do not (decision #4 — labels only when confident).
          person: bp.personId != null ? { name: bp.name, color: bp.color,
            avatarKind: bp.avatarKind, isPet: bp.isPet, identified: true } : undefined,
        });
      }
      // Zones / halos rebuild only when shape or occupancy changes — not on
      // every target movement frame.
      const keyZones = zones.map(z =>
        `${z.color}:${z.occupied ? 1 : 0}:${z.vertices.map(v => `${v.x | 0},${v.y | 0}`).join(';')}`).join('|');
      if (keyZones !== this._keyZones) {
        this._keyZones = keyZones;
        r.updateZonesWorld(zones);
      }
      const keyHalos = halos.map(h =>
        `${h.x | 0},${h.y | 0},${h.radius | 0},${h.occupied ? 1 : 0}`).join('|');
      if (keyHalos !== this._keyHalos) {
        this._keyHalos = keyHalos;
        r.updateHalos(halos);
      }
      // Per-frame activity context (cheap plain-JS; never dirty-keyed): which
      // bound appliance entities are on/playing, room names, and the coarse
      // time bucket. Drives the Sims-style solo activities in updateTargets.
      const entityOn: Record<string, boolean> = {};
      // Bound appliance door sensors (Furniture.doorEntity) → open flag, for the
      // per-frame appliance-door blend (bound fridge case).
      const doorSensorOpen: Record<string, boolean> = {};
      for (const fu of f.furniture) {
        // effectiveState folds in a locally-ON (unbound) piece so it gates
        // activities / watch_tv exactly like a bound, on entity.
        const st = p.effectiveState(fu);
        if (st) entityOn[fu.id] = st.state === 'on' || st.state === 'playing';
        if (fu.doorEntity && states[fu.doorEntity]?.state === 'on') doorSensorOpen[fu.id] = true;
      }
      const roomNames: Record<string, string> = {};
      for (const rm of f.rooms ?? []) roomNames[rm.id] = rm.name;
      // Weather for weather-flavored idle chatter (null when no source resolved).
      const wn = p.weatherNow;
      const weather = wn
        ? { condition: wn.condition, tempC: wn.tempC, forecastCondition: wn.forecastCondition ?? null }
        : null;
      // Recent-trigger scan: detect on/off transitions of interactive fixtures on
      // the CURRENT floor (lights, switches, TVs) against the prev-on map, and
      // push world-mm entries. Fireplaces map to the 'fireplace' kind on ON.
      const nowS = performance.now() / 1000;
      const note = (id: string, on: boolean,
                    kind: 'light_on' | 'light_off' | 'fireplace' | 'tv' | 'doorbell',
                    x: number, y: number): void => {
        const prev = this._trigPrevOn.get(id);
        if (prev === undefined) { this._trigPrevOn.set(id, on); return; }
        if (prev !== on) {
          this._trigPrevOn.set(id, on);
          if (on ? (kind !== 'light_off') : (kind === 'light_off'))
            this._recentTrigs.push({ kind, x, y, at: nowS });
        }
      };
      for (const l of f.lights) {
        const st = p.effectiveState(l);
        const on = st?.state === 'on';
        const fire = lightIconKind(l) === 'fireplace';
        note('L' + l.id, on, on ? (fire ? 'fireplace' : 'light_on') : 'light_off', l.x, l.y);
      }
      for (const sw of f.switches) {
        const st = p.effectiveState(sw);
        const on = st?.state === 'on';
        note('S' + sw.id, on, on ? 'light_on' : 'light_off', sw.x, sw.y);
      }
      for (const fu of f.furniture) {
        if (furnitureKind(fu) !== 'tv') continue;
        note('F' + fu.id, entityOn[fu.id] === true, 'tv', fu.x, fu.y);
      }
      // Prune >45 s old, then cap at 8 (drop oldest).
      this._recentTrigs = this._recentTrigs.filter(g => nowS - g.at < 45);
      if (this._recentTrigs.length > 8) this._recentTrigs.splice(0, this._recentTrigs.length - 8);
      const recentTriggers = this._recentTrigs.map(g => ({ kind: g.kind, x: g.x, y: g.y, ageS: nowS - g.at }));
      // Doorbell rings feed the same trigger-tier bubble pool (🔔🚪👀). Sourced
      // from Planner.doorbellRings (Date.now() ms) rather than the prev-on map.
      for (const ring of p.doorbellRings) {
        const ageS = (Date.now() - ring.at) / 1000;
        if (ageS >= 8) continue;
        const dd = f.doors.find(x => x.id === ring.doorId);
        if (!dd) continue;
        const c = doorSpanCenter(dd);
        recentTriggers.push({ kind: 'doorbell', x: c.x, y: c.y, ageS });
      }
      const ctx: ActivityContext = { entityOn, roomNames, timeBucket: resolveTimeBucket(states), weather, recentTriggers, doorSensorOpen };
      // Targets every frame — persistent rigs mutate in place (no rebuild).
      r.updateTargets(targets, ctx);
  }

  // ── Imported 3D model sync ────────────────────────────────────────────
  private _modelText: { floorId: string; rev: number; obj: string; mtl: string | null } | null = null;
  private _modelLoading = false;
  private _keyModel = '';

  private _syncModel(f: import('../types.js').Floor): void {
    const r = this._renderer!;
    const meta = f.model3d;
    if (!meta) {
      if (this._keyModel !== '') {
        this._keyModel = '';
        this._modelText = null;
        r.updateModel3D(null, null, null);
      }
      return;
    }
    // Text cache stale → kick off async IDB load (once).
    const haveText = this._modelText &&
      this._modelText.floorId === f.id && this._modelText.rev === meta.rev;
    if (!haveText) {
      if (!this._modelLoading) {
        this._modelLoading = true;
        loadModel(f.id).then(blob => {
          this._modelLoading = false;
          if (blob) {
            this._modelText = { floorId: f.id, rev: meta.rev, obj: blob.obj, mtl: blob.mtl };
            this._keyModel = '';  // force rebuild next tick
          }
        }).catch(() => { this._modelLoading = false; });
      }
      return;
    }
    const key = `${f.id}|${meta.rev}|${meta.scale}|${meta.x}|${meta.y}|${meta.rotation}|${meta.opacity}|${meta.visible}`;
    if (key !== this._keyModel) {
      this._keyModel = key;
      r.updateModel3D(meta, this._modelText!.obj, this._modelText!.mtl);
    }
  }
}
