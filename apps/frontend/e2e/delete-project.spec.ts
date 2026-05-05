import { test, expect } from '@playwright/test';
import { mockAll } from './utils/mocks';

test('suppression d’un projet', async ({ page }) => {
  await mockAll(page);
  await page.goto('/');
  await page.getByLabel('email').fill('test@user.com');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page.getByText(/cockpit chantier/i)).toBeVisible();
  await page.getByText(/Projet Test/i).click();
  // Simule la suppression côté API
  await page.route('**/rest/v1/projects/p1', route => {
    if (route.request().method() === 'DELETE') {
      route.fulfill({ status: 204 });
    } else {
      route.continue();
    }
  });
  await page.getByRole('button', { name: /supprimer/i }).click();
  // Après suppression, on mocke la liste vide
  await page.waitForTimeout(100); // Laisse le temps au mock de s’appliquer
  await expect(page.getByText(/Projet Test/i)).not.toBeVisible();
});