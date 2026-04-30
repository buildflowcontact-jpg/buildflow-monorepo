import { test, expect } from '@playwright/test';

test('affichage d’une erreur réseau', async ({ page }) => {
  await page.goto('/');
  // Simule une action qui provoque une erreur (ex : mauvais endpoint)
  await page.route('**/api/documents', route => route.abort());
  await page.getByRole('button', { name: /charger les documents/i }).click();
  await expect(page.getByText(/erreur/i)).toBeVisible();
});
