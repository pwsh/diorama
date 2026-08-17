import{$a as e,$i as t,$n as n,$o as r,A as i,Aa as a,An as o,Bo as s,Br as c,Bt as l,C as u,Cn as d,Cr as f,D as p,Da as m,Dn as h,Do as g,Ea as _,Ei as v,En as y,Er as b,F as x,Fa as S,Fi as C,Fo as ee,Fr as te,Gn as w,Gr as T,H as E,Ha as ne,Hr as D,I as re,Ia as ie,Io as ae,Ja as oe,Ji as se,Jr as ce,Jt as O,K as le,Kn as ue,Kt as de,L as fe,La as pe,Li as me,Lo as he,M as ge,Ma as _e,Mi as ve,Mn as ye,Mo as be,Mr as xe,Mt as Se,N as Ce,Na as we,Nn as Te,No as Ee,Nr as De,O as k,Oa as A,Oi as Oe,On as ke,P as Ae,Pa as je,Pi as Me,Po as Ne,Pr as Pe,Pt as Fe,Qa as Ie,Qi as Le,Qn as Re,Qo as ze,Qr as Be,R as Ve,Ri as He,Rn as Ue,Ro as We,S as Ge,Si as Ke,Sn as qe,Sr as Je,T as Ye,Ta as Xe,Ti as Ze,Tr as Qe,U as $e,Ua as et,Ur as tt,Ut as nt,V as rt,Va as it,Vn as at,Vr as ot,Wt as st,Xa as ct,Xn as lt,Xt as ut,Ya as dt,Yi as ft,Yt as j,Za as pt,Zi as mt,Zn as ht,Zr as gt,Zt as _t,_i as vt,_t as yt,a as bt,aa as xt,ai as St,an as Ct,as as wt,at as Tt,b as Et,ba as Dt,bi as Ot,bn as kt,bo as At,br as jt,ci as Mt,cn as Nt,cs as M,ct as Pt,d as Ft,di as It,dn as Lt,dr as Rt,ds as N,dt as zt,ea as Bt,en as Vt,eo as Ht,es as Ut,f as Wt,fn as Gt,fr as Kt,fs as P,ft as qt,gi as Jt,gt as Yt,h as Xt,ha as Zt,hi as Qt,hn as $t,hr as en,ht as tn,i as nn,in as rn,io as an,j as on,ji as sn,jr as cn,k as ln,ki as un,kn as dn,ko as fn,kt as pn,l as mn,ln as hn,lr as gn,ls as F,lt as _n,mn as vn,mo as yn,mr as bn,n as xn,nn as Sn,no as Cn,nr as wn,ns as Tn,on as En,oo as Dn,os as On,ot as kn,p as An,pa as jn,pn as Mn,po as Nn,pr as Pn,ps as I,qa as Fn,qt as In,r as Ln,ra as Rn,rn as zn,ro as Bn,rr as Vn,s as Hn,si as Un,sn as Wn,ss as L,st as Gn,t as Kn,ta as qn,tn as Jn,to as Yn,tr as Xn,ua as Zn,ui as Qn,un as $n,uo as er,us as R,ut as tr,va as nr,vi as rr,vn as ir,vt as ar,w as or,wa as sr,wn as cr,x as lr,xa as ur,xn as dr,xo as fr,yi as pr,yo as mr,yt as hr,z as gr,za as _r,zo as vr,zr as yr}from"./compass.js?v=mswkx4ak";var br=`diorama:local:`,xr=`diorama:offline`;function Sr(e,t){try{if((e??localStorage).getItem(`diorama:offline`)===`1`)return!0}catch{}try{let e=t??(typeof window<`u`?window.location.search:``),n=new URLSearchParams(e);if(n.get(`offline`)===`1`||n.has(`demo`)||n.has(`model`))return!0}catch{}return!1}var Cr=class{constructor(){this.offline=!0,this.states={},this._stateListeners=[],this._connListeners=[]}connect(){let e=()=>{this._emitConn(`connected`),this._emitState()};typeof queueMicrotask==`function`?queueMicrotask(e):Promise.resolve().then(e)}onState(e){this._stateListeners.push(e)}onConn(e){this._connListeners.push(e)}callService(e,t,n){console.debug(`[diorama offline] callService no-op:`,`${e}.${t}`,n)}async callServiceWithResponse(){return null}async getHistory(){return{}}async getWeatherForecasts(){return null}async getCalendarEvents(){return[]}async getDevices(){return[]}async getEntityRegistry(){return[]}async getFloorRegistry(){return[]}async getAreaRegistry(){return[]}async updateEntityRegistry(e,t){return console.debug(`[diorama offline] updateEntityRegistry no-op:`,e,t),!1}async subscribeMqtt(){return()=>{}}async publishMqtt(){}async getUserData(e){try{let t=localStorage.getItem(br+e);return t==null?null:JSON.parse(t)}catch{return null}}async setUserData(e,t){try{return t==null?(localStorage.removeItem(br+e),!0):(localStorage.setItem(br+e,JSON.stringify(t)),!0)}catch{return!1}}async refreshStates(){}async subscribePersistentNotifications(e){return()=>{}}async listRepairsIssues(){return[]}async ignoreRepairsIssue(){return!1}_emitState(e){for(let t of this._stateListeners)t(this.states,e)}_emitConn(e){for(let t of this._connListeners)t(e)}},wr=`diorama:demo:seeded`,Tr=[`diorama:configs`,`diorama:store:v1`,wr],Er=[`diorama:local:`];function Dr(e){let t=e.map(e=>e.name).sort(),n=t.join(`\0`),r=5381;for(let e=0;e<n.length;e++)r=(r<<5)+r+n.charCodeAt(e)|0;return(r>>>0).toString(36)+`.`+t.length}async function Or(e,t,n,r){let i=[];for(let r of t){if(!r||!r.slug||!r.name||e.listConfigs().some(e=>e.name===r.name))continue;let t=n[r.slug];if(t!=null)try{let n=de(typeof t==`string`?t:JSON.stringify(t)),a=await e.importConfig(n,r.name);a.ok?i.push(r.slug):console.warn(`[diorama demo] import failed for`,r.slug,a.error)}catch(e){console.warn(`[diorama demo] import threw for`,r.slug,e)}}let a;if(r&&(a=t.find(e=>e.slug===r)?.name),a||(a=t[0]?.name),a){let t=e.listConfigs().find(e=>e.name===a);if(t&&t.id!==e.activeConfigId)try{await e.switchConfig(t.id)}catch(e){console.warn(`[diorama demo] switch failed:`,e)}}return{seeded:i,activeId:e.activeConfigId??null,requested:r??null}}function kr(e){let t=[];try{for(let n=0;n<e.length;n++){let r=e.key(n);r!=null&&(Tr.includes(r)||Er.some(e=>r.startsWith(e)))&&t.push(r)}}catch{}return t}function Ar(e){for(let t of kr(e))try{e.removeItem(t)}catch{}}var jr=`Model viewer`,Mr=new Set(`bulb.spot.pendant.sconce.strip.fireplace.lamp.bowl.tiered.round.recessed.jar.oval.fan.fan_light.string.under_cabinet.wall_sconce.step.flood.inground.ground_spot.heatlamp.exhaust.exhaust_wall.exhaust_light`.split(`.`));function Nr(e){let t=Object.prototype.hasOwnProperty.call(y,e);return{isFurniture:t,isLight:!t&&Mr.has(e)}}function Pr(e,t){let n=Math.max(e,t)*1.35,r=Math.atan(1/Math.SQRT2),i=n*Math.cos(r),a=n*Math.sin(r),o=Math.PI/4;return[-i*Math.sin(o),600+a,-i*Math.cos(o),0,600,0].map(e=>Math.round(e))}function Fr(e,t){let n=6e3,r=5e3,i=n/2,a=r/2,o=s({id:`mv`,name:`Model`,w:n,d:r});if(t)o.lights=[{id:`mv_light`,x:i,y:a,entity_id:null,localState:`on`,iconKind:e}];else{let t=y[e];o.furniture=[{id:`mv_piece`,x:i,y:a,w:t.w,h:t.h,kind:e,rotation:0}]}let c=We();return c.floors=[o],c.currentFloorId=`mv`,c}async function Ir(e,t){let n=Nr(t);if(!n.isFurniture&&!n.isLight)return{ok:!1,kind:t,isLight:!1};let r=Fr(t,n.isLight),i=e.listConfigs().find(e=>e.name===jr);try{if(i)i.id!==e.activeConfigId&&await e.switchConfig(i.id),e.store.floors=r.floors,e.store.currentFloorId=r.currentFloorId,e.viewCenter=null,e.zoom=1,await e.saveConfigNow(),e.emitConfig();else{let t={diorama:2,name:jr,store:r};await e.importConfig(JSON.stringify(t),jr)}}catch(e){console.warn(`[diorama demo] model viewer seed failed:`,e)}return{ok:!0,kind:t,isLight:n.isLight,cam:Pr(r.floors[0].w,r.floors[0].d)}}var z=class extends N{constructor(...e){super(...e),this._error=``,this._url=``,this._token=``,this._submit=()=>{if(!this._token.trim()){this._error=`Please enter a Long-Lived Access Token.`;return}localStorage.setItem(`diorama:url`,this._url.trim()),localStorage.setItem(`diorama:token`,this._token.trim()),this.dispatchEvent(new CustomEvent(`connect`,{bubbles:!0,composed:!0,detail:{url:this._url.trim(),token:this._token.trim()}}))},this._useOffline=()=>{try{localStorage.setItem(xr,`1`)}catch{}this.dispatchEvent(new CustomEvent(`connect-offline`,{bubbles:!0,composed:!0}))}}createRenderRoot(){return this}connectedCallback(){super.connectedCallback();let e=window.location.protocol===`http:`||window.location.protocol===`https:`?window.location.origin:``;this._url=localStorage.getItem(`diorama:url`)||e}render(){return I`
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
                   @input=${e=>this._url=e.target.value}>
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
                   @input=${e=>this._token=e.target.value}
                   @keydown=${e=>{e.key===`Enter`&&this._submit()}}>
          </div>
          <button class="btn-primary" @click=${this._submit}>Connect</button>
          ${this._error?I`<div style="color:#ef9a9a;font-size:12px;margin-top:10px">${this._error}</div>`:``}
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
    `}showError(e){this._error=e}};k([F()],z.prototype,`_error`,void 0),k([F()],z.prototype,`_url`,void 0),k([F()],z.prototype,`_token`,void 0),z=k([L(`diorama-auth`)],z);var Lr=`diorama:alerts:seen`;function Rr(){if(typeof document>`u`||document.getElementById(`diorama-alert-styles`))return;let e=document.createElement(`style`);e.id=`diorama-alert-styles`,e.textContent=`@keyframes diorama-bell-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}.diorama-bell-pulse{animation:diorama-bell-pulse 1s ease-in-out infinite}`,document.head.appendChild(e)}var B=class extends N{constructor(...e){super(...e),this._open=!1,this._=0,this._tick=()=>{this._++},this._toggle=()=>{this._open=!this._open,this._open&&this._markSeen(this.planner.alertFeed),this.requestUpdate()}}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),Rr(),this.planner.addEventListener(`config`,this._tick)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick)}_seen(){try{let e=localStorage.getItem(Lr);return new Set(e?JSON.parse(e):[])}catch{return new Set}}_markSeen(e){try{localStorage.setItem(Lr,JSON.stringify(e.map(e=>e.id)))}catch{}}_rel(e){if(!e)return``;let t=Date.parse(e);if(!isFinite(t))return``;let n=Date.now()-t;if(n<45e3)return`just now`;let r=Math.round(n/6e4);if(r<60)return`${r}m ago`;let i=Math.round(r/60);return i<24?`${i}h ago`:`${Math.round(i/24)}d ago`}_sourceLabel(e){return e.source===`repair`?`Repairs`:e.source===`system`?`System log`:e.source===`flight`?`Flights`:`Notification`}_row(e,t){let n=rn(e.severity),r=this._rel(e.createdAt);return I`
      <div style="display:flex;gap:8px;padding:8px 10px;border-top:1px solid #22303d">
        <div style="width:3px;flex:0 0 auto;border-radius:2px;background:${n}"></div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-weight:600;font-size:12px;overflow:hidden;text-overflow:ellipsis;
                         white-space:nowrap">${e.title}</span>
            <span style="margin-left:auto;flex:0 0 auto;font-size:9px;text-transform:uppercase;
                         letter-spacing:0.3px;color:#111;background:${n};font-weight:700;
                         border-radius:3px;padding:1px 5px">${e.severity}</span>
          </div>
          ${e.message?I`<div style="font-size:11px;color:#b0bec5;line-height:1.35;
                                          white-space:pre-wrap;word-break:break-word;
                                          max-height:66px;overflow:hidden">${e.message}</div>`:P}
          <div style="display:flex;align-items:center;gap:8px;margin-top:3px;font-size:10px;color:#78909c">
            <span>${this._sourceLabel(e)}</span>
            ${r?I`<span>· ${r}</span>`:P}
            ${e.source===`repair`?I`
              <a href="/config/repairs" target="_blank" rel="noopener"
                 style="color:#4fa8ff;text-decoration:none;margin-left:auto"
                 @click=${e=>e.stopPropagation()}>view in Repairs →</a>`:P}
            ${t&&e.dismissible?I`
              <button title=${e.source===`repair`?`Ignore this issue`:`Dismiss notification`}
                      style="margin-left:${e.source===`repair`?`8px`:`auto`};background:none;
                             border:1px solid #37474f;border-radius:4px;color:#cfd8dc;font-size:10px;
                             padding:1px 7px;cursor:pointer"
                      @click=${()=>this._dismiss(e)}>
                ${e.source===`repair`?`Ignore`:`Dismiss`}
              </button>`:P}
          </div>
        </div>
      </div>`}_dismiss(e){this.planner.dismissAlert(e),this.requestUpdate()}render(){let e=this.planner;if(e.isOffline||!Sn(e.store.alerts,e.uiMode))return P;let t=e.alertFeed,n=Ct(t,this._seen()),r=En(t),i=r?rn(r):`#78909c`,a=e.uiMode!==`view`;return I`
      <div style="position:relative;flex:0 0 auto">
        <button class="btn-sm ${n>0?`diorama-bell-pulse`:``}"
                title=${t.length?`${t.length} alert${t.length===1?``:`s`}`:`No alerts`}
                style="font-size:14px;padding:4px 8px;position:relative"
                @click=${this._toggle}>
          🔔
          ${n>0?I`
            <span style="position:absolute;top:-3px;right:-3px;min-width:15px;height:15px;
                         border-radius:8px;background:${i};color:#111;font-weight:700;
                         font-size:10px;line-height:15px;text-align:center;padding:0 3px;
                         box-sizing:border-box">${n>99?`99+`:n}</span>`:P}
        </button>
        ${this._open?I`
          <div style="position:absolute;top:36px;right:0;width:min(360px,90vw);max-height:70vh;
                      overflow-y:auto;background:rgba(12,16,22,0.98);border:1px solid #2a3a4c;
                      border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.5);z-index:30">
            <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;
                        border-bottom:1px solid #22303d">
              <span style="font-weight:600;font-size:12px">Alerts</span>
              <span style="font-size:11px;color:#78909c">${t.length}</span>
              <button style="margin-left:auto;background:none;border:none;color:#78909c;
                             font-size:16px;cursor:pointer;line-height:1"
                      @click=${this._toggle}>✕</button>
            </div>
            ${t.length===0?I`<div style="padding:16px 12px;font-size:12px;color:#78909c;text-align:center">
                       Nothing needs attention.</div>`:t.map(e=>this._row(e,a))}
          </div>`:P}
      </div>`}};k([R({attribute:!1})],B.prototype,`planner`,void 0),k([F()],B.prototype,`_open`,void 0),k([F()],B.prototype,`_`,void 0),B=k([L(`diorama-alert-center`)],B);var V=class extends N{constructor(...e){super(...e),this._=0,this._refreshing=!1,this._tick=()=>{this._++},this._copyKioskLink=async()=>{let e=this.planner,t=new URL(window.location.href);if(t.searchParams.set(`mode`,`kiosk`),t.searchParams.set(`view`,e.view),t.searchParams.set(`floor`,e.floor().name),e.view===`3d`&&e.lastCam3d){let n=[...e.lastCam3d.pos,...e.lastCam3d.target].map(e=>Math.round(e));t.searchParams.set(`cam`,n.join(`,`))}else t.searchParams.delete(`cam`);try{await navigator.clipboard.writeText(t.toString()),alert(`Kiosk URL copied to clipboard.`)}catch{prompt(`Kiosk URL:`,t.toString())}},this._openHaMenu=()=>{this.dispatchEvent(new Event(`hass-toggle-menu`,{bubbles:!0,composed:!0}))},this._refreshStates=async()=>{let e=this.planner;if(!(!e.hass||this._refreshing)){this._refreshing=!0;try{await e.refreshStates()}catch(e){console.warn(`refreshStates failed:`,e)}finally{this._refreshing=!1}}},this._openSettings=()=>{this.dispatchEvent(new CustomEvent(`open-settings`,{bubbles:!0,composed:!0}))},this._resetDemo=()=>{if(confirm(`Reset the demo? This clears every change you made in this browser and restores the sample homes.`)){try{Ar(localStorage)}catch{}location.reload()}}}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.planner.addEventListener(`config`,this._tick),this.planner.addEventListener(`conn`,this._tick)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick),this.planner.removeEventListener(`conn`,this._tick)}render(){let e=this.planner,t=e.isOffline?``:e.conn===`connected`?`connected`:e.conn===`auth_invalid`||e.conn===`error`?`error`:``,n=e.isOffline?`Offline`:e.conn===`connected`?`Connected`:e.conn===`auth_invalid`?`Auth Invalid`:e.conn===`connecting`?`Connecting…`:`Disconnected`;return I`
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;padding:0 12px;height:48px;
                  background:var(--surface2);border-bottom:1px solid var(--border)">
        <button class="btn-sm" title="Open Home Assistant menu"
                style="font-size:14px;padding:4px 8px"
                @click=${this._openHaMenu}>🏠</button>
        ${e.uiMode===`edit`?I`
          <button class="btn-sm ${e.sidebarOpen?`active`:``}"
                  title=${e.sidebarOpen?`Hide side panel`:`Show side panel`}
                  style="font-size:14px;padding:4px 8px"
                  @click=${()=>e.toggleSidebar()}>☰</button>
        `:P}
        ${e.uiMode===`edit`?I`
          <button class="btn-sm" title="Undo (Ctrl+Z)"
                  style="font-size:14px;padding:4px 8px"
                  ?disabled=${!e.canUndo}
                  @click=${()=>{e.undo()}}>↶</button>
          <button class="btn-sm" title="Redo (Ctrl+Shift+Z)"
                  style="font-size:14px;padding:4px 8px"
                  ?disabled=${!e.canRedo}
                  @click=${()=>{e.redo()}}>↷</button>
        `:P}
        <button class="btn-sm"
                title=${e.view===`2d`?`Switch to 3D view`:`Switch to 2D view`}
                @click=${()=>e.setView(e.view===`2d`?`3d`:`2d`)}>
          ${e.view===`2d`?`3D`:`2D`}
        </button>
        <span style="font-size:15px;font-weight:600;white-space:nowrap">Diorama</span>
        ${e.uiMode===`edit`?P:I`
          <select title="Current floor"
                  style="background:#111;color:var(--text);border:1px solid var(--border);
                         border-radius:5px;padding:5px 8px;font-size:12px"
                  .value=${e.store.currentFloorId}
                  @change=${t=>e.switchFloor(t.target.value)}>
            ${ot(e.enabledFloors()).map(t=>I`
              <option value=${t.id}>
                ${t.name} — ${D(t.w,e.store.imperial)} × ${D(t.d,e.store.imperial)}
              </option>
            `)}
          </select>
        `}
        ${e.uiModeLocked?P:I`
          <select title="UI mode: Edit (full editor) / Kiosk (interact with devices, no editing) / View only (visualization, no interaction)"
                  style="background:#111;color:var(--text);border:1px solid var(--border);
                         border-radius:5px;padding:5px 8px;font-size:12px"
                  .value=${e.uiMode}
                  @change=${t=>e.setUiMode(t.target.value)}>
            <option value="edit">✏️ Edit</option>
            <option value="kiosk">🖥 Kiosk</option>
            <option value="view">👁 View only</option>
          </select>
        `}
        ${e.uiMode===`edit`?I`
          <button class="btn" title="Copy a kiosk URL reproducing the current floor, view, and 3D camera — open it on a wall tablet (add &lock=1 in the URL to hide the mode switcher there)"
                  @click=${this._copyKioskLink}>🔗 Kiosk link</button>
        `:P}
        <button class="btn-sm ${this._refreshing?`active`:``}"
                title="Re-fetch all entity states from Home Assistant"
                ?disabled=${this._refreshing||!e.hass||e.conn!==`connected`}
                @click=${this._refreshStates}>↻</button>
        ${e.uiMode===`edit`?I`
          <button class="btn-sm" title="Settings" @click=${this._openSettings}>⚙</button>
        `:P}
        <span style="flex:1"></span>
        ${e.demoMode?I`
          <button class="btn-sm"
                  title="Reset the demo — clear all local edits and re-seed the sample homes in this browser"
                  @click=${this._resetDemo}>↺ Reset demo</button>
        `:P}
        <diorama-alert-center .planner=${e}></diorama-alert-center>
        <span class="pill ${t}">${n}</span>
      </div>
    `}};k([R({attribute:!1})],V.prototype,`planner`,void 0),k([F()],V.prototype,`_`,void 0),k([F()],V.prototype,`_refreshing`,void 0),V=k([L(`diorama-topbar`)],V);var zr,Br;function Vr(e){let t=(Date.now()-e)/1e3;if(t<60)return`${Math.round(t)}s ago`;let n=t/60;if(n<60)return`${Math.round(n)} min ago`;let r=n/60;return r<24?`${Math.round(r)} h ago`:`${Math.round(r/24)} d ago`}function Hr(e){return e===`indoor`?`🏠`:e===`yard`?`🌳`:`🧭`}var Ur=[{id:`bulb`,label:`Bulb`,glyph:`💡`},{id:`spot`,label:`Spot`,glyph:`🔦`},{id:`pendant`,label:`Pendant`,glyph:`⚪`},{id:`sconce`,label:`Sconce`,glyph:`◐`},{id:`strip`,label:`Strip`,glyph:`▬`},{id:`fireplace`,label:`Fireplace`,glyph:`🔥`},{id:`lamp`,label:`Lamp`,glyph:`🪔`},{id:`bowl`,label:`Bowl`,glyph:`🥣`},{id:`tiered`,label:`Tiered`,glyph:`☰`},{id:`round`,label:`Round`,glyph:`⭕`},{id:`recessed`,label:`Recessed`,glyph:`⊙`},{id:`jar`,label:`Jar`,glyph:`🫙`},{id:`oval`,label:`Oval`,glyph:`🥚`},{id:`fan`,label:`Ceiling fan`,glyph:`❋`},{id:`fan_light`,label:`Fan + light`,glyph:`✺`},{id:`string`,label:`LED string`,glyph:`✨`},{id:`under_cabinet`,label:`Under-cabinet strip`,glyph:`▂`},{id:`wall_sconce`,label:`Wall sconce (up/down)`,glyph:`◨`},{id:`step`,label:`Step light`,glyph:`▤`},{id:`flood`,label:`Floodlight`,glyph:`🔆`},{id:`inground`,label:`In-ground uplight`,glyph:`⤒`},{id:`ground_spot`,label:`Ground spot (aimable)`,glyph:`⟰`},{id:`heatlamp`,label:`Heat lamp`,glyph:`♨`},{id:`exhaust`,label:`Exhaust (ceiling)`,glyph:`❊`},{id:`exhaust_wall`,label:`Exhaust (wall)`,glyph:`⊛`},{id:`exhaust_light`,label:`Exhaust + light`,glyph:`❈`},{id:`firepit_round`,label:`Fire pit (round)`,glyph:`◉`},{id:`firepit_square`,label:`Fire pit (square)`,glyph:`▣`},{id:`vanity_bar`,label:`Vanity bar (3 globes)`,glyph:`💄`},{id:`vanity_hollywood`,label:`Vanity strip (5 globes)`,glyph:`🎬`},{id:`mirror_light`,label:`Backlit mirror`,glyph:`🪞`}],Wr=[{id:`single`,label:`Single pane`},{id:`double_hung`,label:`Double-hung`},{id:`casement_pair`,label:`Casement pair`},{id:`sliding`,label:`Sliding`},{id:`picture`,label:`Picture (fixed)`},{id:`bay`,label:`Bay (projecting)`},{id:`bay_bench`,label:`Bay + window seat`}],Gr=[{id:`select`,label:`Select`},{id:`wall`,label:`Wall`},{id:`sensor`,label:`mmWave`},{id:`motion`,label:`Motion`},{id:`env`,label:`Env`},{id:`infocard`,label:`🔢 Info`},{id:`action`,label:`🔘 Action`},{id:`bleproxy`,label:`BLE`},{id:`alarm`,label:`🚨 Alarm`},{id:`calendar`,label:`📅 Calendar`},{id:`thermostat`,label:`🌡 Thermostat`},{id:`safety`,label:`⚠️ Safety/Siren`},{id:`alertbeacon`,label:`🔔 Alert beacon`},{id:`robot`,label:`🤖 Robot`},{id:`camera`,label:`📷 Camera`},{id:`projector`,label:`📽 Projector`},{id:`valve`,label:`🚰 Valve`},{id:`sprinkler`,label:`🚿 Sprinkler`},{id:`flagpole`,label:`🚩 Flagpole`},{id:`solar`,label:`☀️ Solar panel`},{id:`plug`,label:`🔌 Plug`},{id:`pzone`,label:`▱ Presence zone`},{id:`ground`,label:`▨ Ground area`},{id:`path`,label:`〰 Path / drive`},{id:`pool`,label:`🏊 Pool / spa`},{id:`void`,label:`🕳 Floor void`},{id:`ruler`,label:`📏 Ruler`},{id:`furniture`,label:`Furn`},{id:`light`,label:`Light`},{id:`switch`,label:`Switch`},{id:`door`,label:`Door`},{id:`window`,label:`Window`},{id:`delete`,label:`Delete`}],Kr=[{label:`Select & edit`,tools:[`select`,`delete`]},{label:`Structure`,tools:[`wall`,`door`,`window`,`ruler`]},{label:`Areas & ground`,tools:[`ground`,`path`,`pool`,`void`,`pzone`]},{label:`Devices & sensors`,tools:[`sensor`,`motion`,`env`,`bleproxy`,`camera`,`safety`,`alarm`,`thermostat`,`valve`,`plug`,`projector`,`sprinkler`,`robot`,`alertbeacon`,`calendar`,`action`,`infocard`,`solar`]},{label:`Furniture & decor`,tools:[`furniture`,`light`,`switch`,`flagpole`]}],qr=`floortools.layers.dimensions.rulers.tools.sensors.motion.env.info.actions.ble.alarm.calendar.thermostats.safety.alertbeacons.robots.cameras.projectors.valves.sprinklers.flagpoles.solar.plugs.pzones.ground.pools.voids.people.roamers.doors.windows.furniture.plants.appliances.custom.rooms.fixtures.geo.neighborhood.model3d.bg`.split(`.`),Jr={wall:`tools`,furniture:`furniture`,light:`fixtures`,switch:`fixtures`,sensor:`sensors`,motion:`motion`,env:`env`,info:`info`,action:`actions`,ble:`ble`,alarm:`alarm`,calendar:`calendar`,thermostat:`thermostats`,safety:`safety`,alert:`alertbeacons`,robot:`robots`,camera:`cameras`,projector:`projectors`,valve:`valves`,plug:`plugs`,sprinkler:`sprinklers`,flagpole:`flagpoles`,solar:`solar`,door:`doors`,window:`windows`,ruler:`rulers`,pzone:`pzones`,ground:`ground`,pool:`pools`,void:`voids`,room:`rooms`,landmark:`geo`},Yr=new Set([`actions`,`alarm`,`alertbeacons`,`appliances`,`ble`,`calendar`,`cameras`,`doors`,`env`,`fixtures`,`flagpoles`,`furniture`,`info`,`motion`,`plants`,`plugs`,`projectors`,`robots`,`safety`,`sensors`,`solar`,`sprinklers`,`thermostats`,`valves`,`windows`]),H=(zr=class extends N{constructor(...e){super(...e),this._=0,this._cfgOpen=!1,this._moveStep=this._loadMoveStep(),this._collapsed=new Set(this._loadCollapsed()),this._identifyHandled=0,this._identifyRetries=0,this._focusRetries=0,this._tick=()=>{this._++},this._rgToken=0,this._rgCache=null,this._lastActiveSnapshot={},this._deviceNames={},this._camSnapCb=0,this._bermudaKicked=!1,this._doorExpanded=new Set,this._areaMatchNote=``,this._windowExpanded=new Set,this._furnExpanded=new Set,this._stairsFitMsg={},this._customExpanded=new Set,this._fxExpanded=new Set,this._calibLandmarkId=null,this._manualLandmarkId=null,this._manualLat=``,this._manualLon=``,this._manualErr=``,this._calibTrackerId=``,this._calibSlug=``,this._calibMsg=``,this._calibBusy=!1,this._recordMsg=``,this._recordBusy=!1,this._recordLat=``,this._recordLon=``,this._recordErr=``,this._recordGroundKind=`grass`,this._csvResult=null,this._calibLiveTimer=null,this._importLandmarkCsv=()=>{let e=document.createElement(`input`);e.type=`file`,e.accept=`.csv,text/csv`,e.onchange=async()=>{let t=e.files?.[0];if(t){try{let e=await t.text();this._csvResult=this.planner.importLandmarksCsv(e)}catch(e){this._csvResult={added:0,updated:0,pending:0,errors:[`Could not read the file: `+e.message]}}this.requestUpdate()}},e.click()},this._importSh3dStructural=()=>{let e=document.createElement(`input`);e.type=`file`,e.accept=`.sh3d,application/octet-stream`,e.onchange=async()=>{let t=e.files?.[0];if(t)try{let{analyzeSh3dFile:e}=await gr(async()=>{let{analyzeSh3dFile:e}=await import(`./sh3d.js?v=mswkx4ak`);return{analyzeSh3dFile:e}},[],import.meta.url),n=await e(t,{importFurniture:!0});if(!n.ok||!n.floors||!n.counts){alert(`Import failed: `+(n.error??`unknown error`));return}let r=n.counts,i=`${t.name}: ${r.levels} level${r.levels===1?``:`s`}, ${r.walls} walls, ${r.rooms} rooms, ${r.openings} doors/windows, ${r.furniture} furniture (${r.furnitureSkipped} skipped)\n\nCreate as a new configuration?`;if(!confirm(i))return;let a=n.name||t.name.replace(/\.sh3d$/i,``)||`Imported home`,o=await this.planner.importSh3dConfig(a,n.floors);if(!o.ok){alert(`Import failed: `+(o.error??`unknown error`));return}n.warnings&&n.warnings.length&&alert(`Imported with ${n.warnings.length} warning(s):\n\n`+n.warnings.join(`
`))}catch(e){alert(`Import failed: `+e.message)}},e.click()},this._importObj=()=>{let e=document.createElement(`input`);e.type=`file`,e.accept=`.obj,.mtl`,e.multiple=!0,e.onchange=async()=>{let t=[...e.files??[]],n=t.find(e=>e.name.toLowerCase().endsWith(`.obj`)),r=t.find(e=>e.name.toLowerCase().endsWith(`.mtl`));if(!n){alert(`Select a .obj file (optionally with its .mtl).`);return}let i=await n.text(),a=r?await r.text():null,o=this.planner,s=o.floor();try{await xn(s.id,{obj:i,mtl:a})}catch(e){alert(`Failed to store model locally: `+e.message);return}s.model3d={name:n.name,rev:(s.model3d?.rev??0)+1,scale:s.model3d?.scale??10,x:s.model3d?.x??0,y:s.model3d?.y??0,rotation:s.model3d?.rotation??0,opacity:s.model3d?.opacity??1,visible:!0},o.save(),o.emitConfig()},e.click()},this._removeObj=async()=>{if(!confirm(`Remove the imported 3D model from this floor?`))return;let e=this.planner,t=e.floor();try{await Kn(t.id)}catch{}t.model3d=null,e.save(),e.emitConfig()},this._uploadBg=()=>{let e=document.createElement(`input`);e.type=`file`,e.accept=`image/*,.svg,image/svg+xml`,e.onchange=()=>{let t=e.files?.[0];if(!t)return;let n=new FileReader;n.onload=()=>this._applyBg(n.result),n.readAsDataURL(t)},e.click()},this._clearBg=()=>{confirm(`Remove background image from this floor?`)&&(this.planner.floor().bg=null,this.planner.save(),this.planner.emitConfig())}}_loadMoveStep(){try{let e=Number(localStorage.getItem(`diorama:moveStep`));return[10,100,500,1e3].includes(e)?e:100}catch{return 100}}_setMoveStep(e){this._moveStep=e;try{localStorage.setItem(`diorama:moveStep`,String(e))}catch{}this.requestUpdate()}_nudgePlan(e,t){let n=this.planner;n.translateFloorContent(e,t),n.save(),n.emitConfig()}_peekGlyph(){return I`<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"
                     style="display:block;flex:0 0 auto">
      <circle cx="3.2" cy="7.5" r="2.1" fill="currentColor"/>
      <circle cx="12.8" cy="7.5" r="2.1" fill="currentColor"/>
      <circle cx="8" cy="8" r="5.6" fill="currentColor"/>
      <circle cx="5.6" cy="7.2" r="1.5" fill="#fff"/>
      <circle cx="5.6" cy="7.4" r="0.75" fill="#111"/>
      <path d="M8 3.2 Q13.8 4 13.6 9.5 Q13 13 8 13.2 Z" fill="currentColor"/>
      <path d="M8 8 Q3 8.4 2.6 11 Q3.5 13 8 13.2 Z" fill="currentColor"/>
      <g stroke="rgba(0,0,0,0.28)" stroke-width="0.5" fill="none">
        <path d="M9.6 4.3 Q10.1 8 9.4 12.6"/>
        <path d="M11 4.7 Q11.5 8 10.9 12.4"/>
        <path d="M4.5 9.3 Q4.3 11 4.9 12.8"/>
        <path d="M6.1 8.9 Q6.1 11 6.5 12.9"/>
      </g>
    </svg>`}_loadCollapsed(){try{let e=localStorage.getItem(`diorama:sidebar:collapsed`),t=e?JSON.parse(e):[];return Array.isArray(t)?t.filter(e=>typeof e==`string`):[]}catch{return[]}}_persistCollapsed(){try{localStorage.setItem(`diorama:sidebar:collapsed`,JSON.stringify([...this._collapsed]))}catch{}}_toggleCollapsed(e){this._collapsed.has(e)?this._collapsed.delete(e):this._collapsed.add(e),this._persistCollapsed(),this.requestUpdate()}_section(e,t,n,r){let i=this._collapsed.has(e);return I`
      <div class="section ${i?`collapsed`:``}"
           style=${r?.style??P} id=${r?.id??P}>
        <h3 class="collapsible-header ${i?``:`open`}"
            role="button" tabindex="0" aria-expanded=${i?`false`:`true`}
            title=${i?`Collapsed — click to expand`:`Expanded — click to collapse`}
            style=${i?`margin-bottom:0`:P}
            @keydown=${t=>{(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),this._toggleCollapsed(e))}}
            @click=${()=>this._toggleCollapsed(e)}>
          <span style="flex:1">${t}</span>
        </h3>
        ${i?P:n()}
      </div>
    `}_roomGroupKey(e,t){return`${e}/${t}`}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.planner.addEventListener(`config`,this._tick)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick),this._calibLiveTimer&&(clearInterval(this._calibLiveTimer),this._calibLiveTimer=null)}updated(){this._reconcileCalibLiveTimer(),this._maybeFocusNewlyPlaced(),this._maybeNavigateIdentify()}_maybeNavigateIdentify(){let e=this.planner.identifyFx;if(!e){this._identifyRetries=0;return}if(e.at===this._identifyHandled)return;let t=Jr[e.kind];if(e.kind===`furniture`){let n=(this.planner.floor().furniture??[]).find(t=>t.id===e.id);n&&(t=this._furnSectionSlug(n))}if(!t){this._identifyHandled=e.at;return}let n=this._collapsed.delete(t);if(Yr.has(t)){let r=this._groupByRoom([{x:e.x,y:e.y}])[0];r?.id&&this._collapsed.delete(this._roomGroupKey(t,r.id))&&(n=!0)}n&&(this._persistCollapsed(),this.requestUpdate());let r=this.querySelector(`[data-item-row="${e.id}"]`);if(r){this._identifyHandled=e.at,this._identifyRetries=0,r.scrollIntoView({block:`center`}),r.classList.add(`identify-flash`),setTimeout(()=>r.classList.remove(`identify-flash`),1500);return}this._identifyRetries++<4?requestAnimationFrame(()=>this.requestUpdate()):(this._identifyRetries=0,this._identifyHandled=e.at)}_maybeFocusNewlyPlaced(){let e=this.planner.newlyPlacedFocus;if(!e){this._focusRetries=0;return}if(typeof window<`u`&&window.innerWidth<900){this.planner.newlyPlacedFocus=null,this._focusRetries=0;return}let t=this.querySelector(`input[data-label-for="${e.id}"]`);if(t){this.planner.newlyPlacedFocus=null,this._focusRetries=0,t.focus(),t.select();return}this._focusRetries++<3?requestAnimationFrame(()=>this.requestUpdate()):(this._focusRetries=0,this.planner.newlyPlacedFocus=null)}_roomGroupsCtx(){if(this._rgCache&&this._rgCache.token===this._rgToken)return this._rgCache;let e=this.planner.floor(),t=(e.rooms??[]).slice().sort((e,t)=>e.name.localeCompare(t.name)),n=t.length?Qe(e.walls??[]):[];return this._rgCache={token:this._rgToken,loops:n,rooms:t},this._rgCache}_groupByRoom(e){let{loops:t,rooms:n}=this._roomGroupsCtx();if(n.length===0)return e.length?[{id:``,label:``,items:e}]:[];let r=new Map,i=[];for(let a of e){let e=_e(n,t,a.x,a.y);e?(r.get(e.id)??r.set(e.id,[]).get(e.id)).push(a):i.push(a)}let a=[];for(let e of n){let t=r.get(e.id);t&&t.length&&a.push({id:e.id,label:_r(e,this.planner.roomAreaName(e)).text,items:t})}if(i.length){let e=this.planner.floor(),t=Bt(e.outdoor)?qn(e.outdoor,this.planner.areaName(e.outdoor?.haAreaId)):`— No room —`;a.push({id:`none`,label:t,items:i})}return a}_roomGroupHeader(e,t,n){return e?I`<div class="collapsible-header" role="button" tabindex="0"
                  aria-expanded=${n?`false`:`true`}
                  style="font-size:10px;color:var(--text-dim);text-transform:uppercase;
                         letter-spacing:0.06em;padding:6px 0 2px;opacity:0.85"
                  @click=${()=>this._toggleCollapsed(t)}>
                <span style="flex:1">${e}</span>
                <span class="collapse-arrow" style="transition:transform 0.15s;
                      ${n?``:`transform:rotate(90deg)`}">▸</span>
              </div>`:P}_groupedList(e,t,n){return this._groupByRoom(t).map(t=>{let r=t.id?this._roomGroupKey(e,t.id):``,i=!!r&&this._collapsed.has(r);return I`
        ${this._roomGroupHeader(t.label,r,i)}
        ${i?P:t.items.map(n)}
      `})}_autoExpandActive(){let e=this.planner,t=e=>{this._collapsed.delete(e)&&this._persistCollapsed()},n={sensors:e.store.activeSensorId??null,motion:e.activeMotionId??null,env:e.activeEnvId??null,ble:e.activeBleId??null,cameras:e.activeCameraId??null,pzones:e.activePZoneId??null,ground:e.activeGroundAreaId??null,voids:e.activeVoidAreaId??null,people:e.activePersonId??null,roamers:e.activeRoamerId??null,furniture:null,plants:null,appliances:null};if(e.activeFurnitureId){let t=(e.floor().furniture??[]).find(t=>t.id===e.activeFurnitureId);t&&(n[this._furnSectionSlug(t)]=e.activeFurnitureId)}let r=this._lastActiveSnapshot;for(let e of Object.keys(n))n[e]&&n[e]!==r[e]&&t(e);this._lastActiveSnapshot=n}render(){this._rgToken++,this._rgCache=null,this._autoExpandActive();let e=this.planner.floor();return I`
      <div style="width:250px;flex-shrink:0;border-right:1px solid var(--border);
                  background:var(--surface);overflow-y:auto;overflow-x:hidden;
                  display:flex;flex-direction:column;height:100%;min-height:0">
        ${this._floorSelect()}
        ${this._collapseAllRow()}
        ${this._floorToolsSection()}
        ${this._layers2dSection()}
        ${this._roomsSection()}
        ${this._dimensionsSection()}
        ${this._rulersSection()}
        ${this._toolsSection()}

        ${this._section(`sensors`,`mmWave Sensors`,()=>I`
          ${e.sensors.length===0?I`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
                No mmWave sensors yet — pick the mmWave tool and click the floor.
              </div>`:this._groupedList(`sensors`,e.sensors,e=>this._sensorListItem(e))}
        `)}

        ${this._motionSensorsSection()}
        ${this._envSensorsSection()}
        ${this._infoCardsSection()}
        ${this._actionButtonsSection()}
        ${this._bleProxiesSection()}
        ${this._alarmPanelsSection()}
        ${this._calendarPanelsSection()}
        ${this._thermostatsSection()}
        ${this._safetySensorsSection()}
        ${this._alertBeaconsSection()}
        ${this._robotsSection()}
        ${this._camerasSection()}
        ${this._projectorsSection()}
        ${this._valvesSection()}
        ${this._sprinklersSection()}
        ${this._flagpolesSection()}
        ${this._solarSection()}
        ${this._plugsSection()}
        ${this._presenceZonesSection()}
        ${this._groundSection()}
        ${this._poolsSection()}
        ${this._voidSection()}
        ${this._peopleSection()}
        ${this._roamersSection()}
        ${this._doorsSection()}
        ${this._windowsSection()}
        ${this._furnitureSection()}
        ${this._customObjectsSection()}
        ${this._fixturesSection()}
        ${this._geoSection()}
        ${this._neighborhoodSection()}
        ${this._model3dSection()}
        ${this._bgSection()}
      </div>
    `}_haFloorRow(e){let t=this.planner,n=t.haFloors();return I`
      <div style="display:flex;align-items:center;gap:5px;padding:0 6px 4px 6px"
           @click=${e=>e.stopPropagation()}>
        <span style="color:var(--text-dim);font-size:10px;flex:1"
              title="Bind this Diorama floor to a Home Assistant floor. Room → area dropdowns are then scoped to that floor's areas.">Home Assistant floor</span>
        ${n.length===0?I`<span style="color:var(--text-dim);font-size:10px;font-style:italic"
                       data-ha-floor-empty>${t.haAreaRegistryLoaded?`(no Home Assistant floors)`:`loading…`}</span>`:I`
            <select data-ha-floor-select
                    style="width:130px;background:#111;color:var(--text);border:1px solid var(--border);
                           border-radius:4px;padding:2px 4px;font-size:11px"
                    .value=${e.haFloorId??``}
                    @change=${n=>{e.haFloorId=n.target.value||void 0,t.save(),t.emitConfig()}}>
              <option value="" ?selected=${!e.haFloorId}>— none —</option>
              ${n.map(t=>I`
                <option value=${t.floor_id} ?selected=${e.haFloorId===t.floor_id}>${t.name}</option>`)}
            </select>`}
      </div>`}_floorSelect(){let e=this.planner,t=e.store.floors;return I`
      <div class="section" data-floor-select>
        <h3 class="section-caption" style="display:flex;align-items:center">
          <span style="flex:1">Floors</span>
        </h3>
        <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:6px">
          ${ot(t).map(t=>{let n=t.id===e.store.currentFloorId,r=t.disabled?`hide`:t.peek2d?`peek`:`show`;return I`
              <div data-floor-row=${t.id}
                   style="display:flex;align-items:center;gap:3px;padding:4px 6px;border-radius:5px;
                          cursor:pointer;opacity:${t.disabled?`0.5`:`1`};
                          background:${n?`var(--accent)`:`#1a1a1a`};
                          border:1px solid ${n?`var(--accent)`:`var(--border)`}"
                   @click=${()=>e.switchFloor(t.id)}>
                <span style="flex:1;min-width:0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${t.name} — ${D(t.w,e.store.imperial)} × ${D(t.d,e.store.imperial)}${r===`hide`?I`<span style="color:var(--text-dim)"> (disabled)</span>`:r===`peek`?I`<span style="color:var(--text-dim)"> (peek)</span>`:P}
                </span>
              </div>`})}
        </div>
        <div style="color:var(--text-dim);font-size:10px;line-height:1.35">
          Add, rename, resize or delete floors in <strong style="color:var(--text)">Settings ▸ Floor Plan</strong>.
        </div>
      </div>
    `}_floorToolsSection(){let e=this.planner,t=e.store.floors,n=e.floor(),r=t.indexOf(n),i=n.disabled?`hide`:n.peek2d?`peek`:`show`;return this._section(`floortools`,`Floor tools`,()=>I`
        <div style="color:var(--text-dim);font-size:10px;margin:-2px 0 6px">
          Acting on <strong style="color:var(--text)">${n.name}</strong>
        </div>
        <div class="row" style="margin-top:6px">
          <label title="Move this floor up or down the story stack. The list above is ordered highest story first.">Order</label>
          <button class="btn btn-sm" style="flex:1" title="Move up a story" data-floor-up
                  ?disabled=${r===t.length-1}
                  @click=${()=>e.moveFloor(n.id,1)}>▲ Up</button>
          <button class="btn btn-sm" style="flex:1" title="Move down a story" data-floor-down
                  ?disabled=${r===0}
                  @click=${()=>e.moveFloor(n.id,-1)}>▼ Down</button>
        </div>
        <div class="row">
          <label title="Show / Peek / Hide this floor">Visibility</label>
          <button class="btn btn-sm" data-floor-vis
                  style="flex:1;display:inline-flex;align-items:center;justify-content:center;
                         gap:4px;white-space:nowrap;min-height:24px;line-height:1"
                  title=${i===`show`?`Shown — enabled. Click to Peek (draw this floor’s outline as a reference underlay on other floors)`:i===`peek`?`Peek — outline drawn as a 2D reference underlay on other floors. Click to Hide (disable)`:`Hidden — disabled (out of kiosk/view picker, glass-house stack, BLE solve). Click to Show`}
                  @click=${()=>e.cycleFloorVisibility(n.id)}>
            ${i===`show`?I`👁 Shown`:i===`peek`?I`${this._peekGlyph()} Peek`:I`🙈 Hidden`}
          </button>
        </div>
        <div style="display:flex;align-items:center;gap:5px;padding:2px 6px 4px 6px">
          <span style="color:var(--text-dim);font-size:10px;flex:1"
                title="Height of this floor's slab above the WORLD GROUND PLANE. The ground plane is fixed — floors sit relative to it — so selecting a floor (or glass house) never moves the ground. Negative = below grade; the ground plane may bisect a floor. Blank = auto (story order × 3000 mm).">Elevation above ground (mm)</span>
          <input type="number" step="100" data-floor-elev
                 style="width:82px;background:#111;color:var(--text);border:1px solid var(--border);
                        border-radius:4px;padding:2px 4px;font-size:11px"
                 placeholder=${`auto: ${c(t,n.id)}`}
                 .value=${n.elevationMm==null?``:String(n.elevationMm)}
                 @change=${t=>{let r=t.target.value.trim(),i=r===``?void 0:Number(r);n.elevationMm=i!=null&&Number.isFinite(i)?i:void 0,e.save(),e.emitConfig()}}>
        </div>
        ${this._haFloorRow(n)}
        <div style="margin-top:8px">
          <div style="color:var(--text-dim);font-size:11px;margin-bottom:3px">Rotate plan (set a new top)</div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-sm" style="flex:1" title="Rotate 15° counter-clockwise"
                    @click=${()=>e.rotateFloorContent(-15)}>↺ 15°</button>
            <button class="btn btn-sm" style="flex:1" title="Rotate 1° counter-clockwise"
                    @click=${()=>e.rotateFloorContent(-1)}>↺ 1°</button>
            <button class="btn btn-sm" style="flex:1" title="Rotate 1° clockwise"
                    @click=${()=>e.rotateFloorContent(1)}>↻ 1°</button>
            <button class="btn btn-sm" style="flex:1" title="Rotate 15° clockwise"
                    @click=${()=>e.rotateFloorContent(15)}>↻ 15°</button>
          </div>
          <div style="color:var(--text-dim);font-size:10px;line-height:1.35;margin-top:4px">
            Rotates all content on this floor (one undo step per click). mmWave sensor mount
            angles live in the firmware — re-check sensor headings after rotating.
            Multi-floor homes: rotate each floor equally.
          </div>
        </div>
        <div style="margin-top:8px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <span style="color:var(--text-dim);font-size:11px;flex:1">Move plan</span>
            <select title="Nudge distance (structural millimetres/metres — ignores the imperial setting)"
                    style="background:#111;color:var(--text);border:1px solid var(--border);
                           border-radius:4px;padding:2px 4px;font-size:11px"
                    .value=${String(this._moveStep)}
                    @change=${e=>this._setMoveStep(Number(e.target.value))}>
              <option value="10">10 mm</option>
              <option value="100">100 mm</option>
              <option value="500">500 mm</option>
              <option value="1000">1 m</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
            <button class="btn btn-sm" title="Move plan up (+Y)"
                    @click=${()=>this._nudgePlan(0,this._moveStep)}>↑</button>
            <button class="btn btn-sm" title="Move plan down (−Y)"
                    @click=${()=>this._nudgePlan(0,-this._moveStep)}>↓</button>
            <button class="btn btn-sm" title="Move plan left (−X)"
                    @click=${()=>this._nudgePlan(-this._moveStep,0)}>←</button>
            <button class="btn btn-sm" title="Move plan right (+X)"
                    @click=${()=>this._nudgePlan(this._moveStep,0)}>→</button>
          </div>
          <div style="color:var(--text-dim);font-size:10px;line-height:1.35;margin-top:4px">
            Moves all content on this floor (mm are structural units). One undo step per click.
          </div>
        </div>
        <details style="margin-top:8px">
          <summary style="cursor:pointer;font-size:11px;color:var(--text-dim);padding:2px 0">
            This floor's 3D look (overrides global)
          </summary>
          ${this._floorLookOverrides(e.store.scene3d??{})}
        </details>
    `)}_collapseAllRow(){let e=qr.every(e=>this._collapsed.has(e)),t=e=>{for(let t of qr)e?this._collapsed.add(t):this._collapsed.delete(t);this._persistCollapsed(),this.requestUpdate()};return I`
      <div style="display:flex;gap:4px;padding:8px 12px;border-bottom:1px solid var(--border)">
        <button class="btn btn-sm ${e?`active`:``}" style="flex:1"
                data-collapse-all title="Collapse every section below (the floor list stays)"
                @click=${()=>t(!0)}>⌃ Collapse all</button>
        <button class="btn btn-sm" style="flex:1"
                data-expand-all title="Expand every section below"
                @click=${()=>t(!1)}>⌄ Expand all</button>
      </div>
    `}_toolGroups(){let e=new Map(Gr.map(e=>[e.id,e])),t=new Set,n=Kr.map(n=>{let r=n.tools.map(n=>(t.add(n),e.get(n))).filter(e=>!!e);return{label:n.label,items:r}}).filter(e=>e.items.length>0),r=Gr.filter(e=>!t.has(e.id));return r.length&&n.push({label:`Other`,items:r}),n}_toolsSection(){let e=this.planner,t=this._toolGroups(),n=e=>I`
      <div class="tool-cat section-caption" style="font-size:10px;text-transform:uppercase;
                  letter-spacing:0.06em;color:var(--text-dim);opacity:0.75;margin:8px 0 3px 0">${e}</div>`;return this._section(`tools`,`Tools`,()=>I`
      ${t.map(t=>I`
        ${n(t.label)}
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${t.items.map(t=>I`
            <button class="btn ${e.tool===t.id?`active`:``}"
                    @click=${()=>e.setTool(t.id)}>${t.label}</button>
          `)}
        </div>
        ${t.label===`Structure`?I`
          ${e.tool===`wall`?I`
            <div class="row" style="margin-top:6px">
              <label>Wall type</label>
              <select .value=${e.pendingWallKind}
                      @change=${t=>{e.pendingWallKind=t.target.value,this.requestUpdate()}}>
                <option value="full">Full wall (9 ft)</option>
                <option value="half">Half wall</option>
                <option value="railing">Railing / banister (3 ft)</option>
                <option value="invisible">Invisible (floor boundary)</option>
                <option value="fence_picket">Picket fence</option>
                <option value="fence_privacy">Privacy fence</option>
                <option value="fence_chainlink">Chain-link fence</option>
                <option value="hedge">Hedge</option>
              </select>
            </div>
          `:P}
          ${this._wallEditPrefs()}
          ${e.floor().walls.length?I`
            <div class="row" style="margin-top:6px">
              <label>Walls</label>
              <button class="btn" style="font-size:10px;padding:2px 6px;flex:1"
                      title="Toggle canvas lock for every wall on this floor"
                      @click=${()=>{let t=e.floor(),n=t.walls.some(e=>!e.locked);t.walls.forEach(e=>{e.locked=n}),e.save(),e.emitConfig()}}>
                ${e.floor().walls.every(e=>e.locked)?`🔓 Unlock all walls`:`🔒 Lock all walls`}
              </button>
            </div>
          `:P}
        `:P}
        ${t.label===`Furniture & decor`&&e.tool===`furniture`?I`
          <div class="row" style="margin-top:6px">
            <label>Type</label>
            <select .value=${e.pendingCustomObjectId?`custom:`+e.pendingCustomObjectId:e.pendingFurnitureKind}
                    @change=${t=>{let n=t.target.value;e.pendingVehicleModelId=null,n.startsWith(`custom:`)?e.pendingCustomObjectId=n.slice(7):(e.pendingFurnitureKind=n,e.pendingCustomObjectId=null),this.requestUpdate()}}>
              ${this._kindOptions(e.pendingCustomObjectId?`custom:`+e.pendingCustomObjectId:e.pendingFurnitureKind)}
            </select>
          </div>
        `:P}
      `)}
      <div data-tool-hint style="border-top:1px solid var(--border);margin-top:8px;padding-top:6px;
                  color:var(--text-dim);font-size:10px;line-height:1.4">
        ${this._toolHint(e.tool)}
      </div>
      <div style="color:var(--text-dim);font-size:10px;margin-top:6px;line-height:1.4;font-style:italic">
        Tip: the bar along the bottom of the screen is the <em>visual picker</em> — category
        tabs across the top, then a row of cards showing a live 3D preview of each item, and
        a chip row underneath for that item's variants (door / window / wall / light / ground
        kinds). Clicking a card both arms the tool and selects the variant.
        Rooms, geo landmarks and neighborhood exclusions are armed from their own sections.
        ${e.hotkeysEnabled?P:I`<br>Keyboard shortcuts are OFF (Settings ▸ Display).`}
      </div>
    `)}_wallEditPrefs(){let e=this.planner,t=(e,t,n)=>I`
      <label style="display:flex;align-items:center;gap:5px;font-size:11px;cursor:pointer">
        <input type="checkbox" .checked=${t}
               @change=${e=>{n(e.target.checked),this.requestUpdate()}}>
        ${e}
      </label>`;return I`
      <div style="margin-top:8px;padding-top:6px;border-top:1px solid var(--border)">
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px">Wall editing</div>
        <div style="display:flex;flex-direction:column;gap:3px">
          ${t(`15° angle snap`,e.wallAngleSnap,t=>e.setWallAngleSnap(t))}
          ${t(`Grid snap`,e.wallGridSnap,t=>e.setWallGridSnap(t))}
          ${t(`Weld ends`,e.wallWeld,t=>e.setWallWeld(t))}
        </div>
        <div style="color:var(--text-dim);font-size:10px;margin-top:4px;font-style:italic;line-height:1.4">
          Hold Alt while drawing/dragging for free placement.
        </div>
      </div>`}_armedHint(e,t){return I`
      <div><strong style="color:var(--text)">Click to place:</strong> ${e}</div>
      <div style="margin-top:3px">${t}</div>`}_toolHint(e){let t=this.planner;switch(e){case`furniture`:{let e=t.pendingVehicleModelId?ee(t.pendingVehicleModelId):null,n=e??(t.pendingCustomObjectId?(t.store.customObjects??[]).find(e=>e.id===t.pendingCustomObjectId)??null:null),r=n??y[t.pendingFurnitureKind],i=n?n.label?.trim()||(e?`Vehicle`:`Custom object`):r?.label??t.pendingFurnitureKind,a=r?` (${Math.round(r.w)} × ${Math.round(r.h)} mm footprint)`:``,o=e?` — vehicle model`:n?` — custom object`:``;return this._armedHint(I`<strong style="color:var(--text)">${i}</strong>${a}${o}`,I`To place something else, open the <strong style="color:var(--text)">visual picker</strong>
               in the bar along the bottom of the screen: pick a category tab
               (Seating, Tables, Appliances, Outdoor, …), then click a card — every
               card is a live 3D preview of the real piece. The “Type” dropdown just
               above is the same catalogue as a plain list.`)}case`light`:{let e=Ur.find(e=>e.id===t.pendingLightKind);return this._armedHint(I`${e?.glyph??`💡`} <strong style="color:var(--text)">${e?.label??t.pendingLightKind}</strong> light`,I`Change the fixture style in the bottom <strong style="color:var(--text)">visual picker</strong>
               (Lights tab → the chip row under the cards), or per-fixture in the
               Lights section. Bind it to an entity from its editor.`)}case`door`:{let e=Br.DOOR_KIND_LABELS[t.pendingDoorKind]??t.pendingDoorKind;return this._armedHint(I`<strong style="color:var(--text)">${e}</strong> — hinge lands at the click, and it snaps onto the nearest wall`,I`Change the variant in the bottom <strong style="color:var(--text)">visual picker</strong>
               (Structure tab → the chip row), or with the Kind dropdown on the placed
               door. Drag its end to rotate; bind a binary_sensor / cover to animate it.`)}case`window`:{let e=Wr.find(e=>e.id===t.pendingWindowKind)?.label??t.pendingWindowKind;return this._armedHint(I`<strong style="color:var(--text)">${e}</strong> window — centred on the click, snaps onto the nearest wall`,I`Change the variant in the bottom <strong style="color:var(--text)">visual picker</strong>
               (Structure tab → the chip row), or with the Kind dropdown on the placed
               window. Sill height, glass height and curtains live in its editor.`)}case`ground`:{let e=o[t.pendingGroundKind]?.label??t.pendingGroundKind;return this._armedHint(I`<strong style="color:var(--text)">${e}</strong> ground area — click to add polygon vertices, double-click (or Enter) to finish (3–20 pts). ESC cancels.`,I`Change the covering in the bottom <strong style="color:var(--text)">visual picker</strong>
               (Ground tab → the chip row), or with the Kind dropdown in the Ground &amp;
               Yard section. Set an elevation there to make it a terrace.`)}default:return this._staticToolHint(e)}}_staticToolHint(e){switch(e){case`wall`:return`Click to add vertices. Double-click to finish. (Tip: in Select mode, double-click a wall to cycle full → half → railing → invisible.)`;case`sensor`:return`Click the canvas to drop a mmWave positional sensor.`;case`motion`:return`Click to drop a binary motion sensor (PIR).`;case`env`:return`Click to drop an environmental sensor (temp, humidity, CO₂, …).`;case`infocard`:return`Click to drop an info card. Bind ANY entity to show its value, or switch to clock/date mode. Add value→color rules in the editor.`;case`action`:return`Click to drop an action button. Pick what it fires (script / scene / button / automation / toggle / custom service) in the editor. Clicking it fires the action.`;case`bleproxy`:return`Click to drop a BLE scanner (Bluetooth proxy) puck. Bind it to the physical proxy device.`;case`alarm`:return`Click to drop an alarm keypad. Bind to an alarm_control_panel entity.`;case`calendar`:return`Click to drop a wall calendar (snaps to a wall). Bind one or more calendar.* entities to show upcoming events.`;case`thermostat`:return`Click to drop a thermostat. Bind to a climate entity to control HVAC.`;case`safety`:return`Click to drop a ceiling safety detector or siren beacon. Set kind (smoke / CO / gas / leak / siren) + bind an entity.`;case`alertbeacon`:return`Click to drop a ceiling Alert Beacon. Bind an alert.* (or any binary_sensor) — it pulses red while active, steady amber when acknowledged.`;case`robot`:return`Click to place a robot dock. Set kind (vacuum / mower) + bind a vacuum.* or lawn_mower.* entity; mowers can bind a GPS tracker.`;case`camera`:return`Click to drop a camera. Drag the orange dot to aim it; bind a camera.* entity for the FOV tint + snapshot.`;case`projector`:return`Click to drop a ceiling projector. Pick a target screen (or set rotation) + bind a media_player/switch/light for the beam; click it to toggle projecting.`;case`valve`:return`Click to drop a water valve on a floor pipe. Bind a valve.* (open/close) or switch.* (irrigation zone) entity; clicking it opens/closes it. Water flows while open.`;case`sprinkler`:return`Click to drop an irrigation sprinkler head on the lawn. Bind a switch.*/valve.* zone entity; it sprays a fan/arc while that entity is on. Set the arc, throw, and heading in the sidebar.`;case`flagpole`:return`Click to plant a flagpole in the yard. Pick a flag design, height, and (optionally) bind a percent/cover entity to raise/lower it (half-mast toggle otherwise). The flag waves in 3D.`;case`solar`:return`Click to plant a motorized solar panel in the yard. It tracks the sun all day (yaw + tilt) and parks flat at night; set a base rotation to orient the pedestal and bind a power sensor (W) to show generation. The frame is tinted by the current UV index.`;case`plug`:return`Click to drop a smart plug / outlet (snaps to a wall). Bind a switch.*/light.* load + an optional power sensor; clicking it toggles the outlet.`;case`pzone`:return`Click to add polygon vertices; double-click (or Enter) to finish (≥3 pts). Bind a binary_sensor (FP2 zone / occupancy) — the zone glows when occupied. ESC cancels.`;case`path`:return`Click to add centerline points; double-click (or Enter) to finish (2+ pts). Builds a constant-width path/driveway ribbon (kind defaults to concrete). Edit the width + drag the centerline handles afterward; "Detach shape" converts it to a plain polygon. ESC cancels.`;case`pool`:return`Click to add polygon vertices; double-click (or Enter) to finish (3–20 pts). Drops a pool/spa water body — a sunken basin with bindable heater/pump/light/chemistry. Avatars path around it. ESC cancels.`;case`void`:return`Click to add polygon vertices; double-click (or Enter) to finish (3–12 pts). Cuts a hole in the floor (stairwell / atrium) — avatars route around it unless a stair bridges it. ESC cancels.`;case`ruler`:return`Click two points to measure the distance. Click a wall or furniture piece to anchor an end to it — the ruler stays locked to it as it moves. Point ends drag; enter an exact length in the Rulers panel. ESC cancels a half-placed ruler.`;case`switch`:return`Click to drop a switch (snaps flush to the nearest wall and gangs with its neighbours). Bind it from the Fixtures section.`;case`delete`:return`Click anything to delete.`;default:return`Drag to move. Pull a corner/vertex to resize. Drag the orange dot to rotate.`}}_sensorListItem(e){let t=this.planner,n=t.store.activeSensorId===e.id,r=!!e.deviceSlug;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveSensor(e.id)}>
          <div class="dot"></div>
          <div class="nm">${e.label||`Sensor`}${this._batteryText(t.discBy[e.id]?.hasTarget??t.discBy[e.id]?.targetCount??t.discBy[e.id]?.sensorHeight??null)}</div>
          <div class="badge ${r?`bound`:``}">${r?`HA`:`—`}</div>
        </div>
        ${n?I`${this._activeSensorSection()}${this._haSections()}`:P}
      </div>
    `}_batteryText(e,t=!1){let n=t?this.planner.batteryForDevice(e):this.planner.batteryFor(e);return n==null?P:I`<span style="font-size:10px;margin-left:4px;color:${n<=20?`#ef5350`:`var(--text-dim)`}">🔋 ${Math.round(n)}%</span>`}_lockRow(e){let t=this.planner;return I`
      <div class="row"><label>Lock</label>
        <button class="btn" style="font-size:11px;flex:1"
                title="Locked items can't be moved, rotated, resized, or deleted on the canvas"
                @click=${()=>{e.locked=!e.locked,t.save(),t.emitConfig()}}>
          ${e.locked?`🔒 Locked`:`🔓 Unlocked`}
        </button>
      </div>
    `}_avatarGrid(e,t){let n=e.avatarKind&&e.avatarKind!==`random`?[e.avatarKind]:[],r=new Set(e.avatarKinds??n),i=n=>t(()=>{e.avatarKinds=n.size?[...n]:void 0,e.avatarKind=void 0}),a=e=>{let t=new Set(r);t.has(e)?t.delete(e):t.add(e),i(t)};return I`
      <div class="row" title="3D character models for this sensor's targets. Check several — each person stably picks one. None checked = Adult.">
        <label>Avatars</label>
      </div>
      ${rt().map(({def:e,members:t})=>{let n=t.map(e=>e.id);return I`
          <div class="row" style="margin:2px 0 0">
            <label style="font-size:10px;opacity:0.8">${e.label}</label>
            <span style="flex:1;text-align:right;font-size:10px">
              <button class="btn" style="font-size:10px;padding:1px 6px" @click=${()=>i(new Set([...r,...n]))}>All</button>
              <button class="btn" style="font-size:10px;padding:1px 6px;margin-left:4px" @click=${()=>i(new Set([...r].filter(e=>!n.includes(e))))}>None</button>
            </span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1px 6px;
                      background:rgba(0,0,0,0.2);border-radius:4px;padding:4px 6px;margin:2px 0 4px">
            ${t.map(e=>I`
              <label style="display:flex;align-items:center;gap:4px;font-size:10px;
                            color:var(--text);cursor:pointer;white-space:nowrap;overflow:hidden">
                <input type="checkbox" style="margin:0;flex:none"
                       .checked=${r.has(e.id)}
                       @change=${()=>a(e.id)}>
                ${e.label}
              </label>
            `)}
          </div>
        `})}
    `}_kindOptions(e){let t=[{cat:`seating`,label:`Seating`},{cat:`tables`,label:`Tables & counters`},{cat:`bedroom`,label:`Bedroom`},{cat:`storage`,label:`Storage`},{cat:`stairs`,label:`Stairs & platforms`},{cat:`decor`,label:`Decor & misc`},{cat:`plants`,label:`Plants & trees`},{cat:`appliance`,label:`Appliances`},{cat:`bathroom`,label:`Bathroom`},{cat:`outdoor`,label:`Outdoor`},{cat:`theater`,label:`Home theater`},{cat:`vehicle`,label:`Vehicle / garage`},{cat:`furniture`,label:`Furniture (other)`}],n=Object.keys(y),r=this.planner.store.customObjects??[];return I`
      ${t.map(t=>{let r=n.filter(e=>T(y[e])===t.cat);return r.length===0?P:I`
        <optgroup label=${t.label}>
          ${r.map(t=>I`
            <option value=${t} ?selected=${e===t}>${y[t].label}</option>`)}
        </optgroup>`})}
      ${r.length?I`
        <optgroup label="Custom">
          ${r.map(t=>I`
            <option value=${`custom:`+t.id} ?selected=${e===`custom:`+t.id}>${t.label}</option>`)}
        </optgroup>`:P}
    `}_motionSensorsSection(){let e=this.planner.floor();return this._section(`motion`,`Motion Sensors`,()=>I`
        ${e.motionSensors.length===0?I`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet — pick the Motion tool and click the floor.
            </div>`:this._groupedList(`motion`,e.motionSensors,e=>this._motionItem(e))}
    `)}_motionItem(e){let t=this.planner,n=t.activeMotionId===e.id,r=(e.entity_id&&t.hass?.states?t.hass.states[e.entity_id]:null)?.state===`on`,i=!!e.entity_id;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveMotion(e.id)}>
          <div class="dot" style="background:${r?`#ce93d8`:`#ba68c8`};
                                   ${r?`box-shadow:0 0 6px #ce93d8`:``}"></div>
          <div class="nm">${e.label||`Motion`}${this._batteryText(e.entity_id)}</div>
          ${i?I`<div class="badge bound">${r?`ON`:`OFF`}</div>`:I`
                <button class="btn" style="font-size:10px;padding:2px 6px"
                        title="Bind to a Home Assistant entity"
                        @click=${t=>{t.stopPropagation(),this._pickMotionEntity(e)}}>
                  🔗 Bind
                </button>`}
        </div>
        ${n?this._motionEditor(e):P}
      </div>
    `}_motionEditor(e){let n=this.planner,r=e=>{e(),n.save(),n.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label}
                 @input=${t=>r(()=>{e.label=t.target.value})}>
        </div>
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>r(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>r(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Heading (°)</label>
          <input type="number" .value=${String(Math.round(e.heading))}
                 @input=${t=>r(()=>{let n=parseFloat(t.target.value)||0;e.heading=(Math.round(n)%360+360)%360})}>
        </div>
        <div class="row"><label>FOV (°)</label>
          <input type="number" min="5" max="360" .value=${String(Math.round(e.fov))}
                 @input=${t=>r(()=>{let n=parseFloat(t.target.value)||0;e.fov=Math.max(5,Math.min(360,n))})}>
        </div>
        <div class="row"><label>Range (mm)</label>
          <input type="number" min="100" .value=${String(Math.round(e.range))}
                 @input=${t=>r(()=>{let n=parseFloat(t.target.value)||0;e.range=Math.max(100,n)})}>
        </div>
        <div class="row"><label>Color</label>
          <input type="color" .value=${Le(e)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${t=>r(()=>{e.color=t.target.value})}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to default"
                  @click=${()=>r(()=>{e.color=Te.color})}>↺</button>
        </div>
        <div class="row" title="Color of the spinning plumbob above this sensor's AI / demo avatar — per-sensor attribution. Default = this sensor's color, so the avatar matches its source.">
          <label>Plumbob</label>
          <input type="color" .value=${e.plumbobColor||e.color||`#ba68c8`}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${t=>r(()=>{e.plumbobColor=t.target.value})}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to default (this sensor's color)"
                  @click=${()=>r(()=>{e.plumbobColor=void 0})}>✕</button>
        </div>
        <div class="row"><label>Intensity</label>
          <input type="range" min="0" max="2" step="0.05" .value=${String(t(e))}
                 style="flex:1"
                 @input=${t=>r(()=>{e.intensity=parseFloat(t.target.value)||0})}>
          <span style="font-size:10px;color:var(--text-dim);margin-left:4px;min-width:28px;text-align:right">
            ${t(e).toFixed(2)}
          </span>
        </div>
        <div class="row" title="Render a simulated person wandering the room in 3D while presence is detected">
          <label>Avatar</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${()=>r(()=>{e.avatar=!e.avatar})}>
            ${e.avatar?`🧍 On`:`— Off`}
          </button>
        </div>
        <div class="row" title="Always render the avatar in 3D — no entity binding or presence needed. A display/demo presence that wanders the room using this sensor's avatar pool.">
          <label>Demo avatar</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${()=>r(()=>{e.demo=!e.demo})}>
            ${e.demo?`🎬 On (no entity needed)`:`— Off`}
          </button>
        </div>
        ${e.avatar||e.demo?this._avatarGrid(e,r):P}
        ${this._lockRow(e)}
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickMotionEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>r(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let t=n.floor();t.motionSensors=t.motionSensors.filter(t=>t.id!==e.id),n.activeMotionId=null,n.save(),n.emitConfig()}}>Delete</button>
      </div>
    `}_pickMotionEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`binary_sensor`,onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_envSensorsSection(){let e=this.planner.floor();return this._section(`env`,`Environmental Sensors`,()=>I`
        ${e.envSensors.length===0?I`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet — pick the Env tool and click the floor.
              Shows temperature, humidity, CO₂, CO, PM, … from any sensor entity.
            </div>`:this._groupedList(`env`,e.envSensors,e=>this._envItem(e))}
    `)}_envItem(e){let t=this.planner,n=t.activeEnvId===e.id,r=e.entity_id&&t.hass?.states?t.hass.states[e.entity_id]:null,i=cn(De(e,r),r?parseFloat(r.state):NaN),a=!!e.entity_id;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveEnv(e.id)}>
          <div class="dot" style="background:${i}"></div>
          <div class="nm">${e.label||`Env`}${this._batteryText(e.entity_id)}</div>
          ${a?I`<div class="badge bound" style="color:${i}">${te(r)}</div>`:I`
                <button class="btn" style="font-size:10px;padding:2px 6px"
                        title="Bind to a Home Assistant sensor entity"
                        @click=${t=>{t.stopPropagation(),this._pickEnvEntity(e)}}>
                  🔗 Bind
                </button>`}
        </div>
        ${n?this._envEditor(e):P}
      </div>
    `}_envEditor(e){let t=this.planner,n=e.entity_id&&t.hass?.states?t.hass.states[e.entity_id]:null,r=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``}
                 @input=${t=>r(()=>{e.label=t.target.value})}>
        </div>
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>r(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>r(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(xe(e)))}
                 @input=${t=>r(()=>{let n=parseFloat(t.target.value);e.height=isFinite(n)?Math.max(0,n):qe.height})}>
        </div>
        <div class="row"><label>Size</label>
          <input type="range" min=${cr} max=${4} step="0.1"
                 .value=${String(Pe(e))} style="flex:1"
                 @input=${t=>r(()=>{e.scale=parseFloat(t.target.value)||1})}>
          <span style="font-size:10px;color:var(--text-dim);margin-left:4px;min-width:28px;text-align:right">
            ${Pe(e).toFixed(1)}×
          </span>
        </div>
        <div class="row"><label>Kind</label>
          <select @change=${t=>r(()=>{let n=t.target.value;e.kind=n===`auto`?void 0:n})}>
            <option value="auto" ?selected=${!e.kind}>
              Auto (${De(e,n)})
            </option>
            ${Object.keys(d).map(t=>I`
              <option value=${t} ?selected=${e.kind===t}>${d[t].glyph} ${t}</option>`)}
          </select>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        ${n?I`
          <div class="row"><label>Reading</label>
            <span style="font-size:11px;color:var(--text)">${te(n)}</span>
          </div>`:P}
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickEnvEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>r(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.envSensors=n.envSensors.filter(t=>t.id!==e.id),t.activeEnvId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_pickEnvEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,areaFilter:this._areaFilterForPoint(e.x,e.y),onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_infoCardsSection(){let e=this.planner.floor().infoCards??[];return this._section(`info`,`Info Cards`,()=>I`
        ${e.length===0?I`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet — pick the Info tool and click the floor. Bind ANY entity to
              show its live value, or switch to clock/date mode (no entity needed).
            </div>`:this._groupedList(`info`,e,e=>this._infoCardItem(e))}
    `)}_infoCardItem(e){let t=this.planner,n=t.activeInfoId===e.id,r=e.displayMode??`entity`,i=It(e,(e.entity_id&&t.hass?.states?t.hass.states[e.entity_id]:null)??null,{now:new Date,imperial:t.store.imperial}),a=r!==`entity`||!!e.entity_id;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveInfo(e.id)}>
          <div class="dot" style="background:#7fd4ff"></div>
          <div class="nm">${e.label||`Info`}${this._batteryText(e.entity_id)}</div>
          ${a?I`<div class="badge bound" style="color:#7fd4ff">${i}</div>`:I`
                <button class="btn" style="font-size:10px;padding:2px 6px"
                        title="Bind to any Home Assistant entity"
                        @click=${t=>{t.stopPropagation(),this._pickInfoEntity(e)}}>
                  🔗 Bind
                </button>`}
        </div>
        ${n?this._infoCardEditor(e):P}
      </div>
    `}_ruleRows(e,t){let n=this.planner,r=e=>{e(),n.save(),n.emitConfig()},i=[{v:`lt`,label:`<`},{v:`lte`,label:`≤`},{v:`gt`,label:`>`},{v:`gte`,label:`≥`},{v:`eq`,label:`=`},{v:`neq`,label:`≠`},{v:`between`,label:`between`},{v:`contains`,label:`contains`},{v:`regex`,label:`regex`}];return I`
      ${e.map((n,a)=>I`
        <div style="display:flex;gap:3px;align-items:center;margin-bottom:3px">
          <select style="font-size:10px" @change=${e=>r(()=>{n.op=e.target.value})}>
            ${i.map(e=>I`<option value=${e.v} ?selected=${n.op===e.v}>${e.label}</option>`)}
          </select>
          <input style="width:52px;font-size:10px" .value=${String(n.value)}
                 @input=${e=>r(()=>{let t=e.target.value,r=parseFloat(t);n.value=isNaN(r)?t:r})}>
          ${n.op===`between`?I`<input style="width:44px;font-size:10px" placeholder="max" .value=${n.value2??``}
                 @input=${e=>r(()=>{n.value2=parseFloat(e.target.value)||0})}>`:P}
          <input type="color" style="width:26px;padding:0" .value=${n.color??`#ff5252`}
                 @input=${e=>r(()=>{n.color=e.target.value})}>
          <label style="font-size:9px;color:var(--text-dim);display:flex;align-items:center;gap:2px" title="Flash / pulse">
            <input type="checkbox" .checked=${!!n.flash} @change=${e=>r(()=>{n.flash=e.target.checked})}>⚡</label>
          <button class="btn" style="font-size:10px;padding:1px 4px" @click=${()=>r(()=>t(e.filter((e,t)=>t!==a)))}>✕</button>
        </div>`)}
      <button class="btn" style="width:100%;font-size:10px;margin-top:2px" @click=${()=>r(()=>t([...e,{op:`gte`,value:0,color:`#ff5252`}]))}>+ Add rule</button>
    `}_infoCardEditor(e){let t=this.planner,n=e.entity_id&&t.hass?.states?t.hass.states[e.entity_id]:null,r=e=>{e(),t.save(),t.emitConfig()},i=e.displayMode??`entity`,a=()=>e.format??(e.format={}),o=e.rules??[],s=Object.entries(e.format?.mapping??{}).map(([e,t])=>`${e}=${t}`).join(`
`);return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``}
                 @input=${t=>r(()=>{e.label=t.target.value})}>
        </div>
        <div class="row"><label>Mode</label>
          <select @change=${t=>r(()=>{e.displayMode=t.target.value})}>
            ${[`entity`,`clock`,`date`,`clock_date`].map(e=>I`
              <option value=${e} ?selected=${i===e}>${e}</option>`)}
          </select>
        </div>
        <div class="row"><label>Mount</label>
          <select @change=${t=>r(()=>{e.mount=t.target.value})}>
            ${[`wall`,`surface`,`floor`].map(t=>I`
              <option value=${t} ?selected=${Mt(e)===t}>${t}</option>`)}
          </select>
        </div>
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>r(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>r(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(Un(e)))}
                 @input=${t=>r(()=>{let n=parseFloat(t.target.value);e.height=isFinite(n)?Math.max(0,n):void 0})}>
        </div>
        <label class="row" style="padding:0"><span style="flex:1;font-size:11px;color:var(--text-dim)">Face camera (billboard)</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${e.billboard!==!1}
                   @change=${t=>r(()=>{e.billboard=t.target.checked})}>
            <span></span></span>
        </label>
        <div class="row"><label>Size</label>
          <input type="range" min=${ye} max=${4} step="0.1"
                 .value=${String(Qn(e))} style="flex:1"
                 @input=${t=>r(()=>{e.fontScale=parseFloat(t.target.value)||1})}>
          <span style="font-size:10px;color:var(--text-dim);margin-left:4px;min-width:28px;text-align:right">
            ${Qn(e).toFixed(1)}×</span>
        </div>

        ${i===`entity`?I`
          <div style="border-top:1px solid var(--border);margin:6px 0 4px;padding-top:4px;font-size:10px;color:var(--text-dim)">Entity + format</div>
          <div class="row"><label>HA entity</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${e.entity_id||`— unbound —`}
            </span>
          </div>
          ${n?I`<div class="row"><label>Reading</label>
            <span style="font-size:11px;color:var(--text)">${It(e,n,{now:new Date,imperial:t.store.imperial})}</span></div>`:P}
          <div style="display:flex;gap:4px;margin:2px 0 4px">
            <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickInfoEntity(e)}>
              ${e.entity_id?`Rebind`:`Bind`}…</button>
            ${e.entity_id?I`<button class="btn" style="font-size:11px"
                    @click=${()=>r(()=>{e.entity_id=null})}>Unbind</button>`:P}
          </div>
          <div class="row"><label>Decimals</label>
            <input type="number" min="0" max="6" placeholder="auto" .value=${e.format?.decimals??``}
                   @input=${e=>r(()=>{let t=e.target.value;a().decimals=t===``?void 0:Math.max(0,Math.min(6,parseInt(t,10)||0))})}>
          </div>
          <div class="row"><label>Unit override</label>
            <input type="text" placeholder="(use entity unit)" .value=${e.format?.unit??``}
                   @input=${e=>r(()=>{let t=e.target.value;a().unit=t===``?void 0:t})}>
          </div>
          <label class="row" style="padding:0"><span style="flex:1;font-size:11px;color:var(--text-dim)">Show unit</span>
            <span class="mini-toggle"><input type="checkbox" .checked=${e.format?.showUnit!==!1}
                   @change=${e=>r(()=>{a().showUnit=e.target.checked})}><span></span></span>
          </label>
          <div class="row"><label>Prefix</label>
            <input type="text" .value=${e.format?.prefix??``}
                   @input=${e=>r(()=>{a().prefix=e.target.value||void 0})}>
          </div>
          <div class="row"><label>Suffix</label>
            <input type="text" .value=${e.format?.suffix??``}
                   @input=${e=>r(()=>{a().suffix=e.target.value||void 0})}>
          </div>
          <label class="row" style="padding:0"><span style="flex:1;font-size:11px;color:var(--text-dim)">Relative time (timestamps)</span>
            <span class="mini-toggle"><input type="checkbox" .checked=${!!e.format?.relativeTime}
                   @change=${e=>r(()=>{a().relativeTime=e.target.checked})}><span></span></span>
          </label>
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px">State mapping (one <code>raw=display</code> per line)</div>
          <textarea rows="2" style="width:100%;font-size:11px;box-sizing:border-box"
                    .value=${s}
                    @input=${e=>r(()=>{let t=e.target.value.split(`
`),n={};for(let e of t){let t=e.indexOf(`=`);t>0&&(n[e.slice(0,t).trim()]=e.slice(t+1).trim())}a().mapping=Object.keys(n).length?n:void 0})}></textarea>

          <div style="border-top:1px solid var(--border);margin:6px 0 4px;padding-top:4px;font-size:10px;color:var(--text-dim)">Value → color rules (first match wins)</div>
          ${this._ruleRows(o,t=>{e.rules=t})}
        `:I`
          <div class="row"><label>Time format</label>
            <select @change=${t=>r(()=>{e.clockFormat=t.target.value})}>
              ${Object.keys(ae).map(t=>I`<option value=${t} ?selected=${(e.clockFormat??`12h`)===t}>${t}</option>`)}
            </select>
          </div>
          <div class="row"><label>Date format</label>
            <select @change=${t=>r(()=>{e.dateFormat=t.target.value})}>
              ${Object.keys(he).map(t=>I`<option value=${t} ?selected=${(e.dateFormat??`medium`)===t}>${t}</option>`)}
            </select>
          </div>
          <div class="row"><label>Time zone</label>
            <input type="text" placeholder="(host local, e.g. America/New_York)" .value=${e.timeZone??``}
                   @input=${t=>r(()=>{e.timeZone=t.target.value||void 0})}>
          </div>
        `}

        ${this._lockRow(e)}
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.infoCards=(n.infoCards??[]).filter(t=>t.id!==e.id),t.activeInfoId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_pickInfoEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:null,onPick:t=>{e.entity_id=t,e.displayMode||(e.displayMode=`entity`),this.planner.save(),this.planner.emitConfig()}}}))}_actionButtonsSection(){let e=this.planner.floor().actionButtons??[];return this._section(`actions`,`Action Buttons`,()=>I`
        ${e.length===0?I`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet — pick the Action tool and click the floor. Fire a script,
              scene, button, automation, entity toggle, or any custom service.
            </div>`:this._groupedList(`actions`,e,e=>this._actionButtonItem(e))}
    `)}_actionButtonItem(e){let t=this.planner,r=t.activeActionId===e.id,i=n(e),a=i===`custom`?`${e.domain??`?`}.${e.service??`?`}`:e.entity_id||`— unbound —`,o=i===`custom`?null:Xn(e.entity_id?t.hass?.states?.[e.entity_id]:null);return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${r?`sel`:``}" @click=${()=>t.setActiveAction(e.id)}>
          <div class="dot" style="background:${lt(e)}">${Re(e)}</div>
          <div class="nm">${e.label||`Action`}</div>
          <button class="btn" style="font-size:10px;padding:2px 6px" title="Fire this action now"
                  @click=${n=>{n.stopPropagation(),t.fireAction(e,!0)}}>Test</button>
        </div>
        ${o?I`<div style="font-size:10px;color:var(--text-dim);padding:0 8px 3px 30px">${o}</div>`:P}
        ${r?this._actionButtonEditor(e,a):P}
      </div>
    `}_actionButtonEditor(e,t){let r=this.planner,i=e=>{e(),r.save(),r.emitConfig()},a=n(e),o=[{v:`toggle`,label:`Toggle entity`},{v:`script`,label:`Run script`},{v:`scene`,label:`Activate scene`},{v:`button_press`,label:`Press button`},{v:`automation_trigger`,label:`Trigger automation`},{v:`custom`,label:`Custom service (advanced)`}],s=a===`script`?`script`:a===`scene`?`scene`:a===`automation_trigger`?`automation`:a===`button_press`?[`button`,`input_button`]:null,c=e.serviceData??``,l=``;if(c.trim())try{let e=JSON.parse(c);(!e||typeof e!=`object`||Array.isArray(e))&&(l=`must be a JSON object`)}catch(e){l=String(e.message||`invalid JSON`)}return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``}
                 @input=${t=>i(()=>{e.label=t.target.value})}>
        </div>
        <div class="row"><label>Action</label>
          <select @change=${t=>i(()=>{e.actionKind=t.target.value})}>
            ${o.map(e=>I`<option value=${e.v} ?selected=${a===e.v}>${e.label}</option>`)}
          </select>
        </div>
        ${a===`custom`?I`
          <div style="font-size:10px;color:#ffb74d;margin:2px 0 4px">⚠ Calls ANY Home Assistant service — only type what you trust.</div>
          <div class="row"><label>Domain</label>
            <input type="text" placeholder="e.g. light" .value=${e.domain??``}
                   @input=${t=>i(()=>{e.domain=t.target.value||void 0})}>
          </div>
          <div class="row"><label>Service</label>
            <input type="text" placeholder="e.g. turn_on" .value=${e.service??``}
                   @input=${t=>i(()=>{e.service=t.target.value||void 0})}>
          </div>
          <div class="row"><label>Target entity</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.entity_id||`(optional)`}</span>
            <button class="btn" style="font-size:10px" @click=${()=>this._pickActionEntity(e,null)}>Pick</button>
          </div>
        `:I`
          <div class="row"><label>Target</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t}</span>
          </div>
          <div style="display:flex;gap:4px;margin:2px 0 4px">
            <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickActionEntity(e,s)}>
              ${e.entity_id?`Rebind`:`Bind`}…</button>
            ${e.entity_id?I`<button class="btn" style="font-size:11px"
                    @click=${()=>i(()=>{e.entity_id=null})}>Unbind</button>`:P}
          </div>
        `}
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px">Service data (JSON — custom data / scene transition / script variables)</div>
        <textarea rows="2" style="width:100%;font-size:11px;box-sizing:border-box;${l?`border-color:#ef5350`:``}"
                  placeholder=${`{ }`} .value=${c}
                  @input=${t=>i(()=>{e.serviceData=t.target.value||void 0})}></textarea>
        ${l?I`<div style="font-size:10px;color:#ef5350">${l}</div>`:P}
        <div class="row"><label>Glyph</label>
          <input type="text" maxlength="3" placeholder=${Re(e)} .value=${e.icon??``}
                 @input=${t=>i(()=>{e.icon=t.target.value||void 0})}>
        </div>
        <div class="row"><label>Cap color</label>
          <input type="color" .value=${lt(e)}
                 @input=${t=>i(()=>{e.color=t.target.value})}>
        </div>
        <label class="row" style="padding:0"><span style="flex:1;font-size:11px;color:var(--text-dim)">Wall mount (snap to wall)</span>
          <span class="mini-toggle"><input type="checkbox" .checked=${e.wallMount!==!1}
                 @change=${t=>i(()=>{e.wallMount=t.target.checked,e.wallMount&&pt(e,r.floor().walls)})}><span></span></span>
        </label>
        <label class="row" style="padding:0"><span style="flex:1;font-size:11px;color:var(--text-dim)">Confirm before firing</span>
          <span class="mini-toggle"><input type="checkbox" .checked=${!!e.confirm}
                 @change=${t=>i(()=>{e.confirm=t.target.checked})}><span></span></span>
        </label>
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>i(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>i(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(ht(e)))}
                 @input=${t=>i(()=>{let n=parseFloat(t.target.value);e.height=isFinite(n)?Math.max(0,n):void 0})}>
        </div>
        <button class="btn" style="width:100%;margin-top:4px" @click=${()=>r.fireAction(e,!0)}>▶ Test fire</button>
        ${this._lockRow(e)}
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let t=r.floor();t.actionButtons=(t.actionButtons??[]).filter(t=>t.id!==e.id),r.activeActionId=null,r.save(),r.emitConfig()}}>Delete</button>
      </div>
    `}_pickActionEntity(e,t){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:t,onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_bleProxiesSection(){let e=this.planner,t=e.floor().bleProxies??[],n=e.store.bermudaEnabled===!1;return this._section(`ble`,`BLE Proxies`,()=>I`
        ${n?I`
          <div style="color:var(--text-dim);font-size:10px;padding:2px 0 6px;opacity:0.7;font-style:italic">
            (Bermuda integration disabled in Settings)
          </div>`:P}
        ${t.length===0?I`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet — pick the BLE tool and click the floor. Bind each puck to
              the physical Bluetooth proxy device so trilateration can place people.
            </div>`:this._groupedList(`ble`,t,e=>this._bleItem(e))}
    `)}_bleItem(e){let t=this.planner,n=t.activeBleId===e.id,r=!!e.haDeviceId;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveBle(e.id)}>
          <div class="dot" style="background:${ir.color}"></div>
          <div class="nm">${e.name||`Proxy`}${this._batteryText(e.haDeviceId,!0)}</div>
          <div class="badge ${r?`bound`:``}">${r?`📶`:`—`}</div>
        </div>
        ${n?this._bleEditor(e):P}
      </div>
    `}_bleEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=e.haDeviceId?this._deviceNames[e.haDeviceId]||e.haDeviceId:null;return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Name</label>
          <input type="text" data-label-for=${e.id} .value=${e.name}
                 @input=${t=>n(()=>{e.name=t.target.value})}>
        </div>
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>n(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>n(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(gn(e)))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.height=isFinite(n)?Math.max(0,n):ir.height})}>
        </div>
        <div class="row"><label>Hidden</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${!!e.hidden}
                   @change=${t=>n(()=>{e.hidden=t.target.checked})}>
            <span></span>
          </span>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>Proxy device</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${r||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickBleDevice(e)}>
            ${e.haDeviceId?`Rebind`:`Bind`} device…
          </button>
          ${e.haDeviceId?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.haDeviceId=null})}>Unbind</button>
          `:P}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.bleProxies=(n.bleProxies??[]).filter(t=>t.id!==e.id),t.activeBleId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}async _pickBleDevice(e){let t=this.planner.hass;if(!t)return;let n=[];try{n=await t.getDevices()}catch{}let r=n.map(e=>{let t=e.name_by_user||e.name||e.id;this._deviceNames[e.id]=t;let n=(e.connections??[]).map(([,e])=>e).filter(Boolean);return{id:e.id,name:t,subtitle:n.length?n.join(`, `):void 0}}).sort((e,t)=>e.name.localeCompare(t.name));this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{devices:r,title:`Pick the Bluetooth proxy device`,onPick:t=>{e.haDeviceId=t,this.planner.save(),this.planner.emitConfig()}}}))}_alarmPanelsSection(){let e=this.planner.floor().alarmPanels??[];return e.length===0?P:this._section(`alarm`,`Alarm`,()=>this._groupedList(`alarm`,e,e=>this._alarmItem(e)))}_alarmItem(e){let t=this.planner,n=t.activeAlarmId===e.id,r=t.effectiveState(e)?.state??null,i=Vn(r),a=r?r.replace(`armed_`,``).replace(/_/g,` `):e.entity_id?`n/a`:`—`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveAlarm(e.id)}>
          <div class="dot" style="background:${r?i:`#90a4ae`}"></div>
          <div class="nm">${e.label?.trim()||`Alarm`}${this._batteryText(e.entity_id)}</div>
          <div class="badge" style=${r?`color:${i}`:P}>${a}</div>
        </div>
        ${n?this._alarmEditor(e):P}
      </div>
    `}_alarmEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Alarm"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>n(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>n(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(wn(e)))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.height=isFinite(n)?Math.max(0,n):void 0})}>
        </div>
        <div class="row"><label title="Permit arm/disarm from the panel modal. Off = view-only status.">Allow arm/disarm</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${!!e.allowControl}
                   @change=${t=>n(()=>{e.allowControl=t.target.checked})}>
            <span></span>
          </span>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickAlarmEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${e.entity_id?`Click the keypad to open the control modal (arm/disarm needs "Allow arm/disarm").`:`Unbound: the keypad modal sets a local demo state (disarmed / armed home / armed away).`}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.alarmPanels=(n.alarmPanels??[]).filter(t=>t.id!==e.id),t.activeAlarmId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_pickAlarmEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`alarm_control_panel`,onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_calendarPanelsSection(){let e=this.planner.floor().calendarPanels??[];return e.length===0?P:this._section(`calendar`,`Wall Calendar`,()=>this._groupedList(`calendar`,e,e=>this._calendarItem(e)))}_calendarItem(e){let t=this.planner,n=t.activeCalendarId===e.id,r=(t.calendarEvents[e.id]??[]).length,i=(e.calendarIds??[]).length;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveCalendar(e.id)}>
          <div class="dot" style="background:${i?`#f4b73e`:`#90a4ae`}"></div>
          <div class="nm">${e.label?.trim()||`Calendar`}</div>
          <div class="badge">${i?`${r} evt`:`unbound`}</div>
        </div>
        ${n?this._calendarEditor(e):P}
      </div>
    `}_calendarEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=(t.calendarEvents[e.id]??[]).slice(0,4);return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Calendar"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(Rt(e)))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.height=isFinite(n)?Math.max(0,n):void 0})}>
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin:6px 0 2px">Calendars</div>
        ${(e.calendarIds??[]).length===0?I`<div style="font-size:10px;color:var(--text-dim);margin-bottom:4px">— none bound —</div>`:(e.calendarIds??[]).map(t=>I`
            <div class="row" style="align-items:center">
              <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t}</span>
              <button class="btn" style="font-size:11px" @click=${()=>n(()=>{e.calendarIds=(e.calendarIds??[]).filter(e=>e!==t)})}>✕</button>
            </div>`)}
        <button class="btn" style="width:100%;font-size:11px;margin-top:4px" @click=${()=>this._pickCalendarEntity(e)}>
          + Add calendar…
        </button>
        ${r.length?I`
          <div style="font-size:11px;color:var(--text-dim);margin:6px 0 2px">Next events</div>
          ${r.map(e=>I`
            <div style="font-size:10px;color:var(--text);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${e.allDay?`All day`:new Date(e.start).toLocaleString([],{month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`})} · ${e.summary}
            </div>`)}
        `:(e.calendarIds??[]).length?I`
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px">No upcoming events (or still loading…).</div>`:P}
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.calendarPanels=(n.calendarPanels??[]).filter(t=>t.id!==e.id),t.activeCalendarId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_pickCalendarEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`calendar`,onPick:t=>{e.calendarIds||(e.calendarIds=[]),e.calendarIds.includes(t)||e.calendarIds.push(t),this.planner.save(),this.planner.emitConfig()}}}))}_thermostatsSection(){let e=this.planner.floor().thermostats??[];return e.length===0?P:this._section(`thermostats`,`Thermostats`,()=>this._groupedList(`thermostats`,e,e=>this._thermostatItem(e)))}_thermostatItem(e){let t=this.planner,n=t.activeThermoId===e.id,r=t.effectiveState(e),i=r?.state??null,a=St(i),o=r?.attributes?.current_temperature,s=i?`${i.replace(`_`,` `)}${o==null?``:` ${Math.round(Number(o))}°`}`:e.entity_id?`n/a`:`—`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveThermo(e.id)}>
          <div class="dot" style="background:${i?a:`#90a4ae`}"></div>
          <div class="nm">${e.label?.trim()||`Thermostat`}${this._batteryText(e.entity_id)}</div>
          <div class="badge" style=${i?`color:${a}`:P}>${s}</div>
        </div>
        ${n?this._thermostatEditor(e):P}
      </div>
    `}_thermostatEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Thermostat"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>n(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>n(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(er(e)))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.height=isFinite(n)?Math.max(0,n):void 0})}>
        </div>
        <div class="row"><label title="Permit mode/setpoint changes from the panel modal. Off = view-only status.">Allow control</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${e.allowControl!==!1}
                   @change=${t=>n(()=>{e.allowControl=t.target.checked})}>
            <span></span>
          </span>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickThermostatEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${e.entity_id?`Click the thermostat to open the control modal (mode/setpoint needs "Allow control").`:`Unbound: the modal sets a local demo mode + setpoint (off / heat / cool / fan).`}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.thermostats=(n.thermostats??[]).filter(t=>t.id!==e.id),t.activeThermoId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_pickThermostatEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`climate`,areaFilter:this._areaFilterForPoint(e.x,e.y),onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_safetySensorsSection(){let e=this.planner.floor().safetySensors??[];return e.length===0?P:this._section(`safety`,`Safety & sirens`,()=>this._groupedList(`safety`,e,e=>this._safetyItem(e)))}_safetyItem(e){let t=this.planner,n=t.activeSafetyId===e.id,r=e.kind,i=et(r),a=t.effectiveState(e),o=a?.state===`on`,s=r===`co`?`CO`:r===`gas`?`Gas`:r===`leak`?`Leak`:r===`siren`?`Siren`:r===`glass_break`?`Glass break`:`Smoke`,c=o?r===`leak`?`LEAK`:r===`siren`?`SOUNDING`:r===`glass_break`?`BREAK`:`ALARM`:a?r===`leak`?`dry`:r===`siren`?`idle`:`ok`:e.entity_id?`—`:`unbound`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveSafety(e.id)}>
          <div class="dot" style="background:${o?i:`#90a4ae`}"></div>
          <div class="nm">${e.label?.trim()||s}${this._batteryText(e.entity_id)}</div>
          <div class="badge" style=${o?`color:${i};font-weight:700`:P}>${c}</div>
        </div>
        ${n?this._safetyEditor(e):P}
      </div>
    `}_safetyEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=!!e.entity_id,i=t.effectiveState(e)?.state===`on`;return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Kind</label>
          <select .value=${e.kind}
                  @change=${t=>n(()=>{e.kind=t.target.value})}>
            <option value="smoke">Smoke</option>
            <option value="co">CO (carbon monoxide)</option>
            <option value="gas">Gas</option>
            <option value="leak">Leak (floor / water)</option>
            <option value="siren">Siren / alert beacon</option>
            <option value="glass_break">Glass break (acoustic)</option>
          </select>
        </div>
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Detector"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>n(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>n(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickSafetyEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
          ${e.kind===`siren`?I`<button class="btn" style="font-size:11px"
                    ?disabled=${e.allowControl===!1}
                    title=${e.allowControl===!1?`Control is off for this siren — it is a display-only state indicator`:`Sound / silence the siren (bound siren.*/switch.* or a local demo state)`}
                    @click=${()=>t.triggerSiren(e)}>${i?`Silence`:`Sound`}</button>`:I`<button class="btn" style="font-size:11px"
                    ?disabled=${r}
                    title=${r?`bound to HA — state comes from the entity`:`Toggle the local alarm state`}
                    @click=${()=>{r||t.toggleItem(e)}}>Test</button>`}
        </div>
        ${e.kind===`siren`?this._sirenRows(e,n):P}
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${e.kind===`siren`?r?`Bound: state follows the entity. A siren.*/switch.* can be sounded/silenced (Sound/Silence + clicking the beacon); a binary_sensor is display-only.`:`Unbound: Sound/Silence (or clicking the beacon) toggles a local demo state.`:r?`Bound: alarm state follows the binary_sensor (on = alarming).`:`Unbound: Test (or clicking the detector) toggles a local alarm state.`}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.safetySensors=(n.safetySensors??[]).filter(t=>t.id!==e.id),t.activeSafetyId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_sirenRows(e,t){let n=this.planner,r=!!e.entity_id&&e.entity_id.startsWith(`siren.`),i=r?n.effectiveState(e):null,a=r&&oe(i,at.TONES)?dt(i):[],o=r&&oe(i,at.VOLUME_SET),s=r&&oe(i,at.DURATION);return I`
      <div class="row"><label>Allow control</label>
        <input type="checkbox" .checked=${e.allowControl!==!1}
               @change=${n=>t(()=>{n.target.checked?delete e.allowControl:e.allowControl=!1})}>
      </div>
      ${a.length?I`
        <div class="row"><label>Tone</label>
          <select .value=${e.tone==null?``:String(e.tone)}
                  @change=${n=>t(()=>{let t=n.target.value;t===``?e.tone=null:e.tone=t})}>
            <option value="">— device default —</option>
            ${a.map(e=>I`<option value=${e.value}>${e.label}</option>`)}
          </select>
        </div>`:P}
      ${o?I`
        <div class="row"><label>Volume</label>
          <input type="range" min="0" max="1" step="0.05"
                 .value=${String(e.volume??1)}
                 @input=${n=>t(()=>{e.volume=parseFloat(n.target.value)})}>
          <span style="font-size:11px;color:var(--text-dim);min-width:30px;text-align:right">
            ${Math.round((e.volume??1)*100)}%</span>
        </div>`:P}
      ${s?I`
        <div class="row"><label>Duration (s)</label>
          <input type="number" min="1" .value=${e.duration==null?``:String(e.duration)}
                 placeholder="device default"
                 @input=${n=>t(()=>{let t=parseFloat(n.target.value);e.duration=isFinite(t)&&t>0?Math.round(t):null})}>
        </div>`:P}
      ${a.length||o||s?I`
        <div style="font-size:10px;color:var(--text-dim);margin-top:2px;line-height:1.3">
          Sent with siren.turn_on when triggered. Home Assistant does not report which
          tone is actually playing, so this is a request, not a live readout.
        </div>`:P}
    `}_pickSafetyEntity(e){let t=e.kind===`siren`?[`siren`,`switch`,`binary_sensor`]:`binary_sensor`;this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:t,onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_alertBeaconsSection(){let e=this.planner.floor().alertBeacons??[];return e.length===0?P:this._section(`alertbeacons`,`Alert Beacons`,()=>this._groupedList(`alertbeacons`,e,e=>this._alertBeaconItem(e)))}_alertBeaconItem(e){let t=this.planner,n=t.activeAlertBeaconId===e.id,r=t.effectiveState(e),i=Jn(r?.state,zn(e.entity_id)),a=Vt(i),o=i===`active`?`ALERT`:i===`ack`?`ack`:r?`idle`:e.entity_id?`—`:`unbound`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveAlertBeacon(e.id)}>
          <div class="dot" style="background:${i===`idle`?`#90a4ae`:a}"></div>
          <div class="nm">${e.label?.trim()||`Alert`}${this._batteryText(e.entity_id)}</div>
          <div class="badge" style=${i===`active`?`color:${a};font-weight:700`:P}>${o}</div>
        </div>
        ${n?this._alertBeaconEditor(e):P}
      </div>
    `}_alertBeaconEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=!!e.entity_id,i=t.effectiveState(e)?.state===`on`,a=zn(e.entity_id);return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Alert"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>n(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>n(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickAlertBeaconEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
          ${r?I`<button class="btn" style="font-size:11px"
                    ?disabled=${!(a&&i)}
                    title=${a?`alert.turn_off (acknowledge) — only while active`:`binary_sensor is display-only`}
                    @click=${()=>t.acknowledgeAlertBeacon(e)}>Acknowledge</button>`:I`<button class="btn" style="font-size:11px"
                    title="Toggle the local alert state (demo)"
                    @click=${()=>t.toggleItem(e)}>Test</button>`}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${r?a?`Bound alert.*: on = active (pulsing red), off = acknowledged (steady amber). Click to acknowledge (alert.turn_off).`:`Bound binary_sensor: on = active (pulsing red). Display-only (no acknowledge).`:`Unbound: Test (or clicking the beacon) toggles a local demo state.`}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.alertBeacons=(n.alertBeacons??[]).filter(t=>t.id!==e.id),t.activeAlertBeaconId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_pickAlertBeaconEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`alert`,`binary_sensor`],onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_robotsSection(){let e=this.planner.floor().robots??[];return e.length===0?P:this._section(`robots`,`Robots`,()=>this._groupedList(`robots`,e,e=>this._robotItem(e)))}_robotItem(e){let t=this.planner,n=t.activeRobotId===e.id,r=e.kind===`mower`?`mower`:`vacuum`,i=t.robotActivity(e),a=ie(i),o=i===`cleaning`||i===`mowing`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveRobot(e.id)}>
          <div class="dot" style="background:${je(r)}"></div>
          <div class="nm">${S(r)} ${e.label?.trim()||(r===`mower`?`Mower`:`Vacuum`)}${this._batteryText(e.entity_id)}</div>
          <div class="badge" style="color:${a};${o?`font-weight:700`:``}">${i}</div>
        </div>
        ${n?this._robotEditor(e):P}
      </div>
    `}_robotEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=e.kind===`mower`?`mower`:`vacuum`,i=!!e.entity_id,a=t.robotActivity(e);return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Kind</label>
          <select .value=${r}
                  @change=${r=>n(()=>{e.kind=r.target.value,e.entity_id=null,delete t.robotStates[e.id]})}>
            <option value="vacuum">Vacuum (indoors)</option>
            <option value="mower">Mower (outdoors)</option>
          </select>
        </div>
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Robot"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>Dock X</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>n(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Dock Y</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>n(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Rotation (°)</label>
          <input type="number" step="5" .value=${String(Math.round(e.rotation??0))}
                 title="Which way the dock faces — 0 = the opening points toward −Y (screen-down); degrees turn it clockwise on screen."
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.rotation=isFinite(n)?n:0})}>
        </div>
        ${r===`mower`&&t.mowerDockIndoors(e)?I`
          <div style="color:#ffb74d;font-size:10px;line-height:1.3;margin:2px 0 4px">
            ⚠ This dock sits in a room with no doorway — the mower can't reach it
            and parks at the nearest outdoor point. Add a door or move the dock.
          </div>`:P}
        <div class="row"><label>${r===`mower`?`lawn_mower`:`vacuum`}</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickRobotEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
          <button class="btn" style="font-size:11px"
                  title=${i?`Run / dock the robot`:`Toggle the demo run/return`}
                  @click=${()=>t.toggleRobot(e)}>${a===`cleaning`||a===`mowing`?`Dock`:`Run`}</button>
        </div>
        ${r===`mower`?this._robotGpsRows(e):this._robotVacuumPosRows(e)}
        ${this._robotAlignRows(e)}
        ${this._robotProgressRow(e)}
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${i?`Bound: state follows the entity. Click the robot to run/dock.`:`Unbound: roams autonomously (demo). Click the robot to toggle run/return.`}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.robots=(n.robots??[]).filter(t=>t.id!==e.id),delete t.robotStates[e.id],t.activeRobotId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_robotGpsRows(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px">
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:3px">GPS position (mower)</div>
        <div class="row"><label>Tracker</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.trackerEntity||`—`}
          </span>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn" style="flex:1;font-size:11px"
                  @click=${()=>this._pickRobotTracker(e)}>${e.trackerEntity?`Rebind`:`Bind`} tracker…</button>
          ${e.trackerEntity?I`<button class="btn" style="font-size:11px"
                  @click=${()=>n(()=>{e.trackerEntity=null})}>×</button>`:P}
        </div>
        <div class="row" style="margin-top:4px"><label>Lat</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.latEntity||`—`}</span>
          <button class="btn" style="font-size:11px" @click=${()=>this._pickRobotLatLon(e,`lat`)}>Bind</button>
        </div>
        <div class="row"><label>Lon</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.lonEntity||`—`}</span>
          <button class="btn" style="font-size:11px" @click=${()=>this._pickRobotLatLon(e,`lon`)}>Bind</button>
        </div>
        ${this._robotPosReadout(e)}
        ${this._mowerCalibrateRow(e)}
        <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.3">
          Needs calibrated GPS landmarks (GPS/Geo section). No fix / no calibration → simulated mowing.
        </div>
      </div>
    `}_mowerCalibrateRow(e){let t=this.planner;if(!(e.trackerEntity||e.latEntity&&e.lonEntity))return P;let n=t.geoFit(),r=!!n&&n.transform.quality!==`none`,i=t.robotPosInfo(e)?.mode===`gps`;return I`
      <button class="btn" style="width:100%;margin-top:4px;font-size:11px"
              ?disabled=${!r||!i} title=${r?i?`Park the mower on its dock, then click to solve the position trim`:`No numeric GPS fix from the bound source yet`:`Calibrate GPS landmarks first (GPS/Geo section)`}
              @click=${()=>t.calibrateMowerToDock(e)}>Calibrate to dock</button>
      <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.3">
        Park the mower on its dock first — this solves the position trim so the
        reported fix lands on the placed dock.
      </div>`}_robotPosReadout(e){let t=this.planner.robotPosInfo(e);return t?I`
      <div style="font-size:10px;color:var(--text-dim);margin-top:3px;font-family:ui-monospace,Menlo,Consolas,monospace">
        ${t.mode===`sim`?``:I`${t.rawText}<br>`}→ ${Math.round(t.worldX)}, ${Math.round(t.worldY)} mm ·
        <span style="color:${t.mode===`sim`?`var(--text-dim)`:`#69f0ae`}">${t.mode}</span>
      </div>`:P}_robotVacuumPosRows(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=Rn(e.posEntity?t.hass?.states?.[e.posEntity]?.attributes:void 0),i=(e,t,r,i=1)=>I`
      <div class="row"><label>${e}</label>
        <input type="number" step=${i} .value=${String(t)}
               @input=${e=>n(()=>r(parseFloat(e.target.value)||0))}>
      </div>`;return I`
      <div style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px">
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:3px">Valetudo room map</div>
        <div class="row"><label>Topic id</label>
          <input type="text" .value=${e.valetudoId??``} placeholder="e.g. rockrobo"
                 @input=${t=>n(()=>{e.valetudoId=t.target.value.trim()||void 0})}>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.35">
          The identifier segment in <code>${t.store.mqttBridge?.valetudoNs||`valetudo`}/&lt;id&gt;/…</code>.
          Needs the MQTT bridge on (Settings ▸ Integrations). Draws the vacuum's SLAM room
          segmentation under the <b>Vacuum room map</b> layer (default off) — reuses the map
          calibration below (scale / offset / rotation / flip); calibrate once with
          <b>Set dock as reference</b>. Tap a room on the plan to send it to clean.
        </div>
      </div>
      <div style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px">
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:3px">Live position (Roborock map)</div>
        <div class="row"><label>Position entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.posEntity||`— none —`}</span>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn" style="flex:1;font-size:11px"
                  @click=${()=>this._pickRobotPosEntity(e)}>${e.posEntity?`Rebind`:`Bind`} map…</button>
          ${e.posEntity?I`<button class="btn" style="font-size:11px"
                  @click=${()=>n(()=>{e.posEntity=null})}>×</button>`:P}
        </div>
        ${e.posEntity?I`
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px">Map calibration</div>
          ${i(`Scale (mm/unit)`,e.posScale??1,t=>{e.posScale=t},.001)}
          ${i(`Offset X (mm)`,Math.round(e.posOffsetX??0),t=>{e.posOffsetX=t})}
          ${i(`Offset Y (mm)`,Math.round(e.posOffsetY??0),t=>{e.posOffsetY=t})}
          ${i(`Rotation (deg)`,e.posRotDeg??0,t=>{e.posRotDeg=t})}
          <div class="row"><label>Flip Y</label>
            <input type="checkbox" .checked=${!!e.posFlipY}
                   @change=${t=>n(()=>{e.posFlipY=t.target.checked})}>
          </div>
          <div style="font-size:10px;color:var(--text-dim);margin-top:3px">
            Raw: ${r?`x=${r.x.toFixed(0)} y=${r.y.toFixed(0)}${r.a==null?``:` a=${r.a.toFixed(0)}°`}`:`— no vacuum_position —`}
          </div>
          ${this._robotPosReadout(e)}
          <button class="btn" style="width:100%;margin-top:4px;font-size:11px"
                  ?disabled=${!r}
                  title="Park the vacuum on its dock, then click to solve the X/Y offset"
                  @click=${()=>n(()=>{let n=Rn(t.hass?.states?.[e.posEntity]?.attributes);if(!n)return;let r=Ie(n,{x:e.x,y:e.y},e);e.posOffsetX=r.posOffsetX,e.posOffsetY=r.posOffsetY})}>Set dock as reference</button>
          <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.3">
            No fix / unparseable → simulated roam. Park on the dock and click above to align the map origin.
          </div>
        `:P}
      </div>
    `}_robotAlignRows(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=e.kind===`mower`?`mower`:`vacuum`,i=this._moveStep,a=r===`mower`?!!(e.trackerEntity||e.latEntity&&e.lonEntity):!!(e.posEntity||e.valetudoId),o=(t,r)=>n(()=>{e.posOffsetX=(e.posOffsetX??0)+t,e.posOffsetY=(e.posOffsetY??0)+r}),s=t=>n(()=>{e.posRotDeg=(e.posRotDeg??0)+t});return I`
      <div style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px">
        <div class="row"><label>Show position info</label>
          <input type="checkbox" .checked=${!!e.showPosInfo}
                 title="Draw the reported position (crosshair + raw/projected readout) on the plan"
                 @change=${t=>n(()=>{e.showPosInfo=t.target.checked||void 0})}>
        </div>
        ${a?I`
          <div style="display:flex;align-items:center;gap:6px;margin:4px 0 3px">
            <span style="color:var(--text-dim);font-size:11px;flex:1">Align position</span>
            <select title="Nudge distance (structural millimetres/metres — ignores the imperial setting)"
                    style="background:#111;color:var(--text);border:1px solid var(--border);
                           border-radius:4px;padding:2px 4px;font-size:11px"
                    .value=${String(i)}
                    @change=${e=>this._setMoveStep(Number(e.target.value))}>
              <option value="10">10 mm</option>
              <option value="100">100 mm</option>
              <option value="500">500 mm</option>
              <option value="1000">1 m</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
            <button class="btn btn-sm" title="Nudge up (+Y)" @click=${()=>o(0,i)}>↑</button>
            <button class="btn btn-sm" title="Nudge down (−Y)" @click=${()=>o(0,-i)}>↓</button>
            <button class="btn btn-sm" title="Nudge left (−X)" @click=${()=>o(-i,0)}>←</button>
            <button class="btn btn-sm" title="Nudge right (+X)" @click=${()=>o(i,0)}>→</button>
          </div>
          ${r===`vacuum`?I`
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:4px">
              <button class="btn btn-sm" title="Rotate 5° CCW" @click=${()=>s(-5)}>↺ 5°</button>
              <button class="btn btn-sm" title="Rotate 0.5° CCW" @click=${()=>s(-.5)}>↺ 0.5°</button>
              <button class="btn btn-sm" title="Rotate 0.5° CW" @click=${()=>s(.5)}>↻ 0.5°</button>
              <button class="btn btn-sm" title="Rotate 5° CW" @click=${()=>s(5)}>↻ 5°</button>
            </div>
          `:P}
          <button class="btn btn-sm" style="width:100%;margin-top:4px" title="Clear the alignment nudge"
                  @click=${()=>n(()=>{e.posOffsetX=void 0,e.posOffsetY=void 0,r===`vacuum`&&(e.posRotDeg=void 0)})}>Reset</button>
          <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.3">
            Nudges move where the reported position lands on the plan. Turn on
            <b>Show position info</b> to see the reported point while aligning.
          </div>
        `:P}
      </div>
    `}_pickRobotPosEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`camera`,`image`,`sensor`],onPick:t=>{e.posEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_robotProgressRow(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=pe(e,e=>t.hass?.states?.[e]??null);return I`
      <div style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px">
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:3px">
          Progress ${r==null?P:I`· <b style="color:#69f0ae">${Math.round(r)}%</b>`}
        </div>
        <div class="row"><label>Sensor</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.progressEntity||`— none —`}</span>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn" style="flex:1;font-size:11px"
                  @click=${()=>this._pickRobotProgress(e)}>${e.progressEntity?`Rebind`:`Bind`} %…</button>
          ${e.progressEntity?I`<button class="btn" style="font-size:11px"
                  @click=${()=>n(()=>{e.progressEntity=null})}>×</button>`:P}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.3">
          0–100% cleaning / mowing progress. Absent → best-effort from the bound
          robot's own attributes (e.g. <code>cleaned_area_percent</code>).
        </div>
      </div>`}_pickRobotProgress(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,onPick:t=>{e.progressEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_pickRobotEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:e.kind===`mower`?`lawn_mower`:`vacuum`,onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_pickRobotTracker(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`device_tracker`,onPick:t=>{e.trackerEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_pickRobotLatLon(e,t){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,onPick:n=>{t===`lat`?e.latEntity=n:e.lonEntity=n,this.planner.save(),this.planner.emitConfig()}}}))}_camerasSection(){let e=this.planner.floor().cameras??[];return e.length===0?P:this._section(`cameras`,`Cameras`,()=>this._groupedList(`cameras`,e,e=>this._cameraItem(e)))}_cameraItem(e){let t=this.planner,n=t.activeCameraId===e.id,r=e.entity_id&&t.hass?t.hass.states[e.entity_id]:null,i=r?.state===`recording`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveCamera(e.id)}>
          <div class="dot" style="background:${i?`#ef5350`:`#4dd0e1`}"></div>
          <div class="nm">📷 ${e.label?.trim()||`Camera`}${this._batteryText(e.entity_id)}</div>
          <div class="badge" style=${i?`color:#ef5350;font-weight:700`:P}>${i?`REC`:e.entity_id?r?.state??`—`:`unbound`}</div>
        </div>
        ${n?this._cameraEditor(e):P}
      </div>
    `}_cameraEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=e.entity_id&&t.hass?t.hass.states[e.entity_id]?.attributes?.entity_picture:null;return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Camera"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>n(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>n(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Facing (°)</label>
          <input type="number" .value=${String(Math.round(e.rotation??0))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value)||0;e.rotation=(Math.round(n)%360+360)%360})}>
        </div>
        <div class="row"><label>FOV (°)</label>
          <input type="number" min="5" max="180" .value=${String(Pn(e))}
                 @input=${t=>n(()=>{e.fov=parseFloat(t.target.value)||kt.fov})}>
        </div>
        <div class="row"><label>Range (mm)</label>
          <input type="number" min="200" .value=${String(en(e))}
                 @input=${t=>n(()=>{e.range=parseFloat(t.target.value)||kt.range})}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" .value=${String(bn(e))}
                 @input=${t=>n(()=>{e.height=parseFloat(t.target.value)||kt.height})}>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickCameraEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
        </div>
        ${typeof r==`string`&&r?I`
          <div style="margin-top:6px;position:relative">
            <img src=${t.haBaseUrl+r+(r.includes(`?`)?`&`:`?`)+`_cb=`+this._camSnapCb}
                 style="width:100%;border-radius:4px;display:block;background:#000"
                 @error=${e=>{e.target.style.display=`none`}}>
            <button class="btn" style="position:absolute;top:4px;right:4px;font-size:10px;padding:2px 6px"
                    title="Refresh snapshot"
                    @click=${()=>{this._camSnapCb=Date.now(),this.requestUpdate()}}>↻</button>
          </div>
        `:P}
        ${(()=>{let r=t.cameraAlerting(e);return I`
            <div class="row" style="margin-top:6px"><label title="binary_sensor: 'on' pops a snapshot alert card (6 s linger after off)">Alert sensor</label>
              <span style="font-size:11px;color:${r?`#ef5350`:`var(--text-dim)`};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${e.alertEntity?`${e.alertEntity}${r?` · ALERT`:``}`:`— unbound —`}
              </span>
            </div>
            <div style="display:flex;gap:4px;margin-top:4px">
              <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickCameraAlert(e)}>
                ${e.alertEntity?`Rebind`:`Bind`} alert…
              </button>
              ${e.alertEntity?I`
                <button class="btn" style="font-size:11px"
                        @click=${()=>n(()=>{e.alertEntity=null})}>Unbind</button>
              `:P}
            </div>
          `})()}
        ${this._cameraFrigateBlock(e,typeof r==`string`?r:null)}
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.cameras=(n.cameras??[]).filter(t=>t.id!==e.id),t.activeCameraId=null,t.save(),t.emitConfig()}}>Delete camera</button>
      </div>
    `}_cameraFrigateBlock(e,t){let n=this.planner,r=e=>{e(),n.save(),n.emitConfig()},i=e.camCalib,a=i?.points??[],o={ok:!1,msg:`need ≥4 points`};if(a.length>=4){let e=$t(a);if(!e)o={ok:!1,msg:`degenerate (collinear points)`};else{let t=vn(e,a).reduce((e,t)=>Math.max(e,t),0);o={ok:!0,msg:`solved · max residual ${isFinite(t)?Math.round(t):`∞`} mm`}}}else a.length>0&&(o={ok:!1,msg:`need ≥4 points (${a.length})`});let s=n.placingCamCalibId===e.id,c=ct(e.label||``);return I`
      <div style="background:rgba(30,60,80,0.25);border-radius:4px;padding:6px;margin-top:8px">
        <div style="font-size:11px;color:var(--text-dim);font-weight:600;margin-bottom:4px">Frigate ground truth</div>
        <div class="row"><label title="The Frigate camera name in frigate/events (after.camera).">Frigate name</label>
          <input type="text" .value=${e.frigateName??``} placeholder=${c||`camera name`}
                 @input=${t=>r(()=>{e.frigateName=t.target.value||void 0})}>
        </div>
        <div class="row"><label>Dot color</label>
          <input type="color" .value=${Kt(e,(n.floor().cameras??[]).indexOf(e))}
                 @input=${t=>r(()=>{e.color=t.target.value})}>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin:6px 0 3px">
          Ground calibration — click a point on the snapshot, then the matching spot on the plan (≥4 pairs).
        </div>
        <div style="font-size:10px;color:#ffb74d;margin-bottom:4px">
          Frigate reports boxes at the DETECT resolution, often lower than the stream.
        </div>
        <div class="row"><label>Detect W</label>
          <input type="number" min="1" .value=${i?.detectW?String(i.detectW):``} placeholder="auto"
                 @input=${t=>r(()=>{this._ensureCalib(e).detectW=parseFloat(t.target.value)||void 0})}>
        </div>
        <div class="row"><label>Detect H</label>
          <input type="number" min="1" .value=${i?.detectH?String(i.detectH):``} placeholder="auto"
                 @input=${t=>r(()=>{this._ensureCalib(e).detectH=parseFloat(t.target.value)||void 0})}>
        </div>
        ${t?I`
          <div style="margin-top:6px;position:relative">
            <img src=${n.haBaseUrl+t+(t.includes(`?`)?`&`:`?`)+`_cb=`+this._camSnapCb}
                 style="width:100%;border-radius:4px;display:block;background:#000;cursor:crosshair"
                 @load=${t=>{let r=t.target;!e.camCalib?.detectW&&r.naturalWidth&&(this._ensureCalib(e).detectW=r.naturalWidth,this._ensureCalib(e).detectH=r.naturalHeight,n.save(),this.requestUpdate())}}
                 @click=${t=>this._onCalibSnapshotClick(e,t)}
                 @error=${e=>{e.target.style.display=`none`}}>
            ${s?I`<div style="position:absolute;inset:0;border:2px solid #4fc3f7;border-radius:4px;pointer-events:none"></div>`:P}
          </div>
        `:I`<div style="font-size:10px;color:var(--text-dim);margin-top:4px">Bind a camera.* entity for a snapshot to calibrate against.</div>`}
        ${s?I`<div style="font-size:10px;color:#4fc3f7;margin-top:4px">Now click the matching point on the floor plan…</div>`:P}
        <div style="margin-top:6px">
          ${a.map((e,t)=>I`
            <div class="row" style="font-size:10px;padding:1px 0">
              <span>${t+1}. px(${Math.round(e.u)},${Math.round(e.v)}) → mm(${e.x},${e.y})</span>
              <button class="btn" style="font-size:10px;padding:0 6px"
                      @click=${()=>r(()=>{a.splice(t,1),n.ensureFrigateSub()})}>✕</button>
            </div>
          `)}
        </div>
        <div style="font-size:10px;color:${o.ok?`#69f0ae`:`var(--text-dim)`};margin-top:4px">${o.msg}</div>
      </div>
    `}_ensureCalib(e){return e.camCalib||(e.camCalib={points:[]}),e.camCalib}_onCalibSnapshotClick(e,t){let n=t.currentTarget,r=n.getBoundingClientRect();if(!r.width||!r.height)return;let i=(t.clientX-r.left)/r.width,a=(t.clientY-r.top)/r.height,o=e.camCalib?.detectW||n.naturalWidth||r.width,s=e.camCalib?.detectH||n.naturalHeight||r.height,c=this.planner;c.pendingCamCalibUV={u:Math.round(i*o),v:Math.round(a*s)},c.placingCamCalibId=e.id,c.maybeCloseSidebarForPlacement(),c.emitConfig()}_pickCameraEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`camera`,onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_pickCameraAlert(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`binary_sensor`,onPick:t=>{e.alertEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_projectorsSection(){let e=this.planner.floor().projectors??[];return e.length===0?P:this._section(`projectors`,`Projectors`,()=>this._groupedList(`projectors`,e,e=>this._projectorItem(e)))}_projectorItem(e){let t=this.planner,n=t.activeProjectorId===e.id,r=t.effectiveState(e)?.state===`on`||t.effectiveState(e)?.state===`playing`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveProjector(e.id)}>
          <div class="dot" style="background:${r?Dt(e):`#5c6bc0`}"></div>
          <div class="nm">📽 ${e.label?.trim()||`Projector`}${this._batteryText(e.entity_id??null)}</div>
          <div class="badge">${r?`ON`:e.entity_id?t.effectiveState(e)?.state??`—`:e.localState?`local: ${e.localState}`:`off`}</div>
        </div>
        ${n?this._projectorEditor(e):P}
      </div>
    `}_projectorEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=t.floor().furniture.filter(e=>Oe(e.kind));return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Projector"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>n(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>n(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" .value=${String(ur(e))}
                 @input=${t=>n(()=>{e.height=parseFloat(t.target.value)||Ue.height})}>
        </div>
        <div class="row"><label>Target screen</label>
          <select .value=${e.screenId??``}
                  @change=${t=>n(()=>{e.screenId=t.target.value||null})}>
            <option value="" ?selected=${!e.screenId}>— aim by rotation —</option>
            ${r.map(t=>I`<option value=${t.id} ?selected=${e.screenId===t.id}>${t.label?.trim()||y[t.kind??`block`].label}</option>`)}
          </select>
        </div>
        ${e.screenId?P:I`
          <div class="row"><label>Aim (°)</label>
            <input type="number" step="15" .value=${String(Math.round(e.rotation??0))}
                   @input=${t=>n(()=>{let n=parseFloat(t.target.value)||0;e.rotation=(Math.round(n)%360+360)%360})}>
          </div>`}
        <div class="row"><label title="Throw ratio D:W — scales the beam spread + heading-only reach">Throw ratio</label>
          <input type="number" min="0.2" step="0.1" .value=${String(sr(e))}
                 @input=${t=>n(()=>{e.throwRatio=parseFloat(t.target.value)||Ue.throwRatio})}>
        </div>
        <div class="row"><label>Beam color</label>
          <input type="color" .value=${Dt(e)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${t=>n(()=>{e.beamColor=t.target.value})}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to the default beam color"
                  @click=${()=>n(()=>{e.beamColor=void 0})}>✕</button>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickProjectorEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>`:P}
          <button class="btn" style="font-size:11px"
                  @click=${()=>n(()=>{t.floor().projectors=(t.floor().projectors??[]).filter(t=>t.id!==e.id),t.activeProjectorId===e.id&&(t.activeProjectorId=null)})}>Delete</button>
        </div>
      </div>
    `}_pickProjectorEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`media_player`,`switch`,`light`],onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_valvesSection(){let e=this.planner.floor().valves??[];return e.length===0?P:this._section(`valves`,`Valves`,()=>this._groupedList(`valves`,e,e=>this._valveItem(e)))}_valveItem(e){let t=this.planner,n=t.activeValveId===e.id,r=t.effectiveState(e),i=Nn(r),a=Math.round(yn(r)*100),o=r?i?`open ${a}%`:`closed`:e.entity_id?`n/a`:`—`,s=i?`#4fc3f7`:r?`#90a4ae`:`#607d8b`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveValve(e.id)}>
          <div class="dot" style="background:${s}"></div>
          <div class="nm">${e.label?.trim()||`Valve`}${this._batteryText(e.entity_id)}</div>
          <div class="badge" style="color:${s}">${o}</div>
        </div>
        ${n?this._valveEditor(e):P}
      </div>
    `}_valveEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Valve"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>Rotation (°)</label>
          <input type="number" .value=${String(Math.round(e.rotation??0))}
                 @input=${t=>n(()=>{e.rotation=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label title="Permit open/close from the panel. Off = view-only status.">Allow open/close</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${e.allowControl!==!1}
                   @change=${t=>n(()=>{e.allowControl=t.target.checked})}>
            <span></span>
          </span>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickValveEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${e.entity_id?`Bind a valve.* (open/close) or switch.* (irrigation zone). Clicking the valve opens/closes it; water flows while open.`:`Unbound: clicking the valve flips a local demo open/closed state.`}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.valves=(n.valves??[]).filter(t=>t.id!==e.id),t.activeValveId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_pickValveEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`valve`,`switch`,`binary_sensor`],onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_sprinklersSection(){let e=this.planner.floor().sprinklerZones??[];return e.length===0?P:this._section(`sprinklers`,`Sprinklers`,()=>this._groupedList(`sprinklers`,e,e=>this._sprinklerItem(e)))}_sprinklerItem(e){let t=this.planner,n=t.activeSprinklerId===e.id,r=t.effectiveState(e),i=Bn(r),a=i?`running`:r?`off`:e.entity_id?`n/a`:`—`,o=i?`#4fc3f7`:r?`#90a4ae`:`#607d8b`,s=e.label?.trim()||(e.zoneNumber==null?`Sprinkler`:`Zone ${e.zoneNumber}`);return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveSprinkler(e.id)}>
          <div class="dot" style="background:${o}"></div>
          <div class="nm">${s}${this._batteryText(e.entity_id)}</div>
          <div class="badge" style="color:${o}">${a}</div>
        </div>
        ${n?this._sprinklerEditor(e):P}
      </div>
    `}_sprinklerEditor(t){let n=this.planner,r=e=>{e(),n.save(),n.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${t.id} .value=${t.label??``} placeholder="Sprinkler"
                 @input=${e=>r(()=>{t.label=e.target.value})}>
        </div>
        <div class="row"><label>Zone #</label>
          <input type="number" .value=${t.zoneNumber==null?``:String(t.zoneNumber)} placeholder="—"
                 @input=${e=>r(()=>{let n=parseInt(e.target.value,10);t.zoneNumber=isFinite(n)?n:void 0})}>
        </div>
        <div class="row"><label>Head kind</label>
          <select .value=${Ht(t)}
                  @change=${e=>r(()=>{t.headKind=e.target.value})}>
            ${[`spray`,`rotor`,`drip`].map(e=>I`<option value=${e} ?selected=${Ht(t)===e}>${e}</option>`)}
          </select>
        </div>
        <div class="row"><label>Arc (°)</label>
          <input type="number" min="10" max="360" step="10" .value=${String(e(t))}
                 @input=${e=>r(()=>{t.arcDeg=parseFloat(e.target.value)||180})}>
        </div>
        <div class="row"><label>Throw (mm)</label>
          <input type="number" min="300" step="100" .value=${String(Yn(t))}
                 @input=${e=>r(()=>{t.radius=parseFloat(e.target.value)||3e3})}>
        </div>
        <div class="row"><label>Heading (°)</label>
          <input type="number" .value=${String(Math.round(Cn(t)))}
                 @input=${e=>r(()=>{t.rotation=parseFloat(e.target.value)||0})}>
        </div>
        ${this._lockRow(t)}
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${t.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickSprinklerEntity(t)}>
            ${t.entity_id?`Rebind`:`Bind`}…
          </button>
          ${t.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>r(()=>{t.entity_id=null})}>Unbind</button>
          `:P}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${t.entity_id?`Bind a switch.* / valve.* zone. The head sprays while that entity is on; clicking toggles it. Arc/throw/heading are visual only (HA has no nozzle data).`:`Unbound: clicking the head flips a local demo on/off state to preview the spray.`}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let e=n.floor();e.sprinklerZones=(e.sprinklerZones??[]).filter(e=>e.id!==t.id),n.activeSprinklerId=null,n.save(),n.emitConfig()}}>Delete</button>
      </div>
    `}_pickSprinklerEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`switch`,`valve`,`binary_sensor`],onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_flagpolesSection(){let e=this.planner.floor().flagpoles??[];return e.length===0?P:this._section(`flagpoles`,`Flagpoles`,()=>this._groupedList(`flagpoles`,e,e=>this._flagpoleItem(e)))}_flagpoleItem(e){let t=this.planner,n=t.activeFlagpoleId===e.id,r=Xt[e.flag??`usa`]??Xt.usa,i=yr(e,e.entityId?t.hass?.states?.[e.entityId]??null:null),a=e.entityId?`${Math.round(i*100)}%`:e.halfMast?`½ mast`:`full`,o=e.label?.trim()||`Flagpole`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveFlagpole(e.id)}>
          <div class="dot" style="background:${r.dominant}"></div>
          <div class="nm">${o} · ${r.label}</div>
          <div class="badge" style="color:#9ccc65">${a}</div>
        </div>
        ${n?this._flagpoleEditor(e):P}
      </div>
    `}_flagpoleEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Flagpole"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        <div class="row"><label>Flag</label>
          <select .value=${e.flag??`usa`}
                  @change=${t=>n(()=>{e.flag=t.target.value})}>
            ${Object.entries(Xt).map(([t,n])=>I`<option value=${t} ?selected=${(e.flag??`usa`)===t}>${n.label}</option>`)}
          </select>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="1000" max="15000" step="500" .value=${String(e.height??6e3)}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.height=isFinite(n)?Math.max(1e3,n):6e3})}>
        </div>
        <label class="row" style="cursor:pointer">
          <input type="checkbox" ?checked=${!!e.halfMast} ?disabled=${!!e.entityId}
                 @change=${t=>n(()=>{e.halfMast=t.target.checked})}>
          <span>Half-mast${e.entityId?` (entity overrides)`:``}</span>
        </label>
        ${this._lockRow(e)}
        <div class="row"><label>Hoist entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entityId||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickFlagpoleEntity(e)}>
            ${e.entityId?`Rebind`:`Bind`}…
          </button>
          ${e.entityId?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entityId=void 0})}>✕</button>
          `:P}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          Bind a sensor/number percent (0–100) or a cover.* to raise/lower the flag
          (1 = full mast, 0.5 = half, 0 = down). Otherwise the half-mast checkbox
          controls it. The flag waves in the 3D view.
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.flagpoles=(n.flagpoles??[]).filter(t=>t.id!==e.id),t.activeFlagpoleId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_pickFlagpoleEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`sensor`,`number`,`cover`,`input_number`],onPick:t=>{e.entityId=t,this.planner.save(),this.planner.emitConfig()}}}))}_solarSection(){let e=this.planner.floor().solarPanels??[];return e.length===0?P:this._section(`solar`,`Solar panels`,()=>this._groupedList(`solar`,e,e=>this._solarItem(e)))}_solarSun(){let e=this.planner,t=e.geoFit(),n=t&&t.transform.quality!==`none`?t.transform.thetaRad:0;return{...Et(e.hass?.states?.[`sun.sun`]??null,n,Date.now(),Ut(e.store.weather)),theta:n}}_solarItem(e){let t=this.planner,n=t.activeSolarId===e.id,{sun:r,theta:i}=this._solarSun(),a=lr(r.azDeg,r.elevDeg,or(e),Ye(e,i)),o=Ge(e.powerEntity?u(t.hass?.states?.[e.powerEntity]??null):null),s=e.label?.trim()||`Solar panel`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveSolar(e.id)}>
          <div class="dot" style="background:${a.parked?`#546e7a`:`#ffd54f`}"></div>
          <div class="nm">${s}</div>
          <div class="badge" style="color:${a.parked?`#90a4ae`:`#9ccc65`}">
            ${o||(a.parked?`parked`:`${Math.round(a.tiltDeg)}°`)}
          </div>
        </div>
        ${n?this._solarEditor(e):P}
      </div>
    `}_solarEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},{sun:r,source:i,theta:a}=this._solarSun(),o=lr(r.azDeg,r.elevDeg,or(e),Ye(e,a)),s=e.powerEntity?u(t.hass?.states?.[e.powerEntity]??null):null,c=e.trackAzimuth!==!1,l=e.trackTilt!==!1,d=((r.azDeg+a*180/Math.PI)%360+360)%360;return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Solar panel"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        <div class="row"><label>Base rotation (°)</label>
          <input type="number" step="5" .value=${String(or(e))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.rotation=isFinite(n)?n:0})}>
        </div>
        <div class="row"><label>Track azimuth</label>
          <input type="checkbox" .checked=${c}
                 @change=${t=>n(()=>{t.target.checked?delete e.trackAzimuth:e.trackAzimuth=!1})}>
        </div>
        ${c?P:I`
          <div class="row"><label>Fixed azimuth (° compass)</label>
            <input type="number" step="5" .value=${String(e.fixedAzimuthDeg??180)}
                   @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.fixedAzimuthDeg=isFinite(n)?n:180})}>
          </div>`}
        <div class="row"><label>Track tilt</label>
          <input type="checkbox" .checked=${l}
                 @change=${t=>n(()=>{t.target.checked?delete e.trackTilt:e.trackTilt=!1})}>
        </div>
        ${l?P:I`
          <div class="row"><label>Fixed tilt (°)</label>
            <input type="number" step="5" min=${10} max=${75}
                   .value=${String(e.fixedTiltDeg??35)}
                   @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.fixedTiltDeg=isFinite(n)?n:35})}>
          </div>`}
        <div class="row"><label>Show sun position</label>
          <input type="checkbox" .checked=${e.showSun===!0}
                 @change=${t=>n(()=>{t.target.checked?e.showSun=!0:delete e.showSun})}>
        </div>
        <div class="row"><label>Aimed at</label>
          <span style="font-size:11px;color:var(--text);flex:1">
            ${o.parked?I`<span style="color:var(--text-dim)">parked (sun below the horizon)</span>`:I`${Math.round(o.yawDeg)}° az · ${Math.round(o.tiltDeg)}° tilt${c&&l?P:I`<span style="color:var(--text-dim)"> · ${!c&&!l?`fixed`:c?`fixed tilt`:`fixed azimuth`}</span>`}`}
          </span>
        </div>
        <div class="row"><label>Sun</label>
          <span style="font-size:11px;color:var(--text);flex:1">
            ${Math.round(d)}° az · ${Math.round(r.elevDeg)}° elev
            <span style="color:var(--text-dim)">${i===`entity`?` · from sun.sun`:i===`demo`?` · demo sun`:` · local-clock fallback`}</span>
          </span>
        </div>
        <div class="row"><label>Power entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.powerEntity||`— unbound —`}${s==null?``:` · ${Ge(s)}`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickSolarPowerEntity(e)}>
            ${e.powerEntity?`Rebind`:`Bind`}…
          </button>
          ${e.powerEntity?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.powerEntity=null})}>✕</button>
          `:P}
        </div>
        ${this._lockRow(e)}
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          The array tracks the sun's azimuth + elevation all day and parks flat at
          night. Turn a tracking switch OFF to freeze that axis at a fixed value —
          both off is an ordinary fixed array, which holds its pose day and night
          and never parks. Base rotation offsets the whole assembly. "Show sun
          position" draws a separate ray to where the sun actually is, so the gap
          between it and the panel's own aim is visible. A bound power sensor (W)
          drives the generation glow — a NEGATIVE reading (grid draw on a signed
          monitor) reads amber. The frame is tinted by the current UV index.
          ${i===`clock`?I`<br><span style="color:#ffb74d">No
          <code>sun.sun</code> entity — aiming from the local clock (approximate).</span>`:P}
          ${i===`demo`?I`<br><span style="color:#ffb74d">Aiming at the
          demo weather source's authored sun (Settings ▸ Weather).</span>`:P}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.solarPanels=(n.solarPanels??[]).filter(t=>t.id!==e.id),t.activeSolarId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_pickSolarPowerEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,onPick:t=>{e.powerEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_plugsSection(){let e=this.planner.floor().plugs??[];return e.length===0?P:this._section(`plugs`,`Smart plugs`,()=>this._groupedList(`plugs`,e,e=>this._plugItem(e)))}_plugItem(e){let t=this.planner,n=t.activePlugId===e.id,r=t.effectiveState(e),i=r?.state===`on`||r?.state===`playing`,a=e.powerEntity&&t.hass?.states?parseFloat(t.hass.states[e.powerEntity]?.state??``):NaN,o=r?i?isFinite(a)?`${Math.round(a)}W`:`on`:`off`:e.entity_id?`n/a`:`—`,s=i?`#69f0ae`:r?`#90a4ae`:`#607d8b`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActivePlug(e.id)}>
          <div class="dot" style="background:${s}"></div>
          <div class="nm">${e.label?.trim()||`Plug`}${this._batteryText(e.entity_id)}</div>
          <div class="badge" style="color:${s}">${o}</div>
        </div>
        ${n?this._plugEditor(e):P}
      </div>
    `}_plugEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``} placeholder="Plug"
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(xt(e)))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.height=isFinite(n)?Math.max(0,n):void 0})}>
        </div>
        <div class="row"><label title="Permit toggle from the panel. Off = view-only status.">Allow toggle</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${e.allowControl!==!1}
                   @change=${t=>n(()=>{e.allowControl=t.target.checked})}>
            <span></span>
          </span>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickPlugEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
        </div>
        <div class="row" style="margin-top:4px"><label>Power sensor</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.powerEntity||`— none —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:2px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickPlugPower(e)}>
            ${e.powerEntity?`Rebind`:`Bind`} power…
          </button>
          ${e.powerEntity?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.powerEntity=null})}>Clear</button>
          `:P}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.plugs=(n.plugs??[]).filter(t=>t.id!==e.id),t.activePlugId=null,t.save(),t.emitConfig()}}>Delete</button>
      </div>
    `}_pickPlugEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`switch`,`light`],onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_pickPlugPower(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,onPick:t=>{e.powerEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_presenceZonesSection(){let e=this.planner,t=e.floor().presenceZones??[],n=!!e.drawingPresenceZone;return t.length===0&&!n?P:this._section(`pzones`,`Presence zones`,()=>I`
      ${n?I`
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
          <span style="flex:1">▱ Click to add vertices; double-click / Enter to finish (${e.drawingPresenceZone.points.length} pts).</span>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  @click=${()=>{e.drawingPresenceZone=null,e.emitConfig()}}>Cancel</button>
        </div>`:P}
      ${t.map(e=>this._pzoneItem(e))}
      <button class="btn" style="width:100%;margin-top:6px" @click=${()=>{e.setTool(`pzone`),e.maybeCloseSidebarForPlacement()}}>
        + Add zone
      </button>
    `)}_pzoneItem(e){let t=this.planner,n=t.activePZoneId===e.id,r=(e.entity_id&&t.hass?t.hass.states[e.entity_id]:null)?.state===`on`,i=nr(e);return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActivePZone(e.id)}>
          <div class="dot" style="background:${r?i:`#607d8b`}"></div>
          <div class="nm">▱ ${e.name?.trim()||`Zone`}</div>
          <div class="badge" style=${r?`color:${i};font-weight:700`:P}>${r?`occupied`:e.entity_id?`clear`:`unbound`}</div>
        </div>
        ${n?this._pzoneEditor(e):P}
      </div>
    `}_pzoneEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Name</label>
          <input type="text" .value=${e.name??``} placeholder="Zone"
                 @input=${t=>n(()=>{e.name=t.target.value})}>
        </div>
        <div class="row"><label>Color</label>
          <input type="color" .value=${nr(e)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${t=>n(()=>{e.color=t.target.value})}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to default" @click=${()=>n(()=>{e.color=void 0})}>↺</button>
        </div>
        <div class="row"><label>Hidden</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${()=>n(()=>{e.hidden=!e.hidden})}>${e.hidden?`🙈 Hidden`:`👁 Shown`}</button>
        </div>
        ${this._lockRow(e)}
        <div style="font-size:10px;color:var(--text-dim);margin:2px 0">${e.points.length} vertices · drag the orange handles to reshape (Select mode)</div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickPZoneEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
          <button class="btn" style="font-size:11px"
                  title="Re-draw the polygon on the plan (replaces the points)"
                  @click=${()=>{t.drawingPresenceZone={points:[],id:e.id},t.setTool(`pzone`),t.maybeCloseSidebarForPlacement(),t.emitConfig()}}>Redraw</button>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          Bound: the zone glows when the occupancy binary_sensor is on (FP2 zone / Frigate / any presence).
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.presenceZones=(n.presenceZones??[]).filter(t=>t.id!==e.id),t.activePZoneId=null,t.save(),t.emitConfig()}}>Delete zone</button>
      </div>
    `}_pickPZoneEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`binary_sensor`,onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_groundSection(){let e=this.planner,t=e.floor().groundAreas??[],n=!!e.drawingGroundArea,r=!!e.drawingPath;return this._section(`ground`,`Ground / Yard`,()=>I`
      ${n?I`
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
          <span style="flex:1">▨ Click to add vertices; double-click / Enter to finish (${e.drawingGroundArea.points.length} pts).</span>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  @click=${()=>{e.drawingGroundArea=null,e.emitConfig()}}>Cancel</button>
        </div>`:P}
      ${r?I`
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
          <span style="flex:1">〰 Click centerline points; double-click / Enter to finish (${e.drawingPath.points.length} pts).</span>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  @click=${()=>{e.drawingPath=null,e.emitConfig()}}>Cancel</button>
        </div>`:P}
      ${t.map(e=>this._groundItem(e))}
      <div style="display:flex;gap:4px;margin-top:6px">
        <button class="btn" style="flex:1" @click=${()=>{e.setTool(`ground`),e.maybeCloseSidebarForPlacement()}}>+ Add area</button>
        <button class="btn" style="flex:1" @click=${()=>{e.setTool(`path`),e.maybeCloseSidebarForPlacement()}}>+ Add path</button>
      </div>
    `)}_groundItem(e){let t=this.planner,n=t.activeGroundAreaId===e.id,r=Be(e);return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveGroundArea(e.id)}>
          <div class="dot" style="background:${r}"></div>
          <div class="nm">▨ ${e.name?.trim()||o[e.kind]?.label||e.kind}</div>
          <div class="badge">${o[e.kind]?.label??e.kind}</div>
        </div>
        ${n?this._groundEditor(e):P}
      </div>
    `}_groundEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Kind</label>
          <select @change=${t=>n(()=>{e.kind=t.target.value})}>
            ${Object.keys(o).map(t=>I`
              <option value=${t} ?selected=${e.kind===t}>${o[t].label}</option>`)}
          </select>
        </div>
        <div class="row"><label>Name</label>
          <input type="text" .value=${e.name??``} placeholder=${o[e.kind]?.label??`Area`}
                 @input=${t=>n(()=>{e.name=t.target.value})}>
        </div>
        <div class="row" title="Raise (+) or sink (−) this area relative to grade. A raised tier gets a sloped/vertical skirt; nest smaller polygons at higher values for a hill/berm. Negative = a sunken basin preview.">
          <label>Elevation</label>
          <input type="number" step="50" .value=${String(e.elevationMm??0)}
                 style="flex:1" placeholder="0"
                 @input=${t=>n(()=>{let n=Math.round(Number(t.target.value)||0);n===0?delete e.elevationMm:e.elevationMm=n})}>
          <span style="color:var(--text-dim);font-size:11px">mm</span>
        </div>
        <div class="row"
             title="Bind this ground area to a Home Assistant area. A fixture standing on it — outside every room — opens its entity picker scoped to that area (the smallest bound area containing the point wins).">
          <label>HA area</label>
          ${this._areaOptions(t.floor(),e).length===0?I`<span style="flex:1;font-size:10px;color:var(--text-dim);font-style:italic" data-ground-area-empty>
                ${t.haAreaRegistryLoaded?`(no Home Assistant areas)`:`loading…`}</span>`:I`
              <select style="flex:1;min-width:0" data-ground-area-for=${e.id}
                      .value=${e.haAreaId??``}
                      @change=${t=>{let r=t.target.value;n(()=>{e.haAreaId=r||void 0})}}>
                <option value="" ?selected=${!e.haAreaId}>— none —</option>
                ${this._areaOptions(t.floor(),e).map(t=>I`
                  <option value=${t.area_id} ?selected=${e.haAreaId===t.area_id}>${t.name}</option>`)}
              </select>`}
        </div>
        <div class="row"><label>Hidden</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${()=>n(()=>{e.hidden=!e.hidden})}>${e.hidden?`🙈 Hidden`:`👁 Shown`}</button>
        </div>
        ${this._lockRow(e)}
        ${e.path?I`
          <div class="row" title="Ribbon width — the generated polygon is regenerated (bufferPolyline) on every change.">
            <label>Path width</label>
            <input type="number" step="50" min="100" .value=${String(e.path.width)}
                   style="flex:1"
                   @input=${r=>n(()=>{let n=Math.max(100,Math.round(Number(r.target.value)||100));e.path&&(e.path.width=n,t.regenGroundAreaPath(e))})}>
            <span style="color:var(--text-dim);font-size:11px">mm</span>
          </div>
          <div style="font-size:10px;color:var(--text-dim);margin:2px 0">${e.path.centerline.length} centerline points · drag the orange handles to reshape (Select mode)</div>
          <div style="display:flex;gap:4px;margin-top:4px">
            <button class="btn" style="flex:1;font-size:11px"
                    title="Re-draw the centerline on the plan (replaces the path)"
                    @click=${()=>{t.drawingPath={points:[],id:e.id,width:e.path?.width},t.setTool(`path`),t.maybeCloseSidebarForPlacement(),t.emitConfig()}}>Redraw path</button>
            <button class="btn" style="flex:1;font-size:11px"
                    title="Drop the path metadata, keeping the current polygon as a plain editable shape."
                    @click=${()=>t.detachGroundAreaPath(e)}>Detach shape</button>
          </div>
        `:I`
          <div style="font-size:10px;color:var(--text-dim);margin:2px 0">${e.points.length} vertices · drag the orange handles to reshape (Select mode)</div>
          <div style="display:flex;gap:4px;margin-top:4px">
            <button class="btn" style="flex:1;font-size:11px"
                    title="Re-draw the polygon on the plan (replaces the points)"
                    @click=${()=>{t.drawingGroundArea={points:[],id:e.id},t.setTool(`ground`),t.maybeCloseSidebarForPlacement(),t.emitConfig()}}>Redraw</button>
          </div>
        `}
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.groundAreas=(n.groundAreas??[]).filter(t=>t.id!==e.id),t.activeGroundAreaId=null,t.save(),t.emitConfig()}}>Delete area</button>
      </div>
    `}_poolsSection(){let e=this.planner,t=e.floor().pools??[],n=!!e.drawingPoolArea;return this._section(`pools`,`Pool & Spa`,()=>I`
      ${n?I`
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
          <span style="flex:1">🏊 Click to add vertices; double-click / Enter to finish (${e.drawingPoolArea.points.length} pts).</span>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  @click=${()=>{e.drawingPoolArea=null,e.emitConfig()}}>Cancel</button>
        </div>`:P}
      ${t.map(e=>this._poolItem(e))}
      <div style="display:flex;gap:4px;margin-top:6px">
        <button class="btn" style="flex:1" @click=${()=>{e.drawingPoolArea={points:[],kind:`pool`},e.setTool(`pool`),e.maybeCloseSidebarForPlacement()}}>+ Pool</button>
        <button class="btn" style="flex:1" @click=${()=>{e.drawingPoolArea={points:[],kind:`spa`},e.setTool(`pool`),e.maybeCloseSidebarForPlacement()}}>+ Spa</button>
      </div>
    `)}_poolItem(e){let t=this.planner,n=t.activePoolId===e.id,r=t.poolHeaterStateOf(e),i=r===`heating`?`🔥 heating`:r===`idle`?`idle`:t.poolPumpOnOf(e)?`💧 pump`:e.kind===`spa`?`spa`:`pool`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActivePool(e.id)}>
          <div class="dot" style="background:${Zt(e)}"></div>
          <div class="nm">${e.kind===`spa`?`♨`:`🏊`} ${e.name?.trim()||(e.kind===`spa`?`Spa`:`Pool`)}</div>
          <div class="badge">${i}</div>
        </div>
        ${n?this._poolEditor(e):P}
      </div>
    `}_poolBindRow(e,t,n,r){let i=this.planner,a=e[n];return I`
      <div class="row"><label>${t}</label>
        <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a||`— unbound —`}</span>
        <button class="btn" style="font-size:11px" @click=${()=>this._pickPoolEntity(e,n,r)}>🔗</button>
        ${a?I`<button class="btn" style="font-size:11px" @click=${()=>{e[n]=void 0,i.save(),i.emitConfig()}}>✕</button>`:P}
      </div>
    `}_poolEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=e.lightEntities??[];return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Kind</label>
          <select @change=${t=>n(()=>{e.kind=t.target.value})}>
            <option value="pool" ?selected=${e.kind===`pool`}>Pool</option>
            <option value="spa" ?selected=${e.kind===`spa`}>Spa</option>
          </select>
        </div>
        <div class="row"><label>Name</label>
          <input type="text" .value=${e.name??``} placeholder=${e.kind===`spa`?`Spa`:`Pool`}
                 @input=${t=>n(()=>{e.name=t.target.value})}>
        </div>
        <div class="row"><label>Water color</label>
          <input type="color" .value=${Zt(e)}
                 @input=${t=>n(()=>{e.waterColor=t.target.value})}>
        </div>
        <div class="row" title="Basin depth below grade."><label>Depth</label>
          <input type="number" step="100" min="300" .value=${String(Zn(e))} style="flex:1"
                 @input=${t=>n(()=>{e.depthMm=Math.max(300,Math.round(Number(t.target.value)||1200))})}>
          <span style="color:var(--text-dim);font-size:11px">mm</span>
        </div>
        ${e.kind===`spa`?I`
          <div class="row" title="Spa height above grade (0 = in-ground)."><label>Raised</label>
            <input type="number" step="50" min="0" .value=${String(jn(e))} style="flex:1"
                   @input=${t=>n(()=>{e.raisedMm=Math.max(0,Math.round(Number(t.target.value)||0))})}>
            <span style="color:var(--text-dim);font-size:11px">mm</span>
          </div>`:P}
        <div style="font-weight:600;font-size:11px;margin:6px 0 2px;color:var(--text-dim)">Equipment</div>
        ${this._poolBindRow(e,`Heater`,`heaterEntity`,[`climate`,`water_heater`])}
        ${this._poolBindRow(e,`Pump`,`pumpEntity`,[`switch`])}
        <div class="row"><label>Lights</label>
          <span style="font-size:11px;color:var(--text);flex:1">${r.length?`${r.length} bound`:`— none —`}</span>
          <button class="btn" style="font-size:11px" @click=${()=>this._pickPoolLight(e)}>+ Add</button>
          ${r.length?I`<button class="btn" style="font-size:11px" @click=${()=>n(()=>{e.lightEntities=[]})}>Clear</button>`:P}
        </div>
        <div style="font-weight:600;font-size:11px;margin:6px 0 2px;color:var(--text-dim)">Chemistry (display)</div>
        ${this._poolBindRow(e,`Water temp`,`waterTempEntity`,[`sensor`])}
        ${this._poolBindRow(e,`pH`,`phEntity`,[`sensor`])}
        ${this._poolBindRow(e,`ORP`,`orpEntity`,[`sensor`])}
        ${this._poolBindRow(e,`Salt`,`saltEntity`,[`sensor`])}
        ${!e.heaterEntity||!e.pumpEntity?I`
          <div style="display:flex;gap:4px;margin-top:6px">
            ${e.heaterEntity?P:I`<button class="btn" style="flex:1;font-size:11px" @click=${()=>t.togglePoolHeater(e)}>${e.localState?.heater===`on`?`🔥 Heater on`:`Heater off`}</button>`}
            ${e.pumpEntity?P:I`<button class="btn" style="flex:1;font-size:11px" @click=${()=>t.togglePoolPump(e)}>${e.localState?.pump===`on`?`💧 Pump on`:`Pump off`}</button>`}
          </div>
          <div style="font-size:10px;color:var(--text-dim);margin-top:2px">Unbound demo toggles (session-only in kiosk).</div>
        `:P}
        ${this._lockRow(e)}
        <div class="row"><label>Hidden</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${()=>n(()=>{e.hidden=!e.hidden})}>${e.hidden?`🙈 Hidden`:`👁 Shown`}</button>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px"
                  title="Re-draw the pool polygon on the plan (replaces the points)"
                  @click=${()=>{t.drawingPoolArea={points:[],id:e.id,kind:e.kind},t.setTool(`pool`),t.maybeCloseSidebarForPlacement(),t.emitConfig()}}>Redraw</button>
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.pools=(n.pools??[]).filter(t=>t.id!==e.id),t.activePoolId=null,t.save(),t.emitConfig()}}>Delete ${e.kind===`spa`?`spa`:`pool`}</button>
      </div>
    `}_pickPoolEntity(e,t,n){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:n,onPick:n=>{e[t]=n,this.planner.save(),this.planner.emitConfig()}}}))}_pickPoolLight(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`light`,onPick:t=>{e.lightEntities||(e.lightEntities=[]),e.lightEntities.includes(t)||e.lightEntities.push(t),this.planner.save(),this.planner.emitConfig()}}}))}_voidSection(){let e=this.planner,t=e.floor().voidAreas??[],n=!!e.drawingVoidArea;return this._section(`voids`,`Floor voids`,()=>I`
      ${n?I`
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
          <span style="flex:1">🕳 Click to add vertices; double-click / Enter to finish (${e.drawingVoidArea.points.length} pts).</span>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  @click=${()=>{e.drawingVoidArea=null,e.emitConfig()}}>Cancel</button>
        </div>`:P}
      ${t.map((e,t)=>this._voidItem(e,t))}
      <div style="font-size:10px;color:var(--text-dim);margin:4px 0">A void cuts a hole in the floor — avatars route around it unless a stair bridges it.</div>
      <button class="btn" style="width:100%;margin-top:6px" @click=${()=>{e.setTool(`void`),e.maybeCloseSidebarForPlacement()}}>
        + Draw void
      </button>
    `)}_voidItem(e,t){let n=this.planner,r=n.activeVoidAreaId===e.id;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${r?`sel`:``}" @click=${()=>n.setActiveVoidArea(e.id)}>
          <div class="dot" style="background:#222"></div>
          <div class="nm">🕳 Void ${t+1}</div>
          <div class="badge">${e.points.length} pts</div>
        </div>
        ${r?this._voidEditor(e):P}
      </div>
    `}_voidEditor(e){let t=this.planner;return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        ${this._lockRow(e)}
        <div style="font-size:10px;color:var(--text-dim);margin:2px 0">${e.points.length} vertices · drag the orange handles to reshape (Select mode)</div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px"
                  title="Re-draw the polygon on the plan (replaces the points)"
                  @click=${()=>{t.drawingVoidArea={points:[],id:e.id},t.setTool(`void`),t.maybeCloseSidebarForPlacement(),t.emitConfig()}}>Redraw</button>
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${()=>{let n=t.floor();n.voidAreas=(n.voidAreas??[]).filter(t=>t.id!==e.id),t.activeVoidAreaId=null,t.save(),t.emitConfig()}}>Delete void</button>
      </div>
    `}_peopleSection(){let e=this.planner,t=e.store.people??[],n=e.store.bermudaEnabled!==!1;return n&&!this._bermudaKicked&&e.hass&&!e.bermuda&&(this._bermudaKicked=!0,e.scanBermuda()),this._section(`people`,`People`,()=>I`
        ${n?I`
          <label class="row" style="padding:0;margin-bottom:6px"
                 title="Show BLE devices configured in Bermuda but not mapped to a person (uses the fallback avatar pool). Consumed by trilateration in a later phase.">
            <span style="color:var(--text-dim);font-size:11px;flex:1">Show unknown BLE devices</span>
            <span class="mini-toggle">
              <input type="checkbox" .checked=${e.store.bleShowUnknown!==!1}
                     @change=${t=>e.setBleShowUnknown(t.target.checked)}>
              <span></span>
            </span>
          </label>`:P}
        ${t.length===0?I`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet. Add people to give BLE / GPS presence a name, avatar, and color.
            </div>`:t.map(e=>this._personItem(e))}
        <button class="btn" style="width:100%;margin-top:6px" @click=${()=>e.addPerson()}>
          + Add person
        </button>
        ${n?this._bermudaSubsection():P}
    `)}_personItem(e){let t=this.planner,n=t.activePersonId===e.id,r=e.color||`#90caf9`,i=t.solvedFloorIdFor(e.id),a=i&&i!==t.floor().id?t.store.floors.find(e=>e.id===i)?.name??null:null;return I`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActivePerson(e.id)}>
          <div class="dot" style="background:${r}"></div>
          <div class="nm">${e.name||`Person`}${e.isPet?` 🐾`:``}${a?I`<span style="font-size:10px;color:var(--text-dim);margin-left:5px">on ${a}</span>`:P}</div>
          <div class="badge ${e.bermudaDeviceId||e.haPersonId?`bound`:``}">
            ${e.bermudaDeviceId?`📶`:e.haPersonId?`GPS`:`—`}
          </div>
        </div>
        ${this._gpsStatusLine(e)}
        ${n?this._personEditor(e):P}
      </div>
    `}_gpsStatusLine(e){if(!e.haPersonId&&!e.gpsTrackerId)return P;let t=e=>I`<div style="font-size:10px;color:var(--text-dim);padding:0 0 3px 20px">${e}</div>`,n=this.planner.gpsFixFor(e);if(!n)return P;if(!n.found)return t(`GPS: entity not found (${n.entityId})`);if(n.lat==null||n.lon==null)return t(`GPS: no location from ${n.entityId}`);let r=this.planner.store.imperial,i=n.accuracyM==null?``:` · ${O(n.accuracyM,r)}`,a=this.planner.gpsPins.find(t=>t.personId===e.id);if(a){let e=a.zone===`indoor`?`indoors ~${O(a.accuracyMm/1e3,r)}`:`${j(a.distanceM,r)} ${In(a.bearingDeg)}`,t=a.zone===`indoor`?``:i,n=` · ${Vr(a.lastUpdated)}`;return I`<div style="font-size:10px;color:${a.stale?`var(--text-dim)`:`#4dd0e1`};padding:0 0 3px 20px">
        ${Hr(a.zone)} ${e}${t}${n}</div>`}return t(`GPS: fix${i} · ${Vr(n.lastUpdated)} — calibrate a landmark to map it`)}_personEditor(e){let t=this.planner,n=n=>t.updatePerson(e.id,n),r=e.bermudaDeviceId?t.bermuda?.devices.find(t=>t.deviceId===e.bermudaDeviceId)?.name||e.bermudaDeviceId:null;return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Name</label>
          <input type="text" .value=${e.name}
                 @input=${e=>n(t=>{t.name=e.target.value})}>
        </div>
        <div class="row"><label>Avatar</label>
          <select @change=${e=>n(t=>{t.avatarKind=e.target.value||void 0})}>
            <option value="" ?selected=${!e.avatarKind}>Auto (fallback pool)</option>
            ${rt().map(({def:t,members:n})=>I`
              <optgroup label=${t.label}>
                ${n.map(t=>I`
                  <option value=${t.id} ?selected=${e.avatarKind===t.id}>${t.label}</option>`)}
              </optgroup>`)}
          </select>
        </div>
        <div class="row"><label>Color</label>
          <input type="color" .value=${e.color||`#90caf9`}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${e=>n(t=>{t.color=e.target.value})}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Clear color" @click=${()=>n(e=>{e.color=void 0})}>↺</button>
        </div>
        <div class="row"><label>Pet</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${!!e.isPet}
                   @change=${e=>n(t=>{t.isPet=e.target.checked})}>
            <span></span>
          </span>
        </div>
        <div class="row" title="Let this person's rig change into a situational outfit (pajamas / workout / apron). Turn off to keep them in their normal look. Requires the global 'Avatars change outfits' setting.">
          <label>Allow outfit changes</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${e.allowCostumes!==!1}
                   @change=${e=>n(t=>{t.allowCostumes=e.target.checked})}>
            <span></span>
          </span>
        </div>
        <div class="row"><label>Person entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.haPersonId||`—`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:2px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickPersonEntity(e)}>
            ${e.haPersonId?`Rebind`:`Bind`}…
          </button>
          ${e.haPersonId?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(e=>{e.haPersonId=void 0})}>Unbind</button>`:P}
        </div>
        ${t.store.bermudaEnabled===!1?P:I`
          <div class="row" style="margin-top:4px"><label>Bermuda device</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${r||`—`}
            </span>
          </div>
          <div style="display:flex;gap:4px;margin-top:2px">
            <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickBermudaDevice(e)}>
              ${e.bermudaDeviceId?`Rebind`:`Bind`}…
            </button>
            ${e.bermudaDeviceId?I`
              <button class="btn" style="font-size:11px"
                      @click=${()=>n(e=>{e.bermudaDeviceId=void 0})}>Unbind</button>`:P}
          </div>
        `}
        <div class="row" style="margin-top:4px"><label>GPS tracker</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.gpsTrackerId||`—`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:2px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickGpsTracker(e)}>
            ${e.gpsTrackerId?`Rebind`:`Bind`}…
          </button>
          ${e.gpsTrackerId?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(e=>{e.gpsTrackerId=void 0})}>Unbind</button>`:P}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px"
                @click=${()=>{confirm(`Delete "${e.name||`Person`}"?`)&&t.deletePerson(e.id)}}>
          Delete
        </button>
      </div>
    `}_pickPersonEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`person`,onPick:t=>this.planner.updatePerson(e.id,e=>{e.haPersonId=t})}}))}_pickGpsTracker(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`device_tracker`,onPick:t=>this.planner.updatePerson(e.id,e=>{e.gpsTrackerId=t})}}))}_pickBermudaDevice(e){let t=(this.planner.bermuda?.devices??[]).filter(e=>e.deviceId).map(e=>({id:e.deviceId,name:e.name,subtitle:`${e.scanners.length} scanner(s)`+(e.mac?` · ${e.mac}`:``)}));this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{devices:t,title:`Pick the Bermuda tracked device`,onPick:t=>this.planner.updatePerson(e.id,e=>{e.bermudaDeviceId=t})}}))}_bermudaSubsection(){let e=this.planner,t=e.bermuda,n=t?.devices??[];return I`
      <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:8px">
        <div class="row" style="margin-bottom:4px">
          <label style="font-weight:600">Bermuda BLE</label>
          <button class="btn" style="font-size:10px;padding:2px 8px"
                  @click=${()=>e.scanBermuda()}>Rescan</button>
        </div>
        ${t?n.length===0?I`<div style="color:var(--text-dim);font-size:11px;padding:2px 0">
                No Bermuda devices found.</div>`:n.map(e=>this._bermudaDeviceRow(e)):I`<div style="color:var(--text-dim);font-size:11px;padding:2px 0">
              Scanning… (needs the Bermuda integration + a live HA connection)</div>`}
      </div>
    `}_bermudaDeviceRow(e){let t=this.planner,n=e.scanners.filter(e=>e.rangeEntityId).length,r=e.scanners.filter(e=>e.proxyId).length;return I`
      <div style="font-size:11px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.name}</span>
          <span style="color:var(--text-dim);font-size:10px">${n} scanner(s)</span>
        </div>
        <div style="color:var(--text-dim);font-size:10px;margin-top:2px">
          ${r} matched to a proxy · ${e.disabledCount} distance entit${e.disabledCount===1?`y`:`ies`} disabled
        </div>
        ${e.disabledCount>0?I`
          <button class="btn" style="width:100%;font-size:10px;margin-top:3px"
                  title="Enables the disabled per-scanner distance entities. HA may take ~30 s (or an integration reload) before they report."
                  @click=${()=>t.enableBermudaDevice(e)}>
            Enable ${e.disabledCount} distance entit${e.disabledCount===1?`y`:`ies`}
          </button>
          <div style="color:var(--text-dim);font-size:9px;margin-top:2px;line-height:1.3">
            HA may take ~30 s or an integration reload to start reporting.
          </div>
        `:P}
      </div>
    `}_roamersSection(){let e=this.planner,t=e.floor().roamers??[];return this._section(`roamers`,`Roaming avatars`,()=>I`
        <div style="color:var(--text-dim);font-size:11px;padding:2px 0 6px">
          Free-range display avatars that wander this floor with a taste for
          interior activities. Not bound to any sensor — always on when enabled.
        </div>
        ${t.length===0?I`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet. Add a roamer to populate the scene with a wandering person.
            </div>`:t.map(e=>this._roamerItem(e))}
        <button class="btn" style="width:100%;margin-top:6px" @click=${()=>e.addRoamer()}>
          + Add roamer
        </button>
    `)}_roamerItem(e){let t=this.planner,n=t.activeRoamerId===e.id,r=e.enabled!==!1,i=e.color||`#ba68c8`;return I`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${n?`sel`:``}" @click=${()=>t.setActiveRoamer(e.id)}>
          <div class="dot" style="background:${r?i:`#555`}"></div>
          <div class="nm" style="${r?``:`opacity:0.5`}">${e.name||`Roamer`}</div>
          <label class="mini-toggle" title="Enable / hide this roamer" @click=${e=>e.stopPropagation()}>
            <input type="checkbox" .checked=${r}
                   @change=${n=>t.updateRoamer(e.id,e=>{e.enabled=n.target.checked})}>
            <span></span>
          </label>
        </div>
        ${n?this._roamerEditor(e):P}
      </div>
    `}_roamerEditor(e){let t=this.planner,n=n=>t.updateRoamer(e.id,()=>n());return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Name</label>
          <input type="text" .value=${e.name??``}
                 @input=${t=>n(()=>{e.name=t.target.value})}>
        </div>
        <div class="row" title="Color of the spinning plumbob above this roamer. Default = this roamer's color.">
          <label>Plumbob</label>
          <input type="color" .value=${e.plumbobColor||e.color||`#ba68c8`}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${t=>n(()=>{e.plumbobColor=t.target.value})}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to default (this roamer's color)"
                  @click=${()=>n(()=>{e.plumbobColor=void 0})}>✕</button>
        </div>
        <div class="row" title="Identity tint for this roamer's rig. Default = the standard avatar tint.">
          <label>Color</label>
          <input type="color" .value=${e.color||`#ba68c8`}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${t=>n(()=>{e.color=t.target.value})}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to the default tint"
                  @click=${()=>n(()=>{e.color=void 0})}>✕</button>
        </div>
        ${this._avatarGrid(e,n)}
        <button class="btn" style="width:100%;margin-top:6px;color:#ef9a9a"
                @click=${()=>{confirm(`Delete "${e.name||`Roamer`}"?`)&&t.deleteRoamer(e.id)}}>
          Delete roamer
        </button>
      </div>
    `}_roomsSection(){let e=this.planner,t=e.floor(),n=t.rooms??[],r=e.placingRoomId,i=n.length?Qe(t.walls??[]):[],a=t=>{t(),e.save(),e.emitConfig()},o=e.haAreas();return this._section(`rooms`,`Rooms`,()=>I`
        ${o.length&&t.haFloorId?I`
          <div style="display:flex;align-items:center;gap:6px;padding:2px 0 6px 0">
            <button class="btn" style="font-size:10px;padding:2px 6px" data-match-areas
                    title="Bind every unbound room whose name matches an area on this Home Assistant floor"
                    @click=${()=>this._matchRoomsToAreas()}>⇄ Match all by name</button>
            ${this._areaMatchNote?I`
              <span style="flex:1;font-size:10px;color:var(--text-dim)" data-match-note>
                ${this._areaMatchNote}
                <button class="icon-btn" style="font-size:10px;padding:0 2px"
                        @click=${()=>{this._areaMatchNote=``}}>✕</button>
              </span>`:P}
          </div>`:P}
        ${r?I`
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;
                      color:var(--text-dim);padding:4px 0">
            <span style="flex:1">📍 Click inside a room on the plan…</span>
            <button class="btn" style="font-size:10px;padding:2px 6px"
                    @click=${()=>{e.placingRoomId=null,e.emitConfig()}}>Cancel</button>
          </div>
        `:P}
        ${n.length===0&&!r?I`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              No rooms yet — add one, then click inside a walled area to anchor it.
            </div>`:P}
        ${n.map(n=>{let r=se(i,n.anchor.x,n.anchor.y)!==null,o=n.occupancyEntity&&e.hass?.states?.[n.occupancyEntity]?.state===`on`,s=e.roomAreaName(n);return I`
            <div class="sensor-item" style="cursor:default;gap:4px">
              ${n.occupancyEntity?I`<span title="${o?`Occupied`:`Not occupied`}"
                     style="color:${o?`#66bb6a`:`var(--text-dim)`};font-size:12px">●</span>`:P}
              <input type="text" .value=${n.name} style="flex:1;min-width:0" data-room-name-for=${n.id}
                     placeholder=${s?`${s} (from area)`:`Room name…`}
                     @input=${e=>a(()=>{n.name=e.target.value})}>
              ${r?P:I`<span class="badge" title="Anchor is outside every wall loop"
                                     style="color:#ffb74d">⚠ not inside walls</span>`}
              <button class="icon-btn" title="Re-place anchor"
                      @click=${()=>{e.placingRoomId=n.id,e.maybeCloseSidebarForPlacement(),e.emitConfig()}}>📍</button>
              <button class="icon-btn" title="Delete"
                      @click=${()=>this._deleteRoom(n.id)}>✕</button>
            </div>
            <div class="row" style="gap:4px;margin:0 0 2px 0">
              <label style="font-size:10px"
                     title="Bind this room to a Home Assistant area. The area's name is used when no name is typed, and the occupancy / temperature entity pickers open scoped to it.">HA area</label>
              ${this._areaOptions(t,n).length===0?I`<span style="flex:1;font-size:10px;color:var(--text-dim);font-style:italic" data-room-area-empty>
                    ${e.haAreaRegistryLoaded?`(no Home Assistant areas)`:`loading…`}</span>`:I`
                  <select style="flex:1;min-width:0;background:#111;color:var(--text);border:1px solid var(--border);
                                 border-radius:4px;padding:2px 4px;font-size:11px"
                          data-room-area-for=${n.id}
                          .value=${n.haAreaId??``}
                          @change=${e=>{let t=e.target.value;a(()=>{n.haAreaId=t||void 0})}}>
                    <option value="" ?selected=${!n.haAreaId}>— none —</option>
                    ${this._areaOptions(t,n).map(e=>I`
                      <option value=${e.area_id} ?selected=${n.haAreaId===e.area_id}>${e.name}</option>`)}
                  </select>`}
            </div>
            <div class="row" style="gap:4px;margin:0 0 4px 0">
              <label style="font-size:10px" title="Frigate zone / FP2 / any occupancy binary_sensor">Occupancy</label>
              <span style="font-size:10px;color:${o?`#66bb6a`:`var(--text-dim)`};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${n.occupancyEntity||`— unbound —`}
              </span>
              <button class="btn" style="font-size:10px;padding:2px 6px" @click=${()=>this._pickRoomOccupancy(n)}>
                ${n.occupancyEntity?`Rebind`:`Bind`}
              </button>
              ${n.occupancyEntity?I`
                <button class="btn" style="font-size:10px;padding:2px 6px"
                        @click=${()=>a(()=>{n.occupancyEntity=null})}>✕</button>`:P}
            </div>
            ${this._roomFlooringRows(n,a)}
          `})}
        ${this._outdoorRow(t,a)}
        <button class="btn" style="width:100%;margin-top:6px"
                @click=${()=>{e.placingRoomId=x,e.maybeCloseSidebarForPlacement(),e.emitConfig()}}>
          + Add room
        </button>
    `)}_roomFlooringRows(e,t){let n=this.planner,r=n.floor(),i=n.store.scene3d,a=r.look3d?.floorColor??i?.floorColor??`#101820`,o=r.look3d?.floorTex??i?.floorTex??`none`;return I`
      <div class="row" style="gap:4px;margin:0 0 2px 0"
           title="Override the floor colour for THIS room only (its wall loop) in 2D and 3D. ↺ clears it back to the floor-wide look.">
        <label style="font-size:10px">Floor color</label>
        <input type="color" data-room-floor-color-for=${e.id}
               .value=${e.floorColor??a}
               style="width:36px;height:22px;padding:0;border:1px solid var(--border);background:#111"
               @input=${n=>t(()=>{e.floorColor=n.target.value})}>
        ${e.floorColor==null?P:I`
          <button class="btn" style="font-size:10px;padding:2px 6px" title="Use the floor-wide colour"
                  data-room-floor-color-clear=${e.id}
                  @click=${()=>t(()=>{delete e.floorColor})}>↺</button>`}
        <label style="font-size:10px;margin-left:4px">Texture</label>
        <select style="flex:1;min-width:0;background:#111;color:var(--text);border:1px solid var(--border);
                       border-radius:4px;padding:2px 4px;font-size:11px"
                data-room-floor-tex-for=${e.id}
                .value=${e.floorTex??`inherit`}
                @change=${n=>t(()=>{let t=n.target.value;t===`inherit`?delete e.floorTex:e.floorTex=t})}>
          <option value="inherit" ?selected=${e.floorTex==null}>(inherit ${o})</option>
          <option value="none" ?selected=${e.floorTex===`none`}>None</option>
          <option value="wood" ?selected=${e.floorTex===`wood`}>Wood</option>
          <option value="tile" ?selected=${e.floorTex===`tile`}>Tile</option>
          <option value="concrete" ?selected=${e.floorTex===`concrete`}>Concrete</option>
        </select>
      </div>
    `}_outdoorRow(e,t){let n=this.planner,r=e.outdoor,i=n=>t(()=>{let t=e.outdoor??(e.outdoor={});n(t),!(t.name??``).trim()&&!t.haAreaId&&(e.outdoor=void 0)}),a=this._areaOptions(e,r??null);return I`
      <div style="border-top:1px dashed var(--border);margin-top:6px;padding-top:4px">
        <div class="sensor-item" style="cursor:default;gap:4px">
          <span style="font-size:12px" title="Everything outside every closed wall loop">🌳</span>
          <input type="text" .value=${r?.name??``} style="flex:1;min-width:0" data-outdoor-name
                 placeholder=${n.areaName(r?.haAreaId)?`${n.areaName(r?.haAreaId)} (from area)`:`Outdoors`}
                 @input=${e=>i(t=>{t.name=e.target.value})}>
        </div>
        <div style="font-size:10px;color:var(--text-dim);padding:0 0 2px 0">everything outside the walls</div>
        <div class="row" style="gap:4px;margin:0 0 4px 0">
          <label style="font-size:10px"
                 title="Bind the outdoor pseudo-area to a Home Assistant area. Entity pickers opened for a fixture standing outside every room (and off every bound ground area) scope to it.">HA area</label>
          ${a.length===0?I`<span style="flex:1;font-size:10px;color:var(--text-dim);font-style:italic" data-outdoor-area-empty>
                ${n.haAreaRegistryLoaded?`(no Home Assistant areas)`:`loading…`}</span>`:I`
              <select style="flex:1;min-width:0;background:#111;color:var(--text);border:1px solid var(--border);
                             border-radius:4px;padding:2px 4px;font-size:11px"
                      data-outdoor-area
                      .value=${r?.haAreaId??``}
                      @change=${e=>{let t=e.target.value;i(e=>{e.haAreaId=t||void 0})}}>
                <option value="" ?selected=${!r?.haAreaId}>— none —</option>
                ${a.map(e=>I`
                  <option value=${e.area_id} ?selected=${r?.haAreaId===e.area_id}>${e.name}</option>`)}
              </select>`}
        </div>
      </div>
    `}_deleteRoom(e){let t=this.planner.floor();t.rooms&&(t.rooms=t.rooms.filter(t=>t.id!==e)),this.planner.save(),this.planner.emitConfig()}_areaOptions(e,t){let n=this.planner.haAreas();if(!e.haFloorId)return n;let r=n.filter(t=>t.floor_id===e.haFloorId),i=t?.haAreaId;if(i&&!r.some(e=>e.area_id===i)){let e=n.find(e=>e.area_id===i);if(e)return[...r,e]}return r}_matchRoomsToAreas(){let e=this.planner,t=e.floor(),n=this._areaOptions(t,null),r=new Map;for(let e of n)r.set(e.name.trim().toLowerCase(),e.area_id);let i=0;for(let e of t.rooms??[]){if(e.haAreaId)continue;let t=e.name.trim().toLowerCase();if(!t)continue;let n=r.get(t);n&&(e.haAreaId=n,i++)}i&&(e.save(),e.emitConfig()),this._areaMatchNote=i?`Bound ${i} room${i===1?``:`s`} by name.`:`No unbound room names matched an area.`}_areaFilterForRoom(e){let t=this.planner.roomAreaName(e);return e?.haAreaId&&t?{areaId:e.haAreaId,areaName:t}:null}_areaFilterForPoint(e,t){let n=this.planner,r=n.floor(),{loops:i}=this._roomGroupsCtx(),a=m(r,i.length?i:Qe(r.walls??[]),e,t,e=>n.areaName(e));if(!a?.haAreaId)return null;let o=n.areaName(a.haAreaId);return o?{areaId:a.haAreaId,areaName:o}:null}_pickRoomOccupancy(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`binary_sensor`,areaFilter:this._areaFilterForRoom(e),onPick:t=>{e.occupancyEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_rulerEndCaption(e){let t=this.planner,n=t.floor();if(e.kind===`point`)return`point`;if(e.kind===`wall`){let t=n.walls.findIndex(t=>t.id===e.wallId);return t<0?`wall (deleted)`:`wall ${t+1}`}let r=n.furniture.find(t=>t.id===e.furnitureId);return r?r.label||A(r,t.store.customObjects).label:`furniture (deleted)`}_rulersSection(){let e=this.planner,t=e.floor().rulers??[],n=!!e.drawingRuler;return this._section(`rulers`,`Rulers`,()=>I`
      ${n?I`
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
          <span style="flex:1">📏 Click a second point (or a wall / furniture piece) to finish.</span>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  @click=${()=>{e.drawingRuler=null,e.emitConfig()}}>Cancel</button>
        </div>`:P}
      ${t.length===0&&!n?I`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
            No rulers yet — pick the Ruler tool and click two points (or objects) to measure.
          </div>`:P}
      ${t.map((e,t)=>this._rulerItem(e,t))}
      <button class="btn" style="width:100%;margin-top:6px"
              @click=${()=>{e.setActiveRuler(null),e.drawingRuler=null,e.setTool(`ruler`),e.maybeCloseSidebarForPlacement()}}>
        + Add ruler
      </button>
    `)}_rulerItem(e,t){let n=this.planner,r=n.floor(),i=n.activeRulerId===e.id,a=we(e,r),o=a?D(a.mm,n.store.imperial):`— (broken)`,s=e.b.kind===`point`;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${i?`sel`:``}" @click=${()=>n.setActiveRuler(e.id)}>
          <div class="dot" style="background:#ffb74d"></div>
          <div class="nm">📏 Ruler ${t+1}</div>
          <div class="badge">${o}</div>
        </div>
        ${i?I`
          <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
            <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px">
              ${this._rulerEndCaption(e.a)} ↔ ${this._rulerEndCaption(e.b)}
            </div>
            ${s?I`
              <div class="row"><label>Length</label>
                <input type="number" min="0" step="10" .value=${a?String(Math.round(a.mm)):``}
                       title="Enter a length in mm — end B moves along the current bearing"
                       @change=${t=>{let r=parseFloat(t.target.value);isFinite(r)&&n.setRulerLength(e.id,r)}}>
                <span style="font-size:10px;color:var(--text-dim);margin-left:4px">mm</span>
              </div>`:I`<div style="font-size:10px;color:var(--text-dim);margin:2px 0">End B is anchored to an object — length is not editable.</div>`}
            ${this._lockRow(e)}
            <button class="btn danger" style="width:100%;margin-top:6px"
                    @click=${()=>n.deleteRuler(e.id)}>Delete ruler</button>
          </div>`:P}
      </div>
    `}_dimensionsSection(){let e=this.planner,t=e.floor(),n=t.dimensionMode??`off`,r=t.walls.filter(e=>e.dimension).length;return this._section(`dimensions`,`Dimensions`,()=>I`
      <div class="row"><label>Show</label>
        <select .value=${n} @change=${t=>e.setDimensionMode(t.target.value)}>
          <option value="off">Off</option>
          <option value="all">All walls</option>
          <option value="outside">Outside only</option>
          <option value="custom">Custom selection</option>
        </select>
      </div>
      ${n===`custom`?I`
        <button class="btn ${e.pickingDimWalls?`primary`:``}" style="width:100%;margin-top:6px"
                @click=${()=>{e.setPickingDimWalls(!e.pickingDimWalls),e.pickingDimWalls&&e.maybeCloseSidebarForPlacement()}}>
          ${e.pickingDimWalls?`✓ Picking walls — click walls to toggle (ESC to stop)`:`Pick walls`}
        </button>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px">${r} wall${r===1?``:`s`} selected</div>
      `:P}
      <div style="font-size:10px;color:var(--text-dim);margin-top:6px">
        Dimension lines + total structure extents (all / outside) ride the "Dimensions" 2D layer.
      </div>
    `)}_doorsSection(){let e=this.planner.floor();return e.doors.length===0?P:this._section(`doors`,`Doors`,()=>this._groupedList(`doors`,e.doors,t=>this._doorItem(t,e.doors.indexOf(t))))}_localBadge(e){let t=this.planner;return e.localState?I`
      <button class="badge" style="cursor:pointer;border:none;font-family:inherit;opacity:0.65"
              title="Local control (not bound to HA) — click to toggle"
              @click=${()=>t.toggleItem(e)}>local: ${e.localState}</button>`:I`<span class="badge">—</span>`}_doorItem(e,t){let n=this.planner,r=this._doorExpanded.has(e.id),i=n.hass?.states,a=e.entity_id&&i?i[e.entity_id]:null,o=a?.state===`on`,s=a&&(a.state===`unavailable`||a.state===`unknown`),c=!!e.entity_id,l=!c&&e.localState?e.localState===`on`:o,u=c?s?`n/a`:o?`OPEN`:`closed`:`—`,d=c&&!s&&o?`bound`:``;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default">
          <div class="dot" style="background:${l?`#66bb6a`:`#90a4ae`}"></div>
          <div class="nm">${e.label?.trim()||`Door`}</div>
          ${c?I`
            <button class="badge ${d}" style="cursor:pointer;border:none;font-family:inherit"
                    ?disabled=${s||!n.hass}
                    title=${o?`Click to toggle (close)`:`Click to toggle (open)`}
                    @click=${()=>n.toggleEntity(e.entity_id)}>
              ${u}
            </button>
          `:this._localBadge(e)}
          <button class="icon-btn" title=${c?`Rebind`:`Bind`}
                  @click=${()=>this._pickDoorEntity(e)}>🔗</button>
          <button class="icon-btn" title=${r?`Hide`:`Edit`}
                  @click=${()=>this._toggleDoorExpanded(e.id)}>${r?`▾`:`▸`}</button>
          <button class="icon-btn" title="Delete"
                  @click=${()=>this._deleteDoor(t)}>✕</button>
        </div>
        ${r?this._doorEditor(e):P}
      </div>
    `}_toggleDoorExpanded(e){this._doorExpanded.has(e)?this._doorExpanded.delete(e):this._doorExpanded.add(e),this.requestUpdate()}_deleteDoor(e){this.planner.floor().doors.splice(e,1),this.planner.save(),this.planner.emitConfig()}_pickDoorEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`binary_sensor`,`cover`],onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_pickDoorbell(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`event`,`binary_sensor`,`button`,`input_button`],onPick:t=>{e.doorbellEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_doorbellBindRow(e,t){let n=this.planner,r=e.doorbellEntity&&n.hass?.states?n.hass.states[e.doorbellEntity]:null;return I`
      <div class="row" style="margin-top:6px"><label title="event.* / binary_sensor.* / button.* — a state change rings">Doorbell</label>
        <span style="font-size:11px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${e.doorbellEntity?`${e.doorbellEntity}${r?` · ${r.state}`:``}`:`— unbound —`}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickDoorbell(e)}>
          ${e.doorbellEntity?`Rebind`:`Bind`} doorbell…
        </button>
        ${e.doorbellEntity?I`
          <button class="btn" style="font-size:11px"
                  @click=${()=>t(()=>{e.doorbellEntity=null})}>Unbind</button>
        `:P}
      </div>
    `}_doorLockBindRow(e,t){let n=this.planner,r=n.doorLockState(e),i=!!e.lockEntity,a=i?n.hass?.states?.[e.lockEntity]?.state:void 0,o=i?r===`locked`?`${e.lockEntity} · LOCKED`:r===`unlocked`?`${e.lockEntity} · unlocked`:`${e.lockEntity} · ${a??`n/a`}`:e.lockLocalState?`local · ${e.lockLocalState}`:`— unbound —`,s=r===`locked`?`#ef9a9a`:r===`unlocked`?`#66bb6a`:`var(--text-dim)`,c=i||!!e.lockLocalState,l=e.lockControl===`display`,u=c&&!l;return I`
      <div class="row" style="margin-top:6px"><label title="lock.* entity — click the state to toggle">Lock</label>
        <span role="button" title=${u?`Click to toggle lock`:l?`Display only — clicks do not lock/unlock`:``}
              style="font-size:11px;color:${s};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:${u?`pointer`:`default`}"
              @click=${()=>{u&&(n.toggleDoorLock(e),this.requestUpdate())}}>
          ${o}${l?` · display only`:``}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickDoorLock(e)}>
          ${e.lockEntity?`Rebind`:`Bind`} lock…
        </button>
        ${i?I`
          <button class="btn" style="font-size:11px"
                  @click=${()=>t(()=>{e.lockEntity=null})}>Unbind</button>
        `:I`
          <button class="btn" style="font-size:11px"
                  title="Add / toggle a local (unbound) lock state"
                  @click=${()=>t(()=>{e.lockLocalState=e.lockLocalState===`locked`?`unlocked`:`locked`})}>
            ${e.lockLocalState?`Toggle local`:`Add local lock`}</button>
        `}
      </div>
      ${c?I`
        <div class="row" style="margin-top:4px">
          <label title="Display only = the padlock/deadbolt shows live state but never locks/unlocks on tap (a shed padlock, a read-by-policy unit — safe against a stray kiosk tap)">Lock control</label>
          <select style="flex:1;font-size:11px"
                  @change=${n=>t(()=>{e.lockControl=n.target.value===`display`?`display`:`full`})}>
            <option value="full" ?selected=${!l}>Full control</option>
            <option value="display" ?selected=${l}>Display only</option>
          </select>
        </div>
      `:P}
    `}_pickDoorLock(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`lock`,onPick:t=>{e.lockEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_colorRow(e,t,n,r,i){return I`
      <div class="row">
        <label title=${r}>${e}</label>
        <input type="color" style="width:44px;padding:0;height:22px"
               .value=${t??n}
               @change=${e=>i(e.target.value||void 0)}>
        ${t?I`<button class="btn" style="font-size:10px;padding:2px 6px"
                         title="Use the default colour" @click=${()=>i(void 0)}>✕</button>`:I`<span style="font-size:10px;color:var(--text-dim)">default</span>`}
      </div>`}_doorEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``}
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>n(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>n(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Kind</label>
          <select @change=${t=>n(()=>{let n=t.target.value;e.kind=n,e.w===800&&(e.w=b(n))})}>
            <option value="swing" ?selected=${(e.kind??`swing`)===`swing`}>Swing</option>
            <option value="garage" ?selected=${e.kind===`garage`}>Garage</option>
            <option value="gate" ?selected=${e.kind===`gate`}>Gate</option>
            <option value="sliding" ?selected=${e.kind===`sliding`}>Sliding</option>
            <option value="pocket" ?selected=${e.kind===`pocket`}>Pocket</option>
            <option value="double" ?selected=${e.kind===`double`}>Double swing</option>
            <option value="french" ?selected=${e.kind===`french`}>French</option>
            <option value="sliding_glass" ?selected=${e.kind===`sliding_glass`}>Sliding glass</option>
          </select>
        </div>
        ${e.kind===`garage`?I`
        <div class="row"><label>Style</label>
          <select @change=${t=>n(()=>{let n=t.target.value;n===`sectional`?delete e.garageStyle:e.garageStyle=n})}>
            <option value="sectional" ?selected=${(e.garageStyle??`sectional`)===`sectional`}>Sectional (default)</option>
            <option value="raised_panel" ?selected=${e.garageStyle===`raised_panel`}>Raised panel</option>
            <option value="carriage" ?selected=${e.garageStyle===`carriage`}>Carriage house</option>
            <option value="roll_up" ?selected=${e.garageStyle===`roll_up`}>Roll-up coil</option>
            <option value="glass_panel" ?selected=${e.garageStyle===`glass_panel`}>Full-view glass</option>
            <option value="tilt_up" ?selected=${e.garageStyle===`tilt_up`}>One-piece tilt</option>
            <option value="sectional_windows_top" ?selected=${e.garageStyle===`sectional_windows_top`}>Sectional · top windows</option>
            <option value="sectional_windows_left" ?selected=${e.garageStyle===`sectional_windows_left`}>Sectional · left windows</option>
            <option value="sectional_windows_right" ?selected=${e.garageStyle===`sectional_windows_right`}>Sectional · right windows</option>
          </select>
        </div>
        <div class="row">
          <label title="Opening height in mm (1800–4200). Sets the wall opening's lintel AND the drawn leaf; blank uses the 2100 mm default.">Opening height (mm)</label>
          <input type="number" min=${dn} max=${ke} step="50"
                 placeholder=${String(h)}
                 .value=${e.garageHeight==null?``:String(Math.round(e.garageHeight))}
                 @change=${t=>n(()=>{let n=t.target.value.trim(),r=parseFloat(n);!n||!isFinite(r)||gt({garageHeight:r})===2100?delete e.garageHeight:e.garageHeight=gt({garageHeight:r})})}>
        </div>`:P}
        ${this._colorRow(`Color`,e.color,`#90a4ae`,`Tints the door panel / slab / leaf. Glass, locks and garage track hardware keep their own colours; in the 2D plan it replaces the closed-state stroke only.`,t=>n(()=>{t==null?delete e.color:e.color=t}))}
        <div class="row"><label>Width (mm)</label>
          <input type="number" min="200" .value=${String(Math.round(e.w))}
                 @input=${t=>n(()=>{e.w=Math.max(200,parseFloat(t.target.value)||0)})}>
        </div>
        <div class="row"><label>Rotation (°)</label>
          <input type="number" step="15" .value=${String(Math.round(e.rotation))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value)||0,r=it(e,Math.round(n/15)*15);e.x=r.x,e.y=r.y,e.rotation=r.rotation})}>
        </div>
        ${(e.kind??`swing`)===`garage`||pr(e.kind)?P:I`
        <div class="row"><label>${un(e.kind)?`Slide side`:`Hinge / slide side`}</label>
          <div style="display:flex;gap:4px">
            <button class="btn ${(e.hinge??`right`)===`left`?`active`:``}"
                    style="font-size:11px;padding:3px 8px"
                    title=${un(e.kind)?`Panel retracts toward the far (endpoint) end`:`Left-hand hinge: door swings clockwise on screen`}
                    @click=${()=>n(()=>{e.hinge=`left`})}>◐ Left</button>
            <button class="btn ${(e.hinge??`right`)===`right`?`active`:``}"
                    style="font-size:11px;padding:3px 8px"
                    title=${un(e.kind)?`Panel retracts toward the hinge (X,Y) end`:`Right-hand hinge: door swings counter-clockwise on screen`}
                    @click=${()=>n(()=>{e.hinge=`right`})}>Right ◑</button>
          </div>
        </div>`}
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickDoorEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
        </div>
        ${this._doorLockBindRow(e,n)}
        ${this._doorbellBindRow(e,n)}
        <div style="font-size:10px;color:var(--text-dim);margin-top:6px;line-height:1.3">
          Hinge at (X,Y). Panel extends along rotation (15° snap). Sliding /
          pocket / sliding-glass kinds read "slide side" as the end the panel
          retracts toward; double + french open as a mirrored pair. Bind to a
          binary_sensor ("on" = open) or a cover.* (garage / position). Garage
          doors pick an overhead style + opening height and show their open
          percentage; their tracks and opener sit on the INSIDE face while the
          pull handle sits outside, so front and back always read. An
          optional lock.* padlock is clickable (set "Lock control" to display
          for a read-only badge); the doorbell binding is display only.
        </div>
      </div>
    `}_windowsSection(){let e=this.planner.floor();return e.windows.length===0?P:this._section(`windows`,`Windows`,()=>this._groupedList(`windows`,e.windows,t=>this._windowItem(t,e.windows.indexOf(t))))}_windowItem(e,t){let n=this.planner,r=this._windowExpanded.has(e.id),i=n.hass?.states,a=e.entity_id&&i?i[e.entity_id]:null,o=a?.state===`on`,s=a&&(a.state===`unavailable`||a.state===`unknown`),c=!!e.entity_id,l=!c&&e.localState?e.localState===`on`:o,u=c?s?`n/a`:o?`OPEN`:`closed`:`—`,d=c&&!s&&o?`bound`:``;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default">
          <div class="dot" style="background:${l?`#66bb6a`:`#64b5f6`}"></div>
          <div class="nm">${e.label?.trim()||`Window`}</div>
          ${c?I`
            <button class="badge ${d}" style="cursor:pointer;border:none;font-family:inherit"
                    ?disabled=${s||!n.hass}
                    title=${`Click to toggle`}
                    @click=${()=>n.toggleEntity(e.entity_id)}>
              ${u}
            </button>
          `:this._localBadge(e)}
          <button class="icon-btn" title=${c?`Rebind`:`Bind`}
                  @click=${()=>this._pickWindowEntity(e)}>🔗</button>
          <button class="icon-btn" title=${r?`Hide`:`Edit`}
                  @click=${()=>this._toggleWindowExpanded(e.id)}>${r?`▾`:`▸`}</button>
          <button class="icon-btn" title="Delete"
                  @click=${()=>this._deleteWindow(t)}>✕</button>
        </div>
        ${r?this._windowEditor(e):P}
      </div>
    `}_toggleWindowExpanded(e){this._windowExpanded.has(e)?this._windowExpanded.delete(e):this._windowExpanded.add(e),this.requestUpdate()}_deleteWindow(e){this.planner.floor().windows.splice(e,1),this.planner.save(),this.planner.emitConfig()}_pickWindowEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`binary_sensor`,onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_pickWindowCover(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`cover`,onPick:t=>{e.coverEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_windowCoverBindRow(e,t){let n=this.planner,r=e.coverEntity&&n.hass?.states?n.hass.states[e.coverEntity]:null;return I`
      <div class="row" style="margin-top:6px"><label title="cover.* blind / shade / curtain">Blind</label>
        <span style="font-size:11px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${e.coverEntity?`${e.coverEntity}${r?` · ${r.state}`:``}`:`— unbound —`}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickWindowCover(e)}>
          ${e.coverEntity?`Rebind`:`Bind`} blind…
        </button>
        ${e.coverEntity?I`
          <button class="btn" style="font-size:11px"
                  @click=${()=>t(()=>{e.coverEntity=null})}>Unbind</button>
        `:P}
      </div>
    `}_windowEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``}
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(e.x))}
                 @input=${t=>n(()=>{e.x=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(e.y))}
                 @input=${t=>n(()=>{e.y=parseFloat(t.target.value)||0})}>
        </div>
        <div class="row"><label>Width (mm)</label>
          <input type="number" min="200" .value=${String(Math.round(e.w))}
                 @input=${t=>n(()=>{e.w=Math.max(200,parseFloat(t.target.value)||0)})}>
        </div>
        <div class="row"><label>Rotation (°)</label>
          <input type="number" step="15" .value=${String(Math.round(e.rotation))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value)||0,r=ne(e,Math.round(n/15)*15);e.x=r.x,e.y=r.y,e.rotation=r.rotation})}>
        </div>
        <div class="row"><label>Type</label>
          <select @change=${t=>n(()=>{let n=t.target.value;e.w===mr(e.kind)&&(e.w=mr(n)),e.kind=n})}>
            ${Wr.map(t=>I`
              <option value=${t.id} ?selected=${(e.kind??`single`)===t.id}>${t.label}</option>`)}
          </select>
        </div>
        <div class="row"><label>Sill (mm)</label>
          <input type="number" min="0" max="2400" step="50"
                 .value=${String(Math.round(fr(e)))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.sill=isFinite(n)?Math.max(0,Math.min(2400,n)):fr({kind:e.kind})})}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="200" max="2600" step="50"
                 .value=${String(Math.round(At(e)))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.height=isFinite(n)?Math.max(200,Math.min(2600,n)):At({kind:e.kind})})}>
        </div>
        ${this._colorRow(`Frame color`,e.frameColor,`#9aa4ad`,`Tints the sashes, mullions, meeting rails and bay casework. Glass, blinds and curtains keep their own colours; in the 2D plan it replaces the closed-state stroke only.`,t=>n(()=>{t==null?delete e.frameColor:e.frameColor=t}))}
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.entity_id||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickWindowEntity(e)}>
            ${e.entity_id?`Rebind`:`Bind`}…
          </button>
          ${e.entity_id?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>n(()=>{e.entity_id=null})}>Unbind</button>
          `:P}
        </div>
        ${this._windowCoverBindRow(e,n)}
        ${this._windowCurtainBlock(e,n)}
        <div style="font-size:10px;color:var(--text-dim);margin-top:6px;line-height:1.3">
          Pane center at (X, Y). Rotation is wall axis (15° snap). Bind to a
          binary_sensor ("on" = open); optional cover.* blind renders a roller shade.
        </div>
      </div>
    `}_windowCurtainBlock(e,t){let n=this.planner,r=e.curtain,i=r?.style??`none`,a=r?.entityId&&n.hass?.states?n.hass.states[r.entityId]:null,o=r?.entityId?`${r.entityId}${a?` · ${a.state}`:``}`:`— unbound —`;return I`
      <div style="background:rgba(0,0,0,0.18);border-radius:4px;padding:5px;margin-top:6px">
        <div class="row"><label title="Interior fabric over the glass">Curtain</label>
          <select @change=${n=>t(()=>{let t=n.target.value;if(t===`none`){e.curtain=void 0;return}e.curtain={...e.curtain??{},style:t}})}>
            <option value="none" ?selected=${i===`none`}>None</option>
            <option value="horizontal" ?selected=${i===`horizontal`}>Roman (rises)</option>
            <option value="vertical" ?selected=${i===`vertical`}>Drape (one side)</option>
            <option value="split" ?selected=${i===`split`}>Split (two panels)</option>
          </select>
        </div>
        ${r&&r.style===`vertical`?I`
          <div class="row"><label>Side</label>
            <select @change=${n=>t(()=>{e.curtain={...r,side:n.target.value}})}>
              <option value="right" ?selected=${(r.side??`right`)===`right`}>Right</option>
              <option value="left" ?selected=${r.side===`left`}>Left</option>
            </select>
          </div>`:P}
        ${r?I`
          <div class="row"><label>Color</label>
            <input type="color" .value=${r.color??`#b9a58c`}
                   @input=${n=>t(()=>{e.curtain={...r,color:n.target.value}})}>
          </div>
          <div class="row" style="margin-top:4px"><label title="cover.* / binary_sensor / switch — 'on' = open">Entity</label>
            <span style="font-size:11px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${o}
            </span>
          </div>
          <div style="display:flex;gap:4px;margin-top:4px">
            <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickWindowCurtain(e)}>
              ${r.entityId?`🔗 Rebind`:`🔗 Bind`}…
            </button>
            ${r.entityId?I`
              <button class="btn" style="font-size:11px"
                      @click=${()=>t(()=>{e.curtain={...r,entityId:null}})}>✕</button>`:P}
          </div>
          ${r.entityId?P:I`
            <div class="row" style="margin-top:4px"><label title="0 = closed (covering), 100 = open (gathered)">Open %</label>
              <input type="range" min="0" max="100" step="5" style="flex:1"
                     .value=${String(Math.round(e.curtainPos??0))}
                     @input=${n=>t(()=>{e.curtainPos=Math.max(0,Math.min(100,parseFloat(n.target.value)||0))})}>
              <span style="font-size:11px;color:var(--text-dim);min-width:32px;text-align:right">${Math.round(e.curtainPos??0)}%</span>
            </div>`}
        `:P}
      </div>
    `}_pickWindowCurtain(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`cover`,`binary_sensor`,`switch`],onPick:t=>{e.curtain={...e.curtain??{style:`vertical`},entityId:t},this.planner.save(),this.planner.emitConfig()}}}))}_furnSectionSlug(e){let t=T(A(e,this.planner.store.customObjects));return t===`plants`?`plants`:t===`appliance`?`appliances`:`furniture`}_furnitureSection(){let e=this.planner.floor();if(e.furniture.length===0)return P;let t=t=>e.furniture.filter(e=>this._furnSectionSlug(e)===t),n=n=>this._groupedList(n,t(n),t=>this._furnitureItem(t,e.furniture.indexOf(t)));return I`
      ${this._section(`furniture`,`Furniture`,()=>n(`furniture`))}
      ${this._section(`plants`,`Plants & Trees`,()=>n(`plants`))}
      ${this._section(`appliances`,`Appliances`,()=>n(`appliances`))}
    `}_furnitureItem(e,t){let n=A(e,this.planner.store.customObjects),r=this._furnExpanded.has(e.id),i=e.label?.trim()||n.label,a=e.vehicleModelId?`Vehicle`:n.label;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default">
          <span style="font-size:11px;color:var(--text-dim);min-width:54px">${a}</span>
          <div class="nm">${i}</div>
          <button class="icon-btn" title=${r?`Hide`:`Edit`}
                  @click=${()=>this._toggleFurnExpanded(e.id)}>${r?`▾`:`▸`}</button>
          <button class="icon-btn" title="Delete"
                  @click=${()=>this._deleteFurniture(t)}>✕</button>
        </div>
        ${r?this._furnitureEditor(e):P}
      </div>
    `}_toggleFurnExpanded(e){this._furnExpanded.has(e)?this._furnExpanded.delete(e):this._furnExpanded.add(e),this.requestUpdate()}_deleteFurniture(e){this.planner.floor().furniture.splice(e,1),this.planner.save(),this.planner.emitConfig()}_vehicleModelRow(e){let t=e.vehicleModelId??``,n=fn(t),r=Ne(t),i=r?[...r.path,r.label].filter(Boolean).join(` ▸ `):null;return I`
      <div class="row"><label title="Model from a vehicle pack (Settings ▸ Vehicles)">Model</label>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${n?n.label:t}
          </div>
          <div style="font-size:9px;color:var(--text-dim)">
            ${n?i??`vehicle pack`:`pack not loaded — renders as a plain block (Settings ▸ Vehicles)`}
          </div>
        </div>
      </div>`}_furnitureEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=ce(e);return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label??``}
                 placeholder=${A(e,t.store.customObjects).label}
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        ${this._lockRow(e)}
        ${e.vehicleModelId?this._vehicleModelRow(e):I`
        <div class="row"><label>Type</label>
          <select .value=${e.customKindId?`custom:`+e.customKindId:r}
                  @change=${r=>n(()=>{let n=r.target.value,i=A(e,t.store.customObjects),a=e.w===i.w&&e.h===i.h;if(n.startsWith(`custom:`)){if(e.customKindId=n.slice(7),a){let n=t.store.customObjects?.find(t=>t.id===e.customKindId);n&&(e.w=n.w,e.h=n.h)}}else{let t=n;e.customKindId=void 0,e.kind=t,a&&(e.w=y[t].w,e.h=y[t].h)}})}>
            ${this._kindOptions(e.customKindId?`custom:`+e.customKindId:r)}
          </select>
        </div>`}
        ${this._furnitureBindRow(e,n)}
        ${Oe(r)?this._screenContentRow(e,n):P}
        <!-- Bias light stays tv/wall_tv-only: a projection screen has no
             backlight (see the note at SCREEN_SURFACE_KINDS). -->
        ${r===`tv`||r===`wall_tv`?this._biasLightRow(e,n):P}
        ${r===`fridge`?this._fridgeDoorBindRow(e,n):P}
        ${T(A(e,t.store.customObjects))===`appliance`?this._powerBindRow(e,n):P}
        ${r===`stove`||r===`fridge`?this._tempBindRow(e,n):P}
        ${Ot(e,t.store.customObjects)?this._moistureBindRow(e,n):P}
        ${r===`dishwasher`||r===`washer`||r===`dryer`||r===`stove`||r===`microwave`?this._jobStateRow(e,n):P}
        ${r===`car`||r===`ev_charger`?this._evChargerRows(e,n):P}
        ${r===`mailbox`?this._mailboxRows(e,n):P}
        ${Ke(r)?this._mechanicalRows(e,n):P}
        ${v(r)?this._rackRows(e,n):P}
        ${vt(r)?I`
          <div class="row"><label title="While running, the fan head yaws in a slow ±45° sweep (blades keep spinning inside the sweeping head)">Oscillate</label>
            <input type="checkbox" .checked=${e.oscillate===!0}
                   @change=${t=>n(()=>{e.oscillate=t.target.checked||void 0})}>
          </div>`:P}
        ${r===`stove`?I`
          <div class="row"><label title="Persistent oven-door open state (also toggled by clicking the stove in 2D/3D)">Oven door open</label>
            <input type="checkbox" .checked=${!!e.doorOpen}
                   @change=${t=>n(()=>{e.doorOpen=t.target.checked})}>
          </div>`:P}
        <div class="row"><label>Color</label>
          <input type="color"
                 .value=${e.color??`#`+(A(e,t.store.customObjects).color&16777215).toString(16).padStart(6,`0`)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${t=>n(()=>{e.color=t.target.value})}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to the kind's default color"
                  @click=${()=>n(()=>{e.color=void 0})}>✕</button>
        </div>
        ${Qt(r)?I`
          <div class="row"><label title="Two occupants hide under a shared blanket (the lump breathes). Off: they lie side by side, no blanket.">Two-person covers</label>
            <input type="checkbox" .checked=${e.sharedBedCovers!==!1}
                   @change=${t=>n(()=>{e.sharedBedCovers=t.target.checked})}>
          </div>`:P}
        <div class="row"><label>Width (mm)</label>
          <input type="number" min="50" .value=${String(Math.round(e.w))}
                 @input=${t=>n(()=>{e.w=Math.max(50,parseFloat(t.target.value)||0)})}>
        </div>
        <div class="row"><label>Depth (mm)</label>
          <input type="number" min="50" .value=${String(Math.round(e.h))}
                 @input=${t=>n(()=>{e.h=Math.max(50,parseFloat(t.target.value)||0)})}>
        </div>
        <div class="row"><label>Elevation (mm)</label>
          <input type="number" step="50" .value=${String(Math.round(e.elevation??0))}
                 title="Base height above the floor (the piece's BOTTOM). Positive raises (1372 = upper flight of an L staircase); negative sinks — stairs at −2743 descend a full storey and cut a stairwell. A landing's walking surface sits at elevation + 1372, so a landing halfway down a basement stair needs −2743"
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.elevation=isFinite(n)&&n!==0?n:void 0})}>
        </div>
        ${sn(r)?this._stairsFitRows(e,r,n):P}
        ${sn(r)?this._stairLinkRow(e,n):P}
        ${ve(r)?this._treeHeightRow(e,r,n):P}
        <div class="row"><label>Rotation (°)</label>
          <input type="number" step="15" .value=${String(Math.round(e.rotation??0))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value)||0;e.rotation=(Math.round(n/15)*15%360+360)%360})}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Rotate −15°"
                  @click=${()=>n(()=>{e.rotation=(((e.rotation??0)-15)%360+360)%360})}>↺</button>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  title="Rotate +15°"
                  @click=${()=>n(()=>{e.rotation=(((e.rotation??0)+15)%360+360)%360})}>↻</button>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          Front (backrest, headboard, pillows) faces +Y world at rotation 0.
          Snaps to 15° increments. Corner-resize handles hide while rotated.
        </div>
      </div>
    `}_treeHeightRow(e,t,n){let r=y[t].ht;return I`
      <div class="row"><label>Height (mm)</label>
        <input type="number" min=${ue} max=${w} step="100"
               .value=${e.ht==null?``:String(Math.round(e.ht))}
               placeholder=${String(r)}
               title="Overall height of this tree, ground to crown. Blank = the kind default (${r} mm). The trunk and canopy scale together, so a taller value grows a bigger tree rather than stretching this one. Clamped ${ue}–${w} mm; the footprint (width/depth above) still sets the canopy spread."
               @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.ht=isFinite(n)&&Math.round(n)!==r?Math.min(w,Math.max(ue,n)):void 0})}>
      </div>
    `}_stairsFitRows(e,t,n){let r=y[t].ht,i=this._stairsFitMsg[e.id];return I`
      <div class="row"><label>Rise (mm)</label>
        <input type="number" min=${50} step="10" .value=${e.ht==null?``:String(Math.round(e.ht))}
               placeholder=${String(r)}
               title="Total height this flight / ramp climbs, foot to head. Blank = the kind default (${r} mm). Steps are laid out from the rise AND the run, so a short rise builds one or two real steps instead of three slivers."
               @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.ht=isFinite(n)&&n>=50&&Math.round(n)!==r?n:void 0})}>
      </div>
      ${t===`stairs`||t===`stairs_half`?I`
        <div class="row"><label>Steps</label>
          <input type="number" min="1" step="1" .value=${e.stairTreads==null?``:String(Math.round(e.stairTreads))}
                 placeholder=${`auto: ${Dn(e.h,an(e,r))}`}
                 title="How many steps this flight has. Blank = derived from the run depth and the rise. Counting the steps on your real staircase overrides both — the treads, the plan symbol and the height a figure stands at all follow this number."
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.stairTreads=isFinite(n)&&n>=1?Math.min(60,Math.round(n)):void 0})}>
        </div>`:P}
      <div class="row"><label></label>
        <button class="btn" style="font-size:10px;padding:2px 6px"
                title="Read the ground just past each end of the piece and set its elevation + rise to bridge them. If the piece is aimed downhill it is rotated 180° so it still rises from the lower end."
                @click=${()=>{let t=this.planner.autofitStairs(e);this._stairsFitMsg={...this._stairsFitMsg,[e.id]:t??``},this.requestUpdate()}}>⇅ Fit between levels</button>
        ${i?I`<span style="font-size:10px;color:var(--text-dim);margin-left:6px">${i}</span>`:P}
      </div>
      <div class="row">
        <label title="Render the flight / ramp / landing FLOATING — thin slabs with open air underneath instead of a solid mass down to the base. The walking surface is identical either way (3D look only).">Open underneath</label>
        <input type="checkbox" .checked=${e.stairsOpen===!0}
               @change=${t=>n(()=>{e.stairsOpen=t.target.checked||void 0})}>
      </div>
      ${t===`stairs`||t===`stairs_half`?I`
        <div class="row">
          <label title="Checked: the top tread is flush with the level this flight rises to. Unchecked (default): treads start one step down from the ledge — the level above acts as the final step, so a flight of N steps has N+1 risers.">Start at top level</label>
          <input type="checkbox" .checked=${e.stairsTopFlush===!0}
                 @change=${t=>n(()=>{e.stairsTopFlush=t.target.checked?!0:void 0})}>
        </div>
        <div class="row">
          <label title="Draw a wall on each side of the flight running from the stair line up to the ceiling of this storey — the enclosed-stairwell look. Because the top edge is the ceiling plane, two half flights at different levels top out together. Replaces the open-flight stringers with one continuous board per side.">Side walls to level above</label>
          <input type="checkbox" .checked=${e.stairsSideWalls===!0}
                 @change=${t=>n(()=>{e.stairsSideWalls=t.target.checked||void 0})}>
        </div>
        ${e.stairsOpen===!0?I`
          <div class="row">
            <label title="Close each step with a riser board under the tread's nosing. A solid flight is already closed by its own mass, so this only applies while “Open underneath” is on.">Risers</label>
            <input type="checkbox" .checked=${e.stairsRisers===!0}
                   @change=${t=>n(()=>{e.stairsRisers=t.target.checked||void 0})}>
          </div>`:P}
        <div class="row">
          <label title="Capped posts at the foot and the head of the flight, both sides — where a handrail terminates.">Newel posts</label>
          <input type="checkbox" .checked=${e.stairsNewels===!0}
                 @change=${t=>n(()=>{e.stairsNewels=t.target.checked||void 0})}>
        </div>
        <div class="row">
          <label title="A sloped rail on each side, 900 mm above the nosing line, with one baluster per step. With side walls on it becomes a wall-mounted rail and the balusters are dropped.">Handrail</label>
          <input type="checkbox" .checked=${e.stairsHandrail===!0}
                 @change=${t=>n(()=>{e.stairsHandrail=t.target.checked||void 0})}>
        </div>`:P}
    `}_stairLinkRow(e,t){let n=this.planner,r=n.stairLinkPartner(e),i=e=>`${Math.round(e.elevation??0)} mm`,a=[];for(let e of n.store.floors)if(e.id!==n.floor().id)for(let t of e.furniture){if(!sn(t.kind))continue;let n=y[ce(t)];a.push({floorId:e.id,floorName:e.name,id:t.id,label:`${e.name} · ${n.label} · ${i(t)}`})}return I`
      <div class="row"><label title="Link this flight to a stairs piece on another floor so BLE avatars hand off between them on a floor change.">Linked stairs</label>
        ${e.stairLinkId?r?I`<span style="font-size:10px;color:#66bb6a">↔ ${r.floor.name} · ${y[ce(r.piece)].label}</span>`:I`<span style="font-size:10px;color:#ffb74d">(broken link)</span>`:I`<span style="font-size:10px;color:var(--text-dim)">— none —</span>`}
        ${e.stairLinkId?I`
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px" title="Clear link (both sides)"
                  @click=${()=>n.clearStairLink(e.id)}>✕</button>`:P}
      </div>
      ${a.length===0?I`<div style="font-size:10px;color:var(--text-dim);padding:0 0 2px">No stairs on other floors.</div>`:I`<div class="row"><label>Link to</label>
            <select @change=${t=>{let r=t.target.value;if(t.target.selectedIndex=0,!r)return;let[i,a]=r.split(`|`);n.linkStairs(e.id,i,a)}}>
              <option value="">— pick a stairs piece —</option>
              ${a.map(e=>I`<option value=${e.floorId+`|`+e.id}>${e.label}</option>`)}
            </select>
          </div>`}
    `}_furnitureBindRow(e,t){let n=this.planner;return!A(e,n.store.customObjects).activity&&ce(e)!==`tv`&&!Oe(e.kind)&&!Jt(e.kind)&&!Me(e.kind)&&!rr(e.kind)&&!Ke(e.kind)?P:I`
      <div class="row"><label>HA entity</label>
        <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${e.entity_id||`— unbound —`}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickFurnitureEntity(e)}>
          ${e.entity_id?`Rebind`:`Bind`}…
        </button>
        ${e.entity_id?I`
          <button class="btn" style="font-size:11px"
                  @click=${()=>t(()=>{e.entity_id=null})}>Unbind</button>
        `:P}
      </div>
    `}_fridgeDoorBindRow(e,t){let n=this.planner,r=(e.doorEntity&&n.hass?.states?n.hass.states[e.doorEntity]:null)?.state===`on`;return I`
      <div class="row"><label title="binary_sensor: 'on' = door open">Door sensor</label>
        <span style="font-size:11px;color:${r?`#66bb6a`:`var(--text-dim)`};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${e.doorEntity?`${e.doorEntity} · ${r?`OPEN`:`closed`}`:`— unbound —`}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickFridgeDoor(e)}>
          ${e.doorEntity?`Rebind`:`Bind`} door…
        </button>
        ${e.doorEntity?I`
          <button class="btn" style="font-size:11px"
                  @click=${()=>t(()=>{e.doorEntity=null})}>Unbind</button>
        `:P}
      </div>
    `}_biasLightRow(e,t){let n=e.biasLight,r=!!n;return I`
      <div class="row"><label title="Soft accent glow behind the screen (home-theater bias lighting)">Bias light</label>
        <input type="checkbox" .checked=${r}
               @change=${n=>t(()=>{e.biasLight=n.target.checked?{}:void 0})}>
      </div>
      ${r?I`
        <div class="row"><label>Glow color</label>
          <input type="color" .value=${n.color??`#fff1d6`}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${n=>t(()=>{e.biasLight.color=n.target.value})}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to the default warm-white glow"
                  @click=${()=>t(()=>{e.biasLight.color=void 0})}>✕</button>
        </div>
        <div class="row"><label title="Bound light.*/switch.*: glow while ON. Unbound: AUTO glow while the TV plays.">Bias entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${n.entityId||`AUTO (while playing)`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickBiasEntity(e)}>
            ${n.entityId?`Rebind`:`Bind`} light…
          </button>
          ${n.entityId?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>t(()=>{e.biasLight.entityId=void 0})}>Unbind</button>
          `:P}
        </div>
      `:P}
    `}_screenContentRow(e,t){let n=e.screenMode??`auto`;return I`
      <div class="row"><label title="What the screen shows when no media is playing">Screen</label>
        <select .value=${n}
                @change=${n=>t(()=>{let t=n.target.value;e.screenMode=t===`auto`?void 0:t})}>
          <option value="auto" ?selected=${n===`auto`}>Auto (now-playing only)</option>
          <option value="news" ?selected=${n===`news`}>News ticker</option>
          <option value="weather" ?selected=${n===`weather`}>Weather</option>
          <option value="off" ?selected=${n===`off`}>Off</option>
        </select>
      </div>
      ${n===`news`?I`
        <div class="row"><label title="Any sensor.*/event.* whose attributes carry headlines (feedparser/template)">News entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${e.newsEntity||`— unbound —`}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickNewsEntity(e)}>
            ${e.newsEntity?`Rebind`:`Bind`} news…
          </button>
          ${e.newsEntity?I`
            <button class="btn" style="font-size:11px"
                    @click=${()=>t(()=>{e.newsEntity=null})}>Unbind</button>
          `:P}
        </div>
      `:P}
      ${n===`weather`?I`
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px">Uses the global weather source (Settings ▸ Weather).</div>
      `:P}
    `}_pickNewsEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`sensor`,`event`],onPick:t=>{e.newsEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_pickBiasEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`light`,`switch`],onPick:t=>{e.biasLight||(e.biasLight={}),e.biasLight.entityId=t,this.planner.save(),this.planner.emitConfig()}}}))}_pickFridgeDoor(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`binary_sensor`,onPick:t=>{e.doorEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_powerBindRow(e,t){let n=this.planner,r=e.powerEntity&&n.hass?.states?n.hass.states[e.powerEntity]:null,i=r?parseFloat(r.state):NaN,a=isFinite(i)?`${Math.round(i)} W`:r?r.state:``;return I`
      <div class="row"><label title="sensor.* (W) — scales the in-use glow; visual only">Power sensor</label>
        <span style="font-size:11px;color:${isFinite(i)&&i>5?`#66bb6a`:`var(--text-dim)`};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${e.powerEntity?`${e.powerEntity}${a?` · ${a}`:``}`:`— unbound —`}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickPowerEntity(e)}>
          ${e.powerEntity?`Rebind`:`Bind`} power…
        </button>
        ${e.powerEntity?I`
          <button class="btn" style="font-size:11px"
                  @click=${()=>t(()=>{e.powerEntity=null})}>Unbind</button>
        `:P}
      </div>
    `}_pickPowerEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,onPick:t=>{e.powerEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_tempBindRow(e,t){let n=this.planner,r=e.tempEntity&&n.hass?.states?n.hass.states[e.tempEntity]:null,i=r?parseFloat(r.state):NaN,a=String(r?.attributes?.unit_of_measurement??``),o=isFinite(i)?`${Math.round(i)}°${/F/i.test(a)?`F`:``}`:r?r.state:``;return I`
      <div class="row"><label title="sensor.* temperature — shown as an N° chip; display only">Temperature</label>
        <span style="font-size:11px;color:${isFinite(i)?`#ff8a65`:`var(--text-dim)`};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${e.tempEntity?`${e.tempEntity}${o?` · ${o}`:``}`:`— unbound —`}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickTempEntity(e)}>
          ${e.tempEntity?`Rebind`:`Bind`} temp…
        </button>
        ${e.tempEntity?I`
          <button class="btn" style="font-size:11px"
                  @click=${()=>t(()=>{e.tempEntity=null})}>Unbind</button>
        `:P}
      </div>
    `}_pickTempEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,onPick:t=>{e.tempEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_moistureBindRow(e,t){let n=this.planner,r=e.moistureEntity&&n.hass?.states?n.hass.states[e.moistureEntity]:null,i=r?parseFloat(r.state):NaN,a=e.moistureThreshold??20,o=isFinite(i)&&i<a;return I`
      <div class="row"><label title="sensor.* soil moisture (device_class 'moisture', or a mislabeled 'humidity' soil probe) — % below the threshold droops the plant. Display only. A sibling battery sensor auto-surfaces a 🔋 badge.">Moisture</label>
        <span style="font-size:11px;color:${isFinite(i)?o?`#ffca28`:`#7cb342`:`var(--text-dim)`};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${e.moistureEntity?`${e.moistureEntity}${isFinite(i)?` · ${Math.round(i)}%${o?` 💧`:``}`:``}`:`— unbound —`}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickMoistureEntity(e)}>
          ${e.moistureEntity?`Rebind`:`Bind`} moisture…
        </button>
        ${e.moistureEntity?I`
          <button class="btn" style="font-size:11px"
                  @click=${()=>t(()=>{e.moistureEntity=null})}>Unbind</button>
        `:P}
      </div>
      <div class="row"><label title="% below which the plant is 'thirsty' (droops). Default 20, matching HA's plant integration. Species vary widely.">Thirsty below</label>
        <input type="number" min="0" max="100" step="1" .value=${String(a)}
               style="width:64px;font-size:11px"
               @change=${n=>t(()=>{let t=parseFloat(n.target.value);e.moistureThreshold=isFinite(t)?Math.max(0,Math.min(100,t)):void 0})}><span style="font-size:11px;color:var(--text-dim)">%</span>
      </div>
      ${e.moistureEntity?P:I`
        <button class="btn" style="width:100%;font-size:11px;margin-top:4px"
                @click=${()=>t(()=>{e.plantDemoThirsty=!e.plantDemoThirsty})}>
          ${e.plantDemoThirsty?`💧 Thirsty (demo) — tap to reset`:`Test thirsty (demo)`}
        </button>
      `}
    `}_pickMoistureEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,onPick:t=>{e.moistureEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_jobStateRow(e,t){let n=this.planner,r=e.jobStateEntity&&n.hass?.states?n.hass.states[e.jobStateEntity]:null;return I`
      <div class="row"><label title="sensor/binary_sensor watched for a 'finished' transition (Home Connect operation_state, a running binary_sensor, or a program_finished event sensor). Unbound → auto-watch the appliance's own on/off entity.">Job sensor</label>
        <span style="font-size:11px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${e.jobStateEntity?`${e.jobStateEntity}${r?` · ${r.state}`:``}`:`— auto (on/off) —`}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${()=>this._pickJobStateEntity(e)}>
          ${e.jobStateEntity?`Rebind`:`Bind`} sensor…
        </button>
        ${e.jobStateEntity?I`
          <button class="btn" style="font-size:11px"
                  @click=${()=>t(()=>{e.jobStateEntity=null})}>Unbind</button>
        `:P}
      </div>
      ${e.jobStateEntity?I`
        <div class="row"><label title="State value that means 'done'. Home Connect: 'finished'; running binary_sensor: 'off'; program_finished event sensor: 'confirmed'.">Done value</label>
          <input type="text" placeholder="finished" .value=${e.jobDoneValue??``}
                 style="flex:1;font-size:11px"
                 @change=${n=>t(()=>{e.jobDoneValue=n.target.value.trim()||void 0})}>
        </div>
      `:P}
    `}_pickJobStateEntity(e){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`sensor`,`binary_sensor`],onPick:t=>{e.jobStateEntity=t,this.planner.save(),this.planner.emitConfig()}}}))}_bindRow(e,t,n,r,i,a,o){return I`
      <div class="row"><label title=${t}>${e}</label>
        <span style="font-size:11px;color:${n?i:`var(--text-dim)`};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${n?`${n}${r?` · ${r}`:``}`:`— unbound —`}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${a}>${n?`Rebind`:`Bind`}…</button>
        ${n?I`<button class="btn" style="font-size:11px" @click=${o}>Unbind</button>`:P}
      </div>`}_pickEntity(e,t){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:e,onPick:e=>{t(e),this.planner.save(),this.planner.emitConfig()}}}))}_evChargerRows(e,t){let n=this.planner,r=e.evCharger??{},i=r.statusEntity&&n.hass?.states?n.hass.states[r.statusEntity]:null,a=r.powerEntity&&n.hass?.states?n.hass.states[r.powerEntity]:null,o=a?parseFloat(a.state):NaN,s=n=>t(()=>{e.evCharger={...e.evCharger??{}},n(e.evCharger)});return I`
      ${this._bindRow(`Charger status`,`sensor/binary_sensor whose state maps to charging/full/error/idle`,r.statusEntity,i?.state??``,`#00e676`,()=>this._pickEntity([`sensor`,`binary_sensor`],e=>s(t=>t.statusEntity=e)),()=>s(e=>e.statusEntity=void 0))}
      ${this._bindRow(`Charge power`,`sensor.* (W) — feeds the charge indicator`,r.powerEntity,isFinite(o)?`${Math.round(o)} W`:a?.state??``,`#66bb6a`,()=>this._pickEntity(`sensor`,e=>s(t=>t.powerEntity=e)),()=>s(e=>e.powerEntity=void 0))}`}_mechanicalRows(e,t){let n=this.planner,r=mt(n.effectiveState(e),e.kind),i=r.running?r.glow===`heat`?`#ff6d4d`:r.glow===`cool`?`#4dd0ff`:r.glow===`fan`?`#e8edf0`:`#4aa8d8`:`var(--text-dim)`,a=r.running?r.glow===`heat`?`heating`:r.glow===`cool`?`cooling`:r.glow===`fan`?`running (fan / other mode)`:e.kind===`printer_3d`?`printing`:`pumping`:`idle`,o=e.printProgressEntity&&n.hass?.states?n.hass.states[e.printProgressEntity]:null;return I`
      <div class="row"><label title="Resolved from the bound entity (or the local on/off state when unbound) — this is what the 2D halo + 3D glow show">Status</label>
        <span style="font-size:11px;color:${i};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${a}${r.progress==null?``:` · ${Math.round(r.progress)}%`}
        </span>
      </div>
      ${e.kind===`printer_3d`?this._bindRow(`Print progress`,`OPTIONAL sensor.* whose numeric state is 0–100 % — only needed when the main binding is a plain switch. The print on the bed grows to match.`,e.printProgressEntity??void 0,o?.state??``,`#2ec5b6`,()=>this._pickEntity(`sensor`,n=>t(()=>{e.printProgressEntity=n})),()=>t(()=>{e.printProgressEntity=null})):P}
    `}_mailboxRows(e,t){let n=this.planner,r=e.mailCount??{},i=r.countEntity&&n.hass?.states?n.hass.states[r.countEntity]:null,a=r.flagEntity&&n.hass?.states?n.hass.states[r.flagEntity]:null,o=n=>t(()=>{e.mailCount={...e.mailCount??{}},n(e.mailCount)});return I`
      ${this._bindRow(`Mail count`,`numeric sensor.* (Mail-and-Packages) — > 0 floats a count badge`,r.countEntity,i?.state??``,`#ffb74d`,()=>this._pickEntity(`sensor`,e=>o(t=>t.countEntity=e)),()=>o(e=>e.countEntity=void 0))}
      ${this._bindRow(`Flag sensor`,`binary_sensor.* — 'on' raises the flag (unbound: click the box)`,r.flagEntity,a?.state===`on`?`UP`:a?.state??``,`#e53935`,()=>this._pickEntity(`binary_sensor`,e=>o(t=>t.flagEntity=e)),()=>o(e=>e.flagEntity=void 0))}`}_rackRows(e,t){let n=this.planner,r=e.rack??{},i=r.problemEntities??[],a=e=>n.hass?.states?.[e]?.state??``,o=Xe(i.map(e=>({id:e,state:a(e)}))),s=_(o),c=o===`problem`?`problem`:o===`update`?`update available`:o===`ok`?`ok`:`no readings`,l=n=>t(()=>{e.rack={...e.rack??{}},n(e.rack)}),u=r.cpuEntity?a(r.cpuEntity):``,d=r.tempEntity?a(r.tempEntity):``;return I`
      <div class="row"><label title="Aggregate of the problem entities below — this is the colour of the LED in 2D + 3D">Health</label>
        <span style="font-size:11px;color:${s};flex:1;font-weight:600">${c}</span>
      </div>
      <div class="row"><label>Shape</label>
        <select .value=${r.shape??`rack_unit`}
                @change=${e=>l(t=>{t.shape=e.target.value===`tower`?`tower`:void 0})}>
          <option value="rack_unit">Rack cabinet (19")</option>
          <option value="tower">NAS tower</option>
        </select>
      </div>
      <div style="font-size:10px;color:var(--text-dim);margin:4px 0 2px">
        Problem entities — any one in a bad state turns the LED red.
        An <code>update.*</code> entity turns it amber instead.
      </div>
      ${i.map((e,t)=>I`
        <div class="row">
          <span style="font-size:11px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                title=${e}>${e}</span>
          <span style="font-size:10px;color:var(--text-dim);min-width:52px;text-align:right">${a(e)||`—`}</span>
          <button class="btn" style="font-size:11px" title="Remove"
                  @click=${()=>l(e=>{e.problemEntities=i.filter((e,n)=>n!==t)})}>✕</button>
        </div>`)}
      <button class="btn" style="width:100%;font-size:11px;margin-top:2px"
              @click=${()=>this._pickEntity([`binary_sensor`,`sensor`,`update`],e=>l(t=>{let n=t.problemEntities??[];n.includes(e)||(t.problemEntities=[...n,e])}))}>+ Add problem entity…</button>
      ${this._bindRow(`CPU`,`OPTIONAL sensor.* — a cosmetic readout; it never colours the LED`,r.cpuEntity??void 0,u,`#4dd0ff`,()=>this._pickEntity(`sensor`,e=>l(t=>t.cpuEntity=e)),()=>l(e=>e.cpuEntity=null))}
      ${this._bindRow(`Temperature`,`OPTIONAL sensor.* — a cosmetic readout; it never colours the LED`,r.tempEntity??void 0,d,`#ff8a65`,()=>this._pickEntity(`sensor`,e=>l(t=>t.tempEntity=e)),()=>l(e=>e.tempEntity=null))}
    `}_pickFurnitureEntity(e){let t=e.kind===`space_heater`||e.kind===`wall_heater`||e.kind===`towel_warmer`,n=ce(e)===`tv`?`media_player`:Ze(e.kind)?[`media_player`,`switch`,`binary_sensor`]:Jt(e.kind)||Me(e.kind)?`binary_sensor`:C(e.kind)?[`switch`,`binary_sensor`]:rr(e.kind)?t?[`climate`,`switch`]:[`climate`,`fan`,`switch`]:Ke(e.kind)?ft(e.kind):`switch`;this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:n,onPick:t=>{e.entity_id=t,this.planner.save(),this.planner.emitConfig()}}}))}_customObjectsSection(){let e=this.planner.store.customObjects??[];return this._section(`custom`,`Custom Objects`,()=>I`
        ${e.length===0?I`
          <div style="color:var(--text-dim);font-size:11px;padding:2px 0 6px">
            Build reusable objects from primitive parts, then place them like any furniture kind.
          </div>`:P}
        ${e.map(e=>this._customObjectItem(e))}
        <button class="btn" style="width:100%;margin-top:6px" @click=${()=>this._addCustomObject()}>
          + New object
        </button>
    `)}_customObjectItem(e){let t=this._customExpanded.has(e.id);return I`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:pointer"
             @click=${()=>this._toggleCustomExpanded(e.id)}>
          <div class="nm">${e.label||`Custom object`}</div>
          <button class="icon-btn" title=${t?`Hide`:`Edit`}
                  @click=${t=>{t.stopPropagation(),this._toggleCustomExpanded(e.id)}}>${t?`▾`:`▸`}</button>
          <button class="icon-btn" title="Delete"
                  @click=${t=>{t.stopPropagation(),this._deleteCustomObject(e)}}>✕</button>
        </div>
        ${t?this._customObjectEditor(e):P}
      </div>
    `}_toggleCustomExpanded(e){this._customExpanded.has(e)?this._customExpanded.delete(e):this._customExpanded.add(e),this.requestUpdate()}_addCustomObject(){let e=this.planner;e.store.customObjects||(e.store.customObjects=[]);let t={id:vr(`obj`),label:`Custom object`,w:600,h:600,ht:800,color:9268835,cat:`furniture`,primitives:[{shape:`box`,size:[600,800,600],pos:[0,400,0]}]};e.store.customObjects.push(t),this._customExpanded.add(t.id);let n=e.floor(),r=e.viewCenter??{x:n.w/2,y:n.d/2};n.furniture.push({id:vr(`fu`),x:Math.round(r.x),y:Math.round(r.y),w:t.w,h:t.h,label:``,kind:`block`,customKindId:t.id}),e.save(),e.emitConfig()}_deleteCustomObject(e){if(!confirm(`Delete "${e.label||`Custom object`}"? Placed instances stay but fall back to plain blocks.`))return;let t=this.planner;t.store.customObjects=(t.store.customObjects??[]).filter(t=>t.id!==e.id),this._customExpanded.delete(e.id),t.save(),t.emitConfig()}_customObjectEditor(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${e.id} .value=${e.label}
                 @input=${t=>n(()=>{e.label=t.target.value})}>
        </div>
        <div class="row"><label>Width (mm)</label>
          <input type="number" min="50" .value=${String(Math.round(e.w))}
                 @input=${t=>n(()=>{e.w=Math.max(50,parseFloat(t.target.value)||0)})}>
        </div>
        <div class="row"><label>Depth (mm)</label>
          <input type="number" min="50" .value=${String(Math.round(e.h))}
                 @input=${t=>n(()=>{e.h=Math.max(50,parseFloat(t.target.value)||0)})}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="10" .value=${String(Math.round(e.ht))}
                 @input=${t=>n(()=>{e.ht=Math.max(10,parseFloat(t.target.value)||0)})}>
        </div>
        <div class="row"><label>Surface</label>
          <input type="checkbox" .checked=${!!e.surface}
                 @change=${t=>n(()=>{e.surface=t.target.checked||void 0})}>
          <label style="margin-left:12px">Mountable</label>
          <input type="checkbox" .checked=${!!e.mountable}
                 @change=${t=>n(()=>{e.mountable=t.target.checked||void 0})}>
        </div>
        <div class="row"><label>Activity</label>
          <select .value=${e.activity??`none`}
                  @change=${t=>n(()=>{let n=t.target.value;e.activity=n===`none`?void 0:n})}>
            ${[`none`,`shower`,`bathe`,`toilet`,`wash_hands`,`load_dishwasher`,`make_coffee`,`forage_fridge`,`watch_tv`,`eat_at_table`,`work_at_desk`,`exercise`,`sleep_shared`].map(t=>I`<option value=${t} ?selected=${(e.activity??`none`)===t}>${t}</option>`)}
          </select>
        </div>
        <div class="row"><label>Seat (mm)</label>
          <input type="number" min="0" placeholder="none"
                 title="Seat-top height; set it to make the object sittable"
                 .value=${e.seat==null?``:String(Math.round(e.seat))}
                 @input=${t=>n(()=>{let n=parseFloat(t.target.value);e.seat=isFinite(n)&&n>0?n:void 0})}>
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin:6px 0 2px">Parts</div>
        ${e.primitives.map((t,n)=>this._customPartRow(e,t,n))}
        <button class="btn" style="width:100%;margin-top:4px" @click=${()=>n(()=>{e.primitives.push({shape:`box`,size:[200,200,200],pos:[0,100,0]})})}>+ part</button>
      </div>
    `}_customPartRow(e,t,n){let r=this.planner,i=e=>{e(),r.save(),r.emitConfig()},a=(e,t)=>I`
      <input type="number" style="width:46px;font-size:10px" .value=${String(Math.round(e))}
             @input=${e=>i(()=>t(parseFloat(e.target.value)||0))}>`,o=(e,n)=>{t.rot||(t.rot=[0,0,0]),t.rot[e]=n};return I`
      <div style="border-top:1px solid var(--border);padding:4px 0">
        <div class="row" style="gap:4px">
          <select style="flex:1" .value=${t.shape}
                  @change=${e=>i(()=>{t.shape=e.target.value})}>
            <option value="box" ?selected=${t.shape===`box`}>Box</option>
            <option value="cylinder" ?selected=${t.shape===`cylinder`}>Cylinder</option>
            <option value="sphere" ?selected=${t.shape===`sphere`}>Sphere</option>
            <option value="cone" ?selected=${t.shape===`cone`}>Cone</option>
          </select>
          <input type="color" .value=${t.color??`#8a8a8a`}
                 @input=${e=>i(()=>{t.color=e.target.value})}>
          <button class="icon-btn" title="Duplicate" @click=${()=>i(()=>{e.primitives.splice(n+1,0,{shape:t.shape,size:[...t.size],pos:[...t.pos],rot:t.rot?[...t.rot]:void 0,color:t.color})})}>⧉</button>
          <button class="icon-btn" title="Delete" @click=${()=>i(()=>{e.primitives.splice(n,1)})}>✕</button>
        </div>
        <div class="row" style="gap:3px;font-size:10px;color:var(--text-dim)"><span style="min-width:30px">size</span>
          ${a(t.size[0],e=>t.size[0]=e)}${a(t.size[1],e=>t.size[1]=e)}${a(t.size[2],e=>t.size[2]=e)}
        </div>
        <div class="row" style="gap:3px;font-size:10px;color:var(--text-dim)"><span style="min-width:30px">pos</span>
          ${a(t.pos[0],e=>t.pos[0]=e)}${a(t.pos[1],e=>t.pos[1]=e)}${a(t.pos[2],e=>t.pos[2]=e)}
        </div>
        <div class="row" style="gap:3px;font-size:10px;color:var(--text-dim)"><span style="min-width:30px">rot°</span>
          ${a(t.rot?.[0]??0,e=>o(0,e))}${a(t.rot?.[1]??0,e=>o(1,e))}${a(t.rot?.[2]??0,e=>o(2,e))}
        </div>
      </div>
    `}_fixturesSection(){let e=this.planner.floor();if(e.lights.length===0&&e.switches.length===0)return P;let t=[...e.lights.map(e=>({x:e.x,y:e.y,k:`light`,ref:e})),...e.switches.map(e=>({x:e.x,y:e.y,k:`switch`,ref:e}))];return this._section(`fixtures`,`Lights & Switches`,()=>this._groupedList(`fixtures`,t,t=>this._fixtureItem(t.k,t.ref,t.k===`light`?e.lights.indexOf(t.ref):e.switches.indexOf(t.ref))))}_fixtureItem(e,t,n){let r=this.planner,i=r.hass?.states,a=t.entity_id&&i?i[t.entity_id]:null,o=a?.state===`on`,s=a&&(a.state===`unavailable`||a.state===`unknown`),c=!!t.entity_id,l=c?String(a?.attributes?.friendly_name||t.entity_id):t.label||(e===`light`?`Light`:`Switch`),u=e===`light`?Ur.find(e=>e.id===He(t))?.glyph??`💡`:`⏻`,d=c?s?`n/a`:o?`ON`:`OFF`:`—`,f=c&&!s&&o?`bound`:``,p=this._fxExpanded.has(t.id);return I`
      <div data-item-row=${t.id} style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default">
          <span style="font-size:14px;line-height:1">${u}</span>
          <div class="nm" title=${t.entity_id||``}>${l}</div>
          ${c?I`
            <button class="badge ${f}" style="cursor:pointer;border:none;font-family:inherit"
                    ?disabled=${s||!r.hass}
                    title=${o?`Click to turn off`:`Click to turn on`}
                    @click=${()=>r.toggleEntity(t.entity_id)}>
              ${d}
            </button>
          `:this._localBadge(t)}
          <button class="icon-btn" title=${c?`Rebind`:`Bind`}
                  @click=${()=>this._pickFixtureEntity(e,t)}>🔗</button>
          ${c&&r.isLightEntity(t.entity_id)?I`
            <button class="icon-btn" title="Configure (color, brightness, temp)"
                    @click=${()=>this.dispatchEvent(new CustomEvent(`open-light-config`,{bubbles:!0,composed:!0,detail:{entityId:t.entity_id}}))}>⚙</button>
          `:P}
          <button class="icon-btn" title=${p?`Hide`:`Visual properties`}
                  @click=${()=>this._toggleExpanded(t.id)}>${p?`▾`:`▸`}</button>
          <button class="icon-btn" title="Delete"
                  @click=${()=>this._deleteFixture(e,n)}>✕</button>
        </div>
        ${p?this._fixtureEditor(e,t):P}
      </div>
    `}_lightLogicBlock(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()},r=e.logic,i=r?t.effectiveState(e):null;return I`
      <div style="border-top:1px solid var(--border);margin:8px 0 4px;padding-top:6px">
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text-dim)">
          <span style="flex:1">Logic binding — derive ON/color/flash from an entity's state</span>
          ${r?I`<button class="btn" style="font-size:10px;padding:1px 5px"
                  @click=${()=>n(()=>{e.logic=void 0})}>Clear</button>`:P}
        </div>
        ${r?I`
          <div class="row"><label>Source</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.entityId}</span>
            <button class="btn" style="font-size:10px" @click=${()=>this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:null,onPick:e=>n(()=>{r.entityId=e})}}))}>Rebind</button>
          </div>
          <div style="font-size:10px;color:var(--text-dim);margin:4px 0 2px">State → color rules (first match = ON in that color; ⚡ = flash)</div>
          ${this._ruleRows(r.rules,e=>{r.rules=e})}
          <div class="row"><label>Off color</label>
            <input type="color" .value=${r.offColor??`#222222`}
                   @change=${e=>n(()=>{r.offColor=e.target.value})}>
            ${r.offColor?I`<button class="btn" style="font-size:10px;margin-left:4px"
                    @click=${()=>n(()=>{r.offColor=void 0})}>none</button>`:P}
          </div>
          <div style="font-size:10px;color:var(--text-dim);margin-top:2px">
            Now: <b style="color:${i?.state===`on`?`#8f8`:`#888`}">${i?.state??`off`}</b>
            ${i?.attributes&&i.attributes._flash?`⚡`:``}
          </div>
        `:I`
          <button class="btn" style="width:100%;font-size:11px;margin-top:4px" @click=${()=>this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:null,onPick:t=>n(()=>{e.logic={entityId:t,rules:[{op:`eq`,value:`on`,color:`#ffd54f`}]}})}}))}>+ Add logic (pick source entity)</button>
        `}
      </div>
    `}_toggleExpanded(e){this._fxExpanded.has(e)?this._fxExpanded.delete(e):this._fxExpanded.add(e),this.requestUpdate()}_fixtureEditor(e,t){let n=this.planner,r=e=>{e(),n.save(),n.emitConfig()},i=(e,t,n,r,i,a)=>I`
      <div class="row">
        <label>${e}</label>
        <input type="number" min=${n} max=${r} step=${i} .value=${String(t)}
               @input=${e=>{let t=parseFloat(e.target.value);isFinite(t)&&a(Math.max(n,Math.min(r,t)))}}>
      </div>
    `,a=(e,t,n)=>I`
      <div class="row">
        <label>${e}</label>
        <input type="text" .value=${t} @input=${e=>n(e.target.value)}>
      </div>
    `;if(e===`light`){let e=t,n=He(e);return I`
        <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
          ${a(`Label`,e.label||``,t=>r(()=>{e.label=t}))}
          ${this._lockRow(e)}
          <div style="font-size:10px;color:var(--text-dim);margin:6px 0 3px">Type</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px">
            ${Ur.map(t=>I`
              <button title=${t.label}
                      @click=${()=>r(()=>{e.iconKind=t.id})}
                      style="font-size:14px;padding:3px 6px;border-radius:3px;cursor:pointer;line-height:1.2;
                             background:${n===t.id?`var(--accent)`:`#222`};
                             border:1px solid ${n===t.id?`var(--accent)`:`var(--border)`};
                             color:var(--text)">
                ${t.glyph}
              </button>
            `)}
          </div>
          ${[`fan`,`fan_light`,`exhaust`,`exhaust_wall`,`exhaust_light`].includes(n)?I`
            <div class="row"><label>Fan entity</label>
              <span style="font-size:10px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${e.fanEntity||`(uses light entity)`}
              </span>
              <button class="btn" style="font-size:10px;padding:2px 6px" title="Bind the fan.* entity that drives blade speed"
                      @click=${()=>{this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`fan`,onPick:t=>r(()=>{e.fanEntity=t})}}))}}>🔗</button>
              ${e.fanEntity?I`
                <button class="btn" style="font-size:10px;padding:2px 6px" title="Unbind"
                        @click=${()=>r(()=>{e.fanEntity=null})}>✕</button>`:P}
            </div>
          `:P}
          ${[`strip`,`string`,`under_cabinet`].includes(n)?I`
            <div class="row"><label>Length (mm)</label>
              <input type="number" min="300" max="15000" step="100"
                     .value=${String(Math.round(e.length??2e3))}
                     @input=${t=>r(()=>{let n=parseFloat(t.target.value);e.length=isFinite(n)?Math.max(300,Math.min(15e3,n)):2e3})}>
            </div>
          `:P}
          ${[`fireplace`,`strip`,`sconce`,`string`,`under_cabinet`,`wall_sconce`,`step`,`flood`,`exhaust_wall`,`ground_spot`].includes(n)?I`
            <div class="row"><label>Rotation (°)</label>
              <input type="number" step="15" .value=${String(Math.round(e.rotation??0))}
                     @input=${t=>r(()=>{let n=parseFloat(t.target.value)||0;e.rotation=(Math.round(n)%360+360)%360})}>
              <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                      title="Rotate −15°"
                      @click=${()=>r(()=>{e.rotation=(((e.rotation??0)-15)%360+360)%360})}>↺</button>
              <button class="btn" style="font-size:10px;padding:2px 6px"
                      title="Rotate +15°"
                      @click=${()=>r(()=>{e.rotation=(((e.rotation??0)+15)%360+360)%360})}>↻</button>
            </div>
          `:P}
          ${n===`ground_spot`?I`
            <div class="row"><label>Tilt (° above horizon)</label>
              <input type="number" min="5" max="85" step="5" .value=${String(Math.round(e.tilt??35))}
                     @input=${t=>r(()=>{let n=parseFloat(t.target.value);e.tilt=isFinite(n)?Math.max(5,Math.min(85,n)):35})}>
            </div>
          `:P}
          ${``}
          ${``}
          ${i(`Height (mm)`,e.height??(n===`under_cabinet`?1350:n===`wall_sconce`?1700:n===`step`?300:n===`flood`?2400:n===`exhaust_wall`?2e3:me({iconKind:n})),-3e3,6e3,50,t=>r(()=>{e.height=t}))}
          ${i(`Radius (mm)`,e.radius??900,100,5e3,50,t=>r(()=>{e.radius=t}))}
          ${i(`Intensity`,e.intensity??1,0,2,.05,t=>r(()=>{e.intensity=t}))}
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
            Type sets the 3D body shape (and forces fireplace warm + flicker).
            Height = ceiling distance. Radius = pool of light on floor.
          </div>
          ${this._lightLogicBlock(e)}
        </div>
      `}else{let e=t;return I`
        <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
          ${a(`Label`,e.label||``,t=>r(()=>{e.label=t}))}
          ${this._lockRow(e)}
          ${i(`Height (mm)`,e.height??1200,0,3e3,10,t=>r(()=>{e.height=t}))}
          ${i(`Size (mm)`,e.size??320,100,1500,10,t=>r(()=>{e.size=t}))}
          <div class="row"><label>Label pos.</label>
            <select .value=${e.labelPos??`bottom`}
                    @change=${t=>r(()=>{e.labelPos=t.target.value})}>
              <option value="bottom">Below</option>
              <option value="top">Above</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="hide">Hidden</option>
            </select>
          </div>
          <div class="row"><label>Rotation (°)</label>
            <input type="number" step="15" .value=${String(Math.round(e.rotation??0))}
                   @input=${t=>r(()=>{let n=parseFloat(t.target.value)||0;e.rotation=(Math.round(n)%360+360)%360})}>
            <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                    title="Rotate −15°"
                    @click=${()=>r(()=>{e.rotation=(((e.rotation??0)-15)%360+360)%360})}>↺</button>
            <button class="btn" style="font-size:10px;padding:2px 6px"
                    title="Rotate +15°"
                    @click=${()=>r(()=>{e.rotation=(((e.rotation??0)+15)%360+360)%360})}>↻</button>
          </div>
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
            Rotation turns the face direction (0° = up on the 2D plan) — the
            marker's tick and the 3D body follow it. Align it to a wall.
          </div>
        </div>
      `}}_pickFixtureEntity(e,t){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:e,onPick:e=>{t.entity_id=e,this.planner.save(),this.planner.emitConfig()}}}))}_deleteFixture(e,t){let n=this.planner.floor();e===`light`?n.lights.splice(t,1):n.switches.splice(t,1),this.planner.save(),this.planner.emitConfig()}_activeSensorSection(){let e=this.planner,t=e.activeSensor();if(!t)return P;let n=e.hass?e.disc.listDevices(e.hass.states):[],r=e.floor(),i=r.sensors.indexOf(t),a=(n,r=e=>e)=>i=>{t[n]=r(i.target.value),e.save(),e.emitConfig()};return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div style="font-size:11px;font-weight:600;color:var(--text-dim);margin-bottom:4px">
          Sensor — ${t.label||`Unnamed`}
        </div>
        <div class="row"><label>Label</label>
          <input type="text" data-label-for=${t.id} .value=${t.label} @input=${a(`label`)}></div>
        ${this._lockRow(t)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(t.x)} @input=${a(`x`,e=>parseFloat(e)||0)}></div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(t.y)} @input=${a(`y`,e=>parseFloat(e)||0)}></div>
        <div class="row"><label>Heading (°)</label>
          <input type="number" .value=${String(t.heading)}
                 @input=${n=>{let r=parseFloat(n.target.value)||0;t.heading=(Math.round(r)%360+360)%360,e.save(),e.emitConfig()}}></div>
        <div class="row"><label>FOV (°)</label>
          <input type="number" .value=${String(t.fov)}
                 @input=${n=>{let r=parseFloat(n.target.value)||0;t.fov=Math.max(5,Math.min(360,r)),e.save(),e.emitConfig()}}></div>
        <div class="row"><label>Range (mm)</label>
          <input type="number" .value=${String(t.range)}
                 @input=${n=>{let r=parseFloat(n.target.value)||0;t.range=Math.max(100,r),e.save(),e.emitConfig()}}></div>
        <div class="row"><label>Target color</label>
          <input type="color" .value=${Fn(t,i)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${n=>{t.color=n.target.value,e.save(),e.emitConfig()}}>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  title="Reset to palette default — tints this sensor's T1/T2/T3 dots"
                  @click=${()=>{t.color=void 0,e.save(),e.emitConfig()}}>↺</button>
        </div>
        <div class="row" title="Color of the spinning plumbob above avatars seen by this sensor — so you can tell which sensor detected them. Default = this sensor's color.">
          <label>Plumbob</label>
          <input type="color" .value=${t.plumbobColor||Fn(t,i)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${n=>{t.plumbobColor=n.target.value,e.save(),e.emitConfig()}}>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  title="Reset to default (this sensor's color)"
                  @click=${()=>{t.plumbobColor=void 0,e.save(),e.emitConfig()}}>✕</button>
        </div>
        <div class="row" title="Always render one simulated person wandering this sensor's room in 3D — no HA device binding or live radar target needed. A display/demo presence that uses this sensor's avatar pool. A bound sensor shows its real targets AND the demo figure.">
          <label>Demo avatar</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${()=>{t.demo=!t.demo,e.save(),e.emitConfig()}}>
            ${t.demo?`🎬 On (no device needed)`:`— Off`}
          </button>
        </div>
        <div class="row" title="Also mark where the radar ACTUALLY says each target is: a small hollow circle in 2D, a floating ball in 3D. The avatar walks a smoothed, wall-aware path and even the 2D dot is spring-eased, so both can sit metres from the live report — this marker is the un-smoothed truth and snaps at the sensor's push rate.">
          <label>Show real positions</label>
          <input type="checkbox" .checked=${t.showRealPositions===!0}
                 @change=${n=>{n.target.checked?t.showRealPositions=!0:delete t.showRealPositions,e.save(),e.emitConfig()}}>
        </div>
        <div class="row" title="mmWave can report THROUGH a wall (multipath / range overshoot), so someone standing against it shows up in the next room and the avatar walks there. This clamps both the avatar and the 2D dot into the room this sensor stands in. Pair it with 'Show real positions' to still see the raw report where the radar actually put it.">
          <label>Keep avatars in this room</label>
          <input type="checkbox" .checked=${t.confineToRoom===!0}
                 @change=${n=>{n.target.checked?t.confineToRoom=!0:delete t.confineToRoom,e.save(),e.emitConfig()}}>
        </div>
        ${t.confineToRoom===!0&&se(Qe(r.walls??[]),t.x,t.y)===null?I`<div style="font-size:10px;color:var(--text-dim);margin:-2px 0 6px">
              (sensor is not inside a room — no closed wall loop contains it, so
              confinement does nothing here)</div>`:``}
        ${this._avatarGrid(t,t=>{t(),e.save(),e.emitConfig()})}
        <div class="row"><label>HA Device</label>
          <!-- Use .value (property) not ?selected (attribute) so a freshly-
               dropped sensor with deviceSlug=null reliably resets to the
               "— unbound —" option even when Lit reuses the prior <select>. -->
          <select .value=${t.deviceSlug||``}
                  @change=${n=>{e.bindSensor(t.id,n.target.value||null)}}>
            <option value="">— unbound —</option>
            ${n.map(e=>I`
              <option value=${e}>
                ${e.replace(/_/g,` `).replace(/\b\w/g,e=>e.toUpperCase())}
              </option>
            `)}
          </select>
        </div>
        <button class="btn danger" style="width:100%;margin-top:8px"
                @click=${()=>{let n=e.floor();n.sensors=n.sensors.filter(e=>e.id!==t.id),e.store.activeSensorId=null,e.save(),e.emitConfig()}}>Delete sensor</button>
      </div>
    `}_haSections(){let e=this.planner,t=e.activeSensor();if(!t||!t.deviceSlug)return P;let n=e.discBy[t.id];if(!n)return P;if(e.ensureLiveState(t.id),!(n.inclusionZoneSlugs.length>0||n.objectSlugs.length>0))return I`
        <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
          <div style="font-size:11px;font-weight:600;color:var(--text-dim);margin-bottom:4px">
            ${t.label||`Sensor`}
          </div>
          <div style="font-size:11px;color:var(--text-dim);padding:8px;text-align:center;
                      border:1px dashed var(--border);border-radius:4px">
            Loading entities from <code>${t.deviceSlug}</code>…<br>
            <span style="font-size:10px;opacity:0.7">
              ESPHome reports entities incrementally — zones &amp; objects
              will appear once the device finishes its initial publish.
            </span>
          </div>
        </div>
      `;let r=e.zonesBy[t.id],i=e.objectsBy[t.id];return I`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div style="font-size:11px;font-weight:600;color:var(--text-dim);margin-bottom:4px">
          ${t.label||`Sensor`} — HA data
        </div>
        <h3>Inclusion Zones</h3>
        ${n.inclusionZoneSlugs.length===0?I`<div style="font-size:11px;color:var(--text-dim);padding:4px 0">Loading…</div>`:r.inclusion.slice(0,n.inclusionZoneSlugs.length).map((e,n)=>this._zoneRow(t,`iz`,n,e,`#2196f3`))}
        <h3 style="margin-top:14px">Filter Zones</h3>
        ${n.filterZoneSlugs.length===0?I`<div style="font-size:11px;color:var(--text-dim);padding:4px 0">Loading…</div>`:r.filter.slice(0,n.filterZoneSlugs.length).map((e,n)=>this._zoneRow(t,`fz`,n,e,`#f44336`))}
        <h3 style="margin-top:14px">Object Halos</h3>
        ${n.objectSlugs.length===0?I`<div style="font-size:11px;color:var(--text-dim);padding:4px 0">Loading…</div>`:i.slice(0,n.objectSlugs.length).map((e,n)=>this._objectRow(t,n,e))}
        <h3 style="margin-top:14px">Targets</h3>
        <div style="display:flex;align-items:center;gap:6px;padding:2px 0 4px;font-size:11px;color:var(--text-dim)">
          <span style="flex:1">${e.useRawTargets?`Raw`:`Averaged`}</span>
          <label class="mini-toggle">
            <input type="checkbox" .checked=${!e.useRawTargets}
                   @change=${t=>{e.useRawTargets=!t.target.checked,e.store.useRawTargets=e.useRawTargets,e.save(),e.emitConfig()}}>
            <span></span>
          </label>
        </div>
        ${[0,1,2].map(e=>I`
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;padding:2px 0;border-bottom:1px solid var(--border)">
            <div style="width:8px;height:8px;border-radius:50%;background:${[`#4fc3f7`,`#81c784`,`#ffb74d`][e]}"></div>
            <span>T${e+1}</span>
          </div>
        `)}
        <h3 style="margin-top:14px" class="collapsible-header ${this._cfgOpen?`open`:``}"
            @click=${()=>{this._cfgOpen=!this._cfgOpen}}>
          Sensor Configuration <span class="collapse-arrow">▸</span>
        </h3>
        ${this._cfgOpen?this._sensorCfgBody(t,n):P}
      </div>
    `}_zoneRow(e,t,n,r,i){let a=this.planner,o=(t===`iz`?a.izExpanded:a.fzExpanded)[e.id],s=(t===`iz`?a.discBy[e.id]?.inclusionZoneSlugs:a.discBy[e.id]?.filterZoneSlugs)?.[n],c=s?`switch.${e.deviceSlug}_${s}_enable`:null,l=o.has(n);return I`
      <div style="border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:6px;padding:4px 0">
          <div class="zone-dot" style="background:${i};opacity:${r.enabled?1:.3}"></div>
          <span style="flex:1;font-size:12px">${r.name}</span>
          <label class="mini-toggle">
            <input type="checkbox" .checked=${r.enabled}
                   @change=${r=>a.setZoneEnabled(e,t,n,r.target.checked,c)}>
            <span></span>
          </label>
          <button class="icon-btn edit-btn" title=${l?`Hide anchors`:`Show anchors`}
                  style=${l?`color:${t===`iz`?`#90caf9`:`#ef9a9a`}`:``}
                  @click=${()=>{if(r.vertices.length<3){bt(a,e.id,t,n);return}o.has(n)?o.delete(n):o.add(n),a.emitConfig()}}>${l?`✕`:`✏`}</button>
        </div>
        ${l?this._zoneEditor(e,t,n,r.vertices):P}
      </div>
    `}_zoneEditor(e,t,n,r){let i=this.planner,a=r.length?[...r]:[{x:0,y:0}];for(;a.length<3;)a.push({x:0,y:0});let o=(r,o)=>s=>{let c=parseFloat(s.target.value)||0;a[r]={...a[r],[o]:c},i.saveZoneVertex(e,t,n,r,a[r].x,a[r].y)};return I`
      <div style="background:rgba(0,0,0,0.3);border-radius:4px;padding:6px;margin-bottom:4px">
        <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:3px;margin-bottom:4px;font-size:11px">
          <span style="color:var(--text-dim)">X mm</span>
          <span style="color:var(--text-dim)">Y mm</span>
          <span></span>
          ${a.map((r,s)=>I`
            <input type="number" .value=${String(Math.round(r.x))} @change=${o(s,`x`)}
                   style="width:100%;background:#111;border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px;padding:2px 4px">
            <input type="number" .value=${String(Math.round(r.y))} @change=${o(s,`y`)}
                   style="width:100%;background:#111;border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px;padding:2px 4px">
            <button class="icon-btn" title="Remove vertex"
                    @click=${()=>{a.splice(s,1),i.saveAllZoneVertices(e,t,n,a)}}>✕</button>
          `)}
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          ${a.length<8?I`
            <button class="btn" style="font-size:11px;padding:2px 6px"
                    @click=${()=>bt(i,e.id,t,n)}>+ Vertex</button>
          `:P}
          <button class="btn danger" style="font-size:11px;padding:2px 6px"
                  @click=${()=>{confirm(`Clear all vertices for this zone?`)&&i.saveAllZoneVertices(e,t,n,[])}}>⟳ Reset</button>
        </div>
      </div>
    `}_objectRow(e,t,n){let r=this.planner,i=r.discBy[e.id]?.objectSlugs?.[t],a=i?`switch.${e.deviceSlug}_${i}_halo_enable`:null,o=r.editObject[e.id]===t;return I`
      <div style="border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:6px;padding:4px 0">
          <span style="opacity:${n.enabled?1:.35}">${n.icon}</span>
          <span style="flex:1;font-size:12px">${n.name}</span>
          <label class="mini-toggle">
            <input type="checkbox" .checked=${n.enabled}
                   @change=${n=>r.setObjectEnabled(e,t,n.target.checked,a)}>
            <span></span>
          </label>
          <button class="icon-btn edit-btn" title="Edit object"
                  @click=${()=>{r.editObject[e.id]=r.editObject[e.id]===t?-1:t,r.emitConfig()}}>
            ✏
          </button>
        </div>
        ${o?this._objectEditor(e,t,n):P}
      </div>
    `}_objectEditor(e,t,n){let r=this.planner,i=(e,t)=>I`
      <input type="number" .value=${String(Math.round(e))}
             @change=${e=>t(parseFloat(e.target.value)||0)}
             style="width:100%;background:#111;border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px;padding:2px 4px">
    `;return I`
      <div style="background:rgba(0,0,0,0.3);border-radius:4px;padding:6px;margin-bottom:4px">
        <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 8px;font-size:11px;align-items:center">
          <span style="color:var(--text-dim)">X (mm)</span>
          ${i(n.x,n=>r.saveObjectField(e,t,`x`,n))}
          <span style="color:var(--text-dim)">Y (mm)</span>
          ${i(n.y,n=>r.saveObjectField(e,t,`y`,n))}
          <span style="color:var(--text-dim)">Radius</span>
          ${i(n.radius,n=>r.saveObjectField(e,t,`radius`,n))}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin:6px 0 3px">Icon</div>
        <div style="display:flex;flex-wrap:wrap;gap:3px">
          ${[`📍`,`💺`,`🖥`,`🚪`,`🛋`,`🪑`,`🛏`,`📺`,`🚿`,`📦`,`🪴`,`🗑`,`🖨`,`🛒`,`🚗`,`🐕`].map(e=>I`
            <button @click=${()=>{n.icon=e,r.save(),r.emitConfig()}}
                    style="font-size:15px;padding:2px 3px;border-radius:3px;cursor:pointer;line-height:1.2;
                           background:${n.icon===e?`var(--accent)`:`#222`};
                           border:1px solid ${n.icon===e?`var(--accent)`:`var(--border)`};
                           color:var(--text)">
              ${e}
            </button>
          `)}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:5px">
          Enable then drag the halo on the 2D view to reposition.
        </div>
      </div>
    `}_sensorCfgBody(e,t){let n=this.planner,r=n.hass?.states;if(!r)return P;let i=(e,t,i,a,o,s)=>{if(!t||!r[t])return P;let c=Math.round(parseFloat(r[t].state));return I`
        <div class="sensor-cfg-row">
          <label>${e}</label>
          <input type="number" min=${i} max=${a} step=${o} .value=${String(c)}
                 @change=${e=>n.hass?.callService(`number`,`set_value`,{entity_id:t,value:parseFloat(e.target.value)||0})}>
          ${s?I`<span style="color:var(--text-dim);font-size:10px;margin-left:2px">${s}</span>`:P}
        </div>
      `},a=(e,t)=>!t||!r[t]?P:I`
        <div class="sensor-cfg-row">
          <label>${e}</label>
          <label class="mini-toggle">
            <input type="checkbox" .checked=${r[t].state===`on`}
                   @change=${e=>n.hass?.callService(`switch`,e.target.checked?`turn_on`:`turn_off`,{entity_id:t})}>
            <span></span>
          </label>
        </div>
      `;return I`
      <div>
        ${i(`Height`,t.sensorHeight,0,5e3,1,`mm`)}
        ${i(`Tilt Angle`,t.mountAngle,-90,90,1,`°`)}
        ${a(`Ghostbuster`,t.ghostbuster)}
        ${a(`Multi-Target`,t.multiTarget)}
        ${a(`Upside Down`,t.upsideDown)}
      </div>
    `}_layers2dSection(){let e=this.planner,t=e.store.layers2d??{},n=e=>ge(t,e),r=t=>{e.store.layers2d=t,e.save(),e.emitConfig()},a=e.store.layerPresets2d??[],o=on();return this._section(`layers`,`Layers`,()=>I`
        <div class="row"><label>Preset</label>
          <select @change=${e=>{let t=e.target,n=t.value;if(t.value=``,n===`full`)r(void 0);else if(n===`simple`)r({...i});else{let e=a.find(e=>e.id===n);e&&r({...e.layers})}}}>
            <option value="">apply…</option>
            <option value="full">Full (everything)</option>
            <option value="simple">Simple floorplan</option>
            ${a.map(e=>I`<option value=${e.id}>${e.name}</option>`)}
          </select>
        </div>
        ${o.map(t=>I`
          <div class="layer-cat" style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;
                      color:var(--text-dim);opacity:0.6;margin:8px 0 2px 0">${t.cat.label}</div>
          ${t.defs.map(t=>I`
            <label class="row" style="padding:0">
              <span style="color:var(--text-dim);font-size:11px;flex:1">${t.label}</span>
              <span class="mini-toggle">
                <input type="checkbox" .checked=${n(t.key)}
                       @change=${n=>{let i={...e.store.layers2d??{}};i[t.key]=n.target.checked,r(i)}}>
                <span></span>
              </span>
            </label>`)}`)}
        <div style="border-top:1px solid var(--border);margin:6px 0"></div>
        <label class="row" style="padding:0"
               title="Show mmWave sensor coverage cones (2D + 3D)">
          <span style="color:var(--text-dim);font-size:11px;flex:1">mmWave coverage</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${e.store.coverage}
                   @change=${t=>{e.store.coverage=t.target.checked,e.save(),e.emitConfig()}}>
            <span></span>
          </span>
        </label>
        <label class="row" style="padding:0"
               title="Show motion sensor coverage zones">
          <span style="color:var(--text-dim);font-size:11px;flex:1">Motion zones</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${e.store.showMotionZones!==!1}
                   @change=${t=>{e.store.showMotionZones=t.target.checked,e.save(),e.emitConfig()}}>
            <span></span>
          </span>
        </label>
        <label class="row" style="padding:0"
               title="Show the per-target detail overlay">
          <span style="color:var(--text-dim);font-size:11px;flex:1">Target details</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${e.showDetails}
                   @change=${t=>{e.showDetails=t.target.checked,e.store.showDetails=e.showDetails,e.save(),e.emitConfig()}}>
            <span></span>
          </span>
        </label>
        <div style="display:flex;gap:4px;margin-top:6px">
          <button class="btn" style="flex:1;font-size:11px" @click=${()=>{let t=prompt(`Preset name:`,`Layers ${a.length+1}`);if(!t)return;e.store.layerPresets2d||(e.store.layerPresets2d=[]);let r={};for(let e of ln)r[e.key]=n(e.key);e.store.layerPresets2d.push({id:vr(`lp`),name:t,layers:r}),e.save(),e.emitConfig()}}>💾 Save preset…</button>
          ${a.length?I`
            <button class="btn" style="font-size:11px" title="Delete a saved preset" @click=${()=>{let t=prompt(`Delete which preset?\n${a.map(e=>e.name).join(`, `)}`,a[a.length-1].name);if(!t)return;let n=a.findIndex(e=>e.name===t);n>=0&&(a.splice(n,1),e.save(),e.emitConfig())}}>🗑</button>
          `:P}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          "Simple floorplan" hides fixtures but keeps activity glow: rooms with
          lights on or motion light up on the bare plan.
        </div>
    `)}_reconcileCalibLiveTimer(){let e=this.planner.geoCalib,t=!!e&&!this._collapsed.has(`geo`)&&this._calibLandmarkId===e.landmarkId;t&&!this._calibLiveTimer?this._calibLiveTimer=setInterval(()=>this.requestUpdate(),1e3):!t&&this._calibLiveTimer&&(clearInterval(this._calibLiveTimer),this._calibLiveTimer=null)}_geoSection(){let e=this.planner,t=e.geoLandmarks(),n=e.geoFit(),r=t.filter(e=>e.lat!=null&&e.lon!=null&&!e.pendingPlace&&!e.excluded).length,{resById:i,worstId:a}=this._fitResiduals(n),o=e.placingLandmarkId===Ae,s=e.store.geo;return this._section(`geo`,`GPS / Geo`,()=>I`
        ${o?I`
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
            <span style="flex:1">📍 Click on the plan to place the landmark…</span>
            <button class="btn" style="font-size:10px;padding:2px 6px"
                    @click=${()=>{e.placingLandmarkId=null,e.emitConfig()}}>Cancel</button>
          </div>`:P}
        ${t.length===0&&!o?I`
          <div style="color:var(--text-dim);font-size:11px;padding:4px 0">
            No landmarks yet. Add one, click a known spot on the plan, then calibrate
            it by standing there with your phone (open-sky, away from walls).
          </div>`:P}
        ${t.map(e=>this._landmarkItem(e,i.get(e.id)??null,a===e.id,n!=null&&n.transform.quality!==`none`))}
        <div style="display:flex;gap:4px;margin-top:6px">
          <button class="btn" style="flex:1"
                  @click=${()=>{e.placingLandmarkId=Ae,e.maybeCloseSidebarForPlacement(),e.emitConfig()}}>
            + Add landmark
          </button>
          <button class="btn" style="flex:1"
                  title="Bulk-import landmarks from a CSV of label, latitude, longitude"
                  @click=${this._importLandmarkCsv}>
            ⤓ Import CSV
          </button>
        </div>
        <div style="font-size:10px;color:var(--text-dim);padding:2px 0">
          CSV columns: label, latitude, longitude (header optional)
        </div>
        ${this._csvSummary()}

        ${n?this._geoFitReadout(n):P}
        ${this._recordedSection()}
        ${this._gpsPinsPreview()}

        ${r===1?I`
          <div class="row" style="margin-top:8px"
               title="Compass bearing (° clockwise from true north) that plan +Y points. 0 = plan +Y faces true north. Used only with a single calibrated landmark.">
            <label>North bearing°</label>
            <input type="number" step="1" .value=${String(s?.northDeg??0)}
                   @change=${t=>e.setGeo(e=>{let n=parseFloat(t.target.value);e.northDeg=isFinite(n)?(n%360+360)%360:0})}>
          </div>`:P}

        <div class="row" style="margin-top:8px"
             title="How far past the floor bounding box GPS pins may render (metres). Used in G2.">
          <label>Boundary (m)</label>
          <input type="number" min="0" step="5" .value=${String(s?.boundaryM??30)}
                 @change=${t=>e.setGeo(e=>{let n=parseFloat(t.target.value);e.boundaryM=isFinite(n)?Math.max(0,n):30})}>
        </div>
        <div class="row"
             title="Calibration drops GPS samples worse than this accuracy (metres).">
          <label>Accuracy gate (m)</label>
          <input type="number" min="1" step="5" .value=${String(s?.accuracyGateM??30)}
                 @change=${t=>e.setGeo(e=>{let n=parseFloat(t.target.value);e.accuracyGateM=isFinite(n)?Math.max(1,n):30})}>
        </div>
        <div class="row" style="margin-top:8px"
             title="Show geo_location.* event pins (earthquakes, fires…) projected onto the plan through the geo transform. Requires ≥1 calibrated landmark.">
          <label>Nearby events</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${()=>e.setGeo(e=>{e.showEvents=e.showEvents===!1})}>
            ${e.geoShowEvents()?`🌐 Showing (quakes, fires…)`:`— Hidden`}
          </button>
        </div>
    `)}_neighborhoodSection(){let e=this.planner,t=e.store.neighborhood,n=t?.enabled===!0,r=e.geoFit()?.transform.quality??`none`,i=e.neighborhoodData,a=t?.layers??{},o=this._moveStep,s=t=>e.setNeighborhood(t),c=(e,t)=>s(n=>{n.align={...n.align??{},dx:(n.align?.dx??0)+e,dy:(n.align?.dy??0)+t}}),l=e=>s(t=>{t.align={...t.align??{},rotDeg:(t.align?.rotDeg??0)+e}}),u=(e,t,n)=>I`
      <label class="row" style="padding:1px 0;font-size:11px" title=${e}>
        <input type="checkbox" .checked=${t} @change=${e=>s(t=>n(t,e.target.checked))}>
        <span style="margin-left:6px">${e}</span>
      </label>`,d=(e,n,r)=>I`
      <div class="row" style="padding:1px 0">
        <label style="flex:1;font-size:11px">${e}</label>
        <input type="color" .value=${t?.[n]??r}
               @input=${e=>s(t=>{t[n]=e.target.value})}>
        ${t?.[n]?I`<button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px" title="Use default"
                 @click=${()=>s(e=>{delete e[n]})}>↺</button>`:P}
      </div>`,f=n?r===`none`?I`<div style="color:#ffb74d;font-size:11px;padding:2px 0">Calibrate a GPS landmark above first — the overlay aligns to it.</div>`:i?I`<div style="color:var(--text-dim);font-size:11px;padding:2px 0">${i.tileCount} tile(s) · ${i.buildings.length} buildings · ${i.roads.length} roads${i.fetchedAt?` · fetched ${new Date(i.fetchedAt).toLocaleDateString()}`:``}</div>`:I`<div style="color:var(--text-dim);font-size:11px;padding:2px 0">Fetching map tiles…</div>`:I`<div style="color:var(--text-dim);font-size:11px;padding:2px 0">Off — enable to fetch map data for your address.</div>`;return this._section(`neighborhood`,`Neighborhood`,()=>I`
        <label class="row" style="padding:2px 0"
               title="Fetch OpenFreeMap building/road data around your calibrated address. Opt-in — calls a third-party service.">
          <input type="checkbox" .checked=${n} @change=${e=>s(t=>{t.enabled=e.target.checked})}>
          <span style="margin-left:6px;font-weight:600">Show neighborhood</span>
        </label>
        ${f}
        ${n&&r!==`none`?I`
          <div style="margin-top:6px">
            <div style="color:var(--text-dim);font-size:11px;margin-bottom:2px">Layers</div>
            ${u(`Buildings`,a.buildings!==!1,(e,t)=>{(e.layers??(e.layers={})).buildings=t})}
            ${u(`Roads`,a.roads!==!1,(e,t)=>{(e.layers??(e.layers={})).roads=t})}
            ${u(`Water`,a.water!==!1,(e,t)=>{(e.layers??(e.layers={})).water=t})}
            ${u(`Land use (ambient)`,a.landuse===!0,(e,t)=>{(e.layers??(e.layers={})).landuse=t})}
          </div>

          <div class="row" style="margin-top:8px">
            <label style="flex:1;font-size:11px" title="Multiplies every building height. Most OSM buildings carry no real height data — this is a look-right dial, not a survey.">Building height ×${(t?.verticalScale??1).toFixed(1)}</label>
          </div>
          <input type="range" min="0.2" max="3" step="0.1" style="width:100%"
                 .value=${String(t?.verticalScale??1)}
                 @input=${e=>s(t=>{t.verticalScale=Math.max(.2,Math.min(3,parseFloat(e.target.value)))})}>
          <div class="row" style="padding:1px 0">
            <label style="flex:1;font-size:11px" title="Fallback height per storey when OSM has no height/levels tag (metres).">Default level height (m)</label>
            <input type="number" min="2" max="5" step="0.5" style="width:64px" .value=${String(t?.defaultLevelHeightM??3)}
                   @change=${e=>s(t=>{let n=parseFloat(e.target.value);t.defaultLevelHeightM=isFinite(n)?Math.max(2,Math.min(5,n)):3})}>
          </div>
          <div style="color:var(--text-dim);font-size:10px;line-height:1.35;margin-top:2px">
            Most OSM buildings carry no height data — heights are estimates.
          </div>

          <div style="margin-top:8px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
              <span style="color:var(--text-dim);font-size:11px;flex:1">Align (nudge onto your plan)</span>
              <select style="background:#111;color:var(--text);border:1px solid var(--border);border-radius:4px;padding:2px 4px;font-size:11px"
                      .value=${String(o)} @change=${e=>this._setMoveStep(Number(e.target.value))}>
                <option value="100">100 mm</option>
                <option value="500">500 mm</option>
                <option value="1000">1 m</option>
              </select>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
              <button class="btn btn-sm" title="Nudge up (+Y)" @click=${()=>c(0,o)}>↑</button>
              <button class="btn btn-sm" title="Nudge down (−Y)" @click=${()=>c(0,-o)}>↓</button>
              <button class="btn btn-sm" title="Nudge left (−X)" @click=${()=>c(-o,0)}>←</button>
              <button class="btn btn-sm" title="Nudge right (+X)" @click=${()=>c(o,0)}>→</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:4px">
              <button class="btn btn-sm" title="Rotate 5° CCW" @click=${()=>l(-5)}>↺ 5°</button>
              <button class="btn btn-sm" title="Rotate 0.5° CCW" @click=${()=>l(-.5)}>↺ 0.5°</button>
              <button class="btn btn-sm" title="Rotate 0.5° CW" @click=${()=>l(.5)}>↻ 0.5°</button>
              <button class="btn btn-sm" title="Rotate 5° CW" @click=${()=>l(5)}>↻ 5°</button>
            </div>
            <button class="btn btn-sm" style="width:100%;margin-top:4px" title="Clear the alignment nudge"
                    @click=${()=>s(e=>{e.align={}})}>Reset alignment</button>
          </div>

          <div class="row" style="margin-top:8px">
            <label style="flex:1;font-size:11px">Opacity ${(t?.opacity??1).toFixed(1)}</label>
          </div>
          <input type="range" min="0.3" max="1" step="0.05" style="width:100%"
                 .value=${String(t?.opacity??1)}
                 @input=${e=>s(t=>{t.opacity=Math.max(.3,Math.min(1,parseFloat(e.target.value)))})}>
          <div style="margin-top:6px">
            <div style="color:var(--text-dim);font-size:11px;margin-bottom:2px">Colors</div>
            ${d(`Buildings`,`colorBuildings`,`#9aa2ab`)}
            ${d(`Roads`,`colorRoads`,`#4a4e55`)}
            ${d(`Water`,`colorWater`,`#3d7bb8`)}
          </div>

          <div style="margin-top:8px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
              <span style="color:var(--text-dim);font-size:11px;flex:1">Exclusions (${(t?.exclusions??[]).length})</span>
            </div>
            ${(t?.exclusions??[]).map((t,n)=>I`
              <div class="row" style="padding:1px 0;font-size:11px">
                <span style="flex:1;color:var(--text-dim)">Mask ${n+1} · ${t.length} pts</span>
                <button class="btn" style="font-size:10px;padding:2px 6px" title="Delete this mask"
                        @click=${()=>e.deleteExclusion(n)}>✕</button>
              </div>`)}
            ${e.drawingExclusion?I`
              <div style="font-size:10px;color:var(--text-dim);padding:2px 0">Click 3+ points on the plan; double-click / Enter to finish, Esc to cancel.</div>`:P}
            <button class="btn btn-sm" style="width:100%;margin-top:4px"
                    @click=${()=>{e.armExclusionDraw(),e.maybeCloseSidebarForPlacement()}}>+ Add exclusion</button>
            <div style="color:var(--text-dim);font-size:10px;line-height:1.35;margin-top:2px">
              Map geometry intersecting a mask is hidden (e.g. over your own house/yard). No vertex editing — delete + redraw.
            </div>
          </div>

          <button class="btn btn-sm" style="width:100%;margin-top:8px" title="Clear cached tiles and re-fetch"
                  @click=${()=>{e.clearNeighborhoodCache()}}>Refresh tiles</button>
          ${i?.fetchedAt?I`<div style="color:var(--text-dim);font-size:10px;padding:2px 0">Cache: fetched ${new Date(i.fetchedAt).toLocaleString()}</div>`:P}
          <div style="color:var(--text-dim);font-size:10px;line-height:1.4;margin-top:6px">
            Data: OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors.
          </div>
        `:P}
    `)}_csvSummary(){let e=this._csvResult;if(!e)return P;let t=e.errors.slice(0,4),n=e.errors.length-t.length;return I`
      <div style="border:1px solid var(--border);border-radius:4px;padding:5px 6px;margin:4px 0;font-size:11px">
        <div style="display:flex;align-items:flex-start;gap:6px">
          <span style="flex:1">Imported: ${e.added} added, ${e.updated} updated</span>
          <button class="icon-btn" title="Dismiss"
                  @click=${()=>{this._csvResult=null,this.requestUpdate()}}>✕</button>
        </div>
        ${e.pending>0?I`
          <div style="color:#ffb74d;padding-top:2px">
            ${e.pending} need${e.pending===1?`s`:``} placing — click each row's 📍 button, then click the plan.
          </div>`:P}
        ${t.length?I`
          <div style="color:#ff8a80;padding-top:3px">
            ${t.map(e=>I`<div>${e}</div>`)}
            ${n>0?I`<div>+ ${n} more</div>`:P}
          </div>`:P}
      </div>`}_landmarkItem(e,t=null,n=!1,r=!1){let i=this.planner,a=e.lat!=null&&e.lon!=null,o=e.pendingPlace===!0,s=e.excluded===!0,c=a&&e.sampleCount==null,l=e.sampledAt?` · ${new Date(e.sampledAt).toLocaleDateString()}`:``,u=o?`not placed — imported from CSV`:a?c?`manual${l}`:`${e.accuracy==null?`calibrated`:O(e.accuracy,i.store.imperial)} · ${e.sampleCount} samples${l}`:`uncalibrated`,d=this._calibLandmarkId===e.id,f=this._manualLandmarkId===e.id,p=i.landmarkSuggestId===e.id;return I`
      <div data-item-row=${e.id} style="border-bottom:1px solid var(--border)${s?`;opacity:0.55`:``}">
        <div class="sensor-item" style="cursor:default;gap:4px">
          <div class="dot" style="background:${o?`#ffb74d`:a?`#4dd0e1`:`#90a4ae`}"></div>
          <input type="text" .value=${e.name} style="flex:1;min-width:0" placeholder="Landmark name…"
                 @input=${t=>i.updateLandmark(e.id,e=>{e.name=t.target.value})}>
          <button class="icon-btn" title=${e.hidden?`Show pin`:`Hide pin`}
                  @click=${()=>i.updateLandmark(e.id,e=>{e.hidden=!e.hidden})}>
            ${e.hidden?`🙈`:`👁`}</button>
          <button class="icon-btn" title="Re-place pin on the plan"
                  @click=${()=>{i.placingLandmarkId=e.id,i.maybeCloseSidebarForPlacement(),i.emitConfig()}}>📍</button>
          <button class="icon-btn" title="Delete"
                  @click=${()=>{this._calibLandmarkId===e.id&&(this._calibLandmarkId=null),i.deleteLandmark(e.id)}}>✕</button>
        </div>
        <div style="font-size:10px;color:${a&&!o?`var(--text-dim)`:`#ffb74d`};padding:0 0 3px 20px">
          ${u}
        </div>
        ${a?I`
          <div style="font-family:monospace;font-size:10px;color:var(--text-dim);padding:0 0 3px 20px">
            ${e.lat.toFixed(6)}, ${e.lon.toFixed(6)}
          </div>`:P}
        ${a&&!o?I`
          <div style="display:flex;align-items:center;gap:6px;font-size:10px;padding:0 0 3px 20px">
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;color:var(--text-dim)"
                   title="Uncheck to keep this landmark but leave it out of the lat/lon ↔ plan fit (north bearing, GPS pins, map overlays). Useful when one bad calibration is skewing everything.">
              <input type="checkbox" .checked=${!s} style="margin:0"
                     @change=${t=>i.updateLandmark(e.id,e=>{t.target.checked?delete e.excluded:e.excluded=!0})}>
              Use in alignment
            </label>
            ${s?I`<span style="color:#ffb74d">excluded from alignment</span>`:t==null?P:I`<span style="color:${n?`#ff8a80`:`var(--text-dim)`}"
                             title=${n?`Largest residual — the most likely culprit if the alignment looks rotated.`:`How far this landmark lands from where the fit predicts.`}
                        >${n?`⚠ `:``}off by ${j(t/1e3,i.store.imperial)}</span>`}
          </div>`:P}
        <div style="padding:0 0 4px 20px;display:flex;gap:4px;flex-wrap:wrap;align-items:center">
          <button class="btn" style="font-size:10px;padding:2px 8px"
                  @click=${()=>{if(d){this._calibLandmarkId=null;return}if(this._calibLandmarkId=e.id,this._calibMsg=``,!this._calibTrackerId){let e=(i.store.people??[]).map(e=>e.gpsTrackerId).find(Boolean);e&&(this._calibTrackerId=e,this._calibSlug=i.notifySlugFor(e))}this.requestUpdate()}}>
            ${d?`Close`:`Calibrate…`}
          </button>
          <button class="btn" style="font-size:10px;padding:2px 8px"
                  title="Type or paste lat/lon directly (skips GPS sampling)"
                  @click=${()=>{if(f){this._manualLandmarkId=null;return}this._manualLandmarkId=e.id,this._manualErr=``,this._manualLat=e.lat==null?``:e.lat.toFixed(6),this._manualLon=e.lon==null?``:e.lon.toFixed(6),this.requestUpdate()}}>
            ${f?`Close`:`✏️ Set coordinates…`}
          </button>
          ${a?I`
            <button class="btn" style="font-size:10px;padding:2px 8px"
                    title="Clear lat/lon — return to uncalibrated"
                    @click=${()=>{this._manualLandmarkId===e.id&&(this._manualLandmarkId=null),i.updateLandmark(e.id,e=>{delete e.lat,delete e.lon,delete e.accuracy,delete e.sampleCount,delete e.sampledAt})}}>✕ clear coords</button>`:P}
          ${a&&!o&&r?I`
            <button class="btn" style="font-size:10px;padding:2px 8px${p?`;outline:1px solid #4dd0e1`:``}"
                    title="Show a ghost pin on the plan where the current alignment says this landmark should sit, then optionally move it there."
                    @click=${()=>{i.landmarkSuggestId=p?null:e.id,i.emitConfig()}}>
              ${p?`🎯 Hide suggestion`:`🎯 Suggested position`}
            </button>`:P}
        </div>
        ${p?this._suggestCard(e):P}
        ${f?this._manualCoordCard(e):P}
        ${d?this._calibCard(e):P}
      </div>
    `}_suggestCard(e){let t=this.planner,n=t.landmarkSuggestion();if(!n||n.id!==e.id)return I`<div style="font-size:10px;color:#ffb74d;padding:0 0 6px 20px">
        Can't project this landmark — calibrate at least one other landmark first.
      </div>`;let r=e.excluded===!0;return I`
      <div style="margin:0 0 6px 20px;padding:6px 8px;border:1px solid #4dd0e1;border-radius:4px">
        <div style="font-size:11px">
          Alignment puts this landmark
          <b style="color:#81d4fa">${j(n.distMm/1e3,t.store.imperial)}</b>
          from its pin.
        </div>
        <div style="font-family:monospace;font-size:10px;color:var(--text-dim);padding:2px 0">
          now ${Math.round(n.curX)}, ${Math.round(n.curY)} → ${Math.round(n.x)}, ${Math.round(n.y)} mm
        </div>
        <div style="font-size:10px;color:var(--text-dim);padding:0 0 4px">
          ${r?`This landmark is excluded, so the position comes from the OTHER landmarks — moving the pin here, then switching it back on, re-aligns it with them.`:`The ghost pin on the plan shows the spot. Moving the pin here zeroes its residual and re-fits the alignment.`}
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="btn" style="font-size:10px;padding:2px 8px"
                  @click=${()=>{t.applyLandmarkSuggestion(e.id)}}>
            ✔ Apply — move pin here
          </button>
          <button class="btn" style="font-size:10px;padding:2px 8px"
                  @click=${()=>{t.landmarkSuggestId=null,t.emitConfig()}}>Cancel</button>
        </div>
      </div>`}_manualCoordCard(e){let t=this.planner,n=e=>{let t=ut(e);return t?(this._manualLat=t.lat.toFixed(6),this._manualLon=t.lon.toFixed(6),this._manualErr=``,this.requestUpdate(),!0):!1};return I`
      <div style="background:rgba(0,0,0,0.28);border-radius:4px;padding:6px;margin:2px 0 6px 20px">
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;line-height:1.35">
          Type or paste coordinates. Pasting a <code>lat, lon</code> pair into Latitude fills both.
        </div>
        <div class="row" style="margin-top:0"><label>Latitude</label>
          <input type="number" step="any" placeholder="e.g. 45.123456" .value=${this._manualLat}
                 @paste=${e=>{let t=e.clipboardData?.getData(`text`)??``;n(t)&&e.preventDefault()}}
                 @input=${e=>{let t=e.target.value;n(t)||(this._manualLat=t)}}>
        </div>
        <div class="row"><label>Longitude</label>
          <input type="number" step="any" placeholder="e.g. -93.123456" .value=${this._manualLon}
                 @input=${e=>{this._manualLon=e.target.value}}>
        </div>
        <button class="btn" style="width:100%;margin-top:6px;font-size:11px" @click=${()=>{let n=Number(this._manualLat.trim()),r=Number(this._manualLon.trim());if(!this._manualLat.trim()||!this._manualLon.trim()||!isFinite(n)||!isFinite(r)){this._manualErr=`Enter both latitude and longitude.`,this.requestUpdate();return}if(n<-90||n>90){this._manualErr=`Latitude must be between −90 and 90.`,this.requestUpdate();return}if(r<-180||r>180){this._manualErr=`Longitude must be between −180 and 180.`,this.requestUpdate();return}t.updateLandmark(e.id,e=>{e.lat=n,e.lon=r,e.sampledAt=new Date().toISOString(),delete e.accuracy,delete e.sampleCount}),this._manualErr=``,this._manualLandmarkId=null,this.requestUpdate()}}>Apply coordinates</button>
        ${this._manualErr?I`
          <div style="font-size:11px;margin-top:6px;padding:5px 7px;border-radius:4px;
                      background:rgba(120,0,0,0.35);color:#ff8a80;line-height:1.35">${this._manualErr}</div>`:P}
      </div>
    `}_calibCard(e){let t=this.planner,n=t.geoCalib,r=n?.landmarkId===e.id,i=I`<div style="font-size:10px;color:var(--text-dim);line-height:1.35;margin-top:4px">
      Keep the HA app open in the foreground — the panel is requesting fixes every
      25 s, but iOS may still take minutes to answer. Android is also forced to 5 s
      high-accuracy updates.
    </div>`,a=null;if(r&&n){let e=Date.now(),t=Math.max(0,Math.floor((e-new Date(n.startedAt).getTime())/1e3)),r=`${Math.floor(t/60)}:${String(t%60).padStart(2,`0`)}`,i=n.lastSeenAt?`last fix: ${Math.max(0,Math.round((e-new Date(n.lastSeenAt).getTime())/1e3))}s ago`:`no fixes yet…`,o=n.exclAccuracy+n.exclSource;a=I`
        <div style="font-size:11px;margin-bottom:4px;display:flex;align-items:center;gap:6px">
          <span class="diorama-calib-dot"></span>
          <span>Sampling <code>${n.trackerId}</code></span>
        </div>
        <div style="font-size:11px;margin-bottom:2px">
          <b>${r}</b> elapsed · ${i}
        </div>
        <div style="font-size:11px;margin-bottom:4px">
          <b>${n.used}</b> used · ${o} excluded
          <span style="color:var(--text-dim)">(${n.exclAccuracy} accuracy · ${n.exclSource} source)</span>
        </div>`}return I`
      <div style="background:rgba(0,0,0,0.28);border-radius:4px;padding:6px;margin:2px 0 6px 20px">
        ${r?I`
          ${a}
          <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px">
            Stand at the landmark ≥3–5 min, then Finish. The median is pulled from
            history, so you can walk back inside first (closing the panel is fine).
          </div>
          ${i}
          <div style="display:flex;gap:4px;margin-top:6px">
            <button class="btn" style="flex:1;font-size:11px" ?disabled=${this._calibBusy}
                    @click=${async()=>{this._calibBusy=!0,this.requestUpdate();let e=await t.finishGeoCalibration();this._calibBusy=!1,this._calibMsg=e.message,this.requestUpdate()}}>${this._calibBusy?`Finishing…`:`Finish`}</button>
            <button class="btn" style="font-size:11px" ?disabled=${this._calibBusy}
                    @click=${()=>{t.cancelGeoCalibration(),this._calibMsg=`Calibration cancelled.`}}>Cancel</button>
          </div>
        `:I`
          <div class="row" style="margin-top:0"><label>Tracker</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${this._calibTrackerId||`— pick a device_tracker —`}
            </span>
            <button class="btn" style="font-size:10px;padding:2px 6px" @click=${()=>{this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`device_tracker`,onPick:e=>{this._calibTrackerId=e,this._calibSlug=this.planner.notifySlugFor(e),this.requestUpdate()}}}))}}>🔗</button>
          </div>
          <div class="row"
               title="Companion-app notify service used for the Android high-accuracy command. Auto-derived from the tracker; override if your device's notify slug differs.">
            <label>Notify slug</label>
            <input type="text" placeholder="mobile_app_…" .value=${this._calibSlug}
                   @input=${e=>{this._calibSlug=e.target.value}}>
          </div>
          <button class="btn" style="width:100%;margin-top:6px;font-size:11px"
                  ?disabled=${!this._calibTrackerId}
                  @click=${()=>{t.startGeoCalibration(this._calibLandmarkId,this._calibTrackerId,this._calibSlug),this._calibMsg=``}}>▶ Start sampling</button>
          ${i}
        `}
        ${this._calibMsg?I`
          <div style="font-size:11px;margin-top:6px;padding:5px 7px;border-radius:4px;
                      background:rgba(0,0,0,0.3);line-height:1.35">${this._calibMsg}</div>`:P}
      </div>
    `}_gpsPinsPreview(){let e=this.planner.gpsPins;if(!e.length){let e=(this.planner.store.people??[]).filter(e=>{let t=this.planner.gpsFixFor(e);return t?.found&&t.lat!=null&&t.lon!=null}).length;return e?I`<div style="margin-top:8px;font-size:10px;color:var(--text-dim)">
        fixes exist but need a calibrated landmark: ${e} person${e===1?``:`s`} reporting</div>`:P}return I`
      <div style="margin-top:8px">
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:3px">GPS pins</div>
        ${e.map(e=>{let t=e.zone===`indoor`?`indoors ~${O(e.accuracyMm/1e3,this.planner.store.imperial)}`:`${j(e.distanceM,this.planner.store.imperial)} ${In(e.bearingDeg)}`;return I`
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;padding:2px 0">
              <span style="width:8px;height:8px;border-radius:50%;background:${e.color};flex:none"></span>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.name}</span>
              <span style="color:${e.stale?`var(--text-dim)`:`#4dd0e1`}">
                ${Hr(e.zone)} ${t}${e.stale?` · stale`:``}</span>
            </div>`})}
      </div>`}_recordedSection(){let e=this.planner,t=e.recordedPins(),n=e.projectedRecordedPins(),r=e.geoFit(),i=n.filter(e=>e.ok).length,a=!!r&&r.transform.quality!==`none`,s=_t(n,e.store.geo?.recordedClosed),c=e.recordTrackerId(),l=c?e.gpsFixFor({id:``,name:``,gpsTrackerId:c}):null,u=!!(l?.found&&l.lat!=null&&l.lon!=null),d=this._recordBusy||!c||!u,f=c?l?.found?u?`Fix ${l.accuracyM==null?``:O(l.accuracyM,e.store.imperial)} · ${Vr(l.lastUpdated)}`:`No GPS fix from ${c} yet`:`Tracker ${c} not found`:`Pick a device_tracker first`,p=e=>{let t=ut(e);return t?(this._recordLat=t.lat.toFixed(6),this._recordLon=t.lon.toFixed(6),this._recordErr=``,this.requestUpdate(),!0):!1};return I`
      <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:8px">
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:5px">Recorded positions (boundary)</div>
        ${a?P:I`
          <div style="font-size:10px;color:#ffb74d;line-height:1.35;margin-bottom:5px">
            Calibrate a landmark first — without a fit, recorded pins can't project onto the plan.
          </div>`}

        <div class="row" style="margin-top:0">
          <button class="btn" style="flex:1;font-size:11px" ?disabled=${d} title=${f}
                  @click=${async()=>{this._recordBusy=!0,this.requestUpdate();let t=await e.recordPositionPin();this._recordBusy=!1,this._recordMsg=t.ok?t.warn??`Point recorded.`:t.error??`Failed.`,this.requestUpdate()}}>${this._recordBusy?`Recording…`:`⏺ Record point`}</button>
          <button class="btn" style="font-size:10px;padding:2px 6px" title="Pick the device_tracker to record from"
                  @click=${()=>this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`device_tracker`,onPick:t=>{e.setRecordTracker(t),this.requestUpdate()}}}))}>🔗</button>
        </div>
        <div style="font-size:10px;color:var(--text-dim);padding:1px 0 4px 2px">${c?f:`No tracker selected`}</div>

        <div class="row" style="margin-top:2px"><label>Manual</label>
          <input type="number" step="any" placeholder="lat" style="min-width:0" .value=${this._recordLat}
                 @paste=${e=>{p(e.clipboardData?.getData(`text`)??``)&&e.preventDefault()}}
                 @input=${e=>{let t=e.target.value;p(t)||(this._recordLat=t)}}>
          <input type="number" step="any" placeholder="lon" style="min-width:0" .value=${this._recordLon}
                 @input=${e=>{this._recordLon=e.target.value}}>
          <button class="btn" style="font-size:10px;padding:2px 8px" @click=${()=>{let t=Number(this._recordLat.trim()),n=Number(this._recordLon.trim());if(!(isFinite(t)&&isFinite(n)&&e.addManualRecordedPin(t,n))){this._recordErr=`Enter a valid lat, lon (−90..90, −180..180).`,this.requestUpdate();return}this._recordLat=``,this._recordLon=``,this._recordErr=``,this.requestUpdate()}}>+</button>
        </div>
        ${this._recordErr?I`<div style="font-size:10px;color:#ff8a80;padding:1px 0 3px 2px">${this._recordErr}</div>`:P}

        ${t.map((e,t)=>this._recordedItem(e,t,n[t]))}

        ${t.length?I`
          <label class="row" style="margin-top:6px;cursor:pointer">
            <input type="checkbox" .checked=${e.store.geo?.recordedClosed===!0}
                   @change=${t=>e.setRecordedClosed(t.target.checked)}>
            <span style="font-size:11px">Close chain</span>
          </label>
          <div style="font-size:11px;color:var(--text-dim);margin:3px 0">
            Chain: ${i}/${t.length} projected${s>0?` · ${D(s,e.store.imperial)}`:``}
          </div>
          <div class="row" style="margin-top:4px">
            <select style="flex:1;font-size:11px" .value=${this._recordGroundKind}
                    @change=${e=>{this._recordGroundKind=e.target.value}}>
              ${Object.keys(o).map(e=>I`
                <option value=${e} ?selected=${e===this._recordGroundKind}>${e}</option>`)}
            </select>
            <button class="btn" style="font-size:10px;padding:2px 8px" ?disabled=${i<3}
                    title=${i<3?`Need ≥3 projected points`:`Create a ground-area polygon from the chain`}
                    @click=${()=>{if(!confirm(`Create a ground-area polygon from the recorded chain on the current floor?`))return;let t=e.recordedChainToGroundArea(this._recordGroundKind);this._recordMsg=t.ok?`Ground area created.`:t.error??`Failed.`,this.requestUpdate()}}>▸ Convert to ground area</button>
          </div>
          <button class="btn" style="width:100%;margin-top:4px;font-size:10px"
                  @click=${()=>{confirm(`Delete all recorded points?`)&&(e.clearRecordedPins(),this._recordMsg=``)}}>Clear all</button>
        `:P}
        ${this._recordMsg?I`
          <div style="font-size:11px;margin-top:6px;padding:5px 7px;border-radius:4px;background:rgba(0,0,0,0.3);line-height:1.35">${this._recordMsg}</div>`:P}
      </div>`}_recordedItem(e,t,n){let r=this.planner;return I`
      <div style="display:flex;align-items:center;gap:4px;padding:2px 0;border-bottom:1px solid var(--border)">
        <span style="width:16px;text-align:center;font-size:10px;font-weight:600;color:${n?.ok?`#ffab40`:`#90a4ae`}">${t+1}</span>
        <input type="text" .value=${e.name??``} placeholder="Point ${t+1}" style="flex:1;min-width:0;font-size:11px"
               @input=${t=>r.updateRecordedPin(e.id,e=>{e.name=t.target.value||void 0})}>
        <button class="icon-btn" title="Move earlier" ?disabled=${t===0}
                @click=${()=>r.moveRecordedPin(e.id,-1)}>↑</button>
        <button class="icon-btn" title="Move later" ?disabled=${t===r.recordedPins().length-1}
                @click=${()=>r.moveRecordedPin(e.id,1)}>↓</button>
        <button class="icon-btn" title="Delete" @click=${()=>r.deleteRecordedPin(e.id)}>✕</button>
      </div>
      <div style="font-family:monospace;font-size:10px;color:var(--text-dim);padding:0 0 3px 20px">
        ${e.lat.toFixed(6)}, ${e.lon.toFixed(6)}${e.accuracy==null?` · manual`:` · ${O(e.accuracy,r.store.imperial)}`}${n&&!n.ok?` · (no fit)`:``}
      </div>`}_fitResiduals(e){let t=new Map;if(!e||e.transform.quality!==`full`)return{resById:t,worstId:null};let n=e.transform.residualsMm,r=-1;return e.landmarks.forEach((e,i)=>{let a=n[i];typeof a!=`number`||!isFinite(a)||(t.set(e.id,a),(r<0||a>n[r])&&(r=i))}),{resById:t,worstId:r>=0?e.landmarks[r]?.id??null:null}}_geoFitReadout(e){let t=e.transform,n=Math.abs(t.fittedScale-1)>.15,{resById:r,worstId:i}=this._fitResiduals(e),a=i?e.landmarks.find(e=>e.id===i)??null:null,o=a?{name:a.name||`Landmark`,res:r.get(a.id)??0}:null;return I`
      <div style="font-size:11px;margin-top:8px;padding:6px 8px;background:rgba(0,0,0,0.25);border-radius:4px;line-height:1.5">
        <div><b>Fit:</b> ${t.quality===`single`?`1 landmark + north bearing`:`${e.landmarks.length} landmarks (Procrustes, scale locked at 1)`}</div>
        ${t.quality===`full`?I`
          <div>RMS residual: ${j(t.rmsMm/1e3,this.planner.store.imperial)}</div>
          <div>Fitted scale: ${t.fittedScale.toFixed(3)}
            ${n?I`<span style="color:#ff8a80"> ⚠ far from 1.0 — a landmark may be bad</span>`:P}
          </div>
          ${o?I`<div style="color:var(--text-dim)">Worst: ${o.name} (${O(o.res/1e3,this.planner.store.imperial)})</div>`:P}
        `:I`<div style="color:var(--text-dim)">Add a second calibrated landmark to solve rotation from data.</div>`}
      </div>
    `}_floorLookOverrides(e){let t=this.planner,n=t.floor(),r=n.look3d??{},i=e=>{n.look3d||(n.look3d={}),e(),n.look3d&&!Object.keys(n.look3d).length&&(n.look3d=null),t.save(),t.emitConfig()},a=(e,t)=>e?I`<button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                     title="Use global value" @click=${()=>i(t)}>↺</button>`:P;return I`
      <div class="row"><label>Floor color</label>
        <input type="color" .value=${r.floorColor??e.floorColor??`#101820`}
               style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
               @input=${e=>i(()=>{n.look3d.floorColor=e.target.value})}>
        ${a(r.floorColor!==void 0,()=>{delete n.look3d.floorColor})}
      </div>
      <div class="row"><label>Floor texture</label>
        <select .value=${r.floorTex??`inherit`}
                @change=${e=>i(()=>{let t=e.target.value;t===`inherit`?delete n.look3d.floorTex:n.look3d.floorTex=t})}>
          <option value="inherit">(global)</option>
          <option value="none">None</option>
          <option value="wood">Wood</option>
          <option value="tile">Tile</option>
          <option value="concrete">Concrete</option>
        </select>
      </div>
      <div class="row"><label>Wall color</label>
        <input type="color" .value=${r.wallColor??e.wallColor??`#bbbbbb`}
               style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
               @input=${e=>i(()=>{n.look3d.wallColor=e.target.value})}>
        ${a(r.wallColor!==void 0,()=>{delete n.look3d.wallColor})}
      </div>
      <div class="row" title="Auto-paint this ground kind over the whole floor rect minus the walled house footprint — fixes the 'void yard' first impression. None = off.">
        <label>Yard fill</label>
        <select style="flex:1"
                @change=${e=>{let r=e.target.value;r?n.yardFill=r:delete n.yardFill,t.save(),t.emitConfig()}}>
          <option value="" ?selected=${!n.yardFill}>None</option>
          ${Object.keys(o).map(e=>I`
            <option value=${e} ?selected=${n.yardFill===e}>${o[e].label}</option>`)}
        </select>
      </div>
    `}_model3dSection(){let e=this.planner,t=e.floor().model3d,n=t=>{t(),e.save(),e.emitConfig()};return this._section(`model3d`,`3D Model (Sweet Home 3D)`,()=>I`
        <button class="btn" style="width:100%;margin-bottom:4px" @click=${this._importSh3dStructural}>
          Import .sh3d (structural)…
        </button>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin-bottom:6px">
          Reads a native <code>.sh3d</code> and builds real floors / walls /
          rooms / doors as a NEW configuration. The button below instead imports
          a visual OBJ mesh onto THIS floor (decorative shell, no editable walls).
        </div>
        <button class="btn" style="width:100%;margin-bottom:4px" @click=${this._importObj}>
          Import OBJ (+ MTL)…
        </button>
        ${t?I`
          <div class="row"><label>File</label>
            <span style="font-size:11px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${t.name}
            </span>
          </div>
          <label class="row" style="padding:0">
            <span style="color:var(--text-dim);font-size:11px;flex:1">Visible</span>
            <span class="mini-toggle">
              <input type="checkbox" .checked=${t.visible}
                     @change=${e=>n(()=>{t.visible=e.target.checked})}>
              <span></span>
            </span>
          </label>
          <div class="row"><label>Scale (mm/unit)</label>
            <input type="number" min="0.1" step="0.1" .value=${String(t.scale)}
                   @input=${e=>n(()=>{t.scale=Math.max(.1,parseFloat(e.target.value)||10)})}>
          </div>
          <div class="row"><label>X offset (mm)</label>
            <input type="number" .value=${String(Math.round(t.x))}
                   @input=${e=>n(()=>{t.x=parseFloat(e.target.value)||0})}>
          </div>
          <div class="row"><label>Y offset (mm)</label>
            <input type="number" .value=${String(Math.round(t.y))}
                   @input=${e=>n(()=>{t.y=parseFloat(e.target.value)||0})}>
          </div>
          <div class="row"><label>Rotation (°)</label>
            <input type="number" step="15" .value=${String(Math.round(t.rotation))}
                   @input=${e=>n(()=>{let n=parseFloat(e.target.value)||0;t.rotation=(Math.round(n/15)*15%360+360)%360})}>
          </div>
          <div class="row"><label>Opacity</label>
            <input type="range" min="0.05" max="1" step="0.05" .value=${String(t.opacity)}
                   style="width:90px"
                   @input=${e=>n(()=>{t.opacity=parseFloat(e.target.value)||1})}>
          </div>
          <button class="btn danger" style="width:100%;margin-top:4px" @click=${this._removeObj}>
            Remove model
          </button>
        `:I`
          <div style="font-size:10px;color:var(--text-dim);line-height:1.4">
            Export from Sweet Home 3D via 3D view → Export to OBJ format.
            Select the .obj (and .mtl for colors). Sweet Home 3D uses cm, so
            the default scale of 10 mm/unit lines up 1:1.
          </div>
        `}
        ${t?I`
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
            Model geometry is stored in this browser (IndexedDB) — re-import
            on other devices. Placement settings sync via HA.
          </div>
        `:P}
    `)}_bgSection(){let e=this.planner,t=e.floor().bg,n=e.store.layers2d?.bg===!1;return this._section(`bg`,`Background image`,()=>I`
        <button class="btn" style="width:100%;margin-bottom:4px" @click=${this._uploadBg}>
          Upload image…
        </button>
        ${t&&n?I`
          <div style="font-size:10px;color:#ffb74d;margin-bottom:4px;line-height:1.3">
            The Background layer is off (2D Layers) — this image won't show until
            it's turned on.
          </div>`:P}
        ${t?this._bgControls(t):P}
    `,{style:`margin-top:auto`})}_bgControls(e){let t=this.planner,n=e=>{e(),t.save(),t.emitConfig()};return I`
      <label class="row" style="padding:0">
        <span style="color:var(--text-dim);font-size:11px;flex:1">Visible</span>
        <span class="mini-toggle">
          <input type="checkbox" .checked=${e.visible!==!1}
                 @change=${t=>n(()=>{e.visible=t.target.checked})}>
          <span></span>
        </span>
      </label>
      <label class="row" style="padding:0">
        <span style="color:var(--text-dim);font-size:11px;flex:1">Locked</span>
        <span class="mini-toggle">
          <input type="checkbox" .checked=${!!e.locked}
                 @change=${t=>n(()=>{e.locked=t.target.checked})}>
          <span></span>
        </span>
      </label>
      <div class="row"><label>Opacity</label>
        <input type="range" min="0.05" max="1" step="0.05" .value=${String(e.opacity??1)}
               style="width:90px"
               @input=${n=>{e.opacity=parseFloat(n.target.value)||1,t.emitConfig()}}
               @change=${()=>t.save()}>
      </div>
      <div class="row"><label>Rotation°</label>
        <input type="number" min="-360" max="360" step="1" .value=${String(e.rotation||0)}
               @input=${n=>{e.rotation=parseFloat(n.target.value)||0,t.emitConfig()}}
               @change=${()=>t.save()}>
      </div>
      <button class="btn danger" style="width:100%;margin-top:4px" @click=${this._clearBg}>
        Clear image
      </button>
      <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
        Drag to move. Drag corners to scale (Shift = preserve aspect).
      </div>
    `}_applyBg(e){let t=/^data:image\/svg\+xml/i.test(e),n=new Image;n.onload=()=>{var r;let i=this.planner,a=i.floor(),o=n.naturalWidth,s=n.naturalHeight,c=!o||!s,l=e;if(!t&&!c&&e.length>25e5){let e=Math.min(1,2e3/Math.max(o,s)),t=Math.max(1,Math.round(o*e)),r=Math.max(1,Math.round(s*e)),i=document.createElement(`canvas`);i.width=t,i.height=r;let a=i.getContext(`2d`);if(a){a.drawImage(n,0,0,t,r);try{l=i.toDataURL(`image/jpeg`,.85),o=t,s=r}catch{}}}let u=a.w/a.d,d,f;if(c)d=a.w,f=a.d;else{let e=o/s;e>u?(d=a.w,f=a.w/e):(f=a.d,d=a.d*e)}a.bg={dataUrl:l,x:a.w/2,y:a.d/2,w:d,h:f,rotation:0,opacity:1,visible:!0,locked:!1};let p=(r=i.store).layers2d??(r.layers2d={});p.bg===!1&&(p.bg=!0),i.save(),i.emitConfig(),this.requestUpdate()},n.onerror=()=>alert(`This image couldn't be decoded. Some camera formats (HEIC / AVIF from iPhone, or TIFF) aren't supported by the browser — convert it to PNG, JPG, SVG, or WebP and try again.`),n.src=e}},Br=zr,zr.DOOR_KIND_LABELS={swing:`Swing door`,garage:`Garage door`,gate:`Gate`,sliding:`Sliding door`,pocket:`Pocket door`,double:`Double swing door`,french:`French doors`,sliding_glass:`Sliding glass door`},zr);k([R({attribute:!1})],H.prototype,`planner`,void 0),k([F()],H.prototype,`_`,void 0),k([F()],H.prototype,`_cfgOpen`,void 0),k([F()],H.prototype,`_moveStep`,void 0),k([F()],H.prototype,`_collapsed`,void 0),k([F()],H.prototype,`_doorExpanded`,void 0),k([F()],H.prototype,`_areaMatchNote`,void 0),k([F()],H.prototype,`_windowExpanded`,void 0),k([F()],H.prototype,`_furnExpanded`,void 0),k([F()],H.prototype,`_stairsFitMsg`,void 0),k([F()],H.prototype,`_customExpanded`,void 0),k([F()],H.prototype,`_fxExpanded`,void 0),k([F()],H.prototype,`_calibLandmarkId`,void 0),k([F()],H.prototype,`_manualLandmarkId`,void 0),k([F()],H.prototype,`_manualLat`,void 0),k([F()],H.prototype,`_manualLon`,void 0),k([F()],H.prototype,`_manualErr`,void 0),k([F()],H.prototype,`_calibTrackerId`,void 0),k([F()],H.prototype,`_calibSlug`,void 0),k([F()],H.prototype,`_calibMsg`,void 0),k([F()],H.prototype,`_calibBusy`,void 0),k([F()],H.prototype,`_recordMsg`,void 0),k([F()],H.prototype,`_recordBusy`,void 0),k([F()],H.prototype,`_recordLat`,void 0),k([F()],H.prototype,`_recordLon`,void 0),k([F()],H.prototype,`_recordErr`,void 0),k([F()],H.prototype,`_recordGroundKind`,void 0),k([F()],H.prototype,`_csvResult`,void 0),H=Br=k([L(`diorama-sidebar`)],H);function U(e,t){e.setTool(t),e.maybeCloseSidebarForPlacement()}function Xr(e,t){e.pendingFurnitureKind=t,e.pendingCustomObjectId=null,e.pendingVehicleModelId=null,U(e,`furniture`)}function Zr(e,t){e.pendingCustomObjectId=t,e.pendingVehicleModelId=null,U(e,`furniture`)}function Qr(e,t){e.pendingVehicleModelId=t,e.pendingCustomObjectId=null,U(e,`furniture`)}function $r(e,t){e.pendingLightKind=t,U(e,`light`)}function ei(e,t){e.pendingWallKind=t,U(e,`wall`)}function ti(e,t){e.pendingDoorKind=t,U(e,`door`)}function ni(e,t){e.pendingWindowKind=t,U(e,`window`)}function ri(e,t){e.pendingGroundKind=t,U(e,`ground`)}function ii(e,t){U(e,`pool`),e.drawingPoolArea={points:[],kind:t},e.emitConfig()}function ai(e){e.placingRoomId=x,e.maybeCloseSidebarForPlacement(),e.emitConfig()}function oi(e){e.placingLandmarkId=Ae,e.maybeCloseSidebarForPlacement(),e.emitConfig()}var si=[{id:`bulb`,label:`Bulb`,glyph:`💡`},{id:`spot`,label:`Spot`,glyph:`🔦`},{id:`pendant`,label:`Pendant`,glyph:`⚪`},{id:`sconce`,label:`Sconce`,glyph:`◐`},{id:`strip`,label:`Strip`,glyph:`▬`},{id:`fireplace`,label:`Fireplace`,glyph:`🔥`},{id:`lamp`,label:`Lamp`,glyph:`🪔`},{id:`bowl`,label:`Bowl`,glyph:`🥣`},{id:`tiered`,label:`Tiered`,glyph:`☰`},{id:`round`,label:`Round`,glyph:`⭕`},{id:`recessed`,label:`Recessed`,glyph:`⊙`},{id:`jar`,label:`Jar`,glyph:`🫙`},{id:`oval`,label:`Oval`,glyph:`🥚`},{id:`fan`,label:`Ceiling fan`,glyph:`❋`},{id:`fan_light`,label:`Fan + light`,glyph:`✺`},{id:`string`,label:`LED string`,glyph:`✨`},{id:`under_cabinet`,label:`Under-cabinet`,glyph:`▂`},{id:`wall_sconce`,label:`Wall sconce`,glyph:`◨`},{id:`step`,label:`Step light`,glyph:`▤`},{id:`flood`,label:`Floodlight`,glyph:`🔆`},{id:`inground`,label:`In-ground uplight`,glyph:`⤒`},{id:`ground_spot`,label:`Ground spot`,glyph:`⟰`},{id:`heatlamp`,label:`Heat lamp`,glyph:`♨`},{id:`exhaust`,label:`Exhaust (ceiling)`,glyph:`❊`},{id:`exhaust_wall`,label:`Exhaust (wall)`,glyph:`⊛`},{id:`exhaust_light`,label:`Exhaust + light`,glyph:`❈`},{id:`firepit_round`,label:`Fire pit (round)`,glyph:`◉`},{id:`firepit_square`,label:`Fire pit (square)`,glyph:`▣`},{id:`vanity_bar`,label:`Vanity bar (3 globes)`,glyph:`💄`},{id:`vanity_hollywood`,label:`Vanity strip (5 globes)`,glyph:`🎬`},{id:`mirror_light`,label:`Backlit mirror`,glyph:`🪞`}],ci=[{id:`full`,label:`Full`},{id:`half`,label:`Half`},{id:`railing`,label:`Railing`},{id:`invisible`,label:`Invisible`},{id:`fence_picket`,label:`Picket`},{id:`fence_privacy`,label:`Privacy`},{id:`fence_chainlink`,label:`Chain-link`},{id:`hedge`,label:`Hedge`}],li=[{id:`swing`,label:`Swing`},{id:`garage`,label:`Garage`},{id:`gate`,label:`Gate`},{id:`sliding`,label:`Sliding`},{id:`pocket`,label:`Pocket`},{id:`double`,label:`Double swing`},{id:`french`,label:`French`},{id:`sliding_glass`,label:`Sliding glass`}],ui=[{id:`single`,label:`Single`},{id:`double_hung`,label:`Double-hung`},{id:`casement_pair`,label:`Casement`},{id:`sliding`,label:`Sliding`},{id:`picture`,label:`Picture`},{id:`bay`,label:`Bay`},{id:`bay_bench`,label:`Bay + seat`}],di=[{tool:`sensor`,label:`mmWave`,glyph:`📡`},{tool:`motion`,label:`Motion`,glyph:`🚶`},{tool:`env`,label:`Env`,glyph:`🌡`},{tool:`infocard`,label:`Info card`,glyph:`🔢`},{tool:`action`,label:`Action`,glyph:`🔘`},{tool:`bleproxy`,label:`BLE proxy`,glyph:`📶`},{tool:`alarm`,label:`Alarm`,glyph:`🚨`},{tool:`calendar`,label:`Calendar`,glyph:`📅`},{tool:`thermostat`,label:`Thermostat`,glyph:`🌡`},{tool:`safety`,label:`Safety/Siren`,glyph:`⚠️`},{tool:`alertbeacon`,label:`Alert beacon`,glyph:`🔔`},{tool:`robot`,label:`Robot`,glyph:`🤖`},{tool:`camera`,label:`Camera`,glyph:`📷`},{tool:`valve`,label:`Valve`,glyph:`🚰`},{tool:`sprinkler`,label:`Sprinkler`,glyph:`🚿`},{tool:`plug`,label:`Plug`,glyph:`🔌`},{tool:`switch`,label:`Switch`,glyph:`🎛`},{tool:`solar`,label:`Solar panel`,glyph:`☀️`}],W={furniture:`🛋`,seating:`🪑`,tables:`🍽️`,bedroom:`🛏`,storage:`🗄`,stairs:`🪜`,decor:`🖼`,plants:`🪴`,appliance:`🔌`,bathroom:`🛁`,outdoor:`🌳`,theater:`🎬`,vehicle:`🚗`};function fi(e){let t=JSON.stringify(e),n=5381;for(let e=0;e<t.length;e++)n=(n<<5)+n+t.charCodeAt(e)|0;return(n>>>0).toString(36)}function G(e){return Object.keys(y).filter(t=>T(y[t])===e).map(t=>({key:`furn:${t}`,label:y[t].label,glyph:W[e],thumb:{type:`furniture`,kind:t},tool:`furniture`,arm:e=>Xr(e,t),isArmed:e=>e.tool===`furniture`&&e.pendingCustomObjectId==null&&e.pendingVehicleModelId==null&&e.pendingFurnitureKind===t}))}function pi(){return si.map(e=>({key:`light:${e.id}`,label:e.label,glyph:e.glyph,thumb:{type:`light`,kind:e.id},tool:`light`,arm:t=>$r(t,e.id),isArmed:t=>t.tool===`light`&&(t.pendingLightKind??`bulb`)===e.id}))}function mi(e){return{key:`tool:${e.tool}`,label:e.label,glyph:e.glyph,thumb:{type:`glyph`,glyph:e.glyph},tool:e.tool,arm:t=>U(t,e.tool),isArmed:t=>t.tool===e.tool}}function hi(){return[{key:`struct:wall`,label:`Wall`,glyph:`🧱`,thumb:{type:`glyph`,glyph:`🧱`},tool:`wall`,arm:e=>ei(e,e.pendingWallKind??`full`),isArmed:e=>e.tool===`wall`,variants:ci.map(e=>({key:`wall:${e.id}`,label:e.label,arm:t=>ei(t,e.id),isArmed:t=>(t.pendingWallKind??`full`)===e.id}))},{key:`struct:door`,label:`Door`,glyph:`🚪`,thumb:{type:`glyph`,glyph:`🚪`},tool:`door`,arm:e=>ti(e,e.pendingDoorKind??`swing`),isArmed:e=>e.tool===`door`,variants:li.map(e=>({key:`door:${e.id}`,label:e.label,arm:t=>ti(t,e.id),isArmed:t=>(t.pendingDoorKind??`swing`)===e.id}))},{key:`struct:window`,label:`Window`,glyph:`🪟`,thumb:{type:`glyph`,glyph:`🪟`},tool:`window`,arm:e=>ni(e,e.pendingWindowKind??`single`),isArmed:e=>e.tool===`window`,variants:ui.map(e=>({key:`window:${e.id}`,label:e.label,arm:t=>ni(t,e.id),isArmed:t=>(t.pendingWindowKind??`single`)===e.id}))},{key:`struct:room`,label:`Room`,glyph:`🏷`,thumb:{type:`glyph`,glyph:`🏷`},arm:e=>ai(e),isArmed:e=>e.placingRoomId===x},K(`struct:pzone`,`Presence zone`,`▱`,`pzone`),K(`struct:void`,`Floor void`,`🕳`,`void`),K(`struct:ruler`,`Ruler`,`📏`,`ruler`),...G(`stairs`)]}function K(e,t,n,r){return{key:e,label:t,glyph:n,thumb:{type:`glyph`,glyph:n},tool:r,arm:e=>U(e,r),isArmed:e=>e.tool===r}}function gi(){return[{key:`ground:area`,label:`Ground area`,glyph:`▨`,thumb:{type:`glyph`,glyph:`▨`},tool:`ground`,arm:e=>ri(e,e.pendingGroundKind??`grass`),isArmed:e=>e.tool===`ground`,variants:Object.keys(o).map(e=>({key:`ground:${e}`,label:o[e].label,arm:t=>ri(t,e),isArmed:t=>(t.pendingGroundKind??`grass`)===e}))},K(`ground:path`,`Path / drive`,`〰`,`path`),{key:`ground:pool`,label:`Pool / spa`,glyph:`🏊`,thumb:{type:`glyph`,glyph:`🏊`},tool:`pool`,arm:e=>ii(e,`pool`),isArmed:e=>e.tool===`pool`,variants:[{key:`pool:pool`,label:`Pool`,arm:e=>ii(e,`pool`),isArmed:e=>e.drawingPoolArea?.kind!==`spa`},{key:`pool:spa`,label:`Spa`,arm:e=>ii(e,`spa`),isArmed:e=>e.drawingPoolArea?.kind===`spa`}]},{key:`ground:landmark`,label:`GPS landmark`,glyph:`📍`,thumb:{type:`glyph`,glyph:`📍`},arm:e=>oi(e),isArmed:e=>e.placingLandmarkId===Ae}]}function _i(e){return(e.store.customObjects??[]).map(e=>({key:`custom:${e.id}`,label:e.label,glyph:`🧩`,thumb:{type:`custom`,id:e.id,hash:fi(e)},tool:`furniture`,arm:t=>Zr(t,e.id),isArmed:t=>t.tool===`furniture`&&t.pendingVehicleModelId==null&&t.pendingCustomObjectId===e.id}))}function vi(){let e=[];for(let{def:t,models:n}of g())for(let r of n)r.surfaces.includes(`ground`)&&e.push({key:`veh:${r.id}`,label:r.label,glyph:`🚙`,thumb:{type:`vehicle`,id:r.id,ver:String(t.version)},tool:`furniture`,arm:e=>Qr(e,r.id),isArmed:e=>e.tool===`furniture`&&e.pendingVehicleModelId===r.id});return e}function yi(e){return[{id:`seating`,label:`Seating`,glyph:W.seating,cards:G(`seating`)},{id:`tables`,label:`Tables`,glyph:W.tables,cards:G(`tables`)},{id:`bedroom`,label:`Bedroom`,glyph:W.bedroom,cards:G(`bedroom`)},{id:`storage`,label:`Storage`,glyph:W.storage,cards:G(`storage`)},{id:`decor`,label:`Decor`,glyph:W.decor,cards:G(`decor`)},{id:`appliance`,label:`Appliances`,glyph:`🔌`,cards:G(`appliance`)},{id:`bathroom`,label:`Bathroom`,glyph:`🛁`,cards:G(`bathroom`)},{id:`theater`,label:`Theater`,glyph:`🎬`,cards:[...G(`theater`),K(`tool:projector`,`Projector`,`📽`,`projector`)]},{id:`plants`,label:`Plants`,glyph:W.plants,cards:G(`plants`)},{id:`outdoor`,label:`Outdoor`,glyph:`🌳`,cards:[...G(`outdoor`),K(`tool:flagpole`,`Flagpole`,`🚩`,`flagpole`)]},{id:`vehicle`,label:`Vehicles`,glyph:`🚗`,cards:[...G(`vehicle`),...vi()]},{id:`lights`,label:`Lights`,glyph:`💡`,cards:pi()},{id:`controls`,label:`Controls & Sensors`,glyph:`🎛`,cards:di.map(mi)},{id:`structure`,label:`Structure`,glyph:`🧱`,cards:hi()},{id:`ground`,label:`Ground`,glyph:`▨`,cards:gi()},{id:`custom`,label:`Custom`,glyph:`🧩`,cards:_i(e)}]}var bi=(()=>{try{return`0.66.1`}catch{return`dev`}})(),xi=`diorama:thumbs:v1`;function Si(){return`${xi}:${bi}`}function Ci(e){switch(e.type){case`furniture`:return`f:${e.kind}`;case`light`:return`l:${e.kind}`;case`custom`:return`c:${e.id}:${e.hash}`;case`vehicle`:return`veh:${e.id}:${e.ver}`;case`glyph`:return`g:${e.glyph}`}}function wi(){try{let e=localStorage.getItem(Si());if(!e)return{};let t=JSON.parse(e);return t&&typeof t==`object`?t:{}}catch{return{}}}function Ti(e){try{localStorage.setItem(Si(),JSON.stringify(e))}catch{}}function Ei(e,t=128,n){try{let r=document.createElement(`canvas`);r.width=r.height=t;let i=r.getContext(`2d`);return i?(i.fillStyle=n?.dim?`#141c26`:`#1b2734`,Di(i,2,2,t-4,t-4,10),i.fill(),i.globalAlpha=n?.dim?.45:1,i.font=`${Math.round(t*.5)}px "Noto Color Emoji", "Segoe UI Emoji", "Apple Color Emoji", sans-serif`,i.textAlign=`center`,i.textBaseline=`middle`,i.fillStyle=`#e0e0e0`,i.fillText(e||`▦`,t/2,t*.5),i.globalAlpha=1,r.toDataURL(`image/png`)):``}catch{return``}}function Di(e,t,n,r,i,a){e.beginPath(),e.moveTo(t+a,n),e.arcTo(t+r,n,t+r,n+i,a),e.arcTo(t+r,n+i,t,n+i,a),e.arcTo(t,n+i,t,n,a),e.arcTo(t,n,t+r,n,a),e.closePath()}var Oi=128,ki={preset:`day`,floorColor:`#8a7860`,floorTex:`none`,wallColor:`#cfd2d6`,wallCutaway:!1};function Ai(e=6e3,t=6e3){return{id:`thumb`,name:`T`,w:e,d:t,walls:[],furniture:[],lights:[],switches:[],sensors:[],motionSensors:[],envSensors:[],doors:[],windows:[],rooms:[],groundAreas:[],presenceZones:[]}}var ji=()=>null,Mi=class{constructor(){this._mem=new Map,this._persist=wi(),this._R=null,this._host=null,this._webglOk=!0,this._initPromise=null,this._queue=[],this._draining=!1}get(e,t,n,r){let i=Ci(e),a=this._mem.get(i)??this._persist[i];if(a)return a;if(e.type===`glyph`){let t=Ei(e.glyph,Oi);return this._mem.set(i,t),t}return this._webglOk&&!this._mem.has(i)&&(this._mem.set(i,``),this._queue.push({desc:e,ctx:r,onReady:n}),this._drain()),Ei(t,Oi,{dim:!0})}async _ensure(){return this._R?!0:this._webglOk?(this._initPromise||(this._initPromise=(async()=>{try{let e=await gr(()=>import(`./three-renderer.js?v=mswkx4ak`),[],import.meta.url),t=document.createElement(`div`);t.style.cssText=`position:fixed;left:-99999px;top:0;width:128px;height:128px;pointer-events:none;opacity:0`,document.body.appendChild(t);let n=new e.ThreeDRenderer(t,{preserveDrawingBuffer:!0});await n.load();let r=n;if(!r.loaded||!r._renderer)throw Error(`renderer failed to load`);return r._controls&&(r._controls.enableDamping=!1),this._R=r,this._host=t,!0}catch(e){return console.warn(`thumbnail renderer unavailable, using glyphs:`,e),this._webglOk=!1,this._R=null,!1}})()),this._initPromise):!1}_drain(){if(this._draining)return;this._draining=!0;let e=async()=>{if(!await this._ensure()){for(let e of this._queue.splice(0)){let t=this._fallback(e.desc);this._mem.set(Ci(e.desc),t),e.onReady()}this._draining=!1;return}let t=this._queue.splice(0,2);for(let e of t){let t=Ci(e.desc),n=``;try{n=this._capture(e.desc,e.ctx)}catch{n=``}n||(n=this._fallback(e.desc)),this._mem.set(t,n),this._persist[t]=n,e.onReady()}this._queue.length?Ni(e):(Ti(this._persist),this._draining=!1)};Ni(e)}_fallback(e){return Ei(e.type===`furniture`?y[e.kind]?.label?`🪑`:`▦`:e.type===`light`?`💡`:e.type===`custom`?`🧩`:e.type===`vehicle`?`🚙`:`▦`,Oi)}_capture(e,t){if(this._R,e.type===`furniture`)return this._captureFurniture(e.kind);if(e.type===`light`)return this._captureLight(e.kind);if(e.type===`custom`){let n=(t?.customObjects??[]).find(t=>t.id===e.id);return n?this._captureCustom(n):``}if(e.type===`vehicle`){let t=ee(e.id);return t?this._captureCustom(t):``}return``}_captureFurniture(e){let t=y[e];if(!t)return``;let n=Ai();n.furniture=[{id:`it`,x:n.w/2,y:n.d/2,w:t.w,h:t.h,kind:e,rotation:0}],this._R.updateFloor(n,ki,void 0,void 0,ji);let r=[0,Math.min(t.ht*.5,850),0],i=Math.max(t.w,t.h)*1.5+t.ht*.9+1400;return this._orbit(r,i,22,Math.PI-.6),this._readback()}_captureCustom(e){let t=Ai(),n=e.w??800,r=e.h??800,i=e.ht??800;t.furniture=[{id:`it`,x:t.w/2,y:t.d/2,w:n,h:r,kind:`block`,customKindId:e.id,rotation:0}],this._R.updateFloor(t,ki,void 0,[e],ji);let a=[0,Math.min(i*.5,850),0],o=Math.max(n,r)*1.5+i*.9+1400;return this._orbit(a,o,22,Math.PI-.6),this._readback()}_captureLight(e){let t=Ai(5e3,5e3);t.walls=[{id:`wb`,points:[{x:400,y:600},{x:4600,y:600}]},{id:`ws`,points:[{x:400,y:600},{x:400,y:4600}]}];let n=e===`sconce`||e===`wall_sconce`||e===`step`||e===`flood`||e===`exhaust_wall`;t.lights=[{id:`l`,x:n?2400:t.w/2,y:n?600:t.d/2,entity_id:`light.demo`,iconKind:e,rotation:e===`fireplace`||e===`sconce`?180:0,label:``,length:1600}];let r=e===`fireplace`?{preset:`night`,floorColor:`#2f333c`,wallColor:`#6c7686`,wallCutaway:!1}:{preset:`dusk`,floorColor:`#4a4640`,floorTex:`wood`,wallColor:`#c2c8d0`,wallCutaway:!1};return this._R.updateFloor(t,r,void 0,void 0,ji),this._R.updateLightsSwitches(t.lights,[],()=>({state:`on`,attributes:{brightness:255}})),this._orbit([0,1200,0],6800,22,Math.PI*1.86),this._readback()}_orbit(e,t,n,r){let i=n*Math.PI/180,a=e[1]+t*Math.sin(i),o=t*Math.cos(i);this._R.setCameraView([e[0]+o*Math.sin(r),a,e[2]+o*Math.cos(r)],e)}_readback(){return this._R._renderer.render(this._R._scene,this._R._camera),this._R._renderer.domElement.toDataURL(`image/png`)}};function Ni(e){typeof requestAnimationFrame==`function`?requestAnimationFrame(e):setTimeout(e,16)}var Pi=new Mi,Fi=class extends N{constructor(...e){super(...e),this._tab=`furniture`,this._collapsed=!1,this._tick=()=>this.requestUpdate()}createRenderRoot(){return this}connectedCallback(){super.connectedCallback();try{this._collapsed=localStorage.getItem(`diorama:toolbar:collapsed`)===`1`}catch{}this.planner.addEventListener(`config`,this._tick)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick)}_toggleCollapsed(){this._collapsed=!this._collapsed;try{localStorage.setItem(`diorama:toolbar:collapsed`,this._collapsed?`1`:`0`)}catch{}}_cats(){return yi(this.planner)}_handle(e){let t=e?`Show placement toolbar`:`Collapse placement toolbar`;return I`
      <button class="tb-handle" title=${t} aria-label=${t}
              aria-expanded=${e?`false`:`true`}
              @click=${()=>this._toggleCollapsed()}>
        <span class="tb-handle-glyph">${e?`▴`:`▾`}</span>
        ${e?I`<span class="tb-handle-label">Toolbar</span>`:P}
      </button>`}_card(e){let t=this.planner,n=e.isArmed(t),r=Pi.get(e.thumb,e.glyph,()=>this.requestUpdate(),{customObjects:t.store.customObjects});return I`
      <button class="tb-card ${n?`armed`:``}" title=${e.label}
              @click=${()=>{e.arm(t),this.requestUpdate()}}>
        <img class="tb-thumb" src=${r} alt="" draggable="false">
        <span class="tb-label">${e.label}</span>
      </button>`}_variantRow(e){if(!e.variants)return P;let t=this.planner;return I`
      <div class="tb-variants">
        <span class="tb-variants-label">${e.label}:</span>
        ${e.variants.map(e=>I`
          <button class="tb-chip ${e.isArmed(t)?`armed`:``}"
                  @click=${()=>{e.arm(t),this.requestUpdate()}}>${e.label}</button>`)}
      </div>`}render(){let e=this.planner;if(e.uiMode!==`edit`)return P;let t=this._cats();t.some(e=>e.id===this._tab)||(this._tab=t[0]?.id??`furniture`);let n=t.find(e=>e.id===this._tab);if(this._collapsed)return I`
        <div class="tb-dock tb-collapsed">
          ${this._handle(!0)}
        </div>`;let r=n?.cards.find(t=>t.variants&&t.isArmed(e));return I`
      <div class="tb-dock">
        <div class="tb-tabs">
          ${this._handle(!1)}
          <div class="tb-tabstrip">
            ${t.map(e=>I`
              <button class="tb-tab ${e.id===this._tab?`active`:``}"
                      @click=${()=>{this._tab=e.id}}>
                <span class="tb-tab-glyph">${e.glyph}</span>${e.label}
              </button>`)}
          </div>
        </div>
        ${r?this._variantRow(r):P}
        <div class="tb-row tb-cards">
          ${n?n.cards.map(e=>this._card(e)):P}
        </div>
      </div>`}};k([R({attribute:!1})],Fi.prototype,`planner`,void 0),k([F()],Fi.prototype,`_tab`,void 0),k([F()],Fi.prototype,`_collapsed`,void 0),Fi=k([L(`diorama-toolbar`)],Fi);var Ii=[{version:`v0.66.1`,name:`feeders only`,date:`2026-08-15`,notes:[`airplanes.live access requires feeding them data from your own ADS-B receiver — the settings block now says so before you pick it`,`If you are a feeder you already own a receiver, so Diorama points you at Local receiver (LAN) instead: your own data, fewer hops, and it never goes through Home Assistant`,`airplanes.live stays selectable and keeps working if you have access`]},{version:`v0.66.0`,name:`ground control`,date:`2026-08-15`,notes:[`Flight tracking works again: airplanes.live now blocks everyone, so OpenSky is the new default and Home Assistant fetches it for you — Settings writes the YAML to paste, with your own location already filled in`,`Your own ADS-B receiver can go the same route, which skips the CORS setup entirely — though fetching it directly is lighter if you can, and the guide explains when to pick which`,`New Demo source: invented aircraft on fixed circuits, no network and no Home Assistant needed — the live demo now has a sky full of planes`,`Offline panels say "needs a Home Assistant connection" instead of quietly failing, and the ISS keeps flying regardless`,`A local receiver hears everything for hundreds of miles; only what is inside your radius is drawn, and that is now guaranteed by test`]},{version:`v0.65.0`,name:`straighten up`,date:`2026-08-10`,notes:[`Turning a lit fire OFF in 3D works — it never did. A lit fire was rebuilding the whole light group every frame, which both ate ~22% of your frame rate and left the click landing on nothing`,`Click through glass: a fire or a lamp seen through a window is what you hit, not the pane`,`The mower parks nose-out in its dock instead of burying itself in the wall behind it`,`Every demo floor plan straightened up — real bed sizes with headboards against the wall, 232 pieces turned to face the room instead of the wall, and overlapping furniture separated`,`Dragging a table no longer reaches through a wall and drags a chair in the next room with it`]},{version:`v0.64.0`,name:`upstairs, downstairs`,date:`2026-08-09`,notes:[`Stairs, properly built: start-a-step-down by default, a step-count entry, side walls up to the level above, risers/newel posts/handrails, stringers under open flights — and half-flights that line up and set their own elevation`,`Home theater: plush leather recliners (single/loveseat/row of three), a projector with a real body that shows where it aims, and wall + retractable ceiling projection screens that display everything a TV can`,`The mower stays outside and parks straight: doorway routing out of rooms it gets shut into, and a docked mower that snaps into its dock instead of wedging at a wall`,`Curtains are clickable in both views, floor voids render as real open shafts, and the weather chip minimizes to a pill`,`Plants & trees get their own category, bathroom vanity lights (bar, Hollywood, backlit mirror), the queen bed is a real queen, and avatars stop switching off what you just switched on`]},{version:`v0.63.0`,name:`home improvement`,date:`2026-08-07`,notes:[`Garage doors: 9 styles incl. windowed sectionals, locks, open-% readout, tracks & opener motor, opening height, door & window colors`,`Furniture reorganized into groups; 4 bed sizes; 6 new chairs; on-canvas rotate handle; the wall magnet is gone`,`mmWave: "Show real positions" raw markers + "Keep avatars in this room"; the rhythmic 2D flicker is fixed; the sky sun is parallax-free (the solar-panel aim mystery)`,`Typing can never change tools — plus rebindable, disable-able keyboard shortcuts`,`Vehicles: one toolbar tab + 11 common models; fleet-wide geometry cleanup; this Recent Releases list`]},{version:`v0.62.0`,name:`personal space`,date:`2026-08-07`,notes:[`Avatars stop mobbing windows — standing activity spots are single-occupancy, like seats`,`Roamers genuinely roam: per-avatar wandering with real yard excursions`,`Unreachable destinations re-roll instead of pathing into walls`,`Wall-cutaway fade is frame-rate-independent (no more 120 Hz flashing while orbiting)`]},{version:`v0.61.0`,name:`measure twice`,date:`2026-08-06`,notes:[`Home Assistant 2026.8 compatibility: the panel sizes itself (HA’s new host styling collapsed it to zero height)`,`After updating: reset the frontend cache and restart the companion app`,`Do NOT add handle_safe_area to the panel_custom YAML — HA core 2026.8.0 rejects it`]},{version:`v0.60.0`,name:`solid ground`,date:`2026-08-06`,notes:[`Ground banding fixed — layered ground paint no longer hatches into dark wedges`,`Motion-sensor coverage decals un-stuck from the floor slab`,`Light floor-pools now wash over painted ground and rugs, matching the 2D plan`]},{version:`v0.59.0`,name:`true colors`,date:`2026-08-06`,notes:[`Airline liveries: identified aircraft paint real brand colors (129-operator table)`,`Flight card gains a full Airline block — name, IATA, spoken ATC form, slogan, partners`,`Customizable fuselage and tow-banner text; "airline" joins the label fields`,`Regionals honestly carry no colors; military and privacy flags always win`]},{version:`v0.58.0`,name:`weather on demand`,date:`2026-08-06`,notes:[`Demo weather source: hand-author condition, temps, wind, clouds, moon phase, sun position, alerts — zero network`,`Windows are solid to avatars and the robot vacuum; only doors pass`,`The lawn mower is hard-contained outdoors — fences contain, gates pass`,`mmWave sensors gain the "Demo avatar" checkbox`]},{version:`v0.57.0`,name:`chasing the sun`,date:`2026-08-05`,notes:[`Sun-tracking solar panel fixture — aims at the real sun, UV-tinted frame, wattage glow`,`Eleven vehicle geometry corrections from visual review`,`Three new vehicles: ex-police sedan, Apollo Lunar Rover, Perseverance Mars rover`,`New flying-models gallery page (62 banner-tow craft)`]},{version:`v0.56.0`,name:`sound the alarm`,date:`2026-08-05`,notes:[`Sirens dispatch properly — state-aware on/off with tone, volume and duration, feature-gated per device`,`Outdoor avatars raise a parasol at very high UV (rain’s umbrella still wins)`,`New network rack appliance with an aggregate health LED`]},{version:`v0.55.0`,name:`wheels up`,date:`2026-08-05`,notes:[`Vehicle model library: selectable packs (Settings ▸ Vehicles) + a toolbar tab with real 3D thumbnails`,`23 ground vehicles and 34 aircraft/spacecraft join the roster`,`Military skins on live ADS-B traffic (F-16, F-22, A-10, B-2, B-52, Apache)`,`Mailbox rebuilt as a proper tunnel box with a working, clickable flag`]},{version:`v0.54.0`,name:`that’s no moon`,date:`2026-08-01`,notes:[`Gates truly break railing walls, with railing-styled gate panels`,`19 new banner tow craft (military/NASA + fiction homages); the news chopper becomes an aircraft option`,`"Space station" moon option — the real phases still apply`]},{version:`v0.53.0`,name:`hands on`,date:`2026-08-01`,notes:[`Midpoint "+" handles insert vertices; whole shapes drag as one`,`Room labels live at (and drag with) their placement marker`,`Universal alignment guides + Alt+click identify anything`,`Custom banner/train/chopper colors; doors and windows clickable in 3D`]}],q=class extends N{constructor(...e){super(...e),this.open=!1,this.editing=null,this._name=``,this._w=8e3,this._d=6e3,this._save=()=>{let e=this._name.trim()||`Floor`,t=Math.max(1e3,this._w),n=Math.max(1e3,this._d);this.planner.saveFloorEdit(this.editing?.id??null,e,t,n),this.open=!1}}createRenderRoot(){return this}show(e){this.editing=e,this._name=e?e.name:`Floor ${this.planner.store.floors.length+1}`,this._w=e?e.w:8e3,this._d=e?e.d:6e3,this.open=!0}render(){return this.open?I`
      <div class="modal-ov" @click=${e=>{e.target===e.currentTarget&&(this.open=!1)}}>
        <div class="modal" style="max-width:340px">
          <h3>${this.editing?`Edit Floor`:`New Floor`}
            <button class="close" @click=${()=>this.open=!1}>✕</button>
          </h3>
          <div class="row"><label>Name</label>
            <input type="text" .value=${this._name} @input=${e=>this._name=e.target.value}>
          </div>
          <div class="row"><label>Width (mm)</label>
            <input type="number" min="1000" step="100" .value=${String(this._w)}
                   @input=${e=>this._w=parseFloat(e.target.value)||8e3}>
          </div>
          <div class="row"><label>Depth (mm)</label>
            <input type="number" min="1000" step="100" .value=${String(this._d)}
                   @input=${e=>this._d=parseFloat(e.target.value)||6e3}>
          </div>
          <div style="display:flex;gap:6px;margin-top:14px;justify-content:flex-end">
            <button class="btn" @click=${()=>this.open=!1}>Cancel</button>
            <button class="btn active" @click=${this._save}>Save</button>
          </div>
        </div>
      </div>
    `:P}};k([R({attribute:!1})],q.prototype,`planner`,void 0),k([F()],q.prototype,`open`,void 0),k([F()],q.prototype,`editing`,void 0),k([F()],q.prototype,`_name`,void 0),k([F()],q.prototype,`_w`,void 0),k([F()],q.prototype,`_d`,void 0),q=k([L(`diorama-floor-modal`)],q);var Li=class extends N{constructor(...e){super(...e),this._tick=()=>this.requestUpdate()}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.planner.addEventListener(`config`,this._tick)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick)}render(){let e=this.planner.editZone;if(!e)return P;let t=this.planner.floor().sensors.find(t=>t.id===e.sensorId),n=t?(e.prefix===`iz`?this.planner.zonesBy[t.id].inclusion:this.planner.zonesBy[t.id].filter)[e.zi]:null;return I`
      <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;
                  background:rgba(10,10,30,0.93);border:1px solid var(--accent);border-radius:6px;
                  padding:6px 14px;align-items:center;gap:8px;z-index:6;font-size:12px;white-space:nowrap">
        <span style="color:var(--text)">${`${t?.label||`Sensor`} / ${n?.name||e.prefix+e.zi}: ${e.verts.length} pt — click to add, dbl-click to finish`}</span>
        <button class="btn-sm" @click=${()=>{this.planner.editZone&&this.planner.editZone.verts.length>0&&(this.planner.editZone.verts.pop(),this.planner.emitConfig())}}>↩ Undo</button>
        <button class="btn-sm" style="background:var(--accent);color:#fff;border-color:var(--accent)"
                @click=${()=>nn(this.planner)}>✓ Finish</button>
        <button class="btn-sm" @click=${()=>Ln(this.planner)}>✕</button>
      </div>
    `}};k([R({attribute:!1})],Li.prototype,`planner`,void 0),Li=k([L(`diorama-zone-edit-bar`)],Li);var J=class extends N{constructor(...e){super(...e),this.open=!1,this._domain=``,this._domains=null,this._q=``,this._deviceFilter=``,this._devices=null,this._title=`Pick an entity`,this._areaFilter=null,this._areaOn=!1,this._onPick=null,this._entityToDevice={},this._deviceNames={},this._registriesLoaded=!1}createRenderRoot(){return this}show(e,t,n){Array.isArray(e)?(this._domains=e,this._domain=``):(this._domains=null,this._domain=e??``),this._onPick=t,this._q=``,this._deviceFilter=``,this._devices=null,this._title=`Pick an entity`,this._areaFilter=n??null,this._areaOn=!!n,this.open=!0,this._loadRegistries(),this._areaOn&&this.planner?.ensureHaAreaRegistry().then(()=>this.requestUpdate())}showDevices(e,t,n=`Pick a device`){this._devices=e,this._onPick=t,this._q=``,this._title=n,this.open=!0}async _loadRegistries(){if(!(this._registriesLoaded||!this.planner.hass))try{let[e,t]=await Promise.all([this.planner.hass.getDevices(),this.planner.hass.getEntityRegistry()]);for(let t of e)this._deviceNames[t.id]=t.name_by_user||t.name||t.id;for(let e of t)this._entityToDevice[e.entity_id]=e.device_id;this._registriesLoaded=!0,this.requestUpdate()}catch{}}render(){if(!this.open)return P;if(this._devices){let e=this._q.toLowerCase(),t=this._devices.filter(t=>!e||(t.name+` `+(t.subtitle||``)+` `+t.id).toLowerCase().includes(e));return I`
        <div class="modal-ov" @click=${e=>{e.target===e.currentTarget&&(this.open=!1)}}>
          <div class="modal">
            <h3>${this._title}<button class="close" @click=${()=>this.open=!1}>✕</button></h3>
            <input class="search" placeholder="Search devices…"
                   .value=${this._q}
                   @input=${e=>this._q=e.target.value}>
            <div class="entity-list">
              ${t.length===0?I`<div class="entity-item" style="cursor:default;color:var(--text-dim)">
                    No devices match.</div>`:t.slice(0,300).map(e=>I`
                    <div class="entity-item" @click=${()=>{this._onPick?.(e.id),this.open=!1}}>
                      <div style="flex:1;overflow:hidden">
                        <div class="name">${e.name}</div>
                        ${e.subtitle?I`
                          <div style="font-size:10px;color:var(--text-dim)">${e.subtitle}</div>
                        `:P}
                      </div>
                    </div>`)}
            </div>
          </div>
        </div>
      `}let e=this.planner.hass?.states||{},t=new Set,n=new Set;for(let r of Object.keys(e)){let e=r.indexOf(`.`);e>0&&t.add(r.slice(0,e));let i=this._entityToDevice[r];i&&n.add(i)}let r=[...t].sort(),i=[...n].sort((e,t)=>(this._deviceNames[e]||e).localeCompare(this._deviceNames[t]||t)),a=[],o=this._q.toLowerCase();for(let t of Object.keys(e)){let n=t.indexOf(`.`),r=n>0?t.slice(0,n):``;if(this._domains&&!this._domains.includes(r)||this._domain&&r!==this._domain)continue;let i=this._entityToDevice[t];if(this._deviceFilter&&i!==this._deviceFilter||this._areaOn&&this._areaFilter&&this.planner?.entityAreaId(t)!==this._areaFilter.areaId)continue;let s=e[t],c=String(s.attributes?.friendly_name||t),l=i?this._deviceNames[i]:null;o&&!(c+` `+t+` `+(l||``)).toLowerCase().includes(o)||a.push({id:t,name:c,deviceName:l})}return a.sort((e,t)=>e.name.localeCompare(t.name)),I`
      <div class="modal-ov" @click=${e=>{e.target===e.currentTarget&&(this.open=!1)}}>
        <div class="modal">
          <h3>Pick an entity<button class="close" @click=${()=>this.open=!1}>✕</button></h3>
          ${this._areaFilter?I`
            <div style="margin-bottom:6px;font-size:11px">
              ${this._areaOn?I`
                <span style="display:inline-flex;align-items:center;gap:5px;padding:2px 6px;
                             border:1px solid var(--accent);border-radius:10px;color:var(--accent)"
                      title="Only entities in this Home Assistant area are listed. Remove to see all.">
                  Area: ${this._areaFilter.areaName}
                  <button class="icon-btn" style="font-size:10px;padding:0 2px;line-height:1"
                          title="Remove the area filter"
                          @click=${()=>{this._areaOn=!1}}>✕</button>
                </span>
              `:I`
                <button class="btn" style="font-size:10px;padding:2px 6px"
                        title="Re-apply the area filter"
                        @click=${()=>{this._areaOn=!0}}>
                  + Filter to area: ${this._areaFilter.areaName}
                </button>`}
            </div>`:P}
          <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap">
            <select .value=${this._domain}
                    @change=${e=>this._domain=e.target.value}
                    style="background:#111;color:var(--text);border:1px solid var(--border);
                           border-radius:5px;padding:6px 8px;font-size:12px;flex:1;min-width:120px">
              <option value="">All domains</option>
              ${r.map(e=>I`<option value=${e} ?selected=${this._domain===e}>${e}</option>`)}
            </select>
            <select .value=${this._deviceFilter}
                    ?disabled=${!this._registriesLoaded}
                    @change=${e=>this._deviceFilter=e.target.value}
                    style="background:#111;color:var(--text);border:1px solid var(--border);
                           border-radius:5px;padding:6px 8px;font-size:12px;flex:2;min-width:140px">
              <option value="">${this._registriesLoaded?`All devices`:`Loading devices…`}</option>
              ${i.map(e=>I`
                <option value=${e} ?selected=${this._deviceFilter===e}>
                  ${this._deviceNames[e]||e}
                </option>`)}
            </select>
          </div>
          <input class="search" placeholder="Search by entity, friendly name, or device…"
                 .value=${this._q}
                 @input=${e=>this._q=e.target.value}>
          <div class="entity-list">
            ${a.length===0?I`<div class="entity-item" style="cursor:default;color:var(--text-dim)">
                  No entities match.</div>`:a.slice(0,300).map(e=>I`
                  <div class="entity-item" @click=${()=>{this._onPick?.(e.id),this.open=!1}}>
                    <div style="flex:1;overflow:hidden">
                      <div class="name">${e.name}</div>
                      ${e.deviceName?I`
                        <div style="font-size:10px;color:var(--text-dim)">📦 ${e.deviceName}</div>
                      `:P}
                    </div>
                    <div class="eid">${e.id}</div>
                  </div>`)}
          </div>
        </div>
      </div>
    `}};k([R({attribute:!1})],J.prototype,`planner`,void 0),k([F()],J.prototype,`open`,void 0),k([F()],J.prototype,`_domain`,void 0),k([F()],J.prototype,`_domains`,void 0),k([F()],J.prototype,`_q`,void 0),k([F()],J.prototype,`_deviceFilter`,void 0),k([F()],J.prototype,`_devices`,void 0),k([F()],J.prototype,`_title`,void 0),k([F()],J.prototype,`_areaFilter`,void 0),k([F()],J.prototype,`_areaOn`,void 0),J=k([L(`diorama-entity-picker`)],J);var Y=class extends N{constructor(...e){super(...e),this.open=!1,this._entityId=``,this._fanEntityId=null,this._interacting=!1,this._tick=()=>{this.open&&!this._interacting&&this.requestUpdate()},this._pointerUp=()=>{this._interacting&&(this._interacting=!1,this.requestUpdate())}}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.planner.addEventListener(`config`,this._tick),this.planner.addEventListener(`live`,this._tick),window.addEventListener(`pointerup`,this._pointerUp,!0)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick),this.planner.removeEventListener(`live`,this._tick),window.removeEventListener(`pointerup`,this._pointerUp,!0)}show(e,t=null){this._entityId=e??``,this._fanEntityId=t,this.open=!0}render(){if(!this.open)return P;let e=this.planner.hass?.states??{},t=this._entityId?e[this._entityId]:void 0,n=this._fanEntityId?e[this._fanEntityId]:void 0;if(!t&&!n)return P;let r=t?.attributes||{},i=Array.isArray(r.supported_color_modes)?r.supported_color_modes:[],a=i.some(e=>e!==`onoff`)||typeof r.brightness==`number`,o=i.some(e=>[`rgb`,`rgbw`,`rgbww`,`hs`,`xy`].includes(e))||Array.isArray(r.rgb_color),s=i.includes(`color_temp`)||typeof r.color_temp_kelvin==`number`,c=r.min_color_temp_kelvin||2e3,l=r.max_color_temp_kelvin||6500,u=typeof r.brightness==`number`?r.brightness:255,d=Array.isArray(r.rgb_color)?r.rgb_color:[255,230,180],f=typeof r.color_temp_kelvin==`number`?r.color_temp_kelvin:Math.round((c+l)/2),p=t?.state===`on`,m=`#`+d.map(e=>Math.max(0,Math.min(255,e)).toString(16).padStart(2,`0`)).join(``),h=e=>this.planner.hass?.callService(`light`,`turn_on`,{entity_id:this._entityId,...e}),g=()=>{this._interacting=!0},_=n?.attributes||{},v=n?.state===`on`,y=typeof _.percentage==`number`?_.percentage:v?100:0,b=(e,t={})=>this.planner.hass?.callService(`fan`,e,{entity_id:this._fanEntityId,...t});return I`
      <div class="modal-ov" @click=${e=>{e.target===e.currentTarget&&(this.open=!1)}}>
        <div class="modal">
          <h3>${t?r.friendly_name||this._entityId:_.friendly_name||this._fanEntityId||`Fan`}
            <button class="close" @click=${()=>this.open=!1}>✕</button>
          </h3>
          ${t?I`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Power</label>
            <label class="mini-toggle" style="width:36px;height:20px">
              <input type="checkbox" .checked=${p}
                     @change=${e=>this.planner.hass?.callService(`light`,e.target.checked?`turn_on`:`turn_off`,{entity_id:this._entityId})}>
              <span></span>
            </label>
          </div>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Brightness</label>
            ${a?I`
              <input type="range" min="1" max="255" .value=${String(u)}
                     style="flex:1" @pointerdown=${g}
                     @input=${e=>h({brightness:parseInt(e.target.value)})}>
              <span style="font-size:11px;font-family:monospace;min-width:40px;text-align:right">
                ${Math.round(u/255*100)}%
              </span>
            `:I`<span style="font-size:11px;color:var(--text-dim);font-style:italic">not supported</span>`}
          </div>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Color</label>
            ${o?I`
              <input type="color" .value=${m}
                     style="width:40px;height:28px;border:none;background:transparent;cursor:pointer;padding:0"
                     @input=${e=>{let t=e.target.value;h({rgb_color:[parseInt(t.slice(1,3),16),parseInt(t.slice(3,5),16),parseInt(t.slice(5,7),16)]})}}>
              <span style="font-size:11px;font-family:monospace">${m.toUpperCase()}</span>
            `:I`<span style="font-size:11px;color:var(--text-dim);font-style:italic">not supported</span>`}
          </div>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;${n?`border-bottom:1px solid var(--border)`:``}">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Temperature</label>
            ${s?I`
              <input type="range" min=${c} max=${l} step="50" .value=${String(f)}
                     style="flex:1" @pointerdown=${g}
                     @input=${e=>h({color_temp_kelvin:parseInt(e.target.value)})}>
              <span style="font-size:11px;font-family:monospace">${f} K</span>
            `:I`<span style="font-size:11px;color:var(--text-dim);font-style:italic">not supported</span>`}
          </div>
          `:P}
          ${n?I`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Fan</label>
            <label class="mini-toggle" style="width:36px;height:20px">
              <input type="checkbox" .checked=${v}
                     @change=${e=>b(e.target.checked?`turn_on`:`turn_off`)}>
              <span></span>
            </label>
          </div>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Speed</label>
            <input type="range" min="0" max="100" step="5" .value=${String(Math.round(y))}
                   style="flex:1" @pointerdown=${g}
                   @change=${e=>{let t=parseInt(e.target.value);t<=0?b(`turn_off`):b(`set_percentage`,{percentage:t})}}>
            <span style="font-size:11px;font-family:monospace;min-width:40px;text-align:right">
              ${Math.round(y)}%
            </span>
          </div>
          `:P}
        </div>
      </div>
    `}};k([R({attribute:!1})],Y.prototype,`planner`,void 0),k([F()],Y.prototype,`open`,void 0),k([F()],Y.prototype,`_entityId`,void 0),k([F()],Y.prototype,`_fanEntityId`,void 0),Y=k([L(`diorama-light-config`)],Y);var Ri=class extends N{constructor(...e){super(...e),this.open=!1,this._entityId=``,this._interacting=!1,this._tick=()=>{this.open&&!this._interacting&&this.requestUpdate()},this._pointerUp=()=>{this._interacting&&(this._interacting=!1,this.requestUpdate())}}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.planner.addEventListener(`config`,this._tick),this.planner.addEventListener(`live`,this._tick),window.addEventListener(`pointerup`,this._pointerUp,!0)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick),this.planner.removeEventListener(`live`,this._tick),window.removeEventListener(`pointerup`,this._pointerUp,!0)}show(e){this._entityId=e,this.open=!0}render(){if(!this.open)return P;let e=this.planner.hass?.states?.[this._entityId];if(!e)return P;let t=e.attributes||{},n=this._entityId.indexOf(`.`),r=n>0?this._entityId.slice(0,n):`media_player`,i=r===`media_player`,a=e.state,o=a!==`off`&&a!==`unavailable`&&a!==`standby`,s=typeof t.supported_features==`number`?t.supported_features:0,c=i&&((s&1)!=0||(s&16384)!=0||a===`playing`||a===`paused`),l=i&&typeof t.volume_level==`number`,u=Array.isArray(t.source_list)?t.source_list:[],d=i&&u.length>0,f=typeof t.volume_level==`number`?t.volume_level:0,p=()=>{this._interacting=!0},m=(e,t={})=>this.planner.hass?.callService(r,e,{entity_id:this._entityId,...t}),h=a.charAt(0).toUpperCase()+a.slice(1);return I`
      <div class="modal-ov" @click=${e=>{e.target===e.currentTarget&&(this.open=!1)}}>
        <div class="modal">
          <h3>${t.friendly_name||this._entityId}
            <button class="close" @click=${()=>this.open=!1}>✕</button>
          </h3>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Power</label>
            <label class="mini-toggle" style="width:36px;height:20px">
              <input type="checkbox" .checked=${o}
                     @change=${e=>m(e.target.checked?`turn_on`:`turn_off`)}>
              <span></span>
            </label>
            <span style="font-size:11px;color:var(--text-dim);font-family:monospace">${h}</span>
          </div>
          ${c?I`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Playback</label>
            <button class="btn" @click=${()=>m(`media_play_pause`)}>
              ${a===`playing`?`⏸ Pause`:`▶ Play`}
            </button>
          </div>
          `:P}
          ${l?I`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Volume</label>
            <input type="range" min="0" max="1" step="0.01" .value=${String(f)}
                   style="flex:1" @pointerdown=${p}
                   @change=${e=>m(`volume_set`,{volume_level:parseFloat(e.target.value)})}>
            <span style="font-size:11px;font-family:monospace;min-width:40px;text-align:right">
              ${Math.round(f*100)}%
            </span>
          </div>
          `:P}
          ${d?I`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Source</label>
            <select .value=${t.source||``}
                    @change=${e=>m(`select_source`,{source:e.target.value})}
                    style="flex:1;background:#111;color:var(--text);border:1px solid var(--border);
                           border-radius:5px;padding:6px 8px;font-size:12px">
              ${u.map(e=>I`<option value=${e} ?selected=${t.source===e}>${e}</option>`)}
            </select>
          </div>
          `:P}
          ${i&&a===`playing`&&t.media_title?I`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Now playing</label>
            <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${t.media_title}
            </span>
          </div>
          `:P}
        </div>
      </div>
    `}};k([R({attribute:!1})],Ri.prototype,`planner`,void 0),k([F()],Ri.prototype,`open`,void 0),k([F()],Ri.prototype,`_entityId`,void 0),Ri=k([L(`diorama-media-config`)],Ri);var X=class extends N{constructor(...e){super(...e),this.open=!1,this._id=``,this._code=``,this._tick=()=>{this.open&&this.requestUpdate()}}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.planner.addEventListener(`config`,this._tick),this.planner.addEventListener(`live`,this._tick)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick),this.planner.removeEventListener(`live`,this._tick)}show(e){this._id=e,this._code=``,this.open=!0}_panel(){return(this.planner.floor().alarmPanels??[]).find(e=>e.id===this._id)??null}render(){if(!this.open)return P;let e=this.planner,t=this._panel();if(!t)return P;let n=e.effectiveState(t)?.state??null,r=Vn(n),i=!!t.entity_id,a=i&&t.allowControl===!0,o=!i,s=t.label?.trim()||`Alarm`,c=n?n.replace(`armed_`,`armed `).replace(/_/g,` `):i?`unavailable`:`not set`,l=(n,r)=>{if(o){e.setAlarmLocalState(t.id,r);return}if(!a||!t.entity_id)return;let i={entity_id:t.entity_id};this._code.trim()&&(i.code=this._code.trim());try{e.hass?.callService(`alarm_control_panel`,n,i)}catch{}},u=a||o;return I`
      <div class="modal-ov" @click=${e=>{e.target===e.currentTarget&&(this.open=!1)}}>
        <div class="modal">
          <h3>${s}
            <button class="close" @click=${()=>this.open=!1}>✕</button>
          </h3>
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 0;border-bottom:1px solid var(--border)">
            <div style="width:14px;height:14px;border-radius:50%;background:${r};box-shadow:0 0 10px ${r}"></div>
            <div style="font-size:20px;font-weight:600;color:${r};text-transform:capitalize">${c}</div>
            ${o?I`<div style="font-size:11px;color:var(--text-dim)">Local demo (not bound to Home Assistant)</div>`:P}
            ${i&&!t.allowControl?I`<div style="font-size:11px;color:var(--text-dim)">View only — enable "Allow arm/disarm" to control</div>`:P}
          </div>
          ${u?I`
            ${a?I`
              <div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
                <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Code</label>
                <input type="password" inputmode="numeric" .value=${this._code}
                       placeholder="optional"
                       style="flex:1"
                       @input=${e=>{this._code=e.target.value}}>
              </div>
            `:P}
            <div style="display:flex;gap:8px;padding:12px 0">
              <button class="btn" style="flex:1" @click=${()=>l(`alarm_disarm`,`disarmed`)}>Disarm</button>
              <button class="btn" style="flex:1" @click=${()=>l(`alarm_arm_home`,`armed_home`)}>Arm Home</button>
              <button class="btn" style="flex:1" @click=${()=>l(`alarm_arm_away`,`armed_away`)}>Arm Away</button>
            </div>
          `:P}
        </div>
      </div>
    `}};k([R({attribute:!1})],X.prototype,`planner`,void 0),k([F()],X.prototype,`open`,void 0),k([F()],X.prototype,`_id`,void 0),k([F()],X.prototype,`_code`,void 0),X=k([L(`diorama-alarm-modal`)],X);var Z=class extends N{constructor(...e){super(...e),this.open=!1,this._id=``,this._pend=null,this._pendLo=null,this._pendHi=null,this._sendTimer=null,this._tick=()=>{this.open&&this.requestUpdate()}}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.planner.addEventListener(`config`,this._tick),this.planner.addEventListener(`live`,this._tick)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick),this.planner.removeEventListener(`live`,this._tick)}show(e){this._id=e,this._pend=this._pendLo=this._pendHi=null,this._sendTimer&&(clearTimeout(this._sendTimer),this._sendTimer=null),this.open=!0}_thermo(){return(this.planner.floor().thermostats??[]).find(e=>e.id===this._id)??null}_scheduleTemp(e){this._pend=e,this._sendTimer&&clearTimeout(this._sendTimer),this._sendTimer=window.setTimeout(()=>{this._sendTimer=null,this.planner.setThermostatTemp(this._id,e)},400)}_scheduleRange(e,t){this._pendLo=e,this._pendHi=t,this._sendTimer&&clearTimeout(this._sendTimer),this._sendTimer=window.setTimeout(()=>{this._sendTimer=null,this.planner.setThermostatTemp(this._id,0,e,t)},400)}render(){if(!this.open)return P;let e=this.planner,t=this._thermo();if(!t)return P;let n=e.effectiveState(t),r=n?.state??null,i=n?.attributes??{},a=!!t.entity_id,o=!a,s=o||a&&t.allowControl!==!1,c=St(r),l=t.label?.trim()||`Thermostat`,u=e.store.imperial,d=f(n,u),p=i.hvac_action??null,m=tt(i.current_temperature),h=tt(i.current_humidity),g=typeof i.target_temp_step==`number`&&i.target_temp_step>0?i.target_temp_step:o?1:.5,_=typeof i.min_temp==`number`?i.min_temp:o?7:-50,v=typeof i.max_temp==`number`?i.max_temp:o?35:150,y=i.target_temp_low!=null&&i.target_temp_high!=null,b=e=>jt(e,_,v,g),x=this._pend??(a?typeof i.temperature==`number`?i.temperature:null:t.localTemp??21),S=this._pendLo??(typeof i.target_temp_low==`number`?i.target_temp_low:null),C=this._pendHi??(typeof i.target_temp_high==`number`?i.target_temp_high:null),ee=Array.isArray(i.hvac_modes)?i.hvac_modes:o?[`off`,`heat`,`cool`,`fan_only`]:[],te=typeof i.supported_features==`number`?i.supported_features:0,w=Je(te,dr.FAN_MODE)&&Array.isArray(i.fan_modes)?i.fan_modes:null,T=Je(te,dr.PRESET_MODE)&&Array.isArray(i.preset_modes)?i.preset_modes:null,E=(e,t,n)=>I`
      <button class="btn" style="width:44px;font-size:18px"
              @click=${()=>n(b((t??21)+e*g))}>${e<0?`−`:`+`}</button>`;return I`
      <div class="modal-ov" @click=${e=>{e.target===e.currentTarget&&(this.open=!1)}}>
        <div class="modal">
          <h3>${l}
            <button class="close" @click=${()=>this.open=!1}>✕</button>
          </h3>
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:34px;font-weight:700;color:${c};line-height:1">
              ${m==null?o?`—`:`n/a`:`${m}${d}`}
            </div>
            <div style="font-size:13px;color:${c};text-transform:capitalize">
              ${r?r.replace(/_/g,` `):a?`unavailable`:`demo`}${p?` · ${p}`:``}
            </div>
            ${h==null?P:I`<div style="font-size:11px;color:var(--text-dim)">humidity ${h}%</div>`}
            ${o?I`<div style="font-size:11px;color:var(--text-dim)">Local demo (not bound to Home Assistant)</div>`:P}
            ${a&&t.allowControl===!1?I`<div style="font-size:11px;color:var(--text-dim)">View only — enable "Allow control"</div>`:P}
          </div>

          ${s?I`
            <!-- Setpoint stepper(s) -->
            <div style="padding:12px 0;border-bottom:1px solid var(--border)">
              ${y?I`
                <div style="display:flex;gap:14px;justify-content:center">
                  <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <span style="font-size:11px;color:var(--text-dim)">Heat to</span>
                    <div style="display:flex;align-items:center;gap:6px">
                      ${E(-1,S,e=>this._scheduleRange(Math.min(e,C??e),C??e))}
                      <span style="font-size:20px;font-weight:600;min-width:48px;text-align:center">${S==null?`—`:`${tt(S)}°`}</span>
                      ${E(1,S,e=>this._scheduleRange(Math.min(e,C??e),C??e))}
                    </div>
                  </div>
                  <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <span style="font-size:11px;color:var(--text-dim)">Cool to</span>
                    <div style="display:flex;align-items:center;gap:6px">
                      ${E(-1,C,e=>this._scheduleRange(S??e,Math.max(e,S??e)))}
                      <span style="font-size:20px;font-weight:600;min-width:48px;text-align:center">${C==null?`—`:`${tt(C)}°`}</span>
                      ${E(1,C,e=>this._scheduleRange(S??e,Math.max(e,S??e)))}
                    </div>
                  </div>
                </div>
              `:I`
                <div style="display:flex;align-items:center;justify-content:center;gap:10px">
                  <span style="font-size:11px;color:var(--text-dim)">Target</span>
                  ${E(-1,x,e=>this._scheduleTemp(e))}
                  <span style="font-size:24px;font-weight:600;min-width:60px;text-align:center">${x==null?`—`:`${tt(x)}${d}`}</span>
                  ${E(1,x,e=>this._scheduleTemp(e))}
                </div>
              `}
            </div>

            <!-- HVAC mode buttons -->
            ${ee.length?I`
              <div style="display:flex;flex-wrap:wrap;gap:6px;padding:12px 0;border-bottom:1px solid var(--border)">
                ${ee.map(t=>I`
                  <button class="btn" style="flex:1 0 28%;font-size:12px;text-transform:capitalize;${t===r?`outline:2px solid ${St(t)};color:${St(t)}`:``}"
                          @click=${()=>e.setThermostatMode(this._id,t)}>${t.replace(/_/g,` `)}</button>
                `)}
              </div>
            `:P}

            <!-- Fan / preset dropdowns -->
            ${w?I`
              <div style="display:flex;gap:10px;align-items:center;padding:8px 0">
                <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Fan</label>
                <select style="flex:1" .value=${String(i.fan_mode??``)}
                        @change=${t=>e.setThermostatFanMode(this._id,t.target.value)}>
                  ${w.map(e=>I`<option value=${e} ?selected=${e===i.fan_mode}>${e}</option>`)}
                </select>
              </div>
            `:P}
            ${T?I`
              <div style="display:flex;gap:10px;align-items:center;padding:8px 0">
                <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Preset</label>
                <select style="flex:1" .value=${String(i.preset_mode??``)}
                        @change=${t=>e.setThermostatPresetMode(this._id,t.target.value)}>
                  ${T.map(e=>I`<option value=${e} ?selected=${e===i.preset_mode}>${e}</option>`)}
                </select>
              </div>
            `:P}
          `:P}
        </div>
      </div>
    `}};k([R({attribute:!1})],Z.prototype,`planner`,void 0),k([F()],Z.prototype,`open`,void 0),k([F()],Z.prototype,`_id`,void 0),k([F()],Z.prototype,`_pend`,void 0),k([F()],Z.prototype,`_pendLo`,void 0),k([F()],Z.prototype,`_pendHi`,void 0),Z=k([L(`diorama-thermostat-modal`)],Z);var zi={"ga-high":`light single (high wing)`,"ga-low":`light single (low wing)`,"twin-prop":`light twin (piston)`,turboprop:`regional turboprop`,narrowbody:`narrowbody airliner`,widebody:`widebody airliner`,bizjet:`business / regional jet`,heli:`helicopter`},Bi={mainline:`MAINLINE`,lcc:`LOW-COST`,regional:`REGIONAL`,cargo:`CARGO`,intl:`INTERNATIONAL`,charter:`CHARTER`,fractional:`FRACTIONAL`,freight:`FREIGHT`,pia:`PRIVACY`},Vi={auto:`Automatic`,operator:`Operator`,airline:`Airline`,slogan:`Slogan`,callsign:`Callsign`,none:`None`},Hi={auto:`Automatic`,airline:`Airline`,slogan:`Slogan`,callsign:`Callsign`},Ui=class extends N{constructor(...e){super(...e),this.open=!1,this._hex=``,this._last=null,this._tick=()=>{this.open&&this.requestUpdate()}}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.planner.addEventListener(`config`,this._tick),this.planner.addEventListener(`live`,this._tick)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick),this.planner.removeEventListener(`live`,this._tick)}show(e){this._hex=String(e??``).toLowerCase(),this._last=this.planner.flightByHex(this._hex),this.open=!0}_row(e,t,n=!1){return t==null||t===``?P:I`
      <div style="display:flex;gap:12px;align-items:baseline;padding:5px 0;border-bottom:1px solid var(--border)">
        <span style="flex:0 0 108px;font-size:11px;color:var(--text-dim);text-transform:uppercase;
                     letter-spacing:0.04em">${e}</span>
        <span style="flex:1;font-size:14px;color:${n?`var(--text-dim)`:`var(--text)`};
                     word-break:break-word">${t}</span>
      </div>`}_chip(e,t){return I`<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;
                             font-weight:700;letter-spacing:0.06em;color:${t};
                             border:1px solid ${t};background:${t}1f">${e}</span>`}render(){if(!this.open)return P;let e=this.planner,t=e.flightByHex(this._hex);t&&(this._last=t);let n=this._last;if(!n)return P;let r=!t,i=e.store.flights?.privacyDim!==!1&&n.pia===!0,a=An(n.typeCode,n.category),o=i?n.hex.toUpperCase():(n.callsign??``).trim()||(n.reg??``).trim()||n.hex.toUpperCase(),s=n.vertRateFpm??0,c=s>=300?`↑`:s<=-300?`↓`:`→`,l=s>=300?`#69f0ae`:s<=-300?`#ffab40`:`var(--text-dim)`,u=e.flightsOrigin(),d=null;if(u){let{bearingRad:e,distNm:t}=ar(u.lat,u.lon,n.lat,n.lon),r=e*180/Math.PI;d=`${t.toFixed(1)} nm ${In(r)} (${Math.round(r)}°)`}else n.distNm!=null&&(d=`${n.distNm.toFixed(1)} nm`);let f=i?null:Hn(n.callsign),p=f?.kind===`pia`,m=f&&!p?f:null,h=i?null:Ft(n.callsign,f),g=i?null:mn(n.callsign),_=Wt(n.hex),v=[Fe(n)?this._chip(`EMERGENCY · ${String(n.emergency).toUpperCase()}`,`#ff5252`):null,n.military?this._chip(`MILITARY`,`#8bc34a`):null,n.interesting?this._chip(`INTERESTING`,`#ffd400`):null,n.ladd?this._chip(`LADD`,`#eceff1`):null,n.pia?this._chip(`PIA`,`#eceff1`):null].filter(Boolean);return I`
      <div class="modal-ov" @click=${e=>{e.target===e.currentTarget&&(this.open=!1)}}>
        <div class="modal" style="max-width:460px">
          <h3>Aircraft
            <button class="close" @click=${()=>this.open=!1}>✕</button>
          </h3>
          <div style="padding:10px 0 12px;border-bottom:1px solid var(--border)">
            <div style="font-size:30px;font-weight:700;letter-spacing:0.04em;line-height:1.1;
                        color:${r?`var(--text-dim)`:`var(--text)`}">${o}</div>
            <div style="font-size:11px;color:var(--text-dim);margin-top:3px;font-family:monospace">
              ${n.hex.toUpperCase()}</div>
            ${v.length?I`
              <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">${v}</div>`:P}
            ${i?I`
              <div style="font-size:11px;color:var(--text-dim);margin-top:8px;line-height:1.4">
                Identity anonymized (PIA) — this aircraft is flying under a temporary
                Privacy ICAO Address, so its registration and operator are withheld.
              </div>`:P}
            ${r?I`
              <div style="font-size:11px;color:#ffab40;margin-top:8px">
                Signal lost — showing the last received data.</div>`:P}
          </div>
          ${m?I`
            <div data-airline-block style="padding:8px 0;border-bottom:1px solid var(--border)">
              <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;
                          letter-spacing:0.06em;margin-bottom:4px">Airline</div>
              <div style="display:flex;gap:8px;align-items:center">
                ${m.colorPrimary?I`
                  <span data-airline-swatch title=${m.colorPrimary}
                        style="display:inline-block;width:14px;height:14px;border-radius:3px;
                               background:${m.colorPrimary};
                               border:1px solid rgba(255,255,255,0.35)"></span>`:P}
                ${m.colorSecondary?I`
                  <span data-airline-swatch title=${m.colorSecondary}
                        style="display:inline-block;width:14px;height:14px;border-radius:3px;
                               background:${m.colorSecondary};
                               border:1px solid rgba(255,255,255,0.35)"></span>`:P}
                <span style="flex:1;font-size:15px;font-weight:600;color:var(--text)">
                  ${m.name}</span>
                ${this._chip(Bi[m.kind]??m.kind,`#90caf9`)}
              </div>
              <div style="font-size:11px;color:var(--text-dim);margin-top:4px;line-height:1.5">
                ${m.shortName===m.name?P:I`<span>${m.shortName}</span> · `}
                <span style="font-family:monospace">${m.icao}</span>${m.iata?I` · <span style="font-family:monospace">IATA ${m.iata}</span>`:P}
                ${h?I`<br>spoken as “${h}”`:P}
                ${m.slogan?I`<br><em>“${m.slogan}”</em>`:P}
                ${m.operatesFor?I`<br>operates as ${m.operatesFor} — flies in its
                         mainline partner's livery, so no colours are shown.`:P}
              </div>
            </div>`:P}
          ${p?I`
            <div data-airline-block style="padding:8px 0;border-bottom:1px solid var(--border);
                        font-size:11px;color:var(--text-dim);line-height:1.5">
              <span style="color:var(--text)">${f.shortName}</span> is a privacy
              callsign — not a real airline. The prefix identifies the flight-planning
              service that issued this aircraft a temporary Privacy ICAO Address.
            </div>`:P}
          ${g||_?I`
            <div data-airline-block style="padding:8px 0;border-bottom:1px solid var(--border);
                        font-size:11px;color:var(--text-dim);line-height:1.5">
              ${g?I`
                <span style="color:var(--text);font-weight:600">${g.word}</span>
                — ${g.desc}${g.aircraft?I` (${g.aircraft})`:P}<br>`:P}
              ${_?I`Hex is in the US military range AE0000–AFFFFF (heuristic —
                a widely observed pattern, not an official allocation).`:P}
            </div>`:P}
          <div style="padding:4px 0">
            ${i?P:this._row(`Registration`,n.reg)}
            ${i?P:this._row(`Operator`,n.operator)}
            ${this._row(`Type`,n.typeCode?I`${n.typeCode}${n.typeDesc?I` <span style="color:var(--text-dim)">— ${n.typeDesc}</span>`:P}`:null)}
            ${this._row(`Model`,`${zi[a]??a}${n.category?` · category ${n.category}`:``}`)}
            ${this._row(`Altitude`,I`
              ${Math.round(n.altFt).toLocaleString(`en-US`)} ft
              <span style="color:${l}">${c}</span>`)}
            ${this._row(`Ground speed`,n.gsKt==null?null:`${Math.round(n.gsKt)} kt`)}
            ${this._row(`Vertical rate`,n.vertRateFpm==null?null:`${s>0?`+`:``}${Math.round(s).toLocaleString(`en-US`)} fpm`)}
            ${this._row(`Track`,n.trackDeg==null?null:`${Math.round(n.trackDeg)}° ${In(n.trackDeg)}`)}
            ${this._row(`Squawk`,n.squawk)}
            ${this._row(`From home`,d)}
            ${this._row(`Fix age`,n.seenPosS==null?null:`${n.seenPosS<1?`<1`:Math.round(n.seenPosS)} s ago`,!0)}
          </div>
          <div style="font-size:10px;color:var(--text-dim);line-height:1.4;padding-top:8px;
                      border-top:1px solid var(--border)">
            Altitude, speed and distance are the real reported values. The 3D sky
            positions aircraft on a compressed shell — true in bearing, not to scale.
          </div>
        </div>
      </div>
    `}};k([R({attribute:!1})],Ui.prototype,`planner`,void 0),k([F()],Ui.prototype,`open`,void 0),k([F()],Ui.prototype,`_hex`,void 0),Ui=k([L(`diorama-flight-modal`)],Ui);function Wi(e){if(!e)return`any aircraft`;let t=[];for(let[n,r]of[[`operator`,`operator`],[`typeCode`,`type`],[`typeDesc`,`desc`],[`reg`,`reg`],[`callsign`,`callsign`],[`category`,`cat`]]){let i=e[n];typeof i==`string`&&i&&t.push(`${r}=${i}`)}let n=(e,n,r,i)=>{e!=null&&n!=null?t.push(`${r} ${e}–${n} ${i}`):e==null?n!=null&&t.push(`${r} ≤ ${n} ${i}`):t.push(`${r} ≥ ${e} ${i}`)};n(e.minSpeedKt,e.maxSpeedKt,`speed`,`kt`),n(e.minAltFt,e.maxAltFt,`alt`,`ft`),n(e.minDistNm,e.maxDistNm,`dist`,`nm`);let r=[[e.military,`military`],[e.interesting,`noteworthy`],[e.ladd,`LADD`],[e.pia,`PIA`],[e.emergency,`emergency`]];for(let[e,n]of r)e===!0?t.push(n):e===!1&&t.push(`not ${n}`);return t.length?t.join(` · `):`any aircraft`}var Q=class extends N{constructor(...e){super(...e),this.open=!1,this._tab=`connection`,this._url=``,this._token=``,this._packErr=``,this._sh3dImportFurniture=!0,this._sh3dWarnings=[],this._sh3dBusy=!1,this._packExpanded=new Set,this._vehPackExpanded=new Set,this._glowRuleOpen=null,this._rebind=null,this._rebindMsg=``,this._tick=()=>{this.open&&this.requestUpdate()},this._onRebindKey=e=>{e.preventDefault(),e.stopPropagation();let t=this._rebind;if(!t)return;if(e.key===`Escape`){this._rebind=null,this._rebindMsg=``;return}if(Nt(e.key)){this._rebindMsg=`Press a key that is not a modifier.`;return}let n=$n(t,e.key,this.planner.keybinds);if(n){this._rebindMsg=`“${hn(e.key)}” is already used by ${Lt(n)?.label??n}.`;return}this.planner.setKeybind(t,Gt(e.key)),this._rebind=null,this._rebindMsg=``},this._addFloor=()=>{let e=this.planner,t=e.floor();e.saveFloorEdit(null,`Floor ${e.store.floors.length+1}`,t?.w??8e3,t?.d??6e3)},this._onSelectConfig=e=>{this.planner.switchConfig(e.target.value)},this._saveConfig=()=>{this.planner.saveConfigNow()},this._saveAsConfig=()=>{let e=prompt(`New configuration name:`,``);e!=null&&this.planner.saveConfigAs(e.trim()||`Untitled`)},this._newConfig=()=>{let e=prompt(`New configuration name:`,`Untitled`);e!=null&&this.planner.newConfig(e.trim()||`Untitled`)},this._renameConfig=()=>{let e=this.planner,t=e.listConfigs().find(t=>t.id===e.activeConfigId),n=prompt(`Rename configuration:`,t?.name??``);n==null||!n.trim()||e.renameConfig(e.activeConfigId,n.trim())},this._deleteConfig=()=>{let e=this.planner;if(e.listConfigs().length<=1)return;let t=e.listConfigs().find(t=>t.id===e.activeConfigId);confirm(`Delete configuration "${t?.name??e.activeConfigId}"? This cannot be undone.`)&&e.deleteConfig(e.activeConfigId)},this._exportConfig=async()=>{let e=await this.planner.exportConfig(),t=(e.name||`diorama`).replace(/[^a-z0-9-_]+/gi,`-`).replace(/^-+|-+$/g,``)||`diorama`,n=new Blob([JSON.stringify(e,null,2)],{type:`application/json`}),r=document.createElement(`a`);r.href=URL.createObjectURL(n),r.download=`${t}.diorama.json`,r.click(),URL.revokeObjectURL(r.href)},this._importConfig=()=>{let e=document.createElement(`input`);e.type=`file`,e.accept=`application/json,.json`,e.onchange=()=>{let t=e.files?.[0];if(!t)return;let n=new FileReader;n.onload=async()=>{let e=t.name.replace(/\.diorama\.json$|\.json$/i,``)||`Imported`,r=await this.planner.importConfig(n.result,e);r.ok||alert(`Import failed: `+(r.error??`unknown error`))},n.readAsText(t)},e.click()},this._importSh3d=()=>{let e=document.createElement(`input`);e.type=`file`,e.accept=`.sh3d,application/octet-stream`,e.onchange=async()=>{let t=e.files?.[0];if(t){this._sh3dBusy=!0;try{let{analyzeSh3dFile:e}=await gr(async()=>{let{analyzeSh3dFile:e}=await import(`./sh3d.js?v=mswkx4ak`);return{analyzeSh3dFile:e}},[],import.meta.url),n=await e(t,{importFurniture:this._sh3dImportFurniture});if(!n.ok||!n.floors||!n.counts){alert(`Import failed: `+(n.error??`unknown error`));return}let r=n.counts,i=`${t.name}: ${r.levels} level${r.levels===1?``:`s`}, ${r.walls} walls, ${r.rooms} rooms, ${r.openings} doors/windows`+(this._sh3dImportFurniture?`, ${r.furniture} furniture (${r.furnitureSkipped} skipped)`:``)+`

Create as a new configuration?`;if(!confirm(i))return;let a=n.name||t.name.replace(/\.sh3d$/i,``)||`Imported home`,o=await this.planner.importSh3dConfig(a,n.floors);if(!o.ok){alert(`Import failed: `+(o.error??`unknown error`));return}this._sh3dWarnings=n.warnings??[]}catch(e){alert(`Import failed: `+e.message)}finally{this._sh3dBusy=!1}}},e.click()},this._importPack=()=>{let e=document.createElement(`input`);e.type=`file`,e.accept=`application/json,.json`,e.onchange=()=>{let t=e.files?.[0];if(!t)return;let n=new FileReader;n.onload=async()=>{this._packErr=``;let e=await this.planner.importAvatarPack(n.result);e.ok||(this._packErr=`Import failed: `+(e.error??`unknown error`)),this.requestUpdate()},n.readAsText(t)},e.click()},this._saveConn=()=>{this._url&&localStorage.setItem(`diorama:url`,this._url),this._token&&localStorage.setItem(`diorama:token`,this._token),this.open=!1,location.reload()},this._clearConn=()=>{localStorage.removeItem(`diorama:url`),localStorage.removeItem(`diorama:token`),location.reload()},this._exitOffline=()=>{localStorage.removeItem(xr),this.open=!1,location.reload()}}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.planner.addEventListener(`config`,this._tick)}disconnectedCallback(){super.disconnectedCallback(),this.planner.removeEventListener(`config`,this._tick)}show(e){this._url=localStorage.getItem(`diorama:url`)||``,this._token=``,e&&(this._tab=e),this.open=!0}render(){if(!this.open)return P;let e=this.planner.uiMode===`edit`?[[`connection`,`Connection`],[`display`,`Display`],[`weather`,`Weather`],[`avatars`,`Avatars`],[`vehicles`,`Vehicles`],[`integrations`,`Integrations`],[`data`,`Floor Plan`]]:[[`connection`,`Connection`]],t=e.some(e=>e[0]===this._tab)?this._tab:`connection`;return I`
      <div style="position:absolute;top:0;right:0;bottom:0;width:min(560px,92vw);background:var(--surface);
                  border-left:1px solid var(--border);display:flex;flex-direction:column;z-index:10;
                  box-shadow:-4px 0 16px rgba(0,0,0,0.4)">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px">
          <h2 style="font-size:14px;margin:0">Settings</h2>
          <button style="background:none;border:none;color:var(--text-dim);font-size:18px;cursor:pointer"
                  @click=${()=>this.open=!1}>✕</button>
        </div>
        <div style="display:flex;gap:2px;padding:0 12px;border-bottom:1px solid var(--border);flex-wrap:wrap">
          ${e.map(([e,n])=>I`
            <button @click=${()=>this._tab=e}
                    style="background:none;border:none;border-bottom:2px solid ${t===e?`var(--accent)`:`transparent`};
                           color:${t===e?`var(--text)`:`var(--text-dim)`};
                           font-size:12px;padding:7px 10px;cursor:pointer">${n}</button>`)}
        </div>
        <div style="flex:1;overflow-y:auto;padding:16px">
          ${t===`connection`?this._connectionTab():P}
          ${t===`display`?this._displayTab():P}
          ${t===`weather`?this._weatherTab():P}
          ${t===`avatars`?this._avatarsTab():P}
          ${t===`vehicles`?this._vehiclesTab():P}
          ${t===`integrations`?this._integrationsTab():P}
          ${t===`data`?this._dataTab():P}
        </div>
        <div style="border-top:1px solid var(--border);padding:10px 16px;font-size:11px;color:var(--text-dim)"
             title="Diorama build version (from package.json)">
          Diorama v${`0.66.1`}
        </div>
      </div>
    `}_connectionTab(){return this.planner.isOffline?I`
        <div style="font-size:12px;color:var(--text);line-height:1.6;margin-bottom:14px">
          <strong>Offline mode</strong> — running with no Home Assistant.
          Configurations are stored in this browser. Device bindings show no
          live state, but unbound fixtures, roamers, demo avatars, and weather
          (via Open-Meteo) all work.
        </div>
        <button class="btn-primary" @click=${this._exitOffline}>Exit offline mode</button>
        ${this._aboutBlock()}
      `:I`
      <label style="font-size:11px;color:var(--text-dim);display:block;margin-bottom:3px">
        Home Assistant URL
      </label>
      <input type="url" .value=${this._url}
             @input=${e=>this._url=e.target.value}
             style="width:100%;padding:6px 8px;border-radius:4px;border:1px solid var(--border);
                    background:#111;color:var(--text);font-size:12px;margin-bottom:10px">
      <label style="font-size:11px;color:var(--text-dim);display:block;margin-bottom:3px">
        Access Token
      </label>
      <input type="password" placeholder="(stored)" .value=${this._token}
             @input=${e=>this._token=e.target.value}
             style="width:100%;padding:6px 8px;border-radius:4px;border:1px solid var(--border);
                    background:#111;color:var(--text);font-size:12px;margin-bottom:10px">
      <button class="btn-primary" style="margin-bottom:8px" @click=${this._saveConn}>
        Save &amp; Reconnect
      </button>
      <button class="danger-btn" @click=${this._clearConn}>Clear &amp; Log Out</button>
      ${this._aboutBlock()}
    `}_aboutBlock(){let e=(e,t)=>I`
      <a href=${e} target="_blank" rel="noreferrer"
         style="color:var(--accent);text-decoration:none">${t}</a>`;return I`
      <div style="border-top:1px solid var(--border);margin-top:18px;padding-top:12px">
        <strong style="font-size:12px;color:var(--text)">About Diorama</strong>
        <div style="font-size:11px;color:var(--text-dim);line-height:1.55;margin:6px 0 8px">
          Diorama is a graphical design interface for Home Assistant: build a
          virtual copy of your home, watch live device state in spatial
          context — presence radar, lights, appliances, weather, even aircraft
          overhead — and click anything to control it. First-class LD2450
          mmWave support; works with any HA entity.
        </div>
        <div style="font-size:11px;line-height:1.8">
          📖 ${e(`https://pwsh.github.io/diorama/`,`Documentation & user guide`)}
          — setup, features, floor-plan library, live demo<br>
          🐙 ${e(`https://github.com/pwsh/diorama`,`GitHub repository`)}
          — source, issue tracker<br>
          📋 ${e(`https://github.com/pwsh/diorama/releases`,`Changelog`)}
          — release notes for every version
        </div>
        ${this._recentReleases()}
      </div>`}_recentReleases(){let e=Ii.slice(0,10);return e.length?I`
      <div style="margin-top:10px">
        <strong style="font-size:11px;color:var(--text)">Recent releases</strong>
        <div style="max-height:190px;overflow-y:auto;border:1px solid var(--border);border-radius:5px;padding:8px 10px;margin-top:5px;background:rgba(0,0,0,0.18)">
          ${e.map(e=>I`
            <div style="margin-bottom:9px">
              <div style="font-size:11px;color:var(--text)">
                <strong>${e.version}</strong>
                <span style="color:var(--accent)"> — ${e.name}</span>
                <span style="color:var(--text-dim);font-size:10px"> · ${e.date}</span>
              </div>
              <ul style="margin:2px 0 0;padding-left:16px">
                ${e.notes.map(e=>I`
                  <li style="font-size:10px;color:var(--text-dim);line-height:1.45">${e}</li>`)}
              </ul>
            </div>`)}
        </div>
      </div>`:P}_integrationsTab(){return I`
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
             title="When off, the Bermuda BLE tracking integration is neither scanned nor displayed. BLE proxy fixtures stay placeable.">
        <input type="checkbox" .checked=${this.planner.store.bermudaEnabled!==!1}
               @change=${e=>this._setBermudaEnabled(e.target.checked)}>
        <span style="flex:1">Bermuda BLE tracking</span>
      </label>
      ${this._alertsBlock()}
      ${this._mqttBlock()}
      ${this._neighborhoodBlock()}
      ${this._flightsBlock()}
    `}_flightsDemoBlock(e,t,n){let r=t.demo,i=tn(r),a=e.geoFit(),o=e.store.weather,s=a&&a.transform.quality!==`none`?`calibrated landmarks`:o&&typeof o.lat==`number`&&isFinite(o.lat)&&typeof o.lon==`number`&&isFinite(o.lon)?`your weather location`:`synthetic`,c=e.flightsOrigin()??Yt(r),l=(e,t,n)=>{let r=parseFloat(e);return e.trim()===``||!isFinite(r)?void 0:Math.max(t,Math.min(n,r))},u=(e,t)=>n(n=>{let r={...n.demo??{}},i=parseFloat(t);t.trim()===``||!isFinite(i)?(delete r.lat,delete r.lon):r[e]=e===`lat`?Math.max(-90,Math.min(90,i)):Math.max(-180,Math.min(180,i)),n.demo=r});return I`
      <div style="margin:0 0 8px 24px" data-flight-demo>
        <div style="font-size:10px;color:#fb8c00;line-height:1.4;margin-bottom:4px"
             data-flight-demo-warn>
          These aircraft are <strong>invented</strong>. Nothing is fetched and no
          Home Assistant connection is used — the fleet is generated here, in this
          browser, from the clock. Do not read it as real traffic.
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.4;margin-bottom:4px">
          A fixed cast flies circuits around your home so every part of the
          feature has something to show: airline liveries, military markings, a
          towed banner, an emergency squawk, privacy-flagged aircraft and each
          speed band. Two of them sit outside your search radius on purpose, so
          the radius filter is visibly doing something.
        </div>
        <div class="row" style="align-items:center">
          <label style="font-size:12px;color:var(--text);flex:1"
                 title="How many of the cast to generate, in roster order. Some may still fall outside your search radius.">Aircraft</label>
          <input type="number" min="1" max=${String(kn)} step="1"
                 data-flight-demo-fleet
                 .value=${String(i)}
                 @change=${e=>n(t=>{let n=l(e.target.value,1,kn);t.demo={...t.demo??{},fleet:n??Tt}})}
                 style="width:80px">
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text);margin:2px 0">
          <input type="checkbox" data-flight-demo-emerg
                 .checked=${r?.emergency!==!1}
                 @change=${e=>n(t=>{t.demo={...t.demo??{},emergency:e.target.checked}})}>
          <span style="flex:1">Include an emergency aircraft
            <span style="display:block;color:var(--text-dim);font-size:10px;line-height:1.35">
              Squawking 7700 — red beacon, and a standing entry in the Alert Center
              for as long as it is in range. Turn it off for a quiet showcase.</span></span>
        </label>
        <div class="row" style="align-items:center">
          <label style="font-size:12px;color:var(--text);flex:1"
                 title="Rearranges the same cast deterministically. The same seed always gives the same arrangement.">Arrangement seed</label>
          <input type="number" step="1" placeholder="0" data-flight-demo-seed
                 .value=${r?.seed==null?``:String(r.seed)}
                 @change=${e=>n(t=>{let n=e.target.value.trim(),r=parseInt(n,10);t.demo={...t.demo??{},seed:n===``||!isFinite(r)?0:r}})}
                 style="width:80px">
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.4;margin-top:4px"
             data-flight-demo-origin>
          Centred on <code>${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}</code>
          — ${s===`synthetic`?I`a <strong>synthetic location</strong>, because no real one is
                     configured. The aircraft look identical wherever this is
                     (they are drawn by bearing and distance from home); it only
                     decides where the ISS is computed to be.`:I`taken from ${s}.`}
        </div>
        ${s===`synthetic`?I`
          <div class="row" style="align-items:center">
            <label style="font-size:12px;color:var(--text);flex:1">Synthetic location</label>
            <input type="number" step="0.0001" placeholder="lat" data-flight-demo-lat
                   .value=${r?.lat==null?``:String(r.lat)}
                   @change=${e=>u(`lat`,e.target.value)}
                   style="width:80px">
            <input type="number" step="0.0001" placeholder="lon" data-flight-demo-lon
                   .value=${r?.lon==null?``:String(r.lon)}
                   @change=${e=>u(`lon`,e.target.value)}
                   style="width:80px">
          </div>`:P}
      </div>`}_flightsBlock(){let e=this.planner,t=e.store.flights??{},n=t.enabled===!0,r=l(t.source),i=t=>e.setFlights(t),a=e.isOffline,o=e.flightsStatus,s=e.flightsAt?Math.max(0,Math.round((Date.now()-e.flightsAt)/1e3)):null,c=o===`off`?I`<span style="color:var(--text-dim)">disabled</span>`:o===`no-origin`?I`<span style="color:#fb8c00">needs a location — calibrate a GPS landmark or set a weather location</span>`:o===`needs-ha`?I`<span style="color:#fb8c00" data-flight-needs-ha>needs a Home Assistant connection</span>`:o===`needs-proxy`?I`<span style="color:#fb8c00" data-flight-needs-proxy>needs the Home Assistant proxy below</span>`:o===`error`?I`<span style="color:#ff5252">${r===`cloud`?`airplanes.live refused the request`:Se(r)||r===`local`&&nt(t.proxyCommand)?`the rest_command call failed — check the name and that HA was restarted`:`fetch failing — check source settings`}</span>`:I`<span style="color:#69f0ae">${e.flightsNow?.length??0} aircraft${s===null?``:` · updated ${s}s ago`}</span>`,u=nt(t.proxyCommand),d=zt[r]??`diorama_flights`,f=()=>I`
      <div style="margin:0 0 8px 24px;font-size:10px;color:#fb8c00;line-height:1.4"
           data-flight-offline-ha>
        Offline — there is no Home Assistant to fetch this feed for you, so live
        aircraft are unavailable. The ISS still works offline (it comes from a
        separate feed the browser can call directly). For a sky with aircraft in
        it right now, choose <strong>Demo (synthetic traffic)</strong> below — or
        <strong>Local receiver</strong> if you run your own ADS-B receiver on this
        network.
      </div>`,p=n=>{if(a)return f();let o=pn(r,t.proxyCommand,e.flightsOrigin(),t.radiusNm??15,t.localUrl);return I`
        <div style="margin:0 0 8px 24px" data-flight-proxy>
          <div style="font-size:10px;color:var(--text-dim);line-height:1.4;margin-bottom:4px">
            ${n?.intro??I`Your browser cannot call this feed directly (it sends no usable CORS
            header), so Home Assistant fetches it. Paste this into
            <code>configuration.yaml</code>, restart HA, then enter the service name.`}
          </div>
          <pre data-flight-yaml style="margin:0 0 4px;padding:6px 7px;border-radius:4px;border:1px solid var(--border);
                      background:#0b0e12;color:var(--text);font-size:10px;line-height:1.4;
                      white-space:pre;overflow:auto;max-height:190px;user-select:text">${o}</pre>
          <div class="row" style="align-items:center;gap:6px;margin-bottom:4px">
            <button class="btn" data-flight-yaml-copy
                    @click=${()=>{navigator.clipboard?.writeText(o)}}>⧉ Copy YAML</button>
          </div>
          <div class="row" style="align-items:center;gap:6px">
            <label style="font-size:12px;color:var(--text);flex:0 0 auto">Service name</label>
            <input type="text" data-flight-proxy-name placeholder=${d}
                   .value=${u??``}
                   @change=${e=>i(t=>{t.proxyCommand=e.target.value.trim()||void 0})}
                   style="flex:1;min-width:0;padding:5px 7px;border-radius:4px;
                          border:1px solid ${u?`var(--border)`:`#fb8c00`};
                          background:#111;color:var(--text);font-size:12px;box-sizing:border-box">
            ${u===d?P:I`<button class="btn" data-flight-proxy-fill
              @click=${()=>i(e=>{e.proxyCommand=d})}>Use ${d}</button>`}
          </div>
          ${u?P:I`
            <div style="font-size:10px;color:${n?.optional?`var(--text-dim)`:`#fb8c00`};margin-top:3px;line-height:1.35">
              ${n?.optional?I`Leave this empty to keep fetching the receiver straight from the
                   browser. Fill it in to route through Home Assistant instead.`:I`Not configured — nothing is being fetched. Enter the
                   <code>rest_command</code> service name (no <code>rest_command.</code> prefix).`}
            </div>`}
          ${n?.optional&&u?I`
            <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.35">
              Each poll now costs a Home Assistant service round-trip. Clear this
              field to go back to fetching the receiver directly.
            </div>`:P}
          ${r===`opensky`?I`
            <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.35">
              OpenSky meters access in credits — about 400/day anonymous, 4000/day
              with an account (1–4 per request). At the 60 s default that is
              ~1,440 requests/day: add the credentials commented in the YAML, or
              raise the poll interval.
            </div>`:P}
        </div>`},m=t.localUrl??``,h=typeof window<`u`&&window.location?.protocol===`https:`&&/^http:\/\//i.test(m.trim()),g=(e,t,n)=>I`
      <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;font-size:12px;color:var(--text);margin:4px 0"
             data-flight-source=${e}>
        <input type="radio" name="flightsource" .checked=${r===e}
               @change=${()=>i(t=>{t.source=e})}>
        <span style="flex:1"><span>${t}</span>
          <span style="display:block;color:var(--text-dim);font-size:10px;line-height:1.35">${n}</span></span>
      </label>`,_=(e,t,n)=>{let r=parseFloat(e);return e.trim()===``||!isFinite(r)?void 0:Math.max(t,Math.min(n,r))};return I`
      <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:2px">
          <strong style="font-size:12px;color:var(--text)">Flight tracking</strong>
          <span style="font-size:10px;text-align:right">${c}</span>
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.4;margin-bottom:6px">
          Live aircraft overhead (ADS-B) and the ISS, drawn into the 3D sky on a
          compressed display shell — positions are true in bearing, not to scale.
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)">
          <input type="checkbox" .checked=${n}
                 @change=${e=>i(t=>{t.enabled=e.target.checked})}>
          <span style="flex:1">Show aircraft &amp; satellites</span>
        </label>
        ${n?I`
          <div style="margin:6px 0 0 8px;display:flex;flex-direction:column;gap:2px">
            ${g(`opensky`,`OpenSky Network (recommended)`,`Fetched by Home Assistant through a rest_command you add below. Free and keyless, but rate-limited — an OpenSky account raises the allowance.`)}
            ${r===`opensky`?p():P}
            ${g(`adsblol`,`adsb.lol`,`Community ADS-B feed, also fetched by Home Assistant through a rest_command. Carries registrations, types and operators, which OpenSky does not.`)}
            ${r===`adsblol`?p():P}
            ${g(`cloud`,`Cloud (airplanes.live) — feeders only`,`Closed to the public since 2026-08: access requires feeding your own receiver’s ADS-B data to them. Keep this only if you already have access.`)}
            ${r===`cloud`?I`
              <div style="margin:0 0 6px 24px;font-size:10px;color:#fb8c00;line-height:1.35"
                   data-flight-cloud-warn>
                airplanes.live answers <code>HTTP 403</code> unless you feed them
                data from your own ADS-B receiver. If you do, <b>Local receiver
                (LAN)</b> below is the better source: it is your own data, fewer
                hops, and the aircraft payload never goes through Home Assistant.
                Otherwise use OpenSky above.
              </div>`:P}
            ${g(`local`,`Local receiver (LAN)`,`Your own dump1090 / readsb / tar1090 aircraft.json — freshest, no third party.`)}
            ${r===`local`?I`
              <div style="margin:0 0 6px 24px">
                <input type="text" placeholder="http://192.0.2.10/tar1090/data/aircraft.json"
                       .value=${m}
                       @change=${e=>i(t=>{t.localUrl=e.target.value.trim()||void 0})}
                       style="width:100%;padding:5px 7px;border-radius:4px;border:1px solid ${h?`#fb8c00`:`var(--border)`};background:#111;color:var(--text);font-size:12px;box-sizing:border-box">
                <div style="font-size:10px;color:var(--text-dim);margin-top:2px;line-height:1.35"
                     data-flight-local-cors>
                  To fetch this straight from the browser, the receiver must send an
                  <code>Access-Control-Allow-Origin</code> header on
                  <code>aircraft.json</code> — it does not by default. Or route it
                  through Home Assistant with the block below, which needs no
                  receiver changes.
                </div>
                ${h?I`
                  <div style="font-size:10px;color:#fb8c00;margin-top:3px;line-height:1.35"
                       data-flight-local-mixed>
                    An HTTPS panel cannot fetch an HTTP receiver directly. Route it
                    through Home Assistant with the block below.
                  </div>`:P}
              </div>
              ${a?I`
                <div style="margin:0 0 8px 24px;font-size:10px;color:var(--text-dim);line-height:1.4"
                     data-flight-local-offline>
                  Offline — there is no Home Assistant to fetch the receiver for you, so
                  the browser fetches it directly. That is the one aircraft source that
                  works without Home Assistant, but it needs the header above, and an
                  HTTP receiver needs this panel served over HTTP too.
                </div>`:p({optional:!0,intro:I`Optional: have Home Assistant fetch the receiver instead of the
                  browser. This needs no CORS header on the receiver and works from an
                  HTTPS panel. Paste this into <code>configuration.yaml</code>, restart
                  HA, then enter the service name. Home Assistant itself must be able to
                  reach the receiver (it can on normal Docker bridge networking).`})}`:P}
            ${g(`entity`,`Home Assistant entity`,`Any HA sensor whose attributes carry an aircraft array under aircraft, ac or flights — typically a REST sensor you already have. Home Assistant does the fetching, so no CORS applies.`)}
            ${r===`entity`&&a?f():P}
            ${r===`entity`?I`
              <div class="row" style="align-items:center;margin:0 0 6px 24px">
                <span style="flex:1;font-size:11px;color:${t.entityId?`var(--text)`:`var(--text-dim)`};
                             overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  ${t.entityId??`not bound`}</span>
                <button class="btn" @click=${()=>this._pickFlightsEntity()}>🔗</button>
                ${t.entityId?I`<button class="btn"
                  @click=${()=>i(e=>{e.entityId=void 0})}>✕</button>`:P}
              </div>`:P}
            ${g(`demo`,`Demo (synthetic traffic)`,`Invented aircraft, generated in this browser from the clock. No network, no Home Assistant, no receiver — the only source that works offline. Not real traffic.`)}
            ${r===`demo`?this._flightsDemoBlock(e,t,i):P}

            <div class="row" style="align-items:center;margin-top:4px">
              <label style="font-size:12px;color:var(--text);flex:1" title="Search + display radius around home.">Radius (nm)</label>
              <input type="number" min="5" max="100" step="5" .value=${String(t.radiusNm??15)}
                     @change=${e=>i(t=>{t.radiusNm=_(e.target.value,5,100)??15})}
                     style="width:80px">
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1" title="How far out, in scene metres, an aircraft sitting at exactly the search radius is drawn. The whole shell scales together — models grow with it, so apparent sizes stay the same.">Draw radius (m)</label>
              <input type="number" min="60" max="1000" step="10"
                     .value=${String(t.shellRadiusM??300)}
                     @change=${e=>i(t=>{t.shellRadiusM=_(e.target.value,60,1e3)??300})}
                     style="width:80px">
            </div>
            <div style="font-size:10px;color:var(--text-dim);margin:-2px 0 4px;line-height:1.35">
              Scene distance the search radius maps onto — larger spreads traffic deeper toward the horizon.
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1"
                     title="Multiplies the display HEIGHT only (0.2–2, default 1). The horizontal shell is untouched, so traffic drops toward the horizon without moving any closer to the house. Aircraft can never be lowered onto the property — an absolute clearance floor is applied after the scale.">Height scale ×</label>
              <input type="number" min="0.2" max="2" step="0.1"
                     .value=${String(t.verticalScale??1)}
                     @change=${e=>i(t=>{let n=Number(e.target.value);t.verticalScale=isFinite(n)?n:1})}
                     style="width:80px">
            </div>
            <div style="font-size:10px;color:var(--text-dim);margin:-2px 0 4px;line-height:1.35">
              Lower high-altitude traffic without bringing it closer.
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1" title="Poll cadence. The default is source-aware: 60 s for OpenSky (which meters access in credits), 8 s otherwise.">Poll (s)</label>
              <input type="number" min="5" max="60" step="1"
                     .value=${String(t.pollSeconds??hr(r))}
                     @change=${e=>i(t=>{t.pollSeconds=_(e.target.value,5,60)??hr(r)})}
                     style="width:80px">
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1" title="Blank = no filter.">Min altitude (ft)</label>
              <input type="number" min="0" max="60000" step="500" placeholder="off"
                     .value=${t.minAltFt==null?``:String(t.minAltFt)}
                     @change=${e=>i(t=>{t.minAltFt=_(e.target.value,0,6e4)})}
                     style="width:80px">
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1" title="Blank = no filter.">Max altitude (ft)</label>
              <input type="number" min="0" max="60000" step="500" placeholder="off"
                     .value=${t.maxAltFt==null?``:String(t.maxAltFt)}
                     @change=${e=>i(t=>{t.maxAltFt=_(e.target.value,0,6e4)})}
                     style="width:80px">
            </div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text);margin-top:4px">
              <input type="checkbox" .checked=${t.showLabels!==!1}
                     @change=${e=>i(t=>{t.showLabels=e.target.checked})}>
              <span style="flex:1">Callsign labels</span>
            </label>
            ${t.showLabels===!1?P:I`
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text);margin-left:22px"
                     title="A light piston single with a callsign tows a broadside banner instead of a label plate. Charming over a quiet field, busy over a dense one.">
                <input type="checkbox" .checked=${t.banners!==!1}
                       @change=${e=>i(t=>{t.banners=e.target.checked})}>
                <span style="flex:1">Tow banners (small planes)</span>
              </label>`}
            ${t.showLabels===!1?P:this._flightLabelFieldsRow(t,i)}
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="A flashing bead on the fuselage: red = emergency, yellow = flagged noteworthy by the data source, green = military, white = LADD (an FAA privacy program).">
              <input type="checkbox" .checked=${t.beacons!==!1}
                     @change=${e=>i(t=>{t.beacons=e.target.checked})}>
              <span style="flex:1">Status beacons</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="Aircraft that really are an F-16, F-22, A-10, B-2, B-52 or Apache (by type designator, fighter category or a military rotorcraft flag) are drawn with that silhouette instead of the generic model, scaled to the same size. Off keeps every aircraft on the generic body.">
              <input type="checkbox" .checked=${t.militarySkins!==!1}
                     @change=${e=>i(t=>{t.militarySkins=e.target.checked})}>
              <span style="flex:1">Military aircraft skins</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="Aircraft whose callsign prefix identifies a known airline (DAL = Delta, BAW = British Airways …) are painted in that carrier's approximate brand colours. Military aircraft keep olive drab, privacy-flagged (PIA) aircraft show no airline at all, and regionals — which fly in their mainline partner's paint — keep the generic livery.">
              <input type="checkbox" .checked=${t.airlineColors!==!1}
                     @change=${e=>i(t=>{t.airlineColors=e.target.checked})}>
              <span style="flex:1">Airline liveries</span>
            </label>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1"
                     title="What is painted down the aircraft's own flanks. Automatic keeps the shipped livery layout: the operator broadside on a large fuselage, the identifier along the spine. A privacy-flagged (PIA) aircraft withholds its identity whatever this is set to.">Fuselage text</label>
              <select .value=${t.sideText??`auto`}
                      @change=${e=>i(t=>{t.sideText=e.target.value})}
                      style="width:130px">
                ${qt.map(e=>I`
                  <option value=${e} ?selected=${(t.sideText??`auto`)===e}>
                    ${Vi[e]}</option>`)}
              </select>
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1"
                     title="What a small plane's towed banner says. Automatic is the aircraft's identifier (today's behavior).">Tow banner text</label>
              <select .value=${t.bannerText??`auto`}
                      @change=${e=>i(t=>{t.bannerText=e.target.value})}
                      style="width:130px">
                ${Gn.map(e=>I`
                  <option value=${e} ?selected=${(t.bannerText??`auto`)===e}>
                    ${Hi[e]}</option>`)}
              </select>
            </div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="Speed reads at a glance: a hovering machine shows a rotor blur and no trail, faster aircraft grow a comet tail, then a contrail, and the fastest add an afterburner glow with ghost multiples. Off builds none of it.">
              <input type="checkbox" .checked=${t.speedViz!==!1}
                     @change=${e=>i(t=>{t.speedViz=e.target.checked})}>
              <span style="flex:1">Speed effects</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="PIA / LADD are FAA privacy programs the ADS-B source deliberately does not enforce. Dim those aircraft (and hide a PIA aircraft's identity) as a courtesy — off shows everything in full.">
              <input type="checkbox" .checked=${t.privacyDim!==!1}
                     @change=${e=>i(t=>{t.privacyDim=e.target.checked})}>
              <span style="flex:1">Dim privacy-flagged aircraft</span>
            </label>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1"
                     title="Size multiplier for every aircraft model (0.5–4, default 1). Composed with the distance-compensated growth curve, so nearby and rim aircraft keep their relative sizes — this just makes the whole fleet read bigger from a zoomed-out camera.">Model size ×</label>
              <input type="number" min="0.5" max="4" step="0.1"
                     .value=${String(t.modelScale??1)}
                     @change=${e=>i(t=>{let n=Number(e.target.value);t.modelScale=isFinite(n)?n:1})}
                     style="width:80px">
            </div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)">
              <input type="checkbox" .checked=${t.iss!==!1}
                     @change=${e=>i(t=>{t.iss=e.target.checked})}>
              <span style="flex:1">Track the ISS</span>
            </label>

            ${this._flightGlowRulesBlock(t,i)}

            <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">
              <div style="font-size:11px;font-weight:600;margin-bottom:4px">Alerts</div>
              <div class="row" style="align-items:center">
                <label style="font-size:12px;color:var(--text);flex:1"
                       title="Warn when an aircraft passes below this altitude within 3 nm. Blank = off.">Low overflight (ft)</label>
                <input type="number" min="0" max="20000" step="250" placeholder="off"
                       .value=${t.alerts?.lowAltFt==null?``:String(t.alerts.lowAltFt)}
                       @change=${e=>i(t=>{t.alerts||(t.alerts={}),t.alerts.lowAltFt=_(e.target.value,0,2e4)})}
                       style="width:80px">
              </div>
              <label style="font-size:10px;color:var(--text-dim);display:block;margin:6px 0 2px">
                Watch list (callsign prefixes or hex codes, comma-separated)
              </label>
              <input type="text" placeholder="UAL, N12345, a1b2c3"
                     .value=${(t.alerts?.watch??[]).join(`, `)}
                     @change=${e=>i(t=>{t.alerts||(t.alerts={}),t.alerts.watch=e.target.value.split(`,`)})}
                     style="width:100%;padding:5px 7px;border-radius:4px;border:1px solid var(--border);
                            background:#111;color:var(--text);font-size:12px;box-sizing:border-box">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text);margin-top:6px"
                     title="Notify when the ISS rises above 10° — a live edge detector, not an advance prediction.">
                <input type="checkbox" .checked=${t.alerts?.issPass!==!1}
                       @change=${e=>i(t=>{t.alerts||(t.alerts={}),t.alerts.issPass=e.target.checked})}>
                <span style="flex:1">ISS pass alert</span>
              </label>
            </div>
          </div>`:P}
      </div>`}_flightLabelFieldsRow(e,t){let n=new Set(st(e.labelFields)??tr),r={callsign:`Callsign`,reg:`Registration`,type:`Type`,operator:`Operator`,airline:`Airline`,alt:`Altitude`,speed:`Speed`,trend:`Climb/descend`,squawk:`Squawk`,dist:`Distance`};return I`
      <div style="margin-top:6px">
        <label style="font-size:10px;color:var(--text-dim);display:block;margin-bottom:3px">
          Label fields
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
          ${_n.map(e=>I`
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;color:var(--text)">
              <input type="checkbox" .checked=${n.has(e)}
                     @change=${r=>t(t=>{let i=new Set(n);r.target.checked?i.add(e):i.delete(e);let a=_n.filter(e=>i.has(e));t.labelFields=a.length?[...a]:void 0})}>
              <span style="flex:1">${r[e]}</span>
            </label>`)}
        </div>
      </div>`}_flightGlowRulesBlock(e,t){let n=e.glowRules??[],r=e.beacons!==!1,i=e=>t(t=>{t.glowRules=e.length?e:void 0}),a=(e,t)=>i(n.map(n=>{if(n.id!==e)return n;let r={...n,criteria:{...n.criteria}};return t(r),r})),o=(e,t)=>{let r=e+t;if(r<0||r>=n.length)return;let a=n.slice();[a[e],a[r]]=[a[r],a[e]],i(a)},s={none:`No glow (mute)`,solid:`Solid (steady)`,flash:`Flash (1.2 Hz)`,strobe:`Strobe (double-flash)`,rotate:`Rotating beacon`,fade:`Fade (slow breathe)`,alternate:`Alternate (wig-wag)`},c=e=>e.trim()||void 0,l=(e,t,n)=>{let r=parseFloat(e);return e.trim()===``||!isFinite(r)?void 0:Math.max(t,Math.min(n,r))},u=e=>e?I`<span style="display:inline-block;width:9px;height:9px;border-radius:50%;
                          background:${e};border:1px solid rgba(255,255,255,0.35)"></span>`:P,d=(e,t,n,r)=>I`
      <div class="row" style="align-items:center;margin:0">
        <label style="font-size:11px;color:var(--text-dim);flex:1">${n}</label>
        <input type="text" data-glow-field=${t} placeholder=${r} .value=${e.criteria[t]??``}
               @change=${n=>a(e.id,e=>{e.criteria[t]=c(n.target.value)})}
               style="width:132px;padding:2px 5px;border-radius:3px;border:1px solid var(--border);
                      background:#111;color:var(--text);font-size:11px">
      </div>`,f=(e,t,n,r,i,o)=>I`
      <div class="row" style="align-items:center;margin:0">
        <label style="font-size:11px;color:var(--text-dim);flex:1">${r}</label>
        <input type="number" data-glow-field=${t} min="0" max=${i} step=${o} placeholder="min"
               .value=${e.criteria[t]==null?``:String(e.criteria[t])}
               @change=${n=>a(e.id,e=>{e.criteria[t]=l(n.target.value,0,i)})}
               style="width:62px">
        <input type="number" data-glow-field=${n} min="0" max=${i} step=${o} placeholder="max"
               .value=${e.criteria[n]==null?``:String(e.criteria[n])}
               @change=${t=>a(e.id,e=>{e.criteria[n]=l(t.target.value,0,i)})}
               style="width:62px;margin-left:4px">
      </div>`,p=(e,t,n,r)=>I`
      <div class="row" style="align-items:center;margin:0" title=${r??``}>
        <label style="font-size:11px;color:var(--text-dim);flex:1">${n}</label>
        <select data-glow-field=${t} style="width:80px;font-size:11px"
                @change=${n=>a(e.id,e=>{let r=n.target.value;e.criteria[t]=r===``?void 0:r===`yes`})}>
          <option value="" ?selected=${e.criteria[t]==null}>Any</option>
          <option value="yes" ?selected=${e.criteria[t]===!0}>Yes</option>
          <option value="no" ?selected=${e.criteria[t]===!1}>No</option>
        </select>
      </div>`;return I`
      <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">
        <div style="font-size:11px;font-weight:600;margin-bottom:2px">Glow rules</div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.4;margin-bottom:5px">
          Give matching aircraft their own glow colour and pattern. First match
          wins; anything unmatched keeps the default beacon above. Text fields
          accept <code>*</code> and <code>?</code> wildcards — plain text matches
          anywhere in the value.
          ${r?P:I`<span style="color:#fb8c00">
            Status beacons are off, so no glow renders at all right now.</span>`}
        </div>
        ${n.length===0?I`
          <div style="font-size:10px;color:var(--text-dim);font-style:italic;margin-bottom:4px">
            No rules — every aircraft uses the default beacon.
          </div>`:P}
        ${n.map((e,t)=>{let r=this._glowRuleOpen===e.id,l=e.enabled===!1;return I`
            <div data-glow-rule=${e.id}
                 style="border:1px solid var(--border);border-radius:4px;padding:4px 5px;margin-bottom:4px;
                        background:rgba(0,0,0,0.22);opacity:${l?.55:1}">
              <div style="display:flex;align-items:center;gap:5px">
                <span style="flex:1;font-size:11px;color:var(--text);overflow:hidden;
                             text-overflow:ellipsis;white-space:nowrap">
                  ${e.label||Wi(e.criteria)}
                </span>
                <span style="font-size:10px;color:var(--text-dim)">${e.pattern}</span>
                ${u(e.colorA)}${u(e.colorB)}
                ${l?I`<span style="font-size:9px;color:#fb8c00">[off]</span>`:P}
                <button class="btn" style="font-size:10px;padding:1px 4px" title="Move earlier"
                        ?disabled=${t===0} @click=${()=>o(t,-1)}>▲</button>
                <button class="btn" style="font-size:10px;padding:1px 4px" title="Move later"
                        ?disabled=${t===n.length-1} @click=${()=>o(t,1)}>▼</button>
                <button class="btn" style="font-size:10px;padding:1px 4px" title="Edit conditions"
                        @click=${()=>{this._glowRuleOpen=r?null:e.id}}>${r?`▾`:`✎`}</button>
                <button class="btn" style="font-size:10px;padding:1px 4px" title="Delete rule"
                        @click=${()=>{this._glowRuleOpen=null,i(n.filter(t=>t.id!==e.id))}}>✕</button>
              </div>
              ${r?I`
                <div style="margin-top:5px;padding-top:5px;border-top:1px solid var(--border);
                            display:flex;flex-direction:column;gap:3px">
                  <div class="row" style="align-items:center;margin:0">
                    <label style="font-size:11px;color:var(--text-dim);flex:1">Name</label>
                    <input type="text" data-glow-field="label" placeholder="optional" .value=${e.label??``}
                           @change=${t=>a(e.id,e=>{e.label=c(t.target.value)})}
                           style="width:132px;padding:2px 5px;border-radius:3px;border:1px solid var(--border);
                                  background:#111;color:var(--text);font-size:11px">
                  </div>
                  ${d(e,`operator`,`Operator`,`Southwest`)}
                  ${d(e,`typeCode`,`Type code`,`B73?`)}
                  ${d(e,`typeDesc`,`Type name`,`*MAX*`)}
                  ${d(e,`reg`,`Registration`,`N*`)}
                  ${d(e,`callsign`,`Callsign`,`SWA*`)}
                  ${d(e,`category`,`ADS-B category`,`A3`)}
                  ${f(e,`minSpeedKt`,`maxSpeedKt`,`Speed (kt)`,800,10)}
                  ${f(e,`minAltFt`,`maxAltFt`,`Altitude (ft)`,6e4,500)}
                  ${f(e,`minDistNm`,`maxDistNm`,`Distance (nm)`,500,1)}
                  ${p(e,`military`,`Military`)}
                  ${p(e,`interesting`,`Noteworthy`)}
                  ${p(e,`ladd`,`LADD`)}
                  ${p(e,`pia`,`PIA`)}
                  ${p(e,`emergency`,`Emergency`,`Aircraft squawking an emergency always show the red emergency beacon, whatever this condition says — kept for forward compatibility only.`)}
                  <div style="font-size:9px;color:var(--text-dim);line-height:1.35;margin:-1px 0 2px">
                    An emergency aircraft always keeps the red beacon, so an
                    “Emergency = Yes” condition can never fire.
                  </div>
                  <div class="row" style="align-items:center;margin:0">
                    <label style="font-size:11px;color:var(--text-dim);flex:1">Pattern</label>
                    <select data-glow-field="pattern" style="width:132px;font-size:11px"
                            @change=${t=>a(e.id,e=>{e.pattern=t.target.value,e.pattern!==`none`&&!e.colorA&&(e.colorA=`#ffd400`)})}>
                      ${Pt.map(t=>I`
                        <option value=${t} ?selected=${e.pattern===t}>${s[t]}</option>`)}
                    </select>
                  </div>
                  ${e.pattern===`none`?P:I`
                    <div class="row" style="align-items:center;margin:0">
                      <label style="font-size:11px;color:var(--text-dim);flex:1">Colours</label>
                      <input type="color" data-glow-field="colorA" style="width:34px;padding:0" .value=${e.colorA??`#ffd400`}
                             @change=${t=>a(e.id,e=>{e.colorA=t.target.value})}>
                      <input type="color" data-glow-field="colorB" style="width:34px;padding:0;margin-left:4px"
                             .value=${e.colorB??`#ffffff`}
                             @change=${t=>a(e.id,e=>{e.colorB=t.target.value})}>
                      ${e.colorB?I`<button class="btn" style="font-size:10px;padding:1px 4px;margin-left:3px"
                        title="Clear the second colour"
                        @click=${()=>a(e.id,e=>{e.colorB=void 0})}>✕</button>`:P}
                    </div>
                    <div style="font-size:9px;color:var(--text-dim);line-height:1.35">
                      ${e.pattern===`solid`?`Second colour tints the halo around the steady bead.`:`Second colour is optional — patterns cycle between the two when set.`}
                    </div>`}
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:11px;color:var(--text)">
                    <input type="checkbox" data-glow-field="enabled" .checked=${e.enabled!==!1}
                           @change=${t=>a(e.id,e=>{e.enabled=t.target.checked})}>
                    <span style="flex:1">Rule enabled</span>
                  </label>
                </div>`:P}
            </div>`})}
        <button class="btn" data-glow-add style="width:100%;font-size:10px"
                ?disabled=${n.length>=30}
                @click=${()=>{let e=`fgr_${Math.random().toString(36).slice(2,9)}`;i([...n,{id:e,criteria:{},pattern:`flash`,colorA:`#ffd400`}]),this._glowRuleOpen=e}}>
          + Add rule${n.length>=30?` (max 30)`:``}
        </button>
      </div>`}_pickFlightsEntity(){this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,onPick:e=>this.planner.setFlights(t=>{t.entityId=e})}}))}_neighborhoodBlock(){let e=this.planner,t=e.store.neighborhood??{},n=t.enabled===!0,r=t.source??`openfreemap`,i=t=>e.setNeighborhood(t),a=t.tileUrlTemplate??``,o=a.trim()===``||/^https?:\/\//i.test(a.trim());return I`
      <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px">
        <div style="font-size:12px;font-weight:600;margin-bottom:6px">Neighborhood (OpenFreeMap)</div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
               title="Fetch surrounding building/road map data from OpenFreeMap and align it to your calibrated GPS landmarks.">
          <input type="checkbox" .checked=${n}
                 @change=${e=>i(t=>{t.enabled=e.target.checked})}>
          <span style="flex:1">Show neighborhood overlay</span>
        </label>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.4;margin:4px 0 6px">
          Fetches map data for your address from OpenFreeMap (openfreemap.org), a free
          public service. Your address is sent to their servers as tile coordinates.
        </div>
        ${n?I`
          <div style="margin:6px 0 0 8px;display:flex;flex-direction:column;gap:6px">
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text)">Source</label>
              <select .value=${r}
                      @change=${e=>i(t=>{t.source=e.target.value})}>
                <option value="openfreemap">OpenFreeMap</option>
                <option value="custom">Custom tile URL</option>
              </select>
            </div>
            ${r===`custom`?I`
              <div>
                <label style="font-size:10px;color:var(--text-dim);display:block;margin-bottom:2px">Tile URL template ({z}/{x}/{y}.pbf)</label>
                <input type="text" placeholder="https://host/tiles/{z}/{x}/{y}.pbf" .value=${a}
                       @change=${e=>i(t=>{t.tileUrlTemplate=e.target.value.trim()||void 0})}
                       style="width:100%;padding:5px 7px;border-radius:4px;border:1px solid ${o?`var(--border)`:`#ff5252`};background:#111;color:var(--text);font-size:12px;box-sizing:border-box">
                ${o?I`<div style="font-size:10px;color:var(--text-dim);margin-top:2px">Self-hosted OpenFreeMap or a Protomaps/PMTiles extract. Data is still OSM/OpenMapTiles-derived (attribution still applies).</div>`:I`<div style="font-size:10px;color:#ff5252;margin-top:2px">Must start with http:// or https://</div>`}
              </div>`:P}
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text)" title="Fetch radius around your calibrated address (metres). Up to 3 km — the 3D camera widens its view distance to match.">Radius (m)</label>
              <input type="number" min="100" max="3000" step="50" .value=${String(t.radiusM??350)}
                     @change=${e=>i(t=>{let n=parseFloat(e.target.value);t.radiusM=isFinite(n)?Math.max(100,Math.min(3e3,n)):350})}
                     style="width:80px">
            </div>
            <div style="font-size:10px;color:var(--text-dim);line-height:1.35;margin-top:-2px">
              Larger radii fetch more tiles (the count grows with the area) — tiles are
              cached on this device for 30 days, and the 3D view automatically extends
              its camera range so distant buildings stay visible.
            </div>
            <button class="btn" style="align-self:flex-start" @click=${()=>{this.planner.clearNeighborhoodCache()}}>Clear tile cache</button>
            <div style="font-size:10px;color:var(--text-dim);line-height:1.35">
              Third-party fetch when enabled. Data: © OpenMapTiles · © OpenStreetMap
              contributors. Detailed layer / alignment controls live in the sidebar
              "Neighborhood" section.
            </div>
          </div>`:P}
      </div>`}_alertsBlock(){let e=this.planner,t=e.store.alerts??{},n=t.enabled!==!1,r=t=>e.setAlertsConfig(t);return I`
      <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px">
        <div style="font-size:12px;font-weight:600;margin-bottom:6px">Alert Center</div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
               title="The 🔔 topbar bell surfacing HA persistent notifications + Repairs issues.">
          <input type="checkbox" .checked=${n}
                 @change=${e=>r(t=>{t.enabled=e.target.checked?void 0:!1})}>
          <span style="flex:1">Enable Alert Center</span>
        </label>
        ${n?I`
          <div style="margin:6px 0 0 8px;display:flex;flex-direction:column;gap:5px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)">
              <input type="checkbox" .checked=${t.showPersistentNotifications!==!1}
                     @change=${e=>r(t=>{t.showPersistentNotifications=e.target.checked})}>
              <span style="flex:1">Persistent notifications</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="Requires an admin HA user; silently empty otherwise.">
              <input type="checkbox" .checked=${t.showRepairs!==!1}
                     @change=${e=>r(t=>{t.showRepairs=e.target.checked})}>
              <span style="flex:1">Repairs issues (admin)</span>
            </label>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text)">Min Repairs severity</label>
              <select .value=${t.minRepairSeverity??`warning`}
                      @change=${e=>r(t=>{t.minRepairSeverity=e.target.value})}>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="Off by default — Repairs / notification text can be instance-specific; opt in to show the bell on a shared kiosk/view screen.">
              <input type="checkbox" .checked=${t.showInKiosk===!0}
                     @change=${e=>r(t=>{t.showInKiosk=e.target.checked||void 0})}>
              <span style="flex:1">Show bell in kiosk / view mode</span>
            </label>
            <div style="font-size:10px;color:var(--text-dim);line-height:1.3">
              Place an <strong>Alert Beacon</strong> (🔔 tool) to pin a specific
              alert.* / binary_sensor to a room in the scene.
            </div>
          </div>`:P}
      </div>
    `}_mqttBlock(){let e=this.planner,t=e.store.mqttBridge??{},n=t.mode??`off`,r=e.mqttStatus,i={idle:`var(--text-dim)`,connecting:`#fdd835`,up:`#69f0ae`,error:`#ff5252`,unauthorized:`#fb8c00`},a={idle:`Idle`,connecting:`Connecting…`,up:`Connected`,error:`Error`,unauthorized:`Unauthorized (admin required)`},o=(e,t,r)=>I`
      <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;font-size:12px;color:var(--text);margin:4px 0">
        <input type="radio" name="mqttmode" .checked=${n===e}
               @change=${()=>this._setMqttMode(e)}>
        <span style="flex:1"><span>${t}</span>
          <span style="display:block;color:var(--text-dim);font-size:10px">${r}</span></span>
      </label>`,s=(e,t,n,r,i)=>I`
      <label style="font-size:10px;color:var(--text-dim);display:block;margin:6px 0 2px">${e}</label>
      <input type=${r} placeholder=${n} .value=${t}
             @change=${e=>i(e.target.value)}
             style="width:100%;padding:5px 7px;border-radius:4px;border:1px solid var(--border);
                    background:#111;color:var(--text);font-size:12px;box-sizing:border-box">`;return I`
      <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
          <strong style="font-size:12px;color:var(--text)">MQTT bridge</strong>
          <span style="font-size:10px;padding:2px 7px;border-radius:9px;
                       background:${i[r]}22;color:${i[r]}">
            ${a[r]??r}</span>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:6px">
          Reads spatial MQTT topics (Frigate boxes, Valetudo maps) not exposed over
          Home Assistant's normal API.
        </div>
        ${o(`off`,`Off`,`No MQTT bridge.`)}
        ${o(`ha-relay`,`Via Home Assistant (admin)`,`Rides HA's own connection — no extra credentials. Requires an ADMIN Home Assistant user.`)}
        ${o(`direct`,`Direct to broker`,`Connect straight to the MQTT broker over WebSocket. Use when the panel user is not an HA admin.`)}
        ${r===`unauthorized`?I`
          <div style="font-size:10px;color:#fb8c00;margin:4px 0;line-height:1.4">
            Home Assistant refused <code>mqtt/subscribe</code> — that command needs an
            admin user. Switch to <em>Direct to broker</em> instead.
          </div>`:P}
        ${n===`direct`?I`
          <div style="margin-top:6px;padding:8px;border:1px solid var(--border);border-radius:5px">
            ${s(`Broker host`,t.brokerHost??``,`homeassistant.local`,`text`,e=>this._setMqttField(t=>{t.brokerHost=e.trim()||void 0}))}
            <div style="display:flex;gap:8px;align-items:end">
              <div style="flex:1">
                ${s(`WebSocket port`,String(t.brokerPort??9001),`9001`,`number`,e=>this._setMqttField(t=>{let n=parseInt(e,10);t.brokerPort=isFinite(n)?n:void 0}))}
              </div>
              <label style="display:flex;gap:5px;align-items:center;font-size:11px;color:var(--text);padding-bottom:6px">
                <input type="checkbox" .checked=${t.useTls===!0}
                       @change=${e=>this._setMqttField(t=>{t.useTls=e.target.checked||void 0})}>
                TLS (wss)
              </label>
            </div>
            ${s(`Username`,this._mqttCred(`user`),`(optional)`,`text`,e=>this._setMqttCred(`user`,e))}
            ${s(`Password`,this._mqttCred(`pass`),`(optional)`,`password`,e=>this._setMqttCred(`pass`,e))}
            <div style="font-size:10px;color:var(--text-dim);margin-top:4px">
              🔒 Username &amp; password are stored on this device only (never synced to
              Home Assistant).
            </div>
          </div>`:P}
        ${n===`off`?P:I`
          <div style="margin-top:6px">
            ${s(`Frigate topic prefix`,t.frigateTopic??`frigate`,`frigate`,`text`,e=>this._setMqttField(t=>{t.frigateTopic=e.trim()||void 0}))}
            ${s(`Valetudo namespace`,t.valetudoNs??`valetudo`,`valetudo`,`text`,e=>this._setMqttField(t=>{t.valetudoNs=e.trim()||void 0}))}
            <button class="btn-primary" style="margin-top:8px"
                    @click=${()=>this.planner.restartMqtt()}>Test connection</button>
          </div>`}
      </div>`}_displayTab(){let e=this.planner,t=e.store.scene3d??{preset:`night`},n=t=>{e.store.scene3d||(e.store.scene3d={preset:`night`}),t(),e.save(),e.emitConfig()},r=(e,t,r,i=``)=>I`
      <div class="row"><label title=${i}>${e}</label>
        <input type="checkbox" .checked=${t}
               @change=${e=>n(()=>r(e.target.checked))}>
      </div>`;return I`
      <div class="row"><label>Mode</label>
        <select .value=${t.lightMode??`manual`}
                @change=${t=>n(()=>{e.store.scene3d.lightMode=t.target.value})}>
          <option value="manual">Manual preset</option>
          <option value="clock">Follow time of day</option>
          <option value="lux">Luminance sensor</option>
        </select>
      </div>
      ${(t.lightMode??`manual`)===`manual`?I`
        <div class="row"><label>Lighting</label>
          <select .value=${t.preset??`night`}
                  @change=${t=>n(()=>{e.store.scene3d.preset=t.target.value})}>
            <option value="night">Night (default)</option>
            <option value="day">Day</option>
            <option value="dusk">Dusk</option>
          </select>
        </div>
      `:P}
      ${(t.lightMode??`manual`)===`clock`?I`
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
          Uses HA's sun.sun elevation (falls back to local clock):
          day above 10°, dusk to −4°, night below.
        </div>
      `:P}
      ${(t.lightMode??`manual`)===`lux`?I`
        <div class="row"><label>Lux entity</label>
          <span style="font-size:10px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${t.luxEntity||`— pick one —`}
          </span>
          <button class="btn" style="font-size:10px;padding:2px 6px" @click=${()=>{this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,onPick:t=>n(()=>{e.store.scene3d.luxEntity=t})}}))}}>🔗</button>
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
          ≥3000 lx day · 300–3000 lx dusk · &lt;300 lx night.
        </div>
      `:P}
      <div class="row"><label>Floor color</label>
        <input type="color" .value=${t.floorColor??`#101820`}
               style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
               @input=${t=>n(()=>{e.store.scene3d.floorColor=t.target.value})}>
      </div>
      <div class="row"><label>Floor texture</label>
        <select .value=${t.floorTex??`none`}
                @change=${t=>n(()=>{e.store.scene3d.floorTex=t.target.value})}>
          <option value="none">None</option>
          <option value="wood">Wood</option>
          <option value="tile">Tile</option>
          <option value="concrete">Concrete</option>
        </select>
      </div>
      <div class="row"><label>Wall color</label>
        <input type="color" .value=${t.wallColor??`#bbbbbb`}
               style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
               @input=${t=>n(()=>{e.store.scene3d.wallColor=t.target.value})}>
      </div>
      <div class="row" title="Show all lengths and distances in feet / inches instead of millimetres. This is a synced store setting, not a per-device one.">
        <label>Imperial units</label>
        <input type="checkbox" data-imperial-toggle .checked=${!!e.store.imperial}
               @change=${t=>{e.store.imperial=t.target.checked,e.save(),e.emitConfig()}}>
      </div>
      <div class="row" title="Height of the SURROUNDINGS (backdrop grid, neighborhood overlay, yard fill) relative to the floor slab. Negative = ground below a raised foundation.">
        <label>Ground level (mm)</label>
        <input type="number" step="50" min="-10000" max="10000" style="width:80px"
               .value=${String(t.groundLevelMm??0)}
               @change=${t=>n(()=>{let n=Number(t.target.value),r=isFinite(n)?Math.max(-1e4,Math.min(1e4,Math.round(n))):0;e.store.scene3d.groundLevelMm=r===0?void 0:r})}>
      </div>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
        Surroundings relative to the floor slab — negative = ground below a raised foundation.
        The house, furniture and your own ground areas / terraces stay put.
      </div>
      ${r(`Glass house`,!!t.glassHouse,t=>{e.store.scene3d.glassHouse=t})}
      ${r(`Wall cutaway`,t.wallCutaway!==!1,t=>{e.store.scene3d.wallCutaway=t})}
      ${r(`Auto-follow camera`,!!t.autoFollow,t=>{e.store.scene3d.autoFollow=t})}
      ${r(`Cinematic orbit`,!!t.cinematicOrbit,t=>{e.store.scene3d.cinematicOrbit=t},`Slowly orbit the camera around the avatars for visual interest`)}
      ${r(`Plumbobs`,t.plumbobs!==!1,t=>{e.store.scene3d.plumbobs=t})}
      ${r(`Sky backdrop`,t.skyBackdrop??e.store.weather!=null,t=>{e.store.scene3d.skyBackdrop=t},`Gradient sky dome + sun / moon / stars behind the scene (default on when weather is configured)`)}
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div style="font-weight:600;font-size:11px;margin-bottom:4px">Input</div>
        <div class="row">
          <label title="Master switch for every single-key canvas shortcut: the tool keys (rebindable below), Delete / Backspace on the current selection, and the arrow-key furniture nudge. Turn OFF if tools switch or items vanish while you type — focus can silently fall back to the page body mid-edit. Ctrl/Cmd+Z undo, Ctrl/Cmd+0 reset view, Escape, Enter and the Space pan-hold keep working either way. Stored on this device only.">Keyboard shortcuts (tool hotkeys, Delete, arrows)</label>
          <input type="checkbox" data-hotkeys-toggle .checked=${e.hotkeysEnabled}
                 @change=${t=>e.setHotkeysEnabled(t.target.checked)}>
        </div>
        ${this._keybindRows()}
      </div>
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div style="font-weight:600;font-size:11px;margin-bottom:4px">Camera</div>
        ${r(`Lock pivot to plan centre`,a(t).locked,n=>{let r=a(t).free;n?delete e.store.scene3d.pivotLocked:e.store.scene3d.pivotLocked=!1,e.store.scene3d.freeMovement===void 0&&r&&(e.store.scene3d.freeMovement=!0)},`The camera always orbits the middle of the floor (or of the whole stack under glass house), so the view can never end up spinning around some off-centre point. Off: rotation pivots wherever the view was panned to.`)}
        ${r(`Free movement (pan)`,a(t).free,n=>{let r=a(t).locked;n?e.store.scene3d.freeMovement=!0:delete e.store.scene3d.freeMovement,e.store.scene3d.pivotLocked===void 0&&!r&&(e.store.scene3d.pivotLocked=!1)},`Pan the view side to side and forward/back (mouse pan button and two-finger touch). With the pivot locked you can still pan freely — rotation just keeps spinning around the plan centre.`)}
        ${r(`Allow orbiting below the horizon`,!!t.belowHorizon,t=>{e.store.scene3d.belowHorizon=t},`Let the camera drop below the horizon and look up at the floor from underneath`)}
        <div class="row"><label title="Vertical field of view in degrees (default 50)">Vertical FOV</label>
          <input type="range" min="10" max="120" step="1" style="flex:1"
                 .value=${String(t.fovV??50)}
                 @input=${t=>n(()=>{e.store.scene3d.fovV=Number(t.target.value)})}>
          <span style="width:34px;text-align:right;font-size:10px">${t.fovV??50}°</span>
        </div>
        ${r(`Custom horizontal FOV`,t.fovH!=null,n=>{e.store.scene3d.fovH=n?t.fovH??70:void 0},`Set the horizontal FOV independently of the vertical FOV`)}
        ${t.fovH==null?P:I`
          <div class="row"><label title="Horizontal field of view in degrees">Horizontal FOV</label>
            <input type="range" min="10" max="150" step="1" style="flex:1"
                   .value=${String(t.fovH??70)}
                   @input=${t=>n(()=>{e.store.scene3d.fovH=Number(t.target.value)})}>
            <span style="width:34px;text-align:right;font-size:10px">${t.fovH??70}°</span>
          </div>
          <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
            Independent H/V FOV renders a fixed frustum — the view may letterbox if the window shape differs.
          </div>
        `}
      </div>
      ${this._bgTextBlock()}
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div class="row" title="Show all dimensions in feet / inches instead of millimetres">
          <label>Imperial units</label>
          <input type="checkbox" .checked=${!!e.store.imperial}
                 @change=${t=>{e.store.imperial=t.target.checked,e.save(),e.emitConfig(),this.requestUpdate()}}>
        </div>
        <div class="row" title="Synthetic avatars (roamers + presence/demo AI) occasionally walk up to UNBOUND lights, switches and appliances and toggle them (session-only — never written to HA). Bound devices are only ever contemplated, never touched.">
          <label>Avatars use unbound devices</label>
          <input type="checkbox" .checked=${e.store.avatarInteractions!==!1}
                 @change=${t=>{e.store.avatarInteractions=t.target.checked,e.save(),e.emitConfig(),this.requestUpdate()}}>
        </div>
        <div class="row" title="Avatar rigs change into a situational outfit — pajamas when sleeping at night, a headband + shorts while exercising, an apron while working in the kitchen — with a brief sparkle on the swap. Per-person opt-out lives in the People section.">
          <label>Avatars change outfits</label>
          <input type="checkbox" .checked=${e.store.avatarCostumes!==!1}
                 @change=${t=>{e.store.avatarCostumes=t.target.checked,e.save(),e.emitConfig(),this.requestUpdate()}}>
        </div>
        <div class="row" title="Synthetic avatars (roamers + presence/demo AI) occasionally pick up and use a household object — vacuuming, sweeping, sipping a drink, reading a book — for a short session, then put it back. An umbrella also appears over ANY avatar (real or synthetic) standing outdoors in the rain.">
          <label>Avatars use props</label>
          <input type="checkbox" .checked=${e.store.avatarProps!==!1}
                 @change=${t=>{e.store.avatarProps=t.target.checked,e.save(),e.emitConfig(),this.requestUpdate()}}>
        </div>
        <div class="row" title="Show the bottom-right floor info readout (floor name, sensor + wall counts, floor dimensions) over the plan.">
          <label>Show floor info readout</label>
          <input type="checkbox" .checked=${e.store.showFloorStats!==!1}
                 @change=${t=>{e.store.showFloorStats=t.target.checked,e.save(),e.emitConfig(),this.requestUpdate()}}>
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:4px 0 0">
          Per-floor flooring / wall overrides live in the sidebar Floors section.
        </div>
      </div>
      ${this._compassBlock()}
      ${this._heatmapBlock()}
    `}_keybindRows(){let e=this.planner,t=(e,t)=>I`
      <span style="font:11px/1.4 ui-monospace,monospace;padding:1px 6px;border-radius:4px;
                   border:1px solid var(--border);min-width:52px;text-align:center;
                   color:${t?`var(--text-dim)`:`inherit`}">${e}</span>`;return I`
      <div style="margin-top:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div style="font-weight:600;font-size:11px">Keyboard shortcuts</div>
          <button class="btn-sm" title="Restore every shipped default key"
                  @click=${()=>{e.resetKeybinds(),this._rebind=null,this._rebindMsg=``}}>Reset all</button>
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
          Single-key canvas shortcuts. ✎ then press a key to rebind (Esc cancels); ✕ disables one.
          Ctrl/Cmd+Z, Ctrl/Cmd+0, Escape, Enter and the Space pan-hold are fixed and always work.
        </div>
        ${this._rebindMsg?I`<div style="font-size:10px;color:#ffb74d;margin:0 0 4px">${this._rebindMsg}</div>`:P}
        ${Wn.map(n=>{let r=Mn(n.action,e.keybinds),i=this._rebind===n.action;return I`
            <div class="row" data-keybind-row=${n.action}
                 style=${e.hotkeysEnabled?``:`opacity:0.5`}>
              <label>${n.label}</label>
              <span style="display:flex;align-items:center;gap:4px">
                ${i?t(`press a key…`,!0):t(hn(r),r==null)}
                <button class="btn-sm" title=${i?`Cancel`:`Rebind`}
                        data-keybind-capture=${n.action}
                        @keydown=${this._onRebindKey}
                        @click=${e=>{if(i){this._rebind=null,this._rebindMsg=``;return}this._rebind=n.action,this._rebindMsg=``,e.currentTarget.focus()}}>${i?`✕`:`✎`}</button>
                <button class="btn-sm" title="Disable this shortcut"
                        data-keybind-disable=${n.action}
                        ?disabled=${r==null}
                        @click=${()=>{e.setKeybind(n.action,null),this._rebind=null,this._rebindMsg=``}}>✕</button>
              </span>
            </div>`})}
      </div>`}_compassBlock(){let e=this.planner,t=e.store.compass,n=t=>{e.setCompass(t),this.requestUpdate()},r=t?.anchor??`tr`,i=!!t?.custom,a=e.geoFit(),o=a!=null&&a.transform.quality!==`none`,s=p(t,a),c=s.source===`landmarks`?`north from landmarks (quality ${a.transform.quality})`:s.source===`manual`?`manual ${((t?.manualNorthDeg??0)%360+360)%360}°`:`not set — plan up = north`,l=(e,t)=>I`
      <button title=${`Anchor `+e}
              style="padding:4px 0;font-size:13px;border-radius:3px;cursor:pointer;
                     background:${r===e&&!i?`var(--accent)`:`#1c2733`};
                     border:1px solid #33465a;color:var(--text)"
              @click=${()=>n(t=>{t.anchor=e,t.custom=void 0})}>${t}</button>`;return I`
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div class="row"><label>Compass</label></div>
        <div class="row"><label>Show compass</label>
          <input type="checkbox" .checked=${t?.show===!0}
                 @change=${e=>n(t=>{t.show=e.target.checked})}>
        </div>
        <div class="row"><label>North source</label>
          <select .value=${t?.source??`auto`}
                  @change=${e=>n(t=>{t.source=e.target.value})}>
            <option value="auto">Auto (landmarks)</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div class="row" style="opacity:${(t?.source??`auto`)===`auto`&&o?.5:1}">
          <label title="Compass bearing (° CW from true north) that plan-up (+Y) faces — the same convention as the GPS/Geo north setting">
            Manual bearing (°)</label>
          <input type="number" min="0" max="359.9" step="0.1" style="width:70px;text-align:right"
                 .value=${String(t?.manualNorthDeg??``)}
                 @change=${e=>{let t=parseFloat(e.target.value);n(e=>{e.manualNorthDeg=isFinite(t)?(t%360+360)%360:void 0})}}>
        </div>
        ${(t?.source??`auto`)===`auto`&&o?I`
          <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:0 0 4px">
            Landmark calibration is active — the manual bearing is only a fallback.
          </div>`:P}
        <div style="font-size:11px;padding:4px 8px;margin:2px 0 6px;
                    background:rgba(0,0,0,0.25);border-radius:4px">${c}</div>
        <div style="font-size:11px;margin-bottom:2px">Anchor</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-bottom:6px">
          ${l(`tl`,`↖`)}${l(`tm`,`↑`)}${l(`tr`,`↗`)}
          ${l(`bl`,`↙`)}${l(`bm`,`↓`)}${l(`br`,`↘`)}
        </div>
        <div class="row" style="gap:6px;margin-bottom:2px">
          <span style="font-size:11px">Custom offset (px)</span>
          <span style="color:var(--text-dim);font-size:11px">x</span>
          <input type="number" style="width:56px" .value=${String(t?.custom?.x??``)}
                 @change=${e=>{let t=Math.round(Number(e.target.value));n(e=>{e.custom={x:isFinite(t)?t:0,y:e.custom?.y??0}})}}>
          <span style="color:var(--text-dim);font-size:11px">y</span>
          <input type="number" style="width:56px" .value=${String(t?.custom?.y??``)}
                 @change=${e=>{let t=Math.round(Number(e.target.value));n(e=>{e.custom={x:e.custom?.x??0,y:isFinite(t)?t:0}})}}>
          ${i?I`<button class="btn" style="font-size:10px;padding:2px 6px"
                 @click=${()=>n(e=>{e.custom=void 0})}>Clear</button>`:P}
        </div>
        <div class="row"><label title="A small circled arrow + N just off the floor edge, in both 2D and 3D, where true north exits the plan">
          Show north icon on plan</label>
          <input type="checkbox" .checked=${t?.showNorthMarker===!0}
                 @change=${e=>n(t=>{t.showNorthMarker=e.target.checked})}>
        </div>
        <div class="row" title="North-icon size multiplier (0.5–4×)" style=${t?.showNorthMarker===!0?``:`opacity:0.5`}>
          <label>North icon size</label>
          <input type="number" min="0.5" max="4" step="0.1" style="width:64px"
                 ?disabled=${t?.showNorthMarker!==!0}
                 .value=${String(t?.markerScale??1)}
                 @change=${e=>{let t=Number(e.target.value);n(e=>{e.markerScale=isFinite(t)?Math.max(.5,Math.min(4,t)):1})}}>
        </div>
      </div>`}_heatmapBlock(){let e=this.planner,t=e.store.heatmap??{},n=!!e.store.imperial,r=t.comfortLo??20,i=t.comfortHi??24,a=e=>n?Math.round((e*9/5+32)*10)/10:e,o=e=>n?(e-32)*5/9:e,s=t=>{var n;t((n=e.store).heatmap??(n.heatmap={})),e.save(),e.emitConfig(),this.requestUpdate()},c=n?`°F`:`°C`,l=(e,t)=>I`
      <input type="number" step="0.5" .value=${String(a(e))}
             style="width:60px;text-align:right"
             @change=${e=>{let n=parseFloat(e.target.value);isFinite(n)&&t(o(n))}}>`;return I`
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div class="row"><label title="Rooms within this band read as comfortable; below → cool/cold blue, above → warm/hot red">
          Heat-map comfort band</label></div>
        <div class="row" style="gap:8px">
          <label style="flex:0 0 auto">Low (${c})</label>
          ${l(r,e=>s(t=>{t.comfortLo=e}))}
          <label style="flex:0 0 auto">High (${c})</label>
          ${l(i,e=>s(t=>{t.comfortHi=e}))}
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:4px 0 0">
          Per-room temperature heat-map (from placed temperature sensors). Turn it
          on in the sidebar Layers ▸ "Temperature heat-map".
        </div>
      </div>`}_bgTextBlock(){let e=this.planner,t=e.store.bgTexts??[],n=t=>{var n;(n=e.store).bgTexts??(n.bgTexts=[]),t(),e.save(),e.emitConfig(),this.requestUpdate()},r=[[`sky`,`Skywriting (sky)`],[`banner`,`Banner plane`],[`grass`,`Ground writing`],[`train`,`Message train`]],i=[[`Toy plane & airliners`,[[``,`Classic tow plane`],[`ga-high`,`Light single, high wing (Cessna)`],[`ga-low`,`Light single, low wing (Cirrus)`],[`twin-prop`,`Twin prop (King Air)`],[`turboprop`,`Regional turboprop (ATR / Dash 8)`],[`narrowbody`,`Airliner — narrowbody (737 / A320)`],[`widebody`,`Airliner — widebody (747 / 777)`],[`bizjet`,`Business jet (Learjet / CRJ)`],[`heli`,`Helicopter`]]],[`Military & NASA`,[[`f16`,`F-16 Fighting Falcon`],[`a10`,`A-10 Thunderbolt II`],[`f22`,`F-22 Raptor`],[`b2`,`B-2 Spirit (flying wing)`],[`b52`,`B-52 Stratofortress`],[`apache`,`AH-64 Apache`],[`shuttle`,`Space Shuttle orbiter`]]],[`Fiction`,[[`airwolf`,`Black attack helicopter`],[`batwing`,`Bat-winged jet`],[`trimaxion`,`Chrome explorer pod`],[`einstein_rocket`,`Little red rocket`],[`enterprise`,`Starship — classic`],[`enterprise_c`,`Starship — heavy cruiser`],[`xwing`,`X-wing fighter`],[`falcon`,`Freighter (disc hull)`],[`slave1`,`Bounty hunter pod`],[`naboo`,`Royal chrome starship`],[`serenity`,`Firefly transport`]]],[`News`,[[`news_chopper`,`News helicopter`]]]];for(let{def:e,models:t}of g()){let n=t.filter(e=>e.surfaces.includes(`banner`));n.length&&i.push([e.path.join(` ▸ `),n.map(e=>[e.id,e.label])])}let a=new Map(e.bgTextsResolved().map(e=>[e.id,e.text])),o=(e,t,r,i,a)=>I`
      <div class="row" style="margin-top:2px">
        <label title=${a}>${r}</label>
        <input type="color" style="width:44px;padding:0;height:22px"
               .value=${e[t]??i}
               @change=${r=>n(()=>{e[t]=r.target.value||void 0})}>
        ${e[t]?I`<button class="btn" style="font-size:10px;padding:2px 6px"
                         title="Use the default colour"
                         @click=${()=>n(()=>{e[t]=void 0})}>✕</button>`:I`<span style="font-size:10px;color:var(--text-dim)">default</span>`}
      </div>`,s={banner:{colorMain:`#dad7cf`,colorDetail:`#c94f3d`,bannerBg:`#c0281f`,bannerText:`#fff7e6`,bannerFrame:`#f5c400`},chopper:{colorMain:`#2f6fb0`,colorDetail:`#e6291a`,bannerBg:`#c0281f`,bannerText:`#fff7e6`,bannerFrame:`#f5c400`},train:{colorMain:`#8a2b2b`,colorDetail:`#24272b`,bannerBg:`#f5efe0`,bannerText:`#22303a`,bannerFrame:`#8a2b2b`}},c=e=>{if(e.mode!==`banner`&&e.mode!==`train`&&e.mode!==`chopper`)return P;let t=e.mode===`chopper`||e.aircraft===`news_chopper`,n=s[t?`chopper`:e.mode],r=e.mode===`banner`&&e.aircraft?fn(e.aircraft):null,i=r?{...n,colorMain:r.body??n.colorMain,colorDetail:r.accent??n.colorDetail}:n,a=e.mode===`train`,c=a?`car-side sign`:`towed banner`;return I`
        ${o(e,`colorMain`,`Vehicle color`,i.colorMain,a?`Body colour of the engine and the message cars.`:t?`Cabin colour of the news helicopter.`:`Fuselage colour of the tow plane (also applies to a chosen aircraft silhouette).`)}
        ${o(e,`colorDetail`,`Accent color`,i.colorDetail,a?`Trim colour — roof, chimney, cowcatcher, wheels — and the darker last car.`:t?`NEWS stripes and the tail boom.`:`Wing and tailplane colour (also the accent on a chosen aircraft silhouette).`)}
        ${o(e,`bannerBg`,`Banner background`,i.bannerBg,`Background of the ${c} the message is painted on.`)}
        ${o(e,`bannerText`,`Banner text color`,i.bannerText,`Lettering colour on the ${c}.`)}
        ${o(e,`bannerFrame`,`Banner frame`,i.bannerFrame,`Edge trim stripes framing the ${c}.`)}`},l=(t,o)=>{let s=a.get(t.id);return I`
        <div style="border:1px solid var(--border);border-radius:6px;padding:6px 8px;margin:0 0 6px">
          <div class="row">
            <select .value=${t.mode}
                    @change=${e=>n(()=>{t.mode=e.target.value})}>
              ${r.map(([e,n])=>I`<option value=${e} ?selected=${t.mode===e}>${n}</option>`)}
            </select>
            <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:auto"
                    title="Delete this background text"
                    @click=${()=>n(()=>{e.store.bgTexts.splice(o,1)})}>🗑</button>
          </div>
          <div class="row" style="margin-top:4px"><label>Message</label>
            <input type="text" placeholder="e.g. Welcome home!" maxlength=${t.mode===`grass`?160:40}
                   .value=${t.text??``} ?disabled=${!!t.entityId}
                   style="flex:1;min-width:0"
                   @change=${e=>n(()=>{t.text=e.target.value})}>
          </div>
          <div class="row" style="margin-top:2px"><label>Entity</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;
                         text-overflow:ellipsis;white-space:nowrap">${t.entityId||`—`}</span>
            <button class="btn" style="font-size:10px;padding:2px 6px" @click=${()=>{this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{onPick:e=>n(()=>{t.entityId=e})}}))}}>🔗</button>
            ${t.entityId?I`<button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                   title="Clear the bound entity (use the static message)"
                   @click=${()=>n(()=>{t.entityId=void 0})}>✕</button>`:P}
          </div>
          ${t.entityId?I`
            <div class="row" style="margin-top:2px;gap:4px">
              <input type="text" placeholder="prefix" title="Text before the value (e.g. $)"
                     style="width:64px" .value=${t.format?.prefix??``}
                     @change=${e=>n(()=>{(t.format??(t.format={})).prefix=e.target.value||void 0})}>
              <input type="text" placeholder="suffix" title="Text after the value (e.g. ' left')"
                     style="width:64px" .value=${t.format?.suffix??``}
                     @change=${e=>n(()=>{(t.format??(t.format={})).suffix=e.target.value||void 0})}>
              <label style="font-size:10px;color:var(--text-dim);display:flex;align-items:center;gap:3px;margin-left:auto"
                     title="Append the entity's unit (for numeric values)">
                <input type="checkbox" .checked=${t.format?.showUnit!==!1}
                       @change=${e=>n(()=>{(t.format??(t.format={})).showUnit=e.target.checked})}> unit
              </label>
            </div>`:P}
          ${t.mode===`train`?I`
            <div class="row" style="margin-top:2px"><label title="Cap on the number of message cars">Max cars</label>
              <input type="number" min="2" max="12" step="1" style="width:64px"
                     .value=${String(t.maxCars??8)}
                     @change=${e=>n(()=>{let n=Math.round(Number(e.target.value));t.maxCars=isFinite(n)?Math.min(12,Math.max(2,n)):8})}>
            </div>`:P}
          ${t.mode===`banner`?I`
            <div class="row" style="margin-top:2px">
              <label title="Which craft tows the banner. The airliner silhouettes are the same models the live flight tracker builds (civil paint, no beacons or lettering); the military, NASA and fiction craft are toy models built for the message. The news helicopter also flies its own profile — higher, tighter, the other way round, with the banner slung below.">Aircraft</label>
              <select style="flex:1;min-width:0"
                      @change=${e=>n(()=>{t.aircraft=e.target.value||void 0})}>
                ${i.map(([e,n])=>I`
                  <optgroup label=${e}>
                    ${n.map(([e,n])=>I`
                      <option value=${e} ?selected=${(t.aircraft??``)===e}>${n}</option>`)}
                  </optgroup>`)}
              </select>
            </div>`:P}
          <div class="row" style="margin-top:2px">
            <label title="Size multiplier for this entry's model (0.5–5, default 1). The flight path, train loop and text stay put — only the model gets bigger, which reads better from a zoomed-out camera.">Model size ×</label>
            <input type="number" min="0.5" max="5" step="0.1" style="width:64px"
                   .value=${String(t.scale??1)}
                   @change=${e=>n(()=>{let n=Number(e.target.value),r=isFinite(n)&&n>0?Math.min(5,Math.max(.5,n)):1;t.scale=r===1?void 0:r})}>
          </div>
          ${c(t)}
          ${t.mode===`grass`?I`
            <div class="row" style="margin-top:2px">
              <label title="Constrain the writing to a ground area: the text is clipped to that area's real shape and painted through its own surface material (else auto-placed in the widest open yard margin). Ground areas are per-floor — a choice on another floor falls back to auto here.">Fit to area</label>
              <select style="flex:1;min-width:0"
                      @change=${e=>n(()=>{t.grassAreaId=e.target.value||void 0})}>
                <option value="" ?selected=${!t.grassAreaId}>Auto (yard margin)</option>
                ${(e.floor().groundAreas??[]).map(e=>I`
                  <option value=${e.id} ?selected=${t.grassAreaId===e.id}>${e.name||e.kind} area</option>`)}
              </select>
            </div>
            <div class="row" style="margin-top:2px">
              <label title="Keep the writing turned toward the camera so it always reads like a page on the floor (the default). Uncheck to pin it to a fixed rotation instead.">Follow camera</label>
              <input type="checkbox" .checked=${t.faceCamera!==!1}
                     @change=${e=>n(()=>{e.target.checked?(t.faceCamera=void 0,t.rotationDeg=void 0):t.faceCamera=!1})}>
            </div>
            ${t.faceCamera===!1?I`
              <div class="row" style="margin-top:2px">
                <label title="Fixed rotation of the writing, in degrees. 0° puts the top of the text toward the top of the 2D plan; increasing values turn it clockwise on screen.">Rotation (°)</label>
                <input type="number" step="5" style="width:72px" placeholder="0"
                       .value=${t.rotationDeg==null?``:String(t.rotationDeg)}
                       @change=${e=>n(()=>{let n=e.target.value.trim(),r=Number(n);t.rotationDeg=n===``||!isFinite(r)?void 0:r})}>
              </div>`:P}`:P}
          <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:3px 0 0">
            ${t.entityId?I`Bound: the entity's state replaces the static message${s?I` — currently "<span style="color:var(--text)">${s}</span>"`:P}.`:`Bind an entity (e.g. an input_text helper) to show its live value instead.`}
          </div>
        </div>`},u=()=>`bt_`+Math.random().toString(36).slice(2,9);return I`
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div class="row"><label title="Short playful messages written into the 3D world"
                                style="font-weight:600">Background text</label></div>
        ${t.length?t.map((e,t)=>l(e,t)):I`<div style="font-size:10px;color:var(--text-dim);margin:0 0 6px">
                   None. Add a skywriter, banner plane, ground message, or message train.</div>`}
        <button class="btn" style="font-size:11px;padding:3px 8px" ?disabled=${t.length>=6}
                @click=${()=>n(()=>{e.store.bgTexts.push({id:u(),mode:`sky`})})}>
          + Add${t.length>=6?` (max 6)`:``}</button>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:4px 0 0">
          Up to 6. Skywriting and anything flying a banner hide during storms; ground writing + train stay.</div>
      </div>`}_weatherEffectToggles(e,t){let n=e?.effects3d!==!1,r=[[`precip`,`Precipitation`],[`fog`,`Fog`],[`lightning`,`Lightning`],[`wind`,`Wind dust & gusts`],[`clouds`,`Cloud shadows`],[`sunPosition`,`True sun position`],[`sunDisc`,`Sun disc`],[`frost`,`Frost & icicles`],[`puddles`,`Rain puddles`],[`precipForecast`,`Forecast storm-brewing`]],i=e=>!n&&e!==`sunPosition`&&e!==`sunDisc`;return I`
      <div style="margin:2px 0 2px 14px;display:flex;flex-direction:column;gap:1px">
        ${r.map(([n,r])=>I`
          <label class="row" style="padding:1px 0;${i(n)?`opacity:0.45`:``}">
            <span style="flex:1;font-size:11px">${r}</span>
            <input type="checkbox" .checked=${wt(e,n)}
                   ?disabled=${i(n)}
                   @change=${e=>t(t=>{(t.effects??(t.effects={}))[n]=e.target.checked})}>
          </label>`)}
      </div>`}_weatherAppearance(e,t){let n=e?.chipAnchor??`br`,r=!!e?.chipCustom,i=(e,i)=>I`
      <button title=${`Anchor `+e}
              style="padding:4px 0;font-size:13px;border-radius:3px;cursor:pointer;
                     background:${n===e&&!r?`var(--accent)`:`#1c2733`};
                     border:1px solid #33465a;color:var(--text)"
              @click=${()=>t(t=>{t.chipAnchor=e,t.chipCustom=void 0})}>${i}</button>`,a=(n,r)=>I`
      <label class="row" style="padding:1px 0"><span style="flex:1;font-size:11px">${n}</span>
        <input type="checkbox" .checked=${e?.chipContent?.[r]===!0}
               @change=${e=>t(t=>{(t.chipContent??(t.chipContent={}))[r]=e.target.checked})}></label>`,o=(n,r,i)=>I`
      <label class="row" style="padding:1px 0"><span style="flex:1;font-size:11px">${n}</span>
        <input type="number" min="0" max=${i} style="width:56px"
               .value=${String(e?.chipContent?.[r]??0)}
               @change=${e=>{let n=Math.floor(Number(e.target.value)),a=Math.max(0,Math.min(i,isFinite(n)?n:0));t(e=>{(e.chipContent??(e.chipContent={}))[r]=a})}}></label>`;return I`
      <h4 style="font-size:11px;margin:12px 0 4px;color:var(--text-dim)">Chip appearance</h4>
      <div style="font-size:11px;margin-bottom:2px">Anchor</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-bottom:6px">
        ${i(`tl`,`↖`)}${i(`tm`,`↑`)}${i(`tr`,`↗`)}
        ${i(`bl`,`↙`)}${i(`bm`,`↓`)}${i(`br`,`↘`)}
      </div>
      <div class="row" style="gap:6px;margin-bottom:2px">
        <span style="font-size:11px">Custom offset (px)</span>
        <span style="color:var(--text-dim);font-size:11px">x</span>
        <input type="number" style="width:56px" .value=${String(e?.chipCustom?.x??``)}
               @change=${e=>{let n=Math.round(Number(e.target.value));t(e=>{e.chipCustom={x:isFinite(n)?n:0,y:e.chipCustom?.y??0}})}}>
        <span style="color:var(--text-dim);font-size:11px">y</span>
        <input type="number" style="width:56px" .value=${String(e?.chipCustom?.y??``)}
               @change=${e=>{let n=Math.round(Number(e.target.value));t(e=>{e.chipCustom={x:e.chipCustom?.x??0,y:isFinite(n)?n:0}})}}>
        ${r?I`<button class="btn" style="font-size:10px;padding:2px 6px"
               @click=${()=>t(e=>{e.chipCustom=void 0})}>Clear</button>`:P}
      </div>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:0 0 6px">
        Custom offset overrides the anchor (px from the anchor's edges).
      </div>
      <div style="font-size:11px;margin-bottom:2px">Content</div>
      ${a(`Feels-like`,`apparent`)}
      ${a(`Humidity`,`humidity`)}
      ${a(`Wind`,`wind`)}
      ${a(`UV index`,`uv`)}
      ${o(`Hourly forecast entries`,`hourly`,12)}
      ${o(`Daily forecast entries`,`daily`,7)}
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 6px">
        Forecast strips need the entity or Open-Meteo source (the local-sensors
        source has no forecast). 0 = hidden.
      </div>
    `}_weatherDemoBlock(e,t){let n=!!this.planner.store.imperial,i=e?.demo??{},a=e=>t(t=>{e(t.demo??(t.demo={}))}),o=e=>Math.round((n?e*9/5+32:e)*10)/10,s=e=>n?(e-32)*5/9:e,c=n?`°F`:`°C`,l=(e,t,n,r,i=1)=>I`
      <div class="row"><label>${e}</label>
        <input type="number" step=${String(i)} placeholder=${n}
               style="width:76px;text-align:right"
               .value=${t==null?``:String(t)}
               @change=${e=>{let t=e.target.value.trim(),n=parseFloat(t);r(t===``||!isFinite(n)?void 0:n)}}>
      </div>`,u=(e,t,n,r)=>I`
      <div class="row"><label>${e} (${c})</label>
        <input type="number" step="0.5" placeholder=${n}
               style="width:76px;text-align:right"
               .value=${t==null?``:String(o(t))}
               @change=${e=>{let t=e.target.value.trim(),n=parseFloat(t);r(t===``||!isFinite(n)?void 0:s(n))}}>
      </div>`,d=(e,t,n,r)=>I`
      <div class="row"><label>${e}</label>
        <select style="flex:1;min-width:0" .value=${t??``}
                @change=${e=>{let t=e.target.value;r(t===``?void 0:t)}}>
          ${n.map(([e,n])=>I`<option value=${e} ?selected=${(t??``)===e}>${n}</option>`)}
        </select>
      </div>`,f=Object.keys(r).map(e=>[e,`${ze[e]} ${r[e]}`]),p=[[``,`(follow moon entity)`],[`new_moon`,`New moon`],[`waxing_crescent`,`Waxing crescent`],[`first_quarter`,`First quarter`],[`waxing_gibbous`,`Waxing gibbous`],[`full_moon`,`Full moon`],[`waning_gibbous`,`Waning gibbous`],[`last_quarter`,`Last quarter`],[`waning_crescent`,`Waning crescent`]];return I`
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:4px 0 6px">
        Hand-authored weather — nothing is bound and nothing is fetched (works
        offline). Every visualization follows these values exactly as if a real
        source reported them: the chip, the 3D precipitation / fog / lightning /
        wind / clouds, the sky dome + sun + moon + stars, the scene lighting,
        solar panels, and the avatars' weather thoughts.
      </div>

      ${d(`Condition`,i.condition??`sunny`,f,e=>a(t=>{t.condition=e}))}
      ${u(`Temperature`,i.tempC,String(n?72:22),e=>a(t=>{t.tempC=e}))}
      ${u(`Feels like`,i.apparentC,`—`,e=>a(t=>{t.apparentC=e}))}
      ${l(`Humidity (%)`,i.humidity,`—`,e=>a(t=>{t.humidity=e}))}
      ${l(`Wind (km/h)`,i.windKmh,`8`,e=>a(t=>{t.windKmh=e}))}
      ${l(`Wind bearing (°)`,i.windBearing,`—`,e=>a(t=>{t.windBearing=e}))}
      ${l(`Wind gust (km/h)`,i.windGustKmh,`—`,e=>a(t=>{t.windGustKmh=e}))}
      ${l(`Cloud cover (%)`,i.cloudCoverage,`—`,e=>a(t=>{t.cloudCoverage=e}))}
      ${l(`Visibility (km)`,i.visibilityKm,`—`,e=>a(t=>{t.visibilityKm=e}),.5)}
      ${l(`UV index`,i.uvIndex,`—`,e=>a(t=>{t.uvIndex=e}),.5)}
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
        Blank = "not reported" (the effect that reads it stays off). Wind bearing
        is the direction the wind blows FROM. Low visibility thickens the fog.
      </div>

      <label class="row"><span style="flex:1">Rain coming soon</span>
        <input type="checkbox" .checked=${i.rainSoon===!0}
               @change=${e=>a(t=>{t.rainSoon=e.target.checked})}>
      </label>
      ${d(`Tomorrow`,i.forecastCondition??``,[[``,`(none)`],...f],e=>a(t=>{t.forecastCondition=e}))}
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
        "Rain coming soon" drives the storm-brewing sky; tomorrow's condition
        drives the avatars' ☔ / ⛄ anticipation thoughts.
      </div>

      <h4 style="font-size:11px;margin:8px 0 2px;color:var(--text-dim)">Sun &amp; moon</h4>
      ${l(`Sun elevation (°)`,i.sunElevationDeg,`auto`,e=>a(t=>{t.sunElevationDeg=e}))}
      ${l(`Sun azimuth (°)`,i.sunAzimuthDeg,`auto`,e=>a(t=>{t.sunAzimuthDeg=e}))}
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
        Set BOTH to place the sun (elevation −90..90, azimuth 0..360 compass
        degrees CW from true north). Leave either blank for the real sun
        (<code>sun.sun</code>, else the local clock). A demo sun also drives the
        3D lighting preset in clock mode and the avatars' time of day.
      </div>
      ${d(`Moon phase`,i.moonPhase??``,p,e=>a(t=>{t.moonPhase=e}))}

      <h4 style="font-size:11px;margin:8px 0 2px;color:var(--text-dim)">Alert</h4>
      ${d(`Demo alert`,i.alertSeverity??``,[[``,`(none)`],[`advisory`,`Advisory`],[`watch`,`Watch`],[`warning`,`Warning`]],e=>a(t=>{t.alertSeverity=e}))}
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 6px">
        Fires a synthetic alert (chip badge + panel, and the 3D sky beacon when
        it's enabled below). The bound alert entity is ignored while demo is the
        source.
      </div>
    `}_weatherAlertsBlock(e,t){let n=this.planner,r=e?.source===`demo`,i=e?.alerts?.entityId,a=n.weatherAlerts??[],o=On(a),s=r?a.length?`demo alert · ${o}`:`no demo alert set`:i?a.length?`${a.length} alert${a.length>1?`s`:``} · worst: ${o}`:`none parsed`:`No alert entity bound.`;return I`
      <h3 style="font-size:12px;margin:10px 0 4px">Alerts</h3>
      ${r?I`
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
          The demo source authors its own alert (above); the entity bind is
          bypassed while it's selected.
        </div>`:I`
      <div class="row"><label>Alert entity</label>
        <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;
                     text-overflow:ellipsis;white-space:nowrap">${i||`—`}</span>
        <button class="btn" style="font-size:10px;padding:2px 6px" @click=${()=>{this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:[`sensor`,`binary_sensor`],onPick:e=>t(t=>{(t.alerts??(t.alerts={})).entityId=e})}}))}}>🔗</button>
        ${i?I`<button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                             title="Clear the alert entity"
                             @click=${()=>t(e=>{(e.alerts??(e.alerts={})).entityId=void 0})}>✕</button>`:P}
      </div>`}
      <label class="row"><span style="flex:1">3D beacon</span>
        <input type="checkbox" .checked=${e?.alerts?.beacon!==!1}
               @change=${e=>t(t=>{(t.alerts??(t.alerts={})).beacon=e.target.checked})}>
      </label>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
        Severity-tinted badge on the weather chip (⚠, click for detail) + a slow
        3D sky pulse (amber advisory / orange watch / red warning). Auto-detects
        NWS Alerts, MeteoAlarm, DWD, and Environment Canada entities.
      </div>
      <div style="font-size:11px;padding:5px 8px;background:rgba(0,0,0,0.25);border-radius:4px">
        ${s}
      </div>
    `}_weatherTab(){let e=this.planner,t=e.store.weather,n=t?.source??`openmeteo`,i=e.weatherNow,a=t=>e.setWeather(t),o=(e,t)=>I`
      <label class="row" style="padding:0;cursor:pointer;gap:6px">
        <input type="radio" name="weather-src" .checked=${n===e}
               @change=${()=>a(t=>{t.source=e})}>
        <span style="font-size:12px;flex:1">${t}</span>
      </label>`,s=(e,t,n,r)=>I`
      <div class="row" style="margin-top:2px"><label>${e}</label>
        <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;
                     text-overflow:ellipsis;white-space:nowrap">${t||`—`}</span>
        <button class="btn" style="font-size:10px;padding:2px 6px" @click=${()=>{this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:n,onPick:r}}))}}>🔗</button>
      </div>`,c;if(!t)c=I`<span style="color:var(--text-dim)">Pick a source to enable the chip.</span>`;else if(i){let t=ze[i.condition]??`❓`,n=i.tempC==null?``:` · `+Tn(i.tempC,e.store.imperial);c=I`<span style="${i.stale?`opacity:0.55`:``}">
        ${t} ${r[i.condition]??i.condition}${n}
        ${i.label?I`<span style="color:var(--text-dim)"> · ${i.label}</span>`:P}
        ${i.stale?I`<span style="color:#ffab91"> · stale</span>`:P}
      </span>`}else c=I`<span style="color:var(--text-dim)">${n===`openmeteo`?t.zip||t.lat!=null?`Fetching…`:`Set a zip (or configure zone.home in HA).`:n===`demo`?`Synthesizing…`:`Bind the source entities above.`}</span>`;return I`
      <div id="diorama-weather-section" style="display:flex;flex-direction:column;gap:2px;margin-bottom:6px">
        ${o(`entity`,`HA weather entity`)}
        ${o(`sensors`,`Local station sensors`)}
        ${o(`openmeteo`,`Open-Meteo (online)`)}
        ${o(`demo`,`Demo (hand-authored)`)}
      </div>

      ${n===`demo`?this._weatherDemoBlock(t,a):P}

      ${n===`entity`?s(`Entity`,t?.entityId,`weather`,e=>a(t=>{t.entityId=e})):P}

      ${n===`sensors`?I`
        ${s(`Precip (mm/h)`,t?.sensors?.precip,`sensor`,e=>a(t=>{(t.sensors??(t.sensors={})).precip=e}))}
        ${s(`Wind speed`,t?.sensors?.windSpeed,`sensor`,e=>a(t=>{(t.sensors??(t.sensors={})).windSpeed=e}))}
        ${s(`Temperature`,t?.sensors?.temp,`sensor`,e=>a(t=>{(t.sensors??(t.sensors={})).temp=e}))}
        ${s(`Lightning`,t?.sensors?.lightning,`binary_sensor`,e=>a(t=>{(t.sensors??(t.sensors={})).lightning=e}))}
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 0">
          Condition is derived: precip → rainy/pouring, cold precip → snowy,
          high wind → windy, lightning → storm; else clear by the sun.
        </div>
      `:P}

      ${n===`openmeteo`?I`
        <div class="row"><label>Zip / place</label>
          <input type="text" placeholder="e.g. 90210" .value=${t?.zip??``}
                 style="flex:1;min-width:0"
                 @change=${e=>a(t=>{t.zip=e.target.value.trim()})}>
          <button class="btn" style="font-size:10px;padding:2px 8px;margin-left:4px"
                  @click=${()=>e.refreshWeatherLocation()}>Search</button>
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin:2px 0 0">
          ${t?.placeLabel?I`📍 ${t.placeLabel}`:t?.lat==null?`No location — uses HA zone.home if no zip.`:I`📍 ${t.lat.toFixed(2)}, ${t.lon?.toFixed(2)}`}
        </div>
      `:P}

      <label class="row" style="margin-top:8px"><span style="flex:1">Show chip</span>
        <input type="checkbox" .checked=${t?.chip!==!1}
               @change=${e=>a(t=>{t.chip=e.target.checked})}>
      </label>
      <label class="row"><span style="flex:1">3D effects</span>
        <input type="checkbox" .checked=${t?.effects3d!==!1}
               @change=${e=>a(t=>{t.effects3d=e.target.checked})}>
      </label>
      ${this._weatherEffectToggles(t,a)}
      <label class="row"><span style="flex:1">Affect lighting</span>
        <input type="checkbox" .checked=${t?.affectLighting!==!1}
               @change=${e=>a(t=>{t.affectLighting=e.target.checked})}>
      </label>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 6px">
        3D effects: rain / snow / hail / fog / wind dust / lightning around the
        house, matched to the live condition. "Affect lighting" dims the day
        preset under overcast weather. The "Weather FX" entry in 2D Layers
        also gates the effects.
      </div>

      <h4 style="font-size:11px;margin:8px 0 2px;color:var(--text-dim)">Sky (3D)</h4>
      <div class="row" style="margin-top:2px"><label>Moon entity</label>
        <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;
                     text-overflow:ellipsis;white-space:nowrap">${t?.moonEntity||`—`}</span>
        <button class="btn" style="font-size:10px;padding:2px 6px" @click=${()=>{this.dispatchEvent(new CustomEvent(`open-entity-picker`,{bubbles:!0,composed:!0,detail:{domain:`sensor`,onPick:e=>a(t=>{t.moonEntity=e})}}))}}>🔗</button>
        ${t?.moonEntity?I`<button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
               title="Clear the moon entity"
               @click=${()=>a(e=>{e.moonEntity=void 0})}>✕</button>`:P}
      </div>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 6px">
        HA's core Moon integration (8-state phase). Shades the night-sky moon prop;
        unbound → a full moon. Position is illustrative (opposite the sun) — HA
        exposes no real moon position. The sky dome + sun/moon toggle lives in
        Display ▸ "Sky backdrop".
      </div>
      <label class="row"><span style="flex:1">Space station</span>
        <input type="checkbox" .checked=${t?.moonStation===!0}
               @change=${e=>a(t=>{t.moonStation=e.target.checked})}>
      </label>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 6px">
        Renders the moon as a battle station — phases still apply.
      </div>

      ${this._weatherAppearance(t,a)}

      ${this._weatherAlertsBlock(t,a)}

      <div style="font-size:11px;padding:6px 8px;background:rgba(0,0,0,0.25);border-radius:4px;line-height:1.4">
        ${c}
      </div>
    `}_floorsBlock(){let e=this.planner,t=e.store.floors,n=t.length<=1,r=(t,n,r,i)=>e.saveFloorEdit(t.id,n.trim()||`Floor`,Math.max(1e3,Math.round(r)||t.w),Math.max(1e3,Math.round(i)||t.d));return I`
      <h3 style="font-size:12px;margin:0 0 8px">Floors</h3>
      <div data-floors-block style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
        ${ot(t).map(t=>I`
          <div data-floor-edit-row=${t.id}
               style="display:flex;align-items:center;gap:6px;padding:6px;border-radius:6px;
                      border:1px solid ${t.id===e.store.currentFloorId?`var(--accent)`:`var(--border)`};
                      background:#111">
            <input type="text" data-floor-name-for=${t.id} .value=${t.name}
                   title="Floor name"
                   style="flex:1 1 auto;min-width:60px;padding:3px 5px;background:#0c0c14;
                          border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:12px"
                   @change=${e=>r(t,e.target.value,t.w,t.d)}>
            <input type="number" data-floor-w-for=${t.id} min="1000" step="100" .value=${String(Math.round(t.w))}
                   title="Width (mm)"
                   style="width:74px;flex:0 0 auto;padding:3px 5px;background:#0c0c14;text-align:right;
                          border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px"
                   @change=${e=>r(t,t.name,Number(e.target.value),t.d)}>
            <span style="color:var(--text-dim);font-size:11px">×</span>
            <input type="number" data-floor-d-for=${t.id} min="1000" step="100" .value=${String(Math.round(t.d))}
                   title="Depth (mm)"
                   style="width:74px;flex:0 0 auto;padding:3px 5px;background:#0c0c14;text-align:right;
                          border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px"
                   @change=${e=>r(t,t.name,t.w,Number(e.target.value))}>
            <button class="btn danger" data-floor-del-for=${t.id} ?disabled=${n}
                    style="flex:0 0 auto;padding:3px 7px"
                    title=${n?`At least one floor is required`:`Delete "${t.name}"`}
                    @click=${()=>this._deleteFloor(t)}>🗑</button>
          </div>`)}
      </div>
      <button class="btn" style="width:100%" data-add-floor
              title="Add a new floor above the current top story"
              @click=${this._addFloor}>+ Add floor</button>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:6px 0 14px">
        Sizes are in millimetres (the floor rect is <code>0 … W × 0 … D</code>). You can also
        drag the floor's edges directly on the 2D canvas. Story order, elevation, visibility
        and the rotate / move-plan nudges live in the sidebar's <strong>Floor tools</strong>.
      </div>
    `}_deleteFloor(e){let t=this.planner;t.store.floors.length<=1||confirm(`Delete floor "${e.name}" and everything on it? This cannot be undone.`)&&t.deleteFloor(e.id)}_dataTab(){let e=this.planner,t=e.listConfigs(),n=e.activeConfigId,r=e.lastSavedAt,i=t.length<=1;return I`
      ${this._floorsBlock()}
      <h3 style="font-size:12px;margin:0 0 8px">Configurations</h3>
      <select style="width:100%;margin-bottom:8px" @change=${this._onSelectConfig}
              title="Switch the active configuration">
        ${t.length?t.map(e=>I`<option value=${e.id} ?selected=${e.id===n}>${e.name}</option>`):I`<option>Default</option>`}
      </select>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">
        <button class="btn" style="flex:1;min-width:80px" @click=${this._saveConfig}>Save</button>
        <button class="btn" style="flex:1;min-width:80px" @click=${this._saveAsConfig}>Save as…</button>
        <button class="btn" style="flex:1;min-width:80px" @click=${this._newConfig}>New…</button>
        <button class="btn" style="flex:1;min-width:80px" @click=${this._renameConfig}>Rename</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">
        <button class="btn" style="flex:1;min-width:80px" @click=${this._exportConfig}>Export</button>
        <button class="btn" style="flex:1;min-width:80px" @click=${this._importConfig}>Import</button>
        <button class="btn" style="flex:1;min-width:80px" ?disabled=${i}
                title=${i?`The only configuration cannot be deleted`:`Delete this configuration`}
                @click=${this._deleteConfig}>Delete</button>
      </div>
      ${r?I`<div style="font-size:10px;color:var(--text-dim)">Last saved ${this._agoText(r)}</div>`:P}

      <h3 style="font-size:12px;margin:14px 0 6px">Import Sweet Home 3D (.sh3d)</h3>
      <button class="btn" style="width:100%;margin-bottom:6px" ?disabled=${this._sh3dBusy}
              @click=${this._importSh3d}>${this._sh3dBusy?`Reading…`:`Import .sh3d…`}</button>
      <label class="row" style="padding:0;margin-bottom:6px">
        <span style="color:var(--text-dim);font-size:11px;flex:1">Also import furniture (best-effort)</span>
        <span class="mini-toggle">
          <input type="checkbox" .checked=${this._sh3dImportFurniture}
                 @change=${e=>{this._sh3dImportFurniture=e.target.checked}}>
          <span></span>
        </span>
      </label>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin-bottom:6px">
        Reads the native <code>.sh3d</code> file and builds real floors, walls,
        rooms, and doors/windows as a NEW configuration. This is the STRUCTURAL
        import — different from the visual OBJ model (3D Model sidebar section),
        which drops a decorative mesh onto the current floor.
      </div>
      ${this._sh3dWarnings.length?I`
        <div style="border:1px solid #7a5a1a;background:#211a0d;border-radius:5px;padding:6px 8px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <strong style="font-size:11px;color:#ffca7a">Import warnings (${this._sh3dWarnings.length})</strong>
            <button class="btn" style="padding:1px 8px;font-size:11px"
                    @click=${()=>{this._sh3dWarnings=[]}}>Dismiss</button>
          </div>
          <ul style="margin:0;padding-left:16px;font-size:10px;color:var(--text-dim);line-height:1.4;max-height:160px;overflow:auto">
            ${this._sh3dWarnings.map(e=>I`<li>${e}</li>`)}
          </ul>
        </div>
      `:P}

      <label style="font-size:11px;color:var(--text-dim);display:block;margin:10px 0 3px">
        Notes — saved with this configuration, included in export
      </label>
      <textarea rows="5" placeholder="Describe this configuration…"
                .value=${e.store.notes??``}
                @change=${t=>e.setNotes(t.target.value)}
                style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:4px;
                       border:1px solid var(--border);background:#111;color:var(--text);
                       font-size:12px;font-family:inherit;resize:vertical;margin-bottom:8px"></textarea>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin-top:8px">
        Each configuration is a full, independent floor plan (all floors,
        fixtures, avatars, and settings). Export downloads a self-contained
        <code>.diorama.json</code> (including any imported avatar packs); Import
        adds it as a new configuration. Imported OBJ models live in this
        browser's local storage and are re-imported per device.
      </div>
    `}_agoText(e){let t=Math.max(0,Math.round((Date.now()-e)/1e3));if(t<60)return t<=2?`just now`:`${t}s ago`;let n=Math.round(t/60);if(n<60)return`${n}m ago`;let r=Math.round(n/60);return r<24?`${r}h ago`:new Date(e).toLocaleString()}_vehiclesTab(){let e=this.planner.store.vehiclePacks,t=Ee(),n=new Set(t.map(e=>e.def.id)),r=t.map(e=>({id:e.def.id,label:e.def.label,path:e.def.path,def:e.def,count:e.def.models.length,registered:!0,franchise:!!e.def.franchise}));for(let e of fe)n.has(e.id)||r.push({id:e.id,label:e.label,path:e.path,def:null,count:e.count,registered:!1,franchise:!!e.franchise});r.sort((e,t)=>e.path.join(`/`).localeCompare(t.path.join(`/`))||e.label.localeCompare(t.label));let i=[];return I`
      <div style="font-size:11px;color:var(--text-dim);line-height:1.4;margin-bottom:10px">
        Vehicle models are placeable objects (driveway, garage, yard). Loaded +
        active packs appear in the placement toolbar's <b>Vehicles</b> tab.
      </div>
      <div style="display:flex;flex-direction:column;gap:2px">
        ${r.map(t=>{let n=[],r=0;for(;r<t.path.length&&r<i.length&&t.path[r]===i[r];)r++;for(let e=r;e<t.path.length;e++)n.push(I`
              <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.06em;
                          margin:6px 0 2px;padding-left:${e*12}px">${t.path[e]}</div>`);return i=t.path,I`${n}${this._vehPackRow(t,e)}`})}
      </div>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin-top:12px;
                  border-top:1px solid var(--border);padding-top:8px">
        A placed vehicle whose pack is unloaded or deactivated falls back to a
        plain block until the pack is switched back on — nothing is lost.
      </div>
    `}_vehPackRow(e,t){let n=this.planner,r=e.registered&&e.def?be(e.def,t):{loaded:!1,active:!1},i=this._vehPackExpanded.has(e.id),a=e.path.length*12,o=e.def?.models??[],s=t?.[e.id]?.members;return I`
      <div style="border:1px solid var(--border);border-radius:5px;padding:6px 8px;margin-left:${a}px">
        <div style="display:flex;align-items:center;gap:6px">
          ${e.def&&o.length?I`
            <button style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:11px;
                           transform:rotate(${i?90:0}deg);transition:transform 0.1s"
                    @click=${()=>{i?this._vehPackExpanded.delete(e.id):this._vehPackExpanded.add(e.id),this.requestUpdate()}}>▸</button>
          `:I`<span style="width:12px;display:inline-block"></span>`}
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${e.label}
              <span style="color:var(--text-dim);font-size:10px"> · ${e.count}</span>
            </div>
            <div style="font-size:9px;color:var(--text-dim)">
              ${e.franchise?`novelty pack — opt in`:`built-in`}
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--text-dim)" title="Loaded">
            <input type="checkbox" .checked=${r.loaded}
                   @change=${t=>{n.setVehiclePackLoaded(e.id,t.target.checked)}}>
            load
          </label>
          <label style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--text-dim)" title="Active">
            <input type="checkbox" .checked=${r.active} ?disabled=${!r.loaded}
                   @change=${t=>n.setVehiclePackActive(e.id,t.target.checked)}>
            active
          </label>
        </div>
        ${i&&o.length?I`
          <div style="margin:6px 0 2px;padding-left:18px;display:flex;flex-direction:column;gap:2px">
            ${o.map(t=>this._vehMemberRow(e.id,t,o,s))}
          </div>
        `:P}
      </div>
    `}_vehMemberRow(e,t,n,r){let i=this.planner,a=!r||r.includes(t.id),o=t.body??`#8a8f96`,s=(t.lenMm/1e3).toFixed(1);return I`
      <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer">
        <input type="checkbox" .checked=${a}
               @change=${a=>{let o=a.target.checked,s=new Set(r??n.map(e=>e.id));o?s.add(t.id):s.delete(t.id);let c=s.size>=n.length?void 0:n.filter(e=>s.has(e.id)).map(e=>e.id);i.setVehiclePackMembers(e,c)}}>
        <span style="width:12px;height:12px;border-radius:3px;border:1px solid var(--border);
                     background:${o}"></span>
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.label}</span>
        <span style="color:var(--text-dim);font-size:9px">${s} m</span>
      </label>`}_avatarsTab(){let e=this.planner.store.avatarPacks,t=E(),n=new Set(t.map(e=>e.def.id)),r=t.map(e=>({id:e.def.id,label:e.def.label,path:e.def.path,source:e.source,def:e.def,count:e.def.avatars.length,registered:!0,franchise:!!e.def.franchise,locked:!!e.def.locked}));for(let e of Ve)n.has(e.id)||r.push({id:e.id,label:e.label,path:e.path,source:`builtin`,def:null,count:e.count,registered:!1,franchise:!!e.franchise,locked:!1});r.sort((e,t)=>e.id===`core`?-1:t.id===`core`?1:e.path.join(`/`).localeCompare(t.path.join(`/`))||e.label.localeCompare(t.label));let i=[];return I`
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        <button class="btn" style="flex:1;min-width:120px" @click=${this._importPack}>Import pack (JSON)</button>
      </div>
      ${this._packErr?I`
        <div style="font-size:11px;color:#ff8a80;background:rgba(80,0,0,0.25);border-radius:4px;
                    padding:6px 8px;margin-bottom:8px">${this._packErr}</div>`:P}

      <div style="display:flex;flex-direction:column;gap:2px">
        ${r.map(t=>{let n=[],r=0;for(;r<t.path.length&&r<i.length&&t.path[r]===i[r];)r++;for(let e=r;e<t.path.length;e++)n.push(I`
              <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.06em;
                          margin:6px 0 2px;padding-left:${e*12}px">${t.path[e]}</div>`);return i=t.path,I`${n}${this._packRow(t,e)}`})}
      </div>

      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin-top:12px;
                  border-top:1px solid var(--border);padding-top:8px">
        Unknown or deactivated avatars render as the default (adult).
      </div>
    `}_packRow(e,t){let n=this.planner,r=e.registered&&e.def?$e(e.def,t):{loaded:!1,active:!1},i=this._packExpanded.has(e.id),a=e.path.length*12,o=e.source===`user`?`imported`:`built-in`,s=e.def?.avatars??[],c=t?.[e.id]?.members;return I`
      <div style="border:1px solid var(--border);border-radius:5px;padding:6px 8px;margin-left:${a}px">
        <div style="display:flex;align-items:center;gap:6px">
          ${e.def&&s.length?I`
            <button style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:11px;
                           transform:rotate(${i?90:0}deg);transition:transform 0.1s"
                    @click=${()=>{i?this._packExpanded.delete(e.id):this._packExpanded.add(e.id),this.requestUpdate()}}>▸</button>
          `:I`<span style="width:12px;display:inline-block"></span>`}
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${e.locked?`🔒 `:``}${e.label}
              <span style="color:var(--text-dim);font-size:10px"> · ${e.count}</span>
            </div>
            <div style="font-size:9px;color:var(--text-dim)">${o}</div>
          </div>
          <label style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--text-dim)"
                 title=${e.locked?`Built-in default — always available`:`Loaded`}>
            <input type="checkbox" .checked=${r.loaded} ?disabled=${e.locked}
                   @change=${t=>{n.setPackLoaded(e.id,t.target.checked)}}>
            load
          </label>
          <label style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--text-dim)"
                 title=${e.locked?`Built-in default — always active`:`Active`}>
            <input type="checkbox" .checked=${r.active} ?disabled=${e.locked||!r.loaded}
                   @change=${t=>n.setPackActive(e.id,t.target.checked)}>
            active
          </label>
          <button class="btn" style="font-size:10px;padding:2px 5px"
                  ?disabled=${!e.registered}
                  title="Export this pack as JSON" @click=${()=>this._exportPack(e.id,e.label)}>⬇</button>
          ${e.source===`user`?I`
            <button class="btn danger" style="font-size:10px;padding:2px 5px"
                    title="Remove imported pack" @click=${()=>this._removePack(e.id,e.label)}>🗑</button>
          `:P}
        </div>
        ${i&&s.length?I`
          <div style="margin:6px 0 2px;padding-left:18px;display:flex;flex-direction:column;gap:2px">
            ${s.map(t=>this._memberRow(e.id,t,s,c))}
          </div>
        `:P}
      </div>
    `}_memberRow(e,t,n,r){let i=this.planner,a=!r||r.includes(t.id),o=this._swatch(t);return I`
      <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer">
        <input type="checkbox" .checked=${a}
               @change=${a=>{let o=a.target.checked,s=new Set(r??n.map(e=>e.id));o?s.add(t.id):s.delete(t.id);let c=s.size>=n.length?void 0:n.filter(e=>s.has(e.id)).map(e=>e.id);i.setPackMembers(e,c)}}>
        <span style="width:12px;height:12px;border-radius:3px;border:1px solid var(--border);
                     background:${o.css}" title=${o.tip}></span>
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.label}</span>
      </label>`}_swatch(e){let t=le(e.id),n=t.rig===`quadruped`?t.quadruped?.coat:t.humanoid?.body??t.humanoid?.skin;return typeof n==`number`?{css:`#`+n.toString(16).padStart(6,`0`),tip:``}:{css:`repeating-linear-gradient(45deg,#666,#666 3px,#888 3px,#888 6px)`,tip:`tint`}}_exportPack(e,t){let n=this.planner.exportPackJson(e);if(!n)return;let r=new Blob([n],{type:`application/json`}),i=document.createElement(`a`);i.href=URL.createObjectURL(r),i.download=`${e}.json`,i.click(),URL.revokeObjectURL(i.href)}_removePack(e,t){confirm(`Remove imported avatar pack "${t}"? This deletes it from this browser.`)&&(this.planner.removeAvatarPack(e),this._packExpanded.delete(e),this._packErr=``)}_setBermudaEnabled(e){this.planner.store.bermudaEnabled=e?void 0:!1,this.planner.save(),this.planner.emitConfig(),this.requestUpdate()}_setMqttMode(e){this.planner.setMqttBridge(t=>{t.mode=e}),this.requestUpdate()}_setMqttField(e){this.planner.setMqttBridge(e),this.requestUpdate()}_mqttCred(e){try{return localStorage.getItem(`diorama:mqtt:`+e)||``}catch{return``}}_setMqttCred(e,t){try{t?localStorage.setItem(`diorama:mqtt:`+e,t):localStorage.removeItem(`diorama:mqtt:`+e)}catch{}this.planner.restartMqtt(),this.requestUpdate()}};k([R({attribute:!1})],Q.prototype,`planner`,void 0),k([F()],Q.prototype,`open`,void 0),k([F()],Q.prototype,`_tab`,void 0),k([F()],Q.prototype,`_url`,void 0),k([F()],Q.prototype,`_token`,void 0),k([F()],Q.prototype,`_packErr`,void 0),k([F()],Q.prototype,`_sh3dImportFurniture`,void 0),k([F()],Q.prototype,`_sh3dWarnings`,void 0),k([F()],Q.prototype,`_sh3dBusy`,void 0),k([F()],Q.prototype,`_glowRuleOpen`,void 0),k([F()],Q.prototype,`_rebind`,void 0),k([F()],Q.prototype,`_rebindMsg`,void 0),Q=k([L(`diorama-settings-drawer`)],Q);var $=class extends N{constructor(...e){super(...e),this._connected=!1,this._planner=null,this._tplDone={floor:!1,layers:!1}}createRenderRoot(){return this}adoptPlanner(e){this._planner=e,e.viewPersist=!0;try{window.__dioramaPlanner=e}catch{}this._planner.addEventListener(`config`,()=>this.requestUpdate()),this._connected=!0,this._applyUrlParams(e),this.requestUpdate()}_applyUrlParams(e){let t=new URLSearchParams(window.location.search);if(t.get(`debug3d`)===`1`&&!document.getElementById(`diorama-debug-log`)){let e=document.createElement(`div`);e.id=`diorama-debug-log`,e.style.cssText=`position:fixed;left:4px;bottom:4px;right:4px;z-index:9999;background:rgba(0,0,0,0.82);color:#9fe89f;font:10px/1.4 monospace;padding:6px;max-height:35vh;overflow:auto;pointer-events:none;white-space:pre-wrap;word-break:break-all`,e.textContent=`debug3d on — ${navigator.userAgent}\n`,document.body.appendChild(e);let t=t=>{e.textContent+=t+`
`,e.scrollTop=e.scrollHeight};window.addEventListener(`error`,e=>t(`ERROR ${e.message} @ ${e.filename?.split(`/`).pop()}:${e.lineno}`)),window.addEventListener(`unhandledrejection`,e=>t(`REJECTION ${e.reason?.stack||e.reason}`))}let n=t.get(`mode`);(n===`kiosk`||n===`view`)&&(e.setUiMode(n),t.get(`lock`)===`1`&&(e.uiModeLocked=!0));let r=t.get(`view`);(r===`2d`||r===`3d`)&&(e.view=r),e.urlTemplate={floor:t.get(`floor`)??void 0,layers:t.get(`layers`)??void 0,view3d:t.get(`view3d`)??void 0,cam:t.get(`cam`)?.split(`,`).map(Number).filter(e=>isFinite(e))},e.urlTemplate.floor||(this._tplDone.floor=!0),e.urlTemplate.layers||(this._tplDone.layers=!0);let a=performance.now(),o=()=>{if(!this._tplDone.floor){let t=(e.urlTemplate.floor??``).toLowerCase(),n=e.store.floors.find(n=>n.id===e.urlTemplate.floor||n.name.toLowerCase()===t);n&&n.disabled&&e.uiMode!==`edit`?this._tplDone.floor=!0:n&&(e.store.currentFloorId=n.id,e.viewCenter=null,e.zoom=1,this._tplDone.floor=!0,e.emitConfig())}if(!this._tplDone.layers){let t=(e.urlTemplate.layers??``).toLowerCase();if(t===`simple`)e.store.layers2d={...i},this._tplDone.layers=!0,e.emitConfig();else if(t===`full`)e.store.layers2d=void 0,this._tplDone.layers=!0,e.emitConfig();else{let n=(e.store.layerPresets2d??[]).find(n=>n.id===e.urlTemplate.layers||n.name.toLowerCase()===t);n&&(e.store.layers2d={...n.layers},this._tplDone.layers=!0,e.emitConfig())}}(!this._tplDone.floor||!this._tplDone.layers)&&performance.now()-a<2e4||e.removeEventListener(`config`,o)};e.addEventListener(`config`,o),o()}connectedCallback(){if(super.connectedCallback(),Ce(),this._planner&&this._applyUrlParams(this._planner),!this._planner)if(Sr())this._launchOffline();else{let e=localStorage.getItem(`diorama:token`);if(e){let t=localStorage.getItem(`diorama:url`)||window.location.origin;this._launch(t,e)}}this.addEventListener(`connect`,e=>{let{url:t,token:n}=e.detail;this._launch(t,n)}),this.addEventListener(`connect-offline`,()=>this._launchOffline()),this.addEventListener(`open-floor-modal`,e=>{let{floor:t}=e.detail;this._floorModal?.show(t)}),this.addEventListener(`open-light-config`,e=>{let{entityId:t,fanEntityId:n}=e.detail;this._lightConfig?.show(t,n??null)}),this.addEventListener(`open-media-config`,e=>{let{entityId:t}=e.detail;this._mediaConfig?.show(t)}),this.addEventListener(`open-alarm`,e=>{let{id:t}=e.detail;this._planner?.uiMode!==`view`&&this._alarmModal?.show(t)}),this.addEventListener(`open-thermostat`,e=>{let{id:t}=e.detail;this._planner?.uiMode!==`view`&&this._thermoModal?.show(t)}),this.addEventListener(`open-flight-info`,e=>{let{hex:t}=e.detail;this._planner?.uiMode!==`view`&&this._flightModal?.show(t)}),this.addEventListener(`open-entity-picker`,e=>{let{domain:t,onPick:n,devices:r,title:i,areaFilter:a}=e.detail;r?this._entPicker?.showDevices(r,n,i):this._entPicker?.show(t??``,n,a??null)}),this.addEventListener(`open-settings`,e=>{let t=e.detail?.tab;this._settings?.show(t)}),this.addEventListener(`open-weather`,()=>{let e=this._planner;!e||e.uiMode!==`edit`||this._settings?.show(`weather`)})}_launch(e,t){this._planner=new re;try{window.__dioramaPlanner=this._planner}catch{}this._planner.viewPersist=!0,this._planner.connect(e,t),this._planner.addEventListener(`conn`,()=>{this._planner?.conn===`auth_invalid`&&(this._auth?.showError(`Token rejected by Home Assistant. Check your token.`),this._connected=!1,this.requestUpdate())}),this._planner.addEventListener(`config`,()=>this.requestUpdate()),this._connected=!0,this.requestUpdate()}_launchOffline(){this._planner=new re;try{window.__dioramaPlanner=this._planner}catch{}this._planner.viewPersist=!0,this._planner.connectWith(new Cr),this._planner.addEventListener(`config`,()=>this.requestUpdate()),this._connected=!0;let e=(()=>{try{return new URLSearchParams(window.location.search)}catch{return new URLSearchParams}})();e.has(`model`)?(this._planner.demoMode=!0,this._bootModel(this._planner,e.get(`model`))):e.has(`demo`)&&(this._planner.demoMode=!0,this._bootDemo(this._planner,e.get(`demo`))),this.requestUpdate()}async _bootModel(e,t){e.setView(`2d`);try{if(!await this._waitFor(()=>e.configIndex!==null,8e3)||!t){await this._bootDemo(e,null);return}let n=await Ir(e,t);if(!n.ok){await this._bootDemo(e,null);return}this._applyUrlParams(e),e.urlTemplate={...e.urlTemplate,cam:n.cam},e.setView(`3d`)}catch(t){console.warn(`[diorama demo] model boot failed:`,t);try{await this._bootDemo(e,null)}catch{}}finally{this.requestUpdate()}}_waitFor(e,t){return new Promise(n=>{let r=performance.now(),i=()=>{if(e())return n(!0);if(performance.now()-r>=t)return n(!1);setTimeout(i,20)};i()})}async _bootDemo(e,t){try{if(await this._waitFor(()=>e.configIndex!==null,8e3)){let n=[];try{let e=await fetch(`./floorplans/index.json`,{cache:`no-cache`});if(e.ok){let t=await e.json();Array.isArray(t)&&(n=t)}}catch(e){console.warn(`[diorama demo] manifest fetch failed:`,e)}if(n.length){let r=Dr(n),i=null;try{i=localStorage.getItem(wr)}catch{}if(i!==r){let i={};await Promise.all(n.map(async e=>{try{let t=await fetch(`./floorplans/${e.slug}.json`,{cache:`no-cache`});t.ok&&(i[e.slug]=await t.json())}catch(t){console.warn(`[diorama demo] envelope fetch failed:`,e.slug,t)}})),await Or(e,n,i,t);try{localStorage.setItem(wr,r)}catch{}}else await Or(e,n,{},t)}}}catch(e){console.warn(`[diorama demo] boot failed:`,e)}finally{this._applyUrlParams(e),this.requestUpdate()}}render(){if(!this._connected||!this._planner)return I`<diorama-auth></diorama-auth>`;let e=this._planner,t=e.floor();return I`
      <div style="display:flex;flex-direction:column;height:100%">
        <diorama-topbar .planner=${e}></diorama-topbar>
        <div style="display:flex;flex:1;overflow:hidden;position:relative">
          ${e.uiMode===`edit`&&e.sidebarOpen?I`
            <div class="sidebar-backdrop" @click=${()=>e.toggleSidebar()}></div>
            <diorama-sidebar .planner=${e}></diorama-sidebar>
          `:P}
          <!-- Canvas column: the canvas fills the top, the visual toolbar docks
               below it (edit mode only). Because the toolbar is a LAYOUT sibling
               (not an overlay), the canvas shrinks to make room — so the weather
               chip + 2D reset-view button (absolute inside the canvas) clear the
               dock for free, no barOffset / gap hack needed. -->
          <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden">
            <div style="flex:1;position:relative;overflow:hidden;background:var(--bg)">
              <!-- Absolute inset so the canvas gets a real height to size
                   against (height:100% of an auto-height div feeds back into
                   the canvas backing-store resize and paints half-black). -->
              <div style="position:absolute;inset:0;${e.view===`2d`?``:`display:none`}">
                <diorama-canvas-2d .planner=${e}></diorama-canvas-2d>
              </div>
              ${e.view===`3d`?I`<diorama-three-view .planner=${e}></diorama-three-view>`:P}
              <!-- Weather chip overlays the shared canvas area so it shows in
                   both 2D and 3D without a duplicate mount / duplicate interval. -->
              <diorama-weather-chip .planner=${e}></diorama-weather-chip>
              <!-- Compass overlay: same shared-canvas mount as the chip (one
                   instance covers 2D + 3D); hidden unless compass.show. -->
              <diorama-compass .planner=${e}></diorama-compass>
              <!-- Data attribution (compliance, NOT configurable): shown in ALL
                   UI modes whenever a third-party data feed is enabled AND its
                   data is resolved AND its LAYER is visible. Still not a user
                   setting — it simply FOLLOWS the layer: attribution is required
                   whenever the data is DISPLAYED, and a hidden layer displays
                   nothing, so suppressing its line is compliant. It un-hides the
                   moment the layer does. One fixed bottom-left container; each
                   active source is its own stacked line. Links are the only
                   pointer-interactive part. -->
              ${e.store.neighborhood?.enabled===!0&&e.neighborhoodData!=null&&e.store.layers2d?.neighborhood!==!1||e.store.flights?.enabled===!0&&yt(e.store.flights.source)!=null&&e.flightsNow!=null&&e.store.layers2d?.flights!==!1?I`
                <div style="position:absolute;bottom:6px;left:8px;font-size:10px;line-height:1.35;
                            color:var(--text-dim);pointer-events:none;
                            text-shadow:0 0 4px rgba(0,0,0,0.85),0 0 2px rgba(0,0,0,0.85)">
                  ${e.store.neighborhood?.enabled===!0&&e.neighborhoodData!=null&&e.store.layers2d?.neighborhood!==!1?I`
                    <div>
                      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
                         style="color:inherit;pointer-events:auto;text-decoration:underline">© OpenStreetMap</a>
                      ·
                      <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer"
                         style="color:inherit;pointer-events:auto;text-decoration:underline">OpenFreeMap</a>
                    </div>`:P}
                  <!-- Whose data is on screen depends on the SOURCE: OpenSky,
                       adsb.lol and airplanes.live each require crediting, while
                       a local receiver (the user's own) and an HA entity (whose
                       upstream we cannot know) have nobody to credit —
                       flightAttribution owns that ladder. -->
                  ${(()=>{let t=e.store.flights?.enabled===!0&&e.flightsNow!=null&&e.store.layers2d?.flights!==!1?yt(e.store.flights.source):null;return t?I`
                    <div data-flight-attribution>
                      ${t.text}
                      <a href=${t.url} target="_blank" rel="noopener noreferrer"
                         style="color:inherit;pointer-events:auto;text-decoration:underline">${t.name}</a>
                    </div>`:P})()}
                </div>
              `:P}
              <diorama-zone-edit-bar .planner=${e}></diorama-zone-edit-bar>
              ${e.store.showFloorStats===!1?P:I`<div style="position:absolute;bottom:10px;right:10px;color:var(--text-dim);font-size:11px;
                          padding:2px 6px;pointer-events:none;
                          text-shadow:0 0 4px rgba(0,0,0,0.85),0 0 2px rgba(0,0,0,0.85)">
                ${t.name} — ${t.sensors.length} sensor${t.sensors.length===1?``:`s`},
                ${t.walls.length} wall${t.walls.length===1?``:`s`},
                ${D(t.w,e.store.imperial)} × ${D(t.d,e.store.imperial)}
              </div>`}
            </div>
            <diorama-toolbar .planner=${e}></diorama-toolbar>
          </div>
        </div>
        <diorama-floor-modal .planner=${e}></diorama-floor-modal>
        <diorama-entity-picker .planner=${e}></diorama-entity-picker>
        <diorama-light-config .planner=${e}></diorama-light-config>
        <diorama-media-config .planner=${e}></diorama-media-config>
        <diorama-alarm-modal .planner=${e}></diorama-alarm-modal>
        <diorama-thermostat-modal .planner=${e}></diorama-thermostat-modal>
        <diorama-flight-modal .planner=${e}></diorama-flight-modal>
        <diorama-settings-drawer .planner=${e}></diorama-settings-drawer>
      </div>
    `}};k([F()],$.prototype,`_connected`,void 0),k([M(`diorama-auth`)],$.prototype,`_auth`,void 0),k([M(`diorama-floor-modal`)],$.prototype,`_floorModal`,void 0),k([M(`diorama-entity-picker`)],$.prototype,`_entPicker`,void 0),k([M(`diorama-light-config`)],$.prototype,`_lightConfig`,void 0),k([M(`diorama-media-config`)],$.prototype,`_mediaConfig`,void 0),k([M(`diorama-alarm-modal`)],$.prototype,`_alarmModal`,void 0),k([M(`diorama-thermostat-modal`)],$.prototype,`_thermoModal`,void 0),k([M(`diorama-flight-modal`)],$.prototype,`_flightModal`,void 0),k([M(`diorama-settings-drawer`)],$.prototype,`_settings`,void 0),$=k([L(`diorama-app`)],$);
//# sourceMappingURL=app.js.map