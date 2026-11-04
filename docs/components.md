# Component and integration guide

All components are in package `ui`. Children are ordinary templ children slots. Text, attributes and chart JSON are escaped by templ. Presentation attributes must be server-defined; this is not a sanitizer for arbitrary attribute names, event handlers or untrusted CSS. Links use `templ.URL`. Applications own authentication, authorization, CSRF protection, URLs and domain state.

| Component | Configuration and children |
|---|---|
| Widget | WidgetProps: semantic Element (section/div/aside/nav), Class, Attributes; body slot |
| WidgetHeader | WidgetHeaderProps: Title, Description, Count, Class, TitleClass, DescriptionClass; actions slot |
| WidgetMetricFrame | WidgetMetricProps: Label, Note, Heading; custom value/chart slot |
| WidgetMetric | label, value, note strings; compact display, exact tooltip and accessible label |
| WidgetMetricValue | display and exact strings; MetricText also formats strings independently |
| WidgetChart | WidgetChartProps: ID, Spec JSON, Label, EmptyMessage, NoScriptNote, Compact |
| WidgetEmpty / WidgetData | empty-state children / disclosure label and children |
| PageHeader / Actions | PageHeaderProps: Title, Description, Class, Attributes; action slot / action children |
| Tabs / Tab | navigation label and children / TabProps: Label, Href, Active, Class, Attributes |
| Button / LinkButton | Type or Href, Kind (Primary/Secondary/Danger), Class, Attributes; label children |
| Field | FieldProps: For, Label, Hint, Class, Attributes; input slot |
| Input / Select | ID, Name, Value, Class, Required, Disabled, Attributes; Input adds Type/Placeholder, Select adds []Option |
| Dialog | DialogProps: ID, TitleID, Class, Attributes; native dialog body slot |
| DialogHeader / DialogBody | TitleID, Title, Description and actions slot / content slot |
| Badge / VersionLabel | children / versioning.Info validated by go-versioning |

Use unique IDs and associate Field.For with the control ID. Give every dialog a TitleID matching DialogHeader.TitleID; applications call showModal(), implement close actions and restore focus. Forms and modal shells do not submit, move or fetch content automatically. Tokens, capability checks and permissions stay in the application.

## Appearance

Classes use the `ghtui-` prefix. Override these inherited CSS variables on a containing element:

| Token | Default |
|---|---|
| --ghtui-surface | #161b22 |
| --ghtui-text | #f0f6fc |
| --ghtui-muted | #8b949e |
| --ghtui-border | #30363d |
| --ghtui-raised | #21262d |
| --ghtui-accent | #79c0ff |
| --ghtui-primary | #0969da |
| --ghtui-danger | #b42335 |
| --ghtui-chart-height | 238px |

The showcase demonstrates a light theme. The component stylesheet has no global reset or font. A consumer supplies page layout and typography; shared components own their local spacing and typography. Custom Class props add layout hooks without duplicating component markup. Use the table library's own application adapter for compact rows and pagination.

## Charts and live updates

`WidgetChartProps.Spec` is JSON in an escaped attribute; IDs, canvas hosts and
Go props remain stable. The supported shared spec is declarative, with no
serialized JavaScript callbacks or raw HTML. Unknown renderer-specific options
are not forwarded to the engine.

Category labels are strings or finite numbers; dataset labels are strings.
Object-valued labels, engine image/pattern options and non-string colors are
rejected before reaching ECharts.

- Core: `type` (`line`, `bar`, `doughnut`), `labels`, `datasets`; optional
  `empty`, `compact`, `stacked`, `horizontal`, `format: "usd"`, `bounds`.
- Datasets: `id`, `label`, numeric/null `data`, `backgroundColor` (string/array),
  `borderColor`, `fill`, `tension`. Cartesian data also accepts `[x,y]` and
  `{x,y}`; null y remains missing. A mode change can supply `type: "bar"` or
  `"line"` per dataset. Arbitrary Chart.js dataset/plugin options are not part
  of this contract.
- `axes`: nonempty value-axis array. Each has a distinct `id` (optional for one
  axis), `unit`, optional `precision` (maximum fractional digits0–8), independent
  finite `min`/`max` (`min < max` when both given), `alignTicks` boolean,
  `splitNumber` integer1–20, optional `label`, `offset`, and `position`.
  Vertical positions are `left`/`right`; horizontal positions are `bottom`/`top`.
  Values bind through dataset `axis: "id"`; omitted means the first axis.
- Units: `count`, `rate` (/s), `qps`, `ms`, `us` (displayed as µs), `usd`,
  `percent`. Dataset `unit`/`precision` control tooltip formatting and inherit
  axis settings. Conflicting units require separate axes; no implicit unit
  conversion occurs. Precision defaults to4 for count/USD and2 for other units;
  count axes use compact labels. Missing values show Unavailable, zero stays zero.
- Storage: `unit:"bytes"` or `"bytes/s"` enables display-only conversion.
  Declare `inputUnit` (default `B` or `B/s`), `displayUnit` (default `auto`),
  and `scale:"binary"|"decimal"` (default decimal). IEC binary output is
  recommended for storage/monitoring examples: B, KiB, MiB, GiB, TiB, PiB, EiB,
  ZiB, YiB; each step is1024. Decimal uses B, kB, MB, GB, TB, PB, EB, ZB, YB,
  each1000. Throughput adds `/s` to every explicit input/output unit.
  The source prefix determines its factor independently: decimal MB/s to binary
  MiB/s is a real conversion, never relabeling. Fixed output prefixes must match
  `scale`; `auto` chooses a prefix from the configured family per value.
  `precision` remains maximum fractional digits0–8. Axis bounds/data stay in
  raw input units; only display strings convert. All series on an axis share
  conversion semantics, inferred from unambiguous declarations; otherwise use
  independent axes. Dataset precision may deliberately differ from axis precision.
- Localization: chart `locale:"pt-BR"` and `timeZone:"America/Sao_Paulo"`
  configure number/date formatting, including real timestamp tooltip headers.
  `en_US`, `pt_BR`, `es_ES` normalize to `en-US`, `pt-BR`, `es-ES`. Intl-supported
  locales and valid Intl timezone names are required. With no locale, existing
  en-US numbers/en-GB dates remain; timezone defaults to UTC. Epoch0 is valid;
  a timezone changes presentation, never sample positions or spacing.
  `messages:{empty,error,unavailable}` supplies plain text. No automatic
  translations, HTML, native engine options or serialized callbacks are accepted.
  Invalid options show a safe error and recover on a valid next snapshot.
  `WidgetChartProps.ErrorMessage` (or fallback paragraph `data-ui-error-message`)
  also covers malformed JSON that cannot supply `messages.error`.
- Small Cartesian charts: `showAxisLabels:false` hides both axis labels;
  an axis can override `showLabels`. `showPoints:false` removes line markers
  including hover markers; a dataset can override `showPoints`. Defaults remain
  visible. Caller CSS owns frame height (the showcase uses130px); these options
  do not set `WidgetChartProps.Compact`, which retains its existing ring layout.
- Stacks: `stacked:true` supplies a default stack for series matching the base
  chart type. An overlaid line on base bars is unstacked. Dataset `stack` can be
  an explicit group string; `false`/`null` forces no stack. Explicit overrides
  are recommended when consumers switch count modes while keeping a latency line.
- `domain: {type:"time",min,max}` uses epoch milliseconds or timezone-qualified
  ISO timestamps. Timed samples are sorted stably and use actual elapsed spacing.
  Provide pairs/objects, or `labels` as timestamps with numeric data. Bounds are
  independent of the observation timestamps and update with the spec. Numeric
  zero remains a valid epoch. Ambiguous local time strings are rejected. Null
  samples break lines; omitted points do not invent zeroes or a sampling cadence.
  Category axes preserve caller label order and accept optional label/index bounds.
- `legend: {show:true|false}` overrides normal visibility; compact rings omit
  legends. Cartesian datasets can share `legendGroup` and optional `legendLabel`;
  the legend toggles all series in that group, while tooltips retain individual
  labels/units. Group labels must be consistent. User selections survive live
  updates and disappear when their series/group is removed.
- `bounds` is an array of safe bucket/range strings. A dataset may supply its
  own `bounds`, remapped with sorted timestamps. Tooltips unify visible series,
  their units and context, rendering as canvas rich text instead of HTML.

```json
{
  "type":"bar", "stacked":true, "labels":["00:00","00:01"],
  "axes":[
    {"id":"count","unit":"count","min":0,"max":100,"splitNumber":5},
    {"id":"latency","unit":"ms","position":"right","min":0,"max":10,"alignTicks":true,"splitNumber":5}
  ],
  "datasets":[
    {"label":"Success","axis":"count","data":[30,45]},
    {"label":"Errors","axis":"count","data":[2,1]},
    {"label":"Response time","type":"line","axis":"latency","stack":false,"data":[3,null]}
  ]
}
```

The optional controller exposes the same lifecycle API:

```js
GoHTMXUI.charts.render(container);  // default: document; includes a canvas root
GoHTMXUI.charts.destroy(container); // before removing a subtree
```

Load `echarts.min.js` then `charts.js`. The controller handles DOMContentLoaded,
HTMX swaps/cleanup, frame ResizeObserver updates, window resizing, hidden-to-visible
initialization, theme changes and disposal. It reuses an existing instance and
replaces its options to remove stale series/axes, preserving explicit legend
selections. Animation is disabled. Empty/invalid/missing-engine states show safe
fallback text and can recover on the next valid render. It opens no transport
connections and fetches no application data.

Application DOM patchers preserve stable canvas IDs, `_echarts_instance_`,
`data-zr-dom-id`, width/height/style and generated child content; otherwise engine
registry lookup or drawing can fail. Keep the frame and fallback paragraph as
siblings. `role="img"` and the caller's accessible label remain, alongside a real
`WidgetData` disclosure table for keyboard/nonvisual access. Canvas is the public
host/renderer contract in0.2.0; SVG engine tests do not promise SVG host support.

## Reuse in another app

1. Add a released module version and compatible templ runtime.
2. Serve Assets() under your asset prefix; load ui.css and optional chart scripts.
3. Replace repeated presentation markup with components and typed props.
4. Keep data, routes, permission checks and live transport in the app.
5. Compose go-htmx-table in widget slots. Verify your own table spacing.
6. Run your templ generator and test keyboard, modal and live update behavior.

## Localized monitoring example (v0.3.0+)

```json
{
  "type":"line", "locale":"pt_BR", "timeZone":"America/Sao_Paulo",
  "showAxisLabels":false, "showPoints":false,
  "domain":{"type":"time"},
  "axes":[{"unit":"bytes/s","inputUnit":"MB/s","displayUnit":"MiB/s","scale":"binary","precision":2}],
  "messages":{"empty":"Sem dados","error":"Falha no gráfico","unavailable":"Não disponível"},
  "datasets":[{"label":"Network","fill":true,"data":[[1767225600000,12.5],[1767225602000,0],[1767225604000,null]]}]
}
```

12.5 MB/s displays11,92 MiB/s in pt-BR; zero remains0 MiB/s and null remains
missing. To retain already-scaled decimal MB/s exactly, select
`inputUnit:"MB/s", displayUnit:"MB/s", scale:"decimal"`. For raw byte storage,
select `unit:"bytes", inputUnit:"B", scale:"binary"`;1073741824 B displays1 GiB.
Do not use `BiB` (not a byte-unit symbol) or infer input semantics from a title.

The synthetic monitor showcase retains1800 observations at two-second spacing,
with real null gaps and zeroes, in130px frames. It demonstrates live snapshots,
locale/theme changes and hidden-to-visible recovery. It is a rendering fit check,
not a transport, history store, domain calculation or performance guarantee.

## JavaScript-only consumers

Go/templ is optional at runtime for frontend integration. Obtain the official
assets from the exact module release/tag, retain notices/provenance and serve
locally. For example, Django can render escaped JSON in the same contract:

```html
<script src="/static/shared/echarts.min.js" defer></script>
<script src="/static/shared/charts.js" defer></script>
<div class="ghtui-chart-frame" style="height:130px;min-height:130px">
  <canvas id="cpu-history" role="img" aria-label="CPU history"
    data-ui-chart='{"type":"line","showAxisLabels":false,"showPoints":false,"labels":["A","B"],"datasets":[{"unit":"percent","data":[0,null]}]}'></canvas>
</div>
<p class="ghtui-chart-empty" data-ui-empty-message="No samples" data-ui-error-message="Cannot display chart">No samples</p>
```

Load `ui.css` for frame/fallback styles, and provide a useful accessible data
disclosure alongside the chart. HTML-escape attributes using the server template
engine; do not mark application JSON as safe HTML. The controller validates JSON
and assigns fallback text with textContent. To update, replace the canvas
`dataset.uiChart` with `JSON.stringify(spec)` then call
`GoHTMXUI.charts.render(canvas)`; destroy before removing a subtree unless HTMX
cleanup does so. The same public lifecycle/DOM preservation rules apply.
