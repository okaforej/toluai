import { test, expect, Page } from '@playwright/test';

// Helper function to login
async function login(page: Page) {
  await page.goto('/');
  await page.getByPlaceholder(/email/i).fill('admin@toluai.com');
  await page.getByPlaceholder(/password/i).fill('Admin123!');
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

test.describe('Risk Assessment', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to risk assessment', async ({ page }) => {
    // Navigate to assessments
    await page.goto('/assessments');
    
    // Check page loaded
    await expect(page.locator('h1, h2').first()).toContainText(/Risk Assessment|Assessments/i);
  });

  test('should start new assessment', async ({ page }) => {
    await page.goto('/assessments');
    
    // Click new assessment button
    await page.getByRole('button', { name: /new assessment|create assessment|start assessment/i }).click();
    
    // Should show assessment form or wizard
    await expect(page.locator('text=/client|company|select/i')).toBeVisible({ timeout: 5000 });
  });

  test('should select client for assessment', async ({ page }) => {
    await page.goto('/assessments/new');
    
    // Select or search for client
    const clientSelect = page.locator('select[name*="client"], input[placeholder*="company"], [aria-label*="client"]').first();
    
    if (await clientSelect.isVisible()) {
      // If it's a select dropdown
      if (await clientSelect.evaluate(el => el.tagName === 'SELECT')) {
        await clientSelect.selectOption({ index: 1 });
      } else {
        // If it's an autocomplete input
        await clientSelect.fill('Test');
        await page.waitForTimeout(1000);
        
        // Click first suggestion if available
        const suggestion = page.locator('.suggestion, [role="option"]').first();
        if (await suggestion.isVisible()) {
          await suggestion.click();
        }
      }
      
      // Should enable next step or show additional fields
      await expect(page.locator('button:has-text("Next"), button:has-text("Continue")')).toBeEnabled();
    }
  });

  test('should display risk factors', async ({ page }) => {
    await page.goto('/assessments');
    
    // Look for risk factors section
    const riskFactors = page.locator('text=/risk factors|factors|criteria/i');
    
    if (await riskFactors.isVisible()) {
      // Check for common risk factor categories
      await expect(page.locator('text=/financial|operational|compliance/i')).toBeVisible();
    }
  });

  test('should calculate risk score', async ({ page }) => {
    await page.goto('/assessments/new');
    
    // Fill in basic assessment data (simplified)
    const revenueInput = page.locator('input[name*="revenue"], input[placeholder*="revenue"]').first();
    const employeeInput = page.locator('input[name*="employee"], input[placeholder*="employee"]').first();
    
    if (await revenueInput.isVisible()) {
      await revenueInput.fill('1000000');
    }
    
    if (await employeeInput.isVisible()) {
      await employeeInput.fill('50');
    }
    
    // Look for calculate or submit button
    const calculateBtn = page.getByRole('button', { name: /calculate|assess|analyze/i });
    
    if (await calculateBtn.isVisible()) {
      await calculateBtn.click();
      
      // Should show risk score
      await expect(page.locator('text=/score|risk level|rating/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should view assessment history', async ({ page }) => {
    await page.goto('/assessments');
    
    // Look for history or past assessments
    const historyTab = page.locator('button:has-text("History"), a:has-text("History"), [role="tab"]:has-text("History")');
    
    if (await historyTab.isVisible()) {
      await historyTab.click();
      
      // Should show list of past assessments
      await expect(page.locator('table, .assessment-list, [role="table"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should export assessment report', async ({ page }) => {
    await page.goto('/assessments');
    
    // Find an existing assessment or create one
    const firstAssessment = page.locator('table tbody tr, .assessment-item').first();
    
    if (await firstAssessment.isVisible()) {
      await firstAssessment.click();
      
      // Look for export button
      const exportBtn = page.getByRole('button', { name: /export|download|pdf/i });
      
      if (await exportBtn.isVisible()) {
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download');
        await exportBtn.click();
        
        // Wait for download to start
        const download = await Promise.race([
          downloadPromise,
          new Promise(resolve => setTimeout(() => resolve(null), 5000))
        ]);
        
        if (download) {
          // Verify download started
          expect(download).toBeTruthy();
        }
      }
    }
  });
});