import { expect, test, type Page } from '@playwright/test';
import { mockAuth, mockSupabaseEmpty } from './utils/mocks';

async function ensureAuthenticatedAccess(page: Page) {
  const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
  const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

  await page.waitForLoadState('domcontentloaded');

  const loginHeading = page.getByRole('heading', { name: 'Connexion' });
  const loginVisible = await loginHeading
    .waitFor({ state: 'visible', timeout: 2500 })
    .then(() => true)
    .catch(() => false);

  if (!loginVisible) {
    return;
  }

  if (!testEmail || !testPassword) {
    test.skip(true, 'E2E requires auth. Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD.');
  }

  await page.fill('#email', testEmail!);
  await page.fill('#password', testPassword!);
  await page.click('button:has-text("Se connecter")');
  await page.waitForLoadState('networkidle');
}

test.describe('Performance UX', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockSupabaseEmpty(page);
  });

  test('affiche le dashboard en moins de 12s', async ({ page }) => {
    const startedAt = Date.now();
    await page.goto('/dashboard');
    await ensureAuthenticatedAccess(page);
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible({ timeout: 12000 });
    const elapsedMs = Date.now() - startedAt;

    expect(elapsedMs).toBeLessThan(12000);
  });

  test('affiche incidents en moins de 12s', async ({ page }) => {
    const startedAt = Date.now();
    await page.goto('/incidents');
    await ensureAuthenticatedAccess(page);
    await expect(page.getByRole('heading', { name: 'Incidents', exact: true })).toBeVisible({ timeout: 12000 });
    const elapsedMs = Date.now() - startedAt;

    expect(elapsedMs).toBeLessThan(12000);
  });

  test('affiche finance en moins de 12s', async ({ page }) => {
    const startedAt = Date.now();
    await page.goto('/finance');
    await ensureAuthenticatedAccess(page);
    await expect(page.getByRole('heading', { name: 'Finance' })).toBeVisible({ timeout: 12000 });
    const elapsedMs = Date.now() - startedAt;

    expect(elapsedMs).toBeLessThan(12000);
  });

  test('ouvre le hub quick actions en moins de 3s', async ({ page }) => {
    await page.goto('/dashboard');
    await ensureAuthenticatedAccess(page);

    const startedAt = Date.now();
    await page.getByRole('button', { name: 'Ouvrir actions rapides terrain' }).click();
    await expect(page.getByRole('heading', { name: 'Signalement Rapide' })).toBeVisible({ timeout: 3000 });
    const elapsedMs = Date.now() - startedAt;

    expect(elapsedMs).toBeLessThan(3000);
  });
});
