package web

import "github.com/a-h/templ"

// HeadProps configures a page's shared stylesheet and optional chart scripts.
// AssetPrefix is the local URL path registered with AssetHandler; empty uses
// /assets/ui/. Charts includes the engine, formatter and controller in that
// order. Nonce is an optional application-supplied CSP nonce for external scripts.
type HeadProps struct {
	AssetPrefix string
	Charts      bool
	// Interactive loads the shared appearance/navigation runtime. Page enables
	// it automatically; existing Head calls keep their CSS-only behavior.
	Interactive bool
	Nonce       string
}

func headNonceAttributes(nonce string) templ.Attributes {
	if nonce == "" {
		return nil
	}
	return templ.Attributes{"nonce": nonce}
}
