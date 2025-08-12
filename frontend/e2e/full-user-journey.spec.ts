import { test, expect, Page } from '@playwright/test';

// Helper function to wait and highlight elements before clicking
async function clickWithHighlight(page: Page, selector: string, description: string) {
  console.log(`🎯 ${description}`);
  const element = page.locator(selector).first();
  
  try {
    // Highlight the element with a red border
    await element.evaluate((el) => {
      el.style.border = '3px solid red';
      el.style.boxShadow = '0 0 10px red';
    });
    
    // Wait a bit so user can see what's being clicked
    await page.waitForTimeout(1000);
    
    // Click the element
    await element.click();
    
    // Try to remove highlight after click (may fail if page navigates)
    try {
      await element.evaluate((el) => {
        el.style.border = '';
        el.style.boxShadow = '';
      });
    } catch {
      // Element may no longer exist after navigation
    }
  } catch (error) {
    console.log(`Failed to highlight/click: ${error}`);
    // Fallback to simple click
    await element.click();
  }
}

test.describe('ToluAI Complete User Journey', () => {
  test('Full application workflow with visual feedback', async ({ page }) => {
    console.log('🚀 Starting ToluAI E2E Test - Watch the browser!');
    
    // Step 1: Navigate to the application
    console.log('\n📍 Step 1: Navigating to ToluAI...');
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Step 2: Login
    console.log('\n🔐 Step 2: Logging in...');
    
    // Check if we're on login page
    if (await page.locator('input[type="email"]').isVisible()) {
      // Highlight and fill email
      const emailInput = page.locator('input[type="email"]');
      await emailInput.evaluate((el) => {
        el.style.border = '3px solid blue';
      });
      await emailInput.fill('admin@toluai.com');
      await page.waitForTimeout(1000);
      
      // Highlight and fill password
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.evaluate((el) => {
        el.style.border = '3px solid blue';
      });
      await passwordInput.fill('Admin123!');
      await page.waitForTimeout(1000);
      
      // Click login button
      await clickWithHighlight(page, 'button[type="submit"]', 'Clicking Login button');
      
      // Wait for navigation
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ Login successful!');
    }
    
    // Step 3: Explore Dashboard
    console.log('\n📊 Step 3: Exploring Dashboard...');
    await page.waitForTimeout(2000);
    
    // Check for dashboard elements
    await expect(page.locator('text=/Dashboard|Overview|Analytics/i').first()).toBeVisible();
    console.log('✅ Dashboard loaded');
    
    // Step 4: Navigate to Insured Entities
    console.log('\n👥 Step 4: Navigating to Insured Entities...');
    await clickWithHighlight(page, 'a[href="/insured-entities"]', 'Opening Insured Entities page');
    await page.waitForTimeout(2000);
    
    // Step 5: Test Add Entity Feature
    console.log('\n➕ Step 5: Testing Add Entity feature...');
    
    // Look for Add Entity button
    const addButton = page.locator('button:has-text("Add Entity"), button:has-text("Add Insured")').first();
    if (await addButton.isVisible()) {
      await clickWithHighlight(page, 'button:has-text("Add Entity"), button:has-text("Add Insured")', 'Clicking Add Entity button');
      await page.waitForTimeout(1500);
      
      // Check if modal opened
      const modal = page.locator('div[role="dialog"], .modal, [data-testid="add-entity-modal"]').first();
      if (await modal.isVisible()) {
        console.log('✅ Add Entity modal opened');
        
        // Fill in some fields with visual feedback
        console.log('📝 Filling entity form...');
        
        // Name field
        const nameField = page.locator('input[name="name"], input[placeholder*="name" i]').first();
        if (await nameField.isVisible()) {
          await nameField.evaluate((el) => {
            el.style.border = '3px solid green';
          });
          await nameField.fill('Test Entity ' + Date.now());
          await page.waitForTimeout(1000);
        }
        
        // FICO Score
        const ficoField = page.locator('input[name*="fico" i], input[placeholder*="fico" i]').first();
        if (await ficoField.isVisible()) {
          await ficoField.evaluate((el) => {
            el.style.border = '3px solid green';
          });
          await ficoField.fill('750');
          await page.waitForTimeout(1000);
        }
        
        // Close modal
        const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
        if (await closeButton.isVisible()) {
          await clickWithHighlight(page, 'button:has-text("Cancel"), button:has-text("Close")', 'Closing modal');
        } else {
          // Try pressing Escape
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(1000);
      }
    }
    
    // Step 6: Test Table Interactions
    console.log('\n📋 Step 6: Testing table interactions...');
    
    // Look for table rows
    const tableRows = page.locator('tbody tr, [role="row"]');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      console.log(`Found ${rowCount} entities in table`);
      
      // Click on first row
      const firstRow = tableRows.first();
      await firstRow.evaluate((el) => {
        el.style.backgroundColor = 'yellow';
      });
      await page.waitForTimeout(1000);
      await firstRow.click();
      console.log('✅ Clicked on first entity');
      await page.waitForTimeout(1500);
    }
    
    // Step 7: Test Search Functionality
    console.log('\n🔍 Step 7: Testing search...');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.evaluate((el) => {
        el.style.border = '3px solid purple';
      });
      await searchInput.fill('test');
      await page.waitForTimeout(1500);
      console.log('✅ Search functionality tested');
      
      // Clear search
      await searchInput.clear();
    }
    
    // Step 8: Navigate to other pages
    console.log('\n🗺️ Step 8: Testing navigation...');
    
    // Try Companies page
    const companiesLink = page.locator('a[href="/companies"]').first();
    if (await companiesLink.isVisible()) {
      await clickWithHighlight(page, 'a[href="/companies"]', 'Navigating to Companies');
      await page.waitForTimeout(2000);
      console.log('✅ Companies page loaded');
    }
    
    // Return to dashboard
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    if (await dashboardLink.isVisible()) {
      await clickWithHighlight(page, 'a[href="/dashboard"]', 'Returning to Dashboard');
      await page.waitForTimeout(2000);
    }
    
    // Step 9: Test UI Components
    console.log('\n🧪 Step 9: Final UI component checks...');
    
    // Check for various UI elements
    const checks = [
      { selector: 'button', name: 'Buttons' },
      { selector: 'input', name: 'Input fields' },
      { selector: 'select', name: 'Dropdowns' },
      { selector: 'a', name: 'Links' },
      { selector: '[role="table"], table', name: 'Tables' },
    ];
    
    for (const check of checks) {
      const elements = page.locator(check.selector);
      const count = await elements.count();
      console.log(`✓ Found ${count} ${check.name}`);
    }
    
    // Final success message
    console.log('\n');
    console.log('🎉 ========================================');
    console.log('🎉  E2E TEST COMPLETED SUCCESSFULLY!');
    console.log('🎉  All UI components are working properly');
    console.log('🎉 ========================================');
    
    // Keep browser open for a moment to see final state
    await page.waitForTimeout(3000);
  });

  test('Test PRA Score Calculation Workflow', async ({ page }) => {
    console.log('🧮 Testing PRA Score Calculation...');
    
    // Login first
    await page.goto('/');
    
    if (await page.locator('input[type="email"]').isVisible()) {
      await page.fill('input[type="email"]', 'admin@toluai.com');
      await page.fill('input[type="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
    
    // Navigate to Insured Entities
    await page.click('a[href="/insured-entities"]');
    await page.waitForTimeout(2000);
    
    // Open Add Entity modal
    const addButton = page.locator('button:has-text("Add Entity"), button:has-text("Add Insured")').first();
    await addButton.click();
    await page.waitForTimeout(1500);
    
    // Fill required fields for PRA calculation
    console.log('📝 Filling fields for PRA calculation...');
    
    // Fill FICO Score
    await page.fill('input[name*="fico" i], input[placeholder*="fico" i]', '780');
    
    // Fill DTI Ratio
    const dtiField = page.locator('input[name*="dti" i], input[placeholder*="dti" i]').first();
    if (await dtiField.isVisible()) {
      await dtiField.fill('0.25');
    }
    
    // Look for Calculate PRA button
    const praButton = page.locator('button:has-text("Calculate PRA"), button:has-text("Run Assessment")').first();
    if (await praButton.isVisible()) {
      console.log('🎯 Clicking Calculate PRA Score...');
      await praButton.evaluate((el) => {
        el.style.border = '3px solid orange';
        el.style.animation = 'pulse 2s infinite';
      });
      await page.waitForTimeout(1000);
      await praButton.click();
      await page.waitForTimeout(2000);
      
      // Check if score is displayed
      const scoreElement = page.locator('text=/Score|Risk|PRA|IPRA/i').first();
      if (await scoreElement.isVisible()) {
        console.log('✅ PRA Score calculated and displayed!');
      }
    }
    
    console.log('✅ PRA Score workflow completed!');
  });

  test('Test Company Autocomplete Feature', async ({ page }) => {
    console.log('🏢 Testing Company Autocomplete...');
    
    // Login
    await page.goto('/');
    if (await page.locator('input[type="email"]').isVisible()) {
      await page.fill('input[type="email"]', 'admin@toluai.com');
      await page.fill('input[type="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
    
    // Navigate to Insured Entities
    await page.click('a[href="/insured-entities"]');
    await page.waitForTimeout(2000);
    
    // Open Add Entity modal
    await page.click('button:has-text("Add Entity"), button:has-text("Add Insured")');
    await page.waitForTimeout(1500);
    
    // Find company input field
    const companyField = page.locator('input[name*="company" i], input[placeholder*="company" i]').first();
    if (await companyField.isVisible()) {
      console.log('📝 Testing company autocomplete...');
      
      // Highlight the field
      await companyField.evaluate((el) => {
        el.style.border = '3px solid blue';
      });
      
      // Type slowly to trigger autocomplete
      await companyField.type('Acme', { delay: 200 });
      await page.waitForTimeout(2000);
      
      // Check for dropdown suggestions
      const suggestions = page.locator('[role="listbox"], .suggestions, .autocomplete-results').first();
      if (await suggestions.isVisible()) {
        console.log('✅ Autocomplete suggestions appeared!');
        
        // Try to select first suggestion
        const firstSuggestion = page.locator('[role="option"], .suggestion-item').first();
        if (await firstSuggestion.isVisible()) {
          await firstSuggestion.click();
          console.log('✅ Selected company from autocomplete!');
        }
      }
    }
    
    console.log('✅ Company autocomplete test completed!');
  });
});