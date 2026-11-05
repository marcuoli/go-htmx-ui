// Package feedback provides inline alerts and scoped toast notifications.
package feedback

import (
	"github.com/a-h/templ"
	"strconv"
	"time"
)

type AlertTone string

const (
	AlertInfo    AlertTone = "info"
	AlertSuccess AlertTone = "success"
	AlertWarning AlertTone = "warning"
	AlertDanger  AlertTone = "danger"
)

type AlertProps struct {
	ID, Title, Message, Class, DismissLabel string
	Tone                                    AlertTone
	Dismissible                             bool
	Attributes                              templ.Attributes
}

// Nonpositive Duration keeps the toast until dismissal. Positive durations are
// clamped to 1 second..24 hours and pause during focus, hover or hidden pages.
type ToastProps struct {
	ID, Title, Message, Class, DismissLabel string
	Tone                                    AlertTone
	Duration                                time.Duration
	Attributes                              templ.Attributes
}
type ToastPosition string

const (
	ToastBottomRight ToastPosition = "bottom-right"
	ToastBottomLeft  ToastPosition = "bottom-left"
	ToastTopRight    ToastPosition = "top-right"
	ToastTopLeft     ToastPosition = "top-left"
)

type ToastRegionProps struct {
	ID, Label, Class string
	Position         ToastPosition
}

func tone(value AlertTone) AlertTone {
	switch value {
	case AlertSuccess, AlertWarning, AlertDanger:
		return value
	default:
		return AlertInfo
	}
}
func title(value string, t AlertTone) string {
	if value != "" {
		return value
	}
	switch tone(t) {
	case AlertSuccess:
		return "Success"
	case AlertWarning:
		return "Warning"
	case AlertDanger:
		return "Error"
	default:
		return "Information"
	}
}
func icon(t AlertTone) string {
	switch tone(t) {
	case AlertSuccess:
		return "✓"
	case AlertWarning, AlertDanger:
		return "!"
	default:
		return "i"
	}
}
func liveRole(t AlertTone) string {
	if t == AlertWarning || t == AlertDanger {
		return "alert"
	}
	return "status"
}
func dismissLabel(value string) string {
	if value != "" {
		return value
	}
	return "Dismiss notification"
}
func duration(value time.Duration) string {
	if value <= 0 {
		return "0"
	}
	return strconv.FormatInt(max(1000, min(value.Milliseconds(), 86400000)), 10)
}
func position(value ToastPosition) string {
	switch value {
	case ToastBottomLeft, ToastTopRight, ToastTopLeft:
		return string(value)
	default:
		return string(ToastBottomRight)
	}
}
func regionLabel(value string) string {
	if value != "" {
		return value
	}
	return "Notifications"
}
func attributes(caller templ.Attributes) templ.Attributes {
	attrs := templ.Attributes{}
	for k, v := range caller {
		attrs[k] = v
	}
	for _, k := range []string{"id", "class", "role", "aria-label", "data-ui-alert", "data-ui-toast", "data-ui-tone", "data-ui-duration"} {
		delete(attrs, k)
	}
	return attrs
}
