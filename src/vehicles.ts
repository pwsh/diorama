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
  // Self-lit engine / thruster glow (rocket bells, spacecraft drives). Emissive
  // rather than transparent, exactly like the BG_CRAFTS spacecraft: STATIC, no
  // per-frame system. Ignored by the ground path.
  emissive?: boolean;
  // Animation hook for the SKY surfaces. Prims sharing a `spin` kind AND an
  // identical `pos` are collected into ONE spinning group centred on that pos:
  //   'prop'  — spins about local Z (the flight axis): propeller blades
  //   'rotor' — spins about local Y (the vertical axis): a rotorcraft main disc
  //             (a craft carrying any of these flies with rig.rotorY set, so a
  //             model must never mix 'prop' and 'rotor')
  //   'tail'  — spins about local X: a helicopter tail rotor
  //   'wheel' — ground-vehicle road wheel; no sky surface animates it (yet)
  // Ignored entirely by the ground path.
  spin?: 'prop' | 'rotor' | 'tail' | 'wheel';
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
  // VERTICAL-LAUNCH craft (Saturn V / Falcon 9). The model is authored NOSE-UP
  // along +Y (engines down) instead of nose-forward along −Z, so it flies
  // upright on the banner orbit — the research's "vertical-launch novelty"
  // framing, and the only pose in which a rocket towing a side banner reads.
  // The orbit's yaw math is unchanged (it only ever writes rotation.y, which
  // spins an upright rocket about its own axis — no pitch is ever applied);
  // the ONE thing the flag changes is which extent the banner standoff uses:
  // `dims[1]` (hull DIAMETER along local Z) instead of `lenMm`, so a 110 m
  // rocket does not trail its message a hundred metres astern. See
  // `bannerCraftHullZMm`.
  vertical?: boolean;
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

// Monotonic registry revision — bumped on EVERY register / unregister / config
// change. Consumers whose dirty key deliberately carries no `configRev` fold
// this in instead: `_keyBgText` (three-view) must rebuild a banner rig when the
// vehicle pack behind its tow craft is deactivated/unloaded, but the whole point
// of that key is that unrelated entity churn leaves the rigs alone — so it takes
// this narrow revision rather than reintroducing configRev.
let _rev = 0;
export function vehicleRegistryRev(): number { return _rev; }

function _invalidate(): void {
  _activeCache = null;
  _defCache = null;
  _recipeCache.clear();
  _rev++;
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

// ── Banner tow surface (V2) ─────────────────────────────────────────────────
//
// Resolve an id for the BANNER slot: an active model that declares the surface.
// A ground-only model chosen by a hand-edited config resolves to null and the
// caller falls back to the classic toy tow plane — the same soft-fail an
// unloaded pack takes (a saved entry must never break into an error).
export function bannerVehicleDef(id: VehicleId | null | undefined): VehicleModelDef | null {
  const def = resolveVehicleDef(id);
  return def && def.surfaces.includes('banner') ? def : null;
}

// Pack models are authored at REAL mm scale (a Spitfire is 9120 mm long); the
// banner world is TOY scale — the shipped hand-built BG_CRAFTS hulls run 1600
// (news chopper) to 3400 mm (B-52) regardless of the real airframe. So a pack
// craft is scaled by a factor derived from its real length, DELIBERATELY not to
// scale (the same honesty posture `compressRadiusMm` documents for the live
// flight shell): 0.18× real, clamped into the shipped band.
//
// The clamp ends are anchored on the shipped roster: the floor sits just under
// the smallest BG_CRAFT (news chopper 1600) so a Piper Cub still reads as a
// model rather than a speck, and the ceiling holds the biggest pack craft at
// ~1.5× the shipped B-52 — which is what the REAL length ratio is too (747-8
// 76.25 m vs B-52 49.0 m = 1.56×), so the roster stays internally consistent
// instead of a 747 dwarfing everything at its true 13.7 m of display length.
export const BANNER_CRAFT_SCALE_FACTOR = 0.18;
export const BANNER_CRAFT_MIN_MM = 1400;
export const BANNER_CRAFT_MAX_MM = 5200;

function _lenOr(lenMm: number): number {
  return isFinite(lenMm) && lenMm > 0 ? lenMm : 10000;
}

/** Displayed hull length (mm) for a real-world length. Pure, clamped, never NaN. */
export function bannerCraftDisplayLenMm(lenMm: number): number {
  const L = _lenOr(lenMm);
  return Math.min(BANNER_CRAFT_MAX_MM,
                  Math.max(BANNER_CRAFT_MIN_MM, L * BANNER_CRAFT_SCALE_FACTOR));
}

/** Uniform scale factor applied to a pack craft's model group in the sky. */
export function bannerCraftScale(lenMm: number): number {
  const L = _lenOr(lenMm);
  return bannerCraftDisplayLenMm(L) / L;
}

/**
 * The model's UNSCALED extent along local Z — what the banner standoff
 * (`hullZ/2 + 500 + halfBannerLen`) measures against. Nose-forward craft trail
 * the banner clear of their tail (= the hull length); a VERTICAL rocket's Z
 * extent is its DIAMETER, so its banner rides just off the flank.
 */
export function bannerCraftHullZMm(def: VehicleModelDef): number {
  return def.vertical ? _lenOr(def.dims[1]) : _lenOr(def.lenMm);
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
