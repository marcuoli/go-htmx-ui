package ui

import (
	"github.com/a-h/templ"
	versioning "github.com/marcuoli/go-versioning"
)

// Presentation props accept server-defined attributes for HTMX and other callers.
// Permissions, CSRF fields and event handlers remain the application's responsibility.
type PageHeaderProps struct {
	Title, Description, Class string
	Attributes                templ.Attributes
}
type TabProps struct {
	Label, Href, Class string
	Active             bool
	Attributes         templ.Attributes
}
type ButtonKind string

const (
	Primary   ButtonKind = "primary"
	Secondary ButtonKind = "secondary"
	Danger    ButtonKind = "danger"
)

type ButtonProps struct {
	Type, Class string
	Kind        ButtonKind
	Disabled    bool
	Attributes  templ.Attributes
}
type LinkButtonProps struct {
	Href, Class string
	Kind        ButtonKind
	Attributes  templ.Attributes
}
type FieldProps struct {
	For, Label, Hint, Class string
	Attributes              templ.Attributes
}
type InputProps struct {
	ID, Name, Value, Type, Placeholder, Class string
	Required, Disabled                        bool
	Attributes                                templ.Attributes
}
type Option struct {
	Value, Label string
	Disabled     bool
}
type SelectProps struct {
	ID, Name, Value, Class string
	Options                []Option
	Required, Disabled     bool
	Attributes             templ.Attributes
}
type DialogProps struct {
	ID, TitleID, Class string
	Attributes         templ.Attributes
}
type DialogHeaderProps struct{ TitleID, Title, Description string }

func buttonClass(kind ButtonKind) string {
	switch kind {
	case Secondary:
		return "ghtui-button-secondary"
	case Danger:
		return "ghtui-button-danger"
	default:
		return "ghtui-button-primary"
	}
}
func inputType(value string) string {
	if value == "" {
		return "text"
	}
	return value
}
func buttonType(value string) string {
	if value == "" {
		return "button"
	}
	return value
}
func versionText(info versioning.Info) string {
	// Resolve validates injected metadata without probing the rendering process's
	// working directory or accidentally displaying this dependency's module version.
	valid, err := versioning.Resolve(info, versioning.Info{})
	if err != nil {
		return versioning.UnknownVersion
	}
	return valid.Version
}

func currentAttributes(active bool) templ.Attributes {
	if active {
		return templ.Attributes{"aria-current": "page"}
	}
	return nil
}
