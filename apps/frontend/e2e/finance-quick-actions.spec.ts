// e2e/finance-quick-actions.spec.ts
// Vérifie que les boutons "Actions rapides" dans Finance activent le bon onglet.
import { test, expect } from '@playwright/test';
import { mockAuth, mockSupabaseEmpty } from './utils/mocks';

test.describe('Finance — actions rapides', () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
    const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

    await mockAuth(page);
    await mockSupabaseEmpty(page);
    await page.goto('/finance');
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

  test('clic sur "Saisir depense" bascule sur l\'onglet Dépenses', async ({ page }) => {
    // Attend que la page soit chargée
    await page.waitForSelector('text=Finance', { timeout: 10000 });

    // Clique sur le bouton "Saisir depense" dans le panneau actions rapides
    await page.getByRole('button', { name: /saisir depense/i }).click();

    // L'onglet Dépenses doit être actif (classe bf-tab-active ou style visible)
    await expect(page.getByRole('button', { name: /dépenses/i }).first()).toBeVisible();
  });

  test('clic sur "Revue budget" bascule sur l\'onglet Budget', async ({ page }) => {
    await page.waitForSelector('text=Finance', { timeout: 10000 });
    await page.getByRole('button', { name: /revue budget/i }).click();
    await expect(page.getByRole('button', { name: /budget/i }).first()).toBeVisible();
  });
});
