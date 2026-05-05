import { test, expect } from '@playwright/test';
import { mockAllNoAuth } from './utils/mocks';

test('la page d accueil ne charge pas les chunks viewers lourds', async ({ page }) => {
  await mockAllNoAuth(page);

  const loadedScripts: string[] = [];
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/assets/') && url.endsWith('.js')) {
      loadedScripts.push(url);
    }
  });

  await page.goto('/');
  await expect(page.getByText(/Bienvenue sur BuildFlow/i)).toBeVisible();

  const forbiddenTokens = [
    'PDFAnnotator-',
    'pdf_viewer-',
    'ifcCore-',
    'ifcViewer-',
    'ifcThree-',
    'ifcControls-',
    'ifcBvh-',
    'threeVendor-',
    'imageViewer-',
  ];

  const offenders = loadedScripts.filter((url) => forbiddenTokens.some((token) => url.includes(token)));
  expect(offenders).toEqual([]);
});
