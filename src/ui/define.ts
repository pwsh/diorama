// Idempotent custom-element registration.
//
// Module identity includes the cache-busting ?v= query, so a browser running
// a STALE cached app.js (old ?v=) that lazily fetches the fresh 3D chunk
// (whose static imports reference app.js with the NEW ?v=) instantiates a
// second copy of this module graph. Lit's @customElement throws on the
// duplicate define — which killed the 3D view on iOS Safari, the most
// cache-stubborn browser we support. Skipping re-registration keeps the
// first (already running) definitions authoritative; the duplicate copy's
// classes simply go unused, and the mixed state heals on the next reload.
export const customElement = (tag: string) =>
  (cls: CustomElementConstructor): void => {
    if (!customElements.get(tag)) customElements.define(tag, cls);
  };
