/**
 * TradeFlow LangGraph Backend Service
 * 
 * This Express server runs the LangGraph AI agent workflow that was
 * incompatible with React Native. It exposes HTTP endpoints for the
 * mobile app to trigger agent workflows.
 * 
 * NOTE: VROOM/OSRM routing engine will be implemented separately in Task 7 as a containerized service
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'langgraph-backend',
    timestamp: new Date().toISOString() 
  });
});

// Plan day endpoint - triggers the LangGraph workflow
app.post('/api/plan-day', async (req, res) => {
  try {
    const { userId, jobIds, planDate } = req.body;
    
    console.log('🚀 Starting daily planning workflow...');
    console.log(`📊 Input: ${jobIds.length} jobs for user ${userId} on ${planDate}`);
    
    // TODO: Import and use the actual LangGraph workflow
    // For now, simulate the workflow to test the infrastructure
    const mockResult = {
      planId: `plan-${Date.now()}`,
      currentStep: 'dispatch',
      status: 'pending',
      userId,
      jobIds,
      planDate
    };
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ Daily plan created: ${mockResult.planId}`);
    
    res.json({
      success: true,
      planId: mockResult.planId,
      status: mockResult.status,
      currentStep: mockResult.currentStep
    });
  } catch (error) {
    console.error('❌ Planning workflow failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LangGraph Backend running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Plan Day API: http://localhost:${PORT}/api/plan-day`);
});

export default app;
