package main

import (
	_ "embed"
	"encoding/json"
	ui "github.com/marcuoli/go-htmx-ui"
)

// All options/data are synthetic native ECharts JSON shared with real-engine tests.
//
//go:embed native-charts.json
var nativeExamplesJSON []byte

type chartExample struct {
	ID, Title, Description, Section string
	Option                          json.RawMessage
	Config                          ui.EChartsConfig
	Compact                         bool
}

func nativeExamples(section string) []chartExample {
	var all []chartExample
	if err := json.Unmarshal(nativeExamplesJSON, &all); err != nil {
		panic(err)
	}
	var selected []chartExample
	for _, example := range all {
		if example.Section == section {
			selected = append(selected, example)
		}
	}
	return selected
}
func rawOption(option json.RawMessage) string {
	var output any
	if err := json.Unmarshal(option, &output); err != nil {
		panic(err)
	}
	data, err := json.MarshalIndent(output, "", "  ")
	if err != nil {
		panic(err)
	}
	return string(data)
}
func simpleNativeOption() ui.EChartsOption {
	return ui.EChartsOption{
		"tooltip": map[string]any{"trigger": "axis"},
		"grid":    map[string]any{"top": 20, "left": 30, "right": 12, "bottom": 30, "containLabel": true},
		"xAxis":   map[string]any{"type": "category", "data": []string{"Mon", "Tue", "Wed"}},
		"yAxis":   map[string]any{"type": "value"},
		"series":  []any{map[string]any{"id": "volume", "name": "Requests", "type": "line", "data": []any{0, nil, 5}}},
	}
}
