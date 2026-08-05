// Vehicle model packs — pure, three.js-FREE shared module (the `avatars.ts` twin).
//
// Imported by BOTH the app graph (planner, toolbar, settings) and the lazy
// three-renderer chunk; Vite hoists it into a shared chunk and the `?v=`
// chunk-pinning keeps the two graphs consistent. It holds only DATA (types +
// the registry singleton) and PURE resolve functions — it must NEVER import
// three.js, the renderer, or geometry.ts (geometry imports THIS module, so a
// back-import would be a real runtime cycle; the one hex helper it needs is
// re-implemented locally below).
//
// A vehicle model is a short primitive list + two livery tint slots — the SAME
// vocabulary Custom Objects (`ObjectRecipe` / `RecipePrimitive`) already use.
// `vehicleRecipe()` converts a resolved model into exactly that shape, which is
// what lets the WHOLE existing furniture pipeline (3D build, 2D top-down
// projection, nav blocking, thumbnails, align/lock/identify) render vehicles
// with near-zero renderer changes.

import type { ObjectRecipe } from './types.js';   // type-only (erased)

// Persisted / referenced vehicle model id. Pack members are namespaced
// '<packId>/<member>' (the AvatarId convention).
export type VehicleId = string;

export type VehicleCategory = 'aircraft' | 'space' | 'ground';

// A model primitive — a superset of `RecipePrimitive` (Custom Objects):
// the same four shapes and units, plus livery COLOR SLOTS and two forward-
// looking fields (`emissive`, `spin`) that the V1 ground path ignores and a
// later aircraft/ADS-B batch consumes.
export interface VehiclePrimitive {
  shape: 'box' | 'cylinder' | 'sphere' | 'cone';
  // mm, model-local. box: [w, ht, d]; cylinder: [rTop, rBot, ht];
  // sphere: [r] (2-tuple/3-tuple tolerated); cone: [r, ht].
  size: [number, number, number] | [number, number];
  // mm, model-local. Origin = footprint centre at GROUND level (y = 0);
  // FRONT = local −Z (the repo furniture convention: the 2D front chevron and
  // every humanoid/appliance "functional front" point down local −Z).
  pos: [number, number, number];
  rot?: [number, number, number];    // degrees XYZ (RecipePrimitive convention)
  // A livery SLOT ('body'/'accent' resolve from the model def; 'glass'/'dark'
  // are fixed house tones) or a literal '#rrggbb'.
  color?: string | 'body' | 'accent' | 'glass' | 'dark';
  emissive?: boolean;                // V2 (aircraft beacons); ignored by the ground path
  spin?: 'prop' | 'rotor' | 'wheel'; // V2 animation hook; ignored by the ground path
  segments?: number;                 // V2 radial tessellation hint; ignored by the ground path
}

export interface VehicleModelDef {
  id: VehicleId;                     // '<packId>/<member>'
  label: string;                     // USER-VISIBLE copy. Fiction ⇒ descriptive-generic
                                     // (never a franchise/proper noun) — see the IP posture
                                     // in docs/research/vehicle-model-library.md §5.3.
  category: VehicleCategory;
  era?: string;
  lenMm: number;                     // real-world length (banner standoff anchor, V2)
  dims: [number, number, number];    // ground footprint W (across) × D (along) × H, mm
  body?: string;                     // default 'body' slot color (#rrggbb)
  accent?: string;                   // default 'accent' slot color (#rrggbb)
  prims: VehiclePrimitive[];
  surfaces: ('ground' | 'banner' | 'adsb')[];   // which consumption surfaces accept this model
}

export interface VehiclePackDef {
  id: string;                        // 'base-ground-civil', 'franchise-ground-fiction', …
  version: number;
  label: string;
  path: string[];                    // Settings ▸ Vehicles tree, e.g. ['Ground Vehicles', 'Civil']
  builtin?: boolean;                 // shipped in the app bundle (vs user-imported)
  franchise?: boolean;               // opt-in novelty pack: defaults loaded:false
  models: VehicleModelDef[];
}

// Persisted per-pack config — structurally IDENTICAL to AvatarPackConfig so the
// planner can hand `store.vehiclePacks` straight to setVehiclePacksConfig.
export interface VehiclePackConfig { loaded?: boolean; active?: boolean; members?: string[] }
export type VehiclePacksConfig = Record<string, VehiclePackConfig>;

export interface VehiclePackEntry { def: VehiclePackDef; source: 'builtin' | 'user' }

// ── Fixed house tones for the non-model-driven slots ────────────────────────
export const VEHICLE_GLASS = '#2b3138';   // dark tinted glazing (reads on the toon ramp)
export const VEHICLE_DARK = '#22262b';    // tyres / trim / shadow-line parts
const VEHICLE_BODY_FALLBACK = '#8a8f96';
const VEHICLE_ACCENT_FALLBACK = '#c9ced4';

// ── Registry singleton ──────────────────────────────────────────────────────

const _packs = new Map<string, VehiclePackEntry>();
let _config: VehiclePacksConfig | undefined;
let _activeCache: Set<VehicleId> | null = null;
let _defCache: Map<VehicleId, VehicleModelDef> | null = null;
// vehicleRecipe() is called from per-frame hot paths (resolveFurnitureDef runs
// once per piece per 2D frame) — memoize the converted recipes and drop them
// whenever the registry or the config changes.
const _recipeCache = new Map<VehicleId, ObjectRecipe | null>();

function _invalidate(): void {
  _activeCache = null;
  _defCache = null;
  _recipeCache.clear();
}

export function registerVehiclePack(def: VehiclePackDef, source: 'builtin' | 'user' = 'builtin'): void {
  const existing = _packs.get(def.id);
  // Idempotent by id+version — a re-register at the same version is a no-op.
  if (existing && existing.def.version === def.version && existing.source === source) return;
  _packs.set(def.id, { def, source });
  _invalidate();
}

export function unregisterVehiclePack(id: string): void {
  if (_packs.delete(id)) _invalidate();
}

export function getVehiclePack(id: string): VehiclePackEntry | undefined { return _packs.get(id); }

export function vehiclePackList(): VehiclePackEntry[] {
  return [..._packs.values()].sort((a, b) =>
    a.def.path.join('/').localeCompare(b.def.path.join('/'))
    || a.def.label.localeCompare(b.def.label));
}

// Effective loaded/active for a pack given the config + pack defaults:
//   builtin base pack   → default loaded + active
//   franchise/user pack → default loaded:false (opt-in)
function packState(def: VehiclePackDef, cfg?: VehiclePackConfig): { loaded: boolean; active: boolean } {
  const defaultLoaded = !!def.builtin && !def.franchise;
  const loaded = cfg?.loaded ?? defaultLoaded;
  const active = loaded && (cfg?.active ?? true);
  return { loaded, active };
}

// Public wrapper — the Settings pack manager reads a pack's effective state.
export function vehiclePackEffectiveState(
  def: VehiclePackDef, cfg: VehiclePacksConfig | undefined = _config,
): { loaded: boolean; active: boolean } {
  return packState(def, cfg?.[def.id]);
}

export function setVehiclePacksConfig(cfg: VehiclePacksConfig | undefined): void {
  _config = cfg;
  _invalidate();
}
export function getVehiclePacksConfig(): VehiclePacksConfig | undefined { return _config; }

// Every model id in a loaded+active pack, respecting the `members` subset.
export function activeVehicleIds(cfg: VehiclePacksConfig | undefined = _config): VehicleId[] {
  if (cfg === _config && _activeCache) return [..._activeCache];
  const out: VehicleId[] = [];
  for (const { def } of vehiclePackList()) {
    const st = packState(def, cfg?.[def.id]);
    if (!st.loaded || !st.active) continue;
    const members = cfg?.[def.id]?.members;
    const memberSet = members ? new Set(members) : null;
    for (const m of def.models) {
      if (memberSet && !memberSet.has(m.id)) continue;
      out.push(m.id);
    }
  }
  if (cfg === _config) _activeCache = new Set(out);
  return out;
}

// Loaded+active packs with their currently-active members. Drives the toolbar
// Vehicles tab — what the UI offers == what resolveVehicleDef will accept.
export function listActiveVehiclePacks(
  cfg: VehiclePacksConfig | undefined = _config,
): { def: VehiclePackDef; models: VehicleModelDef[] }[] {
  const out: { def: VehiclePackDef; models: VehicleModelDef[] }[] = [];
  for (const { def } of vehiclePackList()) {
    const st = packState(def, cfg?.[def.id]);
    if (!st.loaded || !st.active) continue;
    const sub = cfg?.[def.id]?.members;
    const set = sub ? new Set(sub) : null;
    const models = def.models.filter(m => !set || set.has(m.id));
    if (models.length) out.push({ def, models });
  }
  return out;
}

function _activeSet(): Set<VehicleId> {
  if (!_activeCache) activeVehicleIds();
  return _activeCache ?? new Set();
}

function _defMap(): Map<VehicleId, VehicleModelDef> {
  if (_defCache) return _defCache;
  const m = new Map<VehicleId, VehicleModelDef>();
  for (const { def } of vehiclePackList()) for (const mod of def.models) m.set(mod.id, mod);
  _defCache = m;
  return m;
}

// The pack a model id belongs to (registered packs only; ignores loaded/active).
export function vehiclePackOf(id: VehicleId): VehiclePackDef | null {
  for (const { def } of vehiclePackList()) if (def.models.some(m => m.id === id)) return def;
  return null;
}

// Resolve a vehicle id to its model def. Returns NULL when the id is unknown,
// its pack is unloaded/deactivated, or the member is excluded by a `members`
// subset — the caller falls back (a placed piece renders as a plain block, the
// avatar unloaded-pack precedent). Never throws.
export function resolveVehicleDef(id: VehicleId | null | undefined): VehicleModelDef | null {
  if (!id) return null;
  if (!_activeSet().has(id)) return null;
  return _defMap().get(id) ?? null;
}

// ── Model → ObjectRecipe conversion ─────────────────────────────────────────

function _clean(hex: string): string {
  const s = hex.trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s
    : /^#[0-9a-fA-F]{3}$/.test(s) ? '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]
    : VEHICLE_BODY_FALLBACK;
}

// Local hex→int (geometry.ts is NOT importable here — it imports this module).
function _hexToInt(hex: string): number {
  return parseInt(_clean(hex).slice(1), 16) | 0;
}

// Resolve a primitive's color slot into a concrete '#rrggbb'.
function resolveSlot(c: VehiclePrimitive['color'], body: string, accent: string): string {
  switch (c) {
    case undefined: return body;
    case 'body': return body;
    case 'accent': return accent;
    case 'glass': return VEHICLE_GLASS;
    case 'dark': return VEHICLE_DARK;
    default: return _clean(c);
  }
}

function _size3(s: VehiclePrimitive['size']): [number, number, number] {
  return s.length === 3 ? [s[0], s[1], s[2]] : [s[0], s[1], 0];
}

// Convert an ACTIVE vehicle model into the Custom-Objects `ObjectRecipe` shape:
// slot colors resolved to concrete hex, `spin`/`emissive`/`segments` dropped
// (the ground path has no animation channel), footprint from `dims`. Returns
// null exactly when resolveVehicleDef does. Memoized — safe to call per frame.
export function vehicleRecipe(id: VehicleId | null | undefined): ObjectRecipe | null {
  if (!id) return null;
  const hit = _recipeCache.get(id);
  if (hit !== undefined) return hit;
  const def = resolveVehicleDef(id);
  if (!def) { _recipeCache.set(id, null); return null; }
  const body = _clean(def.body ?? VEHICLE_BODY_FALLBACK);
  const accent = _clean(def.accent ?? VEHICLE_ACCENT_FALLBACK);
  const recipe: ObjectRecipe = {
    id: def.id,
    label: def.label,
    w: def.dims[0], h: def.dims[1], ht: def.dims[2],
    color: _hexToInt(body),
    back: 'none',
    cat: 'vehicle',
    frontArrow: true,            // vehicles have a functional front (local −Z = nose)
    primitives: def.prims.map(p => ({
      shape: p.shape,
      size: _size3(p.size),
      pos: [p.pos[0], p.pos[1], p.pos[2]] as [number, number, number],
      ...(p.rot ? { rot: [p.rot[0], p.rot[1], p.rot[2]] as [number, number, number] } : {}),
      color: resolveSlot(p.color, body, accent),
    })),
  };
  _recipeCache.set(id, recipe);
  return recipe;
}
