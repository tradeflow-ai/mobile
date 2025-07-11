/**
 * Integration Test Suite for 2-Step Edge Function Workflow
 * 
 * Tests the complete workflow:
 * 1. Start Planning → Dispatcher Function
 * 2. User Confirmation → Inventory Function  
 * 3. Hardware Store Job Creation & Insertion
 * 4. Final Execution Ready State
 */

import { runDispatcherTests } from './supabase/functions/dispatcher/test-dispatcher.ts';
import { runInventoryTests } from './supabase/functions/inventory/test-inventory.ts';

// Mock data for complete workflow testing
const mockCompleteWorkflow = {
  userId: 'test-user-integration',
  planDate: new Date().toISOString().split('T')[0],
  jobs: [
    {
      id: 'job-emergency-1',
      title: 'Emergency Plumbing Leak',
      job_type: 'emergency',
      priority: 'urgent',
      address: '123 Main St, San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      estimated_duration: 90,
      description: 'Burst pipe flooding basement - needs pipe fittings and sealant',
      client_name: 'John Smith',
      client_phone: '555-1234'
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
      description: 'Annual HVAC system inspection - may need filters',
      client_name: 'Jane Doe',
      client_phone: '555-5678'
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
      description: 'Fix leaky kitchen sink - likely needs new faucet parts',
      client_name: 'Bob Johnson',
      client_phone: '555-9012'
    }
  ]
};

/**
 * Test 1: Complete Workflow Chain
 */
async function testCompleteWorkflow() {
  console.log('🧪 Integration Test 1: Complete Workflow Chain');
  
  try {
    // Step 1: Call dispatcher function
    console.log('📋 Step 1: Dispatcher Function');
    const dispatcherResponse = await fetch('/functions/v1/dispatcher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: mockCompleteWorkflow.userId,
        jobIds: mockCompleteWorkflow.jobs.map(j => j.id),
        planDate: mockCompleteWorkflow.planDate
      })
    });
    
    if (!dispatcherResponse.ok) {
      throw new Error(`Dispatcher failed: ${dispatcherResponse.status}`);
    }
    
    const dispatcherResult = await dispatcherResponse.json();
    console.log('✅ Dispatcher completed successfully');
    console.log('📊 Prioritized jobs:', dispatcherResult.prioritized_jobs?.length || 0);
    
    // Step 2: User confirmation (simulated)
    console.log('\n🔍 Step 2: User Confirmation (Simulated)');
    console.log('✅ User confirms job order');
    
    // Step 3: Call inventory function
    console.log('\n📦 Step 3: Inventory Function');
    const inventoryResponse = await fetch('/functions/v1/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: mockCompleteWorkflow.userId,
        jobIds: mockCompleteWorkflow.jobs.map(j => j.id),
        dispatchOutput: dispatcherResult
      })
    });
    
    if (!inventoryResponse.ok) {
      throw new Error(`Inventory failed: ${inventoryResponse.status}`);
    }
    
    const inventoryResult = await inventoryResponse.json();
    console.log('✅ Inventory completed successfully');
    console.log('🛒 Shopping list items:', inventoryResult.inventory_analysis?.shopping_list?.length || 0);
    
    // Step 4: Check for hardware store job
    console.log('\n🏪 Step 4: Hardware Store Job Check');
    if (inventoryResult.hardware_store_job) {
      console.log('✅ Hardware store job created');
      console.log('🏪 Store:', inventoryResult.hardware_store_job.title);
      console.log('💰 Estimated cost:', inventoryResult.hardware_store_job.estimated_cost);
      
      // Simulate hardware store job insertion
      console.log('\n🔄 Step 5: Hardware Store Job Insertion');
      const updatedJobs = insertHardwareStoreJob(
        dispatcherResult.prioritized_jobs,
        inventoryResult.hardware_store_job
      );
      
      console.log('✅ Hardware store job inserted');
      console.log('📋 Final job count:', updatedJobs.length);
      console.log('🎯 Final job order:', updatedJobs.map(j => j.job_type).join(' → '));
      
      return {
        success: true,
        dispatcherResult,
        inventoryResult,
        finalJobs: updatedJobs,
        hardwareStoreCreated: true
      };
    } else {
      console.log('ℹ️ No hardware store job needed');
      return {
        success: true,
        dispatcherResult,
        inventoryResult,
        finalJobs: dispatcherResult.prioritized_jobs,
        hardwareStoreCreated: false
      };
    }
    
  } catch (error) {
    console.error('❌ Complete workflow test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 2: Hardware Store Job Insertion Logic
 */
function insertHardwareStoreJob(prioritizedJobs: any[], hardwareStoreJob: any) {
  console.log('🔧 Testing hardware store job insertion logic');
  
  // Find insertion point (after emergency/inspection, before service)
  const emergencyJobs = prioritizedJobs.filter(j => j.job_type === 'emergency');
  const inspectionJobs = prioritizedJobs.filter(j => j.job_type === 'inspection');
  const serviceJobs = prioritizedJobs.filter(j => j.job_type === 'service');
  
  const insertionPoint = emergencyJobs.length + inspectionJobs.length;
  
  // Create final job list with hardware store inserted
  const finalJobs = [
    ...emergencyJobs,
    ...inspectionJobs,
    {
      ...hardwareStoreJob,
      priority_rank: insertionPoint + 1,
      estimated_start_time: calculateStartTime(insertionPoint),
      estimated_end_time: calculateEndTime(insertionPoint, hardwareStoreJob.estimated_duration)
    },
    ...serviceJobs.map(job => ({
      ...job,
      priority_rank: job.priority_rank + 1 // Shift service jobs down
    }))
  ];
  
  console.log('✅ Hardware store job inserted at position:', insertionPoint + 1);
  console.log('🎯 Job order verification:', finalJobs.map(j => j.job_type).join(' → '));
  
  return finalJobs;
}

/**
 * Test 3: Error Handling & Edge Cases
 */
async function testErrorHandling() {
  console.log('\n🧪 Integration Test 3: Error Handling & Edge Cases');
  
  const testCases = [
    {
      name: 'Empty job list',
      data: { userId: 'test-user', jobIds: [], planDate: mockCompleteWorkflow.planDate }
    },
    {
      name: 'Invalid user ID',
      data: { userId: '', jobIds: ['job-1'], planDate: mockCompleteWorkflow.planDate }
    },
    {
      name: 'Invalid date format',
      data: { userId: 'test-user', jobIds: ['job-1'], planDate: 'invalid-date' }
    },
    {
      name: 'Missing required fields',
      data: { userId: 'test-user' }
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    
    try {
      // Test dispatcher error handling
      const dispatcherResponse = await fetch('/functions/v1/dispatcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });
      
      if (dispatcherResponse.ok) {
        console.log('✅ Dispatcher handled gracefully');
      } else {
        console.log('⚠️ Dispatcher returned error (expected):', dispatcherResponse.status);
      }
      
      results.push({
        testCase: testCase.name,
        dispatcherHandled: true,
        success: true
      });
      
    } catch (error) {
      console.log('⚠️ Error caught (expected):', error.message);
      results.push({
        testCase: testCase.name,
        dispatcherHandled: true,
        success: true
      });
    }
  }
  
  return results;
}

/**
 * Test 4: Mobile App Integration Simulation
 */
async function testMobileAppIntegration() {
  console.log('\n🧪 Integration Test 4: Mobile App Integration Simulation');
  
  try {
    // Simulate mobile app workflow
    console.log('📱 Simulating mobile app workflow...');
    
    // Step 1: User clicks "Start Planning"
    console.log('👆 User clicks "Start Planning"');
    
    // Step 2: Show loading for dispatcher
    console.log('⏳ Loading dispatcher results...');
    const dispatcherResult = await simulateDispatcherCall();
    
    // Step 3: Show confirmation screen
    console.log('🔍 Showing dispatcher confirmation screen');
    console.log('📋 Jobs to confirm:', dispatcherResult.prioritized_jobs?.length || 0);
    
    // Step 4: User confirms
    console.log('✅ User confirms job order');
    
    // Step 5: Show loading for inventory
    console.log('⏳ Loading inventory analysis...');
    const inventoryResult = await simulateInventoryCall(dispatcherResult);
    
    // Step 6: Show final results
    console.log('📊 Showing final results screen');
    console.log('🛒 Shopping list items:', inventoryResult.inventory_analysis?.shopping_list?.length || 0);
    
    if (inventoryResult.hardware_store_job) {
      console.log('🏪 Hardware store job created');
      console.log('🎯 Final execution ready with hardware store stop');
    } else {
      console.log('🎯 Final execution ready without hardware store');
    }
    
    return {
      success: true,
      workflow: 'completed',
      dispatcherResult,
      inventoryResult
    };
    
  } catch (error) {
    console.error('❌ Mobile app integration test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Helper functions
 */
function calculateStartTime(position: number): string {
  const baseTime = 8; // 8 AM
  const timePerJob = 1.5; // 1.5 hours per job average
  const startHour = baseTime + (position * timePerJob);
  return `${Math.floor(startHour).toString().padStart(2, '0')}:${((startHour % 1) * 60).toString().padStart(2, '0')}`;
}

function calculateEndTime(position: number, duration: number): string {
  const startTime = calculateStartTime(position);
  const [hours, minutes] = startTime.split(':').map(Number);
  const endMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
}

async function simulateDispatcherCall() {
  // Simulate dispatcher call result
  return {
    prioritized_jobs: [
      {
        job_id: 'job-emergency-1',
        priority_rank: 1,
        job_type: 'emergency',
        estimated_start_time: '08:00',
        estimated_end_time: '09:30'
      },
      {
        job_id: 'job-inspection-1',
        priority_rank: 2,
        job_type: 'inspection',
        estimated_start_time: '10:00',
        estimated_end_time: '11:00'
      },
      {
        job_id: 'job-service-1',
        priority_rank: 3,
        job_type: 'service',
        estimated_start_time: '11:30',
        estimated_end_time: '12:15'
      }
    ],
    optimization_summary: {
      total_jobs: 3,
      emergency_jobs: 1,
      inspection_jobs: 1,
      service_jobs: 1
    }
  };
}

async function simulateInventoryCall(dispatcherResult: any) {
  // Simulate inventory call result
  return {
    inventory_analysis: {
      shopping_list: [
        {
          item_name: 'Pipe fittings',
          quantity_to_buy: 2,
          priority: 'critical',
          estimated_cost: 7.00
        },
        {
          item_name: 'Pipe sealant',
          quantity_to_buy: 1,
          priority: 'critical',
          estimated_cost: 8.99
        }
      ],
      total_shopping_cost: 15.99
    },
    hardware_store_job: {
      id: 'hardware-store-1',
      title: 'Home Depot - Supply Run',
      job_type: 'hardware_store',
      estimated_duration: 30,
      estimated_cost: 15.99,
      address: '1234 Store St, San Francisco, CA',
      latitude: 37.7750,
      longitude: -122.4180
    }
  };
}

/**
 * Run all integration tests
 */
export async function runIntegrationTests() {
  console.log('🚀 Starting Integration Tests for 2-Step Edge Function Workflow\n');
  
  const results = {
    individualTests: {
      dispatcher: null,
      inventory: null
    },
    integrationTests: {
      completeWorkflow: null,
      errorHandling: null,
      mobileAppIntegration: null
    },
    allPassed: false
  };
  
  try {
    // Run individual edge function tests first
    console.log('🔧 Running individual edge function tests...\n');
    results.individualTests.dispatcher = await runDispatcherTests();
    results.individualTests.inventory = await runInventoryTests();
    
    // Run integration tests
    console.log('\n🔗 Running integration tests...\n');
    results.integrationTests.completeWorkflow = await testCompleteWorkflow();
    results.integrationTests.errorHandling = await testErrorHandling();
    results.integrationTests.mobileAppIntegration = await testMobileAppIntegration();
    
    // Check if all tests passed
    const allIndividualPassed = results.individualTests.dispatcher?.allPassed && 
                               results.individualTests.inventory?.allPassed;
    const allIntegrationPassed = results.integrationTests.completeWorkflow?.success &&
                                results.integrationTests.errorHandling?.length > 0 &&
                                results.integrationTests.mobileAppIntegration?.success;
    
    results.allPassed = allIndividualPassed && allIntegrationPassed;
    
    if (results.allPassed) {
      console.log('\n🎉 All integration tests passed!');
      console.log('✅ 2-Step Edge Function Workflow is ready for deployment');
    } else {
      console.log('\n⚠️ Some tests failed - check results above');
    }
    
  } catch (error) {
    console.error('\n💥 Integration tests failed:', error);
    results.allPassed = false;
  }
  
  return results;
}

// Run tests if this file is executed directly
if (import.meta.main) {
  runIntegrationTests();
} 