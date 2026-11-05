// Native ECharts lifecycle and safe, declarative callback bindings.
// Native option objects pass to setOption; this file does not build chart schemas.
(() => {
 "use strict";
 const entries=new Map(),selector="[data-ui-echarts]";
 const object=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
 const list=v=>v===undefined?[]:Array.isArray(v)?v:[v];
 function json(value) {
  // JSON data has no executable callbacks. Reject rather than silently dropping
  // functions/nonfinite values from programmatic updates; DOM JSON is also checked.
  let count=0;
  function check(v,depth) {
   if(++count>300000||depth>64)throw Error("Option exceeds JSON safety bounds");
   if(v===null||typeof v==="string"||typeof v==="boolean")return;
   if(typeof v==="number"&&Number.isFinite(v))return;
   if(typeof v!=="object")throw Error("Use JSON values, not executable callbacks");
   for(const [key,item] of Object.entries(v)) {
    if(["__proto__","prototype","constructor"].includes(key))throw Error("Unsafe option key");
    check(item,depth+1);
   }
  }
  check(value,0);return JSON.stringify(value);
 }
 function keys(value,allowed,label) {
  if(!object(value)||Object.keys(value).some(k=>!allowed.includes(k)))throw Error("Invalid "+label);
 }
 function boolean(v,fallback=false){if(v!==undefined&&typeof v!=="boolean")throw Error("Expected boolean");return v??fallback;}
 function text(v){if(typeof v!=="string")throw Error("Expected text");return v;}
 function theme(host) {
  const css=getComputedStyle(host),token=(n,f)=>css.getPropertyValue("--ghtui-"+n).trim()||f;
  const accent=token("accent","#58a6ff"),fallback=[accent,"#a78bfa","#fbbf24","#fb7185","#34d399","#22d3ee"];
  return {muted:token("muted","#8b949e"),text:token("text","#f0f6fc"),surface:token("surface","#161b22"),border:token("border","#30363d"),accent,font:css.fontFamily||"system-ui",palette:fallback.map((value,index)=>token("chart-"+(index+1),value))};
 }
 function defaults(target,key,value){if(target[key]===undefined)target[key]=value;return target[key];}
 // Native option variants (baseOption/media/timeline) and per-series/item
 // overrides must not reopen ECharts' HTML tooltip surface. Keep their native
 // structure; change only the rendering mode, including nested overrides.
 function tooltipSafety(value) {
  if(!value||typeof value!=="object")return;
  for(const [key,item] of Object.entries(value)) {
   if(key==="tooltip")for(const tooltip of list(item))if(object(tooltip))tooltip.renderMode="richText";
   tooltipSafety(item);
  }
 }
 function styles(option,t) {
  defaults(option,"animation",false);defaults(option,"color",t.palette);
  const label=target=>{if(object(target)){defaults(target,"color",t.muted);defaults(target,"fontFamily",t.font);}};
  label(defaults(option,"textStyle",{}));
  for(const name of ["xAxis","yAxis","radiusAxis","angleAxis"])for(const axis of list(option[name]))if(object(axis)) {
   label(defaults(axis,"axisLabel",{}));
   const line=defaults(axis,"axisLine",{});if(object(line)){const s=defaults(line,"lineStyle",{});if(object(s))defaults(s,"color",t.border);}
   const split=defaults(axis,"splitLine",{});if(object(split)){const s=defaults(split,"lineStyle",{});if(object(s))defaults(s,"color",t.border);}
  }
  for(const name of ["legend","visualMap","dataZoom"])for(const item of list(option[name]))if(object(item))label(defaults(item,"textStyle",{}));
  for(const title of list(option.title))if(object(title)){label(defaults(title,"textStyle",{}));if(object(title.textStyle))defaults(title.textStyle,"color",t.text);}
  for(const radar of list(option.radar))if(object(radar))label(defaults(radar,"axisName",{}));
  for(const series of list(option.series))if(object(series)) {
   if(series.type==="gauge"){label(defaults(series,"axisLabel",{}));label(defaults(series,"detail",{}));label(defaults(series,"title",{}));}
  }
  // Data/labels never reach an HTML tooltip renderer, even when a native option
  // contains a string template. Applications cannot supply executable callbacks.
  if(option.tooltip!==undefined) {
   if(!object(option.tooltip))throw Error("Use one tooltip object");
   option.tooltip.renderMode="richText";defaults(option.tooltip,"backgroundColor",t.surface);defaults(option.tooltip,"borderColor",t.border);
   const s=defaults(option.tooltip,"textStyle",{});label(s);if(object(s)&&s.color===t.muted)s.color=t.text;
  }
 }
 const targetPattern=/^(?:(xAxis|yAxis|radiusAxis|angleAxis)\.(\d+)\.axisLabel\.formatter|series\.(\d+)\.(label|detail|tooltip)\.(formatter|valueFormatter)|visualMap\.(\d+)\.formatter)$/;
 function bindFormat(option,binding,settings) {
  keys(binding,["target","format","dimension","compact"],"format binding");
  const match=typeof binding.target==="string"&&targetPattern.exec(binding.target);
  if(!match)throw Error("Unsupported native formatter target");
  if(binding.dimension!==undefined&&(!Number.isInteger(binding.dimension)||binding.dimension<0))throw Error("Invalid value dimension");
  const compact=boolean(binding.compact),format=window.GoHTMXUI.echartsFormat.compile(binding.format,settings);
  const parts=binding.target.split("."),group=parts[0],index=Number(parts[1]);
  if(!Number.isSafeInteger(index))throw Error("Invalid target index");
  const items=list(option[group]);if(!object(items[index]))throw Error("Formatter target does not exist");option[group]=items;
  let target=items[index];
  for(const part of parts.slice(2,-1)){if(target[part]===undefined)target[part]={};if(!object(target[part]))throw Error("Invalid formatter target object");target=target[part];}
  const leaf=parts.at(-1);
  if(group==="series"&&((parts[2]==="tooltip")!==(leaf==="valueFormatter")))throw Error("Use tooltip.valueFormatter or label/detail.formatter");
  target[leaf]=p=>format(extract(p,binding.dimension),compact);
 }
 function extract(p,dimension) {
  const value=object(p)&&Object.hasOwn(p,"value")?p.value:p;
  return dimension===undefined?value:Array.isArray(value)?value[dimension]:undefined;
 }
 function seriesTarget(option,binding) {
  const all=list(option.series),byID=binding.seriesId!==undefined;
  if(byID===(binding.seriesIndex!==undefined))throw Error("Choose one seriesId or seriesIndex");
  if(byID&&typeof binding.seriesId!=="string"||!byID&&(!Number.isInteger(binding.seriesIndex)||binding.seriesIndex<0))throw Error("Invalid series reference");
  const index=byID?all.findIndex(s=>s.id===binding.seriesId):binding.seriesIndex;
  if(!object(all[index])||byID&&all.filter(s=>s.id===binding.seriesId).length!==1)throw Error("Unknown or ambiguous native series");
  return {series:all[index],index};
 }
 function bindTooltip(option,bindings,settings) {
  if(!Array.isArray(bindings))throw Error("Tooltip bindings must be an array");
  if(!bindings.length)return;
  const compiled=new Map();
  for(const binding of bindings) {
   keys(binding,["seriesId","seriesIndex","values"],"tooltip binding");const {index}=seriesTarget(option,binding);
   if(compiled.has(index)||!Array.isArray(binding.values)||!binding.values.length)throw Error("Invalid tooltip values");
   compiled.set(index,binding.values.map(value=>{keys(value,["dimension","label","format"],"tooltip value");if(value.dimension!==undefined&&(!Number.isInteger(value.dimension)||value.dimension<0))throw Error("Invalid tooltip dimension");return {...value,label:value.label===undefined?"":text(value.label),compiled:window.GoHTMXUI.echartsFormat.compile(value.format,settings)};}));
  }
  if(option.tooltip===undefined)option.tooltip={};if(!object(option.tooltip))throw Error("Invalid tooltip object");
  option.tooltip.renderMode="richText";
  option.tooltip.formatter=params=>list(params).map(p=>{
   const values=compiled.get(p.seriesIndex),name=typeof p.name==="string"?p.name:"",seriesName=typeof p.seriesName==="string"?p.seriesName:"";
   const label=[name,seriesName].filter(Boolean).join(" / ");
   const items=values?values.map(v=>(v.label?v.label+": ":"")+v.compiled(extract(p,v.dimension),false,true)):[String(extract(p)??settings.unavailable)];
   return [label,...items].filter(Boolean).join("\n");
  }).join("\n");
 }
 function bindBubbles(option,bindings) {
  if(!Array.isArray(bindings))throw Error("Bubble bindings must be an array");
  const seen=new Set();for(const binding of bindings) {
   keys(binding,["seriesId","seriesIndex","dimension","min","max"],"bubble size binding");const {series,index}=seriesTarget(option,binding),min=binding.min??2,max=binding.max??128;
   if(seen.has(index)||series.type!=="scatter"||!Number.isInteger(binding.dimension)||binding.dimension<0||typeof min!=="number"||typeof max!=="number"||!Number.isFinite(min)||!Number.isFinite(max)||min<0||min>max)throw Error("Invalid bubble size binding");seen.add(index);
   if(!Array.isArray(series.data))throw Error("Bubble sizes require explicit native series.data");
   for(const item of series.data){const size=extract(item,binding.dimension);if(typeof size!=="number"||!Number.isFinite(size)||size<min||size>max)throw Error("Bubble diameter outside declared bounds");}
   series.symbolSize=value=>extract(value,binding.dimension);
  }
 }
 function configuration(raw,fallback={}) {
  keys(raw,["locale","timeZone","formats","tooltip","bubbleSizes","events","messages","empty","loading"],"ECharts configuration");
  const messages={empty:fallback.uiEmptyMessage||"No reported data in this period.",error:fallback.uiErrorMessage||"Chart unavailable. Open the chart data table below.",unavailable:"Unavailable",loading:"Loading…",...(raw.messages??{})};
  if(raw.messages!==undefined){keys(raw.messages,["empty","error","unavailable","loading"],"messages");Object.values(raw.messages).forEach(text);}
  const settings={locale:raw.locale,timeZone:raw.timeZone,unavailable:messages.unavailable};window.GoHTMXUI.echartsFormat.compile({},settings);
  const events=raw.events??{};keys(events,["select","zoom"],"events");
  return {...raw,settings,messages,events:{select:boolean(events.select),zoom:boolean(events.zoom)},empty:boolean(raw.empty),loading:boolean(raw.loading)};
 }
 function compile(option,config,t) {
  if(!object(option)||["labels","datasets","type"].some(k=>Object.hasOwn(option,k)))throw Error("Supply native ECharts options, not the retired chart schema");
  if(!Array.isArray(config.formats??[]))throw Error("Format bindings must be an array");
  const targets=new Set();for(const binding of config.formats??[]){if(targets.has(binding.target))throw Error("Duplicate formatter target");targets.add(binding.target);bindFormat(option,binding,config.settings);}
  bindTooltip(option,config.tooltip??[],config.settings);bindBubbles(option,config.bubbleSizes??[]);tooltipSafety(option);styles(option,t);return option;
 }
 function release(host) {
  const entry=entries.get(host);entries.delete(host);entry?.observer?.disconnect();
  const registered=window.echarts?.getInstanceByDom?.(host);entry?.chart?.dispose();if(registered&&registered!==entry?.chart)registered.dispose();
 }
 function destroy(root=document){for(const host of [...entries.keys()])if(root===document||host===root||root.contains?.(host))release(host);}
 const size=host=>{const r=host.parentElement.getBoundingClientRect();return {width:r.width,height:r.height};};
 function resize(host) {
  if(!host.isConnected){release(host);return;}const entry=entries.get(host);if(!entry)return;
  const dimensions=size(host);if(dimensions.width<=0||dimensions.height<=0){entry.pending=true;return;}
  if(entry.pending||!entry.chart)render(host);else entry.chart.resize(dimensions);
 }
 function safeValue(v){if(v===null||typeof v==="string"||typeof v==="number"&&Number.isFinite(v))return v;if(Array.isArray(v)&&v.every(i=>i===null||typeof i==="string"||typeof i==="number"&&Number.isFinite(i)))return v.slice();}
 function emit(host,type,detail){if(typeof window.CustomEvent==="function"&&host.dispatchEvent)host.dispatchEvent(new window.CustomEvent("gohtmxui:chart-"+type,{bubbles:true,detail:{chartId:host.id,...detail}}));}
 function bindEvents(host,entry) {
  if(entry.bound)return;entry.bound=true;
  entry.chart.on("click",p=>{if(entry.events.select)emit(host,"select",{seriesId:typeof p.seriesId==="string"?p.seriesId:undefined,seriesIndex:Number.isInteger(p.seriesIndex)?p.seriesIndex:undefined,dataIndex:Number.isInteger(p.dataIndex)?p.dataIndex:undefined,name:typeof p.name==="string"?p.name:"",value:safeValue(p.value)});});
  entry.chart.on("datazoom",p=>{const v=p?.batch?.[0]??p;if(entry.events.zoom&&Number.isFinite(v?.start)&&Number.isFinite(v?.end))emit(host,"zoom",{start:v.start,end:v.end});});
 }
 function zoomIdentity(z){return JSON.stringify([z.id??null,z.type??"slider",...["xAxisIndex","yAxisIndex","radiusAxisIndex","angleAxisIndex","singleAxisIndex"].map(key=>z[key]==null?null:list(z[key])),z.orient??"horizontal",z.start??0,z.end??100,z.startValue??null,z.endValue??null,z.rangeMode??null]);}
 function retainState(option,entry,previous) {
  const zooms=list(option.dataZoom),old=list(previous?.dataZoom),identities=zooms.map(zoomIdentity);
  zooms.forEach((z,i)=>{const prior=old.find((p,j)=>z.id!==undefined?p.id===z.id:j===i);if(prior&&entry.zooms?.get(z.id??i)===identities[i])for(const [bound,index] of [["start",0],["end",1]]) {
   // Native ECharts prioritizes a single non-null bound field over rangeMode.
   const percent=z[bound]!=null,value=z[bound+"Value"]!=null;
   const mode=percent&&!value?"percent":value&&!percent?"value":z.rangeMode?.[index]??"percent";
   const key=mode==="value"?bound+"Value":bound;if(prior[key]!==undefined)z[key]=prior[key];
  }});
  const legends=list(option.legend),oldLegends=list(previous?.legend),selection=new Map();
  legends.forEach((legend,i)=>{const id=legend.id??i,initial=JSON.stringify(Object.entries(legend.selected??{}).sort(([a],[b])=>a.localeCompare(b)));selection.set(id,initial);const prior=oldLegends.find((p,j)=>legend.id!==undefined?p.id===legend.id:j===i);if(prior?.selected&&entry.legends?.get(id)===initial) {
   // With dataset/encode, only ECharts knows generated series/legend names.
   // Preserve native selection keys; filter only an explicitly declared legend
   // list. Unknown keys are harmless to native auto-generated legends.
   legend.selected=legend.data?Object.fromEntries(legend.data.map(d=>typeof d==="string"?d:d.name).filter(n=>Object.hasOwn(prior.selected,n)).map(n=>[n,prior.selected[n]])):{...prior.selected};
  }});
  return {zooms:new Map(zooms.map((z,i)=>[z.id??i,identities[i]])),legends:selection};
 }
 function render(root=document) {
  for(const host of [...entries.keys()])if(!host.isConnected)release(host);
  const hosts=[...(root.matches?.(selector)?[root]:[]),...(root.querySelectorAll?.(selector)||[])];
  for(const host of hosts) {
   const frame=host.parentElement,fallback=frame?.nextElementSibling;if(!frame)continue;
   let message=fallback?.dataset.uiErrorMessage||"Chart unavailable. Open the chart data table below.";
   try {
    if(!window.GoHTMXUI?.echartsFormat?.compile)throw Error("Load echarts-format.js before ui-htmx-charts.js");
    const config=configuration(JSON.parse(host.dataset.uiEchartsConfig||"{}"),fallback?.dataset);message=config.messages.error;
    const t=theme(host);
    const prior=entries.get(host);
    if(config.loading) {
     frame.classList.toggle("is-empty",!prior?.chart);if(fallback)fallback.textContent=config.messages.loading;
     if(prior){prior.events={};prior.chart?.showLoading("default",{text:config.messages.loading,color:t.accent,textColor:t.text,maskColor:t.surface});}
     continue;
    }
    frame.classList.toggle("is-empty",config.empty);if(fallback)fallback.textContent=config.messages.empty;
    if(config.empty){release(host);continue;}
    // Pending/empty snapshots may omit axes referenced by a stable config. Their
    // declared state is handled before parsing or compiling unavailable data.
    const raw=JSON.parse(host.dataset.uiEcharts);json(raw);const option=compile(raw,config,t),signature=JSON.stringify([host.dataset.uiEcharts,host.dataset.uiEchartsConfig,t]);
    if(typeof window.echarts?.init!=="function")throw Error("Load the official ECharts engine first");
    let entry=entries.get(host);if(!entry){entry={};entries.set(host,entry);if(typeof window.ResizeObserver==="function"){entry.observer=new window.ResizeObserver(()=>resize(host));entry.observer.observe(frame);}}
    entry.events=config.loading?{}:config.events;const dimensions=size(host);
    if(dimensions.width<=0||dimensions.height<=0){entry.pending=true;continue;}
    if(!entry.chart)entry.chart=window.echarts.getInstanceByDom?.(host)||window.echarts.init(host,null,{renderer:"canvas",...dimensions});
    bindEvents(host,entry);
    if(entry.signature!==signature) {
     const state=retainState(option,entry,entry.chart.getOption?.());
     // Native complete snapshots remove stale series/axes. Only unchanged declared
     // legend/zoom defaults carry forward the reader's current interaction state.
     entry.chart.setOption(option,{notMerge:true,silent:true});Object.assign(entry,state);entry.signature=signature;
    }
    if(config.loading)entry.chart.showLoading("default",{text:config.messages.loading,color:t.accent,textColor:t.text,maskColor:t.surface});else entry.chart.hideLoading();
    entry.pending=false;entry.chart.resize(dimensions);
   } catch(_) {release(host);frame.classList.add("is-empty");if(fallback)fallback.textContent=message;}
  }
 }
 function update(host,option,config) {const encoded=json(option),metadata=config===undefined?undefined:json(config);host.dataset.uiEcharts=encoded;if(metadata!==undefined)host.dataset.uiEchartsConfig=metadata;render(host);}
 window.GoHTMXUI=window.GoHTMXUI||{};window.GoHTMXUI.echarts={render,update,destroy};
 window.addEventListener("resize",()=>{for(const host of [...entries.keys()])resize(host);});
 document.addEventListener("gohtmxui:theme",()=>render());
 document.addEventListener("htmx:beforeCleanupElement",event=>destroy(event.detail.elt));
 document.addEventListener("htmx:afterSwap",event=>render(event.detail.elt));
 // HTMX 4 renamed its lifecycle events. Cleanup uses event.target rather
 // than detail.elt; a single after-swap event can cover multiple swap tasks,
 // so discover across the document (also releasing detached chart entries).
 document.addEventListener("htmx:before:cleanup",event=>destroy(event.target));
 document.addEventListener("htmx:after:swap",()=>render());
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>render());else render();
})();
