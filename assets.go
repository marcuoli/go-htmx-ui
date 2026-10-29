package ui

import (
	"embed"
	"io/fs"
)

//go:embed web/assets/*
var embeddedAssets embed.FS

// Assets hides the repository layout: consumers continue to see ui.css, charts.js
// and vendor filenames without a web/assets prefix. Serve with http.FileServer
// and http.StripPrefix at the application's chosen URL; no router is required.
func Assets() fs.FS {
	sub, err := fs.Sub(embeddedAssets, "web/assets")
	if err != nil {
		panic(err)
	}
	return sub
}
