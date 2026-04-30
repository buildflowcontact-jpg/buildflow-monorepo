import { test, expect } from '@playwright/test';

test('suppression d’un projet', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('email').fill('test@user.com');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page.getByText(/cockpit chantier/i)).toBeVisible();
  await page.getByText(/Projet Test/i).click();
  await page.getByRole('button', { name: /supprimer/i }).click();
  await expect(page.getByText(/Projet Test/i)).not.toBeVisible();
});