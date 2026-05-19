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

  test('enregistre hors ligne puis synchronise a la reconnexion', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Ouvrir actions rapides terrain' }).click();
    await page.context().setOffline(true);
    await expect(page.locator('span').filter({ hasText: /^Hors ligne$/ }).first()).toBeVisible();

    await page.getByPlaceholder('Quel est le probleme ?').fill('Blocage nacelle niveau R+2');
    const offlineSubmit = page.getByRole('button', { name: 'Enregistrer hors ligne' });
    await expect(offlineSubmit).toBeEnabled();
    await offlineSubmit.evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

    await expect(page.getByText('Action enregistree hors ligne. Synchronisation au retour reseau.')).toBeVisible();

    await page.getByRole('button', { name: 'Ouvrir actions rapides terrain' }).click();
    await expect(page.getByText('1 action en attente')).toBeVisible();
    await expect(page.getByText('En attente: 1')).toBeVisible();
    await expect(page.getByText('Attente', { exact: true })).toBeVisible();

    await page.context().setOffline(false);
    await expect(page.locator('span').filter({ hasText: /^En ligne$/ }).first()).toBeVisible();
    await expect(page.getByText('Aucune action en file hors ligne.')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('En attente: 0')).toBeVisible();
  });
});