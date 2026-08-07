// Rebindable canvas keyboard shortcuts (device-local).
//
// PURE + ZERO-IMPORT (the value-rules.ts / geo.ts idiom): every function takes
// what it needs, nothing here touches the DOM beyond an optional injected
// Storage, so the module transpiles standalone with
// `esbuild src/keybinds.ts --format=esm` for the test harness.
//
// WHAT IS REBINDABLE — deliberately only the PLAIN-KEY bindings (the tool
// letters/digits and Delete/Backspace on the current selection). Those are
// exactly the class that misfires when focus quietly falls back to <body>
// mid-typing, and they are the ones a user may want on different keys.
//
// WHAT IS HARD-CODED, and why (do NOT move these into the catalog):
//   • Ctrl/Cmd+Z / +Shift+Z / +Y (undo/redo) and Ctrl/Cmd+0 (reset view) —
//     universal muscle memory, and a modifier combo can never fire from typing.
//   • Escape (cancel the armed latch) and Enter (finish a polygon) — they are
//     editing-SAFE (they end a gesture, they never start one or destroy data)
//     and a user mid-draw must always be able to bail out.
//   • The Space pan-hold (read off `e.code`, not `e.key`) — a held modifier for
//     a pointer gesture, not a command.
//   • The arrow-key furniture nudge — a continuous manual adjustment, not a
//     command; it still rides the `hotkeysEnabled` master switch.
//
// The master switch (`Planner.hotkeysEnabled`, Settings ▸ Display ▸ Input)
// still kills every rebindable action at once, ABOVE this resolver.

export type KeybindAction =
  | 'tool.select' | 'tool.wall' | 'tool.sensor' | 'tool.motion'
  | 'tool.furniture' | 'tool.light' | 'tool.switch' | 'tool.delete'
  | 'tool.motionAlt'
  | 'deleteSelection' | 'deleteSelectionAlt';

export interface KeybindActionDef {
  action: KeybindAction;
  label: string;
  /** Planner `Tool` id this action arms, when it is a tool pick. */
  toolId?: string;
  /** Shipped default `KeyboardEvent.key` (already normalized). */
  defaultKey: string;
}

// Catalog order is also the UI order AND the resolution order (first match
// wins), so it must stay deterministic. The two "(alternate)" rows exist
// because the shipped defaults bind two keys to one behaviour — modelling them
// as separate actions keeps the map a clean action→key and lets a user rebind
// or disable either half independently.
export const KEYBIND_ACTIONS: readonly KeybindActionDef[] = Object.freeze([
  { action: 'tool.select',       label: 'Select tool',                   toolId: 'select',    defaultKey: '1' },
  { action: 'tool.wall',         label: 'Wall tool',                     toolId: 'wall',      defaultKey: '2' },
  { action: 'tool.sensor',       label: 'mmWave sensor tool',            toolId: 'sensor',    defaultKey: '3' },
  { action: 'tool.motion',       label: 'Motion sensor tool',            toolId: 'motion',    defaultKey: '4' },
  { action: 'tool.furniture',    label: 'Furniture tool',                toolId: 'furniture', defaultKey: '5' },
  { action: 'tool.light',        label: 'Light tool',                    toolId: 'light',     defaultKey: '6' },
  { action: 'tool.switch',       label: 'Switch tool',                   toolId: 'switch',    defaultKey: '7' },
  { action: 'tool.delete',       label: 'Delete tool',                   toolId: 'delete',    defaultKey: '8' },
  { action: 'tool.motionAlt',    label: 'Motion sensor tool (alt)',      toolId: 'motion',    defaultKey: 'm' },
  { action: 'deleteSelection',   label: 'Delete selection',              defaultKey: 'Delete' },
  { action: 'deleteSelectionAlt',label: 'Delete selection (alt)',        defaultKey: 'Backspace' },
] as const) as readonly KeybindActionDef[];

/** action → key, where an explicit `null` means DISABLED and an absent key
 *  means "use the shipped default". */
export type KeybindMap = Partial<Record<KeybindAction, string | null>>;

export const KEYBINDS_PREF = 'diorama:keybinds';

const ACTION_SET: ReadonlySet<string> =
  new Set(KEYBIND_ACTIONS.map(a => a.action));

/** Single-character keys are case-folded (Shift+M must resolve like m);
 *  named keys ('Delete', 'ArrowUp', …) keep their spelling. */
export function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}

/** Human-readable chip text for a bound key (or the disabled placeholder). */
export function keyLabel(key: string | null | undefined): string {
  if (key == null) return 'disabled';
  if (key === ' ') return 'Space';
  return key.length === 1 ? key.toUpperCase() : key;
}

/** A key press that can never be a binding on its own. */
export function isModifierKey(key: string): boolean {
  return key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta' ||
         key === 'AltGraph' || key === 'CapsLock' || key === 'OS' || key === 'Dead';
}

export function keybindDef(action: KeybindAction): KeybindActionDef | null {
  return KEYBIND_ACTIONS.find(a => a.action === action) ?? null;
}

/** The complete shipped keymap (action → key), for "Reset all" + tests. */
export function defaultKeybinds(): Record<KeybindAction, string> {
  const out = {} as Record<KeybindAction, string>;
  for (const a of KEYBIND_ACTIONS) out[a.action] = a.defaultKey;
  return out;
}

/** Effective key for one action: an explicit entry (incl. `null` = disabled)
 *  wins; absent falls back to the shipped default. */
export function resolveKeybind(action: KeybindAction, binds?: KeybindMap | null): string | null {
  if (binds && Object.prototype.hasOwnProperty.call(binds, action)) {
    const v = binds[action];
    return v == null ? null : normalizeKey(v);
  }
  return keybindDef(action)?.defaultKey ?? null;
}

/** Which action (if any) a bare key press triggers. Catalog order decides ties
 *  (a user can only create one by hand-editing localStorage). */
export function resolveKeyAction(key: string, binds?: KeybindMap | null): KeybindAction | null {
  if (!key || isModifierKey(key)) return null;
  const nk = normalizeKey(key);
  for (const a of KEYBIND_ACTIONS) {
    const eff = resolveKeybind(a.action, binds);
    if (eff !== null && eff === nk) return a.action;
  }
  return null;
}

/** The OTHER action already holding `key`, or null. Feeds the rebind UI's
 *  "already used" rejection so a capture can never create a shadowed binding. */
export function keybindConflict(action: KeybindAction, key: string,
                                binds?: KeybindMap | null): KeybindAction | null {
  const nk = normalizeKey(key);
  for (const a of KEYBIND_ACTIONS) {
    if (a.action === action) continue;
    if (resolveKeybind(a.action, binds) === nk) return a.action;
  }
  return null;
}

/** Tolerant parse: unknown actions and non-string/non-null values are dropped,
 *  garbage returns `{}` (never throws — the mqtt-ws / weather discipline). */
export function parseKeybinds(raw: string | null | undefined): KeybindMap {
  if (!raw) return {};
  let obj: unknown;
  try { obj = JSON.parse(raw); } catch { return {}; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const out: KeybindMap = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (!ACTION_SET.has(k)) continue;
    if (v === null) { out[k as KeybindAction] = null; continue; }
    if (typeof v === 'string' && v.length > 0) out[k as KeybindAction] = normalizeKey(v);
  }
  return out;
}

export function serializeKeybinds(binds: KeybindMap): string {
  const out: Record<string, string | null> = {};
  for (const a of KEYBIND_ACTIONS) {
    if (!Object.prototype.hasOwnProperty.call(binds, a.action)) continue;
    const v = binds[a.action];
    // An entry equal to the default is redundant — store nothing so a future
    // default change follows through (the `exactly-the-default → undefined`
    // idiom used across the config setters).
    if (v != null && normalizeKey(v) === a.defaultKey) continue;
    out[a.action] = v == null ? null : normalizeKey(v);
  }
  return JSON.stringify(out);
}

interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

function defaultStorage(): StorageLike | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

/** Device-local read (the `diorama:moveStep` family — never the synced Store,
 *  so keybinds cost nothing in HA sync / undo). */
export function loadKeybinds(storage?: StorageLike | null): KeybindMap {
  const st = storage === undefined ? defaultStorage() : storage;
  if (!st) return {};
  try { return parseKeybinds(st.getItem(KEYBINDS_PREF)); } catch { return {}; }
}

export function saveKeybinds(binds: KeybindMap, storage?: StorageLike | null): void {
  const st = storage === undefined ? defaultStorage() : storage;
  if (!st) return;
  try {
    const s = serializeKeybinds(binds);
    if (s === '{}') st.removeItem(KEYBINDS_PREF);
    else st.setItem(KEYBINDS_PREF, s);
  } catch { /* private-mode Safari throws */ }
}
