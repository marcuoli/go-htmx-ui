package main

import (
	"encoding/json"
	"fmt"
)

// These examples supply raw values and histogram bins explicitly. The library
// renders them; it does not calculate application statistics or collect data.
func familyCharts() []chartExample {
	examples := []chartExample{
		{ID: "family-pie", Title: "Pie", Description: "Category counts; zero remains a real value", Spec: `{"type":"pie","labels":["Queued","Completed","Failed"],"datasets":[{"label":"Requests","data":[0,70,5]}]}`},
		{ID: "family-scatter", Title: "Scatter with zoom", Description: "Numeric latency / percentage load; bottom slider controls x range", Spec: `{"type":"scatter","domain":{"type":"value","unit":"ms","label":"Latency","min":0,"max":40},"axes":[{"unit":"percent","min":0,"max":100}],"legend":{"show":true},"zoom":{"enabled":true,"slider":true},"events":{"select":true,"zoom":true},"datasets":[{"label":"Load","data":[[0,0],[12.5,80],[20,55],[35,null]]}]}`},
		{ID: "family-bubble", Title: "Bubble", Description: "Third coordinate is an explicit pixel diameter, not an inferred business weight", Spec: `{"type":"bubble","domain":{"type":"value","unit":"ms","label":"Latency","min":0,"max":25},"axes":[{"unit":"percent","min":0,"max":100}],"events":{"select":true},"datasets":[{"label":"Load","data":[[2,20,8],[12,60,24],[20,30,40]]}]}`},
		{ID: "family-heatmap", Title: "Heatmap", Description: "Precomputed cells; a missing cell is omitted, distinct from a zero", Spec: `{"type":"heatmap","locale":"pt_BR","labels":["Mon","Tue","Wed","Thu"],"rows":["Morning","Afternoon","Evening"],"axes":[{"unit":"percent"}],"cellLabels":true,"colorRange":{"min":0,"max":100},"datasets":[{"label":"Load","data":[[0,0,0],[1,0,25],[2,0,null],[3,0,90],[0,1,30],[1,1,65],[2,1,10],[3,1,45],[0,2,15],[1,2,25],[2,2,50],[3,2,75]]}]}`},
		{ID: "family-radar", Title: "Radar", Description: "Complete vectors on declared comparable percentage ranges", Spec: `{"type":"radar","indicators":[{"name":"CPU","max":100},{"name":"Memory","max":100},{"name":"Disk","max":100},{"name":"Network","max":100}],"axes":[{"unit":"percent"}],"datasets":[{"label":"Current","fill":true,"data":[0,40,70,55]},{"label":"Prior","data":[20,50,80,25]}]}`},
		{ID: "family-gauge", Title: "Gauge", Description: "One raw value; range and unit are declared by the application", Spec: `{"type":"gauge","axes":[{"unit":"percent","min":0,"max":100}],"datasets":[{"label":"Capacity","data":[67]}]}`},
		{ID: "family-gauge-missing", Title: "Missing gauge", Description: "Missing does not become zero", Spec: `{"type":"gauge","messages":{"unavailable":"No disponible"},"datasets":[{"label":"Capacity","data":[null]}]}`},
		{ID: "family-area", Title: "Stacked area", Description: "Existing line/fill/stack contract; explicit null gap", Spec: `{"type":"line","stacked":true,"legend":{"show":true},"labels":["A","B","C","D"],"datasets":[{"label":"A","fill":true,"tension":0.2,"data":[0,3,null,4]},{"label":"B","fill":true,"tension":0.2,"data":[2,1,3,2]}]}`},
	}
	return exampleTables(examples)
}

func microCharts() []chartExample {
	return exampleTables([]chartExample{
		{ID: "micro-line", Title: "Line sparkline", Description: "Hidden labels / markers", Spec: `{"type":"line","showAxisLabels":false,"showPoints":false,"labels":["A","B","C","D","E","F"],"datasets":[{"data":[0,2,1,null,4,3]}]}`},
		{ID: "micro-area", Title: "Area sparkline", Description: "Same reusable line with fill", Spec: `{"type":"line","showAxisLabels":false,"showPoints":false,"labels":["A","B","C","D","E","F"],"datasets":[{"fill":true,"tension":0.2,"data":[0,2,1,null,4,3]}]}`},
		{ID: "micro-bar", Title: "Bar sparkline", Description: "Zero and missing remain distinct", Spec: `{"type":"bar","showAxisLabels":false,"labels":["A","B","C","D","E","F"],"datasets":[{"data":[0,2,1,null,4,3]}]}`},
		{ID: "micro-ring", Title: "Compact ring", Description: "Existing compact contract", Spec: `{"type":"doughnut","compact":true,"labels":["Done","Waiting"],"datasets":[{"data":[8,2]}]}`},
	})
}

// The data disclosure presents raw inputs, including arrays/null. Live showcase
// controls rebuild these rows with textContent alongside each new chart snapshot.
func exampleTables(examples []chartExample) []chartExample {
	for i := range examples {
		var spec struct {
			Type       string
			Labels     []any
			Rows       []any
			Indicators []struct{ Name string }
			Datasets   []struct {
				Label string
				Data  []any
			}
		}
		if err := json.Unmarshal([]byte(examples[i].Spec), &spec); err != nil {
			panic(err)
		}
		examples[i].Headers = []string{"Series", "Category / index", "Raw value(s)"}
		for j, dataset := range spec.Datasets {
			name := dataset.Label
			if name == "" {
				name = fmt.Sprint(j + 1)
			}
			for k, value := range dataset.Data {
				position := fmt.Sprint(k + 1)
				if k < len(spec.Labels) {
					position = fmt.Sprint(spec.Labels[k])
				}
				if k < len(spec.Indicators) {
					position = spec.Indicators[k].Name
				}
				if spec.Type == "heatmap" {
					cell := value.([]any)
					position = fmt.Sprint(spec.Labels[int(cell[0].(float64))]) + " / " + fmt.Sprint(spec.Rows[int(cell[1].(float64))])
				}
				raw, _ := json.Marshal(value)
				examples[i].Rows = append(examples[i].Rows, []string{name, position, string(raw)})
			}
		}
	}
	return examples
}
