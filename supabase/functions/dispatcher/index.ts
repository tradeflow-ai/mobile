import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DispatcherAgent } from './dispatcher-agent.ts'
// TODO: Re-add agent learning service when available in edge function context
// import { agentLearningService } from '../../../services/agentLearningService.ts'

interface DispatchJobsRequest {
  userId: string;
  jobIds: string[];
  planDate: string;
}

interface DispatchJobsResponse {
  success: boolean;
  dispatch_output?: any;
  error?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { userId, jobIds, planDate }: DispatchJobsRequest = await req.json()

    console.log('🎯 Dispatcher Edge Function: Processing jobs for user:', userId)
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get learned examples for adaptive learning
    console.log('🧠 Dispatcher: Getting learned examples for user:', userId)
    // const learnedExamples = await agentLearningService.getLearnedExamples(userId)
    // console.log('🧠 Dispatcher: Found', learnedExamples.dispatcher.length, 'learned examples')

    // Execute dispatcher agent with learned examples
    const dispatcher = new DispatcherAgent()
    const dispatchResult = await dispatcher.execute({
      userId,
      jobIds,
      planDate
    }, []) // Pass an empty array as learnedExamples is removed

    const response: DispatchJobsResponse = {
      success: true,
      dispatch_output: dispatchResult
    }

    console.log('🎉 Dispatcher completed successfully')

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Dispatcher Edge Function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown dispatcher error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 