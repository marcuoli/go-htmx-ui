import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const echarts=require('../assets/echarts.min.js');

function actualRenderer(t,spec,{width=600,height=238}={}) {
 const instances=[];t.after(()=>{for(const chart of instances)if(!chart.isDisposed())chart.dispose()});
 const frame={getBoundingClientRect:()=>({width,height}),classList:{toggle(){},add(){}},nextElementSibling:{dataset:{uiEmptyMessage:'No data'},textContent:''}};
 const canvas={isConnected:true,dataset:{uiChart:JSON.stringify(spec)},parentElement:frame,matches:()=>true,querySelectorAll:()=>[],getAttribute:()=> 'Synthetic chart'};
 const window={echarts:{init(_host,_theme,options){const chart=echarts.init(null,null,{...options,renderer:'svg',ssr:true});instances.push(chart);return chart},getInstanceByDom:()=>null},addEventListener(){}};
 const context={window,document:{readyState:'complete',querySelectorAll:()=>[canvas],addEventListener(){}},getComputedStyle:()=>({fontFamily:'sans-serif',getPropertyValue:()=>''}),Intl,Map,JSON};
 vm.runInNewContext(fs.readFileSync(new URL('../assets/charts.js',import.meta.url),'utf8'),context);
 return {instances,canvas,api:window.GoHTMXUI.charts,update(value){canvas.dataset.uiChart=JSON.stringify(value);this.api.render(canvas)}};
}
for(const type of ['line','bar','doughnut'])test('official ECharts common bundle renders '+type+' with shared options',t=>{
 const f=actualRenderer(t,{type,labels:['A','B'],datasets:[{label:'Requests',data:[3,7],borderColor:'#58a6ff',backgroundColor:['#58a6ff','#fbbf24']}],compact:type==='doughnut'},{width:type==='doughnut'?24:800,height:type==='doughnut'?24:178});
 assert.equal(echarts.version,'6.1.0');assert.equal(f.instances.length,1);const chart=f.instances[0];
 const svg=chart.renderToSVGString();assert.ok(svg.includes('<path'),'missing real chart geometry');assert.ok(!svg.includes('NaN'),'invalid chart coordinates');
 assert.equal(chart.getWidth(),type==='doughnut'?24:800);assert.equal(chart.getHeight(),type==='doughnut'?24:178);
 f.update({type:'bar',horizontal:true,stacked:true,labels:['A'],datasets:[{label:'Input',data:[0]},{label:'Output',data:[null]}],format:'usd'});
 assert.equal(f.instances.length,1);assert.equal(chart.getOption().series.length,2);assert.equal(chart.getOption().xAxis[0].type,'value');
});
test('official engine keeps legend selection and removes old series across updates',t=>{
 const spec={type:'bar',stacked:true,labels:['A'],datasets:[{label:'Input',data:[3]},{label:'Output',data:[7]}]};
 const f=actualRenderer(t,spec),chart=f.instances[0];chart.dispatchAction({type:'legendUnSelect',name:'Input'});
 f.update({...spec,datasets:[{label:'Input',data:[4]}]});
 assert.equal(chart.getOption().series.length,1);assert.equal(chart.getOption().legend[0].selected.Input,false);
 f.api.destroy(f.canvas);assert.equal(chart.isDisposed(),true);
});

test('official engine aligns independent axes and removes obsolete secondary axes',t=>{
 const spec={type:'bar',stacked:true,labels:['A','B'],axes:[{id:'count',unit:'count',min:0,max:100,splitNumber:5},{id:'latency',unit:'ms',position:'right',min:0,max:10,splitNumber:5,alignTicks:true}],datasets:[{label:'Count',axis:'count',data:[50,60]},{label:'Latency',type:'line',axis:'latency',data:[5,null]}]};
 const f=actualRenderer(t,spec),chart=f.instances[0];
 assert.equal(chart.getOption().yAxis.length,2);assert.equal(chart.getOption().series[1].yAxisIndex,1);assert.equal(chart.getOption().series[1].stack,undefined);
 assert.ok(Math.abs(chart.convertToPixel({yAxisIndex:0},50)-chart.convertToPixel({yAxisIndex:1},5))<1,'independent half-scale ticks must align');
 f.update({type:'bar',horizontal:true,labels:['A'],datasets:[{label:'Count',data:[9]}]});assert.equal(chart.getOption().xAxis.length,1);assert.equal(chart.getOption().yAxis.length,1);assert.equal(chart.getOption().series.length,1);
});
test('official engine preserves real timestamp spacing and grouped legend selection',t=>{
 const start=1767225600000;
 const spec={type:'line',domain:{type:'time',min:start,max:start+600000},legend:{show:true},axes:[{id:'rate',unit:'qps'},{id:'latency',unit:'us',position:'right'}],datasets:[{label:'Rate',axis:'rate',legendGroup:'a',legendLabel:'Upstream A',data:[[start,1],[start+60000,null],[start+600000,4]]},{label:'Latency',axis:'latency',legendGroup:'a',legendLabel:'Upstream A',data:[[start,300],[start+600000,500]]}]};
 const f=actualRenderer(t,spec),chart=f.instances[0],x0=chart.convertToPixel({xAxisIndex:0},start),x1=chart.convertToPixel({xAxisIndex:0},start+60000),x10=chart.convertToPixel({xAxisIndex:0},start+600000);
 assert.ok(Math.abs((x1-x0)/(x10-x0)-0.1)<0.00001,'one-minute point incorrectly treated as an evenly spaced category');
 const key=chart.getOption().series[0].name;assert.equal(chart.getOption().series[1].name,key);chart.dispatchAction({type:'legendUnSelect',name:key});f.update({...spec,domain:{...spec.domain,max:start+1200000}});assert.equal(chart.getOption().legend[0].selected[key],false);
 assert.equal(chart.getOption().series[0].data[1][1],null);assert.ok(chart.renderToSVGString().includes('<svg'));
});

test('line samples reach the plot edges instead of inheriting bar-style category padding',t=>{
 const f=actualRenderer(t,{type:'line',labels:['A','B','C'],datasets:[{label:'Value',data:[1,2,3]}]}),chart=f.instances[0];
 const first=chart.convertToPixel({xAxisIndex:0},0),last=chart.convertToPixel({xAxisIndex:0},2),middleY=chart.convertToPixel({yAxisIndex:0},2);
 assert.equal(chart.containPixel({gridIndex:0},[first-2,middleY]),false,'unexpected left category padding');
 assert.equal(chart.containPixel({gridIndex:0},[last+2,middleY]),false,'unexpected right category padding');
});


test('official engine renders 1800-sample compact monitoring histories and updates in place',t=>{
 const start=1767225600000,data=Array.from({length:1800},(_,i)=>[start+i*2000,i===0?0:i%127===0?null:40+30*Math.sin(i/31)]);
 const spec={type:'line',locale:'pt_BR',timeZone:'America/Sao_Paulo',showAxisLabels:false,showPoints:false,domain:{type:'time'},axes:[{unit:'bytes/s',inputUnit:'MB/s',displayUnit:'MiB/s',scale:'binary',precision:2}],datasets:[{label:'Synthetic throughput',data,fill:true}]};
 const started=performance.now(),f=actualRenderer(t,spec,{width:420,height:130}),chart=f.instances[0];
 assert.equal(chart.getHeight(),130);assert.equal(chart.getOption().series[0].data.length,1800);assert.equal(chart.getOption().series[0].data[0][1],0);assert.equal(chart.getOption().series[0].data[127][1],null);assert.equal(chart.getOption().series[0].symbol,'none');
 let svg=chart.renderToSVGString();assert.ok(svg.includes('<path'));assert.ok(!svg.includes('NaN'));assert.ok(svg.length<300000,'unexpected dense-chart geometry expansion');
 const points=[...data.slice(1),[start+3600000,12.5]];f.update({...spec,datasets:[{...spec.datasets[0],data:points}]});assert.equal(f.instances.length,1);assert.equal(chart.getOption().series[0].data.at(-1)[1],12.5);assert.equal(chart.getOption().yAxis[0].axisLabel.formatter(12.5),'11,92 MiB/s');
 t.diagnostic('Synthetic 1800-point SVG init+serialize+update: '+(performance.now()-started).toFixed(1)+'ms; this is a local fit check, not a browser performance guarantee.');
});
