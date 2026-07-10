// Home Assistant native panel entry (panel_custom). HA loads this module and
// instantiates <diorama-panel>, then sets the `hass` property on every state
// change. We ride HA's authenticated connection — no iframe, no token paste.
//
// configuration.yaml:
//   panel_custom:
//     - name: diorama-panel
//       sidebar_title: Diorama
//       sidebar_icon: mdi:floor-plan
//       url_path: diorama
//       module_url: /local/diorama/diorama-panel.js
//       embed_iframe: false

import { Planner } from './planner.js';
import { HassPanelAdapter } from './ha-panel-adapter.js';
import { injectSharedStyles } from './styles.js';
import './ui/app.js';
import type { App } from './ui/app.js';

class DioramaPanel extends HTMLElement {
  private _adapter = new HassPanelAdapter();
  private _planner: Planner | null = null;
  private _app: App | null = null;

  // HA frontend sets this on every state change. First call boots the app.
  set hass(h: unknown) {
    if (!h) return;
    if (!this._planner) {
      // Inject styles INTO the panel element — it sits inside HA frontend's
      // shadow DOM, where document.head styles can't reach.
      injectSharedStyles(this);
      this.style.display = 'block';
      // HA sizes the panel's container; 100vh would overflow under the
      // header and clip the bottom of the canvas.
      this.style.height = '100%';
      this._planner = new Planner();
      this._planner.connectWith(this._adapter);
      const app = document.createElement('diorama-app') as App;
      app.adoptPlanner(this._planner);
      this.appendChild(app);
      this._app = app;
    }
    this._adapter.attach(h as Parameters<HassPanelAdapter['attach']>[0]);
  }

  disconnectedCallback(): void {
    this._app?.remove();
    this._app = null;
  }
}

if (!customElements.get('diorama-panel')) {
  if (!customElements.get('diorama-panel')) customElements.define('diorama-panel', DioramaPanel);
}
