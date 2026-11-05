package widget

import (
	"bytes"
	"context"
	"encoding/json"
	"html"
	"reflect"
	"regexp"
	"strings"
	"testing"

	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/chart"
	"github.com/marcuoli/go-htmx-ui/internal/testutil"
)

func TestWidgetRetainsSemanticElementLiveAttributesAndBody(t *testing.T) {
	for _, tc := range []struct {
		element WidgetElement
		tag     string
	}{{WidgetSection, "section"}, {WidgetDiv, "div"}, {WidgetAside, "aside"}, {WidgetNav, "nav"}, {WidgetElement(255), "section"}} {
		t.Run(tc.tag, func(t *testing.T) {
			body := testutil.Render(t, Widget(WidgetProps{
				Element: tc.element, Class: "dashboard-chart-panel",
				Attributes: templ.Attributes{"id": "live-widget", "data-dashboard-key": "stable-request", "aria-label": `Caller "quoted"`},
			}), `<span id="body-slot">Retained content</span>`)
			for _, want := range []string{"<" + tc.tag, "</" + tc.tag + ">", `class="ghtui-widget dashboard-chart-panel"`, `id="live-widget"`, `data-dashboard-key="stable-request"`, `aria-label="Caller &#34;quoted&#34;"`, `id="body-slot"`} {
				if !strings.Contains(body, want) {
					t.Errorf("widget lost semantic/body/live contract %q: %s", want, body)
				}
			}
		})
	}
}

func TestWidgetHeaderEscapesTextAndKeepsActionsAndExactCount(t *testing.T) {
	body := testutil.Render(t, WidgetHeader(WidgetHeaderProps{
		Title: `<script>caller</script>`, Description: `<img src=x>`, Count: "123456", Class: "px-4 pt-4",
	}), `<button type="button" id="header-action">Apply</button>`)
	for _, want := range []string{`class="ghtui-widget-heading px-4 pt-4"`, "&lt;script&gt;caller&lt;/script&gt;", "&lt;img src=x&gt;", `title="123456"`, "123.46K", `id="header-action"`} {
		if !strings.Contains(body, want) {
			t.Errorf("header missing %q: %s", want, body)
		}
	}
	if strings.Contains(body, "<script>") || strings.Contains(body, "<img ") {
		t.Fatal("header text became executable markup")
	}
}

func TestWidgetMetricSupportsExactLabelsAndCustomBody(t *testing.T) {
	body := testutil.Render(t, WidgetMetric("Input tokens", "682888", "Reported usage"), "")
	for _, want := range []string{`class="ghtui-metric-card"`, "682.89K", `title="682888"`, `aria-label="682888"`, "Reported usage"} {
		if !strings.Contains(body, want) {
			t.Errorf("metric missing %q: %s", want, body)
		}
	}
	custom := testutil.Render(t, WidgetMetricFrame(WidgetMetricProps{Label: "Outcomes", Heading: true}), `<canvas id="custom-chart"></canvas>`)
	if !strings.Contains(custom, `<h2 class="ghtui-metric-label">Outcomes</h2>`) || !strings.Contains(custom, `id="custom-chart"`) || strings.Contains(custom, `class="ghtui-metric-note"`) {
		t.Fatal("custom metric lost heading/body or added an empty note", custom)
	}
}

func TestNativeChartEscapesOptionsAndConfig(t *testing.T) {
	option := chart.EChartsOption{"series": []any{map[string]any{"type": "pie", "data": []any{map[string]any{"name": `"><script>untrusted</script>`, "value": 0}}}}}
	body := testutil.Render(t, WidgetChart(WidgetChartProps{ID: "stable-chart", Option: option, Config: chart.EChartsConfig{Locale: "pt_BR", Messages: chart.EChartsMessages{Unavailable: "<missing>"}}, Label: `Usage "quoted"`, Compact: true, EmptyMessage: "No retained history.", NoScriptNote: "Open the data table."}), "")
	match := regexp.MustCompile(`data-ui-echarts="([^"]*)"`).FindStringSubmatch(body)
	var actual, want any
	if len(match) != 2 {
		t.Fatal(body)
	}
	if err := json.Unmarshal([]byte(html.UnescapeString(match[1])), &actual); err != nil {
		t.Fatal(err)
	}
	encoded, _ := json.Marshal(option)
	_ = json.Unmarshal(encoded, &want)
	if !reflect.DeepEqual(actual, want) {
		t.Fatal("Native options changed", body)
	}
	for _, value := range []string{`data-ui-echarts-config=`, `id="stable-chart"`, `ghtui-chart-compact`, `role="img"`, `aria-label="Usage &#34;quoted&#34;"`, "No retained history.", "<noscript>", "Open the data table."} {
		if !strings.Contains(body, value) {
			t.Errorf("Missing %q", value)
		}
	}
	if strings.Contains(body, "<script>") || strings.Contains(body, "data-ui-chart=") || strings.Contains(body, "<canvas") {
		t.Fatal("Unsafe or retired host", body)
	}
}
func TestNativeOptionsRejectLegacyAndExecutableValues(t *testing.T) {
	for _, value := range []any{nil, []int{1}, "not an object", chart.EChartsOption{"datasets": []int{1}}, chart.EChartsOption{"x": func() {}}} {
		var output bytes.Buffer
		if err := WidgetChart(WidgetChartProps{Option: value}).Render(context.Background(), &output); err == nil {
			t.Errorf("Widget accepted invalid option %T", value)
		}
	}
}
func TestChartLocalizedFallbackEscaping(t *testing.T) {
	body := testutil.Render(t, WidgetChart(WidgetChartProps{ID: "localized", Label: "Synthetic", Option: chart.EChartsOption{}, EmptyMessage: "Sem dados", ErrorMessage: "Erro <unsafe>"}), "")
	for _, want := range []string{`data-ui-error-message="Erro &lt;unsafe&gt;"`, `data-ui-empty-message="Sem dados"`, `role="img"`, `aria-label="Synthetic"`} {
		if !strings.Contains(body, want) {
			t.Errorf("Missing %q", want)
		}
	}
}
