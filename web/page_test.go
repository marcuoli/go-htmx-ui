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
	if strings.Count(body, "<script") != 1 || strings.Contains(body, "<style") {
		t.Fatal(body)
	}
}
