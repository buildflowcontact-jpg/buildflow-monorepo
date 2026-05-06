import { test, expect } from '@playwright/test';
import { mockAllNoAuth } from './utils/mocks';

test('formulaire de connexion et lien créer un compte', async ({ page }) => {
  await mockAllNoAuth(page);
  await page.goto('/');

  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();
  await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();

  const createAccountLink = page.getByRole('button', { name: /créer un compte/i });
  await expect(createAccountLink).toBeVisible();
  await createAccountLink.click();

  await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^créer un compte$/i })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();

  const backToLoginLink = page.getByRole('button', { name: /déjà un compte \? se connecter/i });
  await expect(backToLoginLink).toBeVisible();
  await backToLoginLink.click();

  await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
});
