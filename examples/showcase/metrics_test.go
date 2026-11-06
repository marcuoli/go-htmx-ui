package main

import (
	"net/http/httptest"
	"strings"
	"testing"

	versioning "github.com/marcuoli/go-versioning"
)

func TestMetricsShowcaseUsesPublicAPIAndStableGroups(t *testing.T) {
	response := httptest.NewRecorder()
	showcaseHandler(versioning.Info{}).ServeHTTP(response, httptest.NewRequest("GET", "/metrics", nil))
	if response.Code != 200 {
		t.Fatal(response.Code)
	}
	body := response.Body.String()
	for _, want := range []string{`data-ui-metric-columns="8"`, `data-dashboard-key="metric-primary"`, `data-dashboard-key="metric-extra"`, `data-dashboard-key="metric-duration"`, "11h 47m 27s", `aria-label="11 hours 47 minutes 27 seconds"`, `aria-label="18,446,744,073,709,551,615 cached input tokens"`, `id="metric-reference-chart"`} {
		if !strings.Contains(body, want) {
			t.Errorf("missing %q", want)
		}
	}
	if strings.Count(body, `class="ghtui-metric-card"`) != 8 {
		t.Fatal("expected eight ordinary metric cards")
	}
}
