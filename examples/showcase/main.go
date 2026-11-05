package main

import (
	"flag"
	ui "github.com/marcuoli/go-htmx-ui"
	versioning "github.com/marcuoli/go-versioning"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

var version, commit, buildTime string

func main() {
	addr := flag.String("listen", "127.0.0.1:8099", "HTTP listen address")
	runtimeDir := flag.String("runtime-assets", "", "optional external node_modules directory for the Alpine/HTMX example")
	htmx4 := flag.Bool("htmx4", false, "use the development-only htmx4 npm alias in the Alpine example")
	flag.Parse()
	info, err := versioning.Current(versioning.Info{Version: version, Commit: commit, BuildTime: buildTime})
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("showcase: http://%s", *addr)
	var runtimeAssets fs.FS
	if *runtimeDir != "" {
		runtimeAssets = os.DirFS(*runtimeDir)
		if *htmx4 {
			runtimeAssets = exampleRuntimeFS{runtimeAssets}
		}
	}
	server := http.Server{Addr: *addr, Handler: showcaseHandlerWithRuntime(info, runtimeAssets), ReadHeaderTimeout: 5 * time.Second}
	log.Fatal(server.ListenAndServe())
}

// exampleRuntimeFS selects an unmodified official npm alias for the example;
// framework selection and loading are application concerns, not ui.Head's.
type exampleRuntimeFS struct{ fs.FS }

func (assets exampleRuntimeFS) Open(name string) (fs.File, error) {
	if strings.HasPrefix(name, "htmx.org/") {
		name = "htmx4/" + strings.TrimPrefix(name, "htmx.org/")
	}
	return assets.FS.Open(name)
}

func showcaseHandler(info versioning.Info) http.Handler {
	return showcaseHandlerWithRuntime(info, nil)
}

func showcaseHandlerWithRuntime(info versioning.Info, runtimeAssets fs.FS) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("GET /assets/", ui.AssetHandler("/assets/"))
	// These development-only runtimes are served from an explicitly supplied
	// external directory. The shared module never bundles or installs them.
	if runtimeAssets != nil {
		mux.HandleFunc("GET /example-runtime/alpine.js", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFileFS(w, r, runtimeAssets, "alpinejs/dist/cdn.min.js")
		})
		mux.HandleFunc("GET /example-runtime/htmx.js", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFileFS(w, r, runtimeAssets, "htmx.org/dist/htmx.min.js")
		})
		mux.HandleFunc("GET /example-runtime/alpine-compat.js", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFileFS(w, r, runtimeAssets, "htmx.org/dist/ext/hx-alpine-compat.js")
		})
	}
	withAlpineCompat := false
	if runtimeAssets != nil {
		_, compatError := fs.Stat(runtimeAssets, "htmx.org/dist/ext/hx-alpine-compat.js")
		withAlpineCompat = compatError == nil
	}
	mux.HandleFunc("GET /alpine", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := AlpinePage(runtimeAssets != nil, withAlpineCompat).Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	mux.HandleFunc("GET /alpine/fragment", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := AlpineFragment().Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	mux.HandleFunc("GET /themes", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := ThemesPage(info, runtimeAssets != nil).Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	mux.HandleFunc("GET /feedback", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := FeedbackPage(info, runtimeAssets != nil).Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	mux.HandleFunc("GET /feedback/fragment", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := FeedbackFragment().Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	mux.HandleFunc("GET /feedback/toast", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := ui.Toast(ui.ToastProps{Tone: ui.AlertSuccess, Title: "Changes saved", Message: "This notification was rendered on the server.", Duration: 5 * time.Second}).Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	mux.HandleFunc("GET /themes/fragment", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := ThemeFragment().Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := Page(info).Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	return mux
}
