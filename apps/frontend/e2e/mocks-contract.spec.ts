import { expect, test } from '@playwright/test';
import { mockSupabaseEmpty } from './utils/mocks';

test.describe('Supabase E2E mocks', () => {
  test('mockSupabaseEmpty preserves project context and permissions', async ({ page }) => {
    await mockSupabaseEmpty(page);
    await page.goto('/');

    const projectsResponse = await page.evaluate(async () => {
      const response = await fetch('/rest/v1/projects?select=*');

      return {
        ok: response.ok,
        body: await response.json(),
      };
    });

    const projectMembersResponse = await page.evaluate(async () => {
      const response = await fetch('/rest/v1/project_members?select=*');

      return {
        ok: response.ok,
        body: await response.json(),
      };
    });

    expect(projectsResponse.ok).toBe(true);
    expect(projectsResponse.body).toEqual([
      { id: 'p1', name: 'Projet Test', code: 'PRJ-001', status: 'active' },
    ]);

    expect(projectMembersResponse.ok).toBe(true);
    expect(projectMembersResponse.body).toEqual([
      {
        project_id: 'p1',
        user_id: '626020ae-6102-450f-b83d-c6025cf90bdc',
        role: 'admin',
      },
    ]);
  });
});