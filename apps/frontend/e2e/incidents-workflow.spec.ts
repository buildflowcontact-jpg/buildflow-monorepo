// e2e/incidents-workflow.spec.ts
// Vérifie le workflow incidents : affichage et transitions.
import { test, expect } from '@playwright/test';
import { mockAuth, mockSupabaseEmpty } from './utils/mocks';

test.describe('Incidents — workflow', () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
    const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

    await mockAuth(page);
    await mockSupabaseEmpty(page);
    await page.goto('/incidents');
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

  test('affiche le titre de la page Incidents', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /incidents/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('affiche "Aucun incident" quand la liste est vide', async ({ page }) => {
    await page.waitForSelector('text=Incidents', { timeout: 10000 });
    // Avec mockSupabaseEmpty, la liste est vide
    await expect(page.getByText(/aucun incident/i)).toBeVisible({ timeout: 8000 });
  });
});
