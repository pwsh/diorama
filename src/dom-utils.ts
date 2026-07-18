// Tiny, dependency-free DOM helpers. Kept isolated so test harnesses can bundle
// just this file (no Lit / renderer pull-in).

// True when a keyboard event should be ignored because it targets a form
// control or editable content (sidebar <select>s, the entity-picker search box,
// textareas, contenteditable). Canvas hotkeys (tool picks, Delete, undo/redo)
// guard on this so typing 'm' in a dropdown never switches tools, and Delete /
// Ctrl+Z while editing an input never reaches the canvas.
export function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ||
                  el.tagName === 'SELECT' || el.isContentEditable === true);
}
