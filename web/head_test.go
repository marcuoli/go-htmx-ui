package web

import (
	"html"
	"net/http/httptest"
	"net/url"
	"regexp"
	"strings"
	"testing"

	"github.com/marcuoli/go-htmx-ui/internal/testutil"
)

func TestHeadEscapesLocalAssetPathsAndMatchesHandler(t *testing.T) {
	for _, prefix := range []string{`\example.com/ui`, "/\t/example.com/ui", "/\n/example.com/ui", "/ui?query#fragment", "/space and café/100%"} {
		t.Run(prefix, func(t *testing.T) {
			for _, generation := range []HTMXVersion{HTMX2, HTMX4} {
				body := testutil.Render(t, Head(HeadProps{AssetPrefix: prefix, Interactive: true, Charts: true, Frontend: true, HTMX: generation}), "")
				matches := regexp.MustCompile(`(?:href|src)="([^"]+)"`).FindAllStringSubmatch(body, -1)
				if len(matches) < 8 {
					t.Fatal("missing shared asset URLs", body)
				}
				for _, match := range matches {
					address := html.UnescapeString(match[1])
					u, err := url.Parse(address)
					if err != nil || u.IsAbs() || u.Host != "" || u.RawQuery != "" || u.Fragment != "" || strings.ContainsAny(address, "\\\t\n\r") || !strings.HasPrefix(address, "/") || strings.HasPrefix(address, "//") {
						t.Fatalf("asset URL is not an escaped local path: %q (%v)", address, err)
					}
					response := httptest.NewRecorder()
					AssetHandler(prefix).ServeHTTP(response, httptest.NewRequest("GET", address, nil))
					if response.Code != 200 || response.Body.Len() == 0 {
						t.Fatalf("asset %q returned %d", address, response.Code)
					}
				}
			}
		})
	}
}

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
			body := testutil.Render(t, Head(HeadProps{AssetPrefix: tc.prefix}), "")
			if !strings.Contains(body, `href="`+tc.want+`ui.css"`) || strings.Contains(body, "<script") {
				t.Fatalf("expected stylesheet only at normalized prefix: %s", body)
			}
		})
	}
}

func TestHeadChartDependencyOrderAndNonce(t *testing.T) {
	t.Parallel()
	body := testutil.Render(t, Head(HeadProps{AssetPrefix: "/ui/shared/", Charts: true, Nonce: `nonce"<&`}), "")
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

func TestInteractiveHeadIncludesFeedbackAndNonce(t *testing.T) {
	body := testutil.Render(t, Head(HeadProps{Interactive: true, Nonce: "test-nonce"}), "")
	for _, asset := range []string{"ui-runtime.js", "ui-feedback.js"} {
		if !strings.Contains(body, "/assets/ui/"+asset) {
			t.Fatal(body)
		}
		response := httptest.NewRecorder()
		AssetHandler("").ServeHTTP(response, httptest.NewRequest("GET", "/assets/ui/"+asset, nil))
		if response.Code != 200 {
			t.Fatalf("asset %s returned %d", asset, response.Code)
		}
	}
	if strings.Count(body, `nonce="test-nonce"`) != 2 {
		t.Fatal(body)
	}
}
