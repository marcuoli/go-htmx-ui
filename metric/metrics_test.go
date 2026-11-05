package metric

import "testing"

func TestMetricFormattingPreservesPrecisionAndQualifiers(t *testing.T) {
	for in, want := range map[string]string{"682888": "682.89K", "999999": "1M", "192000": "192K", "0.0001": "0.0001", "USD 1234567 (partial)": "USD 1.23M (partial)", "Unavailable": "Unavailable", "13.5s": "13.5s", "1,234,567": "1.23M"} {
		if got := MetricText(in); got != want {
			t.Errorf("%s = %s; want %s", in, got, want)
		}
	}
}
