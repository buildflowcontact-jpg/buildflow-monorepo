import { test, expect } from '@playwright/test';
import { mockAllNoAuth } from './utils/mocks';

test('homepage affiche le titre', async ({ page }) => {
  await mockAllNoAuth(page);
  await page.goto('/');
  await expect(page.getByText(/Bienvenue sur BuildFlow/i)).toBeVisible();
});
