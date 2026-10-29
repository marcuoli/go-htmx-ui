package ui

import (
	"math/big"
	"regexp"
	"strings"
)

var metricNumber = regexp.MustCompile(`^(?:[0-9]+|[1-9][0-9]{0,2}(?:,[0-9]{3})+)(?:\.[0-9]+)?$`)

// Format only numeric metric labels. Keep units, unavailable values, small
// precise costs and partial-coverage qualifiers in their original form.
func MetricText(value string) string {
	numeric, currency := strings.CutPrefix(value, "USD ")
	numeric, partial := strings.CutSuffix(numeric, " (partial)")
	if !metricNumber.MatchString(numeric) {
		return value
	}
	text := compactMetricNumber(strings.ReplaceAll(numeric, ",", ""))
	if currency {
		text = "USD " + text
	}
	if partial {
		text += " (partial)"
	}
	return text
}

// Exact decimal arithmetic keeps large integers and rounding boundaries stable.
// The original string remains the tooltip/accessibility label at the component.
func compactMetricNumber(value string) string {
	decimal := value
	if !strings.ContainsRune(decimal, '.') {
		decimal += ".0" // Force decimal parsing, including leading-zero values.
	}
	n, ok := new(big.Rat).SetString(decimal)
	thousand := big.NewRat(1000, 1)
	if !ok || n.Cmp(thousand) < 0 {
		return value
	}
	units := [...]string{"K", "M", "B", "T", "P", "E", "Z", "Y"}
	scale, unit := big.NewRat(1000, 1), 0
	for unit+1 < len(units) {
		next := new(big.Rat).Mul(scale, thousand)
		if n.Cmp(next) < 0 {
			break
		}
		scale, unit = next, unit+1
	}
	text := new(big.Rat).Quo(n, scale).FloatString(2)
	if text == "1000.00" && unit+1 < len(units) {
		scale.Mul(scale, thousand)
		unit++
		text = new(big.Rat).Quo(n, scale).FloatString(2)
	}
	return strings.TrimRight(strings.TrimRight(text, "0"), ".") + units[unit]
}
