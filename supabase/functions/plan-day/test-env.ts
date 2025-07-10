/**
 * Test Environment Configuration for Supabase Edge Function
 * 
 * This file provides environment validation and testing for the plan-day Edge Function.
 * All VROOM/Docker references have been removed as part of the AI agent migration.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

export const requiredEnvVars = [
  'OPENAI_API_KEY',
  'SUPABASE_URL', 
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

export function validateEnvironment(): boolean {
  const missing = requiredEnvVars.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  
  return true;
}

export function getEnvironmentStatus() {
  return {
    OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') ? 'SET' : 'MISSING',
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING',
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'MISSING',
  };
}

serve(async (req: Request) => {
  try {
    const envStatus = getEnvironmentStatus();
    const isValid = validateEnvironment();

    return new Response(JSON.stringify({
      success: true,
      message: 'Edge Function environment test',
      environment: envStatus,
      isValid,
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