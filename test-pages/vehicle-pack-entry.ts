// Bundle entry for vehicle-pack-test.html. ONE bundle so geometry.ts and the
// vehicles.ts registry singleton share the same module instance (geometry
// imports vehicles; two separate bundles would each carry their own registry
// and the resolveFurnitureDef assertions would read an unconfigured copy).
// Bundle with a plain esbuild pass (both modules are pure — no lit/tsconfig
// aliases needed):
//   npx esbuild test-pages/vehicle-pack-entry.ts --bundle --format=esm \
//     --outfile=<harness>/veh.mod.js
export {
  registerVehiclePack, unregisterVehiclePack, getVehiclePack, vehiclePackList,
  vehiclePackEffectiveState, setVehiclePacksConfig, getVehiclePacksConfig,
  activeVehicleIds, listActiveVehiclePacks, vehiclePackOf, resolveVehicleDef,
  vehicleRecipe, VEHICLE_GLASS, VEHICLE_DARK,
} from '../src/vehicles.js';
export { resolveFurnitureDef, FURNITURE_KINDS } from '../src/geometry.js';
