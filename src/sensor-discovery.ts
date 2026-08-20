import type { DiscoveredDevice, HassState } from './types.js';

export class SensorDiscovery {
  private _lastCount = -1;
  private _devices: string[] | null = null;
  private _perDev: Record<string, DiscoveredDevice> = {};

  listDevices(states: Record<string, HassState>): string[] {
    const count = Object.keys(states).length;
    if (count === this._lastCount && this._devices) return this._devices;
    this._lastCount = count;
    this._perDev = {};
    const anchors = [
      /^binary_sensor\.(.+)_presence$/,
      /^sensor\.(.+)_target_1_x$/,
      /^sensor\.(.+)_t1_avg_x$/,
    ];
    const found = new Set<string>();
    for (const id of Object.keys(states)) {
      for (const re of anchors) {
        const m = id.match(re);
        if (m) { found.add(m[1]); break; }
      }
    }
    this._devices = [...found].sort();
    return this._devices;
  }

  discoverForDevice(states: Record<string, HassState>, p: string): DiscoveredDevice {
    // Cache is hot only once the device has finished its initial entity
    // publish — both inclusion zones and object halos must be present. (Filter
    // zones are optional.) On a partial cache, re-scan so newly-arrived
    // entities surface without a reload.
    const cached = this._perDev[p];
    if (cached &&
        cached.inclusionZoneSlugs.length > 0 &&
        cached.objectSlugs.length > 0) {
      return cached;
    }
    const e = (id: string): string | null => (states[id] !== undefined ? id : null);
    const r: DiscoveredDevice = {
      devicePrefix: p, targets: [], targetActive: [], avgX: [], avgY: [],
      targetCount: e(`sensor.${p}_presence_target_count`),
      zoneTargetCount: [], zoneStillCount: [], zoneMovingCount: [],
      ghostbuster: e(`switch.${p}_ghostbuster`),
      multiTarget: e(`switch.${p}_multi_target_tracking`),
      upsideDown: e(`switch.${p}_mounted_upside_down`),
      sensorHeight: e(`number.${p}_sensor_height`),
      mountAngle: e(`number.${p}_mount_angle`),
      procTime: e(`sensor.${p}_radar_processing_time`),
      procWarn: e(`binary_sensor.${p}_processing_too_slow`),
      hasTarget: e(`binary_sensor.${p}_presence`),
      haloOccupied: [], inclusionZoneSlugs: [], filterZoneSlugs: [], objectSlugs: [],
    };
    for (let t = 1; t <= 3; t++) {
      r.targets.push({
        x_id:          e(`sensor.${p}_target_${t}_x`),
        y_id:          e(`sensor.${p}_target_${t}_y`),
        speed_id:      e(`sensor.${p}_target_${t}_speed`),
        angle_id:      e(`sensor.${p}_target_${t}_angle`),
        resolution_id: e(`sensor.${p}_target_${t}_resolution`),
      });
      r.avgX.push(e(`sensor.${p}_t${t}_avg_x`));
      r.avgY.push(e(`sensor.${p}_t${t}_avg_y`));
      r.targetActive.push(e(`binary_sensor.${p}_target_${t}_active`));
    }
    const escP = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const zoneEnableRe = new RegExp(`^switch\\.${escP}_(.+)_enable$`);
    const polygonSlugs: string[] = [];
    for (const id of Object.keys(states)) {
      const m = id.match(zoneEnableRe);
      if (!m) continue;
      const slug = m[1];
      if (slug.endsWith('_halo')) continue;
      polygonSlugs.push(slug);
    }
    // Filter zones may appear under either naming scheme:
    //   - long form: `..._filter_zone_1_enable` (substring "filter")
    //   - short form: `..._fz1_enable` / `..._fz2_enable` (prefix `fz<digit>`)
    // Anything else with `_enable` (and not a halo) is treated as inclusion.
    const isFilter = (s: string) => /^fz\d/.test(s) || s.includes('filter');
    r.filterZoneSlugs    = polygonSlugs.filter(isFilter).slice(0, 3);
    r.inclusionZoneSlugs = polygonSlugs.filter(s => !isFilter(s)).slice(0, 3);
    r.zoneTargetCount = r.inclusionZoneSlugs.map(slug => e(`sensor.${p}_${slug}_target_count`));
    r.zoneStillCount  = r.inclusionZoneSlugs.map(slug => e(`sensor.${p}_${slug}_still_count`));
    r.zoneMovingCount = r.inclusionZoneSlugs.map(slug => e(`sensor.${p}_${slug}_moving_count`));
    const haloEnableRe = new RegExp(`^switch\\.${escP}_(.+)_halo_enable$`);
    for (const id of Object.keys(states)) {
      const m = id.match(haloEnableRe);
      if (!m) continue;
      r.objectSlugs.push(m[1]);
    }
    r.haloOccupied = r.objectSlugs.map(slug =>
      e(`binary_sensor.${p}_${slug}_halo_occupied`) || e(`binary_sensor.${p}_${slug}_occupied`));
    this._perDev[p] = r;
    return r;
  }

  invalidate(): void {
    this._lastCount = -1; this._devices = null; this._perDev = {};
  }
}

// ── Generic device enumeration + technical-editor helpers ─────────────────
//
// The regex discovery above is the SEMANTIC layer: it maps entity ids to
// MEANING (this one is target 1's X). It is deliberately a fixed set, so
// anything the firmware exposes under a name it does not predict — a
// `select.*` mode, a `button.*` restart, a `text.*` firmware version — is
// invisible to it.
//
// The helpers below are the COMPLETENESS layer used by the mmWave technical
// editor: given every entity HA's registry says belongs to the bound device,
// render each one by DOMAIN. Nothing here replaces discovery; the semantic
// ids stay authoritative and are excluded from the generic list so a control
// never appears twice.

/** Domain part of an entity id (`sensor.foo_bar` → `sensor`), '' if malformed. */
export function entityDomain(entityId: string): string {
  const i = String(entityId ?? '').indexOf('.');
  return i > 0 ? entityId.slice(0, i) : '';
}

/**
 * How the technical editor should render an entity it found generically.
 * Deliberately domain-driven (not name-driven) — that is the whole point of
 * the completeness layer.
 *   number / input_number → numeric input   (number.set_value)
 *   switch / input_boolean → toggle         (switch.turn_on|turn_off)
 *   select / input_select  → dropdown       (select.select_option)
 *   button / input_button  → press          (button.press)
 *   everything else        → read-only readout
 */
export type DeviceControlKind = 'number' | 'switch' | 'select' | 'button' | 'readout';

export function deviceControlKind(entityId: string): DeviceControlKind {
  switch (entityDomain(entityId)) {
    case 'number': case 'input_number':  return 'number';
    case 'switch': case 'input_boolean': return 'switch';
    case 'select': case 'input_select':  return 'select';
    case 'button': case 'input_button':  return 'button';
    default: return 'readout';
  }
}

/**
 * Every entity id the regex discovery already OWNS for this device. The
 * generic pane subtracts this so the five known controls (and the target /
 * zone / object plumbing) are not duplicated as anonymous rows.
 *
 * Zone-vertex and object numbers are synthesized on demand from slugs
 * (`number.<slug>_<zoneSlug>_v<n>_x`) and never appear in DiscoveredDevice as
 * ids, so they are rebuilt here from the same slugs — otherwise up to 48 zone
 * vertex numbers would flood the generic list.
 */
export function semanticEntityIds(d: DiscoveredDevice): Set<string> {
  const out = new Set<string>();
  const add = (v: string | null | undefined) => { if (v) out.add(v); };
  const addAll = (v: readonly (string | null | undefined)[] | undefined) => {
    if (v) for (const x of v) add(x);
  };
  for (const t of d.targets ?? []) {
    add(t.x_id); add(t.y_id); add(t.speed_id); add(t.angle_id); add(t.resolution_id);
  }
  addAll(d.targetActive); addAll(d.avgX); addAll(d.avgY);
  add(d.targetCount);
  addAll(d.zoneTargetCount); addAll(d.zoneStillCount); addAll(d.zoneMovingCount);
  add(d.ghostbuster); add(d.multiTarget); add(d.upsideDown);
  add(d.sensorHeight); add(d.mountAngle);
  add(d.procTime); add(d.procWarn); add(d.hasTarget);
  addAll(d.haloOccupied);
  const p = d.devicePrefix;
  for (const slug of [...(d.inclusionZoneSlugs ?? []), ...(d.filterZoneSlugs ?? [])]) {
    add(`switch.${p}_${slug}_enable`);
    for (let vi = 1; vi <= MAX_ZONE_VERTICES; vi++) {
      add(`number.${p}_${slug}_v${vi}_x`);
      add(`number.${p}_${slug}_v${vi}_y`);
    }
  }
  for (const slug of d.objectSlugs ?? []) {
    add(`switch.${p}_${slug}_halo_enable`);
    add(`number.${p}_${slug}_x`);
    add(`number.${p}_${slug}_y`);
    add(`number.${p}_${slug}_halo_radius`);
  }
  return out;
}

/**
 * The firmware exposes exactly 8 vertex slots per polygon, and treats a
 * (0,0) at any index PAST the first as "polygon ends here". Both rules are
 * firmware conventions, not Diorama choices — every read and write path must
 * honour them or a zone silently loses (or gains) vertices.
 */
export const MAX_ZONE_VERTICES = 8;

/**
 * Trim a vertex list the way the firmware reads it back: stop at the first
 * (0,0) past index 0, and never exceed the slot count. Pure; used by the
 * editor for both directions so what is drawn is what the device will store.
 */
export function trimZoneVertices<T extends { x: number; y: number }>(verts: readonly T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < verts.length && i < MAX_ZONE_VERTICES; i++) {
    const v = verts[i];
    if (i > 0 && v.x === 0 && v.y === 0) break;
    out.push(v);
  }
  return out;
}

/**
 * Pad a vertex list out to all 8 slots for writing. Unused slots are written
 * as (0,0) — the sentinel — so shrinking a polygon actually clears the tail
 * instead of leaving stale vertices on the device.
 */
export function padZoneVertices(verts: readonly { x: number; y: number }[]): { x: number; y: number }[] {
  const trimmed = trimZoneVertices(verts);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < MAX_ZONE_VERTICES; i++) {
    const v = trimmed[i];
    out.push(v ? { x: v.x, y: v.y } : { x: 0, y: 0 });
  }
  return out;
}

// NB there is deliberately NO heading-vs-mount_angle comparison here.
// `Sensor.heading` is a plan YAW (rotation about the world Y axis: the frame
// zone drawing and the 2D/3D body rotation use), while the device's
// `mount_angle` is applied by the 3D renderer as a downward TILT about the
// body's local X axis. They are different axes, so comparing them numerically
// is a category error — a correct install with a sensor facing west
// (heading 90) and no downward tilt (mount_angle 0) would "disagree" by 90°.
// The technical editor shows both values side by side and labels what each
// drives; it makes no claim that they should match. Visibility was the
// finding, not an alarm.
