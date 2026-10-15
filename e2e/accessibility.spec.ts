import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('workspace views have no automated WCAG A/AA violations', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Playground', 'Batch analysis', 'Model insights', 'How it works']) {
    await page.getByRole('button', { name, exact: true }).click();
    if (name === 'Model insights') await expect(page.getByRole('heading', { name: 'Measured, not assumed.' })).toBeVisible();
    if (name === 'How it works') await expect(page.getByRole('heading', { name: 'From words to meaning.' })).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.map(v => ({ id: v.id, elements: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
  }
});
