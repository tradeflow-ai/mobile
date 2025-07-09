/**
 * TradeFlow AI Agent Crew - LangGraph State Machine
 * 
 * This implements the complete daily planning workflow with three specialized agents:
 * 1. Dispatch Strategist - Job prioritization
 * 2. Route Optimizer - Travel route optimization  
 * 3. Inventory Specialist - Parts preparation and shopping lists
 */

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { 
  executeDispatchStrategist, 
  executeRouteOptimizer, 
  executeInventorySpecialist,
  type AgentContext,
  type DispatchOutput,
  type RouteOutput,
  type InventoryOutput 
} from "./agents";
import { DailyPlanService } from "../services/dailyPlanService";

/**
 * Enhanced state definition for the daily planning workflow
 * Includes comprehensive tracking for all workflow aspects
 */
export const DailyPlanningStateAnnotation = Annotation.Root({
  // Core context
  userId: Annotation<string>,
  planId: Annotation<string>,
  jobIds: Annotation<string[]>,
  planDate: Annotation<string>,
  
  // User preferences snapshot
  userPreferences: Annotation<Record<string, any> | null>,
  
  // Job data and priorities
  originalJobs: Annotation<any[] | null>,
  prioritizedJobs: Annotation<any[] | null>,
  
  // Route information
  routeWaypoints: Annotation<any[] | null>,
  routeGeometry: Annotation<string | null>,
  totalDistance: Annotation<number | null>,
  totalTravelTime: Annotation<number | null>,
  
  // Inventory requirements
  partsManifest: Annotation<any[] | null>,
  shoppingList: Annotation<any[] | null>,
  inventoryAlerts: Annotation<any[] | null>,
  
  // Hardware store run job creation
  hardwareStoreRuns: Annotation<any[] | null>,
  createdHardwareJobs: Annotation<string[]>,
  
  // Agent outputs
  dispatchOutput: Annotation<DispatchOutput | null>,
  routeOutput: Annotation<RouteOutput | null>,
  inventoryOutput: Annotation<InventoryOutput | null>,
  
  // Workflow state
  currentStep: Annotation<'dispatch' | 'route' | 'inventory' | 'hardware_store_creation' | 'human_verification' | 'complete'>,
  isComplete: Annotation<boolean>,
  
  // Human-in-the-Loop verification
  awaitingHumanApproval: Annotation<boolean>,
  humanModifications: Annotation<Record<string, any> | null>,
  approvalStep: Annotation<'dispatch_approval' | 'route_approval' | 'inventory_approval' | 'none'>,
  
  // Error handling
  error: Annotation<string | null>,
  retryCount: Annotation<number>,
  lastAttemptTime: Annotation<string | null>,
  
  // Monitoring and logging
  executionStartTime: Annotation<string | null>,
  stepTimings: Annotation<Record<string, number>>,
  agentReasonings: Annotation<Record<string, string>>,
  workflowMetrics: Annotation<Record<string, any>>,
});

/**
 * Type alias for the state
 */
export type DailyPlanningState = typeof DailyPlanningStateAnnotation.State;

/**
 * State validation functions
 */
export class StateValidator {
  /**
   * Validate initial workflow state
   */
  static validateInitialState(state: Partial<DailyPlanningState>): string[] {
    const errors: string[] = [];
    
    if (!state.userId) errors.push('userId is required');
    if (!state.planId) errors.push('planId is required');
    if (!state.jobIds || state.jobIds.length === 0) errors.push('jobIds must contain at least one job');
    if (!state.planDate) errors.push('planDate is required');
    
    return errors;
  }
  
  /**
   * Validate dispatch step prerequisites
   */
  static validateDispatchPrerequisites(state: DailyPlanningState): string[] {
    const errors: string[] = [];
    
    if (!state.originalJobs || state.originalJobs.length === 0) {
      errors.push('originalJobs required for dispatch step');
    }
    if (!state.userPreferences) {
      errors.push('userPreferences required for dispatch step');
    }
    
    return errors;
  }
  
  /**
   * Validate route step prerequisites
   */
  static validateRoutePrerequisites(state: DailyPlanningState): string[] {
    const errors: string[] = [];
    
    if (!state.dispatchOutput) {
      errors.push('dispatchOutput required for route step');
    }
    if (!state.prioritizedJobs || state.prioritizedJobs.length === 0) {
      errors.push('prioritizedJobs required for route step');
    }
    
    return errors;
  }
  
  /**
   * Validate inventory step prerequisites
   */
  static validateInventoryPrerequisites(state: DailyPlanningState): string[] {
    const errors: string[] = [];
    
    if (!state.dispatchOutput) {
      errors.push('dispatchOutput required for inventory step');
    }
    if (!state.routeOutput) {
      errors.push('routeOutput required for inventory step');
    }
    
    return errors;
  }
  
  /**
   * Validate hardware store creation prerequisites
   */
  static validateHardwareStorePrerequisites(state: DailyPlanningState): string[] {
    const errors: string[] = [];
    
    if (!state.inventoryOutput) {
      errors.push('inventoryOutput required for hardware store creation');
    }
    if (!state.shoppingList || state.shoppingList.length === 0) {
      errors.push('shoppingList required for hardware store creation');
    }
    
    return errors;
  }
}

/**
 * Enhanced Dispatch Strategist Node
 * Analyzes and prioritizes jobs for the day with comprehensive state tracking
 */
export async function dispatchNode(state: DailyPlanningState): Promise<Partial<DailyPlanningState>> {
  const stepStartTime = Date.now();
  console.log('🎯 Executing Dispatch Strategist...');
  
  try {
    // Validate prerequisites
    const validationErrors = StateValidator.validateDispatchPrerequisites(state);
    if (validationErrors.length > 0) {
      throw new Error(`Dispatch validation failed: ${validationErrors.join(', ')}`);
    }
    
    const context: AgentContext = {
      userId: state.userId,
      planId: state.planId,
      jobIds: state.jobIds,
      planDate: state.planDate,
      preferences: state.userPreferences
    };

    console.log(`📊 Processing ${state.jobIds.length} jobs for prioritization...`);
    const dispatchOutput = await executeDispatchStrategist(context);
    
    const stepDuration = Date.now() - stepStartTime;
    console.log(`✅ Dispatch complete: ${dispatchOutput.prioritized_jobs.length} jobs prioritized in ${stepDuration}ms`);
    
    // Extract prioritized jobs for state tracking
    const prioritizedJobs = dispatchOutput.prioritized_jobs.map(job => ({
      job_id: job.job_id,
      priority_rank: job.priority_rank,
      estimated_start_time: job.estimated_start_time,
      estimated_end_time: job.estimated_end_time,
      job_type: job.job_type
    }));
    
    return {
      dispatchOutput,
      prioritizedJobs,
      currentStep: 'route',
      stepTimings: {
        ...state.stepTimings,
        dispatch: stepDuration
      },
      agentReasonings: {
        ...state.agentReasonings,
        dispatch: dispatchOutput.agent_reasoning
      },
      lastAttemptTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Dispatch Strategist failed:', error);
    const stepDuration = Date.now() - stepStartTime;
    
    return {
      error: error instanceof Error ? error.message : 'Dispatch failed',
      retryCount: (state.retryCount || 0) + 1,
      lastAttemptTime: new Date().toISOString(),
      stepTimings: {
        ...state.stepTimings,
        dispatch_failed: stepDuration
      }
    };
  }
}

/**
 * Enhanced Route Optimizer Node
 * Calculates optimal travel route for prioritized jobs with advanced constraints
 */
export async function routeNode(state: DailyPlanningState): Promise<Partial<DailyPlanningState>> {
  const stepStartTime = Date.now();
  console.log('🗺️ Executing Route Optimizer...');
  
  try {
    // Validate prerequisites
    const validationErrors = StateValidator.validateRoutePrerequisites(state);
    if (validationErrors.length > 0) {
      throw new Error(`Route validation failed: ${validationErrors.join(', ')}`);
    }
    
    const context: AgentContext = {
      userId: state.userId,
      planId: state.planId,
      jobIds: state.jobIds,
      planDate: state.planDate,
      preferences: state.userPreferences
    };

    console.log(`🚗 Optimizing route for ${state.prioritizedJobs?.length || 0} jobs...`);
    const routeOutput = await executeRouteOptimizer(context, state.dispatchOutput!);
    
    const stepDuration = Date.now() - stepStartTime;
    console.log(`✅ Route optimization complete: ${routeOutput.optimized_route.waypoints.length} waypoints, ${routeOutput.optimized_route.total_distance}km in ${stepDuration}ms`);
    
    // Extract route information for state tracking
    const routeWaypoints = routeOutput.optimized_route.waypoints;
    const routeGeometry = routeOutput.optimized_route.route_geometry;
    const totalDistance = routeOutput.optimized_route.total_distance;
    const totalTravelTime = routeOutput.optimized_route.total_travel_time;
    
    return {
      routeOutput,
      routeWaypoints,
      routeGeometry,
      totalDistance,
      totalTravelTime,
      currentStep: 'inventory',
      stepTimings: {
        ...state.stepTimings,
        route: stepDuration
      },
      agentReasonings: {
        ...state.agentReasonings,
        route: routeOutput.agent_reasoning
      },
      lastAttemptTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Route Optimizer failed:', error);
    const stepDuration = Date.now() - stepStartTime;
    
    return {
      error: error instanceof Error ? error.message : 'Route optimization failed',
      retryCount: (state.retryCount || 0) + 1,
      lastAttemptTime: new Date().toISOString(),
      stepTimings: {
        ...state.stepTimings,
        route_failed: stepDuration
      }
    };
  }
}

/**
 * Enhanced Inventory Specialist Node
 * Analyzes parts needs and generates shopping lists with hardware store integration
 */
export async function inventoryNode(state: DailyPlanningState): Promise<Partial<DailyPlanningState>> {
  const stepStartTime = Date.now();
  console.log('📦 Executing Inventory Specialist...');
  
  try {
    // Validate prerequisites
    const validationErrors = StateValidator.validateInventoryPrerequisites(state);
    if (validationErrors.length > 0) {
      throw new Error(`Inventory validation failed: ${validationErrors.join(', ')}`);
    }
    
    const context: AgentContext = {
      userId: state.userId,
      planId: state.planId,
      jobIds: state.jobIds,
      planDate: state.planDate,
      preferences: state.userPreferences
    };

    console.log(`📋 Analyzing inventory for ${state.prioritizedJobs?.length || 0} jobs...`);
    const inventoryOutput = await executeInventorySpecialist(context, state.dispatchOutput!);
    
    const stepDuration = Date.now() - stepStartTime;
    console.log(`✅ Inventory analysis complete: ${inventoryOutput.shopping_list.length} items to shop for in ${stepDuration}ms`);
    
    // Extract inventory information for state tracking
    const partsManifest = inventoryOutput.parts_manifest;
    const shoppingList = inventoryOutput.shopping_list;
    const inventoryAlerts = inventoryOutput.inventory_alerts;
    const hardwareStoreRuns = inventoryOutput.hardware_store_run ? [inventoryOutput.hardware_store_run] : [];
    const createdHardwareJobs = inventoryOutput.created_hardware_store_jobs || [];
    
    // Determine next step based on whether hardware store jobs were created
    const nextStep = createdHardwareJobs.length > 0 ? 'hardware_store_creation' : 'complete';
    
    return {
      inventoryOutput,
      partsManifest,
      shoppingList,
      inventoryAlerts,
      hardwareStoreRuns,
      createdHardwareJobs,
      currentStep: nextStep,
      isComplete: nextStep === 'complete',
      stepTimings: {
        ...state.stepTimings,
        inventory: stepDuration
      },
      agentReasonings: {
        ...state.agentReasonings,
        inventory: inventoryOutput.agent_reasoning
      },
      lastAttemptTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Inventory Specialist failed:', error);
    const stepDuration = Date.now() - stepStartTime;
    
    return {
      error: error instanceof Error ? error.message : 'Inventory analysis failed',
      retryCount: (state.retryCount || 0) + 1,
      lastAttemptTime: new Date().toISOString(),
      stepTimings: {
        ...state.stepTimings,
        inventory_failed: stepDuration
      }
    };
  }
}

/**
 * CRITICAL: Hardware Store Run Job Creation Node
 * Creates routable "Hardware Store Run" jobs when inventory check results in shopping list
 * Ensures jobs include store locations and optimized shopping route
 */
export async function hardwareStoreCreationNode(state: DailyPlanningState): Promise<Partial<DailyPlanningState>> {
  const stepStartTime = Date.now();
  console.log('🏪 Creating Hardware Store Run Jobs...');
  
  try {
    // Validate prerequisites
    const validationErrors = StateValidator.validateHardwareStorePrerequisites(state);
    if (validationErrors.length > 0) {
      throw new Error(`Hardware store creation validation failed: ${validationErrors.join(', ')}`);
    }
    
    if (!state.hardwareStoreRuns || state.hardwareStoreRuns.length === 0) {
      console.log('📋 No hardware store runs needed, proceeding to completion');
      return {
        currentStep: 'complete',
        isComplete: true
      };
    }
    
    console.log(`🏪 Creating ${state.hardwareStoreRuns.length} hardware store run job(s)...`);
    
    // Create hardware store run jobs in the database
    const storeLocations = state.hardwareStoreRuns.flatMap(run => run.store_locations || []);
    
    if (storeLocations.length > 0) {
      const { data: createdJobIds, error } = await DailyPlanService.createHardwareStoreRunJobs(
        state.userId,
        state.planDate,
        storeLocations
      );
      
      if (error) {
        throw new Error(`Failed to create hardware store jobs: ${error.message || error}`);
      }
      
      console.log(`✅ Created ${createdJobIds?.length || 0} hardware store run jobs`);
      
      // Update the daily plan with created job IDs
      await DailyPlanService.updateDailyPlan({
        id: state.planId,
        created_job_ids: [...(state.createdHardwareJobs || []), ...(createdJobIds || [])]
      });
      
      const stepDuration = Date.now() - stepStartTime;
      
      return {
        createdHardwareJobs: [...(state.createdHardwareJobs || []), ...(createdJobIds || [])],
        currentStep: 'complete',
        isComplete: true,
        stepTimings: {
          ...state.stepTimings,
          hardware_store_creation: stepDuration
        },
        workflowMetrics: {
          ...state.workflowMetrics,
          hardware_store_jobs_created: createdJobIds?.length || 0,
          total_store_locations: storeLocations.length
        },
        lastAttemptTime: new Date().toISOString()
      };
    } else {
      console.log('📋 No store locations found, proceeding to completion');
      return {
        currentStep: 'complete',
        isComplete: true
      };
    }
    
  } catch (error) {
    console.error('❌ Hardware Store Creation failed:', error);
    const stepDuration = Date.now() - stepStartTime;
    
    return {
      error: error instanceof Error ? error.message : 'Hardware store creation failed',
      retryCount: (state.retryCount || 0) + 1,
      lastAttemptTime: new Date().toISOString(),
      stepTimings: {
        ...state.stepTimings,
        hardware_store_creation_failed: stepDuration
      }
    };
  }
}

/**
 * Human-in-the-Loop Verification Node
 * Handles user approval and modifications at each step
 */
export async function humanVerificationNode(state: DailyPlanningState): Promise<Partial<DailyPlanningState>> {
  console.log('👤 Awaiting human verification...');
  
  // This node sets the state to await human approval
  // The UI will subscribe to this state and show appropriate interfaces
  
  return {
    awaitingHumanApproval: true,
    approvalStep: determineApprovalStep(state.currentStep),
    currentStep: 'human_verification'
  };
}

/**
 * Determine which approval step is needed based on current workflow step
 */
function determineApprovalStep(currentStep: string): 'dispatch_approval' | 'route_approval' | 'inventory_approval' | 'none' {
  switch (currentStep) {
    case 'route':
      return 'dispatch_approval';
    case 'inventory':
      return 'route_approval';
    case 'complete':
      return 'inventory_approval';
    default:
      return 'none';
  }
}

/**
 * Enhanced Completion Node
 * Finalizes the daily plan and marks it as approved with comprehensive metrics
 */
export async function completionNode(state: DailyPlanningState): Promise<Partial<DailyPlanningState>> {
  const stepStartTime = Date.now();
  console.log('🎉 Finalizing daily plan...');
  
  try {
    const totalExecutionTime = state.executionStartTime 
      ? Date.now() - new Date(state.executionStartTime).getTime()
      : 0;
    
    // Calculate workflow metrics
    const workflowMetrics = {
      ...state.workflowMetrics,
      total_execution_time_ms: totalExecutionTime,
      total_jobs: state.jobIds.length,
      prioritized_jobs: state.prioritizedJobs?.length || 0,
      hardware_store_jobs: state.createdHardwareJobs?.length || 0,
      total_distance_km: state.totalDistance || 0,
      total_travel_time_min: state.totalTravelTime || 0,
      shopping_items: state.shoppingList?.length || 0,
      inventory_alerts: state.inventoryAlerts?.length || 0,
      completion_timestamp: new Date().toISOString()
    };
    
    // Mark the daily plan as approved and complete
    await DailyPlanService.updateDailyPlan({
      id: state.planId,
      status: 'approved',
      current_step: 'complete',
      completed_at: new Date().toISOString()
    });
    
    const stepDuration = Date.now() - stepStartTime;
    console.log(`✅ Daily plan complete and approved! Total execution: ${totalExecutionTime}ms`);
    
    // Log comprehensive completion summary
    console.log('📊 Workflow Summary:', {
      totalJobs: workflowMetrics.total_jobs,
      prioritizedJobs: workflowMetrics.prioritized_jobs,
      hardwareStoreJobs: workflowMetrics.hardware_store_jobs,
      totalDistance: `${workflowMetrics.total_distance_km}km`,
      totalTravelTime: `${workflowMetrics.total_travel_time_min}min`,
      shoppingItems: workflowMetrics.shopping_items,
      executionTime: `${totalExecutionTime}ms`
    });
    
    return {
      isComplete: true,
      currentStep: 'complete',
      workflowMetrics,
      stepTimings: {
        ...state.stepTimings,
        completion: stepDuration,
        total_workflow: totalExecutionTime
      },
      lastAttemptTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to complete daily plan:', error);
    const stepDuration = Date.now() - stepStartTime;
    
    return {
      error: error instanceof Error ? error.message : 'Failed to complete plan',
      stepTimings: {
        ...state.stepTimings,
        completion_failed: stepDuration
      }
    };
  }
}

/**
 * Error Handler Node
 * Handles agent failures and determines retry strategy
 */
export async function errorNode(state: DailyPlanningState): Promise<Partial<DailyPlanningState>> {
  console.log('⚠️ Handling workflow error...');
  
  const maxRetries = 3;
  const retryCount = state.retryCount || 0;
  
  if (retryCount < maxRetries) {
    console.log(`🔄 Retrying workflow (attempt ${retryCount + 1}/${maxRetries})`);
    
    // Reset error state for retry
    return {
      error: null,
      currentStep: 'dispatch' // Start over from dispatch
    };
  } else {
    console.log('💥 Max retries exceeded, marking plan as failed');
    
    // Mark the daily plan as permanently failed
    await DailyPlanService.markDailyPlanError(state.planId, {
      step: state.currentStep || 'unknown',
      error_message: state.error || 'Unknown error',
      timestamp: new Date().toISOString(),
      retry_suggested: false
    }, retryCount);
    
    return {
      isComplete: true // End the workflow
    };
  }
}

/**
 * Enhanced conditional routing function
 * Determines the next node based on current state with support for HITL and hardware store creation
 */
export function routeWorkflow(state: DailyPlanningState): string {
  // If there's an error, handle it
  if (state.error) {
    return 'error_handler';
  }
  
  // If workflow is complete, end
  if (state.isComplete) {
    return END;
  }
  
  // If awaiting human approval, stay in verification
  if (state.awaitingHumanApproval) {
    return 'human_verification';
  }
  
  // Route based on current step
  switch (state.currentStep) {
    case 'dispatch':
      return 'dispatch';
    case 'route':
      return 'route';
    case 'inventory':
      return 'inventory';
    case 'hardware_store_creation':
      return 'hardware_store_creation';
    case 'human_verification':
      return 'human_verification';
    case 'complete':
      return 'completion';
    default:
      return 'dispatch'; // Default to start
  }
}

/**
 * Enhanced monitoring and logging utilities
 */
export class WorkflowMonitor {
  /**
   * Log workflow step completion
   */
  static logStepCompletion(step: string, duration: number, details: any = {}) {
    console.log(`✅ ${step} completed in ${duration}ms`, details);
  }
  
  /**
   * Log workflow error
   */
  static logStepError(step: string, error: any, duration: number) {
    console.error(`❌ ${step} failed after ${duration}ms:`, error);
  }
  
  /**
   * Calculate workflow efficiency metrics
   */
  static calculateEfficiencyMetrics(state: DailyPlanningState) {
    const totalJobs = state.jobIds.length;
    const prioritizedJobs = state.prioritizedJobs?.length || 0;
    const hardwareJobs = state.createdHardwareJobs?.length || 0;
    const totalDistance = state.totalDistance || 0;
    const totalTime = state.totalTravelTime || 0;
    
    return {
      job_processing_rate: prioritizedJobs / totalJobs,
      jobs_per_km: totalJobs / Math.max(totalDistance, 1),
      time_efficiency: totalJobs / Math.max(totalTime, 1),
      hardware_store_efficiency: hardwareJobs > 0 ? hardwareJobs / totalJobs : 0,
      total_jobs_managed: totalJobs + hardwareJobs
    };
  }
}

/**
 * Create and configure the enhanced LangGraph state machine
 * Includes hardware store creation and HITL verification support
 */
export function createDailyPlanningGraph() {
  console.log('🏗️ Building enhanced LangGraph state machine...');
  
  const workflow = new StateGraph(DailyPlanningStateAnnotation)
    // Add all agent nodes
    .addNode("dispatch", dispatchNode)
    .addNode("route", routeNode)
    .addNode("inventory", inventoryNode)
    .addNode("hardware_store_creation", hardwareStoreCreationNode)
    .addNode("human_verification", humanVerificationNode)
    .addNode("completion", completionNode)
    .addNode("error_handler", errorNode)
    
    // Set entry point
    .addEdge(START, "dispatch")
    
    // Add comprehensive conditional routing from each node
    .addConditionalEdges(
      "dispatch",
      routeWorkflow,
      {
        "route": "route",
        "human_verification": "human_verification",
        "error_handler": "error_handler",
        [END]: END
      }
    )
    .addConditionalEdges(
      "route",
      routeWorkflow,
      {
        "inventory": "inventory",
        "human_verification": "human_verification",
        "error_handler": "error_handler",
        [END]: END
      }
    )
    .addConditionalEdges(
      "inventory",
      routeWorkflow,
      {
        "hardware_store_creation": "hardware_store_creation",
        "completion": "completion",
        "human_verification": "human_verification",
        "error_handler": "error_handler",
        [END]: END
      }
    )
    .addConditionalEdges(
      "hardware_store_creation",
      routeWorkflow,
      {
        "completion": "completion",
        "human_verification": "human_verification",
        "error_handler": "error_handler",
        [END]: END
      }
    )
    .addConditionalEdges(
      "human_verification",
      routeWorkflow,
      {
        "dispatch": "dispatch",
        "route": "route",
        "inventory": "inventory",
        "completion": "completion",
        "error_handler": "error_handler",
        [END]: END
      }
    )
    .addConditionalEdges(
      "completion",
      routeWorkflow,
      {
        [END]: END
      }
    )
    .addConditionalEdges(
      "error_handler",
      routeWorkflow,
      {
        "dispatch": "dispatch",
        [END]: END
      }
    );

  console.log('✅ Enhanced LangGraph state machine compiled successfully');
  return workflow.compile();
}

/**
 * Execute the complete enhanced daily planning workflow
 * Includes comprehensive state initialization and user preferences integration
 */
export async function executeDailyPlanningWorkflow(input: {
  userId: string;
  jobIds: string[];
  planDate: string;
  userPreferences?: Record<string, any>;
}): Promise<DailyPlanningState> {
  const executionStartTime = Date.now();
  console.log('🚀 Starting enhanced daily planning workflow...');
  console.log(`📊 Input: ${input.jobIds.length} jobs for ${input.planDate}`);
  
  try {
    // Get user preferences if not provided
    let preferences = input.userPreferences;
    if (!preferences) {
      const { data: preferencesData } = await import('../services/preferencesService')
        .then(mod => mod.PreferencesService.getUserPreferences(input.userId));
      preferences = preferencesData || {};
    }
    
    // Fetch original jobs data
    const { data: originalJobs } = await import('../services/supabase')
      .then(mod => mod.supabase
        .from('job_locations')
        .select('*')
        .eq('user_id', input.userId)
        .in('id', input.jobIds)
      );
    
    // Create a new daily plan record with preferences snapshot
    const { data: dailyPlan, error } = await DailyPlanService.createDailyPlan({
      user_id: input.userId,
      planned_date: input.planDate,
      job_ids: input.jobIds,
      preferences_snapshot: preferences
    });
    
    if (error || !dailyPlan) {
      throw new Error('Failed to create daily plan record');
    }
    
    console.log(`📋 Created daily plan: ${dailyPlan.id}`);
    
    // Initialize the comprehensive workflow state
    const initialState: DailyPlanningState = {
      // Core context
      userId: input.userId,
      planId: dailyPlan.id,
      jobIds: input.jobIds,
      planDate: input.planDate,
      
      // User preferences and job data
      userPreferences: preferences,
      originalJobs: originalJobs || [],
      prioritizedJobs: null,
      
      // Route information
      routeWaypoints: null,
      routeGeometry: null,
      totalDistance: null,
      totalTravelTime: null,
      
      // Inventory requirements
      partsManifest: null,
      shoppingList: null,
      inventoryAlerts: null,
      
      // Hardware store run tracking
      hardwareStoreRuns: null,
      createdHardwareJobs: [],
      
      // Agent outputs
      dispatchOutput: null,
      routeOutput: null,
      inventoryOutput: null,
      
      // Workflow state
      currentStep: 'dispatch',
      isComplete: false,
      
      // HITL verification
      awaitingHumanApproval: false,
      humanModifications: null,
      approvalStep: 'none',
      
      // Error handling
      error: null,
      retryCount: 0,
      lastAttemptTime: null,
      
      // Monitoring and logging
      executionStartTime: new Date(executionStartTime).toISOString(),
      stepTimings: {},
      agentReasonings: {},
      workflowMetrics: {
        workflow_start_time: new Date(executionStartTime).toISOString(),
        input_jobs_count: input.jobIds.length
      }
    };
    
    // Validate initial state
    const validationErrors = StateValidator.validateInitialState(initialState);
    if (validationErrors.length > 0) {
      throw new Error(`Initial state validation failed: ${validationErrors.join(', ')}`);
    }
    
    console.log('✅ Initial state validated, starting workflow execution...');
    
    // Create and execute the enhanced graph
    const graph = createDailyPlanningGraph();
    const result = await graph.invoke(initialState);
    
    const totalExecutionTime = Date.now() - executionStartTime;
    console.log(`🎯 Enhanced daily planning workflow completed in ${totalExecutionTime}ms`);
    
    // Log final workflow metrics
    const finalMetrics = WorkflowMonitor.calculateEfficiencyMetrics(result);
    console.log('📈 Final workflow metrics:', finalMetrics);
    
    return result;
    
  } catch (error) {
    const totalExecutionTime = Date.now() - executionStartTime;
    console.error(`💥 Daily planning workflow failed after ${totalExecutionTime}ms:`, error);
    throw error;
  }
}

// Export the main graph creation function for backwards compatibility
export { createDailyPlanningGraph as createAgentGraph }; 