# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> connexion/déconnexion
- Location: e2e\login.spec.ts:4:5

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { mockAll } from './utils/mocks';
  3  | 
  4  | test('connexion/déconnexion', async ({ page }) => {
  5  |   await mockAll(page);
> 6  |   await page.goto('/');
     |              ^ Error: page.goto: Could not connect to server
  7  |   await page.getByLabel('email').fill('test@user.com');
  8  |   await page.getByRole('button', { name: /se connecter/i }).click();
  9  |   await expect(page.getByText(/cockpit chantier/i)).toBeVisible();
  10 |   await page.getByRole('button', { name: /déconnexion/i }).click();
  11 |   await expect(page.getByLabel('email')).toBeVisible();
  12 | });
```