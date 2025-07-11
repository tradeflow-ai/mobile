/**
 * Inventory Agent - Parts Analysis & Hardware Store Job Creation
 * 
 * Single agent that analyzes inventory needs and creates hardware store jobs when needed.
 * Uses the INVENTORY_PROMPT for consistent reasoning.
 */

import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.5.18";
import { HumanMessage, SystemMessage } from "https://esm.sh/@langchain/core@0.3.62/messages";
import { INVENTORY_PROMPT } from './inventory-prompt.ts';
import { mockSupplierAPI } from './mock-supplier.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface InventoryAgentContext {
  userId: string;
  jobIds: string[];
  dispatchOutput: any;
}

export interface InventoryOutput {
  inventory_analysis: {
    parts_needed: Array<{
      item_name: string;
      quantity: number;
      category: string;
      priority: 'critical' | 'important' | 'optional';
      reason: string;
      job_ids: string[];
    }>;
    current_stock: Array<{
      item_name: string;
      quantity_available: number;
      quantity_needed: number;
      sufficient: boolean;
    }>;
    shopping_list: Array<{
      item_name: string;
      quantity_to_buy: number;
      estimated_cost: number;
      preferred_supplier: string;
      priority: 'critical' | 'important' | 'optional';
      alternative_suppliers: string[];
    }>;
    total_shopping_cost: number;
    supplier_breakdown: Array<{
      supplier: string;
      items: string[];
      estimated_cost: number;
      store_location: string;
    }>;
  };
  hardware_store_job?: {
    id: string;
    title: string;
    job_type: 'hardware_store';
    priority: 'high';
    estimated_duration: number;
    address: string;
    latitude: number;
    longitude: number;
    description: string;
    shopping_list: any[];
    preferred_supplier: string;
    estimated_cost: number;
    scheduling_notes: string;
  };
  agent_reasoning: string;
  execution_time_ms: number;
  recommendations: string[];
}

/**
 * Initialize Supabase client for Edge Function
 */
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export class InventoryAgent {
  private llm: ChatOpenAI;

  constructor() {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.1,
      openAIApiKey: openaiApiKey,
    });
  }

  async execute(context: InventoryAgentContext): Promise<InventoryOutput> {
    const startTime = Date.now();
    
    try {
      const supabase = createSupabaseClient();

      console.log(`📦 Inventory Agent: Analyzing ${context.jobIds.length} jobs`);

      // Get jobs from dispatch output
      const prioritizedJobs = context.dispatchOutput.prioritized_jobs || [];
      
      // Fetch job details
      const { data: jobs, error } = await supabase
        .from('job_locations')
        .select('*')
        .eq('user_id', context.userId)
        .in('id', context.jobIds);

      if (error) throw error;
      
      let effectiveJobs = jobs || [];
      
      // TEMPORARY: If no jobs found, create mock data for testing
      if (effectiveJobs.length === 0) {
        console.log('🧪 No real jobs found, using mock data for testing...');
        effectiveJobs = this.createMockJobs(context.jobIds);
      }

      // Get user inventory
      const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', context.userId);

      // Get user preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', context.userId)
        .single();

      const preferences = profile?.preferences || {};

      // Core inventory analysis with AI reasoning
      const inventoryResult = await this.executeAIInventoryAnalysis(
        effectiveJobs, 
        inventory || [], 
        preferences, 
        prioritizedJobs
      );

      console.log(`✅ Inventory analysis complete in ${Date.now() - startTime}ms`);
      console.log(`🛒 Hardware store job ${inventoryResult.hardware_store_job ? 'created' : 'not needed'}`);
      
      return {
        ...inventoryResult,
        execution_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Inventory agent error:', error);
      throw error;
    }
  }

  /**
   * Execute AI-powered inventory analysis
   */
  private async executeAIInventoryAnalysis(
    jobs: any[], 
    inventory: any[], 
    preferences: any, 
    prioritizedJobs: any[]
  ): Promise<Omit<InventoryOutput, 'execution_time_ms'>> {
    try {
      // Prepare job data for AI analysis
      const jobData = jobs.map(job => ({
        job_id: job.id,
        title: job.title,
        job_type: job.job_type,
        priority: job.priority,
        description: job.description,
        estimated_duration: job.estimated_duration || 60,
        address: job.address,
        customer_name: job.customer_name
      }));

      // Prepare inventory data
      const inventoryData = inventory.map(item => ({
        item_name: item.item_name,
        category: item.category,
        quantity_on_hand: item.quantity_on_hand,
        minimum_stock: item.minimum_stock,
        unit_cost: item.unit_cost,
        preferred_supplier: item.preferred_supplier
      }));

      // Format preferences for prompt injection
      const supplierPreferences = {
        primary_supplier: preferences.primary_supplier || 'home_depot',
        secondary_suppliers: preferences.secondary_suppliers || ['lowes'],
        preferred_brands: preferences.preferred_brands || ['standard'],
        quality_preference: preferences.quality_preference || 'standard',
        delivery_preference: preferences.delivery_preference || 'pickup'
      };

      const messages = [
        new SystemMessage(INVENTORY_PROMPT.replace(/\{([^}]+)\}/g, (match, key) => {
          return supplierPreferences[key as keyof typeof supplierPreferences] || match;
        })),
        new HumanMessage(`
          Please analyze the inventory needs for these prioritized jobs:

          JOBS TO ANALYZE:
          ${JSON.stringify(jobData, null, 2)}

          CURRENT INVENTORY:
          ${JSON.stringify(inventoryData, null, 2)}

          PRIORITIZED SCHEDULE:
          ${JSON.stringify(prioritizedJobs, null, 2)}

          USER PREFERENCES:
          ${JSON.stringify(supplierPreferences, null, 2)}

          Please provide a comprehensive inventory analysis including:
          1. Parts needed for each job
          2. Current stock assessment
          3. Shopping list for missing items
          4. Supplier recommendations
          5. Whether a hardware store job is needed

          Return the response as a valid JSON object matching the InventoryOutput interface.
        `)
      ];

      const response = await this.llm.invoke(messages);
      const aiResponse = response.content as string;

      // Parse AI response and create structured output
      const parsedResponse = this.parseAIResponse(aiResponse, jobs, inventory, preferences);
      
      // Check if hardware store job is needed
      const hardwareStoreJob = await this.createHardwareStoreJobIfNeeded(
        parsedResponse.inventory_analysis,
        preferences
      );

      return {
        ...parsedResponse,
        hardware_store_job: hardwareStoreJob,
        agent_reasoning: aiResponse
      };

    } catch (error) {
      console.warn('⚠️ AI inventory analysis failed, using fallback:', error);
      return this.fallbackInventoryAnalysis(jobs, inventory, preferences);
    }
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(aiResponse: string, jobs: any[], inventory: any[], preferences: any): Pick<InventoryOutput, 'inventory_analysis' | 'recommendations'> {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.inventory_analysis) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to parse AI response as JSON:', error);
    }

    // Fallback: create structured response
    return this.createFallbackInventoryAnalysis(jobs, inventory, preferences);
  }

  /**
   * Create hardware store job if needed
   */
  private async createHardwareStoreJobIfNeeded(
    inventoryAnalysis: any,
    preferences: any
  ): Promise<any> {
    const shoppingList = inventoryAnalysis.shopping_list || [];
    const criticalItems = shoppingList.filter((item: any) => item.priority === 'critical');
    
    // Only create hardware store job if there are critical items
    if (criticalItems.length === 0) {
      console.log('📦 No critical items needed, skipping hardware store job');
      return null;
    }

    const preferredSupplier = preferences.primary_supplier || 'home_depot';
    
    // Get mock supplier data for store location
    const supplierResponse = await mockSupplierAPI.invoke({
      supplier: preferredSupplier,
      items: criticalItems.map((item: any) => ({
        name: item.item_name,
        quantity: item.quantity_to_buy
      })),
      location: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    });

    const store = supplierResponse.stores?.[0];
    if (!store) {
      console.warn('No store found for hardware stop');
      return null;
    }

    const totalCost = shoppingList.reduce((sum: number, item: any) => sum + item.estimated_cost, 0);
    const estimatedDuration = Math.max(30, Math.min(90, criticalItems.length * 15)); // 15 min per critical item

    return {
      id: `hardware_store_${Date.now()}`,
      title: `Hardware Store Stop - ${store.store_name}`,
      job_type: 'hardware_store',
      priority: 'high',
      estimated_duration: estimatedDuration,
      address: `${store.address}, ${store.city}, ${store.state}`,
      latitude: store.coordinates.latitude,
      longitude: store.coordinates.longitude,
      description: `Pick up ${criticalItems.length} critical items needed for today's jobs`,
      shopping_list: shoppingList,
      preferred_supplier: preferredSupplier,
      estimated_cost: totalCost,
      scheduling_notes: `Must be scheduled before service-level jobs. Store hours: ${store.hours.open}-${store.hours.close}`
    };
  }

  /**
   * Create mock jobs for testing
   */
  private createMockJobs(jobIds: string[]) {
    return jobIds.map((id, index) => ({
      id,
      title: `Mock Job ${index + 1}`,
      job_type: ['emergency', 'inspection', 'service'][index % 3],
      priority: ['urgent', 'high', 'medium', 'low'][index % 4],
      description: `Mock job description requiring ${['pipe fittings', 'electrical outlets', 'HVAC filters'][index % 3]}`,
      estimated_duration: 60 + (index * 30),
      address: `123 Mock St ${index + 1}`,
      customer_name: `Test Customer ${index + 1}`
    }));
  }

  /**
   * Fallback inventory analysis if AI fails
   */
  private fallbackInventoryAnalysis(jobs: any[], inventory: any[], preferences: any): Omit<InventoryOutput, 'execution_time_ms'> {
    // Simple fallback: assume each job needs basic parts
    const partsNeeded = jobs.map(job => ({
      item_name: `Basic ${job.job_type} parts`,
      quantity: 2,
      category: job.job_type,
      priority: 'important' as const,
      reason: `Standard parts for ${job.job_type} work`,
      job_ids: [job.id]
    }));

    const shoppingList = partsNeeded.map(part => ({
      item_name: part.item_name,
      quantity_to_buy: part.quantity,
      estimated_cost: 25.00,
      preferred_supplier: preferences.primary_supplier || 'home_depot',
      priority: part.priority,
      alternative_suppliers: ['lowes']
    }));

    return {
      inventory_analysis: {
        parts_needed: partsNeeded,
        current_stock: [],
        shopping_list: shoppingList,
        total_shopping_cost: shoppingList.reduce((sum, item) => sum + item.estimated_cost, 0),
        supplier_breakdown: [{
          supplier: preferences.primary_supplier || 'home_depot',
          items: shoppingList.map(item => item.item_name),
          estimated_cost: shoppingList.reduce((sum, item) => sum + item.estimated_cost, 0),
          store_location: 'Primary store location'
        }]
      },
      recommendations: ['Fallback inventory analysis applied'],
      agent_reasoning: 'Fallback algorithm used due to AI processing error'
    };
  }

  /**
   * Create fallback inventory analysis structure
   */
  private createFallbackInventoryAnalysis(jobs: any[], inventory: any[], preferences: any): Pick<InventoryOutput, 'inventory_analysis' | 'recommendations'> {
    const partsNeeded = jobs.flatMap(job => [
      {
        item_name: `Standard ${job.job_type} fitting`,
        quantity: 1,
        category: job.job_type,
        priority: 'important' as const,
        reason: `Standard part for ${job.title}`,
        job_ids: [job.id]
      }
    ]);

    const shoppingList = partsNeeded.map(part => ({
      item_name: part.item_name,
      quantity_to_buy: part.quantity,
      estimated_cost: 15.00,
      preferred_supplier: preferences.primary_supplier || 'home_depot',
      priority: part.priority,
      alternative_suppliers: ['lowes']
    }));

    return {
      inventory_analysis: {
        parts_needed: partsNeeded,
        current_stock: inventory.map(item => ({
          item_name: item.item_name,
          quantity_available: item.quantity_on_hand,
          quantity_needed: 1,
          sufficient: item.quantity_on_hand >= 1
        })),
        shopping_list: shoppingList,
        total_shopping_cost: shoppingList.reduce((sum, item) => sum + item.estimated_cost, 0),
        supplier_breakdown: [{
          supplier: preferences.primary_supplier || 'home_depot',
          items: shoppingList.map(item => item.item_name),
          estimated_cost: shoppingList.reduce((sum, item) => sum + item.estimated_cost, 0),
          store_location: 'Primary store location'
        }]
      },
      recommendations: ['AI-assisted inventory analysis with fallback parsing']
    };
  }
} 