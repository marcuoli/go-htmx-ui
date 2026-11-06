# Version and build metadata

go-htmx-ui is a source-only component library. Components accept application
metadata; they do not allocate build numbers, read a counter store or inspect
the application's working directory. `VersionLabel(info)` validates the supplied
`versioning.Info` and preserves its full `CORE+YYYYMMDD.PR` version. Applications
decide how to present the separate overall build number and counter provenance.

The official shared dependency/tool release is
[`0.3.1+20261106.13`](https://github.com/marcuoli/go-versioning/releases/tag/v0.3.1%2B20261106.13),
source `4c3c478eb8271ef67c594655c3207334c85efde9`. Go records its coordinate as
`v0.3.2-0.20261106100520-4c3c478eb827`. Use the pinned `go tool go-versioning`
commands and the shared [canonical-main contract](https://github.com/marcuoli/go-versioning/blob/v0.3.1%2B20261106.13/docs/counter-location.md).
This library uses only read-only metadata and version maintenance; it does not
create a counter merely to exercise the contract.

## Current build boundary

`examples/showcase` reads `versioning.CurrentBuild()`. Builders can inject the
shared `Info.LinkerFlags()` output for supplied validation metadata. A production
reservation requires the shared validation and allocation described below; no
production writer is enabled here. The example no longer uses private `main.version`,
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

## Canonical VERSION placement and shared validation

`VERSION` and `VERSION.authority.json` belong at the owning application's permanent
canonical main root. Both are untracked operational files, covered by reviewed
root-anchored ignore rules. The ownership record binds the numeric file to the
application, authority and original journal path. A temporary checkout, artifact
store or independently writable CI/cloud-sync copy is not the designated main.
Journal, lock, baseline, issuance and receipt storage stay on the same allocation
host/store. Exact machine paths belong in private operational evidence.

This library has no live authority or production-artifact writer, so its canonical
operational paths are intentionally absent. Location/status/relocation is **N/A**,
not a missing-file failure. Do not initialize a counter, create a placeholder or
fabricate an ownership file for this source-only category. Existing source releases,
validation jobs and read-only runtime metadata need no relocation. The shared
`Repository.CheckCounterFiles` can verify the untracked/ignored Git policy without
allocating or creating either file.

For an existing authority, first upgrade all builders and preserve current status
and receipt hashes. On its one allocation host use the official sequence:
`counter-status`, `counter-check`, an explicitly required `counter-relocate`, then
`counter-check` again. Keep the same source, explicit `--main-repo`, journal store
and application ID. Only the expected legacy-layout diagnostic permits relocation;
other I/O, corruption, ownership or tracking errors require investigation.
A missing main file is expected before relocation: the shared operation creates
it at the preserved current number, without a placeholder, seed or allocation.
Keep retired evidence. Do not hand-move/edit/reset/reseed state or copy a journal.

A future owned production-artifact entry point must recheck canonical history,
existing state and every cooperating builder. Use stable application ID
`go-htmx-ui` and one supported authority whose writers reach the same permanent
canonical files and journal. All writers use shared `counter-check` / `CheckLocation`
and `Repository.CheckCounterFiles` validation before `Reserve`; the shared CLI
build command applies that gate. CI/WSL/SSH needs qualified access to the same
host/file, or one allocation job; a source clone or path alias is not a substitute.
If the host cannot reach real permanent main, keep production held. A relocation
must preserve the current number/baseline, authority identity, every reservation,
retry and published artifact. Already-reserved attempts may finish safely.

Only if the investigation confirms no previous method/value or authority, the
official `InitializeAt` / `InitializeSeedAt` or `counter-init` with explicit main
may collect the reviewed seed/fresh canonical evidence once. Never use that route
for an existing authority. Preserve receipts; never recount on normal builds. Allocate once
per deliberate production invocation/matrix, with a new request ID for a new
compile. Failed attempts consume reservations; retrying only a lost allocation
response retains its original metadata. Any state/allocation error stops new
compilation. Do not republish historical artifacts to apply this correction.

Allocation/migration tests require a standalone isolated Git primary-main fixture
before invoking shared tooling. A linked worktree of real source still resolves
real main and is not isolated. Read-only metadata checks may use actual source;
never pair a temporary journal with real application main in a writing test.
