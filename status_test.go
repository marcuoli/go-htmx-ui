package ui

import (
	"html"
	"strings"
	"testing"

	"github.com/a-h/templ"
)

func TestStatusIndicatorAlpineBindingsAndCallerPrecedence(t *testing.T) {
	root := templ.Attributes{"id": "status", "x-show": "callerVisible"}
	label := templ.Attributes{"x-text": "callerLabel"}
	props := StatusIndicatorProps{
		Label: "Fallback", PulseStyle: StatusPing,
		Alpine:     &StatusAlpineBindings{Show: "visible", Label: "label", LabelClass: "labelClass", Tone: "tone", Pulse: "active"},
		Attributes: root, LabelAttributes: label,
	}
	body := html.UnescapeString(renderWidgetContract(t, StatusIndicator(props), ""))
	for _, want := range []string{`data-pulse-style="ping"`, `x-show="callerVisible"`, `x-text="callerLabel"`, `x-bind:class="labelClass"`, `x-bind:data-tone="tone"`, `x-bind:data-pulse="(active) ? 'true' : 'false'"`, `>Fallback</span>`} {
		if !strings.Contains(body, want) {
			t.Errorf("missing Alpine contract %q: %s", want, body)
		}
	}
	if len(root) != 2 || len(label) != 1 {
		t.Fatal("rendering mutated caller attribute maps")
	}
	plain := renderWidgetContract(t, StatusIndicator(StatusIndicatorProps{Label: "Plain", PulseStyle: "invalid"}), "")
	if strings.Contains(plain, "x-bind") || strings.Contains(plain, "x-text") || strings.Contains(plain, "x-show") || !strings.Contains(plain, `data-pulse-style="ring"`) {
		t.Fatal("plain indicator acquired framework bindings or invalid pulse style", plain)
	}
}

func TestStatusIndicatorAlpineShorthandAndModifiersOverrideConvenienceBindings(t *testing.T) {
	props := StatusIndicatorProps{
		Label: "Fallback", Alpine: &StatusAlpineBindings{Show: "helperVisible", Tone: "helperTone", Pulse: "helperPulse", LabelClass: "helperClass"},
		Attributes:      templ.Attributes{":data-tone": "callerTone", ":data-pulse": "callerPulse", "x-show.important": "callerVisible"},
		LabelAttributes: templ.Attributes{":class": "callerClass"},
	}
	body := html.UnescapeString(renderWidgetContract(t, StatusIndicator(props), ""))
	for _, want := range []string{`:data-tone="callerTone"`, `:data-pulse="callerPulse"`, `:class="callerClass"`, `x-show.important="callerVisible"`} {
		if !strings.Contains(body, want) {
			t.Errorf("missing shorthand override %q: %s", want, body)
		}
	}
	for _, unexpected := range []string{`x-bind:data-tone=`, `x-bind:data-pulse=`, `x-bind:class=`, ` x-show=`} {
		if strings.Contains(body, unexpected) {
			t.Errorf("competing convenience binding %q: %s", unexpected, body)
		}
	}
}

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
