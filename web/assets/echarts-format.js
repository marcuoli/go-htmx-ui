// Shared display-only numeric/date conversion for native ECharts callbacks.
// No chart type, geometry, series/axis builder or legacy schema translation.
(() => {
 "use strict";
 const unitNames=new Set(["count","rate","qps","ms","us","usd","percent","bytes","bytes/s","bits","bits/s","data","data-rate","custom"]);
 const bytePrefixes={decimal:["B","kB","MB","GB","TB","PB","EB","ZB","YB"],binary:["B","KiB","MiB","GiB","TiB","PiB","EiB","ZiB","YiB"]};
 const bitPrefixes={decimal:["b","kb","Mb","Gb","Tb","Pb","Eb","Zb","Yb"],binary:["b","Kib","Mib","Gib","Tib","Pib","Eib","Zib","Yib"]};
 const periods={s:1,min:60,h:3600,d:86400},dataUnits=new Map();
 for(const [kind,families] of [["bytes",bytePrefixes],["bits",bitPrefixes]])for(const [scale,names] of Object.entries(families))names.forEach((label,index)=>dataUnits.set(label,{kind,scale:index?scale:null,factor:(kind==="bytes"?8:1)*(scale==="binary"?1024:1000)**index}));
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
 function unitText(value) {
  if(typeof value!=="string"||!value.trim()||value.length>80||/[\x00-\x1f\x7f]/.test(value))throw new Error("Invalid unit label");return value;
 }
 function rateUnit(label) {
  const parts=unitText(label).split("/");
  if(parts.length!==2||!Object.hasOwn(periods,parts[1]))throw new Error("Use an explicit /s, /min, /h or /d time base");
  return {numerator:parts[0],period:parts[1]};
 }
 function dataUnit(label,rate) {
  unitText(label);const parsed=rate?rateUnit(label):{numerator:label,period:null},base=dataUnits.get(parsed.numerator);
  if(!base)throw new Error("Unknown case-sensitive bit/byte unit");
  return {...base,period:parsed.period,factor:base.factor/(parsed.period?periods[parsed.period]:1)};
 }
 function conversionRule(rule) {
  if(!rule||typeof rule!=="object"||Array.isArray(rule)||Object.keys(rule).some(key=>!["factor","offset"].includes(key))||typeof rule.factor!=="number"||!Number.isFinite(rule.factor)||rule.factor<=0||rule.offset!==undefined&&(typeof rule.offset!=="number"||!Number.isFinite(rule.offset)))throw new Error("Custom conversion needs a positive finite factor and finite offset");
  return {factor:rule.factor,offset:rule.offset??0};
 }
 function formatConfig(source={},fallback={}) {
  const unit=source.unit??fallback.unit??"count",precision=source.precision??fallback.precision;
  if(!unitNames.has(unit)||precision!==undefined&&(!Number.isInteger(precision)||precision<0||precision>8))throw new Error("Invalid unit/precision");
  const config={unit,precision,locale:fallback.locale??"en-US",unavailable:fallback.unavailable??"Unavailable",numbers:new Map()};
  const rule=source.conversion!==undefined?source.conversion:fallback.conversion;
  if(["bytes","bytes/s","bits","bits/s","data","data-rate"].includes(unit)) {
   if(rule!==undefined)throw new Error("Built-in data units do not accept custom conversion rules");
   const rate=unit.endsWith("/s")||unit==="data-rate",generic=unit==="data"||unit==="data-rate",aliasKind=unit.startsWith("bits")?"bits":"bytes";
   config.inputUnit=source.inputUnit??fallback.inputUnit??(aliasKind==="bits"?"b":"B")+(rate?"/s":"");
   config.displayUnit=source.displayUnit??fallback.displayUnit??"auto";
   const input=dataUnit(config.inputUnit,rate),automatic=config.displayUnit==="auto"||typeof config.displayUnit==="string"&&config.displayUnit.startsWith("auto/");
   let output;
   if(automatic) {
    const outputPeriod=config.displayUnit==="auto"?(rate?(generic?input.period:"s"):null):rate?rateUnit(config.displayUnit).period:null;
    if(config.displayUnit!=="auto"&&!rate)throw new Error("A quantity cannot be displayed as a rate");
    config.outputPeriod=outputPeriod;config.outputKind=generic?input.kind:aliasKind;
   } else output=dataUnit(config.displayUnit,rate);
   config.scale=source.scale??fallback.scale??(generic?(output?.scale??input.scale??"decimal"):"decimal");
   if(typeof config.scale!=="string"||!Object.hasOwn(bytePrefixes,config.scale)||output?.scale&&output.scale!==config.scale)throw new Error("Output prefix conflicts with scale");
   config.mode="data";config.inputFactor=input.factor;
   if(output)config.outputFactor=output.factor;
   else {
    config.outputBaseFactor=(config.outputKind==="bytes"?8:1)/(config.outputPeriod?periods[config.outputPeriod]:1);
    config.outputNames=(config.outputKind==="bytes"?bytePrefixes:bitPrefixes)[config.scale];
   }
  } else if(unit==="rate"||unit==="custom") {
   if(source.scale!==undefined||fallback.scale!==undefined)throw new Error("Prefix scaling applies to data units only");
   config.mode="linear";
   if(unit==="rate") {
    if(rule!==undefined)throw new Error("Named rates convert their known time base; use custom for other rules");
    config.inputUnit=source.inputUnit??fallback.inputUnit??"/s";config.displayUnit=source.displayUnit??fallback.displayUnit??config.inputUnit;
    const input=rateUnit(config.inputUnit),output=rateUnit(config.displayUnit);
    if(input.numerator!==output.numerator)throw new Error("Different rate numerators require a custom rule");
    config.factor=periods[output.period]/periods[input.period];config.offset=0;
   } else {
    config.displayUnit=unitText(source.displayUnit??fallback.displayUnit??source.inputUnit??fallback.inputUnit);
    config.inputUnit=unitText(source.inputUnit??fallback.inputUnit??config.displayUnit);
    if(rule===undefined&&config.inputUnit!==config.displayUnit)throw new Error("Different custom units require an explicit conversion rule");
    config.conversion=rule===undefined?undefined:conversionRule(rule);
    config.factor=config.conversion?.factor??1;config.offset=config.conversion?.offset??0;
   }
  } else if(["scale","inputUnit","displayUnit","conversion"].some(key=>source[key]!==undefined||fallback[key]!==undefined))throw new Error("Use a data, rate or custom unit for conversion");
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
  if(config.mode==="data") {
   let output=config.displayUnit,factor=config.outputFactor;
   if(config.outputNames) {
    const step=config.scale==="binary"?1024:1000;
    // Ratios and logarithms avoid overflowing a finite value merely because
    // input/output prefixes or time bases differ. Samples remain untouched.
    const exponent=n===0?0:Math.max(0,Math.min(8,Math.floor((Math.log(Math.abs(n))+Math.log(config.inputFactor)-Math.log(config.outputBaseFactor))/Math.log(step)+1e-12)));
    factor=config.outputBaseFactor*step**exponent;output=config.outputNames[exponent]+(config.outputPeriod?"/"+config.outputPeriod:"");
   }
   const converted=n*(config.inputFactor/factor);
   return Number.isFinite(converted)?numberFormat(config,precision).format(converted)+" "+output:config.unavailable;
  }
  if(config.mode==="linear") {
   let converted=n*config.factor;
   if(!Number.isFinite(converted)&&config.offset&&Math.sign(n)!==Math.sign(config.offset))converted=(n+config.offset/config.factor)*config.factor;
   else if(config.offset)converted+=config.offset;
   const separator=config.displayUnit.startsWith("/")?"":" ";
   return Number.isFinite(converted)?numberFormat(config,precision).format(converted)+separator+config.displayUnit:config.unavailable;
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

 function compile(spec={},settings={}) {
  if(!spec||typeof spec!=="object"||Array.isArray(spec)||Object.keys(spec).some(k=>!["unit","precision","scale","inputUnit","displayUnit","conversion"].includes(k)))throw new Error("Invalid value format");
  if(settings.unavailable!==undefined&&typeof settings.unavailable!=="string")throw new Error("Invalid unavailable text");
  const display=presentation(settings,{unavailable:settings.unavailable??"Unavailable"});
  if(spec.unit==="time") {
   if(Object.keys(spec).some(k=>k!=="unit"))throw new Error("Time uses locale and timeZone, not numeric conversion fields");
   return (n,_compact=false,detail=false)=>{try{return (detail?display.tooltipDate:display.axisDate).format(timestamp(n));}catch(_){return display.unavailable;}};
  }
  const config=formatConfig(spec,display);
  return (n,compact=false)=>formatted(n,config,compact);
 }
 window.GoHTMXUI=window.GoHTMXUI||{};
 window.GoHTMXUI.echartsFormat={compile};
})();
