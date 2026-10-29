package ui

import "github.com/a-h/templ"

// WidgetElement preserves the semantic containers used by existing pages.
// A closed set prevents callers from constructing arbitrary HTML tag names.
type WidgetElement uint8

const (
	WidgetSection WidgetElement = iota
	WidgetDiv
	WidgetAside
	WidgetNav
)

// WidgetProps contains presentation and trusted, server-defined attributes.
// Feature views retain responsibility for permission checks, links and data.
type WidgetProps struct {
	Element    WidgetElement
	Class      string
	Attributes templ.Attributes
}

type WidgetHeaderProps struct {
	Title, Description, Count           string
	Class, TitleClass, DescriptionClass string
}

type WidgetMetricProps struct {
	Label, Note string
	Heading     bool
}

// Spec is the feature's serialized chart configuration. It stays in an escaped
// attribute so the shared live renderer can reuse the existing canvas by ID.
type WidgetChartProps struct {
	ID, Spec, Label            string
	EmptyMessage, NoScriptNote string
	Compact                    bool
}

func widgetClassAttributes(class string) templ.Attributes {
	if class == "" {
		return nil
	}
	return templ.Attributes{"class": class}
}

func widgetExactLabel(value, exact string) string {
	if exact != "" {
		return exact
	}
	return value
}

func widgetChartEmpty(message string) string {
	if message != "" {
		return message
	}
	return "No reported data in this period."
}
