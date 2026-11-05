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

// WidgetChartProps accepts native ECharts options and safe callback/lifecycle
// metadata. Option may be EChartsOption, a JSON-marshallable struct or RawMessage.
// v0.6.0 intentionally replaces Spec; older pinned releases retain that API.
type WidgetChartProps struct {
	ID, Label                                string
	Option                                   any
	Config                                   EChartsConfig
	EmptyMessage, ErrorMessage, NoScriptNote string
	Compact                                  bool
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
