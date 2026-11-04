import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
export const echarts=require('../assets/echarts.min.js');

export function fixture({width=600,height=238,observe=true}={}) {
 const events={},dispatched=[],instances=[],observers=[],registered=new Map();let theme='#8b949e',failure='';
 const attrs=new Map();
 const frame={clientWidth:width,clientHeight:height,getBoundingClientRect(){return {width:this.clientWidth,height:this.clientHeight}},classList:{toggle(_name,value){this.empty=!!value},add(){this.empty=true}},nextElementSibling:{textContent:'No data',dataset:{uiEmptyMessage:'No data'}}};
 const canvas={id:'synthetic',dispatchEvent(event){dispatched.push(event);},tagName:'CANVAS',isConnected:true,dataset:{uiChart:JSON.stringify({type:'line',labels:['A'],datasets:[{label:'Requests',data:[1],borderColor:'#123456'}]})},matches:s=>s.includes('canvas'),parentElement:frame,querySelectorAll:()=>[],getAttribute:n=>n==='aria-label'?'Synthetic usage':attrs.get(n)||null,setAttribute:(n,v)=>attrs.set(n,String(v)),removeAttribute:n=>attrs.delete(n)};
 const echarts={init(host,_theme,config){
  if(registered.has(host))throw new Error('Duplicate chart');
  const instance={host,config,handlers:{},on(name,fn){this.handlers[name]=fn},updates:[],resizes:[],disposed:false,setOption(option,flags){this.option=option;this.updates.push({option,flags});if(failure==='option'){failure='';throw new Error('Set option failed')}},getOption(){return this.option?{...this.option,legend:[this.option.legend]}:null},resize(options){this.resizes.push(options)},dispose(){this.disposed=true;registered.delete(host);host.removeAttribute('_echarts_instance_')}};
  host.setAttribute('_echarts_instance_','chart-'+instances.length);registered.set(host,instance);instances.push(instance);
  if(failure==='init'){failure='';throw new Error('Init failed after registration')}
  return instance;
 },getInstanceByDom:host=>registered.get(host)};
 class ResizeObserver {constructor(callback){this.callback=callback;this.disconnected=false;observers.push(this)}observe(target){this.target=target}disconnect(){this.disconnected=true}}
 const document={readyState:'complete',querySelectorAll:()=>canvas.isConnected?[canvas]:[],addEventListener:(name,fn)=>events[name]=fn};
 class CustomEvent {constructor(type,options){this.type=type;Object.assign(this,options)}}
 const context={CustomEvent,echarts,document,Intl,Map,JSON,ResizeObserver:observe?ResizeObserver:undefined,getComputedStyle:()=>({fontFamily:'system-ui',getPropertyValue:name=>name==='--ghtui-muted'?theme:''}),addEventListener:(name,fn)=>events['window:'+name]=fn};context.window=context;
 vm.runInNewContext(fs.readFileSync(new URL('../assets/charts.js',import.meta.url),'utf8'),context);
 return {api:context.GoHTMXUI.charts,dispatched,instances,observers,canvas,frame,events,setTheme:value=>theme=value,fail:value=>failure=value,set(spec){canvas.dataset.uiChart=JSON.stringify(spec);this.api.render(canvas)},resize(w,h){frame.clientWidth=w;frame.clientHeight=h;for(const observer of [...observers])if(!observer.disconnected)observer.callback([{target:frame}])}};
}


export function actualRenderer(t,spec,{width=600,height=238}={}) {
 const instances=[];t.after(()=>{for(const chart of instances)if(!chart.isDisposed())chart.dispose()});
 const frame={getBoundingClientRect:()=>({width,height}),classList:{toggle(){},add(){}},nextElementSibling:{dataset:{uiEmptyMessage:'No data'},textContent:''}};
 const canvas={isConnected:true,dataset:{uiChart:JSON.stringify(spec)},parentElement:frame,matches:()=>true,querySelectorAll:()=>[],getAttribute:()=> 'Synthetic chart'};
 const window={echarts:{init(_host,_theme,options){const chart=echarts.init(null,null,{...options,renderer:'svg',ssr:true});instances.push(chart);return chart},getInstanceByDom:()=>null},addEventListener(){}};
 const context={window,document:{readyState:'complete',querySelectorAll:()=>[canvas],addEventListener(){}},getComputedStyle:()=>({fontFamily:'sans-serif',getPropertyValue:()=>''}),Intl,Map,JSON};
 vm.runInNewContext(fs.readFileSync(new URL('../assets/charts.js',import.meta.url),'utf8'),context);
 return {instances,canvas,api:window.GoHTMXUI.charts,update(value){canvas.dataset.uiChart=JSON.stringify(value);this.api.render(canvas)}};
}
