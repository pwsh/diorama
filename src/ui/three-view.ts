import { LitElement, html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { customElement } from './define.js';
// Type-only import — erased at build time. The actual module (which pulls in
// all of three.js, ~600 kB) is loaded lazily in firstUpdated so the 2D-only
// startup path never downloads it.
import type { ThreeDRenderer, ZoneWorld, HaloWorld, TargetWorld, ActivityContext } from '../three-renderer.js';
import { localToWorld, transformVerts, pointInPolygon, sensorColor, hexToInt, motionColor } from '../geometry.js';
import { resolveScenePreset, resolveTimeBucket } from '../time-of-day.js';
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
    this._renderer.onFixtureClick(({ entity_id }) => {
      // toggleEntity itself refuses in view-only mode.
      this.planner.toggleEntity(entity_id);
    });
    this._renderer.onFixtureDblClick(({ kind, entity_id, fixtureId }) => {
      if (this.planner.uiMode === 'view') return;
      if (this.planner.isLightEntity(entity_id)) {
        this.dispatchEvent(new CustomEvent('open-light-config', {
          bubbles: true, composed: true, detail: { entityId: entity_id },
        }));
      } else if (this.planner.uiMode !== 'edit') {
        return;  // kiosk: no binding pickers
      } else if (!entity_id) {
        const f = this.planner.floor();
        const arr = kind === 'light' ? f.lights : f.switches;
        const it = arr.find(x => x.id === fixtureId);
        if (!it) return;
        this.dispatchEvent(new CustomEvent('open-entity-picker', {
          bubbles: true, composed: true,
          detail: {
            domain: kind,
            onPick: (id: string) => { it.entity_id = id; this.planner.save(); this.planner.emitConfig(); },
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
    return resolveScenePreset(sc, states);
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
  private _keyLights = '';
  private _keyZones = '';
  private _keyHalos = '';
  private _keyGhost = '';

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
        this._keyMotion = this._keyEnv = this._keyLights = this._keyZones = this._keyHalos = '';
        this._keyGhost = '';
      }

      // Layer visibility (shared with the 2D layer flags): group-scoped
      // layers are cheap per-tick visible flips; furniture + bg gate at
      // floor build time below (they live inside _floorGroup).
      const layers = p.store.layers2d ?? {};
      r.setLayerVisibility(layers);

      // Auto-follow camera flag (cheap; the renderer does the per-frame easing).
      r.setAutoFollow(!!p.store.scene3d?.autoFollow);

      // Floor / walls / furniture / bg: structural + effective lighting
      // preset (auto modes flip it as the sun/lux sensor moves) + per-floor
      // look overrides + build-time-gated layers.
      const scBase = p.store.scene3d ?? { preset: 'night' as const };
      const effPreset = this._effectivePreset(scBase, states);
      const scMerged = { ...scBase, ...(f.look3d ?? {}), preset: effPreset };
      const keyFloor = `${p.configRev}|${effPreset}|` +
        `${layers.furniture !== false}|${layers.bg !== false}|${layers.walls !== false}`;
      if (keyFloor !== this._keyFloor) {
        this._keyFloor = keyFloor;
        // customObjects edits bump configRev (via emitConfig) → keyFloor flips
        // → the placed recipe instance rebuilds as its own live preview.
        r.updateFloor(f, scMerged, layers, p.store.customObjects);
      }

      // Glass-house ghost floors: every OTHER story as a translucent shell.
      // Cheap to rebuild; keyed on the glassHouse flag + active floor id.
      const keyGhost = `${p.configRev}|${!!scBase.glassHouse}|${f.id}`;
      if (keyGhost !== this._keyGhost) {
        this._keyGhost = keyGhost;
        r.updateGhostFloors(p.store.floors, f.id, scMerged, p.store.customObjects);
      }

      // Imported 3D model: reload text from IDB when rev changes; rebuild
      // mesh when transform/opacity/visibility changes.
      this._syncModel(f);

      // Doors + windows: structural + bound entity states.
      const keyDoors = `${p.configRev}|` +
        f.doors.map(d => stOf(d.entity_id)).join(',') + '|' +
        f.windows.map(w => stOf(w.entity_id)).join(',');
      if (keyDoors !== this._keyDoors) {
        this._keyDoors = keyDoors;
        r.updateDoorsWindows(f.doors, f.windows, id => states[id] || null);
      }

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

      // Lights + switches: structural + state/brightness/color per entity.
      // Fireplace lights flicker via Math.random() inside the builder, so an
      // active fireplace forces a rebuild every frame (cheap: few lights).
      const hasLiveFireplace = f.lights.some(l =>
        (l.iconKind === 'fireplace') && l.entity_id && states[l.entity_id]?.state === 'on');
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
            targets.push({ key: `${s.id}_${i}`, x: wp.x, y: wp.y, color: tColor, edge });
          }
        }
      }
      // AI avatars: each motion sensor with `avatar` on whose bound entity is
      // firing projects a synthetic wandering target anchored at the sensor
      // position. The renderer's AI controller owns the actual movement (see
      // updateTargets); x/y here is only the spawn/wander anchor. Synthetic
      // targets never set `edge`, so presence-off runs the slow fade-out.
      for (const m of f.motionSensors) {
        if (!m.avatar || !m.entity_id) continue;
        if (states[m.entity_id]?.state !== 'on') continue;
        targets.push({ key: 'ai_' + m.id, x: m.x, y: m.y, color: hexToInt(motionColor(m)), ai: true });
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
      for (const fu of f.furniture) {
        if (!fu.entity_id) continue;
        const st = states[fu.entity_id];
        entityOn[fu.id] = st?.state === 'on' || st?.state === 'playing';
      }
      const roomNames: Record<string, string> = {};
      for (const rm of f.rooms ?? []) roomNames[rm.id] = rm.name;
      const ctx: ActivityContext = { entityOn, roomNames, timeBucket: resolveTimeBucket(states) };
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
