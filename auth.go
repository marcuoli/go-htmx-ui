package ui

import "github.com/a-h/templ"

// AuthState is an application's explicit authentication observation. Unknown
// includes checking, unavailable or stale observations; failures do not imply
// AuthSignedOut, and healthy service status does not imply AuthSignedIn.
type AuthState string

const (
	AuthUnknown   AuthState = "unknown"
	AuthSignedIn  AuthState = "signed-in"
	AuthSignedOut AuthState = "signed-out"
)

// AuthStatusProps configures presentation only. Labels can be localized and are
// escaped; empty labels use the defaults. Attributes target the stable wrapper,
// for example an ID, live region or x-bind:data-auth-state expression. The caller
// must switch State to AuthUnknown when a verified observation becomes stale.
type AuthStatusProps struct {
	State                                       AuthState
	SignedInLabel, SignedOutLabel, UnknownLabel string
	Class, LabelClass                           string
	Attributes                                  templ.Attributes
}

func authState(state AuthState) AuthState {
	if state == AuthSignedIn || state == AuthSignedOut {
		return state
	}
	return AuthUnknown
}

func authLabel(label, fallback string) string {
	if label != "" {
		return label
	}
	return fallback
}
