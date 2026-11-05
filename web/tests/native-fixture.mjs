import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
export const engine=require('../assets/echarts.min.js');
export const base=()=>({animation:false,xAxis:{type:'category',data:['A','B','C']},yAxis:{type:'value'},series:[{id:'requests',name:'Requests',type:'line',data:[0,null,3]}]});
export function fixture({width=600,height=238,observe=true,actual=false,option=base(),config={},tokens={}}={}) {
 const events={},instances=[],observers=[],dispatched=[],registered=new Map(); let muted='#8b949e',failure='';
 const frame={clientWidth:width,clientHeight:height,getBoundingClientRect(){return {width:this.clientWidth,height:this.clientHeight}},classList:{toggle(_n,v){this.empty=!!v},add(){this.empty=true}},nextElementSibling:{textContent:'No data',dataset:{uiEmptyMessage:'No data'}}};
 const attrs=new Map();
 const host={id:'synthetic',isConnected:true,dataset:{uiEcharts:JSON.stringify(option),uiEchartsConfig:JSON.stringify(config)},parentElement:frame,matches:s=>s.includes('[data-ui-echarts]'),querySelectorAll:()=>[],dispatchEvent:e=>dispatched.push(e),getAttribute:n=>n==='aria-label'?'Synthetic usage':attrs.get(n)||null,setAttribute:(n,v)=>attrs.set(n,String(v)),removeAttribute:n=>attrs.delete(n)};
 const echarts={init(h,_theme,opts){
  if(registered.has(h))throw Error('Duplicate instance');
  const chart=actual?engine.init(null,null,{...opts,renderer:'svg',ssr:true}):{option:null,updates:[],resizes:[],handlers:{},on(n,f){this.handlers[n]=f},setOption(o,flags){this.option=o;this.updates.push({option:o,flags});if(failure==='option'){failure='';throw Error('Option failed')}},getOption(){return this.option?{...this.option,legend:this.option.legend?(Array.isArray(this.option.legend)?this.option.legend:[this.option.legend]):[],dataZoom:this.option.dataZoom??[]}:{}},resize(o){this.resizes.push(o)},showLoading(){this.loading=true},hideLoading(){this.loading=false},isDisposed(){return !!this.disposed},dispose(){this.disposed=true}};
  const dispose=chart.dispose.bind(chart);chart.dispose=()=>{dispose();registered.delete(h);h.removeAttribute('_echarts_instance_')};
  h.setAttribute('_echarts_instance_','chart-'+instances.length);registered.set(h,chart);instances.push(chart);if(failure==='init'){failure='';throw Error('Partial init failed')}return chart;
 },getInstanceByDom:h=>registered.get(h)};
 class ResizeObserver{constructor(fn){this.callback=fn;observers.push(this)}observe(target){this.target=target}disconnect(){this.disconnected=true}}
 class CustomEvent{constructor(type,options){this.type=type;Object.assign(this,options)}}
 const document={readyState:'complete',querySelectorAll:()=>host.isConnected?[host]:[],addEventListener:(n,f)=>events[n]=f};
 const context={document,echarts,Intl,Map,JSON,CustomEvent,ResizeObserver:observe?ResizeObserver:undefined,getComputedStyle:()=>({fontFamily:'system-ui',getPropertyValue:n=>tokens[n]||(n==='--ghtui-muted'?muted:'')}),addEventListener:(n,f)=>events['window:'+n]=f};context.window=context;
 for(const file of ['echarts-format.js','ui-htmx-charts.js'])vm.runInNewContext(fs.readFileSync(new URL('../assets/'+file,import.meta.url),'utf8'),context);
 return {api:context.GoHTMXUI.echarts,format:context.GoHTMXUI.echartsFormat,host,frame,events,instances,observers,dispatched,context,
  set(o,c=JSON.parse(host.dataset.uiEchartsConfig)){host.dataset.uiEcharts=JSON.stringify(o);host.dataset.uiEchartsConfig=JSON.stringify(c);this.api.render(host)},resize(w,h){frame.clientWidth=w;frame.clientHeight=h;for(const o of [...observers])if(!o.disconnected)o.callback()},setTheme(v){muted=v},setToken(n,v){tokens[n]=v},fail(v){failure=v},cleanup(){this.api.destroy(host)}};
}
