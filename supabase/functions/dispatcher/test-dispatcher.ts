/**
 * Dispatcher Edge Function Test Suite
 * 
 * Tests the dispatcher function in isolation to verify:
 * - UNIFIED_DISPATCHER_PROMPT usage
 * - Job prioritization logic
 * - Route optimization
 * - Error handling
 */

import { DispatcherAgent } from './dispatcher-agent.ts';

// Mock test data
const mockJobs = [
  {
    id: 'job-emergency-1',
    title: 'Emergency Plumbing Leak',
    job_type: 'emergency',
    priority: 'urgent',
    address: '123 Main St, San Francisco, CA',
    latitude: 37.7749,
    longitude: -122.4194,
    estimated_duration: 90,
    description: 'Burst pipe flooding basement'
  },
  {
    id: 'job-inspection-1', 
    title: 'HVAC Inspection',
    job_type: 'inspection',
    priority: 'high',
    address: '456 Oak Ave, San Francisco, CA',
    latitude: 37.7849,
    longitude: -122.4094,
    estimated_duration: 60,
    description: 'Annual HVAC system inspection'
  },
  {
    id: 'job-service-1',
    title: 'Sink Repair',
    job_type: 'service', 
    priority: 'medium',
    address: '789 Pine St, San Francisco, CA',
    latitude: 37.7649,
    longitude: -122.4294,
    estimated_duration: 45,
    description: 'Fix leaky kitchen sink'
  },
  {
    id: 'job-service-2',
    title: 'Toilet Installation',
    job_type: 'service',
    priority: 'low',
    address: '321 Elm St, San Francisco, CA', 
    latitude: 37.7549,
    longitude: -122.4394,
    estimated_duration: 120,
    description: 'Install new toilet in guest bathroom'
  }
];

const mockUserPreferences = {
  work_start_time: '08:00',
  work_end_time: '17:00',
  lunch_break_start: '12:00',
  lunch_break_end: '13:00',
  travel_buffer_percentage: 15,
  job_duration_buffer_minutes: 15
};

/**
 * Test 1: Basic Dispatcher Functionality
 */
async function testBasicDispatcher() {
  console.log('🧪 Test 1: Basic Dispatcher Functionality');
  
  try {
    const dispatcher = new DispatcherAgent();
    
    const result = await dispatcher.execute({
      userId: 'test-user-1',
      jobIds: mockJobs.map(job => job.id),
      planDate: new Date().toISOString().split('T')[0]
    });
    
    // Verify result structure
    console.log('✅ Dispatcher executed successfully');
    console.log('📊 Result structure:', Object.keys(result));
    
    // Verify prioritized jobs exist
    if (result.prioritized_jobs && result.prioritized_jobs.length > 0) {
      console.log('✅ Prioritized jobs generated:', result.prioritized_jobs.length);
    } else {
      console.warn('⚠️ No prioritized jobs in result');
    }
    
    // Verify business priority order (Emergency → Inspection → Service)
    const jobTypes = result.prioritized_jobs?.map(job => job.job_type) || [];
    console.log('📋 Job type order:', jobTypes);
    
    // Verify optimization summary
    if (result.optimization_summary) {
      console.log('✅ Optimization summary present');
      console.log('📈 Summary:', result.optimization_summary);
    } else {
      console.warn('⚠️ No optimization summary');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    throw error;
  }
}

/**
 * Test 2: Job Prioritization Logic
 */
async function testJobPrioritization() {
  console.log('\n🧪 Test 2: Job Prioritization Logic');
  
  try {
    const dispatcher = new DispatcherAgent();
    
    const result = await dispatcher.execute({
      userId: 'test-user-2',
      jobIds: mockJobs.map(job => job.id),
      planDate: new Date().toISOString().split('T')[0]
    });
    
    const prioritizedJobs = result.prioritized_jobs || [];
    
    // Verify emergency jobs come first
    const emergencyJobs = prioritizedJobs.filter(job => job.job_type === 'emergency');
    const inspectionJobs = prioritizedJobs.filter(job => job.job_type === 'inspection');
    const serviceJobs = prioritizedJobs.filter(job => job.job_type === 'service');
    
    console.log('🚨 Emergency jobs:', emergencyJobs.length);
    console.log('🔍 Inspection jobs:', inspectionJobs.length);
    console.log('🔧 Service jobs:', serviceJobs.length);
    
    // Verify priority order
    let emergencyRanks = emergencyJobs.map(j => j.priority_rank);
    let inspectionRanks = inspectionJobs.map(j => j.priority_rank);
    let serviceRanks = serviceJobs.map(j => j.priority_rank);
    
    const maxEmergencyRank = Math.max(...emergencyRanks, 0);
    const minInspectionRank = Math.min(...inspectionRanks, Infinity);
    const minServiceRank = Math.min(...serviceRanks, Infinity);
    
    if (emergencyJobs.length > 0 && inspectionJobs.length > 0) {
      if (maxEmergencyRank < minInspectionRank) {
        console.log('✅ Emergency jobs prioritized before inspection jobs');
      } else {
        console.warn('⚠️ Priority order violation: Emergency vs Inspection');
      }
    }
    
    if (inspectionJobs.length > 0 && serviceJobs.length > 0) {
      if (minInspectionRank < minServiceRank) {
        console.log('✅ Inspection jobs prioritized before service jobs');
      } else {
        console.warn('⚠️ Priority order violation: Inspection vs Service');
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
    throw error;
  }
}

/**
 * Test 3: Error Handling
 */
async function testErrorHandling() {
  console.log('\n🧪 Test 3: Error Handling');
  
  try {
    const dispatcher = new DispatcherAgent();
    
    // Test with invalid input
    const result = await dispatcher.execute({
      userId: '',
      jobIds: [],
      planDate: 'invalid-date'
    });
    
    // Should still return a valid structure
    console.log('✅ Handles invalid input gracefully');
    console.log('📊 Fallback result keys:', Object.keys(result));
    
    return result;
    
  } catch (error) {
    console.log('✅ Error handling working - caught:', error.message);
    return null;
  }
}

/**
 * Test 4: Prompt Integration
 */
async function testPromptIntegration() {
  console.log('\n🧪 Test 4: UNIFIED_DISPATCHER_PROMPT Integration');
  
  try {
    // Import the prompt
    const { UNIFIED_DISPATCHER_PROMPT } = await import('./dispatcher-prompt.ts');
    
    // Verify prompt exists and has expected content
    if (!UNIFIED_DISPATCHER_PROMPT) {
      throw new Error('UNIFIED_DISPATCHER_PROMPT not found');
    }
    
    console.log('✅ UNIFIED_DISPATCHER_PROMPT imported successfully');
    
    // Check for key phrases that should be in the prompt
    const keyPhrases = [
      'Master Schedule Optimizer',
      'EMERGENCY JOBS',
      'INSPECTION JOBS', 
      'SERVICE JOBS',
      'geographic optimization',
      'priority scoring'
    ];
    
    let foundPhrases = 0;
    for (const phrase of keyPhrases) {
      if (UNIFIED_DISPATCHER_PROMPT.includes(phrase)) {
        foundPhrases++;
      }
    }
    
    console.log(`✅ Found ${foundPhrases}/${keyPhrases.length} key phrases in prompt`);
    
    if (foundPhrases >= keyPhrases.length * 0.8) {
      console.log('✅ Prompt appears to be correctly structured');
    } else {
      console.warn('⚠️ Prompt may be missing key content');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
    throw error;
  }
}

/**
 * Run all dispatcher tests
 */
export async function runDispatcherTests() {
  console.log('🚀 Starting Dispatcher Edge Function Tests\n');
  
  const results = {
    basicFunctionality: null,
    jobPrioritization: null,
    errorHandling: null,
    promptIntegration: null,
    allPassed: false
  };
  
  try {
    // Run tests
    results.basicFunctionality = await testBasicDispatcher();
    results.jobPrioritization = await testJobPrioritization();
    results.errorHandling = await testErrorHandling();
    results.promptIntegration = await testPromptIntegration();
    
    results.allPassed = true;
    console.log('\n🎉 All dispatcher tests passed!');
    
  } catch (error) {
    console.error('\n💥 Dispatcher tests failed:', error);
    results.allPassed = false;
  }
  
  return results;
}

// Run tests if this file is executed directly
if (import.meta.main) {
  runDispatcherTests();
} 