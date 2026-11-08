package web

import "github.com/a-h/templ"

// HTMXVersion selects a shared official runtime. Zero/unknown values retain
// HTMX2 compatibility; a major-version migration requires explicit HTMX4.
type HTMXVersion uint8

const (
	HTMX2 HTMXVersion = 2
	HTMX4 HTMXVersion = 4
)

// HeadProps configures shared assets at the local route registered with
// AssetHandler (default /assets/ui/). Frontend includes HTMX and Alpine from
// this module, in dependency order. DisableAlpine supports HTMX-only pages.
// Charts includes the engine, formatter and controller. Nonce applies to every
// emitted script; the application supplies its CSP and request configuration.
type HeadProps struct {
	AssetPrefix string
	Charts      bool
	// Interactive loads shared appearance/navigation and feedback runtimes.
	// Page enables it automatically; a zero Head remains stylesheet-only.
	Interactive   bool
	Frontend      bool
	HTMX          HTMXVersion
	DisableAlpine bool
	Nonce         string
}

func headNonceAttributes(nonce string) templ.Attributes {
	if nonce == "" {
		return nil
	}
	return templ.Attributes{"nonce": nonce}
}
