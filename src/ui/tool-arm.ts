// Visual-toolbar model + arming helpers.
//
// PURE (no Lit, no three.js) so the toolbar-test harness can bundle it with a
// plain esbuild pass and drive the real Planner headlessly. The toolbar
// (`toolbar.ts`) is a thin visual FRONT-END: every card arms EXACTLY the tool
// state the sidebar tool buttons arm today (`setTool` + the `pending*` kinds +
// the room/landmark latches) — no new placement semantics, just a nicer picker.
import type { Planner, Tool } from '../planner.js';
import { NEW_ROOM, NEW_LANDMARK } from '../planner.js';
import type {
  FurnitureKind, LightIconKind, WallKind, WindowKind, GroundKind, ObjectRecipe,
} from '../types.js';
import { FURNITURE_KINDS, furnitureCat, type FurnitureCat, GROUND_KINDS } from '../geometry.js';
import { listActiveVehiclePacks } from '../vehicles.js';

type DoorKind = 'swing' | 'garage' | 'gate'
  | 'sliding' | 'pocket' | 'double' | 'french' | 'sliding_glass';

// What the thumbnail service should render / how to key its cache.
export type ThumbDesc =
  | { type: 'furniture'; kind: FurnitureKind }
  | { type: 'light'; kind: LightIconKind }
  | { type: 'custom'; id: string; hash: string }
  | { type: 'vehicle'; id: string; ver: string }
  | { type: 'glyph'; glyph: string };

export interface VariantChip {
  key: string;
  label: string;
  arm(p: Planner): void;
  isArmed(p: Planner): boolean;
}

export interface ToolCard {
  key: string;
  label: string;
  glyph: string;            // 2D fallback / placeholder glyph
  thumb: ThumbDesc;
  tool?: Tool;              // the placement tool this card represents (mapping introspection)
  arm(p: Planner): void;
  isArmed(p: Planner): boolean;
  variants?: VariantChip[]; // shown above the card strip while this card is armed
}

export interface ToolCategory {
  id: string;
  label: string;
  glyph: string;
  cards: ToolCard[];
}

// ── Arming primitives (the toolbar + tests call these) ─────────────────────────
export function armTool(p: Planner, t: Tool): void {
  p.setTool(t);                      // setTool() emits config
  p.maybeCloseSidebarForPlacement();
}
export function armFurniture(p: Planner, kind: FurnitureKind): void {
  p.pendingFurnitureKind = kind;
  p.pendingCustomObjectId = null;
  p.pendingVehicleModelId = null;
  armTool(p, 'furniture');
}
export function armCustom(p: Planner, id: string): void {
  p.pendingCustomObjectId = id;
  p.pendingVehicleModelId = null;
  armTool(p, 'furniture');
}
// Arm a vehicle-pack model. Mirrors armCustom exactly — the drop path resolves
// the model into the same ObjectRecipe shape a custom object uses.
export function armVehicle(p: Planner, id: string): void {
  p.pendingVehicleModelId = id;
  p.pendingCustomObjectId = null;
  armTool(p, 'furniture');
}
export function armLight(p: Planner, kind: LightIconKind): void {
  p.pendingLightKind = kind;
  armTool(p, 'light');
}
export function armWall(p: Planner, kind: WallKind): void {
  p.pendingWallKind = kind;
  armTool(p, 'wall');
}
export function armDoor(p: Planner, kind: DoorKind): void {
  p.pendingDoorKind = kind;
  armTool(p, 'door');
}
export function armWindow(p: Planner, kind: WindowKind): void {
  p.pendingWindowKind = kind;
  armTool(p, 'window');
}
export function armGround(p: Planner, kind: GroundKind): void {
  p.pendingGroundKind = kind;
  armTool(p, 'ground');
}
export function armPool(p: Planner, kind: 'pool' | 'spa'): void {
  armTool(p, 'pool');
  p.drawingPoolArea = { points: [], kind };
  p.emitConfig();
}
// Room / landmark are latch placements (no Tool) — mirror the sidebar exactly
// (it does NOT change the current tool; the next canvas click drops the anchor).
export function armRoom(p: Planner): void {
  p.placingRoomId = NEW_ROOM;
  p.maybeCloseSidebarForPlacement();
  p.emitConfig();
}
export function armLandmark(p: Planner): void {
  p.placingLandmarkId = NEW_LANDMARK;
  p.maybeCloseSidebarForPlacement();
  p.emitConfig();
}

// ── Static option tables ───────────────────────────────────────────────────────
const LIGHT_KINDS: { id: LightIconKind; label: string; glyph: string }[] = [
  { id: 'bulb', label: 'Bulb', glyph: '💡' }, { id: 'spot', label: 'Spot', glyph: '🔦' },
  { id: 'pendant', label: 'Pendant', glyph: '⚪' }, { id: 'sconce', label: 'Sconce', glyph: '◐' },
  { id: 'strip', label: 'Strip', glyph: '▬' }, { id: 'fireplace', label: 'Fireplace', glyph: '🔥' },
  { id: 'lamp', label: 'Lamp', glyph: '🪔' }, { id: 'bowl', label: 'Bowl', glyph: '🥣' },
  { id: 'tiered', label: 'Tiered', glyph: '☰' }, { id: 'round', label: 'Round', glyph: '⭕' },
  { id: 'recessed', label: 'Recessed', glyph: '⊙' }, { id: 'jar', label: 'Jar', glyph: '🫙' },
  { id: 'oval', label: 'Oval', glyph: '🥚' }, { id: 'fan', label: 'Ceiling fan', glyph: '❋' },
  { id: 'fan_light', label: 'Fan + light', glyph: '✺' }, { id: 'string', label: 'LED string', glyph: '✨' },
  { id: 'under_cabinet', label: 'Under-cabinet', glyph: '▂' }, { id: 'wall_sconce', label: 'Wall sconce', glyph: '◨' },
  { id: 'step', label: 'Step light', glyph: '▤' }, { id: 'flood', label: 'Floodlight', glyph: '🔆' },
  { id: 'inground', label: 'In-ground uplight', glyph: '⤒' }, { id: 'ground_spot', label: 'Ground spot', glyph: '⟰' },
  { id: 'heatlamp', label: 'Heat lamp', glyph: '♨' }, { id: 'exhaust', label: 'Exhaust (ceiling)', glyph: '❊' },
  { id: 'exhaust_wall', label: 'Exhaust (wall)', glyph: '⊛' }, { id: 'exhaust_light', label: 'Exhaust + light', glyph: '❈' },
  { id: 'firepit_round', label: 'Fire pit (round)', glyph: '◉' },
  { id: 'firepit_square', label: 'Fire pit (square)', glyph: '▣' },
];

const WALL_KINDS: { id: WallKind; label: string }[] = [
  { id: 'full', label: 'Full' }, { id: 'half', label: 'Half' }, { id: 'railing', label: 'Railing' },
  { id: 'invisible', label: 'Invisible' }, { id: 'fence_picket', label: 'Picket' },
  { id: 'fence_privacy', label: 'Privacy' }, { id: 'fence_chainlink', label: 'Chain-link' },
  { id: 'hedge', label: 'Hedge' },
];
const DOOR_KINDS: { id: DoorKind; label: string }[] = [
  { id: 'swing', label: 'Swing' }, { id: 'garage', label: 'Garage' }, { id: 'gate', label: 'Gate' },
  { id: 'sliding', label: 'Sliding' }, { id: 'pocket', label: 'Pocket' },
  { id: 'double', label: 'Double swing' }, { id: 'french', label: 'French' },
  { id: 'sliding_glass', label: 'Sliding glass' },
];
const WINDOW_KINDS: { id: WindowKind; label: string }[] = [
  { id: 'single', label: 'Single' }, { id: 'double_hung', label: 'Double-hung' },
  { id: 'casement_pair', label: 'Casement' }, { id: 'sliding', label: 'Sliding' },
  { id: 'picture', label: 'Picture' },
  { id: 'bay', label: 'Bay' }, { id: 'bay_bench', label: 'Bay + seat' },
];

// TOOLS fixture list → the "Controls & Sensors" tab. (mmWave/motion/env/... —
// flagpole lives in Outdoor, pzone/void in Structure, ground/path/pool in Ground.)
const CONTROL_TOOLS: { tool: Tool; label: string; glyph: string }[] = [
  { tool: 'sensor', label: 'mmWave', glyph: '📡' }, { tool: 'motion', label: 'Motion', glyph: '🚶' },
  { tool: 'env', label: 'Env', glyph: '🌡' }, { tool: 'infocard', label: 'Info card', glyph: '🔢' },
  { tool: 'action', label: 'Action', glyph: '🔘' }, { tool: 'bleproxy', label: 'BLE proxy', glyph: '📶' },
  { tool: 'alarm', label: 'Alarm', glyph: '🚨' }, { tool: 'calendar', label: 'Calendar', glyph: '📅' },
  { tool: 'thermostat', label: 'Thermostat', glyph: '🌡' }, { tool: 'safety', label: 'Safety/Siren', glyph: '⚠️' },
  { tool: 'alertbeacon', label: 'Alert beacon', glyph: '🔔' }, { tool: 'robot', label: 'Robot', glyph: '🤖' },
  { tool: 'camera', label: 'Camera', glyph: '📷' }, { tool: 'projector', label: 'Projector', glyph: '📽' },
  { tool: 'valve', label: 'Valve', glyph: '🚰' }, { tool: 'sprinkler', label: 'Sprinkler', glyph: '🚿' },
  { tool: 'plug', label: 'Plug', glyph: '🔌' }, { tool: 'switch', label: 'Switch', glyph: '🎛' },
  { tool: 'solar', label: 'Solar panel', glyph: '☀️' },
];

// Category glyph fallbacks per furniture cat (placeholder while the 3D thumb
// renders / when WebGL is unavailable).
const CAT_GLYPH: Record<FurnitureCat, string> = {
  furniture: '🛋',
  seating: '🪑', tables: '🍽️', bedroom: '🛏', storage: '🗄', stairs: '🪜', decor: '🪴',
  appliance: '🔌', bathroom: '🛁', outdoor: '🌳', theater: '🎬', vehicle: '🚗',
};

// djb2 hash of a recipe's JSON — the custom-object thumbnail cache key changes
// whenever the recipe (label / dims / primitives) is edited.
export function hashRecipe(o: ObjectRecipe): string {
  const s = JSON.stringify(o);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// ── Card builders ──────────────────────────────────────────────────────────────
function furnitureCards(cat: FurnitureCat): ToolCard[] {
  const kinds = (Object.keys(FURNITURE_KINDS) as FurnitureKind[])
    .filter(k => furnitureCat(FURNITURE_KINDS[k]) === cat);
  return kinds.map(kind => ({
    key: `furn:${kind}`,
    label: FURNITURE_KINDS[kind].label,
    glyph: CAT_GLYPH[cat],
    thumb: { type: 'furniture', kind } as ThumbDesc,
    tool: 'furniture' as Tool,
    arm: (p: Planner) => armFurniture(p, kind),
    isArmed: (p: Planner) =>
      p.tool === 'furniture' && p.pendingCustomObjectId == null
      && p.pendingVehicleModelId == null && p.pendingFurnitureKind === kind,
  }));
}

function lightCards(): ToolCard[] {
  return LIGHT_KINDS.map(lk => ({
    key: `light:${lk.id}`,
    label: lk.label,
    glyph: lk.glyph,
    thumb: { type: 'light', kind: lk.id } as ThumbDesc,
    tool: 'light' as Tool,
    arm: (p: Planner) => armLight(p, lk.id),
    isArmed: (p: Planner) => p.tool === 'light' && (p.pendingLightKind ?? 'bulb') === lk.id,
  }));
}

function controlCard(t: { tool: Tool; label: string; glyph: string }): ToolCard {
  return {
    key: `tool:${t.tool}`,
    label: t.label,
    glyph: t.glyph,
    thumb: { type: 'glyph', glyph: t.glyph },
    tool: t.tool,
    arm: (p: Planner) => armTool(p, t.tool),
    isArmed: (p: Planner) => p.tool === t.tool,
  };
}

function structureCards(): ToolCard[] {
  const wall: ToolCard = {
    key: 'struct:wall', label: 'Wall', glyph: '🧱', thumb: { type: 'glyph', glyph: '🧱' }, tool: 'wall',
    arm: (p) => armWall(p, p.pendingWallKind ?? 'full'),
    isArmed: (p) => p.tool === 'wall',
    variants: WALL_KINDS.map(w => ({
      key: `wall:${w.id}`, label: w.label,
      arm: (p: Planner) => armWall(p, w.id),
      isArmed: (p: Planner) => (p.pendingWallKind ?? 'full') === w.id,
    })),
  };
  const door: ToolCard = {
    key: 'struct:door', label: 'Door', glyph: '🚪', thumb: { type: 'glyph', glyph: '🚪' }, tool: 'door',
    arm: (p) => armDoor(p, p.pendingDoorKind ?? 'swing'),
    isArmed: (p) => p.tool === 'door',
    variants: DOOR_KINDS.map(d => ({
      key: `door:${d.id}`, label: d.label,
      arm: (p: Planner) => armDoor(p, d.id),
      isArmed: (p: Planner) => (p.pendingDoorKind ?? 'swing') === d.id,
    })),
  };
  const win: ToolCard = {
    key: 'struct:window', label: 'Window', glyph: '🪟', thumb: { type: 'glyph', glyph: '🪟' }, tool: 'window',
    arm: (p) => armWindow(p, p.pendingWindowKind ?? 'single'),
    isArmed: (p) => p.tool === 'window',
    variants: WINDOW_KINDS.map(w => ({
      key: `window:${w.id}`, label: w.label,
      arm: (p: Planner) => armWindow(p, w.id),
      isArmed: (p: Planner) => (p.pendingWindowKind ?? 'single') === w.id,
    })),
  };
  const room: ToolCard = {
    key: 'struct:room', label: 'Room', glyph: '🏷', thumb: { type: 'glyph', glyph: '🏷' },
    arm: (p) => armRoom(p),
    isArmed: (p) => p.placingRoomId === NEW_ROOM,
  };
  const zone: ToolCard = controlCardLike('struct:pzone', 'Presence zone', '▱', 'pzone');
  const voidC: ToolCard = controlCardLike('struct:void', 'Floor void', '🕳', 'void');
  const ruler: ToolCard = controlCardLike('struct:ruler', 'Ruler', '📏', 'ruler');
  // The `stairs` furniture cat (flights, landing, ramp, riser platform) lives
  // HERE rather than in its own tab — they are structure, and the category
  // split would otherwise have added a sixth near-empty furniture tab.
  return [wall, door, win, room, zone, voidC, ruler, ...furnitureCards('stairs')];
}

function controlCardLike(key: string, label: string, glyph: string, tool: Tool): ToolCard {
  return {
    key, label, glyph, thumb: { type: 'glyph', glyph }, tool,
    arm: (p) => armTool(p, tool),
    isArmed: (p) => p.tool === tool,
  };
}

function groundCards(): ToolCard[] {
  const ground: ToolCard = {
    key: 'ground:area', label: 'Ground area', glyph: '▨', thumb: { type: 'glyph', glyph: '▨' }, tool: 'ground',
    arm: (p) => armGround(p, p.pendingGroundKind ?? 'grass'),
    isArmed: (p) => p.tool === 'ground',
    variants: (Object.keys(GROUND_KINDS) as GroundKind[]).map(k => ({
      key: `ground:${k}`, label: GROUND_KINDS[k].label,
      arm: (p: Planner) => armGround(p, k),
      isArmed: (p: Planner) => (p.pendingGroundKind ?? 'grass') === k,
    })),
  };
  const path = controlCardLike('ground:path', 'Path / drive', '〰', 'path');
  const pool: ToolCard = {
    key: 'ground:pool', label: 'Pool / spa', glyph: '🏊', thumb: { type: 'glyph', glyph: '🏊' }, tool: 'pool',
    arm: (p) => armPool(p, 'pool'),
    isArmed: (p) => p.tool === 'pool',
    variants: [
      { key: 'pool:pool', label: 'Pool', arm: (p: Planner) => armPool(p, 'pool'), isArmed: (p: Planner) => p.drawingPoolArea?.kind !== 'spa' },
      { key: 'pool:spa', label: 'Spa', arm: (p: Planner) => armPool(p, 'spa'), isArmed: (p: Planner) => p.drawingPoolArea?.kind === 'spa' },
    ],
  };
  const landmark: ToolCard = {
    key: 'ground:landmark', label: 'GPS landmark', glyph: '📍', thumb: { type: 'glyph', glyph: '📍' },
    arm: (p) => armLandmark(p),
    isArmed: (p) => p.placingLandmarkId === NEW_LANDMARK,
  };
  return [ground, path, pool, landmark];
}

function customCards(p: Planner): ToolCard[] {
  const recipes = p.store.customObjects ?? [];
  return recipes.map(o => ({
    key: `custom:${o.id}`,
    label: o.label,
    glyph: '🧩',
    thumb: { type: 'custom', id: o.id, hash: hashRecipe(o) } as ThumbDesc,
    tool: 'furniture' as Tool,
    arm: (pl: Planner) => armCustom(pl, o.id),
    isArmed: (pl: Planner) =>
      pl.tool === 'furniture' && pl.pendingVehicleModelId == null && pl.pendingCustomObjectId === o.id,
  }));
}

// Placeable vehicle models from every LOADED + ACTIVE vehicle pack
// (src/vehicles.ts). The gate is the declared SURFACE, not the taxonomy
// category: a craft that only tows banners has no ground placement, while the
// Space pack's surface rovers legitimately do. Empty when every pack is off —
// the single "Vehicles" tab then shows just its furniture kinds.
function vehicleCards(): ToolCard[] {
  const out: ToolCard[] = [];
  for (const { def, models } of listActiveVehiclePacks()) {
    for (const m of models) {
      if (!m.surfaces.includes('ground')) continue;
      out.push({
        key: `veh:${m.id}`,
        label: m.label,
        glyph: '🚙',
        thumb: { type: 'vehicle', id: m.id, ver: String(def.version) } as ThumbDesc,
        tool: 'furniture' as Tool,
        arm: (pl: Planner) => armVehicle(pl, m.id),
        isArmed: (pl: Planner) => pl.tool === 'furniture' && pl.pendingVehicleModelId === m.id,
      });
    }
  }
  return out;
}

// ── The model ──────────────────────────────────────────────────────────────────
export function buildToolbarModel(p: Planner): ToolCategory[] {
  return [
    // The single Furniture tab is SPLIT five ways (it had grown to 33 cards).
    // The `stairs` cat is NOT a tab of its own — those cards are appended to
    // Structure (stairs/ramps/risers ARE structure), which keeps tab growth
    // sane. The legacy `furniture` cat has no built-in members left, so it gets
    // no tab; custom objects have their own Custom tab.
    { id: 'seating', label: 'Seating', glyph: CAT_GLYPH.seating, cards: furnitureCards('seating') },
    { id: 'tables', label: 'Tables', glyph: CAT_GLYPH.tables, cards: furnitureCards('tables') },
    { id: 'bedroom', label: 'Bedroom', glyph: CAT_GLYPH.bedroom, cards: furnitureCards('bedroom') },
    { id: 'storage', label: 'Storage', glyph: CAT_GLYPH.storage, cards: furnitureCards('storage') },
    { id: 'decor', label: 'Decor', glyph: CAT_GLYPH.decor, cards: furnitureCards('decor') },
    { id: 'appliance', label: 'Appliances', glyph: '🔌', cards: furnitureCards('appliance') },
    { id: 'bathroom', label: 'Bathroom', glyph: '🛁', cards: furnitureCards('bathroom') },
    { id: 'theater', label: 'Theater', glyph: '🎬', cards: furnitureCards('theater') },
    {
      id: 'outdoor', label: 'Outdoor', glyph: '🌳',
      // Outdoor furniture kinds + the flagpole fixture (yard decor with its own tool).
      cards: [...furnitureCards('outdoor'), controlCardLike('tool:flagpole', 'Flagpole', '🚩', 'flagpole')],
    },
    // ONE Vehicles tab: the `vehicle`-cat furniture kinds (car, EV charger)
    // FIRST, then every placeable vehicle-pack model. There used to be a second
    // conditional 'vehicles' tab for the pack models — two adjacent car tabs
    // read as a bug. With no pack loaded+active this is exactly the old
    // 'vehicle' tab; the tab ID stays 'vehicle' (nothing persists it, but the
    // stable id keeps external references — tests, docs — working).
    {
      id: 'vehicle', label: 'Vehicles', glyph: '🚗',
      cards: [...furnitureCards('vehicle'), ...vehicleCards()],
    },
    { id: 'lights', label: 'Lights', glyph: '💡', cards: lightCards() },
    { id: 'controls', label: 'Controls & Sensors', glyph: '🎛', cards: CONTROL_TOOLS.map(controlCard) },
    { id: 'structure', label: 'Structure', glyph: '🧱', cards: structureCards() },
    { id: 'ground', label: 'Ground', glyph: '▨', cards: groundCards() },
    { id: 'custom', label: 'Custom', glyph: '🧩', cards: customCards(p) },
  ];
}
