import type { Floor, Store, ConfigIndex } from './types.js';

export const STORE_KEY = 'diorama:store:v1';
// Config registry index cache (Batch B). The ACTIVE config body stays under
// STORE_KEY so no cache migration is needed; this only mirrors the index.
export const CONFIGS_CACHE_KEY = 'diorama:configs';

// user_data key of a config body. The index lists ids; each body lives here.
export function cfgBodyKey(id: string): string { return 'diorama-cfg-' + id; }

function defaultFloor(): Floor {
  return {
    id: 'f1', name: 'Floor 1', w: 8000, d: 6000,
    walls: [], furniture: [], lights: [], switches: [], sensors: [], motionSensors: [],
    roamers: [], envSensors: [], doors: [], windows: [], bg: null, rooms: [], bleProxies: [],
    alarmPanels: [], calendarPanels: [], thermostats: [], safetySensors: [], robots: [], alertBeacons: [], presenceZones: [], cameras: [],
    projectors: [], valves: [], plugs: [],
    groundAreas: [], sprinklerZones: [], voidAreas: [], infoCards: [], actionButtons: [],
  };
}

export function defaultStore(): Store {
  return {
    v: 2,
    floors: [defaultFloor()],
    currentFloorId: 'f1',
    activeSensorId: null,
    coverage: true, imperial: false, showDetails: false, useRawTargets: false,
    showMotionZones: true,
    customObjects: [],
    people: [],
    bleShowUnknown: true,
  };
}

export function repairFloor(f: Partial<Floor> & { id: string; name: string; w: number; d: number }): Floor {
  return {
    id: f.id, name: f.name, w: f.w, d: f.d,
    walls: f.walls ?? [],
    furniture: f.furniture ?? [],
    lights: f.lights ?? [],
    switches: f.switches ?? [],
    sensors: f.sensors ?? [],
    motionSensors: f.motionSensors ?? [],
    roamers: f.roamers ?? [],
    envSensors: f.envSensors ?? [],
    look3d: f.look3d ?? null,
    doors: (f as Partial<Floor>).doors ?? [],
    windows: (f as Partial<Floor>).windows ?? [],
    bg: f.bg ?? null,
    model3d: (f as Partial<Floor>).model3d ?? null,
    rooms: f.rooms ?? [],
    bleProxies: f.bleProxies ?? [],
    alarmPanels: f.alarmPanels ?? [],
    calendarPanels: f.calendarPanels ?? [],
    thermostats: f.thermostats ?? [],
    safetySensors: f.safetySensors ?? [],
    robots: f.robots ?? [],
    alertBeacons: f.alertBeacons ?? [],
    presenceZones: f.presenceZones ?? [],
    cameras: f.cameras ?? [],
    projectors: f.projectors ?? [],
    valves: f.valves ?? [],
    plugs: f.plugs ?? [],
    groundAreas: f.groundAreas ?? [],
    sprinklerZones: f.sprinklerZones ?? [],
    voidAreas: f.voidAreas ?? [],
    infoCards: f.infoCards ?? [],
    actionButtons: f.actionButtons ?? [],
    boundsLocked: f.boundsLocked,
    disabled: f.disabled,
  };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Store;
      if (Array.isArray(s.floors)) {
        s.floors = s.floors.map(f => repairFloor(f as Floor));
      }
      return s;
    }
  } catch (_) { /* ignore */ }
  return defaultStore();
}

export function saveStore(s: Store): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (_) { /* ignore */ }
}

export function loadConfigsCache(): ConfigIndex | null {
  try {
    const raw = localStorage.getItem(CONFIGS_CACHE_KEY);
    if (raw) {
      const idx = JSON.parse(raw) as ConfigIndex;
      if (idx && Array.isArray(idx.configs)) return idx;
    }
  } catch (_) { /* ignore */ }
  return null;
}

export function saveConfigsCache(index: ConfigIndex): void {
  try { localStorage.setItem(CONFIGS_CACHE_KEY, JSON.stringify(index)); } catch (_) { /* ignore */ }
}

export function newId(prefix: string): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}
