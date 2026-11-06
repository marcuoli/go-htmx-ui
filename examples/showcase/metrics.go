package main

type metricExample struct {
	Key, Label, Value, Exact, Note string
}

func stripExamples() []metricExample {
	return []metricExample{
		{"input", "Input tokens", "682888", "682,888 input tokens", "Reported usage"},
		{"output", "Output tokens", "1234567", "1,234,567 output tokens", "Reported usage"},
		{"cached", "Cached input tokens", "18446744073709551615", "18,446,744,073,709,551,615 cached input tokens", "Exact integer retained"},
		{"turns", "Reported turns", "0", "0 reported turns", "Zero is reported data"},
		{"duration", "Longest running turn", "11h 47m 27s", "11 hours 47 minutes 27 seconds", "Synthetic duration"},
		{"context", "Context window", "200000", "200,000 tokens", "Optional provider field"},
		{"cost", "Estimated cost", "USD 0.048712", "0.048712 United States dollars", "Synthetic estimate"},
		{"active", "Active sessions", "12", "12 active sessions", ""},
	}
}
