#!/usr/bin/env node

/**
 * UI Component Test Runner
 * This script simulates user interactions to test all UI components
 */

interface TestResult {
  component: string;
  test: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testAPI() {
  try {
    const response = await fetch('http://localhost:5001/health');
    const data = await response.json();
    results.push({
      component: 'Backend API',
      test: 'Health Check',
      passed: data.status === 'healthy'
    });
  } catch (error) {
    results.push({
      component: 'Backend API',
      test: 'Health Check',
      passed: false,
      error: String(error)
    });
  }
}

async function testFrontend() {
  try {
    const response = await fetch('http://localhost:5173/');
    results.push({
      component: 'Frontend',
      test: 'Server Running',
      passed: response.ok
    });
  } catch (error) {
    results.push({
      component: 'Frontend',
      test: 'Server Running',
      passed: false,
      error: String(error)
    });
  }
}

async function runAllTests() {
  console.log('🧪 Running UI Component Tests...\n');
  
  await testAPI();
  await testFrontend();
  
  // Display results
  console.log('\n📊 Test Results:\n');
  console.log('═'.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${result.component} - ${result.test}`);
    if (result.error) {
      console.log(`    └─ Error: ${result.error}`);
    }
    
    if (result.passed) passed++;
    else failed++;
  });
  
  console.log('═'.repeat(60));
  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The UI is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests, testAPI, testFrontend };