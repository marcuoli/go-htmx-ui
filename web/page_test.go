package web

import (
	"strings"
	"testing"

	"github.com/marcuoli/go-htmx-ui/internal/testutil"
)

func TestPageProvidesCompleteDefaultsAndExternalRuntime(t *testing.T) {
	body := testutil.Render(t, Page(PageProps{Title: "<App>", Nonce: `nonce"<&`}), "Content")
	for _, want := range []string{"<!doctype html>", `lang="en"`, "&lt;App&gt;", `name="viewport"`, `class="ghtui-document"`, `data-ui-theme="standard"`, `data-ui-mode="system"`, "Content", "/assets/ui/ui.css", "/assets/ui/ui-runtime.js", `nonce="nonce&#34;&lt;&amp;"`} {
		if !strings.Contains(strings.ToLower(body), strings.ToLower(want)) {
			t.Errorf("missing %s: %s", want, body)
		}
	}
	if strings.Count(body, "<script") != 2 || strings.Contains(body, "<style") || !strings.Contains(body, "/assets/ui/ui-feedback.js") || strings.Count(body, "data-ui-toast-region") != 1 {
		t.Fatal(body)
	}
}

func TestPageCanOptOutOfDefaultToastRegion(t *testing.T) {
	body := testutil.Render(t, Page(PageProps{DisableToasts: true}), "")
	if strings.Contains(body, "data-ui-toast-region") {
		t.Fatal(body)
	}
	if !strings.Contains(body, "ui-feedback.js") {
		t.Fatal("modal/alert runtime must remain available")
	}
}
