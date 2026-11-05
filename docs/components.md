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
| StatusIndicator | StatusIndicatorProps: Label, Tone, Pulse, Class, LabelClass, Attributes, LabelAttributes; dot and text |
| Head / AssetHandler | HeadProps: AssetPrefix, Charts, Nonce / application-owned asset route |

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

Shared rules are in `@layer components`, with Tailwind's standard layer order
declared so host `utilities` can override them even when `Head` loads shared CSS
first. Unlayered application rules also override layered component defaults.
Use `StatusIndicatorProps.LabelClass` for label-specific utility classes;
`Class` styles the wrapper. The solid status dot has no added margin.

## Page assets

Register `ui.AssetHandler("/ui/shared/")` at the same application-owned router
prefix, then render `@ui.Head(ui.HeadProps{AssetPrefix: "/ui/shared/", Charts: true})`
once inside a full page's `<head>`. With no prefix both helpers use `/assets/ui/`;
leading/trailing slashes are normalized. Prefixes describe local URL paths.

`Charts: false` emits only the shared stylesheet. `Charts: true` additionally
loads the external deferred engine, formatter and controller in dependency order.
An optional `Nonce` applies to those scripts; CSP headers, middleware and route
authorization remain application-owned. Do not render Head again in fragments
or also include the same scripts manually. No global mux, page architecture,
inline JavaScript or arbitrary existing HTML is changed by these helpers.

## Status indicator

```templ
@ui.StatusIndicator(ui.StatusIndicatorProps{
    Label: "Connected", Tone: ui.StatusSuccess, Pulse: true,
    Attributes: templ.Attributes{"id": "connection-status", "role": "status"},
})
```

`StatusNeutral` (the default), `StatusSuccess`, `StatusWarning`, `StatusDanger`
and `StatusInfo` select the color. `Pulse` explicitly enables a two-second
expanding ring; a solid dot and the visible label remain steady. Reduced-motion
preferences disable the ring. Only `ui.css` is needed; there is no JavaScript,
Alpine, HTMX or chart dependency for the indicator itself.

Applications own state, freshness and text. For a stale observation, render
`Label: "Updates paused", Tone: ui.StatusNeutral, Pulse: false`. A failure can
stay solid or pulse as the application requires; tone never implies animation.
Unrecognized Go tone values fall back to neutral.

For live DOM updates, set the wrapper's `data-tone` to `neutral`, `success`,
`warning`, `danger` or `info`, set `data-pulse` to the string `"true"` or
`"false"`, and update `.ghtui-status-label` with `textContent`. Keep the wrapper
stable when using a live region. `Attributes` supports IDs, HTMX attributes,
`x-show` and `x-bind:data-tone`/`x-bind:data-pulse`; `LabelAttributes` can supply
`x-text`. For example, an Alpine consumer can use:

```templ
@ui.StatusIndicator(ui.StatusIndicatorProps{
    Label: "Connecting", Tone: ui.StatusNeutral,
    Attributes: templ.Attributes{
        "x-bind:data-tone": "connected ? 'success' : 'neutral'",
        "x-bind:data-pulse": "connected ? 'true' : 'false'",
    },
    LabelAttributes: templ.Attributes{"x-text": "statusText"},
})
```

The dot is decorative (`aria-hidden`); the label conveys the status without
relying on color or motion. Live announcements are opt-in through caller-owned
`role="status"` or `aria-live` attributes to avoid unsolicited announcements in
tables and repeated indicators. Supply a meaningful visible label.

Override inherited `--ghtui-success`, `--ghtui-warning`,
`--ghtui-status-danger` or `--ghtui-accent` for the semantic colors. The status
danger token is separate from the existing button background token.
`--ghtui-status-color` overrides all tones, `--ghtui-status-label-color` can give
the text its own color, and `--ghtui-status-dot-size` changes the solid dot's
diameter (default `10px`). Custom `Class` rules can change typography and spacing.

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
   echarts-format.js and ui-htmx-charts.js once, in that order.
3. Compose widgets and controls with application-owned layout/data/permissions.
4. Use native ECharts options and explicit format bindings; preserve host nodes
   and engine-owned children during live patches. Call update/render or destroy.
5. Keep tables in go-htmx-table, and transport/history/business rules in the app.
