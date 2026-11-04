import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,actualRenderer} from './fixture.mjs';
const spec=(format,value=1,extra={})=>({type:'line',labels:['A'],axes:[format],datasets:[{label:'Metric',data:[value]}],...extra});
const tip=(option,value,index=0)=>option.tooltip.formatter([{seriesIndex:0,dataIndex:index,name:'A',value}]);

test('data units distinguish bits/bytes, SI/IEC and every supported time base',()=>{
 const f=fixture();
 for(const [unit,inputUnit,displayUnit,n,expected] of [
  ['data','B','b',1,'8 b'],['data','b','B',8,'1 B'],
  ['data-rate','MB/s','Mb/s',1,'8 Mb/s'],['data-rate','MiB/s','Mib/s',1,'8 Mib/s'],
  ['data-rate','Mb/s','MB/s',8,'1 MB/s'],['data-rate','MiB/s','Mb/s',1,'8.39 Mb/s'],
  ['data-rate','MB/s','MiB/h',12.5,'42,915.34 MiB/h'],
  ['data-rate','MB/min','MB/h',1,'60 MB/h'],['data-rate','MB/d','MB/h',24,'1 MB/h'],
  ['data-rate','Mb/s','Mb/min',1,'60 Mb/min'],['data-rate','MB/h','MB/s',3600,'1 MB/s'],
  ['data-rate','MB/s','Mb/s',-1,'-8 Mb/s']
 ]) {
  f.set(spec({unit,inputUnit,displayUnit,precision:2},n));const o=f.instances[0].option;
  assert.equal(f.frame.classList.empty,false,JSON.stringify([inputUnit,displayUnit]));assert.equal(o.yAxis.axisLabel.formatter(n),expected);assert.ok(tip(o,n).includes(expected));assert.equal(o.series[0].data[0],n);
 }
});

test('generic and alias auto defaults remain explicit and backwards compatible',()=>{
 const f=fixture();
 for(const [format,n,expected] of [
  [{unit:'bytes/s',inputUnit:'MiB/s'},1,'1.05 MB/s'],
  [{unit:'data-rate',inputUnit:'MiB/s'},1,'1 MiB/s'],
  [{unit:'bits/s',inputUnit:'MB/s'},1,'8 Mb/s'],
  [{unit:'bits',scale:'binary'},1024,'1 Kib'],
  [{unit:'data-rate',inputUnit:'MB/h',displayUnit:'auto'},1,'1 MB/h'],
  [{unit:'data-rate',inputUnit:'B/s',displayUnit:'auto/h'},1,'3.6 kB/h'],
  [{unit:'bits/s',inputUnit:'B/s',displayUnit:'auto/h'},1,'28.8 kb/h']
 ]) {f.set(spec(format,n));assert.equal(f.frame.classList.empty,false);assert.equal(f.instances[0].option.yAxis.axisLabel.formatter(n),expected)}
});

test('named/unnamed rates convert only their time base, preserving legacy formatting',()=>{
 const f=fixture();
 for(const [format,n,expected] of [
  [{unit:'rate'},12.5,'12.5/s'],
  [{unit:'rate',inputUnit:'/s',displayUnit:'/h'},1,'3,600/h'],
  [{unit:'rate',inputUnit:'requests/min',displayUnit:'requests/h'},12,'720 requests/h']
 ]) {f.set(spec(format,n));const o=f.instances[0].option;assert.equal(o.yAxis.axisLabel.formatter(n),expected);assert.ok(tip(o,n).includes(expected))}
});

test('custom metrics use safe labels and explicit affine rules without changing raw samples',()=>{
 const f=fixture();
 for(const [format,n,expected] of [
  [{unit:'custom',displayUnit:'transactions/h'},1500,'1,500 transactions/h'],
  [{unit:'custom',inputUnit:'requests/s',displayUnit:'requests/h',conversion:{factor:3600}},2,'7,200 requests/h'],
  [{unit:'custom',inputUnit:'°C',displayUnit:'°F',conversion:{factor:1.8,offset:32}},0,'32 °F'],
  [{unit:'custom',displayUnit:'<img src=x>'},1,'1 <img src=x>']
 ]) {f.set(spec(format,n));const o=f.instances[0].option;assert.equal(o.yAxis.axisLabel.formatter(n),expected);assert.ok(tip(o,n).includes(expected));assert.equal(o.tooltip.renderMode,'richText');assert.equal(o.series[0].data[0],n)}
});

test('axis and dataset conversion rules inherit and compare normalized numeric semantics',()=>{
 const f=fixture();
 f.set({type:'line',labels:['A'],axes:[{unit:'custom',inputUnit:'req/s',displayUnit:'req/h',conversion:{factor:3600}}],datasets:[{label:'A',conversion:{offset:0,factor:3600},data:[1]},{label:'B',data:[2]}]});
 assert.equal(f.frame.classList.empty,false);let o=f.instances[0].option;assert.ok(tip(o,1).includes('3,600 req/h'));
 f.set({type:'line',labels:['A'],datasets:[{unit:'custom',inputUnit:'x',displayUnit:'y',conversion:{factor:2},data:[1]},{conversion:{factor:2,offset:0},data:[2]}]});assert.equal(f.frame.classList.empty,false);o=f.instances[0].option;assert.equal(o.yAxis.axisLabel.formatter(2),'4 y');
});

test('units preserve localized missing/zero, finite extremes and live reading state',()=>{
 const f=fixture();const base=spec({unit:'data-rate',inputUnit:'MB/s',displayUnit:'MiB/h',precision:2},12.5,{locale:'pt_BR',messages:{unavailable:'Não disponível'},zoom:{enabled:true},legend:{show:true}});
 f.set(base);const chart=f.instances[0];assert.equal(chart.option.yAxis.axisLabel.formatter(12.5),'42.915,34 MiB/h');assert.equal(chart.option.yAxis.axisLabel.formatter(0),'0 MiB/h');assert.ok(tip(chart.option,null).includes('Não disponível'));
 chart.option.dataZoom[0].start=20;chart.option.dataZoom[0].end=80;chart.option.legend.selected={Metric:false};
 f.resize(0,0);f.set({...base,axes:[{unit:'data-rate',inputUnit:'MB/s',displayUnit:'Mb/s'}]});f.resize(400,130);assert.equal(f.instances.length,1);assert.equal(chart.option.dataZoom[0].start,20);assert.equal(chart.option.legend.selected.Metric,false);assert.equal(chart.option.yAxis.axisLabel.formatter(12.5),'100 Mb/s');
 f.set(spec({unit:'data',inputUnit:'YB',displayUnit:'YB'},1e300));assert.ok(!f.instances[0].option.yAxis.axisLabel.formatter(1e300).includes('Unavailable'));
 f.set(spec({unit:'data',inputUnit:'B',displayUnit:'b'},Number.MAX_VALUE));assert.equal(f.instances[0].option.yAxis.axisLabel.formatter(Number.MAX_VALUE),'Unavailable');
});

test('invalid dimensions, periods, case, custom labels and rules fail safely',()=>{
 for(const format of [
  {unit:'data-rate',inputUnit:'MB/s',displayUnit:'MiB'},
  {unit:'data',inputUnit:'B',displayUnit:'Mb/h'},
  {unit:'data-rate',inputUnit:'MB/month',displayUnit:'Mb/s'},
  {unit:'data-rate',inputUnit:'MB/S',displayUnit:'Mb/s'},
  {unit:'data-rate',inputUnit:'mb/s',displayUnit:'Mb/s'},
  {unit:'data-rate',displayUnit:'MiB/h',scale:'decimal'},
  {unit:'data',displayUnit:'auto/h'},
  {unit:'rate',inputUnit:'requests/s',displayUnit:'transactions/h'},
  {unit:'rate',inputUnit:'/s',displayUnit:'/month'},
  {unit:'custom',inputUnit:'a',displayUnit:'b'},
  {unit:'custom',displayUnit:{image:'https://example.invalid/x'}},
  {unit:'custom',displayUnit:'x',conversion:{factor:0}},
  {unit:'custom',displayUnit:'x',conversion:{factor:-1}},
  {unit:'custom',displayUnit:'x',conversion:{factor:'callback'}},
  {unit:'custom',displayUnit:'x',conversion:{factor:1,offset:'bad'}},
  {unit:'custom',displayUnit:'x',conversion:{factor:1,formatter:'callback'}},
  {unit:'data-rate',conversion:{factor:2}},
  {unit:'count',inputUnit:'x',displayUnit:'y',conversion:{factor:2}}
 ]) {const f=fixture();f.set(spec(format));assert.equal(f.frame.classList.empty,true,JSON.stringify(format));assert.equal(f.instances[0].disposed,true)}
 const f=fixture();f.set({type:'line',labels:['A'],axes:[{unit:'custom',inputUnit:'x',displayUnit:'y',conversion:{factor:2}}],datasets:[{conversion:{factor:3},data:[1]}]});assert.equal(f.frame.classList.empty,true);
});

test('official engine uses converted labels consistently in value domains and special families',t=>{
 const f=actualRenderer(t,{type:'scatter',locale:'pt_BR',domain:{type:'value',unit:'data-rate',inputUnit:'MB/s',displayUnit:'MiB/h'},axes:[{unit:'custom',displayUnit:'jobs/h'}],datasets:[{data:[[12.5,10],[25,20]]}]});assert.equal(f.instances.length,1);let o=f.instances[0].getOption();assert.equal(o.xAxis[0].axisLabel.formatter(12.5),'42.915,34 MiB/h');assert.equal(o.yAxis[0].axisLabel.formatter(10),'10 jobs/h');assert.ok(!f.instances[0].renderToSVGString().includes('NaN'));
 f.update({type:'gauge',axes:[{unit:'data-rate',inputUnit:'MB/s',displayUnit:'Mb/s',min:0,max:20}],datasets:[{data:[12.5]}]});o=f.instances[0].getOption();assert.equal(o.series[0].detail.formatter(12.5),'100 Mb/s');assert.equal(f.instances.length,1);
});


test('all standard periods convert against a common physical reference',()=>{
 const f=fixture();
 for(const [inputUnit,n] of [['B/s',1],['B/min',60],['B/h',3600],['B/d',86400]]) {
  for(const [displayUnit,expected] of [['B/s','1 B/s'],['B/min','60 B/min'],['B/h','3,600 B/h'],['B/d','86,400 B/d'],['b/s','8 b/s']]) {
   f.set(spec({unit:'data-rate',inputUnit,displayUnit},n));assert.equal(f.instances[0].option.yAxis.axisLabel.formatter(n),expected);
  }
 }
});

test('explicit affine cancellation avoids spurious intermediate overflow',()=>{
 const f=fixture();f.set(spec({unit:'custom',inputUnit:'raw',displayUnit:'scaled',conversion:{factor:2,offset:-Number.MAX_VALUE}},Number.MAX_VALUE));
 assert.ok(!f.instances[0].option.yAxis.axisLabel.formatter(Number.MAX_VALUE).includes('Unavailable'));
});

test('special families reject inferred invalid overrides just like Cartesian charts',()=>{
 const families=[
  {type:'gauge',datasets:[{data:[1]}]},
  {type:'radar',indicators:[{name:'A',max:10},{name:'B',max:10},{name:'C',max:10}],datasets:[{data:[1,2,3]}]},
  {type:'heatmap',labels:['A'],rows:['B'],datasets:[{data:[[0,0,1]]}]}
 ];
 for(const base of families)for(const format of [{unit:'percent',conversion:{factor:100}},{unit:'rate',scale:'binary'},{unit:'custom',displayUnit:'x',scale:'binary'},{unit:'count',inputUnit:'x',displayUnit:'y'}]) {
  const f=fixture();f.set({...base,datasets:base.datasets.map(d=>({...d,...format}))});assert.equal(f.frame.classList.empty,true,JSON.stringify([base.type,format]));
 }
});

test('special family dataset precision controls value presentation while axes keep their precision',()=>{
 const f=fixture();f.set({type:'gauge',axes:[{unit:'custom',displayUnit:'x',precision:1}],datasets:[{data:[1.2345],precision:4}]});let o=f.instances[0].option;assert.equal(o.series[0].detail.formatter(1.2345),'1.2345 x');assert.equal(o.series[0].axisLabel.formatter(1.2345),'1.2 x');
 f.set({type:'heatmap',labels:['A'],rows:['B'],cellLabels:true,axes:[{unit:'custom',displayUnit:'x',precision:1}],datasets:[{data:[[0,0,1.2345]],precision:4}]});o=f.instances[0].option;assert.ok(o.tooltip.formatter({value:[0,0,1.2345]}).includes('1.2345 x'));assert.equal(o.visualMap.formatter(1.2345),'1.2 x');
});
