(() => {
 "use strict";
 const charts=new Map(),selector="canvas[data-ui-chart]";
 function destroy(root) {
  for(const [canvas,entry] of charts) {
   if(canvas===root || root.contains?.(canvas)) {entry.chart.destroy();charts.delete(canvas);}
  }
 }
 function theme(canvas) {
  const css=getComputedStyle(canvas),token=(name,fallback)=>css.getPropertyValue("--ghtui-"+name).trim()||fallback;
  return {muted:token("muted","#8b949e"),text:token("text","#f0f6fc"),surface:token("surface","#161b22"),border:token("border","#30363d"),font:css.fontFamily||"system-ui"};
 }
 function options(spec,t) {
  const money=value=>value>0&&value<0.00005?"< USD 0.0001":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:4}).format(value);
  const result={responsive:true,maintainAspectRatio:false,animation:false,color:t.muted,font:{family:t.font,size:10},plugins:{legend:{display:!spec.compact&&(spec.type==="doughnut"||!!spec.stacked),position:"bottom",labels:{boxWidth:9,boxHeight:9,padding:14,color:t.muted,font:{size:10}}},tooltip:{backgroundColor:t.surface,borderColor:t.border,borderWidth:1,titleColor:t.text,bodyColor:t.text,callbacks:{afterTitle:items=>spec.bounds?.[items[0]?.dataIndex]||""}}}};
  if(spec.type==="doughnut") {
   result.cutout="72%";result.plugins.legend.labels.usePointStyle=true;
   // Borders consume the colored band in compact 24px outcome rings.
   if(spec.compact) result.datasets={doughnut:{borderWidth:0}};
  } else {
   result.indexAxis=spec.horizontal?"y":"x";
   const scale=()=>({stacked:!!spec.stacked,grid:{color:t.border,drawTicks:false},border:{display:false},ticks:{color:t.muted,font:{size:10},maxRotation:0,autoSkip:true,maxTicksLimit:10}});
   result.scales={x:scale(),y:scale()};
   const axis=spec.horizontal?"x":"y";
   result.scales[axis].beginAtZero=true;result.scales[axis].ticks.precision=0;
   result.elements={point:{radius:1.5,hoverRadius:4},line:{borderWidth:2},bar:{borderRadius:3}};
   if(spec.format==="usd") {
    delete result.scales[axis].ticks.precision;
    result.scales[axis].ticks.callback=value=>money(Number(value));
    result.plugins.tooltip.callbacks.label=item=>item.parsed[axis]==null?"Unavailable":money(item.parsed[axis]);
   }
  }
  return result;
 }
 function render(root=document) {
  if(typeof window.Chart!=="function") return;
  const canvases=[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
  for(const canvas of canvases) {
   try {
    const spec=JSON.parse(canvas.dataset.uiChart);
    if(!spec || !["line","bar","doughnut"].includes(spec.type)) throw new Error("Unsupported chart type");
    canvas.parentElement.classList.toggle("is-empty",!!spec.empty);
    if(spec.empty) {destroy(canvas);continue;}
    if(!Array.isArray(spec.labels)||!Array.isArray(spec.datasets)) throw new Error("Invalid chart data");
    const t=theme(canvas),signature=JSON.stringify([spec,t]);let entry=charts.get(canvas);
    if(entry?.signature===signature) continue;
    if(entry && entry.chart.config.type!==spec.type) {destroy(canvas);entry=null;}
    const config={type:spec.type,data:{labels:spec.labels,datasets:spec.datasets},options:options(spec,t)};
    if(!entry) charts.set(canvas,{signature,chart:new window.Chart(canvas,config)});
    else {
     // Recompute options as well as data: stacked, compact, currency, bounds and
     // theme changes must take effect without replacing a live canvas.
     entry.signature=signature;entry.chart.data=config.data;entry.chart.options=config.options;entry.chart.update("none");
    }
   } catch(_) {
    destroy(canvas);
    // Chart.js registers before construction completes; release that partial
    // instance too so the next valid snapshot can reuse the same canvas.
    window.Chart.getChart?.(canvas)?.destroy();
    canvas.parentElement.classList.add("is-empty");
    const message=canvas.parentElement.nextElementSibling;
    if(message) message.textContent="Chart unavailable. Open the chart data table below.";
   }
  }
 }
 window.GoHTMXUI=window.GoHTMXUI||{};window.GoHTMXUI.charts={render,destroy};
 document.addEventListener("htmx:beforeCleanupElement",event=>destroy(event.detail.elt));
 document.addEventListener("htmx:afterSwap",event=>render(event.detail.elt));
 if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>render());else render();
})();
