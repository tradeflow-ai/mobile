#!/usr/bin/env node

/**
 * TradeFlow Agent Validation Test
 * Simple test to validate core agent functionality
 */

const https = require('https');
const http = require('http');

// Test configuration
const VROOM_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 10000; // 10 seconds

// Test results tracking
let testResults = {
    vroomHealth: false,
    vroomRouting: false,
    vroomResponseTime: 0,
    errors: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const client = url.startsWith('https') ? https : http;
        
        const req = client.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                resolve({
                    statusCode: res.statusCode,
                    data: data,
                    responseTime: responseTime
                });
            });
        });
        
        req.on('error', reject);
        req.setTimeout(TEST_TIMEOUT, () => {
            req.destroy();
            reject(new Error(`Request timeout after ${TEST_TIMEOUT}ms`));
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Test 1: VROOM Health Check
async function testVroomHealth() {
    console.log('🔍 Testing VROOM health endpoint...');
    
    try {
        const response = await makeRequest(`${VROOM_URL}/health`);
        
        if (response.statusCode === 200) {
            const healthData = JSON.parse(response.data);
            testResults.vroomHealth = healthData.status === 'healthy';
            console.log(`✅ VROOM health check: ${healthData.status}`);
            console.log(`   Response time: ${response.responseTime}ms`);
            console.log(`   Binary available: ${healthData.vroom_available}`);
            console.log(`   OSRM backend: ${healthData.osrm_url}`);
            
            // Store additional info for analysis
            testResults.vroomBinaryAvailable = healthData.vroom_available;
            testResults.osrmUrl = healthData.osrm_url;
            
            return true;
        } else {
            throw new Error(`Health check failed with status ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`❌ VROOM health check failed: ${error.message}`);
        testResults.errors.push(`Health check: ${error.message}`);
        return false;
    }
}

// Test 2: VROOM Routing API
async function testVroomRouting() {
    console.log('🔍 Testing VROOM routing API...');
    
    const routingRequest = {
        jobs: [
            {
                id: 1,
                location: [-122.4194, 37.7749], // San Francisco
                service: 3600 // 1 hour
            },
            {
                id: 2,
                location: [-122.4094, 37.7849], // Nearby location
                service: 1800 // 30 minutes
            }
        ],
        vehicles: [
            {
                id: 1,
                start: [-122.4194, 37.7749],
                end: [-122.4194, 37.7749]
            }
        ]
    };
    
    try {
        const response = await makeRequest(`${VROOM_URL}/vroom`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(routingRequest)
        });
        
        testResults.vroomResponseTime = response.responseTime;
        
        if (response.statusCode === 200) {
            const routingData = JSON.parse(response.data);
            
            // Validate response structure
            if (routingData.code === 0 && routingData.routes && routingData.routes.length > 0) {
                const route = routingData.routes[0];
                const hasSteps = route.steps && route.steps.length > 0;
                const hasValidDuration = route.duration > 0;
                
                testResults.vroomRouting = hasSteps && hasValidDuration;
                
                console.log(`✅ VROOM routing API working`);
                console.log(`   Response time: ${response.responseTime}ms`);
                console.log(`   Route duration: ${route.duration}s`);
                console.log(`   Route distance: ${route.distance}m`);
                console.log(`   Steps: ${route.steps.length}`);
                
                // Check if real VROOM binary was used
                const metadata = routingData.metadata || {};
                const usingRealVROOM = metadata.vroom_binary_used;
                testResults.usingRealVROOM = usingRealVROOM;
                
                console.log(`   Using real VROOM: ${usingRealVROOM ? '✅ Yes' : '⚠️ No (mock)'}`);
                
                if (usingRealVROOM) {
                    console.log(`   OSRM backend: ${metadata.osrm_backend}`);
                    console.log(`   Execution time: ${metadata.execution_time_ms}ms`);
                } else {
                    console.log(`   ⚠️ Using mock response - real VROOM binary not available`);
                }
                
                return true;
            } else {
                throw new Error(`Invalid routing response structure`);
            }
        } else {
            throw new Error(`Routing API failed with status ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`❌ VROOM routing API failed: ${error.message}`);
        testResults.errors.push(`Routing API: ${error.message}`);
        return false;
    }
}

// Test 3: Performance Benchmark
async function testPerformance() {
    console.log('🔍 Testing performance requirements...');
    
    const performanceThresholds = {
        vroomResponse: 2000, // 2 seconds max
        healthCheck: 1000   // 1 second max
    };
    
    const healthTime = await measureHealthCheckTime();
    const routingTime = testResults.vroomResponseTime;
    
    console.log(`📊 Performance Results:`);
    console.log(`   Health check: ${healthTime}ms (threshold: ${performanceThresholds.healthCheck}ms)`);
    console.log(`   Routing API: ${routingTime}ms (threshold: ${performanceThresholds.vroomResponse}ms)`);
    
    const healthPassed = healthTime <= performanceThresholds.healthCheck;
    const routingPassed = routingTime <= performanceThresholds.vroomResponse;
    
    if (healthPassed && routingPassed) {
        console.log(`✅ Performance requirements met`);
        return true;
    } else {
        console.log(`❌ Performance requirements not met`);
        if (!healthPassed) testResults.errors.push(`Health check too slow: ${healthTime}ms`);
        if (!routingPassed) testResults.errors.push(`Routing API too slow: ${routingTime}ms`);
        return false;
    }
}

async function measureHealthCheckTime() {
    try {
        const response = await makeRequest(`${VROOM_URL}/health`);
        return response.responseTime;
    } catch (error) {
        return 999999; // Return very high time if failed
    }
}

// Main test execution
async function runValidationTests() {
    console.log('🚀 Starting TradeFlow Agent Validation Tests\n');
    
    const tests = [
        { name: 'VROOM Health Check', fn: testVroomHealth },
        { name: 'VROOM Routing API', fn: testVroomRouting },
        { name: 'Performance Benchmarks', fn: testPerformance }
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
        console.log(`\n--- ${test.name} ---`);
        try {
            const result = await test.fn();
            if (result) {
                passedTests++;
            }
        } catch (error) {
            console.log(`❌ Test failed with error: ${error.message}`);
            testResults.errors.push(`${test.name}: ${error.message}`);
        }
    }
    
    // Print final results
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📋 VALIDATION TEST SUMMARY`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Tests passed: ${passedTests}/${tests.length}`);
    console.log(`VROOM Engine: ${testResults.vroomHealth ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`Routing API: ${testResults.vroomRouting ? '✅ Working' : '❌ Failed'}`);
    console.log(`Response Time: ${testResults.vroomResponseTime}ms`);
    console.log(`Real VROOM Binary: ${testResults.usingRealVROOM ? '✅ Active' : '⚠️ Using Mock'}`);
    
    if (testResults.errors.length > 0) {
        console.log(`\n❌ Errors encountered:`);
        testResults.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Phase 2 completion analysis
    const phase2Complete = testResults.vroomHealth && testResults.vroomRouting && testResults.usingRealVROOM;
    const overallSuccess = passedTests === tests.length;
    
    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`🚀 Phase 2 Status: ${phase2Complete ? '✅ REAL VROOM ACTIVE' : '⚠️ USING MOCK RESPONSES'}`);
    
    if (!phase2Complete && testResults.vroomHealth && testResults.vroomRouting) {
        console.log(`\n📝 To complete Phase 2 with real VROOM:`);
        console.log(`   1. Set up OSRM data: ./docker/osrm/setup-osrm-data.sh`);
        console.log(`   2. Rebuild VROOM image: docker-compose build vroom`);
        console.log(`   3. Restart services: docker-compose up -d`);
    }
    
    // Return results for potential programmatic use
    return {
        success: overallSuccess,
        results: testResults,
        passedTests: passedTests,
        totalTests: tests.length,
        phase2Complete: phase2Complete
    };
}

// Run the tests if this script is executed directly
if (require.main === module) {
    runValidationTests()
        .then(results => {
            process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
            console.error(`\n💥 Validation test runner failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = runValidationTests; 