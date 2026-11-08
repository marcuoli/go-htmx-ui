// Scoped appearance and progressive app-shell navigation. No framework runtime.
(() => {
 "use strict";
 const namespace=window.GoHTMXUI=window.GoHTMXUI||{};
 if(namespace.ui)return;
 const appSelector="[data-ui-app]",shellSelector="[data-ui-shell]";
 const apps=new Map(),shells=new Map();
 const activeSwaps=new Set(),pendingEvents=new Set();
 const dark=window.matchMedia?.("(prefers-color-scheme: dark)")||{matches:false};
 const narrow=window.matchMedia?.("(max-width: 899px)")||{matches:false};
 const choose=(value,allowed,fallback)=>allowed.includes(value)?value:fallback;
 const normalize=value=>({theme:choose(value.theme,["standard","ocean","forest"],"standard"),mode:choose(value.mode,["system","light","dark"],"system"),density:choose(value.density,["comfortable","compact"],"comfortable")});
 const read=root=>normalize({theme:root.dataset.uiTheme,mode:root.dataset.uiMode,density:root.dataset.uiDensity});
 const key=root=>root.dataset.uiStorageKey||"go-htmx-ui:appearance";
 const persistent=root=>root.dataset.uiPersist!=="false";
 const resolved=prefs=>prefs.mode==="system"?(dark.matches?"dark":"light"):prefs.mode;
 const collect=(root,selector)=>[...(root.matches?.(selector)?[root]:[]),...(root.querySelectorAll?.(selector)||[])];
 function stored(root,initial) {
  if(!persistent(root))return initial;
  try {
   const value=JSON.parse(window.localStorage.getItem(key(root)));
   if(!value||typeof value!=="object"||Array.isArray(value))return initial;
   return {theme:choose(value.theme,["standard","ocean","forest"],initial.theme),mode:choose(value.mode,["system","light","dark"],initial.mode),density:choose(value.density,["comfortable","compact"],initial.density)};
  } catch {return initial;}
 }
 function save(root,prefs) {
  if(persistent(root))try{window.localStorage.setItem(key(root),JSON.stringify(prefs));}catch{/* Storage can be disabled; appearance still works for this page. */}
 }
 function write(root,prefs) {
  for(const field of ["theme","mode","density"]) {
   const property="ui"+field[0].toUpperCase()+field.slice(1);
   if(root.dataset[property]!==prefs[field])root.dataset[property]=prefs[field];
  }
 }
 function syncControls(root,prefs) {
  for(const select of root.querySelectorAll("[data-ui-theme-select], [data-ui-mode-select]")) {
   if(select.closest(appSelector)!==root)continue;
   select.value=select.hasAttribute("data-ui-theme-select")?prefs.theme:prefs.mode;
   select.disabled=false;
  }
  const next=resolved(prefs)==="dark"?"light":"dark";
  for(const button of root.querySelectorAll("[data-ui-mode-toggle]")) {
   if(button.closest(appSelector)!==root)continue;
   const label=(next==="light"?button.dataset.uiLightLabel:button.dataset.uiDarkLabel)||`Switch to ${next} mode`;
   button.setAttribute("aria-label",label);button.setAttribute("title",label);
   for(const icon of button.querySelectorAll("[data-ui-mode-icon]"))icon.toggleAttribute("hidden",icon.dataset.uiModeIcon!==(next==="dark"?"moon":"sun"));
   button.disabled=false;
  }
 }
 function reconcile(root,{persist=false,force=false}={}) {
  const prefs=read(root),state=apps.get(root),mode=resolved(prefs);
  write(root,prefs);root.dataset.uiResolvedMode=mode;syncControls(root,prefs);
  const signature=JSON.stringify([prefs,mode]);
  if(persist)save(root,prefs);
  if(state)state.signature=signature;
  if(force||state?.lastEvent!==signature) {
   if(state)state.lastEvent=signature;
   if(activeSwaps.size)pendingEvents.add(root);
   else root.dispatchEvent(new CustomEvent("gohtmxui:theme",{bubbles:true,detail:{...prefs,resolvedMode:mode}}));
  }
  return {...prefs,resolvedMode:mode};
 }
 function enhanceApp(root,force=false) {
  if(!apps.has(root)) {
   const initial=read(root);
   apps.set(root,{initial});
   write(root,stored(root,initial));
  }
  return reconcile(root,{force});
 }
 function scoped(shell,selector) {return [...shell.querySelectorAll(selector)].find(node=>node.closest(shellSelector)===shell);}
 function enhanceShell(shell) {
  const toggle=scoped(shell,"[data-ui-shell-toggle]"),navigation=scoped(shell,"[data-ui-shell-nav]");
  if(!toggle||!navigation)return;
  if(!shells.has(shell))shells.set(shell,{open:false});
  const state=shells.get(shell),hidden=narrow.matches&&!state.open;
  toggle.hidden=!narrow.matches;
  // When a resize/close hides a focused link, put focus on its visible control.
  if(hidden&&navigation.contains(document.activeElement))toggle.focus();
  navigation.hidden=hidden;
  toggle.setAttribute("aria-expanded",String(!hidden));
 }
 function cleanup() {
  for(const root of apps.keys())if(!root.isConnected)apps.delete(root);
  for(const shell of shells.keys())if(!shell.isConnected)shells.delete(shell);
 }
 function init(root=document) {
  cleanup();
  if(activeSwaps.size)return;
  const roots=new Set(collect(root,appSelector)),parent=root.closest?.(appSelector);
  if(parent)roots.add(parent);
  for(const app of roots)enhanceApp(app);
  // A swapped header/toggle or nav can belong to an existing shell rather than
  // contain one. Reconcile that enclosing shell as well as newly inserted ones.
  const layouts=new Set(collect(root,shellSelector)),parentShell=root.closest?.(shellSelector);
  if(parentShell)layouts.add(parentShell);
  for(const shell of layouts)enhanceShell(shell);
 }
 function setAppearance(root,patch={}) {
  if(!root?.matches?.(appSelector))throw new TypeError("Use an App root for appearance settings");
  if(!apps.has(root))enhanceApp(root);
  write(root,normalize({...read(root),...patch}));
  return reconcile(root,{persist:true});
 }
 namespace.ui={init,setAppearance,getAppearance:root=>{
  if(!root?.matches?.(appSelector))throw new TypeError("Use an App root for appearance settings");
  const prefs=read(root);return {...prefs,resolvedMode:resolved(prefs)};
 }};
 // HTMX4 settling copies server attributes after insertion (#17). Enhancing
 // during that interval can lose saved choices and ECharts' DOM registration.
 // The final signal also fires on canceled/failed swaps; contexts distinguish
 // concurrent tasks without guessing a timeout or changing the HTMX runtime.
 document.addEventListener("htmx:before:swap",event=>{
  if(event.detail?.ctx)activeSwaps.add(event.detail.ctx);
 });
 document.addEventListener("htmx:finally:swap",event=>{
  activeSwaps.delete(event.detail?.ctx);
  if(activeSwaps.size)return;
  init();
  for(const root of pendingEvents)if(root.isConnected)reconcile(root,{force:true});
  pendingEvents.clear();
 });
 document.addEventListener("change",event=>{
  const select=event.target;
  if(!select?.matches?.("[data-ui-theme-select], [data-ui-mode-select]"))return;
  const root=select.closest(appSelector);if(!root)return;
  setAppearance(root,select.hasAttribute("data-ui-theme-select")?{theme:select.value}:{mode:select.value});
 });
 document.addEventListener("click",event=>{
  // closest includes SVG paths; native buttons supply Enter/Space activation.
  const appearance=event.target.closest?.("[data-ui-mode-toggle]");
  if(appearance) {
   const root=appearance.closest(appSelector);if(!root||appearance.disabled)return;
   setAppearance(root,{mode:resolved(read(root))==="dark"?"light":"dark"});return;
  }
  const toggle=event.target.closest?.("[data-ui-shell-toggle]");if(!toggle)return;
  const shell=toggle.closest(shellSelector);if(!shell)return;
  enhanceShell(shell);const state=shells.get(shell);if(!state)return;
  state.open=!state.open;enhanceShell(shell);
 });
 document.addEventListener("keydown",event=>{
  if(event.key!=="Escape"||event.target.closest?.("dialog[open]"))return;
  const shell=event.target.closest?.(shellSelector),state=shells.get(shell);
  if(!state?.open||!narrow.matches)return;
  event.preventDefault();state.open=false;enhanceShell(shell);scoped(shell,"[data-ui-shell-toggle]")?.focus();
 });
 const listen=(media,callback)=>media.addEventListener?media.addEventListener("change",callback):media.addListener?.(callback);
 listen(dark,()=>{cleanup();for(const root of apps.keys())if(read(root).mode==="system")reconcile(root,{force:true});});
 listen(narrow,()=>{cleanup();for(const [shell,state] of shells){if(!narrow.matches)state.open=false;enhanceShell(shell);}});
 window.addEventListener("storage",event=>{
  cleanup();for(const [root,state] of apps)if(persistent(root)&&(event.key===key(root)||event.key===null)) {
   write(root,stored(root,state.initial));reconcile(root);
  }
 });
 function start() {
  init();
  if(typeof MutationObserver!=="function")return;
  new MutationObserver(records=>{
   cleanup();
   if(activeSwaps.size)return;
   for(const record of records) {
    if(record.type==="attributes") {if(record.target.matches(appSelector))enhanceApp(record.target);continue;}
    for(const node of record.addedNodes) {
     if(node.nodeType!==1)continue;
     init(node);
     // Plain DOM insertions also initialize charts. Changes inside an engine's
     // own canvas tree do not cause another render or an observer loop.
     if(node.matches?.("[data-ui-echarts]")||node.querySelector?.("[data-ui-echarts]")) {
      const app=node.closest(appSelector);if(app)reconcile(app,{force:true});
     }
    }
   }
  }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["data-ui-theme","data-ui-mode","data-ui-density"]});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
