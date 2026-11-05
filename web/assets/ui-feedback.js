// Native modal controls and text-only notifications. No framework dependency.
(() => {
 "use strict";
 const ns=window.GoHTMXUI=window.GoHTMXUI||{};
 if(ns.feedback)return;
 const modals=new Map(),bound=new WeakSet(),toasts=new Map(),swaps=new Set();
 let backdrop=null;
 const collect=(root,selector)=>[...(root.matches?.(selector)?[root]:[]),...(root.querySelectorAll?.(selector)||[])];
 const tone=value=>["success","warning","danger"].includes(value)?value:"info";
 const heading=value=>({info:"Information",success:"Success",warning:"Warning",danger:"Error"}[value]);
 const duration=value=>Number.isFinite(Number(value))&&Number(value)>0?Math.max(1000,Math.min(Number(value),86400000)):0;
 const resolve=target=>typeof target==="string"?document.getElementById(target):target;
 function restore(opener) {if(programmatic(opener))opener.focus();}
 function openModal(target,opener=document.activeElement) {
  const dialog=resolve(target);
  if(!dialog?.matches?.("dialog[data-ui-modal]")||!dialog.isConnected||typeof dialog.showModal!=="function")return false;
  if(dialog.open)return true;
  if(!bound.has(dialog)) {
   bound.add(dialog);
   dialog.addEventListener("close",()=>{
    if(dialog.open)return; // A queued close can arrive after the same modal reopens.
    for(const node of collect(dialog,"[data-ui-toast]"))pause(node);
    const state=modals.get(dialog);modals.delete(dialog);restore(state?.opener);
   });
  }
  // Only native showModal supplies the top layer, inert background and focus
  // containment. Do not substitute a visually similar nonmodal open attribute.
  dialog.showModal();
  // Reopening a previously lower dialog changes native top-layer order.
  modals.delete(dialog);modals.set(dialog,{opener});init(dialog);return true;
 }
 function closeModal(target,value="") {
  const dialog=resolve(target);
  if(!dialog?.matches?.("dialog[data-ui-modal]")||!dialog.open)return false;
  for(const node of collect(dialog,"[data-ui-toast]"))pause(node);
  dialog.close(String(value));return true;
 }
 function pause(node) {
  const state=toasts.get(node);if(!state||state.timer===null)return;
  clearTimeout(state.timer);state.timer=null;state.remaining=Math.max(0,state.due-Date.now());
 }
 function resume(node) {
  const state=toasts.get(node);
  if(!state||!state.timed||state.timer!==null||document.hidden||!present(node)||state.hover||node.contains(document.activeElement))return;
  state.due=Date.now()+state.remaining;
  state.timer=setTimeout(()=>dismiss(node),state.remaining);
 }
 function present(node) {const dialog=node.closest("dialog");return !node.closest("[hidden]")&&(!dialog||dialog.open);}
 function visible(node) {return !!node?.isConnected&&!node.disabled&&!node.hidden&&(!node.getClientRects||node.getClientRects().length>0);}
 function programmatic(node) {return visible(node)&&typeof node.focus==="function"&&node.matches('a[href],button,input,select,textarea,[tabindex]');}
 function focusable(node) {return programmatic(node)&&node.tabIndex!==-1;}
 function dismiss(node) {
  if(!node?.matches?.("[data-ui-toast], [data-ui-alert]"))return false;
  const state=toasts.get(node),focused=node.contains(document.activeElement);
  let next;
  if(focused) {
   const scope=node.closest("dialog[open]")||node.closest("[data-ui-app]")||document;
   const controls=[...scope.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(focusable);
   const index=controls.indexOf(document.activeElement);
   // Saved openers may intentionally be outside the sequential tab order.
   next=[...controls.slice(index+1),state?.opener,...controls].find(n=>(n===state?.opener?programmatic(n):focusable(n))&&!node.contains(n));
  }
  pause(node);toasts.delete(node);
  node.dispatchEvent(new CustomEvent("gohtmxui:dismiss",{bubbles:true}));node.remove();
  if(focused&&next)next.focus();
  return true;
 }
 function cleanup() {
  for(const [node] of toasts) {
   if(!node.isConnected){pause(node);toasts.delete(node);}
   else if(!present(node))pause(node);
  }
  for(const [dialog,state] of modals)if(!dialog.isConnected) {
   modals.delete(dialog);if(dialog.open)dialog.close();restore(state.opener);
  }
 }
 function init(root=document) {
  cleanup();if(swaps.size)return;
  for(const button of collect(root,"[data-ui-modal-enable], [data-ui-dismiss-enable]")) {
   if(button.hasAttribute("data-ui-dismiss-enable")||typeof document.createElement("dialog").showModal==="function")button.disabled=false;
   button.removeAttribute("data-ui-modal-enable");button.removeAttribute("data-ui-dismiss-enable");
  }
  const announcements=new Map();
  for(const node of collect(root,"[data-ui-toast]")) {
   if(!node.isConnected||!present(node))continue;
   if(toasts.has(node)){resume(node);continue;}
   const milliseconds=duration(node.dataset.uiDuration);
   toasts.set(node,{remaining:milliseconds,timed:milliseconds>0,timer:null,hover:node.matches(":hover"),opener:document.activeElement});
   resume(node);
   const region=node.closest("[data-ui-toast-region]");if(!region)continue;
   const urgent=["warning","danger"].includes(node.dataset.uiTone);
   const live=region.querySelector(urgent?"[data-ui-toast-assertive]":"[data-ui-toast-polite]");
   if(live) {
    const messages=announcements.get(live)||[];
    messages.push(node.querySelector("[data-ui-message-text]")?.textContent||"");announcements.set(live,messages);
   }
  }
  for(const [live,messages] of announcements)live.textContent=messages.join(" ");
 }
 function element(tag,className,text) {
  const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=String(text);return node;
 }
 function defaultRegion() {
  const active=[...modals.keys()].filter(node=>node.isConnected&&node.open).at(-1);
  // Native dialogs live above the document. Keep their messages in that top
  // layer and never send a page toast into a closed dialog's hidden region.
  return [...(active||document).querySelectorAll("[data-ui-toast-region]")].find(region=>region.closest("dialog[data-ui-modal]")===(active||null));
 }
 function toast(options={},region=defaultRegion()) {
  if(!region?.matches?.("[data-ui-toast-region]")||!region.isConnected)throw new TypeError("Toast requires a connected ToastRegion; Page supplies one by default");
  const items=region.querySelector("[data-ui-toast-items]");if(!items)throw new TypeError("ToastRegion items container is missing");
  const variant=tone(options.tone),title=options.title?String(options.title):heading(variant);
  const node=element("div","ghtui-message ghtui-toast");
  node.dataset.uiToast="";node.dataset.uiTone=variant;node.dataset.uiDuration=String(duration(options.duration));
  node.setAttribute("role","group");node.setAttribute("aria-label",title);
  const icon=element("span","ghtui-message-icon",variant==="success"?"✓":variant==="info"?"i":"!");icon.setAttribute("aria-hidden","true");node.append(icon);
  const content=element("div","ghtui-message-content"),text=element("div","");text.dataset.uiMessageText="";
  text.append(element("p","ghtui-message-title",title));
  if(options.message)text.append(element("p","ghtui-message-text",options.message));
  content.append(text);node.append(content);
  const button=element("button","ghtui-dismiss");button.type="button";button.dataset.uiMessageDismiss="";button.setAttribute("aria-label",options.dismissLabel?String(options.dismissLabel):"Dismiss notification");
  const cross=element("span","","×");cross.setAttribute("aria-hidden","true");button.append(cross);node.append(button);
  items.append(node);init(node);return node;
 }
 ns.feedback={init,openModal,closeModal,toast,dismiss};
 document.addEventListener("click",event=>{
  const trigger=event.target.closest?.("[data-ui-modal-open]");
  if(trigger&&!trigger.disabled) {event.preventDefault();openModal(trigger.dataset.uiModalOpen,trigger);return;}
  const close=event.target.closest?.("[data-ui-modal-close]");
  if(close&&!close.disabled) {event.preventDefault();closeModal(close.closest("dialog[data-ui-modal]"),close.dataset.uiModalClose);return;}
  const dismissButton=event.target.closest?.("[data-ui-message-dismiss]");
  if(dismissButton) {event.preventDefault();dismiss(dismissButton.closest("[data-ui-toast], [data-ui-alert]"));return;}
  const dialog=event.target;
  const pressed=backdrop;backdrop=null;
  if(pressed===dialog&&dialog.dataset.uiModalBackdrop==="true"&&outside(dialog,event))closeModal(dialog);
 });
 function outside(dialog,event) {const r=dialog.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;}
 document.addEventListener("pointerdown",event=>{
  // A canceled/context-menu press must not turn a later content drag into
  // backdrop dismissal. Only a fresh primary-button outside press can arm it.
  backdrop=null;if(event.button!==0)return;
  const dialog=event.target;
  if(dialog?.matches?.("dialog[data-ui-modal][open]")&&outside(dialog,event))backdrop=dialog;
 });
 document.addEventListener("pointercancel",()=>{backdrop=null;});
 document.addEventListener("pointerover",event=>{const node=event.target.closest?.("[data-ui-toast]"),state=toasts.get(node);if(state&&!node.contains(event.relatedTarget)){state.hover=true;pause(node);}});
 document.addEventListener("pointerout",event=>{const node=event.target.closest?.("[data-ui-toast]"),state=toasts.get(node);if(state&&!node.contains(event.relatedTarget)){state.hover=false;resume(node);}});
 document.addEventListener("focusin",event=>{const node=event.target.closest?.("[data-ui-toast]");if(node)pause(node);});
 document.addEventListener("focusout",event=>{const node=event.target.closest?.("[data-ui-toast]");if(node)queueMicrotask(()=>resume(node));});
 document.addEventListener("visibilitychange",()=>{cleanup();for(const [node] of toasts)document.hidden?pause(node):resume(node);});
 // Match HTMX4's settling boundary before changing disabled/DOM state (#19).
 document.addEventListener("htmx:before:swap",event=>{if(event.detail?.ctx)swaps.add(event.detail.ctx);});
 document.addEventListener("htmx:finally:swap",event=>{swaps.delete(event.detail?.ctx);if(!swaps.size)init();});
 function start() {
  init();
  if(typeof MutationObserver==="function")new MutationObserver(records=>{
   cleanup();if(swaps.size)return;
   for(const record of records) {
    if(record.type==="attributes"){init(record.target);continue;}
    for(const node of record.addedNodes)if(node.nodeType===1)init(node);
   }
  }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["open","hidden"]});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
