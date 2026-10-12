const { test, expect } = require('@playwright/test');
const { fillDate, expectMessage } = require('../shared/date-form');

test('UI-PERF-R14: display a date result within one second of clicking Check', async ({ page }, testInfo) => {
  await page.goto('/');
  await fillDate(page, { day: '29', month: '2', year: '2000' });
  // Record within the browser: from the Check click to the result dialog opening.
  await page.evaluate(() => {
    window.checkTiming = { start: null, elapsedMs: null };
    document.getElementById('check-button').addEventListener('click', () => {
      window.checkTiming.start = performance.now();
    }, { capture: true, once: true });
    const dialog = document.getElementById('message-dialog');
    const observer = new MutationObserver(() => {
      if (dialog.open && window.checkTiming.start !== null) {
        window.checkTiming.elapsedMs = performance.now() - window.checkTiming.start;
        observer.disconnect();
      }
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  });
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expectMessage(page, '29/02/2000 is correct date time!');
  await expect.poll(() => page.evaluate(() => window.checkTiming.elapsedMs)).not.toBeNull();
  const elapsedMs = await page.evaluate(() => window.checkTiming.elapsedMs);
  await testInfo.attach('UI response time', { body: JSON.stringify({ elapsedMs, thresholdMs: 1000 }), contentType: 'application/json' });
  expect(elapsedMs).toBeLessThanOrEqual(1000);
});
