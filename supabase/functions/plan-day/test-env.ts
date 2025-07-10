import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  try {
    // Test basic functionality and environment variables
    const envTest = {
      OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') ? 'SET' : 'MISSING',
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'MISSING',
      VROOM_API_URL: Deno.env.get('VROOM_API_URL') ? 'SET' : 'MISSING'
    };

    return new Response(JSON.stringify({
      success: true,
      message: 'Edge Function is working',
      environment: envTest,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}) 