package widget

import (
	"encoding/json"
	"fmt"

	"github.com/marcuoli/go-htmx-ui/chart"
)

func widgetChartJSON(props WidgetChartProps) (string, string, error) {
	option, err := chart.MarshalEChartsOption(props.Option)
	if err != nil {
		return "", "", err
	}
	config, err := json.Marshal(props.Config)
	if err != nil {
		return "", "", fmt.Errorf("marshal ECharts config: %w", err)
	}
	return option, string(config), nil
}
