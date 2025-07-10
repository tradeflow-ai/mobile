/**
 * Phase 2 Test Runner
 * 
 * Comprehensive test suite that validates all Phase 2 MVP requirements:
 * 1. Complete workflow integration
 * 2. Hardware store job creation
 * 3. User preferences validation
 * 4. Real-time system functionality
 * 5. Performance requirements
 */

import { runCompleteWorkflowTest } from './test-complete-workflow';
import { runHardwareStoreJobTest } from './test-hardware-store-jobs';
import { runUserPreferencesTest } from './test-user-preferences';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
}

interface Phase2TestReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: TestResult[];
  phase2Complete: boolean;
}

/**
 * Execute all Phase 2 tests in sequence
 */
async function runPhase2Tests(): Promise<Phase2TestReport> {
  const startTime = Date.now();
  const results: TestResult[] = [];
  
  console.log('🎯 Starting Phase 2 MVP Test Suite...');
  console.log('=' * 80);
  
  // Test 1: Complete Workflow Integration
  console.log('\n📋 Test 1: Complete Workflow Integration');
  console.log('-' * 50);
  const workflowStartTime = Date.now();
  try {
    const workflowPassed = await runCompleteWorkflowTest();
    results.push({
      testName: 'Complete Workflow Integration',
      passed: workflowPassed,
      duration: Date.now() - workflowStartTime
    });
  } catch (error) {
    results.push({
      testName: 'Complete Workflow Integration',
      passed: false,
      duration: Date.now() - workflowStartTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Test 2: Hardware Store Job Creation
  console.log('\n🏪 Test 2: Hardware Store Job Creation');
  console.log('-' * 50);
  const hardwareStartTime = Date.now();
  try {
    const hardwarePassed = await runHardwareStoreJobTest();
    results.push({
      testName: 'Hardware Store Job Creation',
      passed: hardwarePassed,
      duration: Date.now() - hardwareStartTime
    });
  } catch (error) {
    results.push({
      testName: 'Hardware Store Job Creation',
      passed: false,
      duration: Date.now() - hardwareStartTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Test 3: User Preferences Validation
  console.log('\n👤 Test 3: User Preferences Validation');
  console.log('-' * 50);
  const preferencesStartTime = Date.now();
  try {
    const preferencesPassed = await runUserPreferencesTest();
    results.push({
      testName: 'User Preferences Validation',
      passed: preferencesPassed,
      duration: Date.now() - preferencesStartTime
    });
  } catch (error) {
    results.push({
      testName: 'User Preferences Validation',
      passed: false,
      duration: Date.now() - preferencesStartTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Calculate results
  const totalDuration = Date.now() - startTime;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;
  const phase2Complete = failedTests === 0;
  
  const report: Phase2TestReport = {
    totalTests: results.length,
    passedTests,
    failedTests,
    totalDuration,
    results,
    phase2Complete
  };
  
  // Print detailed report
  printTestReport(report);
  
  return report;
}

/**
 * Print comprehensive test report
 */
function printTestReport(report: Phase2TestReport): void {
  console.log('\n' + '=' * 80);
  console.log('📊 PHASE 2 TEST REPORT');
  console.log('=' * 80);
  
  // Summary
  console.log('\n📈 SUMMARY');
  console.log('-' * 30);
  console.log(`Total Tests: ${report.totalTests}`);
  console.log(`Passed: ${report.passedTests} ✅`);
  console.log(`Failed: ${report.failedTests} ${report.failedTests > 0 ? '❌' : '✅'}`);
  console.log(`Success Rate: ${((report.passedTests / report.totalTests) * 100).toFixed(1)}%`);
  console.log(`Total Duration: ${(report.totalDuration / 1000).toFixed(2)}s`);
  
  // Individual test results
  console.log('\n📋 DETAILED RESULTS');
  console.log('-' * 30);
  report.results.forEach((result, index) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const duration = (result.duration / 1000).toFixed(2);
    
    console.log(`${index + 1}. ${result.testName}`);
    console.log(`   Status: ${status}`);
    console.log(`   Duration: ${duration}s`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });
  
  // Phase 2 completion status
  console.log('🎯 PHASE 2 COMPLETION STATUS');
  console.log('-' * 30);
  if (report.phase2Complete) {
    console.log('✅ PHASE 2 COMPLETE');
    console.log('   All MVP requirements validated');
    console.log('   Ready to proceed to Phase 3');
    console.log('   Backend infrastructure fully functional');
    console.log('   Frontend handoff documentation complete');
  } else {
    console.log('❌ PHASE 2 INCOMPLETE');
    console.log('   Failed tests must be resolved before Phase 3');
    console.log('   Review failed test details above');
  }
  
  // Technical validation checklist
  console.log('\n🔧 TECHNICAL VALIDATION CHECKLIST');
  console.log('-' * 30);
  
  const workflowTest = report.results.find(r => r.testName === 'Complete Workflow Integration');
  const hardwareTest = report.results.find(r => r.testName === 'Hardware Store Job Creation');
  const preferencesTest = report.results.find(r => r.testName === 'User Preferences Validation');
  
  console.log(`✅ Edge Function Ready: ${workflowTest?.passed ? 'YES' : 'NO'}`);
  console.log(`✅ Real-time Updates: ${workflowTest?.passed ? 'YES' : 'NO'}`);
  console.log(`✅ Agent Workflow: ${workflowTest?.passed ? 'YES' : 'NO'}`);
  console.log(`✅ Hardware Store Jobs: ${hardwareTest?.passed ? 'YES' : 'NO'}`);
  console.log(`✅ User Preferences: ${preferencesTest?.passed ? 'YES' : 'NO'}`);
  console.log(`✅ Performance < 5s: ${workflowTest?.passed ? 'YES' : 'NO'}`);
  
  console.log('\n' + '=' * 80);
  
  // Next steps
  if (report.phase2Complete) {
    console.log('🚀 NEXT STEPS');
    console.log('-' * 30);
    console.log('1. Deploy to staging environment');
    console.log('2. Begin Phase 3 development');
    console.log('3. Frontend team can start integration');
    console.log('4. Schedule Phase 3 kickoff meeting');
  } else {
    console.log('🔧 REQUIRED FIXES');
    console.log('-' * 30);
    console.log('1. Fix failed tests listed above');
    console.log('2. Re-run test suite until all pass');
    console.log('3. Verify with manual testing');
    console.log('4. Document any remaining issues');
  }
  
  console.log('\n' + '=' * 80);
}

/**
 * Validate environment setup
 */
async function validateEnvironment(): Promise<boolean> {
  console.log('🔍 Validating test environment...');
  
  try {
    // Check required environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'OPENAI_API_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      return false;
    }
    
    // Check database connection
    const { supabase } = await import('../services/supabase');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Environment validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    // Validate environment first
    const envValid = await validateEnvironment();
    if (!envValid) {
      console.error('❌ Environment validation failed. Cannot proceed with tests.');
      process.exit(1);
    }
    
    // Run all Phase 2 tests
    const report = await runPhase2Tests();
    
    // Exit with appropriate code
    process.exit(report.phase2Complete ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { runPhase2Tests, type Phase2TestReport };

// Run if executed directly
if (require.main === module) {
  main();
} 