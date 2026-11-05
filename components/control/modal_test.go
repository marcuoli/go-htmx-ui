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

func TestModalDefaultWindowRegionsAndCloseAction(t *testing.T) {
	body := testutil.Render(t, Modal(ModalProps{ID: "window", Title: "Project", Description: "Instructions", CloseLabel: "Fechar"}), "Content")
	header := strings.Index(body, `<header class="ghtui-modal-header"`)
	content := strings.Index(body, `<div class="ghtui-modal-body"`)
	footer := strings.Index(body, `<footer class="ghtui-modal-footer"`)
	if header < 0 || content <= header || footer <= content {
		t.Fatal("window must have title bar, content and footer in order:", body)
	}
	if !strings.Contains(body[content:footer], `id="window-description"`) || !strings.Contains(body[footer:], ">Fechar</button>") || strings.Count(body, "data-ui-modal-close") != 2 {
		t.Fatal("description belongs to content and default footer must close with the supplied label:", body)
	}
	for _, want := range []string{`class="ghtui-modal-body" tabindex="0" role="region" aria-labelledby="window-title"`, `class="ghtui-modal-footer" tabindex="0" role="group" aria-labelledby="window-title"`} {
		if !strings.Contains(body, want) {
			t.Errorf("scrollable region must be keyboard reachable and named: %s", body)
		}
	}
	custom := testutil.Render(t, Modal(ModalProps{Footer: templ.Raw(`<span data-custom-footer>Custom actions</span>`)}), "Content")
	if !strings.Contains(custom, "data-custom-footer") || strings.Count(custom, "data-ui-modal-close") != 1 {
		t.Fatal("custom footer must replace the default action:", custom)
	}
}
