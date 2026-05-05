# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: error.spec.ts >> affichage d’une erreur réseau
- Location: e2e\error.spec.ts:4:5

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
  4  | test('affichage d’une erreur réseau', async ({ page }) => {
  5  |   await mockAll(page);
> 6  |   await page.goto('/');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  7  |   // Simule une action qui provoque une erreur (ex : mauvais endpoint)
  8  |   await page.route('**/rest/v1/documents', route => route.abort());
  9  |   await page.getByRole('button', { name: /charger les documents/i }).click();
  10 |   await expect(page.getByText(/erreur/i)).toBeVisible();
  11 | });
  12 | 
```