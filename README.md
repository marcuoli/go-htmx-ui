# go-htmx-ui

Composable **Go + templ + Tailwind** UI components with embedded styles and optional charts. Designed to work with HTMX, server-rendered pages and application-owned SSE updates.

```sh
go get github.com/marcuoli/go-htmx-ui@v0.1.0
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
mux.Handle("GET /assets/ui/", http.StripPrefix("/assets/ui/",
    http.FileServer(http.FS(ui.Assets()))))
```

```html
<link rel="stylesheet" href="/assets/ui/ui.css">
<!-- Optional, for charts only; keep this order. -->
<script src="/assets/ui/chart.umd.js" defer></script>
<script src="/assets/ui/charts.js" defer></script>
```

Choose any asset URL prefix. The library has no router, authentication, database, CDN, font or network transport dependency. Assets include Chart.js 4.6.1 and both required MIT notices.

## Components

Widgets, widget headers, metrics, exact/compact values, chart canvases, empty states, data disclosures, page headers, action groups, tabs, buttons, link buttons, labeled fields, inputs, selects, dialog shells/headers/bodies, badges and version labels.

See [component and integration guide](docs/components.md) for props, slots, theme tokens, chart lifecycle, accessibility and boundaries. Tables remain in [go-htmx-table](https://github.com/marcuoli/go-htmx-table); compose them inside widgets rather than copying a table implementation.

## Showcase

```sh
go run ./examples/showcase -listen 127.0.0.1:8099
```

Open `http://127.0.0.1:8099` for synthetic dark/light widgets, forms, a modal, an updating chart and composition with published `go-htmx-table v0.1.0`. Example page layout and table styling belong to the example.

Application metadata uses [go-versioning v0.1.1](https://github.com/marcuoli/go-versioning). Pass validated application build information to `ui.VersionLabel`; the component never probes Git, the working directory or the UI dependency's module version. An unversioned example correctly displays `0.0.0+unknown`. Library releases use conventional Go module tags (`v0.1.0`), separate from consuming applications' date/PR build versions.

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
asset filenames regardless of their source directory, so consumers keep their
imports and asset URLs. Go tests remain beside their Go source files.

## Compatibility

Tested with **Go 1.27.3 and templ 0.3.1070**. Generated files are included. The newer templ **0.3.1100 runtime removes APIs used by this generator and published go-htmx-table v0.1.0**; upgrading that runtime requires compatible regenerated releases of both libraries. Do not assume arbitrary templ runtime versions are interchangeable.

## Development

```sh
go run github.com/a-h/templ/cmd/templ@v0.3.1070 generate
npm --prefix web ci
npm --prefix web run build
npm --prefix web test
go test ./...
go vet ./...
go mod verify
```

`web/styles/components.css` is the canonical Tailwind source. `web/assets/ui.css` is generated without preflight, global body styles or fonts. The build scopes Tailwind fallback initialization and namespaces its internal custom properties. Applications can use the prebuilt CSS or adapt the source into their asset pipeline; preserve those isolation steps. App layout classes stay outside this library.

For dependencies outside the checkout, set `GO_HTMX_UI_NODE_MODULES` to an
absolute `node_modules` directory containing the pinned frontend dependencies.
The asset builder resolves sources relative to its own script and uses the OS
temporary directory selected by the caller (for example, `TEMP`/`TMPDIR`).
Generated assets are always written to `web/assets/`.

MIT license. See [third-party notices](NOTICE.md).
