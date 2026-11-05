# Changelog

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
