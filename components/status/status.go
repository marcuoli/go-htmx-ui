package status

import (
	"strings"

	"github.com/a-h/templ"
)

// StatusTone selects a status indicator's semantic color, independently of its
// label and animation. Applications decide which observations warrant each tone.
type StatusTone string

const (
	StatusNeutral StatusTone = "neutral"
	StatusSuccess StatusTone = "success"
	StatusWarning StatusTone = "warning"
	StatusDanger  StatusTone = "danger"
	StatusInfo    StatusTone = "info"
)

// StatusPulseStyle selects the decorative animation without deciding when it
// should run. StatusRing is the default; StatusPing expands a filled circle.
type StatusPulseStyle string

const (
	StatusRing StatusPulseStyle = "ring"
	StatusPing StatusPulseStyle = "ping"
)

// StatusAlpineBindings holds optional, trusted developer-written expressions.
// The shared frontend loads Alpine; the application owns referenced state.
// Empty expressions add no binding. Pulse is converted to a true/false data
// attribute; LabelClass augments the label's static classes using Alpine rules.
type StatusAlpineBindings struct {
	Show, Label, LabelClass, Tone, Pulse string
	Description                          string
}

// StatusIndicatorProps configures a dot and visible text label. The zero tone
// and unrecognized tones render neutral; Pulse is opt-in for every tone.
// Attributes target the wrapper (for IDs, HTMX, live regions or data bindings);
// LabelAttributes target the text span (for example, Alpine's x-text).
// Attributes and classes must be server-defined, as with the other controls.
type StatusIndicatorProps struct {
	Label, Class string
	// Description supplies the full tooltip and accessible name. Include Label
	// when presenting a stable label such as "Live updates" with changing state.
	Description     string
	LabelClass      string
	Tone            StatusTone
	Pulse           bool
	PulseStyle      StatusPulseStyle
	Alpine          *StatusAlpineBindings
	Attributes      templ.Attributes
	LabelAttributes templ.Attributes
}

func statusPulseStyle(style StatusPulseStyle) StatusPulseStyle {
	if style == StatusPing {
		return StatusPing
	}
	return StatusRing
}

// Explicit attributes take precedence over convenience bindings, preserving
// the existing attributes API. Never mutate the caller's maps while rendering.
func statusAttributes(props StatusIndicatorProps, label bool) templ.Attributes {
	attributes := props.Attributes
	if label {
		attributes = props.LabelAttributes
	}
	if props.Alpine == nil && (label || props.Description == "") {
		return attributes
	}
	result := templ.Attributes{}
	// Generic spans cannot have accessible names. A named non-live group exposes
	// the full description while live announcements remain caller-controlled.
	if !label && (props.Description != "" || props.Alpine != nil && props.Alpine.Description != "") {
		result["role"] = "group"
	}
	if !label && props.Description != "" {
		result["title"] = props.Description
		result["aria-label"] = props.Description
	}
	if bindings := props.Alpine; bindings != nil {
		if label {
			if bindings.Label != "" {
				result["x-text"] = bindings.Label
			}
			if bindings.LabelClass != "" {
				result["x-bind:class"] = bindings.LabelClass
			}
		} else {
			if bindings.Description != "" {
				result["x-bind:title"] = bindings.Description
				result["x-bind:aria-label"] = bindings.Description
			}
			if bindings.Show != "" {
				result["x-show"] = bindings.Show
			}
			if bindings.Tone != "" {
				result["x-bind:data-tone"] = bindings.Tone
			}
			if bindings.Pulse != "" {
				result["x-bind:data-pulse"] = "(" + bindings.Pulse + ") ? 'true' : 'false'"
			}
		}
	}
	for name := range attributes {
		// Alpine treats shorthand and modified directives as the same base
		// binding. Suppress convenience observers for all those spellings,
		// including x-show.important, so they cannot overwrite caller state.
		binding := name
		if strings.HasPrefix(binding, ":") {
			binding = "x-bind" + binding
		}
		if strings.HasPrefix(binding, "x-") {
			binding, _, _ = strings.Cut(binding, ".")
			delete(result, binding)
		}
		if name == "title" || name == "aria-label" {
			delete(result, "x-bind:"+name)
		}
	}
	// Copy after suppression so map iteration cannot remove an explicit binding
	// when the caller supplies both its static fallback and dynamic expression.
	for name, value := range attributes {
		result[name] = value
	}
	return result
}

func statusTone(tone StatusTone) StatusTone {
	switch tone {
	case StatusSuccess, StatusWarning, StatusDanger, StatusInfo:
		return tone
	default:
		return StatusNeutral
	}
}
