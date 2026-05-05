// e2e/utils/mocks.ts
import { Page, Route } from '@playwright/test';

export async function mockAuth(page: Page, email = 'test@user.com') {
  await page.route('**/auth/v1/token*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'fake', user: { id: '1', email } }),
    })
  );
  await page.route('**/auth/v1/user*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: '1', email } }),
    })
  );
  await page.route('**/auth/v1/logout*', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );
}

export async function mockProjects(page: Page, projects = [{ id: 'p1', name: 'Projet Test' }]) {
  await page.route('**/rest/v1/projects*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(projects),
    })
  );
}

export async function mockDocuments(page: Page, documents = []) {
  await page.route('**/rest/v1/documents*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(documents),
    })
  );
}

export async function mockAll(page: Page) {
  await mockAuth(page);
  await mockProjects(page);
  await mockDocuments(page);
}
