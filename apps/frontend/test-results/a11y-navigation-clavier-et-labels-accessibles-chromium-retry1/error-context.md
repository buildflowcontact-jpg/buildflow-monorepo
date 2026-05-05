# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> navigation clavier et labels accessibles
- Location: e2e\a11y.spec.ts:4:5

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
  4  | test('navigation clavier et labels accessibles', async ({ page }) => {
  5  |   await mockAll(page);
> 6  |   await page.goto('/');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  7  |   // Tabule jusqu’au premier champ de formulaire
  8  |   await page.keyboard.press('Tab');
  9  |   await expect(page.locator('input[type=email]')).toBeFocused();
  10 |   // Vérifie la présence d’un label
  11 |   await expect(page.getByLabel('email')).toBeVisible();
  12 | });
  13 | 
```