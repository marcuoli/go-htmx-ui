package feedback

import (
	"github.com/marcuoli/go-htmx-ui/internal/testutil"
	"strings"
	"testing"
	"time"
)

func TestAlertTonesAndEscapedContent(t *testing.T) {
	for _, tc := range []struct {
		tone AlertTone
		role string
	}{{AlertInfo, "status"}, {AlertSuccess, "status"}, {AlertWarning, "alert"}, {AlertDanger, "alert"}, {"invalid", "status"}} {
		body := testutil.Render(t, Alert(AlertProps{Tone: tc.tone, Title: "<Notice>", Message: "<script>unsafe</script>", Dismissible: true}), `<a href="/help">Help</a>`)
		for _, want := range []string{`role="` + tc.role + `"`, `&lt;Notice&gt;`, `&lt;script&gt;unsafe&lt;/script&gt;`, `data-ui-message-dismiss`, `aria-label="Dismiss notification"`, `<a href="/help">Help</a>`} {
			if !strings.Contains(body, want) {
				t.Errorf("missing %q: %s", want, body)
			}
		}
	}
	body := testutil.Render(t, Alert(AlertProps{Message: "Read this"}), "")
	if strings.Contains(body, "data-ui-message-dismiss") {
		t.Fatal("inline alerts persist unless dismissal is requested")
	}
}

func TestToastPersistenceAndPrimedRegion(t *testing.T) {
	for _, tc := range []struct {
		duration time.Duration
		want     string
	}{{0, "0"}, {-time.Second, "0"}, {5 * time.Second, "5000"}, {time.Millisecond, "1000"}, {48 * time.Hour, "86400000"}} {
		body := testutil.Render(t, Toast(ToastProps{Message: "Saved", Duration: tc.duration}), "")
		if !strings.Contains(body, `data-ui-duration="`+tc.want+`"`) || !strings.Contains(body, "data-ui-message-dismiss") {
			t.Fatal(body)
		}
	}
	body := testutil.Render(t, ToastRegion(ToastRegionProps{}), "Child")
	for _, want := range []string{`aria-label="Notifications"`, `data-ui-position="bottom-right"`, `data-ui-toast-polite`, `role="status"`, `data-ui-toast-assertive`, `role="alert"`, "Child"} {
		if !strings.Contains(body, want) {
			t.Errorf("missing %q: %s", want, body)
		}
	}
}
