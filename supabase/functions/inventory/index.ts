import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { InventoryAgent } from './inventory-agent.ts'
// TODO: Re-add agent learning service when available in edge function context
// import { agentLearningService } from '../../../services/agentLearningService.ts'

interface AnalyzeInventoryRequest {
  userId: string;
  jobIds: string[];
  dispatchOutput: any;
}

interface AnalyzeInventoryResponse {
  success: boolean;
  inventory_output?: any;
  hardware_store_job?: any;
  error?: string;
}

serve(async (req: Request) => {
  try {
    console.log('🔍 Inventory Function: Starting request processing...');
    
    // Handle CORS
    if (req.method === 'OPTIONS') {
      console.log('🔍 Inventory Function: Handling CORS preflight');
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('🔍 Inventory Function: Invalid method:', req.method);
      return new Response('Method not allowed', { status: 405 })
    }

    console.log('🔍 Inventory Function: Parsing request body...');
    // Parse request body
    const { userId, jobIds, dispatchOutput }: AnalyzeInventoryRequest = await req.json()

    console.log('📦 Inventory Edge Function: Analyzing inventory for user:', userId)
    console.log('📊 Request data:', { userId, jobIds: jobIds.length, dispatchJobs: dispatchOutput.prioritized_jobs?.length })

    // Validate input
    if (!userId || !jobIds || !dispatchOutput) {
      console.log('🔍 Inventory Function: Missing required fields');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: userId, jobIds, dispatchOutput'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🔍 Inventory Function: Initializing Supabase client...');
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('🔍 Inventory Function: Missing Supabase environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing Supabase configuration'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get learned examples for adaptive learning
    console.log('🧠 Inventory: Getting learned examples for user:', userId)
    // const learnedExamples = await agentLearningService.getLearnedExamples(userId)
    // console.log('🧠 Inventory: Found', learnedExamples.inventory.length, 'learned examples')

    console.log('🔍 Inventory Function: Creating inventory agent...');
    // Execute inventory agent
    const inventoryAgent = new InventoryAgent()
    
    console.log('🔍 Inventory Function: Executing inventory agent...');
    const inventoryResult = await inventoryAgent.execute({
      userId,
      jobIds,
      dispatchOutput
    }, []) // Pass an empty array as learnedExamples is removed

    console.log('🔍 Inventory Function: Agent execution completed, preparing response...');
    const response: AnalyzeInventoryResponse = {
      success: true,
      inventory_output: inventoryResult,
      hardware_store_job: inventoryResult.hardware_store_job
    }

    console.log('📦 Inventory analysis completed successfully')
    console.log('🛒 Hardware store job needed:', !!inventoryResult.hardware_store_job)
    console.log('🔍 Inventory Function: Returning successful response');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Inventory Edge Function error:', error)
    console.error('❌ Error details:', error.message)
    console.error('❌ Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown inventory error',
        details: error instanceof Error ? error.stack : 'No error details available'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
