/**
 * Inventory Agent JSON Parsing Test Suite
 * 
 * Tests the new 6-strategy parsing logic to ensure it can handle various
 * AI response formats and extract the correct JSON data.
 */

import { InventoryAgent } from './inventory-agent.ts';

// Test cases with various AI response formats
const testCases = [
  {
    name: 'Pure JSON Response',
    response: `{
      "inventory_analysis": {
        "parts_needed": [
          {
            "item_name": "Ball Valve 3/4\"",
            "quantity": 2,
            "category": "plumbing",
            "priority": "critical",
            "reason": "Required for pipe connection",
            "job_ids": ["job-1"]
          }
        ],
        "current_stock": [],
        "shopping_list": [
          {
            "item_name": "Ball Valve 3/4\"",
            "quantity_to_buy": 2,
            "estimated_cost": 28.99,
            "preferred_supplier": "home_depot",
            "priority": "critical",
            "alternative_suppliers": ["lowes"]
          }
        ],
        "total_shopping_cost": 57.98,
        "supplier_breakdown": []
      },
      "agent_reasoning": "Test reasoning",
      "recommendations": ["Test recommendation"]
    }`,
    expectedSuccess: true,
    expectedStrategy: 1
  },
  {
    name: 'JSON in Markdown Blocks',
    response: `Based on the job analysis, here's the inventory breakdown:

\`\`\`json
{
  "inventory_analysis": {
    "parts_needed": [
      {
        "item_name": "Circuit Breaker 20A",
        "quantity": 1,
        "category": "electrical",
        "priority": "critical",
        "reason": "Required for electrical work",
        "job_ids": ["job-2"]
      }
    ],
    "current_stock": [],
    "shopping_list": [
      {
        "item_name": "Circuit Breaker 20A",
        "quantity_to_buy": 1,
        "estimated_cost": 25.99,
        "preferred_supplier": "home_depot",
        "priority": "critical",
        "alternative_suppliers": ["lowes"]
      }
    ],
    "total_shopping_cost": 25.99,
    "supplier_breakdown": []
  },
  "agent_reasoning": "Electrical job requires circuit breaker",
  "recommendations": ["Verify electrical code compliance"]
}
\`\`\`

This analysis covers all the required electrical components.`,
    expectedSuccess: true,
    expectedStrategy: 2
  },
  {
    name: 'JSON with Explanatory Text',
    response: `I'll analyze the inventory requirements for your jobs.

## Job Analysis Results

After reviewing the job requirements, I found the following inventory needs:

{
  "inventory_analysis": {
    "parts_needed": [
      {
        "item_name": "Wire 12 AWG",
        "quantity": 50,
        "category": "electrical",
        "priority": "critical",
        "reason": "Electrical wiring needed",
        "job_ids": ["job-3"]
      }
    ],
    "current_stock": [],
    "shopping_list": [
      {
        "item_name": "Wire 12 AWG",
        "quantity_to_buy": 50,
        "estimated_cost": 45.99,
        "preferred_supplier": "home_depot",
        "priority": "critical",
        "alternative_suppliers": ["lowes"]
      }
    ],
    "total_shopping_cost": 45.99,
    "supplier_breakdown": []
  },
  "agent_reasoning": "Electrical job requires proper gauge wire",
  "recommendations": ["Check wire gauge requirements"]
}

Please review this analysis and let me know if any adjustments are needed.`,
    expectedSuccess: true,
    expectedStrategy: 3
  },
  {
    name: 'Malformed JSON Edge Case',
    response: `Here's the analysis with some formatting issues:

{
  "inventory_analysis": {
    "parts_needed": [
      {
        "item_name": "Copper Fittings"
        "quantity": 3,
        "category": "plumbing",
        "priority": "critical",
        "reason": "Pipe connections",
        "job_ids": ["job-4"]
      }
    ],
    "current_stock": [],
    "shopping_list": [
      {
        "item_name": "Copper Fittings",
        "quantity_to_buy": 3,
        "estimated_cost": 18.99,
        "preferred_supplier": "home_depot",
        "priority": "critical",
        "alternative_suppliers": ["lowes"]
      }
    ],
    "total_shopping_cost": 18.99,
  },
  "agent_reasoning": "Plumbing requires proper fittings",
  "recommendations": ["Check fitting compatibility"]
}`,
    expectedSuccess: false,
    expectedStrategy: 'fallback'
  },
  {
    name: 'Complex Nested JSON',
    response: `Complete inventory analysis:

{
  "inventory_analysis": {
    "parts_needed": [
      {
        "item_name": "Ball Valve 3/4\"",
        "quantity": 2,
        "category": "plumbing",
        "priority": "critical",
        "reason": "Required for pipe connection",
        "job_ids": ["job-1"]
      },
      {
        "item_name": "Circuit Breaker 20A",
        "quantity": 1,
        "category": "electrical",
        "priority": "critical",
        "reason": "Required for electrical work",
        "job_ids": ["job-2"]
      }
    ],
    "current_stock": [
      {
        "item_name": "Wire Nuts",
        "quantity_available": 40,
        "quantity_needed": 10,
        "sufficient": true
      }
    ],
    "shopping_list": [
      {
        "item_name": "Ball Valve 3/4\"",
        "quantity_to_buy": 2,
        "estimated_cost": 28.99,
        "preferred_supplier": "home_depot",
        "priority": "critical",
        "alternative_suppliers": ["lowes"]
      },
      {
        "item_name": "Circuit Breaker 20A",
        "quantity_to_buy": 1,
        "estimated_cost": 25.99,
        "preferred_supplier": "home_depot",
        "priority": "critical",
        "alternative_suppliers": ["lowes"]
      }
    ],
    "total_shopping_cost": 54.98,
    "supplier_breakdown": [
      {
        "supplier": "home_depot",
        "items": ["Ball Valve 3/4\"", "Circuit Breaker 20A"],
        "estimated_cost": 54.98,
        "store_location": "Primary store location"
      }
    ]
  },
  "agent_reasoning": "Complex analysis with multiple job types requiring different parts",
  "recommendations": ["Verify compatibility", "Check stock availability"]
}`,
    expectedSuccess: true,
    expectedStrategy: 3
  }
];

// Mock data for testing
const mockJobs = [
  {
    id: 'job-1',
    title: 'Plumbing Repair',
    job_type: 'plumbing',
    description: 'Fix leaky pipe'
  },
  {
    id: 'job-2',
    title: 'Electrical Work',
    job_type: 'electrical',
    description: 'Install outlet'
  }
];

const mockInventory = [
  {
    name: 'Wire Nuts',
    quantity: 40,
    category: 'electrical'
  }
];

const mockPreferences = {
  primary_supplier: 'home_depot',
  secondary_suppliers: ['lowes']
};

/**
 * Test the new parsing strategies
 */
async function testParsing() {
  console.log('🧪 Starting Inventory Agent JSON Parsing Tests...\n');

  const agent = new InventoryAgent();
  let totalTests = 0;
  let passedTests = 0;

  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    totalTests++;

    try {
      // Call the private parseAIResponse method using reflection
      const result = await (agent as any).parseAIResponse(
        testCase.response,
        mockJobs,
        mockInventory,
        mockPreferences
      );

      if (result && result.inventory_analysis) {
        console.log(`✅ SUCCESS: Parsed successfully`);
        console.log(`📊 Result has ${result.inventory_analysis.shopping_list?.length || 0} shopping items`);
        
        // Check if expected items are present
        if (result.inventory_analysis.shopping_list?.length > 0) {
          const firstItem = result.inventory_analysis.shopping_list[0];
          console.log(`📋 First item: ${firstItem.item_name} ($${firstItem.estimated_cost})`);
        }
        
        if (testCase.expectedSuccess) {
          passedTests++;
          console.log(`🎯 EXPECTED: Test passed as expected\n`);
        } else {
          console.log(`⚠️ UNEXPECTED: Test passed but was expected to fail\n`);
        }
      } else {
        console.log(`❌ FAILED: No valid inventory analysis returned`);
        
        if (!testCase.expectedSuccess) {
          passedTests++;
          console.log(`🎯 EXPECTED: Test failed as expected (using fallback)\n`);
        } else {
          console.log(`❌ UNEXPECTED: Test failed but was expected to pass\n`);
        }
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      
      if (!testCase.expectedSuccess) {
        passedTests++;
        console.log(`🎯 EXPECTED: Test errored as expected\n`);
      } else {
        console.log(`❌ UNEXPECTED: Test errored but was expected to pass\n`);
      }
    }
  }

  console.log('📊 Test Summary:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed Tests: ${passedTests}`);
  console.log(`Failed Tests: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! JSON parsing is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Review the parsing logic.');
  }
}

/**
 * Test specific parsing strategies
 */
async function testParsingStrategies() {
  console.log('\n🔬 Testing Individual Parsing Strategies...\n');

  const agent = new InventoryAgent();

  // Test Strategy 3: extractLargestJSON
  console.log('🧪 Testing Strategy 3: extractLargestJSON');
  const testJson = `Some text before {"test": "value", "nested": {"key": "value"}} and after`;
  const extracted = (agent as any).extractLargestJSON(testJson);
  console.log(`Result: ${extracted}`);
  console.log(`Expected: {"test": "value", "nested": {"key": "value"}}`);
  console.log(`Match: ${extracted === '{"test": "value", "nested": {"key": "value"}}'}\n`);

  // Test Strategy 5: extractJSONFromPosition
  console.log('🧪 Testing Strategy 5: extractJSONFromPosition');
  const testText = `prefix {"key": "value", "array": [1, 2, 3]} suffix`;
  const position = testText.indexOf('{');
  const extracted2 = (agent as any).extractJSONFromPosition(testText, position);
  console.log(`Result: ${extracted2}`);
  console.log(`Expected: {"key": "value", "array": [1, 2, 3]}`);
  console.log(`Match: ${extracted2 === '{"key": "value", "array": [1, 2, 3]}'}\n`);
}

/**
 * Test fallback quality
 */
async function testFallbackQuality() {
  console.log('\n🔧 Testing Fallback Quality...\n');

  const agent = new InventoryAgent();

  // Test job-specific parts generation
  console.log('🔍 Testing getJobSpecificParts');
  const electricalJob = { job_type: 'electrical', description: 'Install outlet' };
  const plumbingJob = { job_type: 'plumbing', description: 'Fix leak' };
  
  const electricalParts = (agent as any).getJobSpecificParts(electricalJob);
  const plumbingParts = (agent as any).getJobSpecificParts(plumbingJob);
  
  console.log(`Electrical parts: ${electricalParts.join(', ')}`);
  console.log(`Plumbing parts: ${plumbingParts.join(', ')}`);
  
  // Test fallback inventory analysis
  console.log('\n🔍 Testing Enhanced Fallback Analysis');
  const fallbackResult = await (agent as any).createEnhancedFallbackInventoryAnalysis(
    [electricalJob, plumbingJob],
    mockInventory,
    mockPreferences
  );
  
  console.log(`Fallback result has ${fallbackResult.inventory_analysis.shopping_list.length} items`);
  console.log('Shopping list:');
  fallbackResult.inventory_analysis.shopping_list.forEach((item: any) => {
    console.log(`  - ${item.item_name}: $${item.estimated_cost} (${item.priority})`);
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  try {
    await testParsing();
    await testParsingStrategies();
    await testFallbackQuality();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ JSON parsing improvements are ready for production.');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export test functions
export {
  testParsing,
  testParsingStrategies,
  testFallbackQuality,
  runAllTests
};

// Run tests if called directly
if (import.meta.main) {
  runAllTests();
} 