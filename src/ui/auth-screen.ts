import { LitElement, html } from 'lit';
import { state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { OFFLINE_FLAG_KEY } from '../ha-local.js';

@customElement('diorama-auth')
export class AuthScreen extends LitElement {
  @state() private _error = '';
  @state() private _url = '';
  @state() private _token = '';

  // Render to light DOM so shared CSS applies.
  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    const autoUrl = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
      ? window.location.origin : '';
    this._url = localStorage.getItem('diorama:url') || autoUrl;
  }

  override render() {
    return html`
      <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:16px">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;
                    padding:32px;width:100%;max-width:440px;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
          <h1 style="font-size:22px;margin-bottom:6px">🏠 Diorama</h1>
          <p style="color:var(--text-dim);font-size:13px;margin-bottom:24px;line-height:1.5">
            A living model of your Home Assistant home. Connect to see your devices in
            their actual spatial context, watch live state, and control them in place.
            Generate a Long-Lived Access Token under
            <strong>Profile → Security → Long-Lived Access Tokens</strong>.
          </p>
          <div style="margin-bottom:16px">
            <label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:6px">
              Home Assistant URL
            </label>
            <input style="width:100%;padding:10px 12px;border-radius:6px;border:1px solid var(--border);
                         background:#111;color:var(--text);font-size:13px"
                   type="url" placeholder="http://homeassistant.local:8123"
                   .value=${this._url}
                   @input=${(e: Event) => this._url = (e.target as HTMLInputElement).value}>
            <div style="font-size:11px;color:var(--text-dim);margin-top:4px">
              Leave blank to use the current host.
            </div>
          </div>
          <div style="margin-bottom:16px">
            <label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:6px">
              Long-Lived Access Token
            </label>
            <input style="width:100%;padding:10px 12px;border-radius:6px;border:1px solid var(--border);
                         background:#111;color:var(--text);font-size:13px"
                   type="password" placeholder="Paste token here"
                   .value=${this._token}
                   @input=${(e: Event) => this._token = (e.target as HTMLInputElement).value}
                   @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._submit(); }}>
          </div>
          <button class="btn-primary" @click=${this._submit}>Connect</button>
          ${this._error ? html`<div style="color:#ef9a9a;font-size:12px;margin-top:10px">${this._error}</div>` : ''}
          <div style="display:flex;align-items:center;gap:10px;margin:22px 0 14px;color:var(--text-dim);font-size:11px">
            <span style="flex:1;height:1px;background:var(--border)"></span>
            <span>or</span>
            <span style="flex:1;height:1px;background:var(--border)"></span>
          </div>
          <button class="btn" style="width:100%" @click=${this._useOffline}>
            Use offline — no Home Assistant
          </button>
          <div style="font-size:11px;color:var(--text-dim);margin-top:6px;line-height:1.5">
            Design and demo locally; configurations stay in this browser.
          </div>
        </div>
      </div>
    `;
  }

  private _submit = () => {
    if (!this._token.trim()) { this._error = 'Please enter a Long-Lived Access Token.'; return; }
    localStorage.setItem('diorama:url', this._url.trim());
    localStorage.setItem('diorama:token', this._token.trim());
    this.dispatchEvent(new CustomEvent('connect', {
      bubbles: true, composed: true,
      detail: { url: this._url.trim(), token: this._token.trim() },
    }));
  };

  // Offline / standalone: persist the flag so reloads skip straight to offline,
  // then let app.ts wire a Planner over LocalApi (mirrors panel-mode adoption).
  private _useOffline = () => {
    try { localStorage.setItem(OFFLINE_FLAG_KEY, '1'); } catch { /* ignore */ }
    this.dispatchEvent(new CustomEvent('connect-offline', { bubbles: true, composed: true }));
  };

  showError(msg: string): void { this._error = msg; }
}
