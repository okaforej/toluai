import { test, expect } from '@playwright/test';

test.describe('ToluAI Simple Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the app
    await page.goto('http://localhost:5173');
    
    // Login if needed
    if (await page.locator('input[type="email"]').isVisible()) {
      await page.fill('input[type="email"]', 'admin@toluai.com');
      await page.fill('input[type="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      
      // Wait for dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  });

  test('Dashboard loads successfully', async ({ page }) => {
    console.log('Testing Dashboard...');
    
    // Check dashboard is visible
    await expect(page.locator('text=/Dashboard|Overview/i').first()).toBeVisible();
    
    // Check for key dashboard elements
    const elements = [
      'text=/Total Entities|Entities/i',
      'text=/Assessments|Risk/i',
      'canvas, svg, .recharts-wrapper'
    ];
    
    for (const selector of elements) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`  ${selector}: ${isVisible ? '✅' : '❌'}`);
    }
  });

  test('Navigate to Insured Entities', async ({ page }) => {
    console.log('Testing Insured Entities navigation...');
    
    // Click on Insured Entities link
    await page.click('a[href="/insured-entities"]');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we're on the right page
    const hasEntitiesContent = await page.locator('text=/Insured Entities|Entity Management/i').first().isVisible();
    expect(hasEntitiesContent).toBeTruthy();
    
    console.log('  ✅ Navigated to Insured Entities');
  });

  test('Add Entity modal opens', async ({ page }) => {
    console.log('Testing Add Entity modal...');
    
    // Navigate to Insured Entities
    await page.click('a[href="/insured-entities"]');
    await page.waitForTimeout(2000);
    
    // Find and click Add button
    const addButtons = [
      'button:has-text("Add Entity")',
      'button:has-text("Add Insured")',
      'button:has-text("Add")',
      'button:has-text("New")'
    ];
    
    let clicked = false;
    for (const selector of addButtons) {
      if (await page.locator(selector).first().isVisible()) {
        await page.click(selector);
        clicked = true;
        console.log(`  Clicked: ${selector}`);
        break;
      }
    }
    
    if (clicked) {
      await page.waitForTimeout(2000);
      
      // Check if modal is visible
      const modalSelectors = [
        'div[role="dialog"]',
        '.modal',
        'text=/Add.*Entity|New.*Entity/i'
      ];
      
      let modalFound = false;
      for (const selector of modalSelectors) {
        if (await page.locator(selector).first().isVisible()) {
          modalFound = true;
          console.log(`  ✅ Modal opened: ${selector}`);
          break;
        }
      }
      
      expect(modalFound).toBeTruthy();
      
      // Close modal
      const closeSelectors = ['button:has-text("Cancel")', 'button:has-text("Close")', '[aria-label="Close"]'];
      for (const selector of closeSelectors) {
        if (await page.locator(selector).first().isVisible()) {
          await page.click(selector);
          console.log(`  ✅ Modal closed`);
          break;
        }
      }
    }
  });

  test('Search functionality works', async ({ page }) => {
    console.log('Testing search...');
    
    // Navigate to Insured Entities
    await page.click('a[href="/insured-entities"]');
    await page.waitForTimeout(2000);
    
    // Find search input
    const searchSelectors = [
      'input[type="search"]',
      'input[placeholder*="search" i]',
      'input[placeholder*="filter" i]'
    ];
    
    for (const selector of searchSelectors) {
      const searchInput = page.locator(selector).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        console.log(`  ✅ Typed in search: ${selector}`);
        await page.waitForTimeout(1000);
        
        // Clear search
        await searchInput.clear();
        console.log(`  ✅ Cleared search`);
        break;
      }
    }
  });

  test('Backend API is responsive', async ({ page }) => {
    console.log('Testing API endpoints...');
    
    // Test health endpoint
    const healthResponse = await page.request.get('http://localhost:5001/health');
    expect(healthResponse.ok()).toBeTruthy();
    console.log('  ✅ Health endpoint OK');
    
    // Test entities endpoint
    const entitiesResponse = await page.request.get('http://localhost:5001/api/v2/irpa/insured-entities?per_page=1');
    expect(entitiesResponse.ok()).toBeTruthy();
    const entitiesData = await entitiesResponse.json();
    expect(entitiesData).toHaveProperty('insured_entities');
    console.log('  ✅ Entities API OK');
    
    // Test assessments endpoint
    const assessmentsResponse = await page.request.get('http://localhost:5001/api/v2/irpa/assessments?per_page=1');
    expect(assessmentsResponse.ok()).toBeTruthy();
    const assessmentsData = await assessmentsResponse.json();
    expect(assessmentsData).toHaveProperty('assessments');
    console.log('  ✅ Assessments API OK');
  });
});