-- Migration: Add stuck run warning tracking fields to heartbeat_runs
-- Phase 2: Stuck-Run Warning Mode implementation

ALTER TABLE heartbeat_runs 
ADD COLUMN IF NOT EXISTS stuck_warning_comment_posted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stuck_warning_dismissed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stuck_warning_dismissed_by TEXT;

-- Add index for efficient queries of flagged runs
CREATE INDEX IF NOT EXISTS heartbeat_runs_stuck_warning_idx 
ON heartbeat_runs(company_id, stuck_warning_comment_posted_at, stuck_warning_dismissed_at);
