package chart

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestOutsideTooltipMetadata(t *testing.T) {
	for _, enabled := range []bool{false, true} {
		data, err := json.Marshal(EChartsConfig{TooltipOutside: enabled})
		if err != nil {
			t.Fatal(err)
		}
		if strings.Contains(string(data), `"tooltipOutside":true`) != enabled {
			t.Fatalf("outside tooltip opt-in %v serialized as %s", enabled, data)
		}
	}
}

func TestNativeOptionsRejectLegacyAndExecutableValues(t *testing.T) {
	for _, value := range []any{nil, []int{1}, "not an object", EChartsOption{"datasets": []int{1}}, EChartsOption{"x": func() {}}} {
		if _, err := MarshalEChartsOption(value); err == nil {
			t.Errorf("Accepted invalid option %T", value)
		}
	}
}
