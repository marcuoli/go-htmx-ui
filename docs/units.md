# Metric units — v0.5.0+

Pass formatting fields on a chart value axis, numeric `domain`, or dataset. The
same compiled converter formats axis labels, tooltips and special-chart values.
Raw samples and bounds remain in **input units**. A user selector can change the
formatting declaration and call `GoHTMXUI.charts.render(canvas)` without replacing
the canvas or resetting valid legend/zoom state. Go/templ and JavaScript-only
consumers use identical JSON; no Go runtime is needed by the latter.

## Standard data quantities and rates

```json
{
  "unit":"data-rate",
  "inputUnit":"MB/s",
  "displayUnit":"MiB/h",
  "precision":2
}
```

12.5 MB/s displays 42,915.34 MiB/h in en-US or 42.915,34 MiB/h with `locale:"pt_BR"`.
A rate conversion changes equivalent units; it does **not** sum observations,
resample history or compute actual hourly/daily totals.

| Field | Meaning |
| --- | --- |
| `unit:"data"` | Bit/byte quantity; input/output have no time denominator |
| `unit:"data-rate"` | Bit/byte rate with an explicit supported time denominator |
| `inputUnit` | Actual units of the supplied samples and bounds; generic defaults B or B/s |
| `displayUnit` | Fixed output symbol, `auto`, or data-rate `auto/s`, `auto/min`, `auto/h`, `auto/d` |
| `scale` | Optional decimal/binary prefix family; for generic types, inferred from fixed output, then input prefix, then decimal |
| `precision` | Maximum fractional digits 0–8; existing locale behavior retained |

Symbols are case-sensitive: **B means byte, b means bit, 1 B = 8 b**. Canonical
prefixes are:

| Family | Bytes | Bits | Step |
| --- | --- | --- | --- |
| Decimal/SI | B, kB, MB, GB, TB, PB, EB, ZB, YB | b, kb, Mb, Gb, Tb, Pb, Eb, Zb, Yb | 1000 |
| Binary/IEC | B, KiB, MiB, GiB, TiB, PiB, EiB, ZiB, YiB | b, Kib, Mib, Gib, Tib, Pib, Eib, Zib, Yib | 1024 |

Rate symbols append `/s`, `/min`, `/h` or `/d`; 1 min = 60 s, 1 h = 3600 s, 1 d = 86400 s.
Calendar months/years and ambiguous spellings are not inferred. A quantity cannot
convert to a rate or vice versa without application-supplied time semantics.

| Input | Output | Equivalent value |
| --- | --- | --- |
| 1 MB/s | Mb/s | 8 Mb/s |
| 1 MiB/s | Mib/s | 8 Mib/s |
| 1 MiB/s | Mb/s | about 8.39 Mb/s |
| 8 Mb/s | MB/s | 1 MB/s |
| 1 MB/min | MB/h | 60 MB/h |
| 24 MB/d | MB/h | 1 MB/h |

A fixed prefixed output determines its own scale unless an explicit `scale`
conflicts, which fails safely. Thus generic data-rate MB/s→MiB/h needs no extra
binary flag; explicitly declaring decimal with MiB/h is an error. Base B/b has
no prefix-family conflict.

### Automatic output and compatibility

Generic `data`/`data-rate` auto output retains the input bit/byte kind and, for a
rate, its period. `auto/h` changes only the output time base; `scale` selects its
prefix family. Generic input MiB/s with no scale uses IEC auto; input MB/h uses SI
and /h. Declared `scale:"binary"` requests IEC auto regardless of input prefix.

Existing `bytes` and `bytes/s` aliases retain their decimal auto defaults and
byte output; rate auto retains /s. New `bits` and `bits/s` similarly default to SI
bit output. All aliases accept the expanded canonical input/output symbols.
Fixed prefixed outputs for these aliases still require a matching scale, as in
the existing contract. Prefer generic data/data-rate for output-family inference.

```json
{"unit":"bytes/s","inputUnit":"MiB/s","displayUnit":"auto"}
```

Above remains 1.05 MB/s for input 1, matching v0.4.0. Generic `data-rate` instead
shows 1 MiB/s. Neither path relabels unconverted decimal values as IEC.

## Other rates

Existing `unit:"rate"` without conversion fields still renders values as
`12.5/s`. Specify matching named numerators and known time bases to convert:

```json
{"unit":"rate","inputUnit":"requests/s","displayUnit":"requests/h","precision":2}
```

Input 2 displays 7,200 requests/h. Unnamed `/s`→`/h` is also valid. A different
numerator (requests→transactions) requires an explicit custom rule; the renderer
does not invent a business relationship. Prefix scaling does not apply to
these named count rates.

## Custom labels and explicit conversion rules

For values already expressed in the desired units, specify a safe text label:

```json
{"unit":"custom","displayUnit":"transactions/h","precision":2}
```

The input label defaults to the output label and values format unchanged.
Arbitrary custom labels do not trigger automatic prefix/time conversion.
Different input/output labels require an explicit numeric rule:

```json
{
  "unit":"custom", "inputUnit":"°C", "displayUnit":"°F",
  "conversion":{"factor":1.8,"offset":32}, "precision":1
}
```

The declared transformation is `display = input * factor + offset`; offset
defaults to 0. Factor must be finite and positive, offset finite. Only these rule
keys are accepted; no functions, expressions or callbacks. Conversion arithmetic
never mutates samples or chart geometry. For example raw 0°C remains 0 in the
engine while labels/detail show 32°F. A caller can explicitly declare another
relationship, such as requests/s→requests/h with factor 3600; standard matching
rate units are simpler for that particular case.

Known built-in units do not accept custom rule overrides. Labels must be plain,
nonempty text up to 80 characters without control characters, and are rendered as
text rather than HTML. Numbers use JavaScript Number precision; a converted
nonfinite result displays the chart's localized unavailable message. Null remains
missing, and real zero remains a real value (an explicit custom offset can map it).

## Inheritance and live use

All series sharing a numeric axis must share input/output/conversion semantics.
These may be inferred from unambiguous dataset declarations. Equal numeric custom
rules compare semantically: `{factor:2}` equals `{offset:0,factor:2}`. Conflicting
rules require separate axes. Dataset precision can deliberately differ from its
axis; special-family tooltips/cell labels/gauge details honor dataset precision,
while axis/color-scale labels use axis precision. Invalid inherited settings
are rejected consistently across chart families.

```js
const spec=JSON.parse(canvas.dataset.uiChart);
spec.axes[0]={unit:'data-rate',inputUnit:'MB/s',displayUnit:'Mb/s',precision:2};
canvas.dataset.uiChart=JSON.stringify(spec);
GoHTMXUI.charts.render(canvas);
```

Keep a useful raw-input disclosure and identify its original units. Unit changes
are not data collection, aggregation, pricing, history storage or transport.
See the synthetic metric-unit selector and the [general support matrix](charts.md)
for chart-family, lifecycle and Go/templ/JavaScript-only integration details.
