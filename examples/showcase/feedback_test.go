package main

import (
	versioning "github.com/marcuoli/go-versioning"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestFeedbackRoutesProvideReusableControls(t *testing.T) {
	for _, tc := range []struct {
		path  string
		wants []string
	}{
		{"/feedback", []string{"ui-feedback.js", "data-ui-modal-open", "data-ui-modal", "data-ui-alert", "data-ui-toast-region", `id="feedback-forest-dark"`}},
		{"/feedback/fragment", []string{`id="fragment-modal"`, `data-ui-modal-enable`, `data-ui-message-dismiss`}},
		{"/feedback/toast", []string{`data-ui-toast`, `data-ui-duration="5000"`, `data-ui-tone="success"`}},
	} {
		response := httptest.NewRecorder()
		showcaseHandler(versioning.Info{}).ServeHTTP(response, httptest.NewRequest("GET", tc.path, nil))
		if response.Code != 200 {
			t.Fatalf("%s: %d", tc.path, response.Code)
		}
		for _, want := range tc.wants {
			if !strings.Contains(response.Body.String(), want) {
				t.Errorf("%s missing %s", tc.path, want)
			}
		}
	}
}
