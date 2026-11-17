// Run with Playwright CLI against a running showcase on its /metrics route:
// playwright-cli run-code --filename /absolute/path/web/scripts/check-browser.js
async (page) => {
  const failures = [];
  const external = [];
  const origin = new URL(page.url()).origin;
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  await page.route('**/*', async route => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      await route.abort();
    } else await route.continue();
  });
  await page.reload({waitUntil: 'networkidle'});
  const cases = [
    ['18,446,744,073,709,551,615 cached input tokens', '18.45E'],
    ['11 hours 47 minutes 27 seconds', '11h 47m 27s']
  ];
  const metrics = [];
  for (const [exact, compact] of cases) {
    const group = page.getByRole('group', {name: exact, exact: true});
    if (await group.count() !== 1) throw new Error(`Missing exact metric: ${exact}`);
    if (await group.innerText() !== compact) throw new Error(`Changed visual value: ${exact}`);
    const snapshot = await group.ariaSnapshot();
    if (snapshot.trim() !== `- group "${exact}"`) throw new Error(`Duplicate or missing accessible text: ${snapshot}`);
    metrics.push({exact, compact, snapshot});
  }
  const assets = await page.locator('head link[href], head script[src]').evaluateAll(nodes => nodes.map(node => node.href || node.src));
  if (!assets.length || assets.some(url => new URL(url).origin !== origin)) throw new Error('Shared asset escaped the local origin');
  const geometry = [];
  for (const width of [375, 1280]) {
    await page.setViewportSize({width, height: 1000});
    for (const theme of ['standard', 'ocean', 'forest']) for (const mode of ['light', 'dark']) for (const density of ['comfortable', 'compact']) {
      await page.evaluate(preferences => window.GoHTMXUI.ui.setAppearance(document.querySelector('[data-ui-app]'), preferences), {theme, mode, density});
      const values = await page.locator('#compact-metrics .ghtui-metric-value').evaluateAll(nodes => nodes.map(node => {
        const parent = node.getBoundingClientRect();
        const child = node.firstElementChild.getBoundingClientRect();
        return {fits: child.left >= parent.left - 1 && child.right <= parent.right + 1, color: getComputedStyle(node).color};
      }));
      if (values.length !== 8 || values.some(value => !value.fits)) throw new Error(`Metric overflow: ${JSON.stringify({width, theme, mode, density, values})}`);
      geometry.push({width, theme, mode, density});
    }
  }
  if (external.length || failures.length) throw new Error(JSON.stringify({external, failures}));
  return {metrics, assets, geometry, external, failures};
}
