package chart

import (
	"encoding/json"
	"fmt"
)

// EChartsOption is a native ECharts option object. Fields such as series, xAxis,
// yAxis, legend, grid and dataZoom use the upstream JSON contract directly.
// It is not a library-specific chart schema. Functions cannot be serialized.
type EChartsOption map[string]any

// EChartsValueFormat describes display-only conversion; samples and bounds stay
// in their native input units. Unit "time" uses Locale/TimeZone, numeric units use
// the documented bit/byte/rate/custom conversion rules.
type EChartsValueFormat struct {
	Unit        string             `json:"unit,omitempty"`
	Precision   *int               `json:"precision,omitempty"`
	Scale       string             `json:"scale,omitempty"`
	InputUnit   string             `json:"inputUnit,omitempty"`
	DisplayUnit string             `json:"displayUnit,omitempty"`
	Conversion  *EChartsConversion `json:"conversion,omitempty"`
}
type EChartsConversion struct {
	Factor float64 `json:"factor"`
	Offset float64 `json:"offset,omitempty"`
}

// EChartsFormatBinding installs a trusted callback only at a documented native
// formatter target. Dimension selects a vector coordinate; nil means scalar.
type EChartsFormatBinding struct {
	Target    string             `json:"target"`
	Format    EChartsValueFormat `json:"format"`
	Dimension *int               `json:"dimension,omitempty"`
	Compact   bool               `json:"compact,omitempty"`
}
type EChartsTooltipValue struct {
	Dimension *int               `json:"dimension,omitempty"`
	Label     string             `json:"label,omitempty"`
	Format    EChartsValueFormat `json:"format"`
}
type EChartsTooltip struct {
	SeriesID    string                `json:"seriesId,omitempty"`
	SeriesIndex *int                  `json:"seriesIndex,omitempty"`
	Values      []EChartsTooltipValue `json:"values"`
}

// EChartsBubbleSize supplies the numeric dimension used by the native scatter
// symbolSize callback. Min/Max are accepted diameter bounds, not inferred weights.
type EChartsBubbleSize struct {
	SeriesID    string   `json:"seriesId,omitempty"`
	SeriesIndex *int     `json:"seriesIndex,omitempty"`
	Dimension   int      `json:"dimension"`
	Min         *float64 `json:"min,omitempty"`
	Max         *float64 `json:"max,omitempty"`
}
type EChartsEvents struct {
	Select bool `json:"select,omitempty"`
	Zoom   bool `json:"zoom,omitempty"`
}
type EChartsMessages struct {
	Empty       string `json:"empty,omitempty"`
	Error       string `json:"error,omitempty"`
	Unavailable string `json:"unavailable,omitempty"`
	Loading     string `json:"loading,omitempty"`
}

// EChartsConfig contains only callbacks JSON cannot encode and shared lifecycle
// state. Geometry, chart families and data are always native Option fields.
type EChartsConfig struct {
	// TooltipOutside keeps short-chart tooltips outside the canvas. The shared
	// runtime owns a text-only, viewport-bounded popup; native HTML stays disabled.
	TooltipOutside bool                   `json:"tooltipOutside,omitempty"`
	Locale         string                 `json:"locale,omitempty"`
	TimeZone       string                 `json:"timeZone,omitempty"`
	Formats        []EChartsFormatBinding `json:"formats,omitempty"`
	Tooltip        []EChartsTooltip       `json:"tooltip,omitempty"`
	BubbleSizes    []EChartsBubbleSize    `json:"bubbleSizes,omitempty"`
	Events         EChartsEvents          `json:"events,omitzero"`
	Messages       EChartsMessages        `json:"messages,omitzero"`
	Empty          bool                   `json:"empty,omitempty"`
	Loading        bool                   `json:"loading,omitempty"`
}

// MarshalEChartsOption serializes native JSON without generating JavaScript or
// trusting HTML. Widgets escape the result into an attribute; JS-only clients use
// JSON.stringify with the same native object. Runtime validation also applies.
func MarshalEChartsOption(option any) (string, error) {
	data, err := json.Marshal(option)
	if err != nil {
		return "", fmt.Errorf("marshal ECharts option: %w", err)
	}
	var object map[string]json.RawMessage
	if err = json.Unmarshal(data, &object); err != nil || object == nil {
		return "", fmt.Errorf("ECharts option must be a native JSON object")
	}
	for _, key := range []string{"labels", "datasets", "type"} {
		if _, ok := object[key]; ok {
			return "", fmt.Errorf("ECharts option uses retired schema field %q", key)
		}
	}
	return string(data), nil
}
