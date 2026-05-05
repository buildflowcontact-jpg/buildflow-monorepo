import { test, expect } from '@playwright/test';
import { mockAll } from './utils/mocks';

test('création d’un projet', async ({ page }) => {
  await mockAll(page);
  await page.goto('/');
  await page.getByLabel('email').fill('test@user.com');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page.getByText(/cockpit chantier/i)).toBeVisible();
  await page.getByRole('button', { name: /nouveau projet/i }).click();
  await page.getByLabel('nom du projet').fill('Projet Test');
  // Simule la création du projet côté API
  await page.route('**/rest/v1/projects', route => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'p2', name: 'Projet Test' }),
      });
    } else {
      route.continue();
    }
  });
  await page.getByRole('button', { name: /créer/i }).click();
  // Après création, on mocke la liste avec le nouveau projet
  await page.waitForTimeout(100); // Laisse le temps au mock de s’appliquer
  await expect(page.getByText(/Projet Test/i)).toBeVisible();
});
