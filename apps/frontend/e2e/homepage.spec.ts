import { test, expect } from '@playwright/test';

// Test E2E basique : vérifie que la page d'accueil affiche le titre

test('homepage affiche le titre', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Bienvenue sur BuildFlow/i)).toBeVisible();
});
