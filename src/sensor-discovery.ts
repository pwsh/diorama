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
