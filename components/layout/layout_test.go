package layout

import (
	"bytes"
	"context"
	"io"
	"strings"
	"testing"

	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/internal/testutil"
	"github.com/marcuoli/go-htmx-ui/theme"
)

func TestAppProvidesDefaultsAndScopedRenderConfiguration(t *testing.T) {
	body := testutil.Render(t, App(AppProps{}), `<span id="child">Body</span>`)
	for _, want := range []string{`data-ui-app`, `data-ui-theme="standard"`, `data-ui-mode="system"`, `data-ui-density="comfortable"`, `id="child"`} {
		if !strings.Contains(body, want) {
			t.Errorf("missing %s: %s", want, body)
		}
	}
	child := templ.ComponentFunc(func(ctx context.Context, w io.Writer) error {
		_, err := io.WriteString(w, string(theme.FromContext(ctx).Theme))
		return err
	})
	ctx := templ.WithChildren(context.Background(), child)
	var output bytes.Buffer
	if err := App(AppProps{Theme: theme.Ocean, Mode: theme.Dark, Accent: `#fff;display:none`}).Render(ctx, &output); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(output.String(), ">ocean</div>") || strings.Contains(output.String(), "display:none") {
		t.Fatal(output.String())
	}
}

func TestAppOwnsReservedAppearanceMarkersAndPreservesCallerAttributes(t *testing.T) {
	attrs := templ.Attributes{"data-ui-mode": "dark", "class": "replace-app", "x-data": "trusted"}
	body := testutil.Render(t, App(AppProps{Attributes: attrs}), "")
	if strings.Count(body, "data-ui-mode=") != 1 || !strings.Contains(body, `data-ui-mode="system"`) || !strings.Contains(body, `class="ghtui-app `) || !strings.Contains(body, `x-data="trusted"`) {
		t.Fatal(body)
	}
	if len(attrs) != 3 {
		t.Fatal("caller map mutated")
	}
}

func TestThemeSwitcherReflectsServerConfigurationAndEscapesLabels(t *testing.T) {
	ctx := theme.WithConfig(context.Background(), theme.Config{Theme: theme.Forest, Mode: theme.Dark})
	var output bytes.Buffer
	if err := ThemeSwitcher(ThemeSwitcherProps{ThemeLabel: "<Theme>"}).Render(ctx, &output); err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{`value="forest" selected`, `value="dark" selected`, "&lt;Theme&gt;", `data-ui-theme-select`, `data-ui-mode-select`} {
		if !strings.Contains(output.String(), want) {
			t.Errorf("missing %s: %s", want, output.String())
		}
	}
}

func TestShellKeepsSlotsNavigationAndAccessibleDefaults(t *testing.T) {
	body := testutil.Render(t, AppShell(AppShellProps{ID: "demo", Title: "<App>", Nav: []NavItem{{Label: "Home", Href: "/", Active: true}}, Footer: templ.Raw("Footer slot")}), "Main slot")
	for _, want := range []string{`href="#demo-main"`, `id="demo-main"`, `id="demo-navigation"`, `aria-controls="demo-navigation"`, `aria-expanded="false"`, `aria-current="page"`, "&lt;App&gt;", "Main slot", "Footer slot", `data-ui-theme-select`} {
		if !strings.Contains(body, want) {
			t.Errorf("missing %s: %s", want, body)
		}
	}
	plain := testutil.Render(t, AppShell(AppShellProps{}), "Body")
	if strings.Contains(plain, `data-ui-shell-nav`) || !strings.Contains(plain, "Application") {
		t.Fatal(plain)
	}
}
