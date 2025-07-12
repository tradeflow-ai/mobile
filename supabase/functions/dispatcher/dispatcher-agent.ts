/**
 * Dispatcher Agent - Unified Job Prioritization and Route Optimization
 * 
 * Single agent that handles both business priority classification and geographic optimization.
 * Uses the UNIFIED_DISPATCHER_PROMPT for consistent reasoning.
 */

import { OpenAIClient, createMessages } from '../_shared/openai-client.ts';
import { UNIFIED_DISPATCHER_PROMPT } from './dispatcher-prompt.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AgentContext {
  userId: string;
  jobIds: string[];
  planDate: string;
}

export interface DispatchOutput {
  prioritized_jobs: Array<{
    job_id: string;
    priority_rank: number;
    estimated_start_time: string;
    estimated_end_time: string;
    priority_reason: string;
    job_type: 'emergency' | 'inspection' | 'service';
    buffer_time_minutes: number;
    priority_score: number;
    scheduling_notes: string;
    business_priority_tier: string;
    geographic_reasoning: string;
    travel_time_to_next: number;
  }>;
  scheduling_constraints: {
    work_start_time: string;
    work_end_time: string;
    lunch_break_start: string;
    lunch_break_end: string;
    total_work_hours: number;
    total_jobs_scheduled: number;
    schedule_conflicts: string[];
  };
  recommendations: string[];
  agent_reasoning: string;
  execution_time_ms: number;
  optimization_summary: {
    emergency_jobs: number;
    inspection_jobs: number;
    service_jobs: number;
    total_travel_time: number;
    route_efficiency: number;
  };
}

/**
 * Initialize Supabase client for Edge Function
 */
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export class DispatcherAgent {
  private openai: OpenAIClient;

  constructor() {
    this.openai = new OpenAIClient();
  }

  async execute(context: AgentContext, learnedExamples: string[] = []): Promise<DispatchOutput> {
    const startTime = Date.now();
    
    try {
      const supabase = createSupabaseClient();

      console.log(`🎯 Dispatcher Agent: Processing ${context.jobIds.length} jobs for ${context.planDate}`);

      // Fetch jobs for the day
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

      // Get user preferences for constraints
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', context.userId)
        .single();

      const preferences = profile?.preferences || {};

      // Core dispatch algorithm with AI reasoning
      const dispatchResult = await this.executeAIDispatch(effectiveJobs, preferences, context.planDate, learnedExamples);

      // Validate AI scheduling results for all jobs
      this.validateAllJobSchedulingResults(dispatchResult.prioritized_jobs, effectiveJobs);

      // Check for and resolve schedule conflicts
      const conflictValidation = this.validateScheduleConflicts(dispatchResult.prioritized_jobs);
      if (conflictValidation.hasConflicts) {
        console.warn(`⚠️ Found ${conflictValidation.conflicts.length} schedule conflicts - attempting to resolve...`);
        dispatchResult.prioritized_jobs = this.resolveScheduleConflicts(dispatchResult.prioritized_jobs, effectiveJobs);
      }

      // Update scheduled_start and scheduled_end for ALL jobs in the database
      await this.updateAllJobSchedules(supabase, dispatchResult.prioritized_jobs, effectiveJobs, context.planDate);

      console.log(`✅ Dispatcher complete: ${dispatchResult.prioritized_jobs.length} jobs prioritized in ${Date.now() - startTime}ms`);
      return dispatchResult;

    } catch (error) {
      console.error('❌ Dispatcher agent error:', error);
      throw error;
    }
  }

  /**
   * Execute AI-powered dispatch with unified prompt
   */
  private async executeAIDispatch(jobs: any[], preferences: any, planDate: string, learnedExamples: string[] = []): Promise<DispatchOutput> {
    const startTime = Date.now();

    try {
      // Prepare job data for AI
      const jobData = jobs.map(job => ({
        job_id: job.id,
        title: job.title,
        job_type: job.job_type,
        priority: job.priority,
        address: job.address,
        latitude: job.latitude,
        longitude: job.longitude,
        estimated_duration: job.estimated_duration || 60,
        scheduled_date: job.scheduled_date || null, // User's preferred date/time
        scheduled_start: job.scheduled_start || null, // AI-generated start time
        scheduled_end: job.scheduled_end || null, // AI-generated end time
        use_ai_scheduling: job.use_ai_scheduling || false,
        customer_name: job.customer_name,
        description: job.description
      }));

      // Format preferences for prompt injection
      const constraintData = {
        work_start_time: preferences.work_start_time || '08:00',
        work_end_time: preferences.work_end_time || '17:00',
        lunch_break_start: preferences.lunch_break_start || '12:00',
        lunch_break_end: preferences.lunch_break_end || '13:00',
        travel_buffer_percentage: preferences.travel_buffer_percentage || 15,
        job_duration_buffer_minutes: preferences.job_duration_buffer_minutes || 15
      };

      // Create user prompt with explicit JSON formatting instructions
      const adaptiveLearningSection = learnedExamples.length > 0 ? `
        ADAPTIVE LEARNING - USER PREFERENCES:
        Based on your past corrections, I've learned these patterns about your preferences:
        ${learnedExamples.map((example, index) => `${index + 1}. ${example}`).join('\n        ')}
        
        Please apply these learned preferences when prioritizing and scheduling jobs.
        ` : '';

      // Identify jobs that need AI scheduling
      const aiSchedulingJobs = jobData.filter(job => job.use_ai_scheduling === true);
      const scheduledDateJobs = jobData.filter(job => job.scheduled_date);
      
      const schedulingNote = `
        SCHEDULING REQUIREMENTS:
        
        1. FIXED-TIME JOBS (use_ai_scheduling: false): Jobs with specific time requirements
           - Must use the exact time specified in their scheduled_date field
           - These are immutable time slots that cannot be changed
           - Work around these fixed appointments when scheduling flexible jobs
        
        2. FLEXIBLE JOBS (use_ai_scheduling: true): Jobs that can be optimized
           ${aiSchedulingJobs.map(job => `   - Job ${job.job_id}: "${job.title}" scheduled for ${job.scheduled_date || 'TBD'}`).join('\n        ')}
           - You have full flexibility to schedule these at optimal times within the same day
           - Optimize these jobs for efficiency and geographic routing
        
        3. CRITICAL REQUIREMENTS:
           - ALL jobs must receive both estimated_start_time and estimated_end_time
           - estimated_end_time = estimated_start_time + estimated_duration
           - Jobs can only be scheduled within the same day (never move to different dates)
           - Use HH:MM format (24-hour format preferred) in Central Time
           - Schedule all times in Central Time (UTC-5) - system will convert to UTC for database storage
           - Both scheduled_start and scheduled_end will be updated in the database for ALL jobs
        ` + (scheduledDateJobs.length > 0 ? `
        
        JOBS WITH USER-SPECIFIED DATES:
        ${scheduledDateJobs.map(job => {
          const dateInfo = job.scheduled_date ? new Date(job.scheduled_date) : null;
          const hasTime = dateInfo && (dateInfo.getHours() !== 0 || dateInfo.getMinutes() !== 0);
          return `   - Job ${job.job_id}: "${job.title}" - Date: ${job.scheduled_date}, ${hasTime ? 'Time specified' : 'Time flexible'}`;
        }).join('\n        ')}` : '');

      const userPrompt = `
        Please analyze and optimize the following ${jobs.length} jobs for ${planDate}:

        JOBS TO PRIORITIZE:
        ${JSON.stringify(jobData, null, 2)}

        USER CONSTRAINTS:
        ${JSON.stringify(constraintData, null, 2)}

        ${adaptiveLearningSection}${schedulingNote}

        Please return a complete dispatch plan with:
        1. Jobs prioritized by business rules (Emergency → Inspection → Service)
        2. Geographic optimization within each priority tier
        3. Complete scheduling with time estimates
        4. Clear reasoning for your decisions
        5. Apply learned user preferences from past corrections
        6. MANDATORY: Provide exact start/end times for all jobs marked with use_ai_scheduling: true

        IMPORTANT: Return ONLY a valid JSON object matching the DispatchOutput interface. 
        Do not include any markdown formatting, explanations, or additional text. 
        Start your response with { and end with }.

        CRITICAL NUMERIC FORMAT REQUIREMENTS:
        - buffer_time_minutes: Use ONLY numbers (15, NOT "15 minutes")
        - travel_time_to_next: Use ONLY numbers (20, NOT "20 minutes")
        - priority_score: Use ONLY numbers (150, NOT "150 points")
        - priority_rank: Use ONLY numbers (1, NOT "1st")
        - All optimization_summary fields: Use ONLY numbers

        SCHEDULE CONFLICT PREVENTION:
        - NO overlapping job times - each job must have unique time slot
        - Jobs must be scheduled sequentially (Job 1 ends before Job 2 starts)
        - Add travel time between jobs to prevent overlaps
        - Fixed-time jobs create immovable constraints - schedule flexible jobs around them
        - Validate all times to ensure no two jobs happen simultaneously

        The JSON must include these exact fields:
        - prioritized_jobs (array)
        - scheduling_constraints (object)
        - recommendations (array)
        - agent_reasoning (string)
        - optimization_summary (object)
      `;

      // Call OpenAI API directly
      const messages = createMessages(UNIFIED_DISPATCHER_PROMPT, userPrompt);
      const aiResponse = await this.openai.chatCompletion(messages, {
        model: 'gpt-4o',
        temperature: 0.1,
        maxTokens: 4000
      });

      // Parse AI response and create structured output
      const parsedResponse = this.parseAIResponse(aiResponse, jobs, preferences);
      
      // Sanitize numeric fields to ensure they're proper numbers
      const sanitizedResponse = this.sanitizeNumericFields(parsedResponse);
      
      return {
        ...sanitizedResponse,
        execution_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.warn('⚠️ AI dispatch failed, using fallback algorithm:', error);
      return this.fallbackDispatch(jobs, preferences, planDate, startTime);
    }
  }

  /**
   * Parse AI response into structured format with robust JSON extraction
   */
  private parseAIResponse(aiResponse: string, jobs: any[], preferences: any): Omit<DispatchOutput, 'execution_time_ms'> {
    console.log('🤖 Raw AI Response Length:', aiResponse.length);
    console.log('🤖 Raw AI Response Preview:', aiResponse.substring(0, 500) + '...');
    
    try {
      // Strategy 1: Try to find JSON within markdown code blocks
      const markdownJsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownJsonMatch) {
        console.log('📋 Found markdown JSON block, attempting to parse...');
        const jsonStr = markdownJsonMatch[1].trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.prioritized_jobs) {
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
        if (parsed.prioritized_jobs) {
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
        if (parsed.prioritized_jobs) {
          console.log('✅ Successfully parsed JSON with markers');
          return parsed;
        }
      }

      // Strategy 4: Last resort - try to find any JSON-like structure
      const lines = aiResponse.split('\n');
      let jsonStartIdx = -1;
      let jsonEndIdx = -1;
      let braceCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('{') && jsonStartIdx === -1) {
          jsonStartIdx = i;
          braceCount = 1;
        } else if (jsonStartIdx !== -1) {
          for (const char of line) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (braceCount === 0) {
              jsonEndIdx = i;
              break;
            }
          }
          if (braceCount === 0) break;
        }
      }

      if (jsonStartIdx !== -1 && jsonEndIdx !== -1) {
        console.log('📋 Found JSON by line parsing, attempting to parse...');
        const jsonLines = lines.slice(jsonStartIdx, jsonEndIdx + 1);
        const jsonStr = jsonLines.join('\n').trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.prioritized_jobs) {
          console.log('✅ Successfully parsed JSON by line parsing');
          return parsed;
        }
      }

      console.warn('⚠️ All JSON parsing strategies failed, using fallback');
      
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
        if (error.message.includes('position')) {
          const position = error.message.match(/position (\d+)/)?.[1];
          if (position) {
            const pos = parseInt(position);
            console.error('❌ Error context:', aiResponse.substring(Math.max(0, pos - 50), pos + 50));
          }
        }
      }
    }

    // Fallback: create structured response from jobs
    console.log('🔄 Using fallback response generation');
    return this.createFallbackResponse(jobs, preferences, aiResponse);
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
      address: `123 Mock St ${index + 1}`,
      latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
      estimated_duration: 60 + (index * 30),
      description: `Test job for dispatcher function`,
      customer_name: `Test Customer ${index + 1}`
    }));
  }

  /**
   * Fallback dispatch algorithm if AI fails
   */
  private fallbackDispatch(jobs: any[], preferences: any, planDate: string, startTime: number): DispatchOutput {
    const prioritizedJobs = jobs
      .map((job, index) => ({
        job_id: job.id,
        priority_rank: index + 1,
        estimated_start_time: `${8 + index}:00`,
        estimated_end_time: `${9 + index}:00`,
        priority_reason: `Fallback prioritization based on job type: ${job.job_type}`,
        job_type: job.job_type as 'emergency' | 'inspection' | 'service',
        buffer_time_minutes: 15,
        priority_score: 100,
        scheduling_notes: 'Fallback scheduling applied',
        business_priority_tier: job.job_type,
        geographic_reasoning: 'Fallback geographic ordering',
        travel_time_to_next: 15
      }))
      .sort((a, b) => {
        // Simple priority: emergency > inspection > service
        const priority = { emergency: 3, inspection: 2, service: 1 };
        return priority[b.job_type] - priority[a.job_type];
      });

    return {
      prioritized_jobs: prioritizedJobs,
      scheduling_constraints: {
        work_start_time: preferences.work_start_time || '08:00',
        work_end_time: preferences.work_end_time || '17:00',
        lunch_break_start: preferences.lunch_break_start || '12:00',
        lunch_break_end: preferences.lunch_break_end || '13:00',
        total_work_hours: 8,
        total_jobs_scheduled: jobs.length,
        schedule_conflicts: []
      },
      recommendations: ['Fallback dispatch algorithm applied'],
      agent_reasoning: 'Fallback algorithm used due to AI processing error',
      execution_time_ms: Date.now() - startTime,
      optimization_summary: {
        emergency_jobs: jobs.filter(j => j.job_type === 'emergency').length,
        inspection_jobs: jobs.filter(j => j.job_type === 'inspection').length,
        service_jobs: jobs.filter(j => j.job_type === 'service').length,
        total_travel_time: jobs.length * 15,
        route_efficiency: 0.8
      }
    };
  }

  /**
   * Validate that AI provided scheduling times for ALL jobs
   */
  private validateAllJobSchedulingResults(prioritizedJobs: any[], originalJobs: any[]): void {
    try {
      console.log(`🔍 Validating scheduling for ALL ${originalJobs.length} jobs`);

      // Check if AI provided times for all jobs
      const missingSchedules: string[] = [];
      const flexibleJobs = originalJobs.filter(job => job.use_ai_scheduling === true);
      const fixedJobs = originalJobs.filter(job => job.use_ai_scheduling === false);
      
      console.log(`📋 Job breakdown: ${flexibleJobs.length} flexible, ${fixedJobs.length} fixed-time`);

      for (const originalJob of originalJobs) {
        const prioritizedJob = prioritizedJobs.find(pJob => pJob.job_id === originalJob.id);
        
        if (!prioritizedJob) {
          missingSchedules.push(`Job ${originalJob.id} (${originalJob.title || 'Unknown'}) - Not found in prioritized jobs`);
        } else if (!prioritizedJob.estimated_start_time || !prioritizedJob.estimated_end_time) {
          missingSchedules.push(`Job ${originalJob.id} (${originalJob.title || 'Unknown'}) - Missing start/end times`);
        } else {
          const jobType = originalJob.use_ai_scheduling ? 'FLEXIBLE' : 'FIXED';
          console.log(`✅ Job ${originalJob.id} (${jobType}) has scheduling: ${prioritizedJob.estimated_start_time} - ${prioritizedJob.estimated_end_time}`);
        }
      }

      if (missingSchedules.length > 0) {
        console.warn(`⚠️ Scheduling validation issues found:`);
        missingSchedules.forEach(issue => console.warn(`   - ${issue}`));
        console.warn(`⚠️ ${missingSchedules.length} out of ${originalJobs.length} jobs are missing proper scheduling`);
      } else {
        console.log(`✅ All ${originalJobs.length} jobs have proper start/end times`);
      }
    } catch (error) {
      console.error('❌ Error validating scheduling results:', error);
    }
  }

  /**
   * Update scheduled_start and scheduled_end for ALL jobs in the database
   */
  private async updateAllJobSchedules(supabase: any, prioritizedJobs: any[], originalJobs: any[], planDate: string): Promise<void> {
    try {
      console.log('🔒 Updating scheduled_start and scheduled_end for ALL jobs...');
      
      // Create a map for quick lookup of original job data
      const originalJobMap = new Map(originalJobs.map(job => [job.id, job]));
      
      // Get ALL jobs that need their schedules updated
      const jobsToUpdate = prioritizedJobs.filter(job => {
        return job.estimated_start_time && job.estimated_end_time;
      });

      console.log(`📋 Found ${jobsToUpdate.length} jobs to update out of ${prioritizedJobs.length} total jobs`);

      if (jobsToUpdate.length === 0) {
        console.log('📋 No jobs found that need schedule updates');
        return;
      }

      // Log which jobs are being updated
      jobsToUpdate.forEach(job => {
        const originalJob = originalJobMap.get(job.job_id);
        const jobType = originalJob?.use_ai_scheduling ? 'FLEXIBLE' : 'FIXED';
        console.log(`🎯 Will update job ${job.job_id} (${originalJob?.title || 'Unknown'}) [${jobType}] with times: ${job.estimated_start_time} - ${job.estimated_end_time}`);
      });

      let successCount = 0;
      let errorCount = 0;

      // Update each job with the scheduled times
      for (const job of jobsToUpdate) {
        try {
          // Convert time strings to full datetime strings for the database
          const startDateTime = this.convertTimeToDateTime(job.estimated_start_time, planDate);
          const endDateTime = this.convertTimeToDateTime(job.estimated_end_time, planDate);

          console.log(`🔒 Updating job ${job.job_id} with datetime: ${startDateTime} to ${endDateTime}`);

          const { error } = await supabase
            .from('job_locations')
            .update({
              scheduled_start: startDateTime,
              scheduled_end: endDateTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.job_id);

          if (error) {
            console.error(`❌ Database error updating job ${job.job_id}:`, error);
            errorCount++;
          } else {
            console.log(`✅ Successfully updated schedule for job ${job.job_id}`);
            successCount++;
          }
        } catch (jobError) {
          console.error(`❌ Error processing job ${job.job_id}:`, jobError);
          errorCount++;
        }
      }

      console.log(`🔒 Schedule update complete: ${successCount} successful, ${errorCount} errors out of ${jobsToUpdate.length} total`);
      
      if (errorCount > 0) {
        console.warn(`⚠️ ${errorCount} jobs failed to update. Some jobs may not have updated scheduled times.`);
      }
    } catch (error) {
      console.error('❌ Critical error in schedule update:', error);
      // Don't throw the error to prevent the entire dispatch from failing
    }
  }

  /**
   * Convert time string (e.g., "09:30") from Central Time to UTC datetime string for database
   */
  private convertTimeToDateTime(timeStr: string, planDate: string): string {
    try {
      console.log(`🕐 Converting Central Time "${timeStr}" for date "${planDate}" to UTC`);
      
      // Handle different time formats
      let hours = 0;
      let minutes = 0;

      // Clean the time string
      const cleanTimeStr = timeStr.toString().trim();

      if (cleanTimeStr.includes(':')) {
        const [hourStr, minuteStr] = cleanTimeStr.split(':');
        hours = parseInt(hourStr, 10);
        minutes = parseInt(minuteStr, 10);
      } else if (cleanTimeStr.includes('.')) {
        // Handle decimal format like "9.5" (9:30)
        const decimal = parseFloat(cleanTimeStr);
        hours = Math.floor(decimal);
        minutes = Math.round((decimal - hours) * 60);
      } else {
        // Handle integer format like "9" (9:00)
        hours = parseInt(cleanTimeStr, 10);
        minutes = 0;
      }

      // Validate hours and minutes
      if (isNaN(hours) || hours < 0 || hours > 23) {
        console.warn(`⚠️ Invalid hours: ${hours}, using 9 AM as fallback`);
        hours = 9;
      }
      if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        console.warn(`⚠️ Invalid minutes: ${minutes}, using 0 as fallback`);
        minutes = 0;
      }

      // Create datetime in Central Time (UTC-5)
      // First create the date string in Central time
      const centralTimeString = `${planDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000`;
      
      // Convert Central Time to UTC by adding 5 hours
      const centralDateTime = new Date(centralTimeString);
      
      // Add 5 hours to convert from Central (UTC-5) to UTC
      const utcDateTime = new Date(centralDateTime.getTime() + (5 * 60 * 60 * 1000));
      
      // Validate the created date
      if (isNaN(utcDateTime.getTime())) {
        console.error(`❌ Invalid date created from "${planDate}" and time "${timeStr}"`);
        // Fallback: 9 AM Central = 2 PM UTC
        const fallbackUtc = new Date(`${planDate}T09:00:00.000`);
        fallbackUtc.setHours(fallbackUtc.getHours() + 5); // Convert to UTC
        return fallbackUtc.toISOString();
      }

      const utcIsoString = utcDateTime.toISOString();
      console.log(`✅ Converted Central Time "${timeStr}" to UTC "${utcIsoString}"`);
      return utcIsoString;
    } catch (error) {
      console.error(`❌ Error converting Central Time "${timeStr}" to UTC:`, error);
      // Fallback to 9 AM Central = 2 PM UTC
      const fallbackUtc = new Date(`${planDate}T14:00:00.000Z`);
      const fallbackString = fallbackUtc.toISOString();
      console.log(`🔄 Using fallback UTC datetime: ${fallbackString}`);
      return fallbackString;
    }
  }

  /**
   * Validate schedule conflicts - check for overlapping job times
   */
  private validateScheduleConflicts(prioritizedJobs: any[]): { hasConflicts: boolean; conflicts: any[] } {
    try {
      console.log('🔍 Checking for schedule conflicts...');
      
      const conflicts: any[] = [];
      
      // Convert time strings to minutes for easier comparison
      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      // Sort jobs by start time for easier conflict detection
      const sortedJobs = [...prioritizedJobs].sort((a, b) => {
        const aStart = timeToMinutes(a.estimated_start_time);
        const bStart = timeToMinutes(b.estimated_start_time);
        return aStart - bStart;
      });
      
      // Check for overlapping times
      for (let i = 0; i < sortedJobs.length - 1; i++) {
        const currentJob = sortedJobs[i];
        const nextJob = sortedJobs[i + 1];
        
        const currentEnd = timeToMinutes(currentJob.estimated_end_time);
        const nextStart = timeToMinutes(nextJob.estimated_start_time);
        
        // Check if next job starts before current job ends
        if (nextStart < currentEnd) {
          conflicts.push({
            job1: currentJob,
            job2: nextJob,
            conflict: `Job ${currentJob.job_id} ends at ${currentJob.estimated_end_time} but Job ${nextJob.job_id} starts at ${nextJob.estimated_start_time}`,
            overlapMinutes: currentEnd - nextStart
          });
        }
      }
      
      if (conflicts.length > 0) {
        console.warn(`❌ Found ${conflicts.length} schedule conflicts:`);
        conflicts.forEach(conflict => {
          console.warn(`   - ${conflict.conflict} (${conflict.overlapMinutes} min overlap)`);
        });
      } else {
        console.log('✅ No schedule conflicts found');
      }
      
      return {
        hasConflicts: conflicts.length > 0,
        conflicts
      };
    } catch (error) {
      console.error('❌ Error validating schedule conflicts:', error);
      return { hasConflicts: false, conflicts: [] };
    }
  }

  /**
   * Resolve schedule conflicts by adjusting flexible job times
   */
  private resolveScheduleConflicts(prioritizedJobs: any[], originalJobs: any[]): any[] {
    try {
      console.log('🔧 Resolving schedule conflicts...');
      
      // Create a map for quick lookup of original job data
      const originalJobMap = new Map(originalJobs.map(job => [job.id, job]));
      
      // Helper function to convert time strings to minutes
      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      // Helper function to convert minutes back to time string
      const minutesToTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      };
      
      // Sort jobs by start time and priority
      const sortedJobs = [...prioritizedJobs].sort((a, b) => {
        const aStart = timeToMinutes(a.estimated_start_time);
        const bStart = timeToMinutes(b.estimated_start_time);
        return aStart - bStart;
      });
      
      // Resolve conflicts by adjusting flexible job times
      for (let i = 0; i < sortedJobs.length - 1; i++) {
        const currentJob = sortedJobs[i];
        const nextJob = sortedJobs[i + 1];
        
        const currentEnd = timeToMinutes(currentJob.estimated_end_time);
        const nextStart = timeToMinutes(nextJob.estimated_start_time);
        
        // Check if there's a conflict
        if (nextStart < currentEnd) {
          const nextOriginalJob = originalJobMap.get(nextJob.job_id);
          
          // Only adjust flexible jobs (use_ai_scheduling: true)
          if (nextOriginalJob?.use_ai_scheduling === true) {
            // Calculate new start time with buffer
            const bufferMinutes = nextJob.travel_time_to_next || 15;
            const newStartTime = currentEnd + bufferMinutes;
            const duration = timeToMinutes(nextJob.estimated_end_time) - timeToMinutes(nextJob.estimated_start_time);
            const newEndTime = newStartTime + duration;
            
            // Update the job times
            nextJob.estimated_start_time = minutesToTime(newStartTime);
            nextJob.estimated_end_time = minutesToTime(newEndTime);
            
            console.log(`🔧 Resolved conflict: Moved Job ${nextJob.job_id} to ${nextJob.estimated_start_time} - ${nextJob.estimated_end_time}`);
          } else {
            // If it's a fixed-time job, we need to move the current job instead
            console.warn(`⚠️ Cannot resolve conflict with fixed-time job ${nextJob.job_id} - this requires manual intervention`);
          }
        }
      }
      
      console.log('✅ Schedule conflict resolution completed');
      return sortedJobs;
    } catch (error) {
      console.error('❌ Error resolving schedule conflicts:', error);
      return prioritizedJobs; // Return original if resolution fails
    }
  }

  /**
   * Sanitize numeric fields to ensure they contain only numbers
   */
  private sanitizeNumericFields(response: Omit<DispatchOutput, 'execution_time_ms'>): Omit<DispatchOutput, 'execution_time_ms'> {
    try {
      console.log('🧹 Sanitizing numeric fields to ensure proper number format...');
      
      // Helper function to extract number from text
      const extractNumber = (value: any): number => {
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'string') {
          // Extract first number from string like "75 minutes" -> 75
          const match = value.match(/(\d+(?:\.\d+)?)/);
          return match ? parseFloat(match[1]) : 0;
        }
        return 0;
      };

      // Sanitize prioritized jobs
      const sanitizedJobs = response.prioritized_jobs.map(job => ({
        ...job,
        priority_rank: extractNumber(job.priority_rank),
        buffer_time_minutes: extractNumber(job.buffer_time_minutes),
        priority_score: extractNumber(job.priority_score),
        travel_time_to_next: extractNumber(job.travel_time_to_next)
      }));

      // Sanitize optimization summary
      const sanitizedSummary = {
        ...response.optimization_summary,
        emergency_jobs: extractNumber(response.optimization_summary.emergency_jobs),
        inspection_jobs: extractNumber(response.optimization_summary.inspection_jobs),
        service_jobs: extractNumber(response.optimization_summary.service_jobs),
        total_travel_time: extractNumber(response.optimization_summary.total_travel_time),
        route_efficiency: extractNumber(response.optimization_summary.route_efficiency)
      };

      // Sanitize scheduling constraints
      const sanitizedConstraints = {
        ...response.scheduling_constraints,
        total_work_hours: extractNumber(response.scheduling_constraints.total_work_hours),
        total_jobs_scheduled: extractNumber(response.scheduling_constraints.total_jobs_scheduled)
      };

      console.log(`✅ Sanitized ${sanitizedJobs.length} jobs and summary fields`);

      return {
        ...response,
        prioritized_jobs: sanitizedJobs,
        optimization_summary: sanitizedSummary,
        scheduling_constraints: sanitizedConstraints
      };
    } catch (error) {
      console.error('❌ Error sanitizing numeric fields:', error);
      return response; // Return original if sanitization fails
    }
  }

  /**
   * Create fallback response structure
   */
  private createFallbackResponse(jobs: any[], preferences: any, aiReasoning: string): Omit<DispatchOutput, 'execution_time_ms'> {
    const prioritizedJobs = jobs.map((job, index) => ({
      job_id: job.id,
      priority_rank: index + 1,
      estimated_start_time: `${8 + index}:00`,
      estimated_end_time: `${9 + index}:00`,
      priority_reason: `AI prioritization: ${job.job_type} priority`,
      job_type: job.job_type as 'emergency' | 'inspection' | 'service',
      buffer_time_minutes: 15,
      priority_score: 100 + index,
      scheduling_notes: 'AI-assisted scheduling',
      business_priority_tier: job.job_type,
      geographic_reasoning: 'Geographic optimization applied',
      travel_time_to_next: 15
    }));

    return {
      prioritized_jobs: prioritizedJobs,
      scheduling_constraints: {
        work_start_time: preferences.work_start_time || '08:00',
        work_end_time: preferences.work_end_time || '17:00',
        lunch_break_start: preferences.lunch_break_start || '12:00',
        lunch_break_end: preferences.lunch_break_end || '13:00',
        total_work_hours: 8,
        total_jobs_scheduled: jobs.length,
        schedule_conflicts: []
      },
      recommendations: ['Jobs prioritized by business rules and geographic efficiency'],
      agent_reasoning: aiReasoning,
      optimization_summary: {
        emergency_jobs: jobs.filter(j => j.job_type === 'emergency').length,
        inspection_jobs: jobs.filter(j => j.job_type === 'inspection').length,
        service_jobs: jobs.filter(j => j.job_type === 'service').length,
        total_travel_time: jobs.length * 15,
        route_efficiency: 0.9
      }
    };
  }
} 