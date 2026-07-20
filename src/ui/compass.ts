import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { chipAnchorStyle } from '../weather.js';
import { resolveNorth, compassScreenAngle, camAzimuthOf } from '../compass.js';
import type { NorthVec } from '../compass.js';
import type { Planner } from '../planner.js';
import type { GeoTransform } from '../geo.js';
import type { GeoLandmark } from '../types.js';

// Corner compass overlay (both 2D + 3D views, kiosk-safe — a display prop like
// the weather chip). Hidden unless Store.compass.show === true. Draws a
// pseudo-3D rotating compass rose on a small 2D canvas (NO three.js here — the
// lazy-chunk rule) whose needle tracks true north: fixed atan2(nx, ny) in the
// 2D view, camera-azimuth-relative in 3D (compassScreenAngle). Position reuses
// the weather chip's chipAnchorStyle (default 'tr' — the chip defaults 'br',
// so no collision). Edit-mode click opens Settings ▸ Display.
//
// A self-owned rAF loop reads planner.view / planner.lastCam3d each frame but
// repaints ONLY when the needle moved >0.005 rad or the resolved source
// changed — an idle frame does zero canvas work and zero allocation (the geo
// fit is cached per configRev; angle math is scalar).
const SIZE = 96;             // CSS px, square
const SQUASH = 0.82;         // vertical ellipse squash — the pseudo-3D dial tilt

@customElement('diorama-compass')
export class CompassWidget extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() private _source: NorthVec['source'] = 'default';
  private _raf = 0;
  private _lastAngle = Infinity;      // last drawn needle angle (rad)
  private _lastSource: NorthVec['source'] | '' = '';
  // geoFit cache (recomputed only when configRev changes — landmark edits bump it).
  private _fitRev = -1;
  private _fit: { transform: GeoTransform; landmarks: GeoLandmark[] } | null = null;

  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    this.planner.addEventListener('config', this._onConfig);
    this._raf = requestAnimationFrame(this._frame);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._onConfig);
    cancelAnimationFrame(this._raf);
    this._raf = 0;
  }
  // Config edits can change anchor/show/source — re-render the shell and force
  // the next frame to repaint (the fit cache also refreshes via configRev).
  private _onConfig = () => { this._lastAngle = Infinity; this.requestUpdate(); };

  private _frame = () => {
    this._raf = requestAnimationFrame(this._frame);   // schedule first — one bad frame can't stop the loop
    try { this._tick(); } catch { /* never break the loop */ }
  };

  private _tick(): void {
    const p = this.planner;
    const cfg = p.store.compass;
    if (!cfg || cfg.show !== true) return;            // hidden — render() returned nothing
    const cv = this.querySelector('canvas');
    if (!cv) return;
    if (p.configRev !== this._fitRev) {
      this._fitRev = p.configRev;
      this._fit = p.geoFit();
    }
    const n = resolveNorth(cfg, this._fit);
    const angle = compassScreenAngle(n.nx, n.ny, p.view, camAzimuthOf(p.lastCam3d));
    if (n.source !== this._source) { this._source = n.source; }   // caption re-renders via Lit
    if (Math.abs(angle - this._lastAngle) <= 0.005 && n.source === this._lastSource) return;
    this._lastAngle = angle;
    this._lastSource = n.source;
    this._draw(cv, angle);
  }

  // ── The dial ──────────────────────────────────────────────────────────────
  // A tilted disc (ellipse) with a radial rim gradient + inner face, rotated
  // cardinal letters, minor ticks, a two-tone needle (red N half / pale S
  // half) and a pivot dome. All ellipse math applies the SQUASH factor to the
  // y component so the rose reads as a 3D dial lying slightly away from you.
  private _draw(cv: HTMLCanvasElement, angle: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(SIZE * dpr);
    if (cv.width !== px || cv.height !== px) { cv.width = px; cv.height = px; }
    const g = cv.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, SIZE, SIZE);
    const cx = SIZE / 2, cy = SIZE / 2 + 2;
    const R = SIZE * 0.40;
    const ex = (a: number, r: number) => cx + Math.sin(a) * r;
    const ey = (a: number, r: number) => cy - Math.cos(a) * r * SQUASH;

    // Drop shadow under the dial (offset down — the "floating disc" cue).
    g.beginPath();
    g.ellipse(cx, cy + 7, R * 0.96, R * SQUASH * 0.9, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fill();

    // Rim: radial gradient dark→light toward the edge (a bevelled housing).
    const rim = g.createRadialGradient(cx, cy - 4, R * 0.2, cx, cy, R * 1.02);
    rim.addColorStop(0, '#3a4a5c');
    rim.addColorStop(0.82, '#2a3a4c');
    rim.addColorStop(1, '#4a5f74');
    g.beginPath();
    g.ellipse(cx, cy, R, R * SQUASH, 0, 0, Math.PI * 2);
    g.fillStyle = rim;
    g.fill();
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(10,14,20,0.9)';
    g.stroke();

    // Inner face — slightly inset, darker, with a soft top highlight.
    const face = g.createRadialGradient(cx, cy - R * 0.35, R * 0.1, cx, cy, R * 0.9);
    face.addColorStop(0, '#1d2836');
    face.addColorStop(1, '#101820');
    g.beginPath();
    g.ellipse(cx, cy, R * 0.86, R * 0.86 * SQUASH, 0, 0, Math.PI * 2);
    g.fillStyle = face;
    g.fill();

    // Minor ticks every 45° (skipping cardinals, which get letters).
    g.strokeStyle = 'rgba(176,190,197,0.55)';
    g.lineWidth = 1.2;
    for (let i = 1; i < 8; i += 2) {          // NE / SE / SW / NW
      const a = angle + i * Math.PI / 4;
      g.beginPath();
      g.moveTo(ex(a, R * 0.72), ey(a, R * 0.72));
      g.lineTo(ex(a, R * 0.82), ey(a, R * 0.82));
      g.stroke();
    }

    // Cardinal letters ON the dial at the rotated positions (N in accent red).
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const letters: [string, number][] = [['N', 0], ['E', Math.PI / 2], ['S', Math.PI], ['W', -Math.PI / 2]];
    for (const [ch, off] of letters) {
      const a = angle + off;
      g.font = ch === 'N' ? '700 13px system-ui, sans-serif' : '600 10px system-ui, sans-serif';
      g.fillStyle = ch === 'N' ? '#ef5350' : '#b0bec5';
      g.fillText(ch, ex(a, R * 0.66), ey(a, R * 0.66));
    }

    // Needle: two shaded triangles pivoting at the centre. North half red with
    // a lighter left facet (fake specular), south half pale grey.
    const tipN = 0.58, tail = 0.20, wing = 0.10;
    const wingA1 = angle + Math.PI / 2, wingA2 = angle - Math.PI / 2;
    const wx1 = ex(wingA1, R * wing), wy1 = ey(wingA1, R * wing);
    const wx2 = ex(wingA2, R * wing), wy2 = ey(wingA2, R * wing);
    // North half — two facets for shading.
    const nx = ex(angle, R * tipN), ny = ey(angle, R * tipN);
    g.beginPath(); g.moveTo(nx, ny); g.lineTo(wx1, wy1); g.lineTo(cx, cy); g.closePath();
    g.fillStyle = '#c62828'; g.fill();
    g.beginPath(); g.moveTo(nx, ny); g.lineTo(wx2, wy2); g.lineTo(cx, cy); g.closePath();
    g.fillStyle = '#ef5350'; g.fill();
    // South half.
    const sx = ex(angle + Math.PI, R * tipN * (tail / tipN + 0.55)),
          sy = ey(angle + Math.PI, R * tipN * (tail / tipN + 0.55));
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(wx1, wy1); g.lineTo(cx, cy); g.closePath();
    g.fillStyle = '#90a4ae'; g.fill();
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(wx2, wy2); g.lineTo(cx, cy); g.closePath();
    g.fillStyle = '#cfd8dc'; g.fill();

    // Pivot dome: small radial-highlight sphere over the needle centre.
    const dome = g.createRadialGradient(cx - 1.5, cy - 2, 0.5, cx, cy, 5);
    dome.addColorStop(0, '#eceff1');
    dome.addColorStop(1, '#546e7a');
    g.beginPath();
    g.ellipse(cx, cy, 4.5, 4.5 * SQUASH, 0, 0, Math.PI * 2);
    g.fillStyle = dome;
    g.fill();
  }

  // Edit-mode click → Settings drawer, Display tab (where the Compass block lives).
  private _onClick = (): void => {
    if (this.planner.uiMode !== 'edit') return;
    this.dispatchEvent(new CustomEvent('open-settings', {
      bubbles: true, composed: true, detail: { tab: 'display' },
    }));
  };

  override render() {
    const p = this.planner;
    const cfg = p.store.compass;
    if (!cfg || cfg.show !== true) return nothing;
    const pos = chipAnchorStyle(cfg.anchor ?? 'tr', cfg.custom, 44);
    const editable = p.uiMode === 'edit';
    // Source hint: silent for landmarks (calibrated = trustworthy), a dim tag
    // for manual, and 'unset' when nothing is configured (nudge to calibrate).
    const hint = this._source === 'manual' ? 'manual'
               : this._source === 'default' ? 'unset' : '';
    return html`
      <div title=${editable ? 'Compass — click to configure' : 'Compass'}
           @click=${this._onClick}
           style="position:absolute;${pos};z-index:6;display:flex;flex-direction:column;
                  align-items:center;background:rgba(10,14,20,0.72);border:1px solid #2a3a4c;
                  border-radius:8px;padding:2px 4px;
                  pointer-events:${editable ? 'auto' : 'none'};
                  cursor:${editable ? 'pointer' : 'default'}">
        <canvas style="width:${SIZE}px;height:${SIZE}px;display:block"></canvas>
        ${hint ? html`<span style="font-size:9px;line-height:1.2;color:#90a4ae;
                                    margin-top:-4px;padding-bottom:1px">${hint}</span>` : nothing}
      </div>`;
  }
}
