package main

import ui "github.com/marcuoli/go-htmx-ui"

type themeExample struct {
	Name  ui.Theme
	Label string
}

func themeExamples() []themeExample {
	return []themeExample{{ui.ThemeStandard, "Standard"}, {ui.ThemeOcean, "Ocean"}, {ui.ThemeForest, "Forest"}}
}

func themeOption() ui.EChartsOption {
	return ui.EChartsOption{
		"grid":    map[string]any{"left": 8, "right": 12, "top": 16, "bottom": 44, "containLabel": true},
		"legend":  map[string]any{"data": []string{"Requests", "Warnings"}},
		"tooltip": map[string]any{"trigger": "axis"},
		"xAxis":   map[string]any{"type": "category", "data": []string{"Mon", "Tue", "Wed", "Thu", "Fri"}},
		"yAxis":   map[string]any{"type": "value"},
		"series": []any{
			map[string]any{"id": "requests", "name": "Requests", "type": "line", "data": []int{12, 18, 14, 25, 20}},
			map[string]any{"id": "warnings", "name": "Warnings", "type": "line", "data": []int{3, 2, 4, 1, 2}},
		},
	}
}
