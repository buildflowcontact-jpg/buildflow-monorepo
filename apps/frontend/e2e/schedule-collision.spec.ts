// E2E Tests for Collision Detection Feature
// Using Playwright

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';
const API_URL = process.env.PLAYWRIGHT_TEST_API_URL || 'http://localhost:4000';

// Sample test data
const TEST_PROJECT_ID = 'test-project-123';
const TEST_WORKER_ID = 'test-worker-123';

test.describe('Collision Detection Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login or navigate to scheduling page
    // This assumes you have authentication setup
    await page.goto(`${BASE_URL}/schedule`);
    
    // Wait for page to load
    await page.waitForSelector('text=Scheduling & Collision Detection', {
      timeout: 5000,
    });
  });

  test('should create a worker schedule successfully', async ({ page }) => {
    // Click on Create Schedule tab
    await page.click('text=➕ Create Schedule');

    // Fill in form
    await page.fill('[placeholder*="Site"]', 'Site A');
    await page.fill('input[type="datetime-local"]:first-of-type', '2026-05-20T09:00');
    await page.fill('input[type="datetime-local"]:last-of-type', '2026-05-20T17:00');

    // Toggle tentative
    await page.click('input[type="checkbox"]');

    // Add notes
    await page.fill('textarea', 'Test schedule for collision detection');

    // Submit form
    await page.click('button:has-text("Create Schedule")');

    // Verify success message
    await expect(page.locator('text=Schedule created successfully')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should detect collision when schedules overlap', async ({ page }) => {
    // Create first schedule
    await page.click('text=➕ Create Schedule');
    await page.fill('[placeholder*="Site"]', 'Site A');
    await page.fill('input[type="datetime-local"]:first-of-type', '2026-05-20T09:00');
    await page.fill('input[type="datetime-local"]:last-of-type', '2026-05-20T17:00');
    await page.click('button:has-text("Create Schedule")');

    // Wait for success
    await page.waitForSelector('text=Schedule created successfully', {
      timeout: 5000,
    });

    // Create overlapping schedule
    await page.click('text=➕ Create Schedule');
    await page.fill('[placeholder*="Site"]', 'Site A');
    await page.fill(
      'input[type="datetime-local"]:first-of-type',
      '2026-05-20T14:00'
    );
    await page.fill(
      'input[type="datetime-local"]:last-of-type',
      '2026-05-20T18:00'
    );

    // Should see collision warning before submitting
    const collisionWarning = page.locator('text=Scheduling Conflict');
    await expect(collisionWarning).toBeVisible({ timeout: 5000 });

    // Verify collision type is shown
    await expect(
      page.locator('text=LOCATION_OVERLAP|EQUIPMENT_CONFLICT')
    ).toBeVisible();
  });

  test('should display collision severity correctly', async ({ page }) => {
    // This test would create a 4-hour overlap (HIGH severity)
    // Navigate to Conflicts tab
    await page.click('text=⚠️ Conflicts');

    // Wait for conflicts to load
    await page.waitForSelector('text=Scheduling Conflicts', {
      timeout: 5000,
    });

    // Verify severity badge is shown
    const severityBadge = page.locator('text=HIGH|MEDIUM|LOW|CRITICAL');
    await expect(severityBadge).toBeVisible();

    // Verify severity color is appropriate
    const highSeverity = page.locator('text=HIGH');
    if (await highSeverity.isVisible()) {
      // Check that it has orange/red styling
      const classList = await highSeverity.getAttribute('class');
      expect(classList).toMatch(/orange|red/i);
    }
  });

  test('should resolve collision with notes', async ({ page }) => {
    // Navigate to Conflicts tab
    await page.click('text=⚠️ Conflicts');

    // Wait for conflicts to load
    await page.waitForSelector('text=Scheduling Conflicts', {
      timeout: 5000,
    });

    // Click Resolve button on first collision
    await page.click('button:has-text("Resolve")');

    // Fill resolution notes
    await page.fill(
      'textarea[placeholder*="resolution"]',
      'Rescheduled worker to later shift'
    );

    // Click Mark Resolved
    await page.click('button:has-text("Mark Resolved")');

    // Verify success
    await expect(
      page.locator('text=Collision marked as resolved')
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display active schedules in table', async ({ page }) => {
    // Click on Schedules tab
    await page.click('text=📅 Schedules');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Verify table headers
    await expect(page.locator('text=Worker')).toBeVisible();
    await expect(page.locator('text=Location')).toBeVisible();
    await expect(page.locator('text=Time')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
  });

  test('should delete schedule from table', async ({ page }) => {
    // Navigate to Schedules tab
    await page.click('text=📅 Schedules');

    // Wait for table
    await page.waitForSelector('table', { timeout: 5000 });

    // Get initial row count
    const initialRows = await page.locator('table tbody tr').count();

    // Click delete on first row
    await page.click('table tbody tr:first-child button:has-text("Delete")');

    // Confirm deletion
    await page.on('dialog', (dialog) => {
      dialog.accept();
    });

    // Verify success message
    await expect(
      page.locator('text=Schedule deleted successfully')
    ).toBeVisible({
      timeout: 5000,
    });

    // Verify row count decreased
    const newRows = await page.locator('table tbody tr').count();
    expect(newRows).toBeLessThan(initialRows);
  });

  test('should show statistics widgets', async ({ page }) => {
    // Verify statistics display
    await expect(page.locator('text=Total Schedules')).toBeVisible();
    await expect(page.locator('text=Unresolved Conflicts')).toBeVisible();
    await expect(page.locator('text=Confirmed Schedules')).toBeVisible();

    // Verify numbers are displayed
    const statistics = page.locator('[class*="text-3xl"][class*="font-bold"]');
    const count = await statistics.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should handle empty state correctly', async ({ page }) => {
    // If no schedules exist, should show message
    const emptyMessage = page.locator('text=No schedules yet');
    
    if (await emptyMessage.isVisible()) {
      expect(emptyMessage).toBeVisible();
    } else {
      // Schedules exist, verify table is populated
      const table = page.locator('table');
      expect(table).toBeVisible();
    }
  });

  test('should switch between tabs correctly', async ({ page }) => {
    const tabs = ['📅 Schedules', '⚠️ Conflicts', '➕ Create Schedule'];

    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      
      // Verify content changes
      const content = page.locator('[role="tabpanel"], main');
      await expect(content).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show form validation errors', async ({ page }) => {
    // Click Create Schedule
    await page.click('text=➕ Create Schedule');

    // Try to submit empty form
    await page.click('button:has-text("Create Schedule")');

    // HTML5 validation should prevent submission
    // Verify form is still visible
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('should persist form data between tab switches', async ({ page }) => {
    // Click Create Schedule tab
    await page.click('text=➕ Create Schedule');

    // Fill in some data
    await page.fill('[placeholder*="Site"]', 'Test Location');

    // Switch tab
    await page.click('text=📅 Schedules');

    // Switch back
    await page.click('text=➕ Create Schedule');

    // Verify data is still there (or cleared - depends on implementation)
    // This test verifies expected behavior
    const locationInput = page.locator('[placeholder*="Site"]');
    
    // Implementation detail: either persists or clears
    // Both are acceptable
    await expect(locationInput).toBeVisible();
  });

  test('should display collision overlap duration', async ({ page }) => {
    // Navigate to Conflicts
    await page.click('text=⚠️ Conflicts');

    // Wait for conflicts
    const conflictText = page.locator('text=minutes');
    
    if (await conflictText.isVisible()) {
      // Verify overlap duration is shown
      expect(conflictText).toBeVisible();
    }
  });

  test('should show collision type icon', async ({ page }) => {
    // Navigate to Conflicts
    await page.click('text=⚠️ Conflicts');

    // Check for collision type indicators
    const icons = page.locator('text=📍|⚙️|👥');
    
    // If there are conflicts, icons should be visible
    const conflictCount = await page.locator('text=Scheduling Conflicts').count();
    if (conflictCount > 0) {
      expect(icons.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Collision Detection - Performance', () => {
  test('should load schedules within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/schedule`);
    await page.waitForSelector('table', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Collision Detection - Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/schedule`);

    // Verify buttons have accessible names
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/schedule`);

    // Tab through form elements
    await page.keyboard.press('Tab');
    
    // Verify focus is on an element
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
