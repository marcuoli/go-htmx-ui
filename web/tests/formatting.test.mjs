import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './native-fixture.mjs';
const get=(spec,settings)=>{const f=fixture();const compiled=f.format.compile(spec,settings);f.cleanup();return compiled;};
for(const [name,format,value,expected] of [
 ['bytes to bits',{unit:'data',inputUnit:'B',displayUnit:'b'},1,'8 b'],
 ['bits to bytes',{unit:'data',inputUnit:'b',displayUnit:'B'},8,'1 B'],
 ['SI bytes to bits',{unit:'data-rate',inputUnit:'MB/s',displayUnit:'Mb/s'},1,'8 Mb/s'],
 ['IEC bytes to bits',{unit:'data-rate',inputUnit:'MiB/s',displayUnit:'Mib/s'},1,'8 Mib/s'],
 ['IEC to SI',{unit:'data-rate',inputUnit:'MiB/s',displayUnit:'Mb/s'},1,'8.39 Mb/s'],
 ['cross prefix/hour',{unit:'data-rate',inputUnit:'MB/s',displayUnit:'MiB/h'},12.5,'42,915.34 MiB/h'],
 ['minute to hour',{unit:'data-rate',inputUnit:'MB/min',displayUnit:'MB/h'},1,'60 MB/h'],
 ['day to hour',{unit:'data-rate',inputUnit:'MB/d',displayUnit:'MB/h'},24,'1 MB/h'],
 ['negative rate',{unit:'data-rate',inputUnit:'MB/s',displayUnit:'Mb/s'},-1,'-8 Mb/s'],
 ['legacy SI alias',{unit:'bytes/s',inputUnit:'MiB/s'},1,'1.05 MB/s'],
 ['generic inferred IEC',{unit:'data-rate',inputUnit:'MiB/s'},1,'1 MiB/s'],
 ['bit alias',{unit:'bits/s',inputUnit:'MB/s'},1,'8 Mb/s'],
 ['IEC bit alias',{unit:'bits',scale:'binary'},1024,'1 Kib'],
 ['auto period',{unit:'data-rate',inputUnit:'B/s',displayUnit:'auto/h'},1,'3.6 kB/h'],
 ['named rate',{unit:'rate',inputUnit:'requests/min',displayUnit:'requests/h'},12,'720 requests/h'],
 ['unnamed rate',{unit:'rate',inputUnit:'/s',displayUnit:'/h'},1,'3,600/h'],
 ['legacy rate',{unit:'rate'},12.5,'12.5/s'],
 ['plain custom',{unit:'custom',displayUnit:'transactions/h'},1500,'1,500 transactions/h'],
 ['affine zero',{unit:'custom',inputUnit:'°C',displayUnit:'°F',conversion:{factor:1.8,offset:32}},0,'32 °F'],
 ['plain text label',{unit:'custom',displayUnit:'<img src=x>'},1,'1 <img src=x>'],
 ['percent',{unit:'percent'},12.5,'12.5%'],['milliseconds',{unit:'ms'},1.25,'1.25 ms'],
 ['microseconds',{unit:'us'},1.25,'1.25 µs'],['QPS',{unit:'qps'},12.5,'12.5 QPS']
])test('format: '+name,()=>assert.equal(get(format)(value),expected));
test('all four time bases and bit/byte prefix pairs use a physical reference',()=>{
 for(const [input,n] of [['B/s',1],['B/min',60],['B/h',3600],['B/d',86400]])for(const [display,expected] of [['B/s','1 B/s'],['B/min','60 B/min'],['B/h','3,600 B/h'],['B/d','86,400 B/d'],['b/s','8 b/s']])assert.equal(get({unit:'data-rate',inputUnit:input,displayUnit:display})(n),expected);
 for(const prefix of ['','k','M','G','T','P','E','Z','Y'])assert.equal(get({unit:'data',inputUnit:prefix+'B',displayUnit:prefix+'b'})(1),'8 '+prefix+'b');
 for(const prefix of ['Ki','Mi','Gi','Ti','Pi','Ei','Zi','Yi'])assert.equal(get({unit:'data',inputUnit:prefix+'B',displayUnit:prefix+'b'})(1),'8 '+prefix+'b');
});
test('locale, precision, compact count and small USD stay meaningful',()=>{assert.equal(get({unit:'data-rate',inputUnit:'MB/s',displayUnit:'MiB/h'},{locale:'pt_BR'})(12.5),'42.915,34 MiB/h');assert.match(get({unit:'count'})(12345,true),/12\.35K/);assert.equal(get({unit:'count',precision:0})(12.345),'12');assert.match(get({unit:'usd',precision:4})(0.000001),/< USD 0\.0001/);assert.match(get({unit:'usd'})(12.5),/12\.50/)});
test('zero, null, nonfinite, extreme ratios and affine cancellation preserve semantics',()=>{const fn=get({unit:'data',inputUnit:'B',displayUnit:'b'},{unavailable:'Missing'});assert.equal(fn(0),'0 b');for(const n of [null,undefined,NaN,Infinity,'0'])assert.equal(fn(n),'Missing');assert.equal(fn(Number.MAX_VALUE),'Missing');assert.ok(!get({unit:'data',inputUnit:'YB',displayUnit:'YB'})(1e300).includes('Unavailable'));assert.ok(!get({unit:'custom',inputUnit:'raw',displayUnit:'scaled',conversion:{factor:2,offset:-Number.MAX_VALUE}})(Number.MAX_VALUE).includes('Unavailable'))});
test('date format requires timezone-aware instants; localized categories remain application text',()=>{const utc=get({unit:'time'},{locale:'pt_BR',timeZone:'UTC'}),local=get({unit:'time'},{locale:'pt_BR',timeZone:'America/Sao_Paulo'});assert.match(utc(1767225600000),/00:00/);assert.match(local(1767225600000),/21:00/);assert.match(utc('2026-01-01T00:00:00Z',false,true),/2026/);for(const n of ['01/01 08:00:00','2026-01-01T00:00:00',null,1e300])assert.equal(utc(n),'Unavailable')});
test('invalid units, dimensions, rules, locale and timezone reject before use',()=>{
 for(const f of [
 {unit:'data-rate',inputUnit:'MB/s',displayUnit:'MiB'}, {unit:'data',inputUnit:'B',displayUnit:'Mb/h'},
 {unit:'data-rate',inputUnit:'MB/month',displayUnit:'Mb/s'}, {unit:'data-rate',inputUnit:'mb/s',displayUnit:'Mb/s'},
 {unit:'data-rate',inputUnit:'MB/S'}, {unit:'data-rate',displayUnit:'MiB/h',scale:'decimal'}, {unit:'data',displayUnit:'auto/h'},
 {unit:'bytes',scale:'not-a-scale'}, {unit:'count',precision:-1}, {unit:'count',precision:9},
 {unit:'rate',inputUnit:'requests/s',displayUnit:'transactions/h'}, {unit:'rate',inputUnit:'/s',displayUnit:'/month'},
 {unit:'custom',inputUnit:'a',displayUnit:'b'}, {unit:'custom',displayUnit:{image:'x'}},
 {unit:'custom',displayUnit:'x',conversion:{factor:0}}, {unit:'custom',displayUnit:'x',conversion:{factor:-1}},
 {unit:'custom',displayUnit:'x',conversion:{factor:'fn'}}, {unit:'custom',displayUnit:'x',conversion:{factor:1,offset:'x'}},
 {unit:'custom',displayUnit:'x',conversion:{factor:1,formatter:'fn'}}, {unit:'data-rate',conversion:{factor:2}},
 {unit:'count',inputUnit:'x'}, {unit:'percent',conversion:{factor:100}}, {unit:'rate',scale:'binary'},
 {unit:'custom',displayUnit:'x',scale:'binary'}, {unit:'time',precision:2}, {unit:'custom',displayUnit:'x\n'},
 {unit:'custom',displayUnit:'x'.repeat(81)}, {unit:'count',typo:'x'}])assert.throws(()=>get(f),undefined,JSON.stringify(f));
 for(const settings of [{locale:'not_@_locale'},{locale:''},{timeZone:'No/Such_Zone'},{unavailable:1}])assert.throws(()=>get({},settings));
});
