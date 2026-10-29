package ui

import (
	"bytes"
	"context"
	"html"
	"io"
	"regexp"
	"strings"
	"testing"

	"github.com/a-h/templ"
)

func renderWidgetContract(t *testing.T, component templ.Component, children string) string {
	t.Helper()
	ctx := context.Background()
	if children != "" {
		ctx = templ.WithChildren(ctx, templ.ComponentFunc(func(_ context.Context, w io.Writer) error {
			_, err := io.WriteString(w, children)
			return err
		}))
	}
	var body bytes.Buffer
	if err := component.Render(ctx, &body); err != nil {
		t.Fatal(err)
	}
	return body.String()
}

func TestWidgetRetainsSemanticElementLiveAttributesAndBody(t *testing.T) {
	for _, tc := range []struct {
		element WidgetElement
		tag     string
	}{{WidgetSection, "section"}, {WidgetDiv, "div"}, {WidgetAside, "aside"}, {WidgetNav, "nav"}, {WidgetElement(255), "section"}} {
		t.Run(tc.tag, func(t *testing.T) {
			body := renderWidgetContract(t, Widget(WidgetProps{
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
	body := renderWidgetContract(t, WidgetHeader(WidgetHeaderProps{
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
	body := renderWidgetContract(t, WidgetMetric("Input tokens", "682888", "Reported usage"), "")
	for _, want := range []string{`class="ghtui-metric-card"`, "682.89K", `title="682888"`, `aria-label="682888"`, "Reported usage"} {
		if !strings.Contains(body, want) {
			t.Errorf("metric missing %q: %s", want, body)
		}
	}
	custom := renderWidgetContract(t, WidgetMetricFrame(WidgetMetricProps{Label: "Outcomes", Heading: true}), `<canvas id="custom-chart"></canvas>`)
	if !strings.Contains(custom, `<h2 class="ghtui-metric-label">Outcomes</h2>`) || !strings.Contains(custom, `id="custom-chart"`) || strings.Contains(custom, `class="ghtui-metric-note"`) {
		t.Fatal("custom metric lost heading/body or added an empty note", custom)
	}
}

func TestWidgetChartKeepsLosslessEscapedSpecAndAccessibleFallbacks(t *testing.T) {
	spec := `{"type":"bar","labels":["\"><script>untrusted</script>"],"empty":false}`
	body := renderWidgetContract(t, WidgetChart(WidgetChartProps{
		ID: "stable-chart", Spec: spec, Label: `Usage "quoted"`, Compact: true,
		EmptyMessage: "No retained history.", NoScriptNote: "Open the data table.",
	}), "")
	match := regexp.MustCompile(`data-ui-chart="([^"]*)"`).FindStringSubmatch(body)
	if len(match) != 2 || html.UnescapeString(match[1]) != spec {
		t.Fatal("chart JSON did not survive attribute escaping", body)
	}
	for _, want := range []string{`id="stable-chart"`, `ghtui-chart-compact`, `role="img"`, `aria-label="Usage &#34;quoted&#34;"`, "No retained history.", "<noscript>", "Open the data table."} {
		if !strings.Contains(body, want) {
			t.Errorf("chart missing %q: %s", want, body)
		}
	}
	if strings.Count(body, "<canvas") != 1 || strings.Contains(body, "<script>") {
		t.Fatal("chart spec became executable markup", body)
	}
}
