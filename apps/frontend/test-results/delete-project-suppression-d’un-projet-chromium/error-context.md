# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: delete-project.spec.ts >> suppression d’un projet
- Location: e2e\delete-project.spec.ts:4:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { mockAll } from './utils/mocks';
  3  | 
  4  | test('suppression d’un projet', async ({ page }) => {
  5  |   await mockAll(page);
> 6  |   await page.goto('/');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  7  |   await page.getByLabel('email').fill('test@user.com');
  8  |   await page.getByRole('button', { name: /se connecter/i }).click();
  9  |   await expect(page.getByText(/cockpit chantier/i)).toBeVisible();
  10 |   await page.getByText(/Projet Test/i).click();
  11 |   // Simule la suppression côté API
  12 |   await page.route('**/rest/v1/projects/p1', route => {
  13 |     if (route.request().method() === 'DELETE') {
  14 |       route.fulfill({ status: 204 });
  15 |     } else {
  16 |       route.continue();
  17 |     }
  18 |   });
  19 |   await page.getByRole('button', { name: /supprimer/i }).click();
  20 |   // Après suppression, on mocke la liste vide
  21 |   await page.waitForTimeout(100); // Laisse le temps au mock de s’appliquer
  22 |   await expect(page.getByText(/Projet Test/i)).not.toBeVisible();
  23 | });
```