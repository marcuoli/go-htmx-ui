package main

import (
	"flag"
	ui "github.com/marcuoli/go-htmx-ui"
	versioning "github.com/marcuoli/go-versioning"
	"log"
	"net/http"
	"time"
)

var version, commit, buildTime string

func main() {
	addr := flag.String("listen", "127.0.0.1:8099", "HTTP listen address")
	flag.Parse()
	info, err := versioning.Current(versioning.Info{Version: version, Commit: commit, BuildTime: buildTime})
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("showcase: http://%s", *addr)
	server := http.Server{Addr: *addr, Handler: showcaseHandler(info), ReadHeaderTimeout: 5 * time.Second}
	log.Fatal(server.ListenAndServe())
}

func showcaseHandler(info versioning.Info) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("GET /assets/", http.StripPrefix("/assets/", http.FileServer(http.FS(ui.Assets()))))
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := Page(info).Render(r.Context(), w); err != nil {
			log.Print(err)
		}
	})
	return mux
}
