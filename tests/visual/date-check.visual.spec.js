const { test, expect } = require('@playwright/test');
const { fillDate, expectMessage } = require('../shared/date-form');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('img')).toBeVisible();
  await page.getByRole('img').evaluate(img => img.decode());
});

test('VISUAL-01: desktop form', async ({ page }) => {
  await expect(page).toHaveScreenshot('desktop-form.png', { animations: 'disabled' });
});

test('VISUAL-02: successful result dialog', async ({ page }) => {
  await fillDate(page, { day: '29', month: '2', year: '2000' });
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expectMessage(page, '29/02/2000 is correct date time!');
  await expect(page).toHaveScreenshot('valid-date-dialog.png', { animations: 'disabled' });
});

test('VISUAL-03: field format error dialog', async ({ page }) => {
  await fillDate(page, { day: 'abc', month: '1', year: '2024' });
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expectMessage(page, 'Input data for Day is incorrect format!', 'Error');
  await expect(page).toHaveScreenshot('format-error-dialog.png', { animations: 'disabled' });
});

test('VISUAL-04: close confirmation', async ({ page }) => {
  await page.getByRole('button', { name: 'Close application' }).click();
  await expectMessage(page, 'Are you sure to exit?', 'Confirm');
  await expect(page).toHaveScreenshot('close-confirmation.png', { animations: 'disabled' });
});

test('VISUAL-05: responsive web form at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page).toHaveScreenshot('responsive-web-form.png', { animations: 'disabled' });
});
