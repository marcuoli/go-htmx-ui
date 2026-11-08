# Third-party notices

- Apache ECharts 6.1.0: Apache-2.0, unchanged official full distribution at web/assets/echarts.min.js; license/NOTICE at echarts.LICENSE.txt and echarts.NOTICE.txt. Included d3 subcomponent notice: echarts-d3.LICENSE.txt.
- ZRender: BSD-3-Clause; bundled upstream rendering dependency, notice at zrender.LICENSE.txt.
- tslib: 0BSD; upstream helper dependency, notices at tslib.LICENSE.txt and tslib.CopyrightNotice.txt.

All listed files are served by ui.Assets(). echarts.provenance.json records the exact upstream version, npm integrity and SHA-256 of copied assets/notices. The native integration uses first-party echarts-format.js and ui-htmx-charts.js; neither is a third-party engine. Legacy adapter and compatibility bundle URLs are not served by v0.6.0.

- HTMX 2.0.11 and 4.0.1 (including its official Alpine compatibility extension): 0BSD; unchanged distributions, with htmx.LICENSE.txt and htmx4.LICENSE.txt.
- Alpine.js 3.17.5: MIT; unchanged official cdn.min.js, with the exact upstream-tag license at alpine.LICENSE.txt. The bundled Vue reactivity/shared MIT notices are alpine-vue-reactivity.LICENSE.txt and alpine-vue-shared.LICENSE.txt.
- Tailwind CSS 4.3.5: MIT; build-time compiler and compiled stylesheet, with tailwindcss.LICENSE.txt. The shared CSS command downloads the exact unmodified official standalone compiler using its pinned release digest.

frontend.provenance.json records browser-package identities, npm integrity and all copied hashes. Alpine's npm tarball omits the MIT text; the exact tagged upstream license and blob/hash provenance are retained under web/third_party. No dependency source or distribution is patched.
