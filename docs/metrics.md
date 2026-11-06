# Compact metric strips

Use `WidgetMetricStrip` around existing `WidgetMetric`, `WidgetMetricFrame` and
`WidgetMetricValue` components for a dense dashboard row. Its defaults show eight
cards in one row at desktop viewports of 1600 CSS pixels and wider. Smaller
viewports use four columns from 960px, two from 480px, then one. Browser zoom
therefore reflows the cards instead of forcing a horizontal scrollbar.

```templ
@ui.WidgetMetricStrip(ui.WidgetMetricStripProps{Columns: 2}) {
    @ui.WidgetMetric("Input tokens", "682888", "Reported usage")
    @ui.WidgetMetricFrame(ui.WidgetMetricProps{Label: "Longest running turn"}) {
        @ui.WidgetMetricValue("11h 47m 27s", "11 hours 47 minutes 27 seconds")
    }
}
```

`Columns` is the visible card count, from one to eight; zero or invalid values
select eight. Pass the actual count when optional fields are omitted. Preserve
reported zero values; missing data and zero are different. For an empty set,
set `Attributes: templ.Attributes{"hidden": true}` on the strip. A hidden card or
wrapper is also respected, but does not automatically change `Columns`.

## Keyed application groups

Direct children can be cards, or generic `div` shells marked
`class="ghtui-metric-group"`. The shared CSS gives marked groups `display:contents`
inside the strip, allowing cards from multiple groups to share one grid. Nested
marked wrappers, including a keyed wrapper per card, work the same way. The DOM
nodes, IDs, keys and trusted live attributes remain available for application
reconciliation.

```templ
@ui.WidgetMetricStrip(ui.WidgetMetricStripProps{
    Columns: visibleCount,
    Attributes: templ.Attributes{"id": "usage-metrics", "data-dashboard-key": "metrics"},
}) {
    <div class="ghtui-metric-group" data-dashboard-key="primary">
        @primaryMetrics()
    </div>
    <div class="ghtui-metric-group" data-dashboard-key="extra">
        @optionalMetrics()
    </div>
}
```

Use the group class only on generic layout shells. Do not apply it to semantic
landmarks, fieldsets, lists or interactive elements: removing their layout boxes
can affect accessibility. The wrapper class and column marker come from props;
`Attributes` cannot replace them, regardless of attribute-name casing. Other
attributes are trusted server-defined values under the usual component contract.

## Sizing, values and ownership

The strip scopes its compact padding, spacing, label rhythm and value sizing to
its descendants. Values scale with each card's available width, including space
taken by sidebars, and safely wrap long text. All Standard, Ocean and Forest
Light/Dark variants inherit their colors. Global comfortable/compact density
keeps the strip's compact sizing. Existing standalone metrics retain their defaults.

Pass raw decimal strings to `WidgetMetricValue` for shared numeric compaction;
large integers are formatted without a JavaScript number conversion. Supply an
exact string for the tooltip and accessible label. Duration and other text remain
text, for example `11h 47m 27s`. Applications still own data, permissions, optional
fields, updates and stable DOM keys. The strip adds no JavaScript and does not
replace chart hosts, SSE connections or native ECharts instances.

Run the showcase and open `/metrics` for eight synthetic cards, two keyed groups,
nested keyed card wrappers and an independent chart. Edge validation covered
375–3840 CSS-pixel viewports, including 1632px of content at 1920px and 3552px at
3840px. These are measured examples, not a promise that arbitrary text fits on one
line in every custom layout.
