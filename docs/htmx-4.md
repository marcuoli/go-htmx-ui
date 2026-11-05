# HTMX 2 and 4 compatibility

The library does not bundle or choose an application's HTMX runtime. Its controls
emit ordinary HTML/attributes, optional Alpine bindings, and native chart hosts.
The chart controller listens to both HTMX 2 and 4 lifecycle events.

## Verified scope

| Runtime | Companion | Verified behavior |
|---|---|---|
| HTMX 2.0.11 | Alpine 3.17.5 | Initial/live status bindings, real innerHTML fragment swaps, chart initialization/replacement/disposal |
| HTMX 4.0.1 | Alpine 3.17.5 and official hx-alpine-compat | Same fragment/status/chart lifecycle checks |

For HTMX 4, load the core, its official compatibility extension, then Alpine.
The standalone example does so with external deferred scripts:

```sh
go run ./examples/showcase -runtime-assets /external/node_modules -htmx4
```

Open `/alpine`. Development dependencies include the official `htmx4` npm alias;
the default example continues to use the HTMX 2 package. Neither framework nor
the compatibility extension is copied into shared `ui.Assets()` or added to Head.
The upstream extension coordinates Alpine's mutation observer with swap settling
and supports Alpine-aware morphing; see its [official documentation](https://four.htmx.org/extensions/hx-alpine-compat).

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
