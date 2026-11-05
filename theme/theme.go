// Package theme defines scoped appearance settings for rendered applications.
package theme

import (
	"context"
	"fmt"
	"math"
	"strconv"
	"strings"
)

type Name string
type Mode string
type Density string

const (
	Standard    Name    = "standard"
	Ocean       Name    = "ocean"
	Forest      Name    = "forest"
	System      Mode    = "system"
	Light       Mode    = "light"
	Dark        Mode    = "dark"
	Comfortable Density = "comfortable"
	Compact     Density = "compact"
)

// Config is inherited by children of an App. The zero value uses Standard,
// System appearance and comfortable spacing. Accent customizes primary buttons
// and the first chart series; semantic text/focus colors stay theme-controlled.
type Config struct {
	Theme   Name
	Mode    Mode
	Density Density
	Accent  string
}

func (c Config) Normalize() Config {
	if c.Theme != Ocean && c.Theme != Forest {
		c.Theme = Standard
	}
	if c.Mode != Light && c.Mode != Dark {
		c.Mode = System
	}
	if c.Density != Compact {
		c.Density = Comfortable
	}
	c.Accent = hexColor(c.Accent)
	return c
}

func hexColor(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if len(value) != 4 && len(value) != 7 || !strings.HasPrefix(value, "#") {
		return ""
	}
	if _, err := strconv.ParseUint(value[1:], 16, 24); err != nil {
		return ""
	}
	if len(value) == 4 {
		value = fmt.Sprintf("#%c%c%c%c%c%c", value[1], value[1], value[2], value[2], value[3], value[3])
	}
	return value
}

// AccentStyle emits only validated hexadecimal colors. Pick the black/white
// foreground with the higher WCAG contrast instead of assuming white text works
// on every application brand color. Invalid values retain the theme defaults.
func (c Config) AccentStyle() string {
	color := hexColor(c.Accent)
	if color == "" {
		return ""
	}
	var luminance float64
	for i, weight := range []float64{.2126, .7152, .0722} {
		component, _ := strconv.ParseUint(color[1+i*2:3+i*2], 16, 8)
		linear := float64(component) / 255
		if linear <= .04045 {
			linear /= 12.92
		} else {
			linear = math.Pow((linear+.055)/1.055, 2.4)
		}
		luminance += linear * weight
	}
	ink := "#ffffff"
	if (luminance+.05)/.05 >= 1.05/(luminance+.05) {
		ink = "#000000"
	}
	return "--ghtui-primary:" + color + ";--ghtui-on-primary:" + ink + ";--ghtui-chart-1:" + color
}

type contextKey struct{}

// WithConfig preserves request cancellation while providing render-scoped
// appearance to descendants such as ThemeSwitcher. There is no global default.
func WithConfig(ctx context.Context, config Config) context.Context {
	return context.WithValue(ctx, contextKey{}, config.Normalize())
}

func FromContext(ctx context.Context) Config {
	config, _ := ctx.Value(contextKey{}).(Config)
	return config.Normalize()
}
