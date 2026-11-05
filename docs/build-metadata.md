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
commands and the [released counter contract](https://github.com/marcuoli/go-versioning/blob/v0.3.0%2B20261105.9/docs/build-counters.md).

## Current build boundary

`examples/showcase` reads `versioning.CurrentBuild()`. Builders can inject the
shared `Info.LinkerFlags()` output, or the CLI's `build --format ldflags` output
for a real artifact reservation. The example no longer uses private `main.version`,
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

If an owned production-artifact entry point is introduced, first recheck history,
external state and every cooperating builder. Use stable application ID
`go-htmx-ui` and one explicitly configured absolute external authority. No source
checkout or cloud-sync copy becomes the live store. All production builders must
use the compatible shared release and the same authority; CI needs a qualified
mount or one allocation job before it can produce counted artifacts.

Only after confirming no earlier method/value or existing authority, the shared
`counter-init --seed-commits --branch main --evidence ...` command can collect a
fresh canonical HEAD/count/check time. Preserve that receipt and the live store's
one-line decimal `VERSION` plus journal/reservations. If earlier evidence or an
authority exists, use the reviewed seed/migration workflow instead; never reset,
clone, hand-edit or recount on normal builds.

Allocate once before each deliberate artifact-production invocation/matrix using
`build --request-id NEW_ID --format ldflags`, then pass those exact flags to the
compiler. A new compile needs a new ID; failed attempts consume their reservation.
Retrying only a lost allocation response reuses its original ID/metadata. Any
allocation/state error stops the build. Preserve immutable old releases and
receipts; migration is not blanket republication of historical artifacts.
