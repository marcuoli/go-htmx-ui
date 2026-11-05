# Modals, alerts and toast notifications

Available since `0.10.0+20261105.20`. Pin the current full release tag:
`go get github.com/marcuoli/go-htmx-ui@v0.10.2+20261105.24`.
These components use the shared Light/Dark palettes and standalone color
fallbacks, with no new dependencies. `Page` supplies the
external feedback runtime and an empty toast region automatically. Register
`ui.AssetHandler("")` once at `/assets/ui/`, as in the themes guide.

## A complete modal

```templ
@ui.ModalTrigger(ui.ModalTriggerProps{Target: "details"}) { View details }
@ui.Modal(ui.ModalProps{ID: "details", Title: "Project details"}) {
    <p>Your content goes here.</p>
}
```

The default layout follows a desktop window: a title bar with text and a close
X, a scrollable content area and a footer. Header and footer remain visible when
content is long. The footer supplies a secondary Close button when no custom
`Footer` is provided; `CloseLabel` localizes both close controls. The description
appears at the top of the content area. This layout is the default starting in
`0.10.2+20261105.24`.
The content and footer can receive keyboard focus for scrolling. If custom
footer actions wrap beyond the available space, the footer scrolls within its
own bounded area so every action remains reachable.

The default size is `ModalMedium`; `ModalSmall` and `ModalLarge` are optional.
Title defaults to “Details”. `Description` connects to `aria-describedby`;
`Footer` accepts a component replacing the default Close action. `Class` and trusted
`Attributes` allow application integration. IDs must be unique; one modal may
omit its ID and use `ghtui-modal`. Internal IDs and labeling remain controlled
by props.

`ModalTriggerProps.Button` and `ModalCloseProps.Button` accept ordinary
`ButtonProps`, including styles, disabled/loading state and HTMX attributes.
The helpers always use `type="button"`. A close action can return a value:

```templ
@ui.ModalClose(ui.ModalCloseProps{
    Value: "cancel", Button: ui.ButtonProps{Kind: ui.Secondary},
}) { Cancel }
```

Modals use native `showModal()`: background content becomes inert, keyboard
focus stays in the active dialog, Escape closes it and focus returns to the
opener when it still exists. Nested modals return to their parent. The header
always includes a close button; `CloseLabel` localizes its accessible name.
Backdrop clicks close only when `CloseOnBackdrop: true`, and a drag starting
inside the dialog does not dismiss it.

Forms remain application-owned. A native `method="dialog"` form closes the
modal after browser validation; ordinary forms and HTMX requests keep their
usual behavior. Neither modal nor confirmation styling performs business
actions. The native `close` event and `dialog.returnValue` expose the result.

For application-driven controls, use the external runtime API:

```js
GoHTMXUI.feedback.openModal("details");
GoHTMXUI.feedback.closeModal("details", "cancel");
```

These return `false` for an unavailable/non-modal target. `openModal` records
the current focused element; its optional second argument supplies an opener.
Existing `Dialog`, `DialogHeader` and `DialogBody` remain unchanged as low-level
shells for applications with their own behavior.

## Inline messages

```templ
@ui.Alert(ui.AlertProps{
    Tone: ui.AlertSuccess, Title: "Saved", Message: "Your changes are ready.",
    Dismissible: true,
})
```

Tones are `AlertInfo` (default), `AlertSuccess`, `AlertWarning` and `AlertDanger`.
The default title describes the tone; supply `Title` and `DismissLabel` to
localize it. Messages and titles are escaped text. Children can contain links
or actions. Informational/success alerts use polite status semantics;
warning/danger use assertive alert semantics. Inline alerts persist, and show
a dismiss button only when requested.

## Toast notifications

With `Page`, a toast requires only this browser call:

```js
GoHTMXUI.feedback.toast({tone: "success", title: "Saved", message: "Changes saved."});
```

All browser text uses `textContent`; messages never become executable HTML.
The call returns its toast element; `GoHTMXUI.feedback.dismiss(element)` removes
it. Toasts do not take focus. Their close control restores focus to a remaining
control or the opener when appropriate. Dismissal emits bubbling
`gohtmxui:dismiss` before removal for application integrations.

Toasts persist until dismissed by default. Optional `duration` is milliseconds:

```js
GoHTMXUI.feedback.toast({message: "Report ready", duration: 8000});
```

Positive durations are clamped to 1 second–24 hours. Hover, keyboard focus and
hidden documents pause the remaining lifetime. Removed fragments release their
timers. Important messages should remain persistent or also exist in the page.
Messages inside a closed modal wait until it opens; closing it pauses the
remaining lifetime, and reopening resumes it.

Each `Modal` provides a region in the native top layer. Browser calls default
to the active modal's region, otherwise the page's region; closed modal regions
are excluded. For nested application scopes or explicit placement, pass a
connected `ToastRegion` element as the second argument.

Server-rendered toasts work with HTMX/SSE or ordinary templ children:

```templ
@ui.ToastRegion(ui.ToastRegionProps{ID: "notifications"}) {
    @ui.Toast(ui.ToastProps{Tone: ui.AlertSuccess, Message: "Report ready"})
}
```

`ToastProps.Duration` is a Go `time.Duration`; zero/negative persists.
Append server-rendered toasts into the region's `[data-ui-toast-items]` element.
The runtime announces new messages through primed polite/assertive live nodes;
visual toast groups do not add nested live roles. `ToastRegionProps.Label`
localizes “Notifications”. Position defaults to `ToastBottomRight`; alternatives
are `ToastBottomLeft`, `ToastTopRight` and `ToastTopLeft`.

Set `PageProps.DisableToasts: true` when placing your own page region. Standalone
layouts use `HeadProps.Interactive: true` and render `ToastRegion` explicitly.
Load shared scripts once in the full page head, with the existing optional CSP
nonce. No inline handlers, application routes or framework runtimes are added.

Without JavaScript, alert/toast content stays readable, timed messages persist,
and enhancement-dependent controls remain disabled. Native modals require the
runtime and browser `showModal` support. Applications provide an ordinary page
alternative for workflows that must be usable without JavaScript.

Open `/feedback` in the showcase for all tones, paired theme previews, native
forms, nested modals, large content and real HTMX2/4 fragments. Appearance,
dialogs and notification timers handle dynamic insertion without fragment-
specific script execution. Screen-reader announcement behavior still depends
on the browser/assistive-technology combination; browser checks do not establish
acceptance for every screen reader.
