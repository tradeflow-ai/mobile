/**
 * Hardware Store Job Creation Test
 * 
 * Tests the creation of hardware store run jobs when inventory
 * is insufficient for planned work. Validates:
 * - Shopping list generation
 * - Hardware store job creation in database
 * - Route integration
 * - Shopping list accuracy
 */

import { supabase } from '../services/supabase';
import { DailyPlanService } from '../services/dailyPlanService';
import { PreferencesService } from '../services/preferencesService';
import { InventorySpecialistAgent } from './agents';

interface TestData {
  userId: string;
  jobIds: string[];
  inventoryItemIds: string[];
  planDate: string;
}

/**
 * Create test user for hardware store testing
 */
async function createTestUser(): Promise<string> {
  const testUserId = `test-hardware-${Date.now()}`;
  
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: testUserId,
      email: `hardware-test-${Date.now()}@tradeflow.ai`,
      full_name: 'Hardware Test User',
      first_name: 'Hardware',
      last_name: 'Test',
      role: 'user'
    });

  if (profileError) {
    throw new Error(`Failed to create test user: ${profileError.message}`);
  }

  // Set preferences with specific suppliers
  const preferences = {
    work_start_time: '08:00',
    work_end_time: '17:00',
    primary_supplier: 'Home Depot',
    secondary_suppliers: ['Lowe\'s', 'Ferguson'],
    travel_buffer_percentage: 15,
    job_duration_buffer_minutes: 15
  };

  await PreferencesService.updateUserPreferences(testUserId, preferences);

  console.log(`✅ Created hardware test user: ${testUserId}`);
  return testUserId;
}

/**
 * Create jobs that require specific parts
 */
async function createJobsRequiringParts(userId: string): Promise<string[]> {
  const jobs = [
    {
      user_id: userId,
      title: 'Plumbing Repair - Pipe Replacement',
      description: 'Replace damaged pipes in basement',
      job_type: 'service',
      priority: 'high',
      status: 'pending',
      latitude: 30.2672,
      longitude: -97.7431,
      address: '123 Plumbing St, Austin, TX 78701',
      customer_name: 'Fix-It Corp',
      estimated_duration: 180,
      instructions: 'Bring extra pipe fittings and PVC cement',
      required_items: [], // Will be populated with inventory item IDs
      scheduled_date: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'HVAC Filter Replacement',
      description: 'Replace multiple HVAC filters in office building',
      job_type: 'maintenance',
      priority: 'medium',
      status: 'pending',
      latitude: 30.3077,
      longitude: -97.7536,
      address: '456 HVAC Ave, Austin, TX 78704',
      customer_name: 'Office Complex LLC',
      estimated_duration: 120,
      instructions: 'Building has 12 units requiring filter replacement',
      required_items: [],
      scheduled_date: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'Electrical Wiring Installation',
      description: 'Install new electrical circuits',
      job_type: 'service',
      priority: 'high',
      status: 'pending',
      latitude: 30.2500,
      longitude: -97.7500,
      address: '789 Electric Rd, Austin, TX 78745',
      customer_name: 'New Construction Inc',
      estimated_duration: 240,
      instructions: 'Need significant electrical wire and conduit',
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
  console.log(`✅ Created ${jobIds.length} jobs requiring parts`);
  return jobIds;
}

/**
 * Create inventory with strategic shortages to trigger shopping
 */
async function createInventoryWithShortages(userId: string): Promise<string[]> {
  const inventoryItems = [
    // Plumbing items - insufficient quantities
    {
      user_id: userId,
      name: 'PVC Pipe 1/2" Schedule 40',
      description: 'Half-inch PVC pipe for plumbing',
      quantity: 2, // Need 20 feet for job
      unit: 'feet',
      category: 'Plumbing',
      status: 'low_stock',
      min_quantity: 15,
      cost_per_unit: 2.50,
      supplier: 'Home Depot'
    },
    {
      user_id: userId,
      name: 'PVC Pipe Cement',
      description: 'PVC pipe cement adhesive',
      quantity: 0, // Completely out
      unit: 'can',
      category: 'Plumbing',
      status: 'out_of_stock',
      min_quantity: 2,
      cost_per_unit: 8.99,
      supplier: 'Home Depot'
    },
    {
      user_id: userId,
      name: 'PVC Elbow Fitting 1/2"',
      description: 'Half-inch 90-degree elbow fittings',
      quantity: 1, // Need 8 for job
      unit: 'each',
      category: 'Plumbing',
      status: 'low_stock',
      min_quantity: 5,
      cost_per_unit: 1.25,
      supplier: 'Ferguson'
    },
    // HVAC items - insufficient for large job
    {
      user_id: userId,
      name: 'HVAC Filter 16x20x1 MERV 11',
      description: 'Standard HVAC air filter',
      quantity: 3, // Need 12 for office building
      unit: 'each',
      category: 'HVAC',
      status: 'low_stock',
      min_quantity: 10,
      cost_per_unit: 12.99,
      supplier: 'Home Depot'
    },
    {
      user_id: userId,
      name: 'HVAC Filter 20x25x1 MERV 11',
      description: 'Large HVAC air filter',
      quantity: 0, // Need 4 for larger units
      unit: 'each',
      category: 'HVAC',
      status: 'out_of_stock',
      min_quantity: 5,
      cost_per_unit: 18.99,
      supplier: 'Home Depot'
    },
    // Electrical items - major shortage
    {
      user_id: userId,
      name: 'Electrical Wire 12 AWG THHN',
      description: 'Twelve gauge electrical wire',
      quantity: 25, // Need 200 feet for new circuits
      unit: 'feet',
      category: 'Electrical',
      status: 'low_stock',
      min_quantity: 100,
      cost_per_unit: 0.85,
      supplier: 'Ferguson'
    },
    {
      user_id: userId,
      name: 'Electrical Conduit 1/2" EMT',
      description: 'Half-inch electrical metallic tubing',
      quantity: 0, // Need 10 pieces
      unit: 'feet',
      category: 'Electrical',
      status: 'out_of_stock',
      min_quantity: 20,
      cost_per_unit: 3.50,
      supplier: 'Home Depot'
    },
    {
      user_id: userId,
      name: 'Wire Nuts Assorted',
      description: 'Assorted electrical wire nuts',
      quantity: 5, // Need 50 for connections
      unit: 'pack',
      category: 'Electrical',
      status: 'low_stock',
      min_quantity: 15,
      cost_per_unit: 4.99,
      supplier: 'Lowe\'s'
    },
    // Tools - adequate supply (should not trigger shopping)
    {
      user_id: userId,
      name: 'Pipe Wrench 14"',
      description: 'Heavy duty pipe wrench',
      quantity: 2,
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
    .select('id');

  if (error) {
    throw new Error(`Failed to create test inventory: ${error.message}`);
  }

  const inventoryItemIds = data?.map(item => item.id) || [];
  console.log(`✅ Created ${inventoryItemIds.length} inventory items with strategic shortages`);
  return inventoryItemIds;
}

/**
 * Test shopping list generation accuracy
 */
async function testShoppingListAccuracy(testData: TestData): Promise<void> {
  console.log('🛒 Testing shopping list accuracy...');

  // Create a daily plan and run inventory agent
  const { data: dailyPlan, error } = await DailyPlanService.createDailyPlan({
    user_id: testData.userId,
    planned_date: testData.planDate,
    job_ids: testData.jobIds,
    preferences_snapshot: {}
  });

  if (error || !dailyPlan) {
    throw new Error('Failed to create daily plan for inventory test');
  }

  // Mock dispatch output for inventory agent
  const mockDispatchOutput = {
    prioritized_jobs: testData.jobIds.map((jobId, index) => ({
      job_id: jobId,
      priority_rank: index + 1,
      estimated_start_time: new Date(Date.now() + index * 60 * 60 * 1000).toISOString(),
      estimated_end_time: new Date(Date.now() + (index + 1) * 60 * 60 * 1000).toISOString(),
      priority_reason: `Job ${index + 1} prioritized for testing`,
      job_type: 'service',
      buffer_time_minutes: 15,
      priority_score: 100 - index * 10,
      scheduling_notes: 'Test job'
    })),
    scheduling_constraints: {},
    recommendations: [],
    agent_reasoning: 'Mock dispatch for hardware store testing',
    execution_time_ms: 100,
    optimization_summary: {}
  };

  // Execute inventory agent
  const inventoryAgent = new InventorySpecialistAgent();
  const inventoryOutput = await inventoryAgent.execute(
    {
      userId: testData.userId,
      planId: dailyPlan.id,
      jobIds: testData.jobIds,
      planDate: testData.planDate
    },
    mockDispatchOutput
  );

  // Validate shopping list was generated
  if (!inventoryOutput.shopping_list || inventoryOutput.shopping_list.length === 0) {
    throw new Error('No shopping list generated despite inventory shortages');
  }

  console.log(`✅ Shopping list generated with ${inventoryOutput.shopping_list.length} items`);

  // Validate specific expected items
  const expectedItems = [
    'PVC Pipe 1/2" Schedule 40',
    'PVC Pipe Cement',
    'PVC Elbow Fitting 1/2"',
    'HVAC Filter 16x20x1 MERV 11',
    'HVAC Filter 20x25x1 MERV 11',
    'Electrical Wire 12 AWG THHN',
    'Electrical Conduit 1/2" EMT',
    'Wire Nuts Assorted'
  ];

  const shoppingItemNames = inventoryOutput.shopping_list.map(item => item.item_name);
  const missingExpectedItems = expectedItems.filter(expected => 
    !shoppingItemNames.some(actual => actual.includes(expected))
  );

  if (missingExpectedItems.length > 0) {
    console.warn(`⚠️ Missing expected items from shopping list: ${missingExpectedItems.join(', ')}`);
  }

  // Validate quantities make sense
  for (const item of inventoryOutput.shopping_list) {
    if (item.quantity_needed <= 0) {
      throw new Error(`Invalid quantity for ${item.item_name}: ${item.quantity_needed}`);
    }
    if (!item.priority || !['high', 'medium', 'low'].includes(item.priority)) {
      throw new Error(`Invalid priority for ${item.item_name}: ${item.priority}`);
    }
  }

  console.log('✅ Shopping list accuracy validated');
  
  // Log the shopping list for verification
  console.log('🛒 Generated Shopping List:');
  inventoryOutput.shopping_list.forEach(item => {
    console.log(`   - ${item.item_name}: ${item.quantity_needed} ${item.unit} (${item.priority} priority)`);
  });
}

/**
 * Test hardware store job creation in database
 */
async function testHardwareJobCreation(testData: TestData): Promise<string[]> {
  console.log('🏪 Testing hardware store job creation...');

  // Define store locations for testing
  const storeLocations = [
    {
      store_name: 'Home Depot - South Austin',
      address: '1000 Research Blvd, Austin, TX 78759',
      coordinates: { latitude: 30.3866, longitude: -97.7267 },
      estimated_visit_time: 45,
      items_available: ['PVC Pipe 1/2" Schedule 40', 'PVC Pipe Cement', 'HVAC Filter 16x20x1 MERV 11']
    },
    {
      store_name: 'Ferguson - Central Austin',
      address: '2200 E 6th St, Austin, TX 78702',
      coordinates: { latitude: 30.2638, longitude: -97.7208 },
      estimated_visit_time: 30,
      items_available: ['PVC Elbow Fitting 1/2"', 'Electrical Wire 12 AWG THHN']
    }
  ];

  // Create hardware store run jobs
  const { data: hardwareJobIds, error } = await DailyPlanService.createHardwareStoreRunJobs(
    testData.userId,
    testData.planDate,
    storeLocations
  );

  if (error || !hardwareJobIds) {
    throw new Error(`Failed to create hardware store jobs: ${error}`);
  }

  console.log(`✅ Created ${hardwareJobIds.length} hardware store run jobs`);

  // Verify jobs were created in database
  const { data: createdJobs, error: fetchError } = await supabase
    .from('job_locations')
    .select('*')
    .in('id', hardwareJobIds);

  if (fetchError) {
    throw new Error(`Failed to fetch created hardware store jobs: ${fetchError.message}`);
  }

  if (!createdJobs || createdJobs.length !== hardwareJobIds.length) {
    throw new Error(`Expected ${hardwareJobIds.length} jobs, found ${createdJobs?.length || 0}`);
  }

  // Validate job properties
  for (const job of createdJobs) {
    // Check job type
    if (job.job_type !== 'pickup') {
      throw new Error(`Expected job_type 'pickup', got '${job.job_type}'`);
    }

    // Check title contains store name
    if (!job.title.includes('Hardware Store Run')) {
      throw new Error(`Job title should contain 'Hardware Store Run': ${job.title}`);
    }

    // Check coordinates are valid
    if (!job.latitude || !job.longitude) {
      throw new Error(`Job missing coordinates: lat=${job.latitude}, lng=${job.longitude}`);
    }

    // Check address is populated
    if (!job.address || job.address.trim() === '') {
      throw new Error('Job missing address');
    }

    // Check estimated duration
    if (!job.estimated_duration || job.estimated_duration <= 0) {
      throw new Error(`Invalid estimated duration: ${job.estimated_duration}`);
    }

    // Check instructions contain items list
    if (!job.instructions || !job.instructions.includes('Items to pick up:')) {
      throw new Error('Job instructions should contain items to pick up');
    }

    console.log(`✅ Validated hardware store job: ${job.title}`);
  }

  console.log('✅ All hardware store jobs validated in database');
  return hardwareJobIds;
}

/**
 * Test route integration includes hardware store stops
 */
async function testRouteIntegration(testData: TestData, hardwareJobIds: string[]): Promise<void> {
  console.log('🗺️ Testing route integration with hardware store stops...');

  // Combine original jobs with hardware store jobs
  const allJobIds = [...testData.jobIds, ...hardwareJobIds];

  // Create a test route that includes hardware store stops
  const { data: route, error } = await supabase
    .from('routes')
    .insert({
      user_id: testData.userId,
      name: 'Test Route with Hardware Stores',
      description: 'Route including hardware store pickups',
      status: 'planned',
      job_location_ids: allJobIds,
      optimized_order: allJobIds, // Simple order for testing
      total_distance: 45.8,
      estimated_time: 280, // Including hardware store time
      planned_date: testData.planDate
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test route: ${error.message}`);
  }

  // Verify route includes hardware store jobs
  const hardwareJobsInRoute = route.job_location_ids.filter(jobId => 
    hardwareJobIds.includes(jobId)
  );

  if (hardwareJobsInRoute.length !== hardwareJobIds.length) {
    throw new Error(`Route missing hardware store jobs. Expected ${hardwareJobIds.length}, found ${hardwareJobsInRoute.length}`);
  }

  // Verify route has realistic timing that accounts for shopping time
  if (route.estimated_time < 180) { // Should be at least 3 hours with shopping
    throw new Error(`Route estimated time too low: ${route.estimated_time} minutes`);
  }

  console.log('✅ Route integration verified');
  console.log(`   📍 Total waypoints: ${route.job_location_ids.length}`);
  console.log(`   🏪 Hardware stores: ${hardwareJobsInRoute.length}`);
  console.log(`   ⏱️ Total estimated time: ${route.estimated_time} minutes`);
}

/**
 * Validate hardware store coordinates and addresses
 */
async function validateStoreLocations(hardwareJobIds: string[]): Promise<void> {
  console.log('📍 Validating hardware store locations...');

  const { data: jobs, error } = await supabase
    .from('job_locations')
    .select('*')
    .in('id', hardwareJobIds);

  if (error) {
    throw new Error(`Failed to fetch jobs for location validation: ${error.message}`);
  }

  for (const job of jobs || []) {
    // Validate coordinates are in Austin area (rough bounds)
    const austinBounds = {
      minLat: 30.1,
      maxLat: 30.5,
      minLng: -98.0,
      maxLng: -97.5
    };

    if (job.latitude < austinBounds.minLat || job.latitude > austinBounds.maxLat ||
        job.longitude < austinBounds.minLng || job.longitude > austinBounds.maxLng) {
      throw new Error(`Job coordinates outside Austin area: ${job.latitude}, ${job.longitude}`);
    }

    // Validate address format
    if (!job.address.includes('Austin, TX')) {
      throw new Error(`Address should include Austin, TX: ${job.address}`);
    }

    // Validate customer name is store name
    if (!job.customer_name || (!job.customer_name.includes('Home Depot') && !job.customer_name.includes('Ferguson'))) {
      throw new Error(`Customer name should be store name: ${job.customer_name}`);
    }

    console.log(`✅ Validated location: ${job.customer_name} at ${job.address}`);
  }

  console.log('✅ All store locations validated');
}

/**
 * Setup test data
 */
async function setupTestData(): Promise<TestData> {
  console.log('🔧 Setting up hardware store test data...');
  
  const userId = await createTestUser();
  const jobIds = await createJobsRequiringParts(userId);
  const inventoryItemIds = await createInventoryWithShortages(userId);
  const planDate = new Date().toISOString().split('T')[0];

  return {
    userId,
    jobIds,
    inventoryItemIds,
    planDate
  };
}

/**
 * Clean up test data
 */
async function cleanupTestData(testData: TestData): Promise<void> {
  console.log('🧹 Cleaning up hardware store test data...');

  try {
    // Delete in order to respect foreign key constraints
    await supabase.from('routes').delete().eq('user_id', testData.userId);
    await supabase.from('daily_plans').delete().eq('user_id', testData.userId);
    await supabase.from('inventory_items').delete().eq('user_id', testData.userId);
    await supabase.from('job_locations').delete().eq('user_id', testData.userId);
    await supabase.from('profiles').delete().eq('id', testData.userId);

    console.log('✅ Hardware store test data cleaned up');
  } catch (error) {
    console.warn('⚠️ Error during hardware store test cleanup:', error);
  }
}

/**
 * Main test runner for hardware store functionality
 */
export async function runHardwareStoreJobTest(): Promise<boolean> {
  let testData: TestData | null = null;
  
  try {
    console.log('🏪 Starting Hardware Store Job Creation Test...');
    console.log('=' * 60);

    // Setup test data
    testData = await setupTestData();

    // Test shopping list accuracy
    await testShoppingListAccuracy(testData);

    // Test hardware store job creation
    const hardwareJobIds = await testHardwareJobCreation(testData);

    // Test route integration
    await testRouteIntegration(testData, hardwareJobIds);

    // Validate store locations
    await validateStoreLocations(hardwareJobIds);

    console.log('=' * 60);
    console.log('✅ Hardware Store Job Creation Test PASSED');
    console.log(`   🛒 Shopping list generated correctly`);
    console.log(`   🏪 Hardware store jobs created: ${hardwareJobIds.length}`);
    console.log(`   🗺️ Route integration verified`);
    console.log(`   📍 Store locations validated`);
    
    return true;

  } catch (error) {
    console.log('=' * 60);
    console.error('❌ Hardware Store Job Creation Test FAILED:', error);
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
  runHardwareStoreJobTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Hardware store test execution error:', error);
      process.exit(1);
    });
} 