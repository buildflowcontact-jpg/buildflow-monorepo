import { test, expect } from '@playwright/test';
import { mockAll } from './utils/mocks';

test('navigation clavier et labels accessibles', async ({ page }) => {
  await mockAll(page);
  await page.goto('/');
  // Tabule jusqu’au premier champ de formulaire
  await page.keyboard.press('Tab');
  await expect(page.locator('input[type=email]')).toBeFocused();
  // Vérifie la présence d’un label
  await expect(page.getByLabel('email')).toBeVisible();
});
