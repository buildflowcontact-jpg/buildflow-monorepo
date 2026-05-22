import { test, expect } from '@playwright/test';
import { mockAll } from './utils/mocks';

test('connexion/déconnexion', async ({ page }) => {
  await mockAll(page);
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const logoutBtn = page.getByRole('button', { name: /deconnexion|déconnexion/i });
  const hasSession = await logoutBtn
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (hasSession) {
    await logoutBtn.click();
  }

  // En sortie de test, le formulaire d'auth doit être affiché.
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();
  await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
});