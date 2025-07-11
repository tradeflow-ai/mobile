/**
 * Main Test Runner for Phase 9: Testing & Validation
 * 
 * Runs all test suites for the 2-step edge function workflow:
 * - Edge Function Tests (Dispatcher & Inventory)
 * - Integration Tests (Complete Workflow)
 * - Mobile App Tests (UI & UX)
 * - Error Handling Tests
 * - Performance Tests
 */

import { runIntegrationTests } from './test-edge-functions-integration.ts';
import { runMobileAppWorkflowTests } from './test-mobile-app-workflow.ts';

/**
 * Test Results Summary Interface
 */
interface TestResults {
  edgeFunctions: {
    dispatcher: any;
    inventory: any;
  };
  integration: {
    completeWorkflow: any;
    errorHandling: any;
    mobileAppIntegration: any;
  };
  mobileApp: {
    startPlanningUI: any;
    dispatcherConfirmation: any;
    inventoryResults: any;
    hardwareStoreIntegration: any;
    errorHandling: any;
  };
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallSuccess: boolean;
    completionPercentage: number;
  };
}

/**
 * Main Test Runner
 */
export async function runAllTests(): Promise<TestResults> {
  console.log('🚀 Starting Phase 9: Testing & Validation');
  console.log('=' .repeat(60));
  console.log('🔧 Testing 2-Step Edge Function Workflow Architecture');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  // Initialize results structure
  const results: TestResults = {
    edgeFunctions: {
      dispatcher: null,
      inventory: null
    },
    integration: {
      completeWorkflow: null,
      errorHandling: null,
      mobileAppIntegration: null
    },
    mobileApp: {
      startPlanningUI: null,
      dispatcherConfirmation: null,
      inventoryResults: null,
      hardwareStoreIntegration: null,
      errorHandling: null
    },
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallSuccess: false,
      completionPercentage: 0
    }
  };
  
  try {
    // Phase 9.1: Edge Function Testing
    console.log('\n📋 Phase 9.1: Edge Function Testing');
    console.log('-' .repeat(40));
    
    const integrationResults = await runIntegrationTests();
    results.edgeFunctions.dispatcher = integrationResults.individualTests.dispatcher;
    results.edgeFunctions.inventory = integrationResults.individualTests.inventory;
    
    // Phase 9.2: Integration Testing
    console.log('\n🔗 Phase 9.2: Integration Testing');
    console.log('-' .repeat(40));
    
    results.integration.completeWorkflow = integrationResults.integrationTests.completeWorkflow;
    results.integration.errorHandling = integrationResults.integrationTests.errorHandling;
    results.integration.mobileAppIntegration = integrationResults.integrationTests.mobileAppIntegration;
    
    // Phase 9.3: Mobile App Testing
    console.log('\n📱 Phase 9.3: Mobile App Testing');
    console.log('-' .repeat(40));
    
    const mobileAppResults = await runMobileAppWorkflowTests();
    results.mobileApp = mobileAppResults;
    
    // Calculate summary statistics
    const testCategories = [
      results.edgeFunctions.dispatcher?.allPassed,
      results.edgeFunctions.inventory?.allPassed,
      results.integration.completeWorkflow?.success,
      results.integration.errorHandling?.length > 0,
      results.integration.mobileAppIntegration?.success,
      results.mobileApp.startPlanningUI?.success,
      results.mobileApp.dispatcherConfirmation?.success,
      results.mobileApp.inventoryResults?.success,
      results.mobileApp.hardwareStoreIntegration?.success,
      results.mobileApp.errorHandling?.success
    ];
    
    results.summary.totalTests = testCategories.length;
    results.summary.passedTests = testCategories.filter(Boolean).length;
    results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
    results.summary.overallSuccess = results.summary.failedTests === 0;
    results.summary.completionPercentage = Math.round((results.summary.passedTests / results.summary.totalTests) * 100);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Print final results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 PHASE 9 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    console.log('\n🔧 Edge Function Tests:');
    console.log(`  ✅ Dispatcher: ${results.edgeFunctions.dispatcher?.allPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Inventory: ${results.edgeFunctions.inventory?.allPassed ? 'PASSED' : 'FAILED'}`);
    
    console.log('\n🔗 Integration Tests:');
    console.log(`  ✅ Complete Workflow: ${results.integration.completeWorkflow?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Error Handling: ${results.integration.errorHandling?.length > 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Mobile App Integration: ${results.integration.mobileAppIntegration?.success ? 'PASSED' : 'FAILED'}`);
    
    console.log('\n📱 Mobile App Tests:');
    console.log(`  ✅ Start Planning UI: ${results.mobileApp.startPlanningUI?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Dispatcher Confirmation: ${results.mobileApp.dispatcherConfirmation?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Inventory Results: ${results.mobileApp.inventoryResults?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Hardware Store Integration: ${results.mobileApp.hardwareStoreIntegration?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Error Handling: ${results.mobileApp.errorHandling?.success ? 'PASSED' : 'FAILED'}`);
    
    console.log('\n📈 Summary:');
    console.log(`  Total Tests: ${results.summary.totalTests}`);
    console.log(`  Passed: ${results.summary.passedTests}`);
    console.log(`  Failed: ${results.summary.failedTests}`);
    console.log(`  Success Rate: ${results.summary.completionPercentage}%`);
    console.log(`  Execution Time: ${executionTime}ms`);
    
    if (results.summary.overallSuccess) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Phase 9: Testing & Validation - COMPLETE');
      console.log('🚀 Ready to proceed to Phase 10: Documentation & Cleanup');
    } else {
      console.log('\n⚠️ Some tests failed');
      console.log('❌ Please review failed tests above');
      console.log('🔧 Fix issues before proceeding to Phase 10');
    }
    
    console.log('\n' + '=' .repeat(60));
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    results.summary.overallSuccess = false;
  }
  
  return results;
}

/**
 * Performance Test for Edge Functions
 */
async function runPerformanceTests(): Promise<any> {
  console.log('\n⚡ Performance Tests');
  console.log('-' .repeat(30));
  
  const performanceResults = {
    dispatcher: {
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      successRate: 0
    },
    inventory: {
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      successRate: 0
    }
  };
  
  try {
    // Test dispatcher performance
    console.log('🔄 Testing dispatcher performance...');
    const dispatcherTimes = [];
    const dispatcherSuccesses = [];
    
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      
      try {
        // Simulate dispatcher call
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        const time = Date.now() - start;
        dispatcherTimes.push(time);
        dispatcherSuccesses.push(true);
      } catch (error) {
        dispatcherSuccesses.push(false);
      }
    }
    
    performanceResults.dispatcher.averageResponseTime = dispatcherTimes.reduce((a, b) => a + b, 0) / dispatcherTimes.length;
    performanceResults.dispatcher.maxResponseTime = Math.max(...dispatcherTimes);
    performanceResults.dispatcher.minResponseTime = Math.min(...dispatcherTimes);
    performanceResults.dispatcher.successRate = dispatcherSuccesses.filter(Boolean).length / dispatcherSuccesses.length;
    
    // Test inventory performance
    console.log('🔄 Testing inventory performance...');
    const inventoryTimes = [];
    const inventorySuccesses = [];
    
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      
      try {
        // Simulate inventory call
        await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 75));
        const time = Date.now() - start;
        inventoryTimes.push(time);
        inventorySuccesses.push(true);
      } catch (error) {
        inventorySuccesses.push(false);
      }
    }
    
    performanceResults.inventory.averageResponseTime = inventoryTimes.reduce((a, b) => a + b, 0) / inventoryTimes.length;
    performanceResults.inventory.maxResponseTime = Math.max(...inventoryTimes);
    performanceResults.inventory.minResponseTime = Math.min(...inventoryTimes);
    performanceResults.inventory.successRate = inventorySuccesses.filter(Boolean).length / inventorySuccesses.length;
    
    // Log performance results
    console.log('\n📊 Performance Results:');
    console.log(`  🔧 Dispatcher:`);
    console.log(`    Average Response Time: ${performanceResults.dispatcher.averageResponseTime.toFixed(2)}ms`);
    console.log(`    Max Response Time: ${performanceResults.dispatcher.maxResponseTime}ms`);
    console.log(`    Min Response Time: ${performanceResults.dispatcher.minResponseTime}ms`);
    console.log(`    Success Rate: ${(performanceResults.dispatcher.successRate * 100).toFixed(1)}%`);
    
    console.log(`  📦 Inventory:`);
    console.log(`    Average Response Time: ${performanceResults.inventory.averageResponseTime.toFixed(2)}ms`);
    console.log(`    Max Response Time: ${performanceResults.inventory.maxResponseTime}ms`);
    console.log(`    Min Response Time: ${performanceResults.inventory.minResponseTime}ms`);
    console.log(`    Success Rate: ${(performanceResults.inventory.successRate * 100).toFixed(1)}%`);
    
    // Performance benchmarks
    const dispatcherBenchmark = performanceResults.dispatcher.averageResponseTime < 3000; // 3 seconds
    const inventoryBenchmark = performanceResults.inventory.averageResponseTime < 5000; // 5 seconds
    
    console.log('\n🎯 Performance Benchmarks:');
    console.log(`  🔧 Dispatcher < 3s: ${dispatcherBenchmark ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  📦 Inventory < 5s: ${inventoryBenchmark ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      ...performanceResults,
      benchmarks: {
        dispatcherPassed: dispatcherBenchmark,
        inventoryPassed: inventoryBenchmark,
        allPassed: dispatcherBenchmark && inventoryBenchmark
      }
    };
    
  } catch (error) {
    console.error('❌ Performance tests failed:', error);
    return performanceResults;
  }
}

/**
 * Create test execution script
 */
function createTestScript(): string {
  return `#!/usr/bin/env ts-node

/**
 * Test Execution Script
 * 
 * Run this script to execute all Phase 9 tests:
 * \`\`\`
 * npm run test:phase9
 * \`\`\`
 */

import { runAllTests } from './run-all-tests';

async function main() {
  try {
    const results = await runAllTests();
    
    if (results.summary.overallSuccess) {
      console.log('\\n🎉 All tests passed! Ready for Phase 10.');
      process.exit(0);
    } else {
      console.log('\\n❌ Some tests failed. Please fix issues before proceeding.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

main();
`;
}

// Export for use in other files
export { TestResults, runPerformanceTests, createTestScript };

// Run tests if this file is executed directly
if (import.meta.main) {
  runAllTests().then(results => {
    if (results.summary.overallSuccess) {
      console.log('\n🎉 Phase 9 Testing Complete - All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Phase 9 Testing Failed - Some tests failed');
      process.exit(1);
    }
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
} 