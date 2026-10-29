package main

import (
	versioning "github.com/marcuoli/go-versioning"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestShowcaseRoutes(t *testing.T) {
	handler := showcaseHandler(versioning.Info{})
	for _, path := range []string{"/", "/assets/ui.css", "/assets/charts.js"} {
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		if w.Code != 200 || strings.TrimSpace(w.Body.String()) == "" {
			t.Fatalf("%s: %d", path, w.Code)
		}
	}
}
