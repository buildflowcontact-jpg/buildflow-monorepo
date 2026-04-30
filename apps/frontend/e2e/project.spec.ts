import { test, expect } from '@playwright/test';

test('création d’un projet', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('email').fill('test@user.com');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page.getByText(/cockpit chantier/i)).toBeVisible();
  await page.getByRole('button', { name: /nouveau projet/i }).click();
  await page.getByLabel('nom du projet').fill('Projet Test');
  await page.getByRole('button', { name: /créer/i }).click();
  await expect(page.getByText(/Projet Test/i)).toBeVisible();
});
