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
  { id: 'base-ground-civil', label: 'Civil', path: ['Ground Vehicles', 'Civil'], count: 9,
    load: () => import('./base-ground-civil.js') },
  { id: 'base-ground-military', label: 'Military & Historical',
    path: ['Ground Vehicles', 'Military & Historical'], count: 7,
    load: () => import('./base-ground-military.js') },
  { id: 'franchise-ground-fiction', label: 'Fiction', path: ['Ground Vehicles', 'Fiction'], count: 7,
    franchise: true, load: () => import('./franchise-ground-fiction.js') },
];
