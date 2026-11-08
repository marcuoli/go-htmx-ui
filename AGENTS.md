# Shared UI development

Read [docs/ui-parity.md](docs/ui-parity.md) for every reusable feature, pattern
or default change. Compare the current public rust-htmx-ui counterpart; preserve
idiomatic Go/templ APIs and document observable equivalence, compatibility and
platform gaps. Implement the counterpart through its owner or link a pending
owner issue. Record exact tested releases/commits and keep both parity documents
and component guidance current. Never infer released parity from a sent request.

Shared defaults are Standard / System / Comfortable, library-owned local assets,
plain sun/moon appearance icon (boxed presentation opt-in), neutral status text,
semantic dot/ring and opt-in pulse. Keep reusable resources,
builds, initialization and interactions in the library; consumers own domain
state, routes, authentication, native SSE and security policy.

Verify native keyboard/SVG activation, accessible names, OS/persistence/storage
changes, unavailable storage, scoped/nested/dynamic roots, all palettes, both
densities, 20px glyphs, header row geometry, narrow/wrapped layouts and status
tone/pulse/reduced motion when affected. Browser evidence is required for layout
and interaction claims. Preserve existing tests and upstream-only dependencies.

Use the owning issue and normal review/CI/immutable-release workflow. Keep
canonical source and operational version authority in their established place;
put logs, caches, builds and disposable fixtures in project-first external
storage. A source-only library release/validation does not create an unused live
build-counter authority. Follow docs/build-metadata.md and local go-versioning.
