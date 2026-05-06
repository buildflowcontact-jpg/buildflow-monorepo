// e2e/global-dashboard.spec.ts
// Vérifie le dashboard global multi-projets.
import { test, expect } from '@playwright/test';
import { mockAuth, mockProjects } from './utils/mocks';

test.describe('Dashboard global', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockProjects(page, [
      { id: 'p1', name: 'Chantier Alpha', code: 'CHT-001', status: 'active' },
      { id: 'p2', name: 'Résidence Bêta', code: 'RES-002', status: 'on_hold' },
    ]);
    // Mock les autres tables pour éviter les erreurs réseau
    await page.route('**/rest/v1/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.goto('/dashboard');
  });

  test('affiche le titre "Vue globale"', async ({ page }) => {
    await expect(page.getByText(/vue globale/i)).toBeVisible({ timeout: 10000 });
  });

  test('affiche les cartes projets', async ({ page }) => {
    await page.waitForSelector('text=Vue globale', { timeout: 10000 });
    await expect(page.getByText('Chantier Alpha')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Résidence Bêta')).toBeVisible({ timeout: 5000 });
  });

  test('affiche les codes projets', async ({ page }) => {
    await page.waitForSelector('text=Vue globale', { timeout: 10000 });
    await expect(page.getByText('CHT-001')).toBeVisible({ timeout: 8000 });
  });
});
