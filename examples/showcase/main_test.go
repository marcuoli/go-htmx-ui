package main

import (
	versioning "github.com/marcuoli/go-versioning"
	"net/http/httptest"
	"strings"
	"testing"
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
