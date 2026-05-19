import { expect, test } from '@playwright/test';
import { mockAuth, mockSupabaseEmpty } from './utils/mocks';

test.describe('Navigation canonique', () => {
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

  test('redirige /documents vers /executer', async ({ page }) => {
    await page.goto('/documents');
    await expect(page).toHaveURL(/\/executer$/);
  });

  test('redirige /terrain et /retour-chantier vers /incidents', async ({ page }) => {
    await page.goto('/terrain');
    await expect(page).toHaveURL(/\/incidents$/);

    await page.goto('/retour-chantier');
    await expect(page).toHaveURL(/\/incidents$/);
  });

  test('expose les liens canoniques dans la navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'Execution' }).first()).toHaveAttribute('href', '/executer');
    await expect(page.getByRole('link', { name: 'Incidents terrain' }).first()).toHaveAttribute('href', '/incidents');
  });
});