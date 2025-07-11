-- Migration: Add AI Scheduling Preference
-- Description: Adds use_ai_scheduling column to job_locations table to store user preference for AI-assisted scheduling
-- Date: 2024-12-19

-- Add use_ai_scheduling column to job_locations table
ALTER TABLE job_locations 
ADD COLUMN use_ai_scheduling BOOLEAN DEFAULT FALSE;

-- Add comment to document the column purpose
COMMENT ON COLUMN job_locations.use_ai_scheduling IS 'Whether AI should automatically select optimal scheduling times for this job';

-- Add index for potential future queries filtering by AI scheduling preference
CREATE INDEX IF NOT EXISTS idx_job_locations_use_ai_scheduling 
ON job_locations (use_ai_scheduling) 
WHERE use_ai_scheduling = TRUE; 