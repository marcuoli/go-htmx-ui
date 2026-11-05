# Component and integration guide

All components are in package `ui`. Children are ordinary templ children slots. Text, attributes and chart JSON are escaped by templ. Presentation attributes must be server-defined; this is not a sanitizer for arbitrary attribute names, event handlers or untrusted CSS. Links use `templ.URL`. Applications own authentication, authorization, CSRF protection, URLs and domain state.

| Component | Configuration and children |
|---|---|
| Widget | WidgetProps: semantic Element (section/div/aside/nav), Class, Attributes; body slot |
| WidgetHeader | WidgetHeaderProps: Title, Description, Count, Class, TitleClass, DescriptionClass; actions slot |
| WidgetMetricFrame | WidgetMetricProps: Label, Note, Heading; custom value/chart slot |
| WidgetMetric | label, value, note strings; compact display, exact tooltip and accessible label |
| WidgetMetricValue | display and exact strings; MetricText also formats strings independently |
| WidgetChart | WidgetChartProps: ID, native Option, EChartsConfig, Label, fallback messages, Compact |
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

## Native charts and live updates (v0.6.0)

`WidgetChartProps` takes `Option` (a native ECharts object), `Config`
(`EChartsConfig` callback/lifecycle metadata), `ID`, `Label`, `EmptyMessage`,
`ErrorMessage`, `NoScriptNote` and `Compact`. There is no Spec field in this
breaking release. The component emits a stable div host and escaped native JSON
attributes, with an accessible fallback sibling. Encoding errors return from
component rendering; malformed DOM JSON fails to the visible error state.

Use [the native chart contract](charts.md) for Go/templ and JavaScript-only
examples. Use [the migration guide](migration-native-echarts.md) before changing
old host markup, scripts or live DOM patching. Keep accessible raw-input
information in `WidgetData`; ECharts graphics alone are not a data table.

## Reuse in another app

1. Import a released module and serve `Assets()` under the app-owned prefix.
2. Load ui.css; charts additionally load official echarts.min.js, then
   echarts-format.js and echarts-ui.js once, in that order.
3. Compose widgets and controls with application-owned layout/data/permissions.
4. Use native ECharts options and explicit format bindings; preserve host nodes
   and engine-owned children during live patches. Call update/render or destroy.
5. Keep tables in go-htmx-table, and transport/history/business rules in the app.
