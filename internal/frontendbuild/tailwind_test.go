package frontendbuild

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

type roundTrip func(*http.Request) (*http.Response, error)

func (f roundTrip) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func TestPinnedCompilerMatchesAssetBuilder(t *testing.T) {
	r, err := currentRelease()
	if err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(filepath.Join("..", "..", "web", "package.json"))
	if err != nil {
		t.Fatal(err)
	}
	var p struct {
		DevDependencies map[string]string `json:"devDependencies"`
	}
	if err = json.Unmarshal(data, &p); err != nil {
		t.Fatal(err)
	}
	if r.Version != p.DevDependencies["tailwindcss"] || r.Version != p.DevDependencies["@tailwindcss/cli"] {
		t.Fatal("shared browser/build compiler pins diverged")
	}
	if len(r.Platforms) != 7 {
		t.Fatalf("official platform set changed: %d", len(r.Platforms))
	}
	for _, a := range r.Platforms {
		if len(a.SHA256) != 64 || a.Size <= 0 || strings.ContainsAny(a.Name, "/\\") {
			t.Fatal("invalid pinned compiler", a)
		}
	}
}
func TestCompilerCacheVerifiedBeforeReuseAndCorruptionPreserved(t *testing.T) {
	content := []byte("test-only compiler fixture, never executed")
	sum := sha256.Sum256(content)
	a := asset{Name: "fixture-compiler", SHA256: hex.EncodeToString(sum[:]), Size: int64(len(content))}
	requests := 0
	client := &http.Client{Transport: roundTrip(func(r *http.Request) (*http.Response, error) {
		requests++
		if r.URL.Scheme != "https" || r.URL.Host != "github.com" {
			t.Fatal(r.URL)
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(bytes.NewReader(content))}, nil
	})}
	cache := t.TempDir()
	path, err := install(context.Background(), cache, "4.3.4", a, client)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = install(context.Background(), cache, "4.3.4", a, client); err != nil || requests != 1 {
		t.Fatal("valid cache fetched again", err, requests)
	}
	changed := bytes.Repeat([]byte("x"), len(content))
	if err = os.WriteFile(path, changed, 0755); err != nil {
		t.Fatal(err)
	}
	if _, err = install(context.Background(), cache, "4.3.4", a, client); err == nil {
		t.Fatal("corrupt compiler reused")
	}
	kept, _ := os.ReadFile(path)
	if !bytes.Equal(kept, changed) || requests != 1 {
		t.Fatal("corrupt cache silently overwritten")
	}
}
func TestCompilerDownloadMismatchNeverInstalled(t *testing.T) {
	content := []byte("untrusted response")
	a := asset{Name: "fixture", SHA256: strings.Repeat("0", 64), Size: int64(len(content))}
	client := &http.Client{Transport: roundTrip(func(*http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: 200, Body: io.NopCloser(bytes.NewReader(content))}, nil
	})}
	cache := t.TempDir()
	if _, err := install(context.Background(), cache, "4.3.4", a, client); err == nil {
		t.Fatal("bad checksum installed")
	}
	children, err := os.ReadDir(filepath.Join(cache, "4.3.4"))
	if err != nil || len(children) != 0 {
		t.Fatal("unverified/partial executable left behind", children, err)
	}
}
func TestCompileRejectsOutputInputCollisionBeforeDownloading(t *testing.T) {
	input := filepath.Join(t.TempDir(), "input.css")
	if err := os.WriteFile(input, []byte(".retained{}"), 0600); err != nil {
		t.Fatal(err)
	}
	err := Compile(context.Background(), Options{Input: input, Output: input, CacheDir: t.TempDir()}, io.Discard, io.Discard)
	if err == nil || !strings.Contains(err.Error(), "output must differ") {
		t.Fatal(err)
	}
	kept, _ := os.ReadFile(input)
	if string(kept) != ".retained{}" {
		t.Fatal("input overwritten")
	}
}

func TestMissingExtraSourceRejectedBeforeCacheOrNetwork(t *testing.T) {
	root := t.TempDir()
	input := filepath.Join(root, "input.css")
	if err := os.WriteFile(input, []byte(".kept{}"), 0600); err != nil {
		t.Fatal(err)
	}
	cache := filepath.Join(root, "not-created")
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	err := Compile(ctx, Options{Input: input, Output: filepath.Join(root, "out.css"), CacheDir: cache, Sources: []string{filepath.Join(root, "missing-source")}}, io.Discard, io.Discard)
	if err == nil || !strings.Contains(err.Error(), "source directory does not exist") {
		t.Fatal(err)
	}
	if _, err = os.Stat(cache); !os.IsNotExist(err) {
		t.Fatal("invalid input caused compiler cache/network work", err)
	}
}

func TestReadonlyOutputPreservedBeforeBuild(t *testing.T) {
	root := t.TempDir()
	input := filepath.Join(root, "input.css")
	output := filepath.Join(root, "out.css")
	if err := os.WriteFile(input, []byte(".input{}"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(output, []byte(".preserved{}"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(output, 0444); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chmod(output, 0600) })
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	err := Compile(ctx, Options{Input: input, Output: output, CacheDir: filepath.Join(root, "cache")}, io.Discard, io.Discard)
	if err == nil || !strings.Contains(err.Error(), "read-only") {
		t.Fatal(err)
	}
	kept, err := os.ReadFile(output)
	if err != nil || string(kept) != ".preserved{}" {
		t.Fatal("protected stylesheet changed", err)
	}
}
