package main

import (
	"context"
	"io"
	"strings"
	"testing"
)

func TestCSSCommandRejectsInvalidFlagsBeforeWork(t *testing.T) {
	for _, args := range [][]string{nil, {"bad"}, {"css", "--unknown"}, {"css", "--timeout=0"}, {"css", "unexpected"}} {
		if err := run(context.Background(), args, io.Discard, io.Discard); err == nil {
			t.Fatalf("accepted invalid args: %v", args)
		}
	}
	if err := run(context.Background(), []string{"css", "--help"}, io.Discard, io.Discard); err != nil {
		t.Fatal(err)
	}
	if err := run(context.Background(), []string{"css"}, io.Discard, io.Discard); err == nil || !strings.Contains(err.Error(), "input") {
		t.Fatal(err)
	}
}
