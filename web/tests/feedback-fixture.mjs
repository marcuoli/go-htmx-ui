import fs from 'node:fs';
import vm from 'node:vm';
import {uiFixture} from './ui-fixture.mjs';

// Native layout, inertness and focus containment are checked in Edge. This
// boundary fixture supplies a deterministic clock for notification lifetimes.
export function feedbackFixture() {
 const f=uiFixture(),{Node,document,context,tree}=f;
 let now=0,sequence=0;const timers=new Map(),microtasks=[];
 Node.prototype.matches=function(selector){return selector.split(',').some(part=>{
  part=part.trim();if(part===':hover')return false;
  const tag=part.match(/^[a-z]+/)?.[0];if(tag&&this.tag!==tag)return false;
  return [...part.matchAll(/\[([^\]=]+)(?:="([^"]*)")?\]/g)].every(([,name,value])=>this.hasAttribute(name)&&(value===undefined||this.getAttribute(name)===value));
 });};
 Node.prototype.removeAttribute=function(name){if(name.startsWith('data-'))delete this.dataset[name.slice(5).replace(/-([a-z])/g,(_m,c)=>c.toUpperCase())];else delete this.attrs[name];};
 const connected=(node,value)=>{node.isConnected=value;node.children.forEach(child=>connected(child,value));};
 Node.prototype.remove=function(){this.parentElement.children=this.parentElement.children.filter(n=>n!==this);this.parentElement=null;connected(this,false);};
 Node.prototype.addEventListener=function(type,callback){((this.listeners??={})[type]??=[]).push(callback);};
 const originalDispatch=Node.prototype.dispatchEvent;
 Node.prototype.dispatchEvent=function(event){for(const fn of this.listeners?.[event.type]||[])fn(event);originalDispatch.call(this,event);};
 Node.prototype.showModal=function(){this.open=true;this.attrs.open='';};
 Node.prototype.close=function(value=''){this.open=false;this.returnValue=value;delete this.attrs.open;microtasks.push(()=>this.dispatchEvent({type:'close'}));};
 Object.defineProperty(Node.prototype,'textContent',{configurable:true,get(){return (this.text||'')+this.children.map(n=>n.textContent).join(' ');},set(value){this.text=String(value);this.children=[];}});
 document.getElementById=id=>tree.querySelectorAll('[id]').find(n=>n.getAttribute('id')===id)||null;
 document.querySelector=s=>tree.querySelector(s);document.createElement=tag=>new Node({},tag);
 document.hidden=false;
 context.queueMicrotask=fn=>microtasks.push(fn);
 context.Date={now:()=>now};context.setTimeout=(fn,delay)=>{const id=++sequence;timers.set(id,{fn,due:now+delay});return id;};context.clearTimeout=id=>timers.delete(id);
 const region=(parent=f.root)=>{
  const root=parent.append(new Node({'data-ui-toast-region':''}));
  const items=root.append(new Node({'data-ui-toast-items':''}));
  const polite=root.append(new Node({'data-ui-toast-polite':''})),assertive=root.append(new Node({'data-ui-toast-assertive':''}));
  return {root,items,polite,assertive};
 };
 const pageRegion=region();
 const source=fs.readFileSync(new URL('../assets/ui-feedback.js',import.meta.url),'utf8');vm.runInContext(source,context);
 return {...f,feedback:context.GoHTMXUI.feedback,region,pageRegion,timers,flush(){while(microtasks.length)microtasks.shift()();},
  tick(ms){const end=now+ms;for(let i=0;i<1000;i++){const entry=[...timers].filter(([,t])=>t.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];if(!entry)break;now=entry[1].due;timers.delete(entry[0]);entry[1].fn();}now=end;},
  reloadFeedback:()=>vm.runInContext(source,context)};
}
