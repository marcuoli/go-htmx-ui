package main

import (
	"flag"
	ui "github.com/marcuoli/go-htmx-ui"
	versioning "github.com/marcuoli/go-versioning"
	"log"
	"net/http"
	"time"
)

func main() {
	addr := flag.String("listen", "127.0.0.1:8099", "HTTP listen address")
	htmx4 := flag.Bool("htmx4", false, "use the shared official HTMX4 runtime")
	flag.Parse()
	// Shared linker metadata is read-only. Validation builds keep an unknown
	// counter/time; running the example never probes or allocates a live store.
	info, err := versioning.CurrentBuild()
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("showcase: http://%s", *addr)
	log.Printf("build: version=%s commit=%s build_time=%q overall_build_number=%d build_counter_id=%q", info.Version, info.Commit, info.BuildTime, info.OverallBuildNumber, info.BuildCounterID)
	htmx := ui.HTMX2
	if *htmx4 {
		htmx = ui.HTMX4
	}
	server := http.Server{Addr: *addr, Handler: showcaseHandlerForHTMX(info, htmx), ReadHeaderTimeout: 5 * time.Second}
	log.Fatal(server.ListenAndServe())
}

func showcaseHandler(info versioning.Info) http.Handler {
	return showcaseHandlerForHTMX(info, ui.HTMX2)
}

func showcaseHandlerForHTMX(info versioning.Info, htmx ui.HTMXVersion) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("GET /assets/", ui.AssetHandler("/assets/"))
	mux.HandleFunc("GET /alpine", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := AlpinePage(htmx).Render(r.Context(), w); err != nil {
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
		if err := ThemesPage(info, htmx).Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	mux.HandleFunc("GET /metrics", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := MetricsPage(info, htmx).Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	mux.HandleFunc("GET /feedback", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := FeedbackPage(info, htmx).Render(r.Context(), w); err != nil {
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
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := Page(info, htmx).Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	return mux
}
