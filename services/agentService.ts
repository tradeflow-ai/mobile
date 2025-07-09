/**
 * Agent Service - Backend API Client
 * 
 * This service handles communication with the LangGraph backend service
 * that runs the AI agent workflow. The backend runs in a Docker container
 * to avoid React Native compatibility issues with LangGraph.
 */

export interface PlanDayRequest {
  userId: string;
  jobIds: string[];
  planDate: string;
}

export interface PlanDayResponse {
  success: boolean;
  planId?: string;
  status?: string;
  currentStep?: string;
  error?: string;
}

export class AgentService {
  // Use machine IP for React Native iOS networking (localhost doesn't work in iOS Simulator)
  private static baseUrl = __DEV__ ? 'http://192.168.1.186:3001' : 'http://localhost:3001';
  
  /**
   * Check if the backend service is healthy and available
   */
  static async checkHealth(): Promise<boolean> {
    try {
      console.log('🔍 Checking backend health at:', this.baseUrl);
      
      // Add timeout and better error handling for React Native
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend health check passed:', data);
        return true;
      } else {
        console.log('❌ Backend health check failed - HTTP status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        console.error('🚨 Network connection issue - is the backend running on localhost:3001?');
      } else if (error.name === 'AbortError') {
        console.error('🚨 Request timed out - backend may be slow to respond');
      }
      
      return false;
    }
  }
  
  /**
   * Trigger the daily planning workflow
   * This will start the LangGraph agent crew in the backend
   */
  static async planDay(userId: string, jobIds: string[], planDate: string): Promise<PlanDayResponse> {
    try {
      console.log('🚀 Calling backend to plan day...');
      console.log('📊 Request data:', { userId, jobIds, planDate });
      
      // Add timeout for React Native
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/api/plan-day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          jobIds,
          planDate
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Backend response:', data);
      return data;
    } catch (error) {
      console.error('❌ Agent service error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Return error response in consistent format
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 