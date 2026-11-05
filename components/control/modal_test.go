package control

import (
	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/internal/testutil"
	"strings"
	"testing"
)

func TestModalDefaultsLabelsAndSlots(t *testing.T) {
	body := testutil.Render(t, Modal(ModalProps{ID: "edit", Title: "<Edit>", Description: "Explain & confirm", Footer: ModalClose(ModalCloseProps{})}), `<input id="content">`)
	for _, want := range []string{`<dialog`, `id="edit"`, `data-ui-modal`, `data-ui-size="medium"`, `aria-labelledby="edit-title"`, `aria-describedby="edit-description"`, `id="edit-title"`, `&lt;Edit&gt;`, `Explain &amp; confirm`, `data-ui-modal-close`, `aria-label="Close"`, `<input id="content">`, `ghtui-modal-footer`} {
		if !strings.Contains(body, want) {
			t.Errorf("missing %q: %s", want, body)
		}
	}
	if strings.Contains(body, ` open`) {
		t.Fatal("modal must not open without an intentional action")
	}
	defaults := testutil.Render(t, Modal(ModalProps{}), "")
	if !strings.Contains(defaults, `id="ghtui-modal-title"`) || !strings.Contains(defaults, ">Details</h2>") || strings.Contains(defaults, "aria-describedby") {
		t.Fatal(defaults)
	}
}

func TestModalHelpersKeepApplicationButtonAttributes(t *testing.T) {
	attrs := templ.Attributes{"hx-get": "/edit", "data-ui-modal-open": "wrong"}
	body := testutil.Render(t, ModalTrigger(ModalTriggerProps{Target: "edit", Button: ButtonProps{Kind: Secondary, Attributes: attrs}}), "Edit")
	for _, want := range []string{`data-ui-modal-open="edit"`, `data-ui-modal-enable`, `disabled`, `hx-get="/edit"`, `ghtui-button-secondary`, ">Edit</button>"} {
		if !strings.Contains(body, want) {
			t.Errorf("missing %q: %s", want, body)
		}
	}
	if attrs["data-ui-modal-open"] != "wrong" {
		t.Fatal("helper mutated caller attributes")
	}
	disabled := testutil.Render(t, ModalTrigger(ModalTriggerProps{Target: "edit", Button: ButtonProps{Disabled: true}}), "Edit")
	if strings.Contains(disabled, "data-ui-modal-enable") {
		t.Fatal("disabled trigger must remain disabled")
	}
}
