import fs from 'node:fs';
import vm from 'node:vm';

// A small DOM boundary fixture; layout/CSS/focus are also exercised in a browser.
export function uiFixture({saved,storageFails=false,dark=false,narrow=false,initial={}}={}) {
 const events={},observers=[],storage=new Map(),media={};
 if(saved!==undefined)storage.set('go-htmx-ui:appearance',typeof saved==='string'?saved:JSON.stringify(saved));
 let document;
 const dataKey=name=>name.slice(5).replace(/-([a-z])/g,(_m,c)=>c.toUpperCase());
 class Node {
  constructor(attrs={},tag='div') {this.attrs={};this.dataset={};this.children=[];this.events=[];this.isConnected=true;this.nodeType=1;this.tag=tag;for(const [k,v]of Object.entries(attrs))this.setAttribute(k,v);}
  setAttribute(name,value) {if(name.startsWith('data-'))this.dataset[dataKey(name)]=String(value);else this.attrs[name]=String(value);}
  hasAttribute(name) {return name.startsWith('data-')?dataKey(name) in this.dataset:name in this.attrs;}
  getAttribute(name) {return name.startsWith('data-')?this.dataset[dataKey(name)]:this.attrs[name];}
  matches(selector) {return selector.split(',').some(s=>{s=s.trim();if(s.startsWith('dialog')&&this.tag!=='dialog')return false;return [...s.matchAll(/\[([^\]=]+)(?:="([^"]*)")?\]/g)].every(([,name,value])=>this.hasAttribute(name)&&(value===undefined||this.getAttribute(name)===value));});}
  querySelectorAll(selector) {return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector) {return this.querySelectorAll(selector)[0]||null;}
  closest(selector) {for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
  append(child) {child.parentElement=this;this.children.push(child);return child;}
  contains(child) {for(let node=child;node;node=node.parentElement)if(node===this)return true;return false;}
  focus() {document.activeElement=this;}
  dispatchEvent(event) {this.events.push(event);event.target=this;if(event.bubbles)for(const fn of events[event.type]||[])fn(event);}
 }
 const tree=new Node();
 document={readyState:'complete',documentElement:tree,activeElement:null,querySelectorAll:s=>tree.querySelectorAll(s),addEventListener:(name,fn)=>(events[name]??=[]).push(fn)};
 const app=(config={})=>new Node({'data-ui-app':'','data-ui-theme':config.theme||'standard','data-ui-mode':config.mode||'system','data-ui-density':config.density||'comfortable',...(config.noPersist?{'data-ui-persist':'false'}:{}),...(config.key?{'data-ui-storage-key':config.key}:{})});
 const root=tree.append(app(initial));
 const switcher=parent=>{const group=parent.append(new Node());const theme=group.append(new Node({'data-ui-theme-select':''},'select'));const mode=group.append(new Node({'data-ui-mode-select':''},'select'));theme.disabled=mode.disabled=true;return {group,theme,mode};};
 const controls=switcher(root);
 const shell=root.append(new Node({'data-ui-shell':''}));
 const toggle=shell.append(new Node({'data-ui-shell-toggle':''},'button'));
 const navigation=shell.append(new Node({'data-ui-shell-nav':''}));
 const link=navigation.append(new Node({},'a'));
 class MutationObserver {constructor(fn){this.callback=fn;observers.push(this)}observe(){}}
 class CustomEvent {constructor(type,options){this.type=type;Object.assign(this,options)}}
 const context={document,MutationObserver,CustomEvent,console,matchMedia:query=>{
  const value={matches:query.includes('color-scheme')?dark:narrow,callbacks:[],addEventListener(_name,fn){this.callbacks.push(fn)}};media[query]=value;return value;
 },addEventListener:(name,fn)=>(events['window:'+name]??=[]).push(fn)};
 context.window=context;
 Object.defineProperty(context,'localStorage',{get(){if(storageFails)throw Error('Blocked storage');return {getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}}});
 const source=fs.readFileSync(new URL('../assets/ui-runtime.js',import.meta.url),'utf8');
 vm.createContext(context);vm.runInContext(source,context);
 const fire=(name,target,extra={})=>{const event={target,...extra,preventDefault(){this.prevented=true}};for(const fn of events[name]||[])fn(event);return event;};
 return {root,controls,shell,toggle,navigation,link,storage,document,context,events,tree,app,switcher,Node,api:context.GoHTMXUI.ui,fire,
  mutate:records=>observers.forEach(o=>o.callback(records)),reloadScript:()=>vm.runInContext(source,context),
  media(darkOrNarrow,value){const query=darkOrNarrow==='dark'?'(prefers-color-scheme: dark)':'(max-width: 899px)';media[query].matches=value;for(const fn of media[query].callbacks)fn();}};
}
