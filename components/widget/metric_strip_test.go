package widget

import (
	"strconv"
	"strings"
	"testing"

	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/internal/testutil"
)

func TestMetricStripDefaultsAndClosedColumnRange(t *testing.T) {
	for _, columns := range []int{-1, 0, 9} {
		body := testutil.Render(t, WidgetMetricStrip(WidgetMetricStripProps{Columns: columns}), `<div class="ghtui-metric-group" data-key="primary"><article data-key="tokens">Kept</article></div>`)
		for _, want := range []string{`class="ghtui-metric-strip"`, `data-ui-metric-columns="8"`, `class="ghtui-metric-group"`, `data-key="primary"`, `data-key="tokens"`, "Kept"} {
			if !strings.Contains(body, want) {
				t.Fatalf("columns %d lost %q: %s", columns, want, body)
			}
		}
	}
	for columns := 1; columns <= 8; columns++ {
		body := testutil.Render(t, WidgetMetricStrip(WidgetMetricStripProps{Columns: columns}), "")
		if !strings.Contains(body, `data-ui-metric-columns="`+strconv.Itoa(columns)+`"`) {
			t.Fatalf("columns %d missing from rendered strip: %s", columns, body)
		}
	}
}

func TestMetricStripKeepsLiveAttributesAndOwnsLayoutMarkers(t *testing.T) {
	attrs := templ.Attributes{"id": "usage", "data-dashboard-key": "usage-root", "hidden": true, "CLASS": "replace", "DATA-UI-METRIC-COLUMNS": "99"}
	body := testutil.Render(t, WidgetMetricStrip(WidgetMetricStripProps{Columns: 6, Class: "app-strip", Attributes: attrs}), "")
	for _, want := range []string{`class="ghtui-metric-strip app-strip"`, `data-ui-metric-columns="6"`, `id="usage"`, `data-dashboard-key="usage-root"`, "hidden"} {
		if !strings.Contains(body, want) {
			t.Fatal(body)
		}
	}
	if strings.Count(body, "class=") != 1 || strings.Count(body, "data-ui-metric-columns=") != 1 || len(attrs) != 5 {
		t.Fatal("layout attributes duplicated or caller map mutated", body)
	}
}

func TestMetricStripValuesKeepExactNumericAndDurationText(t *testing.T) {
	for _, tc := range []struct{ value, exact, visible string }{
		{"18446744073709551615", "18,446,744,073,709,551,615 tokens", "18.45E"},
		{"11h 47m 27s", "11 hours 47 minutes 27 seconds", "11h 47m 27s"},
	} {
		body := testutil.Render(t, WidgetMetricValue(tc.value, tc.exact), "")
		for _, want := range []string{tc.visible, `title="` + tc.exact + `"`, `aria-label="` + tc.exact + `"`} {
			if !strings.Contains(body, want) {
				t.Fatal(body)
			}
		}
	}
}
