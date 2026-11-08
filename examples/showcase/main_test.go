package main

import (
	ui "github.com/marcuoli/go-htmx-ui"
	versioning "github.com/marcuoli/go-versioning"
	"io/fs"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestShowcaseRoutes(t *testing.T) {
	handler := showcaseHandler(versioning.Info{})
	for _, path := range []string{"/", "/themes", "/feedback", "/metrics", "/alpine", "/alpine/fragment", "/assets/ui.css", "/assets/htmx.min.js", "/assets/htmx4.min.js", "/assets/htmx4-alpine-compat.min.js", "/assets/alpine.min.js", "/assets/frontend.provenance.json", "/assets/echarts.min.js", "/assets/echarts-format.js", "/assets/ui-htmx-charts.js", "/assets/echarts-ui.js"} {
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		if w.Code != 200 || strings.TrimSpace(w.Body.String()) == "" {
			t.Fatalf("%s: %d", path, w.Code)
		}
	}
}
func TestAlpineConsumerExampleAndFragment(t *testing.T) {
	handler := showcaseHandler(versioning.Info{})
	for _, path := range []string{"/alpine", "/alpine/fragment"} {
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, httptest.NewRequest("GET", path, nil))
		body := response.Body.String()
		for _, want := range []string{`data-pulse-style="ping"`, `x-show="shown"`, `x-text="text"`, `x-bind:class="textClass"`} {
			if !strings.Contains(body, want) {
				t.Errorf("%s missing %q", path, want)
			}
		}
		if path == "/alpine" {
			for _, want := range []string{`src="/assets/htmx.min.js"`, `src="/assets/alpine.min.js"`} {
				if !strings.Contains(body, want) {
					t.Fatal(body)
				}
			}
		}
		if strings.Contains(body, "example-runtime") || strings.Contains(body, "runtime-assets") {
			t.Fatal("Example still owns framework delivery", body)
		}
	}
}
func TestHTMX4ExampleUsesSharedOfficialAssets(t *testing.T) {
	handler := showcaseHandlerForHTMX(versioning.Info{}, ui.HTMX4)
	for _, route := range []string{"/", "/themes", "/feedback", "/metrics", "/alpine"} {
		page := httptest.NewRecorder()
		handler.ServeHTTP(page, httptest.NewRequest("GET", route, nil))
		body := page.Body.String()
		position := -1
		for _, src := range []string{"htmx4.min.js", "htmx4-alpine-compat.min.js", "alpine.min.js"} {
			next := strings.Index(body, `src="/assets/`+src+`"`)
			if next <= position {
				t.Fatalf("%s missing/out-of-order %s", route, src)
			}
			position = next
		}
	}
	for _, name := range []string{"htmx4.min.js", "htmx4-alpine-compat.min.js", "alpine.min.js"} {
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, httptest.NewRequest("GET", "/assets/"+name, nil))
		official, err := fs.ReadFile(ui.Assets(), name)
		if err != nil || response.Code != 200 || response.Body.String() != string(official) {
			t.Fatalf("shared %s does not serve official bytes", name)
		}
	}
}
func TestRetiredAssetURLsAreNotServed(t *testing.T) {
	handler := showcaseHandler(versioning.Info{})
	for _, path := range []string{"/assets/charts.js", "/assets/chart.umd.js", "/example-runtime/htmx.js", "/example-runtime/alpine.js", "/example-runtime/alpine-compat.js"} {
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		if w.Code != 404 {
			t.Fatalf("retired %s: %d", path, w.Code)
		}
	}
}
