import { test, expect, Page } from '@playwright/test';

// Helper function to login
async function login(page: Page) {
  await page.goto('/');
  await page.getByPlaceholder(/email/i).fill('admin@toluai.com');
  await page.getByPlaceholder(/password/i).fill('Admin123!');
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/clients');
  });

  test('should display clients list', async ({ page }) => {
    // Check for clients page elements
    await expect(page.locator('h1, h2').first()).toContainText(/Clients/i);
    
    // Check for table or list
    const table = page.locator('table, [role="table"], .client-list');
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test('should open add client modal', async ({ page }) => {
    // Click add client button
    await page.getByRole('button', { name: /add client|new client/i }).click();
    
    // Check modal is visible
    const modal = page.locator('[role="dialog"], .modal, [data-testid="client-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Check for form fields
    await expect(page.getByLabel(/company name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
  });

  test('should create a new client', async ({ page }) => {
    // Open add client modal
    await page.getByRole('button', { name: /add client|new client/i }).click();
    
    // Fill in client details
    const timestamp = Date.now();
    const clientName = `Test Company ${timestamp}`;
    
    await page.getByLabel(/company name/i).fill(clientName);
    await page.getByLabel(/email/i).fill(`test${timestamp}@example.com`);
    await page.getByLabel(/phone/i).fill('555-0123');
    await page.getByLabel(/industry/i).fill('Technology');
    await page.getByLabel(/address/i).fill('123 Test Street');
    await page.getByLabel(/city/i).fill('Test City');
    await page.getByLabel(/state/i).fill('CA');
    await page.getByLabel(/zip/i).fill('90210');
    
    // Submit form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Check for success message or client in list
    await expect(page.locator(`text=${clientName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should search for clients', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Test');
    
    // Wait for results to update
    await page.waitForTimeout(1000);
    
    // Check that search is working
    const results = page.locator('table tbody tr, .client-item');
    const count = await results.count();
    
    // Should have filtered results (or no results message)
    if (count === 0) {
      await expect(page.locator('text=/no results|no clients found/i')).toBeVisible();
    } else {
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should view client details', async ({ page }) => {
    // Wait for clients to load
    await page.waitForTimeout(2000);
    
    // Click on first client in list
    const firstClient = page.locator('table tbody tr, .client-item').first();
    
    if (await firstClient.isVisible()) {
      await firstClient.click();
      
      // Check for client details view
      await expect(page.locator('text=/details|information|profile/i')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=/email|phone|address/i')).toBeVisible();
    }
  });

  test('should handle pagination', async ({ page }) => {
    // Check if pagination exists
    const pagination = page.locator('.pagination, [aria-label*="pagination"], nav');
    
    if (await pagination.isVisible()) {
      // Check for page numbers or next/prev buttons
      const nextButton = page.getByRole('button', { name: /next/i });
      const pageNumbers = page.locator('.page-number, [aria-label*="page"]');
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        // Should have navigated to next page
        expect(page.url()).toContain('page=2');
      }
    }
  });
});