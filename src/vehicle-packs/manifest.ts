// Built-in vehicle pack manifest — eagerly imported (tiny), but each pack BODY
// is loaded via dynamic import only (code-splitting gotcha, mirrors the avatar
// pack manifest: never statically import a pack data module into the startup
// graph).
//
// Each row:
//   { id, label, path, count, franchise?, load: () => import('./<id>.js') }
// where the imported module default-exports (or named-exports `pack`) a
// VehiclePackDef. The planner hydrates loaded packs on connect via `load()` +
// registerVehiclePack. Base packs (no franchise flag) default loaded+active;
// franchise packs default UNLOADED (opt-in via Settings ▸ Vehicles).

import type { VehiclePackDef } from '../vehicles.js';

export interface VehiclePackManifestRow {
  id: string;
  label: string;
  path: string[];
  count: number;
  franchise?: boolean;
  load: () => Promise<{ default?: VehiclePackDef; pack?: VehiclePackDef }>;
}

export const VEHICLE_PACK_MANIFEST: VehiclePackManifestRow[] = [
  { id: 'base-aircraft-military-historical', label: 'Historical (WWI–WWII)',
    path: ['Aircraft', 'Military', 'Historical (WWI–WWII)'], count: 10,
    load: () => import('./base-aircraft-military-historical.js') },
  { id: 'base-aircraft-military-modern', label: 'Cold War & Modern',
    path: ['Aircraft', 'Military', 'Cold War & Modern'], count: 9,
    load: () => import('./base-aircraft-military-modern.js') },
  { id: 'base-aircraft-civil', label: 'Civil', path: ['Aircraft', 'Civil'], count: 8,
    load: () => import('./base-aircraft-civil.js') },
  { id: 'base-space-real', label: 'Real', path: ['Space', 'Real'], count: 5,
    load: () => import('./base-space-real.js') },
  { id: 'franchise-space-fiction', label: 'Fiction', path: ['Space', 'Fiction'], count: 4,
    franchise: true, load: () => import('./franchise-space-fiction.js') },
  { id: 'base-ground-civil', label: 'Civil', path: ['Ground Vehicles', 'Civil'], count: 9,
    load: () => import('./base-ground-civil.js') },
  { id: 'base-ground-military', label: 'Military & Historical',
    path: ['Ground Vehicles', 'Military & Historical'], count: 7,
    load: () => import('./base-ground-military.js') },
  { id: 'franchise-ground-fiction', label: 'Fiction', path: ['Ground Vehicles', 'Fiction'], count: 8,
    franchise: true, load: () => import('./franchise-ground-fiction.js') },
];
