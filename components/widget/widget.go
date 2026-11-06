package widget

import (
	"strconv"
	"strings"

	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/chart"
)

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

// WidgetMetricStripProps composes existing metric cards into a compact row.
// Columns is the visible card count (1–8); zero/invalid values default to eight.
// Attributes retain application-owned keys, IDs and hidden state. Class and the
// column marker are configured through props so they cannot be duplicated.
type WidgetMetricStripProps struct {
	Columns    int
	Class      string
	Attributes templ.Attributes
}

func metricStripColumns(props WidgetMetricStripProps) string {
	if props.Columns < 1 || props.Columns > 8 {
		return "8"
	}
	return strconv.Itoa(props.Columns)
}

func metricStripAttributes(props WidgetMetricStripProps) templ.Attributes {
	attrs := templ.Attributes{}
	for key, value := range props.Attributes {
		if !strings.EqualFold(key, "class") && !strings.EqualFold(key, "data-ui-metric-columns") {
			attrs[key] = value
		}
	}
	return attrs
}

// WidgetChartProps accepts native ECharts options and safe callback/lifecycle
// metadata. Option may be chart.EChartsOption, a JSON-marshallable struct or RawMessage.
// v0.6.0 intentionally replaces Spec; older pinned releases retain that API.
type WidgetChartProps struct {
	ID, Label                                string
	Option                                   any
	Config                                   chart.EChartsConfig
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
