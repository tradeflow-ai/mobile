/**
 * Quick test script for TradeFlow LangGraph Backend
 * 
 * Run this to verify the backend service is working correctly:
 * node test-backend.js
 */

const BACKEND_URL = 'http://localhost:3001';

async function testHealthCheck() {
  try {
    console.log('🔍 Testing health check...');
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health check passed:', data);
      return true;
    } else {
      console.log('❌ Health check failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testPlanDay() {
  try {
    console.log('🎯 Testing plan day API...');
    const response = await fetch(`${BACKEND_URL}/api/plan-day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        jobIds: ['job-1', 'job-2', 'job-3'],
        planDate: '2024-01-15'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Plan day API passed:', data);
      return true;
    } else {
      console.log('❌ Plan day API failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Plan day API error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing TradeFlow LangGraph Backend...\n');
  
  const healthOk = await testHealthCheck();
  console.log('');
  
  if (!healthOk) {
    console.log('❌ Backend service is not available. Please start it first:');
    console.log('   docker-compose up langgraph-backend');
    console.log('   or');
    console.log('   cd backend && npm start');
    return;
  }
  
  const planOk = await testPlanDay();
  console.log('');
  
  if (healthOk && planOk) {
    console.log('🎉 All tests passed! Backend is ready for React Native integration.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start your React Native app: npm start');
    console.log('2. Tap "Plan Your Day" button in the home screen');
    console.log('3. Should see success message from backend API');
  } else {
    console.log('❌ Some tests failed. Check the backend service and try again.');
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testHealthCheck, testPlanDay }; 