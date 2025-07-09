/**
 * TradeFlow AI Agent Crew
 * 
 * This module exports the specialized agents for the TradeFlow daily planning workflow.
 * Each agent handles a specific aspect of the planning process with expert domain knowledge.
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DISPATCHER_PROMPT } from '../prompts/dispatcher';
import { ROUTER_PROMPT } from '../prompts/router';
import { INVENTORY_PROMPT } from '../prompts/inventory';
import { PreferencesService } from '../../services/preferencesService';
import { DailyPlanService } from '../../services/dailyPlanService';
import { routingTool } from '../tools/routing';
import { mockSupplierAPI } from '../tools/mockSupplier';
import { supabase } from '../../services/supabase';

// Agent state interfaces
export interface AgentContext {
  userId: string;
  planId: string;
  jobIds: string[];
  planDate: string;
  preferences?: Record<string, any>;
}

export interface DispatchOutput {
  prioritized_jobs: Array<{
    job_id: string;
    priority_rank: number;
    estimated_start_time: string;
    estimated_end_time: string;
    priority_reason: string;
    job_type: 'demand' | 'maintenance' | 'emergency';
    buffer_time_minutes: number;
    priority_score: number;
    scheduling_notes: string;
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
    demand_jobs: number;
    maintenance_jobs: number;
    vip_clients: number;
    schedule_efficiency: number;
  };
}

export interface RouteOutput {
  optimized_route: {
    waypoints: Array<{
      job_id: string;
      sequence_number: number;
      coordinates: { latitude: number; longitude: number };
      arrival_time: string;
      departure_time: string;
      duration_at_location: number;
      travel_time_to_next: number;
      distance_to_next: number;
    }>;
    route_geometry: string;
    total_distance: number;
    total_travel_time: number;
    total_work_time: number;
  };
  alternative_routes?: Array<{
    route_id: string;
    total_distance: number;
    total_time: number;
    route_geometry: string;
  }>;
  agent_reasoning: string;
  execution_time_ms: number;
}

export interface InventoryOutput {
  parts_manifest: Array<{
    job_id: string;
    required_parts: Array<{
      inventory_item_id: string;
      item_name: string;
      quantity_needed: number;
      quantity_available: number;
      unit: string;
      category: string;
    }>;
  }>;
  shopping_list: Array<{
    item_name: string;
    quantity_needed: number;
    unit: string;
    category: string;
    preferred_supplier: string;
    estimated_cost: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  hardware_store_run?: {
    store_locations: Array<{
      store_name: string;
      address: string;
      coordinates: { latitude: number; longitude: number };
      estimated_visit_time: number;
      items_available: string[];
    }>;
    total_estimated_cost: number;
    estimated_shopping_time: number;
  };
  created_hardware_store_jobs: string[];
  inventory_alerts: Array<{
    item_name: string;
    alert_type: 'low_stock' | 'out_of_stock' | 'reorder_needed';
    message: string;
  }>;
  agent_reasoning: string;
  execution_time_ms: number;
}

/**
 * Enhanced Dispatch Strategist Agent - Task 4 Implementation
 * 
 * Implements sophisticated job prioritization algorithm with:
 * - Demand vs Maintenance classification
 * - User-defined priority rules
 * - Time window and scheduling constraints
 * - Emergency job insertion
 * - Human-readable justifications
 */
export class DispatchStrategistAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.1,
    });
  }

  async execute(context: AgentContext): Promise<DispatchOutput> {
    const startTime = Date.now();
    
    try {
      // Update daily plan status
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        current_step: 'dispatch'
      });

      // Get user preferences
      const { data: preferences } = await PreferencesService.getUserPreferences(context.userId);
      const effectivePreferences = preferences || context.preferences || {};

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

      console.log(`🎯 Dispatch Agent: Processing ${effectiveJobs.length} jobs for ${context.planDate}`);

      // CORE DISPATCH ALGORITHM - Task 4.1
      const dispatchResult = await this.executeDispatchAlgorithm(effectiveJobs, effectivePreferences, context.planDate);

      // Generate AI reasoning and recommendations - Task 4.2
      const enhancedResult = await this.enhanceWithAIReasoning(dispatchResult, effectivePreferences);

      // Save dispatch output to daily plan
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        status: 'dispatch_complete',  // ✅ Tracks what's completed
        current_step: 'route',        // ✅ Tracks next step to execute
        dispatch_output: enhancedResult
      });

      console.log(`✅ Dispatch complete: ${enhancedResult.prioritized_jobs.length} jobs prioritized in ${Date.now() - startTime}ms`);
      return enhancedResult;

    } catch (error) {
      console.error('❌ Dispatch agent error:', error);
      
      // Mark plan as errored
      await DailyPlanService.markDailyPlanError(context.planId, {
        error_type: 'agent_failure',
        error_message: error instanceof Error ? error.message : 'Unknown dispatch error',
        failed_step: 'dispatch',
        timestamp: new Date().toISOString(),
        retry_suggested: true,
        diagnostic_info: { 
          job_count: context.jobIds.length,
          plan_date: context.planDate 
        }
      });

      throw error;
    }
  }

  /**
   * TEMPORARY: Create mock jobs for testing when real jobs are not found
   */
  private createMockJobs(jobIds: string[]): any[] {
    return jobIds.map((jobId, index) => ({
      id: jobId,
      user_id: 'test-user',
      title: `Mock Job ${index + 1}`,
      description: `This is a mock job for testing the dispatch agent`,
      job_type: index === 0 ? 'emergency' : index === 1 ? 'maintenance' : 'repair',
      priority: index === 0 ? 'urgent' : index === 1 ? 'medium' : 'high',
      status: 'pending',
      latitude: 40.7128 + (index * 0.01),
      longitude: -74.0060 + (index * 0.01),
      address: `${123 + index} Test St, New York, NY 10001`,
      customer_name: `Test Customer ${index + 1}`,
      customer_id: index === 0 ? 'vip-customer-1' : `customer-${index + 1}`,
      phone: `555-010${index}`,
      scheduled_date: new Date().toISOString(),
      estimated_duration: 90 + (index * 30),
      instructions: `Mock instructions for job ${index + 1}`,
      required_items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }

  /**
   * TASK 4.1: Core Dispatch Algorithm Implementation
   * 
   * Implements sophisticated job prioritization with:
   * - Job classification (Demand vs Maintenance)
   * - Priority scoring algorithm
   * - Time window constraints
   * - User preference application
   */
  private async executeDispatchAlgorithm(jobs: any[], preferences: any, planDate: string): Promise<DispatchOutput> {
    const startTime = Date.now();

    // Step 1: Classify jobs as Demand vs Maintenance
    const classifiedJobs = jobs.map(job => this.classifyJob(job, preferences));

    // Step 2: Calculate priority scores for each job
    const scoredJobs = classifiedJobs.map(job => this.calculatePriorityScore(job, preferences));

    // Step 3: Apply scheduling constraints and time windows
    const scheduledJobs = this.applySchedulingConstraints(scoredJobs, preferences, planDate);

    // Step 4: Handle emergency job insertion
    const finalJobs = this.handleEmergencyInsertion(scheduledJobs, preferences);

    // Step 5: Generate scheduling constraints
    const constraints = this.generateSchedulingConstraints(finalJobs, preferences);

    // Step 6: Create optimization summary
    const optimizationSummary = this.createOptimizationSummary(finalJobs);

    // Step 7: Ensure job_id is properly set in prioritized_jobs
    const prioritizedJobs = finalJobs.map(job => ({
      job_id: job.id, // CRITICAL: Map job.id to job_id
      priority_rank: job.priority_rank,
      estimated_start_time: job.estimated_start_time,
      estimated_end_time: job.estimated_end_time,
      priority_reason: job.priority_reason || job.classification_reason,
      job_type: job.classification,
      buffer_time_minutes: job.buffer_time_minutes,
      priority_score: job.priority_score,
      scheduling_notes: job.scheduling_notes
    }));

    return {
      prioritized_jobs: prioritizedJobs,
      scheduling_constraints: constraints,
      recommendations: this.generateRecommendations(finalJobs, preferences),
      agent_reasoning: "Core algorithmic prioritization complete - AI enhancement pending",
      execution_time_ms: Date.now() - startTime,
      optimization_summary: optimizationSummary
    };
  }

  /**
   * Job Classification: Demand vs Maintenance
   * 
   * Classifies jobs based on:
   * - Job type and priority
   * - Emergency keywords
   * - User-defined emergency types
   * - Time sensitivity
   */
  private classifyJob(job: any, preferences: any): any {
    const emergencyTypes = preferences.emergency_job_types || [];
    const emergencyKeywords = ['emergency', 'urgent', 'leak', 'flood', 'gas', 'electrical', 'hazard', 'safety'];
    
    let classification = 'maintenance'; // default
    let priorityBoost = 0;

    // Check for explicit emergency types
    if (emergencyTypes.includes(job.job_type?.toLowerCase())) {
      classification = 'emergency';
      priorityBoost = 1000;
    }
    // Check for emergency keywords in title/description
    else if (emergencyKeywords.some(keyword => 
      job.title?.toLowerCase().includes(keyword) || 
      job.description?.toLowerCase().includes(keyword)
    )) {
      classification = 'emergency';
      priorityBoost = 1000;
    }
    // Check priority level for demand classification
    else if (job.priority === 'urgent' || job.priority === 'high') {
      classification = 'demand';
      priorityBoost = 500;
    }
    // Check if scheduled within demand response window
    else if (job.scheduled_date) {
      const scheduledTime = new Date(job.scheduled_date);
      const now = new Date();
      const hoursDiff = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff <= preferences.demand_response_time_hours) {
        classification = 'demand';
        priorityBoost = 300;
      }
    }

    return {
      ...job,
      classification,
      priority_boost: priorityBoost,
      classification_reason: this.getClassificationReason(classification, job, preferences)
    };
  }

  /**
   * Priority Scoring Algorithm
   * 
   * Calculates comprehensive priority scores based on:
   * - Emergency/urgency level
   * - Client value (VIP status)
   * - Time constraints
   * - Revenue potential
   * - Geographic factors
   */
  private calculatePriorityScore(job: any, preferences: any): any {
    let score = 0;
    const scoringFactors: string[] = [];

    // Base priority from classification
    score += job.priority_boost;
    if (job.priority_boost > 0) {
      scoringFactors.push(`Classification boost: +${job.priority_boost}`);
    }

    // VIP Client bonus
    if (preferences.vip_client_ids?.includes(job.customer_id)) {
      score += 200;
      scoringFactors.push('VIP client: +200');
    }

    // Time sensitivity scoring
    if (job.scheduled_date) {
      const timeScore = this.calculateTimeScore(job.scheduled_date, preferences);
      score += timeScore;
      if (timeScore > 0) {
        scoringFactors.push(`Time sensitivity: +${timeScore}`);
      }
    }

    // Priority level scoring
    const priorityScores = { 'urgent': 150, 'high': 100, 'medium': 50, 'low': 10 };
    const priorityScore = priorityScores[job.priority as keyof typeof priorityScores] || 25;
    score += priorityScore;
    scoringFactors.push(`${job.priority} priority: +${priorityScore}`);

    // Duration efficiency bonus (shorter jobs get slight boost for scheduling flexibility)
    if (job.estimated_duration && job.estimated_duration < 60) {
      score += 25;
      scoringFactors.push('Quick job bonus: +25');
    }

    // Penalty for very long jobs (harder to schedule)
    if (job.estimated_duration && job.estimated_duration > 180) {
      score -= 25;
      scoringFactors.push('Long job penalty: -25');
    }

    return {
      ...job,
      priority_score: Math.max(score, 0), // Ensure non-negative
      scoring_factors: scoringFactors,
      score_breakdown: {
        base_classification: job.priority_boost,
        vip_bonus: preferences.vip_client_ids?.includes(job.customer_id) ? 200 : 0,
        priority_level: priorityScore,
        time_sensitivity: job.scheduled_date ? this.calculateTimeScore(job.scheduled_date, preferences) : 0
      }
    };
  }

  /**
   * Time Sensitivity Scoring
   * 
   * Calculates score based on how time-sensitive the job is
   */
  private calculateTimeScore(scheduledDate: string, preferences: any): number {
    const scheduled = new Date(scheduledDate);
    const now = new Date();
    const hoursDiff = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Overdue jobs get highest score
    if (hoursDiff < 0) return 300;
    
    // Jobs due within emergency response window
    const emergencyResponseMinutes = preferences.emergency_response_time_minutes || 60;
    if (hoursDiff <= emergencyResponseMinutes / 60) return 250;
    
    // Jobs due within demand response window
    const demandResponseHours = preferences.demand_response_time_hours || 24;
    if (hoursDiff <= demandResponseHours) return 150;
    
    // Jobs due today
    if (hoursDiff <= 24) return 75;
    
    // Jobs due within maintenance window get lower score
    const maintenanceResponseDays = preferences.maintenance_response_time_days || 7;
    if (hoursDiff <= maintenanceResponseDays * 24) return 25;
    
    return 0;
  }

  /**
   * TASK 4.1: Apply Scheduling Constraints
   * 
   * Considers:
   * - Work schedule constraints
   * - Time windows
   * - Buffer times
   * - Break scheduling
   */
  private applySchedulingConstraints(jobs: any[], preferences: any, planDate: string): any[] {
    // Sort jobs by priority score (highest first)
    const sortedJobs = [...jobs].sort((a, b) => b.priority_score - a.priority_score);

    // Calculate work day boundaries with defaults
    const workStart = this.parseTime(preferences.work_start_time || '08:00');
    const workEnd = this.parseTime(preferences.work_end_time || '17:00');
    const lunchStart = this.parseTime(preferences.lunch_break_start || '12:00');
    const lunchEnd = this.parseTime(preferences.lunch_break_end || '13:00');
    const jobBufferMinutes = preferences.job_duration_buffer_minutes || 15;

    let currentTime = workStart;
    const scheduledJobs = [];

    for (let i = 0; i < sortedJobs.length; i++) {
      const job = sortedJobs[i];
      const jobDuration = (job.estimated_duration || 90) + jobBufferMinutes;

      // Check if job fits before lunch
      if (currentTime + jobDuration <= lunchStart) {
        const startTime = new Date(planDate + 'T' + this.formatTime(currentTime));
        const endTime = new Date(startTime.getTime() + jobDuration * 60000);

        scheduledJobs.push({
          ...job,
          priority_rank: i + 1,
          estimated_start_time: startTime.toISOString(),
          estimated_end_time: endTime.toISOString(),
          buffer_time_minutes: jobBufferMinutes,
          priority_reason: job.priority_reason || job.classification_reason || `${job.classification} job`,
          scheduling_notes: this.generateSchedulingNotes(job, currentTime, preferences)
        });

        currentTime += jobDuration + 15; // Add small gap between jobs
      }
      // Check if job fits after lunch
      else if (currentTime < lunchStart) {
        currentTime = lunchEnd; // Skip to after lunch
        
        if (currentTime + jobDuration <= workEnd) {
          const startTime = new Date(planDate + 'T' + this.formatTime(currentTime));
          const endTime = new Date(startTime.getTime() + jobDuration * 60000);

          scheduledJobs.push({
            ...job,
            priority_rank: i + 1,
            estimated_start_time: startTime.toISOString(),
            estimated_end_time: endTime.toISOString(),
            buffer_time_minutes: jobBufferMinutes,
            priority_reason: job.priority_reason || job.classification_reason || `${job.classification} job`,
            scheduling_notes: `Scheduled after lunch break - ${this.generateSchedulingNotes(job, currentTime, preferences)}`
          });

          currentTime += jobDuration + 15;
        } else {
          // Job doesn't fit in work day
          scheduledJobs.push({
            ...job,
            priority_rank: i + 1,
            estimated_start_time: new Date(planDate + 'T' + (preferences.work_start_time || '08:00')).toISOString(),
            estimated_end_time: new Date(planDate + 'T' + (preferences.work_start_time || '08:00')).toISOString(),
            buffer_time_minutes: jobBufferMinutes,
            priority_reason: job.priority_reason || job.classification_reason || `${job.classification} job`,
            scheduling_notes: `⚠️ Cannot fit in work day - requires rescheduling`
          });
        }
      }
    }

    return scheduledJobs;
  }

  /**
   * TASK 4.2: Emergency Job Insertion
   * 
   * Handles emergency jobs with special logic:
   * - Immediate priority
   * - Schedule disruption handling
   * - Emergency buffer times
   */
  private handleEmergencyInsertion(jobs: any[], preferences: any): any[] {
    const emergencyJobs = jobs.filter(job => job.classification === 'emergency');
    const nonEmergencyJobs = jobs.filter(job => job.classification !== 'emergency');

    if (emergencyJobs.length === 0) {
      return jobs;
    }

    // Sort emergency jobs by priority score
    emergencyJobs.sort((a, b) => b.priority_score - a.priority_score);

    // Apply emergency buffers
    const emergencyBufferMinutes = preferences.emergency_buffer_minutes || 30;
    const enhancedEmergencyJobs = emergencyJobs.map(job => ({
      ...job,
      buffer_time_minutes: Math.max(
        job.buffer_time_minutes || 0,
        emergencyBufferMinutes
      ),
      priority_reason: `🚨 EMERGENCY: ${job.classification_reason}`,
      scheduling_notes: `Emergency job with ${emergencyBufferMinutes}min buffer time`
    }));

    // Rerank all jobs with emergencies first
    const rerankedJobs = [
      ...enhancedEmergencyJobs,
      ...nonEmergencyJobs
    ].map((job, index) => ({
      ...job,
      priority_rank: index + 1
    }));

    return rerankedJobs;
  }

  /**
   * Generate Scheduling Constraints Summary
   */
  private generateSchedulingConstraints(jobs: any[], preferences: any): any {
    const conflicts = jobs
      .filter(job => job.scheduling_notes?.includes('⚠️'))
      .map(job => `${job.title}: ${job.scheduling_notes}`);

    return {
      work_start_time: preferences.work_start_time || '08:00',
      work_end_time: preferences.work_end_time || '17:00',
      lunch_break_start: preferences.lunch_break_start || '12:00',
      lunch_break_end: preferences.lunch_break_end || '13:00',
      total_work_hours: this.calculateWorkHours(preferences),
      total_jobs_scheduled: jobs.length,
      schedule_conflicts: conflicts
    };
  }

  /**
   * Create Optimization Summary
   */
  private createOptimizationSummary(jobs: any[]): any {
    const summary = {
      emergency_jobs: jobs.filter(j => j.classification === 'emergency').length,
      demand_jobs: jobs.filter(j => j.classification === 'demand').length,
      maintenance_jobs: jobs.filter(j => j.classification === 'maintenance').length,
      vip_clients: jobs.filter(j => j.score_breakdown?.vip_bonus > 0).length,
      schedule_efficiency: this.calculateScheduleEfficiency(jobs)
    };

    return summary;
  }

  /**
   * TASK 4.2: Generate Human-readable Recommendations
   */
  private generateRecommendations(jobs: any[], preferences: any): string[] {
    const recommendations: string[] = [];

    // Emergency job recommendations
    const emergencyJobs = jobs.filter(j => j.classification === 'emergency');
    if (emergencyJobs.length > 0) {
      recommendations.push(`🚨 ${emergencyJobs.length} emergency job(s) prioritized for immediate response`);
    }

    // Schedule efficiency recommendations
    const conflictJobs = jobs.filter(j => j.scheduling_notes?.includes('⚠️'));
    if (conflictJobs.length > 0) {
      recommendations.push(`⚠️ ${conflictJobs.length} job(s) cannot fit in work schedule - consider extending hours or rescheduling`);
    }

    // VIP client recommendations
    const vipJobs = jobs.filter(j => j.score_breakdown?.vip_bonus > 0);
    if (vipJobs.length > 0) {
      recommendations.push(`⭐ ${vipJobs.length} VIP client job(s) scheduled with priority`);
    }

    // Time management recommendations
    const totalDuration = jobs.reduce((sum, job) => sum + (job.estimated_duration || 90), 0);
    const workMinutes = this.calculateWorkMinutes(preferences);
    if (totalDuration > workMinutes * 0.8) {
      recommendations.push(`⏰ Schedule is ${Math.round((totalDuration / workMinutes) * 100)}% full - consider light day`);
    }

    return recommendations;
  }

  /**
   * TASK 4.2: Enhance with AI Reasoning
   * 
   * Uses LLM to generate human-readable justifications
   */
  private async enhanceWithAIReasoning(dispatchResult: DispatchOutput, preferences: any): Promise<DispatchOutput> {
    try {
      const formattedPrefs = PreferencesService.formatDispatcherPreferences(preferences);
      const injectedPrompt = PreferencesService.injectPreferencesIntoPrompt(DISPATCHER_PROMPT, formattedPrefs);

      const messages = [
        new SystemMessage(injectedPrompt),
        new HumanMessage(`
          I have completed the algorithmic job prioritization. Please provide expert reasoning and analysis for this dispatch plan:

          PRIORITIZED JOBS:
          ${JSON.stringify(dispatchResult.prioritized_jobs, null, 2)}

          OPTIMIZATION SUMMARY:
          ${JSON.stringify(dispatchResult.optimization_summary, null, 2)}

          RECOMMENDATIONS:
          ${dispatchResult.recommendations.join('\n')}

          Please provide:
          1. Expert analysis of the prioritization decisions
          2. Insights about schedule optimization
          3. Risk assessment and mitigation suggestions
          4. Client service impact analysis

          Keep the response professional and actionable for a field service contractor.
        `)
      ];

      const response = await this.llm.invoke(messages);
      
      return {
        ...dispatchResult,
        agent_reasoning: response.content as string
      };

    } catch (error) {
      console.warn('AI reasoning enhancement failed, using algorithmic reasoning:', error);
      
      return {
        ...dispatchResult,
        agent_reasoning: this.generateFallbackReasoning(dispatchResult)
      };
    }
  }

  /**
   * Generate fallback reasoning when AI enhancement fails
   */
  private generateFallbackReasoning(result: DispatchOutput): string {
    const summary = result.optimization_summary;
    
    return `
DISPATCH ANALYSIS COMPLETE

✅ PRIORITIZATION RESULTS:
• ${summary.emergency_jobs} emergency jobs prioritized for immediate response
• ${summary.demand_jobs} demand jobs scheduled within response window
• ${summary.maintenance_jobs} maintenance jobs optimally sequenced
• ${summary.vip_clients} VIP clients given priority treatment

📊 SCHEDULE EFFICIENCY: ${summary.schedule_efficiency}%

🎯 KEY DECISIONS:
${result.prioritized_jobs.slice(0, 3).map((job, i) => 
  `${i + 1}. ${job.title} - ${job.priority_reason}`
).join('\n')}

⚠️ ATTENTION ITEMS:
${result.scheduling_constraints.schedule_conflicts.length > 0 
  ? result.scheduling_constraints.schedule_conflicts.join('\n')
  : 'No scheduling conflicts detected'
}

This prioritization maximizes emergency response capability while maintaining service quality for all clients.
    `.trim();
  }

  // Helper methods
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private calculateWorkHours(preferences: any): number {
    const start = this.parseTime(preferences.work_start_time || '08:00');
    const end = this.parseTime(preferences.work_end_time || '17:00');
    const lunchStart = this.parseTime(preferences.lunch_break_start || '12:00');
    const lunchEnd = this.parseTime(preferences.lunch_break_end || '13:00');
    
    const totalMinutes = end - start;
    const lunchMinutes = lunchEnd - lunchStart;
    const workMinutes = totalMinutes - lunchMinutes;
    
    return Math.max(workMinutes / 60, 0);
  }

  private calculateWorkMinutes(preferences: any): number {
    const start = this.parseTime(preferences.work_start_time || '08:00');
    const end = this.parseTime(preferences.work_end_time || '17:00');
    const lunchStart = this.parseTime(preferences.lunch_break_start || '12:00');
    const lunchEnd = this.parseTime(preferences.lunch_break_end || '13:00');
    
    const totalMinutes = end - start;
    const lunchMinutes = lunchEnd - lunchStart;
    const workMinutes = totalMinutes - lunchMinutes;
    
    return Math.max(workMinutes, 0);
  }

  private calculateScheduleEfficiency(jobs: any[]): number {
    const successfulJobs = jobs.filter(j => !j.scheduling_notes?.includes('⚠️')).length;
    return Math.round((successfulJobs / jobs.length) * 100);
  }

  private getClassificationReason(classification: string, job: any, preferences: any): string {
    switch (classification) {
      case 'emergency':
        return 'Contains emergency keywords or job type - requires immediate response';
      case 'demand':
        return `High priority or within ${preferences.demand_response_time_hours}hr response window`;
      case 'maintenance':
        return 'Routine maintenance job - scheduled within normal timeframe';
      default:
        return 'Standard classification applied';
    }
  }

  private generateSchedulingNotes(job: any, startTime: number, preferences: any): string {
    const notes = [];
    
    if (job.classification === 'emergency') {
      notes.push('Emergency priority');
    }
    
    if (job.score_breakdown?.vip_bonus > 0) {
      notes.push('VIP client');
    }
    
    if (job.estimated_duration && job.estimated_duration > 120) {
      notes.push('Extended duration job');
    }
    
    return notes.length > 0 ? notes.join(', ') : 'Standard scheduling';
  }

  private parseDispatchResponse(content: string, jobs: any[], startTime: number): DispatchOutput {
    // Try to extract JSON from the response
    let parsedResponse;
    try {
      // Look for JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      // Fallback: create a basic prioritized list
      parsedResponse = this.createFallbackDispatchOutput(jobs);
    }

    return {
      prioritized_jobs: parsedResponse.prioritized_jobs || this.createBasicPrioritization(jobs),
      scheduling_constraints: parsedResponse.scheduling_constraints || {
        work_start_time: '08:00',
        work_end_time: '17:00',
        lunch_break_start: '12:00',
        lunch_break_end: '13:00',
        total_work_hours: 8
      },
      recommendations: parsedResponse.recommendations || [],
      agent_reasoning: parsedResponse.agent_reasoning || 'Jobs prioritized by urgency and type',
      execution_time_ms: Date.now() - startTime
    };
  }

  private createBasicPrioritization(jobs: any[]) {
    return jobs
      .sort((a, b) => {
        // Sort by priority: urgent > high > medium > low
        const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
      })
      .map((job, index) => ({
        job_id: job.id,
        priority_rank: index + 1,
        estimated_start_time: new Date(Date.now() + index * 2 * 60 * 60 * 1000).toISOString(),
        estimated_end_time: new Date(Date.now() + (index + 1) * 2 * 60 * 60 * 1000).toISOString(),
        priority_reason: `${job.priority} priority ${job.job_type} job`,
        job_type: job.job_type === 'emergency' ? 'demand' : 'maintenance',
        buffer_time_minutes: job.priority === 'urgent' ? 30 : 15
      }));
  }

  private createFallbackDispatchOutput(jobs: any[]): any {
    return {
      prioritized_jobs: this.createBasicPrioritization(jobs),
      scheduling_constraints: {
        work_start_time: '08:00',
        work_end_time: '17:00',
        lunch_break_start: '12:00',
        lunch_break_end: '13:00',
        total_work_hours: 8
      },
      recommendations: ['Jobs prioritized by urgency level'],
      agent_reasoning: 'Applied basic priority sorting by job urgency and type'
    };
  }
}

/**
 * Route Optimizer Agent
 * Calculates the most time and fuel efficient travel route using advanced constraints
 */
export class RouteOptimizerAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.1,
    });
  }

  async execute(context: AgentContext, dispatchOutput: DispatchOutput): Promise<RouteOutput> {
    const startTime = Date.now();
    
    try {
      // Update daily plan status
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        current_step: 'route'
      });

      // Get user preferences and format for prompt
      const { data: preferences } = await PreferencesService.getUserPreferences(context.userId);
      const formattedPrefs = PreferencesService.formatRouterPreferences(preferences!);
      const injectedPrompt = PreferencesService.injectPreferencesIntoPrompt(ROUTER_PROMPT, formattedPrefs);

      // Fetch job details for routing
      const jobIds = dispatchOutput.prioritized_jobs.map(job => job.job_id);
      const { data: jobs } = await supabase
        .from('job_locations')
        .select('*')
        .eq('user_id', context.userId)
        .in('id', jobIds);

      // Prepare routing data
      const routingJobs = jobs!.map((job, index) => ({
        id: job.id,
        location: [job.longitude, job.latitude],
        timeWindow: [
          Math.floor(new Date(dispatchOutput.prioritized_jobs[index].estimated_start_time).getTime() / 1000),
          Math.floor(new Date(dispatchOutput.prioritized_jobs[index].estimated_end_time).getTime() / 1000)
        ],
        service: job.estimated_duration || 60, // minutes
        priority: index + 1
      }));

      // Call routing tool
      const routingResult = await routingTool.invoke({
        jobs: routingJobs,
        vehicle: {
          id: 'main_vehicle',
          start: [-122.4194, 37.7749], // Default San Francisco
          capacity: [preferences!.parts_capacity_weight_lbs]
        },
        options: {
          minimize: 'time',
          traffic: true
        }
      });

      const result = this.parseRouteResponse(routingResult, jobs!, dispatchOutput, startTime);

      // Save route output to daily plan
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        status: 'route_complete',
        route_output: result,
        total_distance: result.optimized_route.total_distance / 1000, // Convert to km
        total_estimated_duration: result.optimized_route.total_travel_time + result.optimized_route.total_work_time
      });

      return result;
    } catch (error) {
      console.error('Route optimizer error:', error);
      
      // Mark plan as errored
      await DailyPlanService.markDailyPlanError(context.planId, {
        step: 'route',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        retry_suggested: true
      });

      throw error;
    }
  }

  private parseRouteResponse(vroomResult: any, jobs: any[], dispatchOutput: DispatchOutput, startTime: number): RouteOutput {
    const route = vroomResult.routes?.[0];
    if (!route) {
      throw new Error('No route returned from VROOM engine');
    }

    const waypoints = route.steps
      .filter((step: any) => step.type === 'job')
      .map((step: any, index: number) => {
        const job = jobs.find(j => j.id === step.job);
        return {
          job_id: step.job,
          sequence_number: index + 1,
          coordinates: {
            latitude: job?.latitude || step.location[1],
            longitude: job?.longitude || step.location[0]
          },
          arrival_time: new Date(step.arrival * 1000).toISOString(),
          departure_time: new Date((step.arrival + step.duration) * 1000).toISOString(),
          duration_at_location: step.duration,
          travel_time_to_next: index < route.steps.length - 2 ? route.steps[index + 1].arrival - (step.arrival + step.duration) : 0,
          distance_to_next: index < route.steps.length - 2 ? 5000 : 0 // Mock distance in meters
        };
      });

    return {
      optimized_route: {
        waypoints,
        route_geometry: route.geometry || `mock_polyline_${waypoints.length}_waypoints`,
        total_distance: vroomResult.summary?.distance || 50000, // meters
        total_travel_time: vroomResult.summary?.duration || 18000, // seconds
        total_work_time: waypoints.reduce((sum, wp) => sum + wp.duration_at_location, 0)
      },
      agent_reasoning: `Optimized route for ${waypoints.length} jobs using VROOM engine with time windows and vehicle constraints`,
      execution_time_ms: Date.now() - startTime
    };
  }
}

/**
 * Inventory & Prep Specialist Agent
 * Ensures full preparation by analyzing inventory needs and generating shopping lists
 */
export class InventorySpecialistAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.1,
    });
  }

  async execute(context: AgentContext, dispatchOutput: DispatchOutput): Promise<InventoryOutput> {
    const startTime = Date.now();
    
    try {
      // Update daily plan status
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        current_step: 'inventory'
      });

      // Get user preferences and format for prompt
      const { data: preferences } = await PreferencesService.getUserPreferences(context.userId);
      const formattedPrefs = PreferencesService.formatInventoryPreferences(preferences!);
      const injectedPrompt = PreferencesService.injectPreferencesIntoPrompt(INVENTORY_PROMPT, formattedPrefs);

      // Fetch jobs and current inventory
      const jobIds = dispatchOutput.prioritized_jobs.map(job => job.job_id);
      const [jobsResult, inventoryResult] = await Promise.all([
        supabase.from('job_locations').select('*').eq('user_id', context.userId).in('id', jobIds),
        supabase.from('inventory_items').select('*').eq('user_id', context.userId)
      ]);

      const jobs = jobsResult.data || [];
      const inventory = inventoryResult.data || [];

      // Analyze inventory needs
      const result = await this.analyzeInventoryNeeds(jobs, inventory, preferences!, injectedPrompt, startTime);

      // Create hardware store jobs if needed
      if (result.hardware_store_run) {
        const { data: createdJobIds } = await DailyPlanService.createHardwareStoreRunJobs(
          context.userId,
          context.planDate,
          result.hardware_store_run.store_locations
        );
        result.created_hardware_store_jobs = createdJobIds || [];
      }

      // Save inventory output to daily plan
      await DailyPlanService.updateDailyPlan({
        id: context.planId,
        status: 'inventory_complete',
        current_step: 'complete',
        inventory_output: result,
        created_job_ids: result.created_hardware_store_jobs
      });

      return result;
    } catch (error) {
      console.error('Inventory specialist error:', error);
      
      // Mark plan as errored
      await DailyPlanService.markDailyPlanError(context.planId, {
        step: 'inventory',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        retry_suggested: true
      });

      throw error;
    }
  }

  private async analyzeInventoryNeeds(
    jobs: any[], 
    inventory: any[], 
    preferences: any, 
    prompt: string, 
    startTime: number
  ): Promise<InventoryOutput> {
    // Create parts manifest for each job
    const partsManifest = jobs.map(job => ({
      job_id: job.id,
      required_parts: this.getRequiredPartsForJob(job, preferences, inventory)
    }));

    // Generate shopping list from missing parts
    const shoppingList = this.generateShoppingList(partsManifest, preferences);

    // Check supplier availability using mock API
    let hardwareStoreRun = undefined;
    if (shoppingList.length > 0) {
      try {
        const supplierResponse = await mockSupplierAPI.invoke({
          supplier: preferences.primary_supplier.toLowerCase().replace(/\s+/g, '_'),
          items: shoppingList.map(item => ({
            name: item.item_name,
            category: item.category,
            quantity: item.quantity_needed
          })),
          location: {
            latitude: 37.7749, // Default San Francisco - in real app, use user location
            longitude: -122.4194,
            radius_miles: 15
          }
        });

        if (supplierResponse.success && supplierResponse.stores.length > 0) {
          hardwareStoreRun = this.createHardwareStoreRunFromAPI(supplierResponse, shoppingList);
        } else {
          // Fallback to basic hardware store run
          hardwareStoreRun = this.createHardwareStoreRun(shoppingList, preferences);
        }
      } catch (error) {
        console.warn('Mock supplier API failed, using fallback:', error);
        hardwareStoreRun = this.createHardwareStoreRun(shoppingList, preferences);
      }
    }

    // Generate inventory alerts
    const inventoryAlerts = this.generateInventoryAlerts(inventory, preferences);

    return {
      parts_manifest: partsManifest,
      shopping_list: shoppingList,
      hardware_store_run: hardwareStoreRun,
      created_hardware_store_jobs: [], // Will be populated when jobs are created
      inventory_alerts: inventoryAlerts,
      agent_reasoning: `Analyzed ${jobs.length} jobs and ${inventory.length} inventory items. Generated ${shoppingList.length} items for shopping list.${hardwareStoreRun ? ` Found ${hardwareStoreRun.store_locations.length} nearby stores with items in stock.` : ''}`,
      execution_time_ms: Date.now() - startTime
    };
  }

  private getRequiredPartsForJob(job: any, preferences: any, inventory: any[]): any[] {
    // Mock implementation - in real version, this would analyze job requirements
    const mockParts = [
      { inventory_item_id: 'part-1', item_name: 'Pipe Fitting', quantity_needed: 2, unit: 'each', category: 'plumbing' },
      { inventory_item_id: 'part-2', item_name: 'Pipe Sealant', quantity_needed: 1, unit: 'tube', category: 'plumbing' }
    ];

    return mockParts.map(part => {
      const inventoryItem = inventory.find(item => item.name.toLowerCase().includes(part.item_name.toLowerCase()));
      return {
        ...part,
        quantity_available: inventoryItem?.quantity || 0
      };
    });
  }

  private generateShoppingList(partsManifest: any[], preferences: any): any[] {
    const shoppingItems = new Map();

    partsManifest.forEach(manifest => {
      manifest.required_parts.forEach((part: any) => {
        if (part.quantity_needed > part.quantity_available) {
          const needed = part.quantity_needed - part.quantity_available;
          const existing = shoppingItems.get(part.item_name) || { quantity_needed: 0 };
          shoppingItems.set(part.item_name, {
            item_name: part.item_name,
            quantity_needed: existing.quantity_needed + needed,
            unit: part.unit,
            category: part.category,
            preferred_supplier: preferences.primary_supplier,
            estimated_cost: needed * 15, // Mock cost
            priority: part.category === 'emergency' ? 'high' : 'medium'
          });
        }
      });
    });

    return Array.from(shoppingItems.values());
  }

  private createHardwareStoreRun(shoppingList: any[], preferences: any): any {
    return {
      store_locations: [
        {
          store_name: preferences.primary_supplier,
          address: '123 Hardware Street, San Francisco, CA',
          coordinates: { latitude: 37.7849, longitude: -122.4094 },
          estimated_visit_time: 30,
          items_available: shoppingList.map(item => item.item_name)
        }
      ],
      total_estimated_cost: shoppingList.reduce((sum, item) => sum + item.estimated_cost, 0),
      estimated_shopping_time: 30
    };
  }

  private createHardwareStoreRunFromAPI(supplierResponse: any, shoppingList: any[]): any {
    // Map supplier response to hardware store run format
    const storeLocations = supplierResponse.stores.map((store: any) => {
      const availableItems = supplierResponse.items
        .filter((item: any) => item.in_stock)
        .map((item: any) => item.item_name);

      return {
        store_name: store.store_name,
        address: `${store.address}, ${store.city}, ${store.state} ${store.zip_code}`,
        coordinates: store.coordinates,
        estimated_visit_time: Math.max(20, Math.min(60, availableItems.length * 5)), // 5 min per item, min 20, max 60
        items_available: availableItems
      };
    });

    // Calculate total cost from API response
    const totalCost = supplierResponse.items.reduce((sum: number, item: any) => {
      const shoppingItem = shoppingList.find(si => si.item_name === item.item_name);
      const quantity = shoppingItem?.quantity_needed || 1;
      return sum + (item.price * quantity);
    }, 0);

    return {
      store_locations: storeLocations,
      total_estimated_cost: Math.round(totalCost * 100) / 100,
      estimated_shopping_time: storeLocations.reduce((total: number, store: any) => total + store.estimated_visit_time, 0)
    };
  }

  private generateInventoryAlerts(inventory: any[], preferences: any): any[] {
    const alerts = [];

    inventory.forEach(item => {
      if (item.quantity === 0) {
        alerts.push({
          item_name: item.name,
          alert_type: 'out_of_stock',
          message: `${item.name} is out of stock`
        });
      } else if (item.quantity <= preferences.critical_items_min_stock) {
        alerts.push({
          item_name: item.name,
          alert_type: 'low_stock',
          message: `${item.name} is running low (${item.quantity} remaining)`
        });
      }
    });

    return alerts;
  }
}

// Export agent execution functions for use in LangGraph
export async function executeDispatchStrategist(context: AgentContext): Promise<DispatchOutput> {
  const agent = new DispatchStrategistAgent();
  return await agent.execute(context);
}

export async function executeRouteOptimizer(context: AgentContext, dispatchOutput: DispatchOutput): Promise<RouteOutput> {
  const agent = new RouteOptimizerAgent();
  return await agent.execute(context, dispatchOutput);
}

export async function executeInventorySpecialist(context: AgentContext, dispatchOutput: DispatchOutput): Promise<InventoryOutput> {
  const agent = new InventorySpecialistAgent();
  return await agent.execute(context, dispatchOutput);
} 