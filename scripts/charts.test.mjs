import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function fixture() {
 const events={},instances=[],registered=new Map();let theme='#8b949e';
 const canvas={dataset:{uiChart:JSON.stringify({type:'line',labels:['A'],datasets:[{data:[1]}]})},matches:s=>s.includes('canvas'),parentElement:{classList:{toggle(_name,value){this.empty=!!value},add(){this.empty=true}},nextElementSibling:{textContent:'No data'}},querySelectorAll:()=>[]};
 class Chart {static getChart(c){return registered.get(c)}constructor(c,config){if(registered.has(c))throw new Error("Canvas is already in use");registered.set(c,this);this.canvas=c;this.config=config;this.data=config.data;this.options=config.options;this.updates=0;this.destroyed=false;instances.push(this);if(config.data.datasets.some(d=>d.type==="bogus"))throw new Error("Invalid dataset type")}update(mode){assert.equal(mode,'none');this.updates++}destroy(){this.destroyed=true;registered.delete(this.canvas)}}
 const document={readyState:'complete',querySelectorAll:()=>[canvas],addEventListener:(name,fn)=>events[name]=fn};
 const context={Chart,document,Intl,Map,JSON,getComputedStyle:()=>({fontFamily:'system-ui',getPropertyValue:name=>name==='--ghtui-muted'?theme:''})};context.window=context;
 vm.runInNewContext(fs.readFileSync('assets/charts.js','utf8'),context);
 return {api:context.GoHTMXUI?.charts,instances,canvas,events,setTheme:value=>theme=value};
}
test('reuses canvas and chart, recomputes data/options/theme, skips unchanged snapshots',()=>{
 const f=fixture();assert.ok(f.api,'missing chart controller');const first=f.instances[0];
 f.api.render(f.canvas);assert.equal(first.updates,0);
 f.canvas.dataset.uiChart=JSON.stringify({type:'line',labels:['B'],datasets:[{data:[2]}],stacked:true,horizontal:true,format:'usd'});
 f.api.render(f.canvas);assert.equal(f.instances.length,1);assert.equal(first.updates,1);assert.equal(first.options.indexAxis,'y');assert.equal(first.options.plugins.legend.display,true);assert.ok(first.options.scales.x.ticks.callback);
 f.setTheme('#111');f.api.render(f.canvas);assert.equal(first.updates,2);assert.equal(first.options.color,'#111');
});
test('supports empty, malformed input, chart type transitions and subtree cleanup',()=>{
 const f=fixture();assert.ok(f.api);const first=f.instances[0];
 f.canvas.dataset.uiChart=JSON.stringify({type:'doughnut',labels:['A'],datasets:[{data:[2]}],compact:true});f.api.render(f.canvas);
 assert.equal(first.destroyed,true);assert.equal(f.instances[1].options.plugins.legend.display,false);assert.equal(f.instances[1].options.datasets.doughnut.borderWidth,0);
 f.canvas.dataset.uiChart='invalid';f.api.render(f.canvas);assert.equal(f.canvas.parentElement.classList.empty,true);assert.equal(f.instances[1].destroyed,true);
 f.canvas.dataset.uiChart=JSON.stringify({type:'bar',empty:true});f.api.render(f.canvas);assert.equal(f.instances.length,2);
 f.canvas.dataset.uiChart=JSON.stringify({type:'bar',labels:['A'],datasets:[{data:[1]}]});f.api.render(f.canvas);
 f.events['htmx:beforeCleanupElement']({detail:{elt:f.canvas}});assert.equal(f.instances[2].destroyed,true);
});

test('recovers when Chart constructor registers an instance before throwing',()=>{
 const f=fixture();f.canvas.dataset.uiChart=JSON.stringify({type:'bar',labels:['A'],datasets:[{type:'bogus',data:[1]}]});
 f.api.render(f.canvas);assert.equal(f.canvas.parentElement.classList.empty,true);
 assert.equal(f.instances[1].destroyed,true,'partially constructed chart must be released');
 f.canvas.dataset.uiChart=JSON.stringify({type:'bar',labels:['A'],datasets:[{data:[1]}]});f.api.render(f.canvas);
 assert.equal(f.instances.length,3);assert.equal(f.canvas.parentElement.classList.empty,false);
});
