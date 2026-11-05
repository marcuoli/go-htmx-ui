package control

import (
	"strings"
	"testing"

	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/internal/testutil"
	versioning "github.com/marcuoli/go-versioning"
)

func TestControlsPreserveCallerAttributesAndEscapeText(t *testing.T) {
	components := []struct {
		c    templ.Component
		want []string
	}{
		{PageHeader(PageHeaderProps{Title: "<unsafe>", Description: "description", Attributes: templ.Attributes{"id": "page"}}), []string{"&lt;unsafe&gt;", `id="page"`, `id="slot"`}},
		{Button(ButtonProps{Type: "submit", Kind: Secondary, Attributes: templ.Attributes{"hx-post": "/example"}}), []string{`type="submit"`, `hx-post="/example"`, `ghtui-button-secondary`, `id="slot"`}},
		{Tab(TabProps{Label: "<tab>", Href: "javascript:alert(1)", Active: true}), []string{"&lt;tab&gt;", `aria-current="page"`, `href="about:invalid#TemplFailedSanitizationURL"`}},
		{Field(FieldProps{For: "model", Label: "Model", Hint: "Choose a model"}), []string{`for="model"`, `id="slot"`, "Choose a model"}},
		{Input(InputProps{ID: "input", Name: "name", Value: `"<`, Required: true}), []string{`id="input"`, `value="&#34;&lt;"`, `required`}},
		{Select(SelectProps{ID: "model", Name: "model", Value: "b", Options: []Option{{Value: "a", Label: "<A>"}, {Value: "b", Label: "B"}}}), []string{"&lt;A&gt;", `value="b" selected`}},
		{Dialog(DialogProps{ID: "edit", TitleID: "edit-title", Attributes: templ.Attributes{"data-example-dialog": "true"}}), []string{`id="edit"`, `aria-labelledby="edit-title"`, `data-example-dialog="true"`, `id="slot"`}},
	}
	for i, tc := range components {
		body := testutil.Render(t, tc.c, `<span id="slot">Child</span>`)
		for _, want := range tc.want {
			if !strings.Contains(body, want) {
				t.Errorf("case %d missing %q: %s", i, want, body)
			}
		}
	}
}

func TestVersionLabelUsesVersioningValidation(t *testing.T) {
	valid := versioning.Info{Version: "1.2.3+20261029.42", Commit: strings.Repeat("a", 40), BuildTime: "2026-10-29T12:00:00Z"}
	for _, tc := range []struct {
		info versioning.Info
		want string
	}{{valid, valid.Version}, {versioning.Info{Version: "made-up"}, versioning.UnknownVersion}} {
		body := testutil.Render(t, VersionLabel(tc.info), "")
		if !strings.Contains(body, tc.want) {
			t.Fatal(body)
		}
	}
}
