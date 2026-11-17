# Go dependency review

Checked on 2026-11-17 under [issue #38](https://github.com/marcuoli/go-htmx-ui/issues/38).
The [official Go feed](https://go.dev/dl/?mode=json) and
[release history](https://go.dev/doc/devel/release) select stable Go 1.27.4.
The module, Windows validation builds and Linux CI retain that compiler target.
This review covers the existing Go module, tests and declared templ/versioning
tools. Frontend package versions remain outside this Go-only refresh.

| Dependency | Previous | Selected official release |
| --- | --- | --- |
| a-h/templ runtime and CLI | v0.3.1100 | v0.3.1118 |
| a-h/parse | 2025-01-22 pseudo-version | v0.0.42 |
| go-htmx-table | 0.2.1+20261106.21 | 0.2.1+20261117.26 |
| andybalholm/brotli | v1.2.8 | v1.3.0 |
| golang.org/x/mod | v0.42.0 | v0.43.0 |
| golang.org/x/sync | v0.24.0 | v0.25.0 |
| golang.org/x/sys | v0.49.0 | v0.50.0 |

The table release resolves to `v0.2.2-0.20261117150223-61157d2ef968`,
source `61157d2ef9689707908b66758e75f85efde639a8`. Its published fixes preserve
page-size selection state and clamp pagination arithmetic. go-versioning's
current published identity remains `0.3.1+20261106.13`, with its existing official
module/tool pin unchanged. Every templ source was regenerated with v0.3.1118.
The stable parser removes the previous generator compatibility hold.

## Upstream graph entries and major versions

The complete before/after graph includes upstream requirements that load no
packages in the application's tests or declared tools. Explicit updates of the
following entries are removed by `go mod tidy`; their selected versions remain
upstream graph bookkeeping, rather than additional unused root requirements:

| Module | Upstream-selected graph version | Available version |
| --- | --- | --- |
| github.com/yuin/goldmark | v1.4.13 | v1.8.7 |
| golang.org/x/crypto | v0.58.0 | v0.59.0 |
| golang.org/x/telemetry | 2026-10-09 pseudo-version | 2026-11-16 pseudo-version |
| golang.org/x/term | v0.47.0 | v0.48.0 |
| golang.org/x/text | v0.43.0 | v0.44.0 |

Telemetry has no stable tagged release; neither pseudo-version is described as
stable. Recheck these graph entries at the next dependency review. Source and
binary advisory scans use the selected shipping graph; a graph entry alone does
not establish runtime reachability or exploitability.

Stable major successors were assessed separately from same-path `@latest`:
`github.com/cenkalti/backoff/v5` v5.0.3 and `go.yaml.in/yaml/v4` v4.0.0.
The repository does not import those APIs directly. Its upstream tooling/test
dependencies still require backoff/v4 and YAML v3 (including the older
gopkg.in/yaml.v3 module path). Retain those official paths until their owning
upstreams migrate; adding a new major beside them would not remove the old API.
No dependency source, cache, manifest or module path is patched or replaced.

## Evidence and maintenance

The issue records final checks, exact source/release references, and retained
exceptions. The dependency graph, upstream release notes, licenses, advisory
scans and regeneration receipts are retained in the owning external run record.
templ, parse and the standalone Mingo analyzer use MIT licenses; Brotli retains
its official permissive license and notices. Mingo v0.18.0 is an external
analysis tool, not a new application dependency. All other existing module
paths were reconciled with their current official same-path releases; no
retracted or deprecated selection was reported by the module inventory.
