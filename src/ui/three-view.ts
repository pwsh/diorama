import { LitElement, html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { customElement } from './define.js';
// Type-only import — erased at build time. The actual module (which pulls in
// all of three.js, ~600 kB) is loaded lazily in firstUpdated so the 2D-only
// startup path never downloads it.
import type { ThreeDRenderer, ZoneWorld, HaloWorld, TargetWorld, ActivityContext,
  InteractiveItem, GpsPinWorld, GpsLandmarkWorld, GeoEventWorld, WeatherFxState, VacMapEntry } from '../three-renderer.js';
import { localToWorld, transformVerts, pointInPolygon, sensorColor, hexToInt, motionColor, lightIconKind, furnitureKind, resolveFurnitureDef, furnitureCat, isBinKind, isSpeakerKind, isVehicleKind, isStairsKind, alarmStateColor, valveOpenness, doorSpanCenter, isDroopPlant, plantThirsty, PLANT_MOISTURE_DEFAULT_THRESHOLD } from '../geometry.js';
import { compass8 } from '../geo.js';
import { parseNowPlaying, isMediaPlayerId } from '../geometry.js';
import { resolveScreenContent } from '../surfaces.js';
import { resolveScenePreset, resolveTimeBucket } from '../time-of-day.js';
import { conditionIntensity, weatherEffectEnabled, worstAlertSeverity } from '../weather.js';
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
      // Thermostat → open the climate control modal (view mode: no interaction).
      if (kind === 'thermostat') {
        if (p.uiMode === 'view') return;
        this.dispatchEvent(new CustomEvent('open-thermostat', {
          bubbles: true, composed: true, detail: { id: fixtureId },
        }));
        return;
      }
      // Action button → fire its configured HA service (kiosk fires; view refuses
      // inside fireAction). Also stamps the 3D cap-press animation.
      if (kind === 'action') {
        const b = p.floor().actionButtons?.find(x => x.id === fixtureId);
        if (b) { p.fireAction(b); this._renderer?.pressActionButton(b.id); }
        return;
      }
      // Safety fixture. Siren → controllable: toggle the bound siren.*/switch.*
      // (or flip localState when unbound). Smoke/CO/gas/leak detector → unbound:
      // manual test trigger (flip localState); bound: display-only no-op.
      if (kind === 'safety') {
        const s = p.floor().safetySensors?.find(x => x.id === fixtureId);
        if (!s) return;
        if (s.kind === 'siren') { p.triggerSiren(s); return; }
        if (p.uiMode === 'view' || entity_id) return;
        p.toggleItem(s);
        return;
      }
      // Alert beacon → acknowledge (bound alert.*) or demo-flip (unbound).
      // acknowledgeAlertBeacon refuses in view mode; kiosk allowed.
      if (kind === 'alert') {
        const ab = p.floor().alertBeacons?.find(x => x.id === fixtureId);
        if (ab) p.acknowledgeAlertBeacon(ab);
        return;
      }
      // Robot → run/dock (bound) or demo toggle (unbound). Refuses in view mode.
      if (kind === 'robot') {
        const ro = p.floor().robots?.find(x => x.id === fixtureId);
        if (ro) p.toggleRobot(ro);
        return;
      }
      // Projector → toggle projecting (bound entity / unbound localState).
      // toggleItem refuses in view mode; kiosk flips are session-only.
      if (kind === 'projector') {
        const pr = p.floor().projectors?.find(x => x.id === fixtureId);
        if (pr) p.toggleItem(pr);
        return;
      }
      // Water valve → open/close (toggleValve gates allowControl + domain dispatch;
      // valve.* picks open_valve/close_valve by state, never a blind toggle).
      if (kind === 'valve') {
        const vv = p.floor().valves?.find(x => x.id === fixtureId);
        if (vv) p.toggleValve(vv);
        return;
      }
      // Smart plug → toggle the outlet (like a switch), gated by allowControl.
      if (kind === 'plug') {
        const pg = p.floor().plugs?.find(x => x.id === fixtureId);
        if (pg && pg.allowControl !== false) p.toggleItem(pg);
        return;
      }
      // Door lock deadbolt → toggle lock.lock/unlock (bound) or lockLocalState
      // (unbound). Refuses in view mode (handled inside toggleDoorLock).
      if (kind === 'lock') {
        const dr = p.floor().doors?.find(x => x.id === fixtureId);
        if (dr) p.toggleDoorLock(dr);
        return;
      }
      // Stove/oven body → toggle its persistent doorOpen flag (the oven door).
      // The on/off entity binding is reached via dblclick / sidebar, not here.
      if (kind === 'appliance') {
        if (p.uiMode === 'view') return;
        const fu = p.floor().furniture.find(x => x.id === fixtureId);
        if (fu) { fu.doorOpen = !fu.doorOpen; p.save(); p.emitConfig(); }
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
    // Avatar device interaction: a synthetic rig finished its reach at an UNBOUND
    // device → flip its localState session-only (never persisted). Resolve the
    // namespaced id (L/S/F) back to the fixture and route through avatarToggleItem
    // (which enforces the gate + the bound-item refusal). Mirrors the
    // onFixtureClick → toggleItem flow so the renderer never imports the planner.
    this._renderer.onAvatarInteract((id) => {
      const p = this.planner;
      const f = p.floor();
      const prefix = id[0], raw = id.slice(1);
      const item = prefix === 'L' ? f.lights.find(x => x.id === raw)
        : prefix === 'S' ? f.switches.find(x => x.id === raw)
        : prefix === 'F' ? f.furniture.find(x => x.id === raw)
        : undefined;
      if (item) p.avatarToggleItem(item);
    });
    // Valetudo room-map overlay: tap a segment → confirm + publish clean/set.
    // Edit + kiosk; view refuses inside cleanVacuumSegment.
    this._renderer.onVacSegClick(({ robotId, segId }) => {
      const p = this.planner;
      if (p.uiMode === 'view') return;
      const ro = p.floor().robots?.find(x => x.id === robotId);
      if (!ro) return;
      const map = p.vacuumMaps[robotId];
      const seg = map?.segments.find(s => s.id === segId);
      const name = seg?.name?.trim() || `Room ${segId}`;
      if (typeof confirm === 'function' && !confirm(`Clean ${name}?`)) return;
      p.cleanVacuumSegment(ro, segId);
    });
    this._renderer.onFixtureDblClick(({ kind, entity_id, fixtureId }) => {
      const p = this.planner;
      if (p.uiMode === 'view') return;
      const f = p.floor();

      // Bound media furniture (TVs): open the media control modal. Unbound in
      // edit → pick a media_player entity (only reachable in 2D today since
      // unbound TVs aren't raycast targets, but kept for symmetry).
      if (kind === 'media') {
        const fu0 = f.furniture.find(x => x.id === fixtureId);
        // Bins reuse the 'media' click tag but bind a binary_sensor ('on'/'full'
        // = full), not a media_player. Single click already toggles full/empty.
        if (fu0 && isBinKind(fu0.kind)) {
          if (p.uiMode === 'edit' && !entity_id) {
            this.dispatchEvent(new CustomEvent('open-entity-picker', {
              bubbles: true, composed: true,
              detail: {
                domain: 'binary_sensor',
                onPick: (id: string) => { fu0.entity_id = id; p.save(); p.emitConfig(); },
              },
            }));
          }
          return;
        }
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

      // Stove/oven: dblclick binds the on/off entity (single click toggles the
      // oven door). Bound → no config modal exists, so no-op.
      if (kind === 'appliance') {
        if (p.uiMode !== 'edit') return;
        const fu = f.furniture.find(x => x.id === fixtureId);
        if (fu && !fu.entity_id) this.dispatchEvent(new CustomEvent('open-entity-picker', {
          bubbles: true, composed: true,
          detail: {
            domain: 'switch',
            onPick: (id: string) => { fu.entity_id = id; p.save(); p.emitConfig(); },
          },
        }));
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
  private _recentTrigs: { kind: 'light_on' | 'light_off' | 'fireplace' | 'tv' | 'doorbell' | 'action_button'; x: number; y: number; at: number }[] = [];
  // Per-button last press-time seen (de-dupes an actionPressFx entry into ONE
  // recent-trigger push). Cleared on floor switch with the other trigger state.
  private _actionTrigAt = new Map<string, number>();
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

    // DC-D alert beacon severity: gated by the weatherFx LAYER + effects3d MASTER
    // + the alerts.beacon toggle — but NOT on a live weather source (an active
    // alert must show even under "Clear"). Undefined when off / no alert.
    const beaconGate = layers.weatherFx !== false && w?.effects3d !== false
      && w?.alerts?.beacon !== false;
    const alertSeverity = beaconGate
      ? (worstAlertSeverity(p.weatherAlerts ?? []) ?? undefined)
      : undefined;

    // Phase 3: sky backdrop + moon prop. skyBackdrop defaults ON when a weather
    // source is configured (Scene3D.skyBackdrop overrides). moonPhase = the bound
    // moon.* entity's raw 8-state string (read opportunistically each tick, like
    // sun.sun below — no _isSlowEntity entry needed; the RAF re-reads states and
    // _keyWeather folds the phase so updateWeather rebuilds on a phase change).
    const sc3 = p.store.scene3d;
    const skyBackdrop = sc3?.skyBackdrop ?? (w != null);
    const moonPhase = w?.moonEntity ? (states[w.moonEntity]?.state ?? null) : null;

    // Fitted geo θ recovers plan-north from calibration (else θ = 0 = plan-north).
    const fit = p.geoFit();
    const theta = fit && fit.transform.quality !== 'none' ? fit.transform.thetaRad : 0;
    const c = Math.cos(theta), s = Math.sin(theta);

    if (!wnow) {
      return {
        condition: 'sunny', intensity01: 0, windKmh: 0, windBearingPlanRad: null,
        isDay: true, effects, alertSeverity, skyBackdrop, moonPhase,
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
      alertSeverity,
      skyBackdrop,
      moonPhase,
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
  private _keyInfo = '';
  private _keyActions = '';
  private _keyBle = '';
  private _keyAlarm = '';
  private _keyCalendar = '';
  private _keyThermo = '';
  private _keySafety = '';
  private _keyAlert = '';
  private _keyRobots = '';
  private _keyNowPlaying = '';
  private _keyCameras = '';
  private _keyProjectors = '';
  private _keyValves = '';
  private _keyPlugs = '';
  private _keyCamAlerts = '';
  private _keyPzones = '';
  private _keyGround = '';
  private _keyHeatmap = '';
  private _keyVacMap = '';
  private _keyLights = '';
  private _keyZones = '';
  private _keyHalos = '';
  private _keyGhost = '';
  private _keyGps = '';
  private _keyWeather = '';
  private _keyBgText = '';
  // Tier 2 glass-house transit puppets already triggered (`${personId}:${at}`) so
  // one transit spawns at most one puppet. Runtime-only; grows negligibly.
  private _spawnedPuppets = new Set<string>();

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
        this._keyMotion = this._keyEnv = this._keyInfo = this._keyActions = this._keyBle = this._keyAlarm = this._keyCalendar = this._keyThermo = this._keySafety = this._keyAlert = '';
        this._keyCameras = this._keyProjectors = this._keyValves = this._keyPlugs = this._keyCamAlerts = this._keyPzones = this._keyNowPlaying = '';
        this._keyGround = '';
        this._keyHeatmap = '';
        this._keyVacMap = '';
        this._keyLights = this._keyZones = this._keyHalos = '';
        this._keyGhost = this._keyGps = this._keyWeather = this._keyBgText = '';
        this._trigPrevOn.clear();
        this._actionTrigAt.clear();
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
        // Bins (outdoor cat) also carry a bound/local state (full/empty) that
        // drives the 3D lid pivot inside updateFloor — fold it in too. Home-theater
        // speakers fold their media_player state so the driver pulse (built inside
        // updateFloor, present only while 'playing') rebuilds on a playback change.
        // Vehicles (car ghost/solid + EV charge indicator), EV chargers (port LED
        // status + charging pulse), and mailboxes (count badge + flag/lid) also
        // carry bound state that drives their 3D build — fold them in too.
        const hasEvMail = isVehicleKind(fu.kind) || fu.kind === 'ev_charger' ||
          fu.kind === 'mailbox' || !!fu.evCharger || !!fu.mailCount;
        // Plant droop (#soil moisture): a bound (or demo-toggled) plant folds its
        // thirsty flip so the 3D foliage rebuild re-seeds the droop target (the ease
        // itself is per-frame). Unbound plants with no demo toggle never qualify.
        const isPlant = isDroopPlant(fu, p.store.customObjects) &&
          (!!fu.moistureEntity || fu.plantDemoThirsty !== undefined);
        if (furnitureCat(def) !== 'appliance' && !isBinKind(fu.kind) && !isSpeakerKind(fu.kind) && !hasEvMail && !isPlant) return '';
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
        // Rounded temperature (stove/oven/fridge) so the 3D temp sprite rebuilds
        // on a 1° step; doorOpen so the oven-door blend target is current.
        let tp = '';
        if (fu.tempEntity) {
          const t = parseFloat(states[fu.tempEntity]?.state ?? '');
          tp = isFinite(t) ? String(Math.round(t)) : 'x';
        }
        // Screen bias light (home-theater arc): tv/wall_tv glow behind the screen,
        // built inside updateFloor. Fold the config + bound-entity (or AUTO) on
        // state so the halo rebuilds on a flip. AUTO mode already tracks `on`.
        let bias = '';
        if ((fu.kind === 'tv' || fu.kind === 'wall_tv') && fu.biasLight) {
          const be = fu.biasLight.entityId;
          bias = `${be ? stOf(be) : 'auto'}:${fu.biasLight.color ?? ''}`;
        }
        // EV charging (car port / charger LED): status entity state + a 100 W
        // power bucket. Mailbox: count + lid-sensor state. When ANY charger's
        // status flips, its hash term changes → the whole floor rebuilds, which
        // also refreshes an adjacent car's charge indicator.
        let ev = '';
        if (fu.evCharger) {
          const s = fu.evCharger.statusEntity ? stOf(fu.evCharger.statusEntity) : '';
          const w = fu.evCharger.powerEntity ? parseFloat(states[fu.evCharger.powerEntity]?.state ?? '') : NaN;
          ev = `${s}:${isFinite(w) ? Math.round(w / 100) : ''}`;
        }
        let mail = '';
        if (fu.mailCount) {
          const c = fu.mailCount.countEntity ? stOf(fu.mailCount.countEntity) : '';
          const fl = fu.mailCount.flagEntity ? stOf(fu.mailCount.flagEntity) : '';
          mail = `${c}:${fl}`;
        }
        // "Job done" badge (event-focused thought bubbles): the appliance's
        // finished-window flag drives a blue emissive badge built inside
        // updateFloor, so fold it in — no new dirty key (research §D).
        const jd = p.applianceJustFinished(fu) ? 1 : 0;
        // Plant thirsty flag ('t' thirsty / 'h' healthy / 'x' no reading, or the
        // unbound demo toggle) — a boolean so it only flips on a threshold crossing.
        let moist = '';
        if (isPlant) {
          const rd = fu.moistureEntity ? parseFloat(states[fu.moistureEntity]?.state ?? '') : NaN;
          const thr = fu.moistureThreshold ?? PLANT_MOISTURE_DEFAULT_THRESHOLD;
          moist = isFinite(rd) ? (plantThirsty(rd, thr) ? 't' : 'h') : (fu.plantDemoThirsty ? 't' : 'h');
        }
        return `${fu.id}:${on}:${door}:${pw}:${tp}:${fu.doorOpen ? 1 : 0}:${bias}:${ev}:${mail}:${jd}:${moist}`;
      }).filter(Boolean).join(',');
      // Room occupancy glow (#1): fold each occupancy-bound room's on/off into
      // _keyFloor so the tinted floor patch rebuilds on an occupancy flip.
      const roomOccKey = (f.rooms ?? [])
        .filter(rm => rm.occupancyEntity)
        .map(rm => `${rm.id}:${stOf(rm.occupancyEntity!)}`).join(',');
      // Selected custom-recipe piece → its id drives the 3D front-arrow decal
      // built inside updateFloor. Selection (activeFurnitureId) is runtime-only
      // and does NOT bump configRev, so it must be folded into _keyFloor
      // explicitly. Scoped to CUSTOM pieces (they lack the 2D front chevron's 3D
      // equivalent) so selecting an ordinary furniture piece never churns the
      // floor rebuild.
      const selFu = f.furniture.find(x => x.id === p.activeFurnitureId);
      const selCustomId = (selFu && selFu.customKindId) ? selFu.id : '';
      const keyFloor = `${p.configRev}|${effPreset}|` +
        `${layers.furniture !== false}|${layers.appliances !== false}|` +
        `${layers.bg !== false}|${layers.walls !== false}|` +
        `${layers.grid !== false}|` +
        `${layers.labels !== false}|${applianceKey}|${roomOccKey}|${selCustomId}`;
      if (keyFloor !== this._keyFloor) {
        this._keyFloor = keyFloor;
        // customObjects edits bump configRev (via emitConfig) → keyFloor flips
        // → the placed recipe instance rebuilds as its own live preview.
        r.updateFloor(f, scMerged, layers, p.store.customObjects,
                      id => states[id] || null, selCustomId || null,
                      fuId => p.applianceJustFinished({ id: fuId }));
      }

      // Glass-house ghost floors: every OTHER story as a translucent shell.
      // Cheap to rebuild; keyed on the glassHouse flag + active floor id.
      const keyGhost = `${p.configRev}|${!!scBase.glassHouse}|${f.id}|` +
        `${layers.furniture !== false}|${layers.appliances !== false}`;
      if (keyGhost !== this._keyGhost) {
        this._keyGhost = keyGhost;
        r.updateGhostFloors(
          p.store.floors.filter(fl => !fl.disabled || fl.id === f.id),
          f.id, scMerged, p.store.customObjects, layers);
      }

      // Glass-house transit puppet (Tier 2 stretch): when glass-house is on and a
      // FRESH viaLink transit touches the current floor, spawn one scripted rig
      // walking the source stair's run across STORY_H. Gated entirely on the
      // glassHouse flag (turn it off → never spawns). One puppet per transit.
      if (scBase.glassHouse) this._maybeSpawnTransitPuppet(p, f.id, r);

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
        f.doors.map(d => `${openKey(d.entity_id)}:${stOf(d.lockEntity)}:${d.lockControl === 'display' ? 'd' : 'f'}`).join(',') + '|' +
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

      // Info cards: structural + bound entity reading + color/layer. Clock/date
      // cards carry a static `clk` token (their text repaints per-frame inside
      // the renderer, no rebuild); entity cards fold their live state string.
      const keyInfo = `${p.configRev}|${p.store.layers2d?.info !== false}|` +
        (f.infoCards ?? []).map(ic =>
          (ic.displayMode ?? 'entity') !== 'entity'
            ? `${ic.id}:clk`
            : `${ic.id}:${stOf(ic.entity_id)}`).join(',');
      if (keyInfo !== this._keyInfo) {
        this._keyInfo = keyInfo;
        r.updateInfoCards(f.infoCards ?? [], id => states[id] || null,
                          p.store.layers2d, { now: new Date(), imperial: p.store.imperial });
      }

      // Action buttons: structural + bound-script running state (a running script
      // holds a steady glow). The press animation is renderer-side (per-frame from
      // the synced press-time map), so it needs NO key. Rides the switches layer.
      const keyActions = `${p.configRev}|${p.store.layers2d?.switches !== false}|` +
        (f.actionButtons ?? []).map(b =>
          `${b.id}:${Math.round(b.x)}:${Math.round(b.y)}:${Math.round(b.rotation ?? 0)}:${b.wallMount === false ? 'f' : 'w'}:` +
          `${b.actionKind ?? 'toggle'}:${b.color ?? ''}:${b.hidden ? 'h' : ''}:` +
          `${b.entity_id?.startsWith('script.') ? (stOf(b.entity_id)) : ''}`).join(',');
      if (keyActions !== this._keyActions) {
        this._keyActions = keyActions;
        r.updateActionButtons(f.actionButtons ?? [], id => states[id] || null);
      }
      // Per-frame: keep the 3D cap-press animation fed from ALL fire paths.
      r.syncActionPresses(p.actionPressFx);

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

      // Wall calendars: structural (placement/rotation/binding) + a coarse event
      // hash (count + first-event start bucket) so a refreshed agenda rebuilds
      // the plaque texture. Events come from the Planner poll, not entity state.
      const calList = f.calendarPanels ?? [];
      const keyCalendar = `${p.configRev}|` + calList.map(cp => {
        const evs = p.calendarEvents[cp.id] ?? [];
        return `${cp.id}:${Math.round(cp.x)}:${Math.round(cp.y)}:${Math.round(cp.rotation ?? 0)}:` +
          `${(cp.calendarIds ?? []).join('+')}:${evs.length}:${evs[0]?.start ?? '-'}:${evs[0]?.summary ?? '-'}`;
      }).join(',');
      if (keyCalendar !== this._keyCalendar) {
        this._keyCalendar = keyCalendar;
        r.updateCalendarPanels(calList, p.calendarEvents);
      }

      // Thermostats: structural + climate state. mode + hvac_action drive the
      // plate/vent color; the setpoint + current temp feed the readout — bucket
      // temps to ~0.5° to avoid float-jitter rebuilds (the vent particles animate
      // per-frame via _advanceVents, so only mode/action/temp CHANGES rebuild).
      const b05 = (v: unknown) => { const n = Number(v); return isFinite(n) ? Math.round(n * 2) / 2 : '-'; };
      const keyThermo = `${p.configRev}|` +
        (f.thermostats ?? []).map(t => {
          const st = p.effectiveState(t);
          const a = (st?.attributes ?? {}) as Record<string, unknown>;
          return `${t.id}:${Math.round(t.x)}:${Math.round(t.y)}:${Math.round(t.rotation ?? 0)}:` +
            `${st?.state ?? '-'}:${a.hvac_action ?? '-'}:${b05(a.current_temperature)}:` +
            `${b05(a.temperature)}:${b05(a.target_temp_low)}:${b05(a.target_temp_high)}:${t.localTemp ?? '-'}`;
        }).join(',');
      if (keyThermo !== this._keyThermo) {
        this._keyThermo = keyThermo;
        r.updateThermostats(f.thermostats ?? [], id => states[id] || null);
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

      // Alert beacons: structural + resolved beacon state. An ACTIVE beacon
      // pulses (rings animate via performance.now() inside the builder), so any
      // active beacon on the floor forces a per-frame rebuild — the safety idiom.
      const beaconList = f.alertBeacons ?? [];
      const hasActiveBeacon = beaconList.some(b => p.effectiveState(b)?.state === 'on');
      const keyAlert = hasActiveBeacon ? `${Math.random()}` :
        `${p.configRev}|` + beaconList.map(b =>
          `${b.id}:${Math.round(b.x)}:${Math.round(b.y)}:${b.hidden ? 'h' : ''}:${p.effectiveState(b)?.state ?? '-'}`).join(',');
      if (keyAlert !== this._keyAlert) {
        this._keyAlert = keyAlert;
        r.updateAlertBeacons(beaconList, id => states[id] || null);
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
      // TV screen surfaces (calendar-tv feature): for each tv/wall_tv with a
      // news/weather screenMode, resolve the content (now-playing precedence:
      // playing/paused media hides the surface) + gather its headlines. Built in
      // the SAME now-playing group/key (research doc §4.2). The ticker SCROLL is
      // per-frame (_advanceTvScreens), NOT keyed — only the headline SET is.
      const tvWn = p.weatherNow;
      const tvScreens: Array<{ id: string; content: 'news' | 'weather'; headlines?: string[] }> = [];
      for (const fu of f.furniture) {
        if (fu.kind !== 'tv' && fu.kind !== 'wall_tv') continue;
        const mode = fu.screenMode ?? 'auto';
        if (mode !== 'news' && mode !== 'weather') continue;
        const media = isMediaPlayerId(fu.entity_id) ? parseNowPlaying(states[fu.entity_id!]) : null;
        const est = p.effectiveState(fu);
        const es = est?.state;
        const tvOn = !(es === 'off' || es === 'standby' || es === 'unavailable');
        const content = resolveScreenContent(mode, !!media, tvOn);
        if (content === 'news') tvScreens.push({ id: fu.id, content, headlines: p.headlinesFor(fu.newsEntity) });
        else if (content === 'weather') tvScreens.push({ id: fu.id, content });
      }
      const screenKey = tvScreens.map(s => s.content === 'news'
        ? `${s.id}:news:${(s.headlines ?? []).join('¦').slice(0, 120)}`
        : `${s.id}:weather:${tvWn?.condition ?? '-'}:${typeof tvWn?.tempC === 'number' ? Math.round(tvWn.tempC) : '-'}:${p.forecastDaily?.length ?? 0}:${p.forecastDaily?.[0]?.temperature ?? '-'}`).join('|');

      // Now-playing cards (#11): sprites above media_player-bound furniture that
      // is playing/paused. Own dirty key = configRev + per-media (state|title|
      // picture) hash + the furniture/appliance layer flags (per-piece skipping)
      // + the TV screen-surface hash above.
      const keyNP = `${p.configRev}|${layers.furniture !== false ? 1 : 0}${layers.appliances !== false ? 1 : 0}|` +
        f.furniture.filter(fu => fu.entity_id?.startsWith('media_player.')).map(fu => {
          const s = states[fu.entity_id!];
          const a = s?.attributes as Record<string, unknown> | undefined;
          return `${fu.id}:${s?.state ?? '-'}:${(a?.media_title as string) ?? ''}:${(a?.entity_picture as string) ?? ''}`;
        }).join('|') + '||' + screenKey;
      if (keyNP !== this._keyNowPlaying) {
        this._keyNowPlaying = keyNP;
        r.updateNowPlaying(f.furniture, p.store.customObjects, id => states[id] || null, p.haBaseUrl, layers,
          { screens: tvScreens, weather: tvWn, forecast: p.forecastDaily, imperial: p.store.imperial === true, nowMs: performance.now() });
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

      // Projector fixtures (home-theater arc): structural + bound on/off state +
      // the aimed screen's plan geometry (the beam recomputes when the screen
      // moves/resizes). Rides the sensors layer; rebuild only on a real change.
      const projList = f.projectors ?? [];
      const keyProjectors = `${p.configRev}|` + projList.map(pr => {
        const sc = pr.screenId ? f.furniture.find(x => x.id === pr.screenId) : null;
        const scGeo = sc ? `${Math.round(sc.x)}:${Math.round(sc.y)}:${sc.kind ?? ''}` : '';
        return `${pr.id}:${Math.round(pr.x)}:${Math.round(pr.y)}:${Math.round(pr.height ?? 0)}:${Math.round(pr.rotation ?? 0)}:${(pr.throwRatio ?? 0)}:${pr.beamColor ?? ''}:${pr.screenId ?? ''}:${scGeo}:${pr.hidden ? 'h' : ''}:${stOf(pr.entity_id)}:${pr.localState ?? ''}`;
      }).join(',');
      if (keyProjectors !== this._keyProjectors) {
        this._keyProjectors = keyProjectors;
        r.updateProjectors(projList, f.furniture, id => states[id] || null);
      }

      // Water valves (Phase 2b): structural + resolved openness. Bucket the
      // position to 5% so a mid-travel valve doesn't thrash the rebuild (the flow
      // pulse animates per-frame via _advanceValves — only open/close transitions
      // rebuild). Rides the sensors layer.
      const valveList = f.valves ?? [];
      const keyValves = `${p.configRev}|` + valveList.map(v => {
        const st = p.effectiveState(v);
        return `${v.id}:${Math.round(v.x)}:${Math.round(v.y)}:${Math.round(v.rotation ?? 0)}:` +
          `${st?.state ?? '-'}:${Math.round(valveOpenness(st) * 20)}`;
      }).join(',');
      if (keyValves !== this._keyValves) {
        this._keyValves = keyValves;
        r.updateValves(valveList, id => states[id] || null);
      }

      // Smart plugs (Phase 2b): structural + on/off + a 50 W-bucketed power
      // reading (powerEntity stays LIVE-path; the key folds a bucketed value read
      // each tick, like Furniture.powerEntity). Rides the switches layer.
      const plugList = f.plugs ?? [];
      const keyPlugs = `${p.configRev}|` + plugList.map(pl => {
        const st = p.effectiveState(pl);
        const pw = pl.powerEntity ? parseFloat(states[pl.powerEntity]?.state ?? '') : NaN;
        return `${pl.id}:${Math.round(pl.x)}:${Math.round(pl.y)}:${Math.round(pl.rotation ?? 0)}:` +
          `${Math.round(pl.height ?? 0)}:${st?.state ?? '-'}:${isFinite(pw) ? Math.round(pw / 50) : '-'}`;
      }).join(',');
      if (keyPlugs !== this._keyPlugs) {
        this._keyPlugs = keyPlugs;
        r.updatePlugs(plugList, id => states[id] || null);
      }

      // Camera alert cards (#10 extension): snapshot sprites above ALERTING
      // cameras. Own dirty key = configRev + sensors-layer flag + per-alerting-
      // camera (picture + 3 s refresh bucket) hash. The refresh bucket rotates
      // the key every 3 s while an alert is live so the snapshot re-fetches; an
      // idle floor (no alerts) yields a stable key → no churn. cameraAlerting()
      // reads live (state 'on' OR within the linger window), so the set shrinks
      // and the group clears once the last alert lingers out.
      const camAlerting = cameraList.filter(c => !c.hidden && p.cameraAlerting(c));
      const camRefreshBucket = Math.floor(nowMs / 3000);
      const keyCamAlerts = `${p.configRev}|${layers.sensors !== false}|` +
        camAlerting.map(c => {
          const pic = c.entity_id ? ((states[c.entity_id]?.attributes as Record<string, unknown> | undefined)?.entity_picture ?? '') : '';
          return `${c.id}:${pic}:${camRefreshBucket}`;
        }).join(',');
      if (keyCamAlerts !== this._keyCamAlerts) {
        this._keyCamAlerts = keyCamAlerts;
        r.updateCameraAlerts(camAlerting, id => states[id] || null, p.haBaseUrl);
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

      // Ground / yard covering areas (the "yard" arc): structural only (no bound
      // state). Rides the `ground` layer. Rebuild on shape / kind / hidden edits.
      const groundList = f.groundAreas ?? [];
      const keyGround = `${p.configRev}|` + groundList.map(g =>
        `${g.id}:${g.kind}:${g.hidden ? 'h' : ''}:${g.points.map(v => `${v.x | 0},${v.y | 0}`).join(';')}`).join('|');
      if (keyGround !== this._keyGround) {
        this._keyGround = keyGround;
        r.updateGroundAreas(groundList);
      }

      // Per-room temperature heat-map (derived visual layer, opt-in). Rides its
      // OWN `heatmap` layer (default OFF). p.roomHeatmap() returns [] when the
      // layer is off, so the key collapses and the group stays empty (also hidden
      // via setLayerVisibility). Bucket temps to 0.5° so float jitter doesn't
      // rebuild the patches; the comfort band is in the key so a band edit
      // recolors. configRev covers room/wall/sensor edits.
      const hmRooms = p.roomHeatmap();
      const hmCfg = p.store.heatmap ?? {};
      const hmLo = hmCfg.comfortLo ?? 20, hmHi = hmCfg.comfortHi ?? 24;
      const keyHeatmap = `${p.configRev}|${hmLo}|${hmHi}|` +
        hmRooms.map(rt => `${rt.roomId}:${Math.round(rt.tempC * 2) / 2}`).join(',');
      if (keyHeatmap !== this._keyHeatmap) {
        this._keyHeatmap = keyHeatmap;
        r.updateRoomHeatmap(hmRooms, hmLo, hmHi);
      }

      // Valetudo room-map overlay (batch M-C): per-robot SLAM segmentation patches.
      // Rides its OWN `vacuumMap` layer (default OFF). Rebuild on map revision /
      // glow / calibration / layer flip. When the layer is off, feed nothing so
      // the group stays empty (also hidden via setLayerVisibility above).
      const vacOn = layers.vacuumMap === true;
      const vacRobots = vacOn ? (f.robots ?? []).filter(ro => ro.kind === 'vacuum' && ro.valetudoId && p.vacuumMaps[ro.id]) : [];
      const keyVacMap = `${p.configRev}|${vacOn}|` + vacRobots.map(ro => {
        const glow = p.vacuumGlowSegments(ro.id);
        return `${ro.id}:${p.vacuumMapRev[ro.id] ?? 0}:${ro.posScale ?? 1},${ro.posOffsetX ?? 0},${ro.posOffsetY ?? 0},${ro.posRotDeg ?? 0},${ro.posFlipY ? 1 : 0}:${glow ? [...glow].sort().join('.') : '-'}`;
      }).join('|');
      if (keyVacMap !== this._keyVacMap) {
        this._keyVacMap = keyVacMap;
        const entries: VacMapEntry[] = vacRobots.map(ro => {
          const map = p.vacuumMaps[ro.id];
          const glow = p.vacuumGlowSegments(ro.id);
          return {
            robotId: ro.id, pixelSize: map.pixelSize, segments: map.segments,
            cal: { posScale: ro.posScale, posOffsetX: ro.posOffsetX, posOffsetY: ro.posOffsetY, posFlipY: ro.posFlipY, posRotDeg: ro.posRotDeg },
            glow: glow ? [...glow] : null,
          };
        });
        r.updateVacuumMaps(entries);
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
      // Phase 3: fold the effective preset (drives dome colors + sun/moon
      // day/night gating), the moon phase (8 states, ~daily), and the resolved
      // skyBackdrop flag into the key so the sky rebuilds on those changes.
      const skyBucket = `${effPreset}:${fx.moonPhase ?? '-'}:${fx.skyBackdrop ? '1' : '0'}`;
      const w3Bucket = `${b(fx.cloudCoverage, 10)}:${b(fx.visibilityKm, 2)}:` +
        `${b(fx.windGustKmh, 10)}:${b(fx.apparentC, 3)}:${b(fx.sunAzimuthDeg, 5)}:` +
        `${fx.sunElevationDeg == null ? 'n' : (fx.sunElevationDeg > 0 ? 'u' : 'd')}:` +
        `${fx.rainSoon ? 'r' : '-'}:${effKey}:${skyBucket}`;
      const keyWeather = `${p.configRev}|${f.id}|${fx.condition}|` +
        `${Math.round(fx.intensity01 * 4)}|${windBucket}|${w3Bucket}|` +
        `${fx.alertSeverity ?? '-'}`;   // DC-D: rebuild the beacon on a severity change
      if (keyWeather !== this._keyWeather) {
        this._keyWeather = keyWeather;
        r.updateWeather(fx);
      }

      // Playful background text (skywriting / banner / grass). The displayed
      // string is the bound entity's formatted state (config-path, so a change
      // repaints) else the static text; rebuilt only when text/mode/storm/floor
      // change. sky + banner hide under pouring/lightning (they read wrong in a
      // downpour); grass (a ground decal) always shows. Per-frame motion runs in
      // the renderer's _advanceBgText.
      const bgMode = p.bgTextMode();
      const bgText = bgMode === 'off' ? null : p.bgTextResolved();
      const bgStorm = fx.condition === 'pouring' || fx.condition === 'lightning'
        || fx.condition === 'lightning-rainy';
      const keyBgText = `${p.configRev}|${f.id}|${bgMode}|${bgText ?? ''}|${bgStorm ? 's' : '-'}`;
      if (keyBgText !== this._keyBgText) {
        this._keyBgText = keyBgText;
        r.updateBgText(bgText, bgMode, bgStorm, fx.windBearingPlanRad ?? 0, fx.windKmh);
      }

      // Lights + switches: structural + state/brightness/color per entity.
      // Fireplace lights flicker via Math.random() inside the builder, so an
      // active fireplace forces a rebuild every frame (cheap: few lights). A
      // logical-state light flagged `flash` (via its rule) pulses the SAME way,
      // so it also forces the per-frame rebuild.
      const lightFlashing = (l: typeof f.lights[number]) =>
        !!(p.effectiveState(l)?.attributes as Record<string, unknown> | undefined)?._flash;
      const hasLiveFireplace = f.lights.some(l =>
        ((l.iconKind === 'fireplace') && p.effectiveState(l)?.state === 'on') || lightFlashing(l));
      const keyLights = hasLiveFireplace ? `${Math.random()}` :
        `${p.configRev}|` + f.lights.map(l => {
          // effectiveState folds logic (derived on/color/flash from ANY entity),
          // localState, and the bound entity into one envelope — so a logic light
          // rebuilds when its SOURCE entity's resolved color/state changes.
          const st = p.effectiveState(l);
          const a = (st?.attributes ?? {}) as Record<string, unknown>;
          // Fan spin speed (percentage) + reverse (direction) live on the fan
          // entity — part of the key so a rebuild re-seeds the rotor's SIGNED
          // nominal rps on change (the per-frame ease itself is not dirty-keyed).
          const fanSt = l.fanEntity ? states[l.fanEntity] : null;
          const fanA = (fanSt?.attributes ?? {}) as Record<string, unknown>;
          return `${st?.state ?? '-'}~${a.brightness ?? ''}~${a.rgb_color ?? ''}~${a.color_temp_kelvin ?? ''}` +
                 `~${a.percentage ?? ''}~${a.direction ?? ''}~${fanSt?.state ?? ''}:${fanA.percentage ?? ''}:${fanA.direction ?? ''}`;
        }).join(',') + '|' + f.switches.map(s => stOf(s.entity_id)).join(',');
      if (keyLights !== this._keyLights) {
        this._keyLights = keyLights;
        r.updateLightsSwitches(f.lights, f.switches, id => states[id] || null);
      }

      const zones: ZoneWorld[] = [];
      const halos: HaloWorld[] = [];
      const targets: TargetWorld[] = [];
      // Per-person costume opt-out: an identified rig whose DioramaPerson set
      // allowCostumes === false suppresses the look swap (regardless of the global
      // gate). Resolved from the fused/BLE personId. undefined (not false) so the
      // stamped TargetWorld field stays absent when costumes are allowed.
      const noCostumesFor = (personId?: string | null): true | undefined =>
        personId != null && (p.store.people ?? []).some(pe => pe.id === personId && pe.allowCostumes === false)
          ? true : undefined;
      for (let si = 0; si < f.sensors.length; si++) {
        const s = f.sensors[si];
        if (!s.deviceSlug) continue;
        const z = p.zonesBy[s.id]; const o = p.objectsBy[s.id]; const lerp = p.lerpBy[s.id];
        const tColor = hexToInt(sensorColor(s, si));
        // Per-sensor plumbob color (attribution). An EXPLICIT Sensor.plumbobColor
        // always wins; otherwise leave it undefined so the renderer defaults the
        // plumbob to the target's identity color (the sensor tint `tColor`, or —
        // for a fused target below — the fused person's color). This is what lets
        // avatars be matched to the sensor that saw them without any extra config.
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
                           // Explicit sensor plumbob wins; else a fused target
                           // takes the person's color (coherent with its rig +
                           // name label); else undefined → renderer default =
                           // tColor (the sensor's identity color).
                           plumbobColor: sPlumbob ?? (fusion ? hexToInt(fusion.color) : undefined),
                           noCostumes: noCostumesFor(fusion?.personId),
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
      // Roaming avatars (Batch A): display-only AI presences that live in the
      // config (no sensor binding). Free-range wanderers with an interior-activity
      // goal bias (see _advanceAi / _aiPickGoal — `roam` skips home-loop
      // confinement). Rendered in ALL UI modes like demo avatars. Anchor at the
      // floor center; the renderer's seed snaps it into a free cell. Enabled unless
      // `enabled === false`. Never radar/BLE, so fusion never touches them.
      for (const rm of f.roamers ?? []) {
        if (rm.enabled === false) continue;
        targets.push({ key: 'roam_' + rm.id, x: f.w / 2, y: f.d / 2,
                       color: hexToInt(rm.color ?? '#ba68c8'), ai: true, roam: true,
                       avatar: rm.avatarKind ?? 'random', avatars: rm.avatarKinds,
                       plumbobColor: rm.plumbobColor ? hexToInt(rm.plumbobColor) : undefined });
      }
      // BLE people on the CURRENT floor: synthetic goal-walk targets. x/y is the
      // (lerped) solved position — the renderer's goal controller walks the rig
      // there at human speed (see _advanceAi goal mode). Identified people carry
      // their avatar; unknown devices fall through to a stable per-key pool pick
      // ('random'). Full rigs — no ghost style (user decision B, #2). Only
      // UNFUSED people render as BLE rigs: a person fused onto a radar target
      // hides here (that target carries their avatar/label) so nobody renders
      // twice (B3).
      const nowT = Date.now();
      // Tier 2: resolve a linked stairs-family piece's plan position on a floor
      // by its stairLinkId (cheap; a floor has few furniture pieces).
      const stairPosOnFloor = (fl: typeof f, linkId: string): { x: number; y: number } | null => {
        for (const fu of fl.furniture)
          if (fu.stairLinkId === linkId && isStairsKind(fu.kind)) return { x: fu.x, y: fu.y };
        return null;
      };
      for (const bp of p.bleUnfused) {
        if (bp.floorId !== f.id) continue;
        // Tier 2 ARRIVING handoff: a person who just transited ONTO this floor via
        // a linked stair fades their rig in AT the stair (not at the live solve).
        let spawnAt: { x: number; y: number } | undefined;
        if (bp.personId) {
          const tr = p.transitFor(bp.personId);
          if (tr && tr.toFloorId === f.id && tr.viaLinkId && nowT - tr.at < 12000)
            spawnAt = stairPosOnFloor(f, tr.viaLinkId) ?? undefined;
        }
        targets.push({
          // No plumbobColor: the renderer defaults it to the target's identity
          // color (here the person color `bp.color`), so a BLE person's plumbob
          // matches their rig + name label. Coherent with fused radar targets.
          key: bp.key, x: bp.x, y: bp.y, color: hexToInt(bp.color),
          // Pets with no explicit avatar default to the cat quadruped rig;
          // other unknown devices fall through to the stable human pool pick.
          ble: true, avatar: bp.avatarKind ?? (bp.isPet ? 'cat' : 'random'),
          spawnAt,
          noCostumes: noCostumesFor(bp.personId),
          // Identified BLE people (personId set) get a name label; unknown
          // devices do not (decision #4 — labels only when confident).
          person: bp.personId != null ? { name: bp.name, color: bp.color,
            avatarKind: bp.avatarKind, isPet: bp.isPet, identified: true } : undefined,
        });
      }
      // Tier 2 LEAVING handoff: a person who just transited OFF this floor via a
      // linked stair keeps their rig one more beat — the renderer walks it to the
      // stair on THIS floor, then fast-fades + disposes. Their live solve is now on
      // another floor, so they're absent from the bleUnfused loop above.
      for (const personId of Object.keys(p.floorTransits)) {
        const tr = p.floorTransits[personId];
        if (tr.fromFloorId !== f.id || !tr.viaLinkId) continue;
        if (nowT - tr.at > 9000) continue;                       // window > renderer cap + fade
        const sp = stairPosOnFloor(f, tr.viaLinkId);
        if (!sp) continue;
        const bp = p.blePeople.find(b => b.personId === personId);
        if (!bp || bp.floorId === f.id) continue;                // gone to another floor
        targets.push({
          key: bp.key, x: sp.x, y: sp.y, color: hexToInt(bp.color),
          ble: true, avatar: bp.avatarKind ?? (bp.isPet ? 'cat' : 'random'),
          leaveVia: sp,
          noCostumes: noCostumesFor(bp.personId),
          person: bp.personId != null ? { name: bp.name, color: bp.color,
            avatarKind: bp.avatarKind, isPet: bp.isPet, identified: true } : undefined,
        });
      }
      // Frigate ground-truth camera targets (Phase 5): synthetic goal-walk
      // targets from projected detection boxes, on the CURRENT floor. person →
      // humanoid, dog/cat → the matching quadruped default; car → NO rig (2D dot
      // only). Driven by the renderer's goal controller (cam flag → goal mode,
      // like BLE). A fused cam target (BLE identity adopted via _fuseIdentities)
      // takes the person's avatar/color + a name label.
      for (const ct of p.camPeople) {
        if (ct.floorId !== f.id) continue;
        if (ct.label === 'car') continue;   // cars render as 2D dots only
        const fusion = p.fusions[ct.key];
        targets.push({
          key: ct.key, x: ct.x, y: ct.y, color: hexToInt(ct.color), cam: true,
          avatar: ct.label === 'dog' ? 'dog' : ct.label === 'cat' ? 'cat' : 'random',
          plumbobColor: fusion ? hexToInt(fusion.color) : undefined,
          noCostumes: noCostumesFor(fusion?.personId),
          person: fusion ? { name: fusion.name, color: fusion.color,
            avatarKind: fusion.avatarKind, isPet: fusion.isPet,
            identified: fusion.personId != null } : undefined,
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
      // Fireplace LIGHT on-states gate the warm_hands ambient anchor per frame.
      const fireplaceOn: Record<string, boolean> = {};
      for (const l of f.lights) {
        const st = p.effectiveState(l);
        const on = st?.state === 'on';
        const fire = lightIconKind(l) === 'fireplace';
        if (fire) fireplaceOn[l.id] = on;
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
      // Action-button presses feed the trigger tier (kind 'action_button', pool
      // ✨💡🎬👍). Sourced from Planner.actionPressFx (performance.now() ms) — a
      // press's fx entry is short-lived (~900 ms), so de-dup on its timestamp and
      // push ONE entry into the 45 s recent list per distinct press. Button x/y
      // are world mm, same frame as the rig raw positions.
      for (const b of f.actionButtons ?? []) {
        let at = 0;
        for (const r of p.actionPressFx) if (r.id === b.id && r.at > at) at = r.at;
        if (!at) continue;
        if (at > (this._actionTrigAt.get(b.id) ?? 0)) {
          this._actionTrigAt.set(b.id, at);
          this._recentTrigs.push({ kind: 'action_button', x: b.x, y: b.y, at: nowS });
        }
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
      // Household events (Phase 2a) → the top-priority event bubble tier. Weather
      // events (furnitureId null) are house-wide (x/y null); appliance events
      // resolve the fixture's world pos on the CURRENT floor (skip cross-floor).
      // `at` is Date.now() ms; prune >45 s (the renderer applies its own TTL).
      const eventTriggers: { kind: string; x: number | null; y: number | null; ageS: number }[] = [];
      for (const ev of p.householdEvents) {
        const ageS = (Date.now() - ev.at) / 1000;
        if (ageS >= 45) continue;
        if (ev.furnitureId == null) { eventTriggers.push({ kind: ev.kind, x: null, y: null, ageS }); continue; }
        const fu = f.furniture.find(x => x.id === ev.furnitureId);
        if (!fu) continue;   // anchored to a fixture not on this floor
        eventTriggers.push({ kind: ev.kind, x: fu.x, y: fu.y, ageS });
      }
      // Interactive-device list for the avatar-interaction system: unbound items
      // are the ones a synthetic rig may walk up to and toggle (session-only via
      // avatarToggleItem); bound items feed the status-contemplation bubble tier.
      // Same set toggleItem covers — lights (incl. fireplaces, minus read-only
      // logic lights), switches, and appliance-category / TV furniture (media).
      const interactive: InteractiveItem[] = [];
      for (const l of f.lights) {
        if (l.logic?.entityId) continue;   // computed display — read-only, never actuated
        const st = p.effectiveState(l);
        interactive.push({ id: 'L' + l.id, x: l.x, y: l.y, ctrl: 'light',
          fkind: lightIconKind(l) === 'fireplace' ? 'fireplace' : undefined,
          bound: l.entity_id != null, on: st?.state === 'on' });
      }
      for (const sw of f.switches) {
        const st = p.effectiveState(sw);
        interactive.push({ id: 'S' + sw.id, x: sw.x, y: sw.y, ctrl: 'switch',
          bound: sw.entity_id != null, on: st?.state === 'on' });
      }
      for (const fu of f.furniture) {
        const def = resolveFurnitureDef(fu, p.store.customObjects);
        if (furnitureCat(def) !== 'appliance') continue;   // fridge/stove/dishwasher/washer/dryer/microwave/tv
        interactive.push({ id: 'F' + fu.id, x: fu.x, y: fu.y, ctrl: 'media', fkind: furnitureKind(fu),
          bound: fu.entity_id != null, on: entityOn[fu.id] === true });
      }
      const ctx: ActivityContext = { entityOn, roomNames, timeBucket: resolveTimeBucket(states), weather, recentTriggers, eventTriggers, doorSensorOpen, fireplaceOn,
        interactive, avatarInteract: p.store.avatarInteractions !== false,
        costumes: p.store.avatarCostumes !== false };
      // Targets every frame — persistent rigs mutate in place (no rebuild).
      r.updateTargets(targets, ctx);
  }

  // ── Imported 3D model sync ────────────────────────────────────────────
  private _modelText: { floorId: string; rev: number; obj: string; mtl: string | null } | null = null;
  private _modelLoading = false;
  private _keyModel = '';

  // Tier 2 glass-house transit puppet trigger. For a FRESH viaLink transit that
  // touches the current floor (either direction), build the puppet spec from the
  // SOURCE floor's stair fixture and spawn one scripted rig (once per transit).
  // Skips if either linked fixture is missing. Isolated — only called when
  // glassHouse is on (see the caller).
  private _maybeSpawnTransitPuppet(p: Planner, curId: string,
                                   r: import('../three-renderer.js').ThreeDRenderer): void {
    const now = Date.now();
    const STORY_H = 3000;
    const floors = p.store.floors;
    const curIdx = floors.findIndex(fl => fl.id === curId);
    const stairOn = (fid: string, linkId: string) => {
      const fl = floors.find(f => f.id === fid);
      if (!fl) return null;
      for (const fu of fl.furniture)
        if (fu.stairLinkId === linkId && isStairsKind(fu.kind)) return { fl, fu };
      return null;
    };
    for (const personId of Object.keys(p.floorTransits)) {
      const tr = p.floorTransits[personId];
      if (!tr.viaLinkId) continue;
      if (tr.fromFloorId !== curId && tr.toFloorId !== curId) continue;   // doesn't touch us
      if (now - tr.at > 2500) continue;                                    // only right after commit
      const sig = `${personId}:${tr.at}`;
      if (this._spawnedPuppets.has(sig)) continue;
      const src = stairOn(tr.fromFloorId, tr.viaLinkId);
      const dst = stairOn(tr.toFloorId, tr.viaLinkId);
      if (!src || !dst) continue;                                          // missing fixture → skip
      const srcIdx = floors.indexOf(src.fl), dstIdx = floors.indexOf(dst.fl);
      const person = p.store.people?.find(pe => pe.id === personId);
      this._spawnedPuppets.add(sig);
      r.spawnTransitPuppet({
        id: sig,
        colorInt: hexToInt(person?.color ?? '#9e9e9e'),
        x: src.fu.x, y: src.fu.y,
        rotationDeg: src.fu.rotation ?? 0,
        runLength: src.fu.h,
        yStart: (srcIdx - curIdx) * STORY_H,
        yEnd: (dstIdx - curIdx) * STORY_H,
        durationS: 8,
      });
    }
  }

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
