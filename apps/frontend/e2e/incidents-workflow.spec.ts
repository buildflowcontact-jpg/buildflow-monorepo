// e2e/incidents-workflow.spec.ts
// Vérifie le workflow incidents : affichage et transitions.
import { test, expect } from '@playwright/test';
import { mockAuth, mockSupabaseEmpty } from './utils/mocks';

test.describe('Incidents — workflow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockSupabaseEmpty(page);
    await page.goto('/incidents');
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
