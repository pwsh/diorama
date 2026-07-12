import { LitElement, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { customElement } from './define.js';
import { CONDITION_GLYPH, CONDITION_LABEL, tempText } from '../weather.js';
import type { Planner } from '../planner.js';

// Corner weather overlay (both 2D + 3D views, kiosk-safe). Reads
// planner.weatherNow; hidden when weather is unconfigured, the chip is toggled
// off, or no source has resolved a value yet. Non-interactive except a click
// (edit mode only) that opens the sidebar Weather section. Subscribes to the
// config channel plus a slow interval so "stale" dimming keeps current even
// when no config event fires.
@customElement('diorama-weather-chip')
export class WeatherChip extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  private _timer: ReturnType<typeof setInterval> | null = null;

  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    this.planner.addEventListener('config', this._tick);
    this._timer = setInterval(this._tick, 60_000);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._tick);
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }
  private _tick = () => this.requestUpdate();

  private _onClick = (): void => {
    if (this.planner.uiMode !== 'edit') return;
    this.dispatchEvent(new CustomEvent('open-weather', { bubbles: true, composed: true }));
  };

  override render() {
    const p = this.planner;
    const w = p.store.weather;
    const now = p.weatherNow;
    // Hidden when no source configured, chip disabled, or nothing resolved.
    if (!w || w.chip === false || !now) return nothing;

    const glyph = CONDITION_GLYPH[now.condition] ?? '❓';
    const temp = now.tempC == null ? '' : tempText(now.tempC, p.store.imperial);
    const label = now.label ?? w.placeLabel ?? '';
    const editable = p.uiMode === 'edit';
    const title = `${CONDITION_LABEL[now.condition] ?? now.condition}`
      + (now.stale ? ' (stale)' : '')
      + (editable ? ' — click to configure' : '');

    return html`
      <div title=${title}
           @click=${this._onClick}
           style="position:absolute;bottom:8px;right:8px;z-index:6;
                  display:flex;align-items:center;gap:6px;
                  background:rgba(10,14,20,0.72);border:1px solid #2a3a4c;border-radius:6px;
                  padding:4px 9px;font-size:12px;color:#cfd8dc;
                  pointer-events:${editable ? 'auto' : 'none'};
                  cursor:${editable ? 'pointer' : 'default'};
                  opacity:${now.stale ? 0.5 : 1};
                  text-shadow:0 0 4px rgba(0,0,0,0.85)">
        <span style="font-size:15px;line-height:1">${glyph}</span>
        ${temp ? html`<span style="font-weight:600">${temp}</span>` : nothing}
        ${label ? html`<span style="color:#90a4ae;max-width:120px;overflow:hidden;
                                     text-overflow:ellipsis;white-space:nowrap">${label}</span>` : nothing}
      </div>
    `;
  }
}
