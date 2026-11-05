// Command module-version plans conventional library tags with go-versioning's
// core policy. It never allocates application date/PR tags or changes Git refs.
package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"

	versioning "github.com/marcuoli/go-versioning"
)

type plan struct {
	Previous string          `json:"previous"`
	Bump     versioning.Bump `json:"bump"`
	Tag      string          `json:"tag"`
}

func main() {
	if err := run(os.Args[1:], os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, "module-version:", err)
		os.Exit(1)
	}
}

func run(args []string, output io.Writer) error {
	flags := flag.NewFlagSet("module-version", flag.ContinueOnError)
	flags.SetOutput(io.Discard)
	previous := flags.String("previous", "", "previous conventional module tag")
	bump := flags.String("bump", "", "major, minor or patch")
	expected := flags.String("check", "", "optional expected next tag")
	if err := flags.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			_, err := fmt.Fprintln(output, "Usage: module-version -previous vX.Y.Z -bump major|minor|patch [-check vX.Y.Z]")
			return err
		}
		return fmt.Errorf("use -previous vX.Y.Z -bump major|minor|patch [-check vX.Y.Z]: %w", err)
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("positional arguments are not accepted")
	}
	if !strings.HasPrefix(*previous, "v") {
		return fmt.Errorf("-previous must be a conventional v-prefixed module tag")
	}
	core, err := versioning.ParseCore(strings.TrimPrefix(*previous, "v"))
	if err != nil {
		return fmt.Errorf("previous module tag: %w", err)
	}
	switch versioning.Bump(*bump) {
	case versioning.BumpMajor, versioning.BumpMinor, versioning.BumpPatch:
	default:
		return fmt.Errorf("-bump must be major, minor or patch")
	}
	next, err := core.Bump(versioning.Bump(*bump))
	if err != nil {
		return err
	}
	result := plan{Previous: *previous, Bump: versioning.Bump(*bump), Tag: "v" + next.String()}
	if *expected != "" && result.Tag != *expected {
		return fmt.Errorf("planned tag %s differs from expected %s", result.Tag, *expected)
	}
	return json.NewEncoder(output).Encode(result)
}
