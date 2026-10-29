package ui

import (
	"embed"
	"io/fs"
)

//go:embed assets/*
var embeddedAssets embed.FS

// Assets exposes paths relative to the asset directory. Serve with http.FileServer
// and http.StripPrefix at the application's chosen URL; no router is required.
func Assets() fs.FS {
	sub, err := fs.Sub(embeddedAssets, "assets")
	if err != nil {
		panic(err)
	}
	return sub
}
