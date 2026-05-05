# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> connexion/déconnexion
- Location: e2e\login.spec.ts:4:5

# Error details

```
Error: page.goto: NS_ERROR_CONNECTION_REFUSED
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - heading "Unable to connect" [level=1] [ref=e5]
    - paragraph [ref=e6]: Firefox can’t establish a connection to the server at localhost:5173.
    - paragraph
    - list [ref=e8]:
      - listitem [ref=e9]: The site could be temporarily unavailable or too busy. Try again in a few moments.
      - listitem [ref=e10]: If you are unable to load any pages, check your computer’s network connection.
      - listitem [ref=e11]: If your computer or network is protected by a firewall or proxy, make sure that Nightly is permitted to access the web.
  - button "Try Again" [active] [ref=e13]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { mockAll } from './utils/mocks';
  3  | 
  4  | test('connexion/déconnexion', async ({ page }) => {
  5  |   await mockAll(page);
> 6  |   await page.goto('/');
     |              ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
  7  |   await page.getByLabel('email').fill('test@user.com');
  8  |   await page.getByRole('button', { name: /se connecter/i }).click();
  9  |   await expect(page.getByText(/cockpit chantier/i)).toBeVisible();
  10 |   await page.getByRole('button', { name: /déconnexion/i }).click();
  11 |   await expect(page.getByLabel('email')).toBeVisible();
  12 | });
```