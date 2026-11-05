package ui

import "github.com/a-h/templ"

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

// StatusIndicatorProps configures a dot and visible text label. The zero tone
// and unrecognized tones render neutral; Pulse is opt-in for every tone.
// Attributes target the wrapper (for IDs, HTMX, live regions or data bindings);
// LabelAttributes target the text span (for example, Alpine's x-text).
// Attributes and classes must be server-defined, as with the other controls.
type StatusIndicatorProps struct {
	Label, Class    string
	LabelClass      string
	Tone            StatusTone
	Pulse           bool
	Attributes      templ.Attributes
	LabelAttributes templ.Attributes
}

func statusTone(tone StatusTone) StatusTone {
	switch tone {
	case StatusSuccess, StatusWarning, StatusDanger, StatusInfo:
		return tone
	default:
		return StatusNeutral
	}
}
