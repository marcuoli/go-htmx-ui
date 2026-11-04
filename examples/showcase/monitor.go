package main

import (
	"encoding/json"
	"fmt"
	"math"
)

// monitorCharts supplies samples, not aggregation/collection logic. Consumers
// own transport and history; formatting never changes these raw input units.
func monitorCharts() []chartExample {
	var examples []chartExample
	for k, kind := range []string{"CPU", "Memory", "Disk", "Network"} {
		points := make([][2]any, 1800)
		rows := make([][]string, 0, 12)
		for i := range points {
			var value any = 50 + 35*math.Sin(float64(i)/37+float64(k))
			if k == 1 {
				value = (4 + math.Sin(float64(i)/80)) * 1073741824
			}
			if k == 2 {
				value = (30 + 10*math.Sin(float64(i)/71)) * 1073741824
			}
			if k == 3 {
				value = 12.5 + 6*math.Sin(float64(i)/21)
			}
			if i%127 == 0 {
				value = nil
			}
			if i == 0 {
				value = 0
			}
			points[i] = [2]any{1767225600000 + int64(i)*2000, value}
			if i >= 1788 {
				rows = append(rows, []string{fmt.Sprint(points[i][0]), fmt.Sprint(value)})
			}
		}
		axis := map[string]any{"unit": "percent", "precision": 1, "min": 0, "max": 100}
		if k == 1 || k == 2 {
			axis = map[string]any{"unit": "bytes", "inputUnit": "B", "displayUnit": "auto", "scale": "binary", "precision": 2}
		}
		if k == 3 {
			axis = map[string]any{"unit": "bytes/s", "inputUnit": "MB/s", "displayUnit": "MiB/s", "scale": "binary", "precision": 2}
		}
		spec := map[string]any{"type": "line", "locale": "pt_BR", "timeZone": "America/Sao_Paulo", "showAxisLabels": false, "showPoints": false, "domain": map[string]string{"type": "time"}, "axes": []any{axis}, "messages": map[string]string{"empty": "Sem dados", "error": "Falha no gráfico", "unavailable": "Não disponível"}, "datasets": []any{map[string]any{"label": kind, "data": points, "fill": true, "tension": 0.1}}}
		encoded, _ := json.Marshal(spec)
		examples = append(examples, chartExample{ID: fmt.Sprintf("monitor-%d", k), Title: kind, Description: "Synthetic · 1800 samples / 2 seconds · 130px · latest 12 raw samples in disclosure", Spec: string(encoded), Headers: []string{"Epoch milliseconds", "Raw input"}, Rows: rows})
	}
	return examples
}
