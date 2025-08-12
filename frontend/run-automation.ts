#!/usr/bin/env npx tsx

/**
 * Run Browser Automation
 * This script runs the AI automation controller to test the UI
 */

import AIAutomationController from './e2e/ai-automation-controller';

async function main() {
  console.log('=====================================');
  console.log('🤖 ToluAI Browser Automation Runner');
  console.log('=====================================\n');
  console.log('This will open a browser window and');
  console.log('automatically test all UI components.\n');
  console.log('👀 Watch the browser to see the automation!\n');
  
  const controller = new AIAutomationController();
  
  try {
    // Run the complete test
    await controller.runCompleteTest();
    
    console.log('\n🎉 All tests completed successfully!');
    
    // Keep browser open for 5 seconds to see final state
    console.log('Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('\n❌ Automation failed:', error);
  } finally {
    // Cleanup
    await controller.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}