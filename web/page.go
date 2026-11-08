package web

import (
	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/components/layout"
)

// PageProps configures a complete document. The zero App uses Standard/System
// appearance. ExtraHead holds app metadata/configuration and app initialization;
// it runs before the shared frontend, allowing alpine:init registration.
// Applications register AssetHandler once; Page loads the shared UI runtime.
// DisableToasts omits the default page region for custom notification placement.
type PageProps struct {
	Title, Lang, AssetPrefix, Nonce string
	Charts                          bool
	HTMX                            HTMXVersion
	DisableFrontend, DisableAlpine  bool
	DisableToasts                   bool
	App                             layout.AppProps
	ExtraHead                       templ.Component
}

func pageTitle(p PageProps) string {
	if p.Title != "" {
		return p.Title
	}
	return "Application"
}
func pageLanguage(p PageProps) string {
	if p.Lang != "" {
		return p.Lang
	}
	return "en"
}
