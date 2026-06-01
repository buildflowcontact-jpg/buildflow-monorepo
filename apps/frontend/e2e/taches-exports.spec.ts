import { expect, test } from '@playwright/test';
import { mockAuth, mockSupabaseEmpty } from './utils/mocks';

test.describe('Taches exports and filters', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockSupabaseEmpty(page);

    await page.goto('/taches');
    await page.evaluate(() => {
      window.localStorage.removeItem('taches-filtres');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Taches & Sous-taches' })).toBeVisible();
  });

  test('shows success toast for CSV and PDF exports', async ({ page }) => {
    await page.getByRole('button', { name: 'Exporter CSV' }).click();
    await expect(page.getByText('Export CSV effectue')).toBeVisible();

    await page.getByRole('button', { name: 'Exporter PDF' }).click();
    await expect(page.getByText('Export PDF effectue')).toBeVisible();
  });

  test('persists search and select filters after reload', async ({ page }) => {
    const taskSearch = page.getByPlaceholder('Rechercher une tache...');
    await taskSearch.fill('ferraillage');

    const filterComboboxes = page.locator('main').getByRole('combobox');
    await filterComboboxes.nth(0).selectOption('in_progress');
    await filterComboboxes.nth(1).selectOption('medium');
    await filterComboboxes.nth(2).selectOption({ label: 'Sophie Bernard' });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const taskSearchAfterReload = page.getByPlaceholder('Rechercher une tache...');
    await expect(taskSearchAfterReload).toHaveValue('ferraillage');

    const filterComboboxesAfterReload = page.locator('main').getByRole('combobox');
    await expect(filterComboboxesAfterReload.nth(0)).toHaveValue('in_progress');
    await expect(filterComboboxesAfterReload.nth(1)).toHaveValue('medium');
    await expect(filterComboboxesAfterReload.nth(2)).toHaveValue('Sophie Bernard');
  });
});
