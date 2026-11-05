package control

import "github.com/a-h/templ"

type ModalSize string

const (
	ModalSmall  ModalSize = "small"
	ModalMedium ModalSize = "medium"
	ModalLarge  ModalSize = "large"
)

// Modal is the interactive convenience API; Dialog remains the low-level shell.
// Use distinct IDs for multiple modals. The runtime handles presentation only:
// applications still own submission, authorization and destructive actions.
type ModalProps struct {
	ID, Title, Description, Class, CloseLabel string
	Size                                      ModalSize
	CloseOnBackdrop                           bool
	Footer                                    templ.Component
	Attributes                                templ.Attributes
}
type ModalTriggerProps struct {
	Target string
	Button ButtonProps
}
type ModalCloseProps struct {
	Value  string
	Button ButtonProps
}

func normalizeModal(p ModalProps) ModalProps {
	p.ID = defaultText(p.ID, "ghtui-modal")
	p.Title = defaultText(p.Title, "Details")
	p.CloseLabel = defaultText(p.CloseLabel, "Close")
	switch p.Size {
	case ModalSmall, ModalLarge:
	default:
		p.Size = ModalMedium
	}
	return p
}
func modalDescription(p ModalProps) templ.Attributes {
	if p.Description != "" {
		return descriptionAttributes(p.ID + "-description")
	}
	return nil
}
func modalAttributes(p ModalProps) templ.Attributes {
	attrs := controlAttributes(p.Attributes)
	// IDs and semantic links have one source; trusted application HTMX/data
	// attributes remain available without producing duplicate native attributes.
	for _, name := range []string{"id", "class", "open", "aria-labelledby", "aria-describedby", "aria-label", "data-ui-modal", "data-ui-size", "data-ui-modal-backdrop"} {
		delete(attrs, name)
	}
	return attrs
}
func modalTriggerButton(p ModalTriggerProps) ButtonProps {
	b := p.Button
	b.Attributes = controlAttributes(b.Attributes)
	b.Attributes["data-ui-modal-open"] = defaultText(p.Target, "ghtui-modal")
	delete(b.Attributes, "data-ui-modal-enable")
	if !b.Disabled && !b.Loading {
		b.Attributes["data-ui-modal-enable"] = ""
	}
	// No-JS pages show a disabled trigger instead of a non-working action.
	b.Disabled = true
	b.Type = "button"
	return b
}
func modalCloseButton(p ModalCloseProps) ButtonProps {
	b := p.Button
	b.Type = "button"
	b.Attributes = controlAttributes(b.Attributes)
	b.Attributes["data-ui-modal-close"] = p.Value
	return b
}
