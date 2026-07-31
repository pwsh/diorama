import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import type { Planner } from '../planner.js';
import { buildToolbarModel, type ToolCard, type ToolCategory } from './tool-arm.js';
import { thumbs } from './thumbs.js';

// Visual placement toolbar — a bottom dock (category tabs + scrollable item-card
// strip + variant chips) that arms the same tool state the sidebar Tools buttons
// arm. EDIT MODE ONLY (returns nothing otherwise, so it takes no layout height in
// kiosk/view). Light DOM (shared CSS + native scroll). Mounted by app.ts as a
// flex sibling BELOW the canvas so the canvas shrinks to make room — the weather
// chip + 2D reset-view button (absolute inside the canvas) then clear it for free.
@customElement('diorama-toolbar')
export class Toolbar extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() private _tab = 'furniture';
  @state() private _collapsed = false;

  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    try { this._collapsed = localStorage.getItem('diorama:toolbar:collapsed') === '1'; } catch { /* ignore */ }
    // Track external tool changes (hotkeys / sidebar) so the armed ring moves.
    this.planner.addEventListener('config', this._tick);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._tick);
  }
  private _tick = () => this.requestUpdate();

  private _toggleCollapsed(): void {
    this._collapsed = !this._collapsed;
    try { localStorage.setItem('diorama:toolbar:collapsed', this._collapsed ? '1' : '0'); } catch { /* ignore */ }
  }

  private _cats(): ToolCategory[] { return buildToolbarModel(this.planner); }

  // The collapse/expand control. LEFT-ANCHORED in both states (it is the first
  // child of the dock's top row, outside the tabs' horizontal scroller, so it
  // stays reachable with a thumb at any width) and sized as a real touch target
  // (>=40x40) with an oversized chevron.
  private _handle(collapsed: boolean) {
    const label = collapsed ? 'Show placement toolbar' : 'Collapse placement toolbar';
    return html`
      <button class="tb-handle" title=${label} aria-label=${label}
              aria-expanded=${collapsed ? 'false' : 'true'}
              @click=${() => this._toggleCollapsed()}>
        <span class="tb-handle-glyph">${collapsed ? '▴' : '▾'}</span>
        ${collapsed ? html`<span class="tb-handle-label">Toolbar</span>` : nothing}
      </button>`;
  }

  private _card(card: ToolCard) {
    const p = this.planner;
    const armed = card.isArmed(p);
    const src = thumbs.get(card.thumb, card.glyph, () => this.requestUpdate(),
      { customObjects: p.store.customObjects });
    return html`
      <button class="tb-card ${armed ? 'armed' : ''}" title=${card.label}
              @click=${() => { card.arm(p); this.requestUpdate(); }}>
        <img class="tb-thumb" src=${src} alt="" draggable="false">
        <span class="tb-label">${card.label}</span>
      </button>`;
  }

  private _variantRow(card: ToolCard) {
    if (!card.variants) return nothing;
    const p = this.planner;
    return html`
      <div class="tb-variants">
        <span class="tb-variants-label">${card.label}:</span>
        ${card.variants.map(v => html`
          <button class="tb-chip ${v.isArmed(p) ? 'armed' : ''}"
                  @click=${() => { v.arm(p); this.requestUpdate(); }}>${v.label}</button>`)}
      </div>`;
  }

  override render() {
    const p = this.planner;
    if (p.uiMode !== 'edit') return nothing;
    const cats = this._cats();
    if (!cats.some(c => c.id === this._tab)) this._tab = cats[0]?.id ?? 'furniture';
    const active = cats.find(c => c.id === this._tab);

    if (this._collapsed) {
      return html`
        <div class="tb-dock tb-collapsed">
          ${this._handle(true)}
        </div>`;
    }

    // The armed card in the active tab whose variants should show (if any).
    const armedWithVariants = active?.cards.find(c => c.variants && c.isArmed(p));

    return html`
      <div class="tb-dock">
        <div class="tb-tabs">
          ${this._handle(false)}
          <div class="tb-tabstrip">
            ${cats.map(c => html`
              <button class="tb-tab ${c.id === this._tab ? 'active' : ''}"
                      @click=${() => { this._tab = c.id; }}>
                <span class="tb-tab-glyph">${c.glyph}</span>${c.label}
              </button>`)}
          </div>
        </div>
        ${armedWithVariants ? this._variantRow(armedWithVariants) : nothing}
        <div class="tb-row tb-cards">
          ${active ? active.cards.map(c => this._card(c)) : nothing}
        </div>
      </div>`;
  }
}
