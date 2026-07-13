import type { Floor, Store } from './types.js';

export const STORE_KEY = 'diorama:store:v1';

function defaultFloor(): Floor {
  return {
    id: 'f1', name: 'Floor 1', w: 8000, d: 6000,
    walls: [], furniture: [], lights: [], switches: [], sensors: [], motionSensors: [],
    envSensors: [], doors: [], windows: [], bg: null, rooms: [], bleProxies: [],
    alarmPanels: [], safetySensors: [], robots: [], presenceZones: [], cameras: [],
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
    envSensors: f.envSensors ?? [],
    look3d: f.look3d ?? null,
    doors: (f as Partial<Floor>).doors ?? [],
    windows: (f as Partial<Floor>).windows ?? [],
    bg: f.bg ?? null,
    model3d: (f as Partial<Floor>).model3d ?? null,
    rooms: f.rooms ?? [],
    bleProxies: f.bleProxies ?? [],
    alarmPanels: f.alarmPanels ?? [],
    safetySensors: f.safetySensors ?? [],
    robots: f.robots ?? [],
    presenceZones: f.presenceZones ?? [],
    cameras: f.cameras ?? [],
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

export function newId(prefix: string): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}
