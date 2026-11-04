import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './fixture.mjs';

test('uses ECharts once, skips identical snapshots and updates options/data/theme in place',()=>{
 const f=fixture();assert.equal(f.instances.length,1);const first=f.instances[0];
 assert.equal(first.config.renderer,'canvas');assert.equal(first.config.width,600);assert.equal(first.config.height,238);
 f.api.render(f.canvas);assert.equal(first.updates.length,1);
 f.set({type:'line',labels:['B'],datasets:[{label:'Requests',data:[2],fill:true,tension:0.25,borderColor:'#123456'}]});
 assert.equal(f.instances.length,1);assert.equal(first.updates.length,2);assert.equal(first.option.series[0].data[0],2);assert.equal(first.option.series[0].smooth,0.25);assert.ok(first.option.series[0].areaStyle);
 f.setTheme('#111');f.api.render(f.canvas);assert.equal(first.updates.length,3);assert.equal(first.option.textStyle.color,'#111');
 assert.equal(first.option.animation,false);for(const call of first.updates){assert.equal(call.flags.notMerge,true);assert.equal(call.flags.silent,true)}
});

test('maps stacked horizontal bars, preserves nulls/zero and removes obsolete series',()=>{
 const f=fixture();f.set({type:'bar',labels:['A','B'],horizontal:true,stacked:true,datasets:[{label:'Input',data:[0,null],backgroundColor:'#abc'},{label:'Output',data:[3,4],backgroundColor:'#def'}]});
 const option=f.instances[0].option;assert.equal(option.xAxis.type,'value');assert.equal(option.yAxis.type,'category');assert.equal(option.yAxis.inverse,true);assert.equal(option.legend.show,true);
 assert.equal(JSON.stringify(option.series[0].data),'[0,null]');assert.equal(option.series[0].stack,option.series[1].stack);assert.equal(option.series[0].itemStyle.color,'#abc');
 f.set({type:'line',labels:['A'],datasets:[{data:[9]}]});assert.equal(f.instances.length,1);assert.equal(f.instances[0].option.series.length,1);assert.equal(f.instances[0].option.series[0].type,'line');
});

test('maps compact doughnut rings without borders, labels or excess margins',()=>{
 const f=fixture();f.set({type:'doughnut',compact:true,labels:['Done','Failed'],datasets:[{data:[9,1],backgroundColor:['#0f0','#f00']}]});
 const o=f.instances[0].option;assert.equal(o.series[0].type,'pie');assert.equal(o.legend.show,false);assert.equal(o.series[0].itemStyle.borderWidth,0);assert.equal(o.series[0].label.show,false);
 assert.equal(o.series[0].radius[0],'72%');assert.equal(o.series[0].radius[1],'100%');assert.equal(o.series[0].data[1].itemStyle.color,'#f00');
});

test('currency/bounds tooltips preserve missing/tiny/zero values and render as text',()=>{
 const f=fixture();f.set({type:'line',format:'usd',labels:['<img src=x>'],bounds:['2026-01-01 / 2026-01-02'],datasets:[{label:'<script>cost</script>',data:[null]}]});
 const tooltip=f.instances[0].option.tooltip;assert.equal(tooltip.renderMode,'richText');
 const text=tooltip.formatter([{name:'<img src=x>',seriesName:'<script>cost</script>',value:null,dataIndex:0}]);assert.ok(text.includes('Unavailable'));assert.ok(text.includes('2026-01-01 / 2026-01-02'));
 assert.ok(tooltip.formatter([{name:'A',seriesName:'Cost',value:0,dataIndex:0}]).includes('$0.00'));
 assert.ok(tooltip.formatter([{name:'A',seriesName:'Cost',value:0.0000001,dataIndex:0}]).includes('< USD 0.0001'));
});

test('resizes with parent frames and initializes hidden widgets when they become visible',()=>{
 const f=fixture({width:0,height:0});assert.equal(f.instances.length,0);assert.equal(f.observers.length,1);
 f.resize(400,178);assert.equal(f.instances.length,1);assert.equal(f.instances[0].config.height,178);
 f.resize(750,200);assert.equal(f.instances[0].resizes.at(-1).width,750);assert.equal(f.instances[0].resizes.at(-1).height,200);
 f.resize(0,0);assert.equal(f.instances[0].resizes.at(-1).width,750);assert.equal(f.instances[0].disposed,false);
});

test('disposes chart and observer on empty/error/HTMX cleanup, then recovers',()=>{
 const f=fixture();const first=f.instances[0];f.set({type:'bar',empty:true});assert.equal(first.disposed,true);assert.equal(f.observers[0].disconnected,true);assert.equal(f.frame.classList.empty,true);
 f.canvas.dataset.uiChart='invalid';f.api.render(f.canvas);assert.equal(f.frame.classList.empty,true);
 f.set({type:'bar',labels:['A'],datasets:[{data:[2]}]});assert.equal(f.instances.length,2);assert.equal(f.frame.classList.empty,false);assert.equal(f.frame.nextElementSibling.textContent,'No data');
 f.events['htmx:beforeCleanupElement']({detail:{elt:f.canvas}});assert.equal(f.instances[1].disposed,true);assert.equal(f.observers.at(-1).disconnected,true);
});

test('cleans partially initialized or failed chart instances and retries valid data',()=>{
 for(const failure of ['init','option']) {
  const f=fixture();f.api.destroy(f.canvas);f.fail(failure);f.set({type:'bar',labels:['A'],datasets:[{data:[3]}]});
  assert.equal(f.instances[1].disposed,true);assert.equal(f.frame.classList.empty,true);assert.equal(f.observers.at(-1).disconnected,true);
  f.api.render(f.canvas);assert.equal(f.instances.length,3);assert.equal(f.frame.classList.empty,false);
 }
});

test('window resize fallback and detached-node cleanup release their resources',()=>{
 const f=fixture({observe:false});f.frame.clientWidth=810;f.events['window:resize']();assert.equal(f.instances[0].resizes.at(-1).width,810);
 f.canvas.isConnected=false;f.api.render();assert.equal(f.instances[0].disposed,true);
});

test('binds mixed count bars and unstacked latency line to independent axes',()=>{
 const f=fixture();f.set({type:'bar',stacked:true,labels:['A','B'],axes:[{id:'count',unit:'count',min:0,max:100,splitNumber:5},{id:'latency',unit:'ms',position:'right',precision:2,min:0,max:20,alignTicks:true,splitNumber:5}],datasets:[{label:'Success',axis:'count',data:[20,30]},{label:'Errors',axis:'count',data:[1,2]},{label:'Latency',type:'line',axis:'latency',data:[2.5,null]}]});
 const o=f.instances[0].option;assert.equal(o.yAxis.length,2);assert.equal(o.yAxis[1].position,'right');assert.equal(o.yAxis[1].alignTicks,true);assert.equal(o.yAxis[1].max,20);assert.equal(o.yAxis[1].splitNumber,5);
 assert.equal(o.series[0].yAxisIndex,0);assert.equal(o.series[2].yAxisIndex,1);assert.equal(o.series[0].stack,o.series[1].stack);assert.equal(o.series[2].stack,undefined);
 assert.ok(o.yAxis[1].axisLabel.formatter(1.234).includes('1.23 ms'));
 const tip=o.tooltip.formatter([{name:'A',seriesName:'Success',seriesIndex:0,value:20,dataIndex:0},{name:'A',seriesName:'Latency',seriesIndex:2,value:2.5,dataIndex:0}]);assert.ok(tip.includes('Latency: 2.5 ms'));
});

test('time axes sort real timestamps, preserve elapsed spacing/null gaps and explicit ranges',()=>{
 const f=fixture();f.set({type:'line',domain:{type:'time',min:'2026-01-01T00:00:00Z',max:'2026-01-01T00:10:00Z'},datasets:[{label:'Rate',unit:'qps',precision:2,data:[['2026-01-01T00:10:00Z',3.25],['2026-01-01T00:00:00Z',0],['2026-01-01T00:01:00Z',null]]}]});
 const o=f.instances[0].option;assert.equal(o.xAxis.type,'time');assert.equal(o.xAxis.max-o.xAxis.min,600000);
 assert.equal(o.series[0].data[1][0]-o.series[0].data[0][0],60000);assert.equal(o.series[0].data[1][1],null);assert.equal(o.series[0].data[2][0]-o.series[0].data[1][0],540000);assert.equal(o.series[0].connectNulls,false);
 assert.ok(o.tooltip.formatter([{seriesIndex:0,value:[1767225600000,3.25],name:'A',dataIndex:0}]).includes('3.25 QPS'));
});

test('group legends toggle related units together and preserve grouped selections',()=>{
 const f=fixture();const spec={type:'bar',stacked:true,legend:{show:true},labels:['A'],axes:[{id:'count',unit:'count'},{id:'latency',unit:'us'}],datasets:[{label:'Queries',legendGroup:'upstream-a',legendLabel:'Upstream A',axis:'count',data:[10]},{label:'Latency',type:'line',legendGroup:'upstream-a',legendLabel:'Upstream A',axis:'latency',data:[800]}]};
 f.set(spec);const chart=f.instances[0],o=chart.option,key=o.series[0].name;assert.equal(o.series[1].name,key);assert.equal(o.legend.data.length,1);assert.equal(o.legend.formatter(key),'Upstream A');
 chart.option.legend.selected={[key]:false};f.set({...spec,labels:['B']});assert.equal(chart.option.legend.selected[key],false);
 const tip=chart.option.tooltip.formatter([{name:'B',seriesIndex:1,seriesName:key,value:800,dataIndex:0}]);assert.ok(tip.includes('Upstream A / Latency'));assert.ok(tip.includes('800 µs'),tip);
});

test('legend visibility, explicit stack overrides and pre-binned bucket context are declarative',()=>{
 const f=fixture();f.set({type:'bar',stacked:true,legend:{show:false},labels:['0-5 ms','5-10 ms'],bounds:['[0,5)','[5,10)'],datasets:[{label:'Samples',data:[0,7],stack:false}]});
 const o=f.instances[0].option;assert.equal(o.legend.show,false);assert.equal(o.series[0].stack,undefined);assert.ok(o.tooltip.formatter([{name:'5-10 ms',seriesIndex:0,value:7,dataIndex:1}]).includes('[5,10)'));
});

test('rejects ambiguous timestamps, unknown axes/units, mismatched units and invalid ranges safely',()=>{
 for(const extra of [
  {domain:{type:'time'},datasets:[{data:[['2026-01-01 00:00:00',1]]}]},
  {datasets:[{axis:'missing',data:[1]}]},
  {axes:[{id:'a',unit:'unknown'}]},
  {axes:[{id:'a',unit:'ms'}],datasets:[{axis:'a',unit:'qps',data:[1]}]},
  {axes:[{id:'a',min:10,max:1}]},
  {axes:[{id:'a',precision:99}]}
 ]) {
  const f=fixture();f.set({type:'line',labels:['A'],datasets:[{data:[1]}],...extra});assert.equal(f.frame.classList.empty,true);assert.equal(f.instances[0].disposed,true);
 }
});

test('color declarations cannot inject engine image/pattern objects',()=>{
 for(const dataset of [{data:[1],backgroundColor:{image:'https://example.invalid/image.png'}},{data:[1],borderColor:{image:'https://example.invalid/image.png'}},{data:[1],backgroundColor:[{image:'https://example.invalid/image.png'}]}]) {
  const f=fixture();f.set({type:'bar',labels:['A'],datasets:[dataset]});assert.equal(f.frame.classList.empty,true);assert.equal(f.instances[0].disposed,true);
 }
});

test('an initialized chart applies the latest deferred snapshot when revealed',()=>{
 const f=fixture(),first=f.instances[0];f.resize(0,0);f.set({type:'bar',labels:['B'],datasets:[{data:[99]}]});
 assert.equal(first.updates.length,1,'hidden chart should defer drawing');f.resize(700,178);
 assert.equal(f.instances.length,1);assert.equal(first.option.series[0].type,'bar');assert.equal(first.option.series[0].data[0],99);assert.equal(first.resizes.at(-1).width,700);
});
test('category and dataset labels cannot carry native engine options',()=>{
 for(const spec of [
  {type:'bar',labels:[{value:'A',textStyle:{backgroundColor:{image:'https://example.invalid/image.png'}}}],datasets:[{label:'Value',data:[1]}]},
  {type:'bar',labels:['A'],datasets:[{label:{name:'Value',icon:'image://https://example.invalid/image.png'},data:[1]}]}
 ]) {
  const f=fixture();f.set(spec);assert.equal(f.frame.classList.empty,true);assert.equal(f.instances[0].disposed,true);assert.equal(f.instances.length,1);
 }
});

test('storage scaling distinguishes binary/decimal input and preserves raw axis values',()=>{
 const f=fixture();
 for(const [axis,n,text] of [
  [{unit:'bytes',scale:'binary'},1073741824,'1 GiB'],
  [{unit:'bytes',scale:'binary'},2**50,'1 PiB'],
  [{unit:'bytes',scale:'decimal'},1e9,'1 GB'],
  [{unit:'bytes',scale:'binary',inputUnit:'GB',displayUnit:'GiB',precision:2},1,'0.93 GiB'],
  [{unit:'bytes',scale:'binary'},-1024,'-1 KiB']
 ]) {
  f.set({type:'line',labels:['A'],axes:[axis],datasets:[{label:'Storage',data:[n]}]});
  const o=f.instances[0].option;assert.equal(o.yAxis.axisLabel.formatter(n),text);
  assert.ok(o.tooltip.formatter([{seriesIndex:0,value:n,dataIndex:0}]).includes(text));
  assert.equal(o.series[0].data[0],n,'display conversion must not mutate values');
 }
});

test('MB/s input is neither double-scaled nor relabeled as MiB/s',()=>{
 const f=fixture();
 for(const [scale,displayUnit,text] of [['decimal','MB/s','12.5 MB/s'],['binary','MiB/s','11.92 MiB/s']]) {
  f.set({type:'line',labels:['A'],datasets:[{label:'Network',unit:'bytes/s',inputUnit:'MB/s',displayUnit,scale,precision:2,data:[12.5,0,null]}]});
  const o=f.instances[0].option;assert.equal(o.yAxis.axisLabel.formatter(12.5),text);assert.equal(o.series[0].data[1],0);assert.equal(o.series[0].data[2],null);
  assert.ok(o.tooltip.formatter([{seriesIndex:0,value:null,dataIndex:2}]).includes('Unavailable'));
  assert.ok(o.tooltip.formatter([{seriesIndex:0,value:0,dataIndex:1}]).includes('0 '+displayUnit));
 }
});

test('locales normalize POSIX-style tags and format axes and tooltips consistently',()=>{
 const f=fixture();
 for(const [locale,text] of [['en_US','12,345.5'],['pt_BR','12.345,5'],['es_ES','12.345,5']]) {
  f.set({type:'line',locale,labels:['A'],axes:[{unit:'ms',precision:1}],datasets:[{label:'Latency',data:[12345.5]}]});
  const o=f.instances[0].option;assert.equal(o.yAxis.axisLabel.formatter(12345.5),text+' ms');assert.ok(o.tooltip.formatter([{seriesIndex:0,value:12345.5,dataIndex:0}]).includes(text+' ms'));
 }
 f.set({type:'line',locale:'pt-BR',labels:['A'],axes:[{unit:'bytes',scale:'binary',precision:2}],datasets:[{data:[1536]}]});
 assert.equal(f.instances[0].option.yAxis.axisLabel.formatter(1536),'1,5 KiB');
});

test('date axes and tooltip headers use explicit timezone, including epoch zero and DST',()=>{
 const f=fixture();const start=Date.parse('2026-03-08T06:30:00Z');
 const spec={type:'line',locale:'en-US',timeZone:'America/New_York',domain:{type:'time'},datasets:[{label:'CPU',data:[[start,1],[start+3600000,2]]}]};
 f.set(spec);const o=f.instances[0].option;
 assert.match(o.xAxis.axisLabel.formatter(start),/01:30/);assert.match(o.xAxis.axisLabel.formatter(start+3600000),/03:30/);
 const tip=o.tooltip.formatter([{axisValueLabel:'WRONG ENGINE ZONE',seriesIndex:0,value:[start,1],dataIndex:0}]);assert.ok(tip.includes('01:30'));assert.ok(!tip.includes('WRONG ENGINE ZONE'));assert.match(tip,/2026/);
 f.set({...spec,timeZone:'UTC',datasets:[{data:[[0,0]]}]});const utc=f.instances[0].option;assert.match(utc.tooltip.formatter([{seriesIndex:0,value:[0,0],dataIndex:0}]),/1970/);
});

test('localized missing/empty/error text is plain text and survives recovery',()=>{
 const f=fixture();const messages={unavailable:'Não disponível',empty:'Sem dados',error:'Falha <img src=x>'};
 const spec={type:'line',locale:'pt_BR',messages,labels:['A'],datasets:[{data:[null]}]};
 f.set(spec);assert.ok(f.instances[0].option.tooltip.formatter([{seriesIndex:0,value:null,dataIndex:0}]).includes('Não disponível'));
 f.set({empty:true,messages});assert.equal(f.frame.nextElementSibling.textContent,'Sem dados');
 f.set({...spec,timeZone:'Not/AZone'});assert.equal(f.frame.nextElementSibling.textContent,messages.error);
 f.set(spec);assert.equal(f.frame.nextElementSibling.textContent,'Sem dados');assert.equal(f.frame.classList.empty,false);
 f.api.destroy(f.canvas);f.fail('init');f.set(spec);assert.equal(f.frame.nextElementSibling.textContent,messages.error);
 f.canvas.dataset.uiChart='bad json';f.frame.nextElementSibling.dataset.uiErrorMessage='JSON inválido';f.api.render(f.canvas);assert.equal(f.frame.nextElementSibling.textContent,'JSON inválido');
});

test('invalid locale, timezone, units, mixed conversions and presentation fail safely',()=>{
 for(const extra of [
  {locale:{}},{locale:'not_a_valid_@_locale'},{locale:'zz-ZZ'},{timeZone:{}},{timeZone:'Mars/Example'},
  {axes:[{unit:'bytes',scale:'IEC'}]},{axes:[{unit:'bytes',scale:'binary',displayUnit:'GB'}]},
  {axes:[{unit:'bytes',inputUnit:'BiB'}]},{axes:[{unit:'bytes/s',inputUnit:'MB'}]},
  {axes:[{unit:'bytes',inputUnit:'GB'}],datasets:[{inputUnit:'GiB',data:[1]}]},
  {axes:[{unit:'count',scale:'binary'}]},{messages:{error:{image:'https://example.invalid/x'}}},
  {showAxisLabels:'false'},{showPoints:0},{axes:[{showLabels:'no'}]},{datasets:[{showPoints:'no',data:[1]}]}
 ]) {
  const f=fixture();f.set({type:'line',labels:['A'],datasets:[{data:[1]}],...extra});assert.equal(f.frame.classList.empty,true,JSON.stringify(extra));assert.equal(f.instances[0].disposed,true);
 }
});

test('compact line options hide axes/markers while preserving live and hidden instance identity',()=>{
 const f=fixture({height:130});const spec={type:'line',showAxisLabels:false,showPoints:false,domain:{type:'time'},axes:[{unit:'percent',min:0,max:100}],datasets:[{label:'CPU',data:[[0,0],[2000,null],[4000,70]]}]};
 f.set(spec);const chart=f.instances[0];assert.equal(chart.option.xAxis.axisLabel.show,false);assert.equal(chart.option.yAxis.axisLabel.show,false);assert.equal(chart.option.series[0].showSymbol,false);assert.equal(chart.option.series[0].symbol,'none');assert.equal(chart.option.series[0].connectNulls,false);
 f.resize(0,0);f.set({...spec,datasets:[{data:[[0,0],[2000,20]]}]});f.resize(400,130);assert.equal(f.instances.length,1);assert.equal(chart.option.series[0].data[1][1],20);
 f.set({...spec,axes:[{showLabels:true}],datasets:[{showPoints:true,data:[[0,1]]}]});assert.equal(chart.option.xAxis.axisLabel.show,false);assert.equal(chart.option.yAxis.axisLabel.show,true);assert.equal(chart.option.series[0].showSymbol,true);
 f.events['htmx:beforeCleanupElement']({detail:{elt:f.canvas}});assert.equal(chart.disposed,true);
});
