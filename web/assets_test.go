package web

import (
	"bytes"
	"io/fs"
	"regexp"
	"strings"
	"testing"
)

func TestEmbeddedAssetsAndLicenses(t *testing.T) {
	for _, name := range []string{"htmx.min.js", "htmx4.min.js", "htmx4-alpine-compat.min.js", "alpine.min.js", "frontend.provenance.json", "htmx.LICENSE.txt", "htmx4.LICENSE.txt", "alpine.LICENSE.txt", "alpine-vue-reactivity.LICENSE.txt", "alpine-vue-shared.LICENSE.txt", "tailwindcss.LICENSE.txt", "ui.css", "ui-runtime.js", "ui-htmx-charts.js", "echarts-format.js", "echarts.min.js", "echarts.LICENSE.txt", "echarts.NOTICE.txt", "echarts-d3.LICENSE.txt", "zrender.LICENSE.txt", "tslib.LICENSE.txt", "tslib.CopyrightNotice.txt", "echarts.provenance.json"} {
		data, err := fs.ReadFile(Assets(), name)
		if err != nil || len(data) == 0 {
			t.Errorf("asset %s: %v", name, err)
		}
	}
}

func TestStylesDoNotReadHostTailwindTokens(t *testing.T) {
	data, err := fs.ReadFile(Assets(), "ui.css")
	if err != nil {
		t.Fatal(err)
	}
	for _, match := range regexp.MustCompile(`var\((--[a-zA-Z0-9-]+)`).FindAllStringSubmatch(string(data), -1) {
		if !strings.HasPrefix(match[1], "--ghtui-") {
			t.Errorf("component depends on global host token %s", match[1])
		}
	}
}

func TestLegacyChartBundleURLServesECharts(t *testing.T) {
	for _, name := range []string{"charts.js", "chart.umd.js"} {
		if _, err := fs.ReadFile(Assets(), name); err == nil {
			t.Fatalf("retired asset %s still served", name)
		}
	}
}

func TestPreviousControllerFilenameAliasesCanonicalAsset(t *testing.T) {
	canonical, err := fs.ReadFile(Assets(), "ui-htmx-charts.js")
	if err != nil {
		t.Fatal(err)
	}
	previous, err := fs.ReadFile(Assets(), "echarts-ui.js")
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(previous, canonical) {
		t.Fatal("previous controller URL does not serve the canonical script")
	}
}
