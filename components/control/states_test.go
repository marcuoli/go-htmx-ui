package control

import (
	"strings"
	"testing"

	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/internal/testutil"
)

func TestFieldDefaultsAssociateHintErrorWithoutMutatingCaller(t *testing.T) {
	attrs := templ.Attributes{"data-name": "kept"}
	body := testutil.Render(t, TextField(TextFieldProps{Label: "Email", Hint: "Use your work address", Error: "<Invalid>", Input: InputProps{Name: "email", DescribedBy: "external", Attributes: attrs}}), "")
	for _, want := range []string{`for="email"`, `id="email"`, `id="email-hint"`, `id="email-error"`, `aria-describedby="external email-hint email-error"`, `aria-invalid="true"`, "&lt;Invalid&gt;", `type="text"`, `data-name="kept"`} {
		if !strings.Contains(body, want) {
			t.Errorf("missing %s: %s", want, body)
		}
	}
	if len(attrs) != 1 {
		t.Fatal("caller attributes mutated")
	}
}

func TestLoadingAndEmptyStatesHaveUsableDefaults(t *testing.T) {
	body := testutil.Render(t, Button(ButtonProps{Loading: true}), "Save")
	for _, want := range []string{`type="button"`, `disabled`, `aria-busy="true"`, `aria-hidden="true"`, "Working…"} {
		if !strings.Contains(body, want) {
			t.Errorf("missing %s: %s", want, body)
		}
	}
	if got := testutil.Render(t, EmptyState(EmptyStateProps{}), "Action"); !strings.Contains(got, "No items yet") || !strings.Contains(got, "Action") {
		t.Fatal(got)
	}
	if got := testutil.Render(t, LoadingState(LoadingStateProps{}), ""); !strings.Contains(got, `role="status"`) || !strings.Contains(got, "Loading…") {
		t.Fatal(got)
	}
}

func TestCallerARIAOverridesConvenienceWithoutDuplicateAttributes(t *testing.T) {
	attrs := templ.Attributes{"aria-invalid": "false", "aria-describedby": "owned"}
	body := testutil.Render(t, Input(InputProps{Invalid: true, DescribedBy: "generated", Attributes: attrs}), "")
	if strings.Count(body, "aria-invalid=") != 1 || strings.Count(body, "aria-describedby=") != 1 || !strings.Contains(body, `aria-invalid="false"`) || !strings.Contains(body, `aria-describedby="owned"`) {
		t.Fatal(body)
	}
	if len(attrs) != 2 {
		t.Fatal("caller attributes mutated")
	}
}
