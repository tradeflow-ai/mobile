/**
 * VROOM API Server
 * 
 * This Node.js server integrates with the VROOM routing engine binary
 * to provide advanced Vehicle Routing Problem (VRP) solving capabilities
 * with time windows, capacity constraints, and optimization features.
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.VROOM_PORT || 3000;
const VROOM_BIN_PATH = process.env.VROOM_BIN_PATH || '/app/bin/vroom';
const OSRM_URL = process.env.OSRM_URL || 'http://osrm:5000';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large routing requests

// Check if VROOM binary exists
const vroomBinaryExists = fs.existsSync(VROOM_BIN_PATH);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'vroom',
    timestamp: new Date().toISOString(),
    vroom_binary: VROOM_BIN_PATH,
    vroom_available: vroomBinaryExists,
    osrm_url: OSRM_URL
  });
});

/**
 * Main VROOM endpoint
 * Executes the VROOM binary with the provided input data or uses fallback
 */
app.post('/vroom', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🚗 VROOM request received at', new Date().toISOString());
    
    // Validate input
    const validationError = validateVROOMInput(req.body);
    if (validationError) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        message: validationError,
        timestamp: new Date().toISOString()
      });
    }

    let vroomResult;

    if (vroomBinaryExists) {
      // Use real VROOM binary with OSRM backend
      console.log('🔧 Using real VROOM binary with OSRM backend');
      vroomResult = await executeVROOM(req.body);
    } else {
      // Use fallback mock response
      console.log('⚠️ VROOM binary not found, using fallback response');
      vroomResult = createMockResponse(req.body);
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ VROOM execution completed in ${executionTime}ms`);
    
    // Add execution metadata
    vroomResult.metadata = {
      execution_time_ms: executionTime,
      vroom_binary_used: vroomBinaryExists,
      osrm_backend: OSRM_URL,
      timestamp: new Date().toISOString()
    };
    
    res.json(vroomResult);
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ VROOM execution failed after ${executionTime}ms:`, error);
    
    // Try fallback if real VROOM failed
    if (vroomBinaryExists) {
      console.log('🔄 VROOM binary failed, falling back to mock response');
      try {
        const fallbackResult = createMockResponse(req.body);
        fallbackResult.metadata = {
          execution_time_ms: executionTime,
          vroom_binary_used: false,
          fallback_reason: 'VROOM execution failed',
          error_message: error.message,
          timestamp: new Date().toISOString()
        };
        return res.json(fallbackResult);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }
    
    // Return error response
    const errorResponse = {
      error: 'VROOM execution failed',
      message: error.message || 'Unknown error',
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    };
    
    // If it's a validation error, return 400
    if (error.message && error.message.includes('validation')) {
      return res.status(400).json(errorResponse);
    }
    
    // Otherwise return 500
    res.status(500).json(errorResponse);
  }
});

/**
 * Validate VROOM input data
 * @param {Object} inputData - Input data to validate
 * @returns {string|null} Error message or null if valid
 */
function validateVROOMInput(inputData) {
  if (!inputData || typeof inputData !== 'object') {
    return 'Expected JSON object';
  }
  
  if (!inputData.jobs || !Array.isArray(inputData.jobs)) {
    return 'Missing or invalid jobs array';
  }
  
  if (!inputData.vehicles || !Array.isArray(inputData.vehicles)) {
    return 'Missing or invalid vehicles array';
  }
  
  if (inputData.jobs.length === 0) {
    return 'At least one job is required';
  }
  
  if (inputData.vehicles.length === 0) {
    return 'At least one vehicle is required';
  }
  
  // Validate job structure
  for (let i = 0; i < inputData.jobs.length; i++) {
    const job = inputData.jobs[i];
    if (!job.id && job.id !== 0) {
      return `Job ${i} missing id`;
    }
    if (!job.location || !Array.isArray(job.location) || job.location.length !== 2) {
      return `Job ${i} missing or invalid location [lon, lat]`;
    }
  }
  
  // Validate vehicle structure
  for (let i = 0; i < inputData.vehicles.length; i++) {
    const vehicle = inputData.vehicles[i];
    if (!vehicle.id && vehicle.id !== 0) {
      return `Vehicle ${i} missing id`;
    }
    if (vehicle.start && (!Array.isArray(vehicle.start) || vehicle.start.length !== 2)) {
      return `Vehicle ${i} invalid start location [lon, lat]`;
    }
  }
  
  return null; // Valid input
}

/**
 * Execute VROOM binary with input data and OSRM backend
 * @param {Object} inputData - VROOM input JSON
 * @returns {Promise<Object>} VROOM output JSON
 */
function executeVROOM(inputData) {
  return new Promise((resolve, reject) => {
    console.log('🔧 Spawning VROOM process with OSRM backend...');
    
    // Prepare VROOM input with OSRM routing
    const vroomInput = {
      ...inputData,
      // Configure OSRM routing backend
      options: {
        g: true, // Use geometry
        ...inputData.options
      }
    };
    
    // Add OSRM routing configuration if not present
    if (!vroomInput.routing) {
      vroomInput.routing = {
        servers: [
          {
            host: OSRM_URL.replace('http://', '').replace('https://', ''),
            port: 5000
          }
        ]
      };
    }
    
    // Spawn VROOM process with enhanced configuration
    const vroomArgs = [
      '-g', // Enable geometry output
      '-j', // JSON input/output
    ];
    
    const vroom = spawn(VROOM_BIN_PATH, vroomArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        OSRM_URL: OSRM_URL
      }
    });

    let outputData = '';
    let errorData = '';

    // Handle stdout (VROOM results)
    vroom.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    // Handle stderr (VROOM errors/logs)
    vroom.stderr.on('data', (data) => {
      errorData += data.toString();
      console.warn('VROOM stderr:', data.toString().trim());
    });

    // Handle process completion
    vroom.on('close', (code) => {
      console.log(`VROOM process exited with code: ${code}`);
      
      if (code === 0) {
        try {
          // Parse VROOM output
          const result = JSON.parse(outputData);
          console.log('✅ VROOM result parsed successfully');
          console.log(`📊 Solution: ${result.routes?.length || 0} routes, ${result.summary?.distance || 0}m total distance`);
          resolve(result);
        } catch (parseError) {
          console.error('❌ Failed to parse VROOM output:', parseError);
          console.error('Raw output:', outputData.substring(0, 1000) + '...');
          reject(new Error(`Failed to parse VROOM output: ${parseError.message}`));
        }
      } else {
        const errorMessage = errorData || `VROOM process exited with code ${code}`;
        console.error('❌ VROOM execution failed:', errorMessage);
        reject(new Error(`VROOM execution failed: ${errorMessage}`));
      }
    });

    // Handle process errors
    vroom.on('error', (error) => {
      console.error('❌ Failed to start VROOM process:', error);
      reject(new Error(`Failed to start VROOM process: ${error.message}`));
    });

    // Send input data to VROOM
    try {
      const inputJSON = JSON.stringify(vroomInput, null, 0);
      console.log(`📤 Sending input to VROOM: ${inputJSON.length} characters`);
      console.log(`📍 Jobs: ${vroomInput.jobs.length}, Vehicles: ${vroomInput.vehicles.length}`);
      vroom.stdin.write(inputJSON);
      vroom.stdin.end();
    } catch (error) {
      console.error('❌ Failed to send input to VROOM:', error);
      vroom.kill();
      reject(new Error(`Failed to send input to VROOM: ${error.message}`));
    }
  });
}

/**
 * Enhanced fallback mock response when VROOM is unavailable
 * Used for development/testing purposes
 */
function createMockResponse(inputData) {
  console.log('🧪 Using enhanced mock VROOM response');
  
  const jobs = inputData.jobs || [];
  const vehicles = inputData.vehicles || [{ id: 1 }];
  
  // More realistic mock calculation
  const totalJobs = jobs.length;
  const avgServiceTime = 1800; // 30 minutes
  const avgTravelTime = 900; // 15 minutes between jobs
  const avgDistance = 5000; // 5km between jobs
  
  return {
    code: 0,
    summary: {
      cost: totalJobs * (avgServiceTime + avgTravelTime),
      duration: totalJobs * (avgServiceTime + avgTravelTime),
      distance: totalJobs * avgDistance,
      amount: totalJobs,
      service: totalJobs * avgServiceTime,
      waiting_time: 0,
      priority: totalJobs,
      violations: []
    },
    routes: vehicles.map((vehicle, vehicleIndex) => ({
      vehicle: vehicle.id || (vehicleIndex + 1),
      cost: totalJobs * (avgServiceTime + avgTravelTime),
      duration: totalJobs * (avgServiceTime + avgTravelTime),
      distance: totalJobs * avgDistance,
      amount: totalJobs,
      service: totalJobs * avgServiceTime,
      waiting_time: 0,
      priority: totalJobs,
      violations: [],
      geometry: "mock_polyline_geometry_placeholder",
      steps: [
        {
          type: 'start',
          location: vehicle.start || [0, 0],
          arrival: 0,
          duration: 0,
          setup: 0,
          service: 0,
          waiting_time: 0,
          violations: []
        },
        ...jobs.map((job, jobIndex) => ({
          type: 'job',
          job: job.id,
          location: job.location || [jobIndex * 0.01, jobIndex * 0.01],
          arrival: (jobIndex + 1) * (avgServiceTime + avgTravelTime),
          duration: avgServiceTime,
          setup: job.setup || 0,
          service: job.service || avgServiceTime,
          waiting_time: 0,
          violations: []
        })),
        {
          type: 'end',
          location: vehicle.end || vehicle.start || [0, 0],
          arrival: (totalJobs + 1) * (avgServiceTime + avgTravelTime),
          duration: 0,
          setup: 0,
          service: 0,
          waiting_time: 0,
          violations: []
        },
      ],
    })),
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚗 VROOM API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 VROOM binary path: ${VROOM_BIN_PATH}`);
  console.log(`✅ VROOM binary available: ${vroomBinaryExists}`);
  console.log(`🗺️ OSRM backend: ${OSRM_URL}`);
  
  if (!vroomBinaryExists) {
    console.log(`⚠️ VROOM binary not found - using mock responses`);
    console.log(`📝 To enable real routing, rebuild Docker image with VROOM compilation`);
  }
});

module.exports = app; 