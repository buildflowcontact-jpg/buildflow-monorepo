# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.spec.ts >> homepage affiche le titre
- Location: e2e\homepage.spec.ts:4:5

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
  1 | import { test, expect } from '@playwright/test';
  2 | import { mockAll } from './utils/mocks';
  3 | 
  4 | test('homepage affiche le titre', async ({ page }) => {
  5 |   await mockAll(page);
> 6 |   await page.goto('/');
    |              ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
  7 |   await expect(page.getByText(/Bienvenue sur BuildFlow/i)).toBeVisible();
  8 | });
  9 | 
```