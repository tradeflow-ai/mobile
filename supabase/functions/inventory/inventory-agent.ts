/**
 * Inventory Agent - Parts Analysis & Hardware Store Job Creation
 * 
 * Single agent that analyzes inventory needs and creates hardware store jobs when needed.
 * Uses the INVENTORY_PROMPT for consistent reasoning.
 */ import { OpenAIClient, createMessages } from '../_shared/openai-client.ts';
import { INVENTORY_PROMPT } from './inventory-prompt.ts';
import { querySupplier, getAvailableSuppliers } from './mock-supplier.ts';
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
  console.log('🔍 createSupabaseClient: Initializing Supabase client...');
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log('🔍 createSupabaseClient: URL found:', !!supabaseUrl);
  console.log('🔍 createSupabaseClient: Service key found:', !!supabaseServiceKey);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ createSupabaseClient: Missing required environment variables');
    throw new Error('Missing required Supabase environment variables');
  }
  
  console.log('🔍 createSupabaseClient: Creating Supabase client...');
  const client = createClient(supabaseUrl, supabaseServiceKey);
  console.log('🔍 createSupabaseClient: Supabase client created successfully');
  
  return client;
}
export class InventoryAgent {
  private openai: OpenAIClient;

  constructor() {
    try {
      console.log('🔍 InventoryAgent: Creating OpenAI client...');
      this.openai = new OpenAIClient();
      console.log('🔍 InventoryAgent: OpenAI client created successfully');
    } catch (error) {
      console.error('❌ InventoryAgent: Failed to create OpenAI client:', error);
      throw error;
    }
  }
  async execute(context: InventoryAgentContext): Promise<InventoryOutput> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 InventoryAgent: Starting execution...');
      
      console.log('🔍 InventoryAgent: Creating Supabase client...');
      const supabase = createSupabaseClient();
      console.log('🔍 InventoryAgent: Supabase client created successfully');

      console.log(`📦 Inventory Agent: Analyzing ${context.jobIds.length} jobs`);

      // Get jobs from dispatch output
      const prioritizedJobs = context.dispatchOutput.prioritized_jobs || [];
      console.log('🔍 InventoryAgent: Prioritized jobs:', prioritizedJobs.length);
      
      // Validate jobIds format
      const validJobIds = context.jobIds.filter(id => {
        // Check if it's a valid UUID format (basic check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return typeof id === 'string' && (uuidRegex.test(id) || id.startsWith('test-'));
      });
      
      console.log(`🔍 InventoryAgent: Valid job IDs: ${validJobIds.length}/${context.jobIds.length}`);
      
      let effectiveJobs = [];
      
      if (validJobIds.length > 0) {
        console.log('🔍 InventoryAgent: Attempting to fetch job details from database...');
        try {
          // Add timeout to the database query
          const queryPromise = supabase
            .from('job_locations')
            .select('*')
            .eq('user_id', context.userId)
            .in('id', validJobIds)
            .limit(20); // Limit to prevent large queries
          
          // Set a 5-second timeout for the database query
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database query timeout')), 5000);
          });
          
          const { data: jobs, error } = await Promise.race([queryPromise, timeoutPromise]);
          
          if (error) {
            console.error('🔍 InventoryAgent: Database error fetching jobs:', error);
            throw error;
          }
          
          effectiveJobs = jobs || [];
          console.log('🔍 InventoryAgent: Jobs fetched from database:', effectiveJobs.length);
          
        } catch (dbError) {
          console.warn('⚠️ Database query failed, using mock data:', dbError.message);
          effectiveJobs = this.createMockJobs(validJobIds);
        }
      }
      
      // If no valid jobs found, create mock data
      if (effectiveJobs.length === 0) {
        console.log('🧪 No real jobs found, using mock data for testing...');
        effectiveJobs = this.createMockJobs(context.jobIds);
        console.log('🔍 InventoryAgent: Created mock jobs:', effectiveJobs.length);
      }

      console.log('🔍 InventoryAgent: Fetching user inventory from database...');
      // Fetch user's inventory items
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', context.userId);

      if (inventoryError) {
        console.error('🔍 InventoryAgent: Error fetching inventory:', inventoryError);
        throw inventoryError;
      }

      console.log('🔍 InventoryAgent: Fetched inventory items:', inventory?.length || 0);

      console.log('🔍 InventoryAgent: Fetching user preferences from database...');
      // Fetch user preferences
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', context.userId)
        .single();

      if (profileError) {
        console.warn('🔍 InventoryAgent: Error fetching preferences, using defaults:', profileError);
      }

      const preferences = profile?.preferences || {};
      console.log('🔍 InventoryAgent: Using preferences:', Object.keys(preferences).length, 'settings');

      console.log('🔍 InventoryAgent: Executing AI inventory analysis...');
      
      // Execute AI-powered inventory analysis with real data
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
      console.error('❌ Inventory agent error message:', error.message);
      console.error('❌ Inventory agent error stack:', error.stack);
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
      console.log('🔍 AI Analysis: Starting AI inventory analysis...');
      
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

      console.log('🔍 AI Analysis: Prepared job data for', jobData.length, 'jobs');

      // Prepare inventory data
      const inventoryData = inventory.map(item => ({
        item_name: item.name, // FIXED: 'name' column, not 'item_name'
        category: item.category,
        quantity_on_hand: item.quantity, // FIXED: 'quantity' column, not 'quantity_on_hand'
        minimum_stock: item.min_quantity, // FIXED: 'min_quantity' column, not 'minimum_stock'
        unit_cost: item.cost_per_unit, // FIXED: 'cost_per_unit' column, not 'unit_cost'
        preferred_supplier: item.supplier // FIXED: 'supplier' column, not 'preferred_supplier'
      }));

      console.log('🔍 AI Analysis: Prepared inventory data for', inventoryData.length, 'items');

      // Format preferences for prompt injection
      const supplierPreferences = {
        primary_supplier: preferences.primary_supplier || 'home_depot',
        secondary_suppliers: preferences.secondary_suppliers || ['lowes'],
        preferred_brands: preferences.preferred_brands || ['standard'],
        quality_preference: preferences.quality_preference || 'standard',
        delivery_preference: preferences.delivery_preference || 'pickup'
      };

      console.log('🔍 AI Analysis: Formatted supplier preferences');

      // Create user prompt with tool information
      console.log('🔍 AI Analysis: Getting available suppliers...');
      const availableSuppliers = getAvailableSuppliers();
      console.log('🔍 AI Analysis: Available suppliers:', availableSuppliers);
      
      const userPrompt = `
        Please analyze the inventory needs for these prioritized jobs:

        JOBS TO ANALYZE:
        ${JSON.stringify(jobData, null, 2)}

        CURRENT INVENTORY:
        ${JSON.stringify(inventoryData, null, 2)}

        PRIORITIZED SCHEDULE:
        ${JSON.stringify(prioritizedJobs, null, 2)}

        USER PREFERENCES:
        ${JSON.stringify(supplierPreferences, null, 2)}

        AVAILABLE SUPPLIERS:
        ${availableSuppliers.join(', ')}

        TOOLS AVAILABLE:
        - querySupplier: Check real-time stock and pricing from suppliers
        - getSupplierInfo: Get supplier store locations and details

        Please provide a comprehensive inventory analysis including:
        1. Parts needed for each job
        2. Current stock assessment
        3. Shopping list for missing items
        4. Supplier recommendations
        5. Whether a hardware store job is needed

        Return the response as a valid JSON object matching the InventoryOutput interface.
      `;

      console.log('🔍 AI Analysis: Created user prompt');

      // Call OpenAI API directly
      console.log('🔍 AI Analysis: Creating messages for OpenAI...');
      const messages = createMessages(
        INVENTORY_PROMPT.replace(/\{([^}]+)\}/g, (match, key) => {
          return supplierPreferences[key as keyof typeof supplierPreferences] || match;
        }),
        userPrompt
      );
      
      console.log('🔍 AI Analysis: Calling OpenAI API...');
      const aiResponse = await this.openai.chatCompletion(messages, {
        model: 'gpt-4o',
        temperature: 0.1,
        maxTokens: 4000
      });

      console.log('🔍 AI Analysis: OpenAI API response received');

      // Parse AI response and create structured output
      console.log('🔍 AI Analysis: Parsing AI response...');
      const parsedResponse = this.parseAIResponse(aiResponse, jobs, inventory, preferences);
      
      console.log('🔍 AI Analysis: Creating hardware store job if needed...');
      // Check if hardware store job is needed and use supplier tool
      const hardwareStoreJob = await this.createHardwareStoreJobIfNeeded(
        parsedResponse.inventory_analysis,
        preferences
      );

      console.log('🔍 AI Analysis: AI inventory analysis completed successfully');

      return {
        ...parsedResponse,
        hardware_store_job: hardwareStoreJob,
        agent_reasoning: aiResponse
      };

    } catch (error) {
      console.error('❌ AI Analysis Error:', error);
      console.error('❌ AI Analysis Error Message:', error.message);
      console.error('❌ AI Analysis Error Stack:', error.stack);
      console.warn('⚠️ AI inventory analysis failed, using fallback:', error);
      return this.fallbackInventoryAnalysis(jobs, inventory, preferences);
    }
  }
  /**
   * Parse AI response into structured format with robust JSON extraction
   */
  private parseAIResponse(aiResponse: string, jobs: any[], inventory: any[], preferences: any): Omit<InventoryOutput, 'execution_time_ms'> {
    console.log('🤖 Raw AI Response Length:', aiResponse.length);
    console.log('🤖 Raw AI Response Preview:', aiResponse.substring(0, 500) + '...');
    
    try {
      // Strategy 1: Try to find JSON within markdown code blocks
      const markdownJsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownJsonMatch) {
        console.log('📋 Found markdown JSON block, attempting to parse...');
        const jsonStr = markdownJsonMatch[1].trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.inventory_analysis) {
          console.log('✅ Successfully parsed markdown JSON');
          return parsed;
        }
      }

      // Strategy 2: Try to find a complete JSON object (more precise regex)
      const jsonObjectMatch = aiResponse.match(/\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}/);
      if (jsonObjectMatch) {
        console.log('📋 Found JSON object, attempting to parse...');
        const jsonStr = jsonObjectMatch[0].trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.inventory_analysis) {
          console.log('✅ Successfully parsed JSON object');
          return parsed;
        }
      }

      // Strategy 3: Try to extract JSON between specific markers
      const betweenBracesMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```|<json>([\s\S]*?)<\/json>|\{[\s\S]*?\}/);
      if (betweenBracesMatch) {
        console.log('📋 Found JSON with markers, attempting to parse...');
        const jsonStr = (betweenBracesMatch[1] || betweenBracesMatch[2] || betweenBracesMatch[0]).trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.inventory_analysis) {
          console.log('✅ Successfully parsed JSON with markers');
          return parsed;
        }
      }

      console.warn('⚠️ All JSON parsing strategies failed, using fallback');
      
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      console.error('❌ Error details:', error.message);
    }

    // Fallback: create structured response from jobs and inventory
    console.log('🔄 Using fallback response generation');
    return this.createFallbackInventoryAnalysis(jobs, inventory, preferences);
  }
  /**
   * Create hardware store job if needed using the supplier tool
   */ async createHardwareStoreJobIfNeeded(inventoryAnalysis, preferences) {
    const shoppingList = inventoryAnalysis.shopping_list || [];
    const criticalItems = shoppingList.filter((item)=>item.priority === 'critical');
    // Only create hardware store job if there are critical items
    if (criticalItems.length === 0) {
      console.log('📦 No critical items needed, skipping hardware store job');
      return null;
    }
    const preferredSupplier = preferences.primary_supplier || 'home_depot';
    // Use the new querySupplier tool to get supplier data
    const supplierResponse = await querySupplier(preferredSupplier, criticalItems.map((item)=>({
        name: item.item_name,
        quantity: item.quantity_to_buy
      })), {
      latitude: 37.7749,
      longitude: -122.4194
    });
    const store = supplierResponse.stores?.[0];
    if (!store) {
      console.warn('No store found for hardware stop');
      return null;
    }
    const totalCost = shoppingList.reduce((sum, item)=>sum + item.estimated_cost, 0);
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
   */ createMockJobs(jobIds) {
    return jobIds.map((id, index)=>({
        id,
        title: `Mock Job ${index + 1}`,
        job_type: [
          'emergency',
          'inspection',
          'service'
        ][index % 3],
        priority: [
          'urgent',
          'high',
          'medium',
          'low'
        ][index % 4],
        description: `Mock job description requiring ${[
          'pipe fittings',
          'electrical outlets',
          'HVAC filters'
        ][index % 3]}`,
        estimated_duration: 60 + index * 30,
        address: `123 Mock St ${index + 1}`,
        customer_name: `Test Customer ${index + 1}`
      }));
  }
  /**
   * Fallback inventory analysis if AI fails
   */ fallbackInventoryAnalysis(jobs, inventory, preferences) {
    // Simple fallback: assume each job needs basic parts
    const partsNeeded = jobs.map((job)=>({
        item_name: `Basic ${job.job_type} parts`,
        quantity: 2,
        category: job.job_type,
        priority: 'important',
        reason: `Standard parts for ${job.job_type} work`,
        job_ids: [
          job.id
        ]
      }));
    const shoppingList = partsNeeded.map((part)=>({
        item_name: part.item_name,
        quantity_to_buy: part.quantity,
        estimated_cost: 25.00,
        preferred_supplier: preferences.primary_supplier || 'home_depot',
        priority: part.priority,
        alternative_suppliers: [
          'lowes'
        ]
      }));
    return {
      inventory_analysis: {
        parts_needed: partsNeeded,
        current_stock: [],
        shopping_list: shoppingList,
        total_shopping_cost: shoppingList.reduce((sum, item)=>sum + item.estimated_cost, 0),
        supplier_breakdown: [
          {
            supplier: preferences.primary_supplier || 'home_depot',
            items: shoppingList.map((item)=>item.item_name),
            estimated_cost: shoppingList.reduce((sum, item)=>sum + item.estimated_cost, 0),
            store_location: 'Primary store location'
          }
        ]
      },
      recommendations: [
        'Fallback inventory analysis applied'
      ],
      agent_reasoning: 'Fallback algorithm used due to AI processing error'
    };
  }
  /**
   * Create fallback inventory analysis structure
   */ createFallbackInventoryAnalysis(jobs, inventory, preferences) {
    const partsNeeded = jobs.flatMap((job)=>[
        {
          item_name: `Standard ${job.job_type} fitting`,
          quantity: 1,
          category: job.job_type,
          priority: 'important',
          reason: `Standard part for ${job.title}`,
          job_ids: [
            job.id
          ]
        }
      ]);
    const shoppingList = partsNeeded.map((part)=>({
        item_name: part.item_name,
        quantity_to_buy: part.quantity,
        estimated_cost: 15.00,
        preferred_supplier: preferences.primary_supplier || 'home_depot',
        priority: part.priority,
        alternative_suppliers: [
          'lowes'
        ]
      }));
    return {
      inventory_analysis: {
        parts_needed: partsNeeded,
        current_stock: inventory.map((item)=>({
            item_name: item.name, // FIXED: 'name' column, not 'item_name'
            quantity_available: item.quantity, // FIXED: 'quantity' column, not 'quantity_on_hand'
            quantity_needed: 1,
            sufficient: item.quantity >= 1 // FIXED: 'quantity' column, not 'quantity_on_hand'
          })),
        shopping_list: shoppingList,
        total_shopping_cost: shoppingList.reduce((sum, item)=>sum + item.estimated_cost, 0),
        supplier_breakdown: [
          {
            supplier: preferences.primary_supplier || 'home_depot',
            items: shoppingList.map((item)=>item.item_name),
            estimated_cost: shoppingList.reduce((sum, item)=>sum + item.estimated_cost, 0),
            store_location: 'Primary store location'
          }
        ]
      },
      recommendations: [
        'AI-assisted inventory analysis with fallback parsing'
      ]
    };
  }
}
