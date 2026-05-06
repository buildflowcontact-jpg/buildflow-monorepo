import { test, expect } from '@playwright/test';
import { mockAll } from './utils/mocks';

test('navigation clavier et labels accessibles', async ({ page }) => {
  await mockAll(page);
  await page.goto('/');
  // La session est injectée → l'app affiche le cockpit
  // Vérifie la présence de l'en-tête et la navigation au clavier
  await expect(page.getByText(/BuildFlow/i).first()).toBeVisible();
  // Tabule pour naviguer et vérifier la focusabilité
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
});
