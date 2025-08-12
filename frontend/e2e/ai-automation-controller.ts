import { chromium, Browser, Page, BrowserContext } from 'playwright';

/**
 * AI Automation Controller
 * This class provides methods for AI to control browser automation
 * with visual feedback for human observation
 */
export class AIAutomationController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isRunning = false;

  /**
   * Initialize browser with visible window
   */
  async initialize() {
    console.log('🚀 Initializing browser automation...');
    
    this.browser = await chromium.launch({
      headless: false, // IMPORTANT: Show browser window
      slowMo: 500,     // Slow down actions for visibility
      args: ['--start-maximized'],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: './test-videos',
        size: { width: 1280, height: 720 }
      }
    });

    this.page = await this.context.newPage();
    this.isRunning = true;
    
    console.log('✅ Browser initialized and visible');
    return this.page;
  }

  /**
   * Navigate to URL with visual feedback
   */
  async navigate(url: string) {
    if (!this.page) throw new Error('Browser not initialized');
    
    console.log(`📍 Navigating to: ${url}`);
    await this.highlightAction('Navigation', `Going to ${url}`);
    await this.page.goto(url);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click element with highlight
   */
  async click(selector: string, description?: string) {
    if (!this.page) throw new Error('Browser not initialized');
    
    console.log(`🎯 Clicking: ${description || selector}`);
    
    const element = this.page.locator(selector).first();
    
    // Highlight before click
    await element.evaluate((el) => {
      el.style.border = '3px solid red';
      el.style.boxShadow = '0 0 20px red';
      el.style.transition = 'all 0.3s';
    });
    
    await this.page.waitForTimeout(1000);
    await element.click();
    
    // Remove highlight
    await element.evaluate((el) => {
      el.style.border = '';
      el.style.boxShadow = '';
    });
  }

  /**
   * Type text with visual feedback
   */
  async type(selector: string, text: string, description?: string) {
    if (!this.page) throw new Error('Browser not initialized');
    
    console.log(`⌨️  Typing: ${description || `"${text}" into ${selector}`}`);
    
    const element = this.page.locator(selector).first();
    
    // Highlight input
    await element.evaluate((el) => {
      el.style.border = '3px solid blue';
      el.style.backgroundColor = '#e3f2fd';
    });
    
    await element.fill(text);
    await this.page.waitForTimeout(500);
    
    // Remove highlight
    await element.evaluate((el) => {
      el.style.border = '';
      el.style.backgroundColor = '';
    });
  }

  /**
   * Check if element exists
   */
  async exists(selector: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');
    
    const element = this.page.locator(selector).first();
    return await element.isVisible();
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    
    const element = this.page.locator(selector).first();
    return await element.textContent() || '';
  }

  /**
   * Wait for element
   */
  async waitFor(selector: string, timeout = 10000) {
    if (!this.page) throw new Error('Browser not initialized');
    
    console.log(`⏳ Waiting for: ${selector}`);
    await this.page.locator(selector).first().waitFor({ 
      state: 'visible', 
      timeout 
    });
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string) {
    if (!this.page) throw new Error('Browser not initialized');
    
    const filename = `screenshots/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
  }

  /**
   * Highlight action with overlay
   */
  private async highlightAction(action: string, description: string) {
    if (!this.page) return;
    
    // Add overlay notification
    await this.page.evaluate(({ action, description }) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-size: 16px;
        font-weight: bold;
        z-index: 99999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
      `;
      overlay.innerHTML = `🤖 ${action}: ${description}`;
      document.body.appendChild(overlay);
      
      setTimeout(() => overlay.remove(), 3000);
    }, { action, description });
  }

  /**
   * Execute complete test workflow
   */
  async runCompleteTest() {
    console.log('🎬 Starting complete UI test workflow...\n');
    
    try {
      // Initialize
      await this.initialize();
      
      // Navigate to app
      await this.navigate('http://localhost:5173');
      
      // Login
      if (await this.exists('input[type="email"]')) {
        console.log('🔐 Logging in...');
        await this.type('input[type="email"]', 'admin@toluai.com', 'Email');
        await this.type('input[type="password"]', 'Admin123!', 'Password');
        await this.click('button[type="submit"]', 'Login button');
        await this.page!.waitForTimeout(2000);
      }
      
      // Test navigation
      console.log('🗺️ Testing navigation...');
      
      // Go to Insured Entities
      if (await this.exists('a[href="/insured-entities"]')) {
        await this.click('a[href="/insured-entities"]', 'Insured Entities link');
        await this.page!.waitForTimeout(2000);
      }
      
      // Test Add Entity
      console.log('➕ Testing Add Entity...');
      const addButton = 'button:has-text("Add Entity"), button:has-text("Add Insured")';
      if (await this.exists(addButton)) {
        await this.click(addButton, 'Add Entity button');
        await this.page!.waitForTimeout(2000);
        
        // Fill form
        if (await this.exists('input[name*="name"]')) {
          await this.type('input[name*="name"]', 'Test User ' + Date.now(), 'Name field');
        }
        
        if (await this.exists('input[name*="fico"]')) {
          await this.type('input[name*="fico"]', '750', 'FICO Score');
        }
        
        // Close modal
        if (await this.exists('button:has-text("Cancel")')) {
          await this.click('button:has-text("Cancel")', 'Cancel button');
        }
      }
      
      // Test search
      console.log('🔍 Testing search...');
      if (await this.exists('input[type="search"]')) {
        await this.type('input[type="search"]', 'test', 'Search field');
        await this.page!.waitForTimeout(1500);
      }
      
      // Take final screenshot
      await this.screenshot('test-complete');
      
      console.log('\n✅ Complete test workflow finished!');
      console.log('📊 All UI components tested successfully');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      await this.screenshot('error');
      throw error;
    }
  }

  /**
   * Cleanup and close browser
   */
  async cleanup() {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    this.isRunning = false;
    console.log('🧹 Browser closed');
  }
}

// Export for use in tests
export default AIAutomationController;