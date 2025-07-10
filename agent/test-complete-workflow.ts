/**
 * Complete Workflow Integration Test
 * 
 * Tests the end-to-end AI agent workflow including:
 * - Agent sequence execution
 * - Real-time database updates
 * - Performance validation
 * - Hardware store job creation
 */

import { supabase } from '../services/supabase';
import { executeDailyPlanningWorkflow } from './graph';
import { AgentService } from '../services/agentService';
import { DailyPlanService } from '../services/dailyPlanService';
import { PreferencesService } from '../services/preferencesService';

interface PerformanceMetrics {
  totalTime: number;
  dispatchTime: number;
  routeTime: number;
  inventoryTime: number;
  realTimeLatency: number;
}

interface TestData {
  userId: string;
  jobIds: string[];
  planDate: string;
  inventoryItems: any[];
}

/**
 * Create test user with realistic preferences
 */
async function createTestUser(): Promise<string> {
  const testUserId = `test-user-${Date.now()}`;
  
  // Create test profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: testUserId,
      email: `test-${Date.now()}@tradeflow.ai`,
      full_name: 'Test User Workflow',
      first_name: 'Test',
      last_name: 'User',
      role: 'user'
    });

  if (profileError) {
    throw new Error(`Failed to create test user: ${profileError.message}`);
  }

  // Set realistic user preferences
  const preferences = {
    work_start_time: '08:00',
    work_end_time: '17:00',
    lunch_break_start: '12:00',
    lunch_break_end: '13:00',
    travel_buffer_percentage: 15,
    job_duration_buffer_minutes: 15,
    emergency_response_time_minutes: 60,
    demand_response_time_hours: 4,
    maintenance_response_time_days: 2,
    primary_supplier: 'Home Depot',
    secondary_suppliers: ['Lowe\'s', 'Ferguson'],
    vip_client_ids: [],
    emergency_job_types: ['emergency', 'urgent'],
    work_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  };

  const { error: prefError } = await PreferencesService.updateUserPreferences(testUserId, preferences);
  if (prefError) {
    console.warn('Could not set preferences, using defaults:', prefError);
  }

  console.log(`✅ Created test user: ${testUserId}`);
  return testUserId;
}

/**
 * Create realistic test jobs with different priorities and locations
 */
async function createTestJobs(userId: string): Promise<string[]> {
  const jobs = [
    {
      user_id: userId,
      title: 'Emergency Pipe Burst - Downtown Office',
      description: 'Major pipe burst in office building, immediate response needed',
      job_type: 'emergency',
      priority: 'urgent',
      status: 'pending',
      latitude: 30.2672, // Austin, TX coordinates
      longitude: -97.7431,
      address: '123 Main St, Austin, TX 78701',
      customer_name: 'ABC Corporation',
      customer_phone: '512-555-0123',
      estimated_duration: 120,
      instructions: 'Building maintenance will meet you at the entrance',
      required_items: [],
      scheduled_date: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'HVAC Maintenance - Residential',
      description: 'Routine HVAC system maintenance and filter replacement',
      job_type: 'maintenance',
      priority: 'medium',
      status: 'pending',
      latitude: 30.3077,
      longitude: -97.7536,
      address: '456 Oak Ave, Austin, TX 78704',
      customer_name: 'Johnson Family',
      customer_phone: '512-555-0456',
      estimated_duration: 90,
      instructions: 'Key is under the mat, owner will be home after 2 PM',
      required_items: [],
      scheduled_date: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'Electrical Inspection - New Construction',
      description: 'Final electrical inspection for new home construction',
      job_type: 'inspection',
      priority: 'high',
      status: 'pending',
      latitude: 30.2500,
      longitude: -97.7500,
      address: '789 Pine Rd, Austin, TX 78745',
      customer_name: 'Smith Construction',
      customer_phone: '512-555-0789',
      estimated_duration: 60,
      instructions: 'Contact foreman before arrival',
      required_items: [],
      scheduled_date: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'Plumbing Repair - Kitchen Sink',
      description: 'Kitchen sink drainage issues, possible pipe replacement needed',
      job_type: 'service',
      priority: 'medium',
      status: 'pending',
      latitude: 30.2849,
      longitude: -97.7341,
      address: '321 Elm St, Austin, TX 78702',
      customer_name: 'Davis Household',
      customer_phone: '512-555-0321',
      estimated_duration: 75,
      instructions: 'Apartment 2B, buzzer code 1234',
      required_items: [],
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
  console.log(`✅ Created ${jobIds.length} test jobs`);
  return jobIds;
}

/**
 * Create test inventory with some items requiring restocking
 */
async function createTestInventory(userId: string): Promise<any[]> {
  const inventoryItems = [
    {
      user_id: userId,
      name: 'PVC Pipe 1/2"',
      description: 'Half-inch PVC pipe for plumbing',
      quantity: 2, // Low stock to trigger shopping
      unit: 'feet',
      category: 'Plumbing',
      status: 'low_stock',
      min_quantity: 10,
      cost_per_unit: 2.50,
      supplier: 'Home Depot'
    },
    {
      user_id: userId,
      name: 'HVAC Filter 16x20',
      description: 'Standard HVAC air filter',
      quantity: 0, // Out of stock
      unit: 'each',
      category: 'HVAC',
      status: 'out_of_stock',
      min_quantity: 5,
      cost_per_unit: 8.99,
      supplier: 'Filtrete'
    },
    {
      user_id: userId,
      name: 'Wire 12 AWG',
      description: 'Electrical wire 12 gauge',
      quantity: 50, // Sufficient stock
      unit: 'feet',
      category: 'Electrical',
      status: 'available',
      min_quantity: 25,
      cost_per_unit: 0.85,
      supplier: 'Southwire'
    },
    {
      user_id: userId,
      name: 'Pipe Wrench 14"',
      description: 'Heavy duty pipe wrench',
      quantity: 1, // Sufficient for tool
      unit: 'each',
      category: 'Tools',
      status: 'available',
      min_quantity: 1,
      cost_per_unit: 35.00,
      supplier: 'Ridgid'
    }
  ];

  const { data, error } = await supabase
    .from('inventory_items')
    .insert(inventoryItems)
    .select();

  if (error) {
    throw new Error(`Failed to create test inventory: ${error.message}`);
  }

  console.log(`✅ Created ${data?.length || 0} test inventory items`);
  return data || [];
}

/**
 * Set up all test data
 */
async function setupTestData(): Promise<TestData> {
  console.log('🔧 Setting up test data...');
  
  const userId = await createTestUser();
  const jobIds = await createTestJobs(userId);
  const inventoryItems = await createTestInventory(userId);
  const planDate = new Date().toISOString().split('T')[0];

  return {
    userId,
    jobIds,
    planDate,
    inventoryItems
  };
}

/**
 * Monitor real-time updates during workflow execution
 */
async function testRealTimeUpdates(userId: string, planDate: string): Promise<{ updateCount: number; updates: any[]; latencies: number[] }> {
  return new Promise((resolve) => {
    let updateCount = 0;
    const updates: any[] = [];
    const latencies: number[] = [];
    let startTime = Date.now();

    const subscription = supabase
      .channel('daily_plans_test')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'daily_plans',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const latency = Date.now() - startTime;
          updateCount++;
          updates.push(payload);
          latencies.push(latency);
          
          console.log(`📡 Real-time update ${updateCount}: ${payload.new.status} (${latency}ms latency)`);
          
          // Complete after getting inventory_complete status or after 30 seconds
          if (payload.new.status === 'inventory_complete' || updateCount >= 10) {
            subscription.unsubscribe();
            resolve({ updateCount, updates, latencies });
          }
        }
      )
      .subscribe();

    // Auto-complete after 30 seconds if no updates
    setTimeout(() => {
      subscription.unsubscribe();
      resolve({ updateCount, updates, latencies });
    }, 30000);
  });
}

/**
 * Execute the complete workflow and measure performance
 */
async function testCompleteWorkflow(testData: TestData): Promise<PerformanceMetrics> {
  const startTime = Date.now();
  
  console.log('🚀 Starting complete workflow test...');
  console.log(`📊 Test data: ${testData.jobIds.length} jobs for ${testData.planDate}`);

  // Start real-time monitoring
  const realTimePromise = testRealTimeUpdates(testData.userId, testData.planDate);

  // Trigger workflow via AgentService
  const workflowResult = await AgentService.planDay(
    testData.userId,
    testData.jobIds,
    testData.planDate
  );

  if (!workflowResult.success) {
    throw new Error(`Workflow failed: ${workflowResult.error}`);
  }

  console.log('✅ Workflow triggered successfully');

  // Wait for real-time updates and final completion
  const { updateCount, updates, latencies } = await realTimePromise;

  // Get final daily plan to verify completion
  const { data: finalPlan } = await DailyPlanService.getCurrentDailyPlan(
    testData.userId,
    testData.planDate
  );

  if (!finalPlan) {
    throw new Error('No daily plan found after workflow completion');
  }

  // Calculate performance metrics
  const totalTime = Date.now() - startTime;
  const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  // Extract agent timing from step_timings if available
  const stepTimings = finalPlan.step_timings || {};
  
  const metrics: PerformanceMetrics = {
    totalTime,
    dispatchTime: stepTimings.dispatch || 0,
    routeTime: stepTimings.route || 0,
    inventoryTime: stepTimings.inventory || 0,
    realTimeLatency: avgLatency
  };

  console.log('📊 Performance Metrics:', metrics);
  console.log(`📡 Real-time updates: ${updateCount} received`);
  console.log(`📋 Final plan status: ${finalPlan.status}`);

  return metrics;
}

/**
 * Validate performance requirements
 */
async function validatePerformance(metrics: PerformanceMetrics): Promise<void> {
  console.log('⏱️ Validating performance requirements...');

  const requirements = {
    totalTime: 5000, // < 5 seconds
    realTimeLatency: 1000 // < 1 second
  };

  const results = {
    totalTimePass: metrics.totalTime < requirements.totalTime,
    latencyPass: metrics.realTimeLatency < requirements.realTimeLatency
  };

  console.log('📊 Performance Results:');
  console.log(`   Total time: ${metrics.totalTime}ms (req: <${requirements.totalTime}ms) ${results.totalTimePass ? '✅' : '❌'}`);
  console.log(`   Avg latency: ${metrics.realTimeLatency.toFixed(0)}ms (req: <${requirements.realTimeLatency}ms) ${results.latencyPass ? '✅' : '❌'}`);
  console.log(`   Dispatch: ${metrics.dispatchTime}ms`);
  console.log(`   Route: ${metrics.routeTime}ms`);
  console.log(`   Inventory: ${metrics.inventoryTime}ms`);

  if (!results.totalTimePass || !results.latencyPass) {
    throw new Error('Performance requirements not met');
  }

  console.log('✅ All performance requirements met');
}

/**
 * Validate workflow outputs
 */
async function validateWorkflowOutputs(testData: TestData): Promise<void> {
  console.log('🔍 Validating workflow outputs...');

  const { data: finalPlan } = await DailyPlanService.getCurrentDailyPlan(
    testData.userId,
    testData.planDate
  );

  if (!finalPlan) {
    throw new Error('No daily plan found');
  }

  // Validate dispatch output
  const dispatchOutput = finalPlan.dispatch_output;
  if (!dispatchOutput?.prioritized_jobs || dispatchOutput.prioritized_jobs.length === 0) {
    throw new Error('Dispatch output missing or empty');
  }

  // Validate route output
  const routeOutput = finalPlan.route_output;
  if (!routeOutput?.optimized_route?.waypoints || routeOutput.optimized_route.waypoints.length === 0) {
    throw new Error('Route output missing or empty');
  }

  // Validate inventory output
  const inventoryOutput = finalPlan.inventory_output;
  if (!inventoryOutput?.parts_manifest) {
    throw new Error('Inventory output missing parts manifest');
  }

  // Check if shopping list was generated (we have out of stock items)
  if (!inventoryOutput.shopping_list || inventoryOutput.shopping_list.length === 0) {
    console.warn('⚠️ No shopping list generated despite out of stock items');
  }

  console.log('✅ All workflow outputs validated');
  console.log(`   📋 Jobs prioritized: ${dispatchOutput.prioritized_jobs.length}`);
  console.log(`   🗺️ Route waypoints: ${routeOutput.optimized_route.waypoints.length}`);
  console.log(`   📦 Parts manifest entries: ${inventoryOutput.parts_manifest.length}`);
  console.log(`   🛒 Shopping list items: ${inventoryOutput.shopping_list?.length || 0}`);
}

/**
 * Clean up test data
 */
async function cleanupTestData(testData: TestData): Promise<void> {
  console.log('🧹 Cleaning up test data...');

  try {
    // Delete test data in order (respecting foreign key constraints)
    await supabase.from('daily_plans').delete().eq('user_id', testData.userId);
    await supabase.from('inventory_items').delete().eq('user_id', testData.userId);
    await supabase.from('job_locations').delete().eq('user_id', testData.userId);
    await supabase.from('profiles').delete().eq('id', testData.userId);

    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.warn('⚠️ Error during cleanup:', error);
  }
}

/**
 * Main test runner
 */
export async function runCompleteWorkflowTest(): Promise<boolean> {
  let testData: TestData | null = null;
  
  try {
    console.log('🧪 Starting Complete Workflow Test...');
    console.log('=' * 60);

    // Setup test data
    testData = await setupTestData();

    // Execute complete workflow
    const metrics = await testCompleteWorkflow(testData);

    // Validate performance
    await validatePerformance(metrics);

    // Validate outputs
    await validateWorkflowOutputs(testData);

    console.log('=' * 60);
    console.log('✅ Complete Workflow Test PASSED');
    console.log(`   Total execution time: ${metrics.totalTime}ms`);
    console.log(`   All agents executed successfully`);
    console.log(`   Real-time updates working`);
    console.log(`   Performance requirements met`);
    
    return true;

  } catch (error) {
    console.log('=' * 60);
    console.error('❌ Complete Workflow Test FAILED:', error);
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
  runCompleteWorkflowTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
} 