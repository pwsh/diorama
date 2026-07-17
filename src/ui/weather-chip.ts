import { LitElement, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { customElement } from './define.js';
import {
  CONDITION_GLYPH, CONDITION_LABEL, tempText, windText,
  chipAnchorStyle, resolveChipContent,
  worstAlertSeverity, ALERT_SEVERITY_COLOR,
} from '../weather.js';
import type { HaCondition, WeatherAlert } from '../weather.js';
import type { ForecastRecord } from '../ha-client.js';
import type { Planner } from '../planner.js';

// Corner weather overlay (both 2D + 3D views, kiosk-safe). Reads
// planner.weatherNow; hidden when weather is unconfigured, the chip is toggled
// off, or no source has resolved a value yet. Non-interactive except a click
// (edit mode only) that opens the sidebar Weather section. Subscribes to the
// config channel plus a slow interval so "stale" dimming keeps current even
// when no config event fires.
//
// DC-C: the chip is movable (chipAnchor / chipCustom) and can grow optional
// content rows (feels-like / humidity / wind) and compact hourly / daily
// forecast strips (chipContent), reading Planner.forecastHourly/Daily.
@customElement('diorama-weather-chip')
export class WeatherChip extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  private _timer: ReturnType<typeof setInterval> | null = null;
  // DC-D: whether the alerts detail panel is expanded (toggled by clicking the
  // badge in any mode, or the whole chip in non-edit mode). Runtime only.
  private _alertsOpen = false;

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

  private _alerts(): WeatherAlert[] { return this.planner.weatherAlerts ?? []; }

  // Chip body click: edit mode → open the Weather settings tab (unchanged); any
  // other mode → toggle the alerts panel when there are alerts to show.
  private _onClick = (): void => {
    if (this.planner.uiMode === 'edit') {
      this.dispatchEvent(new CustomEvent('open-weather', { bubbles: true, composed: true }));
      return;
    }
    if (this._alerts().length) { this._alertsOpen = !this._alertsOpen; this.requestUpdate(); }
  };

  // Badge click is a DISTINCT target (stops propagation) so it toggles the alerts
  // panel in EVERY mode — including edit, where the body click still opens
  // settings. This is how edit-mode users reach the panel.
  private _onBadgeClick = (e: Event): void => {
    e.stopPropagation();
    this._alertsOpen = !this._alertsOpen;
    this.requestUpdate();
  };

  // ISO expiry → compact relative string. Empty when unparseable.
  private _relExpiry(iso?: string): string {
    if (!iso) return '';
    const t = Date.parse(iso);
    if (!isFinite(t)) return '';
    const ms = t - Date.now();
    const past = ms < 0;
    const m = Math.max(0, Math.round(Math.abs(ms) / 60000));
    const unit = m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
    return past ? `expired ${unit} ago` : `until ${unit}`;
  }

  // One alert row in the expanded panel: severity pill + event + headline + expiry.
  private _alertRow(a: WeatherAlert) {
    const color = ALERT_SEVERITY_COLOR[a.severity];
    const rel = this._relExpiry(a.expires);
    return html`
      <div style="display:flex;flex-direction:column;gap:1px;padding:3px 0;
                  border-top:1px solid #22303d">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="background:${color};color:#111;font-weight:700;font-size:9px;
                       text-transform:uppercase;letter-spacing:0.3px;
                       border-radius:3px;padding:1px 5px;flex:0 0 auto">${a.severity}</span>
          <span style="font-weight:600;font-size:11px;overflow:hidden;
                       text-overflow:ellipsis;white-space:nowrap">${a.event}</span>
          ${rel ? html`<span style="color:#90a4ae;font-size:10px;margin-left:auto;
                                     flex:0 0 auto">${rel}</span>` : nothing}
        </div>
        ${a.headline ? html`<span style="color:#b0bec5;font-size:10px;line-height:1.3">${a.headline}</span>` : nothing}
      </div>`;
  }

  // One hourly forecast cell: hour label, condition glyph, temp.
  private _hourCell(r: ForecastRecord, imperial: boolean) {
    const t = r.datetime ? new Date(r.datetime) : null;
    const hour = t && !isNaN(t.getTime())
      ? t.toLocaleTimeString([], { hour: 'numeric' })
      : '';
    const glyph = r.condition ? (CONDITION_GLYPH[r.condition as HaCondition] ?? '') : '';
    const temp = typeof r.temperature === 'number' ? tempText(r.temperature, imperial) : '';
    return html`
      <div style="display:flex;flex-direction:column;align-items:center;gap:1px;
                  min-width:38px;flex:0 0 auto">
        <span style="color:#90a4ae;font-size:10px;white-space:nowrap">${hour}</span>
        <span style="font-size:15px;line-height:1">${glyph}</span>
        <span style="font-weight:600;font-size:11px">${temp}</span>
      </div>`;
  }

  // One daily forecast row: day label, glyph, high / low.
  private _dayRow(r: ForecastRecord, i: number, imperial: boolean) {
    const t = r.datetime ? new Date(r.datetime) : null;
    const day = i === 0 ? 'Today'
      : (t && !isNaN(t.getTime()) ? t.toLocaleDateString([], { weekday: 'short' }) : '');
    const glyph = r.condition ? (CONDITION_GLYPH[r.condition as HaCondition] ?? '') : '';
    const hi = typeof r.temperature === 'number' ? tempText(r.temperature, imperial) : '—';
    const lo = typeof r.templow === 'number' ? tempText(r.templow, imperial) : '—';
    return html`
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;line-height:1.5">
        <span style="color:#90a4ae;width:34px;flex:0 0 auto">${day}</span>
        <span style="font-size:14px;width:18px;text-align:center;flex:0 0 auto">${glyph}</span>
        <span style="font-weight:600;margin-left:auto">${hi}</span>
        <span style="color:#90a4ae">${lo}</span>
      </div>`;
  }

  override render() {
    const p = this.planner;
    const w = p.store.weather;
    const now = p.weatherNow;
    // Hidden when no source configured, chip disabled, or nothing resolved.
    if (!w || w.chip === false || !now) return nothing;

    const imperial = p.store.imperial;
    const glyph = CONDITION_GLYPH[now.condition] ?? '❓';
    const temp = now.tempC == null ? '' : tempText(now.tempC, imperial);
    const label = now.label ?? w.placeLabel ?? '';
    const editable = p.uiMode === 'edit';
    const title = `${CONDITION_LABEL[now.condition] ?? now.condition}`
      + (now.stale ? ' (stale)' : '')
      + (editable ? ' — click to configure' : '');

    const content = resolveChipContent(w.chipContent);
    const pos = chipAnchorStyle(w.chipAnchor, w.chipCustom);

    // ── DC-D alerts: a severity-tinted badge on the chip + an expandable panel ──
    const alerts = this._alerts();
    const worst = worstAlertSeverity(alerts);
    const alertsOpen = this._alertsOpen && alerts.length > 0;
    const badge = worst ? html`
      <span @click=${this._onBadgeClick}
            title="${alerts.length} weather alert${alerts.length > 1 ? 's' : ''} — click for detail"
            style="background:${ALERT_SEVERITY_COLOR[worst]};color:#111;font-weight:700;
                   font-size:11px;border-radius:4px;padding:0 5px;margin-left:2px;
                   cursor:pointer;pointer-events:auto;flex:0 0 auto">⚠ ${alerts.length}</span>`
      : nothing;

    // Extra current-condition rows (opt-in).
    const extra: string[] = [];
    if (content.apparent && now.apparentC != null) extra.push(`feels ${tempText(now.apparentC, imperial)}`);
    if (content.humidity && now.humidity != null) extra.push(`💧 ${Math.round(now.humidity)}%`);
    if (content.wind && now.windKmh != null) extra.push(`💨 ${windText(now.windKmh, imperial)}`);

    const hourly = content.hourly > 0 ? (p.forecastHourly ?? []).slice(0, content.hourly) : [];
    const daily = content.daily > 0 ? (p.forecastDaily ?? []).slice(0, content.daily) : [];
    const expanded = extra.length > 0 || hourly.length > 0 || daily.length > 0 || alertsOpen;

    // The current-conditions row (glyph + temp + label + alert badge) — the
    // legacy pill body, reused as the panel's header when expanded.
    const currentRow = html`
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:15px;line-height:1">${glyph}</span>
        ${temp ? html`<span style="font-weight:600">${temp}</span>` : nothing}
        ${label ? html`<span style="color:#90a4ae;max-width:120px;overflow:hidden;
                                     text-overflow:ellipsis;white-space:nowrap">${label}</span>` : nothing}
        ${badge}
      </div>`;

    // The chip is clickable whenever it can DO something: edit (opens settings)
    // or there are alerts to expand. Otherwise it stays inert (display-only).
    const clickable = editable || alerts.length > 0;
    const chrome = `position:absolute;${pos};z-index:6;
                    background:rgba(10,14,20,0.72);border:1px solid #2a3a4c;border-radius:6px;
                    padding:4px 9px;font-size:12px;color:#cfd8dc;
                    pointer-events:${clickable ? 'auto' : 'none'};
                    cursor:${clickable ? 'pointer' : 'default'};
                    opacity:${now.stale ? 0.5 : 1};
                    text-shadow:0 0 4px rgba(0,0,0,0.85)`;

    // The alerts detail block (shown when the panel is open), capped at 4.
    const alertsPanel = alertsOpen ? html`
      <div style="display:flex;flex-direction:column;min-width:180px">
        ${alerts.slice(0, 4).map(a => this._alertRow(a))}
        ${alerts.length > 4 ? html`<span style="color:#90a4ae;font-size:10px;
                                                 padding-top:2px">+${alerts.length - 4} more</span>` : nothing}
      </div>` : nothing;

    // Compact pill (no extra content) — the original look.
    if (!expanded) {
      return html`
        <div title=${title} @click=${this._onClick}
             style="${chrome};display:flex;align-items:center">
          ${currentRow}
        </div>`;
    }

    // Expanded panel: current row + alerts + optional extra rows + forecast strips.
    return html`
      <div title=${title} @click=${this._onClick}
           style="${chrome};display:flex;flex-direction:column;gap:4px;max-width:340px">
        ${currentRow}
        ${alertsPanel}
        ${extra.length ? html`
          <div style="display:flex;flex-wrap:wrap;gap:2px 10px;font-size:11px;color:#b0bec5">
            ${extra.map(s => html`<span>${s}</span>`)}
          </div>` : nothing}
        ${hourly.length ? html`
          <div style="display:flex;gap:8px;overflow:hidden;max-width:340px;
                      border-top:1px solid #22303d;padding-top:4px">
            ${hourly.map(r => this._hourCell(r, imperial))}
          </div>` : nothing}
        ${daily.length ? html`
          <div style="display:flex;flex-direction:column;gap:1px;
                      border-top:1px solid #22303d;padding-top:4px;min-width:150px">
            ${daily.map((r, i) => this._dayRow(r, i, imperial))}
          </div>` : nothing}
      </div>`;
  }
}
