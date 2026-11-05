package main

import (
	"net/http/httptest"
	"strings"
	"testing"

	versioning "github.com/marcuoli/go-versioning"
)

func TestThemeShowcaseUsesSharedPageAndAllPairedPalettes(t *testing.T) {
	response := httptest.NewRecorder()
	showcaseHandler(versioning.Info{}).ServeHTTP(response, httptest.NewRequest("GET", "/themes", nil))
	if response.Code != 200 {
		t.Fatal(response.Code)
	}
	body := response.Body.String()
	for _, name := range []string{"standard", "ocean", "forest"} {
		for _, mode := range []string{"light", "dark"} {
			if !strings.Contains(body, `id="preview-`+name+`-`+mode+`"`) {
				t.Errorf("missing %s %s", name, mode)
			}
		}
	}
	for _, want := range []string{"/assets/ui-runtime.js", `data-ui-shell`, `aria-current="page"`, `id="theme-live-chart"`} {
		if !strings.Contains(body, want) {
			t.Errorf("missing %s", want)
		}
	}
	if strings.Contains(body, "<style") {
		t.Fatal("theme showcase relies on application CSS")
	}
}
