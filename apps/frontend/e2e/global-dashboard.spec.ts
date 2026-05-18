// e2e/global-dashboard.spec.ts
// Vérifie le dashboard global multi-projets.
import { test, expect } from '@playwright/test';
import { mockAuth, mockProjectMembers, mockProjects } from './utils/mocks';

test.describe('Dashboard global', () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
    const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

    await mockAuth(page);
    // Mock les autres tables avant les routes spécifiques pour ne pas écraser
    // le projet courant et le rôle utilisés par les routes protégées.
    await page.route('**/rest/v1/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await mockProjects(page, [
      { id: 'p1', name: 'Chantier Alpha', code: 'CHT-001', status: 'active' },
      { id: 'p2', name: 'Résidence Bêta', code: 'RES-002', status: 'on_hold' },
    ]);
    await mockProjectMembers(page);
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

  test('affiche le titre "Vue globale"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible({ timeout: 10000 });
  });

  test('affiche les cartes projets', async ({ page }) => {
    await page.waitForSelector('text=Tableau de bord', { timeout: 10000 });
    await expect(page.getByRole('button', { name: /Chantier Alpha.*CHT-001.*Actif/i }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /Résidence Bêta.*En pause/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('affiche les codes projets', async ({ page }) => {
    await page.waitForSelector('text=Tableau de bord', { timeout: 10000 });
    await expect(page.getByRole('button', { name: /Chantier Alpha.*CHT-001.*Actif/i }).first()).toContainText('CHT-001', { timeout: 8000 });
  });
});
