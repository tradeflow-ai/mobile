/**
 * Test file for LangGraph implementation
 * 
 * This file tests the basic LangGraph setup to ensure it's working correctly
 * for Phase 1 requirements.
 */

import { createAgentGraph } from './graph';

/**
 * Test the basic LangGraph workflow
 */
export async function testAgentGraph() {
  try {
    console.log('🧪 Testing LangGraph implementation...');
    
    const graph = createAgentGraph();
    
    const result = await graph.invoke({
      step: 0,
      message: 'Starting Phase 1 test'
    });
    
    console.log('✅ LangGraph test successful!');
    console.log('📊 Result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ LangGraph test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAgentGraph()
    .then(() => {
      console.log('🎉 All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
} 