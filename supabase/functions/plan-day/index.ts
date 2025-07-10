import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { executeDailyPlanningWorkflow } from './agents.ts'

interface PlanDayRequest {
  userId: string;
  jobIds: string[];
  planDate: string;
}

interface PlanDayResponse {
  success: boolean;
  planId?: string;
  status?: string;
  currentStep?: string;
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
    const { userId, jobIds, planDate }: PlanDayRequest = await req.json()

    console.log('🚀 Edge Function: Planning day for user:', userId)
    console.log('📊 Request data:', { userId, jobIds, planDate })

    // Validate input
    if (!userId || !jobIds || !planDate) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: userId, jobIds, planDate'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate plan ID
    const planId = `plan-${Date.now()}`
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create a daily plan record
    const { data: dailyPlan, error: insertError } = await supabase
      .from('daily_plans')
      .insert({
        id: planId,
        user_id: userId,
        job_ids: jobIds,
        planned_date: planDate,
        status: 'pending',
        current_step: 'dispatch'
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating daily plan:', insertError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create daily plan'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Daily plan created:', planId)

    // Execute the agent workflow
    const workflowResult = await executeDailyPlanningWorkflow({
      userId,
      planId,
      jobIds,
      planDate
    })

    if (!workflowResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: workflowResult.error
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Update plan with results - Updated for unified dispatcher
    const { error: updateError } = await supabase
      .from('daily_plans')
      .update({
        status: 'inventory_complete',
        current_step: 'complete',
        dispatch_output: workflowResult.dispatch_output,
        inventory_output: workflowResult.inventory_output,
        completed_at: new Date().toISOString()
      })
      .eq('id', planId)

    if (updateError) {
      console.error('❌ Error updating daily plan:', updateError)
    }

    const response: PlanDayResponse = {
      success: true,
      planId,
      status: 'inventory_complete',
      currentStep: 'complete'
    }

    console.log('🎉 Returning success response:', response)

    return new Response(JSON.stringify({
      ...response,
      // Include the workflow results for testing
      dispatch_output: workflowResult.dispatch_output,
      inventory_output: workflowResult.inventory_output
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Edge Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 