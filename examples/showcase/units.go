package main

// Input values stay in their original units. The controls change only format
// declarations, so graph geometry and accessible raw-input disclosures agree.
func unitCharts() []chartExample {
	return exampleTables([]chartExample{
		{ID: "units-network", Title: "Switch data-rate units", Description: "Raw MB/s samples · converted labels/tooltips · unit selection preserves zoom and instance", Spec: `{"type":"line","locale":"pt_BR","timeZone":"UTC","domain":{"type":"time"},"axes":[{"unit":"data-rate","inputUnit":"MB/s","displayUnit":"MiB/h","precision":2}],"zoom":{"enabled":true,"slider":true},"events":{"zoom":true},"datasets":[{"label":"Network","data":[[1767225600000,0],[1767225602000,6.25],[1767225604000,12.5],[1767225606000,null],[1767225608000,25]]}]}`},
		{ID: "units-rate", Title: "Named rate", Description: "Equivalent requests/h from raw requests/s; no hourly total is calculated", Spec: `{"type":"bar","labels":["A","B","C","D","E"],"axes":[{"unit":"rate","inputUnit":"requests/s","displayUnit":"requests/h"}],"datasets":[{"label":"Requests","data":[0,0.5,1,null,2]}]}`},
		{ID: "units-custom", Title: "Explicit custom conversion", Description: "Raw Celsius to Fahrenheit: factor 1.8, offset 32", Spec: `{"type":"gauge","axes":[{"unit":"custom","inputUnit":"°C","displayUnit":"°F","conversion":{"factor":1.8,"offset":32},"min":-20,"max":50,"precision":1}],"datasets":[{"label":"Temperature","data":[20]}]}`},
	})
}
