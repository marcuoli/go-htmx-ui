package theme

import (
	"context"
	"strings"
	"testing"
)

func TestConfigDefaultsAndInvalidValues(t *testing.T) {
	for _, c := range []Config{{}, {Theme: "invalid", Mode: "invalid", Density: "invalid", Accent: `red;display:none`}} {
		got := c.Normalize()
		if got.Theme != Standard || got.Mode != System || got.Density != Comfortable || got.Accent != "" {
			t.Fatalf("unexpected defaults: %+v", got)
		}
	}
	for _, name := range []Name{Standard, Ocean, Forest} {
		for _, mode := range []Mode{Light, Dark, System} {
			c := Config{Theme: name, Mode: mode, Density: Compact}.Normalize()
			if c.Theme != name || c.Mode != mode || c.Density != Compact {
				t.Fatalf("configuration lost: %+v", c)
			}
		}
	}
}

func TestAccentAcceptsOnlyHexAndChoosesReadableInk(t *testing.T) {
	for _, tc := range []struct{ input, color, ink string }{
		{"#FFF", "#ffffff", "#000000"}, {"#000000", "#000000", "#ffffff"}, {" #EAB308 ", "#eab308", "#000000"},
	} {
		c := (Config{Accent: tc.input}).Normalize()
		if c.Accent != tc.color || !strings.Contains(c.AccentStyle(), "--ghtui-on-primary:"+tc.ink) {
			t.Fatalf("accent %q: %+v / %s", tc.input, c, c.AccentStyle())
		}
	}
	for _, color := range []string{`#fff; color:red`, `url(https://example.com)`, `" onmouseover="x`, "red", "#12", "#12345678"} {
		if (Config{Accent: color}).AccentStyle() != "" {
			t.Fatalf("unsafe or unsupported color accepted: %q", color)
		}
	}
}

func TestRenderContextIsScopedAndPreservesCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	outer := WithConfig(ctx, Config{Theme: Ocean, Mode: Dark})
	inner := WithConfig(outer, Config{Theme: Forest, Mode: Light})
	if FromContext(outer).Theme != Ocean || FromContext(inner).Theme != Forest || FromContext(ctx).Theme != Standard {
		t.Fatal("theme configuration escaped its rendering scope")
	}
	cancel()
	if inner.Err() != context.Canceled {
		t.Fatal("theme provider detached request cancellation")
	}
}
