package chart

import "testing"

func TestNativeOptionsRejectLegacyAndExecutableValues(t *testing.T) {
	for _, value := range []any{nil, []int{1}, "not an object", EChartsOption{"datasets": []int{1}}, EChartsOption{"x": func() {}}} {
		if _, err := MarshalEChartsOption(value); err == nil {
			t.Errorf("Accepted invalid option %T", value)
		}
	}
}
