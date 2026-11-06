# Version and build metadata

go-htmx-ui is a source-only component library. Components accept application
metadata; they do not allocate build numbers, read a counter store or inspect
the application's working directory. `VersionLabel(info)` validates the supplied
`versioning.Info` and preserves its full `CORE+YYYYMMDD.PR` version. Applications
decide how to present the separate overall build number and counter provenance.

The official shared dependency/tool release is
[`0.3.0+20261105.9`](https://github.com/marcuoli/go-versioning/releases/tag/v0.3.0%2B20261105.9),
source `db72d5637162e89cd0ffc26126ff008c270c2789`. Go records its coordinate as
`v0.3.1-0.20261105212739-db72d5637162`. Use the pinned `go tool go-versioning`
commands for read-only metadata and version maintenance. The
[0.3.0 counter contract](https://github.com/marcuoli/go-versioning/blob/v0.3.0%2B20261105.9/docs/build-counters.md)
predates the corrected placement below; its store-local `VERSION` instructions
must not be used for a new writer or cutover.

## Current build boundary

`examples/showcase` reads `versioning.CurrentBuild()`. Builders can inject the
shared `Info.LinkerFlags()` output for supplied validation metadata. A production
reservation requires an official writer supporting the placement below; none is
enabled here. The example no longer uses private `main.version`,
`main.commit` or `main.buildTime` linker variables. Its startup log records the
validated metadata, and its footer displays the full application identity.
Without injection, the overall build number remains zero/unknown and actual
build time remains empty/unknown; VCS commit time is not a compilation time.
Runtime has no dependency on Git or a counter authority.

Current tests, import/dependency compilation, generated-source/asset checks and
temporary CI/showcase verification executables are non-allocating validation.
Version inspection, tag creation and the hosting service's automatic source
archives also do not reserve a build number. This repository currently has no
owned executable/package/archive production entry point, published binary assets
or live project counter authority. Do not create an unused authority or independent
CI stores for those validation jobs. Ordinary users importing this module never
allocate a library counter.

## History investigation and future production builds

Issue #25 records the investigation. At canonical main
`c55b0883e034f06c08bf4cb99ab7fcbf45b54d6e` on 2026-11-05, complete non-shallow
history, current/relevant branches, build/release tooling and active hooks
contained no prior numeric build-number algorithm/value or source `VERSION` file.
`git rev-list --count HEAD` returned **17** unique reachable commits. This is a
candidate one-time continuity seed, not a claim about historical build attempts
or a frozen baseline for future initialization. It was not allocated or stored.

## Canonical VERSION placement and writer hold

`VERSION` belongs at `<permanent-canonical-main>/VERSION`, alongside the owning
application's permanent main checkout. A temporary worktree, artifact directory,
journal store or independently writable CI/cloud-sync copy is not that location.
Journal, cache and build storage remain separate. Exact machine paths belong in
the owning project's local operational evidence.

This library has no live authority or production-artifact writer, so its canonical
`VERSION` path is intentionally absent. Do not create a counter or an unused file
merely to satisfy the location rule. Existing source releases, validation jobs and
read-only runtime metadata need no relocation.

Counter-writing initialization, allocation, cutover and production publication
using the old store-local placement remain on hold. The pinned 0.3.0 release
supports this library's read-only metadata/version operations, but its writer
contract does not implement the corrected split. Before adding a production
writer, adopt an official compatible release that supports the canonical file and
preserves the authority/journal contract. Do not patch the dependency or move,
edit, reset or reseed live files manually.

A future owned production-artifact entry point must recheck canonical history,
existing state and every cooperating builder. Use stable application ID
`go-htmx-ui` and one supported authority whose writers reach the same permanent
canonical `VERSION` and journal. CI needs qualified access or one allocation job;
it must not create a per-run or per-checkout sequence. Any supported relocation
must preserve the current number/baseline, authority identity, every reservation,
retry and published artifact. Already-reserved attempts may finish safely.

Only if the investigation confirms no previous method/value or authority, the
official supported initialization may collect a fresh canonical HEAD/count/check
time once. Preserve its receipt; never recount on normal builds. Allocate once
per deliberate production invocation/matrix, with a new request ID for a new
compile. Failed attempts consume reservations; retrying only a lost allocation
response retains its original metadata. Any state/allocation error stops new
compilation. Do not republish historical artifacts to apply this correction.
