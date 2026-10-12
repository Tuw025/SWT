const { expect } = require('@playwright/test');

async function fillDate(page, { day, month, year }) {
  await page.getByLabel('Day', { exact: true }).fill(day);
  await page.getByLabel('Month', { exact: true }).fill(month);
  await page.getByLabel('Year', { exact: true }).fill(year);
}

async function expectMessage(page, message, title = 'Message') {
  const dialog = page.getByTestId('message-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByTestId('dialog-message')).toHaveText(message);
}

module.exports = { fillDate, expectMessage };
