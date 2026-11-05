package main

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
)

func TestModulePlanMatchesReleaseAndWritesJSON(t *testing.T) {
	var output bytes.Buffer
	if err := run([]string{"-previous", "v0.6.0", "-bump", "minor", "-check", "v0.7.0"}, &output); err != nil {
		t.Fatal(err)
	}
	var got plan
	if err := json.Unmarshal(output.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got.Previous != "v0.6.0" || got.Bump != "minor" || got.Tag != "v0.7.0" {
		t.Fatalf("unexpected release plan: %+v", got)
	}
}

func TestModulePlanRejectsInvalidOrConflictingReleaseInput(t *testing.T) {
	for _, tc := range []struct {
		name string
		args []string
	}{
		{"missing previous", []string{"-bump", "minor"}},
		{"application tag", []string{"-previous", "v0.6.0+20261105.12", "-bump", "minor"}},
		{"snapshot", []string{"-previous", "v0.6.0-snapshot", "-bump", "minor"}},
		{"missing bump", []string{"-previous", "v0.6.0"}},
		{"conflicting tag", []string{"-previous", "v0.6.0", "-bump", "minor", "-check", "v0.8.0"}},
		{"extra argument", []string{"-previous", "v0.6.0", "-bump", "minor", "extra"}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var output bytes.Buffer
			if err := run(tc.args, &output); err == nil {
				t.Fatal("accepted invalid release input")
			}
			if strings.TrimSpace(output.String()) != "" {
				t.Fatal("printed a usable plan after rejecting release input")
			}
		})
	}
}
