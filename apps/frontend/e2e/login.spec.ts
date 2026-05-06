import { test, expect } from '@playwright/test';
import { mockAll } from './utils/mocks';

test('connexion/déconnexion', async ({ page }) => {
  await mockAll(page);
  await page.goto('/');
  // La session est déjà injectée par mockAuth → l'app affiche le cockpit directement
  await expect(page.getByText(/BuildFlow/i).first()).toBeVisible();
  const logoutBtn = page.getByRole('button', { name: /déconnexion/i });
  await expect(logoutBtn).toBeVisible();
  await logoutBtn.click();
  // Après déconnexion, le formulaire d'auth s'affiche à nouveau
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();
  await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
});