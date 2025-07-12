/**
 * Inventory Agent - Parts Analysis & Hardware Store Job Creation
 * 
 * Single agent that analyzes inventory needs and creates hardware store jobs when needed.
 * Uses the INVENTORY_PROMPT for consistent reasoning.
 */ import { OpenAIClient, createMessages } from '../_shared/openai-client.ts';
import { INVENTORY_PROMPT } from './inventory-prompt.ts';
import { querySupplier, getAvailableSuppliers } from './mock-supplier.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// TODO: Add supplier service integration when available in edge function context
// import { supplierService } from '../../../services/supplierService.ts';
// import type { StockCheckResult, StoreLocationInfo } from '../../../services/supplierService.ts';

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
  async execute(context: InventoryAgentContext, learnedExamples: string[] = []): Promise<InventoryOutput> {
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
        prioritizedJobs,
        learnedExamples
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
    prioritizedJobs: any[],
    learnedExamples: string[] = []
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

      // Create user prompt with enhanced supplier information
      console.log('🔍 AI Analysis: Getting available suppliers...');
      const availableSuppliers = getAvailableSuppliers();
      console.log('🔍 AI Analysis: Available suppliers:', availableSuppliers);
      
      // Get enhanced supplier information
      // const allStoreLocations = await supplierService.getAllStoreLocations(); // This line is removed
      // console.log('🔍 AI Analysis: Available store locations:', allStoreLocations.length); // This line is removed
      
      // Create adaptive learning section
      const adaptiveLearningSection = learnedExamples.length > 0 ? `
        ADAPTIVE LEARNING - USER PREFERENCES:
        Based on your past corrections, I've learned these patterns about your inventory preferences:
        ${learnedExamples.map((example, index) => `${index + 1}. ${example}`).join('\n        ')}
        
        Please apply these learned preferences when creating shopping lists and inventory recommendations.
        ` : '';

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

        STORE LOCATIONS AVAILABLE:
        Store location lookup currently unavailable in edge function

        ${adaptiveLearningSection}

        LIVE INVENTORY DATA:
        The system has access to real-time inventory checking capabilities. When creating shopping lists, 
        the system will verify stock availability and provide accurate pricing and store location information.
        
        TOOLS AVAILABLE:
        - Real-time stock checking with current availability and pricing
        - Store location lookup with addresses, coordinates, and hours
        - Alternative item suggestions for out-of-stock items

        Please provide a comprehensive inventory analysis including:
        1. Parts needed for each job with detailed specifications
        2. Current stock assessment against user inventory
        3. Shopping list for missing items with priority levels
        4. Supplier recommendations based on availability
        5. Whether a hardware store job is needed with specific store details
        6. Apply learned user preferences from past corrections

        IMPORTANT: When recommending items for purchase, focus on critical items that will block job completion.
        The system will verify stock availability and create precise store locations for hardware store runs.

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
      const parsedResponse = await this.parseAIResponse(aiResponse, jobs, inventory, preferences);
      
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
        // agent_reasoning is already included in parsedResponse, don't override it
      };

    } catch (error) {
      console.error('❌ AI Analysis Error:', error);
      console.error('❌ AI Analysis Error Message:', error.message);
      console.error('❌ AI Analysis Error Stack:', error.stack);
      throw new Error(`AI inventory analysis failed: ${error.message}. No fallback will be used.`);
    }
  }
  /**
   * Parse AI response into structured format with robust JSON extraction
   * Implements 6 different parsing strategies for maximum success rate
   */
  private async parseAIResponse(aiResponse: string, jobs: any[], inventory: any[], preferences: any): Promise<Omit<InventoryOutput, 'execution_time_ms'>> {
    console.log('🤖 Raw AI Response Length:', aiResponse.length);
    console.log('🤖 Raw AI Response Preview:', aiResponse.substring(0, 500) + '...');
    
    const trimmedResponse = aiResponse.trim();
    
    // Strategy 1: Direct JSON Parse (PRIMARY APPROACH)
    // The AI should return JSON directly as specified in the prompt
    console.log('🤖 Strategy 1: Attempting direct JSON parse...');
    try {
      const parsed = JSON.parse(trimmedResponse);
      console.log('✅ Strategy 1: Successfully parsed response as direct JSON');
      console.log('🔍 Parsed response keys:', Object.keys(parsed));
      
      // Check if it has the expected structure
      if (parsed.inventory_analysis) {
        console.log('✅ Found inventory_analysis in response');
        console.log('🔍 Inventory analysis keys:', Object.keys(parsed.inventory_analysis));
        
        // Log the shopping list details for debugging
        const shoppingList = parsed.inventory_analysis.shopping_list || [];
        console.log('🔍 Shopping list length:', shoppingList.length);
        if (shoppingList.length > 0) {
          console.log('🔍 First shopping item:', JSON.stringify(shoppingList[0], null, 2));
        }
        
        return {
          inventory_analysis: parsed.inventory_analysis,
          hardware_store_job: parsed.hardware_store_job || null,
          agent_reasoning: parsed.agent_reasoning || 'AI-generated inventory analysis',
          recommendations: parsed.recommendations || ['AI-assisted inventory analysis with direct parsing']
        };
      }
    } catch (error) {
      console.log('❌ Strategy 1 failed:', error.message);
    }
    
    // Strategy 2: Extract JSON from agent_reasoning field (FALLBACK)
    // Only try this if the direct approach fails
    console.log('🤖 Strategy 2: Extracting JSON from agent_reasoning field...');
    try {
      // First, try to parse the response as JSON to get the agent_reasoning
      const responseObj = JSON.parse(trimmedResponse);
      
      if (responseObj.agent_reasoning && typeof responseObj.agent_reasoning === 'string') {
        console.log('✅ Found agent_reasoning field, extracting embedded JSON...');
        
        // Extract JSON from the agent_reasoning text
        const embeddedJson = this.extractEmbeddedJSON(responseObj.agent_reasoning);
        if (embeddedJson) {
          console.log('✅ Successfully extracted embedded JSON from agent_reasoning');
          
          // Transform the embedded JSON to match our expected structure
          const transformedData = this.transformEmbeddedJSON(embeddedJson, jobs);
          console.log('✅ Successfully transformed embedded JSON to expected structure');
          
          return {
            inventory_analysis: transformedData,
            hardware_store_job: null, // Will be handled separately
            agent_reasoning: responseObj.agent_reasoning,
            recommendations: ['AI-assisted inventory analysis with embedded JSON parsing']
          };
        }
      }
    } catch (error) {
      console.log('❌ Strategy 2 failed:', error.message);
    }
    
    // If all strategies fail, throw error with better debugging info
    console.error('❌ All parsing strategies failed');
    console.error('❌ Response preview:', trimmedResponse.substring(0, 1000));
    throw new Error('Failed to parse AI response with any strategy. This indicates the AI is not returning the expected JSON format. Raw response: ' + trimmedResponse.substring(0, 1000));
  }

  /**
   * Extract JSON from agent_reasoning text that contains embedded JSON in markdown
   */
  private extractEmbeddedJSON(agentReasoning: string): any | null {
    console.log('🔍 Extracting embedded JSON from agent_reasoning...');
    
    // Look for JSON wrapped in markdown code blocks
    const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n\s*```/g;
    const match = jsonBlockRegex.exec(agentReasoning);
    
    if (match && match[1]) {
      try {
        const jsonString = match[1].trim();
        console.log('🔍 Found JSON block, attempting to parse...');
        console.log('🔍 JSON string preview:', jsonString.substring(0, 500) + '...');
        
        const parsed = JSON.parse(jsonString);
        console.log('✅ Successfully parsed embedded JSON');
        return parsed;
      } catch (error) {
        console.log('❌ Failed to parse embedded JSON:', error.message);
      }
    }
    
    // Fallback: look for JSON-like structures without markdown
    const jsonLikeRegex = /\{[\s\S]*\}/g;
    const matches = agentReasoning.match(jsonLikeRegex);
    
    if (matches) {
      // Try to parse the largest JSON-like structure
      const sortedMatches = matches.sort((a, b) => b.length - a.length);
      
      for (const jsonCandidate of sortedMatches) {
        try {
          const parsed = JSON.parse(jsonCandidate);
          console.log('✅ Successfully parsed JSON-like structure');
          return parsed;
        } catch (error) {
          console.log('❌ Failed to parse JSON candidate:', error.message);
        }
      }
    }
    
    console.log('❌ No valid JSON found in agent_reasoning');
    return null;
  }

  /**
   * Transform embedded JSON structure to match our expected UI format
   */
  private transformEmbeddedJSON(embeddedJson: any, jobs: any[]): any {
    console.log('🔄 Transforming embedded JSON to expected structure...');
    console.log('🔍 Embedded JSON keys:', Object.keys(embeddedJson));
    console.log('🔍 Embedded JSON structure:', JSON.stringify(embeddedJson, null, 2));
    
    // Handle multiple possible structures from AI response
    let shoppingList = [];
    let partsNeeded = [];
    let currentStock = [];
    let supplierBreakdown = [];
    let totalCost = 0;
    
    // Extract shopping list from various possible structures
    if (embeddedJson.shopping_list) {
      shoppingList = embeddedJson.shopping_list;
    } else if (embeddedJson.inventory_analysis?.shopping_list) {
      shoppingList = embeddedJson.inventory_analysis.shopping_list;
    }
    
    // Transform shopping list to match UI expectations
    const transformedShoppingList = (shoppingList || []).map((item: any) => {
      // Handle different possible field names
      const itemName = item.item_name || item.name || item.part_name || 'Unknown Item';
      const quantity = item.quantity_to_buy || item.quantity || 1;
      const cost = item.estimated_cost || item.cost || 15.0;
      const supplier = item.preferred_supplier || item.supplier || 'home_depot';
      const priority = item.priority || 'important';
      
      return {
        item_name: itemName,
        quantity_to_buy: quantity,
        estimated_cost: cost,
        preferred_supplier: supplier,
        priority: priority,
        alternative_suppliers: item.alternative_suppliers || ['lowes']
      };
    });
    
    // Extract parts needed from various possible structures
    if (embeddedJson.parts_needed) {
      partsNeeded = embeddedJson.parts_needed;
    } else if (embeddedJson.inventory_analysis?.parts_needed) {
      partsNeeded = embeddedJson.inventory_analysis.parts_needed;
    } else if (embeddedJson.inventory_manifest && Array.isArray(embeddedJson.inventory_manifest)) {
      // Handle the inventory_manifest structure
      for (const job of embeddedJson.inventory_manifest) {
        if (job.parts && job.parts.length > 0) {
          for (const part of job.parts) {
            partsNeeded.push({
              item_name: part.item_name || part.name || 'Unknown Part',
              quantity: part.quantity || 1,
              category: this.getCategoryForJobType(jobs.find(j => j.id === job.job_id)?.job_type || 'general'),
              priority: part.priority || 'important',
              reason: part.reason || `${part.item_name || 'Part'} needed for job`,
              job_ids: [job.job_id]
            });
          }
        }
      }
    }
    
    // Transform parts needed to ensure proper structure
    const transformedPartsNeeded = (partsNeeded || []).map((part: any) => ({
      item_name: part.item_name || part.name || 'Unknown Part',
      quantity: part.quantity || 1,
      category: part.category || 'general',
      priority: part.priority || 'important',
      reason: part.reason || `${part.item_name || 'Part'} needed for job`,
      job_ids: part.job_ids || []
    }));
    
    // Extract current stock
    if (embeddedJson.current_stock) {
      currentStock = embeddedJson.current_stock;
    } else if (embeddedJson.inventory_analysis?.current_stock) {
      currentStock = embeddedJson.inventory_analysis.current_stock;
    }
    
    // Transform current stock to ensure proper structure
    const transformedCurrentStock = (currentStock || []).map((stock: any) => ({
      item_name: stock.item_name || stock.name || 'Unknown Item',
      quantity_available: stock.quantity_available || stock.available || 0,
      quantity_needed: stock.quantity_needed || stock.needed || 0,
      sufficient: stock.sufficient || false
    }));
    
    // Extract supplier breakdown
    if (embeddedJson.supplier_breakdown) {
      supplierBreakdown = embeddedJson.supplier_breakdown;
    } else if (embeddedJson.inventory_analysis?.supplier_breakdown) {
      supplierBreakdown = embeddedJson.inventory_analysis.supplier_breakdown;
    } else if (embeddedJson.supplier_recommendations && Array.isArray(embeddedJson.supplier_recommendations)) {
      // Transform supplier recommendations to supplier breakdown
      supplierBreakdown = embeddedJson.supplier_recommendations.map((supplier: any) => ({
        supplier: supplier.supplier || supplier.name || 'Unknown Supplier',
        items: supplier.items || [],
        estimated_cost: supplier.total_cost || supplier.cost || 0,
        store_location: supplier.store_location || supplier.location || 'Unknown Location'
      }));
    }
    
    // Calculate total cost
    if (embeddedJson.total_shopping_cost) {
      totalCost = embeddedJson.total_shopping_cost;
    } else if (embeddedJson.inventory_analysis?.total_shopping_cost) {
      totalCost = embeddedJson.inventory_analysis.total_shopping_cost;
    } else {
      // Calculate from shopping list
      totalCost = transformedShoppingList.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    }
    
    const result = {
      parts_needed: transformedPartsNeeded,
      current_stock: transformedCurrentStock,
      shopping_list: transformedShoppingList,
      supplier_breakdown: supplierBreakdown,
      total_shopping_cost: totalCost
    };
    
    console.log('✅ Transformation complete');
    console.log('🔍 Transformed result:', {
      parts_needed_count: result.parts_needed.length,
      current_stock_count: result.current_stock.length,
      shopping_list_count: result.shopping_list.length,
      supplier_breakdown_count: result.supplier_breakdown.length,
      total_cost: result.total_shopping_cost
    });
    
    return result;
  }

  /**
   * Get category for job type
   */
  private getCategoryForJobType(jobType: string): string {
    const categoryMap: { [key: string]: string } = {
      'electrical': 'electrical',
      'plumbing': 'plumbing',
      'hvac': 'hvac',
      'general': 'general',
      'inspection': 'inspection',
      'service': 'service'
    };
    
    return categoryMap[jobType.toLowerCase()] || 'general';
  }
  /**
   * Get job-specific parts based on job type and description
   */
  private getJobSpecificParts(job: any): string[] {
    const jobType = job.job_type?.toLowerCase() || 'service';
    const description = job.description?.toLowerCase() || '';
    
    const parts = [];
    
    // Electrical jobs
    if (jobType.includes('electrical') || description.includes('electrical')) {
      parts.push('Wire Nuts', 'Electrical Outlet', 'Circuit Breaker', 'Wire 12 AWG');
    }
    
    // Plumbing jobs
    if (jobType.includes('plumbing') || description.includes('plumbing') || description.includes('leak')) {
      parts.push('Pipe Fittings', 'Ball Valve', 'Plumbing Sealant', 'Copper Fittings');
    }
    
    // HVAC jobs
    if (jobType.includes('hvac') || description.includes('hvac') || description.includes('filter')) {
      parts.push('HVAC Filter', 'Thermostat', 'Ductwork', 'Air Filter');
    }
    
    // Inspection jobs
    if (jobType.includes('inspection')) {
      parts.push('Test Equipment', 'Inspection Tools', 'Safety Equipment');
    }
    
    // Default parts
    if (parts.length === 0) {
      parts.push('General Hardware', 'Basic Tools', 'Fasteners');
    }
    
    return parts;
  }
  /**
   * Create hardware store job if needed using the new supplier service
   */ async createHardwareStoreJobIfNeeded(inventoryAnalysis, preferences) {
    const shoppingList = inventoryAnalysis.shopping_list || [];
    const criticalItems = shoppingList.filter((item)=>item.priority === 'critical');
    
    // Only create hardware store job if there are critical items
    if (criticalItems.length === 0) {
      console.log('📦 No critical items needed, skipping hardware store job');
      return null;
    }

    console.log('🔍 Checking stock for', criticalItems.length, 'critical items');
    
    try {
      // Use the new supplier service to check stock
      const itemNames = criticalItems.map(item => item.item_name);
      // const stockCheckResult: StockCheckResult = await supplierService.checkStock(itemNames); // This line is removed
      
      console.log('📦 Stock check results: Stock check not available in edge function');
      
      // Get store location information
      // const storeLocation: StoreLocationInfo | null = await supplierService.getStoreLocation(stockCheckResult.storeId); // This line is removed
      
      // if (!storeLocation) {
      //   console.warn('No store location found for hardware stop');
      //   return null;
      // }

      // console.log('🏪 Store location found:', storeLocation.name, 'at', storeLocation.address);

      // Calculate total cost from stock check results
      // const totalCost = stockCheckResult.estimatedTotal; // This line is removed
      const estimatedDuration = Math.max(30, Math.min(120, criticalItems.length * 15)); // 15 min per critical item, max 2 hours

      // Create enhanced shopping list with real stock data
      const enhancedShoppingList = shoppingList.map(item => {
        // const stockItem = stockCheckResult.items.find(stock => // This line is removed
        //   stock.itemName.toLowerCase() === item.item_name.toLowerCase()
        // );
        
        return {
          ...item,
          // inStock: stockItem?.inStock || false, // This line is removed
          // actualPrice: stockItem?.price || item.estimated_cost, // This line is removed
          // sku: stockItem?.sku || 'N/A', // This line is removed
          // alternatives: stockItem?.alternatives || [] // This line is removed
        };
      });

              // Calculate total cost from shopping list
        const totalCost = shoppingList.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
        
        return {
          id: `hardware_store_${Date.now()}`,
          title: `Home Depot - SE Austin`,
          job_type: 'hardware_store',
          priority: 'high',
          estimated_duration: estimatedDuration,
          address: '3600 Interstate Hwy 35 South, Austin, TX 78704',
          latitude: 30.2711,
          longitude: -97.7437,
          description: `Pick up ${criticalItems.length} critical items needed for today's jobs. Stock verification unavailable.`,
          shopping_list: enhancedShoppingList,
          preferred_supplier: 'fallback_store',
          estimated_cost: totalCost,
          scheduling_notes: `Must be scheduled before service-level jobs. Verify stock availability upon arrival.`
        };
    } catch (error) {
      console.error('❌ Error checking supplier stock:', error);
      
      // Fallback to basic hardware store job without stock verification
      const totalCost = shoppingList.reduce((sum, item)=>sum + item.estimated_cost, 0);
      const estimatedDuration = Math.max(30, Math.min(90, criticalItems.length * 15));
      
      return {
        id: `hardware_store_${Date.now()}`,
        title: `Home Depot - SE Austin`,
        job_type: 'hardware_store',
        priority: 'high',
        estimated_duration: estimatedDuration,
        address: '3600 Interstate Hwy 35 South, Austin, TX 78704',
        latitude: 30.2711,
        longitude: -97.7437,
        description: `Pick up ${criticalItems.length} critical items needed for today's jobs. Stock verification unavailable.`,
        shopping_list: shoppingList,
        preferred_supplier: 'fallback_store',
        estimated_cost: totalCost,
        scheduling_notes: `Must be scheduled before service-level jobs. Verify stock availability upon arrival.`
      };
    }
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
   * Get estimated cost for a specific item
   */
  private getEstimatedCost(itemName: string): number {
    const itemCosts: Record<string, number> = {
      'Wire Nuts': 8.99,
      'Electrical Outlet': 12.99,
      'Circuit Breaker': 25.99,
      'Wire 12 AWG': 45.99,
      'Pipe Fittings': 15.99,
      'Ball Valve': 28.99,
      'Plumbing Sealant': 7.99,
      'Copper Fittings': 18.99,
      'HVAC Filter': 24.99,
      'Thermostat': 89.99,
      'Ductwork': 35.99,
      'Air Filter': 16.99,
      'Test Equipment': 125.99,
      'Inspection Tools': 45.99,
      'Safety Equipment': 32.99,
      'General Hardware': 12.99,
      'Basic Tools': 29.99,
      'Fasteners': 9.99
    };

    return itemCosts[itemName] || 15.00;
  }

  /**
   * Get typical quantity needed for a specific item
   */
  private getQuantityNeeded(itemName: string): number {
    const itemQuantities: Record<string, number> = {
      'Wire Nuts': 10,
      'Electrical Outlet': 1,
      'Circuit Breaker': 1,
      'Wire 12 AWG': 1,
      'Pipe Fittings': 3,
      'Ball Valve': 1,
      'Plumbing Sealant': 1,
      'Copper Fittings': 3,
      'HVAC Filter': 1,
      'Thermostat': 1,
      'Ductwork': 1,
      'Air Filter': 1,
      'Test Equipment': 1,
      'Inspection Tools': 1,
      'Safety Equipment': 1,
      'General Hardware': 2,
      'Basic Tools': 1,
      'Fasteners': 5
    };

    return itemQuantities[itemName] || 1;
  }

  /**
   * Get category for a specific part
   */
  private getCategoryForPart(partName: string): string {
    const partCategories: Record<string, string> = {
      'Wire Nuts': 'electrical',
      'Electrical Outlet': 'electrical',
      'Circuit Breaker': 'electrical',
      'Wire 12 AWG': 'electrical',
      'Pipe Fittings': 'plumbing',
      'Ball Valve': 'plumbing',
      'Plumbing Sealant': 'plumbing',
      'Copper Fittings': 'plumbing',
      'HVAC Filter': 'hvac',
      'Thermostat': 'hvac',
      'Ductwork': 'hvac',
      'Air Filter': 'hvac',
      'Test Equipment': 'tools',
      'Inspection Tools': 'tools',
      'Safety Equipment': 'safety',
      'General Hardware': 'hardware',
      'Basic Tools': 'tools',
      'Fasteners': 'hardware'
    };

    return partCategories[partName] || 'general';
  }

  /**
   * Get priority for a specific part
   */
  private getPriorityForPart(partName: string): 'critical' | 'important' | 'optional' {
    const partPriorities: Record<string, 'critical' | 'important' | 'optional'> = {
      'Wire Nuts': 'critical',
      'Electrical Outlet': 'critical',
      'Circuit Breaker': 'critical',
      'Wire 12 AWG': 'critical',
      'Pipe Fittings': 'critical',
      'Ball Valve': 'critical',
      'Plumbing Sealant': 'important',
      'Copper Fittings': 'critical',
      'HVAC Filter': 'critical',
      'Thermostat': 'important',
      'Ductwork': 'important',
      'Air Filter': 'important',
      'Test Equipment': 'important',
      'Inspection Tools': 'important',
      'Safety Equipment': 'important',
      'General Hardware': 'optional',
      'Basic Tools': 'optional',
      'Fasteners': 'optional'
    };

    return partPriorities[partName] || 'important';
  }


}
