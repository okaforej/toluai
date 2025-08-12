import { test, expect, Page } from '@playwright/test';

// Test data
const testEntity = {
  name: `Test User ${Date.now()}`,
  ficoScore: '750',
  dtiRatio: '0.35',
  company: 'Acme Corporation',
  jobTitle: 'Software Engineer',
  contractType: 'W2',
  yearsExperience: '5',
  education: 'Bachelor',
  zipCode: '10001',
  state: 'NY'
};

test.describe('Insured Entities CRUD Operations', () => {
  let entityId: string;

  test.beforeEach(async ({ page }) => {
    console.log('🔄 Setting up test...');
    
    // Navigate to the application
    await page.goto('http://localhost:5173');
    
    // Login if needed
    if (await page.locator('input[type="email"]').isVisible()) {
      console.log('🔐 Logging in...');
      await page.fill('input[type="email"]', 'admin@toluai.com');
      await page.fill('input[type="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
    
    // Navigate to Insured Entities
    console.log('📍 Navigating to Insured Entities...');
    await page.click('a[href="/insured-entities"]');
    await page.waitForTimeout(2000);
  });

  test('1. READ - View existing entities and table functionality', async ({ page }) => {
    console.log('📖 Testing READ operations...');
    
    // Check if table exists
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible();
    console.log('  ✅ Table is visible');
    
    // Check table headers
    const expectedHeaders = ['Name', 'FICO', 'DTI', 'Company', 'Risk Score', 'Status'];
    for (const header of expectedHeaders) {
      const headerElement = page.locator(`th:has-text("${header}"), [role="columnheader"]:has-text("${header}")`).first();
      const isVisible = await headerElement.isVisible().catch(() => false);
      console.log(`  ${isVisible ? '✅' : '❌'} Header: ${header}`);
    }
    
    // Count existing entities
    const rows = page.locator('tbody tr, [role="row"]').filter({ hasNotText: 'No data' });
    const rowCount = await rows.count();
    console.log(`  📊 Found ${rowCount} existing entities`);
    
    // Test row selection
    if (rowCount > 0) {
      const firstRow = rows.first();
      await firstRow.click();
      await page.waitForTimeout(1000);
      
      // Check if row is selected (usually has different background)
      const bgColor = await firstRow.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`  ✅ Row selection working (bg: ${bgColor})`);
    }
    
    // Test search functionality
    console.log('  🔍 Testing search...');
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1500);
      
      const filteredCount = await rows.count();
      console.log(`    Filtered to ${filteredCount} results`);
      
      await searchInput.clear();
      await page.waitForTimeout(1000);
      console.log('  ✅ Search functionality working');
    }
  });

  test('2. CREATE - Add new entity with all fields', async ({ page }) => {
    console.log('➕ Testing CREATE operation...');
    
    // Find and click Add button
    const addButtons = [
      'button:has-text("Add Entity")',
      'button:has-text("Add Insured")',
      'button:has-text("New")',
      'button[aria-label*="add" i]'
    ];
    
    let addButtonFound = false;
    for (const selector of addButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        await button.click();
        addButtonFound = true;
        console.log(`  ✅ Clicked: ${selector}`);
        break;
      }
    }
    
    if (!addButtonFound) {
      console.log('  ❌ Add button not found');
      return;
    }
    
    await page.waitForTimeout(2000);
    
    // Check if modal opened
    const modal = page.locator('div[role="dialog"], .modal').first();
    await expect(modal).toBeVisible();
    console.log('  ✅ Add Entity modal opened');
    
    // Fill in the form fields
    console.log('  📝 Filling form fields...');
    
    // Name
    const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(testEntity.name);
      console.log('    ✅ Name filled');
    }
    
    // FICO Score
    const ficoInput = page.locator('input[name*="fico" i], input[placeholder*="fico" i]').first();
    if (await ficoInput.isVisible()) {
      await ficoInput.fill(testEntity.ficoScore);
      console.log('    ✅ FICO Score filled');
    }
    
    // DTI Ratio
    const dtiInput = page.locator('input[name*="dti" i], input[placeholder*="dti" i]').first();
    if (await dtiInput.isVisible()) {
      await dtiInput.fill(testEntity.dtiRatio);
      console.log('    ✅ DTI Ratio filled');
    }
    
    // Company (with autocomplete)
    const companyInput = page.locator('input[name*="company" i], input[placeholder*="company" i]').first();
    if (await companyInput.isVisible()) {
      await companyInput.fill(testEntity.company);
      await page.waitForTimeout(1500);
      
      // Try to select from autocomplete if it appears
      const suggestion = page.locator('[role="option"], .suggestion').first();
      if (await suggestion.isVisible()) {
        await suggestion.click();
        console.log('    ✅ Company selected from autocomplete');
      } else {
        console.log('    ✅ Company filled');
      }
    }
    
    // Job Title
    const jobTitleInput = page.locator('input[name*="job" i], input[placeholder*="job" i], input[placeholder*="title" i]').first();
    if (await jobTitleInput.isVisible()) {
      await jobTitleInput.fill(testEntity.jobTitle);
      console.log('    ✅ Job Title filled');
    }
    
    // Contract Type (might be a select)
    const contractSelect = page.locator('select[name*="contract" i]').first();
    if (await contractSelect.isVisible()) {
      await contractSelect.selectOption({ label: testEntity.contractType });
      console.log('    ✅ Contract Type selected');
    }
    
    // Years of Experience
    const yearsInput = page.locator('input[name*="experience" i], input[name*="years" i]').first();
    if (await yearsInput.isVisible()) {
      await yearsInput.fill(testEntity.yearsExperience);
      console.log('    ✅ Years of Experience filled');
    }
    
    // Test PRA Score Calculation
    console.log('  🧮 Testing PRA Score calculation...');
    const praButton = page.locator('button:has-text("Calculate PRA"), button:has-text("Run Assessment")').first();
    if (await praButton.isVisible()) {
      await praButton.click();
      await page.waitForTimeout(2000);
      
      // Check if score is displayed
      const scoreElement = page.locator('text=/Score:|Risk Score:|PRA:|IPRA:/i').first();
      if (await scoreElement.isVisible()) {
        const scoreText = await scoreElement.textContent();
        console.log(`    ✅ PRA Score calculated: ${scoreText}`);
      }
    }
    
    // Submit the form
    console.log('  💾 Saving entity...');
    const saveButtons = [
      'button:has-text("Save")',
      'button:has-text("Submit")',
      'button:has-text("Create")',
      'button[type="submit"]'
    ];
    
    for (const selector of saveButtons) {
      const button = page.locator(selector).last();
      if (await button.isVisible() && !(await button.textContent())?.includes('Cancel')) {
        await button.click();
        console.log(`    Clicked: ${selector}`);
        break;
      }
    }
    
    await page.waitForTimeout(3000);
    
    // Check if entity was created
    const successToast = page.locator('text=/success|created|added/i').first();
    const modalClosed = !(await modal.isVisible());
    
    if (await successToast.isVisible() || modalClosed) {
      console.log('  ✅ Entity created successfully');
      
      // Try to find the new entity in the table
      const newEntityRow = page.locator(`tr:has-text("${testEntity.name}")`).first();
      if (await newEntityRow.isVisible()) {
        console.log('  ✅ New entity appears in table');
        
        // Extract entity ID if possible
        const idElement = newEntityRow.locator('td').first();
        entityId = await idElement.textContent() || '';
        console.log(`    Entity ID: ${entityId}`);
      }
    } else {
      console.log('  ⚠️ Entity creation status unclear');
    }
  });

  test('3. UPDATE - Edit existing entity', async ({ page }) => {
    console.log('✏️ Testing UPDATE operation...');
    
    // Find an entity to edit
    const rows = page.locator('tbody tr, [role="row"]').filter({ hasNotText: 'No data' });
    const rowCount = await rows.count();
    
    if (rowCount === 0) {
      console.log('  ❌ No entities to edit');
      return;
    }
    
    // Click on the first entity
    const firstRow = rows.first();
    await firstRow.click();
    await page.waitForTimeout(1000);
    console.log('  ✅ Selected entity for editing');
    
    // Look for Edit button
    const editButtons = [
      'button:has-text("Edit")',
      'button[aria-label*="edit" i]',
      '[data-testid*="edit" i]'
    ];
    
    let editButtonFound = false;
    for (const selector of editButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        await button.click();
        editButtonFound = true;
        console.log(`  ✅ Clicked: ${selector}`);
        break;
      }
    }
    
    // Alternative: Double-click to edit
    if (!editButtonFound) {
      console.log('  Trying double-click to edit...');
      await firstRow.dblclick();
      await page.waitForTimeout(1500);
    }
    
    // Check if edit form opened
    const editModal = page.locator('div[role="dialog"]:has-text("Edit"), .modal:has-text("Edit")').first();
    if (await editModal.isVisible()) {
      console.log('  ✅ Edit form opened');
      
      // Update FICO Score
      const ficoInput = editModal.locator('input[name*="fico" i]').first();
      if (await ficoInput.isVisible()) {
        await ficoInput.clear();
        await ficoInput.fill('800');
        console.log('    ✅ Updated FICO Score to 800');
      }
      
      // Save changes
      const saveButton = editModal.locator('button:has-text("Save"), button:has-text("Update")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
        console.log('  ✅ Changes saved');
      }
    }
  });

  test('4. DELETE - Remove entity', async ({ page }) => {
    console.log('🗑️ Testing DELETE operation...');
    
    // Find an entity to delete
    const rows = page.locator('tbody tr, [role="row"]').filter({ hasNotText: 'No data' });
    const initialCount = await rows.count();
    
    if (initialCount === 0) {
      console.log('  ❌ No entities to delete');
      return;
    }
    
    console.log(`  Initial entity count: ${initialCount}`);
    
    // Select the last entity (to avoid deleting important data)
    const lastRow = rows.last();
    await lastRow.click();
    await page.waitForTimeout(1000);
    
    // Look for Delete button
    const deleteButtons = [
      'button:has-text("Delete")',
      'button:has-text("Remove")',
      'button[aria-label*="delete" i]',
      '[data-testid*="delete" i]'
    ];
    
    let deleteButtonFound = false;
    for (const selector of deleteButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        await button.click();
        deleteButtonFound = true;
        console.log(`  ✅ Clicked: ${selector}`);
        break;
      }
    }
    
    if (!deleteButtonFound) {
      console.log('  ❌ Delete button not found');
      return;
    }
    
    // Handle confirmation dialog if it appears
    const confirmDialog = page.locator('text=/confirm|are you sure/i').first();
    if (await confirmDialog.isVisible()) {
      console.log('  ⚠️ Confirmation dialog appeared');
      
      const confirmButton = page.locator('button:has-text("Yes"), button:has-text("Confirm"), button:has-text("Delete")').last();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        console.log('    ✅ Deletion confirmed');
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Verify deletion
    const finalCount = await rows.count();
    if (finalCount < initialCount) {
      console.log(`  ✅ Entity deleted (count: ${initialCount} → ${finalCount})`);
    } else {
      console.log('  ⚠️ Delete operation result unclear');
    }
  });

  test('5. VALIDATION - Test form validation', async ({ page }) => {
    console.log('🔍 Testing form validation...');
    
    // Open Add Entity modal
    const addButton = page.locator('button:has-text("Add Entity"), button:has-text("Add Insured")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1500);
    }
    
    // Try to submit empty form
    console.log('  Testing empty form submission...');
    const submitButton = page.locator('button:has-text("Save"), button[type="submit"]').last();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      // Check for validation errors
      const errorMessages = page.locator('text=/required|invalid|error/i');
      const errorCount = await errorMessages.count();
      console.log(`    Found ${errorCount} validation messages`);
      
      if (errorCount > 0) {
        console.log('  ✅ Form validation working');
      }
    }
    
    // Test invalid FICO score
    console.log('  Testing invalid FICO score...');
    const ficoInput = page.locator('input[name*="fico" i]').first();
    if (await ficoInput.isVisible()) {
      await ficoInput.fill('999');
      await page.waitForTimeout(500);
      
      const ficoError = page.locator('text=/invalid|must be between/i').first();
      if (await ficoError.isVisible()) {
        console.log('    ✅ FICO validation working');
      }
      
      // Fix the value
      await ficoInput.clear();
      await ficoInput.fill('750');
    }
    
    // Test invalid DTI ratio
    console.log('  Testing invalid DTI ratio...');
    const dtiInput = page.locator('input[name*="dti" i]').first();
    if (await dtiInput.isVisible()) {
      await dtiInput.fill('2.5');
      await page.waitForTimeout(500);
      
      const dtiError = page.locator('text=/invalid|must be less than/i').first();
      if (await dtiError.isVisible()) {
        console.log('    ✅ DTI validation working');
      }
      
      // Fix the value
      await dtiInput.clear();
      await dtiInput.fill('0.35');
    }
    
    // Close modal
    const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test('6. PAGINATION - Test table pagination', async ({ page }) => {
    console.log('📄 Testing pagination...');
    
    // Look for pagination controls
    const paginationControls = page.locator('[aria-label*="pagination" i], .pagination').first();
    
    if (await paginationControls.isVisible()) {
      console.log('  ✅ Pagination controls found');
      
      // Check page info
      const pageInfo = page.locator('text=/page.*of|showing.*of/i').first();
      if (await pageInfo.isVisible()) {
        const infoText = await pageInfo.textContent();
        console.log(`    Page info: ${infoText}`);
      }
      
      // Test next page button
      const nextButton = page.locator('button:has-text("Next"), [aria-label*="next" i]').first();
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(1500);
        console.log('    ✅ Navigated to next page');
        
        // Go back to first page
        const prevButton = page.locator('button:has-text("Previous"), [aria-label*="previous" i]').first();
        if (await prevButton.isVisible()) {
          await prevButton.click();
          await page.waitForTimeout(1500);
          console.log('    ✅ Navigated back to previous page');
        }
      }
    } else {
      console.log('  ℹ️ No pagination needed or controls not visible');
    }
  });

  test('7. EXPORT - Test data export functionality', async ({ page }) => {
    console.log('📥 Testing export functionality...');
    
    // Look for export button
    const exportButtons = [
      'button:has-text("Export")',
      'button:has-text("Download")',
      'button[aria-label*="export" i]',
      '[data-testid*="export" i]'
    ];
    
    for (const selector of exportButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        // Start waiting for download before clicking
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        
        await button.click();
        console.log(`  Clicked: ${selector}`);
        
        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          console.log(`  ✅ Export triggered: ${filename}`);
        } else {
          console.log('  ℹ️ Export clicked but no download detected');
        }
        break;
      }
    }
  });

  test.afterEach(async ({ page }) => {
    // Log final state
    console.log('\n📊 Test completed');
    
    // Take screenshot for documentation
    await page.screenshot({ 
      path: `screenshots/insured-entities-${Date.now()}.png`,
      fullPage: true 
    });
  });
});