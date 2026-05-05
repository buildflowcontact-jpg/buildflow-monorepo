import { test, expect } from '@playwright/test';
import { mockAll } from './utils/mocks';

test('homepage affiche le titre', async ({ page }) => {
  await mockAll(page);
  await page.goto('/');
  await expect(page.getByText(/Bienvenue sur BuildFlow/i)).toBeVisible();
});
