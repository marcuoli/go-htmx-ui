// Package testutil provides shared rendering assertions for the library's tests.
package testutil

import (
	"bytes"
	"context"
	"io"
	"testing"

	"github.com/a-h/templ"
)

// Render renders a component with optional trusted child markup and fails the test on error.
func Render(t *testing.T, component templ.Component, children string) string {
	t.Helper()
	ctx := context.Background()
	if children != "" {
		ctx = templ.WithChildren(ctx, templ.ComponentFunc(func(_ context.Context, w io.Writer) error {
			_, err := io.WriteString(w, children)
			return err
		}))
	}
	var body bytes.Buffer
	if err := component.Render(ctx, &body); err != nil {
		t.Fatal(err)
	}
	return body.String()
}
