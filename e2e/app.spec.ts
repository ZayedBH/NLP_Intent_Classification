import { test, expect } from '@playwright/test';

test('classifies through Python, explains it, saves and clears history', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your message').fill('Where is my order? I need to track my package.');
  await page.getByRole('button', { name: 'Analyze intent', exact: true }).click();
  await expect(page.getByTestId('result-label')).toHaveText('Track order');
  await expect(page.getByText('Words that made a difference')).toBeVisible();
  await page.getByRole('button', { name: 'Recent history' }).click();
  await expect(page.getByRole('button', { name: 'Clear history' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Recent history' }).click();
  await expect(page.getByRole('region', { name: 'Recent history' }).getByText('Where is my order? I need to track my package.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear history' }).click();
  await expect(page.getByText('Your next analysis starts the collection.')).toBeVisible();
});

test('batch input stays paired with its pending request', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Batch analysis', exact: true }).click();
  await page.getByLabel('Messages, one per line').fill('Please cancel my order');
  await page.route('**/api/classify', async route => {
    const response = await route.fetch();
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill({ response });
  });
  await page.getByRole('button', { name: 'Analyze messages' }).click();
  await expect(page.getByLabel('Messages, one per line')).toBeDisabled();
  await expect(page.getByTestId('batch-row')).toContainText('Cancel order');
  await expect(page.getByLabel('Messages, one per line')).toBeEnabled();
});

test('layout review and keyboard analysis', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-playground.png`, fullPage: true });
  await page.getByLabel('Your message').fill('I would like to request a refund for my order.');
  await page.getByLabel('Your message').press('Control+Enter');
  await expect(page.getByTestId('result-label')).toHaveText('Request refund');
  await page.getByRole('button', { name: 'NLP pipeline', exact: true }).click();
  await expect(page.getByText('NLTK tokenization', { exact: true })).toBeVisible();
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
  await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-result.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('handles uncertain input and validates blanks', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your message').fill('');
  await expect(page.getByRole('button', { name: 'Analyze intent', exact: true })).toBeDisabled();
  await page.getByLabel('Your message').fill('Tell me about black holes in the universe');
  await page.getByRole('button', { name: 'Analyze intent', exact: true }).click();
  await expect(page.getByTestId('result-label')).toHaveText('Needs clarification');
});

test('batch preserves rows and exports, insights show measured data', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Batch analysis', exact: true }).click();
  await page.getByLabel('Messages, one per line').fill('Please cancel my order\nI forgot my password and cannot log in');
  await page.getByRole('button', { name: 'Analyze messages' }).click();
  await expect(page.getByTestId('batch-row')).toHaveCount(2);
  await expect(page.getByTestId('batch-row').nth(0)).toContainText('Cancel order');
  await expect(page.getByTestId('batch-row').nth(1)).toContainText('Account access');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await download).suggestedFilename()).toBe('intentlab-results.csv');
  await page.getByRole('button', { name: 'Model insights', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Measured, not assumed.' })).toBeVisible();
  await expect(page.getByText('Hybrid synthetic dataset', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'How it works', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'From words to meaning.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
