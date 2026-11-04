# General chart contract — v0.4.0+

Use `WidgetChart(WidgetChartProps{ID,Spec,Label})` with the same JSON spec, or the
JavaScript-only canvas markup in [components](components.md#javascript-only-consumers).
Serve `ui.css`, `echarts.min.js`, then `charts.js` locally. Go is optional for
frontend integration. Version0.4.0 bundles the official unmodified ECharts6.1.0
**full** distribution so every exposed series/component is present. This is a
validated shared API, not the entire native ECharts option/callback surface.

## Chart-type and usage matrix

| Family | Public spec | Axes / units | Missing inputs |
| --- | --- | --- | --- |
| Line / smooth line | `type:"line"`; dataset `tension:0..1` | Category/value/time domain; independent value axes | Null breaks a line |
| Area / stacked area | Line plus dataset `fill:true`; `stacked:true` or dataset `stack` | Same Cartesian axes | Null remains a gap |
| Vertical bars | `type:"bar"` | Category/value/time; independent value axes | Null remains missing;0 remains0 |
| Horizontal bars | `type:"bar",horizontal:true` | Category scalars/pairs or time pairs; independent value axes | Numeric/value domain bars unsupported (rejected); zero/null preserved |
| Grouped / stacked bars | Multiple datasets; optional `stacked:true`/`stack` | Same Cartesian axes | No aggregation inferred |
| Histogram | Bar with application-supplied labels/counts and optional `bounds` | Supplied bucket labels and count/value axis | No bins calculated by renderer |
| Pie / doughnut | `type:"pie"` / `"doughnut"`; category labels + scalar datasets | Shared scalar format; item tooltip | Null retained as missing; no equal slices invented for zero total |
| Scatter | `type:"scatter"`; pairs `[x,y]` / `{x,y}` | Default numeric value domain; category/time also explicit | Null y omits a point |
| Bubble | `type:"bubble"`; `[x,y,size]` / `{x,y,size}` | Same scatter axes; size is declared pixel diameter2–128 | Null y omits a point; no weight/area scaling invented |
| Heatmap | `type:"heatmap"`; `labels`, `rows`, one dataset of `[columnIndex,rowIndex,value]` | Category grid; one shared value format; optional `colorRange` | Null cell omitted, distinct from zero; duplicate/out-of-grid cells rejected |
| Radar | `type:"radar"`; `indicators:[{name,max,min?}]`; one numeric vector per dataset | Three or more explicit finite ranges, common comparable unit | Complete finite vectors required; null/incomplete vectors rejected |
| Gauge | `type:"gauge"`; one dataset with one scalar | `axes:[{min,max,unit,...}]`; defaults range0–100, count unit | Null displays localized unavailable text, never a zero reading |
| Microcharts / sparklines | Line/area/bar + `showAxisLabels:false`, `showPoints:false`, caller CSS height | Same Cartesian contract | Same zero/null semantics |
| Compact ring | Doughnut + `compact:true`, `WidgetChartProps.Compact:true` | Existing24px ring contract | Existing behavior preserved |

For scatter/bubble on category domains, x is a declared category label or its
integer index. Numeric category coordinates are indices, even when displayed labels are numbers. Public Cartesian pairs keep [domain,value] order when axes swap. Numeric/value and time points are sorted stably; categorical
line/bar order is application supplied. A numeric domain uses `domain.unit`,
`precision`, byte-conversion fields and optional `label` for x-axis/tooltip
formatting. Existing `axes` describe y (or the value axes for horizontal charts).
Horizontal numeric/value domains work for line/scatter/bubble; bar datasets in that combination are rejected because the native bar layout chooses its base axis differently. Use category/time horizontal bars or vertical value bars.
Mix line/bar/scatter/bubble datasets with `type` and `axis` bindings; pie and
special-coordinate families cannot be mixed with Cartesian series.

Radar and gauge accept one shared format axis; dataset `axis`, when supplied,
must name it. Radar needs complete comparable vectors; compose multiple widgets
for unrelated units. Gauge uses one value per widget; compose widgets for
multiple gauges. Caller ranges can clip plotted extents while details retain raw
values. Heatmap `colorRange:{min,max,palette?}` controls a display color extent;
without bounds it uses observed finite values and safely expands a constant
extent. This never creates cells, buckets or business statistics. `cellLabels`
(boolean, defaultfalse) adds formatted values.

## Reusable capabilities and boundaries

All families use stable canvas IDs, shared theme tokens, safe rich-text tooltips,
local assets, frame ResizeObserver updates, hidden-to-visible initialization,
static snapshots and application-supplied live updates. The same render/destroy
API and HTMX cleanup apply. Options replace obsolete series/components; explicit
legend selections survive new snapshots. Accessible `Label`/`role="img"` and a
useful `WidgetData` disclosure remain application responsibilities.

- Units/precision: existing count/rate/QPS/ms/us/USD/percent plus explicit byte
  and throughput conversions. Prefer IEC where appropriate, but declare actual
  input semantics. `percent` means already-scaled percentages:67 displays67%,
  not6700%. No implicit ratio conversion. See [formatting](components.md).
- Locale/timezone: `locale:"pt_BR"` normalizes to `pt-BR`; en-US/pt-BR/es-ES
  examples and Intl timezone names supported. Numeric tooltip headers include x
  and its unit; time headers use the chosen timezone, not engine-local labels.
- Legend: existing `legend:{show}` and grouped Cartesian series; radar names
  select vectors, pie names select categories. Heatmaps use a value color key;
  gauges have no categorical legend.
- Tooltip: `tooltip:false` or `{show:true,trigger:"axis"|"item"}`. Scatter/bubble
  default to item; line/bar to axis. Pie, heatmap, radar and gauge require item.
  Unknown tooltip keys (including native formatter callbacks) are rejected.
- Zoom/pan: Cartesian-only `zoom:true` or
  `{enabled:true,slider:true,start:0,end:100}`. The inside control handles
  wheel/pinch/pan; the optional bottom slider controls the domain, including
  horizontal-bar category axes. Percent bounds require0<=start<end<=100.
  The current user percentage window survives snapshots while the declared zoom
  configuration is unchanged; changing it resets the selection. With a slider,
  the legend uses one scrollable row to reserve separate plot/control space.
  Zoom does not delete, persist or aggregate application history.
- Events: `events:{select:true,zoom:true}` opts into bubbling DOM events
  `gohtmxui:chart-select` and `gohtmxui:chart-zoom`. Selection details contain
  `chartId`, series/data indexes, seriesId/name and primitive/raw coordinate
  values; zoom details contain start/end percentages. Native event objects,
  callbacks and arbitrary engine payloads are not forwarded. Application code
  attaches normal JavaScript listeners; none are serialized into chart JSON.
- Loading: `loading:true` with `messages.loading` shows safe text while retaining
  an existing instance; a valid next snapshot renders it in place. Initial
  loading waits to initialize. `empty:true` and invalid/error states release the
  instance as before. Messages empty/error/unavailable/loading are plain strings.
  `WidgetChartProps.ErrorMessage` also covers malformed JSON.
- Small charts: use caller CSS frame dimensions and optional label/marker flags.
  No mobile layout, collection cadence, history storage or chart transport is
  imposed. Line/area/bar sparklines and compact rings share the same renderer.

### Scatter/bubble with independent units

```json
{
  "type":"bubble", "locale":"en-US",
  "domain":{"type":"value","unit":"ms","label":"Latency"},
  "axes":[{"id":"load","unit":"percent","min":0,"max":100}],
  "zoom":{"enabled":true,"slider":true}, "events":{"select":true,"zoom":true},
  "datasets":[{"label":"Load","axis":"load","data":[[2,20,8],[12,60,24],[20,null,40]]}]
}
```

### Heatmap and gauge

```json
{"type":"heatmap","labels":["Mon","Tue"],"rows":["AM","PM"],"axes":[{"unit":"percent"}],"colorRange":{"min":0,"max":100},"datasets":[{"data":[[0,0,0],[1,0,null],[1,1,80]]}]}
```

```json
{"type":"gauge","axes":[{"min":0,"max":100,"unit":"percent"}],"datasets":[{"label":"Capacity","data":[67]}]}
```

### Go/templ and JavaScript-only updates

```go
// go get github.com/marcuoli/go-htmx-ui@v0.4.0
// Marshal application-owned data, then pass the JSON string as Spec.
encoded, err := json.Marshal(spec)
// Handle err before rendering the component.
// @ui.WidgetChart(ui.WidgetChartProps{ID:"load",Label:"Load history",Spec:string(encoded),ErrorMessage:"Cannot display chart"})
// Compose WidgetData with the underlying permitted values.
```

```html
<link rel="stylesheet" href="/shared/ui.css">
<script src="/shared/echarts.min.js" defer></script>
<script src="/shared/charts.js" defer></script>
<div class="ghtui-chart-frame">
  <canvas id="load" role="img" aria-label="Load scatter"
    data-ui-chart='{"type":"scatter","events":{"select":true},"datasets":[{"data":[[0,0],[12.5,80]]}]}'></canvas>
</div>
<p class="ghtui-chart-empty" data-ui-empty-message="No samples" data-ui-error-message="Cannot display chart">No samples</p>
```

For Django or another server template, HTML-escape the JSON attribute using its
normal escaping; do not mark application JSON as safe HTML. Add a useful data
disclosure table. Obtain exact assets/notices/provenance from v0.4.0's release
archive (`web/assets`), serve them locally, and apply the same markup contract.
No Go service/runtime is needed in the consumer.

```js
const canvas=document.getElementById('load');
canvas.addEventListener('gohtmxui:chart-select',event=>{
  document.getElementById('selected-value').textContent=JSON.stringify(event.detail);
});
canvas.dataset.uiChart=JSON.stringify(nextSnapshot);
GoHTMXUI.charts.render(canvas); // Includes the canvas root; reuses the instance.
GoHTMXUI.charts.destroy(container); // Before non-HTMX removal.
```

External DOM patchers preserve stable hosts, width/height/style,
`_echarts_instance_`, `data-zr-dom-id` and engine-owned descendants. Static and
realtime consumers use the same API. Applications own auth/SSE/reconnection,
metric collection, retained history, histogram bins, summaries and business
calculations.

## Explicit remaining coverage

The official full distribution contains broader analytical/hierarchical/flow
series, but the public typed adapter does **not** currently expose boxplot,
candlestick, treemap, sunburst, funnel, Sankey or graph/network. These need
separate typed schemas, missing-data rules, interactions and useful data
alternatives; they are follow-up coverage, not raw option pass-through. Likewise,
maps/geo, custom renderers, engine plugins, HTML tooltip rendering, gradients or
image/pattern objects and serialized callbacks are outside this contract.

Analytical follow-up: [issue #7](https://github.com/marcuoli/go-htmx-ui/issues/7).
Until an explicit adapter is released, unsupported types fail safely rather than
silently claiming support. The support matrix lists the implemented common
families; it makes no claim to cover every native ECharts feature.

## Metric units (v0.5.0+)

The [metric-unit contract](units.md) adds generic data/data-rate, bits/bytes,
SI/IEC prefixes, second/minute/hour/day time bases and custom labels/rules.
All families share the converter; raw samples and bounds are never rewritten.
