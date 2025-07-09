/**
 * TradeFlow AI Agent Crew
 * 
 * This module exports the specialized agents for the TradeFlow daily planning workflow.
 * Each agent handles a specific aspect of the planning process with expert domain knowledge.
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DISPATCHER_PROMPT } from '../prompts/dispatcher';
import { ROUTER_PROMPT } from '../prompts/router';
import { INVENTORY_PROMPT } from '../prompts/inventory';
import { PreferencesService } from '../../services/preferencesService';
import { DailyPlanService } from '../../services/dailyPlanService';
import { routingTool } from '../tools/routing';
import { mockSupplierAPI } from '../tools/mockSupplier';
import { supabase } from '../../services/supabase';

// Agent state interfaces
export interface AgentContext {
  userId: string;
  planId: string;
  jobIds: string[];
  planDate: string;
  preferences?: Record<string, any>;
}

export interface DispatchOutput {
  prioritized_jobs: Array<{
    job_id: string;
    priority_rank: number;
    estimated_start_time: string;
    estimated_end_time: string;
    priority_reason: string;
    job_type: 'demand' | 'maintenance' | 'emergency';
    buffer_time_minutes: number;
  }>;
  scheduling_constraints: {
    work_start_time: string;
    work_end_time: string;
    lunch_break_start: string;
    lunch_break_end: string;
    total_work_hours: number;
  };
  recommendations: string[];
  agent_reasoning: string;
  execution_time_ms: number;
}

export interface RouteOutput {
  optimized_route: {
    waypoints: Array<{
      job_id: string;
      sequence_number: number;
      coordinates: { latitude: number; longitude: number };
      arrival_time: string;
      departure_time: string;
      duration_at_location: number;
      travel_time_to_next: number;
      distance_to_next: number;
    }>;
    route_geometry: string;
    total_distance: number;
    total_travel_time: number;
    total_work_time: number;
  };
  alternative_routes?: Array<{
    route_id: string;
    total_distance: number;
    total_time: number;
    route_geometry: string;
  }>;
  agent_reasoning: string;
  execution_time_ms: number;
}

export interface InventoryOutput {
  parts_manifest: Array<{
    job_id: string;
    required_parts: Array<{
      inventory_item_id: string;
      item_name: string;
      quantity_needed: number;
      quantity_available: number;
      unit: string;
      category: string;
    }>;
  }>;
  shopping_list: Array<{
    item_name: string;
    quantity_needed: number;
    unit: string;
    category: string;
    preferred_supplier: string;
    estimated_cost: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  hardware_store_run?: {
    store_locations: Array<{
      store_name: string;
      address: string;
      coordinates: { latitude: number; longitude: number };
      estimated_visit_time: number;
      items_available: string[];
    }>;
    total_estimated_cost: number;
    estimated_shopping_time: number;
  };
  created_hardware_store_jobs: string[];
  inventory_alerts: Array<{
    item_name: string;
    alert_type: 'low_stock' | 'out_of_stock' | 'reorder_needed';
    message: string;
  }>;
  agent_reasoning: string;
  execution_time_ms: number;
}

/**
 * Dispatch Strategist Agent
 * Analyzes all pending jobs and prioritizes them based on urgency and user-defined rules
 */
export class DispatchStrategistAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.1,
    });
  }

  async execute(context: AgentContext): Promise<DispatchOutput> {
    const startTime = Date.now();
    
    try {
      // Update daily plan status
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        current_step: 'dispatch'
      });

      // Get user preferences and format for prompt
      const { data: preferences } = await PreferencesService.getUserPreferences(context.userId);
      const formattedPrefs = PreferencesService.formatDispatcherPreferences(preferences!);
      const injectedPrompt = PreferencesService.injectPreferencesIntoPrompt(DISPATCHER_PROMPT, formattedPrefs);

      // Fetch jobs for the day
      const { data: jobs } = await supabase
        .from('job_locations')
        .select('*')
        .eq('user_id', context.userId)
        .in('id', context.jobIds);

      // Create LLM messages
      const messages = [
        new SystemMessage(injectedPrompt),
        new HumanMessage(`
          Please prioritize the following jobs for ${context.planDate}:
          
          ${JSON.stringify(jobs, null, 2)}
          
          Return a valid JSON response with the prioritized job list and your reasoning.
        `)
      ];

      // Call LLM
      const response = await this.llm.invoke(messages);
      const result = this.parseDispatchResponse(response.content as string, jobs!, startTime);

      // Save dispatch output to daily plan
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        status: 'dispatch_complete',
        dispatch_output: result
      });

      return result;
    } catch (error) {
      console.error('Dispatch agent error:', error);
      
      // Mark plan as errored
      await DailyPlanService.markDailyPlanError(context.planId, {
        step: 'dispatch',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        retry_suggested: true
      });

      throw error;
    }
  }

  private parseDispatchResponse(content: string, jobs: any[], startTime: number): DispatchOutput {
    // Try to extract JSON from the response
    let parsedResponse;
    try {
      // Look for JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      // Fallback: create a basic prioritized list
      parsedResponse = this.createFallbackDispatchOutput(jobs);
    }

    return {
      prioritized_jobs: parsedResponse.prioritized_jobs || this.createBasicPrioritization(jobs),
      scheduling_constraints: parsedResponse.scheduling_constraints || {
        work_start_time: '08:00',
        work_end_time: '17:00',
        lunch_break_start: '12:00',
        lunch_break_end: '13:00',
        total_work_hours: 8
      },
      recommendations: parsedResponse.recommendations || [],
      agent_reasoning: parsedResponse.agent_reasoning || 'Jobs prioritized by urgency and type',
      execution_time_ms: Date.now() - startTime
    };
  }

  private createBasicPrioritization(jobs: any[]) {
    return jobs
      .sort((a, b) => {
        // Sort by priority: urgent > high > medium > low
        const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
      })
      .map((job, index) => ({
        job_id: job.id,
        priority_rank: index + 1,
        estimated_start_time: new Date(Date.now() + index * 2 * 60 * 60 * 1000).toISOString(),
        estimated_end_time: new Date(Date.now() + (index + 1) * 2 * 60 * 60 * 1000).toISOString(),
        priority_reason: `${job.priority} priority ${job.job_type} job`,
        job_type: job.job_type === 'emergency' ? 'demand' : 'maintenance',
        buffer_time_minutes: job.priority === 'urgent' ? 30 : 15
      }));
  }

  private createFallbackDispatchOutput(jobs: any[]): any {
    return {
      prioritized_jobs: this.createBasicPrioritization(jobs),
      scheduling_constraints: {
        work_start_time: '08:00',
        work_end_time: '17:00',
        lunch_break_start: '12:00',
        lunch_break_end: '13:00',
        total_work_hours: 8
      },
      recommendations: ['Jobs prioritized by urgency level'],
      agent_reasoning: 'Applied basic priority sorting by job urgency and type'
    };
  }
}

/**
 * Route Optimizer Agent
 * Calculates the most time and fuel efficient travel route using advanced constraints
 */
export class RouteOptimizerAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.1,
    });
  }

  async execute(context: AgentContext, dispatchOutput: DispatchOutput): Promise<RouteOutput> {
    const startTime = Date.now();
    
    try {
      // Update daily plan status
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        current_step: 'route'
      });

      // Get user preferences and format for prompt
      const { data: preferences } = await PreferencesService.getUserPreferences(context.userId);
      const formattedPrefs = PreferencesService.formatRouterPreferences(preferences!);
      const injectedPrompt = PreferencesService.injectPreferencesIntoPrompt(ROUTER_PROMPT, formattedPrefs);

      // Fetch job details for routing
      const jobIds = dispatchOutput.prioritized_jobs.map(job => job.job_id);
      const { data: jobs } = await supabase
        .from('job_locations')
        .select('*')
        .eq('user_id', context.userId)
        .in('id', jobIds);

      // Prepare routing data
      const routingJobs = jobs!.map((job, index) => ({
        id: job.id,
        location: [job.longitude, job.latitude],
        timeWindow: [
          Math.floor(new Date(dispatchOutput.prioritized_jobs[index].estimated_start_time).getTime() / 1000),
          Math.floor(new Date(dispatchOutput.prioritized_jobs[index].estimated_end_time).getTime() / 1000)
        ],
        service: job.estimated_duration || 60, // minutes
        priority: index + 1
      }));

      // Call routing tool
      const routingResult = await routingTool.invoke({
        jobs: routingJobs,
        vehicle: {
          id: 'main_vehicle',
          start: [-122.4194, 37.7749], // Default San Francisco
          capacity: [preferences!.parts_capacity_weight_lbs]
        },
        options: {
          minimize: 'time',
          traffic: true
        }
      });

      const result = this.parseRouteResponse(routingResult, jobs!, dispatchOutput, startTime);

      // Save route output to daily plan
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        status: 'route_complete',
        route_output: result,
        total_distance: result.optimized_route.total_distance / 1000, // Convert to km
        total_estimated_duration: result.optimized_route.total_travel_time + result.optimized_route.total_work_time
      });

      return result;
    } catch (error) {
      console.error('Route optimizer error:', error);
      
      // Mark plan as errored
      await DailyPlanService.markDailyPlanError(context.planId, {
        step: 'route',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        retry_suggested: true
      });

      throw error;
    }
  }

  private parseRouteResponse(vroomResult: any, jobs: any[], dispatchOutput: DispatchOutput, startTime: number): RouteOutput {
    const route = vroomResult.routes?.[0];
    if (!route) {
      throw new Error('No route returned from VROOM engine');
    }

    const waypoints = route.steps
      .filter((step: any) => step.type === 'job')
      .map((step: any, index: number) => {
        const job = jobs.find(j => j.id === step.job);
        return {
          job_id: step.job,
          sequence_number: index + 1,
          coordinates: {
            latitude: job?.latitude || step.location[1],
            longitude: job?.longitude || step.location[0]
          },
          arrival_time: new Date(step.arrival * 1000).toISOString(),
          departure_time: new Date((step.arrival + step.duration) * 1000).toISOString(),
          duration_at_location: step.duration,
          travel_time_to_next: index < route.steps.length - 2 ? route.steps[index + 1].arrival - (step.arrival + step.duration) : 0,
          distance_to_next: index < route.steps.length - 2 ? 5000 : 0 // Mock distance in meters
        };
      });

    return {
      optimized_route: {
        waypoints,
        route_geometry: route.geometry || `mock_polyline_${waypoints.length}_waypoints`,
        total_distance: vroomResult.summary?.distance || 50000, // meters
        total_travel_time: vroomResult.summary?.duration || 18000, // seconds
        total_work_time: waypoints.reduce((sum, wp) => sum + wp.duration_at_location, 0)
      },
      agent_reasoning: `Optimized route for ${waypoints.length} jobs using VROOM engine with time windows and vehicle constraints`,
      execution_time_ms: Date.now() - startTime
    };
  }
}

/**
 * Inventory & Prep Specialist Agent
 * Ensures full preparation by analyzing inventory needs and generating shopping lists
 */
export class InventorySpecialistAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.1,
    });
  }

  async execute(context: AgentContext, dispatchOutput: DispatchOutput): Promise<InventoryOutput> {
    const startTime = Date.now();
    
    try {
      // Update daily plan status
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        current_step: 'inventory'
      });

      // Get user preferences and format for prompt
      const { data: preferences } = await PreferencesService.getUserPreferences(context.userId);
      const formattedPrefs = PreferencesService.formatInventoryPreferences(preferences!);
      const injectedPrompt = PreferencesService.injectPreferencesIntoPrompt(INVENTORY_PROMPT, formattedPrefs);

      // Fetch jobs and current inventory
      const jobIds = dispatchOutput.prioritized_jobs.map(job => job.job_id);
      const [jobsResult, inventoryResult] = await Promise.all([
        supabase.from('job_locations').select('*').eq('user_id', context.userId).in('id', jobIds),
        supabase.from('inventory_items').select('*').eq('user_id', context.userId)
      ]);

      const jobs = jobsResult.data || [];
      const inventory = inventoryResult.data || [];

      // Analyze inventory needs
      const result = await this.analyzeInventoryNeeds(jobs, inventory, preferences!, injectedPrompt, startTime);

      // Create hardware store jobs if needed
      if (result.hardware_store_run) {
        const { data: createdJobIds } = await DailyPlanService.createHardwareStoreRunJobs(
          context.userId,
          context.planDate,
          result.hardware_store_run.store_locations
        );
        result.created_hardware_store_jobs = createdJobIds || [];
      }

      // Save inventory output to daily plan
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        status: 'inventory_complete',
        current_step: 'complete',
        inventory_output: result,
        created_job_ids: result.created_hardware_store_jobs
      });

      return result;
    } catch (error) {
      console.error('Inventory specialist error:', error);
      
      // Mark plan as errored
      await DailyPlanService.markDailyPlanError(context.planId, {
        step: 'inventory',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        retry_suggested: true
      });

      throw error;
    }
  }

  private async analyzeInventoryNeeds(
    jobs: any[], 
    inventory: any[], 
    preferences: any, 
    prompt: string, 
    startTime: number
  ): Promise<InventoryOutput> {
    // Create parts manifest for each job
    const partsManifest = jobs.map(job => ({
      job_id: job.id,
      required_parts: this.getRequiredPartsForJob(job, preferences, inventory)
    }));

    // Generate shopping list from missing parts
    const shoppingList = this.generateShoppingList(partsManifest, preferences);

    // Check supplier availability using mock API
    let hardwareStoreRun = undefined;
    if (shoppingList.length > 0) {
      try {
        const supplierResponse = await mockSupplierAPI.invoke({
          supplier: preferences.primary_supplier.toLowerCase().replace(/\s+/g, '_'),
          items: shoppingList.map(item => ({
            name: item.item_name,
            category: item.category,
            quantity: item.quantity_needed
          })),
          location: {
            latitude: 37.7749, // Default San Francisco - in real app, use user location
            longitude: -122.4194,
            radius_miles: 15
          }
        });

        if (supplierResponse.success && supplierResponse.stores.length > 0) {
          hardwareStoreRun = this.createHardwareStoreRunFromAPI(supplierResponse, shoppingList);
        } else {
          // Fallback to basic hardware store run
          hardwareStoreRun = this.createHardwareStoreRun(shoppingList, preferences);
        }
      } catch (error) {
        console.warn('Mock supplier API failed, using fallback:', error);
        hardwareStoreRun = this.createHardwareStoreRun(shoppingList, preferences);
      }
    }

    // Generate inventory alerts
    const inventoryAlerts = this.generateInventoryAlerts(inventory, preferences);

    return {
      parts_manifest: partsManifest,
      shopping_list: shoppingList,
      hardware_store_run: hardwareStoreRun,
      created_hardware_store_jobs: [], // Will be populated when jobs are created
      inventory_alerts: inventoryAlerts,
      agent_reasoning: `Analyzed ${jobs.length} jobs and ${inventory.length} inventory items. Generated ${shoppingList.length} items for shopping list.${hardwareStoreRun ? ` Found ${hardwareStoreRun.store_locations.length} nearby stores with items in stock.` : ''}`,
      execution_time_ms: Date.now() - startTime
    };
  }

  private getRequiredPartsForJob(job: any, preferences: any, inventory: any[]): any[] {
    // Mock implementation - in real version, this would analyze job requirements
    const mockParts = [
      { inventory_item_id: 'part-1', item_name: 'Pipe Fitting', quantity_needed: 2, unit: 'each', category: 'plumbing' },
      { inventory_item_id: 'part-2', item_name: 'Pipe Sealant', quantity_needed: 1, unit: 'tube', category: 'plumbing' }
    ];

    return mockParts.map(part => {
      const inventoryItem = inventory.find(item => item.name.toLowerCase().includes(part.item_name.toLowerCase()));
      return {
        ...part,
        quantity_available: inventoryItem?.quantity || 0
      };
    });
  }

  private generateShoppingList(partsManifest: any[], preferences: any): any[] {
    const shoppingItems = new Map();

    partsManifest.forEach(manifest => {
      manifest.required_parts.forEach((part: any) => {
        if (part.quantity_needed > part.quantity_available) {
          const needed = part.quantity_needed - part.quantity_available;
          const existing = shoppingItems.get(part.item_name) || { quantity_needed: 0 };
          shoppingItems.set(part.item_name, {
            item_name: part.item_name,
            quantity_needed: existing.quantity_needed + needed,
            unit: part.unit,
            category: part.category,
            preferred_supplier: preferences.primary_supplier,
            estimated_cost: needed * 15, // Mock cost
            priority: part.category === 'emergency' ? 'high' : 'medium'
          });
        }
      });
    });

    return Array.from(shoppingItems.values());
  }

  private createHardwareStoreRun(shoppingList: any[], preferences: any): any {
    return {
      store_locations: [
        {
          store_name: preferences.primary_supplier,
          address: '123 Hardware Street, San Francisco, CA',
          coordinates: { latitude: 37.7849, longitude: -122.4094 },
          estimated_visit_time: 30,
          items_available: shoppingList.map(item => item.item_name)
        }
      ],
      total_estimated_cost: shoppingList.reduce((sum, item) => sum + item.estimated_cost, 0),
      estimated_shopping_time: 30
    };
  }

  private createHardwareStoreRunFromAPI(supplierResponse: any, shoppingList: any[]): any {
    // Map supplier response to hardware store run format
    const storeLocations = supplierResponse.stores.map((store: any) => {
      const availableItems = supplierResponse.items
        .filter((item: any) => item.in_stock)
        .map((item: any) => item.item_name);

      return {
        store_name: store.store_name,
        address: `${store.address}, ${store.city}, ${store.state} ${store.zip_code}`,
        coordinates: store.coordinates,
        estimated_visit_time: Math.max(20, Math.min(60, availableItems.length * 5)), // 5 min per item, min 20, max 60
        items_available: availableItems
      };
    });

    // Calculate total cost from API response
    const totalCost = supplierResponse.items.reduce((sum: number, item: any) => {
      const shoppingItem = shoppingList.find(si => si.item_name === item.item_name);
      const quantity = shoppingItem?.quantity_needed || 1;
      return sum + (item.price * quantity);
    }, 0);

    return {
      store_locations: storeLocations,
      total_estimated_cost: Math.round(totalCost * 100) / 100,
      estimated_shopping_time: storeLocations.reduce((total: number, store: any) => total + store.estimated_visit_time, 0)
    };
  }

  private generateInventoryAlerts(inventory: any[], preferences: any): any[] {
    const alerts = [];

    inventory.forEach(item => {
      if (item.quantity === 0) {
        alerts.push({
          item_name: item.name,
          alert_type: 'out_of_stock',
          message: `${item.name} is out of stock`
        });
      } else if (item.quantity <= preferences.critical_items_min_stock) {
        alerts.push({
          item_name: item.name,
          alert_type: 'low_stock',
          message: `${item.name} is running low (${item.quantity} remaining)`
        });
      }
    });

    return alerts;
  }
}

// Export agent execution functions for use in LangGraph
export async function executeDispatchStrategist(context: AgentContext): Promise<DispatchOutput> {
  const agent = new DispatchStrategistAgent();
  return await agent.execute(context);
}

export async function executeRouteOptimizer(context: AgentContext, dispatchOutput: DispatchOutput): Promise<RouteOutput> {
  const agent = new RouteOptimizerAgent();
  return await agent.execute(context, dispatchOutput);
}

export async function executeInventorySpecialist(context: AgentContext, dispatchOutput: DispatchOutput): Promise<InventoryOutput> {
  const agent = new InventorySpecialistAgent();
  return await agent.execute(context, dispatchOutput);
} 