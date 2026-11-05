# Migrate to native ECharts — v0.6.0

For v0.7.0, use `Head`/`AssetHandler` to manage the native assets or load
`ui-htmx-charts.js` after `echarts-format.js`. The v0.6.0 `echarts-ui.js` URL
remains a serving alias; load only one controller name. v0.7.0 also requires
templ v0.3.1100 and compatible regenerated consumer templates. See the component
guide and README for the dependency boundary and page helpers.

This release removes the browser chart-schema adapter. Existing published v0.2.0
and v0.5.0 modules/assets remain unchanged. Upgrade a consumer only when its option
generation, host markup, scripts and live DOM lifecycle have all been migrated.
There is no automatic old-schema fallback and no in-place rewrite of old tags.
Non-chart component APIs remain unchanged.

## Contract changes

| Before (v0.2–v0.5) | v0.6.0 |
| --- | --- |
| WidgetChartProps.Spec string | WidgetChartProps.Option native object + Config EChartsConfig |
| canvas[data-ui-chart] | div[data-ui-echarts] + data-ui-echarts-config |
| labels/datasets/type at root | Native xAxis/yAxis/series/legend/grid/dataZoom |
| charts.js controller | echarts-format.js followed by ui-htmx-charts.js |
| GoHTMXUI.charts.render/destroy | GoHTMXUI.echarts.render/update/destroy |
| Virtual compatibility bundle URL | Removed; load official echarts.min.js explicitly |
| Inferred axis/dataset formatting | Explicit callback targets and tooltip dimensions |
| compact/horizontal/showPoints flags | Native radius, swapped axes, showSymbol, frame size |

Only `echarts.min.js` is third-party chart-engine code. The two first-party files
provide shared numeric/date formatting and lifecycle, without a chart-type DSL.

## Direct option migration

Previously supplied data:

```json
{"type":"line","labels":["A","B","C"],"axes":[{"unit":"percent"}],"datasets":[{"label":"CPU","data":[0,null,42]}]}
```

Native option:

```json
{
  "tooltip":{"trigger":"axis"},
  "xAxis":{"type":"category","data":["A","B","C"]},
  "yAxis":{"type":"value"},
  "series":[{"id":"cpu","name":"CPU","type":"line","connectNulls":false,"data":[0,null,42]}]
}
```

Separate callback config:

```json
{
  "formats":[{"target":"yAxis.0.axisLabel.formatter","format":{"unit":"percent"}}],
  "tooltip":[{"seriesId":"cpu","values":[{"format":{"unit":"percent"}}]}]
}
```

No conversion of raw samples occurs. For already-converted MiB/s use
`{unit:"data-rate",inputUnit:"MiB/s",displayUnit:"MiB/s"}`. For raw MB/s displayed
as MiB/h change the input/output declarations accordingly. Reuse one format
object in axis and tooltip bindings; there is no hidden cross-series inference.

## Native equivalents

- Line/fill/tension → series.type line, areaStyle and smooth. Null remains null;
  connectNulls false preserves gaps. Bar/line mixing uses series.type directly.
- Independent axes → native yAxis array and series.yAxisIndex (or swapped x axes).
- Stacking/grouping → native series.stack and common legend names; omit stack on
  independent overlay lines. Native legend.data can explicitly name groups.
- Time pairs → native xAxis.type time plus series.data [[epochMs,value],...].
  Bind time formatting separately. Existing localized timestamp strings instead
  remain xAxis.type category data; do not reinterpret ambiguous strings.
- Ring → native pie with radius array. Per-category colors use native itemStyle.
- Horizontal ranking → native xAxis value / yAxis category, inverse if required.
- Histograms/percentiles → application-created native categories/data; keep exact
  bucket bounds in native data.name or labels and in the raw-input disclosure.
- Scatter → native scatter data pairs, numeric axes and native dataZoom. Bubble
  uses scatter plus bubbleSizes metadata for an explicit size dimension.
- Heatmap → native category axes, visualMap and series.type heatmap cells. Omit
  missing cells; retain zero cells. Bind cell label dimension 2 when needed.
- Radar → native radar.indicator and series.data named value vectors. Bind
  explicit tooltip dimensions; native datum names retain legend state.
- Gauge → native series.type gauge/min/max/data; bind detail formatter. Missing
  gauge → data [] plus config.empty and an appropriate empty message.
- Microcharts → native hidden axes/labels/points/radius with caller-sized frames.
- Old loading/empty/messages/events → the corresponding EChartsConfig fields.
  Initial loading still waits to initialize; retained instances freeze the last
  snapshot during loading. Native callbacks are allowlisted, never JSON code.

See [the full native API and Go/JavaScript examples](charts.md).

## SSE/HTMX DOM preservation

The new div host has engine-owned child elements. An application DOM patcher must
preserve those children and engine attributes; matching only the old canvas
selector will lose chart state and can leak instances.

```js
// Application patch pseudocode: treat matching stable chart hosts as opaque.
if (oldNode.matches('[data-ui-echarts]') && oldNode.id === newNode.id) {
  const option = JSON.parse(newNode.dataset.uiEcharts);
  const config = JSON.parse(newNode.dataset.uiEchartsConfig || '{}');
  // Keep oldNode, its _echarts_instance_, engine children/canvas attrs/styles.
  oldNode.setAttribute('aria-label', newNode.getAttribute('aria-label') || '');
  GoHTMXUI.echarts.update(oldNode, option, config);
  return oldNode;
}
// Before replacing/removing any other subtree outside HTMX:
GoHTMXUI.echarts.destroy(oldSubtree);
```

Update the fallback/raw-input disclosure separately with escaped text or
textContent. Never copy innerHTML from a fresh server chart host over a retained
engine instance. Stable native series/control IDs help reading-state retention.
HTMX lifecycle hooks work automatically when hosts are actually swapped; custom
morph/SSE engines must preserve opaque hosts or call destroy before replacement.

Django can keep versioned assets and use the identical native JSON/config. If a
script-loader injects assets after HTMX insertion, load engine → formatting →
lifecycle once and call render(insertedSubtree) after the chain completes. Do not
append duplicate runtime scripts or initialize the same host independently.

## Compatibility boundary

v0.6.0 does not ship an adapter to keep old schema consumers working silently.
Pin the earlier version until migration is ready, and keep its exact engine and
controller together. No consumer upgrade, production deployment, inference or
credentials are part of publishing this shared-library release.
