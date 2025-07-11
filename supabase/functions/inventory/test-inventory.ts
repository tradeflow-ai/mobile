/**
 * Inventory Edge Function Test Suite
 * 
 * Tests the inventory function in isolation to verify:
 * - INVENTORY_PROMPT usage
 * - Parts analysis logic
 * - Shopping list generation
 * - Hardware store job creation
 * - New supplier tool integration
 */

import { InventoryAgent } from './inventory-agent.ts';

// Mock test data
const mockDispatchOutput = {
  prioritized_jobs: [
    {
      job_id: 'job-emergency-1',
      priority_rank: 1,
      estimated_start_time: '08:00',
      estimated_end_time: '09:30',
      priority_reason: 'Emergency plumbing leak requires immediate attention',
      job_type: 'emergency',
      buffer_time_minutes: 15,
      priority_score: 1150,
      scheduling_notes: 'Must be first job of the day',
      business_priority_tier: 'emergency',
      geographic_reasoning: 'Closest emergency job to starting location',
      travel_time_to_next: 20
    },
    {
      job_id: 'job-inspection-1',
      priority_rank: 2,
      estimated_start_time: '10:00',
      estimated_end_time: '11:00',
      priority_reason: 'High priority HVAC inspection scheduled',
      job_type: 'inspection',
      buffer_time_minutes: 15,
      priority_score: 650,
      scheduling_notes: 'Route optimized for efficiency',
      business_priority_tier: 'inspection',
      geographic_reasoning: 'Next closest job after emergency',
      travel_time_to_next: 15
    },
    {
      job_id: 'job-service-1',
      priority_rank: 3,
      estimated_start_time: '11:30',
      estimated_end_time: '12:15',
      priority_reason: 'Service call for sink repair',
      job_type: 'service',
      buffer_time_minutes: 15,
      priority_score: 150,
      scheduling_notes: 'Can be delayed if needed',
      business_priority_tier: 'service',
      geographic_reasoning: 'Grouped with nearby service jobs',
      travel_time_to_next: 10
    }
  ],
  scheduling_constraints: {
    work_start_time: '08:00',
    work_end_time: '17:00',
    lunch_break_start: '12:00',
    lunch_break_end: '13:00',
    total_work_hours: 8,
    total_jobs_scheduled: 3,
    schedule_conflicts: []
  },
  recommendations: ['Consider hardware store stop for emergency job'],
  agent_reasoning: 'Prioritized by business rules with geographic optimization',
  execution_time_ms: 2500,
  optimization_summary: {
    emergency_jobs: 1,
    inspection_jobs: 1,
    service_jobs: 1,
    total_travel_time: 45,
    route_efficiency: 0.85
  }
};

const mockJobsData = [
  {
    id: 'job-emergency-1',
    title: 'Emergency Plumbing Leak',
    job_type: 'emergency',
    description: 'Burst pipe flooding basement - needs pipe fittings and sealant'
  },
  {
    id: 'job-inspection-1',
    title: 'HVAC Inspection',
    job_type: 'inspection', 
    description: 'Annual HVAC system inspection - may need filters'
  },
  {
    id: 'job-service-1',
    title: 'Sink Repair',
    job_type: 'service',
    description: 'Fix leaky kitchen sink - likely needs new faucet parts'
  }
];

const mockInventoryData = [
  {
    item_name: 'Pipe fitting',
    category: 'plumbing',
    quantity_on_hand: 2,
    minimum_stock: 5,
    unit_cost: 3.50,
    preferred_supplier: 'home_depot'
  },
  {
    item_name: 'Pipe sealant',
    category: 'plumbing', 
    quantity_on_hand: 0,
    minimum_stock: 2,
    unit_cost: 8.99,
    preferred_supplier: 'lowes'
  },
  {
    item_name: 'HVAC filter',
    category: 'hvac',
    quantity_on_hand: 3,
    minimum_stock: 2,
    unit_cost: 15.99,
    preferred_supplier: 'home_depot'
  }
];

const mockUserPreferences = {
  primary_supplier: 'home_depot',
  secondary_suppliers: ['lowes'],
  preferred_brands: ['standard'],
  quality_preference: 'standard',
  delivery_preference: 'pickup'
};

/**
 * Test 1: Basic Inventory Functionality
 */
async function testBasicInventory() {
  console.log('🧪 Test 1: Basic Inventory Functionality');
  
  try {
    const inventoryAgent = new InventoryAgent();
    
    const result = await inventoryAgent.execute({
      userId: 'test-user-1',
      jobIds: mockJobsData.map(job => job.id),
      dispatchOutput: mockDispatchOutput
    });
    
    // Verify result structure
    console.log('✅ Inventory agent executed successfully');
    console.log('📊 Result structure:', Object.keys(result));
    
    // Verify inventory analysis exists
    if (result.inventory_analysis) {
      console.log('✅ Inventory analysis generated');
      console.log('📋 Analysis keys:', Object.keys(result.inventory_analysis));
    } else {
      console.warn('⚠️ No inventory analysis in result');
    }
    
    // Check for shopping list
    if (result.inventory_analysis?.shopping_list) {
      console.log('✅ Shopping list generated:', result.inventory_analysis.shopping_list.length, 'items');
    } else {
      console.warn('⚠️ No shopping list generated');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    throw error;
  }
}

/**
 * Test 2: Hardware Store Job Creation
 */
async function testHardwareStoreJobCreation() {
  console.log('\n🧪 Test 2: Hardware Store Job Creation');
  
  try {
    const inventoryAgent = new InventoryAgent();
    
    // Test with critical items needed
    const result = await inventoryAgent.execute({
      userId: 'test-user-2',
      jobIds: mockJobsData.map(job => job.id),
      dispatchOutput: mockDispatchOutput
    });
    
    // Check if hardware store job was created
    if (result.hardware_store_job) {
      console.log('✅ Hardware store job created');
      console.log('🏪 Store job details:', {
        title: result.hardware_store_job.title,
        address: result.hardware_store_job.address,
        duration: result.hardware_store_job.estimated_duration,
        cost: result.hardware_store_job.estimated_cost
      });
      
      // Verify required fields
      const requiredFields = ['id', 'title', 'job_type', 'priority', 'address', 'latitude', 'longitude'];
      const missingFields = requiredFields.filter(field => !result.hardware_store_job[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ Hardware store job has all required fields');
      } else {
        console.warn('⚠️ Missing fields:', missingFields);
      }
      
      // Verify job type is correct
      if (result.hardware_store_job.job_type === 'hardware_store') {
        console.log('✅ Correct job type set');
      } else {
        console.warn('⚠️ Incorrect job type:', result.hardware_store_job.job_type);
      }
      
    } else {
      console.log('ℹ️ No hardware store job created (may be expected if no critical items)');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
    throw error;
  }
}

/**
 * Test 3: Shopping List Generation
 */
async function testShoppingListGeneration() {
  console.log('\n🧪 Test 3: Shopping List Generation');
  
  try {
    const inventoryAgent = new InventoryAgent();
    
    const result = await inventoryAgent.execute({
      userId: 'test-user-3',
      jobIds: mockJobsData.map(job => job.id),
      dispatchOutput: mockDispatchOutput
    });
    
    const shoppingList = result.inventory_analysis?.shopping_list || [];
    
    console.log('🛒 Shopping list items:', shoppingList.length);
    
    if (shoppingList.length > 0) {
      // Verify shopping list structure
      const firstItem = shoppingList[0];
      const expectedFields = ['item_name', 'quantity_to_buy', 'estimated_cost', 'preferred_supplier', 'priority'];
      const hasAllFields = expectedFields.every(field => field in firstItem);
      
      if (hasAllFields) {
        console.log('✅ Shopping list items have correct structure');
      } else {
        console.warn('⚠️ Shopping list items missing fields');
      }
      
      // Check for priority classification
      const criticalItems = shoppingList.filter(item => item.priority === 'critical');
      const importantItems = shoppingList.filter(item => item.priority === 'important');
      const optionalItems = shoppingList.filter(item => item.priority === 'optional');
      
      console.log('🚨 Critical items:', criticalItems.length);
      console.log('⚡ Important items:', importantItems.length);
      console.log('💡 Optional items:', optionalItems.length);
      
      // Check for cost calculation
      if (result.inventory_analysis?.total_shopping_cost) {
        console.log('✅ Total shopping cost calculated:', result.inventory_analysis.total_shopping_cost);
      } else {
        console.warn('⚠️ No total shopping cost calculated');
      }
      
    } else {
      console.log('ℹ️ No shopping list generated (may be expected if all parts available)');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
    throw error;
  }
}

/**
 * Test 4: Prompt Integration
 */
async function testPromptIntegration() {
  console.log('\n🧪 Test 4: INVENTORY_PROMPT Integration');
  
  try {
    // Import the prompt
    const { INVENTORY_PROMPT } = await import('./inventory-prompt.ts');
    
    // Verify prompt exists and has expected content
    if (!INVENTORY_PROMPT) {
      throw new Error('INVENTORY_PROMPT not found');
    }
    
    console.log('✅ INVENTORY_PROMPT imported successfully');
    
    // Check for key phrases that should be in the prompt
    const keyPhrases = [
      'Lead Service Technician',
      'Inventory Manager',
      'parts manifest',
      'shopping list',
      'hardware store',
      'CRITICAL',
      'IMPORTANT',
      'OPTIONAL',
      'querySupplier',
      'getSupplierInfo',
      'TOOLS AVAILABLE'
    ];
    
    let foundPhrases = 0;
    for (const phrase of keyPhrases) {
      if (INVENTORY_PROMPT.includes(phrase)) {
        foundPhrases++;
      }
    }
    
    console.log(`✅ Found ${foundPhrases}/${keyPhrases.length} key phrases in prompt`);
    
    if (foundPhrases >= keyPhrases.length * 0.8) {
      console.log('✅ Prompt appears to be correctly structured with tool information');
    } else {
      console.warn('⚠️ Prompt may be missing key content or tool information');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
    throw error;
  }
}

/**
 * Test 5: New Supplier Tool Integration
 */
async function testSupplierToolIntegration() {
  console.log('\n🧪 Test 5: New Supplier Tool Integration');
  
  try {
    // Import the new supplier tools
    const { 
      querySupplier, 
      querySupplierForItem, 
      getAvailableSuppliers, 
      getSupplierInfo 
    } = await import('./mock-supplier.ts');
    
    console.log('✅ New supplier tools imported successfully');
    
    // Test getAvailableSuppliers
    const availableSuppliers = getAvailableSuppliers();
    console.log('🏪 Available suppliers:', availableSuppliers);
    
    if (availableSuppliers.length > 0) {
      console.log('✅ getAvailableSuppliers working');
    } else {
      console.warn('⚠️ No suppliers returned');
    }
    
    // Test getSupplierInfo
    const supplierInfo = getSupplierInfo('home_depot');
    if (supplierInfo) {
      console.log('✅ getSupplierInfo working');
      console.log('🏢 Supplier info:', supplierInfo.name);
    } else {
      console.warn('⚠️ No supplier info returned');
    }
    
    // Test querySupplier
    const testItems = [
      { name: 'pipe fitting', quantity: 2 },
      { name: 'pipe sealant', quantity: 1 }
    ];
    
    const supplierResult = await querySupplier(
      'home_depot',
      testItems,
      {
        latitude: 37.7749,
        longitude: -122.4194
      }
    );
    
    if (supplierResult.success) {
      console.log('✅ querySupplier working');
      console.log('🏪 Found stores:', supplierResult.stores?.length || 0);
      console.log('📦 Found items:', supplierResult.items?.length || 0);
    } else {
      console.warn('⚠️ querySupplier returned error:', supplierResult.message);
    }
    
    // Test querySupplierForItem (simplified version)
    const singleItemResult = await querySupplierForItem('home_depot', 'pipe fitting', 3);
    
    if (singleItemResult.success) {
      console.log('✅ querySupplierForItem working');
      console.log('📦 Single item result:', singleItemResult.items?.[0]?.item_name);
    } else {
      console.warn('⚠️ querySupplierForItem returned error:', singleItemResult.message);
    }
    
    return {
      availableSuppliers,
      supplierInfo,
      queryResult: supplierResult,
      singleItemResult
    };
    
  } catch (error) {
    console.error('❌ Test 5 failed:', error);
    throw error;
  }
}

/**
 * Test 6: Tool Usage in Agent Context
 */
async function testToolUsageInAgent() {
  console.log('\n🧪 Test 6: Tool Usage in Agent Context');
  
  try {
    // This test verifies that the agent can use the tools properly
    const inventoryAgent = new InventoryAgent();
    
    // Create a scenario that should trigger tool usage
    const result = await inventoryAgent.execute({
      userId: 'test-user-tool',
      jobIds: ['job-emergency-1'], // Emergency job should trigger critical item analysis
      dispatchOutput: mockDispatchOutput
    });
    
    // Check if the agent reasoning mentions tool usage
    if (result.agent_reasoning) {
      console.log('✅ Agent reasoning generated');
      
      // Look for evidence of tool usage in reasoning
      const toolKeywords = ['supplier', 'stock', 'availability', 'pricing', 'store'];
      const mentionsTools = toolKeywords.some(keyword => 
        result.agent_reasoning.toLowerCase().includes(keyword)
      );
      
      if (mentionsTools) {
        console.log('✅ Agent reasoning suggests tool usage');
      } else {
        console.log('ℹ️ Agent reasoning may not explicitly mention tool usage');
      }
    }
    
    // Check if hardware store job was created (indicating tool usage)
    if (result.hardware_store_job) {
      console.log('✅ Hardware store job created (likely using supplier tools)');
      
      // Check if store details are realistic (indicating tool was used)
      if (result.hardware_store_job.address && result.hardware_store_job.latitude) {
        console.log('✅ Realistic store details present (tool likely used)');
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test 6 failed:', error);
    throw error;
  }
}

/**
 * Test 7: Legacy Compatibility
 */
async function testLegacyCompatibility() {
  console.log('\n🧪 Test 7: Legacy Compatibility');
  
  try {
    // Test that the legacy mockSupplierAPI still works
    const { mockSupplierAPI } = await import('./mock-supplier.ts');
    
    if (!mockSupplierAPI) {
      throw new Error('mockSupplierAPI not found');
    }
    
    console.log('✅ Legacy mockSupplierAPI still available');
    
    // Test legacy API call
    const testItems = [
      { name: 'pipe fitting', quantity: 2 },
      { name: 'pipe sealant', quantity: 1 }
    ];
    
    const supplierResult = await mockSupplierAPI.invoke({
      supplier: 'home_depot',
      items: testItems,
      location: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    });
    
    if (supplierResult.success) {
      console.log('✅ Legacy mockSupplierAPI working');
      console.log('🏪 Found stores:', supplierResult.stores?.length || 0);
      console.log('📦 Found items:', supplierResult.items?.length || 0);
    } else {
      console.warn('⚠️ Legacy mockSupplierAPI returned error:', supplierResult.message);
    }
    
    return supplierResult;
    
  } catch (error) {
    console.error('❌ Test 7 failed:', error);
    throw error;
  }
}

/**
 * Run all inventory tests
 */
export async function runInventoryTests() {
  console.log('🚀 Starting Inventory Edge Function Tests (Updated for New Architecture)\n');
  
  const results = {
    basicFunctionality: null,
    hardwareStoreJob: null,
    shoppingList: null,
    promptIntegration: null,
    supplierTools: null,
    toolUsageInAgent: null,
    legacyCompatibility: null,
    allPassed: false
  };
  
  try {
    // Run tests
    results.basicFunctionality = await testBasicInventory();
    results.hardwareStoreJob = await testHardwareStoreJobCreation();
    results.shoppingList = await testShoppingListGeneration();
    results.promptIntegration = await testPromptIntegration();
    results.supplierTools = await testSupplierToolIntegration();
    results.toolUsageInAgent = await testToolUsageInAgent();
    results.legacyCompatibility = await testLegacyCompatibility();
    
    results.allPassed = true;
    console.log('\n🎉 All inventory tests passed with new architecture!');
    
  } catch (error) {
    console.error('\n💥 Inventory tests failed:', error);
    results.allPassed = false;
  }
  
  return results;
}

// Run tests if this file is executed directly
if (import.meta.main) {
  runInventoryTests();
} 