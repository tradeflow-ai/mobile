-- Migration 007: Add scheduled_start and scheduled_end columns to job_locations
-- These columns store AI-generated scheduled times (different from actual start/end times)
-- Date: 2024-12-19

BEGIN;

-- Add scheduled_start and scheduled_end columns to job_locations table
ALTER TABLE job_locations 
ADD COLUMN scheduled_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN scheduled_end TIMESTAMP WITH TIME ZONE;

-- Add comments to document the column purposes
COMMENT ON COLUMN job_locations.scheduled_start IS 'AI-generated scheduled start time for the job';
COMMENT ON COLUMN job_locations.scheduled_end IS 'AI-generated scheduled end time for the job';

-- Add indexes for scheduling queries
CREATE INDEX IF NOT EXISTS idx_job_locations_scheduled_start 
ON job_locations (user_id, scheduled_start) 
WHERE scheduled_start IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_locations_scheduled_times 
ON job_locations (user_id, scheduled_start, scheduled_end) 
WHERE scheduled_start IS NOT NULL AND scheduled_end IS NOT NULL;

-- Add index for jobs with AI scheduling enabled
CREATE INDEX IF NOT EXISTS idx_job_locations_ai_scheduled 
ON job_locations (user_id, scheduled_start, use_ai_scheduling) 
WHERE use_ai_scheduling = TRUE;

COMMIT; 