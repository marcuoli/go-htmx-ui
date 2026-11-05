# Native ECharts contract — v0.6.0

The public chart option is an **ordinary native ECharts option object**. Geometry,
data, axes, stacks, names, legends, zoom controls, grids, coordinates and chart
families come directly from the [upstream option contract](https://echarts.apache.org/en/option.html).
The runtime does not translate labels/datasets or choose a chart type.

## Go and templ

```go
option := ui.EChartsOption{
    "tooltip": map[string]any{"trigger": "axis"},
    "xAxis": map[string]any{"type":"category", "data":[]string{"A","B","C"}},
    "yAxis": map[string]any{"type":"value"},
    "series": []any{map[string]any{
        "id":"network", "name":"Network", "type":"line",
        "data":[]any{0, nil, 12.5},
    }},
}
rate := ui.EChartsValueFormat{Unit:"data-rate", InputUnit:"MB/s", DisplayUnit:"MiB/h"}
config := ui.EChartsConfig{
    Locale:"pt_BR", TimeZone:"UTC",
    Formats: []ui.EChartsFormatBinding{
        {Target:"yAxis.0.axisLabel.formatter", Format:rate},
    },
    Tooltip: []ui.EChartsTooltip{
        {SeriesID:"network", Values:[]ui.EChartsTooltipValue{{Format:rate}}},
    },
    Events: ui.EChartsEvents{Select:true, Zoom:true},
}
```

```templ
@ui.WidgetChart(ui.WidgetChartProps{
    ID:"network", Label:"Reported throughput", Option:option, Config:config,
    NoScriptNote:"Open the raw input disclosure below.",
})
```

`Option` also accepts JSON-marshallable structs or `json.RawMessage` containing a
native object. `MarshalEChartsOption(value)` returns JSON and an error. The
component propagates encoding/root-shape errors. Text/JSON is attribute-escaped,
not interpolated into executable JavaScript. Native option fields retain their
upstream names; this library does not maintain a complete typed ECharts DSL.

## JavaScript-only / Django

Serve the exact versioned module assets and notices from the application's static
pipeline. No Go runtime is needed. Load each script once, in this order:

```html
<link rel="stylesheet" href="/static/ui/ui.css">
<script src="/static/ui/echarts.min.js" defer></script>
<script src="/static/ui/echarts-format.js" defer></script>
<script src="/static/ui/ui-htmx-charts.js" defer></script>
<div class="ghtui-chart-frame" style="--ghtui-chart-height:130px">
  <div id="network" role="img" aria-label="Reported throughput"
       data-ui-echarts='{"xAxis":{"type":"category","data":["08:00","08:02","08:04"]},"yAxis":{"type":"value"},"series":[{"id":"network","name":"Network","type":"line","data":[0,null,2.5]}]}'
       data-ui-echarts-config='{"locale":"pt_BR","formats":[{"target":"yAxis.0.axisLabel.formatter","format":{"unit":"data-rate","inputUnit":"MiB/s","displayUnit":"MiB/s"}}]}'></div>
</div>
<p class="ghtui-chart-empty" data-ui-empty-message="No samples"
   data-ui-error-message="Cannot display chart">No samples</p>
<details class="ghtui-data"><summary>Raw inputs</summary>
  <p>08:00: 0 MiB/s; 08:02: missing; 08:04: 2.5 MiB/s.</p>
</details>
```

HTML-escape both JSON attributes using the server template engine. In Django,
serialize server objects to JSON and use ordinary autoescaped attributes; never
mark untrusted JSON safe. Labels already formatted as local timestamps remain
native **category strings**. Do not parse them into instants or convert already
converted MiB/s values again.

```js
const host = document.getElementById('network');
const option = JSON.parse(host.dataset.uiEcharts);
const config = JSON.parse(host.dataset.uiEchartsConfig || '{}');
option.series[0].data = [1, null, 3.75]; // native data, still MiB/s
GoHTMXUI.echarts.update(host, option, config);
// Or update escaped DOM attributes, then:
GoHTMXUI.echarts.render(host); // default document; also accepts a subtree
// Before removing a subtree outside HTMX:
GoHTMXUI.echarts.destroy(container); // omitted root destroys all tracked charts
```

`update` accepts JSON data only and throws on functions, undefined, nonfinite
numbers, prototype keys or excessive nesting. DOM parsing/render failures show a
text-only error fallback and dispose partial instances. Native option JSON is
application-defined configuration: keep permissions and allowed option sources
in the application. Functions are never evaluated or revived from strings.
Tooltips are forced to `richText`, including native string templates.

## Safe callback metadata

`EChartsConfig` is separate from the native option. It contains callbacks JSON
cannot encode, localized messages and lifecycle flags; it does not build geometry.

| Field | Purpose |
| --- | --- |
| locale / timeZone | Intl display context, default en-US / UTC; underscore locales accepted |
| formats | Allowlisted native callback bindings below |
| tooltip | Mixed/scalar/vector tooltip value bindings by one seriesId or seriesIndex |
| bubbleSizes | Native scatter symbolSize callback from an explicit numeric dimension |
| events | Boolean select/zoom DOM event opt-ins |
| empty / loading | Application-declared presentation state; no data aggregation/inference |
| messages | empty, error, unavailable, loading plain-text overrides |

Format binding example:

```json
{"target":"yAxis.0.axisLabel.formatter","format":{"unit":"data-rate","inputUnit":"MB/s","displayUnit":"MiB/h","precision":2},"compact":false}
```

Allowed targets are `xAxis.N.axisLabel.formatter`, `yAxis.N.axisLabel.formatter`,
`radiusAxis.N.axisLabel.formatter`, `angleAxis.N.axisLabel.formatter`,
`series.N.label.formatter`, `series.N.detail.formatter`,
`series.N.tooltip.valueFormatter`, and `visualMap.N.formatter`. N is a zero-based
index, including when upstream allows a single object. The referenced object must
exist. Duplicate targets, unknown fields and arbitrary function/property paths
reject. Bindings currently target the root native option; nested baseOption/media/timeline
callback paths are not exposed. Those native JSON structures still pass through
and their tooltip overrides are forced to richText. `dimension` optionally selects a nonnegative vector coordinate for a
series label; omit it for scalar data. `compact` affects compact count labels.

`format` supports count/rate/qps/ms/us/usd/percent/bytes/bytes/s/bits/bits/s/data/
data-rate/custom and **time**. See [unit conversion](units.md). Time accepts only
its unit declaration; locale/timeZone determine date display. Native time data
uses epoch milliseconds or ISO instants with a timezone; localized category text
uses no time binding. Formatting never changes native samples, ranges or geometry.

Mixed tooltip metadata is explicit rather than inferred from another chart DSL:

```json
{
  "tooltip":[{
    "seriesId":"load",
    "values":[
      {"dimension":0,"label":"Latency","format":{"unit":"ms"}},
      {"dimension":1,"label":"Load","format":{"unit":"percent"}}
    ]
  }]
}
```

This installs a trusted rich-text formatter; native `tooltip.trigger` and
`axisPointer` still control interaction. Each value's precision is independent
from axis precision. Use stable native series IDs. Without global tooltip
metadata, native templates/formatting apply; a per-series valueFormatter binding
is also available. `bubbleSizes:[{seriesId:"load",dimension:2,min:2,max:128}]`
uses the third scatter coordinate as pixel diameter, validating explicit data
and bounds rather than inventing weights. Native datasets/encode are supported;
bubble callback metadata currently requires explicit `series.data`.

## Lifecycle and reading state

- One ECharts instance per stable host. Equal snapshots skip setOption; new
  snapshots use native `notMerge:true` to remove stale axes/series.
- Compatible native legend names/IDs and zoom IDs/bindings retain the reader's
  selection/range across data, formatting and theme updates. Changed explicit
  initial selection/ranges reset it. Mixed value/percentage zoom bounds keep
  their individual native rangeMode. Removing a control removes its state.
  Shared reading-state retention targets root controls; nested native timeline/
  media controls retain upstream behavior rather than a separate state adapter.
- Native grouping uses common series names; pie/radar datum names are preserved.
- ResizeObserver sizes from the caller-owned frame, including initial hidden
  hosts and updates while hidden. A window resize fallback is installed.
- Initial loading waits without creating an engine instance. Loading with an
  existing instance retains its last snapshot, suppresses selection events and
  shows an overlay. Clearing loading applies the latest options. Loading/empty states may omit pending option fields while retaining a stable
  formatter config. Explicit empty
  disposes the chart and shows the fallback; a later valid snapshot recovers.
- Set CSS `--ghtui-*` theme tokens and call render, or dispatch
  `document.dispatchEvent(new Event('gohtmxui:theme'))`. Default styles update on
  the same instance; explicit native option colors remain authoritative.
- HTMX afterSwap renders the affected subtree. beforeCleanupElement disposes it.
  Disconnected hosts and partial init/setOption failures are also cleaned up.
- Preserve host identity, `_echarts_instance_`, engine-owned children and canvas
  attributes/styles during custom SSE DOM patches. See the migration guide.

Opt-in events bubble from the host: `gohtmxui:chart-select` contains chartId,
seriesId/seriesIndex, dataIndex, name and a primitive/flat primitive-array value.
`gohtmxui:chart-zoom` contains chartId, start and end. Callbacks, DOM nodes and
arbitrary engine internals are not exposed. Applications own event meaning.

## Validated families and boundaries

Synthetic native options and actual-engine tests cover line/area/stacked area,
bar/mixed line-bar, horizontal ranking, independent axes, histogram bins,
percentile categories, pie/ring, scatter/bubble, heatmap, radar, gauge and missing
gauge, micro line/area/bar/ring, time histories and localized categories. Numeric
domains, dataset/encode, zoom/legend/theme/resize and 1800-point snapshots are
also exercised. Examples live in `examples/showcase/native-charts.json` and the
Go map in `native.go`.

Missing line values remain null; explicit zero stays zero. For native gauges use
empty data plus config.empty for missing readings; never send a missing gauge as
zero. Native heatmaps omit missing cells. Native ECharts owns accepted geometry
and option semantics. Other upstream JSON options can pass through, but that is
not a claim that every native combination or custom callback is covered here.

The library does not collect, store, resample, aggregate, price or transport data.
Accessibility includes host labels, fallback messages and caller-provided raw
input disclosure. Preserve upstream engine/license/provenance files unchanged.
