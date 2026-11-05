# Defaults, themes and app layout

Available since `0.9.0+20261105.18`. Pin the current full release tag:
`go get github.com/marcuoli/go-htmx-ui@v0.10.3+20261105.26`.

`Page` supplies a complete document with shared CSS and the external UI runtime.
`AppShell` adds a header, optional navigation/sidebar, content and optional
footer. Components inherit appearance from the surrounding App, with no global
configuration or per-component theme argument.

```go
mux.Handle("GET /assets/ui/", ui.AssetHandler(""))
```

```templ
import ui "github.com/marcuoli/go-htmx-ui"

templ Application() {
    @ui.Page(ui.PageProps{Title: "My application"}) {
        @ui.AppShell(ui.AppShellProps{
            Title: "My application",
            Nav: []ui.NavItem{{Label: "Overview", Href: "/", Active: true}},
        }) {
            @ui.Stack() {
                @ui.TextField(ui.TextFieldProps{
                    Label: "Project name",
                    Input: ui.InputProps{Name: "project"},
                })
                @ui.Button(ui.ButtonProps{}) { Save }
            }
        }
    }
}
```

This needs no application CSS or JavaScript. Routes, data, meaningful labels,
permissions and actions remain application-owned. Smaller components can still
be composed inside existing documents.

## Appearance

| Setting | Default | Choices |
| --- | --- | --- |
| Theme | `ThemeStandard` | Standard, Ocean, Forest |
| Mode | `ModeSystem` | System, Light, Dark |
| Density | `DensityComfortable` | Comfortable, Compact |
| Asset prefix | `/assets/ui/` | Application-owned local path |
| Document language/title | `en`, Application | PageProps.Lang, Title |

Every theme has complete Light and Dark palettes. System selects between that
theme's variants using prefers-color-scheme, including live system changes.
Semantic text, borders, focus, status colors and six chart colors are coordinated.
The palettes are checked for text/button contrast and visible controls, focus
and chart colors; these are focused checks rather than an application audit.

Configure appearance once:

```templ
@ui.Page(ui.PageProps{
    Title: "Monitor", Charts: true,
    App: ui.AppProps{
        Theme: ui.ThemeOcean, Mode: ui.ModeSystem,
        Density: ui.DensityCompact, StorageKey: "monitor:appearance",
    },
}) {
    @ui.AppShell(ui.AppShellProps{Title: "Monitor"}) {
        // All descendants inherit the defaults.
    }
}
```

For an existing document, load `Head(HeadProps{Interactive: true})` once and wrap
the relevant subtree in `App(AppProps{...})`. Add Charts when needed. App scopes
tokens, typography and spacing; Page also opts its body into a margin reset.
Standalone components keep their prior CSS fallbacks. Independent/nested Apps
reset the complete palette and density: a Light preview stays Light inside a
Dark app. Native chart options and explicit colors remain authoritative; theme
updates retain the chart instance and existing native reader state.

AppProps.Accent accepts a three- or six-digit hexadecimal primary color. It sets
the primary button fill and first chart color, and chooses black/white button
text with the higher contrast. Semantic link/focus colors stay theme-controlled.
Invalid colors retain defaults. This opt-in emits a style attribute; applications
whose CSP disallows style attributes can override tokens via AppProps.Class.
Page/Head support an application-provided CSP nonce on their external scripts.

## Switching and persistence

AppShell includes ThemeSwitcher by default; HideThemeSwitcher omits it. Extra
`ThemeSwitcher(ThemeSwitcherProps{})` components inherit their owning App. Labels
can be localized. SSR selections reflect render-scoped settings; the runtime
synchronizes switchers and remembers theme, mode and density.

StorageKey defaults to `go-htmx-ui:appearance`. Use separate keys for apps on a
shared origin, or DisablePersistence for embedded previews. Valid remembered
choices override initial server settings. Malformed, blocked or full local
storage retains a usable page; changes still work in memory. Matching storage
changes from other tabs update eligible roots. Server-owned preferences can be
passed as the initial App props.

Without JavaScript, server-selected palettes and System mode work through CSS.
Switcher controls stay disabled until the runtime is ready, and sidebar links
remain visible. Theming does not require Alpine or HTMX.

```js
const root = document.getElementById("my-app");
GoHTMXUI.ui.setAppearance(root, {theme: "forest", mode: "dark"});
GoHTMXUI.ui.getAppearance(root); // theme, mode, density, resolvedMode
GoHTMXUI.ui.init(root);         // idempotent manual discovery
```

Changes emit the bubbling gohtmxui:theme event. Inserted roots, switchers and
navigation are discovered automatically. HTMX4 enhancement waits for its final
swap signal: CSS settling restores server attributes after insertion, so early
initialization can lose preferences and chart registration. Real innerHTML
replacements were checked with HTMX2.0.11 and HTMX4.0.1, including preference
restoration and old-chart disposal. Application morph/history/SSE behavior
needs its own checks.

## Shell, layout and state defaults

- AppShellProps.Nav creates links; Sidebar, Actions and Footer accept optional
  templ components. Empty navigation/sidebar is omitted. Use the app's own
  metadata with `Footer: ui.VersionLabel(info)`.
- Mobile navigation is an in-flow disclosure with expanded state, Escape and
  focus restoration. Desktop links remain visible. A skip link targets main
  content. Give multiple shells distinct IDs.
- Stack supplies vertical spacing. Grid fits columns to available width;
  Columns 1–4 selects a responsive fixed count.
- Buttons default to Primary/type button. Loading disables the button, sets
  aria-busy and shows Working…; LoadingLabel localizes it. Disabled, invalid
  and focus styling are shared.
- TextField/SelectField connect label, hint, error and aria-invalid. The control
  ID defaults to Name; provide distinct IDs when reusing names. Error text is
  escaped. Validation rules remain in the application.
- LoadingState/EmptyState have useful default labels and custom text/children.
  Decorative animation respects prefers-reduced-motion.

Tokens remain overridable in the CSS cascade. Use AppProps for reserved data-ui
appearance markers and Class for class names; other Attributes are trusted
server-defined integration markup. `web/styles/themes.json` is the palette
source, layout.css owns scoped app defaults and components.css retains the
smaller component contracts. The builder checks complete paired palettes and
generates ui.css.

Open `/themes` in the showcase for all six previews, shared states, a custom
primary color, live charts and optional HTMX fragment exercises.
