import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { InventoryAgent } from './inventory-agent.ts'

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
    // Handle CORS
    if (req.method === 'OPTIONS') {
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
      return new Response('Method not allowed', { status: 405 })
    }

    // Parse request body
    const { userId, jobIds, dispatchOutput }: AnalyzeInventoryRequest = await req.json()

    console.log('📦 Inventory Edge Function: Analyzing inventory for user:', userId)
    console.log('📊 Request data:', { userId, jobIds: jobIds.length, dispatchJobs: dispatchOutput.prioritized_jobs?.length })

    // Validate input
    if (!userId || !jobIds || !dispatchOutput) {
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Execute inventory agent
    const inventoryAgent = new InventoryAgent()
    const inventoryResult = await inventoryAgent.execute({
      userId,
      jobIds,
      dispatchOutput
    })

    const response: AnalyzeInventoryResponse = {
      success: true,
      inventory_output: inventoryResult.inventory_analysis,
      hardware_store_job: inventoryResult.hardware_store_job
    }

    console.log('📦 Inventory analysis completed successfully')
    console.log('🛒 Hardware store job needed:', !!inventoryResult.hardware_store_job)

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Inventory Edge Function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown inventory error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 