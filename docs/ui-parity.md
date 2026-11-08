# Go/Rust UI parity contract

go-htmx-ui and rust-htmx-ui share a product contract for reusable UI features,
patterns, defaults and accessibility. A shared change must assess its counterpart
and update both libraries or record the pending port in a linked owner issue.
Keep Go/templ and Rust/Maud APIs idiomatic; matching behavior does not require
identical types, names or implementation files.

Public counterparts:

- [go-htmx-ui](https://github.com/marcuoli/go-htmx-ui)
- [rust-htmx-ui](https://github.com/marcuoli/rust-htmx-ui)
- [Rust policy](https://github.com/marcuoli/rust-htmx-ui/blob/05fd7530f06b81298959004924e0f9a7249054a3/docs/ui-parity.md)

## Shared defaults and ownership

| Concern | Shared contract |
| --- | --- |
| Palette | Standard initially; Standard, Ocean and Forest remain selectable. |
| Appearance | System initially, following the OS until an explicit choice. |
| Density | Comfortable initially; Compact remains supported. |
| Appearance control | Plain sun/moon icon with native button semantics; boxed style is opt-in, palette selection is independent. |
| Status text | Neutral text; semantic color belongs to the decorative dot/ring. |
| Status animation | Pulse is opt-in, stops when inactive and respects reduced motion. |
| Resources | Local assets owned, built, versioned and initialized by the shared library. |
| Consumer responsibilities | Domain state/data, authentication, routes, native SSE and application security policy. |

Library ownership includes frontend packages, locks, stable-version/advisory
checks, notices, assets, framework initialization and reusable interactions.
Consumers compose shared components and domain behavior. They must not acquire
or initialize their own copies of shared frontend frameworks. Go's build-time
Tailwind compiler contract is in [frontend-assets.md](frontend-assets.md).

## Appearance and status pattern

The sun/moon button describes its next action. Light mode shows a moon with
"Switch to dark mode"; dark mode shows a sun with "Switch to light mode".
A click resolves the current appearance and persists an explicit light/dark
choice. System mode remains available through the appearance API/root default.
Controls are disabled before runtime enhancement. Use native keyboard activation,
decorative icons and an accessible action name/title.
The default has no persistent background, visible border or shadow. Preserve a
usable hit target and visible keyboard focus. Go's explicit boxed alternative is
`AppearanceToggleProps{Style: ui.AppearanceButton}`; ThemeSwitcher exposes
`AppearanceStyle`, as does AppShell for its built-in switcher. Zero/unknown styles remain plain. Both presentations retain
the same action, runtime and geometry contract.

Multiple controls within one root synchronize; nested roots remain independent.
New DOM/SPA fragments, OS changes and cross-tab storage updates reconcile controls.
Unavailable storage must not prevent in-page changes. Glyphs stay 20 by 20 pixels
in both densities; verify computed layout against shared button padding. Within a
shell header the Theme label is inline. Action controls sharing a row must have
equal heights, tops, bottoms and vertical centers; status text shares that center.
Check this in both densities, including wrapped and narrow layouts. Standalone
switchers can keep stacked labels.

For a live-update indicator, use the stable visible label "Live updates".
Expose full state, including the visible label, in its tooltip and accessible
name. Keep the text neutral as the dot/ring changes semantic tone. The consumer
decides connection freshness and pulse state; the shared component presents it.

```templ
@ui.ThemeSwitcher(ui.ThemeSwitcherProps{})
// Or a standalone control inside the owning App:
@ui.AppearanceToggle(ui.AppearanceToggleProps{})
@ui.StatusIndicator(ui.StatusIndicatorProps{
    Label: "Live updates", Description: "Live updates: connected",
    Tone: ui.StatusSuccess, Pulse: true,
})
```

For application-owned Alpine state, use `StatusAlpineBindings.Description` for
both `x-bind:title` and `x-bind:aria-label`. Explicit wrapper attributes remain
authoritative. Described indicators use a naming-capable, non-live `role="group"`;
an explicit caller role wins. Live announcements remain opt-in in Go through `role="status"`
or `aria-live`; Rust v0.3.0 supplies `role="status"` by default. This preserves
Go's existing repeated/table indicator behavior. Opt in when live announcements
are appropriate for the consumer. Both APIs escape ordinary text.

## Public API mapping and verified baseline

| Pattern | Go API | Rust API |
| --- | --- | --- |
| Theme controls | ThemeSwitcher, AppearanceToggle | theme_switcher, appearance_toggle |
| Status | StatusIndicator, Description, Alpine.Description | Status / status, description, description_binding |
| Defaults | Page, App / theme.Config, scoped data-ui-* root | page and scoped data-ui-* root |
| System reset | GoHTMXUI.ui.setAppearance(root, {mode: "system"}) | Shared appearance API/root default |

Reference runtime: [Rust v0.3.0](https://github.com/marcuoli/rust-htmx-ui/releases/tag/v0.3.0),
commit `7c8786cabd7727b24638912421559fdf8501b346`,
[PR #6](https://github.com/marcuoli/rust-htmx-ui/pull/6).
Policy baseline: `05fd7530f06b81298959004924e0f9a7249054a3`,
[PR #8](https://github.com/marcuoli/rust-htmx-ui/pull/8).

Go's appearance/status port is `0.13.0+20261108.35`,
[PR #35](https://github.com/marcuoli/go-htmx-ui/pull/35), with delivery tracked in
[#34](https://github.com/marcuoli/go-htmx-ui/issues/34). That issue records final
merge/tag/module/source-byte verification and publication state; do not infer
publication from the source version alone. The issue and immutable full tag
identify the exact final tested merge commit. The pre-port resource baseline is
Go `0.12.0+20261108.33`, commit `f2d7f827ad3cfc0dcbdb5d5f682c2af06c7ba697`.
Rust's header geometry correction is published in
[v0.3.1](https://github.com/marcuoli/rust-htmx-ui/releases/tag/v0.3.1), commit
`18fca443d34328b0d05850bd4c1cf52a8520651b`, tracked in
[Rust #9](https://github.com/marcuoli/rust-htmx-ui/issues/9). Its owner records
60 width/density/palette/appearance browser cases; Go records its own checks.

Go qualification: Go 1.27.3 windows/amd64, CGO disabled, all Go tests/vet/module
verification and 130 JavaScript tests; clean source/binary advisory scans and
full npm audit; reproducible assets; independent source review. Real Edge checks
cover HTMX 2.0.11 and 4.0.1, Enter/Space/SVG activation, OS/System/explicit modes,
cross-tab and blocked storage, nested/repeated/inserted roots and controls,
Alpine full-state descriptions and caller precedence, named-group accessibility,
plain/boxed styling and keyboard focus. All 48 width/density/palette/mode cases
(360, 480, 768 and 1280px) preserve header rows and 20px glyphs; status tones,
pulse-off, reduced motion and server-only System defaults pass. No browser
external requests, page errors or failed assets occurred in that matrix.
Linux regeneration/native compiler/Go checks run in the release's hosted CI;
the issue links their actual results. Other browsers/platforms are not qualified
by these checks. Rust's plain/boxed counterpart is independently qualified in
[v0.4.0](https://github.com/marcuoli/rust-htmx-ui/releases/tag/v0.4.0), commit
`e6345bedd4fc3f40059edc44a83e4165f94eb9c5`. Its owner records native/browser
checks for both styles and 60 geometry combinations. This release includes the
v0.3.1 header correction and is the current pattern baseline.

This contract establishes the appearance/status/default pattern, not complete
historical API parity. Rust's existing Go numeric compact/unit formatting gap
and broader API inventory remain counterpart-owner work under
[Rust #7](https://github.com/marcuoli/rust-htmx-ui/issues/7).
Storage namespaces differ (`go-htmx-ui:appearance` / `rust-htmx-ui:appearance`)
to avoid accidental cross-application settings. Apps can select an explicit
shared key deliberately. HTMX morph/history/SSE and deployment platforms beyond
the recorded browser/native checks require consumer qualification.

## Required change and release record

For every shared feature, pattern or default change:

1. Compare the counterpart's current public API, implementation and exact release.
   Record intended semantics, defaults, affected consumer behavior and counterpart
   issue/PR. Keep pending work explicit.
2. Implement equivalent behavior in each owner's normal workflow. Explain
   compatibility/platform differences in both documents, including their reason,
   tested scope and next action. A pending difference must have an owner issue.
3. Verify observable behavior in both libraries: keyboard/focus and accessible
   names, persistence/OS/storage changes, nested roots, inserted SPA controls,
   palettes/densities, header geometry, status tones/pulse and reduced motion.
   Include narrow screens and failed/unavailable storage where relevant. Native
   checks alone do not establish browser parity.
4. Update both docs/ui-parity.md files and user-facing component guidance. Record
   exact tested commits/releases, required checks and unresolved gaps. Keep private
   consumer data and first-party domain code out of public docs.
5. Qualify and publish each library independently when a release is needed.
   Preserve immutable tags/assets and upstream-only dependency rules. Consumers
   adopt qualified releases through their own workflow. Distinguish requested,
   implemented, tested, merged and published work.

Documentation-only policy changes need no otherwise unchanged runtime release.
Existing releases retain their original contents and qualification.
