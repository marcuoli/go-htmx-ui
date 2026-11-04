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
	return chartAssetFS{sub}
}

// Preserve the previous bundle URL for layouts upgrading the shared module.
// It serves ECharts, not a second chart engine; new layouts use echarts.min.js.
type chartAssetFS struct{ fs.FS }

func (assets chartAssetFS) Open(name string) (fs.File, error) {
	if name == "chart.umd.js" {
		name = "echarts.min.js"
	}
	return assets.FS.Open(name)
}
