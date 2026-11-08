# Changelog

## Unreleased

- Replace the Appearance dropdown with a reusable, accessible plain sun/moon
  action, with an explicit boxed button option;
  preserve scoped System mode, persistence and legacy mode-select integration.
- Keep header actions aligned in both densities and appearance glyphs 20px square.
- Default status labels to neutral text and add full-state Description/Alpine
  bindings for stable Live updates labels. Pulse remains opt-in.
- Establish the bidirectional Go/Rust UI feature, pattern and defaults contract.

## 0.12.0+20261108.33

- Upgrade the existing table dependency to official 0.2.1+20261106.21.

- Centralize official HTMX2/4, Alpine, compatibility scripts and notices in shared
  assets. Head opts in; complete Page loads frontend defaults, with HTMX-only and
  static options, deferred/nonce-aware ordering and explicit HTMX4 selection.
- Add the shared CSS build command with a pinned, checksum-verified official
  standalone Tailwind compiler. Apps keep custom input/scan sources and remove
  framework copies, CDN tags, downloads and Tailwind npm maintenance.
- Make showcase interactions work with embedded assets alone and document the
  browser/build ownership and consumer migration contract.

## 0.11.0+20261106.31

- Add opt-in WidgetMetricStrip for compact responsive dashboard cards, including
  up to eight desktop columns, generic keyed group shells, hidden optional fields,
  theme inheritance and exact accessible values. Keep existing metric defaults.
- Add a synthetic /metrics showcase and integration guide.

## 0.10.5+20261106.29

- Adopt official go-versioning `0.3.1+20261106.13` and its canonical-main ownership,
  validation and relocation contract. Review ignores for both operational files;
  keep this source-only module N/A for live counters without creating unused state.

## 0.10.4+20261106.28

- Correct future `VERSION` placement to permanent canonical main and hold counter
  writers until official support preserves the journal and reservation contract.
  Keep this source-only library non-allocating and preserve published releases.

## 0.10.3+20261105.26

- Adopt official go-versioning `0.3.0+20261105.9`, pin its CLI tool and use shared
  read-only build metadata in the showcase. Document the source-only library's
  non-allocating validation boundary and future external VERSION authority setup.

## 0.10.2+20261105.24

- Add opt-in `TooltipOutside` / `tooltipOutside` for complete tooltips on short
  charts. Keep native HTML disabled; use a themed text-only popup with viewport
  bounds, scrolling, dialog support and shared lifecycle cleanup.

## 0.10.1+20261105.22

- Make the default Modal a desktop window with title/X header, an independently
  scrolling content area and a persistent footer. Supply a Close footer action
  by default, while preserving custom footer components and theme inheritance.

## 0.10.0+20261105.20

- Add ready-to-use native Modal with trigger/close helpers, title/body/footer,
  size variants, native focus handling and optional backdrop dismissal.
- Add themed inline alerts and server/browser toast notifications with four
  tones, accessible live regions, dismissal and optional paused timers.
- Supply feedback assets and a default ToastRegion through Page; add a complete
  guide and /feedback showcase while preserving low-level Dialog APIs.

## 0.9.0+20261105.18

- Add scoped Standard, Ocean and Forest themes, each with complete Light/Dark
  palettes, System appearance, shared density and validated primary colors.
- Add Page/App setup, an optional responsive AppShell, persistent ThemeSwitcher,
  Stack/Grid layout helpers and a paired-theme gallery without application CSS.
- Add loading/empty states and accessible TextField/SelectField conveniences;
  keep existing root imports, asset URLs and standalone styling fallbacks.
- Coordinate chart palettes and UI initialization with HTMX4 settling so repeated
  fragment replacements retain preferences and valid chart registration.

## 0.8.0+20261105.16

- Group Go implementations into control, widget, status, auth, chart, metric and
  web packages, with tests beside their sources. Preserve the root `ui` API
  through aliases and forwarding functions, and keep existing asset URLs.
- Allocate the full `CORE+YYYYMMDD.PR` release identity with go-versioning's
  official CLI, replacing the bare-core planner. Pin the full tag for Go
  installation; Go records its resolved pseudo-version internally.

## v0.7.0

- Add StatusIndicator with semantic tones, visible labels, optional pulsing ring,
  live binding attributes, styling hooks and reduced-motion support.
- Add neutral optional Alpine bindings and a reusable filled-ping style with
  timing tokens; demonstrate direct usage and HTMX fragments in a standalone
  consumer example without bundling framework runtimes.
- Add AuthStatus with explicit signed-in, signed-out and unknown states,
  decorative lock/question icons, localized labels and stable live-state markup.
- Support HTMX 4 lifecycle names alongside HTMX 2, qualify both with Alpine and
  real chart swaps, and document the separate application migration boundary.
- Add Head and AssetHandler so pages share one asset-prefix contract without
  maintaining their own script filenames. Chart assets remain optional/external.
- Rename the first-party chart controller to ui-htmx-charts.js; serve the former
  echarts-ui.js filename as an alias without duplicating the script.
- Put shared CSS in the components cascade layer so downstream utilities and
  custom classes can override component defaults.
- Require templ v0.3.1100, pin its generator as a Go tool, adopt released
  go-htmx-table v0.2.0, and refresh Tailwind to 4.3.4 and compatible dependencies.
- Keep the official ECharts 6.1.0 engine unchanged. Retain upstream's compatible
  parse revision until templ implements the newer Parser.Match interface.
- Use go-versioning's core policy in a read-only module-release planner and
  validate the expected conventional release tag in CI.

Upgrade consuming applications' templ runtime and regenerate their templates
together. Prior releases remain immutable; the v0.6 native ECharts API and old
native controller URL remain supported. Application deployments are separate.
