/**
 * Test file for LangGraph implementation
 * 
 * This file tests the complete daily planning workflow with real agents
 * to ensure all components work together correctly.
 */

import { executeDailyPlanningWorkflow } from './graph';
import { testMockSupplierAPI } from './tools/mockSupplier';

/**
 * Test the complete daily planning workflow
 */
export async function testDailyPlanningWorkflow() {
  try {
    console.log('🧪 Testing Daily Planning Workflow...');
    
    // Test mock supplier API first
    console.log('\n📦 Testing Mock Supplier API...');
    await testMockSupplierAPI();
    
    // Test the full workflow
    console.log('\n🚀 Testing Complete Agent Workflow...');
    
    const result = await executeDailyPlanningWorkflow({
      userId: 'test-user-123',
      jobIds: ['job-1', 'job-2', 'job-3'],
      planDate: '2024-01-15'
    });
    
    console.log('✅ Daily planning workflow test successful!');
    console.log('📊 Result summary:');
    console.log(`  - Plan ID: ${result.planId}`);
    console.log(`  - Current Step: ${result.currentStep}`);
    console.log(`  - Is Complete: ${result.isComplete}`);
    console.log(`  - Dispatch Jobs: ${result.dispatchOutput?.prioritized_jobs.length || 0}`);
    console.log(`  - Route Waypoints: ${result.routeOutput?.optimized_route.waypoints.length || 0}`);
    console.log(`  - Shopping Items: ${result.inventoryOutput?.shopping_list.length || 0}`);
    console.log(`  - Hardware Store Runs: ${result.inventoryOutput?.hardware_store_run?.store_locations.length || 0}`);
    
    return result;
  } catch (error) {
    console.error('❌ Daily planning workflow test failed:', error);
    throw error;
  }
}

/**
 * Test individual agent functions
 */
export async function testIndividualAgents() {
  try {
    console.log('🎯 Testing Individual Agents...');
    
    // Import agent functions
    const { 
      executeDispatchStrategist, 
      executeRouteOptimizer, 
      executeInventorySpecialist 
    } = await import('./agents');
    
    const testContext = {
      userId: 'test-user-123',
      planId: 'test-plan-123', 
      jobIds: ['job-1', 'job-2'],
      planDate: '2024-01-15'
    };
    
    console.log('\n🎯 Testing Dispatch Strategist...');
    const dispatchOutput = await executeDispatchStrategist(testContext);
    console.log(`✅ Dispatch complete: ${dispatchOutput.prioritized_jobs.length} jobs prioritized`);
    
    console.log('\n🗺️ Testing Route Optimizer...');
    const routeOutput = await executeRouteOptimizer(testContext, dispatchOutput);
    console.log(`✅ Route complete: ${routeOutput.optimized_route.waypoints.length} waypoints`);
    
    console.log('\n📦 Testing Inventory Specialist...');
    const inventoryOutput = await executeInventorySpecialist(testContext, dispatchOutput);
    console.log(`✅ Inventory complete: ${inventoryOutput.shopping_list.length} items to shop for`);
    
    console.log('🎉 All individual agent tests passed!');
    
    return {
      dispatch: dispatchOutput,
      route: routeOutput,
      inventory: inventoryOutput
    };
  } catch (error) {
    console.error('❌ Individual agent tests failed:', error);
    throw error;
  }
}

/**
 * Test preference integration
 */
export async function testPreferenceIntegration() {
  try {
    console.log('⚙️ Testing Preference Integration...');
    
    const { PreferencesService } = await import('../services/preferencesService');
    
    // Test preference formatting
    const mockPreferences = {
      work_start_time: '08:00',
      work_end_time: '17:00',
      travel_buffer_percentage: 15,
      primary_supplier: 'Home Depot',
      emergency_job_types: ['emergency', 'urgent'],
      vip_client_ids: ['client-001', 'client-002']
    };
    
    console.log('\n📋 Testing Dispatcher Preferences...');
    const dispatcherPrefs = PreferencesService.formatDispatcherPreferences(mockPreferences as any);
    console.log(`✅ Formatted ${Object.keys(dispatcherPrefs).length} dispatcher preferences`);
    
    console.log('\n🗺️ Testing Router Preferences...');  
    const routerPrefs = PreferencesService.formatRouterPreferences(mockPreferences as any);
    console.log(`✅ Formatted ${Object.keys(routerPrefs).length} router preferences`);
    
    console.log('\n📦 Testing Inventory Preferences...');
    const inventoryPrefs = PreferencesService.formatInventoryPreferences(mockPreferences as any);
    console.log(`✅ Formatted ${Object.keys(inventoryPrefs).length} inventory preferences`);
    
    console.log('\n🔗 Testing Prompt Injection...');
    const testPrompt = 'Work hours: {work_start_time} to {work_end_time}. Travel buffer: {travel_buffer_percentage}%';
    const injectedPrompt = PreferencesService.injectPreferencesIntoPrompt(testPrompt, dispatcherPrefs);
    console.log(`✅ Prompt injection successful: ${injectedPrompt.includes('08:00') ? 'PASS' : 'FAIL'}`);
    
    console.log('✅ Preference integration tests passed!');
    
    return {
      dispatcher: dispatcherPrefs,
      router: routerPrefs,
      inventory: inventoryPrefs,
      injected: injectedPrompt
    };
  } catch (error) {
    console.error('❌ Preference integration tests failed:', error);
    throw error;
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🚀 Starting TradeFlow AI Agent Tests\n');
  
  try {
    // Run all test suites
    const results = await Promise.allSettled([
      testPreferenceIntegration(),
      testDailyPlanningWorkflow(),
      testIndividualAgents()
    ]);
    
    // Count results
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log('\n📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total Test Suites: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / results.length) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const testNames = ['Preference Integration', 'Daily Planning Workflow', 'Individual Agents'];
          console.log(`  - ${testNames[index]}: ${result.reason}`);
        }
      });
    }
    
    if (passed === results.length) {
      console.log('🎉 ALL TESTS PASSED! AI Agent system is ready for integration.');
    } else {
      console.log('⚠️  Some tests failed. Review the output above for details.');
    }
    
    return passed === results.length;
  } catch (error) {
    console.error('💥 Test suite execution failed:', error);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      console.log(success ? '\n🎯 All systems ready!' : '\n💥 Tests failed!');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
} 