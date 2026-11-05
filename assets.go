package ui

import (
	"embed"
	"io/fs"
)

//go:embed web/assets/*
var embeddedAssets embed.FS

// Assets serves ui.css, the official echarts.min.js and first-party
// echarts-format.js/echarts-ui.js without a repository-layout prefix.
// Serve with http.FileServer and http.StripPrefix at the application-owned URL.
// v0.6.0 removes the legacy schema adapter and compatibility bundle URL.
func Assets() fs.FS {
	sub, err := fs.Sub(embeddedAssets, "web/assets")
	if err != nil {
		panic(err)
	}
	return sub
}
