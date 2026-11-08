# Component and integration guide

All components are in package `ui`. Children are ordinary templ children slots. Text, attributes and chart JSON are escaped by templ. Presentation attributes must be server-defined; this is not a sanitizer for arbitrary attribute names, event handlers or untrusted CSS. Links use `templ.URL`. Applications own authentication, authorization, CSRF protection, URLs and domain state.

| Component | Configuration and children |
|---|---|
| Widget | WidgetProps: semantic Element (section/div/aside/nav), Class, Attributes; body slot |
| WidgetHeader | WidgetHeaderProps: Title, Description, Count, Class, TitleClass, DescriptionClass; actions slot |
| WidgetMetricStrip | WidgetMetricStripProps: Columns (1–8, default 8), Class, Attributes; compact responsive card children |
| WidgetMetricFrame | WidgetMetricProps: Label, Note, Heading; custom value/chart slot |
| WidgetMetric | label, value, note strings; compact display, exact tooltip and accessible label |
| WidgetMetricValue | display and exact strings; MetricText also formats strings independently |
| WidgetChart | WidgetChartProps: ID, native Option, EChartsConfig, Label, fallback messages, Compact |
| WidgetEmpty / WidgetData | empty-state children / disclosure label and children |
| PageHeader / Actions | PageHeaderProps: Title, Description, Class, Attributes; action slot / action children |
| Tabs / Tab | navigation label and children / TabProps: Label, Href, Active, Class, Attributes |
| Button / LinkButton | Type or Href, Kind (Primary/Secondary/Danger), Class, Attributes; label children |
| Field | FieldProps: For, Label, Hint, Class, Attributes; input slot |
| Input / Select | ID, Name, Value, Class, Required, Disabled, Attributes; Input adds Type/Placeholder, Select adds []Option |
| Dialog | DialogProps: ID, TitleID, Class, Attributes; native dialog body slot |
| DialogHeader / DialogBody | TitleID, Title, Description and actions slot / content slot |
| Modal / ModalTrigger / ModalClose | Complete native modal, sensible title/size/close defaults, optional footer and declarative buttons |
| Alert / Toast / ToastRegion | Four tones, inline or floating messages, dismissal, primed live regions and optional paused timers |
| Badge / VersionLabel | children / versioning.Info validated by go-versioning |
| StatusIndicator | StatusIndicatorProps: Label, Tone, Pulse, PulseStyle, Alpine, Class, LabelClass, Attributes, LabelAttributes; dot and text |
| AuthStatus | AuthStatusProps: State, SignedInLabel, SignedOutLabel, UnknownLabel, Class, LabelClass, Attributes; explicit lock/text presentation |
| Head / AssetHandler | HeadProps: AssetPrefix, Charts, Interactive, Frontend, HTMX, DisableAlpine, Nonce / shared assets at the app-selected local route |
| Page / App | Complete document/assets or scoped appearance; PageProps / AppProps |
| AppShell / ThemeSwitcher / AppearanceToggle | Optional shell / theme selector / reusable sun/moon appearance action |
| Stack / Grid | Shared vertical spacing / responsive columns |
| TextField / SelectField | Label, Hint, Error and typed Input/Select props; connected accessibility attributes |
| LoadingState / EmptyState | Default state labels, custom text/classes and optional empty-state actions |

Use unique IDs and associate Field.For with the control ID. Low-level Dialog needs a TitleID matching DialogHeader.TitleID and application-owned behavior. The new Modal convenience API supplies its labels and native open/close/focus behavior. Forms and modal shells do not submit, move or fetch content automatically. Tokens, capability checks and permissions stay in the application. See [modals, alerts and toasts](feedback.md) for complete defaults and examples.

See [compact metric strips](metrics.md) for dense dashboard rows, optional fields and keyed group shells.

## Appearance

Classes use the `ghtui-` prefix. Override these inherited CSS variables on a containing element:

| Token | Default |
|---|---|
| --ghtui-surface | #161b22 |
| --ghtui-text | #f0f6fc |
| --ghtui-muted | #8b949e |
| --ghtui-border | #30363d |
| --ghtui-raised | #21262d |
| --ghtui-accent | #79c0ff |
| --ghtui-primary | #0969da |
| --ghtui-danger | #b42335 |
| --ghtui-chart-height | 238px |

These are the legacy standalone fallbacks. New apps can use `Page`/`App` for
complete Standard/Ocean/Forest themes with paired Light/Dark variants, System
appearance, shared typography/density and optional shell/layout helpers. The
`/themes` showcase compares all six variants. See [themes and defaults](themes.md)
for minimal setup. Existing standalone components retain their appearance; Page
opts its document body into a margin reset, while App scopes defaults to its
subtree. Custom Class props and tokens remain available. Use the table library's
own application adapter for compact rows and pagination.

Shared rules are in `@layer components`, with Tailwind's standard layer order
declared so host `utilities` can override them even when `Head` loads shared CSS
first. Unlayered application rules also override layered component defaults.
Use `StatusIndicatorProps.LabelClass` for label-specific utility classes;
`Class` styles the wrapper. The solid status dot has no added margin.

## Page assets

Register `ui.AssetHandler("/ui/shared/")` at the same application-owned router
prefix, then render `@ui.Head(ui.HeadProps{AssetPrefix: "/ui/shared/", Charts: true, Frontend: true})`
once inside a full page's `<head>`. With no prefix both helpers use `/assets/ui/`;
leading/trailing slashes are normalized. Prefixes describe local URL paths.

With `Charts`, `Interactive` and `Frontend` all false, Head emits only the stylesheet.
`Interactive: true` adds the shared theme/navigation and feedback runtimes; Page enables it
automatically. `Charts: true` additionally
loads the external deferred engine, formatter and controller in dependency order.
An optional `Nonce` applies to those scripts; CSP headers, middleware and route
authorization remain application-owned. Do not render Head again in fragments
or also include the same scripts manually. No global mux, page architecture,
inline JavaScript or arbitrary existing HTML is changed by these helpers.

## Status indicator

```templ
@ui.StatusIndicator(ui.StatusIndicatorProps{
    Label: "Live updates", Description: "Live updates: connected",
    Tone: ui.StatusSuccess, Pulse: true,
    Attributes: templ.Attributes{"id": "connection-status", "role": "status"},
})
```

`StatusNeutral` (the default), `StatusSuccess`, `StatusWarning`, `StatusDanger`
and `StatusInfo` select the dot/ring color; label text defaults to the neutral
theme text color. `Description` supplies both the tooltip and accessible name;
include the visible label in it. Described indicators use a non-live named group;
an explicit caller role wins. For live updates keep `Label: "Live updates"`
stable as Description, tone and pulse change. `Pulse` explicitly enables a two-second
expanding ring; a solid dot and the visible label remain steady. Reduced-motion
preferences disable the ring. Only `ui.css` is needed; there is no JavaScript,
Alpine, HTMX or chart dependency for the indicator itself.

Applications own state, freshness and text. For a stale observation, render
`Label: "Live updates", Description: "Live updates: paused", Tone: ui.StatusNeutral, Pulse: false`. A failure can
stay solid or pulse as the application requires; tone never implies animation.
Unrecognized Go tone values fall back to neutral.

For live DOM updates, set the wrapper's `data-tone` to `neutral`, `success`,
`warning`, `danger` or `info`, set `data-pulse` to the string `"true"` or
`"false"`, and update `.ghtui-status-label` with `textContent`. Keep the wrapper
stable when using a live region. `Attributes` supports IDs, HTMX attributes,
`x-show` and `x-bind:data-tone`/`x-bind:data-pulse`; `LabelAttributes` can supply
`x-text`. For example, an Alpine consumer can use:

```templ
@ui.StatusIndicator(ui.StatusIndicatorProps{
    Label: "Connecting", Tone: ui.StatusNeutral,
    Attributes: templ.Attributes{
        "x-bind:data-tone": "connected ? 'success' : 'neutral'",
        "x-bind:data-pulse": "connected ? 'true' : 'false'",
    },
    LabelAttributes: templ.Attributes{"x-text": "statusText"},
})
```

The dot is decorative (`aria-hidden`); the label conveys the status without
relying on color or motion. Live announcements are opt-in through caller-owned
`role="status"` or `aria-live` attributes to avoid unsolicited announcements in
tables and repeated indicators. Supply a meaningful visible label.

Override inherited `--ghtui-success`, `--ghtui-warning`,
`--ghtui-status-danger` or `--ghtui-accent` for the semantic colors. The status
danger token is separate from the existing button background token.
`--ghtui-status-color` overrides dot/ring tones; `--ghtui-status-label-color` can give
the text its own color, and `--ghtui-status-dot-size` changes the solid dot's
diameter (default `10px`). Custom `Class` rules can change typography and spacing.

`PulseStyle: ui.StatusRing` (default) uses the two-second stroked ring.
`ui.StatusPing` uses a filled circle with a one-second
`cubic-bezier(0,0,.2,1)` animation, reaching scale 2 and opacity 0 at 75%/end.
Both styles retain reduced-motion support and require `Pulse: true` or a true
live pulse binding. `--ghtui-status-pulse-duration` and
`--ghtui-status-pulse-easing` customize timing on a containing element.

### Optional Alpine bindings

```templ
@ui.StatusIndicator(ui.StatusIndicatorProps{
    Label: "Starting", PulseStyle: ui.StatusPing,
    Alpine: &ui.StatusAlpineBindings{
        Show: "visible", Label: "statusText", LabelClass: "statusTextClass",
        Tone: "statusTone", Pulse: "active",
        Description: "'Live updates: ' + connectionState",
    },
})
```

These neutral fields are trusted developer expressions evaluated by the
shared Alpine runtime enabled through Head/Page. They bind visibility, text, text classes,
semantic tone and explicit pulse without a consumer rendering/binding adapter.
Empty fields add no binding. Explicit `Attributes`/`LabelAttributes` override
equivalent convenience directives, including shorthand (`:class`) and modifiers
(`x-show.important`), and static `LabelClass` is retained by Alpine's
dynamic class binding. Never put untrusted user text in an expression; pass it
as application state instead. Application state, health/freshness policy,
transport, CSP and announcement semantics remain application-owned.

The shared frontend option bundles and serves the pinned official Alpine/HTMX
runtimes. Use `HeadProps.Frontend` or the default `Page`; the component still
renders ordinary HTML when no runtime is enabled. HTMX 4's official compatibility
extension is selected and ordered by the shared loader. The `/alpine` showcase
uses these shared assets directly, with no app-owned framework routes or external
node_modules argument. See [shared frontend resources](frontend-assets.md) for
script ordering, CSP, custom CSS builds and consumer migration.
Qualified runtime combinations: Alpine 3.17.5 with HTMX 2.0.11, and Alpine
3.17.5 with HTMX 4.0.1 plus its official compatibility extension. Live innerHTML
fragment swaps initialized bindings and charts; repeated replacements disposed
old charts and initialized new ones under both versions. This does not qualify
every application's inheritance, morph/history, SSE or error-response behavior.
See [HTMX 4 adoption](htmx-4.md) before migrating a consuming app.

## Authentication status

```templ
@ui.AuthStatus(ui.AuthStatusProps{
    State: ui.AuthSignedIn,
    Attributes: templ.Attributes{"id": "sign-in-state", "role": "status"},
})
```

| Explicit state | Icon and default visible label |
|---|---|
| AuthSignedIn | Closed lock, Signed in |
| AuthSignedOut | Open lock, Signed out |
| AuthUnknown, zero or invalid value | Neutral question icon, Authentication unknown |

`SignedInLabel`, `SignedOutLabel` and `UnknownLabel` accept escaped localized
text; empty values use those defaults. For checking or unavailable observations,
an application can choose `UnknownLabel: "Checking sign-in"` or `"Sign-in unavailable"`.
These labels never determine state. A healthy endpoint is not proof of sign-in;
a failed check is not proof of sign-out. The component never reads credentials,
contacts a provider or performs authorization. Applications must map stale
authentication evidence to `AuthUnknown` when freshness expires.

The compact inline SVGs are decorative (`aria-hidden`, `focusable=false`);
visible text conveys the meaning without relying on a lock icon or color.
`Class`, `LabelClass` and inherited `--ghtui-auth-color`,
`--ghtui-auth-label-color`, `--ghtui-auth-icon-size` (default `14px`),
`--ghtui-auth-signed-in-color` and `--ghtui-auth-signed-out-color` provide styling
hooks. Shared CSS is required for state-fragment visibility, including static
SSR; there is no icon font, external image or authentication JavaScript bundle.

All state fragments remain in stable markup. An app can rerender with HTMX/SSE
or update only the wrapper's `data-auth-state` to `signed-in`, `signed-out` or
`unknown`; shared CSS switches the corresponding icon and label together.
Unrecognized live values also fall back to the neutral fragment. Changing a
previously signed-in observation to unknown hides its verified lock and label.
Root `Attributes` preserve IDs, dashboard keys, live-region settings and bindings
such as `x-bind:data-auth-state`. The application owns updates and announcement
policy; the component adds no implicit live region.

Compose transport/observation and authentication separately when needed:

```templ
@ui.Actions() {
    @ui.StatusIndicator(ui.StatusIndicatorProps{Label: "Updates current", Tone: ui.StatusSuccess, Pulse: true})
    @ui.AuthStatus(ui.AuthStatusProps{State: ui.AuthUnknown, UnknownLabel: "Checking sign-in"})
}
```

Shared component/API/style/asset changes belong in this module's designated
owning development session. Consuming apps should request changes there and
adopt released versions; keep domain state, routes and transport in the app
instead of maintaining divergent shared component copies. Private session
identifiers belong in application-owned coordination records, not public docs.

## Native charts and live updates (v0.6.0)

`WidgetChartProps` takes `Option` (a native ECharts object), `Config`
(`EChartsConfig` callback/lifecycle metadata), `ID`, `Label`, `EmptyMessage`,
`ErrorMessage`, `NoScriptNote` and `Compact`. There is no Spec field in this
breaking release. The component emits a stable div host and escaped native JSON
attributes, with an accessible fallback sibling. Encoding errors return from
component rendering; malformed DOM JSON fails to the visible error state.

Use [the native chart contract](charts.md) for Go/templ and JavaScript-only
examples. Use [the migration guide](migration-native-echarts.md) before changing
old host markup, scripts or live DOM patching. Keep accessible raw-input
information in `WidgetData`; ECharts graphics alone are not a data table.

## Reuse in another app

1. Import a released module and serve `Assets()` under the app-owned prefix.
2. Load ui.css; charts additionally load official echarts.min.js, then
   echarts-format.js and ui-htmx-charts.js once, in that order.
3. Compose widgets and controls with application-owned layout/data/permissions.
4. Use native ECharts options and explicit format bindings; preserve host nodes
   and engine-owned children during live patches. Call update/render or destroy.
5. Keep tables in go-htmx-table, and transport/history/business rules in the app.
