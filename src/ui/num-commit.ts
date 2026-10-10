// Commit-on-change support for typed numeric fields (sidebar + settings drawer).
//
// WHY THIS EXISTS. Numeric `<input type="number">` editors used to commit on
// EVERY `input` event: the handler clamped / rounded the half-typed text, called
// save(), and the config re-render wrote the clamped value straight back into the
// field while the user was still typing — "600" became 50 → 500 → 5000, a
// rotation of 45 was untypable ("4" rounds to 0), and every keystroke was its own
// undo step. Numeric fields now commit on `change` (Enter, blur, spinner click).
// Because nothing mutates the model while the user types, Lit never rewrites the
// field mid-edit (a property binding only writes when the RENDERED value changes).
//
// Two gaps remain, and this module closes both generically. Every numeric field
// carries `data-model=${sameExpr}` next to `.value=${sameExpr}` — an attribute
// the user cannot edit, so it always holds what the model currently renders:
//
//  1. STALE TEXT AFTER A CLAMP. If the committed value normalizes to what was
//     already rendered (width is 50, user types 30 → clamped back to 50), the
//     rendered string does not change, Lit does not touch the input, and the
//     field keeps showing "30". After the owning component's update settles we
//     re-sync the field to `data-model`. (Also reverts text a handler ignored.)
//
//  2. A PENDING EDIT CUT SHORT BY A CANVAS PRESS. The 2D canvas preventDefault()s
//     its drag-starting mousedowns, so the focused field is NOT blurred — and a
//     canvas selection change can remove the editor (or retarget its handlers to a
//     different item) before any `change` fires. A capture-phase pointerdown
//     anywhere outside a field that has a pending edit (text ≠ data-model) blurs
//     it first, so the native `change` commits to the item the user was editing.
//
// Installed once per document (idempotent); both listeners are cheap no-ops for
// anything that isn't a numeric field carrying `data-model`.

type Updatable = HTMLElement & { updateComplete?: Promise<unknown> };

function isModelNumber(t: EventTarget | null): t is HTMLInputElement {
  return t instanceof HTMLInputElement && t.type === 'number' && t.hasAttribute('data-model');
}

/** Text in the field differs from what the model renders → an uncommitted edit. */
export function hasPendingEdit(el: HTMLInputElement): boolean {
  return el.value !== (el.getAttribute('data-model') ?? '');
}

function owningHost(el: HTMLElement): Updatable | null {
  for (let n: HTMLElement | null = el.parentElement; n; n = n.parentElement) {
    if ((n as Updatable).updateComplete instanceof Promise) return n as Updatable;
  }
  return null;
}

let installed = false;

export function installNumCommit(doc: Document = document): void {
  if (installed) return;
  installed = true;
  // BUBBLE phase on purpose: the field's own @change handler (bound on the
  // element) must run first. A capture listener would let the microtask
  // checkpoint run our re-sync BEFORE the handler read the typed value.
  doc.addEventListener('change', e => {
    const el = e.target;
    if (!isModelNumber(el)) return;
    const host = owningHost(el);
    const settle = host?.updateComplete ?? Promise.resolve();
    void settle.then(() => {
      if (!el.isConnected) return;
      const model = el.getAttribute('data-model') ?? '';
      if (el.value !== model) el.value = model;
    });
  });
  doc.addEventListener('pointerdown', e => {
    const a = doc.activeElement;
    if (!isModelNumber(a) || e.target === a) return;
    if (hasPendingEdit(a)) a.blur();   // native change → commits to the right item
  }, true);
}
