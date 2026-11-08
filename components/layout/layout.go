// Package layout provides scoped app appearance and optional page structure.
package layout

import (
	"strconv"

	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/theme"
)

// AppProps scopes defaults to its subtree. StorageKey separates preferences for
// apps sharing an origin; empty uses go-htmx-ui:appearance. DisablePersistence
// is useful for embedded previews. Attributes are trusted application markup;
// class and reserved data-ui appearance markers are configured through props.
type AppProps struct {
	ID, Class          string
	Theme              theme.Name
	Mode               theme.Mode
	Density            theme.Density
	Accent, StorageKey string
	DisablePersistence bool
	Attributes         templ.Attributes
}

// AppearanceToggleStyle selects plain icons by default or an explicit boxed button.
type AppearanceToggleStyle string

const (
	AppearancePlain  AppearanceToggleStyle = "plain"
	AppearanceButton AppearanceToggleStyle = "button"
)

// AppearanceToggleProps localizes the next action, rather than the current mode.
// LightLabel defaults to "Switch to light mode"; DarkLabel to "Switch to dark mode".
type AppearanceToggleProps struct {
	Class, LightLabel, DarkLabel string
	Style                        AppearanceToggleStyle
}

// ModeLabel labels the appearance group; LightLabel/DarkLabel label its action.
type ThemeSwitcherProps struct {
	Class, ThemeLabel, ModeLabel string
	LightLabel, DarkLabel        string
	AppearanceStyle              AppearanceToggleStyle
}

type NavItem struct {
	Label, Href string
	Active      bool
}

// AppShellProps supplies application-owned content/links. An empty Nav/Sidebar
// omits the sidebar; Actions/Footer are optional components. ID is stable for
// HTMX patches; give multiple shells on a page distinct IDs.
type AppShellProps struct {
	ID, Class, Title, Description, BrandHref string
	Nav                                      []NavItem
	Sidebar, Actions, Footer                 templ.Component
	HideThemeSwitcher                        bool
	AppearanceStyle                          AppearanceToggleStyle
}

// GridProps.Columns is 1–4 for a fixed responsive column count; zero/invalid
// values use automatically fitted columns. Children remain ordinary templ slots.
type GridProps struct {
	Columns int
	Class   string
}

func appConfig(p AppProps) theme.Config {
	return (theme.Config{Theme: p.Theme, Mode: p.Mode, Density: p.Density, Accent: p.Accent}).Normalize()
}

func appAttributes(p AppProps) templ.Attributes {
	attrs := templ.Attributes{}
	if p.ID != "" {
		attrs["id"] = p.ID
	}
	if style := appConfig(p).AccentStyle(); style != "" {
		attrs["style"] = style
	}
	key := p.StorageKey
	if key == "" {
		key = "go-htmx-ui:appearance"
	}
	attrs["data-ui-storage-key"] = key
	if p.DisablePersistence {
		attrs["data-ui-persist"] = "false"
	}
	for key, value := range p.Attributes {
		switch key {
		case "class", "data-ui-app", "data-ui-theme", "data-ui-mode", "data-ui-density", "data-ui-resolved-mode", "data-ui-storage-key", "data-ui-persist":
			continue
		}
		attrs[key] = value
	}
	return attrs
}

func fallback(value, defaultValue string) string {
	if value != "" {
		return value
	}
	return defaultValue
}

func appearanceLabel(dark bool, lightLabel, darkLabel string) string {
	if dark {
		return lightLabel
	}
	return darkLabel
}

func shellID(p AppShellProps) string       { return fallback(p.ID, "ghtui-shell") }
func shellHasSidebar(p AppShellProps) bool { return len(p.Nav) > 0 || p.Sidebar != nil }
func shellHref(p AppShellProps) string     { return fallback(p.BrandHref, "/") }
func navAttributes(active bool) templ.Attributes {
	if active {
		return templ.Attributes{"aria-current": "page"}
	}
	return nil
}
func columns(p GridProps) string {
	if p.Columns < 1 || p.Columns > 4 {
		return "auto"
	}
	return strconv.Itoa(p.Columns)
}
