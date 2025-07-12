/**
 * Agent Learning Service - Pattern Recognition and Adaptive Learning
 * 
 * Analyzes user modifications to AI-generated plans and creates learning examples
 * to improve agent performance over time through in-context learning.
 */

import { supabase } from './supabase';

export interface LearnedExamples {
  dispatcher: string[];
  inventory: string[];
}

export interface UserModification {
  job_reordering?: {
    original_order: string[];
    new_order: string[];
    timestamp: string;
  };
  shopping_list_modifications?: {
    added_items: Array<{
      item_name: string;
      quantity: number;
      reason?: string;
    }>;
    removed_items: Array<{
      item_name: string;
      reason?: string;
    }>;
    modified_quantities: Array<{
      item_name: string;
      original_quantity: number;
      new_quantity: number;
      reason?: string;
    }>;
    timestamp: string;
  };
  schedule_adjustments?: {
    time_changes: Array<{
      job_id: string;
      original_time: string;
      new_time: string;
      reason?: string;
    }>;
    timestamp: string;
  };
}

export interface DispatcherPattern {
  pattern_type: 'job_priority' | 'time_preference' | 'sequence_preference';
  pattern_description: string;
  confidence_score: number;
  example_count: number;
  learning_example: string;
}

export interface InventoryPattern {
  pattern_type: 'additional_items' | 'quantity_adjustment' | 'supplier_preference';
  pattern_description: string;
  confidence_score: number;
  example_count: number;
  learning_example: string;
}

export class AgentLearningService {
  private static instance: AgentLearningService;

  private constructor() {}

  static getInstance(): AgentLearningService {
    if (!AgentLearningService.instance) {
      AgentLearningService.instance = new AgentLearningService();
    }
    return AgentLearningService.instance;
  }

  /**
   * Get learned examples for both dispatcher and inventory agents
   * @param userId User ID to analyze patterns for
   * @returns Promise resolving to learned examples for both agents
   */
  async getLearnedExamples(userId: string): Promise<LearnedExamples> {
    try {
      console.log('🧠 Learning Service: Analyzing patterns for user:', userId);

      // Fetch daily plans with user modifications
      const { data: dailyPlans, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', userId)
        .not('user_modifications', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50); // Analyze last 50 plans

      if (error) {
        console.error('❌ Learning Service: Error fetching daily plans:', error);
        return { dispatcher: [], inventory: [] };
      }

      if (!dailyPlans || dailyPlans.length === 0) {
        console.log('📊 Learning Service: No daily plans with modifications found');
        return { dispatcher: [], inventory: [] };
      }

      console.log('📊 Learning Service: Analyzing', dailyPlans.length, 'daily plans');

      // Analyze dispatcher patterns
      const dispatcherPatterns = await this.analyzeDispatcherPatterns(dailyPlans);
      const dispatcherExamples = this.generateDispatcherExamples(dispatcherPatterns);

      // Analyze inventory patterns
      const inventoryPatterns = await this.analyzeInventoryPatterns(dailyPlans);
      const inventoryExamples = this.generateInventoryExamples(inventoryPatterns);

      console.log('🧠 Learning Service: Generated', dispatcherExamples.length, 'dispatcher examples');
      console.log('🧠 Learning Service: Generated', inventoryExamples.length, 'inventory examples');

      return {
        dispatcher: dispatcherExamples,
        inventory: inventoryExamples
      };
    } catch (error) {
      console.error('❌ Learning Service: Error analyzing patterns:', error);
      return { dispatcher: [], inventory: [] };
    }
  }

  /**
   * Analyze dispatcher-related patterns from user modifications
   */
  private async analyzeDispatcherPatterns(dailyPlans: any[]): Promise<DispatcherPattern[]> {
    const patterns: DispatcherPattern[] = [];
    const jobPriorityPatterns = new Map<string, number>();
    const timePreferencePatterns = new Map<string, number>();
    const sequencePatterns = new Map<string, number>();

    for (const plan of dailyPlans) {
      const modifications = plan.user_modifications as UserModification;
      
      if (modifications?.job_reordering) {
        const { original_order, new_order } = modifications.job_reordering;
        
        // Analyze job priority patterns
        this.analyzeJobPriorityChanges(original_order, new_order, jobPriorityPatterns);
        
        // Analyze sequence preferences
        this.analyzeSequencePreferences(original_order, new_order, sequencePatterns);
      }

      if (modifications?.schedule_adjustments) {
        // Analyze time preference patterns
        this.analyzeTimePreferences(modifications.schedule_adjustments, timePreferencePatterns);
      }
    }

    // Convert patterns to learning examples
    patterns.push(...this.createDispatcherPatterns(jobPriorityPatterns, 'job_priority'));
    patterns.push(...this.createDispatcherPatterns(timePreferencePatterns, 'time_preference'));
    patterns.push(...this.createDispatcherPatterns(sequencePatterns, 'sequence_preference'));

    return patterns.filter(pattern => pattern.confidence_score >= 0.6); // Only high-confidence patterns
  }

  /**
   * Analyze inventory-related patterns from user modifications
   */
  private async analyzeInventoryPatterns(dailyPlans: any[]): Promise<InventoryPattern[]> {
    const patterns: InventoryPattern[] = [];
    const additionalItemPatterns = new Map<string, number>();
    const quantityAdjustmentPatterns = new Map<string, number>();
    const supplierPreferencePatterns = new Map<string, number>();

    for (const plan of dailyPlans) {
      const modifications = plan.user_modifications as UserModification;
      
      if (modifications?.shopping_list_modifications) {
        const { added_items, modified_quantities } = modifications.shopping_list_modifications;
        
        // Analyze additional items patterns
        if (added_items) {
          for (const item of added_items) {
            const key = item.item_name.toLowerCase();
            additionalItemPatterns.set(key, (additionalItemPatterns.get(key) || 0) + 1);
          }
        }

        // Analyze quantity adjustment patterns
        if (modified_quantities) {
          for (const adjustment of modified_quantities) {
            const key = `${adjustment.item_name.toLowerCase()}_${adjustment.new_quantity > adjustment.original_quantity ? 'increase' : 'decrease'}`;
            quantityAdjustmentPatterns.set(key, (quantityAdjustmentPatterns.get(key) || 0) + 1);
          }
        }
      }
    }

    // Convert patterns to learning examples
    patterns.push(...this.createInventoryPatterns(additionalItemPatterns, 'additional_items'));
    patterns.push(...this.createInventoryPatterns(quantityAdjustmentPatterns, 'quantity_adjustment'));

    return patterns.filter(pattern => pattern.confidence_score >= 0.6); // Only high-confidence patterns
  }

  /**
   * Analyze job priority changes to identify patterns
   */
  private analyzeJobPriorityChanges(
    originalOrder: string[], 
    newOrder: string[], 
    patterns: Map<string, number>
  ): void {
    // Find jobs that were moved up in priority
    for (let i = 0; i < newOrder.length; i++) {
      const jobId = newOrder[i];
      const originalIndex = originalOrder.indexOf(jobId);
      
      if (originalIndex > i) {
        // Job was moved up - analyze why
        const pattern = this.identifyJobPriorityPattern(jobId);
        if (pattern) {
          patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        }
      }
    }
  }

  /**
   * Identify job priority pattern based on job characteristics
   */
  private identifyJobPriorityPattern(jobId: string): string | null {
    // This would typically query job details, but for now we'll use pattern matching
    if (jobId.includes('leak') || jobId.includes('emergency')) {
      return 'prioritize_leak_emergency';
    }
    if (jobId.includes('inspection')) {
      return 'prioritize_inspection_early';
    }
    if (jobId.includes('maintenance')) {
      return 'prioritize_maintenance_end';
    }
    return null;
  }

  /**
   * Analyze sequence preferences
   */
  private analyzeSequencePreferences(
    originalOrder: string[], 
    newOrder: string[], 
    patterns: Map<string, number>
  ): void {
    // Analyze if user prefers certain job types in sequence
    for (let i = 0; i < newOrder.length - 1; i++) {
      const currentJob = newOrder[i];
      const nextJob = newOrder[i + 1];
      
      const sequence = `${this.getJobType(currentJob)}_before_${this.getJobType(nextJob)}`;
      patterns.set(sequence, (patterns.get(sequence) || 0) + 1);
    }
  }

  /**
   * Analyze time preferences from schedule adjustments
   */
  private analyzeTimePreferences(
    adjustments: any, 
    patterns: Map<string, number>
  ): void {
    for (const change of adjustments.time_changes) {
      const originalHour = parseInt(change.original_time.split(':')[0]);
      const newHour = parseInt(change.new_time.split(':')[0]);
      
      if (newHour < originalHour) {
        patterns.set('prefer_earlier_start', (patterns.get('prefer_earlier_start') || 0) + 1);
      } else if (newHour > originalHour) {
        patterns.set('prefer_later_start', (patterns.get('prefer_later_start') || 0) + 1);
      }
    }
  }

  /**
   * Get job type from job ID (simplified pattern matching)
   */
  private getJobType(jobId: string): string {
    if (jobId.includes('emergency') || jobId.includes('leak')) return 'emergency';
    if (jobId.includes('inspection')) return 'inspection';
    if (jobId.includes('maintenance')) return 'maintenance';
    return 'service';
  }

  /**
   * Create dispatcher patterns from analyzed data
   */
  private createDispatcherPatterns(
    patternMap: Map<string, number>, 
    type: 'job_priority' | 'time_preference' | 'sequence_preference'
  ): DispatcherPattern[] {
    const patterns: DispatcherPattern[] = [];
    const totalModifications = Array.from(patternMap.values()).reduce((sum, count) => sum + count, 0);

    for (const [pattern, count] of patternMap.entries()) {
      const confidenceScore = count / totalModifications;
      
      if (confidenceScore >= 0.3) { // At least 30% occurrence
        patterns.push({
          pattern_type: type,
          pattern_description: pattern,
          confidence_score: confidenceScore,
          example_count: count,
          learning_example: this.generateDispatcherLearningExample(pattern, type)
        });
      }
    }

    return patterns;
  }

  /**
   * Create inventory patterns from analyzed data
   */
  private createInventoryPatterns(
    patternMap: Map<string, number>, 
    type: 'additional_items' | 'quantity_adjustment' | 'supplier_preference'
  ): InventoryPattern[] {
    const patterns: InventoryPattern[] = [];
    const totalModifications = Array.from(patternMap.values()).reduce((sum, count) => sum + count, 0);

    for (const [pattern, count] of patternMap.entries()) {
      const confidenceScore = count / totalModifications;
      
      if (confidenceScore >= 0.3) { // At least 30% occurrence
        patterns.push({
          pattern_type: type,
          pattern_description: pattern,
          confidence_score: confidenceScore,
          example_count: count,
          learning_example: this.generateInventoryLearningExample(pattern, type)
        });
      }
    }

    return patterns;
  }

  /**
   * Generate dispatcher learning examples
   */
  private generateDispatcherLearningExample(pattern: string, type: string): string {
    switch (type) {
      case 'job_priority':
        if (pattern === 'prioritize_leak_emergency') {
          return 'Example: User consistently prioritizes jobs with "leak" or "emergency" in the title, moving them to the top of the schedule regardless of original priority.';
        }
        if (pattern === 'prioritize_inspection_early') {
          return 'Example: User prefers inspection jobs to be scheduled earlier in the day, typically before 11 AM.';
        }
        return `Example: User shows preference for ${pattern} in job prioritization.`;
      
      case 'time_preference':
        if (pattern === 'prefer_earlier_start') {
          return 'Example: User frequently moves start times earlier, preferring to begin work before 8 AM.';
        }
        if (pattern === 'prefer_later_start') {
          return 'Example: User often delays start times, preferring to begin work after 9 AM.';
        }
        return `Example: User shows ${pattern} in scheduling.`;
      
      case 'sequence_preference':
        return `Example: User prefers ${pattern.replace('_', ' ')} job sequencing.`;
      
      default:
        return `Example: User demonstrates ${pattern} pattern.`;
    }
  }

  /**
   * Generate inventory learning examples
   */
  private generateInventoryLearningExample(pattern: string, type: string): string {
    switch (type) {
      case 'additional_items':
        const itemName = pattern.replace(/_/g, ' ');
        return `Example: User frequently adds "${itemName}" to shopping lists. Consider including this item proactively for similar jobs.`;
      
      case 'quantity_adjustment':
        const [item, direction] = pattern.split('_');
        const action = direction === 'increase' ? 'increases' : 'decreases';
        return `Example: User consistently ${action} quantities for "${item.replace(/_/g, ' ')}" items. Adjust default quantities accordingly.`;
      
      case 'supplier_preference':
        return `Example: User shows preference for ${pattern} supplier choices.`;
      
      default:
        return `Example: User demonstrates ${pattern} pattern in inventory management.`;
    }
  }

  /**
   * Generate dispatcher examples from patterns
   */
  private generateDispatcherExamples(patterns: DispatcherPattern[]): string[] {
    return patterns
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5) // Top 5 patterns
      .map(pattern => pattern.learning_example);
  }

  /**
   * Generate inventory examples from patterns
   */
  private generateInventoryExamples(patterns: InventoryPattern[]): string[] {
    return patterns
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5) // Top 5 patterns
      .map(pattern => pattern.learning_example);
  }
}

// Export singleton instance
export const agentLearningService = AgentLearningService.getInstance(); 