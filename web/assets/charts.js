(() => {
 "use strict";
 const charts=new Map(),selector="canvas[data-ui-chart]";
 const available=()=>typeof window.echarts?.init==="function";
 function release(canvas) {
  const entry=charts.get(canvas);charts.delete(canvas);entry?.observer?.disconnect();
  const registered=window.echarts?.getInstanceByDom?.(canvas);
  entry?.chart?.dispose();
  if(registered && registered!==entry?.chart) registered.dispose();
 }
 function destroy(root) {
  for(const canvas of [...charts.keys()]) if(canvas===root || root.contains?.(canvas)) release(canvas);
 }
 function theme(canvas) {
  const css=getComputedStyle(canvas),token=(name,fallback)=>css.getPropertyValue("--ghtui-"+name).trim()||fallback;
  return {muted:token("muted","#8b949e"),text:token("text","#f0f6fc"),surface:token("surface","#161b22"),border:token("border","#30363d"),accent:token("accent","#58a6ff"),font:css.fontFamily||"system-ui"};
 }
 function value(item) {
  if(item===null || typeof item==="number" && Number.isFinite(item)) return item;
  // Preserve the documented numeric Cartesian pair/object form without passing
  // arbitrary engine options or serialized callbacks into ECharts.
  const pair=Array.isArray(item)?item:item && typeof item==="object"?[item.x,item.y]:null;
  if(pair?.length===2 && (typeof pair[0]==="string" || typeof pair[0]==="number" && Number.isFinite(pair[0])) && (pair[1]===null || typeof pair[1]==="number" && Number.isFinite(pair[1]))) return pair;
  throw new Error("Invalid chart value");
 }
 const unitNames=new Set(["count","rate","qps","ms","us","usd","percent","bytes","bytes/s"]);
 const bytePrefixes={decimal:["B","kB","MB","GB","TB","PB","EB","ZB","YB"],binary:["B","KiB","MiB","GiB","TiB","PiB","EiB","ZiB","YiB"]};
 function messages(spec,fallback={}) {
  const source=spec?.messages??{};
  if(typeof source!=="object"||Array.isArray(source)||Object.entries(source).some(([key,text])=>!["empty","error","unavailable","loading"].includes(key)||typeof text!=="string"))throw new Error("Invalid messages");
  return {empty:fallback.uiEmptyMessage??"No reported data in this period.",error:fallback.uiErrorMessage||"Chart unavailable. Open the chart data table below.",unavailable:"Unavailable",loading:"Loading…",...source};
 }
 function presentation(spec,text) {
  let locale="en-US",dateLocale="en-GB";
  if(spec.locale!==undefined) {
   if(typeof spec.locale!=="string"||!spec.locale)throw new Error("Invalid locale");
   locale=Intl.getCanonicalLocales(spec.locale.replaceAll("_","-"))[0];
   if(!Intl.NumberFormat.supportedLocalesOf([locale]).length)throw new Error("Unsupported locale");
   dateLocale=locale;
  }
  if(spec.timeZone!==undefined&&typeof spec.timeZone!=="string")throw new Error("Invalid timezone");
  const timeZone=spec.timeZone??"UTC";
  const axisDate=new Intl.DateTimeFormat(dateLocale,{timeZone,month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  const tooltipDate=new Intl.DateTimeFormat(dateLocale,{timeZone,year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23",timeZoneName:"short"});
  return {locale,unavailable:text.unavailable,axisDate,tooltipDate};
 }
 function flag(value,fallback) {
  if(value!==undefined&&typeof value!=="boolean")throw new Error("Invalid presentation flag");return value??fallback;
 }
 function byteFactor(unit,rate) {
  if(typeof unit!=="string"||rate!==unit.endsWith("/s"))throw new Error("Invalid byte unit dimension");
  const prefix=rate?unit.slice(0,-2):unit;
  for(const [scale,names] of Object.entries(bytePrefixes)) {
   const index=names.indexOf(prefix);if(index>=0)return (scale==="binary"?1024:1000)**index;
  }
  throw new Error("Unknown byte prefix");
 }
 function formatConfig(source={},fallback={}) {
  const unit=source.unit??fallback.unit??"count",precision=source.precision??fallback.precision;
  if(!unitNames.has(unit)||precision!==undefined&&(!Number.isInteger(precision)||precision<0||precision>8))throw new Error("Invalid unit/precision");
  const config={unit,precision,locale:fallback.locale??"en-US",unavailable:fallback.unavailable??"Unavailable",numbers:new Map()};
  if(unit==="bytes"||unit==="bytes/s") {
   const rate=unit==="bytes/s",suffix=rate?"/s":"";
   config.scale=source.scale??fallback.scale??"decimal";
   if(typeof config.scale!=="string"||!Object.hasOwn(bytePrefixes,config.scale))throw new Error("Invalid byte scale");
   config.inputUnit=source.inputUnit??fallback.inputUnit??"B"+suffix;
   config.displayUnit=source.displayUnit??fallback.displayUnit??"auto";
   config.inputFactor=byteFactor(config.inputUnit,rate);
   if(config.displayUnit!=="auto") {
    config.outputFactor=byteFactor(config.displayUnit,rate);
    if(!bytePrefixes[config.scale].map(p=>p+suffix).includes(config.displayUnit))throw new Error("Output prefix conflicts with scale");
   }
  } else if(["scale","inputUnit","displayUnit"].some(key=>source[key]!==undefined))throw new Error("Byte conversion needs a byte unit");
  return config;
 }
 function numberFormat(config,precision,short=false,fixed=false) {
  const currency=config.unit==="usd"&&!fixed,key=[precision,short,fixed,currency].join(":");
  if(!config.numbers.has(key))config.numbers.set(key,new Intl.NumberFormat(config.locale,{maximumFractionDigits:precision,...(fixed?{minimumFractionDigits:precision}:currency?{style:"currency",currency:"USD",minimumFractionDigits:Math.min(2,precision)}:short&&config.unit==="count"?{notation:"compact"}:{})}));
  return config.numbers.get(key);
 }
 function formatted(n,config,short=false) {
  if(typeof n!=="number"||!Number.isFinite(n))return config.unavailable;
  const precision=config.precision??(config.unit==="count"?(short?2:4):config.unit==="usd"?4:2);
  if(config.unit==="bytes"||config.unit==="bytes/s") {
   const rate=config.unit==="bytes/s",step=config.scale==="binary"?1024:1000;
   let output=config.displayUnit,factor=config.outputFactor;
   if(output==="auto") {
    // Work in logarithms and divide factors before multiplication: huge finite
    // input values must not overflow merely because a prefix was declared.
    const exponent=n===0?0:Math.max(0,Math.min(8,Math.floor((Math.log(Math.abs(n))+Math.log(config.inputFactor))/Math.log(step)+1e-12)));
    factor=step**exponent;output=bytePrefixes[config.scale][exponent]+(rate?"/s":"");
   }
   const converted=n*(config.inputFactor/factor);
   return Number.isFinite(converted)?numberFormat(config,precision).format(converted)+" "+output:config.unavailable;
  }
  if(config.unit==="usd"&&n>0&&n<0.5*10**-precision)return "< USD "+numberFormat(config,precision,false,true).format(10**-precision);
  return numberFormat(config,precision,short).format(n)+({rate:"/s",qps:" QPS",ms:" ms",us:" \u00b5s",percent:"%"}[config.unit]||"");
 }
 function timestamp(value) {
  if(typeof value==="number"&&Number.isFinite(value)&&Math.abs(value)<=8640000000000000)return value;
  if(typeof value==="string"&&/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/i.test(value)) {
   const n=Date.parse(value);if(Number.isFinite(n))return n;
  }
  throw new Error("Use epoch milliseconds or an ISO timestamp with timezone");
 }
 function axisFormats(axisSpecs,datasets,bindings,base) {
  return axisSpecs.map((a,i)=>{
   const inherited={...base};
   // One numeric axis has one conversion. Infer omitted settings from its
   // bound series, rejecting incompatible declarations instead of mislabeling.
   for(const key of ["unit","inputUnit","displayUnit","scale"]) {
    const values=new Set(datasets.filter((_d,j)=>bindings[j]===i).map(d=>d[key]).filter(v=>v!==undefined));
    if(values.size>1||a[key]!==undefined&&[...values].some(v=>v!==a[key]))throw new Error("Different conversions require independent axes");
    if(values.size)inherited[key]=[...values][0];
   }
   return formatConfig(a,inherited);
  });
 }
 function sharedOptions(t,legend=false) {
  return {animation:false,textStyle:{color:t.muted,fontFamily:t.font,fontSize:10},backgroundColor:"transparent",color:[t.accent,"#a78bfa","#34d399","#fbbf24","#fb7185"],
   legend:{show:legend,bottom:0,left:"center",data:[],textStyle:{color:t.muted,fontFamily:t.font,fontSize:10},itemWidth:9,itemHeight:9},
   tooltip:{trigger:"item",renderMode:"richText",confine:true,backgroundColor:t.surface,borderColor:t.border,borderWidth:1,textStyle:{color:t.text,fontFamily:t.font,fontSize:11}},aria:{enabled:false},series:[]};
 }
 function datasetValid(dataset) {
  if(!dataset||!Array.isArray(dataset.data)||dataset.label!==undefined&&typeof dataset.label!=="string")throw new Error("Invalid dataset");
  if(dataset.borderColor!=null&&typeof dataset.borderColor!=="string"||dataset.backgroundColor!=null&&!(typeof dataset.backgroundColor==="string"||Array.isArray(dataset.backgroundColor)&&dataset.backgroundColor.every(c=>typeof c==="string")))throw new Error("Colors must be CSS strings");
 }
 function labelsValid(labels) {
  return Array.isArray(labels)&&labels.every(label=>typeof label==="string"||typeof label==="number"&&Number.isFinite(label));
 }
 function legendVisible(spec,fallback=false) {
  const config=typeof spec.legend==="boolean"?{show:spec.legend}:spec.legend??{};
  return !spec.compact&&flag(config.show,fallback);
 }
 function specialOptions(spec,t,display) {
  if(!Array.isArray(spec.datasets)||!spec.datasets.length)throw new Error("Datasets required");spec.datasets.forEach(datasetValid);
  const axes=spec.axes??[{}];if(!Array.isArray(axes)||axes.length!==1||!axes[0]||typeof axes[0]!=="object")throw new Error("One value format axis required");
  const axisID=axes[0].id??"primary";
  if(spec.datasets.some(d=>d.axis!==undefined&&d.axis!==axisID))throw new Error("Unknown format-axis binding");
  const format=axisFormats(axes,spec.datasets,spec.datasets.map(()=>0),formatConfig({unit:spec.format==="usd"?"usd":"count"},display))[0];
  const result=sharedOptions(t,legendVisible(spec,spec.type==="radar")),axis=axes[0],palette=result.color;
  const color=(dataset,i)=>dataset.borderColor||(Array.isArray(dataset.backgroundColor)?dataset.backgroundColor[0]:dataset.backgroundColor)||palette[i%palette.length];
  if(spec.type==="heatmap") {
   if(spec.datasets.length!==1||!labelsValid(spec.labels)||!labelsValid(spec.rows)||!spec.labels.length||!spec.rows.length)throw new Error("Heatmap needs category labels and one dataset");
   const seen=new Set(),data=[];let observedMin=Infinity,observedMax=-Infinity;
   for(const cell of spec.datasets[0].data) {
    if(!Array.isArray(cell)||cell.length!==3||!Number.isInteger(cell[0])||!Number.isInteger(cell[1])||cell[0]<0||cell[0]>=spec.labels.length||cell[1]<0||cell[1]>=spec.rows.length||cell[2]!==null&&(typeof cell[2]!=="number"||!Number.isFinite(cell[2])))throw new Error("Invalid heatmap cell");
    const key=cell[0]+":"+cell[1];if(seen.has(key))throw new Error("Duplicate heatmap cell");seen.add(key);
    if(cell[2]!==null){data.push(cell.slice());observedMin=Math.min(observedMin,cell[2]);observedMax=Math.max(observedMax,cell[2]);}
   }
   const range=spec.colorRange??{};
   let min=range.min??(data.length?observedMin:0),max=range.max??(data.length?observedMax:1);
   // Expand a constant display extent by a relative amount, not by1 (which
   // rounds away at large magnitudes). Keep both endpoints finite at MAX_VALUE.
   if(range.max===undefined&&max<=min) {
    const padding=min===0?1:Math.max(Number.MIN_VALUE,Math.abs(min)*1e-6);
    max=min+padding;
    if(!Number.isFinite(max)&&range.min===undefined){max=min;min-=padding;}
   } else if(range.min===undefined&&min>=max)min=max-(max===0?1:Math.max(Number.MIN_VALUE,Math.abs(max)*1e-6));
   if(typeof min!=="number"||typeof max!=="number"||!Number.isFinite(min)||!Number.isFinite(max)||min>=max)throw new Error("Invalid color range");
   const colors=range.palette??[t.surface,t.accent];if(!Array.isArray(colors)||colors.length<2||colors.length>10||colors.some(c=>typeof c!=="string"))throw new Error("Invalid color palette");
   const category=(values,inverse=false)=>({type:"category",data:values,inverse,splitArea:{show:true},axisLine:{show:false},axisTick:{show:false},axisLabel:{show:flag(spec.showAxisLabels,true),color:t.muted,fontFamily:t.font,fontSize:10}});
   result.xAxis=category(spec.labels);result.yAxis=category(spec.rows,true);result.grid={top:8,right:12,bottom:45,left:8,containLabel:true};
   result.visualMap={min,max,calculable:false,orient:"horizontal",left:"center",bottom:0,itemWidth:12,itemHeight:100,textStyle:{color:t.muted,fontFamily:t.font,fontSize:10},inRange:{color:colors},formatter:n=>formatted(n,format)};
   result.series=[{id:"cells",type:"heatmap",data,label:{show:flag(spec.cellLabels,false),color:t.text,fontSize:10,formatter:p=>formatted(p.value[2],format)},animation:false}];
   result.tooltip.formatter=p=>[spec.labels[p.value[0]],spec.rows[p.value[1]],formatted(p.value[2],format)].join(" / ");
   if(!data.length)result.title={text:display.unavailable,left:"center",textStyle:{color:t.muted,fontSize:12}};
  } else if(spec.type==="radar") {
   if(!Array.isArray(spec.indicators)||spec.indicators.length<3)throw new Error("Radar needs three or more indicators");
   const indicators=spec.indicators.map(indicator=>{
    if(!indicator||typeof indicator.name!=="string"||!indicator.name||typeof indicator.max!=="number"||!Number.isFinite(indicator.max)||indicator.min!==undefined&&(typeof indicator.min!=="number"||!Number.isFinite(indicator.min))||indicator.max<=(indicator.min??0))throw new Error("Invalid radar indicator");
    return {name:indicator.name,min:indicator.min??0,max:indicator.max};
   });
   result.radar={indicator:indicators,radius:"62%",center:["50%","45%"],axisName:{color:t.muted,fontFamily:t.font,fontSize:10},splitLine:{lineStyle:{color:t.border}},axisLine:{lineStyle:{color:t.border}},splitArea:{areaStyle:{color:[t.surface,"transparent"]}}};
   const data=spec.datasets.map((dataset,i)=>{
    if(dataset.data.length!==indicators.length||dataset.data.some(n=>typeof n!=="number"||!Number.isFinite(n)))throw new Error("Radar requires complete numeric vectors");
    return {name:dataset.label??String(i+1),value:dataset.data.slice(),itemStyle:{color:color(dataset,i)},lineStyle:{color:color(dataset,i),width:2},...(dataset.fill?{areaStyle:{opacity:0.12}}:{})};
   });
   result.legend.data=data.map(d=>d.name);result.series=[{id:"radar",type:"radar",data,animation:false}];
   result.tooltip.formatter=p=>[p.name,...indicators.map((a,i)=>a.name+": "+formatted(p.value[i],format))].join("\n");
  } else {
   if(spec.datasets.length!==1||spec.datasets[0].data.length!==1)throw new Error("One gauge value required");
   const n=spec.datasets[0].data[0],min=axis.min??0,max=axis.max??100;
   if(n!==null&&(typeof n!=="number"||!Number.isFinite(n))||typeof min!=="number"||typeof max!=="number"||!Number.isFinite(min)||!Number.isFinite(max)||min>=max)throw new Error("Invalid gauge value/range");
   result.series=[{id:"gauge",type:"gauge",min,max,radius:"80%",center:["50%","50%"],progress:{show:true,width:12},axisLine:{lineStyle:{width:12,color:[[1,t.border]]}},axisTick:{show:false},splitLine:{length:8,lineStyle:{color:t.muted}},axisLabel:{color:t.muted,fontSize:9,formatter:n=>formatted(n,format,true)},pointer:{width:4},itemStyle:{color:color(spec.datasets[0],0)},detail:{color:t.text,fontFamily:t.font,fontSize:18,offsetCenter:[0,"65%"],formatter:n=>formatted(n,format)},title:{color:t.muted,fontSize:10},data:n===null?[]:[{name:spec.datasets[0].label??"",value:n}],animation:false}];
   result.tooltip.formatter=p=>formatted(p.value,format);
   if(n===null)result.title={text:display.unavailable,left:"center",top:"40%",textStyle:{color:t.muted,fontSize:12}};
  }
  return result;
 }
 function applyControls(spec,option) {
  const tooltip=typeof spec.tooltip==="boolean"?{show:spec.tooltip}:spec.tooltip??{};
  if(typeof tooltip!=="object"||Array.isArray(tooltip)||Object.keys(tooltip).some(k=>!["show","trigger"].includes(k))||tooltip.trigger!==undefined&&!["item","axis"].includes(tooltip.trigger))throw new Error("Invalid tooltip settings");
  const cartesian=["line","bar","scatter","bubble"].includes(spec.type);
  if(!cartesian&&tooltip.trigger==="axis")throw new Error("This chart needs item tooltips");
  option.tooltip.show=flag(tooltip.show,true);option.tooltip.trigger=tooltip.trigger??option.tooltip.trigger;
  const zoom=typeof spec.zoom==="boolean"?{enabled:spec.zoom}:spec.zoom??{};
  if(typeof zoom!=="object"||Array.isArray(zoom)||Object.keys(zoom).some(k=>!["enabled","slider","start","end"].includes(k)))throw new Error("Invalid zoom settings");
  const enabled=flag(zoom.enabled,spec.zoom!==undefined),slider=flag(zoom.slider,false),start=zoom.start??0,end=zoom.end??100;
  if(typeof start!=="number"||typeof end!=="number"||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>100||start>=end||enabled&&!cartesian)throw new Error("Invalid zoom range/chart type");
  if(enabled) {
   const binding=spec.horizontal?{yAxisIndex:0}:{xAxisIndex:0};
   option.dataZoom=[{id:"inside",type:"inside",...binding,start,end,filterMode:"none"}];
   if(slider){option.dataZoom.push({id:"slider",type:"slider",orient:"horizontal",...binding,start,end,filterMode:"none",height:16,bottom:option.legend.show?34:12,textStyle:option.textStyle});option.grid.bottom=option.legend.show?74:50;if(option.legend.show)option.legend.type="scroll";}
  }
  return eventConfig(spec.events);
 }
 function eventConfig(source={}) {
  if(!source||typeof source!=="object"||Array.isArray(source)||Object.keys(source).some(k=>!["select","zoom"].includes(k)))throw new Error("Invalid event configuration");
  return {select:flag(source.select,false),zoom:flag(source.zoom,false)};
 }
 function emit(canvas,type,detail) {
  if(typeof window.CustomEvent==="function"&&typeof canvas.dispatchEvent==="function")canvas.dispatchEvent(new window.CustomEvent("gohtmxui:chart-"+type,{bubbles:true,detail:{chartId:canvas.id,...detail}}));
 }
 function eventValue(value) {
  if(value===null||typeof value==="string"||typeof value==="number"&&Number.isFinite(value))return value;
  if(Array.isArray(value)&&value.every(n=>n===null||typeof n==="string"||typeof n==="number"&&Number.isFinite(n)))return value.slice();
 }
 function bindEvents(canvas,entry) {
  if(entry.bound||typeof entry.chart.on!=="function")return;entry.bound=true;
  entry.chart.on("click",p=>{if(entry.events?.select)emit(canvas,"select",{seriesId:typeof p.seriesId==="string"?p.seriesId:undefined,seriesIndex:Number.isInteger(p.seriesIndex)?p.seriesIndex:undefined,dataIndex:Number.isInteger(p.dataIndex)?p.dataIndex:undefined,name:typeof p.name==="string"?p.name:"",value:eventValue(p.value)});});
  entry.chart.on("datazoom",p=>{const source=p?.batch?.[0]??p;if(entry.events?.zoom&&Number.isFinite(source?.start)&&Number.isFinite(source?.end))emit(canvas,"zoom",{start:source.start,end:source.end});});
 }
 function bubbleValue(item) {
  const p=Array.isArray(item)?item:item&&typeof item==="object"?[item.x,item.y,item.size]:null;
  if(!p||p.length!==3||!(typeof p[0]==="string"||typeof p[0]==="number"&&Number.isFinite(p[0]))||p[1]!==null&&(typeof p[1]!=="number"||!Number.isFinite(p[1]))||typeof p[2]!=="number"||!Number.isFinite(p[2])||p[2]<2||p[2]>128)throw new Error("Bubble needs x/y and2-128px diameter");
  return p.slice();
 }
 function options(spec,t,display) {
  if(["heatmap","radar","gauge"].includes(spec?.type))return specialOptions(spec,t,display);
  const scatter=["scatter","bubble"].includes(spec?.type),domain={type:scatter?"value":"category",...(spec?.domain??{})},time=domain.type==="time",numeric=domain.type==="value",labels=spec?.labels??(time||numeric?[]:null);
  if(!spec||!["line","bar","doughnut","pie","scatter","bubble"].includes(spec.type)||!Array.isArray(labels)||!Array.isArray(spec.datasets)||!["time","category","value"].includes(domain.type))throw new Error("Invalid chart data");
  for(const bounds of [spec.bounds,...spec.datasets.map(d=>d?.bounds)])if(bounds!==undefined&&(!Array.isArray(bounds)||bounds.some(b=>typeof b!=="string")))throw new Error("Invalid bucket context");
  if(labels.some(label=>typeof label!=="string"&&!(typeof label==="number"&&Number.isFinite(label)))||spec.datasets.some(d=>d?.label!==undefined&&typeof d.label!=="string"))throw new Error("Labels must be primitive text/numbers, not engine options");
  const pie=["doughnut","pie"].includes(spec.type),legendConfig=typeof spec.legend==="boolean"?{show:spec.legend}:spec.legend??{};
  if(legendConfig.show!==undefined&&typeof legendConfig.show!=="boolean")throw new Error("Invalid legend visibility");
  const legend=!spec.compact&&(legendConfig.show??(pie||!!spec.stacked)),base=formatConfig({unit:spec.format==="usd"?"usd":"count"},display);
  const showAxisLabels=flag(spec.showAxisLabels,true),showPoints=flag(spec.showPoints,true);
  const domainFormat=numeric?formatConfig(domain,display):null;
  if(domain.label!==undefined&&typeof domain.label!=="string")throw new Error("Invalid domain label");
  const sourceAxes=spec.axes??[{}];if(!Array.isArray(sourceAxes)||!sourceAxes.length)throw new Error("At least one value axis is required");
  const ids=new Map(),axisSpecs=sourceAxes.map((a,i)=>{
   if(!a||typeof a!=="object")throw new Error("Invalid axis");
   const id=a.id??(sourceAxes.length===1?"primary":null);
   if(typeof id!=="string"||!id||ids.has(id))throw new Error("Axes require distinct IDs");ids.set(id,i);return {...a,id};
  });
  const bindings=spec.datasets.map(d=>{
   if(!d||!Array.isArray(d.data))throw new Error("Invalid dataset");
   const index=d.axis===undefined?0:ids.get(d.axis);if(index===undefined)throw new Error("Unknown dataset axis");return index;
  });
  const formats=axisFormats(axisSpecs,spec.datasets,bindings,base);
  const metas=[],legendLabels=new Map(),result=sharedOptions(t,legend),palette=result.color;
  result.legend.formatter=name=>legendLabels.get(name)??name;
  result.tooltip.trigger=pie||scatter?"item":"axis";
  if(!pie)result.tooltip.axisPointer={axis:spec.horizontal?"y":"x"};
  result.tooltip.formatter=params=>{
    const items=Array.isArray(params)?params:[params],first=items[0];if(!first)return "";
    const firstMeta=metas[first.seriesIndex],original=firstMeta?.indices[first.dataIndex]??first.dataIndex;
    const rawTime=firstMeta?.times[first.dataIndex],rawX=firstMeta?.xs[first.dataIndex];
    const title=time&&rawTime!==undefined?display.tooltipDate.format(rawTime):numeric&&rawX!==undefined?(domain.label?domain.label+": ":"")+formatted(rawX,domainFormat):first.axisValueLabel??first.name??labels[original]??"",bounds=spec.bounds?.[original];
    return [title,bounds,...items.map(p=>{
     const meta=metas[p.seriesIndex],n=Array.isArray(p.value)?p.value[1]:p.value,context=meta?.contexts[p.dataIndex];
     const name=meta?.label??p.seriesName??"";
     return (name?name+": ":"")+formatted(n,meta?.format??base)+(context?" ["+context+"]":"");
    })].filter(v=>v!==undefined&&v!=="").join("\n");
   };
  // Keep the caller's accessible canvas label and real data disclosure table.
  if(!pie) {
   const category={type:domain.type,boundaryGap:time||numeric?[0,0]:spec.type==="bar",...(time||numeric?{}:{data:labels}),axisLine:{show:false},axisTick:{show:false},axisLabel:{show:showAxisLabels,color:t.muted,fontFamily:t.font,fontSize:10,hideOverlap:true,...(time?{formatter:n=>display.axisDate.format(n)}:numeric?{formatter:n=>formatted(n,domainFormat,true)}:{})},splitLine:{show:false}};
   for(const field of ["min","max"])if(domain[field]!=null){
    if(time)category[field]=timestamp(domain[field]);
    else if(numeric&&typeof domain[field]==="number"&&Number.isFinite(domain[field]))category[field]=domain[field];
    else if(!numeric&&(typeof domain[field]==="string"&&labels.includes(domain[field])||Number.isInteger(domain[field])&&domain[field]>=0&&domain[field]<labels.length))category[field]=domain[field];
    else throw new Error("Invalid domain range");
   }
   if((time||numeric)&&category.min!==undefined&&category.max!==undefined&&category.min>=category.max)throw new Error("Invalid time range");
   const axes=axisSpecs.map((a,i)=>{
    for(const field of ["min","max","offset"])if(a[field]!=null&&(typeof a[field]!=="number"||!Number.isFinite(a[field])))throw new Error("Invalid axis bound");
    if(a.min!=null&&a.max!=null&&a.min>=a.max||a.alignTicks!==undefined&&typeof a.alignTicks!=="boolean"||a.splitNumber!==undefined&&(!Number.isInteger(a.splitNumber)||a.splitNumber<1||a.splitNumber>20))throw new Error("Invalid axis scale");
    const position=a.position??(spec.horizontal?(i?"top":"bottom"):(i?"right":"left"));
    if(!(spec.horizontal?["top","bottom"]:["left","right"]).includes(position))throw new Error("Invalid axis position");
    return {id:a.id,type:"value",position,min:a.min??(extent=>Math.min(0,extent.min)),...(a.max!=null?{max:a.max}:{}),...(a.alignTicks!==undefined?{alignTicks:a.alignTicks}:{}),...(a.splitNumber!==undefined?{splitNumber:a.splitNumber}:{}),...(a.offset!==undefined?{offset:a.offset}:{}),name:typeof a.label==="string"?a.label:"",nameTextStyle:{color:t.muted,fontFamily:t.font,fontSize:10},axisLine:{show:false},axisTick:{show:false},axisLabel:{show:flag(a.showLabels,showAxisLabels),color:t.muted,fontFamily:t.font,fontSize:10,formatter:n=>formatted(n,formats[i],true)},splitLine:{show:i===0,lineStyle:{color:t.border}}};
   });
   result.grid={top:8,right:12,bottom:legend?32:8,left:8,containLabel:true};
   result.xAxis=spec.horizontal?(axes.length===1?axes[0]:axes):category;
   result.yAxis=spec.horizontal?{...category,inverse:!time&&!numeric}:(axes.length===1?axes[0]:axes);
  }
  for(const [index,dataset] of spec.datasets.entries()) {
   datasetValid(dataset);
   if(dataset.borderColor!=null&&typeof dataset.borderColor!=="string"||dataset.backgroundColor!=null&&!(typeof dataset.backgroundColor==="string"||Array.isArray(dataset.backgroundColor)&&dataset.backgroundColor.every(c=>typeof c==="string")))throw new Error("Colors must be CSS strings, not engine pattern objects");
   const type=dataset.type||spec.type;
   if(type==="bar"&&spec.horizontal&&numeric)throw new Error("Horizontal bars require category or time domains");
   if(!["line","bar","doughnut","pie","scatter","bubble"].includes(type)||(["doughnut","pie"].includes(type))!==pie)throw new Error("Unsupported mixed chart type");
   const format=formatConfig(dataset,formats[bindings[index]]),color=dataset.borderColor||(!Array.isArray(dataset.backgroundColor)&&dataset.backgroundColor)||palette[index%palette.length];
   let points=dataset.data.map((item,i)=>({value:type==="bubble"?bubbleValue(item):value(item),index:i}));
   if((time||numeric)&&!pie) {
    points=points.map(p=>{
     const x=Array.isArray(p.value)?p.value[0]:labels[p.index],rest=Array.isArray(p.value)?p.value.slice(1):[p.value];
     if(numeric&&(typeof x!=="number"||!Number.isFinite(x)))throw new Error("Value domains require numeric x values");
     return {value:[time?timestamp(x):x,...rest],index:p.index};
    });points.sort((a,b)=>a.value[0]-b.value[0]);
   }
   if(["scatter","bubble"].includes(type)&&points.some(p=>!Array.isArray(p.value)||!time&&!numeric&&!(typeof p.value[0]==="string"&&labels.includes(p.value[0])||Number.isInteger(p.value[0])&&p.value[0]>=0&&p.value[0]<labels.length)))throw new Error("Scatter needs valid Cartesian points");
   if(spec.horizontal&&!pie&&points.some(p=>Array.isArray(p.value)))points=points.map(p=>Array.isArray(p.value)?p:{value:[p.index,p.value],index:p.index});
   const data=points.map(({value:n,index:i})=>{
    if(pie){if(Array.isArray(n))throw new Error("Invalid pie value");return {name:String(labels[i]??i),value:n,itemStyle:{color:Array.isArray(dataset.backgroundColor)?dataset.backgroundColor[i]:dataset.backgroundColor||palette[i%palette.length]}}}
    return Array.isArray(dataset.backgroundColor)?{value:n,itemStyle:{color:dataset.backgroundColor[i]}}:n;
   });
   let name=dataset.label||"",label=name;
   if(dataset.legendGroup!==undefined) {
    if(pie||typeof dataset.legendGroup!=="string"||!dataset.legendGroup||dataset.legendLabel!==undefined&&typeof dataset.legendLabel!=="string")throw new Error("Invalid legend group");
    name="group:"+dataset.legendGroup;const groupLabel=dataset.legendLabel??dataset.legendGroup;
    if(legendLabels.has(name)&&legendLabels.get(name)!==groupLabel)throw new Error("Inconsistent group label");
    legendLabels.set(name,groupLabel);label=groupLabel+(label?" / "+label:"");
   } else legendLabels.set(name,name);
   if(!pie&&!result.legend.data.includes(name))result.legend.data.push(name);
   metas.push({label,format,xs:numeric?points.map(p=>p.value[0]):[],times:time?points.map(p=>p.value[0]):[],indices:points.map(p=>p.index),contexts:points.map(p=>dataset.bounds?.[p.index])});
   const series={id:String(dataset.id??index),name,type:pie?"pie":type==="bubble"?"scatter":type,data,animation:false};
   if(pie)Object.assign(series,{radius:[spec.type==="pie"?0:"72%",spec.compact?"100%":"96%"],center:["50%","50%"],bottom:legend?28:0,label:{show:false},labelLine:{show:false},itemStyle:{borderWidth:spec.compact?0:1,borderColor:t.surface},emphasis:{scale:false},stillShowZeroSum:false});
   else {
    const stack=dataset.stack===false||dataset.stack===null?undefined:typeof dataset.stack==="string"?dataset.stack:spec.stacked&&type===spec.type?"total":undefined;
    Object.assign(series,{...(spec.horizontal?{xAxisIndex:bindings[index],yAxisIndex:0}:{yAxisIndex:bindings[index],xAxisIndex:0}),stack,itemStyle:{color,borderRadius:type==="bar"?3:0},lineStyle:{color,width:2},symbolSize:3,showSymbol:flag(dataset.showPoints,showPoints),symbol:flag(dataset.showPoints,showPoints)?"emptyCircle":"none",connectNulls:false,smooth:Math.max(0,Math.min(1,Number(dataset.tension)||0)),areaStyle:dataset.fill?{color:dataset.backgroundColor||color,opacity:dataset.backgroundColor?1:0.12}:undefined});
   }
   // Public Cartesian data stays [domain,value], even when the axes swap.
   if(spec.horizontal&&!pie&&points.some(p=>Array.isArray(p.value)))series.encode={x:1,y:0};
   if(["scatter","bubble"].includes(type))Object.assign(series,{symbol:"circle",symbolSize:type==="bubble"?v=>v[2]:6});
   result.series.push(series);
  }
  if(pie)result.legend.data=labels.map(String);
  return result;
 }
 function dimensions(canvas) {
  const frame=canvas.parentElement,rect=frame.getBoundingClientRect();
  return {width:Math.round(rect.width),height:Math.round(rect.height),silent:true};
 }
 function resize(canvas) {
  const entry=charts.get(canvas);if(!entry)return;
  if(canvas.isConnected===false){release(canvas);return;}
  const size=dimensions(canvas);if(size.width<=0||size.height<=0)return;
  if(!entry.chart){render(canvas);return;}
  if(entry.pending) {
   // A snapshot can arrive while an existing widget has zero size. Apply that
   // deferred snapshot on reveal before resizing the same live instance.
   render(canvas);charts.get(canvas)?.chart?.resize(size);return;
  }
  entry.chart.resize(size);
 }
 function render(root=document) {
  for(const canvas of [...charts.keys()]) if(canvas.isConnected===false) release(canvas);
  const canvases=[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
  for(const canvas of canvases) {
   const frame=canvas.parentElement,fallback=frame.nextElementSibling;
   let text={error:fallback?.dataset.uiErrorMessage||"Chart unavailable. Open the chart data table below."};
   try {
    const spec=JSON.parse(canvas.dataset.uiChart);
    text=messages(spec,fallback?.dataset);const display=presentation(spec,text);
    if(fallback)fallback.textContent=text.empty;
    const loading=flag(spec?.loading,false);
    frame.classList.toggle("is-empty",!!spec?.empty||loading);
    if(loading){if(fallback)fallback.textContent=text.loading;const prior=charts.get(canvas);if(prior)prior.events={};continue;}
    if(spec?.empty){release(canvas);continue;}
    if(!available())throw new Error("Chart engine unavailable");
    const t=theme(canvas),option=options(spec,t,display),events=applyControls(spec,option),signature=JSON.stringify([spec,t]);
    let entry=charts.get(canvas);
    if(!entry) {
     entry={chart:null,signature:null,observer:null};charts.set(canvas,entry);
     if(typeof window.ResizeObserver==="function") {entry.observer=new window.ResizeObserver(()=>resize(canvas));entry.observer.observe(frame);}
    }
    entry.events=events;
    const size=dimensions(canvas);
    // Hidden tabs have no size. Keep the observer, then initialize when visible.
    if(size.width<=0||size.height<=0){entry.pending=true;continue;}
    if(entry.signature===signature){entry.pending=false;continue;}
    if(!entry.chart)entry.chart=window.echarts.getInstanceByDom?.(canvas)||window.echarts.init(canvas,null,{renderer:"canvas",width:size.width,height:size.height});
    bindEvents(canvas,entry);
    const previous=entry.chart.getOption?.(),zoomSignature=JSON.stringify(option.dataZoom?[option.dataZoom[0].start,option.dataZoom[0].end,option.dataZoom.length,spec.horizontal?"y":"x"]:null);
    if(entry.zoomSignature===zoomSignature&&option.dataZoom&&previous?.dataZoom?.length) {
     const {start,end}=previous.dataZoom[0];if(Number.isFinite(start)&&Number.isFinite(end))for(const zoom of option.dataZoom)Object.assign(zoom,{start,end});
    }
    const selected=previous?.legend?.[0]?.selected;
    if(selected) {
     const names=option.legend.data;
     option.legend.selected=Object.fromEntries(names.filter(name=>Object.hasOwn(selected,name)).map(name=>[name,selected[name]]));
    }
    // Replace the complete option so removed series/axes cannot survive a type
    // change. Preserve explicit legend selection across otherwise fresh options.
    entry.chart.setOption(option,{notMerge:true,silent:true});entry.signature=signature;entry.zoomSignature=zoomSignature;entry.pending=false;
   } catch(_) {
    release(canvas);canvas.parentElement.classList.add("is-empty");
    const message=canvas.parentElement.nextElementSibling;
    if(message)message.textContent=text.error;
   }
  }
 }
 window.GoHTMXUI=window.GoHTMXUI||{};window.GoHTMXUI.charts={render,destroy};
 window.addEventListener("resize",()=>{for(const canvas of [...charts.keys()])resize(canvas)});
 document.addEventListener("htmx:beforeCleanupElement",event=>destroy(event.detail.elt));
 document.addEventListener("htmx:afterSwap",event=>render(event.detail.elt));
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>render());else render();
})();
