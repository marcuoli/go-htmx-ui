package ui

import (
	"strings"
	"testing"

	"github.com/a-h/templ"
)

func TestStatusIndicatorTonesAndPulse(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name  string
		tone  StatusTone
		pulse bool
		want  string
	}{
		{"default", "", false, `data-tone="neutral" data-pulse="false"`},
		{"neutral", StatusNeutral, false, `data-tone="neutral" data-pulse="false"`},
		{"connected", StatusSuccess, true, `data-tone="success" data-pulse="true"`},
		{"retrying", StatusWarning, true, `data-tone="warning" data-pulse="true"`},
		{"failed", StatusDanger, false, `data-tone="danger" data-pulse="false"`},
		{"working", StatusInfo, true, `data-tone="info" data-pulse="true"`},
		{"unknown tone", StatusTone(`invalid" onclick="alert(1)`), false, `data-tone="neutral" data-pulse="false"`},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			body := renderWidgetContract(t, StatusIndicator(StatusIndicatorProps{Label: "Connection", Tone: tc.tone, Pulse: tc.pulse}), "")
			for _, want := range []string{tc.want, `class="ghtui-status-dot" aria-hidden="true"`, `class="ghtui-status-label">Connection</span>`} {
				if !strings.Contains(body, want) {
					t.Errorf("missing %q: %s", want, body)
				}
			}
			if strings.Contains(body, "onclick") || strings.Contains(body, `role="status"`) {
				t.Errorf("unexpected handler or implicit live region: %s", body)
			}
		})
	}
}

func TestStatusIndicatorEscapesLabelAndPreservesLiveBindings(t *testing.T) {
	t.Parallel()
	body := renderWidgetContract(t, StatusIndicator(StatusIndicatorProps{
		Label: "<Connected & ready>", Class: "connection-status", Tone: StatusSuccess, Pulse: true,
		LabelClass: "consumer-label",
		Attributes: templ.Attributes{
			"id": "connection", "role": "status", "hx-swap-oob": "true",
			"x-bind:data-tone": "tone", "x-bind:data-pulse": "connected",
			"title": `Connection "details"`,
		},
		LabelAttributes: templ.Attributes{"x-text": "statusText"},
	}), "")
	for _, want := range []string{
		`class="ghtui-status connection-status"`, "&lt;Connected &amp; ready&gt;",
		`id="connection"`, `role="status"`, `hx-swap-oob="true"`,
		`x-bind:data-tone="tone"`, `x-bind:data-pulse="connected"`,
		`title="Connection &#34;details&#34;"`, `class="ghtui-status-label consumer-label" x-text="statusText"`,
	} {
		if !strings.Contains(body, want) {
			t.Errorf("missing %q: %s", want, body)
		}
	}
}
