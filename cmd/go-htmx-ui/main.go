// Command go-htmx-ui builds app CSS with the module's pinned official compiler.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"github.com/marcuoli/go-htmx-ui/internal/frontendbuild"
	"io"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, os.Args[1:], os.Stdout, os.Stderr); err != nil {
		fmt.Fprintln(os.Stderr, "go-htmx-ui:", err)
		os.Exit(1)
	}
}
func run(ctx context.Context, args []string, stdout, stderr io.Writer) error {
	if len(args) == 0 || args[0] != "css" {
		return errors.New("usage: go-htmx-ui css --input FILE --output FILE --cache-dir ABSOLUTE_DIRECTORY [--source DIRECTORY] [--minify=false] [--musl]")
	}
	flags := flag.NewFlagSet("go-htmx-ui css", flag.ContinueOnError)
	flags.SetOutput(stderr)
	var options frontendbuild.Options
	flags.StringVar(&options.Input, "input", "", "application stylesheet input")
	flags.StringVar(&options.Output, "output", "", "compiled stylesheet output")
	flags.StringVar(&options.CacheDir, "cache-dir", os.Getenv("GO_HTMX_UI_TAILWIND_CACHE"), "absolute managed tool cache (or GO_HTMX_UI_TAILWIND_CACHE)")
	flags.BoolVar(&options.Minify, "minify", true, "minify generated CSS")
	flags.BoolVar(&options.Musl, "musl", false, "select official Linux musl compiler")
	flags.Func("source", "additional source directory (repeatable)", func(value string) error { options.Sources = append(options.Sources, value); return nil })
	timeout := flags.Duration("timeout", 5*time.Minute, "overall download/compile deadline")
	if err := flags.Parse(args[1:]); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return nil
		}
		return err
	}
	if flags.NArg() != 0 {
		return errors.New("unexpected positional argument")
	}
	if *timeout <= 0 {
		return errors.New("timeout must be positive")
	}
	ctx, cancel := context.WithTimeout(ctx, *timeout)
	defer cancel()
	return frontendbuild.Compile(ctx, options, stdout, stderr)
}
