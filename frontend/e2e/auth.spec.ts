import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Check for login form elements
    await expect(page.locator('h1, h2').first()).toContainText(/Sign In|Login/i);
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Try to login with invalid credentials
    await page.getByPlaceholder(/email/i).fill('invalid@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Wait for error message
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Use demo credentials
    await page.getByPlaceholder(/email/i).fill('admin@toluai.com');
    await page.getByPlaceholder(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('text=/dashboard|welcome/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.getByPlaceholder(/email/i).fill('admin@toluai.com');
    await page.getByPlaceholder(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Find and click logout
    const userMenu = page.locator('[aria-label*="user"], [aria-label*="profile"], button:has-text("admin@toluai.com")').first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByRole('button', { name: /logout|sign out/i }).click();
    } else {
      // Direct logout button
      await page.getByRole('button', { name: /logout|sign out/i }).click();
    }
    
    // Should redirect to login
    await expect(page.getByPlaceholder(/email/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle session expiry', async ({ page }) => {
    // Login
    await page.getByPlaceholder(/email/i).fill('admin@toluai.com');
    await page.getByPlaceholder(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Clear storage to simulate session expiry
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Try to navigate to protected route
    await page.goto('/clients');
    
    // Should redirect to login
    await expect(page.getByPlaceholder(/email/i)).toBeVisible({ timeout: 5000 });
  });
});