# go-htmx-ui

Composable **Go + templ + Tailwind** UI components with embedded styles and optional charts. Designed to work with HTMX, server-rendered pages and application-owned SSE updates.

```sh
go get github.com/marcuoli/go-htmx-ui@v0.7.0
```

## Render a widget

```templ
import ui "github.com/marcuoli/go-htmx-ui"

templ Summary() {
    @ui.Widget(ui.WidgetProps{}) {
        @ui.WidgetHeader(ui.WidgetHeaderProps{Title: "Requests", Count: "123456"})
        @ui.WidgetMetric("Input tokens", "682888", "Reported usage")
    }
}
```

Commit your generated templ Go files as usual. Ordinary Go consumers do not need Node or the templ generator.

## Serve the assets

```go
mux.Handle("GET /assets/ui/", ui.AssetHandler("/assets/ui/"))
```

```templ
// Render once inside the full page's <head>.
@ui.Head(ui.HeadProps{AssetPrefix: "/assets/ui/", Charts: true})
```

Use `Charts: false` (the default) for CSS-only components. Both helpers share
the same application-owned prefix; neither registers global routes or inserts
HTML into an existing page. Render `Head` once, outside HTMX/SSE fragments.
`HeadProps.Nonce` optionally applies the application's CSP nonce to the external
deferred scripts. JavaScript-only applications can still serve `Assets()` and
list the stylesheet/scripts explicitly as documented in the chart guide.

Choose any asset URL prefix. The library has no router, authentication, database, CDN, font or network transport dependency. Assets include the unmodified official Apache ECharts 6.1.0 full bundle and its required third-party notices.

## Components

Widgets, widget headers, metrics, exact/compact values, native ECharts hosts, empty states, data disclosures, page headers, action groups, tabs, buttons, link buttons, labeled fields, inputs, selects, dialog shells/headers/bodies, badges, status indicators with optional pulsing rings, explicit authentication lock/text indicators, and version labels.

See [component and integration guide](docs/components.md) for props, slots, theme tokens, chart lifecycle, accessibility and boundaries. Tables remain in [go-htmx-table](https://github.com/marcuoli/go-htmx-table); compose them inside widgets rather than copying a table implementation.

Route shared component, API, style and asset requests through this module's
designated owning development session. Consuming apps retain domain logic and
adopt released shared versions rather than maintaining divergent copies.

## Showcase

```sh
go run ./examples/showcase -listen 127.0.0.1:8099
```

Open `http://127.0.0.1:8099` for synthetic dark/light widgets, forms, a modal, an updating chart and composition with published `go-htmx-table v0.2.0`. Example page layout and table styling belong to the example.

For the neutral standalone Alpine/HTMX consumer at `/alpine`, run the showcase
with `-runtime-assets /external/node_modules` pointing to installed development
dependencies. The example application serves those official runtimes itself;
the library does not bundle them or register Alpine globally. See the component
guide for `StatusAlpineBindings`, live classes/visibility and pulse styles.

The same example supports HTMX 4.0.1 with `-htmx4`, selecting the development-only
official npm alias and loading its `hx-alpine-compat` extension before Alpine.
The chart controller supports both HTMX 2 and 4 lifecycle events. Frameworks
are still application-owned; selecting HTMX 4 is a separate application
migration, particularly for inherited attributes and event/error handling.

Application metadata uses [go-versioning v0.1.1](https://github.com/marcuoli/go-versioning). Pass validated application build information to `ui.VersionLabel`; the component never probes Git, the working directory or the UI dependency's module version. An unversioned example correctly displays `0.0.0+unknown`. Library releases use conventional Go module tags (`v0.2.0`), separate from consuming applications' date/PR build versions.

## Repository layout

```text
go-htmx-ui/
├── *.go, *.templ       # Public ui components and generated Go
├── web/
│   ├── assets/        # Embedded CSS, JavaScript and license notices
│   ├── styles/        # Canonical Tailwind sources
│   ├── scripts/       # Frontend build tooling
│   ├── tests/         # JavaScript contract tests
│   └── package*.json  # Frontend dependency manifest and lockfile
├── examples/showcase/
├── docs/
└── .github/workflows/
```

The public Go package stays at the module root. `ui.Assets()` returns the same
asset filenames without a repository prefix; v0.6.0 intentionally changes the
chart API and runtime filenames. See the migration guide before upgrading. Go tests remain beside their Go source files.

## Compatibility

Requires **Go 1.27.3 and templ v0.3.1100**, with matching generated sources and
published `go-htmx-table v0.2.0`. Upgrade the runtime and regenerate consuming
applications together; older generated caller templates may reference APIs
removed by templ v0.3.1100. The earlier v0.6.0 release remains unchanged.

The canonical first-party chart controller is `ui-htmx-charts.js`.
`Assets()` also serves its previous `echarts-ui.js` name as an alias to the same
bytes, so existing native-chart URLs continue working. Load either name once,
after the formatter; the official `echarts.min.js` engine is unchanged.

## Development

```sh
go tool templ generate
npm --prefix web ci
npm --prefix web run build
npm --prefix web test
go test ./...
go vet ./...
go mod verify
```

`web/styles/components.css` is the canonical Tailwind source. `web/assets/ui.css` is generated without preflight, global body styles or fonts. Component rules use the standard `components` cascade layer so downstream utilities and custom classes can override them. The build scopes Tailwind fallback initialization and namespaces its internal custom properties. Applications can use the prebuilt CSS or adapt the source into their asset pipeline; preserve those isolation steps. App layout classes stay outside this library.

The latest official Go and frontend releases are checked during dependency
reviews. Current direct versions: templ v0.3.1100, go-htmx-table v0.2.0,
go-versioning v0.1.1, Tailwind 4.3.4 and ECharts 6.1.0. The generator is pinned as
a Go tool. Retain official parse v0.0.0-20250122154542-74294addb73e: the newer
v0.0.0-20261027111828-db2689052003 adds `Parser.Match`, which templ's generator
does not implement. Recheck that upstream exception on the next review.
ECharts' exact transitive versions and Tailwind's bundled WASI dependencies
remain as upstream ships them; no dependency sources or bundles are patched.

## Version maintenance

Use the existing go-versioning dependency for conventional module-core policy:

```sh
go run ./scripts/module-version -previous v0.6.0 -bump minor -check v0.7.0
```

The read-only command emits a JSON plan using `versioning.ParseCore` and
`Core.Bump`; it rejects application date/PR tags and mismatched expected tags.
CI checks the pending release plan. Tag creation and publication remain separate
authorized release steps; the planner never writes Git refs or publishes.

For first-party development against a local go-versioning checkout, create an
external Go workspace containing both repositories and set `GOWORK` to that
workspace file while validating. Keep that workspace outside source; do not
commit machine paths or a local `replace`. Release checks use `GOWORK=off` and
the published dependency. The optional go-versioning `inspect` command can
record explicit source metadata; its date/PR `tag` allocator belongs to consuming
applications and does not replace this library's conventional module tags.

For dependencies outside the checkout, set `GO_HTMX_UI_NODE_MODULES` to an
absolute `node_modules` directory containing the pinned frontend dependencies.
The asset builder resolves sources relative to its own script and uses the OS
temporary directory selected by the caller (for example, `TEMP`/`TMPDIR`).
Use `--output-dir /absolute/artifact/directory` for retained outputs and optionally
`--write-source` to promote snapshots. With no arguments the builder stages in the
configured temporary directory and promotes checked-in assets for normal CI.

MIT license. See [third-party notices](NOTICE.md).

## Native ECharts (v0.6.0)

`WidgetChartProps.Option` accepts a native ECharts object: `series`, `xAxis`,
`yAxis`, `legend`, `grid`, `dataZoom` and upstream coordinate systems. There is no
labels/datasets browser translation layer. `EChartsOption` is a Go map, and
`MarshalEChartsOption` serializes it as JSON; `EChartsConfig` supplies validated
unit/date callbacks and lifecycle state separately.

```go
option := ui.EChartsOption{
    "xAxis": map[string]any{"type": "category", "data": []string{"A", "B", "C"}},
    "yAxis": map[string]any{"type": "value"},
    "series": []any{map[string]any{
        "id": "requests", "name": "Requests", "type": "line",
        "data": []any{0, nil, 5},
    }},
}
// In templ: @ui.WidgetChart(ui.WidgetChartProps{ID:"requests", Label:"Requests", Option:option})
```

The official unmodified `echarts.min.js` is the only third-party engine asset.
First-party `echarts-format.js` contains display arithmetic; `ui-htmx-charts.js`
handles initialization, native snapshots, reading state, resize, themes and HTMX
cleanup. No functions are revived from JSON. Tooltips use ECharts rich text.

This is a **breaking pre-1.0 release**: upgrade native options, the host markup,
script includes and `GoHTMXUI.echarts` calls together. Older published versions
remain unchanged; there is no silent old-schema fallback or compatibility bundle
URL in v0.6.0. Consumer upgrades/deployments are separate.

- [Native API, chart families and JavaScript-only integration](docs/charts.md)
- [Concrete v0.5-to-v0.6 migration and live DOM preservation](docs/migration-native-echarts.md)
- [Display units, locale and time bases](docs/units.md)

The library owns presentation and lifecycle. Applications retain collection,
transport/authentication, history, preferences, aggregation and business logic.
