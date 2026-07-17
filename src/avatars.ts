// Avatar packs — pure, three.js-FREE shared module.
//
// This module is imported by BOTH the app graph (sidebar, planner) and the
// lazy three-renderer chunk. Vite hoists it into a shared chunk; the `?v=`
// chunk-pinning keeps the two graphs consistent. It must NEVER import three.js
// or three-renderer — it holds only DATA (the core avatar pack), the registry
// singleton, and the pure resolve functions moved out of three-renderer.
//
// Persisted avatar id: legacy kinds keep their bare ids ('adult', 'ninja',
// 'cat'…); future pack members are '<packId>/<memberId>'. `AvatarKind` in
// types.ts is a string alias of this, so persisted fields stay source-compatible
// with the old union.

export type AvatarId = string;

// The old hard-coded 24-value union, kept for typing the CORE pack + defaults.
export type LegacyAvatarKind =
  | 'adult' | 'child' | 'robot' | 'alien' | 'professional'
  | 'hacker' | 'movie_star' | 'ninja' | 'cyborg' | 'ninja_cyborg' | 'athlete'
  | 'teddy_bear' | 'cartoon_mouse' | 'cartoon_dog' | 'cartoon_duck'
  | 'cowboy' | 'magician' | 'farmer' | 'tech_expert' | 'supermodel'
  | 'wise_oracle' | 'astronaut'
  | 'cat' | 'dog';

// A declarative accessory primitive. Sizes are in mm at sk=1 (scaled by the
// rig's sk at build); positions/rotations are body-local (-Z = front). Colors
// resolve against the rig's materials (see three-renderer._addDeclarativeAccessories).
export interface AvatarPrimitive {
  shape: 'box' | 'sphere' | 'cylinder' | 'cone' | 'cape';
  // box: [w,h,d]; sphere: r or [rx,ry,rz]; cyl: [rTop,rBot,h]; cone: [r,h]
  // (2-tuple accepted for cones; a third element is tolerated and ignored).
  // cape: [shoulderWidth, length, flareBottomWidth] — a draped CURVED sheet, NOT
  //   a cone/box: an open-ended cylinder-wall segment (arc ~1.65 rad centered on
  //   the back +Z), top radius narrower than the flared bottom, flattened ~0.5 in
  //   Z so it hugs the shoulders. Double-sided + outline-skipped automatically.
  //   Cape SEMANTICS: the mesh origin is the cape's TOP RIM (hang point). For the
  //   `back` anchor (all current data) the renderer AUTO-PINS that rim to the
  //   neck-base collar just behind the torso and IGNORES pos.y — so the cape
  //   always fastens at the neck and drapes downward, regardless of the authored
  //   pos.y. pos.x / pos.z still fine-tune lateral / depth placement; a small
  //   outward X `rot` makes it drape off the shoulders and clear the torso.
  size: number | [number, number] | [number, number, number];
  anchor:
    | 'crown' | 'head' | 'face' | 'chest' | 'back' | 'hip' | 'root'
    | 'handL' | 'handR'                        // humanoid
    | 'shoulderL' | 'shoulderR'                // torso-mounted (pauldrons — no swing)
    | 'neck' | 'tailbone'                      // torso top / rear hip (+Z)
    // Limb joints (Phase 4a) — parented to the SWINGING pivot so the accessory
    // rides the limb animation. wrist = hand-group origin; elbow/knee = the lower
    // limb pivot; ankle = shin bottom. Fall back to root on a legless/hover rig.
    | 'wristL' | 'wristR' | 'elbowL' | 'elbowR' | 'kneeL' | 'kneeR' | 'ankleL' | 'ankleR'
    | 'qhead' | 'qneck' | 'qback' | 'qrump';   // quadruped
  pos?: [number, number, number];   // mm offset from anchor (body-local, -Z front)
  rot?: [number, number, number];   // radians
  color: number | 'tint' | 'skin' | 'body' | 'dark' | 'accent';
  emissive?: number; emissiveIntensity?: number;
  metalness?: number; roughness?: number;
  outlineSkip?: boolean;
  // Sphere-section support for hoods / hair / shells:
  // [phiStart, phiLength, thetaStart, thetaLength].
  sphereArc?: [number, number, number, number];
  // ── Phase 4b: per-frame animation channel (animated appendages) ────────────
  // Registers this primitive for per-frame motion advanced in updateTargets
  // (see Humanoid.animPrims + _advanceAnimPrims). The base transform is captured
  // ONCE at build (zero per-frame allocation); the channel oscillates about it.
  //   sway  — rotation.x sinusoid about the base rot, `amp` rad at `speed` rad/s
  //           (tentacles/antennae; per-prim `phase` offsets give independence).
  //   flap  — rotation.z |sin| beat about the base rot; mirrored wings author
  //           +amp (L) / −amp (R); flap speed DOUBLES while the rig walks (flight).
  //   orbit — position circles the base position in the horizontal (x/z) plane,
  //           radius `amp` mm (scaled by sk), angular speed `speed` rad/s (drones).
  //   spin  — continuous rotation.y about the base at `speed` rad/s (propeller/halo).
  // Defaults: speed 2 rad/s; amp = sway 0.3 rad / flap 0.6 rad / orbit 60 mm
  // (spin ignores amp); phase 0.
  animate?: { kind: 'sway' | 'flap' | 'orbit' | 'spin'; speed?: number; amp?: number; phase?: number };
}

// Deterministic coat/skin pattern generator (Phase 4a). A handful of PROUD
// primitives (the zebra/cow idiom) scattered from a seeded PRNG — NEVER
// Math.random, so a given (seed ?? id-hash) always yields identical placement.
// Applied to the humanoid torso or the quadruped body. Supersedes hand-authored
// stripe lists for FUTURE packs; existing hand-placed packs are left untouched.
//   stripes — vertical thin boxes alternating flanks
//   spots   — irregular flat discs scattered on back / flanks
//   dapples — smaller lighter discs clustered on the top side
// `count` is capped by the builder to stay inside the ≤~14-primitive budget.
export interface AvatarPattern {
  kind: 'stripes' | 'spots' | 'dapples';
  color: number;        // hex — the stripe / spot / dapple color
  count?: number;       // primitive count (builder-capped; default per kind)
  seed?: number;        // PRNG seed; absent → hashed from the avatar id
}

// Humanoid rig spec — mirrors the old SPECS row. Colors accept 'tint' (resolves
// to the passed-in identity color at build, exactly like the old `skin: color`).
export interface HumanoidFields {
  // sk = overall skeleton-length scale. CLAMPED at build to [0.45, 1.2] — small
  // avatars (child ~0.65) pass, but oversized values are capped so heights stay
  // subtle (a global belt against pack-data excess). Extremely small PETS use the
  // quadruped rig, whose sk floor is lower (0.2) — see QuadrupedFields.sk.
  sk?: number; headR?: number; headShape?: 'sphere' | 'box' | 'cylinder' | 'oval'; limbR?: number;
  skin?: number | 'tint'; body?: number | 'tint'; shoe?: number; emI?: number;
  hands?: 'sphere' | 'box';
  // Eye style. Phase 4a added compound (insect facets) / t_visor (Mandalorian
  // vertical+horizontal dark T slot) / sleepy (half-lidded) / luminous (big
  // glowing orbs, outline-skipped).
  eyes?: 'dots' | 'visor' | 'almond' | 'redvisor' | 'shades' | 'slit' | 'halfred' | 'none'
    | 'compound' | 't_visor' | 'sleepy' | 'luminous';
  // Iris color override (Phase 4a): tints the generic 'dots'/'sleepy' iris, and
  // the glow of 'luminous' orbs / 't_visor' & 'visor'/'redvisor' slots. Absent →
  // the per-style default (dark iris, cyan/red visor glow).
  eyeColor?: number;
  steel?: boolean; armL?: number; legL?: number;
  footMul?: [number, number, number]; legColor?: number;
  earSkip?: boolean;                // replaces the old EAR_SKIP set membership
  // ── Batch C1 rig extensions ────────────────────────────────────────────────
  noFace?: boolean;                 // skip nose + mouth + brows (eyes still per `eyes`)
  opacity?: number;                 // 0..1 → transparent skin + body materials (ghosts)
  hover?: number;                   // mm: omit BOTH legs, float the root so the hip
                                    //   sits `hover` mm off the floor, gentle idle bob
  // Per-limb material overrides (cyborg steel-limb pattern generalized). Recolors
  // BOTH segments of that limb (upper + lower) — NOT the hand / shoe.
  limbColors?: { armL?: number; armR?: number; legL?: number; legR?: number };
  // Floor-length robe/gown hint: DAMPS the leg-swing amplitude (~0.22×) during the
  // walk cycle so legs don't poke through a draping skirt (the "leg showing through
  // the gown" bug). Cheaper + cleaner than oversizing the robe geometry. The
  // wise_oracle legacy kind is force-gowned in the renderer regardless of this flag.
  gown?: boolean;
  // Deterministic proud-primitive pattern scattered on the TORSO (Phase 4a).
  pattern?: AvatarPattern;
  // ── Phase 4b: gait cycle. Absent / 'walk' = today's alternating human stride
  // (existing members are byte-identical). 'hop' = both legs swing phase-locked
  // in unison with a doubled vertical bounce + tucked arms (rabbit / frog /
  // penguin-adjacent). 'knuckle' = torso pitched forward, short alternating leg
  // steps, arms LONG-swinging to floor contact (gorilla knuckle-walk). Both are
  // GAITS — reshaped only while walking; a standing hopper reads as a normal idle.
  gait?: 'walk' | 'hop' | 'knuckle';
}

// Quadruped rig spec — parameterizes _buildQuadruped. Defaults reproduce today's
// dog (beagle, ~505 mm shoulder pivot); the cat overrides sk + ears/tail/snout.
export interface QuadrupedFields {
  // 1.0 = beagle 520 mm shoulder. CLAMPED at build to [0.2, 1.2] — the low floor
  // (0.2) keeps the extremely small pets (hamster / guinea pig) tiny, while the
  // upper cap (lowered 1.35→1.2 in the 2nd animal-size pass) keeps large animals
  // from exaggerating. Cat resolves to 0.58.
  sk?: number;
  bodyLen?: number; bodyW?: number; bodyH?: number;   // mm at sk=1 (defaults 640/200/240)
  legLen?: number;                  // upper+lower leg length mult (default 1)
  headR?: number; neckLen?: number; // neckLen>0 inserts an angled neck (giraffe/horse)
  headScale?: [number, number, number];   // head ellipsoid scale (dog = [1,0.95,1.05])
  // Ear style. Phase 4a added 'flap' — giant flat elephant-style ear plates.
  ears?: 'pointy' | 'floppy' | 'round' | 'long' | 'flap' | 'none';
  tail?: 'up' | 'down' | 'curl' | 'tuft' | 'none'; tailLen?: number;
  snout?: number;                   // snout length mult (0 = flat face)
  // Snout SHAPE (Phase 4a): 'cone' (default — the tapered dog/cat muzzle box) or
  // 'broad' (a wide flat muzzle box — hippo / moose / cow).
  snoutShape?: 'cone' | 'broad';
  coat?: number | 'tint'; belly?: number; earColor?: number; snoutColor?: number;
  // ── Batch C1 rig extensions ────────────────────────────────────────────────
  pawColor?: number;                // overrides the default dark paw tone (0x2a2a2e)
  tailTipColor?: number;            // tail tip segment / tuft material
  opacity?: number;                 // 0..1 → transparent coat (ghostly pets)
  // ── Phase 4a rig extensions ────────────────────────────────────────────────
  // Recolors ALL FOUR legs (both upper + lower segments) — the dark-"points"
  // gap. Feet stay pawColor. Absent → legs inherit the coat, as today.
  legColor?: number;
  // Quad eye style (Phase 4a): 'dot' (default — the round dark eye), 'oval'
  // (vertically-scaled almond) or 'sleepy' (upper lid). `eyeColor` overrides the
  // default dark iris.
  eyes?: 'dot' | 'oval' | 'sleepy';
  eyeColor?: number;
  // Deterministic proud-primitive pattern scattered on the BODY (Phase 4a).
  pattern?: AvatarPattern;
  // ── Phase 4b: ear posing. Absent / 'flick' = today's occasional idle ear
  // flick (a short synchronized x-pulse). 'swivel' adds a slow INDEPENDENT yaw
  // wander per ear (rotation.y drifts, desynced per ear). 'none' holds ears still.
  earAnimate?: 'flick' | 'swivel' | 'none';
}

export interface AvatarDef {
  id: AvatarId; label: string;
  rig: 'humanoid' | 'quadruped';
  humanoid?: HumanoidFields; quadruped?: QuadrupedFields;
  accessories?: AvatarPrimitive[];
  legacyAccessories?: LegacyAvatarKind;   // route to _addAvatarAccessories(kind)
  personality?: { bobMul?: number; swayMul?: number; cadenceMul?: number; ampMul?: number };
  bubbles?: string[];
  pet?: boolean;   // excluded from the bare-'random' human fallback pool
  // Static root-pitch bias (rad) folded into the speed-proportional lean (elder
  // stoop, hunched creatures) — applies to BOTH rigs (Batch C1). Convention:
  // POSITIVE pitch = FORWARD stoop (the renderer negates it at the rotation.x
  // write, since negative root rotation.x is the body-forward lean). Elder /
  // gollum / zombie use small positive values.
  posture?: { pitch?: number };
  // Sessile / rooted mode (Phase 4a): the rig builds LEGLESS but grounded (root
  // at the floor, no leg joints, no gait) — a plant / coral / totem whose base is
  // a trunk/tuft supplied via normal accessories. In updateTargets the rig stays
  // pinned at its target position (navigation / facing / gait all skipped; idle
  // sway only). Allowed on humanoid OR pet rigs.
  sessile?: true;
}

export interface AvatarPackDef {
  id: string;                // 'core', 'base-careers', 'star-trek-tng', …
  version: number;
  label: string;
  path: string[];            // hierarchy, e.g. ['Sci-Fi','Star Trek','Next Generation']
  base?: Partial<AvatarDef>; // spread under every member (shared body, chibi packs)
  avatars: AvatarDef[];
  builtin?: boolean;         // shipped in the app bundle (vs user-imported)
  locked?: boolean;          // core only: cannot unload/deactivate
  franchise?: boolean;       // opt-in novelty pack: defaults loaded:false
}

// Persisted per-pack config (mirrors the identical shape in types.ts / Store).
export interface AvatarPackConfig { loaded?: boolean; active?: boolean; members?: string[] }
export type AvatarPacksConfig = Record<string, AvatarPackConfig>;

// A registered pack + provenance.
export interface PackEntry { def: AvatarPackDef; source: 'builtin' | 'user' }

// ── CORE pack data ─────────────────────────────────────────────────────────
// Batch C1 correction: core shrinks to `adult` ONLY — the irremovable default.
// The other 23 legacy kinds moved (verbatim, keeping their bare ids) into the
// builtin base-group packs under src/avatar-packs/ (dynamic-imported by the
// planner; default loaded+active so out-of-the-box behavior is unchanged). A
// standalone/stale renderer chunk that never got a registry still resolves
// every id through this bundled core → adult fallback.

const CORE_AVATARS: AvatarDef[] = [
  { id: 'adult', label: 'Adult', rig: 'humanoid', legacyAccessories: 'adult',
    humanoid: {}, bubbles: ['💭'] },
];

export const CORE_PACK: AvatarPackDef = {
  id: 'core', version: 1, label: 'Core', path: [], builtin: true, locked: true,
  avatars: CORE_AVATARS,
};

// ── Registry singleton ─────────────────────────────────────────────────────

const _packs = new Map<string, PackEntry>();
let _config: AvatarPacksConfig | undefined;
let _activeCache: Set<AvatarId> | null = null;
let _defCache: Map<AvatarId, AvatarDef> | null = null;
let _fallbackCache: AvatarId[] | null = null;

// Merge a pack's `base` under each member (base spread; member wins).
function materializeMembers(def: AvatarPackDef): AvatarDef[] {
  if (!def.base) return def.avatars;
  const base = def.base;
  return def.avatars.map(a => ({
    ...base, ...a,
    id: a.id, rig: a.rig ?? base.rig ?? 'humanoid',
    humanoid: { ...(base.humanoid ?? {}), ...(a.humanoid ?? {}) },
    quadruped: (base.quadruped || a.quadruped)
      ? { ...(base.quadruped ?? {}), ...(a.quadruped ?? {}) } : undefined,
    accessories: a.accessories ?? base.accessories,
  } as AvatarDef));
}

function _invalidate(): void { _activeCache = null; _defCache = null; _fallbackCache = null; }

export function registerPack(def: AvatarPackDef, source: 'builtin' | 'user' = 'builtin'): void {
  const existing = _packs.get(def.id);
  // Idempotent by id+version — a re-register at the same version is a no-op.
  if (existing && existing.def.version === def.version && existing.source === source) return;
  _packs.set(def.id, { def, source });
  _invalidate();
}

export function unregisterPack(id: string): void {
  if (id === 'core') return;   // core is irremovable
  if (_packs.delete(id)) _invalidate();
}

export function getPack(id: string): PackEntry | undefined { return _packs.get(id); }

export function listPacks(): PackEntry[] {
  // Core first, then by path depth/label for a stable tree order.
  return [..._packs.values()].sort((a, b) => {
    if (a.def.id === 'core') return -1;
    if (b.def.id === 'core') return 1;
    return a.def.path.join('/').localeCompare(b.def.path.join('/'))
      || a.def.label.localeCompare(b.def.label);
  });
}

// Effective loaded/active for a pack given the config + pack defaults.
//   core (locked)            → always loaded + active
//   builtin base pack        → default loaded + active
//   franchise / user pack    → default loaded:false
function packState(def: AvatarPackDef, cfg?: AvatarPackConfig): { loaded: boolean; active: boolean } {
  if (def.id === 'core' || def.locked) return { loaded: true, active: true };
  const defaultLoaded = !!def.builtin && !def.franchise;
  const loaded = cfg?.loaded ?? defaultLoaded;
  const active = loaded && (cfg?.active ?? true);
  return { loaded, active };
}

// Public wrapper over the internal packState — the settings pack-manager UI
// reads a pack's effective loaded/active (config value OR the pack default) to
// drive the Loaded/Active checkbox states.
export function packEffectiveState(
  def: AvatarPackDef, cfg: AvatarPacksConfig | undefined = _config,
): { loaded: boolean; active: boolean } {
  return packState(def, cfg?.[def.id]);
}

export function setAvatarPacksConfig(cfg: AvatarPacksConfig | undefined): void {
  _config = cfg;
  _invalidate();
}
export function getAvatarPacksConfig(): AvatarPacksConfig | undefined { return _config; }

// Flat list of every avatar id that is currently active (loaded+active pack,
// respecting the `members` subset). Cached until the registry or config changes.
export function activeAvatarIds(cfg: AvatarPacksConfig | undefined = _config): AvatarId[] {
  // The common case reads the module snapshot → use the cache. A caller passing
  // an explicit cfg bypasses the cache (test / preview use).
  if (cfg === _config && _activeCache) return [..._activeCache];
  const out: AvatarId[] = [];
  for (const { def } of listPacks()) {
    const st = packState(def, cfg?.[def.id]);
    if (!st.loaded || !st.active) continue;
    const members = cfg?.[def.id]?.members;
    const memberSet = members ? new Set(members) : null;
    for (const a of def.avatars) {
      if (memberSet && !memberSet.has(a.id)) continue;
      out.push(a.id);
    }
  }
  if (cfg === _config) _activeCache = new Set(out);
  return out;
}

// Loaded+active packs with their currently-active members (respecting the
// `members` subset). Drives the sidebar avatar grid + person select (core first,
// then by path). Members already gated here → what the UI shows == what
// resolveAvatar will accept.
export function listActivePacks(
  cfg: AvatarPacksConfig | undefined = _config,
): { def: AvatarPackDef; members: AvatarDef[] }[] {
  const out: { def: AvatarPackDef; members: AvatarDef[] }[] = [];
  for (const { def } of listPacks()) {
    const st = packState(def, cfg?.[def.id]);
    if (!st.loaded || !st.active) continue;
    const sub = cfg?.[def.id]?.members;
    const set = sub ? new Set(sub) : null;
    const members = def.avatars.filter(a => !set || set.has(a.id));
    if (members.length) out.push({ def, members });
  }
  return out;
}

function _activeSet(): Set<AvatarId> {
  if (!_activeCache) activeAvatarIds();
  return _activeCache ?? new Set();
}

function _defMap(): Map<AvatarId, AvatarDef> {
  if (_defCache) return _defCache;
  const m = new Map<AvatarId, AvatarDef>();
  // Later packs win on id collision; core registered first via listPacks order.
  for (const { def } of listPacks()) {
    for (const a of materializeMembers(def)) m.set(a.id, a);
  }
  _defCache = m;
  return m;
}

// Resolve an avatar id to its def. Unknown → core 'adult' (never throws).
export function resolveDef(id: AvatarId): AvatarDef {
  return _defMap().get(id) ?? _defMap().get('adult') ?? CORE_AVATARS[0];
}

// The bare-'random' / unknown fallback pool (Batch C1): the union of every
// ACTIVE humanoid, non-pet avatar drawn from builtin, NON-franchise packs
// (core + the base-group packs), in listPacks order (core's `adult` first).
// Franchise members are excluded so an unidentified stranger never surprises as
// a franchise character. Computed against the CURRENT config snapshot (so a
// deactivated base pack drops out) and cached until the registry/config change.
// Degrades to ['adult'] when everything eligible is unloaded/deactivated — core
// is locked so 'adult' is always resolvable.
function fallbackPool(): AvatarId[] {
  if (_fallbackCache) return _fallbackCache;
  const active = _activeSet();
  const out: AvatarId[] = [];
  for (const { def, source } of listPacks()) {
    if (source !== 'builtin' || def.franchise) continue;
    for (const a of def.avatars) {
      if (a.rig === 'humanoid' && !a.pet && active.has(a.id)) out.push(a.id);
    }
  }
  _fallbackCache = out.length ? out : ['adult'];
  return _fallbackCache;
}

function isActiveId(id: AvatarId): boolean { return _activeSet().has(id); }

// djb2 hash of a string → unsigned 32-bit. Maps a target key to a stable
// concrete avatar when the sensor requests 'random'.
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

// Resolve a requested avatar into a concrete id. Precedence:
//   1. `list` (avatarKinds pool) with ≥1 ACTIVE id → pick from it.
//   2. legacy single `want`: an ACTIVE concrete id passes through; 'random' (or
//      any inactive/unknown id) picks over the fallback pool.
//   3. nothing → 'adult'.
// Pool / 'random' picks are STABLE (djb2(key)) by default. Pass `rng`
// (Math.random) to pick RANDOMLY — used only on a FRESH spawn so respawns
// re-roll. Single-element pools and concrete ids are deterministic regardless.
export function resolveAvatar(
  want: AvatarId | 'random' | undefined,
  list: AvatarId[] | undefined, key: string,
  rng?: () => number,
): AvatarId {
  const pick = (n: number) => rng ? (Math.floor(rng() * n) % n + n) % n : djb2(key) % n;
  if (list && list.length) {
    const valid = list.filter(isActiveId);
    if (valid.length === 1) return valid[0];
    if (valid.length) return valid[pick(valid.length)];
  }
  if (!want) return 'adult';
  if (want !== 'random' && isActiveId(want)) return want;
  const pool = fallbackPool();
  return pool[pick(pool.length)];
}

// Whether resolveAvatar's pick for this spec is NON-deterministic (a pool of ≥2
// active ids, or 'random'/inactive over the fallback pool). Only these re-roll
// on a fresh spawn AND are exempt from the kind-mismatch rebuild.
export function avatarFromPool(
  want: AvatarId | 'random' | undefined,
  list: AvatarId[] | undefined,
): boolean {
  if (list && list.length) {
    const valid = list.filter(isActiveId);
    if (valid.length === 1) return false;
    if (valid.length) return true;
  }
  if (!want) return false;
  // Concrete, active id → deterministic passthrough (no re-roll). Otherwise the
  // pick is over the fallback pool: pool-eligible (re-rollable) only when that
  // pool has ≥2 members (a lone ['adult'] floor resolves deterministically).
  if (want !== 'random' && isActiveId(want)) return false;
  return fallbackPool().length >= 2;
}

// Register the core pack immediately so a standalone renderer chunk (no planner
// hydration) still resolves adult / cat / dog through its own bundled data.
registerPack(CORE_PACK, 'builtin');
