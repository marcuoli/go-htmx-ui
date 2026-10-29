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

Pass JSON through WidgetChartProps.Spec. Supported specs have `type` (`line`, `bar`, `doughnut`), `labels`, Chart.js `datasets`, optional `empty`, `compact`, `stacked`, `horizontal`, `format: "usd"` and tooltip `bounds`. All spec fields are part of the update signature. Arbitrary JavaScript callbacks are not serialized or evaluated.

The optional controller exposes:

```js
GoHTMXUI.charts.render(container);  // default: document; includes a canvas root
GoHTMXUI.charts.destroy(container); // before removing a subtree
```

It renders on DOMContentLoaded and HTMX swaps, and destroys charts on HTMX cleanup. Application-owned SSE or DOM patchers call the same functions. Keep canvas IDs/nodes stable and preserve Chart.js width/height/style attributes when patching. The controller updates an existing Chart instance when data, options or theme change, and recreates it only for type changes or after empty/error states. Animation is disabled to avoid blinking. It never opens EventSource/WebSocket connections or fetches application data.

The canvas wrapper and fallback paragraph are siblings; preserve that structure. Missing Chart.js leaves the accessible canvas and your optional no-script note; provide a WidgetData disclosure with a real table for keyboard and nonvisual access. Errors show a safe text fallback. Dataset values and labels must follow Chart.js's documented JSON data format.

## Reuse in another app

1. Add a released module version and compatible templ runtime.
2. Serve Assets() under your asset prefix; load ui.css and optional chart scripts.
3. Replace repeated presentation markup with components and typed props.
4. Keep data, routes, permission checks and live transport in the app.
5. Compose go-htmx-table in widget slots. Verify your own table spacing.
6. Run your templ generator and test keyboard, modal and live update behavior.
