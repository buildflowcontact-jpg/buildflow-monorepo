# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: project.spec.ts >> création d’un projet
- Location: e2e\project.spec.ts:4:5

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
  4  | test('création d’un projet', async ({ page }) => {
  5  |   await mockAll(page);
> 6  |   await page.goto('/');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  7  |   await page.getByLabel('email').fill('test@user.com');
  8  |   await page.getByRole('button', { name: /se connecter/i }).click();
  9  |   await expect(page.getByText(/cockpit chantier/i)).toBeVisible();
  10 |   await page.getByRole('button', { name: /nouveau projet/i }).click();
  11 |   await page.getByLabel('nom du projet').fill('Projet Test');
  12 |   // Simule la création du projet côté API
  13 |   await page.route('**/rest/v1/projects', route => {
  14 |     if (route.request().method() === 'POST') {
  15 |       route.fulfill({
  16 |         status: 201,
  17 |         contentType: 'application/json',
  18 |         body: JSON.stringify({ id: 'p2', name: 'Projet Test' }),
  19 |       });
  20 |     } else {
  21 |       route.continue();
  22 |     }
  23 |   });
  24 |   await page.getByRole('button', { name: /créer/i }).click();
  25 |   // Après création, on mocke la liste avec le nouveau projet
  26 |   await page.waitForTimeout(100); // Laisse le temps au mock de s’appliquer
  27 |   await expect(page.getByText(/Projet Test/i)).toBeVisible();
  28 | });
  29 | 
```