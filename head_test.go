package ui

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHeadOptionalChartsAndPrefix(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name, prefix, want string
	}{
		{"default", "", "/assets/ui/"},
		{"application route", "/ui/shared/", "/ui/shared/"},
		{"normalized", "ui/shared", "/ui/shared/"},
		{"root", "/", "/"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			body := renderWidgetContract(t, Head(HeadProps{AssetPrefix: tc.prefix}), "")
			if !strings.Contains(body, `href="`+tc.want+`ui.css"`) || strings.Contains(body, "<script") {
				t.Fatalf("expected stylesheet only at normalized prefix: %s", body)
			}
		})
	}
}

func TestHeadChartDependencyOrderAndNonce(t *testing.T) {
	t.Parallel()
	body := renderWidgetContract(t, Head(HeadProps{AssetPrefix: "/ui/shared/", Charts: true, Nonce: `nonce"<&`}), "")
	position := -1
	for _, asset := range []string{"ui.css", "echarts.min.js", "echarts-format.js", "ui-htmx-charts.js"} {
		next := strings.Index(body, "/ui/shared/"+asset)
		if next <= position {
			t.Fatalf("missing or out-of-order asset %s: %s", asset, body)
		}
		position = next
	}
	if strings.Count(body, "<script") != 3 || strings.Count(body, `defer`) != 3 || strings.Count(body, `nonce="nonce&#34;&lt;&amp;"`) != 3 {
		t.Fatalf("scripts must be external, deferred and nonce-escaped: %s", body)
	}
	if strings.Contains(body, "echarts-ui.js") || strings.Contains(body, "<style") {
		t.Fatal("Head emitted a retired filename or inline style", body)
	}
}

func TestAssetHandlerMatchesHeadAndKeepsRouteOwnership(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct{ name, prefix, path string }{
		{"default", "", "/assets/ui/ui.css"},
		{"application route", "/ui/shared/", "/ui/shared/ui-htmx-charts.js"},
		{"normalized", "ui/shared", "/ui/shared/ui.css"},
		{"root", "/", "/ui.css"},
		{"previous filename", "/ui/shared/", "/ui/shared/echarts-ui.js"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			handler := AssetHandler(tc.prefix)
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, httptest.NewRequest("GET", tc.path, nil))
			if response.Code != 200 || response.Body.Len() == 0 {
				t.Fatalf("%s returned %d with %d bytes", tc.path, response.Code, response.Body.Len())
			}
		})
	}
	response := httptest.NewRecorder()
	AssetHandler("/ui/shared/").ServeHTTP(response, httptest.NewRequest("GET", "/elsewhere/ui.css", nil))
	if response.Code != 404 {
		t.Fatalf("handler served outside its configured prefix: %d", response.Code)
	}
}
