import { expect, test } from '@playwright/test';
import { mockAuth, mockSupabaseEmpty } from './utils/mocks';

test.describe('Quick actions hub', () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
    const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

    await mockAuth(page);
    await mockSupabaseEmpty(page);
    await page.goto('/dashboard');

    const loginHeading = page.getByRole('heading', { name: 'Connexion' });
    await page.waitForLoadState('domcontentloaded');

    const loginVisible = await loginHeading
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (loginVisible) {
      if (!testEmail || !testPassword) {
        test.skip(true, 'E2E requires auth. Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD.');
      }

      await page.fill('#email', testEmail!);
      await page.fill('#password', testPassword!);
      await page.click('button:has-text("Se connecter")');
      await page.waitForLoadState('networkidle');
    }
  });

  test('ouvre la modale quick action depuis le bouton flottant', async ({ page }) => {
    await page.getByRole('button', { name: 'Ouvrir actions rapides terrain' }).click();
    await expect(page.getByRole('heading', { name: 'Signalement Rapide' })).toBeVisible();
    await expect(page.getByText('Contexte chantier')).toBeVisible();
  });

  test('bloque la soumission incident sans description', async ({ page }) => {
    await page.getByRole('button', { name: 'Ouvrir actions rapides terrain' }).click();
    const submitButton = page.getByRole('button', { name: 'Envoyer l incident' });

    await expect(submitButton).toBeDisabled();
    await expect(page.getByText('Description obligatoire')).toBeVisible();
  });
});