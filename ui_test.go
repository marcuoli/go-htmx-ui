package ui_test

import (
	"bytes"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/a-h/templ"
	ui "github.com/marcuoli/go-htmx-ui"
	"github.com/marcuoli/go-htmx-ui/chart"
	"github.com/marcuoli/go-htmx-ui/components/auth"
	"github.com/marcuoli/go-htmx-ui/components/control"
	"github.com/marcuoli/go-htmx-ui/components/status"
	"github.com/marcuoli/go-htmx-ui/components/widget"
	"github.com/marcuoli/go-htmx-ui/internal/testutil"
	"github.com/marcuoli/go-htmx-ui/metric"
	"github.com/marcuoli/go-htmx-ui/web"
	versioning "github.com/marcuoli/go-versioning"
)

// Check every existing function signature against the new defining packages.
// These assignments also ensure the aliases work across both import styles.
var (
	_ func(control.PageHeaderProps) templ.Component       = ui.PageHeader
	_ func() templ.Component                              = ui.Actions
	_ func(string) templ.Component                        = ui.Tabs
	_ func(control.TabProps) templ.Component              = ui.Tab
	_ func(control.ButtonProps) templ.Component           = ui.Button
	_ func(control.LinkButtonProps) templ.Component       = ui.LinkButton
	_ func(control.FieldProps) templ.Component            = ui.Field
	_ func(control.InputProps) templ.Component            = ui.Input
	_ func(control.SelectProps) templ.Component           = ui.Select
	_ func(control.DialogProps) templ.Component           = ui.Dialog
	_ func(control.DialogHeaderProps) templ.Component     = ui.DialogHeader
	_ func() templ.Component                              = ui.DialogBody
	_ func() templ.Component                              = ui.Badge
	_ func(versioning.Info) templ.Component               = ui.VersionLabel
	_ func(widget.WidgetProps) templ.Component            = ui.Widget
	_ func(widget.WidgetHeaderProps) templ.Component      = ui.WidgetHeader
	_ func(widget.WidgetMetricStripProps) templ.Component = ui.WidgetMetricStrip
	_ func(widget.WidgetMetricProps) templ.Component      = ui.WidgetMetricFrame
	_ func(string, string, string) templ.Component        = ui.WidgetMetric
	_ func(string, string) templ.Component                = ui.WidgetMetricValue
	_ func(widget.WidgetChartProps) templ.Component       = ui.WidgetChart
	_ func() templ.Component                              = ui.WidgetEmpty
	_ func(string) templ.Component                        = ui.WidgetData
	_ func(status.StatusIndicatorProps) templ.Component   = ui.StatusIndicator
	_ func(auth.AuthStatusProps) templ.Component          = ui.AuthStatus
	_ func(web.HeadProps) templ.Component                 = ui.Head
	_ func(any) (string, error)                           = ui.MarshalEChartsOption
	_ func(string) string                                 = ui.MetricText
	_ func() fs.FS                                        = ui.Assets
	_ func(string) http.Handler                           = ui.AssetHandler
)

func TestRootFacadePreservesRenderingAndChildren(t *testing.T) {
	for _, tc := range []struct {
		name         string
		root, direct templ.Component
	}{
		{"control", ui.Button(ui.ButtonProps{Kind: ui.Secondary}), control.Button(control.ButtonProps{Kind: control.Secondary})},
		{"metric-strip", ui.WidgetMetricStrip(ui.WidgetMetricStripProps{Columns: 6}), widget.WidgetMetricStrip(widget.WidgetMetricStripProps{Columns: 6})},
		{"widget", ui.Widget(ui.WidgetProps{Element: ui.WidgetAside}), widget.Widget(widget.WidgetProps{Element: widget.WidgetAside})},
		{"status", ui.StatusIndicator(ui.StatusIndicatorProps{Label: "Connected", Tone: ui.StatusSuccess, Pulse: true}), status.StatusIndicator(status.StatusIndicatorProps{Label: "Connected", Tone: status.StatusSuccess, Pulse: true})},
		{"auth", ui.AuthStatus(ui.AuthStatusProps{State: ui.AuthSignedIn}), auth.AuthStatus(auth.AuthStatusProps{State: auth.AuthSignedIn})},
		{"chart", ui.WidgetChart(ui.WidgetChartProps{ID: "chart", Option: ui.EChartsOption{}, Config: ui.EChartsConfig{Locale: "pt_BR"}}), widget.WidgetChart(widget.WidgetChartProps{ID: "chart", Option: chart.EChartsOption{}, Config: chart.EChartsConfig{Locale: "pt_BR"}})},
		{"head", ui.Head(ui.HeadProps{Charts: true}), web.Head(web.HeadProps{Charts: true})},
	} {
		t.Run(tc.name, func(t *testing.T) {
			const children = `<span id="child">Child content</span>`
			got := testutil.Render(t, tc.root, children)
			want := testutil.Render(t, tc.direct, children)
			if got != want {
				t.Fatalf("root facade changed rendering:\n%s\nwant:\n%s", got, want)
			}
		})
	}
	if got, want := ui.MetricText("123456"), metric.MetricText("123456"); got != want {
		t.Fatalf("root metric = %q, want %q", got, want)
	}
	got, err := ui.MarshalEChartsOption(ui.EChartsOption{"series": []any{}})
	want, directErr := chart.MarshalEChartsOption(chart.EChartsOption{"series": []any{}})
	if err != nil || directErr != nil || got != want {
		t.Fatalf("root chart serialization changed: %q, %v; want %q, %v", got, err, want, directErr)
	}
}

func TestRootFacadePreservesAssetURLs(t *testing.T) {
	for _, name := range []string{"ui.css", "echarts.min.js", "echarts-format.js", "ui-htmx-charts.js", "echarts-ui.js"} {
		want, err := fs.ReadFile(web.Assets(), name)
		if err != nil {
			t.Fatal(err)
		}
		got, err := fs.ReadFile(ui.Assets(), name)
		if err != nil || !bytes.Equal(got, want) {
			t.Fatalf("root asset %s changed: %v", name, err)
		}
		response := httptest.NewRecorder()
		ui.AssetHandler("/shared/").ServeHTTP(response, httptest.NewRequest("GET", "/shared/"+name, nil))
		if response.Code != http.StatusOK || !bytes.Equal(response.Body.Bytes(), want) {
			t.Fatalf("root handler changed %s: status %d", name, response.Code)
		}
	}
}
