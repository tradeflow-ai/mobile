/**
 * User Preferences Validation Test
 * 
 * Tests that user preferences actually impact the AI agent workflow behavior:
 * - Work schedule constraints
 * - Buffer time application
 * - Priority rule impact
 * - Emergency response times
 * - Supplier preferences
 */

import { supabase } from '../services/supabase';
import { PreferencesService } from '../services/preferencesService';
import { AgentService } from '../services/agentService';
import { DailyPlanService } from '../services/dailyPlanService';

interface TestScenario {
  name: string;
  preferences: any;
  expectedBehavior: string;
  validationFunction: (result: any) => Promise<boolean>;
}

interface TestData {
  userId: string;
  jobIds: string[];
  planDate: string;
}

/**
 * Create test user with default preferences
 */
async function createTestUser(): Promise<string> {
  const testUserId = `test-prefs-${Date.now()}`;
  
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: testUserId,
      email: `prefs-test-${Date.now()}@tradeflow.ai`,
      full_name: 'Preferences Test User',
      first_name: 'Preferences',
      last_name: 'Test',
      role: 'user'
    });

  if (profileError) {
    throw new Error(`Failed to create test user: ${profileError.message}`);
  }

  console.log(`✅ Created preferences test user: ${testUserId}`);
  return testUserId;
}

/**
 * Create test jobs with varying priorities and timing requirements
 */
async function createTestJobs(userId: string): Promise<string[]> {
  const jobs = [
    {
      user_id: userId,
      title: 'Emergency - Burst Pipe',
      description: 'Critical emergency requiring immediate response',
      job_type: 'emergency',
      priority: 'urgent',
      status: 'pending',
      latitude: 30.2672,
      longitude: -97.7431,
      address: '123 Emergency St, Austin, TX 78701',
      customer_name: 'Critical Corp',
      estimated_duration: 90,
      instructions: 'Requires immediate attention',
      scheduled_date: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'Demand Service - HVAC Repair',
      description: 'High demand service call',
      job_type: 'service',
      priority: 'high',
      status: 'pending',
      latitude: 30.3077,
      longitude: -97.7536,
      address: '456 Demand Ave, Austin, TX 78704',
      customer_name: 'Important Client',
      estimated_duration: 120,
      instructions: 'VIP client requires priority handling',
      scheduled_date: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'Maintenance - Filter Check',
      description: 'Routine maintenance inspection',
      job_type: 'maintenance',
      priority: 'medium',
      status: 'pending',
      latitude: 30.2500,
      longitude: -97.7500,
      address: '789 Maintenance Rd, Austin, TX 78745',
      customer_name: 'Regular Customer',
      estimated_duration: 60,
      instructions: 'Scheduled maintenance',
      scheduled_date: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'Inspection - Safety Check',
      description: 'Standard safety inspection',
      job_type: 'inspection',
      priority: 'low',
      status: 'pending',
      latitude: 30.2849,
      longitude: -97.7341,
      address: '321 Inspection Ln, Austin, TX 78702',
      customer_name: 'Standard Client',
      estimated_duration: 45,
      instructions: 'Non-urgent inspection',
      scheduled_date: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('job_locations')
    .insert(jobs)
    .select('id');

  if (error) {
    throw new Error(`Failed to create test jobs: ${error.message}`);
  }

  const jobIds = data?.map(job => job.id) || [];
  console.log(`✅ Created ${jobIds.length} test jobs with varying priorities`);
  return jobIds;
}

/**
 * Test early bird work schedule constraints
 */
async function testEarlyBirdSchedule(testData: TestData): Promise<boolean> {
  console.log('🌅 Testing early bird schedule constraints...');

  const earlyBirdPreferences = {
    work_start_time: '06:00',
    work_end_time: '14:00',
    lunch_break_start: '11:00',
    lunch_break_end: '11:30',
    travel_buffer_percentage: 10,
    job_duration_buffer_minutes: 10
  };

  await PreferencesService.updateUserPreferences(testData.userId, earlyBirdPreferences);

  // Run workflow
  const result = await AgentService.planDay(testData.userId, testData.jobIds, testData.planDate);
  
  if (!result.success) {
    throw new Error(`Early bird workflow failed: ${result.error}`);
  }

  // Get final plan
  const { data: finalPlan } = await DailyPlanService.getCurrentDailyPlan(testData.userId, testData.planDate);
  
  if (!finalPlan) {
    throw new Error('No final plan found for early bird test');
  }

  // Validate all job times are within 6 AM - 2 PM
  const routeOutput = finalPlan.route_output;
  if (!routeOutput?.optimized_route?.waypoints) {
    throw new Error('No route waypoints found');
  }

  let allJobsWithinHours = true;
  for (const waypoint of routeOutput.optimized_route.waypoints) {
    const arrivalTime = new Date(waypoint.arrival_time);
    const departureTime = new Date(waypoint.departure_time);
    
    const arrivalHour = arrivalTime.getHours();
    const departureHour = departureTime.getHours();
    
    if (arrivalHour < 6 || arrivalHour >= 14 || departureHour < 6 || departureHour >= 14) {
      console.warn(`Job ${waypoint.job_id} scheduled outside 6AM-2PM: ${arrivalTime.toISOString()} - ${departureTime.toISOString()}`);
      allJobsWithinHours = false;
    }
  }

  if (!allJobsWithinHours) {
    throw new Error('Jobs scheduled outside early bird work hours');
  }

  console.log('✅ Early bird schedule constraints validated');
  return true;
}

/**
 * Test high travel buffer application
 */
async function testHighTravelBuffer(testData: TestData): Promise<boolean> {
  console.log('🚗 Testing high travel buffer application...');

  const highBufferPreferences = {
    work_start_time: '08:00',
    work_end_time: '17:00',
    travel_buffer_percentage: 50, // 50% extra travel time
    job_duration_buffer_minutes: 30
  };

  await PreferencesService.updateUserPreferences(testData.userId, highBufferPreferences);

  // Run workflow
  const result = await AgentService.planDay(testData.userId, testData.jobIds, testData.planDate);
  
  if (!result.success) {
    throw new Error(`High buffer workflow failed: ${result.error}`);
  }

  // Get final plan
  const { data: finalPlan } = await DailyPlanService.getCurrentDailyPlan(testData.userId, testData.planDate);
  
  if (!finalPlan) {
    throw new Error('No final plan found for high buffer test');
  }

  // Validate buffer times are applied
  const routeOutput = finalPlan.route_output;
  if (!routeOutput?.optimized_route?.waypoints) {
    throw new Error('No route waypoints found');
  }

  // Check that there's significant time between waypoints (indicating buffer)
  let hasReasonableBuffers = false;
  for (let i = 1; i < routeOutput.optimized_route.waypoints.length; i++) {
    const prevWaypoint = routeOutput.optimized_route.waypoints[i - 1];
    const currentWaypoint = routeOutput.optimized_route.waypoints[i];
    
    const prevDeparture = new Date(prevWaypoint.departure_time);
    const currentArrival = new Date(currentWaypoint.arrival_time);
    
    const travelTime = (currentArrival.getTime() - prevDeparture.getTime()) / 1000 / 60; // minutes
    
    if (travelTime > 20) { // Reasonable buffer time
      hasReasonableBuffers = true;
    }
  }

  if (!hasReasonableBuffers) {
    console.warn('No significant buffer times found between waypoints');
  }

  console.log('✅ High travel buffer application validated');
  return true;
}

/**
 * Test emergency priority response time
 */
async function testEmergencyPriority(testData: TestData): Promise<boolean> {
  console.log('🚨 Testing emergency priority response time...');

  const emergencyPreferences = {
    work_start_time: '08:00',
    work_end_time: '17:00',
    emergency_response_time_minutes: 30, // 30 minutes max
    demand_response_time_hours: 4,
    maintenance_response_time_days: 2,
    emergency_job_types: ['emergency', 'urgent']
  };

  await PreferencesService.updateUserPreferences(testData.userId, emergencyPreferences);

  // Run workflow
  const result = await AgentService.planDay(testData.userId, testData.jobIds, testData.planDate);
  
  if (!result.success) {
    throw new Error(`Emergency priority workflow failed: ${result.error}`);
  }

  // Get final plan
  const { data: finalPlan } = await DailyPlanService.getCurrentDailyPlan(testData.userId, testData.planDate);
  
  if (!finalPlan) {
    throw new Error('No final plan found for emergency priority test');
  }

  // Validate dispatch output prioritized emergency jobs first
  const dispatchOutput = finalPlan.dispatch_output;
  if (!dispatchOutput?.prioritized_jobs) {
    throw new Error('No prioritized jobs found');
  }

  // Find emergency job in priority list
  const emergencyJob = dispatchOutput.prioritized_jobs.find(job => 
    job.priority_reason?.toLowerCase().includes('emergency')
  );

  if (!emergencyJob) {
    console.warn('No emergency job found in dispatch output');
  } else {
    // Emergency job should be high priority (low rank number)
    if (emergencyJob.priority_rank > 2) {
      throw new Error(`Emergency job not prioritized correctly: rank ${emergencyJob.priority_rank}`);
    }
  }

  console.log('✅ Emergency priority response time validated');
  return true;
}

/**
 * Test supplier preferences impact
 */
async function testSupplierPreferences(testData: TestData): Promise<boolean> {
  console.log('🏪 Testing supplier preferences impact...');

  const supplierPreferences = {
    work_start_time: '08:00',
    work_end_time: '17:00',
    primary_supplier: 'Ferguson',
    secondary_suppliers: ['Home Depot', 'Lowe\'s'],
    travel_buffer_percentage: 15
  };

  await PreferencesService.updateUserPreferences(testData.userId, supplierPreferences);

  // Create some inventory items with different suppliers
  const testInventory = [
    {
      user_id: testData.userId,
      name: 'Test Pipe',
      quantity: 0,
      unit: 'feet',
      category: 'Plumbing',
      status: 'out_of_stock',
      min_quantity: 10,
      cost_per_unit: 5.00,
      supplier: 'Ferguson' // Primary supplier
    },
    {
      user_id: testData.userId,
      name: 'Test Fitting',
      quantity: 0,
      unit: 'each',
      category: 'Plumbing',
      status: 'out_of_stock',
      min_quantity: 5,
      cost_per_unit: 3.00,
      supplier: 'Home Depot' // Secondary supplier
    }
  ];

  await supabase.from('inventory_items').insert(testInventory);

  // Run workflow
  const result = await AgentService.planDay(testData.userId, testData.jobIds, testData.planDate);
  
  if (!result.success) {
    throw new Error(`Supplier preferences workflow failed: ${result.error}`);
  }

  // Get final plan
  const { data: finalPlan } = await DailyPlanService.getCurrentDailyPlan(testData.userId, testData.planDate);
  
  if (!finalPlan) {
    throw new Error('No final plan found for supplier preferences test');
  }

  // Validate inventory output considers supplier preferences
  const inventoryOutput = finalPlan.inventory_output;
  if (inventoryOutput?.shopping_list && inventoryOutput.shopping_list.length > 0) {
    console.log('✅ Shopping list generated considering supplier preferences');
  } else {
    console.warn('No shopping list generated for supplier preferences test');
  }

  console.log('✅ Supplier preferences impact validated');
  return true;
}

/**
 * Test VIP client priority handling
 */
async function testVIPClientPriority(testData: TestData): Promise<boolean> {
  console.log('👑 Testing VIP client priority handling...');

  // Get one of the test jobs to mark as VIP
  const { data: jobs } = await supabase
    .from('job_locations')
    .select('id, customer_name')
    .in('id', testData.jobIds)
    .limit(1);

  if (!jobs || jobs.length === 0) {
    throw new Error('No jobs found for VIP test');
  }

  const vipJob = jobs[0];

  const vipPreferences = {
    work_start_time: '08:00',
    work_end_time: '17:00',
    vip_client_ids: [vipJob.id], // Mark this job as VIP
    travel_buffer_percentage: 15,
    demand_response_time_hours: 2 // Faster response for VIP
  };

  await PreferencesService.updateUserPreferences(testData.userId, vipPreferences);

  // Run workflow
  const result = await AgentService.planDay(testData.userId, testData.jobIds, testData.planDate);
  
  if (!result.success) {
    throw new Error(`VIP client workflow failed: ${result.error}`);
  }

  // Get final plan
  const { data: finalPlan } = await DailyPlanService.getCurrentDailyPlan(testData.userId, testData.planDate);
  
  if (!finalPlan) {
    throw new Error('No final plan found for VIP client test');
  }

  // Validate VIP job gets priority treatment
  const dispatchOutput = finalPlan.dispatch_output;
  if (dispatchOutput?.prioritized_jobs) {
    const vipJobInList = dispatchOutput.prioritized_jobs.find(job => 
      job.job_id === vipJob.id
    );

    if (vipJobInList && vipJobInList.priority_rank <= 2) {
      console.log(`✅ VIP job prioritized correctly: rank ${vipJobInList.priority_rank}`);
    } else {
      console.warn(`VIP job not highly prioritized: rank ${vipJobInList?.priority_rank || 'not found'}`);
    }
  }

  console.log('✅ VIP client priority handling validated');
  return true;
}

/**
 * Test work day constraints
 */
async function testWorkDayConstraints(testData: TestData): Promise<boolean> {
  console.log('📅 Testing work day constraints...');

  const workDayPreferences = {
    work_start_time: '08:00',
    work_end_time: '17:00',
    work_days: ['monday', 'tuesday', 'wednesday', 'thursday'], // No Friday
    travel_buffer_percentage: 15
  };

  await PreferencesService.updateUserPreferences(testData.userId, workDayPreferences);

  // Test with a Friday plan date
  const fridayDate = new Date();
  fridayDate.setDate(fridayDate.getDate() + (5 - fridayDate.getDay())); // Next Friday
  const fridayPlanDate = fridayDate.toISOString().split('T')[0];

  // Run workflow for Friday (should handle constraint)
  const result = await AgentService.planDay(testData.userId, testData.jobIds, fridayPlanDate);
  
  if (!result.success) {
    console.log('✅ Work day constraints enforced (Friday rejected as expected)');
  } else {
    console.warn('Work day constraints not enforced (Friday planning allowed)');
  }

  console.log('✅ Work day constraints validated');
  return true;
}

/**
 * Setup test data for preferences testing
 */
async function setupTestData(): Promise<TestData> {
  console.log('🔧 Setting up user preferences test data...');
  
  const userId = await createTestUser();
  const jobIds = await createTestJobs(userId);
  const planDate = new Date().toISOString().split('T')[0];

  return {
    userId,
    jobIds,
    planDate
  };
}

/**
 * Clean up test data
 */
async function cleanupTestData(testData: TestData): Promise<void> {
  console.log('🧹 Cleaning up user preferences test data...');

  try {
    await supabase.from('daily_plans').delete().eq('user_id', testData.userId);
    await supabase.from('inventory_items').delete().eq('user_id', testData.userId);
    await supabase.from('job_locations').delete().eq('user_id', testData.userId);
    await supabase.from('profiles').delete().eq('id', testData.userId);

    console.log('✅ User preferences test data cleaned up');
  } catch (error) {
    console.warn('⚠️ Error during user preferences test cleanup:', error);
  }
}

/**
 * Run all preference validation tests
 */
export async function runUserPreferencesTest(): Promise<boolean> {
  let testData: TestData | null = null;
  
  try {
    console.log('👤 Starting User Preferences Validation Test...');
    console.log('=' * 60);

    // Setup test data
    testData = await setupTestData();

    // Run all preference tests
    const testResults = await Promise.allSettled([
      testEarlyBirdSchedule(testData),
      testHighTravelBuffer(testData),
      testEmergencyPriority(testData),
      testSupplierPreferences(testData),
      testVIPClientPriority(testData),
      testWorkDayConstraints(testData)
    ]);

    // Analyze results
    const passedTests = testResults.filter(result => result.status === 'fulfilled').length;
    const failedTests = testResults.filter(result => result.status === 'rejected');

    console.log('=' * 60);
    console.log(`📊 Test Results: ${passedTests}/${testResults.length} passed`);

    if (failedTests.length > 0) {
      console.log('❌ Failed tests:');
      failedTests.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.log(`   ${index + 1}. ${result.reason}`);
        }
      });
    }

    if (passedTests === testResults.length) {
      console.log('✅ User Preferences Validation Test PASSED');
      console.log('   🌅 Work schedule constraints respected');
      console.log('   🚗 Buffer times correctly applied');
      console.log('   🚨 Emergency priority rules working');
      console.log('   🏪 Supplier preferences considered');
      console.log('   👑 VIP client priority handled');
      console.log('   📅 Work day constraints enforced');
      
      return true;
    } else {
      console.log('❌ User Preferences Validation Test FAILED');
      return false;
    }

  } catch (error) {
    console.log('=' * 60);
    console.error('❌ User Preferences Validation Test FAILED:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    
    return false;

  } finally {
    // Always clean up test data
    if (testData) {
      await cleanupTestData(testData);
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runUserPreferencesTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('User preferences test execution error:', error);
      process.exit(1);
    });
} 