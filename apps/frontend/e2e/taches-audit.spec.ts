import { expect, test, type Page } from '@playwright/test';
import { mockAuth, mockSupabaseEmpty } from './utils/mocks';

type AuditEntry = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  project_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const TEST_USER_ID = '626020ae-6102-450f-b83d-c6025cf90bdc';

async function mockAuditLogs(page: Page) {
  const auditEntries: AuditEntry[] = [];

  await page.route('**/rest/v1/audit_logs*', async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(auditEntries),
      });
      return;
    }

    if (request.method() === 'POST') {
      const payload = request.postDataJSON();
      const rows = Array.isArray(payload) ? payload : [payload];

      for (const row of rows) {
        auditEntries.unshift({
          id: `audit-${auditEntries.length + 1}`,
          user_id: row.user_id ?? TEST_USER_ID,
          action: row.action ?? 'UNKNOWN',
          entity_type: row.entity_type ?? null,
          entity_id: row.entity_id ?? null,
          project_id: row.project_id ?? null,
          metadata: row.metadata ?? null,
          created_at: row.created_at ?? new Date().toISOString(),
        });
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(rows),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

test.describe('Taches audit trail', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockSupabaseEmpty(page);
    await mockAuditLogs(page);

    await page.goto('/taches');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Taches & Sous-taches' })).toBeVisible();
  });

  test('records create, update and delete actions in audit history', async ({ page }) => {
    await expect(page.getByText('Aucune action recente.')).toBeVisible();

    await page.getByRole('button', { name: '+ Creer une tache' }).click();
    await expect(page.getByRole('heading', { name: 'Creer une nouvelle tache' })).toBeVisible();

    await page.locator('#task-title').fill('Audit task test');
    await page.locator('#task-description').fill('Creation de tache pour test audit.');
    await page.locator('#task-assignee').fill('QA Bot');
    await page.locator('#task-start-date').fill('2026-06-01');
    await page.locator('#task-date').fill('2026-06-05');
    await page.getByRole('dialog').getByRole('button', { name: 'Creer' }).click();

    await expect(page.locator('li').filter({ hasText: 'CREATE' }).filter({ hasText: 'Audit task test' })).toBeVisible();

    await page.getByRole('button', { name: /Audit task test/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Detail tache' })).toBeVisible();
    await page.locator('#edit-task-title').fill('Audit task updated');
    await page.getByRole('dialog').getByRole('button', { name: 'Enregistrer' }).click();

    await expect(page.locator('li').filter({ hasText: 'UPDATE' }).filter({ hasText: 'Audit task updated' })).toBeVisible();

    await page.getByRole('button', { name: /Audit task updated/ }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();

    await expect(page.locator('li').filter({ hasText: 'DELETE' }).filter({ hasText: 'Audit task updated' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Audit task updated/ })).toHaveCount(0);
  });
});
