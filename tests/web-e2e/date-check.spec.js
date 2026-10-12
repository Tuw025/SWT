const { test, expect } = require('@playwright/test');
const samples = require('../shared/samples.json');
const { fillDate, expectMessage } = require('../shared/date-form');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('E2E-01: the form is ready for a new user', async ({ page }) => {
  await expect(page).toHaveTitle('Date Time Checker');
  await expect(page.getByRole('heading', { name: 'Date Time Checker', exact: true })).toBeVisible();
  for (const label of ['Day', 'Month', 'Year']) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue('');
  }
  await expect(page.getByRole('button', { name: 'Check', exact: true })).toBeEnabled();
});

for (const sample of samples) {
  test(`E2E-${sample.id}: ${sample.message}`, async ({ page }) => {
    // Real browser -> real HTTP endpoint -> real DateChecker -> visible result.
    await fillDate(page, sample);
    const pendingResponse = page.waitForResponse(response =>
      new URL(response.url()).pathname === '/api/date/check' && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    const response = await pendingResponse;
    expect(response.status()).toBe(sample.status);
    expect(response.request().postDataJSON()).toEqual({ day: sample.day, month: sample.month, year: sample.year });
    await expectMessage(page, sample.message, sample.outcome === 'validation_error' ? 'Error' : 'Message');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByTestId('message-dialog')).not.toBeVisible();
    await expect(page.getByLabel('Day', { exact: true })).toHaveValue(sample.day);
    if (sample.field) await expect(page.getByLabel(sample.field, { exact: true })).toBeFocused();
  });
}

test('E2E-CLEAR: Clear empties all fields and returns focus to Day', async ({ page }) => {
  await fillDate(page, { day: '29', month: '2', year: '2000' });
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  for (const label of ['Day', 'Month', 'Year']) await expect(page.getByLabel(label, { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Day', { exact: true })).toBeFocused();
});

test('E2E-ERROR-RESET: Clear also removes field error state', async ({ page }) => {
  await fillDate(page, { day: 'abc', month: '1', year: '2024' });
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expectMessage(page, 'Input data for Day is incorrect format!', 'Error');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.getByLabel('Day', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.getByLabel('Day', { exact: true })).not.toHaveAttribute('aria-invalid', 'true');
});

test('E2E-CLOSE-NO: cancel closing without losing the entered date', async ({ page }) => {
  const date = { day: '29', month: '2', year: '2000' };
  await fillDate(page, date);
  await page.getByRole('button', { name: 'Close application' }).click();
  await expectMessage(page, 'Are you sure to exit?', 'Confirm');
  await page.getByRole('button', { name: 'No', exact: true }).click();
  await expect(page.getByTestId('application')).toBeVisible();
  for (const [label, value] of [['Day', date.day], ['Month', date.month], ['Year', date.year]]) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue(value);
  }
});

test('E2E-CLOSE-YES: close and reopen with an empty form', async ({ page }) => {
  await fillDate(page, { day: '1', month: '1', year: '2024' });
  await page.getByRole('button', { name: 'Close application' }).click();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(page.getByTestId('closed-screen')).toBeVisible();
  await expect(page.getByTestId('application')).not.toBeVisible();
  await page.getByRole('button', { name: 'Open checker', exact: true }).click();
  await expect(page.getByTestId('application')).toBeVisible();
  for (const label of ['Day', 'Month', 'Year']) await expect(page.getByLabel(label, { exact: true })).toHaveValue('');
});

test('E2E-ESCAPE: Escape cancels the close confirmation', async ({ page }) => {
  await page.getByRole('button', { name: 'Close application' }).click();
  await expectMessage(page, 'Are you sure to exit?', 'Confirm');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('message-dialog')).not.toBeVisible();
  await expect(page.getByTestId('application')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close application' })).toBeFocused();
});

test('E2E-KEYBOARD: submit the date with Enter', async ({ page }) => {
  await fillDate(page, { day: '29', month: '2', year: '2000' });
  await page.getByLabel('Year', { exact: true }).press('Enter');
  await expectMessage(page, '29/02/2000 is correct date time!');
});

test('E2E-NETWORK: show a connection error, then recover', async ({ page }) => {
  await fillDate(page, { day: '1', month: '1', year: '2024' });
  // Only this request is interrupted. Calendar cases above always use the backend.
  await page.route('**/api/date/check', route => route.abort());
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expectMessage(page, 'Cannot connect to the checker. Please try again.', 'Error');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await page.unroute('**/api/date/check');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expectMessage(page, '01/01/2024 is correct date time!');
});

for (const width of [320, 390, 768]) {
  test(`E2E-RESPONSIVE: Check works at a width of ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await fillDate(page, { day: '29', month: '2', year: '2000' });
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await expectMessage(page, '29/02/2000 is correct date time!');
  });
}
