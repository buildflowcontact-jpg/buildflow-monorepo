# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.spec.ts >> homepage affiche le titre
- Location: e2e\homepage.spec.ts:4:5

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test';
  2 | import { mockAll } from './utils/mocks';
  3 | 
  4 | test('homepage affiche le titre', async ({ page }) => {
  5 |   await mockAll(page);
> 6 |   await page.goto('/');
    |              ^ Error: page.goto: Could not connect to server
  7 |   await expect(page.getByText(/Bienvenue sur BuildFlow/i)).toBeVisible();
  8 | });
  9 | 
```