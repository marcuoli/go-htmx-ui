# Shared frontend resources

`go-htmx-ui` owns the versions, official bytes, notices, downloads and load order
of shared frontend dependencies. Consuming apps use its handlers and build tool;
keep framework copies, CDN tags and Tailwind npm dependencies out of the app.
Application state, request/CSRF configuration, CSP, first-party scripts, logos and
custom stylesheet inputs remain in the app.

## Browser assets

Register the shared handler once and include the shared head once in a complete
page. Fragments contain component markup, not framework script tags.

```go
mux.Handle("GET /ui/shared/", ui.AssetHandler("/ui/shared/"))
```

```templ
@ui.Head(ui.HeadProps{AssetPrefix: "/ui/shared/", Frontend: true, Charts: true})
```

The handler serves compiled Tailwind CSS, pinned HTMX 2.0.11, Alpine 3.17.5 and
optional ECharts from embedded local files. `ui.Page` enables shared appearance,
feedback, HTMX and Alpine by default. A plain zero-valued `ui.Head` retains its
stylesheet-only behavior for compatibility; set `Frontend: true` to enable the
frameworks. All script tags are external, deferred and use the same normalized
local prefix. `Nonce` applies to every emitted script. No CDN fallback or runtime
package download is used in the browser.

For an HTMX-only page, including a strict CSP that does not permit Alpine's normal
expression evaluation, set `DisableAlpine: true`. Set `PageProps.DisableFrontend`
for a static page; shared appearance and feedback controls remain available.
The module leaves the app's `htmx-config` and HTTP CSP intact. In particular,
existing `allowEval`, `includeIndicatorStyles`, `selfRequestsOnly`, response
handling and CSRF settings remain app configuration.

HTMX 2 remains the compatibility default. Explicit `HTMX: ui.HTMX4` selects the
embedded official 4.0.1 core; its official Alpine compatibility extension loads
between the core and Alpine when Alpine is enabled. See [HTMX migration](htmx-4.md).
`PageProps.ExtraHead` runs after shared UI/chart assets and before the framework
scripts, so app initialization can register `alpine:init` handlers before startup.
When composing a low-level `Head`, emit such registration scripts before its
frontend-enabled call. Apps should load each framework exactly once.

System fonts are the shared default. An app should not add Google Fonts/CDN
requests; any future shared font distribution belongs in this module.

## Build-time custom CSS

Apps with their own Tailwind stylesheet use the build command from the same
pinned Go module. No Node/npm installation or app-owned Tailwind version is
required for this command:

```sh
go run github.com/marcuoli/go-htmx-ui/cmd/go-htmx-ui css \
  --input /absolute/app/web/input.css \
  --output /absolute/generated/app.css \
  --cache-dir /absolute/managed-tools/tailwindcss \
  --source /absolute/go-htmx-table-module
```

`--source` is optional and repeatable, for additional module directories outside
the app's own source declarations. Existing relative CSS imports and `@source`
paths keep their original bases; the tool imports the original input without
rewriting it. Existing app-specific styles and preflight choices are preserved.
New CSS output uses server-readable permissions; an existing output retains its mode.
The default is minified output; `--minify=false` keeps readable output.

The module pins official standalone Tailwind 4.3.5, checks its exact size and
SHA256 before execution, and reuses a verified compiler in the supplied cache.
`GO_HTMX_UI_TAILWIND_CACHE` can supply the absolute cache directory instead of a
flag. Choose managed generated storage, for example
`V:\Development\tools\tailwindcss` in the maintained Windows layout. Scope
TEMP/TMP/TMPDIR for temporary entry stylesheets; final output is staged beside
its destination before replacement. A corrupt/unexpected compiler cache is
preserved and rejected. An overall `--timeout` bounds download and compilation.
No compiler update, npm install, framework download or third-party patch belongs
in the consuming app's build script.

Official targets are Windows x64, Linux x64/arm64 (glibc or explicit `--musl`),
and macOS x64/arm64. Unsupported targets fail before downloading. The module
records the release URLs and digests in `internal/frontendbuild/tailwind.json`,
cross-checked against the official checksum file. A single module upgrade updates
the browser distributions and build compiler contract. You may register the
command as a Go `tool` directive, using the same full module tag.

## Migration and provenance

1. Upgrade to the released full go-htmx-ui tag and retain its exact Go coordinate.
2. Register `AssetHandler`, enable the shared frontend through `Head` or `Page`,
   and remove app-owned HTMX/Alpine tags, copies, download hooks and dependencies.
3. Replace app-owned Tailwind CLI/npm calls with the shared CSS command. Keep the
   app's stylesheet and explicit scan sources; promote generated CSS deliberately.
4. Preserve first-party initialization, request configuration, CSP and data
   lifecycle. Qualify actual swaps, themes, modals/toasts and chart identities.

`frontend.provenance.json` records exact upstream package versions, npm integrity
and per-file SHA256, including HTMX licenses, Alpine's upstream-tag MIT text,
its bundled Vue notices, and Tailwind's license. Runtime distributions are copied
unchanged; Tailwind remains a build-time compiler rather than a browser runtime.
ECharts retains its separate official provenance and notices. Module builds and
source releases do not initialize a live counter; the consuming application's
production build remains responsible for its own build identity and reservation.
