package web

import (
	"context"
	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/internal/testutil"
	"io"
	"strings"
	"testing"
)

func TestSharedFrontendScriptSelectionOrderAndNonce(t *testing.T) {
	for _, tc := range []struct {
		name     string
		version  HTMXVersion
		noAlpine bool
		want     []string
		absent   []string
	}{
		{name: "default", want: []string{"htmx.min.js", "alpine.min.js"}, absent: []string{"htmx4.min.js", "htmx4-alpine-compat.min.js"}},
		{name: "v4", version: HTMX4, want: []string{"htmx4.min.js", "htmx4-alpine-compat.min.js", "alpine.min.js"}, absent: []string{"/htmx.min.js"}},
		{name: "htmx only", noAlpine: true, want: []string{"htmx.min.js"}, absent: []string{"alpine.min.js", "alpine-compat"}},
		{name: "v4 only", version: HTMX4, noAlpine: true, want: []string{"htmx4.min.js"}, absent: []string{"alpine.min.js", "alpine-compat"}},
		{name: "invalid defaults safely", version: 99, want: []string{"htmx.min.js", "alpine.min.js"}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			body := testutil.Render(t, Head(HeadProps{AssetPrefix: "shared", Frontend: true, HTMX: tc.version, DisableAlpine: tc.noAlpine, Nonce: `nonce"<&`}), "")
			position := -1
			for _, name := range tc.want {
				next := strings.Index(body, `src="/shared/`+name+`"`)
				if next <= position {
					t.Fatalf("missing/out-of-order %s: %s", name, body)
				}
				position = next
			}
			for _, name := range tc.absent {
				if strings.Contains(body, name) {
					t.Fatalf("unexpected %s: %s", name, body)
				}
			}
			if strings.Count(body, "<script") != len(tc.want) || strings.Count(body, "defer") != len(tc.want) || strings.Count(body, `nonce="nonce&#34;&lt;&amp;"`) != len(tc.want) {
				t.Fatal(body)
			}
			if strings.Contains(body, "https:") || strings.Contains(body, "http:") {
				t.Fatal("frontend must be same-origin", body)
			}
		})
	}
}
func TestPageFrontendDefaultsAndRegistrationBeforeAlpine(t *testing.T) {
	init := templ.ComponentFunc(func(_ context.Context, w io.Writer) error {
		_, err := io.WriteString(w, `<script defer src="/app-init.js"></script>`)
		return err
	})
	body := testutil.Render(t, Page(PageProps{ExtraHead: init, HTMX: HTMX4}), "")
	order := []string{"ui.css", "ui-runtime.js", "/app-init.js", "htmx4.min.js", "htmx4-alpine-compat.min.js", "alpine.min.js"}
	position := -1
	for _, name := range order {
		next := strings.Index(body, name)
		if next <= position {
			t.Fatalf("missing/out-of-order %s: %s", name, body)
		}
		position = next
	}
	if strings.Count(body, `src="/assets/ui/alpine.min.js"`) != 1 {
		t.Fatal("Alpine must load once", body)
	}
	for _, props := range []PageProps{{DisableFrontend: true}, {DisableAlpine: true}} {
		rendered := testutil.Render(t, Page(props), "")
		if strings.Contains(rendered, "alpine.min.js") {
			t.Fatal(rendered)
		}
		if props.DisableFrontend && strings.Contains(rendered, "htmx.min.js") {
			t.Fatal(rendered)
		}
		if !strings.Contains(rendered, "ui-feedback.js") {
			t.Fatal("shared UI controls must remain available", rendered)
		}
	}
}
