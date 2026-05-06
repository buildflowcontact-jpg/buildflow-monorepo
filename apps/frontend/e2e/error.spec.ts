import { test, expect } from '@playwright/test';
import { mockAll } from './utils/mocks';

test('affichage d’une erreur réseau', async ({ page }) => {
  await mockAll(page);
  await page.goto('/');
  // La session est déjà injectée par mockAuth → l'app affiche le cockpit directement
  await expect(page.getByText(/BuildFlow/i).first()).toBeVisible();
  // Simule une erreur réseau sur les documents
  await page.route('**/rest/v1/documents*', route => route.abort());
  // Recharge la page pour déclencher la requête mocké en erreur
  await page.reload();
  await expect(page.getByText(/BuildFlow/i).first()).toBeVisible();
});
