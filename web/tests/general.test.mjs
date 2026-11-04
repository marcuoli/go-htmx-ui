import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,actualRenderer} from './fixture.mjs';

const families={
 pie:{type:'pie',labels:['A','B'],datasets:[{label:'Samples',data:[0,7]}]},
 scatter:{type:'scatter',axes:[{unit:'ms'}],datasets:[{label:'Latency',data:[[0,0],[2,null],[10,4]]}]},
 bubble:{type:'bubble',axes:[{unit:'ms'}],datasets:[{label:'Bubble',data:[[0,1,12],[10,4,28]]}]},
 heatmap:{type:'heatmap',labels:['Mon','Tue'],rows:['Morning','Evening'],axes:[{unit:'percent'}],colorRange:{min:0,max:100},datasets:[{label:'Load',data:[[0,0,0],[1,0,null],[1,1,80]]}]},
 radar:{type:'radar',indicators:[{name:'CPU',max:100},{name:'Memory',max:100},{name:'Disk',max:100}],axes:[{unit:'percent'}],datasets:[{label:'A',data:[0,40,70]},{label:'B',data:[20,50,80]}]},
 gauge:{type:'gauge',axes:[{unit:'percent',min:0,max:100}],datasets:[{label:'CPU',data:[0]}]}
};

test('solid pie and numeric scatter/bubble retain typed values and units',()=>{
 const f=fixture();f.set(families.pie);assert.equal(f.instances[0].option.series[0].radius[0],0);
 f.set(families.scatter);let o=f.instances[0].option;assert.equal(o.xAxis.type,'value');assert.equal(o.series[0].type,'scatter');assert.equal(o.series[0].data[1][1],null);assert.equal(o.xAxis.boundaryGap[0],0);
 f.set(families.bubble);o=f.instances[0].option;assert.equal(o.series[0].type,'scatter');assert.equal(o.series[0].symbolSize([0,1,12]),12);
 const tip=o.tooltip.formatter([{seriesIndex:0,dataIndex:0,value:[0,1,12]}]);assert.ok(tip.includes('1 ms'));assert.ok(!tip.includes('12 ms'));
});

test('heatmap omits missing cells, keeps zero and formats real cell values',()=>{
 const f=fixture();f.set({...families.heatmap,locale:'pt_BR',cellLabels:true});const o=f.instances[0].option;
 assert.equal(o.series[0].type,'heatmap');assert.equal(o.series[0].data.length,2);assert.equal(o.series[0].data[0][2],0);assert.equal(o.visualMap.max,100);
 assert.ok(o.tooltip.formatter({value:[1,1,80]}).includes('Tue'));assert.ok(o.tooltip.formatter({value:[1,1,80]}).includes('Evening'));assert.ok(o.tooltip.formatter({value:[1,1,80]}).includes('80%'));assert.equal(o.series[0].label.show,true);
});

test('radar vectors and gauge ranges use shared formatting without missing-to-zero coercion',()=>{
 const f=fixture();f.set(families.radar);let o=f.instances[0].option;assert.equal(o.radar.indicator.length,3);assert.equal(o.series[0].data[0].value[0],0);assert.equal(o.legend.data.length,2);assert.ok(o.tooltip.formatter({name:'A',value:[0,40,70]}).includes('Memory: 40%'));
 f.set(families.gauge);o=f.instances[0].option;assert.equal(o.series[0].type,'gauge');assert.equal(o.series[0].min,0);assert.equal(o.series[0].max,100);assert.equal(o.series[0].data[0].value,0);assert.equal(o.series[0].detail.formatter(0),'0%');
 f.set({...families.gauge,messages:{unavailable:'No disponible'},datasets:[{label:'CPU',data:[null]}]});o=f.instances[0].option;assert.equal(o.series[0].data.length,0);assert.equal(o.title.text,'No disponible');
});

test('Cartesian value/time domains, tooltip controls and zoom state are declarative',()=>{
 const f=fixture();const spec={...families.scatter,tooltip:{show:false,trigger:'item'},zoom:{enabled:true,slider:true,start:0,end:100}};
 f.set(spec);const chart=f.instances[0];assert.equal(chart.option.tooltip.show,false);assert.equal(chart.option.dataZoom.length,2);
 chart.option.dataZoom[0].start=25;chart.option.dataZoom[0].end=75;f.set({...spec,datasets:[{data:[[0,1],[10,2]]}]});assert.equal(chart.option.dataZoom[0].start,25);assert.equal(chart.option.dataZoom[1].end,75);
 f.set({...spec,zoom:{enabled:true,start:10,end:90}});assert.equal(chart.option.dataZoom[0].start,10);assert.equal(chart.option.dataZoom.length,1);
 f.set({...families.scatter,domain:{type:'time'},datasets:[{data:[['2026-01-01T00:00:00Z',0],['2026-01-01T00:10:00Z',3]]}]});assert.equal(chart.option.xAxis.type,'time');assert.equal(chart.option.series[0].data[1][0]-chart.option.series[0].data[0][0],600000);
});

test('loading and safe opt-in DOM events preserve instance and release lifecycle',()=>{
 const f=fixture();f.set({...families.scatter,events:{select:true,zoom:true},zoom:{enabled:true}});const chart=f.instances[0];
 chart.handlers.click({seriesId:'a',seriesIndex:0,dataIndex:1,name:'<text>',value:[10,2],event:{secret:'must not forward'}});
 assert.equal(f.dispatched.length,1);let event=f.dispatched[0];assert.equal(event.type,'gohtmxui:chart-select');assert.equal(event.bubbles,true);assert.equal(event.detail.chartId,'synthetic');assert.equal(event.detail.event,undefined);assert.equal(event.detail.name,'<text>');
 chart.handlers.datazoom({batch:[{start:25,end:75}],event:{unsafe:true}});assert.equal(f.dispatched[1].detail.start,25);
 f.set({loading:true,messages:{loading:'Carregando'}});assert.equal(chart.disposed,false);assert.equal(f.frame.nextElementSibling.textContent,'Carregando');
 f.set({...families.scatter,events:{select:false}});assert.equal(f.instances.length,1);chart.handlers.click({value:[10,2]});assert.equal(f.dispatched.length,2);
 f.api.destroy(f.canvas);assert.equal(chart.disposed,true);assert.equal(f.observers[0].disconnected,true);
});

test('unsupported types and unsafe special-family shapes fail before reaching engine',()=>{
 for(const spec of [
  {type:'sankey',datasets:[]},{...families.bubble,datasets:[{data:[[1,2,{image:'x'}]]}]},
  {...families.bubble,datasets:[{data:[[1,2,1000]]}]},{...families.scatter,datasets:[{data:[[{value:1},2]]}]},
  {...families.heatmap,rows:[{value:'bad'}]},{...families.heatmap,datasets:[{data:[[0,0,1],[0,0,2]]}]},
  {...families.heatmap,datasets:[{data:[[99,0,1]]}]},{...families.radar,indicators:[{name:{image:'x'},max:100}]},
  {...families.radar,datasets:[{data:[1,null,3]}]},{...families.gauge,datasets:[{data:[1,2]}]},
  {...families.gauge,axes:[{min:100,max:0}]},{...families.scatter,zoom:{enabled:true,start:90,end:10}},
  {...families.radar,zoom:{enabled:true}},{...families.scatter,events:{select:'callback'}},
  {...families.scatter,tooltip:{formatter:'callback'}},{...families.scatter,domain:{type:'value',min:10,max:1}}
 ]) {const f=fixture();f.set(spec);assert.equal(f.frame.classList.empty,true,JSON.stringify(spec));assert.equal(f.instances[0].disposed,true)}
});

for(const [type,spec] of Object.entries(families))test('official full distribution renders '+type+' and can switch back to Cartesian',t=>{
 const f=actualRenderer(t,spec);assert.equal(f.instances.length,1,'type unavailable in official distribution');const chart=f.instances[0],svg=chart.renderToSVGString();assert.ok(svg.includes('<path'));assert.ok(!svg.includes('NaN'));
 if(type==='scatter'){assert.ok(chart.convertToPixel({xAxisIndex:0},10)>chart.convertToPixel({xAxisIndex:0},0))}
 f.update({type:'line',labels:['A','B'],datasets:[{data:[0,2]}]});assert.equal(f.instances.length,1);assert.equal(chart.getOption().series.length,1);assert.equal(chart.getOption().series[0].type,'line');
});

test('constant extreme heatmap extents stay finite and preserve cells',()=>{
 const f=fixture();
 for(const n of [2**60,Number.MAX_VALUE,-Number.MAX_VALUE,Number.MIN_VALUE,0]) {
  f.set({...families.heatmap,colorRange:undefined,axes:[{unit:'bytes',scale:'binary'}],datasets:[{data:[[0,0,n]]}]});
  const o=f.instances.at(-1).option;assert.equal(f.frame.classList.empty,false,String(n));assert.equal(o.series[0].data[0][2],n);assert.ok(Number.isFinite(o.visualMap.min)&&Number.isFinite(o.visualMap.max));assert.ok(o.visualMap.min<o.visualMap.max);
 }
});

test('category event coordinates and numeric tooltip x units are retained safely',()=>{
 const f=fixture();f.set({...families.scatter,domain:{type:'category'},labels:['A'],events:{select:true},datasets:[{data:[['A',5]]}]});const chart=f.instances[0];chart.handlers.click({value:['A',5]});assert.equal(JSON.stringify(f.dispatched[0].detail.value),'["A",5]');
 f.set({...families.scatter,domain:{type:'value',unit:'ms',precision:1,label:'Latency'},axes:[{unit:'percent'}],datasets:[{label:'Load',data:[[12.5,80]]}]});const tip=chart.option.tooltip.formatter({seriesIndex:0,dataIndex:0,value:[12.5,80]});assert.ok(tip.includes('Latency: 12.5 ms'));assert.ok(tip.includes('Load: 80%'));
});

test('domain formatting and single-format-axis bindings validate before drawing',()=>{
 for(const spec of [
  {...families.scatter,showAxisLabels:false,domain:{type:'value',unit:'bogus'}},
  {...families.scatter,domain:{type:'value',precision:99}},
  {...families.scatter,domain:{type:'value',unit:'bytes/s',inputUnit:'MiB'}},
  {...families.gauge,datasets:[{axis:'unknown',data:[1]}]}
 ]) {const f=fixture();f.set(spec);assert.equal(f.frame.classList.empty,true,JSON.stringify(spec))}
});

test('official engine separates zoom handles, legend and plot inside the frame',t=>{
 for(const horizontal of [false,true]) {
 const f=actualRenderer(t,{type:'bar',horizontal,stacked:true,zoom:{enabled:true,slider:true},labels:['A','B'],datasets:[{label:'Success',data:[2,4]},{label:'Failure',data:[1,2]}]}),chart=f.instances[0];
 chart.renderToSVGString();
 // Inspect rendered component geometry, not just declared bottom offsets.
 const componentBounds=type=>{const model=chart.getModel().getComponent(type),view=chart.getViewOfComponentModel(model),box=view.group.getBoundingRect().clone();box.applyTransform(view.group.getComputedTransform());return box};
 const legend=componentBounds('legend');
 // The first dataZoom is inside-only; resolve the slider's view explicitly.
 const model=chart.getModel().getComponent('dataZoom',1),view=chart.getViewOfComponentModel(model),box=view.group.getBoundingRect().clone();box.applyTransform(view.group.getComputedTransform());
 assert.ok(box.y+box.height<=legend.y-1,'slider overlaps legend '+JSON.stringify({legend,slider:box,zoom:chart.getOption().dataZoom.map(z=>({bottom:z.bottom,height:z.height}))}));assert.ok(legend.y+legend.height<=chart.getHeight()+0.1,'legend clipped');assert.ok(box.y>=0&&box.y+box.height<=chart.getHeight(),'slider clipped');assert.ok(box.width>chart.getWidth()/2,'slider is not usable across horizontal domain');
 }
});

test('semantically identical reordered zoom declarations retain the current window',()=>{
 const f=fixture();const spec={...families.scatter,zoom:{enabled:true,slider:true,start:0,end:100}};f.set(spec);const chart=f.instances[0];chart.option.dataZoom[0].start=20;chart.option.dataZoom[0].end=60;
 f.set({...spec,zoom:{end:100,start:0,slider:true,enabled:true}});assert.equal(chart.option.dataZoom[0].start,20);assert.equal(chart.option.dataZoom[1].end,60);
 f.setTheme('#123456');f.api.render(f.canvas);assert.equal(chart.option.dataZoom[0].start,20);
});

test('horizontal time bars and numeric scatter encode domain/value onto proper axes',t=>{
 for(const domain of [{type:'value',unit:'count'},{type:'time'}]) {
  const x=domain.type==='time'?1767225600000:10,step=domain.type==='time'?600000:10;
  const type=domain.type==='time'?'bar':'scatter';
  const f=actualRenderer(t,{type,horizontal:true,domain,axes:[{unit:'ms'}],datasets:[{data:[[x,100],[x+step,200]]}]}),chart=f.instances[0];chart.renderToSVGString();
  const layout=chart.getModel().getSeriesByIndex(0).getData().getItemLayout(0);
  const point=type==='bar'?[layout.x+layout.width,layout.y+layout.height/2]:layout;
  assert.ok(Math.abs(point[1]-chart.convertToPixel({yAxisIndex:0},x))<1,'domain encoded on wrong axis');
  assert.ok(Math.abs(point[0]-chart.convertToPixel({xAxisIndex:0},100))<1,'value encoded on wrong axis');
 }
});

test('horizontal categories retain numeric labels and unsupported numeric bars reject safely',t=>{
 const f=actualRenderer(t,{type:'bar',horizontal:true,labels:[2025,2026],datasets:[{data:[100,[1,200]]}]});const chart=f.instances[0];assert.equal(chart.getOption().series[0].data[0][0],0);chart.renderToSVGString();
 const layout=chart.getModel().getSeriesByIndex(0).getData().getItemLayout(0);assert.ok(Math.abs(layout.y+layout.height/2-chart.convertToPixel({yAxisIndex:0},0))<1);
 for(const type of ['bar','line']) {const mock=fixture();mock.set({type,horizontal:true,domain:{type:'value'},datasets:[{type:'bar',data:[[10,100],[20,200]]}]});assert.equal(mock.frame.classList.empty,true)}
});
test('official zoom and legend selections survive data and theme-compatible option updates',t=>{
 const spec={type:'line',legend:{show:true},zoom:{enabled:true,slider:true},labels:['A','B','C','D'],datasets:[{label:'A',data:[1,2,3,4]},{label:'B',data:[2,3,4,5]}]};
 const f=actualRenderer(t,spec),chart=f.instances[0];chart.dispatchAction({type:'dataZoom',start:25,end:75});chart.dispatchAction({type:'legendUnSelect',name:'B'});
 f.update({...spec,zoom:{slider:true,enabled:true},datasets:[{label:'A',data:[2,3,4,5]},{label:'B',data:[3,4,5,6]}]});
 assert.equal(f.instances.length,1);assert.equal(chart.getOption().dataZoom[0].start,25);assert.equal(chart.getOption().dataZoom[1].end,75);assert.equal(chart.getOption().legend[0].selected.B,false);
});
