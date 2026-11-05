package main

import (
	versioning "github.com/marcuoli/go-versioning"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

func TestShowcaseRoutes(t *testing.T) {
	handler := showcaseHandler(versioning.Info{})
	for _, path := range []string{"/", "/assets/ui.css", "/assets/echarts.min.js", "/assets/echarts-format.js", "/assets/ui-htmx-charts.js", "/assets/echarts-ui.js"} {
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		if w.Code != 200 || strings.TrimSpace(w.Body.String()) == "" {
			t.Fatalf("%s: %d", path, w.Code)
		}
	}
}

func TestAlpineConsumerExampleAndFragment(t *testing.T) {
	runtimes := fstest.MapFS{
		"alpinejs/dist/cdn.min.js":  {Data: []byte("/* example runtime */")},
		"htmx.org/dist/htmx.min.js": {Data: []byte("/* example runtime */")},
	}
	handler := showcaseHandlerWithRuntime(versioning.Info{}, runtimes)
	for _, path := range []string{"/alpine", "/alpine/fragment", "/example-runtime/alpine.js", "/example-runtime/htmx.js"} {
		t.Run(path, func(t *testing.T) {
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, httptest.NewRequest("GET", path, nil))
			if response.Code != 200 || response.Body.Len() == 0 {
				t.Fatalf("%s returned %d", path, response.Code)
			}
			if strings.HasPrefix(path, "/alpine") {
				for _, want := range []string{`data-pulse-style="ping"`, `x-show="shown"`, `x-text="text"`, `x-bind:class="textClass"`} {
					if !strings.Contains(response.Body.String(), want) {
						t.Errorf("consumer missing %q", want)
					}
				}
			}
		})
	}
}

func TestHTMX4ExampleUsesOfficialAliasAndLoadsCompatBeforeAlpine(t *testing.T) {
	runtimes := exampleRuntimeFS{fstest.MapFS{
		"alpinejs/dist/cdn.min.js":           {Data: []byte("/* Alpine */")},
		"htmx4/dist/htmx.min.js":             {Data: []byte("/* HTMX 4 */")},
		"htmx4/dist/ext/hx-alpine-compat.js": {Data: []byte("/* official compat */")},
	}}
	handler := showcaseHandlerWithRuntime(versioning.Info{}, runtimes)
	page := httptest.NewRecorder()
	handler.ServeHTTP(page, httptest.NewRequest("GET", "/alpine", nil))
	body := page.Body.String()
	position := -1
	for _, src := range []string{"/example-runtime/htmx.js", "/example-runtime/alpine-compat.js", "/example-runtime/alpine.js"} {
		next := strings.Index(body, `src="`+src+`"`)
		if next <= position {
			t.Fatalf("example runtime missing or out of order: %s", src)
		}
		position = next
	}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest("GET", "/example-runtime/htmx.js", nil))
	if response.Code != 200 || !strings.Contains(response.Body.String(), "HTMX 4") {
		t.Fatal("HTMX 4 alias did not serve its unmodified runtime")
	}
}

func TestRetiredAssetURLsAreNotServed(t *testing.T) {
	handler := showcaseHandler(versioning.Info{})
	for _, path := range []string{"/assets/charts.js", "/assets/chart.umd.js"} {
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		if w.Code != 404 {
			t.Fatalf("retired %s: %d", path, w.Code)
		}
	}
}
