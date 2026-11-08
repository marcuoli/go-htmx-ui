// Package frontendbuild owns the pinned official Tailwind compiler used by apps.
package frontendbuild

import (
	"context"
	"crypto/sha256"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
)

//go:embed tailwind.json
var releaseJSON []byte

type asset struct {
	Name   string `json:"name"`
	SHA256 string `json:"sha256"`
	Size   int64  `json:"size"`
}
type release struct {
	Version   string           `json:"version"`
	Platforms map[string]asset `json:"platforms"`
}

type Options struct {
	Input, Output, CacheDir string
	Sources                 []string
	Minify, Musl            bool
}

func currentRelease() (release, error) {
	var r release
	if err := json.Unmarshal(releaseJSON, &r); err != nil {
		return r, fmt.Errorf("read embedded Tailwind release: %w", err)
	}
	return r, nil
}

// Compile preserves the original input's import/source bases by importing it in
// a temporary entry stylesheet. Extra source directories (such as Go table
// modules) are composed here; app input and dependency source are never patched.
// The caller supplies its generated-data cache/output and scoped TEMP directory.
func Compile(ctx context.Context, o Options, stdout, stderr io.Writer) (err error) {
	input, err := filepath.Abs(o.Input)
	if err != nil || o.Input == "" {
		return errors.New("--input is required")
	}
	output, err := filepath.Abs(o.Output)
	if err != nil || o.Output == "" {
		return errors.New("--output is required")
	}
	info, err := os.Stat(input)
	if err != nil {
		return fmt.Errorf("input stylesheet: %w", err)
	}
	if !info.Mode().IsRegular() {
		return errors.New("input must be a regular stylesheet file")
	}
	outputMode := os.FileMode(0644)
	if existing, e := os.Stat(output); e == nil {
		if os.SameFile(info, existing) {
			return errors.New("output must differ from input")
		}
		if !existing.Mode().IsRegular() {
			return errors.New("output must be a regular stylesheet file")
		}
		outputMode = existing.Mode().Perm()
		if outputMode&0222 == 0 {
			return errors.New("output stylesheet is read-only")
		}
	} else if !errors.Is(e, os.ErrNotExist) {
		return fmt.Errorf("output stylesheet: %w", e)
	}
	if input == output {
		return errors.New("output must differ from input")
	}
	if !filepath.IsAbs(o.CacheDir) || filepath.Dir(o.CacheDir) == o.CacheDir {
		return errors.New("set --cache-dir or GO_HTMX_UI_TAILWIND_CACHE to an absolute generated-tool directory")
	}
	for _, path := range append([]string{input}, o.Sources...) {
		if strings.ContainsAny(path, "\r\n\f") {
			return errors.New("CSS input/source paths cannot contain line breaks")
		}
	}
	sources := make([]string, 0, len(o.Sources))
	for _, source := range o.Sources {
		absolute, e := filepath.Abs(source)
		if e != nil {
			return e
		}
		sourceInfo, e := os.Stat(absolute)
		if e != nil || !sourceInfo.IsDir() {
			return fmt.Errorf("source directory does not exist: %s", source)
		}
		sources = append(sources, absolute)
	}
	r, err := currentRelease()
	if err != nil {
		return err
	}
	key := runtime.GOOS + "/" + runtime.GOARCH
	if o.Musl {
		if runtime.GOOS != "linux" {
			return errors.New("--musl is supported only on Linux")
		}
		key += "-musl"
	}
	selected, ok := r.Platforms[key]
	if !ok {
		return fmt.Errorf("no official Tailwind %s compiler for %s", r.Version, key)
	}
	client := &http.Client{Timeout: 2 * time.Minute, CheckRedirect: func(req *http.Request, via []*http.Request) error {
		host := req.URL.Hostname()
		if len(via) > 5 || req.URL.Scheme != "https" || (host != "github.com" && host != "release-assets.githubusercontent.com" && host != "objects.githubusercontent.com") {
			return errors.New("unexpected compiler download redirect")
		}
		return nil
	}}
	binary, err := install(ctx, o.CacheDir, r.Version, selected, client)
	if err != nil {
		return err
	}
	if err = os.MkdirAll(filepath.Dir(output), 0755); err != nil {
		return fmt.Errorf("output directory: %w", err)
	}
	entry, err := os.CreateTemp("", "go-htmx-ui-css-*.css")
	if err != nil {
		return fmt.Errorf("temporary CSS entry: %w", err)
	}
	defer func() { err = errors.Join(err, removeOwned(entry.Name())) }()
	if _, err = fmt.Fprintf(entry, "@import %s;\n", strconv.Quote(filepath.ToSlash(input))); err != nil {
		entry.Close()
		return err
	}
	for _, absolute := range sources {
		if _, err = fmt.Fprintf(entry, "@source %s;\n", strconv.Quote(filepath.ToSlash(absolute))); err != nil {
			entry.Close()
			return err
		}
	}
	if err = entry.Close(); err != nil {
		return err
	}
	staged, err := os.CreateTemp(filepath.Dir(output), ".go-htmx-ui-css-*.css")
	if err != nil {
		return err
	}
	if err = staged.Close(); err != nil {
		os.Remove(staged.Name())
		return err
	}
	defer func() { err = errors.Join(err, removeOwned(staged.Name())) }()
	args := []string{"--input", entry.Name(), "--output", staged.Name()}
	if o.Minify {
		args = append(args, "--minify")
	}
	command := exec.CommandContext(ctx, binary, args...)
	command.Stdout = stdout
	command.Stderr = stderr
	if err = command.Run(); err != nil {
		return fmt.Errorf("Tailwind %s compile: %w", r.Version, err)
	}
	result, err := os.Stat(staged.Name())
	if err != nil {
		return err
	}
	if result.Size() == 0 {
		return errors.New("Tailwind produced an empty stylesheet")
	}
	// Generated CSS is server-readable by default; preserve an existing output's mode.
	if err = os.Chmod(staged.Name(), outputMode); err != nil {
		return err
	}
	if err = os.Rename(staged.Name(), output); err != nil {
		return fmt.Errorf("publish compiled stylesheet: %w", err)
	}
	return nil
}

func removeOwned(path string) error {
	err := os.Remove(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	return err
}

// install checks every cached executable before reuse. An unexpected/corrupt
// cache file is preserved and rejected; no automatic overwrite or repair.
// Unique adjacent download staging and rename support concurrent first use.
func install(ctx context.Context, cache, version string, a asset, client *http.Client) (path string, err error) {
	directory := filepath.Join(cache, version)
	if err = os.MkdirAll(directory, 0755); err != nil {
		return "", fmt.Errorf("compiler cache: %w", err)
	}
	for _, dir := range []string{cache, directory} {
		info, e := os.Lstat(dir)
		if e != nil {
			return "", e
		}
		if info.Mode()&os.ModeSymlink != 0 {
			return "", errors.New("compiler cache must not redirect through a symlink")
		}
	}
	path = filepath.Join(directory, a.Name)
	if _, e := os.Lstat(path); e == nil {
		if e = verifyCompiler(path, a); e != nil {
			return "", e
		}
		return path, nil
	} else if !errors.Is(e, os.ErrNotExist) {
		return "", e
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://github.com/tailwindlabs/tailwindcss/releases/download/v"+version+"/"+a.Name, nil)
	if err != nil {
		return "", err
	}
	response, err := client.Do(request)
	if err != nil {
		return "", fmt.Errorf("download official Tailwind: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download official Tailwind: HTTP %d", response.StatusCode)
	}
	download, err := os.CreateTemp(directory, ".tailwind-download-*")
	if err != nil {
		return "", err
	}
	defer func() { err = errors.Join(err, removeOwned(download.Name())) }()
	hash := sha256.New()
	n, copyErr := io.Copy(io.MultiWriter(download, hash), io.LimitReader(response.Body, a.Size+1))
	closeErr := download.Close()
	if err = errors.Join(copyErr, closeErr); err != nil {
		return "", fmt.Errorf("save compiler download: %w", err)
	}
	if n != a.Size || hex.EncodeToString(hash.Sum(nil)) != a.SHA256 {
		return "", errors.New("official compiler size/SHA256 mismatch; download not installed")
	}
	if err = os.Chmod(download.Name(), 0755); err != nil {
		return "", err
	}
	// A competing installer may have finished while this process downloaded.
	if _, e := os.Lstat(path); e == nil {
		if e = verifyCompiler(path, a); e != nil {
			return "", e
		}
		return path, nil
	} else if !errors.Is(e, os.ErrNotExist) {
		return "", e
	}
	if err = os.Rename(download.Name(), path); err != nil {
		if verified := verifyCompiler(path, a); verified == nil {
			return path, nil
		}
		return "", fmt.Errorf("install verified compiler: %w", err)
	}
	return path, nil
}

func verifyCompiler(path string, a asset) error {
	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() || info.Size() != a.Size {
		return errors.New("cached compiler is unexpected; preserve it and use a clean cache directory")
	}
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	hash := sha256.New()
	if _, err = io.Copy(hash, file); err != nil {
		return err
	}
	if hex.EncodeToString(hash.Sum(nil)) != a.SHA256 {
		return errors.New("cached compiler SHA256 mismatch; preserve it and use a clean cache directory")
	}
	return nil
}
