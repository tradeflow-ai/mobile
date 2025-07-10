#!/usr/bin/env node

/**
 * VROOM Integration Test
 * 
 * Tests the real VROOM routing engine with realistic Austin plumbing job scenarios
 * Validates time window constraints, vehicle capacity, and route optimization
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const VROOM_URL = 'http://localhost:3000';
const OSRM_URL = 'http://localhost:5001';

// Test scenarios with realistic Austin locations
const TEST_SCENARIOS = {
  'austin-plumbing-jobs': {
    description: 'Austin plumbing jobs with time windows and capacity constraints',
    vehicles: [
      {
        id: 1,
        start: [-97.7431, 30.2672], // Austin downtown
        end: [-97.7431, 30.2672],
        capacity: [100], // 100 units of parts/tools capacity
        time_window: [28800, 61200], // 8 AM to 5 PM (in seconds from midnight)
        breaks: [
          {
            id: 1,
            time_windows: [[43200, 46800]], // 12 PM to 1 PM lunch break
            service: 3600 // 1 hour break
          }
        ]
      }
    ],
    jobs: [
      {
        id: 1,
        location: [-97.7394, 30.2849], // University of Texas area
        service: 3600, // 1 hour emergency leak repair
        amount: [20], // 20 units of parts needed
        time_windows: [[28800, 32400]], // 8 AM to 9 AM - emergency
        priority: 100 // High priority
      },
      {
        id: 2,
        location: [-97.7073, 30.2672], // East Austin
        service: 5400, // 1.5 hours toilet replacement
        amount: [15], // 15 units of parts needed
        time_windows: [[36000, 54000]], // 10 AM to 3 PM - maintenance
        priority: 10 // Normal priority
      },
      {
        id: 3,
        location: [-97.7884, 30.2672], // West Austin
        service: 2700, // 45 minutes drain cleaning
        amount: [5], // 5 units of parts needed
        time_windows: [[39600, 57600]], // 11 AM to 4 PM - maintenance
        priority: 10 // Normal priority
      },
      {
        id: 4,
        location: [-97.7431, 30.3072], // North Austin
        service: 7200, // 2 hours water heater installation
        amount: [30], // 30 units of parts needed
        time_windows: [[32400, 50400]], // 9 AM to 2 PM - scheduled
        priority: 50 // Medium priority
      },
      {
        id: 5,
        location: [-97.7431, 30.2272], // South Austin
        service: 1800, // 30 minutes faucet repair
        amount: [10], // 10 units of parts needed
        time_windows: [[46800, 61200]], // 1 PM to 5 PM - flexible
        priority: 5 // Low priority
      }
    ]
  },
  
  'capacity-constraint-test': {
    description: 'Test vehicle capacity constraints with hardware store run',
    vehicles: [
      {
        id: 1,
        start: [-97.7431, 30.2672], // Austin downtown
        end: [-97.7431, 30.2672],
        capacity: [50], // Limited capacity to force optimization
        time_window: [28800, 61200] // 8 AM to 5 PM
      }
    ],
    jobs: [
      {
        id: 1,
        location: [-97.7394, 30.2849], // Job requiring many parts
        service: 3600,
        amount: [40], // High parts requirement
        priority: 100
      },
      {
        id: 2,
        location: [-97.7073, 30.2672], // Another job requiring parts
        service: 2700,
        amount: [25], // Medium parts requirement
        priority: 50
      }
    ]
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Check if services are running
 */
async function checkServices() {
  log('🔍 Checking service health...', colors.blue);
  
  try {
    // Check VROOM service
    const vroomHealth = await axios.get(`${VROOM_URL}/health`);
    log(`✅ VROOM service: ${vroomHealth.data.status}`, colors.green);
    log(`   Binary available: ${vroomHealth.data.vroom_available}`, colors.cyan);
    log(`   OSRM URL: ${vroomHealth.data.osrm_url}`, colors.cyan);
    
    // Check OSRM service
    try {
      const osrmTest = await axios.get(`${OSRM_URL}/nearest/v1/driving/-97.7431,30.2672`);
      log(`✅ OSRM service: responding`, colors.green);
    } catch (osrmError) {
      log(`⚠️ OSRM service: not responding (${osrmError.message})`, colors.yellow);
      log(`   This is expected if OSRM data is not yet set up`, colors.yellow);
    }
    
    return true;
  } catch (error) {
    log(`❌ Service check failed: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Run a test scenario
 */
async function runTestScenario(name, scenario) {
  log(`\n🧪 Testing scenario: ${name}`, colors.blue);
  log(`   ${scenario.description}`, colors.cyan);
  
  const startTime = performance.now();
  
  try {
    const response = await axios.post(`${VROOM_URL}/vroom`, scenario, {
      timeout: 30000 // 30 second timeout
    });
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    if (response.data.code === 0) {
      log(`✅ Test passed in ${executionTime.toFixed(2)}ms`, colors.green);
      
      // Analyze results
      const result = response.data;
      const routes = result.routes || [];
      const summary = result.summary || {};
      
      log(`📊 Results:`, colors.cyan);
      log(`   Routes: ${routes.length}`, colors.cyan);
      log(`   Total distance: ${(summary.distance / 1000).toFixed(2)}km`, colors.cyan);
      log(`   Total duration: ${(summary.duration / 3600).toFixed(2)}h`, colors.cyan);
      log(`   Total cost: ${summary.cost}`, colors.cyan);
      log(`   Jobs scheduled: ${summary.amount || 0}`, colors.cyan);
      
      // Check if using real VROOM binary
      const metadata = result.metadata || {};
      log(`   Using real VROOM: ${metadata.vroom_binary_used}`, colors.cyan);
      log(`   Execution time: ${metadata.execution_time_ms}ms`, colors.cyan);
      
      // Validate constraints
      validateConstraints(scenario, result);
      
      return {
        success: true,
        executionTime,
        realVROOM: metadata.vroom_binary_used,
        result
      };
    } else {
      log(`❌ VROOM returned error code: ${response.data.code}`, colors.red);
      return { success: false, error: 'VROOM error code' };
    }
    
  } catch (error) {
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    log(`❌ Test failed after ${executionTime.toFixed(2)}ms: ${error.message}`, colors.red);
    
    if (error.response) {
      log(`   Response status: ${error.response.status}`, colors.red);
      log(`   Response data: ${JSON.stringify(error.response.data)}`, colors.red);
    }
    
    return { success: false, error: error.message, executionTime };
  }
}

/**
 * Validate that constraints are properly handled
 */
function validateConstraints(scenario, result) {
  log(`🔍 Validating constraints...`, colors.blue);
  
  const routes = result.routes || [];
  let constraintViolations = 0;
  
  routes.forEach((route, routeIndex) => {
    const steps = route.steps || [];
    let currentTime = 0;
    let currentCapacity = 0;
    
    steps.forEach((step, stepIndex) => {
      // Check time window constraints
      if (step.type === 'job') {
        const job = scenario.jobs.find(j => j.id === step.job);
        if (job && job.time_windows) {
          const arrival = step.arrival;
          const timeWindow = job.time_windows[0];
          
          if (arrival < timeWindow[0] || arrival > timeWindow[1]) {
            log(`   ⚠️ Time window violation: Job ${job.id} arrived at ${arrival}, window: [${timeWindow[0]}, ${timeWindow[1]}]`, colors.yellow);
            constraintViolations++;
          }
        }
        
        // Check capacity constraints
        if (job && job.amount) {
          currentCapacity += job.amount[0];
          const vehicleCapacity = scenario.vehicles[routeIndex]?.capacity?.[0] || Infinity;
          
          if (currentCapacity > vehicleCapacity) {
            log(`   ⚠️ Capacity violation: Route ${routeIndex} capacity ${currentCapacity} exceeds limit ${vehicleCapacity}`, colors.yellow);
            constraintViolations++;
          }
        }
      }
      
      currentTime = step.arrival + step.duration;
    });
  });
  
  if (constraintViolations === 0) {
    log(`✅ All constraints satisfied`, colors.green);
  } else {
    log(`⚠️ ${constraintViolations} constraint violations detected`, colors.yellow);
  }
}

/**
 * Performance benchmarks
 */
function runPerformanceBenchmarks(results) {
  log(`\n📊 Performance Benchmarks`, colors.blue);
  
  const realVROOMResults = results.filter(r => r.realVROOM);
  const mockResults = results.filter(r => !r.realVROOM);
  
  if (realVROOMResults.length > 0) {
    const avgRealTime = realVROOMResults.reduce((sum, r) => sum + r.executionTime, 0) / realVROOMResults.length;
    log(`⚡ Real VROOM average response time: ${avgRealTime.toFixed(2)}ms`, colors.green);
    
    if (avgRealTime < 2000) {
      log(`✅ Meets <2s response time requirement`, colors.green);
    } else {
      log(`❌ Exceeds 2s response time requirement`, colors.red);
    }
  }
  
  if (mockResults.length > 0) {
    const avgMockTime = mockResults.reduce((sum, r) => sum + r.executionTime, 0) / mockResults.length;
    log(`🧪 Mock VROOM average response time: ${avgMockTime.toFixed(2)}ms`, colors.cyan);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('🚀 Starting VROOM Integration Tests', colors.green);
  log('=====================================', colors.green);
  
  // Check services
  const servicesOk = await checkServices();
  if (!servicesOk) {
    log('\n❌ Service health check failed. Please ensure services are running:', colors.red);
    log('   docker-compose up -d', colors.cyan);
    process.exit(1);
  }
  
  // Run test scenarios
  const results = [];
  
  for (const [name, scenario] of Object.entries(TEST_SCENARIOS)) {
    const result = await runTestScenario(name, scenario);
    results.push(result);
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Performance benchmarks
  runPerformanceBenchmarks(results);
  
  // Final summary
  log('\n📋 Test Summary', colors.blue);
  log('================', colors.blue);
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const usingRealVROOM = results.filter(r => r.realVROOM).length;
  
  log(`Tests passed: ${successful}/${total}`, successful === total ? colors.green : colors.red);
  log(`Using real VROOM: ${usingRealVROOM}/${total}`, usingRealVROOM > 0 ? colors.green : colors.yellow);
  
  if (successful === total) {
    log(`\n🎉 All tests passed! VROOM integration is working correctly.`, colors.green);
  } else {
    log(`\n❌ Some tests failed. Check the output above for details.`, colors.red);
  }
  
  if (usingRealVROOM === 0) {
    log(`\n⚠️ All tests used mock responses. To test real VROOM:`, colors.yellow);
    log(`   1. Ensure VROOM binary is compiled in Docker image`, colors.cyan);
    log(`   2. Set up OSRM data: ./docker/osrm/setup-osrm-data.sh`, colors.cyan);
    log(`   3. Rebuild and restart services: docker-compose up --build -d`, colors.cyan);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  runTestScenario,
  checkServices,
  TEST_SCENARIOS
}; 