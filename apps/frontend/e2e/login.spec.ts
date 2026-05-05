import { test, expect } from '@playwright/test';
import { mockAll } from './utils/mocks';

test('connexion/déconnexion', async ({ page }) => {
  await mockAll(page);
  await page.goto('/');
  await page.getByLabel('email').fill('test@user.com');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page.getByText(/cockpit chantier/i)).toBeVisible();
  await page.getByRole('button', { name: /déconnexion/i }).click();
  await expect(page.getByLabel('email')).toBeVisible();
});