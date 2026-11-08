package web

import (
	"embed"
	"io/fs"
	"net/http"
	"path"
)

//go:embed assets/*
var embeddedAssets embed.FS

// Assets serves compiled Tailwind CSS, official HTMX2/4 and Alpine runtimes,
// their compatibility scripts/notices/provenance, shared UI behavior, and the official
// echarts.min.js and first-party chart helpers without a repository-layout prefix.
// Serve with http.FileServer and http.StripPrefix at the application-owned URL.
// The former echarts-ui.js filename remains an alias to the same controller.
// v0.6.0's retired chart-schema bundle URLs remain unavailable.
func Assets() fs.FS {
	sub, err := fs.Sub(embeddedAssets, "assets")
	if err != nil {
		panic(err)
	}
	return assetFS{sub}
}

// assetFS preserves v0.6.0 controller URLs without maintaining a second script.
// Only the filename changes; the formatter still loads before the controller.
type assetFS struct{ fs.FS }

func (assets assetFS) Open(name string) (fs.File, error) {
	if name == "echarts-ui.js" {
		name = "ui-htmx-charts.js"
	}
	return assets.FS.Open(name)
}

// AssetHandler serves the embedded assets below an application-owned URL path.
// Empty prefix defaults to /assets/ui/; other prefixes are normalized to a local
// absolute path with a trailing slash, just as in HeadProps. Register the handler
// at that prefix in the application's router and apply its middleware there.
// Calling AssetHandler does not register routes or change the default mux.
func AssetHandler(prefix string) http.Handler {
	return http.StripPrefix(assetPrefix(prefix), http.FileServer(http.FS(Assets())))
}

func assetPrefix(prefix string) string {
	if prefix == "" {
		return "/assets/ui/"
	}
	prefix = path.Clean("/" + prefix)
	if prefix == "/" {
		return prefix
	}
	return prefix + "/"
}
