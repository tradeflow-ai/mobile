/**
 * VROOM API Server
 * 
 * This is a placeholder Node.js server for the VROOM routing engine.
 * In Phase 2, this will be replaced with a full implementation that
 * integrates VROOM with OSRM for advanced routing capabilities.
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.VROOM_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'vroom',
    timestamp: new Date().toISOString() 
  });
});

// Main VROOM endpoint (placeholder)
app.post('/vroom', (req, res) => {
  console.log('VROOM request received:', req.body);
  
  // TODO: Implement actual VROOM integration in Phase 2
  // This will call the VROOM binary with the request data
  
  // Mock response for Phase 1
  const mockResponse = {
    code: 0,
    summary: {
      cost: 300,
      duration: 18000, // 5 hours in seconds
      distance: 50000, // 50km in meters
    },
    routes: [
      {
        vehicle: 1,
        cost: 300,
        duration: 18000,
        distance: 50000,
        steps: [
          {
            type: 'start',
            location: [0, 0],
            arrival: 0,
            duration: 0,
          },
          {
            type: 'job',
            location: [1, 1],
            arrival: 3600,
            duration: 1800,
          },
          {
            type: 'end',
            location: [0, 0],
            arrival: 18000,
            duration: 0,
          },
        ],
      },
    ],
  };
  
  res.json(mockResponse);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚗 VROOM API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app; 