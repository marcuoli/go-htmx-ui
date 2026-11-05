package ui_test

import (
	"github.com/a-h/templ"
	ui "github.com/marcuoli/go-htmx-ui"
	"github.com/marcuoli/go-htmx-ui/components/control"
	"github.com/marcuoli/go-htmx-ui/components/feedback"
	"github.com/marcuoli/go-htmx-ui/internal/testutil"
	"testing"
)

var (
	_ func(control.ModalProps) templ.Component        = ui.Modal
	_ func(control.ModalTriggerProps) templ.Component = ui.ModalTrigger
	_ func(control.ModalCloseProps) templ.Component   = ui.ModalClose
	_ func(feedback.AlertProps) templ.Component       = ui.Alert
	_ func(feedback.ToastProps) templ.Component       = ui.Toast
	_ func(feedback.ToastRegionProps) templ.Component = ui.ToastRegion
)

func TestFeedbackRootFacadePreservesChildren(t *testing.T) {
	for _, pair := range [][2]templ.Component{
		{ui.Modal(ui.ModalProps{}), control.Modal(control.ModalProps{})},
		{ui.Alert(ui.AlertProps{}), feedback.Alert(feedback.AlertProps{})},
		{ui.Toast(ui.ToastProps{}), feedback.Toast(feedback.ToastProps{})},
		{ui.ToastRegion(ui.ToastRegionProps{}), feedback.ToastRegion(feedback.ToastRegionProps{})},
	} {
		if testutil.Render(t, pair[0], "Child") != testutil.Render(t, pair[1], "Child") {
			t.Fatal("root API changed child rendering")
		}
	}
}
