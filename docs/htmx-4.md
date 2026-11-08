# HTMX 2 and 4 compatibility

The module owns the official HTMX runtimes, local asset serving and load order.
HTMX2 remains the compatibility default; explicit HTMX4 selection is a consuming
app migration. Its chart controller supports both lifecycle event contracts.

## Verified scope

| Runtime | Companion | Verified behavior |
|---|---|---|
| HTMX 2.0.11 | Alpine 3.17.5 | Initial/live status bindings, real innerHTML fragment swaps, chart initialization/replacement/disposal |
| HTMX 4.0.1 | Alpine 3.17.5 and official hx-alpine-compat | Same fragment/status/chart lifecycle checks |

Select `HTMX: ui.HTMX4` on `HeadProps{Frontend:true}` or `PageProps`. The shared
loader emits the core, official compatibility extension, then Alpine, using
embedded local assets. `DisableAlpine:true` omits Alpine and its compatibility
extension. Apps do not add those script tags or download packages themselves.

```sh
go run ./examples/showcase -htmx4
```

Open `/alpine`. No node_modules/runtime-assets argument is needed. The official
extension coordinates Alpine mutation observation with swap settling and morph
state; see its [documentation](https://four.htmx.org/extensions/hx-alpine-compat).
See [shared frontend resources](frontend-assets.md) for setup and CSS ownership.
The controller retains HTMX 2's `htmx:beforeCleanupElement`/`htmx:afterSwap` hooks
and additionally supports HTMX 4's `htmx:before:cleanup`/`htmx:after:swap`.
HTMX 4 cleanup uses `event.target`; post-swap discovery scans the document to
cover multiple swap tasks and release detached hosts. Repeated rendering is
idempotent. Existing native-chart host/engine-child preservation rules still
apply; morph/history and streaming combinations need application qualification.

## Application migration checks

HTMX 4 is published as a stable 4.x release, while upstream intentionally keeps
the npm `latest` dist-tag on 2.x for existing consumers. Select an explicit 4.x
version rather than treating `latest` as a major-version migration.

Before switching an application, review:

- Explicit inheritance (`:inherited`), especially parent target, confirmation,
  request-header/CSRF and form/include settings.
- Renamed lifecycle events and changed event detail/request-header formats.
- HTTP error-response swapping, DELETE form data, timeout and history behavior.
- Extension loading, SSE/WebSocket integrations, OOB ordering and any morph rules.

The official upgrade checker can scan templates and JavaScript, with `--ext .templ`
for templ sources. The shared controller intentionally retains its two HTMX 2
event names alongside the new hooks, so those checker findings are compatibility
code, not unhandled migrations. Dynamic developer-supplied attributes still need
consumer-specific review. No full application migration, deployment or broad
morph/streaming qualification is implied by the focused checks above.

Sources: [HTMX 4 release announcement](https://four.htmx.org/announcements/2026-08-28-htmx-4.0.0-is-released),
[official migration catalog](https://four.htmx.org/docs/whats-new-in-htmx-4),
[cleanup event](https://four.htmx.org/reference/events/htmx-before-cleanup),
[swap event](https://four.htmx.org/reference/events/htmx-after-swap).
