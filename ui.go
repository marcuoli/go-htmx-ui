package ui

import (
	"io/fs"
	"net/http"

	"github.com/a-h/templ"
	"github.com/marcuoli/go-htmx-ui/chart"
	"github.com/marcuoli/go-htmx-ui/components/auth"
	"github.com/marcuoli/go-htmx-ui/components/control"
	"github.com/marcuoli/go-htmx-ui/components/feedback"
	"github.com/marcuoli/go-htmx-ui/components/layout"
	"github.com/marcuoli/go-htmx-ui/components/status"
	"github.com/marcuoli/go-htmx-ui/components/widget"
	"github.com/marcuoli/go-htmx-ui/metric"
	"github.com/marcuoli/go-htmx-ui/theme"
	"github.com/marcuoli/go-htmx-ui/web"
	versioning "github.com/marcuoli/go-versioning"
)

// Keep the original root API source-compatible while implementations live in
// responsibility packages. Aliases let applications mix both import styles;
// forwarding functions preserve templ children through the render context.
type (
	PageHeaderProps   = control.PageHeaderProps
	TabProps          = control.TabProps
	ButtonKind        = control.ButtonKind
	ButtonProps       = control.ButtonProps
	LinkButtonProps   = control.LinkButtonProps
	FieldProps        = control.FieldProps
	InputProps        = control.InputProps
	Option            = control.Option
	SelectProps       = control.SelectProps
	DialogProps       = control.DialogProps
	DialogHeaderProps = control.DialogHeaderProps
	ModalProps        = control.ModalProps
	ModalTriggerProps = control.ModalTriggerProps
	ModalCloseProps   = control.ModalCloseProps
	ModalSize         = control.ModalSize
	AlertProps        = feedback.AlertProps
	AlertTone         = feedback.AlertTone
	ToastProps        = feedback.ToastProps
	ToastRegionProps  = feedback.ToastRegionProps
	ToastPosition     = feedback.ToastPosition
	TextFieldProps    = control.TextFieldProps
	SelectFieldProps  = control.SelectFieldProps
	LoadingStateProps = control.LoadingStateProps
	EmptyStateProps   = control.EmptyStateProps

	WidgetElement          = widget.WidgetElement
	WidgetProps            = widget.WidgetProps
	WidgetHeaderProps      = widget.WidgetHeaderProps
	WidgetMetricProps      = widget.WidgetMetricProps
	WidgetMetricStripProps = widget.WidgetMetricStripProps
	WidgetChartProps       = widget.WidgetChartProps

	StatusTone           = status.StatusTone
	StatusPulseStyle     = status.StatusPulseStyle
	StatusAlpineBindings = status.StatusAlpineBindings
	StatusIndicatorProps = status.StatusIndicatorProps

	AuthState       = auth.AuthState
	AuthStatusProps = auth.AuthStatusProps

	EChartsOption        = chart.EChartsOption
	EChartsValueFormat   = chart.EChartsValueFormat
	EChartsConversion    = chart.EChartsConversion
	EChartsFormatBinding = chart.EChartsFormatBinding
	EChartsTooltipValue  = chart.EChartsTooltipValue
	EChartsTooltip       = chart.EChartsTooltip
	EChartsBubbleSize    = chart.EChartsBubbleSize
	EChartsEvents        = chart.EChartsEvents
	EChartsMessages      = chart.EChartsMessages
	EChartsConfig        = chart.EChartsConfig

	HeadProps          = web.HeadProps
	PageProps          = web.PageProps
	AppProps           = layout.AppProps
	AppShellProps      = layout.AppShellProps
	ThemeSwitcherProps = layout.ThemeSwitcherProps
	NavItem            = layout.NavItem
	GridProps          = layout.GridProps
	Theme              = theme.Name
	Mode               = theme.Mode
	Density            = theme.Density
	ThemeConfig        = theme.Config
)

const (
	Primary          = control.Primary
	Secondary        = control.Secondary
	Danger           = control.Danger
	ModalSmall       = control.ModalSmall
	ModalMedium      = control.ModalMedium
	ModalLarge       = control.ModalLarge
	AlertInfo        = feedback.AlertInfo
	AlertSuccess     = feedback.AlertSuccess
	AlertWarning     = feedback.AlertWarning
	AlertDanger      = feedback.AlertDanger
	ToastBottomRight = feedback.ToastBottomRight
	ToastBottomLeft  = feedback.ToastBottomLeft
	ToastTopRight    = feedback.ToastTopRight
	ToastTopLeft     = feedback.ToastTopLeft

	WidgetSection = widget.WidgetSection
	WidgetDiv     = widget.WidgetDiv
	WidgetAside   = widget.WidgetAside
	WidgetNav     = widget.WidgetNav

	StatusNeutral = status.StatusNeutral
	StatusSuccess = status.StatusSuccess
	StatusWarning = status.StatusWarning
	StatusDanger  = status.StatusDanger
	StatusInfo    = status.StatusInfo
	StatusRing    = status.StatusRing
	StatusPing    = status.StatusPing

	AuthUnknown        = auth.AuthUnknown
	AuthSignedIn       = auth.AuthSignedIn
	AuthSignedOut      = auth.AuthSignedOut
	ThemeStandard      = theme.Standard
	ThemeOcean         = theme.Ocean
	ThemeForest        = theme.Forest
	ModeSystem         = theme.System
	ModeLight          = theme.Light
	ModeDark           = theme.Dark
	DensityComfortable = theme.Comfortable
	DensityCompact     = theme.Compact
)

func PageHeader(props PageHeaderProps) templ.Component     { return control.PageHeader(props) }
func Actions() templ.Component                             { return control.Actions() }
func Tabs(label string) templ.Component                    { return control.Tabs(label) }
func Tab(props TabProps) templ.Component                   { return control.Tab(props) }
func Button(props ButtonProps) templ.Component             { return control.Button(props) }
func LinkButton(props LinkButtonProps) templ.Component     { return control.LinkButton(props) }
func Field(props FieldProps) templ.Component               { return control.Field(props) }
func Input(props InputProps) templ.Component               { return control.Input(props) }
func Select(props SelectProps) templ.Component             { return control.Select(props) }
func Dialog(props DialogProps) templ.Component             { return control.Dialog(props) }
func Modal(props ModalProps) templ.Component               { return control.Modal(props) }
func ModalTrigger(props ModalTriggerProps) templ.Component { return control.ModalTrigger(props) }
func ModalClose(props ModalCloseProps) templ.Component     { return control.ModalClose(props) }
func Alert(props AlertProps) templ.Component               { return feedback.Alert(props) }
func Toast(props ToastProps) templ.Component               { return feedback.Toast(props) }
func ToastRegion(props ToastRegionProps) templ.Component   { return feedback.ToastRegion(props) }
func DialogHeader(props DialogHeaderProps) templ.Component {
	return control.DialogHeader(props)
}
func DialogBody() templ.Component                          { return control.DialogBody() }
func Badge() templ.Component                               { return control.Badge() }
func TextField(props TextFieldProps) templ.Component       { return control.TextField(props) }
func SelectField(props SelectFieldProps) templ.Component   { return control.SelectField(props) }
func LoadingState(props LoadingStateProps) templ.Component { return control.LoadingState(props) }
func EmptyState(props EmptyStateProps) templ.Component     { return control.EmptyState(props) }

// VersionLabel renders validated application metadata without probing Git.
func VersionLabel(info versioning.Info) templ.Component { return control.VersionLabel(info) }

// Widget preserves the caller's semantic container and live attributes.
func Widget(props WidgetProps) templ.Component { return widget.Widget(props) }
func WidgetHeader(props WidgetHeaderProps) templ.Component {
	return widget.WidgetHeader(props)
}
func WidgetMetricFrame(props WidgetMetricProps) templ.Component {
	return widget.WidgetMetricFrame(props)
}
func WidgetMetricStrip(props WidgetMetricStripProps) templ.Component {
	return widget.WidgetMetricStrip(props)
}
func WidgetMetric(label, value, note string) templ.Component {
	return widget.WidgetMetric(label, value, note)
}
func WidgetMetricValue(value, exact string) templ.Component {
	return widget.WidgetMetricValue(value, exact)
}
func WidgetChart(props WidgetChartProps) templ.Component { return widget.WidgetChart(props) }
func WidgetEmpty() templ.Component                       { return widget.WidgetEmpty() }
func WidgetData(label string) templ.Component            { return widget.WidgetData(label) }

// StatusIndicator renders a decorative dot and escaped visible label.
func StatusIndicator(props StatusIndicatorProps) templ.Component {
	return status.StatusIndicator(props)
}

// AuthStatus presents an explicit authentication observation supplied by the app.
func AuthStatus(props AuthStatusProps) templ.Component { return auth.AuthStatus(props) }

// MarshalEChartsOption validates and serializes a native ECharts option object.
func MarshalEChartsOption(option any) (string, error) { return chart.MarshalEChartsOption(option) }

// MetricText compacts numeric metric labels while preserving units and qualifiers.
func MetricText(value string) string { return metric.MetricText(value) }

// Head emits shared assets once in a full page's head.
func Head(props HeadProps) templ.Component { return web.Head(props) }

// Assets returns embedded assets without a repository path prefix.
func Assets() fs.FS { return web.Assets() }

// AssetHandler serves assets at an application-owned URL prefix.
func AssetHandler(prefix string) http.Handler { return web.AssetHandler(prefix) }

// Page supplies document metadata, shared assets and scoped app defaults.
func Page(props PageProps) templ.Component                   { return web.Page(props) }
func App(props AppProps) templ.Component                     { return layout.App(props) }
func AppShell(props AppShellProps) templ.Component           { return layout.AppShell(props) }
func ThemeSwitcher(props ThemeSwitcherProps) templ.Component { return layout.ThemeSwitcher(props) }
func Stack() templ.Component                                 { return layout.Stack() }
func Grid(props GridProps) templ.Component                   { return layout.Grid(props) }
