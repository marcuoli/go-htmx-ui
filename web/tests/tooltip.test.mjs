import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,base} from './native-fixture.mjs';

function outsideFixture() {
 const f=fixture(),nodes=[],timers=new Map(),actions=[];let next=0;
 f.instances[0].dispatchAction=action=>actions.push(action);
 const target=node=>Object.assign(node,{listeners:new Map(),addEventListener(n,fn){this.listeners.set(n,fn)},removeEventListener(n){this.listeners.delete(n)}});
 target(f.host);f.host.closest=()=>null;f.host.getBoundingClientRect=()=>({left:10,top:100,width:600,height:44});
 const parent={append(node){nodes.push(node);node.isConnected=true}};
 Object.assign(f.context.document,{body:parent,documentElement:{clientWidth:800,clientHeight:600},createElement(){return target({style:{},hidden:true,attrs:new Map(),setAttribute(n,v){this.attrs.set(n,v)},remove(){this.isConnected=false;nodes.splice(nodes.indexOf(this),1)},contains(n){return n===this},getBoundingClientRect(){return {width:200,height:126}},showPopover(){this.open=true},hidePopover(){this.open=false}})}});
 f.context.setTimeout=fn=>{timers.set(++next,fn);return next};f.context.clearTimeout=id=>timers.delete(id);
 f.context.innerWidth=800;f.context.innerHeight=600;
 return Object.assign(f,{nodes,timers,actions,flush(){for(const [id,fn] of [...timers]){timers.delete(id);fn()}}});
}
const metadata={tooltipOutside:true,tooltip:[{seriesId:'requests',values:[{label:'Rate',format:{unit:'data-rate',inputUnit:'MiB/s',displayUnit:'MiB/s',precision:4}}]}]};
const params=[{seriesIndex:0,name:'<img src=x onerror=attack()>',seriesName:'Read',value:1.234567}];
test('outside tooltip is opt-in plain text, formatted exactly, viewport bounded and retains the instance',()=>{
 const f=outsideFixture(),chart=f.instances[0];f.host.setAttribute('aria-describedby','existing');f.set(base(),metadata);
 assert.equal(f.instances.length,1);assert.equal(f.nodes.length,1);
 const tip=f.nodes[0];assert.equal(chart.option.tooltip.renderMode,'richText');
 assert.equal(chart.option.tooltip.formatter(params),'');chart.option.tooltip.position([599,20]);
 assert.match(tip.textContent,/<img src=x onerror=attack\(\)>/);assert.match(tip.textContent,/1\.2346 MiB\/s/);assert.equal(tip.innerHTML,undefined);
 assert.equal(tip.hidden,false);assert.equal(tip.style.left,'588px');assert.equal(tip.style.top,'132px');
 assert.match(f.host.getAttribute('aria-describedby'),/^existing /);
 chart.handlers.hidetip();assert.equal(f.timers.size,1);tip.listeners.get('pointerenter')();assert.equal(f.timers.size,0);
 chart.handlers.hidetip();f.flush();assert.equal(tip.hidden,false);tip.listeners.get('pointerleave')();f.flush();assert.equal(tip.hidden,true);assert.equal(f.host.getAttribute('aria-describedby'),'existing');
 f.cleanup();assert.equal(f.nodes.length,0);assert.equal(f.host.listeners.size,0);assert.equal(f.timers.size,0);
});
test('outside tooltip hides stale data on resize/loading/theme and removes owned nodes when disabled',()=>{
 const f=outsideFixture();f.set(base(),metadata);const chart=f.instances[0],tip=f.nodes[0];
 const show=()=>{chart.option.tooltip.formatter(params);chart.option.tooltip.position([100,10])};
 show();f.resize(800,44);assert.equal(tip.hidden,true);
 assert.equal(f.actions.at(-1).type,'hideTip');
 show();f.set(base(),{...metadata,loading:true});assert.equal(tip.hidden,true);
 f.set(base(),metadata);show();f.setTheme('#123456');f.events['gohtmxui:theme']();assert.equal(tip.hidden,true);assert.equal(f.instances.length,1);
 f.set(base(),{});assert.equal(f.nodes.length,0);assert.equal(f.instances.length,1);f.cleanup();
});
test('outside tooltip safely replaces nested native templates and handles scalar fallback',()=>{
 const f=outsideFixture(),option=base();option.tooltip={formatter:'<script>attack()</script>'};option.series[0].tooltip={formatter:'unsafe',renderMode:'html'};
 f.set(option,{tooltipOutside:true});const c=f.instances[0],tip=f.nodes[0];
 c.option.series[0].tooltip.formatter(params);c.option.series[0].tooltip.position([20,20]);
 assert.equal(c.option.series[0].tooltip.renderMode,'richText');assert.match(tip.textContent,/1\.234567/);assert.doesNotMatch(tip.textContent,/<script>/);f.cleanup();
});
test('outside flag rejects non-booleans without leaking a native chart or popup',()=>{
 const f=outsideFixture();f.set(base(),{tooltipOutside:'yes'});assert.equal(f.instances[0].disposed,true);assert.equal(f.nodes.length,0);
});
test('outside tooltip focus survives native hide requests and Escape closes it',()=>{
 const f=outsideFixture();f.set(base(),metadata);const c=f.instances[0],tip=f.nodes[0];c.option.tooltip.formatter(params);c.option.tooltip.position([100,10]);
 tip.listeners.get('focusin')();c.handlers.hidetip();f.flush();assert.equal(tip.hidden,false);
 tip.listeners.get('keydown')({key:'Escape'});assert.equal(tip.hidden,true);f.cleanup();
});
test('Escape dismisses pointer-opened tooltips with keyboard focus outside the popup',()=>{
 const f=outsideFixture();f.set(base(),metadata);const c=f.instances[0],tip=f.nodes[0];c.option.tooltip.formatter(params);c.option.tooltip.position([100,10]);
 let prevented=false;f.events.keydown({key:'Escape',preventDefault(){prevented=true}});assert.equal(tip.hidden,true);assert.equal(prevented,true);
 prevented=false;f.events.keydown({key:'Escape',preventDefault(){prevented=true}});assert.equal(prevented,false);f.cleanup();
});
