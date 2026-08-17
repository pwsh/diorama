import{M as e,N as t,O as n,ds as r,fs as i,j as a,k as o,ps as s,ss as c}from"./compass.js?v=mswkx4ak";import{n as l,r as u,t as d}from"../diorama-card.js?v=mswkx4ak";var f={glassHouse:`Glass house`,wallCutaway:`Wall cutaway`,autoFollow:`Auto-follow camera`,cinematicOrbit:`Cinematic orbit`,simsCam:`Sims cam (45° snap)`,plumbobs:`Plumbobs`,skyBackdrop:`Sky backdrop`},p=class extends r{constructor(...e){super(...e),this._config={},this._planner=null,this._onCfg=()=>this.requestUpdate()}createRenderRoot(){return this}setConfig(e){try{this._config=l(e)}catch{this._config=e??{}}this.requestUpdate()}set hass(e){!e||this._planner||(this._planner=u(e),this._planner.addEventListener(`config`,this._onCfg),this.requestUpdate())}connectedCallback(){super.connectedCallback(),t(this)}disconnectedCallback(){super.disconnectedCallback(),this._planner?.removeEventListener(`config`,this._onCfg)}_emit(e){let t={type:`custom:diorama-card`,...this._config,...e};for(let e of Object.keys(t))(t[e]===``||t[e]===void 0)&&delete t[e];if(t.scene){let e={...t.scene};for(let t of Object.keys(e))(e[t]===void 0||e[t]===``)&&delete e[t];Object.keys(e).length?t.scene=e:delete t.scene}this._config=t,this.dispatchEvent(new CustomEvent(`config-changed`,{bubbles:!0,composed:!0,detail:{config:t}})),this.requestUpdate()}render(){let e=this._config,t=this._planner?.store.floors??[],n=`display:flex;justify-content:space-between;align-items:center;gap:10px;margin:8px 0`,r=`flex:1;min-width:0`;return s`
      <div style="padding:10px 4px;font-size:13px">
        <div style=${n}>
          <label>View</label>
          <select style=${r} @change=${e=>this._emit({view:e.target.value})}>
            <option value="2d" ?selected=${(e.view??`2d`)===`2d`}>2D floor plan</option>
            <option value="3d" ?selected=${e.view===`3d`}>3D room view</option>
          </select>
        </div>

        <div style=${n}>
          <label>Mode</label>
          <select style=${r} @change=${e=>this._emit({mode:e.target.value})}>
            <option value="kiosk" ?selected=${(e.mode??`kiosk`)===`kiosk`}>Kiosk (tap to control)</option>
            <option value="view" ?selected=${e.mode===`view`}>View only (no interaction)</option>
          </select>
        </div>

        <div style=${n}>
          <label>Floor</label>
          ${t.length?s`
            <select style=${r} @change=${e=>this._emit({floor:e.target.value})}>
              <option value="" ?selected=${!e.floor}>(current / first)</option>
              ${t.map(t=>s`<option value=${t.id} ?selected=${e.floor===t.id||e.floor===t.name}>${t.name}</option>`)}
            </select>
          `:s`
            <input style=${r} type="text" placeholder="floor name or id (loads once connected)"
                   .value=${e.floor??``}
                   @change=${e=>this._emit({floor:e.target.value})}>`}
        </div>

        ${this._layersBlock(n,r)}

        <div style=${n}>
          <label>Compact</label>
          <input type="checkbox" .checked=${e.compact===!0}
                 @change=${e=>this._emit({compact:e.target.checked})}>
        </div>

        ${(e.view??`2d`)===`3d`?this._sceneBlock(n,r):i}

        ${this._planner?i:s`<div style="color:var(--text-dim,#8aa);font-size:11px;margin-top:6px">
          Connect to Home Assistant to pick a floor by name.</div>`}
      </div>
    `}_layersBlock(e,t){let n=this._config,r=!!n.layers&&typeof n.layers==`object`,o=this._planner?.store.layerPresets2d??[],c=r?`__custom`:typeof n.layers==`string`?n.layers:``,l=r?n.layers:{};return s`
      <div style=${e}>
        <label>Layers</label>
        <select style=${t} @change=${e=>{let t=e.target.value;t===`__custom`?this._emit({layers:this._explicitLayers(this._planner?.store.layers2d)}):this._emit({layers:t||void 0})}}>
          <option value="" ?selected=${c===``}>(unchanged)</option>
          <option value="full" ?selected=${c===`full`}>Full detail</option>
          <option value="simple" ?selected=${c===`simple`}>Simple floorplan</option>
          ${o.map(e=>s`
            <option value=${e.name} ?selected=${c===e.name||c===e.id}>${e.name}</option>`)}
          <option value="__custom" ?selected=${r}>Custom…</option>
        </select>
      </div>
      ${r?s`
        <div style="margin:2px 0 10px 0;padding:6px 8px;
                    border:1px solid var(--border,#2a3a4c);border-radius:5px">
          ${a().map(e=>s`
            <div class="layer-cat" style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;
                        color:var(--text-dim,#8aa);opacity:0.65;margin:6px 0 2px 0">${e.cat.label}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
              ${e.defs.map(e=>s`
                <label style="display:flex;align-items:center;gap:6px;font-size:11px;
                              color:var(--text-dim,#8aa);cursor:pointer">
                  <input type="checkbox" .checked=${l[e.key]!==!1}
                         @change=${t=>{let n=this._explicitLayers(l);n[e.key]=t.target.checked,this._emit({layers:n})}}>
                  <span>${e.label}</span>
                </label>`)}
            </div>`)}
        </div>`:i}
    `}_explicitLayers(t){let n={};for(let r of o)n[r.key]=e(t,r.key);return n}_sceneBlock(e,t){let n=this._config.scene??{},r=(e,t)=>this._emit({scene:{...n,[e]:t}}),i=t+`;max-width:120px`,a=(i,a,o,c)=>s`
      <div style=${e}>
        <label>${a}</label>
        <input style=${t} type="number" min=${o} max=${c} placeholder="(inherit)"
               .value=${n[i]==null?``:String(n[i])}
               @change=${e=>{let t=e.target.value.trim();if(!t){r(i,void 0);return}let n=Number(t);r(i,isFinite(n)?Math.min(c,Math.max(o,n)):void 0)}}>
      </div>`;return s`
      <div style="margin-top:12px;border-top:1px solid var(--border,#2a3a4c);padding-top:8px">
        <div style="font-size:11px;color:var(--text-dim,#8aa);margin-bottom:4px">
          Scene (3D) — blank inherits the panel's own setting.
        </div>
        ${d.map(t=>s`
          <div style=${e}>
            <label>${f[t]}</label>
            <select style=${i} @change=${e=>{let n=e.target.value;r(t,n===``?void 0:n===`on`)}}>
              <option value="" ?selected=${n[t]===void 0}>(inherit)</option>
              <option value="on" ?selected=${n[t]===!0}>On</option>
              <option value="off" ?selected=${n[t]===!1}>Off</option>
            </select>
          </div>`)}
        ${a(`fovV`,`Vertical FOV`,10,120)}
        ${a(`fovH`,`Horizontal FOV`,10,150)}
      </div>
    `}};p=n([c(`diorama-card-editor`)],p);export{p as DioramaCardEditor};
//# sourceMappingURL=card-editor.js.map