package ui

import (
	"strings"
	"testing"

	"github.com/a-h/templ"
)

func TestAuthStatusRequiresExplicitAuthenticationState(t *testing.T) {
	for _, tc := range []struct {
		name  string
		state AuthState
		want  string
	}{
		{"default unknown", "", "unknown"},
		{"confirmed sign in", AuthSignedIn, "signed-in"},
		{"confirmed sign out", AuthSignedOut, "signed-out"},
		{"unknown", AuthUnknown, "unknown"},
		{"generic health is not authentication", "healthy", "unknown"},
		{"failure is not sign out", "failed", "unknown"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			body := renderWidgetContract(t, AuthStatus(AuthStatusProps{State: tc.state}), "")
			if !strings.Contains(body, `data-auth-state="`+tc.want+`"`) {
				t.Fatal(body)
			}
			for _, part := range []string{"signed-in", "signed-out", "unknown"} {
				if strings.Count(body, `data-auth-part="`+part+`"`) != 1 {
					t.Fatalf("missing stable state fragment %s: %s", part, body)
				}
			}
			if strings.Count(body, `aria-hidden="true"`) != 3 || strings.Count(body, `focusable="false"`) != 3 {
				t.Fatal("icons must be decorative and unfocusable", body)
			}
		})
	}
}

func TestAuthStatusEscapesLabelsAndPreservesLiveAttributes(t *testing.T) {
	body := renderWidgetContract(t, AuthStatus(AuthStatusProps{
		State: AuthUnknown, SignedInLabel: "<Signed in>", SignedOutLabel: "Out & ready", UnknownLabel: "Checking",
		Class: "compact-auth", LabelClass: "auth-text",
		Attributes: templ.Attributes{"id": "auth-state", "role": "status", "data-dashboard-key": "auth", "x-bind:data-auth-state": "authState"},
	}), "")
	for _, want := range []string{`data-auth-state="unknown"`, "&lt;Signed in&gt;", "Out &amp; ready", ">Checking</span>", `id="auth-state"`, `role="status"`, `data-dashboard-key="auth"`, `x-bind:data-auth-state="authState"`, `ghtui-auth compact-auth`, `ghtui-auth-label auth-text`} {
		if !strings.Contains(body, want) {
			t.Errorf("missing auth presentation contract %q: %s", want, body)
		}
	}
}
